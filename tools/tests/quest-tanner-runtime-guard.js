const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

function read(relPath) {
  return fs.readFileSync(path.resolve(__dirname, "..", "..", relPath), "utf8");
}

function createHarness(options = {}) {
  const session = {
    progress: {
      inventory: [],
      bankItems: [],
      equipment: {},
      quests: {}
    },
    player: {}
  };
  const saveReasons = [];
  const chatLog = [];
  const rewardItems = [];
  const rewardXp = [];
  const uiHooks = {
    renderQuestLog: 0,
    refreshActiveDialogue: 0,
    renderInventory: 0
  };

  function getInventorySlots() {
    return Array.isArray(session.progress.inventory) ? session.progress.inventory : [];
  }

  function getInventoryCount(itemId) {
    const targetId = String(itemId || "").trim();
    return getInventorySlots().reduce((total, slot) => {
      if (!slot || !slot.itemData || slot.itemData.id !== targetId) return total;
      return total + Math.max(0, Number(slot.amount) || 0);
    }, 0);
  }

  function removeItemsById(itemId, amount) {
    let remaining = Math.max(0, Number(amount) || 0);
    const nextSlots = [];
    const requested = remaining;
    const targetId = String(itemId || "").trim();
    const slots = getInventorySlots();
    for (let i = 0; i < slots.length; i += 1) {
      const slot = slots[i];
      if (!slot || !slot.itemData || slot.itemData.id !== targetId || remaining <= 0) {
        nextSlots.push(slot);
        continue;
      }
      const slotAmount = Math.max(0, Number(slot.amount) || 0);
      if (slotAmount <= remaining) {
        remaining -= slotAmount;
        continue;
      }
      nextSlots.push({
        itemData: slot.itemData,
        amount: slotAmount - remaining
      });
      remaining = 0;
    }
    session.progress.inventory = nextSlots;
    return requested - remaining;
  }

  function giveItem(itemData, amount) {
    if (typeof options.giveItem === "function") {
      const granted = Number(options.giveItem(itemData, amount, session));
      if (granted > 0) rewardItems.push({ itemId: itemData.id, amount: granted });
      return granted;
    }

    const existingSlot = getInventorySlots().find((slot) => slot && slot.itemData && slot.itemData.id === itemData.id);
    if (existingSlot) {
      existingSlot.amount += amount;
      rewardItems.push({ itemId: itemData.id, amount });
      return amount;
    }

    const maxInventorySlots = Number.isFinite(options.maxInventorySlots)
      ? Math.max(0, Math.floor(options.maxInventorySlots))
      : null;
    if (maxInventorySlots !== null && getInventorySlots().length >= maxInventorySlots) {
      return 0;
    }

    session.progress.inventory.push({
      itemData,
      amount
    });
    rewardItems.push({ itemId: itemData.id, amount });
    return amount;
  }

  const sandbox = {
    console,
    window: {},
    getInventoryCount,
    removeItemsById,
    giveItem,
    addSkillXp: (skillId, amount) => rewardXp.push({ skillId, amount }),
    addChatMessage: (message, tone) => chatLog.push({ message, tone }),
    saveProgressToStorage: (reason) => saveReasons.push(reason),
    renderQuestLog: () => {
      uiHooks.renderQuestLog += 1;
    },
    renderInventory: () => {
      uiHooks.renderInventory += 1;
    }
  };

sandbox.window.ITEM_DB = {
  coins: { id: "coins", name: "Coins" },
  boar_tusk: { id: "boar_tusk", name: "Boar Tusk" },
  wolf_fang: { id: "wolf_fang", name: "Wolf Fang" },
  coal: { id: "coal", name: "Coal" },
  gold_ore: { id: "gold_ore", name: "Gold ore" },
  uncut_emerald: { id: "uncut_emerald", name: "Uncut emerald" },
  raw_shrimp: { id: "raw_shrimp", name: "Raw Shrimp" },
  raw_trout: { id: "raw_trout", name: "Raw Trout" },
  raw_salmon: { id: "raw_salmon", name: "Raw Salmon" },
  raw_tuna: { id: "raw_tuna", name: "Raw Tuna" },
  raw_swordfish: { id: "raw_swordfish", name: "Raw Swordfish" },
  rune_harpoon: { id: "rune_harpoon", name: "Rune Harpoon" },
  borrowed_ring: { id: "borrowed_ring", name: "Borrowed Ring" },
  borrowed_amulet: { id: "borrowed_amulet", name: "Borrowed Amulet" },
  borrowed_tiara: { id: "borrowed_tiara", name: "Borrowed Tiara" },
  ring_mould: { id: "ring_mould", name: "Ring mould" },
  amulet_mould: { id: "amulet_mould", name: "Amulet mould" },
  tiara_mould: { id: "tiara_mould", name: "Tiara mould" }
};
  sandbox.window.GameSessionRuntime = {
    getSession: () => session
  };
  sandbox.window.NpcDialogueRuntime = {
    refreshActiveDialogue: () => {
      uiHooks.refreshActiveDialogue += 1;
    }
  };

  vm.runInNewContext(read("src/js/content/quest-catalog.js"), sandbox, {
    filename: "quest-catalog.js"
  });
  vm.runInNewContext(read("src/js/quest-runtime.js"), sandbox, {
    filename: "quest-runtime.js"
  });

  return {
    session,
    saveReasons,
    chatLog,
    rewardItems,
    rewardXp,
    uiHooks,
    runtime: sandbox.window.QuestRuntime
  };
}

const harness = createHarness();
const { runtime, session, saveReasons, chatLog, rewardItems, rewardXp, uiHooks } = harness;
const npc = {
  name: "Tanner Rusk",
  dialogueId: "tanner_rusk",
  merchantId: "tanner_rusk"
};
const questId = "tanner_rusk_hides_of_the_frontier";

assert.strictEqual(
  runtime.resolveNpcPrimaryAction(npc),
  "Talk-to",
  "locked Tanner merchant should route primary interaction through dialogue"
);

const lockedAccess = runtime.canOpenMerchantShop("tanner_rusk");
assert.strictEqual(lockedAccess.ok, false, "locked Tanner merchant should deny shop access");
assert.strictEqual(
  lockedAccess.messageText,
  "Talk to Tanner Rusk at the tannery on the eastern craft lane in Starter Town.",
  "locked Tanner merchant should surface the quest start instructions"
);

const started = runtime.handleNpcDialogueOpened(npc);
assert.ok(started && started.ok, "opening Tanner dialogue should auto-start the quest");
assert.strictEqual(started.state.status, "active", "auto-start should persist an active quest state");
assert.deepStrictEqual(saveReasons, ["quest_started"], "starting the quest should persist progress once");
assert.deepStrictEqual(
  chatLog,
  [{ message: "Quest started: Hides of the Frontier.", tone: "info" }],
  "starting the quest should emit a quest-start chat message"
);
assert.deepStrictEqual(
  uiHooks,
  {
    renderQuestLog: 1,
    refreshActiveDialogue: 1,
    renderInventory: 0
  },
  "starting the quest should refresh the quest UI but not inventory"
);

const activeDialogueView = runtime.buildNpcDialogueView(npc, {
  title: "Tanner Rusk",
  greeting: "Base greeting",
  options: [{ kind: "trade", label: "Trade" }]
});
assert.strictEqual(
  activeDialogueView.greeting,
  "I'm still waiting on those frontier materials. The tannery is built, but stock is what makes it useful.",
  "active Tanner dialogue should use the quest-specific active greeting"
);
assert.strictEqual(
  activeDialogueView.options[0].label,
  "Ask about the order",
  "active Tanner dialogue should offer a progress option first"
);

session.progress.inventory = [
  { itemData: { id: "boar_tusk", name: "Boar Tusk" }, amount: 4 },
  { itemData: { id: "wolf_fang", name: "Wolf Fang" }, amount: 2 }
];

const refreshed = runtime.refreshAllQuestStates({ persist: true, touch: true, render: false });
assert.strictEqual(refreshed.length, 1, "refresh should return the Tanner quest state");
assert.strictEqual(refreshed[0].status, "ready_to_complete", "carrying the required items should mark the quest ready to complete");
const readyAccess = runtime.canOpenMerchantShop("tanner_rusk");
assert.strictEqual(readyAccess.ok, false, "merchant access should stay locked until quest completion");
assert.strictEqual(
  readyAccess.messageText,
  "I have everything Tanner asked for. I should return to the tannery.",
  "merchant access should surface the ready-to-complete reminder"
);

const completed = runtime.completeQuest(questId);
assert.ok(completed && completed.ok, "turning in the required materials should complete the quest");
assert.strictEqual(completed.state.status, "completed", "completed Tanner quest should persist completed state");
assert.strictEqual(runtime.resolveNpcPrimaryAction(npc), "Trade", "completed Tanner quest should unlock the merchant action");
const unlockedAccess = runtime.canOpenMerchantShop("tanner_rusk");
assert.strictEqual(unlockedAccess.ok, true, "completed Tanner quest should unlock the merchant shop");
assert.strictEqual(
  session.progress.inventory.some((slot) => slot && slot.itemData && slot.itemData.id === "boar_tusk"),
  false,
  "quest completion should remove turned-in boar tusks"
);
assert.strictEqual(
  session.progress.inventory.some((slot) => slot && slot.itemData && slot.itemData.id === "wolf_fang"),
  false,
  "quest completion should remove turned-in wolf fangs"
);
assert.deepStrictEqual(
  rewardItems,
  [{ itemId: "coins", amount: 200 }],
  "quest completion should grant the authored coin reward"
);
assert.deepStrictEqual(
  rewardXp,
  [{ skillId: "crafting", amount: 125 }],
  "quest completion should grant the authored crafting XP reward"
);
assert.deepStrictEqual(
  saveReasons,
  ["quest_started", "quest_refresh", "quest_completed"],
  "quest lifecycle should persist start, refresh, and completion updates"
);
assert.deepStrictEqual(
  chatLog,
  [
    { message: "Quest started: Hides of the Frontier.", tone: "info" },
    { message: "Quest complete: Hides of the Frontier.", tone: "info" }
  ],
  "quest lifecycle should emit start and completion chat messages"
);
assert.deepStrictEqual(
  uiHooks,
  {
    renderQuestLog: 2,
    refreshActiveDialogue: 2,
    renderInventory: 1
  },
  "quest completion should refresh the quest UI and inventory once"
);

const completedDialogueView = runtime.buildNpcDialogueView(npc, {
  title: "Tanner Rusk",
  greeting: "Base greeting",
  options: [{ kind: "trade", label: "Trade" }]
});
assert.strictEqual(
  completedDialogueView.greeting,
  "You did right by me. The tannery finally feels alive again.",
  "completed Tanner dialogue should use the completed greeting"
);
assert.strictEqual(
  completedDialogueView.options[0].label,
  "Ask about the delivery",
  "completed Tanner dialogue should switch to the delivery follow-up option"
);

const thrainHarness = createHarness();
const {
  runtime: thrainRuntime,
  session: thrainSession,
  saveReasons: thrainSaveReasons,
  chatLog: thrainChatLog,
  rewardItems: thrainRewardItems,
  rewardXp: thrainRewardXp,
  uiHooks: thrainUiHooks
} = thrainHarness;
const thrainNpc = {
  name: "Thrain Deepforge",
  dialogueId: "thrain_deepforge",
  merchantId: "thrain_deepforge"
};
const thrainQuestId = "thrain_deepforge_proof_of_the_deepforge";

assert.strictEqual(
  thrainRuntime.resolveNpcPrimaryAction(thrainNpc),
  "Talk-to",
  "locked Thrain merchant should route primary interaction through dialogue"
);

const thrainLockedAccess = thrainRuntime.canOpenMerchantShop("thrain_deepforge");
assert.strictEqual(thrainLockedAccess.ok, false, "locked Thrain merchant should deny shop access");
assert.strictEqual(
  thrainLockedAccess.messageText,
  "Talk to Thrain Deepforge at Deepforge House on the western smithing lane in Starter Town.",
  "locked Thrain merchant should surface the quest start instructions"
);

const thrainStarted = thrainRuntime.handleNpcDialogueOpened(thrainNpc);
assert.ok(thrainStarted && thrainStarted.ok, "opening Thrain dialogue should auto-start the quest");
assert.strictEqual(thrainStarted.state.status, "active", "auto-start should persist an active Thrain quest state");
assert.deepStrictEqual(thrainSaveReasons, ["quest_started"], "starting the Thrain quest should persist progress once");
assert.deepStrictEqual(
  thrainChatLog,
  [{ message: "Quest started: Proof of the Deepforge.", tone: "info" }],
  "starting the Thrain quest should emit a quest-start chat message"
);
assert.deepStrictEqual(
  thrainUiHooks,
  {
    renderQuestLog: 1,
    refreshActiveDialogue: 1,
    renderInventory: 0
  },
  "starting the Thrain quest should refresh the quest UI but not inventory"
);

const thrainActiveDialogueView = thrainRuntime.buildNpcDialogueView(thrainNpc, {
  title: "Thrain Deepforge",
  greeting: "Base greeting",
  options: [{ kind: "trade", label: "Trade" }]
});
assert.strictEqual(
  thrainActiveDialogueView.greeting,
  "You want late metal, earn it. I am still waiting on that coal, gold ore, and emerald.",
  "active Thrain dialogue should use the quest-specific active greeting"
);
assert.strictEqual(
  thrainActiveDialogueView.options[0].label,
  "Ask about the order",
  "active Thrain dialogue should offer a progress option first"
);

thrainSession.progress.inventory = [
  { itemData: { id: "coal", name: "Coal" }, amount: 6 },
  { itemData: { id: "gold_ore", name: "Gold ore" }, amount: 2 },
  { itemData: { id: "uncut_emerald", name: "Uncut emerald" }, amount: 1 }
];

const thrainRefreshed = thrainRuntime.refreshAllQuestStates({ persist: true, touch: true, render: false });
assert.strictEqual(thrainRefreshed.length, 1, "refresh should return the Thrain quest state");
assert.strictEqual(thrainRefreshed[0].status, "ready_to_complete", "carrying the required items should mark the Thrain quest ready to complete");
const thrainReadyAccess = thrainRuntime.canOpenMerchantShop("thrain_deepforge");
assert.strictEqual(thrainReadyAccess.ok, false, "Thrain merchant access should stay locked until quest completion");
assert.strictEqual(
  thrainReadyAccess.messageText,
  "I have the materials Thrain asked for. I should return to Deepforge House.",
  "Thrain merchant access should surface the ready-to-complete reminder"
);

const thrainCompleted = thrainRuntime.completeQuest(thrainQuestId);
assert.ok(thrainCompleted && thrainCompleted.ok, "turning in the Thrain materials should complete the quest");
assert.strictEqual(thrainCompleted.state.status, "completed", "completed Thrain quest should persist completed state");
assert.strictEqual(thrainRuntime.resolveNpcPrimaryAction(thrainNpc), "Trade", "completed Thrain quest should unlock the merchant action");
const thrainUnlockedAccess = thrainRuntime.canOpenMerchantShop("thrain_deepforge");
assert.strictEqual(thrainUnlockedAccess.ok, true, "completed Thrain quest should unlock the merchant shop");
assert.strictEqual(
  thrainSession.progress.inventory.some((slot) => slot && slot.itemData && slot.itemData.id === "coal"),
  false,
  "quest completion should remove turned-in coal"
);
assert.strictEqual(
  thrainSession.progress.inventory.some((slot) => slot && slot.itemData && slot.itemData.id === "gold_ore"),
  false,
  "quest completion should remove turned-in gold ore"
);
assert.strictEqual(
  thrainSession.progress.inventory.some((slot) => slot && slot.itemData && slot.itemData.id === "uncut_emerald"),
  false,
  "quest completion should remove turned-in emerald"
);
assert.deepStrictEqual(
  thrainRewardItems,
  [],
  "Thrain quest should not grant authored item rewards"
);
assert.deepStrictEqual(
  thrainRewardXp,
  [{ skillId: "smithing", amount: 200 }],
  "Thrain quest should grant the authored smithing XP reward"
);
assert.deepStrictEqual(
  thrainSaveReasons,
  ["quest_started", "quest_refresh", "quest_completed"],
  "Thrain quest lifecycle should persist start, refresh, and completion updates"
);
assert.deepStrictEqual(
  thrainChatLog,
  [
    { message: "Quest started: Proof of the Deepforge.", tone: "info" },
    { message: "Quest complete: Proof of the Deepforge.", tone: "info" }
  ],
  "Thrain quest lifecycle should emit start and completion chat messages"
);
assert.deepStrictEqual(
  thrainUiHooks,
  {
    renderQuestLog: 2,
    refreshActiveDialogue: 2,
    renderInventory: 1
  },
  "Thrain quest completion should refresh the quest UI and inventory once"
);

const thrainCompletedDialogueView = thrainRuntime.buildNpcDialogueView(thrainNpc, {
  title: "Thrain Deepforge",
  greeting: "Base greeting",
  options: [{ kind: "trade", label: "Trade" }]
});
assert.strictEqual(
  thrainCompletedDialogueView.greeting,
  "You brought me something worth looking at. The deepforge stock is open to you now.",
  "completed Thrain dialogue should use the completed greeting"
);
assert.strictEqual(
  thrainCompletedDialogueView.options[0].label,
  "Ask about the delivery",
  "completed Thrain dialogue should switch to the delivery follow-up option"
);

const fishingHarness = createHarness();
const {
  runtime: fishingRuntime,
  session: fishingSession,
  saveReasons: fishingSaveReasons,
  chatLog: fishingChatLog,
  rewardItems: fishingRewardItems,
  rewardXp: fishingRewardXp,
  uiHooks: fishingUiHooks
} = fishingHarness;
const fishingNpc = {
  name: "Fishing Teacher",
  dialogueId: "fishing_teacher",
  merchantId: "fishing_teacher"
};
const fishingQuestId = "fishing_teacher_from_net_to_harpoon";

assert.strictEqual(
  fishingRuntime.resolveNpcPrimaryAction(fishingNpc),
  "Talk-to",
  "fishing teacher should stay dialogue-first before quest completion"
);

const fishingLockedAccess = fishingRuntime.canOpenMerchantShop("fishing_teacher");
assert.strictEqual(fishingLockedAccess.ok, true, "fishing teacher shop should remain open before quest completion");
assert.strictEqual(
  fishingRuntime.isQuestCompleted(fishingQuestId),
  false,
  "fishing teacher quest should start incomplete"
);

const fishingStarted = fishingRuntime.handleNpcDialogueOpened(fishingNpc);
assert.ok(fishingStarted && fishingStarted.ok, "opening fishing teacher dialogue should auto-start the quest");
assert.strictEqual(fishingStarted.state.status, "active", "auto-start should persist an active fishing teacher quest state");
assert.deepStrictEqual(fishingSaveReasons, ["quest_started"], "starting the fishing teacher quest should persist progress once");
assert.deepStrictEqual(
  fishingChatLog,
  [{ message: "Quest started: From Net to Harpoon.", tone: "info" }],
  "starting the fishing teacher quest should emit a quest-start chat message"
);
assert.deepStrictEqual(
  fishingUiHooks,
  {
    renderQuestLog: 1,
    refreshActiveDialogue: 1,
    renderInventory: 0
  },
  "starting the fishing teacher quest should refresh the quest UI but not inventory"
);

const fishingActiveDialogueView = fishingRuntime.buildNpcDialogueView(fishingNpc, {
  title: "Fishing Teacher",
  greeting: "Base greeting",
  options: [{ kind: "trade", label: "Trade" }]
});
assert.strictEqual(
  fishingActiveDialogueView.greeting,
  "A good fisher learns every stretch of water, not just the easy one. I am still waiting on that full sampler.",
  "active fishing teacher dialogue should use the quest-specific active greeting"
);
assert.strictEqual(
  fishingActiveDialogueView.options[0].label,
  "Ask about the order",
  "active fishing teacher dialogue should offer a progress option first"
);
assert.ok(
  fishingActiveDialogueView.options.some((option) => option && option.kind === "trade" && option.label === "Trade"),
  "fishing teacher dialogue should still expose a trade option while the quest is active"
);

fishingSession.progress.inventory = [
  { itemData: { id: "raw_shrimp", name: "Raw Shrimp" }, amount: 1 },
  { itemData: { id: "raw_trout", name: "Raw Trout" }, amount: 1 },
  { itemData: { id: "raw_salmon", name: "Raw Salmon" }, amount: 1 },
  { itemData: { id: "raw_tuna", name: "Raw Tuna" }, amount: 1 },
  { itemData: { id: "raw_swordfish", name: "Raw Swordfish" }, amount: 1 }
];

const fishingRefreshed = fishingRuntime.refreshAllQuestStates({ persist: true, touch: true, render: false });
assert.strictEqual(fishingRefreshed.length, 1, "refresh should return the fishing teacher quest state");
assert.strictEqual(fishingRefreshed[0].status, "ready_to_complete", "carrying the required fish should mark the fishing teacher quest ready to complete");
const fishingReadyAccess = fishingRuntime.canOpenMerchantShop("fishing_teacher");
assert.strictEqual(fishingReadyAccess.ok, true, "fishing teacher shop should stay open while the quest is ready to complete");

const fishingCompleted = fishingRuntime.completeQuest(fishingQuestId);
assert.ok(fishingCompleted && fishingCompleted.ok, "turning in the fishing sampler should complete the quest");
assert.strictEqual(fishingCompleted.state.status, "completed", "completed fishing teacher quest should persist completed state");
assert.strictEqual(
  fishingRuntime.resolveNpcPrimaryAction(fishingNpc),
  "Talk-to",
  "fishing teacher should stay dialogue-first after quest completion"
);
const fishingUnlockedAccess = fishingRuntime.canOpenMerchantShop("fishing_teacher");
assert.strictEqual(fishingUnlockedAccess.ok, true, "fishing teacher shop should stay open after quest completion");
assert.strictEqual(
  fishingRuntime.isQuestCompleted(fishingQuestId),
  true,
  "fishing teacher quest should report completed after turn-in"
);
assert.strictEqual(
  fishingSession.progress.inventory.some((slot) => slot && slot.itemData && slot.itemData.id === "raw_shrimp"),
  false,
  "quest completion should remove turned-in shrimp"
);
assert.strictEqual(
  fishingSession.progress.inventory.some((slot) => slot && slot.itemData && slot.itemData.id === "raw_trout"),
  false,
  "quest completion should remove turned-in trout"
);
assert.strictEqual(
  fishingSession.progress.inventory.some((slot) => slot && slot.itemData && slot.itemData.id === "raw_salmon"),
  false,
  "quest completion should remove turned-in salmon"
);
assert.strictEqual(
  fishingSession.progress.inventory.some((slot) => slot && slot.itemData && slot.itemData.id === "raw_tuna"),
  false,
  "quest completion should remove turned-in tuna"
);
assert.strictEqual(
  fishingSession.progress.inventory.some((slot) => slot && slot.itemData && slot.itemData.id === "raw_swordfish"),
  false,
  "quest completion should remove turned-in swordfish"
);
assert.deepStrictEqual(
  fishingRewardItems,
  [{ itemId: "rune_harpoon", amount: 1 }],
  "fishing teacher quest should grant the authored rune harpoon reward"
);
assert.deepStrictEqual(
  fishingRewardXp,
  [{ skillId: "fishing", amount: 250 }],
  "fishing teacher quest should grant the authored fishing XP reward"
);
assert.deepStrictEqual(
  fishingSaveReasons,
  ["quest_started", "quest_refresh", "quest_completed"],
  "fishing teacher quest lifecycle should persist start, refresh, and completion updates"
);
assert.deepStrictEqual(
  fishingChatLog,
  [
    { message: "Quest started: From Net to Harpoon.", tone: "info" },
    { message: "Quest complete: From Net to Harpoon.", tone: "info" }
  ],
  "fishing teacher quest lifecycle should emit start and completion chat messages"
);
assert.deepStrictEqual(
  fishingUiHooks,
  {
    renderQuestLog: 2,
    refreshActiveDialogue: 2,
    renderInventory: 1
  },
  "fishing teacher quest completion should refresh the quest UI and inventory once"
);

const fishingCompletedDialogueView = fishingRuntime.buildNpcDialogueView(fishingNpc, {
  title: "Fishing Teacher",
  greeting: "Base greeting",
  options: [{ kind: "trade", label: "Trade" }]
});
assert.strictEqual(
  fishingCompletedDialogueView.greeting,
  "You worked every band I asked for. That is enough proof for me.",
  "completed fishing teacher dialogue should use the completed greeting"
);
assert.strictEqual(
  fishingCompletedDialogueView.options[0].label,
  "Ask about the delivery",
  "completed fishing teacher dialogue should switch to the delivery follow-up option"
);
assert.ok(
  fishingCompletedDialogueView.options.some((option) => option && option.kind === "trade" && option.label === "Trade"),
  "completed fishing teacher dialogue should still expose a trade option"
);

const eliraHarness = createHarness();
const {
  runtime: eliraRuntime,
  session: eliraSession,
  saveReasons: eliraSaveReasons,
  chatLog: eliraChatLog,
  rewardItems: eliraRewardItems,
  rewardXp: eliraRewardXp,
  uiHooks: eliraUiHooks
} = eliraHarness;
const eliraNpc = {
  name: "Elira Gemhand",
  dialogueId: "elira_gemhand",
  merchantId: "elira_gemhand"
};
const eliraQuestId = "elira_gemhand_moulds_of_the_trade";

const eliraStartFailHarness = createHarness({ maxInventorySlots: 2 });
const {
  runtime: eliraStartFailRuntime,
  session: eliraStartFailSession,
  saveReasons: eliraStartFailSaveReasons,
  chatLog: eliraStartFailChatLog,
  rewardItems: eliraStartFailRewardItems,
  uiHooks: eliraStartFailUiHooks
} = eliraStartFailHarness;
const eliraStartFail = eliraStartFailRuntime.handleNpcDialogueOpened(eliraNpc);
assert.strictEqual(eliraStartFail.ok, false, "Elira quest start should fail when borrowed items do not fully fit");
assert.strictEqual(
  eliraStartFail.messageText,
  "You need 3 free inventory spaces before borrowing Elira's examples.",
  "Elira quest start should surface the authored inventory-space warning"
);
assert.deepStrictEqual(
  eliraStartFailSession.progress.inventory,
  [],
  "Elira quest start should roll back partially granted borrowed items"
);
assert.deepStrictEqual(
  eliraStartFailRewardItems,
  [
    { itemId: "borrowed_ring", amount: 1 },
    { itemId: "borrowed_amulet", amount: 1 }
  ],
  "Elira quest start failure should only record the attempted grants before rollback"
);
assert.strictEqual(
  eliraStartFailRuntime.resolveQuestState(eliraQuestId, { persist: false, touch: false }).status,
  "not_started",
  "Elira quest should remain not started after failed borrowed-item grant"
);
assert.deepStrictEqual(eliraStartFailSaveReasons, [], "failed Elira quest start should not persist progress");
assert.deepStrictEqual(eliraStartFailChatLog, [], "failed Elira quest start should not emit quest chat");
assert.deepStrictEqual(
  eliraStartFailUiHooks,
  {
    renderQuestLog: 0,
    refreshActiveDialogue: 0,
    renderInventory: 0
  },
  "failed Elira quest start should not refresh UI"
);

assert.strictEqual(
  eliraRuntime.resolveNpcPrimaryAction(eliraNpc),
  "Talk-to",
  "Elira should stay dialogue-first before the mould quest is completed"
);

const eliraAccessBefore = eliraRuntime.canOpenMerchantShop("elira_gemhand");
assert.strictEqual(eliraAccessBefore.ok, true, "Elira's shop should remain open before the quest starts");

const eliraStarted = eliraRuntime.handleNpcDialogueOpened(eliraNpc);
assert.ok(eliraStarted && eliraStarted.ok, "opening Elira dialogue should auto-start the mould quest");
assert.strictEqual(eliraStarted.state.status, "active", "auto-start should persist an active Elira quest state");
assert.deepStrictEqual(
  eliraRewardItems,
  [
    { itemId: "borrowed_ring", amount: 1 },
    { itemId: "borrowed_amulet", amount: 1 },
    { itemId: "borrowed_tiara", amount: 1 }
  ],
  "starting the Elira quest should grant the borrowed example items"
);
assert.deepStrictEqual(eliraSaveReasons, ["quest_started"], "starting the Elira quest should persist progress once");
assert.deepStrictEqual(
  eliraChatLog,
  [{ message: "Quest started: Moulds of the Trade.", tone: "info" }],
  "starting the Elira quest should emit a quest-start chat message"
);
assert.deepStrictEqual(
  eliraUiHooks,
  {
    renderQuestLog: 1,
    refreshActiveDialogue: 1,
    renderInventory: 1
  },
  "starting the Elira quest should refresh the quest UI and inventory once"
);

const eliraActiveDialogueView = eliraRuntime.buildNpcDialogueView(eliraNpc, {
  title: "Elira Gemhand",
  greeting: "Base greeting",
  options: [{ kind: "trade", label: "Trade" }]
});
assert.strictEqual(
  eliraActiveDialogueView.greeting,
  "Soft clay first, then a clean imprint from each borrowed piece, then a careful firing. Do not skip the order.",
  "active Elira dialogue should use the quest-specific active greeting"
);
assert.strictEqual(
  eliraActiveDialogueView.options[0].label,
  "Ask about the order",
  "active Elira dialogue should offer a progress option first"
);
assert.ok(
  eliraActiveDialogueView.options.some((option) => option && option.kind === "trade" && option.label === "Trade"),
  "Elira dialogue should still expose a trade option while the quest is active"
);

const eliraQuestLogEntry = eliraRuntime.getQuestLogEntries().find((entry) => entry.questId === eliraQuestId);
assert.ok(eliraQuestLogEntry, "Elira quest should appear in the quest log");
assert.strictEqual(
  eliraQuestLogEntry.rewardsText,
  "150 Crafting XP | Unlock Ring mould use | Unlock Amulet mould use | Unlock Tiara mould use",
  "Elira quest log should describe the crafting XP reward and mould unlocks"
);

eliraSession.progress.inventory = [
  { itemData: { id: "borrowed_ring", name: "Borrowed Ring" }, amount: 1 },
  { itemData: { id: "borrowed_amulet", name: "Borrowed Amulet" }, amount: 1 },
  { itemData: { id: "borrowed_tiara", name: "Borrowed Tiara" }, amount: 1 },
  { itemData: { id: "ring_mould", name: "Ring mould" }, amount: 1 },
  { itemData: { id: "amulet_mould", name: "Amulet mould" }, amount: 1 },
  { itemData: { id: "tiara_mould", name: "Tiara mould" }, amount: 1 }
];

const eliraRefreshed = eliraRuntime.refreshAllQuestStates({ persist: true, touch: true, render: false });
assert.strictEqual(eliraRefreshed.length, 1, "refresh should return the Elira quest state");
assert.strictEqual(eliraRefreshed[0].status, "ready_to_complete", "carrying the finished moulds should mark Elira's quest ready to complete");
const eliraReadyAccess = eliraRuntime.canOpenMerchantShop("elira_gemhand");
assert.strictEqual(eliraReadyAccess.ok, true, "Elira's shop should stay open while the quest is ready to complete");

const eliraCompleted = eliraRuntime.completeQuest(eliraQuestId);
assert.ok(eliraCompleted && eliraCompleted.ok, "turning in the finished mould set should complete Elira's quest");
assert.strictEqual(eliraCompleted.state.status, "completed", "completed Elira quest should persist completed state");
assert.strictEqual(
  eliraRuntime.resolveNpcPrimaryAction(eliraNpc),
  "Talk-to",
  "Elira should stay dialogue-first after quest completion"
);
assert.strictEqual(
  !!(eliraSession.player.unlockFlags && eliraSession.player.unlockFlags.ringMouldUnlocked),
  true,
  "Elira quest completion should unlock ring mould usage"
);
assert.strictEqual(
  !!(eliraSession.player.unlockFlags && eliraSession.player.unlockFlags.amuletMouldUnlocked),
  true,
  "Elira quest completion should unlock amulet mould usage"
);
assert.strictEqual(
  !!(eliraSession.player.unlockFlags && eliraSession.player.unlockFlags.tiaraMouldUnlocked),
  true,
  "Elira quest completion should unlock tiara mould usage"
);
assert.strictEqual(
  eliraSession.progress.inventory.some((slot) => slot && slot.itemData && slot.itemData.id === "borrowed_ring"),
  false,
  "Elira quest completion should remove the borrowed ring"
);
assert.strictEqual(
  eliraSession.progress.inventory.some((slot) => slot && slot.itemData && slot.itemData.id === "borrowed_amulet"),
  false,
  "Elira quest completion should remove the borrowed amulet"
);
assert.strictEqual(
  eliraSession.progress.inventory.some((slot) => slot && slot.itemData && slot.itemData.id === "borrowed_tiara"),
  false,
  "Elira quest completion should remove the borrowed tiara"
);
assert.ok(
  eliraSession.progress.inventory.some((slot) => slot && slot.itemData && slot.itemData.id === "ring_mould"),
  "Elira quest completion should leave the crafted ring mould in inventory"
);
assert.deepStrictEqual(
  eliraRewardXp,
  [{ skillId: "crafting", amount: 150 }],
  "Elira quest should grant the authored crafting XP reward"
);
assert.deepStrictEqual(
  eliraSaveReasons,
  ["quest_started", "quest_refresh", "quest_completed"],
  "Elira quest lifecycle should persist start, refresh, and completion updates"
);
assert.deepStrictEqual(
  eliraChatLog,
  [
    { message: "Quest started: Moulds of the Trade.", tone: "info" },
    { message: "Quest complete: Moulds of the Trade.", tone: "info" }
  ],
  "Elira quest lifecycle should emit start and completion chat messages"
);
assert.deepStrictEqual(
  eliraUiHooks,
  {
    renderQuestLog: 2,
    refreshActiveDialogue: 2,
    renderInventory: 2
  },
  "Elira quest completion should refresh the quest UI and inventory once more"
);

const eliraCompletedDialogueView = eliraRuntime.buildNpcDialogueView(eliraNpc, {
  title: "Elira Gemhand",
  greeting: "Base greeting",
  options: [{ kind: "trade", label: "Trade" }]
});
assert.strictEqual(
  eliraCompletedDialogueView.greeting,
  "Good. You made the moulds yourself, so you understand what they are for now.",
  "completed Elira dialogue should use the completed greeting"
);
assert.strictEqual(
  eliraCompletedDialogueView.options[0].label,
  "Ask about the delivery",
  "completed Elira dialogue should switch to the delivery follow-up option"
);
assert.ok(
  eliraCompletedDialogueView.options.some((option) => option && option.kind === "trade" && option.label === "Trade"),
  "completed Elira dialogue should still expose a trade option"
);

console.log("Quest runtime guards passed.");
