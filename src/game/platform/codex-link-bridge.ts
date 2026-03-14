import {
  DEFAULT_CODEX_BASE_PATH,
  buildCodexEntityPath,
  buildCodexEntityUrl,
  buildCodexHomePath,
  buildCodexHomeUrl,
  getCodexRouteTemplates,
  normalizeCodexBasePath
} from "../codex/link-contract";

declare global {
  interface Window {
    GameCodexRuntime?: {
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

export function exposeCodexLinkBridge(): void {
  window.GameCodexRuntime = {
    defaultBasePath: DEFAULT_CODEX_BASE_PATH,
    normalizeBasePath: normalizeCodexBasePath,
    buildHomePath: buildCodexHomePath,
    buildEntityPath: buildCodexEntityPath,
    buildHomeUrl: buildCodexHomeUrl,
    buildEntityUrl: buildCodexEntityUrl,
    getRouteTemplates: getCodexRouteTemplates
  };
}
