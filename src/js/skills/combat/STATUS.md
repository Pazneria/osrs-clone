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
- [x] COMBAT-011: Added melee attack-style UI so the player can switch Attack / Strength / Defence in-game.
- [x] COMBAT-007: First-pass loot table bands and drop authoring rules are now locked against live enemy tables, general-store direct-sale benchmarks, and focused content-guard coverage.
- [x] COMBAT-013: Rebuilt the combat simulator around typed combat content, canonical melee formulas, runtime item combat profiles, and deterministic simulator guard coverage.
- [x] COMBAT-014: Combat progression bands now classify enemy difficulty, loot ceilings, and placement stages across starter, mid-band, and later-region rollout planning.
- [x] COMBAT-015: First-pass encounter coverage now includes an optional southeast camp-threat pocket with bear, heavy brute, and fast striker spawns locked by topology and world parity guards.
- [x] COMBAT-016A: Authored patrol routes now have a first guarded slice on the east-outpost north guard, with patrol-aware idle movement, route cloning, chase-envelope coverage, world validation, and parity guards.
- [x] COMBAT-016B: Aggressive same-group ally assist now uses authored spawn-group IDs, local assist radius checks, leash/path validation, and a one-tick opening cooldown so camps can coordinate without pulling passive critters or distant group members.
- [x] COMBAT-017: Ranged player combat is live on the shared combat core with bow and arrow item contracts, ranged-range attacks, ammo selection and consumption, Ranged XP awards, projectile visuals, and focused runtime/item guards.
- [x] COMBAT-018: Magic player combat is live on the shared combat core with staff contracts, elemental/combination rune fuel selection and consumption, staff-range casting, Magic XP awards, and rune-colored projectile visuals.
- [x] COMBAT-019A: Broader combat balance tooling now compares melee, ranged, and magic player builds with ammo/rune-aware deterministic simulator summaries.
- [x] COMBAT-019B1: Water-family rune hits now apply the typed `Chilled` status effect, delaying an enemy's next swing by one tick with reset/respawn-safe runtime state and focused domain/runtime coverage.
- [x] COMBAT-019B2A: Active `Chilled` effects now appear above affected combat targets with their remaining duration and a concise tactical explanation.
- [x] COMBAT-019B2B1: Earth and Dust rune hits now apply typed `Sundered` for three ticks, reducing the target's effective Defence by 3 with live target feedback and focused runtime coverage.

## Now
- [x] COMBAT-019B2B2: Air rune hits now apply typed `Disoriented` for two ticks, reducing enemy attack accuracy by 3 with live target feedback and focused runtime coverage.

## Next
- [ ] COMBAT-019B2B3: Add player-triggered special attacks and later elemental status effects beyond Chilled, Sundered, and Disoriented.

## Later
- [ ] COMBAT-020: Add advanced encounter content such as tougher camps, gatekeeper enemies, mini-bosses, and later-region combat objectives.
- [ ] COMBAT-021: Add region-scale combat population tooling for later-world expansion, including denser enemy ecosystems and named encounter chains.
