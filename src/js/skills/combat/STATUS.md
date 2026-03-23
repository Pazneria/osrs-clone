# Combat Status

## Done
- [x] COMBAT-AUDIT-2026-03: Imported melee combat specs into repo-local combat docs and aligned the combat docs home with the skills tracking pattern.
- [x] COMBAT-AUDIT-2026-03B: Audited the live runtime footprint and recorded the hard-reset plan for removing dummy/owie combat paths.
- [x] COMBAT-001: Shipped the melee-only combat core runtime into the legacy tick loop with target locking, cooldown countdown, same-tick batch resolution, hit resolution, and death interruption.
- [x] COMBAT-002: Shipped the first player melee slice with saved combat state, melee-style persistence, and equip/use gating from explicit combat item data.
- [x] COMBAT-003: Shipped the first melee-only enemy slice with passive/aggressive enemy templates, chase/reset behavior, respawns, loot, combat-driven render hooks, and starter-town rat/goblin world placements.
- [x] COMBAT-004: Removed the placeholder combat path entirely (`DUMMY`, `owie`, and the old combat simulator/tooling) so the new melee runtime is the only live combat route.
- [x] COMBAT-005: Finished the starter-town combat encounter pass so safe pockets, readable enemy spacing, and route buffers are now authored directly in world content.
- [x] COMBAT-006: Expanded first-pass melee enemy runtime content to include `Chicken`, `Boar`, `Wolf`, `Guard`, `Bear`, `Heavy Brute`, and `Fast Striker` with authored combat stats, behavior, respawn timing, and weighted drop tables.
- [x] COMBAT-008: Authored starter-town spawn nodes and spawn groups as the world-facing source of truth for encounter placement.
- [x] COMBAT-009: Added combat content validation and perf gates for spawn spacing, safe-route clearance, aggro overlap, leash/home placement, area density, pathfinding load, and tick hitching.
- [x] COMBAT-012: Added a live combat-status HUD panel that surfaces player/target HP, focus, range, and both swing cooldowns directly from the typed UI/combat runtime.
- [x] COMBAT-010A: Added regression guard coverage for same-tick eat restrictions and stale eat-cooldown sanitization so persisted cooldown ticks cannot lock food usage across session reloads.
- [x] COMBAT-010: Locked combat-core parity for manual lock breaks, cooldown persistence across breaks/retargets, temporary-occupancy vs hard-no-path pursuit handling, deterministic auto-retaliate order, explicit hit-aggro opening cooldown = `1`, and QA/runtime regression coverage for those shared rules.

## Now
- [ ] COMBAT-007: Lock first-pass loot table bands and drop authoring rules so enemy drops support melee progression, economy pacing, and downstream item loops.

## Next
- [ ] COMBAT-011: Add melee attack-style UI so the player can switch Attack / Strength / Defence in-game.
- [ ] COMBAT-013: Rebuild the combat simulator around the canonical combat/melee formulas and data contracts.
- [ ] COMBAT-014: Build progression bands for combat content so enemy difficulty, drops, and placement scale cleanly across starter, mid-band, and later regions.
- [ ] COMBAT-015: Expand first-pass melee encounter coverage beyond starter-town into outer roads, camps, and guarded thresholds using the same authored spawn-node model.

## Later
- [ ] COMBAT-016: Add advanced roaming, patrols, ally-assist/group-aggro behavior, and richer encounter-state logic once the first-pass melee-only foundation is stable.
- [ ] COMBAT-017: Add ranged combat on top of the shared combat core.
- [ ] COMBAT-018: Add magic combat, rune/resource integration, and staff/spell identity.
- [ ] COMBAT-019: Add specials, broader balance tooling, and deeper combat build identity.
- [ ] COMBAT-020: Add advanced encounter content such as tougher camps, gatekeeper enemies, mini-bosses, and later-region combat objectives.
- [ ] COMBAT-021: Add region-scale combat population tooling for later-world expansion, including denser enemy ecosystems and named encounter chains.
