const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..");

const { SUITES } = require("./package-suite-manifest");

function resolveRepoPath(relativePath) {
  return path.resolve(ROOT, ...relativePath.split("/"));
}

function assertFileExists(relativePath) {
  const absolutePath = resolveRepoPath(relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing suite file: ${relativePath}`);
  }
  return absolutePath;
}

function runNode(label, args) {
  console.log(`\n> ${label}`);
  const result = spawnSync(process.execPath, args, {
    cwd: ROOT,
    stdio: "inherit"
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function runTypecheck() {
  const tscPath = assertFileExists("node_modules/typescript/bin/tsc");
  runNode("tsc --noEmit", [tscPath, "--noEmit"]);
}

function runSyntaxChecks(files) {
  console.log(`\nChecking JavaScript syntax (${files.length} files)`);
  for (const relativePath of files) {
    const absolutePath = assertFileExists(relativePath);
    runNode(`node --check ${relativePath}`, ["--check", absolutePath]);
  }
}

function runScripts(files) {
  console.log(`\nRunning suite scripts (${files.length} files)`);
  for (const relativePath of files) {
    const absolutePath = assertFileExists(relativePath);
    runNode(`node ${relativePath}`, [absolutePath]);
  }
}

function runSuite(name) {
  const suite = SUITES[name];
  if (!suite) {
    const choices = Object.keys(SUITES).join(", ");
    throw new Error(`Unknown suite "${name}". Expected one of: ${choices}`);
  }

  if (suite.typecheck) {
    runTypecheck();
  }
  runSyntaxChecks(suite.syntaxFiles);
  runScripts(suite.runFiles);
  console.log(`\n${name} suite passed.`);
}

try {
  runSuite(process.argv[2] || "check");
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
