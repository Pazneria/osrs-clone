const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function extractFunctionSource(source, functionName) {
  const marker = `function ${functionName}(`;
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`missing ${functionName} definition`);
  const braceStart = source.indexOf("{", start);
  if (braceStart === -1) throw new Error(`missing ${functionName} body`);
  let depth = 0;
  for (let i = braceStart; i < source.length; i++) {
    const ch = source[i];
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`unterminated ${functionName} definition`);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const coreSource = fs.readFileSync(path.join(root, "src", "js", "core.js"), "utf8");
  const qaCommandSource = fs.readFileSync(path.join(root, "src", "js", "qa-command-runtime.js"), "utf8");
  const qaToolsSource = fs.readFileSync(path.join(root, "src", "js", "qa-tools-runtime.js"), "utf8");
  const bridgeSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-bridge.ts"), "utf8");

  assert(coreSource.includes("function getWorldGameContext()"), "core.js missing world game-context helper");
  assert(qaToolsSource.includes("getWorldRouteGroup(context, 'fishing')"), "QA tools fishing discovery should use world route registry");
  assert(qaToolsSource.includes("getWorldRouteGroup(context, 'cooking')"), "QA tools cooking discovery should use world route registry");
  assert(qaToolsSource.includes("getWorldRouteGroup(context, 'firemaking')"), "QA tools firemaking discovery should use world route registry");
  assert(qaToolsSource.includes("getWorldMerchantServices(context)"), "QA tools merchant discovery should use service registry");
  assert(!coreSource.includes("const routeToKey = {\n                castle_pond_bank"), "legacy fishing routeToKey map should be removed");
  assert(!coreSource.includes("const routeToKey = {\n                starter_campfire"), "legacy cooking routeToKey map should be removed");
  assert(!qaToolsSource.includes("pine: 'pine'"), "deleted north-road pine firemaking QA alias should stay removed");
  assert(!qaCommandSource.includes("/qa gotofire <starter|oak|willow|maple|yew|pine>"), "QA firemaking usage should not advertise deleted pine route");

  assert(bridgeSource.includes("getWoodcuttingTrainingLocations"), "legacy bridge missing woodcutting compatibility hook");
  assert(bridgeSource.includes("getFiremakingTrainingLocations"), "legacy bridge missing firemaking compatibility hook");
  assert(bridgeSource.includes("registerRuntimeWorldState"), "legacy bridge missing runtime world-state registration");
  assert(qaCommandSource.includes("window.QaCommandRuntime"), "QA command runtime should expose a window runtime");
  assert(qaCommandSource.includes("handleQaCommand"), "QA command runtime should own QA command dispatch");
  assert(coreSource.includes("buildQaCommandContext"), "core should adapt gameplay callbacks into the QA command runtime");
  assert(coreSource.includes("function qaOpenPlayerCreator()"), "core should provide a QA hook for reopening the player creator");
  assert(coreSource.includes("qaOpenPlayerCreator,"), "core should wire the player creator QA hook into command context");
  assert(coreSource.includes("buildQaToolsContext"), "core should adapt live state into the QA tools runtime");
  assert(qaToolsSource.includes("window.QaToolsRuntime"), "QA tools runtime should expose a window runtime");
  assert(qaToolsSource.includes("createCommandHandlers"), "QA tools runtime should provide command callbacks");
  assert(!coreSource.includes("if (cmd === 'gotofire'"), "core should not own QA command dispatch branches");
  assert(!coreSource.includes("function qaGotoFiremakingSpot"), "core should not own QA tool implementations");

  const qaCommandSandbox = { window: {} };
  vm.runInNewContext(qaCommandSource, qaCommandSandbox, { filename: "src/js/qa-command-runtime.js" });
  const qaRuntime = qaCommandSandbox.window.QaCommandRuntime;
  assert(qaRuntime, "QA command runtime should execute in isolation");
  const qaMessages = [];
  const qaCalls = [];
  qaRuntime.handleQaCommand("help", {
    windowRef: qaCommandSandbox.window,
    addChatMessage: (message, type) => qaMessages.push({ message, type }),
    formatQaOpenShopUsage: () => "Usage: /qa openshop <general_store>"
  });
  assert(qaMessages.some((entry) => entry.message.includes("/qa gotofire <starter|oak|willow|maple|yew>")), "QA command help should live in the QA command runtime");
  assert(qaMessages.some((entry) => entry.message.includes("/qa creator")), "QA command help should advertise the player creator reopen command");
  qaRuntime.handleQaCommand("creator", {
    windowRef: qaCommandSandbox.window,
    addChatMessage: (message, type) => qaMessages.push({ message, type }),
    qaOpenPlayerCreator: () => {
      qaCalls.push("creator");
      return true;
    }
  });
  assert(qaCalls.includes("creator"), "QA command runtime should dispatch creator through core-provided callbacks");
  qaRuntime.handleQaCommand("gotofire yew", {
    windowRef: qaCommandSandbox.window,
    addChatMessage: (message, type) => qaMessages.push({ message, type }),
    qaGotoFiremakingSpot: (target) => {
      qaCalls.push(`gotofire:${target}`);
      return true;
    }
  });
  assert(qaCalls.includes("gotofire:yew"), "QA command runtime should dispatch gotofire through core-provided callbacks");
  qaRuntime.handleChatMessage("hello there", {
    addChatMessage: (message, type) => qaMessages.push({ message, type }),
    showPlayerOverheadText: (message) => qaCalls.push(`overhead:${message}`)
  });
  assert(qaMessages.some((entry) => entry.message === "hello there" && entry.type === "game"), "QA command runtime should pass normal chat through");
  assert(qaCalls.includes("overhead:hello there"), "QA command runtime should keep normal overhead chat behavior");

  const qaToolsSandbox = { window: {} };
  vm.runInNewContext(qaToolsSource, qaToolsSandbox, { filename: "src/js/qa-tools-runtime.js" });
  const qaToolsRuntime = qaToolsSandbox.window.QaToolsRuntime;
  assert(qaToolsRuntime, "QA tools runtime should execute in isolation");

  const tutorialHarness = {
    messages: [],
    playerState: { x: 0, y: 0, z: 0 },
    windowRef: {},
    addChatMessage(message, type) {
      tutorialHarness.messages.push({ message, type });
    },
    getPlayerState() {
      return tutorialHarness.playerState;
    },
    getWorldGameContext() {
      return {
        worldId: "tutorial_island",
        definition: {
          services: [
            { serviceId: "station:tutorial_furnace", x: 459, y: 395, z: 0, label: "Tutorial Furnace" },
            { serviceId: "merchant:tutorial_bank_tutor", x: 269, y: 440, z: 0, name: "Bank Tutor" }
          ]
        },
        queries: {
          getRouteGroup(groupId) {
            if (groupId === "mining") {
              return [{ routeId: "tutorial_surface_mine", x: 475, y: 384, z: 0, label: "Tutorial Surface Quarry" }];
            }
            return [];
          }
        }
      };
    }
  };
  const tutorialHandlers = qaToolsRuntime.createCommandHandlers(tutorialHarness);
  assert(tutorialHandlers.qaGotoTutorialStation("mining"), "tutorial mining QA station should resolve from the active route registry");
  assert(tutorialHarness.playerState.x === 475 && tutorialHarness.playerState.y === 384, "tutorial mining QA station should use expanded live-world coordinates");
  assert(tutorialHandlers.qaGotoTutorialStation("smithing"), "tutorial smithing QA station should resolve from authored services");
  assert(tutorialHarness.playerState.x === 459 && tutorialHarness.playerState.y === 395, "tutorial smithing QA station should use the authored furnace tile");

  const firemakingHarness = {
    typedRoutes: [],
    legacyRoutes: [],
    messages: [],
    playerState: { x: 0, y: 0, z: 0 },
    windowRef: {},
    addChatMessage(message, type) {
      firemakingHarness.messages.push({ message, type });
    },
    getPlayerState() {
      return firemakingHarness.playerState;
    },
    getWorldGameContext() {
      return {
        queries: {
          getRouteGroup(groupId) {
            assert(groupId === "firemaking", "firemaking QA should only ask for firemaking routes");
            return firemakingHarness.typedRoutes;
          }
        }
      };
    },
    getFiremakingTrainingLocations() {
      return firemakingHarness.legacyRoutes;
    }
  };

  firemakingHarness.typedRoutes = [
    { routeId: "oak_fire_lane", alias: "oak", x: 205, y: 299, z: 0, label: "oak path fire lane" }
  ];
  firemakingHarness.legacyRoutes = [
    { routeId: "starter_fire_lane", alias: "starter", x: 1, y: 2, z: 0, label: "legacy starter lane" }
  ];
  const typedSpots = qaToolsRuntime.getQaFiremakingSpots(firemakingHarness);
  assert(typedSpots.oak && typedSpots.oak.x === 205 && typedSpots.oak.y === 299, "typed firemaking routes should drive QA spot discovery before legacy fallback");
  assert(!typedSpots.starter, "typed firemaking routes should not merge legacy fallback spots when typed data exists");

  firemakingHarness.typedRoutes = [];
  firemakingHarness.legacyRoutes = [
    { routeId: "yew_fire_lane", x: 51, y: 8, z: 0, label: "yew frontier fire lane" }
  ];
  const legacySpots = qaToolsRuntime.getQaFiremakingSpots(firemakingHarness);
  assert(legacySpots.yew_fire_lane && legacySpots.yew_fire_lane.label === "yew frontier fire lane", "legacy firemaking routes should backfill QA spots when typed world routes are absent");

  firemakingHarness.typedRoutes = [];
  firemakingHarness.legacyRoutes = [];
  const fallbackSpots = qaToolsRuntime.getQaFiremakingSpots(firemakingHarness);
  assert(fallbackSpots.starter && fallbackSpots.starter.x === 182 && fallbackSpots.yew && fallbackSpots.yew.y === 8, "firemaking QA should keep the authored hardcoded fallback spots");

  firemakingHarness.typedRoutes = [
    { routeId: "starter_fire_lane", alias: "starter", x: 182, y: 170, z: 0, label: "starter grove fire lane" },
    { routeId: "yew_fire_lane", alias: "yew", x: 51, y: 8, z: 0, label: "yew frontier fire lane" }
  ];
  firemakingHarness.legacyRoutes = [];
  const firemakingHandlers = qaToolsRuntime.createCommandHandlers(firemakingHarness);
  assert(firemakingHandlers.qaGotoFiremakingSpot("regular"), "regular should resolve to the starter firemaking QA alias");
  assert(firemakingHarness.playerState.x === 182 && firemakingHarness.playerState.y === 170, "starter alias teleport should target the typed starter fire lane");
  assert(firemakingHandlers.qaGotoFiremakingSpot("yew"), "yew should resolve to the typed frontier firemaking alias");
  assert(firemakingHarness.playerState.x === 51 && firemakingHarness.playerState.y === 8, "yew alias teleport should use the authored frontier fire lane anchor");
  assert(!firemakingHandlers.qaGotoFiremakingSpot("pine"), "deleted north-road pine alias should not teleport from current firemaking routes");
  assert(firemakingHarness.playerState.x === 51 && firemakingHarness.playerState.y === 8, "failed pine lookup should not move the player");

  console.log("QA registry parity guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
