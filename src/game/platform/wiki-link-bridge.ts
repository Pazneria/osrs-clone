import {
  DEFAULT_WIKI_BASE_PATH,
  buildWikiEntityPath,
  buildWikiEntityUrl,
  buildWikiHomePath,
  buildWikiHomeUrl,
  getWikiRouteTemplates,
  normalizeWikiBasePath
} from "../wiki/link-contract";

declare global {
  interface Window {
    GameWikiRuntime?: {
      defaultBasePath: string;
      normalizeBasePath: (basePath?: string) => string;
      buildHomePath: (options?: { basePath?: string; from?: string; returnTo?: string | null }) => string;
      buildEntityPath: (entityType: string, entityId: string, options?: { basePath?: string; from?: string; returnTo?: string | null }) => string;
      buildHomeUrl: (options?: { basePath?: string; baseUrl?: string; from?: string; returnTo?: string | null }) => string;
      buildEntityUrl: (entityType: string, entityId: string, options?: { basePath?: string; baseUrl?: string; from?: string; returnTo?: string | null }) => string;
      getRouteTemplates: (basePath?: string) => Record<"home" | "item" | "skill" | "world", string>;
    };
  }
}

export function exposeWikiLinkBridge(): void {
  window.GameWikiRuntime = {
    defaultBasePath: DEFAULT_WIKI_BASE_PATH,
    normalizeBasePath: normalizeWikiBasePath,
    buildHomePath: buildWikiHomePath,
    buildEntityPath: buildWikiEntityPath,
    buildHomeUrl: buildWikiHomeUrl,
    buildEntityUrl: buildWikiEntityUrl,
    getRouteTemplates: getWikiRouteTemplates
  };
}
