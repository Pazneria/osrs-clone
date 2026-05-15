# Building Workbench

The Building Workbench is a Codex-first authoring layer for mainland buildings and settlements. It is designed for assistant-driven iteration: Codex writes specs, runs validators, generates preview artifacts, and only promotes reviewed pieces into canonical world content.

## Why It Exists

Mainland towns should not become hand-authored clutter. The live world is still sourced from:

- `content/world/manifest.json`
- `content/world/regions/*.json`
- `content/world/stamps/*.json`

The workbench sits above those files. It lets us draft archetypes, material profiles, condition states, reusable building plans, decor hooks, wall art ideas, road profiles, NPC homes, and settlement intent before anything becomes live.

## Directory Shape

- `content/world/building-workbench/archetypes/*.json`: reusable building types such as house, bank, mansion, castle gatehouse, shop-house, artisan shop, and worksite.
- `content/world/building-workbench/materials/*.json`: concrete material profiles such as timber/thatch, city stone/slate, castle granite, or burnt timber.
- `content/world/building-workbench/conditions/*.json`: structure states such as intact, weathered, burnt, broken, or abandoned.
- `content/world/building-workbench/road-profiles/*.json`: road draft profiles that preview as Three.js paths but promote as tile/route metadata.
- `content/world/building-workbench/themes/*.json`: reusable visual languages such as frontier timber, stone market, or quarry iron.
- `content/world/building-workbench/buildings/*.json`: draft building specs that compile to canonical stamp JSON.
- `content/world/building-workbench/settlements/*.json`: draft town or outpost plans that reference building specs and theme mixes.
- `tmp/world-building-workbench`: generated preview output from the CLI, including `index.html`, `workbench-data.json`, `PROMOTION_PLAN.md`, promotion dry-runs, and a local Three.js preview module for browser review.

## Workflow

1. Codex adds or edits theme, building, or settlement specs.
2. Run `npm.cmd run tool:world:buildings`.
3. Run `npm.cmd run tool:world:buildings:preview` and inspect the interactive Three.js settlement preview, generated stamp JSON, ASCII stamps, settlement summaries, and `PROMOTION_PLAN.md` in `tmp/world-building-workbench`.
4. Run `npm.cmd run tool:world:buildings:promote -- --settlement <settlementId>` to produce a dry-run under `tmp/world-building-workbench/promotions/<settlementId>`.
5. Promote only reviewed reusable pieces:
   - copy the generated stamp JSON into `content/world/stamps`;
   - register the stamp in `content/world/manifest.json`;
   - add placements, roofs, doors, decor, roads, and NPC home tags to `content/world/regions/*.json`;
   - run `npm.cmd run tool:world:validate`.

## Guardrails

- Draft stamp IDs use the `bw_` prefix and must not collide with live stamps.
- Settlement drafts use `placementMode: "preview_only"` until promoted.
- Roads in settlement drafts that are tagged `road` must also be tagged `spawn-protected`.
- Decor must use runtime-supported `decorProps` kinds. The live renderer now supports identity props such as bank signs, shop signs, awnings, wall paintings, castle banners, rubble piles, quarry carts, and thatch bundles; more speculative wall-art ideas can stay in `wallArt` until promoted.
- Buildings must declare an archetype, material profile, and condition state. If a town needs a unique feeling, vary those knobs plus the theme, yard, decor, roof, service role, or placement mix before creating a one-off stamp.
- Roads must declare a road profile. The Three.js road mesh is only review geometry; promotion must become road/tile metadata.
- `tool:world:buildings:promote` is dry-run only. It writes JSON/Markdown candidates for stamps, manifest stamp IDs, region structures, DIRT road paths, staircase landmarks, decor props, roof landmarks, and NPC home tags without mutating canonical world files.

## Current Seed Kit

- `frontier_timber`: small frontier homes and woodcutting edges.
- `quarry_iron`: mine, smithing, and resource camp buildings.
- `stone_market`: denser city or guild-street buildings.
- `painted_plaster`: artisan streets, paintings, civic color, and river-crossing shops.
- Archetype coverage includes houses, shop-houses, artisan shops, banks, worksites, mansions, and castle gatehouses.
- Material and condition coverage includes thatch, stone, plaster, castle granite, burnt timber, intact, weathered, burnt, broken, and abandoned states.
- `south_quarry_hamlet`: first draft settlement target for mainland resource-town work.
- `market_crossing`: mixed market/artisan town draft for testing non-quarry mainland identity.
- `old_roadhold`: damaged defensive settlement draft for burnt buildings, castle pieces, ash tracks, and ruins.
- `north_woodwatch`: small northern outpost draft that keeps the mainland rollout from clustering in one southern/eastern band.
