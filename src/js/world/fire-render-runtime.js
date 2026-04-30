(function () {
    function requireThree(three) {
        if (!three) throw new Error('World fire render runtime requires THREE.');
        return three;
    }

    function createBurningLogMeshes(THREE, fireUserData) {
        const logMat = new THREE.MeshLambertMaterial({ color: 0x4b2e17 });
        const logGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.55, 8);
        logGeo.rotateZ(Math.PI / 2);

        const logA = new THREE.Mesh(logGeo, logMat);
        logA.position.set(0, 0.03, 0.08);
        logA.userData = fireUserData ? Object.assign({}, fireUserData) : {};

        const logB = new THREE.Mesh(logGeo, logMat);
        logB.position.set(0, 0.03, -0.08);
        logB.userData = fireUserData ? Object.assign({}, fireUserData) : {};

        return [logA, logB];
    }

    function createFireVisual(options) {
        const THREE = requireThree(options && options.THREE);
        const x = options.x;
        const y = options.y;
        const z = options.z;
        const terrainHeight = Number.isFinite(options.terrainHeight) ? options.terrainHeight : 0;
        const group = new THREE.Group();
        group.position.set(x, terrainHeight + 0.05, y);

        const fireUserData = { type: 'FIRE', gridX: x, gridY: y, z };
        const logs = createBurningLogMeshes(THREE, fireUserData);
        const flame = new THREE.Mesh(
            new THREE.ConeGeometry(0.16, 0.45, 8),
            new THREE.MeshBasicMaterial({ color: 0xff8a1f, transparent: true, opacity: 0.9 })
        );
        flame.position.set(0, 0.35, 0);
        flame.userData = Object.assign({ flame: true }, fireUserData);

        group.add(logs[0], logs[1], flame);
        return { group, flame, hitMeshes: [logs[0], logs[1], flame] };
    }

    function createFiremakingLogPreview(options) {
        const THREE = requireThree(options && options.THREE);
        const x = options.x;
        const y = options.y;
        const terrainHeight = Number.isFinite(options.terrainHeight) ? options.terrainHeight : 0;
        const itemData = options.itemData || null;
        const getItemIconSpritePath = typeof options.getItemIconSpritePath === 'function'
            ? options.getItemIconSpritePath
            : null;
        const addGroundItemSprite = typeof options.addGroundItemSprite === 'function'
            ? options.addGroundItemSprite
            : null;

        const group = new THREE.Group();
        group.position.set(x, terrainHeight + 0.04, y);

        const spritePath = getItemIconSpritePath ? getItemIconSpritePath(itemData) : null;
        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.18, 0.06, 12),
            new THREE.MeshLambertMaterial({ color: 0x3d2a1c })
        );
        base.position.set(0, -0.05, 0);
        group.add(base);

        if (spritePath && addGroundItemSprite) {
            addGroundItemSprite(group, spritePath, 0.2, 0.5);
        } else {
            const logs = createBurningLogMeshes(THREE, null);
            group.add(logs[0], logs[1]);
        }

        return group;
    }

    function updateFireFlameVisual(fire, frameNow) {
        if (!fire || !fire.flame) return false;
        const t = (frameNow * 0.01) + fire.phase;
        fire.flame.scale.set(
            1.0 + Math.sin(t) * 0.12,
            1.0 + Math.sin(t * 1.8) * 0.18,
            1.0 + Math.cos(t) * 0.12
        );
        fire.flame.material.opacity = 0.75 + (Math.sin(t * 1.3) * 0.12);
        return true;
    }

    window.WorldFireRenderRuntime = {
        createFireVisual,
        createFiremakingLogPreview,
        updateFireFlameVisual
    };
})();
