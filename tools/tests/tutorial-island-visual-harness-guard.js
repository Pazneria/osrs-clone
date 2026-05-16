const assert = require("assert");
const path = require("path");
const { readRepoFile } = require("./repo-file-test-utils");

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const harnessPath = path.join(root, "tools", "visual", "tutorial-island-visual-harness.js");
  const configPath = path.join(root, "tools", "visual", "tutorial-island-visual-scenes.json");
  const harnessSource = readRepoFile(root, "tools/visual/tutorial-island-visual-harness.js");
  const coreSource = readRepoFile(root, "src/js/core.js");
  const packageJson = JSON.parse(readRepoFile(root, "package.json"));
  const harness = require(harnessPath);
  const config = harness.loadSceneConfig(configPath);

  assert(harnessSource.includes("VISUAL_HARNESS_NODE_MODULES"), "visual harness should support an explicit dependency root");
  assert(harnessSource.includes(".cache\", \"codex-runtimes\", \"codex-primary-runtime\""), "visual harness should fall back to bundled Codex desktop browser dependencies");
  assert(harnessSource.includes("pixelmatch"), "visual harness should compare against PNG baselines when present");
  assert(harnessSource.includes("--update-baseline"), "visual harness should support deliberate baseline updates");
  assert(harnessSource.includes("--require-baseline"), "visual harness should support strict CI-style baseline enforcement");
  assert(harnessSource.includes("function withFreshSessionParam(url)"), "visual harness should isolate every scene with a fresh profile URL helper");
  assert(harnessSource.includes("await page.goto(withFreshSessionParam(url)"), "visual harness should reload before each scene so QA free-cam state cannot leak between captures");
  assert(harnessSource.includes("function applyVisualRegressionChrome(page, scene)"), "visual harness should own stable screenshot chrome masking");
  assert(harnessSource.includes("visual-regression-hide-ui"), "visual harness should hide dynamic HUD chrome for world-only scenes");
  assert(harnessSource.includes("window.scrollTo(0, 0);"), "visual harness should reset page scroll before screenshot capture");
  assert(harnessSource.includes("blockingConsoleMessages"), "visual harness should fail on shader/program console errors instead of accepting black WebGL captures");
  assert(harnessSource.includes("WebGLProgram: Shader Error|program not valid"), "visual harness should treat WebGL shader failures as blocking visual failures");
  assert(config.scenes.some((scene) => scene.id === "firemaking-coast-low"), "visual scenes should cover the firemaking coastline problem area");
  assert(config.scenes.some((scene) => scene.id === "fence-seam-low"), "visual scenes should include a low fence-line void seam check");
  assert(config.scenes.some((scene) => scene.id === "water-seam-low"), "visual scenes should include a low water-edge void seam check");
  assert(config.scenes.some((scene) => scene.id === "tutorial-overhead"), "visual scenes should cover the aerial clipping view");
  assert(config.scenes.some((scene) => scene.id === "mining-smithing-yard"), "visual scenes should cover the redesigned mining/smithing yard");
  const lateSkillYard = config.scenes.find((scene) => scene.id === "late-skill-yard");
  assert(lateSkillYard, "visual scenes should cover the expanded late skill yard");
  assert(lateSkillYard.commands.some((command) => command === "/qa gototutorial runecrafting"), "late skill yard visual scene should jump to the new magic/runecrafting/crafting area");
  assert(lateSkillYard.commands.some((command) => command === "/qa camera preset tutorial_late_yard"), "late skill yard visual scene should use its dedicated QA camera preset");
  assert(config.scenes.some((scene) => scene.id === "inventory-hud"), "visual scenes should cover inventory HUD composition");
  assert(config.scenes.filter((scene) => scene.hideUi === true).length >= 4, "world visual scenes should hide dynamic UI chrome");
  assert(config.scenes.find((scene) => scene.id === "inventory-hud").hideUi === false, "inventory HUD scene should keep the visible interface in frame");
  assert(config.scenes.every((scene) => scene.mouse && Number.isFinite(scene.mouse.x) && Number.isFinite(scene.mouse.y)), "every visual scene should pin the mouse to avoid inherited hover artifacts");
  assert(harnessSource.includes("await page.mouse.move(scene.mouse.x, scene.mouse.y);"), "visual harness should apply scene mouse positions before capture");
  assert(config.scenes.every((scene) => scene.commands.some((command) => command === "/qa travel tutorial_island")), "every visual scene should explicitly return to Tutorial Island");
  assert(config.scenes.some((scene) => scene.commands.some((command) => command.includes("/qa camera"))), "visual scenes should exercise QA camera hooks");
  assert(coreSource.includes("STARTUP_QA_SCENE_COMMANDS"), "core should expose narrow startup QA scene presets for browser FPS sampling");
  assert(coreSource.includes("params.get('qaScene') || params.get('qa_scene')"), "startup QA scene presets should be URL-addressable without chat-input automation");
  assert(coreSource.includes("applyStartupQaSceneFromUrl();"), "startup QA scene presets should run after player-entry initialization");
  assert(coreSource.includes("'firemaking-coast-low'") && coreSource.includes("'water-seam-low'") && coreSource.includes("'mining-smithing-yard'"), "startup QA scene presets should cover the heavy Tutorial Island perf scenes");
  assert(coreSource.includes("commands.forEach((command) => sendChatMessage(command));"), "startup QA scene presets should reuse the normal QA command path");
  assert(packageJson.scripts["test:visual:tutorial-island"] === "node ./tools/visual/tutorial-island-visual-harness.js", "package should expose the visual harness capture script");
  assert(packageJson.scripts["test:visual:tutorial-island:update"] === "node ./tools/visual/tutorial-island-visual-harness.js --update-baseline", "package should expose the visual harness baseline update script");
  assert(packageJson.scripts["test:visual:harness:guard"] === "node ./tools/tests/tutorial-island-visual-harness-guard.js", "package should expose the visual harness guard");

  const parsed = harness.parseArgs(["--scene", "firemaking-coast-low", "--require-baseline", "--timeout-ms", "9000"]);
  assert(parsed.sceneIds.join(",") === "firemaking-coast-low", "visual harness should parse scene filters");
  assert(parsed.requireBaseline === true, "visual harness should parse strict baseline mode");
  assert(parsed.timeoutMs === 9000, "visual harness should parse timeout overrides");

  console.log("Tutorial Island visual harness guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
