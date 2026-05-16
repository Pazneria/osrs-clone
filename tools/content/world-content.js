const path = require("path");

const { readJsonFile } = require("../lib/json-file-utils");
const worldIdAliases = require("../../content/world/world-id-aliases.json");

function loadWorldManifest(root) {
  return readJsonFile(path.join(root, "content", "world", "manifest.json"));
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
  const world = readJsonFile(regionPath);
  const stamps = {};
  const stampIds = Array.isArray(manifestEntry.stampIds) ? manifestEntry.stampIds : [];
  for (let i = 0; i < stampIds.length; i++) {
    const stampId = stampIds[i];
    const stampPath = path.join(stampsDir, `${stampId}.json`);
    stamps[stampId] = readJsonFile(stampPath);
  }
  return { manifest, manifestEntry, world, stamps };
}

module.exports = {
  loadWorldContent,
  loadWorldManifest
};
