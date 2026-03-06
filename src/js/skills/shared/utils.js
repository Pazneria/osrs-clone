(function () {
    function rollChance(chance, rng) {
        const randomFn = typeof rng === 'function' ? rng : Math.random;
        return randomFn() < chance;
    }

    function runGatherTick(context, options) {
        if (!context || !options) return;

        const {
            targetTileId,
            successChance,
            skillId,
            xp,
            reward,
            onReward,
            onInventoryFull
        } = options;

        if (!context.isTargetTile(targetTileId)) {
            context.stopAction();
            return;
        }

        if (!rollChance(successChance, context.random)) return;

        const rewardItemId = typeof reward === 'function' ? reward(context) : reward;
        if (!rewardItemId) {
            context.stopAction();
            return;
        }

        if (context.giveItemById(rewardItemId, 1) > 0) {
            context.addSkillXp(skillId, xp);
            if (typeof onReward === 'function') onReward(context, rewardItemId);
            return;
        }

        if (typeof onInventoryFull === 'function') onInventoryFull(context);
        context.stopAction();
    }

    function applyReadyStateOrContinue(context, options) {
        if (!context || !context.rig || !context.playerRig || typeof context.setShoulderPivot !== 'function') return false;

        const opts = options || {};
        const showTool = !!opts.showTool;
        const rig = context.rig;

        if (!context.playerState.actionVisualReady) {
            rig.axe.visible = showTool;
            context.setShoulderPivot(rig);
            rig.leftArm.rotation.set(0, 0, 0);
            rig.rightArm.rotation.set(0, 0, 0);
            rig.leftLowerArm.rotation.set(0, 0, 0);
            rig.rightLowerArm.rotation.set(0, 0, 0);
            rig.torso.rotation.set(0, 0, 0);
            rig.head.rotation.set(0, 0, 0);
            rig.leftLeg.rotation.x = 0;
            rig.rightLeg.rotation.x = 0;
            if (rig.leftLowerLeg) rig.leftLowerLeg.rotation.x = 0;
            if (rig.rightLowerLeg) rig.rightLowerLeg.rotation.x = 0;
            context.playerRig.position.y = context.baseVisualY;
            return true;
        }

        return false;
    }

    window.SkillSharedUtils = {
        rollChance,
        runGatherTick,
        applyReadyStateOrContinue
    };
})();
