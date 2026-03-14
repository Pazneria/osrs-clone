# Combat Status

## Done
- [x] COMBAT-AUDIT-2026-03: Imported melee combat specs into repo-local combat docs and aligned the combat docs home with the skills tracking pattern.
- [x] COMBAT-AUDIT-2026-03B: Audited the live runtime footprint and recorded the hard-reset plan for removing dummy/owie combat paths.
- [x] COMBAT-001: Shipped the melee-only combat core runtime into the legacy tick loop with target locking, cooldown countdown, same-tick batch resolution, hit resolution, and death interruption.
- [x] COMBAT-002: Shipped the first player melee slice with saved combat state, melee-style persistence, and equip/use gating from explicit combat item data.
- [x] COMBAT-003: Shipped the first melee-only enemy slice with passive/aggressive enemy templates, chase/reset behavior, respawns, loot, combat-driven render hooks, and starter-town rat/goblin world placements.
- [x] COMBAT-004: Removed the placeholder combat path entirely (`DUMMY`, `owie`, and the old combat simulator/tooling) so the new melee runtime is the only live combat route.

## Now
- [ ] COMBAT-005: Run a starter-town combat encounter pass so enemy pockets, aggro spacing, and safe non-combat routes are clearly authored in-world.
- [ ] COMBAT-006: Expand runtime/content parity toward the first-pass melee-only enemy roster from spec (`Chicken`, `Boar`, `Wolf`, `Guard`, `Bear`, `Heavy Brute`, `Fast Striker`) with authored stats, drop tables, and respawn timing.
- [ ] COMBAT-007: Lock first-pass loot table bands and drop authoring rules so enemy drops support melee progression, economy pacing, and downstream item loops.
- [ ] COMBAT-008: Author spawn nodes and spawn groups for starter-town and first outer-road combat spaces, including safe-route spacing, encounter pockets, and leash/home placement.
- [ ] COMBAT-009: Add combat content validation and perf gates for spawn density, pathfinding load, tick hitching, loot-table sanity, and authored combat-region coverage.
- [ ] COMBAT-010: Run a combat-core parity pass for target-lock edge cases and shared rules that the specs treat as non-optional, including manual-movement lock break, cooldown persistence on break, hard-no-path vs temporary occupancy, auto-retaliate rules, hit-aggro cooldown = 1, and same-tick eat restrictions.

## Next
- [ ] COMBAT-011: Add melee attack-style UI so the player can switch Attack / Strength / Defence in-game.
- [ ] COMBAT-012: Surface combat state better in the HUD with clearer target, hitpoint, and cooldown feedback during fights.
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
