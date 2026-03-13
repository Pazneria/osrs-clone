export interface UiItemStats {
  atk?: number;
  def?: number;
  str?: number;
  [key: string]: unknown;
}

export interface UiItemData {
  id: string;
  name: string;
  icon: string;
  stackable: boolean;
  value?: number;
  stats?: UiItemStats;
  [key: string]: unknown;
}

export interface UiItemSlot {
  itemData: UiItemData;
  amount: number;
  normalStock?: boolean;
}

export interface SelectedUseState {
  invIndex: number | null;
  itemId: string | null;
}

export interface MerchantSeedStockRow {
  itemId: string;
  stockAmount: number;
}

export interface MerchantUnlockResult {
  unlockedNow?: boolean;
}

export interface MerchantEconomyLike {
  resolveBuyPrice?: (itemId: string, merchantId: string) => number;
  resolveSellPrice?: (itemId: string, merchantId: string) => number;
  getMerchantSeedStockRows?: (merchantId: string) => MerchantSeedStockRow[];
  hasMerchantConfig?: (merchantId: string) => boolean;
  hasStockPolicy?: (merchantId: string) => boolean;
  getMerchantDefaultSellItemIds?: (merchantId: string) => string[];
  getUnlockedStockAmount?: (itemId: string, merchantId: string) => number;
  canMerchantBuyItem?: (itemId: string, merchantId: string) => boolean;
  canMerchantSellItem?: (itemId: string, merchantId: string) => boolean;
  recordMerchantPurchaseFromPlayer?: (itemId: string, merchantId: string, amount: number) => MerchantUnlockResult | null;
}

export interface InventorySlotViewModel {
  index: number;
  itemId: string | null;
  itemName: string;
  icon: string;
  amount: number;
  selected: boolean;
  hasItem: boolean;
}

export interface ShopSlotViewModel {
  index: number;
  itemId: string | null;
  itemName: string;
  icon: string;
  amount: number;
  buyPrice: number;
  title: string;
  hasItem: boolean;
}

export interface BankSlotViewModel {
  index: number;
  itemId: string | null;
  itemName: string;
  icon: string;
  amount: number;
  title: string;
  hasItem: boolean;
}

export interface EquipmentSlotViewModel {
  slotName: string;
  itemId: string | null;
  itemName: string;
  icon: string;
  hasItem: boolean;
}

export interface SkillTileDefinition {
  skillId: string;
  displayName: string;
  icon: string;
  levelKey: string;
}

export interface SkillTileViewModel extends SkillTileDefinition {
  level: number;
}

export interface SkillProgressViewModel {
  skillId: string;
  name: string;
  icon: string;
  level: number;
  xpText: string;
  nextText: string;
  progressPercentText: string;
  progressWidth: string;
}

export interface CombatStatsViewModel {
  attack: number;
  defense: number;
  strength: number;
}

export interface PlayerProfileSummaryViewModel {
  name: string;
  bodyTypeLabel: string;
  statusText: string;
  isContinueFlow: boolean;
  titleText: string;
  subtitleText: string;
  primaryActionText: string;
  noteText: string;
}

export interface ShopOperationResult {
  inventory: Array<UiItemSlot | null>;
  shopInventory: Array<UiItemSlot | null>;
  amountChanged: number;
  coinAmountChanged: number;
  reason: string | null;
  unlockedNow: boolean;
}

export interface BankOperationResult {
  inventory: Array<UiItemSlot | null>;
  bankItems: Array<UiItemSlot | null>;
  amountChanged: number;
  reason: string | null;
}
