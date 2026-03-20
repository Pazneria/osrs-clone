const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

function read(relPath) {
  return fs.readFileSync(path.resolve(__dirname, "..", "..", relPath), "utf8");
}

function createHarness() {
  const session = {
    progress: {
      inventory: [],
      quests: {}
    }
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
  }

  function giveItem(itemData, amount) {
    rewardItems.push({ itemId: itemData.id, amount });
    const existingSlot = getInventorySlots().find((slot) => slot && slot.itemData && slot.itemData.id === itemData.id);
    if (existingSlot) {
      existingSlot.amount += amount;
      return;
    }
    session.progress.inventory.push({
      itemData,
      amount
    });
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
  uncut_emerald: { id: "uncut_emerald", name: "Uncut emerald" }
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

console.log("Quest runtime guards passed.");
