const fs = require("fs");
const path = require("path");

const worldIdAliases = require("../../content/world/world-id-aliases.json");

function loadJson(absPath) {
  return JSON.parse(fs.readFileSync(absPath, "utf8"));
}

function loadWorldManifest(root) {
  return loadJson(path.join(root, "content", "world", "manifest.json"));
}

function canonicalizeWorldId(worldId) {
  const targetWorldId = String(worldId || "").trim();
  const aliases = worldIdAliases && worldIdAliases.aliases && typeof worldIdAliases.aliases === "object"
    ? worldIdAliases.aliases
    : {};
  return aliases[targetWorldId] || targetWorldId;
}

function getWorldManifestEntry(manifest, worldId) {
  const targetWorldId = canonicalizeWorldId(worldId);
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

function loadMainOverworld(root) {
  return loadWorldContent(root, "main_overworld");
}

module.exports = {
  canonicalizeWorldId,
  getWorldManifestEntry,
  loadJson,
  loadMainOverworld,
  loadWorldContent,
  loadWorldManifest
};
