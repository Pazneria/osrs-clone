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
        computeGatherSuccessChance,
        computeIntervalTicks,
        computeLinearCatchChance,
        computeSuccessChanceFromDifficulty,
        computeCookingBurnChance,
        computeCookingSuccessChance,
        computeRuneOutputPerEssence,
        resolveWeighted
    };
})();
