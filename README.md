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
npm.cmd run dev
```

Or use `run.bat` for the same Vite-backed flow.

Then keep the terminal open and use `Ctrl + C` to stop.

## npm Scripts

From this folder:

```bat
npm run check
npm test
npm run dev
npm run build
```

Notes:
- `dev` runs the Vite module shell on port `5500`.
- `build` emits a production bundle to `dist/`.
- `check` and `test` now include the incremental TypeScript bridge plus world-content validation.

## Platform Shell

- `index.html` now boots through a single Vite module entry: `src/main.ts`
- `three` is loaded from npm instead of a CDN and exposed to the legacy runtime through the module bridge
- legacy gameplay scripts still execute in their existing order, but they are now loaded through `src/game/platform/legacy-script-manifest.ts`

## World Authoring

- Canonical starter-town world authoring now lives in `content/world/`
- Reusable blueprint stamps live under `content/world/stamps/`
- Region/service/route authoring lives in `content/world/regions/starter_town.json`
- `npm.cmd run tool:world:validate` validates world authoring, merchant wiring, route aliases, and adjacency rules

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
npm.cmd run tool:pixel:build -- --asset iron_axe
npm.cmd run tool:pixel:build:all
npm.cmd run tool:sim:loot -- --runs 100000 --table "coins:50,raw_shrimp:30,nothing:20"
npm.cmd run tool:sim:combat -- --runs 10000 --strLevel 70 --atkLevel 70 --targetHp 60
```

See `docs/TOOLKIT_SETUP.md` for install/setup details.

## Item Asset Pipeline

Start here for the custom pixel-icon workflow:

- `docs/ASSET_PIPELINE.md`

Editor + build flow:

```bat
npm.cmd run dev
npm.cmd run tool:pixel:build -- --asset logs
npm.cmd run tool:pixel:build:all
npm.cmd run tool:items:sync
npm.cmd run tool:items:validate
```

Then open:

- `http://localhost:5500/tools/pixel-editor/`

Item catalog source of truth:
- Runtime canonical definitions: `src/js/content/item-catalog.js`
- Generated mirror for parity checks: `content/items/runtime-item-catalog.json`


