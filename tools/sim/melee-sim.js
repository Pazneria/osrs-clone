const path = require("path");

const { loadRuntimeItemCatalog } = require("../content/runtime-item-catalog");
const { loadTsModule } = require("../lib/ts-module-loader");

function printUsage() {
  console.error([
    "Usage: node tools/sim/melee-sim.js --enemy enemy_goblin_grunt --weapon bronze_sword --runs 1000",
    "",
    "Options:",
    "  --enemy <id>       Enemy type ID from src/game/combat/content.ts",
    "  --weapon <id>      Weapon item ID from src/js/content/item-catalog.js, or unarmed",
    "  --style <id>       attack, strength, or defense",
    "  --attack <level>   Player Attack level",
    "  --strength <level> Player Strength level",
    "  --defense <level>  Player Defense level",
    "  --hitpoints <lvl>  Player Hitpoints level/current HP",
    "  --runs <count>     Number of fights to simulate",
    "  --seed <value>     Deterministic seed",
    "  --json             Print JSON instead of a text summary"
  ].join("\n"));
}

function parseArgs(argv) {
  const options = {
    enemy: "enemy_goblin_grunt",
    weapon: "bronze_sword",
    style: "attack",
    attack: 10,
    strength: 10,
    defense: 10,
    hitpoints: 10,
    runs: 1000,
    seed: "1",
    maxTicks: 600,
    json: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const key = arg.slice(2);
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Missing value for ${arg}`);
    }
    index += 1;

    if (["attack", "strength", "defense", "hitpoints", "runs", "maxTicks"].includes(key)) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) throw new Error(`Invalid numeric value for ${arg}: ${value}`);
      options[key] = Math.floor(numeric);
    } else if (["enemy", "weapon", "style", "seed"].includes(key)) {
      options[key] = value;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function normalizePositiveInt(value, fallback) {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : fallback;
}

function createSeededRandom(seedValue) {
  const text = String(seedValue || "1");
  let state = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    state ^= text.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }
  if (state === 0) state = 1;

  return function nextRandom() {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function buildPlayerSkills(options) {
  return {
    attack: { xp: 0, level: normalizePositiveInt(options.attack, 1) },
    strength: { xp: 0, level: normalizePositiveInt(options.strength, 1) },
    defense: { xp: 0, level: normalizePositiveInt(options.defense, 1) },
    hitpoints: { xp: 0, level: normalizePositiveInt(options.hitpoints, 10) }
  };
}

function buildEquipment(itemDefs, weaponId) {
  if (!weaponId || weaponId === "unarmed") return {};
  const item = itemDefs[weaponId];
  if (!item) throw new Error(`Unknown weapon item: ${weaponId}`);
  if (!item.combat || !item.combat.attackProfile) {
    throw new Error(`Item is not combat-ready: ${weaponId}`);
  }
  return { weapon: item };
}

function simulateFight(config) {
  const {
    combatFormulas,
    enemyType,
    playerSnapshot,
    enemySnapshot,
    playerMaxHitpoints,
    rng,
    maxTicks
  } = config;

  let playerHp = playerMaxHitpoints;
  let enemyHp = Math.max(1, Math.floor(enemyType.stats.hitpoints));
  let playerCooldown = 0;
  let enemyCooldown = 0;
  let playerDamage = 0;
  let enemyDamage = 0;
  let playerSwings = 0;
  let enemySwings = 0;

  for (let tick = 0; tick < maxTicks; tick += 1) {
    if (playerCooldown <= 0) {
      playerSwings += 1;
      const hit = combatFormulas.rollOpposedHitCheck(playerSnapshot.attackValue, enemySnapshot.defenseValue, rng);
      const damage = hit ? Math.min(enemyHp, combatFormulas.rollDamage(playerSnapshot.maxHit, rng)) : 0;
      enemyHp -= damage;
      playerDamage += damage;
      playerCooldown = playerSnapshot.attackTickCycle;
    }

    if (enemyHp <= 0) {
      return {
        winner: "player",
        ticks: tick + 1,
        playerDamage,
        enemyDamage,
        playerSwings,
        enemySwings,
        playerHpRemaining: playerHp,
        enemyHpRemaining: 0
      };
    }

    if (enemyCooldown <= 0) {
      enemySwings += 1;
      const hit = combatFormulas.rollOpposedHitCheck(enemySnapshot.attackValue, playerSnapshot.defenseValue, rng);
      const damage = hit ? Math.min(playerHp, combatFormulas.rollDamage(enemySnapshot.maxHit, rng)) : 0;
      playerHp -= damage;
      enemyDamage += damage;
      enemyCooldown = enemySnapshot.attackTickCycle;
    }

    if (playerHp <= 0) {
      return {
        winner: "enemy",
        ticks: tick + 1,
        playerDamage,
        enemyDamage,
        playerSwings,
        enemySwings,
        playerHpRemaining: 0,
        enemyHpRemaining: enemyHp
      };
    }

    playerCooldown = combatFormulas.decrementCooldown(playerCooldown);
    enemyCooldown = combatFormulas.decrementCooldown(enemyCooldown);
  }

  return {
    winner: "draw",
    ticks: maxTicks,
    playerDamage,
    enemyDamage,
    playerSwings,
    enemySwings,
    playerHpRemaining: playerHp,
    enemyHpRemaining: enemyHp
  };
}

function round(value) {
  return Math.round(value * 10000) / 10000;
}

function summarizeResults(results) {
  const total = results.length || 1;
  const summary = {
    playerWins: 0,
    enemyWins: 0,
    draws: 0,
    averageTicks: 0,
    averagePlayerDamage: 0,
    averageEnemyDamage: 0,
    averagePlayerSwings: 0,
    averageEnemySwings: 0
  };

  for (let index = 0; index < results.length; index += 1) {
    const result = results[index];
    if (result.winner === "player") summary.playerWins += 1;
    else if (result.winner === "enemy") summary.enemyWins += 1;
    else summary.draws += 1;
    summary.averageTicks += result.ticks;
    summary.averagePlayerDamage += result.playerDamage;
    summary.averageEnemyDamage += result.enemyDamage;
    summary.averagePlayerSwings += result.playerSwings;
    summary.averageEnemySwings += result.enemySwings;
  }

  summary.playerWinRate = round(summary.playerWins / total);
  summary.enemyWinRate = round(summary.enemyWins / total);
  summary.drawRate = round(summary.draws / total);
  summary.averageTicks = round(summary.averageTicks / total);
  summary.averagePlayerDamage = round(summary.averagePlayerDamage / total);
  summary.averageEnemyDamage = round(summary.averageEnemyDamage / total);
  summary.averagePlayerSwings = round(summary.averagePlayerSwings / total);
  summary.averageEnemySwings = round(summary.averageEnemySwings / total);
  return summary;
}

function runSimulation(options) {
  const root = path.resolve(__dirname, "..", "..");
  const combatContent = loadTsModule(path.join(root, "src", "game", "combat", "content.ts"));
  const combatFormulas = loadTsModule(path.join(root, "src", "game", "combat", "formulas.ts"));
  const { itemDefs } = loadRuntimeItemCatalog(root);
  const playerSkills = buildPlayerSkills(options);
  const equipment = buildEquipment(itemDefs, options.weapon);
  const playerState = { selectedMeleeStyle: options.style };
  const playerSnapshot = combatFormulas.computePlayerMeleeCombatSnapshot({
    playerSkills,
    equipment,
    playerState
  });
  if (!playerSnapshot.canAttack) {
    throw new Error(`Player Attack level ${playerSkills.attack.level} cannot use ${options.weapon}`);
  }

  const enemyType = combatContent.getEnemyTypeDefinition(options.enemy);
  if (!enemyType) throw new Error(`Unknown enemy type: ${options.enemy}`);
  const enemySnapshot = combatFormulas.computeEnemyMeleeCombatSnapshot(enemyType);
  const playerMaxHitpoints = combatFormulas.computePlayerMaxHitpoints(playerSkills);
  const rng = createSeededRandom(options.seed);
  const runs = normalizePositiveInt(options.runs, 1000);
  const maxTicks = normalizePositiveInt(options.maxTicks, 600);
  const results = [];

  for (let index = 0; index < runs; index += 1) {
    results.push(simulateFight({
      combatFormulas,
      enemyType,
      playerSnapshot,
      enemySnapshot,
      playerMaxHitpoints,
      rng,
      maxTicks
    }));
  }

  return {
    simulator: "canonical_melee_v1",
    combatSpecVersion: combatContent.COMBAT_SPEC_VERSION,
    seed: String(options.seed),
    runs,
    maxTicks,
    player: {
      levels: {
        attack: playerSkills.attack.level,
        strength: playerSkills.strength.level,
        defense: playerSkills.defense.level,
        hitpoints: playerSkills.hitpoints.level
      },
      weaponId: options.weapon || "unarmed",
      styleId: playerSnapshot.styleId,
      snapshot: playerSnapshot
    },
    enemy: {
      enemyId: enemyType.enemyId,
      displayName: enemyType.displayName,
      snapshot: enemySnapshot
    },
    results: summarizeResults(results)
  };
}

function printText(summary) {
  console.log(`Combat simulator: ${summary.simulator} (${summary.combatSpecVersion})`);
  console.log(`Player: ${summary.player.weaponId}, ${summary.player.styleId}, Atk ${summary.player.levels.attack} / Str ${summary.player.levels.strength} / Def ${summary.player.levels.defense} / HP ${summary.player.levels.hitpoints}`);
  console.log(`Enemy: ${summary.enemy.displayName} (${summary.enemy.enemyId})`);
  console.log(`Runs: ${summary.runs}, seed: ${summary.seed}, max ticks: ${summary.maxTicks}`);
  console.log(`Win rate: player ${summary.results.playerWinRate}, enemy ${summary.results.enemyWinRate}, draw ${summary.results.drawRate}`);
  console.log(`Averages: ${summary.results.averageTicks} ticks, ${summary.results.averagePlayerDamage} damage dealt, ${summary.results.averageEnemyDamage} damage taken`);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }
  const summary = runSimulation(options);
  if (options.json) console.log(JSON.stringify(summary, null, 2));
  else printText(summary);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    printUsage();
    process.exit(1);
  }
}

module.exports = {
  runSimulation
};
