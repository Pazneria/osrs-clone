const DEFAULT_WIKI_BASE_PATH = "/osrs-clone-wiki/";

const ENTITY_SEGMENTS = Object.freeze({
  item: "items",
  skill: "skills",
  world: "world"
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizeWikiBasePath(basePath = DEFAULT_WIKI_BASE_PATH) {
  let normalized = String(basePath || DEFAULT_WIKI_BASE_PATH).trim();
  if (!normalized) normalized = DEFAULT_WIKI_BASE_PATH;
  if (!normalized.startsWith("/")) normalized = `/${normalized}`;
  normalized = normalized.replace(/\/+/g, "/");
  if (!normalized.endsWith("/")) normalized += "/";
  return normalized;
}

function normalizeWikiEntityType(entityType) {
  const normalized = String(entityType || "").trim().toLowerCase();
  if (normalized === "item" || normalized === "items") return "item";
  if (normalized === "skill" || normalized === "skills") return "skill";
  if (normalized === "world" || normalized === "worlds") return "world";
  throw new Error(`Unsupported wiki entity type: ${entityType}`);
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

function buildWikiHomePath(options = {}) {
  return `${normalizeWikiBasePath(options.basePath)}${buildSearchParams(options)}`;
}

function buildWikiEntityPath(entityType, entityId, options = {}) {
  const normalizedType = normalizeWikiEntityType(entityType);
  const normalizedId = normalizeEntityId(entityId, normalizedType);
  const basePath = normalizeWikiBasePath(options.basePath);
  const segment = ENTITY_SEGMENTS[normalizedType];
  return `${basePath}${segment}/${encodeURIComponent(normalizedId)}${buildSearchParams(options)}`;
}

function buildWikiHomeUrl(options = {}) {
  if (!options.baseUrl) return buildWikiHomePath(options);
  return new URL(buildWikiHomePath(options), options.baseUrl).toString();
}

function buildWikiEntityUrl(entityType, entityId, options = {}) {
  if (!options.baseUrl) return buildWikiEntityPath(entityType, entityId, options);
  return new URL(buildWikiEntityPath(entityType, entityId, options), options.baseUrl).toString();
}

function getWikiRouteTemplates(basePath = DEFAULT_WIKI_BASE_PATH) {
  const normalizedBasePath = normalizeWikiBasePath(basePath);
  return {
    home: normalizedBasePath,
    item: `${normalizedBasePath}${ENTITY_SEGMENTS.item}/:itemId`,
    skill: `${normalizedBasePath}${ENTITY_SEGMENTS.skill}/:skillId`,
    world: `${normalizedBasePath}${ENTITY_SEGMENTS.world}/:worldId`
  };
}

module.exports = {
  DEFAULT_WIKI_BASE_PATH,
  ENTITY_SEGMENTS,
  normalizeWikiBasePath,
  normalizeWikiEntityType,
  buildWikiHomePath,
  buildWikiEntityPath,
  buildWikiHomeUrl,
  buildWikiEntityUrl,
  getWikiRouteTemplates
};
