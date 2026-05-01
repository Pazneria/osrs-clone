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

    function makeTutorialStepOption(context, label, response, step, items = []) {
        return {
            kind: 'tutorial',
            label,
            onSelect: ({ refreshDialogue }) => {
                ensureTutorialItems(context, items);
                setTutorialStep({ context }, step);
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
                    greeting: 'You have the shape of it now. Starter Town is open when you are ready.',
                    options: [
                        makeTutorialTextOption('Ask about what comes next', 'Starter Town has shops, trainers, banks, and longer routes. Keep practicing one loop at a time.'),
                        makeTutorialTravelOption(context),
                        { kind: 'close', label: 'Stay on the island' }
                    ]
                };
            }
            if (step === 0) {
                if (typeof context.ensureTutorialItem === 'function') context.ensureTutorialItem('bronze_axe', 1);
                setTutorialStep({ context }, 1, 'tutorial_arrival_welcome');
                return {
                    title: 'Tutorial Guide',
                    greeting: 'Ah, there you are. Welcome to Tutorial Island. Take a breath: nobody expects you to know the shape of this place yet. This house is only the start. Outside, the fences keep the lessons in order so you can learn one thing at a time. I have put a bronze axe in your pack; step through the front door, follow the path to the grove, and speak with the Woodcutting Instructor.',
                    options: [
                        makeTutorialTextOption('Ask about movement', 'Left-click the ground to walk there. Right-click people, doors, resources, and objects when you want to see the actions they offer.'),
                        makeTutorialTextOption('Ask about the island', 'You will learn the basic loops in order: woodcutting, fishing, firemaking and cooking, mining and smithing, combat, banking, then the trip to Starter Town.'),
                        { kind: 'close', label: 'I am ready' }
                    ]
                };
            }
            return {
                title: 'Tutorial Guide',
                greeting: 'Keep moving through the courtyard stations. I will not send you to Starter Town until the instructors are satisfied.',
                options: [
                    makeTutorialTextOption('Ask what to do', 'Follow the fences: woodcutting, fishing, firemaking and cooking, mining and smithing, chickens, bank, then the exit.'),
                    { kind: 'close', label: 'Goodbye' }
                ]
            };
        }

        if (dialogueId === 'tutorial_woodcutting_instructor' || nameKey === 'woodcutting instructor') {
            if (step <= 1 && typeof context.ensureTutorialItem === 'function') context.ensureTutorialItem('bronze_axe', 1);
            const options = [
                makeTutorialTextOption('Ask about chopping', 'Use the bronze axe on a normal tree. Logs are your first raw material, and many other skills consume them.')
            ];
            if (step <= 1) {
                options.push(makeTutorialCheckOption(
                    context,
                    'I have cut some logs',
                    'Good. Logs are the input for several skills. The next gate is open; take the path to the Fishing Instructor.',
                    () => hasLogs,
                    2,
                    'Not yet. Chop one of the nearby trees until you have logs in your inventory.',
                    [{ itemId: 'bronze_axe', amount: 1 }]
                ));
            } else {
                options.push(makeTutorialTextOption('Ask about the next station', 'You are done here. The Fishing Instructor is by the pond.'));
            }
            options.push({ kind: 'close', label: 'Goodbye' });
            return {
                title: 'Woodcutting Instructor',
                greeting: step <= 1
                    ? 'Trees first. Take the axe, cut logs, then come back.'
                    : 'The grove is for gathering. Once you have logs, take them to the fire lane.',
                options
            };
        }

        if (dialogueId === 'tutorial_fishing_instructor' || nameKey === 'fishing instructor') {
            if (step === 2 && typeof context.ensureTutorialItem === 'function') context.ensureTutorialItem('small_net', 1);
            const options = [
                makeTutorialTextOption('Ask about fishing', 'Fishing is gathering from water. Use the small net on the pond, then bring the catch back to me.')
            ];
            if (step < 2) {
                options.push(makeTutorialTextOption('Ask what to do', 'The grove gate comes first. Cut logs and speak to the Woodcutting Instructor.'));
            } else if (step === 2) {
                options.push(makeTutorialCheckOption(
                    context,
                    'I caught a fish',
                    'Nice catch. The next pen teaches how logs and food work together.',
                    () => hasRawShrimp || hasCookedOrBurntShrimp,
                    3,
                    'Use the small net on the pond until you catch raw shrimp.',
                    [{ itemId: 'small_net', amount: 1 }]
                ));
            } else {
                options.push(makeTutorialTextOption('Ask about the next station', 'You are done here. Take your fish to the firemaking and cooking lane.'));
            }
            options.push({ kind: 'close', label: 'Goodbye' });
            return {
                title: 'Fishing Instructor',
                greeting: step < 2
                    ? 'The pond waits until you have learned the grove.'
                    : 'Here is a small net if you need one. Catch shrimp from the pond and come back.',
                options
            };
        }

        if (dialogueId === 'tutorial_firemaking_instructor' || nameKey === 'firemaking instructor') {
            if (step === 3 && typeof context.ensureTutorialItem === 'function') {
                context.ensureTutorialItem('tinderbox', 1);
                context.ensureTutorialItem('logs', 1);
            }
            const options = [
                makeTutorialTextOption('Ask about fires and cooking', 'Use a tinderbox with logs to make a fire. Then cook your raw shrimp on the fire. Burnt shrimp still proves the loop.')
            ];
            if (step < 3) {
                options.push(makeTutorialTextOption('Ask what to do', 'Catch a fish first. A fire matters more when you have something to cook.'));
            } else if (step === 3) {
                options.push(makeTutorialCheckOption(
                    context,
                    'I cooked the fish',
                    'Good. You gathered wood, gathered food, spent the wood, and processed the food. The mine gate is open.',
                    () => hasCookedOrBurntShrimp,
                    4,
                    hasRawShrimp
                        ? 'Use your tinderbox with logs, then cook the raw shrimp on the fire. Burnt shrimp counts.'
                        : 'You need raw shrimp to cook. Go back to the pond if you lost yours.',
                    [{ itemId: 'tinderbox', amount: 1 }, { itemId: 'logs', amount: 1 }]
                ));
            } else {
                options.push(makeTutorialTextOption('Ask about the next station', 'You are done here. The Mining and Smithing Instructor is beyond the next gate.'));
            }
            options.push({ kind: 'close', label: 'Goodbye' });
            return {
                title: 'Firemaking Instructor',
                greeting: step < 3
                    ? 'This lane is for turning gathered resources into utility.'
                    : 'I will replace your tinderbox or a log if you lost them. Light a fire, cook the shrimp, then report back.',
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
                options.push(makeTutorialTextOption('Ask what to do', 'Finish the chicken combat lesson first. Then I will teach you banking.'));
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
        recordBankAction: recordTutorialBankAction,
        isInsideActiveBounds,
        isWalkTileAllowed,
        getRecoverySpawnForStep,
        isExitUnlocked: (options = {}) => getTutorialStep(options) >= getTutorialExitStep(getContext(options))
    };
})();
