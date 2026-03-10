# Fishing Status

## Done
- [x] FISHING-001: Core fishing loop and XP leveling baseline documented.
- [x] FISHING-002: Early fish progression and tool unlock path (net/rod/harpoon) defined.
- [x] FISHING-003: Roadmap expanded with full fishing design spec (progression, formulas, runtime, economy, NPCs).
- [x] FISHING-004: Canonical shallow-water fish/timing/catch data wired in `SkillSpecs` for runtime lookup.
- [x] FISHING-005: Runtime fishing gather-session flow implemented (start, per-tick attempts, stop conditions).
- [x] FISHING-006: Catch resolution wiring implemented for catch-chance scaling and weighted fish selection.
- [x] FISHING-QA-001: Inventory-capacity behavior aligned and validated (cannot start when full, immediate stop on the catch tick that fills the last slot).

## Now
- [ ] FISHING-007: Method-specific requirement wiring for bait/tool consumption (especially rod/bait flows).
- [ ] FISHING-008: Deep-water split integration (harpoon mixed table vs rune-harpoon swordfish-only table).

## Next
- [ ] FISHING-009: Merchant fish-stock unlock system (per-fish, per-merchant 50-sell thresholds).
- [ ] FISHING-010: Economy and item-value alignment across fish, bait, and fishing tools.
- [ ] FISHING-011: Training-location and world-placement pass across standard/deep-water bands.

## Later
- [ ] FISHING-012: Fishing-teacher quest and rune-harpoon reward/replacement flow integration.
- [ ] FISHING-013: Balance pass using expected fish/xp/gold-per-tick targets by method and level band.