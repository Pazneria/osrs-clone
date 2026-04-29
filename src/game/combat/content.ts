import type { Point3 } from "../contracts/world";
import type {
  CombatProgressionBandDefinition,
  CombatProgressionBandId,
  CombatProgressionBandWorldSummary,
  EnemySpawnNodeDefinition,
  EnemyTypeDefinition,
  EnemyRuntimeState,
  MeleeStyleId,
  PlayerCombatStateShape
} from "../contracts/combat";
import { buildWorldBootstrapResult } from "../world/bootstrap";

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

type AuthoredCombatWorldDefinition = {
  combatSpawns?: EnemySpawnNodeDefinition[] | null;
};

const COMBAT_PROGRESSION_BAND_ORDER: CombatProgressionBandId[] = [
  "starter_opt_in",
  "starter_roadside",
  "resource_outskirts",
  "guarded_threshold",
  "camp_threat",
  "later_region"
];

const COMBAT_PROGRESSION_BANDS: Record<CombatProgressionBandId, CombatProgressionBandDefinition> = {
  starter_opt_in: {
    bandId: "starter_opt_in",
    displayName: "Starter Opt-In",
    worldStage: "starter",
    routeDepth: 0,
    targetPlayerLevels: { min: 1, max: 3 },
    enemyIds: ["enemy_training_dummy", "enemy_rat", "enemy_chicken"],
    spawnGroupPrefixes: ["starter_training", "starter_field", "starter_outer_rats", "starter_outer_chickens"],
    placementGuidance: [
      "Safe optional targets near starter spaces",
      "No unavoidable aggro on economy or tutorial routes"
    ],
    lootGuidance: [
      "No meaningful coin pressure",
      "Low-value flavor, food, or supply drops only"
    ],
    maxExpectedSellValuePerKill: 2.5
  },
  starter_roadside: {
    bandId: "starter_roadside",
    displayName: "Starter Roadside",
    worldStage: "starter",
    routeDepth: 1,
    targetPlayerLevels: { min: 4, max: 10 },
    enemyIds: ["enemy_goblin_grunt"],
    spawnGroupPrefixes: ["starter_road", "starter_east_field", "starter_far"],
    placementGuidance: [
      "Readable avoidable aggro before the bubble starts",
      "Basic humanoid pressure without blocking town services"
    ],
    lootGuidance: [
      "Small coin drops and bronze ladder pressure",
      "Expected value remains below buying a bronze sword"
    ],
    maxExpectedSellValuePerKill: 7.05
  },
  resource_outskirts: {
    bandId: "resource_outskirts",
    displayName: "Resource Outskirts",
    worldStage: "starter",
    routeDepth: 2,
    targetPlayerLevels: { min: 8, max: 16 },
    enemyIds: ["enemy_boar", "enemy_wolf"],
    spawnGroupPrefixes: ["starter_east_far_boar", "starter_outer_boars", "starter_outer_wolf"],
    placementGuidance: [
      "Combat pressure near richer resource outskirts",
      "Safe bypass space remains visible before resource-route commitment"
    ],
    lootGuidance: [
      "Animal resources should matter more than raw coins",
      "Direct-sale value stays below the humanoid loot bands"
    ],
    maxExpectedSellValuePerKill: 3.4
  },
  guarded_threshold: {
    bandId: "guarded_threshold",
    displayName: "Guarded Threshold",
    worldStage: "mid",
    routeDepth: 3,
    targetPlayerLevels: { min: 15, max: 25 },
    enemyIds: ["enemy_guard"],
    spawnGroupPrefixes: ["starter_east_outpost_guard"],
    placementGuidance: [
      "Deliberate gate or outpost pressure",
      "Leash and spacing should make the danger boundary legible"
    ],
    lootGuidance: [
      "Bronze-to-iron transition drops are allowed",
      "Expected value remains below buying an iron sword"
    ],
    maxExpectedSellValuePerKill: 20.2
  },
  camp_threat: {
    bandId: "camp_threat",
    displayName: "Camp Threat",
    worldStage: "mid",
    routeDepth: 4,
    targetPlayerLevels: { min: 20, max: 35 },
    enemyIds: ["enemy_bear", "enemy_fast_striker", "enemy_heavy_brute"],
    spawnGroupPrefixes: ["camp", "ruin", "outpost_camp"],
    placementGuidance: [
      "Clustered danger pockets, ruins, or optional camps",
      "Single-pull edges should exist until assist behavior is authored"
    ],
    lootGuidance: [
      "Higher first-pass value with iron-biased drops",
      "Still bounded below full iron weapon purchase cost"
    ],
    maxExpectedSellValuePerKill: 26.15
  },
  later_region: {
    bandId: "later_region",
    displayName: "Later Region Anchor",
    worldStage: "later",
    routeDepth: 5,
    targetPlayerLevels: { min: 35, max: null },
    enemyIds: [],
    spawnGroupPrefixes: ["later", "named", "gatekeeper"],
    placementGuidance: [
      "Named anchors, denser ecosystems, and later-region objectives",
      "Requires authored region context before adding live templates"
    ],
    lootGuidance: [
      "Unique or regional drop identity only after the base bands hold",
      "No live table until a later-region encounter spec exists"
    ],
    maxExpectedSellValuePerKill: null
  }
};

const ENEMY_PROGRESSION_BAND_IDS = COMBAT_PROGRESSION_BAND_ORDER.reduce<Record<string, CombatProgressionBandId>>(
  (lookup, bandId) => {
    const band = COMBAT_PROGRESSION_BANDS[bandId];
    for (let i = 0; i < band.enemyIds.length; i += 1) {
      lookup[band.enemyIds[i]] = bandId;
    }
    return lookup;
  },
  {}
);

function cloneCombatProgressionBand(definition: CombatProgressionBandDefinition): CombatProgressionBandDefinition {
  return {
    ...definition,
    targetPlayerLevels: { ...definition.targetPlayerLevels },
    enemyIds: definition.enemyIds.slice(),
    spawnGroupPrefixes: definition.spawnGroupPrefixes.slice(),
    placementGuidance: definition.placementGuidance.slice(),
    lootGuidance: definition.lootGuidance.slice()
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
        kind: "item",
        itemId: "rat_tail",
        weight: 35,
        minAmount: 1,
        maxAmount: 1
      },
      {
        kind: "nothing",
        weight: 65
      }
    ]
  },
  enemy_chicken: {
    enemyId: "enemy_chicken",
    displayName: "Chicken",
    combatFamily: "melee",
    appearance: {
      kind: "chicken",
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
      {
        kind: "item",
        itemId: "raw_chicken",
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
      facingYaw: Math.PI,
      modelPresetId: "goblin",
      animationSetId: "goblin_basic"
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
        weight: 45,
        minAmount: 2,
        maxAmount: 5
      },
      {
        kind: "item",
        itemId: "goblin_club",
        weight: 12,
        minAmount: 1,
        maxAmount: 1
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
        weight: 18
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
        itemId: "raw_boar_meat",
        weight: 60,
        minAmount: 1,
        maxAmount: 1
      },
      {
        kind: "item",
        itemId: "boar_tusk",
        weight: 20,
        minAmount: 1,
        maxAmount: 1
      },
      {
        kind: "nothing",
        weight: 20
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
        itemId: "raw_wolf_meat",
        weight: 55,
        minAmount: 1,
        maxAmount: 1
      },
      {
        kind: "item",
        itemId: "wolf_fang",
        weight: 20,
        minAmount: 1,
        maxAmount: 1
      },
      {
        kind: "nothing",
        weight: 25
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
      facingYaw: Math.PI,
      modelPresetId: "guard",
      animationSetId: "guard_basic"
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
        weight: 40,
        minAmount: 5,
        maxAmount: 10
      },
      {
        kind: "item",
        itemId: "guard_spear",
        weight: 8,
        minAmount: 1,
        maxAmount: 1
      },
      {
        kind: "item",
        itemId: "guard_crest",
        weight: 5,
        minAmount: 1,
        maxAmount: 1
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
        weight: 10,
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
        weight: 4
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
  },
  enemy_training_dummy: {
    enemyId: "enemy_training_dummy",
    displayName: "Training Dummy",
    combatFamily: "melee",
    appearance: {
      kind: "humanoid",
      npcType: 2,
      facingYaw: Math.PI
    },
    stats: {
      hitpoints: 250,
      attack: 1,
      strength: 1,
      defense: 0
    },
    bonuses: {
      meleeAccuracyBonus: 0,
      meleeDefenseBonus: 0,
      enemyMaxHit: 0
    },
    attackProfile: {
      styleFamily: "melee",
      damageType: "melee",
      range: 1,
      tickCycle: 4,
      projectile: false,
      ammoUse: false,
      familyTag: "training_dummy"
    },
    behavior: {
      aggroType: "passive",
      aggroRadius: 0,
      chaseRange: 2,
      roamingRadius: 0,
      defaultMovementSpeed: 1,
      combatMovementSpeed: 1
    },
    respawnTicks: 8,
    dropTable: [
      {
        kind: "nothing",
        weight: 100
      }
    ]
  }
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

export function listCombatProgressionBands(): CombatProgressionBandDefinition[] {
  return COMBAT_PROGRESSION_BAND_ORDER.map((bandId) => cloneCombatProgressionBand(COMBAT_PROGRESSION_BANDS[bandId]));
}

export function getCombatProgressionBandForEnemy(enemyId: string): CombatProgressionBandDefinition | null {
  const bandId = ENEMY_PROGRESSION_BAND_IDS[String(enemyId || "").trim()];
  return bandId ? cloneCombatProgressionBand(COMBAT_PROGRESSION_BANDS[bandId]) : null;
}

export function listCombatProgressionBandWorldSummaries(worldId: string): CombatProgressionBandWorldSummary[] {
  const resolvedWorldId = String(worldId || "").trim();
  const summaries = new Map<CombatProgressionBandId, CombatProgressionBandWorldSummary>();
  for (let i = 0; i < COMBAT_PROGRESSION_BAND_ORDER.length; i += 1) {
    const bandId = COMBAT_PROGRESSION_BAND_ORDER[i];
    summaries.set(bandId, {
      bandId,
      worldId: resolvedWorldId,
      enemyIds: [],
      spawnGroupIds: [],
      spawnCount: 0
    });
  }

  const spawns = listEnemySpawnNodesForWorld(resolvedWorldId);
  for (let i = 0; i < spawns.length; i += 1) {
    const spawn = spawns[i];
    const bandId = ENEMY_PROGRESSION_BAND_IDS[spawn.enemyId];
    if (!bandId) continue;
    const summary = summaries.get(bandId);
    if (!summary) continue;
    summary.spawnCount += 1;
    if (!summary.enemyIds.includes(spawn.enemyId)) summary.enemyIds.push(spawn.enemyId);
    const spawnGroupId = String(spawn.spawnGroupId || "").trim();
    if (spawnGroupId && !summary.spawnGroupIds.includes(spawnGroupId)) summary.spawnGroupIds.push(spawnGroupId);
  }

  return COMBAT_PROGRESSION_BAND_ORDER.map((bandId) => {
    const summary = summaries.get(bandId);
    if (!summary) {
      return {
        bandId,
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

export function listEnemySpawnNodesForWorld(worldId: string): EnemySpawnNodeDefinition[] {
  try {
    const bootstrap = buildWorldBootstrapResult(String(worldId || "").trim());
    const definition = bootstrap.definition as AuthoredCombatWorldDefinition;
    const rows = Array.isArray(definition.combatSpawns) ? definition.combatSpawns : [];
    return rows.map(cloneSpawnNode);
  } catch {
    return [];
  }
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
    attackTriggerAt: 0,
    hitReactionTriggerAt: 0
  };
}
