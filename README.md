# OSRS Tick Engine Prototype (Refactored)

This project uses a multi-file structure.

## Structure

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

## QA Commands

In chat, run `/qa help` to list available presets and tools.

Fishing-focused QA helpers:
- `/qa fishspots`: Lists canonical fishing QA spots.
- `/qa gotofish <pond|pier|deep>`: Teleports to a fishing QA spot.
- `/qa diag fishing`: Prints current fishing diagnostics (level, bait, nearby water, active method/water).
- `/qa setlevel fishing <1-99>`: Sets both Fishing level and the exact XP floor for that level (prevents level snapping back after the next XP gain).

Current fishing interaction behavior:
- Left-click water auto-selects the highest-priority eligible method you have tools/requirements for.
- Right-click shallow water exposes method actions: Net Water, Rod Water, Harpoon Water.
- Deep water keeps a generic fish action and resolves method by equipped/available harpoon path (normal harpoon = mixed tuna/swordfish, rune harpoon = swordfish-only).

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


