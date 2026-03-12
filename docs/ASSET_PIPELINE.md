# OSRS Asset Workflow (2D + 3D)

This is the default pipeline for item assets in this project.

## What this pipeline produces

For each item (example: `logs`) we generate:

- Source image copy: `assets/input/logs-source.png`
- UI icon (pixel style): `assets/pixel/logs-pixel.png`
- Held model: `assets/models/logs.obj`
- Ground model: `assets/models/logs-ground.obj`
- Draft item metadata file: `content/items/logs.json`

## One-command workflow (recommended)

1. Put your image anywhere (for example `assets/input/logs.png`).
2. Run:

```bat
npm.cmd run tool:item:create -- -Id logs -Name "Logs" -Image .\assets\input\logs.png -Type resource -Value 4
```

3. Validate content:

```bat
npm.cmd run tool:items:sync
npm.cmd run tool:items:validate
```

That command auto-copies your source image, creates icon + model, and writes the item JSON.

## Manual workflow (if you want control)

1. Create icon from image:

```bat
npm.cmd run tool:pixelize -- -InputPath .\assets\input\logs.png -OutputPath .\assets\pixel\logs-pixel.png
```

2. Generate 3D OBJ from icon silhouette:

```bat
npm.cmd run tool:model:from-image -- -InputPath .\assets\pixel\logs-pixel.png -OutputPath .\assets\models\logs.obj -Size 32 -Depth 4 -Threshold 35 -Mode auto
```

3. Copy or edit ground model:

```bat
copy .\assets\models\logs.obj .\assets\models\logs-ground.obj
```

4. Create `content/items/logs.json` from `_template.json` (draft metadata only).
5. Sync + validate:

```bat
npm.cmd run tool:items:sync
npm.cmd run tool:items:validate
```

## Rendering icon from 3D model (optional)

If Blender is installed:

```bat
npm.cmd run tool:model:render-icon -- -InputModel .\assets\models\logs.obj -OutputPath .\assets\pixel\logs-from-model.png -Size 256
```

This is useful when the model is the source of truth.

## Quality expectations

- Auto-generated OBJ from image is a prototype mesh.
- For final held weapons/tools, refine model in Blender or Blockbench.
- Keep item IDs stable (`logs`, `oak_logs`, etc.) because IDs are used by gameplay systems.

## Future sessions behavior

New assistant instances do not remember chat history.
They can still follow this pipeline because it is codified in:

- `docs/ASSET_PIPELINE.md`
- `content/items/_template.json`
- `package.json` scripts
- `tools/content/*` and `tools/model/*`

## Catalog Source Of Truth

- Canonical runtime item definitions: `src/js/content/item-catalog.js`.
- Canonical runtime sprite icon registry + fallback map: `src/js/content/icon-sprite-catalog.js`.
- Generated runtime mirror: `content/items/runtime-item-catalog.json`.
- Keep the runtime mirror in sync with:

```bat
npm.cmd run tool:items:sync
```

`npm.cmd run tool:items:validate` now also validates runtime sprite icon key coverage
against the icon sprite catalog and reports fallback usage counts.

