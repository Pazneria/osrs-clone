# Mainland Elevation Plan

The mainland elevation pass is a systems foundation, not a cosmetic pass. The goal is to make vertical geography readable while keeping OSRS-like tile clarity: players should understand where they can walk, what is lower or higher, and why a road, bank, ridge, or cliff exists.

## Terrain Vocabulary

- Lowered riverbank: walkable shoreline and dirt shoulders sit below surrounding grass before meeting water.
- Road grade: roads can descend into banks or climb out of valleys, but the road tile remains readable.
- Gentle hill or foothill: broad walkable rises with per-tile height deltas that pathfinding accepts.
- Ridge: a raised landform that reads as a boundary or overlook without becoming an invisible wall.
- Cliff or quarry cut: a sharper height break used sparingly, with ramps or stairs where the player should cross.
- Distant mountain silhouette: a far ridge or mountain mass visible as a landmark, authored so it can later become reachable terrain instead of just skybox art.

## Authoring Workflow

`content/world/regions/main_overworld.json` is the source of truth. Generated mirrors are not authoring targets.

Use `terrainPatches.landforms` for broad elevation language:

- `kind: "ellipse"` for banks, overlooks, hills, ridge masses, and basins.
- `kind: "path"` for road grades, ravines, dry washes, and climb corridors.
- `mode: "lower"` for banks and cuts.
- `mode: "raise"` for hills and ridges.
- `mode: "set"` only when a patch should deliberately level terrain.
- Optional `tileId` stamps readable ground texture such as `SHORE`, `DIRT`, or `SAND`.

Roads and narrow visual trails still live in `terrainPatches.paths`. The runtime applies landforms before paths so broad terrain comes first and roads stay crisp on top.

## First Slice

The first controlled vertical slice runs from the starter east road toward the Sunspur desert edge:

- This is the first lowered riverbank prototype for the mainland.
- `east_marsh_pool` is now mirrored into logical lake terrain so its water is real for gameplay and rendering.
- `east_marsh_lower_bank` lowers and stamps the walkable bank around that water.
- `east_marsh_road_descent` gives the approach a dirt road-grade down toward the bank.
- `sunspur_foothill_rise` raises dry sand terrain into a navigable foothill.
- `sunspur_far_ridge_silhouette` prototypes a distant ridge/mountain landmark in the same authored terrain language.

This is intentionally small. It proves the mainland can support lower banks, slopes, raised dry ground, and distant ridge intent before the whole 16x16 map gets uplifted.

## Runtime Assumptions

- Terrain elevation is stored in `heightMap` and sampled by chunk terrain meshes, NPC/resource placement, water edges, click-picking, and pathfinding.
- Normal walking accepts gentle per-tile height changes. Larger height jumps should be stairs, ramps, or intentionally blocked cliffs.
- Landforms are applied during base terrain setup, then chunk terrain is built through the existing near/mid/far streaming path.
- This is chunk-safe: the authored landform pass updates logical terrain data once, while visible mesh work remains bounded by the existing chunk windows.
- Far mountains should start as low-cost authored ridges or later chunked LOD landmarks, not an eager full-map backdrop build.

## Phased Rollout

1. Starter-to-marsh-to-Sunspur slice: prove lowered banks and a climbable foothill.
2. Quarry hills: convert mining terrain from special-case shaping into reusable landform authoring where safe.
3. River and wetland system: replace isolated water with shaped channels, banks, crossings, and drainage.
4. Regional ridge network: add overlooks, passes, cliffs, and mountain approaches.
5. Distant mountain treatment: add chunk-safe LOD silhouettes first, then reachable climbs as authored regions mature.

Run `npm.cmd run tool:world:validate`, world authoring/bootstrap guards, terrain/chunk/pathing guards, and mainland perf smoke after expanding this terrain language.
