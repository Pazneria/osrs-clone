import type { Point3 } from "../contracts/world";
import type {
  EnemySpawnNodeDefinition,
  EnemyTypeDefinition,
  EnemyRuntimeState,
  MeleeStyleId,
  PlayerCombatStateShape
} from "../contracts/combat";

export const COMBAT_SPEC_VERSION = "2026.03.c1";
export const DEFAULT_MELEE_STYLE: MeleeStyleId = "attack";

function clonePoint3(point: Point3): Point3 {
  return { x: point.x, y: point.y, z: point.z };
}

function cloneEnemyTypeDefinition(definition: EnemyTypeDefinition): EnemyTypeDefinition {
  return {
    ...definition,
    appearance: { ...definition.appearance },
    stats: { ...definition.stats },
    bonuses: { ...definition.bonuses },
    attackProfile: { ...definition.attackProfile },
    behavior: { ...definition.behavior },
    dropTable: definition.dropTable.map((entry) => ({ ...entry }))
  };
}

function cloneSpawnNode(definition: EnemySpawnNodeDefinition): EnemySpawnNodeDefinition {
  return {
    ...definition,
    spawnTile: clonePoint3(definition.spawnTile),
    homeTileOverride: definition.homeTileOverride ? clonePoint3(definition.homeTileOverride) : null
  };
}

const ENEMY_TYPES: Record<string, EnemyTypeDefinition> = {
  enemy_rat: {
    enemyId: "enemy_rat",
    displayName: "Rat",
    combatFamily: "melee",
    appearance: {
      kind: "rat",
      facingYaw: Math.PI
    },
    stats: {
      hitpoints: 4,
      attack: 1,
      strength: 1,
      defense: 1
    },
    bonuses: {
      meleeAccuracyBonus: 0,
      meleeDefenseBonus: 0,
      enemyMaxHit: 1
    },
    attackProfile: {
      styleFamily: "melee",
      damageType: "melee",
      range: 1,
      tickCycle: 5,
      projectile: false,
      ammoUse: false,
      familyTag: "rat"
    },
    behavior: {
      aggroType: "passive",
      aggroRadius: 0,
      chaseRange: 4,
      roamingRadius: 3,
      defaultMovementSpeed: 1,
      combatMovementSpeed: 1
    },
    respawnTicks: 20,
    dropTable: [
      {
        kind: "nothing",
        weight: 100
      }
    ]
  },
  enemy_goblin_grunt: {
    enemyId: "enemy_goblin_grunt",
    displayName: "Goblin Grunt",
    combatFamily: "melee",
    appearance: {
      kind: "humanoid",
      npcType: 3,
      facingYaw: Math.PI
    },
    stats: {
      hitpoints: 8,
      attack: 4,
      strength: 4,
      defense: 3
    },
    bonuses: {
      meleeAccuracyBonus: 2,
      meleeDefenseBonus: 1,
      enemyMaxHit: 2
    },
    attackProfile: {
      styleFamily: "melee",
      damageType: "melee",
      range: 1,
      tickCycle: 5,
      projectile: false,
      ammoUse: false,
      familyTag: "goblin"
    },
    behavior: {
      aggroType: "aggressive",
      aggroRadius: 4,
      chaseRange: 6,
      roamingRadius: 1,
      defaultMovementSpeed: 1,
      combatMovementSpeed: 1
    },
    respawnTicks: 34,
    dropTable: [
      {
        kind: "coins",
        weight: 50,
        minAmount: 2,
        maxAmount: 5
      },
      {
        kind: "item",
        itemId: "bronze_sword",
        weight: 10,
        minAmount: 1,
        maxAmount: 1
      },
      {
        kind: "item",
        itemId: "bronze_axe",
        weight: 8,
        minAmount: 1,
        maxAmount: 1
      },
      {
        kind: "item",
        itemId: "bronze_pickaxe",
        weight: 7,
        minAmount: 1,
        maxAmount: 1
      },
      {
        kind: "nothing",
        weight: 25
      }
    ]
  }
};

const WORLD_ENEMY_SPAWNS: Record<string, EnemySpawnNodeDefinition[]> = {
  starter_town: [
    {
      spawnNodeId: "enemy_spawn_rat_south_field",
      enemyId: "enemy_rat",
      spawnTile: { x: 194, y: 220, z: 0 },
      homeTileOverride: null,
      respawnTicks: 20,
      spawnEnabled: true,
      facingYaw: Math.PI,
      spawnGroupId: "starter_field"
    },
    {
      spawnNodeId: "enemy_spawn_goblin_east_path",
      enemyId: "enemy_goblin_grunt",
      spawnTile: { x: 240, y: 200, z: 0 },
      homeTileOverride: null,
      respawnTicks: 34,
      spawnEnabled: true,
      facingYaw: Math.PI,
      spawnGroupId: "starter_road"
    }
  ]
};

export function createDefaultPlayerCombatState(maxHitpoints = 10): PlayerCombatStateShape {
  const resolvedMaxHitpoints = Number.isFinite(maxHitpoints) ? Math.max(1, Math.floor(maxHitpoints)) : 10;
  return {
    currentHitpoints: resolvedMaxHitpoints,
    eatingCooldownEndTick: 0,
    lastAttackTick: -1,
    lastCastTick: -1,
    remainingAttackCooldown: 0,
    lockedTargetId: null,
    combatTargetKind: null,
    selectedMeleeStyle: DEFAULT_MELEE_STYLE,
    autoRetaliateEnabled: true,
    inCombat: false,
    lastDamagerEnemyId: null
  };
}

export function getEnemyTypeDefinition(enemyId: string): EnemyTypeDefinition | null {
  const definition = ENEMY_TYPES[String(enemyId || "").trim()];
  return definition ? cloneEnemyTypeDefinition(definition) : null;
}

export function listEnemyTypes(): EnemyTypeDefinition[] {
  return Object.keys(ENEMY_TYPES).sort().map((enemyId) => cloneEnemyTypeDefinition(ENEMY_TYPES[enemyId]));
}

export function listEnemySpawnNodesForWorld(worldId: string): EnemySpawnNodeDefinition[] {
  const rows = WORLD_ENEMY_SPAWNS[String(worldId || "").trim()] || [];
  return rows.map(cloneSpawnNode);
}

export function createEnemyRuntimeState(
  spawnNode: EnemySpawnNodeDefinition,
  currentTick = 0
): EnemyRuntimeState {
  const definition = ENEMY_TYPES[spawnNode.enemyId];
  if (!definition) {
    throw new Error(`Unknown enemy type '${spawnNode.enemyId}'`);
  }

  const spawnTile = clonePoint3(spawnNode.spawnTile);
  const homeTile = spawnNode.homeTileOverride ? clonePoint3(spawnNode.homeTileOverride) : clonePoint3(spawnTile);
  return {
    runtimeId: spawnNode.spawnNodeId,
    spawnNodeId: spawnNode.spawnNodeId,
    enemyId: definition.enemyId,
    x: spawnTile.x,
    y: spawnTile.y,
    z: spawnTile.z,
    currentHealth: definition.stats.hitpoints,
    currentState: "idle",
    lockedTargetId: null,
    remainingAttackCooldown: 0,
    resolvedHomeTile: homeTile,
    resolvedSpawnTile: spawnTile,
    resolvedRoamingRadius: definition.behavior.roamingRadius,
    resolvedChaseRange: definition.behavior.chaseRange,
    resolvedAggroRadius: definition.behavior.aggroRadius,
    defaultMovementSpeed: definition.behavior.defaultMovementSpeed,
    combatMovementSpeed: definition.behavior.combatMovementSpeed,
    facingYaw: Number.isFinite(spawnNode.facingYaw)
      ? Number(spawnNode.facingYaw)
      : (Number.isFinite(definition.appearance.facingYaw) ? Number(definition.appearance.facingYaw) : Math.PI),
    respawnAtTick: currentTick > 0 ? currentTick : null,
    lastDamagerId: null,
    attackTriggerAt: 0
  };
}
