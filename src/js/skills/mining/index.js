(function () {
    const SKILL_ID = 'mining';

    const ORE_TYPE_TO_NODE_KEY = {
        clay: 'clay_rock',
        copper: 'copper_rock',
        tin: 'tin_rock',
        rune_essence: 'rune_essence',
        iron: 'iron_rock',
        coal: 'coal_rock',
        silver: 'silver_rock',
        sapphire: 'sapphire_rock',
        gold: 'gold_rock',
        emerald: 'emerald_rock'
    };

    const ORE_TYPE_TO_LABEL = {
        clay: 'Clay rock',
        copper: 'Copper rock',
        tin: 'Tin rock',
        rune_essence: 'Rune essence',
        iron: 'Iron rock',
        coal: 'Coal rock',
        silver: 'Silver rock',
        sapphire: 'Sapphire rock',
        gold: 'Gold rock',
        emerald: 'Emerald rock'
    };

    const ORE_TYPE_TO_HIGHLIGHT = {
        clay: 'text-amber-300',
        copper: 'text-orange-300',
        tin: 'text-slate-300',
        rune_essence: 'text-purple-300',
        iron: 'text-zinc-300',
        coal: 'text-gray-300',
        silver: 'text-neutral-200',
        sapphire: 'text-blue-300',
        gold: 'text-yellow-300',
        emerald: 'text-emerald-300'
    };

    function getMiningNode(context) {
        if (!context || typeof context.getRockNodeAt !== 'function') return null;
        return context.getRockNodeAt(context.targetX, context.targetY, context.targetZ);
    }

    function getNodeSpec(context) {
        const node = getMiningNode(context);
        const table = typeof context.getNodeTable === 'function' ? context.getNodeTable(SKILL_ID) : null;
        if (!node || !table || !node.oreType) return null;

        const nodeKey = ORE_TYPE_TO_NODE_KEY[node.oreType] || null;
        if (!nodeKey) return null;
        return table[nodeKey] || null;
    }

    function getNodeLabel(nodeSpec) {
        if (!nodeSpec || !nodeSpec.oreType) return 'Rock';
        return ORE_TYPE_TO_LABEL[nodeSpec.oreType] || 'Rock';
    }

    function getNodeHighlightClass(nodeSpec) {
        if (!nodeSpec || !nodeSpec.oreType) return 'text-cyan-400';
        return ORE_TYPE_TO_HIGHLIGHT[nodeSpec.oreType] || 'text-cyan-400';
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
            return context.hasToolClass('pickaxe')
                && context.isTargetTile(nodeSpec.tileId);
        },

        onStart(context) {
            const nodeSpec = getNodeSpec(context);
            if (!nodeSpec) return false;

            if (typeof context.canAcceptItemById === 'function' && !context.canAcceptItemById(nodeSpec.rewardItemId, 1)) {
                context.addChatMessage('You have no inventory space for mined items.', 'warn');
                return false;
            }

            const requiredLevel = Number.isFinite(nodeSpec.requiredLevel) ? Math.max(1, Math.floor(nodeSpec.requiredLevel)) : 1;
            const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
            if (level < requiredLevel) {
                context.addChatMessage(`You must be level ${requiredLevel} Mining to mine this rock.`, 'warn');
                return false;
            }

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
                context.addChatMessage('You have no inventory space for mined items.', 'warn');
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
                context.addChatMessage('You have no inventory space for mined items.', 'warn');
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

            const label = getNodeLabel(nodeSpec);
            const highlight = getNodeHighlightClass(nodeSpec);
            const requiredLevel = Number.isFinite(nodeSpec.requiredLevel) ? Math.max(1, Math.floor(nodeSpec.requiredLevel)) : 1;
            const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
            if (level < requiredLevel) {
                return `<span class="text-gray-300">Mine</span> <span class="${highlight}">${label}</span> <span class="text-red-300">(You must be level ${requiredLevel})</span>`;
            }
            return `<span class="text-gray-300">Mine</span> <span class="${highlight}">${label}</span>`;
        },

        getContextMenu(context) {
            const nodeSpec = getNodeSpec(context);
            if (!nodeSpec || !context.isTargetTile(nodeSpec.tileId)) {
                return [{ text: 'Examine Rock', onSelect: () => (window.ExamineCatalog ? window.ExamineCatalog.examineTarget('ROCK', {}, (message, tone) => context.addChatMessage(message, tone)) : context.addChatMessage('A solid chunk of rock.', 'game')) }];
            }

            const label = getNodeLabel(nodeSpec);
            const requiredLevel = Number.isFinite(nodeSpec.requiredLevel) ? Math.max(1, Math.floor(nodeSpec.requiredLevel)) : 1;
            const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
            const mineText = level < requiredLevel
                ? `Mine ${label} (Level ${requiredLevel})`
                : `Mine ${label}`;

            return [
                {
                    text: mineText,
                    onSelect: () => {
                        context.queueInteract();
                        context.spawnClickMarker(true);
                    }
                },
                {
                    text: `Examine ${label}`,
                    onSelect: () => (window.ExamineCatalog
                        ? window.ExamineCatalog.examineTarget('ROCK', { oreType: nodeSpec.oreType }, (message, tone) => context.addChatMessage(message, tone))
                        : context.addChatMessage('A solid chunk of rock.', 'game'))
                }
            ];
        }
    };

    window.SkillModules = window.SkillModules || {};
    window.SkillModules[SKILL_ID] = miningModule;
})();

