(function () {
    function getWindowRef(context = {}) {
        return context.windowRef || (typeof window !== 'undefined' ? window : {});
    }

    function addChat(context, message, type = 'info') {
        if (context && typeof context.addChatMessage === 'function') {
            context.addChatMessage(message, type);
        }
    }

    function callHook(context, name, ...args) {
        const hook = context && context[name];
        if (typeof hook === 'function') return hook.apply(context, args);
        return undefined;
    }

    function getPlayerState(context) {
        return callHook(context, 'getPlayerState') || context.playerState || {};
    }

    function getInventory(context) {
        const inventory = callHook(context, 'getInventory') || context.inventory || [];
        return Array.isArray(inventory) ? inventory : [];
    }

    function getEquipment(context) {
        return callHook(context, 'getEquipment') || context.equipment || {};
    }

    function getPlayerSkills(context) {
        return callHook(context, 'getPlayerSkills') || context.playerSkills || {};
    }

    function getLogicalMap(context) {
        return callHook(context, 'getLogicalMap') || context.logicalMap || [];
    }

    function getNpcsToRender(context) {
        const npcs = callHook(context, 'getNpcsToRender') || context.npcsToRender || [];
        return Array.isArray(npcs) ? npcs : [];
    }

    function getMapSize(context) {
        const mapSize = callHook(context, 'getMapSize') || context.mapSize;
        return Number.isFinite(mapSize) ? mapSize : 0;
    }

    function getTileIds(context) {
        return context.tileId || context.TileId || getWindowRef(context).TileId || {};
    }

    function getWorldGameContext(context) {
        const worldContext = callHook(context, 'getWorldGameContext');
        if (worldContext) return worldContext;
        return getWindowRef(context).GameContext || null;
    }

    function getWorldRouteGroup(context, groupId) {
        const worldContext = getWorldGameContext(context);
        if (!worldContext || !worldContext.queries || typeof worldContext.queries.getRouteGroup !== 'function') return [];
        const routes = worldContext.queries.getRouteGroup(groupId);
        return Array.isArray(routes) ? routes : [];
    }

    function getWorldMerchantServices(context) {
        const worldContext = getWorldGameContext(context);
        if (!worldContext || !worldContext.queries || typeof worldContext.queries.getMerchantServices !== 'function') return [];
        const services = worldContext.queries.getMerchantServices();
        return Array.isArray(services) ? services : [];
    }

    function getQaAltarLocations(context) {
        const fromRegistry = getWorldRouteGroup(context, 'runecrafting');
        if (fromRegistry.length > 0) return fromRegistry;
        const locations = callHook(context, 'getRunecraftingAltarLocations');
        return Array.isArray(locations) ? locations : [];
    }

    function qaListAltars(context) {
        const altars = getQaAltarLocations(context);
        if (!altars.length) {
            addChat(context, 'No runecrafting altars currently placed.', 'warn');
            return;
        }
        for (let i = 0; i < altars.length; i++) {
            const altar = altars[i];
            addChat(context, `[QA altar] ${altar.label} @ (${altar.x},${altar.y},${altar.z})`, 'info');
        }
    }

    function getWorldAdapterRuntime(context) {
        return callHook(context, 'getWorldAdapterRuntime') || context.worldAdapterRuntime || null;
    }

    function qaListWorlds(context) {
        const worldAdapterRuntime = getWorldAdapterRuntime(context);
        const worldSummaries = (worldAdapterRuntime && typeof worldAdapterRuntime.getQaWorldSummaries === 'function')
            ? worldAdapterRuntime.getQaWorldSummaries()
            : [];
        if (!worldSummaries.length) {
            addChat(context, 'No worlds are currently registered.', 'warn');
            return;
        }
        for (let i = 0; i < worldSummaries.length; i++) {
            const summary = worldSummaries[i];
            if (!summary) continue;
            const activeLabel = summary.isActive ? ' [active]' : '';
            addChat(context, `[QA world] ${summary.worldId}${activeLabel} - ${summary.label} @ (${summary.defaultSpawn.x},${summary.defaultSpawn.y},${summary.defaultSpawn.z})`, 'info');
        }
    }

    function qaListCombatTargets(context) {
        const windowRef = getWindowRef(context);
        const enemies = (typeof windowRef.listQaCombatEnemyStates === 'function')
            ? windowRef.listQaCombatEnemyStates()
            : [];
        if (!Array.isArray(enemies) || enemies.length === 0) {
            addChat(context, '[QA combat target] no active combat enemies', 'warn');
            return;
        }
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            if (!enemy) continue;
            const enemyName = String(enemy.displayName || enemy.enemyId || '').toLowerCase();
            const projectionHeight = enemyName.includes('chicken') || enemyName.includes('rat') ? 0.5 : 1.0;
            const projection = (typeof windowRef.projectWorldTileToScreen === 'function')
                ? windowRef.projectWorldTileToScreen(enemy.x, enemy.y, enemy.z, projectionHeight)
                : null;
            const screenText = projection
                ? ` screen=(${projection.x},${projection.y}) depth=${projection.depth} visible=${projection.visible ? 'yes' : 'no'}`
                : ' screen=unavailable';
            addChat(context, `[QA combat target] ${enemy.runtimeId || 'none'} ${enemy.displayName || enemy.enemyId || 'enemy'} state=${enemy.state || 'unknown'} hp=${Number.isFinite(enemy.hp) ? enemy.hp : 'unknown'} rendered=${enemy.rendered ? 'yes' : 'no'} tile=(${enemy.x},${enemy.y},${enemy.z})${screenText}`, 'info');
        }
    }

    function qaProjectTile(context, parts) {
        const windowRef = getWindowRef(context);
        if (parts.length < 3 || typeof windowRef.projectWorldTileToScreen !== 'function') {
            addChat(context, 'Usage: /qa projecttile <x> <y> [z] [height]', 'warn');
            return;
        }
        const playerState = getPlayerState(context);
        const x = parseInt(parts[1], 10);
        const y = parseInt(parts[2], 10);
        const z = parts.length >= 4 ? parseInt(parts[3], 10) : playerState.z;
        const height = parts.length >= 5 ? Number(parts[4]) : 1.0;
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
            addChat(context, 'Usage: /qa projecttile <x> <y> [z] [height]', 'warn');
            return;
        }
        const projection = windowRef.projectWorldTileToScreen(x, y, z, height);
        if (!projection) {
            addChat(context, `[QA project] tile=(${x},${y},${z}) unavailable`, 'warn');
            return;
        }
        addChat(context, `[QA project] tile=(${x},${y},${z}) height=${Number.isFinite(height) ? height : 1} screen=(${projection.x},${projection.y}) depth=${projection.depth} visible=${projection.visible ? 'yes' : 'no'}`, 'info');
    }

    function qaRaycast(context, parts) {
        const windowRef = getWindowRef(context);
        if (parts.length < 3 || typeof windowRef.listQaRaycastHitsAt !== 'function') {
            addChat(context, 'Usage: /qa raycast <screenX> <screenY> [maxHits]', 'warn');
            return;
        }
        const x = Number(parts[1]);
        const y = Number(parts[2]);
        const maxHits = parts.length >= 4 ? Number(parts[3]) : 12;
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            addChat(context, 'Usage: /qa raycast <screenX> <screenY> [maxHits]', 'warn');
            return;
        }
        const hits = windowRef.listQaRaycastHitsAt(x, y, maxHits);
        if (!Array.isArray(hits) || hits.length === 0) {
            addChat(context, `[QA raycast] screen=(${x},${y}) no hits`, 'warn');
            return;
        }
        hits.forEach((hit) => {
            addChat(context, `[QA raycast] #${hit.index} type=${hit.type || 'unknown'} name=${hit.name || 'none'} uid=${hit.uid || 'none'} tile=(${Number.isFinite(hit.gridX) ? hit.gridX : '?'},${Number.isFinite(hit.gridY) ? hit.gridY : '?'}) priority=${Number.isFinite(hit.priority) ? hit.priority : '?'}`, 'info');
        });
    }

    function qaFindHit(context, parts) {
        const windowRef = getWindowRef(context);
        if (parts.length < 5 || typeof windowRef.findQaRaycastHitNear !== 'function') {
            addChat(context, 'Usage: /qa findhit <screenX> <screenY> <type> [name] [radius] [step]', 'warn');
            return;
        }
        const x = Number(parts[1]);
        const y = Number(parts[2]);
        const type = String(parts[3] || '').trim();
        const name = String(parts[4] || '').trim();
        const radius = parts.length >= 6 ? Number(parts[5]) : 80;
        const step = parts.length >= 7 ? Number(parts[6]) : 8;
        if (!Number.isFinite(x) || !Number.isFinite(y) || !type) {
            addChat(context, 'Usage: /qa findhit <screenX> <screenY> <type> [name] [radius] [step]', 'warn');
            return;
        }
        const hit = windowRef.findQaRaycastHitNear(x, y, type, name, radius, step);
        if (!hit) {
            addChat(context, `[QA findhit] no ${type} hit near (${x},${y})`, 'warn');
            return;
        }
        addChat(context, `[QA findhit] screen=(${hit.x},${hit.y}) dist=${hit.distance} type=${hit.type || 'unknown'} name=${hit.name || 'none'} uid=${hit.uid || 'none'} tile=(${Number.isFinite(hit.gridX) ? hit.gridX : '?'},${Number.isFinite(hit.gridY) ? hit.gridY : '?'})`, 'info');
    }

    function qaListNpcTargets(context, query = '') {
        const windowRef = getWindowRef(context);
        const npcs = (typeof windowRef.listQaNpcTargets === 'function') ? windowRef.listQaNpcTargets() : [];
        const needle = String(query || '').trim().toLowerCase();
        const matches = npcs.filter((npc) => {
            if (!needle) return true;
            return String(npc.name || '').toLowerCase().includes(needle)
                || String(npc.actorId || '').toLowerCase().includes(needle)
                || String(npc.spawnId || '').toLowerCase().includes(needle)
                || String(npc.dialogueId || '').toLowerCase().includes(needle);
        });
        if (!matches.length) {
            addChat(context, '[QA npc target] no matching NPCs', 'warn');
            return;
        }
        for (let i = 0; i < matches.length; i++) {
            const npc = matches[i];
            const projection = (typeof windowRef.projectWorldTileToScreen === 'function')
                ? windowRef.projectWorldTileToScreen(npc.visualX, npc.visualY, npc.z, 1.4)
                : null;
            const screenText = projection
                ? ` screen=(${projection.x},${projection.y}) depth=${projection.depth} visible=${projection.visible ? 'yes' : 'no'}`
                : ' screen=unavailable';
            addChat(context, `[QA npc target] ${npc.name || npc.actorId || 'NPC'} actor=${npc.actorId || 'none'} tile=(${npc.x},${npc.y},${npc.z}) visual=(${npc.visualX},${npc.visualY}) rendered=${npc.rendered ? 'yes' : 'no'}${screenText}`, 'info');
        }
    }

    function qaTravelWorld(context, worldIdLike) {
        const worldAdapterRuntime = getWorldAdapterRuntime(context);
        const match = (worldAdapterRuntime && typeof worldAdapterRuntime.matchQaWorld === 'function')
            ? worldAdapterRuntime.matchQaWorld(worldIdLike)
            : null;
        if (!match) return false;
        const travel = context.travelToWorld || getWindowRef(context).travelToWorld;
        if (typeof travel !== 'function') return false;
        travel(match.worldId, {
            spawn: match.defaultSpawn,
            label: match.label
        });
        return true;
    }

    function qaTeleportTo(context, x, y, z, label) {
        if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(z)) return false;
        const playerState = getPlayerState(context);
        const windowRef = getWindowRef(context);
        playerState.x = x;
        playerState.y = y;
        playerState.z = z;
        playerState.prevX = playerState.x;
        playerState.prevY = playerState.y;
        playerState.targetX = playerState.x;
        playerState.targetY = playerState.y;
        playerState.path = [];
        playerState.action = 'IDLE';
        if (typeof windowRef.syncQaRenderToPlayerState === 'function') windowRef.syncQaRenderToPlayerState();
        if (typeof windowRef.manageChunks === 'function') windowRef.manageChunks(true);
        if (typeof windowRef.processPendingNearChunkBuilds === 'function') {
            let guard = 12;
            while (guard > 0 && windowRef.processPendingNearChunkBuilds(4) > 0) guard--;
        }
        addChat(context, `Teleported to ${label || 'target'}.`, 'info');
        return true;
    }

    function qaGotoAltar(context, labelLike) {
        const needle = String(labelLike || '').trim().toLowerCase();
        if (!needle) return false;
        const altars = getQaAltarLocations(context);
        let match = null;
        for (let i = 0; i < altars.length; i++) {
            const altar = altars[i];
            if (!altar || !altar.label) continue;
            if (altar.label.toLowerCase().includes(needle)) {
                match = altar;
                break;
            }
        }
        if (!match) return false;

        // Keep QA teleports outside the altar's 4x4 collision footprint.
        return qaTeleportTo(context, match.x, Math.max(0, match.y - 3), match.z, `near ${match.label}`);
    }

    function qaGotoTutorialStation(context, labelLike) {
        const key = String(labelLike || '').trim().toLowerCase();
        const stations = {
            arrival: { x: 157, y: 157, z: 0, label: 'tutorial arrival' },
            woodcutting: { x: 171, y: 157, z: 0, label: 'tutorial woodcutting' },
            fishing: { x: 187, y: 156, z: 0, label: 'tutorial fishing' },
            firemaking: { x: 205, y: 175, z: 0, label: 'tutorial firemaking' },
            cooking: { x: 205, y: 175, z: 0, label: 'tutorial cooking' },
            mining: { x: 229, y: 183, z: 0, label: 'tutorial mining' },
            smithing: { x: 229, y: 183, z: 0, label: 'tutorial smithing' },
            combat: { x: 237, y: 159, z: 0, label: 'tutorial combat' },
            bank: { x: 215, y: 149, z: 0, label: 'tutorial bank' },
            exit: { x: 200, y: 148, z: 0, label: 'tutorial exit' }
        };
        const station = stations[key];
        if (!station) return false;
        return qaTeleportTo(context, station.x, station.y, station.z, station.label);
    }

    function getQaFishingSpots(context) {
        const fallback = {
            pond: { x: 205, y: 223, z: 0, label: 'castle pond bank' },
            pier: { x: 205, y: 230, z: 0, label: 'castle pond pier' },
            deep: { x: 205, y: 231, z: 0, label: 'castle pond deep-water edge' }
        };
        const routes = getWorldRouteGroup(context, 'fishing');
        if (!Array.isArray(routes) || routes.length === 0) return fallback;
        const merged = Object.assign({}, fallback);
        for (let i = 0; i < routes.length; i++) {
            const route = routes[i];
            const explicitAlias = typeof route.alias === 'string' ? route.alias.trim().toLowerCase() : '';
            const key = explicitAlias && merged[explicitAlias] ? explicitAlias : null;
            if (!key || !merged[key]) continue;
            merged[key] = {
                x: Number.isFinite(route.x) ? route.x : merged[key].x,
                y: Number.isFinite(route.y) ? route.y : merged[key].y,
                z: Number.isFinite(route.z) ? route.z : merged[key].z,
                label: route.label || merged[key].label
            };
        }
        return merged;
    }

    function listNamedSpots(context, spots, prefix) {
        const ids = Object.keys(spots);
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            const spot = spots[id];
            addChat(context, `[QA ${prefix}] ${id} @ (${spot.x},${spot.y},${spot.z})`, 'info');
        }
    }

    function qaListFishingSpots(context) {
        listNamedSpots(context, getQaFishingSpots(context), 'fish');
    }

    function teleportToNamedSpot(context, spots, key) {
        if (spots[key]) {
            const exact = spots[key];
            return qaTeleportTo(context, exact.x, exact.y, exact.z, exact.label);
        }

        const ids = Object.keys(spots);
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            if (!id.includes(key)) continue;
            const spot = spots[id];
            return qaTeleportTo(context, spot.x, spot.y, spot.z, spot.label);
        }

        return false;
    }

    function qaGotoFishingSpot(context, nameLike) {
        const key = String(nameLike || '').trim().toLowerCase();
        if (!key) return false;
        return teleportToNamedSpot(context, getQaFishingSpots(context), key);
    }

    function getQaCookingSpots(context) {
        const fallback = {
            camp: { x: 199, y: 224, z: 0, label: 'starter campfire' },
            river: { x: 197, y: 227, z: 0, label: 'riverbank fire line' },
            dock: { x: 212, y: 227, z: 0, label: 'dockside fire line' },
            deep: { x: 205, y: 229, z: 0, label: 'deep-water dock fire line' }
        };
        const routes = getWorldRouteGroup(context, 'cooking');
        if (!Array.isArray(routes) || routes.length === 0) return fallback;
        const merged = Object.assign({}, fallback);
        for (let i = 0; i < routes.length; i++) {
            const route = routes[i];
            if (!route) continue;
            const key = typeof route.alias === 'string' ? route.alias.trim().toLowerCase() : '';
            if (!key) continue;
            merged[key] = {
                x: Number.isFinite(route.x) ? route.x : merged[key].x,
                y: Number.isFinite(route.y) ? route.y : merged[key].y,
                z: Number.isFinite(route.z) ? route.z : merged[key].z,
                label: route.label || merged[key].label
            };
        }
        return merged;
    }

    function qaListCookingSpots(context) {
        listNamedSpots(context, getQaCookingSpots(context), 'cook');
    }

    function qaGotoCookingSpot(context, nameLike) {
        const raw = String(nameLike || '').trim().toLowerCase();
        if (!raw) return false;
        const aliases = {
            camp: 'camp',
            campfire: 'camp',
            starter: 'camp',
            river: 'river',
            riverbank: 'river',
            dock: 'dock',
            dockside: 'dock',
            deep: 'deep',
            deepwater: 'deep',
            'deep-water': 'deep'
        };
        return teleportToNamedSpot(context, getQaCookingSpots(context), aliases[raw] || raw);
    }

    function routeToSpot(route) {
        if (!route) return null;
        const key = typeof route.alias === 'string' && route.alias.trim()
            ? route.alias.trim().toLowerCase()
            : String(route.routeId || '').trim().toLowerCase();
        if (!key) return null;
        return {
            key,
            spot: {
                x: Number.isFinite(route.x) ? route.x : 0,
                y: Number.isFinite(route.y) ? route.y : 0,
                z: Number.isFinite(route.z) ? route.z : 0,
                label: route.label || key
            }
        };
    }

    function getQaFiremakingSpots(context) {
        const fallback = {
            starter: { x: 182, y: 170, z: 0, label: 'starter grove fire lane' },
            oak: { x: 205, y: 299, z: 0, label: 'oak path fire lane' },
            willow: { x: 239, y: 62, z: 0, label: 'willow bend fire lane' },
            maple: { x: 402, y: 206, z: 0, label: 'maple ridge fire lane' },
            yew: { x: 51, y: 8, z: 0, label: 'yew frontier fire lane' }
        };
        const routes = getWorldRouteGroup(context, 'firemaking');
        if (Array.isArray(routes) && routes.length > 0) {
            const spots = {};
            for (let i = 0; i < routes.length; i++) {
                const mapped = routeToSpot(routes[i]);
                if (mapped) spots[mapped.key] = mapped.spot;
            }
            if (Object.keys(spots).length > 0) return spots;
        }

        const legacyRoutes = callHook(context, 'getFiremakingTrainingLocations');
        if (Array.isArray(legacyRoutes) && legacyRoutes.length > 0) {
            const spots = {};
            for (let i = 0; i < legacyRoutes.length; i++) {
                const mapped = routeToSpot(legacyRoutes[i]);
                if (mapped) spots[mapped.key] = mapped.spot;
            }
            if (Object.keys(spots).length > 0) return spots;
        }

        return fallback;
    }

    function qaListFiremakingSpots(context) {
        listNamedSpots(context, getQaFiremakingSpots(context), 'fire');
    }

    function qaGotoFiremakingSpot(context, nameLike) {
        const raw = String(nameLike || '').trim().toLowerCase();
        if (!raw) return false;
        const aliases = {
            starter: 'starter',
            logs: 'starter',
            regular: 'starter',
            normal: 'starter',
            oak: 'oak',
            willow: 'willow',
            maple: 'maple',
            yew: 'yew'
        };
        return teleportToNamedSpot(context, getQaFiremakingSpots(context), aliases[raw] || raw);
    }

    function getQaDiscoveredMerchants(context) {
        const merchantServices = getWorldMerchantServices(context);
        if (merchantServices.length > 0) {
            return merchantServices.map((service) => ({
                merchantId: String(service.merchantId || '').trim().toLowerCase(),
                name: String(service.name || service.merchantId || 'merchant'),
                x: Number.isFinite(service.x) ? service.x : 0,
                y: Number.isFinite(service.y) ? service.y : 0,
                z: Number.isFinite(service.z) ? service.z : 0
            })).filter((entry) => !!entry.merchantId);
        }
        const byId = {};
        const npcsToRender = getNpcsToRender(context);
        for (let i = 0; i < npcsToRender.length; i++) {
            const npc = npcsToRender[i];
            if (!npc || !npc.merchantId) continue;
            const merchantId = String(npc.merchantId || '').trim().toLowerCase();
            if (!merchantId) continue;
            if (byId[merchantId]) continue;
            byId[merchantId] = {
                merchantId,
                name: String(npc.name || merchantId),
                x: Number.isFinite(npc.x) ? npc.x : 0,
                y: Number.isFinite(npc.y) ? npc.y : 0,
                z: Number.isFinite(npc.z) ? npc.z : 0
            };
        }
        const orderedIds = Object.keys(byId).sort();
        return orderedIds.map((merchantId) => byId[merchantId]);
    }

    function getQaFishingMerchants(context) {
        const fallback = {
            teacher: { x: 201, y: 223, z: 0, label: 'fishing teacher' },
            supplier: { x: 209, y: 230, z: 0, label: 'fishing supplier' }
        };

        const merged = Object.assign({}, fallback);
        const keyByMerchantId = {
            fishing_teacher: 'teacher',
            fishing_supplier: 'supplier'
        };
        const discovered = getQaDiscoveredMerchants(context);
        for (let i = 0; i < discovered.length; i++) {
            const merchant = discovered[i];
            const key = keyByMerchantId[merchant.merchantId];
            if (!key || !merged[key]) continue;
            merged[key] = {
                x: merchant.x,
                y: merchant.y,
                z: merchant.z,
                label: merchant.name || merged[key].label
            };
        }
        return merged;
    }

    function qaListFishingMerchants(context) {
        const spots = getQaFishingMerchants(context);
        const ids = Object.keys(spots);
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            const spot = spots[id];
            addChat(context, '[QA fishshop] ' + id + ' @ (' + spot.x + ',' + spot.y + ',' + spot.z + ')', 'info');
        }
    }

    function qaGotoFishingMerchant(context, nameLike) {
        const key = String(nameLike || '').trim().toLowerCase();
        if (!key) return false;
        return teleportToNamedSpot(context, getQaFishingMerchants(context), key);
    }

    function getQaOpenableMerchantIds(context) {
        const windowRef = getWindowRef(context);
        const ids = new Set(['general_store']);
        const economy = windowRef.ShopEconomy;
        const hasStockPolicy = economy && typeof economy.hasStockPolicy === 'function'
            ? (merchantId) => economy.hasStockPolicy(merchantId)
            : null;
        const addCandidate = (merchantId) => {
            const id = String(merchantId || '').trim().toLowerCase();
            if (!id) return;
            if (hasStockPolicy && !hasStockPolicy(id)) return;
            ids.add(id);
        };

        if (economy && typeof economy.getConfiguredMerchantIds === 'function') {
            const configured = economy.getConfiguredMerchantIds();
            if (Array.isArray(configured)) {
                for (let i = 0; i < configured.length; i++) {
                    addCandidate(configured[i]);
                }
            }
        }

        const discovered = getQaDiscoveredMerchants(context);
        for (let i = 0; i < discovered.length; i++) {
            addCandidate(discovered[i].merchantId);
        }

        const ordered = Array.from(ids).sort();
        const generalStoreIndex = ordered.indexOf('general_store');
        if (generalStoreIndex > 0) {
            ordered.splice(generalStoreIndex, 1);
            ordered.unshift('general_store');
        }
        return ordered;
    }

    function formatQaOpenShopUsage(context) {
        const merchantIds = getQaOpenableMerchantIds(context);
        if (merchantIds.length === 0) return 'Usage: /qa openshop <merchantId>';
        return 'Usage: /qa openshop <' + merchantIds.join('|') + '>';
    }

    function getQaMerchantAliasMap(context) {
        const aliases = {};
        const setAlias = (alias, merchantId, overwrite = false) => {
            const aliasKey = String(alias || '').trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_');
            const merchantKey = String(merchantId || '').trim().toLowerCase();
            if (!aliasKey || !merchantKey) return;
            if (!overwrite && aliases[aliasKey]) return;
            aliases[aliasKey] = merchantKey;
        };

        const aliasSeed = {
            teacher: 'fishing_teacher',
            supplier: 'fishing_supplier',
            tutor: 'rune_tutor',
            sage: 'combination_sage',
            fish_teacher: 'fishing_teacher',
            fish_supplier: 'fishing_supplier',
            rc_tutor: 'rune_tutor',
            combo_sage: 'combination_sage',
            borin: 'borin_ironvein',
            thrain: 'thrain_deepforge',
            elira: 'elira_gemhand',
            forester: 'forester_teacher',
            woodsman: 'advanced_woodsman',
            fletcher: 'fletching_supplier',
            tanner: 'tanner_rusk',
            shop: 'general_store',
            store: 'general_store',
            general: 'general_store'
        };
        const aliasKeys = Object.keys(aliasSeed);
        for (let i = 0; i < aliasKeys.length; i++) {
            const aliasKey = aliasKeys[i];
            setAlias(aliasKey, aliasSeed[aliasKey], true);
        }

        const openableMerchantIds = getQaOpenableMerchantIds(context);
        for (let i = 0; i < openableMerchantIds.length; i++) {
            const merchantId = openableMerchantIds[i];
            setAlias(merchantId, merchantId, true);
            setAlias(merchantId.replace(/_/g, ''), merchantId);
        }

        const discovered = getQaDiscoveredMerchants(context);
        for (let i = 0; i < discovered.length; i++) {
            const merchant = discovered[i];
            const merchantId = merchant.merchantId;
            if (!merchantId) continue;
            setAlias(merchantId, merchantId, true);

            const segments = merchantId.split('_').filter(Boolean);
            if (segments.length > 0) {
                setAlias(segments[segments.length - 1], merchantId);
            }

            const nameToken = String(merchant.name || '')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '');
            if (nameToken) {
                setAlias(nameToken, merchantId);
                setAlias(nameToken.replace(/_/g, ''), merchantId);
            }
        }

        return aliases;
    }

    function qaGotoMerchant(context, targetLike) {
        const raw = String(targetLike || '').trim().toLowerCase();
        if (!raw) return false;

        const aliases = getQaMerchantAliasMap(context);
        const merchantId = aliases[raw] || raw;

        const matches = [];
        const merchants = getQaDiscoveredMerchants(context);
        for (let i = 0; i < merchants.length; i++) {
            const npc = merchants[i];
            if (!npc || !npc.merchantId) continue;
            const id = String(npc.merchantId).toLowerCase();
            const name = String(npc.name || '').toLowerCase();
            if (id === merchantId || id.includes(merchantId) || name.includes(raw)) {
                matches.push(npc);
            }
        }
        if (matches.length === 0) return false;

        const playerState = getPlayerState(context);
        let best = matches[0];
        let bestDist = Math.abs(best.x - playerState.x) + Math.abs(best.y - playerState.y) + (best.z === playerState.z ? 0 : 1000);
        for (let i = 1; i < matches.length; i++) {
            const npc = matches[i];
            const dist = Math.abs(npc.x - playerState.x) + Math.abs(npc.y - playerState.y) + (npc.z === playerState.z ? 0 : 1000);
            if (dist < bestDist) {
                best = npc;
                bestDist = dist;
            }
        }

        const label = (best.merchantId || best.name || 'merchant').toString();
        return qaTeleportTo(context, best.x, best.y, best.z, label);
    }

    function getQaBestToolByClass(context, toolClass) {
        const equipment = getEquipment(context);
        const inventory = getInventory(context);
        const candidates = [];
        if (equipment && equipment.weapon && equipment.weapon.weaponClass === toolClass) {
            candidates.push(equipment.weapon);
        }
        for (let i = 0; i < inventory.length; i++) {
            const slot = inventory[i];
            if (!slot || !slot.itemData) continue;
            if (slot.itemData.weaponClass === toolClass) candidates.push(slot.itemData);
        }
        if (candidates.length === 0) return null;

        let best = candidates[0];
        let bestPower = Number.isFinite(best.toolTier) ? best.toolTier : 0;
        for (let i = 1; i < candidates.length; i++) {
            const item = candidates[i];
            const power = Number.isFinite(item.toolTier) ? item.toolTier : 0;
            if (power > bestPower) {
                best = item;
                bestPower = power;
            }
        }
        return best;
    }

    function qaDiagMining(context) {
        const registry = getWindowRef(context).SkillSpecRegistry;
        const spec = registry && typeof registry.getSkillSpec === 'function' ? registry.getSkillSpec('mining') : null;
        if (!spec || !spec.nodeTable || !spec.nodeTable.copper_rock) {
            addChat(context, 'QA mining diag unavailable: missing mining spec.', 'warn');
            return;
        }

        const playerSkills = getPlayerSkills(context);
        const level = playerSkills && playerSkills.mining ? playerSkills.mining.level : 1;
        const node = spec.nodeTable.copper_rock;
        const best = getQaBestToolByClass(context, 'pickaxe');
        const toolPower = best && Number.isFinite(best.toolTier) ? best.toolTier : 0;
        const speedBonus = best && Number.isFinite(best.speedBonusTicks) ? best.speedBonusTicks : 0;
        const success = registry && typeof registry.computeGatherSuccessChance === 'function'
            ? registry.computeGatherSuccessChance(level, toolPower, node.difficulty)
            : 0;
        const interval = registry && typeof registry.computeIntervalTicks === 'function'
            ? registry.computeIntervalTicks(spec.timing.baseAttemptTicks, spec.timing.minimumAttemptTicks, speedBonus)
            : 0;

        addChat(context, `[QA mining] lvl=${level}, tool=${best ? best.id : 'none'}, power=${toolPower}, speedBonus=${speedBonus}, chance=${(success * 100).toFixed(2)}%, interval=${interval}t`, 'info');
    }

    function qaDiagRunecrafting(context) {
        const registry = getWindowRef(context).SkillSpecRegistry;
        const spec = registry && typeof registry.getSkillSpec === 'function' ? registry.getSkillSpec('runecrafting') : null;
        const recipes = spec && spec.recipeSet ? spec.recipeSet : null;
        const recipe = recipes ? recipes.ember_altar : null;
        if (!recipe) {
            addChat(context, 'QA rc diag unavailable: missing runecrafting recipe.', 'warn');
            return;
        }
        const playerSkills = getPlayerSkills(context);
        const playerState = getPlayerState(context);
        const level = playerSkills && playerSkills.runecrafting ? playerSkills.runecrafting.level : 1;
        const outputPerEssence = registry && typeof registry.computeRuneOutputPerEssence === 'function'
            ? registry.computeRuneOutputPerEssence(level, recipe.scalingStartLevel)
            : 1;
        const comboOutputPerEssence = registry && typeof registry.computeRuneOutputPerEssence === 'function'
            ? registry.computeRuneOutputPerEssence(level, 40)
            : 1;
        const comboCount = recipes ? Object.keys(recipes).filter((id) => recipes[id] && recipes[id].requiresSecondaryRune).length : 0;
        const comboUnlocked = !!(playerState.unlockFlags && playerState.unlockFlags.runecraftingComboUnlocked);
        addChat(context, `[QA rc] lvl=${level}, emberStart=${recipe.scalingStartLevel}, emberPerEss=${outputPerEssence}, comboUnlocked=${comboUnlocked}, comboRecipes=${comboCount}, comboPerEss@40=${comboOutputPerEssence}`, 'info');
    }

    function qaDiagFishing(context) {
        const registry = getWindowRef(context).SkillSpecRegistry;
        const spec = registry && typeof registry.getSkillSpec === 'function' ? registry.getSkillSpec('fishing') : null;
        if (!spec || !spec.nodeTable) {
            addChat(context, 'QA fishing diag unavailable: missing fishing spec.', 'warn');
            return;
        }

        const playerState = getPlayerState(context);
        const playerSkills = getPlayerSkills(context);
        const inventory = getInventory(context);
        const equipment = getEquipment(context);
        const logicalMap = getLogicalMap(context);
        const mapSize = getMapSize(context);
        const tileId = getTileIds(context);
        const level = playerSkills && playerSkills.fishing ? playerSkills.fishing.level : 1;
        const baitCount = inventory.reduce((sum, slot) => {
            if (!slot || !slot.itemData || slot.itemData.id !== 'bait') return sum;
            return sum + slot.amount;
        }, 0);

        const nearbyTiles = [];
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const tx = playerState.x + dx;
                const ty = playerState.y + dy;
                if (tx < 0 || ty < 0 || tx >= mapSize || ty >= mapSize) continue;
                if (!logicalMap[playerState.z] || !logicalMap[playerState.z][ty]) continue;
                nearbyTiles.push(logicalMap[playerState.z][ty][tx]);
            }
        }
        const currentTile = logicalMap[playerState.z] && logicalMap[playerState.z][playerState.y]
            ? logicalMap[playerState.z][playerState.y][playerState.x]
            : 'unknown';
        const shallowAdj = nearbyTiles.filter((t) => t === tileId.WATER_SHALLOW).length;
        const deepAdj = nearbyTiles.filter((t) => t === tileId.WATER_DEEP).length;
        const equipped = equipment && equipment.weapon ? equipment.weapon.id : 'none';

        addChat(context, `[QA fishing] lvl=${level}, equipped=${equipped}, bait=${baitCount}, tile=${currentTile}, adjShallow=${shallowAdj}, adjDeep=${deepAdj}, action=${playerState.action}, activeMethod=${playerState.fishingActiveMethodId || 'none'}, activeWater=${playerState.fishingActiveWaterId || 'none'}`, 'info');
    }

    function qaDiagShop(context, merchantIdInput) {
        const windowRef = getWindowRef(context);
        const merchantId = String(merchantIdInput || (typeof windowRef.getActiveShopMerchantId === 'function' ? windowRef.getActiveShopMerchantId() : 'general_store')).toLowerCase();
        if (!windowRef.ShopEconomy || typeof windowRef.ShopEconomy.getMerchantDiagnosticSummary !== 'function') {
            addChat(context, 'QA shop diag unavailable: missing shop economy module.', 'warn');
            return;
        }

        const rows = windowRef.ShopEconomy.getMerchantDiagnosticSummary(merchantId);
        addChat(context, '[QA shop] merchant=' + merchantId, 'info');
        if (!rows || rows.length === 0) {
            addChat(context, '[QA shop] no merchant economy rules found for this merchant.', 'info');
            return;
        }

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const unlockText = Number.isFinite(row.threshold)
                ? (' unlock=' + row.sold + '/' + row.threshold + ' (' + (row.unlocked ? 'yes' : 'no') + ')')
                : '';
            addChat(context, '[QA shop] ' + row.itemId + ': buyFromPlayer=' + (row.canBuyFromPlayer ? 'yes' : 'no') + ' (' + row.sellPrice + '), sellToPlayer=' + (row.canSellToPlayer ? 'yes' : 'no') + ' (' + row.buyPrice + ')' + unlockText, 'info');
        }

        if (typeof windowRef.ShopEconomy.getFishUnlockSummary === 'function') {
            const fishRows = windowRef.ShopEconomy.getFishUnlockSummary(merchantId);
            for (let i = 0; i < fishRows.length; i++) {
                const row = fishRows[i];
                addChat(context, '[QA fish-unlock] ' + row.itemId + ': sold=' + row.sold + '/' + row.threshold + ', unlocked=' + (row.unlocked ? 'yes' : 'no'), 'info');
            }
        }
    }

    function getItemDb(context) {
        return context.ITEM_DB || context.itemDb || {};
    }

    function makeFilledSlots(context, baseSlots, fillerItemId) {
        const itemDb = getItemDb(context);
        const slots = Array.isArray(baseSlots) ? baseSlots.slice() : [];
        const fallbackItem = itemDb[fillerItemId] ? fillerItemId : 'logs';
        while (slots.length < 28) {
            slots.push({ itemId: fallbackItem, amount: 1 });
        }
        return slots;
    }

    function getQaToolSlots() {
        return [
            { itemId: 'iron_axe', amount: 1 },
            { itemId: 'iron_pickaxe', amount: 1 },
            { itemId: 'small_net', amount: 1 },
            { itemId: 'tinderbox', amount: 1 },
            { itemId: 'knife', amount: 1 }
        ];
    }

    function buildQaInventoryPresetSlots(context, presetName) {
        const name = String(presetName || '').trim().toLowerCase();
        const tools = getQaToolSlots();

        if (name === 'fish_full') {
            return makeFilledSlots(context, tools.concat([
                { itemId: 'fishing_rod', amount: 1 },
                { itemId: 'harpoon', amount: 1 },
                { itemId: 'rune_harpoon', amount: 1 },
                { itemId: 'bait', amount: 200 }
            ]), 'raw_shrimp');
        }
        if (name === 'fish_rod') {
            return tools.concat([
                { itemId: 'fishing_rod', amount: 1 },
                { itemId: 'bait', amount: 500 },
                { itemId: 'coins', amount: 1000 }
            ]);
        }
        if (name === 'fish_harpoon') {
            return tools.concat([
                { itemId: 'harpoon', amount: 1 },
                { itemId: 'coins', amount: 1000 }
            ]);
        }
        if (name === 'fish_rune') {
            return tools.concat([
                { itemId: 'rune_harpoon', amount: 1 },
                { itemId: 'coins', amount: 1000 }
            ]);
        }
        if (name === 'wc_full') return makeFilledSlots(context, tools, 'logs');
        if (name === 'mining_full') return makeFilledSlots(context, tools, 'copper_ore');
        if (name === 'rc_full') return makeFilledSlots(context, tools, 'rune_essence');
        if (name === 'rc_combo') {
            return tools.concat([
                { itemId: 'rune_essence', amount: 12 },
                { itemId: 'air_rune', amount: 120 },
                { itemId: 'small_pouch', amount: 1 }
            ]);
        }
        if (name === 'rc_routes') {
            return tools.concat([
                { itemId: 'rune_essence', amount: 12 },
                { itemId: 'ember_rune', amount: 120 },
                { itemId: 'water_rune', amount: 120 },
                { itemId: 'earth_rune', amount: 120 },
                { itemId: 'air_rune', amount: 120 },
                { itemId: 'small_pouch', amount: 1 }
            ]);
        }
        if (name === 'fm_full') {
            return tools.concat([
                { itemId: 'logs', amount: 5 },
                { itemId: 'oak_logs', amount: 5 },
                { itemId: 'willow_logs', amount: 5 },
                { itemId: 'maple_logs', amount: 4 },
                { itemId: 'yew_logs', amount: 4 }
            ]);
        }
        if (name === 'smith_smelt') {
            return [
                { itemId: 'hammer', amount: 1 },
                { itemId: 'ring_mould', amount: 1 },
                { itemId: 'amulet_mould', amount: 1 },
                { itemId: 'tiara_mould', amount: 1 },
                { itemId: 'copper_ore', amount: 8 },
                { itemId: 'tin_ore', amount: 8 },
                { itemId: 'iron_ore', amount: 6 },
                { itemId: 'coal', amount: 10 },
                { itemId: 'silver_ore', amount: 4 },
                { itemId: 'gold_ore', amount: 4 },
                { itemId: 'mithril_ore', amount: 4 },
                { itemId: 'adamant_ore', amount: 2 },
                { itemId: 'rune_ore', amount: 1 }
            ];
        }
        if (name === 'smith_forge') {
            return [
                { itemId: 'hammer', amount: 1 },
                { itemId: 'bronze_bar', amount: 8 },
                { itemId: 'iron_bar', amount: 6 },
                { itemId: 'steel_bar', amount: 5 },
                { itemId: 'mithril_bar', amount: 4 },
                { itemId: 'adamant_bar', amount: 3 },
                { itemId: 'rune_bar', amount: 1 }
            ];
        }
        if (name === 'smith_jewelry') {
            return [
                { itemId: 'hammer', amount: 1 },
                { itemId: 'ring_mould', amount: 1 },
                { itemId: 'amulet_mould', amount: 1 },
                { itemId: 'tiara_mould', amount: 1 },
                { itemId: 'silver_bar', amount: 10 },
                { itemId: 'gold_bar', amount: 10 }
            ];
        }
        if (name === 'smith_full') {
            return [
                { itemId: 'hammer', amount: 1 },
                { itemId: 'ring_mould', amount: 1 },
                { itemId: 'amulet_mould', amount: 1 },
                { itemId: 'tiara_mould', amount: 1 },
                { itemId: 'copper_ore', amount: 3 },
                { itemId: 'tin_ore', amount: 3 },
                { itemId: 'iron_ore', amount: 2 },
                { itemId: 'coal', amount: 4 },
                { itemId: 'silver_ore', amount: 2 },
                { itemId: 'gold_ore', amount: 2 },
                { itemId: 'mithril_ore', amount: 2 },
                { itemId: 'adamant_ore', amount: 1 },
                { itemId: 'rune_ore', amount: 1 },
                { itemId: 'bronze_bar', amount: 1 },
                { itemId: 'iron_bar', amount: 1 },
                { itemId: 'steel_bar', amount: 1 }
            ];
        }
        if (name === 'smith_fullinv') {
            return makeFilledSlots(context, tools.concat([
                { itemId: 'hammer', amount: 1 },
                { itemId: 'bronze_bar', amount: 1 }
            ]), 'logs');
        }
        if (name === 'icons') {
            const reviewBatch = typeof context.getActiveIconReviewBatch === 'function'
                ? context.getActiveIconReviewBatch()
                : null;
            const itemIds = reviewBatch && Array.isArray(reviewBatch.itemIds) ? reviewBatch.itemIds : [];
            return itemIds.map((itemId) => ({ itemId, amount: 1 }));
        }
        if (name === 'default') {
            return [
                { itemId: 'iron_axe', amount: 1 },
                { itemId: 'logs', amount: 1 },
                { itemId: 'coins', amount: 1000 },
                { itemId: 'small_net', amount: 1 },
                { itemId: 'iron_pickaxe', amount: 1 },
                { itemId: 'tinderbox', amount: 1 },
                { itemId: 'knife', amount: 1 },
                { itemId: 'raw_shrimp', amount: 1 },
                { itemId: 'raw_shrimp', amount: 1 },
                { itemId: 'raw_shrimp', amount: 1 },
                { itemId: 'raw_shrimp', amount: 1 },
                { itemId: 'raw_shrimp', amount: 1 }
            ];
        }

        return null;
    }

    function applyQaInventoryPreset(context, presetName) {
        const name = String(presetName || '').trim().toLowerCase();
        const slots = buildQaInventoryPresetSlots(context, name);
        if (!slots) return false;
        if (typeof context.setInventorySlots === 'function') context.setInventorySlots(slots);
        addChat(context, `QA preset applied: ${name}`, 'info');
        return true;
    }

    function createCommandHandlers(context = {}) {
        return {
            formatQaOpenShopUsage: () => formatQaOpenShopUsage(context),
            qaListWorlds: () => qaListWorlds(context),
            qaListCombatTargets: () => qaListCombatTargets(context),
            qaListNpcTargets: (query) => qaListNpcTargets(context, query),
            qaProjectTile: (parts) => qaProjectTile(context, parts),
            qaRaycast: (parts) => qaRaycast(context, parts),
            qaFindHit: (parts) => qaFindHit(context, parts),
            qaTravelWorld: (worldIdLike) => qaTravelWorld(context, worldIdLike),
            qaListAltars: () => qaListAltars(context),
            qaListFishingSpots: () => qaListFishingSpots(context),
            qaListFishingMerchants: () => qaListFishingMerchants(context),
            qaListCookingSpots: () => qaListCookingSpots(context),
            qaListFiremakingSpots: () => qaListFiremakingSpots(context),
            qaGotoFishingSpot: (nameLike) => qaGotoFishingSpot(context, nameLike),
            qaGotoCookingSpot: (nameLike) => qaGotoCookingSpot(context, nameLike),
            qaGotoFiremakingSpot: (nameLike) => qaGotoFiremakingSpot(context, nameLike),
            qaGotoFishingMerchant: (nameLike) => qaGotoFishingMerchant(context, nameLike),
            qaGotoMerchant: (targetLike) => qaGotoMerchant(context, targetLike),
            qaGotoTutorialStation: (labelLike) => qaGotoTutorialStation(context, labelLike),
            qaGotoAltar: (labelLike) => qaGotoAltar(context, labelLike),
            qaDiagShop: (merchantIdInput) => qaDiagShop(context, merchantIdInput),
            getQaOpenableMerchantIds: () => getQaOpenableMerchantIds(context),
            qaDiagFishing: () => qaDiagFishing(context),
            qaDiagMining: () => qaDiagMining(context),
            qaDiagRunecrafting: () => qaDiagRunecrafting(context),
            applyQaInventoryPreset: (presetName) => applyQaInventoryPreset(context, presetName)
        };
    }

    window.QaToolsRuntime = {
        createCommandHandlers,
        getWorldRouteGroup,
        getWorldMerchantServices,
        getQaFiremakingSpots,
        qaGotoFiremakingSpot,
        getQaDiscoveredMerchants,
        getQaOpenableMerchantIds,
        formatQaOpenShopUsage,
        makeFilledSlots,
        getQaToolSlots,
        buildQaInventoryPresetSlots,
        applyQaInventoryPreset
    };
})();
