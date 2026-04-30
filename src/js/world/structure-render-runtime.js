(function () {
    function requireThree(three) {
        if (!three) throw new Error('World structure render runtime requires THREE.');
        return three;
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

    function resolveFenceConnections(options) {
        const logicalMap = options && options.logicalMap;
        const getVisualTileId = options && options.getVisualTileId;
        const isFenceConnectorTile = options && options.isFenceConnectorTile;
        const mapSize = Number.isFinite(options && options.mapSize) ? options.mapSize : 0;
        const x = options && options.x;
        const y = options && options.y;
        const z = options && options.z;
        if (!logicalMap || typeof getVisualTileId !== 'function' || typeof isFenceConnectorTile !== 'function') {
            return { hasNorth: false, hasSouth: false, hasWest: false, hasEast: false };
        }
        return {
            hasNorth: y > 0 && isFenceConnectorTile(getVisualTileId(logicalMap[z][y - 1][x], x, y - 1, z)),
            hasSouth: y < mapSize - 1 && isFenceConnectorTile(getVisualTileId(logicalMap[z][y + 1][x], x, y + 1, z)),
            hasWest: x > 0 && isFenceConnectorTile(getVisualTileId(logicalMap[z][y][x - 1], x - 1, y, z)),
            hasEast: x < mapSize - 1 && isFenceConnectorTile(getVisualTileId(logicalMap[z][y][x + 1], x + 1, y, z))
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
        const material = sharedMaterials.fenceWood || sharedMaterials.boothWood;

        const connections = resolveFenceConnections(options);
        const drawX = connections.hasEast || connections.hasWest || (!connections.hasNorth && !connections.hasSouth);
        const drawZ = connections.hasNorth || connections.hasSouth;

        const postPositions = [];
        const addPost = (px, pz) => {
            const key = `${px}:${pz}`;
            if (postPositions.some((entry) => entry.key === key)) return;
            postPositions.push({ key, x: px, z: pz });
        };
        if (drawX) {
            addPost(-0.46, 0);
            addPost(0.46, 0);
        }
        if (drawZ) {
            addPost(0, -0.46);
            addPost(0, 0.46);
        }
        if (!drawX && !drawZ) addPost(0, 0);

        for (let i = 0; i < postPositions.length; i++) {
            const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.95, 0.16), material);
            post.position.set(postPositions[i].x, 0.475, postPositions[i].z);
            post.castShadow = true;
            post.receiveShadow = true;
            group.add(post);
        }

        const addRail = (isX, railY) => {
            const rail = new THREE.Mesh(
                new THREE.BoxGeometry(isX ? 0.94 : 0.12, 0.12, isX ? 0.12 : 0.94),
                material
            );
            rail.position.set(0, railY, 0);
            rail.castShadow = true;
            rail.receiveShadow = true;
            group.add(rail);
        };
        if (drawX) {
            addRail(true, 0.42);
            addRail(true, 0.68);
        }
        if (drawZ) {
            addRail(false, 0.42);
            addRail(false, 0.68);
        }

        group.children.forEach((child) => {
            child.userData = { type: 'WALL', gridX: x, gridY: y, z: z };
            if (Array.isArray(environmentMeshes)) environmentMeshes.push(child);
        });
        return group;
    }

    function createWoodenGateVisualGroup(options) {
        const THREE = requireThree(options && options.THREE);
        const sharedMaterials = options && options.sharedMaterials ? options.sharedMaterials : {};
        const door = options && options.door;
        const zOffset = Number.isFinite(options && options.zOffset) ? options.zOffset : 0;
        const baseHeight = Number.isFinite(options && options.baseHeight) ? options.baseHeight : 0;
        if (!door) return null;
        const group = new THREE.Group();
        group.position.set(door.x + (door.hingeOffsetX || 0), zOffset + baseHeight, door.y + (door.hingeOffsetY || 0));
        group.rotation.y = door.currentRotation;
        const material = sharedMaterials.fenceWood || sharedMaterials.boothWood;
        const meshOffsetX = door.hingeOffsetX ? -door.hingeOffsetX : 0;
        const meshOffsetZ = door.hingeOffsetY ? -door.hingeOffsetY : 0;
        const railW = door.isEW ? door.width : 0.12;
        const railD = door.isEW ? 0.12 : door.width;

        const uprightA = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.95, 0.14), material);
        uprightA.position.set(meshOffsetX + (door.isEW ? -door.width * 0.35 : 0), 0.475, meshOffsetZ + (door.isEW ? 0 : -door.width * 0.35));
        const uprightB = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.95, 0.14), material);
        uprightB.position.set(meshOffsetX + (door.isEW ? door.width * 0.35 : 0), 0.475, meshOffsetZ + (door.isEW ? 0 : door.width * 0.35));
        const railLower = new THREE.Mesh(new THREE.BoxGeometry(railW, 0.14, railD), material);
        railLower.position.set(meshOffsetX, 0.38, meshOffsetZ);
        const railUpper = new THREE.Mesh(new THREE.BoxGeometry(railW, 0.14, railD), material);
        railUpper.position.set(meshOffsetX, 0.68, meshOffsetZ);
        [uprightA, uprightB, railLower, railUpper].forEach((mesh) => {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            group.add(mesh);
        });

        const hitbox = new THREE.Mesh(new THREE.BoxGeometry(door.isEW ? door.width : 0.6, 1.2, door.isEW ? 0.6 : door.width), sharedMaterials.hiddenHitbox);
        hitbox.position.set(meshOffsetX, 0.6, meshOffsetZ);
        group.add(hitbox);
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
        createFenceVisualGroup,
        createRoofVisualGroup,
        createTopAnchoredFloorMesh,
        createWoodenGateVisualGroup,
        resolveFenceConnections,
        updateTutorialRoofVisibility
    };
})();
