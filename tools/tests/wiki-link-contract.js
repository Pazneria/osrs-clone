const fs = require("fs");
const path = require("path");

const { loadTsModule } = require("./ts-module-loader");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const modulePath = path.join(root, "src", "game", "wiki", "link-contract.ts");
  const source = fs.readFileSync(modulePath, "utf8");

  assert(!source.includes("localStorage"), "wiki link contract should not read localStorage");
  assert(!source.includes("sessionStorage"), "wiki link contract should not read sessionStorage");
  assert(!source.includes("GameSessionRuntime"), "wiki link contract should not read session runtime");

  const wikiLinks = loadTsModule(modulePath);
  assert(wikiLinks.DEFAULT_WIKI_BASE_PATH === "/osrs-clone-wiki/", "default wiki base path mismatch");
  assert(wikiLinks.normalizeWikiBasePath("osrs-clone-wiki") === "/osrs-clone-wiki/", "wiki base path normalization mismatch");
  assert(
    wikiLinks.buildWikiEntityPath("item", "bronze_axe", { from: "game" }) === "/osrs-clone-wiki/items/bronze_axe?from=game",
    "game wiki item path mismatch"
  );
  assert(
    wikiLinks.buildWikiEntityPath("world", "starter_town", {
      from: "game",
      returnTo: "https://pazneria.github.io/osrs-clone/"
    }) === "/osrs-clone-wiki/world/starter_town?from=game&return=https%3A%2F%2Fpazneria.github.io%2Fosrs-clone%2F",
    "game wiki world path mismatch"
  );
  assert(
    wikiLinks.buildWikiEntityUrl("skill", "fishing", {
      baseUrl: "https://pazneria.github.io/arcade/",
      from: "game"
    }) === "https://pazneria.github.io/osrs-clone-wiki/skills/fishing?from=game",
    "game wiki entity url mismatch"
  );
  assert(
    wikiLinks.getWikiRouteTemplates().world === "/osrs-clone-wiki/world/:worldId",
    "game wiki route template mismatch"
  );

  console.log("Wiki link contract checks passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
