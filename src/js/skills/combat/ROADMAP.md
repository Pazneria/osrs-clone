# Combat Roadmap

## Canonical Runtime Source

Combat runtime contracts live in `src/game/contracts/combat.ts`, the world-authored spawn topology is treated as the source of truth for encounter placement, and the combat content layer mirrors that authored layout through `src/game/combat/content.ts` and the shared melee formulas in `src/game/combat/formulas.ts`.
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
| Enemy Runtime | Enemy type definitions, world-authored spawn nodes, aggro/chase/reset behavior, drops, respawns, world-instance runtime state |
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
| Combat-core parity pass for shared lock/cooldown/retaliate rules | Complete |
| Starter-town encounter authoring pass | Complete |
| First-pass melee-only enemy template rollout beyond rat/goblin | Complete |
| Loot-table and drop-band authoring pass | Complete |
| Spawn-node / spawn-group authoring pass | Complete |
| Combat content validation and perf-gate pass | Complete |
| Combat HUD/target feedback pass | Complete |
| Progression-band contract for enemy difficulty, drops, and placement | Complete |
| First-pass guarded threshold and camp-threat encounter coverage | Complete |
| Authored patrol-route movement slice | Complete |
| Spawn-group ally assist slice | Complete |
| Player ranged combat slice | Complete |
| Player magic combat slice | Complete |
| Style-aware combat build simulator | Complete |
| Water-rune Chilled status-effect slice | Complete |
| Chilled target-feedback slice | Complete |
| Earth-rune Sundered status-effect slice | Complete |
| Air-rune Disoriented status-effect slice | Complete |
| Lava-rune Scorched status-effect slice | Complete |
| Smoke-rune Disoriented status-effect slice | Complete |
| Player-triggered Power Strike slice | Complete |
| Special-energy resource slice | Complete |

## Data Contracts

### Player

- Combat state persists current hitpoints, remaining attack cooldown, locked target id, combat target kind, selected melee style, auto-retaliate flag, and combat-state markers. The live combat state also carries a bounded special-attack cooldown, a 0-100 special-energy pool, and an armed-next-hit marker, which is cleared when its target lock clears or a session restores.
- Player melee performance derives from explicit `combat` item data plus combat skills.
- Required Attack level gates melee use, even when a tool is equipped through another system flow.

### Items

- Equippable held items expose explicit melee-ready combat data instead of relying on placeholder `stats.atk/def/str` math.
- Swords, axes, pickaxes, fishing rods, and harpoons all define attack profile, melee bonuses, and required Attack level.
- Armor exposes split defense bonuses through combat data, with v1 copying the first-pass melee armor band across melee/ranged/magic defense.
- Bows expose explicit ranged attack profiles with level gates, projectile range, bow cadence, and bow-family ammo requirements.
- Arrow stacks expose ranged ammo profiles with compatible weapon families, tiered accuracy/strength bonuses, stackable quiver equipment, and inventory fallback consumption.
- Staffs expose explicit magic attack profiles with Magic level gates, projectile range, staff cadence, and staff-family rune requirements.
- Elemental and combination rune stacks expose magic ammo profiles with compatible staff families plus tiered magic accuracy/strength bonuses.
- Water, steam, mud, and mist runes also expose a typed `Chilled` on-hit profile so the water element has a first gameplay identity beyond projectile color.
- Earth and dust runes expose a typed `Sundered` on-hit profile, reducing a damaged enemy's effective Defence by 3 for three ticks so later player attacks have a deliberate setup window.
- Air and smoke runes expose a typed `Disoriented` on-hit profile, reducing a damaged enemy's effective Attack by 3 for two ticks without changing its swing timing.
- Lava runes expose a typed `Scorched` on-hit profile, dealing one burn damage on each of the next two combat ticks without consuming more runes or duplicating the initial hit.

### Enemies

- Enemy type definitions own reusable melee combat and aggro defaults.
- Spawn nodes own placed world authoring and respawn timing.
- Runtime state owns live health, state, locked target, cooldown, resolved home/spawn tiles, chase/aggro radius, and live positioning.

### Encounter Authoring

- Combat content is authored into the world through explicit spawn nodes and spawn groups, with the world region layer acting as the source of truth for encounter topology rather than piggybacking on merchant/travel NPC descriptors.
- The first-pass spawn contract already covers spawn node id, enemy id, spawn tile, optional home tile override, optional patrol route, respawn ticks, facing yaw, enabled state, and spawn-group id.
- The first authored patrol route is live on the east-outpost north guard, and it flows through world authoring, the combat bridge, combat content cloning, runtime respawn reset, route-aware idle movement, validation, and parity guards.
- The roadmap leaves room to extend encounter authoring later with density caps, safe-distance-from-route rules, and local drop overrides where needed.
- Spawn groups now drive a narrow ally-assist rule for aggressive enemies: nearby idle same-group allies can join an active pull when they are inside the local assist radius, still leashed to the player, and can path to the player.
- Spawn groups still do not imply shared respawn, formation logic, global target switching, or passive-critter dogpiles.

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
- Manual non-enemy interactions also clear the player combat target immediately.
- Breaking or replacing a locked target does not reset or shorten an already-active attack cooldown; the cooldown keeps ticking even after the lock is gone.
- Hard no-path failures break target lock immediately; temporary occupancy blockage keeps the lock, stops stale pursuit movement, and retries pathing on later ticks.
- Auto-retaliate only replaces the player's target when the player lacks a currently valid lock/path under the shared combat rules.
- Same-tick attack batching should keep honoring fizzle rules when a target becomes invalid before the batch forms.

### Shared Combat Interaction Rules

- Universal hit-aggro should remain explicit: an idle enemy hit by the player becomes aggressive on that same tick and sets Remaining Attack Cooldown to `1`.
- Auto-retaliate target choice is locked to a deterministic order when multiple valid attackers exist: first attacker, then closest attacker, then weakest-to-strongest, then stable runtime id.
- Eating interaction remains a combat-core concern, not a melee-only concern.
- Same-tick eat restrictions from the shared combat/cooking rules should stay aligned as combat content expands.
- Ranged player attacks use the same lock, cooldown, hit-roll, damage, aggro, and XP path as melee while resolving range from the active bow snapshot instead of melee adjacency.
- Ammo-consuming ranged attacks consume one selected arrow on both hits and misses, preferring equipped ammo before compatible inventory stacks.
- Magic player attacks use the same lock, cooldown, hit-roll, damage, aggro, and XP path as melee while resolving range from the active staff snapshot instead of melee adjacency.
- Ammo-consuming magic attacks consume one selected rune on both hits and misses, choosing the strongest compatible rune stack from inventory.
- `Power Strike` can be armed only while the player has both a live target lock, a usable combat snapshot, and at least 25 special energy. It modifies exactly the next valid melee, ranged, or magic attack with +25% accuracy and +25% max hit, consumes the ordinary one arrow/rune for that attack where applicable, spends 25 special energy on arm, then recharges for eight combat ticks. Special energy is capped at 100 and restores one point per combat tick. Breaking the target lock disarms a pending strike without refunding its cooldown or energy.
- A damaging hit from a selected water-family rune applies `Chilled` for two ticks. `Chilled` adds one tick to an already-counting enemy swing, or to the enemy's newly resolved next swing in a same-tick batch; it is cleared when that enemy returns home, dies, or respawns.
- An enemy affected by `Chilled` shows an ice-blue target badge above its combat health bar, including the active duration and a tooltip that explains the delayed next swing. The overlay reads the typed status-effect surface each tick rather than owning duplicate status state.
- A damaging earth/dust-rune hit applies `Sundered` for three ticks. `Sundered` lowers the enemy's effective Defence by 3 for subsequent player hit checks; it never changes cooldown timing and is cleared on home reset, death, or respawn.
- An enemy affected by `Sundered` shows a target badge with duration and its Defence reduction, again derived from the typed status-effect surface.
- A damaging air- or smoke-rune hit applies `Disoriented` for two ticks. `Disoriented` lowers the enemy's effective Attack by 3 for subsequent enemy hit checks; it never changes cooldown timing and is cleared on home reset, death, or respawn.
- An enemy affected by `Disoriented` shows a target badge with duration and its Attack reduction, again derived from the typed status-effect surface.
- A damaging lava-rune hit applies `Scorched` for two ticks. `Scorched` resolves one damage before combat actions on each later active tick, awards Magic and Hitpoints XP through the same player-owned damage path, and is cleared on home reset, death, or respawn.
- An enemy affected by `Scorched` shows an amber target badge with duration and its burn-damage tooltip, derived from the typed status-effect surface.

### Enemy Behavior

- Aggressive enemies proximity-aggro within authored aggro radius.
- Aggressive enemies that acquire the player while already in valid melee range may attack immediately under the shared combat-core timing rules.
- Aggressive enemies can call nearby aggressive same-group allies into combat through authored spawn groups. Assisting allies receive a one-tick opening cooldown, must stay inside their leash envelope, and must path to the player before joining.
- Passive enemies do not auto-aggro by proximity but enter combat when directly engaged.
- Passive same-group enemies do not join ally-assist pulls.
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
| Chicken | Harmless utility wildlife and opt-in low-risk target | Live |
| Goblin Grunt | Baseline early aggressive humanoid | Live |
| Boar | Early animal resource enemy | Live |
| Wolf | Fast early natural predator | Live |
| Guard | Sturdier zone-control melee enemy | Live |
| Bear | Slow, durable natural threat | Live |
| Heavy Brute | Slower heavy-damage melee enemy | Live |
| Fast Striker | High-pressure accuracy/speed enemy | Live |

Rule: the first-pass roster is live; further advanced behavior beyond authored patrol routes should build on the current combat content contracts instead of adding one-off runtime-only enemy logic.

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

### Current First-Pass Loot Benchmarks

These benchmarks use the current live drop tables in `src/game/combat/content.ts`.
Expected sell value per kill treats coin entries at their average stack size and item entries at the general-store half-price fallback (`floor(item.value x 0.5)`), which gives combat a stable direct-sale baseline even before later-region specialist buyers or richer drop rules exist.

| Enemy | Encounter Role | Empty Weight | Coin Weight | Notable Drops | Expected Sell Value / Kill |
| --- | --- | --- | --- | --- | --- |
| Rat | Passive critter | 65% | 0% | Rat Tail x1 | 0.70 |
| Chicken | Passive critter | 10% | 0% | Raw Chicken, Feathers x15 | 2.50 |
| Boar | Resource aggressor | 20% | 0% | Raw Boar Meat, Boar Tusk | 2.80 |
| Wolf | Resource aggressor | 25% | 0% | Raw Wolf Meat, Wolf Fang | 3.40 |
| Goblin Grunt | Roadside aggressor | 18% | 45% | Bronze sword/axe/pickaxe ladder | 7.05 |
| Bear | Durable bruiser | 15% | 0% | Bear Leather spike | 11.00 |
| Guard | Gatekeeper | 4% | 40% | Bronze-to-iron weapon/tool ladder | 20.20 |
| Fast Striker | Camp striker | 23% | 45% | Iron sword bias | 21.90 |
| Heavy Brute | Camp bruiser | 16% | 50% | Iron weapon/tool ladder | 26.15 |

These live benchmarks keep passive/resource enemies below the humanoid payout bands, keep goblins well below the cost of buying a full bronze weapon, and keep the first iron-dropping enemies below the cost of buying a full iron weapon.

### Current Combat Build Simulator

`tools/sim/melee-sim.js` is the canonical first-pass combat build simulator. It loads typed enemy data from `src/game/combat/content.ts`, player/enemy formula helpers from `src/game/combat/formulas.ts`, and weapon/ammo combat profiles from `src/js/content/item-catalog.js`.

Use `npm.cmd run tool:sim:melee -- --enemy enemy_goblin_grunt --weapon bronze_sword --runs 1000 --seed baseline` for melee, `npm.cmd run tool:sim:melee -- --enemy enemy_guard --weapon normal_shortbow --ammo bronze_arrows --ranged 10 --runs 1000 --seed ranged-baseline` for ranged, or `npm.cmd run tool:sim:melee -- --enemy enemy_guard --weapon plain_staff_wood --ammo ember_rune --magic 10 --runs 1000 --seed magic-baseline` for magic. The simulator reports the active player combat snapshot, selected ammo/rune, enemy snapshot, win rates, average fight length, damage, and swing counts so combat tuning can compare authored enemies and build identities without reintroducing the removed dummy simulator path.

### Current Combat Progression Bands

The live progression-band contract is authored in `src/game/combat/content.ts` and exposed through `listCombatProgressionBands()`, `getCombatProgressionBandForEnemy()`, and `listCombatProgressionBandWorldSummaries(worldId)`.
It exists to keep enemy difficulty, drop ceilings, and placement guidance aligned before the next encounter rollout adds outer-road, camp, and guarded-threshold coverage.

| Band | Stage | Player Level Band | Enemy Templates | Placement Role | Loot Ceiling |
| --- | --- | --- | --- | --- | --- |
| Starter Opt-In | Starter | 1-3 | Training Dummy, Rat, Chicken | Safe optional starter targets | <= 2.50 gp/kill |
| Starter Roadside | Starter | 4-10 | Goblin Grunt | Avoidable early humanoid aggro | <= 7.05 gp/kill |
| Resource Outskirts | Starter | 8-16 | Boar, Wolf | Combat pressure near richer resources | <= 3.40 gp/kill |
| Guarded Threshold | Mid | 15-25 | Guard | Deliberate gate or outpost pressure | <= 20.20 gp/kill |
| Camp Threat | Mid | 20-35 | Bear, Fast Striker, Heavy Brute | Clustered optional camps or ruins with local ally assist | <= 26.15 gp/kill |
| Later Region Anchor | Later | 35+ | Deferred | Named anchors and later-region objectives | Deferred |

Rule: every live enemy template must belong to exactly one progression band, and current world summaries should make it clear which bands are placed versus still available for future authored regions.

### Current Combat World Coverage

The current authored `starter_town` world now covers every live first-pass progression band. Starter-safe, roadside, resource-outskirts, guarded-threshold, and camp-threat spawns all flow through the same `combatSpawns` source of truth and are locked by the combat content, topology, and world parity guards.

| World | Progression Band | Spawn Groups | Spawn Count |
| --- | --- | --- | --- |
| Starter Town | Starter Opt-In | `starter_training`, `starter_field`, `starter_outer_rats_southwest`, `starter_outer_chickens_southwest`, `starter_outer_chickens_southeast` | 17 |
| Starter Town | Starter Roadside | `starter_road`, `starter_east_field_*`, `starter_far_*_goblins` | 12 |
| Starter Town | Resource Outskirts | `starter_east_far_boar_*`, `starter_outer_boars_*`, `starter_outer_wolf_*` | 18 |
| Starter Town | Guarded Threshold | `starter_east_outpost_guard_post` | 3 |
| Starter Town | Camp Threat | `camp_southeast_ruins` | 3 |

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
- Authored patrol routes are optional spawn-node waypoint loops; patrol enemies prefer route movement while idle and fall back to random roaming only when no usable route exists.
- Patrol waypoints must stay same-plane, in bounds, walkable, near the home tile, clear of protected roads/service/mining footprints, and reachable segment-by-segment.
- Chase Range must cover the authored patrol envelope so valid patrol movement does not fight leash behavior.
- Higher-than-1 combat movement speeds stay deferred until movement/collision semantics are explicitly expanded.

### Player Ranged Slice

- Equipped bows switch the active player combat snapshot to the ranged style family.
- Bow attacks can resolve from authored bow range without stepping into melee range.
- Compatible arrows may live in the ammo equipment slot or inventory; equipped ammo is consumed first.
- Ranged attacks award Ranged XP from dealt damage plus Hitpoints XP through the same combat-core reward path as melee.
- Ranged projectiles and bow-shot animation hooks are driven by the attack result rather than a separate ranged-only combat path.

### Player Magic Slice

- Equipped staffs switch the active player combat snapshot to the magic style family.
- Staff attacks resolve from authored staff range and set the player action to `COMBAT: MAGIC` without requiring melee adjacency.
- Elemental and combination runes act as staff-compatible spell fuel; the snapshot selects the highest-tier compatible inventory stack and consumes one rune per cast.
- Magic attacks award Magic XP from dealt damage plus Hitpoints XP through the same combat-core reward path as melee and ranged.
- Magic projectiles are driven by the attack result and use rune-colored visual identity for ember/fire/lava, water/steam, earth/mud, air/mist, and smoke/dust families.

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
- Starter-town encounter pockets should stay within the world-authored route buffers and the combat topology/perf guard should catch unsafe spacing before the layout drifts.

### Spawn Group Plan

| Spawn Group Type | Purpose | First-Pass Rules |
| --- | --- | --- |
| Solo critter | Safe opt-in combat | Clear space around spawn, no forced aggro |
| Roadside pair | Teaches enemy density | Enemies visible before aggro range begins |
| Camp cluster | Local danger pocket | Shared visual identity, safe edge, deliberate spacing |
| Route gate | Warns the player that a path is hotter | Strong readability, predictable leash zone |
| Named anchor | Gives the area a combat landmark | Unique placement and stronger authored intent |

Rule: in first-pass melee-only combat, spawn groups can create local ally-assist for aggressive enemies only. They do not create shared respawn, formations, global target switching, or passive-enemy chain aggro.

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
- advanced roaming behavior beyond the authored patrol-route slice and simple current radius model
- formation logic or global encounter-wide target switching beyond local same-group ally assist
- safe-spot exception systems
- ranged enemy packages and magic enemy packages
- weapon-specific special profiles, special-resource systems, remaining elemental status effects, or multi-phase enemies
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
- Every authored combat spawn should validate required fields, resolve to a known enemy type, and stay inside the authored world encounter topology.
- Starter-town encounter layouts should be manually checked for safe-routing, aggro readability, and pathing edge cases.
- The encounter topology/perf guard should cover spawn spacing, safe-route clearance, aggro overlap, leash/home placement, area density, and local path-budget estimates.
- Same-tick combat rules should remain covered by automated tests as the enemy roster expands.
- Manual-movement lock break, non-enemy interaction lock break, cooldown persistence after break, auto-retaliate choice rules, hit-aggro cooldown = `1`, and temporary-occupancy-vs-hard-no-path behavior should remain explicitly regression-tested.
- Combat/eating interaction should remain regression-tested against the shared same-tick restriction rules.
- Loot tables should validate weights, quantity bands, item ids, and progression-band sanity.
- Spawn groups should validate spacing, enabled-state consistency, and region ownership.
- Patrol routes should validate waypoint walkability, route reachability, protected-road clearance, and route-aware local path budgets.
- Encounter-heavy scenes should be watched for pathfinding spikes and visible tick hitching.
- Combat content rollout should keep a manual checklist for "can a brand-new player safely walk through town without accidental death?"

## Follow-Up

1. Keep weapon-specific special profiles and any further elemental effects as separate, bounded slices on the typed combat contract; the current next slice is weapon-specific specials on the shared energy pool.
2. Use the progression-band summaries to populate outer roads, optional camps, and guarded thresholds without duplicating starter-town encounter pressure.
3. Keep melee style selection UI, combat HUD state, and simulator coverage aligned as encounter complexity grows.
4. Revisit later-region anchors only after authored region context exists.
