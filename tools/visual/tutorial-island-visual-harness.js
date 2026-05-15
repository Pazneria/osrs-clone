#!/usr/bin/env node

const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const { writeJsonFile } = require("../lib/json-file-utils");

const ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_CONFIG = path.join(__dirname, "tutorial-island-visual-scenes.json");
const DEFAULT_OUTPUT_DIR = path.join(ROOT, "tmp", "visual-regression", "tutorial-island");
const DEFAULT_BASELINE_DIR = path.join(__dirname, "baselines", "tutorial-island");
const DEFAULT_TIMEOUT_MS = 45000;

function parseArgs(argv) {
  const options = {
    configPath: DEFAULT_CONFIG,
    outputDir: DEFAULT_OUTPUT_DIR,
    baselineDir: DEFAULT_BASELINE_DIR,
    url: null,
    sceneIds: [],
    updateBaseline: false,
    requireBaseline: false,
    startServer: false,
    headed: false,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    selfCheck: false,
    help: false
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const readValue = () => {
      i += 1;
      if (i >= argv.length) throw new Error(`Missing value for ${arg}`);
      return argv[i];
    };

    if (arg === "--config") options.configPath = path.resolve(readValue());
    else if (arg === "--output-dir") options.outputDir = path.resolve(readValue());
    else if (arg === "--baseline-dir") options.baselineDir = path.resolve(readValue());
    else if (arg === "--url") options.url = readValue();
    else if (arg === "--scene") options.sceneIds.push(readValue());
    else if (arg === "--update-baseline") options.updateBaseline = true;
    else if (arg === "--require-baseline") options.requireBaseline = true;
    else if (arg === "--start-server") options.startServer = true;
    else if (arg === "--headed") options.headed = true;
    else if (arg === "--timeout-ms") options.timeoutMs = Math.max(5000, Number(readValue()) || DEFAULT_TIMEOUT_MS);
    else if (arg === "--self-check") options.selfCheck = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

function printHelp() {
  console.log([
    "Tutorial Island visual regression harness",
    "",
    "Usage:",
    "  node tools/visual/tutorial-island-visual-harness.js [options]",
    "",
    "Options:",
    "  --url <url>              Game URL. Defaults to config.defaultUrl.",
    "  --scene <id>             Capture only one scene. May be passed multiple times.",
    "  --output-dir <path>      Capture/report directory. Defaults under tmp/.",
    "  --baseline-dir <path>    Baseline PNG directory.",
    "  --update-baseline        Write captured PNGs as new baselines.",
    "  --require-baseline       Fail when a scene has no baseline PNG.",
    "  --start-server           Start Vite if the URL is not reachable.",
    "  --headed                 Run Chromium headed for manual observation.",
    "  --timeout-ms <ms>        Per-navigation timeout.",
    "  --self-check             Validate config and dependency resolution only."
  ].join("\n"));
}

function getCodexRuntimeNodeModules() {
  return path.join(os.homedir(), ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "node", "node_modules");
}

function getPackageSearchPaths() {
  const paths = [path.join(ROOT, "node_modules")];
  if (process.env.VISUAL_HARNESS_NODE_MODULES) paths.push(process.env.VISUAL_HARNESS_NODE_MODULES);
  if (process.env.NODE_PATH) {
    process.env.NODE_PATH.split(path.delimiter).filter(Boolean).forEach((entry) => paths.push(entry));
  }
  paths.push(getCodexRuntimeNodeModules());
  return Array.from(new Set(paths.filter(Boolean)));
}

function requireFromSearchPaths(packageName) {
  const attempted = [];
  for (const searchPath of getPackageSearchPaths()) {
    attempted.push(searchPath);
    try {
      return require(require.resolve(packageName, { paths: [searchPath] }));
    } catch (error) {
      // Try the next known dependency root.
    }
  }
  const message = [
    `Unable to resolve ${packageName}.`,
    "Install it locally, set VISUAL_HARNESS_NODE_MODULES, or run from Codex desktop where bundled browser tooling is available.",
    `Searched: ${attempted.join("; ")}`
  ].join(" ");
  throw new Error(message);
}

function loadSceneConfig(configPath) {
  const source = fs.readFileSync(configPath, "utf8");
  const config = JSON.parse(source);
  if (!config || typeof config !== "object") throw new Error("Scene config must be a JSON object.");
  if (!Array.isArray(config.scenes) || config.scenes.length === 0) throw new Error("Scene config must define at least one scene.");

  const seen = new Set();
  for (const scene of config.scenes) {
    if (!scene || typeof scene !== "object") throw new Error("Every scene must be an object.");
    if (!/^[a-z0-9-]+$/.test(scene.id || "")) throw new Error(`Invalid scene id: ${scene.id}`);
    if (seen.has(scene.id)) throw new Error(`Duplicate scene id: ${scene.id}`);
    seen.add(scene.id);
    if (!Array.isArray(scene.commands) || scene.commands.length === 0) throw new Error(`Scene ${scene.id} must include commands.`);
    if (!scene.commands.every((command) => typeof command === "string" && command.startsWith("/qa "))) {
      throw new Error(`Scene ${scene.id} commands must be QA chat commands.`);
    }
  }
  return config;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withFreshSessionParam(url) {
  return url.includes("?") ? `${url}&fresh=1` : `${url}?fresh=1`;
}

function probeUrl(url, timeoutMs = 2000) {
  return new Promise((resolve) => {
    const request = http.get(url, { timeout: timeoutMs }, (response) => {
      response.resume();
      resolve(response.statusCode >= 200 && response.statusCode < 500);
    });
    request.on("timeout", () => {
      request.destroy();
      resolve(false);
    });
    request.on("error", () => resolve(false));
  });
}

function startViteServer(url) {
  const parsed = new URL(url);
  const port = parsed.port || (parsed.protocol === "https:" ? "443" : "80");
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const child = spawn(npmCommand, ["run", "dev", "--", "--host", parsed.hostname, "--port", port], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
    windowsHide: true
  });
  child.stdout.on("data", (chunk) => process.stdout.write(`[visual-server] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[visual-server] ${chunk}`));
  return child;
}

async function waitForReachableUrl(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await probeUrl(url, 1200)) return true;
    await wait(500);
  }
  return false;
}

async function ensureProfileReady(page) {
  const overlay = page.locator("#player-entry-overlay");
  const overlayVisible = await overlay.isVisible({ timeout: 5000 }).catch(() => false);
  if (!overlayVisible) return false;
  await page.locator("#player-entry-name").fill("VisualQA");
  await page.locator("#player-entry-primary").click();
  await overlay.waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
  return true;
}

async function sendQaCommand(page, command) {
  const input = page.locator("#chat-input");
  await input.waitFor({ state: "visible", timeout: 10000 });
  await input.fill(command);
  await input.press("Enter");
}

async function applyVisualRegressionChrome(page, scene) {
  await page.addStyleTag({
    content: [
      "body.visual-regression-hide-ui #ui-layer > :not(#runtime-crash-overlay) { visibility: hidden !important; }",
      "body.visual-regression-hide-ui #hover-tooltip,",
      "body.visual-regression-hide-ui #inventory-hover-tooltip,",
      "body.visual-regression-hide-ui #player-overhead-text { visibility: hidden !important; }"
    ].join("\n")
  });
  await page.evaluate((hideUi) => {
    document.body.classList.toggle("visual-regression-hide-ui", !!hideUi);
  }, !!scene.hideUi);
}

async function captureScene(page, scene, config, paths) {
  for (const command of scene.commands) {
    await sendQaCommand(page, command);
    await wait(220);
  }
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }).catch(() => {});
  await applyVisualRegressionChrome(page, scene);
  if (scene.mouse && Number.isFinite(scene.mouse.x) && Number.isFinite(scene.mouse.y)) {
    await page.mouse.move(scene.mouse.x, scene.mouse.y);
  }
  await wait(Number.isFinite(scene.waitMs) ? scene.waitMs : (config.defaultWaitMs || 900));

  const screenshotPath = path.join(paths.captureDir, `${scene.id}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  return screenshotPath;
}

function readPng(PNG, filePath) {
  return PNG.sync.read(fs.readFileSync(filePath));
}

function computeImageMetrics(PNG, filePath) {
  const png = readPng(PNG, filePath);
  const colors = new Set();
  let lumaSum = 0;
  let lumaSquares = 0;
  let opaquePixels = 0;
  const sampleStride = 4;
  for (let y = 0; y < png.height; y += sampleStride) {
    for (let x = 0; x < png.width; x += sampleStride) {
      const idx = ((png.width * y) + x) << 2;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      const a = png.data[idx + 3];
      if (a > 0) opaquePixels += 1;
      colors.add(`${r},${g},${b},${a}`);
      const luma = (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
      lumaSum += luma;
      lumaSquares += luma * luma;
    }
  }
  const samples = Math.max(1, Math.ceil(png.width / sampleStride) * Math.ceil(png.height / sampleStride));
  const mean = lumaSum / samples;
  const variance = Math.max(0, (lumaSquares / samples) - (mean * mean));
  return {
    width: png.width,
    height: png.height,
    sampledPixels: samples,
    uniqueColors: colors.size,
    opaqueRatio: Number((opaquePixels / samples).toFixed(4)),
    lumaMean: Number(mean.toFixed(2)),
    lumaStdDev: Number(Math.sqrt(variance).toFixed(2))
  };
}

function compareAgainstBaseline(deps, scene, config, paths, screenshotPath) {
  const baselinePath = path.join(paths.baselineDir, `${scene.id}.png`);
  const diffPath = path.join(paths.diffDir, `${scene.id}.diff.png`);
  if (!fs.existsSync(baselinePath)) {
    return {
      status: "missing-baseline",
      baselinePath,
      diffPath: null,
      mismatchedPixels: null,
      mismatchRatio: null
    };
  }

  const actual = readPng(deps.PNG, screenshotPath);
  const expected = readPng(deps.PNG, baselinePath);
  if (actual.width !== expected.width || actual.height !== expected.height) {
    return {
      status: "dimension-mismatch",
      baselinePath,
      diffPath: null,
      mismatchedPixels: null,
      mismatchRatio: 1,
      expectedSize: `${expected.width}x${expected.height}`,
      actualSize: `${actual.width}x${actual.height}`
    };
  }

  const diff = new deps.PNG({ width: actual.width, height: actual.height });
  const pixelmatch = deps.pixelmatch.default || deps.pixelmatch;
  const mismatchedPixels = pixelmatch(expected.data, actual.data, diff.data, actual.width, actual.height, {
    threshold: Number.isFinite(scene.pixelmatchThreshold) ? scene.pixelmatchThreshold : (config.pixelmatchThreshold || 0.12)
  });
  ensureDir(paths.diffDir);
  fs.writeFileSync(diffPath, deps.PNG.sync.write(diff));
  const mismatchRatio = mismatchedPixels / (actual.width * actual.height);
  const maxMismatchRatio = Number.isFinite(scene.maxMismatchRatio) ? scene.maxMismatchRatio : (config.maxMismatchRatio || 0.035);
  return {
    status: mismatchRatio <= maxMismatchRatio ? "matched" : "diff-failed",
    baselinePath,
    diffPath,
    mismatchedPixels,
    mismatchRatio: Number(mismatchRatio.toFixed(6)),
    maxMismatchRatio
  };
}

function writeBaseline(PNG, screenshotPath, scene, baselineDir) {
  ensureDir(baselineDir);
  const baselinePath = path.join(baselineDir, `${scene.id}.png`);
  fs.copyFileSync(screenshotPath, baselinePath);
  const metrics = computeImageMetrics(PNG, baselinePath);
  fs.writeFileSync(
    path.join(baselineDir, `${scene.id}.json`),
    JSON.stringify({ sceneId: scene.id, updatedAt: new Date().toISOString(), metrics }, null, 2)
  );
  return baselinePath;
}

async function runHarness(rawOptions) {
  const options = rawOptions || parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return { ok: true, help: true };
  }

  const config = loadSceneConfig(options.configPath);
  const deps = {
    playwright: requireFromSearchPaths("playwright"),
    PNG: requireFromSearchPaths("pngjs").PNG,
    pixelmatch: requireFromSearchPaths("pixelmatch")
  };

  const url = options.url || config.defaultUrl || "http://127.0.0.1:5502/";
  if (options.selfCheck) {
    return {
      ok: true,
      selfCheck: true,
      sceneCount: config.scenes.length,
      url,
      searchPaths: getPackageSearchPaths()
    };
  }

  let serverProcess = null;
  const initiallyReachable = await probeUrl(url);
  if (!initiallyReachable && options.startServer) {
    serverProcess = startViteServer(url);
  }
  const reachable = initiallyReachable || await waitForReachableUrl(url, Math.min(options.timeoutMs, 30000));
  if (!reachable) {
    throw new Error(`Game URL is not reachable: ${url}. Start the dev server or pass --start-server.`);
  }

  const paths = {
    outputDir: options.outputDir,
    captureDir: path.join(options.outputDir, "captures"),
    diffDir: path.join(options.outputDir, "diffs"),
    baselineDir: options.baselineDir
  };
  ensureDir(paths.captureDir);
  ensureDir(paths.diffDir);

  const browser = await deps.playwright.chromium.launch({ headless: !options.headed });
  const context = await browser.newContext({
    viewport: config.viewport || { width: 1240, height: 941 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();
  const consoleMessages = [];
  const pageErrors = [];
  page.on("console", (message) => {
    const type = message.type();
    if (type === "error" || type === "warning") consoleMessages.push({ type, text: message.text() });
  });
  page.on("pageerror", (error) => pageErrors.push(error.message || String(error)));
  page.setDefaultTimeout(options.timeoutMs);

  const sceneIdFilter = new Set(options.sceneIds);
  const scenes = sceneIdFilter.size > 0
    ? config.scenes.filter((scene) => sceneIdFilter.has(scene.id))
    : config.scenes;
  if (sceneIdFilter.size > 0 && scenes.length !== sceneIdFilter.size) {
    const knownIds = new Set(config.scenes.map((scene) => scene.id));
    const missing = options.sceneIds.filter((id) => !knownIds.has(id));
    throw new Error(`Unknown scene id(s): ${missing.join(", ")}`);
  }

  const results = [];
  try {
    for (const scene of scenes) {
      await page.goto(withFreshSessionParam(url), { waitUntil: "load", timeout: options.timeoutMs });
      await ensureProfileReady(page);
      await page.locator("#chat-input").waitFor({ state: "visible", timeout: 15000 });
      await page.waitForFunction(() => typeof window.setQaCameraView === "function", null, { timeout: 15000 }).catch(() => {});
      const screenshotPath = await captureScene(page, scene, config, paths);
      const metrics = computeImageMetrics(deps.PNG, screenshotPath);
      const minUniqueColors = Number.isFinite(scene.minUniqueColors) ? scene.minUniqueColors : 120;
      const healthStatus = metrics.uniqueColors >= minUniqueColors && metrics.lumaStdDev >= 8
        ? "ok"
        : "weak-image";
      const comparison = compareAgainstBaseline(deps, scene, config, paths, screenshotPath);
      const baselinePath = options.updateBaseline ? writeBaseline(deps.PNG, screenshotPath, scene, paths.baselineDir) : null;
      results.push({
        sceneId: scene.id,
        label: scene.label || scene.id,
        screenshotPath,
        metrics,
        healthStatus,
        comparison,
        baselineUpdated: baselinePath
      });
    }
  } finally {
    await browser.close().catch(() => {});
    if (serverProcess) serverProcess.kill();
  }

  const failures = [];
  for (const result of results) {
    if (result.healthStatus !== "ok") failures.push(`${result.sceneId}: screenshot health ${result.healthStatus}`);
    if (options.requireBaseline && result.comparison.status === "missing-baseline") failures.push(`${result.sceneId}: missing baseline`);
    if (result.comparison.status === "dimension-mismatch") failures.push(`${result.sceneId}: baseline dimension mismatch`);
    if (result.comparison.status === "diff-failed") failures.push(`${result.sceneId}: mismatch ratio ${result.comparison.mismatchRatio} > ${result.comparison.maxMismatchRatio}`);
  }
  if (pageErrors.length > 0) failures.push(`page errors: ${pageErrors.length}`);
  const blockingConsoleMessages = consoleMessages.filter((entry) => {
    const text = entry && typeof entry.text === "string" ? entry.text : "";
    return entry.type === "error" || /WebGLProgram: Shader Error|program not valid/i.test(text);
  });
  if (blockingConsoleMessages.length > 0) failures.push(`blocking console errors: ${blockingConsoleMessages.length}`);

  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    url,
    viewport: config.viewport || { width: 1240, height: 941 },
    outputDir: paths.outputDir,
    baselineDir: paths.baselineDir,
    scenes: results,
    consoleMessages,
    pageErrors,
    failures,
    notes: [
      "Default mode captures and compares only when baselines exist.",
      "Use --update-baseline after a human-approved visual pass.",
      "Use --require-baseline in CI once baselines are intentionally committed."
    ]
  };
  ensureDir(paths.outputDir);
  writeJsonFile(path.join(paths.outputDir, "report.json"), report, { trailingNewline: false });

  return report;
}

async function main() {
  try {
    const report = await runHarness();
    if (report.help) return;
    if (report.selfCheck) {
      console.log(`Tutorial Island visual harness self-check passed (${report.sceneCount} scenes).`);
      return;
    }
    for (const scene of report.scenes) {
      const comparison = scene.comparison.status === "missing-baseline"
        ? "no baseline"
        : scene.comparison.status;
      console.log(`${scene.sceneId}: ${scene.healthStatus}, ${comparison}, ${scene.screenshotPath}`);
    }
    console.log(`Report: ${path.join(report.outputDir, "report.json")}`);
    if (!report.ok) {
      report.failures.forEach((failure) => console.error(`FAIL: ${failure}`));
      process.exit(1);
    }
  } catch (error) {
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  DEFAULT_CONFIG,
  DEFAULT_OUTPUT_DIR,
  getPackageSearchPaths,
  loadSceneConfig,
  parseArgs,
  probeUrl,
  runHarness,
  sendQaCommand
};
