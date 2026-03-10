# Firemaking Status

## Done
- [x] FIREMAKING-001: Core firemaking loop and XP progression baseline documented.
- [x] FIREMAKING-002: Log-tier progression and tinderbox tool requirements defined.
- [x] FIREMAKING-003: Roadmap expanded with full firemaking design spec (ignition chances, runtime states, economy, dependencies).
- [x] FIREMAKING-004: Canonical firemaking recipe/timing data wired in `SkillSpecs` for runtime lookup.
- [x] FIREMAKING-005: Runtime firemaking session flow implemented (continuous attempts, success transition, movement handoff).
- [x] FIREMAKING-006: Ignition resolution wiring implemented (per-tick success checks and consume-on-success behavior).
- [x] FIREMAKING-008: Lit-fire compatibility wired for cooking target validation through shared active-fire checks.
- [x] FIREMAKING-QA-001: Ignition attempt loop behavior aligned and validated (continuous per-tick attempts until success or manual/invalid stop; consume-on-success only).

## Now
- [ ] FIREMAKING-007: Ashes ground-item behavior integration (stacking, pickup, despawn timing, non-blocking tile interaction).
- [ ] FIREMAKING-009: Merchant and item-value alignment for logs, tinderbox, and ashes with general-store half-price rules.

## Next
- [ ] FIREMAKING-010: Training-location placement and traversal polish for repeated-firemaking routes.
- [ ] FIREMAKING-011: Cross-skill balance pass for log-supply pressure against woodcutting and cooking demand.

## Later
- [ ] FIREMAKING-012: Progression and polish pass for failure feedback, interruption behavior, and utility pacing.
- [ ] FIREMAKING-013: World-content expansion pass for higher-tier firemaking progression routes.