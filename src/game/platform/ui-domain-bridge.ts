import type { PlayerProfileState } from "../contracts/session";
import type {
  MerchantEconomyLike,
  PlayerProfileSummaryViewModel,
  SelectedUseState,
  SkillTileDefinition,
  UiItemData,
  UiItemSlot
} from "../contracts/ui";
import {
  addItemToInventory,
  buildBankSlotViewModels,
  buildInventorySlotViewModels,
  buildShopSlotViewModels,
  buyShopItem,
  cloneSlotArray,
  collectMatchingSlotIndexes,
  createShopInventoryForMerchant,
  depositInventoryItem,
  ensureUnlockedMerchantStock,
  resolveMerchantBuyPrice,
  resolveMerchantSellPrice,
  sellInventoryItem,
  swapSlotEntries,
  withdrawBankItem
} from "../ui/inventory-domain";
import {
  buildCombatStatsViewModel,
  buildEquipmentSlotViewModels,
  buildPlayerProfileSummaryViewModel,
  buildSkillProgressViewModel,
  buildSkillTileViewModels
} from "../ui/hud-view-models";

declare global {
  interface Window {
    UiDomainRuntime?: {
      cloneSlotArray: (slots: Array<UiItemSlot | null>) => Array<UiItemSlot | null>;
      collectMatchingSlotIndexes: (
        slots: Array<UiItemSlot | null>,
        itemId: string,
        preferredIndex: number,
        maxCount: number
      ) => number[];
      swapSlotEntries: (slots: Array<UiItemSlot | null>, sourceIndex: number, targetIndex: number) => Array<UiItemSlot | null>;
      addItemToInventory: (inventory: Array<UiItemSlot | null>, itemData: UiItemData, amount?: number) => { inventory: Array<UiItemSlot | null>; amountGiven: number };
      depositInventoryItem: typeof depositInventoryItem;
      withdrawBankItem: typeof withdrawBankItem;
      createShopInventoryForMerchant: typeof createShopInventoryForMerchant;
      ensureUnlockedMerchantStock: typeof ensureUnlockedMerchantStock;
      resolveMerchantBuyPrice: (itemDb: Record<string, UiItemData>, economy: MerchantEconomyLike | null, itemId: string, merchantId: string) => number;
      resolveMerchantSellPrice: (itemDb: Record<string, UiItemData>, economy: MerchantEconomyLike | null, itemId: string, merchantId: string) => number;
      buyShopItem: typeof buyShopItem;
      sellInventoryItem: typeof sellInventoryItem;
      buildInventorySlotViewModels: (options: {
        inventory: Array<UiItemSlot | null>;
        selectedUse: SelectedUseState;
      }) => ReturnType<typeof buildInventorySlotViewModels>;
      buildBankSlotViewModels: typeof buildBankSlotViewModels;
      buildShopSlotViewModels: typeof buildShopSlotViewModels;
      buildCombatStatsViewModel: typeof buildCombatStatsViewModel;
      buildEquipmentSlotViewModels: typeof buildEquipmentSlotViewModels;
      buildSkillTileViewModels: (options: {
        definitions: SkillTileDefinition[];
        playerSkills: Record<string, { xp: number; level: number } | undefined>;
      }) => ReturnType<typeof buildSkillTileViewModels>;
      buildSkillProgressViewModel: typeof buildSkillProgressViewModel;
      buildPlayerProfileSummaryViewModel: (options: {
        profile: PlayerProfileState;
        playerEntryFlow: {
          hasLoadedSave?: boolean;
          saveWasLegacyProfile?: boolean;
          loadReason?: string;
          savedAt?: number | null;
        };
        playerAppearance: { gender?: number } | null;
        formatTimestamp: (timestamp: number) => string;
      }) => PlayerProfileSummaryViewModel;
    };
  }
}

export function exposeUiDomainBridge(): void {
  window.UiDomainRuntime = {
    cloneSlotArray,
    collectMatchingSlotIndexes,
    swapSlotEntries,
    addItemToInventory,
    depositInventoryItem,
    withdrawBankItem,
    createShopInventoryForMerchant,
    ensureUnlockedMerchantStock,
    resolveMerchantBuyPrice,
    resolveMerchantSellPrice,
    buyShopItem,
    sellInventoryItem,
    buildInventorySlotViewModels,
    buildBankSlotViewModels,
    buildShopSlotViewModels,
    buildCombatStatsViewModel,
    buildEquipmentSlotViewModels,
    buildSkillTileViewModels,
    buildSkillProgressViewModel,
    buildPlayerProfileSummaryViewModel
  };
}
