function parsePixelAssetArgs(argv, options = {}) {
  const args = {
    assetIds: []
  };
  const allowAll = !!options.allowAll;
  if (allowAll) args.all = false;

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (allowAll && token === "--all") {
      args.all = true;
      continue;
    }
    if (token === "--asset" || token === "-AssetId") {
      const next = argv[i + 1];
      if (!next) throw new Error(`${token} requires a value`);
      args.assetIds.push(next);
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${token}`);
  }

  return args;
}

module.exports = {
  parsePixelAssetArgs
};
