const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const sessionBridgeSource = fs.readFileSync(path.join(root, "src", "game", "platform", "session-bridge.ts"), "utf8");
  const sessionContractSource = fs.readFileSync(path.join(root, "src", "game", "contracts", "session.ts"), "utf8");
  const coreSource = fs.readFileSync(path.join(root, "src", "js", "core.js"), "utf8");
  const skillRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "skills", "runtime.js"), "utf8");
  const shopEconomySource = fs.readFileSync(path.join(root, "src", "js", "shop-economy.js"), "utf8");

  assert(sessionContractSource.includes("export interface GameSession"), "session contracts should define GameSession");
  assert(sessionContractSource.includes("export interface ProgressSavePayload"), "session contracts should define a versioned save payload");
  assert(sessionBridgeSource.includes("createGameSession"), "session bridge should expose session creation");
  assert(sessionBridgeSource.includes("setActiveSession"), "session bridge should expose active-session ownership");
  assert(sessionBridgeSource.includes("buildProgressSavePayload"), "session bridge should expose save payload building");
  assert(sessionBridgeSource.includes("bindWindowQaBooleanFlag"), "session bridge should own QA/debug flag binding");
  assert(coreSource.includes("const gameSessionRuntime = window.GameSessionRuntime || null;"), "core should adopt the session runtime bridge");
  assert(coreSource.includes("function getGameSession()"), "core should expose a game-session helper");
  assert(coreSource.includes("function syncGameSessionState()"), "core should synchronize legacy refs back into the session");
  assert(skillRuntimeSource.includes("window.GameSessionRuntime"), "skill runtime should read through the session bridge");
  assert(shopEconomySource.includes("window.GameSessionRuntime"), "shop economy should read through the session bridge");

  console.log("Game session guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
