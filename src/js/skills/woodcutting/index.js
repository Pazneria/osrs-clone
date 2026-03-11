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
            if (!context.rig || !context.playerRig || typeof context.setShoulderPivot !== 'function' || !context.shoulderPivot) return;
            const rig = context.rig;
            const playerRig = context.playerRig;
            const pivot = context.shoulderPivot;
            const bestAxe = typeof context.getBestToolByClass === 'function' ? context.getBestToolByClass('axe') : null;
            if (bestAxe && typeof context.setToolVisualById === 'function') context.setToolVisualById(bestAxe.id);

            if (window.SkillSharedUtils && SkillSharedUtils.applyReadyStateOrContinue(context, { showTool: true })) {
                return;
            }

            rig.axe.visible = true;
            playerRig.rotation.x = 0;
            rig.torso.rotation.x = 0;
            rig.head.rotation.x = 0;
            context.setShoulderPivot(rig);

            const playerT = context.frameNow % 1200;
            let pSwingFactor = 0;
            if (playerT < 200) pSwingFactor = 0;
            else if (playerT < 900) pSwingFactor = (Math.cos(((playerT - 200) / 700) * Math.PI - Math.PI) + 1) / 2;
            else pSwingFactor = (Math.cos(((playerT - 900) / 300) * Math.PI) + 1) / 2;

            const deg = Math.PI / 180;
            const pCurrentInwardAngle = (35 * deg) - pSwingFactor * (0.6 + (35 * deg));
            const torsoTwist = pSwingFactor * -30 * deg;

            rig.torso.rotation.y = torsoTwist;
            rig.head.rotation.y = torsoTwist * 0.4;

            const leftShoulderBase = { x: pivot.x, z: pivot.z };
            const rightShoulderBase = { x: -pivot.x, z: pivot.z };
            const cosTwist = Math.cos(torsoTwist);
            const sinTwist = Math.sin(torsoTwist);
            rig.leftArm.position.set(leftShoulderBase.x * cosTwist + leftShoulderBase.z * sinTwist, pivot.y, -leftShoulderBase.x * sinTwist + leftShoulderBase.z * cosTwist);
            rig.rightArm.position.set(rightShoulderBase.x * cosTwist + rightShoulderBase.z * sinTwist, pivot.y, -rightShoulderBase.x * sinTwist + rightShoulderBase.z * cosTwist);

            rig.rightArm.rotation.x = -55 * deg;
            rig.rightArm.rotation.y = torsoTwist * 0.9 - (10 * deg * pSwingFactor);
            rig.rightArm.rotation.z = pCurrentInwardAngle;
            rig.rightLowerArm.rotation.x = -45 * deg;
            rig.rightLowerArm.rotation.y = ((1 - pSwingFactor) * (-65 * deg)) + (torsoTwist * 0.5);

            rig.leftArm.rotation.x = -8 * deg;
            rig.leftArm.rotation.y = torsoTwist * 0.9 + (-15 * deg * pSwingFactor);
            rig.leftArm.rotation.z = 12 * deg;
            rig.leftLowerArm.rotation.x = -75 * deg;
            rig.leftLowerArm.rotation.y = (-45 * deg) + (torsoTwist * 0.35);
            rig.leftLowerArm.rotation.z = 0;

            rig.axe.rotation.set(0, 0, 0);
            rig.leftLeg.rotation.x = 0;
            rig.rightLeg.rotation.x = 0;
            if (rig.leftLowerLeg) rig.leftLowerLeg.rotation.x = 0;
            if (rig.rightLowerLeg) rig.rightLowerLeg.rotation.x = 0;
            playerRig.position.y = context.baseVisualY;
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
