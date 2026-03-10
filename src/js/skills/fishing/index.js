(function () {
    const SKILL_ID = 'fishing';
    const FALLBACK_FISHING_TOOL_IDS = ['small_net', 'fishing_rod', 'harpoon', 'rune_harpoon'];
    const ACTIVE_METHOD_STATE_KEY = 'fishingActiveMethodId';
    const ACTIVE_WATER_STATE_KEY = 'fishingActiveWaterId';
    const ACTIVE_TILE_STATE_KEY = 'fishingActiveTileId';
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

    function getWaterTable(context) {
        return typeof context.getNodeTable === 'function' ? context.getNodeTable(SKILL_ID) : null;
    }

    function resolveWaterSpecForTarget(context, waterIdHint) {
        const table = getWaterTable(context);
        if (!table) return null;

        if (typeof waterIdHint === 'string' && table[waterIdHint]) {
            const hinted = table[waterIdHint];
            if (Array.isArray(hinted.tileIds)) {
                for (let i = 0; i < hinted.tileIds.length; i++) {
                    if (context.isTargetTile(hinted.tileIds[i])) {
                        return { waterId: waterIdHint, waterSpec: hinted, targetTileId: hinted.tileIds[i] };
                    }
                }
            }
        }

        const waterIds = Object.keys(table);
        for (let i = 0; i < waterIds.length; i++) {
            const waterId = waterIds[i];
            const spec = table[waterId];
            if (!spec || !Array.isArray(spec.tileIds)) continue;
            for (let j = 0; j < spec.tileIds.length; j++) {
                const tileId = spec.tileIds[j];
                if (context.isTargetTile(tileId)) {
                    return { waterId, waterSpec: spec, targetTileId: tileId };
                }
            }
        }

        return null;
    }

    function hasAnyTool(context, toolIds) {
        if (!context || !Array.isArray(toolIds)) return false;
        const equippedWeaponId = context && context.equipment && context.equipment.weapon ? context.equipment.weapon.id : null;
        for (let i = 0; i < toolIds.length; i++) {
            const toolId = toolIds[i];
            if (equippedWeaponId && equippedWeaponId === toolId) return true;
            if (typeof context.hasItem === 'function' && context.hasItem(toolId)) return true;
        }
        return false;
    }

    function hasAnyFishingTool(context) {
        return hasAnyTool(context, FALLBACK_FISHING_TOOL_IDS);
    }

    function getFishingAnimationMode(context) {
        const methodId = context && context.playerState ? context.playerState[ACTIVE_METHOD_STATE_KEY] : null;
        if (typeof methodId !== 'string') return 'net';
        if (methodId.includes('harpoon')) return 'harpoon';
        if (methodId === 'rod') return 'rod';
        return 'net';
    }

    function getMethodFishTable(methodSpec, level) {
        if (!methodSpec) return [];

        if (Array.isArray(methodSpec.fishByLevel)) {
            for (let i = 0; i < methodSpec.fishByLevel.length; i++) {
                const band = methodSpec.fishByLevel[i];
                if (!band || !Array.isArray(band.fish)) continue;
                const minLevel = Number.isFinite(band.minLevel) ? band.minLevel : 1;
                const maxLevel = Number.isFinite(band.maxLevel) ? band.maxLevel : Infinity;
                if (level < minLevel || level > maxLevel) continue;
                return band.fish.filter((fish) => fish && level >= (fish.requiredLevel || 1));
            }
        }

        if (Array.isArray(methodSpec.fish)) {
            return methodSpec.fish.filter((fish) => fish && level >= (fish.requiredLevel || 1));
        }

        return [];
    }

    function canAcceptAnyFish(context, fishTable) {
        if (!Array.isArray(fishTable) || fishTable.length === 0) return false;
        if (typeof context.canAcceptItemById !== 'function') return true;
        for (let i = 0; i < fishTable.length; i++) {
            const fish = fishTable[i];
            if (fish && fish.itemId && context.canAcceptItemById(fish.itemId, 1)) return true;
        }
        return false;
    }

    function getMethodRequirement(methodSpec) {
        return methodSpec && methodSpec.extraRequirement ? methodSpec.extraRequirement : null;
    }

    function hasMethodRequirement(context, methodSpec) {
        const requirement = getMethodRequirement(methodSpec);
        if (!requirement || !requirement.itemId) return true;
        const requiredAmount = Number.isFinite(requirement.amount) ? Math.max(1, requirement.amount) : 1;
        if (typeof context.getInventoryCount === 'function') {
            return context.getInventoryCount(requirement.itemId) >= requiredAmount;
        }
        return typeof context.hasItem === 'function' ? context.hasItem(requirement.itemId) : false;
    }

    function getMethodEntries(waterSpec) {
        if (!waterSpec || !waterSpec.methods || typeof waterSpec.methods !== 'object') return [];
        const methodIds = Object.keys(waterSpec.methods);
        const entries = [];
        for (let i = 0; i < methodIds.length; i++) {
            const methodId = methodIds[i];
            const methodSpec = waterSpec.methods[methodId];
            if (!methodSpec) continue;
            entries.push({ methodId, methodSpec, order: i });
        }
        return entries;
    }

    function getRequestedMethodId(context) {
        const targetUid = context ? context.targetUid : null;
        if (!targetUid || typeof targetUid !== 'object') return null;
        return typeof targetUid.fishingMethodId === 'string' ? targetUid.fishingMethodId : null;
    }

    function getMethodPriority(methodSpec, unlockLevel, order) {
        if (methodSpec && Number.isFinite(methodSpec.priority)) return methodSpec.priority;
        const resolvedUnlock = Number.isFinite(unlockLevel) ? unlockLevel : 1;
        const resolvedOrder = Number.isFinite(order) ? order : 0;
        return (resolvedUnlock * 10) + Math.max(0, 10 - resolvedOrder);
    }

    function buildMethodCandidate(context, level, waterSpec, entry) {
        if (!entry || !entry.methodSpec) return null;
        const methodSpec = entry.methodSpec;
        const unlockLevel = Number.isFinite(methodSpec.unlockLevel) ? methodSpec.unlockLevel : (waterSpec.unlockLevel || 1);
        const toolIds = Array.isArray(methodSpec.toolIds) ? methodSpec.toolIds : [];
        const hasTool = toolIds.length === 0 || hasAnyTool(context, toolIds);
        const fishTable = getMethodFishTable(methodSpec, level);
        const requirement = getMethodRequirement(methodSpec);
        const requirementMissing = !!requirement && !hasMethodRequirement(context, methodSpec);

        return {
            methodId: entry.methodId,
            methodSpec,
            unlockLevel,
            hasTool,
            fishTable,
            requirementMissing,
            requirementItemId: requirement && requirement.itemId ? requirement.itemId : null,
            score: (getMethodPriority(methodSpec, unlockLevel, entry.order) * 1000) + (unlockLevel * 10) - entry.order
        };
    }

    function selectFishingMethodById(context, level, waterSpec, methodId) {
        if (!methodId) return null;

        const entries = getMethodEntries(waterSpec);
        if (entries.length === 0) {
            if (methodId !== 'legacy') return null;
            const legacyFish = Array.isArray(waterSpec && waterSpec.fish)
                ? waterSpec.fish.filter((fish) => fish && level >= (fish.requiredLevel || 1))
                : [];
            if (legacyFish.length === 0) return null;
            return {
                methodId: 'legacy',
                methodSpec: { methodId: 'legacy', toolIds: FALLBACK_FISHING_TOOL_IDS, fish: legacyFish },
                unlockLevel: waterSpec && Number.isFinite(waterSpec.unlockLevel) ? waterSpec.unlockLevel : 1,
                hasTool: hasAnyFishingTool(context),
                fishTable: legacyFish,
                requirementMissing: false,
                requirementItemId: null,
                score: 0
            };
        }

        const entry = entries.find((candidate) => candidate.methodId === methodId);
        if (!entry) return null;

        const candidate = buildMethodCandidate(context, level, waterSpec, entry);
        if (!candidate) return null;
        if (level < candidate.unlockLevel || !candidate.hasTool || candidate.fishTable.length === 0) return null;
        return candidate;
    }

    function selectFishingMethod(context, level, waterSpec) {
        const entries = getMethodEntries(waterSpec);
        if (entries.length === 0) {
            const legacyFish = Array.isArray(waterSpec && waterSpec.fish)
                ? waterSpec.fish.filter((fish) => fish && level >= (fish.requiredLevel || 1))
                : [];
            if (legacyFish.length === 0) return null;
            return {
                methodId: 'legacy',
                methodSpec: { methodId: 'legacy', toolIds: FALLBACK_FISHING_TOOL_IDS, fish: legacyFish },
                fishTable: legacyFish,
                requirementMissing: false,
                requirementItemId: null,
                score: 0
            };
        }

        const candidates = [];
        for (let i = 0; i < entries.length; i++) {
            const candidate = buildMethodCandidate(context, level, waterSpec, entries[i]);
            if (!candidate) continue;
            if (level < candidate.unlockLevel) continue;
            if (!candidate.hasTool) continue;
            if (candidate.fishTable.length === 0) continue;
            candidates.push(candidate);
        }

        if (candidates.length === 0) return null;

        const eligible = candidates.filter((candidate) => !candidate.requirementMissing);
        const pool = eligible.length > 0 ? eligible : candidates;
        pool.sort((a, b) => b.score - a.score);
        return pool[0];
    }

    function resolveMethodIdForTool(waterSpec, toolId) {
        if (!waterSpec || !toolId) return null;
        const entries = getMethodEntries(waterSpec);
        const matches = entries.filter((entry) => {
            const toolIds = Array.isArray(entry.methodSpec && entry.methodSpec.toolIds) ? entry.methodSpec.toolIds : [];
            return toolIds.includes(toolId);
        });
        if (matches.length === 0) return null;

        matches.sort((a, b) => {
            const aUnlock = Number.isFinite(a.methodSpec && a.methodSpec.unlockLevel) ? a.methodSpec.unlockLevel : (waterSpec.unlockLevel || 1);
            const bUnlock = Number.isFinite(b.methodSpec && b.methodSpec.unlockLevel) ? b.methodSpec.unlockLevel : (waterSpec.unlockLevel || 1);
            const aScore = (getMethodPriority(a.methodSpec, aUnlock, a.order) * 1000) + (aUnlock * 10) - a.order;
            const bScore = (getMethodPriority(b.methodSpec, bUnlock, b.order) * 1000) + (bUnlock * 10) - b.order;
            return bScore - aScore;
        });

        return matches[0].methodId;
    }

    function getMethodMenuLabel(methodId) {
        if (methodId === 'net') return 'Net';
        if (methodId === 'rod') return 'Rod';
        if (methodId === 'harpoon') return 'Harpoon';
        if (methodId === 'deep_harpoon_mixed') return 'Harpoon';
        if (methodId === 'deep_rune_harpoon') return 'Rune Harpoon';
        return 'Fish';
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
            const waterPlan = resolveWaterSpecForTarget(context);
            if (!waterPlan) return false;

            const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
            if (level < (waterPlan.waterSpec.unlockLevel || 1)) return false;

            const requestedMethodId = getRequestedMethodId(context);
            const selectedMethod = requestedMethodId
                ? selectFishingMethodById(context, level, waterPlan.waterSpec, requestedMethodId)
                : selectFishingMethod(context, level, waterPlan.waterSpec);
            if (!selectedMethod || selectedMethod.requirementMissing) return false;

            return canAcceptAnyFish(context, selectedMethod.fishTable);
        },

        onStart(context) {
            const waterPlan = resolveWaterSpecForTarget(context);
            if (!waterPlan) return false;

            if (!hasAnyFishingTool(context)) {
                context.addChatMessage('You need fishing gear to fish here.', 'warn');
                return false;
            }

            if (typeof context.requireSkillLevel === 'function' && !context.requireSkillLevel(waterPlan.waterSpec.unlockLevel || 1, { skillId: SKILL_ID, action: 'fish here' })) {
                return false;
            }

            const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
            const requestedMethodId = getRequestedMethodId(context);
            const selectedMethod = requestedMethodId
                ? selectFishingMethodById(context, level, waterPlan.waterSpec, requestedMethodId)
                : selectFishingMethod(context, level, waterPlan.waterSpec);
            if (!selectedMethod) {
                context.addChatMessage(requestedMethodId
                    ? 'You cannot fish here with that method.'
                    : 'You cannot fish here with your current level and tools.', 'warn');
                return false;
            }

            if (selectedMethod.requirementMissing) {
                const requirementName = selectedMethod.requirementItemId === 'bait' ? 'bait' : 'required item';
                context.addChatMessage('You need ' + requirementName + ' to fish with this method.', 'warn');
                return false;
            }

            if (!canAcceptAnyFish(context, selectedMethod.fishTable)) {
                context.addChatMessage('You have no inventory space for fish.', 'warn');
                return false;
            }

            const catchChance = (window.SkillSpecRegistry && typeof SkillSpecRegistry.computeLinearCatchChance === 'function')
                ? SkillSpecRegistry.computeLinearCatchChance(level, waterPlan.waterSpec.unlockLevel, waterPlan.waterSpec.baseCatchChance, waterPlan.waterSpec.levelScaling, waterPlan.waterSpec.maxCatchChance)
                : (waterPlan.waterSpec.baseCatchChance || 0.2);

            const skillSpec = typeof context.getSkillSpec === 'function' ? context.getSkillSpec(SKILL_ID) : null;
            const intervalTicks = (window.SkillSpecRegistry && typeof SkillSpecRegistry.computeIntervalTicks === 'function')
                ? SkillSpecRegistry.computeIntervalTicks(skillSpec && skillSpec.timing ? skillSpec.timing.baseAttemptTicks : 3, skillSpec && skillSpec.timing ? skillSpec.timing.minimumAttemptTicks : 1, 0)
                : 1;

            if (window.SkillActionResolution && typeof SkillActionResolution.startGatherSession === 'function') {
                SkillActionResolution.startGatherSession(context, SKILL_ID, intervalTicks);
            }

            context.playerState.fishingCatchChance = catchChance;
            context.playerState[ACTIVE_METHOD_STATE_KEY] = selectedMethod.methodId;
            context.playerState[ACTIVE_WATER_STATE_KEY] = waterPlan.waterId;
            context.playerState[ACTIVE_TILE_STATE_KEY] = waterPlan.targetTileId;
            context.startSkillingAction();
            return true;
        },

        onUseItem(context) {
            if (!context || context.targetObj !== 'WATER' || !context.sourceItemId) return false;
            const waterPlan = resolveWaterSpecForTarget(context);
            if (!waterPlan) return false;

            const methodId = resolveMethodIdForTool(waterPlan.waterSpec, context.sourceItemId);
            if (!methodId) return false;

            if (typeof context.queueInteractAt === 'function') {
                context.queueInteractAt('WATER', context.targetX, context.targetY, {
                    skillId: SKILL_ID,
                    fishingMethodId: methodId
                });
                context.spawnClickMarker(true);
                return true;
            }

            return false;
        },

        onTick(context) {
            if (!window.SkillActionResolution || typeof SkillActionResolution.runGatherAttempt !== 'function') {
                context.stopAction();
                return;
            }

            const activeWaterId = context.playerState[ACTIVE_WATER_STATE_KEY] || null;
            const waterPlan = resolveWaterSpecForTarget(context, activeWaterId);
            if (!waterPlan) {
                if (typeof SkillActionResolution.stopSkill === 'function') SkillActionResolution.stopSkill(context, SKILL_ID, 'TARGET_INVALID');
                else context.stopAction();
                return;
            }

            const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
            const activeMethodId = context.playerState[ACTIVE_METHOD_STATE_KEY] || null;
            let selectedMethod = null;

            if (activeMethodId) {
                const methods = getMethodEntries(waterPlan.waterSpec);
                const exact = methods.find((entry) => entry.methodId === activeMethodId);
                if (!exact) {
                    context.addChatMessage('You no longer meet the active fishing method requirements.', 'warn');
                    if (typeof SkillActionResolution.stopSkill === 'function') SkillActionResolution.stopSkill(context, SKILL_ID, 'METHOD_INVALID');
                    else context.stopAction();
                    return;
                }

                const unlockLevel = Number.isFinite(exact.methodSpec.unlockLevel) ? exact.methodSpec.unlockLevel : (waterPlan.waterSpec.unlockLevel || 1);
                const fishTable = getMethodFishTable(exact.methodSpec, level);
                const requirement = getMethodRequirement(exact.methodSpec);
                selectedMethod = {
                    methodId: exact.methodId,
                    methodSpec: exact.methodSpec,
                    fishTable,
                    requirementMissing: !!requirement && !hasMethodRequirement(context, exact.methodSpec),
                    requirementItemId: requirement && requirement.itemId ? requirement.itemId : null
                };

                if (level < unlockLevel || !hasAnyTool(context, exact.methodSpec.toolIds || []) || fishTable.length === 0) {
                    context.addChatMessage('You no longer meet the active fishing method requirements.', 'warn');
                    if (typeof SkillActionResolution.stopSkill === 'function') SkillActionResolution.stopSkill(context, SKILL_ID, 'METHOD_INVALID');
                    else context.stopAction();
                    return;
                }
            } else {
                selectedMethod = selectFishingMethod(context, level, waterPlan.waterSpec);
                if (!selectedMethod) {
                    context.addChatMessage('You cannot fish here with your current level and tools.', 'warn');
                    if (typeof SkillActionResolution.stopSkill === 'function') SkillActionResolution.stopSkill(context, SKILL_ID, 'METHOD_INVALID');
                    else context.stopAction();
                    return;
                }
                context.playerState[ACTIVE_METHOD_STATE_KEY] = selectedMethod.methodId;
            }

            if (selectedMethod.requirementMissing) {
                const requirementName = selectedMethod.requirementItemId === 'bait' ? 'bait' : 'required item';
                context.addChatMessage('You need ' + requirementName + ' to continue fishing.', 'warn');
                if (typeof SkillActionResolution.stopSkill === 'function') SkillActionResolution.stopSkill(context, SKILL_ID, 'REQUIREMENT_MISSING');
                else context.stopAction();
                return;
            }

            if (!canAcceptAnyFish(context, selectedMethod.fishTable)) {
                if (typeof SkillActionResolution.stopSkill === 'function') {
                    SkillActionResolution.stopSkill(context, SKILL_ID, 'INVENTORY_FULL');
                } else {
                    context.stopAction();
                }
                context.addChatMessage('You have no inventory space for fish.', 'warn');
                return;
            }

            const catchChance = Number.isFinite(context.playerState.fishingCatchChance)
                ? context.playerState.fishingCatchChance
                : ((window.SkillSpecRegistry && typeof SkillSpecRegistry.computeLinearCatchChance === 'function')
                    ? SkillSpecRegistry.computeLinearCatchChance(level, waterPlan.waterSpec.unlockLevel, waterPlan.waterSpec.baseCatchChance, waterPlan.waterSpec.levelScaling, waterPlan.waterSpec.maxCatchChance)
                    : (waterPlan.waterSpec.baseCatchChance || 0.2));

            const pick = (window.SkillSpecRegistry && typeof SkillSpecRegistry.resolveWeighted === 'function')
                ? SkillSpecRegistry.resolveWeighted(selectedMethod.fishTable, context.random)
                : selectedMethod.fishTable[0];

            const activeTileId = Number.isFinite(context.playerState[ACTIVE_TILE_STATE_KEY])
                ? context.playerState[ACTIVE_TILE_STATE_KEY]
                : waterPlan.targetTileId;

            const requirement = getMethodRequirement(selectedMethod.methodSpec);
            const resolution = SkillActionResolution.runGatherAttempt(context, SKILL_ID, {
                targetTileId: activeTileId,
                successChance: catchChance,
                rewardItemId: pick ? pick.itemId : null,
                xpPerSuccess: pick ? (pick.xp || 0) : 0,
                onSuccess: () => {
                    // Rod+bait rule: bait is consumed only when a fish is successfully caught.
                    // Failed attempts consume no bait, but the rod still requires bait to keep fishing.
                    if (!requirement || requirement.consumeOn !== 'success' || !requirement.itemId) return;
                    const amount = Number.isFinite(requirement.amount) ? Math.max(1, requirement.amount) : 1;
                    if (typeof context.removeItemsById === 'function') {
                        context.removeItemsById(requirement.itemId, amount);
                    } else if (typeof context.removeOneItemById === 'function') {
                        for (let i = 0; i < amount; i++) context.removeOneItemById(requirement.itemId);
                    }
                    if (typeof context.renderInventory === 'function') context.renderInventory();
                }
            });

            if (resolution.status === 'stopped' && (resolution.reasonCode === 'INVENTORY_FULL' || resolution.reasonCode === 'INVENTORY_FULL_AFTER_GAIN')) {
                context.addChatMessage('You have no inventory space for fish.', 'warn');
            }
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

            const mode = getFishingAnimationMode(context);
            const cycle = mode === 'harpoon' ? 980 : (mode === 'rod' ? 1400 : 1250);
            const phase = (context.frameNow % cycle) / cycle;
            const sway = Math.sin(phase * Math.PI * 2);

            // Net fishing animation: existing baseline pose, used only for net fishing.
            let torsoPitch = (0.72 + ((15 * Math.PI) / 180)) + (sway * 0.05);
            let torsoYaw = sway * 0.04;
            let leftArmPitch = (-1.05 - FISHING_ARM_REACH_UP_RAD + (sway * 0.08));
            let rightArmPitch = (-1.03 - FISHING_ARM_REACH_UP_RAD + (sway * 0.08));
            let leftArmYaw = -0.1 + (sway * 0.04);
            let rightArmYaw = 0.1 - (sway * 0.04);
            let leftLowerArmPitch = -0.34 + (sway * 0.05);
            let rightLowerArmPitch = -0.34 + (sway * 0.05);

            if (mode === 'rod') {
                // Basic rod fishing pose: slightly upright with alternating reel/cast motion.
                torsoPitch = 0.68 + (sway * 0.03);
                torsoYaw = sway * 0.02;
                leftArmPitch = -0.62 + (sway * 0.18);
                rightArmPitch = -1.10 - (sway * 0.06);
                leftArmYaw = -0.22 + (sway * 0.05);
                rightArmYaw = 0.24 - (sway * 0.03);
                leftLowerArmPitch = -0.72 + (sway * 0.10);
                rightLowerArmPitch = -0.24 + (sway * 0.05);
            } else if (mode === 'harpoon') {
                // Basic harpoon pose: stronger forward lean with jab rhythm.
                torsoPitch = 0.74 + (Math.abs(sway) * 0.06);
                torsoYaw = sway * 0.03;
                leftArmPitch = -0.78 - (Math.abs(sway) * 0.12);
                rightArmPitch = -1.24 - (Math.abs(sway) * 0.18);
                leftArmYaw = -0.08 + (sway * 0.02);
                rightArmYaw = 0.16 - (sway * 0.02);
                leftLowerArmPitch = -0.52 + (sway * 0.07);
                rightLowerArmPitch = -0.88 - (Math.abs(sway) * 0.14);
            }

            rig.torso.rotation.set(torsoPitch, torsoYaw, 0);
            alignTorsoToUpperLegFrontHinge(rig, playerRig);
            attachArmsToTorsoShoulders(rig);

            const armPitchFollow = torsoPitch * ARM_TORSO_FOLLOW;
            const armYawFollow = torsoYaw * ARM_TORSO_FOLLOW;
            rig.leftArm.rotation.set(leftArmPitch + armPitchFollow, leftArmYaw + armYawFollow, 0.06);
            rig.rightArm.rotation.set(rightArmPitch + armPitchFollow, rightArmYaw + armYawFollow, -0.06);
            rig.leftLowerArm.rotation.set(leftLowerArmPitch, -0.06, 0);
            rig.rightLowerArm.rotation.set(rightLowerArmPitch, 0.06, 0);

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
            const waterPlan = resolveWaterSpecForTarget(context);
            const isDeepWater = !!(waterPlan && waterPlan.waterId === 'deep_water');

            const queueMethod = (methodId) => {
                if (methodId && typeof context.queueInteractAt === 'function') {
                    context.queueInteractAt('WATER', context.targetX, context.targetY, {
                        skillId: SKILL_ID,
                        fishingMethodId: methodId
                    });
                } else {
                    context.queueInteract();
                }
                context.spawnClickMarker(true);
            };

            const options = [];

            if (!isDeepWater && waterPlan && waterPlan.waterSpec) {
                const shallowOrder = ['net', 'rod', 'harpoon'];
                const methodEntries = getMethodEntries(waterPlan.waterSpec);
                for (let i = 0; i < shallowOrder.length; i++) {
                    const methodId = shallowOrder[i];
                    const methodEntry = methodEntries.find((entry) => entry.methodId === methodId);
                    if (!methodEntry) continue;
                    const toolIds = Array.isArray(methodEntry.methodSpec && methodEntry.methodSpec.toolIds)
                        ? methodEntry.methodSpec.toolIds
                        : [];
                    if (toolIds.length > 0 && !hasAnyTool(context, toolIds)) continue;
                    options.push({
                        text: getMethodMenuLabel(methodId) + ' <span class="text-cyan-400">Water</span>',
                        onSelect: () => queueMethod(methodId)
                    });
                }
            }

            if (options.length === 0 && isDeepWater) {
                const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
                const selectable = selectFishingMethod(context, level, waterPlan && waterPlan.waterSpec ? waterPlan.waterSpec : null);
                if (selectable) {
                    options.push({
                        text: 'Fish <span class="text-cyan-400">Water</span>',
                        onSelect: () => queueMethod(null)
                    });
                }
            }

            options.push({
                text: 'Examine <span class="text-cyan-400">Water</span>',
                onSelect: () => console.log('EXAMINING: The water looks fishable.')
            });

            return options;
        }
    };

    window.SkillModules = window.SkillModules || {};
    window.SkillModules[SKILL_ID] = fishingModule;
})();



















