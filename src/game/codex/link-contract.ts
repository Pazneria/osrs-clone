export type CodexEntityType = "item" | "skill" | "world";

export interface BuildCodexLinkOptions {
  basePath?: string;
  baseUrl?: string;
  from?: string;
  returnTo?: string | null;
}

export const DEFAULT_CODEX_BASE_PATH = "/osrs-clone-codex/";

const ENTITY_SEGMENTS: Record<CodexEntityType, string> = {
  item: "items",
  skill: "skills",
  world: "world"
};

function assertNonEmpty(value: string, label: string): string {
  const normalized = String(value || "").trim();
  if (!normalized) throw new Error(`${label} is required`);
  return normalized;
}

export function normalizeCodexBasePath(basePath = DEFAULT_CODEX_BASE_PATH): string {
  let normalized = String(basePath || DEFAULT_CODEX_BASE_PATH).trim();
  if (!normalized) normalized = DEFAULT_CODEX_BASE_PATH;
  if (!normalized.startsWith("/")) normalized = `/${normalized}`;
  normalized = normalized.replace(/\/+/g, "/");
  if (!normalized.endsWith("/")) normalized += "/";
  return normalized;
}

export function normalizeCodexEntityType(entityType: string): CodexEntityType {
  const normalized = String(entityType || "").trim().toLowerCase();
  if (normalized === "item" || normalized === "items") return "item";
  if (normalized === "skill" || normalized === "skills") return "skill";
  if (normalized === "world" || normalized === "worlds") return "world";
  throw new Error(`Unsupported codex entity type: ${entityType}`);
}

function buildCodexSearchParams(options: BuildCodexLinkOptions): string {
  const params = new URLSearchParams();
  const from = String(options.from || "").trim();
  const returnTo = String(options.returnTo || "").trim();
  if (from) params.set("from", from);
  if (returnTo) params.set("return", returnTo);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function buildCodexHomePath(options: BuildCodexLinkOptions = {}): string {
  return `${normalizeCodexBasePath(options.basePath)}${buildCodexSearchParams(options)}`;
}

export function buildCodexEntityPath(
  entityType: CodexEntityType | string,
  entityId: string,
  options: BuildCodexLinkOptions = {}
): string {
  const normalizedType = normalizeCodexEntityType(entityType);
  const normalizedId = assertNonEmpty(entityId, `${normalizedType} id`);
  const basePath = normalizeCodexBasePath(options.basePath);
  return `${basePath}${ENTITY_SEGMENTS[normalizedType]}/${encodeURIComponent(normalizedId)}${buildCodexSearchParams(options)}`;
}

export function buildCodexHomeUrl(options: BuildCodexLinkOptions = {}): string {
  if (!options.baseUrl) return buildCodexHomePath(options);
  return new URL(buildCodexHomePath(options), options.baseUrl).toString();
}

export function buildCodexEntityUrl(
  entityType: CodexEntityType | string,
  entityId: string,
  options: BuildCodexLinkOptions = {}
): string {
  if (!options.baseUrl) return buildCodexEntityPath(entityType, entityId, options);
  return new URL(buildCodexEntityPath(entityType, entityId, options), options.baseUrl).toString();
}

export function getCodexRouteTemplates(basePath = DEFAULT_CODEX_BASE_PATH): Record<"home" | CodexEntityType, string> {
  const normalizedBasePath = normalizeCodexBasePath(basePath);
  return {
    home: normalizedBasePath,
    item: `${normalizedBasePath}${ENTITY_SEGMENTS.item}/:itemId`,
    skill: `${normalizedBasePath}${ENTITY_SEGMENTS.skill}/:skillId`,
    world: `${normalizedBasePath}${ENTITY_SEGMENTS.world}/:worldId`
  };
}
