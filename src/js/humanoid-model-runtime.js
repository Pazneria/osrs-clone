(function () {
    function getThreeRef(options = {}) {
        return options.THREERef || (typeof THREE !== 'undefined' ? THREE : null);
    }

    function createHumanoidModel(type, options = {}) {
        const THREERef = getThreeRef(options);
        if (!THREERef) throw new Error('HumanoidModelRuntime requires THREE.');

        const group = new THREERef.Group(); group.rotation.order = 'YXZ'; group.userData.animType = type;
        const headGeo = new THREERef.BoxGeometry(0.35, 0.35, 0.35); const torsoGeo = new THREERef.BoxGeometry(0.55, 0.7, 0.3);
        function createTaperedBoxGeo(wTop, wBottom, h) { let geo = new THREERef.CylinderGeometry(wTop / Math.SQRT2, wBottom / Math.SQRT2, h, 4); geo.rotateY(Math.PI / 4); geo = geo.toNonIndexed(); geo.computeVertexNormals(); return geo; }
        const elbowWidth = 0.2 / Math.SQRT2; const wristWidth = elbowWidth / Math.SQRT2;
        const upperArmGeo = createTaperedBoxGeo(0.2, elbowWidth, 0.35); upperArmGeo.translate(0, -0.175, -0.1);
        const lowerArmGeo = createTaperedBoxGeo(elbowWidth, wristWidth, 0.35); lowerArmGeo.translate(0, -0.175, 0);
        const legGeo = new THREERef.BoxGeometry(0.25, 0.7, 0.25); legGeo.translate(0, -0.35, 0);

        let skinHex = 0xffcc99; let torsoHex = 0x8b4513; let legHex = 0x2e8b57; let hairHex = 0x4a3018; let capeHex = 0x880000;
        if (type === 2) { torsoHex = 0x555555; legHex = 0x222222; }
        else if (type === 3) { torsoHex = 0x111111; legHex = 0x111111; }
        else if (type === 4) { torsoHex = 0xaa0000; legHex = 0x222222; hairHex = 0xdddddd; capeHex = 0x111111; }
        else if (type === 5) { torsoHex = 0x0000aa; legHex = 0xaaaaaa; hairHex = 0x333333; capeHex = 0xeeeeee; }
        else if (type === 6) { torsoHex = 0x660066; legHex = 0x111111; hairHex = 0xcccccc; capeHex = 0x222222; }
        else if (type === 7) { torsoHex = 0x006600; legHex = 0x333333; hairHex = 0xaa5500; capeHex = 0x880000; }
        else if (type === 8) { torsoHex = 0xff66b2; legHex = 0xff66b2; hairHex = 0xffffff; }
        else if (type === 9) { torsoHex = 0x222222; legHex = 0x222222; hairHex = 0x111111; }
        else if (type === 10) { torsoHex = 0xcc0000; legHex = 0xcc0000; hairHex = 0x111111; }
        else if (type === 11) { torsoHex = 0xffffff; legHex = 0xffffff; hairHex = 0xddaa00; }

        const isKing = type >= 4 && type <= 7;
        const isQueen = type >= 8 && type <= 11;

        const skinMat = new THREERef.MeshLambertMaterial({color: skinHex}); const torsoMat = new THREERef.MeshLambertMaterial({color: torsoHex}); const legMat = new THREERef.MeshLambertMaterial({color: legHex}); const armMat = (type >= 2) ? torsoMat : skinMat; const hairMat = new THREERef.MeshLambertMaterial({color: hairHex});
        const eyeMat = new THREERef.MeshBasicMaterial({color: 0x111111}); const mouthMat = new THREERef.MeshBasicMaterial({color: 0x331111});
        const head = new THREERef.Mesh(headGeo, skinMat); head.position.y = 1.55;
        const leftEye = new THREERef.Mesh(new THREERef.SphereGeometry(0.025, 16, 16), eyeMat); leftEye.position.set(-0.08, 0.05, 0.18); leftEye.scale.set(1, 1.5, 0.5);
        const rightEye = new THREERef.Mesh(new THREERef.SphereGeometry(0.025, 16, 16), eyeMat); rightEye.position.set(0.08, 0.05, 0.18); rightEye.scale.set(1, 1.5, 0.5);
        const lBrow = new THREERef.Mesh(new THREERef.BoxGeometry(0.06, 0.02, 0.04), hairMat); lBrow.position.set(-0.08, 0.1, 0.18);
        const rBrow = new THREERef.Mesh(new THREERef.BoxGeometry(0.06, 0.02, 0.04), hairMat); rBrow.position.set(0.08, 0.1, 0.18);
        let mouth;
        if (type === 3) {
            mouth = new THREERef.Group();
            const mBase = new THREERef.Mesh(new THREERef.BoxGeometry(0.24, 0.02, 0.04), new THREERef.MeshBasicMaterial({color: 0x000000}));
            const mL = new THREERef.Mesh(new THREERef.BoxGeometry(0.02, 0.06, 0.04), new THREERef.MeshBasicMaterial({color: 0x000000})); mL.position.set(-0.11, 0.02, 0);
            const mR = new THREERef.Mesh(new THREERef.BoxGeometry(0.02, 0.06, 0.04), new THREERef.MeshBasicMaterial({color: 0x000000})); mR.position.set(0.11, 0.02, 0);
            const teeth = new THREERef.Mesh(new THREERef.BoxGeometry(0.20, 0.02, 0.041), new THREERef.MeshBasicMaterial({color: 0xffffff})); teeth.position.set(0, 0.01, 0);
            mouth.add(mBase, mL, mR, teeth); mouth.position.set(0, -0.05, 0.18);
            leftEye.scale.set(1.5, 1.5, 0.5); rightEye.scale.set(1.5, 1.5, 0.5); lBrow.visible = false; rBrow.visible = false;
        } else { mouth = new THREERef.Mesh(new THREERef.BoxGeometry(0.1, 0.02, 0.04), mouthMat); mouth.position.set(0, -0.04, 0.18); }
        head.add(leftEye, rightEye, lBrow, rBrow, mouth);
        if (type === 1) {
            const hairBase = new THREERef.Mesh(new THREERef.BoxGeometry(0.36, 0.1, 0.36), hairMat); hairBase.position.set(0, 0.18, 0);
            const spike1 = new THREERef.Mesh(new THREERef.ConeGeometry(0.08, 0.18, 4), hairMat); spike1.position.set(0, 0.25, 0);
            const spike2 = new THREERef.Mesh(new THREERef.ConeGeometry(0.08, 0.18, 4), hairMat); spike2.position.set(0.1, 0.22, 0.1);
            const spike3 = new THREERef.Mesh(new THREERef.ConeGeometry(0.08, 0.18, 4), hairMat); spike3.position.set(-0.1, 0.22, -0.1);
            const beard = new THREERef.Mesh(new THREERef.BoxGeometry(0.36, 0.15, 0.2), hairMat); beard.position.set(0, -0.1, 0.1);
            head.add(hairBase, spike1, spike2, spike3, beard);
        } else if (type === 3) {
            const brim = new THREERef.Mesh(new THREERef.CylinderGeometry(0.25, 0.25, 0.05, 16), new THREERef.MeshLambertMaterial({color: 0x111111})); brim.position.set(0, 0.2, 0);
            const top = new THREERef.Mesh(new THREERef.CylinderGeometry(0.15, 0.15, 0.3, 16), new THREERef.MeshLambertMaterial({color: 0x111111})); top.position.set(0, 0.35, 0);
            head.add(brim, top);
        }

        if (isKing) {
            const beard = new THREERef.Mesh(new THREERef.BoxGeometry(0.38, 0.25, 0.25), hairMat);
            beard.position.set(0, -0.15, 0.12);
            head.add(beard);

            const crownBase = new THREERef.Mesh(new THREERef.CylinderGeometry(0.2, 0.22, 0.15, 8, 1, true), new THREERef.MeshLambertMaterial({color: 0xffdd00, side: THREERef.DoubleSide}));
            const crownVelvet = new THREERef.Mesh(new THREERef.SphereGeometry(0.18, 8, 8), new THREERef.MeshLambertMaterial({color: capeHex}));
            crownVelvet.position.y = 0.05; crownBase.add(crownVelvet);
            crownBase.position.set(0, 0.25, 0); head.add(crownBase);
        } else if (isQueen) {
            const backHair = new THREERef.Mesh(new THREERef.BoxGeometry(0.4, 0.45, 0.15), hairMat); backHair.position.set(0, -0.1, -0.15);
            const sideHairL = new THREERef.Mesh(new THREERef.BoxGeometry(0.1, 0.4, 0.15), hairMat); sideHairL.position.set(-0.18, -0.1, 0);
            const sideHairR = new THREERef.Mesh(new THREERef.BoxGeometry(0.1, 0.4, 0.15), hairMat); sideHairR.position.set(0.18, -0.1, 0);
            head.add(backHair, sideHairL, sideHairR);

            const tiara = new THREERef.Mesh(new THREERef.CylinderGeometry(0.18, 0.18, 0.08, 8, 1, true), new THREERef.MeshLambertMaterial({color: type === 11 ? 0xffffff : 0xffdd00, side: THREERef.DoubleSide}));
            const gem = new THREERef.Mesh(new THREERef.BoxGeometry(0.06, 0.06, 0.04), new THREERef.MeshLambertMaterial({color: 0x00ffff}));
            gem.position.set(0, 0.04, 0.17); tiara.add(gem);
            tiara.position.set(0, 0.22, 0); tiara.rotation.x = -0.1; head.add(tiara);
        }

        const torso = new THREERef.Mesh(torsoGeo, torsoMat); torso.position.y = 1.05;

        if (isKing) {
            const cape = new THREERef.Mesh(new THREERef.BoxGeometry(0.45, 0.7, 0.05), new THREERef.MeshLambertMaterial({color: capeHex}));
            cape.position.set(0, -0.05, -0.18); cape.rotation.x = 0.15;
            torso.add(cape);
        }

        const leftArm = new THREERef.Mesh(upperArmGeo, armMat); leftArm.position.set(0.38, 1.4, 0.1);
        const leftLowerArm = new THREERef.Mesh(lowerArmGeo, skinMat); leftLowerArm.position.set(0, -0.35, -0.1); leftArm.add(leftLowerArm);
        const rightArm = new THREERef.Mesh(upperArmGeo, armMat); rightArm.position.set(-0.38, 1.4, 0.1);
        const rightLowerArm = new THREERef.Mesh(lowerArmGeo, skinMat); rightLowerArm.position.set(0, -0.35, -0.1); rightArm.add(rightLowerArm);

        const axeGroup = new THREERef.Group();
        const handle = new THREERef.Mesh(new THREERef.CylinderGeometry(0.02, 0.02, 0.6).rotateX(Math.PI/2), new THREERef.MeshLambertMaterial({color: 0x5c4033})); handle.position.set(0, 0, 0.15);
        const axeHead = new THREERef.Mesh(new THREERef.BoxGeometry(0.04, 0.25, 0.15), new THREERef.MeshLambertMaterial({color: 0x999999})); axeHead.position.set(0, -0.125, 0.35);
        axeGroup.add(handle, axeHead); axeGroup.position.set(0, -0.35, 0); axeGroup.visible = false; rightLowerArm.add(axeGroup);

        let leftLeg, rightLeg;
        if (isQueen) {
            const gownGeo = new THREERef.CylinderGeometry(0.25, 0.45, 0.7, 8).translate(0, -0.35, 0);
            const gown = new THREERef.Mesh(gownGeo, torsoMat);
            gown.position.set(0, 0.7, 0);
            group.add(gown);

            leftLeg = new THREERef.Group(); rightLeg = new THREERef.Group();
        } else {
            leftLeg = new THREERef.Mesh(legGeo, legMat); leftLeg.position.set(0.14, 0.7, 0);
            rightLeg = new THREERef.Mesh(legGeo, legMat); rightLeg.position.set(-0.14, 0.7, 0);
            group.add(leftLeg, rightLeg);
        }

        group.add(head, torso, leftArm, rightArm); group.traverse(child => { if(child.isMesh) child.castShadow = true; });
        group.userData.rig = { head, torso, leftArm, rightArm, leftLowerArm, rightLowerArm, leftLeg, rightLeg, axe: axeGroup, attackTick: -1, attackAnimationStartedAt: -1, hitReactionTick: -1 }; group.userData.baseY = 0;
        return group;
    }

    window.HumanoidModelRuntime = {
        createHumanoidModel
    };
    window.createHumanoidModel = createHumanoidModel;
})();
