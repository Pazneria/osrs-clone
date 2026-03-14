# Combat Roadmap

## Canonical Runtime Source

Combat runtime contracts live in `src/game/contracts/combat.ts`, enemy/drop/spawn content currently lives in `src/game/combat/content.ts`, and the shared melee formulas live in `src/game/combat/formulas.ts`.
The imported spec copies in this folder are the canonical design references for the current melee rollout.

## Purpose

Combat is a shared system, not a `SkillRuntime` skill.

It owns target locking, cooldowns, attack batching, hit resolution, damage/heal application, death interruption, and combat-state persistence.
It also owns shared non-style-specific combat rules such as manual target-lock break, auto-retaliate behavior, cooldown persistence on retarget/break, and same-tick eat interaction boundaries.
Melee plugs into that shared core as the first playable slice, and enemy/encounter content is part of the combat rollout rather than an afterthought owned by a separate skill module.

## Scope

| Area | Current Ownership |
| --- | --- |
| Combat Core | Shared tick timing, target validation, cooldown countdown, same-tick batch resolution, damage/heal application, death interruption |
| Melee | Player melee formulas, item attack profiles, melee style selection, melee equipment requirements |
| Enemy Runtime | Enemy type definitions, spawn nodes, aggro/chase/reset behavior, drops, respawns, world-instance runtime state |
| Encounter Content | Enemy placement, spawn-group layout, safe-route spacing, region-by-region combat population, encounter readability |
| Loot / Drop Authoring | Drop-table structure, drop-rate bands, item/coin value alignment, region-specific progression rewards |
| Combat UI / Feedback | Current target surfacing, hitpoint state, hitsplats, attack timing clarity, player combat-state messaging |
| Skills / Economy | Upstream creation and values for melee-relevant items |
| QA / Perf | Tick-cost validation, rollout guards, content validators, encounter safety checks |

## Melee v1 Slice

| Deliverable | Status |
| --- | --- |
| Repo-local combat docs home (`STATUS.md`, `ROADMAP.md`, imported specs) | Complete |
| Player melee runtime with locked-target loop | Complete |
| Passive rat + aggressive goblin enemy content | Complete |
| Placeholder combat removal (`DUMMY`, `owie`, old combat sim) | Complete |
| Combat-focused tests and rollout guards | Complete |
| Starter-town encounter authoring pass | Now |
| First-pass melee-only enemy template rollout beyond rat/goblin | Now |
| Loot-table and drop-band authoring pass | Now |
| Spawn-node / spawn-group authoring pass | Now |
| Combat content validation and perf-gate pass | Now |
| Combat HUD/target feedback pass | Complete |

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

### Encounter Authoring

- Combat content is authored into the world through explicit spawn nodes and spawn groups rather than piggybacking on merchant/travel NPC descriptors.
- The first-pass spawn contract already covers spawn node id, enemy id, spawn tile, optional home tile override, respawn ticks, facing yaw, enabled state, and spawn-group id.
- The roadmap leaves room to extend encounter authoring later with patrol routes, density caps, safe-distance-from-route rules, and local drop overrides where needed.
- In the first pass, spawn groups are organizational/content-authoring helpers only and do not automatically imply shared aggro, ally assist, shared respawn, or formation logic.

### Loot Tables

- Enemy loot needs an explicit authored contract rather than one-off inline drop guesses.
- The current first-pass contract already supports weighted entries, item vs coins vs nothing, and min/max quantity bands.
- The roadmap assumes later expansion for guaranteed drops, tertiary drops, conditional drops, and encounter-specific drop overrides.

## Runtime Rules

### Core Loop

1. Decrement player/enemy cooldowns at tick start.
2. Validate locked targets and break combat immediately on invalid/dead targets.
3. Acquire aggressive proximity aggro when the player is reachable.
4. Build a same-tick ready-attack batch for every actor in range with cooldown `0`.
5. Resolve the batch simultaneously, then apply damage, deaths, retaliation, and cooldown starts.
6. Pursue on later ticks when the target is out of range; actors that attack do not move on that tick.

### Target-Lock Edge Cases

- Manual player movement input clears the player combat target immediately.
- Breaking or replacing a locked target does not reset or shorten an already-active attack cooldown.
- Hard no-path failures should break target lock immediately; temporary occupancy blockage should keep lock and retry pathing.
- Auto-retaliate should only replace the player's target when the player lacks a currently valid lock/path under the shared combat rules.
- Same-tick attack batching should keep honoring fizzle rules when a target becomes invalid before the batch forms.

### Shared Combat Interaction Rules

- Universal hit-aggro should remain explicit: an idle enemy hit by the player becomes aggressive on that same tick and sets Remaining Attack Cooldown to `1`.
- Auto-retaliate target choice should stay deterministic when multiple valid attackers exist: first attacker, then closest attacker, then weakest-to-strongest tie-break order.
- Eating interaction remains a combat-core concern, not a melee-only concern.
- Same-tick eat restrictions from the shared combat/cooking rules should stay aligned as combat content expands.

### Enemy Behavior

- Aggressive enemies proximity-aggro within authored aggro radius.
- Aggressive enemies that acquire the player while already in valid melee range may attack immediately under the shared combat-core timing rules.
- Passive enemies do not auto-aggro by proximity but enter combat when directly engaged.
- First-pass melee enemies keep a current valid target instead of voluntarily switching to a closer or newer attacker.
- Chase range is anchored to the enemy home tile.
- Reset sends enemies back to home, then restores full HP and idle state on arrival.
- Dead enemies respawn from authored spawn nodes after their respawn timer.

### First-Pass Fairness Rules

- Core tutorial and economy routes should never require eating because of unavoidable aggro.
- Enemies should not soft-body-block the player into unavoidable repeated pulls in starter-safe spaces.
- Reset behavior should feel predictable: once an enemy leashes home, it should fully disengage and restore cleanly.
- First-pass camps should prefer readability over density; more complex swarm pressure is deferred until encounter rules are stronger.

## Enemy Content Plan

| Content Band | Role In The World | First-Pass Needs |
| --- | --- | --- |
| Passive critters | Opt-in starter combat and safe testing targets | Low HP, simple drops, readable placement away from forced routes |
| Aggressive trash mobs | Teach aggro, pursuit, and food pressure | Clear aggro bubbles, safe bypass paths, basic coin/weapon/tool drops |
| Durable melee bruisers | Introduce longer fights and sustained damage windows | Higher HP/defense, stronger drops, cleaner route spacing |
| Humanoid camps | Give the world authored combat ownership and encounter texture | Clustered spawns, shared visual identity, camp-safe boundaries |
| Gatekeeper enemies | Guard progression routes or optional danger pockets | Readable danger telegraph, deliberate placement, non-frustrating chase limits |
| Mini-boss anchors | Later combat goals and named encounters | Custom stats, unique drops, encounter-specific rules |

## First-Pass Enemy Template Rollout

These are the spec-aligned first-pass melee-only enemy templates that should drive content rollout before more advanced behavior systems are introduced.

| Enemy Template | World Role | Current Priority |
| --- | --- | --- |
| Rat | True low-threat starter pest | Live |
| Chicken | Harmless utility wildlife and opt-in low-risk target | Now |
| Goblin Grunt | Baseline early aggressive humanoid | Live |
| Boar | Early animal resource enemy | Now |
| Wolf | Fast early natural predator | Now |
| Guard | Sturdier zone-control melee enemy | Next |
| Bear | Slow, durable natural threat | Next |
| Heavy Brute | Slower heavy-damage melee enemy | Next |
| Fast Striker | High-pressure accuracy/speed enemy | Next |

Rule: the roadmap should exhaust this first-pass roster before it assumes more advanced behaviors like patrol logic, assist logic, or dynamic spawning.

## Loot Table Plan

### Purpose

Loot tables should do more than hand out random items.

They should:
- reinforce early melee progression
- create a reason to fight different enemies
- support the coin curve without flooding the economy
- feed existing downstream loops such as equipment upgrades and sellable drops
- preserve clear identity between harmless critters, trash mobs, camps, and later tougher enemies

### First-Pass Loot Rules

- Every enemy should be allowed to drop nothing; empty kills are part of pacing and keep early tables readable.
- Coin drops should be small and frequent for trash mobs, not large enough to replace all other early gold-making.
- Early enemies may drop low-tier melee gear, but starter-town drops should not skip the intended weapon progression band.
- Enemy tables should not undercut merchant pricing so hard that buying starter gear becomes pointless.
- Passive critters should have simple, low-value tables.
- Aggressive humanoids should carry the first meaningful combat loot identity.
- Region or encounter role should matter: roadside goblins, camp goblins, and gatekeepers do not all need identical tables.

### Loot Table Data Shape

| Field | Meaning |
| --- | --- |
| `kind` | Drop kind such as `nothing`, `coins`, or `item` |
| `weight` | Relative weighted chance within the table |
| `itemId` | Runtime item id when the entry is an item drop |
| `minAmount` | Minimum quantity granted when the entry resolves |
| `maxAmount` | Maximum quantity granted when the entry resolves |
| `notes` | Design-only guidance for why the entry exists or what role it serves |

### First-Pass Loot Bands

| Enemy Band | Typical Loot Identity | Notes |
| --- | --- | --- |
| Passive critters | Mostly nothing, tiny coin trickles, occasional flavor drops | Opt-in targets, not economy engines |
| Roadside aggressors | Small coin drops, low-tier melee gear, sellable basics | Teach that combat can fund gear and food |
| Camps / clusters | Better average value than lone trash mobs | Reward more dangerous pockets and multi-pull risk |
| Durable bruisers | Lower-frequency but more meaningful equipment/resource drops | Pushes progression without flooding supply |
| Gatekeepers | Distinctive table with stronger progression pressure | Should feel like a step up, not just more HP |
| Named encounters | Hand-authored table or override | Can justify unique drops and clearer identity |

### Loot QA Checklist

- No starter enemy should drop gear that invalidates the early merchant ladder too quickly.
- Coin output should be reviewed against food costs and early repair/gear expectations.
- Common drops should map cleanly onto actual item catalog values.
- Tables should be validated for empty or zero-weight configurations.
- Duplicate tables should be deliberate, not accidental copy-paste.
- Drops should be checked in aggregate against kill-time so value-per-tick stays sensible.
- First-pass tables should total `100%` and remain intentionally small/readable.

## Spawn / Respawn Model

### Core Spawn Rules

- First-pass combat uses authored spawn nodes rather than dynamic regional population systems.
- Each spawn node owns at most one live enemy instance at a time in the first pass.
- Spawned or respawned enemies begin as fresh idle instances at full health with no locked target and no preserved cooldown state.
- Spawn/home/roaming/chase values resolve from enemy template defaults plus explicit spawn-node overrides where authored.

### Respawn Rules

- Respawn timing begins on death.
- Respawned enemies are fresh instances, not resumed runtime state.
- Returning enemies restore fully only once they successfully reach Home Tile.
- Respawn timing should support repeated combat loops without instantly repopulating danger on top of the player.

### Movement / Roaming Constraints

- Default Movement Speed is fixed to `1 tile per tick` in the first pass.
- Combat Movement Speed is also fixed to `1 tile per tick` in the first pass, even though it remains a separate authored field.
- Roaming Radius is a placement/world-behavior field, not a combat-power field.
- Roaming is anchored to Spawn Tile, while chase/leash behavior is anchored to Home Tile.
- Aggro Radius, Chase Range, and Roaming Radius should be authored and reviewed using the same square/Chebyshev tile distance rule as the shared combat specs.
- Higher-than-1 combat movement speeds stay deferred until movement/collision semantics are explicitly expanded.

### First-Pass Respawn Bands

| Enemy Role | Respawn Band |
| --- | --- |
| Harmless wildlife | 12 seconds |
| Early animal resource enemy | 18 seconds |
| Early humanoid combat enemy | 20 seconds |
| Guard / sturdier humanoid | 25 seconds |
| Heavy threat | 30 seconds |

## World Rollout Plan

### Starter-Town Goals

- Keep the first town traversal loop safe between spawn, bank, general store, and core early-skill stations.
- Place passive enemies where players can opt into fights without accidental chain-aggro.
- Place aggressive enemies where their presence is legible, avoidable, and useful for learning pursuit/combat timing.
- Use encounter pockets and spawn-group spacing so enemies do not read as random clutter.
- Tie drops to early combat progression, with coins and basic melee gear reinforcing the new melee loop.

### Spawn Location Rules

- Every spawn should belong to an intentional encounter pocket, roadside lane, camp, or guarded threshold.
- Spawn tiles should leave enough adjacent walkable space for melee combat to resolve cleanly.
- Aggressive spawns should not overlap critical banks, merchants, ladders, or tutorial interaction lanes.
- Passive spawns can sit closer to safe paths, but should still avoid cluttering the main readability of town hubs.
- Multi-enemy pockets need enough separation that one pull does not accidentally become an unreadable dogpile.
- Home tiles and chase ranges should be authored with the surrounding terrain in mind, not left at arbitrary defaults.

### Spawn Group Plan

| Spawn Group Type | Purpose | First-Pass Rules |
| --- | --- | --- |
| Solo critter | Safe opt-in combat | Clear space around spawn, no forced aggro |
| Roadside pair | Teaches enemy density | Enemies visible before aggro range begins |
| Camp cluster | Local danger pocket | Shared visual identity, safe edge, deliberate spacing |
| Route gate | Warns the player that a path is hotter | Strong readability, predictable leash zone |
| Named anchor | Gives the area a combat landmark | Unique placement and stronger authored intent |

Rule: in first-pass melee-only combat, spawn groups are content grouping only. They do not automatically create ally-assist, shared target selection, or shared respawn behavior.

### Region Rollout Backlog

| Region Stage | Combat Need |
| --- | --- |
| Starter town | Safe intro targets, one basic aggressive pocket, simple loot ladder |
| First outer roads | More aggressive enemies and clearer risk/reward movement |
| Resource outskirts | Combat pressure near lucrative gathering routes without griefing them |
| Camp / ruin spaces | Higher enemy density and clearer encounter ownership |
| Later regions | Tougher bands, gatekeepers, named encounters, stronger drops |

### Expansion Phases

| Phase | Goal | Notes |
| --- | --- | --- |
| Phase 1 | Starter-town readability pass | Clean up rat/goblin placement, spacing, and safe routing |
| Phase 2 | Add more enemy templates | Build out passive, aggressive, and tougher melee enemy families |
| Phase 3 | Regional encounter rollout | Populate additional authored regions with combat-specific ownership |
| Phase 4 | Progression pacing pass | Match enemy difficulty/drops to route depth and player gear progression |
| Phase 5 | Advanced encounter structure | Add camps, gatekeepers, denser pockets, and later unique fights |

## Encounter Authoring Checklist

- Every combat region should have a clear answer for where safe travel ends and combat space begins.
- Aggressive enemies should not create unavoidable aggro on critical tutorial/economy routes.
- Spawn groups should leave enough open tiles for pursuit and melee range resolution to read cleanly.
- Respawn timing should reinforce area identity without making zones feel empty or overcrowded.
- Enemy drops should support the combat economy instead of duplicating generic merchant value with no progression purpose.
- Encounter visuals should make passive vs aggressive threats understandable before the player clicks them.
- Spawn/home tiles should not create confusing reset loops against walls, counters, or corners.
- Encounter layouts should be reviewed for whether the player can intentionally single-pull vs accidentally over-pull.

## Enemy Logic Expansion Plan

This is intentionally ordered after the first-pass roster, loot, and spawn work.
The enemy specs explicitly defer richer assist/group logic until the simpler authored melee-only package is stable.

### Targeting / Aggro

- Proximity aggro should remain deterministic and easily explainable in authored spaces.
- Later camps may optionally allow nearby allies to assist, but only once encounter readability rules are in place.
- Passive enemies can still react when directly attacked, but should not become pseudo-aggressive by accident.

### Pursuit / Reset

- Leash rules should protect the player from enemies dragging too far through peaceful town space.
- Returning enemies should prefer clean home restoration over half-state lingering behavior.
- Pursuit should stay compatible with same-tick melee rules and movement-before-next-tick expectations.

### Density / Clumping

- Multi-enemy spaces need anti-clump safeguards so pathfinding load and visual confusion stay manageable.
- Future camp logic can allow deliberate coordinated pressure, but only with authored limits and clearer combat UI.
- Enemy movement rules should avoid excessive oscillation around the player when multiple actors contest adjacent tiles.

## Explicit First-Pass Deferrals

These are worth keeping in the roadmap precisely so we do not accidentally treat them like current-slice requirements.

- advanced spawn randomization or dynamic region-driven spawning
- advanced roaming behavior beyond the simple current radius model
- group aggro, ally assist, or formation logic
- safe-spot exception systems
- ranged or magic enemy packages
- special attacks, status effects, or multi-phase enemies
- multi-tile enemies unless separately specified later
- nested/global loot-table systems
- final stack-size or tertiary-drop systems

## Cross-System Dependencies

| Dependency | Why It Matters |
| --- | --- |
| Inventory / Equipment | Combat reads equipped combat data and respects item equip rules |
| HUD | Combat stats view now derives from the combat domain instead of placeholder additive stats |
| World / Input | Combat plugs into the legacy tick loop, pathing, hitsplats, and interaction raycasts |
| World Content Authoring | Enemy placements, spawn groups, region ownership, and safe-route design all live in authored world data |
| Save Runtime | Combat fields must migrate safely without wiping progress |
| Economy / Drops | Enemy deaths spawn authored first-pass loot into the existing ground-item loop |
| Cooking / Food | Eating delay, same-tick attack/eat restrictions, and food pressure all intersect with combat timing |
| Visual Identity | Enemy appearance work needs to support fast in-world threat recognition |
| Performance | Combat cannot introduce visible tick hitches as encounter density increases |
| Merchant Progression | Enemy drops must coexist cleanly with gear sold by shops and produced by skill loops |
| Regional Routing | Spawn placement changes how players perceive safe roads, shortcuts, and danger pockets |

## QA / Perf Gates

- Combat tick cost should stay stable when enemies are idle, pursuing, and attacking.
- Enemy occupancy and minimap/world updates should only invalidate when combat actors actually move or change state.
- Every authored combat spawn should validate required fields and resolve to a known enemy type.
- Starter-town encounter layouts should be manually checked for safe-routing, aggro readability, and pathing edge cases.
- Same-tick combat rules should remain covered by automated tests as the enemy roster expands.
- Manual-movement lock break, auto-retaliate choice rules, hit-aggro cooldown = `1`, and temporary-occupancy-vs-hard-no-path behavior should remain explicitly regression-tested.
- Combat/eating interaction should remain regression-tested against the shared same-tick restriction rules.
- Loot tables should validate weights, quantity bands, item ids, and progression-band sanity.
- Spawn groups should validate spacing, enabled-state consistency, and region ownership.
- Encounter-heavy scenes should be watched for pathfinding spikes and visible tick hitching.
- Combat content rollout should keep a manual checklist for "can a brand-new player safely walk through town without accidental death?"

## Follow-Up

1. Finish the starter-town encounter pass so combat feels intentionally placed in the world, not merely spawned.
2. Roll out the rest of the first-pass melee-only enemy templates with spec-aligned loot and respawn data.
3. Lock in first-pass loot table rules so drops support the economy and combat progression instead of fighting them.
4. Add melee style selection UI and keep combat HUD state aligned as encounter complexity grows.
5. Expand regional encounter coverage before layering ranged/magic or advanced enemy logic on top.
6. Rebuild the combat simulator from the canonical formulas and content contracts.
