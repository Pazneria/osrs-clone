# Toolkit Setup (OSRS Clone)

This repo now includes a starter toolkit under `tools/` so we can move faster with assets and game balancing.

## What is already added

- `tools/pixel/build-pixel-assets.js`: generate runtime PNG + OBJ artifacts from `assets/pixel-src/*.json`.
- `tools/pixel-editor/`: browser-based 64x64 authoring editor with canonical 32x32 export for inventory icons.
- `tools/pixel/render-pixel-spec.js`: AI-first sprite spec compiler for geometry-driven drafts and review previews.
- `tools/sim/loot-sim.js`: run weighted drop table simulations.
- `tools/sim/combat-sim.js`: run quick combat time-to-kill simulations.
- `tools/check-prereqs.ps1`: verifies required local tooling.

## Canonical asset workflow

For item icons and held-tool silhouettes, the canonical repo-owned workflow is:

- `assets/pixel-spec/*` for workbench drafts
- `assets/pixel-src/*` for canonical editable sources
- `tools/pixel-editor/`
- `npm.cmd run tool:pixel:spec -- --spec ...`
- `npm.cmd run tool:pixel:build -- --asset <asset_id>`

Use `docs/ASSET_PIPELINE.md` for the real day-to-day icon workflow.

## Removed legacy helpers

The older image-conversion and migration helpers were removed so the repo now points at a single asset-authoring workflow. If you need to revise or create art, use the canonical workflow above rather than looking for an import shortcut.

## Easiest ImageMagick setup (recommended)

1. Download ImageMagick portable/binary zip.
2. Extract it so this file exists:
   `test\tools\bin\imagemagick\magick.exe`
3. Run:

```bat
npm.cmd run tool:check
```

No PATH or system config needed with this method.

## Required installs (you do once)

1. Node.js LTS (includes npm).
2. ImageMagick (portable drop-in above, or install globally).
3. Git.

## Recommended creative tools (optional, but very useful)

1. Pixel art: Pixelorama or Aseprite.
2. 3D asset creation: Blockbench for low-poly, Blender for advanced work.
3. Engine migration target: Godot.
4. Character auto-rig + animation: Mixamo.
5. Level design: LDtk or Tiled.

## Quick commands

Pixel asset build:

```bat
npm.cmd run tool:pixel:build -- --asset iron_axe
npm.cmd run tool:pixel:build:all
```

Loot simulator:

```bat
npm.cmd run tool:sim:loot -- --runs 100000 --table "coins:50,raw_shrimp:30,nothing:20"
```

Combat simulator:

```bat
npm.cmd run tool:sim:combat -- --runs 10000 --strLevel 70 --atkLevel 70 --targetHp 60 --attackSpeedTicks 4
```

## Custom Pixel Icon Workflow

For icon asset workflows (pixel source -> generated icon + model), use:

- `docs/ASSET_PIPELINE.md`

Open the editor after starting the local server:

```bat
npm.cmd run dev
npm.cmd run tool:pixel:build -- --asset logs
npm.cmd run tool:items:validate
```

