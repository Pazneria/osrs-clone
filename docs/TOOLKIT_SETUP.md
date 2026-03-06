# Toolkit Setup (OSRS Clone)

This repo now includes a starter toolkit under `tools/` so we can move faster with assets and game balancing.

## What is already added

- `tools/pixel/pixelize.ps1`: convert one image into pixel-art style output.
- `tools/pixel/batch-pixelize.ps1`: batch-convert a folder of images.
- `tools/sim/loot-sim.js`: run weighted drop table simulations.
- `tools/sim/combat-sim.js`: run quick combat time-to-kill simulations.
- `tools/check-prereqs.ps1`: verifies required local tooling.

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

Single image to pixel-art:

```bat
npm.cmd run tool:pixelize -- -InputPath .\assets\input\tree.png -CellSize 6 -PaletteColors 24 -Upscale 6
```

Batch folder conversion:

```bat
npm.cmd run tool:pixelize:batch -- -InputDir .\assets\input -OutputDir .\assets\pixel -Recurse
```

Loot simulator:

```bat
npm.cmd run tool:sim:loot -- --runs 100000 --table "coins:50,raw_shrimp:30,nothing:20"
```

Combat simulator:

```bat
npm.cmd run tool:sim:combat -- --runs 10000 --strLevel 70 --atkLevel 70 --targetHp 60 --attackSpeedTicks 4
```

## New 2D/3D Item Pipeline

For item asset workflows (source image -> icon + model + item JSON), use:

- `docs/ASSET_PIPELINE.md`

Core commands:

```bat
npm.cmd run tool:item:create -- -Id logs -Name "Logs" -Image .\assets\input\logs.png -Type resource -Value 4
npm.cmd run tool:items:validate
```

