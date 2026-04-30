(function () {
    function cloneRouteLocation(route) {
        if (!route || typeof route !== 'object') return route;
        const clone = Object.assign({}, route);
        if (Array.isArray(route.tags)) clone.tags = route.tags.slice();
        return clone;
    }

    function cloneRouteLocations(routes) {
        if (!Array.isArray(routes)) return [];
        return routes.map(cloneRouteLocation);
    }

    function buildCookingTrainingLocations(options = {}) {
        const routeSpecs = Array.isArray(options.routeSpecs) ? options.routeSpecs : [];
        const fireSpots = Array.isArray(options.fireSpots) ? options.fireSpots : [];
        const locations = [];
        for (let i = 0; i < routeSpecs.length; i++) {
            const routeSpec = routeSpecs[i];
            if (!routeSpec || !routeSpec.routeId) continue;
            const routePlacements = fireSpots.filter((spot) => spot && spot.routeId === routeSpec.routeId);
            if (routePlacements.length <= 0) continue;
            const anchor = routePlacements[Math.floor(routePlacements.length / 2)];
            locations.push({
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
        return locations;
    }

    function buildMiningRouteCountById(activePlacements) {
        const countById = Object.create(null);
        if (!Array.isArray(activePlacements)) return countById;
        for (let i = 0; i < activePlacements.length; i++) {
            const placement = activePlacements[i];
            if (!placement || placement.z !== 0) continue;
            const routeId = (typeof placement.routeId === 'string' && placement.routeId)
                ? placement.routeId
                : null;
            if (!routeId) continue;
            countById[routeId] = (countById[routeId] || 0) + 1;
        }
        return countById;
    }

    function buildMiningTrainingLocations(options = {}) {
        const routeDefs = Array.isArray(options.routeDefs) ? options.routeDefs : [];
        const activePlacements = Array.isArray(options.activePlacements) ? options.activePlacements : [];
        const layoutOverrides = options.layoutOverrides || {};
        const miningRouteCountById = buildMiningRouteCountById(activePlacements);
        return routeDefs.map((route) => {
            const layoutOverride = route && route.routeId ? layoutOverrides[route.routeId] : null;
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
    }

    function getRunecraftingAltarNameAt(routes, x, y, z) {
        if (!Array.isArray(routes)) return null;
        for (let i = 0; i < routes.length; i++) {
            const route = routes[i];
            if (!route) continue;
            if (route.x === x && route.y === y && route.z === z) return route.label || null;
        }
        return null;
    }

    function publishTrainingLocationHooks(options = {}) {
        const windowTarget = options.windowTarget || window;
        const fishingLocations = cloneRouteLocations(options.fishing);
        const cookingLocations = cloneRouteLocations(options.cooking);
        const firemakingLocations = cloneRouteLocations(options.firemaking);
        const miningLocations = cloneRouteLocations(options.mining);
        const runecraftingRoutes = cloneRouteLocations(options.runecrafting);
        const woodcuttingLocations = cloneRouteLocations(options.woodcutting);

        windowTarget.getFishingTrainingLocations = function getFishingTrainingLocations() {
            return cloneRouteLocations(fishingLocations);
        };
        windowTarget.getCookingTrainingLocations = function getCookingTrainingLocations() {
            return cloneRouteLocations(cookingLocations);
        };
        windowTarget.getFiremakingTrainingLocations = function getFiremakingTrainingLocations() {
            return cloneRouteLocations(firemakingLocations);
        };
        windowTarget.getMiningTrainingLocations = function getMiningTrainingLocations() {
            return cloneRouteLocations(miningLocations);
        };
        windowTarget.getRunecraftingAltarLocations = function getRunecraftingAltarLocations() {
            return cloneRouteLocations(runecraftingRoutes);
        };
        windowTarget.getRunecraftingAltarNameAt = function getRunecraftingAltarNameAtHook(x, y, z) {
            return getRunecraftingAltarNameAt(runecraftingRoutes, x, y, z);
        };
        windowTarget.getWoodcuttingTrainingLocations = function getWoodcuttingTrainingLocations() {
            return cloneRouteLocations(woodcuttingLocations);
        };
    }

    window.WorldTrainingLocationRuntime = {
        buildCookingTrainingLocations,
        buildMiningTrainingLocations,
        cloneRouteLocations,
        getRunecraftingAltarNameAt,
        publishTrainingLocationHooks
    };
})();
