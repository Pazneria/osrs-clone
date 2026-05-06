(function () {
    const TREE_VISUAL_PROFILES = {
        normal_tree: {
            trunkScale: [0.68, 1.0, 0.68],
            rootFlareScale: [0.62, 0.72, 0.62],
            stumpRootFlareScale: [0.48, 0.62, 0.48],
            stumpCapScale: [0.56, 1.0, 0.56],
            stumpCapOffset: [0.0, 0.3, 0.0],
            canopyScales: [[0.58, 0.44, 0.56], [0.48, 0.38, 0.46], [0.48, 0.38, 0.46], [0.24, 0.2, 0.24]],
            canopyYOffset: 0.94,
            canopyOffsets: [[0.0, 0.0, 0.0], [0.17, 0.04, 0.12], [-0.18, 0.04, -0.12], [0.0, 0.0, 0.0]],
            canopyYRotations: [0.0, 0.28, -0.24, 0.42],
            canopyJitter: 0.025,
            branchScale: [0.28, 0.3, 0.28],
            branchOffset: [0.02, 0.5, 0.02],
            branchYaw: -0.2,
            branch2Scale: [0.58, 0.5, 0.42],
            branch2Offset: [0.05, 0.6, 0.0],
            branch2Yaw: 1.35,
            branchCanopyAttachments: { 3: { branch: 'branch2', endpoint: 'tipLocal', nudge: [0, 0.02, 0] } },
            stumpScale: [0.66, 0.15, 0.66]
        },
        oak_tree: {
            trunkScale: [1.46, 1.52, 1.46],
            canopyScales: [[1.78, 1.28, 1.74], [1.55, 1.12, 1.5], [1.48, 1.08, 1.45], [1.28, 1.34, 1.24]],
            canopyYOffset: 0.28,
            canopyOffsets: [[0.0, 0.26, 0.0], [0.52, 0.1, 0.34], [-0.56, 0.08, -0.28], [0.1, 0.74, -0.18]],
            canopyYRotations: [0.0, 0.22, -0.3, 0.12],
            canopyJitter: 0.1,
            branchScale: [1.25, 1.2, 1.25],
            branchOffset: [0.08, 0.16, 0.12],
            branchYaw: -0.35,
            stumpScale: [1.56, 0.2, 1.56]
        },
        willow_tree: {
            trunkScale: [0.82, 1.92, 0.82],
            canopyScales: [[1.44, 1.12, 1.48], [1.26, 1.04, 1.3], [1.2, 0.98, 1.22], [1.08, 0.92, 1.1]],
            canopyYOffset: 0.72,
            canopyOffsets: [[0.0, 0.3, 0.0], [0.4, 0.22, 0.3], [-0.38, 0.2, -0.28], [0.02, 0.5, -0.06]],
            canopyYRotations: [0.0, 0.22, -0.24, 0.1],
            canopyJitter: 0.02,
            branchScale: [0.98, 0.94, 0.98],
            branchOffset: [-0.12, 0.36, 0.08],
            branchYaw: 0.58,
            branch2Scale: [0.94, 0.98, 0.94],
            branch2Offset: [0.08, 0.58, -0.16],
            branch2Yaw: -0.66,
            branch3Scale: [0.9, 1.02, 0.9],
            branch3Offset: [0.2, 0.72, 0.2],
            branch3Yaw: 0.28,
            drapeScales: [[1.08, 1.16, 1.08], [1.04, 1.12, 1.04], [1.06, 1.2, 1.06], [1.12, 1.26, 1.12], [0.98, 1.06, 0.98], [1.0, 1.08, 1.0], [1.04, 1.18, 1.04], [1.1, 1.24, 1.1]],
            drapeOffsets: [[0.08, 0.22, 0.04], [-0.08, 0.22, -0.04], [0.04, 0.18, 0.06], [-0.04, 0.18, -0.06], [0.02, 0.28, 0.08], [-0.02, 0.28, -0.08], [-0.06, 0.14, 0.02], [0.06, 0.14, -0.02]],
            drapeYRotations: [0.36, -0.34, 0.52, -0.48, 0.22, -0.2, 0.68, -0.64],
            drapeJitter: 0.045,
            stumpScale: [0.98, 0.16, 0.98]
        },
        maple_tree: {
            trunkScale: [1.24, 1.56, 1.24],
            canopyScales: [[2.02, 1.18, 2.02], [1.78, 1.04, 1.74], [1.72, 1.0, 1.68], [1.44, 0.9, 1.4]],
            canopyYOffset: 0.44,
            canopyOffsets: [[0.0, 0.14, 0.0], [0.72, 0.0, 0.46], [-0.74, 0.0, -0.42], [0.08, 0.56, -0.14]],
            canopyYRotations: [0.0, 0.24, -0.28, 0.12],
            canopyJitter: 0.045,
            branchScale: [1.28, 1.2, 1.28],
            branchOffset: [-0.14, 0.28, 0.16],
            branchYaw: 0.54,
            branch2Scale: [1.2, 1.16, 1.2],
            branch2Offset: [0.12, 0.54, -0.18],
            branch2Yaw: -0.62,
            branch3Scale: [1.12, 1.08, 1.12],
            branch3Offset: [0.18, 0.72, 0.24],
            branch3Yaw: 0.24,
            stumpScale: [1.38, 0.2, 1.38]
        },
        yew_tree: {
            trunkScale: [1.02, 2.24, 1.02],
            canopyScales: [[1.1, 0.92, 1.1], [0.88, 0.76, 0.88], [0.66, 0.58, 0.66], [0.42, 0.4, 0.42]],
            canopyYOffset: 0.74,
            canopyOffsets: [[0.0, 0.0, 0.0], [0.04, 0.42, -0.02], [-0.03, 0.8, 0.02], [0.0, 1.16, 0.0]],
            canopyYRotations: [0.0, 0.08, -0.06, 0.02],
            canopyJitter: 0.01,
            branchScale: [0.48, 0.66, 0.48],
            branchOffset: [-0.04, 0.66, 0.06],
            branchYaw: 0.2,
            branch2Scale: [0.38, 0.54, 0.38],
            branch2Offset: [0.04, 1.0, -0.05],
            branch2Yaw: -0.22,
            branch3Scale: [0.28, 0.42, 0.28],
            branch3Offset: [0.0, 1.28, 0.02],
            branch3Yaw: 0.12,
            stumpScale: [1.18, 0.24, 1.18]
        }
    };

    function requireThree(three) {
        if (!three) throw new Error('World tree render runtime requires THREE.');
        return three;
    }

    function getTreeVisualProfile(nodeId) {
        if (typeof nodeId === 'string' && TREE_VISUAL_PROFILES[nodeId]) return TREE_VISUAL_PROFILES[nodeId];
        return TREE_VISUAL_PROFILES.normal_tree;
    }

    function createEmptyTreeRenderData() {
        return {
            treeMap: [],
            iTrunk: null,
            iRootFlare: null,
            iStumpCap: null,
            iBranch: null,
            iBranch2: null,
            iBranch3: null,
            iDrape1: null,
            iDrape2: null,
            iDrape3: null,
            iDrape4: null,
            iDrape5: null,
            iDrape6: null,
            iDrape7: null,
            iDrape8: null,
            iLeaf1: null,
            iLeaf2: null,
            iLeaf3: null,
            iLeaf4: null
        };
    }

    function createTreeInstancedMesh(THREE, geometry, material, count, treeMap) {
        const mesh = new THREE.InstancedMesh(geometry, material, count);
        mesh.castShadow = false;
        mesh.matrixAutoUpdate = false;
        mesh.userData = { instanceMap: treeMap };
        return mesh;
    }

    function createTreeRenderData(options = {}) {
        const tData = createEmptyTreeRenderData();
        const count = Number.isFinite(options.count) ? Math.max(0, Math.floor(options.count)) : 0;
        if (count <= 0) return tData;

        const THREE = requireThree(options.THREE);
        const sharedGeometries = options.sharedGeometries || {};
        const sharedMaterials = options.sharedMaterials || {};
        const planeGroup = options.planeGroup || null;
        const environmentMeshes = Array.isArray(options.environmentMeshes) ? options.environmentMeshes : null;

        tData.iTrunk = createTreeInstancedMesh(THREE, sharedGeometries.treeTrunk, sharedMaterials.trunk, count, tData.treeMap);
        tData.iRootFlare = sharedGeometries.treeRootFlare
            ? createTreeInstancedMesh(THREE, sharedGeometries.treeRootFlare, sharedMaterials.trunk, count, tData.treeMap)
            : null;
        tData.iStumpCap = sharedGeometries.treeStumpCap && sharedMaterials.trunkCut
            ? createTreeInstancedMesh(THREE, sharedGeometries.treeStumpCap, sharedMaterials.trunkCut, count, tData.treeMap)
            : null;
        tData.iBranch = createTreeInstancedMesh(THREE, sharedGeometries.treeBranch, sharedMaterials.trunk, count, tData.treeMap);
        tData.iBranch2 = createTreeInstancedMesh(THREE, sharedGeometries.treeBranch2, sharedMaterials.trunk, count, tData.treeMap);
        tData.iBranch3 = createTreeInstancedMesh(THREE, sharedGeometries.treeBranch3, sharedMaterials.trunk, count, tData.treeMap);
        tData.iDrape1 = createTreeInstancedMesh(THREE, sharedGeometries.willowDrape1, sharedMaterials.leaves, count, tData.treeMap);
        tData.iDrape2 = createTreeInstancedMesh(THREE, sharedGeometries.willowDrape2, sharedMaterials.leaves, count, tData.treeMap);
        tData.iDrape3 = createTreeInstancedMesh(THREE, sharedGeometries.willowDrape3, sharedMaterials.leaves, count, tData.treeMap);
        tData.iDrape4 = createTreeInstancedMesh(THREE, sharedGeometries.willowDrape4, sharedMaterials.leaves, count, tData.treeMap);
        tData.iDrape5 = createTreeInstancedMesh(THREE, sharedGeometries.willowDrape5, sharedMaterials.leaves, count, tData.treeMap);
        tData.iDrape6 = createTreeInstancedMesh(THREE, sharedGeometries.willowDrape6, sharedMaterials.leaves, count, tData.treeMap);
        tData.iDrape7 = createTreeInstancedMesh(THREE, sharedGeometries.willowDrape7, sharedMaterials.leaves, count, tData.treeMap);
        tData.iDrape8 = createTreeInstancedMesh(THREE, sharedGeometries.willowDrape8, sharedMaterials.leaves, count, tData.treeMap);
        tData.iLeaf1 = createTreeInstancedMesh(THREE, sharedGeometries.leaf1, sharedMaterials.leaves, count, tData.treeMap);
        tData.iLeaf2 = createTreeInstancedMesh(THREE, sharedGeometries.leaf2, sharedMaterials.leaves, count, tData.treeMap);
        tData.iLeaf3 = createTreeInstancedMesh(THREE, sharedGeometries.leaf3, sharedMaterials.leaves, count, tData.treeMap);
        tData.iLeaf4 = createTreeInstancedMesh(THREE, sharedGeometries.leaf4, sharedMaterials.leaves, count, tData.treeMap);

        const meshes = [
            tData.iTrunk,
            tData.iRootFlare,
            tData.iStumpCap,
            tData.iBranch,
            tData.iBranch2,
            tData.iBranch3,
            tData.iDrape1,
            tData.iDrape2,
            tData.iDrape3,
            tData.iDrape4,
            tData.iDrape5,
            tData.iDrape6,
            tData.iDrape7,
            tData.iDrape8,
            tData.iLeaf1,
            tData.iLeaf2,
            tData.iLeaf3,
            tData.iLeaf4
        ];
        for (let i = 0; i < meshes.length; i++) {
            if (!meshes[i]) continue;
            if (planeGroup) planeGroup.add(meshes[i]);
            if (environmentMeshes) environmentMeshes.push(meshes[i]);
        }

        return tData;
    }

    function deterministicCanopyJitter(seedX, seedY, layer, axis) {
        const value = Math.sin((seedX + (layer * 0.71) + (axis * 0.37)) * 12.9898 + (seedY - (layer * 0.47) + (axis * 0.19)) * 78.233) * 43758.5453;
        return ((value - Math.floor(value)) * 2.0) - 1.0;
    }

    function getBranchVisualSpec(profile, tData, branchId) {
        if (branchId === 'branch') return { mesh: tData.iBranch, scale: profile.branchScale, offset: profile.branchOffset, yaw: profile.branchYaw };
        if (branchId === 'branch2') return { mesh: tData.iBranch2, scale: profile.branch2Scale, offset: profile.branch2Offset, yaw: profile.branch2Yaw };
        if (branchId === 'branch3') return { mesh: tData.iBranch3, scale: profile.branch3Scale, offset: profile.branch3Offset, yaw: profile.branch3Yaw };
        return null;
    }

    function createYawQuaternion(THREE, yaw) {
        return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    }

    function computeBranchEndpointWorld(THREE, basePosition, baseQuaternion, profile, tData, branchId, endpointKey) {
        const spec = getBranchVisualSpec(profile, tData, branchId);
        if (!spec || !spec.mesh || !spec.mesh.geometry || !spec.mesh.geometry.userData) return null;
        const endpoint = spec.mesh.geometry.userData[endpointKey || 'tipLocal'];
        if (!Array.isArray(endpoint)) return null;
        const scale = Array.isArray(spec.scale) ? spec.scale : [0, 0, 0];
        const offset = Array.isArray(spec.offset) ? spec.offset : [0, 0, 0];
        const yaw = Number.isFinite(spec.yaw) ? spec.yaw : 0;
        const quaternion = baseQuaternion.clone();
        if (yaw !== 0) quaternion.multiply(createYawQuaternion(THREE, yaw));
        const localEndpoint = new THREE.Vector3(
            endpoint[0] * (scale[0] || 0),
            endpoint[1] * (scale[1] || 0),
            endpoint[2] * (scale[2] || 0)
        );
        localEndpoint.applyQuaternion(quaternion);
        return new THREE.Vector3(
            basePosition.x + offset[0] + localEndpoint.x,
            basePosition.y + offset[1] + localEndpoint.y,
            basePosition.z + offset[2] + localEndpoint.z
        );
    }

    function setTreeVisualState(input) {
        const THREE = requireThree(input && input.THREE);
        const tData = input && input.tData;
        const treeIndex = input && input.treeIndex;
        const options = input && input.options ? input.options : {};
        if (!tData || !Number.isInteger(treeIndex) || treeIndex < 0) return;
        const profile = getTreeVisualProfile(options.nodeId);
        const isStump = !!options.isStump;
        const basePosition = options.position || new THREE.Vector3();
        const baseQuaternion = options.quaternion || new THREE.Quaternion();
        const dummy = new THREE.Object3D();
        const trunkScale = isStump ? profile.stumpScale : profile.trunkScale;
        dummy.position.copy(basePosition);
        dummy.quaternion.copy(baseQuaternion);
        dummy.scale.set(trunkScale[0], trunkScale[1], trunkScale[2]);
        dummy.updateMatrix();
        if (tData.iTrunk) tData.iTrunk.setMatrixAt(treeIndex, dummy.matrix);

        if (tData.iRootFlare) {
            const rootFlareScale = isStump
                ? (Array.isArray(profile.stumpRootFlareScale) ? profile.stumpRootFlareScale : profile.rootFlareScale)
                : profile.rootFlareScale;
            const rootFlareOffset = Array.isArray(profile.rootFlareOffset) ? profile.rootFlareOffset : [0, 0, 0];
            dummy.position.copy(basePosition);
            dummy.quaternion.copy(baseQuaternion);
            if (Array.isArray(rootFlareScale)) {
                dummy.position.x += rootFlareOffset[0];
                dummy.position.y += rootFlareOffset[1];
                dummy.position.z += rootFlareOffset[2];
                dummy.scale.set(rootFlareScale[0] || 0, rootFlareScale[1] || 0, rootFlareScale[2] || 0);
            } else {
                dummy.scale.set(0, 0, 0);
            }
            dummy.updateMatrix();
            tData.iRootFlare.setMatrixAt(treeIndex, dummy.matrix);
        }

        if (tData.iStumpCap) {
            const stumpCapScale = isStump && Array.isArray(profile.stumpCapScale) ? profile.stumpCapScale : [0, 0, 0];
            const stumpCapOffset = isStump && Array.isArray(profile.stumpCapOffset) ? profile.stumpCapOffset : [0, 0, 0];
            dummy.position.copy(basePosition);
            dummy.quaternion.copy(baseQuaternion);
            dummy.position.x += stumpCapOffset[0];
            dummy.position.y += stumpCapOffset[1];
            dummy.position.z += stumpCapOffset[2];
            dummy.scale.set(stumpCapScale[0] || 0, stumpCapScale[1] || 0, stumpCapScale[2] || 0);
            dummy.updateMatrix();
            tData.iStumpCap.setMatrixAt(treeIndex, dummy.matrix);
        }

        const applyBranchVisual = (branchMesh, scaleValue, offsetValue, yawValue) => {
            if (!branchMesh) return;
            const branchScale = isStump ? [0, 0, 0] : (Array.isArray(scaleValue) ? scaleValue : [0, 0, 0]);
            const branchOffset = (!isStump && Array.isArray(offsetValue)) ? offsetValue : [0, 0, 0];
            const branchYaw = (!isStump && Number.isFinite(yawValue)) ? yawValue : 0;
            dummy.position.copy(basePosition);
            dummy.quaternion.copy(baseQuaternion);
            dummy.position.x += branchOffset[0];
            dummy.position.y += branchOffset[1];
            dummy.position.z += branchOffset[2];
            if (branchYaw !== 0) dummy.rotateY(branchYaw);
            dummy.scale.set(branchScale[0] || 0, branchScale[1] || 0, branchScale[2] || 0);
            dummy.updateMatrix();
            branchMesh.setMatrixAt(treeIndex, dummy.matrix);
        };

        applyBranchVisual(tData.iBranch, profile.branchScale, profile.branchOffset, profile.branchYaw);
        applyBranchVisual(tData.iBranch2, profile.branch2Scale, profile.branch2Offset, profile.branch2Yaw);
        applyBranchVisual(tData.iBranch3, profile.branch3Scale, profile.branch3Offset, profile.branch3Yaw);

        const drapeMeshes = [tData.iDrape1, tData.iDrape2, tData.iDrape3, tData.iDrape4, tData.iDrape5, tData.iDrape6, tData.iDrape7, tData.iDrape8];
        for (let i = 0; i < drapeMeshes.length; i++) {
            const drapeMesh = drapeMeshes[i];
            if (!drapeMesh) continue;
            dummy.position.copy(basePosition);
            dummy.quaternion.copy(baseQuaternion);
            if (isStump) {
                dummy.scale.set(0, 0, 0);
            } else {
                const drapeScale = (Array.isArray(profile.drapeScales) && Array.isArray(profile.drapeScales[i])) ? profile.drapeScales[i] : [0, 0, 0];
                const drapeOffset = (Array.isArray(profile.drapeOffsets) && Array.isArray(profile.drapeOffsets[i])) ? profile.drapeOffsets[i] : [0, 0, 0];
                const drapeYaw = (Array.isArray(profile.drapeYRotations) && Number.isFinite(profile.drapeYRotations[i])) ? profile.drapeYRotations[i] : 0;
                const drapeJitter = Number.isFinite(profile.drapeJitter) ? profile.drapeJitter : 0;

                dummy.position.x += drapeOffset[0];
                dummy.position.y += drapeOffset[1];
                dummy.position.z += drapeOffset[2];

                if (drapeJitter > 0) {
                    dummy.position.x += deterministicCanopyJitter(basePosition.x, basePosition.z, i + 8, 0) * drapeJitter;
                    dummy.position.z += deterministicCanopyJitter(basePosition.x, basePosition.z, i + 8, 1) * drapeJitter;
                    dummy.position.y += deterministicCanopyJitter(basePosition.x, basePosition.z, i + 8, 2) * drapeJitter * 0.25;
                }
                if (drapeYaw !== 0) dummy.rotateY(drapeYaw);
                dummy.scale.set(drapeScale[0] || 0, drapeScale[1] || 0, drapeScale[2] || 0);
            }
            dummy.updateMatrix();
            drapeMesh.setMatrixAt(treeIndex, dummy.matrix);
        }

        const leafMeshes = [tData.iLeaf1, tData.iLeaf2, tData.iLeaf3, tData.iLeaf4];
        for (let i = 0; i < leafMeshes.length; i++) {
            const leafMesh = leafMeshes[i];
            if (!leafMesh) continue;
            dummy.position.copy(basePosition);
            dummy.quaternion.copy(baseQuaternion);
            if (isStump) {
                dummy.scale.set(0, 0, 0);
            } else {
                const canopyScale = profile.canopyScales[i] || profile.canopyScales[0] || [1, 1, 1];
                const canopyOffset = (Array.isArray(profile.canopyOffsets) && Array.isArray(profile.canopyOffsets[i])) ? profile.canopyOffsets[i] : [0, 0, 0];
                const canopyYaw = (Array.isArray(profile.canopyYRotations) && Number.isFinite(profile.canopyYRotations[i])) ? profile.canopyYRotations[i] : 0;
                const canopyJitter = Number.isFinite(profile.canopyJitter) ? profile.canopyJitter : 0;
                const attachment = profile.branchCanopyAttachments ? profile.branchCanopyAttachments[i] : null;
                const attachmentTarget = attachment
                    ? computeBranchEndpointWorld(THREE, basePosition, baseQuaternion, profile, tData, attachment.branch, attachment.endpoint)
                    : null;

                const leafQuaternion = baseQuaternion.clone();
                if (canopyJitter > 0) {
                    const jitterYaw = deterministicCanopyJitter(basePosition.x, basePosition.z, i, 3) * canopyJitter * 0.42;
                    if (jitterYaw !== 0) leafQuaternion.multiply(createYawQuaternion(THREE, jitterYaw));
                }
                if (canopyYaw !== 0) leafQuaternion.multiply(createYawQuaternion(THREE, canopyYaw));
                dummy.quaternion.copy(leafQuaternion);
                dummy.scale.set(canopyScale[0], canopyScale[1], canopyScale[2]);
                if (attachmentTarget) {
                    const attachmentLocal = Array.isArray(attachment.anchorLocal)
                        ? attachment.anchorLocal
                        : (leafMesh.geometry && leafMesh.geometry.userData && Array.isArray(leafMesh.geometry.userData.branchAttachmentLocal)
                            ? leafMesh.geometry.userData.branchAttachmentLocal
                            : [0, 0, 0]);
                    const attachmentOffset = new THREE.Vector3(
                        attachmentLocal[0] * canopyScale[0],
                        attachmentLocal[1] * canopyScale[1],
                        attachmentLocal[2] * canopyScale[2]
                    );
                    attachmentOffset.applyQuaternion(leafQuaternion);
                    dummy.position.copy(attachmentTarget).sub(attachmentOffset);
                    const attachmentNudge = Array.isArray(attachment.nudge) ? attachment.nudge : [0, 0, 0];
                    dummy.position.x += attachmentNudge[0] || 0;
                    dummy.position.y += attachmentNudge[1] || 0;
                    dummy.position.z += attachmentNudge[2] || 0;
                } else {
                    dummy.position.x += canopyOffset[0];
                    dummy.position.y += (profile.canopyYOffset || 0) + canopyOffset[1];
                    dummy.position.z += canopyOffset[2];
                    if (canopyJitter > 0) {
                        dummy.position.x += deterministicCanopyJitter(basePosition.x, basePosition.z, i, 0) * canopyJitter;
                        dummy.position.z += deterministicCanopyJitter(basePosition.x, basePosition.z, i, 1) * canopyJitter;
                        dummy.position.y += deterministicCanopyJitter(basePosition.x, basePosition.z, i, 2) * canopyJitter * 0.35;
                    }
                }
            }
            dummy.updateMatrix();
            leafMesh.setMatrixAt(treeIndex, dummy.matrix);
        }
    }

    function markTreeVisualsDirty(tData) {
        if (!tData) return;
        if (tData.iTrunk) tData.iTrunk.instanceMatrix.needsUpdate = true;
        if (tData.iRootFlare) tData.iRootFlare.instanceMatrix.needsUpdate = true;
        if (tData.iStumpCap) tData.iStumpCap.instanceMatrix.needsUpdate = true;
        if (tData.iBranch) tData.iBranch.instanceMatrix.needsUpdate = true;
        if (tData.iBranch2) tData.iBranch2.instanceMatrix.needsUpdate = true;
        if (tData.iBranch3) tData.iBranch3.instanceMatrix.needsUpdate = true;
        if (tData.iDrape1) tData.iDrape1.instanceMatrix.needsUpdate = true;
        if (tData.iDrape2) tData.iDrape2.instanceMatrix.needsUpdate = true;
        if (tData.iDrape3) tData.iDrape3.instanceMatrix.needsUpdate = true;
        if (tData.iDrape4) tData.iDrape4.instanceMatrix.needsUpdate = true;
        if (tData.iDrape5) tData.iDrape5.instanceMatrix.needsUpdate = true;
        if (tData.iDrape6) tData.iDrape6.instanceMatrix.needsUpdate = true;
        if (tData.iDrape7) tData.iDrape7.instanceMatrix.needsUpdate = true;
        if (tData.iDrape8) tData.iDrape8.instanceMatrix.needsUpdate = true;
        if (tData.iLeaf1) tData.iLeaf1.instanceMatrix.needsUpdate = true;
        if (tData.iLeaf2) tData.iLeaf2.instanceMatrix.needsUpdate = true;
        if (tData.iLeaf3) tData.iLeaf3.instanceMatrix.needsUpdate = true;
        if (tData.iLeaf4) tData.iLeaf4.instanceMatrix.needsUpdate = true;
    }

    window.WorldTreeRenderRuntime = {
        TREE_VISUAL_PROFILES,
        createTreeRenderData,
        deterministicCanopyJitter,
        getTreeVisualProfile,
        markTreeVisualsDirty,
        setTreeVisualState
    };
})();
