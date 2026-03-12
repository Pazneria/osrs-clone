// --- Bank & Drag/Drop Logic ---

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

        function getInventoryHoverTooltipEl() {
            return document.getElementById('inventory-hover-tooltip');
        }

        function hideInventoryHoverTooltip() {
            const tooltip = getInventoryHoverTooltipEl();
            if (!tooltip) return;
            tooltip.classList.add('hidden');
        }

        function rectanglesOverlap(x, y, width, height, rect) {
            if (!rect) return false;
            return !(x + width <= rect.left || x >= rect.right || y + height <= rect.top || y >= rect.bottom);
        }

        function positionInventoryHoverTooltip(tooltip, clientX, clientY) {
            const pad = 8;
            const xOffset = 14;
            const yOffset = 14;
            const w = tooltip.offsetWidth || 140;
            const h = tooltip.offsetHeight || 24;

            let x = clientX + xOffset;
            let y = clientY + yOffset;

            if (x + w > window.innerWidth - pad) x = clientX - w - xOffset;
            if (y + h > window.innerHeight - pad) y = clientY - h - (yOffset + 2);
            if (x < pad) x = pad;
            if (y < pad) y = pad;

            const avoidRects = [];
            if (contextMenuEl && !contextMenuEl.classList.contains('hidden')) avoidRects.push(contextMenuEl.getBoundingClientRect());
            const swapSubmenu = document.getElementById('context-swap-left-click-submenu');
            if (swapSubmenu && !swapSubmenu.classList.contains('hidden')) avoidRects.push(swapSubmenu.getBoundingClientRect());

            for (let i = 0; i < avoidRects.length; i++) {
                const rect = avoidRects[i];
                if (!rectanglesOverlap(x, y, w, h, rect)) continue;

                const aboveY = rect.top - h - 10;
                if (aboveY >= pad) {
                    y = aboveY;
                } else {
                    const leftX = rect.left - w - 10;
                    const rightX = rect.right + 10;
                    if (leftX >= pad) x = leftX;
                    else if (rightX + w <= window.innerWidth - pad) x = rightX;
                    else y = Math.max(pad, rect.bottom + 10);
                }
            }

            if (x + w > window.innerWidth - pad) x = window.innerWidth - w - pad;
            if (y + h > window.innerHeight - pad) y = window.innerHeight - h - pad;
            if (x < pad) x = pad;
            if (y < pad) y = pad;

            tooltip.style.left = `${x}px`;
            tooltip.style.top = `${y}px`;
        }

        function showInventoryHoverTooltip(text, clientX, clientY) {
            const tooltip = getInventoryHoverTooltipEl();
            const tooltipText = (typeof text === 'string') ? text.trim() : '';
            if (!tooltip || !tooltipText) {
                hideInventoryHoverTooltip();
                return;
            }

            tooltip.textContent = tooltipText;
            tooltip.classList.remove('hidden');
            positionInventoryHoverTooltip(tooltip, clientX, clientY);
        }

        function bindInventorySlotTooltip(slot, text) {
            const tooltipText = (typeof text === 'string') ? text.trim() : '';
            slot.title = '';
            if (!tooltipText) return;
            slot.setAttribute('aria-label', tooltipText);
            slot.addEventListener('mouseenter', (event) => showInventoryHoverTooltip(tooltipText, event.clientX, event.clientY));
            slot.addEventListener('mousemove', (event) => showInventoryHoverTooltip(tooltipText, event.clientX, event.clientY));
            slot.addEventListener('mouseleave', hideInventoryHoverTooltip);
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
        window.getItemMenuPreferenceKey = getItemMenuPreferenceKey;
        window.hideInventoryHoverTooltip = hideInventoryHoverTooltip;

        let rememberedDepositXAmount = null;

        function collectMatchingInventorySlots(itemId, preferredIndex, maxCount) {
            const matched = [];
            if (!itemId || maxCount <= 0) return matched;

            const pushIndex = (idx) => {
                if (idx < 0 || idx >= inventory.length) return;
                if (matched.length >= maxCount) return;
                const slot = inventory[idx];
                if (slot && slot.itemData && slot.itemData.id === itemId) matched.push(idx);
            };

            pushIndex(preferredIndex);
            for (let i = 0; i < inventory.length && matched.length < maxCount; i++) {
                if (i === preferredIndex) continue;
                pushIndex(i);
            }

            return matched;
        }

        function renderBank() {
            const container = document.getElementById('bank-grid');
            container.innerHTML = '';
            let usedSlots = 0;
            
            for (let i = 0; i < 200; i++) {
                const slot = document.createElement('div');
                slot.className = 'w-9 h-9 bg-[#231e18] border-b-2 border-r-2 border-[#15120e] border-t border-l border-[#4a4136] flex items-center justify-center text-xl cursor-pointer hover:bg-[#2b251d] select-none relative group transition-colors';
                const bItem = bankItems[i];
                
                slot.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
                slot.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const data = JSON.parse(e.dataTransfer.getData('application/json'));
                    handleDragDrop(data.source, data.index, 'bank', i);
                });
                    if (bItem) {
                    usedSlots++;
                    slot.innerHTML = `${bItem.itemData.icon}${formatStackSize(bItem.amount)}`;
                    slot.title = `${bItem.itemData.name} x ${bItem.amount.toLocaleString()}`;
                    
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
                        contextOptionsListEl.innerHTML = '';
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
            if (sourceType === 'inv' && targetType === 'inv') {
                const temp = inventory[sourceIndex]; inventory[sourceIndex] = inventory[targetIndex]; inventory[targetIndex] = temp;
            } else if (sourceType === 'bank' && targetType === 'bank') {
                const temp = bankItems[sourceIndex]; bankItems[sourceIndex] = bankItems[targetIndex]; bankItems[targetIndex] = temp;
            } else if (sourceType === 'inv' && targetType === 'bank') { depositInvItem(sourceIndex, -1, targetIndex); }
            else if (sourceType === 'bank' && targetType === 'inv') { withdrawBankItem(sourceIndex, 1, targetIndex); }
            if (isBankOpen) renderBank();
            renderInventory();
        }

        function depositInvItem(invIndex, amount = -1, targetBankIndex = -1) {
            const invSlot = inventory[invIndex];
            if (!invSlot) return;
            const itemData = invSlot.itemData;
            
            let amountToDeposit = 0;
            let targetAmount = amount === -1 ? (itemData.stackable ? invSlot.amount : 28) : amount;

            if (itemData.stackable) {
                amountToDeposit = Math.min(targetAmount, invSlot.amount);
                let bIndex = bankItems.findIndex(b => b !== null && b.itemData.id === itemData.id);
                if (bIndex === -1 && !bankItems.includes(null) && targetBankIndex === -1) {
                    console.log("Bank is full!"); return;
                }
                if (bIndex !== -1) bankItems[bIndex].amount += amountToDeposit;
                else {
                    let slot = targetBankIndex !== -1 ? targetBankIndex : bankItems.indexOf(null);
                    bankItems[slot] = { itemData: itemData, amount: amountToDeposit };
                }
                inventory[invIndex].amount -= amountToDeposit;
                if (inventory[invIndex].amount <= 0) inventory[invIndex] = null;
            } else {
                const sourceSlots = collectMatchingInventorySlots(itemData.id, invIndex, targetAmount);
                for (let i = 0; i < sourceSlots.length && amountToDeposit < targetAmount; i++) {
                    const checkIdx = sourceSlots[i];
                    let bIndex = bankItems.findIndex(b => b !== null && b.itemData.id === itemData.id);
                    let slot = bIndex !== -1 ? bIndex : (targetBankIndex !== -1 && bankItems[targetBankIndex] === null ? targetBankIndex : bankItems.indexOf(null));
                    if (slot !== -1) {
                        if (bankItems[slot]) bankItems[slot].amount += 1;
                        else bankItems[slot] = { itemData: itemData, amount: 1 };
                        inventory[checkIdx] = null;
                        amountToDeposit++;
                    } else {
                        console.log("Bank is full!");
                        break;
                    }
                }
            }

            if(isBankOpen) renderBank(); 
            if(typeof isShopOpen !== 'undefined' && isShopOpen) renderShop(); 
            renderInventory();
        }

        function withdrawBankItem(bankIndex, amountToWithdraw, targetInvIndex = -1) {
            const bItem = bankItems[bankIndex];
            if (!bItem) return;
            let actualAmount = Math.min(bItem.amount, amountToWithdraw);
                    if (bItem.itemData.stackable) {
                let existingInvIdx = inventory.findIndex(s => s && s.itemData.id === bItem.itemData.id);
                if (existingInvIdx !== -1) {
                    inventory[existingInvIdx].amount += actualAmount;
                    bItem.amount -= actualAmount;
                } else {
                    let slotToFill = (targetInvIndex !== -1 && inventory[targetInvIndex] === null) ? targetInvIndex : inventory.indexOf(null);
                    if (slotToFill !== -1) {
                        inventory[slotToFill] = { itemData: bItem.itemData, amount: actualAmount };
                        bItem.amount -= actualAmount;
                    } else console.log("Inventory full.");
                }
            } else {
                let slotsFilled = 0;
                for (let i = 0; i < actualAmount; i++) {
                    let slotToFill = (i === 0 && targetInvIndex !== -1 && inventory[targetInvIndex] === null) ? targetInvIndex : inventory.indexOf(null);
                    if (slotToFill !== -1) { inventory[slotToFill] = { itemData: bItem.itemData, amount: 1 }; bItem.amount -= 1; slotsFilled++; } 
                    else { console.log("Inventory full."); break; }
                }
            }
            if (bItem.amount <= 0) bankItems[bankIndex] = null;
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
            if (economy) return economy.resolveBuyPrice(itemId, activeShopMerchantId);
            return ITEM_DB[itemId] && Number.isFinite(ITEM_DB[itemId].value) ? ITEM_DB[itemId].value : 0;
        }

        function resolveMerchantSellPrice(itemId) {
            const economy = getShopEconomy();
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
            const inventoryArray = Array(100).fill(null);
            const economy = getShopEconomy();
            const seedRows = economy && typeof economy.getMerchantSeedStockRows === 'function'
                ? economy.getMerchantSeedStockRows(merchantId)
                : [];
            const hasExplicitMerchantConfig = economy && typeof economy.hasMerchantConfig === 'function'
                ? economy.hasMerchantConfig(merchantId)
                : false;

            if (seedRows.length > 0) {
                for (let i = 0; i < seedRows.length; i++) {
                    const row = seedRows[i] || {};
                    const itemId = typeof row.itemId === 'string' ? row.itemId : '';
                    if (!itemId) continue;
                    const stockAmount = Number.isFinite(row.stockAmount) ? Math.max(1, Math.floor(row.stockAmount)) : 20;
                    seedShopInventorySlot(inventoryArray, itemId, stockAmount, true);
                }
                return inventoryArray;
            }

            // Keep explicitly configured merchants with empty default stock (buys-only) truly empty.
            if (hasExplicitMerchantConfig) {
                return inventoryArray;
            }

            const hasStockPolicy = economy && typeof economy.hasStockPolicy === 'function'
                ? economy.hasStockPolicy(merchantId)
                : false;
            if (!hasStockPolicy) {
                const id = merchantId || 'general_store';
                console.warn(`[Shop] Merchant '${id}' has no explicit stock config and no fallback stock policy.`);
            }
            return inventoryArray;
        }

        function ensureUnlockedMerchantStock(merchantId) {
            const economy = getShopEconomy();
            if (!economy || typeof economy.getMerchantDefaultSellItemIds !== 'function') return;
            const defaults = economy.getMerchantDefaultSellItemIds(merchantId);
            for (let i = 0; i < defaults.length; i++) {
                const itemId = defaults[i];
                const itemData = ITEM_DB[itemId];
                if (!itemData) continue;

                const desiredStock = typeof economy.getUnlockedStockAmount === 'function'
                    ? Math.max(1, economy.getUnlockedStockAmount(itemId, merchantId) || 20)
                    : 20;
                const existing = shopInventory.find((slot) => slot && slot.itemData && slot.itemData.id === itemId);
                if (existing) {
                    existing.normalStock = true;
                    if (existing.amount < desiredStock) existing.amount = desiredStock;
                    continue;
                }
                seedShopInventorySlot(shopInventory, itemId, desiredStock, true);
            }
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
            ensureMerchantShopInventory(merchantId);
            isShopOpen = true;
            setInterfaceOpenState('shop-interface', true);
            renderShop();
            renderInventory();
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
            container.innerHTML = '';
            for (let i = 0; i < 100; i++) {
                const slot = document.createElement('div');
                slot.className = 'w-9 h-9 bg-[#231e18] border-b-2 border-r-2 border-[#15120e] border-t border-l border-[#4a4136] flex items-center justify-center text-xl cursor-pointer hover:bg-[#2b251d] select-none relative group transition-colors';
                const sItem = shopInventory[i];
                if (sItem && sItem.amount > 0) {
                    slot.innerHTML = `${sItem.itemData.icon}${formatStackSize(sItem.amount)}`;
                    const buyPrice = resolveMerchantBuyPrice(sItem.itemData.id);
                    slot.title = sItem.itemData.name + ' - ' + buyPrice + ' coins';
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
                        contextOptionsListEl.innerHTML = '';
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
            const sItem = shopInventory[shopIdx];
            if (!sItem || sItem.amount <= 0) return;
            if (sItem.itemData.id === 'coins') {
                console.log("You cannot buy coins.");
                return;
            }
            let cost = resolveMerchantBuyPrice(sItem.itemData.id);
            let canBuyAmount = Math.min(amount, sItem.amount);
            let coinSlotIdx = inventory.findIndex(s => s && s.itemData.id === 'coins');
            let playerCoins = coinSlotIdx !== -1 ? inventory[coinSlotIdx].amount : 0;
            
            if (playerCoins >= cost) {
                let affordAmount = Math.floor(playerCoins / cost);
                canBuyAmount = Math.min(canBuyAmount, affordAmount);
                
                let amountGiven = giveItem(sItem.itemData, canBuyAmount);
                    if (amountGiven > 0) {
                    let totalCost = cost * amountGiven;
                    sItem.amount -= amountGiven;
                    coinSlotIdx = inventory.findIndex(s => s && s.itemData.id === 'coins');
                    inventory[coinSlotIdx].amount -= totalCost;
                    if (inventory[coinSlotIdx].amount <= 0) inventory[coinSlotIdx] = null;
                    renderShop(); renderInventory();
                } else console.log("Inventory full!");
            } else console.log("Not enough coins!");
        }

        function sellItem(invIdx, amount) {
            const invSlot = inventory[invIdx];
            if (!invSlot) return;
            const itemData = invSlot.itemData;
            if (itemData.id === 'coins') {
                console.log("You cannot sell coins.");
                return;
            }

            const economy = getShopEconomy();
            const merchantCanBuy = (economy && typeof economy.canMerchantBuyItem === 'function')
                ? economy.canMerchantBuyItem(itemData.id, activeShopMerchantId)
                : true;
            if (!merchantCanBuy) {
                if (typeof addChatMessage === 'function') addChatMessage(itemData.name + ' cannot be sold to this merchant.', 'warn');
                return;
            }

            let sellValue = resolveMerchantSellPrice(itemData.id);
            if (!Number.isFinite(sellValue) || sellValue <= 0) {
                if (typeof addChatMessage === 'function') addChatMessage(itemData.name + ' has no sell value at this merchant.', 'warn');
                return;
            }

            let amountSold = 0;
            let targetAmount = amount === -1 ? (itemData.stackable ? invSlot.amount : 28) : amount;

            if (itemData.stackable) {
                amountSold = Math.min(targetAmount, invSlot.amount);
                inventory[invIdx].amount -= amountSold;
                if (inventory[invIdx].amount <= 0) inventory[invIdx] = null;
            } else {
                const sourceSlots = collectMatchingInventorySlots(itemData.id, invIdx, targetAmount);
                for (let i = 0; i < sourceSlots.length && amountSold < targetAmount; i++) {
                    inventory[sourceSlots[i]] = null;
                    amountSold++;
                }
            }

            if (amountSold > 0) {
                const unlockResult = (economy && typeof economy.recordMerchantPurchaseFromPlayer === 'function')
                    ? economy.recordMerchantPurchaseFromPlayer(itemData.id, activeShopMerchantId, amountSold)
                    : null;
                const canBeNormalStock = (economy && typeof economy.canMerchantSellItem === 'function')
                    ? economy.canMerchantSellItem(itemData.id, activeShopMerchantId)
                    : true;

                if (canBeNormalStock) {
                    let shopIdx = shopInventory.findIndex(s => s && s.itemData.id === itemData.id);
                    if (shopIdx === -1) {
                        shopIdx = shopInventory.indexOf(null);
                        if (shopIdx !== -1) shopInventory[shopIdx] = { itemData: itemData, amount: 0, normalStock: false };
                    }
                    if (shopIdx !== -1) shopInventory[shopIdx].amount += amountSold;
                }

                if (unlockResult && unlockResult.unlockedNow) {
                    ensureUnlockedMerchantStock(activeShopMerchantId);
                    if (typeof addChatMessage === 'function') {
                        addChatMessage(itemData.name + ' is now unlocked as permanent stock at this merchant.', 'info');
                    }
                }

                giveItem(ITEM_DB['coins'], amountSold * sellValue);
            }
            renderShop(); renderInventory();
        }

        // --- Render UI System ---

        function renderInventory() {
            const container = document.getElementById('view-inv');
            container.innerHTML = '';
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
                const selectedUseSlot = getSelectedUseItem();
                if (itemDataSlot && selectedUseSlot && selectedUse.invIndex === i && selectedUse.itemId === itemDataSlot.itemData.id) {
                    slot.classList.add('item-slot-selected');
                }
                if (itemDataSlot) {
                    const item = itemDataSlot.itemData;
                    slot.innerHTML = `<span class="inv-item-icon">${item.icon}</span>${formatStackSize(itemDataSlot.amount, 'item-amt-inv')}`;
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
                        bindInventorySlotTooltip(slot, `Deposit ${item.name}`);
                        slot.onclick = () => {
                            const defaultAction = getPreferredMenuAction(depositActionPrefKey, depositActions);
                    if (defaultAction) runDepositAction(defaultAction);
                        };
                        slot.oncontextmenu = (e) => {
                            hideInventoryHoverTooltip();
                            e.preventDefault(); e.stopPropagation(); closeContextMenu();
                            contextOptionsListEl.innerHTML = '';
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
                        bindInventorySlotTooltip(slot, `Sell ${item.name}`);
                        slot.onclick = () => {
                            const defaultAction = getPreferredMenuAction(sellActionPrefKey, sellActions);
                    if (defaultAction) runSellAction(defaultAction);
                        };
                        slot.oncontextmenu = (e) => {
                            hideInventoryHoverTooltip();
                            e.preventDefault(); e.stopPropagation(); closeContextMenu();
                            contextOptionsListEl.innerHTML = '';
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
                    bindInventorySlotTooltip(slot, `${defaultAction} ${item.name}`);
                        slot.onclick = () => handleInventorySlotClick(i);
                        slot.oncontextmenu = (e) => {
                            hideInventoryHoverTooltip();
                            e.preventDefault(); e.stopPropagation(); closeContextMenu();
                            contextOptionsListEl.innerHTML = '';
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
        }

        function renderEquipment() {
            const slots = ['head', 'cape', 'neck', 'weapon', 'body', 'shield', 'legs', 'hands', 'feet', 'ring'];
            slots.forEach(slotName => {
                const el = document.getElementById(`eq-${slotName}`); if (!el) return;
                el.className = 'w-9 h-9 bg-[#111418] border-b-2 border-r-2 border-[#090b0c] border-t border-l border-[#3a444c] flex items-center justify-center text-xl select-none hover:bg-[#1a1f24]';
                const item = equipment[slotName];
                if (item) { el.innerHTML = item.icon; el.title = item.name; el.onclick = () => unequipItem(slotName); el.style.cursor = 'pointer'; } 
                else { el.innerHTML = ''; el.title = ''; el.onclick = null; el.style.cursor = 'default'; }
            });
        }

        function updatePlayerModel() { syncPlayerAppearanceFromEquipment(); rebuildPlayerRigsFromAppearance(); }

        let activeSkillPanelSkill = null;
        let activeSkillTile = null;
        const SKILL_PANEL_TIER_COLLAPSED = -1;
        let activeSkillPanelTierLevel = null;
        let activeSkillPanelUnlockKey = null;
        const SKILL_PANEL_RECIPE_UNLOCK_TYPE = 'recipe';
        const SKILL_PANEL_FOCUS_BY_SKILL = {
            attack: 'Improve melee accuracy so your attacks connect more reliably.',
            strength: 'Raise melee max hit to speed up kill times and training routes.',
            defense: 'Increase damage mitigation for safer skilling and combat loops.',
            hitpoints: 'Grow your health pool to survive harder fights and mistakes.',
            woodcutting: 'Cut higher-tier trees for stronger logs, value, and XP rates.',
            mining: 'Mine tougher rock tiers to unlock better ores and gem routes.',
            fishing: 'Unlock better methods and fish tiers for stronger food chains.',
            firemaking: 'Burn stronger logs for faster training and utility fire access.',
            cooking: 'Cook higher-tier fish with better XP and fewer burns over time.',
            runecrafting: 'Craft stronger runes and pouches to scale rune output.',
            smithing: 'Forge better metal outputs for tools, gear, and progression.',
            crafting: 'Craft tools, jewelry, and equipment upgrades across multiple skills.',
            fletching: 'Convert logs into bows, arrows, and handles for ranged progression.'
        };
        const SKILL_PANEL_TIER_NAMES_BY_SKILL = {
            attack: ['Novice Combat', 'Apprentice Combat', 'Adept Combat', 'Veteran Combat'],
            strength: ['Novice Power', 'Apprentice Power', 'Adept Power', 'Veteran Power'],
            defense: ['Novice Defense', 'Apprentice Defense', 'Adept Defense', 'Veteran Defense'],
            hitpoints: ['Novice Vitality', 'Apprentice Vitality', 'Adept Vitality', 'Veteran Vitality'],
            woodcutting: ['Normal and Oak', 'Willow Focus', 'Maple Focus', 'Yew and Beyond'],
            mining: ['Starter Ores', 'Iron Route', 'Coal Route', 'Silver and Beyond'],
            fishing: ['Net and Rod Basics', 'River Rod Route', 'Harpoon Route', 'Deep-Water Route'],
            firemaking: ['Starter Logs', 'Oak Fires', 'Willow Fires', 'Maple and Yew Fires'],
            cooking: ['Shrimp Cooking', 'Trout Cooking', 'Salmon Cooking', 'Tuna and Swordfish Cooking'],
            runecrafting: ['Elemental Basics', 'Water and Output Scaling', 'Earth and Output Scaling', 'Air and Combination'],
            crafting: ['Starter Crafting', 'Tier Two Crafting', 'Tier Three Crafting', 'Advanced Crafting'],
            fletching: ['Starter Fletching', 'Oak Fletching', 'Willow Fletching', 'Maple and Yew Fletching'],
            smithing: ['Bronze and Iron', 'Steel Forging', 'Mithril Forging', 'Adamant and Rune']
        };

        const COMBAT_SKILL_MILESTONES = {
            attack: [
                { level: 1, label: 'Starter melee accuracy baseline' },
                { level: 10, label: 'Early melee consistency bump' },
                { level: 20, label: 'Mid-band melee accuracy bump' },
                { level: 30, label: 'Advanced melee accuracy bump' },
                { level: 40, label: 'High-band melee accuracy bump' }
            ],
            strength: [
                { level: 1, label: 'Starter max-hit baseline' },
                { level: 10, label: 'Early max-hit bump' },
                { level: 20, label: 'Mid-band max-hit bump' },
                { level: 30, label: 'Advanced max-hit bump' },
                { level: 40, label: 'High-band max-hit bump' }
            ],
            defense: [
                { level: 1, label: 'Starter mitigation baseline' },
                { level: 10, label: 'Early defense scaling bump' },
                { level: 20, label: 'Mid-band defense scaling bump' },
                { level: 30, label: 'Advanced defense scaling bump' },
                { level: 40, label: 'High-band defense scaling bump' }
            ],
            hitpoints: [
                { level: 10, label: 'Starter health pool baseline' },
                { level: 20, label: 'Early survivability bump' },
                { level: 30, label: 'Mid-band survivability bump' },
                { level: 40, label: 'Advanced survivability bump' }
            ]
        };

        const FISHING_METHOD_LABELS = {
            net: 'Net fishing',
            rod: 'Rod fishing',
            harpoon: 'Harpoon fishing',
            deep_harpoon_mixed: 'Deep-water harpoon (mixed)',
            deep_rune_harpoon: 'Deep-water rune harpoon'
        };

        function formatSkillPanelText(value) {
            if (typeof value !== 'string') return '';
            return value
                .replace(/[_-]+/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .replace(/\b\w/g, (char) => char.toUpperCase());
        }

        function resolveSkillPanelItemName(itemId) {
            if (typeof itemId !== 'string' || !itemId) return '';
            const item = window.ITEM_DB && window.ITEM_DB[itemId];
            if (item && typeof item.name === 'string' && item.name.trim()) return item.name.trim();
            return formatSkillPanelText(itemId);
        }

        function formatSkillPanelItemAmount(itemId, amount = 1) {
            const qty = Number.isFinite(amount) ? Math.max(1, Math.floor(amount)) : 1;
            return `${qty}x ${resolveSkillPanelItemName(itemId)}`;
        }

        function addSkillPanelMilestone(milestonesByLevel, level, label, options = {}) {
            const lvl = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;
            const text = typeof label === 'string' ? label.trim() : '';
            if (!text) return;
            if (!milestonesByLevel[lvl]) milestonesByLevel[lvl] = new Map();

            const unlockType = (typeof options.unlockType === 'string' && options.unlockType.trim())
                ? options.unlockType.trim()
                : 'unlock';
            const rawKey = (typeof options.key === 'string' && options.key.trim())
                ? options.key.trim()
                : `${unlockType}:${text.toLowerCase()}`;
            const key = rawKey.toLowerCase();
            if (milestonesByLevel[lvl].has(key)) return;

            milestonesByLevel[lvl].set(key, {
                key,
                label: text,
                unlockType,
                recipeId: (typeof options.recipeId === 'string' && options.recipeId.trim()) ? options.recipeId.trim() : null,
                recipe: (options.recipe && typeof options.recipe === 'object') ? options.recipe : null
            });
        }

        function getSkillPanelVerb(skillName) {
            if (skillName === 'woodcutting') return 'Chop';
            if (skillName === 'mining') return 'Mine';
            if (skillName === 'fishing') return 'Catch';
            if (skillName === 'firemaking') return 'Burn';
            if (skillName === 'cooking') return 'Cook';
            if (skillName === 'runecrafting') return 'Craft';
            if (skillName === 'smithing') return 'Forge';
            if (skillName === 'crafting') return 'Craft';
            if (skillName === 'fletching') return 'Fletch';
            return 'Unlock';
        }

        function collectNodeMilestones(skillName, nodeTable, milestonesByLevel) {
            if (!nodeTable || typeof nodeTable !== 'object') return;
            const nodeIds = Object.keys(nodeTable);
            for (let i = 0; i < nodeIds.length; i++) {
                const nodeId = nodeIds[i];
                const node = nodeTable[nodeId];
                if (!node || typeof node !== 'object') continue;

                if (skillName === 'fishing' && node.methods && typeof node.methods === 'object') {
                    if (Number.isFinite(node.unlockLevel)) {
                        addSkillPanelMilestone(milestonesByLevel, node.unlockLevel, `Access ${formatSkillPanelText(nodeId)}`, { key: `node:${nodeId}:access` });
                    }
                    const methodIds = Object.keys(node.methods);
                    for (let j = 0; j < methodIds.length; j++) {
                        const methodId = methodIds[j];
                        const method = node.methods[methodId];
                        if (!method || typeof method !== 'object') continue;
                        const methodUnlockLevel = Number.isFinite(method.unlockLevel)
                            ? method.unlockLevel
                            : (Number.isFinite(node.unlockLevel) ? node.unlockLevel : 1);
                        const methodLabel = FISHING_METHOD_LABELS[methodId] || formatSkillPanelText(methodId);
                        addSkillPanelMilestone(milestonesByLevel, methodUnlockLevel, `Method: ${methodLabel}`, { key: `method:${methodId}` });

                        const bands = Array.isArray(method.fishByLevel) ? method.fishByLevel : [];
                        for (let bandIdx = 0; bandIdx < bands.length; bandIdx++) {
                            const band = bands[bandIdx];
                            if (!band || typeof band !== 'object') continue;
                            const fishRows = Array.isArray(band.fish) ? band.fish : [];
                            for (let fishIdx = 0; fishIdx < fishRows.length; fishIdx++) {
                                const fishDef = fishRows[fishIdx];
                                if (!fishDef || typeof fishDef !== 'object') continue;
                                const fishLevel = Number.isFinite(fishDef.requiredLevel)
                                    ? fishDef.requiredLevel
                                    : (Number.isFinite(band.minLevel) ? band.minLevel : methodUnlockLevel);
                                const fishName = resolveSkillPanelItemName(fishDef.itemId);
                                addSkillPanelMilestone(milestonesByLevel, fishLevel, `Catch ${fishName}`, { key: `fish:${fishDef.itemId}` });
                            }
                        }
                    }
                    continue;
                }

                const unlockLevel = Number.isFinite(node.requiredLevel)
                    ? node.requiredLevel
                    : (Number.isFinite(node.unlockLevel) ? node.unlockLevel : 1);
                if (typeof node.rewardItemId === 'string' && node.rewardItemId) {
                    const verb = getSkillPanelVerb(skillName);
                    addSkillPanelMilestone(milestonesByLevel, unlockLevel, `${verb} ${resolveSkillPanelItemName(node.rewardItemId)}`, { key: `node:${nodeId}:reward` });
                } else {
                    addSkillPanelMilestone(milestonesByLevel, unlockLevel, `Unlock ${formatSkillPanelText(nodeId)}`, { key: `node:${nodeId}` });
                }
            }
        }

        function resolveRecipeMilestoneLabel(skillName, recipeId, recipe) {
            const verb = getSkillPanelVerb(skillName);
            if (recipe && recipe.output && typeof recipe.output.itemId === 'string') {
                return `${verb} ${resolveSkillPanelItemName(recipe.output.itemId)}`;
            }
            if (recipe && typeof recipe.outputItemId === 'string') {
                if (skillName === 'runecrafting' && typeof recipe.altarName === 'string' && recipe.altarName.trim()) {
                    return `Craft ${resolveSkillPanelItemName(recipe.outputItemId)} (${recipe.altarName.trim()})`;
                }
                return `${verb} ${resolveSkillPanelItemName(recipe.outputItemId)}`;
            }
            if (recipe && typeof recipe.cookedItemId === 'string') {
                return `Cook ${resolveSkillPanelItemName(recipe.cookedItemId)}`;
            }
            if (skillName === 'firemaking' && recipe && typeof recipe.sourceItemId === 'string') {
                return `Burn ${resolveSkillPanelItemName(recipe.sourceItemId)}`;
            }
            if (recipe && typeof recipe.sourceItemId === 'string') {
                return `${verb} ${resolveSkillPanelItemName(recipe.sourceItemId)}`;
            }
            if (typeof recipeId === 'string' && recipeId) return `Unlock ${formatSkillPanelText(recipeId)}`;
            return '';
        }

        function collectRecipeMilestones(skillName, recipeSet, milestonesByLevel) {
            if (!recipeSet || typeof recipeSet !== 'object') return;
            const recipeIds = Object.keys(recipeSet);
            for (let i = 0; i < recipeIds.length; i++) {
                const recipeId = recipeIds[i];
                const recipe = recipeSet[recipeId];
                if (!recipe || typeof recipe !== 'object') continue;
                const requiredLevel = Number.isFinite(recipe.requiredLevel) ? recipe.requiredLevel : 1;
                const label = resolveRecipeMilestoneLabel(skillName, recipeId, recipe);
                addSkillPanelMilestone(milestonesByLevel, requiredLevel, label, {
                    unlockType: SKILL_PANEL_RECIPE_UNLOCK_TYPE,
                    key: `recipe:${recipeId}`,
                    recipeId,
                    recipe
                });
            }
        }

        function collectSkillPanelMilestones(skillName) {
            const milestonesByLevel = {};
            const combatMilestones = COMBAT_SKILL_MILESTONES[skillName];
            if (Array.isArray(combatMilestones)) {
                for (let i = 0; i < combatMilestones.length; i++) {
                    const row = combatMilestones[i];
                    if (!row || typeof row !== 'object') continue;
                    addSkillPanelMilestone(milestonesByLevel, row.level, row.label, { key: `combat:${skillName}:${row.level}` });
                }
                return milestonesByLevel;
            }

            const spec = (window.SkillSpecRegistry && typeof window.SkillSpecRegistry.getSkillSpec === 'function')
                ? window.SkillSpecRegistry.getSkillSpec(skillName)
                : (window.SkillSpecs && window.SkillSpecs.skills && window.SkillSpecs.skills[skillName] ? window.SkillSpecs.skills[skillName] : null);
            if (!spec || typeof spec !== 'object') return milestonesByLevel;

            collectNodeMilestones(skillName, spec.nodeTable, milestonesByLevel);
            collectRecipeMilestones(skillName, spec.recipeSet, milestonesByLevel);

            if (skillName === 'runecrafting' && spec.pouchTable && typeof spec.pouchTable === 'object') {
                const pouchIds = Object.keys(spec.pouchTable);
                for (let i = 0; i < pouchIds.length; i++) {
                    const pouchId = pouchIds[i];
                    const pouchDef = spec.pouchTable[pouchId];
                    if (!pouchDef || typeof pouchDef !== 'object') continue;
                    const requiredLevel = Number.isFinite(pouchDef.requiredLevel) ? pouchDef.requiredLevel : 1;
                    addSkillPanelMilestone(milestonesByLevel, requiredLevel, `Use ${resolveSkillPanelItemName(pouchId)}`, { key: `pouch:${pouchId}` });
                }
            }

            return milestonesByLevel;
        }

        function buildSkillPanelTimeline(skillName) {
            const milestonesByLevel = collectSkillPanelMilestones(skillName);
            return Object.keys(milestonesByLevel)
                .map((levelKey) => {
                    const level = Number(levelKey);
                    const unlocks = Array.from((milestonesByLevel[levelKey] && milestonesByLevel[levelKey].values()) || [])
                        .sort((a, b) => a.label.localeCompare(b.label));
                    return { level, unlocks };
                })
                .filter((entry) => Number.isFinite(entry.level) && Array.isArray(entry.unlocks) && entry.unlocks.length > 0)
                .sort((a, b) => {
                    if (a.level !== b.level) return a.level - b.level;
                    return a.unlocks[0].label.localeCompare(b.unlocks[0].label);
                });
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

        function getSkillPanelTierStarts(skillName) {
            const fallbackStarts = [1, 10, 20, 30];
            const spec = resolveSkillPanelSpec(skillName);
            if (!spec || !Array.isArray(spec.levelBands)) return fallbackStarts.slice();

            const normalized = spec.levelBands
                .filter((value) => Number.isFinite(value))
                .map((value) => Math.max(1, Math.floor(value)))
                .sort((a, b) => a - b)
                .filter((value, index, arr) => arr.indexOf(value) === index);

            if (!normalized.length) return fallbackStarts.slice();

            const starts = normalized.slice(0, 4);
            while (starts.length < 4) {
                const last = starts.length ? starts[starts.length - 1] : 1;
                starts.push(last + 10);
            }
            return starts.slice(0, 4);
        }

        function formatSkillPanelTierLabel(skillName, index, start, end) {
            const names = SKILL_PANEL_TIER_NAMES_BY_SKILL[skillName];
            const fallback = `Tier ${index + 1}`;
            const tierName = (Array.isArray(names) && typeof names[index] === 'string' && names[index].trim())
                ? names[index].trim()
                : fallback;
            if (!Number.isFinite(end)) return `${tierName} (Lv ${start}+)`;
            return `${tierName} (Lv ${start}-${end})`;
        }

        function buildSkillPanelTierGroups(skillName, entries) {
            const starts = getSkillPanelTierStarts(skillName);
            const tiers = [];
            for (let i = 0; i < starts.length; i++) {
                const start = starts[i];
                const end = i < (starts.length - 1) ? (starts[i + 1] - 1) : null;
                tiers.push({
                    id: i,
                    index: i,
                    start,
                    end,
                    label: formatSkillPanelTierLabel(skillName, i, start, end),
                    entries: []
                });
            }

            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                let assigned = false;
                for (let j = 0; j < tiers.length; j++) {
                    const tier = tiers[j];
                    const inRange = entry.level >= tier.start && (tier.end === null || entry.level <= tier.end);
                    if (!inRange) continue;
                    tier.entries.push(entry);
                    assigned = true;
                    break;
                }
                if (!assigned && tiers.length) tiers[tiers.length - 1].entries.push(entry);
            }

            return tiers;
        }

        function getTierUnlockCount(tier) {
            if (!tier || !Array.isArray(tier.entries)) return 0;
            let total = 0;
            for (let i = 0; i < tier.entries.length; i++) {
                const entry = tier.entries[i];
                if (entry && Array.isArray(entry.unlocks)) total += entry.unlocks.length;
            }
            return total;
        }

        function addSkillPanelDetailSection(container, title, rows) {
            if (!container || !Array.isArray(rows) || rows.length === 0) return;
            const section = document.createElement('div');
            section.className = 'pt-1';

            const heading = document.createElement('div');
            heading.className = 'text-[#c8aa6e] uppercase tracking-wide text-[10px] font-bold';
            heading.innerText = title;
            section.appendChild(heading);

            for (let i = 0; i < rows.length; i++) {
                const row = document.createElement('div');
                row.className = 'text-gray-200';
                row.innerText = rows[i];
                section.appendChild(row);
            }

            container.appendChild(section);
        }

        function getSkillPanelUnlockTypeLabel(unlockEntry) {
            if (!unlockEntry || typeof unlockEntry !== 'object') return 'Unlock';
            if (unlockEntry.unlockType === SKILL_PANEL_RECIPE_UNLOCK_TYPE) return 'Recipe Unlock';
            const key = typeof unlockEntry.key === 'string' ? unlockEntry.key : '';
            if (key.startsWith('node:')) return 'Node Unlock';
            if (key.startsWith('method:')) return 'Method Unlock';
            if (key.startsWith('fish:')) return 'Catch Unlock';
            if (key.startsWith('pouch:')) return 'Pouch Unlock';
            if (key.startsWith('combat:')) return 'Combat Milestone';
            return 'Unlock';
        }

        function buildSkillPanelRecipeDetails(skillName, unlockEntry) {
            if (!unlockEntry || unlockEntry.unlockType !== SKILL_PANEL_RECIPE_UNLOCK_TYPE || !unlockEntry.recipe) return null;
            const recipe = unlockEntry.recipe;
            const inputs = [];
            const outputs = [];
            const meta = [];
            const seenInputs = new Set();
            const seenOutputs = new Set();

            function pushUniqueInput(text) {
                if (!text || seenInputs.has(text)) return;
                seenInputs.add(text);
                inputs.push(text);
            }

            function pushUniqueOutput(text) {
                if (!text || seenOutputs.has(text)) return;
                seenOutputs.add(text);
                outputs.push(text);
            }

            const recipeInputs = Array.isArray(recipe.inputs) ? recipe.inputs : [];
            for (let i = 0; i < recipeInputs.length; i++) {
                const input = recipeInputs[i];
                if (!input || typeof input !== 'object' || typeof input.itemId !== 'string') continue;
                pushUniqueInput(formatSkillPanelItemAmount(input.itemId, input.amount));
            }

            if (typeof recipe.sourceItemId === 'string' && recipe.sourceItemId) {
                pushUniqueInput(formatSkillPanelItemAmount(recipe.sourceItemId, 1));
            }
            if (typeof recipe.essenceItemId === 'string' && recipe.essenceItemId) {
                pushUniqueInput(formatSkillPanelItemAmount(recipe.essenceItemId, 1));
            }
            if (recipe.requiresSecondaryRune && typeof recipe.secondaryRuneItemId === 'string' && recipe.secondaryRuneItemId) {
                pushUniqueInput(`${formatSkillPanelItemAmount(recipe.secondaryRuneItemId, 1)} (secondary rune)`);
            }
            if (recipe.extraRequirement && typeof recipe.extraRequirement === 'object' && typeof recipe.extraRequirement.itemId === 'string') {
                const amount = Number.isFinite(recipe.extraRequirement.amount) ? recipe.extraRequirement.amount : 1;
                const consumeOn = (typeof recipe.extraRequirement.consumeOn === 'string' && recipe.extraRequirement.consumeOn.trim())
                    ? recipe.extraRequirement.consumeOn.trim()
                    : '';
                const suffix = consumeOn ? ` (${consumeOn})` : '';
                pushUniqueInput(`${formatSkillPanelItemAmount(recipe.extraRequirement.itemId, amount)}${suffix}`);
            }

            if (recipe.output && typeof recipe.output === 'object' && typeof recipe.output.itemId === 'string') {
                pushUniqueOutput(formatSkillPanelItemAmount(recipe.output.itemId, recipe.output.amount));
            }
            if (typeof recipe.outputItemId === 'string' && recipe.outputItemId) {
                const outputAmount = Number.isFinite(recipe.outputAmount) ? recipe.outputAmount : 1;
                pushUniqueOutput(formatSkillPanelItemAmount(recipe.outputItemId, outputAmount));
            }
            if (typeof recipe.cookedItemId === 'string' && recipe.cookedItemId) {
                pushUniqueOutput(`Success: ${formatSkillPanelItemAmount(recipe.cookedItemId, 1)}`);
            }
            if (typeof recipe.burntItemId === 'string' && recipe.burntItemId) {
                pushUniqueOutput(`Burn result: ${formatSkillPanelItemAmount(recipe.burntItemId, 1)}`);
            }
            if (skillName === 'firemaking') {
                pushUniqueOutput('Creates an active fire on the target tile');
            }

            if (Number.isFinite(recipe.requiredLevel)) meta.push(`Required level: ${Math.max(1, Math.floor(recipe.requiredLevel))}`);
            if (Array.isArray(recipe.requiredToolIds) && recipe.requiredToolIds.length > 0) {
                const tools = recipe.requiredToolIds.map((id) => resolveSkillPanelItemName(id)).join(', ');
                meta.push(`Tools: ${tools}`);
            }
            if (typeof recipe.stationType === 'string' && recipe.stationType) meta.push(`Station: ${formatSkillPanelText(recipe.stationType)}`);
            if (typeof recipe.sourceTarget === 'string' && recipe.sourceTarget) meta.push(`Target: ${formatSkillPanelText(recipe.sourceTarget)}`);
            if (typeof recipe.altarName === 'string' && recipe.altarName.trim()) meta.push(`Altar: ${recipe.altarName.trim()}`);
            if (Number.isFinite(recipe.xpPerAction)) meta.push(`XP per action: ${recipe.xpPerAction}`);
            else if (Number.isFinite(recipe.xpPerSuccess)) meta.push(`XP per success: ${recipe.xpPerSuccess}`);
            else if (Number.isFinite(recipe.xpPerEssence)) meta.push(`XP per essence: ${recipe.xpPerEssence}`);
            if (Number.isFinite(recipe.actionTicks)) meta.push(`Action ticks: ${Math.max(1, Math.floor(recipe.actionTicks))}`);
            if (Number.isFinite(recipe.fireLifetimeTicks)) meta.push(`Fire lifetime ticks: ${Math.max(1, Math.floor(recipe.fireLifetimeTicks))}`);
            if (Number.isFinite(recipe.ignitionDifficulty)) meta.push(`Ignition difficulty: ${Math.max(1, Math.floor(recipe.ignitionDifficulty))}`);
            if (Number.isFinite(recipe.burnDifficulty)) meta.push(`Burn difficulty: ${Math.max(1, Math.floor(recipe.burnDifficulty))}`);
            if (typeof recipe.requiredUnlockFlag === 'string' && recipe.requiredUnlockFlag) {
                meta.push(`Unlock flag: ${formatSkillPanelText(recipe.requiredUnlockFlag)}`);
            }

            return { inputs, outputs, meta };
        }

        function buildSkillPanelUnlockDetailsElement(skillName, unlockLevel, unlockEntry) {
            const detailsEl = document.createElement('div');
            detailsEl.className = 'ml-2 mr-1 mb-1 border border-[#6b5733] bg-[#1f1811] px-2 py-1.5 text-[10px] leading-4 text-gray-200';

            const title = document.createElement('div');
            title.className = 'text-[#ffd27d] font-bold uppercase tracking-wide';
            title.innerText = unlockEntry.label;
            detailsEl.appendChild(title);

            const summaryRows = [
                `Unlock level: ${Number.isFinite(unlockLevel) ? Math.max(1, Math.floor(unlockLevel)) : 1}`,
                `Type: ${getSkillPanelUnlockTypeLabel(unlockEntry)}`
            ];
            addSkillPanelDetailSection(detailsEl, 'Summary', summaryRows);

            const recipeDetails = buildSkillPanelRecipeDetails(skillName, unlockEntry);
            if (recipeDetails) {
                addSkillPanelDetailSection(detailsEl, 'Ingredients', recipeDetails.inputs.length ? recipeDetails.inputs : ['None']);
                addSkillPanelDetailSection(detailsEl, 'Results', recipeDetails.outputs.length ? recipeDetails.outputs : ['No explicit output row']);
                addSkillPanelDetailSection(detailsEl, 'Notes', recipeDetails.meta.length ? recipeDetails.meta : ['No additional recipe metadata']);
            } else {
                addSkillPanelDetailSection(detailsEl, 'Details', ['No structured recipe data is attached to this unlock yet.']);
            }
            return detailsEl;
        }

        function renderSkillPanelTimeline(skillName, currentLevel) {
            const focusEl = document.getElementById('skill-panel-focus');
            if (focusEl) {
                focusEl.innerText = SKILL_PANEL_FOCUS_BY_SKILL[skillName] || 'Train this skill to unlock new gameplay options.';
            }

            const timelineEl = document.getElementById('skill-panel-unlocks');
            if (!timelineEl) return;
            timelineEl.innerHTML = '';

            const entries = buildSkillPanelTimeline(skillName);
            if (!entries.length) {
                const empty = document.createElement('div');
                empty.className = 'text-gray-400';
                empty.innerText = 'No tracked unlock data is available yet for this skill.';
                timelineEl.appendChild(empty);
                return;
            }

            const tiers = buildSkillPanelTierGroups(skillName, entries);
            const nextEntry = entries.find((entry) => entry.level > currentLevel) || entries[entries.length - 1];

            if (activeSkillPanelTierLevel === null) {
                activeSkillPanelTierLevel = SKILL_PANEL_TIER_COLLAPSED;
                activeSkillPanelUnlockKey = null;
            } else if (activeSkillPanelTierLevel !== SKILL_PANEL_TIER_COLLAPSED && !tiers.some((tier) => tier.id === activeSkillPanelTierLevel)) {
                activeSkillPanelTierLevel = SKILL_PANEL_TIER_COLLAPSED;
                activeSkillPanelUnlockKey = null;
            }

            if (activeSkillPanelTierLevel === SKILL_PANEL_TIER_COLLAPSED) {
                activeSkillPanelUnlockKey = null;
            } else if (activeSkillPanelTierLevel !== null && activeSkillPanelUnlockKey) {
                const activeTier = tiers.find((tier) => tier.id === activeSkillPanelTierLevel) || null;
                if (!activeTier || !activeTier.entries.length) {
                    activeSkillPanelUnlockKey = null;
                } else {
                    let hasSelectedUnlock = false;
                    for (let i = 0; i < activeTier.entries.length && !hasSelectedUnlock; i++) {
                        const entry = activeTier.entries[i];
                        hasSelectedUnlock = !!entry.unlocks.find((unlock) => unlock.key === activeSkillPanelUnlockKey);
                    }
                    if (!hasSelectedUnlock) activeSkillPanelUnlockKey = null;
                }
            }

            for (let i = 0; i < tiers.length; i++) {
                const tier = tiers[i];
                const isTierExpanded = activeSkillPanelTierLevel === tier.id;
                const tierUnlockCount = getTierUnlockCount(tier);
                const tierUnlocked = currentLevel >= tier.start;
                const tierHasNext = nextEntry.level >= tier.start && (tier.end === null || nextEntry.level <= tier.end);

                const tierWrap = document.createElement('div');
                tierWrap.className = 'border border-[#3e3529] bg-[#120e0b]';

                const tierBtn = document.createElement('button');
                tierBtn.type = 'button';
                tierBtn.className = tierUnlocked
                    ? 'w-full text-left px-2 py-1.5 flex items-center justify-between text-[#9fdc8f] hover:bg-[#1f1914] transition-colors'
                    : (tierHasNext
                        ? 'w-full text-left px-2 py-1.5 flex items-center justify-between text-[#ffd27d] hover:bg-[#1f1914] transition-colors'
                        : 'w-full text-left px-2 py-1.5 flex items-center justify-between text-gray-300 hover:bg-[#1f1914] transition-colors');

                const tierLabel = document.createElement('span');
                tierLabel.className = 'font-bold';
                tierLabel.innerText = `${tier.label} - ${tierUnlockCount} unlock${tierUnlockCount === 1 ? '' : 's'}`;

                const tierCaret = document.createElement('span');
                tierCaret.className = 'text-[10px]';
                tierCaret.innerText = isTierExpanded ? '^' : 'v';

                tierBtn.appendChild(tierLabel);
                tierBtn.appendChild(tierCaret);
                tierBtn.onclick = () => {
                    if (activeSkillPanelTierLevel === tier.id) {
                        activeSkillPanelTierLevel = SKILL_PANEL_TIER_COLLAPSED;
                        activeSkillPanelUnlockKey = null;
                    } else {
                        activeSkillPanelTierLevel = tier.id;
                        activeSkillPanelUnlockKey = null;
                    }
                    renderSkillPanelTimeline(skillName, currentLevel);
                };
                tierWrap.appendChild(tierBtn);

                if (isTierExpanded) {
                    const tierBody = document.createElement('div');
                    tierBody.className = 'border-t border-[#3e3529] px-2 py-1 space-y-1';

                    if (!tier.entries.length) {
                        const emptyTierRow = document.createElement('div');
                        emptyTierRow.className = 'text-gray-500 px-1.5 py-1';
                        emptyTierRow.innerText = 'No tracked unlocks in this tier yet.';
                        tierBody.appendChild(emptyTierRow);
                    } else {
                        for (let j = 0; j < tier.entries.length; j++) {
                            const entry = tier.entries[j];
                            const isLevelUnlocked = entry.level <= currentLevel;
                            const isLevelNext = entry.level > currentLevel && entry.level === nextEntry.level;

                            const levelHeader = document.createElement('div');
                            levelHeader.className = isLevelUnlocked
                                ? 'px-1.5 py-1 text-[#9fdc8f] text-[10px] uppercase tracking-wide font-bold'
                                : (isLevelNext
                                    ? 'px-1.5 py-1 text-[#ffd27d] text-[10px] uppercase tracking-wide font-bold'
                                    : 'px-1.5 py-1 text-gray-400 text-[10px] uppercase tracking-wide font-bold');
                            levelHeader.innerText = `Lv ${entry.level} - ${entry.unlocks.length} unlock${entry.unlocks.length === 1 ? '' : 's'}`;
                            tierBody.appendChild(levelHeader);

                            for (let k = 0; k < entry.unlocks.length; k++) {
                                const unlock = entry.unlocks[k];
                                const isRecipe = unlock.unlockType === SKILL_PANEL_RECIPE_UNLOCK_TYPE && unlock.recipe;
                                const isSelected = activeSkillPanelUnlockKey === unlock.key;
                                const unlockBtn = document.createElement('button');
                                unlockBtn.type = 'button';
                                unlockBtn.className = isSelected
                                    ? 'w-full text-left px-1.5 py-1 border border-[#6b5733] bg-[#2b2115] text-[#ffd27d] hover:bg-[#352718] transition-colors'
                                    : 'w-full text-left px-1.5 py-1 border border-[#3e3529] text-gray-200 hover:bg-[#241d17] transition-colors';

                                const label = document.createElement('div');
                                label.innerText = unlock.label;

                                const badge = document.createElement('div');
                                badge.className = 'text-[10px] uppercase tracking-wide text-[#c8aa6e]';
                                if (isSelected) badge.innerText = 'Hide Details';
                                else badge.innerText = isRecipe ? 'View Recipe' : 'View Details';

                                unlockBtn.appendChild(label);
                                unlockBtn.appendChild(badge);
                                unlockBtn.onclick = () => {
                                    activeSkillPanelUnlockKey = isSelected ? null : unlock.key;
                                    renderSkillPanelTimeline(skillName, currentLevel);
                                };
                                tierBody.appendChild(unlockBtn);

                                if (isSelected) {
                                    const detailsEl = buildSkillPanelUnlockDetailsElement(skillName, entry.level, unlock);
                                    if (detailsEl) tierBody.appendChild(detailsEl);
                                }
                            }
                        }
                    }

                    tierWrap.appendChild(tierBody);
                }

                timelineEl.appendChild(tierWrap);
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

        function renderSkillTilesFromManifest() {
            const container = document.getElementById('view-stats');
            if (!container) return;
            const defs = getSkillTileDefinitions();
            container.innerHTML = '';

            for (let i = 0; i < defs.length; i++) {
                const def = defs[i] || {};
                const skillId = typeof def.skillId === 'string' ? def.skillId : '';
                const levelKey = typeof def.levelKey === 'string' ? def.levelKey : '';
                if (!skillId || !levelKey) continue;

                const icon = (typeof def.icon === 'string' && def.icon.trim()) ? def.icon.trim() : skillId.slice(0, 3).toUpperCase();
                const displayName = (typeof def.displayName === 'string' && def.displayName.trim()) ? def.displayName.trim() : skillId;
                const initialLevel = (playerSkills && playerSkills[skillId] && Number.isFinite(playerSkills[skillId].level))
                    ? Math.max(1, Math.floor(playerSkills[skillId].level))
                    : 1;

                const tile = document.createElement('div');
                tile.className = 'skill-tile w-full bg-[#111418] border border-[#3a444c] p-1 py-2 text-center text-[10px] text-[#c8aa6e] font-bold shadow-inner cursor-pointer hover:bg-[#1a1f24] select-none';
                tile.dataset.skill = skillId;
                tile.dataset.skillName = displayName;
                tile.dataset.skillIcon = icon;
                tile.title = displayName;

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
                container.appendChild(tile);
            }
        }

        function closeSkillProgressPanel() {
            const panel = document.getElementById('skill-panel');
            if (!panel) return;
            panel.classList.add('hidden');
            activeSkillPanelSkill = null;
            activeSkillPanelTierLevel = null;
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

            const tile = document.querySelector(`.skill-tile[data-skill="${skillName}"]`);
            const tileMeta = getSkillTileMeta(skillName) || {};
            const skill = playerSkills[skillName];
            const level = skill.level;
            const xp = skill.xp;
            const levelXp = getXpForLevel(level);
            const nextLevel = Math.min(MAX_SKILL_LEVEL, level + 1);
            const nextLevelXp = level >= MAX_SKILL_LEVEL ? levelXp : getXpForLevel(nextLevel);
            const span = Math.max(1, nextLevelXp - levelXp);
            const gained = Math.max(0, xp - levelXp);
            const pct = level >= MAX_SKILL_LEVEL ? 100 : Math.max(0, Math.min(100, (gained / span) * 100));

            const icon = tile ? tile.dataset.skillIcon : (tileMeta.icon || '?');
            const name = tile ? tile.dataset.skillName : (tileMeta.displayName || skillName);

            document.getElementById('skill-panel-icon').innerText = icon;
            document.getElementById('skill-panel-title').innerText = name;
            document.getElementById('skill-panel-level').innerText = level;
            document.getElementById('skill-panel-xp').innerText = xp.toLocaleString();
            document.getElementById('skill-panel-next').innerText = level >= MAX_SKILL_LEVEL ? 'Maxed' : (nextLevelXp.toLocaleString() + ' XP');
            document.getElementById('skill-panel-progress').style.width = pct.toFixed(1) + '%';
            document.getElementById('skill-panel-percent').innerText = pct.toFixed(1) + '% to next level';
            renderSkillPanelTimeline(skillName, level);
        }

        function openSkillProgressPanel(skillName, tileEl) {
            if (!skillName || !playerSkills[skillName]) return;

            if (activeSkillTile) activeSkillTile.classList.remove('skill-tile-active');
            activeSkillTile = tileEl || null;
            if (activeSkillTile) activeSkillTile.classList.add('skill-tile-active');

            activeSkillPanelTierLevel = SKILL_PANEL_TIER_COLLAPSED;
            activeSkillPanelUnlockKey = null;
            activeSkillPanelSkill = skillName;
            updateSkillProgressPanel(skillName, { force: true });
            const panel = document.getElementById('skill-panel');
            if (panel) panel.classList.remove('hidden');
        }
        function initInventoryUI() {
            const tabs = ['inv', 'equip', 'stats'];
            const mainContainer = document.getElementById('main-ui-container');
            if (mainContainer) mainContainer.dataset.activeTab = 'inv';
            tabs.forEach(t => {
                const btn = document.getElementById(`tab-${t}`);
                btn.onclick = () => {
                    tabs.forEach(other => {
                        const isTarget = other === t; const view = document.getElementById(`view-${other}`); const btnOther = document.getElementById(`tab-${other}`);
                    if (isTarget) {
                            if (mainContainer) mainContainer.dataset.activeTab = other;
                            view.classList.remove('hidden'); if(other === 'equip') view.classList.add('flex'); else view.classList.add('grid');
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
            const skillTiles = Array.from(document.querySelectorAll('.skill-tile'));
            skillTiles.forEach(tile => {
                tile.onclick = () => openSkillProgressPanel(tile.dataset.skill, tile);
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
            if (typeof window.updateStats === 'function') window.updateStats();
            updatePlayerModel();
        }
