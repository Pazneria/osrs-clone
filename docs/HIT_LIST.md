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
- Status: Backlog
- Severity: S2
- Area: WORLD
- Source: Manual
- Links:
- Repro:
  1. Survey current NPC spawns.
- Expected: Every NPC has a set location and associated building/home/base.
- Actual: Some NPC placement feels unattached/abstract.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Produce NPC placement manifest.
  2. Map each NPC to a home/base location.
  3. Implement and smoke test travel/interaction paths.
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

### HIT-003 - Service distribution pass (add 8+ banks)
- Status: Backlog
- Severity: S2
- Area: WORLD
- Source: Manual
- Links:
- Repro:
  1. Traverse world service points.
- Expected: Bankers spread throughout the world with at least 8 additional bank locations.
- Actual: Bank distribution is too sparse.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Identify underserved regions.
  2. Propose 8+ bank placements.
  3. Implement and path-test interactions.
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

### HIT-004 - Road network pass with protected tiles
- Status: Backlog
- Severity: S2
- Area: WORLD
- Source: Manual
- Links:
- Repro:
  1. Inspect map traversal and spawn overlap.
- Expected: Roads exist broadly and are protected from resource/prop/world spawns.
- Actual: Road coverage/protection is incomplete.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Add road layer/metadata.
  2. Mark road tiles as spawn-protected.
  3. Validate no resource/prop overlap on roads.
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

### HIT-005 - Dock/coastline pass for dark-water fishing access
- Status: Backlog
- Severity: S2
- Area: WORLD
- Source: Manual
- Links:
- Repro:
  1. Inspect coastline and dark-water fishing access.
- Expected: Docks are visibly elevated with support pillars, and dark-water rod/harpoon fishing is performed from docks only.
- Actual: Dock visual/access rules are incomplete.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Design dock prefab with elevated deck + pillars.
  2. Assign dark-water fishing nodes to dock access points only.
  3. Validate interaction rules from dock tiles.
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

### HIT-006 - Terrain shaping pass for mining depressions/quarries
- Status: Fixed
- Severity: S3
- Area: WORLD
- Source: Manual
- Links: `src/js/world.js`, `tools/tests/world-bootstrap-parity.js`, `tools/tests/freeze-starter-town-parity.js`
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
  - Verified world bootstrap and starter-town freeze parity guards after the terrain pass.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-008 - Player creation menu
- Status: Backlog
- Severity: S2
- Area: WORLD
- Source: Manual
- Links:
- Repro:
  1. Start game from fresh state.
- Expected: Player creation flow/menu exists.
- Actual: No dedicated player creation flow.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Define player creation fields and defaults.
  2. Implement UI flow and state hydration.
  3. Gate game start behind successful creation.
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

### HIT-009 - Account/progress persistence across logins
- Status: Fixed
- Severity: S1
- Area: WORLD
- Source: Manual
- Links: `src/js/core.js`, `tools/tests/progress-persistence-guard.js`, `package.json`
- Repro:
  1. Play, gain progress, restart/login.
- Expected: Player progress auto-saves and persists across multiple logins.
- Actual: Persistence flow is incomplete.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Define save schema + versioning.
  2. Implement auto-save triggers and load-on-login.
  3. Add migration/error handling and verify with multi-session test.
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

### HIT-013 - Shoreline terrain clipping cleanup
- Status: Backlog
- Severity: S2
- Area: WORLD
- Source: Manual
- Links:
- Repro:
  1. Inspect beach/sand around water boundaries.
- Expected: Shoreline terrain blends cleanly without clipping.
- Actual: Beach/sand clipping visible around water.
- Frequency: Often
- Owner: Pair
- Plan v1:
  1. Identify clipping hotspots.
  2. Adjust shoreline mesh/tile transitions.
  3. Verify at multiple zoom levels/camera angles.
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

### HIT-014 - Tree spacing pass by tiered reserved areas
- Status: Fixed
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
- Status: Backlog
- Severity: S2
- Area: WC
- Source: Manual
- Links:
- Repro:
  1. Compare tree visuals across types.
- Expected: Each tree type has immediately distinguishable model identity.
- Actual: Visual differentiation is insufficient.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Define silhouette/color goals per tree type.
  2. Produce/import unique models.
  3. Hook type-to-model mapping and verify rendering/perf.
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

### HIT-016 - Tree habitat placement rules
- Status: Fixed
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
- Status: Backlog
- Severity: S2
- Area: MNG
- Source: Manual
- Links:
- Repro:
  1. Compare rock/gem node visuals across types.
- Expected: Each rock/gem type is immediately distinguishable.
- Actual: Visual identity overlap is too high.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Define model language per ore/gem tier.
  2. Produce/import unique node models.
  3. Map nodes and validate recognition in playtests.
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

### HIT-018 - Runecrafting altar placement pass
- Status: Backlog
- Severity: S2
- Area: RC
- Source: Manual
- Links:
- Repro:
  1. Survey altar spawn behavior.
- Expected: Altars exist at designated intentional world locations.
- Actual: Altar placement is random/procedural.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Define fixed altar location set.
  2. Remove random altar generation.
  3. Validate access paths and progression pacing.
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

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
- Links: `docs/ASSET_PIPELINE.md`, `index.html`, `src/js/core.js`, `src/js/content/icon-sprite-catalog.js`, `tools/content/validate-items.js`, `tools/tests/icon-sprite-catalog-guard.js`
- Repro:
  1. Inspect `makeIconSprite` in `src/js/core.js`.
  2. Observe dozens of inline SVG literals and hard-coded rune fallback sprite mappings.
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
  - Added `src/js/content/icon-sprite-catalog.js` as the canonical runtime sprite icon registry and fallback map, moving sprite key resolution out of `core.js`.
  - Updated `makeIconSprite` in `src/js/core.js` to resolve markup through `window.IconSpriteCatalog` and keep only a minimal generic placeholder fallback for unresolved sprite keys.
  - Added sprite-key coverage checks in `tools/content/validate-items.js` (via new `loadIconSpriteCatalog(...)` helper) so missing sprite references fail validation and fallback usage counts are reported.
  - Added regression guard `tools/tests/icon-sprite-catalog-guard.js` and wired it into `npm test` to prevent re-introducing inline sprite maps in `core.js`.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

### HIT-034 - World layout and service placement are embedded in `initLogicalMap`
- Status: Backlog
- Severity: S1
- Area: WORLD
- Source: Manual
- Links: `src/js/world.js`
- Repro:
  1. Inspect `initLogicalMap` and surrounding world setup code.
  2. Note inline ASCII blueprints (`castleFloor0`, `generalStoreBlueprint`, `smithingHallBlueprint`) and hard-coded stamp coordinates.
  3. Note direct arrays for merchant/service placements and one-off tile mutations.
- Expected: Building layouts, NPC/service spawns, and tile edits should come from structured world data files/manifests.
- Actual: World authoring data is tightly coupled to procedural/init code in one large function.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Define a world layout schema (buildings, stamps, objects, post-stamp edits).
  2. Move current inline layout/spawn definitions into content data files.
  3. Implement a loader/applier and validate parity against current map.
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

### HIT-035 - Training route tuning lives in hard-coded zone/band arrays
- Status: Backlog
- Severity: S2
- Area: WORLD
- Source: Manual
- Links: `src/js/world.js`, `src/js/core.js`
- Repro:
  1. Inspect `miningZoneSpecs`, `runecraftingAltarBandSpecs`, `woodcuttingZoneSpecs`, and `cookingRouteSpecs` in `src/js/world.js`.
  2. Inspect QA fallback route mappings in `src/js/core.js`.
  3. Observe distances, counts, spacing, and labels are manually tuned in code.
- Expected: Route/ring/zone progression tuning should be data-driven with centralized authoring.
- Actual: Tuning constants are spread across runtime files, making balancing changes code-heavy.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Create skill route config files for zone bands, counts, spacing, and labels.
  2. Refactor placement logic to read and validate those configs.
  3. Update QA route lookups to consume runtime-generated route metadata only.
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

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
- Status: Backlog
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
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

## Ready to Hunt
<!-- Triaged, scoped, ready for implementation -->

## In Progress
<!-- Actively being worked -->

## Blocked
<!-- Waiting on decision/dependency/repro -->

## Fixed (Pending Verify)
<!-- Code fix landed, waiting for confirmation pass -->

### HIT-043 - Eat cooldown can lock for hundreds/thousands of ticks after reload
- Status: Fixed
- Severity: S1
- Area: BUG
- Source: Manual
- Links: `src/js/core.js`, `src/js/world.js`, `tools/tests/progress-persistence-guard.js`, `tools/tests/combat-engagement-guard.js`
- Repro:
  1. Eat food to apply cooldown.
  2. Save/reload or continue a session with persisted combat state.
  3. Try to eat again and observe an unexpectedly large remaining-ticks warning.
- Expected: Eat cooldown should remain short (food-defined delay) and never restore as a long multi-hundred tick lockout.
- Actual: Persisted absolute cooldown ticks could survive restarts and produce very long wait times before eating again.
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
  - [ ] Repro no longer occurs / requirement met
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

### HIT-011 - Ground item stack count indicator (n)
- Status: Fixed
- Severity: S2
- Area: WORLD
- Source: Manual
- Links: `src/js/input-render.js`
- Repro:
  1. Drop multiple items on same tile.
- Expected: Tile/item indicator shows quantity as `(n)`.
- Actual: Quantity indicator missing/insufficient.
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

### HIT-007 - Mining spot layout pass (spread out, avoid rows)
- Status: Closed
- Severity: S3
- Area: WORLD
- Source: Manual
- Links: `src/game/world/mining-runtime.ts`, `content/world/regions/starter_town.json`, `content/world/regions/north_road_camp.json`, `tools/tests/mining-layout-guard.js`
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
  - Regenerated `starter_town` mining nodes/routes from the new runtime and hand-tuned the small `north_road_camp` outpost quarry cluster so current authored mining content follows the same spread/no-row goal.
  - Added `tools/tests/mining-layout-guard.js` and wired it into `npm test` to lock in zero straight mining triples, bounded line occupancy, and minimum spacing across current mining routes.
- Plan vNext (if revised):
  1.
- Verification:
  - [x] Repro no longer occurs / requirement met
  - [x] Regression checks passed
  - [x] Notes/logs/docs updated

## Parking Lot
<!-- Ideas worth keeping, but not urgent -->
