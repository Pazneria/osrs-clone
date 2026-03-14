(function () {
    const DEFAULT_PRIORITY = 100;
    const DEFAULT_EXAMINE_TEXT = 'Nothing unusual.';

    const TARGET_INTERACTION_SPECS = {
        TREE: {
            priority: 100,
            guards: [hasGridHit],
            actions: function resolveTreeActions(context) {
                if (context.getTileIdAtHit() !== context.tileIds.TREE) return [];
                return [
                    createOption('Chop down Tree', () => context.queueInteract('TREE'))
                ];
            },
            examine: function resolveTreeExamine(context) {
                const tileId = context.getTileIdAtHit();
                if (tileId === context.tileIds.TREE) {
                    return createOption('Examine Tree', () => context.examineTarget('TREE', 'A fully grown tree.'));
                }
                if (tileId === context.tileIds.STUMP) {
                    return createOption('Examine Stump', () => context.examineTarget('STUMP', 'A sad reminder of a tree.'));
                }
                return null;
            }
        },
        ROCK: {
            priority: 100,
            guards: [hasGridHit],
            actions: [
                function resolveRockMineAction(context) {
                    return createOption('Mine Rock', () => context.queueInteract('ROCK'));
                }
            ],
            examine: function resolveRockExamine(context) {
                return createOption('Examine Rock', () => context.examineTarget('ROCK', 'A solid chunk of rock.'));
            }
        },
        FIRE: {
            priority: 100,
            guards: [hasGridHit],
            actions: [
                function resolveFireUseAction(context) {
                    if (!context.selectedCookable || !context.selectedItem || !Number.isInteger(context.selectedUseInvIndex)) return null;
                    const selectedName = context.selectedItem.name || 'Item';
                    return createOption(
                        `Use <span class="text-[#ff981f]">${selectedName}</span> -> <span class="text-orange-300">Fire</span>`,
                        () => {
                            const used = context.tryUseSelectedItemOnHit();
                            if (used) context.spawnActionMarker();
                            context.clearSelectedUse();
                        }
                    );
                }
            ],
            examine: function resolveFireExamine(context) {
                return createOption('Examine <span class="text-orange-300">Fire</span>', () => context.examineTarget('FIRE', 'A hot campfire.'));
            }
        },
        FURNACE: {
            priority: 100,
            guards: [hasGridHit],
            actions: [
                function resolveFurnaceAction(context) {
                    return createOption(
                        'Smelt <span class="text-orange-300">Furnace</span>',
                        () => context.queueInteract('FURNACE', { skillId: 'smithing', stationType: 'FURNACE' })
                    );
                }
            ],
            examine: function resolveFurnaceExamine(context) {
                return createOption(
                    'Examine <span class="text-orange-300">Furnace</span>',
                    () => context.examineTarget('FURNACE', 'A roaring smithing furnace.')
                );
            }
        },
        ANVIL: {
            priority: 100,
            guards: [hasGridHit],
            actions: [
                function resolveAnvilAction(context) {
                    return createOption(
                        'Forge <span class="text-slate-300">Anvil</span>',
                        () => context.queueInteract('ANVIL', { skillId: 'smithing', stationType: 'ANVIL' })
                    );
                }
            ],
            examine: function resolveAnvilExamine(context) {
                return createOption(
                    'Examine <span class="text-slate-300">Anvil</span>',
                    () => context.examineTarget('ANVIL', 'A solid anvil for forging metal.')
                );
            }
        },
        BANK_BOOTH: {
            priority: 100,
            guards: [hasGridHit],
            actions: [
                function resolveBankAction(context) {
                    return createOption('Bank <span class="text-cyan-400">Bank Booth</span>', () => context.queueInteract('BANK_BOOTH'));
                }
            ],
            examine: function resolveBankExamine(context) {
                return createOption(
                    'Examine <span class="text-cyan-400">Bank Booth</span>',
                    () => context.examineTarget('BANK_BOOTH', 'A safe place for your valuables.')
                );
            }
        },
        ENEMY: {
            priority: 100,
            guards: [hasGridHit],
            actions: [
                function resolveEnemyAction(context) {
                    const enemyName = context.hitData && context.hitData.name ? context.hitData.name : 'Enemy';
                    const enemyId = context.hitData ? context.hitData.uid : null;
                    return createOption(
                        `Attack <span class="text-white">${enemyName}</span>`,
                        () => context.queueInteract('ENEMY', {
                            enemyId,
                            enemyX: context.hitData.gridX,
                            enemyY: context.hitData.gridY,
                            name: enemyName
                        })
                    );
                }
            ],
            examine: function resolveEnemyExamine(context) {
                const enemyName = context.hitData && context.hitData.name ? context.hitData.name : 'Enemy';
                return createOption(
                    `Examine <span class="text-white">${enemyName}</span>`,
                    () => context.examineTarget('ENEMY', 'It looks ready for a fight.', { name: enemyName })
                );
            }
        },
        SHOP_COUNTER: {
            priority: 100,
            guards: [hasGridHit],
            actions: [],
            examine: function resolveShopCounterExamine(context) {
                return createOption('Examine Shop Counter', () => context.examineTarget('SHOP_COUNTER', 'A counter built for haggling.'));
            }
        },
        DOOR: {
            priority: 100,
            guards: [hasGridHit],
            actions: [
                function resolveDoorAction(context) {
                    const doorObj = context.hitData && context.hitData.doorObj ? context.hitData.doorObj : null;
                    if (!doorObj) return null;
                    const action = doorObj.isOpen ? 'Close' : 'Open';
                    return createOption(
                        `${action} <span class="text-white">Door</span>`,
                        () => context.queueInteract('DOOR', doorObj)
                    );
                }
            ],
            examine: function resolveDoorExamine(context) {
                return createOption('Examine <span class="text-white">Door</span>', () => context.examineTarget('DOOR', 'A sturdy wooden door.'));
            }
        },
        STAIRS_UP: {
            priority: 100,
            guards: [hasGridHit],
            actions: [
                function resolveStairsUpAction(context) {
                    return createOption('Climb-up <span class="text-cyan-400">Stairs</span>', () => context.queueInteract('STAIRS_UP'));
                }
            ],
            examine: null
        },
        STAIRS_DOWN: {
            priority: 100,
            guards: [hasGridHit],
            actions: [
                function resolveStairsDownAction(context) {
                    return createOption('Climb-down <span class="text-cyan-400">Stairs</span>', () => context.queueInteract('STAIRS_DOWN'));
                }
            ],
            examine: null
        },
        NPC: {
            priority: 100,
            guards: [hasGridHit],
            actions: [
                function resolveNpcPrimaryAction(context) {
                    const hitData = context.hitData || {};
                    const npcUid = hitData.uid && typeof hitData.uid === 'object' ? hitData.uid : null;
                    const npcName = typeof hitData.name === 'string' ? hitData.name : 'NPC';
                    const npcAction = (npcUid && typeof npcUid.action === 'string')
                        ? npcUid.action
                        : (npcName === 'Shopkeeper' ? 'Trade' : 'Talk-to');

                    if (npcAction === 'Trade') {
                        if (npcName === 'Shopkeeper' && !(npcUid && npcUid.merchantId)) {
                            return createOption(
                                `Trade <span class="text-yellow-400">${npcName}</span> (General Store)`,
                                () => context.queueInteract('NPC', { name: npcName, action: 'Trade', merchantId: 'general_store' })
                            );
                        }
                        const tradeTarget = npcUid ? Object.assign({}, npcUid) : { name: npcName, action: 'Trade' };
                        return createOption(
                            `Trade <span class="text-yellow-400">${npcName}</span>`,
                            () => context.queueInteract('NPC', tradeTarget)
                        );
                    }

                    if (npcAction === 'Travel') {
                        const travelTarget = npcUid ? Object.assign({}, npcUid) : { name: npcName, action: 'Travel' };
                        return createOption(
                            `Travel <span class="text-yellow-400">${npcName}</span>`,
                            () => context.queueInteract('NPC', travelTarget)
                        );
                    }

                    const talkTarget = npcUid ? Object.assign({}, npcUid) : { name: npcName, action: 'Talk-to' };
                    return createOption(
                        `Talk-to <span class="text-yellow-400">${npcName}</span>`,
                        () => context.queueInteract('NPC', talkTarget)
                    );
                }
            ],
            examine: function resolveNpcExamine(context) {
                const npcName = context.hitData && context.hitData.name ? context.hitData.name : 'NPC';
                return createOption(
                    `Examine <span class="text-yellow-400">${npcName}</span>`,
                    () => context.examineNpc(npcName, 'Nothing unusual.')
                );
            }
        },
        GROUND_ITEM: {
            priority: 100,
            guards: [hasGridHit],
            actions: [
                function resolveGroundItemTakeAction(context) {
                    const groundName = context.formatGroundItemDisplayName(context.hitData);
                    return createOption(
                        `Take <span class="text-[#ff981f]">${groundName}</span>`,
                        () => context.queueInteract('GROUND_ITEM', context.hitData ? context.hitData.uid : null)
                    );
                }
            ],
            examine: function resolveGroundItemExamine(context) {
                const hitData = context.hitData || {};
                const groundName = context.formatGroundItemDisplayName(hitData);
                return createOption(
                    `Examine <span class="text-[#ff981f]">${groundName}</span>`,
                    () => {
                        const groundEntry = context.getGroundItemByUid(hitData.uid);
                        const groundItemId = groundEntry && groundEntry.itemData ? groundEntry.itemData.id : null;
                        context.examineItem(groundItemId, groundName, 'Looks useful.');
                    }
                );
            }
        }
    };

    function hasGridHit(context) {
        const hitData = context && context.hitData ? context.hitData : null;
        return !!(hitData && Number.isInteger(hitData.gridX) && Number.isInteger(hitData.gridY));
    }

    function createOption(text, onSelect, priority = DEFAULT_PRIORITY) {
        if (typeof text !== 'string' || typeof onSelect !== 'function') return null;
        return {
            text,
            onSelect,
            priority: Number.isFinite(priority) ? priority : DEFAULT_PRIORITY
        };
    }

    function normalizeOptions(value, fallbackPriority) {
        if (!value) return [];
        const list = Array.isArray(value) ? value : [value];
        const out = [];
        for (let i = 0; i < list.length; i++) {
            const option = list[i];
            if (!option || typeof option.text !== 'string' || typeof option.onSelect !== 'function') continue;
            out.push({
                text: option.text,
                onSelect: option.onSelect,
                priority: Number.isFinite(option.priority) ? option.priority : fallbackPriority
            });
        }
        return out;
    }

    function runGuardList(guards, context) {
        if (!Array.isArray(guards) || guards.length === 0) return true;
        for (let i = 0; i < guards.length; i++) {
            const guard = guards[i];
            if (typeof guard !== 'function') continue;
            if (!guard(context)) return false;
        }
        return true;
    }

    function evaluateResolver(resolver, context, fallbackPriority) {
        if (!resolver) return [];
        if (typeof resolver === 'function') return normalizeOptions(resolver(context), fallbackPriority);
        if (Array.isArray(resolver)) {
            const combined = [];
            for (let i = 0; i < resolver.length; i++) {
                const segment = resolver[i];
                if (!segment) continue;
                if (typeof segment === 'function') combined.push.apply(combined, normalizeOptions(segment(context), fallbackPriority));
                else combined.push.apply(combined, normalizeOptions(segment, fallbackPriority));
            }
            return combined;
        }
        return normalizeOptions(resolver, fallbackPriority);
    }

    function resolveOptions(hitData, context = {}) {
        if (!hitData || typeof hitData.type !== 'string') return [];
        const targetType = hitData.type;
        const spec = TARGET_INTERACTION_SPECS[targetType];
        if (!spec) return [];

        const scope = Object.assign({}, context, { hitData });
        if (!runGuardList(spec.guards, scope)) return [];

        const basePriority = Number.isFinite(spec.priority) ? spec.priority : DEFAULT_PRIORITY;
        const actionOptions = evaluateResolver(spec.actions, scope, basePriority);
        const examineOptions = evaluateResolver(spec.examine, scope, basePriority + 1);
        const merged = actionOptions.concat(examineOptions);
        merged.sort((a, b) => a.priority - b.priority);
        return merged.map((option) => ({ text: option.text, onSelect: option.onSelect }));
    }

    function registerTargetInteractionSpec(targetType, spec) {
        const key = String(targetType || '').trim().toUpperCase();
        if (!key || !spec || typeof spec !== 'object') return false;
        const normalized = {
            priority: Number.isFinite(spec.priority) ? spec.priority : DEFAULT_PRIORITY,
            guards: Array.isArray(spec.guards) ? spec.guards.slice() : [],
            actions: spec.actions || [],
            examine: spec.examine || null
        };
        TARGET_INTERACTION_SPECS[key] = normalized;
        return true;
    }

    function getSpec(targetType) {
        const key = String(targetType || '').trim().toUpperCase();
        if (!key) return null;
        return TARGET_INTERACTION_SPECS[key] || null;
    }

    window.TargetInteractionRegistry = {
        DEFAULT_EXAMINE_TEXT,
        registerTargetInteractionSpec,
        resolveOptions,
        getSpec
    };
})();
