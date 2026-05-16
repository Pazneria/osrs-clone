# Mainland Rework

This pass promotes the Building Workbench from preview-only planning into real `main_overworld` content.

## Audit Findings

- The visible long north-south river was not authored in `content/world/regions/main_overworld.json`.
- It came from the fallback `legacy-east-river` water body in `src/game/world/water.ts`, which appears when a world has no authored `waterBodies`.
- The live authored mainland had 17 structures clustered mostly around Starter Town and the east road outpost.
- Raw authored coordinates still need to stay within the legacy 486 map envelope because the runtime authoring layer scales `main_overworld` into the expanded 1296 map.
- The live mainland is now a 16x16 chunk canvas with `CHUNK_SIZE = 81`, so the target runtime footprint is 1296x1296 tiles. Current settlement density is provisional scaffolding for future worldbuilding, not the intended final spacing.
- Tutorial Island keeps its existing live layout footprint inside the larger runtime map while its surrounding sea still covers the full active map.

## Scale And Performance Contract

The mainland scale pass is performance-first:

- `main_overworld` scales from raw 486-space authoring into 1296 live tiles.
- Default chunk policy keeps far chunks windowed instead of treating the whole mainland as visible far terrain.
- The old full-far-backdrop hook remains only as an optional legacy/all-far path and is capped so a 16x16 world does not eagerly build 256 far chunks at boot.
- Near, mid, and far chunk work is queued and budgeted across frames through the existing chunk streaming runtime.
- Use `npm.cmd run test:perf:mainland` for mainland starter, market, woodwatch, roadhold, and quarry perf coverage.
- Use `npm.cmd run test:perf:mainland:stream` for a focused chunk-streaming route.

## Water Change

`main_overworld` now authors explicit `waterBodies`, which disables the fallback river path for this world.
The runtime terrain setup also disables the old compatibility river carve and bridge rows whenever the active water payload is authored instead of `legacy-east-river`.

The water layout keeps the existing lakes and castle pond, then adds small broken-water remnants:

- `east_marsh_pool`
- `south_brook_pool`

These are short water features, not a full-height divider.

## Promoted Settlements

- `north_woodwatch`: northwestern woodcutting outpost near the yew/willow frontier.
- `south_quarry_hamlet`: southern mining support hamlet with storehouse, cottages, road, bank, and foreman.
- `market_crossing`: eastern market/artisan town with bank, gallery, merchant house, lodging, roads, and service NPCs.
- `old_roadhold`: northeastern damaged roadhold with gatehouse, burnt cottage, manor shell, ash track, and scavenger NPC.

## Worldbuilding Direction

See `docs/MAINLAND_WORLDBUILDING.md` for the density target and original regional plan. The first starter-to-desert-edge slice adds `SAND` terrain, dry wash/ridge patches, protected dirt road overlays, short fence rails, and bounded Sunspur/Saltwind props as the pattern for future biome-transition work.

See `docs/MAINLAND_ELEVATION.md` for the terrain elevation foundation. The mainland now has canonical `terrainPatches.landforms` for broad lowered banks, road grades, foothills, ridges, and future mountain approaches. These landforms feed the existing `heightMap` and chunk terrain path rather than adding a cosmetic-only overlay.

## Settlement Identity Pass

- Existing mainland service buildings now carry explicit roof landmarks, not just wall/tile stamps, so old NPC houses render with the same roof pipeline as promoted workbench buildings.
- `north_woodwatch` now has a timber fletchers workshop connected by `north_woodwatch_fletchers_lane`; the fletching supplier, advanced fletcher, and advanced woodsman have been moved into Woodwatch homes.
- `south_quarry_hamlet` now owns the smithing/mining service cluster: Borin, Thrain, Elira, the quarry foreman, bank, furnace, and anvil are placed around the quarry cottages/storehouse.
- `market_crossing` now owns the artisan service cluster: the crafting teacher and Tanner Rusk live around the gallery/cottage instead of staying in the starter-town row.
- Settlement identity decor is now live, not just draft intent: Woodwatch has thatch/fletching yard props, South Quarry has a quarry cart, Market Crossing has bank/shop signage, an awning, and painting display, and Old Roadhold has a castle banner, burnt rubble, and manor painting.

## Guard Coverage

`npm.cmd run test:world:mainland-rework` checks:

- `main_overworld` has authored water bodies and no `legacy-east-river` body.
- no authored coordinate exceeds the raw 486 envelope before runtime scaling.
- promoted stamps are registered in `content/world/manifest.json` and exist in `content/world/stamps`.
- promoted structures span northern, southern, western/northwestern, and eastern areas.
- promoted roads, services, NPC home tags, roofs, staircases, and decor props exist.
- relocated services keep their intended settlement coordinates, home tags, and regional identity tags.
- every non-castle ground-floor structure has a live roof landmark with material profile metadata.
- service adjacency remains valid on the built logical map.

Run `npm.cmd run tool:world:validate` after any canonical mainland placement changes.
