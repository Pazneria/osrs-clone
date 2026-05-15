# Mainland Worldbuilding Plan

This plan uses early/free-to-play OSRS mainland density as reference grammar, not as a layout to clone. Do not reuse RuneScape or Gielinor names, town identities, quest setups, or exact relative placements. The goal is to learn how a compact MMO overworld spends space, then build an original 16x16 mainland around our own regions.

## Reference Notes

Reference sources:

- [OSRS world map](https://oldschool.runescape.wiki/w/Game_map): the map exposes named cities, towns, roads, icons, dungeons, rivers, lakes, and geographic features at multiple zoom levels.
- [Lumbridge](https://oldschool.runescape.wiki/w/Lumbridge): a starter settlement with adjacent towns to the west/east/north, a swamp to the south, nearby farms, mines, trees, tutors, fishing, and low-level combat.
- [Al Kharid](https://oldschool.runescape.wiki/w/Al_Kharid): a desert-edge city reached from Lumbridge by a toll gate, with a road north toward a mine and several compact services.
- [Varrock](https://oldschool.runescape.wiki/w/Varrock): a major city entered from multiple sides, placed near wilderness, trade, quests, and road pressure.
- [Draynor Village](https://oldschool.runescape.wiki/w/Draynor_Village): a small village between larger settlements, dense with shops, willows, fishing, thieving, and a nearby manor.
- [Port Sarim](https://oldschool.runescape.wiki/w/Port_Sarim): a port town with travel links, shops, jail, farm, mine access, and nearby coast features.
- [Barbarian Village](https://oldschool.runescape.wiki/w/Gunnarsgrunn): a small settlement between larger cities that doubles as a combat hazard and dungeon entrance.

Estimated density from the reference area, read as design signal rather than a tile-exact count:

- Major city-scale hubs: about 3 to 4 in the early mainland reference band.
- Starter or medium towns: about 3 to 5.
- Small villages/outposts/checkpoints: about 5 to 8.
- Road gates, passes, bridges, docks, or named crossings: about 10 to 16.
- Resource/training pockets near towns: about 14 to 24, including mines, farms, forests, fishing edges, combat fields, swamps, and utility buildings.
- Biome/coast/wilderness transitions: about 4 to 6 strong edges that make travel feel like entering a new district.
- Filler landmarks and readable travel texture: frequent, but usually clustered around roads and settlement edges rather than spread uniformly.

The strongest lesson is not raw object count. It is spacing cadence. A player usually moves from a settlement to a resource edge, road fork, hazard, gate, or micro-landmark before the next settlement. Empty space exists, but it is rarely anonymous: grass changes, roads fray, fences imply property, and resource sites sit just off the road.

## 16x16 Mainland Target

The current 16x16 mainland should eventually support this original density:

- 4 major cities or city-scale hubs.
- 6 to 8 towns/villages.
- 12 to 16 outposts, camps, toll houses, watch posts, docks, hermit homes, or ruins.
- 24 to 36 resource sites, including 6 to 8 mines/quarries, 6 to 10 forest pockets, 5 to 8 farms/pastures, 3 to 5 fishing/coast sites, and several skill-specific utility pockets.
- 18 to 26 roads, gates, bridges, passes, docks, or road junctions.
- 5 to 7 regional biome identities: starter grassland, managed farms, old forest, dry scrub/desert, wetland/swamp, quarry hills, coast/harbor.
- 20 to 35 small filler landmarks: fenced yards, signposts, carts, rock scatters, ruins, shrines, campsites, dry washes, ponds, and trail-side work areas.

Working original regional sketch:

- Hearthmere Vale: starter grassland, castle/store/smithy, beginner farm and mine pressure.
- North Woodwatch: old forest and fletching/woodcutting village.
- South Quarry: quarry hamlet and stone/ore economy.
- Market Crossing: trade settlement and bank/gallery/service cluster.
- Old Roadhold: damaged gatehouse, road danger, burned ruins.
- Sunspur Gate: first grass-to-sand checkpoint east/southeast of the starter town.
- Saltwind Scrub: dry road, sand patches, mining/trade outpost, and eventual deeper desert route.
- Future wetland/coast band: not placed yet, but should replace random isolated lakes with intentional drainage, marsh, and coast systems.

## Starter-To-Desert Slice

Implemented first vertical slice:

- `east_marsh_lower_bank` and `east_marsh_road_descent`: the starter-to-Sunspur route now has a real lowered bank and road grade around the east marsh water instead of flat grass meeting water.
- `sunspur_dry_scrub_transition`: a broad `SAND` terrain patch that turns uniform grass into dry ground along the starter-to-market route.
- `sunspur_low_wash_dip`: a lowered dry wash inside the sand band.
- `sunspur_scrub_ridge`: a shallow raised sand ridge so the desert edge has a bump/dip language.
- `sunspur_foothill_rise` and `sunspur_far_ridge_silhouette`: authored landforms that establish a climbable dry rise and the first distant mountain/ridge landmark treatment.
- `starter_to_sunspur_checkpoint_road`: a protected dirt road from the starter east road into the checkpoint.
- `sunspur_trade_outpost_worn_road`: a protected dirt road tying the checkpoint to the trade-outpost edge.
- `sunspur_checkpoint_*_rail` and `saltwind_trade_outpost_paddock_rail`: short fence lines that frame the road without boxing the player in.
- `sunspur_*` and `saltwind_*` decor props: bounded checkpoint/outpost clutter using existing prop kinds.

## Authoring Rules

- Treat `content/world/regions/main_overworld.json` as canonical. Do not edit generated mirrors as source.
- Use `terrainPatches.landforms` for broad reusable elevation language: lowered riverbanks, road grades, foothills, ridges, basins, and future mountain approaches.
- Use `terrainPatches.paths` for reusable ground language: roads, dry washes, sand bands, worn paths, and shallow ridges.
- Use `TileId.SAND` for dry/desert ground. Keep roads as `DIRT` so protected road validation and path readability stay clear.
- Use `landmarks.fences` for real fence lines instead of pseudo-wall tiles.
- Use `landmarks.decorProps` for bounded, validated prop clusters. Prefer visual-only props for roadside clutter unless the object is meant to block movement.
- Future ground clutter should be authored in chunk-friendly batches or structured patterns before we scale it heavily.

## Performance Assumptions

- Terrain patches are chunk-safe because they stamp logical tiles and heights during map setup, then render through the existing near/mid/far chunk terrain paths.
- Landforms are authored once into `heightMap`; they do not create eager full-map far terrain meshes.
- The new `SAND` tile is walkable and natural, so pathing and smoothing treat it like ground, not structure.
- Road and prop additions are bounded to one slice. They should not create far-backdrop eager work or full-map prop spam.
- Expand future regions by adding regional systems and small verified slices, then run world validation, world authoring/bootstrap guards, chunk tier/terrain guards, and mainland perf smoke.
