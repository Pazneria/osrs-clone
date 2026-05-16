const path = require("path");
const { sortKeysDeep } = require("./object-utils");
const { writeJsonFile } = require("../lib/json-file-utils");
const { loadRuntimeItemCatalog } = require("./runtime-item-catalog");
const {
  buildIconStatusManifest,
  getIconStatusPath,
  readIconStatusManifest
} = require("./icon-status-manifest");

function main() {
  const root = path.resolve(__dirname, "..", "..");
  const outPath = path.join(root, "content", "items", "runtime-item-catalog.json");
  const iconStatusPath = getIconStatusPath(root);
  const runtime = loadRuntimeItemCatalog(root);
  const sortedItemDefs = sortKeysDeep(runtime.itemDefs);
  const existingIconStatus = readIconStatusManifest(root);

  const payload = {
    generatedFrom: "src/js/content/item-catalog.js",
    generatedAt: new Date().toISOString(),
    itemDefs: sortedItemDefs
  };
  const iconStatusPayload = buildIconStatusManifest(runtime.itemDefs, existingIconStatus);

  writeJsonFile(outPath, payload);
  writeJsonFile(iconStatusPath, iconStatusPayload);

  console.log(`Synced runtime item catalog mirror to ${path.relative(root, outPath)} (${Object.keys(sortedItemDefs).length} item definitions).`);
  console.log(
    `Synced icon status manifest to ${path.relative(root, iconStatusPath)} (${Object.keys(iconStatusPayload.items).length} item statuses).`
  );
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }
}
