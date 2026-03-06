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

function parseTable(input) {
  const entries = input.split(",").map((segment) => segment.trim()).filter(Boolean);
  if (entries.length === 0) {
    throw new Error("Drop table is empty.");
  }

  return entries.map((entry) => {
    const [name, weightRaw] = entry.split(":").map((x) => x.trim());
    const weight = Number(weightRaw);
    if (!name || !Number.isFinite(weight) || weight <= 0) {
      throw new Error(`Invalid table entry: ${entry}`);
    }
    return { name, weight };
  });
}

function weightedPick(table, totalWeight) {
  let roll = Math.random() * totalWeight;
  for (const item of table) {
    roll -= item.weight;
    if (roll <= 0) return item.name;
  }
  return table[table.length - 1].name;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const runs = Number(args.runs ?? 10000);
  const tableSpec = args.table ?? "coins:50,raw_shrimp:30,nothing:20";

  if (!Number.isInteger(runs) || runs <= 0) {
    throw new Error("--runs must be a positive integer.");
  }

  const table = parseTable(tableSpec);
  const totalWeight = table.reduce((sum, entry) => sum + entry.weight, 0);
  const counts = Object.fromEntries(table.map((entry) => [entry.name, 0]));

  for (let i = 0; i < runs; i += 1) {
    const winner = weightedPick(table, totalWeight);
    counts[winner] += 1;
  }

  console.log(`Runs: ${runs}`);
  console.log(`Table: ${tableSpec}`);
  console.log("Result:");
  for (const entry of table) {
    const observed = counts[entry.name] / runs;
    const expected = entry.weight / totalWeight;
    console.log(
      `- ${entry.name}: observed ${(observed * 100).toFixed(2)}% | expected ${(expected * 100).toFixed(2)}%`
    );
  }
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  console.error("Usage: node tools/sim/loot-sim.js --runs 100000 --table \"coins:50,gem:5,nothing:45\"");
  process.exit(1);
}