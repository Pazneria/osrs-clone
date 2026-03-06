# OSRS Tick Engine Prototype (Refactored)

This project was converted from a single `legacy-osrs.html` file into a multi-file structure.

## Structure

- `legacy-osrs.html`: original one-file version (preserved)
- `index.html`: active app entrypoint
- `src/styles/main.css`: extracted styles
- `src/js/core.js`: constants, global state, bootstrap (`window.onload`)
- `src/js/inventory.js`: inventory, bank, shop, and UI tab systems
- `src/js/world.js`: world generation, map/chunks, minimap, pathing, and tick engine
- `src/js/input-render.js`: pointer input, context actions, camera, animation/render loop
- `run.bat`: starts local server and opens browser

## Run

From this folder:

```bat
run.bat
```

Then keep the terminal open and use `Ctrl + C` to stop.

## npm Scripts

From this folder:

```bat
npm run check
npm test
npm run dev
```

Notes:
- `check` and `test` currently run JavaScript syntax checks across `src/js/*.js`.
- `dev` runs `run.bat` (local static server + opens browser).

## Toolkit Commands

A lightweight toolkit now exists under `tools/` for asset prep and balancing simulations.

```bat
npm.cmd run tool:check
npm.cmd run tool:pixelize -- -InputPath .\assets\input\tree.png
npm.cmd run tool:pixelize:batch -- -InputDir .\assets\input -OutputDir .\assets\pixel -Recurse
npm.cmd run tool:sim:loot -- --runs 100000 --table "coins:50,raw_shrimp:30,nothing:20"
npm.cmd run tool:sim:combat -- --runs 10000 --strLevel 70 --atkLevel 70 --targetHp 60
```

See `docs/TOOLKIT_SETUP.md` for install/setup details.

## Item Asset Pipeline

Start here for 2D + 3D item workflow:

- `docs/ASSET_PIPELINE.md`

One-command item creation:

```bat
npm.cmd run tool:item:create -- -Id logs -Name "Logs" -Image .\assets\input\logs.png -Type resource -Value 4
npm.cmd run tool:items:validate
```

