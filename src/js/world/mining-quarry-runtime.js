(function () {
    function fallbackHash2D(x, y, seed = 0) {
        const s = Math.sin((x * 127.1) + (y * 311.7) + (seed * 74.7)) * 43758.5453;
        return s - Math.floor(s);
    }

    function fallbackClamp01(value) {
        return Math.max(0, Math.min(1, value));
    }

    function fallbackSmoothstep(edge0, edge1, value) {
        const t = fallbackClamp01((value - edge0) / Math.max(0.000001, edge1 - edge0));
        return t * t * (3 - (2 * t));
    }

    function fallbackFractalNoise2D(x, y, seed = 0) {
        return fallbackHash2D(x, y, seed);
    }

    function createPlanningRuntime(options = {}) {
        const hash2D = typeof options.hash2D === 'function' ? options.hash2D : fallbackHash2D;
        const clamp01 = typeof options.clamp01 === 'function' ? options.clamp01 : fallbackClamp01;
        const smoothstep = typeof options.smoothstep === 'function' ? options.smoothstep : fallbackSmoothstep;
        const sampleFractalNoise2D = typeof options.sampleFractalNoise2D === 'function' ? options.sampleFractalNoise2D : fallbackFractalNoise2D;
        const heightMap = Array.isArray(options.heightMap) ? options.heightMap : [[[0]]];
        const logicalMap = Array.isArray(options.logicalMap) ? options.logicalMap : [[]];
        const TileId = options.tileIds || { DIRT: 3 };
        const MAP_SIZE = Number.isFinite(options.mapSize) ? Math.max(1, Math.floor(options.mapSize)) : 512;

        const MINING_QUARRY_LAYOUT_OVERRIDES = Object.freeze({
            starter_mine: Object.freeze({
                centerX: 114,
                centerY: 204,
                anchorX: 114,
                anchorY: 204,
                radiusScale: 0.72,
                dirtRadiusScale: 1.08,
                edgeDepth: -0.17,
                centerDepth: -0.34
            }),
            iron_mine: Object.freeze({
                centerX: 404,
                centerY: 204,
                anchorX: 404,
                anchorY: 204,
                radiusScale: 0.76,
                dirtRadiusScale: 1.08,
                edgeDepth: -0.18,
                centerDepth: -0.36
            }),
            coal_mine: Object.freeze({
                centerX: 434,
                centerY: 350,
                anchorX: 434,
                anchorY: 350,
                radiusScale: 0.8,
                dirtRadiusScale: 1.08,
                edgeDepth: -0.2,
                centerDepth: -0.4
            }),
            precious_mine: Object.freeze({
                centerX: 49,
                centerY: 371,
                anchorX: 49,
                anchorY: 371,
                radiusScale: 0.78,
                dirtRadiusScale: 1.08,
                edgeDepth: -0.2,
                centerDepth: -0.41
            }),
            gem_mine: Object.freeze({
                centerX: 262,
                centerY: 427,
                anchorX: 262,
                anchorY: 427,
                radiusScale: 0.74,
                dirtRadiusScale: 1.08,
                edgeDepth: -0.19,
                centerDepth: -0.39
            }),
            rune_essence_mine: Object.freeze({
                centerX: 408,
                centerY: 50,
                anchorX: 408,
                anchorY: 50,
                radiusScale: 0.7,
                dirtRadiusScale: 1.06,
                edgeDepth: -0.18,
                centerDepth: -0.35
            })
        });
        const getMiningQuarryLayout = (routeId, clusterPoints) => {
            const points = Array.isArray(clusterPoints) ? clusterPoints : [];
            let sumX = 0;
            let sumY = 0;
            let maxDistance = 0;
            let minX = Number.POSITIVE_INFINITY;
            let maxX = Number.NEGATIVE_INFINITY;
            let minY = Number.POSITIVE_INFINITY;
            let maxY = Number.NEGATIVE_INFINITY;
            for (let i = 0; i < points.length; i++) {
                const point = points[i];
                if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
                sumX += point.x;
                sumY += point.y;
                minX = Math.min(minX, point.x);
                maxX = Math.max(maxX, point.x);
                minY = Math.min(minY, point.y);
                maxY = Math.max(maxY, point.y);
            }
            const fallbackX = Number.isFinite(minX) && Number.isFinite(maxX) ? ((minX + maxX) * 0.5) : 0;
            const fallbackY = Number.isFinite(minY) && Number.isFinite(maxY) ? ((minY + maxY) * 0.5) : 0;
            const averagedCenterX = points.length > 0 ? (sumX / points.length) : fallbackX;
            const averagedCenterY = points.length > 0 ? (sumY / points.length) : fallbackY;
            for (let i = 0; i < points.length; i++) {
                const point = points[i];
                if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
                maxDistance = Math.max(maxDistance, Math.hypot(point.x - averagedCenterX, point.y - averagedCenterY));
            }

            const override = routeId && MINING_QUARRY_LAYOUT_OVERRIDES[routeId]
                ? MINING_QUARRY_LAYOUT_OVERRIDES[routeId]
                : null;
            const centerX = override && Number.isFinite(override.centerX) ? override.centerX : averagedCenterX;
            const centerY = override && Number.isFinite(override.centerY) ? override.centerY : averagedCenterY;
            let recenteredMaxDistance = 0;
            for (let i = 0; i < points.length; i++) {
                const point = points[i];
                if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
                recenteredMaxDistance = Math.max(recenteredMaxDistance, Math.hypot(point.x - centerX, point.y - centerY));
            }

            const radiusBase = Math.max(5.2, recenteredMaxDistance + 2.6 + Math.min(2.8, Math.sqrt(Math.max(1, points.length)) * 0.32));
            const radius = Math.min(16.0, radiusBase * (override && Number.isFinite(override.radiusScale) ? override.radiusScale : 1));
            const dirtRadius = Math.min(17.6, radius * (override && Number.isFinite(override.dirtRadiusScale) ? override.dirtRadiusScale : 1.06));
            const edgeDepth = override && Number.isFinite(override.edgeDepth)
                ? override.edgeDepth
                : Math.max(-0.22, -0.15 - (Math.sqrt(Math.max(1, points.length)) * 0.009));
            const centerDepth = override && Number.isFinite(override.centerDepth)
                ? override.centerDepth
                : Math.max(-0.44, edgeDepth - (0.14 + (Math.sqrt(Math.max(1, points.length)) * 0.01)));
            return {
                centerX,
                centerY,
                radius,
                dirtRadius,
                edgeDepth,
                centerDepth,
                anchorX: override && Number.isFinite(override.anchorX) ? override.anchorX : centerX,
                anchorY: override && Number.isFinite(override.anchorY) ? override.anchorY : centerY,
                minX,
                maxX,
                minY,
                maxY
            };
        };
        const placementCoordKey = (placement) => {
            if (!placement || !Number.isFinite(placement.x) || !Number.isFinite(placement.y)) return '';
            const z = Number.isFinite(placement.z) ? placement.z : 0;
            return z + ':' + placement.x + ',' + placement.y;
        };
        const thinMiningRockPlacements = (placements) => {
            if (!Array.isArray(placements) || placements.length === 0) {
                return { active: [], dropped: [] };
            }

            const alwaysKeep = [];
            const byRoute = Object.create(null);
            for (let i = 0; i < placements.length; i++) {
                const placement = placements[i];
                if (!placement || !Number.isFinite(placement.x) || !Number.isFinite(placement.y)) continue;
                if (!Number.isFinite(placement.z) || placement.z !== 0) {
                    alwaysKeep.push(placement);
                    continue;
                }
                const routeId = (typeof placement.routeId === 'string' && placement.routeId)
                    ? placement.routeId
                    : 'routeless_mine';
                if (!byRoute[routeId]) byRoute[routeId] = [];
                byRoute[routeId].push(placement);
            }

            const active = alwaysKeep.slice();
            const dropped = [];
            const routeEntries = Object.entries(byRoute);
            for (let routeIndex = 0; routeIndex < routeEntries.length; routeIndex++) {
                const routeEntry = routeEntries[routeIndex];
                const routePoints = routeEntry[1];
                if (!Array.isArray(routePoints) || routePoints.length === 0) continue;
                if (routePoints.length <= 4) {
                    active.push(...routePoints);
                    continue;
                }

                let sumX = 0;
                let sumY = 0;
                for (let i = 0; i < routePoints.length; i++) {
                    sumX += routePoints[i].x;
                    sumY += routePoints[i].y;
                }
                const centerX = sumX / routePoints.length;
                const centerY = sumY / routePoints.length;
                let maxDist = 0;
                let minX = Number.POSITIVE_INFINITY;
                let maxX = Number.NEGATIVE_INFINITY;
                let minY = Number.POSITIVE_INFINITY;
                let maxY = Number.NEGATIVE_INFINITY;
                for (let i = 0; i < routePoints.length; i++) {
                    const point = routePoints[i];
                    maxDist = Math.max(maxDist, Math.hypot(point.x - centerX, point.y - centerY));
                    minX = Math.min(minX, point.x);
                    maxX = Math.max(maxX, point.x);
                    minY = Math.min(minY, point.y);
                    maxY = Math.max(maxY, point.y);
                }
                const spanX = Math.max(1, maxX - minX);
                const spanY = Math.max(1, maxY - minY);
                const canvasDiag = Math.max(1.8, Math.hypot(spanX, spanY));
                const targetKeep = Math.max(4, Math.min(routePoints.length, Math.round(routePoints.length * 0.42)));
                const initialSpacing = Math.max(3.1, Math.min(6.8, (canvasDiag * 0.9) / Math.max(2.2, Math.sqrt(targetKeep))));
                const classifyBin = (point) => {
                    const nx = (point.x - minX) / Math.max(1, spanX);
                    const ny = (point.y - minY) / Math.max(1, spanY);
                    const bx = Math.max(0, Math.min(2, Math.floor(nx * 3)));
                    const by = Math.max(0, Math.min(2, Math.floor(ny * 3)));
                    return bx + ',' + by;
                };

                const remaining = routePoints.slice();
                remaining.sort((a, b) => {
                    const da = Math.hypot(a.x - centerX, a.y - centerY);
                    const db = Math.hypot(b.x - centerX, b.y - centerY);
                    if (da !== db) return db - da;
                    return hash2D(a.x, a.y, 51.7 + routeIndex) - hash2D(b.x, b.y, 51.7 + routeIndex);
                });

                const selected = [];
                if (remaining.length > 0) {
                    selected.push(remaining.shift());
                }
                if (remaining.length > 0 && selected.length < targetKeep) {
                    let oppositeIdx = 0;
                    let oppositeDistance = -Infinity;
                    const seed = selected[0];
                    for (let candidateIndex = 0; candidateIndex < remaining.length; candidateIndex++) {
                        const candidate = remaining[candidateIndex];
                        const d = Math.hypot(candidate.x - seed.x, candidate.y - seed.y);
                        if (d > oppositeDistance) {
                            oppositeDistance = d;
                            oppositeIdx = candidateIndex;
                        }
                    }
                    selected.push(remaining.splice(oppositeIdx, 1)[0]);
                }

                let spacing = initialSpacing;
                let safety = 0;
                while (selected.length < targetKeep && remaining.length > 0 && safety < 512) {
                    safety++;
                    let bestIdx = 0;
                    let bestScore = -Infinity;
                    const selectedBins = new Set(selected.map(classifyBin));
                    for (let candidateIndex = 0; candidateIndex < remaining.length; candidateIndex++) {
                        const candidate = remaining[candidateIndex];
                        let minDist = Number.POSITIVE_INFINITY;
                        for (let s = 0; s < selected.length; s++) {
                            const chosen = selected[s];
                            const d = Math.hypot(candidate.x - chosen.x, candidate.y - chosen.y);
                            if (d < minDist) minDist = d;
                        }
                        if (selected.length > 0 && minDist < spacing) continue;
                        const candidateBin = classifyBin(candidate);
                        const jitter = hash2D(candidate.x, candidate.y, 86.1 + (routeIndex * 7.7) + (selected.length * 1.9));
                        const centerDist = Math.hypot(candidate.x - centerX, candidate.y - centerY);
                        const edgeBias = centerDist / Math.max(1, canvasDiag * 0.5);
                        const binBonus = selectedBins.has(candidateBin) ? 0 : 1.15;
                        const score = (minDist * 1.45) + (edgeBias * 0.85) + binBonus + (jitter * 0.22);
                        if (score > bestScore) {
                            bestScore = score;
                            bestIdx = candidateIndex;
                        }
                    }
                    if (bestScore === -Infinity) {
                        spacing = Math.max(1.9, spacing - 0.28);
                        if (spacing <= 1.92) {
                            let fallbackIdx = 0;
                            let fallbackScore = -Infinity;
                            const selectedBins = new Set(selected.map(classifyBin));
                            for (let candidateIndex = 0; candidateIndex < remaining.length; candidateIndex++) {
                                const candidate = remaining[candidateIndex];
                                let minDist = Number.POSITIVE_INFINITY;
                                for (let s = 0; s < selected.length; s++) {
                                    const chosen = selected[s];
                                    const d = Math.hypot(candidate.x - chosen.x, candidate.y - chosen.y);
                                    if (d < minDist) minDist = d;
                                }
                                const candidateBin = classifyBin(candidate);
                                const jitter = hash2D(candidate.x, candidate.y, 126.4 + (routeIndex * 9.9));
                                const centerDist = Math.hypot(candidate.x - centerX, candidate.y - centerY);
                                const edgeBias = centerDist / Math.max(1, canvasDiag * 0.5);
                                const binBonus = selectedBins.has(candidateBin) ? 0 : 0.9;
                                const score = (minDist * 1.24) + (edgeBias * 0.62) + binBonus + (jitter * 0.16);
                                if (score > fallbackScore) {
                                    fallbackScore = score;
                                    fallbackIdx = candidateIndex;
                                }
                            }
                            selected.push(remaining.splice(fallbackIdx, 1)[0]);
                        }
                        continue;
                    }
                    selected.push(remaining.splice(bestIdx, 1)[0]);
                }

                const selectedKeys = new Set(selected.map(placementCoordKey));
                for (let i = 0; i < routePoints.length; i++) {
                    const point = routePoints[i];
                    if (selectedKeys.has(placementCoordKey(point))) active.push(point);
                    else dropped.push(point);
                }
            }

            return { active, dropped };
        };
        const redistributeMiningRockPlacements = (placements, sourcePlacements) => {
            if (!Array.isArray(placements) || placements.length === 0) return [];

            const byRoute = Object.create(null);
            const sourceByRoute = Object.create(null);
            const preserved = [];
            for (let i = 0; i < placements.length; i++) {
                const placement = placements[i];
                if (!placement || !Number.isFinite(placement.x) || !Number.isFinite(placement.y)) continue;
                if (!Number.isFinite(placement.z) || placement.z !== 0) {
                    preserved.push({ ...placement });
                    continue;
                }
                const routeId = (typeof placement.routeId === 'string' && placement.routeId)
                    ? placement.routeId
                    : 'routeless_mine';
                if (!byRoute[routeId]) byRoute[routeId] = [];
                byRoute[routeId].push(placement);
            }
            if (Array.isArray(sourcePlacements)) {
                for (let i = 0; i < sourcePlacements.length; i++) {
                    const placement = sourcePlacements[i];
                    if (!placement || !Number.isFinite(placement.x) || !Number.isFinite(placement.y)) continue;
                    if (!Number.isFinite(placement.z) || placement.z !== 0) continue;
                    const routeId = (typeof placement.routeId === 'string' && placement.routeId)
                        ? placement.routeId
                        : 'routeless_mine';
                    if (!sourceByRoute[routeId]) sourceByRoute[routeId] = [];
                    sourceByRoute[routeId].push(placement);
                }
            }

            const redistributed = preserved.slice();
            const globallyUsed = new Set();
            const routeEntries = Object.entries(byRoute);
            for (let routeIndex = 0; routeIndex < routeEntries.length; routeIndex++) {
                const [routeId, routePlacements] = routeEntries[routeIndex];
                if (!Array.isArray(routePlacements) || routePlacements.length === 0) continue;
                const clusterPoints = Array.isArray(sourceByRoute[routeId]) && sourceByRoute[routeId].length > 0
                    ? sourceByRoute[routeId]
                    : routePlacements;
                const layout = getMiningQuarryLayout(routeId, clusterPoints);
                const centerX = layout.centerX;
                const centerY = layout.centerY;
                const radius = layout.radius;
                const dirtRadius = layout.dirtRadius;
                const edgeDepth = layout.edgeDepth;
                const centerDepth = layout.centerDepth;
                const scanMinX = Math.max(2, Math.floor(centerX - dirtRadius - 2));
                const scanMaxX = Math.min(MAP_SIZE - 3, Math.ceil(centerX + dirtRadius + 2));
                const scanMinY = Math.max(2, Math.floor(centerY - dirtRadius - 2));
                const scanMaxY = Math.min(MAP_SIZE - 3, Math.ceil(centerY + dirtRadius + 2));
                const dirtCandidates = [];
                for (let y = scanMinY; y <= scanMaxY; y++) {
                    for (let x = scanMinX; x <= scanMaxX; x++) {
                        if (!logicalMap[0] || !logicalMap[0][y] || logicalMap[0][y][x] !== TileId.DIRT) continue;
                        if (globallyUsed.has(x + ',' + y)) continue;
                        const distance = Math.hypot(x - centerX, y - centerY);
                        if (distance > dirtRadius * 1.22) continue;
                        const fieldNoise = sampleFractalNoise2D(
                            ((x * 0.18) + (routeIndex * 3.1)),
                            ((y * 0.18) - (routeIndex * 2.7)),
                            701.2 + (routeIndex * 23.9),
                            2,
                            2.0,
                            0.5
                        );
                        const currentHeight = heightMap[0] && heightMap[0][y] && Number.isFinite(heightMap[0][y][x])
                            ? heightMap[0][y][x]
                            : 0;
                        const depthSpan = Math.max(0.01, Math.abs(centerDepth - edgeDepth));
                        const depthBias = clamp01((edgeDepth - currentHeight) / depthSpan);
                        const normalizedDistance = distance / Math.max(1, dirtRadius);
                        const canvasBias = Math.max(0, 1 - Math.abs(normalizedDistance - 0.52));
                        dirtCandidates.push({ x, y, z: 0, distance, fieldNoise, depthBias, canvasBias });
                    }
                }

                const spanX = Math.max(1, scanMaxX - scanMinX);
                const spanY = Math.max(1, scanMaxY - scanMinY);
                const canvasDiag = Math.max(2, Math.hypot(spanX, spanY));
                const classifyBin = (point) => {
                    const nx = (point.x - scanMinX) / Math.max(1, spanX);
                    const ny = (point.y - scanMinY) / Math.max(1, spanY);
                    const bx = Math.max(0, Math.min(3, Math.floor(nx * 4)));
                    const by = Math.max(0, Math.min(3, Math.floor(ny * 4)));
                    return bx + ',' + by;
                };
                const baseTargetCount = routePlacements.length;
                const requestedExtraCount = 12 + Math.floor(
                    hash2D(centerX + (routeIndex * 4.1), centerY - (routeIndex * 3.7), 944.2) * 3
                );
                const targetCount = Math.max(
                    baseTargetCount,
                    Math.min(dirtCandidates.length, baseTargetCount + requestedExtraCount)
                );
                const selected = [];
                const remaining = dirtCandidates.slice();
                const clusterCenters = [];
                const takenKeys = new Set();
                const selectedBins = new Set();
                const candidateKey = (point) => point.x + ',' + point.y;
                const removeRemainingAt = (index) => {
                    if (index < 0 || index >= remaining.length) return null;
                    return remaining.splice(index, 1)[0];
                };
                const minDistanceToPoints = (point, points) => {
                    if (!Array.isArray(points) || points.length === 0) return Number.POSITIVE_INFINITY;
                    let minDist = Number.POSITIVE_INFINITY;
                    for (let p = 0; p < points.length; p++) {
                        const target = points[p];
                        if (!target) continue;
                        minDist = Math.min(minDist, Math.hypot(point.x - target.x, point.y - target.y));
                    }
                    return minDist;
                };
                const addSelectedCandidate = (candidate) => {
                    if (!candidate) return false;
                    const key = candidateKey(candidate);
                    if (takenKeys.has(key)) return false;
                    takenKeys.add(key);
                    selected.push(candidate);
                    selectedBins.add(classifyBin(candidate));
                    return true;
                };

                // Build a deterministic clump plan (pairs/triples/quads) plus a few strays.
                // First pass uses the base count; extra rocks are filled in a second, interior-biased pass.
                const primaryTargetCount = Math.min(targetCount, baseTargetCount);
                const strayTarget = primaryTargetCount >= 14 ? 3 : (primaryTargetCount >= 9 ? 2 : (primaryTargetCount >= 6 ? 1 : 0));
                let clusteredCount = Math.max(0, primaryTargetCount - strayTarget);
                const clumpSizes = [];
                let clumpIndex = 0;
                while (clusteredCount > 0) {
                    const clumpRoll = hash2D(centerX + (clumpIndex * 3.7), centerY - (clumpIndex * 2.9), 615.4 + (routeIndex * 11.7));
                    let requestedSize = clumpRoll < 0.24 ? 4 : (clumpRoll < 0.68 ? 3 : 2);
                    if (clusteredCount <= 2) requestedSize = clusteredCount;
                    const clumpSize = Math.max(1, Math.min(requestedSize, clusteredCount));
                    clumpSizes.push(clumpSize);
                    clusteredCount -= clumpSize;
                    clumpIndex++;
                }

                const centerTargetCount = Math.max(1, clumpSizes.length);
                let centerSpacing = Math.max(3.3, Math.min(7.1, (canvasDiag * 0.82) / Math.max(1.8, Math.sqrt(centerTargetCount))));
                for (let c = 0; c < clumpSizes.length && remaining.length > 0 && selected.length < primaryTargetCount; c++) {
                    const clumpSize = clumpSizes[c];
                    let centerCandidateIndex = -1;
                    let centerCandidateScore = -Infinity;
                    for (let pass = 0; pass < 4 && centerCandidateIndex === -1; pass++) {
                        const spacingLimit = Math.max(2.1, centerSpacing - (pass * 0.55));
                        for (let candidateIndex = 0; candidateIndex < remaining.length; candidateIndex++) {
                            const candidate = remaining[candidateIndex];
                            if (!candidate) continue;
                            const minCenterDist = minDistanceToPoints(candidate, clusterCenters);
                            const resolvedCenterDist = Number.isFinite(minCenterDist) ? minCenterDist : centerSpacing;
                            if (clusterCenters.length > 0 && resolvedCenterDist < spacingLimit) continue;
                            const binBonus = selectedBins.has(classifyBin(candidate)) ? 0 : 1.15;
                            const jitter = hash2D(candidate.x, candidate.y, 641.9 + (routeIndex * 8.4) + (c * 2.2));
                            const score = (resolvedCenterDist * 0.95)
                                + (binBonus * 0.74)
                                + (candidate.fieldNoise * 0.78)
                                + (candidate.canvasBias * 0.52)
                                + (candidate.depthBias * 0.26)
                                + (jitter * 0.24);
                            if (score > centerCandidateScore) {
                                centerCandidateScore = score;
                                centerCandidateIndex = candidateIndex;
                            }
                        }
                    }
                    if (centerCandidateIndex === -1) break;
                    const centerCandidate = removeRemainingAt(centerCandidateIndex);
                    if (!addSelectedCandidate(centerCandidate)) continue;
                    clusterCenters.push(centerCandidate);

                    const localIdeal = 1.18 + (hash2D(centerCandidate.x, centerCandidate.y, 704.1 + c) * 0.66);
                    const maxLocalRadius = clumpSize >= 4 ? 2.95 : (clumpSize === 3 ? 2.55 : 2.25);
                    for (let member = 1; member < clumpSize && selected.length < primaryTargetCount; member++) {
                        let neighborIndex = -1;
                        let neighborScore = -Infinity;
                        for (let pass = 0; pass < 3 && neighborIndex === -1; pass++) {
                            const maxRadius = maxLocalRadius + (pass * 0.62);
                            const minRadius = Math.max(0.65, 0.85 - (pass * 0.2));
                            for (let candidateIndex = 0; candidateIndex < remaining.length; candidateIndex++) {
                                const candidate = remaining[candidateIndex];
                                if (!candidate) continue;
                                const centerDist = Math.hypot(candidate.x - centerCandidate.x, candidate.y - centerCandidate.y);
                                if (centerDist < minRadius || centerDist > maxRadius) continue;
                                const minPlacedDist = minDistanceToPoints(candidate, selected);
                                if (minPlacedDist < 0.78) continue;
                                const clumpProximity = 1 - clamp01(Math.abs(centerDist - localIdeal) / Math.max(0.1, maxRadius));
                                let nearOtherCenterDist = Number.POSITIVE_INFINITY;
                                for (let cc = 0; cc < clusterCenters.length; cc++) {
                                    const otherCenter = clusterCenters[cc];
                                    if (!otherCenter || otherCenter === centerCandidate) continue;
                                    nearOtherCenterDist = Math.min(
                                        nearOtherCenterDist,
                                        Math.hypot(candidate.x - otherCenter.x, candidate.y - otherCenter.y)
                                    );
                                }
                                const centerSeparationPenalty = nearOtherCenterDist < 1.8 ? (1.8 - nearOtherCenterDist) : 0;
                                const jitter = hash2D(candidate.x, candidate.y, 731.3 + (routeIndex * 9.6) + (member * 3.3));
                                const score = (clumpProximity * 1.05)
                                    + (candidate.fieldNoise * 0.66)
                                    + (candidate.depthBias * 0.2)
                                    + (candidate.canvasBias * 0.24)
                                    + (jitter * 0.22)
                                    - (centerSeparationPenalty * 0.7);
                                if (score > neighborScore) {
                                    neighborScore = score;
                                    neighborIndex = candidateIndex;
                                }
                            }
                        }
                        if (neighborIndex === -1) break;
                        const neighbor = removeRemainingAt(neighborIndex);
                        addSelectedCandidate(neighbor);
                    }
                }

                // Fill remaining target slots with wider strays so the area doesn't look artificially packed.
                const strayCandidates = remaining.sort((a, b) => {
                    const aScore = (a.fieldNoise * 0.72) + (a.canvasBias * 0.35) + (hash2D(a.x, a.y, 820.2 + routeIndex) * 0.22);
                    const bScore = (b.fieldNoise * 0.72) + (b.canvasBias * 0.35) + (hash2D(b.x, b.y, 820.2 + routeIndex) * 0.22);
                    return bScore - aScore;
                });
                let straySpacing = Math.max(1.95, Math.min(4.1, (canvasDiag * 0.52) / Math.max(2, Math.sqrt(Math.max(1, primaryTargetCount)))));
                let straySafety = 0;
                while (selected.length < primaryTargetCount && strayCandidates.length > 0 && straySafety < 1024) {
                    straySafety++;
                    let bestStrayIdx = -1;
                    let bestStrayScore = -Infinity;
                    for (let candidateIndex = 0; candidateIndex < strayCandidates.length; candidateIndex++) {
                        const candidate = strayCandidates[candidateIndex];
                        const minPlacedDist = minDistanceToPoints(candidate, selected);
                        const resolvedPlacedDist = Number.isFinite(minPlacedDist) ? minPlacedDist : (straySpacing + 0.8);
                        if (selected.length > 0 && resolvedPlacedDist < straySpacing) continue;
                        const binBonus = selectedBins.has(classifyBin(candidate)) ? 0 : 1.0;
                        const jitter = hash2D(candidate.x, candidate.y, 867.5 + (routeIndex * 8.1) + (selected.length * 1.9));
                        const score = (resolvedPlacedDist * 0.84)
                            + (binBonus * 0.68)
                            + (candidate.fieldNoise * 0.62)
                            + (candidate.canvasBias * 0.3)
                            + (candidate.depthBias * 0.14)
                            + (jitter * 0.2);
                        if (score > bestStrayScore) {
                            bestStrayScore = score;
                            bestStrayIdx = candidateIndex;
                        }
                    }
                    if (bestStrayIdx === -1) {
                        straySpacing = Math.max(1.05, straySpacing - 0.24);
                        if (straySpacing <= 1.08) {
                            const fallback = strayCandidates.shift();
                            if (fallback) addSelectedCandidate(fallback);
                        }
                        continue;
                    }
                    const stray = strayCandidates.splice(bestStrayIdx, 1)[0];
                    addSelectedCandidate(stray);
                }

                // Extra pass: add +12..+14 rocks using deterministic random picks.
                if (selected.length < targetCount && strayCandidates.length > 0) {
                    const fillCandidates = strayCandidates.slice();
                    let fillSpacing = 1.16;
                    let fillSafety = 0;
                    let fillMisses = 0;
                    while (selected.length < targetCount && fillCandidates.length > 0 && fillSafety < 1024) {
                        fillSafety++;
                        const randomIndex = Math.floor(
                            hash2D(
                                centerX + (fillSafety * 1.73) + (selected.length * 0.41),
                                centerY - (fillSafety * 1.11) + (routeIndex * 0.37),
                                911.4 + (routeIndex * 5.3)
                            ) * fillCandidates.length
                        );
                        const fillPick = fillCandidates.splice(randomIndex, 1)[0];
                        if (!fillPick) continue;
                        const minPlacedDist = minDistanceToPoints(fillPick, selected);
                        const resolvedPlacedDist = Number.isFinite(minPlacedDist) ? minPlacedDist : (fillSpacing + 0.9);
                        if (selected.length > 0 && resolvedPlacedDist < fillSpacing) {
                            fillCandidates.push(fillPick);
                            fillMisses++;
                            if (fillMisses >= Math.max(8, Math.floor(fillCandidates.length * 0.6))) {
                                fillSpacing = Math.max(0.62, fillSpacing - 0.1);
                                fillMisses = 0;
                            }
                            continue;
                        }
                        addSelectedCandidate(fillPick);
                        fillMisses = 0;
                    }
                }

                const orderedPlacements = routePlacements.slice().sort((a, b) => {
                    const aId = typeof a.placementId === 'string' ? a.placementId : '';
                    const bId = typeof b.placementId === 'string' ? b.placementId : '';
                    return aId.localeCompare(bId);
                });
                const orderedTargets = selected.slice().sort((a, b) => {
                    const aEdge = a.distance / Math.max(1, radius);
                    const bEdge = b.distance / Math.max(1, radius);
                    if (aEdge !== bEdge) return bEdge - aEdge;
                    if (a.y !== b.y) return a.y - b.y;
                    return a.x - b.x;
                });

                const extraPlacementCount = Math.max(0, orderedTargets.length - orderedPlacements.length);
                for (let i = 0; i < extraPlacementCount; i++) {
                    const template = orderedPlacements.length > 0
                        ? orderedPlacements[i % orderedPlacements.length]
                        : routePlacements[Math.min(i, routePlacements.length - 1)];
                    if (!template) break;
                    const templateId = typeof template.placementId === 'string' && template.placementId
                        ? template.placementId
                        : `${routeId}:rock`;
                    orderedPlacements.push({
                        ...template,
                        placementId: `${templateId}:fill_${i + 1}`
                    });
                }

                for (let i = 0; i < orderedPlacements.length; i++) {
                    const placement = orderedPlacements[i];
                    const target = orderedTargets[i];
                    if (!target) {
                        redistributed.push({ ...placement });
                        continue;
                    }
                    globallyUsed.add(target.x + ',' + target.y);
                    redistributed.push({
                        ...placement,
                        x: target.x,
                        y: target.y,
                        z: 0
                    });
                }
            }

            return redistributed;
        };

        return {
            MINING_QUARRY_LAYOUT_OVERRIDES,
            getMiningQuarryLayout,
            thinMiningRockPlacements,
            redistributeMiningRockPlacements
        };
    }

    function getMiningQuarryLayout(routeId, clusterPoints, options = {}) {
        return createPlanningRuntime(options).getMiningQuarryLayout(routeId, clusterPoints);
    }

    function getMiningQuarryLayoutOverrides() {
        return createPlanningRuntime().MINING_QUARRY_LAYOUT_OVERRIDES;
    }

    function thinMiningRockPlacements(placements, options = {}) {
        return createPlanningRuntime(options).thinMiningRockPlacements(placements);
    }

    function redistributeMiningRockPlacements(placements, sourcePlacements, options = {}) {
        return createPlanningRuntime(options).redistributeMiningRockPlacements(placements, sourcePlacements);
    }

    window.WorldMiningQuarryRuntime = {
        getMiningQuarryLayout,
        getMiningQuarryLayoutOverrides,
        redistributeMiningRockPlacements,
        thinMiningRockPlacements
    };
})();
