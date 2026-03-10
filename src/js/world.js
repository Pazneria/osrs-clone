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
            sharedGeometries.leaf1 = new THREE.ConeGeometry(0.95, 1.2, 6).translate(0, 2.65, 0);
            sharedGeometries.leaf2 = new THREE.ConeGeometry(0.72, 0.95, 6).translate(0.35, 2.2, 0.25);
            sharedGeometries.leaf3 = new THREE.ConeGeometry(0.72, 0.95, 6).translate(-0.35, 2.2, -0.25);
            sharedGeometries.leaf4 = new THREE.ConeGeometry(0.65, 0.85, 6).translate(-0.1, 2.35, 0.38);
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
            sharedMaterials.rockCopper = new THREE.MeshLambertMaterial({ color: 0x8f6b58, flatShading: true });
            sharedMaterials.rockTin = new THREE.MeshLambertMaterial({ color: 0x8e99a4, flatShading: true });
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
            const bCtx = bankCanvas.getContext('2d'); bCtx.fillStyle = '#000000'; bCtx.fillRect(0,0,256,64); bCtx.fillStyle = '#c8aa6e'; bCtx.font = 'bold 48px monospace'; bCtx.textAlign = 'center'; bCtx.textBaseline = 'middle'; bCtx.fillText('BANK', 128, 36);
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

        const MAX_SKILL_LEVEL = 99;
        const FIRE_STEP_DIR = { x: 0, y: 1 };
        const FIRE_LIFETIME_TICKS = 50;

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
                runecrafting: 'rc'
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
        function lightFireAtCurrentTile() {
            const x = playerState.x;
            const y = playerState.y;
            const z = playerState.z;

            if (activeFires.some(f => f.x === x && f.y === y && f.z === z)) {
                addChatMessage('There is already a fire here.', 'warn');
                return false;
            }

            const group = new THREE.Group();
            const terrainHeight = heightMap[z][y][x] + (z * 3.0);
            group.position.set(x, terrainHeight + 0.05, y);

            const logMat = new THREE.MeshLambertMaterial({ color: 0x4b2e17 });
            const logGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.55, 8);
            logGeo.rotateZ(Math.PI / 2);
            const logA = new THREE.Mesh(logGeo, logMat); logA.position.set(0, 0.03, 0.08);
            const logB = new THREE.Mesh(logGeo, logMat); logB.position.set(0, 0.03, -0.08);

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

            let cx = Math.floor(x / CHUNK_SIZE);
            let cy = Math.floor(y / CHUNK_SIZE);
            if (chunkGroups[`${cx},${cy}`]) {
                let pGroup = chunkGroups[`${cx},${cy}`].children.find(pg => pg.userData.z === z);
                if (pGroup) pGroup.add(group); else scene.add(group);
            } else scene.add(group);

            environmentMeshes.push(logA, logB, flame);
            activeFires.push({
                x, y, z, mesh: group, flame,
                hitMeshes: [logA, logB, flame],
                expiresTick: currentTick + FIRE_LIFETIME_TICKS,
                phase: Math.random() * Math.PI * 2
            });
            return true;
        }

        function updateFires(frameNow) {
            for (let i = activeFires.length - 1; i >= 0; i--) {
                const fire = activeFires[i];

                if (currentTick >= fire.expiresTick) {
                    if (fire.mesh.parent) fire.mesh.parent.remove(fire.mesh);
                    else scene.remove(fire.mesh);
                    if (Array.isArray(fire.hitMeshes)) {
                        for (let j = 0; j < fire.hitMeshes.length; j++) {
                            const idx = environmentMeshes.indexOf(fire.hitMeshes[j]);
                            if (idx !== -1) environmentMeshes.splice(idx, 1);
                        }
                    }
                    activeFires.splice(i, 1);
                    continue;
                }

                if (fire.flame) {
                    const t = (frameNow * 0.01) + fire.phase;
                    fire.flame.scale.set(1.0 + Math.sin(t) * 0.12, 1.0 + Math.sin(t * 1.8) * 0.18, 1.0 + Math.cos(t) * 0.12);
                    fire.flame.material.opacity = 0.75 + (Math.sin(t * 1.3) * 0.12);
                }
            }
        }

        function tryStepAfterFire() {
            const nx = playerState.x + FIRE_STEP_DIR.x;
            const ny = playerState.y + FIRE_STEP_DIR.y;
            const z = playerState.z;

            if (nx < 0 || ny < 0 || nx >= MAP_SIZE || ny >= MAP_SIZE) return false;
            if (!WALKABLE_TILES.includes(logicalMap[z][ny][nx])) return false;

            const currentH = heightMap[z][playerState.y][playerState.x];
            const nextH = heightMap[z][ny][nx];
            const tileIsRamp = logicalMap[z][playerState.y][playerState.x] === 15 || logicalMap[z][ny][nx] === 15;
            if (Math.abs(nextH - currentH) > 0.3 && !tileIsRamp) return false;

            if (activeFires.some(f => f.x === nx && f.y === ny && f.z === z)) return false;

            playerState.prevX = playerState.x;
            playerState.prevY = playerState.y;
            playerState.x = nx;
            playerState.y = ny;
            playerState.path = [];
            return true;
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
        function eatItem(invIndex) {
            const invSlot = inventory[invIndex];
            if (!invSlot) return;

            const item = invSlot.itemData;
            invSlot.amount -= 1;
            if (invSlot.amount <= 0) inventory[invIndex] = null;
            if (selectedUse.invIndex === invIndex) clearSelectedUse(false);
            addChatMessage(`You eat the ${item.name}.`, 'game');
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

        function spawnGroundItem(itemData, x, y, z, amount = 1) {
            let existing = groundItems.find(gi => gi.x === x && gi.y === y && gi.z === z && gi.itemData.id === itemData.id);
            if (existing && itemData.stackable) {
                existing.amount += amount;
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
            
            groundItems.push({ itemData, x, y, z, mesh: group, uid, amount: amount });
        }

        // --- THE MULTI-PLANE ENGINE REWRITE ---

        function rockNodeKey(x, y, z = 0) { return z + ':' + x + ',' + y; }

        function isRuneEssenceRockCoordinate(x, y, z = 0) {
            if (!Array.isArray(RUNE_ESSENCE_ROCKS)) return false;
            return RUNE_ESSENCE_ROCKS.some((rock) => rock && rock.x === x && rock.y === y && rock.z === z);
        }

        function oreTypeForTile(x, y, z = 0) {
            if (isRuneEssenceRockCoordinate(x, y, z)) return 'rune_essence';
            const hash = ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
            return (hash & 1) === 0 ? 'copper' : 'tin';
        }

        function rebuildRockNodes() {
            const rebuilt = {};
            for (let z = 0; z < PLANES; z++) {
                for (let y = 0; y < MAP_SIZE; y++) {
                    for (let x = 0; x < MAP_SIZE; x++) {
                        if (logicalMap[z][y][x] === 2) {
                            const key = rockNodeKey(x, y, z);
                            const prev = rockNodes[key];
                            rebuilt[key] = {
                                oreType: prev && prev.oreType ? prev.oreType : oreTypeForTile(x, y, z),
                                depletedUntilTick: prev && prev.depletedUntilTick ? prev.depletedUntilTick : 0
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
                rockNodes[key] = { oreType: oreTypeForTile(x, y, z), depletedUntilTick: 0 };
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
            fishingSpotsToRender = [];
            directionalSignsToRender = [];
            altarCandidatesToRender = [];
            const inTownCore = (x, y) => {
                const inCastle = (x >= 190 && x <= 220 && y >= 190 && y <= 215);
                const inStore = (x >= 177 && x <= 185 && y >= 232 && y <= 240);
                return inCastle || inStore;
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
                        let treeChance = 0.002; let rockChance = 0.001;
                        forestCenters.forEach(c => { let d = Math.hypot(x - c.x, y - c.y); if (d < 25) treeChance += 0.12 * (1 - d / 25); });
                        mineCenters.forEach(c => { let d = Math.hypot(x - c.x, y - c.y); if (d < 18) rockChance += 0.15 * (1 - d / 18); });
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
                    action: 'Trade'
                });
            }

            rebuildRockNodes();

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

            // Randomize rune essence rocks around the world (no fixed castle cluster).
            const runeEssenceTargetCount = 8;
            RUNE_ESSENCE_ROCKS = [];
            let candidateIdx = 0;
            while (RUNE_ESSENCE_ROCKS.length < runeEssenceTargetCount && candidateIdx < allFeatureCandidates.length) {
                const candidate = allFeatureCandidates[candidateIdx++];
                if (!candidate) continue;

                const tooCloseToExisting = RUNE_ESSENCE_ROCKS.some((rock) => Math.hypot(rock.x - candidate.x, rock.y - candidate.y) < 24);
                if (tooCloseToExisting) continue;

                RUNE_ESSENCE_ROCKS.push(candidate);
                logicalMap[candidate.z][candidate.y][candidate.x] = 2;
            }

                        // Place elemental altars at random world tiles, away from rune essence rocks.
            const altarDefs = [
                { label: 'Ember Altar', variant: 4 },
                { label: 'Water Altar', variant: 4 },
                { label: 'Earth Altar', variant: 4 },
                { label: 'Air Altar', variant: 4 }
            ];

            altarCandidatesToRender = [];
            for (let i = 0; i < altarDefs.length && candidateIdx < allFeatureCandidates.length; i++) {
                const def = altarDefs[i];
                let placed = null;

                while (candidateIdx < allFeatureCandidates.length) {
                    const candidate = allFeatureCandidates[candidateIdx++];
                    if (!candidate) continue;

                    const nearRuneEssence = RUNE_ESSENCE_ROCKS.some((rock) => Math.hypot(rock.x - candidate.x, rock.y - candidate.y) < 20);
                    if (nearRuneEssence) continue;

                    const nearOtherAltar = altarCandidatesToRender.some((altar) => Math.hypot(altar.x - candidate.x, altar.y - candidate.y) < 28);
                    if (nearOtherAltar) continue;

                    placed = candidate;
                    break;
                }

                if (!placed) continue;

                altarCandidatesToRender.push({ x: placed.x, y: placed.y, z: placed.z, variant: def.variant, label: def.label });
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

            const emberAltar = altarCandidatesToRender.find((altar) => altar && altar.label === 'Ember Altar') || altarCandidatesToRender[0] || null;
            const airAltar = altarCandidatesToRender.find((altar) => altar && altar.label === 'Air Altar')
                || altarCandidatesToRender[altarCandidatesToRender.length - 1]
                || null;

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
                return altarCandidatesToRender.map((altar) => ({
                    label: altar.label,
                    x: altar.x,
                    y: altar.y,
                    z: altar.z
                }));
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

                let tData = { treeMap: [], iTrunk: null, iLeaf1: null, iLeaf2: null, iLeaf3: null, iLeaf4: null };
                if (tCount > 0) {
                    tData.iTrunk = new THREE.InstancedMesh(sharedGeometries.treeTrunk, sharedMaterials.trunk, tCount);
                    tData.iLeaf1 = new THREE.InstancedMesh(sharedGeometries.leaf1, sharedMaterials.leaves, tCount);
                    tData.iLeaf2 = new THREE.InstancedMesh(sharedGeometries.leaf2, sharedMaterials.leaves, tCount);
                    tData.iLeaf3 = new THREE.InstancedMesh(sharedGeometries.leaf3, sharedMaterials.leaves, tCount);
                    tData.iLeaf4 = new THREE.InstancedMesh(sharedGeometries.leaf4, sharedMaterials.leaves, tCount);
                    [tData.iTrunk, tData.iLeaf1, tData.iLeaf2, tData.iLeaf3, tData.iLeaf4].forEach(mesh => {
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
                            dummyTransform.position.set(x, h, y); 
                            dummyTransform.rotation.set(0, Math.random() * Math.PI * 2, 0); 
                            if(tile === 4) dummyTransform.scale.set(1.1, 0.15, 1.1); else dummyTransform.scale.set(1,1,1);
                            dummyTransform.updateMatrix();
                            tData.iTrunk.setMatrixAt(tIdx, dummyTransform.matrix); 
                            
                            if(tile === 4) dummyTransform.scale.set(0,0,0);
                            dummyTransform.updateMatrix();
                            tData.iLeaf1.setMatrixAt(tIdx, dummyTransform.matrix); tData.iLeaf2.setMatrixAt(tIdx, dummyTransform.matrix);
                            tData.iLeaf3.setMatrixAt(tIdx, dummyTransform.matrix); tData.iLeaf4.setMatrixAt(tIdx, dummyTransform.matrix);
                            
                            tData.treeMap[tIdx] = { type: 'TREE', gridX: x, gridY: y, z: z }; tIdx++;
                        } else if (tile === 2) {
                            const rockNode = getRockNodeAt(x, y, z);
                            const depleted = !!(rockNode && rockNode.depletedUntilTick > currentTick);
                            dummyTransform.position.set(x, h, y);
                            dummyTransform.rotation.set(0, Math.random() * Math.PI, 0);
                            dummyTransform.updateMatrix();

                            if (depleted) {
                                if (rData.iRockDepleted) {
                                    rData.iRockDepleted.setMatrixAt(rDepletedIdx, dummyTransform.matrix);
                                    rData.rockDepletedMap[rDepletedIdx] = { type: 'ROCK', gridX: x, gridY: y, z: z };
                                    rDepletedIdx++;
                                }
                            } else if (rockNode && rockNode.oreType === 'rune_essence') {
                                if (rData.iRockRuneEssence) {
                                    rData.iRockRuneEssence.setMatrixAt(rRuneEssenceIdx, dummyTransform.matrix);
                                    rData.rockRuneEssenceMap[rRuneEssenceIdx] = { type: 'ROCK', gridX: x, gridY: y, z: z };
                                    rRuneEssenceIdx++;
                                }
                            } else if (rockNode && rockNode.oreType === 'tin') {
                                if (rData.iRockTin) {
                                    rData.iRockTin.setMatrixAt(rTinIdx, dummyTransform.matrix);
                                    rData.rockTinMap[rTinIdx] = { type: 'ROCK', gridX: x, gridY: y, z: z };
                                    rTinIdx++;
                                }
                            } else {
                                if (rData.iRockCopper) {
                                    rData.iRockCopper.setMatrixAt(rCopperIdx, dummyTransform.matrix);
                                    rData.rockCopperMap[rCopperIdx] = { type: 'ROCK', gridX: x, gridY: y, z: z };
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
                
                if (tCount > 0) { tData.iTrunk.instanceMatrix.needsUpdate = true; tData.iLeaf1.instanceMatrix.needsUpdate = true; tData.iLeaf2.instanceMatrix.needsUpdate = true; tData.iLeaf3.instanceMatrix.needsUpdate = true; tData.iLeaf4.instanceMatrix.needsUpdate = true; }
                if (rCopperCount > 0 && rData.iRockCopper) rData.iRockCopper.instanceMatrix.needsUpdate = true;
                if (rTinCount > 0 && rData.iRockTin) rData.iRockTin.instanceMatrix.needsUpdate = true;
                if (rDepletedCount > 0 && rData.iRockDepleted) rData.iRockDepleted.instanceMatrix.needsUpdate = true;
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
                        
                        if (npc.name === 'Shopkeeper') {
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

        function chopDownTree(gridX, gridY, z) {
            let cx = Math.floor(gridX / CHUNK_SIZE);
            let cy = Math.floor(gridY / CHUNK_SIZE);
            let group = chunkGroups[`${cx},${cy}`];
            
            if (group) {
                let planeGroup = group.children.find(c => c.userData.z === z);
                if (planeGroup && planeGroup.userData.trees && planeGroup.userData.trees.iTrunk) {
                    let tData = planeGroup.userData.trees;
                    let tIdx = tData.treeMap.findIndex(t => t && t.gridX === gridX && t.gridY === gridY);
                    if (tIdx !== -1) {
                        const dummy = new THREE.Object3D(); const mat = new THREE.Matrix4(); tData.iTrunk.getMatrixAt(tIdx, mat);
                        const pos = new THREE.Vector3(); const quat = new THREE.Quaternion(); const scale = new THREE.Vector3(); mat.decompose(pos, quat, scale);
                        dummy.position.copy(pos); dummy.quaternion.copy(quat); dummy.scale.set(0, 0, 0); dummy.updateMatrix();
                        tData.iLeaf1.setMatrixAt(tIdx, dummy.matrix); tData.iLeaf2.setMatrixAt(tIdx, dummy.matrix); tData.iLeaf3.setMatrixAt(tIdx, dummy.matrix); tData.iLeaf4.setMatrixAt(tIdx, dummy.matrix);
                        dummy.scale.set(1.1, 0.15, 1.1); dummy.position.y = heightMap[z][gridY][gridX] + (z * 3.0); dummy.updateMatrix(); tData.iTrunk.setMatrixAt(tIdx, dummy.matrix);
                        tData.iTrunk.instanceMatrix.needsUpdate = true; tData.iLeaf1.instanceMatrix.needsUpdate = true; tData.iLeaf2.instanceMatrix.needsUpdate = true; tData.iLeaf3.instanceMatrix.needsUpdate = true; tData.iLeaf4.instanceMatrix.needsUpdate = true;
                    }
                }
            }
            logicalMap[z][gridY][gridX] = 4; respawningTrees.push({ x: gridX, y: gridY, z: z, respawnTick: currentTick + 15 });
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
                        const dummy = new THREE.Object3D(); const mat = new THREE.Matrix4(); tData.iTrunk.getMatrixAt(tIdx, mat);
                        const pos = new THREE.Vector3(); const quat = new THREE.Quaternion(); const scale = new THREE.Vector3(); mat.decompose(pos, quat, scale);
                        dummy.position.copy(pos); dummy.quaternion.copy(quat); dummy.position.y = heightMap[z][gridY][gridX] + (z * 3.0); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
                        tData.iLeaf1.setMatrixAt(tIdx, dummy.matrix); tData.iLeaf2.setMatrixAt(tIdx, dummy.matrix); tData.iLeaf3.setMatrixAt(tIdx, dummy.matrix); tData.iLeaf4.setMatrixAt(tIdx, dummy.matrix); tData.iTrunk.setMatrixAt(tIdx, dummy.matrix);
                        tData.iTrunk.instanceMatrix.needsUpdate = true; tData.iLeaf1.instanceMatrix.needsUpdate = true; tData.iLeaf2.instanceMatrix.needsUpdate = true; tData.iLeaf3.instanceMatrix.needsUpdate = true; tData.iLeaf4.instanceMatrix.needsUpdate = true;
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
        window.updateFires = updateFires;
        window.updateMiningPoseReferences = updateMiningPoseReferences;
        window.updateMinimap = updateMinimap;
        window.updateStats = updateStats;
        window.refreshSkillUi = refreshSkillUi;


















































