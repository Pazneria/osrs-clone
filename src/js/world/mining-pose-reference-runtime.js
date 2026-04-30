(function () {
    const MINING_REFERENCE_VARIANTS = Object.freeze([
        { label: '1', name: 'Balanced Arc' },
        { label: '2', name: 'Heavy Windup' },
        { label: '3', name: 'Quick Chops' },
        { label: '4', name: 'Wide Cross' }
    ]);

    let miningPoseReferences = [];

    function requireThree(three) {
        if (!three) throw new Error('World mining pose reference runtime requires THREE.');
        return three;
    }

    function createPickaxePoseReferenceRig(options = {}) {
        const buildAppearanceFromEquipment = typeof options.buildAppearanceFromEquipment === 'function'
            ? options.buildAppearanceFromEquipment
            : null;
        const createPlayerRigFromAppearance = typeof options.createPlayerRigFromAppearance === 'function'
            ? options.createPlayerRigFromAppearance
            : null;
        const createPlayerRigFromCurrentAppearance = typeof options.createPlayerRigFromCurrentAppearance === 'function'
            ? options.createPlayerRigFromCurrentAppearance
            : null;
        if (!createPlayerRigFromCurrentAppearance) return null;
        if (!buildAppearanceFromEquipment || !createPlayerRigFromAppearance) {
            return createPlayerRigFromCurrentAppearance();
        }

        const appearance = buildAppearanceFromEquipment();
        if (!appearance || !Array.isArray(appearance.slots)) return createPlayerRigFromCurrentAppearance();

        const forcedAppearance = {
            gender: appearance.gender,
            colors: Array.isArray(appearance.colors) ? appearance.colors.slice(0, 5) : [0, 0, 0, 0, 0],
            slots: appearance.slots.map((slot) => (slot ? { kind: slot.kind, id: slot.id } : null))
        };

        forcedAppearance.slots[3] = { kind: 'item', id: 'iron_pickaxe' };
        return createPlayerRigFromAppearance(forcedAppearance);
    }

    function getPlayerRigShoulderPivotLocal(rig, playerShoulderPivot) {
        const shoulderPivot = playerShoulderPivot || { x: 0.42, y: 1.42, z: 0 };
        const defaultTorsoY = 1.05;
        const torsoY = (rig && rig.torso && rig.torso.userData && rig.torso.userData.defaultPos && Number.isFinite(rig.torso.userData.defaultPos.y))
            ? rig.torso.userData.defaultPos.y
            : ((rig && rig.torso && Number.isFinite(rig.torso.position.y)) ? rig.torso.position.y : defaultTorsoY);
        return {
            x: shoulderPivot.x,
            y: shoulderPivot.y - torsoY,
            z: shoulderPivot.z
        };
    }

    function resetMiningReferencePose(rig, playerShoulderPivot) {
        if (!rig) return;
        const shoulderPivot = getPlayerRigShoulderPivotLocal(rig, playerShoulderPivot);
        rig.leftArm.position.set(shoulderPivot.x, shoulderPivot.y, shoulderPivot.z);
        rig.rightArm.position.set(-shoulderPivot.x, shoulderPivot.y, shoulderPivot.z);
        rig.leftArm.rotation.set(0, 0, 0);
        rig.rightArm.rotation.set(0, 0, 0);
        rig.leftLowerArm.rotation.set(0, 0, 0);
        rig.rightLowerArm.rotation.set(0, 0, 0);
        const elbowPivot = rig.elbowPivot || { x: 0, y: -0.35, z: -0.1 };
        const elbowBaseX = Number.isFinite(elbowPivot.x) ? elbowPivot.x : 0;
        const elbowBaseY = Number.isFinite(elbowPivot.y) ? elbowPivot.y : -0.35;
        const elbowBaseZ = Number.isFinite(elbowPivot.z) ? elbowPivot.z : -0.1;
        rig.leftLowerArm.position.set(elbowBaseX, elbowBaseY, elbowBaseZ);
        rig.rightLowerArm.position.set(-elbowBaseX, elbowBaseY, elbowBaseZ);
        rig.torso.rotation.set(0, 0, 0);
        rig.head.rotation.set(0, 0, 0);
        rig.leftLeg.rotation.set(0, 0, 0);
        rig.rightLeg.rotation.set(0, 0, 0);
        if (rig.leftLowerLeg) rig.leftLowerLeg.rotation.set(0, 0, 0);
        if (rig.rightLowerLeg) rig.rightLowerLeg.rotation.set(0, 0, 0);
        rig.leftArm.scale.set(1, 1, 1);
        rig.rightArm.scale.set(1, 1, 1);
        rig.leftLowerArm.scale.set(1, 1, 1);
        rig.rightLowerArm.scale.set(1, 1, 1);
        rig.axe.visible = true;
        rig.axe.rotation.set(0, 0, 0);
    }

    function applyMiningReferenceVariant(rigRoot, variantIndex, frameNowMs, options = {}) {
        if (!rigRoot || !rigRoot.userData || !rigRoot.userData.rig) return;
        const rig = rigRoot.userData.rig;
        const playerShoulderPivot = options.playerShoulderPivot || null;
        const deg = Math.PI / 180;
        resetMiningReferencePose(rig, playerShoulderPivot);

        const centerlineBottomPose = (opts = {}) => {
            const shoulderPivot = getPlayerRigShoulderPivotLocal(rig, playerShoulderPivot);
            const torsoHalfWidth = 0.54 * 0.5;
            const upperArmHalfWidth = (0.20 * 1.02) * 0.5;
            const shoulderClearance = 0.008;
            const minShoulderAbsX = torsoHalfWidth + upperArmHalfWidth + shoulderClearance;
            const maxInward = Math.max(0, shoulderPivot.x - minShoulderAbsX);
            const requestedInward = opts.shoulderInward || 0.0;
            const shoulderInward = Math.min(Math.max(0, requestedInward), maxInward);
            const shoulderBack = opts.shoulderBack || 0.07;
            const torsoTopY = 0.68 * 0.5;
            const shoulderLiftDefault = torsoTopY - shoulderPivot.y;
            const shoulderLift = (opts.shoulderLift !== undefined) ? opts.shoulderLift : shoulderLiftDefault;
            const torsoTwist = (opts.torsoTwist || 0) * deg;
            const torsoLean = (opts.torsoLean || -4) * deg;
            const upperLift = (opts.upperLift || -52) * deg;
            const upperLiftRight = (opts.upperLiftRight || -56) * deg;
            const upperInwardYaw = (opts.upperInwardYaw || 8) * deg;
            const elbowBendPrimary = (opts.elbowBendPrimary || -90) * deg;
            const forearmTwist = (opts.forearmTwist || 110) * deg;
            const elbowBendSecondary = (opts.elbowBendSecondary || -45) * deg;
            const elbowTowardCenterOffset = opts.elbowTowardCenterOffset || 0.02;
            const elbowForwardOffset = opts.elbowForwardOffset || 0.1;
            const elbowPivot = rig.elbowPivot || { x: 0, y: -0.35, z: -0.1 };
            const elbowBaseX = Number.isFinite(elbowPivot.x) ? elbowPivot.x : 0;
            const elbowBaseY = Number.isFinite(elbowPivot.y) ? elbowPivot.y : -0.35;
            const elbowBaseZ = Number.isFinite(elbowPivot.z) ? elbowPivot.z : -0.1;

            rig.leftArm.position.set(
                shoulderPivot.x - shoulderInward,
                shoulderPivot.y + shoulderLift,
                shoulderPivot.z - shoulderBack
            );
            rig.rightArm.position.set(
                -shoulderPivot.x + shoulderInward,
                shoulderPivot.y + shoulderLift,
                shoulderPivot.z - shoulderBack
            );

            rig.leftLowerArm.position.set(elbowBaseX - elbowTowardCenterOffset, elbowBaseY, elbowBaseZ + elbowForwardOffset);
            rig.rightLowerArm.position.set(-elbowBaseX + elbowTowardCenterOffset, elbowBaseY, elbowBaseZ + elbowForwardOffset);

            rig.leftArm.scale.set(1.02, 1.1, 1.02);
            rig.rightArm.scale.set(1.02, 1.1, 1.02);
            rig.leftLowerArm.scale.set(1.0, 1.08, 1.0);
            rig.rightLowerArm.scale.set(1.0, 1.08, 1.0);

            rig.torso.rotation.set(torsoLean, torsoTwist, 0);
            rig.head.rotation.set(0, torsoTwist * 0.45, 0);

            rig.leftArm.rotation.set(upperLift, -upperInwardYaw, 0);
            rig.rightArm.rotation.set(upperLiftRight, upperInwardYaw, 0);

            rig.leftLowerArm.rotation.set(0, 0, 0);
            rig.rightLowerArm.rotation.set(0, 0, 0);
            rig.leftLowerArm.rotateX(elbowBendPrimary);
            rig.leftLowerArm.rotateY(forearmTwist);
            rig.leftLowerArm.rotateX(elbowBendSecondary);
            rig.rightLowerArm.rotateX(elbowBendPrimary);
            rig.rightLowerArm.rotateY(-forearmTwist);
            rig.rightLowerArm.rotateX(elbowBendSecondary);

            rig.leftLeg.rotation.x = 0;
            rig.rightLeg.rotation.x = 0;
            if (rig.leftLowerLeg) rig.leftLowerLeg.rotation.x = 0;
            if (rig.rightLowerLeg) rig.rightLowerLeg.rotation.x = 0;
            rigRoot.position.y = rigRoot.userData.baseVisualY;
        };

        if (variantIndex === 0) {
            centerlineBottomPose({
                shoulderInward: 0.0,
                shoulderBack: 0.07,
                shoulderLift: 0.08,
                upperLift: -50,
                upperLiftRight: -54,
                upperInwardYaw: 8,
                elbowBendPrimary: -90,
                forearmTwist: 110,
                elbowBendSecondary: -45,
                elbowTowardCenterOffset: 0.02,
                elbowForwardOffset: 0.1,
                torsoLean: -5,
                torsoTwist: 1
            });
            return;
        }

        if (variantIndex === 1) {
            centerlineBottomPose({
                shoulderInward: 0.0,
                shoulderBack: 0.065,
                shoulderLift: 0.045,
                upperLift: -54,
                upperLiftRight: -58,
                upperInwardYaw: 7,
                elbowBendPrimary: -90,
                forearmTwist: 108,
                elbowBendSecondary: -42,
                elbowTowardCenterOffset: 0.018,
                elbowForwardOffset: 0.095,
                torsoLean: -4,
                torsoTwist: -1
            });
            return;
        }

        if (variantIndex === 2) {
            centerlineBottomPose({
                shoulderInward: 0.0,
                shoulderBack: 0.075,
                shoulderLift: 0.055,
                upperLift: -48,
                upperLiftRight: -52,
                upperInwardYaw: 9,
                elbowBendPrimary: -90,
                forearmTwist: 112,
                elbowBendSecondary: -46,
                elbowTowardCenterOffset: 0.022,
                elbowForwardOffset: 0.105,
                torsoLean: -6,
                torsoTwist: 2
            });
            return;
        }

        centerlineBottomPose({
            shoulderInward: 0.0,
            shoulderBack: 0.07,
            shoulderLift: 0.08,
            upperLift: -52,
            upperLiftRight: -56,
            upperInwardYaw: 8,
            elbowBendPrimary: -90,
            forearmTwist: 110,
            elbowBendSecondary: -44,
            elbowTowardCenterOffset: 0.02,
            elbowForwardOffset: 0.1,
            torsoLean: -4,
            torsoTwist: 0
        });
    }

    function createPoseVariantLabel(options = {}) {
        const THREE = requireThree(options.THREE);
        const document = options.document || (typeof window !== 'undefined' ? window.document : null);
        const applyColorTextureSettings = typeof options.applyColorTextureSettings === 'function'
            ? options.applyColorTextureSettings
            : (texture) => texture;
        const labelText = typeof options.labelText === 'string' ? options.labelText : '';
        if (!document || typeof document.createElement !== 'function') return null;
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.fillStyle = 'rgba(8, 10, 14, 0.82)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'rgba(255, 233, 120, 0.95)';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 42px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, canvas.width / 2, canvas.height / 2 + 1);

        const texture = applyColorTextureSettings(new THREE.CanvasTexture(canvas), 'linear');
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(0.9, 0.45, 1);
        return sprite;
    }

    function clearMiningPoseReferences() {
        for (let i = 0; i < miningPoseReferences.length; i++) {
            const refData = miningPoseReferences[i];
            const refRig = refData && refData.rig ? refData.rig : refData;
            if (refRig && refRig.parent) refRig.parent.remove(refRig);
        }
        miningPoseReferences = [];
    }

    function spawnMiningPoseReferences(options = {}) {
        const THREE = requireThree(options.THREE);
        const scene = options.scene || null;
        const playerState = options.playerState || {};
        const playerRig = options.playerRig || null;
        const mapSize = Number.isFinite(options.mapSize) ? options.mapSize : 0;
        const getTileHeightSafe = typeof options.getTileHeightSafe === 'function' ? options.getTileHeightSafe : () => 0;
        const now = typeof options.now === 'function' ? options.now : () => (typeof performance !== 'undefined' ? performance.now() : 0);
        if (!scene) return;
        clearMiningPoseReferences();

        const z = Number.isFinite(playerState.z) ? playerState.z : 0;
        const rowTileY = Math.max(0, Math.min(mapSize - 1, playerState.y));
        const startX = playerState.x - 3;
        const refs = MINING_REFERENCE_VARIANTS.map((variant, idx) => ({
            x: startX + (idx * 2),
            y: rowTileY,
            variant,
            variantIndex: idx
        }));

        const facingYaw = (playerRig && playerRig.rotation && Number.isFinite(playerRig.rotation.y))
            ? playerRig.rotation.y
            : (Number.isFinite(playerState.targetRotation) ? playerState.targetRotation : 0);

        refs.forEach((p) => {
            if (p.x < 0 || p.y < 0 || p.x >= mapSize || p.y >= mapSize) return;
            const clone = createPickaxePoseReferenceRig(options);
            if (!clone) return;
            clone.userData.baseVisualY = getTileHeightSafe(p.x, p.y, z) + (z * 3.0);
            applyMiningReferenceVariant(clone, p.variantIndex, now(), options);
            clone.rotation.y = facingYaw;

            const label = createPoseVariantLabel(Object.assign({}, options, { labelText: p.variant.label, THREE }));
            if (label) {
                label.position.set(0, 2.15, 0);
                clone.add(label);
            }

            clone.position.set(p.x, clone.userData.baseVisualY, p.y);
            scene.add(clone);
            miningPoseReferences.push({
                rig: clone,
                variantIndex: p.variantIndex,
                name: p.variant.name
            });
        });
    }

    function updateMiningPoseReferences(options = {}) {
        const frameNowMs = options.frameNowMs;
        if (!Array.isArray(miningPoseReferences) || miningPoseReferences.length === 0) return;
        for (let i = 0; i < miningPoseReferences.length; i++) {
            const refData = miningPoseReferences[i];
            if (!refData || !refData.rig) continue;
            applyMiningReferenceVariant(refData.rig, refData.variantIndex, frameNowMs, options);
        }
    }

    window.WorldMiningPoseReferenceRuntime = {
        applyMiningReferenceVariant,
        clearMiningPoseReferences,
        createPickaxePoseReferenceRig,
        createPoseVariantLabel,
        getPlayerRigShoulderPivotLocal,
        resetMiningReferencePose,
        spawnMiningPoseReferences,
        updateMiningPoseReferences
    };
})();
