(function () {
    function requireThree(three) {
        if (!three) throw new Error('World chunk terrain runtime requires THREE.');
        return three;
    }

    function sampleTerrainUvWarp(sampleFractalNoise2D, worldX, worldY, seed) {
        if (typeof sampleFractalNoise2D !== 'function') return 0;
        return (sampleFractalNoise2D(worldX * 0.035, worldY * 0.035, seed, 3, 2.0, 0.56) - 0.5) * 0.09;
    }

    function applyWorldSpaceTerrainUvs(geometry, startX, startY, segments, chunkSize, sampleFractalNoise2D) {
        const uvs = geometry && geometry.attributes ? geometry.attributes.uv : null;
        if (!uvs || !Number.isFinite(segments) || segments <= 0 || !Number.isFinite(chunkSize) || chunkSize <= 0) return;
        for (let vy = 0; vy <= segments; vy++) {
            for (let vx = 0; vx <= segments; vx++) {
                const idx = (vy * (segments + 1)) + vx;
                const worldX = startX - 0.5 + ((vx / segments) * chunkSize);
                const worldY = startY - 0.5 + ((vy / segments) * chunkSize);
                const warpU = sampleTerrainUvWarp(sampleFractalNoise2D, worldX + 31.7, worldY - 14.3, 173.41);
                const warpV = sampleTerrainUvWarp(sampleFractalNoise2D, worldX - 48.9, worldY + 22.5, 281.73);
                uvs.setXY(idx, (worldX / chunkSize) + warpU, (worldY / chunkSize) + warpV);
            }
        }
        uvs.needsUpdate = true;
    }

    function applyWorldSpaceLinearTerrainUvs(geometry, startX, startY, segments, chunkSize) {
        const uvs = geometry && geometry.attributes ? geometry.attributes.uv : null;
        if (!uvs || !Number.isFinite(segments) || segments <= 0 || !Number.isFinite(chunkSize) || chunkSize <= 0) return;
        for (let vy = 0; vy <= segments; vy++) {
            for (let vx = 0; vx <= segments; vx++) {
                const idx = (vy * (segments + 1)) + vx;
                const worldX = startX - 0.5 + ((vx / segments) * chunkSize);
                const worldY = startY - 0.5 + ((vy / segments) * chunkSize);
                uvs.setXY(idx, worldX / chunkSize, worldY / chunkSize);
            }
        }
        uvs.needsUpdate = true;
    }

    function collapseTerrainGeometryDrawGroups(geometry, indexCount) {
        if (!geometry || typeof geometry.clearGroups !== 'function' || typeof geometry.addGroup !== 'function') return;
        geometry.clearGroups();
        if (Number.isFinite(indexCount) && indexCount > 0) {
            geometry.addGroup(0, indexCount, 0);
        }
    }

    function hash01(x, y, seed = 0) {
        const value = Math.sin((x * 127.1) + (y * 311.7) + (seed * 74.7)) * 43758.5453123;
        return value - Math.floor(value);
    }

    function clampValue(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function smoothstep(edge0, edge1, value) {
        if (edge0 === edge1) return value < edge0 ? 0 : 1;
        const t = clampValue((value - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3 - (2 * t));
    }

    function terrainPointInPolygon(points, x, y) {
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

    function terrainWaterShapeContains(shape, x, y, inset = 0) {
        if (!shape || !shape.kind) return false;
        if (shape.kind === 'ellipse') {
            if (!Number.isFinite(shape.rx) || !Number.isFinite(shape.ry) || shape.rx <= 0 || shape.ry <= 0) return false;
            const rotation = Number.isFinite(shape.rotationRadians) ? Number(shape.rotationRadians) : 0;
            const dx = x - shape.cx;
            const dy = y - shape.cy;
            const cos = Math.cos(rotation);
            const sin = Math.sin(rotation);
            const localX = (dx * cos) + (dy * sin);
            const localY = (-dx * sin) + (dy * cos);
            const rx = Math.max(0.01, shape.rx + inset);
            const ry = Math.max(0.01, shape.ry + inset);
            const nx = localX / rx;
            const ny = localY / ry;
            return ((nx * nx) + (ny * ny)) <= 1.0;
        }
        if (shape.kind === 'box') {
            return x >= shape.xMin - inset && x <= shape.xMax + inset && y >= shape.yMin - inset && y <= shape.yMax + inset;
        }
        if (!Array.isArray(shape.points) || shape.points.length < 3) return false;
        return terrainPointInPolygon(shape.points, x, y);
    }

    function terrainPointToSegmentDistance(px, py, ax, ay, bx, by) {
        const vx = bx - ax;
        const vy = by - ay;
        const lenSq = (vx * vx) + (vy * vy);
        if (lenSq <= 0.0001) return Math.hypot(px - ax, py - ay);
        const t = clampValue((((px - ax) * vx) + ((py - ay) * vy)) / lenSq, 0, 1);
        const cx = ax + (vx * t);
        const cy = ay + (vy * t);
        return Math.hypot(px - cx, py - cy);
    }

    function distanceToTerrainPolygonEdge(points, x, y) {
        if (!Array.isArray(points) || points.length < 2) return Infinity;
        let best = Infinity;
        for (let i = 0; i < points.length; i++) {
            const a = points[i];
            const b = points[(i + 1) % points.length];
            if (!a || !b) continue;
            best = Math.min(best, terrainPointToSegmentDistance(x, y, a.x, a.y, b.x, b.y));
        }
        return best;
    }

    function getIslandWaterLandPolygon(islandWater) {
        const points = islandWater && islandWater.enabled !== false && Array.isArray(islandWater.landPolygon)
            ? islandWater.landPolygon
            : [];
        const safePoints = points.filter((point) => point && Number.isFinite(point.x) && Number.isFinite(point.y));
        return safePoints.length >= 3 ? safePoints : [];
    }

    function isInsideIslandLandPolygon(islandWater, x, y) {
        const points = getIslandWaterLandPolygon(islandWater);
        return points.length >= 3 && terrainPointInPolygon(points, x, y);
    }

    function sampleIslandCoastTerrainBlend(islandWater, sampleFractalNoise2D, worldX, worldY) {
        const points = getIslandWaterLandPolygon(islandWater);
        if (points.length < 3 || !terrainPointInPolygon(points, worldX, worldY)) return 0;
        const distance = distanceToTerrainPolygonEdge(points, worldX, worldY);
        if (!Number.isFinite(distance) || distance > 3.2) return 0;
        const configuredShoreWidth = Number.isFinite(islandWater && islandWater.shoreWidth)
            ? Number(islandWater.shoreWidth)
            : 2.6;
        const contourNoise = (sampleFractalNoise2D(worldX * 0.86, worldY * 0.86, 92.7, 3, 2.0, 0.54) - 0.5) * 0.28;
        const width = clampValue(configuredShoreWidth * 0.58 + contourNoise, 1.25, 2.9);
        return 1 - smoothstep(0.18, width, distance);
    }

    function isFullMapTerrainWaterBody(body, MAP_SIZE) {
        if (!body || !body.shape || body.shape.kind !== 'box' || !body.bounds || !Number.isFinite(MAP_SIZE)) return false;
        const width = body.bounds.xMax - body.bounds.xMin;
        const height = body.bounds.yMax - body.bounds.yMin;
        const startsAtOrigin = body.bounds.xMin <= 1 && body.bounds.yMin <= 1;
        const spansMap = body.bounds.xMax >= MAP_SIZE - 2 && body.bounds.yMax >= MAP_SIZE - 2;
        const namedOcean = /(?:sea|ocean|surrounding)/i.test(String(body.id || ''))
            && width >= MAP_SIZE * 0.45
            && height >= MAP_SIZE * 0.45;
        return (startsAtOrigin && spansMap) || namedOcean;
    }

    function isSmoothTerrainWaterBody(body, MAP_SIZE) {
        return !!(body && body.shape && body.shape.kind === 'ellipse' && !isFullMapTerrainWaterBody(body, MAP_SIZE));
    }

    function findSmoothTerrainWaterBodyAtPoint(waterRenderBodies, MAP_SIZE, worldX, worldY, inset = 0) {
        const bodies = Array.isArray(waterRenderBodies) ? waterRenderBodies : [];
        for (let i = bodies.length - 1; i >= 0; i--) {
            const body = bodies[i];
            if (!isSmoothTerrainWaterBody(body, MAP_SIZE) || !body.bounds) continue;
            if (worldX < body.bounds.xMin - inset || worldX > body.bounds.xMax + inset) continue;
            if (worldY < body.bounds.yMin - inset || worldY > body.bounds.yMax + inset) continue;
            if (terrainWaterShapeContains(body.shape, worldX, worldY, inset)) return body;
        }
        return null;
    }

    function getEllipseSignedShoreDistance(shape, worldX, worldY) {
        if (!shape || shape.kind !== 'ellipse') return Infinity;
        if (!Number.isFinite(shape.rx) || !Number.isFinite(shape.ry) || shape.rx <= 0 || shape.ry <= 0) return Infinity;
        const rotation = Number.isFinite(shape.rotationRadians) ? Number(shape.rotationRadians) : 0;
        const dx = worldX - shape.cx;
        const dy = worldY - shape.cy;
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const localX = (dx * cos) + (dy * sin);
        const localY = (-dx * sin) + (dy * cos);
        const normalizedDistance = Math.sqrt(((localX / shape.rx) * (localX / shape.rx)) + ((localY / shape.ry) * (localY / shape.ry)));
        const approximateRadius = Math.max(0.01, (shape.rx + shape.ry) * 0.5);
        return (normalizedDistance - 1) * approximateRadius;
    }

    function sampleSmoothWaterShoreTerrainBlend(waterRenderBodies, MAP_SIZE, worldX, worldY) {
        const bodies = Array.isArray(waterRenderBodies) ? waterRenderBodies : [];
        let bestBlend = 0;
        for (let i = bodies.length - 1; i >= 0; i--) {
            const body = bodies[i];
            if (!isSmoothTerrainWaterBody(body, MAP_SIZE) || !body.bounds) continue;
            if (worldX < body.bounds.xMin - 2.65 || worldX > body.bounds.xMax + 2.65) continue;
            if (worldY < body.bounds.yMin - 2.65 || worldY > body.bounds.yMax + 2.65) continue;
            const distance = getEllipseSignedShoreDistance(body.shape, worldX, worldY);
            if (!Number.isFinite(distance) || distance > 2.55) continue;
            const blend = distance <= 1.18 ? 1 : 1 - smoothstep(1.18, 2.5, distance);
            bestBlend = Math.max(bestBlend, blend);
        }
        return clampValue(bestBlend, 0, 1);
    }

    function getTerrainDirtUvScale(THREE, grassMap, dirtMap) {
        const scale = new THREE.Vector2(1, 1);
        if (!grassMap || !dirtMap || !grassMap.repeat || !dirtMap.repeat) return scale;
        const grassRepeatX = Math.max(0.0001, Math.abs(grassMap.repeat.x || 1));
        const grassRepeatY = Math.max(0.0001, Math.abs(grassMap.repeat.y || 1));
        scale.set(
            Math.abs(dirtMap.repeat.x || 1) / grassRepeatX,
            Math.abs(dirtMap.repeat.y || 1) / grassRepeatY
        );
        return scale;
    }

    function getTerrainBlendMaterial(THREE, sharedMaterials) {
        if (!THREE || !sharedMaterials) return null;
        const grassMap = sharedMaterials.grassTile && sharedMaterials.grassTile.map
            ? sharedMaterials.grassTile.map
            : (sharedMaterials.ground ? sharedMaterials.ground.map : null);
        const dirtMap = sharedMaterials.dirtTile && sharedMaterials.dirtTile.map
            ? sharedMaterials.dirtTile.map
            : grassMap;
        if (!sharedMaterials.terrainBlend) {
            const material = new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: true });
            material.map = grassMap;
            material.userData = material.userData || {};
            material.userData.terrainDirtMap = dirtMap;
            material.userData.terrainDirtUvScale = getTerrainDirtUvScale(THREE, grassMap, dirtMap);
            material.onBeforeCompile = (shader) => {
                shader.uniforms.terrainDirtMap = { value: material.userData.terrainDirtMap || material.map };
                shader.uniforms.terrainDirtUvScale = { value: material.userData.terrainDirtUvScale || new THREE.Vector2(1, 1) };
                material.userData.terrainBlendShader = shader;
                shader.vertexShader = shader.vertexShader
                    .replace(
                        '#include <common>',
                        '#include <common>\nattribute float terrainBlend;\nvarying float vTerrainBlend;'
                    )
                    .replace(
                        '#include <begin_vertex>',
                        'vTerrainBlend = terrainBlend;\n#include <begin_vertex>'
                    );
                shader.fragmentShader = shader.fragmentShader
                    .replace(
                        '#include <common>',
                        '#include <common>\nuniform sampler2D terrainDirtMap;\nuniform vec2 terrainDirtUvScale;\nvarying float vTerrainBlend;'
                    )
                    .replace(
                        '#include <map_fragment>',
                        [
                            '#ifdef USE_MAP',
                            '    vec4 grassDiffuseColor = texture2D( map, vMapUv );',
                            '    vec4 dirtDiffuseColor = texture2D( terrainDirtMap, vMapUv * terrainDirtUvScale );',
                            '    float terrainBlendMask = smoothstep( 0.06, 0.88, clamp( vTerrainBlend, 0.0, 1.0 ) );',
                            '    diffuseColor *= mix( grassDiffuseColor, dirtDiffuseColor, terrainBlendMask );',
                            '#endif'
                        ].join('\n')
                    );
            };
            material.customProgramCacheKey = () => 'osrs-terrain-blend-v1';
            sharedMaterials.terrainBlend = material;
        }
        const material = sharedMaterials.terrainBlend;
        const nextScale = getTerrainDirtUvScale(THREE, grassMap, dirtMap);
        material.vertexColors = true;
        material.userData.terrainDirtMap = dirtMap;
        material.userData.terrainDirtUvScale = nextScale;
        if (grassMap && material.map !== grassMap) {
            material.map = grassMap;
            material.needsUpdate = true;
        }
        if (material.userData.terrainBlendShader) {
            material.userData.terrainBlendShader.uniforms.terrainDirtMap.value = dirtMap || grassMap;
            material.userData.terrainBlendShader.uniforms.terrainDirtUvScale.value.copy(nextScale);
        }
        return material;
    }

    function getTransitionSourceKind(tile, TileId, isWaterTileId) {
        if (isWaterTileId(tile)) return 'shore';
        if (tile === TileId.WATER_SHALLOW || tile === TileId.WATER_DEEP) return 'shore';
        if (tile === TileId.SHORE) return 'shore';
        if (tile === TileId.DIRT || tile === TileId.ROCK) return 'dirt';
        return null;
    }

    function isTerrainTransitionTarget(tile, TileId, isNaturalTileId, isWaterTileId) {
        if (!isNaturalTileId(tile) || isWaterTileId(tile)) return false;
        return tile !== TileId.DIRT && tile !== TileId.ROCK && tile !== TileId.SHORE;
    }

    const TERRAIN_BLEND_SUBDIVISIONS = 1;
    const TERRAIN_BLEND_SOURCE_RADIUS = 2;

    function distanceToTileRect(worldX, worldY, tileX, tileY) {
        const dx = Math.max(Math.abs(worldX - tileX) - 0.5, 0);
        const dy = Math.max(Math.abs(worldY - tileY) - 0.5, 0);
        return Math.sqrt((dx * dx) + (dy * dy));
    }

    function collectNearbyTransitionSources(options = {}) {
        const sources = [];
        const logicalMap = options.logicalMap || [];
        const MAP_SIZE = options.MAP_SIZE;
        const TileId = options.TileId || {};
        const worldTileX = options.worldTileX;
        const worldTileY = options.worldTileY;
        const activePierConfig = options.activePierConfig || null;
        const getVisualTileId = typeof options.getTerrainVisualTileId === 'function'
            ? options.getTerrainVisualTileId
            : (typeof options.getVisualTileId === 'function' ? options.getVisualTileId : (tile) => tile);
        const isWaterTileId = typeof options.isWaterTileId === 'function' ? options.isWaterTileId : () => false;
        const isPierVisualCoverageTile = typeof options.isPierVisualCoverageTile === 'function' ? options.isPierVisualCoverageTile : () => false;
        const radius = Number.isFinite(options.radius) ? Math.max(1, Math.floor(options.radius)) : 2;
        for (let ny = Math.max(0, worldTileY - radius); ny <= Math.min(MAP_SIZE - 1, worldTileY + radius); ny++) {
            for (let nx = Math.max(0, worldTileX - radius); nx <= Math.min(MAP_SIZE - 1, worldTileX + radius); nx++) {
                if (isPierVisualCoverageTile(activePierConfig, nx, ny, 0)) continue;
                const tile = getVisualTileId(logicalMap[0][ny][nx], nx, ny, 0);
                const kind = getTransitionSourceKind(tile, TileId, isWaterTileId);
                if (!kind) continue;
                sources.push({ x: nx, y: ny, kind });
            }
        }
        return sources;
    }

    function isAlignedTransitionSource(source, worldTileX, worldTileY) {
        if (!source) return false;
        return source.x === worldTileX || source.y === worldTileY;
    }

    function findNearestTransitionSource(sources, worldX, worldY, worldTileX, worldTileY) {
        let best = null;
        let bestDistance = Infinity;
        let bestScore = Infinity;
        for (let i = 0; i < sources.length; i++) {
            const source = sources[i];
            if (!isAlignedTransitionSource(source, worldTileX, worldTileY)) continue;
            const distance = distanceToTileRect(worldX, worldY, source.x, source.y);
            const score = distance + (source.kind === 'shore' ? -0.035 : 0);
            if (score >= bestScore) continue;
            best = source;
            bestDistance = distance;
            bestScore = score;
        }
        return best ? { source: best, distance: bestDistance } : null;
    }

    function sampleTerrainSurfaceHeight(sampleTerrainVertexHeight, worldX, worldY) {
        const x0 = Math.floor(worldX);
        const y0 = Math.floor(worldY);
        const tx = worldX - x0;
        const ty = worldY - y0;
        const h00 = sampleTerrainVertexHeight(x0, y0);
        const h10 = sampleTerrainVertexHeight(x0 + 1, y0);
        const h01 = sampleTerrainVertexHeight(x0, y0 + 1);
        const h11 = sampleTerrainVertexHeight(x0 + 1, y0 + 1);
        const north = h00 + ((h10 - h00) * tx);
        const south = h01 + ((h11 - h01) * tx);
        return north + ((south - north) * ty);
    }

    function sampleTerrainBlendInfo(options = {}) {
        const MAP_SIZE = options.MAP_SIZE;
        const TileId = options.TileId || {};
        const logicalMap = options.logicalMap || [];
        const worldX = options.worldX;
        const worldY = options.worldY;
        const activePierConfig = options.activePierConfig || null;
        const isNaturalTileId = typeof options.isNaturalTileId === 'function' ? options.isNaturalTileId : () => false;
        const isWaterTileId = typeof options.isWaterTileId === 'function' ? options.isWaterTileId : () => false;
        const isPierVisualCoverageTile = typeof options.isPierVisualCoverageTile === 'function' ? options.isPierVisualCoverageTile : () => false;
        const getVisualTileId = typeof options.getTerrainVisualTileId === 'function'
            ? options.getTerrainVisualTileId
            : (typeof options.getVisualTileId === 'function' ? options.getVisualTileId : (tile) => tile);
        const sourceCache = options.sourceCache || null;
        const waterRenderBodies = Array.isArray(options.waterRenderBodies) ? options.waterRenderBodies : [];
        const islandWater = options.islandWater || null;
        const sampleFractalNoise2D = typeof options.sampleFractalNoise2D === 'function'
            ? options.sampleFractalNoise2D
            : () => 0.5;
        if (!Number.isFinite(MAP_SIZE) || MAP_SIZE <= 0 || !logicalMap[0]) return { blend: 0, kind: null };
        const islandCoastBlend = sampleIslandCoastTerrainBlend(islandWater, sampleFractalNoise2D, worldX, worldY);
        if (islandCoastBlend > 0.02) return { blend: islandCoastBlend, kind: 'shore' };
        const smoothWaterBlend = sampleSmoothWaterShoreTerrainBlend(waterRenderBodies, MAP_SIZE, worldX, worldY);
        if (smoothWaterBlend > 0.02) return { blend: smoothWaterBlend, kind: 'shore' };
        const worldTileX = clampValue(Math.floor(worldX + 0.5), 0, MAP_SIZE - 1);
        const worldTileY = clampValue(Math.floor(worldY + 0.5), 0, MAP_SIZE - 1);
        if (!logicalMap[0][worldTileY]) return { blend: 0, kind: null };
        if (isPierVisualCoverageTile(activePierConfig, worldTileX, worldTileY, 0)) return { blend: 0, kind: null };
        const tile = getVisualTileId(logicalMap[0][worldTileY][worldTileX], worldTileX, worldTileY, 0);
        const ownSourceKind = getTransitionSourceKind(tile, TileId, isWaterTileId);
        if (ownSourceKind) return { blend: 1, kind: ownSourceKind };
        if (!isTerrainTransitionTarget(tile, TileId, isNaturalTileId, isWaterTileId)) return { blend: 0, kind: null };
        let sources = null;
        if (sourceCache) {
            const sourceKey = `${worldTileX},${worldTileY}`;
            if (sourceCache.has(sourceKey)) {
                sources = sourceCache.get(sourceKey);
            } else {
                sources = collectNearbyTransitionSources({
                    logicalMap,
                    MAP_SIZE,
                    TileId,
                    worldTileX,
                    worldTileY,
                    activePierConfig,
                    getTerrainVisualTileId: getVisualTileId,
                    isWaterTileId,
                    isPierVisualCoverageTile,
                    radius: TERRAIN_BLEND_SOURCE_RADIUS
                });
                sourceCache.set(sourceKey, sources);
            }
        } else {
            sources = collectNearbyTransitionSources({
                logicalMap,
                MAP_SIZE,
                TileId,
                worldTileX,
                worldTileY,
                activePierConfig,
                getTerrainVisualTileId: getVisualTileId,
                isWaterTileId,
                isPierVisualCoverageTile,
                radius: TERRAIN_BLEND_SOURCE_RADIUS
            });
        }
        const nearest = findNearestTransitionSource(sources, worldX, worldY, worldTileX, worldTileY);
        if (!nearest) return { blend: 0, kind: null };
        const sourceKind = nearest.source.kind;
        const baseWidth = sourceKind === 'shore' ? 1.38 : 1.22;
        const innerWidth = sourceKind === 'shore' ? 0.03 : 0.02;
        const contourNoise = (sampleFractalNoise2D(worldX * 1.4, worldY * 1.4, sourceKind === 'shore' ? 61.9 : 37.4, 3, 2.0, 0.54) - 0.5) * 0.22;
        const grainNoise = (hash01(worldX * 2.9, worldY * 2.9, sourceKind === 'shore' ? 19.6 : 14.2) - 0.5) * 0.07;
        const outerWidth = Math.max(0.18, baseWidth + contourNoise + grainNoise);
        const blend = 1 - smoothstep(innerWidth, outerWidth, nearest.distance);
        return {
            blend: clampValue(blend, 0, 1),
            kind: sourceKind
        };
    }

    function getTerrainVertexColor(sampleFractalNoise2D, worldX, worldY, slope, blendInfo) {
        const macro = sampleFractalNoise2D(worldX * 0.12, worldY * 0.12, 29.71, 3, 2.0, 0.55);
        const tint = sampleFractalNoise2D((worldX + 64) * 0.28, (worldY - 48) * 0.28, 83.17, 2, 2.0, 0.5);
        const grassShade = clampValue(0.93 + ((macro - 0.5) * 0.12) - (slope * 0.1), 0.8, 1.04);
        const hueShift = (tint - 0.5) * 0.045;
        const grassColor = [
            clampValue(grassShade * (0.97 - (hueShift * 0.46)), 0, 1),
            clampValue(grassShade * (1.02 + (hueShift * 0.18)), 0, 1),
            clampValue(grassShade * (0.93 - (hueShift * 0.36)), 0, 1)
        ];
        const blend = blendInfo && Number.isFinite(blendInfo.blend) ? clampValue(blendInfo.blend, 0, 1) : 0;
        if (blend <= 0) return grassColor;
        const dirtShade = 0.9 + (hash01(worldX * 7.7, worldY * 9.3, blendInfo.kind === 'shore' ? 42.1 : 17.9) * 0.14);
        const dirtColor = blendInfo.kind === 'shore'
            ? [clampValue(1.02 * dirtShade, 0, 1), clampValue(0.94 * dirtShade, 0, 1), clampValue(0.74 * dirtShade, 0, 1)]
            : [clampValue(0.98 * dirtShade, 0, 1), clampValue(0.92 * dirtShade, 0, 1), clampValue(0.84 * dirtShade, 0, 1)];
        return [
            grassColor[0] + ((dirtColor[0] - grassColor[0]) * blend),
            grassColor[1] + ((dirtColor[1] - grassColor[1]) * blend),
            grassColor[2] + ((dirtColor[2] - grassColor[2]) * blend)
        ];
    }

    function buildChunkGroundMeshes(options = {}) {
        const THREE = requireThree(options.THREE);
        const CHUNK_SIZE = options.CHUNK_SIZE;
        const MAP_SIZE = options.MAP_SIZE;
        const TileId = options.TileId || {};
        const startX = options.startX;
        const startY = options.startY;
        const logicalMap = options.logicalMap || [];
        const heightMap = options.heightMap || [];
        const sharedMaterials = options.sharedMaterials || {};
        const waterRenderBodies = Array.isArray(options.waterRenderBodies) ? options.waterRenderBodies : [];
        const islandWater = options.islandWater || null;
        const activePierConfig = options.activePierConfig || null;
        const planeGroup = options.planeGroup || null;
        const environmentMeshes = Array.isArray(options.environmentMeshes) ? options.environmentMeshes : null;
        const isNaturalTileId = typeof options.isNaturalTileId === 'function' ? options.isNaturalTileId : () => false;
        const isWaterTileId = typeof options.isWaterTileId === 'function' ? options.isWaterTileId : () => false;
        const isPierVisualCoverageTile = typeof options.isPierVisualCoverageTile === 'function' ? options.isPierVisualCoverageTile : () => false;
        const getVisualTileId = typeof options.getTerrainVisualTileId === 'function'
            ? options.getTerrainVisualTileId
            : (typeof options.getVisualTileId === 'function' ? options.getVisualTileId : (tile) => tile);
        const getWaterSurfaceHeightForTile = typeof options.getWaterSurfaceHeightForTile === 'function'
            ? options.getWaterSurfaceHeightForTile
            : () => null;
        const sampleFractalNoise2D = typeof options.sampleFractalNoise2D === 'function'
            ? options.sampleFractalNoise2D
            : () => 0.5;

        const isNaturalTile = (tileType) => isNaturalTileId(tileType);
        const isRenderableTerrainTile = (tileType) => isNaturalTile(tileType) && !isWaterTileId(tileType);
        const isRenderableUnderlayTile = (tileType) => !isWaterTileId(tileType);
        const isManmadeLandTile = (tileType) => !isNaturalTile(tileType) && !isWaterTileId(tileType);
        const UNDERLAY_DROP = 0.08;
        const TERRAIN_SKIRT_DROP = 0.24;
        const TERRAIN_WATER_SKIRT_DROP = 0.18;
        const TERRAIN_EDGE_BLEND_CAP = 0.28;
        const TERRAIN_EDGE_BLEND_FACTOR = 0.4;
        const SHORELINE_TERRAIN_UNDERLAP = 0.022;
        const SMOOTH_WATER_TERRAIN_MASK_INSET = 0.1;
        const SMOOTH_WATER_TERRAIN_NEAR_INSET = 1.75;
        const SMOOTH_WATER_DIRT_UNDERLAY_INSET = 2.65;
        const SMOOTH_WATER_DIRT_UNDERLAY_BANK_LIFT = 0.006;
        const SMOOTH_WATER_DIRT_UNDERLAY_BED_DROP = 0.16;
        const terrainVertexHeightCache = new Map();
        const underlayVertexHeightCache = new Map();
        const smoothWaterDirtUnderlayVertexHeightCache = new Map();
        const smoothWaterDirtUnderlayCellCache = new Map();
        const smoothWaterDirtUnderlayBodyCache = new Map();
        const visualTileCache = new Map();
        const isInTerrainBounds = (worldTileX, worldTileY) => (
            worldTileX >= 0
            && worldTileY >= 0
            && worldTileX < MAP_SIZE
            && worldTileY < MAP_SIZE
            && logicalMap[0]
            && logicalMap[0][worldTileY]
        );
        const getVisualTileAt = (worldTileX, worldTileY) => {
            const tileKey = `${worldTileX},${worldTileY}`;
            if (visualTileCache.has(tileKey)) return visualTileCache.get(tileKey);
            if (!isInTerrainBounds(worldTileX, worldTileY)) return null;
            const tile = getVisualTileId(logicalMap[0][worldTileY][worldTileX], worldTileX, worldTileY, 0);
            visualTileCache.set(tileKey, tile);
            return tile;
        };

        const isInsideSmoothWaterTerrainMask = (worldX, worldY) => !!findSmoothTerrainWaterBodyAtPoint(
            waterRenderBodies,
            MAP_SIZE,
            worldX,
            worldY,
            SMOOTH_WATER_TERRAIN_MASK_INSET
        );

        const isNearSmoothWaterTerrainMask = (worldX, worldY) => !!findSmoothTerrainWaterBodyAtPoint(
            waterRenderBodies,
            MAP_SIZE,
            worldX,
            worldY,
            SMOOTH_WATER_TERRAIN_NEAR_INSET
        );

        const getSmoothWaterDirtUnderlayBody = (worldX, worldY) => {
            const bodyKey = `${worldX},${worldY}`;
            if (smoothWaterDirtUnderlayBodyCache.has(bodyKey)) return smoothWaterDirtUnderlayBodyCache.get(bodyKey);
            const body = findSmoothTerrainWaterBodyAtPoint(
                waterRenderBodies,
                MAP_SIZE,
                worldX,
                worldY,
                SMOOTH_WATER_DIRT_UNDERLAY_INSET
            );
            smoothWaterDirtUnderlayBodyCache.set(bodyKey, body || null);
            return body || null;
        };

        const shouldUseSmoothWaterDirtUnderlayCell = (worldTileX, worldTileY) => {
            const cellKey = `${worldTileX},${worldTileY}`;
            if (smoothWaterDirtUnderlayCellCache.has(cellKey)) return smoothWaterDirtUnderlayCellCache.get(cellKey);
            let shouldUse = false;
            if (isPierVisualCoverageTile(activePierConfig, worldTileX, worldTileY, 0)) return false;
            shouldUse = !!getSmoothWaterDirtUnderlayBody(worldTileX, worldTileY);
            smoothWaterDirtUnderlayCellCache.set(cellKey, shouldUse);
            return shouldUse;
        };

        const shouldRenderTerrainCell = (tile, worldX, worldY) => {
            if (isPierVisualCoverageTile(activePierConfig, Math.floor(worldX + 0.5), Math.floor(worldY + 0.5), 0)) return false;
            if (isInsideSmoothWaterTerrainMask(worldX, worldY)) return false;
            if (isWaterTileId(tile)) return false;
            return isRenderableTerrainTile(tile);
        };

        const shouldRenderUnderlayCell = (tile, worldTileX, worldTileY) => {
            if (!isRenderableUnderlayTile(tile)) return false;
            if (isPierVisualCoverageTile(activePierConfig, worldTileX, worldTileY, 0)) return false;
            if (shouldUseSmoothWaterDirtUnderlayCell(worldTileX, worldTileY)) return false;
            if (isManmadeLandTile(tile)) return true;
            for (let ny = worldTileY - 1; ny <= worldTileY + 1; ny++) {
                for (let nx = worldTileX - 1; nx <= worldTileX + 1; nx++) {
                    if (nx === worldTileX && ny === worldTileY) continue;
                    if (!isInTerrainBounds(nx, ny)) return true;
                    if (isPierVisualCoverageTile(activePierConfig, nx, ny, 0)) return true;
                    if (shouldUseSmoothWaterDirtUnderlayCell(nx, ny)) return true;
                    const neighborTile = getVisualTileAt(nx, ny);
                    if (neighborTile === null || isWaterTileId(neighborTile)) return true;
                    if (isManmadeLandTile(neighborTile)) return true;
                }
            }
            return false;
        };

        const sampleTerrainBlendForPoint = (worldX, worldY, terrainBlendSourceCache) => sampleTerrainBlendInfo({
            logicalMap,
            MAP_SIZE,
            TileId,
            worldX,
            worldY,
            activePierConfig,
            getVisualTileId,
            isNaturalTileId,
            isWaterTileId,
            isPierVisualCoverageTile,
            waterRenderBodies,
            islandWater,
            sampleFractalNoise2D,
            sourceCache: terrainBlendSourceCache
        });

        const sampleTerrainVertexHeight = (cornerX, cornerY) => {
            const tx0 = Math.floor(cornerX);
            const ty0 = Math.floor(cornerY);
            const heightKey = `${tx0},${ty0}`;
            if (terrainVertexHeightCache.has(heightKey)) return terrainVertexHeightCache.get(heightKey);
            const sampleTiles = [
                { x: tx0, y: ty0 },
                { x: tx0 + 1, y: ty0 },
                { x: tx0, y: ty0 + 1 },
                { x: tx0 + 1, y: ty0 + 1 }
            ];
            let sum = 0;
            let count = 0;
            let waterSum = 0;
            let waterCount = 0;
            let manmadeSum = 0;
            let manmadeCount = 0;
            let protectedIslandLandCount = 0;
            for (let i = 0; i < sampleTiles.length; i++) {
                const sample = sampleTiles[i];
                if (sample.x < 0 || sample.y < 0 || sample.x >= MAP_SIZE || sample.y >= MAP_SIZE) continue;
                if (isPierVisualCoverageTile(activePierConfig, sample.x, sample.y, 0)) continue;
                const tileType = getVisualTileId(logicalMap[0][sample.y][sample.x], sample.x, sample.y, 0);
                if (isRenderableTerrainTile(tileType)) {
                    if (isInsideIslandLandPolygon(islandWater, sample.x, sample.y)) protectedIslandLandCount++;
                    sum += heightMap[0][sample.y][sample.x];
                    count++;
                    continue;
                }
                if (isManmadeLandTile(tileType)) {
                    manmadeSum += heightMap[0][sample.y][sample.x];
                    manmadeCount++;
                }

                const waterSurfaceY = getWaterSurfaceHeightForTile(waterRenderBodies, sample.x, sample.y, 0);
                if (waterSurfaceY === null) continue;
                waterSum += waterSurfaceY;
                waterCount++;
            }
            if (count > 0 && waterCount > 0) {
                const landHeight = sum / count;
                const waterHeight = waterSum / waterCount;
                if (protectedIslandLandCount > 0) {
                    terrainVertexHeightCache.set(heightKey, landHeight);
                    return landHeight;
                }
                if (isNearSmoothWaterTerrainMask(cornerX, cornerY)) {
                    terrainVertexHeightCache.set(heightKey, landHeight);
                    return landHeight;
                }
                const height = Math.min(landHeight, waterHeight - SHORELINE_TERRAIN_UNDERLAP);
                terrainVertexHeightCache.set(heightKey, height);
                return height;
            }
            if (count > 0 && manmadeCount > 0) {
                const naturalHeight = sum / count;
                const manmadeHeight = manmadeSum / manmadeCount;
                const edgeDelta = THREE.MathUtils.clamp(
                    manmadeHeight - naturalHeight,
                    -TERRAIN_EDGE_BLEND_CAP,
                    TERRAIN_EDGE_BLEND_CAP
                );
                const height = naturalHeight + (edgeDelta * TERRAIN_EDGE_BLEND_FACTOR);
                terrainVertexHeightCache.set(heightKey, height);
                return height;
            }
            const height = count > 0 ? (sum / count) : 0;
            terrainVertexHeightCache.set(heightKey, height);
            return height;
        };

        const sampleUnderlayVertexHeight = (cornerX, cornerY) => {
            const tx0 = Math.floor(cornerX);
            const ty0 = Math.floor(cornerY);
            const heightKey = `${tx0},${ty0}`;
            if (underlayVertexHeightCache.has(heightKey)) return underlayVertexHeightCache.get(heightKey);
            const sampleTiles = [
                { x: tx0, y: ty0 },
                { x: tx0 + 1, y: ty0 },
                { x: tx0, y: ty0 + 1 },
                { x: tx0 + 1, y: ty0 + 1 }
            ];
            let sum = 0;
            let count = 0;
            for (let i = 0; i < sampleTiles.length; i++) {
                const sample = sampleTiles[i];
                if (sample.x < 0 || sample.y < 0 || sample.x >= MAP_SIZE || sample.y >= MAP_SIZE) continue;
                if (isPierVisualCoverageTile(activePierConfig, sample.x, sample.y, 0)) continue;
                const tileType = getVisualTileId(logicalMap[0][sample.y][sample.x], sample.x, sample.y, 0);
                if (!isRenderableUnderlayTile(tileType)) continue;
                sum += heightMap[0][sample.y][sample.x];
                count++;
            }
            const height = count <= 0 ? -UNDERLAY_DROP : (sum / count) - UNDERLAY_DROP;
            underlayVertexHeightCache.set(heightKey, height);
            return height;
        };

        const sampleSmoothWaterDirtUnderlayVertexHeight = (cornerX, cornerY) => {
            const heightKey = `${cornerX},${cornerY}`;
            if (smoothWaterDirtUnderlayVertexHeightCache.has(heightKey)) {
                return smoothWaterDirtUnderlayVertexHeightCache.get(heightKey);
            }
            const bankY = sampleUnderlayVertexHeight(cornerX, cornerY) + SMOOTH_WATER_DIRT_UNDERLAY_BANK_LIFT;
            const body = getSmoothWaterDirtUnderlayBody(cornerX, cornerY);
            if (!body || !body.shape) {
                smoothWaterDirtUnderlayVertexHeightCache.set(heightKey, bankY);
                return bankY;
            }
            const surfaceY = Number.isFinite(body.surfaceY) ? Number(body.surfaceY) : -0.075;
            const bedY = surfaceY - SMOOTH_WATER_DIRT_UNDERLAY_BED_DROP;
            const distance = getEllipseSignedShoreDistance(body.shape, cornerX, cornerY);
            if (!Number.isFinite(distance)) {
                const height = Math.min(bankY, bedY);
                smoothWaterDirtUnderlayVertexHeightCache.set(heightKey, height);
                return height;
            }
            const bankBlend = smoothstep(-0.2, 1.15, distance);
            const height = bedY + ((bankY - bedY) * bankBlend);
            smoothWaterDirtUnderlayVertexHeightCache.set(heightKey, height);
            return height;
        };

        const shouldAddTerrainSkirtForNeighbor = (currentTile, worldTileX, worldTileY, neighborX, neighborY) => {
            if (isPierVisualCoverageTile(activePierConfig, worldTileX, worldTileY, 0)) return false;
            if (!shouldRenderTerrainCell(currentTile, worldTileX, worldTileY)) return false;
            if (!isInTerrainBounds(neighborX, neighborY)) return true;
            if (isPierVisualCoverageTile(activePierConfig, neighborX, neighborY, 0)) return true;
            const neighborTile = getVisualTileAt(neighborX, neighborY);
            if (neighborTile === null) return true;
            return !shouldRenderTerrainCell(neighborTile, neighborX, neighborY);
        };

        const isTerrainSkirtWaterEdge = (neighborX, neighborY) => {
            if (!isInTerrainBounds(neighborX, neighborY)) return false;
            const neighborTile = getVisualTileAt(neighborX, neighborY);
            if (neighborTile !== null && isWaterTileId(neighborTile)) return true;
            return getWaterSurfaceHeightForTile(waterRenderBodies, neighborX, neighborY, 0) !== null;
        };

        const sampleTerrainSkirtBottomHeight = (worldX, worldY, edgeKind) => {
            const topHeight = sampleTerrainSurfaceHeight(sampleTerrainVertexHeight, worldX, worldY);
            const baseDrop = edgeKind === 'water' ? TERRAIN_WATER_SKIRT_DROP : TERRAIN_SKIRT_DROP;
            let bottom = Math.min(sampleUnderlayVertexHeight(worldX, worldY), topHeight - baseDrop);
            if (edgeKind === 'water') {
                const sampleX = clampValue(Math.floor(worldX + 0.5), 0, MAP_SIZE - 1);
                const sampleY = clampValue(Math.floor(worldY + 0.5), 0, MAP_SIZE - 1);
                const waterSurface = getWaterSurfaceHeightForTile(waterRenderBodies, sampleX, sampleY, 0);
                if (waterSurface !== null) bottom = Math.min(bottom, waterSurface - SHORELINE_TERRAIN_UNDERLAP);
            }
            return bottom;
        };

        const appendTerrainSkirtSegment = (positions, meshOriginX, meshOriginY, x0, y0, x1, y1, edgeKind) => {
            const top0 = sampleTerrainSurfaceHeight(sampleTerrainVertexHeight, x0, y0);
            const top1 = sampleTerrainSurfaceHeight(sampleTerrainVertexHeight, x1, y1);
            const bottom0 = sampleTerrainSkirtBottomHeight(x0, y0, edgeKind);
            const bottom1 = sampleTerrainSkirtBottomHeight(x1, y1, edgeKind);
            const localX0 = x0 - meshOriginX;
            const localY0 = y0 - meshOriginY;
            const localX1 = x1 - meshOriginX;
            const localY1 = y1 - meshOriginY;
            positions.push(
                localX0, top0, localY0,
                localX1, bottom1, localY1,
                localX1, top1, localY1,
                localX0, top0, localY0,
                localX0, bottom0, localY0,
                localX1, bottom1, localY1
            );
        };

        const pushSparseTerrainVertex = (positions, uvs, meshOriginX, meshOriginY, worldX, height, worldY, warpedUvs = false) => {
            positions.push(worldX - meshOriginX, height, worldY - meshOriginY);
            if (warpedUvs) {
                const warpU = sampleTerrainUvWarp(sampleFractalNoise2D, worldX + 31.7, worldY - 14.3, 173.41);
                const warpV = sampleTerrainUvWarp(sampleFractalNoise2D, worldX - 48.9, worldY + 22.5, 281.73);
                uvs.push((worldX / CHUNK_SIZE) + warpU, (worldY / CHUNK_SIZE) + warpV);
            } else {
                uvs.push(worldX / CHUNK_SIZE, worldY / CHUNK_SIZE);
            }
        };

        const appendSparseTerrainCellQuad = (positions, uvs, meshOriginX, meshOriginY, tileX, tileY, sampleHeight, warpedUvs = false) => {
            const x0 = startX - 0.5 + tileX;
            const x1 = x0 + 1;
            const y0 = startY - 0.5 + tileY;
            const y1 = y0 + 1;
            pushSparseTerrainVertex(positions, uvs, meshOriginX, meshOriginY, x0, sampleHeight(x0, y0), y0, warpedUvs);
            pushSparseTerrainVertex(positions, uvs, meshOriginX, meshOriginY, x1, sampleHeight(x1, y1), y1, warpedUvs);
            pushSparseTerrainVertex(positions, uvs, meshOriginX, meshOriginY, x1, sampleHeight(x1, y0), y0, warpedUvs);
            pushSparseTerrainVertex(positions, uvs, meshOriginX, meshOriginY, x0, sampleHeight(x0, y0), y0, warpedUvs);
            pushSparseTerrainVertex(positions, uvs, meshOriginX, meshOriginY, x0, sampleHeight(x0, y1), y1, warpedUvs);
            pushSparseTerrainVertex(positions, uvs, meshOriginX, meshOriginY, x1, sampleHeight(x1, y1), y1, warpedUvs);
        };

        const buildTerrainSkirtGeometry = (cells = null) => {
            const positions = [];
            const meshOriginX = startX + (CHUNK_SIZE / 2) - 0.5;
            const meshOriginY = startY + (CHUNK_SIZE / 2) - 0.5;
            const sourceCells = Array.isArray(cells) ? cells : [];
            for (let cellIndex = 0; cellIndex < sourceCells.length; cellIndex++) {
                const cell = sourceCells[cellIndex];
                const worldTileX = startX + cell.tileX;
                const worldTileY = startY + cell.tileY;
                const tile = getVisualTileAt(worldTileX, worldTileY);
                if (tile === null) continue;
                const x0 = worldTileX - 0.5;
                const x1 = worldTileX + 0.5;
                const y0 = worldTileY - 0.5;
                const y1 = worldTileY + 0.5;
                if (shouldAddTerrainSkirtForNeighbor(tile, worldTileX, worldTileY, worldTileX, worldTileY - 1)) {
                    appendTerrainSkirtSegment(positions, meshOriginX, meshOriginY, x0, y0, x1, y0, isTerrainSkirtWaterEdge(worldTileX, worldTileY - 1) ? 'water' : 'land');
                }
                if (shouldAddTerrainSkirtForNeighbor(tile, worldTileX, worldTileY, worldTileX + 1, worldTileY)) {
                    appendTerrainSkirtSegment(positions, meshOriginX, meshOriginY, x1, y0, x1, y1, isTerrainSkirtWaterEdge(worldTileX + 1, worldTileY) ? 'water' : 'land');
                }
                if (shouldAddTerrainSkirtForNeighbor(tile, worldTileX, worldTileY, worldTileX, worldTileY + 1)) {
                    appendTerrainSkirtSegment(positions, meshOriginX, meshOriginY, x1, y1, x0, y1, isTerrainSkirtWaterEdge(worldTileX, worldTileY + 1) ? 'water' : 'land');
                }
                if (shouldAddTerrainSkirtForNeighbor(tile, worldTileX, worldTileY, worldTileX - 1, worldTileY)) {
                    appendTerrainSkirtSegment(positions, meshOriginX, meshOriginY, x0, y1, x0, y0, isTerrainSkirtWaterEdge(worldTileX - 1, worldTileY) ? 'water' : 'land');
                }
            }
            if (positions.length <= 0) return null;
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geometry.computeVertexNormals();
            geometry.computeBoundingSphere();
            return geometry;
        };

        const underlayCells = [];
        const smoothWaterDirtUnderlayCells = [];
        const terrainCells = [];
        for (let tileY = 0; tileY < CHUNK_SIZE; tileY++) {
            for (let tileX = 0; tileX < CHUNK_SIZE; tileX++) {
                const worldTileX = startX + tileX;
                const worldTileY = startY + tileY;
                const tile = getVisualTileAt(worldTileX, worldTileY);
                if (tile === null) continue;
                if (shouldRenderUnderlayCell(tile, worldTileX, worldTileY)) underlayCells.push({ tileX, tileY });
                if (shouldUseSmoothWaterDirtUnderlayCell(worldTileX, worldTileY)) smoothWaterDirtUnderlayCells.push({ tileX, tileY });
                if (shouldRenderTerrainCell(tile, worldTileX, worldTileY)) terrainCells.push({ tileX, tileY });
            }
        }

        if (underlayCells.length > 0) {
            const underlayPositions = [];
            const underlayUvs = [];
            const meshOriginX = startX + (CHUNK_SIZE / 2) - 0.5;
            const meshOriginY = startY + (CHUNK_SIZE / 2) - 0.5;
            for (let cellIndex = 0; cellIndex < underlayCells.length; cellIndex++) {
                const cell = underlayCells[cellIndex];
                appendSparseTerrainCellQuad(underlayPositions, underlayUvs, meshOriginX, meshOriginY, cell.tileX, cell.tileY, sampleUnderlayVertexHeight, false);
            }
            const underlayGeo = new THREE.BufferGeometry();
            underlayGeo.setAttribute('position', new THREE.Float32BufferAttribute(underlayPositions, 3));
            underlayGeo.setAttribute('uv', new THREE.Float32BufferAttribute(underlayUvs, 2));
            underlayGeo.computeVertexNormals();
            underlayGeo.computeBoundingSphere();
            const underlayMesh = new THREE.Mesh(underlayGeo, sharedMaterials.terrainUnderlay);
            underlayMesh.position.set(startX + CHUNK_SIZE / 2 - 0.5, 0, startY + CHUNK_SIZE / 2 - 0.5);
            underlayMesh.receiveShadow = false;
            underlayMesh.castShadow = false;
            underlayMesh.renderOrder = -1;
            underlayMesh.userData = { type: 'GROUND', z: 0, underlay: true };
            if (planeGroup) planeGroup.add(underlayMesh);
            if (environmentMeshes) environmentMeshes.push(underlayMesh);
        }

        if (smoothWaterDirtUnderlayCells.length > 0) {
            const smoothWaterDirtUnderlayPositions = [];
            const smoothWaterDirtUnderlayUvs = [];
            const meshOriginX = startX + (CHUNK_SIZE / 2) - 0.5;
            const meshOriginY = startY + (CHUNK_SIZE / 2) - 0.5;
            for (let cellIndex = 0; cellIndex < smoothWaterDirtUnderlayCells.length; cellIndex++) {
                const cell = smoothWaterDirtUnderlayCells[cellIndex];
                appendSparseTerrainCellQuad(smoothWaterDirtUnderlayPositions, smoothWaterDirtUnderlayUvs, meshOriginX, meshOriginY, cell.tileX, cell.tileY, sampleSmoothWaterDirtUnderlayVertexHeight, true);
            }
            const smoothWaterDirtUnderlayGeo = new THREE.BufferGeometry();
            smoothWaterDirtUnderlayGeo.setAttribute('position', new THREE.Float32BufferAttribute(smoothWaterDirtUnderlayPositions, 3));
            smoothWaterDirtUnderlayGeo.setAttribute('uv', new THREE.Float32BufferAttribute(smoothWaterDirtUnderlayUvs, 2));
            smoothWaterDirtUnderlayGeo.computeVertexNormals();
            smoothWaterDirtUnderlayGeo.computeBoundingSphere();
            const smoothWaterDirtUnderlayMesh = new THREE.Mesh(smoothWaterDirtUnderlayGeo, sharedMaterials.dirtTile);
            smoothWaterDirtUnderlayMesh.position.set(startX + CHUNK_SIZE / 2 - 0.5, 0, startY + CHUNK_SIZE / 2 - 0.5);
            smoothWaterDirtUnderlayMesh.receiveShadow = false;
            smoothWaterDirtUnderlayMesh.castShadow = false;
            smoothWaterDirtUnderlayMesh.renderOrder = -0.8;
            smoothWaterDirtUnderlayMesh.userData = { type: 'GROUND_VISUAL_UNDERLAY', z: 0, smoothWaterDirtUnderlay: true };
            if (planeGroup) planeGroup.add(smoothWaterDirtUnderlayMesh);
        }

        const terrainSkirtGeometry = buildTerrainSkirtGeometry(terrainCells);
        if (terrainSkirtGeometry) {
            const terrainSkirtMesh = new THREE.Mesh(terrainSkirtGeometry, sharedMaterials.terrainUnderlay);
            terrainSkirtMesh.position.set(startX + CHUNK_SIZE / 2 - 0.5, 0, startY + CHUNK_SIZE / 2 - 0.5);
            terrainSkirtMesh.receiveShadow = false;
            terrainSkirtMesh.castShadow = false;
            terrainSkirtMesh.renderOrder = -0.9;
            terrainSkirtMesh.userData = { type: 'GROUND_VISUAL_SKIRT', z: 0 };
            if (planeGroup) planeGroup.add(terrainSkirtMesh);
        }

        const terrainSubdivisionMultiplier = TERRAIN_BLEND_SUBDIVISIONS;
        const terrainSegments = CHUNK_SIZE * terrainSubdivisionMultiplier;
        if (terrainCells.length <= 0) return;
        const terrainGeo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, terrainSegments, terrainSegments);
        terrainGeo.rotateX(-Math.PI / 2);
        applyWorldSpaceTerrainUvs(terrainGeo, startX, startY, terrainSegments, CHUNK_SIZE, sampleFractalNoise2D);

        const positions = terrainGeo.attributes.position;
        for (let vy = 0; vy <= terrainSegments; vy++) {
            for (let vx = 0; vx <= terrainSegments; vx++) {
                const idx = (vy * (terrainSegments + 1)) + vx;
                const cornerX = startX - 0.5 + ((vx / terrainSegments) * CHUNK_SIZE);
                const cornerY = startY - 0.5 + ((vy / terrainSegments) * CHUNK_SIZE);
                const h = sampleTerrainSurfaceHeight(sampleTerrainVertexHeight, cornerX, cornerY);
                positions.setY(idx, h);
            }
        }
        positions.needsUpdate = true;
        const baseTerrainIndices = terrainGeo.index ? terrainGeo.index.array : [];
        const terrainIndices = [];
        const shouldTrackUsedTerrainVertices = terrainCells.length < CHUNK_SIZE * CHUNK_SIZE * 0.9 || terrainSubdivisionMultiplier !== 1;
        const usedTerrainVertexIndices = shouldTrackUsedTerrainVertices ? new Set() : null;
        if (terrainSubdivisionMultiplier === 1) {
            for (let cellIndex = 0; cellIndex < terrainCells.length; cellIndex++) {
                const cell = terrainCells[cellIndex];
                const cellIndexOffset = ((cell.tileY * terrainSegments) + cell.tileX) * 6;
                for (let i = 0; i < 6; i++) {
                    const vertexIndex = baseTerrainIndices[cellIndexOffset + i];
                    terrainIndices.push(vertexIndex);
                    if (usedTerrainVertexIndices) usedTerrainVertexIndices.add(vertexIndex);
                }
            }
        } else {
            for (let cellY = 0; cellY < terrainSegments; cellY++) {
                for (let cellX = 0; cellX < terrainSegments; cellX++) {
                    const sampleWorldX = startX - 0.5 + (((cellX + 0.5) / terrainSegments) * CHUNK_SIZE);
                    const sampleWorldY = startY - 0.5 + (((cellY + 0.5) / terrainSegments) * CHUNK_SIZE);
                    const worldTileX = clampValue(Math.floor(sampleWorldX + 0.5), 0, MAP_SIZE - 1);
                    const worldTileY = clampValue(Math.floor(sampleWorldY + 0.5), 0, MAP_SIZE - 1);
                    const tile = getVisualTileAt(worldTileX, worldTileY);
                    if (tile === null) continue;
                    if (isPierVisualCoverageTile(activePierConfig, worldTileX, worldTileY, 0)) continue;
                    if (!shouldRenderTerrainCell(tile, sampleWorldX, sampleWorldY)) continue;
                    const cellIndexOffset = ((cellY * terrainSegments) + cellX) * 6;
                    for (let i = 0; i < 6; i++) {
                        const vertexIndex = baseTerrainIndices[cellIndexOffset + i];
                        terrainIndices.push(vertexIndex);
                        if (usedTerrainVertexIndices) usedTerrainVertexIndices.add(vertexIndex);
                    }
                }
            }
        }
        if (terrainIndices.length <= 0) {
            terrainGeo.dispose();
            return;
        }
        terrainGeo.setIndex(terrainIndices);
        collapseTerrainGeometryDrawGroups(terrainGeo, terrainIndices.length);
        terrainGeo.computeVertexNormals();

        if (terrainGeo && terrainGeo.index && terrainGeo.index.count > 0) {
            const normals = terrainGeo.attributes.normal;
            const positions = terrainGeo.attributes.position;
            const meshOriginX = startX + (CHUNK_SIZE / 2) - 0.5;
            const meshOriginY = startY + (CHUNK_SIZE / 2) - 0.5;
            const terrainVertexCount = positions.count;
            const vertexColors = new Float32Array(terrainVertexCount * 3);
            const terrainBlend = new Float32Array(terrainVertexCount);
            const terrainBlendSourceCache = new Map();
            const colorTerrainVertex = (idx) => {
                const worldX = meshOriginX + positions.getX(idx);
                const worldY = meshOriginY + positions.getZ(idx);
                const normalY = normals ? normals.getY(idx) : 1;
                const slope = 1 - THREE.MathUtils.clamp(normalY, 0, 1);
                const blendInfo = sampleTerrainBlendForPoint(worldX, worldY, terrainBlendSourceCache);
                const color = getTerrainVertexColor(sampleFractalNoise2D, worldX, worldY, slope, blendInfo);
                const colorIndex = idx * 3;
                vertexColors[colorIndex] = color[0];
                vertexColors[colorIndex + 1] = color[1];
                vertexColors[colorIndex + 2] = color[2];
                terrainBlend[idx] = blendInfo.blend;
            };
            if (usedTerrainVertexIndices && usedTerrainVertexIndices.size > 0 && usedTerrainVertexIndices.size < terrainVertexCount * 0.9) {
                usedTerrainVertexIndices.forEach((idx) => colorTerrainVertex(idx));
            } else {
                for (let idx = 0; idx < terrainVertexCount; idx++) colorTerrainVertex(idx);
            }
            terrainGeo.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3));
            terrainGeo.setAttribute('terrainBlend', new THREE.Float32BufferAttribute(terrainBlend, 1));
            const terrainMaterial = getTerrainBlendMaterial(THREE, sharedMaterials) || sharedMaterials.grassTile;

            const terrainMesh = new THREE.Mesh(terrainGeo, terrainMaterial);
            terrainMesh.position.set(startX + CHUNK_SIZE / 2 - 0.5, 0, startY + CHUNK_SIZE / 2 - 0.5);
            terrainMesh.receiveShadow = true;
            terrainMesh.castShadow = false;
            terrainMesh.userData = { type: 'GROUND', z: 0, terrainSubdivisionMultiplier };
            if (planeGroup) planeGroup.add(terrainMesh);
            if (environmentMeshes) environmentMeshes.push(terrainMesh);
        }
    }

    window.WorldChunkTerrainRuntime = {
        buildChunkGroundMeshes
    };
})();
