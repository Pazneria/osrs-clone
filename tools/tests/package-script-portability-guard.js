const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const packageJsonPath = path.join(root, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const scripts = packageJson.scripts || {};
  const violations = [];

  for (const [name, command] of Object.entries(scripts)) {
    if (typeof command !== "string") continue;
    if (
      command.includes("%NODE%") ||
      command.includes("C:\\Program Files\\nodejs") ||
      command.includes('set "NODE=')
    ) {
      violations.push(`${name}: ${command}`);
    }
  }

  assert(
    violations.length === 0,
    `package.json scripts should use portable node invocations:\n${violations.join("\n")}`
  );

  console.log("Package script portability guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
