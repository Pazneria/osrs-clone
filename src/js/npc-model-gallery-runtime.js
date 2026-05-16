(function () {
    const OLD_MODEL_STATUS_IDS = Object.freeze(['old_generic', 'old_preset', 'old_renderer', 'placeholder']);
    const STATUS_META = Object.freeze({
        old_generic: { label: 'Old generic', tone: 'old' },
        old_preset: { label: 'Old preset', tone: 'old' },
        old_renderer: { label: 'Old renderer', tone: 'old' },
        placeholder: { label: 'Placeholder', tone: 'warn' },
        catalog: { label: 'Catalog model', tone: 'good' },
        bespoke: { label: 'Bespoke model', tone: 'good' },
        unknown: { label: 'Unknown', tone: 'neutral' }
    });
    const BESPOKE_ENEMY_IDS = Object.freeze(['enemy_rat', 'enemy_chicken', 'enemy_boar', 'enemy_wolf', 'enemy_bear']);
    const OLD_RENDERER_ENEMY_IDS = Object.freeze([]);
    const PLACEHOLDER_ENEMY_IDS = Object.freeze([]);
    const CATALOG_ENEMY_PRESET_IDS = Object.freeze([
        'enemy_training_dummy',
        'enemy_goblin_grunt',
        'enemy_guard',
        'enemy_heavy_brute',
        'enemy_fast_striker'
    ]);
    const GALLERY_ID = 'npc-model-gallery-overlay';
    const STYLE_ID = 'npc-model-gallery-style';
    const THUMB_SIZE = 148;

    let activeEntries = [];
    let activeFocusedViewer = null;

    function getWindowRef(context = {}) {
        return context.windowRef || (typeof window !== 'undefined' ? window : {});
    }

    function getDocumentRef(context = {}) {
        return context.documentRef || (typeof document !== 'undefined' ? document : null);
    }

    function normalizeId(value) {
        return String(value || '').trim().toLowerCase();
    }

    function titleFromId(value) {
        const source = String(value || '').replace(/^npc:/, '').replace(/^enemy_/, '').replace(/_/g, ' ').trim();
        if (!source) return 'Unknown';
        return source.replace(/\b\w/g, (letter) => letter.toUpperCase());
    }

    function isOldModelStatus(statusId) {
        return OLD_MODEL_STATUS_IDS.includes(normalizeId(statusId));
    }

    function getStatusMeta(statusId) {
        return STATUS_META[normalizeId(statusId)] || STATUS_META.unknown;
    }

    function resolveNpcAppearanceId(npc) {
        if (!npc || typeof npc !== 'object') return '';
        const explicitAppearanceId = normalizeId(npc.appearanceId);
        if (explicitAppearanceId) return explicitAppearanceId;
        const merchantId = normalizeId(npc.merchantId);
        const name = normalizeId(npc.name);
        if (merchantId === 'tanner_rusk' || name === 'tanner rusk') return 'tanner_rusk';
        return '';
    }

    function getWorldRuntime(windowRef) {
        return windowRef.WorldBootstrapRuntime || null;
    }

    function getCombatRuntime(windowRef) {
        return windowRef.CombatRuntime || null;
    }

    function listWorldIds(windowRef) {
        const runtime = getWorldRuntime(windowRef);
        if (runtime && typeof runtime.listWorldIds === 'function') {
            const ids = runtime.listWorldIds();
            if (Array.isArray(ids) && ids.length > 0) return ids.map(normalizeId).filter(Boolean);
        }
        return ['main_overworld', 'tutorial_island'];
    }

    function getWorldLabel(windowRef, worldId) {
        const runtime = getWorldRuntime(windowRef);
        if (runtime && typeof runtime.getWorldManifestEntry === 'function') {
            try {
                const entry = runtime.getWorldManifestEntry(worldId);
                if (entry && typeof entry.label === 'string' && entry.label.trim()) return entry.label.trim();
            } catch (error) {
                return titleFromId(worldId);
            }
        }
        return titleFromId(worldId);
    }

    function getWorldDefinition(windowRef, worldId) {
        const runtime = getWorldRuntime(windowRef);
        if (!runtime || typeof runtime.getWorldDefinition !== 'function') return null;
        try {
            return runtime.getWorldDefinition(worldId);
        } catch (error) {
            return null;
        }
    }

    function classifyServiceModel(service) {
        const appearanceId = resolveNpcAppearanceId(service);
        return {
            appearanceId,
            statusId: appearanceId ? 'catalog' : 'old_generic',
            modelSource: appearanceId ? `appearanceId:${appearanceId}` : `npcType:${Number.isFinite(service && service.npcType) ? service.npcType : '?'}`
        };
    }

    function makeWorldNpcEntry(windowRef, worldId, worldLabel, service, ordinal) {
        const model = classifyServiceModel(service);
        const spawnId = typeof service.spawnId === 'string' && service.spawnId.trim()
            ? service.spawnId.trim()
            : `npc:${normalizeId(service.serviceId) || ordinal}`;
        const name = typeof service.name === 'string' && service.name.trim() ? service.name.trim() : titleFromId(spawnId);
        return {
            entryId: `world:${worldId}:${spawnId}:${ordinal}`,
            kind: 'world_npc',
            groupId: `world:${worldId}`,
            groupLabel: `${worldLabel} NPCs`,
            worldId,
            worldLabel,
            displayName: name,
            subtitle: service.serviceId || spawnId,
            spawnId,
            serviceId: service.serviceId || '',
            modelSource: model.modelSource,
            statusId: model.statusId,
            oldModel: isOldModelStatus(model.statusId),
            appearanceId: model.appearanceId,
            npcType: Number.isFinite(service.npcType) ? service.npcType : 2,
            placementCount: 1
        };
    }

    function getWorldNpcModelKey(entry) {
        if (!entry) return '';
        if (entry.appearanceId) return `appearance:${entry.appearanceId}`;
        return `generic:${Number.isFinite(entry.npcType) ? entry.npcType : '?'}:${normalizeId(entry.displayName)}`;
    }

    function mergeWorldNpcModelEntry(existing, next) {
        if (!existing || !next) return;
        existing.placementCount = (Number.isFinite(existing.placementCount) ? existing.placementCount : 1) + 1;
        if (!existing.relatedServiceIds) existing.relatedServiceIds = [existing.serviceId].filter(Boolean);
        if (next.serviceId && !existing.relatedServiceIds.includes(next.serviceId)) {
            existing.relatedServiceIds.push(next.serviceId);
        }
        if (!existing.relatedSpawnIds) existing.relatedSpawnIds = [existing.spawnId].filter(Boolean);
        if (next.spawnId && !existing.relatedSpawnIds.includes(next.spawnId)) {
            existing.relatedSpawnIds.push(next.spawnId);
        }
    }

    function collectWorldNpcEntries(context = {}) {
        const windowRef = getWindowRef(context);
        const entries = [];
        const ids = listWorldIds(windowRef);
        for (let worldIndex = 0; worldIndex < ids.length; worldIndex++) {
            const worldId = ids[worldIndex];
            const definition = getWorldDefinition(windowRef, worldId);
            const services = definition && Array.isArray(definition.services) ? definition.services : [];
            const worldLabel = getWorldLabel(windowRef, worldId);
            const seenModelEntries = new Map();
            for (let i = 0; i < services.length; i++) {
                const service = services[i];
                if (!service || service.type !== 'MERCHANT') continue;
                const entry = makeWorldNpcEntry(windowRef, worldId, worldLabel, service, i);
                const modelKey = getWorldNpcModelKey(entry);
                const scopedModelKey = `${worldId}:${modelKey}`;
                if (modelKey && seenModelEntries.has(scopedModelKey)) {
                    mergeWorldNpcModelEntry(seenModelEntries.get(scopedModelKey), entry);
                    continue;
                }
                seenModelEntries.set(scopedModelKey, entry);
                entries.push(entry);
            }
        }
        return entries;
    }

    function countEnemySpawnsByWorld(windowRef, enemyId) {
        const combatRuntime = getCombatRuntime(windowRef);
        const counts = [];
        const ids = listWorldIds(windowRef);
        for (let i = 0; i < ids.length; i++) {
            const worldId = ids[i];
            let spawns = [];
            if (combatRuntime && typeof combatRuntime.getWorldCombatSpawnNodes === 'function') {
                spawns = combatRuntime.getWorldCombatSpawnNodes(worldId);
            } else if (combatRuntime && typeof combatRuntime.listEnemySpawnNodesForWorld === 'function') {
                spawns = combatRuntime.listEnemySpawnNodesForWorld(worldId);
            }
            if (!Array.isArray(spawns)) spawns = [];
            const count = spawns.filter((spawn) => spawn && spawn.enemyId === enemyId).length;
            if (count > 0) counts.push(`${getWorldLabel(windowRef, worldId)} x${count}`);
        }
        return counts;
    }

    function classifyEnemyModel(enemyType) {
        const enemyId = normalizeId(enemyType && enemyType.enemyId);
        const appearance = enemyType && enemyType.appearance && typeof enemyType.appearance === 'object'
            ? enemyType.appearance
            : {};
        const kind = normalizeId(appearance.kind);
        const modelPresetId = normalizeId(appearance.modelPresetId);
        if (BESPOKE_ENEMY_IDS.includes(enemyId)) {
            return { statusId: 'bespoke', modelSource: `enemyRenderer:${enemyId}` };
        }
        if (PLACEHOLDER_ENEMY_IDS.includes(enemyId)) {
            return { statusId: 'placeholder', modelSource: kind ? `appearance.kind:${kind}` : 'placeholder' };
        }
        if (OLD_RENDERER_ENEMY_IDS.includes(enemyId)) {
            return { statusId: 'old_renderer', modelSource: `enemyRenderer:${enemyId}` };
        }
        if (modelPresetId && CATALOG_ENEMY_PRESET_IDS.includes(modelPresetId)) {
            return { statusId: 'catalog', modelSource: `modelPresetId:${modelPresetId}` };
        }
        if (kind === 'humanoid' && modelPresetId) {
            return { statusId: 'old_preset', modelSource: `modelPresetId:${modelPresetId}` };
        }
        if (kind === 'humanoid') {
            return {
                statusId: 'old_generic',
                modelSource: `npcType:${Number.isFinite(appearance.npcType) ? appearance.npcType : '?'}`
            };
        }
        if (kind) return { statusId: 'old_renderer', modelSource: `appearance.kind:${kind}` };
        return { statusId: 'unknown', modelSource: 'unknown' };
    }

    function makeEnemyEntry(windowRef, enemyType) {
        const enemyId = normalizeId(enemyType && enemyType.enemyId);
        const model = classifyEnemyModel(enemyType);
        const spawnCounts = countEnemySpawnsByWorld(windowRef, enemyId);
        return {
            entryId: `enemy:${enemyId}`,
            kind: 'combat_enemy',
            groupId: 'combat',
            groupLabel: 'Combat Enemies',
            worldId: '',
            worldLabel: spawnCounts.length ? spawnCounts.join(', ') : 'Unspawned',
            displayName: typeof enemyType.displayName === 'string' && enemyType.displayName.trim()
                ? enemyType.displayName.trim()
                : titleFromId(enemyId),
            subtitle: enemyId,
            enemyId,
            modelSource: model.modelSource,
            statusId: model.statusId,
            oldModel: isOldModelStatus(model.statusId),
            appearanceId: normalizeId(enemyType && enemyType.appearance && enemyType.appearance.modelPresetId),
            npcType: Number.isFinite(enemyType && enemyType.appearance && enemyType.appearance.npcType)
                ? enemyType.appearance.npcType
                : null
        };
    }

    function collectEnemyEntries(context = {}) {
        const windowRef = getWindowRef(context);
        const combatRuntime = getCombatRuntime(windowRef);
        if (!combatRuntime || typeof combatRuntime.listEnemyTypes !== 'function') return [];
        const enemyTypes = combatRuntime.listEnemyTypes();
        if (!Array.isArray(enemyTypes)) return [];
        return enemyTypes.map((enemyType) => makeEnemyEntry(windowRef, enemyType)).filter((entry) => entry.enemyId);
    }

    function collectNpcModelGalleryEntries(context = {}) {
        return collectWorldNpcEntries(context)
            .concat(collectEnemyEntries(context))
            .sort((left, right) => {
                if (left.groupLabel !== right.groupLabel) return left.groupLabel.localeCompare(right.groupLabel);
                if (left.oldModel !== right.oldModel) return left.oldModel ? -1 : 1;
                return left.displayName.localeCompare(right.displayName);
            });
    }

    function createWorldNpcModel(entry, windowRef) {
        let group = null;
        if (entry.appearanceId && typeof windowRef.createNpcHumanoidRigFromPreset === 'function') {
            group = windowRef.createNpcHumanoidRigFromPreset(entry.appearanceId);
        }
        if (!group && typeof windowRef.createHumanoidModel === 'function') {
            group = windowRef.createHumanoidModel(Number.isFinite(entry.npcType) ? entry.npcType : 2);
        }
        return group;
    }

    function createEnemyModel(entry, windowRef) {
        const combatRuntime = getCombatRuntime(windowRef);
        const renderRuntime = windowRef.CombatEnemyRenderRuntime || null;
        if (!combatRuntime || typeof combatRuntime.getEnemyTypeDefinition !== 'function') return null;
        if (!renderRuntime || typeof renderRuntime.createEnemyVisualRenderer !== 'function') return null;
        const enemyType = combatRuntime.getEnemyTypeDefinition(entry.enemyId);
        if (!enemyType) return null;
        const enemyState = {
            runtimeId: `gallery:${entry.enemyId}`,
            spawnNodeId: `gallery:${entry.enemyId}`,
            enemyId: entry.enemyId,
            x: 0,
            y: 0,
            z: 0,
            currentHealth: enemyType.stats && Number.isFinite(enemyType.stats.hitpoints) ? enemyType.stats.hitpoints : 1,
            currentState: 'idle',
            lockedTargetId: null,
            remainingAttackCooldown: 0,
            resolvedHomeTile: { x: 0, y: 0, z: 0 },
            resolvedSpawnTile: { x: 0, y: 0, z: 0 },
            resolvedPatrolRoute: null,
            patrolRouteIndex: null,
            patrolTargetIndex: null,
            resolvedRoamingRadius: 0,
            resolvedChaseRange: 0,
            resolvedAggroRadius: 0,
            defaultMovementSpeed: 1,
            combatMovementSpeed: 1,
            facingYaw: Math.PI,
            respawnAtTick: null,
            lastDamagerId: null,
            attackTriggerAt: 0,
            hitReactionTriggerAt: 0
        };
        const renderer = renderRuntime.createEnemyVisualRenderer({
            enemyState,
            enemyType,
            windowRef,
            createHumanoidModel: typeof windowRef.createHumanoidModel === 'function'
                ? windowRef.createHumanoidModel
                : null,
            getEnemyCombatLevel: typeof combatRuntime.getEnemyCombatLevel === 'function'
                ? combatRuntime.getEnemyCombatLevel
                : () => 1,
            resolveEnemyModelPresetId: (type) => normalizeId(type && type.appearance && type.appearance.modelPresetId) || null,
            resolveEnemyAnimationSetId: (type) => normalizeId(type && type.appearance && type.appearance.animationSetId) || null,
            resolveEnemyAnimationSetDef: () => null
        });
        return renderer && renderer.group ? renderer.group : null;
    }

    function hideRuntimeHitboxes(group) {
        if (!group || typeof group.traverse !== 'function') return;
        group.traverse((child) => {
            if (!child || !child.userData) return;
            if (child.userData.type === 'ENEMY' || child.userData.type === 'NPC') child.visible = false;
        });
    }

    function normalizeModelForThumbnail(THREERef, group) {
        if (!THREERef || !group) return;
        group.rotation.y = 0;
        group.updateMatrixWorld(true);
        const box = new THREERef.Box3().setFromObject(group);
        if (!Number.isFinite(box.min.x) || !Number.isFinite(box.max.x)) return;
        const size = new THREERef.Vector3();
        box.getSize(size);
        const fit = Math.max(size.y || 1, size.x * 1.4 || 1, size.z * 1.25 || 1);
        const scale = fit > 0 ? Math.min(2.3, 1.78 / fit) : 1;
        group.scale.multiplyScalar(scale);
        group.updateMatrixWorld(true);
        const fittedBox = new THREERef.Box3().setFromObject(group);
        const fittedCenter = new THREERef.Vector3();
        fittedBox.getCenter(fittedCenter);
        group.position.x -= fittedCenter.x;
        group.position.y += 0.86 - fittedCenter.y;
        group.position.z -= fittedCenter.z;
    }

    function normalizeModelForFocusedViewer(THREERef, group) {
        if (!THREERef || !group) return;
        group.rotation.y = 0;
        group.updateMatrixWorld(true);
        const box = new THREERef.Box3().setFromObject(group);
        if (!Number.isFinite(box.min.x) || !Number.isFinite(box.max.x)) return;
        const size = new THREERef.Vector3();
        box.getSize(size);
        const fit = Math.max(size.y || 1, size.x || 1, size.z || 1);
        const scale = fit > 0 ? Math.min(3.2, 2.65 / fit) : 1;
        group.scale.multiplyScalar(scale);
        group.updateMatrixWorld(true);
        const fittedBox = new THREERef.Box3().setFromObject(group);
        const fittedCenter = new THREERef.Vector3();
        fittedBox.getCenter(fittedCenter);
        group.position.x -= fittedCenter.x;
        group.position.y -= fittedCenter.y;
        group.position.z -= fittedCenter.z;
    }

    function createModelForEntry(entry, windowRef) {
        const group = entry.kind === 'combat_enemy'
            ? createEnemyModel(entry, windowRef)
            : createWorldNpcModel(entry, windowRef);
        hideRuntimeHitboxes(group);
        return group;
    }

    function closeFocusedModelViewer(panel) {
        const root = panel && panel.querySelector ? panel.querySelector('[data-gallery-focus]') : null;
        if (activeFocusedViewer && typeof activeFocusedViewer.dispose === 'function') {
            activeFocusedViewer.dispose();
        }
        activeFocusedViewer = null;
        if (root) {
            root.classList.remove('is-open');
            root.setAttribute('aria-hidden', 'true');
        }
        return true;
    }

    function openFocusedModelViewer(panel, entry, context = {}) {
        const windowRef = getWindowRef(context);
        const documentRef = getDocumentRef(context);
        const THREERef = windowRef.THREE || (typeof THREE !== 'undefined' ? THREE : null);
        const root = panel && panel.querySelector ? panel.querySelector('[data-gallery-focus]') : null;
        const viewport = root && root.querySelector ? root.querySelector('[data-gallery-focus-viewport]') : null;
        const title = root && root.querySelector ? root.querySelector('[data-gallery-focus-title]') : null;
        const meta = root && root.querySelector ? root.querySelector('[data-gallery-focus-meta]') : null;
        if (!panel || !entry || !documentRef || !THREERef || !viewport || typeof THREERef.WebGLRenderer !== 'function') return false;

        closeFocusedModelViewer(panel);
        clearElement(viewport);
        if (title) title.textContent = entry.displayName || 'NPC Model';
        if (meta) {
            const placementText = Number.isFinite(entry.placementCount) && entry.placementCount > 1
                ? `${entry.placementCount} placements`
                : entry.subtitle || entry.entryId;
            meta.textContent = [placementText, entry.modelSource || '', entry.worldLabel || ''].filter(Boolean).join(' · ');
        }

        let renderer = null;
        let model = null;
        let scene = null;
        let camera = null;
        let pivot = null;
        let resizeObserver = null;
        let isDragging = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let startRotationX = 0;
        let startRotationY = 0;

        function render() {
            if (renderer && scene && camera) renderer.render(scene, camera);
        }

        function resize() {
            if (!renderer || !camera) return;
            const rect = viewport.getBoundingClientRect();
            const width = Math.max(320, Math.floor(rect.width || 720));
            const height = Math.max(300, Math.floor(rect.height || 520));
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            if (typeof camera.updateProjectionMatrix === 'function') camera.updateProjectionMatrix();
            render();
        }

        function resetRotation() {
            if (!pivot) return;
            pivot.rotation.x = -0.08;
            pivot.rotation.y = -0.42;
            pivot.rotation.z = 0;
            render();
        }

        function onPointerDown(event) {
            if (!pivot) return;
            isDragging = true;
            dragStartX = event.clientX;
            dragStartY = event.clientY;
            startRotationX = pivot.rotation.x;
            startRotationY = pivot.rotation.y;
            if (renderer && renderer.domElement && typeof renderer.domElement.setPointerCapture === 'function') {
                renderer.domElement.setPointerCapture(event.pointerId);
            }
            event.preventDefault();
        }

        function onPointerMove(event) {
            if (!isDragging || !pivot) return;
            const deltaX = event.clientX - dragStartX;
            const deltaY = event.clientY - dragStartY;
            pivot.rotation.y = startRotationY + (deltaX * 0.01);
            pivot.rotation.x = Math.max(-0.65, Math.min(0.65, startRotationX + (deltaY * 0.006)));
            render();
        }

        function onPointerUp(event) {
            isDragging = false;
            if (renderer && renderer.domElement && typeof renderer.domElement.releasePointerCapture === 'function') {
                try {
                    renderer.domElement.releasePointerCapture(event.pointerId);
                } catch (error) {
                    return;
                }
            }
        }

        try {
            renderer = new THREERef.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setPixelRatio(Math.min(2, Number(windowRef.devicePixelRatio) || 1));
            renderer.setClearColor(0x000000, 0);
            renderer.domElement.className = 'npc-model-focus-canvas';
            renderer.domElement.setAttribute('aria-label', `${entry.displayName || 'NPC'} 3D model`);

            scene = new THREERef.Scene();
            camera = new THREERef.PerspectiveCamera(34, 1, 0.1, 40);
            camera.position.set(0, 0.2, 5.2);
            camera.lookAt(0, 0, 0);

            const ambient = new THREERef.AmbientLight(0xffffff, 0.78);
            const key = new THREERef.DirectionalLight(0xffffff, 1.28);
            key.position.set(2.6, 4.3, 5.2);
            const rim = new THREERef.DirectionalLight(0xffd4a0, 0.52);
            rim.position.set(-3.2, 2.1, -2.8);
            const fill = new THREERef.DirectionalLight(0x9fb7ff, 0.45);
            fill.position.set(-3.4, 2.6, 3.4);
            scene.add(ambient, key, rim, fill);

            pivot = new THREERef.Group();
            model = createModelForEntry(entry, windowRef);
            if (!model) throw new Error('Model unavailable');
            normalizeModelForFocusedViewer(THREERef, model);
            pivot.add(model);
            scene.add(pivot);

            viewport.appendChild(renderer.domElement);
            renderer.domElement.addEventListener('pointerdown', onPointerDown);
            renderer.domElement.addEventListener('pointermove', onPointerMove);
            renderer.domElement.addEventListener('pointerup', onPointerUp);
            renderer.domElement.addEventListener('pointercancel', onPointerUp);
            renderer.domElement.addEventListener('lostpointercapture', () => {
                isDragging = false;
            });

            activeFocusedViewer = {
                dispose() {
                    if (resizeObserver && typeof resizeObserver.disconnect === 'function') resizeObserver.disconnect();
                    if (windowRef.removeEventListener) windowRef.removeEventListener('resize', resize);
                    if (renderer && renderer.domElement) {
                        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
                        renderer.domElement.removeEventListener('pointermove', onPointerMove);
                        renderer.domElement.removeEventListener('pointerup', onPointerUp);
                        renderer.domElement.removeEventListener('pointercancel', onPointerUp);
                    }
                    if (model && pivot) pivot.remove(model);
                    if (pivot && scene) scene.remove(pivot);
                    if (renderer && renderer.domElement && renderer.domElement.parentNode) {
                        renderer.domElement.parentNode.removeChild(renderer.domElement);
                    }
                    if (renderer && typeof renderer.dispose === 'function') renderer.dispose();
                },
                resetRotation
            };

            if (typeof windowRef.ResizeObserver === 'function') {
                resizeObserver = new windowRef.ResizeObserver(resize);
                resizeObserver.observe(viewport);
            }
            if (windowRef.addEventListener) windowRef.addEventListener('resize', resize);
            if (root) {
                root.classList.add('is-open');
                root.setAttribute('aria-hidden', 'false');
            }
            resetRotation();
            resize();
            return true;
        } catch (error) {
            if (renderer && typeof renderer.dispose === 'function') renderer.dispose();
            clearElement(viewport);
            appendText(viewport, 'span', 'npc-model-focus-empty', 'No preview');
            if (root) {
                root.classList.add('is-open');
                root.setAttribute('aria-hidden', 'false');
            }
            return false;
        }
    }

    function renderEntryThumbnails(entries, context = {}) {
        const windowRef = getWindowRef(context);
        const documentRef = getDocumentRef(context);
        const THREERef = windowRef.THREE || (typeof THREE !== 'undefined' ? THREE : null);
        const images = Object.create(null);
        if (!documentRef || !THREERef || typeof THREERef.WebGLRenderer !== 'function') return images;

        let renderer = null;
        try {
            renderer = new THREERef.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
            renderer.setPixelRatio(1);
            renderer.setSize(THUMB_SIZE, THUMB_SIZE, false);
            renderer.setClearColor(0x000000, 0);
        } catch (error) {
            return images;
        }

        const scene = new THREERef.Scene();
        const camera = new THREERef.OrthographicCamera(-1.18, 1.18, 1.92, -0.16, 0.1, 12);
        camera.position.set(0, 0.92, 4.5);
        camera.lookAt(0, 0.92, 0);
        const ambient = new THREERef.AmbientLight(0xffffff, 0.7);
        const key = new THREERef.DirectionalLight(0xffffff, 1.2);
        key.position.set(2.5, 4.5, 5);
        const fill = new THREERef.DirectionalLight(0x9eb6ff, 0.55);
        fill.position.set(-3, 2, 3);
        scene.add(ambient, key, fill);

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            let model = null;
            try {
                model = createModelForEntry(entry, windowRef);
                if (!model) continue;
                normalizeModelForThumbnail(THREERef, model);
                scene.add(model);
                renderer.render(scene, camera);
                images[entry.entryId] = renderer.domElement.toDataURL('image/png');
                scene.remove(model);
            } catch (error) {
                if (model) scene.remove(model);
                images[entry.entryId] = '';
            }
        }

        if (typeof renderer.dispose === 'function') renderer.dispose();
        return images;
    }

    function ensureGalleryStyles(documentRef) {
        if (!documentRef || documentRef.getElementById(STYLE_ID)) return;
        const style = documentRef.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            .npc-model-gallery-overlay {
                position: fixed;
                inset: 0;
                z-index: 620;
                display: none;
                background: rgba(5, 7, 9, 0.82);
                color: #f3ead9;
                font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                pointer-events: auto;
            }
            .npc-model-gallery-overlay.is-open {
                display: flex;
            }
            .npc-model-gallery-shell {
                width: min(1220px, calc(100vw - 28px));
                height: min(860px, calc(100vh - 28px));
                margin: auto;
                display: flex;
                flex-direction: column;
                background: #15110d;
                border: 2px solid #5d5447;
                box-shadow: 0 16px 48px rgba(0, 0, 0, 0.74);
            }
            .npc-model-gallery-header {
                display: flex;
                align-items: center;
                gap: 12px;
                min-height: 56px;
                padding: 10px 14px;
                border-bottom: 1px solid #3e3529;
                background: #211b14;
            }
            .npc-model-gallery-title {
                min-width: 0;
                flex: 1;
            }
            .npc-model-gallery-title h2 {
                margin: 0;
                color: #ff981f;
                font-size: 16px;
                line-height: 1.2;
            }
            .npc-model-gallery-title p {
                margin: 3px 0 0;
                color: #c9bda9;
                font-size: 12px;
                line-height: 1.3;
            }
            .npc-model-gallery-actions {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .npc-model-gallery-button,
            .npc-model-gallery-select {
                height: 32px;
                border: 1px solid #5d5447;
                background: #2b251d;
                color: #f3ead9;
                font-size: 12px;
            }
            .npc-model-gallery-button {
                padding: 0 10px;
                cursor: pointer;
            }
            .npc-model-gallery-select {
                padding: 0 8px;
            }
            .npc-model-gallery-summary {
                display: flex;
                flex-wrap: wrap;
                gap: 7px;
                padding: 10px 14px;
                border-bottom: 1px solid #2d261e;
                background: #120e0b;
            }
            .npc-model-gallery-chip {
                display: inline-flex;
                align-items: center;
                min-height: 24px;
                padding: 0 8px;
                border: 1px solid #4b4236;
                background: #241e18;
                color: #d7cab5;
                font-size: 11px;
                white-space: nowrap;
            }
            .npc-model-gallery-content {
                flex: 1;
                overflow: auto;
                padding: 14px;
            }
            .npc-model-gallery-section {
                margin-bottom: 18px;
            }
            .npc-model-gallery-section-title {
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 0 0 8px;
                color: #d8c9ad;
                font-size: 13px;
                font-weight: 700;
            }
            .npc-model-gallery-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(176px, 1fr));
                gap: 10px;
            }
            .npc-model-gallery-card {
                min-width: 0;
                border: 1px solid #3e3529;
                background: #1b1510;
                cursor: pointer;
                text-align: left;
                transition: border-color 120ms ease, transform 120ms ease;
            }
            .npc-model-gallery-card:hover,
            .npc-model-gallery-card:focus {
                border-color: #a9824d;
                outline: none;
                transform: translateY(-1px);
            }
            .npc-model-gallery-thumb {
                height: 148px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(180deg, #231d16 0%, #11100e 100%);
                border-bottom: 1px solid #332a21;
            }
            .npc-model-gallery-thumb img {
                width: 148px;
                height: 148px;
                object-fit: contain;
                image-rendering: auto;
            }
            .npc-model-gallery-thumb span {
                color: #867866;
                font-size: 12px;
            }
            .npc-model-gallery-card-body {
                padding: 8px;
            }
            .npc-model-gallery-card-name {
                overflow: hidden;
                color: #f3ead9;
                font-size: 13px;
                font-weight: 700;
                line-height: 1.25;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .npc-model-gallery-card-meta {
                overflow: hidden;
                margin-top: 3px;
                color: #b8aa95;
                font-size: 11px;
                line-height: 1.25;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .npc-model-gallery-badges {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                margin-top: 7px;
            }
            .npc-model-gallery-badge {
                min-height: 20px;
                padding: 2px 6px;
                border: 1px solid #514638;
                color: #d7cab5;
                font-size: 10px;
                line-height: 1.3;
            }
            .npc-model-gallery-badge.old {
                border-color: #89663b;
                background: #3c2614;
                color: #ffbf75;
            }
            .npc-model-gallery-badge.warn {
                border-color: #915252;
                background: #3a1616;
                color: #ff9d9d;
            }
            .npc-model-gallery-badge.good {
                border-color: #537c53;
                background: #183018;
                color: #b6e8a6;
            }
            .npc-model-focus {
                position: absolute;
                inset: 0;
                z-index: 2;
                display: none;
                padding: 18px;
                background: rgba(5, 7, 9, 0.88);
            }
            .npc-model-focus.is-open {
                display: flex;
            }
            .npc-model-focus-shell {
                width: min(980px, calc(100vw - 36px));
                height: min(780px, calc(100vh - 36px));
                margin: auto;
                display: flex;
                flex-direction: column;
                border: 2px solid #6d5d48;
                background: #15110d;
                box-shadow: 0 18px 62px rgba(0, 0, 0, 0.78);
            }
            .npc-model-focus-header {
                display: flex;
                align-items: center;
                gap: 12px;
                min-height: 58px;
                padding: 10px 14px;
                border-bottom: 1px solid #3e3529;
                background: #211b14;
            }
            .npc-model-focus-title-wrap {
                min-width: 0;
                flex: 1;
            }
            .npc-model-focus-title {
                margin: 0;
                overflow: hidden;
                color: #ff981f;
                font-size: 18px;
                line-height: 1.2;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .npc-model-focus-meta {
                margin-top: 4px;
                overflow: hidden;
                color: #c9bda9;
                font-size: 12px;
                line-height: 1.25;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .npc-model-focus-stage {
                position: relative;
                flex: 1;
                min-height: 0;
                background:
                    radial-gradient(circle at 50% 42%, rgba(139, 105, 66, 0.24), transparent 42%),
                    linear-gradient(180deg, #201912 0%, #0f0e0d 100%);
            }
            .npc-model-focus-viewport {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            }
            .npc-model-focus-canvas {
                width: 100%;
                height: 100%;
                cursor: grab;
                touch-action: none;
            }
            .npc-model-focus-canvas:active {
                cursor: grabbing;
            }
            .npc-model-focus-empty {
                color: #b8aa95;
                font-size: 13px;
            }
            @media (max-width: 720px) {
                .npc-model-gallery-shell {
                    width: 100vw;
                    height: 100vh;
                }
                .npc-model-gallery-header {
                    align-items: stretch;
                    flex-direction: column;
                }
                .npc-model-gallery-actions {
                    width: 100%;
                }
                .npc-model-gallery-select,
                .npc-model-gallery-button {
                    flex: 1;
                }
                .npc-model-focus {
                    padding: 0;
                }
                .npc-model-focus-shell {
                    width: 100vw;
                    height: 100vh;
                }
                .npc-model-focus-header {
                    align-items: stretch;
                    flex-direction: column;
                }
            }
        `;
        documentRef.head.appendChild(style);
    }

    function clearElement(element) {
        while (element && element.firstChild) element.removeChild(element.firstChild);
    }

    function appendText(parent, tag, className, text) {
        const element = parent.ownerDocument.createElement(tag);
        element.className = className;
        element.textContent = text;
        parent.appendChild(element);
        return element;
    }

    function summarizeEntries(entries) {
        const counts = {
            total: entries.length,
            old: entries.filter((entry) => entry.oldModel).length,
            world: entries.filter((entry) => entry.kind === 'world_npc').length,
            combat: entries.filter((entry) => entry.kind === 'combat_enemy').length,
            statuses: Object.create(null)
        };
        entries.forEach((entry) => {
            counts.statuses[entry.statusId] = (counts.statuses[entry.statusId] || 0) + 1;
        });
        return counts;
    }

    function appendSummary(summaryRoot, entries) {
        clearElement(summaryRoot);
        const summary = summarizeEntries(entries);
        appendText(summaryRoot, 'span', 'npc-model-gallery-chip', `${summary.total} total`);
        appendText(summaryRoot, 'span', 'npc-model-gallery-chip', `${summary.old} old/placeholder`);
        appendText(summaryRoot, 'span', 'npc-model-gallery-chip', `${summary.world} world NPCs`);
        appendText(summaryRoot, 'span', 'npc-model-gallery-chip', `${summary.combat} combat enemies`);
        Object.keys(summary.statuses).sort().forEach((statusId) => {
            appendText(summaryRoot, 'span', 'npc-model-gallery-chip', `${getStatusMeta(statusId).label}: ${summary.statuses[statusId]}`);
        });
    }

    function filterEntries(entries, filterId) {
        const filter = normalizeId(filterId);
        if (!filter || filter === 'all') return entries.slice();
        if (filter === 'old') return entries.filter((entry) => entry.oldModel);
        if (filter === 'world') return entries.filter((entry) => entry.kind === 'world_npc');
        if (filter === 'combat') return entries.filter((entry) => entry.kind === 'combat_enemy');
        return entries.filter((entry) => normalizeId(entry.statusId) === filter);
    }

    function groupEntries(entries) {
        const groups = [];
        const byId = new Map();
        entries.forEach((entry) => {
            const groupId = entry.groupId || 'misc';
            if (!byId.has(groupId)) {
                byId.set(groupId, {
                    groupId,
                    label: entry.groupLabel || 'Other',
                    entries: []
                });
                groups.push(byId.get(groupId));
            }
            byId.get(groupId).entries.push(entry);
        });
        return groups;
    }

    function appendCard(grid, entry, imageSrc, panel) {
        const documentRef = grid.ownerDocument;
        const card = documentRef.createElement('article');
        card.className = 'npc-model-gallery-card';
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Open ${entry.displayName} 3D model`);
        card.dataset.galleryEntryId = entry.entryId;
        const openFocused = () => openFocusedModelViewer(panel, entry, {
            documentRef,
            windowRef: panel && panel._npcGalleryWindowRef ? panel._npcGalleryWindowRef : getWindowRef()
        });
        card.addEventListener('click', openFocused);
        card.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            openFocused();
        });

        const thumb = documentRef.createElement('div');
        thumb.className = 'npc-model-gallery-thumb';
        if (imageSrc) {
            const image = documentRef.createElement('img');
            image.alt = entry.displayName;
            image.src = imageSrc;
            thumb.appendChild(image);
        } else {
            appendText(thumb, 'span', '', 'No preview');
        }
        card.appendChild(thumb);

        const body = documentRef.createElement('div');
        body.className = 'npc-model-gallery-card-body';
        appendText(body, 'div', 'npc-model-gallery-card-name', entry.displayName);
        appendText(body, 'div', 'npc-model-gallery-card-meta', entry.subtitle || entry.entryId);
        if (Number.isFinite(entry.placementCount) && entry.placementCount > 1) {
            appendText(body, 'div', 'npc-model-gallery-card-meta', `${entry.placementCount} placements`);
        }
        appendText(body, 'div', 'npc-model-gallery-card-meta', entry.modelSource || 'unknown model source');
        appendText(body, 'div', 'npc-model-gallery-card-meta', entry.worldLabel || '');

        const badges = documentRef.createElement('div');
        badges.className = 'npc-model-gallery-badges';
        const status = getStatusMeta(entry.statusId);
        appendText(badges, 'span', `npc-model-gallery-badge ${status.tone}`, status.label);
        appendText(badges, 'span', 'npc-model-gallery-badge', entry.kind === 'combat_enemy' ? 'combat' : 'world');
        body.appendChild(badges);
        card.appendChild(body);
        grid.appendChild(card);
    }

    function renderGalleryEntries(panel, entries, images, filterId) {
        const summaryRoot = panel.querySelector('[data-gallery-summary]');
        const contentRoot = panel.querySelector('[data-gallery-content]');
        const filtered = filterEntries(entries, filterId);
        appendSummary(summaryRoot, entries);
        clearElement(contentRoot);
        if (filtered.length === 0) {
            appendText(contentRoot, 'p', 'npc-model-gallery-card-meta', 'No NPCs match this filter.');
            return;
        }
        groupEntries(filtered).forEach((group) => {
            const section = contentRoot.ownerDocument.createElement('section');
            section.className = 'npc-model-gallery-section';
            appendText(section, 'h3', 'npc-model-gallery-section-title', `${group.label} (${group.entries.length})`);
            const grid = contentRoot.ownerDocument.createElement('div');
            grid.className = 'npc-model-gallery-grid';
            group.entries.forEach((entry) => appendCard(grid, entry, images[entry.entryId], panel));
            section.appendChild(grid);
            contentRoot.appendChild(section);
        });
    }

    function closeGallery(context = {}) {
        const documentRef = getDocumentRef(context);
        if (!documentRef) return false;
        const panel = documentRef.getElementById(GALLERY_ID);
        if (!panel) return false;
        closeFocusedModelViewer(panel);
        panel.classList.remove('is-open');
        panel.setAttribute('aria-hidden', 'true');
        return true;
    }

    function ensureGalleryPanel(context = {}) {
        const documentRef = getDocumentRef(context);
        if (!documentRef || !documentRef.body) return null;
        ensureGalleryStyles(documentRef);
        let panel = documentRef.getElementById(GALLERY_ID);
        if (panel) return panel;
        panel = documentRef.createElement('div');
        panel.id = GALLERY_ID;
        panel.className = 'npc-model-gallery-overlay';
        panel.setAttribute('aria-hidden', 'true');
        panel.innerHTML = `
            <div class="npc-model-gallery-shell" role="dialog" aria-modal="true" aria-labelledby="npc-model-gallery-title">
                <header class="npc-model-gallery-header">
                    <div class="npc-model-gallery-title">
                        <h2 id="npc-model-gallery-title">NPC Model Gallery</h2>
                        <p>Distinct world NPC models and combat enemies, grouped by source and labeled by model status.</p>
                    </div>
                    <div class="npc-model-gallery-actions">
                        <select class="npc-model-gallery-select" data-gallery-filter aria-label="Filter NPC models">
                            <option value="all">All models</option>
                            <option value="old">Old only</option>
                            <option value="world">World NPCs</option>
                            <option value="combat">Combat enemies</option>
                            <option value="old_generic">Old generic</option>
                            <option value="old_preset">Old preset</option>
                            <option value="old_renderer">Old renderer</option>
                            <option value="placeholder">Placeholder</option>
                            <option value="catalog">Catalog model</option>
                            <option value="bespoke">Bespoke model</option>
                        </select>
                        <button class="npc-model-gallery-button" type="button" data-gallery-refresh>Refresh</button>
                        <button class="npc-model-gallery-button" type="button" data-gallery-close>Close</button>
                    </div>
                </header>
                <div class="npc-model-gallery-summary" data-gallery-summary></div>
                <main class="npc-model-gallery-content" data-gallery-content></main>
            </div>
            <div class="npc-model-focus" data-gallery-focus aria-hidden="true">
                <div class="npc-model-focus-shell" role="dialog" aria-modal="true" aria-labelledby="npc-model-focus-title">
                    <header class="npc-model-focus-header">
                        <div class="npc-model-focus-title-wrap">
                            <h3 class="npc-model-focus-title" id="npc-model-focus-title" data-gallery-focus-title>NPC Model</h3>
                            <div class="npc-model-focus-meta" data-gallery-focus-meta></div>
                        </div>
                        <div class="npc-model-gallery-actions">
                            <button class="npc-model-gallery-button" type="button" data-gallery-focus-reset>Reset</button>
                            <button class="npc-model-gallery-button" type="button" data-gallery-focus-close>Close</button>
                        </div>
                    </header>
                    <div class="npc-model-focus-stage">
                        <div class="npc-model-focus-viewport" data-gallery-focus-viewport></div>
                    </div>
                </div>
            </div>
        `;
        panel.addEventListener('mousedown', (event) => {
            if (event.target === panel) closeGallery({ documentRef });
        });
        const closeButton = panel.querySelector('[data-gallery-close]');
        if (closeButton) closeButton.addEventListener('click', () => closeGallery({ documentRef }));
        const focusRoot = panel.querySelector('[data-gallery-focus]');
        if (focusRoot) {
            focusRoot.addEventListener('mousedown', (event) => {
                if (event.target === focusRoot) closeFocusedModelViewer(panel);
            });
        }
        const focusCloseButton = panel.querySelector('[data-gallery-focus-close]');
        if (focusCloseButton) focusCloseButton.addEventListener('click', () => closeFocusedModelViewer(panel));
        const focusResetButton = panel.querySelector('[data-gallery-focus-reset]');
        if (focusResetButton) {
            focusResetButton.addEventListener('click', () => {
                if (activeFocusedViewer && typeof activeFocusedViewer.resetRotation === 'function') {
                    activeFocusedViewer.resetRotation();
                }
            });
        }
        const refreshButton = panel.querySelector('[data-gallery-refresh]');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                closeFocusedModelViewer(panel);
                openGallery({ documentRef, windowRef: getWindowRef(context), forceRefresh: true });
            });
        }
        const filter = panel.querySelector('[data-gallery-filter]');
        if (filter) {
            filter.addEventListener('change', () => {
                const images = panel._npcGalleryImages || Object.create(null);
                renderGalleryEntries(panel, activeEntries, images, filter.value);
            });
        }
        documentRef.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && panel.classList.contains('is-open')) {
                const focusViewer = panel.querySelector('[data-gallery-focus]');
                if (focusViewer && focusViewer.classList.contains('is-open')) {
                    closeFocusedModelViewer(panel);
                    return;
                }
                closeGallery({ documentRef });
            }
        });
        documentRef.body.appendChild(panel);
        return panel;
    }

    function openGallery(context = {}) {
        const panel = ensureGalleryPanel(context);
        if (!panel) return false;
        const filter = panel.querySelector('[data-gallery-filter]');
        panel._npcGalleryWindowRef = getWindowRef(context);
        closeFocusedModelViewer(panel);
        activeEntries = collectNpcModelGalleryEntries(context);
        panel.classList.add('is-open');
        panel.setAttribute('aria-hidden', 'false');
        const images = renderEntryThumbnails(activeEntries, context);
        panel._npcGalleryImages = images;
        renderGalleryEntries(panel, activeEntries, images, filter ? filter.value : 'all');
        return true;
    }

    function maybeOpenGalleryFromUrl() {
        const windowRef = getWindowRef();
        const documentRef = getDocumentRef();
        if (!windowRef.location || !documentRef) return;
        let requested = false;
        try {
            const params = new URLSearchParams(windowRef.location.search || '');
            requested = params.has('npcGallery') || params.has('npcgallery') || params.get('qa') === 'npcgallery';
        } catch (error) {
            requested = false;
        }
        if (requested) windowRef.setTimeout(() => openGallery({ windowRef, documentRef }), 0);
    }

    const api = {
        OLD_MODEL_STATUS_IDS,
        STATUS_META,
        classifyEnemyModel,
        classifyServiceModel,
        collectEnemyEntries,
        collectWorldNpcEntries,
        collectNpcModelGalleryEntries,
        closeFocusedModelViewer,
        closeGallery,
        isOldModelStatus,
        openFocusedModelViewer,
        openGallery,
        renderEntryThumbnails,
        summarizeEntries
    };

    const windowRef = getWindowRef();
    windowRef.NpcModelGalleryRuntime = api;
    windowRef.openNpcModelGallery = function openNpcModelGallery() {
        return openGallery({ windowRef, documentRef: getDocumentRef() });
    };
    if (windowRef.addEventListener) windowRef.addEventListener('load', maybeOpenGalleryFromUrl);
})();
