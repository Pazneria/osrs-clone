(function () {
    function applyFishingStylePose(context) {
        if (!context || !context.rig || !context.playerRig || typeof context.setShoulderPivot !== 'function') return;
        const rig = context.rig;
        context.setShoulderPivot(rig);
        rig.axe.visible = false;
        context.playerRig.rotation.x = 0;
        rig.leftArm.rotation.set(-0.55, 0.1, 0.08);
        rig.rightArm.rotation.set(-0.65, -0.1, -0.08);
        rig.leftLowerArm.rotation.set(-0.45, 0, 0);
        rig.rightLowerArm.rotation.set(-0.45, 0, 0);
    }

    window.SkillSharedAnimations = {
        applyFishingStylePose
    };
})();
