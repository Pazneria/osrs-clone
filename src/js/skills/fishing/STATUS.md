# Fishing Status

## Done
- [x] FISHING-001: Core fishing loop and XP leveling baseline documented.
- [x] FISHING-002: Early fish progression and tool unlock path (net/rod/harpoon) defined.
- [x] FISHING-003: Roadmap expanded with full fishing design spec (progression, formulas, runtime, economy, NPCs).
- [x] FISHING-004: Canonical shallow-water fish/timing/catch data wired in `SkillSpecs` for runtime lookup.
- [x] FISHING-005: Runtime fishing gather-session flow implemented (start, per-tick attempts, stop conditions).
- [x] FISHING-006: Catch resolution wiring implemented for catch-chance scaling and weighted fish selection.
- [x] FISHING-QA-001: Inventory-capacity behavior aligned and validated (cannot start when full, immediate stop on the catch tick that fills the last slot).
- [x] FISHING-007: Method-specific requirement wiring completed via `SkillSpecs.methods` + runtime validation/consumption for rod+bait.
- [x] FISHING-008: Deep-water split integrated (harpoon mixed tuna/swordfish table, rune-harpoon swordfish-only table).
- [x] FISHING-009A: Shallow-water interaction UX updated (left-click defaults to highest-priority eligible method; right-click lists method actions for net/rod/harpoon).
- [x] FISHING-009B: Explicit method selection wiring completed (use-item-on-water and context-menu method actions now force that method for the queued interaction and session start).
- [x] FISHING-009C: Harpoon equip path hardened (equip action maps reliably to `weapon` slot for harpoon/rune harpoon).
- [x] FISHING-QA-002: Fishing QA tooling added (`/qa fishspots`, `/qa gotofish <pond|pier|deep>`, `/qa diag fishing`).
- [x] FISHING-QA-003: `/qa setlevel` now sets both skill level and exact XP floor for that level (prevents snap-back on next XP gain).
- [x] FISHING-ANIM-001: Fishing animation split finalized (net baseline is net-only; distinct basic rod and harpoon animations; no fly-fishing-rod item path remains).
- [x] FISHING-010: Merchant fish-stock unlock system (per-fish, per-merchant 50-sell thresholds).
- [x] FISHING-011: Economy and item-value alignment across fish, bait, and fishing tools.
- [x] FISHING-012: Training-location and world-placement pass across standard/deep-water bands.

## Now

## Next

## Later
- [ ] FISHING-013: Fishing-teacher quest and rune-harpoon reward/replacement flow integration.
- [ ] FISHING-014: Balance pass using expected fish/xp/gold-per-tick targets by method and level band.
