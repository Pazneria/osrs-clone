const assert = require("assert");
const path = require("path");

const { loadTsModule } = require("../lib/ts-module-loader");

const inventoryDomain = loadTsModule(path.resolve(__dirname, "../../src/game/ui/inventory-domain.ts"));
const hudViewModels = loadTsModule(path.resolve(__dirname, "../../src/game/ui/hud-view-models.ts"));

function makeItem(id, overrides = {}) {
  return {
    id,
    name: overrides.name || id,
    icon: overrides.icon || id.toUpperCase(),
    stackable: !!overrides.stackable,
    value: overrides.value || 0,
    stats: overrides.stats || { atk: 0, def: 0, str: 0 },
    combat: overrides.combat || null,
    requiredAttackLevel: overrides.requiredAttackLevel || 0
  };
}

function makeMeleeCombatProfile(overrides = {}) {
  return {
    attackProfile: {
      styleFamily: "melee",
      damageType: "melee",
      range: overrides.range || 1,
      tickCycle: overrides.tickCycle || 5,
      projectile: false,
      ammoUse: false,
      familyTag: overrides.familyTag || "test"
    },
    bonuses: {
      meleeAccuracyBonus: overrides.meleeAccuracyBonus || 0,
      meleeStrengthBonus: overrides.meleeStrengthBonus || 0,
      meleeDefenseBonus: overrides.meleeDefenseBonus || 0,
      rangedDefenseBonus: overrides.rangedDefenseBonus || 0,
      magicDefenseBonus: overrides.magicDefenseBonus || 0
    },
    requiredAttackLevel: overrides.requiredAttackLevel || 1
  };
}

const ITEM_DB = {
  coins: makeItem("coins", { stackable: true, value: 1 }),
  logs: makeItem("logs", { stackable: false, value: 5 }),
  shrimp: makeItem("shrimp", { stackable: false, value: 10 }),
  rune: makeItem("rune", { stackable: true, value: 50 }),
  sword: makeItem("sword", {
    stackable: false,
    value: 100,
    stats: { atk: 4, def: 0, str: 2 },
    combat: makeMeleeCombatProfile({ meleeAccuracyBonus: 4, meleeStrengthBonus: 2, tickCycle: 4, familyTag: "sword" }),
    requiredAttackLevel: 1
  }),
  shield: makeItem("shield", {
    stackable: false,
    value: 90,
    stats: { atk: 0, def: 3, str: 0 },
    combat: makeMeleeCombatProfile({ meleeDefenseBonus: 3, rangedDefenseBonus: 3, magicDefenseBonus: 3, familyTag: "shield" })
  })
};

{
  const result = inventoryDomain.depositInventoryItem({
    inventory: [{ itemData: ITEM_DB.coins, amount: 75 }, null],
    bankItems: [null, null],
    invIndex: 0,
    amount: -1,
    targetBankIndex: -1
  });
  assert.strictEqual(result.amountChanged, 75, "deposit should move the full stack");
  assert.strictEqual(result.inventory[0], null, "deposit should clear the inventory slot");
  assert.strictEqual(result.bankItems[0].amount, 75, "deposit should seed the bank slot");
}

{
  const result = inventoryDomain.withdrawBankItem({
    inventory: [null, null],
    bankItems: [{ itemData: ITEM_DB.logs, amount: 2 }, null],
    bankIndex: 0,
    amount: 2,
    targetInvIndex: -1
  });
  assert.strictEqual(result.amountChanged, 2, "withdraw should move both non-stackable items");
  assert.strictEqual(result.inventory[0].itemData.id, "logs");
  assert.strictEqual(result.inventory[1].itemData.id, "logs");
  assert.strictEqual(result.bankItems[0], null, "withdraw should empty the bank slot");
}

{
  const result = inventoryDomain.createShopInventoryForMerchant({
    merchantId: "general_store",
    inventorySize: 5,
    itemDb: ITEM_DB,
    economy: {
      getMerchantSeedStockRows: () => [{ itemId: "shrimp", stockAmount: 20 }]
    }
  });
  assert.strictEqual(result.inventory[0].itemData.id, "shrimp", "shop seed stock should populate inventory");
  assert.strictEqual(result.inventory[0].amount, 20, "shop seed stock should preserve amount");
}

{
  const result = inventoryDomain.ensureUnlockedMerchantStock({
    shopInventory: [
      { itemData: ITEM_DB.shrimp, amount: 1, normalStock: true },
      { itemData: ITEM_DB.sword, amount: 2, normalStock: false },
      null
    ],
    merchantId: "conditional_teacher",
    itemDb: ITEM_DB,
    economy: {
      getMerchantDefaultSellItemIds: () => ["sword"],
      getUnlockedStockAmount: () => 1
    }
  });
  assert.strictEqual(result[0], null, "stale normal stock should be removed when the default list changes");
  assert.strictEqual(result[1].itemData.id, "sword", "existing conditional stock should stay in place");
  assert.strictEqual(result[1].normalStock, true, "eligible sold-back stock should be promoted to normal stock");
  assert.strictEqual(result[1].amount, 2, "eligible stock should preserve larger sold-back quantities");
}

{
  const result = inventoryDomain.ensureUnlockedMerchantStock({
    shopInventory: [
      { itemData: ITEM_DB.shrimp, amount: 2, normalStock: true },
      { itemData: ITEM_DB.logs, amount: 1, normalStock: true },
      null
    ],
    merchantId: "general_store",
    itemDb: ITEM_DB,
    economy: {
      hasMerchantConfig: () => false,
      getMerchantDefaultSellItemIds: () => [],
      getMerchantSeedStockRows: () => [{ itemId: "shrimp", stockAmount: 20 }]
    }
  });
  assert.strictEqual(result[0].itemData.id, "shrimp", "fallback stock should survive merchant refresh");
  assert.strictEqual(result[0].amount, 20, "fallback stock should restock to the seed amount");
  assert.strictEqual(result[1], null, "stale fallback normal stock should be removed");
}

{
  const result = inventoryDomain.buyShopItem({
    inventory: [{ itemData: ITEM_DB.coins, amount: 100 }, null, null, null],
    shopInventory: [{ itemData: ITEM_DB.shrimp, amount: 5, normalStock: true }, null],
    shopIndex: 0,
    amount: 3,
    merchantId: "fish_shop",
    itemDb: ITEM_DB,
    economy: {
      resolveBuyPrice: () => 10
    }
  });
  assert.strictEqual(result.amountChanged, 3, "buy should grant the requested amount when affordable");
  assert.strictEqual(result.coinAmountChanged, 30, "buy should charge exact total cost");
  assert.strictEqual(result.inventory[0].amount, 70, "buy should reduce player coins");
  assert.strictEqual(result.shopInventory[0].amount, 2, "buy should reduce shop stock");
}

{
  const unlockedPurchases = [];
  const result = inventoryDomain.sellInventoryItem({
    inventory: [{ itemData: ITEM_DB.sword, amount: 1 }, null, null],
    shopInventory: [null, null, null],
    inventoryIndex: 0,
    amount: 1,
    merchantId: "weapon_shop",
    itemDb: ITEM_DB,
    economy: {
      resolveSellPrice: () => 40,
      canMerchantBuyItem: () => true,
      canMerchantSellItem: () => true,
      recordMerchantPurchaseFromPlayer: (itemId, merchantId, amount) => {
        unlockedPurchases.push({ itemId, merchantId, amount });
        return { unlockedNow: true };
      },
      getMerchantDefaultSellItemIds: () => ["sword"],
      getUnlockedStockAmount: () => 3
    }
  });
  assert.strictEqual(result.amountChanged, 1, "sell should remove one item");
  assert.strictEqual(result.inventory[0].itemData.id, "coins", "sell should add coins back to inventory");
  assert.strictEqual(result.inventory[0].amount, 40, "sell should grant correct coin amount");
  assert.ok(result.shopInventory.some((slot) => slot && slot.itemData.id === "sword"), "sell should seed merchant stock");
  assert.strictEqual(result.unlockedNow, true, "sell should surface unlock state");
  assert.deepStrictEqual(unlockedPurchases[0], { itemId: "sword", merchantId: "weapon_shop", amount: 1 });
}

{
  const stats = hudViewModels.buildCombatStatsViewModel({
    playerSkills: {
      attack: { xp: 0, level: 1 },
      strength: { xp: 0, level: 1 },
      defense: { xp: 0, level: 1 },
      hitpoints: { xp: 0, level: 10 }
    },
    equipment: {
      weapon: ITEM_DB.sword,
      shield: ITEM_DB.shield
    },
    playerState: {
      selectedMeleeStyle: "attack"
    }
  });
  assert.deepStrictEqual(stats, { attack: 5, defense: 4, strength: 1 }, "combat stats should derive from combat bonuses and melee formulas");
}

{
  const combatTab = hudViewModels.buildCombatTabViewModel({
    playerSkills: {
      attack: { xp: 0, level: 20 },
      strength: { xp: 0, level: 16 },
      defense: { xp: 0, level: 12 },
      hitpoints: { xp: 0, level: 18 }
    },
    equipment: {
      weapon: ITEM_DB.sword,
      shield: ITEM_DB.shield
    },
    playerState: {
      selectedMeleeStyle: "strength"
    }
  });

  assert.strictEqual(combatTab.combatLevel, 16, "combat level should average attack, strength, defense, and hitpoints");
  assert.strictEqual(combatTab.combatLevelText, "16", "combat level text should be display-ready");
  assert.strictEqual(combatTab.selectedStyleId, "strength", "combat tab should preserve the active melee style");
  assert.strictEqual(combatTab.selectedStyleDescription, "+10% max hit", "combat tab should surface the active style effect");
  assert.strictEqual(combatTab.styleOptions.find((entry) => entry.styleId === "strength").active, true, "selected style option should be marked active");
  assert.strictEqual(combatTab.attackLevel, 20, "combat tab should expose attack level");
  assert.strictEqual(combatTab.hitpointsLevel, 18, "combat tab should expose hitpoints level");
}

{
  const combatStatus = hudViewModels.buildCombatStatusViewModel({
    playerCurrentHitpoints: 7,
    playerMaxHitpoints: 10,
    playerRemainingAttackCooldown: 2,
    inCombat: true,
    target: {
      label: "Goblin",
      focusLabel: "Target",
      currentHealth: 3,
      maxHealth: 7,
      remainingAttackCooldown: 1,
      state: "aggroed",
      distance: 2,
      inMeleeRange: false
    }
  });

  assert.strictEqual(combatStatus.visible, true, "combat status should stay visible while in combat");
  assert.strictEqual(combatStatus.bannerText, "In Combat", "combat banner should reflect active combat");
  assert.strictEqual(combatStatus.playerHitpointsText, "7 / 10", "player hp text should be formatted");
  assert.strictEqual(combatStatus.playerCooldownText, "2 ticks to swing", "player cooldown should use tick text");
  assert.strictEqual(combatStatus.targetName, "Goblin", "target name should surface the focused enemy");
  assert.strictEqual(combatStatus.targetStateText, "Attacking", "enemy state should map into readable HUD text");
  assert.strictEqual(combatStatus.rangeText, "2 tiles away", "range copy should reflect target distance");
}

{
  const readyCombatStatus = hudViewModels.buildCombatStatusViewModel({
    playerCurrentHitpoints: 10,
    playerMaxHitpoints: 10,
    playerRemainingAttackCooldown: 0,
    inCombat: true,
    target: {
      label: "Rat",
      focusLabel: "Aggressor",
      currentHealth: 1,
      maxHealth: 4,
      remainingAttackCooldown: 0,
      state: "idle",
      distance: 1,
      inMeleeRange: true
    }
  });

  assert.strictEqual(readyCombatStatus.playerCooldownReady, true, "player cooldown should be marked ready at zero");
  assert.strictEqual(readyCombatStatus.playerCooldownText, "Ready", "ready cooldown text should be compact");
  assert.strictEqual(readyCombatStatus.targetCooldownText, "Ready", "target cooldown text should be compact");
  assert.strictEqual(readyCombatStatus.targetFocusLabel, "Aggressor", "focus label should preserve aggressor fallback");
  assert.strictEqual(readyCombatStatus.rangeText, "In melee range", "melee range text should be explicit");
}

{
  const preEngagementStatus = hudViewModels.buildCombatStatusViewModel({
    playerCurrentHitpoints: 10,
    playerMaxHitpoints: 10,
    playerRemainingAttackCooldown: 0,
    inCombat: false,
    target: {
      label: "Goblin",
      focusLabel: "Target",
      currentHealth: 7,
      maxHealth: 7,
      remainingAttackCooldown: 0,
      state: "idle",
      distance: 4,
      inMeleeRange: false
    }
  });

  assert.strictEqual(preEngagementStatus.visible, false, "combat HUD should stay hidden while only tracking a distant target");
  assert.strictEqual(preEngagementStatus.targetVisible, false, "target details should stay hidden before engagement starts");
}

{
  const staleCooldownStatus = hudViewModels.buildCombatStatusViewModel({
    playerCurrentHitpoints: 10,
    playerMaxHitpoints: 10,
    playerRemainingAttackCooldown: 3,
    inCombat: false,
    target: null
  });

  assert.strictEqual(staleCooldownStatus.visible, false, "combat HUD should stay hidden when not in combat even if a cooldown value exists");
}

{
  const tiles = hudViewModels.buildSkillTileViewModels({
    definitions: [
      { skillId: "mining", displayName: "Mining", icon: "MIN", levelKey: "min" },
      { skillId: "fishing", displayName: "Fishing", icon: "FIS", levelKey: "fish" }
    ],
    playerSkills: {
      mining: { xp: 200, level: 5 },
      fishing: { xp: 0, level: 1 }
    }
  });
  assert.strictEqual(tiles[0].level, 5, "skill tile view models should expose level");
  assert.strictEqual(tiles[1].displayName, "Fishing", "skill tile view models should keep labels");
}

{
  const progress = hudViewModels.buildSkillProgressViewModel({
    skillId: "mining",
    playerSkills: { mining: { xp: 550, level: 5 } },
    skillMeta: { displayName: "Mining", icon: "MIN" },
    getXpForLevel: (level) => level * 100,
    maxSkillLevel: 99
  });
  assert.strictEqual(progress.name, "Mining");
  assert.strictEqual(progress.level, 5);
  assert.strictEqual(progress.remainingText, "50 XP remaining");
  assert.strictEqual(progress.nextText, "600 XP");
  assert.strictEqual(progress.progressPercentText, "50.0% to next level");
}

{
  const maxed = hudViewModels.buildSkillProgressViewModel({
    skillId: "mining",
    playerSkills: { mining: { xp: 13_034_431, level: 99 } },
    skillMeta: { displayName: "Mining", icon: "MIN" },
    getXpForLevel: (level) => level * 100,
    maxSkillLevel: 99
  });
  assert.strictEqual(maxed.name, "Mining");
  assert.strictEqual(maxed.level, 99);
  assert.strictEqual(maxed.remainingText, "Maxed");
  assert.strictEqual(maxed.nextText, "Maxed");
  assert.strictEqual(maxed.progressPercentText, "100.0% to next level");
  assert.strictEqual(maxed.progressWidth, "100.0%");
}

{
  const skillReference = hudViewModels.buildSkillReferencePanelViewModel({
    skillId: "woodcutting",
    playerSkills: {
      woodcutting: { xp: 0, level: 12 }
    },
    skillSpec: {
      levelBands: [1, 10, 20, 30],
      nodeTable: {
        normal_tree: { requiredLevel: 1, rewardItemId: "logs" },
        yew_tree: { requiredLevel: 30, rewardItemId: "yew_logs" }
      }
    },
    resolveItemName: (itemId) => ({
      logs: "Logs",
      yew_logs: "Yew Logs"
    }[itemId] || itemId)
  });

  assert.ok(skillReference, "skill reference panel should build for spec-backed skills");
  assert.strictEqual(skillReference.currentBandLabel, "Lv 10-19", "current band should resolve from authored level bands");
  assert.strictEqual(skillReference.nextBandLabel, "Lv 20-29", "next band should preserve empty authored tiers");
  assert.strictEqual(skillReference.nextUnlockText, "Lv 30: Chop Yew Logs", "next unlock text should point at the next authored unlock");
  assert.strictEqual(skillReference.tiers.length, 4, "all authored level bands should render");
  assert.strictEqual(skillReference.tiers[1].status, "current", "matching band should be marked current");
  assert.strictEqual(skillReference.tiers[1].unlockCount, 0, "empty current tiers should still render");
  assert.ok(skillReference.tiers[1].emptyStateText.includes("Lv 10-19"), "empty tier copy should stay band-specific");
  assert.strictEqual(skillReference.tiers[2].status, "next", "next tier should be called out separately");
  assert.strictEqual(skillReference.tiers[2].unlockCount, 0, "empty next tiers should remain visible");
  assert.strictEqual(skillReference.tiers[3].unlocks[0].unlockTypeLabel, "Node Unlock", "node-based milestones should preserve type labeling");
}

{
  const combatReference = hudViewModels.buildSkillReferencePanelViewModel({
    skillId: "attack",
    playerSkills: {
      attack: { xp: 0, level: 18 }
    }
  });

  assert.ok(combatReference, "combat skills should build a reference panel without a skill spec");
  assert.strictEqual(combatReference.currentBandLabel, "Lv 10-19", "combat fallback bands should use the canonical combat milestones");
  assert.strictEqual(combatReference.nextUnlockText, "Lv 20: Mid-band melee accuracy bump", "combat reference should expose the next milestone");
  assert.strictEqual(combatReference.tiers[0].status, "unlocked", "earlier combat bands should be marked unlocked");
  assert.strictEqual(combatReference.tiers[1].status, "current", "matching combat band should be current");
}

{
  const fishingReference = hudViewModels.buildSkillReferencePanelViewModel({
    skillId: "fishing",
    playerSkills: {
      fishing: { xp: 0, level: 1 }
    },
    skillSpec: {
      levelBands: [1, 5, 10],
      nodeTable: {
        shrimp_spot: {
          unlockLevel: 1,
          methods: {
            net: {
              unlockLevel: 1,
              fishByLevel: [
                {
                  minLevel: 1,
                  fish: [{ itemId: "shrimp", requiredLevel: 1 }, { itemId: "anchovies", requiredLevel: 5 }]
                }
              ]
            }
          }
        }
      }
    },
    resolveItemName: (itemId) => ({
      shrimp: "Shrimp",
      anchovies: "Anchovies"
    }[itemId] || itemId)
  });

  assert.ok(fishingReference, "fishing skills should build a reference panel from method unlock data");
  assert.strictEqual(fishingReference.currentBandLabel, "Lv 1-4", "fishing current band should honor authored level bands");
  assert.strictEqual(fishingReference.nextBandLabel, "Lv 5-9", "fishing next band should stay aligned to authored tiers");
  assert.strictEqual(fishingReference.nextUnlockText, "Lv 5: Catch Anchovies", "fishing next unlock text should surface future fish unlocks");
  assert.strictEqual(fishingReference.tiers[0].status, "current", "opening fishing tier should be current at level 1");
  assert.strictEqual(fishingReference.tiers[0].unlockCount, 3, "fishing tier should include access, method, and fish unlocks");
  assert.deepStrictEqual(
    fishingReference.tiers[0].unlocks.map((unlock) => unlock.label),
    ["Access Shrimp Spot", "Catch Shrimp", "Method: Net fishing"],
    "fishing tier labels should include access, fish, and method unlocks"
  );
  assert.deepStrictEqual(
    fishingReference.tiers[0].unlocks.map((unlock) => unlock.unlockTypeLabel),
    ["Node Unlock", "Catch Unlock", "Method Unlock"],
    "fishing unlock type labels should reflect the specialized fishing unlock categories"
  );
}

{
  const runecraftingReference = hudViewModels.buildSkillReferencePanelViewModel({
    skillId: "runecrafting",
    playerSkills: {
      runecrafting: { xp: 0, level: 5 }
    },
    skillSpec: {
      levelBands: [1, 10, 20],
      recipeSet: {
        air_rune: { requiredLevel: 1, outputItemId: "air_rune", altarName: "Air altar" },
        steam_rune: { requiredLevel: 5, outputItemId: "steam_rune", altarName: "Steam altar" }
      },
      pouchTable: {
        small_pouch: { requiredLevel: 10 }
      }
    },
    resolveItemName: (itemId) => ({
      air_rune: "Air Rune",
      steam_rune: "Steam Rune",
      small_pouch: "Small Pouch"
    }[itemId] || itemId)
  });

  assert.ok(runecraftingReference, "runecrafting should build a reference panel from recipes and pouch unlocks");
  assert.strictEqual(runecraftingReference.currentBandLabel, "Lv 1-9", "runecrafting current band should honor authored level bands");
  assert.strictEqual(runecraftingReference.nextBandLabel, "Lv 10-19", "runecrafting next band should honor authored level bands");
  assert.strictEqual(runecraftingReference.nextUnlockText, "Lv 10: Use Small Pouch", "runecrafting next unlock text should surface pouch unlocks");
  assert.deepStrictEqual(
    runecraftingReference.tiers[0].unlocks.map((unlock) => unlock.label),
    ["Craft Air Rune (Air altar)", "Craft Steam Rune (Steam altar)"],
    "runecrafting recipe unlock labels should preserve altar names"
  );
  assert.deepStrictEqual(
    runecraftingReference.tiers[0].unlocks.map((unlock) => unlock.unlockTypeLabel),
    ["Recipe Unlock", "Recipe Unlock"],
    "runecrafting recipes should use recipe unlock labeling"
  );
  assert.strictEqual(
    runecraftingReference.tiers[1].unlocks[0].unlockTypeLabel,
    "Pouch Unlock",
    "runecrafting pouches should use pouch unlock labeling"
  );
}

{
  const emptyFutureBandReference = hudViewModels.buildSkillReferencePanelViewModel({
    skillId: "mining",
    playerSkills: {
      mining: { xp: 0, level: 5 }
    },
    skillSpec: {
      levelBands: [1, 10],
      nodeTable: {
        copper_rock: { requiredLevel: 1, rewardItemId: "copper_ore" }
      }
    },
    resolveItemName: (itemId) => ({
      copper_ore: "Copper Ore"
    }[itemId] || itemId)
  });

  assert.ok(emptyFutureBandReference, "skills with authored future bands should still build a reference panel");
  assert.strictEqual(emptyFutureBandReference.nextBandLabel, "Lv 10+", "future empty bands should remain visible");
  assert.strictEqual(
    emptyFutureBandReference.nextUnlockText,
    "Next band: Lv 10+",
    "empty future bands should fall back to the next-band summary text"
  );
}

{
  const exhaustedReference = hudViewModels.buildSkillReferencePanelViewModel({
    skillId: "mining",
    playerSkills: {
      mining: { xp: 0, level: 20 }
    },
    skillSpec: {
      levelBands: [1],
      nodeTable: {
        copper_rock: { requiredLevel: 1, rewardItemId: "copper_ore" }
      }
    },
    resolveItemName: (itemId) => ({
      copper_ore: "Copper Ore"
    }[itemId] || itemId)
  });

  assert.ok(exhaustedReference, "single-band skills should still build a reference panel");
  assert.strictEqual(exhaustedReference.nextBandLabel, null, "terminal skill references should not invent a next band");
  assert.strictEqual(
    exhaustedReference.nextUnlockText,
    "No further authored unlocks are tracked.",
    "terminal skill references should preserve the no-further-unlocks copy"
  );
}

{
  const profile = hudViewModels.buildPlayerProfileSummaryViewModel({
    profile: {
      name: "",
      creationCompleted: false,
      createdAt: null,
      lastStartedAt: null,
      tutorialStep: 0,
      tutorialCompletedAt: null
    },
    playerEntryFlow: {
      hasLoadedSave: false,
      saveWasLegacyProfile: false,
      loadReason: "startup",
      savedAt: null
    },
    playerAppearance: { gender: 0 },
    formatTimestamp: (timestamp) => `T${timestamp}`
  });
  assert.strictEqual(profile.titleText, "Create Your Adventurer");
  assert.strictEqual(profile.primaryActionText, "Start Adventure");
  assert.strictEqual(profile.subtitleText, "Choose a starter identity before you arrive on the mainland.");
  assert.strictEqual(profile.noteText, "Progress will begin autosaving locally in this browser once you arrive.");
  assert.strictEqual(profile.statusText, "Fresh character profile");
  assert.strictEqual(profile.bodyTypeLabel, "Male");
}

{
  const profile = hudViewModels.buildPlayerProfileSummaryViewModel({
    profile: {
      name: "Ava",
      creationCompleted: true,
      createdAt: 1000,
      lastStartedAt: 2000,
      tutorialStep: 6,
      tutorialCompletedAt: 2500
    },
    playerEntryFlow: {
      hasLoadedSave: true,
      saveWasLegacyProfile: false,
      loadReason: "",
      savedAt: 3000
    },
    playerAppearance: { gender: 1 },
    formatTimestamp: (timestamp) => `T${timestamp}`
  });
  assert.strictEqual(profile.titleText, "Continue Your Adventure");
  assert.strictEqual(profile.bodyTypeLabel, "Female");
  assert.strictEqual(profile.statusText, "Last save: T3000");
}

console.log("Inventory/HUD domain tests passed.");
