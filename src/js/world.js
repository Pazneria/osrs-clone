// --- Rest of ThreeJS & Engine Init ---

        function initSharedAssets() {
            sharedGeometries.ground = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE);
            sharedGeometries.ground.rotateX(-Math.PI / 2);
            sharedGeometries.tileColumn = new THREE.BoxGeometry(1, 1, 1);
            sharedGeometries.waterPlane = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
            sharedGeometries.shoreHalfNS = new THREE.PlaneGeometry(1, 0.5).rotateX(-Math.PI / 2);
            sharedGeometries.shoreHalfEW = new THREE.PlaneGeometry(0.5, 1).rotateX(-Math.PI / 2);
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
            sharedGeometries.rock = new THREE.IcosahedronGeometry(0.44, 0).scale(1.0, 0.72, 0.9).translate(0, 0.32, 0);
            sharedGeometries.rockCopper = new THREE.IcosahedronGeometry(0.48, 0).scale(1.08, 0.8, 0.95).translate(0, 0.34, 0);
            sharedGeometries.rockTin = new THREE.DodecahedronGeometry(0.46, 0).scale(1.0, 0.74, 0.92).translate(0, 0.32, 0);
            sharedGeometries.rockDepleted = new THREE.IcosahedronGeometry(0.42, 0).scale(0.95, 0.66, 0.9).translate(0, 0.28, 0);
            sharedGeometries.rockRuneEssence = new THREE.IcosahedronGeometry(0.9, 1).scale(1.35, 0.95, 1.35).translate(0, 0.78, 0);

            // Castle Geometries (Taller and anchors are centered for grounded effect)
            sharedGeometries.castleWall = new THREE.BoxGeometry(1, 3, 1).translate(0, 1.5, 0);
            sharedGeometries.castleTower = new THREE.BoxGeometry(1.22, 4, 1.22).translate(0, 2.0, 0);

            sharedMaterials.ground = new THREE.MeshLambertMaterial({ color: 0x2d4a22 });
            sharedMaterials.grassTile = new THREE.MeshLambertMaterial({ color: 0x355f2c });
            sharedMaterials.shoreTile = new THREE.MeshLambertMaterial({ color: 0x7f6a3c });
            sharedMaterials.waterShallow = new THREE.MeshLambertMaterial({ color: 0x2b6fa3, transparent: true, opacity: 0.78 });
            sharedMaterials.waterDeep = new THREE.MeshLambertMaterial({ color: 0x174d7a, transparent: true, opacity: 0.85 });
            sharedMaterials.fishingSpot = new THREE.MeshLambertMaterial({ color: 0x7fd8ff });
            sharedMaterials.rockCopper = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
            sharedMaterials.rockTin = new THREE.MeshLambertMaterial({ color: 0x9aa5ae, flatShading: true });
            sharedMaterials.rockDepleted = new THREE.MeshLambertMaterial({ color: 0x5a5f68, flatShading: true });
            sharedMaterials.rockRuneEssence = new THREE.MeshLambertMaterial({ color: 0x7e848c, flatShading: true });
            sharedMaterials.trunk = new THREE.MeshLambertMaterial({ color: 0x6a452a, flatShading: true });
            sharedMaterials.leaves = new THREE.MeshLambertMaterial({ color: 0x2f7f3a, flatShading: true });
            sharedMaterials.rock = new THREE.MeshLambertMaterial({ color: 0x80858f, flatShading: true });
            sharedMaterials.boothWood = new THREE.MeshLambertMaterial({color: 0x4a3018});
            
            // Castle & Floor Materials
            sharedMaterials.castleStone = new THREE.MeshLambertMaterial({ color: 0x888a85 }); 
            sharedMaterials.floor6 = new THREE.MeshLambertMaterial({ color: 0x8b5a2b }); // Wood
            sharedMaterials.floor7 = new THREE.MeshLambertMaterial({ color: 0x777777 }); // Stone
            sharedMaterials.floor8 = new THREE.MeshLambertMaterial({ color: 0x8b0000 }); // Brick
            
            // Stairs Materials
            sharedMaterials.stairsUp = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
            sharedMaterials.stairsDown = new THREE.MeshLambertMaterial({ color: 0x444444 });

            // Lightweight procedural textures to avoid flat-color terrain/water.
            const grassCanvas = document.createElement('canvas');
            grassCanvas.width = 64; grassCanvas.height = 64;
            const gCtx = grassCanvas.getContext('2d');
            gCtx.fillStyle = '#4f7a3d';
            gCtx.fillRect(0, 0, 64, 64);
            for (let i = 0; i < 900; i++) {
                const shade = 68 + Math.floor(Math.random() * 55);
                gCtx.fillStyle = `rgb(${shade - 24}, ${shade}, ${shade - 32})`;
                gCtx.fillRect(Math.floor(Math.random() * 64), Math.floor(Math.random() * 64), 1, 1);
            }
            const grassTex = new THREE.CanvasTexture(grassCanvas);
            grassTex.wrapS = THREE.RepeatWrapping;
            grassTex.wrapT = THREE.RepeatWrapping;
            grassTex.repeat.set(18, 18);
            sharedMaterials.ground.map = grassTex;
            sharedMaterials.grassTile.map = grassTex;

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
            const barkTex = new THREE.CanvasTexture(barkCanvas);
            barkTex.wrapS = THREE.RepeatWrapping;
            barkTex.wrapT = THREE.RepeatWrapping;
            barkTex.repeat.set(1, 3.5);
            sharedMaterials.trunk.color.setHex(0xffffff);
            sharedMaterials.trunk.map = barkTex;

            const leafCanvas = document.createElement('canvas');
            leafCanvas.width = 64; leafCanvas.height = 64;
            const lCtx = leafCanvas.getContext('2d');
            lCtx.fillStyle = '#4a6f2a';
            lCtx.fillRect(0, 0, 64, 64);
            for (let i = 0; i < 900; i++) {
                const tone = 80 + Math.floor(Math.random() * 95);
                lCtx.fillStyle = 'rgba(' + Math.max(42, tone - 45) + ', ' + tone + ', ' + Math.max(28, tone - 58) + ', ' + (0.4 + Math.random() * 0.45) + ')';
                lCtx.fillRect(Math.floor(Math.random() * 64), Math.floor(Math.random() * 64), 1, 1);
            }
            for (let i = 0; i < 120; i++) {
                lCtx.fillStyle = 'rgba(155, 128, 64, ' + (0.06 + Math.random() * 0.1) + ')';
                lCtx.fillRect(Math.floor(Math.random() * 64), Math.floor(Math.random() * 64), 2, 2);
            }
            const leafTex = new THREE.CanvasTexture(leafCanvas);
            leafTex.wrapS = THREE.RepeatWrapping;
            leafTex.wrapT = THREE.RepeatWrapping;
            leafTex.repeat.set(1.8, 1.8);
            sharedMaterials.leaves.color.setHex(0xffffff);
            sharedMaterials.leaves.map = leafTex;

            const makeWaterTexture = (topColor, bottomColor, foamAlpha) => {
                const waterCanvas = document.createElement('canvas');
                waterCanvas.width = 64; waterCanvas.height = 64;
                const wCtx = waterCanvas.getContext('2d');
                const grad = wCtx.createLinearGradient(0, 0, 0, 64);
                grad.addColorStop(0, topColor);
                grad.addColorStop(1, bottomColor);
                wCtx.fillStyle = grad;
                wCtx.fillRect(0, 0, 64, 64);
                for (let y = 0; y < 64; y += 4) {
                    wCtx.fillStyle = `rgba(196, 235, 255, ${foamAlpha + Math.random() * foamAlpha})`;
                    wCtx.fillRect(0, y, 64, 1);
                }
                for (let i = 0; i < 140; i++) {
                    wCtx.fillStyle = `rgba(20, 55, 82, ${0.08 + Math.random() * 0.08})`;
                    wCtx.fillRect(Math.floor(Math.random() * 64), Math.floor(Math.random() * 64), 2, 1);
                }
                const tex = new THREE.CanvasTexture(waterCanvas);
                tex.wrapS = THREE.RepeatWrapping;
                tex.wrapT = THREE.RepeatWrapping;
                return tex;
            };

            const waterShallowTex = makeWaterTexture('#3c8fc0', '#236792', 0.07);
            waterShallowTex.repeat.set(2.8, 2.8);
            const waterDeepTex = makeWaterTexture('#255f8f', '#123c61', 0.05);
            waterDeepTex.repeat.set(2.4, 2.4);
            sharedMaterials.waterShallow.map = waterShallowTex;
            sharedMaterials.waterDeep.map = waterDeepTex;

            const shoreCanvas = document.createElement('canvas');
            shoreCanvas.width = 64; shoreCanvas.height = 64;
            const sCtx = shoreCanvas.getContext('2d');
            sCtx.fillStyle = '#c9b07f';
            sCtx.fillRect(0, 0, 64, 64);
            for (let i = 0; i < 700; i++) {
                const tint = 170 + Math.floor(Math.random() * 55);
                sCtx.fillStyle = `rgb(${tint}, ${tint - 18}, ${tint - 48})`;
                sCtx.fillRect(Math.floor(Math.random() * 64), Math.floor(Math.random() * 64), 1, 1);
            }
            const shoreTex = new THREE.CanvasTexture(shoreCanvas);
            shoreTex.wrapS = THREE.RepeatWrapping;
            shoreTex.wrapT = THREE.RepeatWrapping;
            shoreTex.repeat.set(4, 4);
            sharedMaterials.shoreTile.color.setHex(0xffffff);
            sharedMaterials.shoreTile.map = shoreTex;

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

                const tex = new THREE.CanvasTexture(texCanvas);
                tex.wrapS = THREE.RepeatWrapping;
                tex.wrapT = THREE.RepeatWrapping;
                tex.magFilter = THREE.NearestFilter;
                tex.minFilter = THREE.NearestFilter;
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

                const tex = new THREE.CanvasTexture(canvas);
                tex.wrapS = THREE.RepeatWrapping;
                tex.wrapT = THREE.RepeatWrapping;
                tex.magFilter = THREE.NearestFilter;
                tex.minFilter = THREE.NearestFilter;
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

            const castleStoneTex = makeBrickTexture(0x8d6f60, 0x5b4d45, 16);
            castleStoneTex.repeat.set(1.55, 1.55);
            sharedMaterials.castleStone.color.setHex(0xffffff);
            sharedMaterials.castleStone.map = castleStoneTex;
            sharedMaterials.castleStone.flatShading = true;
            sharedMaterials.castleStone.needsUpdate = true;

            const floorWoodTex = makeWoodGrainTexture(0x86603a);
            floorWoodTex.repeat.set(1.8, 1.8);
            sharedMaterials.floor6.color.setHex(0xffffff);
            sharedMaterials.floor6.map = floorWoodTex;

            const floorStoneTex = makeNoiseTexture(0x6f7680, -34, 24, 560, 56, 9);
            floorStoneTex.repeat.set(1.75, 1.75);
            sharedMaterials.floor7.color.setHex(0xffffff);
            sharedMaterials.floor7.map = floorStoneTex;

            const floorBrickTex = makeNoiseTexture(0x7d2a1c, -20, 16, 740, 54, 7);
            floorBrickTex.repeat.set(2.0, 2.0);
            sharedMaterials.floor8.color.setHex(0xffffff);
            sharedMaterials.floor8.map = floorBrickTex;

            const boothWoodTex = makeWoodGrainTexture(0x5d3c22);
            boothWoodTex.repeat.set(1.7, 1.7);
            sharedMaterials.boothWood.color.setHex(0xffffff);
            sharedMaterials.boothWood.map = boothWoodTex;

            const stairUpTex = makeNoiseTexture(0xb8b4a6, -22, 14, 520, 42, 7);
            stairUpTex.repeat.set(1.6, 1.6);
            sharedMaterials.stairsUp.color.setHex(0xffffff);
            sharedMaterials.stairsUp.map = stairUpTex;

            const stairDownTex = makeNoiseTexture(0x43474f, -16, 12, 520, 42, 7);
            stairDownTex.repeat.set(1.6, 1.6);
            sharedMaterials.stairsDown.color.setHex(0xffffff);
            sharedMaterials.stairsDown.map = stairDownTex;
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
            sharedMaterials.directionSignMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(dirCanvas) });


            const bankCanvas = document.createElement('canvas'); bankCanvas.width = 256; bankCanvas.height = 64;
            const bankCtx = bankCanvas.getContext('2d'); bankCtx.fillStyle = '#000000'; bankCtx.fillRect(0,0,256,64); bankCtx.fillStyle = '#c8aa6e'; bankCtx.font = 'bold 48px monospace'; bankCtx.textAlign = 'center'; bankCtx.textBaseline = 'middle'; bankCtx.fillText('BANK', 128, 36);
            sharedMaterials.bankTexPlaneMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(bankCanvas) });
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

        function resetMiningReferencePose(rig) {
            if (!rig) return;
            rig.leftArm.position.set(PLAYER_SHOULDER_PIVOT.x, PLAYER_SHOULDER_PIVOT.y, PLAYER_SHOULDER_PIVOT.z);
            rig.rightArm.position.set(-PLAYER_SHOULDER_PIVOT.x, PLAYER_SHOULDER_PIVOT.y, PLAYER_SHOULDER_PIVOT.z);
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
                const torsoHalfWidth = 0.54 * 0.5;
                const upperArmHalfWidth = (0.20 * 1.02) * 0.5;
                const shoulderClearance = 0.008;
                const minShoulderAbsX = torsoHalfWidth + upperArmHalfWidth + shoulderClearance;
                const maxInward = Math.max(0, PLAYER_SHOULDER_PIVOT.x - minShoulderAbsX);
                const requestedInward = opts.shoulderInward || 0.0;
                const shoulderInward = Math.min(Math.max(0, requestedInward), maxInward);
                const shoulderBack = opts.shoulderBack || 0.07;
                const torsoTopY = 1.05 + (0.68 * 0.5);
                const shoulderLiftDefault = torsoTopY - PLAYER_SHOULDER_PIVOT.y;
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
                    PLAYER_SHOULDER_PIVOT.x - shoulderInward,
                    PLAYER_SHOULDER_PIVOT.y + shoulderLift,
                    PLAYER_SHOULDER_PIVOT.z - shoulderBack
                );
                rig.rightArm.position.set(
                    -PLAYER_SHOULDER_PIVOT.x + shoulderInward,
                    PLAYER_SHOULDER_PIVOT.y + shoulderLift,
                    PLAYER_SHOULDER_PIVOT.z - shoulderBack
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

            const texture = new THREE.CanvasTexture(canvas);
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
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

        function clearMiningPoseReferences() {
            for (let i = 0; i < miningPoseReferences.length; i++) {
                const refData = miningPoseReferences[i];
                const refRig = refData && refData.rig ? refData.rig : refData;
                if (refRig && refRig.parent) refRig.parent.remove(refRig);
            }
            miningPoseReferences = [];
        }

        function getTileHeightSafe(x, y, z = 0) {
            if (!heightMap || !heightMap[z] || !heightMap[z][y]) return 0;
            const h = heightMap[z][y][x];
            return Number.isFinite(h) ? h : 0;
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
            scene.background = new THREE.Color(0x87CEEB);
            // Keep fog only at the far render horizon so nearby space stays clear.
            scene.fog = new THREE.Fog(0x87CEEB, 140, 240); 
            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 260);
            renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.shadowMap.enabled = false;
            renderer.shadowMap.type = THREE.BasicShadowMap;
            container.appendChild(renderer.domElement);
            scene.add(new THREE.AmbientLight(0xffffff, 0.6));
            const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
            dirLight.position.set(10, 40, 10);
            dirLight.castShadow = false;
            dirLight.shadow.mapSize.width = 256; dirLight.shadow.mapSize.height = 256;
            dirLight.shadow.camera.left = -50; dirLight.shadow.camera.right = 50; dirLight.shadow.camera.top = 50; dirLight.shadow.camera.bottom = -50;
            scene.add(dirLight);
            playerRig = createPlayerRigFromCurrentAppearance();
            scene.add(playerRig);
            raycaster = new THREE.Raycaster();
            mouse = new THREE.Vector2();
            window.addEventListener('resize', onWindowResize, false);
            renderer.domElement.addEventListener('mousedown', onPointerDown, false);
            window.addEventListener('mousemove', onPointerMove, false);
            window.addEventListener('mouseup', onPointerUp, false);
            renderer.domElement.addEventListener('wheel', onMouseWheel, { passive: false });
            renderer.domElement.addEventListener('contextmenu', onContextMenu, false);
            seedCookingTrainingFires();
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
            uiRenderer.domElement.style.margin = 'auto'; 
            container.appendChild(uiRenderer.domElement);
            uiScene.add(new THREE.AmbientLight(0xffffff, 0.8));
            const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
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

        function updateStats() {
            let totalAtk = baseStats.atk; let totalDef = baseStats.def; let totalStr = baseStats.str;
            Object.values(equipment).forEach(item => {
                if(item) { totalAtk += item.stats.atk; totalDef += item.stats.def; totalStr += item.stats.str; }
            });
            document.getElementById('stat-atk').innerText = totalAtk;
            document.getElementById('stat-def').innerText = totalDef;
            document.getElementById('stat-str').innerText = totalStr;
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
            ) || (
                playerState.action === 'COMBAT: DUMMY' && currentTick % 4 === 0
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

        function refreshSkillUi(skillName) {
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
                smithing: 'smith'
            };
            const key = keyBySkill[skillName];
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

        function attachFireVisualGroup(group, x, y, z, preferChunkParent = true) {
            if (preferChunkParent) {
                const cx = Math.floor(x / CHUNK_SIZE);
                const cy = Math.floor(y / CHUNK_SIZE);
                if (chunkGroups[`${cx},${cy}`]) {
                    const pGroup = chunkGroups[`${cx},${cy}`].children.find((pg) => pg.userData.z === z);
                    if (pGroup) {
                        pGroup.add(group);
                        return;
                    }
                }
            }
            scene.add(group);
        }

        function spawnFireAtTile(x, y, z, options = {}) {
            if (isFireOccupiedAt(x, y, z)) return false;
            if (!scene) return false;

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

        function lightFireAtCurrentTile() {
            const x = playerState.x;
            const y = playerState.y;
            const z = playerState.z;

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

        function tryStepAfterFire() {
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
                if (!WALKABLE_TILES.includes(logicalMap[z][ny][nx])) {
                    failureReasons.push('blocked_tile');
                    continue;
                }

                const nextH = heightMap[z][ny][nx];
                const tileIsRamp = logicalMap[z][playerState.y][playerState.x] === 15 || logicalMap[z][ny][nx] === 15;
                if (Math.abs(nextH - currentH) > 0.3 && !tileIsRamp) {
                    failureReasons.push('height_mismatch');
                    continue;
                }

                if (activeFires.some((f) => f.x === nx && f.y === ny && f.z === z)) {
                    failureReasons.push('fire_occupied');
                    continue;
                }

                playerState.prevX = playerState.x;
                playerState.prevY = playerState.y;
                playerState.x = nx;
                playerState.y = ny;
                playerState.path = [];

                return { stepped: true, direction: candidate.direction, x: nx, y: ny };
            }

            let reason = 'blocked_tile';
            if (failureReasons.includes('fire_occupied')) reason = 'fire_occupied';
            else if (failureReasons.includes('height_mismatch')) reason = 'height_mismatch';
            else if (failureReasons.includes('out_of_bounds')) reason = 'out_of_bounds';

            return { stepped: false, reason };
        }

                function startFiremaking() {
            if (!(window.SkillRuntime && typeof SkillRuntime.tryStartSkillById === 'function')) return false;
            return SkillRuntime.tryStartSkillById('firemaking', { skillId: 'firemaking' });
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

            if ((a === 'tinderbox' && b === 'logs') || (a === 'logs' && b === 'tinderbox')) {
                return startFiremaking();
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
        function useOwie() {
            const currentHitpoints = getCurrentHitpoints();
            if (currentHitpoints <= 1) {
                addChatMessage('Owie refuses to hurt you below 1 HP.', 'warn');
                return;
            }

            const damageDealt = applyHitpointDamage(1, 1);
            addChatMessage(`Owie! You take ${damageDealt} damage. (${playerState.currentHitpoints} HP)`, 'warn');
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

            const cooldownEndTick = Number.isFinite(playerState.eatingCooldownEndTick)
                ? Math.floor(playerState.eatingCooldownEndTick)
                : 0;
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
            renderInventory();
        }

        function handleItemAction(invIndex, actionName) {
            const invSlot = inventory[invIndex];
            if (!invSlot) return;
            const item = invSlot.itemData;
            if (actionName === 'Use') {
                if (item.id === 'owie') {
                    useOwie();
                    return;
                }
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

        const groundItemSpriteTextureCache = {};

        function getGroundItemSpriteTexture(path) {
            if (groundItemSpriteTextureCache[path]) return groundItemSpriteTextureCache[path];
            const texture = new THREE.TextureLoader().load(path);
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            texture.generateMipmaps = false;
            groundItemSpriteTextureCache[path] = texture;
            return texture;
        }

        function addGroundItemSprite(group, path, y = 0.2, scale = 0.5) {
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                map: getGroundItemSpriteTexture(path),
                transparent: true,
                alphaTest: 0.15,
                depthWrite: false
            }));
            sprite.position.set(0, y, 0);
            sprite.scale.set(scale, scale, scale);
            group.add(sprite);
            return sprite;
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
            if (itemData.id === 'iron_axe') {
                const handleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8); handleGeo.rotateX(Math.PI / 2);
                const handle = new THREE.Mesh(handleGeo, new THREE.MeshLambertMaterial({color: 0x5c4033}));
                const axeHead = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.25), new THREE.MeshLambertMaterial({color: 0x999999}));
                axeHead.position.set(0, -0.2, 0.3);
                group.add(handle, axeHead);
            } else if (itemData.id === 'logs') {
                // Render dropped logs from the generated toolkit icon so updates are visible in-world.
                const base = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.18, 0.18, 0.06, 12),
                    new THREE.MeshLambertMaterial({ color: 0x3d2a1c })
                );
                base.position.set(0, -0.05, 0);
                addGroundItemSprite(group, './assets/pixel/logs-pixel.png?v=20260305a', 0.2, 0.5);
                group.add(base);
            } else if (itemData.id === 'coins') {
                const coinGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 8);
                const coinMat = new THREE.MeshLambertMaterial({color: 0xffcc00});
                const coinMesh = new THREE.Mesh(coinGeo, coinMat); coinMesh.position.set(0, 0, 0);
                group.add(coinMesh);
            } else if (itemData.id === 'ashes') {
                const ashesPile = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.17, 0.22, 0.05, 10),
                    new THREE.MeshLambertMaterial({ color: 0x7a7a7a })
                );
                ashesPile.position.set(0, -0.03, 0);
                group.add(ashesPile);
            } else if (itemData.id === 'copper_ore' || itemData.id === 'tin_ore') {
                const oreColor = itemData.id === 'copper_ore' ? 0xb56b3a : 0xcfd6dd;
                const oreMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), new THREE.MeshLambertMaterial({color: 0x7c838c}));
                const vein1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.03), new THREE.MeshLambertMaterial({color: oreColor}));
                const vein2 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.04, 0.03), new THREE.MeshLambertMaterial({color: oreColor}));
                vein1.position.set(0.04, 0.03, 0.19);
                vein2.position.set(-0.05, -0.02, 0.18);
                group.add(oreMesh, vein1, vein2);
            } else {
                const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.3), new THREE.MeshLambertMaterial({color: 0x888888}));
                group.add(boxMesh);
            }
            const hitbox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshBasicMaterial({visible: false}));
            group.add(hitbox);
            const uid = Date.now() + Math.random();
            group.children.forEach(c => {
                c.userData = { type: 'GROUND_ITEM', itemData: itemData, uid: uid, gridX: x, gridY: y, z: z, name: amount > 1 ? `${itemData.name} (${amount})` : itemData.name };
                environmentMeshes.push(c);
            });
            let cx = Math.floor(x / CHUNK_SIZE); let cy = Math.floor(y / CHUNK_SIZE);
            if (chunkGroups[`${cx},${cy}`]) {
                let pGroup = chunkGroups[`${cx},${cy}`].children.find(pg => pg.userData.z === z);
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
            if (tile !== 1 && tile !== 4) return false;
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
            if (tile !== 1 && tile !== 4) return null;
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
                        if (tile === 1 || tile === 4) {
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
                trunkScale: [0.88, 1.72, 0.88],
                canopyScales: [[1.58, 1.24, 1.58], [1.38, 1.14, 1.36], [1.32, 1.1, 1.32], [1.18, 1.06, 1.18]],
                canopyYOffset: 0.58,
                canopyOffsets: [[0.0, 0.4, 0.0], [0.48, 0.32, 0.36], [-0.46, 0.3, -0.34], [0.04, 0.62, -0.08]],
                canopyYRotations: [0.0, 0.16, -0.18, 0.08],
                canopyJitter: 0.025,
                branchScale: [1.18, 1.08, 1.18],
                branchOffset: [-0.08, 0.28, 0.08],
                branchYaw: 0.46,
                branch2Scale: [1.12, 1.14, 1.12],
                branch2Offset: [0.04, 0.46, -0.12],
                branch2Yaw: -0.54,
                branch3Scale: [1.04, 1.18, 1.04],
                branch3Offset: [0.16, 0.58, 0.18],
                branch3Yaw: 0.22,
                drapeScales: [[1.02, 1.0, 1.02], [0.98, 0.96, 0.98], [1.0, 1.04, 1.0], [1.06, 1.1, 1.06], [0.94, 0.92, 0.94], [0.96, 0.94, 0.96], [1.0, 1.02, 1.0], [1.04, 1.06, 1.04]],
                drapeOffsets: [[0.06, 0.34, 0.02], [-0.06, 0.34, -0.02], [0.02, 0.3, 0.03], [-0.02, 0.3, -0.03], [0.0, 0.4, 0.05], [0.0, 0.4, -0.05], [-0.03, 0.28, 0.0], [0.03, 0.28, 0.0]],
                drapeYRotations: [0.32, -0.3, 0.46, -0.42, 0.18, -0.16, 0.62, -0.58],
                drapeJitter: 0.03,
                stumpScale: [1.02, 0.16, 1.02]
            },
            maple_tree: { trunkScale: [1.08, 1.52, 1.08], canopyScales: [[1.34, 1.16, 1.34], [1.24, 1.12, 1.24], [1.2, 1.1, 1.2], [1.12, 1.04, 1.12]], canopyYOffset: 0.18, canopyJitter: 0.04, branchScale: [0, 0, 0], stumpScale: [1.26, 0.2, 1.26] },
            yew_tree: { trunkScale: [1.32, 1.78, 1.32], canopyScales: [[1.06, 0.94, 1.06], [0.98, 0.9, 0.98], [0.94, 0.88, 0.94], [0.88, 0.84, 0.88]], canopyYOffset: 0.34, canopyJitter: 0.04, branchScale: [0, 0, 0], stumpScale: [1.38, 0.24, 1.38] }
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

        function rebuildRockNodes() {
            const rebuilt = {};
            for (let z = 0; z < PLANES; z++) {
                for (let y = 0; y < MAP_SIZE; y++) {
                    for (let x = 0; x < MAP_SIZE; x++) {
                        if (logicalMap[z][y][x] === 2) {
                            const key = rockNodeKey(x, y, z);
                            const prev = rockNodes[key];
                            const gateOverride = rockAreaGateOverrides && rockAreaGateOverrides[key] ? rockAreaGateOverrides[key] : null;
                            rebuilt[key] = {
                                oreType: prev && prev.oreType ? prev.oreType : oreTypeForTile(x, y, z),
                                depletedUntilTick: prev && prev.depletedUntilTick ? prev.depletedUntilTick : 0,
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
            if (logicalMap[z][y][x] !== 2) return null;
            const key = rockNodeKey(x, y, z);
            if (!rockNodes[key]) {
                const gateOverride = rockAreaGateOverrides && rockAreaGateOverrides[key] ? rockAreaGateOverrides[key] : null;
                rockNodes[key] = {
                    oreType: oreTypeForTile(x, y, z),
                    depletedUntilTick: 0,
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
            if (loadedChunks.has(key)) {
                unloadChunk(key);
                loadChunk(cx, cy);
                loadedChunks.add(key);
            }
        }

        function depleteRockNode(x, y, z = playerState.z, respawnTicks = 12) {
            const node = getRockNodeAt(x, y, z);
            if (!node) return;
            node.depletedUntilTick = currentTick + Math.max(1, respawnTicks);
            refreshChunkAtTile(x, y);
        }

        function tickRockNodes() {
            const chunksToRefresh = new Set();
            for (const [key, node] of Object.entries(rockNodes)) {
                if (!node || !node.depletedUntilTick) continue;
                if (currentTick < node.depletedUntilTick) continue;
                node.depletedUntilTick = 0;
                const parts = key.split(':');
                const xy = parts[1].split(',');
                const x = parseInt(xy[0], 10);
                const y = parseInt(xy[1], 10);
                chunksToRefresh.add(Math.floor(x / CHUNK_SIZE) + ',' + Math.floor(y / CHUNK_SIZE));
            }
            chunksToRefresh.forEach((chunkKey) => {
                if (!loadedChunks.has(chunkKey)) return;
                const parts = chunkKey.split(',');
                const cx = parseInt(parts[0], 10);
                const cy = parseInt(parts[1], 10);
                unloadChunk(chunkKey);
                loadChunk(cx, cy);
                loadedChunks.add(chunkKey);
            });
        }
        function initLogicalMap() {
            rockNodes = {};
            rockOreOverrides = {};
            rockAreaGateOverrides = {};
            treeNodes = {};
            // Re-initialize as 3D Arrays! [z][y][x]
            logicalMap = Array(PLANES).fill(0).map(() => Array(MAP_SIZE).fill(0).map(() => Array(MAP_SIZE).fill(0)));
            heightMap = Array(PLANES).fill(0).map(() => Array(MAP_SIZE).fill(0).map(() => Array(MAP_SIZE).fill(0)));
            
            // Only populate Ground Terrain on Z=0
            const forestCenters = [
                {x: 50, y: 50}, {x: 350, y: 50}, {x: 50, y: 350}, {x: 350, y: 350},
                {x: 200, y: 100}, {x: 100, y: 200}, {x: 300, y: 200}, {x: 200, y: 300},
                {x: 150, y: 150}, {x: 250, y: 250}
            ];
            const mineCenters = [
                {x: 30, y: 30}, {x: 370, y: 370}, {x: 30, y: 370}, {x: 370, y: 30},
                {x: 200, y: 30}, {x: 30, y: 200}, {x: 370, y: 200}, {x: 200, y: 370}
            ];
            const treeSpawnBaseChance = 0.0005;
            const rockSpawnBaseChance = 0.0005;
            const forestClusterRadius = 34;
            const forestClusterPeakChance = 0.015;
            const mineClusterRadius = 18;
            const mineClusterPeakChance = 0.075;
            fishingSpotsToRender = [];
            directionalSignsToRender = [];
            altarCandidatesToRender = [];
            furnacesToRender = [];
            anvilsToRender = [];
            const inTownCore = (x, y) => {
                const inCastle = (x >= 190 && x <= 220 && y >= 190 && y <= 215);
                const inStore = (x >= 177 && x <= 185 && y >= 232 && y <= 240);
                // Keep a clean spawn-safe apron around the open smithing hall footprint.
                const inSmithyApron = (x >= 217 && x <= 233 && y >= 224 && y <= 244);
                return inCastle || inStore || inSmithyApron;
            };
            const terrainNoise = (x, y) => {
                const n1 = Math.sin(x * 0.045) * 0.08;
                const n2 = Math.cos(y * 0.05) * 0.07;
                const n3 = Math.sin((x + y) * 0.03) * 0.05;
                return n1 + n2 + n3;
            };

            for (let y = 0; y < MAP_SIZE; y++) {
                for (let x = 0; x < MAP_SIZE; x++) {
                    if (x === 0 || y === 0 || x === MAP_SIZE - 1 || y === MAP_SIZE - 1) {
                        logicalMap[0][y][x] = 2; // Map borders
                        heightMap[0][y][x] = 0.08;
                    }
                    else if (x >= 180 && x < 225 && y >= 180 && y < 225) {
                        logicalMap[0][y][x] = 0; // Empty Town Square
                        heightMap[0][y][x] = 0;
                    }
                    else {
                        let treeChance = treeSpawnBaseChance; let rockChance = rockSpawnBaseChance;
                        forestCenters.forEach(c => { let d = Math.hypot(x - c.x, y - c.y); if (d < forestClusterRadius) treeChance += forestClusterPeakChance * (1 - d / forestClusterRadius); });
                        mineCenters.forEach(c => { let d = Math.hypot(x - c.x, y - c.y); if (d < mineClusterRadius) rockChance += mineClusterPeakChance * (1 - d / mineClusterRadius); });
                        heightMap[0][y][x] = terrainNoise(x, y);
                        if (Math.random() < treeChance) logicalMap[0][y][x] = 1;
                        else if (Math.random() < rockChance) logicalMap[0][y][x] = 2;
                        else logicalMap[0][y][x] = 0;
                    }
                }
            }


            const lakeDefs = [
                { cx: 92, cy: 118, rx: 28, ry: 20 },
                { cx: 312, cy: 116, rx: 24, ry: 18 },
                { cx: 100, cy: 308, rx: 30, ry: 22 },
                { cx: 308, cy: 292, rx: 26, ry: 20 },
                { cx: 204, cy: 76, rx: 18, ry: 14 }
            ];

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
                const eastCenterBase = 298;
                const southCurveT = Math.max(0, (y - 296) / 98);
                const westBend = Math.pow(Math.min(1, southCurveT), 1.35) * 86;
                const riverCenter = eastCenterBase + Math.sin(y * 0.018) * 8 + Math.sin(y * 0.007) * 5 - westBend;
                const riverHalfWidth = 6.2 + Math.sin(y * 0.045) * 1.8;
                const carveSpan = Math.ceil(riverHalfWidth + 4);
                for (let x = Math.max(1, Math.floor(riverCenter - carveSpan)); x <= Math.min(MAP_SIZE - 2, Math.ceil(riverCenter + carveSpan)); x++) {
                    const d = Math.abs(x - riverCenter);
                    if (d <= riverHalfWidth) {
                        const depthNorm = Math.max(0, 1 - (d / Math.max(0.1, riverHalfWidth)));
                        carveWaterTile(x, y, depthNorm);
                    }
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
            const castleFrontPond = { cx: 205, cy: 233, rx: 13, ry: 9 };
            for (let y = Math.max(1, Math.floor(castleFrontPond.cy - castleFrontPond.ry - 1)); y <= Math.min(MAP_SIZE - 2, Math.ceil(castleFrontPond.cy + castleFrontPond.ry + 1)); y++) {
                for (let x = Math.max(1, Math.floor(castleFrontPond.cx - castleFrontPond.rx - 1)); x <= Math.min(MAP_SIZE - 2, Math.ceil(castleFrontPond.cx + castleFrontPond.rx + 1)); x++) {
                    const nx = (x - castleFrontPond.cx) / castleFrontPond.rx;
                    const ny = (y - castleFrontPond.cy) / castleFrontPond.ry;
                    const d = Math.sqrt(nx * nx + ny * ny);
                    if (d <= 1.0) carveWaterTile(x, y, 1.0 - d);
                }
            }

            // Ensure a stable deep-water center so dockside fishing can target dark water.
            for (let y = castleFrontPond.cy - 1; y <= castleFrontPond.cy + 1; y++) {
                for (let x = castleFrontPond.cx - 1; x <= castleFrontPond.cx + 1; x++) {
                    if (x <= 1 || y <= 1 || x >= MAP_SIZE - 2 || y >= MAP_SIZE - 2) continue;
                    logicalMap[0][y][x] = 22;
                    heightMap[0][y][x] = -0.18;
                }
            }

            // Add a wooden pier from the castle-facing bank toward the deep center.
            // The tip stops one tile short of water so the player stands on the pier and fishes adjacent dark water.
            const pierXMin = castleFrontPond.cx - 1;
            const pierXMax = castleFrontPond.cx + 1;
            const pierYStart = castleFrontPond.cy - 9;
            const pierYEnd = castleFrontPond.cy - 2;
            for (let y = pierYStart; y <= pierYEnd; y++) {
                for (let x = pierXMin; x <= pierXMax; x++) {
                    if (x <= 1 || y <= 1 || x >= MAP_SIZE - 2 || y >= MAP_SIZE - 2) continue;
                    logicalMap[0][y][x] = 6;
                    heightMap[0][y][x] = -0.03;
                }
            }

            // Shoreline anchor tile so the pier always has a clean walkable entry from land.
            const pierEntryY = pierYStart - 1;
            for (let x = pierXMin; x <= pierXMax; x++) {
                if (x <= 1 || pierEntryY <= 1 || x >= MAP_SIZE - 2 || pierEntryY >= MAP_SIZE - 2) continue;
                logicalMap[0][pierEntryY][x] = 20;
                heightMap[0][pierEntryY][x] = -0.01;
            }

            // Fishing-012 world placement: dedicated fishing merchants near the training water.
            const smithingStations = [
                { type: 'FURNACE', x: 226, y: 232, facingYaw: -Math.PI / 2, footprintW: 2, footprintD: 3 },
                { type: 'ANVIL', x: 226, y: 236 }
            ];
            for (let i = 0; i < smithingStations.length; i++) {
                const station = smithingStations[i];
                if (!station || station.x <= 1 || station.y <= 1 || station.x >= MAP_SIZE - 2 || station.y >= MAP_SIZE - 2) continue;
                if (station.type === 'FURNACE') furnacesToRender.push({
                    x: station.x, y: station.y, z: 0, facingYaw: station.facingYaw,
                    footprintW: station.footprintW, footprintD: station.footprintD
                });
                if (station.type === 'ANVIL') anvilsToRender.push({ x: station.x, y: station.y, z: 0, facingYaw: station.facingYaw });
            }

            const fishingMerchantSpots = [
                { name: 'Fishing Teacher', merchantId: 'fishing_teacher', type: 3, x: castleFrontPond.cx - 4, y: pierEntryY },
                { name: 'Fishing Supplier', merchantId: 'fishing_supplier', type: 2, x: castleFrontPond.cx + 4, y: pierYEnd - 1 }
            ];
            for (let i = 0; i < fishingMerchantSpots.length; i++) {
                const spot = fishingMerchantSpots[i];
                if (!spot || spot.x <= 1 || spot.y <= 1 || spot.x >= MAP_SIZE - 2 || spot.y >= MAP_SIZE - 2) continue;

                // Force a shallow shoreline anchor so these merchants are always reachable beside fishing routes.
                logicalMap[0][spot.y][spot.x] = 16;
                heightMap[0][spot.y][spot.x] = -0.01;
                npcsToRender.push({
                    type: spot.type,
                    x: spot.x,
                    y: spot.y,
                    z: 0,
                    name: spot.name,
                    merchantId: spot.merchantId,
                    facingYaw: spot.facingYaw,
                    action: 'Trade'
                });
            }

            const cookingRouteSpecs = [
                {
                    routeId: 'starter_campfire',
                    label: 'Starter Campfire',
                    fireTiles: [
                        { x: castleFrontPond.cx - 6, y: pierEntryY + 1 }
                    ]
                },
                {
                    routeId: 'riverbank_fire_line',
                    label: 'Riverbank Fire Line',
                    fireTiles: [
                        { x: castleFrontPond.cx - 8, y: pierEntryY + 3 },
                        { x: castleFrontPond.cx - 8, y: pierEntryY + 4 },
                        { x: castleFrontPond.cx - 8, y: pierEntryY + 5 }
                    ]
                },
                {
                    routeId: 'dockside_fire_line',
                    label: 'Dockside Fire Line',
                    fireTiles: [
                        { x: castleFrontPond.cx + 7, y: pierEntryY + 3 },
                        { x: castleFrontPond.cx + 7, y: pierEntryY + 4 },
                        { x: castleFrontPond.cx + 7, y: pierEntryY + 5 }
                    ]
                },
                {
                    routeId: 'deep_water_dock_fire_line',
                    label: 'Deep-Water Dock Fire Line',
                    fireTiles: [
                        { x: castleFrontPond.cx - 2, y: pierYEnd - 1 },
                        { x: castleFrontPond.cx, y: pierYEnd - 2 },
                        { x: castleFrontPond.cx + 2, y: pierYEnd - 1 }
                    ]
                }
            ];
            const cookingTrainingLocations = [];
            cookingFireSpotsToRender = [];

            function setCookingRouteTile(x, y, z = 0) {
                if (x <= 1 || y <= 1 || x >= MAP_SIZE - 2 || y >= MAP_SIZE - 2) return false;
                const row = logicalMap[z] && logicalMap[z][y];
                if (!row) return false;
                const tile = row[x];
                const validBase = tile === 0 || tile === 6 || tile === 7 || tile === 8 || tile === 15 || tile === 19 || tile === 20 || tile === 21 || tile === 22;
                if (!validBase) return false;

                if (tile === 21 || tile === 22) {
                    logicalMap[z][y][x] = 20;
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
                        label: routeSpec.label,
                        x: anchor.x,
                        y: anchor.y,
                        z: anchor.z,
                        count: routePlacements.length
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
                        if (!(tile === 0 || tile === 1 || tile === 2 || tile === 4)) continue;
                        if (inTownCore(x, y)) continue;

                        let sum = 0;
                        let count = 0;
                        for (let oy = -1; oy <= 1; oy++) {
                            for (let ox = -1; ox <= 1; ox++) {
                                const nt = logicalMap[0][y + oy][x + ox];
                                if (nt === 0 || nt === 1 || nt === 2 || nt === 4) {
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
            
            // Plane 0: Ground Floor (Expanded 31x26 Blueprint)
            const castleFloor0 = [
                "CWWWWWWWWWWWWWWWWWWWWWWWWWWWWWC",
                "WFFFFFFFFFFFFFFFFFFFFFFFFFFFFFW",
                "WFFFFFFFFFFFFFFFFFFFFFFFFFFFFFW",
                "WFFFFFFFFFFFFFFFFFFFFFFFFFFFFFW",
                "WFFFFFFFFFFFFFFFFFFFFFFFFFFFFFW",
                "WFFFFFFFFFFFFFFFFFFFFFFFFFFFFFW",
                "WFFFFFFFFFFFFFFFFFFFFFFFFFFFFFW",
                "WFFFFFCWWWWWWWFFFFWWWWWWCFFFFFW", // Keep back, added door
                "WFFFFFWFFFFFFFFFFFFFFFFFWFFFFFW",
                "WFFFFFWFFFFFFFFFFFFFFFFFWFFFFFW",
                "WFFFFFWFFFFFNNNNNNNFFFFFWFFFFFW",
                "WFFFFFWFFFFFBBBBBBBFFFFFWFFFFFW", // Banking area
                "WFFFFFWFFFFFFFFFFFFFFFFFWFFFFFW",
                "WFFFFFWFFFFFFFFFFFFFFFFFWFFFFFW",
                "WFFFFFWFFFFFFFFFFFFFFFFFWFFFFFW",
                "WFFFFFWFFFFFFFFTFFFFFFFFWFFFFFW", // Dummy
                "WFFFFFWFFFFFFFFFFFFFFFFFWFFFFFW",
                "WFFFFFCWWWWWWWFFFFWWWWWWCFFFFFW", // Keep front, added door
                "WFFFFFFFFFFFFFFFFFFFFFFFFFFFFFW",
                "WFFFFFFFFFFFFFFFFFFFFFFFFFFFFFW",
                "WFFFFFFFFFFFFFFFFFFFFFFFFFFFFFW", 
                "WFFFFFFFFFFFFFFFFFFFFFFFFFFFFFW", 
                "WFFFFFFFFFFFFFFFFFFFFFFFFFFFFFW", 
                "WFFFFFFFFFFFFFFFFFFFFFFFFFFFFFW", 
                "WFFFFFFFFFFFFFFFFFFFFFFFFFFFFFW",
                "CWWWWWWWWWWWWWWsssWWWWWWWWWWWWC" // Outer wall front with seamless entrance
            ];

            // Plane 1: Second Floor
            const castleFloor1 = [
                "CWWWWWWWWWWWWWWWWWWWWWWWWWWWWWC",
                "WFFFFFFFFFFFFFFFFFFFFFFFFFFFFFW",
                "WFFFFFFFFFFFFFFFFFFFFFFFFFFFFFW",
                "WFFFFFFFFFFFFFFFFFFFFFFFFFFFFFW",
                "WFFFFFFFFFFFFFFFFFFFFFFFFFFFFFW",
                "WFFFFFFFFFFFFFFFFFFFFFFFFFFFFFW",
                "WFFFFFFFFFFFFFFFFFFFFFFFFFFFFFW",
                "WFFFFFCWWWWWWWFFFFWWWWWWCFFFFFW", 
                "WFFFFFWFFFFFFFFFFFFFFFFFWFFFFFW",
                "WFFFFFWFFFFFFFFFFFFFFFFFWFFFFFW",
                "WFFFFFWFFFFFFFFFFFFFFFFFWFFFFFW",
                "WFFFFFWFFFFFFFFKFFFQFFFFWFFFFFW", // Placed King & Queen
                "WFFFFFWFFFFFFFFFFFFFFFFFWFFFFFW",
                "WFFFFFWFFFFFFFFFFFFFFFFFWFFFFFW",
                "WFFFFFWFFFFFFFFFFFFFFFFFWFFFFFW",
                "WFFFFFWFFFFFFFFFFFFFFFFFWFFFFFW",
                "WFFFFFWFFFFFFFFFFFFFFFFFWFFFFFW",
                "WFFFFFCWWWWWWWFFFFWWWWWWCFFFFFW",
                "WFFFFFFFFFFFFFFFFFFFFFFFFFFFFFW",
                "WFFFFFFFFFFFFFFFFFFFFFFFFFFFFFW",
                "WFFFFFFFFFFFFFFFFFFFFFFFFFFFFFW", 
                "WFFFFFFFFFFFFFFFFFFFFFFFFFFFFFW", 
                "WFFFFFFFFFFFFFFFFFFFFFFFFFFFFFW", 
                "WFFFFFFFFFFFFFFFFFFFFFFFFFFFFFW", 
                "WFFFFFFFFFFFFFFFFFFFFFFFFFFFFFW",
                "CWWWWWWWWWWWWWWWWWWWWWWWWWWWWWC"
            ];

            // General Store (9x9)
            const generalStoreBlueprint = [
                "CWWWWWWWC",
                "WFFFFFFFW",
                "WFFFFVFFW", 
                "WFFF$VFFW", 
                "WFFFFVFFW", 
                "WFFFFVFFW", 
                "WFFFFFFFW",
                "WFFFFFFFW",
                "CWWWWWWWC"  
            ];

            // Open-front smithing hall (13x9): three-walled rectangle, west side open to pond.
            const smithingHallBlueprint = [
                "CWWWWWWWC",
                "FFFFFFFFW",
                "FFFFFFFFW",
                "FFFFFFFFW",
                "FFFFFFFFW",
                "FFFFFFFFW",
                "FFFFFFFFW",
                "FFFFFFFFW",
                "FFFFFFFFW",
                "FFFFFFFFW",
                "FFFFFFFFW",
                "FFFFFFFFW",
                "CWWWWWWWC"
            ];

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
                            logicalMap[z][mapY][mapX] = 16; heightMap[z][mapY][mapX] = 0.5; // 16 = Solid NPC
                            npcsToRender.push({ type: 3, x: mapX, y: mapY, z: z, name: "Banker" });
                        }
                        else if (char === 'K') { 
                            logicalMap[z][mapY][mapX] = 16; heightMap[z][mapY][mapX] = 0.5; 
                            npcsToRender.push({ type: 7, x: mapX, y: mapY, z: z, name: "King Roald" });
                        }
                        else if (char === 'Q') { 
                            logicalMap[z][mapY][mapX] = 16; heightMap[z][mapY][mapX] = 0.5; 
                            npcsToRender.push({ type: 8, x: mapX, y: mapY, z: z, name: "Queen Ellamaria" });
                        }
                        else if (char === 'V') { 
                            logicalMap[z][mapY][mapX] = 17; heightMap[z][mapY][mapX] = 0.5; 
                        }
                        else if (char === '$') { 
                            logicalMap[z][mapY][mapX] = 16; heightMap[z][mapY][mapX] = 0.5; 
                            npcsToRender.push({ type: 2, x: mapX, y: mapY, z: z, name: "Shopkeeper" });
                        }
                        else if (char === 'T') { 
                            logicalMap[z][mapY][mapX] = 10; heightMap[z][mapY][mapX] = 0.5; 
                        }
                    }
                }
            }

            // Stack the castle planes right in the middle
            stampBlueprint(190, 190, 0, castleFloor0);
            stampBlueprint(190, 190, 1, castleFloor1);
            
            // Stamp the General Store at the requested coordinates
            stampBlueprint(177, 232, 0, generalStoreBlueprint);

            // Smithing hall opposite the pond from the shop (east bank): longer rectangle, shop-width.
            stampBlueprint(221, 228, 0, smithingHallBlueprint);
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
            const smithingMerchantSpots = [
                { name: 'Borin Ironvein', merchantId: 'borin_ironvein', type: 2, x: 224, y: 230, facingYaw: -Math.PI / 2 },
                { name: 'Thrain Deepforge', merchantId: 'thrain_deepforge', type: 6, x: 228, y: 236 },
                { name: 'Elira Gemhand', merchantId: 'elira_gemhand', type: 3, x: 228, y: 231 }
            ];
            for (let i = 0; i < smithingMerchantSpots.length; i++) {
                const spot = smithingMerchantSpots[i];
                if (!spot || spot.x <= 1 || spot.y <= 1 || spot.x >= MAP_SIZE - 2 || spot.y >= MAP_SIZE - 2) continue;
                logicalMap[0][spot.y][spot.x] = 16;
                heightMap[0][spot.y][spot.x] = 0.5;
                npcsToRender.push({
                    type: spot.type,
                    x: spot.x,
                    y: spot.y,
                    z: 0,
                    name: spot.name,
                    merchantId: spot.merchantId,
                    facingYaw: spot.facingYaw,
                    action: 'Trade'
                });
            }


            // --- USER TEST: Dual Castle Stairs ---
            // Left Staircase (194, 214 -> 191, 214)
            logicalMap[0][214][194] = 15; heightMap[0][214][194] = 0.75; // Tier 1 (Starts flush with 0.5 floor)
            logicalMap[0][214][193] = 15; heightMap[0][214][193] = 1.25; // Tier 2
            logicalMap[0][214][192] = 15; heightMap[0][214][192] = 1.75; // Tier 3
            logicalMap[0][214][191] = 13; heightMap[0][214][191] = 2.0;  // Platform Landing & Climb Up

            // Right Staircase (216, 214 -> 219, 214)
            logicalMap[0][214][216] = 15; heightMap[0][214][216] = 0.75; // Tier 1 (Starts flush with 0.5 floor)
            logicalMap[0][214][217] = 15; heightMap[0][214][217] = 1.25; // Tier 2
            logicalMap[0][214][218] = 15; heightMap[0][214][218] = 1.75; // Tier 3
            logicalMap[0][214][219] = 13; heightMap[0][214][219] = 2.0;  // Platform Landing & Climb Up

            // Plane 1 (Second Floor) Connectors
            logicalMap[1][214][191] = 14; heightMap[1][214][191] = 0.5;  // Left Climb Down
            logicalMap[1][214][219] = 14; heightMap[1][214][219] = 0.5;  // Right Climb Down

            // --- USER TEST: Store Stairs & Interactive Door ---
            // Ground Floor (Plane 0) - East wall of the General Store
            logicalMap[0][236][186] = 15; heightMap[0][236][186] = 0.25; // Normal Seamless Stairs (Tier 1, climbs 0 to 0.5)
            logicalMap[0][236][185] = 18; heightMap[0][236][185] = 0.5;  // Closed Door overriding the wall segment

            // Smithing hall approach stairs from pond side (west/open side).
            for (let sy = 233; sy <= 235; sy++) {
                logicalMap[0][sy][219] = 20; heightMap[0][sy][219] = -0.01;
                logicalMap[0][sy][220] = 15; heightMap[0][sy][220] = 0.25;
            }
            
            doorsToRender.push({ 
                x: 185, y: 236, z: 0, 
                isOpen: false, 
                hingeOffsetX: 0,
                hingeOffsetY: 0.45, // Anchored to the South edge of the tile
                thickness: 0.1,
                width: 0.9,
                isEW: false,        // false = runs North/South (along East wall)
                closedRot: 0,       // Points North to close the gap
                openRot: Math.PI / 2, // Swings 90 degrees inward (West)
                currentRotation: 0, 
                targetRotation: 0 
            });

            // Replace broad random interior rock spread with structured mining training zones.
            for (let y = 3; y < MAP_SIZE - 3; y++) {
                for (let x = 3; x < MAP_SIZE - 3; x++) {
                    if (logicalMap[0][y][x] !== 2) continue;
                    logicalMap[0][y][x] = 0;
                    heightMap[0][y][x] = Math.max(0, heightMap[0][y][x]);
                }
            }

            const isWorldFeatureSpawnTile = (x, y) => {
                if (x <= 2 || y <= 2 || x >= MAP_SIZE - 3 || y >= MAP_SIZE - 3) return false;
                if (inTownCore(x, y)) return false;
                const tile = logicalMap[0][y][x];
                return tile === 0;
            };

            const randomizeArrayInPlace = (arr) => {
                for (let i = arr.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    const tmp = arr[i];
                    arr[i] = arr[j];
                    arr[j] = tmp;
                }
            };

            const allFeatureCandidates = [];
            for (let y = 3; y < MAP_SIZE - 3; y++) {
                for (let x = 3; x < MAP_SIZE - 3; x++) {
                    if (isWorldFeatureSpawnTile(x, y)) allFeatureCandidates.push({ x, y, z: 0 });
                }
            }
            randomizeArrayInPlace(allFeatureCandidates);
            const deterministicFeatureCandidates = allFeatureCandidates.slice();

            // Place deterministic mining training routes across progression bands.
            const miningZoneSpecs = [
                {
                    zoneId: 'starter_mine',
                    label: 'Starter Mine',
                    centerX: 236,
                    centerY: 248,
                    minRadius: 8,
                    maxRadius: 42,
                    radiusStep: 6,
                    targetCount: 30,
                    minSpacing: 2.0,
                    oreWeights: [
                        { oreType: 'clay', weight: 3 },
                        { oreType: 'copper', weight: 4 },
                        { oreType: 'tin', weight: 4 }
                    ]
                },
                {
                    zoneId: 'iron_mine',
                    label: 'Early Iron Mine',
                    centerX: 286,
                    centerY: 248,
                    minRadius: 8,
                    maxRadius: 46,
                    radiusStep: 6,
                    targetCount: 24,
                    minSpacing: 2.1,
                    oreWeights: [
                        { oreType: 'iron', weight: 10 },
                        { oreType: 'copper', weight: 1 },
                        { oreType: 'tin', weight: 1 }
                    ]
                },
                {
                    zoneId: 'coal_mine',
                    label: 'Deep Coal Mine',
                    centerX: 324,
                    centerY: 286,
                    minRadius: 10,
                    maxRadius: 48,
                    radiusStep: 6,
                    targetCount: 20,
                    minSpacing: 2.2,
                    oreWeights: [
                        { oreType: 'coal', weight: 8 },
                        { oreType: 'iron', weight: 2 }
                    ]
                },
                {
                    zoneId: 'precious_mine',
                    label: 'Silver and Gold Mine',
                    centerX: 344,
                    centerY: 334,
                    minRadius: 10,
                    maxRadius: 52,
                    radiusStep: 6,
                    targetCount: 16,
                    minSpacing: 2.4,
                    oreWeights: [
                        { oreType: 'silver', weight: 5 },
                        { oreType: 'gold', weight: 4 }
                    ]
                },
                {
                    zoneId: 'gem_mine',
                    label: 'Gem Mine',
                    centerX: 204,
                    centerY: 364,
                    minRadius: 8,
                    maxRadius: 46,
                    radiusStep: 6,
                    targetCount: 14,
                    minSpacing: 2.5,
                    areaGateFlag: 'gemMineUnlocked',
                    areaName: 'the gem mine',
                    areaGateMessage: 'The gem mine is locked. Speak with Elira Gemhand to gain access.',
                    oreWeights: [
                        { oreType: 'sapphire', weight: 6 },
                        { oreType: 'emerald', weight: 4 }
                    ]
                },
                {
                    zoneId: 'rune_essence_mine',
                    label: 'Rune Essence Mine',
                    centerX: 74,
                    centerY: 74,
                    minRadius: 10,
                    maxRadius: 50,
                    radiusStep: 6,
                    targetCount: 10,
                    minSpacing: 2.6,
                    oreWeights: [
                        { oreType: 'rune_essence', weight: 1 }
                    ]
                }
            ];
            const miningTrainingLocations = [];
            const placedMiningRocks = [];
            RUNE_ESSENCE_ROCKS = [];

            function isValidMiningCandidate(x, y, z = 0) {
                if (x <= 2 || y <= 2 || x >= MAP_SIZE - 3 || y >= MAP_SIZE - 3) return false;
                if (inTownCore(x, y)) return false;
                const row = logicalMap[z] && logicalMap[z][y];
                if (!row) return false;
                const tile = row[x];
                return tile === 0 || tile === 1 || tile === 2 || tile === 4;
            }

            function isFarEnoughFromPlacedMiningRocks(candidate, minSpacing) {
                for (let i = 0; i < placedMiningRocks.length; i++) {
                    const placed = placedMiningRocks[i];
                    if (!placed) continue;
                    if (Math.hypot(placed.x - candidate.x, placed.y - candidate.y) < minSpacing) return false;
                }
                return true;
            }

            function getWeightedOreType(weights, x, y) {
                if (!Array.isArray(weights) || weights.length === 0) return null;
                let totalWeight = 0;
                for (let i = 0; i < weights.length; i++) {
                    const row = weights[i];
                    if (!row || !row.oreType || !Number.isFinite(row.weight) || row.weight <= 0) continue;
                    totalWeight += Math.floor(row.weight);
                }
                if (totalWeight <= 0) return null;

                const hash = ((x * 73856093) ^ (y * 19349663) ^ (totalWeight * 83492791)) >>> 0;
                let roll = hash % totalWeight;
                for (let i = 0; i < weights.length; i++) {
                    const row = weights[i];
                    if (!row || !row.oreType || !Number.isFinite(row.weight) || row.weight <= 0) continue;
                    roll -= Math.floor(row.weight);
                    if (roll < 0) return row.oreType;
                }
                return weights[weights.length - 1].oreType;
            }

            function setMiningRockAt(x, y, z, oreType, options = {}) {
                if (!oreType) return false;
                logicalMap[z][y][x] = 2;
                const key = rockNodeKey(x, y, z);
                rockOreOverrides[key] = oreType;

                const hasAreaGate = options
                    && ((typeof options.areaGateFlag === 'string' && options.areaGateFlag)
                        || (typeof options.areaName === 'string' && options.areaName)
                        || (typeof options.areaGateMessage === 'string' && options.areaGateMessage));
                if (hasAreaGate) {
                    rockAreaGateOverrides[key] = {
                        areaGateFlag: (typeof options.areaGateFlag === 'string' && options.areaGateFlag) ? options.areaGateFlag : null,
                        areaName: (typeof options.areaName === 'string' && options.areaName) ? options.areaName : null,
                        areaGateMessage: (typeof options.areaGateMessage === 'string' && options.areaGateMessage) ? options.areaGateMessage : null
                    };
                } else if (rockAreaGateOverrides && rockAreaGateOverrides[key]) {
                    delete rockAreaGateOverrides[key];
                }

                if (oreType === 'rune_essence') {
                    RUNE_ESSENCE_ROCKS.push({ x, y, z });
                }
                return true;
            }

            function collectZoneCandidates(zoneSpec, radius) {
                const candidates = [];
                const minX = Math.max(3, Math.floor(zoneSpec.centerX - radius));
                const maxX = Math.min(MAP_SIZE - 4, Math.ceil(zoneSpec.centerX + radius));
                const minY = Math.max(3, Math.floor(zoneSpec.centerY - radius));
                const maxY = Math.min(MAP_SIZE - 4, Math.ceil(zoneSpec.centerY + radius));

                for (let y = minY; y <= maxY; y++) {
                    for (let x = minX; x <= maxX; x++) {
                        const dist = Math.hypot(x - zoneSpec.centerX, y - zoneSpec.centerY);
                        if (dist > radius) continue;
                        if (!isValidMiningCandidate(x, y, 0)) continue;
                        candidates.push({ x, y, z: 0, dist });
                    }
                }

                candidates.sort((a, b) => {
                    if (a.dist !== b.dist) return a.dist - b.dist;
                    if (a.y !== b.y) return a.y - b.y;
                    return a.x - b.x;
                });
                return candidates;
            }

            function placeMiningZone(zoneSpec) {
                if (!zoneSpec) return;
                const targetCount = Number.isFinite(zoneSpec.targetCount) ? Math.max(1, Math.floor(zoneSpec.targetCount)) : 1;
                const minSpacing = Number.isFinite(zoneSpec.minSpacing) ? Math.max(1.6, zoneSpec.minSpacing) : 2.0;
                const radiusStep = Number.isFinite(zoneSpec.radiusStep) ? Math.max(2, Math.floor(zoneSpec.radiusStep)) : 6;
                let placedCount = 0;
                const zonePlacements = [];

                for (let radius = zoneSpec.minRadius; radius <= zoneSpec.maxRadius && placedCount < targetCount; radius += radiusStep) {
                    const candidates = collectZoneCandidates(zoneSpec, radius);
                    for (let i = 0; i < candidates.length && placedCount < targetCount; i++) {
                        const candidate = candidates[i];
                        const key = rockNodeKey(candidate.x, candidate.y, candidate.z);
                        if (rockOreOverrides[key]) continue;
                        if (!isFarEnoughFromPlacedMiningRocks(candidate, minSpacing)) continue;

                        const oreType = getWeightedOreType(zoneSpec.oreWeights, candidate.x, candidate.y);
                        if (!oreType) continue;
                        if (!setMiningRockAt(candidate.x, candidate.y, candidate.z, oreType, {
                            areaGateFlag: zoneSpec.areaGateFlag || null,
                            areaName: zoneSpec.areaName || null,
                            areaGateMessage: zoneSpec.areaGateMessage || null
                        })) continue;

                        placedMiningRocks.push({ x: candidate.x, y: candidate.y, z: candidate.z });
                        zonePlacements.push({ x: candidate.x, y: candidate.y, z: candidate.z });
                        placedCount++;
                    }
                }

                if (zonePlacements.length > 0) {
                    const anchor = zonePlacements[Math.floor(zonePlacements.length / 2)];
                    miningTrainingLocations.push({
                        zoneId: zoneSpec.zoneId,
                        label: zoneSpec.label,
                        x: anchor.x,
                        y: anchor.y,
                        z: anchor.z,
                        count: zonePlacements.length
                    });
                }
            }

            for (let i = 0; i < miningZoneSpecs.length; i++) {
                placeMiningZone(miningZoneSpecs[i]);
            }

            rebuildRockNodes();
            window.getMiningTrainingLocations = function getMiningTrainingLocations() {
                return miningTrainingLocations.slice();
            };

            // Place elemental altars in deterministic progression bands, anchored around the castle route.
            const runecraftingAltarOrder = ['Ember Altar', 'Water Altar', 'Earth Altar', 'Air Altar'];
            const castleRouteAnchor = { x: 205, y: 205 };
            const runecraftingAltarBandSpecs = [
                { label: 'Ember Altar', variant: 4, minDistance: 24, maxDistance: 78 },
                { label: 'Water Altar', variant: 4, minDistance: 88, maxDistance: 126 },
                { label: 'Earth Altar', variant: 4, minDistance: 136, maxDistance: 174 },
                { label: 'Air Altar', variant: 4, minDistance: 184, maxDistance: 240 }
            ];
            const fallbackBandExpansion = 28;

            function isCandidateNearRuneEssence(candidate) {
                return RUNE_ESSENCE_ROCKS.some((rock) => Math.hypot(rock.x - candidate.x, rock.y - candidate.y) < 20);
            }

            function isCandidateNearExistingAltars(candidate) {
                return altarCandidatesToRender.some((altar) => Math.hypot(altar.x - candidate.x, altar.y - candidate.y) < 28);
            }

            function canPlaceAltarCandidate(candidate) {
                if (!candidate) return false;
                if (logicalMap[candidate.z][candidate.y][candidate.x] !== 0) return false;
                if (isCandidateNearRuneEssence(candidate)) return false;
                if (isCandidateNearExistingAltars(candidate)) return false;
                return true;
            }

            function distanceFromCastleAnchor(candidate) {
                return Math.hypot(candidate.x - castleRouteAnchor.x, candidate.y - castleRouteAnchor.y);
            }

            function sortCandidatesByBandPreference(candidates, targetDistance) {
                return candidates.sort((a, b) => {
                    const distanceDelta = Math.abs(distanceFromCastleAnchor(a) - targetDistance) - Math.abs(distanceFromCastleAnchor(b) - targetDistance);
                    if (distanceDelta !== 0) return distanceDelta;
                    if (a.y !== b.y) return a.y - b.y;
                    return a.x - b.x;
                });
            }

            function chooseBandCandidate(bandSpec) {
                const targetDistance = (bandSpec.minDistance + bandSpec.maxDistance) * 0.5;
                let minDistance = bandSpec.minDistance;
                let maxDistance = bandSpec.maxDistance;

                for (let attempt = 0; attempt < 4; attempt++) {
                    const inBand = deterministicFeatureCandidates.filter((candidate) => {
                        if (!canPlaceAltarCandidate(candidate)) return false;
                        const dist = distanceFromCastleAnchor(candidate);
                        return dist >= minDistance && dist <= maxDistance;
                    });

                    if (inBand.length > 0) {
                        return sortCandidatesByBandPreference(inBand, targetDistance)[0];
                    }

                    minDistance = Math.max(12, minDistance - fallbackBandExpansion);
                    maxDistance = maxDistance + fallbackBandExpansion;
                }

                const anyEligible = deterministicFeatureCandidates.filter((candidate) => canPlaceAltarCandidate(candidate));
                if (anyEligible.length === 0) return null;
                return sortCandidatesByBandPreference(anyEligible, targetDistance)[0];
            }

            altarCandidatesToRender = [];
            for (let i = 0; i < runecraftingAltarBandSpecs.length; i++) {
                const bandSpec = runecraftingAltarBandSpecs[i];
                const placed = chooseBandCandidate(bandSpec);
                if (!placed) continue;

                altarCandidatesToRender.push({ x: placed.x, y: placed.y, z: placed.z, variant: bandSpec.variant, label: bandSpec.label });
                // Altar collision footprint is 4x4 tiles.
                for (let by = placed.y - 1; by <= placed.y + 2; by++) {
                    if (by < 0 || by >= MAP_SIZE) continue;
                    for (let bx = placed.x - 1; bx <= placed.x + 2; bx++) {
                        if (bx < 0 || bx >= MAP_SIZE) continue;
                        logicalMap[placed.z][by][bx] = 5;
                    }
                }
            }

            // Place runecrafting merchants near altar routes so rune trading and pouch progression are reachable in-world.
            function isRunecraftingMerchantWalkable(x, y, z) {
                if (x <= 1 || y <= 1 || x >= MAP_SIZE - 2 || y >= MAP_SIZE - 2) return false;
                const row = logicalMap[z] && logicalMap[z][y];
                if (!row) return false;
                const tile = row[x];
                return tile === 0 || tile === 20 || tile === 6 || tile === 7 || tile === 8 || tile === 15 || tile === 19;
            }

            function findMerchantSpotNearAltar(anchor) {
                if (!anchor) return null;
                const maxRadius = 10;
                for (let radius = 2; radius <= maxRadius; radius++) {
                    for (let dy = -radius; dy <= radius; dy++) {
                        for (let dx = -radius; dx <= radius; dx++) {
                            if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
                            const x = anchor.x + dx;
                            const y = anchor.y + dy;
                            if (!isRunecraftingMerchantWalkable(x, y, anchor.z)) continue;
                            const occupied = npcsToRender.some((npc) => npc && npc.z === anchor.z && npc.x === x && npc.y === y);
                            if (occupied) continue;
                            return { x, y, z: anchor.z };
                        }
                    }
                }
                return null;
            }

            const emberAltar = altarCandidatesToRender.find((altar) => altar && altar.label === 'Ember Altar') || null;
            const airAltar = altarCandidatesToRender.find((altar) => altar && altar.label === 'Air Altar') || null;

            const runecraftingMerchantSpots = [
                { name: 'Rune Tutor', merchantId: 'rune_tutor', type: 3, anchor: emberAltar },
                { name: 'Combination Sage', merchantId: 'combination_sage', type: 6, anchor: airAltar }
            ];

            for (let i = 0; i < runecraftingMerchantSpots.length; i++) {
                const spotSpec = runecraftingMerchantSpots[i];
                if (!spotSpec || !spotSpec.anchor) continue;

                const spot = findMerchantSpotNearAltar(spotSpec.anchor);
                if (!spot) continue;

                logicalMap[spot.z][spot.y][spot.x] = 16;
                npcsToRender.push({
                    type: spotSpec.type,
                    x: spot.x,
                    y: spot.y,
                    z: spot.z,
                    name: spotSpec.name,
                    merchantId: spotSpec.merchantId,
                    action: 'Trade'
                });
            }
            window.getRunecraftingAltarLocations = function getRunecraftingAltarLocations() {
                if (!Array.isArray(altarCandidatesToRender)) return [];
                const ordered = [];
                for (let i = 0; i < runecraftingAltarOrder.length; i++) {
                    const label = runecraftingAltarOrder[i];
                    const altar = altarCandidatesToRender.find((entry) => entry && entry.label === label);
                    if (!altar) continue;
                    ordered.push({
                        label: altar.label,
                        x: altar.x,
                        y: altar.y,
                        z: altar.z
                    });
                }
                return ordered;
            };

            window.getRunecraftingAltarNameAt = function getRunecraftingAltarNameAt(x, y, z) {
                if (!Array.isArray(altarCandidatesToRender)) return null;
                for (let i = 0; i < altarCandidatesToRender.length; i++) {
                    const altar = altarCandidatesToRender[i];
                    if (!altar) continue;
                    if (altar.x === x && altar.y === y && altar.z === z) return altar.label || null;
                }
                return null;
            };

            // Place deterministic woodcutting training routes for normal->yew progression.
            const woodcuttingRouteAnchor = { x: 205, y: 205 };
            const woodcuttingZoneSpecs = [
                { nodeId: 'normal_tree', label: 'Starter Grove', minDistance: 18, maxDistance: 64, targetCount: 26, minSpacing: 2.0, areaGateFlag: null, areaName: 'the starter grove', areaGateMessage: null },
                { nodeId: 'oak_tree', label: 'Oak Path', minDistance: 74, maxDistance: 116, targetCount: 20, minSpacing: 2.2, areaGateFlag: null, areaName: 'the oak path', areaGateMessage: null },
                { nodeId: 'willow_tree', label: 'Willow Bend', minDistance: 124, maxDistance: 168, targetCount: 16, minSpacing: 2.4, areaGateFlag: null, areaName: 'the willow bend', areaGateMessage: null },
                { nodeId: 'maple_tree', label: 'Maple Ridge', minDistance: 176, maxDistance: 218, targetCount: 12, minSpacing: 2.6, areaGateFlag: null, areaName: 'the maple ridge', areaGateMessage: null },
                { nodeId: 'yew_tree', label: 'Yew Frontier', minDistance: 224, maxDistance: 272, targetCount: 8, minSpacing: 3.0, areaGateFlag: null, areaName: 'the yew frontier', areaGateMessage: null }
            ];
            const woodcuttingFallbackBandExpansion = 30;
            const placedWoodcuttingTrees = [];

            function distanceFromWoodcuttingAnchor(candidate) {
                return Math.hypot(candidate.x - woodcuttingRouteAnchor.x, candidate.y - woodcuttingRouteAnchor.y);
            }

            function canPlaceWoodcuttingTreeCandidate(candidate) {
                if (!candidate) return false;
                if (candidate.x <= 2 || candidate.y <= 2 || candidate.x >= MAP_SIZE - 3 || candidate.y >= MAP_SIZE - 3) return false;
                if (inTownCore(candidate.x, candidate.y)) return false;
                const tile = logicalMap[candidate.z] && logicalMap[candidate.z][candidate.y] ? logicalMap[candidate.z][candidate.y][candidate.x] : null;
                if (tile !== 0 && tile !== 1) return false;
                if (isCandidateNearRuneEssence(candidate)) return false;
                if (isCandidateNearExistingAltars(candidate)) return false;
                return true;
            }

            function sortWoodcuttingCandidates(candidates, targetDistance) {
                return candidates.sort((a, b) => {
                    const distanceDelta = Math.abs(distanceFromWoodcuttingAnchor(a) - targetDistance) - Math.abs(distanceFromWoodcuttingAnchor(b) - targetDistance);
                    if (distanceDelta !== 0) return distanceDelta;
                    if (a.y !== b.y) return a.y - b.y;
                    return a.x - b.x;
                });
            }

            function isTreeCandidateFarEnough(candidate, minSpacing) {
                for (let i = 0; i < placedWoodcuttingTrees.length; i++) {
                    const placed = placedWoodcuttingTrees[i];
                    if (!placed) continue;
                    if (Math.hypot(placed.x - candidate.x, placed.y - candidate.y) < minSpacing) return false;
                }
                return true;
            }

            function assignWoodcuttingBandTrees(zoneSpec) {
                if (!zoneSpec) return;
                const targetDistance = (zoneSpec.minDistance + zoneSpec.maxDistance) * 0.5;
                let minDistance = zoneSpec.minDistance;
                let maxDistance = zoneSpec.maxDistance;
                let sortedCandidates = [];

                for (let attempt = 0; attempt < 4; attempt++) {
                    const inBand = deterministicFeatureCandidates.filter((candidate) => {
                        if (!canPlaceWoodcuttingTreeCandidate(candidate)) return false;
                        const dist = distanceFromWoodcuttingAnchor(candidate);
                        return dist >= minDistance && dist <= maxDistance;
                    });
                    if (inBand.length > 0) {
                        sortedCandidates = sortWoodcuttingCandidates(inBand, targetDistance);
                        break;
                    }
                    minDistance = Math.max(12, minDistance - woodcuttingFallbackBandExpansion);
                    maxDistance = maxDistance + woodcuttingFallbackBandExpansion;
                }

                if (sortedCandidates.length === 0) {
                    const anyEligible = deterministicFeatureCandidates.filter((candidate) => canPlaceWoodcuttingTreeCandidate(candidate));
                    sortedCandidates = sortWoodcuttingCandidates(anyEligible, targetDistance);
                }

                const minSpacing = Number.isFinite(zoneSpec.minSpacing) ? Math.max(1.5, zoneSpec.minSpacing) : 2.0;
                const targetCount = Number.isFinite(zoneSpec.targetCount) ? Math.max(1, Math.floor(zoneSpec.targetCount)) : 1;
                let placedCount = 0;

                for (let i = 0; i < sortedCandidates.length && placedCount < targetCount; i++) {
                    const candidate = sortedCandidates[i];
                    if (!isTreeCandidateFarEnough(candidate, minSpacing)) continue;
                    logicalMap[candidate.z][candidate.y][candidate.x] = 1;
                    setTreeNode(candidate.x, candidate.y, candidate.z, zoneSpec.nodeId, {
                        areaGateFlag: zoneSpec.areaGateFlag || null,
                        areaName: zoneSpec.areaName || null,
                        areaGateMessage: zoneSpec.areaGateMessage || null
                    });
                    placedWoodcuttingTrees.push({ x: candidate.x, y: candidate.y, z: candidate.z, nodeId: zoneSpec.nodeId });
                    placedCount++;
                }
            }

            for (let i = 0; i < woodcuttingZoneSpecs.length; i++) {
                assignWoodcuttingBandTrees(woodcuttingZoneSpecs[i]);
            }

            // Starter pond showcase row: one of each tree type with clear spacing for visual inspection.
            const showcaseRowY = castleFrontPond.cy - 14;
            const showcaseTrees = [
                { nodeId: 'normal_tree', x: castleFrontPond.cx - 26, y: showcaseRowY },
                { nodeId: 'oak_tree', x: castleFrontPond.cx - 13, y: showcaseRowY },
                { nodeId: 'willow_tree', x: castleFrontPond.cx, y: showcaseRowY },
                { nodeId: 'maple_tree', x: castleFrontPond.cx + 13, y: showcaseRowY },
                { nodeId: 'yew_tree', x: castleFrontPond.cx + 26, y: showcaseRowY }
            ];

            function clearShowcaseNaturalArea(centerX, centerY, radius) {
                for (let y = centerY - radius; y <= centerY + radius; y++) {
                    for (let x = centerX - radius; x <= centerX + radius; x++) {
                        if (x <= 1 || y <= 1 || x >= MAP_SIZE - 2 || y >= MAP_SIZE - 2) continue;
                        const tile = logicalMap[0][y][x];
                        if (tile === 0 || tile === 1 || tile === 2 || tile === 4 || tile === 20 || tile === 21 || tile === 22) {
                            logicalMap[0][y][x] = 0;
                            heightMap[0][y][x] = Math.max(0, heightMap[0][y][x]);
                        }
                    }
                }
            }

            for (let i = 0; i < showcaseTrees.length; i++) {
                const tree = showcaseTrees[i];
                if (!tree) continue;
                clearShowcaseNaturalArea(tree.x, tree.y, 5);
                if (tree.x <= 1 || tree.y <= 1 || tree.x >= MAP_SIZE - 2 || tree.y >= MAP_SIZE - 2) continue;
                logicalMap[0][tree.y][tree.x] = 1;
                setTreeNode(tree.x, tree.y, 0, tree.nodeId);
            }

            rebuildTreeNodes();
        }

        function loadChunk(cx, cy) {
            const group = new THREE.Group();
            const startX = cx * CHUNK_SIZE;
            const startY = cy * CHUNK_SIZE;
            const endX = startX + CHUNK_SIZE;
            const endY = startY + CHUNK_SIZE;

            for (let z = 0; z < PLANES; z++) {
                const planeGroup = new THREE.Group();
                planeGroup.userData.z = z; 
                const Z_OFFSET = z * 3.0;
                if (z === 0) {
                    const terrainGeo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, CHUNK_SIZE, CHUNK_SIZE);
                    terrainGeo.rotateX(-Math.PI / 2);

                    const isNaturalTile = (tileType) => tileType === 0 || tileType === 1 || tileType === 2 || tileType === 4 || tileType === 20 || tileType === 21 || tileType === 22;
                    const sampleTileHeight = (tx, ty) => {
                        if (tx < 0 || ty < 0 || tx >= MAP_SIZE || ty >= MAP_SIZE) return 0;
                        const tt = logicalMap[0][ty][tx];
                        return isNaturalTile(tt) ? heightMap[0][ty][tx] : 0;
                    };

                    const positions = terrainGeo.attributes.position;
                    for (let vy = 0; vy <= CHUNK_SIZE; vy++) {
                        for (let vx = 0; vx <= CHUNK_SIZE; vx++) {
                            const idx = (vy * (CHUNK_SIZE + 1)) + vx;
                            const cornerX = startX - 0.5 + vx;
                            const cornerY = startY - 0.5 + vy;

                            const tx0 = Math.floor(cornerX);
                            const ty0 = Math.floor(cornerY);
                            const tx1 = tx0 + 1;
                            const ty1 = ty0 + 1;

                            const h00 = sampleTileHeight(tx0, ty0);
                            const h10 = sampleTileHeight(tx1, ty0);
                            const h01 = sampleTileHeight(tx0, ty1);
                            const h11 = sampleTileHeight(tx1, ty1);
                            const h = (h00 + h10 + h01 + h11) * 0.25;

                            positions.setY(idx, h);
                        }
                    }
                    positions.needsUpdate = true;
                    terrainGeo.computeVertexNormals();

                    const terrainMesh = new THREE.Mesh(terrainGeo, sharedMaterials.grassTile);
                    terrainMesh.position.set(startX + CHUNK_SIZE / 2 - 0.5, 0, startY + CHUNK_SIZE / 2 - 0.5);
                    terrainMesh.receiveShadow = true;
                    terrainMesh.castShadow = false;
                    terrainMesh.userData = { type: 'GROUND', z: 0 };
                    planeGroup.add(terrainMesh);
                    environmentMeshes.push(terrainMesh);
                }

                let tCount = 0, rCopperCount = 0, rTinCount = 0, rDepletedCount = 0, rRuneEssenceCount = 0, wCount = 0, cCount = 0;
                for (let y = startY; y < endY; y++) {
                    for (let x = startX; x < endX; x++) {
                        let tile = logicalMap[z][y][x];
                        if (tile === 1 || tile === 4) tCount++;
                        else if (tile === 2) {
                            const rockNode = getRockNodeAt(x, y, z);
                            if (rockNode && rockNode.depletedUntilTick > currentTick) rDepletedCount++;
                            else if (rockNode && rockNode.oreType === 'rune_essence') rRuneEssenceCount++;
                            else if (rockNode && rockNode.oreType === 'tin') rTinCount++;
                            else rCopperCount++;
                        }
                        else if (tile === 11) wCount++;
                        else if (tile === 12) cCount++;
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
                        mesh.castShadow = false; mesh.matrixAutoUpdate = false;
                        mesh.userData = { instanceMap: tData.treeMap };
                        planeGroup.add(mesh); environmentMeshes.push(mesh);
                    });
                }
                let rData = { rockCopperMap: [], rockTinMap: [], rockDepletedMap: [], rockRuneEssenceMap: [], iRockCopper: null, iRockTin: null, iRockDepleted: null, iRockRuneEssence: null };
                if (rCopperCount > 0) {
                    rData.iRockCopper = new THREE.InstancedMesh(sharedGeometries.rockCopper, sharedMaterials.rockCopper, rCopperCount);
                    rData.iRockCopper.castShadow = false; rData.iRockCopper.matrixAutoUpdate = false;
                    rData.iRockCopper.userData = { instanceMap: rData.rockCopperMap };
                    planeGroup.add(rData.iRockCopper); environmentMeshes.push(rData.iRockCopper);
                }
                if (rTinCount > 0) {
                    rData.iRockTin = new THREE.InstancedMesh(sharedGeometries.rockTin, sharedMaterials.rockTin, rTinCount);
                    rData.iRockTin.castShadow = false; rData.iRockTin.matrixAutoUpdate = false;
                    rData.iRockTin.userData = { instanceMap: rData.rockTinMap };
                    planeGroup.add(rData.iRockTin); environmentMeshes.push(rData.iRockTin);
                }
                if (rDepletedCount > 0) {
                    rData.iRockDepleted = new THREE.InstancedMesh(sharedGeometries.rockDepleted, sharedMaterials.rockDepleted, rDepletedCount);
                    rData.iRockDepleted.castShadow = false; rData.iRockDepleted.matrixAutoUpdate = false;
                    rData.iRockDepleted.userData = { instanceMap: rData.rockDepletedMap };
                    planeGroup.add(rData.iRockDepleted); environmentMeshes.push(rData.iRockDepleted);
                }
                if (rRuneEssenceCount > 0) {
                    rData.iRockRuneEssence = new THREE.InstancedMesh(sharedGeometries.rockRuneEssence, sharedMaterials.rockRuneEssence, rRuneEssenceCount);
                    rData.iRockRuneEssence.castShadow = false; rData.iRockRuneEssence.matrixAutoUpdate = false;
                    rData.iRockRuneEssence.userData = { instanceMap: rData.rockRuneEssenceMap };
                    planeGroup.add(rData.iRockRuneEssence); environmentMeshes.push(rData.iRockRuneEssence);
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
                let tIdx = 0, rCopperIdx = 0, rTinIdx = 0, rDepletedIdx = 0, rRuneEssenceIdx = 0, wIdx = 0, cIdx = 0;

                for (let y = startY; y < endY; y++) {
                    for (let x = startX; x < endX; x++) {
                        const tile = logicalMap[z][y][x];
                        const h = heightMap[z][y][x] + Z_OFFSET; 

                        if (tile === 1 || tile === 4) {
                            const treeNode = getTreeNodeAt(x, y, z);
                            const treeNodeId = treeNode && treeNode.nodeId ? treeNode.nodeId : 'normal_tree';
                            dummyTransform.position.set(x, h, y);
                            dummyTransform.rotation.set(0, Math.random() * Math.PI * 2, 0);
                            setTreeVisualState(tData, tIdx, {
                                nodeId: treeNodeId,
                                position: dummyTransform.position.clone(),
                                quaternion: dummyTransform.quaternion.clone(),
                                isStump: tile === 4
                            });

                            tData.treeMap[tIdx] = { type: 'TREE', gridX: x, gridY: y, z: z, nodeId: treeNodeId };
                            tIdx++;
                        } else if (tile === 2) {
                            const rockNode = getRockNodeAt(x, y, z);
                            const depleted = !!(rockNode && rockNode.depletedUntilTick > currentTick);
                            dummyTransform.position.set(x, h, y);
                            dummyTransform.rotation.set(0, Math.random() * Math.PI, 0);
                            dummyTransform.updateMatrix();

                            if (depleted) {
                                if (rData.iRockDepleted) {
                                    rData.iRockDepleted.setMatrixAt(rDepletedIdx, dummyTransform.matrix);
                                    rData.rockDepletedMap[rDepletedIdx] = { type: 'ROCK', gridX: x, gridY: y, z: z, oreType: 'depleted', name: 'Depleted rock' };
                                    rDepletedIdx++;
                                }
                            } else if (rockNode && rockNode.oreType === 'rune_essence') {
                                if (rData.iRockRuneEssence) {
                                    rData.iRockRuneEssence.setMatrixAt(rRuneEssenceIdx, dummyTransform.matrix);
                                    rData.rockRuneEssenceMap[rRuneEssenceIdx] = { type: 'ROCK', gridX: x, gridY: y, z: z, oreType: 'rune_essence', name: getRockDisplayName('rune_essence') };
                                    rRuneEssenceIdx++;
                                }
                            } else if (rockNode && rockNode.oreType === 'tin') {
                                if (rData.iRockTin) {
                                    rData.iRockTin.setMatrixAt(rTinIdx, dummyTransform.matrix);
                                    rData.rockTinMap[rTinIdx] = { type: 'ROCK', gridX: x, gridY: y, z: z, oreType: 'tin', name: getRockDisplayName('tin') };
                                    rTinIdx++;
                                }
                            } else {
                                if (rData.iRockCopper) {
                                    const oreType = (rockNode && rockNode.oreType) ? rockNode.oreType : 'copper';
                                    rData.iRockCopper.setMatrixAt(rCopperIdx, dummyTransform.matrix);
                                    rData.iRockCopper.setColorAt(rCopperIdx, new THREE.Color(getRockColorHex(oreType)));
                                    rData.rockCopperMap[rCopperIdx] = { type: 'ROCK', gridX: x, gridY: y, z: z, oreType: oreType, name: getRockDisplayName(oreType) };
                                    rCopperIdx++;
                                }
                            }
                        } else if (tile === 11) { // Wall (Anchored to base)
                            const isCastleTile = (tx, ty) => {
                                if (tx < 0 || ty < 0 || tx >= MAP_SIZE || ty >= MAP_SIZE) return false;
                                const neighborTile = logicalMap[z][ty][tx];
                                return neighborTile === 11 || neighborTile === 12;
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
                        } else if (tile === 12) { // Tower (Anchored to base)
                            dummyTransform.position.set(x, Z_OFFSET, y);
                            dummyTransform.rotation.set(0, 0, 0); dummyTransform.scale.set(1, 1, 1); dummyTransform.updateMatrix();
                            castleData.iTower.setMatrixAt(cIdx, dummyTransform.matrix);
                            castleData.towerMap[cIdx] = { type: 'TOWER', gridX: x, gridY: y, z: z }; cIdx++;
                                                } else if (tile === 21 || tile === 22) {
                            // Keep a stable water surface so deep beds do not expose grass through the center channel.
                            const waterSurfaceH = Z_OFFSET + Math.max(-0.08, heightMap[z][y][x] + 0.01);
                            const water = new THREE.Mesh(sharedGeometries.waterPlane, tile === 22 ? sharedMaterials.waterDeep : sharedMaterials.waterShallow);
                            water.position.set(x, waterSurfaceH, y);
                            water.scale.set(1.08, 1, 1.08);
                            water.rotation.y = (((x * 33391) + (y * 12763)) % 4) * (Math.PI / 2);
                            water.userData = { type: 'WATER', gridX: x, gridY: y, z: z };
                            water.receiveShadow = false;
                            water.castShadow = false;
                            planeGroup.add(water);
                            environmentMeshes.push(water);

                            // Beachy outer edge on water tiles (visual only, no transition tile logic).
                            const isLand = (tx, ty) => {
                                if (tx < 0 || ty < 0 || tx >= MAP_SIZE || ty >= MAP_SIZE) return true;
                                const t = logicalMap[z][ty][tx];
                                return !(t === 21 || t === 22);
                            };
                            const dirs = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];
                            for (let di = 0; di < dirs.length; di++) {
                                const d = dirs[di];
                                if (!isLand(x + d.dx, y + d.dy)) continue;
                                const rimGeo = d.dx !== 0 ? sharedGeometries.shoreHalfEW : sharedGeometries.shoreHalfNS;
                                const rim = new THREE.Mesh(rimGeo, sharedMaterials.shoreTile);
                                rim.position.set(x + (d.dx * 0.25), waterSurfaceH + 0.0015, y + (d.dy * 0.25));
                                rim.scale.set(1.10, 1, 1.10);
                                rim.userData = { type: 'WATER', gridX: x, gridY: y, z: z };
                                rim.receiveShadow = false;
                                rim.castShadow = false;
                                planeGroup.add(rim);

                            }
                        } else if (tile === 10) { // Dummy
                            const dummyGroup = new THREE.Group(); dummyGroup.position.set(x, h, y);
                            const dummyPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.0), new THREE.MeshLambertMaterial({color: 0x5c4033})); dummyPost.position.y = 0.5; dummyPost.castShadow = true;
                            const dummyBody = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), new THREE.MeshLambertMaterial({color: 0xddddaa})); dummyBody.position.y = 1.0; dummyBody.castShadow = true;
                            const dummyHitbox = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 1), new THREE.MeshBasicMaterial({visible: false})); dummyHitbox.position.y = 0.75;
                            dummyGroup.add(dummyPost, dummyBody, dummyHitbox);
                            dummyGroup.children.forEach(c => { c.userData = { type: 'DUMMY', gridX: x, gridY: y, z: z }; environmentMeshes.push(c); });
                            planeGroup.add(dummyGroup);
                            
                            // Explicitly build floor beneath Dummy
                            const floorHeight = heightMap[z][y][x];
                            if (floorHeight > 0) {
                                const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(1, floorHeight, 1), sharedMaterials.floor7);
                                floorMesh.position.set(x, Z_OFFSET + (floorHeight / 2), y);
                                floorMesh.receiveShadow = true; floorMesh.castShadow = true; 
                                floorMesh.userData = { type: 'GROUND', gridX: x, gridY: y, z: z };
                                planeGroup.add(floorMesh); environmentMeshes.push(floorMesh);
                            }
                        } else if (tile === 17) { // Shop Counter
                            const counterGroup = new THREE.Group(); counterGroup.position.set(x, h, y);
                            
                            let rotY = 0;
                            if ((y > 0 && logicalMap[z][y-1][x] === 17) || (y < MAP_SIZE - 1 && logicalMap[z][y+1][x] === 17)) {
                                rotY = Math.PI / 2;
                            }
                            counterGroup.rotation.y = rotY;

                            const counter = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.8), sharedMaterials.boothWood); 
                            counter.position.y = 0.5; counter.castShadow = true; counter.receiveShadow = true; 
                            
                            const glass = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.7), new THREE.MeshLambertMaterial({color: 0x88ccff, transparent: true, opacity: 0.6}));
                            glass.position.y = 1.025; glass.receiveShadow = true;
                            
                            counterGroup.add(counter, glass);
                            counterGroup.children.forEach(c => { c.userData = { type: 'SHOP_COUNTER', gridX: x, gridY: y, z: z }; environmentMeshes.push(c); });
                            planeGroup.add(counterGroup);
                            
                            // Explicitly build floor beneath Counter
                            const floorHeight = heightMap[z][y][x];
                            if (floorHeight > 0) {
                                const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(1, floorHeight, 1), sharedMaterials.floor7);
                                floorMesh.position.set(x, Z_OFFSET + (floorHeight / 2), y);
                                floorMesh.receiveShadow = true; floorMesh.castShadow = true; 
                                floorMesh.userData = { type: 'GROUND', gridX: x, gridY: y, z: z };
                                planeGroup.add(floorMesh); environmentMeshes.push(floorMesh);
                            }
                        } else if (tile === 7 || tile === 6 || tile === 8 || tile === 9 || tile === 16) { // Floors (Now includes Bank & Solid NPCs bases)
                            let floorMat = sharedMaterials.floor7; // default to stone
                            if (tile === 6) floorMat = sharedMaterials.floor6;
                            if (tile === 8) floorMat = sharedMaterials.floor8;
                            
                            const floorHeight = heightMap[z][y][x];
                            if (floorHeight > 0) {
                                const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(1, floorHeight, 1), floorMat);
                                floorMesh.position.set(x, Z_OFFSET + (floorHeight / 2), y);
                                floorMesh.receiveShadow = true; floorMesh.castShadow = true; 
                                floorMesh.userData = { type: 'GROUND', gridX: x, gridY: y, z: z };
                                planeGroup.add(floorMesh); environmentMeshes.push(floorMesh);
                            }
                        } else if (tile === 13 || tile === 14) { // Stairs Up/Down
                            const isUp = tile === 13;
                            const floorHeight = heightMap[z][y][x] || 0.5;
                            const stairMesh = new THREE.Mesh(new THREE.BoxGeometry(1, floorHeight, 1), isUp ? sharedMaterials.stairsUp : sharedMaterials.stairsDown);
                            stairMesh.position.set(x, Z_OFFSET + (floorHeight / 2), y);
                            stairMesh.castShadow = true; stairMesh.receiveShadow = true;
                            stairMesh.userData = { type: isUp ? 'STAIRS_UP' : 'STAIRS_DOWN', gridX: x, gridY: y, z: z };
                            planeGroup.add(stairMesh); environmentMeshes.push(stairMesh);
                        } else if (tile === 15) { // Seamless Walkable Stairs
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
                
                if (tCount > 0) markTreeVisualsDirty(tData);
                if (rCopperCount > 0 && rData.iRockCopper) { rData.iRockCopper.instanceMatrix.needsUpdate = true; if (rData.iRockCopper.instanceColor) rData.iRockCopper.instanceColor.needsUpdate = true; }
                if (rTinCount > 0 && rData.iRockTin) rData.iRockTin.instanceMatrix.needsUpdate = true;
                if (rDepletedCount > 0 && rData.iRockDepleted) rData.iRockDepleted.instanceMatrix.needsUpdate = true;
                if (rRuneEssenceCount > 0 && rData.iRockRuneEssence) rData.iRockRuneEssence.instanceMatrix.needsUpdate = true;
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
                        const hitbox = new THREE.Mesh(new THREE.BoxGeometry(bodyLocalW, 1.6, bodyLocalD), new THREE.MeshBasicMaterial({ visible: false }));
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
                        const hitbox = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.8, 1.3), new THREE.MeshBasicMaterial({ visible: false }));
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
                        const stoneMat = new THREE.MeshLambertMaterial({ color: 0x5e5449, flatShading: true });
                        const coalMat = new THREE.MeshLambertMaterial({ color: 0x2d2320, flatShading: true });
                        const emberMat = new THREE.MeshLambertMaterial({ color: 0xff7a1a, emissive: 0x8a2f00 });
                        const coreMat = new THREE.MeshLambertMaterial({ color: 0xffc04d, emissive: 0x8a4d00 });

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
                            new THREE.MeshBasicMaterial({ visible: false })
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
                        const doorGroup = new THREE.Group();
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
                        const hitbox = new THREE.Mesh(new THREE.BoxGeometry(hw, 2, hd), new THREE.MeshBasicMaterial({visible: false}));
                        hitbox.position.set(meshOffsetX, 1.0, meshOffsetZ);
                        
                        doorGroup.add(doorMesh, hitbox);
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

                npcsToRender.forEach(npc => {
                    if (npc.x >= startX && npc.x < endX && npc.y >= startY && npc.y < endY && npc.z === z) {
                        let dummy = createHumanoidModel(npc.type); 
                        dummy.position.set(npc.x, heightMap[z][npc.y][npc.x] + Z_OFFSET, npc.y);
                        
                        if (Number.isFinite(npc.facingYaw)) {
                            dummy.rotation.y = npc.facingYaw;
                        } else if (npc.name === 'Shopkeeper') {
                            dummy.rotation.y = Math.PI / 2; // Face East towards entrance
                        } else if (npc.name === 'Banker') {
                            dummy.rotation.y = 0; // Face south toward players
                        } else {
                            dummy.rotation.y = Math.PI; // Face outwards
                        }
                        
                        // Add interactive hitbox to NPCs
                        const hitbox = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshBasicMaterial({visible: false}));
                        hitbox.position.y = 1.0;
                        const npcUid = { name: npc.name, action: npc.action || (npc.name === 'Shopkeeper' ? 'Trade' : 'Talk-to') };
                        if (npc.merchantId) npcUid.merchantId = npc.merchantId;
                        hitbox.userData = { type: 'NPC', gridX: npc.x, gridY: npc.y, z: z, name: npc.name, uid: npcUid };
                        dummy.add(hitbox);
                        environmentMeshes.push(hitbox);

                        planeGroup.add(dummy);
                    }
                });

                group.add(planeGroup);
            }
            
            scene.add(group);
            chunkGroups[`${cx},${cy}`] = group;
        }

        function unloadChunk(key) {
            const group = chunkGroups[key];
            if (group) {
                scene.remove(group);
                environmentMeshes = environmentMeshes.filter(m => {
                    let parent = m;
                    while (parent) {
                        if (parent === group) return false;
                        parent = parent.parent;
                    }
                    return true;
                });
                delete chunkGroups[key];
            }
        }

        function manageChunks() {
            let pX = isFreeCam ? freeCamTarget.x : playerRig.position.x;
            let pZ = isFreeCam ? freeCamTarget.z : playerRig.position.z;
            let pCX = Math.floor(pX / CHUNK_SIZE);
            let pCY = Math.floor(pZ / CHUNK_SIZE);
            
            let desiredChunks = new Set();
            for(let dy = -1; dy <= 1; dy++) {
                for(let dx = -1; dx <= 1; dx++) {
                    let cx = pCX + dx, cy = pCY + dy;
                    if(cx >= 0 && cx < WORLD_CHUNKS_X && cy >= 0 && cy < WORLD_CHUNKS_Y) desiredChunks.add(`${cx},${cy}`);
                }
            }
            
            desiredChunks.forEach(key => {
                if(!loadedChunks.has(key)) {
                    let parts = key.split(',');
                    loadChunk(parseInt(parts[0]), parseInt(parts[1]));
                    loadedChunks.add(key);
                }
            });
            
            loadedChunks.forEach(key => {
                if(!desiredChunks.has(key)) {
                    unloadChunk(key);
                    loadedChunks.delete(key);
                }
            });
        }

        function build3DEnvironment() {
            initSharedAssets();
        }

        // Modified to render top-down taking planes into account
        function updateMinimapCanvas() {
            if (!offscreenMapCanvas) {
                offscreenMapCanvas = document.createElement('canvas'); offscreenMapCanvas.width = MAP_SIZE; offscreenMapCanvas.height = MAP_SIZE;
                offscreenMapCtx = offscreenMapCanvas.getContext('2d');
            }
            offscreenMapCtx.fillStyle = '#000';
            offscreenMapCtx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);
            
            for (let layer = 0; layer <= playerState.z; layer++) {
                for (let y = 0; y < MAP_SIZE; y++) {
                    for (let x = 0; x < MAP_SIZE; x++) {
                        const tile = logicalMap[layer][y][x];
                        
                        if (tile === 0 && layer > 0) continue; 
                        
                        if (tile === 0 && layer === 0) offscreenMapCtx.fillStyle = '#2d4a22'; 
                        else if (tile === 1 || tile === 4) offscreenMapCtx.fillStyle = '#1e752d'; 
                        else if (tile === 2) offscreenMapCtx.fillStyle = '#6b7280'; 
                        else if (tile === 6 || tile === 17) offscreenMapCtx.fillStyle = '#654321'; 
                        else if (tile === 7 || tile === 15 || tile === 16) offscreenMapCtx.fillStyle = '#666666'; 
                        else if (tile === 8) offscreenMapCtx.fillStyle = '#800000'; 
                        else if (tile === 9) offscreenMapCtx.fillStyle = '#d4af37'; 
                        else if (tile === 10) offscreenMapCtx.fillStyle = '#ff0000'; 
                        else if (tile === 11 || tile === 12) offscreenMapCtx.fillStyle = '#4b5563'; 
                        else if (tile === 13) offscreenMapCtx.fillStyle = '#aaaaaa'; 
                        else if (tile === 14) offscreenMapCtx.fillStyle = '#444444'; 
                        else if (tile === 20) offscreenMapCtx.fillStyle = '#9b8a5f'; // Shore
                        else if (tile === 21) offscreenMapCtx.fillStyle = '#2c75a8'; // Shallow Water
                        else if (tile === 22) offscreenMapCtx.fillStyle = '#184b78'; // Deep Water
                        else if (tile === 18 || tile === 19) offscreenMapCtx.fillStyle = '#8b5a2b'; // Door
                        
                        if (tile !== 5 && tile !== 0) offscreenMapCtx.fillRect(x, y, 1, 1);
                        else if (layer === 0) offscreenMapCtx.fillRect(x, y, 1, 1);
                    }
                }
            }
        }

        function initMinimap() {
            updateMinimapCanvas();
            const minimapCanvas = document.getElementById('minimap');
            minimapCanvas.addEventListener('contextmenu', e => e.preventDefault());
            minimapCanvas.addEventListener('wheel', (e) => { e.preventDefault(); minimapZoom += Math.sign(e.deltaY) * -0.2; minimapZoom = Math.max(1.0, Math.min(20.0, minimapZoom)); });
            minimapCanvas.addEventListener('mousedown', (e) => {
                const rect = minimapCanvas.getBoundingClientRect();
                const scaleX = minimapCanvas.width / rect.width; const scaleY = minimapCanvas.height / rect.height;
                const mouseX = (e.clientX - rect.left) * scaleX; const mouseY = (e.clientY - rect.top) * scaleY;
                if (e.button === 2) { isMinimapDragging = true; minimapDragStart = { x: mouseX, y: mouseY }; minimapDragEnd = { x: mouseX, y: mouseY }; } 
                else if (e.button === 0) { 
                    const selected = getSelectedUseItem();
                    if (selected) {
                        clearSelectedUse();
                        return;
                    }
                    const canvasCenter = minimapCanvas.width / 2; const ppt = (minimapCanvas.width / 100) * minimapZoom; 
                    const gridX = Math.floor(minimapTargetX + 0.5 + (mouseX - canvasCenter) / ppt); const gridY = Math.floor(minimapTargetY + 0.5 + (mouseY - canvasCenter) / ppt);
                    if (gridX >= 0 && gridX < MAP_SIZE && gridY >= 0 && gridY < MAP_SIZE) {
                        // Ensure we check walkability on the PLAYER'S CURRENT PLANE
                        if (WALKABLE_TILES.includes(logicalMap[playerState.z][gridY][gridX])) { queueAction('WALK', gridX, gridY, null); spawnClickMarker(new THREE.Vector3(gridX + 0.5, heightMap[playerState.z][gridY][gridX] + playerState.z * 3.0, gridY + 0.5), false); }
                    }
                }
            });
            minimapCanvas.addEventListener('mousemove', (e) => {
                if (!isMinimapDragging) return; const rect = minimapCanvas.getBoundingClientRect();
                minimapDragEnd.x = (e.clientX - rect.left) * (minimapCanvas.width / rect.width); minimapDragEnd.y = (e.clientY - rect.top) * (minimapCanvas.height / rect.height);
            });
            minimapCanvas.addEventListener('mouseup', (e) => {
                if (e.button === 2 && isMinimapDragging) {
                    isMinimapDragging = false;
                    const dx = minimapDragEnd.x - minimapDragStart.x; const dy = minimapDragEnd.y - minimapDragStart.y;
                    if (Math.sqrt(dx*dx + dy*dy) < 5) { minimapLocked = true; minimapZoom = 1.0; } 
                    else {
                        const canvasCenter = minimapCanvas.width / 2; const ppt = (minimapCanvas.width / 100) * minimapZoom; 
                        minimapTargetX = minimapTargetX + (((minimapDragStart.x + minimapDragEnd.x) / 2) - canvasCenter) / ppt;
                        minimapTargetY = minimapTargetY + (((minimapDragStart.y + minimapDragEnd.y) / 2) - canvasCenter) / ppt;
                        minimapLocked = false; minimapZoom = Math.max(1.0, Math.min(20.0, minimapZoom * (minimapCanvas.width / Math.max(Math.abs(dx), Math.abs(dy))))); 
                    }
                }
            });
            minimapCanvas.addEventListener('mouseleave', () => { isMinimapDragging = false; });
        }

        function updateMinimap() {
            const canvas = document.getElementById('minimap'); const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            const canvasCenter = canvas.width / 2; const ppt = (canvas.width / 100) * minimapZoom;
            ctx.save(); ctx.translate(canvasCenter, canvasCenter); ctx.scale(ppt, ppt); ctx.translate(-minimapTargetX - 0.5, -minimapTargetY - 0.5); 
            ctx.drawImage(offscreenMapCanvas, 0, 0);
            
            ctx.fillStyle = 'rgba(255, 255, 0, 0.7)'; 
            clickMarkers.forEach(m => { if (Math.abs(m.mesh.position.y - (playerState.z * 3.0)) < 2.0) ctx.fillRect(m.mesh.position.x, m.mesh.position.z, 1, 1); });
            ctx.fillStyle = '#ff00aa'; 
            groundItems.forEach(gi => { if (gi.z === playerState.z) ctx.fillRect(gi.x, gi.y, 1, 1); });
            
            ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(playerRig.position.x + 0.5, playerRig.position.z + 0.5, 3 / ppt, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 2 / ppt; ctx.beginPath(); ctx.moveTo(playerRig.position.x + 0.5, playerRig.position.z + 0.5); ctx.lineTo(playerRig.position.x + 0.5 + Math.sin(playerRig.rotation.y) * (8 / ppt), playerRig.position.z + 0.5 + Math.cos(playerRig.rotation.y) * (8 / ppt)); ctx.stroke(); ctx.restore();
            if (isMinimapDragging) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; ctx.lineWidth = 1; ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                const x = Math.min(minimapDragStart.x, minimapDragEnd.x); const y = Math.min(minimapDragStart.y, minimapDragEnd.y); const w = Math.abs(minimapDragEnd.x - minimapDragStart.x); const h = Math.abs(minimapDragEnd.y - minimapDragStart.y);
                ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
            }
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
            let group = chunkGroups[`${cx},${cy}`];
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
            let group = chunkGroups[`${cx},${cy}`];

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
        window.tickFireLifecycle = tickFireLifecycle;
        window.updateFires = updateFires;
        window.updateGroundItems = updateGroundItems;
        window.updateMiningPoseReferences = updateMiningPoseReferences;
        window.updateMinimap = updateMinimap;
        window.updateStats = updateStats;
        window.refreshSkillUi = refreshSkillUi;
