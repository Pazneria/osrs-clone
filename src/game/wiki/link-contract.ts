export type WikiEntityType = "item" | "skill" | "world";

export interface BuildWikiLinkOptions {
  basePath?: string;
  baseUrl?: string;
  from?: string;
  returnTo?: string | null;
}

export const DEFAULT_WIKI_BASE_PATH = "/osrs-clone-wiki/";

const ENTITY_SEGMENTS: Record<WikiEntityType, string> = {
  item: "items",
  skill: "skills",
  world: "world"
};

function assertNonEmpty(value: string, label: string): string {
  const normalized = String(value || "").trim();
  if (!normalized) throw new Error(`${label} is required`);
  return normalized;
}

export function normalizeWikiBasePath(basePath = DEFAULT_WIKI_BASE_PATH): string {
  let normalized = String(basePath || DEFAULT_WIKI_BASE_PATH).trim();
  if (!normalized) normalized = DEFAULT_WIKI_BASE_PATH;
  if (!normalized.startsWith("/")) normalized = `/${normalized}`;
  normalized = normalized.replace(/\/+/g, "/");
  if (!normalized.endsWith("/")) normalized += "/";
  return normalized;
}

export function normalizeWikiEntityType(entityType: string): WikiEntityType {
  const normalized = String(entityType || "").trim().toLowerCase();
  if (normalized === "item" || normalized === "items") return "item";
  if (normalized === "skill" || normalized === "skills") return "skill";
  if (normalized === "world" || normalized === "worlds") return "world";
  throw new Error(`Unsupported wiki entity type: ${entityType}`);
}

function buildWikiSearchParams(options: BuildWikiLinkOptions): string {
  const params = new URLSearchParams();
  const from = String(options.from || "").trim();
  const returnTo = String(options.returnTo || "").trim();
  if (from) params.set("from", from);
  if (returnTo) params.set("return", returnTo);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function buildWikiHomePath(options: BuildWikiLinkOptions = {}): string {
  return `${normalizeWikiBasePath(options.basePath)}${buildWikiSearchParams(options)}`;
}

export function buildWikiEntityPath(
  entityType: WikiEntityType | string,
  entityId: string,
  options: BuildWikiLinkOptions = {}
): string {
  const normalizedType = normalizeWikiEntityType(entityType);
  const normalizedId = assertNonEmpty(entityId, `${normalizedType} id`);
  const basePath = normalizeWikiBasePath(options.basePath);
  return `${basePath}${ENTITY_SEGMENTS[normalizedType]}/${encodeURIComponent(normalizedId)}${buildWikiSearchParams(options)}`;
}

export function buildWikiHomeUrl(options: BuildWikiLinkOptions = {}): string {
  if (!options.baseUrl) return buildWikiHomePath(options);
  return new URL(buildWikiHomePath(options), options.baseUrl).toString();
}

export function buildWikiEntityUrl(
  entityType: WikiEntityType | string,
  entityId: string,
  options: BuildWikiLinkOptions = {}
): string {
  if (!options.baseUrl) return buildWikiEntityPath(entityType, entityId, options);
  return new URL(buildWikiEntityPath(entityType, entityId, options), options.baseUrl).toString();
}

export function getWikiRouteTemplates(basePath = DEFAULT_WIKI_BASE_PATH): Record<"home" | WikiEntityType, string> {
  const normalizedBasePath = normalizeWikiBasePath(basePath);
  return {
    home: normalizedBasePath,
    item: `${normalizedBasePath}${ENTITY_SEGMENTS.item}/:itemId`,
    skill: `${normalizedBasePath}${ENTITY_SEGMENTS.skill}/:skillId`,
    world: `${normalizedBasePath}${ENTITY_SEGMENTS.world}/:worldId`
  };
}
