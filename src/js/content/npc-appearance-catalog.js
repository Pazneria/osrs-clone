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
        tutorial_bank_tutor: buildTutorialBankTutorPreset()
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
            { actorId: 'tutorial_bank_tutor', label: 'Bank Tutor' }
        ]
    };
})();
