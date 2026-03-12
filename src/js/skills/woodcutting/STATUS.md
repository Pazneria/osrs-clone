# Woodcutting Status

## Done
- [x] WOODCUTTING-AUDIT-2026-03: Spec governance sync completed (roadmap tables, status tracking, and content skill mirrors aligned to runtime spec version `2026.03.m6`).
- [x] WOODCUTTING-001: Core woodcutting loop and XP progression baseline documented.
- [x] WOODCUTTING-002: Tree and axe progression bands with tool power/speed structure defined.
- [x] WOODCUTTING-003: Roadmap expanded with full woodcutting design spec (formulas, depletion, runtime state, economy, NPCs).
- [x] WOODCUTTING-004: Canonical tree node/timing data wired in `SkillSpecs` for runtime lookup.
- [x] WOODCUTTING-005: Runtime tree gather session flow wired (attempt timing, success resolution, stop conditions).
- [x] WOODCUTTING-006: Chop-attempt resolution wiring implemented with axe tool power and speed-bonus intervals.
- [x] WOODCUTTING-007: Random depletion and stump transition behavior wired into on-success resolution.
- [x] WOODCUTTING-QA-001: Inventory-capacity behavior aligned and validated (cannot start when full, immediate stop on the success tick that fills the last slot, no overfill attempt tick).
- [x] WOODCUTTING-008: Merchant and item-value alignment for logs/axes, including rune-axe non-shop rule handling.
- [x] WOODCUTTING-009: Training-location placement pass for normal-through-yew bands with area-gating hooks.
- [x] WOODCUTTING-011: World-content polish complete for structured forest routing, starter-pond showcase tree lineup, and per-tree visual differentiation baseline (textured oak silhouette pass).
- [x] WOODCUTTING-010: Cross-skill integration pass for downstream firemaking/fletching log-demand balancing (runtime guardrails + demand diagnostics via SkillSpecRegistry summary helper).

## Now
- [ ] WOODCUTTING-014: Continue per-tree silhouette polish for willow/maple/yew using the starter-pond showcase row.

## Next
- [ ] WOODCUTTING-012: Balance pass using expected logs/xp/gold-per-tick targets across tree tiers.

## Later
- [ ] WOODCUTTING-013: Progression expansion pass for additional tree tiers and gating content.
