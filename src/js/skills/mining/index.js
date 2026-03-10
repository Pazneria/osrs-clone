(function () {
    const SKILL_ID = 'mining';

    const domain = window.RunecraftingDomain || {};
    const ORE_TYPES = domain.ORE_TYPES || { RUNE_ESSENCE: 'rune_essence' };

    function getMiningNode(context) {
        if (!context || typeof context.getRockNodeAt !== 'function') return null;
        return context.getRockNodeAt(context.targetX, context.targetY, context.targetZ);
    }

    function getNodeSpec(context) {
        const node = getMiningNode(context);
        const table = typeof context.getNodeTable === 'function' ? context.getNodeTable(SKILL_ID) : null;
        if (!node || !table) return null;

        if (node.oreType === ORE_TYPES.RUNE_ESSENCE) return table.rune_essence || null;
        if (node.oreType === 'tin') return table.tin_rock || null;
        return table.copper_rock || null;
    }

    function getPickaxeContext(context) {
        const pickaxe = typeof context.getBestToolByClass === 'function' ? context.getBestToolByClass('pickaxe') : null;
        const toolPower = pickaxe
            ? (Number.isFinite(pickaxe.toolTier)
                ? pickaxe.toolTier
                : (pickaxe.stats && Number.isFinite(pickaxe.stats.atk) ? pickaxe.stats.atk : 0))
            : 0;
        const speedBonusTicks = pickaxe && Number.isFinite(pickaxe.speedBonusTicks) ? pickaxe.speedBonusTicks : 0;
        return { pickaxe, toolPower, speedBonusTicks };
    }

    function getAttemptConfig(context, nodeSpec) {
        const skillSpec = typeof context.getSkillSpec === 'function' ? context.getSkillSpec(SKILL_ID) : null;
        const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
        const pickaxeData = getPickaxeContext(context);

        const successChance = (window.SkillSpecRegistry && typeof SkillSpecRegistry.computeGatherSuccessChance === 'function')
            ? SkillSpecRegistry.computeGatherSuccessChance(level, pickaxeData.toolPower, nodeSpec.difficulty)
            : 0.25;

        const intervalTicks = (window.SkillSpecRegistry && typeof SkillSpecRegistry.computeIntervalTicks === 'function')
            ? SkillSpecRegistry.computeIntervalTicks(skillSpec && skillSpec.timing ? skillSpec.timing.baseAttemptTicks : 4, skillSpec && skillSpec.timing ? skillSpec.timing.minimumAttemptTicks : 1, pickaxeData.speedBonusTicks)
            : 1;

        return {
            level,
            pickaxeData,
            successChance,
            intervalTicks
        };
    }

    const miningModule = {
        canStart(context) {
            const nodeSpec = getNodeSpec(context);
            if (!nodeSpec) return false;
            const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
            const hasCapacity = typeof context.canAcceptItemById !== 'function' || context.canAcceptItemById(nodeSpec.rewardItemId, 1);
            return context.hasToolClass('pickaxe')
                && context.isTargetTile(nodeSpec.tileId)
                && level >= (nodeSpec.requiredLevel || 1)
                && hasCapacity;
        },

        onStart(context) {
            const nodeSpec = getNodeSpec(context);
            if (!nodeSpec) return false;

            if (typeof context.canAcceptItemById === 'function' && !context.canAcceptItemById(nodeSpec.rewardItemId, 1)) {
                context.addChatMessage('You have no inventory space for ore.', 'warn');
                return false;
            }

            if (typeof context.requireSkillLevel === 'function' && !context.requireSkillLevel(nodeSpec.requiredLevel || 1, { skillId: SKILL_ID, action: 'mine this rock' })) return false;

            if (!this.canStart(context)) return false;

            const attempt = getAttemptConfig(context, nodeSpec);
            if (window.SkillActionResolution && typeof SkillActionResolution.startGatherSession === 'function') {
                SkillActionResolution.startGatherSession(context, SKILL_ID, attempt.intervalTicks);
            }

            context.startSkillingAction();
            return true;
        },

        onTick(context) {
            const nodeSpec = getNodeSpec(context);
            if (!nodeSpec || !window.SkillActionResolution || typeof SkillActionResolution.runGatherAttempt !== 'function') {
                context.stopAction();
                return;
            }

            if (typeof context.canAcceptItemById === 'function' && !context.canAcceptItemById(nodeSpec.rewardItemId, 1)) {
                if (typeof SkillActionResolution.stopSkill === 'function') {
                    SkillActionResolution.stopSkill(context, SKILL_ID, 'INVENTORY_FULL');
                } else {
                    context.stopAction();
                }
                context.addChatMessage('You have no inventory space for ore.', 'warn');
                return;
            }

            const attempt = getAttemptConfig(context, nodeSpec);
            const resolution = SkillActionResolution.runGatherAttempt(context, SKILL_ID, {
                targetTileId: nodeSpec.tileId,
                successChance: attempt.successChance,
                rewardItemId: nodeSpec.rewardItemId,
                xpPerSuccess: nodeSpec.xpPerSuccess,
                onSuccess: (ctx) => {
                    if (nodeSpec.persistent) return;
                    if (!window.SkillSharedUtils || typeof SkillSharedUtils.rollChance !== 'function') return;
                    if (SkillSharedUtils.rollChance(nodeSpec.depletionChance, ctx.random)) {
                        ctx.depleteRockNode(ctx.targetX, ctx.targetY, ctx.targetZ, nodeSpec.respawnTicks || 12);
                        if (window.SkillActionResolution && typeof SkillActionResolution.stopSkill === 'function') {
                            SkillActionResolution.stopSkill(ctx, SKILL_ID, 'NODE_DEPLETED');
                        } else {
                            ctx.stopAction();
                        }
                    }
                }
            });

            if (resolution.status === 'stopped' && (resolution.reasonCode === 'INVENTORY_FULL' || resolution.reasonCode === 'INVENTORY_FULL_AFTER_GAIN')) {
                context.addChatMessage('You have no inventory space for ore.', 'warn');
            }
        },

        onAnimate(context) {
            if (!context.rig || typeof context.applyRockMiningPose !== 'function') return;
            const pickaxeData = getPickaxeContext(context);
            if (pickaxeData.pickaxe && typeof context.setToolVisualById === 'function') context.setToolVisualById(pickaxeData.pickaxe.id);
            context.applyRockMiningPose(context.rig, context.frameNow, context.baseVisualY, !!pickaxeData.pickaxe);
        },

        getTooltip(context) {
            const nodeSpec = getNodeSpec(context);
            if (!nodeSpec || !context.isTargetTile(nodeSpec.tileId)) return '';
            if (nodeSpec.rewardItemId === 'rune_essence') {
                return '<span class="text-gray-300">Mine</span> <span class="text-purple-300">Rune essence</span>';
            }
            return '<span class="text-gray-300">Mine</span> <span class="text-cyan-400">Rock</span>';
        },

        getContextMenu(context) {
            const nodeSpec = getNodeSpec(context);
            if (!nodeSpec || !context.isTargetTile(nodeSpec.tileId)) {
                return [{ text: 'Examine Rock', onSelect: () => console.log('EXAMINING: A solid chunk of rock.') }];
            }

            if (nodeSpec.rewardItemId === 'rune_essence') {
                return [
                    {
                        text: 'Mine Rune essence',
                        onSelect: () => {
                            context.queueInteract();
                            context.spawnClickMarker(true);
                        }
                    },
                    { text: 'Examine Rune essence', onSelect: () => console.log('EXAMINING: Pure rune essence.') }
                ];
            }

            return [
                {
                    text: 'Mine Rock',
                    onSelect: () => {
                        context.queueInteract();
                        context.spawnClickMarker(true);
                    }
                },
                { text: 'Examine Rock', onSelect: () => console.log('EXAMINING: A solid chunk of rock.') }
            ];
        }
    };

    window.SkillModules = window.SkillModules || {};
    window.SkillModules[SKILL_ID] = miningModule;
})();

