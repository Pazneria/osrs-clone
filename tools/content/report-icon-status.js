const {
  getAssetUsageById,
  getIconStatusPath,
  readIconStatusManifest
} = require("./icon-status-manifest");
const { loadRuntimeItemCatalog } = require("./runtime-item-catalog");
const path = require("path");

function parseArgs(argv) {
  let limit = 25;
  let showAll = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--all") {
      showAll = true;
      continue;
    }
    if (arg === "--limit") {
      const rawValue = argv[index + 1];
      const parsed = Number.parseInt(rawValue, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`Invalid --limit value '${rawValue}'`);
      }
      limit = parsed;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument '${arg}'`);
  }

  return { limit, showAll };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = path.resolve(__dirname, "..", "..");
  const iconStatusPath = getIconStatusPath(projectRoot);
  const manifest = readIconStatusManifest(projectRoot);

  if (!manifest || !manifest.items) {
    throw new Error(`Missing icon status manifest at ${path.relative(projectRoot, iconStatusPath)}. Run 'npm.cmd run tool:items:sync'.`);
  }

  const runtime = loadRuntimeItemCatalog(projectRoot);
  const assetUsageById = getAssetUsageById(runtime.itemDefs);
  const entries = Object.entries(manifest.items).map(([itemId, entry]) => ({
    itemId,
    status: entry.status,
    assetId: entry.assetId,
    treatment: entry.treatment,
    notes: entry.notes || "",
    sharedCount: assetUsageById[entry.assetId] || 0
  }));

  const counts = entries.reduce(
    (summary, entry) => {
      summary.total += 1;
      summary[entry.status] += 1;
      if (entry.status === "done") {
        summary[`done_${entry.treatment}`] += 1;
      } else {
        summary[`todo_${entry.treatment}`] += 1;
      }
      return summary;
    },
    {
      total: 0,
      done: 0,
      todo: 0,
      done_bespoke: 0,
      done_shared: 0,
      todo_bespoke: 0,
      todo_shared: 0
    }
  );

  console.log(`Icon status manifest: ${path.relative(projectRoot, iconStatusPath)}`);
  console.log(
    `Items: ${counts.total} total | ${counts.done} done (${counts.done_bespoke} bespoke, ${counts.done_shared} shared) | ${counts.todo} todo (${counts.todo_bespoke} bespoke, ${counts.todo_shared} shared)`
  );

  const unfinished = entries
    .filter((entry) => entry.status === "todo")
    .sort((left, right) => {
      if (left.treatment !== right.treatment) {
        return left.treatment === "shared" ? -1 : 1;
      }
      if (left.sharedCount !== right.sharedCount) {
        return right.sharedCount - left.sharedCount;
      }
      return left.itemId.localeCompare(right.itemId);
    });

  if (unfinished.length === 0) {
    console.log("No unfinished icons.");
    return;
  }

  const shown = args.showAll ? unfinished : unfinished.slice(0, args.limit);
  console.log("");
  console.log(args.showAll ? "Unfinished icons:" : `Top ${shown.length} unfinished icons:`);
  for (const entry of shown) {
    const usageLabel = entry.treatment === "shared" ? `shared x${entry.sharedCount}` : "bespoke";
    const notesSuffix = entry.notes ? ` | ${entry.notes}` : "";
    console.log(`- ${entry.itemId} -> ${entry.assetId} [${usageLabel}]${notesSuffix}`);
  }

  if (!args.showAll && unfinished.length > shown.length) {
    console.log("");
    console.log(`...and ${unfinished.length - shown.length} more. Re-run with '--all' or '--limit <n>' to see more.`);
  }
}

try {
  main();
} catch (error) {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
}
