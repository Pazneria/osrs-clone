(function () {
    const MAX_SKILL_LEVEL = 99;

    const DEFAULT_SKILL_TILE_LEVEL_KEYS = {
        attack: 'atk',
        hitpoints: 'hp',
        mining: 'min',
        strength: 'str',
        defense: 'def',
        woodcutting: 'wc',
        firemaking: 'fm',
        fishing: 'fish',
        cooking: 'cook',
        runecrafting: 'rc',
        smithing: 'smith',
        crafting: 'craft',
        fletching: 'fletch'
    };

    function getXpForLevel(level) {
        const clamped = Math.max(1, Math.min(MAX_SKILL_LEVEL, level));
        let points = 0;
        for (let lvl = 1; lvl < clamped; lvl++) {
            points += Math.floor(lvl + 300 * Math.pow(2, lvl / 7));
        }
        return Math.floor(points / 4);
    }

    function getLevelForXp(xp) {
        let level = 1;
        for (let lvl = 2; lvl <= MAX_SKILL_LEVEL; lvl++) {
            if (xp >= getXpForLevel(lvl)) level = lvl;
            else break;
        }
        return level;
    }

    function initializeSkillLevels(playerSkills) {
        if (!playerSkills || typeof playerSkills !== 'object') return;
        Object.keys(playerSkills).forEach((skillName) => {
            const skill = playerSkills[skillName];
            if (!skill || typeof skill !== 'object') return;
            skill.level = getLevelForXp(skill.xp);
        });
    }

    function getSkillUiLevelKey(skillName, manifest = window.SkillManifest) {
        if (!skillName) return null;
        if (manifest && manifest.skillTileBySkillId && manifest.skillTileBySkillId[skillName]) {
            const levelKey = manifest.skillTileBySkillId[skillName].levelKey;
            if (typeof levelKey === 'string' && levelKey) return levelKey;
        }
        return DEFAULT_SKILL_TILE_LEVEL_KEYS[skillName] || null;
    }

    function showXPDrop(skill, amount, options = {}) {
        const documentRef = options.document || document;
        if (!documentRef || typeof documentRef.getElementById !== 'function' || typeof documentRef.createElement !== 'function') return null;
        const container = documentRef.getElementById('xp-drop-container');
        if (!container || typeof container.appendChild !== 'function') return null;
        const drop = documentRef.createElement('div');
        drop.className = 'xp-drop text-[#ff9800] font-bold text-md';
        drop.innerText = `${skill} +${amount}xp`;
        container.appendChild(drop);
        const timeout = typeof options.setTimeout === 'function' ? options.setTimeout : setTimeout;
        timeout(() => {
            if (drop && typeof drop.remove === 'function') drop.remove();
        }, 2000);
        return drop;
    }

    function refreshSkillUi(context = {}, skillName) {
        const playerSkills = context.playerSkills || {};
        const skill = playerSkills[skillName];
        const key = getSkillUiLevelKey(skillName, context.skillManifest || window.SkillManifest);
        if (!key || !skill) return false;

        const documentRef = context.document || document;
        const uiEl = documentRef && typeof documentRef.getElementById === 'function'
            ? documentRef.getElementById(`stat-${key}-level`)
            : null;
        if (uiEl) uiEl.innerText = skill.level;

        if (typeof context.updateSkillProgressPanel === 'function') {
            context.updateSkillProgressPanel(skillName);
        }
        return true;
    }

    function addSkillXp(context = {}, skillName, amount) {
        const playerSkills = context.playerSkills || {};
        const skill = playerSkills[skillName];
        if (!skill) return false;

        const oldLevel = skill.level;
        skill.xp += amount;
        skill.level = getLevelForXp(skill.xp);
        showXPDrop(skillName, amount, {
            document: context.document,
            setTimeout: context.setTimeout
        });

        if (skill.level > oldLevel) {
            if (typeof context.playLevelUpAnimation === 'function') context.playLevelUpAnimation(8, context.playerRig);
            if (typeof context.addChatMessage === 'function') {
                context.addChatMessage(`${skillName} level is now ${skill.level}.`, 'info');
            }
        }
        refreshSkillUi(context, skillName);
        return true;
    }

    window.SkillProgressRuntime = {
        MAX_SKILL_LEVEL,
        addSkillXp,
        getLevelForXp,
        getSkillUiLevelKey,
        getXpForLevel,
        initializeSkillLevels,
        refreshSkillUi,
        showXPDrop
    };
})();
