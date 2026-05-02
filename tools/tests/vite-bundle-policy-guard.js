const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const configSource = fs.readFileSync(path.join(root, "vite.config.ts"), "utf8");

  assert(configSource.includes("function getManualChunkName"), "vite config should keep a named manual chunk policy");
  assert(configSource.includes('return "vendor-three";'), "vite config should split three into a named vendor chunk");
  assert(configSource.includes('"/src/game/platform/legacy-scripts/"'), "vite config should split legacy script domains into named chunks");
  assert(configSource.includes("function getRawLegacyScriptChunkName"), "vite config should keep raw legacy script chunk routing");
  assert(configSource.includes('return "legacy-skills-specs";'), "vite config should split skill spec shards away from the skill domain chunk");
  assert(configSource.includes("manualChunks: getManualChunkName"), "vite build output should use the manual chunk policy");
  assert(configSource.includes("chunkSizeWarningLimit: 800"), "vite build should keep the calibrated chunk warning limit");

  console.log("Vite bundle policy guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
