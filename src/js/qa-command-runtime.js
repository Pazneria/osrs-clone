(function () {
    const HELP_PRESETS = 'QA presets: /qa fish_full, /qa fish_rod, /qa fish_harpoon, /qa fish_rune, /qa wc_full, /qa mining_full, /qa rc_full, /qa rc_combo, /qa rc_routes, /qa fm_full, /qa smith_smelt, /qa smith_forge, /qa smith_jewelry, /qa smith_full, /qa smith_fullinv, /qa ranged, /qa icons, /qa default';
    const HELP_TOOLS = 'QA tools: /qa worlds, /qa travel <worldId>, /qa creator, /qa perf, /qa setlevel <fishing|firemaking|mining|runecrafting|smithing|ranged> <1-99>, /qa diag <fishing|mining|rc|shop>, /qa shopdiag [merchantId], /qa openshop <merchantId>, /qa fishspots, /qa fishshops, /qa cookspots, /qa firespots, /qa gotofish <pond|pier|deep>, /qa gotocook <camp|river|dock|deep>, /qa gotofire <starter|oak|willow|maple|yew>, /qa gotofishshop <teacher|supplier>, /qa gotomerchant <merchantId|alias>, /qa gototutorial <arrival|woodcutting|fishing|firemaking|mining|combat|ranged|magic|runecrafting|crafting|bank|exit>, /qa npctargets [query], /qa combattargets, /qa projecttile <x> <y> [z] [height], /qa raycast <screenX> <screenY> [maxHits], /qa camera preset <tutorial_surface|tutorial_late_yard>, /qa unlock <combo|gemmine|mould|moulds|ringmould|amuletmould|tiaramould> <on|off>, /qa altars, /qa gotoaltar <ember|water|earth|air>, /qa rcdebug <on|off>, /qa pierdebug <on|off>, /qa combatdebug [on|off|now|clears|clearreset]';

    function getWindowRef(context = {}) {
        return context.windowRef || (typeof window !== 'undefined' ? window : {});
    }

    function addChat(context, message, type = 'info') {
        if (context && typeof context.addChatMessage === 'function') {
            context.addChatMessage(message, type);
        }
    }

    function callHook(context, name, ...args) {
        const hook = context && context[name];
        if (typeof hook === 'function') return hook.apply(context, args);
        return undefined;
    }

    function consumeHook(context, name, ...args) {
        callHook(context, name, ...args);
        return true;
    }

    function setWindowFlag(context, flagName, enabled) {
        getWindowRef(context)[flagName] = !!enabled;
    }

    function handleCameraCommand(parts, context) {
        const windowRef = getWindowRef(context);
        const subcommand = String(parts[1] || '').toLowerCase();
        if (subcommand === 'reset') {
            const cameraState = typeof context.resetQaCameraView === 'function'
                ? context.resetQaCameraView()
                : (typeof windowRef.resetQaCameraView === 'function' ? windowRef.resetQaCameraView() : null);
            if (cameraState) addChat(context, `[QA camera] reset yaw=${cameraState.yaw} pitch=${cameraState.pitch} dist=${cameraState.distance}`, 'info');
            else addChat(context, '[QA camera] reset unavailable', 'warn');
            return true;
        }
        if (subcommand === 'set') {
            const yaw = Number(parts[2]);
            const pitch = parts.length >= 4 ? Number(parts[3]) : undefined;
            const dist = parts.length >= 5 ? Number(parts[4]) : undefined;
            const setter = typeof context.setQaCameraView === 'function'
                ? context.setQaCameraView
                : (typeof windowRef.setQaCameraView === 'function' ? windowRef.setQaCameraView.bind(windowRef) : null);
            if (!Number.isFinite(yaw) || !setter) {
                addChat(context, 'Usage: /qa camera set <yaw> [pitch] [dist]', 'warn');
                return true;
            }
            const cameraState = setter(yaw, pitch, dist);
            addChat(context, `[QA camera] set yaw=${cameraState.yaw} pitch=${cameraState.pitch} dist=${cameraState.distance}`, 'info');
            return true;
        }
        if (subcommand === 'preset') {
            const presetId = String(parts[2] || '').toLowerCase();
            const setter = typeof context.setQaCameraAerialView === 'function'
                ? context.setQaCameraAerialView
                : (typeof windowRef.setQaCameraAerialView === 'function' ? windowRef.setQaCameraAerialView.bind(windowRef) : null);
            if (!presetId || !setter) {
                addChat(context, 'Usage: /qa camera preset <tutorial_surface|tutorial_late_yard>', 'warn');
                return true;
            }
            const cameraState = setter(presetId);
            addChat(context, `[QA camera] preset=${cameraState.presetId} target=${cameraState.targetX},${cameraState.targetY},${cameraState.targetZ} yaw=${cameraState.yaw} pitch=${cameraState.pitch} dist=${cameraState.distance}`, 'info');
            return true;
        }
        return false;
    }

    function handlePerfCommand(context) {
        const windowRef = getWindowRef(context);
        const snapshotReader = typeof context.getRuntimePerformanceSnapshot === 'function'
            ? context.getRuntimePerformanceSnapshot
            : (typeof windowRef.getRuntimePerformanceSnapshot === 'function' ? windowRef.getRuntimePerformanceSnapshot.bind(windowRef) : null);
        if (!snapshotReader) {
            addChat(context, '[QA perf] snapshot unavailable', 'warn');
            return true;
        }
        const snapshot = snapshotReader() || {};
        const drawingBuffer = Array.isArray(snapshot.drawingBuffer) ? snapshot.drawingBuffer.join('x') : 'unknown';
        const pixelRatio = Number.isFinite(snapshot.pixelRatio) ? Number(snapshot.pixelRatio).toFixed(2) : 'unknown';
        const renderCalls = Number.isFinite(snapshot.renderCalls) ? snapshot.renderCalls : 'unknown';
        const triangles = Number.isFinite(snapshot.triangles) ? snapshot.triangles : 'unknown';
        const chunkPreset = snapshot.chunkPolicyPreset || 'unknown';
        const rendererLabel = snapshot.webglRenderer || 'unknown renderer';
        const rendererMode = snapshot.softwareWebglRenderer ? 'software' : 'hardware';
        addChat(context, `[QA perf] fps=${snapshot.fps || '?'} calls=${renderCalls} tris=${triangles} px=${pixelRatio} buffer=${drawingBuffer} chunks=${chunkPreset}`, 'info');
        addChat(context, `[QA perf] webgl=${rendererMode}: ${rendererLabel}`, snapshot.softwareWebglRenderer ? 'warn' : 'info');
        return true;
    }

    function handleUnlockCommand(parts, context) {
        const subject = String(parts[1] || '').toLowerCase();
        const value = String(parts[2] || '').toLowerCase();
        if (subject !== 'combo' && subject !== 'gemmine' && subject !== 'gem_mine' && subject !== 'mould' && subject !== 'moulds' && subject !== 'ringmould' && subject !== 'amuletmould' && subject !== 'tiaramould') {
            addChat(context, 'Usage: /qa unlock <combo|gemmine|mould|moulds|ringmould|amuletmould|tiaramould> <on|off>', 'warn');
            return true;
        }
        if (value !== 'on' && value !== 'off') {
            addChat(context, 'Usage: /qa unlock <combo|gemmine|mould|moulds|ringmould|amuletmould|tiaramould> <on|off>', 'warn');
            return true;
        }
        const enabled = value === 'on';
        if (subject === 'combo') {
            callHook(context, 'setQaUnlockFlag', 'runecraftingComboUnlocked', enabled);
            addChat(context, 'QA combo unlock: ' + value, 'info');
            return true;
        }
        if (subject === 'gemmine' || subject === 'gem_mine') {
            callHook(context, 'setQaUnlockFlag', 'gemMineUnlocked', enabled);
            addChat(context, 'QA gem mine unlock: ' + value, 'info');
            return true;
        }
        if (subject === 'mould' || subject === 'moulds') {
            callHook(context, 'setQaUnlockFlag', 'ringMouldUnlocked', enabled);
            callHook(context, 'setQaUnlockFlag', 'amuletMouldUnlocked', enabled);
            callHook(context, 'setQaUnlockFlag', 'tiaraMouldUnlocked', enabled);
            addChat(context, 'QA mould unlocks: ' + value, 'info');
            return true;
        }
        if (subject === 'ringmould') {
            callHook(context, 'setQaUnlockFlag', 'ringMouldUnlocked', enabled);
            addChat(context, 'QA ring mould unlock: ' + value, 'info');
            return true;
        }
        if (subject === 'amuletmould') {
            callHook(context, 'setQaUnlockFlag', 'amuletMouldUnlocked', enabled);
            addChat(context, 'QA amulet mould unlock: ' + value, 'info');
            return true;
        }
        callHook(context, 'setQaUnlockFlag', 'tiaraMouldUnlocked', enabled);
        addChat(context, 'QA tiara mould unlock: ' + value, 'info');
        return true;
    }

    function handleCombatDebugCommand(parts, context) {
        const windowRef = getWindowRef(context);
        const value = String(parts[1] || 'now').toLowerCase();
        if (value === 'now') {
            if (typeof context.emitQaCombatDebugSnapshot === 'function') {
                context.emitQaCombatDebugSnapshot('manual');
            } else if (typeof windowRef.emitQaCombatDebugSnapshot === 'function') {
                windowRef.emitQaCombatDebugSnapshot('manual');
            } else {
                addChat(context, 'QA combatdebug unavailable: missing combat snapshot helper.', 'warn');
            }
            return true;
        }
        if (value === 'clears') {
            if (typeof context.emitQaCombatDebugClearHistory === 'function') {
                context.emitQaCombatDebugClearHistory();
            } else if (typeof windowRef.emitQaCombatDebugClearHistory === 'function') {
                windowRef.emitQaCombatDebugClearHistory();
            } else {
                addChat(context, 'QA combatdebug clear-history unavailable.', 'warn');
            }
            return true;
        }
        if (value === 'clearreset') {
            windowRef.__qaCombatDebugClearEvents = [];
            addChat(context, 'QA combatdebug clear-history reset.', 'info');
            return true;
        }
        if (value !== 'on' && value !== 'off') {
            addChat(context, 'Usage: /qa combatdebug [on|off|now|clears|clearreset]', 'warn');
            return true;
        }
        windowRef.QA_COMBAT_DEBUG = (value === 'on');
        windowRef.__qaCombatDebugLastSignature = null;
        windowRef.__qaCombatDebugLastEmitTick = null;
        addChat(context, `QA combatdebug: ${value}`, 'info');
        if (value === 'on') {
            if (typeof context.emitQaCombatDebugSnapshot === 'function') context.emitQaCombatDebugSnapshot('watch-on');
            else if (typeof windowRef.emitQaCombatDebugSnapshot === 'function') windowRef.emitQaCombatDebugSnapshot('watch-on');
        }
        return true;
    }

    function handleQaCommand(args, context = {}) {
        const trimmedArgs = String(args || '').trim();
        const parts = trimmedArgs.split(/\s+/).filter(Boolean);
        const cmd = (parts[0] || '').toLowerCase();
        const windowRef = getWindowRef(context);

        if (cmd === 'help' || !cmd) {
            addChat(context, HELP_PRESETS, 'info');
            addChat(context, HELP_TOOLS, 'info');
            addChat(context, callHook(context, 'formatQaOpenShopUsage') || 'Usage: /qa openshop <merchantId>', 'info');
            return true;
        }
        if (cmd === 'worlds') return consumeHook(context, 'qaListWorlds');
        if (cmd === 'creator' || cmd === 'appearance') return consumeHook(context, 'qaOpenPlayerCreator');
        if (cmd === 'combattargets') return consumeHook(context, 'qaListCombatTargets');
        if (cmd === 'npctargets') return consumeHook(context, 'qaListNpcTargets', parts.slice(1).join(' '));
        if (cmd === 'perf') return handlePerfCommand(context);
        if (cmd === 'projecttile') return consumeHook(context, 'qaProjectTile', parts);
        if (cmd === 'raycast') return consumeHook(context, 'qaRaycast', parts);
        if (cmd === 'findhit') return consumeHook(context, 'qaFindHit', parts);
        if (cmd === 'camera' && handleCameraCommand(parts, context)) return true;
        if (cmd === 'travel' && parts.length >= 2) {
            const ok = callHook(context, 'qaTravelWorld', parts.slice(1).join(' '));
            if (!ok) addChat(context, 'Usage: /qa travel <worldId>', 'warn');
            return true;
        }
        if (cmd === 'setlevel' && parts.length >= 3) {
            const skill = String(parts[1] || '').toLowerCase();
            const lvl = parseInt(parts[2], 10);
            if (!Number.isFinite(lvl)) {
                addChat(context, 'Usage: /qa setlevel <fishing|firemaking|mining|runecrafting|smithing|ranged> <1-99>', 'warn');
                return true;
            }
            const ok = callHook(context, 'setQaSkillLevel', skill, lvl);
            if (!ok) {
                addChat(context, 'Unknown skill for /qa setlevel. Use fishing, firemaking, mining, runecrafting, smithing, or ranged.', 'warn');
                return true;
            }
            addChat(context, `QA set level: ${skill}=${Math.max(1, Math.min(99, Math.floor(lvl)))}`, 'info');
            return true;
        }
        if (cmd === 'unlock' && parts.length >= 3) return handleUnlockCommand(parts, context);
        if (cmd === 'altars') return consumeHook(context, 'qaListAltars');
        if (cmd === 'fishspots') return consumeHook(context, 'qaListFishingSpots');
        if (cmd === 'fishshops') return consumeHook(context, 'qaListFishingMerchants');
        if (cmd === 'cookspots') return consumeHook(context, 'qaListCookingSpots');
        if (cmd === 'firespots') return consumeHook(context, 'qaListFiremakingSpots');
        if (cmd === 'gotofish' && parts.length >= 2) {
            const ok = callHook(context, 'qaGotoFishingSpot', String(parts[1] || '').toLowerCase());
            if (!ok) addChat(context, 'Usage: /qa gotofish <pond|pier|deep>', 'warn');
            return true;
        }
        if (cmd === 'gotocook' && parts.length >= 2) {
            const ok = callHook(context, 'qaGotoCookingSpot', String(parts[1] || '').toLowerCase());
            if (!ok) addChat(context, 'Usage: /qa gotocook <camp|river|dock|deep>', 'warn');
            return true;
        }
        if (cmd === 'gotofire' && parts.length >= 2) {
            const ok = callHook(context, 'qaGotoFiremakingSpot', String(parts[1] || '').toLowerCase());
            if (!ok) addChat(context, 'Usage: /qa gotofire <starter|oak|willow|maple|yew>', 'warn');
            return true;
        }
        if (cmd === 'gotofishshop' && parts.length >= 2) {
            const ok = callHook(context, 'qaGotoFishingMerchant', String(parts[1] || '').toLowerCase());
            if (!ok) addChat(context, 'Usage: /qa gotofishshop <teacher|supplier>', 'warn');
            return true;
        }
        if (cmd === 'gotomerchant' && parts.length >= 2) {
            const ok = callHook(context, 'qaGotoMerchant', String(parts[1] || '').toLowerCase());
            if (!ok) addChat(context, 'Usage: /qa gotomerchant <merchantId|alias>', 'warn');
            return true;
        }
        if (cmd === 'gototutorial' && parts.length >= 2) {
            const ok = callHook(context, 'qaGotoTutorialStation', String(parts[1] || '').toLowerCase());
            if (!ok) addChat(context, 'Usage: /qa gototutorial <arrival|woodcutting|fishing|firemaking|mining|combat|ranged|magic|runecrafting|crafting|bank|exit>', 'warn');
            return true;
        }
        if (cmd === 'gotoaltar' && parts.length >= 2) {
            const ok = callHook(context, 'qaGotoAltar', String(parts[1] || '').toLowerCase());
            if (!ok) addChat(context, 'Usage: /qa gotoaltar <ember|water|earth|air>', 'warn');
            return true;
        }
        if (cmd === 'rcdebug' && parts.length >= 2) {
            const value = String(parts[1] || '').toLowerCase();
            if (value !== 'on' && value !== 'off') {
                addChat(context, 'Usage: /qa rcdebug <on|off>', 'warn');
                return true;
            }
            setWindowFlag(context, 'QA_RC_DEBUG', value === 'on');
            addChat(context, `QA rcdebug: ${value}`, 'info');
            return true;
        }
        if (cmd === 'pierdebug' && parts.length >= 2) {
            const value = String(parts[1] || '').toLowerCase();
            if (value !== 'on' && value !== 'off') {
                addChat(context, 'Usage: /qa pierdebug <on|off>', 'warn');
                return true;
            }
            setWindowFlag(context, 'QA_PIER_DEBUG', value === 'on');
            addChat(context, `QA pierdebug: ${value}`, 'info');
            return true;
        }
        if (cmd === 'combatdebug') return handleCombatDebugCommand(parts, context);
        if (cmd === 'shopdiag') return consumeHook(context, 'qaDiagShop', parts[1]);
        if (cmd === 'openshop') {
            const merchantId = String(parts[1] || '').toLowerCase();
            const qaOpenableMerchants = callHook(context, 'getQaOpenableMerchantIds') || [];
            if (!Array.isArray(qaOpenableMerchants) || !qaOpenableMerchants.includes(merchantId)) {
                addChat(context, callHook(context, 'formatQaOpenShopUsage') || 'Usage: /qa openshop <merchantId>', 'warn');
                return true;
            }
            const openShop = context.openShopForMerchant || windowRef.openShopForMerchant;
            if (typeof openShop !== 'function') {
                addChat(context, 'QA openshop unavailable: merchant shop handler missing.', 'warn');
                return true;
            }
            openShop(merchantId);
            addChat(context, 'QA opened shop for merchant=' + merchantId, 'info');
            return true;
        }
        if (cmd === 'diag' && parts.length >= 2) {
            const subject = String(parts[1] || '').toLowerCase();
            if (subject === 'fishing' || subject === 'fish') return consumeHook(context, 'qaDiagFishing');
            if (subject === 'mining') return consumeHook(context, 'qaDiagMining');
            if (subject === 'rc' || subject === 'runecrafting') return consumeHook(context, 'qaDiagRunecrafting');
            if (subject === 'shop') return consumeHook(context, 'qaDiagShop', parts[2]);
            addChat(context, 'Usage: /qa diag <fishing|mining|rc|shop>', 'warn');
            return true;
        }

        const applied = callHook(context, 'applyQaInventoryPreset', trimmedArgs);
        if (!applied) addChat(context, `Unknown QA preset/command: ${trimmedArgs}. Use /qa help`, 'warn');
        return true;
    }

    function handleChatMessage(rawText, context = {}) {
        const text = (rawText || '').trim();
        if (!text) return true;
        if (text.toLowerCase().startsWith('/qa ')) {
            return handleQaCommand(text.slice(4).trim(), context);
        }
        addChat(context, text, 'game');
        callHook(context, 'showPlayerOverheadText', text);
        return true;
    }

    window.QaCommandRuntime = {
        handleChatMessage,
        handleQaCommand,
        HELP_PRESETS,
        HELP_TOOLS
    };
})();
