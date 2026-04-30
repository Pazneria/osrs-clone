// --- Rest of ThreeJS & Engine Init ---
        let activeRoofVisuals = [];

        const worldProceduralRuntime = window.WorldProceduralRuntime || null;
        const worldRenderRuntime = window.WorldRenderRuntime || null;
        const worldGroundItemRenderRuntime = window.WorldGroundItemRenderRuntime || null;
        const worldStructureRenderRuntime = window.WorldStructureRenderRuntime || null;
        const applyColorTextureSettings = worldProceduralRuntime.applyColorTextureSettings;
        const clamp01 = worldProceduralRuntime.clamp01;
        const lerpNumber = worldProceduralRuntime.lerpNumber;
        const smoothstep = worldProceduralRuntime.smoothstep;
        const hash2D = worldProceduralRuntime.hash2D;
        const sampleFractalNoise2D = worldProceduralRuntime.sampleFractalNoise2D;
        const buildGrassTextureCanvas = worldProceduralRuntime.buildGrassTextureCanvas;
        const buildDirtTextureCanvas = worldProceduralRuntime.buildDirtTextureCanvas;
        const MAIN_DIRECTIONAL_SHADOW_CONFIG = worldRenderRuntime.MAIN_DIRECTIONAL_SHADOW_CONFIG;

        const PIER_DECK_TOP_HEIGHT = 0.28;
        const PIER_DECK_THICKNESS = 0.14;
        const PIER_WATER_SURFACE_HEIGHT = -0.075;

        function getWaterMaterialCaches() {
            return worldRenderRuntime.getWaterMaterialCaches(sharedMaterials);
        }

        function getWaterSurfaceMaterial(tokens) {
            return worldRenderRuntime.getWaterSurfaceMaterial({ THREE, sharedMaterials, tokens });
        }

        function getWaterShoreMaterial(tokens) {
            return worldRenderRuntime.getWaterShoreMaterial({ THREE, sharedMaterials, tokens });
        }

        function updateMainDirectionalShadowFocus(focusX, focusY, focusZ) {
            worldRenderRuntime.updateMainDirectionalShadowFocus(sharedMaterials, focusX, focusY, focusZ);
        }

        function initSkyRuntime() {
            return worldRenderRuntime.initSkyRuntime({
                THREE,
                scene,
                camera,
                sharedMaterials,
                buildSkyCloudNoiseCanvas: worldProceduralRuntime.buildSkyCloudNoiseCanvas,
                shadowConfig: MAIN_DIRECTIONAL_SHADOW_CONFIG
            });
        }

        function updateSkyRuntime(cameraPosition, frameNowMs) {
            worldRenderRuntime.updateSkyRuntime(sharedMaterials, cameraPosition, frameNowMs);
        }

        function initSharedAssets() {
            sharedGeometries.ground = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE);
            sharedGeometries.ground.rotateX(-Math.PI / 2);
            sharedGeometries.tileColumn = new THREE.BoxGeometry(1, 1, 1);
            sharedGeometries.fishingSpotMarker = new THREE.CylinderGeometry(0.15, 0.15, 0.25, 10);

            sharedGeometries.treeTrunk = new THREE.CylinderGeometry(0.16, 0.28, 2.0, 6).translate(0, 1.0, 0);
            sharedGeometries.treeBranch = new THREE.CylinderGeometry(0.055, 0.095, 1.18, 6).rotateZ(Math.PI / 2.65).translate(0.44, 1.52, 0.04);
            sharedGeometries.treeBranch2 = new THREE.CylinderGeometry(0.05, 0.09, 1.06, 6).rotateZ(-Math.PI / 2.45).translate(-0.42, 1.66, -0.06);
            sharedGeometries.treeBranch3 = new THREE.CylinderGeometry(0.045, 0.08, 0.94, 6).rotateX(Math.PI / 6.2).rotateZ(Math.PI / 3.05).translate(0.12, 1.86, -0.34);
            sharedGeometries.leaf1 = new THREE.DodecahedronGeometry(0.86, 0).scale(1.52, 0.95, 1.42).translate(0.02, 2.42, 0);
            sharedGeometries.leaf2 = new THREE.IcosahedronGeometry(0.62, 0).scale(1.34, 0.9, 1.2).translate(0.62, 2.18, 0.34);
            sharedGeometries.leaf3 = new THREE.IcosahedronGeometry(0.6, 0).scale(1.26, 0.94, 1.22).translate(-0.58, 2.16, -0.32);
            sharedGeometries.leaf4 = new THREE.DodecahedronGeometry(0.56, 0).scale(1.18, 0.88, 1.14).translate(-0.06, 2.58, 0.44);
            sharedGeometries.willowDrape1 = new THREE.CylinderGeometry(0.065, 0.012, 1.82, 4).rotateZ(0.08).translate(1.02, 2.34, 0.66);
            sharedGeometries.willowDrape2 = new THREE.CylinderGeometry(0.062, 0.012, 1.76, 4).rotateZ(-0.07).translate(-0.98, 2.3, -0.58);
            sharedGeometries.willowDrape3 = new THREE.CylinderGeometry(0.06, 0.011, 1.94, 4).rotateZ(0.14).translate(-0.86, 2.26, 0.74);
            sharedGeometries.willowDrape4 = new THREE.CylinderGeometry(0.068, 0.012, 2.02, 4).rotateZ(-0.1).translate(0.92, 2.2, -0.72);
            sharedGeometries.willowDrape5 = new THREE.CylinderGeometry(0.055, 0.01, 1.68, 4).rotateZ(0.05).translate(0.18, 2.44, 0.96);
            sharedGeometries.willowDrape6 = new THREE.CylinderGeometry(0.055, 0.01, 1.72, 4).rotateZ(-0.06).translate(-0.22, 2.4, -0.96);
            sharedGeometries.willowDrape7 = new THREE.CylinderGeometry(0.058, 0.011, 1.86, 4).rotateZ(0.11).translate(-1.04, 2.18, 0.06);
            sharedGeometries.willowDrape8 = new THREE.CylinderGeometry(0.058, 0.011, 1.9, 4).rotateZ(-0.12).translate(1.06, 2.16, -0.08);
            sharedGeometries.rockClay = new THREE.DodecahedronGeometry(0.46, 0).scale(1.18, 0.58, 0.96).translate(0, 0.27, 0);
            sharedGeometries.rockCopper = new THREE.IcosahedronGeometry(0.48, 0).scale(1.08, 0.8, 0.95).translate(0, 0.34, 0);
            sharedGeometries.rockTin = new THREE.DodecahedronGeometry(0.46, 0).scale(1.0, 0.74, 0.92).translate(0, 0.32, 0);
            sharedGeometries.rockIron = new THREE.BoxGeometry(0.78, 0.58, 0.72).translate(0, 0.29, 0);
            sharedGeometries.rockCoal = new THREE.TetrahedronGeometry(0.58, 0).scale(1.22, 0.78, 1.04).translate(0, 0.36, 0);
            sharedGeometries.rockSilver = new THREE.OctahedronGeometry(0.5, 0).scale(1.08, 0.9, 0.92).translate(0, 0.42, 0);
            sharedGeometries.rockSapphire = new THREE.OctahedronGeometry(0.52, 0).scale(0.82, 1.16, 0.82).translate(0, 0.54, 0);
            sharedGeometries.rockGold = new THREE.DodecahedronGeometry(0.5, 0).scale(1.22, 0.78, 0.9).translate(0, 0.36, 0);
            sharedGeometries.rockEmerald = new THREE.OctahedronGeometry(0.52, 0).scale(0.72, 1.28, 0.72).translate(0, 0.58, 0);
            sharedGeometries.rockDepleted = new THREE.IcosahedronGeometry(0.42, 0).scale(0.95, 0.66, 0.9).translate(0, 0.28, 0);
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
            sharedMaterials.rockCopper = new THREE.MeshLambertMaterial({ color: 0xb06a4c, flatShading: true });
            sharedMaterials.rockTin = new THREE.MeshLambertMaterial({ color: 0x9aa5ae, flatShading: true });
            sharedMaterials.rockIron = new THREE.MeshLambertMaterial({ color: 0x6f7985, flatShading: true });
            sharedMaterials.rockCoal = new THREE.MeshLambertMaterial({ color: 0x3f444c, flatShading: true });
            sharedMaterials.rockSilver = new THREE.MeshLambertMaterial({ color: 0xc8ced6, flatShading: true });
            sharedMaterials.rockSapphire = new THREE.MeshLambertMaterial({ color: 0x3d6ed8, flatShading: true });
            sharedMaterials.rockGold = new THREE.MeshLambertMaterial({ color: 0xd4a829, flatShading: true });
            sharedMaterials.rockEmerald = new THREE.MeshLambertMaterial({ color: 0x2aa66f, flatShading: true });
            sharedMaterials.rockDepleted = new THREE.MeshLambertMaterial({ color: 0x5a5f68, flatShading: true });
            sharedMaterials.rockRuneEssence = new THREE.MeshLambertMaterial({ color: 0x7e848c, flatShading: true });
            sharedMaterials.trunk = new THREE.MeshLambertMaterial({ color: 0x6a452a, flatShading: true });
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

            // Lightweight procedural textures to avoid flat-color terrain/water.
            const grassCanvas = buildGrassTextureCanvas(192);
            const grassTex = applyColorTextureSettings(new THREE.CanvasTexture(grassCanvas), 'linear');
            grassTex.wrapS = THREE.RepeatWrapping;
            grassTex.wrapT = THREE.RepeatWrapping;
            grassTex.repeat.set(12, 12);
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
            lCtx.fillStyle = '#82a171';
            lCtx.fillRect(0, 0, 64, 64);
            for (let i = 0; i < 900; i++) {
                const green = 112 + Math.floor(Math.random() * 60);
                const red = Math.max(74, green - (24 + Math.floor(Math.random() * 10)));
                const blue = Math.max(56, green - (40 + Math.floor(Math.random() * 14)));
                lCtx.fillStyle = 'rgba(' + red + ', ' + green + ', ' + blue + ', ' + (0.42 + Math.random() * 0.42) + ')';
                lCtx.fillRect(Math.floor(Math.random() * 64), Math.floor(Math.random() * 64), 1, 1);
            }
            for (let i = 0; i < 120; i++) {
                lCtx.fillStyle = 'rgba(182, 168, 112, ' + (0.04 + Math.random() * 0.06) + ')';
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


            const bankCanvas = document.createElement('canvas'); bankCanvas.width = 256; bankCanvas.height = 64;
            const bankCtx = bankCanvas.getContext('2d'); bankCtx.fillStyle = '#000000'; bankCtx.fillRect(0,0,256,64); bankCtx.fillStyle = '#c8aa6e'; bankCtx.font = 'bold 48px monospace'; bankCtx.textAlign = 'center'; bankCtx.textBaseline = 'middle'; bankCtx.fillText('BANK', 128, 36);
            sharedMaterials.bankTexPlaneMat = new THREE.MeshBasicMaterial({
                map: applyColorTextureSettings(new THREE.CanvasTexture(bankCanvas))
            });
        }

        function createPickaxePoseReferenceRig() {
            if (typeof buildAppearanceFromEquipment !== 'function' || typeof createPlayerRigFromAppearance !== 'function') {
                return createPlayerRigFromCurrentAppearance();
            }

            const appearance = buildAppearanceFromEquipment();
            if (!appearance || !Array.isArray(appearance.slots)) return createPlayerRigFromCurrentAppearance();

            const forcedAppearance = {
                gender: appearance.gender,
                colors: Array.isArray(appearance.colors) ? appearance.colors.slice(0, 5) : [0, 0, 0, 0, 0],
                slots: appearance.slots.map((slot) => (slot ? { kind: slot.kind, id: slot.id } : null))
            };

            // Slot index 3 is weapon in PLAYER_APPEARANCE_SLOT_ORDER.
            forcedAppearance.slots[3] = { kind: 'item', id: 'iron_pickaxe' };
            return createPlayerRigFromAppearance(forcedAppearance);
        }
        function getPlayerRigShoulderPivotLocal(rig) {
            const defaultTorsoY = 1.05;
            const torsoY = (rig && rig.torso && rig.torso.userData && rig.torso.userData.defaultPos && Number.isFinite(rig.torso.userData.defaultPos.y))
                ? rig.torso.userData.defaultPos.y
                : ((rig && rig.torso && Number.isFinite(rig.torso.position.y)) ? rig.torso.position.y : defaultTorsoY);
            return {
                x: PLAYER_SHOULDER_PIVOT.x,
                y: PLAYER_SHOULDER_PIVOT.y - torsoY,
                z: PLAYER_SHOULDER_PIVOT.z
            };
        }

        function resetMiningReferencePose(rig) {
            if (!rig) return;
            const shoulderPivot = getPlayerRigShoulderPivotLocal(rig);
            rig.leftArm.position.set(shoulderPivot.x, shoulderPivot.y, shoulderPivot.z);
            rig.rightArm.position.set(-shoulderPivot.x, shoulderPivot.y, shoulderPivot.z);
            rig.leftArm.rotation.set(0, 0, 0);
            rig.rightArm.rotation.set(0, 0, 0);
            rig.leftLowerArm.rotation.set(0, 0, 0);
            rig.rightLowerArm.rotation.set(0, 0, 0);
            const elbowPivot = rig.elbowPivot || { x: 0, y: -0.35, z: -0.1 };
            const elbowBaseX = Number.isFinite(elbowPivot.x) ? elbowPivot.x : 0;
            const elbowBaseY = Number.isFinite(elbowPivot.y) ? elbowPivot.y : -0.35;
            const elbowBaseZ = Number.isFinite(elbowPivot.z) ? elbowPivot.z : -0.1;
            rig.leftLowerArm.position.set(elbowBaseX, elbowBaseY, elbowBaseZ);
            rig.rightLowerArm.position.set(-elbowBaseX, elbowBaseY, elbowBaseZ);
            rig.torso.rotation.set(0, 0, 0);
            rig.head.rotation.set(0, 0, 0);
            rig.leftLeg.rotation.set(0, 0, 0);
            rig.rightLeg.rotation.set(0, 0, 0);
            if (rig.leftLowerLeg) rig.leftLowerLeg.rotation.set(0, 0, 0);
            if (rig.rightLowerLeg) rig.rightLowerLeg.rotation.set(0, 0, 0);
            rig.leftArm.scale.set(1, 1, 1);
            rig.rightArm.scale.set(1, 1, 1);
            rig.leftLowerArm.scale.set(1, 1, 1);
            rig.rightLowerArm.scale.set(1, 1, 1);
            rig.axe.visible = true;
            rig.axe.rotation.set(0, 0, 0);
        }

        function applyMiningReferenceVariant(rigRoot, variantIndex, frameNowMs) {
            if (!rigRoot || !rigRoot.userData || !rigRoot.userData.rig) return;
            const rig = rigRoot.userData.rig;
            const deg = Math.PI / 180;
            resetMiningReferencePose(rig);

            const centerlineBottomPose = (opts = {}) => {
                const shoulderPivot = getPlayerRigShoulderPivotLocal(rig);
                const torsoHalfWidth = 0.54 * 0.5;
                const upperArmHalfWidth = (0.20 * 1.02) * 0.5;
                const shoulderClearance = 0.008;
                const minShoulderAbsX = torsoHalfWidth + upperArmHalfWidth + shoulderClearance;
                const maxInward = Math.max(0, shoulderPivot.x - minShoulderAbsX);
                const requestedInward = opts.shoulderInward || 0.0;
                const shoulderInward = Math.min(Math.max(0, requestedInward), maxInward);
                const shoulderBack = opts.shoulderBack || 0.07;
                const torsoTopY = 0.68 * 0.5;
                const shoulderLiftDefault = torsoTopY - shoulderPivot.y;
                const shoulderLift = (opts.shoulderLift !== undefined) ? opts.shoulderLift : shoulderLiftDefault;
                const torsoTwist = (opts.torsoTwist || 0) * deg;
                const torsoLean = (opts.torsoLean || -4) * deg;
                const upperLift = (opts.upperLift || -52) * deg;
                const upperLiftRight = (opts.upperLiftRight || -56) * deg;
                const upperInwardYaw = (opts.upperInwardYaw || 8) * deg;
                const elbowBendPrimary = (opts.elbowBendPrimary || -90) * deg;
                const forearmTwist = (opts.forearmTwist || 110) * deg;
                const elbowBendSecondary = (opts.elbowBendSecondary || -45) * deg;
                const elbowTowardCenterOffset = opts.elbowTowardCenterOffset || 0.02;
                const elbowForwardOffset = opts.elbowForwardOffset || 0.1;
                const elbowPivot = rig.elbowPivot || { x: 0, y: -0.35, z: -0.1 };
                const elbowBaseX = Number.isFinite(elbowPivot.x) ? elbowPivot.x : 0;
                const elbowBaseY = Number.isFinite(elbowPivot.y) ? elbowPivot.y : -0.35;
                const elbowBaseZ = Number.isFinite(elbowPivot.z) ? elbowPivot.z : -0.1;

                rig.leftArm.position.set(
                    shoulderPivot.x - shoulderInward,
                    shoulderPivot.y + shoulderLift,
                    shoulderPivot.z - shoulderBack
                );
                rig.rightArm.position.set(
                    -shoulderPivot.x + shoulderInward,
                    shoulderPivot.y + shoulderLift,
                    shoulderPivot.z - shoulderBack
                );

                // Move elbows toward centerline and forward to avoid forearm clipping upper arm.
                rig.leftLowerArm.position.set(elbowBaseX - elbowTowardCenterOffset, elbowBaseY, elbowBaseZ + elbowForwardOffset);
                rig.rightLowerArm.position.set(-elbowBaseX + elbowTowardCenterOffset, elbowBaseY, elbowBaseZ + elbowForwardOffset);

                rig.leftArm.scale.set(1.02, 1.1, 1.02);
                rig.rightArm.scale.set(1.02, 1.1, 1.02);
                rig.leftLowerArm.scale.set(1.0, 1.08, 1.0);
                rig.rightLowerArm.scale.set(1.0, 1.08, 1.0);

                rig.torso.rotation.set(torsoLean, torsoTwist, 0);
                rig.head.rotation.set(0, torsoTwist * 0.45, 0);

                // Upper arms stay in a straight swing plane (no roll).
                rig.leftArm.rotation.set(upperLift, -upperInwardYaw, 0);
                rig.rightArm.rotation.set(upperLiftRight, upperInwardYaw, 0);

                // Algorithmic elbow sequence:
                // 1) bend 90, 2) rotate forearm, 3) bend again in rotated frame.
                rig.leftLowerArm.rotation.set(0, 0, 0);
                rig.rightLowerArm.rotation.set(0, 0, 0);
                rig.leftLowerArm.rotateX(elbowBendPrimary);
                rig.leftLowerArm.rotateY(forearmTwist);
                rig.leftLowerArm.rotateX(elbowBendSecondary);
                rig.rightLowerArm.rotateX(elbowBendPrimary);
                rig.rightLowerArm.rotateY(-forearmTwist);
                rig.rightLowerArm.rotateX(elbowBendSecondary);

                rig.leftLeg.rotation.x = 0;
                rig.rightLeg.rotation.x = 0;
                if (rig.leftLowerLeg) rig.leftLowerLeg.rotation.x = 0;
                if (rig.rightLowerLeg) rig.rightLowerLeg.rotation.x = 0;
                rigRoot.position.y = rigRoot.userData.baseVisualY;
            };

            // Frozen bottom-of-swing tuning variants.
            if (variantIndex === 0) {
                centerlineBottomPose({
                    shoulderInward: 0.0,
                    shoulderBack: 0.07,
                    shoulderLift: 0.08,
                    upperLift: -50,
                    upperLiftRight: -54,
                    upperInwardYaw: 8,
                    elbowBendPrimary: -90,
                    forearmTwist: 110,
                    elbowBendSecondary: -45,
                    elbowTowardCenterOffset: 0.02,
                    elbowForwardOffset: 0.1,
                    torsoLean: -5,
                    torsoTwist: 1
                });
                return;
            }

            if (variantIndex === 1) {
                centerlineBottomPose({
                    shoulderInward: 0.0,
                    shoulderBack: 0.065,
                    shoulderLift: 0.045,
                    upperLift: -54,
                    upperLiftRight: -58,
                    upperInwardYaw: 7,
                    elbowBendPrimary: -90,
                    forearmTwist: 108,
                    elbowBendSecondary: -42,
                    elbowTowardCenterOffset: 0.018,
                    elbowForwardOffset: 0.095,
                    torsoLean: -4,
                    torsoTwist: -1
                });
                return;
            }

            if (variantIndex === 2) {
                centerlineBottomPose({
                    shoulderInward: 0.0,
                    shoulderBack: 0.075,
                    shoulderLift: 0.055,
                    upperLift: -48,
                    upperLiftRight: -52,
                    upperInwardYaw: 9,
                    elbowBendPrimary: -90,
                    forearmTwist: 112,
                    elbowBendSecondary: -46,
                    elbowTowardCenterOffset: 0.022,
                    elbowForwardOffset: 0.105,
                    torsoLean: -6,
                    torsoTwist: 2
                });
                return;
            }

            centerlineBottomPose({
                shoulderInward: 0.0,
                shoulderBack: 0.07,
                shoulderLift: 0.08,
                upperLift: -52,
                upperLiftRight: -56,
                upperInwardYaw: 8,
                elbowBendPrimary: -90,
                forearmTwist: 110,
                elbowBendSecondary: -44,
                elbowTowardCenterOffset: 0.02,
                elbowForwardOffset: 0.1,
                torsoLean: -4,
                torsoTwist: 0
            });
            return;
        }
        function createPoseVariantLabel(labelText) {
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;

            ctx.fillStyle = 'rgba(8, 10, 14, 0.82)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = 'rgba(255, 233, 120, 0.95)';
            ctx.lineWidth = 4;
            ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 42px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(labelText, canvas.width / 2, canvas.height / 2 + 1);

            const texture = applyColorTextureSettings(new THREE.CanvasTexture(canvas), 'linear');
            const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false });
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(0.9, 0.45, 1);
            return sprite;
        }

        const MINING_REFERENCE_VARIANTS = [
            { label: '1', name: 'Balanced Arc' },
            { label: '2', name: 'Heavy Windup' },
            { label: '3', name: 'Quick Chops' },
            { label: '4', name: 'Wide Cross' }
        ];

        let miningPoseReferences = [];
        let staticNpcBaseTiles = new Map();
        let loadedChunkNpcActors = new Map();
        const TOWN_NPC_STEP_DIRS = Object.freeze([
            { x: 0, y: -1 },
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: -1, y: 0 }
        ]);

        function clearMiningPoseReferences() {
            for (let i = 0; i < miningPoseReferences.length; i++) {
                const refData = miningPoseReferences[i];
                const refRig = refData && refData.rig ? refData.rig : refData;
                if (refRig && refRig.parent) refRig.parent.remove(refRig);
            }
            miningPoseReferences = [];
        }

        function occupiedTileKey(x, y, z = 0) {
            return `${z}:${x}:${y}`;
        }

        function rememberStaticNpcBaseTile(x, y, z, tileId) {
            if (!Number.isFinite(tileId)) return;
            staticNpcBaseTiles.set(occupiedTileKey(x, y, z), Math.floor(Number(tileId)));
        }

        function resolveSolidNpcBaseTile(x, y, z) {
            const staticBaseTile = staticNpcBaseTiles.get(occupiedTileKey(x, y, z));
            if (Number.isFinite(staticBaseTile)) return staticBaseTile;
            if (typeof window.getCombatEnemyOccupiedBaseTileId === 'function') {
                const combatBaseTile = window.getCombatEnemyOccupiedBaseTileId(x, y, z);
                if (Number.isFinite(combatBaseTile)) return Math.floor(Number(combatBaseTile));
            }
            return null;
        }

        function getVisualTileId(tileId, x, y, z) {
            if (tileId !== TileId.SOLID_NPC) return tileId;
            const baseTile = resolveSolidNpcBaseTile(x, y, z);
            return Number.isFinite(baseTile) ? baseTile : tileId;
        }

        function isWoodenGateTileIdSafe(tileId) {
            if (typeof window.isWoodenGateTileId === 'function') return window.isWoodenGateTileId(tileId);
            return tileId === TileId.WOODEN_GATE_CLOSED || tileId === TileId.WOODEN_GATE_OPEN;
        }

        function isFenceConnectorTile(tileId) {
            return tileId === TileId.FENCE || isWoodenGateTileIdSafe(tileId);
        }

        function getDoorClosedTileId(door) {
            return door && door.isWoodenGate ? TileId.WOODEN_GATE_CLOSED : TileId.DOOR_CLOSED;
        }

        function getDoorOpenTileId(door) {
            return door && door.isWoodenGate ? TileId.WOODEN_GATE_OPEN : TileId.DOOR_OPEN;
        }

        function getTileHeightSafe(x, y, z = 0) {
            if (!heightMap || !heightMap[z] || !heightMap[z][y]) return 0;
            const h = heightMap[z][y][x];
            return Number.isFinite(h) ? h : 0;
        }

        function normalizeAngleRadians(angle) {
            let value = Number.isFinite(angle) ? angle : 0;
            while (value <= -Math.PI) value += Math.PI * 2;
            while (value > Math.PI) value -= Math.PI * 2;
            return value;
        }

        function shortestAngleDelta(fromAngle, toAngle) {
            return normalizeAngleRadians((Number.isFinite(toAngle) ? toAngle : 0) - (Number.isFinite(fromAngle) ? fromAngle : 0));
        }

        function hashTownNpcSeed(text) {
            const source = typeof text === 'string' ? text : '';
            let hash = 2166136261;
            for (let i = 0; i < source.length; i++) {
                hash ^= source.charCodeAt(i);
                hash = Math.imul(hash, 16777619);
            }
            return hash >>> 0;
        }

        function resolveTownNpcDefaultFacingYaw(npc) {
            if (npc && Number.isFinite(npc.facingYaw)) return npc.facingYaw;
            if (npc && npc.name === 'Shopkeeper') return Math.PI / 2;
            if (npc && npc.name === 'Banker') return 0;
            return Math.PI;
        }

        function clearTownNpcRenderBindings(actor) {
            if (!actor || typeof actor !== 'object') return;
            actor.mesh = null;
            actor.hitbox = null;
            actor.renderChunkKey = null;
        }

        function findDoorStateAt(x, y, z = 0) {
            if (!Array.isArray(doorsToRender)) return null;
            for (let i = 0; i < doorsToRender.length; i++) {
                const door = doorsToRender[i];
                if (!door) continue;
                if (door.x === x && door.y === y && door.z === z) return door;
            }
            return null;
        }

        function isTutorialGateUnlocked(door) {
            if (!door || !Number.isFinite(door.tutorialRequiredStep)) return true;
            const tutorial = window.TutorialRuntime || null;
            const step = tutorial && typeof tutorial.getStep === 'function' ? tutorial.getStep() : 0;
            return step >= door.tutorialRequiredStep;
        }

        function isTutorialGateLocked(door) {
            return !!(door && Number.isFinite(door.tutorialRequiredStep) && !isTutorialGateUnlocked(door));
        }

        function refreshTutorialGateStates() {
            if (!Array.isArray(doorsToRender)) return;
            for (let i = 0; i < doorsToRender.length; i++) {
                const door = doorsToRender[i];
                if (!door || !Number.isFinite(door.tutorialRequiredStep)) continue;
                const unlocked = isTutorialGateUnlocked(door);
                door.isOpen = unlocked;
                door.targetRotation = unlocked ? door.openRot : door.closedRot;
                if (logicalMap[door.z] && logicalMap[door.z][door.y]) {
                    logicalMap[door.z][door.y][door.x] = unlocked ? getDoorOpenTileId(door) : getDoorClosedTileId(door);
                }
            }
            if (typeof updateMinimapCanvas === 'function') updateMinimapCanvas();
        }

        window.refreshTutorialGateStates = refreshTutorialGateStates;
        window.isTutorialGateLocked = isTutorialGateLocked;

        function openTownNpcDoorAt(x, y, z = 0) {
            const door = findDoorStateAt(x, y, z);
            if (!door || door.isOpen) return false;
            if (isTutorialGateLocked(door)) return false;
            door.isOpen = true;
            door.targetRotation = door.openRot;
            if (logicalMap[door.z] && logicalMap[door.z][door.y]) {
                logicalMap[door.z][door.y][door.x] = getDoorOpenTileId(door);
            }
            return true;
        }

        function releaseTownNpcOccupiedTile(actor) {
            if (!actor || !logicalMap[actor.z] || !logicalMap[actor.z][actor.y]) return;
            const key = occupiedTileKey(actor.x, actor.y, actor.z);
            const baseTile = staticNpcBaseTiles.get(key);
            if (Number.isFinite(baseTile)) {
                logicalMap[actor.z][actor.y][actor.x] = Math.floor(Number(baseTile));
            }
            staticNpcBaseTiles.delete(key);
        }

        function occupyTownNpcTile(actor, x, y) {
            if (!actor || !logicalMap[actor.z] || !logicalMap[actor.z][y]) return false;
            rememberStaticNpcBaseTile(x, y, actor.z, logicalMap[actor.z][y][x]);
            logicalMap[actor.z][y][x] = TileId.SOLID_NPC;
            return true;
        }

        function isTownNpcStepWithinBounds(actor, x, y) {
            if (!actor) return false;
            if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
            if (x <= 0 || y <= 0 || x >= MAP_SIZE - 1 || y >= MAP_SIZE - 1) return false;
            if (actor.roamBounds) {
                if (x < actor.roamBounds.xMin || x > actor.roamBounds.xMax || y < actor.roamBounds.yMin || y > actor.roamBounds.yMax) return false;
            }
            const radius = Number.isFinite(actor.roamingRadius) ? Math.max(0, Math.floor(actor.roamingRadius)) : 0;
            if (radius > 0) {
                const homeX = Number.isFinite(actor.homeX) ? actor.homeX : actor.x;
                const homeY = Number.isFinite(actor.homeY) ? actor.homeY : actor.y;
                if (Math.max(Math.abs(x - homeX), Math.abs(y - homeY)) > radius) return false;
            }
            return true;
        }

        function isTownNpcStepTraversable(actor, nextX, nextY) {
            if (!actor || !logicalMap[actor.z] || !logicalMap[actor.z][nextY]) return false;
            if (!isTownNpcStepWithinBounds(actor, nextX, nextY)) return false;
            const nextTile = logicalMap[actor.z][nextY][nextX];
            const traversableDoorTile = nextTile === TileId.DOOR_CLOSED
                || nextTile === TileId.DOOR_OPEN
                || nextTile === TileId.WOODEN_GATE_OPEN;
            if (!traversableDoorTile && (typeof window.isWalkableTileId !== 'function' || !window.isWalkableTileId(nextTile))) return false;
            const currentTile = logicalMap[actor.z][actor.y][actor.x];
            const currentHeight = getTileHeightSafe(actor.x, actor.y, actor.z);
            const nextHeight = getTileHeightSafe(nextX, nextY, actor.z);
            const stairTransition = (currentTile === TileId.STAIRS_RAMP || nextTile === TileId.STAIRS_RAMP) && Math.abs(currentHeight - nextHeight) <= 0.6;
            return Math.abs(currentHeight - nextHeight) <= 0.3 || stairTransition;
        }

        function ensureTownNpcRigDefaults(actorMesh) {
            if (!actorMesh || !actorMesh.userData || !actorMesh.userData.rig) return null;
            if (actorMesh.userData.townNpcRigDefaults) return actorMesh.userData.townNpcRigDefaults;
            const rig = actorMesh.userData.rig;
            const nodeNames = [
                'head',
                'torso',
                'leftArm',
                'rightArm',
                'leftLowerArm',
                'rightLowerArm',
                'leftLeg',
                'rightLeg',
                'leftLowerLeg',
                'rightLowerLeg'
            ];
            const defaults = {
                nodes: {},
                baseY: Number.isFinite(actorMesh.userData.baseY) ? actorMesh.userData.baseY : 0
            };
            for (let i = 0; i < nodeNames.length; i++) {
                const nodeName = nodeNames[i];
                const node = rig[nodeName];
                if (!node) continue;
                defaults.nodes[nodeName] = {
                    position: node.position.clone(),
                    rotation: node.rotation.clone(),
                    scale: node.scale.clone()
                };
            }
            actorMesh.userData.townNpcRigDefaults = defaults;
            return defaults;
        }

        function applyTownNpcRigAnimation(actor, frameNowMs, visualBaseY) {
            if (!actor || !actor.mesh || !actor.mesh.userData || !actor.mesh.userData.rig) return;
            const rig = actor.mesh.userData.rig;
            const defaults = ensureTownNpcRigDefaults(actor.mesh);
            if (!defaults) {
                actor.mesh.position.y = visualBaseY;
                return;
            }

            const defaultNodes = defaults.nodes || {};
            Object.keys(defaultNodes).forEach((nodeName) => {
                const node = rig[nodeName];
                const nodeDefaults = defaultNodes[nodeName];
                if (!node || !nodeDefaults) return;
                node.position.copy(nodeDefaults.position);
                node.rotation.copy(nodeDefaults.rotation);
                node.scale.copy(nodeDefaults.scale);
            });

            const walkActive = Number.isFinite(actor.moveDurationMs) && actor.moveDurationMs > 0;
            const phaseOffset = Number.isFinite(actor.animationSeed) ? (actor.animationSeed % 628) / 100 : 0;
            const phase = phaseOffset + (frameNowMs * (walkActive ? 0.011 : 0.0038));
            const stride = walkActive ? Math.sin(phase) * 0.52 : Math.sin(phase * 1.1) * 0.06;
            const bounce = walkActive ? Math.abs(Math.sin(phase)) * 0.034 : (Math.sin(phase * 0.65) * 0.01);
            const armSwing = stride * 0.72;
            const torsoTilt = stride * 0.08;
            const headNod = walkActive ? Math.sin(phase * 2) * 0.04 : Math.sin(phase * 0.8) * 0.015;
            const leftKnee = walkActive ? Math.max(0, -stride) * 0.78 : 0;
            const rightKnee = walkActive ? Math.max(0, stride) * 0.78 : 0;

            actor.mesh.position.y = visualBaseY + bounce;
            if (rig.torso && defaultNodes.torso) {
                rig.torso.position.y = defaultNodes.torso.position.y + (bounce * 0.45);
                rig.torso.rotation.z = defaultNodes.torso.rotation.z + torsoTilt;
            }
            if (rig.head && defaultNodes.head) {
                rig.head.position.y = defaultNodes.head.position.y + (bounce * 0.2);
                rig.head.rotation.x = defaultNodes.head.rotation.x + headNod;
            }
            if (rig.leftArm) rig.leftArm.rotation.x = (defaultNodes.leftArm ? defaultNodes.leftArm.rotation.x : 0) - armSwing;
            if (rig.rightArm) rig.rightArm.rotation.x = (defaultNodes.rightArm ? defaultNodes.rightArm.rotation.x : 0) + armSwing;
            if (rig.leftLowerArm) rig.leftLowerArm.rotation.x = (defaultNodes.leftLowerArm ? defaultNodes.leftLowerArm.rotation.x : 0) + Math.max(0, armSwing) * 0.18;
            if (rig.rightLowerArm) rig.rightLowerArm.rotation.x = (defaultNodes.rightLowerArm ? defaultNodes.rightLowerArm.rotation.x : 0) + Math.max(0, -armSwing) * 0.18;
            if (rig.leftLeg) rig.leftLeg.rotation.x = (defaultNodes.leftLeg ? defaultNodes.leftLeg.rotation.x : 0) + stride;
            if (rig.rightLeg) rig.rightLeg.rotation.x = (defaultNodes.rightLeg ? defaultNodes.rightLeg.rotation.x : 0) - stride;
            if (rig.leftLowerLeg) rig.leftLowerLeg.rotation.x = (defaultNodes.leftLowerLeg ? defaultNodes.leftLowerLeg.rotation.x : 0) + leftKnee;
            if (rig.rightLowerLeg) rig.rightLowerLeg.rotation.x = (defaultNodes.rightLowerLeg ? defaultNodes.rightLowerLeg.rotation.x : 0) + rightKnee;
        }

        function shouldPauseTownNpcRoaming(actor) {
            if (!actor || typeof playerState !== 'object' || playerState == null) return false;
            if (actor.z === playerState.z && Math.max(Math.abs(actor.x - playerState.x), Math.abs(actor.y - playerState.y)) <= 1) return true;
            const dialogueRuntime = window.NpcDialogueRuntime;
            if (dialogueRuntime && typeof dialogueRuntime.isOpen === 'function' && dialogueRuntime.isOpen()) {
                const activeNpc = typeof dialogueRuntime.getActiveNpc === 'function' ? dialogueRuntime.getActiveNpc() : null;
                const activeMerchantId = activeNpc && typeof activeNpc.merchantId === 'string' ? activeNpc.merchantId.trim() : '';
                const activeDialogueId = activeNpc && typeof activeNpc.dialogueId === 'string' ? activeNpc.dialogueId.trim() : '';
                const activeName = activeNpc && typeof activeNpc.name === 'string' ? activeNpc.name.trim() : '';
                if (actor.merchantId && activeMerchantId && actor.merchantId === activeMerchantId) return true;
                if (actor.dialogueId && activeDialogueId && actor.dialogueId === activeDialogueId) return true;
                if (actor.name && activeName && actor.name === activeName) return true;
            }
            const targetUid = playerState.targetUid;
            if (!targetUid || typeof targetUid !== 'object') return false;
            if (actor.spawnId && targetUid.spawnId === actor.spawnId) return true;
            if (actor.merchantId && targetUid.merchantId === actor.merchantId) return true;
            return !!(actor.name && targetUid.name === actor.name);
        }

        function chooseTownNpcNextStep(actor, occupiedTiles, frameNowMs) {
            if (!actor || !actor.roamEnabled) return null;
            const roamingRadius = Number.isFinite(actor.roamingRadius) ? Math.max(0, Math.floor(actor.roamingRadius)) : 0;
            if (roamingRadius <= 0) return null;
            const currentKey = occupiedTileKey(actor.x, actor.y, actor.z);
            const seed = (Number.isFinite(actor.animationSeed) ? actor.animationSeed : 0) + Math.floor((Number.isFinite(frameNowMs) ? frameNowMs : 0) / 600);
            const candidateSteps = TOWN_NPC_STEP_DIRS
                .map((dir, index) => ({
                    x: actor.x + dir.x,
                    y: actor.y + dir.y,
                    sortKey: ((seed + (index * 977)) % 104729)
                }))
                .sort((left, right) => left.sortKey - right.sortKey);

            for (let i = 0; i < candidateSteps.length; i++) {
                const step = candidateSteps[i];
                const nextKey = occupiedTileKey(step.x, step.y, actor.z);
                if (nextKey !== currentKey && occupiedTiles.has(nextKey)) continue;
                if (!isTownNpcStepTraversable(actor, step.x, step.y)) continue;
                return step;
            }
            return null;
        }

        function updateWorldNpcRuntime(frameNowMs) {
            if (!Array.isArray(npcsToRender) || npcsToRender.length === 0) return;
            const frameNow = Number.isFinite(frameNowMs) ? frameNowMs : performance.now();
            const occupiedTiles = new Set();
            for (let i = 0; i < npcsToRender.length; i++) {
                const actor = npcsToRender[i];
                if (!actor || !Number.isFinite(actor.x) || !Number.isFinite(actor.y) || !Number.isFinite(actor.z)) continue;
                occupiedTiles.add(occupiedTileKey(actor.x, actor.y, actor.z));
            }

            for (let i = 0; i < npcsToRender.length; i++) {
                const actor = npcsToRender[i];
                if (!actor || !Number.isFinite(actor.x) || !Number.isFinite(actor.y) || !Number.isFinite(actor.z)) continue;

                const currentHeight = getTileHeightSafe(actor.x, actor.y, actor.z);
                let visualX = Number.isFinite(actor.visualX) ? actor.visualX : actor.x;
                let visualY = Number.isFinite(actor.visualY) ? actor.visualY : actor.y;
                let visualBaseY = currentHeight + (actor.z * 3.0);
                let moving = Number.isFinite(actor.moveDurationMs) && actor.moveDurationMs > 0;

                if (moving && Number.isFinite(actor.moveStartedAtMs) && frameNow >= actor.moveStartedAtMs) {
                    const moveProgress = Math.max(0, Math.min(1, (frameNow - actor.moveStartedAtMs) / actor.moveDurationMs));
                    visualX = actor.moveFromX + ((actor.x - actor.moveFromX) * moveProgress);
                    visualY = actor.moveFromY + ((actor.y - actor.moveFromY) * moveProgress);
                    visualBaseY = actor.moveFromHeight + ((actor.moveToHeight - actor.moveFromHeight) * moveProgress) + (actor.z * 3.0);
                    if (moveProgress >= 1) {
                        moving = false;
                        actor.moveDurationMs = 0;
                        actor.moveStartedAtMs = 0;
                        actor.facingYaw = actor.targetFacingYaw;
                        actor.idleUntilMs = frameNow + 900 + (Number.isFinite(actor.animationSeed) ? (actor.animationSeed % 900) : 0);
                    }
                } else if (!moving && frameNow >= actor.idleUntilMs && !shouldPauseTownNpcRoaming(actor)) {
                    const currentKey = occupiedTileKey(actor.x, actor.y, actor.z);
                    const nextStep = chooseTownNpcNextStep(actor, occupiedTiles, frameNow);
                    if (nextStep) {
                        const nextHeight = getTileHeightSafe(nextStep.x, nextStep.y, actor.z);
                        openTownNpcDoorAt(nextStep.x, nextStep.y, actor.z);
                        occupiedTiles.delete(currentKey);
                        releaseTownNpcOccupiedTile(actor);
                        actor.moveFromX = actor.x;
                        actor.moveFromY = actor.y;
                        actor.moveFromHeight = currentHeight;
                        actor.x = nextStep.x;
                        actor.y = nextStep.y;
                        actor.moveToHeight = nextHeight;
                        occupyTownNpcTile(actor, actor.x, actor.y);
                        occupiedTiles.add(occupiedTileKey(actor.x, actor.y, actor.z));
                        actor.targetFacingYaw = Math.atan2(actor.x - actor.moveFromX, actor.y - actor.moveFromY);
                        actor.moveStartedAtMs = frameNow;
                        actor.moveDurationMs = 720 + (Number.isFinite(actor.animationSeed) ? (actor.animationSeed % 180) : 120);
                        moving = true;
                        visualX = actor.moveFromX;
                        visualY = actor.moveFromY;
                        visualBaseY = actor.moveFromHeight + (actor.z * 3.0);
                    } else {
                        actor.idleUntilMs = frameNow + 700 + (Number.isFinite(actor.animationSeed) ? (actor.animationSeed % 1200) : 600);
                    }
                }

                actor.visualX = visualX;
                actor.visualY = visualY;
                actor.visualBaseY = visualBaseY;

                const desiredYaw = moving && Number.isFinite(actor.targetFacingYaw) ? actor.targetFacingYaw : actor.facingYaw;
                actor.visualFacingYaw = normalizeAngleRadians(
                    (Number.isFinite(actor.visualFacingYaw) ? actor.visualFacingYaw : desiredYaw)
                    + (shortestAngleDelta(actor.visualFacingYaw, desiredYaw) * 0.28)
                );

                if (actor.mesh) {
                    actor.mesh.position.set(visualX, visualBaseY, visualY);
                    actor.mesh.rotation.y = actor.visualFacingYaw;
                    applyTownNpcRigAnimation(actor, frameNow, visualBaseY);
                }
                if (actor.hitbox && actor.hitbox.userData) {
                    actor.hitbox.userData.gridX = actor.x;
                    actor.hitbox.userData.gridY = actor.y;
                    if (actor.hitbox.userData.uid) {
                        actor.hitbox.userData.uid.gridX = actor.x;
                        actor.hitbox.userData.uid.gridY = actor.y;
                    }
                }
            }
        }

        function spawnMiningPoseReferences() {
            if (!scene) return;
            clearMiningPoseReferences();

            const z = playerState.z;
            const rowTileY = Math.max(0, Math.min(MAP_SIZE - 1, playerState.y));
            const startX = playerState.x - 3;
            const refs = MINING_REFERENCE_VARIANTS.map((variant, idx) => ({
                x: startX + (idx * 2),
                y: rowTileY,
                variant,
                variantIndex: idx
            }));

            const facingYaw = (playerRig && playerRig.rotation && Number.isFinite(playerRig.rotation.y))
                ? playerRig.rotation.y
                : (Number.isFinite(playerState.targetRotation) ? playerState.targetRotation : 0);

            refs.forEach((p) => {
                if (p.x < 0 || p.y < 0 || p.x >= MAP_SIZE || p.y >= MAP_SIZE) return;
                const clone = createPickaxePoseReferenceRig();
                clone.userData.baseVisualY = getTileHeightSafe(p.x, p.y, z) + (z * 3.0);
                applyMiningReferenceVariant(clone, p.variantIndex, performance.now());
                clone.rotation.y = facingYaw;

                const label = createPoseVariantLabel(p.variant.label);
                if (label) {
                    label.position.set(0, 2.15, 0);
                    clone.add(label);
                }

                clone.position.set(p.x, clone.userData.baseVisualY, p.y);
                scene.add(clone);
                miningPoseReferences.push({
                    rig: clone,
                    variantIndex: p.variantIndex,
                    name: p.variant.name
                });
            });
        }

        function updateMiningPoseReferences(frameNowMs) {
            if (!Array.isArray(miningPoseReferences) || miningPoseReferences.length === 0) return;
            for (let i = 0; i < miningPoseReferences.length; i++) {
                const refData = miningPoseReferences[i];
                if (!refData || !refData.rig) continue;
                applyMiningReferenceVariant(refData.rig, refData.variantIndex, frameNowMs);
            }
        }

        function initThreeJS() {
            const container = document.getElementById('canvas-container');
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x5ea8f7);
            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 260);
            scene.fog = null;
            renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.shadowMap.enabled = !!MAIN_DIRECTIONAL_SHADOW_CONFIG.enabled;
            renderer.shadowMap.type = THREE.BasicShadowMap;
            container.appendChild(renderer.domElement);
            initSkyRuntime();
            scene.add(new THREE.HemisphereLight(0xfff2d6, 0xb0c29a, 1.08));
            scene.add(new THREE.AmbientLight(0xffffff, 0.88));
            const dirLight = new THREE.DirectionalLight(0xffefc0, 1.18);
            const dirLightTarget = new THREE.Object3D();
            scene.add(dirLightTarget);
            dirLight.target = dirLightTarget;
            dirLight.castShadow = !!MAIN_DIRECTIONAL_SHADOW_CONFIG.enabled;
            dirLight.shadow.mapSize.width = MAIN_DIRECTIONAL_SHADOW_CONFIG.mapSize;
            dirLight.shadow.mapSize.height = MAIN_DIRECTIONAL_SHADOW_CONFIG.mapSize;
            dirLight.shadow.camera.left = -MAIN_DIRECTIONAL_SHADOW_CONFIG.cameraHalfSize;
            dirLight.shadow.camera.right = MAIN_DIRECTIONAL_SHADOW_CONFIG.cameraHalfSize;
            dirLight.shadow.camera.top = MAIN_DIRECTIONAL_SHADOW_CONFIG.cameraHalfSize;
            dirLight.shadow.camera.bottom = -MAIN_DIRECTIONAL_SHADOW_CONFIG.cameraHalfSize;
            dirLight.shadow.camera.near = MAIN_DIRECTIONAL_SHADOW_CONFIG.cameraNear;
            dirLight.shadow.camera.far = MAIN_DIRECTIONAL_SHADOW_CONFIG.cameraFar;
            dirLight.shadow.bias = MAIN_DIRECTIONAL_SHADOW_CONFIG.bias;
            dirLight.shadow.normalBias = MAIN_DIRECTIONAL_SHADOW_CONFIG.normalBias;
            dirLight.shadow.camera.updateProjectionMatrix();
            scene.add(dirLight);
            sharedMaterials.mainDirectionalShadowConfig = MAIN_DIRECTIONAL_SHADOW_CONFIG;
            sharedMaterials.mainDirectionalShadowLight = dirLight;
            sharedMaterials.mainDirectionalShadowTarget = dirLightTarget;
            sharedMaterials.shadowFocusRevision = Number.isFinite(sharedMaterials.shadowFocusRevision)
                ? sharedMaterials.shadowFocusRevision + 1
                : 1;
            const fillLight = new THREE.DirectionalLight(0xcadbe2, 0.3);
            fillLight.position.set(-20, 22, -16);
            scene.add(fillLight);
            playerRig = createPlayerRigFromCurrentAppearance();
            scene.add(playerRig);
            updateMainDirectionalShadowFocus(playerState.x, 0, playerState.y);
            updateSkyRuntime(camera.position, performance.now());
            raycaster = new THREE.Raycaster();
            mouse = new THREE.Vector2();
            window.addEventListener('resize', onWindowResize, false);
            renderer.domElement.addEventListener('mousedown', onPointerDown, false);
            window.addEventListener('mousemove', onPointerMove, false);
            window.addEventListener('mouseup', onPointerUp, false);
            renderer.domElement.addEventListener('wheel', onMouseWheel, { passive: false });
            renderer.domElement.addEventListener('contextmenu', onContextMenu, false);
        }

        function initUIPreview() {
            const container = document.getElementById('player-preview-box');
            uiScene = new THREE.Scene();
            const width = 110; const height = 150;
            uiCamera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
            uiCamera.position.set(0, 1.2, 4.5); 
            uiCamera.lookAt(0, 0.8, 0); 
            uiRenderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
            uiRenderer.setSize(width, height);
            uiRenderer.outputColorSpace = THREE.SRGBColorSpace;
            uiRenderer.domElement.style.margin = 'auto'; 
            container.appendChild(uiRenderer.domElement);
            uiScene.add(new THREE.HemisphereLight(0xfff4de, 0xb6c7a2, 0.9));
            uiScene.add(new THREE.AmbientLight(0xffffff, 1.0));
            const dirLight = new THREE.DirectionalLight(0xffefc8, 0.9);
            dirLight.position.set(2, 5, 3);
            uiScene.add(dirLight);
            uiPlayerRig = createPlayerRigFromCurrentAppearance();
            uiPlayerRig.position.set(0, -0.2, 0); 
            uiPlayerRig.rotation.y = -Math.PI / 8; 
            uiScene.add(uiPlayerRig);
            let isDraggingPreview = false; let lastPreviewMouseX = 0;
            container.addEventListener('mousedown', (e) => {
                if (e.button === 1) { e.preventDefault(); isDraggingPreview = true; lastPreviewMouseX = e.clientX; }
            });
            window.addEventListener('mousemove', (e) => {
                if (isDraggingPreview && uiPlayerRig) {
                    uiPlayerRig.rotation.y += (e.clientX - lastPreviewMouseX) * 0.02;
                    lastPreviewMouseX = e.clientX;
                }
            });
            window.addEventListener('mouseup', (e) => { if (e.button === 1) isDraggingPreview = false; });
            container.addEventListener('auxclick', (e) => { if (e.button === 1) e.preventDefault(); });
        }

        function showXPDrop(skill, amount) {
            const container = document.getElementById('xp-drop-container');
            const drop = document.createElement('div');
            drop.className = 'xp-drop text-[#ff9800] font-bold text-md';
            drop.innerText = `${skill} +${amount}xp`;
            container.appendChild(drop);
            setTimeout(() => drop.remove(), 2000); 
        }

        function spawnHitsplat(amount, gridX, gridY) {
            const el = document.createElement('div');
            el.className = 'hitsplat';
            
            const redSplat = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path d=\"M50 0 L65 30 L100 30 L75 55 L85 100 L50 75 L15 100 L25 55 L0 30 L35 30 Z\" fill=\"%23ef4444\"/></svg>')";
            const blueShield = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path d=\"M10 20 L50 0 L90 20 L90 60 L50 100 L10 60 Z\" fill=\"%233b82f6\"/></svg>')";
            
            el.style.backgroundImage = amount > 0 ? redSplat : blueShield;
            el.innerText = amount;
            document.body.appendChild(el);
            
            // Adjust hitsplat visual height for planes
            const visualZOffset = playerState.z * 3.0;
            const targetHeight = heightMap[playerState.z] && heightMap[playerState.z][gridY] && heightMap[playerState.z][gridY][gridX] ? heightMap[playerState.z][gridY][gridX] : 0;
            const worldPos = new THREE.Vector3(gridX, targetHeight + visualZOffset + 1.2, gridY);
            
            activeHitsplats.push({ el, worldPos, createdAt: Date.now() });
        }

        function playLevelUpAnimation(type, target) {
            if (type === 8) { 
                const group = new THREE.Group(); group.position.copy(target.position);
                for(let i=0; i<40; i++) {
                    const isCW = i < 20;
                    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({color: isCW ? 0x00ffff : 0xff00ff}));
                    orb.userData.angleOffset = isCW ? 0 : Math.PI; 
                    orb.userData.dir = isCW ? 1 : -1;
                    group.add(orb);
                }
                scene.add(group); levelUpAnimations.push({ mesh: group, start: Date.now(), type: 8, target: target });
            } 
        }

        function updateCombatStyleButtonState(button, active) {
            if (!button) return;
            button.classList.toggle('bg-[#5a311d]', active);
            button.classList.toggle('border-[#ffcf8b]', active);
            button.classList.toggle('text-[#ffcf8b]', active);
            button.classList.toggle('bg-[#111418]', !active);
            button.classList.toggle('border-[#3a444c]', !active);
            button.classList.toggle('text-[#c8aa6e]', !active);
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
        }

        function updateCombatTab(combatTabViewModel) {
            const combatLevelEl = document.getElementById('combat-level-value');
            if (!combatLevelEl || !combatTabViewModel) return;

            combatLevelEl.innerText = combatTabViewModel.combatLevelText;
            document.getElementById('combat-level-formula').innerText = combatTabViewModel.combatLevelFormulaText;
            document.getElementById('combat-style-current').innerText = combatTabViewModel.selectedStyleLabel;
            document.getElementById('combat-style-effect').innerText = combatTabViewModel.selectedStyleDescription;
            document.getElementById('combat-skill-attack').innerText = combatTabViewModel.attackLevel;
            document.getElementById('combat-skill-strength').innerText = combatTabViewModel.strengthLevel;
            document.getElementById('combat-skill-defense').innerText = combatTabViewModel.defenseLevel;
            document.getElementById('combat-skill-hitpoints').innerText = combatTabViewModel.hitpointsLevel;
            document.getElementById('combat-roll-attack').innerText = combatTabViewModel.combatStats.attack;
            document.getElementById('combat-roll-defense').innerText = combatTabViewModel.combatStats.defense;
            document.getElementById('combat-max-hit').innerText = combatTabViewModel.combatStats.strength;

            const styleOptionsById = Object.fromEntries((combatTabViewModel.styleOptions || []).map((entry) => [entry.styleId, entry]));
            updateCombatStyleButtonState(document.getElementById('combat-style-attack'), !!(styleOptionsById.attack && styleOptionsById.attack.active));
            updateCombatStyleButtonState(document.getElementById('combat-style-strength'), !!(styleOptionsById.strength && styleOptionsById.strength.active));
            updateCombatStyleButtonState(document.getElementById('combat-style-defense'), !!(styleOptionsById.defense && styleOptionsById.defense.active));
        }

        function updateInventoryHitpointsHud() {
            const hitpointsTextEl = document.getElementById('inventory-hitpoints-text');
            const hitpointsBarFillEl = document.getElementById('inventory-hitpoints-bar-fill');
            if (!hitpointsTextEl || !hitpointsBarFillEl) return;

            const currentHitpoints = getCurrentHitpoints();
            const maxHitpoints = getMaxHitpoints();
            const hitpointsLevel = playerSkills && playerSkills.hitpoints && Number.isFinite(playerSkills.hitpoints.level)
                ? Math.max(1, Math.floor(playerSkills.hitpoints.level))
                : maxHitpoints;
            const fillPercent = Math.max(0, Math.min(100, (currentHitpoints / Math.max(1, maxHitpoints)) * 100));

            hitpointsTextEl.innerText = `${currentHitpoints} / ${hitpointsLevel}`;
            hitpointsBarFillEl.style.width = `${fillPercent}%`;
        }

        function updateStats() {
            const uiDomainRuntime = window.UiDomainRuntime || null;
            const combatTabViewModel = uiDomainRuntime && typeof uiDomainRuntime.buildCombatTabViewModel === 'function'
                ? uiDomainRuntime.buildCombatTabViewModel({ playerSkills, equipment, playerState })
                : null;
            const statsViewModel = combatTabViewModel && combatTabViewModel.combatStats
                ? combatTabViewModel.combatStats
                : (uiDomainRuntime && typeof uiDomainRuntime.buildCombatStatsViewModel === 'function'
                    ? uiDomainRuntime.buildCombatStatsViewModel({ playerSkills, equipment, playerState })
                    : { attack: 0, defense: 0, strength: 0 });
            document.getElementById('stat-atk').innerText = statsViewModel.attack;
            document.getElementById('stat-def').innerText = statsViewModel.defense;
            document.getElementById('stat-str').innerText = statsViewModel.strength;
            updateInventoryHitpointsHud();
            updateCombatTab(combatTabViewModel);
        }

        function getMaxHitpoints() {
            const hpLevel = playerSkills && playerSkills.hitpoints && Number.isFinite(playerSkills.hitpoints.level)
                ? Math.floor(playerSkills.hitpoints.level)
                : 10;
            return Math.max(1, hpLevel);
        }

        function getCurrentHitpoints() {
            const maxHitpoints = getMaxHitpoints();
            if (!Number.isFinite(playerState.currentHitpoints)) playerState.currentHitpoints = maxHitpoints;
            playerState.currentHitpoints = Math.max(0, Math.min(maxHitpoints, Math.floor(playerState.currentHitpoints)));
            return playerState.currentHitpoints;
        }

        function applyHitpointHealing(healAmount) {
            const maxHitpoints = getMaxHitpoints();
            const currentHitpoints = getCurrentHitpoints();
            const requestedHeal = Number.isFinite(healAmount) ? Math.max(0, Math.floor(healAmount)) : 0;
            const healed = Math.min(requestedHeal, Math.max(0, maxHitpoints - currentHitpoints));
            playerState.currentHitpoints = currentHitpoints + healed;
            return healed;
        }

        function applyHitpointDamage(damageAmount, minHitpoints = 0) {
            const maxHitpoints = getMaxHitpoints();
            const currentHitpoints = getCurrentHitpoints();
            const requestedDamage = Number.isFinite(damageAmount) ? Math.max(0, Math.floor(damageAmount)) : 0;
            const minimum = Number.isFinite(minHitpoints)
                ? Math.max(0, Math.min(maxHitpoints, Math.floor(minHitpoints)))
                : 0;
            const maxDamage = Math.max(0, currentHitpoints - minimum);
            const dealt = Math.min(requestedDamage, maxDamage);
            playerState.currentHitpoints = currentHitpoints - dealt;
            return dealt;
        }

        function didAttackOrCastThisTick() {
            const attackedThisTick = (
                Number.isFinite(playerState.lastAttackTick) && playerState.lastAttackTick === currentTick
            );

            const actionName = typeof playerState.action === 'string' ? playerState.action.toUpperCase() : '';
            const castedThisTick = (
                Number.isFinite(playerState.lastCastTick) && playerState.lastCastTick === currentTick
            ) || actionName.startsWith('CAST:') || actionName.startsWith('CASTING:');

            return attackedThisTick || castedThisTick;
        }

        function markPlayerCastTick(tick = currentTick) {
            const resolvedTick = Number.isFinite(tick) ? Math.floor(tick) : currentTick;
            playerState.lastCastTick = resolvedTick;
        }
        window.markPlayerCastTick = markPlayerCastTick;

        const MAX_SKILL_LEVEL = 99;
        const MAX_REASONABLE_EAT_COOLDOWN_TICKS = 10;
        const FIRE_STEP_DIR = { x: 0, y: 1 };
        const DEFAULT_FIRE_LIFETIME_TICKS = 90;
        const ASHES_DESPAWN_TICKS = 100;

        function resolveFireLifetimeTicks() {
            const firemakingRecipes = (window.SkillSpecRegistry && typeof SkillSpecRegistry.getRecipeSet === 'function')
                ? SkillSpecRegistry.getRecipeSet('firemaking')
                : null;
            const recipeFromRegistry = firemakingRecipes && firemakingRecipes.logs ? firemakingRecipes.logs : null;
            if (recipeFromRegistry && Number.isFinite(recipeFromRegistry.fireLifetimeTicks)) {
                return Math.max(1, Math.floor(recipeFromRegistry.fireLifetimeTicks));
            }

            const firemakingSpec = window.SkillSpecs && window.SkillSpecs.skills ? window.SkillSpecs.skills.firemaking : null;
            const fallbackRecipe = firemakingSpec && firemakingSpec.recipeSet ? firemakingSpec.recipeSet.logs : null;
            if (fallbackRecipe && Number.isFinite(fallbackRecipe.fireLifetimeTicks)) {
                return Math.max(1, Math.floor(fallbackRecipe.fireLifetimeTicks));
            }

            return DEFAULT_FIRE_LIFETIME_TICKS;
        }

        const FIRE_LIFETIME_TICKS = resolveFireLifetimeTicks();

        function getXpForLevel(level) {
            const clamped = Math.max(1, Math.min(MAX_SKILL_LEVEL, level));
            let points = 0;
            for (let lvl = 1; lvl < clamped; lvl++) {
                points += Math.floor(lvl + 300 * Math.pow(2, lvl / 7));
            }
            return Math.floor(points / 4);
        }

        function getLevelForXp(xp) {
            let level = 1;
            for (let lvl = 2; lvl <= MAX_SKILL_LEVEL; lvl++) {
                if (xp >= getXpForLevel(lvl)) level = lvl;
                else break;
            }
            return level;
        }

        Object.keys(playerSkills).forEach((skillName) => {
            playerSkills[skillName].level = getLevelForXp(playerSkills[skillName].xp);
        });

        function getSkillUiLevelKey(skillName) {
            if (!skillName) return null;
            const manifest = window.SkillManifest;
            if (manifest && manifest.skillTileBySkillId && manifest.skillTileBySkillId[skillName]) {
                const levelKey = manifest.skillTileBySkillId[skillName].levelKey;
                if (typeof levelKey === 'string' && levelKey) return levelKey;
            }

            const keyBySkill = {
                attack: 'atk',
                hitpoints: 'hp',
                mining: 'min',
                strength: 'str',
                defense: 'def',
                woodcutting: 'wc',
                firemaking: 'fm',
                fishing: 'fish',
                cooking: 'cook',
                runecrafting: 'rc',
                smithing: 'smith',
                crafting: 'craft',
                fletching: 'fletch'
            };
            return keyBySkill[skillName] || null;
        }

        function refreshSkillUi(skillName) {
            const key = getSkillUiLevelKey(skillName);
            if (!key || !playerSkills[skillName]) return;

            const uiEl = document.getElementById(`stat-${key}-level`);
            if (uiEl) uiEl.innerText = playerSkills[skillName].level;

            if (typeof updateSkillProgressPanel === 'function') {
                updateSkillProgressPanel(skillName);
            }
        }
        function addSkillXp(skillName, amount) {
            if (playerSkills[skillName]) {
                const oldLevel = playerSkills[skillName].level;
                playerSkills[skillName].xp += amount;
                playerSkills[skillName].level = getLevelForXp(playerSkills[skillName].xp);
                showXPDrop(skillName, amount);
                if (playerSkills[skillName].level > oldLevel) {
                    playLevelUpAnimation(8, playerRig);
                    addChatMessage(`${skillName} level is now ${playerSkills[skillName].level}.`, 'info');
                }
                refreshSkillUi(skillName);
            }
        }

        function giveItem(itemData, amount = 1) {
            if (itemData.stackable) {
                const existingIdx = inventory.findIndex(s => s && s.itemData.id === itemData.id);
                if (existingIdx !== -1) {
                    inventory[existingIdx].amount += amount;
                    renderInventory(); return amount;
                }
                const emptyIdx = inventory.indexOf(null);
                if (emptyIdx !== -1) {
                    inventory[emptyIdx] = { itemData: itemData, amount: amount }; renderInventory(); return amount;
                } else return 0;
            } else {
                let itemsGiven = 0;
                for (let i = 0; i < amount; i++) {
                    const emptyIdx = inventory.indexOf(null);
                    if (emptyIdx !== -1) {
                        inventory[emptyIdx] = { itemData: itemData, amount: 1 };
                        itemsGiven++;
                    } else break;
                }
                if (itemsGiven > 0) renderInventory();
                return itemsGiven;
            }
        }
        function getInventoryCount(itemId) {
            return inventory.reduce((sum, slot) => {
                if (!slot || slot.itemData.id !== itemId) return sum;
                return sum + slot.amount;
            }, 0);
        }

        function getFirstInventorySlotByItemId(itemId) {
            if (!itemId) return -1;
            for (let i = 0; i < inventory.length; i++) {
                const slot = inventory[i];
                if (!slot || !slot.itemData) continue;
                if (slot.itemData.id === itemId && slot.amount > 0) return i;
            }
            return -1;
        }

        function removeOneItemById(itemId) {
            for (let i = 0; i < inventory.length; i++) {
                const slot = inventory[i];
                if (!slot || slot.itemData.id !== itemId) continue;

                slot.amount -= 1;
                if (slot.amount <= 0) inventory[i] = null;

                if (selectedUse.invIndex === i) {
                    clearSelectedUse(false);
                }
                return true;
            }
            return false;
        }

        function removeItemsById(itemId, amount) {
            if (!itemId || amount <= 0) return 0;
            let removed = 0;

            for (let i = 0; i < inventory.length && removed < amount; i++) {
                const slot = inventory[i];
                if (!slot || slot.itemData.id !== itemId) continue;

                const take = Math.min(slot.amount, amount - removed);
                slot.amount -= take;
                removed += take;

                if (slot.amount <= 0) inventory[i] = null;
                if (selectedUse.invIndex === i && (!inventory[i] || inventory[i].itemData.id !== selectedUse.itemId)) {
                    clearSelectedUse(false);
                }
            }

            return removed;
        }
        function isFireOccupiedAt(x, y, z) {
            return activeFires.some((fire) => fire && fire.x === x && fire.y === y && fire.z === z);
        }

        let activeFiremakingLogPreview = null;

        function createFireVisualAt(x, y, z) {
            const group = new THREE.Group();
            const terrainHeight = heightMap[z][y][x] + (z * 3.0);
            group.position.set(x, terrainHeight + 0.05, y);

            const logMat = new THREE.MeshLambertMaterial({ color: 0x4b2e17 });
            const logGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.55, 8);
            logGeo.rotateZ(Math.PI / 2);
            const logA = new THREE.Mesh(logGeo, logMat);
            logA.position.set(0, 0.03, 0.08);
            const logB = new THREE.Mesh(logGeo, logMat);
            logB.position.set(0, 0.03, -0.08);

            const flame = new THREE.Mesh(
                new THREE.ConeGeometry(0.16, 0.45, 8),
                new THREE.MeshBasicMaterial({ color: 0xff8a1f, transparent: true, opacity: 0.9 })
            );
            flame.position.set(0, 0.35, 0);
            flame.userData.flame = true;
            logA.userData = { type: 'FIRE', gridX: x, gridY: y, z };
            logB.userData = { type: 'FIRE', gridX: x, gridY: y, z };
            flame.userData = Object.assign({}, flame.userData, { type: 'FIRE', gridX: x, gridY: y, z });

            group.add(logA, logB, flame);
            return { group, flame, hitMeshes: [logA, logB, flame] };
        }

        function getItemIconSpritePath(itemData) {
            return worldGroundItemRenderRuntime.getItemIconSpritePath(itemData);
        }

        function addGroundItemSprite(group, path, y = 0.2, scale = 0.5) {
            return worldGroundItemRenderRuntime.addGroundItemSprite({ THREE, group, path, y, scale });
        }

        function createFiremakingLogPreviewAt(x, y, z, itemId) {
            const group = new THREE.Group();
            const terrainHeight = heightMap[z][y][x] + (z * 3.0);
            group.position.set(x, terrainHeight + 0.04, y);

            const itemData = ITEM_DB && typeof itemId === 'string' ? ITEM_DB[itemId] : null;
            const spritePath = getItemIconSpritePath(itemData);
            const base = new THREE.Mesh(
                new THREE.CylinderGeometry(0.18, 0.18, 0.06, 12),
                new THREE.MeshLambertMaterial({ color: 0x3d2a1c })
            );
            base.position.set(0, -0.05, 0);
            group.add(base);

            if (spritePath) {
                addGroundItemSprite(group, spritePath, 0.2, 0.5);
            } else {
                const logMat = new THREE.MeshLambertMaterial({ color: 0x4b2e17 });
                const logGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.55, 8);
                logGeo.rotateZ(Math.PI / 2);
                const logA = new THREE.Mesh(logGeo, logMat);
                logA.position.set(0, 0.03, 0.08);
                const logB = new THREE.Mesh(logGeo, logMat);
                logB.position.set(0, 0.03, -0.08);
                group.add(logA, logB);
            }

            return group;
        }

        function attachFireVisualGroup(group, x, y, z, preferChunkParent = true) {
            if (preferChunkParent) {
                const cx = Math.floor(x / CHUNK_SIZE);
                const cy = Math.floor(y / CHUNK_SIZE);
                const chunkGroup = getWorldChunkSceneRuntime().getNearChunkGroup(`${cx},${cy}`);
                if (chunkGroup) {
                    const pGroup = chunkGroup.children.find((pg) => pg.userData.z === z);
                    if (pGroup) {
                        pGroup.add(group);
                        return;
                    }
                }
            }
            scene.add(group);
        }

        function removeFiremakingLogPreview() {
            if (!activeFiremakingLogPreview) return;
            const preview = activeFiremakingLogPreview;
            if (preview.mesh && preview.mesh.parent) preview.mesh.parent.remove(preview.mesh);
            else if (preview.mesh) scene.remove(preview.mesh);
            activeFiremakingLogPreview = null;
        }

        function syncFiremakingLogPreview() {
            const session = playerState && playerState.firemakingSession ? playerState.firemakingSession : null;
            const target = session && session.target && typeof session.target === 'object' ? session.target : null;
            const shouldShow = !!(
                scene
                && session
                && session.phase === 'attempting'
                && playerState.action === 'SKILLING: FIREMAKING'
                && target
                && Number.isFinite(target.x)
                && Number.isFinite(target.y)
                && Number.isFinite(target.z)
                && !isFireOccupiedAt(target.x, target.y, target.z)
            );

            if (!shouldShow) {
                removeFiremakingLogPreview();
                return;
            }

            const itemId = typeof session.sourceItemId === 'string' && session.sourceItemId ? session.sourceItemId : 'logs';
            if (
                activeFiremakingLogPreview
                && activeFiremakingLogPreview.x === target.x
                && activeFiremakingLogPreview.y === target.y
                && activeFiremakingLogPreview.z === target.z
                && activeFiremakingLogPreview.itemId === itemId
            ) {
                return;
            }

            removeFiremakingLogPreview();
            const mesh = createFiremakingLogPreviewAt(target.x, target.y, target.z, itemId);
            attachFireVisualGroup(mesh, target.x, target.y, target.z, true);
            activeFiremakingLogPreview = { x: target.x, y: target.y, z: target.z, itemId, mesh };
        }

        function spawnFireAtTile(x, y, z, options = {}) {
            if (isFireOccupiedAt(x, y, z)) return false;
            if (!scene) return false;
            if (activeFiremakingLogPreview && activeFiremakingLogPreview.x === x && activeFiremakingLogPreview.y === y && activeFiremakingLogPreview.z === z) {
                removeFiremakingLogPreview();
            }

            const fireVisual = createFireVisualAt(x, y, z);
            const expiresTick = Number.isFinite(options.expiresTick)
                ? options.expiresTick
                : currentTick + FIRE_LIFETIME_TICKS;
            const preferChunkParent = options.preferChunkParent !== false;

            attachFireVisualGroup(fireVisual.group, x, y, z, preferChunkParent);
            environmentMeshes.push(...fireVisual.hitMeshes);
            activeFires.push({
                x,
                y,
                z,
                mesh: fireVisual.group,
                flame: fireVisual.flame,
                hitMeshes: fireVisual.hitMeshes,
                expiresTick,
                phase: Math.random() * Math.PI * 2,
                routeId: options.routeId || null
            });
            return true;
        }

        function seedCookingTrainingFires() {
            if (!Array.isArray(cookingFireSpotsToRender) || cookingFireSpotsToRender.length === 0) return;
            for (let i = 0; i < cookingFireSpotsToRender.length; i++) {
                const spot = cookingFireSpotsToRender[i];
                if (!spot) continue;
                spawnFireAtTile(spot.x, spot.y, spot.z, {
                    expiresTick: Number.POSITIVE_INFINITY,
                    preferChunkParent: false,
                    routeId: spot.routeId || null
                });
            }
        }

        function lightFireAtCurrentTile(x = playerState.x, y = playerState.y, z = playerState.z) {
            x = Number.isFinite(x) ? Math.floor(x) : playerState.x;
            y = Number.isFinite(y) ? Math.floor(y) : playerState.y;
            z = Number.isFinite(z) ? Math.floor(z) : playerState.z;

            if (isFireOccupiedAt(x, y, z)) {
                addChatMessage('There is already a fire here.', 'warn');
                return false;
            }

            return spawnFireAtTile(x, y, z, {
                expiresTick: currentTick + FIRE_LIFETIME_TICKS,
                preferChunkParent: true
            });
        }

        function expireFireAtIndex(index) {
            const fire = activeFires[index];
            if (!fire) return false;

            if (fire.mesh && fire.mesh.parent) fire.mesh.parent.remove(fire.mesh);
            else if (fire.mesh) scene.remove(fire.mesh);

            if (Array.isArray(fire.hitMeshes)) {
                for (let j = 0; j < fire.hitMeshes.length; j++) {
                    const idx = environmentMeshes.indexOf(fire.hitMeshes[j]);
                    if (idx !== -1) environmentMeshes.splice(idx, 1);
                }
            }

            const ashesItem = ITEM_DB && ITEM_DB.ashes ? ITEM_DB.ashes : null;
            if (ashesItem) {
                spawnGroundItem(ashesItem, fire.x, fire.y, fire.z, 1, {
                    despawnTicks: ASHES_DESPAWN_TICKS
                });
            }

            activeFires.splice(index, 1);
            return true;
        }

        function tickFireLifecycle() {
            for (let i = activeFires.length - 1; i >= 0; i--) {
                const fire = activeFires[i];
                if (!fire || currentTick < fire.expiresTick) continue;
                expireFireAtIndex(i);
            }
        }

        function updateFires(frameNow) {
            tickFireLifecycle();
            syncFiremakingLogPreview();
            for (let i = 0; i < activeFires.length; i++) {
                const fire = activeFires[i];
                if (!fire || !fire.flame) continue;
                const t = (frameNow * 0.01) + fire.phase;
                fire.flame.scale.set(1.0 + Math.sin(t) * 0.12, 1.0 + Math.sin(t * 1.8) * 0.18, 1.0 + Math.cos(t) * 0.12);
                fire.flame.material.opacity = 0.75 + (Math.sin(t * 1.3) * 0.12);
            }
        }

        function removeGroundItemEntryAt(index) {
            const entry = groundItems[index];
            if (!entry) return false;

            if (entry.mesh && entry.mesh.parent) entry.mesh.parent.remove(entry.mesh);
            else if (entry.mesh) scene.remove(entry.mesh);

            if (entry.mesh && Array.isArray(entry.mesh.children)) {
                environmentMeshes = environmentMeshes.filter((m) => !entry.mesh.children.includes(m));
            }

            groundItems.splice(index, 1);
            return true;
        }

        function updateGroundItems() {
            for (let i = groundItems.length - 1; i >= 0; i--) {
                const entry = groundItems[i];
                if (!entry || !Number.isFinite(entry.despawnTick)) continue;
                if (currentTick < entry.despawnTick) continue;
                removeGroundItemEntryAt(i);
            }
        }

        function findFireStepDestination() {
            const z = playerState.z;
            const currentH = heightMap[z][playerState.y][playerState.x];
            const candidates = [
                { direction: 'east', x: playerState.x + FIRE_STEP_DIR.x, y: playerState.y + FIRE_STEP_DIR.y },
                { direction: 'west', x: playerState.x - FIRE_STEP_DIR.x, y: playerState.y - FIRE_STEP_DIR.y }
            ];
            const failureReasons = [];

            for (let i = 0; i < candidates.length; i++) {
                const candidate = candidates[i];
                const nx = candidate.x;
                const ny = candidate.y;

                if (nx < 0 || ny < 0 || nx >= MAP_SIZE || ny >= MAP_SIZE) {
                    failureReasons.push('out_of_bounds');
                    continue;
                }
                if (!isWalkableTileId(logicalMap[z][ny][nx])) {
                    failureReasons.push('blocked_tile');
                    continue;
                }

                const nextH = heightMap[z][ny][nx];
                const tileIsRamp = logicalMap[z][playerState.y][playerState.x] === TileId.STAIRS_RAMP || logicalMap[z][ny][nx] === TileId.STAIRS_RAMP;
                if (Math.abs(nextH - currentH) > 0.3 && !tileIsRamp) {
                    failureReasons.push('height_mismatch');
                    continue;
                }

                if (activeFires.some((f) => f.x === nx && f.y === ny && f.z === z)) {
                    failureReasons.push('fire_occupied');
                    continue;
                }

                return { stepped: true, direction: candidate.direction, x: nx, y: ny };
            }

            let reason = 'blocked_tile';
            if (failureReasons.includes('fire_occupied')) reason = 'fire_occupied';
            else if (failureReasons.includes('height_mismatch')) reason = 'height_mismatch';
            else if (failureReasons.includes('out_of_bounds')) reason = 'out_of_bounds';

            return { stepped: false, reason };
        }

        function applyFireStepDestination(stepResult) {
            if (!stepResult || !stepResult.stepped) return stepResult;
            playerState.prevX = playerState.x;
            playerState.prevY = playerState.y;
            playerState.x = stepResult.x;
            playerState.y = stepResult.y;
            playerState.targetX = stepResult.x;
            playerState.targetY = stepResult.y;
            playerState.midX = null;
            playerState.midY = null;
            playerState.path = [];
            return stepResult;
        }

        function tryStepAfterFire() {
            return applyFireStepDestination(findFireStepDestination());
        }

        function tryStepBeforeFiremaking() {
            return applyFireStepDestination(findFireStepDestination());
        }

        function startFiremaking(sourceItemId = null) {
            if (!(window.SkillRuntime && typeof SkillRuntime.tryStartSkillById === 'function')) return false;
            const payload = { skillId: 'firemaking' };
            if (typeof sourceItemId === 'string' && sourceItemId) payload.sourceItemId = sourceItemId;
            return SkillRuntime.tryStartSkillById('firemaking', payload);
        }

        function getFiremakingLogItemIdForPair(itemA, itemB) {
            const a = String(itemA || '');
            const b = String(itemB || '');
            if (!a || !b) return null;

            const firemakingRecipes = (window.SkillSpecRegistry && typeof SkillSpecRegistry.getRecipeSet === 'function')
                ? SkillSpecRegistry.getRecipeSet('firemaking')
                : null;
            if (!firemakingRecipes || typeof firemakingRecipes !== 'object') return null;

            const logItemIds = new Set();
            const recipeIds = Object.keys(firemakingRecipes);
            for (let i = 0; i < recipeIds.length; i++) {
                const recipe = firemakingRecipes[recipeIds[i]];
                const sourceItemId = typeof (recipe && recipe.sourceItemId) === 'string' ? recipe.sourceItemId : '';
                if (sourceItemId) logItemIds.add(sourceItemId);
            }

            if (a === 'tinderbox' && logItemIds.has(b)) return b;
            if (b === 'tinderbox' && logItemIds.has(a)) return a;
            return null;
        }

        function resolveFireTargetFromHit(hitData) {
            if (!hitData || !Array.isArray(activeFires) || activeFires.length === 0) return null;

            const z = playerState.z;
            let x = Number.isInteger(hitData.gridX) ? hitData.gridX : null;
            let y = Number.isInteger(hitData.gridY) ? hitData.gridY : null;

            if ((x === null || y === null) && hitData.point) {
                x = Math.floor(hitData.point.x + 0.5);
                y = Math.floor(hitData.point.z + 0.5);
            }

            if (x !== null && y !== null) {
                const direct = activeFires.find((f) => f.x === x && f.y === y && f.z === z) || null;
                if (direct) return { x: direct.x, y: direct.y, z: direct.z };
            }

            if (!hitData.point) return null;

            let nearest = null;
            let nearestDist = Infinity;
            for (let i = 0; i < activeFires.length; i++) {
                const fire = activeFires[i];
                if (!fire || fire.z !== z) continue;
                const d = Math.hypot((fire.x + 0.5) - hitData.point.x, (fire.y + 0.5) - hitData.point.z);
                if (d < nearestDist) {
                    nearestDist = d;
                    nearest = fire;
                }
            }

            if (!nearest || nearestDist > 1.35) return null;
            return { x: nearest.x, y: nearest.y, z: nearest.z };
        }

        function debugCookingUse(message) {
            if (!window.DEBUG_COOKING_USE) return;
            const text = `[cook-debug] ${message}`;
            try { console.log(text); } catch (_) {}
            if (typeof addChatMessage === 'function') addChatMessage(text, 'info');
        }

                function createRunecraftingPouchContext() {
            return {
                playerState,
                getSkillLevel: (skillId) => (playerSkills && playerSkills[skillId] ? playerSkills[skillId].level : 1),
                getInventoryCount,
                removeItemsById,
                giveItemById: (itemId, amount) => {
                    if (!ITEM_DB[itemId]) return 0;
                    return giveItem(ITEM_DB[itemId], amount);
                },
                addChatMessage,
                renderInventory
            };
        }

        function tryUseItemOnInventory(sourceInvIndex, targetInvIndex) {
            const source = inventory[sourceInvIndex];
            const target = inventory[targetInvIndex];
            if (!source || !target) return false;

            const a = source.itemData.id;
            const b = target.itemData.id;

            if (window.RunecraftingPouchRuntime && typeof window.RunecraftingPouchRuntime.tryUseItemOnInventory === 'function') {
                const pouchUsed = window.RunecraftingPouchRuntime.tryUseItemOnInventory(createRunecraftingPouchContext(), a, b);
                if (pouchUsed) return true;
            }

            if (window.SkillRuntime && typeof SkillRuntime.tryUseItemOnTarget === 'function') {
                const skillUsed = SkillRuntime.tryUseItemOnTarget({
                    targetObj: 'INVENTORY',
                    targetUid: {
                        sourceInvIndex,
                        targetInvIndex,
                        sourceItemId: a,
                        targetItemId: b
                    },
                    sourceInvIndex,
                    sourceItemId: a
                });
                if (skillUsed) return true;
            }

            const firemakingSourceItemId = getFiremakingLogItemIdForPair(a, b);
            if (firemakingSourceItemId) {
                return startFiremaking(firemakingSourceItemId);
            }

            return false;
        }

        function tryUseItemOnWorld(sourceInvIndex, hitData) {
            const source = inventory[sourceInvIndex];
            if (!source || !hitData) return false;

            // Non-skill use-on-world interactions can be added here.
            // Skill item interactions are routed through SkillRuntime.tryUseItemOnTarget.
            return false;
        }

        function handleInventorySlotClick(invIndex) {
            const selected = getSelectedUseItem();

            if (selected) {
                if (selectedUse.invIndex !== invIndex && tryUseItemOnInventory(selectedUse.invIndex, invIndex)) {
                    clearSelectedUse();
                    return;
                }
                // A selected Use should always consume the next click.
                clearSelectedUse();
                return;
            }

            const slot = inventory[invIndex];
            if (!slot) return;
            const prefKey = (typeof getItemMenuPreferenceKey === 'function')
                ? getItemMenuPreferenceKey('inventory', slot.itemData.id)
                : null;
            handleItemAction(invIndex, resolveDefaultItemAction(slot.itemData, prefKey));
        }
        function eatItem(invIndex) {
            const invSlot = inventory[invIndex];
            if (!invSlot || !invSlot.itemData) return;

            const item = invSlot.itemData;
            const healAmount = Number.isFinite(item.healAmount) ? Math.max(0, Math.floor(item.healAmount)) : 0;
            const eatDelayTicks = Number.isFinite(item.eatDelayTicks) ? Math.max(1, Math.floor(item.eatDelayTicks)) : 0;
            if (item.type !== 'food' || healAmount <= 0 || eatDelayTicks <= 0) {
                addChatMessage("You can't eat that.", 'warn');
                return;
            }

            let cooldownEndTick = Number.isFinite(playerState.eatingCooldownEndTick)
                ? Math.floor(playerState.eatingCooldownEndTick)
                : 0;
            if ((cooldownEndTick - currentTick) > MAX_REASONABLE_EAT_COOLDOWN_TICKS) {
                cooldownEndTick = currentTick;
                playerState.eatingCooldownEndTick = currentTick;
            }
            if (currentTick < cooldownEndTick) {
                const remainingTicks = cooldownEndTick - currentTick;
                addChatMessage(`You need to wait ${remainingTicks} tick${remainingTicks === 1 ? '' : 's'} before eating again.`, 'warn');
                return;
            }

            if (didAttackOrCastThisTick()) {
                addChatMessage('You cannot eat on the same tick as attacking or casting.', 'warn');
                return;
            }

            invSlot.amount -= 1;
            if (invSlot.amount <= 0) inventory[invIndex] = null;
            if (selectedUse.invIndex === invIndex) clearSelectedUse(false);

            const healed = applyHitpointHealing(healAmount);
            playerState.eatingCooldownEndTick = currentTick + eatDelayTicks;

            if (healed > 0) addChatMessage(`You eat the ${item.name}. (+${healed} HP)`, 'game');
            else addChatMessage(`You eat the ${item.name}.`, 'game');
            updateStats();
            renderInventory();
        }

        function handleItemAction(invIndex, actionName) {
            const invSlot = inventory[invIndex];
            if (!invSlot) return;
            const item = invSlot.itemData;
            if (actionName === 'Use') {
                if (window.RunecraftingPouchRuntime && typeof window.RunecraftingPouchRuntime.tryUsePouch === 'function') {
                    const pouchUsed = window.RunecraftingPouchRuntime.tryUsePouch(createRunecraftingPouchContext(), item.id);
                    if (pouchUsed) return;
                }
                selectUseItem(invIndex);
                return;
            }

            if (typeof actionName === 'string' && actionName.startsWith('Empty')) {
                if (window.RunecraftingPouchRuntime && typeof window.RunecraftingPouchRuntime.tryUsePouch === 'function') {
                    const pouchUsed = window.RunecraftingPouchRuntime.tryUsePouch(createRunecraftingPouchContext(), item.id, { forceEmpty: true });
                    if (pouchUsed) return;
                }
            }

            if (actionName === 'Equip') {
                const slotName = (item && item.type && Object.prototype.hasOwnProperty.call(equipment, item.type))
                    ? item.type
                    : ((item && item.weaponClass && Object.prototype.hasOwnProperty.call(equipment, 'weapon')) ? 'weapon' : null);
                if (!slotName) return;
                const requiredAttackLevel = Number.isFinite(item.requiredAttackLevel) ? Math.max(1, Math.floor(item.requiredAttackLevel)) : 0;
                const attackLevel = playerSkills && playerSkills.attack && Number.isFinite(playerSkills.attack.level)
                    ? Math.max(1, Math.floor(playerSkills.attack.level))
                    : 1;
                if (requiredAttackLevel > 0 && attackLevel < requiredAttackLevel) {
                    addChatMessage(`You need Attack level ${requiredAttackLevel} to equip the ${item.name}.`, 'warn');
                    return;
                }
                const requiredFishingLevel = Number.isFinite(item.requiredFishingLevel) ? Math.max(1, Math.floor(item.requiredFishingLevel)) : 0;
                const fishingLevel = playerSkills && playerSkills.fishing && Number.isFinite(playerSkills.fishing.level)
                    ? Math.max(1, Math.floor(playerSkills.fishing.level))
                    : 1;
                if (requiredFishingLevel > 0 && fishingLevel < requiredFishingLevel) {
                    addChatMessage(`You need Fishing level ${requiredFishingLevel} to equip the ${item.name}.`, 'warn');
                    return;
                }
                const requiredDefenseLevel = Number.isFinite(item.requiredDefenseLevel) ? Math.max(1, Math.floor(item.requiredDefenseLevel)) : 0;
                const defenseLevel = playerSkills && playerSkills.defense && Number.isFinite(playerSkills.defense.level)
                    ? Math.max(1, Math.floor(playerSkills.defense.level))
                    : 1;
                if (requiredDefenseLevel > 0 && defenseLevel < requiredDefenseLevel) {
                    addChatMessage(`You need Defense level ${requiredDefenseLevel} to equip the ${item.name}.`, 'warn');
                    return;
                }
                const oldItem = equipment[slotName];
                equipment[slotName] = item; inventory[invIndex] = oldItem ? { itemData: oldItem, amount: 1 } : null;
                clearSelectedUse(false);
                updateStats(); renderInventory(); renderEquipment(); updatePlayerModel();
            } else if (actionName === 'Eat') {
                eatItem(invIndex);
            } else if (actionName === 'Drop') {
                dropItem(invIndex);
            }
        }

        function hasWeaponClassAvailable(weaponClass) {
            if (equipment.weapon && equipment.weapon.weaponClass === weaponClass) return true;
            return inventory.some((slot) => slot && slot.itemData && slot.itemData.type === 'weapon' && slot.itemData.weaponClass === weaponClass);
        }

        function autoEquipWeaponClass(weaponClass) {
            if (equipment.weapon && equipment.weapon.weaponClass === weaponClass) return true;
            const invIndex = inventory.findIndex((slot) => slot && slot.itemData && slot.itemData.type === 'weapon' && slot.itemData.weaponClass === weaponClass);
            if (invIndex === -1) return false;
            const slot = inventory[invIndex];
            if (!slot || !slot.itemData) return false;
            const item = slot.itemData;
            const oldWeapon = equipment.weapon;
            equipment.weapon = item;
            inventory[invIndex] = oldWeapon ? { itemData: oldWeapon, amount: 1 } : null;
            clearSelectedUse(false);
            updateStats(); renderInventory(); renderEquipment(); updatePlayerModel();
            return true;
        }

        function unequipItem(slotName) {
            const item = equipment[slotName];
            if (!item) return;
            const emptyIdx = inventory.indexOf(null);
            if (emptyIdx !== -1) {
                inventory[emptyIdx] = { itemData: item, amount: 1 }; equipment[slotName] = null;
                clearSelectedUse(false);
                updateStats(); renderInventory(); renderEquipment(); updatePlayerModel();
            }
        }

        function addGroundItemVisual(group, itemData) {
            return worldGroundItemRenderRuntime.addGroundItemVisual({
                THREE,
                group,
                itemData,
                createEquipmentVisualMeshes: typeof window.createEquipmentVisualMeshes === 'function'
                    ? window.createEquipmentVisualMeshes
                    : null,
                createPixelSourceVisualMeshes: typeof window.createPixelSourceVisualMeshes === 'function'
                    ? window.createPixelSourceVisualMeshes
                    : null,
                fetchImpl: typeof fetch === 'function' ? fetch.bind(window) : null
            });
        }

        function dropItem(invIndex) {
            const invSlot = inventory[invIndex];
            if (!invSlot) return;
            const amount = invSlot.amount;
            inventory[invIndex] = null;
            if (selectedUse.invIndex === invIndex) clearSelectedUse(false);
            spawnGroundItem(invSlot.itemData, playerState.x, playerState.y, playerState.z, amount);
            renderInventory();
        }

        function spawnGroundItem(itemData, x, y, z, amount = 1, options = {}) {
            const despawnTick = Number.isFinite(options.despawnTick)
                ? options.despawnTick
                : (Number.isFinite(options.despawnTicks) ? currentTick + Math.max(0, Math.floor(options.despawnTicks)) : null);

            let existing = groundItems.find(gi => gi.x === x && gi.y === y && gi.z === z && gi.itemData.id === itemData.id);
            if (existing && itemData.stackable) {
                existing.amount += amount;
                if (Number.isFinite(despawnTick)) {
                    existing.despawnTick = Number.isFinite(existing.despawnTick)
                        ? Math.max(existing.despawnTick, despawnTick)
                        : despawnTick;
                }
                existing.mesh.children.forEach(c => { c.userData.name = `${itemData.name} (${existing.amount})`; });
                return;
            }
            const group = new THREE.Group();
            const terrainHeight = heightMap[z][y][x] + (z * 3.0);
            group.position.set(x, terrainHeight + 0.1, y);
            addGroundItemVisual(group, itemData);
            const hitbox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), sharedMaterials.hiddenHitbox);
            group.add(hitbox);
            const uid = Date.now() + Math.random();
            group.children.forEach(c => {
                c.userData = { type: 'GROUND_ITEM', itemData: itemData, uid: uid, gridX: x, gridY: y, z: z, name: amount > 1 ? `${itemData.name} (${amount})` : itemData.name };
                environmentMeshes.push(c);
            });
            let cx = Math.floor(x / CHUNK_SIZE); let cy = Math.floor(y / CHUNK_SIZE);
            const chunkGroup = getWorldChunkSceneRuntime().getNearChunkGroup(`${cx},${cy}`);
            if (chunkGroup) {
                let pGroup = chunkGroup.children.find(pg => pg.userData.z === z);
                if (pGroup) pGroup.add(group); else scene.add(group);
            } else scene.add(group);
            
            groundItems.push({ itemData, x, y, z, mesh: group, uid, amount: amount, despawnTick });
        }

        // --- THE MULTI-PLANE ENGINE REWRITE ---

        function rockNodeKey(x, y, z = 0) { return z + ':' + x + ',' + y; }
        function treeNodeKey(x, y, z = 0) { return z + ':' + x + ',' + y; }

        function setTreeNode(x, y, z = 0, nodeId = 'normal_tree', options = {}) {
            if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) return false;
            const tile = logicalMap[z] && logicalMap[z][y] ? logicalMap[z][y][x] : null;
            if (!isTreeTileId(tile)) return false;
            const key = treeNodeKey(x, y, z);
            treeNodes[key] = {
                nodeId: (typeof nodeId === 'string' && nodeId) ? nodeId : 'normal_tree',
                areaGateFlag: (options && typeof options.areaGateFlag === 'string' && options.areaGateFlag) ? options.areaGateFlag : null,
                areaName: (options && typeof options.areaName === 'string' && options.areaName) ? options.areaName : null,
                areaGateMessage: (options && typeof options.areaGateMessage === 'string' && options.areaGateMessage) ? options.areaGateMessage : null
            };
            return true;
        }

        function getTreeNodeAt(x, y, z = playerState.z) {
            if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) return null;
            const tile = logicalMap[z] && logicalMap[z][y] ? logicalMap[z][y][x] : null;
            if (!isTreeTileId(tile)) return null;
            const key = treeNodeKey(x, y, z);
            if (!treeNodes[key]) treeNodes[key] = { nodeId: 'normal_tree', areaGateFlag: null, areaName: null, areaGateMessage: null };
            return treeNodes[key];
        }

        function rebuildTreeNodes() {
            const rebuilt = {};
            for (let z = 0; z < PLANES; z++) {
                for (let y = 0; y < MAP_SIZE; y++) {
                    for (let x = 0; x < MAP_SIZE; x++) {
                        const tile = logicalMap[z][y][x];
                        if (isTreeTileId(tile)) {
                            const key = treeNodeKey(x, y, z);
                            const prev = treeNodes[key];
                            rebuilt[key] = {
                                nodeId: prev && prev.nodeId ? prev.nodeId : 'normal_tree',
                                areaGateFlag: prev && prev.areaGateFlag ? prev.areaGateFlag : null,
                                areaName: prev && prev.areaName ? prev.areaName : null,
                                areaGateMessage: prev && prev.areaGateMessage ? prev.areaGateMessage : null
                            };
                        }
                    }
                }
            }
            treeNodes = rebuilt;
        }

        const TREE_VISUAL_PROFILES = {
            normal_tree: { trunkScale: [1.0, 1.0, 1.0], canopyScales: [[1.0, 1.0, 1.0], [0.96, 0.98, 0.96], [0.94, 0.98, 0.94], [0.9, 0.95, 0.9]], canopyYOffset: 0.0, canopyJitter: 0.03, branchScale: [0, 0, 0], stumpScale: [1.1, 0.15, 1.1] },
            oak_tree: {
                trunkScale: [1.46, 1.52, 1.46],
                canopyScales: [[1.78, 1.28, 1.74], [1.55, 1.12, 1.5], [1.48, 1.08, 1.45], [1.28, 1.34, 1.24]],
                canopyYOffset: 0.28,
                canopyOffsets: [[0.0, 0.26, 0.0], [0.52, 0.1, 0.34], [-0.56, 0.08, -0.28], [0.1, 0.74, -0.18]],
                canopyYRotations: [0.0, 0.22, -0.3, 0.12],
                canopyJitter: 0.1,
                branchScale: [1.25, 1.2, 1.25],
                branchOffset: [0.08, 0.16, 0.12],
                branchYaw: -0.35,
                stumpScale: [1.56, 0.2, 1.56]
            },
            willow_tree: {
                trunkScale: [0.82, 1.92, 0.82],
                canopyScales: [[1.44, 1.12, 1.48], [1.26, 1.04, 1.3], [1.2, 0.98, 1.22], [1.08, 0.92, 1.1]],
                canopyYOffset: 0.72,
                canopyOffsets: [[0.0, 0.3, 0.0], [0.4, 0.22, 0.3], [-0.38, 0.2, -0.28], [0.02, 0.5, -0.06]],
                canopyYRotations: [0.0, 0.22, -0.24, 0.1],
                canopyJitter: 0.02,
                branchScale: [0.98, 0.94, 0.98],
                branchOffset: [-0.12, 0.36, 0.08],
                branchYaw: 0.58,
                branch2Scale: [0.94, 0.98, 0.94],
                branch2Offset: [0.08, 0.58, -0.16],
                branch2Yaw: -0.66,
                branch3Scale: [0.9, 1.02, 0.9],
                branch3Offset: [0.2, 0.72, 0.2],
                branch3Yaw: 0.28,
                drapeScales: [[1.08, 1.16, 1.08], [1.04, 1.12, 1.04], [1.06, 1.2, 1.06], [1.12, 1.26, 1.12], [0.98, 1.06, 0.98], [1.0, 1.08, 1.0], [1.04, 1.18, 1.04], [1.1, 1.24, 1.1]],
                drapeOffsets: [[0.08, 0.22, 0.04], [-0.08, 0.22, -0.04], [0.04, 0.18, 0.06], [-0.04, 0.18, -0.06], [0.02, 0.28, 0.08], [-0.02, 0.28, -0.08], [-0.06, 0.14, 0.02], [0.06, 0.14, -0.02]],
                drapeYRotations: [0.36, -0.34, 0.52, -0.48, 0.22, -0.2, 0.68, -0.64],
                drapeJitter: 0.045,
                stumpScale: [0.98, 0.16, 0.98]
            },
            maple_tree: {
                trunkScale: [1.24, 1.56, 1.24],
                canopyScales: [[2.02, 1.18, 2.02], [1.78, 1.04, 1.74], [1.72, 1.0, 1.68], [1.44, 0.9, 1.4]],
                canopyYOffset: 0.44,
                canopyOffsets: [[0.0, 0.14, 0.0], [0.72, 0.0, 0.46], [-0.74, 0.0, -0.42], [0.08, 0.56, -0.14]],
                canopyYRotations: [0.0, 0.24, -0.28, 0.12],
                canopyJitter: 0.045,
                branchScale: [1.28, 1.2, 1.28],
                branchOffset: [-0.14, 0.28, 0.16],
                branchYaw: 0.54,
                branch2Scale: [1.2, 1.16, 1.2],
                branch2Offset: [0.12, 0.54, -0.18],
                branch2Yaw: -0.62,
                branch3Scale: [1.12, 1.08, 1.12],
                branch3Offset: [0.18, 0.72, 0.24],
                branch3Yaw: 0.24,
                stumpScale: [1.38, 0.2, 1.38]
            },
            yew_tree: {
                trunkScale: [1.02, 2.24, 1.02],
                canopyScales: [[1.1, 0.92, 1.1], [0.88, 0.76, 0.88], [0.66, 0.58, 0.66], [0.42, 0.4, 0.42]],
                canopyYOffset: 0.74,
                canopyOffsets: [[0.0, 0.0, 0.0], [0.04, 0.42, -0.02], [-0.03, 0.8, 0.02], [0.0, 1.16, 0.0]],
                canopyYRotations: [0.0, 0.08, -0.06, 0.02],
                canopyJitter: 0.01,
                branchScale: [0.48, 0.66, 0.48],
                branchOffset: [-0.04, 0.66, 0.06],
                branchYaw: 0.2,
                branch2Scale: [0.38, 0.54, 0.38],
                branch2Offset: [0.04, 1.0, -0.05],
                branch2Yaw: -0.22,
                branch3Scale: [0.28, 0.42, 0.28],
                branch3Offset: [0.0, 1.28, 0.02],
                branch3Yaw: 0.12,
                stumpScale: [1.18, 0.24, 1.18]
            }
        };

        function getTreeVisualProfile(nodeId) {
            if (typeof nodeId === 'string' && TREE_VISUAL_PROFILES[nodeId]) return TREE_VISUAL_PROFILES[nodeId];
            return TREE_VISUAL_PROFILES.normal_tree;
        }

        function deterministicCanopyJitter(seedX, seedY, layer, axis) {
            const value = Math.sin((seedX + (layer * 0.71) + (axis * 0.37)) * 12.9898 + (seedY - (layer * 0.47) + (axis * 0.19)) * 78.233) * 43758.5453;
            return ((value - Math.floor(value)) * 2.0) - 1.0;
        }

        function setTreeVisualState(tData, treeIndex, options = {}) {
            if (!tData || !Number.isInteger(treeIndex) || treeIndex < 0) return;
            const profile = getTreeVisualProfile(options.nodeId);
            const isStump = !!options.isStump;
            const basePosition = options.position || new THREE.Vector3();
            const baseQuaternion = options.quaternion || new THREE.Quaternion();
            const dummy = new THREE.Object3D();
            const trunkScale = isStump ? profile.stumpScale : profile.trunkScale;
            dummy.position.copy(basePosition);
            dummy.quaternion.copy(baseQuaternion);
            dummy.scale.set(trunkScale[0], trunkScale[1], trunkScale[2]);
            dummy.updateMatrix();
            if (tData.iTrunk) tData.iTrunk.setMatrixAt(treeIndex, dummy.matrix);

            const applyBranchVisual = (branchMesh, scaleValue, offsetValue, yawValue) => {
                if (!branchMesh) return;
                const branchScale = isStump ? [0, 0, 0] : (Array.isArray(scaleValue) ? scaleValue : [0, 0, 0]);
                const branchOffset = (!isStump && Array.isArray(offsetValue)) ? offsetValue : [0, 0, 0];
                const branchYaw = (!isStump && Number.isFinite(yawValue)) ? yawValue : 0;
                dummy.position.copy(basePosition);
                dummy.quaternion.copy(baseQuaternion);
                dummy.position.x += branchOffset[0];
                dummy.position.y += branchOffset[1];
                dummy.position.z += branchOffset[2];
                if (branchYaw !== 0) dummy.rotateY(branchYaw);
                dummy.scale.set(branchScale[0] || 0, branchScale[1] || 0, branchScale[2] || 0);
                dummy.updateMatrix();
                branchMesh.setMatrixAt(treeIndex, dummy.matrix);
            };

            applyBranchVisual(tData.iBranch, profile.branchScale, profile.branchOffset, profile.branchYaw);
            applyBranchVisual(tData.iBranch2, profile.branch2Scale, profile.branch2Offset, profile.branch2Yaw);
            applyBranchVisual(tData.iBranch3, profile.branch3Scale, profile.branch3Offset, profile.branch3Yaw);

            const drapeMeshes = [tData.iDrape1, tData.iDrape2, tData.iDrape3, tData.iDrape4, tData.iDrape5, tData.iDrape6, tData.iDrape7, tData.iDrape8];
            for (let i = 0; i < drapeMeshes.length; i++) {
                const drapeMesh = drapeMeshes[i];
                if (!drapeMesh) continue;
                dummy.position.copy(basePosition);
                dummy.quaternion.copy(baseQuaternion);
                if (isStump) {
                    dummy.scale.set(0, 0, 0);
                } else {
                    const drapeScale = (Array.isArray(profile.drapeScales) && Array.isArray(profile.drapeScales[i])) ? profile.drapeScales[i] : [0, 0, 0];
                    const drapeOffset = (Array.isArray(profile.drapeOffsets) && Array.isArray(profile.drapeOffsets[i])) ? profile.drapeOffsets[i] : [0, 0, 0];
                    const drapeYaw = (Array.isArray(profile.drapeYRotations) && Number.isFinite(profile.drapeYRotations[i])) ? profile.drapeYRotations[i] : 0;
                    const drapeJitter = Number.isFinite(profile.drapeJitter) ? profile.drapeJitter : 0;

                    dummy.position.x += drapeOffset[0];
                    dummy.position.y += drapeOffset[1];
                    dummy.position.z += drapeOffset[2];

                    if (drapeJitter > 0) {
                        dummy.position.x += deterministicCanopyJitter(basePosition.x, basePosition.z, i + 8, 0) * drapeJitter;
                        dummy.position.z += deterministicCanopyJitter(basePosition.x, basePosition.z, i + 8, 1) * drapeJitter;
                        dummy.position.y += deterministicCanopyJitter(basePosition.x, basePosition.z, i + 8, 2) * drapeJitter * 0.25;
                    }
                    if (drapeYaw !== 0) dummy.rotateY(drapeYaw);
                    dummy.scale.set(drapeScale[0] || 0, drapeScale[1] || 0, drapeScale[2] || 0);
                }
                dummy.updateMatrix();
                drapeMesh.setMatrixAt(treeIndex, dummy.matrix);
            }

            const leafMeshes = [tData.iLeaf1, tData.iLeaf2, tData.iLeaf3, tData.iLeaf4];
            for (let i = 0; i < leafMeshes.length; i++) {
                const leafMesh = leafMeshes[i];
                if (!leafMesh) continue;
                dummy.position.copy(basePosition);
                dummy.quaternion.copy(baseQuaternion);
                if (isStump) {
                    dummy.scale.set(0, 0, 0);
                } else {
                    const canopyScale = profile.canopyScales[i] || profile.canopyScales[0] || [1, 1, 1];
                    const canopyOffset = (Array.isArray(profile.canopyOffsets) && Array.isArray(profile.canopyOffsets[i])) ? profile.canopyOffsets[i] : [0, 0, 0];
                    const canopyYaw = (Array.isArray(profile.canopyYRotations) && Number.isFinite(profile.canopyYRotations[i])) ? profile.canopyYRotations[i] : 0;
                    const canopyJitter = Number.isFinite(profile.canopyJitter) ? profile.canopyJitter : 0;

                    dummy.position.x += canopyOffset[0];
                    dummy.position.y += (profile.canopyYOffset || 0) + canopyOffset[1];
                    dummy.position.z += canopyOffset[2];

                    if (canopyJitter > 0) {
                        dummy.position.x += deterministicCanopyJitter(basePosition.x, basePosition.z, i, 0) * canopyJitter;
                        dummy.position.z += deterministicCanopyJitter(basePosition.x, basePosition.z, i, 1) * canopyJitter;
                        dummy.position.y += deterministicCanopyJitter(basePosition.x, basePosition.z, i, 2) * canopyJitter * 0.35;
                        dummy.rotateY(deterministicCanopyJitter(basePosition.x, basePosition.z, i, 3) * canopyJitter * 0.42);
                    }
                    if (canopyYaw !== 0) dummy.rotateY(canopyYaw);
                    dummy.scale.set(canopyScale[0], canopyScale[1], canopyScale[2]);
                }
                dummy.updateMatrix();
                leafMesh.setMatrixAt(treeIndex, dummy.matrix);
            }
        }

        function markTreeVisualsDirty(tData) {
            if (!tData) return;
            if (tData.iTrunk) tData.iTrunk.instanceMatrix.needsUpdate = true;
            if (tData.iBranch) tData.iBranch.instanceMatrix.needsUpdate = true;
            if (tData.iBranch2) tData.iBranch2.instanceMatrix.needsUpdate = true;
            if (tData.iBranch3) tData.iBranch3.instanceMatrix.needsUpdate = true;
            if (tData.iDrape1) tData.iDrape1.instanceMatrix.needsUpdate = true;
            if (tData.iDrape2) tData.iDrape2.instanceMatrix.needsUpdate = true;
            if (tData.iDrape3) tData.iDrape3.instanceMatrix.needsUpdate = true;
            if (tData.iDrape4) tData.iDrape4.instanceMatrix.needsUpdate = true;
            if (tData.iDrape5) tData.iDrape5.instanceMatrix.needsUpdate = true;
            if (tData.iDrape6) tData.iDrape6.instanceMatrix.needsUpdate = true;
            if (tData.iDrape7) tData.iDrape7.instanceMatrix.needsUpdate = true;
            if (tData.iDrape8) tData.iDrape8.instanceMatrix.needsUpdate = true;
            if (tData.iLeaf1) tData.iLeaf1.instanceMatrix.needsUpdate = true;
            if (tData.iLeaf2) tData.iLeaf2.instanceMatrix.needsUpdate = true;
            if (tData.iLeaf3) tData.iLeaf3.instanceMatrix.needsUpdate = true;
            if (tData.iLeaf4) tData.iLeaf4.instanceMatrix.needsUpdate = true;
        }

        function isRuneEssenceRockCoordinate(x, y, z = 0) {
            if (!Array.isArray(RUNE_ESSENCE_ROCKS)) return false;
            return RUNE_ESSENCE_ROCKS.some((rock) => rock && rock.x === x && rock.y === y && rock.z === z);
        }

        const GEM_HOTSPOT = { x: 200, y: 370, radius: 20 };

        function isGemHotspotCoordinate(x, y, z = 0) {
            if (z !== 0) return false;
            return Math.hypot(x - GEM_HOTSPOT.x, y - GEM_HOTSPOT.y) <= GEM_HOTSPOT.radius;
        }

        function oreTypeForTile(x, y, z = 0) {
            const overrideKey = rockNodeKey(x, y, z);
            const overrideOreType = rockOreOverrides && rockOreOverrides[overrideKey];
            if (overrideOreType) return overrideOreType;
            if (isRuneEssenceRockCoordinate(x, y, z)) return 'rune_essence';
            const hash = ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
            if (isGemHotspotCoordinate(x, y, z)) {
                const gemTypes = ['sapphire', 'emerald'];
                return gemTypes[hash % gemTypes.length];
            }
            const weightedTypes = ['clay', 'copper', 'tin', 'iron', 'coal', 'silver', 'gold'];
            return weightedTypes[hash % weightedTypes.length];
        }

        function getRockDisplayName(oreType) {
            const names = {
                clay: 'Clay rock',
                copper: 'Copper rock',
                tin: 'Tin rock',
                iron: 'Iron rock',
                coal: 'Coal rock',
                silver: 'Silver rock',
                sapphire: 'Sapphire rock',
                gold: 'Gold rock',
                emerald: 'Emerald rock',
                rune_essence: 'Rune essence'
            };
            return names[oreType] || 'Rock';
        }

        function getRockColorHex(oreType) {
            const colors = {
                clay: 0xa78668,
                copper: 0xb06a4c,
                tin: 0x9aa5ae,
                iron: 0x6f7985,
                coal: 0x3f444c,
                silver: 0xc8ced6,
                sapphire: 0x3d6ed8,
                gold: 0xd4a829,
                emerald: 0x2aa66f,
                rune_essence: 0x7e848c
            };
            return colors[oreType] || 0x8f6b58;
        }

        const ROCK_VISUAL_PROFILES = {
            clay: { geometryKey: 'rockClay', materialKey: 'rockClay', instanceScale: [1.16, 1.0, 0.96], silhouette: 'low_rounded_mound' },
            copper: { geometryKey: 'rockCopper', materialKey: 'rockCopper', instanceScale: [1.0, 1.0, 1.0], silhouette: 'medium_faceted_lump' },
            tin: { geometryKey: 'rockTin', materialKey: 'rockTin', instanceScale: [0.92, 1.0, 1.08], silhouette: 'soft_dodeca_lump' },
            iron: { geometryKey: 'rockIron', materialKey: 'rockIron', instanceScale: [1.05, 1.08, 0.88], silhouette: 'blocky_slab' },
            coal: { geometryKey: 'rockCoal', materialKey: 'rockCoal', instanceScale: [1.12, 0.92, 1.08], silhouette: 'jagged_black_shard' },
            silver: { geometryKey: 'rockSilver', materialKey: 'rockSilver', instanceScale: [0.94, 1.08, 1.04], silhouette: 'bright_octa_lump' },
            sapphire: { geometryKey: 'rockSapphire', materialKey: 'rockSapphire', instanceScale: [0.82, 1.2, 0.82], silhouette: 'blue_tall_crystal' },
            gold: { geometryKey: 'rockGold', materialKey: 'rockGold', instanceScale: [1.18, 0.98, 0.92], silhouette: 'wide_gold_nugget' },
            emerald: { geometryKey: 'rockEmerald', materialKey: 'rockEmerald', instanceScale: [0.72, 1.34, 0.72], silhouette: 'green_needle_crystal' },
            rune_essence: { geometryKey: 'rockRuneEssence', materialKey: 'rockRuneEssence', instanceScale: [1.0, 1.0, 1.0], silhouette: 'large_persistent_essence_boulder' },
            depleted: { geometryKey: 'rockDepleted', materialKey: 'rockDepleted', instanceScale: [1.0, 1.0, 1.0], silhouette: 'flattened_depleted_shell' }
        };

        const ROCK_VISUAL_ORDER = Object.freeze([
            'clay',
            'copper',
            'tin',
            'iron',
            'coal',
            'silver',
            'sapphire',
            'gold',
            'emerald',
            'rune_essence',
            'depleted'
        ]);

        function getRockVisualProfile(visualId) {
            if (typeof visualId === 'string' && ROCK_VISUAL_PROFILES[visualId]) return ROCK_VISUAL_PROFILES[visualId];
            return ROCK_VISUAL_PROFILES.copper;
        }

        function getRockVisualIdForNode(rockNode, depleted) {
            if (depleted) return 'depleted';
            const oreType = rockNode && rockNode.oreType ? rockNode.oreType : 'copper';
            return ROCK_VISUAL_PROFILES[oreType] ? oreType : 'copper';
        }

        function createRockRenderData() {
            const rockMapByVisualId = Object.create(null);
            const rockMeshByVisualId = Object.create(null);
            for (let i = 0; i < ROCK_VISUAL_ORDER.length; i++) {
                const visualId = ROCK_VISUAL_ORDER[i];
                rockMapByVisualId[visualId] = [];
                rockMeshByVisualId[visualId] = null;
            }
            return { rockMapByVisualId, rockMeshByVisualId };
        }

        function rebuildRockNodes() {
            const rebuilt = {};
            for (let z = 0; z < PLANES; z++) {
                for (let y = 0; y < MAP_SIZE; y++) {
                    for (let x = 0; x < MAP_SIZE; x++) {
                        if (logicalMap[z][y][x] === TileId.ROCK) {
                            const key = rockNodeKey(x, y, z);
                            const prev = rockNodes[key];
                            const gateOverride = rockAreaGateOverrides && rockAreaGateOverrides[key] ? rockAreaGateOverrides[key] : null;
                            rebuilt[key] = {
                                oreType: prev && prev.oreType ? prev.oreType : oreTypeForTile(x, y, z),
                                depletedUntilTick: prev && prev.depletedUntilTick ? prev.depletedUntilTick : 0,
                                successfulYields: prev && Number.isFinite(prev.successfulYields) ? Math.max(0, Math.floor(prev.successfulYields)) : 0,
                                lastInteractionTick: prev && Number.isFinite(prev.lastInteractionTick) ? Math.max(0, Math.floor(prev.lastInteractionTick)) : 0,
                                areaGateFlag: prev && prev.areaGateFlag ? prev.areaGateFlag : (gateOverride && gateOverride.areaGateFlag ? gateOverride.areaGateFlag : null),
                                areaName: prev && prev.areaName ? prev.areaName : (gateOverride && gateOverride.areaName ? gateOverride.areaName : null),
                                areaGateMessage: prev && prev.areaGateMessage ? prev.areaGateMessage : (gateOverride && gateOverride.areaGateMessage ? gateOverride.areaGateMessage : null)
                            };
                        }
                    }
                }
            }
            rockNodes = rebuilt;
        }

        function getRockNodeAt(x, y, z = playerState.z) {
            if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) return null;
            if (logicalMap[z][y][x] !== TileId.ROCK) return null;
            const key = rockNodeKey(x, y, z);
            if (!rockNodes[key]) {
                const gateOverride = rockAreaGateOverrides && rockAreaGateOverrides[key] ? rockAreaGateOverrides[key] : null;
                rockNodes[key] = {
                    oreType: oreTypeForTile(x, y, z),
                    depletedUntilTick: 0,
                    successfulYields: 0,
                    lastInteractionTick: 0,
                    areaGateFlag: gateOverride && gateOverride.areaGateFlag ? gateOverride.areaGateFlag : null,
                    areaName: gateOverride && gateOverride.areaName ? gateOverride.areaName : null,
                    areaGateMessage: gateOverride && gateOverride.areaGateMessage ? gateOverride.areaGateMessage : null
                };
            }
            return rockNodes[key];
        }

        function isRockNodeDepleted(x, y, z = playerState.z) {
            const node = getRockNodeAt(x, y, z);
            return !!(node && node.depletedUntilTick > currentTick);
        }

        function refreshChunkAtTile(x, y) {
            const cx = Math.floor(x / CHUNK_SIZE);
            const cy = Math.floor(y / CHUNK_SIZE);
            const key = cx + ',' + cy;
            const chunkRuntime = getWorldChunkSceneRuntime();
            if (chunkRuntime.isNearChunkLoaded(key)) {
                const wasInteractive = chunkRuntime.getChunkInteractionState(key);
                unloadChunk(key);
                loadChunk(cx, cy, wasInteractive);
            }
        }

        function depleteRockNode(x, y, z = playerState.z, respawnTicks = 12) {
            const node = getRockNodeAt(x, y, z);
            if (!node) return;
            node.depletedUntilTick = currentTick + Math.max(1, respawnTicks);
            node.successfulYields = 0;
            node.lastInteractionTick = 0;
            refreshChunkAtTile(x, y);
        }

        function tickRockNodes() {
            const chunksToRefresh = new Set();
            for (const [key, node] of Object.entries(rockNodes)) {
                if (!node || !node.depletedUntilTick) continue;
                if (currentTick < node.depletedUntilTick) continue;
                node.depletedUntilTick = 0;
                node.successfulYields = 0;
                node.lastInteractionTick = 0;
                const parts = key.split(':');
                const xy = parts[1].split(',');
                const x = parseInt(xy[0], 10);
                const y = parseInt(xy[1], 10);
                chunksToRefresh.add(Math.floor(x / CHUNK_SIZE) + ',' + Math.floor(y / CHUNK_SIZE));
            }
            chunksToRefresh.forEach((chunkKey) => {
                const chunkRuntime = getWorldChunkSceneRuntime();
                if (!chunkRuntime.isNearChunkLoaded(chunkKey)) return;
                const parts = chunkKey.split(',');
                const cx = parseInt(parts[0], 10);
                const cy = parseInt(parts[1], 10);
                const wasInteractive = chunkRuntime.getChunkInteractionState(chunkKey);
                unloadChunk(chunkKey);
                loadChunk(cx, cy, wasInteractive);
            });
        }
        function initLogicalMap() {
            rockNodes = {};
            rockOreOverrides = {};
            rockAreaGateOverrides = {};
            RUNE_ESSENCE_ROCKS = [];
            respawningTrees = [];
            treeNodes = {};
            // Re-initialize as 3D Arrays! [z][y][x]
            logicalMap = Array(PLANES).fill(0).map(() => Array(MAP_SIZE).fill(0).map(() => Array(MAP_SIZE).fill(0)));
            heightMap = Array(PLANES).fill(0).map(() => Array(MAP_SIZE).fill(0).map(() => Array(MAP_SIZE).fill(0)));
            
            // Only populate Ground Terrain on Z=0
            staticNpcBaseTiles = new Map();
            npcsToRender = [];
            bankBoothsToRender = [];
            doorsToRender = [];
            activeRoofVisuals = [];
            fishingSpotsToRender = [];
            cookingFireSpotsToRender = [];
            directionalSignsToRender = [];
            altarCandidatesToRender = [];
            furnacesToRender = [];
            anvilsToRender = [];
            const worldSceneStateRuntime = window.WorldSceneStateRuntime || null;
            const worldPayload = (worldSceneStateRuntime && typeof worldSceneStateRuntime.getCurrentWorldScenePayload === 'function')
                ? worldSceneStateRuntime.getCurrentWorldScenePayload()
                : null;
            if (!worldPayload) throw new Error('WorldSceneStateRuntime is unavailable.');
            const lakeDefs = worldPayload.lakeDefs;
            const castleFrontPond = worldPayload.castleFrontPond;
            const deepWaterCenter = worldPayload.deepWaterCenter;
            const pierConfig = worldPayload.pierConfig;
            const smithingHallApproach = worldPayload.smithingHallApproach;
            const waterRenderPayload = worldPayload.waterRenderPayload;
            const stampedStructures = worldPayload.stampedStructures;
            const stampMap = worldPayload.stampMap;
            const smithingStations = worldPayload.smithingStations;
            const fishingTrainingRouteDefs = worldPayload.fishingTrainingRouteDefs;
            const cookingRouteSpecs = worldPayload.cookingRouteSpecs;
            const firemakingTrainingRouteDefs = worldPayload.firemakingTrainingRouteDefs;
            const miningTrainingRouteDefs = worldPayload.miningTrainingRouteDefs;
            const runecraftingRouteDefs = worldPayload.runecraftingRouteDefs;
            const woodcuttingTrainingRouteDefs = worldPayload.woodcuttingTrainingRouteDefs;
            const miningNodePlacements = worldPayload.miningNodePlacements;
            const authoredAltarPlacements = worldPayload.authoredAltarPlacements;
            const woodcuttingNodePlacements = worldPayload.woodcuttingNodePlacements;
            const staircaseLandmarks = worldPayload.staircaseLandmarks;
            const doorLandmarks = worldPayload.doorLandmarks;
            const fenceLandmarks = worldPayload.fenceLandmarks;
            const roofLandmarks = worldPayload.roofLandmarks;
            const showcaseTreeDefs = worldPayload.showcaseTreeDefs;

            function placeStaticNpcOccupancyTile(x, y, z = 0, options = {}) {
                if (!logicalMap[z] || !logicalMap[z][y]) return false;
                const baseTile = Number.isFinite(options.baseTile)
                    ? Math.floor(Number(options.baseTile))
                    : logicalMap[z][y][x];
                rememberStaticNpcBaseTile(x, y, z, baseTile);
                logicalMap[z][y][x] = TileId.SOLID_NPC;
                if (Number.isFinite(options.height)) heightMap[z][y][x] = Number(options.height);
                return true;
            }

            function getStampBounds(structureId) {
                for (let i = 0; i < stampedStructures.length; i++) {
                    const structure = stampedStructures[i];
                    if (!structure || structure.structureId !== structureId) continue;
                    const rows = stampMap && Array.isArray(stampMap[structure.stampId]) ? stampMap[structure.stampId] : [];
                    const height = rows.length;
                    let width = 0;
                    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                        const row = rows[rowIndex];
                        if (typeof row === 'string') width = Math.max(width, row.length);
                    }
                    if (width <= 0 || height <= 0) continue;
                    return {
                        xMin: structure.x,
                        xMax: structure.x + width - 1,
                        yMin: structure.y,
                        yMax: structure.y + height - 1
                    };
                }
                return null;
            }

            function expandBounds(bounds, padX, padY) {
                if (!bounds) return null;
                return {
                    xMin: Math.max(1, bounds.xMin - padX),
                    xMax: Math.min(MAP_SIZE - 2, bounds.xMax + padX),
                    yMin: Math.max(1, bounds.yMin - padY),
                    yMax: Math.min(MAP_SIZE - 2, bounds.yMax + padY)
                };
            }

            const castleBounds = getStampBounds('castle_ground') || { xMin: 190, xMax: 220, yMin: 190, yMax: 215 };
            const generalStoreBounds = getStampBounds('general_store') || { xMin: 177, xMax: 185, yMin: 232, yMax: 240 };
            const smithingHallBounds = getStampBounds('smithing_hall') || { xMin: 221, xMax: 229, yMin: 228, yMax: 240 };
            const townCoreBounds = [
                expandBounds(castleBounds, 0, 0),
                expandBounds(generalStoreBounds, 0, 0),
                // Keep a clean spawn-safe apron around the open smithing hall footprint.
                expandBounds(smithingHallBounds, 4, 4)
            ].filter(Boolean);
            const townSquareBounds = expandBounds(castleBounds, 10, 10);
            const inTownCore = (x, y) => {
                for (let i = 0; i < townCoreBounds.length; i++) {
                    const bounds = townCoreBounds[i];
                    if (!bounds) continue;
                    if (x >= bounds.xMin && x <= bounds.xMax && y >= bounds.yMin && y <= bounds.yMax) {
                        return true;
                    }
                }
                return false;
            };
            const terrainNoise = (x, y) => {
                const n1 = Math.sin(x * 0.045) * 0.08;
                const n2 = Math.cos(y * 0.05) * 0.07;
                const n3 = Math.sin((x + y) * 0.03) * 0.05;
                return n1 + n2 + n3;
            };
            const LEGACY_COORD_MAP_SIZE = 486;
            const riverAxisScale = MAP_SIZE / LEGACY_COORD_MAP_SIZE;
            const riverFrequencyScale = LEGACY_COORD_MAP_SIZE / Math.max(1, MAP_SIZE);
            const sampleRiverAtY = (y) => {
                const eastCenterBase = 298 * riverAxisScale;
                const southCurveT = Math.max(0, (y - (296 * riverAxisScale)) / Math.max(1, 98 * riverAxisScale));
                const westBend = Math.pow(Math.min(1, southCurveT), 1.35) * (86 * riverAxisScale);
                return {
                    centerX: eastCenterBase
                        + (Math.sin(y * 0.018 * riverFrequencyScale) * (8 * riverAxisScale))
                        + (Math.sin(y * 0.007 * riverFrequencyScale) * (5 * riverAxisScale))
                        - westBend,
                    halfWidth: Math.max(
                        2.4,
                        (6.2 * riverAxisScale) + (Math.sin(y * 0.045 * riverFrequencyScale) * (1.8 * riverAxisScale))
                    )
                };
            };
            furnacesToRender = worldPayload.furnacesToRender.map((station) => Object.assign({}, station));
            anvilsToRender = worldPayload.anvilsToRender.map((station) => Object.assign({}, station));
            const waterRenderBodies = Array.isArray(waterRenderPayload && waterRenderPayload.bodies)
                ? waterRenderPayload.bodies.slice()
                : [];
            sharedMaterials.activeWaterRenderBodies = waterRenderBodies;
            sharedMaterials.activePierConfig = Object.assign({}, pierConfig);

            for (let y = 0; y < MAP_SIZE; y++) {
                for (let x = 0; x < MAP_SIZE; x++) {
                    if (x === 0 || y === 0 || x === MAP_SIZE - 1 || y === MAP_SIZE - 1) {
                        logicalMap[0][y][x] = 2; // Map borders
                        heightMap[0][y][x] = 0.08;
                    }
                    else if (townSquareBounds && x >= townSquareBounds.xMin && x <= townSquareBounds.xMax && y >= townSquareBounds.yMin && y <= townSquareBounds.yMax) {
                        logicalMap[0][y][x] = 0; // Empty Town Square
                        heightMap[0][y][x] = 0;
                    }
                    else {
                        logicalMap[0][y][x] = 0;
                        heightMap[0][y][x] = terrainNoise(x, y);
                    }
                }
            }
            const carveWaterTile = (x, y, depthNorm) => {
                if (x <= 1 || y <= 1 || x >= MAP_SIZE - 2 || y >= MAP_SIZE - 2) return;
                if (inTownCore(x, y)) return;

                if (depthNorm >= 0.64) {
                    logicalMap[0][y][x] = 22;
                    heightMap[0][y][x] = -0.18;
                } else {
                    logicalMap[0][y][x] = 21;
                    heightMap[0][y][x] = -0.10;
                }
            };

            for (let y = 1; y < MAP_SIZE - 1; y++) {
                const riverSample = sampleRiverAtY(y);
                const riverCenter = riverSample.centerX;
                const riverHalfWidth = riverSample.halfWidth;
                const carveSpan = Math.ceil(riverHalfWidth + 4);
                for (let x = Math.max(1, Math.floor(riverCenter - carveSpan)); x <= Math.min(MAP_SIZE - 2, Math.ceil(riverCenter + carveSpan)); x++) {
                    const d = Math.abs(x - riverCenter);
                    if (d <= riverHalfWidth) {
                        const depthNorm = Math.max(0, 1 - (d / Math.max(0.1, riverHalfWidth)));
                        carveWaterTile(x, y, depthNorm);
                    }
                }
            }

            const riverBridgeRows = [
                Math.floor(MAP_SIZE * 0.24),
                Math.floor(MAP_SIZE * 0.49),
                Math.floor(MAP_SIZE * 0.73)
            ];
            for (let i = 0; i < riverBridgeRows.length; i++) {
                const bridgeY = riverBridgeRows[i];
                if (bridgeY <= 2 || bridgeY >= MAP_SIZE - 3) continue;
                const sample = sampleRiverAtY(bridgeY);
                const bridgeHalfSpan = Math.ceil(sample.halfWidth + Math.max(3, 2 * riverAxisScale));
                const bridgeXMin = Math.max(2, Math.floor(sample.centerX - bridgeHalfSpan));
                const bridgeXMax = Math.min(MAP_SIZE - 3, Math.ceil(sample.centerX + bridgeHalfSpan));
                for (let x = bridgeXMin; x <= bridgeXMax; x++) {
                    logicalMap[0][bridgeY][x] = TileId.FLOOR_WOOD;
                    heightMap[0][bridgeY][x] = PIER_DECK_TOP_HEIGHT;
                }
                if (bridgeXMin - 1 > 1) {
                    logicalMap[0][bridgeY][bridgeXMin - 1] = TileId.SHORE;
                    heightMap[0][bridgeY][bridgeXMin - 1] = -0.01;
                }
                if (bridgeXMax + 1 < MAP_SIZE - 2) {
                    logicalMap[0][bridgeY][bridgeXMax + 1] = TileId.SHORE;
                    heightMap[0][bridgeY][bridgeXMax + 1] = -0.01;
                }
            }

            lakeDefs.forEach(lake => {
                for (let y = Math.max(1, Math.floor(lake.cy - lake.ry - 1)); y <= Math.min(MAP_SIZE - 2, Math.ceil(lake.cy + lake.ry + 1)); y++) {
                    for (let x = Math.max(1, Math.floor(lake.cx - lake.rx - 1)); x <= Math.min(MAP_SIZE - 2, Math.ceil(lake.cx + lake.rx + 1)); x++) {
                        const nx = (x - lake.cx) / lake.rx;
                        const ny = (y - lake.cy) / lake.ry;
                        const d = Math.sqrt(nx * nx + ny * ny);
                        if (d <= 1.0) carveWaterTile(x, y, 1.0 - d);
                    }
                }
            });
            // Add a guaranteed pond in front of the castle (clearing area).
            for (let y = Math.max(1, Math.floor(castleFrontPond.cy - castleFrontPond.ry - 1)); y <= Math.min(MAP_SIZE - 2, Math.ceil(castleFrontPond.cy + castleFrontPond.ry + 1)); y++) {
                for (let x = Math.max(1, Math.floor(castleFrontPond.cx - castleFrontPond.rx - 1)); x <= Math.min(MAP_SIZE - 2, Math.ceil(castleFrontPond.cx + castleFrontPond.rx + 1)); x++) {
                    const nx = (x - castleFrontPond.cx) / castleFrontPond.rx;
                    const ny = (y - castleFrontPond.cy) / castleFrontPond.ry;
                    const d = Math.sqrt(nx * nx + ny * ny);
                    if (d <= 1.0) carveWaterTile(x, y, 1.0 - d);
                }
            }

            // Ensure a stable deep-water center so dockside fishing can target dark water.
            for (let y = deepWaterCenter.yMin; y <= deepWaterCenter.yMax; y++) {
                for (let x = deepWaterCenter.xMin; x <= deepWaterCenter.xMax; x++) {
                    if (x <= 1 || y <= 1 || x >= MAP_SIZE - 2 || y >= MAP_SIZE - 2) continue;
                    logicalMap[0][y][x] = 22;
                    heightMap[0][y][x] = -0.18;
                }
            }

            // Add a wooden pier from the castle-facing bank toward the deep center.
            // The tip stops one tile short of water so the player stands on the pier and fishes adjacent dark water.
            const pierXMin = pierConfig.xMin;
            const pierXMax = pierConfig.xMax;
            const pierYStart = pierConfig.yStart;
            const pierYEnd = pierConfig.yEnd;
            for (let y = pierYStart; y <= pierYEnd; y++) {
                for (let x = pierXMin; x <= pierXMax; x++) {
                    if (x <= 1 || y <= 1 || x >= MAP_SIZE - 2 || y >= MAP_SIZE - 2) continue;
                    logicalMap[0][y][x] = 6;
                    heightMap[0][y][x] = PIER_DECK_TOP_HEIGHT;
                }
            }
            for (let y = pierYStart; y <= pierYEnd; y++) {
                const sideXs = [pierXMin - 1, pierXMax + 1];
                for (let i = 0; i < sideXs.length; i++) {
                    const sideX = sideXs[i];
                    if (!isPierSideWaterTile(pierConfig, sideX, y, 0)) continue;
                    if (sideX <= 1 || y <= 1 || sideX >= MAP_SIZE - 2 || y >= MAP_SIZE - 2) continue;
                    logicalMap[0][y][sideX] = TileId.WATER_SHALLOW;
                    heightMap[0][y][sideX] = -0.10;
                }
            }

            const pierEntryShoulders = [
                { x: pierXMin - 1, y: pierYStart },
                { x: pierXMax + 1, y: pierYStart }
            ];
            for (let i = 0; i < pierEntryShoulders.length; i++) {
                const shoulder = pierEntryShoulders[i];
                if (!shoulder) continue;
                if (shoulder.x <= 1 || shoulder.y <= 1 || shoulder.x >= MAP_SIZE - 2 || shoulder.y >= MAP_SIZE - 2) continue;
                logicalMap[0][shoulder.y][shoulder.x] = TileId.GRASS;
                heightMap[0][shoulder.y][shoulder.x] = Math.max(0.01, terrainNoise(shoulder.x, shoulder.y));
            }

            // Shoreline anchor tiles so the pier always has a clean walkable entry from land.
            const pierEntryY = pierConfig.entryY;
            const pierLandAnchorY = pierEntryY - 1;
            for (let x = pierXMin; x <= pierXMax; x++) {
                if (x <= 1 || pierEntryY <= 1 || x >= MAP_SIZE - 2 || pierEntryY >= MAP_SIZE - 2) continue;
                logicalMap[0][pierEntryY][x] = 20;
                heightMap[0][pierEntryY][x] = -0.01;
                if (pierLandAnchorY > 1) {
                    logicalMap[0][pierLandAnchorY][x] = TileId.SHORE;
                    heightMap[0][pierLandAnchorY][x] = -0.01;
                }
            }

            const fishingTrainingLocations = fishingTrainingRouteDefs.slice();
            window.getFishingTrainingLocations = function getFishingTrainingLocations() {
                return fishingTrainingLocations.slice();
            };
            const firemakingTrainingLocations = firemakingTrainingRouteDefs.slice();
            window.getFiremakingTrainingLocations = function getFiremakingTrainingLocations() {
                return firemakingTrainingLocations.slice();
            };

            // Fishing-012 world placement: dedicated fishing merchants near the training water.
            const fishingMerchantSpots = worldPayload.fishingMerchantSpots;
            for (let i = 0; i < fishingMerchantSpots.length; i++) {
                const spot = fishingMerchantSpots[i];
                if (!spot || spot.x <= 1 || spot.y <= 1 || spot.x >= MAP_SIZE - 2 || spot.y >= MAP_SIZE - 2) continue;

                // Force a shallow shoreline anchor so these merchants are always reachable beside fishing routes.
                placeStaticNpcOccupancyTile(spot.x, spot.y, 0, { baseTile: TileId.SHORE, height: -0.01 });
                npcsToRender.push({
                    type: spot.type,
                    x: spot.x,
                    y: spot.y,
                    z: 0,
                    name: spot.name,
                    merchantId: spot.merchantId,
                    appearanceId: spot.appearanceId || null,
                    dialogueId: spot.dialogueId || null,
                    facingYaw: spot.facingYaw,
                    action: spot.action || 'Trade'
                });
            }

            const cookingTrainingLocations = [];
            cookingFireSpotsToRender = [];

            function setCookingRouteTile(x, y, z = 0) {
                if (x <= 1 || y <= 1 || x >= MAP_SIZE - 2 || y >= MAP_SIZE - 2) return false;
                const row = logicalMap[z] && logicalMap[z][y];
                if (!row) return false;
                const tile = row[x];
                const validBase = tile === TileId.GRASS
                    || tile === TileId.DIRT
                    || tile === TileId.FLOOR_WOOD
                    || tile === TileId.FLOOR_STONE
                    || tile === TileId.FLOOR_BRICK
                    || tile === TileId.STAIRS_RAMP
                    || tile === TileId.DOOR_OPEN
                    || tile === TileId.SHORE
                    || isWaterTileId(tile);
                if (!validBase) return false;

                if (isWaterTileId(tile)) {
                    logicalMap[z][y][x] = TileId.SHORE;
                    heightMap[z][y][x] = Math.max(-0.01, heightMap[z][y][x]);
                }
                return true;
            }

            for (let i = 0; i < cookingRouteSpecs.length; i++) {
                const routeSpec = cookingRouteSpecs[i];
                if (!routeSpec || !Array.isArray(routeSpec.fireTiles)) continue;
                const routePlacements = [];
                for (let j = 0; j < routeSpec.fireTiles.length; j++) {
                    const tile = routeSpec.fireTiles[j];
                    if (!tile) continue;
                    if (!setCookingRouteTile(tile.x, tile.y, 0)) continue;

                    const fireSpot = {
                        routeId: routeSpec.routeId,
                        label: routeSpec.label,
                        x: tile.x,
                        y: tile.y,
                        z: 0
                    };
                    cookingFireSpotsToRender.push(fireSpot);
                    routePlacements.push(fireSpot);
                }

                if (routePlacements.length > 0) {
                    const anchor = routePlacements[Math.floor(routePlacements.length / 2)];
                    cookingTrainingLocations.push({
                        routeId: routeSpec.routeId,
                        alias: routeSpec.alias || null,
                        label: routeSpec.label,
                        x: anchor.x,
                        y: anchor.y,
                        z: anchor.z,
                        count: routePlacements.length,
                        tags: Array.isArray(routeSpec.tags) ? routeSpec.tags.slice() : []
                    });
                }
            }

            window.getCookingTrainingLocations = function getCookingTrainingLocations() {
                return cookingTrainingLocations.slice();
            };

            rebuildRockNodes();
            rebuildTreeNodes();

            // Soften natural terrain transitions so adjacent tiles visually blend.
            for (let pass = 0; pass < 2; pass++) {
                const smoothed = heightMap[0].map(row => row.slice());
                for (let y = 1; y < MAP_SIZE - 1; y++) {
                    for (let x = 1; x < MAP_SIZE - 1; x++) {
                        const tile = logicalMap[0][y][x];
                        const isBlendableNaturalTile = isNaturalTileId(tile) && !isWaterTileId(tile) && tile !== TileId.SHORE;
                        if (!isBlendableNaturalTile) continue;
                        if (inTownCore(x, y)) continue;

                        let sum = 0;
                        let count = 0;
                        for (let oy = -1; oy <= 1; oy++) {
                            for (let ox = -1; ox <= 1; ox++) {
                                const nt = logicalMap[0][y + oy][x + ox];
                                const neighborIsBlendable = isNaturalTileId(nt) && !isWaterTileId(nt) && nt !== TileId.SHORE;
                                if (neighborIsBlendable) {
                                    sum += heightMap[0][y + oy][x + ox];
                                    count++;
                                }
                            }
                        }
                        if (count > 0) {
                            const avg = sum / count;
                            smoothed[y][x] = (heightMap[0][y][x] * 0.65) + (avg * 0.35);
                        }
                    }
                }
                heightMap[0] = smoothed;
            }

            // --- THE 3D ASCII BLUEPRINT ENGINE ---
            // F = Floor, W = Wall, C = Corner Tower, B = Bank Booth, N = NPC, T = Dummy 
            // U = Climb Up, D = Climb Down, s = Seamless Walkable Stairs
            
            const castleFloor0 = stampMap && Array.isArray(stampMap.castle_floor0) ? stampMap.castle_floor0.slice() : [];
            const castleFloor1 = stampMap && Array.isArray(stampMap.castle_floor1) ? stampMap.castle_floor1.slice() : [];
            const generalStoreBlueprint = stampMap && Array.isArray(stampMap.general_store) ? stampMap.general_store.slice() : [];
            const smithingHallBlueprint = stampMap && Array.isArray(stampMap.smithing_hall) ? stampMap.smithing_hall.slice() : [];

            function stampBlueprint(startX, startY, z, blueprint) {
                for (let y = 0; y < blueprint.length; y++) {
                    const row = blueprint[y];
                    for (let x = 0; x < row.length; x++) {
                        const char = row[x];
                        if (char === ' ') continue; 
                        
                        const mapX = startX + x;
                        const mapY = startY + y;
                        
                        logicalMap[z][mapY][mapX] = 0; 
                        
                        if (char === 'W') { logicalMap[z][mapY][mapX] = 11; heightMap[z][mapY][mapX] = 0.5; }
                        else if (char === 'C') { logicalMap[z][mapY][mapX] = 12; heightMap[z][mapY][mapX] = 0.5; }
                        else if (char === 'F') { logicalMap[z][mapY][mapX] = 7; heightMap[z][mapY][mapX] = 0.5; }
                        else if (char === 'L' || char === 'T') { logicalMap[z][mapY][mapX] = 6; heightMap[z][mapY][mapX] = 0.5; }
                        else if (char === 'U') { logicalMap[z][mapY][mapX] = 13; heightMap[z][mapY][mapX] = 0.25; } 
                        else if (char === 'D') { logicalMap[z][mapY][mapX] = 14; heightMap[z][mapY][mapX] = 0.25; } 
                        else if (char === 's') { logicalMap[z][mapY][mapX] = 15; heightMap[z][mapY][mapX] = 0.25; } // Seamless stairs
                        else if (char === 'S') { logicalMap[z][mapY][mapX] = 15; heightMap[z][mapY][mapX] = 0.75; } // Seamless stairs T2
                        else if (char === 'P') { logicalMap[z][mapY][mapX] = 7; heightMap[z][mapY][mapX] = 1.0; } // Platform T2
                        else if (char === 'H') { logicalMap[z][mapY][mapX] = 15; heightMap[z][mapY][mapX] = 1.25; } // Seamless stairs T3
                        else if (char === 'E') { logicalMap[z][mapY][mapX] = 7; heightMap[z][mapY][mapX] = 1.5; } // Platform T3
                        else if (char === 'B') { 
                            logicalMap[z][mapY][mapX] = 9; heightMap[z][mapY][mapX] = 0.5; 
                            bankBoothsToRender.push({ x: mapX, y: mapY, z: z });
                        }
                        else if (char === 'N') { 
                            placeStaticNpcOccupancyTile(mapX, mapY, z, { baseTile: TileId.FLOOR_STONE, height: 0.5 });
                            npcsToRender.push({ type: 3, x: mapX, y: mapY, z: z, name: "Banker" });
                        }
                        else if (char === 'K') { 
                            placeStaticNpcOccupancyTile(mapX, mapY, z, { baseTile: TileId.FLOOR_STONE, height: 0.5 });
                            npcsToRender.push({ type: 7, x: mapX, y: mapY, z: z, name: "King Roald" });
                        }
                        else if (char === 'Q') { 
                            placeStaticNpcOccupancyTile(mapX, mapY, z, { baseTile: TileId.FLOOR_STONE, height: 0.5 });
                            npcsToRender.push({ type: 8, x: mapX, y: mapY, z: z, name: "Queen Ellamaria" });
                        }
                        else if (char === 'V') { 
                            logicalMap[z][mapY][mapX] = 17; heightMap[z][mapY][mapX] = 0.5; 
                        }
                        else if (char === '$') { 
                            placeStaticNpcOccupancyTile(mapX, mapY, z, { baseTile: TileId.FLOOR_STONE, height: 0.5 });
                            npcsToRender.push({ type: 2, x: mapX, y: mapY, z: z, name: "Shopkeeper" });
                        }
                        else if (char === 'T') { 
                            logicalMap[z][mapY][mapX] = 10; heightMap[z][mapY][mapX] = 0.5; 
                        }
                    }
                }
            }

            for (let i = 0; i < stampedStructures.length; i++) {
                const structure = stampedStructures[i];
                if (!structure || !stampMap || !Array.isArray(stampMap[structure.stampId])) continue;
                stampBlueprint(structure.x, structure.y, structure.z, stampMap[structure.stampId]);
            }
            // Re-assert smithing station collision after blueprint stamping.
            for (let i = 0; i < smithingStations.length; i++) {
                const station = smithingStations[i];
                if (!station || station.x <= 1 || station.y <= 1 || station.x >= MAP_SIZE - 2 || station.y >= MAP_SIZE - 2) continue;
                if (station.type === 'FURNACE') {
                    const w = Number.isFinite(station.footprintW) ? station.footprintW : 2;
                    const d = Number.isFinite(station.footprintD) ? station.footprintD : 2;
                    for (let oy = 0; oy < d; oy++) {
                        for (let ox = 0; ox < w; ox++) {
                            const sx = station.x + ox;
                            const sy = station.y + oy;
                            if (sx <= 1 || sy <= 1 || sx >= MAP_SIZE - 2 || sy >= MAP_SIZE - 2) continue;
                            logicalMap[0][sy][sx] = 16;
                        }
                    }
                } else {
                    logicalMap[0][station.y][station.x] = 16;
                }
            }
            const staticMerchantSpots = worldPayload.staticMerchantSpots;
            for (let i = 0; i < staticMerchantSpots.length; i++) {
                const spot = staticMerchantSpots[i];
                if (!spot || spot.x <= 1 || spot.y <= 1 || spot.x >= MAP_SIZE - 2 || spot.y >= MAP_SIZE - 2) continue;
                const merchantHeight = Array.isArray(spot.tags)
                    && !spot.tags.includes('tutorial')
                    && (spot.tags.includes('smithing') || spot.tags.includes('crafting'))
                    ? 0.5
                    : null;
                placeStaticNpcOccupancyTile(spot.x, spot.y, 0, { height: merchantHeight });
                npcsToRender.push({
                    type: spot.type,
                    x: spot.x,
                    y: spot.y,
                    z: 0,
                    name: spot.name,
                    merchantId: spot.merchantId,
                    appearanceId: spot.appearanceId || null,
                    dialogueId: spot.dialogueId || null,
                    facingYaw: spot.facingYaw,
                    action: spot.action || 'Trade',
                    travelToWorldId: spot.travelToWorldId || null,
                    travelSpawn: spot.travelSpawn || null
                });
            }

            for (let i = 0; i < staircaseLandmarks.length; i++) {
                const staircase = staircaseLandmarks[i];
                if (!staircase || !Array.isArray(staircase.tiles)) continue;
                for (let j = 0; j < staircase.tiles.length; j++) {
                    const tile = staircase.tiles[j];
                    if (!tile || !Number.isInteger(tile.x) || !Number.isInteger(tile.y) || !Number.isInteger(tile.z)) continue;
                    if (!logicalMap[tile.z] || !logicalMap[tile.z][tile.y]) continue;
                    const tileId = TileId[tile.tileId];
                    if (!Number.isFinite(tileId)) continue;
                    logicalMap[tile.z][tile.y][tile.x] = tileId;
                    heightMap[tile.z][tile.y][tile.x] = Number.isFinite(tile.height) ? tile.height : heightMap[tile.z][tile.y][tile.x];
                    if (tileId === TileId.BANK_BOOTH && !bankBoothsToRender.some((booth) => booth.x === tile.x && booth.y === tile.y && booth.z === tile.z)) {
                        bankBoothsToRender.push({ x: tile.x, y: tile.y, z: tile.z });
                    }
                }
            }

            function applyFenceLandmark(fence) {
                if (!fence || !Array.isArray(fence.points) || fence.points.length < 2) return;
                const z = Number.isInteger(fence.z) ? fence.z : 0;
                for (let pointIndex = 1; pointIndex < fence.points.length; pointIndex++) {
                    const from = fence.points[pointIndex - 1];
                    const to = fence.points[pointIndex];
                    if (!from || !to) continue;
                    const dx = Math.sign(to.x - from.x);
                    const dy = Math.sign(to.y - from.y);
                    if (dx !== 0 && dy !== 0) continue;
                    const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
                    let x = from.x;
                    let y = from.y;
                    for (let step = 0; step <= steps; step++) {
                        if (logicalMap[z] && logicalMap[z][y] && x > 0 && y > 0 && x < MAP_SIZE - 1 && y < MAP_SIZE - 1) {
                            logicalMap[z][y][x] = TileId.FENCE;
                            heightMap[z][y][x] = Number.isFinite(fence.height) ? fence.height : 0.05;
                        }
                        x += dx;
                        y += dy;
                    }
                }
            }

            for (let i = 0; i < fenceLandmarks.length; i++) {
                applyFenceLandmark(fenceLandmarks[i]);
            }

            function resolveNpcAppearanceId(npc) {
                if (!npc || typeof npc !== 'object') return null;
                const explicitAppearanceId = typeof npc.appearanceId === 'string' ? npc.appearanceId.trim().toLowerCase() : '';
                if (explicitAppearanceId) return explicitAppearanceId;
                const merchantId = typeof npc.merchantId === 'string' ? npc.merchantId.trim().toLowerCase() : '';
                const name = typeof npc.name === 'string' ? npc.name.trim().toLowerCase() : '';
                if (merchantId === 'tanner_rusk' || name === 'tanner rusk') return 'tanner_rusk';
                return null;
            }

            // Smithing hall approach stairs from pond side (west/open side).
            if (
                smithingHallApproach
                && Number.isInteger(smithingHallApproach.shoreX)
                && Number.isInteger(smithingHallApproach.stairX)
                && Number.isInteger(smithingHallApproach.yStart)
                && Number.isInteger(smithingHallApproach.yEnd)
            ) {
                const yStart = Math.min(smithingHallApproach.yStart, smithingHallApproach.yEnd);
                const yEnd = Math.max(smithingHallApproach.yStart, smithingHallApproach.yEnd);
                for (let sy = yStart; sy <= yEnd; sy++) {
                    if (sy <= 1 || sy >= MAP_SIZE - 2) continue;
                    if (smithingHallApproach.shoreX > 1 && smithingHallApproach.shoreX < MAP_SIZE - 2) {
                        logicalMap[0][sy][smithingHallApproach.shoreX] = 20;
                        heightMap[0][sy][smithingHallApproach.shoreX] = -0.01;
                    }
                    if (smithingHallApproach.stairX > 1 && smithingHallApproach.stairX < MAP_SIZE - 2) {
                        logicalMap[0][sy][smithingHallApproach.stairX] = 15;
                        heightMap[0][sy][smithingHallApproach.stairX] = 0.25;
                    }
                }
            }
            
            for (let i = 0; i < doorLandmarks.length; i++) {
                const door = doorLandmarks[i];
                if (!door || !Number.isInteger(door.x) || !Number.isInteger(door.y) || !Number.isInteger(door.z)) continue;
                const tileId = TileId[door.tileId];
                if (Number.isFinite(tileId)) {
                    logicalMap[door.z][door.y][door.x] = tileId;
                    heightMap[door.z][door.y][door.x] = Number.isFinite(door.height) ? door.height : heightMap[door.z][door.y][door.x];
                }
                doorsToRender.push({
                    x: door.x,
                    y: door.y,
                    z: door.z,
                    isOpen: !!door.isOpen,
                    hingeOffsetX: door.hingeOffsetX,
                    hingeOffsetY: door.hingeOffsetY,
                    thickness: door.thickness,
                    width: door.width,
                    isEW: door.isEW,
                    closedRot: door.closedRot,
                    openRot: door.openRot,
                    currentRotation: door.currentRotation,
                    targetRotation: door.targetRotation,
                    isWoodenGate: tileId === TileId.WOODEN_GATE_CLOSED || tileId === TileId.WOODEN_GATE_OPEN,
                    closedTileId: tileId === TileId.WOODEN_GATE_OPEN ? TileId.WOODEN_GATE_CLOSED : tileId,
                    tutorialRequiredStep: Number.isFinite(door.tutorialRequiredStep) ? door.tutorialRequiredStep : null,
                    tutorialGateMessage: typeof door.tutorialGateMessage === 'string' ? door.tutorialGateMessage : ''
                });
            }
            refreshTutorialGateStates();
            sharedMaterials.activeRoofLandmarks = roofLandmarks.map((roof) => Object.assign({}, roof, {
                hideBounds: roof && roof.hideBounds ? Object.assign({}, roof.hideBounds) : null
            }));

            const setMiningRockAt = (placement) => {
                if (!placement || !placement.oreType) return false;
                if (!logicalMap[placement.z] || !logicalMap[placement.z][placement.y]) return false;
                logicalMap[placement.z][placement.y][placement.x] = TileId.ROCK;
                const key = rockNodeKey(placement.x, placement.y, placement.z);
                rockOreOverrides[key] = placement.oreType;

                const hasAreaGate = placement
                    && ((typeof placement.areaGateFlag === 'string' && placement.areaGateFlag)
                        || (typeof placement.areaName === 'string' && placement.areaName)
                        || (typeof placement.areaGateMessage === 'string' && placement.areaGateMessage));
                if (hasAreaGate) {
                    rockAreaGateOverrides[key] = {
                        areaGateFlag: (typeof placement.areaGateFlag === 'string' && placement.areaGateFlag) ? placement.areaGateFlag : null,
                        areaName: (typeof placement.areaName === 'string' && placement.areaName) ? placement.areaName : null,
                        areaGateMessage: (typeof placement.areaGateMessage === 'string' && placement.areaGateMessage) ? placement.areaGateMessage : null
                    };
                } else if (rockAreaGateOverrides && rockAreaGateOverrides[key]) {
                    delete rockAreaGateOverrides[key];
                }
                return true;
            };
            const setTreePlacement = (placement) => {
                if (!placement) return false;
                if (!logicalMap[placement.z] || !logicalMap[placement.z][placement.y]) return false;
                logicalMap[placement.z][placement.y][placement.x] = TileId.TREE;
                return setTreeNode(placement.x, placement.y, placement.z, placement.nodeId, {
                    areaGateFlag: placement.areaGateFlag || null,
                    areaName: placement.areaName || null,
                    areaGateMessage: placement.areaGateMessage || null
                });
            };
            const clearNaturalArea = (centerX, centerY, radius) => {
                for (let y = centerY - radius; y <= centerY + radius; y++) {
                    for (let x = centerX - radius; x <= centerX + radius; x++) {
                        if (x <= 1 || y <= 1 || x >= MAP_SIZE - 2 || y >= MAP_SIZE - 2) continue;
                        const tile = logicalMap[0][y][x];
                        if (isNaturalTileId(tile)) {
                            logicalMap[0][y][x] = TileId.GRASS;
                            heightMap[0][y][x] = Math.max(0, heightMap[0][y][x]);
                        }
                    }
                }
            };
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
                            if (logicalMap[0][y][x] !== TileId.DIRT) continue;
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
                            const currentHeight = heightMap[0][y][x];
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
            const isQuarrySculptTile = (x, y) => {
                if (x <= 1 || y <= 1 || x >= MAP_SIZE - 2 || y >= MAP_SIZE - 2) return false;
                if (inTownCore(x, y)) return false;
                const row = logicalMap[0] && logicalMap[0][y];
                if (!row) return false;
                const tile = row[x];
                return tile === TileId.GRASS || tile === TileId.DIRT || tile === TileId.ROCK || tile === TileId.STUMP;
            };
            const applyMiningQuarryTerrain = (placements, activePlacements = placements) => {
                if (!Array.isArray(placements) || placements.length === 0) return;
                const clusters = Object.create(null);
                const activeByRoute = Object.create(null);
                for (let i = 0; i < placements.length; i++) {
                    const placement = placements[i];
                    if (!placement || placement.z !== 0) continue;
                    if (!Number.isFinite(placement.x) || !Number.isFinite(placement.y)) continue;
                    const routeId = (typeof placement.routeId === 'string' && placement.routeId)
                        ? placement.routeId
                        : 'routeless_mine';
                    if (!clusters[routeId]) clusters[routeId] = [];
                    clusters[routeId].push(placement);
                }
                if (Array.isArray(activePlacements)) {
                    for (let i = 0; i < activePlacements.length; i++) {
                        const placement = activePlacements[i];
                        if (!placement || placement.z !== 0) continue;
                        if (!Number.isFinite(placement.x) || !Number.isFinite(placement.y)) continue;
                        const routeId = (typeof placement.routeId === 'string' && placement.routeId)
                            ? placement.routeId
                            : 'routeless_mine';
                        if (!activeByRoute[routeId]) activeByRoute[routeId] = [];
                        activeByRoute[routeId].push(placement);
                    }
                }

                const touched = new Set();
                const markTouched = (x, y) => touched.add(x + ',' + y);
                const clusterEntries = Object.entries(clusters);
                for (let i = 0; i < clusterEntries.length; i++) {
                    const clusterEntry = clusterEntries[i];
                    const routeId = clusterEntry[0];
                    const clusterPoints = clusterEntry[1];
                    if (!Array.isArray(clusterPoints) || clusterPoints.length === 0) continue;
                    const clusterRocks = Array.isArray(activeByRoute[routeId]) ? activeByRoute[routeId] : [];

                    const layout = getMiningQuarryLayout(routeId, clusterPoints);
                    const centerX = layout.centerX;
                    const centerY = layout.centerY;
                    const radius = layout.radius;
                    const dirtRadius = layout.dirtRadius;
                    const edgeDepth = layout.edgeDepth;
                    const centerDepth = layout.centerDepth;
                    const clusterSeed = hash2D((centerX * 0.37) + i, (centerY * 0.41) - i, clusterPoints.length + 17.6);
                    const footprintSeed = 611.4 + (clusterSeed * 187.9) + (i * 41.7);
                    const floorSeed = footprintSeed + 97.3;
                    const shoulderSeed = footprintSeed + 223.1;
                    const minX = Math.max(2, Math.floor(centerX - dirtRadius - 4));
                    const maxX = Math.min(MAP_SIZE - 3, Math.ceil(centerX + dirtRadius + 4));
                    const minY = Math.max(2, Math.floor(centerY - dirtRadius - 4));
                    const maxY = Math.min(MAP_SIZE - 3, Math.ceil(centerY + dirtRadius + 4));
                    const resolveFootprint = (x, y) => {
                        const dx = x - centerX;
                        const dy = y - centerY;
                        const distance = Math.hypot(dx, dy);
                        const angle = Math.atan2(dy, dx);
                        const macroNoise = sampleFractalNoise2D(
                            ((x + (clusterSeed * 31.2)) * 0.12),
                            ((y - (clusterSeed * 27.8)) * 0.12),
                            footprintSeed,
                            3,
                            2.0,
                            0.55
                        );
                        const angularNoise = sampleFractalNoise2D(
                            ((((angle / Math.PI) + 1) * 0.95) + (clusterSeed * 0.8)),
                            ((distance * 0.085) + (clusterSeed * 0.65)),
                            footprintSeed + 34.8,
                            2,
                            2.0,
                            0.5
                        );
                        const lobeNoise = sampleFractalNoise2D(
                            ((dx * 0.08) + (clusterSeed * 9.1)),
                            ((dy * 0.08) - (clusterSeed * 7.3)),
                            footprintSeed + 79.6,
                            2,
                            2.0,
                            0.52
                        );
                        const dirtScale = Math.max(0.72, 0.84 + (macroNoise * 0.18) + ((angularNoise - 0.5) * 0.16) + ((lobeNoise - 0.5) * 0.12));
                        const pitScale = Math.max(0.66, 0.78 + (macroNoise * 0.12) + ((angularNoise - 0.5) * 0.08));
                        return {
                            distance,
                            macroNoise,
                            angularNoise,
                            lobeNoise,
                            effectiveDirtRadius: dirtRadius * dirtScale,
                            effectivePitRadius: radius * pitScale
                        };
                    };

                    for (let y = minY; y <= maxY; y++) {
                        for (let x = minX; x <= maxX; x++) {
                            if (!isQuarrySculptTile(x, y)) continue;
                            const footprint = resolveFootprint(x, y);
                            const distance = footprint.distance;
                            const dirtMask = 1 - smoothstep(
                                footprint.effectiveDirtRadius - 0.55,
                                footprint.effectiveDirtRadius + 0.25,
                                distance
                            );
                            const shoulderMask = 1 - smoothstep(
                                footprint.effectiveDirtRadius + 0.25,
                                footprint.effectiveDirtRadius + 1.55,
                                distance
                            );
                            if (dirtMask <= 0 && shoulderMask <= 0) continue;

                            const tile = logicalMap[0][y][x];
                            if (dirtMask > 0.12 && (tile === TileId.GRASS || tile === TileId.STUMP || tile === TileId.DIRT)) {
                                logicalMap[0][y][x] = TileId.DIRT;
                            }

                            let targetHeight = heightMap[0][y][x];
                            let blend = 0;
                            if (dirtMask > 0) {
                                const basinNoise = sampleFractalNoise2D(
                                    ((x + (clusterSeed * 13.8)) * 0.2),
                                    ((y - (clusterSeed * 18.4)) * 0.2),
                                    floorSeed,
                                    3,
                                    2.0,
                                    0.56
                                );
                                const pocketNoise = sampleFractalNoise2D(
                                    ((x - (clusterSeed * 9.4)) * 0.42),
                                    ((y + (clusterSeed * 6.7)) * 0.42),
                                    floorSeed + 53.4,
                                    2,
                                    2.0,
                                    0.5
                                );
                                const shelfNoise = sampleFractalNoise2D(
                                    ((x + (clusterSeed * 5.2)) * 0.1),
                                    ((y - (clusterSeed * 3.7)) * 0.1),
                                    shoulderSeed,
                                    2,
                                    2.0,
                                    0.54
                                );
                                const pitMask = 1 - smoothstep(0.12, 1.02, distance / Math.max(1, footprint.effectivePitRadius));
                                const depthMask = Math.pow(clamp01(pitMask), 1.18);
                                const floorVariation = ((basinNoise - 0.5) * (0.08 + (depthMask * 0.08)))
                                    + ((pocketNoise - 0.5) * (0.04 + (depthMask * 0.05)))
                                    + ((shelfNoise - 0.5) * 0.026)
                                    + ((footprint.lobeNoise - 0.5) * (0.02 + (depthMask * 0.016)));
                                targetHeight = lerpNumber(edgeDepth, centerDepth, depthMask) + floorVariation;
                                blend = 0.82 + (dirtMask * 0.12);
                            } else if (shoulderMask > 0) {
                                targetHeight = edgeDepth * (0.14 + (shoulderMask * 0.26));
                                blend = shoulderMask * 0.34;
                            }

                            if (blend > 0) {
                                const currentHeight = heightMap[0][y][x];
                                const loweredHeight = lerpNumber(currentHeight, targetHeight, blend);
                                heightMap[0][y][x] = Math.min(currentHeight, loweredHeight);
                                markTouched(x, y);
                            }
                        }
                    }

                    for (let j = 0; j < clusterRocks.length; j++) {
                        const rock = clusterRocks[j];
                        if (!isQuarrySculptTile(rock.x, rock.y)) continue;
                        let weightedSum = 0;
                        let weightedWeight = 0;
                        for (let oy = -1; oy <= 1; oy++) {
                            for (let ox = -1; ox <= 1; ox++) {
                                const nx = rock.x + ox;
                                const ny = rock.y + oy;
                                if (!isQuarrySculptTile(nx, ny)) continue;
                                const weight = (ox === 0 && oy === 0) ? 0.28 : ((ox === 0 || oy === 0) ? 0.16 : 0.08);
                                weightedSum += heightMap[0][ny][nx] * weight;
                                weightedWeight += weight;
                            }
                        }
                        const rockGroundHeight = weightedWeight > 0
                            ? (weightedSum / weightedWeight)
                            : heightMap[0][rock.y][rock.x];
                        heightMap[0][rock.y][rock.x] = lerpNumber(heightMap[0][rock.y][rock.x], rockGroundHeight, 0.72);
                        markTouched(rock.x, rock.y);

                        for (let oy = -1; oy <= 1; oy++) {
                            for (let ox = -1; ox <= 1; ox++) {
                                const nx = rock.x + ox;
                                const ny = rock.y + oy;
                                if (!isQuarrySculptTile(nx, ny)) continue;
                                const neighborDist = Math.hypot(ox, oy);
                                const blend = neighborDist <= 0.01 ? 1 : (neighborDist <= 1.01 ? 0.32 : 0.18);
                                heightMap[0][ny][nx] = lerpNumber(heightMap[0][ny][nx], rockGroundHeight, blend);
                                markTouched(nx, ny);
                            }
                        }
                    }
                }

                const touchedCoords = Array.from(touched).map((key) => {
                    const comma = key.indexOf(',');
                    return {
                        x: parseInt(key.slice(0, comma), 10),
                        y: parseInt(key.slice(comma + 1), 10)
                    };
                });

                for (let pass = 0; pass < 3; pass++) {
                    const snapshot = heightMap[0].map((row) => row.slice());
                    for (let i = 0; i < touchedCoords.length; i++) {
                        const coord = touchedCoords[i];
                        if (!coord || !isQuarrySculptTile(coord.x, coord.y)) continue;
                        const tile = logicalMap[0][coord.y][coord.x];

                        let sum = 0;
                        let count = 0;
                        for (let oy = -1; oy <= 1; oy++) {
                            for (let ox = -1; ox <= 1; ox++) {
                                const nx = coord.x + ox;
                                const ny = coord.y + oy;
                                if (!isQuarrySculptTile(nx, ny)) continue;
                                sum += snapshot[ny][nx];
                                count++;
                            }
                        }
                        if (count > 0) {
                            const avg = sum / count;
                            const blend = tile === TileId.ROCK ? 0.18 : (tile === TileId.DIRT ? 0.22 : 0.28);
                            heightMap[0][coord.y][coord.x] = lerpNumber(snapshot[coord.y][coord.x], avg, blend);
                        }
                    }
                }

                for (let i = 0; i < touchedCoords.length; i++) {
                    const coord = touchedCoords[i];
                    if (!coord || !isQuarrySculptTile(coord.x, coord.y)) continue;
                    const tile = logicalMap[0][coord.y][coord.x];
                    const currentHeight = heightMap[0][coord.y][coord.x];
                    if (tile === TileId.DIRT || tile === TileId.ROCK) {
                        heightMap[0][coord.y][coord.x] = Math.min(-0.11, Math.max(-0.56, currentHeight));
                    } else {
                        heightMap[0][coord.y][coord.x] = Math.max(-0.14, currentHeight);
                    }
                }
            };

            const miningPlacementPlan = thinMiningRockPlacements(miningNodePlacements);
            let activeMiningPlacements = miningPlacementPlan.active;
            const runecraftingRoutes = runecraftingRouteDefs.slice();
            const woodcuttingTrainingLocations = woodcuttingTrainingRouteDefs.slice();

            // Shape the quarry floor first, then redistribute kept rocks across the dirt canvas.
            applyMiningQuarryTerrain(miningNodePlacements, []);
            activeMiningPlacements = redistributeMiningRockPlacements(activeMiningPlacements, miningNodePlacements);
            for (let i = 0; i < activeMiningPlacements.length; i++) {
                setMiningRockAt(activeMiningPlacements[i]);
            }

            const miningRouteCountById = Object.create(null);
            for (let i = 0; i < activeMiningPlacements.length; i++) {
                const placement = activeMiningPlacements[i];
                if (!placement || placement.z !== 0) continue;
                const routeId = (typeof placement.routeId === 'string' && placement.routeId)
                    ? placement.routeId
                    : null;
                if (!routeId) continue;
                miningRouteCountById[routeId] = (miningRouteCountById[routeId] || 0) + 1;
            }
            const miningTrainingLocations = miningTrainingRouteDefs.map((route) => {
                const layoutOverride = route && route.routeId ? MINING_QUARRY_LAYOUT_OVERRIDES[route.routeId] : null;
                return {
                    ...route,
                    x: layoutOverride && Number.isFinite(layoutOverride.anchorX) ? layoutOverride.anchorX : route.x,
                    y: layoutOverride && Number.isFinite(layoutOverride.anchorY) ? layoutOverride.anchorY : route.y,
                    tags: Array.isArray(route && route.tags) ? route.tags.slice() : [],
                    count: Number.isFinite(miningRouteCountById[route.routeId])
                        ? miningRouteCountById[route.routeId]
                        : route.count
                };
            });

            RUNE_ESSENCE_ROCKS = activeMiningPlacements
                .filter((placement) => placement && placement.oreType === 'rune_essence')
                .map((placement) => ({ x: placement.x, y: placement.y, z: placement.z }));

            altarCandidatesToRender = authoredAltarPlacements.slice();
            for (let i = 0; i < authoredAltarPlacements.length; i++) {
                const altar = authoredAltarPlacements[i];
                if (!altar) continue;
                for (let by = altar.y - 1; by <= altar.y + 2; by++) {
                    if (by < 0 || by >= MAP_SIZE) continue;
                    for (let bx = altar.x - 1; bx <= altar.x + 2; bx++) {
                        if (bx < 0 || bx >= MAP_SIZE) continue;
                        if (!logicalMap[altar.z] || !logicalMap[altar.z][by]) continue;
                        logicalMap[altar.z][by][bx] = TileId.OBSTACLE;
                    }
                }
            }

            for (let i = 0; i < woodcuttingNodePlacements.length; i++) {
                setTreePlacement(woodcuttingNodePlacements[i]);
            }

            for (let i = 0; i < showcaseTreeDefs.length; i++) {
                const tree = showcaseTreeDefs[i];
                if (!tree) continue;
                clearNaturalArea(tree.x, tree.y, Number.isFinite(tree.clearRadius) ? tree.clearRadius : 5);
                setTreePlacement({
                    placementId: `showcase:${tree.nodeId}:${i + 1}`,
                    routeId: `showcase:${tree.nodeId}`,
                    x: tree.x,
                    y: tree.y,
                    z: 0,
                    nodeId: tree.nodeId,
                    areaGateFlag: null,
                    areaName: null,
                    areaGateMessage: null
                });
            }

            rebuildRockNodes();
            rebuildTreeNodes();

            window.getMiningTrainingLocations = function getMiningTrainingLocations() {
                return miningTrainingLocations.slice();
            };

            window.getRunecraftingAltarLocations = function getRunecraftingAltarLocations() {
                return runecraftingRoutes.slice();
            };
            window.getRunecraftingAltarNameAt = function getRunecraftingAltarNameAt(x, y, z) {
                const routes = runecraftingRoutes;
                for (let i = 0; i < routes.length; i++) {
                    const route = routes[i];
                    if (!route) continue;
                    if (route.x === x && route.y === y && route.z === z) return route.label || null;
                }
                return null;
            };
            window.getWoodcuttingTrainingLocations = function getWoodcuttingTrainingLocations() {
                return woodcuttingTrainingLocations.slice();
            };

            const structureBoundsList = stampedStructures
                .map((structure) => {
                    if (!structure) return null;
                    const bounds = getStampBounds(structure.structureId);
                    if (!bounds) return null;
                    return {
                        structureId: structure.structureId,
                        z: Number.isFinite(structure.z) ? structure.z : 0,
                        xMin: bounds.xMin,
                        xMax: bounds.xMax,
                        yMin: bounds.yMin,
                        yMax: bounds.yMax
                    };
                })
                .filter(Boolean);

            const distanceToBounds = (bounds, x, y) => {
                const dx = x < bounds.xMin ? (bounds.xMin - x) : (x > bounds.xMax ? (x - bounds.xMax) : 0);
                const dy = y < bounds.yMin ? (bounds.yMin - y) : (y > bounds.yMax ? (y - bounds.yMax) : 0);
                return Math.max(dx, dy);
            };

            const expandNpcRoamBounds = (bounds, pad) => ({
                xMin: Math.max(1, bounds.xMin - pad),
                xMax: Math.min(MAP_SIZE - 2, bounds.xMax + pad),
                yMin: Math.max(1, bounds.yMin - pad),
                yMax: Math.min(MAP_SIZE - 2, bounds.yMax + pad)
            });

            const resolveTownNpcRoamBounds = (npc) => {
                if (!npc) return null;
                const actorZ = Number.isFinite(npc.z) ? npc.z : 0;
                const dialogueId = npc && typeof npc.dialogueId === 'string' ? npc.dialogueId.trim() : '';
                const roamPad = dialogueId ? 3 : (npc && npc.action === 'Travel' ? 2 : 1);
                for (let i = 0; i < structureBoundsList.length; i++) {
                    const bounds = structureBoundsList[i];
                    if (!bounds || bounds.z !== actorZ) continue;
                    if (npc.x >= bounds.xMin && npc.x <= bounds.xMax && npc.y >= bounds.yMin && npc.y <= bounds.yMax) {
                        return expandNpcRoamBounds(bounds, roamPad);
                    }
                }
                let nearestBounds = null;
                let nearestDistance = Infinity;
                for (let i = 0; i < structureBoundsList.length; i++) {
                    const bounds = structureBoundsList[i];
                    if (!bounds || bounds.z !== actorZ) continue;
                    const distance = distanceToBounds(bounds, npc.x, npc.y);
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestBounds = bounds;
                    }
                }
                if (nearestBounds && nearestDistance <= Math.max(3, roamPad + 1)) return expandNpcRoamBounds(nearestBounds, roamPad);
                const fallbackPad = dialogueId ? 4 : 2;
                return {
                    xMin: Math.max(1, npc.x - fallbackPad),
                    xMax: Math.min(MAP_SIZE - 2, npc.x + fallbackPad),
                    yMin: Math.max(1, npc.y - fallbackPad),
                    yMax: Math.min(MAP_SIZE - 2, npc.y + fallbackPad)
                };
            };

            const resolveTownNpcRoamingRadius = (npc, roamBounds) => {
                const npcName = npc && typeof npc.name === 'string' ? npc.name : '';
                const dialogueId = npc && typeof npc.dialogueId === 'string' ? npc.dialogueId.trim() : '';
                if (npcName === 'Banker') return 0;
                if (/^King\b/i.test(npcName) || /^Queen\b/i.test(npcName)) return 1;
                if (npc && npc.action === 'Travel') return dialogueId ? 2 : 1;
                if (dialogueId) {
                    if (roamBounds) {
                        const spanX = roamBounds.xMax - roamBounds.xMin + 1;
                        const spanY = roamBounds.yMax - roamBounds.yMin + 1;
                        return Math.max(3, Math.min(4, Math.floor(Math.min(spanX, spanY) / 2)));
                    }
                    return 3;
                }
                if (roamBounds) {
                    const spanX = roamBounds.xMax - roamBounds.xMin + 1;
                    const spanY = roamBounds.yMax - roamBounds.yMin + 1;
                    return Math.max(1, Math.min(2, Math.floor(Math.min(spanX, spanY) / 2)));
                }
                return 2;
            };

            loadedChunkNpcActors = new Map();
            const actorNowMs = performance.now();
            npcsToRender = npcsToRender.map((npc, index) => {
                const npcActorId = (npc && typeof npc.spawnId === 'string' && npc.spawnId)
                    || (npc && typeof npc.merchantId === 'string' && npc.merchantId ? `merchant:${npc.merchantId}` : '')
                    || `npc:${String(npc && npc.name ? npc.name : 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '_')}:${Number.isFinite(npc.x) ? npc.x : index}:${Number.isFinite(npc.y) ? npc.y : 0}:${Number.isFinite(npc.z) ? npc.z : 0}`;
                const roamBounds = resolveTownNpcRoamBounds(npc);
                const facingYaw = resolveTownNpcDefaultFacingYaw(npc);
                const roamingRadius = resolveTownNpcRoamingRadius(npc, roamBounds);
                const baseHeight = getTileHeightSafe(npc.x, npc.y, Number.isFinite(npc.z) ? npc.z : 0);
                return Object.assign({}, npc, {
                    actorId: npcActorId,
                    spawnId: typeof npc.spawnId === 'string' ? npc.spawnId : null,
                    merchantId: typeof npc.merchantId === 'string' ? npc.merchantId : null,
                    appearanceId: typeof npc.appearanceId === 'string' ? npc.appearanceId : null,
                    dialogueId: typeof npc.dialogueId === 'string' ? npc.dialogueId : null,
                    homeX: npc.x,
                    homeY: npc.y,
                    homeZ: Number.isFinite(npc.z) ? npc.z : 0,
                    roamBounds,
                    roamingRadius,
                    roamEnabled: roamingRadius > 0,
                    facingYaw,
                    targetFacingYaw: facingYaw,
                    visualFacingYaw: facingYaw,
                    visualX: npc.x,
                    visualY: npc.y,
                    visualBaseY: baseHeight + ((Number.isFinite(npc.z) ? npc.z : 0) * 3.0),
                    moveFromX: npc.x,
                    moveFromY: npc.y,
                    moveFromHeight: baseHeight,
                    moveToHeight: baseHeight,
                    moveStartedAtMs: 0,
                    moveDurationMs: 0,
                    idleUntilMs: actorNowMs + 400 + (hashTownNpcSeed(npcActorId) % 900),
                    animationSeed: hashTownNpcSeed(npcActorId),
                    mesh: null,
                    hitbox: null,
                    renderChunkKey: null
                });
            });

            if (typeof window.initCombatWorldState === 'function') window.initCombatWorldState();
        }

        function listQaNpcTargets() {
            if (!Array.isArray(npcsToRender)) return [];
            return npcsToRender.map((npc) => ({
                actorId: npc && npc.actorId ? npc.actorId : '',
                spawnId: npc && npc.spawnId ? npc.spawnId : '',
                merchantId: npc && npc.merchantId ? npc.merchantId : '',
                name: npc && npc.name ? npc.name : '',
                action: npc && npc.action ? npc.action : '',
                dialogueId: npc && npc.dialogueId ? npc.dialogueId : '',
                x: Number.isFinite(npc && npc.x) ? npc.x : 0,
                y: Number.isFinite(npc && npc.y) ? npc.y : 0,
                z: Number.isFinite(npc && npc.z) ? npc.z : 0,
                visualX: Number.isFinite(npc && npc.visualX) ? npc.visualX : (Number.isFinite(npc && npc.x) ? npc.x : 0),
                visualY: Number.isFinite(npc && npc.visualY) ? npc.visualY : (Number.isFinite(npc && npc.y) ? npc.y : 0),
                rendered: !!(npc && npc.hitbox)
            }));
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

        function findNearbyWaterRenderBodyForTile(waterBodies, x, y, z, maxRadius = 3) {
            if (!Array.isArray(waterBodies)) return null;
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

        function resolveVisualWaterRenderBodyForTile(waterBodies, x, y, z) {
            if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) return null;
            const tile = logicalMap[z][y][x];
            const pierCovered = isPierVisualCoverageTile(getActivePierConfig(), x, y, z);
            if (!isWaterTileId(tile) && !pierCovered) return null;

            const directBody = resolveWaterRenderBodyForTile(waterBodies, x, y);
            if (directBody) return directBody;
            if (isWaterTileId(tile)) return getDefaultWaterRenderBody();
            if (pierCovered) return findNearbyWaterRenderBodyForTile(waterBodies, x, y, z) || getDefaultWaterRenderBody();
            return null;
        }

        function getWaterSurfaceHeightForTile(waterBodies, x, y, z) {
            if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) return null;
            if (!isWaterTileId(logicalMap[z][y][x])) return null;
            const waterBody = resolveWaterRenderBodyForTile(waterBodies, x, y) || getDefaultWaterRenderBody();
            return Number.isFinite(waterBody.surfaceY) ? waterBody.surfaceY : -0.075;
        }

        function getWaterDepthWeightForTile(tile) {
            if (tile === TileId.WATER_DEEP) return 1.0;
            if (tile === TileId.WATER_SHALLOW) return 0.36;
            return null;
        }

        function getWaterDepthWeightAtPoint(worldX, worldY, z) {
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
                const weight = getWaterDepthWeightForTile(logicalMap[z][gridY][gridX]);
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
                        const weight = getWaterDepthWeightForTile(logicalMap[z][y][x]);
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

        function getWaterShoreStrengthAtPoint(worldX, worldY, z, shorelineWidth) {
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

        function pushWaterVertex(builder, worldX, worldY, surfaceY) {
            builder.surfacePositions.push(worldX, surfaceY, worldY);
            builder.surfaceData.push(
                getWaterDepthWeightAtPoint(worldX, worldY, builder.z),
                getWaterShoreStrengthAtPoint(worldX, worldY, builder.z, builder.body.shoreline.width)
            );
        }

        function pushShoreColor(target, color) {
            target.push(color.r, color.g, color.b);
        }

        function createChunkWaterBuilder(body, z) {
            return {
                body,
                z,
                surfacePositions: [],
                surfaceData: []
            };
        }

        function appendWaterTileToBuilder(builder, x, y, surfaceY) {
            const pierConfig = getActivePierConfig();
            const isPierCoveredTile = isPierVisualCoverageTile(pierConfig, x, y, builder.z);
            const edges = {
                north: classifyWaterEdgeType(x, y, 0, -1, builder.z, surfaceY),
                east: classifyWaterEdgeType(x, y, 1, 0, builder.z, surfaceY),
                south: classifyWaterEdgeType(x, y, 0, 1, builder.z, surfaceY),
                west: classifyWaterEdgeType(x, y, -1, 0, builder.z, surfaceY)
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

            pushWaterVertex(builder, nw.x, nw.y, nw.h);
            pushWaterVertex(builder, se.x, se.y, se.h);
            pushWaterVertex(builder, ne.x, ne.y, ne.h);
            pushWaterVertex(builder, nw.x, nw.y, nw.h);
            pushWaterVertex(builder, sw.x, sw.y, sw.h);
            pushWaterVertex(builder, se.x, se.y, se.h);
        }

        function flushChunkWaterBuilders(planeGroup, builders) {
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
                    planeGroup.add(surfaceMesh);
                    environmentMeshes.push(surfaceMesh);
                }

            });
        }

        function createWaterSurfacePatchMesh(bounds, surfaceY, styleTokens, depthWeight = 0.68, shoreStrength = 0.12) {
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

        function createTopAnchoredFloorMesh(material, x, y, zOffset, topHeight, z) {
            return worldStructureRenderRuntime.createTopAnchoredFloorMesh({ THREE, material, x, y, zOffset, topHeight, z });
        }

        function createFenceVisualGroup(x, y, z, zOffset, baseHeight) {
            return worldStructureRenderRuntime.createFenceVisualGroup({
                THREE,
                sharedMaterials,
                environmentMeshes,
                logicalMap,
                mapSize: MAP_SIZE,
                getVisualTileId,
                isFenceConnectorTile,
                x,
                y,
                z,
                zOffset,
                baseHeight
            });
        }

        function createWoodenGateVisualGroup(door, zOffset, baseHeight) {
            return worldStructureRenderRuntime.createWoodenGateVisualGroup({
                THREE,
                sharedMaterials,
                door,
                zOffset,
                baseHeight
            });
        }

        function chunkIntersectsRoof(roof, startX, startY, endX, endY, z) {
            return worldStructureRenderRuntime.chunkIntersectsRoof(roof, startX, startY, endX, endY, z);
        }

        function createRoofVisualGroup(roof, zOffset) {
            const group = worldStructureRenderRuntime.createRoofVisualGroup({
                THREE,
                sharedMaterials,
                roof,
                zOffset
            });
            if (group) activeRoofVisuals.push(group);
            return group;
        }

        function updateTutorialRoofVisibility() {
            worldStructureRenderRuntime.updateTutorialRoofVisibility({ activeRoofVisuals, playerState });
        }

        window.updateTutorialRoofVisibility = updateTutorialRoofVisibility;

        function getActivePierConfig() {
            return sharedMaterials.activePierConfig || null;
        }

        function isPierDeckTile(pierConfig, x, y, z) {
            return !!(
                pierConfig
                && z === 0
                && x >= pierConfig.xMin
                && x <= pierConfig.xMax
                && y >= pierConfig.yStart
                && y <= pierConfig.yEnd
            );
        }

        function isPierSideWaterTile(pierConfig, x, y, z) {
            return !!(
                pierConfig
                && z === 0
                && y >= (pierConfig.yStart + 1)
                && y <= pierConfig.yEnd
                && (x === (pierConfig.xMin - 1) || x === (pierConfig.xMax + 1))
            );
        }

        function isPierVisualCoverageTile(pierConfig, x, y, z) {
            return !!(
                pierConfig
                && z === 0
                && (
                    isPierDeckTile(pierConfig, x, y, z)
                    || isPierSideWaterTile(pierConfig, x, y, z)
                    || (
                        y >= (pierConfig.yEnd - 1)
                        && y <= pierConfig.yEnd
                        && x >= (pierConfig.xMin - 1)
                        && x <= (pierConfig.xMax + 1)
                    )
                )
            );
        }

        function classifyWaterEdgeType(x, y, dx, dy, z, waterSurfaceY) {
            const nx = x + dx;
            const ny = y + dy;
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
            if (resolveVisualWaterRenderBodyForTile(waterBodies, nx, ny, z)) return null;

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

        function appendChunkWaterTilesToBuilders(builders, waterBodies, z, Z_OFFSET, startX, startY, endX, endY) {
            const bodies = Array.isArray(waterBodies) ? waterBodies : [];
            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    const visualBody = resolveVisualWaterRenderBodyForTile(bodies, x, y, z);
                    if (!visualBody) continue;
                    if (!builders[visualBody.id]) {
                        builders[visualBody.id] = createChunkWaterBuilder(visualBody, z);
                    }
                    const surfaceY = Z_OFFSET + (Number.isFinite(visualBody.surfaceY) ? visualBody.surfaceY : -0.075);
                    appendWaterTileToBuilder(builders[visualBody.id], x, y, surfaceY);
                }
            }
        }

        function addPierVisualsToChunk(planeGroup, z, Z_OFFSET, startX, startY, endX, endY) {
            const pierConfig = getActivePierConfig();
            if (!pierConfig || z !== 0) return;
            // Keep pier stairs visually attached to the first deck row.
            const pierStepBaseY = pierConfig.entryY + 1;
            if (pierConfig.xMax < startX || pierConfig.xMin >= endX || pierConfig.yEnd < startY || pierStepBaseY >= endY) return;

            const deckTop = Z_OFFSET + PIER_DECK_TOP_HEIGHT;
            const deckThickness = PIER_DECK_THICKNESS;
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
                        Z_OFFSET + (Number.isFinite(pierWaterBody.surfaceY) ? pierWaterBody.surfaceY : -0.075) - 0.002,
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
                        environmentMeshes.push(deckMesh);
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
                    step.position.set(pierCenterX, Z_OFFSET + (stepHeight / 2), pierStepBaseY + stepCenters[i]);
                    step.castShadow = true;
                    step.receiveShadow = true;
                    step.userData = { type: 'GROUND', z: z, isPierStep: true };
                    planeGroup.add(step);
                    environmentMeshes.push(step);
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

        function getWorldChunkSceneRuntime() {
            const runtime = window.WorldChunkSceneRuntime || null;
            if (!runtime) throw new Error('WorldChunkSceneRuntime is unavailable.');
            return runtime;
        }

        const CHUNK_TIER_NEAR = getWorldChunkSceneRuntime().CHUNK_TIER_NEAR;
        const CHUNK_TIER_MID = getWorldChunkSceneRuntime().CHUNK_TIER_MID;
        const CHUNK_TIER_FAR = getWorldChunkSceneRuntime().CHUNK_TIER_FAR;

        function setChunkInteractionMeshesActive(interactionMeshes, targetState) {
            const meshes = Array.isArray(interactionMeshes) ? interactionMeshes : [];
            if (targetState) {
                const existing = new Set(environmentMeshes);
                for (let i = 0; i < meshes.length; i++) {
                    const mesh = meshes[i];
                    if (!mesh || existing.has(mesh)) continue;
                    environmentMeshes.push(mesh);
                    existing.add(mesh);
                }
            } else if (meshes.length > 0) {
                const removeSet = new Set(meshes);
                environmentMeshes = environmentMeshes.filter((mesh) => !removeSet.has(mesh));
            }
        }

        function getChunkCenterPosition() {
            if (!playerRig) return null;
            const pX = isFreeCam ? freeCamTarget.x : playerRig.position.x;
            const pZ = isFreeCam ? freeCamTarget.z : playerRig.position.z;
            return { x: pX, z: pZ, visiblePlane: playerState.z };
        }

        function buildChunkSceneRuntimeContext() {
            return {
                worldChunksX: WORLD_CHUNKS_X,
                worldChunksY: WORLD_CHUNKS_Y,
                chunkSize: CHUNK_SIZE,
                getChunkCenterPosition,
                hasPlayerRig: () => !!playerRig,
                removeChunkGroupFromScene: (group) => {
                    if (scene && group) scene.remove(group);
                },
                setChunkGroupPlaneVisibility,
                ensureFarChunkBackdropBuilt,
                ensureFarChunkGroup,
                ensureMidChunkGroup,
                loadNearChunk: loadChunk,
                unloadNearChunkGroup: unloadChunkGroup,
                setChunkInteractionMeshesActive,
                bumpShadowFocusRevision: () => {
                    sharedMaterials.shadowFocusRevision = Number.isFinite(sharedMaterials.shadowFocusRevision)
                        ? sharedMaterials.shadowFocusRevision + 1
                        : 1;
                }
            };
        }

        function setChunkGroupPlaneVisibility(group, maxVisiblePlane) {
            if (!group || !Array.isArray(group.children)) return;
            const visiblePlane = Number.isFinite(maxVisiblePlane) ? Math.floor(maxVisiblePlane) : 0;
            group.children.forEach((planeGroup) => {
                if (!planeGroup || !planeGroup.userData || planeGroup.userData.z === undefined) return;
                planeGroup.visible = planeGroup.userData.z <= visiblePlane;
            });
        }

        function clearPendingNearChunkBuilds(key = null) {
            getWorldChunkSceneRuntime().clearPendingNearChunkBuilds(key);
        }

        function clearChunkTierGroups() {
            getWorldChunkSceneRuntime().clearChunkTierGroups(buildChunkSceneRuntimeContext());
        }

        function ensureChunkTierRenderAssets() {
            if (!sharedMaterials.chunkMidTerrain) {
                sharedMaterials.chunkMidTerrain = new THREE.MeshLambertMaterial({ color: 0xffffff });
            }
            if (!sharedMaterials.chunkFarTerrain) {
                sharedMaterials.chunkFarTerrain = new THREE.MeshLambertMaterial({ color: 0xffffff });
            }
            if (!sharedMaterials.chunkMidFeatureTree) {
                sharedMaterials.chunkMidFeatureTree = new THREE.MeshLambertMaterial({ color: 0x4f6a3f, flatShading: true });
            }
            if (!sharedMaterials.chunkMidFeatureRock) {
                sharedMaterials.chunkMidFeatureRock = new THREE.MeshLambertMaterial({ color: 0x7a7f89, flatShading: true });
            }
            if (!sharedMaterials.chunkMidFeatureStone) {
                sharedMaterials.chunkMidFeatureStone = new THREE.MeshLambertMaterial({ color: 0x6f7278, flatShading: true });
            }
            if (!sharedMaterials.chunkFarFeatureTree) {
                sharedMaterials.chunkFarFeatureTree = new THREE.MeshLambertMaterial({ color: 0x43583a, flatShading: true });
            }
            if (!sharedMaterials.chunkFarFeatureRock) {
                sharedMaterials.chunkFarFeatureRock = new THREE.MeshLambertMaterial({ color: 0x666b74, flatShading: true });
            }
            if (!sharedMaterials.chunkFarFeatureStone) {
                sharedMaterials.chunkFarFeatureStone = new THREE.MeshLambertMaterial({ color: 0x5d6066, flatShading: true });
            }

            if (!sharedGeometries.chunkTierTree) {
                sharedGeometries.chunkTierTree = new THREE.ConeGeometry(0.34, 1.24, 6).translate(0, 0.62, 0);
            }
            if (!sharedGeometries.chunkTierRock) {
                sharedGeometries.chunkTierRock = new THREE.DodecahedronGeometry(0.28, 0).scale(1, 0.72, 0.95).translate(0, 0.24, 0);
            }
            if (!sharedGeometries.chunkTierWall) {
                sharedGeometries.chunkTierWall = new THREE.BoxGeometry(1.0, 2.0, 0.34).translate(0, 1.0, 0);
            }
            if (!sharedGeometries.chunkTierTower) {
                sharedGeometries.chunkTierTower = new THREE.CylinderGeometry(0.6, 0.7, 2.8, 8).translate(0, 1.4, 0);
            }

            const grassMap = sharedMaterials.grassTile && sharedMaterials.grassTile.map
                ? sharedMaterials.grassTile.map
                : null;
            if (grassMap) {
                if (sharedMaterials.chunkMidTerrain.map !== grassMap) {
                    sharedMaterials.chunkMidTerrain.map = grassMap;
                    sharedMaterials.chunkMidTerrain.needsUpdate = true;
                }
                if (sharedMaterials.chunkFarTerrain.map !== grassMap) {
                    sharedMaterials.chunkFarTerrain.map = grassMap;
                    sharedMaterials.chunkFarTerrain.needsUpdate = true;
                }
            }
        }

        function createSimplifiedTerrainMesh(startX, startY, tier) {
            const segments = tier === CHUNK_TIER_FAR ? 10 : 18;
            const terrainGeo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, segments, segments);
            terrainGeo.rotateX(-Math.PI / 2);
            const positions = terrainGeo.attributes.position;
            for (let vy = 0; vy <= segments; vy++) {
                for (let vx = 0; vx <= segments; vx++) {
                    const idx = (vy * (segments + 1)) + vx;
                    const worldX = startX - 0.5 + ((vx / segments) * CHUNK_SIZE);
                    const worldY = startY - 0.5 + ((vy / segments) * CHUNK_SIZE);
                    const sampleX = Math.max(0, Math.min(MAP_SIZE - 1, Math.floor(worldX + 0.5)));
                    const sampleY = Math.max(0, Math.min(MAP_SIZE - 1, Math.floor(worldY + 0.5)));
                    const h = (heightMap[0] && heightMap[0][sampleY]) ? heightMap[0][sampleY][sampleX] : 0;
                    positions.setY(idx, h);
                }
            }
            positions.needsUpdate = true;
            terrainGeo.computeVertexNormals();
            const terrainMat = tier === CHUNK_TIER_FAR ? sharedMaterials.chunkFarTerrain : sharedMaterials.chunkMidTerrain;
            const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
            terrainMesh.position.set(startX + CHUNK_SIZE / 2 - 0.5, 0, startY + CHUNK_SIZE / 2 - 0.5);
            terrainMesh.castShadow = false;
            terrainMesh.receiveShadow = tier === CHUNK_TIER_MID;
            terrainMesh.userData = { type: 'GROUND', z: 0, tier };
            return terrainMesh;
        }

        function addSimplifiedChunkFeatures(planeGroup, startX, startY, endX, endY, z, tier) {
            const stride = tier === CHUNK_TIER_FAR ? 4 : 2;
            let treeCount = 0;
            let rockCount = 0;
            let wallCount = 0;
            let towerCount = 0;
            for (let y = startY; y < endY; y += stride) {
                for (let x = startX; x < endX; x += stride) {
                    const tile = getVisualTileId(logicalMap[z][y][x], x, y, z);
                    if (z === 0 && isTreeTileId(tile)) treeCount += 1;
                    else if (z === 0 && tile === TileId.ROCK) rockCount += 1;
                    else if (tile === TileId.WALL) wallCount += 1;
                    else if (tile === TileId.TOWER) towerCount += 1;
                }
            }
            const allowReceiveShadow = tier === CHUNK_TIER_MID;
            const treeMat = tier === CHUNK_TIER_FAR ? sharedMaterials.chunkFarFeatureTree : sharedMaterials.chunkMidFeatureTree;
            const rockMat = tier === CHUNK_TIER_FAR ? sharedMaterials.chunkFarFeatureRock : sharedMaterials.chunkMidFeatureRock;
            const stoneMat = tier === CHUNK_TIER_FAR ? sharedMaterials.chunkFarFeatureStone : sharedMaterials.chunkMidFeatureStone;
            const dummy = new THREE.Object3D();
            const zOffset = z * 3.0;

            const fillInstances = (mesh, matchFn) => {
                if (!mesh) return;
                let idx = 0;
                for (let y = startY; y < endY; y += stride) {
                    for (let x = startX; x < endX; x += stride) {
                        const tile = getVisualTileId(logicalMap[z][y][x], x, y, z);
                        if (!matchFn(tile, x, y)) continue;
                        const tileHeight = heightMap[z] && heightMap[z][y] ? heightMap[z][y][x] : 0;
                        dummy.position.set(x, tileHeight + zOffset, y);
                        dummy.rotation.set(0, ((x * 13.7) + (y * 7.9)) % (Math.PI * 2), 0);
                        dummy.updateMatrix();
                        mesh.setMatrixAt(idx, dummy.matrix);
                        idx += 1;
                    }
                }
                mesh.instanceMatrix.needsUpdate = true;
            };

            if (treeCount > 0) {
                const trees = new THREE.InstancedMesh(sharedGeometries.chunkTierTree, treeMat, treeCount);
                trees.castShadow = false;
                trees.receiveShadow = allowReceiveShadow;
                trees.matrixAutoUpdate = false;
                fillInstances(trees, (tile) => z === 0 && isTreeTileId(tile));
                planeGroup.add(trees);
            }
            if (rockCount > 0) {
                const rocks = new THREE.InstancedMesh(sharedGeometries.chunkTierRock, rockMat, rockCount);
                rocks.castShadow = false;
                rocks.receiveShadow = allowReceiveShadow;
                rocks.matrixAutoUpdate = false;
                fillInstances(rocks, (tile) => z === 0 && tile === TileId.ROCK);
                planeGroup.add(rocks);
            }
            if (wallCount > 0) {
                const walls = new THREE.InstancedMesh(sharedGeometries.chunkTierWall, stoneMat, wallCount);
                walls.castShadow = false;
                walls.receiveShadow = allowReceiveShadow;
                walls.matrixAutoUpdate = false;
                fillInstances(walls, (tile) => tile === TileId.WALL);
                planeGroup.add(walls);
            }
            if (towerCount > 0) {
                const towers = new THREE.InstancedMesh(sharedGeometries.chunkTierTower, stoneMat, towerCount);
                towers.castShadow = false;
                towers.receiveShadow = allowReceiveShadow;
                towers.matrixAutoUpdate = false;
                fillInstances(towers, (tile) => tile === TileId.TOWER);
                planeGroup.add(towers);
            }
        }

        function createSimplifiedChunkGroup(cx, cy, tier = CHUNK_TIER_MID) {
            ensureChunkTierRenderAssets();
            const group = new THREE.Group();
            group.userData = { chunkTier: tier, chunkX: cx, chunkY: cy };
            const startX = cx * CHUNK_SIZE;
            const startY = cy * CHUNK_SIZE;
            const endX = startX + CHUNK_SIZE;
            const endY = startY + CHUNK_SIZE;
            for (let z = 0; z < PLANES; z++) {
                const planeGroup = new THREE.Group();
                planeGroup.userData.z = z;
                planeGroup.visible = z <= playerState.z;
                if (z === 0) planeGroup.add(createSimplifiedTerrainMesh(startX, startY, tier));
                addSimplifiedChunkFeatures(planeGroup, startX, startY, endX, endY, z, tier);
                group.add(planeGroup);
            }
            return group;
        }

        function ensureFarChunkGroup(cx, cy) {
            const key = `${cx},${cy}`;
            const runtime = getWorldChunkSceneRuntime();
            const existing = runtime.getFarChunkGroup(key);
            if (existing) return existing;
            const group = createSimplifiedChunkGroup(cx, cy, CHUNK_TIER_FAR);
            group.visible = false;
            scene.add(group);
            return runtime.setFarChunkGroup(key, group);
        }

        function ensureMidChunkGroup(cx, cy) {
            const key = `${cx},${cy}`;
            const runtime = getWorldChunkSceneRuntime();
            const existing = runtime.getMidChunkGroup(key);
            if (existing) return existing;
            const group = createSimplifiedChunkGroup(cx, cy, CHUNK_TIER_MID);
            group.visible = false;
            scene.add(group);
            return runtime.setMidChunkGroup(key, group);
        }

        function ensureFarChunkBackdropBuilt() {
            if (!scene) return;
            for (let cy = 0; cy < WORLD_CHUNKS_Y; cy++) {
                for (let cx = 0; cx < WORLD_CHUNKS_X; cx++) {
                    ensureFarChunkGroup(cx, cy);
                }
            }
        }

        function setChunkInteractionState(key, shouldRegisterInteraction) {
            getWorldChunkSceneRuntime().setChunkInteractionState(key, shouldRegisterInteraction, buildChunkSceneRuntimeContext());
        }

        function loadChunk(cx, cy, registerInteraction = true) {
            const group = new THREE.Group();
            const environmentMeshStartIndex = environmentMeshes.length;
            const renderedNpcActors = [];
            const startX = cx * CHUNK_SIZE;
            const startY = cy * CHUNK_SIZE;
            const endX = startX + CHUNK_SIZE;
            const endY = startY + CHUNK_SIZE;
            const waterRenderBodies = Array.isArray(sharedMaterials.activeWaterRenderBodies)
                ? sharedMaterials.activeWaterRenderBodies
                : [];
            const activePierConfig = getActivePierConfig();

            for (let z = 0; z < PLANES; z++) {
                const planeGroup = new THREE.Group();
                planeGroup.userData.z = z;
                planeGroup.visible = z <= playerState.z;
                const Z_OFFSET = z * 3.0;
                if (z === 0) {
                    const isNaturalTile = (tileType) => isNaturalTileId(tileType);
                    const isRenderableTerrainTile = (tileType) => isNaturalTile(tileType) && !isWaterTileId(tileType);
                    const isRenderableUnderlayTile = (tileType) => !isWaterTileId(tileType);
                    const isManmadeLandTile = (tileType) => !isNaturalTile(tileType) && !isWaterTileId(tileType);
                    const UNDERLAY_DROP = 0.08;
                    const TERRAIN_EDGE_BLEND_CAP = 0.28;
                    const TERRAIN_EDGE_BLEND_FACTOR = 0.4;

                    const sampleTerrainVertexHeight = (cornerX, cornerY) => {
                        const tx0 = Math.floor(cornerX);
                        const ty0 = Math.floor(cornerY);
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
                        for (let i = 0; i < sampleTiles.length; i++) {
                            const sample = sampleTiles[i];
                            if (sample.x < 0 || sample.y < 0 || sample.x >= MAP_SIZE || sample.y >= MAP_SIZE) continue;
                            if (isPierVisualCoverageTile(activePierConfig, sample.x, sample.y, 0)) continue;
                            const tileType = getVisualTileId(logicalMap[0][sample.y][sample.x], sample.x, sample.y, 0);
                            if (isRenderableTerrainTile(tileType)) {
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
                            return Math.min(landHeight, waterHeight + 0.012);
                        }
                        if (count > 0 && manmadeCount > 0) {
                            const naturalHeight = sum / count;
                            const manmadeHeight = manmadeSum / manmadeCount;
                            const edgeDelta = THREE.MathUtils.clamp(
                                manmadeHeight - naturalHeight,
                                -TERRAIN_EDGE_BLEND_CAP,
                                TERRAIN_EDGE_BLEND_CAP
                            );
                            return naturalHeight + (edgeDelta * TERRAIN_EDGE_BLEND_FACTOR);
                        }
                        return count > 0 ? (sum / count) : 0;
                    };

                    const sampleUnderlayVertexHeight = (cornerX, cornerY) => {
                        const tx0 = Math.floor(cornerX);
                        const ty0 = Math.floor(cornerY);
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
                        if (count <= 0) return -UNDERLAY_DROP;
                        return (sum / count) - UNDERLAY_DROP;
                    };

                    const underlayGeo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, CHUNK_SIZE, CHUNK_SIZE);
                    underlayGeo.rotateX(-Math.PI / 2);
                    const underlayPositions = underlayGeo.attributes.position;
                    for (let vy = 0; vy <= CHUNK_SIZE; vy++) {
                        for (let vx = 0; vx <= CHUNK_SIZE; vx++) {
                            const idx = (vy * (CHUNK_SIZE + 1)) + vx;
                            const cornerX = startX - 0.5 + vx;
                            const cornerY = startY - 0.5 + vy;
                            const h = sampleUnderlayVertexHeight(cornerX, cornerY);
                            underlayPositions.setY(idx, h);
                        }
                    }
                    underlayPositions.needsUpdate = true;

                    const baseUnderlayIndices = underlayGeo.index ? Array.from(underlayGeo.index.array) : [];
                    const underlayIndices = [];
                    for (let tileY = 0; tileY < CHUNK_SIZE; tileY++) {
                        for (let tileX = 0; tileX < CHUNK_SIZE; tileX++) {
                            const worldTileX = startX + tileX;
                            const worldTileY = startY + tileY;
                            const tile = getVisualTileId(logicalMap[0][worldTileY][worldTileX], worldTileX, worldTileY, 0);
                            if (!isRenderableUnderlayTile(tile)) continue;
                            if (isPierVisualCoverageTile(activePierConfig, worldTileX, worldTileY, 0)) continue;
                            const cellIndexOffset = ((tileY * CHUNK_SIZE) + tileX) * 6;
                            for (let i = 0; i < 6; i++) {
                                underlayIndices.push(baseUnderlayIndices[cellIndexOffset + i]);
                            }
                        }
                    }
                    underlayGeo.setIndex(underlayIndices);
                    underlayGeo.computeVertexNormals();
                    if (underlayIndices.length > 0) {
                        const underlayMesh = new THREE.Mesh(underlayGeo, sharedMaterials.terrainUnderlay);
                        underlayMesh.position.set(startX + CHUNK_SIZE / 2 - 0.5, 0, startY + CHUNK_SIZE / 2 - 0.5);
                        underlayMesh.receiveShadow = false;
                        underlayMesh.castShadow = false;
                        underlayMesh.renderOrder = -1;
                        underlayMesh.userData = { type: 'GROUND', z: 0, underlay: true };
                        planeGroup.add(underlayMesh);
                        environmentMeshes.push(underlayMesh);
                    }

                    const terrainGeo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, CHUNK_SIZE, CHUNK_SIZE);
                    terrainGeo.rotateX(-Math.PI / 2);

                    const positions = terrainGeo.attributes.position;
                    for (let vy = 0; vy <= CHUNK_SIZE; vy++) {
                        for (let vx = 0; vx <= CHUNK_SIZE; vx++) {
                            const idx = (vy * (CHUNK_SIZE + 1)) + vx;
                            const cornerX = startX - 0.5 + vx;
                            const cornerY = startY - 0.5 + vy;
                            const h = sampleTerrainVertexHeight(cornerX, cornerY);
                            positions.setY(idx, h);
                        }
                    }
                    positions.needsUpdate = true;
                    const baseTerrainIndices = terrainGeo.index ? Array.from(terrainGeo.index.array) : [];
                    const grassTerrainIndices = [];
                    const dirtTerrainIndices = [];
                    for (let tileY = 0; tileY < CHUNK_SIZE; tileY++) {
                        for (let tileX = 0; tileX < CHUNK_SIZE; tileX++) {
                            const worldTileX = startX + tileX;
                            const worldTileY = startY + tileY;
                            const tile = getVisualTileId(logicalMap[0][worldTileY][worldTileX], worldTileX, worldTileY, 0);
                            if (!isRenderableTerrainTile(tile)) continue;
                            if (isPierVisualCoverageTile(activePierConfig, worldTileX, worldTileY, 0)) continue;
                            const cellIndexOffset = ((tileY * CHUNK_SIZE) + tileX) * 6;
                            const destination = (tile === TileId.DIRT || tile === TileId.ROCK) ? dirtTerrainIndices : grassTerrainIndices;
                            for (let i = 0; i < 6; i++) {
                                destination.push(baseTerrainIndices[cellIndexOffset + i]);
                            }
                        }
                    }
                    const filteredTerrainIndices = grassTerrainIndices.concat(dirtTerrainIndices);
                    terrainGeo.setIndex(filteredTerrainIndices);
                    terrainGeo.computeVertexNormals();

                    if (filteredTerrainIndices.length > 0) {
                        // Add low-frequency tinting and slope darkening so terrain reads less tiled.
                        const normals = terrainGeo.attributes.normal;
                        const vertexColors = new Float32Array((CHUNK_SIZE + 1) * (CHUNK_SIZE + 1) * 3);
                        for (let vy = 0; vy <= CHUNK_SIZE; vy++) {
                            for (let vx = 0; vx <= CHUNK_SIZE; vx++) {
                                const idx = (vy * (CHUNK_SIZE + 1)) + vx;
                                const worldX = startX - 0.5 + vx;
                                const worldY = startY - 0.5 + vy;
                                const macro = sampleFractalNoise2D(worldX * 0.12, worldY * 0.12, 29.71, 3, 2.0, 0.55);
                                const tint = sampleFractalNoise2D((worldX + 64) * 0.28, (worldY - 48) * 0.28, 83.17, 2, 2.0, 0.5);
                                const normalY = normals ? normals.getY(idx) : 1;
                                const slope = 1 - THREE.MathUtils.clamp(normalY, 0, 1);
                                const shade = THREE.MathUtils.clamp(0.85 + ((macro - 0.5) * 0.24) - (slope * 0.18), 0.62, 1.05);
                                const hueShift = (tint - 0.5) * 0.12;
                                const colorIndex = idx * 3;
                                vertexColors[colorIndex] = THREE.MathUtils.clamp(shade * (0.95 - (hueShift * 0.72)), 0, 1);
                                vertexColors[colorIndex + 1] = THREE.MathUtils.clamp(shade * (1.02 + (hueShift * 0.25)), 0, 1);
                                vertexColors[colorIndex + 2] = THREE.MathUtils.clamp(shade * (0.89 - (hueShift * 0.62)), 0, 1);
                            }
                        }
                        terrainGeo.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3));

                        let terrainMaterial = sharedMaterials.grassTile;
                        if (grassTerrainIndices.length > 0 && dirtTerrainIndices.length > 0) {
                            terrainGeo.clearGroups();
                            terrainGeo.addGroup(0, grassTerrainIndices.length, 0);
                            terrainGeo.addGroup(grassTerrainIndices.length, dirtTerrainIndices.length, 1);
                            terrainMaterial = [sharedMaterials.grassTile, sharedMaterials.dirtTile];
                        } else if (dirtTerrainIndices.length > 0) {
                            terrainMaterial = sharedMaterials.dirtTile;
                        }

                        const terrainMesh = new THREE.Mesh(terrainGeo, terrainMaterial);
                        terrainMesh.position.set(startX + CHUNK_SIZE / 2 - 0.5, 0, startY + CHUNK_SIZE / 2 - 0.5);
                        terrainMesh.receiveShadow = true;
                        terrainMesh.castShadow = false;
                        terrainMesh.userData = { type: 'GROUND', z: 0 };
                        planeGroup.add(terrainMesh);
                        environmentMeshes.push(terrainMesh);
                    }
                }

                let tCount = 0, wCount = 0, cCount = 0;
                const rockVisualCounts = Object.create(null);
                for (let y = startY; y < endY; y++) {
                    for (let x = startX; x < endX; x++) {
                        let tile = getVisualTileId(logicalMap[z][y][x], x, y, z);
                        if (isTreeTileId(tile)) tCount++;
                        else if (tile === TileId.ROCK) {
                            const rockNode = getRockNodeAt(x, y, z);
                            const visualId = getRockVisualIdForNode(rockNode, !!(rockNode && rockNode.depletedUntilTick > currentTick));
                            rockVisualCounts[visualId] = (rockVisualCounts[visualId] || 0) + 1;
                        }
                        else if (tile === TileId.WALL) wCount++;
                        else if (tile === TileId.TOWER) cCount++;
                    }
                }

                let tData = { treeMap: [], iTrunk: null, iBranch: null, iBranch2: null, iBranch3: null, iDrape1: null, iDrape2: null, iDrape3: null, iDrape4: null, iDrape5: null, iDrape6: null, iDrape7: null, iDrape8: null, iLeaf1: null, iLeaf2: null, iLeaf3: null, iLeaf4: null };
                if (tCount > 0) {
                    tData.iTrunk = new THREE.InstancedMesh(sharedGeometries.treeTrunk, sharedMaterials.trunk, tCount);
                    tData.iBranch = new THREE.InstancedMesh(sharedGeometries.treeBranch, sharedMaterials.trunk, tCount);
                    tData.iBranch2 = new THREE.InstancedMesh(sharedGeometries.treeBranch2, sharedMaterials.trunk, tCount);
                    tData.iBranch3 = new THREE.InstancedMesh(sharedGeometries.treeBranch3, sharedMaterials.trunk, tCount);
                    tData.iDrape1 = new THREE.InstancedMesh(sharedGeometries.willowDrape1, sharedMaterials.leaves, tCount);
                    tData.iDrape2 = new THREE.InstancedMesh(sharedGeometries.willowDrape2, sharedMaterials.leaves, tCount);
                    tData.iDrape3 = new THREE.InstancedMesh(sharedGeometries.willowDrape3, sharedMaterials.leaves, tCount);
                    tData.iDrape4 = new THREE.InstancedMesh(sharedGeometries.willowDrape4, sharedMaterials.leaves, tCount);
                    tData.iDrape5 = new THREE.InstancedMesh(sharedGeometries.willowDrape5, sharedMaterials.leaves, tCount);
                    tData.iDrape6 = new THREE.InstancedMesh(sharedGeometries.willowDrape6, sharedMaterials.leaves, tCount);
                    tData.iDrape7 = new THREE.InstancedMesh(sharedGeometries.willowDrape7, sharedMaterials.leaves, tCount);
                    tData.iDrape8 = new THREE.InstancedMesh(sharedGeometries.willowDrape8, sharedMaterials.leaves, tCount);
                    tData.iLeaf1 = new THREE.InstancedMesh(sharedGeometries.leaf1, sharedMaterials.leaves, tCount);
                    tData.iLeaf2 = new THREE.InstancedMesh(sharedGeometries.leaf2, sharedMaterials.leaves, tCount);
                    tData.iLeaf3 = new THREE.InstancedMesh(sharedGeometries.leaf3, sharedMaterials.leaves, tCount);
                    tData.iLeaf4 = new THREE.InstancedMesh(sharedGeometries.leaf4, sharedMaterials.leaves, tCount);
                    [tData.iTrunk, tData.iBranch, tData.iBranch2, tData.iBranch3, tData.iDrape1, tData.iDrape2, tData.iDrape3, tData.iDrape4, tData.iDrape5, tData.iDrape6, tData.iDrape7, tData.iDrape8, tData.iLeaf1, tData.iLeaf2, tData.iLeaf3, tData.iLeaf4].forEach(mesh => {
                        mesh.castShadow = true; mesh.matrixAutoUpdate = false;
                        mesh.userData = { instanceMap: tData.treeMap };
                        planeGroup.add(mesh); environmentMeshes.push(mesh);
                    });
                }
                let rData = createRockRenderData();
                for (let i = 0; i < ROCK_VISUAL_ORDER.length; i++) {
                    const visualId = ROCK_VISUAL_ORDER[i];
                    const rockCount = rockVisualCounts[visualId] || 0;
                    if (rockCount <= 0) continue;
                    const profile = getRockVisualProfile(visualId);
                    const geometry = sharedGeometries[profile.geometryKey] || sharedGeometries.rockCopper;
                    const material = sharedMaterials[profile.materialKey] || sharedMaterials.rockCopper;
                    const mesh = new THREE.InstancedMesh(geometry, material, rockCount);
                    mesh.castShadow = false;
                    mesh.matrixAutoUpdate = false;
                    mesh.userData = { instanceMap: rData.rockMapByVisualId[visualId] };
                    rData.rockMeshByVisualId[visualId] = mesh;
                    planeGroup.add(mesh);
                    environmentMeshes.push(mesh);
                }

                let castleData = { wallMap: [], iWall: null, towerMap: [], iTower: null };
                if (wCount > 0) {
                    castleData.iWall = new THREE.InstancedMesh(sharedGeometries.castleWall, sharedMaterials.castleStone, wCount);
                    castleData.iWall.castShadow = true; castleData.iWall.receiveShadow = true; castleData.iWall.matrixAutoUpdate = false;
                    castleData.iWall.userData = { instanceMap: castleData.wallMap };
                    planeGroup.add(castleData.iWall); environmentMeshes.push(castleData.iWall);
                }
                if (cCount > 0) {
                    castleData.iTower = new THREE.InstancedMesh(sharedGeometries.castleTower, sharedMaterials.castleStone, cCount);
                    castleData.iTower.castShadow = true; castleData.iTower.receiveShadow = true; castleData.iTower.matrixAutoUpdate = false;
                    castleData.iTower.userData = { instanceMap: castleData.towerMap };
                    planeGroup.add(castleData.iTower); environmentMeshes.push(castleData.iTower);
                }

                const dummyTransform = new THREE.Object3D();
                let tIdx = 0, wIdx = 0, cIdx = 0;
                const rockVisualIndices = Object.create(null);
                const chunkWaterBuilders = Object.create(null);
                appendChunkWaterTilesToBuilders(chunkWaterBuilders, waterRenderBodies, z, Z_OFFSET, startX, startY, endX, endY);
                const sampleGroundTileCenterHeight = (tileX, tileY, layerZ) => {
                    if (!heightMap[layerZ] || !heightMap[layerZ][tileY]) return 0;
                    if (layerZ !== 0 || tileX <= 0 || tileY <= 0 || tileX >= MAP_SIZE - 1 || tileY >= MAP_SIZE - 1) {
                        return heightMap[layerZ][tileY][tileX];
                    }

                    let weightedSum = 0;
                    let weightedWeight = 0;
                    for (let oy = -1; oy <= 1; oy++) {
                        for (let ox = -1; ox <= 1; ox++) {
                            const nx = tileX + ox;
                            const ny = tileY + oy;
                            if (nx < 0 || ny < 0 || nx >= MAP_SIZE || ny >= MAP_SIZE) continue;
                            if (isPierVisualCoverageTile(activePierConfig, nx, ny, 0)) continue;
                            const tileType = getVisualTileId(logicalMap[0][ny][nx], nx, ny, 0);
                            if (isWaterTileId(tileType)) continue;
                            const weight = (ox === 0 && oy === 0) ? 0.25 : ((ox === 0 || oy === 0) ? 0.125 : 0.0625);
                            weightedSum += heightMap[0][ny][nx] * weight;
                            weightedWeight += weight;
                        }
                    }

                    if (weightedWeight > 0) return weightedSum / weightedWeight;
                    return heightMap[layerZ][tileY][tileX];
                };

                for (let y = startY; y < endY; y++) {
                    for (let x = startX; x < endX; x++) {
                        const tile = getVisualTileId(logicalMap[z][y][x], x, y, z);
                        const h = heightMap[z][y][x] + Z_OFFSET; 

                        if (isTreeTileId(tile)) {
                            const treeNode = getTreeNodeAt(x, y, z);
                            const treeNodeId = treeNode && treeNode.nodeId ? treeNode.nodeId : 'normal_tree';
                            dummyTransform.position.set(x, h, y);
                            dummyTransform.rotation.set(0, Math.random() * Math.PI * 2, 0);
                            setTreeVisualState(tData, tIdx, {
                                nodeId: treeNodeId,
                                position: dummyTransform.position.clone(),
                                quaternion: dummyTransform.quaternion.clone(),
                                isStump: tile === TileId.STUMP
                            });

                            tData.treeMap[tIdx] = { type: 'TREE', gridX: x, gridY: y, z: z, nodeId: treeNodeId };
                            tIdx++;
                        } else if (tile === TileId.ROCK) {
                            const rockNode = getRockNodeAt(x, y, z);
                            const depleted = !!(rockNode && rockNode.depletedUntilTick > currentTick);
                            const rockGroundY = sampleGroundTileCenterHeight(x, y, z) + Z_OFFSET - 0.01;
                            const oreType = depleted ? 'depleted' : ((rockNode && rockNode.oreType) ? rockNode.oreType : 'copper');
                            const visualId = getRockVisualIdForNode(rockNode, depleted);
                            const profile = getRockVisualProfile(visualId);
                            const instanceScale = Array.isArray(profile.instanceScale) ? profile.instanceScale : [1, 1, 1];
                            const mesh = rData.rockMeshByVisualId[visualId];
                            const map = rData.rockMapByVisualId[visualId];
                            const rockIndex = rockVisualIndices[visualId] || 0;
                            dummyTransform.position.set(x, rockGroundY, y);
                            dummyTransform.rotation.set(0, hash2D(x, y, 702.17) * Math.PI * 2, 0);
                            dummyTransform.scale.set(instanceScale[0] || 1, instanceScale[1] || 1, instanceScale[2] || 1);
                            dummyTransform.updateMatrix();

                            if (mesh && map) {
                                mesh.setMatrixAt(rockIndex, dummyTransform.matrix);
                                map[rockIndex] = {
                                    type: 'ROCK',
                                    gridX: x,
                                    gridY: y,
                                    z: z,
                                    oreType: oreType,
                                    name: depleted ? 'Depleted rock' : getRockDisplayName(oreType)
                                };
                                rockVisualIndices[visualId] = rockIndex + 1;
                            }
                        } else if (tile === TileId.FENCE) {
                            const fenceGroup = createFenceVisualGroup(x, y, z, Z_OFFSET, heightMap[z][y][x]);
                            planeGroup.add(fenceGroup);
                        } else if (tile === TileId.WALL) { // Wall (Anchored to base)
                            const isCastleTile = (tx, ty) => {
                                if (tx < 0 || ty < 0 || tx >= MAP_SIZE || ty >= MAP_SIZE) return false;
                                const neighborTile = logicalMap[z][ty][tx];
                                return neighborTile === TileId.WALL || neighborTile === TileId.TOWER;
                            };
                            const hasNorth = isCastleTile(x, y - 1);
                            const hasSouth = isCastleTile(x, y + 1);
                            const hasWest = isCastleTile(x - 1, y);
                            const hasEast = isCastleTile(x + 1, y);
                            const linkNS = hasNorth || hasSouth;
                            const linkEW = hasWest || hasEast;
                            const wallThin = 0.78;

                            dummyTransform.position.set(x, Z_OFFSET, y);
                            dummyTransform.rotation.set(0, 0, 0);
                            if (linkNS && !linkEW) dummyTransform.scale.set(wallThin, 1, 1);
                            else if (linkEW && !linkNS) dummyTransform.scale.set(1, 1, wallThin);
                            else if (!linkNS && !linkEW) dummyTransform.scale.set(0.88, 1, 0.88);
                            else dummyTransform.scale.set(1, 1, 1);
                            dummyTransform.updateMatrix();
                            castleData.iWall.setMatrixAt(wIdx, dummyTransform.matrix);
                            castleData.wallMap[wIdx] = { type: 'WALL', gridX: x, gridY: y, z: z }; wIdx++;
                        } else if (tile === TileId.TOWER) { // Tower (Anchored to base)
                            dummyTransform.position.set(x, Z_OFFSET, y);
                            dummyTransform.rotation.set(0, 0, 0); dummyTransform.scale.set(1, 1, 1); dummyTransform.updateMatrix();
                            castleData.iTower.setMatrixAt(cIdx, dummyTransform.matrix);
                            castleData.towerMap[cIdx] = { type: 'TOWER', gridX: x, gridY: y, z: z }; cIdx++;
                        } else if (tile === TileId.SHOP_COUNTER) { // Shop Counter
                            const counterGroup = new THREE.Group(); counterGroup.position.set(x, h, y);
                            
                            let rotY = 0;
                            if ((y > 0 && logicalMap[z][y-1][x] === TileId.SHOP_COUNTER) || (y < MAP_SIZE - 1 && logicalMap[z][y+1][x] === TileId.SHOP_COUNTER)) {
                                rotY = Math.PI / 2;
                            }
                            counterGroup.rotation.y = rotY;

                            const counter = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.8), sharedMaterials.boothWood); 
                            counter.position.y = 0.5; counter.castShadow = true; counter.receiveShadow = true; 
                            
                            const glass = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.7), sharedMaterials.shopCounterGlass);
                            glass.position.y = 1.025; glass.receiveShadow = true;
                            
                            counterGroup.add(counter, glass);
                            counterGroup.children.forEach(c => { c.userData = { type: 'SHOP_COUNTER', gridX: x, gridY: y, z: z }; environmentMeshes.push(c); });
                            planeGroup.add(counterGroup);
                            
                            // Explicitly build floor beneath Counter
                            const floorHeight = heightMap[z][y][x];
                            const floorMesh = createTopAnchoredFloorMesh(sharedMaterials.floor7, x, y, Z_OFFSET, floorHeight, z);
                            planeGroup.add(floorMesh); environmentMeshes.push(floorMesh);
                        } else if (tile === TileId.FLOOR_STONE || tile === TileId.FLOOR_WOOD || tile === TileId.FLOOR_BRICK || tile === TileId.BANK_BOOTH || logicalMap[z][y][x] === TileId.SOLID_NPC) { // Floors
                            const floorTile = logicalMap[z][y][x] === TileId.SOLID_NPC ? tile : logicalMap[z][y][x];
                            if (floorTile === TileId.GRASS || floorTile === TileId.DIRT || floorTile === TileId.SHORE) {
                                continue;
                            }
                            if (floorTile === TileId.FLOOR_WOOD && isPierDeckTile(getActivePierConfig(), x, y, z)) {
                                continue;
                            }
                            let floorMat = sharedMaterials.floor7; // default to stone
                            if (floorTile === TileId.FLOOR_WOOD) floorMat = sharedMaterials.floor6;
                            if (floorTile === TileId.FLOOR_BRICK) floorMat = sharedMaterials.floor8;
                            
                            const floorHeight = heightMap[z][y][x];
                            const floorMesh = createTopAnchoredFloorMesh(floorMat, x, y, Z_OFFSET, floorHeight, z);
                            planeGroup.add(floorMesh); environmentMeshes.push(floorMesh);
                        } else if (tile === TileId.STAIRS_UP || tile === TileId.STAIRS_DOWN) { // Stairs Up/Down
                            const isUp = tile === TileId.STAIRS_UP;
                            const floorHeight = heightMap[z][y][x] || 0.5;
                            const stairMesh = new THREE.Mesh(new THREE.BoxGeometry(1, floorHeight, 1), isUp ? sharedMaterials.stairsUp : sharedMaterials.stairsDown);
                            stairMesh.position.set(x, Z_OFFSET + (floorHeight / 2), y);
                            stairMesh.castShadow = true; stairMesh.receiveShadow = true;
                            stairMesh.userData = { type: isUp ? 'STAIRS_UP' : 'STAIRS_DOWN', gridX: x, gridY: y, z: z };
                            planeGroup.add(stairMesh); environmentMeshes.push(stairMesh);
                        } else if (tile === TileId.STAIRS_RAMP) { // Seamless Walkable Stairs
                            const stairGroup = new THREE.Group();
                            stairGroup.position.set(x, Z_OFFSET, y);
                            
                            // Auto-orient stairs to face the uphill slope
                            let rotY = 0; const ch = heightMap[z][y][x];
                            if (x > 0 && heightMap[z][y][x-1] > ch) rotY = Math.PI / 2; // Ascend West
                            else if (x < MAP_SIZE-1 && heightMap[z][y][x+1] > ch) rotY = -Math.PI / 2; // Ascend East
                            else if (y < MAP_SIZE-1 && heightMap[z][y+1][x] > ch) rotY = Math.PI; // Ascend South
                            stairGroup.rotation.y = rotY;

                            const steps = 3;
                            const stepDepth = 1.0 / steps;
                            const stepHeight = 0.5 / steps; 
                            const baseHeight = heightMap[z][y][x] - 0.25; 
                            
                            if (baseHeight > 0) {
                                const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(1, baseHeight, 1), sharedMaterials.floor7);
                                baseMesh.position.set(0, baseHeight / 2, 0);
                                baseMesh.receiveShadow = true; baseMesh.castShadow = true;
                                baseMesh.userData = { type: 'GROUND', gridX: x, gridY: y, z: z };
                                stairGroup.add(baseMesh);
                                environmentMeshes.push(baseMesh);
                            }

                            for (let i = 0; i < steps; i++) {
                                const currentStepOffset = stepHeight * (i + 1); 
                                const currentHeight = baseHeight + currentStepOffset;
                                const zCenter = 0.5 - stepDepth * (i + 0.5); 
                                const yCenter = currentHeight / 2;
                                const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(1, currentHeight, stepDepth), sharedMaterials.floor7);
                                stepMesh.position.set(0, yCenter, zCenter);
                                stepMesh.receiveShadow = true; stepMesh.castShadow = true;
                                stepMesh.userData = { type: 'GROUND', gridX: x, gridY: y, z: z };
                                stairGroup.add(stepMesh);
                                environmentMeshes.push(stepMesh);
                            }
                            planeGroup.add(stairGroup);
                        }
                    }
                }
                addPierVisualsToChunk(planeGroup, z, Z_OFFSET, startX, startY, endX, endY);
                flushChunkWaterBuilders(planeGroup, chunkWaterBuilders);
                
                if (tCount > 0) markTreeVisualsDirty(tData);
                for (let i = 0; i < ROCK_VISUAL_ORDER.length; i++) {
                    const visualId = ROCK_VISUAL_ORDER[i];
                    const mesh = rData.rockMeshByVisualId[visualId];
                    if (mesh) mesh.instanceMatrix.needsUpdate = true;
                }
                if (wCount > 0) castleData.iWall.instanceMatrix.needsUpdate = true;
                if (cCount > 0) castleData.iTower.instanceMatrix.needsUpdate = true;

                planeGroup.userData.trees = tData;
                planeGroup.userData.rocks = rData;

                bankBoothsToRender.forEach(b => {
                    if (b.x >= startX && b.x < endX && b.y >= startY && b.y < endY && b.z === z) {
                        const boothGroup = new THREE.Group(); boothGroup.position.set(b.x, heightMap[z][b.y][b.x] + Z_OFFSET, b.y);
                        const counter = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.1, 0.6), sharedMaterials.boothWood); counter.position.set(0, 0.55, 0); counter.castShadow = true; counter.receiveShadow = true; boothGroup.add(counter);
                        const pL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.0, 0.6), sharedMaterials.boothWood); pL.position.set(-0.425, 1.6, 0); pL.castShadow = true; pL.receiveShadow = true; boothGroup.add(pL);
                        const pR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.0, 0.6), sharedMaterials.boothWood); pR.position.set(0.425, 1.6, 0); pR.castShadow = true; pR.receiveShadow = true; boothGroup.add(pR);
                        const sign = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.4, 0.6), sharedMaterials.boothWood); sign.position.set(0, 2.3, 0); sign.castShadow = true; sign.receiveShadow = true; boothGroup.add(sign);
                        const bankTextPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.2), sharedMaterials.bankTexPlaneMat); bankTextPlane.position.set(0, 2.3, 0.31); boothGroup.add(bankTextPlane);
                        
                        boothGroup.children.forEach(c => { c.userData = { type: 'BANK_BOOTH', gridX: b.x, gridY: b.y, z: z }; environmentMeshes.push(c); });
                        planeGroup.add(boothGroup);
                    }
                });

                furnacesToRender.forEach((furnace) => {
                    if (furnace.x >= startX && furnace.x < endX && furnace.y >= startY && furnace.y < endY && furnace.z === z) {
                        const furnaceGroup = new THREE.Group();
                        const fw = Number.isFinite(furnace.footprintW) ? furnace.footprintW : 3;
                        const fd = Number.isFinite(furnace.footprintD) ? furnace.footprintD : 2;
                        const yaw = Number.isFinite(furnace.facingYaw) ? furnace.facingYaw : 0;
                        const quarterTurn = Math.abs(Math.round(Math.sin(yaw))) === 1 && Math.abs(Math.round(Math.cos(yaw))) === 0;
                        const bodyLocalW = quarterTurn ? fd : fw;
                        const bodyLocalD = quarterTurn ? fw : fd;
                        furnaceGroup.position.set(furnace.x + ((fw - 1) * 0.5), heightMap[z][furnace.y][furnace.x] + Z_OFFSET, furnace.y + ((fd - 1) * 0.5));
                        if (Number.isFinite(furnace.facingYaw)) furnaceGroup.rotation.y = furnace.facingYaw;
                        const base = new THREE.Mesh(new THREE.BoxGeometry(bodyLocalW, 1.6, bodyLocalD), sharedMaterials.floor8);
                        base.position.set(0, 0.8, 0);
                        base.castShadow = true;
                        base.receiveShadow = true;
                        const mouth = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.6, 0.3), sharedMaterials.floor7);
                        mouth.position.set(0, 0.95, (bodyLocalD * 0.5) - 0.02);
                        const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.2, 0.45), sharedMaterials.floor7);
                        chimney.position.set(0.55, 1.9, -((bodyLocalD * 0.5) - 0.45));
                        // Tooltip/click hitbox should match rectangular furnace body only (exclude chimney).
                        const hitbox = new THREE.Mesh(new THREE.BoxGeometry(bodyLocalW, 1.6, bodyLocalD), sharedMaterials.hiddenHitbox);
                        hitbox.position.set(0, 0.8, 0);
                        hitbox.userData = { type: 'FURNACE', gridX: furnace.x, gridY: furnace.y, z: z };
                        furnaceGroup.add(base, mouth, chimney, hitbox);
                        base.userData = { type: 'FURNACE', gridX: furnace.x, gridY: furnace.y, z: z };
                        mouth.userData = { type: 'FURNACE', gridX: furnace.x, gridY: furnace.y, z: z };
                        chimney.userData = { type: 'FURNACE', gridX: furnace.x, gridY: furnace.y, z: z };
                        environmentMeshes.push(base, mouth, chimney, hitbox);
                        planeGroup.add(furnaceGroup);
                    }
                });

                anvilsToRender.forEach((anvil) => {
                    if (anvil.x >= startX && anvil.x < endX && anvil.y >= startY && anvil.y < endY && anvil.z === z) {
                        const anvilGroup = new THREE.Group();
                        anvilGroup.position.set(anvil.x, heightMap[z][anvil.y][anvil.x] + Z_OFFSET, anvil.y);
                        if (Number.isFinite(anvil.facingYaw)) anvilGroup.rotation.y = anvil.facingYaw;
                        const stand = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.55, 0.35), sharedMaterials.boothWood);
                        stand.position.set(0, 0.275, 0);
                        const top = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.18, 0.45), sharedMaterials.floor7);
                        top.position.set(0, 0.62, 0);
                        const horn = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.2), sharedMaterials.floor7);
                        horn.position.set(0.5, 0.6, 0);
                        // Keep click volume aligned with the physical anvil silhouette.
                        const hitbox = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.8, 1.3), sharedMaterials.hiddenHitbox);
                        hitbox.position.set(0, 0.4, 0);
                        hitbox.userData = { type: 'ANVIL', gridX: anvil.x, gridY: anvil.y, z: z };
                        anvilGroup.add(stand, top, horn, hitbox);
                        stand.userData = { type: 'ANVIL', gridX: anvil.x, gridY: anvil.y, z: z };
                        top.userData = { type: 'ANVIL', gridX: anvil.x, gridY: anvil.y, z: z };
                        horn.userData = { type: 'ANVIL', gridX: anvil.x, gridY: anvil.y, z: z };
                        environmentMeshes.push(stand, top, horn, hitbox);
                        planeGroup.add(anvilGroup);
                    }
                });

                directionalSignsToRender.forEach(ds => {
                    if (ds.x >= startX && ds.x < endX && ds.y >= startY && ds.y < endY && ds.z === z) {
                        const signGroup = new THREE.Group();
                        const baseH = heightMap[z][ds.y][ds.x] + Z_OFFSET;
                        signGroup.position.set(ds.x, baseH, ds.y);

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
                        planeGroup.add(signGroup);
                    }
                });

                altarCandidatesToRender.forEach(ac => {
                    if (ac.x >= startX && ac.x < endX && ac.y >= startY && ac.y < endY && ac.z === z) {
                        const altarGroup = new THREE.Group();
                        const baseY = heightMap[z][ac.y][ac.x] + Z_OFFSET;
                        altarGroup.position.set(ac.x, baseY, ac.y);

                        // Upscale target: ~4x footprint area (2x width/depth) and ~2x height.
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

                        if (ac.variant === 1) {
                            const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.35 * footprintScale, 0.42 * footprintScale, 0.2 * heightScale, 10), coalMat);
                            bowl.position.y = 0.52 * heightScale;
                            const flame1 = new THREE.Mesh(new THREE.ConeGeometry(0.12 * footprintScale, 0.36 * heightScale, 10), emberMat);
                            flame1.position.y = 0.82 * heightScale;
                            const flame2 = new THREE.Mesh(new THREE.ConeGeometry(0.08 * footprintScale, 0.24 * heightScale, 10), coreMat);
                            flame2.position.y = 0.9 * heightScale;
                            altarGroup.add(bowl, flame1, flame2);
                        } else if (ac.variant === 2) {
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
                        } else if (ac.variant === 3) {
                            const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.36 * footprintScale, 0.44 * footprintScale, 0.22 * heightScale, 10), coalMat);
                            bowl.position.y = 0.52 * heightScale;
                            const spireBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * footprintScale, 0.12 * footprintScale, 0.28 * heightScale, 8), coreMat);
                            spireBase.position.y = 0.78 * heightScale;
                            const spireTop = new THREE.Mesh(new THREE.ConeGeometry(0.1 * footprintScale, 0.34 * heightScale, 8), emberMat);
                            spireTop.position.y = 1.05 * heightScale;
                            altarGroup.add(bowl, spireBase, spireTop);
                        } else {
                            // Mk IV remix: Mk II top with two ember rings (base + taper point).
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

                                                altarGroup.children.forEach((child) => {
                            child.userData = { type: 'ALTAR_CANDIDATE', gridX: ac.x, gridY: ac.y, z: z, name: ac.label, variant: ac.variant };
                            environmentMeshes.push(child);
                        });

                        // Keep visuals unchanged; click/hover footprint is 3x3.
                        const altarHitbox = new THREE.Mesh(
                            new THREE.BoxGeometry(3, 2.6, 3),
                            sharedMaterials.hiddenHitbox
                        );
                        altarHitbox.position.set(0, 1.3, 0);
                        altarHitbox.userData = { type: 'ALTAR_CANDIDATE', gridX: ac.x, gridY: ac.y, z: z, name: ac.label, variant: ac.variant };
                        altarGroup.add(altarHitbox);
                        environmentMeshes.push(altarHitbox);

                        planeGroup.add(altarGroup);
                    }
                });
                doorsToRender.forEach(d => {
                    if (d.x >= startX && d.x < endX && d.y >= startY && d.y < endY && d.z === z) {
                        let doorGroup = null;
                        if (d.isWoodenGate) {
                            doorGroup = createWoodenGateVisualGroup(d, Z_OFFSET, heightMap[z][d.y][d.x]);
                        } else {
                            doorGroup = new THREE.Group();
                            // Place hinge exactly on the requested edge of the tile
                            doorGroup.position.set(d.x + (d.hingeOffsetX || 0), Z_OFFSET + heightMap[z][d.y][d.x], d.y + (d.hingeOffsetY || 0));
                            doorGroup.rotation.y = d.currentRotation;

                            // Dynamically adjust mesh dimensions depending on orientation
                            const dw = d.isEW ? d.width : d.thickness;
                            const dd = d.isEW ? d.thickness : d.width;
                            const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(dw, 2.0, dd), sharedMaterials.boothWood);

                            // Offset the mesh from the hinge so it perfectly centers back over the tile
                            const meshOffsetX = d.hingeOffsetX ? -d.hingeOffsetX : 0;
                            const meshOffsetZ = d.hingeOffsetY ? -d.hingeOffsetY : 0;
                            doorMesh.position.set(meshOffsetX, 1.0, meshOffsetZ);
                            doorMesh.castShadow = true; doorMesh.receiveShadow = true;

                            // Slightly thicker hitbox for easier clicking
                            const hw = d.isEW ? d.width : 0.6;
                            const hd = d.isEW ? 0.6 : d.width;
                            const hitbox = new THREE.Mesh(new THREE.BoxGeometry(hw, 2, hd), sharedMaterials.hiddenHitbox);
                            hitbox.position.set(meshOffsetX, 1.0, meshOffsetZ);

                            doorGroup.add(doorMesh, hitbox);
                        }
                        d.meshGroup = doorGroup; // Keep track for animation updates
                        
                        doorGroup.children.forEach(c => {
                            c.userData = { type: 'DOOR', gridX: d.x, gridY: d.y, z: z, doorObj: d };
                            environmentMeshes.push(c);
                        });
                        planeGroup.add(doorGroup);
                        
                        // Explicitly build floor beneath Door so it's walkable when open
                        const floorHeight = heightMap[z][d.y][d.x];
                        if (floorHeight > 0) {
                            const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(1, floorHeight, 1), sharedMaterials.floor7);
                            floorMesh.position.set(d.x, Z_OFFSET + (floorHeight / 2), d.y);
                            floorMesh.receiveShadow = true; floorMesh.castShadow = true; 
                            floorMesh.userData = { type: 'GROUND', gridX: d.x, gridY: d.y, z: z };
                            planeGroup.add(floorMesh); environmentMeshes.push(floorMesh);
                        }
                    }
                });

                const activeRoofs = Array.isArray(sharedMaterials.activeRoofLandmarks) ? sharedMaterials.activeRoofLandmarks : [];
                activeRoofs.forEach((roof) => {
                    if (!chunkIntersectsRoof(roof, startX, startY, endX, endY, z)) return;
                    planeGroup.add(createRoofVisualGroup(roof, Z_OFFSET));
                });

                const getNpcAppearanceId = (npc) => {
                    if (!npc || typeof npc !== 'object') return null;
                    const explicitAppearanceId = typeof npc.appearanceId === 'string' ? npc.appearanceId.trim().toLowerCase() : '';
                    if (explicitAppearanceId) return explicitAppearanceId;
                    const merchantId = typeof npc.merchantId === 'string' ? npc.merchantId.trim().toLowerCase() : '';
                    const name = typeof npc.name === 'string' ? npc.name.trim().toLowerCase() : '';
                    if (merchantId === 'tanner_rusk' || name === 'tanner rusk') return 'tanner_rusk';
                    return null;
                };

                npcsToRender.forEach(npc => {
                    if (npc.x >= startX && npc.x < endX && npc.y >= startY && npc.y < endY && npc.z === z) {
                        const appearanceId = getNpcAppearanceId(npc);
                        let dummy = null;
                        if (appearanceId && typeof window.createNpcHumanoidRigFromPreset === 'function') {
                            dummy = window.createNpcHumanoidRigFromPreset(appearanceId);
                        }
                        if (!dummy) dummy = createHumanoidModel(npc.type);
                        const visualX = Number.isFinite(npc.visualX) ? npc.visualX : npc.x;
                        const visualY = Number.isFinite(npc.visualY) ? npc.visualY : npc.y;
                        const visualBaseY = Number.isFinite(npc.visualBaseY) ? npc.visualBaseY : (heightMap[z][npc.y][npc.x] + Z_OFFSET);
                        dummy.position.set(visualX, visualBaseY, visualY);
                        dummy.rotation.y = Number.isFinite(npc.visualFacingYaw)
                            ? npc.visualFacingYaw
                            : resolveTownNpcDefaultFacingYaw(npc);
                        
                        // Add interactive hitbox to NPCs
                        const hitbox = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), sharedMaterials.hiddenHitbox);
                        hitbox.position.y = 1.0;
                        const npcUid = {
                            name: npc.name,
                            action: npc.action || (npc.name === 'Shopkeeper' ? 'Trade' : (npc.name === 'Banker' ? 'Talk-to' : 'Talk-to'))
                        };
                        npcUid.gridX = npc.x;
                        npcUid.gridY = npc.y;
                        if (npc.spawnId) npcUid.spawnId = npc.spawnId;
                        if (npc.merchantId) npcUid.merchantId = npc.merchantId;
                        if (appearanceId) npcUid.appearanceId = appearanceId;
                        if (typeof npc.dialogueId === 'string' && npc.dialogueId.trim()) npcUid.dialogueId = npc.dialogueId.trim();
                        if (npc.travelToWorldId) npcUid.travelToWorldId = npc.travelToWorldId;
                        if (npc.travelSpawn) npcUid.travelSpawn = Object.assign({}, npc.travelSpawn);
                        hitbox.userData = { type: 'NPC', gridX: npc.x, gridY: npc.y, z: z, name: npc.name, uid: npcUid };
                        dummy.add(hitbox);
                        environmentMeshes.push(hitbox);

                        planeGroup.add(dummy);
                        npc.mesh = dummy;
                        npc.hitbox = hitbox;
                        npc.renderChunkKey = `${cx},${cy}`;
                        renderedNpcActors.push(npc);
                    }
                });

                group.add(planeGroup);
            }
            
            scene.add(group);
            const key = `${cx},${cy}`;
            const interactionMeshes = environmentMeshes.slice(environmentMeshStartIndex);
            loadedChunkNpcActors.set(key, renderedNpcActors);
            if (!registerInteraction && environmentMeshes.length > environmentMeshStartIndex) {
                environmentMeshes.length = environmentMeshStartIndex;
            }
            getWorldChunkSceneRuntime().registerNearChunk(key, group, {
                interactionMeshes,
                registerInteraction
            });
        }

        function setLoadedChunkPlaneVisibility(maxVisiblePlane) {
            getWorldChunkSceneRuntime().setLoadedChunkPlaneVisibility(maxVisiblePlane, buildChunkSceneRuntimeContext());
        }

        function unloadChunkGroup(key, group) {
            if (group) {
                scene.remove(group);
                activeRoofVisuals = activeRoofVisuals.filter((roofGroup) => {
                    let parent = roofGroup;
                    while (parent) {
                        if (parent === group) return false;
                        parent = parent.parent;
                    }
                    return true;
                });
                environmentMeshes = environmentMeshes.filter(m => {
                    let parent = m;
                    while (parent) {
                        if (parent === group) return false;
                        parent = parent.parent;
                    }
                    return true;
                });
            }
            const chunkNpcActors = loadedChunkNpcActors.get(key) || [];
            for (let i = 0; i < chunkNpcActors.length; i++) {
                clearTownNpcRenderBindings(chunkNpcActors[i]);
            }
            loadedChunkNpcActors.delete(key);
        }

        function unloadChunk(key) {
            getWorldChunkSceneRuntime().unregisterNearChunk(key, buildChunkSceneRuntimeContext());
        }

        function processPendingNearChunkBuilds(maxBuilds = 1) {
            return getWorldChunkSceneRuntime().processPendingNearChunkBuilds({
                maxBuilds,
                context: buildChunkSceneRuntimeContext()
            });
        }

        function manageChunks(forceRefresh = false) {
            getWorldChunkSceneRuntime().manageChunks(Object.assign(
                { forceRefresh: !!forceRefresh },
                buildChunkSceneRuntimeContext()
            ));
        }

        function reportChunkPerformanceSample(fps, nowMs = performance.now()) {
            getWorldChunkSceneRuntime().reportChunkPerformanceSample(fps, nowMs, buildChunkSceneRuntimeContext());
        }

        function markChunkPolicyDirty() {
            getWorldChunkSceneRuntime().markChunkPolicyDirty();
        }

        function build3DEnvironment() {
            initSharedAssets();
            clearPendingNearChunkBuilds();
            ensureFarChunkBackdropBuilt();
            markChunkPolicyDirty();
        }

        function reloadActiveWorldScene() {
            const lifecycleRuntime = window.WorldSceneLifecycleRuntime || null;
            if (!lifecycleRuntime || typeof lifecycleRuntime.reloadActiveWorldScene !== 'function') {
                throw new Error('WorldSceneLifecycleRuntime is unavailable.');
            }
            lifecycleRuntime.reloadActiveWorldScene({
                scene,
                clickMarkers,
                activeHitsplats,
                environmentMeshes,
                hasScene: () => !!scene,
                hasPlayerRig: () => !!playerRig,
                initLogicalMap,
                resetChunkSceneState: () => {
                    getWorldChunkSceneRuntime().resetForWorldReload(buildChunkSceneRuntimeContext());
                },
                clearCombatEnemyRenderers: () => {
                    if (typeof window.clearCombatEnemyRenderers === 'function') window.clearCombatEnemyRenderers();
                },
                syncPlayerRigToState: () => {
                    if (!playerRig) return;
                    playerRig.position.set(
                        playerState.x,
                        heightMap[playerState.z][playerState.y][playerState.x] + (playerState.z * 3.0),
                        playerState.y
                    );
                    if (Number.isFinite(playerState.targetRotation)) {
                        playerRig.rotation.y = playerState.targetRotation;
                    }
                },
                syncFreeCamTargetToState: () => {
                    if (!isFreeCam) return;
                    freeCamTarget.set(
                        playerState.x,
                        heightMap[playerState.z][playerState.y][playerState.x] + (playerState.z * 3.0) + 1.0,
                        playerState.y
                    );
                },
                updateMinimapCanvas,
                manageChunks,
                updateWorldMapPanel
            });
        }

        function getWorldMapHudRuntime() {
            const runtime = window.WorldMapHudRuntime || null;
            if (!runtime) throw new Error('WorldMapHudRuntime is unavailable.');
            return runtime;
        }

        function getRenderRuntime() {
            return window.RenderRuntime || null;
        }

        function getInputControllerRuntime() {
            return window.InputControllerRuntime || null;
        }

        function resolveRenderWorldId() {
            const worldSceneStateRuntime = window.WorldSceneStateRuntime || null;
            if (worldSceneStateRuntime && typeof worldSceneStateRuntime.resolveRenderWorldId === 'function') {
                return worldSceneStateRuntime.resolveRenderWorldId();
            }
            return 'main_overworld';
        }

        function buildMapHudRuntimeContext() {
            return {
                document,
                mapSize: MAP_SIZE,
                chunkSize: CHUNK_SIZE,
                tileIds: TileId,
                getRenderRuntime,
                getInputControllerRuntime,
                resolveRenderWorldId,
                getTile: (x, y, z) => (logicalMap[z] && logicalMap[z][y]) ? logicalMap[z][y][x] : TileId.OBSTACLE,
                getVisualTileId,
                isTreeTileId,
                isDoorTileId,
                isWalkableTile: (x, y, z) => !!(logicalMap[z] && logicalMap[z][y] && isWalkableTileId(logicalMap[z][y][x])),
                queueWalk: (x, y) => queueAction('WALK', x, y, null),
                getSelectedUseItem,
                clearSelectedUse,
                getPlayerMapPosition: () => {
                    const playerX = (playerRig && playerRig.position && Number.isFinite(playerRig.position.x)) ? playerRig.position.x : playerState.x;
                    const playerY = (playerRig && playerRig.position && Number.isFinite(playerRig.position.z)) ? playerRig.position.z : playerState.y;
                    const facingYaw = (playerRig && Number.isFinite(playerRig.rotation && playerRig.rotation.y))
                        ? playerRig.rotation.y
                        : (Number.isFinite(playerState.targetRotation) ? playerState.targetRotation : 0);
                    return { x: playerX, y: playerY, z: playerState.z, facingYaw };
                },
                getClickMarkers: () => Array.isArray(clickMarkers)
                    ? clickMarkers.map((marker) => ({
                        x: marker && marker.mesh && marker.mesh.position ? marker.mesh.position.x : 0,
                        y: marker && marker.mesh && marker.mesh.position ? marker.mesh.position.z : 0,
                        z: Math.round((((marker && marker.mesh && marker.mesh.position ? marker.mesh.position.y : 0) || 0) / 3.0)),
                        visualY: marker && marker.mesh && marker.mesh.position ? marker.mesh.position.y : 0
                    }))
                    : [],
                getGroundItems: () => Array.isArray(groundItems)
                    ? groundItems.map((item) => ({
                        x: item.x,
                        y: item.y,
                        z: item.z,
                        uid: item.uid
                    }))
                    : [],
            };
        }

        function updateMinimapCanvas() {
            return getWorldMapHudRuntime().updateMinimapCanvas(buildMapHudRuntimeContext());
        }

        function buildHudRenderSnapshot() {
            return getWorldMapHudRuntime().buildHudRenderSnapshot(buildMapHudRuntimeContext());
        }

        function initWorldMapPanel() {
            getWorldMapHudRuntime().initWorldMapPanel(buildMapHudRuntimeContext());
        }

        function updateWorldMapPanel(forceCenterOnPlayer = false) {
            getWorldMapHudRuntime().updateWorldMapPanel(forceCenterOnPlayer, buildMapHudRuntimeContext());
        }

        function initMinimap() {
            getWorldMapHudRuntime().initMinimap(buildMapHudRuntimeContext());
        }

        function updateMinimap(frameNowMs = performance.now(), forceRender = false) {
            getWorldMapHudRuntime().updateMinimap(frameNowMs, forceRender, buildMapHudRuntimeContext());
        }
        function resolveTreeRespawnTicks(gridX, gridY, z) {
            const fallbackTicks = 18;
            if (!window.SkillSpecRegistry || typeof SkillSpecRegistry.getNodeTable !== 'function') return fallbackTicks;
            const nodeTable = SkillSpecRegistry.getNodeTable('woodcutting');
            if (!nodeTable) return fallbackTicks;
            const treeNode = getTreeNodeAt(gridX, gridY, z);
            const nodeId = treeNode && treeNode.nodeId ? treeNode.nodeId : 'normal_tree';
            const nodeSpec = nodeTable[nodeId] || nodeTable.normal_tree;
            if (!nodeSpec || !Number.isFinite(nodeSpec.respawnTicks)) return fallbackTicks;
            return Math.max(1, Math.floor(nodeSpec.respawnTicks));
        }

        function chopDownTree(gridX, gridY, z) {
            let cx = Math.floor(gridX / CHUNK_SIZE);
            let cy = Math.floor(gridY / CHUNK_SIZE);
            let group = getWorldChunkSceneRuntime().getNearChunkGroup(`${cx},${cy}`);
            const respawnTicks = resolveTreeRespawnTicks(gridX, gridY, z);

            if (group) {
                let planeGroup = group.children.find(c => c.userData.z === z);
                if (planeGroup && planeGroup.userData.trees && planeGroup.userData.trees.iTrunk) {
                    let tData = planeGroup.userData.trees;
                    let tIdx = tData.treeMap.findIndex(t => t && t.gridX === gridX && t.gridY === gridY);
                    if (tIdx !== -1) {
                        const treeEntry = tData.treeMap[tIdx] || {};
                        const treeNode = getTreeNodeAt(gridX, gridY, z);
                        const treeNodeId = treeEntry.nodeId || (treeNode && treeNode.nodeId ? treeNode.nodeId : 'normal_tree');
                        const mat = new THREE.Matrix4();
                        const quat = new THREE.Quaternion();
                        tData.iTrunk.getMatrixAt(tIdx, mat);
                        mat.decompose(new THREE.Vector3(), quat, new THREE.Vector3());
                        const basePosition = new THREE.Vector3(gridX, heightMap[z][gridY][gridX] + (z * 3.0), gridY);
                        setTreeVisualState(tData, tIdx, { nodeId: treeNodeId, position: basePosition, quaternion: quat, isStump: true });
                        markTreeVisualsDirty(tData);
                    }
                }
            }
            logicalMap[z][gridY][gridX] = 4;
            respawningTrees.push({ x: gridX, y: gridY, z: z, respawnTick: currentTick + respawnTicks });
        }

        function respawnTree(gridX, gridY, z) {
            let cx = Math.floor(gridX / CHUNK_SIZE);
            let cy = Math.floor(gridY / CHUNK_SIZE);
            let group = getWorldChunkSceneRuntime().getNearChunkGroup(`${cx},${cy}`);

            if (group) {
                let planeGroup = group.children.find(c => c.userData.z === z);
                if (planeGroup && planeGroup.userData.trees && planeGroup.userData.trees.iTrunk) {
                    let tData = planeGroup.userData.trees;
                    let tIdx = tData.treeMap.findIndex(t => t && t.gridX === gridX && t.gridY === gridY);
                    if (tIdx !== -1) {
                        const treeEntry = tData.treeMap[tIdx] || {};
                        const treeNode = getTreeNodeAt(gridX, gridY, z);
                        const treeNodeId = treeEntry.nodeId || (treeNode && treeNode.nodeId ? treeNode.nodeId : 'normal_tree');
                        const mat = new THREE.Matrix4();
                        const quat = new THREE.Quaternion();
                        tData.iTrunk.getMatrixAt(tIdx, mat);
                        mat.decompose(new THREE.Vector3(), quat, new THREE.Vector3());
                        const basePosition = new THREE.Vector3(gridX, heightMap[z][gridY][gridX] + (z * 3.0), gridY);
                        setTreeVisualState(tData, tIdx, { nodeId: treeNodeId, position: basePosition, quaternion: quat, isStump: false });
                        markTreeVisualsDirty(tData);
                    }
                }
            }
            logicalMap[z][gridY][gridX] = 1;
        }
        window.initLogicalMap = initLogicalMap;
        window.initThreeJS = initThreeJS;
        window.build3DEnvironment = build3DEnvironment;
        window.spawnMiningPoseReferences = spawnMiningPoseReferences;
        window.initMinimap = initMinimap;
        window.initUIPreview = initUIPreview;
        window.manageChunks = manageChunks;
        window.processPendingNearChunkBuilds = processPendingNearChunkBuilds;
        window.reloadActiveWorldScene = reloadActiveWorldScene;
        window.tickFireLifecycle = tickFireLifecycle;
        window.updateMainDirectionalShadowFocus = updateMainDirectionalShadowFocus;
        window.updateSkyRuntime = updateSkyRuntime;
        window.updateFires = updateFires;
        window.updateGroundItems = updateGroundItems;
        window.reportChunkPerformanceSample = reportChunkPerformanceSample;
        window.markChunkPolicyDirty = markChunkPolicyDirty;
        window.updateMiningPoseReferences = updateMiningPoseReferences;
        window.updateWorldNpcRuntime = updateWorldNpcRuntime;
        window.updateMinimap = updateMinimap;
        window.setLoadedChunkPlaneVisibility = setLoadedChunkPlaneVisibility;
        window.listQaNpcTargets = listQaNpcTargets;
        window.updateWorldMapPanel = updateWorldMapPanel;
        window.updateStats = updateStats;
        window.refreshSkillUi = refreshSkillUi;
