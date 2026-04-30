(function () {
    const SKILL_PANEL_RECIPE_UNLOCK_TYPE = 'recipe';

    const COMBAT_SKILL_MILESTONES = {
        attack: [
            { level: 1, label: 'Starter melee accuracy baseline' },
            { level: 10, label: 'Early melee consistency bump' },
            { level: 20, label: 'Mid-band melee accuracy bump' },
            { level: 30, label: 'Advanced melee accuracy bump' },
            { level: 40, label: 'High-band melee accuracy bump' }
        ],
        strength: [
            { level: 1, label: 'Starter max-hit baseline' },
            { level: 10, label: 'Early max-hit bump' },
            { level: 20, label: 'Mid-band max-hit bump' },
            { level: 30, label: 'Advanced max-hit bump' },
            { level: 40, label: 'High-band max-hit bump' }
        ],
        defense: [
            { level: 1, label: 'Starter mitigation baseline' },
            { level: 10, label: 'Early defense scaling bump' },
            { level: 20, label: 'Mid-band defense scaling bump' },
            { level: 30, label: 'Advanced defense scaling bump' },
            { level: 40, label: 'High-band defense scaling bump' }
        ],
        hitpoints: [
            { level: 10, label: 'Starter health pool baseline' },
            { level: 20, label: 'Early survivability bump' },
            { level: 30, label: 'Mid-band survivability bump' },
            { level: 40, label: 'Advanced survivability bump' }
        ]
    };

    const FISHING_METHOD_LABELS = {
        net: 'Net fishing',
        rod: 'Rod fishing',
        harpoon: 'Harpoon fishing',
        deep_harpoon_mixed: 'Deep-water harpoon (mixed)',
        deep_rune_harpoon: 'Deep-water rune harpoon'
    };

    function formatSkillPanelText(value) {
        if (typeof value !== 'string') return '';
        return value
            .replace(/[_-]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    function resolveSkillPanelItemName(itemId, options = {}) {
        if (typeof itemId !== 'string' || !itemId) return '';
        const itemDb = options.itemDb || {};
        const item = itemDb[itemId];
        if (item && typeof item.name === 'string' && item.name.trim()) return item.name.trim();
        return formatSkillPanelText(itemId);
    }

    function formatSkillPanelItemAmount(itemId, amount = 1, options = {}) {
        const qty = Number.isFinite(amount) ? Math.max(1, Math.floor(amount)) : 1;
        return `${qty}x ${resolveSkillPanelItemName(itemId, options)}`;
    }

    function addSkillPanelMilestone(milestonesByLevel, level, label, options = {}) {
        const lvl = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;
        const text = typeof label === 'string' ? label.trim() : '';
        if (!text) return;
        if (!milestonesByLevel[lvl]) milestonesByLevel[lvl] = new Map();

        const unlockType = (typeof options.unlockType === 'string' && options.unlockType.trim())
            ? options.unlockType.trim()
            : 'unlock';
        const rawKey = (typeof options.key === 'string' && options.key.trim())
            ? options.key.trim()
            : `${unlockType}:${text.toLowerCase()}`;
        const key = rawKey.toLowerCase();
        if (milestonesByLevel[lvl].has(key)) return;

        milestonesByLevel[lvl].set(key, {
            key,
            label: text,
            unlockType,
            recipeId: (typeof options.recipeId === 'string' && options.recipeId.trim()) ? options.recipeId.trim() : null,
            recipe: (options.recipe && typeof options.recipe === 'object') ? options.recipe : null
        });
    }

    function getSkillPanelVerb(skillName) {
        if (skillName === 'woodcutting') return 'Chop';
        if (skillName === 'mining') return 'Mine';
        if (skillName === 'fishing') return 'Catch';
        if (skillName === 'firemaking') return 'Burn';
        if (skillName === 'cooking') return 'Cook';
        if (skillName === 'runecrafting') return 'Craft';
        if (skillName === 'smithing') return 'Forge';
        if (skillName === 'crafting') return 'Craft';
        if (skillName === 'fletching') return 'Fletch';
        return 'Unlock';
    }

    function collectNodeMilestones(skillName, nodeTable, milestonesByLevel, options = {}) {
        if (!nodeTable || typeof nodeTable !== 'object') return;
        const nodeIds = Object.keys(nodeTable);
        for (let i = 0; i < nodeIds.length; i++) {
            const nodeId = nodeIds[i];
            const node = nodeTable[nodeId];
            if (!node || typeof node !== 'object') continue;

            if (skillName === 'fishing' && node.methods && typeof node.methods === 'object') {
                if (Number.isFinite(node.unlockLevel)) {
                    addSkillPanelMilestone(milestonesByLevel, node.unlockLevel, `Access ${formatSkillPanelText(nodeId)}`, { key: `node:${nodeId}:access` });
                }
                const methodIds = Object.keys(node.methods);
                for (let j = 0; j < methodIds.length; j++) {
                    const methodId = methodIds[j];
                    const method = node.methods[methodId];
                    if (!method || typeof method !== 'object') continue;
                    const methodUnlockLevel = Number.isFinite(method.unlockLevel)
                        ? method.unlockLevel
                        : (Number.isFinite(node.unlockLevel) ? node.unlockLevel : 1);
                    const methodLabel = FISHING_METHOD_LABELS[methodId] || formatSkillPanelText(methodId);
                    addSkillPanelMilestone(milestonesByLevel, methodUnlockLevel, `Method: ${methodLabel}`, { key: `method:${methodId}` });

                    const bands = Array.isArray(method.fishByLevel) ? method.fishByLevel : [];
                    for (let bandIdx = 0; bandIdx < bands.length; bandIdx++) {
                        const band = bands[bandIdx];
                        if (!band || typeof band !== 'object') continue;
                        const fishRows = Array.isArray(band.fish) ? band.fish : [];
                        for (let fishIdx = 0; fishIdx < fishRows.length; fishIdx++) {
                            const fishDef = fishRows[fishIdx];
                            if (!fishDef || typeof fishDef !== 'object') continue;
                            const fishLevel = Number.isFinite(fishDef.requiredLevel)
                                ? fishDef.requiredLevel
                                : (Number.isFinite(band.minLevel) ? band.minLevel : methodUnlockLevel);
                            const fishName = resolveSkillPanelItemName(fishDef.itemId, options);
                            addSkillPanelMilestone(milestonesByLevel, fishLevel, `Catch ${fishName}`, { key: `fish:${fishDef.itemId}` });
                        }
                    }
                }
                continue;
            }

            const unlockLevel = Number.isFinite(node.requiredLevel)
                ? node.requiredLevel
                : (Number.isFinite(node.unlockLevel) ? node.unlockLevel : 1);
            if (typeof node.rewardItemId === 'string' && node.rewardItemId) {
                const verb = getSkillPanelVerb(skillName);
                addSkillPanelMilestone(milestonesByLevel, unlockLevel, `${verb} ${resolveSkillPanelItemName(node.rewardItemId, options)}`, { key: `node:${nodeId}:reward` });
            } else {
                addSkillPanelMilestone(milestonesByLevel, unlockLevel, `Unlock ${formatSkillPanelText(nodeId)}`, { key: `node:${nodeId}` });
            }
        }
    }

    function resolveRecipeMilestoneLabel(skillName, recipeId, recipe, options = {}) {
        const verb = getSkillPanelVerb(skillName);
        if (recipe && recipe.output && typeof recipe.output.itemId === 'string') {
            return `${verb} ${resolveSkillPanelItemName(recipe.output.itemId, options)}`;
        }
        if (recipe && typeof recipe.outputItemId === 'string') {
            if (skillName === 'runecrafting' && typeof recipe.altarName === 'string' && recipe.altarName.trim()) {
                return `Craft ${resolveSkillPanelItemName(recipe.outputItemId, options)} (${recipe.altarName.trim()})`;
            }
            return `${verb} ${resolveSkillPanelItemName(recipe.outputItemId, options)}`;
        }
        if (recipe && typeof recipe.cookedItemId === 'string') {
            return `Cook ${resolveSkillPanelItemName(recipe.cookedItemId, options)}`;
        }
        if (skillName === 'firemaking' && recipe && typeof recipe.sourceItemId === 'string') {
            return `Burn ${resolveSkillPanelItemName(recipe.sourceItemId, options)}`;
        }
        if (recipe && typeof recipe.sourceItemId === 'string') {
            return `${verb} ${resolveSkillPanelItemName(recipe.sourceItemId, options)}`;
        }
        if (typeof recipeId === 'string' && recipeId) return `Unlock ${formatSkillPanelText(recipeId)}`;
        return '';
    }

    function collectRecipeMilestones(skillName, recipeSet, milestonesByLevel, options = {}) {
        if (!recipeSet || typeof recipeSet !== 'object') return;
        const recipeIds = Object.keys(recipeSet);
        for (let i = 0; i < recipeIds.length; i++) {
            const recipeId = recipeIds[i];
            const recipe = recipeSet[recipeId];
            if (!recipe || typeof recipe !== 'object') continue;
            const requiredLevel = Number.isFinite(recipe.requiredLevel) ? recipe.requiredLevel : 1;
            const label = resolveRecipeMilestoneLabel(skillName, recipeId, recipe, options);
            addSkillPanelMilestone(milestonesByLevel, requiredLevel, label, {
                unlockType: SKILL_PANEL_RECIPE_UNLOCK_TYPE,
                key: `recipe:${recipeId}`,
                recipeId,
                recipe
            });
        }
    }

    function collectSkillPanelMilestones(options = {}) {
        const skillName = options.skillName;
        const milestonesByLevel = {};
        const combatMilestones = COMBAT_SKILL_MILESTONES[skillName];
        if (Array.isArray(combatMilestones)) {
            for (let i = 0; i < combatMilestones.length; i++) {
                const row = combatMilestones[i];
                if (!row || typeof row !== 'object') continue;
                addSkillPanelMilestone(milestonesByLevel, row.level, row.label, { key: `combat:${skillName}:${row.level}` });
            }
            return milestonesByLevel;
        }

        const spec = options.skillSpec || null;
        if (!spec || typeof spec !== 'object') return milestonesByLevel;

        collectNodeMilestones(skillName, spec.nodeTable, milestonesByLevel, options);
        collectRecipeMilestones(skillName, spec.recipeSet, milestonesByLevel, options);

        if (skillName === 'runecrafting' && spec.pouchTable && typeof spec.pouchTable === 'object') {
            const pouchIds = Object.keys(spec.pouchTable);
            for (let i = 0; i < pouchIds.length; i++) {
                const pouchId = pouchIds[i];
                const pouchDef = spec.pouchTable[pouchId];
                if (!pouchDef || typeof pouchDef !== 'object') continue;
                const requiredLevel = Number.isFinite(pouchDef.requiredLevel) ? pouchDef.requiredLevel : 1;
                addSkillPanelMilestone(milestonesByLevel, requiredLevel, `Use ${resolveSkillPanelItemName(pouchId, options)}`, { key: `pouch:${pouchId}` });
            }
        }

        return milestonesByLevel;
    }

    function buildSkillPanelTimeline(options = {}) {
        const milestonesByLevel = collectSkillPanelMilestones(options);
        return Object.keys(milestonesByLevel)
            .map((levelKey) => {
                const level = Number(levelKey);
                const unlocks = Array.from((milestonesByLevel[levelKey] && milestonesByLevel[levelKey].values()) || [])
                    .sort((a, b) => a.label.localeCompare(b.label));
                return { level, unlocks };
            })
            .filter((entry) => Number.isFinite(entry.level) && Array.isArray(entry.unlocks) && entry.unlocks.length > 0)
            .sort((a, b) => {
                if (a.level !== b.level) return a.level - b.level;
                return a.unlocks[0].label.localeCompare(b.unlocks[0].label);
            });
    }

    function getSkillPanelUnlockTypeLabel(unlockEntry) {
        if (!unlockEntry || typeof unlockEntry !== 'object') return 'Unlock';
        if (typeof unlockEntry.unlockTypeLabel === 'string' && unlockEntry.unlockTypeLabel.trim()) {
            return unlockEntry.unlockTypeLabel.trim();
        }
        if (unlockEntry.unlockType === SKILL_PANEL_RECIPE_UNLOCK_TYPE) return 'Recipe Unlock';
        const key = typeof unlockEntry.key === 'string' ? unlockEntry.key : '';
        if (key.startsWith('node:')) return 'Node Unlock';
        if (key.startsWith('method:')) return 'Method Unlock';
        if (key.startsWith('fish:')) return 'Catch Unlock';
        if (key.startsWith('pouch:')) return 'Pouch Unlock';
        if (key.startsWith('combat:')) return 'Combat Milestone';
        return 'Unlock';
    }

    function buildSkillPanelRecipeDetails(options = {}) {
        const skillName = options.skillName;
        const unlockEntry = options.unlockEntry;
        if (!unlockEntry || unlockEntry.unlockType !== SKILL_PANEL_RECIPE_UNLOCK_TYPE || !unlockEntry.recipe) return null;
        const recipe = unlockEntry.recipe;
        const inputs = [];
        const outputs = [];
        const meta = [];
        const seenInputs = new Set();
        const seenOutputs = new Set();

        function pushUniqueInput(text) {
            if (!text || seenInputs.has(text)) return;
            seenInputs.add(text);
            inputs.push(text);
        }

        function pushUniqueOutput(text) {
            if (!text || seenOutputs.has(text)) return;
            seenOutputs.add(text);
            outputs.push(text);
        }

        const recipeInputs = Array.isArray(recipe.inputs) ? recipe.inputs : [];
        for (let i = 0; i < recipeInputs.length; i++) {
            const input = recipeInputs[i];
            if (!input || typeof input !== 'object' || typeof input.itemId !== 'string') continue;
            pushUniqueInput(formatSkillPanelItemAmount(input.itemId, input.amount, options));
        }

        if (typeof recipe.sourceItemId === 'string' && recipe.sourceItemId) {
            pushUniqueInput(formatSkillPanelItemAmount(recipe.sourceItemId, 1, options));
        }
        if (typeof recipe.essenceItemId === 'string' && recipe.essenceItemId) {
            pushUniqueInput(formatSkillPanelItemAmount(recipe.essenceItemId, 1, options));
        }
        if (recipe.requiresSecondaryRune && typeof recipe.secondaryRuneItemId === 'string' && recipe.secondaryRuneItemId) {
            pushUniqueInput(`${formatSkillPanelItemAmount(recipe.secondaryRuneItemId, 1, options)} (secondary rune)`);
        }
        if (recipe.extraRequirement && typeof recipe.extraRequirement === 'object' && typeof recipe.extraRequirement.itemId === 'string') {
            const amount = Number.isFinite(recipe.extraRequirement.amount) ? recipe.extraRequirement.amount : 1;
            const consumeOn = (typeof recipe.extraRequirement.consumeOn === 'string' && recipe.extraRequirement.consumeOn.trim())
                ? recipe.extraRequirement.consumeOn.trim()
                : '';
            const suffix = consumeOn ? ` (${consumeOn})` : '';
            pushUniqueInput(`${formatSkillPanelItemAmount(recipe.extraRequirement.itemId, amount, options)}${suffix}`);
        }

        if (recipe.output && typeof recipe.output === 'object' && typeof recipe.output.itemId === 'string') {
            pushUniqueOutput(formatSkillPanelItemAmount(recipe.output.itemId, recipe.output.amount, options));
        }
        if (typeof recipe.outputItemId === 'string' && recipe.outputItemId) {
            const outputAmount = Number.isFinite(recipe.outputAmount) ? recipe.outputAmount : 1;
            pushUniqueOutput(formatSkillPanelItemAmount(recipe.outputItemId, outputAmount, options));
        }
        if (typeof recipe.cookedItemId === 'string' && recipe.cookedItemId) {
            pushUniqueOutput(`Success: ${formatSkillPanelItemAmount(recipe.cookedItemId, 1, options)}`);
        }
        if (typeof recipe.burntItemId === 'string' && recipe.burntItemId) {
            pushUniqueOutput(`Burn result: ${formatSkillPanelItemAmount(recipe.burntItemId, 1, options)}`);
        }
        if (skillName === 'firemaking') {
            pushUniqueOutput('Creates an active fire on the target tile');
        }

        if (Number.isFinite(recipe.requiredLevel)) meta.push(`Required level: ${Math.max(1, Math.floor(recipe.requiredLevel))}`);
        if (Array.isArray(recipe.requiredToolIds) && recipe.requiredToolIds.length) {
            const tools = recipe.requiredToolIds.map((id) => resolveSkillPanelItemName(id, options)).join(', ');
            meta.push(`Tools: ${tools}`);
        }
        if (typeof recipe.stationType === 'string' && recipe.stationType) meta.push(`Station: ${formatSkillPanelText(recipe.stationType)}`);
        if (typeof recipe.sourceTarget === 'string' && recipe.sourceTarget) meta.push(`Target: ${formatSkillPanelText(recipe.sourceTarget)}`);
        if (typeof recipe.altarName === 'string' && recipe.altarName.trim()) meta.push(`Altar: ${recipe.altarName.trim()}`);
        if (Number.isFinite(recipe.xpPerAction)) meta.push(`XP per action: ${recipe.xpPerAction}`);
        else if (Number.isFinite(recipe.xpPerSuccess)) meta.push(`XP per success: ${recipe.xpPerSuccess}`);
        else if (Number.isFinite(recipe.xpPerEssence)) meta.push(`XP per essence: ${recipe.xpPerEssence}`);
        if (Number.isFinite(recipe.actionTicks)) meta.push(`Action ticks: ${Math.max(1, Math.floor(recipe.actionTicks))}`);
        if (Number.isFinite(recipe.fireLifetimeTicks)) meta.push(`Fire lifetime ticks: ${Math.max(1, Math.floor(recipe.fireLifetimeTicks))}`);
        if (Number.isFinite(recipe.ignitionDifficulty)) meta.push(`Ignition difficulty: ${Math.max(1, Math.floor(recipe.ignitionDifficulty))}`);
        if (skillName === 'cooking' && Number.isFinite(recipe.requiredLevel)) {
            const playerSkills = options.playerSkills || {};
            const cookingLevel = (playerSkills.cooking && Number.isFinite(playerSkills.cooking.level))
                ? playerSkills.cooking.level
                : 1;
            let burnChance = null;
            const skillSpecRegistry = options.skillSpecRegistry || null;
            if (skillSpecRegistry && typeof skillSpecRegistry.computeCookingBurnChance === 'function') {
                burnChance = skillSpecRegistry.computeCookingBurnChance(cookingLevel, recipe.requiredLevel);
            } else {
                const delta = Math.max(0, Math.min(30, cookingLevel - recipe.requiredLevel));
                if (delta <= 0) burnChance = 0.33;
                else if (delta >= 30) burnChance = 0;
                else {
                    const raw = 0.33 - (0.038 * delta) + (0.0018 * delta * delta) - (0.00003 * delta * delta * delta);
                    burnChance = Math.max(0, Math.min(0.33, raw));
                }
            }
            const burnPercent = (burnChance * 100).toFixed(1).replace(/\.0$/, '');
            meta.push(`Burn chance: ${burnPercent}%`);
        }
        if (typeof recipe.requiredUnlockFlag === 'string' && recipe.requiredUnlockFlag) {
            meta.push(`Unlock flag: ${formatSkillPanelText(recipe.requiredUnlockFlag)}`);
        }

        return { inputs, outputs, meta };
    }

    window.SkillPanelRuntime = {
        SKILL_PANEL_RECIPE_UNLOCK_TYPE,
        buildSkillPanelRecipeDetails,
        buildSkillPanelTimeline,
        formatSkillPanelText,
        getSkillPanelUnlockTypeLabel,
        resolveSkillPanelItemName
    };
})();
