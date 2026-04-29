const fs = require("fs");
const path = require("path");

const { loadTsModule } = require("../lib/ts-module-loader");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const modulePath = path.join(root, "src", "game", "codex", "link-contract.ts");
  const source = fs.readFileSync(modulePath, "utf8");

  assert(!source.includes("localStorage"), "codex link contract should not read localStorage");
  assert(!source.includes("sessionStorage"), "codex link contract should not read sessionStorage");
  assert(!source.includes("GameSessionRuntime"), "codex link contract should not read session runtime");

  const codexLinks = loadTsModule(modulePath);
  assert(codexLinks.DEFAULT_CODEX_BASE_PATH === "/osrs-clone-codex/", "default codex base path mismatch");
  assert(codexLinks.normalizeCodexBasePath("osrs-clone-codex") === "/osrs-clone-codex/", "codex base path normalization mismatch");
  assert(
    codexLinks.buildCodexEntityPath("item", "bronze_axe", { from: "game" }) === "/osrs-clone-codex/items/bronze_axe?from=game",
    "game codex item path mismatch"
  );
  assert(
    codexLinks.buildCodexEntityPath("world", "main_overworld", {
      from: "game",
      returnTo: "https://pazneria.github.io/osrs-clone/"
    }) === "/osrs-clone-codex/world/main_overworld?from=game&return=https%3A%2F%2Fpazneria.github.io%2Fosrs-clone%2F",
    "game codex world path mismatch"
  );
  assert(
    codexLinks.buildCodexEntityUrl("skill", "fishing", {
      baseUrl: "https://pazneria.github.io/arcade/",
      from: "game"
    }) === "https://pazneria.github.io/osrs-clone-codex/skills/fishing?from=game",
    "game codex entity url mismatch"
  );
  assert(
    codexLinks.getCodexRouteTemplates().world === "/osrs-clone-codex/world/:worldId",
    "game codex route template mismatch"
  );

  console.log("Codex link contract checks passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
