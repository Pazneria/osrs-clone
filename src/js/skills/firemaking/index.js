(function () {
    const SKILL_ID = 'firemaking';
    const FIREMAKING_XP = 40;

    function isValidFiremakingUse(context) {
        if (!context || context.targetObj !== 'GROUND') return false;
        return context.sourceItemId === 'logs' || context.sourceItemId === 'tinderbox';
    }

    const firemakingModule = {
        canStart(context) {
            return context.getInventoryCount('tinderbox') > 0 && context.getInventoryCount('logs') > 0;
        },

        onUseItem(context) {
            if (!isValidFiremakingUse(context)) return false;

            if (typeof context.haltMovement === 'function') context.haltMovement();

            return !!context.startSkillById(SKILL_ID, {
                skillId: SKILL_ID,
                targetObj: 'GROUND',
                sourceInvIndex: context.sourceInvIndex,
                sourceItemId: context.sourceItemId
            });
        },

        onStart(context) {
            if (!this.canStart(context)) {
                context.addChatMessage('You need logs and a tinderbox.', 'warn');
                return false;
            }

            const fireX = context.playerState.x;
            const fireY = context.playerState.y;
            const fireZ = context.playerState.z;

            // Hard-stop movement here as a safety net for any entry path.
            context.playerState.path = [];
            context.playerState.midX = null;
            context.playerState.midY = null;
            context.playerState.pendingActionAfterTurn = null;
            context.playerState.turnLock = false;
            context.playerState.actionVisualReady = true;
            context.playerState.action = 'IDLE';
            context.playerState.targetX = context.playerState.x;
            context.playerState.targetY = context.playerState.y;
            context.playerState.prevX = context.playerState.x;
            context.playerState.prevY = context.playerState.y;

            if (!context.lightFireAtCurrentTile(fireX, fireY, fireZ)) {
                return false;
            }

            context.removeOneItemById('logs');
            context.addSkillXp(SKILL_ID, FIREMAKING_XP);
            context.addChatMessage('You light the logs.', 'game');

            context.playerState.action = 'SKILLING: FIREMAKING';
            context.playerState.actionUntilTick = context.currentTick + 3;
            context.playerState.firemakingTarget = { x: fireX, y: fireY, z: fireZ };
            context.playerState.turnLock = false;
            context.playerState.actionVisualReady = true;
            context.renderInventory();
            return true;
        },

        onTick(context) {
            if (context.playerState.action !== 'SKILLING: FIREMAKING') return;
            if (context.currentTick < context.playerState.actionUntilTick) return;

            const fireTarget = context.playerState.firemakingTarget;
            if (fireTarget && fireTarget.z === context.playerState.z) {
                const stepped = context.tryStepAfterFire();
                if (stepped) {
                    const faceDx = fireTarget.x - context.playerState.x;
                    const faceDy = fireTarget.y - context.playerState.y;
                    if (faceDx !== 0 || faceDy !== 0) {
                        context.playerState.targetRotation = Math.atan2(faceDx, faceDy);
                        context.playerState.turnLock = true;
                        context.playerState.actionVisualReady = true;
                    }
                } else {
                    context.addChatMessage('You stay put because the way forward is blocked.', 'info');
                }
            }

            context.playerState.firemakingTarget = null;
            context.stopAction();
        },

        onAnimate(context) {
            if (!context.rig || !context.playerRig || typeof context.setShoulderPivot !== 'function') return;
            const rig = context.rig;
            const playerRig = context.playerRig;

            rig.axe.visible = false;
            playerRig.rotation.x = 0;
            context.setShoulderPivot(rig);

            const phase = ((context.frameNow % 700) / 700) * Math.PI * 2;
            const s = Math.sin(phase);

            rig.torso.rotation.set(0, 0.08 * s, 0);
            rig.head.rotation.set(0, 0.05 * s, 0);
            rig.rightArm.rotation.set(-0.9 + (s * 0.25), -0.2, -0.15);
            rig.rightLowerArm.rotation.set(-0.6 + (s * 0.35), -0.1, 0);
            rig.leftArm.rotation.set(-0.4, 0.15, 0.2);
            rig.leftLowerArm.rotation.set(-0.8, -0.2, 0);
            rig.leftLeg.rotation.x = 0;
        }
    };

    window.SkillModules = window.SkillModules || {};
    window.SkillModules[SKILL_ID] = firemakingModule;
})();
