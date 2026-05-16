(function () {
    let renderContext = {};
    const enemyMaterialCache = Object.create(null);
    let enemyHitboxMaterial = null;
    const COMBAT_ENEMY_VISUAL_CULL_DISTANCE = 120;
    const COMBAT_ENEMY_VISUAL_CULL_DISTANCE_SQ = COMBAT_ENEMY_VISUAL_CULL_DISTANCE * COMBAT_ENEMY_VISUAL_CULL_DISTANCE;

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

    function getEnemyLambertMaterial(key, colorHex) {
        if (!enemyMaterialCache[key]) {
            enemyMaterialCache[key] = new THREE.MeshLambertMaterial({ color: colorHex, flatShading: true });
        }
        return enemyMaterialCache[key];
    }

    function createEnemyHitboxMaterial() {
        if (!enemyHitboxMaterial) {
            enemyHitboxMaterial = new THREE.MeshBasicMaterial({
                visible: false,
                side: THREE.DoubleSide
            });
        }
        return enemyHitboxMaterial;
    }

    function createRatRenderer(enemyState, enemyType) {
        const group = new THREE.Group();
        group.rotation.order = 'YXZ';
        const combatLevel = getEnemyCombatLevel(enemyType);

        const furMaterial = getEnemyLambertMaterial('rat:fur', 0x6f665d);
        const darkFurMaterial = getEnemyLambertMaterial('rat:furDark', 0x4f4942);
        const bellyMaterial = getEnemyLambertMaterial('rat:belly', 0xbca893);
        const earMaterial = getEnemyLambertMaterial('rat:ear', 0x8e6f68);
        const noseMaterial = getEnemyLambertMaterial('rat:nose', 0x2a1c1a);
        const eyeMaterial = getEnemyLambertMaterial('rat:eye', 0x11100e);
        const whiskerMaterial = getEnemyLambertMaterial('rat:whisker', 0xe2d4bf);
        const tailMaterial = getEnemyLambertMaterial('rat:tail', 0xb08a80);
        const pawMaterial = getEnemyLambertMaterial('rat:paw', 0x6a564f);
        const toothMaterial = getEnemyLambertMaterial('rat:tooth', 0xe7dcc3);

        const torsoGroup = new THREE.Group();
        torsoGroup.name = 'rat-torso';
        const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), furMaterial);
        body.scale.set(1.15, 0.58, 1.72);
        body.position.set(0, 0.25, 0.02);

        const chest = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), furMaterial);
        chest.scale.set(0.96, 0.68, 0.92);
        chest.position.set(0, 0.28, 0.34);

        const haunch = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2, 0), darkFurMaterial);
        haunch.scale.set(1.18, 0.68, 1.08);
        haunch.position.set(0, 0.23, -0.32);

        const belly = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 0), bellyMaterial);
        belly.scale.set(1.05, 0.36, 1.42);
        belly.position.set(0, 0.13, 0.02);

        const backStripe = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.035, 0.7), darkFurMaterial);
        backStripe.position.set(0, 0.39, 0.0);

        const headGroup = new THREE.Group();
        headGroup.name = 'rat-head';
        headGroup.position.set(0, 0.31, 0.55);
        const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15, 0), furMaterial);
        head.scale.set(0.96, 0.72, 1.04);
        const snoutGeometry = new THREE.ConeGeometry(0.078, 0.2, 4);
        snoutGeometry.rotateX(Math.PI / 2);
        const snout = new THREE.Mesh(snoutGeometry, bellyMaterial);
        snout.position.set(0, -0.02, 0.16);
        const nose = new THREE.Mesh(new THREE.DodecahedronGeometry(0.027, 0), noseMaterial);
        nose.scale.set(1.2, 0.78, 0.9);
        nose.position.set(0, -0.02, 0.27);
        const cheekLeft = new THREE.Mesh(new THREE.DodecahedronGeometry(0.045, 0), bellyMaterial);
        const cheekRight = cheekLeft.clone();
        cheekLeft.scale.set(1.0, 0.65, 0.8);
        cheekRight.scale.copy(cheekLeft.scale);
        cheekLeft.position.set(0.055, -0.035, 0.11);
        cheekRight.position.set(-0.055, -0.035, 0.11);
        const earGeometry = new THREE.ConeGeometry(0.052, 0.065, 4);
        const earLeft = new THREE.Mesh(earGeometry, earMaterial);
        const earRight = earLeft.clone();
        earLeft.position.set(0.095, 0.075, -0.035);
        earRight.position.set(-0.095, 0.075, -0.035);
        earLeft.rotation.set(0.18, 0.05, -0.55);
        earRight.rotation.set(0.18, -0.05, 0.55);
        const eyeLeft = new THREE.Mesh(new THREE.DodecahedronGeometry(0.018, 0), eyeMaterial);
        const eyeRight = eyeLeft.clone();
        eyeLeft.position.set(0.06, 0.025, 0.08);
        eyeRight.position.set(-0.06, 0.025, 0.08);
        const toothLeft = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.052, 0.012), toothMaterial);
        const toothRight = toothLeft.clone();
        toothLeft.position.set(0.018, -0.078, 0.25);
        toothRight.position.set(-0.018, -0.078, 0.25);
        const whiskerGeometry = new THREE.BoxGeometry(0.17, 0.004, 0.004);
        const whiskerLeftUpper = new THREE.Mesh(whiskerGeometry, whiskerMaterial);
        const whiskerLeftLower = whiskerLeftUpper.clone();
        const whiskerRightUpper = whiskerLeftUpper.clone();
        const whiskerRightLower = whiskerLeftUpper.clone();
        whiskerLeftUpper.position.set(0.12, -0.015, 0.17);
        whiskerLeftLower.position.set(0.12, -0.04, 0.15);
        whiskerRightUpper.position.set(-0.12, -0.015, 0.17);
        whiskerRightLower.position.set(-0.12, -0.04, 0.15);
        whiskerLeftUpper.rotation.set(0, -0.2, 0.1);
        whiskerLeftLower.rotation.set(0, -0.28, -0.12);
        whiskerRightUpper.rotation.set(0, 0.2, -0.1);
        whiskerRightLower.rotation.set(0, 0.28, 0.12);
        headGroup.add(
            head,
            snout,
            nose,
            cheekLeft,
            cheekRight,
            earLeft,
            earRight,
            eyeLeft,
            eyeRight,
            toothLeft,
            toothRight,
            whiskerLeftUpper,
            whiskerLeftLower,
            whiskerRightUpper,
            whiskerRightLower
        );

        const tailGroup = new THREE.Group();
        tailGroup.name = 'rat-tail';
        tailGroup.position.set(0, 0.19, -0.49);
        const tailSegmentGeometry = new THREE.CylinderGeometry(0.022, 0.017, 0.22, 5);
        tailSegmentGeometry.rotateX(Math.PI / 2);
        const tailMiddleGeometry = new THREE.CylinderGeometry(0.017, 0.012, 0.2, 5);
        tailMiddleGeometry.rotateX(Math.PI / 2);
        const tailTipGeometry = new THREE.ConeGeometry(0.012, 0.18, 5);
        tailTipGeometry.rotateX(-Math.PI / 2);
        const tail = new THREE.Mesh(tailSegmentGeometry, tailMaterial);
        const tailMiddle = new THREE.Mesh(tailMiddleGeometry, tailMaterial);
        const tailTip = new THREE.Mesh(tailTipGeometry, tailMaterial);
        tail.position.set(0, 0, -0.1);
        tailMiddle.position.set(0.035, 0.006, -0.27);
        tailMiddle.rotation.y = 0.24;
        tailTip.position.set(0.082, 0.01, -0.42);
        tailTip.rotation.y = 0.42;
        tailGroup.add(tail, tailMiddle, tailTip);

        const legOptions = {
            upperLength: 0.14,
            lowerLength: 0.115,
            upperRadiusTop: 0.017,
            upperRadiusBottom: 0.02,
            lowerRadiusTop: 0.014,
            lowerRadiusBottom: 0.011,
            pawSize: [0.052, 0.024, 0.082],
            pawForwardOffset: 0.028,
            upperMaterial: darkFurMaterial,
            lowerMaterial: darkFurMaterial,
            pawMaterial
        };
        const frontLeftLeg = createQuadrupedLegRig(new THREE.Vector3(0.15, 0.22, 0.27), legOptions);
        const frontRightLeg = createQuadrupedLegRig(new THREE.Vector3(-0.15, 0.22, 0.27), legOptions);
        const backLeftLeg = createQuadrupedLegRig(new THREE.Vector3(0.17, 0.2, -0.25), Object.assign({}, legOptions, {
            upperLength: 0.13,
            lowerLength: 0.105,
            pawSize: [0.056, 0.024, 0.078],
            pawForwardOffset: 0.018
        }));
        const backRightLeg = createQuadrupedLegRig(new THREE.Vector3(-0.17, 0.2, -0.25), Object.assign({}, legOptions, {
            upperLength: 0.13,
            lowerLength: 0.105,
            pawSize: [0.056, 0.024, 0.078],
            pawForwardOffset: 0.018
        }));

        const hitbox = new THREE.Mesh(
            new THREE.BoxGeometry(0.86, 0.58, 1.08),
            createEnemyHitboxMaterial()
        );
        hitbox.position.y = 0.29;
        hitbox.userData = {
            type: 'ENEMY',
            gridX: enemyState.x,
            gridY: enemyState.y,
            z: enemyState.z,
            name: enemyType.displayName,
            combatLevel,
            uid: enemyState.runtimeId
        };

        torsoGroup.add(body, chest, haunch, belly, backStripe, headGroup, tailGroup);
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
            kind: 'rat',
            torsoGroup,
            body,
            chest,
            haunch,
            belly,
            backStripe,
            headGroup,
            head,
            snout,
            nose,
            cheekLeft,
            cheekRight,
            earLeft,
            earRight,
            eyeLeft,
            eyeRight,
            toothLeft,
            toothRight,
            whiskerLeftUpper,
            whiskerLeftLower,
            whiskerRightUpper,
            whiskerRightLower,
            tailGroup,
            tail,
            tailMiddle,
            tailTip,
            frontLeftLeg,
            frontRightLeg,
            backLeftLeg,
            backRightLeg
        };
    }

    function createQuadrupedPawMesh(pawSize, pawMaterial, options = {}) {
        const shape = options.pawShape === 'rounded' ? 'rounded' : 'box';
        const geometry = shape === 'rounded'
            ? new THREE.SphereGeometry(0.5, 10, 6)
            : new THREE.BoxGeometry(pawSize[0], pawSize[1], pawSize[2]);
        if (shape === 'rounded') {
            geometry.scale(pawSize[0], pawSize[1], pawSize[2]);
        }
        const paw = new THREE.Mesh(geometry, pawMaterial);
        paw.userData.pawShape = shape;
        paw.userData.pawSize = {
            width: pawSize[0],
            height: pawSize[1],
            depth: pawSize[2]
        };
        return paw;
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
        const paw = createQuadrupedPawMesh(pawSize, pawMaterial, options);

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

        const bodyMaterial = getEnemyLambertMaterial('boar:body', 0x7b5b3c);
        const backMaterial = getEnemyLambertMaterial('boar:back', 0x65492f);
        const bellyMaterial = getEnemyLambertMaterial('boar:belly', 0xa57c56);
        const snoutMaterial = getEnemyLambertMaterial('boar:snout', 0x8b6748);
        const tuskMaterial = getEnemyLambertMaterial('boar:tusk', 0xf2e6cb);
        const legMaterial = getEnemyLambertMaterial('boar:leg', 0x5a4330);
        const hoofMaterial = getEnemyLambertMaterial('boar:hoof', 0x2f241d);
        const eyeMaterial = getEnemyLambertMaterial('boar:eye', 0x1a140f);
        const noseMaterial = getEnemyLambertMaterial('boar:nose', 0x241812);

        const torsoGroup = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.50, 1.04), bodyMaterial);
        const shoulderHump = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.38, 0.48), backMaterial);
        const rump = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.34, 0.42), bodyMaterial);
        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), bellyMaterial);
        const spine = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.72), backMaterial);
        body.position.set(0, 0.39, 0.03);
        shoulderHump.position.set(0, 0.58, 0.20);
        rump.position.set(0, 0.34, -0.32);
        belly.scale.set(1.22, 0.82, 1.36);
        belly.position.set(0, 0.26, 0.04);
        spine.position.set(0, 0.66, 0.01);
        const bristleGeometry = new THREE.ConeGeometry(0.055, 0.21, 4);
        const bristles = [-0.34, -0.21, -0.08, 0.06, 0.19, 0.31, 0.42].map((zOffset, index) => {
            const bristle = new THREE.Mesh(bristleGeometry.clone(), backMaterial);
            bristle.position.set(0, 0.77 - (index * 0.016), zOffset);
            bristle.rotation.set(0, 0, Math.PI / 4);
            bristle.scale.set(1, 1 - (index * 0.055), 1);
            return bristle;
        });

        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.43, 0.58);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.26, 0.34), bodyMaterial);
        const snout = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.18, 0.34), snoutMaterial);
        const noseCap = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.11, 0.08), noseMaterial);
        const brow = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.085, 0.16), backMaterial);
        head.position.set(0, 0, 0);
        snout.position.set(0, -0.03, 0.30);
        noseCap.position.set(0, -0.03, 0.495);
        brow.position.set(0, 0.08, 0.08);
        const tuskGeometry = new THREE.ConeGeometry(0.032, 0.20, 4);
        const tuskLeft = new THREE.Mesh(tuskGeometry, tuskMaterial);
        const tuskRight = tuskLeft.clone();
        tuskLeft.rotation.set(Math.PI / 2, 0, -0.55);
        tuskRight.rotation.set(Math.PI / 2, 0, 0.55);
        tuskLeft.position.set(0.13, -0.075, 0.43);
        tuskRight.position.set(-0.13, -0.075, 0.43);
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
        headGroup.add(head, snout, noseCap, brow, tuskLeft, tuskRight, earLeft, earRight, eyeLeft, eyeRight);

        const tailGroup = new THREE.Group();
        tailGroup.position.set(0, 0.43, -0.54);
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.008, 0.28, 5), hoofMaterial);
        tail.rotation.x = Math.PI / 2;
        tail.position.set(0, 0, -0.06);
        tailGroup.add(tail);

        const frontLeftLeg = createQuadrupedLegRig(new THREE.Vector3(0.29, 0.36, 0.29), {
            upperLength: 0.25,
            lowerLength: 0.20,
            upperRadiusTop: 0.068,
            upperRadiusBottom: 0.078,
            lowerRadiusTop: 0.058,
            lowerRadiusBottom: 0.052,
            pawSize: [0.16, 0.075, 0.18],
            pawForwardOffset: 0.026,
            upperMaterial: legMaterial,
            lowerMaterial: legMaterial,
            pawMaterial: hoofMaterial
        });
        const frontRightLeg = createQuadrupedLegRig(new THREE.Vector3(-0.29, 0.36, 0.29), {
            upperLength: 0.25,
            lowerLength: 0.20,
            upperRadiusTop: 0.068,
            upperRadiusBottom: 0.078,
            lowerRadiusTop: 0.058,
            lowerRadiusBottom: 0.052,
            pawSize: [0.16, 0.075, 0.18],
            pawForwardOffset: 0.026,
            upperMaterial: legMaterial,
            lowerMaterial: legMaterial,
            pawMaterial: hoofMaterial
        });
        const backLeftLeg = createQuadrupedLegRig(new THREE.Vector3(0.28, 0.36, -0.27), {
            upperLength: 0.24,
            lowerLength: 0.20,
            upperRadiusTop: 0.074,
            upperRadiusBottom: 0.084,
            lowerRadiusTop: 0.060,
            lowerRadiusBottom: 0.054,
            pawSize: [0.17, 0.078, 0.19],
            pawForwardOffset: 0.02,
            upperMaterial: legMaterial,
            lowerMaterial: legMaterial,
            pawMaterial: hoofMaterial
        });
        const backRightLeg = createQuadrupedLegRig(new THREE.Vector3(-0.28, 0.36, -0.27), {
            upperLength: 0.24,
            lowerLength: 0.20,
            upperRadiusTop: 0.074,
            upperRadiusBottom: 0.084,
            lowerRadiusTop: 0.060,
            lowerRadiusBottom: 0.054,
            pawSize: [0.17, 0.078, 0.19],
            pawForwardOffset: 0.02,
            upperMaterial: legMaterial,
            lowerMaterial: legMaterial,
            pawMaterial: hoofMaterial
        });
        const hoofSplitGeometry = new THREE.BoxGeometry(0.022, 0.072, 0.026);
        const hoofToeGeometry = new THREE.BoxGeometry(0.062, 0.054, 0.074);
        const hoofToePairs = [frontLeftLeg, frontRightLeg, backLeftLeg, backRightLeg].map((leg) => {
            const hoofSplit = new THREE.Mesh(hoofSplitGeometry.clone(), noseMaterial);
            const hoofToeLeft = new THREE.Mesh(hoofToeGeometry.clone(), hoofMaterial);
            const hoofToeRight = hoofToeLeft.clone();
            hoofSplit.position.set(0, -0.002, 0.074);
            hoofToeLeft.position.set(0.038, -0.004, 0.084);
            hoofToeRight.position.set(-0.038, -0.004, 0.084);
            hoofToeLeft.rotation.y = -0.12;
            hoofToeRight.rotation.y = 0.12;
            leg.paw.add(hoofToeLeft, hoofToeRight, hoofSplit);
            return [hoofToeLeft, hoofToeRight, hoofSplit];
        });

        const hitbox = new THREE.Mesh(
            new THREE.BoxGeometry(1.18, 1.02, 1.36),
            createEnemyHitboxMaterial()
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

        torsoGroup.add(body, shoulderHump, rump, belly, spine, ...bristles, headGroup, tailGroup);
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
            noseCap,
            brow,
            bristles,
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
            backRightLeg,
            hoofToePairs
        };
    }

    function createWolfRenderer(enemyState, enemyType) {
        const group = new THREE.Group();
        group.rotation.order = 'YXZ';
        const combatLevel = getEnemyCombatLevel(enemyType);

        const furMaterial = getEnemyLambertMaterial('wolf:fur', 0x6c645e);
        const furDarkMaterial = getEnemyLambertMaterial('wolf:furDark', 0x4d4844);
        const bellyMaterial = getEnemyLambertMaterial('wolf:belly', 0x93867d);
        const muzzleMaterial = getEnemyLambertMaterial('wolf:muzzle', 0x5a544f);
        const legMaterial = getEnemyLambertMaterial('wolf:leg', 0x4c4743);
        const pawMaterial = getEnemyLambertMaterial('wolf:paw', 0x241f1c);
        const eyeMaterial = getEnemyLambertMaterial('wolf:eye', 0xece7d5);
        const fangMaterial = getEnemyLambertMaterial('wolf:fang', 0xd8d1bd);

        const torsoGroup = new THREE.Group();
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.31, 10, 10), furMaterial);
        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), bellyMaterial);
        const chest = new THREE.Mesh(new THREE.SphereGeometry(0.23, 10, 10), furMaterial);
        const haunch = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), furDarkMaterial);
        const backLine = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.7), furDarkMaterial);
        const neckRuff = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.22), furDarkMaterial);
        body.scale.set(1.2, 0.72, 1.72);
        body.position.set(0, 0.42, 0.02);
        belly.scale.set(1.06, 0.58, 1.22);
        belly.position.set(0, 0.27, 0.08);
        chest.scale.set(0.94, 0.86, 1.08);
        chest.position.set(0, 0.45, 0.28);
        haunch.scale.set(0.98, 0.78, 1.04);
        haunch.position.set(0, 0.39, -0.3);
        backLine.position.set(0, 0.58, 0.02);
        neckRuff.position.set(0, 0.54, 0.43);
        neckRuff.rotation.x = -0.08;

        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.53, 0.68);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.34), furMaterial);
        const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.14, 0.31), muzzleMaterial);
        const neck = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.18), furDarkMaterial);
        head.position.set(0, 0, 0);
        muzzle.position.set(0, -0.02, 0.315);
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
        const fangGeometry = new THREE.ConeGeometry(0.014, 0.07, 4);
        const fangLeft = new THREE.Mesh(fangGeometry, fangMaterial);
        const fangRight = fangLeft.clone();
        fangLeft.rotation.x = Math.PI;
        fangRight.rotation.x = Math.PI;
        fangLeft.position.set(0.045, -0.095, 0.40);
        fangRight.position.set(-0.045, -0.095, 0.40);
        headGroup.add(head, muzzle, neck, earLeft, earRight, eyeLeft, eyeRight, fangLeft, fangRight);

        const tailGroup = new THREE.Group();
        tailGroup.position.set(0, 0.49, -0.62);
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.024, 0.48, 5), furDarkMaterial);
        tail.rotation.x = Math.PI / 2;
        tail.position.set(0, 0, -0.12);
        const tailTip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.13), furMaterial);
        tailTip.position.set(0, 0, -0.37);
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
            createEnemyHitboxMaterial()
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

        torsoGroup.add(body, belly, chest, haunch, backLine, neckRuff, headGroup, tailGroup);
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
            neckRuff,
            headGroup,
            head,
            muzzle,
            neck,
            earLeft,
            earRight,
            eyeLeft,
            eyeRight,
            fangLeft,
            fangRight,
            tailGroup,
            tail,
            tailTip,
            frontLeftLeg,
            frontRightLeg,
            backLeftLeg,
            backRightLeg
        };
    }

    function addPawClaws(paw, material, options = {}) {
        if (!paw) return [];
        const z = Number.isFinite(options.z) ? options.z : 0.065;
        const y = Number.isFinite(options.y) ? options.y : -0.004;
        const spread = Number.isFinite(options.spread) ? options.spread : 0.036;
        const length = Number.isFinite(options.length) ? options.length : 0.07;
        const radius = Number.isFinite(options.radius) ? options.radius : 0.012;
        const geometry = new THREE.ConeGeometry(radius, length, 4);
        const claws = [-spread, 0, spread].map((xOffset) => {
            const claw = new THREE.Mesh(geometry.clone(), material);
            claw.rotation.x = Math.PI / 2;
            claw.position.set(xOffset, y, z);
            paw.add(claw);
            return claw;
        });
        return claws;
    }

    function createBearRenderer(enemyState, enemyType) {
        const group = new THREE.Group();
        group.rotation.order = 'YXZ';
        const combatLevel = getEnemyCombatLevel(enemyType);

        const furMaterial = getEnemyLambertMaterial('bear:fur', 0x5b3d25);
        const darkFurMaterial = getEnemyLambertMaterial('bear:furDark', 0x342418);
        const muzzleMaterial = getEnemyLambertMaterial('bear:muzzle', 0x8a6a4a);
        const bellyMaterial = getEnemyLambertMaterial('bear:belly', 0x735034);
        const pawMaterial = getEnemyLambertMaterial('bear:paw', 0x2a1c14);
        const clawMaterial = getEnemyLambertMaterial('bear:claw', 0xe3d5bd);
        const eyeMaterial = getEnemyLambertMaterial('bear:eye', 0x110c08);
        const noseMaterial = getEnemyLambertMaterial('bear:nose', 0x18100c);

        const torsoGroup = new THREE.Group();
        torsoGroup.name = 'bear-torso';
        const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.36, 0), furMaterial);
        body.scale.set(1.42, 0.88, 1.64);
        body.position.set(0, 0.51, 0);
        const shoulderHump = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 0), darkFurMaterial);
        shoulderHump.scale.set(1.60, 0.94, 1.08);
        shoulderHump.position.set(0, 0.76, 0.25);
        const rump = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 0), furMaterial);
        rump.scale.set(1.16, 0.72, 0.96);
        rump.position.set(0, 0.43, -0.38);
        const belly = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), bellyMaterial);
        belly.scale.set(1.18, 0.60, 1.22);
        belly.position.set(0, 0.31, 0);
        const backRidge = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.13, 0.68), darkFurMaterial);
        backRidge.position.set(0, 0.86, 0.01);

        const headGroup = new THREE.Group();
        headGroup.name = 'bear-head';
        headGroup.position.set(0, 0.74, 0.64);
        const neck = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2, 0), darkFurMaterial);
        neck.scale.set(1.14, 0.86, 0.90);
        neck.position.set(0, -0.035, -0.18);
        const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.23, 0), furMaterial);
        head.scale.set(1.14, 0.94, 0.98);
        const brow = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.08, 0.12), darkFurMaterial);
        brow.position.set(0, 0.075, 0.075);
        const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.17, 0.22), muzzleMaterial);
        muzzle.position.set(0, -0.065, 0.235);
        const nose = new THREE.Mesh(new THREE.DodecahedronGeometry(0.045, 0), noseMaterial);
        nose.scale.set(1.45, 0.86, 0.82);
        nose.position.set(0, -0.05, 0.355);
        const earGeometry = new THREE.ConeGeometry(0.07, 0.08, 5);
        const earLeft = new THREE.Mesh(earGeometry, darkFurMaterial);
        const earRight = earLeft.clone();
        earLeft.position.set(0.14, 0.15, -0.03);
        earRight.position.set(-0.14, 0.15, -0.03);
        earLeft.rotation.set(0.18, 0, -0.38);
        earRight.rotation.set(0.18, 0, 0.38);
        const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), eyeMaterial);
        const eyeRight = eyeLeft.clone();
        eyeLeft.position.set(0.078, 0.03, 0.14);
        eyeRight.position.set(-0.078, 0.03, 0.14);
        const cheekLeft = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.07), muzzleMaterial);
        const cheekRight = cheekLeft.clone();
        cheekLeft.position.set(0.105, -0.08, 0.19);
        cheekRight.position.set(-0.105, -0.08, 0.19);
        headGroup.add(neck, head, brow, muzzle, nose, cheekLeft, cheekRight, earLeft, earRight, eyeLeft, eyeRight);

        const tailGroup = new THREE.Group();
        tailGroup.name = 'bear-tail';
        tailGroup.position.set(0, 0.5, -0.68);
        const tailNub = new THREE.Mesh(new THREE.DodecahedronGeometry(0.07, 0), darkFurMaterial);
        tailNub.scale.set(1, 0.8, 0.72);
        tailGroup.add(tailNub);

        const frontLeftLeg = createQuadrupedLegRig(new THREE.Vector3(0.29, 0.46, 0.31), {
            upperLength: 0.30,
            lowerLength: 0.25,
            upperRadiusTop: 0.088,
            upperRadiusBottom: 0.096,
            lowerRadiusTop: 0.074,
            lowerRadiusBottom: 0.066,
            pawSize: [0.24, 0.09, 0.27],
            pawForwardOffset: 0.045,
            upperMaterial: furMaterial,
            lowerMaterial: darkFurMaterial,
            pawMaterial,
            pawShape: 'rounded'
        });
        const frontRightLeg = createQuadrupedLegRig(new THREE.Vector3(-0.29, 0.46, 0.31), {
            upperLength: 0.30,
            lowerLength: 0.25,
            upperRadiusTop: 0.088,
            upperRadiusBottom: 0.096,
            lowerRadiusTop: 0.074,
            lowerRadiusBottom: 0.066,
            pawSize: [0.24, 0.09, 0.27],
            pawForwardOffset: 0.045,
            upperMaterial: furMaterial,
            lowerMaterial: darkFurMaterial,
            pawMaterial,
            pawShape: 'rounded'
        });
        const backLeftLeg = createQuadrupedLegRig(new THREE.Vector3(0.27, 0.42, -0.34), {
            upperLength: 0.29,
            lowerLength: 0.24,
            upperRadiusTop: 0.086,
            upperRadiusBottom: 0.096,
            lowerRadiusTop: 0.072,
            lowerRadiusBottom: 0.064,
            pawSize: [0.22, 0.09, 0.25],
            pawForwardOffset: 0.025,
            upperMaterial: furMaterial,
            lowerMaterial: darkFurMaterial,
            pawMaterial,
            pawShape: 'rounded'
        });
        const backRightLeg = createQuadrupedLegRig(new THREE.Vector3(-0.27, 0.42, -0.34), {
            upperLength: 0.29,
            lowerLength: 0.24,
            upperRadiusTop: 0.086,
            upperRadiusBottom: 0.096,
            lowerRadiusTop: 0.072,
            lowerRadiusBottom: 0.064,
            pawSize: [0.22, 0.09, 0.25],
            pawForwardOffset: 0.025,
            upperMaterial: furMaterial,
            lowerMaterial: darkFurMaterial,
            pawMaterial,
            pawShape: 'rounded'
        });

        const frontLeftClaws = addPawClaws(frontLeftLeg.paw, clawMaterial, { spread: 0.045, length: 0.08, z: 0.105 });
        const frontRightClaws = addPawClaws(frontRightLeg.paw, clawMaterial, { spread: 0.045, length: 0.08, z: 0.105 });
        const backLeftClaws = addPawClaws(backLeftLeg.paw, clawMaterial, { spread: 0.04, length: 0.075, z: 0.095 });
        const backRightClaws = addPawClaws(backRightLeg.paw, clawMaterial, { spread: 0.04, length: 0.075, z: 0.095 });

        const hitbox = new THREE.Mesh(
            new THREE.BoxGeometry(1.18, 1.16, 1.38),
            createEnemyHitboxMaterial()
        );
        hitbox.position.y = 0.58;
        hitbox.userData = {
            type: 'ENEMY',
            gridX: enemyState.x,
            gridY: enemyState.y,
            z: enemyState.z,
            name: enemyType.displayName,
            combatLevel,
            uid: enemyState.runtimeId
        };

        torsoGroup.add(body, shoulderHump, rump, belly, backRidge, headGroup, tailGroup);
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
            kind: 'bear',
            torsoGroup,
            body,
            shoulderHump,
            rump,
            belly,
            backRidge,
            headGroup,
            neck,
            head,
            brow,
            muzzle,
            nose,
            cheekLeft,
            cheekRight,
            earLeft,
            earRight,
            eyeLeft,
            eyeRight,
            tailGroup,
            tailNub,
            frontLeftLeg,
            frontRightLeg,
            backLeftLeg,
            backRightLeg,
            frontLeftClaws,
            frontRightClaws,
            backLeftClaws,
            backRightClaws
        };
    }

    function createChickenLegRig(basePosition, side, materials) {
        const root = new THREE.Group();
        const upperPivot = new THREE.Group();
        const lowerPivot = new THREE.Group();
        const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.029, 0.18, 5), materials.legMaterial);
        const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.014, 0.16, 5), materials.legMaterial);
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.034, 0.18), materials.footMaterial);
        const toeGeometry = new THREE.ConeGeometry(0.012, 0.065, 4);
        const toeCenter = new THREE.Mesh(toeGeometry, materials.clawMaterial);
        const toeInner = new THREE.Mesh(toeGeometry.clone(), materials.clawMaterial);
        const toeOuter = new THREE.Mesh(toeGeometry.clone(), materials.clawMaterial);

        root.position.copy(basePosition);
        root.rotation.z = side * 0.05;
        upper.position.y = -0.08;
        lowerPivot.position.y = -0.17;
        lower.position.y = -0.075;
        foot.position.set(0, -0.16, 0.075);

        [toeCenter, toeInner, toeOuter].forEach((toe) => {
            toe.rotation.x = Math.PI / 2;
            toe.position.y = -0.165;
        });
        toeCenter.position.z = 0.18;
        toeInner.position.set(side * -0.035, -0.165, 0.15);
        toeInner.rotation.z = side * -0.26;
        toeOuter.position.set(side * 0.035, -0.165, 0.15);
        toeOuter.rotation.z = side * 0.26;

        lowerPivot.add(lower, foot, toeCenter, toeInner, toeOuter);
        upperPivot.add(upper, lowerPivot);
        root.add(upperPivot);

        return {
            root,
            upperPivot,
            lowerPivot,
            foot,
            toeCenter,
            toeInner,
            toeOuter,
            baseX: basePosition.x,
            baseY: basePosition.y,
            baseZ: basePosition.z,
            baseFootZ: foot.position.z,
            side
        };
    }

    function applyChickenLegPose(leg, phase, options = {}) {
        if (!leg) return;
        const walkActive = !!options.walkActive;
        const stride = Math.sin(phase);
        const liftWave = Math.max(0, Math.cos(phase));
        const bob = Number.isFinite(options.bob) ? options.bob : 0;
        const attackPulse = Number.isFinite(options.attackPulse) ? options.attackPulse : 0;
        const hitPulse = Number.isFinite(options.hitPulse) ? options.hitPulse : 0;
        const travel = walkActive ? 0.06 : 0.012;
        const lift = liftWave * (walkActive ? 0.045 : 0.012);

        leg.root.position.set(
            leg.baseX + (stride * 0.012),
            leg.baseY + (bob * 0.05) + (lift * 0.3) + (hitPulse * 0.01),
            leg.baseZ + (stride * travel)
        );
        leg.root.rotation.z = (leg.side * 0.05) + (stride * leg.side * 0.03);
        leg.upperPivot.rotation.x = -0.08 + (stride * (walkActive ? 0.52 : 0.12)) - (attackPulse * 0.08);
        leg.lowerPivot.rotation.x = 0.12 + (Math.max(0, -stride) * 0.42) + (liftWave * (walkActive ? 0.16 : 0.04));
        leg.foot.position.z = leg.baseFootZ + (stride * (walkActive ? 0.025 : 0.006));
        leg.foot.rotation.x = -0.12 + (Math.max(0, stride) * 0.18) - (attackPulse * 0.04);
    }

    function createChickenRenderer(enemyState, enemyType) {
        const group = new THREE.Group();
        group.rotation.order = 'YXZ';
        const combatLevel = getEnemyCombatLevel(enemyType);

        const bodyMaterial = getEnemyLambertMaterial('chicken:body', 0xf4ecd8);
        const chestMaterial = getEnemyLambertMaterial('chicken:chest', 0xfff7df);
        const wingMaterial = getEnemyLambertMaterial('chicken:wing', 0xdfcfad);
        const tailMaterial = getEnemyLambertMaterial('chicken:tail', 0xc8aa68);
        const beakMaterial = getEnemyLambertMaterial('chicken:beak', 0xe5a534);
        const beakTipMaterial = getEnemyLambertMaterial('chicken:beakTip', 0xc98222);
        const legMaterial = getEnemyLambertMaterial('chicken:leg', 0xd0a03a);
        const footMaterial = getEnemyLambertMaterial('chicken:foot', 0xb88524);
        const combMaterial = getEnemyLambertMaterial('chicken:comb', 0xb23b38);
        const eyeMaterial = getEnemyLambertMaterial('chicken:eye', 0x201712);
        const clawMaterial = getEnemyLambertMaterial('chicken:claw', 0x4c3119);

        const torsoGroup = new THREE.Group();
        torsoGroup.name = 'chicken-torso';
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.42, 0.52), bodyMaterial);
        body.position.set(0, 0.32, 0.01);
        const bodyTopPlane = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.055, 0.42), chestMaterial);
        bodyTopPlane.position.set(0, 0.535, 0.02);
        const chest = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), chestMaterial);
        chest.scale.set(1.08, 0.9, 1.0);
        chest.position.set(0, 0.34, 0.24);
        const rump = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.34, 0.34), bodyMaterial);
        rump.position.set(0, 0.31, -0.22);
        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), wingMaterial);
        belly.scale.set(1.05, 0.52, 1.25);
        belly.position.set(0, 0.17, 0.04);
        torsoGroup.add(body, bodyTopPlane, chest, rump, belly);

        const headGroup = new THREE.Group();
        headGroup.name = 'chicken-head';
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.25, 0.26), bodyMaterial);
        head.position.set(0, 0, 0);
        const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), chestMaterial);
        cheek.scale.set(1.15, 0.78, 0.9);
        cheek.position.set(0, -0.03, 0.08);
        const beakUpper = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.17, 4), beakMaterial);
        beakUpper.rotation.x = Math.PI / 2;
        beakUpper.position.set(0, -0.01, 0.235);
        const beakLower = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.035, 0.09), beakMaterial);
        beakLower.position.set(0, -0.055, 0.17);
        const beakTip = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 4), beakTipMaterial);
        beakTip.rotation.x = Math.PI / 2;
        beakTip.position.set(0, -0.012, 0.325);
        const combFront = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.11, 0.045), combMaterial);
        const combMid = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.05), combMaterial);
        const combBack = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.1, 0.045), combMaterial);
        combFront.position.set(0, 0.16, 0.08);
        combMid.position.set(0, 0.18, 0);
        combBack.position.set(0, 0.145, -0.08);
        const wattleLeft = new THREE.Mesh(new THREE.SphereGeometry(0.034, 6, 6), combMaterial);
        const wattleRight = wattleLeft.clone();
        wattleLeft.scale.set(0.75, 1.25, 0.65);
        wattleRight.scale.copy(wattleLeft.scale);
        wattleLeft.position.set(0.035, -0.13, 0.1);
        wattleRight.position.set(-0.035, -0.13, 0.1);
        const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), eyeMaterial);
        const eyeRight = eyeLeft.clone();
        eyeLeft.position.set(0.075, 0.035, 0.105);
        eyeRight.position.set(-0.075, 0.035, 0.105);
        headGroup.add(head, cheek, beakUpper, beakLower, beakTip, combFront, combMid, combBack, wattleLeft, wattleRight, eyeLeft, eyeRight);
        headGroup.position.set(0, 0.57, 0.36);

        const wingLeftGroup = new THREE.Group();
        const wingRightGroup = new THREE.Group();
        wingLeftGroup.name = 'chicken-wing-left';
        wingRightGroup.name = 'chicken-wing-right';
        const wingLeft = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.25, 0.32), wingMaterial);
        const wingRight = wingLeft.clone();
        const wingLeftTip = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.075, 0.25), tailMaterial);
        const wingRightTip = wingLeftTip.clone();
        wingLeft.position.set(0, 0, 0);
        wingRight.position.set(0, 0, 0);
        wingLeftTip.position.set(0.01, -0.11, -0.02);
        wingRightTip.position.set(-0.01, -0.11, -0.02);
        wingLeftGroup.position.set(0.255, 0.32, 0.03);
        wingRightGroup.position.set(-0.255, 0.32, 0.03);
        wingLeftGroup.rotation.z = -0.22;
        wingRightGroup.rotation.z = 0.22;
        wingLeftGroup.add(wingLeft, wingLeftTip);
        wingRightGroup.add(wingRight, wingRightTip);

        const tailGroup = new THREE.Group();
        tailGroup.name = 'chicken-tail-fan';
        tailGroup.position.set(0, 0.4, -0.36);
        const tailCenter = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.30, 0.085), tailMaterial);
        const tailLeft = tailCenter.clone();
        const tailRight = tailCenter.clone();
        tailCenter.position.set(0, 0.075, -0.075);
        tailCenter.rotation.x = -0.72;
        tailLeft.position.set(0.105, 0.045, -0.055);
        tailLeft.rotation.set(-0.62, 0.10, -0.52);
        tailRight.position.set(-0.105, 0.045, -0.055);
        tailRight.rotation.set(-0.62, -0.10, 0.52);
        tailGroup.add(tailCenter, tailLeft, tailRight);

        const legMaterials = { legMaterial, footMaterial, clawMaterial };
        const legLeft = createChickenLegRig(new THREE.Vector3(0.12, 0.22, -0.05), 1, legMaterials);
        const legRight = createChickenLegRig(new THREE.Vector3(-0.12, 0.22, -0.05), -1, legMaterials);

        const hitbox = new THREE.Mesh(
            new THREE.BoxGeometry(1.35, 1.25, 1.35),
            createEnemyHitboxMaterial()
        );
        hitbox.position.y = 0.62;
        hitbox.userData = {
            type: 'ENEMY',
            gridX: enemyState.x,
            gridY: enemyState.y,
            z: enemyState.z,
            name: enemyType.displayName,
            combatLevel,
            uid: enemyState.runtimeId
        };

        group.add(torsoGroup, headGroup, wingLeftGroup, wingRightGroup, tailGroup, legLeft.root, legRight.root, hitbox);
        return {
            group,
            hitbox,
            kind: 'chicken',
            torsoGroup,
            body,
            bodyTopPlane,
            chest,
            rump,
            belly,
            headGroup,
            head,
            cheek,
            beakUpper,
            beakLower,
            beakTip,
            combFront,
            combMid,
            combBack,
            wattleLeft,
            wattleRight,
            wingLeftGroup,
            wingRightGroup,
            wingLeft,
            wingRight,
            wingLeftTip,
            wingRightTip,
            tailGroup,
            tailCenter,
            tailLeft,
            tailRight,
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
            createEnemyHitboxMaterial()
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
        renderer.belly.position.set(0, 0.26 - attackPulse * 0.02 + hitPulse * 0.02, 0.04);
        renderer.headGroup.position.set(0, 0.43 + bob * 0.35 - attackPulse * 0.06 + hitPulse * 0.03, 0.58 + attackPulse * 0.14 - hitPulse * 0.05);
        renderer.headGroup.rotation.set(0.06 + headSwing - attackPulse * 0.18 + hitPulse * 0.08, 0, headSwing * 0.24);
        renderer.earLeft.rotation.z = -0.35 + headSwing * 0.5 - attackPulse * 0.04;
        renderer.earRight.rotation.z = 0.35 - headSwing * 0.5 + attackPulse * 0.04;
        renderer.tailGroup.rotation.set(-0.1 + attackPulse * 0.06, 0, -0.18 + tailSwing);

        const leadPhase = gaitAngle;
        const followPhase = leadPhase + Math.PI;
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

    function updateBearRenderer(enemyState, renderer, frameNow, idlePhase, visuallyMoving, useWalkBaseClip, currentVisualX, currentVisualY) {
        const walkActive = visuallyMoving || useWalkBaseClip;
        const gaitPhase = (frameNow / 225) + (currentVisualX * 0.14) + (currentVisualY * 0.12);
        const gaitAngle = gaitPhase * Math.PI * 2;
        const attackAge = frameNow - (enemyState.attackTriggerAt || 0);
        const attackPulse = attackAge >= 0 && attackAge < 520 ? Math.sin((attackAge / 520) * Math.PI) : 0;
        const hitAge = frameNow - (enemyState.hitReactionTriggerAt || 0);
        const hitPulse = hitAge >= 0 && hitAge < 420 ? Math.sin((hitAge / 420) * Math.PI) : 0;
        const idleBob = Math.sin(idlePhase * 1.35) * 0.014;
        const walkBob = walkActive ? Math.abs(Math.sin(gaitAngle * 2)) * 0.02 : 0;
        const bob = idleBob + walkBob;
        const shoulderRoll = walkActive ? Math.sin(gaitAngle * 2) * 0.018 : Math.sin(idlePhase * 1.05) * 0.008;
        const headSwing = walkActive ? Math.sin(gaitAngle) * 0.035 : Math.sin(idlePhase * 1.4) * 0.018;
        const tailFlick = walkActive ? Math.sin(gaitAngle * 2 + 0.3) * 0.08 : Math.sin(idlePhase * 1.8) * 0.035;

        renderer.group.rotation.x = -0.025 + shoulderRoll * 0.18 - attackPulse * 0.08 + hitPulse * 0.05;
        renderer.torsoGroup.position.set(0, bob - attackPulse * 0.045 + hitPulse * 0.04, 0);
        renderer.torsoGroup.rotation.set(-attackPulse * 0.06 + hitPulse * 0.04, 0, shoulderRoll * 0.22);
        renderer.body.scale.set(1.32 + hitPulse * 0.025, 0.82 - attackPulse * 0.04 + hitPulse * 0.02, 1.72 + attackPulse * 0.06);
        renderer.shoulderHump.position.set(0, 0.68 + shoulderRoll * 0.35 - attackPulse * 0.02, 0.28 + attackPulse * 0.03);
        renderer.shoulderHump.scale.set(1.36 + attackPulse * 0.04, 0.74 + walkBob * 1.15, 0.96);
        renderer.rump.position.set(0, 0.48 - shoulderRoll * 0.2 + hitPulse * 0.025, -0.38 - attackPulse * 0.035);
        renderer.belly.position.set(0, 0.3 - attackPulse * 0.015 + hitPulse * 0.02, 0.02);
        renderer.backRidge.rotation.z = shoulderRoll * 0.2;
        renderer.headGroup.position.set(0, 0.74 + bob * 0.28 - attackPulse * 0.055 + hitPulse * 0.035, 0.72 + attackPulse * 0.17 - hitPulse * 0.065);
        renderer.headGroup.rotation.set(0.02 + headSwing * 0.35 - attackPulse * 0.18 + hitPulse * 0.08, 0, headSwing * 0.18);
        renderer.brow.position.y = 0.08 + attackPulse * 0.01 - hitPulse * 0.005;
        renderer.muzzle.position.z = 0.25 + attackPulse * 0.035;
        renderer.earLeft.rotation.z = -0.38 + headSwing * 0.24 - attackPulse * 0.035;
        renderer.earRight.rotation.z = 0.38 - headSwing * 0.24 + attackPulse * 0.035;
        renderer.tailGroup.rotation.set(0.08 + hitPulse * 0.03, 0, tailFlick - attackPulse * 0.05);

        const leadPhase = gaitAngle;
        const followPhase = gaitAngle + Math.PI;
        applyQuadrupedLegPose(renderer.frontLeftLeg, resolveQuadrupedLegPose(leadPhase, {
            travel: walkActive ? 0.07 : 0.008,
            lift: walkActive ? 0.024 : 0.005,
            upperSwing: walkActive ? 0.46 : 0.08,
            kneeBend: 0.5,
            kneeLift: 0.08,
            pawFlex: 0.1,
            upperBias: 0.1,
            lowerBias: -0.08,
            splay: 0.035
        }));
        applyQuadrupedLegPose(renderer.frontRightLeg, resolveQuadrupedLegPose(followPhase, {
            travel: walkActive ? 0.07 : 0.008,
            lift: walkActive ? 0.024 : 0.005,
            upperSwing: walkActive ? 0.46 : 0.08,
            kneeBend: 0.5,
            kneeLift: 0.08,
            pawFlex: 0.1,
            upperBias: 0.1,
            lowerBias: -0.08,
            splay: -0.035
        }));
        applyQuadrupedLegPose(renderer.backLeftLeg, resolveQuadrupedLegPose(followPhase, {
            travel: walkActive ? 0.058 : 0.007,
            lift: walkActive ? 0.02 : 0.004,
            upperSwing: walkActive ? 0.4 : 0.07,
            kneeBend: 0.44,
            kneeLift: 0.07,
            pawFlex: 0.08,
            upperBias: -0.08,
            lowerBias: 0.04,
            splay: 0.025
        }));
        applyQuadrupedLegPose(renderer.backRightLeg, resolveQuadrupedLegPose(leadPhase, {
            travel: walkActive ? 0.058 : 0.007,
            lift: walkActive ? 0.02 : 0.004,
            upperSwing: walkActive ? 0.4 : 0.07,
            kneeBend: 0.44,
            kneeLift: 0.07,
            pawFlex: 0.08,
            upperBias: -0.08,
            lowerBias: 0.04,
            splay: -0.025
        }));
    }

    function updateChickenRenderer(enemyState, renderer, frameNow, idlePhase, visuallyMoving, useWalkBaseClip, currentVisualX, currentVisualY) {
        const walkActive = visuallyMoving || useWalkBaseClip;
        const gaitPhase = (frameNow / 170) + (currentVisualX * 0.27) + (currentVisualY * 0.31);
        const gaitAngle = gaitPhase * Math.PI * 2;
        const walkPulse = walkActive ? Math.sin(gaitAngle) : Math.sin(idlePhase * 1.7) * 0.25;
        const attackAge = frameNow - (enemyState.attackTriggerAt || 0);
        const attackPulse = attackAge >= 0 && attackAge < 360 ? Math.sin((attackAge / 360) * Math.PI) : 0;
        const hitAge = frameNow - (enemyState.hitReactionTriggerAt || 0);
        const hitPulse = hitAge >= 0 && hitAge < 360 ? Math.sin((hitAge / 360) * Math.PI) : 0;
        const bob = Math.sin(idlePhase * 2.1) * 0.018 + (walkActive ? Math.abs(Math.sin(gaitAngle * 2)) * 0.026 : 0);
        const idlePeck = walkActive ? 0 : Math.max(0, Math.sin(idlePhase * 1.35 - 0.65));
        const peckPulse = idlePeck * idlePeck * idlePeck;
        const headTilt = walkActive ? walkPulse * 0.035 : Math.sin(idlePhase * 1.6) * 0.022;
        const wingFlap = (walkActive ? Math.sin(gaitAngle * 2.0) * 0.22 : Math.sin(idlePhase * 2.35) * 0.08)
            + (attackPulse * 0.3)
            - (hitPulse * 0.16);
        const tailFlick = (walkActive ? Math.sin(gaitAngle * 2.0 + 0.7) * 0.2 : Math.sin(idlePhase * 2.0) * 0.1)
            + (attackPulse * 0.1)
            - (hitPulse * 0.12);

        renderer.group.rotation.x = -0.018 + (walkActive ? walkPulse * 0.025 : Math.sin(idlePhase * 1.4) * 0.01) - attackPulse * 0.08 + hitPulse * 0.05;
        renderer.torsoGroup.position.set(0, bob - attackPulse * 0.035 + hitPulse * 0.03, 0);
        renderer.torsoGroup.rotation.set(-attackPulse * 0.06 + hitPulse * 0.04, 0, walkActive ? walkPulse * 0.018 : Math.sin(idlePhase * 1.15) * 0.01);

        renderer.body.scale.set(1.0 - hitPulse * 0.025, 1.0 - attackPulse * 0.055 + hitPulse * 0.02, 1.0 + attackPulse * 0.06 - hitPulse * 0.025);
        renderer.chest.position.set(0, 0.34 - attackPulse * 0.025 + hitPulse * 0.018, 0.24 + attackPulse * 0.055 - hitPulse * 0.03);
        renderer.rump.position.set(0, 0.31 + hitPulse * 0.015, -0.22 - attackPulse * 0.025);
        renderer.belly.position.set(0, 0.17 - attackPulse * 0.015, 0.04);

        renderer.headGroup.position.set(
            0,
            0.57 + (bob * 0.65) - (peckPulse * 0.045) - (attackPulse * 0.055) + (hitPulse * 0.04),
            0.36 + (peckPulse * 0.075) + (attackPulse * 0.2) - (hitPulse * 0.085)
        );
        renderer.headGroup.rotation.set(
            -0.02 - (peckPulse * 0.34) - (attackPulse * 0.2) + (hitPulse * 0.12),
            0,
            headTilt
        );
        renderer.combFront.scale.set(1, 1 + attackPulse * 0.08 - hitPulse * 0.04, 1);
        renderer.combMid.scale.set(1, 1 + attackPulse * 0.1 - hitPulse * 0.05, 1);
        renderer.wattleLeft.position.y = -0.13 - (attackPulse * 0.015) + (hitPulse * 0.01);
        renderer.wattleRight.position.y = renderer.wattleLeft.position.y;

        renderer.wingLeftGroup.position.set(0.255, 0.32 + bob * 0.32 - hitPulse * 0.015, 0.03);
        renderer.wingRightGroup.position.set(-0.255, 0.32 + bob * 0.32 - hitPulse * 0.015, 0.03);
        renderer.wingLeftGroup.rotation.set(0.02 + attackPulse * 0.04, 0, -0.22 - wingFlap);
        renderer.wingRightGroup.rotation.set(0.02 + attackPulse * 0.04, 0, 0.22 + wingFlap);
        renderer.wingLeftTip.rotation.x = 0.08 + wingFlap * 0.25;
        renderer.wingRightTip.rotation.x = 0.08 + wingFlap * 0.25;

        renderer.tailGroup.position.set(0, 0.4 + bob * 0.22 - hitPulse * 0.03, -0.36 - attackPulse * 0.025);
        renderer.tailGroup.rotation.set(-0.08 - attackPulse * 0.08 + hitPulse * 0.04, 0, tailFlick);
        renderer.tailLeft.rotation.z = -0.42 + tailFlick * 0.28;
        renderer.tailRight.rotation.z = 0.42 + tailFlick * 0.28;

        applyChickenLegPose(renderer.legLeft, gaitAngle, { walkActive, bob, attackPulse, hitPulse });
        applyChickenLegPose(renderer.legRight, gaitAngle + Math.PI, { walkActive, bob, attackPulse, hitPulse });
    }


    function updateRatRenderer(enemyState, renderer, frameNow, idlePhase, visuallyMoving, useWalkBaseClip, currentVisualX, currentVisualY) {
        const walkActive = !!visuallyMoving || !!useWalkBaseClip;
        const gaitPhase = (frameNow / 280) + (currentVisualX * 0.18) + (currentVisualY * 0.14);
        const gaitAngle = gaitPhase * Math.PI * 2;
        const attackAge = frameNow - (enemyState.attackTriggerAt || 0);
        const attackPulse = attackAge >= 0 && attackAge < 420 ? Math.sin((attackAge / 420) * Math.PI) : 0;
        const hitAge = frameNow - (enemyState.hitReactionTriggerAt || 0);
        const hitPulse = hitAge >= 0 && hitAge < 320 ? Math.sin((hitAge / 320) * Math.PI) : 0;
        const idleBob = Math.sin(idlePhase * 2.35) * 0.01;
        const walkBob = walkActive ? Math.abs(Math.sin(gaitAngle * 2)) * 0.012 : 0;
        const bob = idleBob + walkBob;
        const sniff = walkActive ? Math.sin(gaitAngle) * 0.028 : Math.sin(idlePhase * 1.9) * 0.02;
        const spineWave = walkActive ? Math.sin(gaitAngle * 2) * 0.018 : Math.sin(idlePhase * 1.45) * 0.008;
        const tailSwing = (walkActive ? Math.sin(gaitAngle * 2.2 + 0.4) * 0.28 : Math.sin(idlePhase * 2.15) * 0.16)
            + (attackPulse * 0.08) - (hitPulse * 0.1);

        if (renderer.group) renderer.group.rotation.x = -0.02 + spineWave * 0.25 - attackPulse * 0.055 + hitPulse * 0.045;
        if (renderer.torsoGroup && renderer.torsoGroup.position) {
            renderer.torsoGroup.position.set(0, bob - attackPulse * 0.026 + hitPulse * 0.026, 0);
        }
        if (renderer.torsoGroup && renderer.torsoGroup.rotation) {
            renderer.torsoGroup.rotation.set(-attackPulse * 0.045 + hitPulse * 0.04, 0, spineWave * 0.32);
        }
        if (renderer.body && renderer.body.scale) {
            renderer.body.scale.set(1.15 + hitPulse * 0.025, 0.58 - attackPulse * 0.035 + hitPulse * 0.02, 1.72 + attackPulse * 0.075 + spineWave);
        }
        if (renderer.chest && renderer.chest.position) {
            renderer.chest.position.set(0, 0.28 + spineWave * 0.25 - attackPulse * 0.018, 0.34 + attackPulse * 0.04);
        }
        if (renderer.haunch && renderer.haunch.position) {
            renderer.haunch.position.set(0, 0.23 - spineWave * 0.22 + hitPulse * 0.015, -0.32 - attackPulse * 0.026);
        }
        if (renderer.belly && renderer.belly.position) {
            renderer.belly.position.set(0, 0.13 - attackPulse * 0.012 + hitPulse * 0.012, 0.02);
        }
        if (renderer.backStripe && renderer.backStripe.rotation) renderer.backStripe.rotation.z = spineWave * 0.25;
        if (renderer.headGroup && renderer.headGroup.position) {
            renderer.headGroup.position.set(
                0,
                0.31 + bob * 0.42 - attackPulse * 0.035 + hitPulse * 0.02,
                0.55 + sniff + attackPulse * 0.16 - hitPulse * 0.05
            );
        } else if (renderer.head && renderer.head.position) {
            renderer.head.position.z = 0.34 + attackPulse * 0.14;
        }
        if (renderer.headGroup && renderer.headGroup.rotation) {
            renderer.headGroup.rotation.set(-0.04 + sniff * 0.55 - attackPulse * 0.16 + hitPulse * 0.08, 0, sniff * 0.35);
        }
        if (renderer.head && renderer.head.position) renderer.head.position.z = attackPulse * 0.012;
        if (renderer.earLeft && renderer.earLeft.rotation) renderer.earLeft.rotation.z = -0.55 + sniff * 0.8 - attackPulse * 0.06;
        if (renderer.earRight && renderer.earRight.rotation) renderer.earRight.rotation.z = 0.55 - sniff * 0.8 + attackPulse * 0.06;
        if (renderer.whiskerLeftUpper && renderer.whiskerLeftUpper.rotation) renderer.whiskerLeftUpper.rotation.z = 0.1 + sniff * 0.9;
        if (renderer.whiskerLeftLower && renderer.whiskerLeftLower.rotation) renderer.whiskerLeftLower.rotation.z = -0.12 + sniff * 0.7;
        if (renderer.whiskerRightUpper && renderer.whiskerRightUpper.rotation) renderer.whiskerRightUpper.rotation.z = -0.1 - sniff * 0.9;
        if (renderer.whiskerRightLower && renderer.whiskerRightLower.rotation) renderer.whiskerRightLower.rotation.z = 0.12 - sniff * 0.7;
        if (renderer.tailGroup && renderer.tailGroup.rotation) {
            renderer.tailGroup.rotation.set(0.08 + attackPulse * 0.04 - hitPulse * 0.04, Math.sin(idlePhase * 1.75) * 0.08, -0.18 + tailSwing);
        }
        if (renderer.tail && renderer.tail.rotation) {
            renderer.tail.rotation.y = Math.sin(idlePhase * 2) * 0.12;
            renderer.tail.rotation.x = 0;
        }
        if (renderer.tailMiddle && renderer.tailMiddle.rotation) renderer.tailMiddle.rotation.y = 0.24 + tailSwing * 0.28;
        if (renderer.tailTip && renderer.tailTip.rotation) renderer.tailTip.rotation.y = 0.42 + tailSwing * 0.4;

        const leadPhase = walkActive ? gaitAngle : idlePhase * 0.35;
        const followPhase = gaitAngle + Math.PI;
        applyQuadrupedLegPose(renderer.frontLeftLeg, resolveQuadrupedLegPose(leadPhase, {
            travel: walkActive ? 0.036 : 0.001,
            lift: walkActive ? 0.024 : 0.001,
            upperSwing: walkActive ? 0.34 : 0.02,
            kneeBend: walkActive ? 0.36 : 0.035,
            kneeLift: walkActive ? 0.07 : 0.01,
            pawFlex: walkActive ? 0.08 : 0.01,
            upperBias: 0.04,
            lowerBias: -0.06,
            splay: 0.035
        }));
        applyQuadrupedLegPose(renderer.frontRightLeg, resolveQuadrupedLegPose(followPhase, {
            travel: walkActive ? 0.036 : 0.001,
            lift: walkActive ? 0.024 : 0.001,
            upperSwing: walkActive ? 0.34 : 0.02,
            kneeBend: walkActive ? 0.36 : 0.035,
            kneeLift: walkActive ? 0.07 : 0.01,
            pawFlex: walkActive ? 0.08 : 0.01,
            upperBias: 0.04,
            lowerBias: -0.06,
            splay: -0.035
        }));
        applyQuadrupedLegPose(renderer.backLeftLeg, resolveQuadrupedLegPose(followPhase, {
            travel: walkActive ? 0.032 : 0.001,
            lift: walkActive ? 0.018 : 0.001,
            upperSwing: walkActive ? 0.3 : 0.018,
            kneeBend: walkActive ? 0.32 : 0.03,
            kneeLift: walkActive ? 0.06 : 0.008,
            pawFlex: walkActive ? 0.06 : 0.008,
            upperBias: -0.06,
            lowerBias: 0.03,
            splay: 0.025
        }));
        applyQuadrupedLegPose(renderer.backRightLeg, resolveQuadrupedLegPose(leadPhase, {
            travel: walkActive ? 0.032 : 0.001,
            lift: walkActive ? 0.018 : 0.001,
            upperSwing: walkActive ? 0.3 : 0.018,
            kneeBend: walkActive ? 0.32 : 0.03,
            kneeLift: walkActive ? 0.06 : 0.008,
            pawFlex: walkActive ? 0.06 : 0.008,
            upperBias: -0.06,
            lowerBias: 0.03,
            splay: -0.025
        }));
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
        const appearanceKind = enemyType.appearance && enemyType.appearance.kind;
        if (appearanceKind === 'boar') return createBoarRenderer(enemyState, enemyType);
        if (appearanceKind === 'wolf') return createWolfRenderer(enemyState, enemyType);
        if (appearanceKind === 'bear') return createBearRenderer(enemyState, enemyType);
        if (appearanceKind === 'rat') return createRatRenderer(enemyState, enemyType);
        if (appearanceKind === 'chicken') return createChickenRenderer(enemyState, enemyType);
        return createHumanoidEnemyRenderer(enemyState, enemyType);
    }

    function ensureEnemyVisualRenderLayer(options = {}) {
        const sceneRef = options.scene || null;
        const existingLayer = options.layer || null;
        const threeRef = options.THREE || (typeof THREE !== 'undefined' ? THREE : null);
        if (existingLayer) return existingLayer;
        if (!sceneRef || !threeRef || typeof threeRef.Group !== 'function') return null;
        const layer = new threeRef.Group();
        layer.name = typeof options.name === 'string' && options.name ? options.name : 'combat-enemies';
        sceneRef.add(layer);
        return layer;
    }

    function resolveEnemyHealthBarYOffset(renderer) {
        if (!renderer) return 1.15;
        if (renderer.kind === 'rat') return 0.66;
        if (renderer.kind === 'chicken') return 0.88;
        if (renderer.kind === 'boar') return 0.82;
        if (renderer.kind === 'wolf') return 0.9;
        if (renderer.kind === 'bear') return 0.98;
        return 1.15;
    }

    function mountEnemyVisualRenderer(options = {}) {
        setRenderContext(options);
        const enemyState = options.enemyState || null;
        const enemyType = options.enemyType || null;
        const layer = options.layer || null;
        if (!enemyState || !enemyType || !layer) return null;

        const renderer = options.renderer || createEnemyVisualRenderer(options);
        if (!renderer || !renderer.group) return null;

        if (typeof options.createHitpointsBarRenderer === 'function' && !renderer.healthBarEl) {
            const hitpointsBar = options.createHitpointsBarRenderer() || {};
            renderer.healthBarEl = hitpointsBar.el || null;
            renderer.healthBarFillEl = hitpointsBar.fill || null;
        }
        renderer.maxHealth = Number.isFinite(enemyType.stats && enemyType.stats.hitpoints)
            ? Math.max(1, Math.floor(enemyType.stats.hitpoints))
            : 1;
        renderer.healthBarYOffset = resolveEnemyHealthBarYOffset(renderer);
        renderer.group.position.set(enemyState.x, 0, enemyState.y);
        renderer.group.rotation.y = enemyState.facingYaw || 0;
        layer.add(renderer.group);
        renderer.group.updateMatrixWorld(true);
        if (Array.isArray(options.environmentMeshes) && renderer.hitbox) {
            options.environmentMeshes.push(renderer.hitbox);
        }
        if (options.renderersById && enemyState.runtimeId) {
            options.renderersById[enemyState.runtimeId] = renderer;
        }
        return renderer;
    }

    function unmountEnemyVisualRenderer(options = {}) {
        const renderersById = options.renderersById || null;
        const enemyId = options.enemyId;
        const renderer = options.renderer || (renderersById && enemyId ? renderersById[enemyId] : null);
        const result = {
            renderer,
            environmentMeshes: Array.isArray(options.environmentMeshes) ? options.environmentMeshes : null
        };
        if (!renderer) return result;
        if (renderer.group && renderer.group.parent && typeof renderer.group.parent.remove === 'function') {
            renderer.group.parent.remove(renderer.group);
        }
        if (typeof options.removeHitpointsBarRenderer === 'function') {
            options.removeHitpointsBarRenderer(renderer);
        }
        if (Array.isArray(options.environmentMeshes)) {
            result.environmentMeshes = options.environmentMeshes.filter((mesh) => mesh !== renderer.hitbox);
        }
        if (renderersById && enemyId) delete renderersById[enemyId];
        return result;
    }

    function clearEnemyVisualRenderLayer(options = {}) {
        const layer = options.layer || null;
        if (layer && layer.parent) layer.parent.remove(layer);
        return null;
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
            updateRatRenderer(enemyState, renderer, frameNow, idlePhase, visuallyMoving, useWalkBaseClip, currentVisualX, currentVisualY);
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
        if (renderer.kind === 'bear') {
            updateBearRenderer(enemyState, renderer, frameNow, idlePhase, visuallyMoving, useWalkBaseClip, currentVisualX, currentVisualY);
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

    function shouldRenderEnemyVisualFrame(options = {}, enemyState, currentVisualX, currentVisualY) {
        if (!enemyState) return false;
        const playerState = options.playerState || {};
        const playerTargetId = options.playerTargetId || 'player';
        if (enemyState.currentState === 'aggroed' || enemyState.lockedTargetId === playerTargetId) return true;
        if (playerState.lockedTargetId === enemyState.runtimeId) return true;
        if (typeof options.isEnemyPendingDefeat === 'function' && options.isEnemyPendingDefeat(enemyState)) return true;
        if (enemyState.z !== playerState.z) return false;
        const playerX = Number.isFinite(playerState.x) ? playerState.x : currentVisualX;
        const playerY = Number.isFinite(playerState.y) ? playerState.y : currentVisualY;
        const dx = currentVisualX - playerX;
        const dy = currentVisualY - playerY;
        return ((dx * dx) + (dy * dy)) <= COMBAT_ENEMY_VISUAL_CULL_DISTANCE_SQ;
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
        const shouldRenderVisual = shouldRenderEnemyVisualFrame(options, enemyState, currentVisualX, currentVisualY);
        renderer.group.visible = shouldRenderVisual;

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

        if (!shouldRenderVisual) return;
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
        ensureEnemyVisualRenderLayer,
        mountEnemyVisualRenderer,
        unmountEnemyVisualRenderer,
        clearEnemyVisualRenderLayer,
        updateEnemyVisualRenderer,
        updateEnemyVisualFrame,
        getEnemyVisualMoveProgress,
        isEnemyVisuallyMoving,
        shouldEnemyUseWalkBaseClip
    };
})();
