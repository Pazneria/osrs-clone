(function () {
    const SKILL_ID = 'woodcutting';
    const CHOP_CHANCE = 0.25;
    const CHOP_XP = 25;
    const STUMP_CHANCE = 0.2;

    const woodcuttingModule = {
        canStart(context) {
            return context.hasToolClass('axe') && context.isTargetTile(1);
        },

        onStart(context) {
            if (!this.canStart(context)) return false;
            context.autoEquipToolClass('axe');
            context.startSkillingAction();
            return true;
        },

        onTick(context) {
            if (!context.isTargetTile(1)) {
                context.stopAction();
                return;
            }

            if (!(window.SkillSharedUtils && SkillSharedUtils.rollChance(CHOP_CHANCE, context.random))) return;

            if (context.giveItemById('logs', 1) > 0) {
                context.addSkillXp(SKILL_ID, CHOP_XP);
                if (window.SkillSharedUtils && SkillSharedUtils.rollChance(STUMP_CHANCE, context.random)) {
                    context.chopDownTree(context.targetX, context.targetY, context.targetZ);
                    context.stopAction();
                }
            } else {
                context.stopAction();
            }
        },

        onAnimate(context) {
            if (!context.rig || !context.playerRig || typeof context.setShoulderPivot !== 'function' || !context.shoulderPivot) return;
            const rig = context.rig;
            const playerRig = context.playerRig;
            const pivot = context.shoulderPivot;

            if (!context.playerState.actionVisualReady) {
                rig.axe.visible = true;
                context.setShoulderPivot(rig);
                rig.leftArm.rotation.set(0, 0, 0); rig.rightArm.rotation.set(0, 0, 0);
                rig.leftLowerArm.rotation.set(0, 0, 0); rig.rightLowerArm.rotation.set(0, 0, 0);
                rig.torso.rotation.set(0, 0, 0); rig.head.rotation.set(0, 0, 0);
                rig.leftLeg.rotation.x = 0; rig.rightLeg.rotation.x = 0;
                if (rig.leftLowerLeg) rig.leftLowerLeg.rotation.x = 0;
                if (rig.rightLowerLeg) rig.rightLowerLeg.rotation.x = 0;
                playerRig.position.y = context.baseVisualY;
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
            rig.leftLeg.rotation.x = 0; rig.rightLeg.rotation.x = 0;
            if (rig.leftLowerLeg) rig.leftLowerLeg.rotation.x = 0;
            if (rig.rightLowerLeg) rig.rightLowerLeg.rotation.x = 0;
            playerRig.position.y = context.baseVisualY;
        },

        getTooltip(context) {
            if (!context.isTargetTile(1)) return '';
            return '<span class="text-gray-300">Chop down</span> <span class="text-cyan-400">Tree</span>';
        },

        getContextMenu(context) {
            if (context.isTargetTile(1)) {
                return [
                    {
                        text: 'Chop down Tree',
                        onSelect: () => {
                            context.queueInteract();
                            context.spawnClickMarker(true);
                        }
                    },
                    { text: 'Examine Tree', onSelect: () => console.log('EXAMINING: A fully grown tree.') }
                ];
            }

            if (context.isTargetTile(4)) {
                return [{ text: 'Examine Stump', onSelect: () => console.log('EXAMINING: A sad looking stump.') }];
            }

            return null;
        }
    };

    window.SkillModules = window.SkillModules || {};
    window.SkillModules[SKILL_ID] = woodcuttingModule;
})();
