# OSRS Asset Workflow (Pixel Source + Generated Runtime Assets)

This is the default item-icon pipeline for this project.

## Canonical source of truth

Each icon asset is authored as a text-backed pixel source file:

- `assets/pixel-src/<asset_id>.json`

That source file is canonical. Runtime PNGs and simple OBJ models are generated artifacts.

## What this pipeline produces

For each icon asset (example: `logs`) we generate:

- Pixel source: `assets/pixel-src/logs.json`
- Runtime icon: `assets/pixel/logs.png`
- Held model: `assets/models/logs.obj`
- Ground model: `assets/models/logs-ground.obj`

Runtime items then reference the asset through:

```js
icon: { kind: 'pixel', assetId: 'logs' }
```

`assetId` can differ from `itemId`, so multiple items may intentionally share one icon asset.

## Recommended workflow

1. Start the local server:

```bat
npm.cmd run dev
```

2. Open the in-repo editor:

- `http://localhost:5500/tools/pixel-editor/`

3. Create or update `assets/pixel-src/<asset_id>.json`.
4. Build generated assets:

```bat
npm.cmd run tool:pixel:build -- --asset logs
```

Or rebuild everything:

```bat
npm.cmd run tool:pixel:build:all
```

5. Sync and validate runtime data:

```bat
npm.cmd run tool:items:sync
npm.cmd run tool:items:validate
```

## Ask Codex for an asset

Natural-language prompts are enough. In this repo, Codex should treat a normal asset request as a direct execution request.

Examples:

- `make an inventory icon for bronze dagger`
- `redo willow logs so the bark is cooler and the bundle is thinner`
- `make icons for bronze dagger, iron dagger, and steel dagger`

By default, Codex should automatically:

1. Choose or create the right `assetId`
2. Author or update `assets/pixel-src/<asset_id>.json`
3. Build the generated PNG/OBJ outputs
4. Wire the item to that asset when the mapping is obvious
5. Summarize what changed and note any assumptions

Codex should only ask a clarifying question when the request is genuinely ambiguous, especially if:

- it is unclear which item or existing asset should be edited
- changing a shared asset could affect multiple items in a non-obvious way
- runtime wiring is risky or the intended target item is unclear

You can override the default behavior explicitly:

- `draft only, don't wire it yet`
- `make these share one asset`
- `don't iterate, just do a fast first pass`
- `match the tinderbox style`
- `revise the existing pickaxe asset instead of creating a new one`

## Source schema

Each `assets/pixel-src/*.json` file uses a fixed `32x32` canvas:

- `id`: lowercase snake_case asset id
- `width`: `32`
- `height`: `32`
- `palette`: single-character symbol map, with `"."` reserved for transparent
- `pixels`: 32 rows of 32 symbols each
- `model`: `depth`, `scale`, `groundVariant`

Current model behavior:

- `groundVariant` must be `"copy"`
- Model generation extrudes every non-transparent pixel into a simple voxel silhouette

## Importing older art

To bring an existing PNG into the new source format:

```bat
npm.cmd run tool:pixel:import-png -- -InputPath .\assets\pixel\logs-pixel.png -AssetId logs
```

To migrate older runtime icon definitions:

```bat
npm.cmd run tool:pixel:migrate
```

## Quality expectations

- Icons are authored on a `32x32` canvas but must stay readable at inventory-slot size.
- Generated OBJ meshes are prototype silhouettes, not final hero assets.
- Keep asset IDs and item IDs stable because gameplay systems depend on those identifiers.

## Future sessions behavior

New assistant instances do not remember chat history.
They can still follow this pipeline because it is codified in:

- `docs/ASSET_PIPELINE.md`
- `assets/pixel-src/*`
- `tools/pixel-editor/*`
- `tools/pixel/*`
- `package.json` scripts

## Catalog Source Of Truth

- Canonical runtime item definitions: `src/js/content/item-catalog.js`
- Canonical editable icon assets: `assets/pixel-src/*`
- Generated runtime mirror: `content/items/runtime-item-catalog.json`

Keep the runtime mirror in sync with:

```bat
npm.cmd run tool:items:sync
```

