(function () {
    function box(target, role, size, offset, rgbColor, extras) {
        return Object.assign({
            target,
            role,
            shape: 'box',
            size: size.slice(),
            offset: offset.slice(),
            rgbColor
        }, extras && typeof extras === 'object' ? extras : null);
    }

    function buildTutorialGuidePreset() {
        const skin = '#d6a17a';
        const skinShadow = '#c48762';
        const hair = '#513521';
        const hairShadow = '#46301f';
        const eye = '#17120e';
        const mouth = '#8e5f46';
        const coat = '#143f46';
        const coatDark = '#0f3038';
        const shirt = '#d8c99e';
        const trim = '#b89545';
        const belt = '#5a3923';
        const trouser = '#3d4143';
        const boot = '#2d2118';
        const bootLeg = '#4b3a2a';

        const overlap = 0.03;
        const m = {
            footH: 0.12,
            lowerLegH: 0.34,
            upperLegH: 0.36,
            torsoW: 0.62,
            torsoH: 0.60,
            torsoD: 0.36,
            neckH: 0.12,
            headH: 0.42,
            upperArmH: 0.36,
            lowerArmH: 0.34,
            handH: 0.12,
            armW: 0.22,
            forearmW: 0.18
        };

        const ankleY = m.footH;
        const kneeY = ankleY + m.lowerLegH - overlap;
        const hipY = kneeY + m.upperLegH - overlap;
        const torsoBottomY = hipY - overlap;
        const torsoCenterY = torsoBottomY + (m.torsoH / 2);
        const torsoTopY = torsoBottomY + m.torsoH;
        const neckTopY = torsoTopY + m.neckH - overlap;
        const headCenterY = neckTopY - overlap + (m.headH / 2);
        const shoulderY = torsoTopY - 0.03;
        const shoulderLocalY = shoulderY - torsoCenterY;
        const torsoHalfW = m.torsoW / 2;
        const shoulderX = torsoHalfW + (m.armW / 2) - 0.035;
        const legX = 0.16;

        const upperArmTop = 0.03;
        const upperArmOffsetY = upperArmTop - (m.upperArmH / 2);
        const upperArmBottom = upperArmTop - m.upperArmH;
        const lowerArmTop = 0.025;
        const elbowY = (upperArmBottom + overlap) - lowerArmTop;
        const lowerArmOffsetY = lowerArmTop - (m.lowerArmH / 2);
        const lowerArmBottom = lowerArmOffsetY - (m.lowerArmH / 2);
        const handOffsetY = (lowerArmBottom + overlap) - (m.handH / 2);

        const upperLegTop = 0.03;
        const upperLegOffsetY = upperLegTop - (m.upperLegH / 2);
        const upperLegBottom = upperLegTop - m.upperLegH;
        const legNodeY = hipY - upperLegTop;
        const lowerLegTop = 0.025;
        const lowerLegNodeY = (upperLegBottom + overlap) - lowerLegTop;
        const lowerLegOffsetY = lowerLegTop - (m.lowerLegH / 2);
        const lowerLegBottom = lowerLegOffsetY - (m.lowerLegH / 2);
        const bootOffsetY = (lowerLegBottom + overlap) - (m.footH / 2);

        const pose = {
            nodes: {
                torso: [0, torsoCenterY, 0],
                head: [0, headCenterY - torsoCenterY, 0.01],
                leftArm: [shoulderX, shoulderLocalY, 0.015],
                rightArm: [-shoulderX, shoulderLocalY, 0.015],
                leftLowerArm: [0, elbowY, -0.01],
                rightLowerArm: [0, elbowY, -0.01],
                leftLeg: [legX, legNodeY, 0],
                rightLeg: [-legX, legNodeY, 0],
                leftLowerLeg: [0, lowerLegNodeY, 0],
                rightLowerLeg: [0, lowerLegNodeY, 0]
            }
        };

        const fragments = [
            box('head', 'head_core', [0.46, m.headH, 0.38], [0, 0, 0], skin),
            box('head', 'hair_cap', [0.45, 0.09, 0.42], [0, 0.19, -0.01], hair),
            box('head', 'hair_front', [0.36, 0.08, 0.08], [0, 0.13, 0.225], hairShadow),
            box('head', 'left_ear', [0.08, 0.16, 0.08], [0.26, 0.02, -0.02], skinShadow),
            box('head', 'right_ear', [0.08, 0.16, 0.08], [-0.26, 0.02, -0.02], skinShadow),
            box('head', 'left_eye', [0.055, 0.045, 0.03], [0.095, 0.045, 0.20], eye),
            box('head', 'right_eye', [0.055, 0.045, 0.03], [-0.095, 0.045, 0.20], eye),
            box('head', 'mouth', [0.12, 0.025, 0.025], [0, -0.105, 0.205], mouth),

            box('torso', 'torso_core', [m.torsoW, m.torsoH, m.torsoD], [0, 0, 0], coat),
            box('torso', 'shirt_panel', [0.28, 0.44, 0.08], [0, 0.01, 0.19], shirt),
            box('torso', 'left_coat_front', [0.13, 0.44, 0.10], [0.18, 0.01, 0.195], coatDark),
            box('torso', 'right_coat_front', [0.13, 0.44, 0.10], [-0.18, 0.01, 0.195], coatDark),
            box('torso', 'collar_trim', [0.60, 0.055, 0.38], [0, (m.torsoH / 2) - 0.04, 0.005], trim),
            box('torso', 'neck', [0.18, m.neckH, 0.16], [0, (m.torsoH / 2) + (m.neckH / 2) - overlap, 0.02], skin),
            box('torso', 'left_shoulder_cap', [0.18, 0.13, 0.25], [torsoHalfW + 0.045, shoulderLocalY - 0.015, 0.015], coatDark),
            box('torso', 'right_shoulder_cap', [0.18, 0.13, 0.25], [-(torsoHalfW + 0.045), shoulderLocalY - 0.015, 0.015], coatDark),
            box('torso', 'belt', [0.68, 0.08, 0.39], [0, (-m.torsoH / 2) + 0.08, 0.005], belt),
            box('torso', 'belt_buckle', [0.12, 0.10, 0.05], [0, (-m.torsoH / 2) + 0.08, 0.22], '#c49a3a'),

            box('leftArm', 'upper_arm', [m.armW, m.upperArmH, 0.20], [0, upperArmOffsetY, 0], coat),
            box('rightArm', 'upper_arm', [m.armW, m.upperArmH, 0.20], [0, upperArmOffsetY, 0], coat),
            box('leftLowerArm', 'lower_arm', [m.forearmW, m.lowerArmH, 0.17], [0, lowerArmOffsetY, 0], skin),
            box('rightLowerArm', 'lower_arm', [m.forearmW, m.lowerArmH, 0.17], [0, lowerArmOffsetY, 0], skin),
            box('leftLowerArm', 'cuff', [0.20, 0.06, 0.18], [0, lowerArmBottom + 0.065, 0.005], trim),
            box('rightLowerArm', 'cuff', [0.20, 0.06, 0.18], [0, lowerArmBottom + 0.065, 0.005], trim),
            box('leftLowerArm', 'hand', [0.14, m.handH, 0.13], [0, handOffsetY, 0.02], skin),
            box('rightLowerArm', 'hand', [0.14, m.handH, 0.13], [0, handOffsetY, 0.02], skin),

            box('leftLeg', 'upper_leg', [0.22, m.upperLegH, 0.24], [0.01, upperLegOffsetY, 0], trouser),
            box('rightLeg', 'upper_leg', [0.22, m.upperLegH, 0.24], [-0.01, upperLegOffsetY, 0], trouser),
            box('leftLowerLeg', 'lower_leg', [0.18, m.lowerLegH, 0.18], [0, lowerLegOffsetY, 0], bootLeg),
            box('rightLowerLeg', 'lower_leg', [0.18, m.lowerLegH, 0.18], [0, lowerLegOffsetY, 0], bootLeg),
            box('leftLowerLeg', 'boot', [0.24, m.footH, 0.31], [0, bootOffsetY, 0.055], boot),
            box('rightLowerLeg', 'boot', [0.24, m.footH, 0.31], [0, bootOffsetY, 0.055], boot)
        ];

        return {
            label: 'Tutorial Guide',
            archetype: 'formal_island_steward',
            construction: {
                floorY: 0,
                hipY,
                shoulderY,
                elbowY,
                wristY: torsoCenterY + shoulderLocalY + elbowY + lowerArmBottom,
                headTopY: headCenterY + (m.headH / 2),
                minContactOverlap: overlap
            },
            scale: [1.0, 1.0, 1.0],
            armRigDefaults: {
                elbowPivot: {
                    x: 0,
                    y: elbowY,
                    z: -0.01
                }
            },
            pose,
            fragments
        };
    }

    function buildTutorialWoodcuttingInstructorPreset() {
        const skin = '#c99674';
        const skinShadow = '#a97356';
        const hair = '#6b6253';
        const hairShadow = '#4d453a';
        const beard = '#5b5346';
        const eye = '#16110d';
        const mouth = '#80543e';
        const shirt = '#7e2622';
        const plaidDark = '#4f1816';
        const plaidTan = '#b68b5e';
        const vest = '#3e5034';
        const vestDark = '#2c3c28';
        const belt = '#583822';
        const glove = '#6b4b2d';
        const trouser = '#4b4338';
        const boot = '#2d2218';
        const bootLeg = '#554433';
        const axeHandle = '#724a2b';
        const axeMetal = '#9aa1a5';
        const axeEdge = '#c6ccd0';

        const overlap = 0.03;
        const m = {
            footH: 0.13,
            lowerLegH: 0.35,
            upperLegH: 0.36,
            torsoW: 0.66,
            torsoH: 0.58,
            torsoD: 0.38,
            neckH: 0.11,
            headH: 0.43,
            upperArmH: 0.36,
            lowerArmH: 0.34,
            handH: 0.12,
            armW: 0.23,
            forearmW: 0.19
        };

        const ankleY = m.footH;
        const kneeY = ankleY + m.lowerLegH - overlap;
        const hipY = kneeY + m.upperLegH - overlap;
        const torsoBottomY = hipY - overlap;
        const torsoCenterY = torsoBottomY + (m.torsoH / 2);
        const torsoTopY = torsoBottomY + m.torsoH;
        const neckTopY = torsoTopY + m.neckH - overlap;
        const headCenterY = neckTopY - overlap + (m.headH / 2);
        const shoulderY = torsoTopY - 0.03;
        const shoulderLocalY = shoulderY - torsoCenterY;
        const torsoHalfW = m.torsoW / 2;
        const shoulderX = torsoHalfW + (m.armW / 2) - 0.04;
        const legX = 0.17;

        const upperArmTop = 0.03;
        const upperArmOffsetY = upperArmTop - (m.upperArmH / 2);
        const upperArmBottom = upperArmTop - m.upperArmH;
        const lowerArmTop = 0.025;
        const elbowY = (upperArmBottom + overlap) - lowerArmTop;
        const lowerArmOffsetY = lowerArmTop - (m.lowerArmH / 2);
        const lowerArmBottom = lowerArmOffsetY - (m.lowerArmH / 2);
        const wristOverlap = 0.004;
        const handOffsetY = (lowerArmBottom + wristOverlap) - (m.handH / 2);

        const upperLegTop = 0.03;
        const upperLegOffsetY = upperLegTop - (m.upperLegH / 2);
        const upperLegBottom = upperLegTop - m.upperLegH;
        const legNodeY = hipY - upperLegTop;
        const lowerLegTop = 0.025;
        const lowerLegNodeY = (upperLegBottom + overlap) - lowerLegTop;
        const lowerLegOffsetY = lowerLegTop - (m.lowerLegH / 2);
        const lowerLegBottom = lowerLegOffsetY - (m.lowerLegH / 2);
        const bootOffsetY = (lowerLegBottom + overlap) - (m.footH / 2);

        const pose = {
            nodes: {
                torso: [0, torsoCenterY, 0],
                head: [0, headCenterY - torsoCenterY, 0.01],
                leftArm: [shoulderX, shoulderLocalY, 0.025],
                rightArm: [-shoulderX, shoulderLocalY, 0.025],
                leftLowerArm: [0, elbowY, -0.015],
                rightLowerArm: [0, elbowY, -0.015],
                leftLeg: [legX, legNodeY, 0],
                rightLeg: [-legX, legNodeY, 0],
                leftLowerLeg: [0, lowerLegNodeY, 0],
                rightLowerLeg: [0, lowerLegNodeY, 0]
            }
        };

        const frontZ = (m.torsoD / 2) + 0.035;
        const fragments = [
            box('head', 'head_core', [0.48, m.headH, 0.39], [0, 0, 0], skin),
            box('head', 'hair_cap', [0.46, 0.09, 0.42], [0, 0.195, -0.01], hair),
            box('head', 'hair_front', [0.38, 0.075, 0.075], [0, 0.135, 0.225], hairShadow),
            box('head', 'left_sideburn', [0.07, 0.18, 0.07], [0.21, 0.035, 0.18], hairShadow),
            box('head', 'right_sideburn', [0.07, 0.18, 0.07], [-0.21, 0.035, 0.18], hairShadow),
            box('head', 'left_ear', [0.08, 0.15, 0.08], [0.265, 0.02, -0.02], skinShadow),
            box('head', 'right_ear', [0.08, 0.15, 0.08], [-0.265, 0.02, -0.02], skinShadow),
            box('head', 'left_eye', [0.055, 0.045, 0.03], [0.095, 0.045, 0.205], eye),
            box('head', 'right_eye', [0.055, 0.045, 0.03], [-0.095, 0.045, 0.205], eye),
            box('head', 'left_brow', [0.12, 0.025, 0.025], [0.095, 0.095, 0.215], hairShadow),
            box('head', 'right_brow', [0.12, 0.025, 0.025], [-0.095, 0.095, 0.215], hairShadow),
            box('head', 'moustache', [0.28, 0.055, 0.045], [0, -0.055, 0.225], beard),
            box('head', 'beard', [0.30, 0.13, 0.065], [0, -0.14, 0.215], beard),
            box('head', 'mouth', [0.12, 0.025, 0.025], [0, -0.095, 0.252], mouth),

            box('torso', 'torso_core', [m.torsoW, m.torsoH, m.torsoD], [0, 0, 0], shirt),
            box('torso', 'plaid_vertical_left', [0.045, 0.49, 0.055], [0.15, 0.015, frontZ], plaidDark),
            box('torso', 'plaid_vertical_right', [0.045, 0.49, 0.055], [-0.15, 0.015, frontZ], plaidDark),
            box('torso', 'plaid_vertical_tan', [0.035, 0.50, 0.06], [0, 0.0, frontZ + 0.004], plaidTan),
            box('torso', 'plaid_horizontal_high', [0.58, 0.04, 0.06], [0, 0.15, frontZ + 0.008], plaidDark),
            box('torso', 'plaid_horizontal_low', [0.58, 0.04, 0.06], [0, -0.05, frontZ + 0.008], plaidDark),
            box('torso', 'vest_left_front', [0.17, 0.47, 0.09], [0.22, 0.005, frontZ + 0.025], vest),
            box('torso', 'vest_right_front', [0.17, 0.47, 0.09], [-0.22, 0.005, frontZ + 0.025], vest),
            box('torso', 'vest_back_bulk', [0.61, 0.47, 0.09], [0, 0.005, -frontZ], vestDark),
            box('torso', 'neck', [0.18, m.neckH, 0.16], [0, (m.torsoH / 2) + (m.neckH / 2) - overlap, 0.02], skin),
            box('torso', 'left_shoulder_cap', [0.18, 0.13, 0.25], [torsoHalfW + 0.045, shoulderLocalY - 0.015, 0.015], vestDark),
            box('torso', 'right_shoulder_cap', [0.18, 0.13, 0.25], [-(torsoHalfW + 0.045), shoulderLocalY - 0.015, 0.015], vestDark),
            box('torso', 'belt', [0.70, 0.08, 0.40], [0, (-m.torsoH / 2) + 0.085, 0.005], belt),
            box('torso', 'belt_buckle', [0.12, 0.095, 0.05], [0, (-m.torsoH / 2) + 0.085, frontZ + 0.045], '#b18a38'),
            box('torso', 'belt_axe_handle', [0.065, 0.34, 0.055], [-0.30, -0.205, frontZ + 0.08], axeHandle, { rotation: [0, 0, -0.46] }),
            box('torso', 'belt_axe_head', [0.21, 0.10, 0.06], [-0.225, -0.105, frontZ + 0.095], axeMetal, { rotation: [0, 0, -0.46] }),
            box('torso', 'belt_axe_edge', [0.055, 0.14, 0.065], [-0.15, -0.095, frontZ + 0.105], axeEdge, { rotation: [0, 0, -0.46] }),

            box('leftArm', 'upper_arm', [m.armW, m.upperArmH, 0.21], [0, upperArmOffsetY, 0], shirt),
            box('rightArm', 'upper_arm', [m.armW, m.upperArmH, 0.21], [0, upperArmOffsetY, 0], shirt),
            box('leftArm', 'sleeve_plaid', [0.05, 0.28, 0.04], [0, upperArmOffsetY, 0.12], plaidDark),
            box('rightArm', 'sleeve_plaid', [0.05, 0.28, 0.04], [0, upperArmOffsetY, 0.12], plaidDark),
            box('leftArm', 'sleeve_band', [0.22, 0.045, 0.04], [0, upperArmOffsetY + 0.075, 0.125], plaidTan),
            box('rightArm', 'sleeve_band', [0.22, 0.045, 0.04], [0, upperArmOffsetY + 0.075, 0.125], plaidTan),
            box('leftLowerArm', 'lower_arm', [m.forearmW, m.lowerArmH, 0.17], [0, lowerArmOffsetY, 0], skin),
            box('rightLowerArm', 'lower_arm', [m.forearmW, m.lowerArmH, 0.17], [0, lowerArmOffsetY, 0], skin),
            box('leftLowerArm', 'cuff', [0.17, 0.035, 0.15], [0, lowerArmBottom + 0.09, 0], plaidDark),
            box('rightLowerArm', 'cuff', [0.17, 0.035, 0.15], [0, lowerArmBottom + 0.09, 0], plaidDark),
            box('leftLowerArm', 'hand', [0.13, 0.11, 0.12], [0, handOffsetY, 0], glove),
            box('rightLowerArm', 'hand', [0.13, 0.11, 0.12], [0, handOffsetY, 0], glove),

            box('leftLeg', 'upper_leg', [0.23, m.upperLegH, 0.24], [0.01, upperLegOffsetY, 0], trouser),
            box('rightLeg', 'upper_leg', [0.23, m.upperLegH, 0.24], [-0.01, upperLegOffsetY, 0], trouser),
            box('leftLowerLeg', 'lower_leg', [0.19, m.lowerLegH, 0.18], [0, lowerLegOffsetY, 0], bootLeg),
            box('rightLowerLeg', 'lower_leg', [0.19, m.lowerLegH, 0.18], [0, lowerLegOffsetY, 0], bootLeg),
            box('leftLowerLeg', 'boot', [0.25, m.footH, 0.32], [0, bootOffsetY, 0.055], boot),
            box('rightLowerLeg', 'boot', [0.25, m.footH, 0.32], [0, bootOffsetY, 0.055], boot)
        ];

        return {
            label: 'Woodcutting Instructor',
            archetype: 'old_woodsman',
            construction: {
                floorY: 0,
                hipY,
                shoulderY,
                elbowY,
                wristY: torsoCenterY + shoulderLocalY + elbowY + lowerArmBottom,
                headTopY: headCenterY + (m.headH / 2),
                minContactOverlap: overlap
            },
            scale: [1.0, 1.0, 1.0],
            armRigDefaults: {
                elbowPivot: {
                    x: 0,
                    y: elbowY,
                    z: -0.015
                }
            },
            pose,
            fragments
        };
    }

    function buildTutorialFishingInstructorPreset() {
        const skin = '#c18b69';
        const skinShadow = '#96664f';
        const hair = '#5f5a51';
        const hairShadow = '#48443d';
        const beard = '#565046';
        const eye = '#15110d';
        const mouth = '#734a38';
        const shirt = '#a98356';
        const shirtDark = '#7a5d3d';
        const vest = '#466b59';
        const vestDark = '#314f45';
        const wader = '#3a5753';
        const waderDark = '#2c403f';
        const hat = '#7b6a43';
        const hatDark = '#55492f';
        const pocket = '#c8b476';
        const belt = '#5a3a25';
        const glove = '#6b4f34';
        const boot = '#2c231b';
        const bootLeg = '#263736';
        const line = '#ded2a6';
        const cork = '#b4773f';
        const floatRed = '#9b2e2a';
        const netCord = '#cbbf97';
        const netFrame = '#76583a';

        const overlap = 0.03;
        const m = {
            footH: 0.13,
            lowerLegH: 0.35,
            upperLegH: 0.36,
            torsoW: 0.66,
            torsoH: 0.59,
            torsoD: 0.38,
            neckH: 0.11,
            headH: 0.43,
            upperArmH: 0.36,
            lowerArmH: 0.34,
            handH: 0.12,
            armW: 0.23,
            forearmW: 0.19
        };

        const ankleY = m.footH;
        const kneeY = ankleY + m.lowerLegH - overlap;
        const hipY = kneeY + m.upperLegH - overlap;
        const torsoBottomY = hipY - overlap;
        const torsoCenterY = torsoBottomY + (m.torsoH / 2);
        const torsoTopY = torsoBottomY + m.torsoH;
        const neckTopY = torsoTopY + m.neckH - overlap;
        const headCenterY = neckTopY - overlap + (m.headH / 2);
        const shoulderY = torsoTopY - 0.03;
        const shoulderLocalY = shoulderY - torsoCenterY;
        const torsoHalfW = m.torsoW / 2;
        const shoulderX = torsoHalfW + (m.armW / 2) - 0.04;
        const legX = 0.17;

        const upperArmTop = 0.03;
        const upperArmOffsetY = upperArmTop - (m.upperArmH / 2);
        const upperArmBottom = upperArmTop - m.upperArmH;
        const lowerArmTop = 0.025;
        const elbowY = (upperArmBottom + overlap) - lowerArmTop;
        const lowerArmOffsetY = lowerArmTop - (m.lowerArmH / 2);
        const lowerArmBottom = lowerArmOffsetY - (m.lowerArmH / 2);
        const handOffsetY = (lowerArmBottom + overlap) - (m.handH / 2);

        const upperLegTop = 0.03;
        const upperLegOffsetY = upperLegTop - (m.upperLegH / 2);
        const upperLegBottom = upperLegTop - m.upperLegH;
        const legNodeY = hipY - upperLegTop;
        const lowerLegTop = 0.025;
        const lowerLegNodeY = (upperLegBottom + overlap) - lowerLegTop;
        const lowerLegOffsetY = lowerLegTop - (m.lowerLegH / 2);
        const lowerLegBottom = lowerLegOffsetY - (m.lowerLegH / 2);
        const bootOffsetY = (lowerLegBottom + overlap) - (m.footH / 2);

        const pose = {
            nodes: {
                torso: [0, torsoCenterY, 0],
                head: [0, headCenterY - torsoCenterY, 0.01],
                leftArm: [shoulderX, shoulderLocalY, 0.02],
                rightArm: [-shoulderX, shoulderLocalY, 0.02],
                leftLowerArm: [0, elbowY, -0.015],
                rightLowerArm: [0, elbowY, -0.015],
                leftLeg: [legX, legNodeY, 0],
                rightLeg: [-legX, legNodeY, 0],
                leftLowerLeg: [0, lowerLegNodeY, 0],
                rightLowerLeg: [0, lowerLegNodeY, 0]
            }
        };

        const frontZ = (m.torsoD / 2) + 0.035;
        const fragments = [
            box('head', 'head_core', [0.48, m.headH, 0.39], [0, 0, 0], skin),
            box('head', 'hair_cap', [0.46, 0.085, 0.42], [0, 0.195, -0.01], hair),
            box('head', 'hair_front', [0.36, 0.07, 0.075], [0, 0.135, 0.225], hairShadow),
            box('head', 'hat_brim', [0.66, 0.055, 0.58], [0, 0.205, 0.005], hat),
            box('head', 'hat_front_brim', [0.50, 0.045, 0.18], [0, 0.195, 0.31], hat),
            box('head', 'hat_crown', [0.42, 0.15, 0.36], [0, 0.29, -0.005], hat),
            box('head', 'hat_band', [0.44, 0.04, 0.37], [0, 0.24, 0], hatDark),
            box('head', 'left_sideburn', [0.07, 0.18, 0.07], [0.21, 0.035, 0.18], hairShadow),
            box('head', 'right_sideburn', [0.07, 0.18, 0.07], [-0.21, 0.035, 0.18], hairShadow),
            box('head', 'left_ear', [0.08, 0.15, 0.08], [0.265, 0.02, -0.02], skinShadow),
            box('head', 'right_ear', [0.08, 0.15, 0.08], [-0.265, 0.02, -0.02], skinShadow),
            box('head', 'left_eye', [0.055, 0.045, 0.03], [0.095, 0.045, 0.205], eye),
            box('head', 'right_eye', [0.055, 0.045, 0.03], [-0.095, 0.045, 0.205], eye),
            box('head', 'left_brow', [0.12, 0.025, 0.025], [0.095, 0.095, 0.215], hairShadow),
            box('head', 'right_brow', [0.12, 0.025, 0.025], [-0.095, 0.095, 0.215], hairShadow),
            box('head', 'moustache', [0.28, 0.055, 0.045], [0, -0.055, 0.225], beard),
            box('head', 'beard', [0.28, 0.12, 0.06], [0, -0.135, 0.215], beard),
            box('head', 'mouth', [0.12, 0.025, 0.025], [0, -0.095, 0.252], mouth),

            box('torso', 'torso_core', [m.torsoW, m.torsoH, m.torsoD], [0, 0, 0], shirt),
            box('torso', 'shirt_panel', [0.30, 0.34, 0.07], [0, 0.08, frontZ], shirtDark),
            box('torso', 'wader_bib', [0.34, 0.36, 0.09], [0, -0.095, frontZ + 0.045], wader),
            box('torso', 'vest_left_front', [0.21, 0.49, 0.10], [0.22, 0.0, frontZ + 0.035], vest),
            box('torso', 'vest_right_front', [0.21, 0.49, 0.10], [-0.22, 0.0, frontZ + 0.035], vest),
            box('torso', 'vest_back_bulk', [0.63, 0.49, 0.09], [0, 0.0, -frontZ], vestDark),
            box('torso', 'vest_left_pocket', [0.15, 0.12, 0.055], [0.22, -0.02, frontZ + 0.10], pocket),
            box('torso', 'vest_right_pocket', [0.15, 0.12, 0.055], [-0.22, -0.02, frontZ + 0.10], pocket),
            box('torso', 'vest_left_upper_pocket', [0.13, 0.095, 0.05], [0.22, 0.17, frontZ + 0.095], pocket),
            box('torso', 'vest_right_upper_pocket', [0.13, 0.095, 0.05], [-0.22, 0.17, frontZ + 0.095], pocket),
            box('torso', 'wader_back_panel', [0.38, 0.38, 0.08], [0, -0.085, (-frontZ) - 0.035], wader),
            box('torso', 'left_wader_front_strap', [0.05, 0.50, 0.045], [0.135, 0.025, frontZ + 0.115], waderDark),
            box('torso', 'right_wader_front_strap', [0.05, 0.50, 0.045], [-0.135, 0.025, frontZ + 0.115], waderDark),
            box('torso', 'left_wader_back_strap', [0.05, 0.48, 0.045], [0.135, 0.005, (-frontZ) - 0.065], waderDark),
            box('torso', 'right_wader_back_strap', [0.05, 0.48, 0.045], [-0.135, 0.005, (-frontZ) - 0.065], waderDark),
            box('torso', 'left_wader_shoulder_bridge', [0.055, 0.105, m.torsoD + 0.14], [0.135, 0.25, 0.005], waderDark),
            box('torso', 'right_wader_shoulder_bridge', [0.055, 0.105, m.torsoD + 0.14], [-0.135, 0.25, 0.005], waderDark),
            box('torso', 'neck', [0.18, m.neckH, 0.16], [0, (m.torsoH / 2) + (m.neckH / 2) - overlap, 0.02], skin),
            box('torso', 'left_shoulder_cap', [0.18, 0.13, 0.25], [torsoHalfW + 0.045, shoulderLocalY - 0.015, 0.015], vestDark),
            box('torso', 'right_shoulder_cap', [0.18, 0.13, 0.25], [-(torsoHalfW + 0.045), shoulderLocalY - 0.015, 0.015], vestDark),
            box('torso', 'belt', [0.70, 0.08, 0.40], [0, (-m.torsoH / 2) + 0.085, 0.005], belt),
            box('torso', 'belt_buckle', [0.12, 0.095, 0.05], [0, (-m.torsoH / 2) + 0.085, frontZ + 0.045], '#b18a38'),
            box('torso', 'line_spool_core', [0.22, 0.14, 0.07], [0.29, -0.13, frontZ + 0.09], cork),
            box('torso', 'line_spool_wrap', [0.24, 0.045, 0.075], [0.29, -0.13, frontZ + 0.10], line),
            box('torso', 'float_red', [0.075, 0.16, 0.055], [-0.29, -0.08, frontZ + 0.09], floatRed),
            box('torso', 'float_cork', [0.075, 0.10, 0.055], [-0.29, -0.19, frontZ + 0.09], cork),
            box('torso', 'landing_net_handle', [0.055, 0.42, 0.055], [-0.38, -0.09, frontZ + 0.055], netFrame, { rotation: [0, 0, -0.12] }),
            box('torso', 'landing_net_frame', [0.21, 0.14, 0.045], [-0.40, -0.245, frontZ + 0.095], netFrame),
            box('torso', 'landing_net_mesh_horizontal', [0.17, 0.022, 0.05], [-0.40, -0.245, frontZ + 0.105], netCord),
            box('torso', 'landing_net_mesh_vertical', [0.022, 0.11, 0.05], [-0.40, -0.245, frontZ + 0.11], netCord),

            box('leftArm', 'upper_arm', [m.armW, m.upperArmH, 0.21], [0, upperArmOffsetY, 0], shirt),
            box('rightArm', 'upper_arm', [m.armW, m.upperArmH, 0.21], [0, upperArmOffsetY, 0], shirt),
            box('leftArm', 'rolled_sleeve', [0.23, 0.06, 0.05], [0, upperArmOffsetY - 0.11, 0.125], shirtDark),
            box('rightArm', 'rolled_sleeve', [0.23, 0.06, 0.05], [0, upperArmOffsetY - 0.11, 0.125], shirtDark),
            box('leftLowerArm', 'lower_arm', [m.forearmW, m.lowerArmH, 0.17], [0, lowerArmOffsetY, 0], skin),
            box('rightLowerArm', 'lower_arm', [m.forearmW, m.lowerArmH, 0.17], [0, lowerArmOffsetY, 0], skin),
            box('leftLowerArm', 'cuff', [0.20, 0.05, 0.175], [0, lowerArmBottom + 0.052, 0.005], shirtDark),
            box('rightLowerArm', 'cuff', [0.20, 0.05, 0.175], [0, lowerArmBottom + 0.052, 0.005], shirtDark),
            box('leftLowerArm', 'hand', [0.14, m.handH, 0.13], [0, handOffsetY, 0.02], glove),
            box('rightLowerArm', 'hand', [0.14, m.handH, 0.13], [0, handOffsetY, 0.02], glove),

            box('leftLeg', 'upper_leg', [0.23, m.upperLegH, 0.24], [0.01, upperLegOffsetY, 0], wader),
            box('rightLeg', 'upper_leg', [0.23, m.upperLegH, 0.24], [-0.01, upperLegOffsetY, 0], wader),
            box('leftLeg', 'wader_knee_patch', [0.16, 0.11, 0.045], [0.01, upperLegOffsetY - 0.06, 0.145], waderDark),
            box('rightLeg', 'wader_knee_patch', [0.16, 0.11, 0.045], [-0.01, upperLegOffsetY - 0.06, 0.145], waderDark),
            box('leftLowerLeg', 'lower_leg', [0.19, m.lowerLegH, 0.18], [0, lowerLegOffsetY, 0], bootLeg),
            box('rightLowerLeg', 'lower_leg', [0.19, m.lowerLegH, 0.18], [0, lowerLegOffsetY, 0], bootLeg),
            box('leftLowerLeg', 'tall_boot_cuff', [0.22, 0.08, 0.20], [0, lowerLegOffsetY + 0.10, 0.01], waderDark),
            box('rightLowerLeg', 'tall_boot_cuff', [0.22, 0.08, 0.20], [0, lowerLegOffsetY + 0.10, 0.01], waderDark),
            box('leftLowerLeg', 'boot', [0.25, m.footH, 0.32], [0, bootOffsetY, 0.055], boot),
            box('rightLowerLeg', 'boot', [0.25, m.footH, 0.32], [0, bootOffsetY, 0.055], boot)
        ];

        return {
            label: 'Fishing Instructor',
            archetype: 'weathered_angler',
            construction: {
                floorY: 0,
                hipY,
                shoulderY,
                elbowY,
                wristY: torsoCenterY + shoulderLocalY + elbowY + lowerArmBottom,
                headTopY: headCenterY + (m.headH / 2),
                minContactOverlap: overlap
            },
            scale: [1.0, 1.0, 1.0],
            armRigDefaults: {
                elbowPivot: {
                    x: 0,
                    y: elbowY,
                    z: -0.015
                }
            },
            pose,
            fragments
        };
    }

    function buildTutorialFiremakingInstructorPreset() {
        const skin = '#c58c68';
        const skinShadow = '#8e6048';
        const hair = '#3f342b';
        const hairShadow = '#2d261f';
        const beard = '#3a3028';
        const eye = '#15100c';
        const mouth = '#724837';
        const shirt = '#a84b26';
        const shirtDark = '#6f2f1d';
        const apron = '#4a3a2b';
        const apronDark = '#2f2822';
        const soot = '#1d1d1b';
        const ash = '#8a8477';
        const ember = '#d9792f';
        const trim = '#c58a3a';
        const belt = '#563621';
        const glove = '#3c2c20';
        const trouser = '#41382f';
        const boot = '#241f1a';
        const bootLeg = '#332b24';
        const log = '#7b4c29';
        const logDark = '#4c3020';
        const tinderbox = '#7a6f5a';
        const tinderboxDark = '#3d3830';

        const overlap = 0.03;
        const m = {
            footH: 0.13,
            lowerLegH: 0.35,
            upperLegH: 0.36,
            torsoW: 0.66,
            torsoH: 0.59,
            torsoD: 0.38,
            neckH: 0.11,
            headH: 0.43,
            upperArmH: 0.36,
            lowerArmH: 0.34,
            handH: 0.12,
            armW: 0.23,
            forearmW: 0.19
        };

        const ankleY = m.footH;
        const kneeY = ankleY + m.lowerLegH - overlap;
        const hipY = kneeY + m.upperLegH - overlap;
        const torsoBottomY = hipY - overlap;
        const torsoCenterY = torsoBottomY + (m.torsoH / 2);
        const torsoTopY = torsoBottomY + m.torsoH;
        const neckTopY = torsoTopY + m.neckH - overlap;
        const headCenterY = neckTopY - overlap + (m.headH / 2);
        const shoulderY = torsoTopY - 0.03;
        const shoulderLocalY = shoulderY - torsoCenterY;
        const torsoHalfW = m.torsoW / 2;
        const shoulderX = torsoHalfW + (m.armW / 2) - 0.04;
        const legX = 0.17;

        const upperArmTop = 0.03;
        const upperArmOffsetY = upperArmTop - (m.upperArmH / 2);
        const upperArmBottom = upperArmTop - m.upperArmH;
        const lowerArmTop = 0.025;
        const elbowY = (upperArmBottom + overlap) - lowerArmTop;
        const lowerArmOffsetY = lowerArmTop - (m.lowerArmH / 2);
        const lowerArmBottom = lowerArmOffsetY - (m.lowerArmH / 2);
        const wristOverlap = 0.004;
        const handOffsetY = (lowerArmBottom + wristOverlap) - (m.handH / 2);

        const upperLegTop = 0.03;
        const upperLegOffsetY = upperLegTop - (m.upperLegH / 2);
        const upperLegBottom = upperLegTop - m.upperLegH;
        const legNodeY = hipY - upperLegTop;
        const lowerLegTop = 0.025;
        const lowerLegNodeY = (upperLegBottom + overlap) - lowerLegTop;
        const lowerLegOffsetY = lowerLegTop - (m.lowerLegH / 2);
        const lowerLegBottom = lowerLegOffsetY - (m.lowerLegH / 2);
        const bootOffsetY = (lowerLegBottom + overlap) - (m.footH / 2);

        const pose = {
            nodes: {
                torso: [0, torsoCenterY, 0],
                head: [0, headCenterY - torsoCenterY, 0.01],
                leftArm: [shoulderX, shoulderLocalY, 0.02],
                rightArm: [-shoulderX, shoulderLocalY, 0.02],
                leftLowerArm: [0, elbowY, -0.015],
                rightLowerArm: [0, elbowY, -0.015],
                leftLeg: [legX, legNodeY, 0],
                rightLeg: [-legX, legNodeY, 0],
                leftLowerLeg: [0, lowerLegNodeY, 0],
                rightLowerLeg: [0, lowerLegNodeY, 0]
            }
        };

        const frontZ = (m.torsoD / 2) + 0.035;
        const fragments = [
            box('head', 'head_core', [0.48, m.headH, 0.39], [0, 0, 0], skin),
            box('head', 'hair_cap', [0.46, 0.085, 0.42], [0, 0.195, -0.01], hair),
            box('head', 'hair_front', [0.36, 0.07, 0.075], [0, 0.135, 0.225], hairShadow),
            box('head', 'left_ear', [0.08, 0.15, 0.08], [0.265, 0.02, -0.02], skinShadow),
            box('head', 'right_ear', [0.08, 0.15, 0.08], [-0.265, 0.02, -0.02], skinShadow),
            box('head', 'left_eye', [0.055, 0.045, 0.03], [0.095, 0.045, 0.205], eye),
            box('head', 'right_eye', [0.055, 0.045, 0.03], [-0.095, 0.045, 0.205], eye),
            box('head', 'left_brow', [0.12, 0.025, 0.025], [0.095, 0.095, 0.215], hairShadow),
            box('head', 'right_brow', [0.12, 0.025, 0.025], [-0.095, 0.095, 0.215], hairShadow),
            box('head', 'moustache', [0.24, 0.05, 0.045], [0, -0.055, 0.225], beard),
            box('head', 'short_beard', [0.24, 0.095, 0.055], [0, -0.13, 0.215], beard),
            box('head', 'left_soot_cheek', [0.10, 0.045, 0.032], [0.15, -0.015, 0.232], soot),
            box('head', 'right_soot_cheek', [0.09, 0.04, 0.032], [-0.145, -0.025, 0.232], soot),
            box('head', 'mouth', [0.11, 0.024, 0.025], [0, -0.095, 0.252], mouth),

            box('torso', 'torso_core', [m.torsoW, m.torsoH, m.torsoD], [0, 0, 0], shirt),
            box('torso', 'shirt_shadow_panel', [0.32, 0.38, 0.07], [0, 0.07, frontZ], shirtDark),
            box('torso', 'apron_front', [0.42, 0.48, 0.10], [0, -0.045, frontZ + 0.04], apron),
            box('torso', 'apron_lower_shadow', [0.40, 0.18, 0.11], [0, -0.18, frontZ + 0.055], apronDark),
            box('torso', 'apron_back', [0.42, 0.42, 0.08], [0, -0.06, (-frontZ) - 0.035], apron),
            box('torso', 'left_apron_strap', [0.05, 0.50, 0.045], [0.145, 0.025, frontZ + 0.075], apronDark),
            box('torso', 'right_apron_strap', [0.05, 0.50, 0.045], [-0.145, 0.025, frontZ + 0.075], apronDark),
            box('torso', 'left_apron_back_strap', [0.05, 0.48, 0.045], [0.145, 0.01, (-frontZ) - 0.065], apronDark),
            box('torso', 'right_apron_back_strap', [0.05, 0.48, 0.045], [-0.145, 0.01, (-frontZ) - 0.065], apronDark),
            box('torso', 'left_apron_shoulder_bridge', [0.06, 0.105, m.torsoD + 0.14], [0.145, 0.245, 0.005], apronDark),
            box('torso', 'right_apron_shoulder_bridge', [0.06, 0.105, m.torsoD + 0.14], [-0.145, 0.245, 0.005], apronDark),
            box('torso', 'ash_splatter_high', [0.11, 0.055, 0.035], [0.08, 0.16, frontZ + 0.11], ash),
            box('torso', 'ash_splatter_low', [0.09, 0.045, 0.035], [-0.12, -0.04, frontZ + 0.11], ash),
            box('torso', 'ember_patch', [0.08, 0.055, 0.035], [0.17, -0.12, frontZ + 0.115], ember),
            box('torso', 'neck', [0.18, m.neckH, 0.16], [0, (m.torsoH / 2) + (m.neckH / 2) - overlap, 0.02], skin),
            box('torso', 'left_shoulder_cap', [0.18, 0.13, 0.25], [torsoHalfW + 0.045, shoulderLocalY - 0.015, 0.015], shirtDark),
            box('torso', 'right_shoulder_cap', [0.18, 0.13, 0.25], [-(torsoHalfW + 0.045), shoulderLocalY - 0.015, 0.015], shirtDark),
            box('torso', 'belt', [0.70, 0.08, 0.40], [0, (-m.torsoH / 2) + 0.085, 0.005], belt),
            box('torso', 'belt_buckle', [0.12, 0.095, 0.05], [0, (-m.torsoH / 2) + 0.085, frontZ + 0.045], trim),
            box('torso', 'belt_tinderbox_case', [0.12, 0.13, 0.055], [-0.18, -0.165, frontZ + 0.075], tinderbox),
            box('torso', 'belt_tinderbox_lid', [0.12, 0.035, 0.06], [-0.18, -0.108, frontZ + 0.08], tinderboxDark),
            box('torso', 'belt_log_bundle_one', [0.055, 0.20, 0.055], [0.16, -0.18, frontZ + 0.072], log, { rotation: [0, 0, -0.22] }),
            box('torso', 'belt_log_bundle_two', [0.055, 0.19, 0.055], [0.205, -0.17, frontZ + 0.078], logDark, { rotation: [0, 0, -0.12] }),
            box('torso', 'belt_log_binding', [0.13, 0.032, 0.034], [0.183, -0.175, frontZ + 0.103], trim, { rotation: [0, 0, -0.16] }),

            box('leftArm', 'upper_arm', [m.armW, m.upperArmH, 0.21], [0, upperArmOffsetY, 0], shirt),
            box('rightArm', 'upper_arm', [m.armW, m.upperArmH, 0.21], [0, upperArmOffsetY, 0], shirt),
            box('leftArm', 'sooty_sleeve', [0.20, 0.07, 0.05], [0, upperArmOffsetY - 0.11, 0.125], soot),
            box('rightArm', 'sooty_sleeve', [0.20, 0.07, 0.05], [0, upperArmOffsetY - 0.11, 0.125], soot),
            box('leftLowerArm', 'lower_arm', [m.forearmW, m.lowerArmH, 0.17], [0, lowerArmOffsetY, 0], skin),
            box('rightLowerArm', 'lower_arm', [m.forearmW, m.lowerArmH, 0.17], [0, lowerArmOffsetY, 0], skin),
            box('leftLowerArm', 'cuff', [0.17, 0.035, 0.15], [0, lowerArmBottom + 0.09, 0], shirtDark),
            box('rightLowerArm', 'cuff', [0.17, 0.035, 0.15], [0, lowerArmBottom + 0.09, 0], shirtDark),
            box('leftLowerArm', 'hand', [0.13, 0.11, 0.12], [0, handOffsetY, 0], glove),
            box('rightLowerArm', 'hand', [0.13, 0.11, 0.12], [0, handOffsetY, 0], glove),

            box('leftLeg', 'upper_leg', [0.23, m.upperLegH, 0.24], [0.01, upperLegOffsetY, 0], trouser),
            box('rightLeg', 'upper_leg', [0.23, m.upperLegH, 0.24], [-0.01, upperLegOffsetY, 0], trouser),
            box('leftLowerLeg', 'lower_leg', [0.19, m.lowerLegH, 0.18], [0, lowerLegOffsetY, 0], bootLeg),
            box('rightLowerLeg', 'lower_leg', [0.19, m.lowerLegH, 0.18], [0, lowerLegOffsetY, 0], bootLeg),
            box('leftLowerLeg', 'boot', [0.25, m.footH, 0.32], [0, bootOffsetY, 0.055], boot),
            box('rightLowerLeg', 'boot', [0.25, m.footH, 0.32], [0, bootOffsetY, 0.055], boot)
        ];

        return {
            label: 'Firemaking Instructor',
            archetype: 'sooty_fire_worker',
            construction: {
                floorY: 0,
                hipY,
                shoulderY,
                elbowY,
                wristY: torsoCenterY + shoulderLocalY + elbowY + lowerArmBottom,
                headTopY: headCenterY + (m.headH / 2),
                minContactOverlap: overlap
            },
            scale: [1.0, 1.0, 1.0],
            armRigDefaults: {
                elbowPivot: {
                    x: 0,
                    y: elbowY,
                    z: -0.015
                }
            },
            pose,
            fragments
        };
    }

    function buildTutorialMiningSmithingInstructorPreset() {
        const preset = buildTutorialFiremakingInstructorPreset();
        const leather = '#5f432b';
        const leatherDark = '#33261c';
        const shirt = '#5f6f6b';
        const shirtDark = '#3f4d4b';
        const soot = '#1f1f1c';
        const oreDust = '#8a8173';
        const copper = '#b56f4e';
        const tin = '#b8c4c9';
        const trim = '#b88b42';
        const belt = '#4c3322';
        const glove = '#2f2720';
        const trouser = '#3c3b35';
        const boot = '#211d19';
        const bootLeg = '#302c25';
        const metal = '#9ca4a8';
        const darkMetal = '#5d6264';
        const toolHandle = '#775033';

        const cloneFragment = (fragment) => Object.assign({}, fragment, {
            size: Array.isArray(fragment.size) ? fragment.size.slice() : fragment.size,
            offset: Array.isArray(fragment.offset) ? fragment.offset.slice() : fragment.offset,
            rotation: Array.isArray(fragment.rotation) ? fragment.rotation.slice() : fragment.rotation
        });
        const mappedFragments = preset.fragments
            .filter((fragment) => {
                const role = fragment && fragment.role ? fragment.role : '';
                return role.indexOf('tinderbox') === -1
                    && role.indexOf('log_bundle') === -1
                    && role !== 'ember_patch';
            })
            .map((fragment) => {
                const copy = cloneFragment(fragment);
                const role = copy.role || '';
                const target = copy.target || '';
                if (role === 'torso_core' || role === 'upper_arm' || role.indexOf('shirt') !== -1) copy.rgbColor = shirt;
                if (role.indexOf('shadow') !== -1 || role.indexOf('sleeve') !== -1) copy.rgbColor = shirtDark;
                if (role.indexOf('apron') !== -1) copy.rgbColor = role.indexOf('shadow') !== -1 || role.indexOf('strap') !== -1 ? leatherDark : leather;
                if (role.indexOf('soot') !== -1) copy.rgbColor = soot;
                if (role.indexOf('ash') !== -1) copy.rgbColor = oreDust;
                if (role === 'belt') copy.rgbColor = belt;
                if (role === 'belt_buckle') copy.rgbColor = trim;
                if (role === 'hand') copy.rgbColor = glove;
                if (target.indexOf('Leg') !== -1 && role.indexOf('upper_leg') !== -1) copy.rgbColor = trouser;
                if (role === 'lower_leg') copy.rgbColor = bootLeg;
                if (role === 'boot') copy.rgbColor = boot;
                return copy;
            });

        mappedFragments.push(
            box('torso', 'ore_dust_chest', [0.13, 0.055, 0.035], [-0.07, 0.15, 0.34], oreDust),
            box('torso', 'copper_ore_smear', [0.09, 0.05, 0.035], [0.16, 0.02, 0.345], copper),
            box('torso', 'tin_ore_smear', [0.08, 0.045, 0.035], [-0.18, -0.11, 0.345], tin),
            box('torso', 'belt_hammer_handle', [0.045, 0.22, 0.04], [0.19, -0.205, 0.30], toolHandle, { rotation: [0, 0, 0.28] }),
            box('torso', 'belt_hammer_head', [0.15, 0.055, 0.065], [0.22, -0.12, 0.315], metal, { rotation: [0, 0, 0.28] }),
            box('torso', 'belt_tongs_left', [0.035, 0.24, 0.035], [-0.20, -0.19, 0.305], darkMetal, { rotation: [0, 0, -0.24] }),
            box('torso', 'belt_tongs_right', [0.035, 0.24, 0.035], [-0.15, -0.19, 0.305], darkMetal, { rotation: [0, 0, -0.08] }),
            box('torso', 'belt_tongs_tip', [0.12, 0.035, 0.04], [-0.17, -0.29, 0.315], metal, { rotation: [0, 0, -0.16] })
        );

        return Object.assign({}, preset, {
            label: 'Mining and Smithing Instructor',
            archetype: 'aproned_mine_foreman',
            fragments: mappedFragments
        });
    }

    function buildTutorialCombatInstructorPreset() {
        const skin = '#c58c68';
        const skinShadow = '#9b654d';
        const scalp = '#6e4d38';
        const eye = '#121614';
        const brow = '#2c211b';
        const mouth = '#7e4638';
        const steel = '#9aa5a2';
        const steelLight = '#c4ccca';
        const steelDark = '#596360';
        const steelShadow = '#323b39';
        const mail = '#687370';
        const mailDark = '#2b3432';
        const leather = '#5b3b27';
        const leatherDark = '#2f241b';
        const bronze = '#a9793d';
        const bronzeDark = '#6a4828';
        const blade = '#c4ccca';
        const bladeDark = '#77817e';
        const cape = '#8a2f2a';
        const capeDark = '#4f1f1c';
        const capeTrim = '#b89545';

        const overlap = 0.03;
        const m = {
            footH: 0.14,
            lowerLegH: 0.36,
            upperLegH: 0.38,
            torsoW: 0.72,
            torsoH: 0.62,
            torsoD: 0.42,
            neckH: 0.12,
            headH: 0.44,
            upperArmH: 0.39,
            lowerArmH: 0.36,
            handH: 0.12,
            armW: 0.25,
            forearmW: 0.21
        };

        const ankleY = m.footH;
        const kneeY = ankleY + m.lowerLegH - overlap;
        const hipY = kneeY + m.upperLegH - overlap;
        const torsoBottomY = hipY - overlap;
        const torsoCenterY = torsoBottomY + (m.torsoH / 2);
        const torsoTopY = torsoBottomY + m.torsoH;
        const neckTopY = torsoTopY + m.neckH - overlap;
        const headCenterY = neckTopY - overlap + (m.headH / 2);
        const shoulderY = torsoTopY - 0.03;
        const shoulderLocalY = shoulderY - torsoCenterY;
        const torsoHalfW = m.torsoW / 2;
        const shoulderX = torsoHalfW + (m.armW / 2) - 0.045;
        const legX = 0.18;

        const upperArmTop = 0.035;
        const upperArmOffsetY = upperArmTop - (m.upperArmH / 2);
        const upperArmBottom = upperArmTop - m.upperArmH;
        const lowerArmTop = 0.025;
        const elbowY = (upperArmBottom + overlap) - lowerArmTop;
        const lowerArmOffsetY = lowerArmTop - (m.lowerArmH / 2);
        const lowerArmBottom = lowerArmOffsetY - (m.lowerArmH / 2);
        const wristOverlap = 0.004;
        const handOffsetY = (lowerArmBottom + wristOverlap) - (m.handH / 2);

        const upperLegTop = 0.03;
        const upperLegOffsetY = upperLegTop - (m.upperLegH / 2);
        const upperLegBottom = upperLegTop - m.upperLegH;
        const legNodeY = hipY - upperLegTop;
        const lowerLegTop = 0.025;
        const lowerLegNodeY = (upperLegBottom + overlap) - lowerLegTop;
        const lowerLegOffsetY = lowerLegTop - (m.lowerLegH / 2);
        const lowerLegBottom = lowerLegOffsetY - (m.lowerLegH / 2);
        const bootOffsetY = (lowerLegBottom + overlap) - (m.footH / 2);

        const pose = {
            nodes: {
                torso: [0, torsoCenterY, 0],
                head: [0, headCenterY - torsoCenterY, 0.01],
                leftArm: [shoulderX, shoulderLocalY, 0.02],
                rightArm: [-shoulderX, shoulderLocalY, 0.02],
                leftLowerArm: [0, elbowY, -0.012],
                rightLowerArm: [0, elbowY, -0.012],
                leftLeg: [legX, legNodeY, 0],
                rightLeg: [-legX, legNodeY, 0],
                leftLowerLeg: [0, lowerLegNodeY, 0],
                rightLowerLeg: [0, lowerLegNodeY, 0]
            }
        };

        const frontZ = (m.torsoD / 2) + 0.035;
        const backZ = -frontZ;
        const loweredSwordRotation = [0.18, 0, -0.16];
        const shieldSideRotation = [0, 1.5708, 0];

        const fragments = [
            box('head', 'head_core', [0.48, m.headH, 0.39], [0, 0, 0], skin),
            box('head', 'shaved_scalp', [0.44, 0.08, 0.40], [0, 0.19, -0.01], scalp),
            box('head', 'left_ear', [0.08, 0.15, 0.075], [0.265, 0.02, -0.015], skinShadow),
            box('head', 'right_ear', [0.08, 0.15, 0.075], [-0.265, 0.02, -0.015], skinShadow),
            box('head', 'left_eye', [0.055, 0.045, 0.032], [0.095, 0.045, 0.205], eye),
            box('head', 'right_eye', [0.055, 0.045, 0.032], [-0.095, 0.045, 0.205], eye),
            box('head', 'left_brow', [0.12, 0.03, 0.03], [0.095, 0.095, 0.218], brow),
            box('head', 'right_brow', [0.12, 0.03, 0.03], [-0.095, 0.095, 0.218], brow),
            box('head', 'nose_bridge', [0.055, 0.13, 0.035], [0, -0.015, 0.225], skinShadow),
            box('head', 'mouth', [0.13, 0.025, 0.028], [0, -0.115, 0.218], mouth),
            box('head', 'chin_shadow', [0.18, 0.055, 0.035], [0, -0.17, 0.205], skinShadow),
            box('head', 'left_cheek_shadow', [0.09, 0.045, 0.03], [0.14, -0.045, 0.218], skinShadow),
            box('head', 'right_cheek_shadow', [0.09, 0.045, 0.03], [-0.14, -0.045, 0.218], skinShadow),

            box('torso', 'torso_core', [m.torsoW, m.torsoH, m.torsoD], [0, 0, 0], steelShadow),
            box('torso', 'cape_back_panel', [0.66, 0.86, 0.075], [0, -0.12, backZ - 0.10], cape),
            box('torso', 'cape_left_fold', [0.10, 0.78, 0.09], [0.30, -0.14, backZ - 0.075], capeDark),
            box('torso', 'cape_right_fold', [0.10, 0.78, 0.09], [-0.30, -0.14, backZ - 0.075], capeDark),
            box('torso', 'cape_bottom_shadow', [0.62, 0.055, 0.085], [0, -0.56, backZ - 0.075], capeDark),
            box('torso', 'left_cape_clasp', [0.095, 0.08, 0.075], [0.27, (m.torsoH / 2) - 0.075, frontZ + 0.075], capeTrim),
            box('torso', 'right_cape_clasp', [0.095, 0.08, 0.075], [-0.27, (m.torsoH / 2) - 0.075, frontZ + 0.075], capeTrim),
            box('torso', 'breastplate_front', [0.68, 0.54, 0.13], [0, 0.02, frontZ], steel),
            box('torso', 'breastplate_back', [0.66, 0.50, 0.11], [0, 0.02, backZ], steelDark),
            box('torso', 'breastplate_center_ridge', [0.08, 0.50, 0.05], [0, 0.03, frontZ + 0.08], steelLight),
            box('torso', 'left_breastplate_side_shadow', [0.07, 0.47, 0.07], [0.31, 0, frontZ + 0.045], steelDark),
            box('torso', 'right_breastplate_side_shadow', [0.07, 0.47, 0.07], [-0.31, 0, frontZ + 0.045], steelDark),
            box('torso', 'gorget', [0.44, 0.10, 0.36], [0, (m.torsoH / 2) - 0.005, 0.02], steelLight),
            box('torso', 'neck', [0.20, m.neckH, 0.18], [0, (m.torsoH / 2) + (m.neckH / 2) - overlap, 0.02], mailDark),
            box('torso', 'left_shoulder_cap', [0.22, 0.15, 0.32], [torsoHalfW + 0.045, shoulderLocalY - 0.015, 0.015], steelDark),
            box('torso', 'right_shoulder_cap', [0.22, 0.15, 0.32], [-(torsoHalfW + 0.045), shoulderLocalY - 0.015, 0.015], steelDark),
            box('torso', 'left_pauldron', [0.34, 0.18, 0.38], [torsoHalfW + 0.12, shoulderLocalY - 0.03, 0.035], steel),
            box('torso', 'right_pauldron', [0.34, 0.18, 0.38], [-(torsoHalfW + 0.12), shoulderLocalY - 0.03, 0.035], steel),
            box('torso', 'left_pauldron_rim', [0.36, 0.045, 0.40], [torsoHalfW + 0.12, shoulderLocalY - 0.12, 0.035], steelDark),
            box('torso', 'right_pauldron_rim', [0.36, 0.045, 0.40], [-(torsoHalfW + 0.12), shoulderLocalY - 0.12, 0.035], steelDark),
            box('torso', 'left_pauldron_trim', [0.09, 0.065, 0.08], [torsoHalfW + 0.13, shoulderLocalY + 0.04, 0.235], bronze),
            box('torso', 'right_pauldron_trim', [0.09, 0.065, 0.08], [-(torsoHalfW + 0.13), shoulderLocalY + 0.04, 0.235], bronze),
            box('torso', 'battle_belt', [0.78, 0.08, 0.45], [0, (-m.torsoH / 2) + 0.095, 0.005], leather),
            box('torso', 'battle_belt_shadow', [0.76, 0.035, 0.44], [0, (-m.torsoH / 2) + 0.045, 0.005], leatherDark),
            box('torso', 'belt_buckle', [0.14, 0.10, 0.055], [0, (-m.torsoH / 2) + 0.095, frontZ + 0.055], bronze),
            box('torso', 'front_mail_skirt', [0.46, 0.13, 0.12], [0, (-m.torsoH / 2) - 0.035, frontZ - 0.015], mail),
            box('torso', 'left_waist_tasset', [0.22, 0.18, 0.11], [0.21, (-m.torsoH / 2) - 0.055, frontZ], steelDark),
            box('torso', 'right_waist_tasset', [0.22, 0.18, 0.11], [-0.21, (-m.torsoH / 2) - 0.055, frontZ], steelDark),

            box('leftArm', 'upper_arm', [m.armW, m.upperArmH, 0.22], [0, upperArmOffsetY, 0], steelShadow),
            box('rightArm', 'upper_arm', [m.armW, m.upperArmH, 0.22], [0, upperArmOffsetY, 0], steelShadow),
            box('leftArm', 'left_rerebrace', [0.28, 0.31, 0.25], [0, upperArmOffsetY - 0.015, 0.025], steel),
            box('rightArm', 'right_rerebrace', [0.28, 0.31, 0.25], [0, upperArmOffsetY - 0.015, 0.025], steel),
            box('leftArm', 'left_rerebrace_shadow', [0.05, 0.28, 0.27], [0.12, upperArmOffsetY - 0.015, 0.03], steelDark),
            box('rightArm', 'right_rerebrace_shadow', [0.05, 0.28, 0.27], [-0.12, upperArmOffsetY - 0.015, 0.03], steelDark),
            box('leftLowerArm', 'lower_arm', [m.forearmW, m.lowerArmH, 0.19], [0, lowerArmOffsetY, 0], steelShadow),
            box('rightLowerArm', 'lower_arm', [m.forearmW, m.lowerArmH, 0.19], [0, lowerArmOffsetY, 0], steelShadow),
            box('leftLowerArm', 'left_vambrace', [0.24, 0.25, 0.22], [0, lowerArmOffsetY - 0.025, 0.025], steel),
            box('rightLowerArm', 'right_vambrace', [0.24, 0.25, 0.22], [0, lowerArmOffsetY - 0.025, 0.025], steel),
            box('leftLowerArm', 'cuff', [0.23, 0.045, 0.21], [0, lowerArmBottom + 0.08, 0.015], bronzeDark),
            box('rightLowerArm', 'cuff', [0.23, 0.045, 0.21], [0, lowerArmBottom + 0.08, 0.015], bronzeDark),
            box('leftLowerArm', 'hand', [0.15, m.handH, 0.14], [0, handOffsetY, 0.015], steelDark),
            box('rightLowerArm', 'hand', [0.15, m.handH, 0.14], [0, handOffsetY, 0.015], steelDark),
            box('leftLowerArm', 'left_gauntlet_plate', [0.18, 0.075, 0.16], [0, handOffsetY + 0.01, 0.065], steel),
            box('rightLowerArm', 'right_gauntlet_plate', [0.18, 0.075, 0.16], [0, handOffsetY + 0.01, 0.065], steel),

            box('axe', 'right_hand_sword_grip', [0.055, 0.19, 0.055], [0.00, -0.035, 0.08], bronzeDark, { rotation: loweredSwordRotation }),
            box('axe', 'right_hand_sword_guard', [0.22, 0.045, 0.06], [-0.01, -0.13, 0.09], bronze, { rotation: [0, 0, -0.08] }),
            box('axe', 'right_hand_sword_blade', [0.07, 0.48, 0.04], [-0.045, -0.37, 0.095], blade, { rotation: loweredSwordRotation }),
            box('axe', 'right_hand_sword_fuller', [0.022, 0.36, 0.045], [-0.045, -0.36, 0.123], bladeDark, { rotation: loweredSwordRotation }),
            box('axe', 'right_hand_sword_pommel', [0.075, 0.07, 0.07], [0.02, 0.075, 0.075], bronze, { rotation: loweredSwordRotation }),
            box('leftLowerArm', 'left_arm_shield_backstrap', [0.14, 0.25, 0.03], [0.11, lowerArmOffsetY - 0.02, 0.06], leatherDark, { rotation: shieldSideRotation }),
            box('leftLowerArm', 'left_arm_shield_face', [0.34, 0.44, 0.055], [0.23, lowerArmOffsetY - 0.04, 0.07], steelDark, { rotation: shieldSideRotation }),
            box('leftLowerArm', 'left_arm_shield_plate', [0.25, 0.34, 0.07], [0.265, lowerArmOffsetY - 0.04, 0.07], steel, { rotation: shieldSideRotation }),
            box('leftLowerArm', 'left_arm_shield_rim', [0.36, 0.045, 0.075], [0.275, lowerArmOffsetY + 0.165, 0.07], bronzeDark, { rotation: shieldSideRotation }),
            box('leftLowerArm', 'left_arm_shield_boss', [0.11, 0.11, 0.09], [0.31, lowerArmOffsetY - 0.04, 0.07], bronze, { rotation: shieldSideRotation }),

            box('leftLeg', 'upper_leg', [0.25, m.upperLegH, 0.25], [0.01, upperLegOffsetY, 0], steelShadow),
            box('rightLeg', 'upper_leg', [0.25, m.upperLegH, 0.25], [-0.01, upperLegOffsetY, 0], steelShadow),
            box('leftLeg', 'left_cuisse', [0.28, 0.31, 0.27], [0.01, upperLegOffsetY + 0.005, 0.03], steel),
            box('rightLeg', 'right_cuisse', [0.28, 0.31, 0.27], [-0.01, upperLegOffsetY + 0.005, 0.03], steel),
            box('leftLeg', 'left_cuisse_shadow', [0.07, 0.27, 0.28], [0.13, upperLegOffsetY + 0.005, 0.03], steelDark),
            box('rightLeg', 'right_cuisse_shadow', [0.07, 0.27, 0.28], [-0.13, upperLegOffsetY + 0.005, 0.03], steelDark),
            box('leftLowerLeg', 'lower_leg', [0.21, m.lowerLegH, 0.20], [0, lowerLegOffsetY, 0], steelShadow),
            box('rightLowerLeg', 'lower_leg', [0.21, m.lowerLegH, 0.20], [0, lowerLegOffsetY, 0], steelShadow),
            box('leftLowerLeg', 'left_knee_guard', [0.27, 0.085, 0.27], [0, lowerLegTop - 0.02, 0.055], steelLight),
            box('rightLowerLeg', 'right_knee_guard', [0.27, 0.085, 0.27], [0, lowerLegTop - 0.02, 0.055], steelLight),
            box('leftLowerLeg', 'left_greave', [0.24, 0.25, 0.23], [0, lowerLegOffsetY - 0.03, 0.04], steel),
            box('rightLowerLeg', 'right_greave', [0.24, 0.25, 0.23], [0, lowerLegOffsetY - 0.03, 0.04], steel),
            box('leftLowerLeg', 'left_greave_shadow', [0.06, 0.23, 0.24], [0.10, lowerLegOffsetY - 0.03, 0.045], steelDark),
            box('rightLowerLeg', 'right_greave_shadow', [0.06, 0.23, 0.24], [-0.10, lowerLegOffsetY - 0.03, 0.045], steelDark),
            box('leftLowerLeg', 'boot', [0.27, m.footH, 0.34], [0, bootOffsetY, 0.07], steelDark),
            box('rightLowerLeg', 'boot', [0.27, m.footH, 0.34], [0, bootOffsetY, 0.07], steelDark),
            box('leftLowerLeg', 'left_sabaton_toe', [0.29, 0.08, 0.20], [0, bootOffsetY - 0.025, 0.21], steel),
            box('rightLowerLeg', 'right_sabaton_toe', [0.29, 0.08, 0.20], [0, bootOffsetY - 0.025, 0.21], steel)
        ];

        return {
            label: 'Combat Instructor',
            archetype: 'yard_arms_trainer',
            construction: {
                floorY: 0,
                hipY,
                shoulderY,
                elbowY,
                wristY: torsoCenterY + shoulderLocalY + elbowY + lowerArmBottom,
                headTopY: headCenterY + (m.headH / 2),
                minContactOverlap: overlap
            },
            scale: [1.0, 1.0, 1.0],
            armRigDefaults: {
                elbowPivot: {
                    x: 0,
                    y: elbowY,
                    z: -0.012
                }
            },
            pose,
            fragments
        };
    }

    function clonePresetWithTheme(basePreset, label, archetype, theme, extraFragments) {
        const fragments = basePreset.fragments.map((fragment) => {
            const copy = Object.assign({}, fragment);
            if (Array.isArray(fragment.size)) copy.size = fragment.size.slice();
            if (Array.isArray(fragment.offset)) copy.offset = fragment.offset.slice();
            if (Array.isArray(fragment.rotation)) copy.rotation = fragment.rotation.slice();
            const role = String(fragment.role || '');
            Object.keys(theme).forEach((key) => {
                if (role.indexOf(key) !== -1) copy.rgbColor = theme[key];
            });
            return copy;
        });
        (extraFragments || []).forEach((fragment) => fragments.push(fragment));
        return Object.assign({}, basePreset, {
            label,
            archetype,
            fragments
        });
    }

    function buildTutorialBankTutorPreset() {
        return clonePresetWithTheme(
            buildTutorialGuidePreset(),
            'Bank Tutor',
            'ledger_bank_tutor',
            {
                coat: '#1d3550',
                shirt: '#e4dac0',
                trim: '#c8a64c',
                belt: '#4d321f',
                trouser: '#2f343a',
                boot: '#1d1814'
            },
            [
                box('leftLowerArm', 'ledger_book', [0.24, 0.16, 0.05], [0.06, -0.28, 0.12], '#5c2f26', { rotation: [0.15, 0, 0.18] }),
                box('leftLowerArm', 'ledger_pages', [0.20, 0.13, 0.025], [0.065, -0.278, 0.155], '#e8d9ac', { rotation: [0.15, 0, 0.18] }),
                box('torso', 'bank_badge', [0.12, 0.10, 0.045], [0.22, 0.14, 0.235], '#d7ba59')
            ]
        );
    }

    function buildTutorialRangedInstructorPreset() {
        return clonePresetWithTheme(
            buildTutorialCombatInstructorPreset(),
            'Ranged Instructor',
            'archery_range_trainer',
            {
                steel: '#40513f',
                mail: '#4b5f3c',
                leather: '#5c3b24',
                bronze: '#8e6b33',
                blade: '#7a4c2a',
                cape: '#2f5a3d',
                pauldron: '#40513f',
                breastplate: '#4f643f',
                sword: '#7a4c2a',
                shield: '#5b3b27'
            },
            [
                box('torso', 'quiver_case', [0.18, 0.42, 0.13], [-0.34, -0.03, -0.34], '#5a3a24', { rotation: [0, 0, -0.28] }),
                box('torso', 'quiver_arrow_1', [0.035, 0.42, 0.035], [-0.38, 0.15, -0.35], '#b58b4a', { rotation: [0, 0, -0.28] }),
                box('torso', 'quiver_arrow_2', [0.035, 0.38, 0.035], [-0.31, 0.12, -0.35], '#d9d2bd', { rotation: [0, 0, -0.18] }),
                box('axe', 'shortbow_grip', [0.07, 0.20, 0.045], [0.02, -0.12, 0.09], '#5a341d', { rotation: [0, 0, -0.25] }),
                box('axe', 'shortbow_upper_limb', [0.045, 0.40, 0.04], [-0.03, 0.07, 0.09], '#8a5a2c', { rotation: [0.12, 0, -0.5] }),
                box('axe', 'shortbow_lower_limb', [0.045, 0.40, 0.04], [0.08, -0.31, 0.09], '#8a5a2c', { rotation: [-0.12, 0, 0.12] }),
                box('axe', 'shortbow_string', [0.018, 0.74, 0.025], [0.035, -0.12, 0.135], '#efe6c9', { rotation: [0, 0, -0.18] })
            ]
        );
    }

    function buildTutorialMagicInstructorPreset() {
        return clonePresetWithTheme(
            buildTutorialGuidePreset(),
            'Magic Instructor',
            'rune_lesson_mage',
            {
                coat: '#3c2d63',
                shirt: '#d7d2e8',
                trim: '#9bc2d8',
                belt: '#2c223d',
                trouser: '#2f2948',
                boot: '#21192c'
            },
            [
                box('head', 'soft_hood_back', [0.52, 0.16, 0.43], [0, 0.20, -0.03], '#2b2149'),
                box('torso', 'rune_sash', [0.13, 0.72, 0.055], [-0.18, 0.00, 0.24], '#7f74bd', { rotation: [0, 0, -0.35] }),
                box('torso', 'sash_rune_mark', [0.07, 0.07, 0.065], [-0.10, 0.10, 0.27], '#d8c56f'),
                box('axe', 'staff_shaft', [0.055, 0.86, 0.055], [0.00, -0.28, 0.08], '#6b4729', { rotation: [0.18, 0, -0.16] }),
                box('axe', 'staff_cap', [0.13, 0.12, 0.13], [-0.08, 0.15, 0.10], '#b99544', { rotation: [0.18, 0, -0.16] }),
                box('axe', 'staff_rune_core', [0.08, 0.08, 0.08], [-0.08, 0.18, 0.14], '#e07a3f', { rotation: [0.18, 0, -0.16] })
            ]
        );
    }

    function buildTutorialRunecraftingInstructorPreset() {
        return clonePresetWithTheme(
            buildTutorialGuidePreset(),
            'Runecrafting Instructor',
            'ember_altar_scribe',
            {
                coat: '#27475f',
                shirt: '#e0d6bd',
                trim: '#c46d3d',
                belt: '#563422',
                trouser: '#313f4a',
                boot: '#211b17'
            },
            [
                box('head', 'runecrafter_hood_top', [0.56, 0.14, 0.46], [0, 0.225, -0.02], '#183447'),
                box('head', 'runecrafter_hood_back', [0.54, 0.34, 0.12], [0, 0.07, -0.225], '#102838'),
                box('head', 'runecrafter_hood_left', [0.11, 0.34, 0.42], [0.255, 0.035, -0.02], '#183447'),
                box('head', 'runecrafter_hood_right', [0.11, 0.34, 0.42], [-0.255, 0.035, -0.02], '#183447'),
                box('torso', 'runecrafter_shoulder_mantle', [0.76, 0.16, 0.44], [0, 0.27, 0.02], '#183447'),
                box('torso', 'runecrafter_front_tabard', [0.24, 0.52, 0.06], [0, -0.07, 0.245], '#315a6d'),
                box('torso', 'tabard_ember_glyph', [0.10, 0.10, 0.035], [0, 0.08, 0.295], '#f0a04b'),
                box('torso', 'essence_pouch', [0.20, 0.20, 0.10], [0.25, -0.19, 0.25], '#6a5847'),
                box('torso', 'pouch_ember_mark', [0.08, 0.08, 0.04], [0.25, -0.17, 0.31], '#e36f3a'),
                box('rightLowerArm', 'rune_tablet', [0.18, 0.16, 0.045], [-0.04, -0.27, 0.12], '#7e848c', { rotation: [0.12, 0, -0.08] }),
                box('rightLowerArm', 'tablet_ember_glyph', [0.10, 0.08, 0.025], [-0.04, -0.27, 0.15], '#f0a04b', { rotation: [0.12, 0, -0.08] }),
                box('axe', 'runecrafter_stylus', [0.035, 0.52, 0.035], [0.03, -0.17, 0.08], '#c46d3d', { rotation: [0.15, 0, -0.24] }),
                box('axe', 'stylus_ember_tip', [0.075, 0.075, 0.075], [-0.035, 0.07, 0.11], '#f0a04b', { rotation: [0.15, 0, -0.24] })
            ]
        );
    }

    function buildTutorialCraftingInstructorPreset() {
        return clonePresetWithTheme(
            buildTutorialMiningSmithingInstructorPreset(),
            'Crafting Instructor',
            'clay_bench_artisan',
            {
                apron: '#6f5845',
                shirt: '#8b4d3a',
                leather: '#5d3a24',
                trouser: '#3d3a35',
                boot: '#2a2018',
                metal: '#b8a98b',
                ore: '#a78668'
            },
            [
                box('torso', 'crafting_tool_roll', [0.24, 0.15, 0.065], [-0.22, -0.20, 0.30], '#6a3f2a'),
                box('torso', 'small_chisel', [0.04, 0.25, 0.035], [-0.23, -0.20, 0.35], '#c7c0ad', { rotation: [0, 0, 0.35] }),
                box('rightLowerArm', 'soft_clay_lump', [0.16, 0.11, 0.12], [-0.02, -0.29, 0.08], '#b28a6d')
            ]
        );
    }

    function buildGuideVariantPreset(label, archetype, theme, extraFragments) {
        return clonePresetWithTheme(
            buildTutorialGuidePreset(),
            label,
            archetype,
            Object.assign({
                coat: '#304a3c',
                shirt: '#d8c9a5',
                trim: '#b89545',
                belt: '#53351f',
                trouser: '#343a36',
                boot: '#241c16'
            }, theme || {}),
            extraFragments || []
        );
    }

    function buildWorkerVariantPreset(label, archetype, theme, extraFragments) {
        return clonePresetWithTheme(
            buildTutorialWoodcuttingInstructorPreset(),
            label,
            archetype,
            Object.assign({
                shirt: '#7a3a28',
                plaid: '#4d241d',
                vest: '#43543a',
                belt: '#563822',
                glove: '#64472d',
                trouser: '#494239',
                boot: '#2b2118',
                axe: '#8f969b'
            }, theme || {}),
            extraFragments || []
        );
    }

    function buildFisherVariantPreset(label, archetype, theme, extraFragments) {
        return clonePresetWithTheme(
            buildTutorialFishingInstructorPreset(),
            label,
            archetype,
            Object.assign({
                shirt: '#8f7147',
                vest: '#3d6655',
                wader: '#304d4c',
                hat: '#756940',
                belt: '#573823',
                glove: '#61482f',
                boot: '#2a211a'
            }, theme || {}),
            extraFragments || []
        );
    }

    function buildSmithVariantPreset(label, archetype, theme, extraFragments) {
        return clonePresetWithTheme(
            buildTutorialMiningSmithingInstructorPreset(),
            label,
            archetype,
            Object.assign({
                apron: '#5c4a39',
                shirt: '#6a4633',
                leather: '#4f321f',
                trouser: '#3d3a35',
                boot: '#2a2018',
                metal: '#a9a49a',
                ore: '#87694f'
            }, theme || {}),
            extraFragments || []
        );
    }

    function buildRuneVariantPreset(label, archetype, theme, extraFragments) {
        return clonePresetWithTheme(
            buildTutorialRunecraftingInstructorPreset(),
            label,
            archetype,
            Object.assign({
                coat: '#253f5a',
                shirt: '#ddd0b5',
                trim: '#b96d3d',
                belt: '#533420',
                trouser: '#2f3f49',
                boot: '#211b17',
                rune: '#f0a04b',
                tabard: '#315a6d',
                pouch: '#6a5847'
            }, theme || {}),
            extraFragments || []
        );
    }

    function buildMainlandShopkeeperPreset() {
        return buildGuideVariantPreset(
            'Shopkeeper',
            'general_store_shopkeeper',
            {
                coat: '#3b4d31',
                shirt: '#e1d1a5',
                trim: '#c8a64c',
                trouser: '#3c382c'
            },
            [
                box('torso', 'shop_apron_front', [0.36, 0.42, 0.06], [0, -0.06, 0.245], '#7a5632'),
                box('torso', 'shop_apron_pocket', [0.18, 0.12, 0.04], [0.10, -0.12, 0.285], '#5b3b24'),
                box('leftLowerArm', 'price_ledger', [0.22, 0.15, 0.045], [0.05, -0.28, 0.12], '#6b3c2a', { rotation: [0.1, 0, 0.18] })
            ]
        );
    }

    function buildMainlandBankerPreset() {
        return clonePresetWithTheme(
            buildTutorialBankTutorPreset(),
            'Banker',
            'mainland_bank_clerk',
            {
                coat: '#20384f',
                shirt: '#e4dac0',
                trim: '#c9b35c',
                belt: '#46301f',
                trouser: '#2f343a',
                boot: '#1d1814',
                ledger: '#53312a',
                bank: '#d1b45a'
            },
            [
                box('head', 'banker_clerk_cap_crown', [0.46, 0.09, 0.40], [0, 0.205, -0.005], '#17283a'),
                box('head', 'banker_clerk_cap_band', [0.50, 0.055, 0.43], [0, 0.155, 0.015], '#c9b35c'),
                box('head', 'banker_quill_stem', [0.028, 0.30, 0.028], [-0.23, 0.075, 0.155], '#d8c594', { rotation: [0.10, 0, -0.42] }),
                box('head', 'banker_quill_feather', [0.085, 0.16, 0.025], [-0.31, 0.175, 0.16], '#f0e6c8', { rotation: [0.10, 0, -0.42] }),
                box('torso', 'banker_left_lapel_trim', [0.055, 0.40, 0.045], [0.135, 0.015, 0.252], '#b99d4e', { rotation: [0, 0, -0.18] }),
                box('torso', 'banker_right_lapel_trim', [0.055, 0.40, 0.045], [-0.135, 0.015, 0.252], '#b99d4e', { rotation: [0, 0, 0.18] }),
                box('torso', 'banker_high_collar_left', [0.12, 0.15, 0.08], [0.12, 0.235, 0.245], '#17283a', { rotation: [0, 0, -0.16] }),
                box('torso', 'banker_high_collar_right', [0.12, 0.15, 0.08], [-0.12, 0.235, 0.245], '#17283a', { rotation: [0, 0, 0.16] }),
                box('torso', 'banker_badge_shadow', [0.145, 0.105, 0.032], [0.225, 0.135, 0.268], '#7b642e'),
                box('torso', 'banker_badge_face', [0.105, 0.075, 0.035], [0.225, 0.145, 0.292], '#d8c56b'),
                box('torso', 'banker_badge_mark', [0.055, 0.022, 0.02], [0.225, 0.145, 0.315], '#58431f'),
                box('torso', 'banker_receipt_slips', [0.14, 0.10, 0.035], [-0.195, -0.105, 0.272], '#e7d8aa', { rotation: [0, 0, -0.08] }),
                box('torso', 'banker_receipt_red_line', [0.11, 0.015, 0.02], [-0.195, -0.08, 0.295], '#8c2f2f', { rotation: [0, 0, -0.08] }),
                box('torso', 'banker_chain_drop', [0.16, 0.025, 0.03], [-0.25, -0.155, 0.285], '#b99d4e', { rotation: [0, 0, -0.2] }),
                box('torso', 'banker_key_ring_top', [0.12, 0.025, 0.032], [-0.32, -0.18, 0.292], '#d1b45a'),
                box('torso', 'banker_key_ring_bottom', [0.12, 0.025, 0.032], [-0.32, -0.255, 0.292], '#a98f43'),
                box('torso', 'banker_key_ring_left', [0.025, 0.10, 0.032], [-0.37, -0.217, 0.292], '#b99d4e'),
                box('torso', 'banker_key_ring_right', [0.025, 0.10, 0.032], [-0.27, -0.217, 0.292], '#b99d4e'),
                box('torso', 'banker_key_tooth_a', [0.035, 0.15, 0.025], [-0.355, -0.31, 0.292], '#d1b45a', { rotation: [0, 0, 0.18] }),
                box('torso', 'banker_key_tooth_b', [0.035, 0.12, 0.025], [-0.295, -0.305, 0.292], '#c0a24a', { rotation: [0, 0, -0.18] }),
                box('leftLowerArm', 'banker_ledger_strap', [0.035, 0.17, 0.024], [0.145, -0.278, 0.182], '#46301f', { rotation: [0.15, 0, 0.18] }),
                box('leftLowerArm', 'banker_ledger_line_1', [0.13, 0.012, 0.018], [0.04, -0.244, 0.182], '#1f2426', { rotation: [0.15, 0, 0.18] }),
                box('leftLowerArm', 'banker_ledger_line_2', [0.12, 0.012, 0.018], [0.045, -0.282, 0.182], '#1f2426', { rotation: [0.15, 0, 0.18] }),
                box('leftLowerArm', 'banker_wax_seal', [0.055, 0.055, 0.025], [0.13, -0.215, 0.188], '#8c2f2f', { rotation: [0.15, 0, 0.18] }),
                box('rightLowerArm', 'banker_coin_tray', [0.20, 0.055, 0.12], [-0.025, -0.305, 0.112], '#5b3b24', { rotation: [0, 0, -0.12] }),
                box('rightLowerArm', 'banker_coin_stack_left', [0.042, 0.028, 0.04], [0.035, -0.29, 0.185], '#d8c56b', { rotation: [0, 0, -0.12] }),
                box('rightLowerArm', 'banker_coin_stack_right', [0.035, 0.024, 0.035], [-0.035, -0.292, 0.185], '#c9b35c', { rotation: [0, 0, -0.12] })
            ]
        );
    }

    function buildMainlandFletchingSupplierPreset() {
        return buildWorkerVariantPreset(
            'Fletching Supplier',
            'feather_and_string_vendor',
            { shirt: '#6f4931', vest: '#4b5a38', plaid: '#8f6d45' },
            [
                box('torso', 'fletching_feather_bundle', [0.14, 0.28, 0.05], [0.27, -0.03, 0.28], '#d7d0b8', { rotation: [0, 0, -0.34] }),
                box('torso', 'fletching_string_spool', [0.16, 0.16, 0.07], [-0.24, -0.18, 0.27], '#d5c28e')
            ]
        );
    }

    function buildMainlandAdvancedFletcherPreset() {
        return clonePresetWithTheme(
            buildTutorialRangedInstructorPreset(),
            'Advanced Fletcher',
            'seasoned_bowyer',
            {
                steel: '#3e553c',
                mail: '#4e613c',
                leather: '#5a3a24',
                bronze: '#9b7a3a',
                blade: '#7b512b',
                cape: '#38533d',
                bow: '#8b5a2d',
                quiver: '#5b3b27'
            },
            [
                box('torso', 'bowyer_rune_mark', [0.09, 0.09, 0.04], [0.20, 0.12, 0.28], '#d8b65a')
            ]
        );
    }

    function buildMainlandAdvancedWoodsmanPreset() {
        return buildWorkerVariantPreset(
            'Advanced Woodsman',
            'north_lodge_woodsman',
            { shirt: '#7a3724', vest: '#365438', plaidTan: '#c49a61', hair: '#d0c1a5' },
            [
                box('torso', 'woodsman_tree_badge', [0.11, 0.12, 0.04], [0.22, 0.12, 0.28], '#7fb069')
            ]
        );
    }

    function buildMainlandRoadGuidePreset() {
        return buildGuideVariantPreset(
            'Road Guide',
            'starter_route_guide',
            { coat: '#385048', shirt: '#dfd0aa', trim: '#d19a45' },
            [
                box('torso', 'guide_map_roll', [0.10, 0.32, 0.06], [-0.25, -0.10, 0.26], '#d7c28e', { rotation: [0, 0, 0.35] }),
                box('rightLowerArm', 'guide_marker_staff', [0.045, 0.58, 0.045], [0.04, -0.24, 0.09], '#7a5632', { rotation: [0.14, 0, -0.18] })
            ]
        );
    }

    function buildMainlandOutpostGuidePreset() {
        return buildGuideVariantPreset(
            'Outpost Guide',
            'east_outpost_route_guide',
            { coat: '#3f4d5d', shirt: '#d8c7a5', trim: '#b9a15a', trouser: '#303942' },
            [
                box('torso', 'outpost_badge', [0.12, 0.12, 0.04], [0.22, 0.12, 0.27], '#c3a554'),
                box('torso', 'travel_satchel', [0.23, 0.20, 0.11], [-0.28, -0.20, 0.20], '#6b4a2f')
            ]
        );
    }

    function buildMainlandFishingTeacherPreset() {
        return buildFisherVariantPreset(
            'Fishing Teacher',
            'riverbank_fishing_teacher',
            { shirt: '#8b6743', vest: '#406350', hat: '#7a6b45' },
            [
                box('rightLowerArm', 'teaching_float', [0.08, 0.10, 0.08], [0.02, -0.28, 0.12], '#b44b3c')
            ]
        );
    }

    function buildMainlandFishingSupplierPreset() {
        return buildFisherVariantPreset(
            'Fishing Supplier',
            'net_and_bait_supplier',
            { shirt: '#7b6846', vest: '#48654d', wader: '#3f514d' },
            [
                box('torso', 'bait_tin', [0.18, 0.12, 0.08], [0.24, -0.18, 0.27], '#7d8a8a'),
                box('leftLowerArm', 'folded_net', [0.24, 0.16, 0.045], [0.06, -0.28, 0.12], '#c9bb91', { rotation: [0.12, 0, 0.18] })
            ]
        );
    }

    function buildMainlandForesterTeacherPreset() {
        return buildWorkerVariantPreset(
            'Forester Teacher',
            'starter_grove_forester',
            { shirt: '#79422d', vest: '#405d36', plaidTan: '#b9915e' },
            [
                box('torso', 'forester_leaf_pin', [0.11, 0.10, 0.04], [0.22, 0.14, 0.28], '#8fcf74')
            ]
        );
    }

    function buildMainlandBorinIronveinPreset() {
        return buildSmithVariantPreset(
            'Borin Ironvein',
            'ore_buyer_blacksmith',
            { apron: '#5b4634', shirt: '#6d3e2c', metal: '#b4aaa0', ore: '#8b6b52' },
            [
                box('torso', 'ironvein_ore_sample', [0.14, 0.10, 0.10], [0.24, -0.18, 0.30], '#7a6a5d')
            ]
        );
    }

    function buildMainlandThrainDeepforgePreset() {
        return buildSmithVariantPreset(
            'Thrain Deepforge',
            'deepforge_smith',
            { apron: '#4f3e32', shirt: '#70342a', metal: '#c0b6a8', ore: '#9d7b55' },
            [
                box('torso', 'deepforge_hammer_badge', [0.13, 0.10, 0.05], [0.22, 0.13, 0.30], '#c0b6a8')
            ]
        );
    }

    function buildMainlandEliraGemhandPreset() {
        return buildSmithVariantPreset(
            'Elira Gemhand',
            'market_gem_cutter',
            { apron: '#5a4d5d', shirt: '#5c4268', metal: '#a9a4b7', ore: '#8b6d9b' },
            [
                box('rightLowerArm', 'gem_sample', [0.10, 0.10, 0.10], [0.02, -0.28, 0.12], '#69b8d7'),
                box('torso', 'gemhand_pouch', [0.18, 0.15, 0.08], [-0.23, -0.18, 0.28], '#4c354f')
            ]
        );
    }

    function buildMainlandCraftingTeacherPreset() {
        return clonePresetWithTheme(
            buildTutorialCraftingInstructorPreset(),
            'Crafting Teacher',
            'market_crafting_teacher',
            {
                apron: '#695545',
                shirt: '#8a4d39',
                leather: '#5a3925',
                trouser: '#3c3933',
                boot: '#2b2118',
                metal: '#c2b28d',
                ore: '#b08a68'
            },
            [
                box('torso', 'crafting_teacher_pin', [0.10, 0.10, 0.04], [0.22, 0.14, 0.31], '#d0b05a')
            ]
        );
    }

    function buildMainlandMarketTraderPreset() {
        return buildGuideVariantPreset(
            'Crossing Trader',
            'market_crossing_trader',
            { coat: '#5a4632', shirt: '#e2d0a2', trim: '#c09a4a', trouser: '#3a332a' },
            [
                box('torso', 'trader_coin_purse', [0.18, 0.16, 0.08], [0.24, -0.18, 0.27], '#8b5d2d'),
                box('leftLowerArm', 'trade_manifest', [0.22, 0.15, 0.04], [0.06, -0.28, 0.12], '#dbc58e', { rotation: [0.12, 0, 0.16] })
            ]
        );
    }

    function buildMainlandPainterPreset() {
        return clonePresetWithTheme(
            buildTutorialCraftingInstructorPreset(),
            'Painter',
            'market_crossing_painter',
            {
                apron: '#5f5043',
                shirt: '#6d4c87',
                leather: '#4f3527',
                trouser: '#333038',
                boot: '#2a2018',
                metal: '#bcae93',
                ore: '#c28a66'
            },
            [
                box('rightLowerArm', 'paint_brush_handle', [0.035, 0.42, 0.035], [0.02, -0.20, 0.12], '#6b4729', { rotation: [0.15, 0, -0.26] }),
                box('rightLowerArm', 'paint_brush_tip', [0.08, 0.08, 0.045], [-0.035, 0.02, 0.14], '#d37b45', { rotation: [0.15, 0, -0.26] }),
                box('torso', 'paint_swatch_blue', [0.08, 0.06, 0.035], [0.18, -0.06, 0.31], '#5d8bb8')
            ]
        );
    }

    function buildMainlandQuarryForemanPreset() {
        return buildSmithVariantPreset(
            'Quarry Foreman',
            'south_quarry_foreman',
            { apron: '#685741', shirt: '#6d4d31', metal: '#aaa69d', ore: '#8e806d' },
            [
                box('torso', 'foreman_slate_badge', [0.12, 0.09, 0.045], [0.22, 0.13, 0.30], '#8e8c88'),
                box('leftLowerArm', 'foreman_clipboard', [0.24, 0.16, 0.045], [0.05, -0.28, 0.12], '#6d4b31', { rotation: [0.12, 0, 0.18] })
            ]
        );
    }

    function buildMainlandRoadScavengerPreset() {
        return buildGuideVariantPreset(
            'Road Scavenger',
            'old_road_scavenger',
            { coat: '#41382e', shirt: '#b9a67c', trim: '#8f7542', trouser: '#322d28', boot: '#211a15' },
            [
                box('torso', 'scavenger_patch', [0.13, 0.11, 0.04], [0.20, 0.12, 0.27], '#7f5a3a'),
                box('torso', 'scavenger_satchel', [0.24, 0.20, 0.10], [-0.28, -0.20, 0.20], '#5a3e29')
            ]
        );
    }

    function buildMainlandRuneTutorPreset() {
        return buildRuneVariantPreset(
            'Rune Tutor',
            'mainland_rune_tutor',
            { coat: '#23455f', tabard: '#2f5f75', trim: '#d27742', rune: '#f0a04b' },
            [
                box('torso', 'rune_tutor_air_glyph', [0.08, 0.08, 0.035], [0.13, 0.00, 0.32], '#86c5df')
            ]
        );
    }

    function buildMainlandCombinationSagePreset() {
        return buildRuneVariantPreset(
            'Combination Sage',
            'combination_rune_sage',
            { coat: '#3a315e', tabard: '#573f74', trim: '#d6a85f', rune: '#e58a44' },
            [
                box('torso', 'sage_water_glyph', [0.08, 0.08, 0.035], [0.13, 0.00, 0.32], '#6faed8'),
                box('torso', 'sage_earth_glyph', [0.08, 0.08, 0.035], [-0.13, 0.00, 0.32], '#8fb86f')
            ]
        );
    }

    function buildEnemyTrainingDummyPreset() {
        const preset = buildGuideVariantPreset(
            'Training Dummy',
            'yard_training_dummy',
            {
                head_core: '#9a6a39',
                left_ear: '#7a4f2a',
                right_ear: '#7a4f2a',
                lower_arm: '#8a5a2e',
                hand: '#8a5a2e',
                coat: '#8b5a2f',
                shirt: '#a97843',
                trim: '#6d4526',
                trouser: '#6c4727',
                boot: '#4d321d',
                hair: '#5b3a21',
                mouth: '#4a2f1d'
            },
            [
                box('torso', 'dummy_target_outer', [0.30, 0.30, 0.045], [0, 0.03, 0.285], '#efe0aa'),
                box('torso', 'dummy_target_ring', [0.21, 0.21, 0.05], [0, 0.03, 0.315], '#b85b35'),
                box('torso', 'dummy_target_core', [0.10, 0.10, 0.055], [0, 0.03, 0.345], '#efe0aa'),
                box('torso', 'dummy_straw_wrap', [0.62, 0.08, 0.41], [0, -0.20, 0.01], '#c6a05d'),
                box('leftArm', 'dummy_left_crossbar', [0.42, 0.08, 0.08], [0.08, -0.16, 0.02], '#7a4f2a', { rotation: [0, 0, -0.55] }),
                box('rightArm', 'dummy_right_crossbar', [0.42, 0.08, 0.08], [-0.08, -0.16, 0.02], '#7a4f2a', { rotation: [0, 0, 0.55] }),
                box('head', 'dummy_head_straw_band', [0.48, 0.08, 0.40], [0, 0.03, 0.02], '#cfae66'),
                box('head', 'dummy_face_slash_left', [0.08, 0.22, 0.035], [0.08, -0.04, 0.225], '#5d3a21', { rotation: [0, 0, 0.58] }),
                box('head', 'dummy_face_slash_right', [0.08, 0.22, 0.035], [-0.08, -0.04, 0.225], '#5d3a21', { rotation: [0, 0, -0.58] }),
                box('torso', 'dummy_center_stake', [0.16, 0.76, 0.16], [0, -0.08, -0.18], '#6b4526'),
                box('torso', 'dummy_rope_lashing_top', [0.70, 0.055, 0.44], [0, 0.22, 0.025], '#d7bd78'),
                box('torso', 'dummy_rope_lashing_bottom', [0.66, 0.055, 0.43], [0, -0.31, 0.025], '#d7bd78'),
                box('leftLowerLeg', 'dummy_left_ground_peg', [0.16, 0.12, 0.24], [0, -0.23, 0.08], '#5a371f'),
                box('rightLowerLeg', 'dummy_right_ground_peg', [0.16, 0.12, 0.24], [0, -0.23, 0.08], '#5a371f')
            ]
        );
        preset.scale = [0.96, 0.98, 0.96];
        return preset;
    }

    function buildEnemyGoblinGruntPreset() {
        const preset = buildGuideVariantPreset(
            'Goblin Grunt',
            'starter_road_goblin',
            {
                head_core: '#6fa74d',
                left_ear: '#6fa74d',
                right_ear: '#6fa74d',
                lower_arm: '#6fa74d',
                hand: '#6fa74d',
                coat: '#6b4429',
                shirt: '#7a4c2d',
                trim: '#9a7348',
                trouser: '#5f533b',
                boot: '#352a1f',
                hair: '#3f5d2d',
                mouth: '#3f2b1f'
            },
            [
                box('head', 'goblin_left_long_ear', [0.10, 0.34, 0.08], [0.34, 0.015, -0.035], '#74ad52', { rotation: [0, 0, -0.76] }),
                box('head', 'goblin_right_long_ear', [0.10, 0.32, 0.08], [-0.335, 0.005, -0.025], '#6fa74d', { rotation: [0, 0, 0.68] }),
                box('head', 'goblin_brow_left', [0.15, 0.045, 0.045], [0.10, 0.09, 0.238], '#395628'),
                box('head', 'goblin_brow_right', [0.15, 0.045, 0.045], [-0.10, 0.09, 0.238], '#395628'),
                box('head', 'goblin_jaw_slab', [0.24, 0.08, 0.055], [0, -0.145, 0.228], '#4f7c36'),
                box('head', 'goblin_tooth_left', [0.045, 0.06, 0.025], [0.06, -0.18, 0.258], '#d8d0b6'),
                box('head', 'goblin_tooth_right', [0.045, 0.06, 0.025], [-0.06, -0.18, 0.258], '#d8d0b6'),
                box('torso', 'goblin_rope_belt', [0.66, 0.07, 0.41], [0, -0.21, 0.035], '#c29a58'),
                box('torso', 'goblin_torn_tunic_left', [0.16, 0.16, 0.055], [0.18, -0.30, 0.24], '#53311b', { rotation: [0, 0, -0.16] }),
                box('torso', 'goblin_torn_tunic_right', [0.14, 0.14, 0.055], [-0.19, -0.29, 0.24], '#5b361f', { rotation: [0, 0, 0.18] }),
                box('leftLowerLeg', 'goblin_left_wrapped_foot', [0.24, 0.08, 0.32], [0.02, -0.30, 0.075], '#352a1f'),
                box('rightLowerLeg', 'goblin_right_wrapped_foot', [0.24, 0.08, 0.32], [-0.02, -0.30, 0.075], '#352a1f'),
                box('axe', 'goblin_club_handle', [0.10, 0.58, 0.09], [0.02, -0.22, 0.08], '#6b4729', { rotation: [0.1, 0, -0.24] }),
                box('axe', 'goblin_club_head', [0.22, 0.20, 0.18], [-0.055, 0.10, 0.10], '#4a3424', { rotation: [0.1, 0, -0.24] }),
                box('axe', 'goblin_club_worn_edge', [0.10, 0.05, 0.19], [-0.13, 0.16, 0.115], '#6b4b31', { rotation: [0.1, 0, -0.24] })
            ]
        );
        preset.scale = [0.94, 0.88, 0.96];
        return preset;
    }

    function buildEnemyGuardPreset() {
        return clonePresetWithTheme(
            buildTutorialCombatInstructorPreset(),
            'Guard',
            'east_outpost_guard',
            {
                steel: '#6f7f8a',
                mail: '#57636b',
                leather: '#4a3324',
                bronze: '#c09a4a',
                blade: '#c3c8c9',
                cape: '#28476b',
                pauldron: '#6f7f8a',
                breastplate: '#788894',
                sword: '#c3c8c9',
                shield: '#2f5279'
            },
            [
                box('head', 'guard_steel_med_helm', [0.52, 0.16, 0.42], [0, 0.19, -0.01], '#7b8992'),
                box('head', 'guard_steel_brow_band', [0.42, 0.07, 0.08], [0, 0.095, 0.235], '#53616a'),
                box('head', 'guard_steel_nasal_bar', [0.055, 0.22, 0.045], [0, -0.02, 0.255], '#9aa4aa'),
                box('head', 'guard_left_cheek_plate', [0.08, 0.18, 0.04], [0.19, -0.015, 0.235], '#64727b', { rotation: [0, 0, -0.16] }),
                box('head', 'guard_right_cheek_plate', [0.08, 0.18, 0.04], [-0.19, -0.015, 0.235], '#64727b', { rotation: [0, 0, 0.16] }),
                box('torso', 'guard_blue_tabard', [0.24, 0.48, 0.065], [0, -0.02, 0.325], '#284f7c'),
                box('torso', 'guard_bronze_tabard_pin', [0.11, 0.11, 0.045], [0, 0.18, 0.37], '#c09a4a'),
                box('torso', 'guard_blue_crest', [0.15, 0.15, 0.05], [0.22, 0.13, 0.34], '#315f93'),
                box('leftLowerArm', 'guard_blue_shield_face', [0.31, 0.40, 0.07], [0.275, -0.04, 0.11], '#2f5279', { rotation: [0, 1.5708, 0] }),
                box('leftLowerArm', 'guard_bronze_shield_rim', [0.36, 0.055, 0.085], [0.29, 0.16, 0.11], '#c09a4a', { rotation: [0, 1.5708, 0] }),
                box('leftLowerArm', 'guard_bronze_shield_boss', [0.12, 0.12, 0.09], [0.325, -0.04, 0.11], '#c09a4a', { rotation: [0, 1.5708, 0] })
            ]
        );
    }

    function buildEnemyHeavyBrutePreset() {
        const preset = buildSmithVariantPreset(
            'Heavy Brute',
            'camp_heavy_brute',
            {
                apron: '#3e342d',
                shirt: '#653628',
                leather: '#3d2a20',
                trouser: '#302d28',
                boot: '#241c16',
                metal: '#8e8a82',
                ore: '#6d5140'
            },
            [
                box('head', 'brute_brow_band', [0.36, 0.08, 0.05], [0, 0.095, 0.23], '#2a211b'),
                box('head', 'brute_broken_nose', [0.08, 0.14, 0.045], [0, -0.02, 0.245], '#8f5f46'),
                box('head', 'brute_beard_block', [0.30, 0.12, 0.065], [0, -0.15, 0.215], '#35261e'),
                box('torso', 'brute_shoulder_pad_left', [0.30, 0.18, 0.24], [0.42, 0.22, 0.05], '#5b4a3e'),
                box('torso', 'brute_shoulder_pad_right', [0.30, 0.18, 0.24], [-0.42, 0.22, 0.05], '#5b4a3e'),
                box('torso', 'brute_left_pad_rivet', [0.07, 0.07, 0.055], [0.42, 0.24, 0.205], '#8e8a82'),
                box('torso', 'brute_right_pad_rivet', [0.07, 0.07, 0.055], [-0.42, 0.24, 0.205], '#8e8a82'),
                box('torso', 'brute_belly_strap', [0.78, 0.075, 0.44], [0, -0.08, 0.03], '#2b211a', { rotation: [0, 0, -0.08] }),
                box('leftLowerLeg', 'brute_left_boot_plate', [0.25, 0.09, 0.28], [0, -0.22, 0.12], '#3b332d'),
                box('rightLowerLeg', 'brute_right_boot_plate', [0.25, 0.09, 0.28], [0, -0.22, 0.12], '#3b332d'),
                box('axe', 'brute_maul_handle', [0.08, 0.82, 0.08], [0.02, -0.26, 0.08], '#5a3924', { rotation: [0.18, 0, -0.22] }),
                box('axe', 'brute_maul_head', [0.34, 0.22, 0.22], [-0.08, 0.17, 0.10], '#77736b', { rotation: [0.18, 0, -0.22] }),
                box('axe', 'brute_maul_iron_band', [0.38, 0.055, 0.24], [-0.08, 0.17, 0.115], '#a39d91', { rotation: [0.18, 0, -0.22] })
            ]
        );
        preset.scale = [1.08, 1.05, 1.08];
        return preset;
    }

    function buildEnemyFastStrikerPreset() {
        const preset = buildGuideVariantPreset(
            'Fast Striker',
            'camp_fast_striker',
            {
                coat: '#3f3a31',
                shirt: '#6b5334',
                trim: '#b38b4a',
                belt: '#3c261b',
                trouser: '#2e332f',
                boot: '#211a15',
                hair: '#292018'
            },
            [
                box('torso', 'striker_sash', [0.12, 0.70, 0.055], [-0.17, 0.00, 0.25], '#8b2f2b', { rotation: [0, 0, -0.35] }),
                box('torso', 'striker_sash_tail', [0.13, 0.26, 0.06], [-0.28, -0.27, 0.22], '#782724', { rotation: [0, 0, -0.62] }),
                box('head', 'striker_mask_wrap', [0.34, 0.075, 0.045], [0, -0.08, 0.225], '#211a15'),
                box('torso', 'striker_hip_scabbard', [0.08, 0.36, 0.06], [0.26, -0.20, 0.25], '#2a2019', { rotation: [0, 0, 0.52] }),
                box('leftLowerArm', 'striker_left_wrist_wrap', [0.20, 0.055, 0.17], [0, -0.20, 0.02], '#4a3020'),
                box('rightLowerArm', 'striker_right_wrist_wrap', [0.20, 0.055, 0.17], [0, -0.20, 0.02], '#4a3020'),
                box('axe', 'striker_dagger_grip', [0.045, 0.18, 0.045], [0.00, -0.08, 0.08], '#4a3020', { rotation: [0.12, 0, -0.34] }),
                box('axe', 'striker_dagger_blade', [0.055, 0.34, 0.035], [-0.055, -0.25, 0.10], '#b9bec0', { rotation: [0.12, 0, -0.34] }),
                box('axe', 'striker_main_blade_tip', [0.07, 0.11, 0.038], [-0.09, -0.46, 0.105], '#d0d5d6', { rotation: [0.12, 0, -0.34] }),
                box('leftLowerArm', 'striker_offhand_grip', [0.055, 0.13, 0.044], [0.04, -0.16, 0.085], '#4a3020', { rotation: [0.12, 0, 0.28] }),
                box('leftLowerArm', 'striker_offhand_blade', [0.045, 0.30, 0.032], [0.08, -0.25, 0.10], '#aeb5b8', { rotation: [0.12, 0, 0.28] })
            ]
        );
        preset.scale = [0.95, 1.0, 0.92];
        return preset;
    }

    const PRESETS = {
        tutorial_guide: buildTutorialGuidePreset(),
        tutorial_woodcutting_instructor: buildTutorialWoodcuttingInstructorPreset(),
        tutorial_fishing_instructor: buildTutorialFishingInstructorPreset(),
        tutorial_firemaking_instructor: buildTutorialFiremakingInstructorPreset(),
        tutorial_mining_smithing_instructor: buildTutorialMiningSmithingInstructorPreset(),
        tutorial_combat_instructor: buildTutorialCombatInstructorPreset(),
        tutorial_ranged_instructor: buildTutorialRangedInstructorPreset(),
        tutorial_magic_instructor: buildTutorialMagicInstructorPreset(),
        tutorial_runecrafting_instructor: buildTutorialRunecraftingInstructorPreset(),
        tutorial_crafting_instructor: buildTutorialCraftingInstructorPreset(),
        tutorial_bank_tutor: buildTutorialBankTutorPreset(),
        mainland_shopkeeper: buildMainlandShopkeeperPreset(),
        mainland_banker: buildMainlandBankerPreset(),
        mainland_fletching_supplier: buildMainlandFletchingSupplierPreset(),
        mainland_advanced_fletcher: buildMainlandAdvancedFletcherPreset(),
        mainland_advanced_woodsman: buildMainlandAdvancedWoodsmanPreset(),
        mainland_road_guide: buildMainlandRoadGuidePreset(),
        mainland_outpost_guide: buildMainlandOutpostGuidePreset(),
        mainland_fishing_teacher: buildMainlandFishingTeacherPreset(),
        mainland_fishing_supplier: buildMainlandFishingSupplierPreset(),
        mainland_forester_teacher: buildMainlandForesterTeacherPreset(),
        mainland_borin_ironvein: buildMainlandBorinIronveinPreset(),
        mainland_thrain_deepforge: buildMainlandThrainDeepforgePreset(),
        mainland_elira_gemhand: buildMainlandEliraGemhandPreset(),
        mainland_crafting_teacher: buildMainlandCraftingTeacherPreset(),
        mainland_market_trader: buildMainlandMarketTraderPreset(),
        mainland_painter: buildMainlandPainterPreset(),
        mainland_quarry_foreman: buildMainlandQuarryForemanPreset(),
        mainland_road_scavenger: buildMainlandRoadScavengerPreset(),
        mainland_rune_tutor: buildMainlandRuneTutorPreset(),
        mainland_combination_sage: buildMainlandCombinationSagePreset(),
        enemy_training_dummy: buildEnemyTrainingDummyPreset(),
        enemy_goblin_grunt: buildEnemyGoblinGruntPreset(),
        enemy_guard: buildEnemyGuardPreset(),
        enemy_heavy_brute: buildEnemyHeavyBrutePreset(),
        enemy_fast_striker: buildEnemyFastStrikerPreset()
    };

    window.NpcAppearanceCatalog = {
        presets: PRESETS,
        aliases: {},
        previewActors: [
            { actorId: 'tutorial_guide', label: 'Tutorial Guide' },
            { actorId: 'tutorial_woodcutting_instructor', label: 'Woodcutting Instructor' },
            { actorId: 'tutorial_fishing_instructor', label: 'Fishing Instructor' },
            { actorId: 'tutorial_firemaking_instructor', label: 'Firemaking Instructor' },
            { actorId: 'tutorial_mining_smithing_instructor', label: 'Mining and Smithing Instructor' },
            { actorId: 'tutorial_combat_instructor', label: 'Combat Instructor' },
            { actorId: 'tutorial_ranged_instructor', label: 'Ranged Instructor' },
            { actorId: 'tutorial_magic_instructor', label: 'Magic Instructor' },
            { actorId: 'tutorial_runecrafting_instructor', label: 'Runecrafting Instructor' },
            { actorId: 'tutorial_crafting_instructor', label: 'Crafting Instructor' },
            { actorId: 'tutorial_bank_tutor', label: 'Bank Tutor' },
            { actorId: 'mainland_shopkeeper', label: 'Shopkeeper' },
            { actorId: 'mainland_banker', label: 'Banker' },
            { actorId: 'mainland_fletching_supplier', label: 'Fletching Supplier' },
            { actorId: 'mainland_advanced_fletcher', label: 'Advanced Fletcher' },
            { actorId: 'mainland_advanced_woodsman', label: 'Advanced Woodsman' },
            { actorId: 'mainland_road_guide', label: 'Road Guide' },
            { actorId: 'mainland_outpost_guide', label: 'Outpost Guide' },
            { actorId: 'mainland_fishing_teacher', label: 'Fishing Teacher' },
            { actorId: 'mainland_fishing_supplier', label: 'Fishing Supplier' },
            { actorId: 'mainland_forester_teacher', label: 'Forester Teacher' },
            { actorId: 'mainland_borin_ironvein', label: 'Borin Ironvein' },
            { actorId: 'mainland_thrain_deepforge', label: 'Thrain Deepforge' },
            { actorId: 'mainland_elira_gemhand', label: 'Elira Gemhand' },
            { actorId: 'mainland_crafting_teacher', label: 'Crafting Teacher' },
            { actorId: 'mainland_market_trader', label: 'Crossing Trader' },
            { actorId: 'mainland_painter', label: 'Painter' },
            { actorId: 'mainland_quarry_foreman', label: 'Quarry Foreman' },
            { actorId: 'mainland_road_scavenger', label: 'Road Scavenger' },
            { actorId: 'mainland_rune_tutor', label: 'Rune Tutor' },
            { actorId: 'mainland_combination_sage', label: 'Combination Sage' },
            { actorId: 'enemy_training_dummy', label: 'Training Dummy' },
            { actorId: 'enemy_goblin_grunt', label: 'Goblin Grunt' },
            { actorId: 'enemy_guard', label: 'Guard' },
            { actorId: 'enemy_heavy_brute', label: 'Heavy Brute' },
            { actorId: 'enemy_fast_striker', label: 'Fast Striker' }
        ]
    };
})();
