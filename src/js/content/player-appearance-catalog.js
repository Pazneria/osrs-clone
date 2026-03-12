(function () {
    function packJagexHsl(h, s, l) {
        return ((h & 63) << 10) | ((s & 7) << 7) | (l & 127);
    }

    const bodyColorFind = [
        packJagexHsl(2, 3, 64),  // hair
        packJagexHsl(10, 4, 72), // torso
        packJagexHsl(18, 4, 56), // legs
        packJagexHsl(22, 4, 44), // feet
        packJagexHsl(4, 2, 88)   // skin
    ];

    const bodyColorPalettes = [
        [packJagexHsl(2, 3, 64), packJagexHsl(3, 4, 58), packJagexHsl(5, 5, 52), packJagexHsl(7, 6, 50)],
        [packJagexHsl(10, 4, 72), packJagexHsl(16, 5, 60), packJagexHsl(21, 5, 58), packJagexHsl(31, 6, 52)],
        [packJagexHsl(18, 4, 56), packJagexHsl(25, 5, 50), packJagexHsl(36, 5, 48), packJagexHsl(45, 6, 42)],
        [packJagexHsl(22, 4, 44), packJagexHsl(30, 5, 40), packJagexHsl(41, 5, 36), packJagexHsl(52, 6, 34)],
        [packJagexHsl(4, 2, 88), packJagexHsl(5, 2, 78), packJagexHsl(6, 3, 66), packJagexHsl(7, 3, 54)]
    ];

    const defaultSlotKits = {
        0: ['kit_head_male', null, null, null, 'kit_body_male', null, 'kit_legs_male', 'kit_hands_male', 'kit_feet_male', null],
        1: ['kit_head_female', null, null, null, 'kit_body_female', null, 'kit_legs_female', 'kit_hands_female', 'kit_feet_female', null]
    };

    const kitDefs = {
        kit_head_male: { slot: 'head', fragments: [{ target: 'head', shape: 'box', size: [0.34, 0.34, 0.34], offset: [0, 0, 0], color: bodyColorFind[4], bodyColorIndex: 4 }] },
        kit_head_female: { slot: 'head', fragments: [{ target: 'head', shape: 'box', size: [0.32, 0.33, 0.33], offset: [0, 0, 0], color: bodyColorFind[4], bodyColorIndex: 4 }] },
        kit_body_male: { slot: 'body', fragments: [{ target: 'torso', shape: 'box', size: [0.54, 0.68, 0.30], offset: [0, 0, 0], color: bodyColorFind[1], bodyColorIndex: 1 }, { target: 'leftArm', shape: 'box', size: [0.20, 0.36, 0.20], offset: [0, -0.18, -0.08], color: bodyColorFind[1], bodyColorIndex: 1 }, { target: 'rightArm', shape: 'box', size: [0.20, 0.36, 0.20], offset: [0, -0.18, -0.08], color: bodyColorFind[1], bodyColorIndex: 1 }, { target: 'leftLowerArm', shape: 'box', size: [0.16, 0.34, 0.16], offset: [0, -0.17, 0.0], color: bodyColorFind[4], bodyColorIndex: 4 }, { target: 'rightLowerArm', shape: 'box', size: [0.16, 0.34, 0.16], offset: [0, -0.17, 0.0], color: bodyColorFind[4], bodyColorIndex: 4 }] },
        kit_body_female: { slot: 'body', fragments: [{ target: 'torso', shape: 'box', size: [0.50, 0.66, 0.28], offset: [0, 0, 0], color: bodyColorFind[1], bodyColorIndex: 1 }, { target: 'leftArm', shape: 'box', size: [0.18, 0.34, 0.18], offset: [0, -0.17, -0.08], color: bodyColorFind[1], bodyColorIndex: 1 }, { target: 'rightArm', shape: 'box', size: [0.18, 0.34, 0.18], offset: [0, -0.17, -0.08], color: bodyColorFind[1], bodyColorIndex: 1 }, { target: 'leftLowerArm', shape: 'box', size: [0.15, 0.32, 0.15], offset: [0, -0.16, 0.0], color: bodyColorFind[4], bodyColorIndex: 4 }, { target: 'rightLowerArm', shape: 'box', size: [0.15, 0.32, 0.15], offset: [0, -0.16, 0.0], color: bodyColorFind[4], bodyColorIndex: 4 }] },
        kit_legs_male: { slot: 'legs', fragments: [{ target: 'leftLeg', shape: 'box', size: [0.24, 0.36, 0.24], offset: [0, -0.18, 0], color: bodyColorFind[2], bodyColorIndex: 2 }, { target: 'rightLeg', shape: 'box', size: [0.24, 0.36, 0.24], offset: [0, -0.18, 0], color: bodyColorFind[2], bodyColorIndex: 2 }, { target: 'leftLowerLeg', shape: 'box', size: [0.22, 0.34, 0.22], offset: [0, -0.17, 0], color: bodyColorFind[2], bodyColorIndex: 2 }, { target: 'rightLowerLeg', shape: 'box', size: [0.22, 0.34, 0.22], offset: [0, -0.17, 0], color: bodyColorFind[2], bodyColorIndex: 2 }] },
        kit_legs_female: { slot: 'legs', fragments: [{ target: 'leftLeg', shape: 'box', size: [0.22, 0.34, 0.22], offset: [0, -0.17, 0], color: bodyColorFind[2], bodyColorIndex: 2 }, { target: 'rightLeg', shape: 'box', size: [0.22, 0.34, 0.22], offset: [0, -0.17, 0], color: bodyColorFind[2], bodyColorIndex: 2 }, { target: 'leftLowerLeg', shape: 'box', size: [0.20, 0.32, 0.20], offset: [0, -0.16, 0], color: bodyColorFind[2], bodyColorIndex: 2 }, { target: 'rightLowerLeg', shape: 'box', size: [0.20, 0.32, 0.20], offset: [0, -0.16, 0], color: bodyColorFind[2], bodyColorIndex: 2 }] },
        kit_hands_male: { slot: 'hands', fragments: [{ target: 'leftLowerArm', shape: 'box', size: [0.16, 0.16, 0.16], offset: [0, -0.30, 0.02], color: bodyColorFind[4], bodyColorIndex: 4 }, { target: 'rightLowerArm', shape: 'box', size: [0.16, 0.16, 0.16], offset: [0, -0.30, 0.02], color: bodyColorFind[4], bodyColorIndex: 4 }] },
        kit_hands_female: { slot: 'hands', fragments: [{ target: 'leftLowerArm', shape: 'box', size: [0.15, 0.15, 0.15], offset: [0, -0.30, 0.02], color: bodyColorFind[4], bodyColorIndex: 4 }, { target: 'rightLowerArm', shape: 'box', size: [0.15, 0.15, 0.15], offset: [0, -0.30, 0.02], color: bodyColorFind[4], bodyColorIndex: 4 }] },
        kit_feet_male: { slot: 'feet', fragments: [{ target: 'leftLowerLeg', shape: 'box', size: [0.25, 0.10, 0.32], offset: [0, -0.28, 0.03], color: bodyColorFind[3], bodyColorIndex: 3 }, { target: 'rightLowerLeg', shape: 'box', size: [0.25, 0.10, 0.32], offset: [0, -0.28, 0.03], color: bodyColorFind[3], bodyColorIndex: 3 }] },
        kit_feet_female: { slot: 'feet', fragments: [{ target: 'leftLowerLeg', shape: 'box', size: [0.24, 0.10, 0.30], offset: [0, -0.26, 0.03], color: bodyColorFind[3], bodyColorIndex: 3 }, { target: 'rightLowerLeg', shape: 'box', size: [0.24, 0.10, 0.30], offset: [0, -0.26, 0.03], color: bodyColorFind[3], bodyColorIndex: 3 }] }
    };

    const fragmentSets = {
        pickaxe_base: [
            { target: 'axe', shape: 'cylinder4', size: [0.030, 0.66, 0.030], rotation: [Math.PI / 2, 0, 0], offset: [0, -0.02, 0.24], isHandle: true, headAnchorAlong: -0.33, color: packJagexHsl(12, 4, 35) },
            { target: 'axe', shape: 'torusArcTaper', size: [0.67, 0.05, 1.02, 14, 42, 1.55], rotation: [Math.PI / 2, -Math.PI / 2, 1.0507963268], handleRelative: [0.0, 0.0, 0.0], color: packJagexHsl(0, 0, 80) }
        ]
    };

    const itemDefs = {
        iron_axe: {
            slot: 'weapon',
            maleModelIds: [1100, -1, -1],
            femaleModelIds: [1200, -1, -1],
            recolors: [],
            fragments: [
                { target: 'axe', shape: 'cylinder4', size: [0.028, 0.62, 0.028], rotation: [Math.PI / 2, 0, 0], offset: [0, -0.02, 0.24], color: packJagexHsl(12, 4, 38) },
                { target: 'axe', shape: 'box', size: [0.06, 0.28, 0.18], offset: [0, -0.16, 0.48], color: packJagexHsl(0, 0, 76) },
                { target: 'axe', shape: 'box', size: [0.04, 0.18, 0.10], offset: [0, -0.02, 0.47], color: packJagexHsl(0, 0, 86) }
            ]
        },
        pickaxe_base_reference: {
            slot: 'weapon',
            maleModelIds: [1135, -1, -1],
            femaleModelIds: [1235, -1, -1],
            recolors: [],
            fragments: fragmentSets.pickaxe_base
        },
        iron_pickaxe: {
            slot: 'weapon',
            maleModelIds: [1135, -1, -1],
            femaleModelIds: [1235, -1, -1],
            recolors: [],
            fragments: fragmentSets.pickaxe_base
        }
    };

    window.PlayerAppearanceCatalog = {
        version: '2026.03.m1',
        slotOrder: ['head', 'cape', 'neck', 'weapon', 'body', 'shield', 'legs', 'hands', 'feet', 'ring'],
        bodyColorFind,
        bodyColorPalettes,
        defaultSlotKits,
        kitDefs,
        itemDefs
    };
})();
