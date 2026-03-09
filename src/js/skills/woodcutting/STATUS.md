# Woodcutting Status

## Done
- [x] WOODCUTTING-001: Core woodcutting loop and XP progression baseline documented.
- [x] WOODCUTTING-002: Tree and axe progression bands with tool power/speed structure defined.
- [x] WOODCUTTING-003: Roadmap expanded with full woodcutting design spec (formulas, depletion, runtime state, economy, NPCs).
- [x] WOODCUTTING-QA-001: Inventory-capacity behavior aligned and validated (cannot start when full, immediate stop on the success tick that fills the last slot, no overfill attempt tick).

## Now
- [ ] WOODCUTTING-004: Data model pass for tree stats (difficulty/xp/min-max logs/depletion chance/respawn).
- [ ] WOODCUTTING-005: Runtime tree session state implementation (available/depleted, session expiry, respawn tick handling).
- [ ] WOODCUTTING-006: Chop-attempt resolution wiring with axe tool power + speed bonus interval behavior.

## Next
- [ ] WOODCUTTING-007: Depletion model integration (forced cap vs random depletion checks after minimum logs).
- [ ] WOODCUTTING-008: Merchant and item value alignment for logs/axes, including rune-axe non-shop rule handling.
- [ ] WOODCUTTING-009: Training location placement pass for normal through yew bands with area gating hooks.

## Later
- [ ] WOODCUTTING-010: Cross-skill integration pass for downstream firemaking and fletching log-demand balancing.
- [ ] WOODCUTTING-011: World-content polish for advanced woodsman progression and higher-tier forest routing.
- [ ] WOODCUTTING-012: Balance pass using expected logs/xp/gold per tick targets across tree tiers.

