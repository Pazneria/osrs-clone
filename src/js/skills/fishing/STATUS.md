# Fishing Status

## Done
- [x] FISHING-001: Core fishing loop and XP leveling baseline documented.
- [x] FISHING-002: Early fish progression and tool unlock path (net/rod/harpoon) defined.
- [x] FISHING-003: Roadmap expanded with full fishing design spec (progression, formulas, runtime, economy, NPCs).
- [x] FISHING-QA-001: Inventory-capacity behavior aligned and validated (cannot start when full, immediate stop on the catch tick that fills the last slot).

## Now
- [ ] FISHING-004: Data model pass for fish, water-type, and tool tables (levels/xp/weights/requirements/values).
- [ ] FISHING-005: Runtime fishing action state implementation (idle/fishing/stopped, tick attempts, stop conditions).
- [ ] FISHING-006: Catch resolution wiring for water-type catch chance + weighted fish selection + rod bait consumption.

## Next
- [ ] FISHING-007: Deep-water split integration (harpoon mixed table vs rune harpoon swordfish-only table).
- [ ] FISHING-008: Merchant fish-stock unlock system (per-fish, per-merchant 50-sell thresholds).
- [ ] FISHING-009: Economy and item value table alignment across fish, bait, and fishing tools.

## Later
- [ ] FISHING-010: Fishing teacher quest and rune harpoon reward/replacement flow integration.
- [ ] FISHING-011: Training location and world placement pass across standard/deep-water bands.
- [ ] FISHING-012: Balance pass using expected fish/xp/gold per tick targets by method and level band.

