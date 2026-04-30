(function () {
    const CLICK_MARKER_LIFETIME_MS = 400;
    const HITSPLAT_LIFETIME_MS = 1200;
    const LEVEL_UP_LIFETIME_MS = 1500;

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
    }

    window.TransientVisualRuntime = {
        spawnClickMarker,
        spawnHitsplat,
        playLevelUpAnimation,
        updatePlayerOverheadText,
        updateClickMarkers,
        updateHitsplats,
        updateLevelUpAnimations,
        updateTransientVisuals
    };
})();
