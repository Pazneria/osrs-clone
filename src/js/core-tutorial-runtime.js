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

    const TUTORIAL_WORLD_COORD_SCALE = 648 / 486;
    const TUTORIAL_START_CABIN_RAW_BOUNDS = Object.freeze({
        xMin: 132,
        xMax: 144,
        yMin: 166,
        yMax: 178,
        z: 0,
        dx: 44,
        dy: 55
    });

    function scaleTutorialAxis(value) {
        return Math.round(value * TUTORIAL_WORLD_COORD_SCALE);
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

    function makeGuidanceMarker(markerId, label, targetKind, x, y, z = 0, heightOffset = 2.35) {
        const point = remapTutorialSurfacePoint(x, y, z);
        return {
            markerId,
            label,
            targetKind,
            x: point.x,
            y: point.y,
            z: point.z,
            heightOffset
        };
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
        const hasBronzeBar = hasInventoryItem(context, 'bronze_bar');
        const hasBronzeSmithingOutput = hasInventoryItem(context, 'bronze_arrowheads')
            || hasInventoryItem(context, 'bronze_sword_blade')
            || hasInventoryItem(context, 'bronze_axe_head')
            || hasInventoryItem(context, 'bronze_pickaxe_head');
        const hasCombatPractice = callNumber(context, 'getSkillXp', 0, 'attack') > 0
            || callNumber(context, 'getSkillXp', 0, 'strength') > 0
            || callNumber(context, 'getSkillXp', 0, 'defense') > 0;
        const depositSource = profile && typeof profile.tutorialBankDepositSource === 'string'
            ? profile.tutorialBankDepositSource
            : '';
        const withdrawSource = profile && typeof profile.tutorialBankWithdrawSource === 'string'
            ? profile.tutorialBankWithdrawSource
            : '';

        if (step <= 0) {
            return makeGuidanceMarker(
                'tutorial:step0:tutorial_guide',
                'Talk to the Tutorial Guide',
                'npc',
                141,
                177,
                0,
                2.55
            );
        }

        if (step === 1) {
            if (hasLogs) {
                return makeGuidanceMarker(
                    'tutorial:step1:woodcutting_instructor',
                    'Return to the Woodcutting Instructor',
                    'npc',
                    250,
                    212,
                    0,
                    2.55
                );
            }
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
                return makeGuidanceMarker(
                    'tutorial:step2:fishing_instructor',
                    'Return to the Fishing Instructor',
                    'npc',
                    274,
                    240,
                    0,
                    2.55
                );
            }
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
                return makeGuidanceMarker(
                    'tutorial:step3:firemaking_instructor',
                    'Report to the Firemaking Instructor',
                    'npc',
                    288,
                    248,
                    0,
                    2.55
                );
            }
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
            if (hasBronzeSmithingOutput) {
                return makeGuidanceMarker(
                    'tutorial:step4:mining_smithing_instructor',
                    'Report to the Mining and Smithing Instructor',
                    'npc',
                    338,
                    292,
                    0,
                    2.55
                );
            }
            if (hasBronzeBar) {
                return makeGuidanceMarker(
                    'tutorial:step4:anvil',
                    'Forge bronze at the anvil',
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
                    'Smelt a bronze bar at the furnace',
                    'station',
                    344,
                    296,
                    0,
                    2.0
                );
            }
            return makeGuidanceMarker(
                'tutorial:step4:quarry',
                'Mine copper and tin ore',
                'resource',
                358,
                286,
                0,
                1.85
            );
        }

        if (step === 5) {
            if (hasCombatPractice) {
                return makeGuidanceMarker(
                    'tutorial:step5:combat_instructor',
                    'Report to the Combat Instructor',
                    'npc',
                    320,
                    326,
                    0,
                    2.55
                );
            }
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
            if (callBoolean(context, 'hasTutorialBankProof')) {
                return makeGuidanceMarker(
                    'tutorial:step6:bank_tutor',
                    'Report to the Bank Tutor',
                    'npc',
                    202,
                    330,
                    0,
                    2.55
                );
            }
            if (depositSource && !withdrawSource) {
                return makeGuidanceMarker(
                    'tutorial:step6:bank_withdraw',
                    'Withdraw the coin from the other bank booth',
                    'station',
                    208,
                    324,
                    0,
                    1.75
                );
            }
            return makeGuidanceMarker(
                'tutorial:step6:bank_deposit',
                'Deposit the coin at a bank booth',
                'station',
                184,
                322,
                0,
                1.75
            );
        }

        if (step >= exitStep) {
            return makeGuidanceMarker(
                'tutorial:step7:exit_guide',
                'Talk to the Tutorial Guide',
                'npc',
                250,
                334,
                0,
                2.55
            );
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
        if (!callBoolean(context, 'isTutorialWorldActive') || !profile || getTutorialStep({ context }) !== 6) return false;
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
        const hasBronzeBar = callNumber(context, 'getInventoryItemCount', 0, 'bronze_bar') > 0;
        const hasBronzeSmithingOutput = callNumber(context, 'getInventoryItemCount', 0, 'bronze_arrowheads') > 0
            || callNumber(context, 'getInventoryItemCount', 0, 'bronze_sword_blade') > 0
            || callNumber(context, 'getInventoryItemCount', 0, 'bronze_axe_head') > 0
            || callNumber(context, 'getInventoryItemCount', 0, 'bronze_pickaxe_head') > 0;
        const hasCombatPractice = callNumber(context, 'getSkillXp', 0, 'attack') > 0
            || callNumber(context, 'getSkillXp', 0, 'strength') > 0
            || callNumber(context, 'getSkillXp', 0, 'defense') > 0;
        const miningStarted = callNumber(context, 'getInventoryItemCount', 0, 'copper_ore') > 0
            || callNumber(context, 'getInventoryItemCount', 0, 'tin_ore') > 0
            || hasBronzeBar
            || hasBronzeSmithingOutput;

        if (dialogueId === 'tutorial_guide' || nameKey === 'tutorial guide') {
            if (step >= exitStep) {
                return {
                    title: 'Tutorial Guide',
                    greeting: [
                        'You have done well, traveler. You gathered, cooked, worked metal, fought safely, and used a bank.',
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
                        'I will walk you through the basics one piece at a time. Movement first, then tools, gathering, cooking, metalwork, combat, banking, and finally the road to Starter Town.'
                    ],
                    options: [
                        makeTutorialTextOption('Ask about movement', [
                            'Left-click the ground to walk there. Your adventurer will try to find a path if the way is clear.',
                            'Right-click people, doors, trees, fishing spots, rocks, and objects to see more actions. That menu is how you choose exactly what you want to do.',
                            'If you are not sure what something is, look for Examine. If you are holding or carrying a tool, look for Use or the action that matches the lesson.'
                        ]),
                        makeTutorialTextOption('Ask about the island', [
                            'Tutorial Island is a guided route for first-time adventurers. Each instructor covers one basic skill and then points you to the next stop.',
                            'You will gather wood, catch shrimp, cook food, mine ore, smith metal, try safe combat, use the bank, and then leave for Starter Town.',
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
                        'The arrival cabin door is unlocked now, and the first gate will let you through.',
                        'Follow the dirt path to the grove and speak with the Woodcutting Instructor before chopping trees. They are expecting you.'
                    ]
                    : step >= 4
                    ? [
                        'You are doing well. Keep following the instructors in order and the island will make sense one step at a time.',
                        'The quarry, forge, combat yard, bank, and exit are all ahead on the same route.'
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
                            'After that, the path takes you to combat practice, the bank, and the exit.'
                        ]
                        : step === 1
                        ? [
                            'Open the cabin door if it is still closed, pass through the first gate, and follow the dirt path to the grove.',
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
                    'Use the net on the pond until you catch raw shrimp, then bring the catch back. You will cook it at the fire clearing next.'
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
                    'Firemaking spends logs to create a temporary cooking spot. Use your tinderbox with logs on the ground near this clearing.',
                    'Once the fire is burning, use the raw shrimp on it. Cooked shrimp is best, but burnt shrimp still proves you completed the loop.'
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
                        ? 'Use your tinderbox with logs near the clearing, then cook the raw shrimp on the fire. Burnt shrimp counts.'
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
            }
            const options = [
                makeTutorialTextOption('Ask about mining and smithing', 'Mine copper and tin, smelt them into a bronze bar at the furnace, then forge bronze arrowheads at the anvil.')
            ];
            if (step < 4) {
                options.push(makeTutorialTextOption('Ask what to do', 'Finish the fire and cooking lesson first. Metal comes after food.'));
            } else if (step === 4) {
                options.push(makeTutorialCheckOption(
                    context,
                    'I forged bronze',
                    'That is the metal loop: mine ore, smelt bars, forge parts. The chicken pen is open.',
                    () => hasBronzeSmithingOutput,
                    5,
                    miningStarted
                        ? 'Keep going: copper plus tin makes a bronze bar, and one bronze bar can become bronze arrowheads at the anvil.'
                        : 'Mine one copper ore and one tin ore, then use the furnace and anvil.',
                    [{ itemId: 'bronze_pickaxe', amount: 1 }, { itemId: 'hammer', amount: 1 }]
                ));
            } else {
                options.push(makeTutorialTextOption('Ask about the next station', 'You are done here. The Combat Instructor is waiting by the chicken pen.'));
            }
            options.push({ kind: 'close', label: 'Goodbye' });
            return {
                title: 'Mining and Smithing Instructor',
                greeting: step < 4
                    ? 'Metal work waits until you can feed yourself.'
                    : 'Take a pickaxe and hammer if you need them. Mine, smelt, forge, then come back.',
                options
            };
        }

        if (dialogueId === 'tutorial_combat_instructor' || nameKey === 'combat instructor') {
            if (step === 5 && typeof context.ensureTutorialItem === 'function') {
                context.ensureTutorialItem('bronze_sword', 1);
                context.ensureTutorialItem('cooked_shrimp', 2);
            }
            const options = [
                makeTutorialTextOption('Ask about combat', 'Attack a chicken, watch your combat tab, and eat food if you need it. Chickens are weak, but they still teach targeting.')
            ];
            if (step < 5) {
                options.push(makeTutorialTextOption('Ask what to do', 'Finish the mining and smithing lesson first. Tools before trouble.'));
            } else if (step === 5) {
                options.push(makeTutorialCheckOption(
                    context,
                    'I fought a chicken',
                    'Good enough for your first day. The bank pen is open.',
                    () => hasCombatPractice,
                    6,
                    'Fight one of the chickens until you gain a little combat XP, then come back.',
                    [{ itemId: 'bronze_sword', amount: 1 }, { itemId: 'cooked_shrimp', amount: 2 }]
                ));
            } else {
                options.push(makeTutorialTextOption('Ask about the next station', 'You are done here. The Bank Tutor is past the next gate.'));
            }
            options.push({ kind: 'close', label: 'Goodbye' });
            return {
                title: 'Combat Instructor',
                greeting: step < 5
                    ? 'Do the metal work first. Then we will talk about hitting things properly.'
                    : 'Take a sword and a little food if you need them. Defeat a chicken, then report back.',
                options
            };
        }

        if (dialogueId === 'tutorial_bank_tutor' || nameKey === 'bank tutor') {
            if (step === 6 && typeof context.ensureTutorialItem === 'function') context.ensureTutorialItem('coins', 1);
            const options = [
                makeTutorialTextOption('Ask about the bank', 'Bank booths are linked. Put a coin in one booth, then take it out from the other booth.')
            ];
            if (step < 6) {
                options.push(makeTutorialTextOption('Ask what to do', 'Finish the combat lesson first. Then I can show you how banking follows you around the world.'));
            } else if (step === 6) {
                options.push(makeTutorialCheckOption(
                    context,
                    'I used both bank booths',
                    'Exactly. Your bank follows you. The exit gate is open; speak to the Tutorial Guide when you are ready.',
                    () => callBoolean(context, 'hasTutorialBankProof'),
                    exitStep,
                    'Deposit the coin at one booth, withdraw it from the other booth, then talk to me again.',
                    [{ itemId: 'coins', amount: 1 }]
                ));
            } else {
                options.push(makeTutorialTextOption('Ask about leaving', 'You are cleared. The Tutorial Guide can send you to Starter Town.'));
            }
            options.push({ kind: 'close', label: 'Goodbye' });
            return {
                title: 'Bank Tutor',
                greeting: step < 6
                    ? 'Banks come after you know how to gather and fight.'
                    : 'Here is a coin if you need one. Deposit it in one booth, withdraw it from the other, and come back.',
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
