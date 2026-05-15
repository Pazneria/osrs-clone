import type {
  CombatProgressionBandDefinition,
  CombatProgressionBandWorldSummary,
  EnemyRuntimeState,
  EnemySpawnNodeDefinition,
  EnemyTypeDefinition,
  PlayerCombatStateShape
} from "../contracts/combat";
import type { PlayerSkillMap } from "../contracts/session";
import type { Point3 } from "../contracts/world";
import {
  buildCombatStatsViewModel,
  buildPlayerCombatDefaults,
  clampPlayerCurrentHitpoints,
  computeEnemyMeleeCombatSnapshot,
  computePlayerCombatSnapshot,
  computePlayerMaxHitpoints,
  computePlayerMeleeCombatSnapshot,
  computePlayerMagicCombatSnapshot,
  computePlayerRangedCombatSnapshot,
  decrementCooldown,
  applyPlayerHitpointDamage,
  applyPlayerHitpointHealing,
  isWithinMeleeRange,
  isWithinSquareRange,
  pickDropEntry,
  rollDamage,
  rollOpposedHitCheck
} from "../combat/formulas";
import {
  COMBAT_SPEC_VERSION,
  createDefaultPlayerCombatState,
  createEnemyRuntimeState,
  DEFAULT_MELEE_STYLE,
  getCombatProgressionBandForEnemy,
  getEnemyTypeDefinition,
  listCombatProgressionBands,
  listEnemySpawnNodesForWorld as listLegacyEnemySpawnNodesForWorld,
  listEnemyTypes
} from "../combat/content";
import { clonePoint3 } from "../world/clone";

type CombatSpawnSource = {
  combatSpawns?: unknown;
  definition?: {
    combatSpawns?: unknown;
  };
  legacy?: {
    combatSpawns?: unknown;
  };
  publishedWorldState?: {
    combatSpawns?: unknown;
  };
};

declare global {
  interface Window {
    CombatRuntime?: {
      getSpecVersion: () => string;
      getDefaultMeleeStyle: () => PlayerCombatStateShape["selectedMeleeStyle"];
      createDefaultPlayerCombatState: (maxHitpoints?: number) => PlayerCombatStateShape;
      buildPlayerCombatDefaults: (playerSkills: PlayerSkillMap) => PlayerCombatStateShape;
      computePlayerMaxHitpoints: typeof computePlayerMaxHitpoints;
      clampPlayerCurrentHitpoints: typeof clampPlayerCurrentHitpoints;
      applyPlayerHitpointHealing: typeof applyPlayerHitpointHealing;
      applyPlayerHitpointDamage: typeof applyPlayerHitpointDamage;
      buildCombatStatsViewModel: typeof buildCombatStatsViewModel;
      computePlayerCombatSnapshot: typeof computePlayerCombatSnapshot;
      computePlayerMeleeCombatSnapshot: typeof computePlayerMeleeCombatSnapshot;
      computePlayerRangedCombatSnapshot: typeof computePlayerRangedCombatSnapshot;
      computePlayerMagicCombatSnapshot: typeof computePlayerMagicCombatSnapshot;
      computeEnemyMeleeCombatSnapshot: typeof computeEnemyMeleeCombatSnapshot;
      decrementCooldown: typeof decrementCooldown;
      rollOpposedHitCheck: typeof rollOpposedHitCheck;
      rollDamage: typeof rollDamage;
      isWithinSquareRange: typeof isWithinSquareRange;
      isWithinMeleeRange: typeof isWithinMeleeRange;
      pickDropEntry: typeof pickDropEntry;
      listCombatProgressionBands: () => CombatProgressionBandDefinition[];
      getCombatProgressionBandForEnemy: (enemyId: string) => CombatProgressionBandDefinition | null;
      listCombatProgressionBandWorldSummaries: (worldId: string) => CombatProgressionBandWorldSummary[];
      listEnemyTypes: () => EnemyTypeDefinition[];
      getEnemyTypeDefinition: (enemyId: string) => EnemyTypeDefinition | null;
      listEnemySpawnNodesForWorld: (worldId: string) => EnemySpawnNodeDefinition[];
      getWorldCombatSpawnNodes: (worldId: string) => EnemySpawnNodeDefinition[];
      createEnemyRuntimeState: (spawnNode: EnemySpawnNodeDefinition, currentTick?: number) => EnemyRuntimeState;
    };
  }
}

function normalizeWorldId(worldId: string | null | undefined): string {
  return String(worldId || "").trim();
}

function isPoint3Like(value: unknown): value is Point3 {
  return !!value
    && typeof value === "object"
    && Number.isFinite((value as Point3).x)
    && Number.isFinite((value as Point3).y)
    && Number.isFinite((value as Point3).z);
}

function normalizePoint3(value: unknown): Point3 | null {
  if (!isPoint3Like(value)) return null;
  return clonePoint3({
    x: Math.floor(Number(value.x)),
    y: Math.floor(Number(value.y)),
    z: Math.floor(Number(value.z))
  });
}

function normalizePatrolRoute(value: unknown): Point3[] | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const route = value
    .map(normalizePoint3)
    .filter((point): point is Point3 => !!point);
  return route.length >= 2 ? route : null;
}

function normalizeSpawnNode(definition: unknown): EnemySpawnNodeDefinition | null {
  if (!definition || typeof definition !== "object") return null;
  const spawnNode = definition as Record<string, unknown>;
  const spawnNodeId = normalizeWorldId(
    typeof spawnNode.spawnNodeId === "string"
      ? spawnNode.spawnNodeId
      : (typeof spawnNode.spawnId === "string" ? spawnNode.spawnId : null)
  );
  const enemyId = normalizeWorldId(
    typeof spawnNode.enemyId === "string"
      ? spawnNode.enemyId
      : (typeof spawnNode.enemy === "string" ? spawnNode.enemy : null)
  );
  const spawnTileLike: unknown = spawnNode.spawnTile ?? spawnNode.spawn ?? spawnNode.position ?? null;
  if (!spawnNodeId || !enemyId || !isPoint3Like(spawnTileLike)) return null;

  const spawnTile = normalizePoint3(spawnTileLike);
  if (!spawnTile) return null;
  const homeTileOverrideLike: unknown = spawnNode.homeTileOverride ?? spawnNode.homeTile ?? null;
  const roamingRadiusOverride = Number.isFinite(Number(spawnNode.roamingRadiusOverride))
    ? Math.max(0, Math.floor(Number(spawnNode.roamingRadiusOverride)))
    : (Number.isFinite(Number(spawnNode.roamingRadius)) ? Math.max(0, Math.floor(Number(spawnNode.roamingRadius))) : null);
  const respawnTicks = Number.isFinite(Number(spawnNode.respawnTicks))
    ? Math.max(1, Math.floor(Number(spawnNode.respawnTicks)))
    : null;
  const facingYaw = Number.isFinite(Number(spawnNode.facingYaw))
    ? Number(spawnNode.facingYaw)
    : undefined;
  const spawnGroupId = normalizeWorldId(
    typeof spawnNode.spawnGroupId === "string"
      ? spawnNode.spawnGroupId
      : (typeof spawnNode.groupId === "string" ? spawnNode.groupId : null)
  ) || null;
  const assistGroupId = normalizeWorldId(
    typeof spawnNode.assistGroupId === "string"
      ? spawnNode.assistGroupId
      : (typeof spawnNode.groupAssistId === "string" ? spawnNode.groupAssistId : null)
  ) || null;
  const assistRadiusOverride = Number.isFinite(Number(spawnNode.assistRadiusOverride))
    ? Math.max(0, Math.floor(Number(spawnNode.assistRadiusOverride)))
    : (Number.isFinite(Number(spawnNode.assistRadius)) ? Math.max(0, Math.floor(Number(spawnNode.assistRadius))) : null);
  const patrolRoute = normalizePatrolRoute(spawnNode.patrolRoute ?? spawnNode.patrolPoints ?? spawnNode.patrol ?? null);

  return {
    spawnNodeId,
    enemyId,
    spawnTile,
    homeTileOverride: normalizePoint3(homeTileOverrideLike),
    roamingRadiusOverride,
    patrolRoute,
    assistGroupId,
    assistRadiusOverride,
    respawnTicks,
    spawnEnabled: spawnNode.spawnEnabled !== false && spawnNode.enabled !== false,
    facingYaw,
    spawnGroupId
  };
}

function normalizeSpawnNodes(spawnNodes: unknown): EnemySpawnNodeDefinition[] {
  if (!Array.isArray(spawnNodes)) return [];
  const seenSpawnNodeIds = new Set<string>();
  const normalizedSpawnNodes: EnemySpawnNodeDefinition[] = [];
  for (let i = 0; i < spawnNodes.length; i++) {
    const spawnNode = normalizeSpawnNode(spawnNodes[i]);
    if (!spawnNode || !spawnNode.spawnEnabled) continue;
    if (seenSpawnNodeIds.has(spawnNode.spawnNodeId)) continue;
    seenSpawnNodeIds.add(spawnNode.spawnNodeId);
    normalizedSpawnNodes.push(spawnNode);
  }
  return normalizedSpawnNodes;
}

function getBootstrapCombatSpawnSource(worldId: string): CombatSpawnSource | null {
  const runtime = window.WorldBootstrapRuntime || null;
  if (!runtime || typeof runtime.getBootstrapResult !== "function") return null;
  const bootstrap = runtime.getBootstrapResult(worldId) as CombatSpawnSource | null;
  if (!bootstrap) return null;

  if (Object.prototype.hasOwnProperty.call(bootstrap, "combatSpawns")) return bootstrap;
  if (bootstrap.definition && Object.prototype.hasOwnProperty.call(bootstrap.definition, "combatSpawns")) return bootstrap.definition;
  if (bootstrap.legacy && Object.prototype.hasOwnProperty.call(bootstrap.legacy, "combatSpawns")) return bootstrap.legacy;
  if (bootstrap.publishedWorldState && Object.prototype.hasOwnProperty.call(bootstrap.publishedWorldState, "combatSpawns")) {
    return bootstrap.publishedWorldState;
  }

  if (typeof runtime.getWorldDefinition === "function") {
    const worldDefinition = runtime.getWorldDefinition(worldId) as CombatSpawnSource | null;
    if (worldDefinition && Object.prototype.hasOwnProperty.call(worldDefinition, "combatSpawns")) return worldDefinition;
  }

  return null;
}

function getWorldCombatSpawnNodes(worldId: string): EnemySpawnNodeDefinition[] {
  const resolvedWorldId = normalizeWorldId(worldId);
  if (!resolvedWorldId) return [];

  const bootstrapSource = getBootstrapCombatSpawnSource(resolvedWorldId);
  if (bootstrapSource) {
    const spawnNodes = normalizeSpawnNodes(bootstrapSource.combatSpawns);
    if (spawnNodes.length > 0 || Array.isArray(bootstrapSource.combatSpawns)) return spawnNodes;
  }

  return normalizeSpawnNodes(listLegacyEnemySpawnNodesForWorld(resolvedWorldId));
}

function listRuntimeCombatProgressionBandWorldSummaries(worldId: string): CombatProgressionBandWorldSummary[] {
  const resolvedWorldId = normalizeWorldId(worldId);
  const summaries = new Map<string, CombatProgressionBandWorldSummary>();
  const progressionBands = listCombatProgressionBands();
  for (let i = 0; i < progressionBands.length; i += 1) {
    const band = progressionBands[i];
    summaries.set(band.bandId, {
      bandId: band.bandId,
      worldId: resolvedWorldId,
      enemyIds: [],
      spawnGroupIds: [],
      spawnCount: 0
    });
  }

  const spawnNodes = getWorldCombatSpawnNodes(resolvedWorldId);
  for (let i = 0; i < spawnNodes.length; i += 1) {
    const spawnNode = spawnNodes[i];
    const band = getCombatProgressionBandForEnemy(spawnNode.enemyId);
    if (!band) continue;
    const summary = summaries.get(band.bandId);
    if (!summary) continue;
    summary.spawnCount += 1;
    if (!summary.enemyIds.includes(spawnNode.enemyId)) summary.enemyIds.push(spawnNode.enemyId);
    if (spawnNode.spawnGroupId && !summary.spawnGroupIds.includes(spawnNode.spawnGroupId)) {
      summary.spawnGroupIds.push(spawnNode.spawnGroupId);
    }
  }

  return progressionBands.map((band) => {
    const summary = summaries.get(band.bandId);
    if (!summary) {
      return {
        bandId: band.bandId,
        worldId: resolvedWorldId,
        enemyIds: [],
        spawnGroupIds: [],
        spawnCount: 0
      };
    }
    return {
      ...summary,
      enemyIds: summary.enemyIds.slice().sort(),
      spawnGroupIds: summary.spawnGroupIds.slice().sort()
    };
  });
}

export function exposeCombatBridge(): void {
  window.CombatRuntime = {
    getSpecVersion: () => COMBAT_SPEC_VERSION,
    getDefaultMeleeStyle: () => DEFAULT_MELEE_STYLE,
    createDefaultPlayerCombatState,
    buildPlayerCombatDefaults,
    computePlayerMaxHitpoints,
    clampPlayerCurrentHitpoints,
    applyPlayerHitpointHealing,
    applyPlayerHitpointDamage,
    buildCombatStatsViewModel,
    computePlayerCombatSnapshot,
    computePlayerMeleeCombatSnapshot,
    computePlayerRangedCombatSnapshot,
    computePlayerMagicCombatSnapshot,
    computeEnemyMeleeCombatSnapshot,
    decrementCooldown,
    rollOpposedHitCheck,
    rollDamage,
    isWithinSquareRange,
    isWithinMeleeRange,
    pickDropEntry,
    listCombatProgressionBands,
    getCombatProgressionBandForEnemy,
    listCombatProgressionBandWorldSummaries: listRuntimeCombatProgressionBandWorldSummaries,
    listEnemyTypes,
    getEnemyTypeDefinition,
    listEnemySpawnNodesForWorld: getWorldCombatSpawnNodes,
    getWorldCombatSpawnNodes,
    createEnemyRuntimeState
  };
}
