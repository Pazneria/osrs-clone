(function () {
    function getContext(options = {}) {
        return options.context || options || {};
    }

    function callNumber(context, name, fallback = 0, ...args) {
        const fn = context && context[name];
        if (typeof fn !== 'function') return fallback;
        const value = fn(...args);
        return Number.isFinite(value) ? value : fallback;
    }

    function callBoolean(context, name, fallback = false, ...args) {
        const fn = context && context[name];
        if (typeof fn !== 'function') return fallback;
        return !!fn(...args);
    }

    function getTutorialExitStep(context) {
        return Number.isFinite(context.tutorialExitStep) ? Math.max(0, Math.floor(context.tutorialExitStep)) : 7;
    }

    function getMainOverworldWorldId(context) {
        return typeof context.mainOverworldWorldId === 'string' && context.mainOverworldWorldId
            ? context.mainOverworldWorldId
            : 'main_overworld';
    }

    function getTutorialActiveBounds(context) {
        const bounds = context.tutorialActiveBounds || {};
        return {
            xMin: Number.isFinite(bounds.xMin) ? Math.floor(bounds.xMin) : 0,
            xMax: Number.isFinite(bounds.xMax) ? Math.floor(bounds.xMax) : 0,
            yMin: Number.isFinite(bounds.yMin) ? Math.floor(bounds.yMin) : 0,
            yMax: Number.isFinite(bounds.yMax) ? Math.floor(bounds.yMax) : 0,
            z: Number.isFinite(bounds.z) ? Math.floor(bounds.z) : 0
        };
    }

    function clonePoint(point) {
        return {
            x: Number.isFinite(point && point.x) ? Math.floor(point.x) : 0,
            y: Number.isFinite(point && point.y) ? Math.floor(point.y) : 0,
            z: Number.isFinite(point && point.z) ? Math.floor(point.z) : 0
        };
    }

    const TUTORIAL_WORLD_COORD_SCALE = (648 / 486) * 0.8;
    const TUTORIAL_LEGACY_WORLD_CENTER = 486 / 2;
    const TUTORIAL_EXPANDED_WORLD_CENTER = 648 / 2;
    const TUTORIAL_START_CABIN_RAW_BOUNDS = Object.freeze({
        xMin: 132,
        xMax: 144,
        yMin: 166,
        yMax: 178,
        z: 0,
        dx: 74,
        dy: 76
    });

    function scaleTutorialAxis(value) {
        return Math.round(TUTORIAL_EXPANDED_WORLD_CENTER + ((value - TUTORIAL_LEGACY_WORLD_CENTER) * TUTORIAL_WORLD_COORD_SCALE));
    }

    function remapTutorialSurfacePoint(x, y, z = 0) {
        const safeX = Number.isFinite(x) ? x : 0;
        const safeY = Number.isFinite(y) ? y : 0;
        const safeZ = Number.isFinite(z) ? Math.floor(z) : 0;
        const cabin = TUTORIAL_START_CABIN_RAW_BOUNDS;
        if (safeZ === cabin.z
            && safeX >= cabin.xMin
            && safeX <= cabin.xMax
            && safeY >= cabin.yMin
            && safeY <= cabin.yMax) {
            return {
                x: safeX + cabin.dx,
                y: safeY + cabin.dy,
                z: safeZ
            };
        }
        return {
            x: scaleTutorialAxis(safeX),
            y: scaleTutorialAxis(safeY),
            z: safeZ
        };
    }

    function isInsideActiveBounds(options = {}, x, y, z) {
        const context = getContext(options);
        const bounds = getTutorialActiveBounds(context);
        return z === bounds.z
            && x >= bounds.xMin
            && x <= bounds.xMax
            && y >= bounds.yMin
            && y <= bounds.yMax;
    }

    function isWalkTileAllowed(options = {}, x, y, z) {
        const context = getContext(options);
        const profile = context.playerProfileState || null;
        if (!callBoolean(context, 'isTutorialWorldActive') || (profile && profile.tutorialCompletedAt)) return true;
        return isInsideActiveBounds({ context }, x, y, z);
    }

    function getRecoverySpawnForStep(options = {}, step) {
        const context = getContext(options);
        const recoverySpawns = Array.isArray(context.tutorialRecoverySpawns) ? context.tutorialRecoverySpawns : [];
        const exitStep = getTutorialExitStep(context);
        const safeStep = Math.max(0, Math.min(exitStep, Math.floor(Number(step) || 0)));
        const spawn = recoverySpawns[safeStep] || recoverySpawns[0] || { x: 0, y: 0, z: 0 };
        return clonePoint(spawn);
    }

    function getTutorialStep(options = {}) {
        const context = getContext(options);
        const profile = context.playerProfileState || null;
        if (!profile || !Number.isFinite(profile.tutorialStep)) return 0;
        return Math.max(0, Math.floor(profile.tutorialStep));
    }

    function hasInventoryItem(context, itemId) {
        return callNumber(context, 'getInventoryItemCount', 0, itemId) > 0;
    }

    function hasAvailableItem(context, itemId) {
        return hasInventoryItem(context, itemId) || callNumber(context, 'getEquipmentItemCount', 0, itemId) > 0;
    }

    const TUTORIAL_GUIDANCE_NPC_TARGETS = Object.freeze({
        0: Object.freeze({
            markerId: 'tutorial:step0:tutorial_guide',
            label: 'Talk to the Tutorial Guide',
            spawnId: 'npc:tutorial_guide',
            dialogueId: 'tutorial_guide',
            name: 'Tutorial Guide',
            x: 141,
            y: 177,
            z: 0,
            heightOffset: 2.55
        }),
        1: Object.freeze({
            markerId: 'tutorial:step1:woodcutting_instructor',
            label: 'Talk to the Woodcutting Instructor',
            spawnId: 'npc:tutorial_woodcutting_instructor',
            dialogueId: 'tutorial_woodcutting_instructor',
            name: 'Woodcutting Instructor',
            x: 250,
            y: 212,
            z: 0,
            heightOffset: 2.55
        }),
        2: Object.freeze({
            markerId: 'tutorial:step2:fishing_instructor',
            label: 'Talk to the Fishing Instructor',
            spawnId: 'npc:tutorial_fishing_instructor',
            dialogueId: 'tutorial_fishing_instructor',
            name: 'Fishing Instructor',
            x: 274,
            y: 240,
            z: 0,
            heightOffset: 2.55
        }),
        3: Object.freeze({
            markerId: 'tutorial:step3:firemaking_instructor',
            label: 'Talk to the Firemaking Instructor',
            spawnId: 'npc:tutorial_firemaking_instructor',
            dialogueId: 'tutorial_firemaking_instructor',
            name: 'Firemaking Instructor',
            x: 288,
            y: 248,
            z: 0,
            heightOffset: 2.55
        }),
        4: Object.freeze({
            markerId: 'tutorial:step4:mining_smithing_instructor',
            label: 'Talk to the Mining and Smithing Instructor',
            spawnId: 'npc:tutorial_mining_smithing_instructor',
            dialogueId: 'tutorial_mining_smithing_instructor',
            name: 'Mining and Smithing Instructor',
            x: 338,
            y: 292,
            z: 0,
            heightOffset: 2.55
        }),
        5: Object.freeze({
            markerId: 'tutorial:step5:combat_instructor',
            label: 'Talk to the Combat Instructor',
            spawnId: 'npc:tutorial_combat_instructor',
            dialogueId: 'tutorial_combat_instructor',
            name: 'Combat Instructor',
            x: 320,
            y: 326,
            z: 0,
            heightOffset: 2.55
        }),
        6: Object.freeze({
            markerId: 'tutorial:step6:ranged_instructor',
            label: 'Talk to the Ranged Instructor',
            spawnId: 'npc:tutorial_ranged_instructor',
            dialogueId: 'tutorial_ranged_instructor',
            name: 'Ranged Instructor',
            x: 340,
            y: 320,
            z: 0,
            heightOffset: 2.55
        }),
        7: Object.freeze({
            markerId: 'tutorial:step7:magic_instructor',
            label: 'Talk to the Magic Instructor',
            spawnId: 'npc:tutorial_magic_instructor',
            dialogueId: 'tutorial_magic_instructor',
            name: 'Magic Instructor',
            x: 292,
            y: 336,
            z: 0,
            heightOffset: 2.55
        }),
        8: Object.freeze({
            markerId: 'tutorial:step8:runecrafting_instructor',
            label: 'Talk to the Runecrafting Instructor',
            spawnId: 'npc:tutorial_runecrafting_instructor',
            dialogueId: 'tutorial_runecrafting_instructor',
            name: 'Runecrafting Instructor',
            x: 246,
            y: 340,
            z: 0,
            heightOffset: 2.55
        }),
        9: Object.freeze({
            markerId: 'tutorial:step9:crafting_instructor',
            label: 'Talk to the Crafting Instructor',
            spawnId: 'npc:tutorial_crafting_instructor',
            dialogueId: 'tutorial_crafting_instructor',
            name: 'Crafting Instructor',
            x: 218,
            y: 336,
            z: 0,
            heightOffset: 2.55
        }),
        10: Object.freeze({
            markerId: 'tutorial:step10:bank_tutor',
            label: 'Talk to the Bank Tutor',
            spawnId: 'npc:tutorial_bank_tutor',
            dialogueId: 'tutorial_bank_tutor',
            name: 'Bank Tutor',
            x: 202,
            y: 330,
            z: 0,
            heightOffset: 2.55
        }),
        11: Object.freeze({
            markerId: 'tutorial:step11:exit_guide',
            label: 'Talk to the Tutorial Guide',
            spawnId: 'npc:tutorial_exit_guide',
            dialogueId: 'tutorial_guide',
            name: 'Tutorial Guide',
            x: 250,
            y: 334,
            z: 0,
            heightOffset: 2.55
        })
    });

    function getTutorialInstructorVisits(profile) {
        if (!profile || !profile.tutorialInstructorVisits || typeof profile.tutorialInstructorVisits !== 'object') return {};
        return profile.tutorialInstructorVisits;
    }

    function hasVisitedTutorialStepNpc(context, step) {
        const profile = context.playerProfileState || null;
        const visits = getTutorialInstructorVisits(profile);
        return visits[String(Math.max(0, Math.floor(Number(step) || 0)))] === true;
    }

    function markVisitedTutorialStepNpc(context, step) {
        const profile = context.playerProfileState || null;
        if (!profile) return false;
        const safeStep = Math.max(0, Math.floor(Number(step) || 0));
        const key = String(safeStep);
        const visits = getTutorialInstructorVisits(profile);
        if (visits[key] === true) return false;
        profile.tutorialInstructorVisits = Object.assign({}, visits, { [key]: true });
        if (typeof context.saveProgressToStorage === 'function') context.saveProgressToStorage('tutorial_instructor_visit');
        return true;
    }

    function normalizeTutorialDialogueId(value) {
        return typeof value === 'string' ? value.trim().toLowerCase() : '';
    }

    function markCurrentTutorialNpcVisit(context, dialogueId, step) {
        const target = TUTORIAL_GUIDANCE_NPC_TARGETS[Math.max(0, Math.floor(Number(step) || 0))];
        if (!target || step <= 0 || step >= getTutorialExitStep(context)) return false;
        if (normalizeTutorialDialogueId(dialogueId) !== normalizeTutorialDialogueId(target.dialogueId)) return false;
        return markVisitedTutorialStepNpc(context, step);
    }

    function attachGuidanceNpcTarget(marker, target) {
        if (!marker || !target) return marker;
        marker.targetNpcSpawnId = target.spawnId;
        marker.targetNpcDialogueId = target.dialogueId;
        marker.targetNpcName = target.name;
        return marker;
    }

    function makeGuidanceMarker(markerId, label, targetKind, x, y, z = 0, heightOffset = 2.35, target = null) {
        const point = remapTutorialSurfacePoint(x, y, z);
        const marker = {
            markerId,
            label,
            targetKind,
            x: point.x,
            y: point.y,
            z: point.z,
            heightOffset
        };
        return targetKind === 'npc' ? attachGuidanceNpcTarget(marker, target) : marker;
    }

    function makeNpcGuidanceMarker(step, labelOverride = null) {
        const target = TUTORIAL_GUIDANCE_NPC_TARGETS[step];
        if (!target) return null;
        return makeGuidanceMarker(
            target.markerId,
            labelOverride || target.label,
            'npc',
            target.x,
            target.y,
            target.z,
            target.heightOffset,
            target
        );
    }

    function getGuidanceMarker(options = {}) {
        const context = getContext(options);
        const profile = context.playerProfileState || null;
        if (!callBoolean(context, 'isTutorialWorldActive') || (profile && profile.tutorialCompletedAt)) return null;

        const step = getTutorialStep({ context });
        const exitStep = getTutorialExitStep(context);
        const hasLogs = hasInventoryItem(context, 'logs');
        const hasRawShrimp = hasInventoryItem(context, 'raw_shrimp');
        const hasCookedOrBurntShrimp = hasInventoryItem(context, 'cooked_shrimp')
            || hasInventoryItem(context, 'burnt_shrimp');
        const hasCopperOre = hasInventoryItem(context, 'copper_ore');
        const hasTinOre = hasInventoryItem(context, 'tin_ore');
        const bronzeBarCount = callNumber(context, 'getInventoryItemCount', 0, 'bronze_bar');
        const hasBronzeBar = bronzeBarCount > 0;
        const hasBronzeSwordBlade = hasInventoryItem(context, 'bronze_sword_blade');
        const hasWoodenHandleStrapped = hasInventoryItem(context, 'wooden_handle_strapped');
        const hasBronzeSword = hasAvailableItem(context, 'bronze_sword');
        const hasBronzeArrowheads = hasInventoryItem(context, 'bronze_arrowheads');
        const hasNormalShortbow = hasAvailableItem(context, 'normal_shortbow');
        const hasNormalShortbowUnstrung = hasInventoryItem(context, 'normal_shortbow_u');
        const hasBronzeArrows = hasAvailableItem(context, 'bronze_arrows');
        const hasWoodenHeadlessArrows = hasInventoryItem(context, 'wooden_headless_arrows');
        const hasRangedKit = hasNormalShortbow && hasBronzeArrows;
        const hasCombatPractice = callNumber(context, 'getSkillXp', 0, 'attack') > 0
            || callNumber(context, 'getSkillXp', 0, 'strength') > 0
            || callNumber(context, 'getSkillXp', 0, 'defense') > 0;
        const hasRangedPractice = callNumber(context, 'getSkillXp', 0, 'ranged') > 0;
        const hasMagicPractice = callNumber(context, 'getSkillXp', 0, 'magic') > 0;
        const hasRunecraftingPractice = callNumber(context, 'getSkillXp', 0, 'runecrafting') > 0;
        const hasSoftClay = hasInventoryItem(context, 'soft_clay');
        const hasCraftingMouldPractice = callNumber(context, 'getSkillXp', 0, 'crafting') >= 2
            || hasInventoryItem(context, 'imprinted_ring_mould')
            || hasInventoryItem(context, 'ring_mould');
        const depositSource = profile && typeof profile.tutorialBankDepositSource === 'string'
            ? profile.tutorialBankDepositSource
            : '';
        const withdrawSource = profile && typeof profile.tutorialBankWithdrawSource === 'string'
            ? profile.tutorialBankWithdrawSource
            : '';

        if (step <= 0) {
            return makeNpcGuidanceMarker(0);
        }

        if (step === 1) {
            if (hasLogs) {
                return makeNpcGuidanceMarker(1, 'Return to the Woodcutting Instructor');
            }
            if (!hasVisitedTutorialStepNpc(context, 1)) return makeNpcGuidanceMarker(1);
            return makeGuidanceMarker(
                'tutorial:step1:tutorial_tree',
                'Cut a tree for logs',
                'resource',
                248,
                196,
                0,
                3.25
            );
        }

        if (step === 2) {
            if (hasRawShrimp || hasCookedOrBurntShrimp) {
                return makeNpcGuidanceMarker(2, 'Return to the Fishing Instructor');
            }
            if (!hasVisitedTutorialStepNpc(context, 2)) return makeNpcGuidanceMarker(2);
            return makeGuidanceMarker(
                'tutorial:step2:pond',
                'Fish at the pond',
                'water',
                262,
                237,
                0,
                1.15
            );
        }

        if (step === 3) {
            if (hasCookedOrBurntShrimp) {
                return makeNpcGuidanceMarker(3, 'Report to the Firemaking Instructor');
            }
            if (!hasVisitedTutorialStepNpc(context, 3)) return makeNpcGuidanceMarker(3);
            if (hasRawShrimp) {
                return makeGuidanceMarker(
                    'tutorial:step3:fire_clearing',
                    'Light a fire and cook the shrimp',
                    'station',
                    282,
                    246,
                    0,
                    1.35
                );
            }
            return makeGuidanceMarker(
                'tutorial:step3:pond_recovery',
                'Catch raw shrimp at the pond',
                'water',
                262,
                237,
                0,
                1.15
            );
        }

        if (step === 4) {
            if (hasBronzeSword && hasBronzeArrowheads) {
                return makeNpcGuidanceMarker(4, 'Report to the Mining and Smithing Instructor');
            }
            if (hasBronzeSwordBlade && hasWoodenHandleStrapped) {
                return makeGuidanceMarker(
                    'tutorial:step4:assemble_bronze_sword',
                    'Use the sword blade on the strapped handle',
                    'inventory',
                    338,
                    292,
                    0,
                    2.0
                );
            }
            if (hasBronzeSword && !hasBronzeArrowheads) {
                if (hasBronzeBar) {
                    return makeGuidanceMarker(
                        'tutorial:step4:anvil_arrowheads',
                        'Choose Bronze Arrowheads at the anvil',
                        'station',
                        350,
                        300,
                        0,
                        1.8
                    );
                }
                if (hasCopperOre && hasTinOre) {
                    return makeGuidanceMarker(
                        'tutorial:step4:furnace_arrowheads',
                        'Smelt one bronze bar for arrowheads',
                        'station',
                        344,
                        296,
                        0,
                        2.0
                    );
                }
                return makeGuidanceMarker(
                    'tutorial:step4:quarry_arrowheads',
                    'Mine copper and tin for arrowheads',
                    'resource',
                    358,
                    286,
                    0,
                    1.85
                );
            }
            if (!hasVisitedTutorialStepNpc(context, 4)) return makeNpcGuidanceMarker(4);
            if (bronzeBarCount >= 2) {
                return makeGuidanceMarker(
                    'tutorial:step4:anvil',
                    'Choose Bronze Sword Blade at the anvil',
                    'station',
                    350,
                    300,
                    0,
                    1.8
                );
            }
            if (hasCopperOre && hasTinOre) {
                return makeGuidanceMarker(
                    'tutorial:step4:furnace',
                    'Smelt three bronze bars at the furnace',
                    'station',
                    344,
                    296,
                    0,
                    2.0
                );
            }
            return makeGuidanceMarker(
                'tutorial:step4:quarry',
                'Mine copper and tin ore for three bronze bars',
                'resource',
                358,
                286,
                0,
                1.85
            );
        }

        if (step === 5) {
            if (hasCombatPractice) {
                return makeNpcGuidanceMarker(5, 'Report to the Combat Instructor');
            }
            if (!hasVisitedTutorialStepNpc(context, 5)) return makeNpcGuidanceMarker(5);
            return makeGuidanceMarker(
                'tutorial:step5:chicken',
                'Fight a chicken',
                'enemy',
                326,
                332,
                0,
                2.0
            );
        }

        if (step === 6) {
            if (hasRangedPractice) {
                return makeNpcGuidanceMarker(6, 'Report to the Ranged Instructor');
            }
            if (!hasVisitedTutorialStepNpc(context, 6)) return makeNpcGuidanceMarker(6);
            if (!hasNormalShortbow && hasNormalShortbowUnstrung) {
                return makeGuidanceMarker(
                    'tutorial:step6:string_shortbow',
                    'Use bow string on the unstrung shortbow',
                    'inventory',
                    340,
                    320,
                    0,
                    2.0
                );
            }
            if (!hasBronzeArrows && hasBronzeArrowheads && hasWoodenHeadlessArrows) {
                return makeGuidanceMarker(
                    'tutorial:step6:finish_bronze_arrows',
                    'Use bronze arrowheads on headless arrows',
                    'inventory',
                    340,
                    320,
                    0,
                    2.0
                );
            }
            if (!hasRangedKit) return makeNpcGuidanceMarker(6, 'Finish your bow and arrows');
            return makeGuidanceMarker(
                'tutorial:step6:ranged_chicken',
                'Shoot a chicken from range',
                'enemy',
                326,
                332,
                0,
                2.0
            );
        }

        if (step === 7) {
            if (hasMagicPractice) {
                return makeNpcGuidanceMarker(7, 'Report to the Magic Instructor');
            }
            if (!hasVisitedTutorialStepNpc(context, 7)) return makeNpcGuidanceMarker(7);
            return makeGuidanceMarker(
                'tutorial:step7:magic_chicken',
                'Cast ember magic at a chicken',
                'enemy',
                326,
                332,
                0,
                2.0
            );
        }

        if (step === 8) {
            if (hasRunecraftingPractice) {
                return makeNpcGuidanceMarker(8, 'Report to the Runecrafting Instructor');
            }
            if (!hasVisitedTutorialStepNpc(context, 8)) return makeNpcGuidanceMarker(8);
            return makeGuidanceMarker(
                'tutorial:step8:ember_altar',
                'Craft ember runes at the altar',
                'station',
                236,
                342,
                0,
                1.8
            );
        }

        if (step === 9) {
            if (hasCraftingMouldPractice) {
                return makeNpcGuidanceMarker(9, 'Report to the Crafting Instructor');
            }
            if (!hasVisitedTutorialStepNpc(context, 9)) return makeNpcGuidanceMarker(9);
            if (hasSoftClay) {
                return makeGuidanceMarker(
                    'tutorial:step9:crafting_bench',
                    'Use soft clay on the borrowed ring at the bench',
                    'station',
                    222,
                    336,
                    0,
                    1.6
                );
            }
            return makeGuidanceMarker(
                'tutorial:step9:pond_soft_clay',
                    'Use clay on the pond water',
                'water',
                262,
                237,
                0,
                1.15
            );
        }

        if (step === 10) {
            if (callBoolean(context, 'hasTutorialBankProof')) {
                return makeNpcGuidanceMarker(10, 'Report to the Bank Tutor');
            }
            if (!hasVisitedTutorialStepNpc(context, 10)) return makeNpcGuidanceMarker(10);
            if (depositSource && !withdrawSource) {
                return makeGuidanceMarker(
                    'tutorial:step10:bank_withdraw',
                    'Withdraw the coin from the other bank booth',
                    'station',
                    208,
                    324,
                    0,
                    1.75
                );
            }
            return makeGuidanceMarker(
                'tutorial:step10:bank_deposit',
                'Deposit the coin at a bank booth',
                'station',
                184,
                322,
                0,
                1.75
            );
        }

        if (step >= exitStep) {
            return makeNpcGuidanceMarker(exitStep);
        }

        return null;
    }

    function setTutorialStep(options = {}, step, reason = 'tutorial_progress') {
        const context = getContext(options);
        const profile = context.playerProfileState || null;
        if (!profile) return 0;
        const nextStep = Math.max(0, Math.min(getTutorialExitStep(context), Math.floor(Number(step) || 0)));
        if (!Number.isFinite(profile.tutorialStep) || profile.tutorialStep < nextStep) {
            profile.tutorialStep = nextStep;
            if (typeof context.saveProgressToStorage === 'function') context.saveProgressToStorage(reason);
            if (typeof context.refreshTutorialGateStates === 'function') context.refreshTutorialGateStates();
        }
        return getTutorialStep({ context });
    }

    function recordTutorialBankAction(options = {}, kind, sourceKey, itemId, amountChanged) {
        const context = getContext(options);
        const profile = context.playerProfileState || null;
        if (!callBoolean(context, 'isTutorialWorldActive') || !profile || getTutorialStep({ context }) !== 10) return false;
        if (itemId !== 'coins' || !Number.isFinite(amountChanged) || amountChanged <= 0) return false;
        const safeSourceKey = typeof sourceKey === 'string' && sourceKey ? sourceKey : 'unknown_bank';
        if (kind === 'deposit') {
            profile.tutorialBankDepositSource = safeSourceKey;
            profile.tutorialBankWithdrawSource = null;
            if (typeof context.saveProgressToStorage === 'function') context.saveProgressToStorage('tutorial_bank_deposit');
            return true;
        }
        if (kind === 'withdraw') {
            const depositSource = typeof profile.tutorialBankDepositSource === 'string'
                ? profile.tutorialBankDepositSource
                : '';
            if (depositSource && depositSource !== safeSourceKey) {
                profile.tutorialBankWithdrawSource = safeSourceKey;
                if (typeof context.saveProgressToStorage === 'function') context.saveProgressToStorage('tutorial_bank_withdraw');
                return true;
            }
        }
        return false;
    }

    function makeTutorialTextOption(label, response) {
        return { kind: 'text', label, response };
    }

    function ensureTutorialItems(context, items = []) {
        if (typeof context.ensureTutorialItem !== 'function') return;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            context.ensureTutorialItem(item.itemId, item.amount || 1);
        }
    }

    function makeTutorialStepOption(context, label, response, step, items = [], reason = 'tutorial_progress') {
        return {
            kind: 'tutorial',
            label,
            onSelect: ({ refreshDialogue }) => {
                ensureTutorialItems(context, items);
                setTutorialStep({ context }, step, reason);
                if (typeof refreshDialogue === 'function') {
                    return { refresh: true, bodyText: response };
                }
                return { bodyText: response };
            }
        };
    }

    function makeTutorialCheckOption(context, label, response, check, nextStep, missingResponse, items = []) {
        return {
            kind: 'tutorial',
            label,
            onSelect: ({ refreshDialogue }) => {
                ensureTutorialItems(context, items);
                if (typeof check === 'function' && check()) {
                    setTutorialStep({ context }, nextStep);
                    return { refresh: true, bodyText: response };
                }
                if (typeof refreshDialogue === 'function') {
                    return { refresh: true, bodyText: missingResponse };
                }
                return { bodyText: missingResponse };
            }
        };
    }

    function makeTutorialTravelOption(context) {
        return {
            kind: 'travel',
            label: 'Leave for Starter Town',
            travelToWorldId: getMainOverworldWorldId(context),
            travelSpawn: { x: 205, y: 210, z: 0 }
        };
    }

    function buildNpcDialogueView(options = {}, npc, baseView) {
        const context = getContext(options);
        if (!callBoolean(context, 'isTutorialWorldActive')) return null;
        const dialogueId = npc && typeof npc.dialogueId === 'string' ? npc.dialogueId.trim() : '';
        const nameKey = npc && typeof npc.name === 'string' ? npc.name.trim().toLowerCase() : '';
        const step = getTutorialStep({ context });
        const exitStep = getTutorialExitStep(context);
        const hasLogs = callNumber(context, 'getInventoryItemCount', 0, 'logs') > 0;
        const hasRawShrimp = callNumber(context, 'getInventoryItemCount', 0, 'raw_shrimp') > 0;
        const hasCookedOrBurntShrimp = callNumber(context, 'getInventoryItemCount', 0, 'cooked_shrimp') > 0
            || callNumber(context, 'getInventoryItemCount', 0, 'burnt_shrimp') > 0;
        const bronzeBarCount = callNumber(context, 'getInventoryItemCount', 0, 'bronze_bar');
        const hasBronzeBar = bronzeBarCount > 0;
        const hasBronzeSwordBlade = callNumber(context, 'getInventoryItemCount', 0, 'bronze_sword_blade') > 0;
        const hasWoodenHandleStrapped = callNumber(context, 'getInventoryItemCount', 0, 'wooden_handle_strapped') > 0;
        const hasBronzeSword = hasAvailableItem(context, 'bronze_sword');
        const hasBronzeArrowheads = callNumber(context, 'getInventoryItemCount', 0, 'bronze_arrowheads') > 0;
        const hasNormalShortbow = hasAvailableItem(context, 'normal_shortbow');
        const hasBronzeArrows = hasAvailableItem(context, 'bronze_arrows');
        const hasCombatPractice = callNumber(context, 'getSkillXp', 0, 'attack') > 0
            || callNumber(context, 'getSkillXp', 0, 'strength') > 0
            || callNumber(context, 'getSkillXp', 0, 'defense') > 0;
        const hasRangedPractice = callNumber(context, 'getSkillXp', 0, 'ranged') > 0;
        const hasMagicPractice = callNumber(context, 'getSkillXp', 0, 'magic') > 0;
        const hasRunecraftingPractice = callNumber(context, 'getSkillXp', 0, 'runecrafting') > 0;
        const hasSoftClay = callNumber(context, 'getInventoryItemCount', 0, 'soft_clay') > 0;
        const hasCraftingMouldPractice = callNumber(context, 'getSkillXp', 0, 'crafting') >= 2
            || callNumber(context, 'getInventoryItemCount', 0, 'imprinted_ring_mould') > 0
            || callNumber(context, 'getInventoryItemCount', 0, 'ring_mould') > 0;
        const miningStarted = callNumber(context, 'getInventoryItemCount', 0, 'copper_ore') > 0
            || callNumber(context, 'getInventoryItemCount', 0, 'tin_ore') > 0
            || hasBronzeBar
            || hasBronzeSwordBlade
            || hasBronzeSword;
        markCurrentTutorialNpcVisit(context, dialogueId, step);

        if (dialogueId === 'tutorial_guide' || nameKey === 'tutorial guide') {
            if (step >= exitStep) {
                return {
                    title: 'Tutorial Guide',
                    greeting: [
                        'You have done well, traveler. You gathered, cooked, worked metal, practiced melee and ranged, handled runes and crafting materials, and used a bank.',
                        'Starter Town is waiting when you are ready. It is larger than this island, but the same rule holds: look around, right-click when you are unsure, and take one task at a time.'
                    ],
                    options: [
                        makeTutorialTextOption('Ask about what comes next', [
                            'Starter Town has shops, trainers, banks, and longer roads. Nobody expects you to memorize it all on your first visit.',
                            'Start near the square, talk to people with names, and keep a few useful tools in your pack. If something looks important, right-click it and read the actions.',
                            'You will find better resources and longer goals out there, but the loops you learned here will carry you through the first day.'
                        ]),
                        makeTutorialTravelOption(context),
                        { kind: 'close', label: 'Stay on the island' }
                    ]
                };
            }
            if (step === 0) {
                return {
                    title: 'Tutorial Guide',
                    greeting: [
                        'Welcome, traveler! You made it to Tutorial Island.',
                        'This little arrival cabin is where new adventurers get their bearings before stepping out into the island.',
                        'I will walk you through the basics one piece at a time. Movement first, then tools, gathering, cooking, metalwork, combat, ranged, magic, runes, crafting, banking, and finally the road to Starter Town.'
                    ],
                    options: [
                        makeTutorialTextOption('Ask about movement', [
                            'Left-click the ground to walk there. Your adventurer will try to find a path if the way is clear.',
                            'Right-click people, doors, trees, fishing spots, rocks, and objects to see more actions. That menu is how you choose exactly what you want to do.',
                            'If a lesson says to use one thing on another, open your inventory, choose Use on the first item, then click the target in the world or in your inventory.'
                        ]),
                        makeTutorialTextOption('Ask about the island', [
                            'Tutorial Island is a guided route for first-time adventurers. Each instructor covers one basic skill and then points you to the next stop.',
                            'You will gather wood, catch shrimp, cook food, mine ore, smith metal, try safe combat and ranged practice, learn why magic needs runes, craft simple material, use the bank, and then leave for Starter Town.',
                            'There is no rush. Talk to the instructor nearby, try the task they give you, then come back when you have done it.'
                        ]),
                        makeTutorialTextOption('Ask about the axe', [
                            'The axe is your first tool because woodcutting is the simplest resource loop: carry the tool, use it on a tree, keep the logs, then report back.',
                            'I will give you a bronze axe when you are ready. Keep it in your inventory and take it to the grove just outside.',
                            'The Woodcutting Instructor will show you how to cut your first logs before you move on.'
                        ]),
                        makeTutorialStepOption(
                            context,
                            'I am ready',
                            [
                                'Splendid. I have put a bronze axe in your pack and unlocked the cabin door.',
                                'Step outside, follow the dirt path to the grove, and speak with the Woodcutting Instructor before chopping any trees.',
                                'They will help you turn that axe into your first logs. After that, each instructor will take you a little farther.',
                                'Good luck, traveler, and welcome to the world.'
                            ],
                            1,
                            [{ itemId: 'bronze_axe', amount: 1 }],
                            'tutorial_arrival_welcome'
                        )
                    ]
                };
            }
            return {
                title: 'Tutorial Guide',
                greeting: step === 1
                    ? [
                        'The arrival cabin door is unlocked now.',
                        'Follow the dirt path to the grove and speak with the Woodcutting Instructor before chopping trees. They are expecting you.'
                    ]
                    : step >= 4
                    ? [
                        'You are doing well. Keep following the instructors in order and the island will make sense one step at a time.',
                        'The quarry, forge, combat yard, advanced skill yard, bank, and exit are all ahead on the same route.'
                    ]
                    : [
                        'Keep moving through the island stations in order. Each instructor is there to teach one practical thing.',
                        'When you finish the current task, talk to the instructor again and they will point you onward.'
                    ],
                options: [
                    makeTutorialTextOption('Ask what to do', step >= 4
                        ? [
                            'Keep following the instructor route if you have not finished it yet.',
                            'Mine copper and tin, smelt a bronze bar at the furnace, then forge it at the anvil.',
                            'After that, the path takes you through melee, ranged, magic, runecrafting, crafting, the bank, and the exit.'
                        ]
                        : step === 1
                        ? [
                            'Open the cabin door if it is still closed, then follow the dirt path to the grove.',
                            'Talk to the Woodcutting Instructor before chopping trees. They are the next person you need.'
                        ]
                        : [
                            'Follow the island route through woodcutting, fishing, then firemaking and cooking.',
                            'Each instructor checks one practical step. If you feel stuck, talk to the nearest instructor again.'
                        ]),
                    { kind: 'close', label: 'Goodbye' }
                ]
            };
        }

        if (dialogueId === 'tutorial_woodcutting_instructor' || nameKey === 'woodcutting instructor') {
            if (step <= 1 && typeof context.ensureTutorialItem === 'function') context.ensureTutorialItem('bronze_axe', 1);
            const options = [
                makeTutorialTextOption('Ask about chopping', [
                    'Keep the bronze axe in your inventory and use it on a normal tree. You can left-click the tree, or right-click it if you want to choose the action yourself.',
                    'When the cut succeeds, logs go into your inventory and the tree becomes a stump for a short while.',
                    'That is the first lesson of the island: tools turn the world around you into resources you can carry and use.'
                ])
            ];
            if (step <= 1) {
                options.push(makeTutorialCheckOption(
                    context,
                    'I have cut some logs',
                    [
                        'Well done. Those logs are your first gathered resource, and they will matter again in a moment.',
                        'Follow the footpath to the pond and speak with the Fishing Instructor. The next part of the Survival Field teaches gathering from water.'
                    ],
                    () => hasLogs,
                    2,
                    [
                        'Not yet. Choose one of the normal trees around the grove and chop until logs appear in your inventory.',
                        'If a tree turns into a stump, just use another tree nearby or wait for it to regrow.'
                    ],
                    [{ itemId: 'bronze_axe', amount: 1 }]
                ));
            } else {
                options.push(makeTutorialTextOption('Ask about the next station', 'You are done with the grove for now. The Fishing Instructor is by the pond just down the footpath.'));
            }
            options.push({ kind: 'close', label: 'Goodbye' });
            return {
                title: 'Woodcutting Instructor',
                greeting: step <= 1
                    ? [
                        'Welcome to the grove. These trees are your first renewable resource: cut one, take the logs, and the stump will grow back.',
                        'Take your time, keep the axe in your pack, and come back once you have cut a set of logs.'
                    ]
                    : 'The grove is for gathering. Once you have logs, the pond and fire clearing show you how resources work together.',
                options
            };
        }

        if (dialogueId === 'tutorial_fishing_instructor' || nameKey === 'fishing instructor') {
            if (step === 2 && typeof context.ensureTutorialItem === 'function') context.ensureTutorialItem('small_net', 1);
            const options = [
                makeTutorialTextOption('Ask about fishing', [
                    'Fishing is gathering from water. I have given you a small net so you can work from the pond edge.',
                    'Stand close to the water and use the net on the pond, or right-click the pond and choose the fishing action. Keep trying until raw shrimp appears in your inventory.',
                    'Bring the catch back. You will cook it at the fire clearing next.'
                ])
            ];
            if (step < 2) {
                options.push(makeTutorialTextOption('Ask what to do', 'Finish the grove first. Cut logs and speak to the Woodcutting Instructor, then the pond lesson begins.'));
            } else if (step === 2) {
                options.push(makeTutorialCheckOption(
                    context,
                    'I caught a fish',
                    [
                        'Nice catch. Raw shrimp is food, but it is not ready to eat yet.',
                        'Take it to the fire clearing. The next instructor will show you how logs and food work together.'
                    ],
                    () => hasRawShrimp || hasCookedOrBurntShrimp,
                    3,
                    'Use the small net on the pond until you catch raw shrimp. Stay close to the water edge and try again if the first attempt fails.',
                    [{ itemId: 'small_net', amount: 1 }]
                ));
            } else {
                options.push(makeTutorialTextOption('Ask about the next station', 'You are done at the pond. Take your fish to the fire clearing if you have not cooked it yet.'));
            }
            options.push({ kind: 'close', label: 'Goodbye' });
            return {
                title: 'Fishing Instructor',
                greeting: step < 2
                    ? 'The pond is part of the Survival Field, but the grove comes first.'
                    : 'The pond is close for a reason: gather food here, then carry it to your own fire.',
                options
            };
        }

        if (dialogueId === 'tutorial_firemaking_instructor' || nameKey === 'firemaking instructor') {
            if (step === 3 && typeof context.ensureTutorialItem === 'function') {
                context.ensureTutorialItem('tinderbox', 1);
                context.ensureTutorialItem('logs', 1);
            }
            const options = [
                makeTutorialTextOption('Ask about fires and cooking', [
                    'Firemaking spends logs to create a temporary cooking spot. In your inventory, use the tinderbox with the logs while you are standing near this clearing.',
                    'Once the fire is burning, use the raw shrimp on the fire. Cooked shrimp is best, but burnt shrimp still proves you completed the loop.'
                ])
            ];
            if (step < 3) {
                options.push(makeTutorialTextOption('Ask what to do', 'Catch shrimp at the pond first. A fire matters more when you have something to cook.'));
            } else if (step === 3) {
                options.push(makeTutorialCheckOption(
                    context,
                    'I cooked the fish',
                    [
                        'Good. You gathered wood, gathered food, spent the wood, and processed the food.',
                        'That is the Survival Field complete. The quarry and forge yard is open now; follow the path through the next gate.'
                    ],
                    () => hasCookedOrBurntShrimp,
                    4,
                    hasRawShrimp
                        ? 'Use your tinderbox with logs near the clearing, then use the raw shrimp on the fire. Burnt shrimp counts.'
                        : 'You need raw shrimp to cook. Go back to the pond if you lost yours, then return here and light your own fire.',
                    [{ itemId: 'tinderbox', amount: 1 }, { itemId: 'logs', amount: 1 }]
                ));
            } else {
                options.push(makeTutorialTextOption('Ask about the next station', 'You are done here. The Mining and Smithing Instructor is waiting in the quarry and forge yard.'));
            }
            options.push({ kind: 'close', label: 'Goodbye' });
            return {
                title: 'Firemaking Instructor',
                greeting: step < 3
                    ? 'This clearing finishes the Survival Field: logs become fire, and fire turns raw food into something useful.'
                    : 'I will replace your tinderbox or a log if you lost them. Light your own fire, cook the shrimp, then report back.',
                options
            };
        }

        if (dialogueId === 'tutorial_mining_smithing_instructor' || nameKey === 'mining and smithing instructor') {
            if (step === 4 && typeof context.ensureTutorialItem === 'function') {
                context.ensureTutorialItem('bronze_pickaxe', 1);
                context.ensureTutorialItem('hammer', 1);
                context.ensureTutorialItem('wooden_handle_strapped', 1);
            }
            const options = [
                makeTutorialTextOption('Ask about mining and smithing', [
                    'Mine enough copper and tin for three bronze bars. Keep the pickaxe in your inventory while you mine.',
                    'Use the furnace with copper and tin in your inventory and choose Bronze Bar until you have three bars.',
                    'Use the anvil with two bronze bars and the hammer, choose Bronze Sword Blade, then use that blade on the Wooden Handle w/ Strap to assemble a real Bronze Sword.',
                    'Use the last bronze bar at the anvil and choose Bronze Arrowheads. Keep those arrowheads; the Ranged Instructor will use them for the arrow lesson.'
                ])
            ];
            if (step < 4) {
                options.push(makeTutorialTextOption('Ask what to do', 'Finish the fire and cooking lesson first. Metal comes after food.'));
            } else if (step === 4) {
                options.push(makeTutorialCheckOption(
                    context,
                    'I made a sword and arrowheads',
                    'That is the metal loop: mine ore, smelt bars, forge parts, and assemble the finished item. Keep the arrowheads for ranged practice. The chicken pen is open.',
                    () => hasBronzeSword && hasBronzeArrowheads,
                    5,
                    miningStarted
                        ? (hasBronzeSword && !hasBronzeArrowheads
                            ? (hasBronzeBar
                                ? 'Use the remaining bronze bar at the anvil and choose Bronze Arrowheads.'
                                : 'Mine copper and tin, smelt one more bronze bar, then use the anvil and choose Bronze Arrowheads.')
                            : (hasBronzeSwordBlade && hasWoodenHandleStrapped
                            ? 'Use the Bronze Sword Blade on the Wooden Handle w/ Strap in your inventory to assemble the Bronze Sword.'
                            : (bronzeBarCount >= 2
                                ? 'Use the anvil with both bronze bars and choose Bronze Sword Blade, then use the blade on the Wooden Handle w/ Strap.'
                                : 'Keep going: copper plus tin makes bronze bars at the furnace. You need two bronze bars for the Bronze Sword Blade and one more for Bronze Arrowheads.')))
                        : 'Mine enough copper and tin for three bronze bars, use the furnace to make the bars, use the anvil to make a Bronze Sword Blade and Bronze Arrowheads, then assemble the sword with the Wooden Handle w/ Strap.',
                    [
                        { itemId: 'bronze_pickaxe', amount: 1 },
                        { itemId: 'hammer', amount: 1 },
                        { itemId: 'wooden_handle_strapped', amount: 1 }
                    ]
                ));
            } else {
                options.push(makeTutorialTextOption('Ask about the next station', 'You are done here. The Combat Instructor is waiting by the chicken pen.'));
            }
            options.push({ kind: 'close', label: 'Goodbye' });
            return {
                title: 'Mining and Smithing Instructor',
                greeting: step < 4
                    ? 'Metal work waits until you can feed yourself.'
                    : 'Take a pickaxe, hammer, and real strapped handle if you need them. Mine, smelt, forge, assemble, then come back with a Bronze Sword and Bronze Arrowheads.',
                options
            };
        }

        if (dialogueId === 'tutorial_combat_instructor' || nameKey === 'combat instructor') {
            if (step === 5 && typeof context.ensureTutorialItem === 'function') {
                context.ensureTutorialItem('cooked_shrimp', 2);
            }
            const options = [
                makeTutorialTextOption('Ask about melee combat', [
                    'Open your inventory, click the bronze sword you made, and equip it. Your equipment tab will show what you are wearing or wielding.',
                    'Then click a chicken up close, or right-click it and choose Attack. Watch your combat tab, and click cooked shrimp in your inventory if you need to eat.'
                ])
            ];
            if (step < 5) {
                options.push(makeTutorialTextOption('Ask what to do', 'Finish the mining and smithing lesson first. Tools before trouble.'));
            } else if (step === 5) {
                options.push(makeTutorialCheckOption(
                    context,
                    'I fought a chicken',
                    'Good enough for your first day with melee. The ranged target is next, just beyond the gate.',
                    () => hasCombatPractice,
                    6,
                    'Equip the bronze sword you made, fight one of the chickens until you gain a little combat XP, then come back.',
                    [
                        { itemId: 'cooked_shrimp', amount: 2 }
                    ]
                ));
            } else {
                options.push(makeTutorialTextOption('Ask about the next station', 'You are done here. The Ranged Instructor is past the next gate.'));
            }
            options.push({ kind: 'close', label: 'Goodbye' });
            return {
                title: 'Combat Instructor',
                greeting: step < 5
                    ? 'Do the metal work first. Then we will talk about hitting things properly.'
                    : 'Use the sword you made and take a little food if you need it. Equip the sword, fight a chicken up close, then report back.',
                options
            };
        }

        if (dialogueId === 'tutorial_ranged_instructor' || nameKey === 'ranged instructor') {
            if (step === 6 && typeof context.ensureTutorialItem === 'function') {
                context.ensureTutorialItem('normal_shortbow_u', 1);
                context.ensureTutorialItem('bow_string', 1);
                context.ensureTutorialItem('wooden_headless_arrows', 1);
                context.ensureTutorialItem('cooked_shrimp', 2);
            }
            const options = [
                makeTutorialTextOption('Ask about ranged combat', [
                    'First finish the real gear. Use bow string on the Normal Shortbow (u), then use Bronze Arrowheads on Wooden Headless Arrows to make Bronze Arrows.',
                    'Equip the finished shortbow. The bronze arrows can stay in your pack; the combat system will use them when the bow needs ammo.',
                    'Stand a few tiles away from a chicken and attack it. Distance is the lesson here, so do not walk right up to the target.'
                ])
            ];
            if (step < 6) {
                options.push(makeTutorialTextOption('Ask what to do', 'Finish the melee combat lesson first. Then I can show you how to fight at range.'));
            } else if (step === 6) {
                options.push(makeTutorialCheckOption(
                    context,
                    'I landed a ranged hit',
                    'Good shot. Magic uses a different kind of fuel, so the Magic Instructor is next.',
                    () => hasRangedPractice,
                    7,
                    hasNormalShortbow && hasBronzeArrows
                        ? 'Equip the bow, keep arrows in your inventory, and attack a chicken from a few tiles away until you gain ranged XP.'
                        : 'Finish the bow with bow string and finish bronze arrows with the arrowheads, then equip the bow and shoot from a few tiles away.',
                    [
                        { itemId: 'normal_shortbow_u', amount: 1 },
                        { itemId: 'bow_string', amount: 1 },
                        { itemId: 'wooden_headless_arrows', amount: 1 },
                        { itemId: 'cooked_shrimp', amount: 2 }
                    ]
                ));
            } else {
                options.push(makeTutorialTextOption('Ask about the next station', 'You are done here. The Magic Instructor is waiting by the lesson board.'));
            }
            options.push({ kind: 'close', label: 'Goodbye' });
            return {
                title: 'Ranged Instructor',
                greeting: step < 6
                    ? 'Fight up close first. Ranged practice makes more sense once you know how targeting works.'
                    : 'Take these real bow parts and headless arrows. Use the bronze arrowheads you forged at the anvil, finish the gear in your inventory, equip the shortbow, keep your distance, shoot a chicken, then come back when the ranged XP lands.',
                options
            };
        }

        if (dialogueId === 'tutorial_magic_instructor' || nameKey === 'magic instructor') {
            if (step === 7 && typeof context.ensureTutorialItem === 'function') {
                context.ensureTutorialItem('plain_staff_wood', 1);
                context.ensureTutorialItem('ember_rune', 5);
            }
            const options = [
                makeTutorialTextOption('Ask about magic', [
                    'Magic needs a staff and runes. The staff focuses the spell; the rune supplies the shape and fuel.',
                    'Equip the plain staff and keep ember runes in your inventory. When you attack from range, the staff uses an ember rune automatically.',
                    'Each cast spends one rune, so the next lesson shows how to make more.'
                ])
            ];
            if (step < 7) {
                options.push(makeTutorialTextOption('Ask what to do', 'Finish the ranged lesson first. Magic comes after you understand distance.'));
            } else if (step === 7) {
                options.push(makeTutorialCheckOption(
                    context,
                    'I cast a spell',
                    [
                        'Good. You felt the important part: the rune disappears because it became the spell.',
                        'Now speak to the Runecrafting Instructor by the Ember Altar. They will show you how to make more spell fuel yourself.'
                    ],
                    () => hasMagicPractice,
                    8,
                    'Equip the plain staff, keep ember runes in your inventory, and attack a chicken from range until you gain a little Magic XP.',
                    [{ itemId: 'plain_staff_wood', amount: 1 }, { itemId: 'ember_rune', amount: 5 }]
                ));
            } else {
                options.push(makeTutorialTextOption('Ask about the next station', 'You are done here. The Runecrafting Instructor is beside the Ember Altar.'));
            }
            options.push({ kind: 'close', label: 'Goodbye' });
            return {
                title: 'Magic Instructor',
                greeting: step < 7
                    ? 'Magic waits until you have handled ranged combat.'
                    : 'Take a staff and a few ember runes. Equip the staff, attack from range, then we will talk about where more runes come from.',
                options
            };
        }

        if (dialogueId === 'tutorial_runecrafting_instructor' || nameKey === 'runecrafting instructor') {
            if (step === 8 && typeof context.ensureTutorialItem === 'function') context.ensureTutorialItem('rune_essence', 10);
            const options = [
                makeTutorialTextOption('Ask about runecrafting', [
                    'Rune essence is blank spell material. Carry it to the Ember Altar and choose Craft-rune on the altar, or use the essence on the altar.',
                    'The altar turns the essence into ember runes, and those runes fuel the staff spell you just tried.'
                ])
            ];
            if (step < 8) {
                options.push(makeTutorialTextOption('Ask what to do', 'Speak to the Magic Instructor first. Runes make more sense after the spell lesson starts.'));
            } else if (step === 8) {
                options.push(makeTutorialCheckOption(
                    context,
                    'I crafted ember runes',
                    'There it is: essence becomes runes, and runes become the fuel for magic. The Crafting Instructor is next.',
                    () => hasRunecraftingPractice,
                    9,
                    'Choose Craft-rune on the Ember Altar, or use rune essence on the altar, until ember runes appear in your inventory.',
                    [{ itemId: 'rune_essence', amount: 10 }]
                ));
            } else {
                options.push(makeTutorialTextOption('Ask about the next station', 'You are done here. The Crafting Instructor is at the bench near the bank yard.'));
            }
            options.push({ kind: 'close', label: 'Goodbye' });
            return {
                title: 'Runecrafting Instructor',
                greeting: step < 8
                    ? 'The altar waits. Finish the magic orientation first.'
                    : 'Take rune essence, stand by the Ember Altar, and choose Craft-rune to make your first runes.',
                options
            };
        }

        if (dialogueId === 'tutorial_crafting_instructor' || nameKey === 'crafting instructor') {
            if (step === 9 && typeof context.ensureTutorialItem === 'function') {
                context.ensureTutorialItem('clay', 1);
                context.ensureTutorialItem('borrowed_ring', 1);
            }
            const options = [
                makeTutorialTextOption('Ask about crafting', [
                    'Crafting begins when you prepare the material. Use clay on the pond water you visited earlier to make soft clay.',
                    'Then stand by this bench as your work area. The shaping action is still in your inventory: use the soft clay on the borrowed ring in your inventory.',
                    'That presses a useful mould shape into the clay and proves you understand item-on-item crafting.'
                ])
            ];
            if (step < 9) {
                options.push(makeTutorialTextOption('Ask what to do', 'Craft runes at the Ember Altar first. This bench is the next stop after that.'));
            } else if (step === 9) {
                options.push(makeTutorialCheckOption(
                    context,
                    'I shaped a mould',
                    'Good. That is crafting at its simplest: prepare a material, then shape it into something more useful. The Bank Tutor is next.',
                    () => hasCraftingMouldPractice,
                    10,
                    hasSoftClay
                        ? 'Stand by the crafting bench, use the soft clay on the borrowed ring in your inventory, then bring the imprinted mould back.'
                        : 'Use the clay on the pond water to make soft clay, then stand by the bench and use the soft clay on the borrowed ring.',
                    [{ itemId: 'clay', amount: 1 }, { itemId: 'borrowed_ring', amount: 1 }]
                ));
            } else {
                options.push(makeTutorialTextOption('Ask about the next station', 'You are done here. The Bank Tutor is waiting at the booths.'));
            }
            options.push({ kind: 'close', label: 'Goodbye' });
            return {
                title: 'Crafting Instructor',
                greeting: step < 9
                    ? 'Runecrafting first, then we can talk about shaping materials.'
                    : 'Take this clay and borrowed ring. Soften the clay at the pond, then stand by the bench. The bench is your work area; the shaping action is soft clay on borrowed ring in your inventory.',
                options
            };
        }

        if (dialogueId === 'tutorial_bank_tutor' || nameKey === 'bank tutor') {
            if (step === 10 && typeof context.ensureTutorialItem === 'function') context.ensureTutorialItem('coins', 1);
            const options = [
                makeTutorialTextOption('Ask about the bank', [
                    'Bank booths are linked shared storage. Open one booth, then deposit the coin from your inventory into the bank.',
                    'Close or leave that booth, open the other booth, and withdraw the coin from the bank grid. That proves both booths reach the same storage.'
                ])
            ];
            if (step < 10) {
                options.push(makeTutorialTextOption('Ask what to do', 'Finish the advanced skill yard first. Then I can show you how banking follows you around the world.'));
            } else if (step === 10) {
                options.push(makeTutorialCheckOption(
                    context,
                    'I used both bank booths',
                    'Exactly. Your bank follows you. The exit gate is open; speak to the Tutorial Guide when you are ready.',
                    () => callBoolean(context, 'hasTutorialBankProof'),
                    exitStep,
                    'Open one booth and deposit the coin from your inventory. Then open the other booth, withdraw the coin from the bank grid, and talk to me again.',
                    [{ itemId: 'coins', amount: 1 }]
                ));
            } else {
                options.push(makeTutorialTextOption('Ask about leaving', 'You are cleared. The Tutorial Guide can send you to Starter Town.'));
            }
            options.push({ kind: 'close', label: 'Goodbye' });
            return {
                title: 'Bank Tutor',
                greeting: step < 10
                    ? 'Banks come after you know how to gather, fight, craft, and keep your pack organized.'
                    : 'Here is a coin if you need one. Deposit it from your inventory into one booth, withdraw it from the other, and come back.',
                options
            };
        }

        return baseView || null;
    }

    window.CoreTutorialRuntime = {
        buildNpcDialogueView,
        getStep: getTutorialStep,
        setStep: setTutorialStep,
        getGuidanceMarker,
        recordBankAction: recordTutorialBankAction,
        isInsideActiveBounds,
        isWalkTileAllowed,
        getRecoverySpawnForStep,
        isExitUnlocked: (options = {}) => getTutorialStep(options) >= getTutorialExitStep(getContext(options))
    };
})();
