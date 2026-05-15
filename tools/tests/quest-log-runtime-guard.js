const vm = require("vm");
const assert = require("assert");
const { createRepoFileReader } = require("./repo-file-test-utils");

const read = createRepoFileReader(__dirname);

const runtimeSource = read("src/js/quest-log-runtime.js");
const inventorySource = read("src/js/inventory.js");
const manifestSource = read("src/game/platform/legacy-script-manifest.ts");

assert.ok(
  runtimeSource.includes("window.QuestLogRuntime"),
  "quest log runtime should expose a window runtime"
);
assert.ok(
  runtimeSource.includes("function buildQuestLogEntryHtml(entry = {})"),
  "quest log runtime should own quest log entry HTML"
);
assert.ok(
  runtimeSource.includes("function getQuestStatusBadgeClass(status)"),
  "quest log runtime should own quest status badge classes"
);
assert.ok(
  inventorySource.includes("function getQuestLogRuntime()"),
  "inventory.js should resolve the quest log runtime"
);
assert.ok(
  inventorySource.includes("runtime.renderQuestLog({"),
  "inventory.js should delegate quest log rendering"
);
assert.ok(
  !inventorySource.includes("function getQuestStatusBadgeClass(status)"),
  "inventory.js should not own quest status badge classes"
);
assert.ok(
  !inventorySource.includes("function getQuestStatusLabel(status)"),
  "inventory.js should not own quest status labels"
);
assert.ok(
  !inventorySource.includes("No quests are defined yet."),
  "inventory.js should not own quest log empty-state HTML"
);
assert.ok(
  manifestSource.includes('../../js/quest-log-runtime.js?raw'),
  "legacy manifest should import quest log runtime"
);
assert.ok(
  manifestSource.indexOf('id: "quest-runtime"') < manifestSource.indexOf('id: "quest-log-runtime"'),
  "legacy manifest should load quest log runtime after quest runtime"
);
assert.ok(
  manifestSource.indexOf('id: "quest-log-runtime"') < manifestSource.indexOf('id: "inventory"'),
  "legacy manifest should load quest log runtime before inventory.js"
);

const sandbox = { window: {} };
vm.runInNewContext(runtimeSource, sandbox, { filename: "quest-log-runtime.js" });
const runtime = sandbox.window.QuestLogRuntime;
assert.ok(runtime, "quest log runtime should evaluate in isolation");

assert.strictEqual(runtime.getQuestStatusLabel("not_started"), "Available", "not-started quests should label as available");
assert.strictEqual(runtime.getQuestStatusLabel("active"), "In Progress", "active quests should label as in progress");
assert.strictEqual(runtime.getQuestStatusLabel("ready_to_complete"), "Ready", "ready quests should label as ready");
assert.ok(
  runtime.escapeQuestLogHtml("<quest & reward>").includes("&lt;quest &amp; reward&gt;"),
  "quest log HTML escaping should protect rendered catalog text"
);

const activeHtml = runtime.buildQuestLogHtml([
  {
    title: "Tanner's Favor <script>",
    questGiverName: "Elira & Co",
    status: "active",
    summary: "Gather materials.",
    nextStepText: "Bring the hides back.",
    progressText: "Soft leather: 2/4",
    objectives: [
      { label: "Soft leather", progressText: "2/4", completed: false },
      { label: "Thread", progressText: "1/1", completed: true }
    ],
    rewardsText: "250 Crafting XP"
  }
]);
assert.ok(activeHtml.includes("Tanner&#39;s Favor &lt;script&gt;"), "quest titles should be escaped in rendered HTML");
assert.ok(activeHtml.includes("In Progress"), "active quest cards should show the runtime status label");
assert.ok(activeHtml.includes("Soft leather: 2/4"), "quest progress text should render");

const emptyHtml = runtime.buildQuestLogHtml([]);
assert.ok(emptyHtml.includes("No quests are defined yet."), "empty quest log should render an empty state");

const container = { innerHTML: "" };
const documentRef = {
  getElementById(id) {
    return id === "view-quests" ? container : null;
  }
};
const questRuntime = {
  getQuestLogEntries() {
    return [
      {
        title: "Ready Work",
        questGiverName: "Foreman",
        status: "ready_to_complete",
        summary: "Return for payment.",
        progressText: "Complete",
        objectives: [],
        rewardsText: "Coins"
      }
    ];
  }
};
const rendered = runtime.renderQuestLog({ documentRef, QuestRuntime: questRuntime });
assert.strictEqual(container.innerHTML, rendered, "renderQuestLog should write generated HTML to the quest container");
assert.ok(container.innerHTML.includes("Ready"), "renderQuestLog should use entries from QuestRuntime");

console.log("Quest log runtime guard passed.");
