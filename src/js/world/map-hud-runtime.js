(function () {
    'use strict';

    const WORLD_MAP_LOCKED_CHUNKS = 5;
    const MINIMAP_RENDER_INTERVAL_MS = 75;

    let offscreenMapCanvas = null;
    let offscreenMapCtx = null;
    let isMinimapDragging = false;
    let minimapDragStart = { x: 0, y: 0 };
    let minimapDragEnd = { x: 0, y: 0 };
    let lastMinimapRenderFrameMs = 0;

    const minimapState = {
        zoom: 1,
        locked: true,
        targetX: 0,
        targetY: 0,
        destination: null
    };

    const worldMapState = {
        zoom: 1,
        minZoom: 1,
        maxZoom: 6,
        centerX: null,
        centerY: null,
        isDragging: false,
        dragStartMouseX: 0,
        dragStartMouseY: 0,
        dragStartCenterX: 0,
        dragStartCenterY: 0,
        dragStartSourceSize: 1
    };

    function getDocument(context) {
        return (context && context.document) || window.document;
    }

    function getMapSize(context) {
        return Math.max(1, Math.floor((context && context.mapSize) || 1));
    }

    function getChunkSize(context) {
        return Math.max(1, Math.floor((context && context.chunkSize) || 1));
    }

    function getWorldMapBaseSourceSize(context) {
        return Math.min(getMapSize(context), getChunkSize(context) * WORLD_MAP_LOCKED_CHUNKS);
    }

    function callHook(context, name, fallback) {
        const hook = context && context[name];
        if (typeof hook !== 'function') return fallback;
        return hook();
    }

    function getInputControllerRuntime(context) {
        return (context && context.getInputControllerRuntime && context.getInputControllerRuntime()) || window.InputControllerRuntime || null;
    }

    function getRenderRuntime(context) {
        return (context && context.getRenderRuntime && context.getRenderRuntime()) || window.RenderRuntime || null;
    }

    function getTileIds(context) {
        return (context && context.tileIds) || {};
    }

    function getMinimapState() {
        return {
            zoom: Number.isFinite(minimapState.zoom) ? minimapState.zoom : 1,
            targetX: Number.isFinite(minimapState.targetX) ? minimapState.targetX : 0,
            targetY: Number.isFinite(minimapState.targetY) ? minimapState.targetY : 0,
            locked: minimapState.locked !== false
        };
    }

    function setMinimapState(patch) {
        if (!patch || typeof patch !== 'object') return getMinimapState();
        if (Number.isFinite(patch.zoom)) minimapState.zoom = Math.max(1, Math.min(20, patch.zoom));
        if (typeof patch.locked === 'boolean') minimapState.locked = patch.locked;
        if (Number.isFinite(patch.targetX)) minimapState.targetX = patch.targetX;
        if (Number.isFinite(patch.targetY)) minimapState.targetY = patch.targetY;
        return getMinimapState();
    }

    function resetMinimapState(options = {}) {
        minimapState.zoom = Number.isFinite(options.zoom) ? Math.max(1, Math.min(20, options.zoom)) : 1;
        minimapState.locked = options.locked !== false;
        minimapState.targetX = Number.isFinite(options.targetX) ? options.targetX : 0;
        minimapState.targetY = Number.isFinite(options.targetY) ? options.targetY : 0;
        minimapState.destination = options.destination || null;
        isMinimapDragging = false;
        minimapDragStart = { x: 0, y: 0 };
        minimapDragEnd = { x: 0, y: 0 };
        lastMinimapRenderFrameMs = 0;
        return getMinimapState();
    }

    function setMinimapDestination(gridX, gridY, z) {
        if (!Number.isInteger(gridX) || !Number.isInteger(gridY) || !Number.isInteger(z)) {
            minimapState.destination = null;
            return null;
        }
        minimapState.destination = { x: gridX, y: gridY, z };
        return Object.assign({}, minimapState.destination);
    }

    function clearMinimapDestination() {
        minimapState.destination = null;
    }

    function getMinimapDestination() {
        return minimapState.destination ? Object.assign({}, minimapState.destination) : null;
    }

    function clearMinimapDestinationIfReached(playerState) {
        const destination = minimapState.destination;
        if (!destination || !playerState) return false;
        if (destination.z === playerState.z && destination.x === playerState.x && destination.y === playerState.y) {
            clearMinimapDestination();
            return true;
        }
        return false;
    }

    function syncLockedMinimapTarget(x, y, isFreeCam = false) {
        if (!minimapState.locked || isFreeCam) return false;
        if (Number.isFinite(x)) minimapState.targetX = x;
        if (Number.isFinite(y)) minimapState.targetY = y;
        return true;
    }

    function getPlayerMapPosition(context) {
        const mapSize = getMapSize(context);
        const fallback = { x: mapSize / 2, y: mapSize / 2, z: 0, facingYaw: 0 };
        const position = callHook(context, 'getPlayerMapPosition', fallback) || fallback;
        return {
            x: Number.isFinite(position.x) ? position.x : fallback.x,
            y: Number.isFinite(position.y) ? position.y : fallback.y,
            z: Number.isFinite(position.z) ? position.z : fallback.z,
            facingYaw: Number.isFinite(position.facingYaw) ? position.facingYaw : 0
        };
    }

    function getCurrentPlane(context) {
        const position = getPlayerMapPosition(context);
        return Math.max(0, Math.floor(position.z || 0));
    }

    function getTile(context, x, y, z) {
        if (context && typeof context.getTile === 'function') return context.getTile(x, y, z);
        return null;
    }

    function getVisualTileId(context, tileId, x, y, z) {
        if (context && typeof context.getVisualTileId === 'function') return context.getVisualTileId(tileId, x, y, z);
        return tileId;
    }

    function isTreeTileId(context, tileId) {
        return !!(context && typeof context.isTreeTileId === 'function' && context.isTreeTileId(tileId));
    }

    function isDoorTileId(context, tileId) {
        return !!(context && typeof context.isDoorTileId === 'function' && context.isDoorTileId(tileId));
    }

    function getMapTileColor(context, tile) {
        const TileId = getTileIds(context);
        if (tile === TileId.GRASS) return '#2d4a22';
        if (tile === TileId.DIRT) return '#5f4c32';
        if (isTreeTileId(context, tile)) return '#1e752d';
        if (tile === TileId.ROCK) return '#6b7280';
        if (tile === TileId.FLOOR_WOOD || tile === TileId.SHOP_COUNTER) return '#654321';
        if (tile === TileId.FLOOR_STONE || tile === TileId.STAIRS_RAMP || tile === TileId.SOLID_NPC) return '#666666';
        if (tile === TileId.FLOOR_BRICK) return '#800000';
        if (tile === TileId.BANK_BOOTH) return '#d4af37';
        if (tile === TileId.WALL || tile === TileId.TOWER) return '#4b5563';
        if (tile === TileId.STAIRS_UP) return '#aaaaaa';
        if (tile === TileId.STAIRS_DOWN) return '#444444';
        if (tile === TileId.SHORE) return '#9b8a5f';
        if (tile === TileId.WATER_SHALLOW) return '#2c75a8';
        if (tile === TileId.WATER_DEEP) return '#184b78';
        if (tile === TileId.FENCE) return '#7a5732';
        if (isDoorTileId(context, tile)) return '#8b5a2b';
        return '#2d4a22';
    }

    function updateMinimapCanvas(context = {}) {
        const documentRef = getDocument(context);
        const mapSize = getMapSize(context);
        const TileId = getTileIds(context);
        if (!offscreenMapCanvas) {
            offscreenMapCanvas = documentRef.createElement('canvas');
            offscreenMapCanvas.width = mapSize;
            offscreenMapCanvas.height = mapSize;
            offscreenMapCtx = offscreenMapCanvas.getContext('2d');
        }
        if (offscreenMapCanvas.width !== mapSize || offscreenMapCanvas.height !== mapSize) {
            offscreenMapCanvas.width = mapSize;
            offscreenMapCanvas.height = mapSize;
        }
        offscreenMapCtx.fillStyle = '#000';
        offscreenMapCtx.fillRect(0, 0, mapSize, mapSize);

        const maxPlane = getCurrentPlane(context);
        for (let layer = 0; layer <= maxPlane; layer++) {
            for (let y = 0; y < mapSize; y++) {
                for (let x = 0; x < mapSize; x++) {
                    const tile = getVisualTileId(context, getTile(context, x, y, layer), x, y, layer);
                    if (tile === TileId.GRASS && layer > 0) continue;

                    offscreenMapCtx.fillStyle = getMapTileColor(context, tile);
                    if (tile !== TileId.OBSTACLE && tile !== TileId.GRASS) {
                        offscreenMapCtx.fillRect(x, y, 1, 1);
                    } else if (layer === 0) {
                        offscreenMapCtx.fillRect(x, y, 1, 1);
                    }
                }
            }
        }
        return offscreenMapCanvas;
    }

    function syncWorldMapCanvasSize(canvas) {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const dpr = Number.isFinite(window.devicePixelRatio) ? Math.max(1, window.devicePixelRatio) : 1;
        const nextWidth = Math.max(1, Math.round(rect.width * dpr));
        const nextHeight = Math.max(1, Math.round(rect.height * dpr));
        if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
            canvas.width = nextWidth;
            canvas.height = nextHeight;
        }
    }

    function resolveWorldMapViewport(canvas) {
        const dpr = Number.isFinite(window.devicePixelRatio) ? Math.max(1, window.devicePixelRatio) : 1;
        const pad = Math.max(2, Math.round(4 * dpr));
        const size = Math.max(1, Math.min(canvas.width, canvas.height) - (pad * 2));
        const x = Math.floor((canvas.width - size) / 2);
        const y = Math.floor((canvas.height - size) / 2);
        return { x, y, size };
    }

    function pointInWorldMapViewport(mouseX, mouseY, viewport) {
        if (!viewport) return false;
        return mouseX >= viewport.x
            && mouseY >= viewport.y
            && mouseX <= (viewport.x + viewport.size)
            && mouseY <= (viewport.y + viewport.size);
    }

    function getWorldMapSourceSizeForZoom(zoomValue, context) {
        const safeZoom = Number.isFinite(zoomValue)
            ? Math.max(worldMapState.minZoom, Math.min(worldMapState.maxZoom, zoomValue))
            : worldMapState.minZoom;
        return Math.max(1, getWorldMapBaseSourceSize(context) / safeZoom);
    }

    function canPanWorldMap(sourceSize = null, context = {}) {
        const resolvedSourceSize = Number.isFinite(sourceSize)
            ? sourceSize
            : getWorldMapSourceSizeForZoom(worldMapState.zoom, context);
        return resolvedSourceSize < (getMapSize(context) - 0.001);
    }

    function clampWorldMapCenter(center, sourceSize, context) {
        const mapSize = getMapSize(context);
        if (!Number.isFinite(center)) return mapSize / 2;
        if (!Number.isFinite(sourceSize) || sourceSize >= mapSize) return mapSize / 2;
        const half = sourceSize / 2;
        return Math.max(half, Math.min(mapSize - half, center));
    }

    function ensureWorldMapCenter(context) {
        const mapSize = getMapSize(context);
        if (!Number.isFinite(worldMapState.centerX) || !Number.isFinite(worldMapState.centerY)) {
            const focus = callHook(context, 'getWorldMapInitialCenter', null);
            const player = getPlayerMapPosition(context);
            const centerX = focus && Number.isFinite(focus.x) ? focus.x : player.x + 0.5;
            const centerY = focus && Number.isFinite(focus.y) ? focus.y : player.y + 0.5;
            worldMapState.centerX = Math.max(0, Math.min(mapSize, centerX));
            worldMapState.centerY = Math.max(0, Math.min(mapSize, centerY));
        }
    }

    function getWorldMapSourceRect(context = {}) {
        const safeZoom = Number.isFinite(worldMapState.zoom)
            ? Math.max(worldMapState.minZoom, Math.min(worldMapState.maxZoom, worldMapState.zoom))
            : worldMapState.minZoom;
        worldMapState.zoom = safeZoom;
        ensureWorldMapCenter(context);

        const sourceSize = getWorldMapSourceSizeForZoom(safeZoom, context);
        worldMapState.centerX = clampWorldMapCenter(worldMapState.centerX, sourceSize, context);
        worldMapState.centerY = clampWorldMapCenter(worldMapState.centerY, sourceSize, context);
        const sourceX = worldMapState.centerX - (sourceSize / 2);
        const sourceY = worldMapState.centerY - (sourceSize / 2);
        return { sourceX, sourceY, sourceSize, centerX: worldMapState.centerX, centerY: worldMapState.centerY };
    }

    function screenToWorldMap(mouseX, mouseY, viewport, sourceRect) {
        const ratioX = (mouseX - viewport.x) / viewport.size;
        const ratioY = (mouseY - viewport.y) / viewport.size;
        return {
            ratioX,
            ratioY,
            worldX: sourceRect.sourceX + (ratioX * sourceRect.sourceSize),
            worldY: sourceRect.sourceY + (ratioY * sourceRect.sourceSize)
        };
    }

    function setWorldMapZoom(nextZoom, anchor = null, context = {}) {
        const oldRect = getWorldMapSourceRect(context);
        const resolvedZoom = Math.max(worldMapState.minZoom, Math.min(worldMapState.maxZoom, nextZoom));
        if (!Number.isFinite(resolvedZoom) || Math.abs(resolvedZoom - worldMapState.zoom) < 0.0001) return;

        if (anchor && pointInWorldMapViewport(anchor.mouseX, anchor.mouseY, anchor.viewport)) {
            const mapped = screenToWorldMap(anchor.mouseX, anchor.mouseY, anchor.viewport, oldRect);
            worldMapState.zoom = resolvedZoom;
            const newSourceSize = getWorldMapSourceSizeForZoom(resolvedZoom, context);
            const sourceX = mapped.worldX - (mapped.ratioX * newSourceSize);
            const sourceY = mapped.worldY - (mapped.ratioY * newSourceSize);
            worldMapState.centerX = sourceX + (newSourceSize / 2);
            worldMapState.centerY = sourceY + (newSourceSize / 2);
        } else {
            worldMapState.zoom = resolvedZoom;
        }

        getWorldMapSourceRect(context);
    }

    function updateWorldMapCursor(worldMapCanvas, context = {}) {
        if (!worldMapCanvas) return;
        if (worldMapState.isDragging) {
            worldMapCanvas.style.cursor = 'grabbing';
        } else if (canPanWorldMap(null, context)) {
            worldMapCanvas.style.cursor = 'grab';
        } else {
            worldMapCanvas.style.cursor = 'default';
        }
    }

    function resolveRenderWorldId(context) {
        const worldId = callHook(context, 'resolveRenderWorldId', null);
        return typeof worldId === 'string' && worldId ? worldId : 'main_overworld';
    }

    function buildHudRenderSnapshot(context = {}) {
        const runtime = getRenderRuntime(context);
        const player = getPlayerMapPosition(context);
        const clickMarkerEntries = callHook(context, 'getClickMarkers', []) || [];
        const groundItemEntries = callHook(context, 'getGroundItems', []) || [];
        const destination = getMinimapDestination();
        const minimapDestination = destination
            && Number.isFinite(destination.x)
            && Number.isFinite(destination.y)
            && Number.isFinite(destination.z)
            ? { x: destination.x, y: destination.y, z: destination.z }
            : null;
        const options = {
            worldId: resolveRenderWorldId(context),
            player,
            clickMarkers: clickMarkerEntries,
            groundItems: groundItemEntries,
            minimapDestination
        };

        if (runtime && typeof runtime.buildRenderSnapshot === 'function') {
            return runtime.buildRenderSnapshot(options);
        }
        return options;
    }

    function initWorldMapPanel(context = {}) {
        const documentRef = getDocument(context);
        const worldMapCanvas = documentRef.getElementById('world-map-canvas');
        if (!worldMapCanvas || worldMapCanvas.dataset.bound === '1') return;
        worldMapCanvas.dataset.bound = '1';
        updateWorldMapCursor(worldMapCanvas, context);

        worldMapCanvas.addEventListener('contextmenu', (event) => event.preventDefault());
        worldMapCanvas.addEventListener('wheel', (event) => {
            const rect = worldMapCanvas.getBoundingClientRect();
            const scaleX = worldMapCanvas.width / rect.width;
            const scaleY = worldMapCanvas.height / rect.height;
            const mouseX = (event.clientX - rect.left) * scaleX;
            const mouseY = (event.clientY - rect.top) * scaleY;
            const viewport = resolveWorldMapViewport(worldMapCanvas);
            if (!pointInWorldMapViewport(mouseX, mouseY, viewport)) return;
            event.preventDefault();

            const inputRuntime = getInputControllerRuntime(context);
            const nextZoom = inputRuntime && typeof inputRuntime.resolveZoomFactor === 'function'
                ? inputRuntime.resolveZoomFactor(worldMapState.zoom, event.deltaY, {
                    factor: 1.2,
                    min: worldMapState.minZoom,
                    max: worldMapState.maxZoom
                })
                : (worldMapState.zoom * (event.deltaY < 0 ? 1.2 : (1 / 1.2)));
            setWorldMapZoom(nextZoom, { mouseX, mouseY, viewport }, context);
            updateWorldMapCursor(worldMapCanvas, context);
        });
        worldMapCanvas.addEventListener('mousedown', (event) => {
            if (event.button !== 0) return;
            const sourceRect = getWorldMapSourceRect(context);
            if (!canPanWorldMap(sourceRect.sourceSize, context)) return;

            const rect = worldMapCanvas.getBoundingClientRect();
            const scaleX = worldMapCanvas.width / rect.width;
            const scaleY = worldMapCanvas.height / rect.height;
            const mouseX = (event.clientX - rect.left) * scaleX;
            const mouseY = (event.clientY - rect.top) * scaleY;
            const viewport = resolveWorldMapViewport(worldMapCanvas);
            if (!pointInWorldMapViewport(mouseX, mouseY, viewport)) return;

            worldMapState.isDragging = true;
            worldMapState.dragStartMouseX = mouseX;
            worldMapState.dragStartMouseY = mouseY;
            worldMapState.dragStartCenterX = sourceRect.centerX;
            worldMapState.dragStartCenterY = sourceRect.centerY;
            worldMapState.dragStartSourceSize = sourceRect.sourceSize;
            updateWorldMapCursor(worldMapCanvas, context);
            event.preventDefault();
        });
        worldMapCanvas.addEventListener('mousemove', (event) => {
            if (!worldMapState.isDragging) return;

            const rect = worldMapCanvas.getBoundingClientRect();
            const scaleX = worldMapCanvas.width / rect.width;
            const scaleY = worldMapCanvas.height / rect.height;
            const mouseX = (event.clientX - rect.left) * scaleX;
            const mouseY = (event.clientY - rect.top) * scaleY;
            const viewport = resolveWorldMapViewport(worldMapCanvas);
            const inputRuntime = getInputControllerRuntime(context);
            if (inputRuntime && typeof inputRuntime.resolveWorldMapDragCenter === 'function') {
                const nextCenter = inputRuntime.resolveWorldMapDragCenter({
                    dragStartCenterX: worldMapState.dragStartCenterX,
                    dragStartCenterY: worldMapState.dragStartCenterY,
                    dragStartMouseX: worldMapState.dragStartMouseX,
                    dragStartMouseY: worldMapState.dragStartMouseY,
                    dragStartSourceSize: worldMapState.dragStartSourceSize,
                    viewportSize: viewport.size,
                    mouseX,
                    mouseY
                });
                worldMapState.centerX = nextCenter.centerX;
                worldMapState.centerY = nextCenter.centerY;
            } else {
                const tilesPerPixel = worldMapState.dragStartSourceSize / Math.max(1, viewport.size);
                worldMapState.centerX = worldMapState.dragStartCenterX - ((mouseX - worldMapState.dragStartMouseX) * tilesPerPixel);
                worldMapState.centerY = worldMapState.dragStartCenterY - ((mouseY - worldMapState.dragStartMouseY) * tilesPerPixel);
            }
            getWorldMapSourceRect(context);
        });

        const stopDrag = () => {
            if (!worldMapState.isDragging) return;
            worldMapState.isDragging = false;
            updateWorldMapCursor(worldMapCanvas, context);
        };
        worldMapCanvas.addEventListener('mouseup', (event) => {
            if (event.button === 0) stopDrag();
        });
        worldMapCanvas.addEventListener('mouseleave', stopDrag);
    }

    function updateWorldMapPanel(forceCenterOnPlayer = false, context = {}) {
        const documentRef = getDocument(context);
        const panel = documentRef.getElementById('world-map-panel');
        if (!panel || panel.classList.contains('hidden')) {
            worldMapState.isDragging = false;
            return;
        }
        const worldMapCanvas = documentRef.getElementById('world-map-canvas');
        if (!worldMapCanvas) return;
        if (!offscreenMapCanvas) updateMinimapCanvas(context);
        syncWorldMapCanvasSize(worldMapCanvas);
        if (forceCenterOnPlayer) {
            worldMapState.isDragging = false;
            worldMapState.centerX = null;
            worldMapState.centerY = null;
        }

        const ctx = worldMapCanvas.getContext('2d');
        const viewport = resolveWorldMapViewport(worldMapCanvas);
        const sourceRect = getWorldMapSourceRect(context);
        const renderSnapshot = buildHudRenderSnapshot(context);
        const renderRuntime = getRenderRuntime(context);
        const worldMapSnapshot = renderRuntime && typeof renderRuntime.buildWorldMapSnapshot === 'function'
            ? renderRuntime.buildWorldMapSnapshot({
                snapshot: renderSnapshot,
                viewport,
                sourceRect,
                zoom: worldMapState.zoom
            })
            : null;

        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#090b0d';
        ctx.fillRect(0, 0, worldMapCanvas.width, worldMapCanvas.height);
        ctx.drawImage(
            offscreenMapCanvas,
            sourceRect.sourceX,
            sourceRect.sourceY,
            sourceRect.sourceSize,
            sourceRect.sourceSize,
            viewport.x,
            viewport.y,
            viewport.size,
            viewport.size
        );

        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(viewport.x + 0.5, viewport.y + 0.5, viewport.size - 1, viewport.size - 1);

        ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
        const worldMapMarkers = worldMapSnapshot ? worldMapSnapshot.clickMarkers : [];
        worldMapMarkers.forEach((marker) => {
            ctx.fillRect(marker.x - (marker.size / 2), marker.y - (marker.size / 2), marker.size, marker.size);
        });

        ctx.fillStyle = '#ff00aa';
        const worldMapItems = worldMapSnapshot ? worldMapSnapshot.groundItems : [];
        worldMapItems.forEach((item) => {
            ctx.fillRect(item.x - (item.size / 2), item.y - (item.size / 2), item.size, item.size);
        });

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(
            worldMapSnapshot ? worldMapSnapshot.playerDot.x : 0,
            worldMapSnapshot ? worldMapSnapshot.playerDot.y : 0,
            worldMapSnapshot ? worldMapSnapshot.playerDot.radius : 0,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.strokeStyle = '#ff2f2f';
        ctx.lineWidth = worldMapSnapshot ? worldMapSnapshot.facingLine.lineWidth : 1.5;
        ctx.beginPath();
        ctx.moveTo(
            worldMapSnapshot ? worldMapSnapshot.facingLine.fromX : 0,
            worldMapSnapshot ? worldMapSnapshot.facingLine.fromY : 0
        );
        ctx.lineTo(
            worldMapSnapshot ? worldMapSnapshot.facingLine.toX : 0,
            worldMapSnapshot ? worldMapSnapshot.facingLine.toY : 0
        );
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 230, 176, 0.95)';
        ctx.font = 'bold 12px monospace';
        ctx.textBaseline = 'top';
        ctx.fillText(worldMapSnapshot ? worldMapSnapshot.zoomLabel : `Zoom x${worldMapState.zoom.toFixed(2)}`, viewport.x + 6, viewport.y + 6);
        updateWorldMapCursor(worldMapCanvas, context);
    }

    function initMinimap(context = {}) {
        updateMinimapCanvas(context);
        initWorldMapPanel(context);
        const documentRef = getDocument(context);
        const minimapCanvas = documentRef.getElementById('minimap');
        if (!minimapCanvas || minimapCanvas.dataset.bound === '1') return;
        minimapCanvas.dataset.bound = '1';
        minimapCanvas.addEventListener('contextmenu', (event) => event.preventDefault());
        minimapCanvas.addEventListener('wheel', (event) => {
            event.preventDefault();
            const state = getMinimapState();
            const inputRuntime = getInputControllerRuntime(context);
            const zoom = inputRuntime && typeof inputRuntime.resolveZoomStep === 'function'
                ? inputRuntime.resolveZoomStep(state.zoom, event.deltaY, { step: -0.2, min: 1.0, max: 20.0 })
                : Math.max(1.0, Math.min(20.0, state.zoom + (Math.sign(event.deltaY) * -0.2)));
            setMinimapState({ zoom });
        });
        minimapCanvas.addEventListener('mousedown', (event) => {
            const rect = minimapCanvas.getBoundingClientRect();
            const scaleX = minimapCanvas.width / rect.width;
            const scaleY = minimapCanvas.height / rect.height;
            const mouseX = (event.clientX - rect.left) * scaleX;
            const mouseY = (event.clientY - rect.top) * scaleY;
            if (event.button === 2) {
                isMinimapDragging = true;
                minimapDragStart = { x: mouseX, y: mouseY };
                minimapDragEnd = { x: mouseX, y: mouseY };
            } else if (event.button === 0) {
                const selected = callHook(context, 'getSelectedUseItem', null);
                if (selected) {
                    if (context && typeof context.clearSelectedUse === 'function') context.clearSelectedUse();
                    return;
                }
                const state = getMinimapState();
                const inputRuntime = getInputControllerRuntime(context);
                const walkTarget = inputRuntime && typeof inputRuntime.resolveMinimapWalkTarget === 'function'
                    ? inputRuntime.resolveMinimapWalkTarget({
                        mouseX,
                        mouseY,
                        canvasSize: minimapCanvas.width,
                        targetX: state.targetX,
                        targetY: state.targetY,
                        zoom: state.zoom
                    })
                    : null;
                const gridX = walkTarget ? walkTarget.gridX : Math.floor(state.targetX + 0.5 + (mouseX - (minimapCanvas.width / 2)) / ((minimapCanvas.width / 100) * state.zoom));
                const gridY = walkTarget ? walkTarget.gridY : Math.floor(state.targetY + 0.5 + (mouseY - (minimapCanvas.width / 2)) / ((minimapCanvas.width / 100) * state.zoom));
                const mapSize = getMapSize(context);
                const plane = getCurrentPlane(context);
                if (gridX >= 0 && gridX < mapSize && gridY >= 0 && gridY < mapSize) {
                    const walkable = context && typeof context.isWalkableTile === 'function'
                        ? context.isWalkableTile(gridX, gridY, plane)
                        : false;
                    if (walkable && context && typeof context.queueWalk === 'function') context.queueWalk(gridX, gridY);
                }
            }
        });
        minimapCanvas.addEventListener('mousemove', (event) => {
            if (!isMinimapDragging) return;
            const rect = minimapCanvas.getBoundingClientRect();
            minimapDragEnd.x = (event.clientX - rect.left) * (minimapCanvas.width / rect.width);
            minimapDragEnd.y = (event.clientY - rect.top) * (minimapCanvas.height / rect.height);
        });
        minimapCanvas.addEventListener('mouseup', (event) => {
            if (event.button === 2 && isMinimapDragging) {
                isMinimapDragging = false;
                const state = getMinimapState();
                const inputRuntime = getInputControllerRuntime(context);
                if (inputRuntime && typeof inputRuntime.resolveMinimapDragResolution === 'function') {
                    const resolution = inputRuntime.resolveMinimapDragResolution({
                        canvasSize: minimapCanvas.width,
                        zoom: state.zoom,
                        targetX: state.targetX,
                        targetY: state.targetY,
                        dragStart: minimapDragStart,
                        dragEnd: minimapDragEnd
                    });
                    setMinimapState({
                        targetX: resolution.targetX,
                        targetY: resolution.targetY,
                        zoom: resolution.zoom,
                        locked: resolution.minimapLocked
                    });
                } else {
                    const dx = minimapDragEnd.x - minimapDragStart.x;
                    const dy = minimapDragEnd.y - minimapDragStart.y;
                    if (Math.sqrt(dx * dx + dy * dy) < 5) {
                        setMinimapState({ locked: true, zoom: 1.0 });
                    } else {
                        const canvasCenter = minimapCanvas.width / 2;
                        const ppt = (minimapCanvas.width / 100) * state.zoom;
                        setMinimapState({
                            targetX: state.targetX + (((minimapDragStart.x + minimapDragEnd.x) / 2) - canvasCenter) / ppt,
                            targetY: state.targetY + (((minimapDragStart.y + minimapDragEnd.y) / 2) - canvasCenter) / ppt,
                            locked: false,
                            zoom: Math.max(1.0, Math.min(20.0, state.zoom * (minimapCanvas.width / Math.max(Math.abs(dx), Math.abs(dy)))))
                        });
                    }
                }
            }
        });
        minimapCanvas.addEventListener('mouseleave', () => {
            isMinimapDragging = false;
        });
    }

    function updateMinimap(frameNowMs = performance.now(), forceRender = false, context = {}) {
        const documentRef = getDocument(context);
        const worldMapPanel = documentRef.getElementById('world-map-panel');
        const worldMapOpen = !!(worldMapPanel && !worldMapPanel.classList.contains('hidden'));
        const interactiveRender = forceRender || isMinimapDragging || worldMapState.isDragging || worldMapOpen;
        const resolvedFrameNowMs = Number.isFinite(frameNowMs) ? frameNowMs : performance.now();
        if (!interactiveRender && (resolvedFrameNowMs - lastMinimapRenderFrameMs) < MINIMAP_RENDER_INTERVAL_MS) return;
        lastMinimapRenderFrameMs = resolvedFrameNowMs;

        const canvas = documentRef.getElementById('minimap');
        if (!canvas) return;
        if (!offscreenMapCanvas) updateMinimapCanvas(context);
        const ctx = canvas.getContext('2d');
        const state = getMinimapState();
        const renderSnapshot = buildHudRenderSnapshot(context);
        const renderRuntime = getRenderRuntime(context);
        const player = getPlayerMapPosition(context);
        const minimapSnapshot = renderRuntime && typeof renderRuntime.buildMinimapSnapshot === 'function'
            ? renderRuntime.buildMinimapSnapshot({
                snapshot: renderSnapshot,
                canvasSize: canvas.width,
                zoom: state.zoom,
                targetX: state.targetX,
                targetY: state.targetY,
                isDragging: isMinimapDragging,
                dragStart: minimapDragStart,
                dragEnd: minimapDragEnd
            })
            : null;
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const canvasCenter = minimapSnapshot ? minimapSnapshot.canvasCenter : (canvas.width / 2);
        const ppt = minimapSnapshot ? minimapSnapshot.pixelsPerTile : ((canvas.width / 100) * state.zoom);
        ctx.save();
        ctx.translate(canvasCenter, canvasCenter);
        ctx.scale(ppt, ppt);
        ctx.translate(-state.targetX - 0.5, -state.targetY - 0.5);
        ctx.drawImage(offscreenMapCanvas, 0, 0);

        ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
        const minimapMarkers = minimapSnapshot ? minimapSnapshot.clickMarkers : [];
        minimapMarkers.forEach((marker) => {
            ctx.fillRect(marker.x, marker.y, marker.size, marker.size);
        });
        ctx.fillStyle = '#ff00aa';
        const minimapItems = minimapSnapshot ? minimapSnapshot.groundItems : [];
        minimapItems.forEach((item) => {
            ctx.fillRect(item.x, item.y, item.size, item.size);
        });

        if (minimapSnapshot && minimapSnapshot.destinationFlag) {
            const flag = minimapSnapshot.destinationFlag;
            ctx.strokeStyle = '#3a2a1b';
            ctx.lineWidth = flag.lineWidth;
            ctx.beginPath();
            ctx.moveTo(flag.x, flag.poleBottomY);
            ctx.lineTo(flag.x, flag.poleTopY);
            ctx.stroke();

            ctx.fillStyle = '#ff4b4b';
            ctx.beginPath();
            ctx.moveTo(flag.x, flag.poleTopY);
            ctx.lineTo(flag.x + flag.flagWidth, flag.poleTopY + (flag.flagHeight * 0.5));
            ctx.lineTo(flag.x, flag.poleTopY + flag.flagHeight);
            ctx.closePath();
            ctx.fill();
        }

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(minimapSnapshot ? minimapSnapshot.playerDot.x : (player.x + 0.5), minimapSnapshot ? minimapSnapshot.playerDot.y : (player.y + 0.5), minimapSnapshot ? minimapSnapshot.playerDot.radius : (3 / ppt), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = minimapSnapshot ? minimapSnapshot.facingLine.lineWidth : (2 / ppt);
        ctx.beginPath();
        ctx.moveTo(minimapSnapshot ? minimapSnapshot.facingLine.fromX : (player.x + 0.5), minimapSnapshot ? minimapSnapshot.facingLine.fromY : (player.y + 0.5));
        ctx.lineTo(minimapSnapshot ? minimapSnapshot.facingLine.toX : (player.x + 0.5 + Math.sin(player.facingYaw) * (8 / ppt)), minimapSnapshot ? minimapSnapshot.facingLine.toY : (player.y + 0.5 + Math.cos(player.facingYaw) * (8 / ppt)));
        ctx.stroke();
        ctx.restore();
        if (minimapSnapshot && minimapSnapshot.dragRect) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(minimapSnapshot.dragRect.x, minimapSnapshot.dragRect.y, minimapSnapshot.dragRect.w, minimapSnapshot.dragRect.h);
            ctx.strokeRect(minimapSnapshot.dragRect.x, minimapSnapshot.dragRect.y, minimapSnapshot.dragRect.w, minimapSnapshot.dragRect.h);
        }
        if (worldMapOpen || worldMapState.isDragging) updateWorldMapPanel(false, context);
    }

    function resetWorldMapState(context = {}) {
        worldMapState.zoom = 1;
        worldMapState.centerX = null;
        worldMapState.centerY = null;
        worldMapState.isDragging = false;
        worldMapState.dragStartSourceSize = getWorldMapBaseSourceSize(context);
        isMinimapDragging = false;
        minimapDragStart = { x: 0, y: 0 };
        minimapDragEnd = { x: 0, y: 0 };
        lastMinimapRenderFrameMs = 0;
    }

    window.WorldMapHudRuntime = {
        updateMinimapCanvas,
        buildHudRenderSnapshot,
        initWorldMapPanel,
        updateWorldMapPanel,
        initMinimap,
        updateMinimap,
        resetWorldMapState,
        getMinimapState,
        setMinimapState,
        resetMinimapState,
        setMinimapDestination,
        clearMinimapDestination,
        getMinimapDestination,
        clearMinimapDestinationIfReached,
        syncLockedMinimapTarget,
        getWorldMapSourceRect,
        resolveWorldMapViewport,
        getOffscreenMapCanvas: () => offscreenMapCanvas,
        isWorldMapDragging: () => !!worldMapState.isDragging
    };
})();
