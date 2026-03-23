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
        computeCookingBurnChance,
        computeCookingSuccessChance,
        computeCookingRecipeMetrics,
        getCookingBalanceSummary,
        computeRuneOutputPerEssence,
        resolveWeighted
    };
})();
