# Combat Roadmap

## Canonical Runtime Source

Combat runtime contracts live in `src/game/contracts/combat.ts` and the shared melee formulas live in `src/game/combat/formulas.ts`.
The imported spec copies in this folder are the canonical design references for the current melee rollout.

## Purpose

Combat is a shared system, not a `SkillRuntime` skill.

It owns target locking, cooldowns, attack batching, hit resolution, damage/heal application, death interruption, and combat-state persistence.
Melee plugs into that shared core as the first playable slice.

## Scope

| Area | Current Ownership |
| --- | --- |
| Combat Core | Shared tick timing, target validation, cooldown countdown, same-tick batch resolution, damage/heal application, death interruption |
| Melee | Player melee formulas, item attack profiles, melee style selection, melee equipment requirements |
| Enemy Runtime | Enemy type definitions, spawn nodes, aggro/chase/reset behavior, drops, respawns, world-instance runtime state |
| Skills / Economy | Upstream creation and values for melee-relevant items |

## Melee v1 Slice

| Deliverable | Status |
| --- | --- |
| Repo-local combat docs home (`STATUS.md`, `ROADMAP.md`, imported specs) | In progress |
| Player melee runtime with locked-target loop | In progress |
| Passive rat + aggressive goblin enemy content | In progress |
| Placeholder combat removal (`DUMMY`, `owie`, old combat sim) | Complete |
| Combat-focused tests and rollout guards | In progress |

## Data Contracts

### Player

- Combat state persists current hitpoints, remaining attack cooldown, locked target id, combat target kind, selected melee style, auto-retaliate flag, and combat-state markers.
- Player melee performance derives from explicit `combat` item data plus combat skills.
- Required Attack level gates melee use, even when a tool is equipped through another system flow.

### Items

- Equippable held items expose explicit melee-ready combat data instead of relying on placeholder `stats.atk/def/str` math.
- Swords, axes, pickaxes, fishing rods, and harpoons all define attack profile, melee bonuses, and required Attack level.
- Armor exposes split defense bonuses through combat data, with v1 copying the first-pass melee armor band across melee/ranged/magic defense.

### Enemies

- Enemy type definitions own reusable melee combat and aggro defaults.
- Spawn nodes own placed world authoring and respawn timing.
- Runtime state owns live health, state, locked target, cooldown, resolved home/spawn tiles, chase/aggro radius, and live positioning.

## Runtime Rules

### Core Loop

1. Decrement player/enemy cooldowns at tick start.
2. Validate locked targets and break combat immediately on invalid/dead targets.
3. Acquire aggressive proximity aggro when the player is reachable.
4. Build a same-tick ready-attack batch for every actor in range with cooldown `0`.
5. Resolve the batch simultaneously, then apply damage, deaths, retaliation, and cooldown starts.
6. Pursue on later ticks when the target is out of range; actors that attack do not move on that tick.

### Enemy Behavior

- Aggressive enemies proximity-aggro within authored aggro radius.
- Passive enemies do not auto-aggro by proximity but enter combat when directly engaged.
- Chase range is anchored to the enemy home tile.
- Reset sends enemies back to home, then restores full HP and idle state on arrival.
- Dead enemies respawn from authored spawn nodes after their respawn timer.

## Cross-System Dependencies

| Dependency | Why It Matters |
| --- | --- |
| Inventory / Equipment | Combat reads equipped combat data and respects item equip rules |
| HUD | Combat stats view now derives from the combat domain instead of placeholder additive stats |
| World / Input | Combat plugs into the legacy tick loop, pathing, hitsplats, and interaction raycasts |
| Save Runtime | Combat fields must migrate safely without wiping progress |
| Economy / Drops | Enemy deaths spawn authored first-pass loot into the existing ground-item loop |

## Follow-Up

1. Add melee style selection UI and clearer combat state surfacing in the HUD.
2. Rebuild the combat simulator from the canonical formulas and content contracts.
3. Add more melee enemies and encounter placement before layering ranged/magic on top.
