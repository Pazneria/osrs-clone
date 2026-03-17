(function () {
    const SKILL_ID = 'woodcutting';
    const DEFAULT_NODE_ID = 'normal_tree';
    const TREE_NODE_NAMES = {
        normal_tree: 'Tree',
        oak_tree: 'Oak tree',
        willow_tree: 'Willow tree',
        maple_tree: 'Maple tree',
        yew_tree: 'Yew tree'
    };

    function getNodeTable(context) {
        return typeof context.getNodeTable === 'function' ? context.getNodeTable(SKILL_ID) : null;
    }

    function getTreeNodeMeta(context) {
        if (typeof context.getTreeNodeAt === 'function') {
            const node = context.getTreeNodeAt(context.targetX, context.targetY, context.targetZ);
            if (node && typeof node === 'object') return node;
        }
        return { nodeId: DEFAULT_NODE_ID };
    }

    function getNodeSpec(context) {
        const table = getNodeTable(context);
        if (!table) return null;
        const nodeMeta = getTreeNodeMeta(context);
        const nodeId = (nodeMeta && typeof nodeMeta.nodeId === 'string' && table[nodeMeta.nodeId])
            ? nodeMeta.nodeId
            : DEFAULT_NODE_ID;
        return table[nodeId] || null;
    }

    function getNodeDisplayName(context) {
        const nodeMeta = getTreeNodeMeta(context);
        const nodeId = nodeMeta && typeof nodeMeta.nodeId === 'string' ? nodeMeta.nodeId : DEFAULT_NODE_ID;
        return TREE_NODE_NAMES[nodeId] || 'Tree';
    }

    function getRewardName(context, nodeSpec) {
        if (!nodeSpec || !nodeSpec.rewardItemId || typeof context.getItemDataById !== 'function') return 'logs';
        const item = context.getItemDataById(nodeSpec.rewardItemId);
        if (!item || typeof item.name !== 'string' || !item.name.trim()) return 'logs';
        return item.name.toLowerCase();
    }

    function ensureAreaAccess(context, nodeMeta, silent) {
        if (!nodeMeta || !nodeMeta.areaGateFlag || typeof context.requireAreaAccess !== 'function') return true;
        return context.requireAreaAccess({
            flagId: nodeMeta.areaGateFlag,
            areaName: nodeMeta.areaName || 'this grove',
            message: nodeMeta.areaGateMessage || null,
            silent: !!silent
        });
    }

    function resolveAttemptConfig(context, nodeSpec) {
        const skillSpec = typeof context.getSkillSpec === 'function' ? context.getSkillSpec(SKILL_ID) : null;
        const bestAxe = typeof context.getBestToolByClass === 'function' ? context.getBestToolByClass('axe') : null;
        const toolPower = bestAxe ? (Number.isFinite(bestAxe.toolTier) ? bestAxe.toolTier : (bestAxe.stats && Number.isFinite(bestAxe.stats.atk) ? bestAxe.stats.atk : 0)) : 0;
        const speedBonus = bestAxe && Number.isFinite(bestAxe.speedBonusTicks) ? bestAxe.speedBonusTicks : 0;
        const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;

        const successChance = (window.SkillSpecRegistry && typeof SkillSpecRegistry.computeGatherSuccessChance === 'function')
            ? SkillSpecRegistry.computeGatherSuccessChance(level, toolPower, nodeSpec.difficulty)
            : 0.25;

        const intervalTicks = (window.SkillSpecRegistry && typeof SkillSpecRegistry.computeIntervalTicks === 'function')
            ? SkillSpecRegistry.computeIntervalTicks(skillSpec && skillSpec.timing ? skillSpec.timing.baseAttemptTicks : 4, skillSpec && skillSpec.timing ? skillSpec.timing.minimumAttemptTicks : 1, speedBonus)
            : 1;

        return { successChance, intervalTicks };
    }

    const woodcuttingModule = {
        canStart(context) {
            const nodeSpec = getNodeSpec(context);
            if (!nodeSpec) return false;
            return context.hasToolClass('axe') && context.isTargetTile(nodeSpec.tileId);
        },

        onStart(context) {
            const nodeSpec = getNodeSpec(context);
            if (!nodeSpec) return false;
            const nodeMeta = getTreeNodeMeta(context);
            const rewardName = getRewardName(context, nodeSpec);
            if (typeof context.canAcceptItemById === 'function' && !context.canAcceptItemById(nodeSpec.rewardItemId, 1)) {
                context.addChatMessage(`You have no inventory space for ${rewardName}.`, 'warn');
                return false;
            }
            if (!ensureAreaAccess(context, nodeMeta, false)) return false;

            const requiredLevel = nodeSpec.requiredLevel || 1;
            const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
            if (level < requiredLevel) {
                context.addChatMessage(`you must be level ${requiredLevel} woodcutting to chop this tree`, 'warn');
                return false;
            }

            if (!this.canStart(context)) return false;
            const attempt = resolveAttemptConfig(context, nodeSpec);
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

            const rewardName = getRewardName(context, nodeSpec);
            if (typeof context.canAcceptItemById === 'function' && !context.canAcceptItemById(nodeSpec.rewardItemId, 1)) {
                if (window.SkillActionResolution && typeof SkillActionResolution.stopSkill === 'function') {
                    SkillActionResolution.stopSkill(context, SKILL_ID, 'INVENTORY_FULL');
                } else {
                    context.stopAction();
                }
                context.addChatMessage(`You have no inventory space for ${rewardName}.`, 'warn');
                return;
            }

            const attempt = resolveAttemptConfig(context, nodeSpec);
            const resolution = SkillActionResolution.runGatherAttempt(context, SKILL_ID, {
                targetTileId: nodeSpec.tileId,
                successChance: attempt.successChance,
                rewardItemId: nodeSpec.rewardItemId,
                xpPerSuccess: nodeSpec.xpPerSuccess,
                onSuccess: (ctx) => {
                    if (!window.SkillSharedUtils || typeof SkillSharedUtils.rollChance !== 'function') return;
                    if (SkillSharedUtils.rollChance(nodeSpec.depletionChance, ctx.random)) {
                        ctx.chopDownTree(ctx.targetX, ctx.targetY, ctx.targetZ);
                        if (window.SkillActionResolution && typeof SkillActionResolution.stopSkill === 'function') {
                            SkillActionResolution.stopSkill(ctx, SKILL_ID, 'NODE_DEPLETED');
                        } else {
                            ctx.stopAction();
                        }
                    }
                }
            });

            if (resolution.status === 'stopped' && (resolution.reasonCode === 'INVENTORY_FULL' || resolution.reasonCode === 'INVENTORY_FULL_AFTER_GAIN')) {
                context.addChatMessage(`You have no inventory space for ${rewardName}.`, 'warn');
            }
        },

        onAnimate(context) {
            return false;
        },

        getAnimationHeldItemId(context) {
            const bestAxe = typeof context.getBestToolByClass === 'function' ? context.getBestToolByClass('axe') : null;
            return bestAxe ? bestAxe.id : null;
        },

        getTooltip(context) {
            const nodeSpec = getNodeSpec(context);
            if (!nodeSpec || !context.isTargetTile(nodeSpec.tileId)) return '';
            const nodeName = getNodeDisplayName(context);
            return `<span class="text-gray-300">Chop down</span> <span class="text-cyan-400">${nodeName}</span>`;
        },

        getContextMenu(context) {
            const nodeSpec = getNodeSpec(context);
            const nodeName = getNodeDisplayName(context);
            if (nodeSpec && context.isTargetTile(nodeSpec.tileId)) {
                return [
                    {
                        text: `Chop down ${nodeName}`,
                        onSelect: () => {
                            context.queueInteract();
                            context.spawnClickMarker(true);
                        }
                    },
                    { text: `Examine ${nodeName}`, onSelect: () => (window.ExamineCatalog ? window.ExamineCatalog.examineTarget('TREE', { nodeId: getTreeNodeMeta(context).nodeId }, (message, tone) => context.addChatMessage(message, tone)) : context.addChatMessage('A fully grown tree.', 'game')) }
                ];
            }

            if (context.isTargetTile(4)) {
                return [{ text: 'Examine Stump', onSelect: () => (window.ExamineCatalog ? window.ExamineCatalog.examineTarget('STUMP', {}, (message, tone) => context.addChatMessage(message, tone)) : context.addChatMessage('A sad reminder of a tree.', 'game')) }];
            }

            return null;
        }
    };

    window.SkillModules = window.SkillModules || {};
    window.SkillModules[SKILL_ID] = woodcuttingModule;
})();
