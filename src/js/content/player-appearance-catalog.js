(function () {
    function packJagexHsl(h, s, l) {
        return ((h & 63) << 10) | ((s & 7) << 7) | (l & 127);
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function hexToRgb(hex) {
        if (typeof hex !== 'string') return null;
        const normalized = hex.trim().replace(/^#/, '');
        if (normalized.length !== 6) return null;
        return {
            r: parseInt(normalized.slice(0, 2), 16),
            g: parseInt(normalized.slice(2, 4), 16),
            b: parseInt(normalized.slice(4, 6), 16)
        };
    }

    function rgbToPackedJagexHsl(r, g, b) {
        const nr = clamp((Number(r) || 0) / 255, 0, 1);
        const ng = clamp((Number(g) || 0) / 255, 0, 1);
        const nb = clamp((Number(b) || 0) / 255, 0, 1);
        const max = Math.max(nr, ng, nb);
        const min = Math.min(nr, ng, nb);
        const lightness = (max + min) / 2;
        let hue = 0;
        let saturation = 0;

        if (max !== min) {
            const delta = max - min;
            saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
            if (max === nr) hue = ((ng - nb) / delta) + (ng < nb ? 6 : 0);
            else if (max === ng) hue = ((nb - nr) / delta) + 2;
            else hue = ((nr - ng) / delta) + 4;
            hue /= 6;
        }

        return packJagexHsl(
            clamp(Math.round(hue * 63), 0, 63),
            clamp(Math.round(saturation * 7), 0, 7),
            clamp(Math.round(lightness * 127), 0, 127)
        );
    }

    function hexToPackedJagexHsl(hex, fallback) {
        const rgb = hexToRgb(hex);
        if (!rgb) return fallback;
        return rgbToPackedJagexHsl(rgb.r, rgb.g, rgb.b);
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

    const PICKAXE_ICON_PIXELS = [
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '.......ffffff...................',
        '.........ffffff.................',
        '...........ffffff...............',
        '.............ffffffff...........',
        '................ffffff..........',
        '...............bbffffff.........',
        '..............bbbfffffff........',
        '.............bbccaaffffff.......',
        '............bbcca....ffff.......',
        '............bcca......fff.......',
        '...........bccba.......ff.......',
        '..........bccba.........ff......',
        '.........bccba...........f......',
        '........bccba...................',
        '.......bccba....................',
        '......bccba.....................',
        '.....bccba......................',
        '....bccba.......................',
        '...bccba........................',
        '..bbcba.........................',
        '..bcbba.........................',
        '.bbcba..........................',
        'bbcba...........................',
        'bcba............................',
        'bba.............................',
        'ba..............................'
    ];

    const STANDARD_RIGHT_HAND_WEAPON_HOLD = Object.freeze({
        pixelSize: 0.022,
        origin: [5.5, 24.5],
        rotation: [0.9561333749, -Math.PI / 2, 0],
        offset: [0, -0.02, 0.08]
    });
    const FISHING_ROD_UPWARD_TILT_RADIANS = 30 * (Math.PI / 180);
    const SWORD_UPWARD_TILT_RADIANS = 25 * (Math.PI / 180);
    const SWORD_WORLD_SCALE_MULTIPLIER = 1.15;

    function createRightHandHeldModel(options) {
        const safeOptions = options && typeof options === 'object' ? options : {};
        const heldModel = {
            pixelSize: Number.isFinite(safeOptions.pixelSize) ? safeOptions.pixelSize : STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize,
            depth: Number.isFinite(safeOptions.depth) ? safeOptions.depth : (Number.isFinite(safeOptions.pixelSize) ? safeOptions.pixelSize : STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize),
            origin: Array.isArray(safeOptions.origin) ? safeOptions.origin.slice() : STANDARD_RIGHT_HAND_WEAPON_HOLD.origin.slice(),
            rotation: Array.isArray(safeOptions.rotation) ? safeOptions.rotation.slice() : STANDARD_RIGHT_HAND_WEAPON_HOLD.rotation.slice(),
            offset: Array.isArray(safeOptions.offset) ? safeOptions.offset.slice() : STANDARD_RIGHT_HAND_WEAPON_HOLD.offset.slice()
        };
        if (typeof safeOptions.flipY === 'boolean') heldModel.flipY = safeOptions.flipY;
        if (Array.isArray(safeOptions.localRotationAxis)) heldModel.localRotationAxis = safeOptions.localRotationAxis.slice();
        if (Number.isFinite(safeOptions.localRotationAngle)) heldModel.localRotationAngle = safeOptions.localRotationAngle;
        if (typeof safeOptions.depthResolver === 'function') heldModel.depthResolver = safeOptions.depthResolver;
        if (safeOptions.metalRoleBySymbol && typeof safeOptions.metalRoleBySymbol === 'object') {
            heldModel.metalRoleBySymbol = Object.assign({}, safeOptions.metalRoleBySymbol);
        }
        if (safeOptions.depthBySymbol && typeof safeOptions.depthBySymbol === 'object') {
            heldModel.depthBySymbol = Object.assign({}, safeOptions.depthBySymbol);
        }
        if (Array.isArray(safeOptions.metalSymbols) && safeOptions.metalSymbols.length) {
            heldModel.metalSymbols = safeOptions.metalSymbols.slice();
        }
        return heldModel;
    }

    const PICKAXE_HELD_MODEL = createRightHandHeldModel({
        depth: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 2
    });

    const AXE_ICON_PIXELS = [
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '..............gffff.............',
        '.............ffffffff...........',
        '.............gfffffffff.........',
        '.............fffffffffg.........',
        '..............gffffff.fff.......',
        '............ffff.fbabf.fff......',
        '............gfffffacb...........',
        '............ffff..babb..........',
        '.............fff.bbabb..........',
        '..............bbabb.............',
        '.............bbacb..............',
        '............bbabb...............',
        '...........bbabb................',
        '..........bbacb.................',
        '.........bbabb..................',
        '........bbabb...................',
        '.......bbacb....................',
        '......bbabb.....................',
        '.....bbabb......................',
        '....bbacb.......................',
        '...bbabb........................',
        '..bbabb.........................',
        '.bbacb..........................',
        'bbabb...........................',
        'bba.............................',
        'ba..............................'
    ];

    const SWORD_ICON_PIXELS = [
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '.......................edf......',
        '......................eeed......',
        '....................eefed.......',
        '...................efffd........',
        '..................efffd.........',
        '..................efffd.........',
        '.................effdd..........',
        '................effd............',
        '...............effd.............',
        '..............effd..............',
        '........g....effd...............',
        '.........hh.effd................',
        '...........heed.................',
        '...........dhd..................',
        '........cbb.dh..................',
        '........cbb.dh..................',
        '.......ccbb...g.................',
        '......ccbaa.....................',
        '......bba.......................',
        '.....caa........................',
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '................................'
    ];

    const AXE_HELD_MODEL = createRightHandHeldModel({
        depth: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 3,
        origin: [6.5, 24.5],
        localRotationAxis: [1, 1, 0],
        localRotationAngle: Math.PI,
        depthBySymbol: {
            g: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize
        },
        metalSymbols: ['f', 'g']
    });

    function resolveSwordBladeDepth(symbol, x, y, defaultDepth, heldModel) {
        if (!/[def]/.test(symbol)) return defaultDepth;
        const pixelSize = heldModel && Number.isFinite(heldModel.pixelSize)
            ? heldModel.pixelSize
            : STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize;
        if (y === 6) return pixelSize;
        if (y === 7) return pixelSize * 2;
        return pixelSize * 3;
    }

    const SWORD_HELD_MODEL = createRightHandHeldModel({
        pixelSize: (STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 1.15) * SWORD_WORLD_SCALE_MULTIPLIER,
        depth: ((STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 1.15) * SWORD_WORLD_SCALE_MULTIPLIER) * 2,
        origin: [7.5, 24.5],
        rotation: [
            STANDARD_RIGHT_HAND_WEAPON_HOLD.rotation[0] - SWORD_UPWARD_TILT_RADIANS,
            STANDARD_RIGHT_HAND_WEAPON_HOLD.rotation[1],
            STANDARD_RIGHT_HAND_WEAPON_HOLD.rotation[2]
        ],
        depthResolver: resolveSwordBladeDepth,
        metalRoleBySymbol: {
            d: 'dark',
            e: 'mid',
            f: 'light'
        }
    });

    const RIGHT_HAND_METAL_TIER_PALETTES = Object.freeze({
        bronze: Object.freeze({ flat: '#f3b04e', dark: '#704332', mid: '#b87248', light: '#f0c28d' }),
        iron: Object.freeze({ flat: '#8da9d8', dark: '#4f5963', mid: '#97a3ae', light: '#e2e8ef' }),
        steel: Object.freeze({ flat: '#d9e2ec', dark: '#7b8a96', mid: '#becbd6', light: '#f6fbff' }),
        mithril: Object.freeze({ flat: '#244bdb', dark: '#18308f', mid: '#3f6aff', light: '#a9bcff' }),
        adamant: Object.freeze({ flat: '#28c57a', dark: '#1b7d4f', mid: '#45d895', light: '#b8ffd9' }),
        rune: Object.freeze({ flat: '#40f0ff', dark: '#217b93', mid: '#64d8ea', light: '#dcfbff' })
    });

    const RIGHT_HAND_METAL_TIER_COLORS = Object.freeze({
        bronze: RIGHT_HAND_METAL_TIER_PALETTES.bronze.flat,
        iron: RIGHT_HAND_METAL_TIER_PALETTES.iron.flat,
        steel: RIGHT_HAND_METAL_TIER_PALETTES.steel.flat,
        mithril: RIGHT_HAND_METAL_TIER_PALETTES.mithril.flat,
        adamant: RIGHT_HAND_METAL_TIER_PALETTES.adamant.flat,
        rune: RIGHT_HAND_METAL_TIER_PALETTES.rune.flat
    });

    const PICKAXE_HANDLE_PALETTE = Object.freeze({
        a: '#4f3219',
        b: '#7b5430',
        c: '#b78750'
    });

    const AXE_HANDLE_PALETTE = Object.freeze({
        a: '#4d3119',
        b: '#7b5530',
        c: '#b68550'
    });

    const SWORD_HANDLE_PALETTE = Object.freeze({
        a: '#4f3219',
        b: '#7b5430',
        c: '#b78750',
        g: '#bf8c54',
        h: '#f0c994'
    });

    const SMALL_NET_PALETTE = Object.freeze({
        a: '#4b3422',
        b: '#745339',
        c: '#a8825c'
    });

    const FISHING_ROD_PALETTE = Object.freeze({
        a: '#3f2a17',
        b: '#6b4a28',
        c: '#af7f4c',
        d: '#6d5130',
        e: '#d2ae7b',
        f: '#5c3d22',
        g: '#b98e5a',
        h: '#edf6ff',
        i: '#d94a40',
        j: '#cfd9e6'
    });

    const HARPOON_PALETTE = Object.freeze({
        a: '#4a3018',
        b: '#724f2d',
        c: '#ab8150',
        d: '#4d5967',
        e: '#8fa2b5',
        f: '#e1ebf4'
    });

    const RUNE_HARPOON_PALETTE = Object.freeze({
        a: '#4a3018',
        b: '#724f2d',
        c: '#ab8150',
        d: '#233a63',
        e: '#4f78c8',
        f: '#d7e2ff'
    });

    const SMALL_NET_ICON_PIXELS = [
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '......aaaaaaaaaaaaaaaaaaaa......',
        '.....aabbbaabbbaabbbaabbbaa.....',
        '.....abb.bbbb.bbbb.bbbb.bba.....',
        '.....ac...ac...ac...ac....c.....',
        '..........aa...aa...aa..........',
        '........aaaaaaaaaaaaaaaa........',
        '........abbbbabbbbabbbba........',
        '.......aab..bab..bab..baa.......',
        '.......ac...aca..aca...ca.......',
        '.......aaa..aaa..aaa..aaa.......',
        '......aaaaaaaaaaaaaaaaaaaa......',
        '.....aabbbaabbbaabbbaabbbaa.....',
        '.....abb.bbbb.bbbb.bbbb.bba.....',
        '.....aca..aca..aca..aca...c.....',
        '......aa...aa...aa...aa.........',
        '......a....a....a....a..........',
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '................................'
    ];

    const FISHING_ROD_ICON_PIXELS = [
        '................................',
        '................................',
        '................................',
        '................................',
        '.............................c..',
        '..........................aac...',
        '..........................aha...',
        '.........................bbaah..',
        '........................bcba....',
        '.......................bcca.h...',
        '......................bcca....h.',
        '.....................bcca.......',
        '....................acca.....h..',
        '...................acca.........',
        '..................acca........h.',
        '..................cca...........',
        '.................ccaa..........h',
        '................ccaa..........ii',
        '...............ccaa............j',
        '............g.bcba..............',
        '..........ff.gcba...............',
        '..........ffbgba................',
        '..........ffcba.................',
        '.........dddba..................',
        '........dddda...................',
        '.......deedda...................',
        '......deeed.....................',
        '.....deeed......................',
        '....ddeed.......................',
        '....dddd........................',
        '....eed.........................',
        '................................'
    ];

    const HARPOON_ICON_PIXELS = [
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '.............................f..',
        '...........................ffd..',
        '..........................dddd..',
        '.........................deedd..',
        '..................d.....defed...',
        '...................ee..deffd....',
        '....................eedeffd.....',
        '.....................eeffd......',
        '....................deffd.......',
        '...................ddeee........',
        '..................adeee.........',
        '.................abeed..........',
        '................abdda...........',
        '...............abcca............',
        '..............abcca.............',
        '.............abcca..............',
        '............abcca...............',
        '...........abcca................',
        '..........abcca.................',
        '.........abcca..................',
        '........abcca...................',
        '.......abcca....................',
        '......abcca.....................',
        '.....aabba......................',
        '.....aaaa.......................',
        '.....aaa........................',
        '................................',
        '................................'
    ];

    const TINDERBOX_ICON_PIXELS = [
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '.............bbbbbb.............',
        '...........bbccccccbb...........',
        '..........bbccccccccbb..........',
        '.........bbccccccccccbb.........',
        '.........bbccccccccccbb.........',
        '.........bbccccccccccbb.........',
        '.........bbccccccccccbb.........',
        '.........bbccccccccccbb.........',
        '.........bbccccccccccbb.........',
        '.........bbccccccccccbb.........',
        '.........bbccccccccccbb.........',
        '..........bbccccccccbb..........',
        '...........bbccccccbb...........',
        '............bbbbbbbb............',
        '..............dddd..............',
        '.............ddaadd.............',
        '............ddaaaadd............',
        '.............ddaadd.............',
        '..............dddd..............',
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '................................'
    ];

    const HAMMER_ICON_PIXELS = [
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '.........bbbbbbbbbbbb...........',
        '...........bbccccccccbb.........',
        '.............bbccccccccbb.......',
        '...............bbbbbbbbbbbb.....',
        '................aaa.............',
        '...............aaa..............',
        '..............aaa...............',
        '.............aaa................',
        '............aaa.................',
        '...........aaa..................',
        '..........aaa...................',
        '.........aaa....................',
        '........aaa.....................',
        '.......aaa......................',
        '......aaa.......................',
        '.....aaa........................',
        '....aaa.........................',
        '...aaa..........................',
        '..aaa...........................',
        '.aa.............................',
        '..a.............................',
        '................................',
        '................................',
        '................................',
        '................................',
        '................................'
    ];

    const SMALL_NET_HELD_MODEL = createRightHandHeldModel({
        depth: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.42,
        origin: [6.5, 18.5],
        offset: [0.01, -0.015, 0.08],
        depthBySymbol: {
            a: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.65,
            b: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.42,
            c: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.52
        }
    });

    const FISHING_ROD_HELD_MODEL = createRightHandHeldModel({
        pixelSize: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 1.45,
        depth: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.6,
        origin: [8.5, 26.5],
        rotation: [
            STANDARD_RIGHT_HAND_WEAPON_HOLD.rotation[0] - FISHING_ROD_UPWARD_TILT_RADIANS,
            STANDARD_RIGHT_HAND_WEAPON_HOLD.rotation[1],
            STANDARD_RIGHT_HAND_WEAPON_HOLD.rotation[2]
        ],
        offset: [0.005, -0.02, 0.08],
        depthBySymbol: {
            a: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.75,
            b: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.7,
            c: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.65,
            d: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.85,
            e: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.75,
            f: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.9,
            g: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.7,
            h: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.18,
            i: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.3,
            j: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.2
        }
    });

    const HARPOON_HELD_MODEL = createRightHandHeldModel({
        pixelSize: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 1.08,
        depth: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.74,
        origin: [6.5, 28.5],
        offset: [0.002, -0.02, 0.08],
        depthBySymbol: {
            a: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.82,
            b: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.82,
            c: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.82,
            d: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 1.2,
            e: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 1.02,
            f: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.86
        }
    });

    const TINDERBOX_HELD_MODEL = createRightHandHeldModel({
        pixelSize: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.82,
        depth: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 1.1,
        origin: [14.5, 18.5],
        offset: [0.01, -0.01, 0.075],
        depthBySymbol: {
            a: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.55,
            b: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 1.2,
            c: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 1.1,
            d: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.45
        }
    });

    const TINDERBOX_PALETTE = Object.freeze({
        a: '#b7c3d0',
        b: '#59381d',
        c: '#8b5a2b',
        d: '#3f4954'
    });

    const HAMMER_PALETTE = Object.freeze({
        a: '#6f4a29',
        b: '#b7c3d0',
        c: '#6d7985'
    });
    const HAMMER_HANDLE_ROTATION = Object.freeze([
        STANDARD_RIGHT_HAND_WEAPON_HOLD.rotation[0],
        STANDARD_RIGHT_HAND_WEAPON_HOLD.rotation[1],
        STANDARD_RIGHT_HAND_WEAPON_HOLD.rotation[2]
    ]);
    const HAMMER_HEAD_ROTATION = Object.freeze([
        STANDARD_RIGHT_HAND_WEAPON_HOLD.rotation[0],
        STANDARD_RIGHT_HAND_WEAPON_HOLD.rotation[1],
        STANDARD_RIGHT_HAND_WEAPON_HOLD.rotation[2] + (Math.PI / 2)
    ]);
    const HAMMER_HELD_FRAGMENTS = Object.freeze([
        {
            target: 'axe',
            shape: 'box',
            size: [STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 3, 0.46, STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 3],
            offset: [0.01, 0.11, 0.155],
            rotation: HAMMER_HANDLE_ROTATION.slice(),
            isHandle: true,
            headAnchorAlong: 0.16,
            rgbColor: HAMMER_PALETTE.a,
            color: hexToPackedJagexHsl(HAMMER_PALETTE.a, packJagexHsl(0, 0, 64))
        },
        {
            target: 'axe',
            shape: 'box',
            size: [STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 4.5, 0.18, STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 6],
            handleRelative: [0, 0, 0],
            rotation: HAMMER_HEAD_ROTATION.slice(),
            rgbColor: HAMMER_PALETTE.b,
            color: hexToPackedJagexHsl(HAMMER_PALETTE.b, packJagexHsl(0, 0, 64))
        },
        {
            target: 'axe',
            shape: 'box',
            size: [STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 1.6, 0.2, STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 6.2],
            handleRelative: [0, -0.01, 0],
            rotation: HAMMER_HEAD_ROTATION.slice(),
            rgbColor: HAMMER_PALETTE.c,
            color: hexToPackedJagexHsl(HAMMER_PALETTE.c, packJagexHsl(0, 0, 64))
        }
    ]);

    function getRightHandMetalTier(itemId) {
        if (typeof itemId !== 'string') return 'iron';
        const match = /^(bronze|iron|steel|mithril|adamant|rune)_/.exec(itemId);
        return match ? match[1] : 'iron';
    }

    function buildRightHandPalette(handlePalette, itemId, heldModel) {
        const metalTier = getRightHandMetalTier(itemId);
        const tierPalette = RIGHT_HAND_METAL_TIER_PALETTES[metalTier] || RIGHT_HAND_METAL_TIER_PALETTES.iron;
        const palette = Object.assign({}, handlePalette);
        const roleBySymbol = heldModel && heldModel.metalRoleBySymbol && typeof heldModel.metalRoleBySymbol === 'object'
            ? heldModel.metalRoleBySymbol
            : null;
        if (roleBySymbol) {
            const roleSymbols = Object.keys(roleBySymbol);
            for (let i = 0; i < roleSymbols.length; i++) {
                const symbol = roleSymbols[i];
                const role = roleBySymbol[symbol];
                palette[symbol] = tierPalette[role] || tierPalette.flat;
            }
            return palette;
        }
        const metalColor = tierPalette.flat;
        const symbols = Array.isArray(heldModel && heldModel.metalSymbols) && heldModel.metalSymbols.length
            ? heldModel.metalSymbols
            : ['f'];
        for (let i = 0; i < symbols.length; i++) palette[symbols[i]] = metalColor;
        return palette;
    }

    function buildPixelExtrudeFragments(pixelRows, palette, heldModel) {
        const fragments = [];
        const symbols = Object.keys(palette || {});
        for (let i = 0; i < symbols.length; i++) {
            const symbol = symbols[i];
            const colorHex = palette[symbol];
            if (symbol === '.' || colorHex === 'transparent') continue;
            const voxels = [];
            for (let y = 0; y < pixelRows.length; y++) {
                const row = pixelRows[y];
                for (let x = 0; x < row.length; x++) {
                    if (row[x] === symbol) voxels.push([x, y]);
                }
            }
            if (!voxels.length) continue;
            const depthBySymbol = heldModel && heldModel.depthBySymbol ? heldModel.depthBySymbol : null;
            const defaultDepth = depthBySymbol && Number.isFinite(depthBySymbol[symbol]) && depthBySymbol[symbol] > 0
                ? depthBySymbol[symbol]
                : heldModel.depth;
            const depthResolver = heldModel && typeof heldModel.depthResolver === 'function' ? heldModel.depthResolver : null;
            const voxelGroups = new Map();
            for (let voxelIndex = 0; voxelIndex < voxels.length; voxelIndex++) {
                const voxel = voxels[voxelIndex];
                let voxelDepth = defaultDepth;
                if (depthResolver) {
                    const resolvedDepth = depthResolver(symbol, voxel[0], voxel[1], defaultDepth, heldModel, pixelRows);
                    if (Number.isFinite(resolvedDepth) && resolvedDepth > 0) voxelDepth = resolvedDepth;
                }
                const depthKey = String(voxelDepth);
                if (!voxelGroups.has(depthKey)) voxelGroups.set(depthKey, { depth: voxelDepth, voxels: [] });
                voxelGroups.get(depthKey).voxels.push(voxel);
            }
            voxelGroups.forEach((group) => {
                fragments.push({
                    target: 'axe',
                    shape: 'pixelExtrude',
                    size: [heldModel.pixelSize, group.depth],
                    origin: heldModel.origin.slice(),
                    rotation: heldModel.rotation.slice(),
                    offset: heldModel.offset.slice(),
                    flipY: !!heldModel.flipY,
                    localRotationAxis: Array.isArray(heldModel.localRotationAxis) ? heldModel.localRotationAxis.slice() : null,
                    localRotationAngle: Number.isFinite(heldModel.localRotationAngle) ? heldModel.localRotationAngle : 0,
                    voxels: group.voxels,
                    rgbColor: colorHex,
                    color: hexToPackedJagexHsl(colorHex, packJagexHsl(0, 0, 64))
                });
            });
        }
        return fragments;
    }

    function createRightHandAppearanceItemDef(itemId, modelIds, pixelRows, heldModel, handlePalette) {
        const palette = buildRightHandPalette(handlePalette, itemId, heldModel);
        return {
            slot: 'weapon',
            maleModelIds: modelIds.male.slice(),
            femaleModelIds: modelIds.female.slice(),
            recolors: [],
            fragments: buildPixelExtrudeFragments(pixelRows, palette, heldModel)
        };
    }

    function createLiteralRightHandAppearanceItemDef(modelIds, pixelRows, heldModel, palette) {
        return {
            slot: 'weapon',
            maleModelIds: modelIds.male.slice(),
            femaleModelIds: modelIds.female.slice(),
            recolors: [],
            fragments: buildPixelExtrudeFragments(pixelRows, palette, heldModel)
        };
    }

    const pickaxeModelIds = {
        male: [1135, -1, -1],
        female: [1235, -1, -1]
    };

    const pickaxeItemDefs = {
        pickaxe_base_reference: createRightHandAppearanceItemDef('iron_pickaxe', pickaxeModelIds, PICKAXE_ICON_PIXELS, PICKAXE_HELD_MODEL, PICKAXE_HANDLE_PALETTE),
        bronze_pickaxe: createRightHandAppearanceItemDef('bronze_pickaxe', pickaxeModelIds, PICKAXE_ICON_PIXELS, PICKAXE_HELD_MODEL, PICKAXE_HANDLE_PALETTE),
        iron_pickaxe: createRightHandAppearanceItemDef('iron_pickaxe', pickaxeModelIds, PICKAXE_ICON_PIXELS, PICKAXE_HELD_MODEL, PICKAXE_HANDLE_PALETTE),
        steel_pickaxe: createRightHandAppearanceItemDef('steel_pickaxe', pickaxeModelIds, PICKAXE_ICON_PIXELS, PICKAXE_HELD_MODEL, PICKAXE_HANDLE_PALETTE),
        mithril_pickaxe: createRightHandAppearanceItemDef('mithril_pickaxe', pickaxeModelIds, PICKAXE_ICON_PIXELS, PICKAXE_HELD_MODEL, PICKAXE_HANDLE_PALETTE),
        adamant_pickaxe: createRightHandAppearanceItemDef('adamant_pickaxe', pickaxeModelIds, PICKAXE_ICON_PIXELS, PICKAXE_HELD_MODEL, PICKAXE_HANDLE_PALETTE),
        rune_pickaxe: createRightHandAppearanceItemDef('rune_pickaxe', pickaxeModelIds, PICKAXE_ICON_PIXELS, PICKAXE_HELD_MODEL, PICKAXE_HANDLE_PALETTE)
    };

    const axeModelIds = {
        male: [1100, -1, -1],
        female: [1200, -1, -1]
    };

    const axeItemDefs = {
        axe_base_reference: createRightHandAppearanceItemDef('iron_axe', axeModelIds, AXE_ICON_PIXELS, AXE_HELD_MODEL, AXE_HANDLE_PALETTE),
        bronze_axe: createRightHandAppearanceItemDef('bronze_axe', axeModelIds, AXE_ICON_PIXELS, AXE_HELD_MODEL, AXE_HANDLE_PALETTE),
        iron_axe: createRightHandAppearanceItemDef('iron_axe', axeModelIds, AXE_ICON_PIXELS, AXE_HELD_MODEL, AXE_HANDLE_PALETTE),
        steel_axe: createRightHandAppearanceItemDef('steel_axe', axeModelIds, AXE_ICON_PIXELS, AXE_HELD_MODEL, AXE_HANDLE_PALETTE),
        mithril_axe: createRightHandAppearanceItemDef('mithril_axe', axeModelIds, AXE_ICON_PIXELS, AXE_HELD_MODEL, AXE_HANDLE_PALETTE),
        adamant_axe: createRightHandAppearanceItemDef('adamant_axe', axeModelIds, AXE_ICON_PIXELS, AXE_HELD_MODEL, AXE_HANDLE_PALETTE),
        rune_axe: createRightHandAppearanceItemDef('rune_axe', axeModelIds, AXE_ICON_PIXELS, AXE_HELD_MODEL, AXE_HANDLE_PALETTE)
    };

    const swordModelIds = {
        male: [1100, -1, -1],
        female: [1200, -1, -1]
    };

    const swordItemDefs = {
        sword_base_reference: createRightHandAppearanceItemDef('iron_sword', swordModelIds, SWORD_ICON_PIXELS, SWORD_HELD_MODEL, SWORD_HANDLE_PALETTE),
        bronze_sword: createRightHandAppearanceItemDef('bronze_sword', swordModelIds, SWORD_ICON_PIXELS, SWORD_HELD_MODEL, SWORD_HANDLE_PALETTE),
        iron_sword: createRightHandAppearanceItemDef('iron_sword', swordModelIds, SWORD_ICON_PIXELS, SWORD_HELD_MODEL, SWORD_HANDLE_PALETTE),
        steel_sword: createRightHandAppearanceItemDef('steel_sword', swordModelIds, SWORD_ICON_PIXELS, SWORD_HELD_MODEL, SWORD_HANDLE_PALETTE),
        mithril_sword: createRightHandAppearanceItemDef('mithril_sword', swordModelIds, SWORD_ICON_PIXELS, SWORD_HELD_MODEL, SWORD_HANDLE_PALETTE),
        adamant_sword: createRightHandAppearanceItemDef('adamant_sword', swordModelIds, SWORD_ICON_PIXELS, SWORD_HELD_MODEL, SWORD_HANDLE_PALETTE),
        rune_sword: createRightHandAppearanceItemDef('rune_sword', swordModelIds, SWORD_ICON_PIXELS, SWORD_HELD_MODEL, SWORD_HANDLE_PALETTE)
    };

    const previewOnlyWeaponModelIds = {
        male: [-1, -1, -1],
        female: [-1, -1, -1]
    };

    const fishingRodModelIds = {
        male: [1135, -1, -1],
        female: [1235, -1, -1]
    };

    const harpoonModelIds = {
        male: [1135, -1, -1],
        female: [1235, -1, -1]
    };

    const utilityToolItemDefs = {
        fishing_rod: createLiteralRightHandAppearanceItemDef(fishingRodModelIds, FISHING_ROD_ICON_PIXELS, FISHING_ROD_HELD_MODEL, FISHING_ROD_PALETTE),
        small_net: createLiteralRightHandAppearanceItemDef(previewOnlyWeaponModelIds, SMALL_NET_ICON_PIXELS, SMALL_NET_HELD_MODEL, SMALL_NET_PALETTE),
        harpoon: createLiteralRightHandAppearanceItemDef(harpoonModelIds, HARPOON_ICON_PIXELS, HARPOON_HELD_MODEL, HARPOON_PALETTE),
        rune_harpoon: createLiteralRightHandAppearanceItemDef(harpoonModelIds, HARPOON_ICON_PIXELS, HARPOON_HELD_MODEL, RUNE_HARPOON_PALETTE),
        tinderbox: createLiteralRightHandAppearanceItemDef(previewOnlyWeaponModelIds, TINDERBOX_ICON_PIXELS, TINDERBOX_HELD_MODEL, TINDERBOX_PALETTE),
        hammer: {
            slot: 'weapon',
            maleModelIds: previewOnlyWeaponModelIds.male.slice(),
            femaleModelIds: previewOnlyWeaponModelIds.female.slice(),
            recolors: [],
            fragments: HAMMER_HELD_FRAGMENTS.map((fragment) => Object.assign({}, fragment, {
                size: Array.isArray(fragment.size) ? fragment.size.slice() : fragment.size,
                offset: Array.isArray(fragment.offset) ? fragment.offset.slice() : fragment.offset,
                rotation: Array.isArray(fragment.rotation) ? fragment.rotation.slice() : fragment.rotation,
                handleRelative: Array.isArray(fragment.handleRelative) ? fragment.handleRelative.slice() : fragment.handleRelative
            }))
        }
    };

    window.PlayerAppearanceCatalog = {
        version: '2026.03.m23',
        slotOrder: ['head', 'cape', 'neck', 'weapon', 'body', 'shield', 'legs', 'hands', 'feet', 'ring'],
        bodyColorFind,
        bodyColorPalettes,
        defaultSlotKits,
        kitDefs,
        itemDefs: Object.assign({}, pickaxeItemDefs, axeItemDefs, swordItemDefs, utilityToolItemDefs)
    };
})();
