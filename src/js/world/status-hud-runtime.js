(function () {
    function getDocument(context = {}) {
        return context.document || document;
    }

    function setText(documentRef, id, value) {
        if (!documentRef || typeof documentRef.getElementById !== 'function') return false;
        const el = documentRef.getElementById(id);
        if (!el) return false;
        el.innerText = value;
        return true;
    }

    function updateCombatStyleButtonState(button, active) {
        if (!button) return false;
        button.classList.toggle('bg-[#5a311d]', active);
        button.classList.toggle('border-[#ffcf8b]', active);
        button.classList.toggle('text-[#ffcf8b]', active);
        button.classList.toggle('bg-[#111418]', !active);
        button.classList.toggle('border-[#3a444c]', !active);
        button.classList.toggle('text-[#c8aa6e]', !active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
        return true;
    }

    function updateCombatTab(context = {}, combatTabViewModel) {
        const documentRef = getDocument(context);
        if (!documentRef || typeof documentRef.getElementById !== 'function') return false;
        const combatLevelEl = documentRef.getElementById('combat-level-value');
        if (!combatLevelEl || !combatTabViewModel) return false;

        combatLevelEl.innerText = combatTabViewModel.combatLevelText;
        setText(documentRef, 'combat-level-formula', combatTabViewModel.combatLevelFormulaText);
        setText(documentRef, 'combat-style-current', combatTabViewModel.selectedStyleLabel);
        setText(documentRef, 'combat-style-effect', combatTabViewModel.selectedStyleDescription);
        setText(documentRef, 'combat-skill-attack', combatTabViewModel.attackLevel);
        setText(documentRef, 'combat-skill-strength', combatTabViewModel.strengthLevel);
        setText(documentRef, 'combat-skill-defense', combatTabViewModel.defenseLevel);
        setText(documentRef, 'combat-skill-hitpoints', combatTabViewModel.hitpointsLevel);
        setText(documentRef, 'combat-roll-attack', combatTabViewModel.combatStats.attack);
        setText(documentRef, 'combat-roll-defense', combatTabViewModel.combatStats.defense);
        setText(documentRef, 'combat-max-hit', combatTabViewModel.combatStats.strength);

        const styleOptionsById = {};
        const styleOptions = Array.isArray(combatTabViewModel.styleOptions) ? combatTabViewModel.styleOptions : [];
        styleOptions.forEach((entry) => {
            if (entry && entry.styleId) styleOptionsById[entry.styleId] = entry;
        });
        updateCombatStyleButtonState(documentRef.getElementById('combat-style-attack'), !!(styleOptionsById.attack && styleOptionsById.attack.active));
        updateCombatStyleButtonState(documentRef.getElementById('combat-style-strength'), !!(styleOptionsById.strength && styleOptionsById.strength.active));
        updateCombatStyleButtonState(documentRef.getElementById('combat-style-defense'), !!(styleOptionsById.defense && styleOptionsById.defense.active));
        return true;
    }

    function updateInventoryHitpointsHud(context = {}) {
        const documentRef = getDocument(context);
        if (!documentRef || typeof documentRef.getElementById !== 'function') return false;
        const hitpointsTextEl = documentRef.getElementById('inventory-hitpoints-text');
        const hitpointsBarFillEl = documentRef.getElementById('inventory-hitpoints-bar-fill');
        if (!hitpointsTextEl || !hitpointsBarFillEl) return false;

        const currentHitpoints = typeof context.getCurrentHitpoints === 'function' ? context.getCurrentHitpoints() : 0;
        const maxHitpoints = typeof context.getMaxHitpoints === 'function' ? context.getMaxHitpoints() : currentHitpoints;
        const playerSkills = context.playerSkills || {};
        const hitpointsLevel = playerSkills && playerSkills.hitpoints && Number.isFinite(playerSkills.hitpoints.level)
            ? Math.max(1, Math.floor(playerSkills.hitpoints.level))
            : maxHitpoints;
        const fillPercent = Math.max(0, Math.min(100, (currentHitpoints / Math.max(1, maxHitpoints)) * 100));

        hitpointsTextEl.innerText = `${currentHitpoints} / ${hitpointsLevel}`;
        hitpointsBarFillEl.style.width = `${fillPercent}%`;
        return true;
    }

    function updateStats(context = {}) {
        const documentRef = getDocument(context);
        const uiDomainRuntime = context.uiDomainRuntime || window.UiDomainRuntime || null;
        const playerSkills = context.playerSkills || {};
        const equipment = context.equipment || {};
        const playerState = context.playerState || {};
        const combatTabViewModel = uiDomainRuntime && typeof uiDomainRuntime.buildCombatTabViewModel === 'function'
            ? uiDomainRuntime.buildCombatTabViewModel({ playerSkills, equipment, playerState })
            : null;
        const statsViewModel = combatTabViewModel && combatTabViewModel.combatStats
            ? combatTabViewModel.combatStats
            : (uiDomainRuntime && typeof uiDomainRuntime.buildCombatStatsViewModel === 'function'
                ? uiDomainRuntime.buildCombatStatsViewModel({ playerSkills, equipment, playerState })
                : { attack: 0, defense: 0, strength: 0 });

        setText(documentRef, 'stat-atk', statsViewModel.attack);
        setText(documentRef, 'stat-def', statsViewModel.defense);
        setText(documentRef, 'stat-str', statsViewModel.strength);
        updateInventoryHitpointsHud(context);
        updateCombatTab(context, combatTabViewModel);
        return true;
    }

    window.WorldStatusHudRuntime = {
        updateCombatStyleButtonState,
        updateCombatTab,
        updateInventoryHitpointsHud,
        updateStats
    };
})();
