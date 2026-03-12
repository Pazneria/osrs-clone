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

    function computeLinearCatchChance(level, unlockLevel, baseChance, scaling, maxChance) {
        const lvl = Number.isFinite(level) ? level : 1;
        const unlock = Number.isFinite(unlockLevel) ? unlockLevel : 1;
        const raw = (Number.isFinite(baseChance) ? baseChance : 0) + ((lvl - unlock) * (Number.isFinite(scaling) ? scaling : 0));
        const cap = Number.isFinite(maxChance) ? maxChance : 1;
        return Math.max(0, Math.min(cap, raw));
    }

    function computeSuccessChanceFromDifficulty(level, difficulty) {
        const lvl = Math.max(1, Number.isFinite(level) ? level : 1);
        const diff = Math.max(1, Number.isFinite(difficulty) ? difficulty : 1);
        return lvl / (lvl + diff);
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
        computeGatherSuccessChance,
        computeIntervalTicks,
        computeLinearCatchChance,
        computeSuccessChanceFromDifficulty,
        computeRuneOutputPerEssence,
        resolveWeighted
    };
})();
