(function () {
    const FALLBACK = { version: 'missing', skills: {} };

    function getRoot() {
        return window.SkillSpecs || FALLBACK;
    }

    function getSkillSpec(skillId) {
        const root = getRoot();
        if (!skillId) return null;
        return root.skills[skillId] || null;
    }

    function getRecipeSet(skillId) {
        const spec = getSkillSpec(skillId);
        return spec && spec.recipeSet ? spec.recipeSet : null;
    }

    function getNodeTable(skillId) {
        const spec = getSkillSpec(skillId);
        return spec && spec.nodeTable ? spec.nodeTable : null;
    }

    function getEconomyTable(skillId) {
        const spec = getSkillSpec(skillId);
        return spec && spec.economy ? spec.economy : null;
    }

    function getWoodcuttingDemandSummary() {
        const woodcuttingSpec = getSkillSpec('woodcutting') || {};
        const firemakingSpec = getSkillSpec('firemaking') || {};
        const fletchingSpec = getSkillSpec('fletching') || {};

        const nodeTable = woodcuttingSpec.nodeTable && typeof woodcuttingSpec.nodeTable === 'object'
            ? woodcuttingSpec.nodeTable
            : {};
        const canonicalEntries = [];
        const nodeIds = Object.keys(nodeTable);
        for (let i = 0; i < nodeIds.length; i++) {
            const nodeId = nodeIds[i];
            const row = nodeTable[nodeId];
            if (!row || typeof row !== 'object') continue;
            const rewardItemId = typeof row.rewardItemId === 'string' ? row.rewardItemId : '';
            if (!rewardItemId) continue;
            const requiredLevel = Number.isFinite(row.requiredLevel) ? row.requiredLevel : Number.MAX_SAFE_INTEGER;
            canonicalEntries.push({ nodeId, logItemId: rewardItemId, requiredLevel });
        }

        canonicalEntries.sort((a, b) => {
            if (a.requiredLevel !== b.requiredLevel) return a.requiredLevel - b.requiredLevel;
            return a.nodeId.localeCompare(b.nodeId);
        });

        const canonicalLogItemIds = [];
        for (let i = 0; i < canonicalEntries.length; i++) {
            const logItemId = canonicalEntries[i].logItemId;
            if (!canonicalLogItemIds.includes(logItemId)) canonicalLogItemIds.push(logItemId);
        }

        const rowsByLogId = {};
        for (let i = 0; i < canonicalLogItemIds.length; i++) {
            const logItemId = canonicalLogItemIds[i];
            rowsByLogId[logItemId] = {
                logItemId,
                nodeIds: [],
                consumers: {
                    firemaking: [],
                    fletching: []
                }
            };
        }

        for (let i = 0; i < canonicalEntries.length; i++) {
            const entry = canonicalEntries[i];
            const row = rowsByLogId[entry.logItemId];
            if (!row) continue;
            row.nodeIds.push(entry.nodeId);
        }

        const firemakingRecipes = firemakingSpec.recipeSet && typeof firemakingSpec.recipeSet === 'object'
            ? firemakingSpec.recipeSet
            : {};
        const fireRecipeIds = Object.keys(firemakingRecipes);
        for (let i = 0; i < fireRecipeIds.length; i++) {
            const recipeId = fireRecipeIds[i];
            const recipe = firemakingRecipes[recipeId];
            if (!recipe || typeof recipe !== 'object') continue;
            const sourceItemId = typeof recipe.sourceItemId === 'string' ? recipe.sourceItemId : '';
            const row = rowsByLogId[sourceItemId];
            if (!row) continue;
            row.consumers.firemaking.push(recipeId);
        }

        const fletchingRecipes = fletchingSpec.recipeSet && typeof fletchingSpec.recipeSet === 'object'
            ? fletchingSpec.recipeSet
            : {};
        const fletchingRecipeIds = Object.keys(fletchingRecipes);
        for (let i = 0; i < fletchingRecipeIds.length; i++) {
            const recipeId = fletchingRecipeIds[i];
            const recipe = fletchingRecipes[recipeId];
            if (!recipe || typeof recipe !== 'object') continue;
            const sourceLogItemId = typeof recipe.sourceLogItemId === 'string' ? recipe.sourceLogItemId : '';
            if (!sourceLogItemId) continue;
            const inputs = Array.isArray(recipe.inputs) ? recipe.inputs : [];
            const hasMatchingLogInput = inputs.some((input) => input && input.itemId === sourceLogItemId && Number.isFinite(input.amount) && input.amount >= 1);
            if (!hasMatchingLogInput) continue;
            const row = rowsByLogId[sourceLogItemId];
            if (!row) continue;
            row.consumers.fletching.push(recipeId);
        }

        const rows = canonicalLogItemIds.map((logItemId) => rowsByLogId[logItemId]);
        return {
            canonicalLogItemIds,
            rows
        };
    }

    function roundMetric(value) {
        if (!Number.isFinite(value)) return null;
        return Math.round(value * 10000) / 10000;
    }

    function computeGatherSuccessChance(level, toolPower, difficulty) {
        const lvl = Number.isFinite(level) ? level : 1;
        const tool = Number.isFinite(toolPower) ? toolPower : 0;
        const diff = Math.max(1, Number.isFinite(difficulty) ? difficulty : 1);
        const score = Math.max(1, lvl + tool);
        return Math.max(0, Math.min(1, score / (score + diff)));
    }

    function computeIntervalTicks(baseTicks, minimumTicks, speedBonusTicks) {
        const base = Number.isFinite(baseTicks) ? baseTicks : 1;
        const minTicks = Number.isFinite(minimumTicks) ? minimumTicks : 1;
        const bonus = Number.isFinite(speedBonusTicks) ? speedBonusTicks : 0;
        return Math.max(minTicks, base - bonus);
    }

    function computeExpectedDepletingYieldCount(minimumYields, maximumYields, depletionChance) {
        const min = Number.isFinite(minimumYields) ? Math.max(1, Math.floor(minimumYields)) : null;
        const max = Number.isFinite(maximumYields) ? Math.max(min || 1, Math.floor(maximumYields)) : null;
        const chance = Number.isFinite(depletionChance) ? Math.max(0, Math.min(1, depletionChance)) : null;
        if (!Number.isFinite(min) || !Number.isFinite(max) || chance === null) return null;

        let total = min;
        for (let yieldCount = min + 1; yieldCount <= max; yieldCount++) {
            total += Math.pow(1 - chance, yieldCount - min);
        }
        return total;
    }

    function computeSustainedYieldPerTick(activeYieldPerTick, expectedYieldsPerNode, respawnTicks) {
        if (!Number.isFinite(activeYieldPerTick) || activeYieldPerTick <= 0) return 0;
        if (!Number.isFinite(expectedYieldsPerNode) || expectedYieldsPerNode <= 0) return activeYieldPerTick;
        const activeTicksPerNode = expectedYieldsPerNode / activeYieldPerTick;
        return expectedYieldsPerNode / (activeTicksPerNode + Math.max(0, Number.isFinite(respawnTicks) ? respawnTicks : 0));
    }

    function computeWoodcuttingNodeMetrics(nodeId, options = {}) {
        const woodcuttingSpec = getSkillSpec('woodcutting') || {};
        const nodeTable = woodcuttingSpec.nodeTable && typeof woodcuttingSpec.nodeTable === 'object'
            ? woodcuttingSpec.nodeTable
            : {};
        const node = nodeTable[nodeId];
        if (!node || typeof node !== 'object') return null;

        const timing = woodcuttingSpec.timing && typeof woodcuttingSpec.timing === 'object'
            ? woodcuttingSpec.timing
            : {};
        const economy = woodcuttingSpec.economy && typeof woodcuttingSpec.economy === 'object'
            ? woodcuttingSpec.economy
            : {};
        const valueTable = economy.valueTable && typeof economy.valueTable === 'object'
            ? economy.valueTable
            : {};
        const logValueRow = valueTable[node.rewardItemId] && typeof valueTable[node.rewardItemId] === 'object'
            ? valueTable[node.rewardItemId]
            : {};
        const levelBands = Array.isArray(woodcuttingSpec.levelBands) ? woodcuttingSpec.levelBands.filter((value) => Number.isFinite(value)) : [];
        const defaultLevel = levelBands.length > 0 ? Math.max(...levelBands) : 1;

        const level = Number.isFinite(options.level) ? options.level : defaultLevel;
        const toolPower = Number.isFinite(options.toolPower) ? options.toolPower : 28;
        const speedBonusTicks = Number.isFinite(options.speedBonusTicks) ? options.speedBonusTicks : 5;
        const successChance = computeGatherSuccessChance(level, toolPower, node.difficulty);
        const intervalTicks = computeIntervalTicks(timing.baseAttemptTicks, timing.minimumAttemptTicks, speedBonusTicks);
        const activeLogsPerTick = successChance / intervalTicks;
        const sellValue = Number.isFinite(logValueRow.sell) ? logValueRow.sell : 0;
        const activeXpPerTick = activeLogsPerTick * (Number.isFinite(node.xpPerSuccess) ? node.xpPerSuccess : 0);
        const activeGoldPerTick = activeLogsPerTick * sellValue;
        const expectedLogsPerNode = Number.isFinite(node.depletionChance) && node.depletionChance > 0
            ? 1 / node.depletionChance
            : null;
        const activeTicksPerNode = expectedLogsPerNode && activeLogsPerTick > 0
            ? expectedLogsPerNode / activeLogsPerTick
            : null;
        const respawnTicks = Number.isFinite(node.respawnTicks) ? node.respawnTicks : 0;
        const sustainedLogsPerTick = expectedLogsPerNode && activeTicksPerNode !== null
            ? expectedLogsPerNode / (activeTicksPerNode + Math.max(0, respawnTicks))
            : activeLogsPerTick;
        const sustainedXpPerTick = sustainedLogsPerTick * (Number.isFinite(node.xpPerSuccess) ? node.xpPerSuccess : 0);
        const sustainedGoldPerTick = sustainedLogsPerTick * sellValue;

        return {
            nodeId,
            rewardItemId: typeof node.rewardItemId === 'string' ? node.rewardItemId : '',
            requiredLevel: Number.isFinite(node.requiredLevel) ? node.requiredLevel : 1,
            difficulty: Number.isFinite(node.difficulty) ? node.difficulty : 1,
            xpPerSuccess: Number.isFinite(node.xpPerSuccess) ? node.xpPerSuccess : 0,
            sellValue,
            depletionChance: Number.isFinite(node.depletionChance) ? node.depletionChance : null,
            respawnTicks,
            benchmark: {
                level,
                toolPower,
                speedBonusTicks
            },
            successChance: roundMetric(successChance),
            intervalTicks,
            active: {
                logsPerTick: roundMetric(activeLogsPerTick),
                xpPerTick: roundMetric(activeXpPerTick),
                goldPerTick: roundMetric(activeGoldPerTick)
            },
            sustained: {
                logsPerTick: roundMetric(sustainedLogsPerTick),
                xpPerTick: roundMetric(sustainedXpPerTick),
                goldPerTick: roundMetric(sustainedGoldPerTick)
            },
            expectedLogsPerNode: roundMetric(expectedLogsPerNode),
            expectedActiveTicksPerNode: roundMetric(activeTicksPerNode)
        };
    }

    function getWoodcuttingBalanceSummary(options = {}) {
        const woodcuttingSpec = getSkillSpec('woodcutting') || {};
        const nodeTable = woodcuttingSpec.nodeTable && typeof woodcuttingSpec.nodeTable === 'object'
            ? woodcuttingSpec.nodeTable
            : {};
        const levelBands = Array.isArray(woodcuttingSpec.levelBands) ? woodcuttingSpec.levelBands.filter((value) => Number.isFinite(value)) : [];
        const level = Number.isFinite(options.level) ? options.level : (levelBands.length > 0 ? Math.max(...levelBands) : 1);
        const toolPower = Number.isFinite(options.toolPower) ? options.toolPower : 28;
        const speedBonusTicks = Number.isFinite(options.speedBonusTicks) ? options.speedBonusTicks : 5;

        const nodeIds = Object.keys(nodeTable).sort((a, b) => {
            const aLevel = Number.isFinite(nodeTable[a] && nodeTable[a].requiredLevel) ? nodeTable[a].requiredLevel : Number.MAX_SAFE_INTEGER;
            const bLevel = Number.isFinite(nodeTable[b] && nodeTable[b].requiredLevel) ? nodeTable[b].requiredLevel : Number.MAX_SAFE_INTEGER;
            if (aLevel !== bLevel) return aLevel - bLevel;
            return a.localeCompare(b);
        });

        const rows = [];
        for (let i = 0; i < nodeIds.length; i++) {
            const row = computeWoodcuttingNodeMetrics(nodeIds[i], { level, toolPower, speedBonusTicks });
            if (row) rows.push(row);
        }

        return {
            assumptions: {
                level,
                toolPower,
                speedBonusTicks
            },
            rows
        };
    }

    function computeMiningNodeMetrics(nodeId, options = {}) {
        const miningSpec = getSkillSpec('mining') || {};
        const nodeTable = miningSpec.nodeTable && typeof miningSpec.nodeTable === 'object'
            ? miningSpec.nodeTable
            : {};
        const node = nodeTable[nodeId];
        if (!node || typeof node !== 'object') return null;

        const timing = miningSpec.timing && typeof miningSpec.timing === 'object'
            ? miningSpec.timing
            : {};
        const economy = miningSpec.economy && typeof miningSpec.economy === 'object'
            ? miningSpec.economy
            : {};
        const valueTable = economy.valueTable && typeof economy.valueTable === 'object'
            ? economy.valueTable
            : {};
        const rewardValueRow = valueTable[node.rewardItemId] && typeof valueTable[node.rewardItemId] === 'object'
            ? valueTable[node.rewardItemId]
            : {};
        const levelBands = Array.isArray(miningSpec.levelBands) ? miningSpec.levelBands.filter((value) => Number.isFinite(value)) : [];
        const defaultLevel = levelBands.length > 0 ? Math.max(...levelBands) : 1;

        const level = Number.isFinite(options.level) ? options.level : defaultLevel;
        const toolPower = Number.isFinite(options.toolPower) ? options.toolPower : 28;
        const speedBonusTicks = Number.isFinite(options.speedBonusTicks) ? options.speedBonusTicks : 5;
        const successChance = computeGatherSuccessChance(level, toolPower, node.difficulty);
        const intervalTicks = computeIntervalTicks(timing.baseAttemptTicks, timing.minimumAttemptTicks, speedBonusTicks);
        const activeYieldsPerTick = successChance / intervalTicks;
        const sellValue = Number.isFinite(rewardValueRow.sell) ? rewardValueRow.sell : 0;
        const activeXpPerTick = activeYieldsPerTick * (Number.isFinite(node.xpPerSuccess) ? node.xpPerSuccess : 0);
        const activeGoldPerTick = activeYieldsPerTick * sellValue;
        const minimumYields = Number.isFinite(node.minimumYields) ? Math.max(1, Math.floor(node.minimumYields)) : null;
        const maximumYields = Number.isFinite(node.maximumYields) ? Math.max(minimumYields || 1, Math.floor(node.maximumYields)) : null;
        const expectedYieldsPerNode = node.persistent
            ? null
            : computeExpectedDepletingYieldCount(minimumYields, maximumYields, node.depletionChance);
        const respawnTicks = Number.isFinite(node.respawnTicks) ? node.respawnTicks : 0;
        const sustainedYieldsPerTick = computeSustainedYieldPerTick(activeYieldsPerTick, expectedYieldsPerNode, respawnTicks);
        const sustainedXpPerTick = sustainedYieldsPerTick * (Number.isFinite(node.xpPerSuccess) ? node.xpPerSuccess : 0);
        const sustainedGoldPerTick = sustainedYieldsPerTick * sellValue;

        return {
            nodeId,
            rewardItemId: typeof node.rewardItemId === 'string' ? node.rewardItemId : '',
            requiredLevel: Number.isFinite(node.requiredLevel) ? node.requiredLevel : 1,
            difficulty: Number.isFinite(node.difficulty) ? node.difficulty : 1,
            xpPerSuccess: Number.isFinite(node.xpPerSuccess) ? node.xpPerSuccess : 0,
            sellValue,
            minimumYields,
            maximumYields,
            depletionChance: Number.isFinite(node.depletionChance) ? node.depletionChance : null,
            respawnTicks,
            persistent: !!node.persistent,
            benchmark: {
                level,
                toolPower,
                speedBonusTicks
            },
            successChance: roundMetric(successChance),
            intervalTicks,
            active: {
                yieldsPerTick: roundMetric(activeYieldsPerTick),
                xpPerTick: roundMetric(activeXpPerTick),
                goldPerTick: roundMetric(activeGoldPerTick)
            },
            sustained: {
                yieldsPerTick: roundMetric(sustainedYieldsPerTick),
                xpPerTick: roundMetric(sustainedXpPerTick),
                goldPerTick: roundMetric(sustainedGoldPerTick)
            },
            expectedYieldsPerNode: roundMetric(expectedYieldsPerNode)
        };
    }

    function getMiningBalanceSummary(options = {}) {
        const miningSpec = getSkillSpec('mining') || {};
        const nodeTable = miningSpec.nodeTable && typeof miningSpec.nodeTable === 'object'
            ? miningSpec.nodeTable
            : {};
        const levelBands = Array.isArray(miningSpec.levelBands) ? miningSpec.levelBands.filter((value) => Number.isFinite(value)) : [];
        const level = Number.isFinite(options.level) ? options.level : (levelBands.length > 0 ? Math.max(...levelBands) : 1);
        const toolPower = Number.isFinite(options.toolPower) ? options.toolPower : 28;
        const speedBonusTicks = Number.isFinite(options.speedBonusTicks) ? options.speedBonusTicks : 5;
        const order = {
            clay_rock: 0,
            copper_rock: 1,
            tin_rock: 2,
            rune_essence: 3,
            iron_rock: 4,
            coal_rock: 5,
            silver_rock: 6,
            sapphire_rock: 7,
            gold_rock: 8,
            emerald_rock: 9
        };

        const nodeIds = Object.keys(nodeTable).sort((a, b) => {
            const aOrder = Number.isFinite(order[a]) ? order[a] : Number.MAX_SAFE_INTEGER;
            const bOrder = Number.isFinite(order[b]) ? order[b] : Number.MAX_SAFE_INTEGER;
            if (aOrder !== bOrder) return aOrder - bOrder;
            return a.localeCompare(b);
        });

        const rows = [];
        for (let i = 0; i < nodeIds.length; i++) {
            const row = computeMiningNodeMetrics(nodeIds[i], { level, toolPower, speedBonusTicks });
            if (row) rows.push(row);
        }

        return {
            assumptions: {
                level,
                toolPower,
                speedBonusTicks
            },
            rows
        };
    }

    function getFishingMethodFishTable(methodSpec, level) {
        if (!methodSpec || !Array.isArray(methodSpec.fishByLevel)) return [];
        for (let i = 0; i < methodSpec.fishByLevel.length; i++) {
            const band = methodSpec.fishByLevel[i] || {};
            const minLevel = Number.isFinite(band.minLevel) ? band.minLevel : 1;
            const maxLevel = Number.isFinite(band.maxLevel) ? band.maxLevel : Infinity;
            if (level < minLevel || level > maxLevel) continue;
            const fish = Array.isArray(band.fish) ? band.fish : [];
            return fish.filter((row) => row && level >= (Number.isFinite(row.requiredLevel) ? row.requiredLevel : 1));
        }
        return [];
    }

    function resolveFishingMethodCurve(waterSpec, methodSpec) {
        return {
            unlockLevel: Number.isFinite(methodSpec && methodSpec.unlockLevel)
                ? methodSpec.unlockLevel
                : (Number.isFinite(waterSpec && waterSpec.unlockLevel) ? waterSpec.unlockLevel : 1),
            baseCatchChance: Number.isFinite(methodSpec && methodSpec.baseCatchChance)
                ? methodSpec.baseCatchChance
                : (Number.isFinite(waterSpec && waterSpec.baseCatchChance) ? waterSpec.baseCatchChance : 0),
            levelScaling: Number.isFinite(methodSpec && methodSpec.levelScaling)
                ? methodSpec.levelScaling
                : (Number.isFinite(waterSpec && waterSpec.levelScaling) ? waterSpec.levelScaling : 0),
            maxCatchChance: Number.isFinite(methodSpec && methodSpec.maxCatchChance)
                ? methodSpec.maxCatchChance
                : (Number.isFinite(waterSpec && waterSpec.maxCatchChance) ? waterSpec.maxCatchChance : 1)
        };
    }

    function computeFishingMethodMetrics(waterId, methodId, options = {}) {
        const fishingSpec = getSkillSpec('fishing') || {};
        const nodeTable = fishingSpec.nodeTable && typeof fishingSpec.nodeTable === 'object'
            ? fishingSpec.nodeTable
            : {};
        const waterSpec = nodeTable[waterId];
        const methodSpec = waterSpec && waterSpec.methods && typeof waterSpec.methods === 'object'
            ? waterSpec.methods[methodId]
            : null;
        if (!waterSpec || !methodSpec) return null;

        const economy = fishingSpec.economy && typeof fishingSpec.economy === 'object'
            ? fishingSpec.economy
            : {};
        const valueTable = economy.valueTable && typeof economy.valueTable === 'object'
            ? economy.valueTable
            : {};
        const levelBands = Array.isArray(fishingSpec.levelBands) ? fishingSpec.levelBands.filter((value) => Number.isFinite(value)) : [];
        const level = Number.isFinite(options.level) ? options.level : (levelBands.length > 0 ? Math.max(...levelBands) : 1);
        const curve = resolveFishingMethodCurve(waterSpec, methodSpec);
        const fishTable = getFishingMethodFishTable(methodSpec, level);
        const catchChance = computeLinearCatchChance(level, curve.unlockLevel, curve.baseCatchChance, curve.levelScaling, curve.maxCatchChance);

        let totalWeight = 0;
        for (let i = 0; i < fishTable.length; i++) {
            const fish = fishTable[i];
            const weight = Number(fish && fish.weight);
            if (Number.isFinite(weight) && weight > 0) totalWeight += weight;
        }

        const rows = [];
        let activeXpPerTick = 0;
        let activeGoldPerTick = 0;
        for (let i = 0; i < fishTable.length; i++) {
            const fish = fishTable[i] || {};
            const weight = Number(fish.weight);
            if (!Number.isFinite(weight) || weight <= 0 || totalWeight <= 0) continue;
            const valueRow = valueTable[fish.itemId] && typeof valueTable[fish.itemId] === 'object'
                ? valueTable[fish.itemId]
                : {};
            const weightShare = weight / totalWeight;
            const fishCatchChance = catchChance * weightShare;
            const sellValue = Number.isFinite(valueRow.sell) ? valueRow.sell : 0;
            activeXpPerTick += fishCatchChance * (Number.isFinite(fish.xp) ? fish.xp : 0);
            activeGoldPerTick += fishCatchChance * sellValue;
            rows.push({
                itemId: typeof fish.itemId === 'string' ? fish.itemId : '',
                requiredLevel: Number.isFinite(fish.requiredLevel) ? fish.requiredLevel : 1,
                weight,
                weightShare: roundMetric(weightShare),
                xp: Number.isFinite(fish.xp) ? fish.xp : 0,
                sellValue,
                catchChance: roundMetric(fishCatchChance)
            });
        }

        return {
            waterId,
            methodId,
            unlockLevel: curve.unlockLevel,
            baseCatchChance: roundMetric(curve.baseCatchChance),
            levelScaling: roundMetric(curve.levelScaling),
            maxCatchChance: roundMetric(curve.maxCatchChance),
            benchmark: {
                level
            },
            catchChance: roundMetric(catchChance),
            fishTable: rows,
            active: {
                fishPerTick: roundMetric(catchChance),
                xpPerTick: roundMetric(activeXpPerTick),
                goldPerTick: roundMetric(activeGoldPerTick)
            }
        };
    }

    function getFishingBalanceSummary(options = {}) {
        const fishingSpec = getSkillSpec('fishing') || {};
        const nodeTable = fishingSpec.nodeTable && typeof fishingSpec.nodeTable === 'object'
            ? fishingSpec.nodeTable
            : {};
        const levelBands = Array.isArray(fishingSpec.levelBands) ? fishingSpec.levelBands.filter((value) => Number.isFinite(value)) : [];
        const level = Number.isFinite(options.level) ? options.level : (levelBands.length > 0 ? Math.max(...levelBands) : 1);
        const order = {
            net: 0,
            rod: 1,
            harpoon: 2,
            deep_harpoon_mixed: 3,
            deep_rune_harpoon: 4
        };

        const rows = [];
        const waterIds = Object.keys(nodeTable);
        for (let i = 0; i < waterIds.length; i++) {
            const waterId = waterIds[i];
            const methods = nodeTable[waterId] && nodeTable[waterId].methods && typeof nodeTable[waterId].methods === 'object'
                ? nodeTable[waterId].methods
                : {};
            const methodIds = Object.keys(methods);
            for (let j = 0; j < methodIds.length; j++) {
                const row = computeFishingMethodMetrics(waterId, methodIds[j], { level });
                if (row) rows.push(row);
            }
        }

        rows.sort((a, b) => {
            const aOrder = Number.isFinite(order[a.methodId]) ? order[a.methodId] : Number.MAX_SAFE_INTEGER;
            const bOrder = Number.isFinite(order[b.methodId]) ? order[b.methodId] : Number.MAX_SAFE_INTEGER;
            if (aOrder !== bOrder) return aOrder - bOrder;
            if (a.waterId !== b.waterId) return a.waterId.localeCompare(b.waterId);
            return a.methodId.localeCompare(b.methodId);
        });

        return {
            assumptions: {
                level
            },
            rows
        };
    }

    function computeLinearCatchChance(level, unlockLevel, baseChance, scaling, maxChance) {
        const lvl = Number.isFinite(level) ? level : 1;
        const unlock = Number.isFinite(unlockLevel) ? unlockLevel : 1;
        const raw = (Number.isFinite(baseChance) ? baseChance : 0) + ((lvl - unlock) * (Number.isFinite(scaling) ? scaling : 0));
        const cap = Number.isFinite(maxChance) ? maxChance : 1;
        return Math.max(0, Math.min(cap, raw));
    }

    function clamp(value, minValue, maxValue) {
        const next = Number.isFinite(value) ? value : minValue;
        return Math.max(minValue, Math.min(maxValue, next));
    }

    function computeSuccessChanceFromDifficulty(level, difficulty) {
        const lvl = Math.max(1, Number.isFinite(level) ? level : 1);
        const diff = Math.max(1, Number.isFinite(difficulty) ? difficulty : 1);
        return lvl / (lvl + diff);
    }

    function computeCookingBurnChance(level, requiredLevel) {
        const lvl = Number.isFinite(level) ? level : 1;
        const unlock = Number.isFinite(requiredLevel) ? requiredLevel : 1;
        const delta = clamp(lvl - unlock, 0, 30);
        if (delta <= 0) return 0.33;
        if (delta >= 30) return 0;
        const raw = 0.33 - (0.038 * delta) + (0.0018 * delta * delta) - (0.00003 * delta * delta * delta);
        return clamp(raw, 0, 0.33);
    }

    function computeCookingSuccessChance(level, requiredLevel) {
        return 1 - computeCookingBurnChance(level, requiredLevel);
    }

    function computeCookingRecipeMetrics(recipeId, options = {}) {
        const cookingSpec = getSkillSpec('cooking') || {};
        const recipeSet = cookingSpec.recipeSet && typeof cookingSpec.recipeSet === 'object'
            ? cookingSpec.recipeSet
            : {};
        const recipe = recipeSet[recipeId];
        if (!recipe || typeof recipe !== 'object') return null;

        const economy = cookingSpec.economy && typeof cookingSpec.economy === 'object'
            ? cookingSpec.economy
            : {};
        const valueTable = economy.valueTable && typeof economy.valueTable === 'object'
            ? economy.valueTable
            : {};
        const levelBands = Array.isArray(cookingSpec.levelBands) ? cookingSpec.levelBands.filter((value) => Number.isFinite(value)) : [];
        const level = Number.isFinite(options.level) ? options.level : (levelBands.length > 0 ? Math.max(...levelBands) : 1);
        const burnChance = computeCookingBurnChance(level, recipe.requiredLevel);
        const successChance = 1 - burnChance;
        const rawValueRow = valueTable[recipe.sourceItemId] && typeof valueTable[recipe.sourceItemId] === 'object'
            ? valueTable[recipe.sourceItemId]
            : {};
        const cookedValueRow = valueTable[recipe.cookedItemId] && typeof valueTable[recipe.cookedItemId] === 'object'
            ? valueTable[recipe.cookedItemId]
            : {};
        const burntValueRow = valueTable[recipe.burntItemId] && typeof valueTable[recipe.burntItemId] === 'object'
            ? valueTable[recipe.burntItemId]
            : {};
        const rawSellValue = Number.isFinite(rawValueRow.sell) ? rawValueRow.sell : 0;
        const cookedSellValue = Number.isFinite(cookedValueRow.sell) ? cookedValueRow.sell : 0;
        const burntSellValue = Number.isFinite(burntValueRow.sell) ? burntValueRow.sell : 0;

        return {
            recipeId,
            sourceItemId: typeof recipe.sourceItemId === 'string' ? recipe.sourceItemId : '',
            cookedItemId: typeof recipe.cookedItemId === 'string' ? recipe.cookedItemId : '',
            burntItemId: typeof recipe.burntItemId === 'string' ? recipe.burntItemId : '',
            requiredLevel: Number.isFinite(recipe.requiredLevel) ? recipe.requiredLevel : 1,
            xpPerSuccess: Number.isFinite(recipe.xpPerSuccess) ? recipe.xpPerSuccess : 0,
            benchmark: {
                level
            },
            successChance: roundMetric(successChance),
            burnChance: roundMetric(burnChance),
            sellValues: {
                raw: rawSellValue,
                cooked: cookedSellValue,
                burnt: burntSellValue
            },
            expected: {
                cookedPerAction: roundMetric(successChance),
                xpPerAction: roundMetric(successChance * (Number.isFinite(recipe.xpPerSuccess) ? recipe.xpPerSuccess : 0)),
                goldDeltaPerAction: roundMetric((successChance * cookedSellValue) + (burnChance * burntSellValue) - rawSellValue)
            }
        };
    }

    function findCookingBreakEvenLevel(recipeId) {
        const cookingSpec = getSkillSpec('cooking') || {};
        const recipeSet = cookingSpec.recipeSet && typeof cookingSpec.recipeSet === 'object'
            ? cookingSpec.recipeSet
            : {};
        const recipe = recipeSet[recipeId];
        if (!recipe || typeof recipe !== 'object') return null;

        for (let level = recipe.requiredLevel; level <= 99; level++) {
            const metrics = computeCookingRecipeMetrics(recipeId, { level });
            if (metrics && Number.isFinite(metrics.expected.goldDeltaPerAction) && metrics.expected.goldDeltaPerAction >= 0) {
                return level;
            }
        }
        return null;
    }

    function getCookingBalanceSummary(options = {}) {
        const cookingSpec = getSkillSpec('cooking') || {};
        const recipeSet = cookingSpec.recipeSet && typeof cookingSpec.recipeSet === 'object'
            ? cookingSpec.recipeSet
            : {};
        const levelBands = Array.isArray(cookingSpec.levelBands) ? cookingSpec.levelBands.filter((value) => Number.isFinite(value)) : [];
        const level = Number.isFinite(options.level) ? options.level : (levelBands.length > 0 ? Math.max(...levelBands) : 1);

        const recipeIds = Object.keys(recipeSet).sort((a, b) => {
            const aLevel = Number.isFinite(recipeSet[a] && recipeSet[a].requiredLevel) ? recipeSet[a].requiredLevel : Number.MAX_SAFE_INTEGER;
            const bLevel = Number.isFinite(recipeSet[b] && recipeSet[b].requiredLevel) ? recipeSet[b].requiredLevel : Number.MAX_SAFE_INTEGER;
            if (aLevel !== bLevel) return aLevel - bLevel;
            return a.localeCompare(b);
        });

        const rows = [];
        for (let i = 0; i < recipeIds.length; i++) {
            const row = computeCookingRecipeMetrics(recipeIds[i], { level });
            if (!row) continue;
            row.breakEvenLevel = findCookingBreakEvenLevel(recipeIds[i]);
            rows.push(row);
        }

        return {
            assumptions: {
                level
            },
            rows
        };
    }

    function resolveWoodcuttingBenchmarkOptions(options = {}) {
        const woodcuttingSpec = getSkillSpec('woodcutting') || {};
        const levelBands = Array.isArray(woodcuttingSpec.levelBands) ? woodcuttingSpec.levelBands.filter((value) => Number.isFinite(value)) : [];
        return {
            level: Number.isFinite(options.level) ? options.level : (levelBands.length > 0 ? Math.max(...levelBands) : 1),
            toolPower: Number.isFinite(options.toolPower) ? options.toolPower : 28,
            speedBonusTicks: Number.isFinite(options.speedBonusTicks) ? options.speedBonusTicks : 5
        };
    }

    function findWoodcuttingNodeIdByLogItemId(logItemId) {
        const woodcuttingSpec = getSkillSpec('woodcutting') || {};
        const nodeTable = woodcuttingSpec.nodeTable && typeof woodcuttingSpec.nodeTable === 'object'
            ? woodcuttingSpec.nodeTable
            : {};
        const nodeIds = Object.keys(nodeTable);
        for (let i = 0; i < nodeIds.length; i++) {
            const nodeId = nodeIds[i];
            const node = nodeTable[nodeId];
            if (!node || typeof node !== 'object') continue;
            if (node.rewardItemId === logItemId) return nodeId;
        }
        return null;
    }

    function computeFiremakingRecipeMetrics(recipeId, options = {}) {
        const firemakingSpec = getSkillSpec('firemaking') || {};
        const recipeSet = firemakingSpec.recipeSet && typeof firemakingSpec.recipeSet === 'object'
            ? firemakingSpec.recipeSet
            : {};
        const recipe = recipeSet[recipeId];
        if (!recipe || typeof recipe !== 'object') return null;

        const levelBands = Array.isArray(firemakingSpec.levelBands) ? firemakingSpec.levelBands.filter((value) => Number.isFinite(value)) : [];
        const timing = firemakingSpec.timing && typeof firemakingSpec.timing === 'object'
            ? firemakingSpec.timing
            : {};
        const economy = firemakingSpec.economy && typeof firemakingSpec.economy === 'object'
            ? firemakingSpec.economy
            : {};
        const valueTable = economy.valueTable && typeof economy.valueTable === 'object'
            ? economy.valueTable
            : {};
        const cookingSpec = getSkillSpec('cooking') || {};
        const cookingTiming = cookingSpec.timing && typeof cookingSpec.timing === 'object'
            ? cookingSpec.timing
            : {};

        const level = Number.isFinite(options.level) ? options.level : (levelBands.length > 0 ? Math.max(...levelBands) : 1);
        const ignitionAttemptTicks = Number.isFinite(timing.ignitionAttemptTicks) ? timing.ignitionAttemptTicks : 1;
        const cookingActionTicks = Number.isFinite(options.cookingActionTicks)
            ? options.cookingActionTicks
            : (Number.isFinite(cookingTiming.actionTicks) ? cookingTiming.actionTicks : 1);
        const successChance = computeSuccessChanceFromDifficulty(level, recipe.ignitionDifficulty);
        const expectedAttemptsPerSuccess = successChance > 0 ? 1 / successChance : null;
        const expectedTicksPerSuccess = expectedAttemptsPerSuccess === null ? null : expectedAttemptsPerSuccess * ignitionAttemptTicks;
        const logsConsumedPerTick = expectedTicksPerSuccess && expectedTicksPerSuccess > 0 ? 1 / expectedTicksPerSuccess : 0;
        const xpPerTick = logsConsumedPerTick * (Number.isFinite(recipe.xpPerSuccess) ? recipe.xpPerSuccess : 0);
        const logValueRow = valueTable[recipe.sourceItemId] && typeof valueTable[recipe.sourceItemId] === 'object'
            ? valueTable[recipe.sourceItemId]
            : {};
        const logSellValue = Number.isFinite(logValueRow.sell) ? logValueRow.sell : 0;
        const goldSinkPerTick = logsConsumedPerTick * logSellValue;
        const cookingActionsPerFire = cookingActionTicks > 0 && Number.isFinite(recipe.fireLifetimeTicks)
            ? recipe.fireLifetimeTicks / cookingActionTicks
            : null;

        const woodcuttingSpec = getSkillSpec('woodcutting') || {};
        const woodcuttingNodeTable = woodcuttingSpec.nodeTable && typeof woodcuttingSpec.nodeTable === 'object'
            ? woodcuttingSpec.nodeTable
            : {};
        const woodcuttingTiming = woodcuttingSpec.timing && typeof woodcuttingSpec.timing === 'object'
            ? woodcuttingSpec.timing
            : {};
        const woodcuttingBenchmark = resolveWoodcuttingBenchmarkOptions(options.woodcuttingBenchmark || {});
        const woodcuttingNodeId = findWoodcuttingNodeIdByLogItemId(recipe.sourceItemId);
        const woodcuttingNode = woodcuttingNodeId ? woodcuttingNodeTable[woodcuttingNodeId] : null;
        const woodcuttingMetrics = woodcuttingNodeId
            ? computeWoodcuttingNodeMetrics(woodcuttingNodeId, woodcuttingBenchmark)
            : null;
        const rawWoodcuttingSuccessChance = woodcuttingNode
            ? computeGatherSuccessChance(woodcuttingBenchmark.level, woodcuttingBenchmark.toolPower, woodcuttingNode.difficulty)
            : null;
        const rawWoodcuttingIntervalTicks = woodcuttingNode
            ? computeIntervalTicks(woodcuttingTiming.baseAttemptTicks, woodcuttingTiming.minimumAttemptTicks, woodcuttingBenchmark.speedBonusTicks)
            : null;
        const rawActiveLogsPerTick = rawWoodcuttingSuccessChance !== null && rawWoodcuttingIntervalTicks && rawWoodcuttingIntervalTicks > 0
            ? rawWoodcuttingSuccessChance / rawWoodcuttingIntervalTicks
            : null;
        const rawExpectedLogsPerNode = woodcuttingNode && Number.isFinite(woodcuttingNode.depletionChance) && woodcuttingNode.depletionChance > 0
            ? 1 / woodcuttingNode.depletionChance
            : null;
        const rawActiveTicksPerNode = rawExpectedLogsPerNode && rawActiveLogsPerTick && rawActiveLogsPerTick > 0
            ? rawExpectedLogsPerNode / rawActiveLogsPerTick
            : null;
        const rawSustainedLogsPerTick = rawExpectedLogsPerNode && rawActiveTicksPerNode !== null
            ? rawExpectedLogsPerNode / (rawActiveTicksPerNode + Math.max(0, Number.isFinite(woodcuttingNode.respawnTicks) ? woodcuttingNode.respawnTicks : 0))
            : rawActiveLogsPerTick;
        const activeCoverageRatio = rawActiveLogsPerTick !== null && logsConsumedPerTick > 0
            ? roundMetric(rawActiveLogsPerTick / logsConsumedPerTick)
            : null;
        const sustainedCoverageRatio = rawSustainedLogsPerTick !== null && logsConsumedPerTick > 0
            ? roundMetric(rawSustainedLogsPerTick / logsConsumedPerTick)
            : null;

        return {
            recipeId,
            sourceItemId: typeof recipe.sourceItemId === 'string' ? recipe.sourceItemId : '',
            requiredLevel: Number.isFinite(recipe.requiredLevel) ? recipe.requiredLevel : 1,
            ignitionDifficulty: Number.isFinite(recipe.ignitionDifficulty) ? recipe.ignitionDifficulty : 1,
            xpPerSuccess: Number.isFinite(recipe.xpPerSuccess) ? recipe.xpPerSuccess : 0,
            fireLifetimeTicks: Number.isFinite(recipe.fireLifetimeTicks) ? recipe.fireLifetimeTicks : 0,
            benchmark: {
                level,
                ignitionAttemptTicks,
                cookingActionTicks,
                woodcuttingBenchmark
            },
            successChance: roundMetric(successChance),
            expectedAttemptsPerSuccess: roundMetric(expectedAttemptsPerSuccess),
            expectedTicksPerSuccess: roundMetric(expectedTicksPerSuccess),
            burnRate: {
                logsConsumedPerTick: roundMetric(logsConsumedPerTick),
                xpPerTick: roundMetric(xpPerTick),
                goldSinkPerTick: roundMetric(goldSinkPerTick),
                logSellValue
            },
            cookingSupport: {
                actionsPerFire: roundMetric(cookingActionsPerFire)
            },
            woodcuttingSupply: woodcuttingMetrics ? {
                nodeId: woodcuttingNodeId,
                activeLogsPerTick: woodcuttingMetrics.active ? woodcuttingMetrics.active.logsPerTick : null,
                sustainedLogsPerTick: woodcuttingMetrics.sustained ? woodcuttingMetrics.sustained.logsPerTick : null,
                activeCoverageRatio,
                sustainedCoverageRatio
            } : null
        };
    }

    function getFiremakingBalanceSummary(options = {}) {
        const firemakingSpec = getSkillSpec('firemaking') || {};
        const recipeSet = firemakingSpec.recipeSet && typeof firemakingSpec.recipeSet === 'object'
            ? firemakingSpec.recipeSet
            : {};
        const levelBands = Array.isArray(firemakingSpec.levelBands) ? firemakingSpec.levelBands.filter((value) => Number.isFinite(value)) : [];
        const cookingSpec = getSkillSpec('cooking') || {};
        const cookingTiming = cookingSpec.timing && typeof cookingSpec.timing === 'object'
            ? cookingSpec.timing
            : {};
        const level = Number.isFinite(options.level) ? options.level : (levelBands.length > 0 ? Math.max(...levelBands) : 1);
        const ignitionAttemptTicks = Number.isFinite(firemakingSpec.timing && firemakingSpec.timing.ignitionAttemptTicks)
            ? firemakingSpec.timing.ignitionAttemptTicks
            : 1;
        const cookingActionTicks = Number.isFinite(options.cookingActionTicks)
            ? options.cookingActionTicks
            : (Number.isFinite(cookingTiming.actionTicks) ? cookingTiming.actionTicks : 1);
        const woodcuttingBenchmark = resolveWoodcuttingBenchmarkOptions(options.woodcuttingBenchmark || {});

        const recipeIds = Object.keys(recipeSet).sort((a, b) => {
            const aLevel = Number.isFinite(recipeSet[a] && recipeSet[a].requiredLevel) ? recipeSet[a].requiredLevel : Number.MAX_SAFE_INTEGER;
            const bLevel = Number.isFinite(recipeSet[b] && recipeSet[b].requiredLevel) ? recipeSet[b].requiredLevel : Number.MAX_SAFE_INTEGER;
            if (aLevel !== bLevel) return aLevel - bLevel;
            return a.localeCompare(b);
        });

        const rows = [];
        for (let i = 0; i < recipeIds.length; i++) {
            const row = computeFiremakingRecipeMetrics(recipeIds[i], {
                level,
                cookingActionTicks,
                woodcuttingBenchmark
            });
            if (row) rows.push(row);
        }

        return {
            assumptions: {
                level,
                ignitionAttemptTicks,
                cookingActionTicks,
                woodcuttingBenchmark
            },
            rows
        };
    }

    function computeCraftingRecipeMetrics(recipeId) {
        const craftingSpec = getSkillSpec('crafting') || {};
        const recipeSet = craftingSpec.recipeSet && typeof craftingSpec.recipeSet === 'object'
            ? craftingSpec.recipeSet
            : {};
        const recipe = recipeSet[recipeId];
        if (!recipe || typeof recipe !== 'object') return null;

        const economy = craftingSpec.economy && typeof craftingSpec.economy === 'object'
            ? craftingSpec.economy
            : {};
        const valueTable = economy.valueTable && typeof economy.valueTable === 'object'
            ? economy.valueTable
            : {};
        const outputItemId = recipe.output && typeof recipe.output.itemId === 'string'
            ? recipe.output.itemId
            : '';
        const outputAmount = Number.isFinite(recipe.output && recipe.output.amount)
            ? recipe.output.amount
            : 1;
        const valueRow = outputItemId && valueTable[outputItemId] && typeof valueTable[outputItemId] === 'object'
            ? valueTable[outputItemId]
            : {};
        const sellValuePerUnit = Number.isFinite(valueRow.sell) ? valueRow.sell : null;
        const sellValuePerAction = sellValuePerUnit === null ? null : sellValuePerUnit * outputAmount;
        const actionTicks = Number.isFinite(recipe.actionTicks)
            ? recipe.actionTicks
            : (Number.isFinite(craftingSpec.timing && craftingSpec.timing.actionTicks) ? craftingSpec.timing.actionTicks : 1);
        const xpPerAction = Number.isFinite(recipe.xpPerAction) ? recipe.xpPerAction : 0;

        return {
            recipeId,
            recipeFamily: typeof recipe.recipeFamily === 'string' ? recipe.recipeFamily : '',
            requiredLevel: Number.isFinite(recipe.requiredLevel) ? recipe.requiredLevel : 1,
            actionTicks,
            output: {
                itemId: outputItemId,
                amount: outputAmount,
                sellValuePerUnit,
                sellValuePerAction
            },
            throughput: {
                xpPerAction,
                sellValuePerAction,
                xpPerTick: roundMetric(actionTicks > 0 ? xpPerAction / actionTicks : 0),
                sellValuePerTick: sellValuePerAction === null || actionTicks <= 0
                    ? null
                    : roundMetric(sellValuePerAction / actionTicks)
            }
        };
    }

    function getCraftingBalanceSummary() {
        const craftingSpec = getSkillSpec('crafting') || {};
        const recipeSet = craftingSpec.recipeSet && typeof craftingSpec.recipeSet === 'object'
            ? craftingSpec.recipeSet
            : {};
        const familyOrder = {
            soft_clay: 0,
            mould_imprint: 1,
            mould_firing: 2,
            strapped_handle: 3,
            tool_weapon_assembly: 4,
            gem_cutting: 5,
            jewelry_gem_attachment: 6,
            staff_attachment: 7
        };
        const recipeIds = Object.keys(recipeSet).sort((a, b) => {
            const aRecipe = recipeSet[a] || {};
            const bRecipe = recipeSet[b] || {};
            const aLevel = Number.isFinite(aRecipe.requiredLevel) ? aRecipe.requiredLevel : Number.MAX_SAFE_INTEGER;
            const bLevel = Number.isFinite(bRecipe.requiredLevel) ? bRecipe.requiredLevel : Number.MAX_SAFE_INTEGER;
            if (aLevel !== bLevel) return aLevel - bLevel;
            const aFamily = Number.isFinite(familyOrder[aRecipe.recipeFamily]) ? familyOrder[aRecipe.recipeFamily] : Number.MAX_SAFE_INTEGER;
            const bFamily = Number.isFinite(familyOrder[bRecipe.recipeFamily]) ? familyOrder[bRecipe.recipeFamily] : Number.MAX_SAFE_INTEGER;
            if (aFamily !== bFamily) return aFamily - bFamily;
            return a.localeCompare(b);
        });

        const rows = [];
        for (let i = 0; i < recipeIds.length; i++) {
            const row = computeCraftingRecipeMetrics(recipeIds[i]);
            if (row) rows.push(row);
        }

        return {
            assumptions: {
                actionTicks: Number.isFinite(craftingSpec.timing && craftingSpec.timing.actionTicks)
                    ? craftingSpec.timing.actionTicks
                    : null
            },
            rows
        };
    }

    function resolveSmithingItemSellValue(valueTable, itemDefs, itemId) {
        if (!itemId) return null;
        const valueRow = valueTable[itemId];
        if (valueRow && typeof valueRow === 'object' && Number.isFinite(valueRow.sell)) {
            return Math.max(0, Math.floor(valueRow.sell));
        }
        if (itemDefs && itemDefs[itemId] && Number.isFinite(itemDefs[itemId].value)) {
            return Math.max(0, Math.floor(itemDefs[itemId].value));
        }
        return null;
    }

    function getSmithingRecipeFamily(recipe) {
        if (!recipe || typeof recipe !== 'object') return '';
        const outputItemId = recipe.output && typeof recipe.output.itemId === 'string'
            ? recipe.output.itemId
            : '';
        if (Array.isArray(recipe.requiredMouldIds) && recipe.requiredMouldIds.length > 0) return 'jewelry_base';
        if (/_bar$/.test(outputItemId)) return 'smelting';
        if (/_arrowheads$/.test(outputItemId)) return 'ammunition';
        if (/_sword_blade$/.test(outputItemId) || /_(axe_head|pickaxe_head)$/.test(outputItemId)) return 'assembly_part';
        return 'armor';
    }

    function computeSmithingRecipeMetrics(recipeId) {
        const smithingSpec = getSkillSpec('smithing') || {};
        const recipeSet = smithingSpec.recipeSet && typeof smithingSpec.recipeSet === 'object'
            ? smithingSpec.recipeSet
            : {};
        const recipe = recipeSet[recipeId];
        if (!recipe || typeof recipe !== 'object') return null;

        const economy = smithingSpec.economy && typeof smithingSpec.economy === 'object'
            ? smithingSpec.economy
            : {};
        const valueTable = economy.valueTable && typeof economy.valueTable === 'object'
            ? economy.valueTable
            : {};
        const itemDefs = window.ItemCatalog && window.ItemCatalog.ITEM_DEFS && typeof window.ItemCatalog.ITEM_DEFS === 'object'
            ? window.ItemCatalog.ITEM_DEFS
            : null;
        const outputItemId = recipe.output && typeof recipe.output.itemId === 'string'
            ? recipe.output.itemId
            : '';
        const outputAmount = Number.isFinite(recipe.output && recipe.output.amount)
            ? Math.max(1, Math.floor(recipe.output.amount))
            : 1;
        const actionTicks = Number.isFinite(recipe.actionTicks)
            ? recipe.actionTicks
            : (Number.isFinite(smithingSpec.timing && smithingSpec.timing.actionTicks) ? smithingSpec.timing.actionTicks : 1);
        const xpPerAction = Number.isFinite(recipe.xpPerAction) ? recipe.xpPerAction : 0;
        const outputSellValuePerUnit = resolveSmithingItemSellValue(valueTable, itemDefs, outputItemId);
        const outputSellValuePerAction = outputSellValuePerUnit === null
            ? null
            : outputSellValuePerUnit * outputAmount;
        const inputs = Array.isArray(recipe.inputs) ? recipe.inputs : [];
        const inputRows = inputs.map((input) => {
            const itemId = input && typeof input.itemId === 'string' ? input.itemId : '';
            const amount = Number.isFinite(input && input.amount) ? Math.max(0, Math.floor(input.amount)) : 0;
            const sellValuePerUnit = resolveSmithingItemSellValue(valueTable, itemDefs, itemId);
            return {
                itemId,
                amount,
                sellValuePerUnit,
                sellValuePerAction: sellValuePerUnit === null ? null : sellValuePerUnit * amount
            };
        });
        const inputSellValuePerAction = inputRows.some((row) => row.sellValuePerAction === null)
            ? null
            : inputRows.reduce((sum, row) => sum + row.sellValuePerAction, 0);
        const valueDeltaPerAction = outputSellValuePerAction === null || inputSellValuePerAction === null
            ? null
            : outputSellValuePerAction - inputSellValuePerAction;

        return {
            recipeId,
            recipeFamily: getSmithingRecipeFamily(recipe),
            requiredLevel: Number.isFinite(recipe.requiredLevel) ? recipe.requiredLevel : 1,
            actionTicks,
            output: {
                itemId: outputItemId,
                amount: outputAmount,
                sellValuePerUnit: outputSellValuePerUnit,
                sellValuePerAction: outputSellValuePerAction
            },
            inputs: inputRows,
            throughput: {
                outputPerAction: outputAmount,
                inputSellValuePerAction,
                outputSellValuePerAction,
                valueDeltaPerAction,
                xpPerAction,
                outputPerTick: roundMetric(actionTicks > 0 ? outputAmount / actionTicks : 0),
                xpPerTick: roundMetric(actionTicks > 0 ? xpPerAction / actionTicks : 0),
                outputSellValuePerTick: outputSellValuePerAction === null || actionTicks <= 0
                    ? null
                    : roundMetric(outputSellValuePerAction / actionTicks),
                valueDeltaPerTick: valueDeltaPerAction === null || actionTicks <= 0
                    ? null
                    : roundMetric(valueDeltaPerAction / actionTicks)
            }
        };
    }

    function getSmithingBalanceSummary() {
        const smithingSpec = getSkillSpec('smithing') || {};
        const recipeSet = smithingSpec.recipeSet && typeof smithingSpec.recipeSet === 'object'
            ? smithingSpec.recipeSet
            : {};
        const familyOrder = {
            smelting: 0,
            jewelry_base: 1,
            assembly_part: 2,
            ammunition: 3,
            armor: 4
        };
        const recipeIds = Object.keys(recipeSet).sort((a, b) => {
            const aRecipe = recipeSet[a] || {};
            const bRecipe = recipeSet[b] || {};
            const aLevel = Number.isFinite(aRecipe.requiredLevel) ? aRecipe.requiredLevel : Number.MAX_SAFE_INTEGER;
            const bLevel = Number.isFinite(bRecipe.requiredLevel) ? bRecipe.requiredLevel : Number.MAX_SAFE_INTEGER;
            if (aLevel !== bLevel) return aLevel - bLevel;
            const aFamily = familyOrder[getSmithingRecipeFamily(aRecipe)];
            const bFamily = familyOrder[getSmithingRecipeFamily(bRecipe)];
            const aOrder = Number.isFinite(aFamily) ? aFamily : Number.MAX_SAFE_INTEGER;
            const bOrder = Number.isFinite(bFamily) ? bFamily : Number.MAX_SAFE_INTEGER;
            if (aOrder !== bOrder) return aOrder - bOrder;
            return a.localeCompare(b);
        });

        const rows = [];
        for (let i = 0; i < recipeIds.length; i++) {
            const row = computeSmithingRecipeMetrics(recipeIds[i]);
            if (row) rows.push(row);
        }

        return {
            assumptions: {
                actionTicks: Number.isFinite(smithingSpec.timing && smithingSpec.timing.actionTicks)
                    ? smithingSpec.timing.actionTicks
                    : null
            },
            rows
        };
    }

    function getRunecraftingEconomySummary() {
        const runecraftingSpec = getSkillSpec('runecrafting') || {};
        const economy = runecraftingSpec.economy && typeof runecraftingSpec.economy === 'object'
            ? runecraftingSpec.economy
            : {};
        const valueTable = economy.valueTable && typeof economy.valueTable === 'object'
            ? economy.valueTable
            : {};
        const merchantTable = economy.merchantTable && typeof economy.merchantTable === 'object'
            ? economy.merchantTable
            : {};
        const pouchTable = runecraftingSpec.pouchTable && typeof runecraftingSpec.pouchTable === 'object'
            ? runecraftingSpec.pouchTable
            : {};
        const itemDefs = window.ItemCatalog && window.ItemCatalog.ITEM_DEFS && typeof window.ItemCatalog.ITEM_DEFS === 'object'
            ? window.ItemCatalog.ITEM_DEFS
            : null;
        const valueOrder = {
            rune_essence: 0,
            ember_rune: 1,
            water_rune: 2,
            earth_rune: 3,
            air_rune: 4,
            steam_rune: 5,
            smoke_rune: 6,
            lava_rune: 7,
            mud_rune: 8,
            mist_rune: 9,
            dust_rune: 10,
            small_pouch: 11,
            medium_pouch: 12,
            large_pouch: 13
        };
        const merchantOrder = {
            rune_tutor: 0,
            combination_sage: 1
        };

        const valueRows = Object.keys(valueTable).sort((a, b) => {
            const aOrder = Number.isFinite(valueOrder[a]) ? valueOrder[a] : Number.MAX_SAFE_INTEGER;
            const bOrder = Number.isFinite(valueOrder[b]) ? valueOrder[b] : Number.MAX_SAFE_INTEGER;
            if (aOrder !== bOrder) return aOrder - bOrder;
            return a.localeCompare(b);
        }).map((itemId) => {
            const row = valueTable[itemId] || {};
            const itemValue = itemDefs && itemDefs[itemId] && Number.isFinite(itemDefs[itemId].value)
                ? Math.max(0, Math.floor(itemDefs[itemId].value))
                : null;
            return {
                itemId,
                buy: Number.isFinite(row.buy) ? Math.max(0, Math.floor(row.buy)) : null,
                sell: Number.isFinite(row.sell) ? Math.max(0, Math.floor(row.sell)) : null,
                itemValue,
                buyMatchesItemValue: itemValue === null || !Number.isFinite(row.buy)
                    ? null
                    : itemValue === Math.max(0, Math.floor(row.buy))
            };
        });

        const merchants = Object.keys(merchantTable).sort((a, b) => {
            const aOrder = Number.isFinite(merchantOrder[a]) ? merchantOrder[a] : Number.MAX_SAFE_INTEGER;
            const bOrder = Number.isFinite(merchantOrder[b]) ? merchantOrder[b] : Number.MAX_SAFE_INTEGER;
            if (aOrder !== bOrder) return aOrder - bOrder;
            return a.localeCompare(b);
        }).map((merchantId) => {
            const config = merchantTable[merchantId] || {};
            const rawPouchUnlocks = config.pouchUnlocks && typeof config.pouchUnlocks === 'object'
                ? config.pouchUnlocks
                : {};
            const pouchUnlocks = Object.keys(rawPouchUnlocks).sort((a, b) => {
                const aLevel = Number.isFinite(rawPouchUnlocks[a]) ? rawPouchUnlocks[a] : Number.MAX_SAFE_INTEGER;
                const bLevel = Number.isFinite(rawPouchUnlocks[b]) ? rawPouchUnlocks[b] : Number.MAX_SAFE_INTEGER;
                if (aLevel !== bLevel) return aLevel - bLevel;
                return a.localeCompare(b);
            }).map((itemId) => {
                const unlockLevel = Number.isFinite(rawPouchUnlocks[itemId]) ? Math.max(1, Math.floor(rawPouchUnlocks[itemId])) : null;
                const pouchRequiredLevel = Number.isFinite(pouchTable[itemId] && pouchTable[itemId].requiredLevel)
                    ? Math.max(1, Math.floor(pouchTable[itemId].requiredLevel))
                    : null;
                return {
                    itemId,
                    unlockLevel,
                    pouchRequiredLevel,
                    matchesPouchLevel: unlockLevel === null || pouchRequiredLevel === null ? null : unlockLevel === pouchRequiredLevel
                };
            });
            return {
                merchantId,
                strictBuys: !!config.strictBuys,
                buys: Array.isArray(config.buys) ? config.buys.slice() : [],
                sells: Array.isArray(config.sells) ? config.sells.slice() : [],
                pouchUnlocks
            };
        });

        return {
            valueRows,
            merchants
        };
    }

    function getRunecraftingIntegrationSummary() {
        const runecraftingSpec = getSkillSpec('runecrafting') || {};
        const miningSpec = getSkillSpec('mining') || {};
        const integration = runecraftingSpec.integration && typeof runecraftingSpec.integration === 'object'
            ? runecraftingSpec.integration
            : {};
        const miningSource = integration.miningEssenceSource && typeof integration.miningEssenceSource === 'object'
            ? integration.miningEssenceSource
            : {};
        const magicDemand = integration.magicRuneDemand && typeof integration.magicRuneDemand === 'object'
            ? integration.magicRuneDemand
            : {};
        const miningNodeTable = miningSpec.nodeTable && typeof miningSpec.nodeTable === 'object'
            ? miningSpec.nodeTable
            : {};
        const miningNode = miningNodeTable[miningSource.nodeId] && typeof miningNodeTable[miningSource.nodeId] === 'object'
            ? miningNodeTable[miningSource.nodeId]
            : {};
        const miningValueTable = miningSpec.economy && miningSpec.economy.valueTable && typeof miningSpec.economy.valueTable === 'object'
            ? miningSpec.economy.valueTable
            : {};
        const runecraftingValueTable = runecraftingSpec.economy && runecraftingSpec.economy.valueTable && typeof runecraftingSpec.economy.valueTable === 'object'
            ? runecraftingSpec.economy.valueTable
            : {};
        const itemDefs = window.ItemCatalog && window.ItemCatalog.ITEM_DEFS && typeof window.ItemCatalog.ITEM_DEFS === 'object'
            ? window.ItemCatalog.ITEM_DEFS
            : null;
        const elementalRuneItemIds = Array.isArray(magicDemand.elementalRuneItemIds)
            ? magicDemand.elementalRuneItemIds.slice()
            : [];
        const combinationRuneItemIds = Array.isArray(magicDemand.combinationRuneItemIds)
            ? magicDemand.combinationRuneItemIds.slice()
            : [];
        const runeItemIds = elementalRuneItemIds.concat(combinationRuneItemIds);
        const recipeSet = runecraftingSpec.recipeSet && typeof runecraftingSpec.recipeSet === 'object'
            ? runecraftingSpec.recipeSet
            : {};
        const recipeCoverage = Object.keys(recipeSet).sort().map((recipeId) => {
            const recipe = recipeSet[recipeId] || {};
            const outputItemId = typeof recipe.outputItemId === 'string' ? recipe.outputItemId : '';
            return {
                recipeId,
                outputItemId,
                essenceItemId: typeof recipe.essenceItemId === 'string' ? recipe.essenceItemId : '',
                demandGroup: recipe.requiresSecondaryRune ? 'combination' : 'elemental',
                coveredByMagicDemand: runeItemIds.includes(outputItemId)
            };
        });
        const craftableOutputIds = new Set(recipeCoverage.map((row) => row.outputItemId).filter(Boolean));
        const miningValue = miningValueTable[miningSource.itemId] || {};
        const runecraftingValue = runecraftingValueTable[miningSource.itemId] || {};
        let stackableCount = 0;
        let itemDefCount = 0;
        let economyCount = 0;
        let recipeOutputCount = 0;

        for (let i = 0; i < runeItemIds.length; i++) {
            const runeId = runeItemIds[i];
            const item = itemDefs && itemDefs[runeId] ? itemDefs[runeId] : null;
            if (item) itemDefCount++;
            if (item && item.stackable === true) stackableCount++;
            if (runecraftingValueTable[runeId]) economyCount++;
            if (craftableOutputIds.has(runeId)) recipeOutputCount++;
        }

        return {
            essenceSource: {
                skillId: typeof miningSource.skillId === 'string' ? miningSource.skillId : '',
                nodeId: typeof miningSource.nodeId === 'string' ? miningSource.nodeId : '',
                itemId: typeof miningSource.itemId === 'string' ? miningSource.itemId : '',
                requiredLevel: Number.isFinite(miningNode.requiredLevel) ? miningNode.requiredLevel : null,
                persistent: !!miningNode.persistent,
                rewardMatches: miningNode.rewardItemId === miningSource.itemId,
                valueMatches: Number.isFinite(miningValue.buy) && Number.isFinite(runecraftingValue.buy)
                    && miningValue.buy === runecraftingValue.buy
                    && miningValue.sell === runecraftingValue.sell
            },
            magicDemand: {
                skillId: typeof magicDemand.skillId === 'string' ? magicDemand.skillId : '',
                status: typeof magicDemand.status === 'string' ? magicDemand.status : '',
                purpose: typeof magicDemand.purpose === 'string' ? magicDemand.purpose : '',
                elementalRuneItemIds,
                combinationRuneItemIds,
                runeItemIds,
                allRunesHaveItemDefs: itemDefs === null ? null : itemDefCount === runeItemIds.length,
                allRunesStackable: itemDefs === null ? null : stackableCount === runeItemIds.length,
                allRunesInEconomy: economyCount === runeItemIds.length,
                allRunesHaveRecipeOutput: recipeOutputCount === runeItemIds.length
            },
            recipeCoverage
        };
    }

    function computeFletchingRecipeMetrics(recipeId) {
        const fletchingSpec = getSkillSpec('fletching') || {};
        const recipeSet = fletchingSpec.recipeSet && typeof fletchingSpec.recipeSet === 'object'
            ? fletchingSpec.recipeSet
            : {};
        const recipe = recipeSet[recipeId];
        if (!recipe || typeof recipe !== 'object') return null;

        const economy = fletchingSpec.economy && typeof fletchingSpec.economy === 'object'
            ? fletchingSpec.economy
            : {};
        const valueTable = economy.valueTable && typeof economy.valueTable === 'object'
            ? economy.valueTable
            : {};
        const outputItemId = recipe.output && typeof recipe.output.itemId === 'string'
            ? recipe.output.itemId
            : '';
        const outputAmount = Number.isFinite(recipe.output && recipe.output.amount)
            ? recipe.output.amount
            : 1;
        const valueRow = outputItemId && valueTable[outputItemId] && typeof valueTable[outputItemId] === 'object'
            ? valueTable[outputItemId]
            : {};
        const sellValuePerUnit = Number.isFinite(valueRow.sell) ? valueRow.sell : null;
        const sellValuePerAction = sellValuePerUnit === null ? null : sellValuePerUnit * outputAmount;
        const actionTicks = Number.isFinite(recipe.actionTicks)
            ? recipe.actionTicks
            : (Number.isFinite(fletchingSpec.timing && fletchingSpec.timing.actionTicks) ? fletchingSpec.timing.actionTicks : 1);
        const xpPerAction = Number.isFinite(recipe.xpPerAction) ? recipe.xpPerAction : 0;

        return {
            recipeId,
            recipeFamily: typeof recipe.recipeFamily === 'string' ? recipe.recipeFamily : '',
            requiredLevel: Number.isFinite(recipe.requiredLevel) ? recipe.requiredLevel : 1,
            actionTicks,
            output: {
                itemId: outputItemId,
                amount: outputAmount,
                sellValuePerUnit,
                sellValuePerAction
            },
            throughput: {
                xpPerAction,
                sellValuePerAction,
                xpPerTick: roundMetric(actionTicks > 0 ? xpPerAction / actionTicks : 0),
                sellValuePerTick: sellValuePerAction === null || actionTicks <= 0
                    ? null
                    : roundMetric(sellValuePerAction / actionTicks)
            }
        };
    }

    function getFletchingBalanceSummary() {
        const fletchingSpec = getSkillSpec('fletching') || {};
        const recipeSet = fletchingSpec.recipeSet && typeof fletchingSpec.recipeSet === 'object'
            ? fletchingSpec.recipeSet
            : {};
        const familyOrder = {
            handle: 0,
            staff: 1,
            shafts: 2,
            headless_arrows: 3,
            bow_unstrung: 4,
            bow_strung: 5,
            finished_arrows: 6
        };
        const recipeIds = Object.keys(recipeSet).sort((a, b) => {
            const aRecipe = recipeSet[a] || {};
            const bRecipe = recipeSet[b] || {};
            const aLevel = Number.isFinite(aRecipe.requiredLevel) ? aRecipe.requiredLevel : Number.MAX_SAFE_INTEGER;
            const bLevel = Number.isFinite(bRecipe.requiredLevel) ? bRecipe.requiredLevel : Number.MAX_SAFE_INTEGER;
            if (aLevel !== bLevel) return aLevel - bLevel;
            const aFamily = Number.isFinite(familyOrder[aRecipe.recipeFamily]) ? familyOrder[aRecipe.recipeFamily] : Number.MAX_SAFE_INTEGER;
            const bFamily = Number.isFinite(familyOrder[bRecipe.recipeFamily]) ? familyOrder[bRecipe.recipeFamily] : Number.MAX_SAFE_INTEGER;
            if (aFamily !== bFamily) return aFamily - bFamily;
            return a.localeCompare(b);
        });

        const rows = [];
        for (let i = 0; i < recipeIds.length; i++) {
            const row = computeFletchingRecipeMetrics(recipeIds[i]);
            if (row) rows.push(row);
        }

        return {
            assumptions: {
                actionTicks: Number.isFinite(fletchingSpec.timing && fletchingSpec.timing.actionTicks)
                    ? fletchingSpec.timing.actionTicks
                    : 1
            },
            rows
        };
    }

    function computeRuneOutputPerEssence(level, scalingStartLevel) {
        const lvl = Number.isFinite(level) ? level : 1;
        const start = Number.isFinite(scalingStartLevel) ? scalingStartLevel : 1;
        return Math.max(1, 1 + Math.floor((lvl - start) / 10));
    }

    function resolveWeighted(choices, rng) {
        if (!Array.isArray(choices) || choices.length === 0) return null;
        let total = 0;
        for (let i = 0; i < choices.length; i++) {
            const weight = Number(choices[i] && choices[i].weight);
            if (Number.isFinite(weight) && weight > 0) total += weight;
        }
        if (total <= 0) return null;

        const randomFn = typeof rng === 'function' ? rng : Math.random;
        let roll = randomFn() * total;

        for (let i = 0; i < choices.length; i++) {
            const choice = choices[i];
            const weight = Number(choice && choice.weight);
            if (!Number.isFinite(weight) || weight <= 0) continue;
            if (roll < weight) return choice;
            roll -= weight;
        }

        return choices[choices.length - 1] || null;
    }

    window.SkillSpecRegistry = {
        getVersion: () => getRoot().version,
        getSkillSpec,
        getRecipeSet,
        getNodeTable,
        getEconomyTable,
        getWoodcuttingDemandSummary,
        computeWoodcuttingNodeMetrics,
        getWoodcuttingBalanceSummary,
        computeFishingMethodMetrics,
        getFishingBalanceSummary,
        computeMiningNodeMetrics,
        getMiningBalanceSummary,
        computeGatherSuccessChance,
        computeIntervalTicks,
        computeExpectedDepletingYieldCount,
        computeLinearCatchChance,
        computeSuccessChanceFromDifficulty,
        computeFiremakingRecipeMetrics,
        getFiremakingBalanceSummary,
        computeCookingBurnChance,
        computeCookingSuccessChance,
        computeCookingRecipeMetrics,
        getCookingBalanceSummary,
        getRunecraftingEconomySummary,
        getRunecraftingIntegrationSummary,
        computeCraftingRecipeMetrics,
        getCraftingBalanceSummary,
        computeSmithingRecipeMetrics,
        getSmithingBalanceSummary,
        computeFletchingRecipeMetrics,
        getFletchingBalanceSummary,
        computeRuneOutputPerEssence,
        resolveWeighted
    };
})();
