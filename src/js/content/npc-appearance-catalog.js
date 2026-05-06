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

    const PRESETS = {
        tutorial_guide: buildTutorialGuidePreset(),
        tutorial_woodcutting_instructor: buildTutorialWoodcuttingInstructorPreset(),
        tutorial_fishing_instructor: buildTutorialFishingInstructorPreset(),
        tutorial_firemaking_instructor: buildTutorialFiremakingInstructorPreset(),
        tutorial_mining_smithing_instructor: buildTutorialMiningSmithingInstructorPreset()
    };

    window.NpcAppearanceCatalog = {
        presets: PRESETS,
        aliases: {},
        previewActors: [
            { actorId: 'tutorial_guide', label: 'Tutorial Guide' },
            { actorId: 'tutorial_woodcutting_instructor', label: 'Woodcutting Instructor' },
            { actorId: 'tutorial_fishing_instructor', label: 'Fishing Instructor' },
            { actorId: 'tutorial_firemaking_instructor', label: 'Firemaking Instructor' },
            { actorId: 'tutorial_mining_smithing_instructor', label: 'Mining and Smithing Instructor' }
        ]
    };
})();
