const DEFAULT_CODEX_BASE_PATH = "/osrs-clone-codex/";

const ENTITY_SEGMENTS = Object.freeze({
  enemy: "enemies",
  item: "items",
  skill: "skills",
  world: "world"
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizeCodexBasePath(basePath = DEFAULT_CODEX_BASE_PATH) {
  let normalized = String(basePath || DEFAULT_CODEX_BASE_PATH).trim();
  if (!normalized) normalized = DEFAULT_CODEX_BASE_PATH;
  if (!normalized.startsWith("/")) normalized = `/${normalized}`;
  normalized = normalized.replace(/\/+/g, "/");
  if (!normalized.endsWith("/")) normalized += "/";
  return normalized;
}

function normalizeCodexEntityType(entityType) {
  const normalized = String(entityType || "").trim().toLowerCase();
  if (normalized === "enemy" || normalized === "enemies") return "enemy";
  if (normalized === "item" || normalized === "items") return "item";
  if (normalized === "skill" || normalized === "skills") return "skill";
  if (normalized === "world" || normalized === "worlds") return "world";
  throw new Error(`Unsupported codex entity type: ${entityType}`);
}

function normalizeEntityId(entityId, entityType = "entity") {
  const normalized = String(entityId || "").trim();
  assert(normalized, `${entityType} id is required`);
  return normalized;
}

function buildSearchParams(options = {}) {
  const params = new URLSearchParams();
  const from = String(options.from || "").trim();
  const returnTo = String(options.returnTo || "").trim();
  if (from) params.set("from", from);
  if (returnTo) params.set("return", returnTo);
  const query = params.toString();
  return query ? `?${query}` : "";
}

function buildCodexHomePath(options = {}) {
  return `${normalizeCodexBasePath(options.basePath)}${buildSearchParams(options)}`;
}

function buildCodexEntityPath(entityType, entityId, options = {}) {
  const normalizedType = normalizeCodexEntityType(entityType);
  const normalizedId = normalizeEntityId(entityId, normalizedType);
  const basePath = normalizeCodexBasePath(options.basePath);
  const segment = ENTITY_SEGMENTS[normalizedType];
  return `${basePath}${segment}/${encodeURIComponent(normalizedId)}${buildSearchParams(options)}`;
}

function buildCodexHomeUrl(options = {}) {
  if (!options.baseUrl) return buildCodexHomePath(options);
  return new URL(buildCodexHomePath(options), options.baseUrl).toString();
}

function buildCodexEntityUrl(entityType, entityId, options = {}) {
  if (!options.baseUrl) return buildCodexEntityPath(entityType, entityId, options);
  return new URL(buildCodexEntityPath(entityType, entityId, options), options.baseUrl).toString();
}

function getCodexRouteTemplates(basePath = DEFAULT_CODEX_BASE_PATH) {
  const normalizedBasePath = normalizeCodexBasePath(basePath);
  return {
    home: normalizedBasePath,
    enemy: `${normalizedBasePath}${ENTITY_SEGMENTS.enemy}/:enemyId`,
    item: `${normalizedBasePath}${ENTITY_SEGMENTS.item}/:itemId`,
    skill: `${normalizedBasePath}${ENTITY_SEGMENTS.skill}/:skillId`,
    world: `${normalizedBasePath}${ENTITY_SEGMENTS.world}/:worldId`
  };
}

module.exports = {
  DEFAULT_CODEX_BASE_PATH,
  ENTITY_SEGMENTS,
  normalizeCodexBasePath,
  normalizeCodexEntityType,
  buildCodexHomePath,
  buildCodexEntityPath,
  buildCodexHomeUrl,
  buildCodexEntityUrl,
  getCodexRouteTemplates
};
