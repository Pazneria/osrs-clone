const fs = require("fs");
const path = require("path");

function loadJson(absPath) {
  return JSON.parse(fs.readFileSync(absPath, "utf8"));
}

function loadWorldManifest(root) {
  return loadJson(path.join(root, "content", "world", "manifest.json"));
}

function getWorldManifestEntry(manifest, worldId) {
  const targetWorldId = String(worldId || "").trim();
  const worlds = manifest && Array.isArray(manifest.worlds) ? manifest.worlds : [];
  const entry = worlds.find((row) => row && row.worldId === targetWorldId);
  if (!entry) {
    throw new Error(`Unknown worldId ${targetWorldId}`);
  }
  return entry;
}

function loadWorldContent(root, worldId) {
  const manifest = loadWorldManifest(root);
  const manifestEntry = getWorldManifestEntry(manifest, worldId);
  const regionPath = path.join(root, "content", "world", "regions", manifestEntry.regionFile);
  const stampsDir = path.join(root, "content", "world", "stamps");
  const world = loadJson(regionPath);
  const stamps = {};
  const stampIds = Array.isArray(manifestEntry.stampIds) ? manifestEntry.stampIds : [];
  for (let i = 0; i < stampIds.length; i++) {
    const stampId = stampIds[i];
    const stampPath = path.join(stampsDir, `${stampId}.json`);
    stamps[stampId] = loadJson(stampPath);
  }
  return { manifest, manifestEntry, world, stamps };
}

function loadStarterTownWorld(root) {
  return loadWorldContent(root, "starter_town");
}

module.exports = {
  getWorldManifestEntry,
  loadJson,
  loadStarterTownWorld,
  loadWorldContent,
  loadWorldManifest
};
