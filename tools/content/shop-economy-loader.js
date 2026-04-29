const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadShopEconomy(root) {
  const sandbox = {
    window: {},
    playerState: { merchantProgress: {} },
    console
  };
  const loadBrowserScript = (relPath) => {
    const abs = path.join(root, relPath);
    const code = fs.readFileSync(abs, "utf8");
    vm.runInNewContext(code, sandbox, { filename: abs });
  };

  loadBrowserScript(path.join("src", "js", "skills", "specs.js"));
  sandbox.SkillSpecs = sandbox.window.SkillSpecs;
  loadBrowserScript(path.join("src", "js", "skills", "spec-registry.js"));
  sandbox.SkillSpecRegistry = sandbox.window.SkillSpecRegistry;
  loadBrowserScript(path.join("src", "js", "content", "item-catalog.js"));
  loadBrowserScript(path.join("src", "js", "shop-economy.js"));
  return sandbox.window.ShopEconomy || null;
}

module.exports = {
  loadShopEconomy
};
