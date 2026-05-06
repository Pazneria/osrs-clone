(function () {
    function requireThree(three) {
        if (!three) throw new Error('World shared assets runtime requires THREE.');
        return three;
    }

    function requireDocument(documentRef) {
        const resolvedDocument = documentRef || (typeof window !== 'undefined' ? window.document : null);
        if (!resolvedDocument || typeof resolvedDocument.createElement !== 'function') {
            throw new Error('World shared assets runtime requires a document with canvas support.');
        }
        return resolvedDocument;
    }

    function createChippedRockGeometry(THREE, rings, options = {}) {
        const positions = [];
        const pushVertex = (point) => {
            positions.push(point[0], point[1], point[2]);
        };
        const pushTriangle = (a, b, c) => {
            pushVertex(a);
            pushVertex(b);
            pushVertex(c);
        };
        const averagePoint = (points) => {
            const result = [0, 0, 0];
            for (let i = 0; i < points.length; i++) {
                result[0] += points[i][0];
                result[1] += points[i][1];
                result[2] += points[i][2];
            }
            const divisor = Math.max(1, points.length);
            return [result[0] / divisor, result[1] / divisor, result[2] / divisor];
        };

        for (let ringIndex = 0; ringIndex < rings.length - 1; ringIndex++) {
            const current = rings[ringIndex];
            const next = rings[ringIndex + 1];
            const count = Math.min(current.length, next.length);
            for (let i = 0; i < count; i++) {
                const a = current[i];
                const b = current[(i + 1) % count];
                const c = next[i];
                const d = next[(i + 1) % count];
                pushTriangle(a, c, b);
                pushTriangle(b, c, d);
            }
        }

        const bottom = rings[0] || [];
        const top = rings[rings.length - 1] || [];
        const bottomCenter = averagePoint(bottom);
        const topCenter = averagePoint(top);
        for (let i = 0; i < bottom.length; i++) {
            pushTriangle(bottomCenter, bottom[(i + 1) % bottom.length], bottom[i]);
        }
        for (let i = 0; i < top.length; i++) {
            pushTriangle(topCenter, top[(i + 1) % top.length], top[i]);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.computeVertexNormals();
        const scale = Array.isArray(options.scale) ? options.scale : [1, 1, 1];
        geometry.scale(scale[0], scale[1], scale[2]);
        if (Number.isFinite(options.yaw)) geometry.rotateY(options.yaw);
        if (Number.isFinite(options.yOffset)) geometry.translate(0, options.yOffset, 0);
        return geometry;
    }

    function initSharedAssets(options = {}) {
        const THREE = requireThree(options.THREE);
        const document = requireDocument(options.document);
        const renderer = options.renderer || null;
        const chunkSize = Number.isFinite(options.chunkSize) ? options.chunkSize : 32;
        const sharedGeometries = options.sharedGeometries || {};
        const sharedMaterials = options.sharedMaterials || {};
        const applyColorTextureSettings = typeof options.applyColorTextureSettings === 'function'
            ? options.applyColorTextureSettings
            : (texture) => texture;
        const buildGrassTextureCanvas = typeof options.buildGrassTextureCanvas === 'function'
            ? options.buildGrassTextureCanvas
            : () => document.createElement('canvas');
        const buildDirtTextureCanvas = typeof options.buildDirtTextureCanvas === 'function'
            ? options.buildDirtTextureCanvas
            : () => document.createElement('canvas');
        const getWaterMaterialCaches = typeof options.getWaterMaterialCaches === 'function'
            ? options.getWaterMaterialCaches
            : () => null;

            sharedGeometries.ground = new THREE.PlaneGeometry(chunkSize, chunkSize);
            sharedGeometries.ground.rotateX(-Math.PI / 2);
            sharedGeometries.tileColumn = new THREE.BoxGeometry(1, 1, 1);
            sharedGeometries.fishingSpotMarker = new THREE.CylinderGeometry(0.15, 0.15, 0.25, 10);

            sharedGeometries.treeTrunk = new THREE.CylinderGeometry(0.16, 0.28, 2.0, 6).translate(0, 1.0, 0);
            sharedGeometries.treeRootFlare = new THREE.CylinderGeometry(0.36, 0.62, 0.2, 6).translate(0, 0.1, 0);
            sharedGeometries.treeStumpCap = new THREE.CylinderGeometry(0.34, 0.36, 0.035, 6).translate(0, 0.0175, 0);
            sharedGeometries.treeBranch = new THREE.CylinderGeometry(0.055, 0.095, 1.18, 6).rotateZ(Math.PI / 2.65).translate(0.44, 1.52, 0.04);
            sharedGeometries.treeBranch2 = new THREE.CylinderGeometry(0.052, 0.09, 1.12, 6).rotateZ(-Math.PI / 2.8).translate(0.44, 1.54, -0.06);
            sharedGeometries.treeBranch3 = new THREE.CylinderGeometry(0.045, 0.08, 0.94, 6).rotateX(Math.PI / 6.2).rotateZ(Math.PI / 3.05).translate(0.12, 1.86, -0.34);
            sharedGeometries.treeBranch.userData = { rootLocal: [0.987, 1.298, 0.04], tipLocal: [-0.107, 1.742, 0.04] };
            sharedGeometries.treeBranch2.userData = { rootLocal: [-0.065, 1.297, -0.06], tipLocal: [0.945, 1.783, -0.06] };
            sharedGeometries.treeBranch3.userData = { rootLocal: [0.472, 1.648, -0.568], tipLocal: [-0.232, 2.072, -0.112] };
            sharedGeometries.leaf1 = new THREE.DodecahedronGeometry(0.86, 0).scale(1.52, 0.95, 1.42).translate(0.02, 2.42, 0);
            sharedGeometries.leaf2 = new THREE.IcosahedronGeometry(0.62, 0).scale(1.34, 0.9, 1.2).translate(0.62, 2.18, 0.34);
            sharedGeometries.leaf3 = new THREE.IcosahedronGeometry(0.6, 0).scale(1.26, 0.94, 1.22).translate(-0.58, 2.16, -0.32);
            sharedGeometries.leaf4 = new THREE.DodecahedronGeometry(0.56, 0).scale(1.18, 0.88, 1.14).translate(-0.06, 2.58, 0.44);
            sharedGeometries.leaf4.userData = { branchAttachmentLocal: [-0.06, 2.4, 0.44] };
            sharedGeometries.willowDrape1 = new THREE.CylinderGeometry(0.065, 0.012, 1.82, 4).rotateZ(0.08).translate(1.02, 2.34, 0.66);
            sharedGeometries.willowDrape2 = new THREE.CylinderGeometry(0.062, 0.012, 1.76, 4).rotateZ(-0.07).translate(-0.98, 2.3, -0.58);
            sharedGeometries.willowDrape3 = new THREE.CylinderGeometry(0.06, 0.011, 1.94, 4).rotateZ(0.14).translate(-0.86, 2.26, 0.74);
            sharedGeometries.willowDrape4 = new THREE.CylinderGeometry(0.068, 0.012, 2.02, 4).rotateZ(-0.1).translate(0.92, 2.2, -0.72);
            sharedGeometries.willowDrape5 = new THREE.CylinderGeometry(0.055, 0.01, 1.68, 4).rotateZ(0.05).translate(0.18, 2.44, 0.96);
            sharedGeometries.willowDrape6 = new THREE.CylinderGeometry(0.055, 0.01, 1.72, 4).rotateZ(-0.06).translate(-0.22, 2.4, -0.96);
            sharedGeometries.willowDrape7 = new THREE.CylinderGeometry(0.058, 0.011, 1.86, 4).rotateZ(0.11).translate(-1.04, 2.18, 0.06);
            sharedGeometries.willowDrape8 = new THREE.CylinderGeometry(0.058, 0.011, 1.9, 4).rotateZ(-0.12).translate(1.06, 2.16, -0.08);
            sharedGeometries.rockClay = new THREE.DodecahedronGeometry(0.46, 0).scale(1.18, 0.58, 0.96).translate(0, 0.27, 0);
            sharedGeometries.rockCopper = createChippedRockGeometry(THREE, [
                [[-0.54, 0, -0.36], [0.12, 0, -0.48], [0.56, 0, -0.18], [0.48, 0, 0.28], [0.02, 0, 0.5], [-0.48, 0, 0.22], [-0.62, 0, -0.08]],
                [[-0.5, 0.34, -0.24], [0.02, 0.5, -0.5], [0.58, 0.36, -0.05], [0.36, 0.43, 0.44], [-0.17, 0.3, 0.55], [-0.58, 0.45, 0.07], [-0.45, 0.28, -0.34]],
                [[-0.22, 0.68, -0.16], [0.18, 0.59, -0.28], [0.35, 0.62, -0.03], [0.18, 0.72, 0.28], [-0.12, 0.6, 0.34], [-0.34, 0.55, 0.1], [-0.3, 0.64, -0.22]]
            ], { scale: [1.08, 0.96, 0.94], yaw: Math.PI / 11, yOffset: 0 });
            sharedGeometries.rockTin = createChippedRockGeometry(THREE, [
                [[-0.42, 0, -0.34], [0.14, 0, -0.46], [0.47, 0, -0.12], [0.34, 0, 0.38], [-0.16, 0, 0.48], [-0.5, 0, 0.08]],
                [[-0.44, 0.36, -0.2], [0.0, 0.54, -0.42], [0.42, 0.47, 0.0], [0.18, 0.55, 0.42], [-0.28, 0.34, 0.35], [-0.54, 0.45, -0.04]],
                [[-0.12, 0.88, -0.18], [0.16, 0.8, -0.22], [0.25, 0.78, 0.04], [0.03, 0.72, 0.28], [-0.2, 0.75, 0.18], [-0.28, 0.82, -0.04]]
            ], { scale: [0.92, 1.0, 0.88], yaw: -Math.PI / 9, yOffset: 0 });
            sharedGeometries.rockIron = new THREE.BoxGeometry(0.78, 0.58, 0.72).translate(0, 0.29, 0);
            sharedGeometries.rockCoal = new THREE.TetrahedronGeometry(0.58, 0).scale(1.22, 0.78, 1.04).translate(0, 0.36, 0);
            sharedGeometries.rockSilver = new THREE.OctahedronGeometry(0.5, 0).scale(1.08, 0.9, 0.92).translate(0, 0.42, 0);
            sharedGeometries.rockSapphire = new THREE.OctahedronGeometry(0.52, 0).scale(0.82, 1.16, 0.82).translate(0, 0.54, 0);
            sharedGeometries.rockGold = new THREE.DodecahedronGeometry(0.5, 0).scale(1.22, 0.78, 0.9).translate(0, 0.36, 0);
            sharedGeometries.rockEmerald = new THREE.OctahedronGeometry(0.52, 0).scale(0.72, 1.28, 0.72).translate(0, 0.58, 0);
            sharedGeometries.rockDepleted = createChippedRockGeometry(THREE, [
                [[-0.52, 0, -0.28], [0.18, 0, -0.35], [0.5, 0, -0.08], [0.38, 0, 0.26], [-0.1, 0, 0.36], [-0.5, 0, 0.12]],
                [[-0.42, 0.14, -0.2], [0.12, 0.22, -0.28], [0.42, 0.16, -0.04], [0.28, 0.2, 0.2], [-0.12, 0.13, 0.28], [-0.45, 0.18, 0.06]],
                [[-0.18, 0.29, -0.1], [0.08, 0.23, -0.16], [0.2, 0.25, 0.0], [0.08, 0.21, 0.16], [-0.12, 0.22, 0.14], [-0.26, 0.25, 0.02]]
            ], { scale: [1.08, 0.9, 1.02], yaw: Math.PI / 6, yOffset: 0 });
            sharedGeometries.rockRuneEssence = new THREE.IcosahedronGeometry(0.9, 1).scale(1.35, 0.95, 1.35).translate(0, 0.78, 0);

            // Castle Geometries (Taller and anchors are centered for grounded effect)
            sharedGeometries.castleWall = new THREE.BoxGeometry(1, 3, 1).translate(0, 1.5, 0);
            sharedGeometries.castleTower = new THREE.BoxGeometry(1.22, 4, 1.22).translate(0, 2.0, 0);

            sharedMaterials.ground = new THREE.MeshLambertMaterial({ color: 0xffffff });
            sharedMaterials.grassTile = new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: true });
            sharedMaterials.dirtTile = new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: true });
            sharedMaterials.terrainUnderlay = new THREE.MeshLambertMaterial({ color: 0xb7c7aa, side: THREE.DoubleSide });
            sharedMaterials.fishingSpot = new THREE.MeshLambertMaterial({ color: 0xa8d4de });
            sharedMaterials.rockClay = new THREE.MeshLambertMaterial({ color: 0xa78668, flatShading: true });
            sharedMaterials.rockCopper = new THREE.MeshLambertMaterial({ color: 0xc8754d, flatShading: true });
            sharedMaterials.rockTin = new THREE.MeshLambertMaterial({ color: 0xb8c3c9, flatShading: true });
            sharedMaterials.rockIron = new THREE.MeshLambertMaterial({ color: 0x6f7985, flatShading: true });
            sharedMaterials.rockCoal = new THREE.MeshLambertMaterial({ color: 0x3f444c, flatShading: true });
            sharedMaterials.rockSilver = new THREE.MeshLambertMaterial({ color: 0xc8ced6, flatShading: true });
            sharedMaterials.rockSapphire = new THREE.MeshLambertMaterial({ color: 0x3d6ed8, flatShading: true });
            sharedMaterials.rockGold = new THREE.MeshLambertMaterial({ color: 0xd4a829, flatShading: true });
            sharedMaterials.rockEmerald = new THREE.MeshLambertMaterial({ color: 0x2aa66f, flatShading: true });
            sharedMaterials.rockDepleted = new THREE.MeshLambertMaterial({ color: 0x4f5258, flatShading: true });
            sharedMaterials.rockRuneEssence = new THREE.MeshLambertMaterial({ color: 0x7e848c, flatShading: true });
            sharedMaterials.trunk = new THREE.MeshLambertMaterial({ color: 0x6a452a, flatShading: true });
            sharedMaterials.trunkCut = new THREE.MeshLambertMaterial({ color: 0xb48754, flatShading: true });
            sharedMaterials.leaves = new THREE.MeshLambertMaterial({ color: 0x2f7f3a, flatShading: true });
            sharedMaterials.boothWood = new THREE.MeshLambertMaterial({color: 0x4a3018});
            sharedMaterials.fenceWood = new THREE.MeshLambertMaterial({ color: 0x6b4424, flatShading: true });
            sharedMaterials.roofThatch = new THREE.MeshLambertMaterial({ color: 0x8b6f3a, flatShading: true, transparent: true, opacity: 1 });
            
            // Castle & Floor Materials
            sharedMaterials.castleStone = new THREE.MeshLambertMaterial({ color: 0x888a85 }); 
            sharedMaterials.floor6 = new THREE.MeshLambertMaterial({ color: 0x8b5a2b }); // Wood
            sharedMaterials.floor7 = new THREE.MeshLambertMaterial({ color: 0x777777 }); // Stone
            sharedMaterials.floor8 = new THREE.MeshLambertMaterial({ color: 0x8b0000 }); // Brick
            
            // Stairs Materials
            sharedMaterials.stairsUp = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
            sharedMaterials.stairsDown = new THREE.MeshLambertMaterial({ color: 0x444444 });
            sharedMaterials.hiddenHitbox = new THREE.MeshBasicMaterial({ visible: false });
            sharedMaterials.shopCounterGlass = new THREE.MeshLambertMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6 });
            sharedMaterials.altarStone = new THREE.MeshLambertMaterial({ color: 0x5e5449, flatShading: true });
            sharedMaterials.altarCoal = new THREE.MeshLambertMaterial({ color: 0x2d2320, flatShading: true });
            sharedMaterials.altarEmber = new THREE.MeshLambertMaterial({ color: 0xff7a1a, emissive: 0x8a2f00 });
            sharedMaterials.altarCore = new THREE.MeshLambertMaterial({ color: 0xffc04d, emissive: 0x8a4d00 });
            sharedMaterials.caveMouth = new THREE.MeshLambertMaterial({ color: 0x161412, flatShading: true });
            sharedMaterials.caveRock = new THREE.MeshLambertMaterial({ color: 0x4f514b, flatShading: true });

            // Lightweight procedural textures to avoid flat-color terrain/water.
            const grassCanvas = buildGrassTextureCanvas(256);
            const grassTex = applyColorTextureSettings(new THREE.CanvasTexture(grassCanvas), 'linear');
            grassTex.wrapS = THREE.RepeatWrapping;
            grassTex.wrapT = THREE.RepeatWrapping;
            grassTex.repeat.set(1.85, 1.85);
            if (renderer && renderer.capabilities && typeof renderer.capabilities.getMaxAnisotropy === 'function') {
                grassTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
            }
            sharedMaterials.ground.map = grassTex;
            sharedMaterials.grassTile.map = grassTex;
            sharedMaterials.terrainUnderlay.map = grassTex;

            const dirtCanvas = buildDirtTextureCanvas(192);
            const dirtTex = applyColorTextureSettings(new THREE.CanvasTexture(dirtCanvas), 'linear');
            dirtTex.wrapS = THREE.RepeatWrapping;
            dirtTex.wrapT = THREE.RepeatWrapping;
            dirtTex.repeat.set(9.5, 9.5);
            if (renderer && renderer.capabilities && typeof renderer.capabilities.getMaxAnisotropy === 'function') {
                dirtTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
            }
            sharedMaterials.dirtTile.map = dirtTex;

            const barkCanvas = document.createElement('canvas');
            barkCanvas.width = 64; barkCanvas.height = 64;
            const bCtx = barkCanvas.getContext('2d');
            bCtx.fillStyle = '#6b462b';
            bCtx.fillRect(0, 0, 64, 64);
            for (let i = 0; i < 180; i++) {
                const barkShade = 74 + Math.floor(Math.random() * 42);
                bCtx.fillStyle = 'rgb(' + barkShade + ', ' + Math.max(34, barkShade - 30) + ', ' + Math.max(20, barkShade - 44) + ')';
                bCtx.fillRect(Math.floor(Math.random() * 64), 0, 1, 64);
            }
            for (let i = 0; i < 180; i++) {
                bCtx.fillStyle = 'rgba(30, 18, 10, ' + (0.08 + Math.random() * 0.25) + ')';
                bCtx.fillRect(Math.floor(Math.random() * 64), Math.floor(Math.random() * 64), 1, 3);
            }
            const barkTex = applyColorTextureSettings(new THREE.CanvasTexture(barkCanvas));
            barkTex.wrapS = THREE.RepeatWrapping;
            barkTex.wrapT = THREE.RepeatWrapping;
            barkTex.repeat.set(1, 3.5);
            sharedMaterials.trunk.color.setHex(0xffffff);
            sharedMaterials.trunk.map = barkTex;

            const leafCanvas = document.createElement('canvas');
            leafCanvas.width = 64; leafCanvas.height = 64;
            const lCtx = leafCanvas.getContext('2d');
            lCtx.fillStyle = '#5f8347';
            lCtx.fillRect(0, 0, 64, 64);
            for (let i = 0; i < 760; i++) {
                const green = 88 + Math.floor(Math.random() * 46);
                const red = Math.max(58, green - (18 + Math.floor(Math.random() * 10)));
                const blue = Math.max(44, green - (40 + Math.floor(Math.random() * 10)));
                lCtx.fillStyle = 'rgba(' + red + ', ' + green + ', ' + blue + ', ' + (0.3 + Math.random() * 0.28) + ')';
                lCtx.fillRect(Math.floor(Math.random() * 64), Math.floor(Math.random() * 64), 1, 1);
            }
            for (let i = 0; i < 72; i++) {
                lCtx.fillStyle = 'rgba(142, 160, 84, ' + (0.03 + Math.random() * 0.04) + ')';
                lCtx.fillRect(Math.floor(Math.random() * 64), Math.floor(Math.random() * 64), 2, 2);
            }
            const leafTex = applyColorTextureSettings(new THREE.CanvasTexture(leafCanvas));
            leafTex.wrapS = THREE.RepeatWrapping;
            leafTex.wrapT = THREE.RepeatWrapping;
            leafTex.repeat.set(1.8, 1.8);
            sharedMaterials.leaves.color.setHex(0xffffff);
            sharedMaterials.leaves.map = leafTex;

            const makeNoiseTexture = (baseHex, vMin, vMax, speckleCount, patchCount = 42, patchSize = 5) => {
                const texCanvas = document.createElement('canvas');
                texCanvas.width = 64; texCanvas.height = 64;
                const tCtx = texCanvas.getContext('2d');
                const r = (baseHex >> 16) & 255;
                const g = (baseHex >> 8) & 255;
                const b = baseHex & 255;
                tCtx.fillStyle = `rgb(${r},${g},${b})`;
                tCtx.fillRect(0, 0, 64, 64);

                // Macro variation blocks so the texture reads at gameplay zoom.
                for (let i = 0; i < patchCount; i++) {
                    const v = vMin + Math.floor(Math.random() * (vMax - vMin + 1));
                    const rr = Math.max(0, Math.min(255, r + v));
                    const gg = Math.max(0, Math.min(255, g + v));
                    const bb = Math.max(0, Math.min(255, b + v));
                    tCtx.fillStyle = `rgb(${rr},${gg},${bb})`;
                    const px = Math.floor(Math.random() * 64);
                    const py = Math.floor(Math.random() * 64);
                    const pw = Math.max(2, Math.floor(Math.random() * patchSize) + 2);
                    const ph = Math.max(2, Math.floor(Math.random() * patchSize) + 2);
                    tCtx.fillRect(px, py, pw, ph);
                }

                // Micro speckles keep surfaces from looking flat up close.
                for (let i = 0; i < speckleCount; i++) {
                    const v = vMin + Math.floor(Math.random() * (vMax - vMin + 1));
                    const rr = Math.max(0, Math.min(255, r + v));
                    const gg = Math.max(0, Math.min(255, g + v));
                    const bb = Math.max(0, Math.min(255, b + v));
                    tCtx.fillStyle = `rgb(${rr},${gg},${bb})`;
                    tCtx.fillRect(Math.floor(Math.random() * 64), Math.floor(Math.random() * 64), 1, 1);
                }

                const tex = applyColorTextureSettings(new THREE.CanvasTexture(texCanvas));
                tex.wrapS = THREE.RepeatWrapping;
                tex.wrapT = THREE.RepeatWrapping;
                return tex;
            };

            const applyRockOreTexture = (material, texture) => {
                if (!material || !texture) return;
                texture.repeat.set(1.35, 1.35);
                material.color.setHex(0xffffff);
                material.map = texture;
                material.needsUpdate = true;
            };
            applyRockOreTexture(sharedMaterials.rockCopper, makeNoiseTexture(0xc8754d, -28, 24, 720, 64, 7));
            applyRockOreTexture(sharedMaterials.rockTin, makeNoiseTexture(0xb8c3c9, -26, 20, 680, 58, 7));
            applyRockOreTexture(sharedMaterials.rockDepleted, makeNoiseTexture(0x4f5258, -18, 18, 560, 48, 6));

            const makeBrickTexture = (brickHex, mortarHex, jitter = 12) => {
                const canvas = document.createElement('canvas');
                canvas.width = 64; canvas.height = 64;
                const ctx = canvas.getContext('2d');
                const br = (brickHex >> 16) & 255, bg = (brickHex >> 8) & 255, bb = brickHex & 255;
                const mr = (mortarHex >> 16) & 255, mg = (mortarHex >> 8) & 255, mb = mortarHex & 255;

                ctx.fillStyle = `rgb(${mr},${mg},${mb})`;
                ctx.fillRect(0, 0, 64, 64);

                const rowH = 8;
                const brickW = 14;
                for (let y = 1; y < 64; y += rowH) {
                    const stagger = ((Math.floor(y / rowH) % 2) === 0) ? 0 : Math.floor(brickW / 2);
                    for (let x = -brickW; x < 64 + brickW; x += brickW) {
                        const v = -jitter + Math.floor(Math.random() * (jitter * 2 + 1));
                        const rr = Math.max(0, Math.min(255, br + v));
                        const gg = Math.max(0, Math.min(255, bg + v));
                        const bb2 = Math.max(0, Math.min(255, bb + v));
                        ctx.fillStyle = `rgb(${rr},${gg},${bb2})`;
                        ctx.fillRect(x + stagger + 1, y + 1, brickW - 2, rowH - 2);
                    }
                }

                const tex = applyColorTextureSettings(new THREE.CanvasTexture(canvas));
                tex.wrapS = THREE.RepeatWrapping;
                tex.wrapT = THREE.RepeatWrapping;
                return tex;
            };

            const makeWoodGrainTexture = (baseHex) => {
                const tex = makeNoiseTexture(baseHex, -20, 16, 520, 44, 8);
                const cv = tex.image;
                const ctx = cv.getContext('2d');
                for (let i = 0; i < 18; i++) {
                    const y = Math.floor(Math.random() * 64);
                    ctx.fillStyle = `rgba(40, 24, 12, ${0.10 + Math.random() * 0.12})`;
                    ctx.fillRect(0, y, 64, 1);
                }
                tex.needsUpdate = true;
                return tex;
            };

            const castleStoneTex = makeBrickTexture(0x927560, 0x77685d, 14);
            castleStoneTex.repeat.set(1.55, 1.55);
            sharedMaterials.castleStone.color.setHex(0xffffff);
            sharedMaterials.castleStone.map = castleStoneTex;
            sharedMaterials.castleStone.flatShading = true;
            sharedMaterials.castleStone.needsUpdate = true;

            const floorWoodTex = makeWoodGrainTexture(0x86603a);
            floorWoodTex.repeat.set(1.8, 1.8);
            sharedMaterials.floor6.color.setHex(0xffffff);
            sharedMaterials.floor6.map = floorWoodTex;

            const floorStoneTex = makeNoiseTexture(0xaea694, -20, 18, 560, 56, 9);
            floorStoneTex.repeat.set(1.75, 1.75);
            sharedMaterials.floor7.color.setHex(0xffffff);
            sharedMaterials.floor7.map = floorStoneTex;

            const floorBrickTex = makeNoiseTexture(0x7e5648, -10, 12, 740, 54, 7);
            floorBrickTex.repeat.set(2.0, 2.0);
            sharedMaterials.floor8.color.setHex(0xffffff);
            sharedMaterials.floor8.map = floorBrickTex;

            const boothWoodTex = makeWoodGrainTexture(0x5d3c22);
            boothWoodTex.repeat.set(1.7, 1.7);
            sharedMaterials.boothWood.color.setHex(0xffffff);
            sharedMaterials.boothWood.map = boothWoodTex;

            const stairUpTex = makeNoiseTexture(0xd7cfb9, -18, 16, 520, 42, 7);
            stairUpTex.repeat.set(1.6, 1.6);
            sharedMaterials.stairsUp.color.setHex(0xffffff);
            sharedMaterials.stairsUp.map = stairUpTex;

            const stairDownTex = makeNoiseTexture(0x7e7566, -12, 14, 520, 42, 7);
            stairDownTex.repeat.set(1.6, 1.6);
            sharedMaterials.stairsDown.color.setHex(0xffffff);
            sharedMaterials.stairsDown.map = stairDownTex;
            getWaterMaterialCaches();
            const dirCanvas = document.createElement('canvas');
            dirCanvas.width = 256; dirCanvas.height = 128;
            const dCtx = dirCanvas.getContext('2d');
            dCtx.fillStyle = '#d7c095';
            dCtx.fillRect(0, 0, 256, 128);
            dCtx.strokeStyle = '#5a3f21';
            dCtx.lineWidth = 6;
            dCtx.strokeRect(3, 3, 250, 122);
            dCtx.fillStyle = '#2b1c0d';
            dCtx.font = 'bold 24px monospace';
            dCtx.textAlign = 'center';
            dCtx.fillText('NORTH  ^', 128, 28);
            dCtx.fillText('WEST  <   +   EAST  >', 128, 66);
            dCtx.fillText('SOUTH  v', 128, 104);
            sharedMaterials.directionSignMat = new THREE.MeshBasicMaterial({
                map: applyColorTextureSettings(new THREE.CanvasTexture(dirCanvas))
            });

            const parchmentCanvas = document.createElement('canvas');
            parchmentCanvas.width = 128; parchmentCanvas.height = 128;
            const pCtx = parchmentCanvas.getContext('2d');
            pCtx.fillStyle = '#d7c095';
            pCtx.fillRect(0, 0, 128, 128);
            pCtx.strokeStyle = '#8a6334';
            pCtx.lineWidth = 5;
            pCtx.strokeRect(5, 5, 118, 118);
            pCtx.fillStyle = 'rgba(72, 44, 18, 0.24)';
            pCtx.fillRect(24, 34, 78, 5);
            pCtx.fillRect(18, 55, 92, 4);
            pCtx.fillRect(22, 73, 84, 4);
            sharedMaterials.parchmentMat = new THREE.MeshBasicMaterial({
                map: applyColorTextureSettings(new THREE.CanvasTexture(parchmentCanvas))
            });

            const noticeCanvas = document.createElement('canvas');
            noticeCanvas.width = 256; noticeCanvas.height = 128;
            const nCtx = noticeCanvas.getContext('2d');
            nCtx.fillStyle = '#d7c095';
            nCtx.fillRect(0, 0, 256, 128);
            nCtx.strokeStyle = '#5a3f21';
            nCtx.lineWidth = 6;
            nCtx.strokeRect(3, 3, 250, 122);
            nCtx.fillStyle = '#2b1c0d';
            nCtx.textAlign = 'center';
            nCtx.font = 'bold 20px monospace';
            nCtx.fillText('TUTORIAL ROUTE', 128, 28);
            nCtx.font = 'bold 17px monospace';
            nCtx.fillText('1  TALK TO GUIDE', 128, 57);
            nCtx.fillText('2  GATE TO TREES', 128, 82);
            nCtx.fillText('FOLLOW THE PATH', 128, 107);
            sharedMaterials.tutorialNoticeMat = new THREE.MeshBasicMaterial({
                map: applyColorTextureSettings(new THREE.CanvasTexture(noticeCanvas))
            });


            const bankCanvas = document.createElement('canvas'); bankCanvas.width = 256; bankCanvas.height = 64;
            const bankCtx = bankCanvas.getContext('2d'); bankCtx.fillStyle = '#000000'; bankCtx.fillRect(0,0,256,64); bankCtx.fillStyle = '#c8aa6e'; bankCtx.font = 'bold 48px monospace'; bankCtx.textAlign = 'center'; bankCtx.textBaseline = 'middle'; bankCtx.fillText('BANK', 128, 36);
            sharedMaterials.bankTexPlaneMat = new THREE.MeshBasicMaterial({
                map: applyColorTextureSettings(new THREE.CanvasTexture(bankCanvas))
            });
        
    }

    window.WorldSharedAssetsRuntime = {
        initSharedAssets
    };
})();
