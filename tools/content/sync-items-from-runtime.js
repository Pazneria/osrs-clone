const fs = require("fs");
const path = require("path");
const {
  sortKeysDeep,
  loadRuntimeItemCatalog
} = require("./runtime-item-catalog");

function main() {
  const root = path.resolve(__dirname, "..", "..");
  const outPath = path.join(root, "content", "items", "runtime-item-catalog.json");
  const runtime = loadRuntimeItemCatalog(root);
  const sortedItemDefs = sortKeysDeep(runtime.itemDefs);

  const payload = {
    generatedFrom: "src/js/content/item-catalog.js",
    generatedAt: new Date().toISOString(),
    itemDefs: sortedItemDefs
  };

  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n", "utf8");

  console.log(`Synced runtime item catalog mirror to ${path.relative(root, outPath)} (${Object.keys(sortedItemDefs).length} item definitions).`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }
}

