(function () {
    const SKILL_ID = 'fishing';
    const FISH_CHANCE = 0.28;
    const FISH_XP = 20;
    const FISHING_TOOL_IDS = ['small_net', 'fishing_rod', 'fly_fishing_rod', 'harpoon'];
    const SHIN_FLAT_WORLD_PITCH = Math.PI / 2;
    // Leg-angle convention used for animation authoring:
    // 0deg = thigh and shin both flat in the same direction.
    // 90deg = shin flat + thigh vertical.
    // 135deg = shin flat + thigh tilted 45deg backward.
    const FISHING_LEG_SEGMENT_ANGLE_DEG = 135;
    const FISHING_LEG_SEGMENT_ANGLE_RAD = (FISHING_LEG_SEGMENT_ANGLE_DEG * Math.PI) / 180;
    const HEAD_TOP_CLEARANCE = 0.02;
    const ARM_TORSO_FOLLOW = 0.7;
    const FISHING_ARM_REACH_UP_RAD = (15 * Math.PI) / 180;
    const FISHING_THIGH_SCALE_Y = 0.93;
    const FISHING_THIGH_SCALE_Z = 0.84;
    const FISHING_SHIN_SCALE_Y = 0.96;
    const FISHING_SHIN_SCALE_Z = 0.88;

    function isFishingWaterTile(context) {
        return context.isTargetTile(21) || context.isTargetTile(22);
    }

    function hasFishingTool(context) {
        if (!context || typeof context.hasItem !== 'function') return false;
        for (let i = 0; i < FISHING_TOOL_IDS.length; i++) {
            if (context.hasItem(FISHING_TOOL_IDS[i])) return true;
        }
        return false;
    }

    function isDescendant(node, ancestor) {
        let current = node;
        while (current) {
            if (current === ancestor) return true;
            current = current.parent;
        }
        return false;
    }

    function collectLocalBounds(root, excludeSubtree) {
        if (!window.THREE || !root) return null;
        root.updateWorldMatrix(true, true);

        const worldToLocal = new THREE.Matrix4().copy(root.matrixWorld).invert();
        const bounds = new THREE.Box3();
        let hasPoint = false;

        root.traverse((node) => {
            if (!node || !node.isMesh || !node.geometry) return;
            if (excludeSubtree && isDescendant(node, excludeSubtree)) return;

            if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
            const bb = node.geometry.boundingBox;
            if (!bb) return;

            const corners = [
                new THREE.Vector3(bb.min.x, bb.min.y, bb.min.z),
                new THREE.Vector3(bb.min.x, bb.min.y, bb.max.z),
                new THREE.Vector3(bb.min.x, bb.max.y, bb.min.z),
                new THREE.Vector3(bb.min.x, bb.max.y, bb.max.z),
                new THREE.Vector3(bb.max.x, bb.min.y, bb.min.z),
                new THREE.Vector3(bb.max.x, bb.min.y, bb.max.z),
                new THREE.Vector3(bb.max.x, bb.max.y, bb.min.z),
                new THREE.Vector3(bb.max.x, bb.max.y, bb.max.z)
            ];

            for (let i = 0; i < corners.length; i++) {
                const p = corners[i].clone().applyMatrix4(node.matrixWorld).applyMatrix4(worldToLocal);
                bounds.expandByPoint(p);
                hasPoint = true;
            }
        });

        return hasPoint ? bounds : null;
    }

    function buildLegHingeAnchors(upperLeg, lowerLeg) {
        if (!upperLeg || !lowerLeg) return null;

        const thighBounds = collectLocalBounds(upperLeg, lowerLeg);
        const shinBounds = collectLocalBounds(lowerLeg, null);
        if (!thighBounds || !shinBounds) return null;

        const thighX = (thighBounds.min.x + thighBounds.max.x) * 0.5;
        const shinX = (shinBounds.min.x + shinBounds.max.x) * 0.5;

        return {
            thighHingeLocal: new THREE.Vector3(thighX, thighBounds.min.y, thighBounds.min.z),
            shinHingeLocal: new THREE.Vector3(shinX, shinBounds.max.y, shinBounds.min.z)
        };
    }

    function alignLowerLegToHinge(upperLeg, lowerLeg) {
        const anchors = buildLegHingeAnchors(upperLeg, lowerLeg);
        if (!anchors) {
            lowerLeg.position.set(0, -0.35, 0);
            return;
        }

        const rotatedShinHinge = anchors.shinHingeLocal.clone().applyEuler(lowerLeg.rotation);
        const desiredPosition = anchors.thighHingeLocal.clone().sub(rotatedShinHinge);
        lowerLeg.position.copy(desiredPosition);
    }

    // Reusable hinge solver pattern:
    // 1) Lock shin world pitch (flat to ground).
    // 2) Choose the thigh-vs-shin segment angle in this module's convention.
    // 3) Derive thigh world pitch and shin local pitch from that target.
    function solveHingeKneeFromFlatShin(shinWorldPitch, segmentAngleRad) {
        const thighWorldPitch = shinWorldPitch - segmentAngleRad;
        const shinLocalPitch = segmentAngleRad;
        return { thighWorldPitch, shinLocalPitch };
    }
    function transformPointToSpace(node, localPoint, spaceNode) {
        if (!window.THREE || !node || !localPoint) return null;
        node.updateWorldMatrix(true, true);
        if (spaceNode) spaceNode.updateWorldMatrix(true, true);

        const point = localPoint.clone().applyMatrix4(node.matrixWorld);
        if (!spaceNode) return point;

        const worldToSpace = new THREE.Matrix4().copy(spaceNode.matrixWorld).invert();
        return point.applyMatrix4(worldToSpace);
    }

    function getUpperLegFrontTopPoint(upperLeg, lowerLeg, playerRig) {
        if (!upperLeg || !playerRig) return null;
        const thighBounds = collectLocalBounds(upperLeg, lowerLeg || null);
        if (!thighBounds) return null;

        const localPoint = new THREE.Vector3(
            (thighBounds.min.x + thighBounds.max.x) * 0.5,
            thighBounds.max.y,
            thighBounds.max.z
        );
        return transformPointToSpace(upperLeg, localPoint, playerRig);
    }

    function alignTorsoToUpperLegFrontHinge(rig, playerRig) {
        if (!rig || !playerRig || !rig.torso || !rig.leftLeg || !rig.rightLeg) return;

        // Hinge line A: top-front line across both upper legs (in player-rig space).
        const leftLegFrontTop = getUpperLegFrontTopPoint(rig.leftLeg, rig.leftLowerLeg, playerRig);
        const rightLegFrontTop = getUpperLegFrontTopPoint(rig.rightLeg, rig.rightLowerLeg, playerRig);
        if (!leftLegFrontTop && !rightLegFrontTop) return;

        const desiredLineMid = leftLegFrontTop && rightLegFrontTop
            ? leftLegFrontTop.clone().add(rightLegFrontTop).multiplyScalar(0.5)
            : (leftLegFrontTop || rightLegFrontTop).clone();

        // Hinge line B: bottom-front line of torso (in torso-local, transformed into player-rig space).
        const torsoLocalBounds = collectLocalBounds(rig.torso, null);
        if (!torsoLocalBounds) return;

        const torsoLeftFrontBottom = new THREE.Vector3(torsoLocalBounds.min.x, torsoLocalBounds.min.y, torsoLocalBounds.max.z);
        const torsoRightFrontBottom = new THREE.Vector3(torsoLocalBounds.max.x, torsoLocalBounds.min.y, torsoLocalBounds.max.z);

        const torsoLeftInRig = transformPointToSpace(rig.torso, torsoLeftFrontBottom, playerRig);
        const torsoRightInRig = transformPointToSpace(rig.torso, torsoRightFrontBottom, playerRig);
        if (!torsoLeftInRig || !torsoRightInRig) return;

        const torsoLineMid = torsoLeftInRig.clone().add(torsoRightInRig).multiplyScalar(0.5);
        const delta = desiredLineMid.sub(torsoLineMid);
        rig.torso.position.add(delta);
    }
    function collectWorldMinY(root) {
        if (!window.THREE || !root) return null;
        root.updateWorldMatrix(true, true);

        let minY = Infinity;
        let hasPoint = false;

        root.traverse((node) => {
            if (!node || !node.isMesh || !node.geometry) return;
            if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
            const bb = node.geometry.boundingBox;
            if (!bb) return;

            const corners = [
                new THREE.Vector3(bb.min.x, bb.min.y, bb.min.z),
                new THREE.Vector3(bb.min.x, bb.min.y, bb.max.z),
                new THREE.Vector3(bb.min.x, bb.max.y, bb.min.z),
                new THREE.Vector3(bb.min.x, bb.max.y, bb.max.z),
                new THREE.Vector3(bb.max.x, bb.min.y, bb.min.z),
                new THREE.Vector3(bb.max.x, bb.min.y, bb.max.z),
                new THREE.Vector3(bb.max.x, bb.max.y, bb.min.z),
                new THREE.Vector3(bb.max.x, bb.max.y, bb.max.z)
            ];

            for (let i = 0; i < corners.length; i++) {
                const p = corners[i].clone().applyMatrix4(node.matrixWorld);
                if (p.y < minY) minY = p.y;
                hasPoint = true;
            }
        });

        return hasPoint ? minY : null;
    }

    function attachHeadToTorsoTop(rig) {
        if (!window.THREE || !rig || !rig.torso || !rig.head) return;
        const torsoBounds = collectLocalBounds(rig.torso, null);
        const headBounds = collectLocalBounds(rig.head, null);
        if (!torsoBounds || !headBounds) return;

        const headHeight = headBounds.max.y - headBounds.min.y;
        const headScaleY = (rig.head.scale && Number.isFinite(rig.head.scale.y)) ? rig.head.scale.y : 1;
        const headLift = ((headHeight * headScaleY) * 0.5) + HEAD_TOP_CLEARANCE;

        const anchorLocal = new THREE.Vector3(
            (torsoBounds.min.x + torsoBounds.max.x) * 0.5,
            torsoBounds.max.y + headLift,
            (torsoBounds.min.z + torsoBounds.max.z) * 0.5
        );

        const anchor = anchorLocal.applyEuler(rig.torso.rotation).add(rig.torso.position);
        rig.head.position.copy(anchor);
        rig.head.rotation.copy(rig.torso.rotation);
    }

    function attachArmsToTorsoShoulders(rig) {
        if (!window.THREE || !rig || !rig.torso || !rig.leftArm || !rig.rightArm) return;
        const torsoBounds = collectLocalBounds(rig.torso, null);
        if (!torsoBounds) return;
        const leftArmBounds = collectLocalBounds(rig.leftArm, null);
        const rightArmBounds = collectLocalBounds(rig.rightArm, null);
        if (!leftArmBounds || !rightArmBounds) return;

        const torsoHeight = torsoBounds.max.y - torsoBounds.min.y;
        const shoulderY = torsoBounds.max.y - (torsoHeight * 0.16);
        const shoulderZ = ((torsoBounds.min.z + torsoBounds.max.z) * 0.5) + 0.02;
        const leftHalfWidth = (leftArmBounds.max.x - leftArmBounds.min.x) * 0.5;
        const rightHalfWidth = (rightArmBounds.max.x - rightArmBounds.min.x) * 0.5;

        // Push shoulders out by half arm width so arm volumes sit outside torso volume.
        const leftShoulderLocal = new THREE.Vector3(torsoBounds.max.x + leftHalfWidth, shoulderY, shoulderZ);
        const rightShoulderLocal = new THREE.Vector3(torsoBounds.min.x - rightHalfWidth, shoulderY, shoulderZ);

        const leftShoulder = leftShoulderLocal.applyEuler(rig.torso.rotation).add(rig.torso.position);
        const rightShoulder = rightShoulderLocal.applyEuler(rig.torso.rotation).add(rig.torso.position);

        rig.leftArm.position.copy(leftShoulder);
        rig.rightArm.position.copy(rightShoulder);
    }

    const fishingModule = {
        canStart(context) {
            return hasFishingTool(context) && isFishingWaterTile(context);
        },

        onStart(context) {
            if (!hasFishingTool(context)) {
                context.addChatMessage('You need fishing gear to fish here.', 'warn');
                return false;
            }
            if (!isFishingWaterTile(context)) return false;
            context.startSkillingAction();
            return true;
        },

        onTick(context) {
            if (!isFishingWaterTile(context)) {
                context.stopAction();
                return;
            }

            const rollChance = window.SkillSharedUtils && typeof SkillSharedUtils.rollChance === 'function'
                ? SkillSharedUtils.rollChance
                : ((chance, rng) => (typeof rng === 'function' ? rng() : Math.random()) < chance);

            if (!rollChance(FISH_CHANCE, context.random)) return;

            if (context.giveItemById('raw_shrimp', 1) > 0) {
                context.addSkillXp(SKILL_ID, FISH_XP);
                return;
            }

            context.addChatMessage('You have no inventory space for fish.', 'warn');
            context.stopAction();
        },

        onAnimate(context) {
            if (!context.rig || !context.playerRig || typeof context.setShoulderPivot !== 'function') return;
            const rig = context.rig;
            const playerRig = context.playerRig;

            if (window.SkillSharedUtils && SkillSharedUtils.applyReadyStateOrContinue(context, { showTool: false })) {
                return;
            }

            rig.axe.visible = false;
            playerRig.rotation.x = 0;

            if (rig.torso) rig.torso.scale.set(1, FISHING_THIGH_SCALE_Y, FISHING_THIGH_SCALE_Z);
            if (rig.head) rig.head.scale.set(1, FISHING_THIGH_SCALE_Y, FISHING_THIGH_SCALE_Z);
            rig.leftArm.scale.set(1, FISHING_THIGH_SCALE_Y, FISHING_THIGH_SCALE_Z);
            rig.rightArm.scale.set(1, FISHING_THIGH_SCALE_Y, FISHING_THIGH_SCALE_Z);
            rig.leftLowerArm.scale.set(1, FISHING_SHIN_SCALE_Y, FISHING_SHIN_SCALE_Z);
            rig.rightLowerArm.scale.set(1, FISHING_SHIN_SCALE_Y, FISHING_SHIN_SCALE_Z);
            rig.leftLeg.scale.set(1, FISHING_THIGH_SCALE_Y, FISHING_THIGH_SCALE_Z);
            rig.rightLeg.scale.set(1, FISHING_THIGH_SCALE_Y, FISHING_THIGH_SCALE_Z);
            if (rig.leftLowerLeg) rig.leftLowerLeg.scale.set(1, FISHING_SHIN_SCALE_Y, FISHING_SHIN_SCALE_Z);
            if (rig.rightLowerLeg) rig.rightLowerLeg.scale.set(1, FISHING_SHIN_SCALE_Y, FISHING_SHIN_SCALE_Z);

            const cycle = 1250;
            const phase = (context.frameNow % cycle) / cycle;
            const sway = Math.sin(phase * Math.PI * 2);

            const torsoPitch = (0.72 + ((15 * Math.PI) / 180)) + (sway * 0.05);
            const torsoYaw = sway * 0.04;
            rig.torso.rotation.set(torsoPitch, torsoYaw, 0);
            alignTorsoToUpperLegFrontHinge(rig, playerRig);
            attachArmsToTorsoShoulders(rig);

            const armPitchFollow = torsoPitch * ARM_TORSO_FOLLOW;
            const armYawFollow = torsoYaw * ARM_TORSO_FOLLOW;
            rig.leftArm.rotation.set((-1.05 - FISHING_ARM_REACH_UP_RAD + (sway * 0.08)) + armPitchFollow, (-0.1 + (sway * 0.04)) + armYawFollow, 0.06);
            rig.rightArm.rotation.set((-1.03 - FISHING_ARM_REACH_UP_RAD + (sway * 0.08)) + armPitchFollow, (0.1 - (sway * 0.04)) + armYawFollow, -0.06);
            rig.leftLowerArm.rotation.set(-0.34 + (sway * 0.05), -0.06, 0);
            rig.rightLowerArm.rotation.set(-0.34 + (sway * 0.05), 0.06, 0);

            // True hinge setup: shin flat, then apply a 135deg thigh-vs-shin segment angle.
            const shinWorldPitch = SHIN_FLAT_WORLD_PITCH;
            const kneeSolve = solveHingeKneeFromFlatShin(shinWorldPitch, FISHING_LEG_SEGMENT_ANGLE_RAD);

            rig.leftLeg.rotation.x = kneeSolve.thighWorldPitch;
            rig.rightLeg.rotation.x = kneeSolve.thighWorldPitch;
            if (rig.leftLowerLeg) rig.leftLowerLeg.rotation.x = kneeSolve.shinLocalPitch;
            if (rig.rightLowerLeg) rig.rightLowerLeg.rotation.x = kneeSolve.shinLocalPitch;

            if (rig.leftLowerLeg) alignLowerLegToHinge(rig.leftLeg, rig.leftLowerLeg);
            if (rig.rightLowerLeg) alignLowerLegToHinge(rig.rightLeg, rig.rightLowerLeg);

            // Keep shins planted: no vertical bob while fishing, and solve exact ground contact.
            playerRig.position.y = context.baseVisualY;
            playerRig.updateWorldMatrix(true, true);
            const leftShinMinY = rig.leftLowerLeg ? collectWorldMinY(rig.leftLowerLeg) : null;
            const rightShinMinY = rig.rightLowerLeg ? collectWorldMinY(rig.rightLowerLeg) : null;
            const shinMinY = (leftShinMinY === null) ? rightShinMinY : ((rightShinMinY === null) ? leftShinMinY : Math.min(leftShinMinY, rightShinMinY));
            if (shinMinY !== null && Number.isFinite(shinMinY)) playerRig.position.y += (context.baseVisualY - shinMinY);

            // Neck constraint: head stays fixed to torso top-center as torso rotates.
            attachHeadToTorsoTop(rig);
        },

        getTooltip() {
            return '<span class="text-gray-300">Fish</span> <span class="text-cyan-400">Water</span>';
        },

        getContextMenu(context) {
            return [
                {
                    text: 'Fish <span class="text-cyan-400">Water</span>',
                    onSelect: () => {
                        context.queueInteract();
                        context.spawnClickMarker(true);
                    }
                },
                {
                    text: 'Examine <span class="text-cyan-400">Water</span>',
                    onSelect: () => console.log('EXAMINING: The water looks fishable.')
                }
            ];
        }
    };

    window.SkillModules = window.SkillModules || {};
    window.SkillModules[SKILL_ID] = fishingModule;
})();










