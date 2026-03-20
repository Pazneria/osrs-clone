# Cooking Status

## Done
- [x] COOKING-AUDIT-2026-03: Spec governance sync completed (roadmap tables, status tracking, and content skill mirrors aligned to runtime spec version `2026.03.m6`).
- [x] COOKING-001: Core cooking loop and XP leveling baseline documented.
- [x] COOKING-002: Early fish-to-food progression and fire-based source model defined.
- [x] COOKING-003: Roadmap expanded with full cooking design spec (success/burn formulas, runtime, eating, economy, dependencies).
- [x] COOKING-004: Canonical cooking recipe/timing data wired in `SkillSpecs` for runtime lookup.
- [x] COOKING-005: Runtime cooking processing-session flow implemented (use-item routing, per-tick attempts, stop conditions).
- [x] COOKING-006: Success/burn resolution wiring implemented (raw consumption, cooked/burnt output, XP-on-success, fire validation).
- [x] COOKING-007: Eating runtime integration completed (immediate heal, per-food eat cooldown ticks, same-tick attack/cast restrictions).
- [x] COOKING-008: Merchant/economy alignment completed for raw-cooked-burnt fish sell behavior (explicit fish-merchant sell values plus unchanged general-store half-price fallback).
- [x] COOKING-009: Training-location placement pass completed for starter campfire, riverbank fire line, dockside fire line, and deep-water dock fire line (with world getters and QA teleports).
- [x] COOKING-010: Cross-skill integration pass completed for fishing raw-fish stock ownership and firemaking fire-lifecycle interactions (fishing-owned merchant unlock coverage + fire-lifecycle tick wiring synced to firemaking spec lifetime data).
- [x] COOKING-011: UX polish pass completed for interruption/switching and animation consistency (per-fish level gates now block under-level cooking in both use-item and start flows, same-fire fish swaps preserve the active tick cadence instead of resetting it, and dedicated runtime tests cover the clip/suppress-equipment contract).
- [x] COOKING-012A: Burn-rate rebalance completed with a shared unlock-relative cubic burn curve (33% at unlock, 10% at +10, 5% at +20, 0% at +30), removal of legacy burn-difficulty/item burn fields, and live UI burn-chance display.

## Now

## Next
- [ ] COOKING-012: Remaining balance pass using expected XP/value-per-action targets across the 1-40 food bands beyond the burn-curve rebalance.

## Later
- [ ] COOKING-013: Progression expansion pass for additional cookable families beyond early fish baseline.
