const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ts = require("typescript");
const { readJsonFile } = require("./json-file-utils");

function resolveModulePath(fromFile, specifier) {
  const basePath = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.js`,
    `${basePath}.json`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.js"),
    path.join(basePath, "index.json")
  ];

  for (let i = 0; i < candidates.length; i++) {
    if (fs.existsSync(candidates[i])) return candidates[i];
  }

  throw new Error(`Unable to resolve module "${specifier}" from ${fromFile}`);
}

function loadTsModule(absPath, cache = new Map()) {
  const resolvedPath = path.resolve(absPath);
  if (cache.has(resolvedPath)) {
    return cache.get(resolvedPath).exports;
  }

  if (resolvedPath.endsWith(".json")) {
    const exportsValue = readJsonFile(resolvedPath);
    cache.set(resolvedPath, { exports: exportsValue });
    return exportsValue;
  }

  if (resolvedPath.endsWith(".js")) {
    // Use Node's native loader for plain JS helpers.
    // eslint-disable-next-line global-require, import/no-dynamic-require
    return require(resolvedPath);
  }

  const source = fs.readFileSync(resolvedPath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      resolveJsonModule: true,
      esModuleInterop: true
    },
    fileName: resolvedPath
  });

  const moduleRecord = { exports: {} };
  cache.set(resolvedPath, moduleRecord);

  const localRequire = (specifier) => {
    if (!specifier.startsWith(".") && !path.isAbsolute(specifier)) {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      return require(specifier);
    }
    const nextPath = resolveModulePath(resolvedPath, specifier);
    return loadTsModule(nextPath, cache);
  };

  const wrapped = `(function(require, module, exports, __dirname, __filename) {${transpiled.outputText}\n})`;
  const compiled = vm.runInThisContext(wrapped, { filename: resolvedPath });
  compiled(localRequire, moduleRecord, moduleRecord.exports, path.dirname(resolvedPath), resolvedPath);

  return moduleRecord.exports;
}

module.exports = {
  loadTsModule
};
