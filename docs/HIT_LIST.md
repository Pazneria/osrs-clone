# Hit List

Cross-project hit board for active hunting. This is not the only source of truth.
Use this as the execution layer that links to skill docs, playtest notes, and code.

## Workflow
1. Add new hits to `Backlog (Untriaged)` with the quick template.
2. Move to `Ready to Hunt` once triaged and scoped.
3. Write `Plan v1` before touching code.
4. After implementation, set `Plan Outcome`:
   - `Confirmed`: plan worked.
   - `Revised`: plan changed; record what changed in `Plan vNext`.
5. Move cards through `In Progress` -> `Fixed (Pending Verify)` -> `Closed (Verified)`.

## Severity
- `S0` Blocker: core gameplay unusable/crash/data loss.
- `S1` High: major feature broken or strong player impact.
- `S2` Medium: noticeable issue with workaround.
- `S3` Low: polish/minor inconsistency.

## Quick Entry Template
```md
### HIT-XXX - <short title>
- Status: Backlog | Ready | In Progress | Blocked | Fixed | Closed
- Severity: S0 | S1 | S2 | S3
- Area: WORLD | WC | MNG | RC | SMI | BUG | HUD | FLT | Other
- Source: Playtest | QA command | Manual | Other
- Links: <file path(s), issue refs, commit refs>
- Repro:
  1.
  2.
  3.
- Expected:
- Actual:
- Frequency: Always | Often | Sometimes | Once | N/A (non-bug task)
- Owner: Codex | User | Pair
- Plan v1:
  1.
  2.
  3.
- Plan Outcome: Pending | Confirmed | Revised
- Fix Notes:
- Plan vNext (if revised):
  1.
  2.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated
```

## Backlog (Untriaged)

### HIT-001 - World structure direction (authored map, no procgen)
- Status: Backlog
- Severity: S1
- Area: WORLD
- Source: Manual
- Links:
- Repro:
  1. N/A (directional world-design task)
- Expected: Intentional authored map/world with fixed geography and deliberate region/content placement.
- Actual: Current world direction includes procedural/random generation behavior.
- Frequency: N/A (non-bug task)
- Owner: Pair
- Plan v1:
  1. Audit all procedural world generation entry points.
  2. Define authored region layout schema and migration approach.
  3. Replace generation with fixed map loader and validation checks.
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

### HIT-002 - NPC world placement pass
- Status: Closed
- Severity: S2
- Area: WORLD
- Source: Manual
- Links: `content/world/regions/main_overworld.json`, `tools/content/validate-world.js`, `tools/tests/world-authoring-domain-tests.js`
- Repro:
  1. Survey current NPC spawns.
- Expected: Every NPC has a set location and associated building/home/base.
- Actual: Main-overworld NPC services now carry explicit `home:<id>` placement tags that anchor each named merchant, travel guide, and banker to an authored structure, route, or bank-booth landmark.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Produce NPC placement manifest.
  2. Map each NPC to a home/base location.
  3. Implement and smoke test travel/interaction paths.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added `home:<id>` tags to the authored main-overworld NPC services, reusing existing service tags instead of introducing a second placement source of truth.
  - Added world validation that requires each main-overworld NPC service to define exactly one home/base tag and verifies that the target exists as an authored structure, route, area, or landmark.
  - Extended world-authoring domain coverage so the home/base tags survive the typed/scaled world-definition path.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-003 - Service distribution pass (add 8+ banks)
- Status: Closed
- Severity: S2
- Area: WORLD
- Source: Manual
- Links: `content/world/regions/main_overworld.json`, `tools/tests/world-authoring-domain-tests.js`, `tools/tests/world-bootstrap-parity.js`, `tools/tests/service-adjacency.js`
- Repro:
  1. Traverse world service points.
- Expected: Bankers spread throughout the world with at least 8 additional bank locations.
- Actual: The main overworld now has eight additional authored banker + bank-booth locations spread across the east outpost, willow bend, maple ridge, yew frontier, south field, west range, southeast camp, and air altar routes.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Identify underserved regions.
  2. Propose 8+ bank placements.
  3. Implement and path-test interactions.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added eight static `Banker` services with the existing `Bank` NPC action and `banker` dialogue, avoiding new runtime-specific bank logic.
  - Added matching `BANK_BOOTH` landmark tiles through the existing authored landmark flow so booths render through the current bank-booth path.
  - Updated world authoring/bootstrap parity checks to lock the new banker service contract, booth landmark, service count, NPC publication, and coordinate scaling.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-004 - Road network pass with protected tiles
- Status: Closed
- Severity: S2
- Area: WORLD
- Source: Manual
- Links: `content/world/regions/main_overworld.json`, `tools/content/validate-world.js`, `tools/tests/world-authoring-domain-tests.js`, `tools/tests/world-bootstrap-parity.js`
- Repro:
  1. Inspect map traversal and spawn overlap.
- Expected: Roads exist broadly and are protected from resource/prop/world spawns.
- Actual: The main overworld now authors a protected dirt-road network across the east road, north altar road, starter-mine spur, south resource road, southwest bank road, and southeast camp road; validators reject resource nodes, combat spawns, blocking props, and altar footprints inside protected road tiles.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Add road layer/metadata.
  2. Mark road tiles as spawn-protected.
  3. Validate no resource/prop overlap on roads.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added six `terrainPatches.paths` entries tagged `road` + `spawn-protected` to `main_overworld` so the existing path-patch runtime stamps lowered dirt routes without adding a new world source of truth.
  - Extended world validation with a protected-road footprint check covering mining nodes, woodcutting nodes, combat spawn/home tiles, blocking decor props, and authored altar footprints.
  - Updated world authoring/bootstrap guards to lock the road IDs, tags, dirt tile treatment, scaling behavior, legacy payload publication, and representative stamped road tiles.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-005 - Dock/coastline pass for dark-water fishing access
- Status: Closed
- Severity: S2
- Area: WORLD
- Source: Manual
- Links: `content/world/regions/main_overworld.json`, `src/js/world.js`, `src/js/input-render.js`, `src/js/skills/fishing/ROADMAP.md`, `src/js/skills/fishing/STATUS.md`, `tools/tests/world-bootstrap-parity.js`, `tools/tests/world-water-payload-proof.js`, `tools/tests/water-render-guard.js`, `tools/tests/fishing-runtime-tests.js`
- Repro:
  1. Inspect the authored fishing and cooking route anchors in `content/world/regions/main_overworld.json`.
  2. Follow the active pier and dock access flow in `src/js/world.js` and `src/js/input-render.js`.
  3. Compare the live fishing tracker and focused world/water/fishing guards against this hit card.
- Expected: Docks are visibly elevated with support pillars, and dark-water rod/harpoon fishing is performed from docks only.
- Actual: The repo already ships an authored castle-pond pier and deep-water edge route, renders that dock as a raised structure with deck, stairs, tip platform, and support posts, and restricts deep-water fishing clicks to pier-approach tiles instead of arbitrary shoreline access.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Design dock prefab with elevated deck + pillars.
  2. Assign dark-water fishing nodes to dock access points only.
  3. Validate interaction rules from dock tiles.
- Plan Outcome: Confirmed
- Fix Notes:
  - `main_overworld` now authors the dock loop explicitly through `skillRoutes.fishing` (`castle_pond_bank`, `castle_pond_pier`, `castle_pond_deep_edge`) plus matching dock/deep cooking anchors, so the world data already distinguishes shoreline, pier, and deep-water access points.
  - `src/js/world.js` consumes the published `pierConfig` to build the raised pier deck, stairs, widened tip, and repeated support-post rows while preserving nearby deep-water coverage for fishing targets.
  - `src/js/input-render.js` already enforces the intended access contract with pier-specific boarding, descend, and fishing-approach helpers, and `src/js/skills/fishing/STATUS.md` already marks `FISHING-012` complete for the training-location/world-placement pass.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-006 - Terrain shaping pass for mining depressions/quarries
- Status: Closed
- Severity: S3
- Area: WORLD
- Source: Manual
- Links: `src/js/world.js`, `tools/tests/world-bootstrap-parity.js`, `tools/tests/freeze-main-overworld-parity.js`
- Repro:
  1. Inspect mining area terrain profiles.
- Expected: Mining areas generally sit in depressions/quarries.
- Actual: Some mining areas read as flat/random patches.
- Frequency: Often
- Owner: Pair
- Plan v1:
  1. Identify mining regions needing terrain shaping.
  2. Sculpt depressions and edge transitions.
  3. Re-test movement/pathing and node interactions.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added a deterministic quarry sculpt pass in `initLogicalMap` that groups mining nodes by route and applies cluster-based basin shaping (depression falloff plus broken-up noise) after mining rocks are placed.
  - Added deterministic rock-thinning per mining route so quarry silhouettes read less cluttered and the pit floor is more visible.
  - Introduced a dedicated `DIRT` tile surface for quarry interiors, with separate terrain material/texture rendering and minimap color treatment.
  - Added gentle rim lifting and localized smoothing around touched quarry tiles so mining areas read as carved terrain rather than circular bowls or flat patches.
  - Kept gameplay-safe bounds by sculpting only natural land tiles (grass/dirt/rock/stump), excluding town-core and water-adjacent terrain classes, then clamping final quarry floor depths to conservative limits.
  - Rock instances now sample local terrain center height and apply a slight grounding offset so they seat into the quarry floor instead of floating over it.
  - Verified world bootstrap and main-overworld freeze parity guards after the terrain pass.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-008 - Player creation menu
- Status: Closed
- Severity: S2
- Area: WORLD
- Source: Manual
- Links: `index.html`, `src/js/core.js`, `src/game/ui/hud-view-models.ts`, `tools/tests/inventory-hud-domain-tests.js`, `tools/tests/inventory-hud-domain-guard.js`
- Repro:
  1. Start the game from a fresh state and confirm the world is blocked behind the player-entry overlay.
  2. Inspect the live overlay and verify it exposes name entry, body-type toggles, color rows, and a primary start/continue action.
  3. Check the focused HUD-domain tests/guards to ensure the player-entry flow copy and gating stay locked.
- Expected: Player creation flow/menu exists.
- Actual: The repo already ships a dedicated player-entry flow with create/continue copy, starter name validation, body-type and color customization, save-aware hydration, and world-entry gating until the profile is completed.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Define player creation fields and defaults.
  2. Implement UI flow and state hydration.
  3. Gate game start behind successful creation.
- Plan Outcome: Confirmed
- Fix Notes:
  - `index.html` already mounts a dedicated `player-entry-overlay` with name entry, body-type toggles, color customization rows, summary copy, and a primary start/continue action.
  - `src/js/core.js` already owns the full player-entry lifecycle: validation, save-aware create/continue copy, appearance preview refresh, completion persistence, and world gating until `creationCompleted` is set.
  - Added focused `inventory-hud-domain` coverage so the player-entry summary copy, overlay structure, and completion-gated startup flow cannot drift silently from this hit card again.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-009 - Account/progress persistence across logins
- Status: Closed
- Severity: S1
- Area: WORLD
- Source: Manual
- Links: `src/js/core.js`, `src/js/core-progress-runtime.js`, `src/game/platform/session-bridge.ts`, `src/game/session/progress.ts`, `tools/tests/progress-persistence-guard.js`, `tools/tests/core-progress-runtime-guard.js`, `tools/tests/game-session-guard.js`, `package.json`
- Repro:
  1. Play, gain progress, restart/login.
- Expected: Player progress auto-saves and persists across multiple logins.
- Actual: Progress now saves through the session runtime, restores on startup before world initialization, and preserves player profile, creator selections, inventory/equipment, skills, quests, world id, and combat/eating state across reloads.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Define save schema + versioning.
  2. Implement auto-save triggers and load-on-login.
  3. Add migration/error handling and verify with multi-session test.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added versioned progress storage (`osrsClone.progress.v2`) with obsolete v1 cleanup and migration delegated through the typed session bridge.
  - Moved progress serialization/deserialization, profile/appearance/skill sanitization, fresh-session handling, autosave scheduling, and unload/pagehide save hooks into `CoreProgressRuntime`.
  - Startup now loads progress before world initialization and restores saved quests, world id aliases, player profile, creator selections, inventory, equipment, skills, and combat defaults through the session/runtime adapters.
  - Stale persisted eat cooldown ticks are bounded on load so an old absolute tick value cannot lock food usage after a restart.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-013 - Shoreline terrain clipping cleanup
- Status: Closed
- Severity: S2
- Area: WORLD
- Source: Manual
- Links: `src/js/world/chunk-terrain-runtime.js`, `src/js/world/water-runtime.js`, `src/js/world/render-runtime.js`, `tools/tests/terrain-seam-guard.js`, `tools/tests/water-render-guard.js`, `tools/content/validate-world.js`
- Repro:
  1. Inspect beach/sand around water boundaries.
- Expected: Shoreline terrain blends cleanly without clipping.
- Actual: Shoreline terrain now blends through authored water-body contours, smooth shoreline ribbons, island-coastline visual suppression, water-height terrain underlap, and shore/dirt blend masks instead of exposing jagged beach/sand or grass slivers at water edges.
- Frequency: Often
- Owner: Pair
- Plan v1:
  1. Identify clipping hotspots.
  2. Adjust shoreline mesh/tile transitions.
  3. Verify at multiple zoom levels/camera angles.
- Plan Outcome: Confirmed
- Fix Notes:
  - `chunk-terrain-runtime` now samples authored water bodies and applies shore/dirt blend masks near smooth pond and island-coastline contours, including water-height pull-down protection so land vertices meet water cleanly.
  - `water-runtime` owns smooth pond overlays, shoreline ribbons, island coastline visuals, and near-coast tile-water suppression so visible water no longer follows jagged tile edges where authored contours exist.
  - `render-runtime` keeps the shoreline ribbon material on the shared animated water path, preserving shallow-water feathering without white foam or exposed underside seams.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-014 - Tree spacing pass by tiered reserved areas
- Status: Closed
- Severity: S2
- Area: WC
- Source: Manual
- Links: `src/js/world.js`, `src/js/skills/woodcutting/STATUS.md`
- Repro:
  1. Survey tree distribution by type.
- Expected: Spacing targets: regular 3x3, oak/willow 4x4, maple 5x5, yew 6x6.
- Actual: Trees are too tightly packed / spacing not tiered.
- Frequency: Often
- Owner: Pair
- Plan v1:
  1. Encode spacing rules by tree tier.
  2. Re-seed/reposition trees with constraints.
  3. Verify pathing and harvest density.
- Plan Outcome: Confirmed
- Fix Notes:
  - Cleared broad procedural tree noise before woodcutting tier placement so spacing is governed by deterministic zone rules instead of legacy random spawn leftovers.
  - Added tiered reserved-area sizing for tree placement (`normal=3x3`, `oak/willow=4x4`, `maple=5x5`, `yew=6x6`) and enforced non-overlap checks between candidate and already placed trees.
  - Updated zone spacing targets to align with reserved-area footprints and kept deterministic band placement + fallback expansion behavior intact.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-015 - Unique tree models per type
- Status: Closed
- Severity: S2
- Area: WC
- Source: Manual
- Links: `src/js/world.js`, `src/js/skills/woodcutting/STATUS.md`, `tools/tests/world-bootstrap-parity.js`
- Repro:
  1. Compare `TREE_VISUAL_PROFILES` in `src/js/world.js` across normal, oak, willow, maple, and yew tree nodes.
  2. Inspect the starter-pond showcase lineup and live woodcutting tracker notes for per-tree silhouette/polish coverage.
  3. Run the focused world bootstrap guard to confirm every woodcutting tree node keeps a distinct visual profile.
- Expected: Each tree type has immediately distinguishable model identity.
- Actual: The runtime already assigns node-specific tree visual profiles with distinct trunk/canopy/branch/drape/stump silhouettes, and the woodcutting tracker now records the baseline, polish, and gameplay-zoom readability passes as complete.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Define silhouette/color goals per tree type.
  2. Produce/import unique models.
  3. Hook type-to-model mapping and verify rendering/perf.
- Plan Outcome: Confirmed
- Fix Notes:
  - `src/js/world.js` now keeps explicit visual profiles for `normal_tree`, `oak_tree`, `willow_tree`, `maple_tree`, and `yew_tree` instead of rendering every tree through one shared silhouette.
  - The profiles preserve recognizable identities: normal as the simple baseline, oak as a broad heavy trunk/crown, willow with hanging drapes, maple with the widest crown, and yew with the tallest stacked spire profile.
  - Extended `tools/tests/world-bootstrap-parity.js` to parse `TREE_VISUAL_PROFILES`, require one unique profile per woodcutting tree node type, and verify the chunk tree renderer feeds node IDs into the visual-profile path.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-016 - Tree habitat placement rules
- Status: Closed
- Severity: S3
- Area: WC
- Source: Manual
- Links: `src/js/world.js`, `src/js/skills/woodcutting/STATUS.md`
- Repro:
  1. Inspect willow/maple/yew biome placement.
- Expected: Willows near water; maples away from water; yews near NPC-populated areas.
- Actual: Habitat placement rules are not consistently applied.
- Frequency: Often
- Owner: Pair
- Plan v1:
  1. Encode habitat constraints by tree type.
  2. Reposition existing trees to satisfy constraints.
  3. Validate world readability and gatherer routes.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added explicit habitat rules to deterministic woodcutting zone specs: willow near shoreline water, maple away from water, and yew near NPC population anchors.
  - Added runtime habitat anchor discovery and nearest-distance checks (`water` shoreline anchors + NPC spawn anchors) with coordinate-level distance caching.
  - Integrated habitat validation into candidate filtering so placement constraints are applied before spacing/reserved-area checks during deterministic tree band placement.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-017 - Unique rock/gem models
- Status: Fixed
- Severity: S2
- Area: MNG
- Source: Manual
- Links: `src/js/world.js`, `src/js/skills/mining/STATUS.md`, `src/js/skills/_index.md`, `tools/tests/world-bootstrap-parity.js`
- Repro:
  1. Compare `ROCK_VISUAL_PROFILES` in `src/js/world.js` across clay, copper, tin, iron, coal, silver, sapphire, gold, emerald, rune essence, and depleted rocks.
  2. Inspect the mining-node render path and confirm it creates per-profile instanced meshes instead of collapsing most ore types into one colored rock mesh.
  3. Run the focused world bootstrap parity guard to confirm the full profile set and renderer wiring stay locked.
- Expected: Each rock/gem type is immediately distinguishable.
- Actual: Runtime mining rocks now use explicit per-type visual profiles with distinct geometry/material/scale signatures for every current 1-40 ore/gem type plus rune essence and depleted rocks.
- Frequency: Always
- Owner: Codex
- Plan v1:
  1. Define model language per ore/gem tier.
  2. Produce/import unique node models.
  3. Map nodes and validate recognition in playtests.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added `ROCK_VISUAL_PROFILES` in `src/js/world.js` so clay, copper, tin, iron, coal, silver, sapphire, gold, emerald, rune essence, and depleted rocks each own a named geometry/material/scale profile.
  - Reworked chunk rock rendering to bucket counts by visual profile and create one instanced mesh per rock/gem profile while preserving the existing `type: 'ROCK'`, `oreType`, display name, and instance-map interaction metadata.
  - Extended `tools/tests/world-bootstrap-parity.js` to parse and validate the rock visual profile set, uniqueness signatures, crystal height relationship, and renderer profile-bucketing path.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-018 - Runecrafting altar placement pass
- Status: Fixed
- Severity: S2
- Area: RC
- Source: Manual
- Links: `content/world/regions/main_overworld.json`, `src/game/world/authoring.ts`, `src/game/world/bootstrap.ts`, `src/game/world/runecrafting-runtime.ts`, `src/game/platform/legacy-bridge.ts`, `src/game/platform/legacy-world-adapter.ts`, `src/js/skills/runecrafting/STATUS.md`, `tools/tests/world-bootstrap-parity.js`, `tools/tests/skill-runtime-parity.js`, `tools/tests/spec-contracts.js`
- Repro:
  1. Inspect the canonical runecrafting world content in `content/world/regions/main_overworld.json`.
  2. Follow the authored altar data through `src/game/world/authoring.ts`, `src/game/world/bootstrap.ts`, `src/game/world/runecrafting-runtime.ts`, and the legacy bridge adapters.
  3. Compare the live runecrafting status board and focused world/runtime guards against this hit card.
- Expected: Altars exist at designated intentional world locations.
- Actual: The repo already ships four authored altar routes plus four authored altar landmarks in canonical world content, and that placement is published through the typed world bootstrap, runecrafting runtime, and legacy route surfaces instead of coming from random/procedural spawning.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Define fixed altar location set.
  2. Remove random altar generation.
  3. Validate access paths and progression pacing.
- Plan Outcome: Confirmed
- Fix Notes:
  - `main_overworld` now authors the elemental altar path explicitly through `skillRoutes.runecrafting` and `landmarks.altars`, with the route order locked to `ember_altar`, `water_altar`, `earth_altar`, and `air_altar`.
  - `src/game/world/authoring.ts`, `src/game/world/bootstrap.ts`, `src/game/world/runecrafting-runtime.ts`, `src/game/platform/legacy-bridge.ts`, and `src/game/platform/legacy-world-adapter.ts` publish those authored altar placements into both the typed runtime and legacy QA/runtime surfaces instead of deriving them from random world generation.
  - `src/js/skills/runecrafting/STATUS.md` already marks `RUNECRAFTING-011` complete, and the focused world/runecrafting guards already lock authored altar count, route order, and route publication.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-020 - Smithing item level requirement rebalance
- Status: Fixed
- Severity: S2
- Area: SMI
- Source: Manual
- Links: `src/js/skills/specs.js`, `content/skills/smithing.json`, `tools/tests/fletching-crafting-interactions.js`
- Repro:
  1. Review smithing item level table by tier.
- Expected: Requirements range from base tier unlock up to two levels below next tier unlock.
- Actual: Current requirements fall outside desired range.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Define target requirement bands by tier.
  2. Update smithing requirement data.
  3. Validate progression curve and XP pacing.
- Plan Outcome: Confirmed
- Fix Notes:
  - Rebalanced smithing forge recipe level requirements using per-item offsets inside each tier band, capped to `next tier unlock - 2`.
  - Corrected jewelry-base requirement mismatches by moving silver jewelry to the silver band and spreading gold jewelry inside the gold band.
  - Updated smithing jewelry interaction tests to use the new silver requirement floor.
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-021 - Fire spawn bug after tab inactivity
- Status: Fixed
- Severity: S1
- Area: BUG
- Source: Manual
- Links:
- Repro:
  1. Spend time in another browser tab.
  2. Return and inspect area between castle and pond.
- Expected: No unexpected fires spawn while tab is inactive.
- Actual: Fires appeared/spawned unexpectedly.
- Frequency: Sometimes
- Owner: Pair
- Plan v1:
  1. Reproduce with visibility/tab pause conditions.
  2. Trace fire spawn/tick catch-up logic on tab resume.
  3. Clamp or gate deferred ticks and verify fix.
- Plan Outcome: Completed
- Fix Notes:
  - Root cause was deterministic startup seeding, not tab-resume catch-up.
  - `initThreeJS()` no longer calls `seedCookingTrainingFires()`, so fresh launches do not begin with pre-seeded route fires.
  - Contract test updated to enforce no init-time fire seeding while preserving cooking route metadata/QA location hooks.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-027 - Skills menu icon opens dedicated progression view
- Status: Fixed
- Severity: S2
- Area: HUD
- Source: Manual
- Links: `index.html`, `src/js/inventory.js`
- Repro:
  1. Click skill icons in skills menu.
- Expected: Each icon opens its skill's dedicated progression menu/view.
- Actual: Dedicated progression view open behavior is missing/incomplete.
- Frequency: Often
- Owner: Pair
- Plan v1:
  1. Define per-skill view routing contract.
  2. Wire skill icon click handlers to dedicated views.
  3. Verify back navigation and state persistence.
- Plan Outcome: Confirmed
- Fix Notes:
  - Expanded the skills popup into a dedicated progression panel with per-skill focus text and an unlock timeline section.
  - Added spec-driven milestone extraction from each skill's runtime spec (`nodeTable`, `recipeSet`, `pouchTable`) so each skill tile now resolves to unique progression content.
  - Hardened panel refresh behavior so only the actively viewed skill updates the panel, preventing cross-skill overwrite noise.
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-029 - Fletching cancel-on-click behavior
- Status: Fixed
- Severity: S1
- Area: FLT
- Source: Manual
- Links: `src/js/input-render.js`
- Repro:
  1. Start active fletching.
  2. Click red-X destination.
- Expected: Fletching cancels only when destination is reached and new action executes.
- Actual: Fletching cancels immediately on click.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Split click intent from action execution.
  2. Defer fletching cancel until movement complete + action starts.
  3. Verify interruptions with blocked paths and alternate targets.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added deferred interact handling for active fletching sessions so interact clicks no longer cancel on click intent alone.
  - While pathing to the clicked target, fletching remains active; cancellation now occurs only once the destination is reached and interact execution begins.
  - Unreachable/blocked targets clear the deferred interact and keep fletching active instead of dropping the action.
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-030 - Fletching XP progression pass (log-tier multiples)
- Status: Fixed
- Severity: S2
- Area: FLT
- Source: Manual
- Links: `src/js/skills/specs.js`, `content/skills/fletching.json`
- Repro:
  1. Review fletching XP values by recipe/log tier.
- Expected: Fletching XP scales as multiples of parent log woodcutting XP.
- Actual: Downstream XP scaling is inconsistent with log tier.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Define XP multiplier table by output type.
  2. Recalculate recipe XP from parent log XP.
  3. Validate leveling speed and economic balance.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added explicit fletching XP multipliers by output family and bound finished-arrow multipliers by metal tier.
  - Recomputed fletching recipe XP from canonical parent-log woodcutting XP values (`logs`, `oak_logs`, `willow_logs`, `maple_logs`, `yew_logs`).
  - Kept multiplier logic centralized in fletching recipe generation so future tier tuning is table-driven.
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-031 - Fletching item level requirement rebalance
- Status: Fixed
- Severity: S2
- Area: FLT
- Source: Manual
- Links: `src/js/skills/specs.js`, `content/skills/fletching.json`
- Repro:
  1. Review fletching item level table by tier.
- Expected: Requirements range from base tier unlock up to two levels below next tier unlock.
- Actual: Current requirement values are outside desired band.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Define target requirement bands per tier.
  2. Update fletching requirement data.
  3. Validate progression pacing and cross-skill parity.
- Plan Outcome: Confirmed
- Fix Notes:
  - Replaced scattered fletching level constants with per-tier offset rules and a band cap helper.
  - All fletching requirement values now resolve within band bounds from base-tier unlock to `next tier unlock - 2` (final tier capped at 48).
  - Applied the same banded requirement logic to log-cut, bow-stringing, headless-arrow, and finished-arrow recipes.
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-032 - Item source-of-truth split (runtime catalog vs content files)
- Status: Fixed
- Severity: S1
- Area: Other
- Source: Manual
- Links: `docs/ASSET_PIPELINE.md`, `content/items/README.txt`, `src/js/content/item-catalog.js`, `src/js/core.js`
- Repro:
  1. Read docs that item definitions live in `content/items/<item_id>.json`.
  2. Trace runtime item loading from `core.js` (`ItemCatalog.buildItemDb`).
  3. Observe runtime uses hard-coded `ITEM_DEFS` in `src/js/content/item-catalog.js` instead of loading `content/items`.
- Expected: One canonical item definition source consumed by runtime and tools.
- Actual: Item metadata exists in both docs/content files and hard-coded runtime JS, creating drift risk.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Pick canonical source (`content/items` or generated runtime artifact) and document it.
  2. Add/adjust build tooling so runtime item DB is generated from canonical source.
  3. Add parity validation to fail CI when runtime and content diverge.
- Plan Outcome: Confirmed
- Fix Notes:
  - Chose `src/js/content/item-catalog.js` as the canonical runtime item-definition source and documented that decision in project docs (`docs/ASSET_PIPELINE.md`, `content/items/README.txt`, `README.md`, `AGENTS.md`).
  - Added item-catalog tooling: `tool:items:sync` now generates `content/items/runtime-item-catalog.json` from runtime `ITEM_DEFS`.
  - Added parity guards so drift fails automation: `tool:items:validate` now checks mirror parity against runtime, and spec-contract tests assert mirror/runtime equality.
  - Updated `npm test` to run item validation, ensuring CI/regression runs catch runtime-content drift immediately.
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-033 - Inline icon sprite registry bypasses asset pipeline
- Status: Fixed
- Severity: S2
- Area: Other
- Source: Manual
- Links: `docs/ASSET_PIPELINE.md`, `index.html`, `src/js/core.js`, `src/js/content/item-catalog.js`, `tools/content/validate-items.js`, `tools/tests/pixel-asset-pipeline-guard.js`
- Repro:
  1. Inspect runtime icon resolution through `src/js/core.js`, `src/js/inventory.js`, and `src/js/content/item-catalog.js`.
  2. Confirm removed sprite-catalog paths stay absent and item icons resolve from pixel asset metadata.
  3. Compare to documented icon pipeline under `assets/pixel/*`.
- Expected: Icon selection/rendering should primarily come from item/content asset metadata.
- Actual: Core runtime carries a hand-maintained sprite map with manual fallback logic.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Move icon mapping responsibility into item metadata (or generated catalog metadata).
  2. Keep a small generic fallback path only for missing assets.
  3. Add validation for missing icon references and fallback usage counts.
- Plan Outcome: Confirmed
- Fix Notes:
  - Promoted pixel-source assets and `src/js/content/item-catalog.js` icon metadata to the active icon source of truth, replacing the removed sprite catalog path.
  - Removed the `makeIconSprite` / `window.IconSpriteCatalog` flow from `src/js/core.js`; runtime icons now resolve through pixel asset metadata with a small missing-icon placeholder fallback.
  - `tools/content/validate-items.js` checks runtime icon metadata against available pixel assets so missing generated icon references fail validation.
  - `tools/tests/pixel-asset-pipeline-guard.js` locks the removed icon-sprite catalog and legacy pixelization tools out of the runtime path.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-034 - World layout and service placement are embedded in `initLogicalMap`
- Status: Fixed
- Severity: S1
- Area: WORLD
- Source: Manual
- Links: `content/world/manifest.json`, `content/world/regions/main_overworld.json`, `src/game/world/authoring.ts`, `src/game/world/bootstrap.ts`, `src/game/platform/legacy-world-adapter.ts`, `src/js/world.js`, `tools/tests/world-authoring-domain-tests.js`, `tools/tests/world-bootstrap-parity.js`
- Repro:
  1. Inspect the canonical world files in `content/world/manifest.json` and `content/world/regions/main_overworld.json`.
  2. Follow that authored data through `src/game/world/authoring.ts`, `src/game/world/bootstrap.ts`, and `src/game/platform/legacy-world-adapter.ts`.
  3. Compare the current `worldPayload` flow in `src/js/world.js` against this hit card.
- Expected: Building layouts, NPC/service spawns, and tile edits should come from structured world data files/manifests.
- Actual: The repo already ships structured world authoring for stamps, structures, services, staircases, routes, combat spawns, and landmarks in canonical `content/world/*` files. `initLogicalMap` still applies the published payload into the legacy tile map, but the primary layout/service truth is now loaded by the typed authoring/bootstrap pipeline and exposed through `LegacyWorldAdapterRuntime`.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Define a world layout schema (buildings, stamps, objects, post-stamp edits).
  2. Move current inline layout/spawn definitions into content data files.
  3. Implement a loader/applier and validate parity against current map.
- Plan Outcome: Confirmed
- Fix Notes:
  - `content/world/manifest.json` plus `content/world/regions/main_overworld.json` now own the authored structure kit, service placements, staircases, routes, combat spawns, and other world landmarks instead of leaving those as inline source-of-truth arrays in `initLogicalMap`.
  - `src/game/world/authoring.ts` and `src/game/world/bootstrap.ts` load that canonical content into typed world definitions, registries, and legacy render/bootstrap payloads.
  - `src/game/platform/legacy-world-adapter.ts` publishes the current `worldPayload`, and `src/js/world.js` consumes that payload to stamp/apply the already-authored data into the legacy tile map rather than owning the world/service layout itself.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-035 - Training route tuning lives in hard-coded zone/band arrays
- Status: Fixed
- Severity: S2
- Area: WORLD
- Source: Manual
- Links: `content/world/regions/main_overworld.json`, `src/game/world/authoring.ts`, `src/game/world/placements.ts`, `src/game/platform/legacy-bridge.ts`, `src/game/platform/legacy-world-adapter.ts`, `src/js/core.js`, `tools/tests/qa-registry-parity.js`, `tools/tests/world-bootstrap-parity.js`, `tools/tests/world-authoring-domain-tests.js`, `tools/tests/legacy-world-runtime-shape.js`
- Repro:
  1. Inspect canonical skill-route authoring in `content/world/regions/main_overworld.json`.
  2. Follow the world bootstrap/legacy bridge path through `src/game/world/authoring.ts`, `src/game/world/placements.ts`, `src/game/platform/legacy-bridge.ts`, and `src/game/platform/legacy-world-adapter.ts`.
  3. Compare QA route lookups in `src/js/core.js` against those runtime route registries.
- Expected: Route/ring/zone progression tuning should be data-driven with centralized authoring.
- Actual: Skill-route tuning already ships from canonical world `skillRoutes` authoring, flows through the typed world bootstrap/route registry, and is consumed by QA helpers via runtime route discovery before falling back to emergency hard-coded anchors.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Create skill route config files for zone bands, counts, spacing, and labels.
  2. Refactor placement logic to read and validate those configs.
  3. Update QA route lookups to consume runtime-generated route metadata only.
- Plan Outcome: Confirmed
- Fix Notes:
  - Route tuning no longer lives in `src/js/world.js`; canonical route/ring/zone metadata is authored under each world's `skillRoutes` block in `content/world/regions/*.json`, then scaled/aligned in `src/game/world/authoring.ts`.
  - `src/game/world/placements.ts`, `src/game/platform/legacy-bridge.ts`, and `src/game/platform/legacy-world-adapter.ts` now publish those authored route groups through the typed route registry and legacy compatibility payloads instead of relying on runtime-owned zone/band arrays.
  - QA route lookups in `src/js/core.js` read world route groups first (`getWorldRouteGroup(...)`) and only fall back to hard-coded anchors when no runtime route data is available, so the original duplication risk described by this hit has already been retired.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-036 - Context menu behavior is a monolithic hard-coded branch
- Status: Fixed
- Severity: S2
- Area: HUD
- Source: Manual
- Links: `src/js/input-render.js`, `src/js/interactions/target-interaction-registry.js`, `src/js/skills/runtime.js`, `index.html`, `tools/tests/context-menu-registry-guard.js`, `package.json`
- Repro:
  1. Inspect `onContextMenu` in `src/js/input-render.js`.
  2. Observe a long `if/else` chain keyed on `hitData.type` with embedded action labels/messages.
  3. Observe target-specific exceptions (for example Shopkeeper/general_store) inside UI-layer logic.
- Expected: Interactions should resolve from a registry/manifest so new target types can be added without expanding a single branch.
- Actual: UI interaction behavior is centralized in a brittle conditional block with mixed gameplay/UI responsibilities.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Define a target interaction registry contract (`actions`, `examine`, `priority`, `guards`).
  2. Migrate existing target handlers into per-domain modules.
  3. Keep `onContextMenu` as a generic renderer over resolved actions.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added a dedicated target interaction registry module (`src/js/interactions/target-interaction-registry.js`) with per-target specs using the `actions`/`examine`/`priority`/`guards` contract and a registration API for new target types.
  - Refactored `onContextMenu` in `src/js/input-render.js` to stay skill-first (`SkillRuntime.getSkillContextMenuOptions`) and then resolve non-skill world interactions through `TargetInteractionRegistry.resolveOptions(...)`.
  - Moved hard-coded target interaction behavior (tree, rock, fire, smithing stations, NPCs, doors, ground items, etc.) out of the UI branch chain and into registry-owned handlers while preserving existing option labels/behavior.
  - Added a context-menu regression guard test (`tools/tests/context-menu-registry-guard.js`) and wired it into `npm test`.
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-037 - Tile semantics rely on magic numbers across runtime
- Status: Fixed
- Severity: S2
- Area: WORLD
- Source: Manual
- Links: `src/js/core.js`, `src/js/world.js`, `src/js/input-render.js`, `tools/tests/tile-semantics-guard.js`, `package.json`
- Repro:
  1. Inspect tile ID comments and `WALKABLE_TILES` in `src/js/core.js`.
  2. Search for direct numeric checks (`tile === 21`, `tile === 22`, etc.) in world/input systems.
  3. Observe repeated hard-coded tile meaning assumptions in multiple modules.
- Expected: Tile IDs and properties should be centralized via enum/constants + tile metadata helpers.
- Actual: Numeric literals are repeated in many places, increasing regression risk when tile semantics evolve.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Introduce `TileId` constants and shared helpers (`isWater`, `isWalkable`, `isNatural`).
  2. Replace numeric comparisons across world/input/render code.
  3. Add a quick lint/test guard for direct literal tile comparisons.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added a canonical `TileId` enum in `src/js/core.js` with shared semantic helpers (`isWaterTileId`, `isNaturalTileId`, `isTreeTileId`, `isWalkableTileId`, `isDoorTileId`) and exported them to runtime globals.
  - Replaced direct numeric tile comparisons across `src/js/world.js` and `src/js/input-render.js` with `TileId` constants and semantic helper predicates.
  - Added `tools/tests/tile-semantics-guard.js` and wired it into `npm test` so future direct numeric tile comparisons in `core/world/input-render` fail fast.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-038 - QA location aliases and openable merchant list are manually duplicated
- Status: Fixed
- Severity: S3
- Area: Other
- Source: Manual
- Links: `src/js/core.js`, `src/js/world.js`, `src/js/shop-economy.js`
- Repro:
  1. Inspect QA helpers in `src/js/core.js` (`getQaFishingSpots`, `getQaCookingSpots`, `getQaFishingMerchants`, merchant alias map, `qaOpenableMerchants` list).
  2. Compare against runtime world/merchant placement sources in `src/js/world.js` and merchant config in specs/economy.
  3. Observe QA command behavior depends on manually curated coordinate/alias lists.
- Expected: QA discoverability should derive from runtime world entities and merchant configs.
- Actual: Multiple QA lists require manual syncing and can drift from live map/shop data.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Build a QA discovery layer over runtime world entities and merchant config.
  2. Replace hard-coded merchant ID and coordinate lists with generated maps.
  3. Keep alias support but generate defaults from canonical merchant/world registries.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added runtime fishing QA location discovery via `window.getFishingTrainingLocations()` in `src/js/world.js` and updated `getQaFishingSpots()` in `src/js/core.js` to use it with fallback safety.
  - Added `ShopEconomy.getConfiguredMerchantIds()` + `ShopEconomy.isKnownMerchantId()` in `src/js/shop-economy.js`, then switched `/qa openshop` usage/validation to generated merchant IDs (`getQaOpenableMerchantIds()` + `formatQaOpenShopUsage()`).
  - Replaced manual QA merchant coordinate and alias tables with discovery helpers in `src/js/core.js` (`getQaDiscoveredMerchants()`, generated alias map seeded with stable shorthand aliases, and fishing-merchant discovery from live NPC merchant placements).
  - Extended spec contract guards in `tools/tests/spec-contracts.js` to enforce the new discovery APIs and prevent regression back to hard-coded QA merchant lists.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-039 - Shop fallback stock is hard-coded in UI inventory module
- Status: Fixed
- Severity: S2
- Area: Other
- Source: Manual
- Links: `src/js/inventory.js`, `src/js/shop-economy.js`, `src/js/skills/specs.js`
- Repro:
  1. Inspect `createShopInventoryForMerchant` in `src/js/inventory.js`.
  2. Follow non-configured merchant path and observe fixed fallback items/amounts (`iron_axe`, `tinderbox`, `knife`, `iron_pickaxe`).
  3. Compare with merchant economy rules in specs/economy modules.
- Expected: Base shop stock should be configured in economy/content data, not embedded in UI runtime code.
- Actual: Fallback stock policy is hard-coded in inventory rendering logic.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Move fallback stock policy into economy config (for example `general_store` baseline).
  2. Keep inventory module read-only against resolved economy stock.
  3. Add validation for merchants missing both explicit config and fallback policy.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added `generalStoreFallback.defaultStock` economy rows in skill specs for `iron_axe`, `tinderbox`, `knife`, and `iron_pickaxe` so default `general_store` stock is data-driven.
  - Added `ShopEconomy.getMerchantSeedStockRows(...)` and wired `inventory.js` to consume those rows; removed hard-coded fallback stock items from `createShopInventoryForMerchant`.
  - Added `ShopEconomy.hasStockPolicy(...)` validation and inventory-side warning when a merchant has neither explicit stock config nor fallback stock policy.
  - Extended spec contract tests to assert general-store fallback seed rows and stock-policy validation behavior.
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-040 - Skills panel tiles are hard-coded in HTML instead of manifest-driven
- Status: Fixed
- Severity: S3
- Area: HUD
- Source: Manual
- Links: `index.html`, `src/js/skills/manifest.js`, `src/js/inventory.js`
- Repro:
  1. Inspect the `#view-stats` block in `index.html`.
  2. Observe each skill tile is hand-authored markup with duplicated IDs/labels.
  3. Compare with `SkillManifest.orderedSkillIds` and runtime skill metadata usage.
- Expected: Skill tile rendering should be generated from a single manifest/data model.
- Actual: Adding/removing/reordering skills requires manual HTML + JS updates in multiple places.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Expand skill manifest to include icon/label/UI metadata.
  2. Generate skill tiles at runtime from manifest order.
  3. Keep DOM IDs/data attributes deterministic for existing hooks/tests.
- Plan Outcome: Confirmed
- Fix Notes:
  - Expanded `SkillManifest` with canonical `skillTiles` UI metadata (`skillId`, `displayName`, `icon`, `levelKey`) and a generated `skillTileBySkillId` lookup map.
  - Removed hand-authored skill tiles from `index.html`; `inventory.js` now renders `#view-stats` tiles from manifest data at runtime.
  - Preserved deterministic IDs and hook compatibility by generating `stat-${levelKey}-level` IDs and the existing `.skill-tile` `data-*` attributes used by skill panel interactions.
  - Updated `refreshSkillUi` in `world.js` to resolve stat level keys from manifest metadata, with a legacy fallback map for resilience.
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-041 - Player appearance/model definitions are hard-coded in runtime
- Status: Fixed
- Severity: S3
- Area: Other
- Source: Manual
- Links: `src/js/content/player-appearance-catalog.js`, `src/js/player-model.js`, `index.html`, `tools/tests/player-appearance-catalog-guard.js`
- Repro:
  1. Inspect `src/js/player-model.js`.
  2. Observe large inline tables for body palettes, default kits, kit fragments, and equipment fragment geometry/offsets.
  3. Note that changing appearance presets or adding variants requires direct code edits.
- Expected: Character appearance definitions should be data-driven (content/config) with runtime focused on rendering/assembly.
- Actual: Appearance/model tuning data is embedded in JS, making iteration and content authoring harder over time.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Define appearance schema for palettes, kits, and fragment definitions.
  2. Move static appearance tables out of runtime code into content data.
  3. Keep runtime loader/validator to preserve existing visuals while enabling easier content updates.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added a dedicated appearance content catalog at `src/js/content/player-appearance-catalog.js` that now owns slot order, body palettes, default kits, kit fragments, and item fragment definitions.
  - Refactored `src/js/player-model.js` to load appearance/model definitions from `window.PlayerAppearanceCatalog` and fail fast if the catalog script is missing or malformed.
  - Wired the new catalog into `index.html` load order and added `tools/tests/player-appearance-catalog-guard.js` (included in `npm test`) to prevent regression back to inline appearance tables.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-045 - Firemaking progression is still logs-only instead of all log tiers
- Status: Fixed
- Severity: S2
- Area: BUG
- Source: Manual
- Links: `src/js/skills/firemaking/index.js`, `content/skills/firemaking.json`, `src/js/skills/specs.js`, `src/js/world.js`, `tools/tests/spec-contracts.js`
- Repro:
  1. Put a `tinderbox` in inventory with `oak_logs`, `willow_logs`, `maple_logs`, or `yew_logs`.
  2. Try to use the tinderbox on any of those log items to start firemaking.
  3. Compare the result with using `tinderbox` on regular `logs`.
- Expected: Firemaking should support every canonical log tier (`logs`, `oak_logs`, `willow_logs`, `maple_logs`, `yew_logs`) with proper progression data instead of a regular-logs-only ruleset.
- Actual: Firemaking currently only accepts regular `logs`; higher-tier logs do not start the action, and the current data/spec guardrails explicitly preserve the undesired single-tier `logs`-only flow.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Audit runtime interaction checks and skill recipe/spec data for log-to-firemaking eligibility.
  2. Replace the current single-tier firemaking data model with explicit all-tier log progression and validation rules.
  3. Implement/support multi-tier log lighting and add regression coverage for every canonical log tier.
- Plan Outcome: Completed
- Fix Notes:
  - Added canonical firemaking recipes for `logs`, `oak_logs`, `willow_logs`, `maple_logs`, and `yew_logs` in runtime/content skill specs with tiered level, difficulty, XP, and economy rows.
  - Updated firemaking interaction resolution so using `tinderbox` with any canonical log tier preserves the chosen log type when starting the action.
  - Replaced the old woodcutting-demand single-tier firemaking guard with all-tier coverage checks and added regression coverage for every canonical log tier in the runtime tests.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-046 - Skills menu needs logical organization and full tier-by-tier coverage
- Status: Fixed
- Severity: S2
- Area: HUD
- Source: Manual
- Links: `src/js/inventory.js`, `src/js/skills/_index.md`, `src/js/skills/woodcutting/ROADMAP.md`, `src/js/skills/firemaking/ROADMAP.md`, `src/js/skills/fishing/ROADMAP.md`, `src/js/skills/specs.js`
- Repro:
  1. Open the skills menu and drill into several different skills.
  2. Compare how progression information is grouped, labeled, and exposed across skill tiers.
  3. Look for whether each skill surfaces a complete tier-by-tier reference for unlocks, methods, outputs, and other important progression info.
- Expected: Skills menus should be organized consistently and logically, with every skill exposing complete tier-by-tier progression information in a way that is easy to scan and compare.
- Actual: The current skills/progression UI has a good baseline, but the organization and depth of information are not yet serving as a complete, consistent per-tier reference across every skill.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Audit the current skills-menu information architecture and identify where tier coverage is missing, unclear, or inconsistent by skill.
  2. Define a shared per-tier presentation model for skill menus so unlocks, methods, outputs, and progression notes render in a predictable structure.
  3. Implement the menu improvements incrementally and, when a partial pass leaves meaningful gaps, add follow-up hits for the remaining skills or menu sections.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added a typed skill-reference panel view model in the UI domain so the skills panel now groups authored unlocks by canonical level bands instead of only by raw unlock level rows.
  - The live skills panel now renders a compact band summary plus tier sections for every authored level band, including empty/current/next bands, so coverage stays complete even when a band has no new unlock rows.
  - Added inventory/HUD regression coverage for spec-backed band grouping and combat-skill fallback bands, and verified the inventory/HUD guard plus repo `check` pass after wiring the new panel path.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

## Ready to Hunt
<!-- Triaged, scoped, ready for implementation -->

## In Progress
<!-- Actively being worked -->

## Blocked
<!-- Waiting on decision/dependency/repro -->

## Fixed (Pending Verify)
<!-- Code fix landed, waiting for confirmation pass -->

### HIT-075 - Building workbench draft layer for authored mainland towns
- Status: Fixed
- Severity: S2
- Area: WORLD
- Source: Automation
- Links: `docs/BUILDING_WORKBENCH.md`, `content/world/building-workbench/`, `tools/content/building-workbench.js`, `tools/tests/building-workbench-guard.js`, `package.json`, `src/game/contracts/world.ts`
- Repro:
  1. Review `HIT-001` and the current authored-map direction for mainland world work.
  2. Try to draft a reusable building, settlement, road profile, damaged-state variant, or NPC-home plan without writing directly into canonical world regions/stamps.
- Expected: Mainland town/building drafts have a Codex-first authoring layer with validation, preview artifacts, reusable grammar, and a deliberate promotion path into canonical world content.
- Actual: Building and settlement exploration previously had no dedicated draft layer, increasing pressure to hand-author one-off structures directly in live world files.
- Frequency: N/A (non-bug task)
- Owner: Codex
- Plan v1:
  1. Add a preview-only building workbench under `content/world/building-workbench/` with reusable archetypes, materials, conditions, road profiles, themes, buildings, and settlements.
  2. Add validator, preview, and dry-run promotion CLI paths that compile draft stamp JSON, settlement summaries, promotion candidates, and a local Three.js review page without mutating canonical world content.
  3. Wire focused package scripts and guard coverage so the draft layer stays schema-valid and separate from live stamps/regions.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added a seed workbench covering timber frontier, quarry iron, stone market, painted plaster, burnt/broken/abandoned states, castle gatehouse pieces, banks, artisan shops, and four settlement drafts.
  - Added `npm.cmd run tool:world:buildings`, `npm.cmd run tool:world:buildings:preview`, and `npm.cmd run tool:world:buildings:promote`; preview output writes to `tmp/world-building-workbench`, while promotion dry-runs write copy-ready stamp, manifest, region, road, decor, roof, wall-art, and NPC-home candidates under `tmp/world-building-workbench/promotions/<settlementId>`.
  - Added `tools/tests/building-workbench-guard.js` and package-suite coverage to enforce draft IDs, no canonical stamp writes, preview artifact shape, workbench grammar, and supported decor kinds.
  - Promoted the first mainland spread pass into `main_overworld`: north woodwatch, south quarry hamlet, market crossing, and old roadhold, with authored water bodies replacing the legacy north-south river fallback and `tools/tests/mainland-rework-guard.js` covering spread, homes, roads, stairs, roofs, decor, and raw coordinate bounds.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-076 - Combat camp ally-assist group
- Status: Fixed
- Severity: S2
- Area: WORLD
- Source: Automation
- Links: `src/js/skills/combat/STATUS.md`, `src/js/skills/combat/ROADMAP.md`, `src/js/combat-engagement-runtime.js`, `src/game/contracts/combat.ts`, `src/game/platform/combat-bridge.ts`, `src/game/combat/content.ts`, `content/world/regions/main_overworld.json`, `tools/tests/combat-engagement-runtime-guard.js`, `tools/tests/combat-engagement-guard.js`, `tools/tests/combat-domain-tests.js`, `tools/tests/world-bootstrap-parity.js`
- Repro:
  1. Review the open `COMBAT-016` tracker item and the combat roadmap's advanced encounter-logic follow-up.
  2. Attack one enemy in the authored southeast camp-threat pocket.
- Expected: Dense camp-threat encounters can opt into readable group pressure without making every spawn group share aggro by default.
- Actual: Spawn groups were previously placement-only and could not express bounded ally-assist behavior.
- Frequency: Always
- Owner: Codex
- Plan v1:
  1. Extend the combat spawn/runtime contract with explicit assist group and assist radius fields.
  2. Add engagement runtime logic that pulls nearby idle allies from the same assist group onto the player with a one-tick opening delay.
  3. Enable the first live assist group on the southeast camp-threat pocket and lock the behavior with focused guards.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added `assistGroupId` and `assistRadiusOverride` to combat spawn authoring, bridge normalization, and enemy runtime state resolution.
  - Added `acquireAssistingEnemyTargets` to the engagement runtime and invoked it after normal aggressive acquisition, keeping assist behavior opt-in and bounded by reachability, chase range, and assist radius.
  - Enabled `camp_southeast_ruins` assist behavior on the bear, heavy brute, and fast striker camp spawns in `main_overworld`.
  - Synced combat status, roadmap, and skills index so patrol-route/richer-state work remains open as `COMBAT-016B` instead of overclaiming the whole advanced encounter milestone.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-077 - Combat camp fast-striker patrol route
- Status: Fixed
- Severity: S2
- Area: WORLD
- Source: Automation
- Links: `src/js/skills/combat/STATUS.md`, `src/js/skills/combat/ROADMAP.md`, `src/js/combat-enemy-movement-runtime.js`, `src/game/contracts/combat.ts`, `src/game/platform/combat-bridge.ts`, `src/game/combat/content.ts`, `content/world/regions/main_overworld.json`, `tools/content/validate-world.js`, `tools/tests/combat-enemy-movement-runtime-guard.js`, `tools/tests/combat-domain-tests.js`, `tools/tests/world-authoring-domain-tests.js`, `tools/tests/world-bootstrap-parity.js`
- Repro:
  1. Review the open `COMBAT-016B` tracker item and the combat roadmap's patrol-route follow-up.
  2. Inspect authored southeast camp-threat combat spawns.
- Expected: At least one camp enemy can follow an authored idle patrol route without replacing leash/return combat behavior.
- Actual: Camp enemies only had random radius roaming or fixed home behavior; patrol-route authoring was not part of the spawn/runtime contract.
- Frequency: Always
- Owner: Codex
- Plan v1:
  1. Extend the combat spawn/runtime contract with optional `patrolRoute` points.
  2. Make idle enemy movement prefer authored patrol routes before random roaming.
  3. Enable the first live patrol route on the southeast camp fast striker and lock it with focused guards.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added `patrolRoute` to combat spawn authoring, typed clones, bridge normalization, scaled world authoring, runtime spawn state, and world validation.
  - Added `updatePatrolEnemyMovement` so idle enemies advance one tile per tick along authored patrol points, pause at patrol stops, and still use the existing leash/return behavior once combat starts.
  - Enabled the first live patrol on `enemy_spawn_fast_striker_southeast_camp_east` in `main_overworld` and advanced combat tracking to `COMBAT-017`.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-074 - Runecrafting altar labels hid route status
- Status: Fixed
- Severity: S3
- Area: Other
- Source: Automation
- Links: `src/js/skills/runecrafting/index.js`, `tools/tests/runecrafting-runtime-tests.js`, `src/js/skills/runecrafting/ROADMAP.md`, `src/js/skills/runecrafting/STATUS.md`, `src/js/skills/_index.md`
- Repro:
  1. Hover or right-click an elemental altar while carrying a secondary rune for a combination route.
  2. Repeat while missing enough secondary runes for one scaled output, or while a queued altar craft target changes before resolution.
- Expected: The altar UI should show the selected output route and immediate missing-input/lock hints, and queued altar interruption should explain why crafting stopped.
- Actual: Altar labels only showed the altar name/output, and some target-change interruption states stopped without player-facing feedback.
- Frequency: Often
- Owner: Codex
- Plan v1:
  1. Add selected-output and missing-input route hints to altar tooltip/context-menu labels.
  2. Stop queued altar crafts if the selected target drifts before the craft tick.
  3. Add focused runecrafting runtime coverage and sync the tracker docs.
- Plan Outcome: Confirmed
- Fix Notes:
  - Altar hover and context menu labels now include selected output plus route status such as `using air rune`, `need rune essence`, `need 2 air runes`, `need level N`, or `quest locked`.
  - Queued altar crafts now stop with explicit feedback if the selected altar target/coordinates change before resolution, without consuming essence or granting output.
  - Extended runecrafting runtime QA coverage for route labels and target-drift interruption.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-073 - Runecrafting combination failure lacked secondary-rune feedback
- Status: Fixed
- Severity: S3
- Area: Other
- Source: Automation
- Links: `src/js/skills/runecrafting/index.js`, `tools/tests/runecrafting-runtime-tests.js`, `src/js/skills/runecrafting/ROADMAP.md`, `src/js/skills/runecrafting/STATUS.md`, `src/js/skills/_index.md`
- Repro:
  1. Reach level 50 Runecrafting with combination runecrafting unlocked.
  2. Carry rune essence and only one matching secondary rune for a combination route, such as one air rune at the Ember Altar.
  3. Attempt to craft the selected combination rune.
- Expected: The altar action should explain that the carried secondary runes cannot support even one essence at the current output multiplier.
- Actual: The selected combination action could start and then silently stop when the craft plan found too few secondary runes.
- Frequency: Often
- Owner: Codex
- Plan v1:
  1. Validate the selected runecrafting craft plan before starting the altar action.
  2. Reuse the same explicit failure message if secondary runes disappear before the craft tick.
  3. Add focused runtime coverage for blocked, interrupted, and valid partial-secondary combination crafts.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added explicit secondary-rune requirement feedback for under-supplied combination routes before start and during tick-time revalidation.
  - Preserved valid partial-secondary combination crafting when the carried secondary rune count can support at least one essence.
  - Added `tools/tests/runecrafting-runtime-tests.js`, wired it to `npm.cmd run test:qa:runecrafting`, and included it in the package test suite manifest.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-072 - Runecrafting balance lacked travel-adjusted guardrails
- Status: Fixed
- Severity: S2
- Area: Other
- Source: Automation
- Links: `src/js/skills/specs.js`, `src/js/skills/spec-registry.js`, `src/js/skills/runecrafting/ROADMAP.md`, `src/js/skills/runecrafting/STATUS.md`, `content/skills/runecrafting.json`, `tools/tests/spec-contracts.js`, `tools/tests/spec-doc-parity.js`
- Repro:
  1. Review the open `RUNECRAFTING-014` milestone in the runecrafting status board.
  2. Compare elemental and combination XP/value tables against the 1-tick altar action.
  3. Check whether route-travel overhead is represented in runtime-backed balance summaries.
- Expected: Runecrafting should have locked XP/value-per-action and travel-adjusted pacing benchmarks for elemental and combination rune routes.
- Actual: Economy and integration contracts existed, but there was no runecrafting balance helper, spec guard, or roadmap parity table for route-adjusted pacing.
- Frequency: Always
- Owner: Codex
- Plan v1:
  1. Add canonical runecrafting level bands, route-travel benchmark assumptions, and monotonic XP tuning in the authored skill spec.
  2. Expose registry balance metrics for elemental and combination recipes, then guard them in spec contracts.
  3. Document tier-entry, level-40, and preferred-combination benchmarks and advance the runecrafting tracker.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added `SkillSpecRegistry.computeRunecraftingRecipeMetrics()` and `getRunecraftingBalanceSummary()` with per-action and travel-adjusted XP/value outputs.
  - Rebalanced elemental XP per essence to climb across water/earth/air and lifted combination XP per essence to keep level-40 routes ahead of elemental entry benchmarks.
  - Added route-overhead assumptions and benchmark tables to the runecrafting roadmap, then locked them with spec-contract and spec-doc-parity coverage.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-071 - Runecrafting cross-skill integration contract
- Status: Fixed
- Severity: S2
- Area: Other
- Source: Automation
- Links: `src/js/skills/specs.js`, `src/js/skills/spec-registry.js`, `src/js/skills/runecrafting/ROADMAP.md`, `src/js/skills/runecrafting/STATUS.md`, `src/js/skills/_index.md`, `tools/tests/spec-contracts.js`, `tools/tests/spec-doc-parity.js`
- Repro:
  1. Review the open `RUNECRAFTING-012` milestone in the runecrafting status board.
  2. Compare the runecrafting roadmap dependency notes against canonical mining essence data and future magic rune-demand assumptions.
  3. Check whether a runtime/spec guard can prove rune essence supply and crafted rune demand stay aligned.
- Expected: Runecrafting should explicitly lock mining as the rune-essence source and Magic as the future sink for every craftable elemental and combination rune.
- Actual: The roadmap described Mining and Magic as dependencies, but the canonical spec had no integration contract or registry summary tying those loops to live mining nodes, rune outputs, item stackability, and economy rows.
- Frequency: Always
- Owner: Codex
- Plan v1:
  1. Add a runecrafting integration contract in the authored skill spec for mining essence supply and future magic rune demand.
  2. Expose a registry summary helper and focused contract assertions so drift is caught by spec guards.
  3. Sync the runecrafting roadmap/status/index docs and generated skill mirror.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added `integration.miningEssenceSource` and `integration.magicRuneDemand` to the canonical runecrafting skill spec.
  - Added `SkillSpecRegistry.getRunecraftingIntegrationSummary()` plus spec-contract coverage for persistent mining essence, stackable craftable rune outputs, and runecrafting economy coverage.
  - Documented the cross-skill contract in the runecrafting roadmap and advanced the runecrafting tracker from `RUNECRAFTING-012` to the balance pass.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-070 - Camp-threat combat band had no live authored spawns
- Status: Fixed
- Severity: S2
- Area: Other
- Source: Manual
- Links: `content/world/regions/main_overworld.json`, `src/js/skills/combat/STATUS.md`, `src/js/skills/combat/ROADMAP.md`, `src/js/skills/_index.md`, `tools/tests/combat-enemy-content-guard.js`, `tools/tests/world-authoring-domain-tests.js`, `tools/tests/world-bootstrap-parity.js`
- Repro:
  1. Review the live combat progression-band summaries after `COMBAT-014`.
  2. Compare `Camp Threat` enemies against authored `main_overworld` combat spawn nodes.
  3. Check whether bear, heavy brute, and fast striker have any live camp placement.
- Expected: The first-pass melee rollout should include at least one optional camp-threat pocket using the same authored spawn-node model as starter, roadside, resource-outskirts, and guard-threshold coverage.
- Actual: The camp-threat band mapped bear, heavy brute, and fast striker enemy templates but still had zero live authored spawns.
- Frequency: Always
- Owner: Codex
- Plan v1:
  1. Add a small optional camp-threat pocket in the authored world content without resurrecting the removed `north_road_camp` region.
  2. Lock its authored placement, world parity, and progression-band summary counts with focused guards.
  3. Sync combat status, roadmap, and shared skill index docs to advance the tracker beyond `COMBAT-015`.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added the `camp_southeast_ruins` spawn group in `main_overworld` with one bear, one heavy brute, and one fast striker placed on the southeast edge away from protected training/resource route anchors.
  - Extended combat content and world parity coverage so the camp count and authored placement cannot drift silently.
  - Updated combat content/world parity guards so the camp-threat band now reports three live starter-town spawns and the authored spawn order/count cannot drift silently.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-069 - Combat progression bands lacked an authored contract
- Status: Fixed
- Severity: S2
- Area: Other
- Source: Manual
- Links: `src/game/contracts/combat.ts`, `src/game/combat/content.ts`, `src/game/platform/combat-bridge.ts`, `tools/tests/combat-enemy-content-guard.js`, `tools/tests/combat-simulator-guard.js`, `src/js/skills/combat/ROADMAP.md`, `src/js/skills/combat/STATUS.md`, `src/js/skills/_index.md`
- Repro:
  1. Review the open `COMBAT-014` milestone and combat roadmap follow-up.
  2. Compare live enemy templates, first-pass loot benchmarks, and authored starter-town spawn groups.
  3. Try to answer which enemies belong to starter, mid-band, camp, or later-region rollout bands from code.
- Expected: Combat content should expose a stable progression-band contract so enemy difficulty, drop ceilings, and placement guidance scale cleanly before adding more regions.
- Actual: Enemy templates, loot benchmarks, and spawn groups existed, but the progression-band mapping lived only as roadmap intent rather than typed content data or focused guard coverage.
- Frequency: Always
- Owner: Codex
- Plan v1:
  1. Add a typed progression-band contract around live enemy templates and future region anchors.
  2. Expose enemy/world summary helpers for QA and future encounter authoring.
  3. Lock the contract with focused combat guards and sync the combat tracker docs.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added typed combat progression-band definitions for starter opt-in, starter roadside, resource outskirts, guarded threshold, camp threat, and deferred later-region anchors.
  - Exposed `listCombatProgressionBands()`, `getCombatProgressionBandForEnemy()`, and `listCombatProgressionBandWorldSummaries(worldId)` through typed combat content and the legacy combat bridge.
  - Extended combat content/simulator guards to verify exact enemy-to-band assignments, starter-town band spawn counts, cloned API results, roadmap table coverage, and tracker advancement to `COMBAT-015`.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-068 - Combat simulator missing after dummy path removal
- Status: Fixed
- Severity: S2
- Area: BUG
- Source: Manual
- Links: `tools/sim/melee-sim.js`, `tools/tests/combat-simulator-guard.js`, `package.json`, `src/js/skills/combat/ROADMAP.md`, `src/js/skills/combat/STATUS.md`, `src/js/skills/_index.md`
- Repro:
  1. Review the open `COMBAT-013` status item and the combat roadmap recommendation to rebuild the simulator.
  2. Check `tools/sim/` and `package.json` after the old dummy simulator path was removed.
  3. Try to run a deterministic combat matchup against typed enemy/item data.
- Expected: A simulator should exercise canonical melee formulas, typed enemy content, and runtime item combat profiles without restoring the old dummy combat route.
- Actual: Only the loot simulator existed; there was no canonical melee matchup simulator or guard for formula/content wiring.
- Frequency: Always
- Owner: Codex
- Plan v1:
  1. Add a deterministic melee simulator that loads typed combat content, shared formulas, and runtime item profiles.
  2. Expose it through a non-legacy package script and guard it with focused regression coverage.
  3. Update the combat roadmap/status/index once the simulator is live.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added `tools/sim/melee-sim.js`, which simulates player-vs-enemy melee matchups using `computePlayerMeleeCombatSnapshot`, `computeEnemyMeleeCombatSnapshot`, `rollOpposedHitCheck`, and `rollDamage`.
  - Added `npm.cmd run tool:sim:melee` plus `npm.cmd run test:combat:sim`; the guard verifies the simulator uses typed combat sources and keeps the removed `tool:sim:combat` path absent.
  - Documented the simulator usage in the combat roadmap and advanced combat tracking from `COMBAT-013` to `COMBAT-014`.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-067 - Woodcutting merchant progression still lived only in specs and roadmap notes
- Status: Fixed
- Severity: S2
- Area: WC
- Source: Manual
- Links: `content/world/regions/main_overworld.json`, `src/js/content/npc-dialogue-catalog.js`, `src/js/content/quest-catalog.js`, `src/js/skills/woodcutting/ROADMAP.md`, `src/js/skills/woodcutting/STATUS.md`, `src/js/skills/_index.md`, `tools/tests/world-authoring-domain-tests.js`, `tools/tests/world-bootstrap-parity.js`, `tools/tests/quest-tanner-runtime-guard.js`
- Repro:
  1. Review the open `WOODCUTTING-013` milestone and the merchant/NPC section in the woodcutting roadmap.
  2. Search the authored world and dialogue content for `forester_teacher` or `advanced_woodsman`.
  3. Try to find a live deeper-band woodcutting buyer or open the Advanced Woodsman shop before proving any later log progression.
- Expected: Woodcutting should expose its documented starter mentor and deeper woodsman in authored world content, and the later axe-and-log ledger should have a concrete progression gate instead of opening only by spec assumption.
- Actual: The woodcutting skill spec already defined `forester_teacher` and `advanced_woodsman` merchant stock, and QA aliases already anticipated both IDs, but neither NPC existed in authored world/dialogue content and no live quest gate tied the deeper woodsman ledger to late-band log progression.
- Frequency: Always
- Owner: Codex
- Plan v1:
  1. Add the missing woodcutting merchants to the authored starter-town and north-road world services with real dialogue IDs.
  2. Reuse the merchant-unlock quest runtime for the Advanced Woodsman instead of inventing a bespoke shop lock.
  3. Add focused world/quest regression coverage and sync the woodcutting roadmap/status/index once the progression path is live.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added a live `forester_teacher` merchant in Starter Town plus an `advanced_woodsman` merchant at the north-road outpost, both wired through the existing authored world-service and dialogue surfaces.
  - Added the authored quest `Proof of the Grain`, which auto-starts from the Advanced Woodsman and unlocks his full ledger after a `willow_logs` + `maple_logs` + `yew_logs` turn-in.
  - Updated the woodcutting roadmap/status/index and extended the focused world/bootstrap/quest guards so the merchant layer and its progression gate stay locked.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-066 - Combat loot pass lacked a benchmark lock for progression pacing
- Status: Fixed
- Severity: S2
- Area: BUG
- Source: Manual
- Links: `src/game/combat/content.ts`, `src/js/skills/combat/ROADMAP.md`, `src/js/skills/combat/STATUS.md`, `src/js/skills/_index.md`, `tools/tests/combat-enemy-content-guard.js`
- Repro:
  1. Review the open `COMBAT-007` milestone against the live first-pass enemy drop tables in `src/game/combat/content.ts`.
  2. Compare passive/resource/humanoid/gatekeeper enemy payouts and gear bands using the current item values.
  3. Check whether the combat docs and regression suite lock those direct-sale benchmarks and progression assumptions.
- Expected: The first-pass combat loot pass should publish runtime-backed benchmark rows for the live drop tables, keep roadside goblins in the bronze band, keep the first gatekeeper/camp enemies in the iron band, and lock those assumptions in focused guard coverage before `COMBAT-007` is marked complete.
- Actual: Exact drop tables already existed, but the roadmap only carried prose rules, there was no explicit benchmark table for direct-sale pacing, and the combat tracker still treated `COMBAT-007` as open because the economy/progression assumptions were not regression-locked anywhere.
- Frequency: Always
- Owner: Codex
- Plan v1:
  1. Derive direct-sale benchmark rows from the live first-pass enemy tables and current item values.
  2. Extend the combat enemy content guard to lock expected sell value per kill, empty/coin weights, payout ordering, and merchant-ladder sanity.
  3. Sync the combat roadmap/status/index once the loot-band lock is explicit.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added live loot benchmark rows to the combat roadmap using the current enemy drop tables plus the general-store half-price fallback as the direct-sale baseline.
  - Extended `tools/tests/combat-enemy-content-guard.js` so combat loot is now locked against expected sell value per kill, empty-drop/coin weights, payout ordering across the first-pass roster, and the bronze/iron merchant-ladder sanity checks.
  - Marked `COMBAT-007` complete in the combat status board and advanced the shared skills index to the simulator rebuild as the next combat milestone.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-065 - Smithing balance pass lacked runtime benchmarks and valid rune output values
- Status: Fixed
- Severity: S2
- Area: SMI
- Source: Manual
- Links: `src/js/content/item-catalog.js`, `src/js/skills/spec-registry.js`, `src/js/skills/smithing/ROADMAP.md`, `src/js/skills/smithing/STATUS.md`, `src/js/skills/_index.md`, `tools/tests/spec-contracts.js`, `tools/tests/spec-doc-parity.js`
- Repro:
  1. Review the open `SMITHING-012` roadmap/status milestone and compare it against the live smithing registry helpers and roadmap benchmark tables.
  2. Inspect late-band smithing outputs such as `rune_sword_blade`, `rune_arrowheads`, or `rune_platebody` in the canonical item catalog.
  3. Compare their direct-sale values against the intended smithing economy progression.
- Expected: Smithing should publish runtime-backed throughput/economy benchmarks for smelting, forged outputs, and jewelry bases, and rune-tier forged outputs should keep meaningful sell values instead of collapsing to placeholder numbers.
- Actual: The smithing roadmap had no locked throughput/value-delta tables, the registry exposed no smithing balance summary, and the canonical rune-tier forged outputs all inherited value `1` because the smithing item factory still used a zeroed rune `gearValue`.
- Frequency: Always
- Owner: Codex
- Plan v1:
  1. Fix the canonical rune smithing output values in the item catalog.
  2. Add smithing balance-summary helpers plus contract/parity coverage for output-per-tick, XP-per-tick, and direct-sale value-delta metrics.
  3. Sync the smithing roadmap/status/index and generated item mirror once the runtime-backed numbers are locked.
- Plan Outcome: Confirmed
- Fix Notes:
  - Corrected the canonical smithing item factory so rune-tier forged outputs now derive from the same late-band gear-value baseline as the finished rune tools/weapons instead of collapsing to placeholder `1`-value items.
  - Added smithing balance-summary helpers in `SkillSpecRegistry` that compute output-per-tick, XP-per-tick, output sell value, input sell value, and direct-sale value delta for every smithing recipe using the authored smithing/value sources.
  - Expanded the smithing roadmap with explicit smelting, forged-output, and jewelry-base benchmark tables, then locked them with spec contract/doc parity tests before marking `SMITHING-012` complete in the status board and skills index.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-064 - Smithing station UX lacked queue-state messaging coverage
- Status: Fixed
- Severity: S3
- Area: SMI
- Source: Manual
- Links: `src/js/skills/smithing/index.js`, `tools/tests/fletching-crafting-interactions.js`, `src/js/skills/smithing/STATUS.md`, `src/js/skills/_index.md`
- Repro:
  1. Queue repeated smithing work from the furnace or anvil.
  2. Let the queue stop because the requested quantity completes, the player moves away, a required tool disappears, or the next input set is no longer available.
  3. Compare the live chat feedback and tracker docs against the intended `SMITHING-011` station UX milestone.
- Expected: Smithing should announce what batch starts, explain why the queue stops, and have focused runtime coverage for quantity completion plus interruption/failure states before the milestone is treated as complete.
- Actual: The smithing runtime could already queue repeated work, but the player-facing copy stayed generic (`You begin smithing at the anvil.`, `You stop smithing.`), quantity-complete endings were silent, and the shared interaction QA only covered jewellery unlock/output rollback cases.
- Frequency: Always
- Owner: Codex
- Plan v1:
  1. Add recipe-aware start/stop/failure messaging around queued smithing sessions.
  2. Extend focused runtime coverage for exact-count queues, material exhaustion, move-away interruption, and tool-loss stops.
  3. Sync the smithing tracker docs once the UX milestone is actually landed.
- Plan Outcome: Confirmed
- Fix Notes:
  - Updated the smithing runtime to announce the queued batch up front, emit explicit completion copy for counted batches, and name the active recipe/station when queues stop because of movement, missing tools/moulds, missing materials, or no output space.
  - Tightened smithing recipe issue text in the station UI so missing tool, mould, and material requirements surface as specific requirements instead of generic placeholders.
  - Extended the shared interaction/runtime QA with dedicated smithing coverage for exact-count batches, material-driven queue stops, move-away interruption, tool-loss interruption, and the updated output-space rollback copy.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-063 - Combat tracker still treated melee style UI as open
- Status: Fixed
- Severity: S3
- Area: DOCS
- Source: Manual
- Links: `src/js/skills/combat/STATUS.md`, `src/js/skills/_index.md`, `index.html`, `src/js/inventory.js`, `src/js/world.js`, `src/game/ui/hud-view-models.ts`, `tools/tests/inventory-hud-domain-tests.js`, `tools/tests/combat-domain-tests.js`
- Repro:
  1. Review the combat status board and shared skills index after the live combat HUD pass.
  2. Compare the open `COMBAT-011` tracker entry against the actual combat tab UI, click wiring, style-aware HUD view models, and the existing combat HUD/domain tests.
- Expected: Once the melee style selector is live in the combat tab and covered by focused tests, combat tracking docs should mark `COMBAT-011` complete and advance to the next true open milestone.
- Actual: The combat tab already exposed Attack / Strength / Defense buttons, runtime selection wiring, persisted style state, and focused view-model coverage, but `src/js/skills/combat/STATUS.md` and `src/js/skills/_index.md` still treated the attack-style UI as unfinished.
- Frequency: Always
- Owner: Codex
- Plan v1:
  1. Verify the attack-style UI is live in the combat tab and backed by runtime state updates.
  2. Confirm focused regression coverage already locks the view-model and combat-style math behavior.
  3. Sync the combat status board and shared skills index to the shipped state.
- Plan Outcome: Confirmed
- Fix Notes:
  - Marked `COMBAT-011` complete in the combat status board because the combat tab already ships melee style buttons, selection wiring, HUD updates, and saved `selectedMeleeStyle` state.
  - Advanced the shared combat row in the skills index so combat now points at the simulator rebuild as the next milestone after the current loot/drop authoring pass.
  - Left the runtime untouched because the existing implementation and targeted tests already matched the documented milestone.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-062 - Smithing tracker still treated Thrain gate as open
- Status: Fixed
- Severity: S3
- Area: DOCS
- Source: Manual
- Links: `src/js/skills/smithing/STATUS.md`, `src/js/skills/_index.md`, `src/js/skills/smithing/ROADMAP.md`, `tools/tests/quest-tanner-runtime-guard.js`
- Repro:
  1. Review the smithing roadmap and quest coverage after `HIT-048`.
  2. Compare the live Thrain quest gate against the smithing status board and shared skills index.
- Expected: Once `Proof of the Deepforge` is live and guarded, smithing tracking docs should mark `SMITHING-010` complete and advance to the next milestone.
- Actual: The roadmap and runtime tests already described the Thrain quest gate as shipped, but `src/js/skills/smithing/STATUS.md` and `src/js/skills/_index.md` still showed the milestone as open and blocked on quest gating.
- Frequency: Always
- Owner: Codex
- Plan v1:
  1. Verify the Thrain gate is implemented in canonical quest/spec coverage.
  2. Sync the smithing status board and shared skills index to the shipped state.
  3. Run narrow regression coverage to confirm the quest gate remains live.
- Plan Outcome: Confirmed
- Fix Notes:
  - Marked `SMITHING-010` complete in the smithing status board because Thrain's advanced ore access already ships through the shared `Proof of the Deepforge` quest gate.
  - Advanced the shared smithing row in the skills index to `SMITHING-011` and cleared the stale quest-gating blocker.
  - Left the smithing roadmap untouched because it was already the accurate source describing the live quest-gated progression.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-061 - Advanced Fletcher opened before any late-band yew proof existed
- Status: Fixed
- Severity: S2
- Area: FLT
- Source: Manual
- Links: `src/js/content/quest-catalog.js`, `tools/tests/quest-tanner-runtime-guard.js`, `src/js/skills/fletching/ROADMAP.md`, `src/js/skills/fletching/STATUS.md`, `src/js/skills/_index.md`
- Repro:
  1. Review `FLETCHING-012` in the fletching roadmap/status docs after the world-training pass.
  2. Talk to the Advanced Fletcher at the north-road outpost and compare the live merchant access path against the "later progression" notes.
  3. Try to open the deeper fletching buyer before making any yew-tier outputs.
- Expected: The deeper fletching buyer should stay locked until the player proves top-band yew work, so late-tier outputs have a concrete progression and economy gate.
- Actual: Yew handles and bows already existed in runtime/spec data, but the Advanced Fletcher opened immediately and no quest tied late-band fletching to the deeper sell path.
- Frequency: Always
- Owner: Codex
- Plan v1:
  1. Reuse the existing merchant-unlock quest runtime for the Advanced Fletcher instead of inventing a new shop gate.
  2. Require a yew proof set that exercises the late-band handle and finished-bow lanes.
  3. Add runtime guard coverage and sync the fletching docs/status board to the new gate.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added the authored quest `Proof of the Yew`, which auto-starts from the Advanced Fletcher and unlocks `advanced_fletcher` after a `yew_handle` + `yew_longbow` + `yew_shortbow` turn-in.
  - Reused the merchant-lock quest runtime, so the Advanced Fletcher now routes from `Talk-to` to `Trade` only after the yew proof set is delivered.
  - Synced the fletching roadmap/status/index so the north-road buyer is documented as the gated late-band sell path instead of an always-open merchant.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-060 - Firemaking higher-tier world lanes existed only in docs and specs
- Status: Fixed
- Severity: S2
- Area: Other
- Source: Manual
- Links: `content/world/regions/main_overworld.json`, `src/js/core.js`, `tools/content/validate-world.js`, `tools/tests/world-bootstrap-parity.js`, `src/js/skills/firemaking/ROADMAP.md`, `src/js/skills/firemaking/STATUS.md`, `src/js/skills/_index.md`
- Repro:
  1. Review the firemaking roadmap/status docs after the multi-tier log progression pass.
  2. Compare those docs against the authored world route groups and current QA helpers.
  3. Try to find a direct, tier-specific firemaking lane for oak, willow, maple, or yew progression in normal gameplay or via `/qa`.
- Expected: Higher-tier firemaking progression should have reachable authored training lanes and QA helpers instead of living only in specs and the generic logs-only preset.
- Actual: Firemaking supported all log tiers in runtime/spec data, but the world content still lacked authored firemaking route anchors and QA only exposed a generic `fm_full` loadout with no tier-specific travel helpers.
- Frequency: Always
- Owner: Codex
- Plan v1:
  1. Add a canonical `firemaking` route group to the authored world contract and place tiered fire lanes beside the matching woodcutting bands.
  2. Expose the new lanes through the QA surface (`/qa firespots`, `/qa gotofire`, broader `fm_full`, and `setlevel firemaking`).
  3. Extend world/QA parity checks and sync the firemaking docs/status board.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added authored firemaking lanes for `starter`, `oak`, `willow`, `maple`, `yew`, and `pine` in `main_overworld`, all on clear east/west-friendly tiles near the matching woodcutting bands.
  - Routed the new `firemaking` group through the typed world contracts, bootstrap bridge, world payload, and QA chat commands so the lanes are reachable in normal tooling instead of living only in docs.
  - Updated the firemaking roadmap/status/index and extended world validation/parity coverage so the new authored lanes stay locked.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-059 - Firemaking repeat-chain still ended after one successful fire
- Status: Fixed
- Severity: S2
- Area: Other
- Source: Manual
- Links: `src/js/skills/firemaking/index.js`, `tools/tests/firemaking-runtime-tests.js`, `src/js/skills/firemaking/STATUS.md`, `src/js/skills/firemaking/ROADMAP.md`, `src/js/skills/_index.md`
- Repro:
  1. Start a firemaking action with multiple logs and compare the live runtime against the repeated-flow notes in the firemaking roadmap.
  2. Successfully light one fire, wait through the success clip, and observe whether the action chains into the next tile or simply ends.
  3. Force a failed ignition attempt or a blocked follow-up step and inspect whether the player gets clear feedback without extra log consumption.
- Expected: Firemaking should continue into the next tile after a successful fire while the lane remains valid, failed attempts should surface brief feedback, and blocked follow-up pacing should stop cleanly.
- Actual: The runtime always stopped after the first successful fire, failed ignition attempts were silent, and the repeated east/west pacing path was not locked by dedicated regression coverage.
- Frequency: Always
- Owner: Codex
- Plan v1:
  1. Reuse the existing `tryStepAfterFire()` seam so firemaking chains into the next tile after the success clip.
  2. Add bounded failed-attempt feedback and clean blocked-follow-up messaging.
  3. Add dedicated firemaking runtime QA and sync the firemaking docs/status tracking.
- Plan Outcome: Confirmed
- Fix Notes:
  - `src/js/skills/firemaking/index.js` now carries successful fires into the next tile after the success clip instead of always stopping after one lit log.
  - Failed ignition attempts now emit a brief first-failure feedback line per target tile, and blocked follow-up steps stop the chain with a specific pacing message instead of silently ending.
  - Added `tools/tests/firemaking-runtime-tests.js` and wired it into the repo scripts so repeat-chain continuation, interruption, and blocked-lane behavior stay covered.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-058 - Fletching world-training loop existed only in docs and economy tables
- Status: Fixed
- Severity: S2
- Area: FLT
- Source: Manual
- Links: `content/world/regions/main_overworld.json`, `src/js/content/npc-dialogue-catalog.js`, `tools/tests/world-bootstrap-parity.js`, `tools/tests/world-authoring-domain-tests.js`, `src/js/skills/fletching/ROADMAP.md`, `src/js/skills/fletching/STATUS.md`, `src/js/skills/_index.md`
- Repro:
  1. Review the fletching roadmap/status docs and compare their merchant/training-flow notes against the authored world region file.
  2. Inspect the current merchant services in `main_overworld`, or use QA merchant discovery in that world.
  3. Look for reachable `fletching_supplier` and `advanced_fletcher` NPC placements in the playable world.
- Expected: The bank-adjacent processing loop and the deeper fletching sell path should exist as reachable authored merchants, not just as spec or economy rows.
- Actual: Fletching merchant IDs and economy rules existed in the skill data, but the authored world had no supplier or advanced-fletcher placements, so the documented training flow was not actually reachable.
- Frequency: Always
- Owner: Codex
- Plan v1:
  1. Add canonical authored merchant placements for the early supplier loop and the deeper advanced-fletcher loop.
  2. Add dialogue coverage for any new merchant IDs so the world interaction path remains consistent.
  3. Extend the world parity checks and sync the fletching docs to the authored placements.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added a starter-town `fletching_supplier` merchant placement inside the bank and general-store block so early log processing and restock flow now live in authored world content.
  - Added an `advanced_fletcher` merchant placement at the north-road outpost plus a dedicated dialogue entry, so the deeper road now has a reachable buyer for finished fletching outputs.
  - Updated the fletching roadmap/status/index and extended the world bootstrap and authoring parity tests to lock the new placements and dialogue bindings.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-057 - Firemaking log-pressure benchmarks were missing against woodcutting and cooking
- Status: Fixed
- Severity: S2
- Area: Other
- Source: Manual
- Links: `src/js/skills/spec-registry.js`, `src/js/skills/specs.js`, `tools/tests/spec-contracts.js`, `tools/tests/spec-doc-parity.js`, `src/js/skills/firemaking/ROADMAP.md`, `src/js/skills/firemaking/STATUS.md`, `src/js/skills/_index.md`
- Repro:
  1. Review the firemaking roadmap/status docs after the multi-log progression pass and compare them against the live runtime spec.
  2. Try to answer the canonical burn-rate, log-sink, and cooking-support benchmarks for each firemaking log tier from runtime-backed helpers or roadmap tables.
  3. Compare continuous same-log firemaking demand against current same-log woodcutting supply and verify whether the docs preserve that pressure explicitly.
- Expected: Firemaking should expose runtime-backed burn-rate benchmarks, document its cooking support per fire, and make the same-log woodcutting-vs-firemaking supply pressure explicit.
- Actual: Firemaking still only exposed raw recipe/value rows, so the repo lacked canonical benchmark helpers and roadmap tables for log-burn pressure against woodcutting and cooking demand.
- Frequency: Always
- Owner: Codex
- Plan v1:
  1. Add canonical firemaking balance helpers for ignition throughput, log burn rate, cooking support per fire, and same-log woodcutting coverage.
  2. Add spec-level balance validation so those cross-skill benchmarks cannot drift silently.
  3. Sync the firemaking roadmap/status/index with explicit tier-entry, level-40, and woodcutting-coverage tables.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added firemaking balance helpers in `SkillSpecRegistry` so the runtime now exposes ignition throughput, log sink per tick, cooking actions per fire, and same-log woodcutting coverage for every canonical log tier.
  - Added a firemaking balance validator in `src/js/skills/specs.js` plus contract coverage, which locks the tier-entry and level-40 benchmark rows and preserves the intended "firemaking stays a log sink" rule.
  - Updated the firemaking roadmap/status/index with explicit cross-skill benchmark tables and notes, including the current `90` cooking-actions-per-fire support and maxed same-log woodcutting coverage ratios.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-056 - Runecrafting merchants buy unrelated items outside the authored tables
- Status: Fixed
- Severity: S2
- Area: Other
- Source: Manual
- Links: `src/js/skills/specs.js`, `src/js/skills/spec-registry.js`, `tools/tests/spec-contracts.js`, `src/js/skills/runecrafting/ROADMAP.md`, `src/js/skills/runecrafting/STATUS.md`, `src/js/skills/_index.md`, `content/skills/runecrafting.json`
- Repro:
  1. Inspect the authored rune-tutor and combination-sage buy/sell tables in the runecrafting roadmap or skill spec.
  2. Offer an unrelated item such as `bronze_axe` or `cooked_shrimp` to one of those merchants through the shop runtime.
  3. Observe whether the merchant accepts the unrelated item at a fallback sell price.
- Expected: The rune tutor and combination sage should only buy the authored rune/pouch goods listed in the runecrafting spec and roadmap.
- Actual: Their merchant configs lacked `strictBuys`, so the runtime treated them as willing to buy unrelated items outside the authored tables.
- Frequency: Always
- Owner: Codex
- Plan v1:
  1. Audit the runecrafting merchant tables against the authored buy/sell rows and pouch unlock levels.
  2. Make the rune merchants strict to those authored buy lists and add summary/contract coverage for the value and unlock tables.
  3. Sync the runecrafting roadmap/status/index and mirrored skill JSON, then run targeted shop/spec checks.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added `strictBuys: true` to both `rune_tutor` and `combination_sage`, so the shop runtime no longer buys unrelated items through those runecrafting merchants.
  - Added a runecrafting economy summary helper plus contract coverage for value-table parity, strict merchant buy enforcement, and pouch unlock-level gating.
  - Synced the runecrafting roadmap/status/index and regenerated `content/skills/runecrafting.json` so the mirrored skill contract matches the authored source.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-055 - Crafting throughput targets and jewelry sell values drifted from the authored balance rules
- Status: Fixed
- Severity: S2
- Area: Other
- Source: Manual
- Links: `src/js/skills/specs.js`, `src/js/skills/spec-registry.js`, `tools/tests/spec-contracts.js`, `tools/tests/spec-doc-parity.js`, `src/js/skills/crafting/ROADMAP.md`, `src/js/skills/crafting/STATUS.md`, `src/js/skills/_index.md`, `content/skills/crafting.json`
- Repro:
  1. Review the crafting roadmap/status docs after the over-tier handle work and compare them against the live crafting spec.
  2. Try to answer the canonical XP-per-tick and sell-value-per-tick targets for strapped handles, gem cutting, staffs, and jewelry attachment from runtime-backed helpers or roadmap tables.
  3. Compare the documented gemmed-jewelry value rule against the crafting economy sell rows, especially for `sapphire_silver_*` and the gold gemmed jewelry outputs.
- Expected: Crafting should expose runtime-backed throughput/value benchmarks for its main lanes, and gemmed-jewelry sell values should equal matching jewelry-base sell value plus matching cut-gem sell value.
- Actual: Crafting still lacked benchmark helpers/tables for the main balance lanes, and several gemmed-jewelry sell rows had drifted above the documented base-plus-gem sell composition rule.
- Frequency: Always
- Owner: Codex
- Plan v1:
  1. Add canonical crafting balance helpers plus spec-level benchmark validation for the core handle, gem, staff, and jewelry lanes.
  2. Correct the gemmed-jewelry sell rows to match the documented base-plus-gem sell composition rule.
  3. Sync the crafting roadmap/status/index and mirrored skill JSON with explicit throughput/value benchmark tables.
- Plan Outcome: Confirmed
- Fix Notes:
  - Corrected the crafting economy sell rows for sapphire-silver and all gold gemmed jewelry outputs so they now equal base jewelry sell value plus cut-gem sell value.
  - Added crafting balance helpers in the registry plus spec-level curve validation to lock the handle, gem-cutting, staff, and gemmed-jewelry lanes against future drift.
  - Added explicit crafting throughput/value benchmark tables in the roadmap and marked `CRAFTING-012` complete across the crafting status/index and mirrored skill JSON.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-054 - Over-tier strapped handles still stop at exact-tier recipes
- Status: Fixed
- Severity: S2
- Area: Other
- Source: Manual
- Links: `src/js/skills/crafting/index.js`, `src/js/skills/runtime.js`, `tools/tests/fletching-crafting-interactions.js`, `src/js/skills/crafting/ROADMAP.md`, `src/js/skills/crafting/STATUS.md`, `src/js/skills/_index.md`
- Repro:
  1. Read the crafting roadmap section on strapped handles and lower-tier compatibility.
  2. Try a higher-tier strapped handle on a lower-tier smithing part, such as `bronze_axe_head + oak_handle_strapped`.
  3. Observe whether the runtime offers a confirmation and produces the normal lower-tier output.
- Expected: Higher-tier strapped handles can assemble lower-tier sword/axe/pickaxe parts after a yes/no confirmation, and the result stays the standard lower-tier item with no stat bonus or disassembly path.
- Actual: Crafting only matched the exact-tier strapped-handle input from the recipe table, so over-tier handle combinations were rejected as mismatches.
- Frequency: Always
- Owner: Codex
- Plan v1:
  1. Detect lower-tier metal-part + higher-tier strapped-handle pairs from the existing assembly recipe data.
  2. Reuse the lower-tier output recipe with the provided higher-tier handle input behind a confirmation prompt.
  3. Add focused regression coverage and sync the crafting docs/status board.
- Plan Outcome: Confirmed
- Fix Notes:
  - `src/js/skills/crafting/index.js` now adapts the matching lower-tier assembly recipe when the supplied strapped handle is higher-tier than the recipe's normal requirement.
  - The immediate confirmation prompt explicitly warns that the result is the normal lower-tier item with no stat bonus and no later disassembly path.
  - Added accept/decline/undertier coverage in `tools/tests/fletching-crafting-interactions.js` and marked `CRAFTING-011` complete across the crafting docs/index.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-053 - Elira mould-making quest was still a roadmap-only gate
- Status: Fixed
- Severity: S2
- Area: Other
- Source: Manual
- Links: `src/js/content/quest-catalog.js`, `src/js/quest-runtime.js`, `src/js/content/item-catalog.js`, `src/js/skills/specs.js`, `src/js/skills/crafting/index.js`, `tools/tests/quest-tanner-runtime-guard.js`, `tools/tests/fletching-crafting-interactions.js`, `src/js/skills/crafting/ROADMAP.md`, `src/js/skills/crafting/STATUS.md`, `src/js/skills/_index.md`
- Repro:
  1. Review the crafting roadmap/status docs and the live crafting + quest runtime.
  2. Try to start Elira's mould-making flow or create moulds from borrowed examples.
  3. Check whether ring/amulet/tiara mould unlocks are actually earned through a quest-backed runtime path.
- Expected: Elira should start a real mould-making quest that grants borrowed examples, tracks finished mould ownership, and unlocks the ring/amulet/tiara mould families when completed.
- Actual: The mould-making flow was documented but not implemented as a live quest/runtime slice, so the borrowed-item imprinting path and quest-backed unlock handoff were still missing.
- Frequency: Always
- Owner: Codex
- Plan v1:
  1. Add Elira's mould-making quest definition with borrowed-item start rewards and completion unlock flags.
  2. Implement crafting-side clay-on-water, borrowed-item imprinting, and fire-firing recipes/runtime handling.
  3. Add focused quest/crafting regression coverage and update the crafting docs/status board.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added the `Moulds of the Trade` quest for Elira, including borrowed example start rewards, non-consumed mould-ownership objectives, completion cleanup for borrowed items, and permanent mould unlock flags.
  - Added `borrowed_*` and `imprinted_*` item definitions plus crafting recipes/runtime support for soft clay creation, borrowed-item imprinting, and active-fire mould firing.
  - Extended the focused quest/crafting guards and updated the crafting roadmap/status/index to reflect the now-live quest-gated mould flow.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-052 - Fletching throughput targets are not locked to runtime data
- Status: Fixed
- Severity: S2
- Area: FLT
- Source: Manual
- Links: `src/js/skills/specs.js`, `src/js/skills/spec-registry.js`, `tools/tests/spec-contracts.js`, `tools/tests/spec-doc-parity.js`, `src/js/skills/fletching/ROADMAP.md`, `src/js/skills/fletching/STATUS.md`, `src/js/skills/_index.md`, `content/skills/fletching.json`
- Repro:
  1. Review the fletching roadmap after the merchant/value-table pass and compare it against the live runtime spec.
  2. Try to answer the canonical XP-per-tick and sell-value-per-tick targets for the handle, finished-arrow, and finished-bow lanes.
  3. Check whether fletching exposes runtime-backed balance helpers like the other matured skill specs.
- Expected: Fletching should publish explicit throughput targets for its core recipe lanes and expose canonical registry helpers that stay aligned with the live runtime values.
- Actual: Fletching still lacked balance summary helpers, spec-level curve validation, and roadmap benchmark tables for the core handle, arrow, and bow branches.
- Frequency: Always
- Owner: Codex
- Plan v1:
  1. Add canonical fletching value coverage plus registry helpers for per-recipe XP/value throughput.
  2. Add spec-level balance validation for the handle, arrow, and bow lanes.
  3. Sync the roadmap/status/index and runtime skill mirror with explicit throughput tables.
- Plan Outcome: Confirmed
- Fix Notes:
  - Benchmarked the existing recipe numbers and kept the live values unchanged; the pass codifies the current curve instead of silently retuning it.
  - Added fletching balance helpers in the registry plus spec-level curve validation that locks the handle, arrow, and bow throughput lanes.
  - Filled the remaining plain-staff sell-value rows in the fletching economy table and updated the roadmap/status/index plus the mirrored skill JSON.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-051 - Combat-fed cooked/burnt meats still reuse raw placeholder icons
- Status: Fixed
- Severity: S3
- Area: Other
- Source: Manual
- Links: `src/js/content/item-catalog.js`, `content/items/runtime-item-catalog.json`, `content/icon-status.json`, `assets/pixel-src/cooked_chicken.json`, `assets/pixel-src/burnt_chicken.json`, `assets/pixel-src/cooked_boar_meat.json`, `assets/pixel-src/burnt_boar_meat.json`, `assets/pixel-src/cooked_wolf_meat.json`, `assets/pixel-src/burnt_wolf_meat.json`, `src/js/skills/cooking/ROADMAP.md`, `src/js/skills/cooking/STATUS.md`, `src/js/skills/_index.md`
- Repro:
  1. Compare the inventory icons for `raw_chicken`, `cooked_chicken`, and `burnt_chicken`, then repeat for the boar and wolf meat families.
  2. Check the current icon asset mapping in `src/js/content/item-catalog.js` or `content/icon-status.json`.
- Expected: Cooked and burnt versions of the combat-fed meat families should use distinct inventory art instead of reusing the raw-meat icon.
- Actual: `cooked_*` and `burnt_*` chicken/boar/wolf outputs still pointed at the raw-meat pixel assets, so the new non-fish cooking states were visually indistinct.
- Frequency: Always
- Owner: Codex
- Plan v1:
  1. Audit the cooked/burnt meat icon mappings and confirm the missing dedicated asset IDs.
  2. Author/build bespoke cooked and burnt pixel assets for chicken, boar meat, and wolf meat.
  3. Rewire the item catalog and sync the item/icon/doc mirrors.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added dedicated cooked and burnt pixel-source assets for the chicken, boar meat, and wolf meat cooking-result families and built their icon/model artifacts through the pixel pipeline.
  - Updated `src/js/content/item-catalog.js` so each cooked/burnt meat output now points at its own bespoke pixel asset instead of the raw-meat placeholder art.
  - Synced the runtime item mirror and icon-status manifest, then updated the cooking roadmap/status/index docs to record the completed presentation pass.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-050 - Cooking 1-40 balance targets missing after burn-curve pass
- Status: Fixed
- Severity: S2
- Area: Other
- Source: Manual
- Links: `src/js/skills/specs.js`, `src/js/skills/spec-registry.js`, `tools/tests/spec-contracts.js`, `tools/tests/spec-doc-parity.js`, `src/js/skills/cooking/ROADMAP.md`, `src/js/skills/cooking/STATUS.md`, `src/js/skills/_index.md`, `content/skills/cooking.json`
- Repro:
  1. Review the cooking roadmap after the burn-curve rebalance and compare it against the live runtime spec.
  2. Try to answer the expected cooked-output, XP-per-action, and value-per-action targets for each 1-40 food band.
  3. Check whether cooking exposes canonical balance helpers and sell-value tables like the other matured skill specs.
- Expected: Cooking should publish explicit 1-40 benchmark targets, expose canonical per-recipe balance helpers, and keep its fish sell values aligned with fishing.
- Actual: Cooking still lacked a dedicated value table and registry summary helpers, and the roadmap's sell-value columns still mirrored base item values instead of the live merchant sell values.
- Frequency: Always
- Owner: Codex
- Plan v1:
  1. Add canonical cooking value-table coverage aligned to fishing for raw/cooked/burnt fish.
  2. Add per-recipe cooking balance helpers and validation for unlock and level-40 benchmarks.
  3. Sync the roadmap/status/mirror docs with explicit XP/value-per-action targets and break-even levels.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added a shared canonical fish-food value table in `src/js/skills/specs.js` so fishing and cooking now reuse the same raw/cooked/burnt buy/sell rows instead of drifting copies.
  - Added cooking balance validation in the runtime spec plus registry helpers for expected cooked output, XP/action, gold-delta/action, and break-even level summaries.
  - Updated the cooking roadmap with live sell values plus tier-entry, level-40, and break-even benchmark tables, then synced the cooking status/index and runtime mirror docs.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-049 - Mining gem-route balance tables drift from live runtime targets
- Status: Fixed
- Severity: S2
- Area: MNG
- Source: Manual
- Links: `src/js/skills/specs.js`, `src/js/skills/spec-registry.js`, `src/js/skills/mining/index.js`, `tools/tests/mining-runtime-tests.js`, `src/js/skills/mining/ROADMAP.md`
- Repro:
  1. Review the mining roadmap's yield/xp/gold-per-tick sections and compare them against the live runtime behavior for depletion, respawn, and sell values.
  2. Mine sapphire and emerald routes and compare their sustained value against the intended ore/gem band roles.
  3. Inspect the canonical mining skill mirror for economy/balance coverage.
- Expected: Mining should expose canonical balance/economy data, the runtime should honor the documented per-rock yield-session rules, and sapphire/emerald routes should hit the intended sustained throughput targets.
- Actual: Mining still lacked canonical economy/balance helpers, live depletion ignored the documented minimum/cap session rules, and gem-route sustained throughput fell behind the intended lane targets.
- Frequency: Always
- Owner: Codex
- Plan v1:
  1. Add canonical mining economy/balance metadata and runtime helpers for expected yields plus tier-entry/sustained throughput summaries.
  2. Implement the documented per-rock yield-session rules in the mining runtime (minimum yields, hard caps, idle expiry).
  3. Rebalance the gem routes, add focused mining QA coverage, and sync the mining docs/status files.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added canonical mining economy value tables plus spec-registry helpers for expected per-node yields and tier-entry/sustained mining throughput.
  - Updated mining runtime depletion to honor per-rock minimum/cap yield sessions with 50-tick idle expiry while keeping rune essence persistent.
  - Rebalanced sapphire and emerald downtime so the gem lane now hits the intended sustained-value targets, then synced roadmap/status/index docs and added dedicated mining runtime QA coverage.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-048 - Thrain late-ore stock lacks the documented quest gate
- Status: Fixed
- Severity: S2
- Area: MNG
- Source: Manual
- Links: `src/js/content/quest-catalog.js`, `tools/tests/quest-tanner-runtime-guard.js`, `src/js/skills/mining/STATUS.md`, `src/js/skills/mining/ROADMAP.md`, `src/js/skills/smithing/ROADMAP.md`
- Repro:
  1. Talk to Thrain Deepforge.
  2. Attempt to trade with his advanced ore shop immediately.
  3. Check the mining/smithing docs for the intended Thrain quest gate.
- Expected: Thrain's advanced ore stock should stay locked until the player completes a dedicated unlock quest that proves late-band mining readiness.
- Actual: Thrain had merchant placement and stock rules, but no authored quest existed to implement the documented gate.
- Frequency: Always
- Owner: Codex
- Plan v1:
  1. Author a Thrain quest that unlocks `thrain_deepforge` through the existing merchant-lock quest runtime.
  2. Use current 1-40 mining outputs as the turn-in proof for the unlock.
  3. Add runtime regression coverage and sync the mining/smithing docs.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added the authored quest `Proof of the Deepforge`, which auto-starts from Thrain dialogue and unlocks `thrain_deepforge` after a `coal` + `gold_ore` + `uncut_emerald` turn-in.
  - Reused the existing merchant-lock quest runtime, so Thrain now routes from `Talk-to` to `Trade` only after quest completion without adding one-off shop logic.
  - Extended the quest runtime guard coverage to verify the full Thrain lifecycle: locked access, auto-start, ready-to-complete state, merchant unlock, and smithing XP reward.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-043 - Eat cooldown can lock for hundreds/thousands of ticks after reload
- Status: Closed
- Severity: S1
- Area: BUG
- Source: Manual
- Links: `src/js/core.js`, `src/js/world.js`, `tools/tests/progress-persistence-guard.js`, `tools/tests/combat-engagement-guard.js`
- Repro:
  1. Eat food to apply cooldown.
  2. Save/reload or continue a session with persisted combat state.
  3. Try to eat again and observe an unexpectedly large remaining-ticks warning.
- Expected: Eat cooldown should remain short (food-defined delay) and never restore as a long multi-hundred tick lockout.
- Actual: Stale persisted cooldown ticks are clamped on load and impossible live cooldown deltas self-heal before wait messaging.
- Frequency: Sometimes
- Owner: Pair
- Plan v1:
  1. Clamp stale persisted `eatingCooldownEndTick` values during save-load restore.
  2. Add runtime self-heal in `eatItem` to clear impossible cooldown deltas.
  3. Add regression guard assertions for persistence and combat/eat rule coverage.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added load-time stale cooldown clamp in `core.js` (`MAX_PERSISTED_EAT_COOLDOWN_TICKS`) so persisted absolute ticks cannot lock eating after tick counter reset.
  - Added runtime cooldown sanity self-heal in `world.js` (`MAX_REASONABLE_EAT_COOLDOWN_TICKS`) before wait messaging.
  - Extended `progress-persistence-guard` and `combat-engagement-guard` to enforce both protections and preserve same-tick eat restrictions.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-042 - Tree silhouette refinement follow-up (willow/maple/yew)
- Status: Fixed
- Severity: S3
- Area: WC
- Source: Manual
- Links: `src/js/world.js`, `src/js/skills/woodcutting/STATUS.md`
- Repro:
  1. Inspect starter-pond showcase row and distributed willow/maple/yew placements.
- Expected: Willow/maple/yew silhouettes remain immediately distinguishable at gameplay camera distance and at multiple zoom levels.
- Actual: Baseline silhouette pass landed, but additional iterative tuning is desired for shape readability and type clarity.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Run a focused visual review at gameplay zoom bands (near/mid/far).
  2. Tune per-type canopy/branch/drape profiles with small targeted adjustments.
  3. Re-validate readability in showcase row and in-world mixed stands.
- Plan Outcome: Confirmed
- Fix Notes:
  - Tightened willow silhouettes around a thinner, taller trunk with smaller canopy masses and longer outer drapes so the hanging profile survives better at mid/far zoom.
  - Broadened maple crowns and branch spread so maples read as the widest, flattest canopy family in the showcase row and mixed-world stands.
  - Narrowed and stacked yew canopy layers around a taller trunk so yews keep a compact spire-like profile instead of blending into the rounder broadleaf silhouettes.
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-044 - Complete inventory icon coverage for all log types
- Status: Fixed
- Severity: S3
- Area: WC
- Source: Manual
- Links: `content/icon-status.json`, `src/js/content/item-catalog.js`, `content/items/runtime-item-catalog.json`, `assets/pixel-src/regular_logs.json`, `assets/pixel-src/oak_logs.json`, `assets/pixel-src/willow_logs.json`, `assets/pixel-src/maple_logs.json`, `assets/pixel-src/yew_logs.json`
- Repro:
  1. Compare the inventory icons for `logs`, `oak_logs`, `willow_logs`, `maple_logs`, and `yew_logs`.
  2. Check the current icon asset mapping in `content/icon-status.json` or `src/js/content/item-catalog.js`.
- Expected: Every log tier has a distinct, recognizable inventory icon so the full log family reads clearly at a glance.
- Actual: Log icon coverage is incomplete; `oak_logs`, `maple_logs`, and `yew_logs` still point at the shared `logs` asset instead of having dedicated tier-specific icons.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Audit canonical log item mappings and confirm the intended dedicated asset IDs for each tier.
  2. Author/build the missing log inventory icons in the pixel asset pipeline.
  3. Update item/icon status wiring and verify the full log family displays distinct icons in inventory.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added dedicated `oak_logs`, `maple_logs`, and `yew_logs` pixel-source assets using the canonical log-bundle palette family already shared with held-item appearance data.
  - Updated runtime item wiring so each canonical log tier now points at its own dedicated pixel asset instead of the legacy shared `logs` icon.
  - Marked the new tier icons as bespoke/done in `content/icon-status.json` and switched the active review batch to the full log family for in-game side-by-side inspection.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-010 - Minimap destination flag persistence
- Status: Fixed
- Severity: S2
- Area: WORLD
- Source: Manual
- Links: `src/js/core.js`, `src/js/input-render.js`, `src/js/world.js`
- Repro:
  1. Click minimap destination.
  2. Observe marker lifecycle.
- Expected: Destination flag remains persistent/visible on minimap.
- Actual: Destination flag visibility is inconsistent/transient.
- Frequency: Often
- Owner: Pair
- Plan v1:
  1. Locate minimap marker state lifecycle.
  2. Persist destination marker until arrival/cancel.
  3. Validate across camera/movement updates.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added persistent `minimapDestination` state for walk targets, independent from short-lived click markers.
  - Destination state is now cleared only on arrival, cancellation by non-walk action, or immediate unreachable/no-path outcomes.
  - Minimap rendering now draws a dedicated flag glyph at the destination tile and keeps it visible across zoom/drag/camera updates.
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-012 - Menu input behavior (middle-click outside)
- Status: Fixed
- Severity: S2
- Area: WORLD
- Source: Manual
- Links: `src/js/inventory.js`, `src/js/skills/smithing/index.js`, `src/js/skills/fletching/index.js`
- Repro:
  1. Open menu.
  2. Click scroll wheel/middle mouse outside menu.
- Expected: Menu remains open on middle-click outside.
- Actual: Menu closed unexpectedly on non-left clicks.
- Frequency: Often
- Owner: Pair
- Plan v1:
  1. Audit menu dismissal handlers.
  2. Exclude middle-click outside from close events.
  3. Regression test left/right/middle behavior.
- Plan Outcome: Confirmed
- Fix Notes:
  - Outside-close handlers for skill panel, smithing UI, and fletching UI now ignore non-left clicks.
  - Escape-key and explicit close buttons remain unchanged.
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-019 - Smithing menu remove "no output space" message
- Status: Fixed
- Severity: S3
- Area: SMI
- Source: Manual
- Links: `src/js/skills/smithing/index.js`
- Repro:
  1. Open smithing menu with constrained inventory.
- Expected: Message is removed from smithing menus.
- Actual: `No output space` row issue text was shown in smithing menu.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Locate smithing menu message source.
  2. Remove/hide message in smithing context.
  3. Ensure blocked craft state remains understandable.
- Plan Outcome: Confirmed
- Fix Notes:
  - Removed `No output space` from smithing menu issue generation only.
  - Start/runtime output-capacity gating and warning chat remain in place.
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-047 - Cooking same-fire switch cadence and level gate
- Status: Fixed
- Severity: S2
- Area: Other
- Source: Manual
- Links: `src/js/skills/cooking/index.js`, `tools/tests/cooking-runtime-tests.js`, `src/js/skills/cooking/STATUS.md`, `src/js/skills/cooking/ROADMAP.md`
- Repro:
  1. Try to use a higher-tier raw fish on a fire while below that fish's required cooking level.
  2. Start cooking one fish type on a fire, then use a different raw fish on that same fire just before the next attempt tick.
- Expected: Under-level foods cannot begin cooking, and same-fire switching replaces the active cooking recipe without adding a dead tick.
- Actual: The runtime allowed under-level cooking starts, and same-fire switching re-entered the generic interact/start flow, which could reset the cooking timer.
- Frequency: Often
- Owner: Codex
- Plan v1:
  1. Add per-recipe cooking level gates to both the use-item and start paths.
  2. Hot-swap active same-fire cooking sessions directly instead of queueing a fresh interact/start.
  3. Add targeted runtime regression coverage and sync the cooking docs.
- Plan Outcome: Confirmed
- Fix Notes:
  - `src/js/skills/cooking/index.js` now enforces per-fish cooking level requirements before queuing or starting a cooking action.
  - Same-fire recipe swaps now mutate the live cooking processing session in place and preserve the active `nextTick` cadence instead of restarting from a fresh timer.
  - Added `tools/tests/cooking-runtime-tests.js` and wired it into `npm test` with level-gate, same-tick swap, blocked swap, and animation-contract coverage.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-026 - Skills menu completeness (all skills present)
- Status: Fixed
- Severity: S2
- Area: HUD
- Source: Manual
- Links: `index.html`, `src/js/world.js`
- Repro:
  1. Open skills menu.
- Expected: All skills are present in skills menu.
- Actual: Crafting and fletching were missing from skills menu.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Compare skills menu entries against skill manifest.
  2. Add missing skills/icons.
  3. Verify menu layout and interactions.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added Crafting and Fletching skill tiles to the stats/skills menu.
  - Extended `refreshSkillUi` key mapping so both tiles receive live level updates.
  - Existing tile-click progression panel behavior is reused without additional routing changes.
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-022 - HUD running button overlap with minimap
- Status: Fixed
- Severity: S2
- Area: HUD
- Source: Manual
- Links: `index.html`
- Repro:
  1. Open HUD at default and small viewport sizes.
- Expected: Running button does not overlap minimap.
- Actual: Run button overlapped minimap edge in the prior anchored layout.
- Frequency: Often
- Owner: Pair
- Plan v1:
  1. Audit HUD layout constraints.
  2. Reposition/resize controls to prevent overlap.
  3. Validate desktop + mobile breakpoints.
- Plan Outcome: Confirmed
- Fix Notes:
  - Repositioned `#runToggleBtn` to sit outside the inventory panel on its bottom-left edge, eliminating minimap overlap.
  - Anchored the button to `#main-ui-container` so it follows panel transform/state changes (including UI expand and tab/window context changes).
  - Preserved existing run-toggle behavior and event wiring.
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-023 - Run button icon pass (replace RUN text)
- Status: Fixed
- Severity: S3
- Area: HUD
- Source: Manual
- Links: `index.html`
- Repro:
  1. Inspect run toggle button UI.
- Expected: Stylized running-figure icon instead of `RUN` text label.
- Actual: Text label was shown.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Design/select running icon asset.
  2. Swap button label rendering to icon.
  3. Verify legibility and active/inactive states.
- Plan Outcome: Confirmed
- Fix Notes:
  - Replaced `RUN` text with a refined inline running-figure SVG icon for clearer silhouette readability.
  - Kept `title`/`aria-label` semantics and existing active/inactive color state behavior.
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-024 - HUD map button for full world map
- Status: Fixed
- Severity: S2
- Area: HUD
- Source: Manual
- Links: `index.html`, `src/js/core.js`, `src/js/world.js`
- Repro:
  1. Inspect HUD navigation actions.
- Expected: Map button opens full world map.
- Actual: No full-map button/action was available in HUD.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Add map button control to HUD.
  2. Implement full map panel/modal.
  3. Wire open/close and navigation interactions.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added circular world-map HUD button with pictogram at the minimap's lower-left anchor position.
  - Implemented centered full-map overlay panel with close button, backdrop close, and Escape-to-close handling.
  - Added full-map canvas rendering from the world offscreen map plus player heading/marker overlays.
  - Implemented world-map interaction as view-only navigation controls: mouse-wheel zoom and left-click drag panning when zoomed in.
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-025 - Tooltip gating by walking distance
- Status: Fixed
- Severity: S2
- Area: HUD
- Source: Manual
- Links: `src/js/input-render.js`
- Repro:
  1. Hover interactable object outside walking distance.
- Expected: Object tooltips do not show when object is out of walking distance.
- Actual: Tooltip previously appeared regardless of target distance.
- Frequency: Often
- Owner: Pair
- Plan v1:
  1. Add distance gate to tooltip display condition.
  2. Reuse interaction reachability checks if available.
  3. Validate near/far edge cases and performance.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added tooltip distance gating helper that resolves an actionable target tile (including fishable water edge handling).
  - Tooltips are now suppressed when hovered targets are beyond a 16-tile walking-distance band from the player.
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-028 - Inventory tooltip positioning (avoid swap-left-click block)
- Status: Fixed
- Severity: S2
- Area: HUD
- Source: Manual
- Links: `index.html`, `src/js/inventory.js`, `src/js/input-render.js`
- Repro:
  1. Trigger item tooltip at bottom of screen.
  2. Attempt to use `swap left click` menu.
- Expected: Tooltip is raised so it does not block `swap left click` menu access.
- Actual: Tooltip blocks menu interaction.
- Frequency: Often
- Owner: Pair
- Plan v1:
  1. Adjust tooltip anchor/offset near screen bottom.
  2. Add collision avoidance with context menu bounds.
  3. Validate on multiple resolutions/scales.
- Plan Outcome: Confirmed
- Fix Notes:
  - Replaced inventory slot native `title` tooltips with a custom in-app inventory tooltip layer to avoid browser-tooltip overlap behavior.
  - Tooltip positioning now raises near screen-bottom collisions and performs explicit overlap avoidance against both the context menu and `swap left click` submenu bounds.
  - Context-menu open/close paths now explicitly hide the inventory tooltip so menu interaction remains unobstructed.
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

## Closed (Verified)
<!-- Verified fixed and documented -->

### HIT-011 - Ground item stack count indicator (n)
- Status: Closed
- Severity: S2
- Area: WORLD
- Source: Manual
- Links: `src/js/input-target-interaction-runtime.js`, `tools/tests/input-target-interaction-runtime-guard.js`
- Repro:
  1. Drop multiple items on same tile.
- Expected: Tile/item indicator shows quantity as `(n)`.
- Actual: Ground-item context menu and hover labels now show tile stack counts as `(n)`.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Aggregate ground stack counts by tile.
  2. Render count overlay/label.
  3. Confirm updates on add/remove/pickup events.
- Plan Outcome: Confirmed
- Fix Notes:
  - Added tile-level ground stack aggregation (`getGroundTileStackCount`) and label formatting (`formatGroundItemDisplayName`) helpers.
  - Ground-item context menu and hover tooltip labels now append ` (n)` when multiple stacks share the same tile.
  - Stack counts are computed live from `groundItems`, so indicators update automatically on drop/add/pickup changes.
  - Verified the display-name contract with `node .\tools\tests\input-target-interaction-runtime-guard.js`.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-007 - Mining spot layout pass (spread out, avoid rows)
- Status: Closed
- Severity: S3
- Area: WORLD
- Source: Manual
- Links: `src/game/world/mining-runtime.ts`, `content/world/regions/main_overworld.json`, `tools/tests/mining-layout-guard.js`
- Repro:
  1. Inspect mining node layouts.
- Expected: Mining spots are more spread out and not arranged in neat straight rows.
- Actual: Node placement can look too linear/dense.
- Frequency: Often
- Owner: Pair
- Plan v1:
  1. Define spacing/no-row heuristics.
  2. Reposition existing node clusters.
  3. Validate accessibility and progression pacing.
- Plan Outcome: Confirmed
- Fix Notes:
  - Reworked the authored mining runtime placement in `src/game/world/mining-runtime.ts` from simple radial filling into deterministic clumps plus strays, with explicit line-conflict penalties so starter-town mines no longer freeze into obvious rows/diamond lattices.
  - Regenerated `main_overworld` mining nodes/routes from the new runtime and hand-tuned the outpost quarry cluster so current authored mining content follows the same spread/no-row goal.
  - Added `tools/tests/mining-layout-guard.js` and wired it into `npm test` to lock in zero straight mining triples, bounded line occupancy, and minimum spacing across current mining routes.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

## Parking Lot
<!-- Ideas worth keeping, but not urgent -->
