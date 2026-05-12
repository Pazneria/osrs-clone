(function () {
    const CLICK_MARKER_LIFETIME_MS = 400;
    const HITSPLAT_LIFETIME_MS = 1200;
    const LEVEL_UP_LIFETIME_MS = 1500;
    const RANGED_PROJECTILE_GROUP_NAME = 'ranged-projectile';
    const RANGED_BOW_DRAW_VISUAL_GROUP_NAME = 'pm-rangedBowDrawVisual';
    const RANGED_BOW_NOCK_MS = 150;
    const activeRangedProjectiles = [];

    function getNow(options = {}) {
        return Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
    }

    function spawnClickMarker(options = {}) {
        const THREE = options.THREE;
        const scene = options.scene;
        const clickMarkers = Array.isArray(options.clickMarkers) ? options.clickMarkers : null;
        const position = options.position;
        if (!THREE || !scene || !clickMarkers || !position) return null;

        const color = options.isAction ? 0xff0000 : 0xffff00;
        const group = new THREE.Group();
        const mat = new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true });
        const geo = new THREE.PlaneGeometry(0.6, 0.15);
        const mesh1 = new THREE.Mesh(geo, mat);
        mesh1.rotation.z = Math.PI / 4;
        const mesh2 = new THREE.Mesh(geo, mat);
        mesh2.rotation.z = -Math.PI / 4;
        group.add(mesh1, mesh2);
        group.position.copy(position);
        group.position.y += 0.05;
        group.renderOrder = 999;
        scene.add(group);

        const marker = { mesh: group, createdAt: getNow(options) };
        clickMarkers.push(marker);
        return marker;
    }

    function spawnHitsplat(options = {}) {
        const THREE = options.THREE;
        const documentRef = options.documentRef;
        const activeHitsplats = Array.isArray(options.activeHitsplats) ? options.activeHitsplats : null;
        const playerState = options.playerState;
        const heightMap = options.heightMap;
        if (!THREE || !documentRef || !activeHitsplats || !playerState || !heightMap) return null;

        const amount = Number.isFinite(options.amount) ? options.amount : 0;
        const gridX = options.gridX;
        const gridY = options.gridY;
        const el = documentRef.createElement('div');
        el.className = 'hitsplat';

        const redSplat = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path d=\"M50 0 L65 30 L100 30 L75 55 L85 100 L50 75 L15 100 L25 55 L0 30 L35 30 Z\" fill=\"%23ef4444\"/></svg>')";
        const blueShield = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path d=\"M10 20 L50 0 L90 20 L90 60 L50 100 L10 60 Z\" fill=\"%233b82f6\"/></svg>')";

        el.style.backgroundImage = amount > 0 ? redSplat : blueShield;
        el.innerText = amount;
        documentRef.body.appendChild(el);

        const visualZOffset = playerState.z * 3.0;
        const targetHeight = heightMap[playerState.z] && heightMap[playerState.z][gridY] && heightMap[playerState.z][gridY][gridX]
            ? heightMap[playerState.z][gridY][gridX]
            : 0;
        const worldPos = new THREE.Vector3(gridX, targetHeight + visualZOffset + 1.2, gridY);

        const hitsplat = { el, worldPos, createdAt: getNow(options) };
        activeHitsplats.push(hitsplat);
        return hitsplat;
    }

    function playLevelUpAnimation(options = {}) {
        const THREE = options.THREE;
        const scene = options.scene;
        const levelUpAnimations = Array.isArray(options.levelUpAnimations) ? options.levelUpAnimations : null;
        const type = options.type;
        const target = options.target;
        if (!THREE || !scene || !levelUpAnimations || type !== 8 || !target || !target.position) return null;

        const group = new THREE.Group();
        group.position.copy(target.position);
        for (let i = 0; i < 40; i++) {
            const isCW = i < 20;
            const orb = new THREE.Mesh(
                new THREE.SphereGeometry(0.06, 8, 8),
                new THREE.MeshBasicMaterial({ color: isCW ? 0x00ffff : 0xff00ff })
            );
            orb.userData.angleOffset = isCW ? 0 : Math.PI;
            orb.userData.dir = isCW ? 1 : -1;
            group.add(orb);
        }
        scene.add(group);

        const animation = { mesh: group, start: getNow(options), type: 8, target };
        levelUpAnimations.push(animation);
        return animation;
    }

    function createBasicMaterial(THREERef, color, transparent = false, opacity = 1) {
        return new THREERef.MeshBasicMaterial({
            color,
            transparent,
            opacity,
            depthTest: true
        });
    }

    function orientCylinderSegment(THREERef, mesh, from, to, baseRadiusScale = 1) {
        if (!THREERef || !mesh || !from || !to) return false;
        const delta = new THREERef.Vector3().subVectors(to, from);
        const length = delta.length();
        if (length <= 0.0001) {
            mesh.visible = false;
            return false;
        }
        const midpoint = new THREERef.Vector3().addVectors(from, to).multiplyScalar(0.5);
        mesh.visible = true;
        mesh.position.copy(midpoint);
        mesh.quaternion.setFromUnitVectors(new THREERef.Vector3(0, 1, 0), delta.normalize());
        mesh.scale.set(baseRadiusScale, length, baseRadiusScale);
        return true;
    }

    function clampNumber(value, min, max, fallback = 0) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return fallback;
        return Math.max(min, Math.min(max, numeric));
    }

    function smoothstep(value) {
        const t = clampNumber(value, 0, 1, 0);
        return t * t * (3 - (2 * t));
    }

    function getRangedDrawHandWorldPoint(THREERef, rig) {
        if (!THREERef || !rig) return null;
        const leftTool = rig.leftTool || null;
        if (leftTool && typeof leftTool.getWorldPosition === 'function') {
            if (typeof leftTool.updateWorldMatrix === 'function') leftTool.updateWorldMatrix(true, false);
            return leftTool.getWorldPosition(new THREERef.Vector3());
        }
        const leftLowerArm = rig.leftLowerArm || null;
        if (leftLowerArm && typeof leftLowerArm.localToWorld === 'function') {
            if (typeof leftLowerArm.updateWorldMatrix === 'function') leftLowerArm.updateWorldMatrix(true, false);
            return leftLowerArm.localToWorld(new THREERef.Vector3(0, -0.35, 0));
        }
        return null;
    }

    function resolveRangedDrawHandLocalPoint(THREERef, rig, weaponNode) {
        if (!THREERef || !rig || !weaponNode || typeof weaponNode.worldToLocal !== 'function') return null;
        const handWorldPoint = getRangedDrawHandWorldPoint(THREERef, rig);
        if (!handWorldPoint) return null;
        if (typeof weaponNode.updateWorldMatrix === 'function') weaponNode.updateWorldMatrix(true, false);
        const localPoint = weaponNode.worldToLocal(handWorldPoint.clone());
        return new THREERef.Vector3(
            clampNumber(localPoint.x, -0.08, 0.62, 0.48),
            clampNumber(localPoint.y, -0.24, 0.24, 0),
            clampNumber(localPoint.z, -0.42, 0.04, -0.28)
        );
    }

    function createRangedProjectileMesh(THREERef, ammoItemId = null) {
        const group = new THREERef.Group();
        group.name = RANGED_PROJECTILE_GROUP_NAME;
        const tipColor = /rune/.test(String(ammoItemId || '')) ? 0x8ad7ff
            : (/adamant/.test(String(ammoItemId || '')) ? 0x7fd68a
                : (/mithril/.test(String(ammoItemId || '')) ? 0x85c9d8
                    : (/steel/.test(String(ammoItemId || '')) ? 0xcfd5da
                        : (/iron/.test(String(ammoItemId || '')) ? 0xb8b0a8 : 0xd49a4a))));
        const shaft = new THREERef.Mesh(
            new THREERef.CylinderGeometry(0.018, 0.018, 1, 6),
            createBasicMaterial(THREERef, 0xb7854d)
        );
        shaft.name = 'shaft';
        const tip = new THREERef.Mesh(
            new THREERef.ConeGeometry(0.045, 0.12, 6),
            createBasicMaterial(THREERef, tipColor)
        );
        tip.name = 'tip';
        tip.position.y = 0.41;
        const fletching = new THREERef.Mesh(
            new THREERef.BoxGeometry(0.13, 0.045, 0.025),
            createBasicMaterial(THREERef, 0xefe2c8)
        );
        fletching.name = 'fletching';
        fletching.position.y = -0.36;
        group.add(shaft, tip, fletching);
        return group;
    }

    function createMagicProjectileMesh(THREERef, runeItemId = null) {
        const group = new THREERef.Group();
        group.name = 'magic-projectile';
        const isEmber = /ember/.test(String(runeItemId || ''));
        const coreColor = isEmber ? 0xff8a3d : 0x8ad7ff;
        const haloColor = isEmber ? 0xffd36a : 0xaad7ff;
        const core = new THREERef.Mesh(
            new THREERef.SphereGeometry(0.10, 12, 8),
            createBasicMaterial(THREERef, coreColor)
        );
        core.name = 'core';
        const halo = new THREERef.Mesh(
            new THREERef.TorusGeometry(0.14, 0.012, 6, 16),
            createBasicMaterial(THREERef, haloColor, true, 0.72)
        );
        halo.name = 'halo';
        halo.rotation.x = Math.PI / 2;
        const trail = new THREERef.Mesh(
            new THREERef.CylinderGeometry(0.025, 0.06, 0.34, 8),
            createBasicMaterial(THREERef, coreColor, true, 0.55)
        );
        trail.name = 'trail';
        trail.position.y = -0.18;
        group.add(core, halo, trail);
        return group;
    }

    function spawnRangedProjectile(options = {}) {
        const THREERef = options.THREE;
        const scene = options.scene;
        const start = options.start;
        const end = options.end;
        if (!THREERef || !scene || !start || !end) return null;
        const travel = new THREERef.Vector3().subVectors(end, start);
        if (travel.lengthSq() < 0.0001) return null;
        const mesh = createRangedProjectileMesh(THREERef, options.ammoItemId || null);
        mesh.position.copy(start);
        mesh.quaternion.setFromUnitVectors(new THREERef.Vector3(0, 1, 0), travel.clone().normalize());
        scene.add(mesh);
        const projectile = {
            mesh,
            scene,
            start: start.clone(),
            end: end.clone(),
            startAt: getNow(options) + (Number.isFinite(options.delayMs) ? Math.max(0, options.delayMs) : 0),
            durationMs: Number.isFinite(options.durationMs) ? Math.max(80, options.durationMs) : 360
        };
        mesh.visible = projectile.startAt <= getNow(options);
        activeRangedProjectiles.push(projectile);
        return projectile;
    }

    function spawnMagicProjectile(options = {}) {
        const THREERef = options.THREE;
        const scene = options.scene;
        const start = options.start;
        const end = options.end;
        if (!THREERef || !scene || !start || !end) return null;
        const travel = new THREERef.Vector3().subVectors(end, start);
        if (travel.lengthSq() < 0.0001) return null;
        const mesh = createMagicProjectileMesh(THREERef, options.runeItemId || null);
        mesh.position.copy(start);
        mesh.quaternion.setFromUnitVectors(new THREERef.Vector3(0, 1, 0), travel.clone().normalize());
        scene.add(mesh);
        const projectile = {
            mesh,
            scene,
            start: start.clone(),
            end: end.clone(),
            startAt: getNow(options) + (Number.isFinite(options.delayMs) ? Math.max(0, options.delayMs) : 0),
            durationMs: Number.isFinite(options.durationMs) ? Math.max(80, options.durationMs) : 420
        };
        mesh.visible = projectile.startAt <= getNow(options);
        activeRangedProjectiles.push(projectile);
        return projectile;
    }

    function updateRangedProjectiles(options = {}) {
        const THREERef = options.THREE;
        const frameNow = getNow(options);
        for (let i = activeRangedProjectiles.length - 1; i >= 0; i--) {
            const projectile = activeRangedProjectiles[i];
            const age = frameNow - projectile.startAt;
            if (age < 0) {
                projectile.mesh.visible = false;
                continue;
            }
            if (age > projectile.durationMs) {
                if (projectile.scene) projectile.scene.remove(projectile.mesh);
                activeRangedProjectiles.splice(i, 1);
                continue;
            }
            projectile.mesh.visible = true;
            const t = Math.max(0, Math.min(1, age / projectile.durationMs));
            const eased = 1 - Math.pow(1 - t, 2);
            projectile.mesh.position.lerpVectors(projectile.start, projectile.end, eased);
            projectile.mesh.position.y += Math.sin(t * Math.PI) * 0.18;
            if (THREERef) {
                const direction = new THREERef.Vector3().subVectors(projectile.end, projectile.start).normalize();
                projectile.mesh.quaternion.setFromUnitVectors(new THREERef.Vector3(0, 1, 0), direction);
            }
        }
    }

    function ensureRangedBowDrawVisual(options = {}, weaponNode) {
        const THREERef = options.THREE;
        if (!THREERef || !weaponNode) return null;
        let group = weaponNode.getObjectByName(RANGED_BOW_DRAW_VISUAL_GROUP_NAME);
        if (group && group.parent === weaponNode) return group;
        group = new THREERef.Group();
        group.name = RANGED_BOW_DRAW_VISUAL_GROUP_NAME;
        const stringMaterial = createBasicMaterial(THREERef, 0xf3ead0);
        const shaftMaterial = createBasicMaterial(THREERef, 0xb7854d);
        const tipMaterial = createBasicMaterial(THREERef, 0xd49a4a);
        const createSegment = (name, radius, material) => {
            const mesh = new THREERef.Mesh(new THREERef.CylinderGeometry(radius, radius, 1, 6), material);
            mesh.name = name;
            group.add(mesh);
            return mesh;
        };
        createSegment('stringTop', 0.006, stringMaterial);
        createSegment('stringBottom', 0.006, stringMaterial);
        createSegment('arrowShaft', 0.011, shaftMaterial);
        const arrowTip = new THREERef.Mesh(new THREERef.ConeGeometry(0.026, 0.07, 6), tipMaterial);
        arrowTip.name = 'arrowTip';
        group.add(arrowTip);
        weaponNode.add(group);
        return group;
    }

    function updateRangedBowDrawVisual(options = {}) {
        const THREERef = options.THREE;
        const rig = options.rig || null;
        const drawFrame = options.drawFrame || null;
        const weaponNode = rig ? (rig.rightTool || rig.axe || null) : null;
        const group = ensureRangedBowDrawVisual(options, weaponNode);
        if (!group) return null;
        const active = !!(drawFrame && !drawFrame.released && Number.isFinite(drawFrame.drawProgress));
        group.visible = active;
        if (!active) return group;

        const progress = Math.max(0, Math.min(1, drawFrame.drawProgress));
        const releaseMs = Number.isFinite(drawFrame.releaseMs) ? Math.max(RANGED_BOW_NOCK_MS + 1, drawFrame.releaseMs) : 560;
        const ageMs = Number.isFinite(drawFrame.ageMs) ? Math.max(0, drawFrame.ageMs) : (progress * releaseMs);
        const nockProgress = smoothstep((ageMs - (RANGED_BOW_NOCK_MS - 50)) / 120);
        const fallbackHandPoint = new THREERef.Vector3(0.05 + (0.46 * progress), 0, -0.13 - (0.17 * progress));
        const handPoint = resolveRangedDrawHandLocalPoint(THREERef, rig, weaponNode) || fallbackHandPoint;
        const bowTop = new THREERef.Vector3(0.015, 0.31, -0.11);
        const bowBottom = new THREERef.Vector3(0.015, -0.31, -0.11);
        const stringRestPoint = new THREERef.Vector3(0.025, 0, -0.12);
        const drawPoint = stringRestPoint.clone().lerp(handPoint, nockProgress);
        const arrowTipPoint = new THREERef.Vector3(0.015, 0, 0.34);
        const arrowTailPoint = drawPoint.clone();
        const arrowVisible = ageMs >= RANGED_BOW_NOCK_MS;

        orientCylinderSegment(THREERef, group.getObjectByName('stringTop'), bowTop, drawPoint);
        orientCylinderSegment(THREERef, group.getObjectByName('stringBottom'), bowBottom, drawPoint);
        const arrowShaft = group.getObjectByName('arrowShaft');
        if (arrowShaft) {
            arrowShaft.visible = arrowVisible;
            if (arrowVisible) orientCylinderSegment(THREERef, arrowShaft, arrowTailPoint, arrowTipPoint);
        }
        const arrowTip = group.getObjectByName('arrowTip');
        if (arrowTip) {
            arrowTip.visible = arrowVisible;
            if (arrowVisible) {
                const arrowDirection = new THREERef.Vector3().subVectors(arrowTipPoint, arrowTailPoint).normalize();
                arrowTip.position.copy(arrowTipPoint);
                arrowTip.quaternion.setFromUnitVectors(new THREERef.Vector3(0, 1, 0), arrowDirection);
            }
        }
        group.userData.drawPoint = { x: drawPoint.x, y: drawPoint.y, z: drawPoint.z };
        group.userData.arrowVisible = arrowVisible;
        return group;
    }

    function updatePlayerOverheadText(options = {}) {
        const documentRef = options.documentRef;
        const windowRef = options.windowRef || window;
        const playerRig = options.playerRig;
        const camera = options.camera;
        const playerOverheadText = options.playerOverheadText;
        const bubble = documentRef && typeof documentRef.getElementById === 'function'
            ? documentRef.getElementById('player-overhead-text')
            : null;
        if (!bubble || !playerRig || !camera || !playerOverheadText) return;

        if (!playerOverheadText.text || getNow(options) > playerOverheadText.expiresAt) {
            bubble.classList.add('hidden');
            return;
        }

        bubble.innerText = playerOverheadText.text;

        const pos = playerRig.position.clone();
        pos.y += 2.3;
        pos.project(camera);

        if (pos.z >= 1) {
            bubble.classList.add('hidden');
            return;
        }

        const x = (pos.x * 0.5 + 0.5) * windowRef.innerWidth;
        const y = (pos.y * -0.5 + 0.5) * windowRef.innerHeight;
        bubble.style.left = `${x}px`;
        bubble.style.top = `${y}px`;
        bubble.style.transform = 'translate(-50%, -120%)';
        bubble.classList.remove('hidden');
    }

    function updateClickMarkers(options = {}) {
        const scene = options.scene;
        const camera = options.camera;
        const clickMarkers = Array.isArray(options.clickMarkers) ? options.clickMarkers : null;
        if (!scene || !camera || !clickMarkers) return;
        const frameNow = getNow(options);
        for (let i = clickMarkers.length - 1; i >= 0; i--) {
            const marker = clickMarkers[i];
            const age = frameNow - marker.createdAt;
            if (age > CLICK_MARKER_LIFETIME_MS) {
                scene.remove(marker.mesh);
                clickMarkers.splice(i, 1);
            } else {
                const scale = 1 - (age / CLICK_MARKER_LIFETIME_MS);
                marker.mesh.scale.set(scale, scale, scale);
                marker.mesh.quaternion.copy(camera.quaternion);
            }
        }
    }

    function updateHitsplats(options = {}) {
        const windowRef = options.windowRef || window;
        const camera = options.camera;
        const activeHitsplats = Array.isArray(options.activeHitsplats) ? options.activeHitsplats : null;
        if (!camera || !activeHitsplats) return;
        const frameNow = getNow(options);
        for (let i = activeHitsplats.length - 1; i >= 0; i--) {
            const hs = activeHitsplats[i];
            const age = frameNow - hs.createdAt;
            if (age > HITSPLAT_LIFETIME_MS) {
                hs.el.remove();
                activeHitsplats.splice(i, 1);
            } else {
                const pos = hs.worldPos.clone();
                pos.y += (age / HITSPLAT_LIFETIME_MS) * 0.8;
                pos.project(camera);

                if (pos.z < 1) {
                    const x = (pos.x * 0.5 + 0.5) * windowRef.innerWidth;
                    const y = (pos.y * -0.5 + 0.5) * windowRef.innerHeight;
                    hs.el.style.left = (x - 14) + 'px';
                    hs.el.style.top = (y - 14) + 'px';
                    hs.el.style.opacity = Math.max(0, 1 - (age / HITSPLAT_LIFETIME_MS));
                    hs.el.style.display = 'block';
                } else {
                    hs.el.style.display = 'none';
                }
            }
        }
    }

    function updateLevelUpAnimations(options = {}) {
        const scene = options.scene;
        const levelUpAnimations = Array.isArray(options.levelUpAnimations) ? options.levelUpAnimations : null;
        if (!scene || !levelUpAnimations) return;
        const frameNow = getNow(options);
        for (let i = levelUpAnimations.length - 1; i >= 0; i--) {
            const anim = levelUpAnimations[i];
            const age = frameNow - anim.start;
            if (age > LEVEL_UP_LIFETIME_MS) {
                scene.remove(anim.mesh);
                levelUpAnimations.splice(i, 1);
                continue;
            }
            if (anim.target) anim.mesh.position.copy(anim.target.position);
            const t = age / LEVEL_UP_LIFETIME_MS;
            if (anim.type === 8) {
                anim.mesh.children.forEach((orb, index) => {
                    const strandIdx = index % 20;
                    const t2 = Math.max(0, t - strandIdx * 0.04);
                    const angle = orb.userData.angleOffset + orb.userData.dir * t2 * Math.PI * 5;
                    orb.position.set(Math.cos(angle) * 1.2, t2 * 4, Math.sin(angle) * 1.2);
                    orb.material.opacity = t2 > 0 ? (1 - t) * (1 - strandIdx / 20) : 0;
                    orb.material.transparent = true;
                    if (t2 === 0) orb.scale.set(0, 0, 0);
                    else orb.scale.set(1, 1, 1);
                });
            }
        }
    }

    function updateTransientVisuals(options = {}) {
        updateClickMarkers(options);
        updateHitsplats(options);
        updateLevelUpAnimations(options);
        updateRangedProjectiles(options);
    }

    window.TransientVisualRuntime = {
        spawnClickMarker,
        spawnHitsplat,
        playLevelUpAnimation,
        spawnMagicProjectile,
        spawnRangedProjectile,
        updateRangedProjectiles,
        updateRangedBowDrawVisual,
        updatePlayerOverheadText,
        updateClickMarkers,
        updateHitsplats,
        updateLevelUpAnimations,
        updateTransientVisuals
    };
})();
