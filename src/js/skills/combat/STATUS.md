# Combat Status

## Done
- [x] COMBAT-AUDIT-2026-03: Imported melee combat specs into repo-local combat docs and aligned the combat docs home with the skills tracking pattern.
- [x] COMBAT-AUDIT-2026-03B: Audited the live runtime footprint and recorded the hard-reset plan for removing dummy/owie combat paths.
- [x] COMBAT-001: Shipped the melee-only combat core runtime into the legacy tick loop with target locking, cooldown countdown, same-tick batch resolution, hit resolution, and death interruption.
- [x] COMBAT-002: Shipped the first player melee slice with saved combat state, melee-style persistence, and equip/use gating from explicit combat item data.
- [x] COMBAT-003: Shipped the first melee-only enemy slice with passive/aggressive enemy templates, chase/reset behavior, respawns, loot, and combat-driven render hooks.
- [x] COMBAT-004: Removed the placeholder combat path entirely (`DUMMY`, `owie`, and the old combat simulator/tooling) so the new melee runtime is the only live combat route.

## Now

## Next
- [ ] COMBAT-005: Add melee attack-style UI so the player can switch Attack / Strength / Defence in-game.
- [ ] COMBAT-006: Rebuild the combat simulator around the canonical combat/melee formulas and data contracts.
- [ ] COMBAT-007: Expand the melee enemy roster with more authored templates and encounter placement.

## Later
- [ ] COMBAT-008: Add ranged combat on top of the shared combat core.
- [ ] COMBAT-009: Add magic combat, rune/resource integration, and staff/spell identity.
- [ ] COMBAT-010: Add specials, broader balance tooling, and more advanced enemy assist/aggro behavior.
