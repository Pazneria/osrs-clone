(function () {
    function getActivePierConfig(sharedMaterials) {
        const pierConfig = (sharedMaterials && sharedMaterials.activePierConfig) || null;
        return isPierConfigEnabled(pierConfig) ? pierConfig : null;
    }

    function isPierConfigEnabled(pierConfig) {
        return !!(pierConfig && pierConfig.enabled !== false);
    }

    function isPierDeckTile(pierConfig, x, y, z) {
        return !!(
            isPierConfigEnabled(pierConfig)
            && z === 0
            && x >= pierConfig.xMin
            && x <= pierConfig.xMax
            && y >= pierConfig.yStart
            && y <= pierConfig.yEnd
        );
    }

    function isPierSideWaterTile(pierConfig, x, y, z) {
        return !!(
            isPierConfigEnabled(pierConfig)
            && z === 0
            && y >= (pierConfig.yStart + 1)
            && y <= pierConfig.yEnd
            && (x === (pierConfig.xMin - 1) || x === (pierConfig.xMax + 1))
        );
    }

    function isPierTipCoverageTile(pierConfig, x, y, z) {
        return !!(
            isPierConfigEnabled(pierConfig)
            && z === 0
            && y >= (pierConfig.yEnd - 1)
            && y <= pierConfig.yEnd
            && x >= (pierConfig.xMin - 1)
            && x <= (pierConfig.xMax + 1)
        );
    }

    function isPierVisualCoverageTile(pierConfig, x, y, z) {
        return !!(
            pierConfig
            && z === 0
            && (
                isPierDeckTile(pierConfig, x, y, z)
                || isPierSideWaterTile(pierConfig, x, y, z)
                || isPierTipCoverageTile(pierConfig, x, y, z)
            )
        );
    }

    window.WorldPierRuntime = {
        getActivePierConfig,
        isPierConfigEnabled,
        isPierDeckTile,
        isPierSideWaterTile,
        isPierTipCoverageTile,
        isPierVisualCoverageTile
    };
})();
