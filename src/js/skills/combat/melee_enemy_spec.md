# Melee-Only Enemy Spec

## Purpose

This spec defines the baseline PvE enemy package for enemies that attack only in melee.

This spec owns:
- melee-only enemy combat data
- aggro acquisition behavior
- chase and leash behavior
- home/reset behavior
- melee-only enemy runtime state expectations
- first-pass melee enemy archetypes and example templates

This spec does **not** redefine shared combat rules already owned elsewhere, including:
- shared combat timing
- attack cooldown countdown behavior
- target lock behavior
- melee hit resolution
- damage application
- same-tick attack resolution
- death interruption rules

Melee-only enemies use the existing shared combat engine and the existing shared melee range rules.

---

## Scope Boundaries

| System | Ownership |
| --- | --- |
| Combat Core | Shared combat timing, cooldown tracking, target lock, pursuit execution, hit checks, damage application, death interruption |
| Melee | Shared melee range assumptions and shared melee combat rules used by both player and enemy melee attacks |
| Enemy Spec | Enemy aggro acquisition, chase range, home tile and reset behavior, melee-only enemy templates, enemy stat packages, spawn/runtime assumptions, first-pass drops, and first-pass respawn behavior |

Rule: this spec should define what makes a melee enemy behave like a melee enemy in the world, but it should defer to shared combat systems for universal combat processing.

---

## Core Melee-Only Enemy Model

First-pass melee-only enemies are intentionally simple.

They are:
- single-target
- adjacent-melee only
- non-projectile
- non-ammo-using
- non-casting
- without special attacks
- without player-style selection
- without flee logic
- without advanced status effects

Once a melee-only enemy has a valid target:
- it chases until it reaches valid melee range
- it stops on the first valid adjacent tile
- it attacks whenever its cooldown reaches 0
- it remains planted while performing its melee attack
- it resumes pursuit if the target leaves melee range on a later tick

Diagonal adjacency counts as valid melee range.

---

## Global Rules For First Pass

| Rule | Value |
| --- | --- |
| Enemy combat family | Melee only |
| Default melee range | 1 tile |
| Diagonal adjacency valid for melee | Yes |
| Projectile use | None |
| Ammo use | None |
| Enemy attack style selection | None |
| Enemy max hit source | Enemy data |
| Enemy accuracy source | Enemy data |
| Enemy defence source | Enemy data |
| Attack cooldown tracked per enemy | Yes |
| Multiple enemies may attack on same tick | Yes |
| Enemy gear visuals drive combat stats | No, unless explicitly specified later |

Rule: melee-only enemies do not use the player-facing attack style system.

---

## Enemy Data Model

This spec uses three distinct schema layers to avoid ownership overlap and implementation guesswork:
- **Enemy Type Definition**: static enemy-template data
- **Spawn Node Definition**: placed world-instance authoring data
- **Enemy Runtime State**: live per-instance state during play

### Enemy Type Definition

Enemy Type Definition owns reusable per-enemy template data.

#### Required Identity Fields

| Field | Meaning |
| --- | --- |
| Enemy ID | Unique content/runtime identifier |
| Display Name | Player-facing name |
| Combat Family | Must be Melee |
| Size | Enemy footprint size; first pass defaults to 1x1 unless specified otherwise |

#### Required Combat Fields

| Field | Meaning |
| --- | --- |
| Hitpoints | Max health |
| Attack | Base attack stat |
| Strength | Base strength stat |
| Defence | Base defence stat |
| Enemy Melee Accuracy Bonus | Enemy melee accuracy bonus |
| Enemy Melee Defence Bonus | Enemy melee defence bonus |
| Enemy Max Hit | Max successful melee hit; authoritative in v1 and not derived from Strength |
| Attack Tick Cycle | Number of ticks between attacks |
| Attack Range | Usually 1 |

#### Required Behavior Fields

| Field | Meaning |
| --- | --- |
| Aggro Type | Passive or Aggressive |
| Aggro Radius | Default proximity-based target acquisition radius |
| Chase Range | Default max allowed distance from Home Tile before reset |
| Roaming Radius | Default max idle travel distance centered on Spawn Tile |
| Default Movement Speed | Default non-sprinting movement speed in tiles per tick; always 1 in the first pass |
| Combat Movement Speed | Sprint/chase movement speed in tiles per tick while actively pursuing a combat target; minimum 1, maximum 3 |

#### Optional Presentation Fields

| Field | Meaning |
| --- | --- |
| Attack Animation Key | Client animation hook |
| Hurt Animation Key | Hit reaction animation |
| Death Animation Key | Death animation |
| Attack SFX Key | Attack sound hook |
| Hurt SFX Key | Hurt sound hook |
| Death SFX Key | Death sound hook |
| Roam Animation Key | Optional client hook for idle roaming animation or presentation |

### Spawn Node Definition

Spawn Node Definition owns placed world-instance authoring data.

| Field | Meaning |
| --- | --- |
| Spawn Node ID | Unique identifier for the placed spawn definition |
| Enemy ID | Which enemy type this node spawns |
| Spawn Tile | Exact tile where the enemy initially appears |
| Home Tile Override | Optional override; if unset, Home Tile = Spawn Tile |
| Roaming Radius Override | Optional override; if unset, use Enemy Type Definition default |
| Respawn Time | Time delay before this node spawns a fresh replacement after death |
| Spawn Enabled | Whether this node is currently active |
| Facing Override | Optional authored facing/presentation setting |
| Spawn Group ID | Optional organizational grouping for camps, packs, or clusters |

### Enemy Runtime State

Enemy Runtime State owns live per-instance state during play.

| Field | Meaning |
| --- | --- |
| Current Health | Current remaining HP |
| Current State | Idle, Aggroed, Returning, or Dead |
| Locked Target | Current combat target, if any |
| Remaining Attack Cooldown | Current ticks until next attack |
| Resolved Combat Movement Speed | Active combat chase speed; fixed to 1 tile per tick in v1 |
| Resolved Home Tile | Active reset anchor after applying spawn-node override logic |
| Resolved Spawn Tile | Active authored spawn origin for this instance |
| Resolved Roaming Radius | Active idle travel distance after applying spawn-node override logic |
| Resolved Chase Range | Active leash distance |
| Resolved Aggro Radius | Active proximity aggro radius |
| Last Damager | Optional tracking for attribution or later systems |

### Ownership Rule

Do not duplicate ownership across schema layers.

- Enemy Type Definition owns reusable combat and behavior defaults.
- Spawn Node Definition owns placed-world overrides and respawn authoring.
- Enemy Runtime State owns current live state and resolved values used during simulation.

## Aggro Model

First-pass melee enemies use a simple aggro model.

### Distance Metric Rule

Aggro Radius, Chase Range, and Roaming Radius use the same tile-based square/Chebyshev measurement used by shared combat range rules.

That means distance is measured by the larger of horizontal or vertical tile separation, not by Euclidean distance.

### Aggro Types

| Aggro Type | Behavior |
| --- | --- |
| Passive | Does not automatically attack by proximity; will still respond if directly engaged |
| Aggressive | Automatically acquires a valid player target within aggro radius |

### Aggro Rules

1. An idle aggressive enemy may acquire a valid player target when the player enters its aggro radius.
2. Proximity aggro should occur only if the target is reachable by normal pathing rules.
3. A passive enemy does not auto-acquire targets through proximity.
4. If an idle enemy is directly engaged, it may enter combat and lock the attacker as its target.
5. This spec does not define advanced retargeting. Once an enemy has a target, it keeps that target until target invalidation or reset conditions occur.
6. Aggro checks should not cause enemies to constantly swap targets mid-combat in the first pass.

### Initial Engagement Rules

When a melee enemy first acquires or enters combat, its initial cooldown state should be explicit.

1. If an aggressive enemy acquires a target by proximity while already in valid melee range, it may attack immediately under the shared combat engine.
2. If an aggressive enemy acquires a target by proximity while out of melee range, it begins pathing immediately. The earliest attack is the first subsequent tick that starts with the enemy in valid melee range and Remaining Attack Cooldown = 0.
3. If an idle enemy is struck and enters combat from that hit, it locks the attacker as its target and sets Remaining Attack Cooldown = 1 per shared combat-core behavior.
4. The enemy spec should not create separate bespoke opening-attack timing rules per enemy unless explicitly stated later.
5. First-pass melee enemies do not voluntarily drop a valid target to switch to a closer or newer attacker.

### Cooldown Lifecycle Rules

- Spawned enemies start with Remaining Attack Cooldown = 0.
- Respawned enemies start with Remaining Attack Cooldown = 0.
- Idle enemies that are hit-aggroed by a player set Remaining Attack Cooldown = 1 per shared combat-core behavior.
- Enemies that complete a reset and successfully reach Home Tile end in Idle with Remaining Attack Cooldown = 0.
- Respawned enemies do not preserve previous cooldown state.
- Resetting enemies do not preserve a partially completed combat cooldown once they fully return home and re-enter Idle.

---

## Roaming Rules

Enemy idle movement uses an explicit roaming radius.

### Roaming Radius

Each enemy has a **Roaming Radius** measured from its **Spawn Tile** using the shared tile-based square/Chebyshev distance rule.

Roaming Radius defines the maximum distance the enemy may travel while idle and not actively in combat.

### Roaming Rules

- Roaming Radius is centered on Spawn Tile.
- Idle roaming must remain within the allowed Roaming Radius.
- Roaming Radius affects only idle movement, not combat chase behavior.
- Home Tile and Spawn Tile may be the same in the first pass unless explicitly stated otherwise.
- If an enemy is not intended to roam, set Roaming Radius to 0.

### First-Pass Roaming Guidelines

| Enemy Role | Typical Roaming Radius |
| --- | --- |
| Stationary guard or placed threat | 0 |
| Harmless small wildlife | 2-4 |
| Natural predator | 2-5 |
| Standard humanoid enemy | 0-2 |
| Patrol-like melee enemy | 3-5 |

Rule: Roaming Radius is a placement and world-behavior field, not a combat power field.

## Chase, Leash, and Reset

This is a core ownership area of the enemy spec.

### Home Tile

Each melee enemy has a Home Tile.

In the first pass, Home Tile defaults to Spawn Tile unless a specific enemy setup overrides it.

The Home Tile is the anchor point used for:
- chase range measurement
- reset decisions
- return behavior after combat breaks

### Chase Range

Chase Range is measured from the enemy's Home Tile, not from the enemy's current tile.

Chase Range uses the shared tile-based square/Chebyshev distance rule.

This prevents leash drift and keeps enemy territory stable.

### Chase Rules

Once a target is locked:
- the enemy pursues while the target remains valid and within allowed chase conditions
- if the enemy is within valid melee range, it attacks instead of continuing to close distance
- if the target exits melee range but remains within chase conditions, the enemy resumes pursuit

### Reset Triggers

A melee enemy resets when any of the following happen:
- the target moves outside the enemy's allowed chase range
- the target becomes invalid
- combat otherwise breaks in a way that leaves the enemy without a valid target

### Reset Behavior

On reset:
- the enemy immediately leaves active combat
- the enemy clears its combat target
- the enemy returns toward its Home Tile using Default Movement Speed
- while Returning, it is not treated as actively attacking unless it is re-engaged
- once it reaches its Home Tile, it restores to full Hitpoints
- once it reaches its Home Tile, it returns to its idle state

First-pass reset behavior should be simple and deterministic.

## Required Runtime Behavior Rules

This section exists to make first-pass implementation behavior explicit and reduce guesswork.

### Target Validity

A melee enemy's current target becomes invalid if any of the following happen:
- the target dies
- the target is removed from the world
- the target moves outside the enemy's Chase Range relative to Home Tile
- the target can no longer be treated as a valid combat target by the shared combat system

If the current target becomes invalid, the enemy resets.

### Pursuit Rules

- While Aggroed and out of melee range, the enemy attempts to path toward a valid adjacent tile around its target.
- While Aggroed and already in valid melee range, the enemy does not continue repositioning unless range breaks or pathing rules force a change.
- Combat Movement Speed is used only while actively pursuing a combat target.
- Path-loss behavior should follow the shared combat-core pathing rule rather than defining separate enemy-only temporary or hard path-failure semantics here.
- Multiple melee enemies may independently pursue and attack the same player at the same time as long as each enemy can independently occupy a valid adjacent tile and satisfy normal combat rules.

### Re-Engagement Rules

- If an enemy in Returning state is hit by a valid attacker, it immediately stops Returning and re-enters combat.
- On re-entry, it locks the new valid attacker as its target unless shared combat rules say otherwise.
- Returning does not grant the enemy a free attack; normal engagement timing still applies.

### Idle Rules

- Idle enemies may roam only within Roaming Radius centered on Spawn Tile.
- Idle enemies do not use Combat Movement Speed.
- If Roaming Radius is 0, the enemy remains planted at Spawn Tile unless combat or other explicit behavior moves it.

### Placement Rules

- Spawn Tile is the authored placement origin for the enemy.
- Home Tile defaults to Spawn Tile in the first pass.
- Roaming Radius is measured from Spawn Tile.
- Chase Range is measured from Home Tile.

### Data Authoring Rule

Every Enemy Type Definition should explicitly define at minimum:
- Enemy ID
- Display Name
- Combat Family
- Size
- Aggro Type
- Hitpoints
- Attack
- Strength
- Defence
- Enemy Melee Accuracy Bonus
- Enemy Melee Defence Bonus
- Enemy Max Hit
- Attack Tick Cycle
- Attack Range
- Roaming Radius
- Default Movement Speed
- Combat Movement Speed
- Aggro Radius
- Chase Range

Every Spawn Node Definition should explicitly define at minimum:
- Spawn Node ID
- Enemy ID
- Spawn Tile
- Respawn Time
- Spawn Enabled

Home Tile Override and Roaming Radius Override are optional spawn-node overrides.

If a field is not meant to vary, it should still be explicitly set rather than inferred.

### First-Pass Omitted Complexity

The first pass intentionally does not require:
- target priority systems
- threat or aggro scoring
- ally assist behavior
- formation logic
- facing-based attack restrictions
- knockback, stun, or collision-special cases
- partial leash states between Aggroed and Returning

---

## Runtime State Model

### States

| State | Meaning |
| --- | --- |
| Idle | No target, not in active combat |
| Aggroed | Has a target and is pursuing or attacking |
| Returning | Resetting and moving back toward Home Tile |
| Dead | Not an active combat participant |

### Runtime Fields

| Field | Meaning |
| --- | --- |
| Current Health | Current remaining HP |
| Current State | Idle, Aggroed, Returning, or Dead |
| Locked Target | Current combat target, if any |
| Remaining Attack Cooldown | Current ticks until next attack |
| Resolved Home Tile | Active reset anchor after applying spawn-node override logic |
| Resolved Spawn Tile | Original spawn location for this instance |
| Resolved Roaming Radius | Active idle travel distance centered on Spawn Tile |
| Resolved Chase Range | Active leash distance |
| Resolved Aggro Radius | Active proximity aggro radius |
| Last Damager | Optional tracking for attribution or later systems |

---

## Movement Speed Rules

Enemy movement uses two explicit per-enemy fields.

### Movement Fields

- **Default Movement Speed**: non-combat and non-sprinting movement speed in tiles per tick
- **Combat Movement Speed**: sprint/chase movement speed in tiles per tick while actively pursuing a combat target

### First-Pass Baseline Rule

In the first pass, all melee enemies use:
- **Default Movement Speed = 1 tile per tick**

This keeps ordinary movement predictable and avoids unnecessary variation in idle or return behavior.

### Combat Movement Speed Constraints

- In v1, Combat Movement Speed is fixed to **1 tile per tick** for all melee enemies.
- Combat Movement Speed affects active pursuit during combat.
- Combat Movement Speed does **not** change attack range or attack cooldown.
- Returning-to-home movement uses Default Movement Speed, not Combat Movement Speed.
- Values above 1 tile per tick are deferred until step-by-step movement, collision, and stop-on-range semantics are explicitly specified.

Rule: combat movement speed is a separate chase-pressure tuning knob, but in v1 it is fixed to 1 tile per tick for implementation safety and should not be inferred from attack speed.

## Concrete Enemy Combat Tuning Rules

These rules convert the abstract melee-enemy scaffold into concrete first-pass combat values.

### Stat Philosophy

Enemy melee combat uses three separate tuning knobs:
- **Hitpoints** controls how long the enemy survives.
- **Attack + Enemy Melee Accuracy Bonus** controls how reliably the enemy hits the player.
- **Defence + Enemy Melee Defence Bonus** controls how reliably the player hits the enemy.
- **Enemy Max Hit** controls damage ceiling on successful hits.
- **Attack Tick Cycle** controls tempo and pressure.

These values should not all scale in lockstep. A fast enemy can be fragile. A tanky enemy can hit slowly. A weak pest can still be annoying if it attacks often enough.

### Concrete First-Pass Benchmarks

| Archetype | Hitpoints | Attack | Strength | Defence | Enemy Melee Accuracy Bonus | Enemy Melee Defence Bonus | Enemy Max Hit | Attack Tick Cycle | Attack Range | Roaming Radius | Default Movement Speed | Combat Movement Speed | Aggro Radius | Chase Range |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Weak Pest | 4 | 1 | 1 | 1 | 0 | 0 | 1 | 5 | 1 | 3 | 1 | 1 | 0 | 4 |
| Basic Fighter | 8 | 4 | 4 | 3 | 2 | 1 | 2 | 5 | 1 | 1 | 1 | 1 | 4 | 6 |
| Guard / Bruiser | 14 | 8 | 8 | 8 | 4 | 4 | 3 | 5 | 1 | 0 | 1 | 1 | 5 | 7 |
| Heavy Melee | 22 | 10 | 12 | 12 | 4 | 6 | 5 | 6 | 1 | 1 | 1 | 1 | 4 | 6 |
| Fast Striker | 12 | 12 | 9 | 5 | 6 | 1 | 4 | 4 | 1 | 2 | 1 | 1 | 5 | 7 |

### Interpretation Rules

1. **Strength is still populated even though Enemy Max Hit is direct data.** This keeps enemy combat stats readable and gives room for future systems without changing the current damage rule.
2. **Enemy Max Hit is the authoritative damage cap in v1.** Do not derive enemy damage from Strength in the first pass.
3. **Accuracy-heavy enemies should lean on Attack and Enemy Melee Accuracy Bonus more than on Max Hit.**
4. **Tanky enemies should lean on Defence and Enemy Melee Defence Bonus more than on raw Hitpoints alone.**
5. **Fast enemies should usually give up either survivability or top-end damage.**
6. **Slow heavy enemies should feel dangerous on hit without becoming too reliable.**

### Early-Game Combat Feel Targets

The first-pass values above are chosen to support the following feel:
- Rats and similar pests are mostly harmless unless the player is already weakened.
- Grunt-type enemies land occasional chip damage and die at a reasonable pace with starter gear.
- Guards feel noticeably sturdier than grunts and punish undergeared melee more reliably.
- Heavy enemies feel threatening because of higher damage and durability, not because they attack constantly.
- Fast strikers create pressure through swing rate and accuracy rather than through large max hits.

## Example First-Pass Enemy Templates

The examples below are concrete first-pass enemies intended to cover harmless wildlife, light predators, and sturdier natural threats in addition to humanoid melee enemies.

### Rat

Role: weak starter pest enemy.

| Field | Value |
| --- | --- |
| Enemy ID | enemy_rat |
| Display Name | Rat |
| Combat Family | Melee |
| Size | 1x1 |
| Aggro Type | Passive |
| Aggro Radius | 0 |
| Chase Range | 4 |
| Roaming Radius | 3 |
| Attack Range | 1 |
| Attack Tick Cycle | 5 |
| Default Movement Speed | 1 |
| Combat Movement Speed | 1 |
| Hitpoints | 4 |
| Attack | 1 |
| Strength | 1 |
| Defence | 1 |
| Enemy Melee Accuracy Bonus | 0 |
| Enemy Melee Defence Bonus | 0 |
| Enemy Max Hit | 1 |

Behavior notes:
- does not auto-aggro by proximity
- serves as a true low-threat starter enemy
- should lose most direct fights against any player with even minimal combat investment

### Chicken

Role: harmless utility wildlife and starter combat target.

| Field | Value |
| --- | --- |
| Enemy ID | enemy_chicken |
| Display Name | Chicken |
| Combat Family | Melee |
| Size | 1x1 |
| Aggro Type | Passive |
| Aggro Radius | 0 |
| Chase Range | 3 |
| Roaming Radius | 4 |
| Attack Range | 1 |
| Attack Tick Cycle | 5 |
| Default Movement Speed | 1 |
| Combat Movement Speed | 1 |
| Hitpoints | 3 |
| Attack | 1 |
| Strength | 1 |
| Defence | 0 |
| Enemy Melee Accuracy Bonus | 0 |
| Enemy Melee Defence Bonus | 0 |
| Enemy Max Hit | 1 |

Behavior notes:
- does not auto-aggro by proximity
- intended to be easier than a Rat
- should function as a true low-risk early-world creature

### Goblin / Bandit Grunt

Role: basic early aggressive melee enemy.

| Field | Value |
| --- | --- |
| Enemy ID | enemy_goblin_grunt |
| Display Name | Goblin Grunt |
| Combat Family | Melee |
| Size | 1x1 |
| Aggro Type | Aggressive |
| Aggro Radius | 4 |
| Chase Range | 6 |
| Roaming Radius | 1 |
| Attack Range | 1 |
| Attack Tick Cycle | 5 |
| Default Movement Speed | 1 |
| Combat Movement Speed | 1 |
| Hitpoints | 8 |
| Attack | 4 |
| Strength | 4 |
| Defence | 3 |
| Enemy Melee Accuracy Bonus | 2 |
| Enemy Melee Defence Bonus | 1 |
| Enemy Max Hit | 2 |

Behavior notes:
- proximity-aggros nearby players
- intended as the baseline first real combat threat
- should feel beatable with starter combat gear but not completely free

### Boar

Role: early natural melee animal that is weaker than a wolf but more substantial than harmless wildlife.

| Field | Value |
| --- | --- |
| Enemy ID | enemy_boar |
| Display Name | Boar |
| Combat Family | Melee |
| Size | 1x1 |
| Aggro Type | Aggressive |
| Aggro Radius | 4 |
| Chase Range | 5 |
| Roaming Radius | 2 |
| Attack Range | 1 |
| Attack Tick Cycle | 5 |
| Default Movement Speed | 1 |
| Combat Movement Speed | 1 |
| Hitpoints | 7 |
| Attack | 5 |
| Strength | 5 |
| Defence | 3 |
| Enemy Melee Accuracy Bonus | 2 |
| Enemy Melee Defence Bonus | 1 |
| Enemy Max Hit | 2 |

Behavior notes:
- more dangerous than harmless wildlife but clearly below wolf-tier threat
- straightforward animal melee enemy with no special pursuit behavior
- useful as an early-world leather source without requiring the player to fight fast predators

### Wolf

Role: early aggressive natural predator.

| Field | Value |
| --- | --- |
| Enemy ID | enemy_wolf |
| Display Name | Wolf |
| Combat Family | Melee |
| Size | 1x1 |
| Aggro Type | Aggressive |
| Aggro Radius | 5 |
| Chase Range | 7 |
| Roaming Radius | 3 |
| Attack Range | 1 |
| Attack Tick Cycle | 4 |
| Default Movement Speed | 1 |
| Combat Movement Speed | 1 |
| Hitpoints | 10 |
| Attack | 8 |
| Strength | 7 |
| Defence | 4 |
| Enemy Melee Accuracy Bonus | 4 |
| Enemy Melee Defence Bonus | 1 |
| Enemy Max Hit | 3 |

Behavior notes:
- attacks faster than grunt-type humanoids
- lower defence keeps it from feeling too tanky for its stage
- should feel dangerous to fresh players through pressure more than through raw damage spikes

### Guard

Role: sturdier zone-control melee enemy.

| Field | Value |
| --- | --- |
| Enemy ID | enemy_guard |
| Display Name | Guard |
| Combat Family | Melee |
| Size | 1x1 |
| Aggro Type | Aggressive |
| Aggro Radius | 5 |
| Chase Range | 7 |
| Roaming Radius | 0 |
| Attack Range | 1 |
| Attack Tick Cycle | 5 |
| Default Movement Speed | 1 |
| Combat Movement Speed | 1 |
| Hitpoints | 14 |
| Attack | 8 |
| Strength | 8 |
| Defence | 8 |
| Enemy Melee Accuracy Bonus | 4 |
| Enemy Melee Defence Bonus | 4 |
| Enemy Max Hit | 3 |

Behavior notes:
- noticeably sturdier than grunt-type enemies
- good baseline for restricted-area or patrol-adjacent spaces
- should reward players for upgrading out of very early gear

### Bear

Role: sturdy natural melee threat with slow, heavy hits.

| Field | Value |
| --- | --- |
| Enemy ID | enemy_bear |
| Display Name | Bear |
| Combat Family | Melee |
| Size | 1x1 |
| Aggro Type | Aggressive |
| Aggro Radius | 4 |
| Chase Range | 6 |
| Roaming Radius | 2 |
| Attack Range | 1 |
| Attack Tick Cycle | 6 |
| Default Movement Speed | 1 |
| Combat Movement Speed | 1 |
| Hitpoints | 20 |
| Attack | 9 |
| Strength | 11 |
| Defence | 10 |
| Enemy Melee Accuracy Bonus | 3 |
| Enemy Melee Defence Bonus | 5 |
| Enemy Max Hit | 5 |

Behavior notes:
- natural counterpart to the Heavy Brute stat shape
- should feel durable and punishing on hit without being fast
- suitable for wilderness-edge or forest-danger pacing in early-to-mid progression

### Heavy Brute

Role: slower, higher-damage melee threat.

| Field | Value |
| --- | --- |
| Enemy ID | enemy_heavy_brute |
| Display Name | Heavy Brute |
| Combat Family | Melee |
| Size | 1x1 |
| Aggro Type | Aggressive |
| Aggro Radius | 4 |
| Chase Range | 6 |
| Roaming Radius | 1 |
| Attack Range | 1 |
| Attack Tick Cycle | 6 |
| Default Movement Speed | 1 |
| Combat Movement Speed | 1 |
| Hitpoints | 22 |
| Attack | 10 |
| Strength | 12 |
| Defence | 12 |
| Enemy Melee Accuracy Bonus | 4 |
| Enemy Melee Defence Bonus | 6 |
| Enemy Max Hit | 5 |

Behavior notes:
- slower attack tempo creates punish windows
- high durability and higher damage make it dangerous in sustained trades
- should feel materially different from a Guard even without special mechanics

### Fast Striker

Role: high-pressure melee enemy that wins through speed and hit frequency.

| Field | Value |
| --- | --- |
| Enemy ID | enemy_fast_striker |
| Display Name | Fast Striker |
| Combat Family | Melee |
| Size | 1x1 |
| Aggro Type | Aggressive |
| Aggro Radius | 5 |
| Chase Range | 7 |
| Roaming Radius | 2 |
| Attack Range | 1 |
| Attack Tick Cycle | 4 |
| Default Movement Speed | 1 |
| Combat Movement Speed | 1 |
| Hitpoints | 12 |
| Attack | 12 |
| Strength | 9 |
| Defence | 5 |
| Enemy Melee Accuracy Bonus | 6 |
| Enemy Melee Defence Bonus | 1 |
| Enemy Max Hit | 4 |

Behavior notes:
- high reliability and faster swings create pressure without needing huge numbers
- lower defence makes it easier to kill than a Guard or Heavy Brute
- useful for enemies that should feel agile or relentless

---

## Drop Tables

First-pass melee enemies include weighted drop tables with explicit outcome chances.

### Drop Table Rules

1. Each enemy has a fixed first-pass drop table defined in this spec.
2. Drop tables should stay intentionally small and readable in the first pass.
3. Every enemy drop table should total 100%.
4. Nothing is an explicit weighted outcome where listed.
5. Drops should reinforce the enemy's role in the world and early progression.
6. Coin drops should stay modest in the first pass.
7. Equipment drops in this spec should use concrete currently-supported item families rather than vague weapon placeholders when possible.
8. For first-pass humanoid melee enemies, supported equipment drops are limited to swords, axes, and pickaxes.
9. Unless otherwise stated, item quantity is 1.
10. Coin entries should use explicit small ranges rather than abstract labels.
11. This first pass uses simple per-enemy weighted tables, not nested rarity tables.

### Coin Quantity Rules

| Coin Drop Label | Quantity |
| --- | --- |
| Small coin drop | 2-5 coins |
| Modest coin drop | 5-10 coins |
| Moderate coin drop | 8-15 coins |
| Light-to-moderate coin drop | 4-8 coins |

### Enemy Drop Tables

#### Rat

| Drop | Weight | Notes |
| --- | --- | --- |
| Nothing | 100% | True trash mob; no useful loot in first pass |

#### Chicken

| Drop | Weight | Notes |
| --- | --- | --- |
| Raw Chicken | 55% | Primary utility drop |
| Feathers | 35% | Early fletching utility drop |
| Nothing | 10% | Common no-loot result |

#### Goblin / Bandit Grunt

| Drop | Weight | Notes |
| --- | --- | --- |
| Coins (2-5) | 50% | Small coin drop |
| Bronze Sword | 10% | Low-tier weapon drop |
| Bronze Axe | 8% | Low-tier tool-weapon drop |
| Bronze Pickaxe | 7% | Low-tier tool-weapon drop |
| Nothing | 25% | Common no-loot result |

#### Boar

| Drop | Weight | Notes |
| --- | --- | --- |
| Raw Meat | 55% | Basic animal meat drop |
| Leather | 30% | Animal leather drop |
| Nothing | 15% | Common no-loot result |

#### Wolf

| Drop | Weight | Notes |
| --- | --- | --- |
| Raw Meat | 45% | Basic animal meat drop |
| Leather | 40% | Animal leather drop |
| Nothing | 15% | Common no-loot result |

#### Guard

| Drop | Weight | Notes |
| --- | --- | --- |
| Coins (5-10) | 45% | Modest coin drop |
| Bronze Sword | 12% | Low-tier weapon drop |
| Bronze Axe | 8% | Low-tier tool-weapon drop |
| Bronze Pickaxe | 5% | Low-tier tool-weapon drop |
| Iron Sword | 10% | Better weapon drop |
| Iron Axe | 5% | Better tool-weapon drop |
| Iron Pickaxe | 3% | Better tool-weapon drop |
| Nothing | 12% | Common no-loot result |

#### Bear

| Drop | Weight | Notes |
| --- | --- | --- |
| Raw Meat | 50% | Primary animal resource drop |
| Leather | 35% | Animal leather drop |
| Nothing | 15% | Common no-loot result |

#### Heavy Brute

| Drop | Weight | Notes |
| --- | --- | --- |
| Coins (8-15) | 50% | Moderate coin drop |
| Iron Sword | 16% | Better weapon drop |
| Iron Axe | 10% | Better tool-weapon drop |
| Iron Pickaxe | 8% | Better tool-weapon drop |
| Nothing | 16% | Common no-loot result |

#### Fast Striker

| Drop | Weight | Notes |
| --- | --- | --- |
| Coins (4-8) | 45% | Light-to-moderate coin drop |
| Iron Sword | 18% | Agile-fighter weapon drop |
| Iron Axe | 8% | Agile-fighter tool-weapon drop |
| Iron Pickaxe | 6% | Agile-fighter tool-weapon drop |
| Nothing | 23% | Common no-loot result |

## Spawn and Respawn Rules

This section defines the first-pass world-population model for melee enemies.

### Core Spawn Model

The first pass uses **authored spawn nodes**.

A spawn node is a placed world definition that creates one specific enemy at one specific location.

Rule: each spawn node owns at most one live enemy instance at a time unless a later system explicitly overrides that behavior.

### Spawn Node Fields

| Field | Meaning |
| --- | --- |
| Spawn Node ID | Unique identifier for the placed spawn definition |
| Enemy ID | Which enemy type this node spawns |
| Spawn Tile | Exact tile where the enemy initially appears |
| Home Tile Override | Optional override; if unset, Home Tile = Spawn Tile |
| Roaming Radius Override | Optional override; if unset, use Enemy Type Definition default |
| Respawn Time | Time delay before this node spawns a fresh replacement after death |
| Spawn Enabled | Whether this node is currently active |
| Facing Override | Optional authored facing/presentation setting |
| Spawn Group ID | Optional organizational grouping for camps, packs, or clusters |

### Spawn Node Rules

- Spawn Tile is the authored origin of the enemy.
- In the first pass, Home Tile defaults to Spawn Tile unless a Home Tile Override is explicitly authored.
- Each spawn node produces a fresh enemy in Idle state.
- Spawned enemies begin at full Hitpoints.
- Spawned enemies begin without a locked target.
- Spawned enemies resolve their active Roaming Radius, Home Tile, Aggro Radius, Chase Range, and movement values from Enemy Type Definition plus any Spawn Node overrides.

### Respawn Rules

- When an enemy spawned from a node dies, that node becomes temporarily unoccupied.
- The node begins its Respawn Time countdown on enemy death.
- When Respawn Time completes, the node spawns a fresh new instance of that enemy at Spawn Tile.
- Respawned enemies do not preserve previous damage, target, position, or combat cooldown state.
- Respawn creates a clean new enemy using the node's authored enemy data.

### First-Pass Respawn Time Bands

| Enemy Role | Respawn Time |
| --- | --- |
| Harmless wildlife | 12 seconds |
| Early animal resource enemy | 18 seconds |
| Early humanoid combat enemy | 20 seconds |
| Guard / sturdier humanoid | 25 seconds |
| Heavy threat | 30 seconds |

### Per-Enemy Respawn Times

| Enemy Type | Respawn Time |
| --- | --- |
| Rat | 12 seconds |
| Chicken | 12 seconds |
| Boar | 18 seconds |
| Wolf | 18 seconds |
| Goblin / Bandit Grunt | 20 seconds |
| Guard | 25 seconds |
| Bear | 30 seconds |
| Heavy Brute | 30 seconds |
| Fast Striker | 24 seconds |

Rule: respawn timing should support readable farming loops without making the world feel empty or instantly repopulating dangerous threats.

### Spawn Groups

Multiple spawn nodes may optionally belong to the same **Spawn Group**.

Spawn Groups are primarily an organizational/content-authoring tool in the first pass.

Examples:
- chicken pen
- goblin camp
- wolf den
- guard post

First-pass Spawn Groups do **not** imply:
- shared aggro
- ally assist behavior
- shared respawn logic
- formation logic

Those systems may be added later if desired, but they are not implied by group membership in this pass.

### Placement Guidelines

Use authored density and spacing intentionally.

#### Passive Wildlife

- Can be placed in loose clusters.
- May use larger Roaming Radius values.
- Should help the world feel alive without creating player pressure.

#### Aggressive Animals

- Usually placed as singles or pairs.
- Should have readable territory and not create accidental chain-aggro too often in starter spaces.
- Packs should be deliberate rather than accidental.

#### Humanoid Enemies

- Often work best in authored small groups, camps, or posts.
- Should be spaced with the pile-on rule in mind.
- Guard-type enemies usually work best with Roaming Radius = 0.

#### Heavy Threats

- Usually stronger as single enemies or deliberately dangerous pairs.
- Should have enough surrounding space that their threat comes from stats and placement, not accidental overcrowding.

### First-Pass Recommended Encounter Shapes

| Enemy Type | Typical Placement Pattern |
| --- | --- |
| Rat | Loose small clusters |
| Chicken | Loose pens or village-side clusters |
| Boar | Singles or pairs |
| Wolf | Singles, pairs, or small den clusters |
| Bear | Usually single |
| Goblin / Bandit Grunt | Small groups of 2-4 |
| Guard | Pairs or fixed posts |
| Heavy Brute | Usually single |
| Fast Striker | Usually single or deliberately threatening pair |

### Why This Model

The first-pass authored-spawn-node model is preferred because it is:
- easy to place
- easy to debug
- easy to tune
- predictable for players
- compatible with camps, packs, and hand-authored world design

This spec does not use dynamic population systems, encounter directors, or random region-based spawning in the first pass.

## Explicit Deferrals

The following are intentionally out of scope for this first melee-only enemy pass:
- advanced spawn randomization or region-based spawning
- advanced roaming behavior
- faction behavior
- group aggro or assist logic
- safe-spot exceptions
- ranged or magic enemies
- special attacks
- status effects
- multi-phase enemies
- multi-tile enemies unless later added explicitly
- style-split defensive profiles
- enemy equipment-driven stat derivation
- nested or global loot-table systems
- final stack-size rules

## Implementation Notes

1. Keep melee-only enemy behavior deterministic and simple in the first pass.
2. Prefer explicit per-enemy data fields over inferred combat behavior.
3. Keep chase range anchored to Home Tile to avoid accidental leash drift.
4. Do not duplicate shared combat engine logic here.
5. Treat this spec as the baseline template that future ranged, magic, boss, and special-behavior enemy specs can build on.
6. Reset restores full Hitpoints only when the enemy successfully reaches Home Tile.
7. Proximity aggro should require normal-path reachability to avoid awkward blocked-terrain aggro.
8. Multiple melee enemies are allowed to pile onto the same player as long as normal adjacency and combat rules are satisfied.

---

## Open Follow-Up Areas

These are likely next sections or future companion specs once the melee-only baseline is stable:
- numeric stat scaling rules for enemy tiers
- advanced roaming/wander logic
- multi-enemy encounter behavior
- ranged-only enemy spec
- magic-only enemy spec
- boss/special enemy behavior spec

