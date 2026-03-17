(function () {
    const SKILL_ID = 'fishing';
    const FALLBACK_FISHING_TOOL_IDS = ['small_net', 'fishing_rod', 'harpoon', 'rune_harpoon'];
    const ACTIVE_METHOD_STATE_KEY = 'fishingActiveMethodId';
    const ACTIVE_WATER_STATE_KEY = 'fishingActiveWaterId';
    const ACTIVE_TILE_STATE_KEY = 'fishingActiveTileId';
    const START_ACTION_STARTED_AT_STATE_KEY = 'fishingCastStartedAt';

    function getWaterTable(context) {
        return typeof context.getNodeTable === 'function' ? context.getNodeTable(SKILL_ID) : null;
    }

    function resolveWaterSpecForTarget(context, waterIdHint) {
        const table = getWaterTable(context);
        if (!table) return null;

        if (typeof waterIdHint === 'string' && table[waterIdHint]) {
            const hinted = table[waterIdHint];
            if (Array.isArray(hinted.tileIds)) {
                for (let i = 0; i < hinted.tileIds.length; i++) {
                    if (context.isTargetTile(hinted.tileIds[i])) {
                        return { waterId: waterIdHint, waterSpec: hinted, targetTileId: hinted.tileIds[i] };
                    }
                }
            }
        }

        const waterIds = Object.keys(table);
        for (let i = 0; i < waterIds.length; i++) {
            const waterId = waterIds[i];
            const spec = table[waterId];
            if (!spec || !Array.isArray(spec.tileIds)) continue;
            for (let j = 0; j < spec.tileIds.length; j++) {
                const tileId = spec.tileIds[j];
                if (context.isTargetTile(tileId)) {
                    return { waterId, waterSpec: spec, targetTileId: tileId };
                }
            }
        }

        return null;
    }

    function hasAnyTool(context, toolIds) {
        if (!context || !Array.isArray(toolIds)) return false;
        const equippedWeaponId = context && context.equipment && context.equipment.weapon ? context.equipment.weapon.id : null;
        for (let i = 0; i < toolIds.length; i++) {
            const toolId = toolIds[i];
            if (equippedWeaponId && equippedWeaponId === toolId) return true;
            if (typeof context.hasItem === 'function' && context.hasItem(toolId)) return true;
        }
        return false;
    }

    function hasAnyFishingTool(context) {
        return hasAnyTool(context, FALLBACK_FISHING_TOOL_IDS);
    }

    function getFishingAnimationMode(context) {
        const methodId = context && context.playerState ? context.playerState[ACTIVE_METHOD_STATE_KEY] : null;
        if (typeof methodId !== 'string') return 'net';
        if (methodId.includes('harpoon')) return 'harpoon';
        if (methodId === 'rod') return 'rod';
        return 'net';
    }

    function getFishingToolVisualId(context) {
        const mode = getFishingAnimationMode(context);
        const methodId = context && context.playerState ? context.playerState[ACTIVE_METHOD_STATE_KEY] : null;
        if (mode === 'net') return 'small_net';
        if (mode === 'rod') return 'fishing_rod';
        if (mode === 'harpoon') {
            return typeof methodId === 'string' && methodId.includes('rune_harpoon')
                ? 'rune_harpoon'
                : 'harpoon';
        }
        return null;
    }

    function shouldRequestFishingStartAction(methodId) {
        return methodId === 'rod' || (typeof methodId === 'string' && methodId.includes('harpoon'));
    }

    function getMethodFishTable(methodSpec, level) {
        if (!methodSpec) return [];

        if (Array.isArray(methodSpec.fishByLevel)) {
            for (let i = 0; i < methodSpec.fishByLevel.length; i++) {
                const band = methodSpec.fishByLevel[i];
                if (!band || !Array.isArray(band.fish)) continue;
                const minLevel = Number.isFinite(band.minLevel) ? band.minLevel : 1;
                const maxLevel = Number.isFinite(band.maxLevel) ? band.maxLevel : Infinity;
                if (level < minLevel || level > maxLevel) continue;
                return band.fish.filter((fish) => fish && level >= (fish.requiredLevel || 1));
            }
        }

        if (Array.isArray(methodSpec.fish)) {
            return methodSpec.fish.filter((fish) => fish && level >= (fish.requiredLevel || 1));
        }

        return [];
    }

    function canAcceptAnyFish(context, fishTable) {
        if (!Array.isArray(fishTable) || fishTable.length === 0) return false;
        if (typeof context.canAcceptItemById !== 'function') return true;
        for (let i = 0; i < fishTable.length; i++) {
            const fish = fishTable[i];
            if (fish && fish.itemId && context.canAcceptItemById(fish.itemId, 1)) return true;
        }
        return false;
    }

    function getMethodRequirement(methodSpec) {
        return methodSpec && methodSpec.extraRequirement ? methodSpec.extraRequirement : null;
    }

    function hasMethodRequirement(context, methodSpec) {
        const requirement = getMethodRequirement(methodSpec);
        if (!requirement || !requirement.itemId) return true;
        const requiredAmount = Number.isFinite(requirement.amount) ? Math.max(1, requirement.amount) : 1;
        if (typeof context.getInventoryCount === 'function') {
            return context.getInventoryCount(requirement.itemId) >= requiredAmount;
        }
        return typeof context.hasItem === 'function' ? context.hasItem(requirement.itemId) : false;
    }

    function getMethodEntries(waterSpec) {
        if (!waterSpec || !waterSpec.methods || typeof waterSpec.methods !== 'object') return [];
        const methodIds = Object.keys(waterSpec.methods);
        const entries = [];
        for (let i = 0; i < methodIds.length; i++) {
            const methodId = methodIds[i];
            const methodSpec = waterSpec.methods[methodId];
            if (!methodSpec) continue;
            entries.push({ methodId, methodSpec, order: i });
        }
        return entries;
    }

    function getRequestedMethodId(context) {
        const targetUid = context ? context.targetUid : null;
        if (!targetUid || typeof targetUid !== 'object') return null;
        return typeof targetUid.fishingMethodId === 'string' ? targetUid.fishingMethodId : null;
    }

    function getMethodPriority(methodSpec, unlockLevel, order) {
        if (methodSpec && Number.isFinite(methodSpec.priority)) return methodSpec.priority;
        const resolvedUnlock = Number.isFinite(unlockLevel) ? unlockLevel : 1;
        const resolvedOrder = Number.isFinite(order) ? order : 0;
        return (resolvedUnlock * 10) + Math.max(0, 10 - resolvedOrder);
    }

    function buildMethodCandidate(context, level, waterSpec, entry) {
        if (!entry || !entry.methodSpec) return null;
        const methodSpec = entry.methodSpec;
        const unlockLevel = Number.isFinite(methodSpec.unlockLevel) ? methodSpec.unlockLevel : (waterSpec.unlockLevel || 1);
        const toolIds = Array.isArray(methodSpec.toolIds) ? methodSpec.toolIds : [];
        const hasTool = toolIds.length === 0 || hasAnyTool(context, toolIds);
        const fishTable = getMethodFishTable(methodSpec, level);
        const requirement = getMethodRequirement(methodSpec);
        const requirementMissing = !!requirement && !hasMethodRequirement(context, methodSpec);

        return {
            methodId: entry.methodId,
            methodSpec,
            unlockLevel,
            hasTool,
            fishTable,
            requirementMissing,
            requirementItemId: requirement && requirement.itemId ? requirement.itemId : null,
            score: (getMethodPriority(methodSpec, unlockLevel, entry.order) * 1000) + (unlockLevel * 10) - entry.order
        };
    }

    function selectFishingMethodById(context, level, waterSpec, methodId) {
        if (!methodId) return null;

        const entries = getMethodEntries(waterSpec);
        if (entries.length === 0) {
            if (methodId !== 'legacy') return null;
            const legacyFish = Array.isArray(waterSpec && waterSpec.fish)
                ? waterSpec.fish.filter((fish) => fish && level >= (fish.requiredLevel || 1))
                : [];
            if (legacyFish.length === 0) return null;
            return {
                methodId: 'legacy',
                methodSpec: { methodId: 'legacy', toolIds: FALLBACK_FISHING_TOOL_IDS, fish: legacyFish },
                unlockLevel: waterSpec && Number.isFinite(waterSpec.unlockLevel) ? waterSpec.unlockLevel : 1,
                hasTool: hasAnyFishingTool(context),
                fishTable: legacyFish,
                requirementMissing: false,
                requirementItemId: null,
                score: 0
            };
        }

        const entry = entries.find((candidate) => candidate.methodId === methodId);
        if (!entry) return null;

        const candidate = buildMethodCandidate(context, level, waterSpec, entry);
        if (!candidate) return null;
        if (level < candidate.unlockLevel || !candidate.hasTool || candidate.fishTable.length === 0) return null;
        return candidate;
    }

    function selectFishingMethod(context, level, waterSpec) {
        const entries = getMethodEntries(waterSpec);
        if (entries.length === 0) {
            const legacyFish = Array.isArray(waterSpec && waterSpec.fish)
                ? waterSpec.fish.filter((fish) => fish && level >= (fish.requiredLevel || 1))
                : [];
            if (legacyFish.length === 0) return null;
            return {
                methodId: 'legacy',
                methodSpec: { methodId: 'legacy', toolIds: FALLBACK_FISHING_TOOL_IDS, fish: legacyFish },
                fishTable: legacyFish,
                requirementMissing: false,
                requirementItemId: null,
                score: 0
            };
        }

        const candidates = [];
        for (let i = 0; i < entries.length; i++) {
            const candidate = buildMethodCandidate(context, level, waterSpec, entries[i]);
            if (!candidate) continue;
            if (level < candidate.unlockLevel) continue;
            if (!candidate.hasTool) continue;
            if (candidate.fishTable.length === 0) continue;
            candidates.push(candidate);
        }

        if (candidates.length === 0) return null;

        const eligible = candidates.filter((candidate) => !candidate.requirementMissing);
        const pool = eligible.length > 0 ? eligible : candidates;
        pool.sort((a, b) => b.score - a.score);
        return pool[0];
    }

    function resolveMethodIdForTool(waterSpec, toolId) {
        if (!waterSpec || !toolId) return null;
        const entries = getMethodEntries(waterSpec);
        const matches = entries.filter((entry) => {
            const toolIds = Array.isArray(entry.methodSpec && entry.methodSpec.toolIds) ? entry.methodSpec.toolIds : [];
            return toolIds.includes(toolId);
        });
        if (matches.length === 0) return null;

        matches.sort((a, b) => {
            const aUnlock = Number.isFinite(a.methodSpec && a.methodSpec.unlockLevel) ? a.methodSpec.unlockLevel : (waterSpec.unlockLevel || 1);
            const bUnlock = Number.isFinite(b.methodSpec && b.methodSpec.unlockLevel) ? b.methodSpec.unlockLevel : (waterSpec.unlockLevel || 1);
            const aScore = (getMethodPriority(a.methodSpec, aUnlock, a.order) * 1000) + (aUnlock * 10) - a.order;
            const bScore = (getMethodPriority(b.methodSpec, bUnlock, b.order) * 1000) + (bUnlock * 10) - b.order;
            return bScore - aScore;
        });

        return matches[0].methodId;
    }

    function getMethodMenuLabel(methodId) {
        if (methodId === 'net') return 'Net';
        if (methodId === 'rod') return 'Rod';
        if (methodId === 'harpoon') return 'Harpoon';
        if (methodId === 'deep_harpoon_mixed') return 'Harpoon';
        if (methodId === 'deep_rune_harpoon') return 'Rune Harpoon';
        return 'Fish';
    }

    const fishingModule = {
        canStart(context) {
            const waterPlan = resolveWaterSpecForTarget(context);
            if (!waterPlan) return false;

            const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
            if (level < (waterPlan.waterSpec.unlockLevel || 1)) return false;

            const requestedMethodId = getRequestedMethodId(context);
            const selectedMethod = requestedMethodId
                ? selectFishingMethodById(context, level, waterPlan.waterSpec, requestedMethodId)
                : selectFishingMethod(context, level, waterPlan.waterSpec);
            if (!selectedMethod || selectedMethod.requirementMissing) return false;

            return canAcceptAnyFish(context, selectedMethod.fishTable);
        },

        onStart(context) {
            const waterPlan = resolveWaterSpecForTarget(context);
            if (!waterPlan) return false;

            if (!hasAnyFishingTool(context)) {
                context.addChatMessage('You need fishing gear to fish here.', 'warn');
                return false;
            }

            if (typeof context.requireSkillLevel === 'function' && !context.requireSkillLevel(waterPlan.waterSpec.unlockLevel || 1, { skillId: SKILL_ID, action: 'fish here' })) {
                return false;
            }

            const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
            const requestedMethodId = getRequestedMethodId(context);
            const selectedMethod = requestedMethodId
                ? selectFishingMethodById(context, level, waterPlan.waterSpec, requestedMethodId)
                : selectFishingMethod(context, level, waterPlan.waterSpec);
            if (!selectedMethod) {
                context.addChatMessage(requestedMethodId
                    ? 'You cannot fish here with that method.'
                    : 'You cannot fish here with your current level and tools.', 'warn');
                return false;
            }

            if (selectedMethod.requirementMissing) {
                const requirementName = selectedMethod.requirementItemId === 'bait' ? 'bait' : 'required item';
                context.addChatMessage('You need ' + requirementName + ' to fish with this method.', 'warn');
                return false;
            }

            if (!canAcceptAnyFish(context, selectedMethod.fishTable)) {
                context.addChatMessage('You have no inventory space for fish.', 'warn');
                return false;
            }

            const catchChance = (window.SkillSpecRegistry && typeof SkillSpecRegistry.computeLinearCatchChance === 'function')
                ? SkillSpecRegistry.computeLinearCatchChance(level, waterPlan.waterSpec.unlockLevel, waterPlan.waterSpec.baseCatchChance, waterPlan.waterSpec.levelScaling, waterPlan.waterSpec.maxCatchChance)
                : (waterPlan.waterSpec.baseCatchChance || 0.2);

            const skillSpec = typeof context.getSkillSpec === 'function' ? context.getSkillSpec(SKILL_ID) : null;
            const intervalTicks = (window.SkillSpecRegistry && typeof SkillSpecRegistry.computeIntervalTicks === 'function')
                ? SkillSpecRegistry.computeIntervalTicks(skillSpec && skillSpec.timing ? skillSpec.timing.baseAttemptTicks : 3, skillSpec && skillSpec.timing ? skillSpec.timing.minimumAttemptTicks : 1, 0)
                : 1;

            if (window.SkillActionResolution && typeof SkillActionResolution.startGatherSession === 'function') {
                SkillActionResolution.startGatherSession(context, SKILL_ID, intervalTicks);
            }

            context.playerState.fishingCatchChance = catchChance;
            context.playerState[ACTIVE_METHOD_STATE_KEY] = selectedMethod.methodId;
            context.playerState[ACTIVE_WATER_STATE_KEY] = waterPlan.waterId;
            context.playerState[ACTIVE_TILE_STATE_KEY] = waterPlan.targetTileId;
            context.playerState[START_ACTION_STARTED_AT_STATE_KEY] = shouldRequestFishingStartAction(selectedMethod.methodId) ? Date.now() : null;
            context.startSkillingAction();
            return true;
        },

        onUseItem(context) {
            if (!context || context.targetObj !== 'WATER' || !context.sourceItemId) return false;
            const waterPlan = resolveWaterSpecForTarget(context);
            if (!waterPlan) return false;

            const methodId = resolveMethodIdForTool(waterPlan.waterSpec, context.sourceItemId);
            if (!methodId) return false;

            if (typeof context.queueInteractAt === 'function') {
                context.queueInteractAt('WATER', context.targetX, context.targetY, {
                    skillId: SKILL_ID,
                    fishingMethodId: methodId
                });
                context.spawnClickMarker(true);
                return true;
            }

            return false;
        },

        onTick(context) {
            if (!window.SkillActionResolution || typeof SkillActionResolution.runGatherAttempt !== 'function') {
                context.stopAction();
                return;
            }

            const activeWaterId = context.playerState[ACTIVE_WATER_STATE_KEY] || null;
            const waterPlan = resolveWaterSpecForTarget(context, activeWaterId);
            if (!waterPlan) {
                if (typeof SkillActionResolution.stopSkill === 'function') SkillActionResolution.stopSkill(context, SKILL_ID, 'TARGET_INVALID');
                else context.stopAction();
                return;
            }

            const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
            const activeMethodId = context.playerState[ACTIVE_METHOD_STATE_KEY] || null;
            let selectedMethod = null;

            if (activeMethodId) {
                const methods = getMethodEntries(waterPlan.waterSpec);
                const exact = methods.find((entry) => entry.methodId === activeMethodId);
                if (!exact) {
                    context.addChatMessage('You no longer meet the active fishing method requirements.', 'warn');
                    if (typeof SkillActionResolution.stopSkill === 'function') SkillActionResolution.stopSkill(context, SKILL_ID, 'METHOD_INVALID');
                    else context.stopAction();
                    return;
                }

                const unlockLevel = Number.isFinite(exact.methodSpec.unlockLevel) ? exact.methodSpec.unlockLevel : (waterPlan.waterSpec.unlockLevel || 1);
                const fishTable = getMethodFishTable(exact.methodSpec, level);
                const requirement = getMethodRequirement(exact.methodSpec);
                selectedMethod = {
                    methodId: exact.methodId,
                    methodSpec: exact.methodSpec,
                    fishTable,
                    requirementMissing: !!requirement && !hasMethodRequirement(context, exact.methodSpec),
                    requirementItemId: requirement && requirement.itemId ? requirement.itemId : null
                };

                if (level < unlockLevel || !hasAnyTool(context, exact.methodSpec.toolIds || []) || fishTable.length === 0) {
                    context.addChatMessage('You no longer meet the active fishing method requirements.', 'warn');
                    if (typeof SkillActionResolution.stopSkill === 'function') SkillActionResolution.stopSkill(context, SKILL_ID, 'METHOD_INVALID');
                    else context.stopAction();
                    return;
                }
            } else {
                selectedMethod = selectFishingMethod(context, level, waterPlan.waterSpec);
                if (!selectedMethod) {
                    context.addChatMessage('You cannot fish here with your current level and tools.', 'warn');
                    if (typeof SkillActionResolution.stopSkill === 'function') SkillActionResolution.stopSkill(context, SKILL_ID, 'METHOD_INVALID');
                    else context.stopAction();
                    return;
                }
                context.playerState[ACTIVE_METHOD_STATE_KEY] = selectedMethod.methodId;
            }

            if (selectedMethod.requirementMissing) {
                const requirementName = selectedMethod.requirementItemId === 'bait' ? 'bait' : 'required item';
                context.addChatMessage('You need ' + requirementName + ' to continue fishing.', 'warn');
                if (typeof SkillActionResolution.stopSkill === 'function') SkillActionResolution.stopSkill(context, SKILL_ID, 'REQUIREMENT_MISSING');
                else context.stopAction();
                return;
            }

            if (!canAcceptAnyFish(context, selectedMethod.fishTable)) {
                if (typeof SkillActionResolution.stopSkill === 'function') {
                    SkillActionResolution.stopSkill(context, SKILL_ID, 'INVENTORY_FULL');
                } else {
                    context.stopAction();
                }
                context.addChatMessage('You have no inventory space for fish.', 'warn');
                return;
            }

            const catchChance = Number.isFinite(context.playerState.fishingCatchChance)
                ? context.playerState.fishingCatchChance
                : ((window.SkillSpecRegistry && typeof SkillSpecRegistry.computeLinearCatchChance === 'function')
                    ? SkillSpecRegistry.computeLinearCatchChance(level, waterPlan.waterSpec.unlockLevel, waterPlan.waterSpec.baseCatchChance, waterPlan.waterSpec.levelScaling, waterPlan.waterSpec.maxCatchChance)
                    : (waterPlan.waterSpec.baseCatchChance || 0.2));

            const pick = (window.SkillSpecRegistry && typeof SkillSpecRegistry.resolveWeighted === 'function')
                ? SkillSpecRegistry.resolveWeighted(selectedMethod.fishTable, context.random)
                : selectedMethod.fishTable[0];

            const activeTileId = Number.isFinite(context.playerState[ACTIVE_TILE_STATE_KEY])
                ? context.playerState[ACTIVE_TILE_STATE_KEY]
                : waterPlan.targetTileId;

            const requirement = getMethodRequirement(selectedMethod.methodSpec);
            const resolution = SkillActionResolution.runGatherAttempt(context, SKILL_ID, {
                targetTileId: activeTileId,
                successChance: catchChance,
                rewardItemId: pick ? pick.itemId : null,
                xpPerSuccess: pick ? (pick.xp || 0) : 0,
                onSuccess: () => {
                    // Rod+bait rule: bait is consumed only when a fish is successfully caught.
                    // Failed attempts consume no bait, but the rod still requires bait to keep fishing.
                    if (!requirement || requirement.consumeOn !== 'success' || !requirement.itemId) return;
                    const amount = Number.isFinite(requirement.amount) ? Math.max(1, requirement.amount) : 1;
                    if (typeof context.removeItemsById === 'function') {
                        context.removeItemsById(requirement.itemId, amount);
                    } else if (typeof context.removeOneItemById === 'function') {
                        for (let i = 0; i < amount; i++) context.removeOneItemById(requirement.itemId);
                    }
                    if (typeof context.renderInventory === 'function') context.renderInventory();
                }
            });

            if (resolution.status === 'stopped' && (resolution.reasonCode === 'INVENTORY_FULL' || resolution.reasonCode === 'INVENTORY_FULL_AFTER_GAIN')) {
                context.addChatMessage('You have no inventory space for fish.', 'warn');
            }
        },

        onAnimate(context) {
            return false;
        },

        getAnimationHeldItemId(context) {
            return getFishingToolVisualId(context);
        },

        getTooltip() {
            return '<span class="text-gray-300">Fish</span> <span class="text-cyan-400">Water</span>';
        },

        getContextMenu(context) {
            const waterPlan = resolveWaterSpecForTarget(context);
            const isDeepWater = !!(waterPlan && waterPlan.waterId === 'deep_water');

            const queueMethod = (methodId) => {
                if (methodId && typeof context.queueInteractAt === 'function') {
                    context.queueInteractAt('WATER', context.targetX, context.targetY, {
                        skillId: SKILL_ID,
                        fishingMethodId: methodId
                    });
                } else {
                    context.queueInteract();
                }
                context.spawnClickMarker(true);
            };

            const options = [];

            if (!isDeepWater && waterPlan && waterPlan.waterSpec) {
                const shallowOrder = ['net', 'rod', 'harpoon'];
                const methodEntries = getMethodEntries(waterPlan.waterSpec);
                for (let i = 0; i < shallowOrder.length; i++) {
                    const methodId = shallowOrder[i];
                    const methodEntry = methodEntries.find((entry) => entry.methodId === methodId);
                    if (!methodEntry) continue;
                    const toolIds = Array.isArray(methodEntry.methodSpec && methodEntry.methodSpec.toolIds)
                        ? methodEntry.methodSpec.toolIds
                        : [];
                    if (toolIds.length > 0 && !hasAnyTool(context, toolIds)) continue;
                    options.push({
                        text: getMethodMenuLabel(methodId) + ' <span class="text-cyan-400">Water</span>',
                        onSelect: () => queueMethod(methodId)
                    });
                }
            }

            if (options.length === 0 && isDeepWater) {
                const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
                const selectable = selectFishingMethod(context, level, waterPlan && waterPlan.waterSpec ? waterPlan.waterSpec : null);
                if (selectable) {
                    options.push({
                        text: 'Fish <span class="text-cyan-400">Water</span>',
                        onSelect: () => queueMethod(null)
                    });
                }
            }

            options.push({
                text: 'Examine <span class="text-cyan-400">Water</span>',
                onSelect: () => (window.ExamineCatalog ? window.ExamineCatalog.examineTarget('WATER', {}, (message, tone) => context.addChatMessage(message, tone)) : context.addChatMessage('The water looks fishable.', 'game'))
            });

            return options;
        }
    };

    window.SkillModules = window.SkillModules || {};
    window.SkillModules[SKILL_ID] = fishingModule;
})();



















