(function () {
    function requireThree(three) {
        if (!three) throw new Error('World water runtime requires THREE.');
        return three;
    }

    function pointInPolygon(points, x, y) {
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const a = points[i];
            const b = points[j];
            if (!a || !b) continue;
            const intersects = ((a.y > y) !== (b.y > y))
                && (x < (((b.x - a.x) * (y - a.y)) / ((b.y - a.y) || 0.00001)) + a.x);
            if (intersects) inside = !inside;
        }
        return inside;
    }

    function waterShapeContains(shape, x, y) {
        if (!shape || !shape.kind) return false;
        if (shape.kind === 'ellipse') {
            if (!Number.isFinite(shape.rx) || !Number.isFinite(shape.ry) || shape.rx <= 0 || shape.ry <= 0) return false;
            const nx = (x - shape.cx) / shape.rx;
            const ny = (y - shape.cy) / shape.ry;
            return ((nx * nx) + (ny * ny)) <= 1.0;
        }
        if (shape.kind === 'box') {
            return x >= shape.xMin && x <= shape.xMax && y >= shape.yMin && y <= shape.yMax;
        }
        if (!Array.isArray(shape.points) || shape.points.length < 3) return false;
        return pointInPolygon(shape.points, x, y);
    }

    function resolveWaterRenderBodyForTile(waterBodies, x, y) {
        if (!Array.isArray(waterBodies)) return null;
        for (let i = waterBodies.length - 1; i >= 0; i--) {
            const body = waterBodies[i];
            if (!body || !body.bounds) continue;
            if (x < body.bounds.xMin || x > body.bounds.xMax || y < body.bounds.yMin || y > body.bounds.yMax) continue;
            if (waterShapeContains(body.shape, x, y)) return body;
        }
        return null;
    }

    function getDefaultWaterRenderBody() {
        return {
            id: 'legacy-water-fallback',
            shoreline: { width: 0.78, foamWidth: 0.34, skirtDepth: 0.18 },
            styleTokens: {
                shallowColor: 0x78b3c4,
                deepColor: 0x3f748d,
                foamColor: 0xe5f6fc,
                shoreColor: 0xd5c393,
                rippleColor: 0xa7e0f0,
                highlightColor: 0xf9ffff,
                opacity: 0.86,
                shoreOpacity: 0.52
            },
            surfaceY: -0.075
        };
    }

    function findNearbyWaterRenderBodyForTile(options = {}) {
        const waterBodies = Array.isArray(options.waterBodies) ? options.waterBodies : [];
        const logicalMap = options.logicalMap || [];
        const MAP_SIZE = options.MAP_SIZE;
        const isWaterTileId = typeof options.isWaterTileId === 'function' ? options.isWaterTileId : () => false;
        const x = options.x;
        const y = options.y;
        const z = options.z;
        const maxRadius = Number.isFinite(options.maxRadius) ? options.maxRadius : 3;
        for (let radius = 1; radius <= maxRadius; radius++) {
            for (let ny = Math.max(0, y - radius); ny <= Math.min(MAP_SIZE - 1, y + radius); ny++) {
                for (let nx = Math.max(0, x - radius); nx <= Math.min(MAP_SIZE - 1, x + radius); nx++) {
                    if (!isWaterTileId(logicalMap[z][ny][nx])) continue;
                    const body = resolveWaterRenderBodyForTile(waterBodies, nx, ny);
                    if (body) return body;
                }
            }
        }
        return null;
    }

    function resolveVisualWaterRenderBodyForTile(options = {}) {
        const waterBodies = Array.isArray(options.waterBodies) ? options.waterBodies : [];
        const logicalMap = options.logicalMap || [];
        const MAP_SIZE = options.MAP_SIZE;
        const isWaterTileId = typeof options.isWaterTileId === 'function' ? options.isWaterTileId : () => false;
        const isPierVisualCoverageTile = typeof options.isPierVisualCoverageTile === 'function'
            ? options.isPierVisualCoverageTile
            : () => false;
        const getActivePierConfig = typeof options.getActivePierConfig === 'function'
            ? options.getActivePierConfig
            : () => null;
        const x = options.x;
        const y = options.y;
        const z = options.z;
        if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) return null;
        const tile = logicalMap[z][y][x];
        const pierCovered = isPierVisualCoverageTile(getActivePierConfig(), x, y, z);
        if (!isWaterTileId(tile) && !pierCovered) return null;

        const directBody = resolveWaterRenderBodyForTile(waterBodies, x, y);
        if (directBody) return directBody;
        if (isWaterTileId(tile)) return getDefaultWaterRenderBody();
        if (pierCovered) {
            return findNearbyWaterRenderBodyForTile({
                waterBodies,
                x,
                y,
                z,
                MAP_SIZE,
                logicalMap,
                isWaterTileId
            }) || getDefaultWaterRenderBody();
        }
        return null;
    }

    function getWaterSurfaceHeightForTile(options = {}) {
        const waterBodies = Array.isArray(options.waterBodies) ? options.waterBodies : [];
        const logicalMap = options.logicalMap || [];
        const MAP_SIZE = options.MAP_SIZE;
        const isWaterTileId = typeof options.isWaterTileId === 'function' ? options.isWaterTileId : () => false;
        const x = options.x;
        const y = options.y;
        const z = options.z;
        if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) return null;
        if (!isWaterTileId(logicalMap[z][y][x])) return null;
        const waterBody = resolveWaterRenderBodyForTile(waterBodies, x, y) || getDefaultWaterRenderBody();
        return Number.isFinite(waterBody.surfaceY) ? waterBody.surfaceY : -0.075;
    }

    function getWaterDepthWeightForTile(tile, TileId) {
        if (tile === TileId.WATER_DEEP) return 1.0;
        if (tile === TileId.WATER_SHALLOW) return 0.36;
        return null;
    }

    function getWaterDepthWeightAtPoint(options = {}) {
        const logicalMap = options.logicalMap || [];
        const MAP_SIZE = options.MAP_SIZE;
        const TileId = options.TileId || {};
        const worldX = options.worldX;
        const worldY = options.worldY;
        const z = options.z;
        const sampleOffsets = [
            { x: -0.24, y: -0.24 },
            { x: 0.24, y: -0.24 },
            { x: 0.24, y: 0.24 },
            { x: -0.24, y: 0.24 }
        ];
        let total = 0;
        let count = 0;
        for (let i = 0; i < sampleOffsets.length; i++) {
            const sample = sampleOffsets[i];
            const gridX = Math.floor(worldX + sample.x + 0.5);
            const gridY = Math.floor(worldY + sample.y + 0.5);
            if (gridX < 0 || gridY < 0 || gridX >= MAP_SIZE || gridY >= MAP_SIZE) continue;
            const weight = getWaterDepthWeightForTile(logicalMap[z][gridY][gridX], TileId);
            if (weight !== null) {
                total += weight;
                count++;
            }
        }
        if (count > 0) return total / count;

        const centerX = Math.floor(worldX + 0.5);
        const centerY = Math.floor(worldY + 0.5);
        for (let radius = 1; radius <= 2; radius++) {
            total = 0;
            count = 0;
            for (let y = Math.max(0, centerY - radius); y <= Math.min(MAP_SIZE - 1, centerY + radius); y++) {
                for (let x = Math.max(0, centerX - radius); x <= Math.min(MAP_SIZE - 1, centerX + radius); x++) {
                    const weight = getWaterDepthWeightForTile(logicalMap[z][y][x], TileId);
                    if (weight === null) continue;
                    total += weight;
                    count++;
                }
            }
            if (count > 0) return total / count;
        }

        return 0.48;
    }

    function distanceToTileRect(worldX, worldY, tileX, tileY) {
        const dx = Math.max(Math.abs(worldX - tileX) - 0.5, 0);
        const dy = Math.max(Math.abs(worldY - tileY) - 0.5, 0);
        return Math.sqrt((dx * dx) + (dy * dy));
    }

    function getWaterShoreStrengthAtPoint(options = {}) {
        const logicalMap = options.logicalMap || [];
        const MAP_SIZE = options.MAP_SIZE;
        const isWaterTileId = typeof options.isWaterTileId === 'function' ? options.isWaterTileId : () => false;
        const isPierVisualCoverageTile = typeof options.isPierVisualCoverageTile === 'function'
            ? options.isPierVisualCoverageTile
            : () => false;
        const getActivePierConfig = typeof options.getActivePierConfig === 'function'
            ? options.getActivePierConfig
            : () => null;
        const worldX = options.worldX;
        const worldY = options.worldY;
        const z = options.z;
        const shorelineWidth = options.shorelineWidth;
        const searchRadius = Math.max(1, Math.ceil(Math.max(0.2, shorelineWidth) + 1));
        const minX = Math.max(0, Math.floor(worldX - searchRadius));
        const maxX = Math.min(MAP_SIZE - 1, Math.ceil(worldX + searchRadius));
        const minY = Math.max(0, Math.floor(worldY - searchRadius));
        const maxY = Math.min(MAP_SIZE - 1, Math.ceil(worldY + searchRadius));
        let minDistance = Math.max(0.2, shorelineWidth);
        const pierConfig = getActivePierConfig();

        for (let tileY = minY; tileY <= maxY; tileY++) {
            for (let tileX = minX; tileX <= maxX; tileX++) {
                if (isWaterTileId(logicalMap[z][tileY][tileX])) continue;
                if (isPierVisualCoverageTile(pierConfig, tileX, tileY, z)) continue;
                minDistance = Math.min(minDistance, distanceToTileRect(worldX, worldY, tileX, tileY));
                if (minDistance <= 0.001) return 1;
            }
        }

        return 1 - Math.min(1, minDistance / Math.max(0.2, shorelineWidth));
    }

    function pushWaterVertex(builder, context, worldX, worldY, surfaceY) {
        builder.surfacePositions.push(worldX, surfaceY, worldY);
        builder.surfaceData.push(
            getWaterDepthWeightAtPoint(Object.assign({}, context, { worldX, worldY, z: builder.z })),
            getWaterShoreStrengthAtPoint(Object.assign({}, context, {
                worldX,
                worldY,
                z: builder.z,
                shorelineWidth: builder.body.shoreline.width
            }))
        );
    }

    function createChunkWaterBuilder(body, z) {
        return {
            body,
            z,
            surfacePositions: [],
            surfaceData: []
        };
    }

    function classifyWaterEdgeType(options = {}) {
        const sharedMaterials = options.sharedMaterials || {};
        const logicalMap = options.logicalMap || [];
        const heightMap = options.heightMap || [];
        const MAP_SIZE = options.MAP_SIZE;
        const isWaterTileId = typeof options.isWaterTileId === 'function' ? options.isWaterTileId : () => false;
        const isPierVisualCoverageTile = typeof options.isPierVisualCoverageTile === 'function'
            ? options.isPierVisualCoverageTile
            : () => false;
        const getActivePierConfig = typeof options.getActivePierConfig === 'function'
            ? options.getActivePierConfig
            : () => null;
        const x = options.x;
        const y = options.y;
        const z = options.z;
        const nx = x + options.dx;
        const ny = y + options.dy;
        const waterSurfaceY = options.waterSurfaceY;
        const planeOffset = z * 3.0;
        if (nx < 0 || ny < 0 || nx >= MAP_SIZE || ny >= MAP_SIZE) {
            return {
                kind: 'outside',
                topY: waterSurfaceY + 0.16
            };
        }

        if (isWaterTileId(logicalMap[z][ny][nx])) return null;
        const waterBodies = Array.isArray(sharedMaterials.activeWaterRenderBodies)
            ? sharedMaterials.activeWaterRenderBodies
            : [];
        if (resolveVisualWaterRenderBodyForTile(Object.assign({}, options, { waterBodies, x: nx, y: ny, z }))) return null;

        const pierConfig = getActivePierConfig();
        if (isPierVisualCoverageTile(pierConfig, nx, ny, z)) {
            return {
                kind: 'structural_cover',
                topY: heightMap[z][ny][nx] + planeOffset
            };
        }

        return {
            kind: 'natural_bank',
            topY: heightMap[z][ny][nx] + planeOffset
        };
    }

    function appendWaterTileToBuilder(builder, context, x, y, surfaceY) {
        const pierConfig = context.getActivePierConfig();
        const isPierCoveredTile = context.isPierVisualCoverageTile(pierConfig, x, y, builder.z);
        const edges = {
            north: classifyWaterEdgeType(Object.assign({}, context, { x, y, dx: 0, dy: -1, z: builder.z, waterSurfaceY: surfaceY })),
            east: classifyWaterEdgeType(Object.assign({}, context, { x, y, dx: 1, dy: 0, z: builder.z, waterSurfaceY: surfaceY })),
            south: classifyWaterEdgeType(Object.assign({}, context, { x, y, dx: 0, dy: 1, z: builder.z, waterSurfaceY: surfaceY })),
            west: classifyWaterEdgeType(Object.assign({}, context, { x, y, dx: -1, dy: 0, z: builder.z, waterSurfaceY: surfaceY }))
        };
        const edgeOverlap = isPierCoveredTile ? 0 : 0.18;

        const northY = (edges.north && edges.north.kind !== 'structural_cover') ? (y - 0.5 - edgeOverlap) : (y - 0.5);
        const eastX = (edges.east && edges.east.kind !== 'structural_cover') ? (x + 0.5 + edgeOverlap) : (x + 0.5);
        const southY = (edges.south && edges.south.kind !== 'structural_cover') ? (y + 0.5 + edgeOverlap) : (y + 0.5);
        const westX = (edges.west && edges.west.kind !== 'structural_cover') ? (x - 0.5 - edgeOverlap) : (x - 0.5);

        const nw = { x: westX, y: northY, h: surfaceY };
        const ne = { x: eastX, y: northY, h: surfaceY };
        const se = { x: eastX, y: southY, h: surfaceY };
        const sw = { x: westX, y: southY, h: surfaceY };

        pushWaterVertex(builder, context, nw.x, nw.y, nw.h);
        pushWaterVertex(builder, context, se.x, se.y, se.h);
        pushWaterVertex(builder, context, ne.x, ne.y, ne.h);
        pushWaterVertex(builder, context, nw.x, nw.y, nw.h);
        pushWaterVertex(builder, context, sw.x, sw.y, sw.h);
        pushWaterVertex(builder, context, se.x, se.y, se.h);
    }

    function appendChunkWaterTilesToBuilders(options = {}) {
        const builders = options.builders || {};
        const bodies = Array.isArray(options.waterBodies) ? options.waterBodies : [];
        const z = options.z;
        const zOffset = Number.isFinite(options.zOffset) ? options.zOffset : 0;
        for (let y = options.startY; y < options.endY; y++) {
            for (let x = options.startX; x < options.endX; x++) {
                const visualBody = resolveVisualWaterRenderBodyForTile(Object.assign({}, options, { waterBodies: bodies, x, y, z }));
                if (!visualBody) continue;
                if (!builders[visualBody.id]) {
                    builders[visualBody.id] = createChunkWaterBuilder(visualBody, z);
                }
                const surfaceY = zOffset + (Number.isFinite(visualBody.surfaceY) ? visualBody.surfaceY : -0.075);
                appendWaterTileToBuilder(builders[visualBody.id], options, x, y, surfaceY);
            }
        }
    }

    function flushChunkWaterBuilders(options = {}) {
        const THREE = requireThree(options.THREE);
        const planeGroup = options.planeGroup;
        const builders = options.builders || {};
        const environmentMeshes = Array.isArray(options.environmentMeshes) ? options.environmentMeshes : null;
        const getWaterSurfaceMaterial = typeof options.getWaterSurfaceMaterial === 'function'
            ? options.getWaterSurfaceMaterial
            : () => null;
        Object.keys(builders).forEach((bodyId) => {
            const builder = builders[bodyId];
            if (!builder) return;

            if (builder.surfacePositions.length > 0) {
                const surfaceGeometry = new THREE.BufferGeometry();
                surfaceGeometry.setAttribute('position', new THREE.Float32BufferAttribute(builder.surfacePositions, 3));
                surfaceGeometry.setAttribute('waterData', new THREE.Float32BufferAttribute(builder.surfaceData, 2));
                surfaceGeometry.computeBoundingSphere();
                const surfaceMesh = new THREE.Mesh(surfaceGeometry, getWaterSurfaceMaterial(builder.body.styleTokens));
                surfaceMesh.userData = { type: 'WATER', z: builder.z, waterBodyId: builder.body.id };
                surfaceMesh.receiveShadow = false;
                surfaceMesh.castShadow = false;
                surfaceMesh.renderOrder = 3;
                if (planeGroup) planeGroup.add(surfaceMesh);
                if (environmentMeshes) environmentMeshes.push(surfaceMesh);
            }

        });
    }

    function createWaterSurfacePatchMesh(options = {}) {
        const THREE = requireThree(options.THREE);
        const bounds = options.bounds;
        const surfaceY = options.surfaceY;
        const styleTokens = options.styleTokens;
        const depthWeight = Number.isFinite(options.depthWeight) ? options.depthWeight : 0.68;
        const shoreStrength = Number.isFinite(options.shoreStrength) ? options.shoreStrength : 0.12;
        const getWaterSurfaceMaterial = typeof options.getWaterSurfaceMaterial === 'function'
            ? options.getWaterSurfaceMaterial
            : () => null;
        if (!bounds || !styleTokens) return null;
        const xMin = Number.isFinite(bounds.xMin) ? bounds.xMin : 0;
        const xMax = Number.isFinite(bounds.xMax) ? bounds.xMax : 0;
        const yMin = Number.isFinite(bounds.yMin) ? bounds.yMin : 0;
        const yMax = Number.isFinite(bounds.yMax) ? bounds.yMax : 0;
        if ((xMax - xMin) <= 0.01 || (yMax - yMin) <= 0.01) return null;

        const positions = [];
        const waterData = [];
        const tileColumns = Math.max(1, Math.round(xMax - xMin));
        const tileRows = Math.max(1, Math.round(yMax - yMin));
        const stepX = (xMax - xMin) / tileColumns;
        const stepY = (yMax - yMin) / tileRows;

        for (let row = 0; row < tileRows; row++) {
            const cellYMin = yMin + (row * stepY);
            const cellYMax = cellYMin + stepY;
            for (let column = 0; column < tileColumns; column++) {
                const cellXMin = xMin + (column * stepX);
                const cellXMax = cellXMin + stepX;
                positions.push(
                    cellXMin, surfaceY, cellYMin,
                    cellXMax, surfaceY, cellYMax,
                    cellXMax, surfaceY, cellYMin,
                    cellXMin, surfaceY, cellYMin,
                    cellXMin, surfaceY, cellYMax,
                    cellXMax, surfaceY, cellYMax
                );
                for (let i = 0; i < 6; i++) {
                    waterData.push(depthWeight, shoreStrength);
                }
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('waterData', new THREE.Float32BufferAttribute(waterData, 2));
        geometry.computeBoundingSphere();

        const mesh = new THREE.Mesh(geometry, getWaterSurfaceMaterial(styleTokens));
        mesh.receiveShadow = false;
        mesh.castShadow = false;
        mesh.renderOrder = 3;
        return mesh;
    }

    window.WorldWaterRuntime = {
        appendChunkWaterTilesToBuilders,
        classifyWaterEdgeType,
        createWaterSurfacePatchMesh,
        findNearbyWaterRenderBodyForTile,
        flushChunkWaterBuilders,
        getDefaultWaterRenderBody,
        getWaterSurfaceHeightForTile,
        resolveVisualWaterRenderBodyForTile,
        resolveWaterRenderBodyForTile
    };
})();
