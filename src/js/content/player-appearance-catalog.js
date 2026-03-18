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

    const HEAD_SLOT_FITS = Object.freeze({
        male: Object.freeze({ size: Object.freeze([0.34, 0.34, 0.34]), offset: Object.freeze([0, 0, 0]) }),
        female: Object.freeze({ size: Object.freeze([0.32, 0.33, 0.33]), offset: Object.freeze([0, 0, 0]) })
    });

    const BODY_SLOT_FITS = Object.freeze({
        male: Object.freeze({
            torso: Object.freeze({ size: Object.freeze([0.54, 0.68, 0.30]), offset: Object.freeze([0, 0, 0]) }),
            upperArm: Object.freeze({ size: Object.freeze([0.20, 0.36, 0.20]), offset: Object.freeze([0, -0.18, -0.08]) }),
            lowerArm: Object.freeze({ size: Object.freeze([0.16, 0.34, 0.16]), offset: Object.freeze([0, -0.17, 0.0]) })
        }),
        female: Object.freeze({
            torso: Object.freeze({ size: Object.freeze([0.50, 0.66, 0.28]), offset: Object.freeze([0, 0, 0]) }),
            upperArm: Object.freeze({ size: Object.freeze([0.18, 0.34, 0.18]), offset: Object.freeze([0, -0.17, -0.08]) }),
            lowerArm: Object.freeze({ size: Object.freeze([0.15, 0.32, 0.15]), offset: Object.freeze([0, -0.16, 0.0]) })
        })
    });

    const LEGS_SLOT_FITS = Object.freeze({
        male: Object.freeze({
            upperLeg: Object.freeze({ size: Object.freeze([0.24, 0.36, 0.24]), offset: Object.freeze([0, -0.18, 0]) }),
            lowerLeg: Object.freeze({ size: Object.freeze([0.22, 0.34, 0.22]), offset: Object.freeze([0, -0.17, 0]) })
        }),
        female: Object.freeze({
            upperLeg: Object.freeze({ size: Object.freeze([0.22, 0.34, 0.22]), offset: Object.freeze([0, -0.17, 0]) }),
            lowerLeg: Object.freeze({ size: Object.freeze([0.20, 0.32, 0.20]), offset: Object.freeze([0, -0.16, 0]) })
        })
    });

    const FEET_SLOT_FITS = Object.freeze({
        male: Object.freeze({ size: Object.freeze([0.25, 0.10, 0.32]), offset: Object.freeze([0, -0.28, 0.03]) }),
        female: Object.freeze({ size: Object.freeze([0.24, 0.10, 0.30]), offset: Object.freeze([0, -0.26, 0.03]) })
    });

    const HEAD_ARMOR_SHELL_GROWTH = Object.freeze([0.06, 0.06, 0.06]);

    const BODY_ARMOR_SHELL_GROWTH = Object.freeze({
        torso: Object.freeze([0.04, 0.04, 0.06]),
        upperArm: Object.freeze([0.03, 0.02, 0.03]),
        lowerArm: Object.freeze([0.025, 0.02, 0.025])
    });

    const PLATELEGS_ARMOR_SHELL_GROWTH = Object.freeze({
        upperLeg: Object.freeze([0.03, 0.02, 0.03]),
        lowerLeg: Object.freeze([0.03, 0.02, 0.03])
    });

    const BOOTS_ARMOR_SHELL_GROWTH = Object.freeze([0.03, 0.02, 0.05]);

    function cloneTriplet(values) {
        return Array.isArray(values) ? values.slice(0, 3) : [0, 0, 0];
    }

    function addTriplets(base, delta) {
        const safeBase = cloneTriplet(base);
        const safeDelta = cloneTriplet(delta);
        return [
            safeBase[0] + safeDelta[0],
            safeBase[1] + safeDelta[1],
            safeBase[2] + safeDelta[2]
        ];
    }

    function createAppearanceBoxFragment(target, size, offset, options = {}) {
        const fragment = {
            target,
            shape: 'box',
            size: cloneTriplet(size),
            offset: cloneTriplet(offset),
            color: Number.isFinite(options.color) ? options.color : packJagexHsl(0, 0, 64)
        };
        if (typeof options.rgbColor === 'string') fragment.rgbColor = options.rgbColor;
        if (Number.isInteger(options.bodyColorIndex)) fragment.bodyColorIndex = options.bodyColorIndex;
        if (Array.isArray(options.rotation)) fragment.rotation = options.rotation.slice(0, 3);
        return fragment;
    }

    function cloneFragment(fragment) {
        if (!fragment || typeof fragment !== 'object') return null;
        const next = Object.assign({}, fragment);
        if (Array.isArray(fragment.size)) next.size = fragment.size.slice();
        if (Array.isArray(fragment.offset)) next.offset = fragment.offset.slice();
        if (Array.isArray(fragment.rotation)) next.rotation = fragment.rotation.slice();
        if (Array.isArray(fragment.origin)) next.origin = fragment.origin.slice();
        if (Array.isArray(fragment.handleRelative)) next.handleRelative = fragment.handleRelative.slice();
        if (Array.isArray(fragment.localRotationAxis)) next.localRotationAxis = fragment.localRotationAxis.slice();
        if (Array.isArray(fragment.voxels)) next.voxels = fragment.voxels.map((voxel) => (Array.isArray(voxel) ? voxel.slice() : voxel));
        return next;
    }

    function cloneFragmentList(fragments) {
        return Array.isArray(fragments)
            ? fragments.map((fragment) => cloneFragment(fragment)).filter(Boolean)
            : [];
    }

    function createBaseBodyKitDef(fit) {
        return {
            slot: 'body',
            fragments: [
                createAppearanceBoxFragment('torso', fit.torso.size, fit.torso.offset, { color: bodyColorFind[1], bodyColorIndex: 1 }),
                createAppearanceBoxFragment('leftArm', fit.upperArm.size, fit.upperArm.offset, { color: bodyColorFind[1], bodyColorIndex: 1 }),
                createAppearanceBoxFragment('rightArm', fit.upperArm.size, fit.upperArm.offset, { color: bodyColorFind[1], bodyColorIndex: 1 }),
                createAppearanceBoxFragment('leftLowerArm', fit.lowerArm.size, fit.lowerArm.offset, { color: bodyColorFind[4], bodyColorIndex: 4 }),
                createAppearanceBoxFragment('rightLowerArm', fit.lowerArm.size, fit.lowerArm.offset, { color: bodyColorFind[4], bodyColorIndex: 4 })
            ]
        };
    }

    function createBaseHeadKitDef(fit) {
        return {
            slot: 'head',
            fragments: [
                createAppearanceBoxFragment('head', fit.size, fit.offset, { color: bodyColorFind[4], bodyColorIndex: 4 })
            ]
        };
    }

    function createBaseLegsKitDef(fit) {
        return {
            slot: 'legs',
            fragments: [
                createAppearanceBoxFragment('leftLeg', fit.upperLeg.size, fit.upperLeg.offset, { color: bodyColorFind[2], bodyColorIndex: 2 }),
                createAppearanceBoxFragment('rightLeg', fit.upperLeg.size, fit.upperLeg.offset, { color: bodyColorFind[2], bodyColorIndex: 2 }),
                createAppearanceBoxFragment('leftLowerLeg', fit.lowerLeg.size, fit.lowerLeg.offset, { color: bodyColorFind[2], bodyColorIndex: 2 }),
                createAppearanceBoxFragment('rightLowerLeg', fit.lowerLeg.size, fit.lowerLeg.offset, { color: bodyColorFind[2], bodyColorIndex: 2 })
            ]
        };
    }

    function createBaseFeetKitDef(fit) {
        return {
            slot: 'feet',
            fragments: [
                createAppearanceBoxFragment('leftLowerLeg', fit.size, fit.offset, { color: bodyColorFind[3], bodyColorIndex: 3 }),
                createAppearanceBoxFragment('rightLowerLeg', fit.size, fit.offset, { color: bodyColorFind[3], bodyColorIndex: 3 })
            ]
        };
    }

    const defaultSlotKits = {
        0: ['kit_head_male', null, null, null, 'kit_body_male', null, 'kit_legs_male', 'kit_hands_male', 'kit_feet_male', null],
        1: ['kit_head_female', null, null, null, 'kit_body_female', null, 'kit_legs_female', 'kit_hands_female', 'kit_feet_female', null]
    };

    const kitDefs = {
        kit_head_male: createBaseHeadKitDef(HEAD_SLOT_FITS.male),
        kit_head_female: createBaseHeadKitDef(HEAD_SLOT_FITS.female),
        kit_body_male: createBaseBodyKitDef(BODY_SLOT_FITS.male),
        kit_body_female: createBaseBodyKitDef(BODY_SLOT_FITS.female),
        kit_legs_male: createBaseLegsKitDef(LEGS_SLOT_FITS.male),
        kit_legs_female: createBaseLegsKitDef(LEGS_SLOT_FITS.female),
        kit_hands_male: { slot: 'hands', fragments: [{ target: 'leftLowerArm', shape: 'box', size: [0.16, 0.16, 0.16], offset: [0, -0.30, 0.02], color: bodyColorFind[4], bodyColorIndex: 4 }, { target: 'rightLowerArm', shape: 'box', size: [0.16, 0.16, 0.16], offset: [0, -0.30, 0.02], color: bodyColorFind[4], bodyColorIndex: 4 }] },
        kit_hands_female: { slot: 'hands', fragments: [{ target: 'leftLowerArm', shape: 'box', size: [0.15, 0.15, 0.15], offset: [0, -0.30, 0.02], color: bodyColorFind[4], bodyColorIndex: 4 }, { target: 'rightLowerArm', shape: 'box', size: [0.15, 0.15, 0.15], offset: [0, -0.30, 0.02], color: bodyColorFind[4], bodyColorIndex: 4 }] },
        kit_feet_male: createBaseFeetKitDef(FEET_SLOT_FITS.male),
        kit_feet_female: createBaseFeetKitDef(FEET_SLOT_FITS.female)
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
    const RUNE_ARMOR_TIER_PALETTE = Object.freeze({
        flat: '#54daf1',
        dark: '#13354d',
        mid: '#2f7097',
        accent: '#8fefff',
        light: '#efffff'
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

    const KNIFE_PALETTE = Object.freeze({
        a: '#4b301c',
        b: '#7a5533',
        c: '#b98958',
        d: '#707987',
        e: '#c7d0da',
        f: '#f4fbff',
        g: '#7d6642',
        h: '#c5a56f'
    });

    const REGULAR_LOGS_PALETTE = Object.freeze({
        a: '#3a2515',
        b: '#5c3920',
        c: '#8a5a31',
        d: '#b17a46',
        f: '#d6b27a',
        g: '#9b7c50'
    });

    const OAK_LOGS_PALETTE = Object.freeze({
        a: '#442816',
        b: '#704124',
        c: '#a45f33',
        d: '#cb844a',
        f: '#e6c694',
        g: '#b27242'
    });

    const WILLOW_LOGS_PALETTE = Object.freeze({
        a: '#3a2b18',
        b: '#5d4826',
        c: '#7b6235',
        d: '#9a7a46',
        f: '#b59a6d',
        g: '#7d8b43'
    });

    const MAPLE_LOGS_PALETTE = Object.freeze({
        a: '#452716',
        b: '#714126',
        c: '#ad6236',
        d: '#d98a4b',
        f: '#efc995',
        g: '#bd7540'
    });

    const YEW_LOGS_PALETTE = Object.freeze({
        a: '#2f1d18',
        b: '#4d2b24',
        c: '#774137',
        d: '#9f5c4f',
        f: '#c98f76',
        g: '#874d43'
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

    const KNIFE_ICON_PIXELS = [
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '....................f...........',
        '...................ef...........',
        '..................def...........',
        '.................def............',
        '................dee.............',
        '...............dee..............',
        '..............dee...............',
        '.............dee................',
        '............dee.................',
        '...........dee..................',
        '..........ggd...................',
        '.........ahg....................',
        '........abh.....................',
        '.......abc......................',
        '......abc.......................',
        '.....abc........................',
        '....abc.........................',
        '...aab..........................',
        '...aba..........................',
        '....ba..........................',
        '................................',
        '................................',
        '................................',
        '................................',
        '................................'
    ];

    const LOG_BUNDLE_ICON_PIXELS = [
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '...........aaaaaaaaaa...........',
        '..........acccddddccca..........',
        '.........afffddddccfffa.........',
        '.........afgfcccccddgfa.........',
        '........afgggfccccfgggfa........',
        '........aafgfccccccfgfa.........',
        '......aacccddddddcccffa.........',
        '.....acfffcccddcccfffca.........',
        '.....afgggdddccccfgggfa.........',
        '.....afgggfccccdddgggfa.........',
        '.....afgggfccccccfgggfa.........',
        '.....afgggfccccccfgggfa.........',
        '.....acfffcccbbcccfffca.........',
        '......aacccbbbbbbcccaa..........',
        '........aaaaaaaaaaaa............',
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
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

    const KNIFE_HELD_MODEL = createRightHandHeldModel({
        pixelSize: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.92,
        depth: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.6,
        origin: [8.5, 19.5],
        offset: [0.006, -0.018, 0.082],
        depthBySymbol: {
            a: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.8,
            b: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.84,
            c: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.84,
            d: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.62,
            e: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.58,
            f: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.52,
            g: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.76,
            h: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.8
        }
    });

    const LOG_BUNDLE_HELD_MODEL = createRightHandHeldModel({
        pixelSize: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.78,
        depth: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize,
        origin: [15.5, 18.5],
        rotation: [
            STANDARD_RIGHT_HAND_WEAPON_HOLD.rotation[0] - (8 * (Math.PI / 180)),
            STANDARD_RIGHT_HAND_WEAPON_HOLD.rotation[1],
            STANDARD_RIGHT_HAND_WEAPON_HOLD.rotation[2]
        ],
        offset: [0.008, -0.018, 0.064],
        depthBySymbol: {
            a: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 1.15,
            b: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 1.15,
            c: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 1.15,
            d: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 1.15,
            f: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize * 0.82,
            g: STANDARD_RIGHT_HAND_WEAPON_HOLD.pixelSize
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

    function getMetalTierPalette(itemId) {
        const metalTier = getRightHandMetalTier(itemId);
        return RIGHT_HAND_METAL_TIER_PALETTES[metalTier] || RIGHT_HAND_METAL_TIER_PALETTES.iron;
    }

    function buildRightHandPalette(handlePalette, itemId, heldModel) {
        const tierPalette = getMetalTierPalette(itemId);
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

    function createBodyAppearanceItemDef(modelIds, fragmentsByGender) {
        const maleSource = fragmentsByGender && (fragmentsByGender.male || fragmentsByGender.female);
        const femaleSource = fragmentsByGender && (fragmentsByGender.female || fragmentsByGender.male);
        const maleFragments = cloneFragmentList(maleSource);
        const femaleFragments = cloneFragmentList(femaleSource);
        return {
            slot: 'body',
            maleModelIds: modelIds.male.slice(),
            femaleModelIds: modelIds.female.slice(),
            recolors: [],
            fragments: cloneFragmentList(maleFragments),
            maleFragments,
            femaleFragments
        };
    }

    function createHeadAppearanceItemDef(modelIds, fragmentsByGender) {
        const maleSource = fragmentsByGender && (fragmentsByGender.male || fragmentsByGender.female);
        const femaleSource = fragmentsByGender && (fragmentsByGender.female || fragmentsByGender.male);
        const maleFragments = cloneFragmentList(maleSource);
        const femaleFragments = cloneFragmentList(femaleSource);
        return {
            slot: 'head',
            maleModelIds: modelIds.male.slice(),
            femaleModelIds: modelIds.female.slice(),
            recolors: [],
            fragments: cloneFragmentList(maleFragments),
            maleFragments,
            femaleFragments
        };
    }

    function createLegsAppearanceItemDef(modelIds, fragmentsByGender) {
        const maleSource = fragmentsByGender && (fragmentsByGender.male || fragmentsByGender.female);
        const femaleSource = fragmentsByGender && (fragmentsByGender.female || fragmentsByGender.male);
        const maleFragments = cloneFragmentList(maleSource);
        const femaleFragments = cloneFragmentList(femaleSource);
        return {
            slot: 'legs',
            maleModelIds: modelIds.male.slice(),
            femaleModelIds: modelIds.female.slice(),
            recolors: [],
            fragments: cloneFragmentList(maleFragments),
            maleFragments,
            femaleFragments
        };
    }

    function createFeetAppearanceItemDef(modelIds, fragmentsByGender) {
        const maleSource = fragmentsByGender && (fragmentsByGender.male || fragmentsByGender.female);
        const femaleSource = fragmentsByGender && (fragmentsByGender.female || fragmentsByGender.male);
        const maleFragments = cloneFragmentList(maleSource);
        const femaleFragments = cloneFragmentList(femaleSource);
        return {
            slot: 'feet',
            maleModelIds: modelIds.male.slice(),
            femaleModelIds: modelIds.female.slice(),
            recolors: [],
            fragments: cloneFragmentList(maleFragments),
            maleFragments,
            femaleFragments
        };
    }

    function createShieldAppearanceItemDef(modelIds, fragments) {
        const cloned = cloneFragmentList(fragments);
        return {
            slot: 'shield',
            maleModelIds: modelIds.male.slice(),
            femaleModelIds: modelIds.female.slice(),
            recolors: [],
            fragments: cloneFragmentList(cloned),
            maleFragments: cloneFragmentList(cloned),
            femaleFragments: cloneFragmentList(cloned)
        };
    }

    function createHelmetFragmentsForFit(fit, tierPalette) {
        const armorFallbackColor = packJagexHsl(0, 0, 64);
        const shellSize = addTriplets(fit.size, HEAD_ARMOR_SHELL_GROWTH);
        const crownSize = [
            shellSize[0] * 0.82,
            Math.min(0.11, shellSize[1] * 0.24),
            shellSize[2] * 0.82
        ];
        const crownOffset = [
            fit.offset[0],
            fit.offset[1] + (shellSize[1] * 0.24),
            fit.offset[2]
        ];
        const browBandSize = [
            shellSize[0] * 0.92,
            Math.min(0.1, shellSize[1] * 0.2),
            shellSize[2] * 0.9
        ];
        const browBandOffset = [
            fit.offset[0],
            fit.offset[1] + (shellSize[1] * 0.08),
            fit.offset[2] + 0.005
        ];
        const faceGuardSize = [
            shellSize[0] * 0.4,
            shellSize[1] * 0.52,
            Math.min(0.12, shellSize[2] * 0.55)
        ];
        const faceGuardOffset = [
            fit.offset[0],
            fit.offset[1] - 0.02,
            fit.offset[2] + ((shellSize[2] - faceGuardSize[2]) * 0.5) + 0.015
        ];
        const eyeSlitSize = [
            shellSize[0] * 0.5,
            Math.min(0.045, shellSize[1] * 0.12),
            Math.min(0.035, shellSize[2] * 0.18)
        ];
        const eyeSlitOffset = [
            fit.offset[0],
            fit.offset[1] + (shellSize[1] * 0.03),
            faceGuardOffset[2] + ((faceGuardSize[2] - eyeSlitSize[2]) * 0.5) + 0.004
        ];
        const mouthSlitSize = [
            shellSize[0] * 0.34,
            Math.min(0.04, shellSize[1] * 0.1),
            Math.min(0.032, shellSize[2] * 0.16)
        ];
        const mouthSlitOffset = [
            fit.offset[0],
            fit.offset[1] - (shellSize[1] * 0.18),
            faceGuardOffset[2] + ((faceGuardSize[2] - mouthSlitSize[2]) * 0.5) + 0.004
        ];

        return [
            createAppearanceBoxFragment('head', shellSize, fit.offset, {
                rgbColor: tierPalette.mid,
                color: hexToPackedJagexHsl(tierPalette.mid, armorFallbackColor)
            }),
            createAppearanceBoxFragment('head', crownSize, crownOffset, {
                rgbColor: tierPalette.light,
                color: hexToPackedJagexHsl(tierPalette.light, armorFallbackColor)
            }),
            createAppearanceBoxFragment('head', browBandSize, browBandOffset, {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor)
            }),
            createAppearanceBoxFragment('head', faceGuardSize, faceGuardOffset, {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor)
            }),
            createAppearanceBoxFragment('head', eyeSlitSize, eyeSlitOffset, {
                color: bodyColorFind[4],
                bodyColorIndex: 4
            }),
            createAppearanceBoxFragment('head', mouthSlitSize, mouthSlitOffset, {
                color: bodyColorFind[4],
                bodyColorIndex: 4
            })
        ];
    }

    function createRuneHelmetFragmentsForFit(fit, tierPalette) {
        const armorFallbackColor = packJagexHsl(0, 0, 64);
        const accentHex = tierPalette.accent || tierPalette.light;
        const accentColor = hexToPackedJagexHsl(accentHex, armorFallbackColor);
        const shellSize = addTriplets(fit.size, [0.08, 0.09, 0.08]);
        const crownSize = [
            shellSize[0] * 0.72,
            Math.min(0.16, shellSize[1] * 0.3),
            shellSize[2] * 0.74
        ];
        const crownOffset = [
            fit.offset[0],
            fit.offset[1] + (shellSize[1] * 0.28),
            fit.offset[2] - 0.01
        ];
        const browBandSize = [
            shellSize[0] * 0.98,
            Math.min(0.12, shellSize[1] * 0.22),
            shellSize[2] * 0.94
        ];
        const browBandOffset = [
            fit.offset[0],
            fit.offset[1] + (shellSize[1] * 0.08),
            fit.offset[2] + 0.008
        ];
        const faceGuardSize = [
            shellSize[0] * 0.34,
            shellSize[1] * 0.6,
            Math.min(0.13, shellSize[2] * 0.54)
        ];
        const faceGuardOffset = [
            fit.offset[0],
            fit.offset[1] - 0.01,
            fit.offset[2] + ((shellSize[2] - faceGuardSize[2]) * 0.5) + 0.02
        ];
        const eyeSlitSize = [
            shellSize[0] * 0.32,
            Math.min(0.036, shellSize[1] * 0.09),
            Math.min(0.028, shellSize[2] * 0.14)
        ];
        const eyeSlitOffset = [
            fit.offset[0],
            fit.offset[1] + (shellSize[1] * 0.05),
            faceGuardOffset[2] + ((faceGuardSize[2] - eyeSlitSize[2]) * 0.5) + 0.004
        ];
        const mouthSlitSize = [
            shellSize[0] * 0.18,
            Math.min(0.03, shellSize[1] * 0.08),
            Math.min(0.026, shellSize[2] * 0.12)
        ];
        const mouthSlitOffset = [
            fit.offset[0],
            fit.offset[1] - (shellSize[1] * 0.22),
            faceGuardOffset[2] + ((faceGuardSize[2] - mouthSlitSize[2]) * 0.5) + 0.005
        ];
        const wingSize = [
            shellSize[0] * 0.26,
            Math.min(0.09, shellSize[1] * 0.18),
            shellSize[2] * 0.42
        ];
        const leftWingOffset = [
            fit.offset[0] - (shellSize[0] * 0.54),
            fit.offset[1] + (shellSize[1] * 0.1),
            fit.offset[2] - 0.01
        ];
        const rightWingOffset = [
            fit.offset[0] + (shellSize[0] * 0.54),
            fit.offset[1] + (shellSize[1] * 0.1),
            fit.offset[2] - 0.01
        ];
        const crestSize = [
            shellSize[0] * 0.18,
            Math.min(0.08, shellSize[1] * 0.15),
            shellSize[2] * 0.18
        ];
        const crestOffset = [
            fit.offset[0],
            fit.offset[1] + (shellSize[1] * 0.22),
            fit.offset[2] + (shellSize[2] * 0.16)
        ];

        return [
            createAppearanceBoxFragment('head', shellSize, fit.offset, {
                rgbColor: tierPalette.mid,
                color: hexToPackedJagexHsl(tierPalette.mid, armorFallbackColor)
            }),
            createAppearanceBoxFragment('head', crownSize, crownOffset, {
                rgbColor: tierPalette.light,
                color: hexToPackedJagexHsl(tierPalette.light, armorFallbackColor)
            }),
            createAppearanceBoxFragment('head', browBandSize, browBandOffset, {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor)
            }),
            createAppearanceBoxFragment('head', faceGuardSize, faceGuardOffset, {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor)
            }),
            createAppearanceBoxFragment('head', wingSize, leftWingOffset, {
                rgbColor: tierPalette.mid,
                color: hexToPackedJagexHsl(tierPalette.mid, armorFallbackColor),
                rotation: [0, 0, -0.38]
            }),
            createAppearanceBoxFragment('head', wingSize, rightWingOffset, {
                rgbColor: tierPalette.mid,
                color: hexToPackedJagexHsl(tierPalette.mid, armorFallbackColor),
                rotation: [0, 0, 0.38]
            }),
            createAppearanceBoxFragment('head', crestSize, crestOffset, {
                rgbColor: accentHex,
                color: accentColor
            }),
            createAppearanceBoxFragment('head', eyeSlitSize, eyeSlitOffset, {
                color: bodyColorFind[4],
                bodyColorIndex: 4
            }),
            createAppearanceBoxFragment('head', mouthSlitSize, mouthSlitOffset, {
                color: bodyColorFind[4],
                bodyColorIndex: 4
            })
        ];
    }

    function createHelmetAppearanceItemDef(itemId, modelIds) {
        const tierPalette = itemId === 'rune_helmet' ? RUNE_ARMOR_TIER_PALETTE : getMetalTierPalette(itemId);
        return createHeadAppearanceItemDef(modelIds, {
            male: itemId === 'rune_helmet'
                ? createRuneHelmetFragmentsForFit(HEAD_SLOT_FITS.male, tierPalette)
                : createHelmetFragmentsForFit(HEAD_SLOT_FITS.male, tierPalette),
            female: itemId === 'rune_helmet'
                ? createRuneHelmetFragmentsForFit(HEAD_SLOT_FITS.female, tierPalette)
                : createHelmetFragmentsForFit(HEAD_SLOT_FITS.female, tierPalette)
        });
    }

    function createPlatebodyFragmentsForFit(fit, tierPalette) {
        const armorFallbackColor = packJagexHsl(0, 0, 64);
        const torsoShellSize = addTriplets(fit.torso.size, BODY_ARMOR_SHELL_GROWTH.torso);
        const upperArmShellSize = addTriplets(fit.upperArm.size, BODY_ARMOR_SHELL_GROWTH.upperArm);
        const lowerArmShellSize = addTriplets(fit.lowerArm.size, BODY_ARMOR_SHELL_GROWTH.lowerArm);
        const chestPlateSize = [
            torsoShellSize[0] * 0.72,
            torsoShellSize[1] * 0.58,
            Math.min(0.12, torsoShellSize[2] * 0.62)
        ];
        const chestPlateOffset = [
            fit.torso.offset[0],
            fit.torso.offset[1] + 0.02,
            fit.torso.offset[2] + ((torsoShellSize[2] - chestPlateSize[2]) * 0.5) + 0.01
        ];
        const shoulderBandSize = [
            torsoShellSize[0] * 0.9,
            Math.min(0.12, torsoShellSize[1] * 0.18),
            Math.min(0.07, torsoShellSize[2] * 0.38)
        ];
        const shoulderBandOffset = [
            fit.torso.offset[0],
            fit.torso.offset[1] + (torsoShellSize[1] * 0.31),
            fit.torso.offset[2] + ((torsoShellSize[2] - shoulderBandSize[2]) * 0.5) - 0.01
        ];

        return [
            createAppearanceBoxFragment('torso', torsoShellSize, fit.torso.offset, {
                rgbColor: tierPalette.mid,
                color: hexToPackedJagexHsl(tierPalette.mid, armorFallbackColor)
            }),
            createAppearanceBoxFragment('torso', shoulderBandSize, shoulderBandOffset, {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor)
            }),
            createAppearanceBoxFragment('torso', chestPlateSize, chestPlateOffset, {
                rgbColor: tierPalette.light,
                color: hexToPackedJagexHsl(tierPalette.light, armorFallbackColor)
            }),
            createAppearanceBoxFragment('leftArm', upperArmShellSize, fit.upperArm.offset, {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor)
            }),
            createAppearanceBoxFragment('rightArm', upperArmShellSize, fit.upperArm.offset, {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor)
            }),
            createAppearanceBoxFragment('leftLowerArm', lowerArmShellSize, fit.lowerArm.offset, {
                rgbColor: tierPalette.mid,
                color: hexToPackedJagexHsl(tierPalette.mid, armorFallbackColor)
            }),
            createAppearanceBoxFragment('rightLowerArm', lowerArmShellSize, fit.lowerArm.offset, {
                rgbColor: tierPalette.mid,
                color: hexToPackedJagexHsl(tierPalette.mid, armorFallbackColor)
            })
        ];
    }

    function createRunePlatebodyFragmentsForFit(fit, tierPalette) {
        const armorFallbackColor = packJagexHsl(0, 0, 64);
        const accentHex = tierPalette.accent || tierPalette.light;
        const accentColor = hexToPackedJagexHsl(accentHex, armorFallbackColor);
        const torsoShellSize = addTriplets(fit.torso.size, [0.08, 0.06, 0.08]);
        const upperArmShellSize = addTriplets(fit.upperArm.size, [0.05, 0.03, 0.04]);
        const lowerArmShellSize = addTriplets(fit.lowerArm.size, [0.04, 0.03, 0.03]);
        const shoulderWingSize = [
            torsoShellSize[0] * 0.24,
            Math.min(0.16, torsoShellSize[1] * 0.22),
            torsoShellSize[2] * 0.58
        ];
        const leftShoulderWingOffset = [
            fit.torso.offset[0] - (torsoShellSize[0] * 0.52),
            fit.torso.offset[1] + (torsoShellSize[1] * 0.28),
            fit.torso.offset[2] - 0.01
        ];
        const rightShoulderWingOffset = [
            fit.torso.offset[0] + (torsoShellSize[0] * 0.52),
            fit.torso.offset[1] + (torsoShellSize[1] * 0.28),
            fit.torso.offset[2] - 0.01
        ];
        const chestWingSize = [
            torsoShellSize[0] * 0.24,
            torsoShellSize[1] * 0.34,
            Math.min(0.1, torsoShellSize[2] * 0.45)
        ];
        const leftChestWingOffset = [
            fit.torso.offset[0] - (torsoShellSize[0] * 0.16),
            fit.torso.offset[1] + 0.05,
            fit.torso.offset[2] + ((torsoShellSize[2] - chestWingSize[2]) * 0.5) + 0.02
        ];
        const rightChestWingOffset = [
            fit.torso.offset[0] + (torsoShellSize[0] * 0.16),
            fit.torso.offset[1] + 0.05,
            fit.torso.offset[2] + ((torsoShellSize[2] - chestWingSize[2]) * 0.5) + 0.02
        ];
        const sternumSize = [
            torsoShellSize[0] * 0.14,
            torsoShellSize[1] * 0.46,
            Math.min(0.13, torsoShellSize[2] * 0.68)
        ];
        const sternumOffset = [
            fit.torso.offset[0],
            fit.torso.offset[1] + 0.02,
            fit.torso.offset[2] + ((torsoShellSize[2] - sternumSize[2]) * 0.5) + 0.03
        ];
        const waistGuardSize = [
            torsoShellSize[0] * 0.28,
            Math.min(0.1, torsoShellSize[1] * 0.14),
            torsoShellSize[2] * 0.6
        ];
        const waistGuardOffset = [
            fit.torso.offset[0],
            fit.torso.offset[1] - (torsoShellSize[1] * 0.26),
            fit.torso.offset[2] + 0.01
        ];

        return [
            createAppearanceBoxFragment('torso', torsoShellSize, fit.torso.offset, {
                rgbColor: tierPalette.mid,
                color: hexToPackedJagexHsl(tierPalette.mid, armorFallbackColor)
            }),
            createAppearanceBoxFragment('torso', shoulderWingSize, leftShoulderWingOffset, {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor),
                rotation: [0, 0, -0.3]
            }),
            createAppearanceBoxFragment('torso', shoulderWingSize, rightShoulderWingOffset, {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor),
                rotation: [0, 0, 0.3]
            }),
            createAppearanceBoxFragment('torso', chestWingSize, leftChestWingOffset, {
                rgbColor: tierPalette.light,
                color: hexToPackedJagexHsl(tierPalette.light, armorFallbackColor),
                rotation: [0, 0, -0.34]
            }),
            createAppearanceBoxFragment('torso', chestWingSize, rightChestWingOffset, {
                rgbColor: tierPalette.light,
                color: hexToPackedJagexHsl(tierPalette.light, armorFallbackColor),
                rotation: [0, 0, 0.34]
            }),
            createAppearanceBoxFragment('torso', sternumSize, sternumOffset, {
                rgbColor: accentHex,
                color: accentColor
            }),
            createAppearanceBoxFragment('torso', waistGuardSize, waistGuardOffset, {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor)
            }),
            createAppearanceBoxFragment('leftArm', upperArmShellSize, fit.upperArm.offset, {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor)
            }),
            createAppearanceBoxFragment('rightArm', upperArmShellSize, fit.upperArm.offset, {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor)
            }),
            createAppearanceBoxFragment('leftLowerArm', lowerArmShellSize, fit.lowerArm.offset, {
                rgbColor: tierPalette.mid,
                color: hexToPackedJagexHsl(tierPalette.mid, armorFallbackColor)
            }),
            createAppearanceBoxFragment('rightLowerArm', lowerArmShellSize, fit.lowerArm.offset, {
                rgbColor: tierPalette.mid,
                color: hexToPackedJagexHsl(tierPalette.mid, armorFallbackColor)
            })
        ];
    }

    function createPlatebodyAppearanceItemDef(itemId, modelIds) {
        const tierPalette = itemId === 'rune_platebody' ? RUNE_ARMOR_TIER_PALETTE : getMetalTierPalette(itemId);
        return createBodyAppearanceItemDef(modelIds, {
            male: itemId === 'rune_platebody'
                ? createRunePlatebodyFragmentsForFit(BODY_SLOT_FITS.male, tierPalette)
                : createPlatebodyFragmentsForFit(BODY_SLOT_FITS.male, tierPalette),
            female: itemId === 'rune_platebody'
                ? createRunePlatebodyFragmentsForFit(BODY_SLOT_FITS.female, tierPalette)
                : createPlatebodyFragmentsForFit(BODY_SLOT_FITS.female, tierPalette)
        });
    }

    function createPlatelegsFragmentsForFit(fit, tierPalette) {
        const armorFallbackColor = packJagexHsl(0, 0, 64);
        const upperLegShellSize = addTriplets(fit.upperLeg.size, PLATELEGS_ARMOR_SHELL_GROWTH.upperLeg);
        const lowerLegShellSize = addTriplets(fit.lowerLeg.size, PLATELEGS_ARMOR_SHELL_GROWTH.lowerLeg);
        const waistBandSize = [
            (upperLegShellSize[0] * 2) * 0.88,
            Math.min(0.11, upperLegShellSize[1] * 0.22),
            Math.max(upperLegShellSize[2], lowerLegShellSize[2]) * 0.9
        ];
        const waistBandOffset = [0, fit.upperLeg.offset[1] + (upperLegShellSize[1] * 0.34), 0];
        const kneeGuardSize = [
            lowerLegShellSize[0] * 0.82,
            Math.min(0.11, lowerLegShellSize[1] * 0.28),
            lowerLegShellSize[2] * 0.9
        ];
        const kneeGuardOffset = [
            0,
            fit.lowerLeg.offset[1] + 0.02,
            fit.lowerLeg.offset[2] + 0.02
        ];

        return [
            createAppearanceBoxFragment('leftLeg', upperLegShellSize, fit.upperLeg.offset, {
                rgbColor: tierPalette.mid,
                color: hexToPackedJagexHsl(tierPalette.mid, armorFallbackColor)
            }),
            createAppearanceBoxFragment('rightLeg', upperLegShellSize, fit.upperLeg.offset, {
                rgbColor: tierPalette.mid,
                color: hexToPackedJagexHsl(tierPalette.mid, armorFallbackColor)
            }),
            createAppearanceBoxFragment('leftLowerLeg', lowerLegShellSize, fit.lowerLeg.offset, {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor)
            }),
            createAppearanceBoxFragment('rightLowerLeg', lowerLegShellSize, fit.lowerLeg.offset, {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor)
            }),
            createAppearanceBoxFragment('leftLowerLeg', kneeGuardSize, kneeGuardOffset, {
                rgbColor: tierPalette.light,
                color: hexToPackedJagexHsl(tierPalette.light, armorFallbackColor)
            }),
            createAppearanceBoxFragment('rightLowerLeg', kneeGuardSize, kneeGuardOffset, {
                rgbColor: tierPalette.light,
                color: hexToPackedJagexHsl(tierPalette.light, armorFallbackColor)
            }),
            createAppearanceBoxFragment('torso', waistBandSize, waistBandOffset, {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor)
            })
        ];
    }

    function createRunePlatelegsFragmentsForFit(fit, tierPalette) {
        const armorFallbackColor = packJagexHsl(0, 0, 64);
        const accentHex = tierPalette.accent || tierPalette.light;
        const accentColor = hexToPackedJagexHsl(accentHex, armorFallbackColor);
        const upperLegShellSize = addTriplets(fit.upperLeg.size, [0.05, 0.04, 0.05]);
        const lowerLegShellSize = addTriplets(fit.lowerLeg.size, [0.04, 0.03, 0.04]);
        const thighFacetSize = [
            upperLegShellSize[0] * 0.78,
            upperLegShellSize[1] * 0.34,
            upperLegShellSize[2] * 0.42
        ];
        const outerGuardSize = [
            upperLegShellSize[0] * 0.36,
            upperLegShellSize[1] * 0.4,
            upperLegShellSize[2] * 0.46
        ];
        const kneeGuardSize = [
            lowerLegShellSize[0] * 0.86,
            Math.min(0.14, lowerLegShellSize[1] * 0.32),
            lowerLegShellSize[2] * 0.48
        ];
        const shinGuardSize = [
            lowerLegShellSize[0] * 0.62,
            lowerLegShellSize[1] * 0.24,
            lowerLegShellSize[2] * 0.34
        ];
        const codpieceSize = [
            upperLegShellSize[0] * 0.56,
            Math.min(0.14, upperLegShellSize[1] * 0.34),
            upperLegShellSize[2] * 0.42
        ];
        const codpieceOffset = [
            0,
            fit.upperLeg.offset[1] + (upperLegShellSize[1] * 0.35),
            0.03
        ];

        return [
            createAppearanceBoxFragment('leftLeg', upperLegShellSize, fit.upperLeg.offset, {
                rgbColor: tierPalette.mid,
                color: hexToPackedJagexHsl(tierPalette.mid, armorFallbackColor)
            }),
            createAppearanceBoxFragment('rightLeg', upperLegShellSize, fit.upperLeg.offset, {
                rgbColor: tierPalette.mid,
                color: hexToPackedJagexHsl(tierPalette.mid, armorFallbackColor)
            }),
            createAppearanceBoxFragment('leftLeg', thighFacetSize, [0, 0.05, upperLegShellSize[2] * 0.18], {
                rgbColor: tierPalette.light,
                color: hexToPackedJagexHsl(tierPalette.light, armorFallbackColor)
            }),
            createAppearanceBoxFragment('rightLeg', thighFacetSize, [0, 0.05, upperLegShellSize[2] * 0.18], {
                rgbColor: tierPalette.light,
                color: hexToPackedJagexHsl(tierPalette.light, armorFallbackColor)
            }),
            createAppearanceBoxFragment('leftLeg', outerGuardSize, [upperLegShellSize[0] * 0.38, 0.04, 0], {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor)
            }),
            createAppearanceBoxFragment('rightLeg', outerGuardSize, [-upperLegShellSize[0] * 0.38, 0.04, 0], {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor)
            }),
            createAppearanceBoxFragment('leftLowerLeg', lowerLegShellSize, fit.lowerLeg.offset, {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor)
            }),
            createAppearanceBoxFragment('rightLowerLeg', lowerLegShellSize, fit.lowerLeg.offset, {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor)
            }),
            createAppearanceBoxFragment('leftLowerLeg', kneeGuardSize, [0, fit.lowerLeg.offset[1] + 0.05, lowerLegShellSize[2] * 0.2], {
                rgbColor: accentHex,
                color: accentColor
            }),
            createAppearanceBoxFragment('rightLowerLeg', kneeGuardSize, [0, fit.lowerLeg.offset[1] + 0.05, lowerLegShellSize[2] * 0.2], {
                rgbColor: accentHex,
                color: accentColor
            }),
            createAppearanceBoxFragment('leftLowerLeg', shinGuardSize, [0, fit.lowerLeg.offset[1] - 0.08, lowerLegShellSize[2] * 0.16], {
                rgbColor: tierPalette.mid,
                color: hexToPackedJagexHsl(tierPalette.mid, armorFallbackColor)
            }),
            createAppearanceBoxFragment('rightLowerLeg', shinGuardSize, [0, fit.lowerLeg.offset[1] - 0.08, lowerLegShellSize[2] * 0.16], {
                rgbColor: tierPalette.mid,
                color: hexToPackedJagexHsl(tierPalette.mid, armorFallbackColor)
            }),
            createAppearanceBoxFragment('torso', codpieceSize, codpieceOffset, {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor)
            })
        ];
    }

    function createPlatelegsAppearanceItemDef(itemId, modelIds) {
        const tierPalette = itemId === 'rune_platelegs' ? RUNE_ARMOR_TIER_PALETTE : getMetalTierPalette(itemId);
        return createLegsAppearanceItemDef(modelIds, {
            male: itemId === 'rune_platelegs'
                ? createRunePlatelegsFragmentsForFit(LEGS_SLOT_FITS.male, tierPalette)
                : createPlatelegsFragmentsForFit(LEGS_SLOT_FITS.male, tierPalette),
            female: itemId === 'rune_platelegs'
                ? createRunePlatelegsFragmentsForFit(LEGS_SLOT_FITS.female, tierPalette)
                : createPlatelegsFragmentsForFit(LEGS_SLOT_FITS.female, tierPalette)
        });
    }

    function createBootsFragmentsForFit(fit, tierPalette) {
        const armorFallbackColor = packJagexHsl(0, 0, 64);
        const shellSize = addTriplets(fit.size, BOOTS_ARMOR_SHELL_GROWTH);
        const cuffSize = [
            shellSize[0] * 0.78,
            Math.min(0.07, shellSize[1] * 0.9),
            shellSize[2] * 0.7
        ];
        const cuffOffset = [
            fit.offset[0],
            fit.offset[1] + (shellSize[1] * 0.45),
            fit.offset[2] - 0.01
        ];
        const toeCapSize = [
            shellSize[0] * 0.76,
            Math.max(0.05, shellSize[1] * 0.72),
            shellSize[2] * 0.48
        ];
        const toeCapOffset = [
            fit.offset[0],
            fit.offset[1] - 0.005,
            fit.offset[2] + (shellSize[2] * 0.18)
        ];

        return [
            createAppearanceBoxFragment('leftLowerLeg', shellSize, fit.offset, {
                rgbColor: tierPalette.mid,
                color: hexToPackedJagexHsl(tierPalette.mid, armorFallbackColor)
            }),
            createAppearanceBoxFragment('rightLowerLeg', shellSize, fit.offset, {
                rgbColor: tierPalette.mid,
                color: hexToPackedJagexHsl(tierPalette.mid, armorFallbackColor)
            }),
            createAppearanceBoxFragment('leftLowerLeg', cuffSize, cuffOffset, {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor)
            }),
            createAppearanceBoxFragment('rightLowerLeg', cuffSize, cuffOffset, {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor)
            }),
            createAppearanceBoxFragment('leftLowerLeg', toeCapSize, toeCapOffset, {
                rgbColor: tierPalette.light,
                color: hexToPackedJagexHsl(tierPalette.light, armorFallbackColor)
            }),
            createAppearanceBoxFragment('rightLowerLeg', toeCapSize, toeCapOffset, {
                rgbColor: tierPalette.light,
                color: hexToPackedJagexHsl(tierPalette.light, armorFallbackColor)
            })
        ];
    }

    function createRuneBootsFragmentsForFit(fit, tierPalette) {
        const armorFallbackColor = packJagexHsl(0, 0, 64);
        const accentHex = tierPalette.accent || tierPalette.light;
        const accentColor = hexToPackedJagexHsl(accentHex, armorFallbackColor);
        const shellSize = addTriplets(fit.size, [0.06, 0.03, 0.08]);
        const cuffSize = [
            shellSize[0] * 0.82,
            Math.min(0.08, shellSize[1] * 0.95),
            shellSize[2] * 0.68
        ];
        const cuffOffset = [
            fit.offset[0],
            fit.offset[1] + (shellSize[1] * 0.48),
            fit.offset[2] - 0.02
        ];
        const toeCapSize = [
            shellSize[0] * 0.84,
            Math.max(0.055, shellSize[1] * 0.72),
            shellSize[2] * 0.5
        ];
        const toeCapOffset = [
            fit.offset[0],
            fit.offset[1] - 0.005,
            fit.offset[2] + (shellSize[2] * 0.22)
        ];
        const toePointSize = [
            shellSize[0] * 0.52,
            Math.max(0.045, shellSize[1] * 0.5),
            shellSize[2] * 0.22
        ];
        const toePointOffset = [
            fit.offset[0],
            fit.offset[1] - 0.005,
            fit.offset[2] + (shellSize[2] * 0.38)
        ];
        const shinPlateSize = [
            shellSize[0] * 0.56,
            Math.min(0.06, shellSize[1] * 0.6),
            shellSize[2] * 0.18
        ];
        const shinPlateOffset = [
            fit.offset[0],
            fit.offset[1] + (shellSize[1] * 0.18),
            fit.offset[2] + (shellSize[2] * 0.14)
        ];
        const heelGuardSize = [
            shellSize[0] * 0.36,
            Math.min(0.04, shellSize[1] * 0.44),
            shellSize[2] * 0.16
        ];
        const heelGuardOffset = [
            fit.offset[0],
            fit.offset[1] - 0.02,
            fit.offset[2] - (shellSize[2] * 0.18)
        ];

        return [
            createAppearanceBoxFragment('leftLowerLeg', shellSize, fit.offset, {
                rgbColor: tierPalette.mid,
                color: hexToPackedJagexHsl(tierPalette.mid, armorFallbackColor)
            }),
            createAppearanceBoxFragment('rightLowerLeg', shellSize, fit.offset, {
                rgbColor: tierPalette.mid,
                color: hexToPackedJagexHsl(tierPalette.mid, armorFallbackColor)
            }),
            createAppearanceBoxFragment('leftLowerLeg', cuffSize, cuffOffset, {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor)
            }),
            createAppearanceBoxFragment('rightLowerLeg', cuffSize, cuffOffset, {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor)
            }),
            createAppearanceBoxFragment('leftLowerLeg', toeCapSize, toeCapOffset, {
                rgbColor: tierPalette.light,
                color: hexToPackedJagexHsl(tierPalette.light, armorFallbackColor)
            }),
            createAppearanceBoxFragment('rightLowerLeg', toeCapSize, toeCapOffset, {
                rgbColor: tierPalette.light,
                color: hexToPackedJagexHsl(tierPalette.light, armorFallbackColor)
            }),
            createAppearanceBoxFragment('leftLowerLeg', toePointSize, toePointOffset, {
                rgbColor: accentHex,
                color: accentColor
            }),
            createAppearanceBoxFragment('rightLowerLeg', toePointSize, toePointOffset, {
                rgbColor: accentHex,
                color: accentColor
            }),
            createAppearanceBoxFragment('leftLowerLeg', shinPlateSize, shinPlateOffset, {
                rgbColor: accentHex,
                color: accentColor
            }),
            createAppearanceBoxFragment('rightLowerLeg', shinPlateSize, shinPlateOffset, {
                rgbColor: accentHex,
                color: accentColor
            }),
            createAppearanceBoxFragment('leftLowerLeg', heelGuardSize, heelGuardOffset, {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor)
            }),
            createAppearanceBoxFragment('rightLowerLeg', heelGuardSize, heelGuardOffset, {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor)
            })
        ];
    }

    function createBootsAppearanceItemDef(itemId, modelIds) {
        const tierPalette = itemId === 'rune_boots' ? RUNE_ARMOR_TIER_PALETTE : getMetalTierPalette(itemId);
        return createFeetAppearanceItemDef(modelIds, {
            male: itemId === 'rune_boots'
                ? createRuneBootsFragmentsForFit(FEET_SLOT_FITS.male, tierPalette)
                : createBootsFragmentsForFit(FEET_SLOT_FITS.male, tierPalette),
            female: itemId === 'rune_boots'
                ? createRuneBootsFragmentsForFit(FEET_SLOT_FITS.female, tierPalette)
                : createBootsFragmentsForFit(FEET_SLOT_FITS.female, tierPalette)
        });
    }

    function createShieldFragmentsForTier(tierPalette) {
        const armorFallbackColor = packJagexHsl(0, 0, 64);
        const shieldRotation = [Math.PI / 2, Math.PI / 2, 0];
        return [
            createAppearanceBoxFragment('leftTool', [0.34, 0.44, 0.08], [0.17, 0.02, 0.03], {
                rgbColor: tierPalette.mid,
                color: hexToPackedJagexHsl(tierPalette.mid, armorFallbackColor),
                rotation: shieldRotation
            }),
            createAppearanceBoxFragment('leftTool', [0.21, 0.28, 0.04], [0.18, 0.03, 0.04], {
                rgbColor: tierPalette.light,
                color: hexToPackedJagexHsl(tierPalette.light, armorFallbackColor),
                rotation: shieldRotation
            }),
            createAppearanceBoxFragment('leftTool', [0.08, 0.10, 0.1], [0.18, 0.03, 0.08], {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor),
                rotation: shieldRotation
            }),
            createAppearanceBoxFragment('leftTool', [0.08, 0.24, 0.04], [0.08, 0.02, 0.0], {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor),
                rotation: shieldRotation
            })
        ];
    }

    function createRuneShieldFragmentsForTier(tierPalette) {
        const armorFallbackColor = packJagexHsl(0, 0, 64);
        const accentHex = tierPalette.accent || tierPalette.light;
        const accentColor = hexToPackedJagexHsl(accentHex, armorFallbackColor);
        const shieldRotation = [Math.PI / 2, Math.PI / 2, 0];
        return [
            createAppearanceBoxFragment('leftTool', [0.38, 0.48, 0.08], [0.17, 0.02, 0.03], {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor),
                rotation: shieldRotation
            }),
            createAppearanceBoxFragment('leftTool', [0.3, 0.38, 0.04], [0.18, 0.03, 0.036], {
                rgbColor: tierPalette.mid,
                color: hexToPackedJagexHsl(tierPalette.mid, armorFallbackColor),
                rotation: shieldRotation
            }),
            createAppearanceBoxFragment('leftTool', [0.22, 0.28, 0.016], [0.18, 0.03, 0.042], {
                rgbColor: tierPalette.light,
                color: hexToPackedJagexHsl(tierPalette.light, armorFallbackColor),
                rotation: shieldRotation
            }),
            createAppearanceBoxFragment('leftTool', [0.05, 0.24, 0.012], [0.18, 0.03, 0.046], {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor),
                rotation: shieldRotation
            }),
            createAppearanceBoxFragment('leftTool', [0.07, 0.09, 0.014], [0.18, 0.03, 0.05], {
                rgbColor: accentHex,
                color: accentColor,
                rotation: shieldRotation
            }),
            createAppearanceBoxFragment('leftTool', [0.08, 0.28, 0.03], [0.08, 0.02, 0.01], {
                rgbColor: tierPalette.dark,
                color: hexToPackedJagexHsl(tierPalette.dark, armorFallbackColor),
                rotation: shieldRotation
            })
        ];
    }

    function createShieldAppearanceTierDef(itemId, modelIds) {
        if (itemId === 'rune_shield') {
            return createShieldAppearanceItemDef(modelIds, createRuneShieldFragmentsForTier(RUNE_ARMOR_TIER_PALETTE));
        }
        return createShieldAppearanceItemDef(modelIds, createShieldFragmentsForTier(getMetalTierPalette(itemId)));
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
        knife: createLiteralRightHandAppearanceItemDef(previewOnlyWeaponModelIds, KNIFE_ICON_PIXELS, KNIFE_HELD_MODEL, KNIFE_PALETTE),
        logs: createLiteralRightHandAppearanceItemDef(previewOnlyWeaponModelIds, LOG_BUNDLE_ICON_PIXELS, LOG_BUNDLE_HELD_MODEL, REGULAR_LOGS_PALETTE),
        oak_logs: createLiteralRightHandAppearanceItemDef(previewOnlyWeaponModelIds, LOG_BUNDLE_ICON_PIXELS, LOG_BUNDLE_HELD_MODEL, OAK_LOGS_PALETTE),
        willow_logs: createLiteralRightHandAppearanceItemDef(previewOnlyWeaponModelIds, LOG_BUNDLE_ICON_PIXELS, LOG_BUNDLE_HELD_MODEL, WILLOW_LOGS_PALETTE),
        maple_logs: createLiteralRightHandAppearanceItemDef(previewOnlyWeaponModelIds, LOG_BUNDLE_ICON_PIXELS, LOG_BUNDLE_HELD_MODEL, MAPLE_LOGS_PALETTE),
        yew_logs: createLiteralRightHandAppearanceItemDef(previewOnlyWeaponModelIds, LOG_BUNDLE_ICON_PIXELS, LOG_BUNDLE_HELD_MODEL, YEW_LOGS_PALETTE),
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

    const previewOnlyBodyModelIds = {
        male: [-1, -1, -1],
        female: [-1, -1, -1]
    };

    const previewOnlyHeadModelIds = {
        male: [-1, -1, -1],
        female: [-1, -1, -1]
    };

    const previewOnlyLegModelIds = {
        male: [-1, -1, -1],
        female: [-1, -1, -1]
    };

    const previewOnlyFeetModelIds = {
        male: [-1, -1, -1],
        female: [-1, -1, -1]
    };

    const previewOnlyShieldModelIds = {
        male: [-1, -1, -1],
        female: [-1, -1, -1]
    };

    const helmetItemDefs = {
        bronze_helmet: createHelmetAppearanceItemDef('bronze_helmet', previewOnlyHeadModelIds),
        iron_helmet: createHelmetAppearanceItemDef('iron_helmet', previewOnlyHeadModelIds),
        steel_helmet: createHelmetAppearanceItemDef('steel_helmet', previewOnlyHeadModelIds),
        mithril_helmet: createHelmetAppearanceItemDef('mithril_helmet', previewOnlyHeadModelIds),
        adamant_helmet: createHelmetAppearanceItemDef('adamant_helmet', previewOnlyHeadModelIds),
        rune_helmet: createHelmetAppearanceItemDef('rune_helmet', previewOnlyHeadModelIds)
    };

    const shieldItemDefs = {
        bronze_shield: createShieldAppearanceTierDef('bronze_shield', previewOnlyShieldModelIds),
        iron_shield: createShieldAppearanceTierDef('iron_shield', previewOnlyShieldModelIds),
        steel_shield: createShieldAppearanceTierDef('steel_shield', previewOnlyShieldModelIds),
        mithril_shield: createShieldAppearanceTierDef('mithril_shield', previewOnlyShieldModelIds),
        adamant_shield: createShieldAppearanceTierDef('adamant_shield', previewOnlyShieldModelIds),
        rune_shield: createShieldAppearanceTierDef('rune_shield', previewOnlyShieldModelIds)
    };

    const bootsItemDefs = {
        bronze_boots: createBootsAppearanceItemDef('bronze_boots', previewOnlyFeetModelIds),
        iron_boots: createBootsAppearanceItemDef('iron_boots', previewOnlyFeetModelIds),
        steel_boots: createBootsAppearanceItemDef('steel_boots', previewOnlyFeetModelIds),
        mithril_boots: createBootsAppearanceItemDef('mithril_boots', previewOnlyFeetModelIds),
        adamant_boots: createBootsAppearanceItemDef('adamant_boots', previewOnlyFeetModelIds),
        rune_boots: createBootsAppearanceItemDef('rune_boots', previewOnlyFeetModelIds)
    };

    const platelegsItemDefs = {
        bronze_platelegs: createPlatelegsAppearanceItemDef('bronze_platelegs', previewOnlyLegModelIds),
        iron_platelegs: createPlatelegsAppearanceItemDef('iron_platelegs', previewOnlyLegModelIds),
        steel_platelegs: createPlatelegsAppearanceItemDef('steel_platelegs', previewOnlyLegModelIds),
        mithril_platelegs: createPlatelegsAppearanceItemDef('mithril_platelegs', previewOnlyLegModelIds),
        adamant_platelegs: createPlatelegsAppearanceItemDef('adamant_platelegs', previewOnlyLegModelIds),
        rune_platelegs: createPlatelegsAppearanceItemDef('rune_platelegs', previewOnlyLegModelIds)
    };

    const platebodyItemDefs = {
        bronze_platebody: createPlatebodyAppearanceItemDef('bronze_platebody', previewOnlyBodyModelIds),
        iron_platebody: createPlatebodyAppearanceItemDef('iron_platebody', previewOnlyBodyModelIds),
        steel_platebody: createPlatebodyAppearanceItemDef('steel_platebody', previewOnlyBodyModelIds),
        mithril_platebody: createPlatebodyAppearanceItemDef('mithril_platebody', previewOnlyBodyModelIds),
        adamant_platebody: createPlatebodyAppearanceItemDef('adamant_platebody', previewOnlyBodyModelIds),
        rune_platebody: createPlatebodyAppearanceItemDef('rune_platebody', previewOnlyBodyModelIds)
    };

    window.PlayerAppearanceCatalog = {
        version: '2026.03.m26',
        slotOrder: ['head', 'cape', 'neck', 'weapon', 'body', 'shield', 'legs', 'hands', 'feet', 'ring'],
        bodyColorFind,
        bodyColorPalettes,
        defaultSlotKits,
        kitDefs,
        itemDefs: Object.assign(
            {},
            pickaxeItemDefs,
            axeItemDefs,
            swordItemDefs,
            utilityToolItemDefs,
            helmetItemDefs,
            shieldItemDefs,
            platebodyItemDefs,
            platelegsItemDefs,
            bootsItemDefs
        )
    };
})();
