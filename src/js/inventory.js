// --- Bank & Drag/Drop Logic ---

        let activeBankSource = 'unknown_bank';

        function setActiveBankSource(sourceKey) {
            activeBankSource = typeof sourceKey === 'string' && sourceKey ? sourceKey : 'unknown_bank';
        }

        window.setActiveBankSource = setActiveBankSource;

        function getUiDomainRuntime() {
            return window.UiDomainRuntime || null;
        }

        function getInventoryTooltipRuntime() {
            return window.InventoryTooltipRuntime || null;
        }

        function getQuestLogRuntime() {
            return window.QuestLogRuntime || null;
        }

        function buildInventorySlotViewModels() {
            const runtime = getUiDomainRuntime();
            if (runtime && typeof runtime.buildInventorySlotViewModels === 'function') {
                return runtime.buildInventorySlotViewModels({
                    inventory,
                    selectedUse: getSelectedUseItem()
                        ? { invIndex: selectedUse.invIndex, itemId: selectedUse.itemId }
                        : { invIndex: null, itemId: null }
                });
            }
            return [];
        }

        function buildBankSlotViewModels() {
            const runtime = getUiDomainRuntime();
            if (runtime && typeof runtime.buildBankSlotViewModels === 'function') {
                return runtime.buildBankSlotViewModels(bankItems);
            }
            return [];
        }

        function buildShopSlotViewModels() {
            const runtime = getUiDomainRuntime();
            if (runtime && typeof runtime.buildShopSlotViewModels === 'function') {
                return runtime.buildShopSlotViewModels({
                    shopInventory,
                    merchantId: activeShopMerchantId,
                    itemDb: ITEM_DB,
                    economy: getShopEconomy()
                });
            }
            return [];
        }

        function buildEquipmentSlotViewModels() {
            const runtime = getUiDomainRuntime();
            if (runtime && typeof runtime.buildEquipmentSlotViewModels === 'function') {
                return runtime.buildEquipmentSlotViewModels({
                    slots: ['head', 'cape', 'neck', 'weapon', 'body', 'shield', 'legs', 'hands', 'feet', 'ring'],
                    equipment
                });
            }
            return [];
        }

        function openBank() {
            isBankOpen = true;
            setInterfaceOpenState('bank-interface', true);
            renderBank();
            renderInventory();
        }

        function closeBank() {
            isBankOpen = false;
            setInterfaceOpenState('bank-interface', false);
            renderInventory();
        }

        window.openBank = openBank;
        window.closeBank = closeBank;

        function formatStackSize(num, placementClass = '') {
            if (num <= 1) return '';
            let text = num.toString();
            let colorClass = 'amt-yellow';
            if (num >= 10000000) {
                text = Math.floor(num / 1000000) + 'M';
                colorClass = 'amt-green';
            } else if (num >= 100000) {
                text = Math.floor(num / 1000) + 'K';
                colorClass = 'amt-white';
            }
            const classes = ['item-amt', colorClass];
            if (placementClass) classes.push(placementClass);
            return `<span class="${classes.join(' ')}">${text}</span>`;
        }

        function buildInventoryTooltipOptions() {
            const avoidRects = [];
            if (contextMenuEl && !contextMenuEl.classList.contains('hidden')) avoidRects.push(contextMenuEl.getBoundingClientRect());
            const swapSubmenu = document.getElementById('context-swap-left-click-submenu');
            if (swapSubmenu && !swapSubmenu.classList.contains('hidden')) avoidRects.push(swapSubmenu.getBoundingClientRect());
            return {
                documentRef: document,
                windowRef: window,
                avoidRects
            };
        }

        function hideInventoryHoverTooltip() {
            const runtime = getInventoryTooltipRuntime();
            if (runtime && typeof runtime.hideInventoryHoverTooltip === 'function') {
                runtime.hideInventoryHoverTooltip(buildInventoryTooltipOptions());
            }
        }

        function escapeTooltipHtml(value) {
            const runtime = getInventoryTooltipRuntime();
            return runtime && typeof runtime.escapeTooltipHtml === 'function'
                ? runtime.escapeTooltipHtml(value)
                : String(value == null ? '' : value);
        }

        function buildItemTooltipText(item, options = {}) {
            const runtime = getInventoryTooltipRuntime();
            return runtime && typeof runtime.buildItemTooltipText === 'function'
                ? runtime.buildItemTooltipText(item, options)
                : '';
        }

        function buildItemTooltipHtml(item, options = {}) {
            const runtime = getInventoryTooltipRuntime();
            return runtime && typeof runtime.buildItemTooltipHtml === 'function'
                ? runtime.buildItemTooltipHtml(item, options)
                : '';
        }

        function bindInventorySlotTooltip(slot, text, html = '') {
            const runtime = getInventoryTooltipRuntime();
            if (runtime && typeof runtime.bindInventorySlotTooltip === 'function') {
                runtime.bindInventorySlotTooltip(Object.assign(buildInventoryTooltipOptions(), {
                    slot,
                    text,
                    html
                }));
            }
        }

        function setInterfaceOpenState(interfaceId, isOpen) {
            const interfaceEl = document.getElementById(interfaceId);
            if (!interfaceEl) return;
            interfaceEl.classList.toggle('hidden', !isOpen);
            document.getElementById('main-ui-container').style.zIndex = isOpen ? '250' : 'auto';
            if (isOpen) document.getElementById('tab-inv').click();
        }

        function getItemMenuPreferenceKey(scope, itemId) {
            return `${scope || 'inventory'}:${itemId || ''}`;
        }

        function getPreferredMenuAction(prefKey, actions) {
            if (!Array.isArray(actions) || actions.length === 0) return null;
            const preferred = (prefKey && userItemPrefs && typeof userItemPrefs[prefKey] === 'string')
                ? userItemPrefs[prefKey]
                : null;
            return (preferred && actions.includes(preferred)) ? preferred : actions[0];
        }

        function setPreferredMenuAction(prefKey, actionName) {
            if (!prefKey || !actionName) return;
            userItemPrefs[prefKey] = actionName;
        }

        function clearItemSwapLeftClickUI() {
            const trigger = document.getElementById('context-swap-left-click-trigger');
            if (trigger && trigger.parentNode) trigger.parentNode.removeChild(trigger);
            const submenu = document.getElementById('context-swap-left-click-submenu');
            if (submenu && submenu.parentNode) submenu.parentNode.removeChild(submenu);
        }

        function appendSwapLeftClickControl(prefKey, actions, onSelect, currentLabel = null) {
            if (!prefKey || !Array.isArray(actions) || actions.length === 0) return;
            clearItemSwapLeftClickUI();

            const cancelRow = contextMenuEl.querySelector('.context-cancel');
            if (!cancelRow) return;

            const trigger = document.createElement('div');
            trigger.id = 'context-swap-left-click-trigger';
            trigger.className = 'context-swap-trigger';
            trigger.innerHTML = `<span>Swap left click</span><span class="context-swap-caret">&#9654;</span>`;
            cancelRow.insertAdjacentElement('afterend', trigger);

            const submenu = document.createElement('div');
            submenu.id = 'context-swap-left-click-submenu';
            submenu.className = 'context-submenu hidden';

            const selectedAction = currentLabel || getPreferredMenuAction(prefKey, actions);
            actions.forEach((actionName) => {
                const option = document.createElement('div');
                option.className = 'context-option';
                option.textContent = actionName;
                if (actionName === selectedAction) option.classList.add('context-option-selected');
                option.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPreferredMenuAction(prefKey, actionName);
                    if (typeof onSelect === 'function') onSelect(actionName);
                    closeContextMenu();
                };
                submenu.appendChild(option);
            });

            document.body.appendChild(submenu);

            const positionSubmenu = () => {
                submenu.classList.remove('hidden');
                submenu.style.left = '0px';
                submenu.style.top = '0px';
                const triggerRect = trigger.getBoundingClientRect();
                const menuW = submenu.offsetWidth || 160;
                const menuH = submenu.offsetHeight || 120;
                const pad = 8;
                let x = triggerRect.right;
                if (x + menuW > window.innerWidth - pad) x = triggerRect.left - menuW;
                let y = triggerRect.top;
                if (y + menuH > window.innerHeight - pad) y = window.innerHeight - menuH - pad;
                if (y < pad) y = pad;
                submenu.style.left = `${x}px`;
                submenu.style.top = `${y}px`;
            };

            trigger.addEventListener('mouseenter', positionSubmenu);
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                positionSubmenu();
            });

            submenu.addEventListener('mouseleave', (e) => {
                const related = e.relatedTarget;
                if (related && related.closest && (related.closest('#context-menu') || related.closest('.context-submenu'))) return;
                closeContextMenu();
            });
        }

        window.clearItemSwapLeftClickUI = clearItemSwapLeftClickUI;
        window.appendSwapLeftClickControl = appendSwapLeftClickControl;
        window.getItemMenuPreferenceKey = getItemMenuPreferenceKey;
        window.getPreferredMenuAction = getPreferredMenuAction;
        window.hideInventoryHoverTooltip = hideInventoryHoverTooltip;

        let rememberedDepositXAmount = null;

        function collectMatchingInventorySlots(itemId, preferredIndex, maxCount) {
            const runtime = getUiDomainRuntime();
            if (runtime && typeof runtime.collectMatchingSlotIndexes === 'function') {
                return runtime.collectMatchingSlotIndexes(inventory, itemId, preferredIndex, maxCount);
            }
            return [];
        }

        function renderBank() {
            const container = document.getElementById('bank-grid');
            hideInventoryHoverTooltip();
            container.innerHTML = '';
            let usedSlots = 0;
            const bankSlotViewModels = buildBankSlotViewModels();
            
            for (let i = 0; i < 200; i++) {
                const slot = document.createElement('div');
                slot.className = 'w-9 h-9 bg-[#231e18] border-b-2 border-r-2 border-[#15120e] border-t border-l border-[#4a4136] flex items-center justify-center text-xl cursor-pointer hover:bg-[#2b251d] select-none relative group transition-colors';
                const bItem = bankItems[i];
                const bankViewModel = bankSlotViewModels[i] || null;
                
                slot.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
                slot.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const data = JSON.parse(e.dataTransfer.getData('application/json'));
                    handleDragDrop(data.source, data.index, 'bank', i);
                });
                    if (bItem) {
                    usedSlots++;
                    slot.innerHTML = `${bankViewModel ? bankViewModel.icon : bItem.itemData.icon}${formatStackSize(bankViewModel ? bankViewModel.amount : bItem.amount)}`;
                    bindInventorySlotTooltip(
                        slot,
                        buildItemTooltipText(bItem.itemData, { amount: bankViewModel ? bankViewModel.amount : bItem.amount }),
                        buildItemTooltipHtml(bItem.itemData, { amount: bankViewModel ? bankViewModel.amount : bItem.amount })
                    );
                    
                    slot.draggable = true;
                    slot.addEventListener('dragstart', (e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify({ source: 'bank', index: i }));
                        e.dataTransfer.effectAllowed = 'move';
                        slot.style.opacity = '0.4';
                    });
                    slot.addEventListener('dragend', () => { slot.style.opacity = '1'; });
                    const bankActionPrefKey = getItemMenuPreferenceKey('bank', bItem.itemData.id);
                    const bankActions = ['Withdraw-1', 'Withdraw-5', 'Withdraw-10', 'Withdraw-All', 'Withdraw-X'];
                    const runBankAction = (actionName) => {
                        if (actionName === 'Withdraw-1') withdrawBankItem(i, 1);
                        else if (actionName === 'Withdraw-5') withdrawBankItem(i, 5);
                        else if (actionName === 'Withdraw-10') withdrawBankItem(i, 10);
                        else if (actionName === 'Withdraw-All') withdrawBankItem(i, bItem.amount);
                        else if (actionName === 'Withdraw-X') promptAmount((amt) => withdrawBankItem(i, amt));
                    };

                    slot.onclick = () => {
                        const defaultAction = getPreferredMenuAction(bankActionPrefKey, bankActions);
                    if (defaultAction) runBankAction(defaultAction);
                    };

                    slot.oncontextmenu = (e) => {
                        e.preventDefault(); e.stopPropagation(); closeContextMenu();
                        clearContextMenuOptions();
                        addContextMenuOption(`Withdraw-1 <span class="text-white">${bItem.itemData.name}</span>`, () => runBankAction('Withdraw-1'));
                        addContextMenuOption(`Withdraw-5 <span class="text-white">${bItem.itemData.name}</span>`, () => runBankAction('Withdraw-5'));
                        addContextMenuOption(`Withdraw-10 <span class="text-white">${bItem.itemData.name}</span>`, () => runBankAction('Withdraw-10'));
                        addContextMenuOption(`Withdraw-All <span class="text-white">${bItem.itemData.name}</span>`, () => runBankAction('Withdraw-All'));
                        addContextMenuOption(`Withdraw-X <span class="text-white">${bItem.itemData.name}</span>`, () => runBankAction('Withdraw-X'));
                        showContextMenuAt(e.clientX, e.clientY);
                        appendSwapLeftClickControl(bankActionPrefKey, bankActions, () => { renderBank(); renderInventory(); });
                    };
                } else {
                    slot.oncontextmenu = (e) => e.preventDefault();
                }
                container.appendChild(slot);
            }
            document.getElementById('bank-capacity').innerText = `${usedSlots} / 200`;
        }

        function handleDragDrop(sourceType, sourceIndex, targetType, targetIndex) {
            const runtime = getUiDomainRuntime();
            if (sourceType === 'inv' && targetType === 'inv') {
                if (runtime && typeof runtime.swapSlotEntries === 'function') {
                    inventory = runtime.swapSlotEntries(inventory, sourceIndex, targetIndex);
                } else {
                    const temp = inventory[sourceIndex]; inventory[sourceIndex] = inventory[targetIndex]; inventory[targetIndex] = temp;
                }
            } else if (sourceType === 'bank' && targetType === 'bank') {
                if (runtime && typeof runtime.swapSlotEntries === 'function') {
                    bankItems = runtime.swapSlotEntries(bankItems, sourceIndex, targetIndex);
                } else {
                    const temp = bankItems[sourceIndex]; bankItems[sourceIndex] = bankItems[targetIndex]; bankItems[targetIndex] = temp;
                }
            } else if (sourceType === 'inv' && targetType === 'bank') { depositInvItem(sourceIndex, -1, targetIndex); }
            else if (sourceType === 'bank' && targetType === 'inv') { withdrawBankItem(sourceIndex, 1, targetIndex); }
            if (isBankOpen) renderBank();
            renderInventory();
        }

        function depositInvItem(invIndex, amount = -1, targetBankIndex = -1) {
            const runtime = getUiDomainRuntime();
            if (!runtime || typeof runtime.depositInventoryItem !== 'function') return;
            const beforeSlot = inventory[invIndex] || null;
            const beforeItemId = beforeSlot && beforeSlot.itemData ? beforeSlot.itemData.id : '';
            const result = runtime.depositInventoryItem({
                inventory,
                bankItems,
                invIndex,
                amount,
                targetBankIndex
            });
            inventory = result.inventory;
            bankItems = result.bankItems;
            if (result.amountChanged > 0 && window.TutorialRuntime && typeof window.TutorialRuntime.recordBankAction === 'function') {
                window.TutorialRuntime.recordBankAction('deposit', activeBankSource, beforeItemId, result.amountChanged);
            }
            if (result.reason === 'bank_full' || result.reason === 'bank_full_partial') console.log("Bank is full!");

            if(isBankOpen) renderBank(); 
            if(typeof isShopOpen !== 'undefined' && isShopOpen) renderShop(); 
            renderInventory();
        }

        function withdrawBankItem(bankIndex, amountToWithdraw, targetInvIndex = -1) {
            const runtime = getUiDomainRuntime();
            if (!runtime || typeof runtime.withdrawBankItem !== 'function') return;
            const beforeSlot = bankItems[bankIndex] || null;
            const beforeItemId = beforeSlot && beforeSlot.itemData ? beforeSlot.itemData.id : '';
            const result = runtime.withdrawBankItem({
                inventory,
                bankItems,
                bankIndex,
                amount: amountToWithdraw,
                targetInvIndex
            });
            inventory = result.inventory;
            bankItems = result.bankItems;
            if (result.amountChanged > 0 && window.TutorialRuntime && typeof window.TutorialRuntime.recordBankAction === 'function') {
                window.TutorialRuntime.recordBankAction('withdraw', activeBankSource, beforeItemId, result.amountChanged);
            }
            if (result.reason === 'inventory_full' || result.reason === 'inventory_full_partial') console.log("Inventory full.");
            if (isBankOpen) renderBank(); renderInventory();
        }

        // --- Shop Interface System ---
        let isShopOpen = false;
        let activeShopMerchantId = 'general_store';
        const shopInventoriesByMerchant = {};
        let shopInventory = Array(100).fill(null);

        function getShopEconomy() {
            return (window.ShopEconomy && typeof window.ShopEconomy.resolveBuyPrice === 'function') ? window.ShopEconomy : null;
        }

        function resolveMerchantBuyPrice(itemId) {
            const economy = getShopEconomy();
            const runtime = getUiDomainRuntime();
            if (runtime && typeof runtime.resolveMerchantBuyPrice === 'function') {
                return runtime.resolveMerchantBuyPrice(ITEM_DB, economy, itemId, activeShopMerchantId);
            }
            if (economy) return economy.resolveBuyPrice(itemId, activeShopMerchantId);
            return ITEM_DB[itemId] && Number.isFinite(ITEM_DB[itemId].value) ? ITEM_DB[itemId].value : 0;
        }

        function resolveMerchantSellPrice(itemId) {
            const economy = getShopEconomy();
            const runtime = getUiDomainRuntime();
            if (runtime && typeof runtime.resolveMerchantSellPrice === 'function') {
                return runtime.resolveMerchantSellPrice(ITEM_DB, economy, itemId, activeShopMerchantId);
            }
            if (economy) return economy.resolveSellPrice(itemId, activeShopMerchantId);
            const base = ITEM_DB[itemId] && Number.isFinite(ITEM_DB[itemId].value) ? ITEM_DB[itemId].value : 0;
            return Math.floor(base * 0.4);
        }

        function seedShopInventorySlot(inventoryArray, itemId, amount, normalStock = true) {
            if (!ITEM_DB[itemId] || !Number.isFinite(amount) || amount <= 0) return false;
            const idx = inventoryArray.indexOf(null);
            if (idx === -1) return false;
            inventoryArray[idx] = { itemData: ITEM_DB[itemId], amount: Math.floor(amount), normalStock: !!normalStock };
            return true;
        }

        function createShopInventoryForMerchant(merchantId) {
            const runtime = getUiDomainRuntime();
            if (runtime && typeof runtime.createShopInventoryForMerchant === 'function') {
                const result = runtime.createShopInventoryForMerchant({
                    merchantId,
                    inventorySize: 100,
                    itemDb: ITEM_DB,
                    economy: getShopEconomy()
                });
                if (result.warning) console.warn(result.warning);
                return result.inventory;
            }
            return Array(100).fill(null);
        }

        function ensureUnlockedMerchantStock(merchantId) {
            const runtime = getUiDomainRuntime();
            if (!runtime || typeof runtime.ensureUnlockedMerchantStock !== 'function') return;
            shopInventory = runtime.ensureUnlockedMerchantStock({
                shopInventory,
                merchantId,
                itemDb: ITEM_DB,
                economy: getShopEconomy()
            });
            shopInventoriesByMerchant[merchantId] = shopInventory;
        }

        function ensureMerchantShopInventory(merchantId) {
            const id = merchantId || 'general_store';
            if (!shopInventoriesByMerchant[id]) {
                shopInventoriesByMerchant[id] = createShopInventoryForMerchant(id);
            }
            activeShopMerchantId = id;
            shopInventory = shopInventoriesByMerchant[id];
            ensureUnlockedMerchantStock(id);
        }

        function openShop(merchantId = 'general_store') {
            if (window.QuestRuntime && typeof window.QuestRuntime.canOpenMerchantShop === 'function') {
                const access = window.QuestRuntime.canOpenMerchantShop(merchantId);
                if (!access || !access.ok) {
                    if (typeof addChatMessage === 'function' && access && access.messageText) {
                        addChatMessage(access.messageText, 'info');
                    }
                    return false;
                }
            }
            ensureMerchantShopInventory(merchantId);
            isShopOpen = true;
            setInterfaceOpenState('shop-interface', true);
            renderShop();
            renderInventory();
            return true;
        }

        function closeShop() {
            isShopOpen = false;
            setInterfaceOpenState('shop-interface', false);
            renderInventory();
        }

        window.openShopForMerchant = openShop;
        window.getActiveShopMerchantId = () => activeShopMerchantId;

        function renderShop() {
            const container = document.getElementById('shop-grid');
            hideInventoryHoverTooltip();
            container.innerHTML = '';
            const shopSlotViewModels = buildShopSlotViewModels();
            for (let i = 0; i < 100; i++) {
                const slot = document.createElement('div');
                slot.className = 'w-9 h-9 bg-[#231e18] border-b-2 border-r-2 border-[#15120e] border-t border-l border-[#4a4136] flex items-center justify-center text-xl cursor-pointer hover:bg-[#2b251d] select-none relative group transition-colors';
                const sItem = shopInventory[i];
                const shopViewModel = shopSlotViewModels[i] || null;
                if (sItem && sItem.amount > 0) {
                    slot.innerHTML = `${shopViewModel ? shopViewModel.icon : sItem.itemData.icon}${formatStackSize(shopViewModel ? shopViewModel.amount : sItem.amount)}`;
                    const buyPrice = shopViewModel ? shopViewModel.buyPrice : resolveMerchantBuyPrice(sItem.itemData.id);
                    bindInventorySlotTooltip(
                        slot,
                        buildItemTooltipText(sItem.itemData, { amount: shopViewModel ? shopViewModel.amount : sItem.amount, priceText: `Buy: ${buyPrice.toLocaleString()} coins` }),
                        buildItemTooltipHtml(sItem.itemData, { amount: shopViewModel ? shopViewModel.amount : sItem.amount, priceText: `Buy: ${buyPrice.toLocaleString()} coins` })
                    );
                    const shopActionPrefKey = getItemMenuPreferenceKey('shop', sItem.itemData.id);
                    const shopActions = ['Buy-1', 'Buy-5', 'Buy-10', 'Buy-50', 'Buy-X'];
                    const runShopAction = (actionName) => {
                        if (actionName === 'Buy-1') buyItem(i, 1);
                        else if (actionName === 'Buy-5') buyItem(i, 5);
                        else if (actionName === 'Buy-10') buyItem(i, 10);
                        else if (actionName === 'Buy-50') buyItem(i, 50);
                        else if (actionName === 'Buy-X') promptAmount((amt) => buyItem(i, amt));
                    };

                    slot.onclick = () => {
                        const defaultAction = getPreferredMenuAction(shopActionPrefKey, shopActions);
                    if (defaultAction) runShopAction(defaultAction);
                    };
                    slot.oncontextmenu = (e) => {
                        e.preventDefault(); e.stopPropagation(); closeContextMenu();
                        clearContextMenuOptions();
                        addContextMenuOption(`Value <span class="text-white">${sItem.itemData.name}</span>`, () => console.log(`${sItem.itemData.name} costs ${resolveMerchantBuyPrice(sItem.itemData.id)} coins.`));
                        addContextMenuOption(`Buy-1 <span class="text-white">${sItem.itemData.name}</span>`, () => runShopAction('Buy-1'));
                        addContextMenuOption(`Buy-5 <span class="text-white">${sItem.itemData.name}</span>`, () => runShopAction('Buy-5'));
                        addContextMenuOption(`Buy-10 <span class="text-white">${sItem.itemData.name}</span>`, () => runShopAction('Buy-10'));
                        addContextMenuOption(`Buy-50 <span class="text-white">${sItem.itemData.name}</span>`, () => runShopAction('Buy-50'));
                        addContextMenuOption(`Buy-X <span class="text-white">${sItem.itemData.name}</span>`, () => runShopAction('Buy-X'));
                        showContextMenuAt(e.clientX, e.clientY);
                        appendSwapLeftClickControl(shopActionPrefKey, shopActions, () => { renderShop(); renderInventory(); });
                    };
                } else slot.oncontextmenu = (e) => e.preventDefault();
                container.appendChild(slot);
            }
        }

        function buyItem(shopIdx, amount) {
            const runtime = getUiDomainRuntime();
            if (!runtime || typeof runtime.buyShopItem !== 'function') return;
            const result = runtime.buyShopItem({
                inventory,
                shopInventory,
                shopIndex: shopIdx,
                amount,
                merchantId: activeShopMerchantId,
                itemDb: ITEM_DB,
                economy: getShopEconomy()
            });
            inventory = result.inventory;
            shopInventory = result.shopInventory;
            shopInventoriesByMerchant[activeShopMerchantId] = shopInventory;
            if (result.reason === 'inventory_full') console.log("Inventory full!");
            else if (result.reason === 'not_enough_coins') console.log("Not enough coins!");
            else if (result.reason === 'cannot_buy_coins') console.log("You cannot buy coins.");
            renderShop(); renderInventory();
        }

        function sellItem(invIdx, amount) {
            const runtime = getUiDomainRuntime();
            if (!runtime || typeof runtime.sellInventoryItem !== 'function') return;
            const existingSlot = inventory[invIdx];
            const existingItemName = existingSlot && existingSlot.itemData ? existingSlot.itemData.name : 'That item';
            const result = runtime.sellInventoryItem({
                inventory,
                shopInventory,
                inventoryIndex: invIdx,
                amount,
                merchantId: activeShopMerchantId,
                itemDb: ITEM_DB,
                economy: getShopEconomy()
            });
            inventory = result.inventory;
            shopInventory = result.shopInventory;
            shopInventoriesByMerchant[activeShopMerchantId] = shopInventory;
            if (result.reason === 'merchant_wont_buy_item') {
                if (typeof addChatMessage === 'function') addChatMessage(existingItemName + ' cannot be sold to this merchant.', 'warn');
                return;
            }
            if (result.reason === 'item_has_no_sell_value') {
                if (typeof addChatMessage === 'function') addChatMessage(existingItemName + ' has no sell value at this merchant.', 'warn');
                return;
            }
            if (result.reason === 'cannot_sell_coins') {
                console.log("You cannot sell coins.");
                return;
            }
            if (result.unlockedNow && typeof addChatMessage === 'function') {
                addChatMessage(existingItemName + ' is now unlocked as permanent stock at this merchant.', 'info');
            }
            renderShop(); renderInventory();
        }

        // --- Render UI System ---

        function renderInventory() {
            const container = document.getElementById('view-inv');
            hideInventoryHoverTooltip();
            container.innerHTML = '';
            const inventorySlotViewModels = buildInventorySlotViewModels();
            for (let i = 0; i < 28; i++) {
                const slot = document.createElement('div');
                slot.className = 'inventory-slot';
                
                slot.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
                slot.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const data = JSON.parse(e.dataTransfer.getData('application/json'));
                    handleDragDrop(data.source, data.index, 'inv', i);
                });

                const itemDataSlot = inventory[i];
                const inventoryViewModel = inventorySlotViewModels[i] || null;
                if (inventoryViewModel && inventoryViewModel.selected) {
                    slot.classList.add('item-slot-selected');
                }
                if (itemDataSlot) {
                    const item = itemDataSlot.itemData;
                    slot.innerHTML = `<span class="inv-item-icon">${inventoryViewModel ? inventoryViewModel.icon : item.icon}</span>${formatStackSize(inventoryViewModel ? inventoryViewModel.amount : itemDataSlot.amount, 'item-amt-inv')}`;
                    slot.draggable = true;
                    slot.addEventListener('dragstart', (e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify({ source: 'inv', index: i }));
                        e.dataTransfer.effectAllowed = 'move';
                        slot.style.opacity = '0.4';
                    });
                    slot.addEventListener('dragend', () => { slot.style.opacity = '1'; });
                    if (isBankOpen) {
                        const depositActionPrefKey = getItemMenuPreferenceKey('deposit', item.id);
                        const depositActions = ['Deposit-1', 'Deposit-5', 'Deposit-10', 'Deposit-All', 'Deposit-X'];
                        const runDepositAction = (actionName, fromContextMenu = false) => {
                            if (actionName === 'Deposit-1') depositInvItem(i, 1);
                            else if (actionName === 'Deposit-5') depositInvItem(i, 5);
                            else if (actionName === 'Deposit-10') depositInvItem(i, 10);
                            else if (actionName === 'Deposit-All') depositInvItem(i, -1);
                            else if (actionName === 'Deposit-X') {
                                if (fromContextMenu || !Number.isInteger(rememberedDepositXAmount) || rememberedDepositXAmount <= 0) {
                                    promptAmount((amt) => {
                                        rememberedDepositXAmount = amt;
                                        depositInvItem(i, amt);
                                    });
                                } else {
                                    depositInvItem(i, rememberedDepositXAmount);
                                }
                            }
                        };
                        bindInventorySlotTooltip(
                            slot,
                            buildItemTooltipText(item, { amount: inventoryViewModel ? inventoryViewModel.amount : itemDataSlot.amount, actionText: 'Deposit', priceText: `Value: ${Math.floor(item.value || 0).toLocaleString()} coins` }),
                            buildItemTooltipHtml(item, { amount: inventoryViewModel ? inventoryViewModel.amount : itemDataSlot.amount, actionText: 'Deposit', priceText: `Value: ${Math.floor(item.value || 0).toLocaleString()} coins` })
                        );
                        slot.onclick = () => {
                            const defaultAction = getPreferredMenuAction(depositActionPrefKey, depositActions);
                    if (defaultAction) runDepositAction(defaultAction);
                        };
                        slot.oncontextmenu = (e) => {
                            hideInventoryHoverTooltip();
                            e.preventDefault(); e.stopPropagation(); closeContextMenu();
                            clearContextMenuOptions();
                            addContextMenuOption(`Deposit-1 <span class="text-white">${item.name}</span>`, () => runDepositAction('Deposit-1'));
                            addContextMenuOption(`Deposit-5 <span class="text-white">${item.name}</span>`, () => runDepositAction('Deposit-5'));
                            addContextMenuOption(`Deposit-10 <span class="text-white">${item.name}</span>`, () => runDepositAction('Deposit-10'));
                            addContextMenuOption(`Deposit-All <span class="text-white">${item.name}</span>`, () => runDepositAction('Deposit-All'));
                            addContextMenuOption(`Deposit-X <span class="text-white">${item.name}</span>`, () => runDepositAction('Deposit-X', true));
                            showContextMenuAt(e.clientX, e.clientY);
                            appendSwapLeftClickControl(depositActionPrefKey, depositActions, () => { renderInventory(); if (isBankOpen) renderBank(); });
                        };
                    } else if (typeof isShopOpen !== 'undefined' && isShopOpen) {
                        const sellActionPrefKey = getItemMenuPreferenceKey('sell', item.id);
                        const sellActions = ['Sell-1', 'Sell-5', 'Sell-10', 'Sell-50', 'Sell-X'];
                        const runSellAction = (actionName) => {
                            if (actionName === 'Sell-1') sellItem(i, 1);
                            else if (actionName === 'Sell-5') sellItem(i, 5);
                            else if (actionName === 'Sell-10') sellItem(i, 10);
                            else if (actionName === 'Sell-50') sellItem(i, 50);
                            else if (actionName === 'Sell-X') promptAmount((amt) => sellItem(i, amt));
                        };
                        bindInventorySlotTooltip(
                            slot,
                            buildItemTooltipText(item, { amount: inventoryViewModel ? inventoryViewModel.amount : itemDataSlot.amount, actionText: 'Sell', priceText: `Sell: ${resolveMerchantSellPrice(item.id).toLocaleString()} coins` }),
                            buildItemTooltipHtml(item, { amount: inventoryViewModel ? inventoryViewModel.amount : itemDataSlot.amount, actionText: 'Sell', priceText: `Sell: ${resolveMerchantSellPrice(item.id).toLocaleString()} coins` })
                        );
                        slot.onclick = () => {
                            const defaultAction = getPreferredMenuAction(sellActionPrefKey, sellActions);
                    if (defaultAction) runSellAction(defaultAction);
                        };
                        slot.oncontextmenu = (e) => {
                            hideInventoryHoverTooltip();
                            e.preventDefault(); e.stopPropagation(); closeContextMenu();
                            clearContextMenuOptions();
                            addContextMenuOption(`Value <span class="text-white">${item.name}</span>`, () => console.log(`${item.name} sells for ${resolveMerchantSellPrice(item.id)} coins.`));
                            addContextMenuOption(`Sell-1 <span class="text-white">${item.name}</span>`, () => runSellAction('Sell-1'));
                            addContextMenuOption(`Sell-5 <span class="text-white">${item.name}</span>`, () => runSellAction('Sell-5'));
                            addContextMenuOption(`Sell-10 <span class="text-white">${item.name}</span>`, () => runSellAction('Sell-10'));
                            addContextMenuOption(`Sell-50 <span class="text-white">${item.name}</span>`, () => runSellAction('Sell-50'));
                            addContextMenuOption(`Sell-X <span class="text-white">${item.name}</span>`, () => runSellAction('Sell-X'));
                            showContextMenuAt(e.clientX, e.clientY);
                            appendSwapLeftClickControl(sellActionPrefKey, sellActions, () => { renderInventory(); if (isShopOpen) renderShop(); });
                        };
                    } else {
                        const invActionPrefKey = getItemMenuPreferenceKey('inventory', item.id);
                        const defaultAction = resolveDefaultItemAction(item, invActionPrefKey);
                        const orderedActions = getOrderedItemActions(item);
                        bindInventorySlotTooltip(
                            slot,
                            buildItemTooltipText(item, { amount: inventoryViewModel ? inventoryViewModel.amount : itemDataSlot.amount, actionText: `Left-click: ${defaultAction}` }),
                            buildItemTooltipHtml(item, { amount: inventoryViewModel ? inventoryViewModel.amount : itemDataSlot.amount, actionText: `Left-click: ${defaultAction}` })
                        );
                        slot.onclick = () => handleInventorySlotClick(i);
                        slot.oncontextmenu = (e) => {
                            hideInventoryHoverTooltip();
                            e.preventDefault(); e.stopPropagation(); closeContextMenu();
                            clearContextMenuOptions();
                            orderedActions.forEach(action => { addContextMenuOption(`${action} ${item.name}`, () => handleItemAction(i, action)); });
                            if (window.RunecraftingPouchRuntime
                                && typeof window.RunecraftingPouchRuntime.getPouchStoredEssence === 'function'
                                && typeof createRunecraftingPouchContext === 'function') {
                                const storedEssence = window.RunecraftingPouchRuntime.getPouchStoredEssence(createRunecraftingPouchContext(), item.id);
                                if (storedEssence > 0) {
                                    addContextMenuOption(`Empty (${storedEssence}) ${item.name}`, () => handleItemAction(i, `Empty (${storedEssence})`));
                                }
                            }
                            const exHeader = document.createElement('div'); exHeader.className = 'mt-1 border-t border-[#4a4136] pointer-events-none'; contextOptionsListEl.appendChild(exHeader);
                            addContextMenuOption(`Examine ${item.name}`, () => { if (window.ExamineCatalog) window.ExamineCatalog.examineItem(item.id, item.name); else if (typeof addChatMessage === 'function') addChatMessage('Looks useful.', 'game'); else console.log(`EXAMINING: ${item.name}.`); });
                            showContextMenuAt(e.clientX, e.clientY);
                            appendSwapLeftClickControl(invActionPrefKey, orderedActions, () => renderInventory(), defaultAction);
                        };
                    }
                } else slot.oncontextmenu = (e) => e.preventDefault();
                container.appendChild(slot);
            }
            if (window.QuestRuntime && typeof window.QuestRuntime.refreshAllQuestStates === 'function') {
                window.QuestRuntime.refreshAllQuestStates({ silent: true, persist: false, render: false });
            }
            if (typeof renderQuestLog === 'function') renderQuestLog();
            if (window.NpcDialogueRuntime && typeof window.NpcDialogueRuntime.refreshActiveDialogue === 'function' && window.NpcDialogueRuntime.isOpen()) {
                window.NpcDialogueRuntime.refreshActiveDialogue();
            }
        }

        function renderQuestLog() {
            const runtime = getQuestLogRuntime();
            if (runtime && typeof runtime.renderQuestLog === 'function') {
                runtime.renderQuestLog({
                    documentRef: document,
                    QuestRuntime: window.QuestRuntime || null
                });
            }
        }

        function renderEquipment() {
            hideInventoryHoverTooltip();
            const slotViewModels = buildEquipmentSlotViewModels();
            slotViewModels.forEach((slotViewModel) => {
                const slotName = slotViewModel.slotName;
                const el = document.getElementById(`eq-${slotName}`); if (!el) return;
                el.className = 'w-9 h-9 bg-[#111418] border-b-2 border-r-2 border-[#090b0c] border-t border-l border-[#3a444c] flex items-center justify-center text-xl select-none hover:bg-[#1a1f24]';
                const item = equipment[slotName];
                if (slotViewModel.hasItem && item) {
                    el.innerHTML = slotViewModel.icon;
                    bindInventorySlotTooltip(
                        el,
                        buildItemTooltipText(item, { actionText: 'Click to unequip' }),
                        buildItemTooltipHtml(item, { actionText: 'Click to unequip' })
                    );
                    el.onclick = () => unequipItem(slotName);
                    el.style.cursor = 'pointer';
                } else {
                    el.innerHTML = '';
                    bindInventorySlotTooltip(el, '');
                    el.onclick = null;
                    el.style.cursor = 'default';
                }
            });
        }

        function selectCombatStyle(styleId) {
            const nextStyle = styleId === 'strength' || styleId === 'defense' ? styleId : 'attack';
            if (!playerState || playerState.selectedMeleeStyle === nextStyle) return;
            playerState.selectedMeleeStyle = nextStyle;
            if (typeof window.updateStats === 'function') window.updateStats();
        }

        function bindCombatStyleButtons() {
            ['attack', 'strength', 'defense'].forEach((styleId) => {
                const button = document.getElementById(`combat-style-${styleId}`);
                if (!button) return;
                button.onclick = () => selectCombatStyle(styleId);
            });
        }

        function updatePlayerModel() { syncPlayerAppearanceFromEquipment(); rebuildPlayerRigsFromAppearance(); }

        let activeSkillPanelSkill = null;
        let activeSkillTile = null;
        let activeSkillPanelUnlockKey = null;

        function getSkillPanelRuntime() {
            return window.SkillPanelRuntime || null;
        }

        function getSkillPanelRenderRuntime() {
            return window.SkillPanelRenderRuntime || null;
        }

        function resolveSkillPanelItemName(itemId) {
            const runtime = getSkillPanelRuntime();
            return runtime && typeof runtime.resolveSkillPanelItemName === 'function'
                ? runtime.resolveSkillPanelItemName(itemId, { itemDb: window.ITEM_DB || {} })
                : (typeof itemId === 'string' ? itemId : '');
        }

        function resolveSkillPanelSpec(skillName) {
            if (!skillName) return null;
            if (window.SkillSpecRegistry && typeof window.SkillSpecRegistry.getSkillSpec === 'function') {
                return window.SkillSpecRegistry.getSkillSpec(skillName) || null;
            }
            if (window.SkillSpecs && window.SkillSpecs.skills && window.SkillSpecs.skills[skillName]) {
                return window.SkillSpecs.skills[skillName];
            }
            return null;
        }

        function buildSkillReferencePanelUiViewModel(skillName) {
            if (!skillName || !playerSkills[skillName]) return null;
            const runtime = getUiDomainRuntime();
            if (!runtime || typeof runtime.buildSkillReferencePanelViewModel !== 'function') return null;
            return runtime.buildSkillReferencePanelViewModel({
                skillId: skillName,
                playerSkills,
                skillSpec: resolveSkillPanelSpec(skillName),
                resolveItemName: resolveSkillPanelItemName
            });
        }

        function getSkillPanelUnlockTypeLabel(unlockEntry) {
            const runtime = getSkillPanelRuntime();
            return runtime && typeof runtime.getSkillPanelUnlockTypeLabel === 'function'
                ? runtime.getSkillPanelUnlockTypeLabel(unlockEntry)
                : 'Unlock';
        }

        function buildSkillPanelRecipeDetails(skillName, unlockEntry) {
            const runtime = getSkillPanelRuntime();
            return runtime && typeof runtime.buildSkillPanelRecipeDetails === 'function'
                ? runtime.buildSkillPanelRecipeDetails({
                    skillName,
                    unlockEntry,
                    itemDb: window.ITEM_DB || {},
                    playerSkills,
                    skillSpecRegistry: window.SkillSpecRegistry || null
                })
                : null;
        }

        function buildSkillPanelRenderOptions(skillName, referenceViewModel = null) {
            return {
                documentRef: document,
                skillName,
                referenceViewModel,
                activeUnlockKey: activeSkillPanelUnlockKey,
                escapeHtml: escapeTooltipHtml,
                getUnlockTypeLabel: getSkillPanelUnlockTypeLabel,
                buildRecipeDetails: buildSkillPanelRecipeDetails,
                onSelectUnlock: (nextUnlockKey) => {
                    activeSkillPanelUnlockKey = nextUnlockKey || null;
                    renderSkillPanelTimeline(skillName, referenceViewModel);
                }
            };
        }

        function renderSkillPanelSummary(progressViewModel, referenceViewModel) {
            const runtime = getSkillPanelRenderRuntime();
            if (runtime && typeof runtime.renderSkillPanelSummary === 'function') {
                runtime.renderSkillPanelSummary(Object.assign(buildSkillPanelRenderOptions(activeSkillPanelSkill, referenceViewModel), {
                    progressViewModel
                }));
            }
        }

        function renderSkillPanelTimeline(skillName, referenceViewModel) {
            const runtime = getSkillPanelRenderRuntime();
            if (runtime && typeof runtime.renderSkillPanelTimeline === 'function') {
                activeSkillPanelUnlockKey = runtime.renderSkillPanelTimeline(buildSkillPanelRenderOptions(skillName, referenceViewModel));
            }
        }

        const DEFAULT_SKILL_TILE_DEFS = [
            { skillId: 'attack', displayName: 'Attack', icon: 'ATK', levelKey: 'atk' },
            { skillId: 'hitpoints', displayName: 'Hitpoints', icon: 'HP', levelKey: 'hp' },
            { skillId: 'mining', displayName: 'Mining', icon: 'MIN', levelKey: 'min' },
            { skillId: 'strength', displayName: 'Strength', icon: 'STR', levelKey: 'str' },
            { skillId: 'defense', displayName: 'Defense', icon: 'DEF', levelKey: 'def' },
            { skillId: 'woodcutting', displayName: 'Woodcutting', icon: 'WC', levelKey: 'wc' },
            { skillId: 'firemaking', displayName: 'Firemaking', icon: 'FM', levelKey: 'fm' },
            { skillId: 'fishing', displayName: 'Fishing', icon: 'FIS', levelKey: 'fish' },
            { skillId: 'runecrafting', displayName: 'Runecrafting', icon: 'RC', levelKey: 'rc' },
            { skillId: 'cooking', displayName: 'Cooking', icon: 'COOK', levelKey: 'cook' },
            { skillId: 'smithing', displayName: 'Smithing', icon: 'SMI', levelKey: 'smith' },
            { skillId: 'crafting', displayName: 'Crafting', icon: 'CRFT', levelKey: 'craft' },
            { skillId: 'fletching', displayName: 'Fletching', icon: 'FLT', levelKey: 'fletch' }
        ];

        function getSkillTileDefinitions() {
            const manifest = window.SkillManifest;
            if (manifest && Array.isArray(manifest.skillTiles) && manifest.skillTiles.length > 0) {
                return manifest.skillTiles;
            }
            return DEFAULT_SKILL_TILE_DEFS;
        }

        function getSkillTileMeta(skillName) {
            if (!skillName) return null;
            const manifest = window.SkillManifest;
            if (manifest && manifest.skillTileBySkillId && manifest.skillTileBySkillId[skillName]) {
                return manifest.skillTileBySkillId[skillName];
            }
            const defs = getSkillTileDefinitions();
            for (let i = 0; i < defs.length; i++) {
                if (defs[i] && defs[i].skillId === skillName) return defs[i];
            }
            return null;
        }

        function buildSkillProgressUiViewModel(skillName, tileOverride = null) {
            if (!skillName || !playerSkills[skillName]) return null;

            const runtime = getUiDomainRuntime();
            if (!runtime || typeof runtime.buildSkillProgressViewModel !== 'function') return null;

            const tile = tileOverride || document.querySelector(`.skill-tile[data-skill="${skillName}"]`);
            const tileMeta = getSkillTileMeta(skillName) || {};
            return runtime.buildSkillProgressViewModel({
                skillId: skillName,
                playerSkills,
                skillMeta: {
                    icon: tile ? tile.dataset.skillIcon : (tileMeta.icon || '?'),
                    displayName: tile ? tile.dataset.skillName : (tileMeta.displayName || skillName)
                },
                getXpForLevel,
                maxSkillLevel: MAX_SKILL_LEVEL
            });
        }

        function buildSkillTileTooltipHtml(skillName, tileOverride = null) {
            const progressViewModel = buildSkillProgressUiViewModel(skillName, tileOverride);
            if (!progressViewModel) return '';

            const nextLevelText = progressViewModel.nextText === 'Maxed'
                ? 'Max level reached'
                : `Next level at ${progressViewModel.nextText}`;

            return `<div class="min-w-[210px]">
                <div class="flex items-center justify-between gap-3">
                    <div class="text-[#ffcf8b] text-[11px] font-bold leading-4">${escapeTooltipHtml(progressViewModel.icon)} ${escapeTooltipHtml(progressViewModel.name)}</div>
                    <div class="text-white text-[10px] font-bold">Lv ${escapeTooltipHtml(progressViewModel.level)}</div>
                </div>
                <div class="mt-1 flex items-center justify-between gap-3 text-[10px] leading-4">
                    <span class="text-gray-300">Current XP</span>
                    <span class="text-white">${escapeTooltipHtml(progressViewModel.xpText)}</span>
                </div>
                <div class="mt-1 flex items-center justify-between gap-3 text-[10px] leading-4">
                    <span class="text-gray-300">To next</span>
                    <span class="text-white">${escapeTooltipHtml(progressViewModel.remainingText)}</span>
                </div>
                <div class="mt-2 h-2.5 bg-[#0e0b09] border border-[#3e3529] overflow-hidden">
                    <div class="h-full bg-[#c8aa6e]" style="width: ${escapeTooltipHtml(progressViewModel.progressWidth)};"></div>
                </div>
                <div class="mt-1 flex items-center justify-between gap-3 text-[10px] leading-4">
                    <span class="text-gray-300">${escapeTooltipHtml(progressViewModel.progressPercentText)}</span>
                    <span class="text-white">${escapeTooltipHtml(nextLevelText)}</span>
                </div>
            </div>`;
        }

        function bindSkillTileTooltip(tile, skillName) {
            if (!tile) return;
            const tooltipText = tile.dataset.skillName || skillName || '';
            tile.title = '';
            tile.onmouseenter = null;
            tile.onmousemove = null;
            tile.onmouseleave = null;
            tile.onblur = null;
            tile.setAttribute('aria-label', tooltipText);
            tile.onmouseenter = (event) => showInventoryHoverTooltip(tooltipText, event.clientX, event.clientY, buildSkillTileTooltipHtml(skillName, tile));
            tile.onmousemove = (event) => showInventoryHoverTooltip(tooltipText, event.clientX, event.clientY, buildSkillTileTooltipHtml(skillName, tile));
            tile.onmouseleave = hideInventoryHoverTooltip;
            tile.onblur = hideInventoryHoverTooltip;
        }

        function renderSkillTilesFromManifest() {
            const container = document.getElementById('view-stats');
            if (!container) return;
            const defs = getSkillTileDefinitions();
            const runtime = getUiDomainRuntime();
            const skillTileViewModels = runtime && typeof runtime.buildSkillTileViewModels === 'function'
                ? runtime.buildSkillTileViewModels({ definitions: defs, playerSkills })
                : defs;
            container.innerHTML = '';

            for (let i = 0; i < skillTileViewModels.length; i++) {
                const def = skillTileViewModels[i] || {};
                const skillId = typeof def.skillId === 'string' ? def.skillId : '';
                const levelKey = typeof def.levelKey === 'string' ? def.levelKey : '';
                if (!skillId || !levelKey) continue;

                const icon = (typeof def.icon === 'string' && def.icon.trim()) ? def.icon.trim() : skillId.slice(0, 3).toUpperCase();
                const displayName = (typeof def.displayName === 'string' && def.displayName.trim()) ? def.displayName.trim() : skillId;
                const initialLevel = Number.isFinite(def.level) ? Math.max(1, Math.floor(def.level)) : 1;

                const tile = document.createElement('div');
                tile.className = 'skill-tile w-full bg-[#111418] border border-[#3a444c] p-1 py-2 text-center text-[10px] text-[#c8aa6e] font-bold shadow-inner cursor-pointer hover:bg-[#1a1f24] select-none';
                tile.dataset.skill = skillId;
                tile.dataset.skillName = displayName;
                tile.dataset.skillIcon = icon;

                const iconSpan = document.createElement('span');
                iconSpan.className = 'text-sm';
                iconSpan.innerText = icon;

                const breakEl = document.createElement('br');

                const levelSpan = document.createElement('span');
                levelSpan.id = `stat-${levelKey}-level`;
                levelSpan.innerText = String(initialLevel);

                tile.appendChild(iconSpan);
                tile.appendChild(breakEl);
                tile.appendChild(levelSpan);
                bindSkillTileTooltip(tile, skillId);
                container.appendChild(tile);
            }
        }

        function closeSkillProgressPanel() {
            const panel = document.getElementById('skill-panel');
            if (!panel) return;
            panel.classList.add('hidden');
            activeSkillPanelSkill = null;
            activeSkillPanelUnlockKey = null;
            if (activeSkillTile) activeSkillTile.classList.remove('skill-tile-active');
            activeSkillTile = null;
        }

        function updateSkillProgressPanel(skillName, options = {}) {
            if (!skillName || !playerSkills[skillName]) return;
            const force = !!options.force;
            if (!force && activeSkillPanelSkill !== skillName) return;

            const panel = document.getElementById('skill-panel');
            if (!panel) return;

            const progressViewModel = buildSkillProgressUiViewModel(skillName);
            if (!progressViewModel) return;
            const referenceViewModel = buildSkillReferencePanelUiViewModel(skillName);

            const titleEl = document.getElementById('skill-panel-title');
            if (titleEl) titleEl.innerText = progressViewModel.name;
            renderSkillPanelSummary(progressViewModel, referenceViewModel);
            renderSkillPanelTimeline(skillName, referenceViewModel);
        }

        function openSkillProgressPanel(skillName, tileEl) {
            if (!skillName || !playerSkills[skillName]) return;

            if (activeSkillTile) activeSkillTile.classList.remove('skill-tile-active');
            activeSkillTile = tileEl || null;
            if (activeSkillTile) activeSkillTile.classList.add('skill-tile-active');

            activeSkillPanelUnlockKey = null;
            activeSkillPanelSkill = skillName;
            updateSkillProgressPanel(skillName, { force: true });
            const panel = document.getElementById('skill-panel');
            if (panel) panel.classList.remove('hidden');
        }
        function initInventoryUI() {
            const tabs = [
                { id: 'inv', displayClass: 'grid' },
                { id: 'equip', displayClass: 'flex' },
                { id: 'combat', displayClass: 'flex' },
                { id: 'stats', displayClass: 'grid' },
                { id: 'quests', displayClass: 'flex' }
            ];
            const mainContainer = document.getElementById('main-ui-container');
            if (mainContainer) mainContainer.dataset.activeTab = 'inv';
            tabs.forEach((tab) => {
                const t = tab.id;
                const btn = document.getElementById(`tab-${t}`);
                btn.onclick = () => {
                    tabs.forEach((otherTab) => {
                        const other = otherTab.id;
                        const isTarget = other === t; const view = document.getElementById(`view-${other}`); const btnOther = document.getElementById(`tab-${other}`);
                    if (isTarget) {
                            if (mainContainer) mainContainer.dataset.activeTab = other;
                            view.classList.remove('hidden'); view.classList.add(otherTab.displayClass);
                            btnOther.classList.replace('text-gray-500', 'text-[#c8aa6e]'); btnOther.classList.replace('bg-[#1e2328]', 'bg-[#2a3138]');
                        } else {
                            view.classList.add('hidden'); view.classList.remove('flex', 'grid');
                            btnOther.classList.replace('text-[#c8aa6e]', 'text-gray-500'); btnOther.classList.replace('bg-[#2a3138]', 'bg-[#1e2328]');
                        }
                    });
                };
            });
            let isExpanded = false;
            document.getElementById('btn-expand').onclick = () => { isExpanded = !isExpanded; mainContainer.style.transform = isExpanded ? 'scale(1.5)' : 'scale(1)'; };
            renderSkillTilesFromManifest();
            bindCombatStyleButtons();
            const skillTiles = Array.from(document.querySelectorAll('.skill-tile'));
            skillTiles.forEach(tile => {
                tile.onclick = () => {
                    hideInventoryHoverTooltip();
                    openSkillProgressPanel(tile.dataset.skill, tile);
                };
            });

            const closeSkillBtn = document.getElementById('skill-panel-close');
            if (closeSkillBtn) closeSkillBtn.onclick = () => closeSkillProgressPanel();

            window.addEventListener('mousedown', (e) => {
                const panel = document.getElementById('skill-panel');
                if (!panel || panel.classList.contains('hidden')) return;
                if (e.button !== 0) return;
                if (e.target.closest('#skill-panel') || e.target.closest('.skill-tile')) return;
                closeSkillProgressPanel();
            });

            Object.keys(playerSkills).forEach(skill => { if (typeof window.refreshSkillUi === 'function') window.refreshSkillUi(skill); });
            renderInventory(); renderEquipment();
            renderQuestLog();
            if (typeof window.updateStats === 'function') window.updateStats();
            updatePlayerModel();
        }
        window.renderQuestLog = renderQuestLog;
