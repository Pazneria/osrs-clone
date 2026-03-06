(function () {
    const SKILL_ID = 'runecrafting';
    const XP_PER_ESSENCE = 8;

    function isEmberAltar(context) {
        if (!context || context.targetObj !== 'ALTAR_CANDIDATE') return false;
        if (!context.hitData) return true;
        return context.hitData.name === 'Ember Altar';
    }

    const runecraftingModule = {
        canStart(context) {
            return isEmberAltar(context) && context.getInventoryCount('rune_essence') > 0;
        },

        onStart(context) {
            if (!isEmberAltar(context)) return false;
            if (context.getInventoryCount('rune_essence') <= 0) {
                context.addChatMessage('You need rune essence to craft runes.', 'warn');
                return false;
            }
            context.startSkillingAction();
            return true;
        },

        onTick(context) {
            if (context.playerState.action !== 'SKILLING: ALTAR_CANDIDATE') return;
            if (!isEmberAltar(context)) {
                context.stopAction();
                return;
            }

            const essenceCount = context.getInventoryCount('rune_essence');
            if (essenceCount <= 0) {
                context.addChatMessage('You need rune essence to craft runes.', 'warn');
                context.stopAction();
                return;
            }

            const removed = context.removeItemsById('rune_essence', essenceCount);
            if (removed <= 0) {
                context.stopAction();
                return;
            }

            const crafted = context.giveItemById('ember_rune', removed);
            if (crafted <= 0) {
                context.addChatMessage('You cannot craft runes right now.', 'warn');
                context.stopAction();
                return;
            }

            context.addSkillXp(SKILL_ID, crafted * XP_PER_ESSENCE);
            context.addChatMessage(`You bind ${crafted} rune essence into ember runes.`, 'game');
            context.renderInventory();
            context.stopAction();
        },

        getTooltip(context) {
            if (!isEmberAltar(context)) return '';
            return '<span class="text-gray-300">Craft-rune</span> <span class="text-orange-300">Ember Altar</span>';
        },

        getContextMenu(context) {
            if (!isEmberAltar(context)) return null;
            return [
                {
                    text: 'Craft-rune <span class="text-orange-300">Ember Altar</span>',
                    onSelect: () => {
                        context.queueInteract();
                        context.spawnClickMarker(true);
                    }
                },
                {
                    text: 'Examine <span class="text-orange-300">Ember Altar</span>',
                    onSelect: () => console.log('EXAMINING: An altar pulsing with ember energy.')
                }
            ];
        }
    };

    window.SkillModules = window.SkillModules || {};
    window.SkillModules[SKILL_ID] = runecraftingModule;
})();
