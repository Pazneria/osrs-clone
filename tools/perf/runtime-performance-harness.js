#!/usr/bin/env node

const fs = require("fs");
const http = require("http");
const path = require("path");
const { spawn } = require("child_process");
const {
  getPackageSearchPaths,
  loadSceneConfig
} = require("../visual/tutorial-island-visual-harness.js");

const ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_CONFIG = path.join(ROOT, "tools", "visual", "tutorial-island-visual-scenes.json");
const DEFAULT_OUTPUT_DIR = path.join(ROOT, "tmp", "performance", "runtime");
const DEFAULT_TIMEOUT_MS = 45000;
const DEFAULT_SAMPLE_MS = 6500;
const DEFAULT_TARGET_FPS = 50;

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
  throw new Error(`Unable to resolve ${packageName}. Searched: ${attempted.join("; ")}`);
}

function parseArgs(argv) {
  const options = {
    configPath: DEFAULT_CONFIG,
    outputDir: DEFAULT_OUTPUT_DIR,
    url: null,
    sceneIds: [],
    startServer: false,
    headed: false,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    sampleMs: DEFAULT_SAMPLE_MS,
    targetFps: DEFAULT_TARGET_FPS,
    minFps: 0,
    requireFullQuality: true,
    cameraOrbit: false,
    pointerCameraDrag: false,
    chunkStreamRoute: false,
    drawBreakdown: false,
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
    else if (arg === "--url") options.url = readValue();
    else if (arg === "--scene") options.sceneIds.push(readValue());
    else if (arg === "--start-server") options.startServer = true;
    else if (arg === "--headed") options.headed = true;
    else if (arg === "--timeout-ms") options.timeoutMs = Math.max(5000, Number(readValue()) || DEFAULT_TIMEOUT_MS);
    else if (arg === "--sample-ms") options.sampleMs = Math.max(2500, Number(readValue()) || DEFAULT_SAMPLE_MS);
    else if (arg === "--target-fps") options.targetFps = Math.max(1, Number(readValue()) || DEFAULT_TARGET_FPS);
    else if (arg === "--min-fps") options.minFps = Math.max(0, Number(readValue()) || 0);
    else if (arg === "--allow-quality-drift") options.requireFullQuality = false;
    else if (arg === "--camera-orbit") options.cameraOrbit = true;
    else if (arg === "--pointer-camera-drag") options.pointerCameraDrag = true;
    else if (arg === "--chunk-stream-route" || arg === "--freecam-chunk-route") options.chunkStreamRoute = true;
    else if (arg === "--draw-breakdown") options.drawBreakdown = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

function printHelp() {
  console.log([
    "OSRS Clone runtime performance harness",
    "",
    "Usage:",
    "  node tools/perf/runtime-performance-harness.js [options]",
    "",
    "Options:",
    "  --url <url>              Game URL. Defaults to config.defaultUrl.",
    "  --scene <id>             Measure one scene. May be passed multiple times.",
    "  --output-dir <path>      Report directory. Defaults under tmp/.",
    "  --sample-ms <ms>         Stable measurement window after scene setup.",
    "  --min-fps <fps>          Fail if average FPS is below this value.",
    "  --target-fps <fps>       Document target FPS in the report. Defaults to 50.",
    "  --camera-orbit           Hold camera rotation during the sample to measure active camera movement.",
    "  --pointer-camera-drag    Middle-drag the camera during the sample to measure player-style camera movement.",
    "  --chunk-stream-route     Move freecam across chunk boundaries during the sample to measure streaming hitches.",
    "  --draw-breakdown         Capture one post-sample draw-call breakdown by object type.",
    "  --allow-quality-drift    Do not fail when full-res/shadow quality checks drift.",
    "  --start-server           Start Vite if the URL is not reachable.",
    "  --headed                 Run Chromium headed for manual observation.",
    "  --timeout-ms <ms>        Per-navigation timeout."
  ].join("\n"));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withFreshSessionParam(url) {
  return url.includes("?") ? `${url}&fresh=${Date.now()}` : `${url}?fresh=${Date.now()}`;
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
  child.stdout.on("data", (chunk) => process.stdout.write(`[perf-server] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[perf-server] ${chunk}`));
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
  await page.locator("#player-entry-name").fill("PerfQA");
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

async function installPerfHooks(page) {
  await page.evaluate(() => {
    window.__runtimePerfSamples = [];
    window.__runtimePerfTimings = { hooks: {} };
    window.__runtimePerfFrameIntervals = [];
    window.__runtimePerfLastAnimationFrameNow = null;
    const recordRuntimePerfTiming = (key, durationMs) => {
      if (!key || !Number.isFinite(durationMs)) return;
      if (!window.__runtimePerfTimings || typeof window.__runtimePerfTimings !== "object") {
        window.__runtimePerfTimings = { hooks: {} };
      }
      const hooks = window.__runtimePerfTimings.hooks || (window.__runtimePerfTimings.hooks = {});
      const stats = hooks[key] || (hooks[key] = { count: 0, totalMs: 0, maxMs: 0 });
      stats.count += 1;
      stats.totalMs += durationMs;
      if (durationMs > stats.maxMs) stats.maxMs = durationMs;
    };
    const wrapRuntimePerfFunction = (owner, name, key) => {
      if (!owner || typeof owner[name] !== "function") return;
      const originalFn = owner[name];
      if (originalFn.__runtimePerfTimingWrapped) return;
      const wrapped = function runtimePerfTimedFunction() {
        const start = performance.now();
        try {
          return originalFn.apply(this, arguments);
        } finally {
          recordRuntimePerfTiming(key || name, performance.now() - start);
        }
      };
      wrapped.__runtimePerfTimingWrapped = true;
      wrapped.__runtimePerfOriginal = originalFn;
      owner[name] = wrapped;
    };
    const wrapRuntimeAnimationFrame = () => {
      if (window.__runtimePerfAnimationFrameWrapped || typeof window.requestAnimationFrame !== "function") return;
      const originalRequestAnimationFrame = window.requestAnimationFrame.bind(window);
      window.__runtimePerfAnimationFrameWrapped = true;
      window.requestAnimationFrame = function runtimePerfRequestAnimationFrame(callback) {
        if (typeof callback !== "function") return originalRequestAnimationFrame(callback);
        return originalRequestAnimationFrame(function runtimePerfAnimationFrameCallback(nowMs) {
          if (Number.isFinite(nowMs)) {
            if (Number.isFinite(window.__runtimePerfLastAnimationFrameNow) && Array.isArray(window.__runtimePerfFrameIntervals)) {
              window.__runtimePerfFrameIntervals.push(nowMs - window.__runtimePerfLastAnimationFrameNow);
            }
            window.__runtimePerfLastAnimationFrameNow = nowMs;
          }
          const start = performance.now();
          try {
            return callback(nowMs);
          } finally {
            recordRuntimePerfTiming("frame.callback", performance.now() - start);
          }
        });
      };
    };

    const original = window.__runtimePerfOriginalReportChunkPerformanceSample || window.reportChunkPerformanceSample;
    window.__runtimePerfOriginalReportChunkPerformanceSample = original;
    window.reportChunkPerformanceSample = function patchedReportChunkPerformanceSample(fps, nowMs) {
      if (Array.isArray(window.__runtimePerfSamples)) {
        window.__runtimePerfSamples.push({
          fps: Number(fps),
          nowMs: Number.isFinite(nowMs) ? nowMs : performance.now()
        });
      }
      return typeof original === "function" ? original.apply(this, arguments) : undefined;
    };

    [
      "manageChunks",
      "processPendingNearChunkBuilds",
      "updateFires",
      "updateCombatRenderers",
      "updateMiningPoseReferences",
      "updateSkyRuntime",
      "updateWorldNpcRuntime",
      "updateTutorialGuidanceMarker",
      "updateMinimap",
      "updateHoverTooltip",
      "updateCombatEnemyOverlays"
    ].forEach((name) => wrapRuntimePerfFunction(window, name, name));
    if (window.WorldChunkTerrainRuntime) {
      wrapRuntimePerfFunction(window.WorldChunkTerrainRuntime, "buildChunkGroundMeshes", "chunkTerrain.buildChunkGroundMeshes");
    }
    if (window.WorldChunkTierRenderRuntime) {
      wrapRuntimePerfFunction(window.WorldChunkTierRenderRuntime, "createSimplifiedChunkGroup", "chunkTier.createSimplifiedChunkGroup");
    }
    if (window.WorldChunkResourceRenderRuntime) {
      [
        "collectChunkResourceVisualCounts",
        "createChunkResourceRenderState",
        "appendChunkResourceVisual",
        "markChunkResourceVisualsDirty"
      ].forEach((name) => wrapRuntimePerfFunction(window.WorldChunkResourceRenderRuntime, name, `chunkResource.${name}`));
    }
    if (window.WorldStructureRenderRuntime) {
      [
        "createCastleRenderData",
        "createFenceRenderData",
        "createFloorTileRenderData",
        "appendFenceVisualState",
        "setCastleWallVisualState",
        "setCastleTowerVisualState",
        "appendShopCounterVisual",
        "appendFloorTileVisualState",
        "appendStairBlockVisual",
        "appendStairRampVisual",
        "appendChunkLandmarkVisuals",
        "createRoofVisualGroup",
        "markCastleRenderDataDirty",
        "markFenceRenderDataDirty",
        "markFloorTileRenderDataDirty"
      ].forEach((name) => wrapRuntimePerfFunction(window.WorldStructureRenderRuntime, name, `structure.${name}`));
    }
    if (window.WorldWaterRuntime) {
      [
        "appendChunkWaterTilesToBuilders",
        "flushChunkWaterBuilders"
      ].forEach((name) => wrapRuntimePerfFunction(window.WorldWaterRuntime, name, `water.${name}`));
    }
    if (window.WorldNpcRenderRuntime) {
      wrapRuntimePerfFunction(window.WorldNpcRenderRuntime, "appendChunkNpcVisuals", "npc.appendChunkNpcVisuals");
    }

    const rendererRef = (typeof renderer !== "undefined") ? renderer : window.renderer;
    if (rendererRef && typeof rendererRef.render === "function") {
      wrapRuntimePerfFunction(rendererRef, "render", "renderer.render");
    }
    wrapRuntimeAnimationFrame();
  });
}

async function resetPerfSamples(page) {
  await page.evaluate(() => {
    window.__runtimePerfSamples = [];
    window.__runtimePerfTimings = { hooks: {} };
    window.__runtimePerfFrameIntervals = [];
    window.__runtimePerfLastAnimationFrameNow = null;
  });
}

async function installDrawBreakdownHook(page) {
  await page.evaluate(() => {
    const rendererRef = (typeof renderer !== "undefined") ? renderer : window.renderer;
    if (!rendererRef || rendererRef.__runtimePerfDrawBreakdownPatched) return;
    const originalRender = rendererRef.render.bind(rendererRef);
    const originalRenderBufferDirect = rendererRef.renderBufferDirect.bind(rendererRef);
    rendererRef.__runtimePerfDrawBreakdownPatched = true;
    rendererRef.__runtimePerfCurrentDrawBreakdown = null;
    rendererRef.__runtimePerfLastDrawBreakdown = null;

    rendererRef.render = function patchedRuntimePerfRender(sceneArg, cameraArg) {
      rendererRef.__runtimePerfCurrentDrawBreakdown = {
        calls: 0,
        byType: {},
        byObjectPath: {},
        trianglesByType: {},
        trianglesByObjectPath: {}
      };
      const result = originalRender(sceneArg, cameraArg);
      rendererRef.__runtimePerfLastDrawBreakdown = rendererRef.__runtimePerfCurrentDrawBreakdown;
      rendererRef.__runtimePerfCurrentDrawBreakdown = null;
      return result;
    };

    rendererRef.renderBufferDirect = function patchedRuntimePerfRenderBufferDirect(cameraArg, sceneArg, geometry, material, object, group) {
      const breakdown = rendererRef.__runtimePerfCurrentDrawBreakdown;
      if (breakdown) {
        breakdown.calls += 1;
        const type = (object && object.userData && object.userData.type)
          || (object && object.parent && object.parent.userData && object.parent.userData.type)
          || (object && object.type)
          || "none";
        breakdown.byType[type] = (breakdown.byType[type] || 0) + 1;
        const drawVertexCount = group && Number.isFinite(group.count)
          ? group.count
          : (geometry && geometry.index && Number.isFinite(geometry.index.count)
            ? geometry.index.count
            : (geometry && geometry.attributes && geometry.attributes.position && Number.isFinite(geometry.attributes.position.count)
              ? geometry.attributes.position.count
              : 0));
        const drawTriangles = Math.max(0, Math.floor(drawVertexCount / 3));
        breakdown.trianglesByType[type] = (breakdown.trianglesByType[type] || 0) + drawTriangles;

        const names = [];
        let cursor = object;
        while (cursor && names.length < 5) {
          names.push((cursor.userData && cursor.userData.type) || cursor.name || cursor.type || "node");
          cursor = cursor.parent;
        }
        const objectPath = names.join(" > ");
        breakdown.byObjectPath[objectPath] = (breakdown.byObjectPath[objectPath] || 0) + 1;
        breakdown.trianglesByObjectPath[objectPath] = (breakdown.trianglesByObjectPath[objectPath] || 0) + drawTriangles;
      }
      return originalRenderBufferDirect(cameraArg, sceneArg, geometry, material, object, group);
    };
  });
}

function summarizeSamples(samples) {
  const values = samples
    .map((sample) => Number(sample && sample.fps))
    .filter((value) => Number.isFinite(value));
  if (!values.length) {
    return { count: 0, avg: null, min: null, max: null, samples: [] };
  }
  const sum = values.reduce((total, value) => total + value, 0);
  return {
    count: values.length,
    avg: Number((sum / values.length).toFixed(2)),
    min: Math.min(...values),
    max: Math.max(...values),
    samples: values
  };
}

function summarizeValues(values) {
  const numericValues = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
  if (!numericValues.length) {
    return { count: 0, avg: null, min: null, max: null, p95: null, samples: [] };
  }
  const sorted = numericValues.slice().sort((a, b) => a - b);
  const sum = numericValues.reduce((total, value) => total + value, 0);
  const p95Index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * 0.95) - 1));
  return {
    count: numericValues.length,
    avg: Number((sum / numericValues.length).toFixed(2)),
    min: Number(sorted[0].toFixed(2)),
    max: Number(sorted[sorted.length - 1].toFixed(2)),
    p95: Number(sorted[p95Index].toFixed(2)),
    samples: numericValues
  };
}

function buildQualityIssues(metrics, viewport) {
  const issues = [];
  if (!metrics) return ["missing metrics"];
  if (metrics.pixelRatio < 1) issues.push(`pixel ratio below 1 (${metrics.pixelRatio})`);
  if (metrics.drawingBuffer[0] < viewport.width || metrics.drawingBuffer[1] < viewport.height) {
    issues.push(`drawing buffer ${metrics.drawingBuffer.join("x")} below viewport ${viewport.width}x${viewport.height}`);
  }
  if (metrics.shadowMap !== true) issues.push("main shadow map disabled");
  if (/pixelated|crisp-edges/i.test(metrics.canvasImageRendering || "")) {
    issues.push(`canvas image-rendering is ${metrics.canvasImageRendering}`);
  }
  return issues;
}

function isSoftwareWebglRenderer(rendererName) {
  return /swiftshader|software|llvmpipe|mesa offscreen/i.test(String(rendererName || ""));
}

async function readRuntimeMetrics(page, viewport) {
  return page.evaluate((viewportIn) => {
    const rendererRef = (typeof renderer !== "undefined") ? renderer : window.renderer;
    const sceneRef = (typeof scene !== "undefined") ? scene : window.scene;
    const size = {
      x: 0,
      y: 0,
      set(x, y) {
        this.x = x;
        this.y = y;
        return this;
      },
      floor() {
        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);
        return this;
      }
    };
    if (rendererRef && typeof rendererRef.getDrawingBufferSize === "function") {
      rendererRef.getDrawingBufferSize(size);
    }

    const countsByType = {};
    const terrainSubdivisionCounts = {};
    const terrainSubdivisionTriangles = {};
    let visibleMeshes = 0;
    let instancedMeshes = 0;
    let visibleGroups = 0;
    if (sceneRef && typeof sceneRef.traverse === "function") {
      sceneRef.traverse((object) => {
        if (!object || object.visible === false) return;
        if (object.isGroup) visibleGroups += 1;
        if (!object.isMesh && !object.isInstancedMesh) return;
        visibleMeshes += 1;
        if (object.isInstancedMesh) instancedMeshes += 1;
        const type = (object.userData && object.userData.type)
          || (object.parent && object.parent.userData && object.parent.userData.type)
          || object.type
          || "none";
        countsByType[type] = (countsByType[type] || 0) + 1;
        if (type === "GROUND" && object.userData && Number.isFinite(object.userData.terrainSubdivisionMultiplier)) {
          const subdivisionKey = String(object.userData.terrainSubdivisionMultiplier);
          const geometry = object.geometry || null;
          const triangleCount = geometry && geometry.index && Number.isFinite(geometry.index.count)
            ? Math.floor(geometry.index.count / 3)
            : (geometry && geometry.attributes && geometry.attributes.position && Number.isFinite(geometry.attributes.position.count)
              ? Math.floor(geometry.attributes.position.count / 3)
              : 0);
          terrainSubdivisionCounts[subdivisionKey] = (terrainSubdivisionCounts[subdivisionKey] || 0) + 1;
          terrainSubdivisionTriangles[subdivisionKey] = (terrainSubdivisionTriangles[subdivisionKey] || 0) + triangleCount;
        }
      });
    }

    const canvas = rendererRef && rendererRef.domElement ? rendererRef.domElement : document.querySelector("#canvas-container canvas");
    const canvasImageRendering = canvas ? getComputedStyle(canvas).imageRendering : "";
    let webglRenderer = "";
    let webglVendor = "";
    if (canvas && typeof canvas.getContext === "function") {
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (gl) {
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        webglVendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
        webglRenderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      }
    }
    const activePreset = typeof window.getActiveChunkRenderPolicyPreset === "function"
      ? window.getActiveChunkRenderPolicyPreset()
      : null;
    const policy = typeof window.getChunkRenderPolicy === "function"
      ? window.getChunkRenderPolicy(activePreset || undefined)
      : null;
    const rawSamples = Array.isArray(window.__runtimePerfSamples) ? window.__runtimePerfSamples.slice() : [];
    const frameIntervals = Array.isArray(window.__runtimePerfFrameIntervals) ? window.__runtimePerfFrameIntervals.slice() : [];
    const chunkStreaming = window.WorldChunkSceneRuntime && typeof window.WorldChunkSceneRuntime.getChunkStreamingQueueStats === "function"
      ? window.WorldChunkSceneRuntime.getChunkStreamingQueueStats()
      : null;

    const result = {
      viewport: viewportIn,
      fps: rawSamples,
      fpsHudText: document.getElementById("fps-value") ? document.getElementById("fps-value").innerText : "",
      renderCalls: rendererRef && rendererRef.info ? rendererRef.info.render.calls : null,
      triangles: rendererRef && rendererRef.info ? rendererRef.info.render.triangles : null,
      geometries: rendererRef && rendererRef.info ? rendererRef.info.memory.geometries : null,
      textures: rendererRef && rendererRef.info ? rendererRef.info.memory.textures : null,
      pixelRatio: rendererRef && typeof rendererRef.getPixelRatio === "function" ? rendererRef.getPixelRatio() : null,
      drawingBuffer: [size.x, size.y],
      webglVendor,
      webglRenderer,
      softwareWebglRenderer: /swiftshader|software|llvmpipe|mesa offscreen/i.test(String(webglRenderer || "")),
      shadowMap: rendererRef && rendererRef.shadowMap ? !!rendererRef.shadowMap.enabled : null,
      canvasImageRendering,
      visibleMeshes,
      instancedMeshes,
      visibleGroups,
      countsByType,
      terrainSubdivisionCounts,
      terrainSubdivisionTriangles,
      activeChunkPolicyPreset: activePreset,
      chunkPolicy: policy,
      chunkStreaming,
      frameIntervals
    };
    const rawTimings = window.__runtimePerfTimings && window.__runtimePerfTimings.hooks
      ? window.__runtimePerfTimings.hooks
      : {};
    const timingEntries = Object.entries(rawTimings)
      .map(([key, stats]) => {
        const count = Number(stats && stats.count) || 0;
        const totalMs = Number(stats && stats.totalMs) || 0;
        const maxMs = Number(stats && stats.maxMs) || 0;
        return {
          key,
          count,
          totalMs: Number(totalMs.toFixed(2)),
          avgMs: count > 0 ? Number((totalMs / count).toFixed(3)) : 0,
          maxMs: Number(maxMs.toFixed(3))
        };
      })
      .sort((a, b) => b.totalMs - a.totalMs);
    if (timingEntries.length > 0) result.frameTimings = timingEntries;
    const breakdown = rendererRef && rendererRef.__runtimePerfLastDrawBreakdown
      ? rendererRef.__runtimePerfLastDrawBreakdown
      : null;
    if (breakdown) {
      const sortedEntries = (source) => Object.entries(source || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
        .map(([key, count]) => ({ key, count }));
      result.drawBreakdown = {
        calls: breakdown.calls,
        byType: sortedEntries(breakdown.byType),
        byObjectPath: sortedEntries(breakdown.byObjectPath),
        trianglesByType: sortedEntries(breakdown.trianglesByType),
        trianglesByObjectPath: sortedEntries(breakdown.trianglesByObjectPath)
      };
    }
    return result;
  }, viewport);
}

async function runPointerCameraDrag(page, sampleMs, viewport) {
  const width = viewport && Number.isFinite(viewport.width) ? viewport.width : 1240;
  const height = viewport && Number.isFinite(viewport.height) ? viewport.height : 941;
  const centerX = Math.floor(width * 0.5);
  const centerY = Math.floor(height * 0.54);
  const startMs = Date.now();
  await page.mouse.move(centerX, centerY);
  await page.mouse.down({ button: "middle" });
  try {
    while ((Date.now() - startMs) < sampleMs) {
      const elapsed = (Date.now() - startMs) / 1000;
      const x = centerX + (Math.sin(elapsed * 3.8) * 180);
      const y = centerY + (Math.cos(elapsed * 2.6) * 70);
      await page.mouse.move(Math.round(x), Math.round(y), { steps: 4 });
      await page.waitForTimeout(45);
    }
  } finally {
    await page.mouse.up({ button: "middle" }).catch(() => {});
  }
}

async function ensureRunModeOn(page) {
  const runButton = page.locator("#runToggleBtn");
  const count = await runButton.count().catch(() => 0);
  if (!count) return;
  const title = await runButton.getAttribute("title").catch(() => "");
  if (/on/i.test(String(title || ""))) return;
  await runButton.click().catch(() => {});
  await page.waitForTimeout(120);
}

async function runChunkStreamRoute(page, sampleMs) {
  await sendQaCommand(page, "/qa camera preset tutorial_surface");
  await ensureRunModeOn(page);
  await page.locator("#chat-input").evaluate((el) => el.blur()).catch(() => {});
  await page.waitForTimeout(500);
  await resetPerfSamples(page);

  const route = [
    { key: "d", portion: 0.34 },
    { key: "s", portion: 0.26 },
    { key: "a", portion: 0.24 },
    { key: "w", portion: 0.16 }
  ];
  for (const leg of route) {
    const legMs = Math.max(500, Math.floor(sampleMs * leg.portion));
    await page.keyboard.down(leg.key);
    try {
      await page.waitForTimeout(legMs);
    } finally {
      await page.keyboard.up(leg.key).catch(() => {});
    }
  }
}

async function measureScene(page, scene, config, options, viewport) {
  await page.goto(withFreshSessionParam(options.url || config.defaultUrl), { waitUntil: "load", timeout: options.timeoutMs });
  await ensureProfileReady(page);
  await page.locator("#chat-input").waitFor({ state: "visible", timeout: 15000 });
  await page.waitForFunction(() => typeof window.setQaCameraView === "function", null, { timeout: 15000 }).catch(() => {});
  await installPerfHooks(page);

  for (const command of scene.commands) {
    await sendQaCommand(page, command);
    await page.waitForTimeout(220);
  }

  await page.waitForTimeout(Number.isFinite(scene.waitMs) ? scene.waitMs : (config.defaultWaitMs || 900));
  await page.locator("#chat-input").evaluate((el) => el.blur()).catch(() => {});
  await resetPerfSamples(page);
  if (options.cameraOrbit && !options.chunkStreamRoute) {
    await page.keyboard.down("ArrowLeft");
  }
  try {
    if (options.chunkStreamRoute) {
      await runChunkStreamRoute(page, options.sampleMs);
    } else if (options.pointerCameraDrag) {
      await runPointerCameraDrag(page, options.sampleMs, viewport);
    } else {
      await page.waitForTimeout(options.sampleMs);
    }
  } finally {
    if (options.cameraOrbit && !options.chunkStreamRoute) await page.keyboard.up("ArrowLeft").catch(() => {});
  }
  if (options.drawBreakdown) {
    await installDrawBreakdownHook(page);
    await page.waitForTimeout(500);
  }

  const metrics = await readRuntimeMetrics(page, viewport);
  metrics.fpsSummary = summarizeSamples(metrics.fps);
  metrics.frameIntervalSummary = summarizeValues(metrics.frameIntervals || []);
  metrics.qualityIssues = buildQualityIssues(metrics, viewport);
  metrics.meetsMinFps = options.minFps <= 0 || (metrics.fpsSummary.avg !== null && metrics.fpsSummary.avg >= options.minFps);
  metrics.meetsTargetFps = metrics.fpsSummary.avg !== null && metrics.fpsSummary.avg >= options.targetFps;
  return {
    sceneId: scene.id,
    label: scene.label || scene.id,
    commands: scene.commands.slice(),
    sampleMs: options.sampleMs,
    targetFps: options.targetFps,
    minFps: options.minFps,
    pointerCameraDrag: options.pointerCameraDrag,
    chunkStreamRoute: options.chunkStreamRoute,
    metrics
  };
}

async function runHarness(rawOptions) {
  const options = rawOptions || parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return { ok: true, help: true };
  }

  const config = loadSceneConfig(options.configPath);
  const url = options.url || config.defaultUrl || "http://127.0.0.1:5502/";
  options.url = url;

  let serverProcess = null;
  const initiallyReachable = await probeUrl(url);
  if (!initiallyReachable && options.startServer) {
    serverProcess = startViteServer(url);
  }
  const reachable = initiallyReachable || await waitForReachableUrl(url, Math.min(options.timeoutMs, 30000));
  if (!reachable) {
    throw new Error(`Game URL is not reachable: ${url}. Start the dev server or pass --start-server.`);
  }

  const sceneIdFilter = new Set(options.sceneIds);
  const scenes = sceneIdFilter.size > 0
    ? config.scenes.filter((scene) => sceneIdFilter.has(scene.id))
    : config.scenes;
  if (sceneIdFilter.size > 0 && scenes.length !== sceneIdFilter.size) {
    const knownIds = new Set(config.scenes.map((scene) => scene.id));
    const missing = options.sceneIds.filter((id) => !knownIds.has(id));
    throw new Error(`Unknown scene id(s): ${missing.join(", ")}`);
  }

  const deps = { playwright: requireFromSearchPaths("playwright") };
  const viewport = config.viewport || { width: 1240, height: 941 };
  const browser = await deps.playwright.chromium.launch({ headless: !options.headed });
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.setDefaultTimeout(options.timeoutMs);

  const consoleMessages = [];
  const pageErrors = [];
  page.on("console", (message) => {
    const type = message.type();
    if (type === "error" || type === "warning") consoleMessages.push({ type, text: message.text() });
  });
  page.on("pageerror", (error) => pageErrors.push(error.message || String(error)));

  const results = [];
  try {
    for (const scene of scenes) {
      results.push(await measureScene(page, scene, config, options, viewport));
    }
  } finally {
    await browser.close().catch(() => {});
    if (serverProcess) serverProcess.kill();
  }

  const failures = [];
  if (pageErrors.length > 0) failures.push(`page errors: ${pageErrors.length}`);
  for (const result of results) {
    const metrics = result.metrics;
    if (metrics.softwareWebglRenderer) {
      consoleMessages.push({
        type: "warning",
        text: `${result.sceneId}: WebGL is using software rendering (${metrics.webglRenderer || "unknown renderer"}); FPS is useful for regression only.`
      });
    }
    if (options.requireFullQuality && metrics.qualityIssues.length > 0) {
      failures.push(`${result.sceneId}: quality drift (${metrics.qualityIssues.join("; ")})`);
    }
    if (!metrics.meetsMinFps) {
      failures.push(`${result.sceneId}: avg FPS ${metrics.fpsSummary.avg} below min ${options.minFps}`);
    }
  }

  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    url,
    viewport,
    outputDir: options.outputDir,
    targetFps: options.targetFps,
    minFps: options.minFps,
    cameraOrbit: options.cameraOrbit,
    pointerCameraDrag: options.pointerCameraDrag,
    chunkStreamRoute: options.chunkStreamRoute,
    requireFullQuality: options.requireFullQuality,
    drawBreakdown: options.drawBreakdown,
    scenes: results,
    consoleMessages,
    pageErrors,
    failures,
    notes: [
      "FPS is sampled from the in-game reportChunkPerformanceSample hook after scene setup has settled.",
      "Quality checks enforce full pixel ratio, full drawing buffer, enabled shadow maps, and non-pixelated canvas CSS.",
      "Use --min-fps 50 to turn the target into a hard gate once the runtime is ready."
    ]
  };

  ensureDir(options.outputDir);
  fs.writeFileSync(path.join(options.outputDir, "report.json"), JSON.stringify(report, null, 2));
  return report;
}

async function main() {
  try {
    const report = await runHarness();
    if (report.help) return;
    for (const result of report.scenes) {
      const fps = result.metrics.fpsSummary;
      const frameIntervals = result.metrics.frameIntervalSummary || {};
      const quality = result.metrics.qualityIssues.length ? `quality drift: ${result.metrics.qualityIssues.join("; ")}` : "quality ok";
      console.log([
        `${result.sceneId}: avg ${fps.avg} FPS`,
        `min ${fps.min}`,
        `max ${fps.max}`,
        frameIntervals.max !== null && frameIntervals.max !== undefined ? `max frame interval ${frameIntervals.max}ms` : "max frame interval n/a",
        `${result.metrics.renderCalls} calls`,
        `${result.metrics.triangles} tris`,
        result.metrics.softwareWebglRenderer ? "software WebGL" : "hardware WebGL",
        quality
      ].join(", "));
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
  parseArgs,
  runHarness,
  summarizeSamples
};
