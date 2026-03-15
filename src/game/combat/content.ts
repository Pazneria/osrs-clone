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
    homeTileOverride: definition.homeTileOverride ? clonePoint3(definition.homeTileOverride) : null,
    roamingRadiusOverride: Number.isFinite(definition.roamingRadiusOverride)
      ? Math.max(0, Math.floor(Number(definition.roamingRadiusOverride)))
      : null
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
  enemy_chicken: {
    enemyId: "enemy_chicken",
    displayName: "Chicken",
    combatFamily: "melee",
    appearance: {
      kind: "rat",
      facingYaw: Math.PI
    },
    stats: {
      hitpoints: 3,
      attack: 1,
      strength: 1,
      defense: 0
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
      familyTag: "chicken"
    },
    behavior: {
      aggroType: "passive",
      aggroRadius: 0,
      chaseRange: 3,
      roamingRadius: 4,
      defaultMovementSpeed: 1,
      combatMovementSpeed: 1
    },
    respawnTicks: 20,
    dropTable: [
      // TODO(COMBAT-007): replace shared raw_shrimp placeholders with dedicated raw_chicken/raw_meat drops once those item IDs exist.
      {
        kind: "item",
        itemId: "raw_shrimp",
        weight: 55,
        minAmount: 1,
        maxAmount: 1
      },
      {
        kind: "item",
        itemId: "feathers_bundle",
        weight: 35,
        minAmount: 1,
        maxAmount: 1
      },
      {
        kind: "nothing",
        weight: 10
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
  },
  enemy_boar: {
    enemyId: "enemy_boar",
    displayName: "Boar",
    combatFamily: "melee",
    appearance: {
      kind: "rat",
      facingYaw: Math.PI
    },
    stats: {
      hitpoints: 7,
      attack: 5,
      strength: 5,
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
      familyTag: "boar"
    },
    behavior: {
      aggroType: "aggressive",
      aggroRadius: 4,
      chaseRange: 5,
      roamingRadius: 2,
      defaultMovementSpeed: 1,
      combatMovementSpeed: 1
    },
    respawnTicks: 30,
    dropTable: [
      {
        kind: "item",
        itemId: "raw_shrimp",
        weight: 55,
        minAmount: 1,
        maxAmount: 1
      },
      {
        kind: "item",
        itemId: "normal_leather",
        weight: 30,
        minAmount: 1,
        maxAmount: 1
      },
      {
        kind: "nothing",
        weight: 15
      }
    ]
  },
  enemy_wolf: {
    enemyId: "enemy_wolf",
    displayName: "Wolf",
    combatFamily: "melee",
    appearance: {
      kind: "rat",
      facingYaw: Math.PI
    },
    stats: {
      hitpoints: 10,
      attack: 8,
      strength: 7,
      defense: 4
    },
    bonuses: {
      meleeAccuracyBonus: 4,
      meleeDefenseBonus: 1,
      enemyMaxHit: 3
    },
    attackProfile: {
      styleFamily: "melee",
      damageType: "melee",
      range: 1,
      tickCycle: 4,
      projectile: false,
      ammoUse: false,
      familyTag: "wolf"
    },
    behavior: {
      aggroType: "aggressive",
      aggroRadius: 5,
      chaseRange: 7,
      roamingRadius: 3,
      defaultMovementSpeed: 1,
      combatMovementSpeed: 1
    },
    respawnTicks: 30,
    dropTable: [
      {
        kind: "item",
        itemId: "raw_shrimp",
        weight: 45,
        minAmount: 1,
        maxAmount: 1
      },
      {
        kind: "item",
        itemId: "wolf_leather",
        weight: 40,
        minAmount: 1,
        maxAmount: 1
      },
      {
        kind: "nothing",
        weight: 15
      }
    ]
  },
  enemy_guard: {
    enemyId: "enemy_guard",
    displayName: "Guard",
    combatFamily: "melee",
    appearance: {
      kind: "humanoid",
      npcType: 2,
      facingYaw: Math.PI
    },
    stats: {
      hitpoints: 14,
      attack: 8,
      strength: 8,
      defense: 8
    },
    bonuses: {
      meleeAccuracyBonus: 4,
      meleeDefenseBonus: 4,
      enemyMaxHit: 3
    },
    attackProfile: {
      styleFamily: "melee",
      damageType: "melee",
      range: 1,
      tickCycle: 5,
      projectile: false,
      ammoUse: false,
      familyTag: "guard"
    },
    behavior: {
      aggroType: "aggressive",
      aggroRadius: 5,
      chaseRange: 7,
      roamingRadius: 0,
      defaultMovementSpeed: 1,
      combatMovementSpeed: 1
    },
    respawnTicks: 42,
    dropTable: [
      {
        kind: "coins",
        weight: 45,
        minAmount: 5,
        maxAmount: 10
      },
      {
        kind: "item",
        itemId: "bronze_sword",
        weight: 12,
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
        weight: 5,
        minAmount: 1,
        maxAmount: 1
      },
      {
        kind: "item",
        itemId: "iron_sword",
        weight: 10,
        minAmount: 1,
        maxAmount: 1
      },
      {
        kind: "item",
        itemId: "iron_axe",
        weight: 5,
        minAmount: 1,
        maxAmount: 1
      },
      {
        kind: "item",
        itemId: "iron_pickaxe",
        weight: 3,
        minAmount: 1,
        maxAmount: 1
      },
      {
        kind: "nothing",
        weight: 12
      }
    ]
  },
  enemy_bear: {
    enemyId: "enemy_bear",
    displayName: "Bear",
    combatFamily: "melee",
    appearance: {
      kind: "rat",
      facingYaw: Math.PI
    },
    stats: {
      hitpoints: 20,
      attack: 9,
      strength: 11,
      defense: 10
    },
    bonuses: {
      meleeAccuracyBonus: 3,
      meleeDefenseBonus: 5,
      enemyMaxHit: 5
    },
    attackProfile: {
      styleFamily: "melee",
      damageType: "melee",
      range: 1,
      tickCycle: 6,
      projectile: false,
      ammoUse: false,
      familyTag: "bear"
    },
    behavior: {
      aggroType: "aggressive",
      aggroRadius: 4,
      chaseRange: 6,
      roamingRadius: 2,
      defaultMovementSpeed: 1,
      combatMovementSpeed: 1
    },
    respawnTicks: 50,
    dropTable: [
      {
        kind: "item",
        itemId: "raw_shrimp",
        weight: 50,
        minAmount: 1,
        maxAmount: 1
      },
      {
        kind: "item",
        itemId: "bear_leather",
        weight: 35,
        minAmount: 1,
        maxAmount: 1
      },
      {
        kind: "nothing",
        weight: 15
      }
    ]
  },
  enemy_heavy_brute: {
    enemyId: "enemy_heavy_brute",
    displayName: "Heavy Brute",
    combatFamily: "melee",
    appearance: {
      kind: "humanoid",
      npcType: 1,
      facingYaw: Math.PI
    },
    stats: {
      hitpoints: 22,
      attack: 10,
      strength: 12,
      defense: 12
    },
    bonuses: {
      meleeAccuracyBonus: 4,
      meleeDefenseBonus: 6,
      enemyMaxHit: 5
    },
    attackProfile: {
      styleFamily: "melee",
      damageType: "melee",
      range: 1,
      tickCycle: 6,
      projectile: false,
      ammoUse: false,
      familyTag: "heavy_brute"
    },
    behavior: {
      aggroType: "aggressive",
      aggroRadius: 4,
      chaseRange: 6,
      roamingRadius: 1,
      defaultMovementSpeed: 1,
      combatMovementSpeed: 1
    },
    respawnTicks: 50,
    dropTable: [
      {
        kind: "coins",
        weight: 50,
        minAmount: 8,
        maxAmount: 15
      },
      {
        kind: "item",
        itemId: "iron_sword",
        weight: 16,
        minAmount: 1,
        maxAmount: 1
      },
      {
        kind: "item",
        itemId: "iron_axe",
        weight: 10,
        minAmount: 1,
        maxAmount: 1
      },
      {
        kind: "item",
        itemId: "iron_pickaxe",
        weight: 8,
        minAmount: 1,
        maxAmount: 1
      },
      {
        kind: "nothing",
        weight: 16
      }
    ]
  },
  enemy_fast_striker: {
    enemyId: "enemy_fast_striker",
    displayName: "Fast Striker",
    combatFamily: "melee",
    appearance: {
      kind: "humanoid",
      npcType: 3,
      facingYaw: Math.PI
    },
    stats: {
      hitpoints: 12,
      attack: 12,
      strength: 9,
      defense: 5
    },
    bonuses: {
      meleeAccuracyBonus: 6,
      meleeDefenseBonus: 1,
      enemyMaxHit: 4
    },
    attackProfile: {
      styleFamily: "melee",
      damageType: "melee",
      range: 1,
      tickCycle: 4,
      projectile: false,
      ammoUse: false,
      familyTag: "fast_striker"
    },
    behavior: {
      aggroType: "aggressive",
      aggroRadius: 5,
      chaseRange: 7,
      roamingRadius: 2,
      defaultMovementSpeed: 1,
      combatMovementSpeed: 1
    },
    respawnTicks: 40,
    dropTable: [
      {
        kind: "coins",
        weight: 45,
        minAmount: 4,
        maxAmount: 8
      },
      {
        kind: "item",
        itemId: "iron_sword",
        weight: 18,
        minAmount: 1,
        maxAmount: 1
      },
      {
        kind: "item",
        itemId: "iron_axe",
        weight: 8,
        minAmount: 1,
        maxAmount: 1
      },
      {
        kind: "item",
        itemId: "iron_pickaxe",
        weight: 6,
        minAmount: 1,
        maxAmount: 1
      },
      {
        kind: "nothing",
        weight: 23
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
      roamingRadiusOverride: 15,
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
      roamingRadiusOverride: 15,
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
  const resolvedRoamingRadius = Number.isFinite(spawnNode.roamingRadiusOverride)
    ? Math.max(0, Math.floor(Number(spawnNode.roamingRadiusOverride)))
    : definition.behavior.roamingRadius;
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
    resolvedRoamingRadius,
    resolvedChaseRange: Math.max(definition.behavior.chaseRange, resolvedRoamingRadius + 2),
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
