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
            const defaults = economy && typeof economy.getMerchantDefaultSellItemIds === 'function'
                ? economy.getMerchantDefaultSellItemIds(merchantId)
                : [];
            const hasExplicitMerchantConfig = economy && typeof economy.hasMerchantConfig === 'function'
                ? economy.hasMerchantConfig(merchantId)
                : false;

            if (defaults.length > 0) {
                for (let i = 0; i < defaults.length; i++) {
                    seedShopInventorySlot(inventoryArray, defaults[i], 20, true);
                }
                return inventoryArray;
            }

            // Keep explicitly configured merchants with empty default stock (buys-only) truly empty.
            if (hasExplicitMerchantConfig) {
                return inventoryArray;
            }

            seedShopInventorySlot(inventoryArray, 'iron_axe', 5, true);
            seedShopInventorySlot(inventoryArray, 'tinderbox', 10, true);
            seedShopInventorySlot(inventoryArray, 'knife', 10, true);
            seedShopInventorySlot(inventoryArray, 'iron_pickaxe', 5, true);
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

        function closeSkillProgressPanel() {
            const panel = document.getElementById('skill-panel');
            if (!panel) return;
            panel.classList.add('hidden');
            activeSkillPanelSkill = null;
            if (activeSkillTile) activeSkillTile.classList.remove('skill-tile-active');
            activeSkillTile = null;
        }

        function updateSkillProgressPanel(skillName) {
            if (!skillName || !playerSkills[skillName]) return;

            const panel = document.getElementById('skill-panel');
            if (!panel) return;

            const tile = document.querySelector(`.skill-tile[data-skill="${skillName}"]`);
            const skill = playerSkills[skillName];
            const level = skill.level;
            const xp = skill.xp;
            const levelXp = getXpForLevel(level);
            const nextLevel = Math.min(MAX_SKILL_LEVEL, level + 1);
            const nextLevelXp = level >= MAX_SKILL_LEVEL ? levelXp : getXpForLevel(nextLevel);
            const span = Math.max(1, nextLevelXp - levelXp);
            const gained = Math.max(0, xp - levelXp);
            const pct = level >= MAX_SKILL_LEVEL ? 100 : Math.max(0, Math.min(100, (gained / span) * 100));

            const icon = tile ? tile.dataset.skillIcon : '?';
            const name = tile ? tile.dataset.skillName : skillName;

            document.getElementById('skill-panel-icon').innerText = icon;
            document.getElementById('skill-panel-title').innerText = name;
            document.getElementById('skill-panel-level').innerText = level;
            document.getElementById('skill-panel-xp').innerText = xp.toLocaleString();
            document.getElementById('skill-panel-next').innerText = level >= MAX_SKILL_LEVEL ? 'Maxed' : (nextLevelXp.toLocaleString() + ' XP');
            document.getElementById('skill-panel-progress').style.width = pct.toFixed(1) + '%';
            document.getElementById('skill-panel-percent').innerText = pct.toFixed(1) + '% to next level';
        }

        function openSkillProgressPanel(skillName, tileEl) {
            if (!skillName || !playerSkills[skillName]) return;

            if (activeSkillTile) activeSkillTile.classList.remove('skill-tile-active');
            activeSkillTile = tileEl || null;
            if (activeSkillTile) activeSkillTile.classList.add('skill-tile-active');

            activeSkillPanelSkill = skillName;
            updateSkillProgressPanel(skillName);
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
