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
- Status: Backlog
- Severity: S3
- Area: WORLD
- Source: Manual
- Links:
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
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

### HIT-007 - Mining spot layout pass (spread out, avoid rows)
- Status: Backlog
- Severity: S3
- Area: WORLD
- Source: Manual
- Links:
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
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

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
- Status: Backlog
- Severity: S1
- Area: WORLD
- Source: Manual
- Links:
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

### HIT-010 - Minimap destination flag persistence
- Status: Backlog
- Severity: S2
- Area: WORLD
- Source: Manual
- Links:
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
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

### HIT-011 - Ground item stack count indicator (n)
- Status: Backlog
- Severity: S2
- Area: WORLD
- Source: Manual
- Links:
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
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

### HIT-012 - Menu input behavior (middle-click outside)
- Status: Backlog
- Severity: S2
- Area: WORLD
- Source: Manual
- Links:
- Repro:
  1. Open menu.
  2. Click scroll wheel/middle mouse outside menu.
- Expected: Menu remains open on middle-click outside.
- Actual: Menu closes unexpectedly.
- Frequency: Often
- Owner: Pair
- Plan v1:
  1. Audit menu dismissal handlers.
  2. Exclude middle-click outside from close events.
  3. Regression test left/right/middle behavior.
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
- Status: Backlog
- Severity: S2
- Area: WC
- Source: Manual
- Links:
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
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

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
- Status: Backlog
- Severity: S3
- Area: WC
- Source: Manual
- Links:
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
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

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

### HIT-019 - Smithing menu remove "no output space" message
- Status: Backlog
- Severity: S3
- Area: SMI
- Source: Manual
- Links:
- Repro:
  1. Open smithing menu with constrained inventory.
- Expected: Message is removed from smithing menus.
- Actual: "no output space" message is shown.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Locate smithing menu message source.
  2. Remove/hide message in smithing context.
  3. Ensure blocked craft state remains understandable.
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

### HIT-020 - Smithing item level requirement rebalance
- Status: Backlog
- Severity: S2
- Area: SMI
- Source: Manual
- Links:
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
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

### HIT-021 - Fire spawn bug after tab inactivity
- Status: Backlog
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
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

### HIT-022 - HUD running button overlap with minimap
- Status: Backlog
- Severity: S2
- Area: HUD
- Source: Manual
- Links:
- Repro:
  1. Open HUD at default and small viewport sizes.
- Expected: Running button does not overlap minimap.
- Actual: Overlap occurs.
- Frequency: Often
- Owner: Pair
- Plan v1:
  1. Audit HUD layout constraints.
  2. Reposition/resize controls to prevent overlap.
  3. Validate desktop + mobile breakpoints.
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

### HIT-023 - Run button icon pass (replace RUN text)
- Status: Backlog
- Severity: S3
- Area: HUD
- Source: Manual
- Links:
- Repro:
  1. Inspect run toggle button UI.
- Expected: Stylized running-figure icon instead of `RUN` text label.
- Actual: Text label shown.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Design/select running icon asset.
  2. Swap button label rendering to icon.
  3. Verify legibility and active/inactive states.
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

### HIT-024 - HUD map button for full world map
- Status: Backlog
- Severity: S2
- Area: HUD
- Source: Manual
- Links:
- Repro:
  1. Inspect HUD navigation actions.
- Expected: Map button opens full world map.
- Actual: No full-map button/action in HUD.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Add map button control to HUD.
  2. Implement full map panel/modal.
  3. Wire open/close and navigation interactions.
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

### HIT-025 - Tooltip gating by walking distance
- Status: Backlog
- Severity: S2
- Area: HUD
- Source: Manual
- Links:
- Repro:
  1. Hover interactable object outside walking distance.
- Expected: Object tooltips do not show when object is out of walking distance.
- Actual: Tooltip still appears.
- Frequency: Often
- Owner: Pair
- Plan v1:
  1. Add distance gate to tooltip display condition.
  2. Reuse interaction reachability checks if available.
  3. Validate near/far edge cases and performance.
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

### HIT-026 - Skills menu completeness (all skills present)
- Status: Backlog
- Severity: S2
- Area: HUD
- Source: Manual
- Links:
- Repro:
  1. Open skills menu.
- Expected: All skills are present in skills menu.
- Actual: Skills menu is incomplete.
- Frequency: Always
- Owner: Pair
- Plan v1:
  1. Compare skills menu entries against skill manifest.
  2. Add missing skills/icons.
  3. Verify menu layout and interactions.
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

### HIT-027 - Skills menu icon opens dedicated progression view
- Status: Backlog
- Severity: S2
- Area: HUD
- Source: Manual
- Links:
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
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

### HIT-028 - Inventory tooltip positioning (avoid swap-left-click block)
- Status: Backlog
- Severity: S2
- Area: HUD
- Source: Manual
- Links:
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
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

### HIT-029 - Fletching cancel-on-click behavior
- Status: Backlog
- Severity: S1
- Area: FLT
- Source: Manual
- Links:
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
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

### HIT-030 - Fletching XP progression pass (log-tier multiples)
- Status: Backlog
- Severity: S2
- Area: FLT
- Source: Manual
- Links:
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
- Plan Outcome: Pending
- Fix Notes:
- Plan vNext (if revised):
  1.
- Verification:
  - [ ] Repro no longer occurs / requirement met
  - [ ] Regression checks passed
  - [ ] Notes/logs/docs updated

### HIT-031 - Fletching item level requirement rebalance
- Status: Backlog
- Severity: S2
- Area: FLT
- Source: Manual
- Links:
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

## Closed (Verified)
<!-- Verified fixed and documented -->

## Parking Lot
<!-- Ideas worth keeping, but not urgent -->
