(function () {
    const SKILL_ID = 'mining';
    const MINING_CHANCE = 0.25;
    const MINING_XP = 25;
    const DEPLETION_CHANCE = 0.2;

    const miningModule = {
        canStart(context) {
            return context.hasToolClass('pickaxe') && context.isTargetTile(2);
        },

        onStart(context) {
            if (!this.canStart(context)) return false;
            context.autoEquipToolClass('pickaxe');
            context.startSkillingAction();
            return true;
        },

        onTick(context) {
            if (!context.isTargetTile(2)) {
                context.stopAction();
                return;
            }

            if (!(window.SkillSharedUtils && SkillSharedUtils.rollChance(MINING_CHANCE, context.random))) return;

            const oreId = context.random() < 0.5 ? 'copper_ore' : 'tin_ore';
            if (context.giveItemById(oreId, 1) > 0) {
                context.addSkillXp(SKILL_ID, MINING_XP);
                if (window.SkillSharedUtils && SkillSharedUtils.rollChance(DEPLETION_CHANCE, context.random)) {
                    context.depleteRockNode(context.targetX, context.targetY, context.targetZ, 12);
                    context.stopAction();
                }
            } else {
                context.stopAction();
            }
        },

        onAnimate(context) {
            if (!context.rig || typeof context.applyRockMiningPose !== 'function') return;
            const isPickaxeEquipped = !!(context.equipment && context.equipment.weapon && context.equipment.weapon.weaponClass === 'pickaxe');
            context.applyRockMiningPose(context.rig, context.frameNow, context.baseVisualY, isPickaxeEquipped);
        },

        getTooltip(context) {
            if (!context.isTargetTile(2)) return '';
            return '<span class="text-gray-300">Mine</span> <span class="text-cyan-400">Rock</span>';
        },

        getContextMenu(context) {
            if (!context.isTargetTile(2)) {
                return [{ text: 'Examine Rock', onSelect: () => console.log('EXAMINING: A solid chunk of rock.') }];
            }

            return [
                {
                    text: 'Mine Rock',
                    onSelect: () => {
                        context.queueInteract();
                        context.spawnClickMarker(true);
                    }
                },
                { text: 'Examine Rock', onSelect: () => console.log('EXAMINING: A solid chunk of rock.') }
            ];
        }
    };

    window.SkillModules = window.SkillModules || {};
    window.SkillModules[SKILL_ID] = miningModule;
})();
