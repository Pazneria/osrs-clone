// --- Bank & Drag/Drop Logic ---

        function openBank() {
            isBankOpen = true;
            document.getElementById('bank-interface').classList.remove('hidden');
            document.getElementById('tab-inv').click(); 
            document.getElementById('main-ui-container').style.zIndex = '250'; 
            renderBank();
            renderInventory(); 
        }

        function closeBank() {
            isBankOpen = false;
            document.getElementById('bank-interface').classList.add('hidden');
            document.getElementById('main-ui-container').style.zIndex = 'auto';
            renderInventory(); 
        }

        function formatStackSize(num) {
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
            return `<span class="item-amt ${colorClass}">${text}</span>`;
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
                    
                    slot.onclick = () => withdrawBankItem(i, 1);
                    
                    slot.oncontextmenu = (e) => {
                        e.preventDefault(); e.stopPropagation(); closeContextMenu();
                        contextOptionsListEl.innerHTML = '';
                        addContextMenuOption(`Withdraw-1 <span class="text-white">${bItem.itemData.name}</span>`, () => withdrawBankItem(i, 1));
                        addContextMenuOption(`Withdraw-5 <span class="text-white">${bItem.itemData.name}</span>`, () => withdrawBankItem(i, 5));
                        addContextMenuOption(`Withdraw-10 <span class="text-white">${bItem.itemData.name}</span>`, () => withdrawBankItem(i, 10));
                        addContextMenuOption(`Withdraw-All <span class="text-white">${bItem.itemData.name}</span>`, () => withdrawBankItem(i, bItem.amount));
                        addContextMenuOption(`Withdraw-X <span class="text-white">${bItem.itemData.name}</span>`, () => promptAmount((amt) => withdrawBankItem(i, amt)));
                        showContextMenuAt(e.clientX, e.clientY);
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
                for (let i = 0; i < 28 && amountToDeposit < targetAmount; i++) {
                    let checkIdx = i === 0 ? invIndex : (i === invIndex ? 0 : i); 
                    if (inventory[checkIdx] && inventory[checkIdx].itemData.id === itemData.id) {
                        let bIndex = bankItems.findIndex(b => b !== null && b.itemData.id === itemData.id);
                        let slot = bIndex !== -1 ? bIndex : (targetBankIndex !== -1 && bankItems[targetBankIndex] === null ? targetBankIndex : bankItems.indexOf(null));
                        
                        if (slot !== -1) {
                            if (bankItems[slot]) bankItems[slot].amount += 1;
                            else bankItems[slot] = { itemData: itemData, amount: 1 };
                            inventory[checkIdx] = null;
                            amountToDeposit++;
                        } else {
                            console.log("Bank is full!"); break;
                        }
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
        let shopInventory = Array(100).fill(null);
        shopInventory[0] = { itemData: ITEM_DB['iron_axe'], amount: 5 };
        shopInventory[1] = { itemData: ITEM_DB['tinderbox'], amount: 10 };
        shopInventory[2] = { itemData: ITEM_DB['knife'], amount: 10 };
        shopInventory[3] = { itemData: ITEM_DB['iron_pickaxe'], amount: 5 };

        function openShop() {
            isShopOpen = true;
            document.getElementById('shop-interface').classList.remove('hidden');
            document.getElementById('tab-inv').click(); 
            document.getElementById('main-ui-container').style.zIndex = '250'; 
            renderShop();
            renderInventory(); 
        }

        function closeShop() {
            isShopOpen = false;
            document.getElementById('shop-interface').classList.add('hidden');
            document.getElementById('main-ui-container').style.zIndex = 'auto';
            renderInventory(); 
        }

        function renderShop() {
            const container = document.getElementById('shop-grid');
            container.innerHTML = '';
            for (let i = 0; i < 100; i++) {
                const slot = document.createElement('div');
                slot.className = 'w-9 h-9 bg-[#231e18] border-b-2 border-r-2 border-[#15120e] border-t border-l border-[#4a4136] flex items-center justify-center text-xl cursor-pointer hover:bg-[#2b251d] select-none relative group transition-colors';
                const sItem = shopInventory[i];
                if (sItem && sItem.amount > 0) {
                    slot.innerHTML = `${sItem.itemData.icon}${formatStackSize(sItem.amount)}`;
                    slot.title = `${sItem.itemData.name} - ${sItem.itemData.value} coins`;
                    slot.onclick = () => buyItem(i, 1);
                    slot.oncontextmenu = (e) => {
                        e.preventDefault(); e.stopPropagation(); closeContextMenu();
                        contextOptionsListEl.innerHTML = '';
                        addContextMenuOption(`Value <span class="text-white">${sItem.itemData.name}</span>`, () => console.log(`${sItem.itemData.name} costs ${sItem.itemData.value} coins.`));
                        addContextMenuOption(`Buy-1 <span class="text-white">${sItem.itemData.name}</span>`, () => buyItem(i, 1));
                        addContextMenuOption(`Buy-5 <span class="text-white">${sItem.itemData.name}</span>`, () => buyItem(i, 5));
                        addContextMenuOption(`Buy-10 <span class="text-white">${sItem.itemData.name}</span>`, () => buyItem(i, 10));
                        addContextMenuOption(`Buy-50 <span class="text-white">${sItem.itemData.name}</span>`, () => buyItem(i, 50));
                        addContextMenuOption(`Buy-X <span class="text-white">${sItem.itemData.name}</span>`, () => promptAmount((amt) => buyItem(i, amt)));
                        showContextMenuAt(e.clientX, e.clientY);
                    };
                } else slot.oncontextmenu = (e) => e.preventDefault();
                container.appendChild(slot);
            }
        }

        function buyItem(shopIdx, amount) {
            const sItem = shopInventory[shopIdx];
            if (!sItem || sItem.amount <= 0) return;
            let cost = sItem.itemData.value;
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
            let sellValue = Math.floor(itemData.value * 0.4); 
            let amountSold = 0;
            let targetAmount = amount === -1 ? (itemData.stackable ? invSlot.amount : 28) : amount;

            if (itemData.stackable) {
                amountSold = Math.min(targetAmount, invSlot.amount);
                inventory[invIdx].amount -= amountSold;
                if (inventory[invIdx].amount <= 0) inventory[invIdx] = null;
            } else {
                for (let i = 0; i < 28 && amountSold < targetAmount; i++) {
                    let checkIdx = i === 0 ? invIdx : (i === invIdx ? 0 : i); 
                    if (inventory[checkIdx] && inventory[checkIdx].itemData.id === itemData.id) {
                        inventory[checkIdx] = null;
                        amountSold++;
                    }
                }
            }

            if (amountSold > 0) {
                let shopIdx = shopInventory.findIndex(s => s && s.itemData.id === itemData.id);
                if (shopIdx === -1) {
                    shopIdx = shopInventory.indexOf(null);
                    if (shopIdx !== -1) shopInventory[shopIdx] = { itemData: itemData, amount: 0 };
                }
                if (shopIdx !== -1) shopInventory[shopIdx].amount += amountSold;
                
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
                slot.className = 'w-9 h-9 bg-[#111418] border-b-2 border-r-2 border-[#090b0c] border-t border-l border-[#3a444c] flex items-center justify-center text-xl cursor-pointer hover:bg-[#1a1f24] select-none relative group';
                
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
                    slot.innerHTML = `${item.icon}${formatStackSize(itemDataSlot.amount)}`; 
                    slot.draggable = true;
                    slot.addEventListener('dragstart', (e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify({ source: 'inv', index: i }));
                        e.dataTransfer.effectAllowed = 'move';
                        slot.style.opacity = '0.4';
                    });
                    slot.addEventListener('dragend', () => { slot.style.opacity = '1'; });

                    if (isBankOpen) {
                        slot.title = `Deposit ${item.name}`;
                        slot.onclick = () => depositInvItem(i, 1);
                        slot.oncontextmenu = (e) => {
                            e.preventDefault(); e.stopPropagation(); closeContextMenu();
                            contextOptionsListEl.innerHTML = '';
                            addContextMenuOption(`Deposit-1 <span class="text-white">${item.name}</span>`, () => depositInvItem(i, 1));
                            addContextMenuOption(`Deposit-5 <span class="text-white">${item.name}</span>`, () => depositInvItem(i, 5));
                            addContextMenuOption(`Deposit-10 <span class="text-white">${item.name}</span>`, () => depositInvItem(i, 10));
                            addContextMenuOption(`Deposit-All <span class="text-white">${item.name}</span>`, () => depositInvItem(i, -1));
                            addContextMenuOption(`Deposit-X <span class="text-white">${item.name}</span>`, () => promptAmount((amt) => depositInvItem(i, amt)));
                            showContextMenuAt(e.clientX, e.clientY);
                        };
                    } else if (typeof isShopOpen !== 'undefined' && isShopOpen) {
                        slot.title = `Sell ${item.name}`;
                        slot.onclick = () => sellItem(i, 1);
                        slot.oncontextmenu = (e) => {
                            e.preventDefault(); e.stopPropagation(); closeContextMenu();
                            contextOptionsListEl.innerHTML = '';
                            addContextMenuOption(`Value <span class="text-white">${item.name}</span>`, () => console.log(`${item.name} sells for ${Math.floor(item.value * 0.4)} coins.`));
                            addContextMenuOption(`Sell-1 <span class="text-white">${item.name}</span>`, () => sellItem(i, 1));
                            addContextMenuOption(`Sell-5 <span class="text-white">${item.name}</span>`, () => sellItem(i, 5));
                            addContextMenuOption(`Sell-10 <span class="text-white">${item.name}</span>`, () => sellItem(i, 10));
                            addContextMenuOption(`Sell-50 <span class="text-white">${item.name}</span>`, () => sellItem(i, 50));
                            addContextMenuOption(`Sell-X <span class="text-white">${item.name}</span>`, () => promptAmount((amt) => sellItem(i, amt)));
                            showContextMenuAt(e.clientX, e.clientY);
                        };
                    } else {
                        const defaultAction = userItemPrefs[item.id] || item.defaultAction;
                        slot.title = `${defaultAction} ${item.name}`; 
                        slot.onclick = () => handleInventorySlotClick(i, defaultAction); 
                        slot.oncontextmenu = (e) => {
                            e.preventDefault(); e.stopPropagation(); closeContextMenu();
                            contextOptionsListEl.innerHTML = '';
                            item.actions.forEach(action => { addContextMenuOption(`${action} ${item.name}`, () => handleItemAction(i, action)); });
                            const swapHeader = document.createElement('div');
                            swapHeader.className = 'px-2 py-1 mt-1 text-gray-400 text-[10px] font-bold border-b border-[#4a4136] uppercase tracking-wider bg-[#3e3529] pointer-events-none';
                            swapHeader.innerText = 'Configure Left-Click:';
                            contextOptionsListEl.appendChild(swapHeader);
                            item.actions.forEach(action => {
                                if (action !== defaultAction) {
                                    addContextMenuOption(`Set to <span class="text-white">${action}</span>`, () => { userItemPrefs[item.id] = action; renderInventory(); });
                                }
                            });
                            const exHeader = document.createElement('div'); exHeader.className = 'mt-1 border-t border-[#4a4136] pointer-events-none'; contextOptionsListEl.appendChild(exHeader);
                            addContextMenuOption(`Examine ${item.name}`, () => console.log(`EXAMINING: ${item.name}.`));
                            showContextMenuAt(e.clientX, e.clientY);
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
            tabs.forEach(t => {
                const btn = document.getElementById(`tab-${t}`);
                btn.onclick = () => {
                    tabs.forEach(other => {
                        const isTarget = other === t; const view = document.getElementById(`view-${other}`); const btnOther = document.getElementById(`tab-${other}`);
                        if (isTarget) {
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
            const mainContainer = document.getElementById('main-ui-container');
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
                if (e.target.closest('#skill-panel') || e.target.closest('.skill-tile')) return;
                closeSkillProgressPanel();
            });

            Object.keys(playerSkills).forEach(skill => { if (typeof window.refreshSkillUi === 'function') window.refreshSkillUi(skill); });
            renderInventory(); renderEquipment();
            if (typeof window.updateStats === 'function') window.updateStats();
            updatePlayerModel();
        }










