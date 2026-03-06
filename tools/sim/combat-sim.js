function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : "true";
    args[key] = value;
    if (value !== "true") i += 1;
  }
  return args;
}

function toInt(value, fallback) {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid number: ${value}`);
  }
  return Math.floor(parsed);
}

function calcMaxHit(strLevel, strBonus) {
  const effectiveStrength = strLevel + 8;
  return Math.floor(0.5 + (effectiveStrength * (strBonus + 64)) / 640);
}

function calcHitChance(atkLevel, atkBonus, defLevel, defBonus) {
  const attackRoll = (atkLevel + 8) * (atkBonus + 64);
  const defenceRoll = (defLevel + 8) * (defBonus + 64);

  if (attackRoll > defenceRoll) {
    return 1 - (defenceRoll + 2) / (2 * (attackRoll + 1));
  }
  return attackRoll / (2 * (defenceRoll + 1));
}

function simulateFight({ hp, maxHit, hitChance, attackSpeedTicks }) {
  let remainingHp = hp;
  let attacks = 0;

  while (remainingHp > 0) {
    attacks += 1;
    if (Math.random() < hitChance) {
      const damage = Math.floor(Math.random() * (maxHit + 1));
      remainingHp -= damage;
    }
  }

  const ticks = attacks * attackSpeedTicks;
  return { ticks, attacks };
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  const runs = toInt(args.runs, 5000);
  const strLevel = toInt(args.strLevel, 70);
  const atkLevel = toInt(args.atkLevel, 70);
  const strBonus = toInt(args.strBonus, 65);
  const atkBonus = toInt(args.atkBonus, 75);
  const defLevel = toInt(args.defLevel, 60);
  const defBonus = toInt(args.defBonus, 70);
  const targetHp = toInt(args.targetHp, 60);
  const attackSpeedTicks = toInt(args.attackSpeedTicks, 4);

  if (runs <= 0 || targetHp <= 0 || attackSpeedTicks <= 0) {
    throw new Error("runs, targetHp, and attackSpeedTicks must be positive integers.");
  }

  const maxHit = calcMaxHit(strLevel, strBonus);
  const hitChance = Math.max(0, Math.min(1, calcHitChance(atkLevel, atkBonus, defLevel, defBonus)));

  let totalTicks = 0;
  let totalAttacks = 0;

  for (let i = 0; i < runs; i += 1) {
    const result = simulateFight({
      hp: targetHp,
      maxHit,
      hitChance,
      attackSpeedTicks
    });
    totalTicks += result.ticks;
    totalAttacks += result.attacks;
  }

  const avgTicks = totalTicks / runs;
  const avgSeconds = avgTicks * 0.6;
  const avgAttacks = totalAttacks / runs;
  const avgDps = targetHp / avgSeconds;

  console.log("Combat simulation summary:");
  console.log(`- Runs: ${runs}`);
  console.log(`- Hit chance: ${(hitChance * 100).toFixed(2)}%`);
  console.log(`- Max hit: ${maxHit}`);
  console.log(`- Avg attacks to kill: ${avgAttacks.toFixed(2)}`);
  console.log(`- Avg time to kill: ${avgSeconds.toFixed(2)}s (${avgTicks.toFixed(2)} ticks)`);
  console.log(`- Avg DPS: ${avgDps.toFixed(2)}`);
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  console.error(
    "Usage: node tools/sim/combat-sim.js --runs 10000 --strLevel 70 --atkLevel 70 --targetHp 60 --attackSpeedTicks 4"
  );
  process.exit(1);
}