(function () {
    const SKILL_ID = 'firemaking';

    function getLogRecipe(context) {
        const recipes = typeof context.getRecipeSet === 'function' ? context.getRecipeSet(SKILL_ID) : null;
        return recipes ? recipes.logs : null;
    }

    function isValidFiremakingUse(context) {
        if (!context || context.targetObj !== 'GROUND') return false;
        return context.sourceItemId === 'logs' || context.sourceItemId === 'tinderbox';
    }

    function getAttemptInterval(recipe, skillSpec) {
        if (recipe && Number.isFinite(recipe.ignitionAttemptTicks)) return Math.max(1, recipe.ignitionAttemptTicks);
        if (skillSpec && skillSpec.timing && Number.isFinite(skillSpec.timing.ignitionAttemptTicks)) return Math.max(1, skillSpec.timing.ignitionAttemptTicks);
        return 1;
    }

    function startContinuousFiremaking(context, recipe) {
        const skillSpec = typeof context.getSkillSpec === 'function' ? context.getSkillSpec(SKILL_ID) : null;
        const attemptInterval = getAttemptInterval(recipe, skillSpec);

        context.playerState.firemakingSession = {
            phase: 'attempting',
            target: { x: context.playerState.x, y: context.playerState.y, z: context.playerState.z },
            sourceItemId: recipe.sourceItemId,
            attemptInterval,
            nextAttemptTick: context.currentTick
        };

        context.playerState.action = 'SKILLING: FIREMAKING';
        context.playerState.turnLock = false;
        context.playerState.actionVisualReady = true;
        return true;
    }

    const firemakingModule = {
        canStart(context) {
            const recipe = getLogRecipe(context);
            if (!recipe) return false;
            const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
            return level >= (recipe.requiredLevel || 1)
                && context.getInventoryCount('tinderbox') > 0
                && context.getInventoryCount(recipe.sourceItemId) > 0;
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
            const recipe = getLogRecipe(context);
            if (!recipe) {
                context.addChatMessage('You need logs and a tinderbox.', 'warn');
                return false;
            }
            if (typeof context.requireSkillLevel === 'function' && !context.requireSkillLevel(recipe.requiredLevel || 1, { skillId: SKILL_ID, action: 'light these logs' })) {
                return false;
            }
            if (context.getInventoryCount('tinderbox') <= 0 || context.getInventoryCount(recipe.sourceItemId) <= 0) {
                context.addChatMessage('You need logs and a tinderbox.', 'warn');
                return false;
            }

            context.haltMovement();

            const target = { x: context.playerState.x, y: context.playerState.y, z: context.playerState.z };
            if (context.hasActiveFireAt(target.x, target.y, target.z)) {
                context.addChatMessage('There is already a fire here.', 'warn');
                return false;
            }

            context.addChatMessage('You begin trying to light the logs.', 'info');
            return startContinuousFiremaking(context, recipe);
        },

        onTick(context) {
            if (context.playerState.action !== 'SKILLING: FIREMAKING') return;
            const recipe = getLogRecipe(context);
            const session = context.playerState.firemakingSession;
            if (!recipe || !session) {
                context.stopAction();
                context.playerState.firemakingSession = null;
                return;
            }

            if (session.phase === 'post_success') {
                if (context.currentTick < (session.finishTick || 0)) return;
                const fireTarget = session.target;
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

                context.playerState.firemakingSession = null;
                context.stopAction();
                return;
            }

            if (context.currentTick < (session.nextAttemptTick || 0)) return;

            if (context.getInventoryCount('tinderbox') <= 0 || context.getInventoryCount(recipe.sourceItemId) <= 0) {
                context.addChatMessage('You need logs and a tinderbox.', 'warn');
                context.playerState.firemakingSession = null;
                context.stopAction();
                return;
            }

            const target = session.target;
            if (!target || context.playerState.x !== target.x || context.playerState.y !== target.y || context.playerState.z !== target.z) {
                context.playerState.firemakingSession = null;
                context.stopAction();
                return;
            }

            if (context.hasActiveFireAt(target.x, target.y, target.z)) {
                context.addChatMessage('There is already a fire here.', 'warn');
                context.playerState.firemakingSession = null;
                context.stopAction();
                return;
            }

            const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
            const successChance = (window.SkillSpecRegistry && typeof SkillSpecRegistry.computeSuccessChanceFromDifficulty === 'function')
                ? SkillSpecRegistry.computeSuccessChanceFromDifficulty(level, recipe.ignitionDifficulty)
                : 0.7;

            const rollChance = window.SkillSharedUtils && typeof SkillSharedUtils.rollChance === 'function'
                ? SkillSharedUtils.rollChance
                : ((chance, rng) => (typeof rng === 'function' ? rng() : Math.random()) < chance);

            session.nextAttemptTick = context.currentTick + Math.max(1, session.attemptInterval || 1);

            if (!rollChance(successChance, context.random)) {
                return;
            }

            if (!context.lightFireAtCurrentTile(target.x, target.y, target.z)) {
                context.playerState.firemakingSession = null;
                context.stopAction();
                return;
            }

            if (!context.removeOneItemById(recipe.sourceItemId)) {
                context.playerState.firemakingSession = null;
                context.stopAction();
                return;
            }

            context.addSkillXp(SKILL_ID, recipe.xpPerSuccess || 0);
            context.addChatMessage('You light the logs.', 'game');
            context.renderInventory();

            session.phase = 'post_success';
            session.finishTick = context.currentTick + 3;
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
            rig.leftLeg.rotation.set(0, 0, 0);
            rig.rightLeg.rotation.set(0, 0, 0);
            if (rig.leftLowerLeg) rig.leftLowerLeg.rotation.set(0, 0, 0);
            if (rig.rightLowerLeg) rig.rightLowerLeg.rotation.set(0, 0, 0);
        }
    };

    window.SkillModules = window.SkillModules || {};
    window.SkillModules[SKILL_ID] = firemakingModule;
})();

