(function () {
    function treeNodeKey(x, y, z = 0) {
        return z + ':' + x + ',' + y;
    }

    function sanitizeTreeNodeId(nodeId) {
        return (typeof nodeId === 'string' && nodeId) ? nodeId : 'normal_tree';
    }

    function sanitizeNullableString(value) {
        return (typeof value === 'string' && value) ? value : null;
    }

    function createTreeNodeRecord(nodeId = 'normal_tree', options = {}) {
        return {
            nodeId: sanitizeTreeNodeId(nodeId),
            areaGateFlag: sanitizeNullableString(options && options.areaGateFlag),
            areaName: sanitizeNullableString(options && options.areaName),
            areaGateMessage: sanitizeNullableString(options && options.areaGateMessage)
        };
    }

    function createDefaultTreeNodeRecord() {
        return createTreeNodeRecord('normal_tree');
    }

    function preserveTreeNodeRecord(prev) {
        if (!prev) return createDefaultTreeNodeRecord();
        return createTreeNodeRecord(prev.nodeId || 'normal_tree', {
            areaGateFlag: prev.areaGateFlag || null,
            areaName: prev.areaName || null,
            areaGateMessage: prev.areaGateMessage || null
        });
    }

    function rebuildTreeNodes(input = {}) {
        const rebuilt = {};
        const logicalMap = input.logicalMap || [];
        const existingTreeNodes = input.existingTreeNodes || {};
        const isTreeTileId = typeof input.isTreeTileId === 'function' ? input.isTreeTileId : null;
        const planes = Number.isFinite(input.planes) ? input.planes : 0;
        const mapSize = Number.isFinite(input.mapSize) ? input.mapSize : 0;
        if (!isTreeTileId) return rebuilt;

        for (let z = 0; z < planes; z++) {
            for (let y = 0; y < mapSize; y++) {
                for (let x = 0; x < mapSize; x++) {
                    const tile = logicalMap[z] && logicalMap[z][y] ? logicalMap[z][y][x] : null;
                    if (!isTreeTileId(tile)) continue;
                    const key = treeNodeKey(x, y, z);
                    rebuilt[key] = preserveTreeNodeRecord(existingTreeNodes[key]);
                }
            }
        }
        return rebuilt;
    }

    window.WorldTreeNodeRuntime = {
        createDefaultTreeNodeRecord,
        createTreeNodeRecord,
        preserveTreeNodeRecord,
        rebuildTreeNodes,
        treeNodeKey
    };
})();
