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
        return boothGroup;
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
        const yaw = Number.isFinite(furnace.facingYaw) ? furnace.facingYaw : 0;
        const quarterTurn = Math.abs(Math.round(Math.sin(yaw))) === 1 && Math.abs(Math.round(Math.cos(yaw))) === 0;
        const bodyLocalW = quarterTurn ? fd : fw;
        const bodyLocalD = quarterTurn ? fw : fd;
        furnaceGroup.position.set(furnace.x + ((fw - 1) * 0.5), baseY, furnace.y + ((fd - 1) * 0.5));
        if (Number.isFinite(furnace.facingYaw)) furnaceGroup.rotation.y = furnace.facingYaw;
        const base = new THREE.Mesh(new THREE.BoxGeometry(bodyLocalW, 1.6, bodyLocalD), sharedMaterials.floor8);
        base.position.set(0, 0.8, 0);
        base.castShadow = true;
        base.receiveShadow = true;
        const mouth = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.6, 0.3), sharedMaterials.floor7);
        mouth.position.set(0, 0.95, (bodyLocalD * 0.5) - 0.02);
        const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.2, 0.45), sharedMaterials.floor7);
        chimney.position.set(0.55, 1.9, -((bodyLocalD * 0.5) - 0.45));
        const hitbox = new THREE.Mesh(new THREE.BoxGeometry(bodyLocalW, 1.6, bodyLocalD), sharedMaterials.hiddenHitbox);
        hitbox.position.set(0, 0.8, 0);
        furnaceGroup.add(base, mouth, chimney, hitbox);
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
        const stand = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.55, 0.35), sharedMaterials.boothWood);
        stand.position.set(0, 0.275, 0);
        const top = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.18, 0.45), sharedMaterials.floor7);
        top.position.set(0, 0.62, 0);
        const horn = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.2), sharedMaterials.floor7);
        horn.position.set(0.5, 0.6, 0);
        const hitbox = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.8, 1.3), sharedMaterials.hiddenHitbox);
        hitbox.position.set(0, 0.4, 0);
        anvilGroup.add(stand, top, horn, hitbox);
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
        return signGroup;
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
        const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(dw, 2.0, dd), sharedMaterials.boothWood);
        const meshOffsetX = door.hingeOffsetX ? -door.hingeOffsetX : 0;
        const meshOffsetZ = door.hingeOffsetY ? -door.hingeOffsetY : 0;
        doorMesh.position.set(meshOffsetX, 1.0, meshOffsetZ);
        doorMesh.castShadow = true;
        doorMesh.receiveShadow = true;
        const hw = door.isEW ? door.width : 0.6;
        const hd = door.isEW ? 0.6 : door.width;
        const hitbox = new THREE.Mesh(new THREE.BoxGeometry(hw, 2, hd), sharedMaterials.hiddenHitbox);
        hitbox.position.set(meshOffsetX, 1.0, meshOffsetZ);
        doorGroup.add(doorMesh, hitbox);
        return doorGroup;
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
            addGroupChildrenToEnvironment(furnaceGroup, environmentMeshes, { type: 'FURNACE', gridX: furnace.x, gridY: furnace.y, z });
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
            addGroupChildrenToEnvironment(doorGroup, environmentMeshes, { type: 'DOOR', gridX: door.x, gridY: door.y, z, doorObj: door });
            planeGroup.add(doorGroup);
            const floorHeight = heightMap[z][door.y][door.x];
            if (floorHeight > 0) {
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
        createAltarCandidateVisualGroup,
        createAnvilVisualGroup,
        createBankBoothVisualGroup,
        createDirectionalSignVisualGroup,
        createDoorVisualGroup,
        createFenceVisualGroup,
        createFurnaceVisualGroup,
        createRoofVisualGroup,
        createTopAnchoredFloorMesh,
        createWoodenGateVisualGroup,
        resolveFenceConnections,
        updateTutorialRoofVisibility
    };
})();
