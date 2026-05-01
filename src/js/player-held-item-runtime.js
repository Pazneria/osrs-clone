(function () {
    const SKILLING_TOOL_VISUAL_GROUP_NAME = 'pm-skillingToolVisual';
    const RIGHT_HAND_HELD_ITEM_SLOT = 'rightHand';
    const LEFT_HAND_HELD_ITEM_SLOT = 'leftHand';

    function getThreeRef(options = {}) {
        return options.THREERef || (typeof THREE !== 'undefined' ? THREE : null);
    }

    function normalizeHeldItemSlot(slot) {
        return slot === LEFT_HAND_HELD_ITEM_SLOT ? LEFT_HAND_HELD_ITEM_SLOT : RIGHT_HAND_HELD_ITEM_SLOT;
    }

    function createEmptyHeldItemVisualMap() {
        return {
            rightHand: null,
            leftHand: null
        };
    }

    function normalizeHeldItemVisualId(itemId) {
        return (typeof itemId === 'string' && itemId) ? itemId : null;
    }

    function normalizeHeldItemVisualMap(heldItems) {
        const normalized = createEmptyHeldItemVisualMap();
        if (!heldItems || typeof heldItems !== 'object') return normalized;
        normalized.rightHand = normalizeHeldItemVisualId(heldItems.rightHand);
        normalized.leftHand = normalizeHeldItemVisualId(heldItems.leftHand);
        return normalized;
    }

    function areHeldItemVisualMapsEqual(left, right) {
        return (!!left ? left.rightHand : null) === (!!right ? right.rightHand : null)
            && (!!left ? left.leftHand : null) === (!!right ? right.leftHand : null);
    }

    function resolvePrimaryHeldItemVisualSlot(heldItems, preferredSlot = null) {
        const normalizedPreferredSlot = preferredSlot ? normalizeHeldItemSlot(preferredSlot) : null;
        if (normalizedPreferredSlot && heldItems[normalizedPreferredSlot]) return normalizedPreferredSlot;
        if (heldItems.rightHand) return RIGHT_HAND_HELD_ITEM_SLOT;
        if (heldItems.leftHand) return LEFT_HAND_HELD_ITEM_SLOT;
        return normalizedPreferredSlot || RIGHT_HAND_HELD_ITEM_SLOT;
    }

    function ensureSkillingToolVisualGroup(options = {}, anchorNode) {
        const THREERef = getThreeRef(options);
        if (!THREERef || !anchorNode) return null;
        let group = anchorNode.getObjectByName(SKILLING_TOOL_VISUAL_GROUP_NAME);
        if (group && group.parent === anchorNode) return group;
        group = new THREERef.Group();
        group.name = SKILLING_TOOL_VISUAL_GROUP_NAME;
        anchorNode.add(group);
        return group;
    }

    function clearObjectChildren(node) {
        if (!node) return;
        while (node.children.length > 0) {
            node.remove(node.children[node.children.length - 1]);
        }
    }

    function setBaseToolVisualVisibility(axeNode, visible) {
        if (!axeNode) return;
        for (let i = 0; i < axeNode.children.length; i++) {
            const child = axeNode.children[i];
            if (!child || child.name === SKILLING_TOOL_VISUAL_GROUP_NAME) continue;
            child.visible = !!visible;
        }
    }

    function hasBaseToolVisual(axeNode) {
        if (!axeNode) return false;
        for (let i = 0; i < axeNode.children.length; i++) {
            const child = axeNode.children[i];
            if (!child || child.name === SKILLING_TOOL_VISUAL_GROUP_NAME) continue;
            return true;
        }
        return false;
    }

    function resolveRigToolAnchors(rigRoot) {
        const rig = rigRoot && rigRoot.userData ? rigRoot.userData.rig : null;
        if (!rig) return { right: null, left: null };
        return {
            right: rig.rightTool || rig.axe || null,
            left: rig.leftTool || null
        };
    }

    function setPlayerRigToolVisuals(options = {}, rigRoot, heldItems, primaryHeldItemSlot = null) {
        if (!rigRoot || !rigRoot.userData || !rigRoot.userData.rig) return;
        if (typeof options.createEquipmentVisualMeshes !== 'function') return;
        const anchors = resolveRigToolAnchors(rigRoot);
        const rightAnchor = anchors.right;
        const leftAnchor = anchors.left;
        if (!rightAnchor && !leftAnchor) return;
        const desiredHeldItems = normalizeHeldItemVisualMap(heldItems);
        const desiredSlot = resolvePrimaryHeldItemVisualSlot(
            desiredHeldItems,
            primaryHeldItemSlot || rigRoot.userData.animationHeldItemSlot || null
        );
        const rightSkillingToolGroup = ensureSkillingToolVisualGroup(options, rightAnchor);
        const leftSkillingToolGroup = ensureSkillingToolVisualGroup(options, leftAnchor);
        const suppressBaseToolVisual = !!rigRoot.userData.suppressBaseToolVisual;
        const rightBaseToolVisible = hasBaseToolVisual(rightAnchor) && !suppressBaseToolVisual;
        const leftBaseToolVisible = hasBaseToolVisual(leftAnchor);

        if (areHeldItemVisualMapsEqual(rigRoot.userData.skillingToolVisuals, desiredHeldItems)
            && rigRoot.userData.skillingToolVisualSlot === desiredSlot
            && !!rigRoot.userData.appliedSuppressBaseToolVisual === suppressBaseToolVisual) return;

        clearObjectChildren(rightSkillingToolGroup);
        clearObjectChildren(leftSkillingToolGroup);
        rigRoot.userData.skillingToolVisuals = {
            rightHand: desiredHeldItems.rightHand,
            leftHand: desiredHeldItems.leftHand
        };
        rigRoot.userData.animationHeldItems = {
            rightHand: desiredHeldItems.rightHand,
            leftHand: desiredHeldItems.leftHand
        };
        rigRoot.userData.animationHeldItemSlot = desiredSlot;
        rigRoot.userData.skillingToolVisualId = desiredHeldItems[desiredSlot] || null;
        rigRoot.userData.skillingToolVisualSlot = desiredSlot;
        rigRoot.userData.appliedSuppressBaseToolVisual = suppressBaseToolVisual;
        if (rightSkillingToolGroup) rightSkillingToolGroup.visible = !!desiredHeldItems.rightHand;
        if (leftSkillingToolGroup) leftSkillingToolGroup.visible = !!desiredHeldItems.leftHand;
        setBaseToolVisualVisibility(rightAnchor, !desiredHeldItems.rightHand && !suppressBaseToolVisual);
        setBaseToolVisualVisibility(leftAnchor, !desiredHeldItems.leftHand);
        if (rightAnchor) rightAnchor.visible = !!desiredHeldItems.rightHand || rightBaseToolVisible;
        if (leftAnchor) leftAnchor.visible = !!desiredHeldItems.leftHand || leftBaseToolVisible;

        const populateAnchor = (itemId, skillingToolGroup) => {
            const desiredId = normalizeHeldItemVisualId(itemId);
            if (!desiredId || !skillingToolGroup) return;
            let toolMeshes = options.createEquipmentVisualMeshes(desiredId, 'axe');
            let fallbackId = null;
            if (/_pickaxe$/.test(desiredId)) fallbackId = 'pickaxe_base_reference';
            else if (/_axe$/.test(desiredId)) fallbackId = 'axe_base_reference';
            else if (/_sword$/.test(desiredId)) fallbackId = 'sword_base_reference';
            if (toolMeshes.length === 0 && fallbackId && desiredId !== fallbackId) {
                toolMeshes = options.createEquipmentVisualMeshes(fallbackId, 'axe');
            }
            for (let i = 0; i < toolMeshes.length; i++) skillingToolGroup.add(toolMeshes[i]);
        };

        populateAnchor(desiredHeldItems.rightHand, rightSkillingToolGroup);
        populateAnchor(desiredHeldItems.leftHand, leftSkillingToolGroup);
    }

    function setPlayerRigToolVisual(options = {}, rigRoot, itemId, heldItemSlot = null) {
        const desiredId = normalizeHeldItemVisualId(itemId);
        if (!desiredId) {
            setPlayerRigToolVisuals(options, rigRoot, null, heldItemSlot);
            return;
        }
        const desiredSlot = normalizeHeldItemSlot(heldItemSlot);
        const desiredHeldItems = createEmptyHeldItemVisualMap();
        desiredHeldItems[desiredSlot] = desiredId;
        setPlayerRigToolVisuals(options, rigRoot, desiredHeldItems, desiredSlot);
    }

    function publishHeldItemVisualHooks(options = {}) {
        const windowRef = options.windowRef || (typeof window !== 'undefined' ? window : null);
        if (!windowRef) return;
        if (typeof options.setPlayerRigToolVisuals === 'function') {
            windowRef.setPlayerRigToolVisuals = options.setPlayerRigToolVisuals;
        }
        if (typeof options.setPlayerRigToolVisual === 'function') {
            windowRef.setPlayerRigToolVisual = options.setPlayerRigToolVisual;
        }
    }

    window.PlayerHeldItemRuntime = {
        SKILLING_TOOL_VISUAL_GROUP_NAME,
        normalizeHeldItemSlot,
        normalizeHeldItemVisualMap,
        publishHeldItemVisualHooks,
        resolvePrimaryHeldItemVisualSlot,
        setPlayerRigToolVisual,
        setPlayerRigToolVisuals
    };
})();
