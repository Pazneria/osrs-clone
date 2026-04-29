import worldIdAliases from "../../../content/world/world-id-aliases.json";

type WorldIdAliasConfig = {
  canonicalWorldIds?: {
    mainOverworld?: string;
  };
  aliases?: Record<string, string>;
};

const aliasConfig = worldIdAliases as WorldIdAliasConfig;

export const MAIN_OVERWORLD_WORLD_ID =
  aliasConfig.canonicalWorldIds?.mainOverworld || "main_overworld";

export const LEGACY_STARTER_TOWN_WORLD_ID = "starter_town";

const WORLD_ID_ALIASES: Record<string, string> = {
  ...(aliasConfig.aliases || {})
};

export function normalizeWorldId(worldId?: string | null): string {
  return String(worldId || "").trim();
}

export function canonicalizeWorldId(worldId?: string | null): string {
  const normalizedWorldId = normalizeWorldId(worldId);
  return WORLD_ID_ALIASES[normalizedWorldId] || normalizedWorldId;
}

export function isLegacyWorldIdAlias(worldId?: string | null): boolean {
  const normalizedWorldId = normalizeWorldId(worldId);
  return !!normalizedWorldId && WORLD_ID_ALIASES[normalizedWorldId] !== undefined;
}
