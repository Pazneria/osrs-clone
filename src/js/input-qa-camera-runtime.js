(function () {
    function getWindowRef(options = {}) {
        return options.windowRef || (typeof window !== 'undefined' ? window : {});
    }

    function getThreeRef(options = {}) {
        return options.THREERef || (typeof THREE !== 'undefined' ? THREE : null);
    }

    function clampNumber(value, min, max, fallback) {
        const n = Number(value);
        if (!Number.isFinite(n)) return fallback;
        return Math.max(min, Math.min(max, n));
    }

    function resolveQaCameraViewState(options = {}) {
        return {
            yaw: Number.isFinite(options.nextYaw) ? Number(options.nextYaw) : options.cameraYaw,
            pitch: clampNumber(options.nextPitch, 0.1, Math.PI - 0.1, options.cameraPitch),
            distance: clampNumber(options.nextDist, 5, 30, options.cameraDist)
        };
    }

    function getDefaultQaCameraViewState() {
        return {
            yaw: Math.PI * 1.25,
            pitch: Math.PI / 3.1,
            distance: 16
        };
    }

    function projectWorldTileToScreen(options = {}, x, y, z = 0, heightOffset = 1.0) {
        const THREERef = getThreeRef(options);
        const windowRef = getWindowRef(options);
        const camera = options.camera || null;
        const mapSize = Number.isFinite(options.mapSize) ? Math.max(1, Math.floor(options.mapSize)) : 1;
        const planes = Number.isFinite(options.planes) ? Math.max(1, Math.floor(options.planes)) : 1;
        if (!THREERef || !camera || typeof options.getVisualHeight !== 'function') return null;

        const gx = Math.max(0, Math.min(mapSize - 1, Math.floor(Number(x) || 0)));
        const gy = Math.max(0, Math.min(mapSize - 1, Math.floor(Number(y) || 0)));
        const gz = Math.max(0, Math.min(planes - 1, Math.floor(Number(z) || 0)));
        if (typeof camera.updateMatrixWorld === 'function') camera.updateMatrixWorld(true);
        const pos = new THREERef.Vector3(
            gx,
            options.getVisualHeight(gx, gy, gz) + (Number.isFinite(heightOffset) ? heightOffset : 1.0),
            gy
        );
        pos.project(camera);
        return {
            x: Math.round((pos.x * 0.5 + 0.5) * windowRef.innerWidth),
            y: Math.round((pos.y * -0.5 + 0.5) * windowRef.innerHeight),
            depth: Number.isFinite(pos.z) ? Number(pos.z.toFixed(4)) : null,
            visible: pos.z < 1 && pos.x >= -1 && pos.x <= 1 && pos.y >= -1 && pos.y <= 1
        };
    }

    function syncQaRenderToPlayerState(options = {}) {
        const THREERef = getThreeRef(options);
        const camera = options.camera || null;
        const playerRig = options.playerRig || null;
        const playerState = options.playerState || null;
        if (!THREERef || !playerRig || !camera || !playerState || typeof options.getVisualHeight !== 'function') return null;

        const cameraYaw = Number.isFinite(options.cameraYaw) ? options.cameraYaw : 0;
        const cameraPitch = Number.isFinite(options.cameraPitch) ? options.cameraPitch : Math.PI / 3.1;
        const cameraDist = Number.isFinite(options.cameraDist) ? options.cameraDist : 16;
        const z = Number.isFinite(playerState.z) ? playerState.z : 0;
        const visualY = options.getVisualHeight(playerState.x, playerState.y, z);
        playerRig.position.set(playerState.x, visualY, playerState.y);
        const cameraFollowY = visualY;
        camera.position.x = playerRig.position.x + cameraDist * Math.cos(cameraYaw) * Math.sin(cameraPitch);
        camera.position.y = cameraFollowY + 1.0 + cameraDist * Math.cos(cameraPitch);
        camera.position.z = playerRig.position.z + cameraDist * Math.sin(cameraYaw) * Math.sin(cameraPitch);
        const followCamGround = typeof options.getGroundHeightAtWorldPos === 'function'
            ? options.getGroundHeightAtWorldPos(camera.position.x, camera.position.z, z)
            : visualY;
        camera.position.y = Math.max(camera.position.y, followCamGround + 0.3);
        camera.lookAt(new THREERef.Vector3(playerRig.position.x, cameraFollowY + 1.0, playerRig.position.z));
        if (typeof camera.updateMatrixWorld === 'function') camera.updateMatrixWorld(true);
        return {
            x: playerState.x,
            y: playerState.y,
            z,
            baseVisualY: visualY,
            cameraX: Number(camera.position.x.toFixed(2)),
            cameraY: Number(camera.position.y.toFixed(2)),
            cameraZ: Number(camera.position.z.toFixed(2))
        };
    }

    window.InputQaCameraRuntime = {
        resolveQaCameraViewState,
        getDefaultQaCameraViewState,
        projectWorldTileToScreen,
        syncQaRenderToPlayerState
    };
})();
