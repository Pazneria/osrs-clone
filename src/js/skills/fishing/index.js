(function () {
    const SKILL_ID = 'fishing';
    const FISH_CHANCE = 0.28;
    const FISH_XP = 20;

    const fishingModule = {
        canStart(context) {
            return context.hasItem('small_net') && context.isTargetTile(22);
        },

        onStart(context) {
            if (!this.canStart(context)) return false;
            context.startSkillingAction();
            return true;
        },

        onTick(context) {
            if (!context.isTargetTile(22)) {
                context.stopAction();
                return;
            }

            if (!(window.SkillSharedUtils && SkillSharedUtils.rollChance(FISH_CHANCE, context.random))) return;

            if (context.giveItemById('raw_shrimp', 1) > 0) {
                context.addSkillXp(SKILL_ID, FISH_XP);
            } else {
                context.addChatMessage('You have no inventory space for fish.', 'warn');
                context.stopAction();
            }
        },

        onAnimate(context) {
            if (!context.rig || !context.playerRig || typeof context.setShoulderPivot !== 'function') return;
            const rig = context.rig;
            const playerRig = context.playerRig;

            if (!context.playerState.actionVisualReady) {
                rig.axe.visible = false;
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

            rig.axe.visible = false;
            playerRig.rotation.x = 0;

            const fishPhase = (context.frameNow % 900) / 900 * Math.PI * 2;
            const rodPull = Math.sin(fishPhase);
            const torsoTwist = rodPull * 0.16;
            const bob = Math.max(0, Math.sin(fishPhase + Math.PI * 0.25)) * 0.04;

            rig.torso.rotation.set(-0.08, torsoTwist, 0);
            rig.head.rotation.set(0, torsoTwist * 0.45, 0);
            context.setShoulderPivot(rig);
            rig.leftArm.rotation.set(-0.35 + (rodPull * -0.15), torsoTwist * 0.55, 0.2);
            rig.rightArm.rotation.set(-0.7 + (rodPull * 0.25), torsoTwist * 0.85, -0.18);
            rig.leftLowerArm.rotation.set(-0.55, 0.08 + (rodPull * -0.14), 0);
            rig.rightLowerArm.rotation.set(-0.95 + (rodPull * 0.12), -0.12, 0);
            rig.leftLeg.rotation.x = 0.05;
            rig.rightLeg.rotation.x = -0.05;
            playerRig.position.y = context.baseVisualY + bob;
        },

        getTooltip() {
            return '<span class="text-gray-300">Net</span> <span class="text-cyan-400">Fishing spot</span>';
        },

        getContextMenu(context) {
            return [
                {
                    text: 'Net <span class="text-cyan-400">Fishing spot</span>',
                    onSelect: () => {
                        context.queueInteract();
                        context.spawnClickMarker(true);
                    }
                },
                {
                    text: 'Examine <span class="text-cyan-400">Fishing spot</span>',
                    onSelect: () => console.log('EXAMINING: A good place to catch fish.')
                }
            ];
        }
    };

    window.SkillModules = window.SkillModules || {};
    window.SkillModules[SKILL_ID] = fishingModule;
})();
