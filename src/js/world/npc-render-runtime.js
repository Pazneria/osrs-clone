(function () {
    function requireThree(three) {
        if (!three) throw new Error('World NPC render runtime requires THREE.');
        return three;
    }

    function resolveNpcAppearanceId(npc) {
        if (!npc || typeof npc !== 'object') return null;
        const explicitAppearanceId = typeof npc.appearanceId === 'string' ? npc.appearanceId.trim().toLowerCase() : '';
        if (explicitAppearanceId) return explicitAppearanceId;
        const merchantId = typeof npc.merchantId === 'string' ? npc.merchantId.trim().toLowerCase() : '';
        const name = typeof npc.name === 'string' ? npc.name.trim().toLowerCase() : '';
        if (merchantId === 'tanner_rusk' || name === 'tanner rusk') return 'tanner_rusk';
        return null;
    }

    function createNpcInteractionUid(npc, appearanceId) {
        const npcUid = {
            name: npc.name,
            action: npc.action || (npc.name === 'Shopkeeper' ? 'Trade' : (npc.name === 'Banker' ? 'Talk-to' : 'Talk-to'))
        };
        npcUid.gridX = npc.x;
        npcUid.gridY = npc.y;
        if (npc.spawnId) npcUid.spawnId = npc.spawnId;
        if (npc.merchantId) npcUid.merchantId = npc.merchantId;
        if (appearanceId) npcUid.appearanceId = appearanceId;
        if (typeof npc.dialogueId === 'string' && npc.dialogueId.trim()) npcUid.dialogueId = npc.dialogueId.trim();
        if (npc.travelToWorldId) npcUid.travelToWorldId = npc.travelToWorldId;
        if (npc.travelSpawn) npcUid.travelSpawn = Object.assign({}, npc.travelSpawn);
        return npcUid;
    }

    function createNpcRenderData(options = {}) {
        const THREE = requireThree(options.THREE);
        const npc = options.npc;
        const sharedMaterials = options.sharedMaterials || {};
        const heightMap = options.heightMap || [];
        const createHumanoidModel = options.createHumanoidModel;
        const createNpcHumanoidRigFromPreset = options.createNpcHumanoidRigFromPreset;
        const resolveTownNpcDefaultFacingYaw = options.resolveTownNpcDefaultFacingYaw;
        const z = options.z;
        const Z_OFFSET = options.Z_OFFSET;
        if (!npc || typeof npc !== 'object') return null;
        if (typeof createHumanoidModel !== 'function') {
            throw new Error('World NPC render runtime requires createHumanoidModel.');
        }
        const appearanceId = resolveNpcAppearanceId(npc);
        let mesh = null;
        if (appearanceId && typeof createNpcHumanoidRigFromPreset === 'function') {
            mesh = createNpcHumanoidRigFromPreset(appearanceId);
        }
        if (!mesh) mesh = createHumanoidModel(npc.type);

        const visualX = Number.isFinite(npc.visualX) ? npc.visualX : npc.x;
        const visualY = Number.isFinite(npc.visualY) ? npc.visualY : npc.y;
        const fallbackBaseY = heightMap[z] && heightMap[z][npc.y]
            ? heightMap[z][npc.y][npc.x] + Z_OFFSET
            : Z_OFFSET;
        const visualBaseY = Number.isFinite(npc.visualBaseY) ? npc.visualBaseY : fallbackBaseY;
        mesh.position.set(visualX, visualBaseY, visualY);
        mesh.rotation.y = Number.isFinite(npc.visualFacingYaw)
            ? npc.visualFacingYaw
            : (typeof resolveTownNpcDefaultFacingYaw === 'function' ? resolveTownNpcDefaultFacingYaw(npc) : 0);

        const hitbox = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), sharedMaterials.hiddenHitbox);
        hitbox.position.y = 1.0;
        hitbox.userData = {
            type: 'NPC',
            gridX: npc.x,
            gridY: npc.y,
            z,
            name: npc.name,
            uid: createNpcInteractionUid(npc, appearanceId)
        };
        mesh.add(hitbox);

        return {
            appearanceId,
            hitbox,
            mesh
        };
    }

    function appendChunkNpcVisuals(options = {}) {
        const npcsToRender = Array.isArray(options.npcsToRender) ? options.npcsToRender : [];
        const planeGroup = options.planeGroup;
        const environmentMeshes = Array.isArray(options.environmentMeshes) ? options.environmentMeshes : [];
        const renderedNpcActors = Array.isArray(options.renderedNpcActors) ? options.renderedNpcActors : [];
        const startX = options.startX;
        const startY = options.startY;
        const endX = options.endX;
        const endY = options.endY;
        const z = options.z;
        const cx = options.cx;
        const cy = options.cy;
        if (!planeGroup) return;

        npcsToRender.forEach((npc) => {
            if (!npc || npc.x < startX || npc.x >= endX || npc.y < startY || npc.y >= endY || npc.z !== z) return;
            const renderData = createNpcRenderData(Object.assign({}, options, { npc }));
            if (!renderData) return;
            environmentMeshes.push(renderData.hitbox);
            planeGroup.add(renderData.mesh);
            npc.mesh = renderData.mesh;
            npc.hitbox = renderData.hitbox;
            npc.renderChunkKey = `${cx},${cy}`;
            renderedNpcActors.push(npc);
        });
    }

    window.WorldNpcRenderRuntime = {
        appendChunkNpcVisuals,
        createNpcInteractionUid,
        createNpcRenderData,
        resolveNpcAppearanceId
    };
})();
