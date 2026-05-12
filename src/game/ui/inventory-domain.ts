import type {
  BankOperationResult,
  BankSlotViewModel,
  InventorySlotViewModel,
  MerchantEconomyLike,
  SelectedUseState,
  ShopOperationResult,
  ShopSlotViewModel,
  UiItemData,
  UiItemSlot
} from "../contracts/ui";

function cloneSlot(slot: UiItemSlot | null | undefined): UiItemSlot | null {
  if (!slot || !slot.itemData) return null;
  return {
    itemData: slot.itemData,
    amount: Number.isFinite(slot.amount) ? Math.max(0, Math.floor(slot.amount)) : 0,
    normalStock: !!slot.normalStock
  };
}

export function cloneSlotArray(slots: Array<UiItemSlot | null> | null | undefined): Array<UiItemSlot | null> {
  if (!Array.isArray(slots)) return [];
  return slots.map((slot) => cloneSlot(slot));
}

function getBaseValue(itemDb: Record<string, UiItemData>, itemId: string): number {
  const item = itemDb[itemId];
  return item && Number.isFinite(item.value) ? Math.max(0, Math.floor(Number(item.value))) : 0;
}

export function collectMatchingSlotIndexes(
  slots: Array<UiItemSlot | null>,
  itemId: string,
  preferredIndex: number,
  maxCount: number
): number[] {
  const matched: number[] = [];
  if (!Array.isArray(slots) || !itemId || maxCount <= 0) return matched;

  const pushIndex = (index: number): void => {
    if (index < 0 || index >= slots.length) return;
    if (matched.length >= maxCount) return;
    const slot = slots[index];
    if (slot && slot.itemData && slot.itemData.id === itemId) matched.push(index);
  };

  pushIndex(preferredIndex);
  for (let index = 0; index < slots.length && matched.length < maxCount; index += 1) {
    if (index === preferredIndex) continue;
    pushIndex(index);
  }

  return matched;
}

export function swapSlotEntries(
  slots: Array<UiItemSlot | null>,
  sourceIndex: number,
  targetIndex: number
): Array<UiItemSlot | null> {
  const nextSlots = cloneSlotArray(slots);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex >= nextSlots.length || targetIndex >= nextSlots.length) {
    return nextSlots;
  }
  const temp = nextSlots[sourceIndex];
  nextSlots[sourceIndex] = nextSlots[targetIndex];
  nextSlots[targetIndex] = temp;
  return nextSlots;
}

export function addItemToInventory(
  inventorySlots: Array<UiItemSlot | null>,
  itemData: UiItemData,
  requestedAmount = 1
): { inventory: Array<UiItemSlot | null>; amountGiven: number } {
  const inventory = cloneSlotArray(inventorySlots);
  const amount = Number.isFinite(requestedAmount) ? Math.max(0, Math.floor(requestedAmount)) : 0;
  if (!itemData || !itemData.id || amount <= 0) return { inventory, amountGiven: 0 };

  if (itemData.stackable) {
    const existingIndex = inventory.findIndex((slot) => slot && slot.itemData && slot.itemData.id === itemData.id);
    if (existingIndex !== -1 && inventory[existingIndex]) {
      inventory[existingIndex]!.amount += amount;
      return { inventory, amountGiven: amount };
    }

    const emptyIndex = inventory.indexOf(null);
    if (emptyIndex === -1) return { inventory, amountGiven: 0 };
    inventory[emptyIndex] = { itemData, amount };
    return { inventory, amountGiven: amount };
  }

  let amountGiven = 0;
  for (let count = 0; count < amount; count += 1) {
    const emptyIndex = inventory.indexOf(null);
    if (emptyIndex === -1) break;
    inventory[emptyIndex] = { itemData, amount: 1 };
    amountGiven += 1;
  }
  return { inventory, amountGiven };
}

function removeItemAmountFromInventory(
  inventorySlots: Array<UiItemSlot | null>,
  itemId: string,
  requestedAmount: number
): { inventory: Array<UiItemSlot | null>; amountRemoved: number } {
  const inventory = cloneSlotArray(inventorySlots);
  const amount = Number.isFinite(requestedAmount) ? Math.max(0, Math.floor(requestedAmount)) : 0;
  if (!itemId || amount <= 0) return { inventory, amountRemoved: 0 };

  let amountRemoved = 0;
  for (let index = 0; index < inventory.length && amountRemoved < amount; index += 1) {
    const slot = inventory[index];
    if (!slot || !slot.itemData || slot.itemData.id !== itemId) continue;

    if (slot.itemData.stackable) {
      const removed = Math.min(slot.amount, amount - amountRemoved);
      slot.amount -= removed;
      amountRemoved += removed;
      if (slot.amount <= 0) inventory[index] = null;
    } else {
      inventory[index] = null;
      amountRemoved += 1;
    }
  }

  return { inventory, amountRemoved };
}

export function depositInventoryItem(options: {
  inventory: Array<UiItemSlot | null>;
  bankItems: Array<UiItemSlot | null>;
  invIndex: number;
  amount?: number;
  targetBankIndex?: number;
}): BankOperationResult {
  const inventory = cloneSlotArray(options.inventory);
  const bankItems = cloneSlotArray(options.bankItems);
  const invIndex = Number.isFinite(options.invIndex) ? Math.floor(options.invIndex) : -1;
  const targetBankIndex = Number.isFinite(options.targetBankIndex) ? Math.floor(options.targetBankIndex as number) : -1;
  const invSlot = invIndex >= 0 ? inventory[invIndex] : null;
  if (!invSlot || !invSlot.itemData) {
    return { inventory, bankItems, amountChanged: 0, reason: "missing_inventory_slot" };
  }

  const requestedAmount = Number.isFinite(options.amount)
    ? Math.floor(options.amount as number)
    : -1;
  const targetAmount = requestedAmount === -1 ? (invSlot.itemData.stackable ? invSlot.amount : 28) : Math.max(0, requestedAmount);
  let amountChanged = 0;

  if (invSlot.itemData.stackable) {
    const amountToDeposit = Math.min(targetAmount, invSlot.amount);
    const existingBankIndex = bankItems.findIndex((slot) => slot && slot.itemData && slot.itemData.id === invSlot.itemData.id);
    if (existingBankIndex === -1 && bankItems.indexOf(null) === -1 && targetBankIndex === -1) {
      return { inventory, bankItems, amountChanged: 0, reason: "bank_full" };
    }

    if (existingBankIndex !== -1 && bankItems[existingBankIndex]) {
      bankItems[existingBankIndex]!.amount += amountToDeposit;
    } else {
      const bankIndex = targetBankIndex !== -1 ? targetBankIndex : bankItems.indexOf(null);
      if (bankIndex === -1) return { inventory, bankItems, amountChanged: 0, reason: "bank_full" };
      bankItems[bankIndex] = { itemData: invSlot.itemData, amount: amountToDeposit };
    }

    invSlot.amount -= amountToDeposit;
    amountChanged = amountToDeposit;
    if (invSlot.amount <= 0) inventory[invIndex] = null;
    return { inventory, bankItems, amountChanged, reason: null };
  }

  const sourceSlots = collectMatchingSlotIndexes(inventory, invSlot.itemData.id, invIndex, targetAmount);
  for (let index = 0; index < sourceSlots.length && amountChanged < targetAmount; index += 1) {
    const sourceIndex = sourceSlots[index];
    const existingBankIndex = bankItems.findIndex((slot) => slot && slot.itemData && slot.itemData.id === invSlot.itemData.id);
    const emptyBankIndex = targetBankIndex !== -1 && bankItems[targetBankIndex] === null ? targetBankIndex : bankItems.indexOf(null);
    const bankIndex = existingBankIndex !== -1 ? existingBankIndex : emptyBankIndex;
    if (bankIndex === -1) {
      return { inventory, bankItems, amountChanged, reason: amountChanged > 0 ? "bank_full_partial" : "bank_full" };
    }
    if (bankItems[bankIndex]) bankItems[bankIndex]!.amount += 1;
    else bankItems[bankIndex] = { itemData: invSlot.itemData, amount: 1 };
    inventory[sourceIndex] = null;
    amountChanged += 1;
  }

  return { inventory, bankItems, amountChanged, reason: null };
}

export function withdrawBankItem(options: {
  inventory: Array<UiItemSlot | null>;
  bankItems: Array<UiItemSlot | null>;
  bankIndex: number;
  amount: number;
  targetInvIndex?: number;
}): BankOperationResult {
  const inventory = cloneSlotArray(options.inventory);
  const bankItems = cloneSlotArray(options.bankItems);
  const bankIndex = Number.isFinite(options.bankIndex) ? Math.floor(options.bankIndex) : -1;
  const targetInvIndex = Number.isFinite(options.targetInvIndex) ? Math.floor(options.targetInvIndex as number) : -1;
  const bankSlot = bankIndex >= 0 ? bankItems[bankIndex] : null;
  if (!bankSlot || !bankSlot.itemData) {
    return { inventory, bankItems, amountChanged: 0, reason: "missing_bank_slot" };
  }

  const requestedAmount = Number.isFinite(options.amount) ? Math.max(0, Math.floor(options.amount)) : 0;
  const actualAmount = Math.min(bankSlot.amount, requestedAmount);
  if (actualAmount <= 0) return { inventory, bankItems, amountChanged: 0, reason: "invalid_amount" };

  let amountChanged = 0;

  if (bankSlot.itemData.stackable) {
    const existingInventoryIndex = inventory.findIndex((slot) => slot && slot.itemData && slot.itemData.id === bankSlot.itemData.id);
    if (existingInventoryIndex !== -1 && inventory[existingInventoryIndex]) {
      inventory[existingInventoryIndex]!.amount += actualAmount;
      bankSlot.amount -= actualAmount;
      amountChanged = actualAmount;
    } else {
      const inventoryIndex = targetInvIndex !== -1 && inventory[targetInvIndex] === null ? targetInvIndex : inventory.indexOf(null);
      if (inventoryIndex === -1) {
        return { inventory, bankItems, amountChanged: 0, reason: "inventory_full" };
      }
      inventory[inventoryIndex] = { itemData: bankSlot.itemData, amount: actualAmount };
      bankSlot.amount -= actualAmount;
      amountChanged = actualAmount;
    }
  } else {
    for (let count = 0; count < actualAmount; count += 1) {
      const inventoryIndex = count === 0 && targetInvIndex !== -1 && inventory[targetInvIndex] === null
        ? targetInvIndex
        : inventory.indexOf(null);
      if (inventoryIndex === -1) {
        return {
          inventory,
          bankItems,
          amountChanged,
          reason: amountChanged > 0 ? "inventory_full_partial" : "inventory_full"
        };
      }
      inventory[inventoryIndex] = { itemData: bankSlot.itemData, amount: 1 };
      bankSlot.amount -= 1;
      amountChanged += 1;
    }
  }

  if (bankSlot.amount <= 0) bankItems[bankIndex] = null;
  return { inventory, bankItems, amountChanged, reason: null };
}

export function resolveMerchantBuyPrice(
  itemDb: Record<string, UiItemData>,
  economy: MerchantEconomyLike | null,
  itemId: string,
  merchantId: string
): number {
  if (economy && typeof economy.resolveBuyPrice === "function") {
    return Math.max(0, Math.floor(economy.resolveBuyPrice(itemId, merchantId) || 0));
  }
  return getBaseValue(itemDb, itemId);
}

export function resolveMerchantSellPrice(
  itemDb: Record<string, UiItemData>,
  economy: MerchantEconomyLike | null,
  itemId: string,
  merchantId: string
): number {
  if (economy && typeof economy.resolveSellPrice === "function") {
    return Math.max(0, Math.floor(economy.resolveSellPrice(itemId, merchantId) || 0));
  }
  return Math.floor(getBaseValue(itemDb, itemId) * 0.4);
}

export function seedShopInventorySlot(
  inventorySlots: Array<UiItemSlot | null>,
  itemDb: Record<string, UiItemData>,
  itemId: string,
  amount: number,
  normalStock = true
): boolean {
  if (!itemDb[itemId] || !Number.isFinite(amount) || amount <= 0) return false;
  const emptyIndex = inventorySlots.indexOf(null);
  if (emptyIndex === -1) return false;
  inventorySlots[emptyIndex] = {
    itemData: itemDb[itemId],
    amount: Math.max(1, Math.floor(amount)),
    normalStock: !!normalStock
  };
  return true;
}

export function createShopInventoryForMerchant(options: {
  merchantId: string;
  inventorySize: number;
  itemDb: Record<string, UiItemData>;
  economy: MerchantEconomyLike | null;
}): { inventory: Array<UiItemSlot | null>; warning: string | null } {
  const merchantId = options.merchantId || "general_store";
  const inventory = Array(Math.max(1, Math.floor(options.inventorySize))).fill(null) as Array<UiItemSlot | null>;
  const economy = options.economy;
  const seedRows = economy && typeof economy.getMerchantSeedStockRows === "function"
    ? economy.getMerchantSeedStockRows(merchantId)
    : [];
  const hasExplicitMerchantConfig = economy && typeof economy.hasMerchantConfig === "function"
    ? economy.hasMerchantConfig(merchantId)
    : false;

  if (seedRows.length > 0) {
    for (let index = 0; index < seedRows.length; index += 1) {
      const row = seedRows[index] || { itemId: "", stockAmount: 0 };
      if (!row.itemId) continue;
      seedShopInventorySlot(inventory, options.itemDb, row.itemId, row.stockAmount, true);
    }
    return { inventory, warning: null };
  }

  if (hasExplicitMerchantConfig) return { inventory, warning: null };

  const hasStockPolicy = economy && typeof economy.hasStockPolicy === "function"
    ? economy.hasStockPolicy(merchantId)
    : false;
  if (!hasStockPolicy) {
    return { inventory, warning: `[Shop] Merchant '${merchantId}' has no explicit stock config and no fallback stock policy.` };
  }

  return { inventory, warning: null };
}

export function ensureUnlockedMerchantStock(options: {
  shopInventory: Array<UiItemSlot | null>;
  merchantId: string;
  itemDb: Record<string, UiItemData>;
  economy: MerchantEconomyLike | null;
}): Array<UiItemSlot | null> {
  const shopInventory = cloneSlotArray(options.shopInventory);
  const economy = options.economy;
  if (!economy || typeof economy.getMerchantDefaultSellItemIds !== "function") return shopInventory;

  const defaults = economy.getMerchantDefaultSellItemIds(options.merchantId);
  const seedRows = typeof economy.getMerchantSeedStockRows === "function"
    ? economy.getMerchantSeedStockRows(options.merchantId)
    : [];
  const hasExplicitMerchantConfig = typeof economy.hasMerchantConfig === "function"
    ? economy.hasMerchantConfig(options.merchantId)
    : false;
  if (defaults.length === 0 && seedRows.length > 0 && !hasExplicitMerchantConfig) {
    const seedSet = new Set(seedRows.map((row) => row.itemId).filter(Boolean));
    for (let index = 0; index < shopInventory.length; index += 1) {
      const slot = shopInventory[index];
      if (!slot || !slot.itemData || !slot.normalStock) continue;
      if (!seedSet.has(slot.itemData.id)) shopInventory[index] = null;
    }
    for (let index = 0; index < seedRows.length; index += 1) {
      const row = seedRows[index] || { itemId: "", stockAmount: 0 };
      if (!row.itemId) continue;
      const desiredStock = Math.max(1, Math.floor(row.stockAmount || 1));
      const existing = shopInventory.find((slot) => slot && slot.itemData && slot.itemData.id === row.itemId);
      if (existing) {
        existing.normalStock = true;
        if (existing.amount < desiredStock) existing.amount = desiredStock;
        continue;
      }
      seedShopInventorySlot(shopInventory, options.itemDb, row.itemId, desiredStock, true);
    }
    return shopInventory;
  }

  const defaultSet = new Set(defaults);
  for (let index = 0; index < shopInventory.length; index += 1) {
    const slot = shopInventory[index];
    if (!slot || !slot.itemData || !slot.normalStock) continue;
    if (!defaultSet.has(slot.itemData.id)) {
      shopInventory[index] = null;
    }
  }

  for (let index = 0; index < defaults.length; index += 1) {
    const itemId = defaults[index];
    const itemData = options.itemDb[itemId];
    if (!itemData) continue;

    const desiredStock = typeof economy.getUnlockedStockAmount === "function"
      ? Math.max(1, Math.floor(economy.getUnlockedStockAmount(itemId, options.merchantId) || 20))
      : 20;
    const existing = shopInventory.find((slot) => slot && slot.itemData && slot.itemData.id === itemId);
    if (existing) {
      existing.normalStock = true;
      if (existing.amount < desiredStock) existing.amount = desiredStock;
      continue;
    }
    seedShopInventorySlot(shopInventory, options.itemDb, itemId, desiredStock, true);
  }

  return shopInventory;
}

export function buyShopItem(options: {
  inventory: Array<UiItemSlot | null>;
  shopInventory: Array<UiItemSlot | null>;
  shopIndex: number;
  amount: number;
  merchantId: string;
  itemDb: Record<string, UiItemData>;
  economy: MerchantEconomyLike | null;
}): ShopOperationResult {
  const inventory = cloneSlotArray(options.inventory);
  const shopInventory = cloneSlotArray(options.shopInventory);
  const shopIndex = Number.isFinite(options.shopIndex) ? Math.floor(options.shopIndex) : -1;
  const shopSlot = shopIndex >= 0 ? shopInventory[shopIndex] : null;
  if (!shopSlot || !shopSlot.itemData || shopSlot.amount <= 0) {
    return { inventory, shopInventory, amountChanged: 0, coinAmountChanged: 0, reason: "missing_shop_slot", unlockedNow: false };
  }
  if (shopSlot.itemData.id === "coins") {
    return { inventory, shopInventory, amountChanged: 0, coinAmountChanged: 0, reason: "cannot_buy_coins", unlockedNow: false };
  }

  const buyPrice = resolveMerchantBuyPrice(options.itemDb, options.economy, shopSlot.itemData.id, options.merchantId);
  if (!Number.isFinite(buyPrice) || buyPrice <= 0) {
    return { inventory, shopInventory, amountChanged: 0, coinAmountChanged: 0, reason: "invalid_buy_price", unlockedNow: false };
  }

  const requestedAmount = Number.isFinite(options.amount) ? Math.max(0, Math.floor(options.amount)) : 0;
  const availableCoins = inventory.reduce((sum, slot) => {
    if (!slot || !slot.itemData || slot.itemData.id !== "coins") return sum;
    return sum + slot.amount;
  }, 0);
  if (availableCoins < buyPrice) {
    return { inventory, shopInventory, amountChanged: 0, coinAmountChanged: 0, reason: "not_enough_coins", unlockedNow: false };
  }

  const affordableAmount = Math.floor(availableCoins / buyPrice);
  const canBuyAmount = Math.min(requestedAmount, shopSlot.amount, affordableAmount);
  const inventoryGrant = addItemToInventory(inventory, shopSlot.itemData, canBuyAmount);
  if (inventoryGrant.amountGiven <= 0) {
    return { inventory, shopInventory, amountChanged: 0, coinAmountChanged: 0, reason: "inventory_full", unlockedNow: false };
  }

  const totalCost = buyPrice * inventoryGrant.amountGiven;
  const inventoryAfterCoinRemoval = removeItemAmountFromInventory(inventoryGrant.inventory, "coins", totalCost);
  shopSlot.amount -= inventoryGrant.amountGiven;
  if (shopSlot.amount <= 0) shopInventory[shopIndex] = null;

  return {
    inventory: inventoryAfterCoinRemoval.inventory,
    shopInventory,
    amountChanged: inventoryGrant.amountGiven,
    coinAmountChanged: totalCost,
    reason: null,
    unlockedNow: false
  };
}

export function sellInventoryItem(options: {
  inventory: Array<UiItemSlot | null>;
  shopInventory: Array<UiItemSlot | null>;
  inventoryIndex: number;
  amount: number;
  merchantId: string;
  itemDb: Record<string, UiItemData>;
  economy: MerchantEconomyLike | null;
}): ShopOperationResult {
  const inventory = cloneSlotArray(options.inventory);
  let shopInventory = cloneSlotArray(options.shopInventory);
  const inventoryIndex = Number.isFinite(options.inventoryIndex) ? Math.floor(options.inventoryIndex) : -1;
  const inventorySlot = inventoryIndex >= 0 ? inventory[inventoryIndex] : null;
  if (!inventorySlot || !inventorySlot.itemData) {
    return { inventory, shopInventory, amountChanged: 0, coinAmountChanged: 0, reason: "missing_inventory_slot", unlockedNow: false };
  }
  if (inventorySlot.itemData.id === "coins") {
    return { inventory, shopInventory, amountChanged: 0, coinAmountChanged: 0, reason: "cannot_sell_coins", unlockedNow: false };
  }

  const economy = options.economy;
  const merchantCanBuy = economy && typeof economy.canMerchantBuyItem === "function"
    ? economy.canMerchantBuyItem(inventorySlot.itemData.id, options.merchantId)
    : true;
  if (!merchantCanBuy) {
    return { inventory, shopInventory, amountChanged: 0, coinAmountChanged: 0, reason: "merchant_wont_buy_item", unlockedNow: false };
  }

  const sellPrice = resolveMerchantSellPrice(options.itemDb, economy, inventorySlot.itemData.id, options.merchantId);
  if (!Number.isFinite(sellPrice) || sellPrice <= 0) {
    return { inventory, shopInventory, amountChanged: 0, coinAmountChanged: 0, reason: "item_has_no_sell_value", unlockedNow: false };
  }

  const requestedAmount = Number.isFinite(options.amount) ? Math.floor(options.amount) : -1;
  const targetAmount = requestedAmount === -1
    ? (inventorySlot.itemData.stackable ? inventorySlot.amount : 28)
    : Math.max(0, requestedAmount);
  let amountSold = 0;

  if (inventorySlot.itemData.stackable) {
    amountSold = Math.min(targetAmount, inventorySlot.amount);
    inventorySlot.amount -= amountSold;
    if (inventorySlot.amount <= 0) inventory[inventoryIndex] = null;
  } else {
    const sourceSlots = collectMatchingSlotIndexes(inventory, inventorySlot.itemData.id, inventoryIndex, targetAmount);
    for (let index = 0; index < sourceSlots.length && amountSold < targetAmount; index += 1) {
      inventory[sourceSlots[index]] = null;
      amountSold += 1;
    }
  }

  if (amountSold <= 0) {
    return { inventory, shopInventory, amountChanged: 0, coinAmountChanged: 0, reason: "nothing_sold", unlockedNow: false };
  }

  const unlockResult = economy && typeof economy.recordMerchantPurchaseFromPlayer === "function"
    ? economy.recordMerchantPurchaseFromPlayer(inventorySlot.itemData.id, options.merchantId, amountSold)
    : null;
  const canBeNormalStock = economy && typeof economy.canMerchantSellItem === "function"
    ? economy.canMerchantSellItem(inventorySlot.itemData.id, options.merchantId)
    : true;

  if (canBeNormalStock) {
    let shopIndex = shopInventory.findIndex((slot) => slot && slot.itemData && slot.itemData.id === inventorySlot.itemData.id);
    if (shopIndex === -1) {
      shopIndex = shopInventory.indexOf(null);
      if (shopIndex !== -1) {
        shopInventory[shopIndex] = {
          itemData: inventorySlot.itemData,
          amount: 0,
          normalStock: false
        };
      }
    }
    if (shopIndex !== -1 && shopInventory[shopIndex]) {
      shopInventory[shopIndex]!.amount += amountSold;
    }
  }

  const inventoryGrant = addItemToInventory(inventory, options.itemDb.coins, amountSold * sellPrice);
  if (unlockResult && unlockResult.unlockedNow) {
    shopInventory = ensureUnlockedMerchantStock({
      shopInventory,
      merchantId: options.merchantId,
      itemDb: options.itemDb,
      economy
    });
  }

  return {
    inventory: inventoryGrant.inventory,
    shopInventory,
    amountChanged: amountSold,
    coinAmountChanged: inventoryGrant.amountGiven,
    reason: null,
    unlockedNow: !!(unlockResult && unlockResult.unlockedNow)
  };
}

export function buildInventorySlotViewModels(options: {
  inventory: Array<UiItemSlot | null>;
  selectedUse: SelectedUseState;
}): InventorySlotViewModel[] {
  const inventory = Array.isArray(options.inventory) ? options.inventory : [];
  const selectedUse = options.selectedUse || { invIndex: null, itemId: null };
  const viewModels: InventorySlotViewModel[] = [];

  for (let index = 0; index < inventory.length; index += 1) {
    const slot = inventory[index];
    const item = slot && slot.itemData ? slot.itemData : null;
    viewModels.push({
      index,
      itemId: item ? item.id : null,
      itemName: item ? item.name : "",
      icon: item ? item.icon : "",
      amount: slot ? slot.amount : 0,
      selected: !!(slot && item && selectedUse.invIndex === index && selectedUse.itemId === item.id),
      hasItem: !!slot
    });
  }

  return viewModels;
}

export function buildBankSlotViewModels(bankItems: Array<UiItemSlot | null>): BankSlotViewModel[] {
  const slots = Array.isArray(bankItems) ? bankItems : [];
  const viewModels: BankSlotViewModel[] = [];
  for (let index = 0; index < slots.length; index += 1) {
    const slot = slots[index];
    const item = slot && slot.itemData ? slot.itemData : null;
    viewModels.push({
      index,
      itemId: item ? item.id : null,
      itemName: item ? item.name : "",
      icon: item ? item.icon : "",
      amount: slot ? slot.amount : 0,
      title: slot && item ? `${item.name} x ${slot.amount.toLocaleString()}` : "",
      hasItem: !!slot
    });
  }
  return viewModels;
}

export function buildShopSlotViewModels(options: {
  shopInventory: Array<UiItemSlot | null>;
  merchantId: string;
  itemDb: Record<string, UiItemData>;
  economy: MerchantEconomyLike | null;
}): ShopSlotViewModel[] {
  const slots = Array.isArray(options.shopInventory) ? options.shopInventory : [];
  const viewModels: ShopSlotViewModel[] = [];
  for (let index = 0; index < slots.length; index += 1) {
    const slot = slots[index];
    const item = slot && slot.itemData ? slot.itemData : null;
    const buyPrice = item
      ? resolveMerchantBuyPrice(options.itemDb, options.economy, item.id, options.merchantId)
      : 0;
    viewModels.push({
      index,
      itemId: item ? item.id : null,
      itemName: item ? item.name : "",
      icon: item ? item.icon : "",
      amount: slot ? slot.amount : 0,
      buyPrice,
      title: slot && item ? `${item.name} - ${buyPrice} coins` : "",
      hasItem: !!(slot && slot.amount > 0)
    });
  }
  return viewModels;
}
