(function () {
    function requireThree(three) {
        if (!three) throw new Error('World structure render runtime requires THREE.');
        return three;
    }

    function appendFloatAttributeValues(target, attribute) {
        if (!attribute || !attribute.array) return;
        const array = attribute.array;
        for (let i = 0; i < array.length; i++) target.push(array[i]);
    }

    function cloneMeshGeometryForMerge(mesh) {
        if (!mesh || !mesh.geometry || !mesh.geometry.attributes || !mesh.geometry.attributes.position) return null;
        const geometry = mesh.geometry.index && typeof mesh.geometry.toNonIndexed === 'function'
            ? mesh.geometry.toNonIndexed()
            : mesh.geometry.clone();
        mesh.updateMatrix();
        geometry.applyMatrix4(mesh.matrix);
        return geometry;
    }

    function cloneMeshGeometryForMergeRoot(THREE, mesh, root, rootInverse) {
        if (!mesh || !root || !mesh.geometry || !mesh.geometry.attributes || !mesh.geometry.attributes.position) return null;
        const geometry = mesh.geometry.index && typeof mesh.geometry.toNonIndexed === 'function'
            ? mesh.geometry.toNonIndexed()
            : mesh.geometry.clone();
        mesh.updateMatrixWorld(true);
        const matrix = new THREE.Matrix4().multiplyMatrices(rootInverse, mesh.matrixWorld);
        geometry.applyMatrix4(matrix);
        return geometry;
    }

    function canMergeStaticVisualMesh(mesh, excludedMaterial) {
        if (!mesh || !mesh.isMesh || !mesh.geometry || !mesh.material) return false;
        if (mesh.material === excludedMaterial) return false;
        if (mesh.visible === false || mesh.material.visible === false) return false;
        if (Array.isArray(mesh.material) || mesh.isSkinnedMesh) return false;
        if (!mesh.geometry.attributes || !mesh.geometry.attributes.position) return false;
        if (mesh.material.transparent || mesh.material.opacity < 1) return false;
        return true;
    }

    function getStaticVisualMergeKey(mesh) {
        const material = mesh && mesh.material;
        if (!material) return '';
        return [
            material.uuid || '',
            mesh.castShadow ? 'cast' : 'nocast',
            mesh.receiveShadow ? 'receive' : 'noreceive',
            Number.isFinite(mesh.renderOrder) ? mesh.renderOrder : 0
        ].join('|');
    }

    function createMergedStaticVisualMesh(THREE, meshes) {
        if (!Array.isArray(meshes) || meshes.length < 2) return null;
        const material = meshes[0].material;
        const geometries = [];
        for (let i = 0; i < meshes.length; i++) {
            const geometry = cloneMeshGeometryForMerge(meshes[i]);
            if (!geometry) return null;
            geometries.push(geometry);
        }

        const shouldPreserveUvs = !!(material && material.map);
        const hasAllUvs = geometries.every((geometry) => !!(geometry.attributes && geometry.attributes.uv));
        const hasAllColors = geometries.every((geometry) => !!(geometry.attributes && geometry.attributes.color));
        if (shouldPreserveUvs && !hasAllUvs) return null;
        if (material && material.vertexColors && !hasAllColors) return null;

        const positions = [];
        const normals = [];
        const uvs = [];
        const colors = [];
        let preserveNormals = true;
        for (let i = 0; i < geometries.length; i++) {
            const geometry = geometries[i];
            const attrs = geometry.attributes || {};
            appendFloatAttributeValues(positions, attrs.position);
            if (attrs.normal) appendFloatAttributeValues(normals, attrs.normal);
            else preserveNormals = false;
            if ((shouldPreserveUvs || hasAllUvs) && attrs.uv) appendFloatAttributeValues(uvs, attrs.uv);
            if (hasAllColors && attrs.color) appendFloatAttributeValues(colors, attrs.color);
        }
        if (!positions.length) return null;

        const mergedGeometry = new THREE.BufferGeometry();
        mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        if (preserveNormals && normals.length === positions.length) mergedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        else mergedGeometry.computeVertexNormals();
        if ((shouldPreserveUvs || hasAllUvs) && uvs.length === (positions.length / 3) * 2) mergedGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        if (hasAllColors && colors.length === positions.length) mergedGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        mergedGeometry.computeBoundingBox();
        mergedGeometry.computeBoundingSphere();

        const mergedMesh = new THREE.Mesh(mergedGeometry, material);
        mergedMesh.castShadow = meshes[0].castShadow;
        mergedMesh.receiveShadow = meshes[0].receiveShadow;
        mergedMesh.renderOrder = meshes[0].renderOrder;
        mergedMesh.frustumCulled = meshes.every((mesh) => mesh.frustumCulled !== false);
        return mergedMesh;
    }

    function createMergedStaticVisualDescendantMesh(THREE, root, meshes) {
        if (!Array.isArray(meshes) || meshes.length < 2 || !root) return null;
        root.updateMatrixWorld(true);
        const rootInverse = new THREE.Matrix4().copy(root.matrixWorld).invert();
        const material = meshes[0].material;
        const geometries = [];
        for (let i = 0; i < meshes.length; i++) {
            const geometry = cloneMeshGeometryForMergeRoot(THREE, meshes[i], root, rootInverse);
            if (!geometry) return null;
            geometries.push(geometry);
        }
        return createMergedStaticVisualMeshFromGeometries(THREE, material, geometries, meshes);
    }

    function createMergedStaticVisualMeshFromGeometries(THREE, material, geometries, sourceMeshes) {
        if (!Array.isArray(geometries) || geometries.length < 2) return null;
        const shouldPreserveUvs = !!(material && material.map);
        const hasAllUvs = geometries.every((geometry) => !!(geometry.attributes && geometry.attributes.uv));
        const hasAllColors = geometries.every((geometry) => !!(geometry.attributes && geometry.attributes.color));
        if (shouldPreserveUvs && !hasAllUvs) return null;
        if (material && material.vertexColors && !hasAllColors) return null;

        const positions = [];
        const normals = [];
        const uvs = [];
        const colors = [];
        let preserveNormals = true;
        for (let i = 0; i < geometries.length; i++) {
            const geometry = geometries[i];
            const attrs = geometry.attributes || {};
            appendFloatAttributeValues(positions, attrs.position);
            if (attrs.normal) appendFloatAttributeValues(normals, attrs.normal);
            else preserveNormals = false;
            if ((shouldPreserveUvs || hasAllUvs) && attrs.uv) appendFloatAttributeValues(uvs, attrs.uv);
            if (hasAllColors && attrs.color) appendFloatAttributeValues(colors, attrs.color);
            geometry.dispose();
        }
        if (!positions.length) return null;

        const mergedGeometry = new THREE.BufferGeometry();
        mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        if (preserveNormals && normals.length === positions.length) mergedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        else mergedGeometry.computeVertexNormals();
        if ((shouldPreserveUvs || hasAllUvs) && uvs.length === (positions.length / 3) * 2) mergedGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        if (hasAllColors && colors.length === positions.length) mergedGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        mergedGeometry.computeBoundingBox();
        mergedGeometry.computeBoundingSphere();

        const mergedMesh = new THREE.Mesh(mergedGeometry, material);
        const firstMesh = sourceMeshes[0];
        mergedMesh.castShadow = !!(firstMesh && firstMesh.castShadow);
        mergedMesh.receiveShadow = !!(firstMesh && firstMesh.receiveShadow);
        mergedMesh.renderOrder = firstMesh && Number.isFinite(firstMesh.renderOrder) ? firstMesh.renderOrder : 0;
        mergedMesh.frustumCulled = sourceMeshes.every((mesh) => mesh.frustumCulled !== false);
        return mergedMesh;
    }

    function mergeStaticVisualChildrenByMaterial(THREE, group, options = {}) {
        if (!group || !Array.isArray(group.children)) return;
        const excludedMaterial = options.excludedMaterial || null;
        const buckets = new Map();
        group.children.slice().forEach((child) => {
            if (!canMergeStaticVisualMesh(child, excludedMaterial)) return;
            const key = getStaticVisualMergeKey(child);
            if (!buckets.has(key)) buckets.set(key, []);
            buckets.get(key).push(child);
        });

        buckets.forEach((meshes) => {
            if (meshes.length < 2) return;
            const mergedMesh = createMergedStaticVisualMesh(THREE, meshes);
            if (!mergedMesh) return;
            meshes.forEach((mesh) => group.remove(mesh));
            group.add(mergedMesh);
        });
    }

    function mergeStaticVisualDescendantsByMaterial(THREE, group, options = {}) {
        if (!group || typeof group.traverse !== 'function') return;
        const excludedMaterial = options.excludedMaterial || null;
        const buckets = new Map();
        group.traverse((child) => {
            if (child === group || !canMergeStaticVisualMesh(child, excludedMaterial)) return;
            const key = getStaticVisualMergeKey(child);
            if (!buckets.has(key)) buckets.set(key, []);
            buckets.get(key).push(child);
        });

        buckets.forEach((meshes) => {
            if (meshes.length < 2) return;
            const mergedMesh = createMergedStaticVisualDescendantMesh(THREE, group, meshes);
            if (!mergedMesh) return;
            meshes.forEach((mesh) => {
                if (mesh.parent) mesh.parent.remove(mesh);
            });
            group.add(mergedMesh);
        });
    }

    function createTopAnchoredFloorMesh(options) {
        const THREE = requireThree(options && options.THREE);
        const material = options && options.material;
        const x = options && options.x;
        const y = options && options.y;
        const z = options && options.z;
        const zOffset = Number.isFinite(options && options.zOffset) ? options.zOffset : 0;
        const topHeight = Number.isFinite(options && options.topHeight) ? options.topHeight : 0;
        const minThickness = 0.08;
        const thickness = topHeight > 0 ? topHeight : minThickness;
        const centerY = zOffset + (topHeight > 0 ? (topHeight / 2) : (topHeight - (thickness / 2)));
        const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(1, thickness, 1), material);
        floorMesh.position.set(x, centerY, y);
        floorMesh.receiveShadow = true;
        floorMesh.castShadow = true;
        floorMesh.userData = { type: 'GROUND', gridX: x, gridY: y, z: z };
        return floorMesh;
    }

    function getFloorTileRenderBucket(options = {}) {
        const logicalMap = options.logicalMap || [];
        const TileId = options.TileId || {};
        const isPierDeckTile = typeof options.isPierDeckTile === 'function' ? options.isPierDeckTile : () => false;
        const pierConfig = options.pierConfig || null;
        const x = options.x;
        const y = options.y;
        const z = options.z;
        const rawTile = logicalMap[z] && logicalMap[z][y] ? logicalMap[z][y][x] : null;
        const visualTile = options.visualTile;
        const floorTile = rawTile === TileId.SOLID_NPC || rawTile === TileId.OBSTACLE ? visualTile : rawTile;
        if (floorTile === TileId.SOLID_NPC) return null;
        if (floorTile === TileId.OBSTACLE) return null;
        if (floorTile === TileId.GRASS || floorTile === TileId.DIRT || floorTile === TileId.SHORE) return null;
        if (floorTile === TileId.FLOOR_WOOD && isPierDeckTile(pierConfig, x, y, z)) return null;
        if (floorTile === TileId.FLOOR_WOOD) return 'wood';
        if (floorTile === TileId.FLOOR_BRICK) return 'brick';
        if (floorTile === TileId.FLOOR_STONE || floorTile === TileId.BANK_BOOTH) return 'stone';
        return null;
    }

    function ensureFloorTileGeometries(THREE, sharedGeometries) {
        if (!sharedGeometries.floorTileBox) sharedGeometries.floorTileBox = new THREE.BoxGeometry(1, 1, 1);
    }

    function createFloorTileInstancedMesh(THREE, geometry, material, count, instanceMap) {
        if (!geometry || !material || count <= 0) return null;
        const mesh = new THREE.InstancedMesh(geometry, material, count);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.matrixAutoUpdate = false;
        mesh.frustumCulled = false;
        mesh.count = 0;
        mesh.userData = { instanceMap };
        return mesh;
    }

    function createFloorTileRenderData(options = {}) {
        const counts = options.floorCounts || {};
        const floorData = {
            stoneIndex: 0,
            woodIndex: 0,
            brickIndex: 0,
            stoneMap: [],
            woodMap: [],
            brickMap: [],
            iStone: null,
            iWood: null,
            iBrick: null
        };
        const fallbackCount = Number.isFinite(options.floorCount) ? Math.max(0, Math.floor(options.floorCount)) : 0;
        const stoneCount = Number.isFinite(counts.stone) ? Math.max(0, Math.floor(counts.stone)) : fallbackCount;
        const woodCount = Number.isFinite(counts.wood) ? Math.max(0, Math.floor(counts.wood)) : fallbackCount;
        const brickCount = Number.isFinite(counts.brick) ? Math.max(0, Math.floor(counts.brick)) : fallbackCount;
        if (stoneCount <= 0 && woodCount <= 0 && brickCount <= 0) return floorData;

        const THREE = requireThree(options.THREE);
        const sharedGeometries = options.sharedGeometries || {};
        const sharedMaterials = options.sharedMaterials || {};
        const planeGroup = options.planeGroup || null;
        const environmentMeshes = Array.isArray(options.environmentMeshes) ? options.environmentMeshes : null;
        ensureFloorTileGeometries(THREE, sharedGeometries);

        floorData.iStone = createFloorTileInstancedMesh(THREE, sharedGeometries.floorTileBox, sharedMaterials.floor7, stoneCount, floorData.stoneMap);
        floorData.iWood = createFloorTileInstancedMesh(THREE, sharedGeometries.floorTileBox, sharedMaterials.floor6, woodCount, floorData.woodMap);
        floorData.iBrick = createFloorTileInstancedMesh(THREE, sharedGeometries.floorTileBox, sharedMaterials.floor8, brickCount, floorData.brickMap);

        [floorData.iStone, floorData.iWood, floorData.iBrick].forEach((mesh) => {
            if (!mesh) return;
            if (planeGroup) planeGroup.add(mesh);
            if (environmentMeshes) environmentMeshes.push(mesh);
        });

        return floorData;
    }

    function appendFloorTileVisualState(options = {}) {
        const floorData = options.floorData || {};
        const dummyTransform = options.dummyTransform;
        if (!dummyTransform) return false;
        const bucket = getFloorTileRenderBucket(options);
        if (!bucket) return false;
        const meshKey = bucket === 'wood' ? 'iWood' : (bucket === 'brick' ? 'iBrick' : 'iStone');
        const mapKey = bucket === 'wood' ? 'woodMap' : (bucket === 'brick' ? 'brickMap' : 'stoneMap');
        const indexKey = bucket === 'wood' ? 'woodIndex' : (bucket === 'brick' ? 'brickIndex' : 'stoneIndex');
        const mesh = floorData[meshKey];
        const instanceMap = floorData[mapKey];
        const index = floorData[indexKey] || 0;
        if (!mesh || !Array.isArray(instanceMap)) return false;

        const heightMap = options.heightMap || [];
        const x = options.x;
        const y = options.y;
        const z = options.z;
        const zOffset = Number.isFinite(options.zOffset) ? options.zOffset : 0;
        const floorHeight = heightMap[z] && heightMap[z][y] ? heightMap[z][y][x] : 0;
        const minThickness = 0.08;
        const thickness = floorHeight > 0 ? floorHeight : minThickness;
        const centerY = zOffset + (floorHeight > 0 ? (floorHeight / 2) : (floorHeight - (thickness / 2)));
        dummyTransform.position.set(x, centerY, y);
        dummyTransform.rotation.set(0, 0, 0);
        dummyTransform.scale.set(1, thickness, 1);
        dummyTransform.updateMatrix();
        mesh.setMatrixAt(index, dummyTransform.matrix);
        instanceMap[index] = { type: 'GROUND', gridX: x, gridY: y, z };
        floorData[indexKey] = index + 1;
        return true;
    }

    function markFloorTileRenderDataDirty(floorData) {
        if (!floorData) return;
        if (floorData.iStone) {
            floorData.iStone.count = floorData.stoneIndex;
            floorData.iStone.instanceMatrix.needsUpdate = true;
        }
        if (floorData.iWood) {
            floorData.iWood.count = floorData.woodIndex;
            floorData.iWood.instanceMatrix.needsUpdate = true;
        }
        if (floorData.iBrick) {
            floorData.iBrick.count = floorData.brickIndex;
            floorData.iBrick.instanceMatrix.needsUpdate = true;
        }
    }

    function isFenceNeighbor(options, dx, dy) {
        const logicalMap = options && options.logicalMap;
        const getVisualTileId = options && options.getVisualTileId;
        const isFenceConnectorTile = options && options.isFenceConnectorTile;
        const mapSize = Number.isFinite(options && options.mapSize) ? options.mapSize : 0;
        const x = options && options.x;
        const y = options && options.y;
        const z = options && options.z;
        const nx = x + dx;
        const ny = y + dy;
        if (!logicalMap || typeof getVisualTileId !== 'function' || typeof isFenceConnectorTile !== 'function') {
            return false;
        }
        if (nx < 0 || ny < 0 || nx >= mapSize || ny >= mapSize) return false;
        if (!logicalMap[z] || !logicalMap[z][ny]) return false;
        return isFenceConnectorTile(getVisualTileId(logicalMap[z][ny][nx], nx, ny, z));
    }

    function resolveFenceConnections(options) {
        return {
            hasNorth: isFenceNeighbor(options, 0, -1),
            hasSouth: isFenceNeighbor(options, 0, 1),
            hasWest: isFenceNeighbor(options, -1, 0),
            hasEast: isFenceNeighbor(options, 1, 0),
            hasNorthWest: isFenceNeighbor(options, -1, -1),
            hasNorthEast: isFenceNeighbor(options, 1, -1),
            hasSouthWest: isFenceNeighbor(options, -1, 1),
            hasSouthEast: isFenceNeighbor(options, 1, 1)
        };
    }

    function createFenceVisualGroup(options) {
        const THREE = requireThree(options && options.THREE);
        const sharedMaterials = options && options.sharedMaterials ? options.sharedMaterials : {};
        const environmentMeshes = options && options.environmentMeshes;
        const x = options && options.x;
        const y = options && options.y;
        const z = options && options.z;
        const zOffset = Number.isFinite(options && options.zOffset) ? options.zOffset : 0;
        const baseHeight = Number.isFinite(options && options.baseHeight) ? options.baseHeight : 0;
        const group = new THREE.Group();
        group.position.set(x, zOffset + baseHeight, y);
        const postMaterial = sharedMaterials.fenceWood || sharedMaterials.boothWood;
        const railMaterial = sharedMaterials.boothWood || postMaterial;

        const connections = resolveFenceConnections(options);

        const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.05, 0.18), postMaterial);
        post.position.set(0, 0.525, 0);
        post.castShadow = true;
        post.receiveShadow = true;
        group.add(post);

        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, 0.26), postMaterial);
        cap.position.set(0, 1.11, 0);
        cap.castShadow = true;
        cap.receiveShadow = true;
        group.add(cap);

        const addFenceRail = (dx, dz, railY) => {
            const length = Math.sqrt((dx * dx) + (dz * dz));
            const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.11, 0.12), railMaterial);
            rail.position.set(dx / 2, railY, dz / 2);
            rail.rotation.y = -Math.atan2(dz, dx);
            rail.castShadow = true;
            rail.receiveShadow = true;
            group.add(rail);
        };

        const addFenceSegment = (dx, dz) => {
            addFenceRail(dx, dz, 0.44);
            addFenceRail(dx, dz, 0.72);
        };

        if (connections.hasEast) addFenceSegment(1, 0);
        if (connections.hasSouth) addFenceSegment(0, 1);
        if (connections.hasSouthEast) addFenceSegment(1, 1);
        if (connections.hasSouthWest) addFenceSegment(-1, 1);

        group.children.forEach((child) => {
            child.userData = { type: 'WALL', gridX: x, gridY: y, z: z };
            if (Array.isArray(environmentMeshes)) environmentMeshes.push(child);
        });
        return group;
    }

    function ensureFenceGeometries(THREE, sharedGeometries) {
        if (!sharedGeometries.fencePost) sharedGeometries.fencePost = new THREE.BoxGeometry(0.18, 1.05, 0.18);
        if (!sharedGeometries.fenceCap) sharedGeometries.fenceCap = new THREE.BoxGeometry(0.26, 0.12, 0.26);
        if (!sharedGeometries.fenceRail) sharedGeometries.fenceRail = new THREE.BoxGeometry(1, 0.11, 0.12);
    }

    function createFenceInstancedMesh(THREE, geometry, material, count, instanceMap) {
        if (!geometry || !material || count <= 0) return null;
        const mesh = new THREE.InstancedMesh(geometry, material, count);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.matrixAutoUpdate = false;
        mesh.frustumCulled = false;
        mesh.count = 0;
        mesh.userData = { instanceMap };
        return mesh;
    }

    function createFenceRenderData(options = {}) {
        const fenceCount = Number.isFinite(options.fenceCount) ? Math.max(0, Math.floor(options.fenceCount)) : 0;
        const fenceData = {
            postIndex: 0,
            capIndex: 0,
            railIndex: 0,
            postMap: [],
            capMap: [],
            railMap: [],
            iPost: null,
            iCap: null,
            iRail: null
        };
        if (fenceCount <= 0) return fenceData;

        const THREE = requireThree(options.THREE);
        const sharedGeometries = options.sharedGeometries || {};
        const sharedMaterials = options.sharedMaterials || {};
        const planeGroup = options.planeGroup || null;
        const environmentMeshes = Array.isArray(options.environmentMeshes) ? options.environmentMeshes : null;
        const postMaterial = sharedMaterials.fenceWood || sharedMaterials.boothWood;
        const railMaterial = sharedMaterials.boothWood || postMaterial;
        ensureFenceGeometries(THREE, sharedGeometries);

        fenceData.iPost = createFenceInstancedMesh(THREE, sharedGeometries.fencePost, postMaterial, fenceCount, fenceData.postMap);
        fenceData.iCap = createFenceInstancedMesh(THREE, sharedGeometries.fenceCap, postMaterial, fenceCount, fenceData.capMap);
        fenceData.iRail = createFenceInstancedMesh(THREE, sharedGeometries.fenceRail, railMaterial, fenceCount * 8, fenceData.railMap);

        [fenceData.iPost, fenceData.iCap, fenceData.iRail].forEach((mesh) => {
            if (!mesh) return;
            if (planeGroup) planeGroup.add(mesh);
            if (environmentMeshes) environmentMeshes.push(mesh);
        });

        return fenceData;
    }

    function setFenceInstance(mesh, instanceMap, index, dummyTransform, tileMeta) {
        if (!mesh || !dummyTransform) return index;
        mesh.setMatrixAt(index, dummyTransform.matrix);
        instanceMap[index] = tileMeta;
        return index + 1;
    }

    function appendFenceRailInstance(fenceData, dummyTransform, x, baseY, y, dx, dz, railY, tileMeta) {
        if (!fenceData || !fenceData.iRail || !dummyTransform) return;
        const length = Math.sqrt((dx * dx) + (dz * dz));
        dummyTransform.position.set(x + (dx / 2), baseY + railY, y + (dz / 2));
        dummyTransform.rotation.set(0, -Math.atan2(dz, dx), 0);
        dummyTransform.scale.set(length, 1, 1);
        dummyTransform.updateMatrix();
        fenceData.railIndex = setFenceInstance(
            fenceData.iRail,
            fenceData.railMap,
            fenceData.railIndex,
            dummyTransform,
            tileMeta
        );
    }

    function appendFenceSegmentInstances(fenceData, dummyTransform, x, baseY, y, dx, dz, tileMeta) {
        appendFenceRailInstance(fenceData, dummyTransform, x, baseY, y, dx, dz, 0.44, tileMeta);
        appendFenceRailInstance(fenceData, dummyTransform, x, baseY, y, dx, dz, 0.72, tileMeta);
    }

    function appendFenceVisualState(options = {}) {
        const fenceData = options.fenceData || {};
        const dummyTransform = options.dummyTransform;
        const x = options.x;
        const y = options.y;
        const z = options.z;
        const zOffset = Number.isFinite(options.zOffset) ? options.zOffset : 0;
        const baseHeight = Number.isFinite(options.baseHeight) ? options.baseHeight : 0;
        if (!dummyTransform || (!fenceData.iPost && !fenceData.iCap && !fenceData.iRail)) return false;

        const tileMeta = { type: 'WALL', gridX: x, gridY: y, z };
        const baseY = zOffset + baseHeight;
        const connections = resolveFenceConnections(options);

        dummyTransform.position.set(x, baseY + 0.525, y);
        dummyTransform.rotation.set(0, 0, 0);
        dummyTransform.scale.set(1, 1, 1);
        dummyTransform.updateMatrix();
        fenceData.postIndex = setFenceInstance(
            fenceData.iPost,
            fenceData.postMap,
            fenceData.postIndex,
            dummyTransform,
            tileMeta
        );

        dummyTransform.position.set(x, baseY + 1.11, y);
        dummyTransform.rotation.set(0, 0, 0);
        dummyTransform.scale.set(1, 1, 1);
        dummyTransform.updateMatrix();
        fenceData.capIndex = setFenceInstance(
            fenceData.iCap,
            fenceData.capMap,
            fenceData.capIndex,
            dummyTransform,
            tileMeta
        );

        if (connections.hasEast) appendFenceSegmentInstances(fenceData, dummyTransform, x, baseY, y, 1, 0, tileMeta);
        if (connections.hasSouth) appendFenceSegmentInstances(fenceData, dummyTransform, x, baseY, y, 0, 1, tileMeta);
        if (connections.hasSouthEast) appendFenceSegmentInstances(fenceData, dummyTransform, x, baseY, y, 1, 1, tileMeta);
        if (connections.hasSouthWest) appendFenceSegmentInstances(fenceData, dummyTransform, x, baseY, y, -1, 1, tileMeta);
        return true;
    }

    function markFenceRenderDataDirty(fenceData) {
        if (!fenceData) return;
        if (fenceData.iPost) {
            fenceData.iPost.count = fenceData.postIndex;
            fenceData.iPost.instanceMatrix.needsUpdate = true;
        }
        if (fenceData.iCap) {
            fenceData.iCap.count = fenceData.capIndex;
            fenceData.iCap.instanceMatrix.needsUpdate = true;
        }
        if (fenceData.iRail) {
            fenceData.iRail.count = fenceData.railIndex;
            fenceData.iRail.instanceMatrix.needsUpdate = true;
        }
    }

    function createCastleRenderData(options = {}) {
        const THREE = requireThree(options.THREE);
        const sharedGeometries = options.sharedGeometries || {};
        const sharedMaterials = options.sharedMaterials || {};
        const planeGroup = options.planeGroup;
        const environmentMeshes = options.environmentMeshes;
        const wallCount = Number.isFinite(options.wallCount) ? options.wallCount : 0;
        const towerCount = Number.isFinite(options.towerCount) ? options.towerCount : 0;
        const castleData = { wallMap: [], iWall: null, towerMap: [], iTower: null };
        if (wallCount > 0) {
            castleData.iWall = new THREE.InstancedMesh(sharedGeometries.castleWall, sharedMaterials.castleStone, wallCount);
            castleData.iWall.castShadow = true;
            castleData.iWall.receiveShadow = true;
            castleData.iWall.matrixAutoUpdate = false;
            castleData.iWall.userData = { instanceMap: castleData.wallMap };
            if (planeGroup) planeGroup.add(castleData.iWall);
            if (Array.isArray(environmentMeshes)) environmentMeshes.push(castleData.iWall);
        }
        if (towerCount > 0) {
            castleData.iTower = new THREE.InstancedMesh(sharedGeometries.castleTower, sharedMaterials.castleStone, towerCount);
            castleData.iTower.castShadow = true;
            castleData.iTower.receiveShadow = true;
            castleData.iTower.matrixAutoUpdate = false;
            castleData.iTower.userData = { instanceMap: castleData.towerMap };
            if (planeGroup) planeGroup.add(castleData.iTower);
            if (Array.isArray(environmentMeshes)) environmentMeshes.push(castleData.iTower);
        }
        return castleData;
    }

    function isCastleTile(options, tx, ty) {
        const logicalMap = options.logicalMap || [];
        const TileId = options.TileId || {};
        const mapSize = Number.isFinite(options.mapSize) ? options.mapSize : 0;
        const z = options.z;
        if (tx < 0 || ty < 0 || tx >= mapSize || ty >= mapSize) return false;
        if (!logicalMap[z] || !logicalMap[z][ty]) return false;
        const neighborTile = logicalMap[z][ty][tx];
        return neighborTile === TileId.WALL || neighborTile === TileId.TOWER;
    }

    function setCastleWallVisualState(options = {}) {
        const castleData = options.castleData || {};
        const dummyTransform = options.dummyTransform;
        const wallIndex = Number.isFinite(options.wallIndex) ? options.wallIndex : 0;
        const x = options.x;
        const y = options.y;
        const z = options.z;
        const zOffset = Number.isFinite(options.zOffset) ? options.zOffset : 0;
        if (!castleData.iWall || !dummyTransform) return wallIndex;

        const hasNorth = isCastleTile(options, x, y - 1);
        const hasSouth = isCastleTile(options, x, y + 1);
        const hasWest = isCastleTile(options, x - 1, y);
        const hasEast = isCastleTile(options, x + 1, y);
        const linkNS = hasNorth || hasSouth;
        const linkEW = hasWest || hasEast;
        const wallThin = 1.0;

        dummyTransform.position.set(x, zOffset, y);
        dummyTransform.rotation.set(0, 0, 0);
        if (linkNS && !linkEW) dummyTransform.scale.set(wallThin, 1, 1);
        else if (linkEW && !linkNS) dummyTransform.scale.set(1, 1, wallThin);
        else if (!linkNS && !linkEW) dummyTransform.scale.set(0.88, 1, 0.88);
        else dummyTransform.scale.set(1, 1, 1);
        dummyTransform.updateMatrix();
        castleData.iWall.setMatrixAt(wallIndex, dummyTransform.matrix);
        castleData.wallMap[wallIndex] = { type: 'WALL', gridX: x, gridY: y, z };
        return wallIndex + 1;
    }

    function setCastleTowerVisualState(options = {}) {
        const castleData = options.castleData || {};
        const dummyTransform = options.dummyTransform;
        const towerIndex = Number.isFinite(options.towerIndex) ? options.towerIndex : 0;
        const x = options.x;
        const y = options.y;
        const z = options.z;
        const zOffset = Number.isFinite(options.zOffset) ? options.zOffset : 0;
        if (!castleData.iTower || !dummyTransform) return towerIndex;
        dummyTransform.position.set(x, zOffset, y);
        dummyTransform.rotation.set(0, 0, 0);
        dummyTransform.scale.set(1, 1, 1);
        dummyTransform.updateMatrix();
        castleData.iTower.setMatrixAt(towerIndex, dummyTransform.matrix);
        castleData.towerMap[towerIndex] = { type: 'TOWER', gridX: x, gridY: y, z };
        return towerIndex + 1;
    }

    function markCastleRenderDataDirty(castleData) {
        if (!castleData) return;
        if (castleData.iWall) castleData.iWall.instanceMatrix.needsUpdate = true;
        if (castleData.iTower) castleData.iTower.instanceMatrix.needsUpdate = true;
    }

    function appendShopCounterVisual(options = {}) {
        const THREE = requireThree(options.THREE);
        const sharedMaterials = options.sharedMaterials || {};
        const logicalMap = options.logicalMap || [];
        const heightMap = options.heightMap || [];
        const TileId = options.TileId || {};
        const planeGroup = options.planeGroup;
        const environmentMeshes = options.environmentMeshes;
        const mapSize = Number.isFinite(options.mapSize) ? options.mapSize : 0;
        const x = options.x;
        const y = options.y;
        const z = options.z;
        const zOffset = Number.isFinite(options.zOffset) ? options.zOffset : 0;
        if (!planeGroup) return false;

        const tileHeight = heightMap[z] && heightMap[z][y] ? heightMap[z][y][x] : 0;
        const counterGroup = new THREE.Group();
        counterGroup.position.set(x, tileHeight + zOffset, y);
        if (
            (y > 0 && logicalMap[z][y - 1][x] === TileId.SHOP_COUNTER)
            || (y < mapSize - 1 && logicalMap[z][y + 1][x] === TileId.SHOP_COUNTER)
        ) {
            counterGroup.rotation.y = Math.PI / 2;
        }

        const counter = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.8), sharedMaterials.boothWood);
        counter.position.y = 0.5;
        counter.castShadow = true;
        counter.receiveShadow = true;
        const glass = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.7), sharedMaterials.shopCounterGlass);
        glass.position.y = 1.025;
        glass.receiveShadow = true;
        counterGroup.add(counter, glass);
        counterGroup.children.forEach((child) => {
            child.userData = { type: 'SHOP_COUNTER', gridX: x, gridY: y, z };
            if (Array.isArray(environmentMeshes)) environmentMeshes.push(child);
        });
        planeGroup.add(counterGroup);

        const floorMesh = createTopAnchoredFloorMesh({
            THREE,
            material: sharedMaterials.floor7,
            x,
            y,
            z,
            zOffset,
            topHeight: tileHeight
        });
        planeGroup.add(floorMesh);
        if (Array.isArray(environmentMeshes)) environmentMeshes.push(floorMesh);
        return true;
    }

    function appendFloorTileVisual(options = {}) {
        const THREE = requireThree(options.THREE);
        const sharedMaterials = options.sharedMaterials || {};
        const logicalMap = options.logicalMap || [];
        const heightMap = options.heightMap || [];
        const TileId = options.TileId || {};
        const planeGroup = options.planeGroup;
        const environmentMeshes = options.environmentMeshes;
        const isPierDeckTile = typeof options.isPierDeckTile === 'function' ? options.isPierDeckTile : () => false;
        const pierConfig = options.pierConfig || null;
        const x = options.x;
        const y = options.y;
        const z = options.z;
        const zOffset = Number.isFinite(options.zOffset) ? options.zOffset : 0;
        if (!planeGroup) return false;
        const rawTile = logicalMap[z] && logicalMap[z][y] ? logicalMap[z][y][x] : null;
        const visualTile = options.visualTile;
        const floorTile = rawTile === TileId.SOLID_NPC || rawTile === TileId.OBSTACLE ? visualTile : rawTile;
        if (floorTile === TileId.SOLID_NPC) return true;
        if (floorTile === TileId.OBSTACLE) return true;
        if (floorTile === TileId.GRASS || floorTile === TileId.DIRT || floorTile === TileId.SHORE) return true;
        if (floorTile === TileId.FLOOR_WOOD && isPierDeckTile(pierConfig, x, y, z)) return true;
        let floorMat = sharedMaterials.floor7;
        if (floorTile === TileId.FLOOR_WOOD) floorMat = sharedMaterials.floor6;
        if (floorTile === TileId.FLOOR_BRICK) floorMat = sharedMaterials.floor8;
        const floorHeight = heightMap[z] && heightMap[z][y] ? heightMap[z][y][x] : 0;
        const floorMesh = createTopAnchoredFloorMesh({
            THREE,
            material: floorMat,
            x,
            y,
            z,
            zOffset,
            topHeight: floorHeight
        });
        planeGroup.add(floorMesh);
        if (Array.isArray(environmentMeshes)) environmentMeshes.push(floorMesh);
        return true;
    }

    function appendStairBlockVisual(options = {}) {
        const THREE = requireThree(options.THREE);
        const sharedMaterials = options.sharedMaterials || {};
        const heightMap = options.heightMap || [];
        const TileId = options.TileId || {};
        const planeGroup = options.planeGroup;
        const environmentMeshes = options.environmentMeshes;
        const x = options.x;
        const y = options.y;
        const z = options.z;
        const zOffset = Number.isFinite(options.zOffset) ? options.zOffset : 0;
        const tile = options.visualTile;
        if (!planeGroup) return false;
        const isUp = tile === TileId.STAIRS_UP;
        const floorHeight = (heightMap[z] && heightMap[z][y] ? heightMap[z][y][x] : 0) || 0.5;
        const stairMesh = new THREE.Mesh(new THREE.BoxGeometry(1, floorHeight, 1), isUp ? sharedMaterials.stairsUp : sharedMaterials.stairsDown);
        stairMesh.position.set(x, zOffset + (floorHeight / 2), y);
        stairMesh.castShadow = true;
        stairMesh.receiveShadow = true;
        stairMesh.userData = { type: isUp ? 'STAIRS_UP' : 'STAIRS_DOWN', gridX: x, gridY: y, z };
        planeGroup.add(stairMesh);
        if (Array.isArray(environmentMeshes)) environmentMeshes.push(stairMesh);
        return true;
    }

    function appendStairRampVisual(options = {}) {
        const THREE = requireThree(options.THREE);
        const sharedMaterials = options.sharedMaterials || {};
        const heightMap = options.heightMap || [];
        const mapSize = Number.isFinite(options.mapSize) ? options.mapSize : 0;
        const planeGroup = options.planeGroup;
        const environmentMeshes = options.environmentMeshes;
        const x = options.x;
        const y = options.y;
        const z = options.z;
        const zOffset = Number.isFinite(options.zOffset) ? options.zOffset : 0;
        if (!planeGroup || !heightMap[z] || !heightMap[z][y]) return false;

        const stairGroup = new THREE.Group();
        stairGroup.position.set(x, zOffset, y);
        const currentHeight = heightMap[z][y][x];
        if (x > 0 && heightMap[z][y][x - 1] > currentHeight) stairGroup.rotation.y = Math.PI / 2;
        else if (x < mapSize - 1 && heightMap[z][y][x + 1] > currentHeight) stairGroup.rotation.y = -Math.PI / 2;
        else if (y < mapSize - 1 && heightMap[z][y + 1][x] > currentHeight) stairGroup.rotation.y = Math.PI;

        const steps = 3;
        const stepDepth = 1.0 / steps;
        const stepHeight = 0.5 / steps;
        const baseHeight = currentHeight - 0.25;
        if (baseHeight > 0) {
            const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(1, baseHeight, 1), sharedMaterials.floor7);
            baseMesh.position.set(0, baseHeight / 2, 0);
            baseMesh.receiveShadow = true;
            baseMesh.castShadow = true;
            baseMesh.userData = { type: 'GROUND', gridX: x, gridY: y, z };
            stairGroup.add(baseMesh);
            if (Array.isArray(environmentMeshes)) environmentMeshes.push(baseMesh);
        }
        for (let i = 0; i < steps; i++) {
            const currentStepOffset = stepHeight * (i + 1);
            const currentStepHeight = baseHeight + currentStepOffset;
            const zCenter = 0.5 - stepDepth * (i + 0.5);
            const yCenter = currentStepHeight / 2;
            const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(1, currentStepHeight, stepDepth), sharedMaterials.floor7);
            stepMesh.position.set(0, yCenter, zCenter);
            stepMesh.receiveShadow = true;
            stepMesh.castShadow = true;
            stepMesh.userData = { type: 'GROUND', gridX: x, gridY: y, z };
            stairGroup.add(stepMesh);
            if (Array.isArray(environmentMeshes)) environmentMeshes.push(stepMesh);
        }
        planeGroup.add(stairGroup);
        return true;
    }

    function createWoodenGateVisualGroup(options) {
        const THREE = requireThree(options && options.THREE);
        const sharedMaterials = options && options.sharedMaterials ? options.sharedMaterials : {};
        const gate = options && options.door;
        const zOffset = Number.isFinite(options && options.zOffset) ? options.zOffset : 0;
        const baseHeight = Number.isFinite(options && options.baseHeight) ? options.baseHeight : 0;
        if (!gate) return null;
        const group = new THREE.Group();
        group.position.set(gate.x + (gate.hingeOffsetX || 0), zOffset + baseHeight, gate.y + (gate.hingeOffsetY || 0));
        group.rotation.y = gate.currentRotation;
        const postMaterial = sharedMaterials.fenceWood || sharedMaterials.boothWood;
        const railMaterial = sharedMaterials.boothWood || postMaterial;
        const metalMaterial = sharedMaterials.rockIron || sharedMaterials.anvilIron || railMaterial;
        const gateWidth = Number.isFinite(gate.width) ? gate.width : 1;
        const meshOffsetX = gate.hingeOffsetX ? -gate.hingeOffsetX : 0;
        const meshOffsetZ = gate.hingeOffsetY ? -gate.hingeOffsetY : 0;
        const railW = gate.isEW ? gateWidth : 0.12;
        const railD = gate.isEW ? 0.12 : gateWidth;
        const slatW = gate.isEW ? 0.12 : 0.14;
        const slatD = gate.isEW ? 0.14 : 0.12;

        const addBox = (width, height, depth, material, px, py, pz) => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
            mesh.position.set(px, py, pz);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            group.add(mesh);
            return mesh;
        };

        const addSlat = (offset) => {
            addBox(
                slatW,
                1.02,
                slatD,
                postMaterial,
                meshOffsetX + (gate.isEW ? offset : 0),
                0.51,
                meshOffsetZ + (gate.isEW ? 0 : offset)
            );
        };

        addSlat(-gateWidth * 0.38);
        addSlat(0);
        addSlat(gateWidth * 0.38);
        addBox(railW, 0.13, railD, railMaterial, meshOffsetX, 0.38, meshOffsetZ);
        addBox(railW, 0.13, railD, railMaterial, meshOffsetX, 0.68, meshOffsetZ);
        addBox(railW * (gate.isEW ? 0.78 : 1), 0.11, railD * (gate.isEW ? 1 : 0.78), railMaterial, meshOffsetX, 0.92, meshOffsetZ);

        const braceLength = Math.sqrt((gateWidth * 0.82 * gateWidth * 0.82) + (0.48 * 0.48));
        const braceAngle = Math.atan2(0.48, gateWidth * 0.82);
        const brace = gate.isEW
            ? new THREE.Mesh(new THREE.BoxGeometry(braceLength, 0.1, 0.1), railMaterial)
            : new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, braceLength), railMaterial);
        brace.position.set(meshOffsetX, 0.63, meshOffsetZ);
        if (gate.isEW) brace.rotation.z = braceAngle;
        else brace.rotation.x = -braceAngle;
        brace.castShadow = true;
        brace.receiveShadow = true;
        group.add(brace);

        addBox(
            gate.isEW ? 0.12 : 0.08,
            0.08,
            gate.isEW ? 0.08 : 0.12,
            metalMaterial,
            meshOffsetX + (gate.isEW ? gateWidth * 0.32 : 0.07),
            0.66,
            meshOffsetZ + (gate.isEW ? 0.07 : gateWidth * 0.32)
        );

        const hitbox = new THREE.Mesh(new THREE.BoxGeometry(gate.isEW ? gateWidth : 0.6, 1.2, gate.isEW ? 0.6 : gateWidth), sharedMaterials.hiddenHitbox);
        hitbox.position.set(meshOffsetX, 0.6, meshOffsetZ);
        group.add(hitbox);
        mergeStaticVisualDescendantsByMaterial(THREE, group, { excludedMaterial: sharedMaterials.hiddenHitbox });
        return group;
    }

    function chunkIntersectsRoof(roof, startX, startY, endX, endY, z) {
        if (!roof || roof.z !== z) return false;
        const xMin = roof.x;
        const xMax = roof.x + Math.max(1, roof.width) - 1;
        const yMin = roof.y;
        const yMax = roof.y + Math.max(1, roof.depth) - 1;
        return xMax >= startX && xMin < endX && yMax >= startY && yMin < endY;
    }

    function createRoofVisualGroup(options) {
        const THREE = requireThree(options && options.THREE);
        const sharedMaterials = options && options.sharedMaterials ? options.sharedMaterials : {};
        const roof = options && options.roof;
        const zOffset = Number.isFinite(options && options.zOffset) ? options.zOffset : 0;
        if (!roof) return null;
        const width = Math.max(1, Number.isFinite(roof.width) ? roof.width : 1);
        const depth = Math.max(1, Number.isFinite(roof.depth) ? roof.depth : 1);
        const height = Number.isFinite(roof.height) ? roof.height : 2.3;
        const roofMat = (sharedMaterials.roofThatch || sharedMaterials.boothWood).clone();
        roofMat.transparent = true;
        roofMat.opacity = 1;
        roofMat.side = THREE.DoubleSide;
        const group = new THREE.Group();
        group.position.set(roof.x + ((width - 1) / 2), zOffset + height, roof.y + ((depth - 1) / 2));
        group.userData = {
            roofLandmark: roof,
            roofMaterial: roofMat,
            targetOpacity: 1
        };

        const ridgeAlongX = roof.ridgeAxis !== 'y';
        const roofWidth = width + 1.2;
        const roofDepth = depth + 1.2;
        const halfWidth = roofWidth / 2;
        const halfDepth = roofDepth / 2;
        const ridgeRise = Math.max(1.15, Math.min(2.35, (ridgeAlongX ? roofDepth : roofWidth) * 0.22));
        let vertices = null;
        let indices = null;
        if (ridgeAlongX) {
            vertices = [
                -halfWidth, 0, -halfDepth,
                halfWidth, 0, -halfDepth,
                -halfWidth, 0, halfDepth,
                halfWidth, 0, halfDepth,
                -halfWidth, ridgeRise, 0,
                halfWidth, ridgeRise, 0
            ];
            indices = [
                0, 1, 5, 0, 5, 4,
                4, 5, 3, 4, 3, 2,
                0, 4, 2,
                1, 3, 5
            ];
        } else {
            vertices = [
                -halfWidth, 0, -halfDepth,
                -halfWidth, 0, halfDepth,
                halfWidth, 0, -halfDepth,
                halfWidth, 0, halfDepth,
                0, ridgeRise, -halfDepth,
                0, ridgeRise, halfDepth
            ];
            indices = [
                0, 4, 5, 0, 5, 1,
                4, 2, 3, 4, 3, 5,
                0, 2, 4,
                1, 5, 3
            ];
        }
        const roofGeo = new THREE.BufferGeometry();
        roofGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        roofGeo.setIndex(indices);
        roofGeo.computeVertexNormals();
        const roofMesh = new THREE.Mesh(roofGeo, roofMat);
        roofMesh.castShadow = true;
        roofMesh.receiveShadow = true;
        roofMesh.userData = { type: 'ROOF', gridX: roof.x, gridY: roof.y, z: roof.z };
        group.add(roofMesh);
        return group;
    }

    function isEntryInChunk(entry, startX, startY, endX, endY, z) {
        return !!(
            entry
            && entry.x >= startX
            && entry.x < endX
            && entry.y >= startY
            && entry.y < endY
            && entry.z === z
        );
    }

    function createBankBoothVisualGroup(options) {
        const THREE = requireThree(options && options.THREE);
        const sharedMaterials = options && options.sharedMaterials ? options.sharedMaterials : {};
        const booth = options && options.booth;
        const baseY = Number.isFinite(options && options.baseY) ? options.baseY : 0;
        if (!booth) return null;
        const boothGroup = new THREE.Group();
        boothGroup.position.set(booth.x, baseY, booth.y);
        const counter = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.1, 0.6), sharedMaterials.boothWood);
        counter.position.set(0, 0.55, 0);
        counter.castShadow = true;
        counter.receiveShadow = true;
        boothGroup.add(counter);
        const pL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.0, 0.6), sharedMaterials.boothWood);
        pL.position.set(-0.425, 1.6, 0);
        pL.castShadow = true;
        pL.receiveShadow = true;
        boothGroup.add(pL);
        const pR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.0, 0.6), sharedMaterials.boothWood);
        pR.position.set(0.425, 1.6, 0);
        pR.castShadow = true;
        pR.receiveShadow = true;
        boothGroup.add(pR);
        const sign = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.4, 0.6), sharedMaterials.boothWood);
        sign.position.set(0, 2.3, 0);
        sign.castShadow = true;
        sign.receiveShadow = true;
        boothGroup.add(sign);
        const bankTextPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.2), sharedMaterials.bankTexPlaneMat);
        bankTextPlane.position.set(0, 2.3, 0.31);
        boothGroup.add(bankTextPlane);
        mergeStaticVisualChildrenByMaterial(THREE, boothGroup);
        return boothGroup;
    }

    function registerFurnaceEffectMaterial(sharedMaterials, material, config) {
        if (!sharedMaterials || !material) return;
        if (!Array.isArray(sharedMaterials.furnaceEffectMaterials)) sharedMaterials.furnaceEffectMaterials = [];
        sharedMaterials.furnaceEffectMaterials.push(Object.assign({ material }, config || null));
    }

    function getSharedFurnaceEffectMaterial(sharedMaterials, key, createMaterial, config) {
        if (!sharedMaterials) return null;
        if (sharedMaterials[key]) return sharedMaterials[key];
        const material = typeof createMaterial === 'function' ? createMaterial() : null;
        if (!material) return null;
        sharedMaterials[key] = material;
        registerFurnaceEffectMaterial(sharedMaterials, material, config);
        return material;
    }

    function updateFurnaceVisualEffects(options) {
        const sharedMaterials = options && options.sharedMaterials ? options.sharedMaterials : null;
        const frameNowMs = Number.isFinite(options && options.frameNowMs) ? options.frameNowMs : 0;
        const effects = sharedMaterials && Array.isArray(sharedMaterials.furnaceEffectMaterials)
            ? sharedMaterials.furnaceEffectMaterials
            : [];
        for (let i = 0; i < effects.length; i++) {
            const effect = effects[i];
            const material = effect && effect.material;
            if (!material) continue;
            const phase = Number.isFinite(effect.phase) ? effect.phase : 0;
            const speed = Number.isFinite(effect.speed) ? effect.speed : 1;
            const pulse = 0.5 + (Math.sin((frameNowMs * 0.0042 * speed) + phase) * 0.5);
            if (Number.isFinite(effect.baseOpacity) && Number.isFinite(effect.opacityRange)) {
                material.opacity = effect.baseOpacity + (pulse * effect.opacityRange);
            }
            if (Number.isFinite(effect.baseEmissiveIntensity) && Number.isFinite(effect.emissiveRange)) {
                material.emissiveIntensity = effect.baseEmissiveIntensity + (pulse * effect.emissiveRange);
            }
        }
    }

    function getFurnaceInteractionTile(furnace) {
        const fw = Number.isFinite(furnace && furnace.footprintW) ? Math.max(1, Math.round(furnace.footprintW)) : 1;
        const fd = Number.isFinite(furnace && furnace.footprintD) ? Math.max(1, Math.round(furnace.footprintD)) : 1;
        return {
            x: (furnace && Number.isFinite(furnace.x) ? furnace.x : 0) + Math.floor((fw - 1) / 2),
            y: (furnace && Number.isFinite(furnace.y) ? furnace.y : 0) + Math.floor((fd - 1) / 2)
        };
    }

    function resolveFurnaceFrontStep(furnace) {
        const yaw = Number.isFinite(furnace && furnace.facingYaw) ? furnace.facingYaw : 0;
        const sx = Math.sin(yaw);
        const sy = Math.cos(yaw);
        let dx = Math.round(sx);
        let dy = Math.round(sy);
        if (Math.abs(dx) === Math.abs(dy)) {
            if (Math.abs(sx) >= Math.abs(sy)) dy = 0;
            else dx = 0;
        }
        if (dx === 0 && dy === 0) dy = 1;
        return { dx, dy };
    }

    function createFurnaceVisualGroup(options) {
        const THREE = requireThree(options && options.THREE);
        const sharedMaterials = options && options.sharedMaterials ? options.sharedMaterials : {};
        const furnace = options && options.furnace;
        const baseY = Number.isFinite(options && options.baseY) ? options.baseY : 0;
        if (!furnace) return null;
        const furnaceGroup = new THREE.Group();
        const fw = Number.isFinite(furnace.footprintW) ? furnace.footprintW : 3;
        const fd = Number.isFinite(furnace.footprintD) ? furnace.footprintD : 2;
        const front = resolveFurnaceFrontStep(furnace);
        const frontIsX = Math.abs(front.dx) > 0;
        const bodyLocalW = frontIsX ? fd : fw;
        const bodyLocalD = frontIsX ? fw : fd;
        furnaceGroup.position.set(furnace.x + ((fw - 1) * 0.5), baseY, furnace.y + ((fd - 1) * 0.5));
        if (Number.isFinite(furnace.facingYaw)) furnaceGroup.rotation.y = furnace.facingYaw;
        const brickMat = sharedMaterials.floor8 || sharedMaterials.castleStone;
        const stoneMat = sharedMaterials.floor7 || sharedMaterials.castleStone || brickMat;
        const coalMat = sharedMaterials.caveMouth || sharedMaterials.altarCoal || stoneMat;
        const emberBaseMat = sharedMaterials.altarEmber || brickMat;
        const mouthGlowMat = getSharedFurnaceEffectMaterial(sharedMaterials, 'furnaceMouthGlowMaterial', () => {
            const material = emberBaseMat && emberBaseMat.clone
                ? emberBaseMat.clone()
                : new THREE.MeshLambertMaterial({ color: 0xff7a1a, emissive: 0x7a2e00 });
            material.transparent = true;
            material.opacity = 0.66;
            material.emissive = material.emissive || new THREE.Color(0x7a2e00);
            material.emissiveIntensity = 0.8;
            return material;
        }, {
            baseOpacity: 0.48,
            opacityRange: 0.28,
            baseEmissiveIntensity: 0.55,
            emissiveRange: 0.55,
            phase: 0.72,
            speed: 1.0
        });
        const heatMat = getSharedFurnaceEffectMaterial(sharedMaterials, 'furnaceHeatShimmerMaterial', () => {
            const material = mouthGlowMat && mouthGlowMat.clone
                ? mouthGlowMat.clone()
                : new THREE.MeshLambertMaterial({ color: 0xff9a35, emissive: 0x7a2e00 });
            material.transparent = true;
            material.opacity = 0.18;
            return material;
        }, {
            baseOpacity: 0.10,
            opacityRange: 0.12,
            phase: 1.2,
            speed: 1.35
        });
        const smokeMat = getSharedFurnaceEffectMaterial(sharedMaterials, 'furnaceSmokeHintMaterial', () => new THREE.MeshBasicMaterial({
            color: 0x4f4a43,
            transparent: true,
            opacity: 0.14,
            depthWrite: false
        }), {
            baseOpacity: 0.08,
            opacityRange: 0.09,
            phase: 2.4,
            speed: 0.55
        });

        const base = new THREE.Mesh(new THREE.BoxGeometry(bodyLocalW, 1.5, bodyLocalD), brickMat);
        base.position.set(0, 0.75, 0);
        base.castShadow = true;
        base.receiveShadow = true;
        const frontFrame = new THREE.Mesh(new THREE.BoxGeometry(Math.min(1.45, bodyLocalW - 0.18), 0.84, 0.2), stoneMat);
        frontFrame.position.set(0, 0.86, (bodyLocalD * 0.5) + 0.01);
        frontFrame.castShadow = true;
        frontFrame.receiveShadow = true;
        const mouth = new THREE.Mesh(new THREE.BoxGeometry(Math.min(1.0, bodyLocalW - 0.38), 0.42, 0.08), coalMat);
        mouth.position.set(0, 0.76, (bodyLocalD * 0.5) + 0.12);
        const glow = new THREE.Mesh(new THREE.BoxGeometry(Math.min(0.76, bodyLocalW - 0.52), 0.26, 0.04), mouthGlowMat);
        glow.position.set(0, 0.72, (bodyLocalD * 0.5) + 0.165);
        const lintel = new THREE.Mesh(new THREE.BoxGeometry(Math.min(1.25, bodyLocalW - 0.16), 0.16, 0.24), stoneMat);
        lintel.position.set(0, 1.24, (bodyLocalD * 0.5) + 0.04);
        const leftButtress = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.22, bodyLocalD + 0.08), stoneMat);
        leftButtress.position.set(-(bodyLocalW * 0.5) + 0.08, 0.76, 0);
        const rightButtress = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.22, bodyLocalD + 0.08), stoneMat);
        rightButtress.position.set((bodyLocalW * 0.5) - 0.08, 0.76, 0);
        const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.22, 0.48), stoneMat);
        chimney.position.set(Math.min(0.55, (bodyLocalW * 0.5) - 0.34), 1.86, -((bodyLocalD * 0.5) - 0.42));
        chimney.castShadow = true;
        chimney.receiveShadow = true;
        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.16, 0.62), stoneMat);
        cap.position.set(chimney.position.x, 2.55, chimney.position.z);
        cap.castShadow = true;
        cap.receiveShadow = true;
        const smoke = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.74, 7), smokeMat);
        smoke.position.set(chimney.position.x, 2.98, chimney.position.z);
        smoke.rotation.y = 0.45;
        const heat = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.5), heatMat || mouthGlowMat);
        heat.position.set(0, 1.03, (bodyLocalD * 0.5) + 0.19);
        heat.rotation.x = -0.08;
        const hitbox = new THREE.Mesh(new THREE.BoxGeometry(bodyLocalW, 1.6, bodyLocalD), sharedMaterials.hiddenHitbox);
        hitbox.position.set(0, 0.8, 0);
        furnaceGroup.add(base, frontFrame, mouth, glow, lintel, leftButtress, rightButtress, chimney, cap, smoke, heat, hitbox);
        mergeStaticVisualChildrenByMaterial(THREE, furnaceGroup, { excludedMaterial: sharedMaterials.hiddenHitbox });
        return furnaceGroup;
    }

    function createAnvilVisualGroup(options) {
        const THREE = requireThree(options && options.THREE);
        const sharedMaterials = options && options.sharedMaterials ? options.sharedMaterials : {};
        const anvil = options && options.anvil;
        const baseY = Number.isFinite(options && options.baseY) ? options.baseY : 0;
        if (!anvil) return null;
        const anvilGroup = new THREE.Group();
        anvilGroup.position.set(anvil.x, baseY, anvil.y);
        if (Number.isFinite(anvil.facingYaw)) anvilGroup.rotation.y = anvil.facingYaw;
        const woodMat = sharedMaterials.boothWood || sharedMaterials.floor6;
        const metalMat = sharedMaterials.floor7 || sharedMaterials.rockIron || woodMat;
        const darkMat = sharedMaterials.rockIron || sharedMaterials.floor7 || metalMat;
        const stand = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.42), woodMat);
        stand.position.set(0, 0.275, 0);
        stand.castShadow = true;
        stand.receiveShadow = true;
        const waist = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.16, 0.42), darkMat);
        waist.position.set(0, 0.58, 0);
        waist.castShadow = true;
        waist.receiveShadow = true;
        const top = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.2, 0.48), metalMat);
        top.position.set(-0.06, 0.72, 0);
        top.castShadow = true;
        top.receiveShadow = true;
        const horn = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.22), metalMat);
        horn.position.set(0.58, 0.72, 0);
        horn.scale.set(1.25, 0.72, 0.72);
        horn.castShadow = true;
        horn.receiveShadow = true;
        const heel = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.42), darkMat);
        heel.position.set(-0.63, 0.71, 0);
        heel.castShadow = true;
        heel.receiveShadow = true;
        const hardy = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.026, 0.1), sharedMaterials.caveMouth || darkMat);
        hardy.position.set(0.12, 0.835, 0.08);
        const hitbox = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.8, 1.3), sharedMaterials.hiddenHitbox);
        hitbox.position.set(0, 0.4, 0);
        anvilGroup.add(stand, waist, top, horn, heel, hardy, hitbox);
        mergeStaticVisualChildrenByMaterial(THREE, anvilGroup, { excludedMaterial: sharedMaterials.hiddenHitbox });
        return anvilGroup;
    }

    function createDirectionalSignVisualGroup(options) {
        const THREE = requireThree(options && options.THREE);
        const sharedMaterials = options && options.sharedMaterials ? options.sharedMaterials : {};
        const sign = options && options.sign;
        const baseY = Number.isFinite(options && options.baseY) ? options.baseY : 0;
        if (!sign) return null;
        const signGroup = new THREE.Group();
        signGroup.position.set(sign.x, baseY, sign.y);
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.65, 8), sharedMaterials.boothWood);
        post.position.set(0, 0.82, 0);
        const board = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.9, 0.1), sharedMaterials.boothWood);
        board.position.set(0, 1.55, 0);
        const faceFront = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 0.8), sharedMaterials.directionSignMat);
        faceFront.position.set(0, 1.55, 0.055);
        const faceBack = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 0.8), sharedMaterials.directionSignMat);
        faceBack.position.set(0, 1.55, -0.055);
        faceBack.rotation.y = Math.PI;
        signGroup.add(post, board, faceFront, faceBack);
        mergeStaticVisualChildrenByMaterial(THREE, signGroup);
        return signGroup;
    }

    function createDecorPropVisualGroup(options) {
        const THREE = requireThree(options && options.THREE);
        const sharedMaterials = options && options.sharedMaterials ? options.sharedMaterials : {};
        const sharedGeometries = options && options.sharedGeometries ? options.sharedGeometries : {};
        const prop = options && options.prop;
        const baseY = Number.isFinite(options && options.baseY) ? options.baseY : 0;
        if (!prop || !Number.isFinite(prop.x) || !Number.isFinite(prop.y)) return null;
        const group = new THREE.Group();
        group.position.set(prop.x, baseY, prop.y);
        if (Number.isFinite(prop.facingYaw)) group.rotation.y = prop.facingYaw;
        const createEquipmentVisualMeshes = typeof (options && options.createEquipmentVisualMeshes) === 'function'
            ? options.createEquipmentVisualMeshes
            : ((typeof window !== 'undefined' && typeof window.createEquipmentVisualMeshes === 'function')
                ? window.createEquipmentVisualMeshes
                : null);

        const woodMat = sharedMaterials.boothWood || sharedMaterials.floor7;
        const darkWoodMat = sharedMaterials.fenceWood || woodMat;
        const accentMat = sharedMaterials.rockIron || sharedMaterials.floor7 || woodMat;
        const paperMat = sharedMaterials.parchmentMat || sharedMaterials.directionSignMat || accentMat;
        const noticeMat = sharedMaterials.tutorialNoticeMat || sharedMaterials.directionSignMat || paperMat;
        const strawMat = sharedMaterials.thatchMat || sharedMaterials.floor6 || paperMat;
        const redPaintMat = sharedMaterials.tutorialNoticeMat || accentMat;
        const darkMat = sharedMaterials.caveMouth || darkWoodMat;
        const addBox = (w, h, d, mat, x, y, z) => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
            mesh.position.set(x || 0, y || 0, z || 0);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            group.add(mesh);
            return mesh;
        };
        const addCylinder = (radiusTop, radiusBottom, h, mat, x, y, z, rotationZ) => {
            const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, h, 8), mat);
            mesh.position.set(x || 0, y || 0, z || 0);
            if (Number.isFinite(rotationZ)) mesh.rotation.z = rotationZ;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            group.add(mesh);
            return mesh;
        };
        const addDisk = (radius, depth, mat, x, y, z, segments) => {
            const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, segments || 16), mat);
            mesh.position.set(x || 0, y || 0, z || 0);
            mesh.rotation.x = Math.PI / 2;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            group.add(mesh);
            return mesh;
        };
        const addOreChunk = (geometry, mat, x, y, z, scale, yaw) => {
            const mesh = new THREE.Mesh(geometry || new THREE.DodecahedronGeometry(0.28, 0), mat || accentMat);
            mesh.position.set(x || 0, y || 0, z || 0);
            const scalar = Number.isFinite(scale) ? scale : 1;
            mesh.scale.setScalar(scalar);
            if (Number.isFinite(yaw)) mesh.rotation.y = yaw;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            group.add(mesh);
            return mesh;
        };
        const createToolRackHeldToVerticalQuaternion = () => new THREE.Quaternion()
            .setFromEuler(new THREE.Euler(0.9561333749, -Math.PI / 2, 0))
            .invert();
        const addToolRackAsset = (itemId, x, y, z, scale, rotationZ) => {
            const wrapper = new THREE.Group();
            wrapper.position.set(x, y, z);
            wrapper.scale.setScalar(scale);
            wrapper.rotation.z = Number.isFinite(rotationZ) ? rotationZ : 0;
            let addedRealAsset = false;
            if (createEquipmentVisualMeshes) {
                const meshes = createEquipmentVisualMeshes(itemId, 'axe', [0, 0, 0, 0, 0]);
                if (Array.isArray(meshes) && meshes.length) {
                    const assetGroup = new THREE.Group();
                    meshes.forEach((mesh) => {
                        if (!mesh) return;
                        mesh.castShadow = true;
                        mesh.receiveShadow = true;
                        assetGroup.add(mesh);
                    });
                    const poseGroup = new THREE.Group();
                    poseGroup.quaternion.copy(createToolRackHeldToVerticalQuaternion());
                    poseGroup.add(assetGroup);
                    poseGroup.updateMatrixWorld(true);
                    const bounds = new THREE.Box3().setFromObject(poseGroup);
                    if (!bounds.isEmpty()) {
                        const center = bounds.getCenter(new THREE.Vector3());
                        poseGroup.position.set(-center.x, -center.y, -center.z);
                    }
                    wrapper.add(poseGroup);
                    addedRealAsset = true;
                }
            }
            if (!addedRealAsset) {
                addBox(0.08, 0.72, 0.08, accentMat, x, y, z);
                addBox(0.28, 0.12, 0.12, accentMat, x, y + 0.36, z);
                return;
            }
            group.add(wrapper);
        };

        if (prop.kind === 'desk') {
            addBox(1.8, 0.16, 0.85, woodMat, 0, 0.72, 0);
            addBox(0.16, 0.68, 0.16, darkWoodMat, -0.72, 0.34, -0.28);
            addBox(0.16, 0.68, 0.16, darkWoodMat, 0.72, 0.34, -0.28);
            addBox(0.16, 0.68, 0.16, darkWoodMat, -0.72, 0.34, 0.28);
            addBox(0.16, 0.68, 0.16, darkWoodMat, 0.72, 0.34, 0.28);
            addBox(0.72, 0.025, 0.42, paperMat, 0.22, 0.825, 0.03);
        } else if (prop.kind === 'crate') {
            addBox(0.82, 0.72, 0.82, woodMat, 0, 0.36, 0);
            addBox(0.9, 0.08, 0.9, darkWoodMat, 0, 0.72, 0);
            addBox(0.08, 0.76, 0.9, darkWoodMat, -0.28, 0.38, 0);
            addBox(0.08, 0.76, 0.9, darkWoodMat, 0.28, 0.38, 0);
        } else if (prop.kind === 'tool_rack') {
            addBox(0.16, 1.42, 0.12, darkWoodMat, -0.72, 0.71, -0.1);
            addBox(0.16, 1.42, 0.12, darkWoodMat, 0.72, 0.71, -0.1);
            addBox(1.16, 0.14, 0.1, woodMat, 0, 1.2, 0.08);
            addBox(1.08, 0.1, 0.1, woodMat, 0, 0.56, 0.08);
            addBox(0.11, 0.08, 0.34, darkWoodMat, -0.48, 1.03, 0.27);
            addBox(0.11, 0.08, 0.34, darkWoodMat, 0, 1.03, 0.27);
            addBox(0.11, 0.08, 0.34, darkWoodMat, 0.48, 1.03, 0.27);
            addToolRackAsset('bronze_axe', -0.48, 0.88, 0.43, 1.18, -0.64 + (Math.PI / 2));
            addToolRackAsset('bronze_pickaxe', 0, 0.88, 0.43, 1.14, -0.64 + (Math.PI / 2));
            addToolRackAsset('hammer', 0.48, 0.88, 0.43, 1.44, 0);
        } else if (prop.kind === 'weapon_rack') {
            addBox(0.16, 1.38, 0.12, darkWoodMat, -0.72, 0.69, -0.1);
            addBox(0.16, 1.38, 0.12, darkWoodMat, 0.72, 0.69, -0.1);
            addBox(1.34, 0.14, 0.12, woodMat, 0, 1.18, 0.08);
            addBox(1.22, 0.12, 0.12, woodMat, 0, 0.54, 0.08);
            addBox(0.12, 0.08, 0.34, darkWoodMat, -0.42, 0.96, 0.28);
            addBox(0.12, 0.08, 0.34, darkWoodMat, 0.26, 0.96, 0.28);
            addToolRackAsset('bronze_sword', -0.34, 0.88, 0.43, 1.28, 0.22);
            addToolRackAsset('normal_shortbow', 0.34, 0.88, 0.43, 0.94, -0.18);
            addBox(0.12, 0.48, 0.12, darkWoodMat, 0.02, 0.54, 0.36);
            addBox(0.055, 0.66, 0.055, accentMat, -0.03, 0.76, 0.48, 0);
            addBox(0.055, 0.62, 0.055, accentMat, 0.04, 0.74, 0.48, 0);
        } else if (prop.kind === 'training_dummy') {
            addCylinder(0.12, 0.16, 1.32, darkWoodMat, 0, 0.66, 0);
            addBox(0.88, 0.09, 0.12, darkWoodMat, 0, 1.06, 0);
            addBox(0.44, 0.52, 0.32, strawMat, 0, 0.82, 0.02);
            addBox(0.34, 0.30, 0.30, strawMat, 0, 1.26, 0.02);
            addBox(0.50, 0.08, 0.34, darkWoodMat, 0, 0.98, 0.03);
            addBox(0.12, 0.09, 0.05, redPaintMat, 0, 1.28, 0.19);
            addBox(0.12, 0.035, 0.045, darkMat, 0, 1.19, 0.195);
            addBox(0.82, 0.12, 0.40, darkWoodMat, 0, 0.06, 0);
        } else if (prop.kind === 'archery_target') {
            addBox(0.12, 1.28, 0.12, darkWoodMat, -0.44, 0.64, -0.08);
            addBox(0.12, 1.28, 0.12, darkWoodMat, 0.44, 0.64, -0.08);
            addBox(1.0, 0.12, 0.12, woodMat, 0, 0.34, -0.08);
            addDisk(0.54, 0.10, strawMat, 0, 1.08, 0.02, 18);
            addDisk(0.41, 0.115, redPaintMat, 0, 1.08, 0.08, 18);
            addDisk(0.28, 0.13, paperMat, 0, 1.08, 0.145, 18);
            addDisk(0.13, 0.145, darkMat, 0, 1.08, 0.22, 16);
            addBox(0.055, 0.46, 0.055, accentMat, 0.16, 1.08, 0.34, 0);
            addBox(0.045, 0.15, 0.045, paperMat, 0.16, 1.30, 0.34, 0);
            addBox(0.78, 0.12, 0.42, darkWoodMat, 0, 0.06, -0.12);
        } else if (prop.kind === 'notice_board') {
            addBox(0.14, 1.45, 0.14, darkWoodMat, 0, 0.72, 0);
            addBox(1.45, 0.82, 0.12, woodMat, 0, 1.48, 0);
            addBox(1.24, 0.6, 0.025, noticeMat, 0, 1.48, 0.07);
        } else if (prop.kind === 'chopping_block') {
            addCylinder(0.34, 0.38, 0.46, woodMat, 0, 0.23, 0);
            addCylinder(0.36, 0.36, 0.04, darkWoodMat, 0, 0.48, 0);
            addBox(0.5, 0.025, 0.045, darkWoodMat, 0, 0.515, 0.02);
            addBox(0.34, 0.025, 0.04, darkWoodMat, -0.06, 0.518, -0.12);
        } else if (prop.kind === 'woodpile') {
            addCylinder(0.11, 0.11, 1.05, woodMat, 0, 0.14, -0.18, Math.PI / 2);
            addCylinder(0.11, 0.11, 1.0, woodMat, 0.04, 0.14, 0.08, Math.PI / 2);
            addCylinder(0.1, 0.1, 0.92, woodMat, -0.02, 0.34, -0.04, Math.PI / 2);
            addBox(1.15, 0.08, 0.08, darkWoodMat, 0, 0.08, 0.28);
            addBox(1.15, 0.08, 0.08, darkWoodMat, 0, 0.08, -0.38);
        } else if (prop.kind === 'ore_pile') {
            addOreChunk(sharedGeometries.rockDepleted, sharedMaterials.rockDepleted || accentMat, -0.28, 0.04, 0.02, 0.72, -0.35);
            addOreChunk(sharedGeometries.rockCopper, sharedMaterials.rockCopper || accentMat, -0.05, 0.08, -0.12, 0.72, 0.44);
            addOreChunk(sharedGeometries.rockTin, sharedMaterials.rockTin || accentMat, 0.22, 0.08, 0.04, 0.68, -0.18);
            addOreChunk(sharedGeometries.rockCopper, sharedMaterials.rockCopper || accentMat, 0.05, 0.24, 0.18, 0.48, 0.82);
            addOreChunk(sharedGeometries.rockTin, sharedMaterials.rockTin || accentMat, -0.18, 0.23, 0.18, 0.44, -0.58);
        } else if (prop.kind === 'coal_bin') {
            addBox(1.08, 0.14, 0.86, darkWoodMat, 0, 0.07, 0);
            addBox(0.12, 0.58, 0.82, woodMat, -0.54, 0.36, 0);
            addBox(0.12, 0.58, 0.82, woodMat, 0.54, 0.36, 0);
            addBox(1.08, 0.58, 0.12, woodMat, 0, 0.36, -0.41);
            addBox(1.08, 0.38, 0.12, woodMat, 0, 0.26, 0.41);
            addOreChunk(sharedGeometries.rockCoal, sharedMaterials.rockCoal || accentMat, -0.28, 0.52, -0.08, 0.56, 0.1);
            addOreChunk(sharedGeometries.rockCoal, sharedMaterials.rockCoal || accentMat, 0.04, 0.56, 0.08, 0.58, 0.9);
            addOreChunk(sharedGeometries.rockCoal, sharedMaterials.rockCoal || accentMat, 0.28, 0.48, -0.08, 0.48, -0.42);
        } else if (prop.kind === 'barrel') {
            addCylinder(0.34, 0.34, 0.82, woodMat, 0, 0.41, 0);
            addCylinder(0.355, 0.355, 0.045, darkWoodMat, 0, 0.1, 0);
            addCylinder(0.355, 0.355, 0.045, darkWoodMat, 0, 0.41, 0);
            addCylinder(0.355, 0.355, 0.045, darkWoodMat, 0, 0.72, 0);
            addBox(0.08, 0.78, 0.08, darkWoodMat, -0.21, 0.41, 0.22);
            addBox(0.08, 0.78, 0.08, darkWoodMat, 0.21, 0.41, -0.22);
        } else {
            addBox(0.65, 0.5, 0.65, woodMat, 0, 0.25, 0);
        }

        const hitboxSizeByKind = {
            desk: { w: 1.95, h: 0.95, d: 1.05 },
            crate: { w: 1.05, h: 0.95, d: 1.05 },
            tool_rack: { w: 1.58, h: 1.7, d: 0.78 },
            notice_board: { w: 1.75, h: 1.9, d: 0.62 },
            chopping_block: { w: 0.9, h: 0.7, d: 0.9 },
            woodpile: { w: 1.35, h: 0.55, d: 0.95 },
            ore_pile: { w: 1.25, h: 0.68, d: 1.0 },
            coal_bin: { w: 1.25, h: 0.95, d: 1.0 },
            barrel: { w: 0.85, h: 0.98, d: 0.85 },
            weapon_rack: { w: 1.62, h: 1.62, d: 0.85 },
            training_dummy: { w: 1.16, h: 1.55, d: 0.95 },
            archery_target: { w: 1.28, h: 1.68, d: 0.92 }
        };
        const hitboxSize = hitboxSizeByKind[prop.kind] || { w: 1.0, h: 1.0, d: 1.0 };
        const hitbox = new THREE.Mesh(
            new THREE.BoxGeometry(hitboxSize.w, hitboxSize.h, hitboxSize.d),
            sharedMaterials.hiddenHitbox
        );
        hitbox.position.set(0, hitboxSize.h / 2, 0);
        group.add(hitbox);

        group.userData = {
            type: 'DECOR_PROP',
            gridX: prop.x,
            gridY: prop.y,
            z: Number.isFinite(prop.z) ? prop.z : 0,
            propId: prop.propId || '',
            kind: prop.kind || 'decor',
            name: prop.label || 'Decorative prop',
            uid: {
                propId: prop.propId || '',
                kind: prop.kind || 'decor',
                label: prop.label || 'Decorative prop'
            }
        };
        mergeStaticVisualChildrenByMaterial(THREE, group, { excludedMaterial: sharedMaterials.hiddenHitbox });
        return group;
    }

    function createAltarCandidateVisualGroup(options) {
        const THREE = requireThree(options && options.THREE);
        const sharedMaterials = options && options.sharedMaterials ? options.sharedMaterials : {};
        const altar = options && options.altar;
        const baseY = Number.isFinite(options && options.baseY) ? options.baseY : 0;
        if (!altar) return null;
        const altarGroup = new THREE.Group();
        altarGroup.position.set(altar.x, baseY, altar.y);
        const footprintScale = 2.0;
        const heightScale = 2.0;
        const stoneMat = sharedMaterials.altarStone;
        const coalMat = sharedMaterials.altarCoal;
        const emberMat = sharedMaterials.altarEmber;
        const coreMat = sharedMaterials.altarCore;

        const plinth = new THREE.Mesh(
            new THREE.CylinderGeometry(0.52 * footprintScale, 0.64 * footprintScale, 0.28 * heightScale, 10),
            stoneMat
        );
        plinth.position.y = 0.14 * heightScale;
        plinth.castShadow = true;
        plinth.receiveShadow = true;
        altarGroup.add(plinth);

        if (altar.variant === 1) {
            const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.35 * footprintScale, 0.42 * footprintScale, 0.2 * heightScale, 10), coalMat);
            bowl.position.y = 0.52 * heightScale;
            const flame1 = new THREE.Mesh(new THREE.ConeGeometry(0.12 * footprintScale, 0.36 * heightScale, 10), emberMat);
            flame1.position.y = 0.82 * heightScale;
            const flame2 = new THREE.Mesh(new THREE.ConeGeometry(0.08 * footprintScale, 0.24 * heightScale, 10), coreMat);
            flame2.position.y = 0.9 * heightScale;
            altarGroup.add(bowl, flame1, flame2);
        } else if (altar.variant === 2) {
            const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.32 * footprintScale, 0.4 * footprintScale, 0.22 * heightScale, 10), coalMat);
            bowl.position.y = 0.5 * heightScale;
            const flameL = new THREE.Mesh(new THREE.ConeGeometry(0.085 * footprintScale, 0.3 * heightScale, 8), emberMat);
            flameL.position.set(-0.12 * footprintScale, 0.82 * heightScale, 0.04 * footprintScale);
            flameL.rotation.z = 0.12;
            const flameR = new THREE.Mesh(new THREE.ConeGeometry(0.085 * footprintScale, 0.3 * heightScale, 8), emberMat);
            flameR.position.set(0.12 * footprintScale, 0.8 * heightScale, -0.03 * footprintScale);
            flameR.rotation.z = -0.1;
            const emberCore = new THREE.Mesh(new THREE.SphereGeometry(0.07 * footprintScale, 10, 10), coreMat);
            emberCore.position.y = 0.74 * heightScale;
            altarGroup.add(bowl, flameL, flameR, emberCore);
        } else if (altar.variant === 3) {
            const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.36 * footprintScale, 0.44 * footprintScale, 0.22 * heightScale, 10), coalMat);
            bowl.position.y = 0.52 * heightScale;
            const spireBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * footprintScale, 0.12 * footprintScale, 0.28 * heightScale, 8), coreMat);
            spireBase.position.y = 0.78 * heightScale;
            const spireTop = new THREE.Mesh(new THREE.ConeGeometry(0.1 * footprintScale, 0.34 * heightScale, 8), emberMat);
            spireTop.position.y = 1.05 * heightScale;
            altarGroup.add(bowl, spireBase, spireTop);
        } else {
            const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.32 * footprintScale, 0.4 * footprintScale, 0.22 * heightScale, 10), coalMat);
            bowl.position.y = 0.5 * heightScale;
            const flameL = new THREE.Mesh(new THREE.ConeGeometry(0.085 * footprintScale, 0.3 * heightScale, 8), emberMat);
            flameL.position.set(-0.12 * footprintScale, 0.82 * heightScale, 0.04 * footprintScale);
            flameL.rotation.z = 0.12;
            const flameR = new THREE.Mesh(new THREE.ConeGeometry(0.085 * footprintScale, 0.3 * heightScale, 8), emberMat);
            flameR.position.set(0.12 * footprintScale, 0.8 * heightScale, -0.03 * footprintScale);
            flameR.rotation.z = -0.1;
            const emberCore = new THREE.Mesh(new THREE.SphereGeometry(0.07 * footprintScale, 10, 10), coreMat);
            emberCore.position.y = 0.74 * heightScale;
            const baseRing = new THREE.Mesh(new THREE.TorusGeometry(0.31 * footprintScale, 0.045 * footprintScale, 10, 22), emberMat);
            baseRing.position.y = 0.58 * heightScale;
            baseRing.rotation.x = Math.PI / 2;
            const midPlinthRing = new THREE.Mesh(new THREE.TorusGeometry(0.46 * footprintScale, 0.03 * footprintScale, 10, 22), emberMat);
            midPlinthRing.position.y = 0.28 * heightScale;
            midPlinthRing.rotation.x = Math.PI / 2;
            altarGroup.add(bowl, flameL, flameR, emberCore, baseRing, midPlinthRing);
        }

        mergeStaticVisualChildrenByMaterial(THREE, altarGroup);
        return altarGroup;
    }

    function createDoorVisualGroup(options) {
        const THREE = requireThree(options && options.THREE);
        const sharedMaterials = options && options.sharedMaterials ? options.sharedMaterials : {};
        const door = options && options.door;
        const zOffset = Number.isFinite(options && options.zOffset) ? options.zOffset : 0;
        const baseHeight = Number.isFinite(options && options.baseHeight) ? options.baseHeight : 0;
        if (!door) return null;
        if (door.isWoodenGate) return createWoodenGateVisualGroup(options);
        const doorGroup = new THREE.Group();
        doorGroup.position.set(door.x + (door.hingeOffsetX || 0), zOffset + baseHeight, door.y + (door.hingeOffsetY || 0));
        doorGroup.rotation.y = door.currentRotation;
        const dw = door.isEW ? door.width : door.thickness;
        const dd = door.isEW ? door.thickness : door.width;
        const doorHeight = 2.42;
        const panelMat = sharedMaterials.boothWood || sharedMaterials.fenceWood;
        const braceMat = sharedMaterials.fenceWood || sharedMaterials.boothWood;
        const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(dw, doorHeight, dd), panelMat);
        const meshOffsetX = door.hingeOffsetX ? -door.hingeOffsetX : 0;
        const meshOffsetZ = door.hingeOffsetY ? -door.hingeOffsetY : 0;
        doorMesh.position.set(meshOffsetX, doorHeight / 2, meshOffsetZ);
        doorMesh.castShadow = true;
        doorMesh.receiveShadow = true;
        const braceDepth = door.isEW ? dd + 0.025 : dw + 0.025;
        const frontOffset = door.isEW ? -(braceDepth / 2) : -(braceDepth / 2);
        const addDoorDetail = (w, h, d, mat, x, y, z) => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
            mesh.position.set(x, y, z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            return mesh;
        };
        const braceLower = new THREE.Mesh(
            new THREE.BoxGeometry(door.isEW ? Math.max(0.18, door.width * 0.76) : 0.07, 0.12, door.isEW ? 0.07 : Math.max(0.18, door.width * 0.76)),
            braceMat
        );
        braceLower.position.set(meshOffsetX, 0.8, meshOffsetZ + (door.isEW ? frontOffset : 0));
        const braceUpper = braceLower.clone();
        braceUpper.position.y = 1.62;
        const panelDepth = 0.026;
        const panelOffset = frontOffset - 0.01;
        const topPanel = addDoorDetail(
            door.isEW ? door.width * 0.56 : panelDepth,
            0.52,
            door.isEW ? panelDepth : door.width * 0.56,
            braceMat,
            meshOffsetX,
            1.6,
            meshOffsetZ + (door.isEW ? panelOffset : 0)
        );
        const bottomPanel = topPanel.clone();
        bottomPanel.position.y = 0.88;
        const threshold = addDoorDetail(
            door.isEW ? door.width + 0.14 : 0.16,
            0.08,
            door.isEW ? 0.16 : door.width + 0.14,
            braceMat,
            meshOffsetX,
            0.04,
            meshOffsetZ
        );
        const jambA = addDoorDetail(
            door.isEW ? 0.09 : 0.12,
            doorHeight + 0.1,
            door.isEW ? 0.18 : 0.09,
            braceMat,
            meshOffsetX + (door.isEW ? -(door.width / 2) - 0.035 : 0),
            (doorHeight + 0.1) / 2,
            meshOffsetZ + (door.isEW ? 0 : -(door.width / 2) - 0.035)
        );
        const jambB = jambA.clone();
        if (door.isEW) jambB.position.x = meshOffsetX + (door.width / 2) + 0.035;
        else jambB.position.z = meshOffsetZ + (door.width / 2) + 0.035;
        const knobMat = sharedMaterials.rockGold || sharedMaterials.floor7 || braceMat;
        const knobFaceOffset = (door.isEW ? dd : dw) / 2 + 0.06;
        const latchX = meshOffsetX + (door.isEW
            ? ((door.hingeOffsetX || 0) >= 0 ? -door.width * 0.32 : door.width * 0.32)
            : 0);
        const latchZ = meshOffsetZ + (door.isEW
            ? 0
            : ((door.hingeOffsetY || 0) >= 0 ? -door.width * 0.32 : door.width * 0.32));
        const createKnob = (side) => {
            const knob = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), knobMat);
            knob.position.set(
                door.isEW ? latchX : meshOffsetX + (side * knobFaceOffset),
                1.18,
                door.isEW ? meshOffsetZ + (side * knobFaceOffset) : latchZ
            );
            return knob;
        };
        const knobInside = createKnob(-1);
        const knobOutside = createKnob(1);
        [braceLower, braceUpper, topPanel, bottomPanel, threshold, jambA, jambB, knobInside, knobOutside].forEach((mesh) => {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        });
        const hw = door.isEW ? door.width : 0.6;
        const hd = door.isEW ? 0.6 : door.width;
        const hitbox = new THREE.Mesh(new THREE.BoxGeometry(hw, doorHeight, hd), sharedMaterials.hiddenHitbox);
        hitbox.position.set(meshOffsetX, doorHeight / 2, meshOffsetZ);
        doorGroup.add(doorMesh, braceLower, braceUpper, topPanel, bottomPanel, threshold, jambA, jambB, knobInside, knobOutside, hitbox);
        mergeStaticVisualChildrenByMaterial(THREE, doorGroup, { excludedMaterial: sharedMaterials.hiddenHitbox });
        return doorGroup;
    }

    function resolveCaveFacingVector(facing) {
        const key = String(facing || '').toLowerCase();
        if (key === 'south') return { x: 0, z: 1 };
        if (key === 'east') return { x: 1, z: 0 };
        if (key === 'west') return { x: -1, z: 0 };
        return { x: 0, z: -1 };
    }

    function createCaveOpeningVisualGroup(options) {
        const THREE = requireThree(options && options.THREE);
        const sharedMaterials = options && options.sharedMaterials ? options.sharedMaterials : {};
        const opening = options && options.opening;
        const baseY = Number.isFinite(options && options.baseY) ? options.baseY : 0;
        if (!opening) return null;

        const width = Number.isFinite(opening.width) ? Math.max(1.5, opening.width) : 3.2;
        const depth = Number.isFinite(opening.depth) ? Math.max(1.0, opening.depth) : 2.2;
        const forward = resolveCaveFacingVector(opening.facing);
        const side = { x: -forward.z, z: forward.x };
        const caveGroup = new THREE.Group();
        caveGroup.position.set(opening.x, baseY, opening.y);

        const mouthMat = sharedMaterials.caveMouth || sharedMaterials.rockCoal || sharedMaterials.floor7;
        const rockMat = sharedMaterials.caveRock || sharedMaterials.rockDepleted || sharedMaterials.floor7;
        const mouth = new THREE.Mesh(new THREE.CircleGeometry(1, 28), mouthMat);
        mouth.rotation.x = -Math.PI / 2;
        mouth.scale.set(width * 0.48, depth * 0.46, 1);
        mouth.position.set(forward.x * 0.16, 0.035, forward.z * 0.16);
        mouth.receiveShadow = true;
        caveGroup.add(mouth);

        const backRock = new THREE.Mesh(new THREE.BoxGeometry(width * 0.9, 0.52, 0.42), rockMat);
        backRock.position.set(-forward.x * depth * 0.28, 0.28, -forward.z * depth * 0.28);
        backRock.rotation.y = Math.atan2(forward.x, forward.z);
        backRock.castShadow = true;
        backRock.receiveShadow = true;
        caveGroup.add(backRock);

        for (let i = -1; i <= 1; i += 2) {
            const flank = new THREE.Mesh(new THREE.DodecahedronGeometry(0.48, 0), rockMat);
            flank.scale.set(1.1, 0.72, 0.82);
            flank.position.set(
                side.x * i * width * 0.42 - forward.x * depth * 0.08,
                0.3,
                side.z * i * width * 0.42 - forward.z * depth * 0.08
            );
            flank.castShadow = true;
            flank.receiveShadow = true;
            caveGroup.add(flank);
        }

        if (opening.occluded) {
            const overhang = new THREE.Mesh(new THREE.DodecahedronGeometry(0.66, 0), rockMat);
            overhang.scale.set(width * 0.42, 0.58, depth * 0.32);
            overhang.position.set(-forward.x * depth * 0.12, 0.62, -forward.z * depth * 0.12);
            overhang.castShadow = true;
            overhang.receiveShadow = true;
            caveGroup.add(overhang);
        }

        caveGroup.traverse((child) => {
            if (!child || !child.isMesh) return;
            child.userData = {
                type: 'CAVE_OPENING_VISUAL',
                gridX: opening.x,
                gridY: opening.y,
                z: Number.isFinite(opening.z) ? opening.z : 0,
                landmarkId: opening.landmarkId,
                visualOnly: true
            };
        });
        mergeStaticVisualChildrenByMaterial(THREE, caveGroup);
        return caveGroup;
    }

    function addGroupChildrenToEnvironment(group, environmentMeshes, userData) {
        if (!group || !Array.isArray(group.children)) return;
        group.children.forEach((child) => {
            child.userData = Object.assign({}, userData);
            if (Array.isArray(environmentMeshes)) environmentMeshes.push(child);
        });
    }

    function appendChunkLandmarkVisuals(options) {
        const THREE = requireThree(options && options.THREE);
        const sharedMaterials = options && options.sharedMaterials ? options.sharedMaterials : {};
        const sharedGeometries = options && options.sharedGeometries ? options.sharedGeometries : {};
        const planeGroup = options && options.planeGroup;
        const environmentMeshes = options && options.environmentMeshes;
        const heightMap = options && options.heightMap;
        const z = options && options.z;
        const zOffset = Number.isFinite(options && options.zOffset) ? options.zOffset : 0;
        const startX = options && options.startX;
        const startY = options && options.startY;
        const endX = options && options.endX;
        const endY = options && options.endY;
        if (!planeGroup || !heightMap) return;

        (Array.isArray(options.caveOpeningsToRender) ? options.caveOpeningsToRender : []).forEach((opening) => {
            if (!isEntryInChunk(opening, startX, startY, endX, endY, z)) return;
            const caveGroup = createCaveOpeningVisualGroup({
                THREE,
                sharedMaterials,
                opening,
                baseY: heightMap[z][opening.y][opening.x] + zOffset
            });
            if (caveGroup) planeGroup.add(caveGroup);
        });

        (Array.isArray(options.bankBoothsToRender) ? options.bankBoothsToRender : []).forEach((booth) => {
            if (!isEntryInChunk(booth, startX, startY, endX, endY, z)) return;
            const boothGroup = createBankBoothVisualGroup({
                THREE,
                sharedMaterials,
                booth,
                baseY: heightMap[z][booth.y][booth.x] + zOffset
            });
            addGroupChildrenToEnvironment(boothGroup, environmentMeshes, { type: 'BANK_BOOTH', gridX: booth.x, gridY: booth.y, z });
            planeGroup.add(boothGroup);
        });

        (Array.isArray(options.furnacesToRender) ? options.furnacesToRender : []).forEach((furnace) => {
            if (!isEntryInChunk(furnace, startX, startY, endX, endY, z)) return;
            const furnaceGroup = createFurnaceVisualGroup({
                THREE,
                sharedMaterials,
                furnace,
                baseY: heightMap[z][furnace.y][furnace.x] + zOffset
            });
            const interactionTile = getFurnaceInteractionTile(furnace);
            addGroupChildrenToEnvironment(furnaceGroup, environmentMeshes, { type: 'FURNACE', gridX: interactionTile.x, gridY: interactionTile.y, z });
            planeGroup.add(furnaceGroup);
        });

        (Array.isArray(options.anvilsToRender) ? options.anvilsToRender : []).forEach((anvil) => {
            if (!isEntryInChunk(anvil, startX, startY, endX, endY, z)) return;
            const anvilGroup = createAnvilVisualGroup({
                THREE,
                sharedMaterials,
                anvil,
                baseY: heightMap[z][anvil.y][anvil.x] + zOffset
            });
            addGroupChildrenToEnvironment(anvilGroup, environmentMeshes, { type: 'ANVIL', gridX: anvil.x, gridY: anvil.y, z });
            planeGroup.add(anvilGroup);
        });

        (Array.isArray(options.directionalSignsToRender) ? options.directionalSignsToRender : []).forEach((sign) => {
            if (!isEntryInChunk(sign, startX, startY, endX, endY, z)) return;
            const signGroup = createDirectionalSignVisualGroup({
                THREE,
                sharedMaterials,
                sign,
                baseY: heightMap[z][sign.y][sign.x] + zOffset
            });
            planeGroup.add(signGroup);
        });

        (Array.isArray(options.decorPropsToRender) ? options.decorPropsToRender : []).forEach((prop) => {
            if (!isEntryInChunk(prop, startX, startY, endX, endY, z)) return;
            const propGroup = createDecorPropVisualGroup({
                THREE,
                sharedMaterials,
                sharedGeometries,
                prop,
                baseY: heightMap[z][prop.y][prop.x] + zOffset,
                createEquipmentVisualMeshes: options.createEquipmentVisualMeshes
            });
            if (propGroup) {
                addGroupChildrenToEnvironment(propGroup, environmentMeshes, {
                    type: 'DECOR_PROP',
                    gridX: prop.x,
                    gridY: prop.y,
                    z,
                    name: prop.label || 'Decorative prop',
                    uid: {
                        propId: prop.propId || '',
                        kind: prop.kind || 'decor',
                        label: prop.label || 'Decorative prop'
                    }
                });
                planeGroup.add(propGroup);
            }
        });

        (Array.isArray(options.altarCandidatesToRender) ? options.altarCandidatesToRender : []).forEach((altar) => {
            if (!isEntryInChunk(altar, startX, startY, endX, endY, z)) return;
            const altarGroup = createAltarCandidateVisualGroup({
                THREE,
                sharedMaterials,
                altar,
                baseY: heightMap[z][altar.y][altar.x] + zOffset
            });
            addGroupChildrenToEnvironment(altarGroup, environmentMeshes, {
                type: 'ALTAR_CANDIDATE',
                gridX: altar.x,
                gridY: altar.y,
                z,
                name: altar.label,
                variant: altar.variant
            });
            const altarHitbox = new THREE.Mesh(
                new THREE.BoxGeometry(3, 2.6, 3),
                sharedMaterials.hiddenHitbox
            );
            altarHitbox.position.set(0, 1.3, 0);
            altarHitbox.userData = {
                type: 'ALTAR_CANDIDATE',
                gridX: altar.x,
                gridY: altar.y,
                z,
                name: altar.label,
                variant: altar.variant
            };
            altarGroup.add(altarHitbox);
            if (Array.isArray(environmentMeshes)) environmentMeshes.push(altarHitbox);
            planeGroup.add(altarGroup);
        });

        (Array.isArray(options.doorsToRender) ? options.doorsToRender : []).forEach((door) => {
            if (!isEntryInChunk(door, startX, startY, endX, endY, z)) return;
            const doorGroup = createDoorVisualGroup({
                THREE,
                sharedMaterials,
                door,
                zOffset,
                baseHeight: heightMap[z][door.y][door.x]
            });
            door.meshGroup = doorGroup;
            addGroupChildrenToEnvironment(doorGroup, environmentMeshes, { type: door.isWoodenGate ? 'GATE' : 'DOOR', gridX: door.x, gridY: door.y, z, doorObj: door });
            planeGroup.add(doorGroup);
            const floorHeight = heightMap[z][door.y][door.x];
            if (floorHeight > 0.12) {
                const floorMesh = createTopAnchoredFloorMesh({
                    THREE,
                    material: sharedMaterials.floor7,
                    x: door.x,
                    y: door.y,
                    z,
                    zOffset,
                    topHeight: floorHeight
                });
                planeGroup.add(floorMesh);
                if (Array.isArray(environmentMeshes)) environmentMeshes.push(floorMesh);
            }
        });
    }

    function appendPierVisualsToChunk(options) {
        const THREE = requireThree(options && options.THREE);
        const sharedMaterials = options && options.sharedMaterials ? options.sharedMaterials : {};
        const environmentMeshes = options && options.environmentMeshes;
        const planeGroup = options && options.planeGroup;
        const pierConfig = options && options.pierConfig;
        const z = options && options.z;
        const zOffset = Number.isFinite(options && options.zOffset) ? options.zOffset : 0;
        const startX = options && options.startX;
        const startY = options && options.startY;
        const endX = options && options.endX;
        const endY = options && options.endY;
        const pierDeckTopHeight = Number.isFinite(options && options.pierDeckTopHeight) ? options.pierDeckTopHeight : 0.28;
        const pierDeckThickness = Number.isFinite(options && options.pierDeckThickness) ? options.pierDeckThickness : 0.14;
        const createWaterSurfacePatchMesh = typeof (options && options.createWaterSurfacePatchMesh) === 'function'
            ? options.createWaterSurfacePatchMesh
            : () => null;
        const findNearbyWaterRenderBodyForTile = typeof (options && options.findNearbyWaterRenderBodyForTile) === 'function'
            ? options.findNearbyWaterRenderBodyForTile
            : () => null;
        const resolveWaterRenderBodyForTile = typeof (options && options.resolveWaterRenderBodyForTile) === 'function'
            ? options.resolveWaterRenderBodyForTile
            : () => null;
        const getDefaultWaterRenderBody = typeof (options && options.getDefaultWaterRenderBody) === 'function'
            ? options.getDefaultWaterRenderBody
            : () => ({ surfaceY: -0.075, styleTokens: {} });
        if (!planeGroup || !pierConfig || z !== 0) return;
        const pierStepBaseY = pierConfig.entryY + 1;
        if (pierConfig.xMax < startX || pierConfig.xMin >= endX || pierConfig.yEnd < startY || pierStepBaseY >= endY) return;

        const deckTop = zOffset + pierDeckTopHeight;
        const deckThickness = pierDeckThickness;
        const deckCenterY = deckTop - (deckThickness / 2);
        const pierCenterX = (pierConfig.xMin + pierConfig.xMax) / 2;
        const pierWidth = (pierConfig.xMax - pierConfig.xMin) + 1;
        const waterBodies = Array.isArray(sharedMaterials.activeWaterRenderBodies) ? sharedMaterials.activeWaterRenderBodies : [];
        const pierWaterBody = findNearbyWaterRenderBodyForTile(waterBodies, pierCenterX, pierConfig.yStart + 1, z)
            || resolveWaterRenderBodyForTile(waterBodies, pierCenterX, pierConfig.yEnd, z)
            || getDefaultWaterRenderBody();
        const intersectsPierRows = !(pierConfig.yEnd < startY || pierConfig.yStart >= endY);
        const containsEntryRow = pierStepBaseY >= startY && pierStepBaseY < endY;
        const containsTipRows = (pierConfig.yEnd - 1) < endY && pierConfig.yEnd >= startY;

        if (intersectsPierRows) {
            const straightRunStartY = Math.max(startY, pierConfig.yStart) - 0.5;
            const straightRunEndY = Math.min(endY - 0.5, pierConfig.yEnd - 0.62);
            if (straightRunEndY > straightRunStartY) {
                const straightRunUnderlay = createWaterSurfacePatchMesh(
                    {
                        xMin: pierConfig.xMin - 0.62,
                        xMax: pierConfig.xMax + 0.62,
                        yMin: straightRunStartY,
                        yMax: straightRunEndY
                    },
                    zOffset + (Number.isFinite(pierWaterBody.surfaceY) ? pierWaterBody.surfaceY : -0.075) - 0.002,
                    pierWaterBody.styleTokens,
                    0.62,
                    0.08
                );
                if (straightRunUnderlay) planeGroup.add(straightRunUnderlay);
            }

            for (let y = Math.max(startY, pierConfig.yStart); y < Math.min(endY, pierConfig.yEnd + 1); y++) {
                for (let x = Math.max(startX, pierConfig.xMin); x < Math.min(endX, pierConfig.xMax + 1); x++) {
                    const deckMesh = new THREE.Mesh(new THREE.BoxGeometry(1.06, deckThickness, 1.06), sharedMaterials.floor6);
                    deckMesh.position.set(x, deckCenterY, y);
                    deckMesh.castShadow = true;
                    deckMesh.receiveShadow = true;
                    deckMesh.userData = { type: 'GROUND', z: z };
                    planeGroup.add(deckMesh);
                    if (Array.isArray(environmentMeshes)) environmentMeshes.push(deckMesh);
                }

                const isSupportRow = y === pierConfig.yStart || y === pierConfig.yEnd || ((y - pierConfig.yStart) % 3 === 0);
                if (!isSupportRow) continue;
                const postTop = deckCenterY - (deckThickness / 2) + 0.02;
                const waterBed = -0.28;
                const postHeight = Math.max(0.5, postTop - waterBed);
                const postY = waterBed + (postHeight / 2);
                const edgePostXs = [pierConfig.xMin - 0.36, pierConfig.xMax + 0.36];
                for (let i = 0; i < edgePostXs.length; i++) {
                    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, postHeight, 6), sharedMaterials.trunk);
                    post.position.set(edgePostXs[i], postY, y);
                    post.castShadow = true;
                    post.receiveShadow = true;
                    planeGroup.add(post);
                }
            }
        }

        if (containsEntryRow) {
            const stepDepth = 0.26;
            const stepHeights = [0.08, 0.16, 0.24];
            const stepCenters = [0.18, 0.43, 0.68];
            for (let i = 0; i < stepHeights.length; i++) {
                const stepHeight = stepHeights[i];
                const step = new THREE.Mesh(new THREE.BoxGeometry(pierWidth + 0.08, stepHeight, stepDepth), sharedMaterials.floor6);
                step.position.set(pierCenterX, zOffset + (stepHeight / 2), pierStepBaseY + stepCenters[i]);
                step.castShadow = true;
                step.receiveShadow = true;
                step.userData = { type: 'GROUND', z: z, isPierStep: true };
                planeGroup.add(step);
                if (Array.isArray(environmentMeshes)) environmentMeshes.push(step);
            }
        }

        if (containsTipRows) {
            const tipPlatform = new THREE.Mesh(new THREE.BoxGeometry(pierWidth + 2.0, deckThickness, 2.0), sharedMaterials.floor6);
            tipPlatform.position.set(pierCenterX, deckCenterY, pierConfig.yEnd - 0.25);
            tipPlatform.castShadow = true;
            tipPlatform.receiveShadow = true;
            planeGroup.add(tipPlatform);

            const tipPostOffsets = [
                { x: -((pierWidth + 1.4) / 2), y: -0.82 },
                { x: ((pierWidth + 1.4) / 2), y: -0.82 },
                { x: -((pierWidth + 1.4) / 2), y: 0.82 },
                { x: ((pierWidth + 1.4) / 2), y: 0.82 }
            ];
            for (let i = 0; i < tipPostOffsets.length; i++) {
                const offset = tipPostOffsets[i];
                const postTop = deckCenterY - (deckThickness / 2) + 0.02;
                const postHeight = Math.max(0.58, postTop - (-0.28));
                const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, postHeight, 6), sharedMaterials.trunk);
                post.position.set(pierCenterX + offset.x, (-0.28) + (postHeight / 2), (pierConfig.yEnd - 0.25) + offset.y);
                post.castShadow = true;
                post.receiveShadow = true;
                planeGroup.add(post);
            }
        }
    }

    function updateTutorialRoofVisibility(options) {
        const activeRoofVisuals = options && options.activeRoofVisuals;
        const playerState = options && options.playerState;
        if (!Array.isArray(activeRoofVisuals) || activeRoofVisuals.length === 0 || !playerState) return;
        for (let i = 0; i < activeRoofVisuals.length; i++) {
            const group = activeRoofVisuals[i];
            const roof = group && group.userData ? group.userData.roofLandmark : null;
            const material = group && group.userData ? group.userData.roofMaterial : null;
            if (!roof || !material || !roof.hideWhenPlayerInside || !roof.hideBounds) continue;
            const bounds = roof.hideBounds;
            const inside = playerState.z === bounds.z
                && playerState.x >= bounds.xMin
                && playerState.x <= bounds.xMax
                && playerState.y >= bounds.yMin
                && playerState.y <= bounds.yMax;
            const targetOpacity = inside ? 0.04 : 1;
            material.opacity += (targetOpacity - material.opacity) * 0.22;
            material.visible = material.opacity > 0.03;
        }
    }

    window.WorldStructureRenderRuntime = {
        chunkIntersectsRoof,
        appendChunkLandmarkVisuals,
        appendPierVisualsToChunk,
        appendFloorTileVisual,
        appendFloorTileVisualState,
        appendShopCounterVisual,
        appendStairBlockVisual,
        appendStairRampVisual,
        createAltarCandidateVisualGroup,
        createAnvilVisualGroup,
        createBankBoothVisualGroup,
        createCastleRenderData,
        createCaveOpeningVisualGroup,
        createDecorPropVisualGroup,
        createDirectionalSignVisualGroup,
        createDoorVisualGroup,
        createFenceRenderData,
        createFenceVisualGroup,
        createFloorTileRenderData,
        createFurnaceVisualGroup,
        getFurnaceInteractionTile,
        getFloorTileRenderBucket,
        createRoofVisualGroup,
        createTopAnchoredFloorMesh,
        createWoodenGateVisualGroup,
        appendFenceVisualState,
        markCastleRenderDataDirty,
        markFenceRenderDataDirty,
        markFloorTileRenderDataDirty,
        resolveFenceConnections,
        setCastleTowerVisualState,
        setCastleWallVisualState,
        updateFurnaceVisualEffects,
        updateTutorialRoofVisibility
    };
})();
