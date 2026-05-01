(function () {
    let renderContext = {};

    function setRenderContext(options = {}) {
        renderContext = options && typeof options === 'object' ? options : {};
    }

    function getWindowRef() {
        return renderContext.windowRef || (typeof window !== 'undefined' ? window : null);
    }

    function getEnemyCombatLevel(enemyType) {
        return typeof renderContext.getEnemyCombatLevel === 'function'
            ? renderContext.getEnemyCombatLevel(enemyType)
            : 1;
    }

    function resolveEnemyModelPresetId(enemyType) {
        return typeof renderContext.resolveEnemyModelPresetId === 'function'
            ? renderContext.resolveEnemyModelPresetId(enemyType)
            : null;
    }

    function resolveEnemyAnimationSetId(enemyType) {
        return typeof renderContext.resolveEnemyAnimationSetId === 'function'
            ? renderContext.resolveEnemyAnimationSetId(enemyType)
            : null;
    }

    function resolveEnemyAnimationSetDef(enemyType) {
        return typeof renderContext.resolveEnemyAnimationSetDef === 'function'
            ? renderContext.resolveEnemyAnimationSetDef(enemyType)
            : null;
    }

    function createHumanoidModel(npcType) {
        return typeof renderContext.createHumanoidModel === 'function'
            ? renderContext.createHumanoidModel(npcType)
            : null;
    }

    function createRatRenderer(enemyState, enemyType) {
        const group = new THREE.Group();
        group.rotation.order = 'YXZ';
        const combatLevel = getEnemyCombatLevel(enemyType);

        const furMaterial = new THREE.MeshLambertMaterial({ color: 0x6b6258, flatShading: true });
        const bellyMaterial = new THREE.MeshLambertMaterial({ color: 0xcbb7a2, flatShading: true });
        const tailMaterial = new THREE.MeshLambertMaterial({ color: 0xa7847a, flatShading: true });

        const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), furMaterial);
        body.scale.set(1.35, 0.72, 1.75);
        body.position.set(0, 0.2, 0);

        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), bellyMaterial);
        belly.scale.set(1.0, 0.55, 1.1);
        belly.position.set(0, 0.12, 0.1);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), furMaterial);
        head.scale.set(1.0, 0.92, 1.15);
        head.position.set(0, 0.24, 0.34);

        const earLeft = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), furMaterial);
        const earRight = earLeft.clone();
        earLeft.position.set(0.09, 0.35, 0.35);
        earRight.position.set(-0.09, 0.35, 0.35);

        const tailGeometry = new THREE.CylinderGeometry(0.022, 0.012, 0.48, 5);
        tailGeometry.rotateX(Math.PI / 2);
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.position.set(0, 0.14, -0.42);
        tail.rotation.x = Math.PI / 8;

        const hitbox = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.5, 0.9),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitbox.position.y = 0.24;
        hitbox.userData = {
            type: 'ENEMY',
            gridX: enemyState.x,
            gridY: enemyState.y,
            z: enemyState.z,
            name: enemyType.displayName,
            combatLevel,
            uid: enemyState.runtimeId
        };

        group.add(body, belly, head, earLeft, earRight, tail, hitbox);
        return { group, hitbox, kind: 'rat', body, head, tail };
    }

    function createQuadrupedLegRig(basePosition, options) {
        const root = new THREE.Group();
        const upperPivot = new THREE.Group();
        const lowerPivot = new THREE.Group();
        const upperLength = Number.isFinite(options.upperLength) ? options.upperLength : 0.22;
        const lowerLength = Number.isFinite(options.lowerLength) ? options.lowerLength : 0.2;
        const upperGeometry = new THREE.CylinderGeometry(
            Number.isFinite(options.upperRadiusTop) ? options.upperRadiusTop : 0.04,
            Number.isFinite(options.upperRadiusBottom) ? options.upperRadiusBottom : 0.045,
            upperLength,
            6
        );
        const lowerGeometry = new THREE.CylinderGeometry(
            Number.isFinite(options.lowerRadiusTop) ? options.lowerRadiusTop : 0.034,
            Number.isFinite(options.lowerRadiusBottom) ? options.lowerRadiusBottom : 0.03,
            lowerLength,
            6
        );
        const pawSize = Array.isArray(options.pawSize) ? options.pawSize : [0.08, 0.05, 0.12];
        const pawForwardOffset = Number.isFinite(options.pawForwardOffset) ? options.pawForwardOffset : 0.02;
        const upperMaterial = options.upperMaterial;
        const lowerMaterial = options.lowerMaterial || upperMaterial;
        const pawMaterial = options.pawMaterial || lowerMaterial;
        const upper = new THREE.Mesh(upperGeometry, upperMaterial);
        const lower = new THREE.Mesh(lowerGeometry, lowerMaterial);
        const paw = new THREE.Mesh(new THREE.BoxGeometry(pawSize[0], pawSize[1], pawSize[2]), pawMaterial);

        root.position.copy(basePosition);
        upper.position.y = -upperLength * 0.5;
        lowerPivot.position.y = -upperLength + 0.01;
        lower.position.y = -lowerLength * 0.5;
        paw.position.set(0, -lowerLength - (pawSize[1] * 0.28), pawForwardOffset);

        upperPivot.add(upper);
        lowerPivot.add(lower, paw);
        upperPivot.add(lowerPivot);
        root.add(upperPivot);

        return {
            root,
            upperPivot,
            lowerPivot,
            upper,
            lower,
            paw,
            baseX: basePosition.x,
            baseY: basePosition.y,
            baseZ: basePosition.z
        };
    }

    function applyQuadrupedLegPose(leg, pose) {
        if (!leg || !pose) return;
        leg.root.position.set(
            leg.baseX + (Number.isFinite(pose.offsetX) ? pose.offsetX : 0),
            leg.baseY + (Number.isFinite(pose.lift) ? pose.lift : 0),
            leg.baseZ + (Number.isFinite(pose.offsetZ) ? pose.offsetZ : 0)
        );
        leg.root.rotation.z = Number.isFinite(pose.splay) ? pose.splay : 0;
        leg.upperPivot.rotation.x = Number.isFinite(pose.upperAngle) ? pose.upperAngle : 0;
        leg.lowerPivot.rotation.x = Number.isFinite(pose.lowerAngle) ? pose.lowerAngle : 0;
        leg.paw.rotation.x = Number.isFinite(pose.pawAngle) ? pose.pawAngle : 0;
    }

    function resolveQuadrupedLegPose(phase, options) {
        const swing = Math.sin(phase);
        const liftWave = Math.max(0, Math.cos(phase));
        return {
            offsetX: 0,
            offsetZ: swing * (Number.isFinite(options.travel) ? options.travel : 0.04),
            lift: liftWave * (Number.isFinite(options.lift) ? options.lift : 0.02),
            upperAngle: (Number.isFinite(options.upperBias) ? options.upperBias : 0)
                + (swing * (Number.isFinite(options.upperSwing) ? options.upperSwing : 0.32)),
            lowerAngle: (Number.isFinite(options.lowerBias) ? options.lowerBias : 0)
                + (Math.max(0, -swing) * (Number.isFinite(options.kneeBend) ? options.kneeBend : 0.4))
                + (liftWave * (Number.isFinite(options.kneeLift) ? options.kneeLift : 0.08)),
            pawAngle: Math.max(0, swing) * (Number.isFinite(options.pawFlex) ? options.pawFlex : 0.08),
            splay: Number.isFinite(options.splay) ? options.splay : 0
        };
    }

    function createBoarRenderer(enemyState, enemyType) {
        const group = new THREE.Group();
        group.rotation.order = 'YXZ';
        const combatLevel = getEnemyCombatLevel(enemyType);

        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x7b5b3c, flatShading: true });
        const backMaterial = new THREE.MeshLambertMaterial({ color: 0x65492f, flatShading: true });
        const bellyMaterial = new THREE.MeshLambertMaterial({ color: 0xa57c56, flatShading: true });
        const snoutMaterial = new THREE.MeshLambertMaterial({ color: 0x8b6748, flatShading: true });
        const tuskMaterial = new THREE.MeshLambertMaterial({ color: 0xf2e6cb, flatShading: true });
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x5a4330, flatShading: true });
        const hoofMaterial = new THREE.MeshLambertMaterial({ color: 0x2f241d, flatShading: true });
        const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x1a140f, flatShading: true });

        const torsoGroup = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.42, 0.98), bodyMaterial);
        const shoulderHump = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.26, 0.34), backMaterial);
        const rump = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.32, 0.38), bodyMaterial);
        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), bellyMaterial);
        const spine = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.66), backMaterial);
        body.position.set(0, 0.36, 0.03);
        shoulderHump.position.set(0, 0.48, 0.2);
        rump.position.set(0, 0.33, -0.24);
        belly.scale.set(1.12, 0.72, 1.28);
        belly.position.set(0, 0.23, 0.05);
        spine.position.set(0, 0.57, 0.02);

        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.41, 0.56);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.36), bodyMaterial);
        const snout = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.3), snoutMaterial);
        const brow = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.16), backMaterial);
        head.position.set(0, 0, 0);
        snout.position.set(0, -0.03, 0.28);
        brow.position.set(0, 0.08, 0.08);
        const tuskGeometry = new THREE.ConeGeometry(0.024, 0.15, 4);
        const tuskLeft = new THREE.Mesh(tuskGeometry, tuskMaterial);
        const tuskRight = tuskLeft.clone();
        tuskLeft.rotation.set(Math.PI / 2, 0, -0.42);
        tuskRight.rotation.set(Math.PI / 2, 0, 0.42);
        tuskLeft.position.set(0.09, -0.08, 0.38);
        tuskRight.position.set(-0.09, -0.08, 0.38);
        const earGeometry = new THREE.BoxGeometry(0.08, 0.1, 0.03);
        const earLeft = new THREE.Mesh(earGeometry, bodyMaterial);
        const earRight = earLeft.clone();
        earLeft.position.set(0.12, 0.11, -0.02);
        earRight.position.set(-0.12, 0.11, -0.02);
        earLeft.rotation.z = -0.35;
        earRight.rotation.z = 0.35;
        const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), eyeMaterial);
        const eyeRight = eyeLeft.clone();
        eyeLeft.position.set(0.08, 0.04, 0.15);
        eyeRight.position.set(-0.08, 0.04, 0.15);
        headGroup.add(head, snout, brow, tuskLeft, tuskRight, earLeft, earRight, eyeLeft, eyeRight);

        const tailGroup = new THREE.Group();
        tailGroup.position.set(0, 0.43, -0.54);
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.008, 0.28, 5), hoofMaterial);
        tail.rotation.x = Math.PI / 2;
        tail.position.set(0, 0, -0.06);
        tailGroup.add(tail);

        const frontLeftLeg = createQuadrupedLegRig(new THREE.Vector3(0.25, 0.31, 0.27), {
            upperLength: 0.22,
            lowerLength: 0.18,
            upperRadiusTop: 0.04,
            upperRadiusBottom: 0.048,
            lowerRadiusTop: 0.034,
            lowerRadiusBottom: 0.03,
            pawSize: [0.09, 0.05, 0.13],
            pawForwardOffset: 0.02,
            upperMaterial: legMaterial,
            lowerMaterial: legMaterial,
            pawMaterial: hoofMaterial
        });
        const frontRightLeg = createQuadrupedLegRig(new THREE.Vector3(-0.25, 0.31, 0.27), {
            upperLength: 0.22,
            lowerLength: 0.18,
            upperRadiusTop: 0.04,
            upperRadiusBottom: 0.048,
            lowerRadiusTop: 0.034,
            lowerRadiusBottom: 0.03,
            pawSize: [0.09, 0.05, 0.13],
            pawForwardOffset: 0.02,
            upperMaterial: legMaterial,
            lowerMaterial: legMaterial,
            pawMaterial: hoofMaterial
        });
        const backLeftLeg = createQuadrupedLegRig(new THREE.Vector3(0.24, 0.29, -0.24), {
            upperLength: 0.2,
            lowerLength: 0.18,
            upperRadiusTop: 0.045,
            upperRadiusBottom: 0.05,
            lowerRadiusTop: 0.036,
            lowerRadiusBottom: 0.032,
            pawSize: [0.1, 0.05, 0.13],
            pawForwardOffset: 0.015,
            upperMaterial: legMaterial,
            lowerMaterial: legMaterial,
            pawMaterial: hoofMaterial
        });
        const backRightLeg = createQuadrupedLegRig(new THREE.Vector3(-0.24, 0.29, -0.24), {
            upperLength: 0.2,
            lowerLength: 0.18,
            upperRadiusTop: 0.045,
            upperRadiusBottom: 0.05,
            lowerRadiusTop: 0.036,
            lowerRadiusBottom: 0.032,
            pawSize: [0.1, 0.05, 0.13],
            pawForwardOffset: 0.015,
            upperMaterial: legMaterial,
            lowerMaterial: legMaterial,
            pawMaterial: hoofMaterial
        });

        const hitbox = new THREE.Mesh(
            new THREE.BoxGeometry(1.06, 0.92, 1.16),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitbox.position.y = 0.45;
        hitbox.userData = {
            type: 'ENEMY',
            gridX: enemyState.x,
            gridY: enemyState.y,
            z: enemyState.z,
            name: enemyType.displayName,
            combatLevel,
            uid: enemyState.runtimeId
        };

        torsoGroup.add(body, shoulderHump, rump, belly, spine, headGroup, tailGroup);
        group.add(
            torsoGroup,
            frontLeftLeg.root,
            frontRightLeg.root,
            backLeftLeg.root,
            backRightLeg.root,
            hitbox
        );
        return {
            group,
            hitbox,
            kind: 'boar',
            torsoGroup,
            body,
            shoulderHump,
            rump,
            belly,
            spine,
            headGroup,
            head,
            snout,
            brow,
            tuskLeft,
            tuskRight,
            earLeft,
            earRight,
            eyeLeft,
            eyeRight,
            tailGroup,
            tail,
            frontLeftLeg,
            frontRightLeg,
            backLeftLeg,
            backRightLeg
        };
    }

    function createWolfRenderer(enemyState, enemyType) {
        const group = new THREE.Group();
        group.rotation.order = 'YXZ';
        const combatLevel = getEnemyCombatLevel(enemyType);

        const furMaterial = new THREE.MeshLambertMaterial({ color: 0x6c645e, flatShading: true });
        const furDarkMaterial = new THREE.MeshLambertMaterial({ color: 0x4d4844, flatShading: true });
        const bellyMaterial = new THREE.MeshLambertMaterial({ color: 0x93867d, flatShading: true });
        const muzzleMaterial = new THREE.MeshLambertMaterial({ color: 0x5a544f, flatShading: true });
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x4c4743, flatShading: true });
        const pawMaterial = new THREE.MeshLambertMaterial({ color: 0x241f1c, flatShading: true });
        const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0xece7d5, flatShading: true });

        const torsoGroup = new THREE.Group();
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.31, 10, 10), furMaterial);
        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), bellyMaterial);
        const chest = new THREE.Mesh(new THREE.SphereGeometry(0.23, 10, 10), furMaterial);
        const haunch = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), furDarkMaterial);
        const backLine = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.7), furDarkMaterial);
        body.scale.set(1.2, 0.72, 1.72);
        body.position.set(0, 0.42, 0.02);
        belly.scale.set(1.06, 0.58, 1.22);
        belly.position.set(0, 0.27, 0.08);
        chest.scale.set(0.94, 0.86, 1.08);
        chest.position.set(0, 0.45, 0.28);
        haunch.scale.set(0.98, 0.78, 1.04);
        haunch.position.set(0, 0.39, -0.3);
        backLine.position.set(0, 0.58, 0.02);

        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.53, 0.68);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.34), furMaterial);
        const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.24), muzzleMaterial);
        const neck = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.18), furDarkMaterial);
        head.position.set(0, 0, 0);
        muzzle.position.set(0, -0.02, 0.28);
        neck.position.set(0, -0.04, -0.2);
        const earGeometry = new THREE.BoxGeometry(0.07, 0.14, 0.03);
        const earLeft = new THREE.Mesh(earGeometry, furDarkMaterial);
        const earRight = earLeft.clone();
        earLeft.position.set(0.1, 0.14, -0.01);
        earRight.position.set(-0.1, 0.14, -0.01);
        earLeft.rotation.z = -0.2;
        earRight.rotation.z = 0.2;
        const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.021, 8, 8), eyeMaterial);
        const eyeRight = eyeLeft.clone();
        eyeLeft.position.set(0.06, 0.04, 0.12);
        eyeRight.position.set(-0.06, 0.04, 0.12);
        headGroup.add(head, muzzle, neck, earLeft, earRight, eyeLeft, eyeRight);

        const tailGroup = new THREE.Group();
        tailGroup.position.set(0, 0.49, -0.62);
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.01, 0.44, 5), furDarkMaterial);
        tail.rotation.x = Math.PI / 2;
        tail.position.set(0, 0, -0.12);
        const tailTip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.1), furMaterial);
        tailTip.position.set(0, 0, -0.34);
        tailGroup.add(tail, tailTip);

        const frontLeftLeg = createQuadrupedLegRig(new THREE.Vector3(0.18, 0.37, 0.34), {
            upperLength: 0.25,
            lowerLength: 0.22,
            upperRadiusTop: 0.025,
            upperRadiusBottom: 0.03,
            lowerRadiusTop: 0.024,
            lowerRadiusBottom: 0.02,
            pawSize: [0.06, 0.04, 0.12],
            pawForwardOffset: 0.03,
            upperMaterial: legMaterial,
            lowerMaterial: legMaterial,
            pawMaterial: pawMaterial
        });
        const frontRightLeg = createQuadrupedLegRig(new THREE.Vector3(-0.18, 0.37, 0.34), {
            upperLength: 0.25,
            lowerLength: 0.22,
            upperRadiusTop: 0.025,
            upperRadiusBottom: 0.03,
            lowerRadiusTop: 0.024,
            lowerRadiusBottom: 0.02,
            pawSize: [0.06, 0.04, 0.12],
            pawForwardOffset: 0.03,
            upperMaterial: legMaterial,
            lowerMaterial: legMaterial,
            pawMaterial: pawMaterial
        });
        const backLeftLeg = createQuadrupedLegRig(new THREE.Vector3(0.17, 0.35, -0.28), {
            upperLength: 0.24,
            lowerLength: 0.22,
            upperRadiusTop: 0.028,
            upperRadiusBottom: 0.034,
            lowerRadiusTop: 0.024,
            lowerRadiusBottom: 0.02,
            pawSize: [0.06, 0.04, 0.12],
            pawForwardOffset: 0.025,
            upperMaterial: legMaterial,
            lowerMaterial: legMaterial,
            pawMaterial: pawMaterial
        });
        const backRightLeg = createQuadrupedLegRig(new THREE.Vector3(-0.17, 0.35, -0.28), {
            upperLength: 0.24,
            lowerLength: 0.22,
            upperRadiusTop: 0.028,
            upperRadiusBottom: 0.034,
            lowerRadiusTop: 0.024,
            lowerRadiusBottom: 0.02,
            pawSize: [0.06, 0.04, 0.12],
            pawForwardOffset: 0.025,
            upperMaterial: legMaterial,
            lowerMaterial: legMaterial,
            pawMaterial: pawMaterial
        });

        const hitbox = new THREE.Mesh(
            new THREE.BoxGeometry(1.0, 0.92, 1.24),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitbox.position.y = 0.48;
        hitbox.userData = {
            type: 'ENEMY',
            gridX: enemyState.x,
            gridY: enemyState.y,
            z: enemyState.z,
            name: enemyType.displayName,
            combatLevel,
            uid: enemyState.runtimeId
        };

        torsoGroup.add(body, belly, chest, haunch, backLine, headGroup, tailGroup);
        group.add(
            torsoGroup,
            frontLeftLeg.root,
            frontRightLeg.root,
            backLeftLeg.root,
            backRightLeg.root,
            hitbox
        );
        return {
            group,
            hitbox,
            kind: 'wolf',
            torsoGroup,
            body,
            belly,
            chest,
            haunch,
            backLine,
            headGroup,
            head,
            muzzle,
            neck,
            earLeft,
            earRight,
            eyeLeft,
            eyeRight,
            tailGroup,
            tail,
            tailTip,
            frontLeftLeg,
            frontRightLeg,
            backLeftLeg,
            backRightLeg
        };
    }

    function createChickenRenderer(enemyState, enemyType) {
        const group = new THREE.Group();
        group.rotation.order = 'YXZ';
        const combatLevel = getEnemyCombatLevel(enemyType);

        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xf0ead8, flatShading: true });
        const wingMaterial = new THREE.MeshLambertMaterial({ color: 0xe6dbc2, flatShading: true });
        const tailMaterial = new THREE.MeshLambertMaterial({ color: 0xc5ad72, flatShading: true });
        const beakMaterial = new THREE.MeshLambertMaterial({ color: 0xe2a236, flatShading: true });
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0xcd9b34, flatShading: true });
        const combMaterial = new THREE.MeshLambertMaterial({ color: 0xb2423b, flatShading: true });
        const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x201712, flatShading: true });

        const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), bodyMaterial);
        body.scale.set(1.2, 0.92, 1.48);
        body.position.set(0, 0.28, 0);

        const headGroup = new THREE.Group();
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 10), bodyMaterial);
        head.scale.set(0.95, 0.9, 1.0);
        const beak = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 4), beakMaterial);
        beak.rotation.x = Math.PI / 2;
        beak.position.set(0, -0.01, 0.18);
        const comb = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 0.07), combMaterial);
        comb.position.set(0, 0.16, 0.01);
        const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), eyeMaterial);
        const eyeRight = eyeLeft.clone();
        eyeLeft.position.set(0.06, 0.03, 0.08);
        eyeRight.position.set(-0.06, 0.03, 0.08);
        headGroup.add(head, beak, comb, eyeLeft, eyeRight);
        headGroup.position.set(0, 0.54, 0.34);

        const wingLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.26), wingMaterial);
        const wingRight = wingLeft.clone();
        wingLeft.position.set(0.22, 0.28, 0.02);
        wingRight.position.set(-0.22, 0.28, 0.02);

        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 4), tailMaterial);
        tail.rotation.x = -Math.PI / 2;
        tail.rotation.z = Math.PI;
        tail.position.set(0, 0.38, -0.27);

        const legGeometry = new THREE.CylinderGeometry(0.018, 0.014, 0.28, 5);
        const legLeft = new THREE.Mesh(legGeometry, legMaterial);
        const legRight = new THREE.Mesh(legGeometry.clone(), legMaterial);
        legLeft.position.set(0.1, 0.04, -0.08);
        legRight.position.set(-0.1, 0.04, -0.08);
        legLeft.rotation.z = -0.08;
        legRight.rotation.z = 0.08;

        const hitbox = new THREE.Mesh(
            new THREE.BoxGeometry(0.9, 0.95, 1.0),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitbox.position.y = 0.5;
        hitbox.userData = {
            type: 'ENEMY',
            gridX: enemyState.x,
            gridY: enemyState.y,
            z: enemyState.z,
            name: enemyType.displayName,
            combatLevel,
            uid: enemyState.runtimeId
        };

        group.add(body, headGroup, wingLeft, wingRight, tail, legLeft, legRight, hitbox);
        return {
            group,
            hitbox,
            kind: 'chicken',
            body,
            headGroup,
            wingLeft,
            wingRight,
            tail,
            legLeft,
            legRight
        };
    }

    function createHumanoidEnemyRenderer(enemyState, enemyType) {
        const modelPresetId = resolveEnemyModelPresetId(enemyType);
        const animationSetDef = resolveEnemyAnimationSetDef(enemyType);
        let group = null;
        if (modelPresetId && typeof window.createNpcHumanoidRigFromPreset === 'function') {
            group = window.createNpcHumanoidRigFromPreset(modelPresetId);
        }
        if (!group) {
            group = createHumanoidModel(enemyType.appearance && Number.isFinite(enemyType.appearance.npcType) ? enemyType.appearance.npcType : 3);
        }
        const combatLevel = getEnemyCombatLevel(enemyType);
        const hitbox = new THREE.Mesh(
            new THREE.BoxGeometry(1.0, 2.0, 1.0),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitbox.position.y = 1.0;
        hitbox.userData = {
            type: 'ENEMY',
            gridX: enemyState.x,
            gridY: enemyState.y,
            z: enemyState.z,
            name: enemyType.displayName,
            combatLevel,
            uid: enemyState.runtimeId
        };
        group.add(hitbox);
        return {
            group,
            hitbox,
            kind: 'humanoid',
            animationSetId: animationSetDef ? resolveEnemyAnimationSetId(enemyType) : null,
            animationSetDef: animationSetDef || null,
            animationRigId: animationSetDef && group.userData ? (group.userData.animationRigId || animationSetDef.rigId) : null
        };
    }


    function updateBoarRenderer(enemyState, renderer, frameNow, idlePhase, visuallyMoving, useWalkBaseClip, currentVisualX, currentVisualY) {
        const walkActive = visuallyMoving || useWalkBaseClip;
        const gaitPhase = (frameNow / 165) + (currentVisualX * 0.19) + (currentVisualY * 0.16);
        const gaitAngle = gaitPhase * Math.PI * 2;
        const attackAge = frameNow - (enemyState.attackTriggerAt || 0);
        const attackPulse = attackAge >= 0 && attackAge < 420 ? Math.sin((attackAge / 420) * Math.PI) : 0;
        const hitAge = frameNow - (enemyState.hitReactionTriggerAt || 0);
        const hitPulse = hitAge >= 0 && hitAge < 360 ? Math.sin((hitAge / 360) * Math.PI) : 0;
        const idleBob = Math.sin(idlePhase * 1.6) * 0.016;
        const walkBob = walkActive ? Math.abs(Math.sin(gaitAngle * 2)) * 0.026 : 0;
        const bob = idleBob + walkBob;
        const shoulderShift = walkActive ? Math.sin(gaitAngle * 2) * 0.02 : Math.sin(idlePhase * 1.3) * 0.01;
        const headSwing = walkActive ? Math.sin(gaitAngle) * 0.04 : Math.sin(idlePhase * 1.5) * 0.02;
        const tailSwing = (walkActive ? Math.sin(gaitAngle * 2) * 0.18 : Math.sin(idlePhase * 1.8) * 0.08) + hitPulse * 0.05;

        renderer.group.rotation.x = -0.02 + shoulderShift * 0.2 - attackPulse * 0.07 + hitPulse * 0.05;
        renderer.torsoGroup.position.set(0, bob - attackPulse * 0.04 + hitPulse * 0.03, 0);
        renderer.body.scale.set(1.02 + hitPulse * 0.03, 1.0 - attackPulse * 0.05 + hitPulse * 0.02, 1.0 + attackPulse * 0.05);
        renderer.shoulderHump.scale.set(1.0 + attackPulse * 0.05, 1.0 + walkBob * 1.2, 1.0);
        renderer.rump.scale.set(1.0 - attackPulse * 0.02, 1.0 + hitPulse * 0.03, 1.0);
        renderer.belly.position.set(0, 0.23 - attackPulse * 0.02 + hitPulse * 0.02, 0.05);
        renderer.headGroup.position.set(0, 0.41 + bob * 0.35 - attackPulse * 0.06 + hitPulse * 0.03, 0.56 + attackPulse * 0.14 - hitPulse * 0.05);
        renderer.headGroup.rotation.set(0.06 + headSwing - attackPulse * 0.18 + hitPulse * 0.08, 0, headSwing * 0.24);
        renderer.earLeft.rotation.z = -0.35 + headSwing * 0.5 - attackPulse * 0.04;
        renderer.earRight.rotation.z = 0.35 - headSwing * 0.5 + attackPulse * 0.04;
        renderer.tailGroup.rotation.set(-0.1 + attackPulse * 0.06, 0, -0.18 + tailSwing);

        const leadPhase = gaitAngle;
        const followPhase = gaitAngle + Math.PI;
        applyQuadrupedLegPose(renderer.frontLeftLeg, resolveQuadrupedLegPose(leadPhase, {
            travel: walkActive ? 0.065 : 0.012,
            lift: walkActive ? 0.03 : 0.008,
            upperSwing: walkActive ? 0.52 : 0.12,
            kneeBend: 0.62,
            kneeLift: 0.1,
            pawFlex: 0.14,
            upperBias: 0.08,
            lowerBias: -0.04,
            splay: 0.03
        }));
        applyQuadrupedLegPose(renderer.frontRightLeg, resolveQuadrupedLegPose(followPhase, {
            travel: walkActive ? 0.065 : 0.012,
            lift: walkActive ? 0.03 : 0.008,
            upperSwing: walkActive ? 0.52 : 0.12,
            kneeBend: 0.62,
            kneeLift: 0.1,
            pawFlex: 0.14,
            upperBias: 0.08,
            lowerBias: -0.04,
            splay: -0.03
        }));
        applyQuadrupedLegPose(renderer.backLeftLeg, resolveQuadrupedLegPose(followPhase, {
            travel: walkActive ? 0.055 : 0.01,
            lift: walkActive ? 0.024 : 0.006,
            upperSwing: walkActive ? 0.46 : 0.1,
            kneeBend: 0.54,
            kneeLift: 0.08,
            pawFlex: 0.1,
            upperBias: -0.06,
            lowerBias: 0.03,
            splay: 0.02
        }));
        applyQuadrupedLegPose(renderer.backRightLeg, resolveQuadrupedLegPose(leadPhase, {
            travel: walkActive ? 0.055 : 0.01,
            lift: walkActive ? 0.024 : 0.006,
            upperSwing: walkActive ? 0.46 : 0.1,
            kneeBend: 0.54,
            kneeLift: 0.08,
            pawFlex: 0.1,
            upperBias: -0.06,
            lowerBias: 0.03,
            splay: -0.02
        }));
    }

    function updateWolfRenderer(enemyState, renderer, frameNow, idlePhase, visuallyMoving, useWalkBaseClip, currentVisualX, currentVisualY) {
        const walkActive = visuallyMoving || useWalkBaseClip;
        const gaitPhase = (frameNow / 132) + (currentVisualX * 0.27) + (currentVisualY * 0.21);
        const gaitAngle = gaitPhase * Math.PI * 2;
        const attackAge = frameNow - (enemyState.attackTriggerAt || 0);
        const attackPulse = attackAge >= 0 && attackAge < 380 ? Math.sin((attackAge / 380) * Math.PI) : 0;
        const hitAge = frameNow - (enemyState.hitReactionTriggerAt || 0);
        const hitPulse = hitAge >= 0 && hitAge < 360 ? Math.sin((hitAge / 360) * Math.PI) : 0;
        const idleBob = Math.sin(idlePhase * 2.0) * 0.014;
        const strideBounce = walkActive ? Math.abs(Math.sin(gaitAngle * 2)) * 0.022 : 0;
        const bob = idleBob + strideBounce;
        const spineWave = walkActive ? Math.sin(gaitAngle * 2) * 0.022 : Math.sin(idlePhase * 1.5) * 0.01;
        const headSwing = walkActive ? Math.sin(gaitAngle) * 0.06 : Math.sin(idlePhase * 1.8) * 0.025;
        const tailSwing = (walkActive ? Math.sin(gaitAngle * 2 + 0.6) * 0.26 : Math.sin(idlePhase * 2.1) * 0.12) + attackPulse * 0.12 - hitPulse * 0.08;

        renderer.group.rotation.x = -0.015 + spineWave * 0.2 - attackPulse * 0.05 + hitPulse * 0.03;
        renderer.torsoGroup.position.set(0, bob - attackPulse * 0.03 + hitPulse * 0.03, 0);
        renderer.body.position.set(0, 0.42, 0.02);
        renderer.body.scale.set(1.2 + hitPulse * 0.02, 0.72 - attackPulse * 0.04 + hitPulse * 0.02, 1.72 + attackPulse * 0.04);
        renderer.chest.position.set(0, 0.45 + spineWave * 0.2 - attackPulse * 0.02, 0.28 + attackPulse * 0.04);
        renderer.haunch.position.set(0, 0.39 - spineWave * 0.2 + hitPulse * 0.02, -0.3 - attackPulse * 0.03);
        renderer.headGroup.position.set(0, 0.53 + bob * 0.32 - attackPulse * 0.04 + hitPulse * 0.03, 0.68 + attackPulse * 0.14 - hitPulse * 0.06);
        renderer.headGroup.rotation.set(0.04 + headSwing * 0.24 - attackPulse * 0.16 + hitPulse * 0.08, 0, headSwing * 0.2);
        renderer.earLeft.rotation.z = -0.2 + headSwing * 0.24 - attackPulse * 0.04;
        renderer.earRight.rotation.z = 0.2 - headSwing * 0.24 + attackPulse * 0.04;
        renderer.tailGroup.rotation.set(0.06 + attackPulse * 0.05, 0, 0.32 + tailSwing);

        const leadPhase = gaitAngle;
        const followPhase = gaitAngle + Math.PI;
        applyQuadrupedLegPose(renderer.frontLeftLeg, resolveQuadrupedLegPose(leadPhase, {
            travel: walkActive ? 0.075 : 0.014,
            lift: walkActive ? 0.036 : 0.01,
            upperSwing: walkActive ? 0.62 : 0.14,
            kneeBend: 0.7,
            kneeLift: 0.12,
            pawFlex: 0.18,
            upperBias: 0.06,
            lowerBias: -0.08,
            splay: 0.02
        }));
        applyQuadrupedLegPose(renderer.frontRightLeg, resolveQuadrupedLegPose(followPhase, {
            travel: walkActive ? 0.075 : 0.014,
            lift: walkActive ? 0.036 : 0.01,
            upperSwing: walkActive ? 0.62 : 0.14,
            kneeBend: 0.7,
            kneeLift: 0.12,
            pawFlex: 0.18,
            upperBias: 0.06,
            lowerBias: -0.08,
            splay: -0.02
        }));
        applyQuadrupedLegPose(renderer.backLeftLeg, resolveQuadrupedLegPose(followPhase, {
            travel: walkActive ? 0.07 : 0.012,
            lift: walkActive ? 0.03 : 0.008,
            upperSwing: walkActive ? 0.58 : 0.12,
            kneeBend: 0.66,
            kneeLift: 0.1,
            pawFlex: 0.16,
            upperBias: -0.08,
            lowerBias: 0.05,
            splay: 0.015
        }));
        applyQuadrupedLegPose(renderer.backRightLeg, resolveQuadrupedLegPose(leadPhase, {
            travel: walkActive ? 0.07 : 0.012,
            lift: walkActive ? 0.03 : 0.008,
            upperSwing: walkActive ? 0.58 : 0.12,
            kneeBend: 0.66,
            kneeLift: 0.1,
            pawFlex: 0.16,
            upperBias: -0.08,
            lowerBias: 0.05,
            splay: -0.015
        }));
    }

    function updateChickenRenderer(enemyState, renderer, frameNow, idlePhase, visuallyMoving, useWalkBaseClip, currentVisualX, currentVisualY) {
        const walkActive = visuallyMoving || useWalkBaseClip;
        const gaitPhase = (frameNow / 170) + (currentVisualX * 0.27) + (currentVisualY * 0.31);
        const walkPulse = walkActive ? Math.sin(gaitPhase * Math.PI * 2) : Math.sin(idlePhase * 1.7) * 0.25;
        const attackAge = frameNow - (enemyState.attackTriggerAt || 0);
        const attackPulse = attackAge >= 0 && attackAge < 360 ? Math.sin((attackAge / 360) * Math.PI) : 0;
        const hitAge = frameNow - (enemyState.hitReactionTriggerAt || 0);
        const hitPulse = hitAge >= 0 && hitAge < 360 ? Math.sin((hitAge / 360) * Math.PI) : 0;
        const bob = Math.sin(idlePhase * 2.1) * 0.02 + (walkActive ? Math.abs(walkPulse) * 0.018 : 0);
        const legStride = walkActive ? walkPulse * 0.35 : Math.sin(idlePhase * 2.4) * 0.06;
        const wingFlap = (walkActive ? Math.sin(gaitPhase * Math.PI * 4) * 0.18 : Math.sin(idlePhase * 2.2) * 0.1) + attackPulse * 0.26 - hitPulse * 0.14;

        renderer.group.rotation.x = -0.02 + (walkActive ? walkPulse * 0.03 : Math.sin(idlePhase * 1.4) * 0.01) - attackPulse * 0.1 + hitPulse * 0.06;

        renderer.body.position.set(0, 0.28 + bob - attackPulse * 0.03 + hitPulse * 0.03, 0);
        renderer.body.scale.set(1.18 - hitPulse * 0.04, 0.92 - attackPulse * 0.08 + hitPulse * 0.02, 1.46 + attackPulse * 0.08 - hitPulse * 0.04);

        renderer.headGroup.position.set(0, 0.54 + bob * 0.7 - attackPulse * 0.06 + hitPulse * 0.04, 0.34 + attackPulse * 0.2 - hitPulse * 0.08);
        renderer.headGroup.rotation.set(
            -attackPulse * 0.18 + hitPulse * 0.12,
            0,
            walkActive ? walkPulse * 0.03 : Math.sin(idlePhase * 1.6) * 0.015
        );

        renderer.wingLeft.position.set(0.22, 0.28 + bob * 0.3, 0.02);
        renderer.wingRight.position.set(-0.22, 0.28 + bob * 0.3, 0.02);
        renderer.wingLeft.rotation.set(0, 0, -0.14 - wingFlap);
        renderer.wingRight.rotation.set(0, 0, 0.14 + wingFlap);

        renderer.legLeft.position.set(0.1 + (walkActive ? legStride * 0.03 : 0), 0.04 + bob * 0.05, -0.08);
        renderer.legRight.position.set(-0.1 - (walkActive ? legStride * 0.03 : 0), 0.04 + bob * 0.05, -0.08);
        renderer.legLeft.rotation.z = -0.08 - legStride * 0.45 + attackPulse * 0.05;
        renderer.legRight.rotation.z = 0.08 + legStride * 0.45 - attackPulse * 0.05;

        renderer.tail.position.set(0, 0.38 + bob * 0.25 - hitPulse * 0.03, -0.27);
        renderer.tail.rotation.set(
            -Math.PI / 2 - attackPulse * 0.08 + hitPulse * 0.04,
            0,
            Math.sin(idlePhase * 2.2) * 0.16 + attackPulse * 0.08
        );
    }


    function updateRatRenderer(enemyState, renderer, frameNow, idlePhase) {
        const attackAge = frameNow - (enemyState.attackTriggerAt || 0);
        const attackPulse = attackAge >= 0 && attackAge < 420 ? Math.sin((attackAge / 420) * Math.PI) : 0;
        renderer.body.scale.set(1.35, 0.72 + (attackPulse * 0.08), 1.75 - (attackPulse * 0.08));
        renderer.head.position.z = 0.34 + (attackPulse * 0.14);
        renderer.tail.rotation.y = Math.sin(idlePhase * 2) * 0.35;
        renderer.tail.rotation.x = Math.PI / 8;
    }

    function updateHumanoidEnemyRenderer(enemyState, renderer, frameNow, idlePhase, useWalkBaseClip) {
        const windowRef = getWindowRef();
        const animationBridge = windowRef ? (windowRef.AnimationRuntimeBridge || null) : null;
        const animationSetDef = renderer.animationSetDef || null;
        const animationRigId = renderer.animationRigId || null;
        const isEnemyActionAnimationActive = typeof renderContext.isEnemyActionAnimationActive === 'function'
            ? renderContext.isEnemyActionAnimationActive
            : () => false;
        if (
            animationBridge
            && animationSetDef
            && animationRigId
            && typeof animationBridge.beginLegacyFrame === 'function'
            && typeof animationBridge.setLegacyBaseClip === 'function'
            && typeof animationBridge.requestLegacyActionClip === 'function'
            && typeof animationBridge.applyLegacyFrame === 'function'
        ) {
            animationBridge.beginLegacyFrame(renderer.group, animationRigId);
            animationBridge.setLegacyBaseClip(
                renderer.group,
                animationRigId,
                useWalkBaseClip ? animationSetDef.walkClipId : animationSetDef.idleClipId,
                frameNow
            );
            if (isEnemyActionAnimationActive(animationSetDef.attackClipId, enemyState.attackTriggerAt || 0, frameNow)) {
                animationBridge.requestLegacyActionClip(renderer.group, animationRigId, animationSetDef.attackClipId, {
                    startedAtMs: enemyState.attackTriggerAt || frameNow,
                    startKey: `${enemyState.runtimeId}:attack:${enemyState.attackTriggerAt || 0}`,
                    priority: 2
                });
            }
            if (isEnemyActionAnimationActive(animationSetDef.hitClipId, enemyState.hitReactionTriggerAt || 0, frameNow)) {
                animationBridge.requestLegacyActionClip(renderer.group, animationRigId, animationSetDef.hitClipId, {
                    startedAtMs: enemyState.hitReactionTriggerAt || frameNow,
                    startKey: `${enemyState.runtimeId}:hit:${enemyState.hitReactionTriggerAt || 0}`,
                    priority: 1
                });
            }
            animationBridge.applyLegacyFrame(renderer.group, animationRigId, frameNow);
            return;
        }

        const rig = renderer.group.userData && renderer.group.userData.rig ? renderer.group.userData.rig : null;
        if (!rig) return;
        const attackAge = frameNow - (enemyState.attackTriggerAt || 0);
        const attackPulse = attackAge >= 0 && attackAge < 420 ? Math.sin((attackAge / 420) * Math.PI) : 0;

        rig.leftArm.rotation.set(Math.sin(idlePhase) * 0.06, 0, 0);
        rig.rightArm.rotation.set(-Math.sin(idlePhase) * 0.06, 0, 0);
        rig.leftLowerArm.rotation.set(-0.04, 0, 0);
        rig.rightLowerArm.rotation.set(-0.04, 0, 0);
        rig.leftLeg.rotation.x = 0;
        rig.rightLeg.rotation.x = 0;
        if (rig.leftLowerLeg) rig.leftLowerLeg.rotation.x = 0;
        if (rig.rightLowerLeg) rig.rightLowerLeg.rotation.x = 0;
        if (rig.torso) rig.torso.rotation.set(-0.02, attackPulse * 0.24, 0);
        if (rig.head) rig.head.rotation.set(-0.02, -attackPulse * 0.12, 0);
        if (attackPulse > 0) {
            rig.rightArm.rotation.x = -attackPulse * 1.45;
            rig.rightArm.rotation.z = -attackPulse * 0.18;
            rig.leftArm.rotation.x = attackPulse * 0.2;
        }
    }

    function createEnemyVisualRenderer(options = {}) {
        setRenderContext(options);
        const enemyState = options.enemyState || null;
        const enemyType = options.enemyType || null;
        if (!enemyState || !enemyType) return null;
        if (enemyState.enemyId === 'enemy_boar') return createBoarRenderer(enemyState, enemyType);
        if (enemyState.enemyId === 'enemy_wolf') return createWolfRenderer(enemyState, enemyType);
        if (enemyType.appearance && enemyType.appearance.kind === 'rat') return createRatRenderer(enemyState, enemyType);
        if (enemyType.appearance && enemyType.appearance.kind === 'chicken') return createChickenRenderer(enemyState, enemyType);
        return createHumanoidEnemyRenderer(enemyState, enemyType);
    }

    function updateEnemyVisualRenderer(options = {}) {
        setRenderContext(options);
        const enemyState = options.enemyState || null;
        const renderer = options.renderer || null;
        const frameNow = Number.isFinite(options.frameNow) ? options.frameNow : Date.now();
        const idlePhase = Number.isFinite(options.idlePhase) ? options.idlePhase : 0;
        const visuallyMoving = !!options.visuallyMoving;
        const useWalkBaseClip = !!options.useWalkBaseClip;
        const currentVisualX = Number.isFinite(options.currentVisualX) ? options.currentVisualX : 0;
        const currentVisualY = Number.isFinite(options.currentVisualY) ? options.currentVisualY : 0;
        if (!enemyState || !renderer) return;
        if (renderer.kind === 'rat') {
            updateRatRenderer(enemyState, renderer, frameNow, idlePhase);
            return;
        }
        if (renderer.kind === 'boar') {
            updateBoarRenderer(enemyState, renderer, frameNow, idlePhase, visuallyMoving, useWalkBaseClip, currentVisualX, currentVisualY);
            return;
        }
        if (renderer.kind === 'wolf') {
            updateWolfRenderer(enemyState, renderer, frameNow, idlePhase, visuallyMoving, useWalkBaseClip, currentVisualX, currentVisualY);
            return;
        }
        if (renderer.kind === 'chicken') {
            updateChickenRenderer(enemyState, renderer, frameNow, idlePhase, visuallyMoving, useWalkBaseClip, currentVisualX, currentVisualY);
            return;
        }
        updateHumanoidEnemyRenderer(enemyState, renderer, frameNow, idlePhase, useWalkBaseClip);
    }

    function getEnemyVisualMoveProgress(context = {}, enemyState, frameNow) {
        if (!enemyState) return 1;
        const moved = enemyState.x !== enemyState.prevX || enemyState.y !== enemyState.prevY;
        if (!moved) return 1;
        const moveStartedAt = Number.isFinite(enemyState.moveTriggerAt) ? enemyState.moveTriggerAt : 0;
        if (moveStartedAt <= 0) return 1;
        const durationMs = Number.isFinite(context.enemyMoveLerpDurationMs)
            ? Math.max(1, Math.floor(context.enemyMoveLerpDurationMs))
            : 500;
        const elapsed = Math.max(0, frameNow - moveStartedAt);
        return Math.max(0, Math.min(1, elapsed / durationMs));
    }

    function isEnemyVisuallyMoving(context = {}, enemyState, frameNow) {
        if (!enemyState) return false;
        const prevX = Number.isFinite(enemyState.prevX) ? enemyState.prevX : enemyState.x;
        const prevY = Number.isFinite(enemyState.prevY) ? enemyState.prevY : enemyState.y;
        if (enemyState.x === prevX && enemyState.y === prevY) return false;
        return getEnemyVisualMoveProgress(context, enemyState, frameNow) < 1;
    }

    function shouldEnemyUseWalkBaseClip(context = {}, enemyState, frameNow) {
        if (isEnemyVisuallyMoving(context, enemyState, frameNow)) return true;
        return typeof context.hasTrackedEnemyLocomotionIntent === 'function'
            ? context.hasTrackedEnemyLocomotionIntent(enemyState, frameNow)
            : false;
    }

    function getVisualHeight(context = {}, x, y, z) {
        return typeof context.getVisualHeight === 'function' ? context.getVisualHeight(x, y, z) : 0;
    }

    function updateEnemyVisualFrame(options = {}) {
        setRenderContext(options);
        const enemyState = options.enemyState || null;
        const renderer = options.renderer || null;
        const frameNow = Number.isFinite(options.frameNow) ? options.frameNow : Date.now();
        if (!enemyState || !renderer || !renderer.group || !renderer.hitbox) return;

        const playerState = options.playerState || {};
        const playerTargetId = options.playerTargetId || 'player';
        const moveProgress = getEnemyVisualMoveProgress(options, enemyState, frameNow);
        const prevX = Number.isFinite(enemyState.prevX) ? enemyState.prevX : enemyState.x;
        const prevY = Number.isFinite(enemyState.prevY) ? enemyState.prevY : enemyState.y;
        const hasRecentStepDirection = enemyState.x !== prevX || enemyState.y !== prevY;
        const visuallyMoving = isEnemyVisuallyMoving(options, enemyState, frameNow);
        const useWalkBaseClip = shouldEnemyUseWalkBaseClip(options, enemyState, frameNow);
        const currentVisualX = prevX + ((enemyState.x - prevX) * moveProgress);
        const currentVisualY = prevY + ((enemyState.y - prevY) * moveProgress);
        const prevTerrainHeight = getVisualHeight(options, prevX, prevY, enemyState.z);
        const terrainHeight = getVisualHeight(options, enemyState.x, enemyState.y, enemyState.z);
        const currentVisualHeight = prevTerrainHeight + ((terrainHeight - prevTerrainHeight) * moveProgress);
        const idlePhase = ((frameNow + (currentVisualX * 37) + (currentVisualY * 19)) % 1200) / 1200 * Math.PI * 2;
        const idleBob = Math.sin(idlePhase) * 0.04;
        renderer.group.position.set(currentVisualX, currentVisualHeight + idleBob, currentVisualY);

        let targetYaw = enemyState.facingYaw;
        let snapCombatFacing = false;
        if (
            typeof options.isEnemyPendingDefeat === 'function'
            && options.isEnemyPendingDefeat(enemyState)
            && Number.isFinite(enemyState.pendingDefeatFacingYaw)
        ) {
            targetYaw = enemyState.pendingDefeatFacingYaw;
            snapCombatFacing = true;
        } else if (useWalkBaseClip && hasRecentStepDirection) {
            targetYaw = Math.atan2(enemyState.x - prevX, enemyState.y - prevY);
            snapCombatFacing = false;
        } else if (
            enemyState.currentState === 'aggroed'
            && enemyState.lockedTargetId === playerTargetId
            && (typeof options.isPlayerAlive !== 'function' || options.isPlayerAlive())
            && enemyState.z === playerState.z
            && (typeof options.isPlayerCombatFacingReady !== 'function' || options.isPlayerCombatFacingReady())
        ) {
            targetYaw = Math.atan2(playerState.x - currentVisualX, playerState.y - currentVisualY);
            snapCombatFacing = true;
        }
        if (targetYaw !== undefined) {
            if (snapCombatFacing) {
                renderer.group.rotation.y = targetYaw;
            } else {
                let diff = targetYaw - renderer.group.rotation.y;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                const turnLerp = useWalkBaseClip ? 0.55 : 0.25;
                renderer.group.rotation.y += diff * turnLerp;
            }
        }

        renderer.hitbox.userData.gridX = enemyState.x;
        renderer.hitbox.userData.gridY = enemyState.y;
        renderer.hitbox.userData.z = enemyState.z;
        if (!Number.isFinite(renderer.hitbox.userData.combatLevel)) {
            const enemyType = typeof options.getEnemyDefinition === 'function'
                ? options.getEnemyDefinition(enemyState.enemyId)
                : null;
            renderer.hitbox.userData.combatLevel = getEnemyCombatLevel(enemyType);
        }
        renderer.group.updateMatrixWorld(true);

        updateEnemyVisualRenderer(Object.assign({}, options, {
            idlePhase,
            visuallyMoving,
            useWalkBaseClip,
            currentVisualX,
            currentVisualY
        }));
    }

    window.CombatEnemyRenderRuntime = {
        createEnemyVisualRenderer,
        updateEnemyVisualRenderer,
        updateEnemyVisualFrame,
        getEnemyVisualMoveProgress,
        isEnemyVisuallyMoving,
        shouldEnemyUseWalkBaseClip
    };
})();
