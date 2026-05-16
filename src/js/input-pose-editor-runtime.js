(function () {
    const HANDLE_IDS = ['leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow'];

    function getWindowRef(options = {}) {
        return options.windowRef || (typeof window !== 'undefined' ? window : {});
    }

    function getDocumentRef(options = {}) {
        return options.documentRef || (typeof document !== 'undefined' ? document : null);
    }

    function getThreeRef(state, options = {}) {
        return options.THREERef || (state && state.THREERef) || (typeof THREE !== 'undefined' ? THREE : null);
    }

    function createPoseEditorState(options = {}) {
        const THREERef = options.THREERef || (typeof THREE !== 'undefined' ? THREE : null);
        return {
            THREERef,
            enabled: false,
            values: null,
            handleMap: {},
            activeHandle: null,
            dragOffset: THREERef ? new THREERef.Vector3() : null,
            dragPlane: THREERef ? new THREERef.Plane() : null,
            dragPoint: THREERef ? new THREERef.Vector3() : null,
            raycaster: THREERef ? new THREERef.Raycaster() : null,
            pointer: THREERef ? new THREERef.Vector2() : null,
            panel: null,
            text: null,
            mode: 'translate',
            rotationAxis: 'x',
            dragLastX: 0,
            dragLastY: 0,
            modeSelect: null,
            axisSelect: null
        };
    }

    function getPoseEditorDefaultValues(options = {}) {
        const playerRig = options.playerRig || null;
        const shoulderPivot = options.playerShoulderPivot || { x: 0.28, y: 1.68, z: 0 };
        const elbow = (playerRig && playerRig.userData && playerRig.userData.rig && playerRig.userData.rig.elbowPivot)
            ? playerRig.userData.rig.elbowPivot
            : { x: 0, y: -0.35, z: -0.1 };
        return {
            shoulder: { x: shoulderPivot.x, y: shoulderPivot.y, z: shoulderPivot.z },
            elbow: {
                x: Math.abs(Number.isFinite(elbow.x) ? elbow.x : 0),
                y: Number.isFinite(elbow.y) ? elbow.y : -0.35,
                z: Number.isFinite(elbow.z) ? elbow.z : -0.1
            },
            rotations: {
                leftShoulder: { x: 0, y: 0, z: 0 },
                rightShoulder: { x: 0, y: 0, z: 0 },
                leftElbow: { x: 0, y: 0, z: 0 },
                rightElbow: { x: 0, y: 0, z: 0 }
            }
        };
    }

    function ensurePoseEditorRotationShape(values) {
        if (!values || typeof values !== 'object') return;
        if (!values.rotations || typeof values.rotations !== 'object') values.rotations = {};
        HANDLE_IDS.forEach((key) => {
            const src = values.rotations[key] || { x: 0, y: 0, z: 0 };
            values.rotations[key] = {
                x: Number.isFinite(src.x) ? src.x : 0,
                y: Number.isFinite(src.y) ? src.y : 0,
                z: Number.isFinite(src.z) ? src.z : 0
            };
        });
    }

    function poseEditorNodeForRig(rig, handleId) {
        if (!rig) return null;
        if (handleId === 'leftShoulder') return rig.leftArm;
        if (handleId === 'rightShoulder') return rig.rightArm;
        if (handleId === 'leftElbow') return rig.leftLowerArm;
        if (handleId === 'rightElbow') return rig.rightLowerArm;
        return null;
    }

    function getPoseEditorNode(options = {}, handleId) {
        const playerRig = options.playerRig || null;
        const rig = playerRig && playerRig.userData ? playerRig.userData.rig : null;
        return poseEditorNodeForRig(rig, handleId);
    }

    function applyPoseEditorValuesToRigRoot(rigRoot, values) {
        if (!rigRoot || !rigRoot.userData || !rigRoot.userData.rig || !values) return;
        const rig = rigRoot.userData.rig;
        if (values.shoulder) {
            const defaultTorsoY = (rig.torso && rig.torso.userData && rig.torso.userData.defaultPos && Number.isFinite(rig.torso.userData.defaultPos.y))
                ? rig.torso.userData.defaultPos.y
                : ((rig.torso && Number.isFinite(rig.torso.position.y)) ? rig.torso.position.y : 1.05);
            const shoulderLocalY = values.shoulder.y - defaultTorsoY;
            rig.leftArm.position.set(values.shoulder.x, shoulderLocalY, values.shoulder.z);
            rig.rightArm.position.set(-values.shoulder.x, shoulderLocalY, values.shoulder.z);
        }
        if (values.elbow) {
            rig.elbowPivot = { x: values.elbow.x, y: values.elbow.y, z: values.elbow.z };
            rig.leftLowerArm.position.set(values.elbow.x, values.elbow.y, values.elbow.z);
            rig.rightLowerArm.position.set(-values.elbow.x, values.elbow.y, values.elbow.z);
        }
        ensurePoseEditorRotationShape(values);
        HANDLE_IDS.forEach((key) => {
            const node = poseEditorNodeForRig(rig, key);
            const rot = values.rotations[key];
            if (!node || !rot) return;
            node.rotation.set(rot.x, rot.y, rot.z);
        });
    }

    function updatePoseEditorText(state) {
        if (!state || !state.text || !state.values) return;
        state.text.value = JSON.stringify(state.values, null, 2);
    }

    function applyPoseEditorValues(state, options = {}, values) {
        if (!state || !values || !values.shoulder || !values.elbow) return;
        ensurePoseEditorRotationShape(values);
        state.values = {
            shoulder: { x: Math.abs(values.shoulder.x), y: values.shoulder.y, z: values.shoulder.z },
            elbow: { x: Math.abs(values.elbow.x), y: values.elbow.y, z: values.elbow.z },
            rotations: {
                leftShoulder: { ...values.rotations.leftShoulder },
                rightShoulder: { ...values.rotations.rightShoulder },
                leftElbow: { ...values.rotations.leftElbow },
                rightElbow: { ...values.rotations.rightElbow }
            }
        };
        const shoulderPivot = options.playerShoulderPivot || null;
        if (shoulderPivot) {
            shoulderPivot.x = state.values.shoulder.x;
            shoulderPivot.y = state.values.shoulder.y;
            shoulderPivot.z = state.values.shoulder.z;
        }
        applyPoseEditorValuesToRigRoot(options.playerRig || null, state.values);
        applyPoseEditorValuesToRigRoot(options.uiPlayerRig || null, state.values);
        updatePoseEditorText(state);
    }

    function togglePoseEditor(state, nextState) {
        if (!state) return;
        state.enabled = !!nextState;
        if (state.panel) state.panel.classList.toggle('hidden', !state.enabled);
        Object.values(state.handleMap).forEach((h) => {
            if (h && h.mesh) h.mesh.visible = state.enabled;
        });
        if (!state.enabled) state.activeHandle = null;
    }

    function makePoseEditorHandle(state, options = {}, id, color) {
        const THREERef = getThreeRef(state, options);
        const scene = options.scene || null;
        if (!state || !THREERef || !scene) return;
        const mesh = new THREERef.Mesh(
            new THREERef.SphereGeometry(0.085, 12, 10),
            new THREERef.MeshBasicMaterial({ color, depthTest: false, depthWrite: false, transparent: true, opacity: 0.92 })
        );
        mesh.renderOrder = 9999;
        mesh.visible = false;
        mesh.userData.poseHandleId = id;
        scene.add(mesh);
        state.handleMap[id] = { mesh, id };
    }

    function ensurePoseEditorHandles(state, options = {}) {
        if (!state || !options.scene || state.handleMap.leftShoulder) return;
        makePoseEditorHandle(state, options, 'leftShoulder', 0x68d2ff);
        makePoseEditorHandle(state, options, 'rightShoulder', 0x68d2ff);
        makePoseEditorHandle(state, options, 'leftElbow', 0xffd166);
        makePoseEditorHandle(state, options, 'rightElbow', 0xffd166);
    }

    function updatePoseEditorHandles(state, options = {}) {
        if (!state || !state.enabled) return;
        ensurePoseEditorHandles(state, options);
        HANDLE_IDS.forEach((id) => {
            const handle = state.handleMap[id];
            const node = getPoseEditorNode(options, id);
            if (!handle || !handle.mesh) return;
            if (!node) {
                handle.mesh.visible = false;
                return;
            }
            node.getWorldPosition(handle.mesh.position);
            handle.mesh.visible = true;
        });
    }

    function beginPoseEditorDrag(state, options = {}) {
        const THREERef = getThreeRef(state, options);
        const camera = options.camera || null;
        const windowRef = getWindowRef(options);
        if (!state || !state.enabled || !camera || !THREERef || !state.raycaster || !state.pointer) return false;
        const handles = Object.values(state.handleMap).map((h) => h.mesh).filter(Boolean).filter((m) => m.visible);
        if (handles.length === 0) return false;
        state.pointer.x = (options.clientX / windowRef.innerWidth) * 2 - 1;
        state.pointer.y = -(options.clientY / windowRef.innerHeight) * 2 + 1;
        state.raycaster.setFromCamera(state.pointer, camera);
        const hits = state.raycaster.intersectObjects(handles, false);
        if (!hits.length) return false;
        const hit = hits[0];
        const handleId = hit.object.userData.poseHandleId;
        if (!handleId) return false;
        state.activeHandle = handleId;
        state.dragLastX = options.clientX;
        state.dragLastY = options.clientY;
        const worldPos = hit.object.getWorldPosition(new THREERef.Vector3());
        const normal = camera.getWorldDirection(new THREERef.Vector3()).normalize();
        state.dragPlane.setFromNormalAndCoplanarPoint(normal, worldPos);
        const rayPoint = state.raycaster.ray.intersectPlane(state.dragPlane, new THREERef.Vector3()) || worldPos;
        state.dragOffset.copy(worldPos).sub(rayPoint);
        return true;
    }

    function updatePoseEditorDrag(state, options = {}) {
        const THREERef = getThreeRef(state, options);
        const camera = options.camera || null;
        const windowRef = getWindowRef(options);
        if (!state || !state.activeHandle || !camera || !THREERef || !state.raycaster || !state.pointer) return;
        const node = getPoseEditorNode(options, state.activeHandle);
        if (!node || !node.parent) return;
        const values = state.values || getPoseEditorDefaultValues(options);

        if (state.mode === 'rotate') {
            ensurePoseEditorRotationShape(values);
            const dx = options.clientX - state.dragLastX;
            const dy = options.clientY - state.dragLastY;
            const delta = (dx - dy) * 0.01;
            const rot = values.rotations[state.activeHandle];
            if (rot && (state.rotationAxis === 'x' || state.rotationAxis === 'y' || state.rotationAxis === 'z')) {
                rot[state.rotationAxis] += delta;
            }
        } else {
            state.pointer.x = (options.clientX / windowRef.innerWidth) * 2 - 1;
            state.pointer.y = -(options.clientY / windowRef.innerHeight) * 2 + 1;
            state.raycaster.setFromCamera(state.pointer, camera);
            if (!state.raycaster.ray.intersectPlane(state.dragPlane, state.dragPoint)) return;
            const worldTarget = state.dragPoint.clone().add(state.dragOffset);
            const local = node.parent.worldToLocal(worldTarget.clone());
            if (state.activeHandle === 'leftShoulder' || state.activeHandle === 'rightShoulder') {
                values.shoulder.x = Math.abs(local.x);
                values.shoulder.y = local.y;
                values.shoulder.z = local.z;
            } else {
                values.elbow.x = Math.abs(local.x);
                values.elbow.y = local.y;
                values.elbow.z = local.z;
            }
        }
        state.dragLastX = options.clientX;
        state.dragLastY = options.clientY;
        applyPoseEditorValues(state, options, values);
    }

    function endPoseEditorDrag(state) {
        if (state) state.activeHandle = null;
    }

    function initPoseEditor(state, options = {}) {
        const documentRef = getDocumentRef(options);
        const windowRef = getWindowRef(options);
        const localStorageRef = options.localStorageRef || windowRef.localStorage || null;
        const navigatorRef = options.navigatorRef || windowRef.navigator || null;
        if (!state || !documentRef) return;
        ensurePoseEditorHandles(state, options);
        const uiLayer = documentRef.getElementById('ui-layer');
        if (!uiLayer) return;
        const panel = documentRef.createElement('div');
        panel.id = 'pose-editor-panel';
        panel.className = 'hidden absolute top-24 right-4 z-[240] pointer-events-auto bg-[#111418]/95 border border-[#3a444c] rounded p-2 w-64 text-[10px] text-gray-100';
        panel.innerHTML = '<div class="font-bold text-[#c8aa6e] mb-1">Pose Editor (F8)</div>' +
            '<div class="text-gray-400 mb-1">Translate or rotate pivots.</div>' +
            '<div class="flex gap-1 mb-1">' +
                '<select id="pose-editor-mode" class="flex-1 bg-black/60 border border-[#3a444c] text-gray-100 p-1">' +
                    '<option value="translate">Translate</option>' +
                    '<option value="rotate">Rotate (Locked Pivot)</option>' +
                '</select>' +
                '<select id="pose-editor-axis" class="w-16 bg-black/60 border border-[#3a444c] text-gray-100 p-1">' +
                    '<option value="x">X</option>' +
                    '<option value="y">Y</option>' +
                    '<option value="z">Z</option>' +
                '</select>' +
            '</div>' +
            '<textarea id="pose-editor-json" class="w-full h-28 bg-black/60 border border-[#3a444c] text-[10px] text-gray-100 p-1 font-mono" readonly></textarea>' +
            '<div class="mt-2 flex gap-1">' +
                '<button id="pose-editor-copy" class="flex-1 bg-[#2a3138] hover:bg-[#3a444c] border border-[#c8aa6e] text-[#c8aa6e] px-2 py-1 rounded">Copy</button>' +
                '<button id="pose-editor-save" class="flex-1 bg-[#2a3138] hover:bg-[#3a444c] border border-[#c8aa6e] text-[#c8aa6e] px-2 py-1 rounded">Save</button>' +
                '<button id="pose-editor-reset" class="flex-1 bg-[#2a3138] hover:bg-[#3a444c] border border-[#c8aa6e] text-[#c8aa6e] px-2 py-1 rounded">Reset</button>' +
            '</div>';
        uiLayer.appendChild(panel);
        state.panel = panel;
        state.text = panel.querySelector('#pose-editor-json');
        state.modeSelect = panel.querySelector('#pose-editor-mode');
        state.axisSelect = panel.querySelector('#pose-editor-axis');
        if (state.modeSelect) state.modeSelect.value = state.mode;
        if (state.axisSelect) state.axisSelect.value = state.rotationAxis;
        if (state.modeSelect) state.modeSelect.addEventListener('change', () => { state.mode = state.modeSelect.value === 'rotate' ? 'rotate' : 'translate'; });
        if (state.axisSelect) state.axisSelect.addEventListener('change', () => { state.rotationAxis = state.axisSelect.value === 'y' || state.axisSelect.value === 'z' ? state.axisSelect.value : 'x'; });

        const savedRaw = localStorageRef && typeof localStorageRef.getItem === 'function'
            ? localStorageRef.getItem('poseEditor.v1')
            : null;
        let startValues = getPoseEditorDefaultValues(options);
        if (savedRaw) {
            try {
                const parsed = JSON.parse(savedRaw);
                if (parsed && parsed.shoulder && parsed.elbow) startValues = parsed;
            } catch (err) {
                console.warn('Invalid poseEditor.v1 payload', err);
            }
        }
        applyPoseEditorValues(state, options, startValues);

        panel.querySelector('#pose-editor-copy').addEventListener('click', async () => {
            if (!state.values) return;
            const text = JSON.stringify(state.values, null, 2);
            try {
                if (navigatorRef && navigatorRef.clipboard && typeof navigatorRef.clipboard.writeText === 'function') {
                    await navigatorRef.clipboard.writeText(text);
                }
            } catch (err) {
                console.warn('Clipboard copy failed', err);
            }
        });
        panel.querySelector('#pose-editor-save').addEventListener('click', () => {
            if (!state.values || !localStorageRef || typeof localStorageRef.setItem !== 'function') return;
            localStorageRef.setItem('poseEditor.v1', JSON.stringify(state.values));
        });
        panel.querySelector('#pose-editor-reset').addEventListener('click', () => {
            if (localStorageRef && typeof localStorageRef.removeItem === 'function') localStorageRef.removeItem('poseEditor.v1');
            applyPoseEditorValues(state, options, getPoseEditorDefaultValues(options));
        });

        windowRef.addEventListener('keydown', (e) => {
            if (e.key === 'F8') {
                e.preventDefault();
                togglePoseEditor(state, !state.enabled);
                return;
            }
            if (!state.enabled) return;
            if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                state.mode = state.mode === 'rotate' ? 'translate' : 'rotate';
                if (state.modeSelect) state.modeSelect.value = state.mode;
            }
        });
    }

    window.InputPoseEditorRuntime = {
        createPoseEditorState,
        getPoseEditorDefaultValues,
        ensurePoseEditorRotationShape,
        poseEditorNodeForRig,
        applyPoseEditorValuesToRigRoot,
        applyPoseEditorValues,
        togglePoseEditor,
        ensurePoseEditorHandles,
        updatePoseEditorHandles,
        beginPoseEditorDrag,
        updatePoseEditorDrag,
        endPoseEditorDrag,
        initPoseEditor
    };
})();
