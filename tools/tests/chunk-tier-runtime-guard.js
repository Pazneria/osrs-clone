const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const coreSource = fs.readFileSync(path.join(root, "src", "js", "core.js"), "utf8");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const inputSource = fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8");

  assert(coreSource.includes("CHUNK_RENDER_POLICY_PRESETS"), "core.js should define chunk render policy presets");
  assert(coreSource.includes("applyChunkRenderPolicyPreset"), "core.js should expose chunk policy preset mutation");
  assert(coreSource.includes("getChunkRenderPolicyRevision"), "core.js should expose chunk policy revision tracking");

  assert(worldSource.includes("collectDesiredChunkTierAssignments"), "world.js should build tier assignments for chunks");
  assert(worldSource.includes("ensureFarChunkBackdropBuilt"), "world.js should prebuild far chunk backdrops");
  assert(worldSource.includes("applyChunkTierForKey"), "world.js should apply tier transitions by chunk");
  assert(worldSource.includes("chunkInteractionMeshes.set(key"), "world.js should cache interaction meshes per near chunk");
  assert(
    worldSource.includes("targetTier === CHUNK_TIER_NEAR && desiredInteractionChunks.has(key)"),
    "world.js should keep interaction registration constrained to near-tier chunks"
  );
  assert(worldSource.includes("function reportChunkPerformanceSample"), "world.js should define auto quality sampling");
  assert(worldSource.includes("stepChunkRenderPolicyPreset(-1"), "world.js should support quality downgrade");
  assert(worldSource.includes("stepChunkRenderPolicyPreset(1"), "world.js should support quality upgrade");

  assert(
    inputSource.includes("window.reportChunkPerformanceSample"),
    "input-render.js should report fps samples to chunk quality controller"
  );

  console.log("Chunk tier runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
