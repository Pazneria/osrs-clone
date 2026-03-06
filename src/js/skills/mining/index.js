(function () {
    const SKILL_ID = 'mining';
    const MINING_CHANCE = 0.25;
    const MINING_XP = 25;
    const DEPLETION_CHANCE = 0.2;
    const RUNE_ESSENCE_XP = 8;

    function getMiningNode(context) {
        if (!context || typeof context.getRockNodeAt !== 'function') return null;
        return context.getRockNodeAt(context.targetX, context.targetY, context.targetZ);
    }

    function isRuneEssenceNode(context) {
        const node = getMiningNode(context);
        return !!(node && node.oreType === 'rune_essence');
    }

    const miningModule = {
        canStart(context) {
            return context.hasToolClass('pickaxe') && context.isTargetTile(2);
        },

        onStart(context) {
            if (!this.canStart(context)) return false;
            context.startSkillingAction();
            return true;
        },

        onTick(context) {
            if (isRuneEssenceNode(context)) {
                if (!context.isTargetTile(2)) {
                    context.stopAction();
                    return;
                }
                if (context.giveItemById('rune_essence', 1) > 0) {
                    context.addSkillXp(SKILL_ID, RUNE_ESSENCE_XP);
                } else {
                    context.stopAction();
                }
                return;
            }

            if (!window.SkillSharedUtils || typeof SkillSharedUtils.runGatherTick !== 'function') return;
            SkillSharedUtils.runGatherTick(context, {
                targetTileId: 2,
                successChance: MINING_CHANCE,
                skillId: SKILL_ID,
                xp: MINING_XP,
                reward: (ctx) => {
                    const node = getMiningNode(ctx);
                    if (node && node.oreType === 'tin') return 'tin_ore';
                    return 'copper_ore';
                },
                onReward: (ctx) => {
                    if (SkillSharedUtils.rollChance(DEPLETION_CHANCE, ctx.random)) {
                        ctx.depleteRockNode(ctx.targetX, ctx.targetY, ctx.targetZ, 12);
                        ctx.stopAction();
                    }
                }
            });
        },

        onAnimate(context) {
            if (!context.rig || typeof context.applyRockMiningPose !== 'function') return;
            const bestPickaxe = typeof context.getBestToolByClass === 'function' ? context.getBestToolByClass('pickaxe') : null;
            if (bestPickaxe && typeof context.setToolVisualById === 'function') context.setToolVisualById(bestPickaxe.id);
            context.applyRockMiningPose(context.rig, context.frameNow, context.baseVisualY, !!bestPickaxe);
        },

        getTooltip(context) {
            if (!context.isTargetTile(2)) return '';
            if (isRuneEssenceNode(context)) {
                return '<span class="text-gray-300">Mine</span> <span class="text-purple-300">Rune essence</span>';
            }
            return '<span class="text-gray-300">Mine</span> <span class="text-cyan-400">Rock</span>';
        },

        getContextMenu(context) {
            if (!context.isTargetTile(2)) {
                return [{ text: 'Examine Rock', onSelect: () => console.log('EXAMINING: A solid chunk of rock.') }];
            }

            if (isRuneEssenceNode(context)) {
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


