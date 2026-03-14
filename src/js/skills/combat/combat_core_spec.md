# Combat Outline

## Purpose

Combat is the shared real-time encounter system for resolving attacks, damage, death, and combat-state timing across melee, ranged, and magic.

Under the base model, combat core owns universal combat rules and timing, while melee, ranged, and magic own their individual style-specific attack content, scaling, equipment families, and resource use.

## Scope Boundaries

| System | Ownership |
| ------ | --------- |
| Combat Core | Shared combat timing, target validation, damage application, and combat calculations |
| Melee | Melee weapons, melee range rules, melee style-specific attack data, and melee-side scaling details |
| Ranged | Bows, arrows, ranged style-specific attack data, and ammo consumption rules |
| Magic | Magic weapons, rune consumption rules, staff interaction rules, and magic style-specific attack data |
| Smithing / Crafting / Fletching / Runecrafting | Creation and item identity ownership for combat-relevant equipment, ammo, staffs, runes, armor, and assembled weapons |

## Core Combat Model

| Category | Rule |
| -------- | ---- |
| Base Model | Combat resolves on the global game tick system already used elsewhere in the project |
| Combat Styles | All combat styles plug into one shared combat engine rather than using separate timing systems |
| Target Model | Combat is single-target under the base model |
| Damage Model | A successful hit applies a single integer damage result to one target |
| Core Combat Stats | Attack, Strength, Defence, Ranged, Magic, and Hitpoints are shared combat stats used by both the player and enemies |
| Death Model | A target that reaches 0 health dies immediately |
| Death Scope Boundary | Combat core owns immediate on-death combat-state behavior, while loot, respawn, and other death aftermath rules can be handled separately |
| Encounter Focus | The base model is designed first for PvE against enemy targets |

## Mechanics

### Core Combat Stat Definitions

Attack, Strength, Defence, Ranged, Magic, and Hitpoints are the shared base combat stats used by both the player and enemies.

These stats are used directly in combat calculations.

Equipment stats are also used directly in player combat calculations.

For the player, melee, ranged, and magic accuracy/strength/defence bonuses come exclusively from equipped item stats.

Enemies also use the shared combat stats, but enemy melee, ranged, and magic accuracy/defence values and enemy max-hit values are defined directly in enemy combat data rather than being derived from equipment.

In v1, enemy damage rolls use Enemy Max Hit directly. Enemy Strength remains authored for readability/future systems unless a later spec says otherwise.

### Core Combat Stats

| Stat | Shared Use |
| ---- | ---------- |
| Attack | Used in melee attack calculations for both the player and enemies |
| Strength | Used in player melee damage calculations. For enemies in v1, Strength remains authored for readability/future systems while damage rolls use Enemy Max Hit directly |
| Defence | Used in defensive combat calculations for both the player and enemies |
| Ranged | Used in ranged attack and ranged damage calculations for both the player and enemies |
| Magic | Used in magic attack and magic damage calculations for both the player and enemies |
| Hitpoints | Used to determine maximum health for both the player and enemies |

### Player Equipment Combat Stats

| Equipment Stat | Use |
| -------------- | --- |
| Melee Accuracy Bonus | Added to player melee attack calculations |
| Melee Strength Bonus | Added to player melee damage calculations |
| Melee Defence Bonus | Added when the player defends against melee attacks |
| Ranged Accuracy Bonus | Added to player ranged attack calculations |
| Ranged Strength Bonus | Added to player ranged damage calculations |
| Ranged Defence Bonus | Added when the player defends against ranged attacks |
| Magic Accuracy Bonus | Added to player magic attack calculations |
| Magic Damage Bonus | Added to player magic damage calculations |
| Magic Defence Bonus | Added when the player defends against magic attacks |

### Enemy Combat Bonus Values

| Enemy Value | Use |
| ----------- | --- |
| Enemy Melee Accuracy Bonus | Defined directly in enemy combat data and added to enemy melee attack calculations |
| Enemy Melee Defence Bonus | Defined directly in enemy combat data and added when enemies defend against melee attacks |
| Enemy Ranged Accuracy Bonus | Defined directly in enemy combat data and added to enemy ranged attack calculations |
| Enemy Ranged Defence Bonus | Defined directly in enemy combat data and added when enemies defend against ranged attacks |
| Enemy Magic Accuracy Bonus | Defined directly in enemy combat data and added to enemy magic attack calculations |
| Enemy Magic Defence Bonus | Defined directly in enemy combat data and added when enemies defend against magic attacks |
| Enemy Max Hit | Defined directly in enemy combat data and used directly for enemy damage rolls in v1 |

### Derived Combat Values

| Derived Value | Formula | Use |
| ------------- | ------- | --- |
| Player Melee Attack Value | Attack + Melee Accuracy Bonus | Used when the player makes a melee hit check |
| Player Melee Defence Value | Defence + Melee Defence Bonus | Used when the player defends against melee attacks |
| Player Melee Max Hit | ceil(((Strength * 1.6) + Melee Strength Bonus) / 10) | Maximum melee damage on a successful player melee hit |
| Player Ranged Attack Value | Ranged + Ranged Accuracy Bonus | Used when the player makes a ranged hit check |
| Player Ranged Defence Value | Defence + Ranged Defence Bonus | Used when the player defends against ranged attacks |
| Player Ranged Max Hit | ceil(((Ranged * 1.0) + Ranged Strength Bonus) / 10) | Maximum ranged damage on a successful player ranged hit |
| Player Magic Attack Value | Magic + Magic Accuracy Bonus | Used when the player makes a magic hit check |
| Player Magic Defence Value | Defence + Magic Defence Bonus | Used when the player defends against magic attacks |
| Player Magic Max Hit | ceil(((Magic * 1.25) + Magic Damage Bonus) / 10) | Maximum magic damage on a successful player magic hit |
| Enemy Melee Attack Value | Attack + Enemy Melee Accuracy Bonus | Used when an enemy makes a melee hit check |
| Enemy Melee Defence Value | Defence + Enemy Melee Defence Bonus | Used when an enemy defends against melee attacks |
| Enemy Ranged Attack Value | Ranged + Enemy Ranged Accuracy Bonus | Used when an enemy makes a ranged hit check |
| Enemy Ranged Defence Value | Defence + Enemy Ranged Defence Bonus | Used when an enemy defends against ranged attacks |
| Enemy Magic Attack Value | Magic + Enemy Magic Accuracy Bonus | Used when an enemy makes a magic hit check |
| Enemy Magic Defence Value | Defence + Enemy Magic Defence Bonus | Used when an enemy defends against magic attacks |
| Enemy Max Hit | Defined per enemy attack profile or enemy combat data | Maximum damage on a successful enemy hit in v1 |

Combat core uses the final style-adjusted melee attack value, melee defence value, and melee max hit supplied by the melee system.

### Hit Resolution Equations

| Equation | Formula | Purpose |
| -------- | ------- | ------- |
| Player Melee Hit Check | Random Integer from 0 to Player Melee Attack Value >= Random Integer from 0 to Enemy Melee Defence Value | Determines whether a player melee attack hits |
| Player Ranged Hit Check | Random Integer from 0 to Player Ranged Attack Value >= Random Integer from 0 to Enemy Ranged Defence Value | Determines whether a player ranged attack hits |
| Player Magic Hit Check | Random Integer from 0 to Player Magic Attack Value >= Random Integer from 0 to Enemy Magic Defence Value | Determines whether a player magic attack hits |
| Enemy Melee Hit Check | Random Integer from 0 to Enemy Melee Attack Value >= Random Integer from 0 to Player Melee Defence Value | Determines whether an enemy melee attack hits |
| Enemy Ranged Hit Check | Random Integer from 0 to Enemy Ranged Attack Value >= Random Integer from 0 to Player Ranged Defence Value | Determines whether an enemy ranged attack hits |
| Enemy Magic Hit Check | Random Integer from 0 to Enemy Magic Attack Value >= Random Integer from 0 to Player Magic Defence Value | Determines whether an enemy magic attack hits |
| Successful Player Hit Damage Roll | Random Integer from 0 to Player Style Max Hit | Determines damage dealt by a successful player hit for the active style |
| Successful Enemy Hit Damage Roll | Random Integer from 0 to Enemy Max Hit | Determines damage dealt by a successful enemy hit |

### Max-Hit Rounding Rule

Player max-hit formulas round up to the next integer.

### Core Equations

| Equation | Formula | Purpose |
| -------- | ------- | ------- |
| Post-Hit Health | Post-Hit Health = max(0, Current Health - Damage Dealt) | Resolves the target's remaining health after a damaging hit |
| Missing Health | Missing Health = Max Health - Current Health | Tracks how much health the actor is missing at any moment |

### Equation Variables

| Variable | Meaning |
| -------- | ------- |
| Attack | Base melee attack stat |
| Strength | Base player melee damage stat. Enemy Strength is authored separately for readability/future systems but does not drive v1 enemy damage rolls |
| Defence | Base defensive stat |
| Ranged | Base ranged attack and ranged damage stat |
| Magic | Base magic attack and magic damage stat |
| Hitpoints | Base health stat |
| Melee Accuracy Bonus | Total equipped bonus applied to player melee hit calculations |
| Melee Strength Bonus | Total equipped bonus added after the Strength * 1.6 multiplier and before dividing by 10 in player melee max-hit calculations |
| Melee Defence Bonus | Total equipped bonus applied when the player defends against melee attacks |
| Ranged Accuracy Bonus | Total equipped bonus applied to player ranged hit calculations |
| Ranged Strength Bonus | Total equipped bonus added before dividing by 10 in player ranged max-hit calculations |
| Ranged Defence Bonus | Total equipped bonus applied when the player defends against ranged attacks |
| Magic Accuracy Bonus | Total equipped bonus applied to player magic hit calculations |
| Magic Damage Bonus | Total equipped bonus added before dividing by 10 in player magic max-hit calculations |
| Magic Defence Bonus | Total equipped bonus applied when the player defends against magic attacks |
| Player Melee Attack Value | Combined player melee hit value after stats and equipment are applied |
| Player Melee Defence Value | Combined player melee defence value after stats and equipment are applied |
| Player Melee Max Hit | Maximum melee damage result on a successful player melee hit |
| Player Ranged Attack Value | Combined player ranged hit value after stats and equipment are applied |
| Player Ranged Defence Value | Combined player ranged defence value after stats and equipment are applied |
| Player Ranged Max Hit | Maximum ranged damage result on a successful player ranged hit |
| Player Magic Attack Value | Combined player magic hit value after stats and equipment are applied |
| Player Magic Defence Value | Combined player magic defence value after stats and equipment are applied |
| Player Magic Max Hit | Maximum magic damage result on a successful player magic hit |
| Enemy Melee Accuracy Bonus | Enemy-defined bonus added to melee attack calculations |
| Enemy Melee Defence Bonus | Enemy-defined bonus added when defending against melee attacks |
| Enemy Ranged Accuracy Bonus | Enemy-defined bonus added to ranged attack calculations |
| Enemy Ranged Defence Bonus | Enemy-defined bonus added when defending against ranged attacks |
| Enemy Magic Accuracy Bonus | Enemy-defined bonus added to magic attack calculations |
| Enemy Magic Defence Bonus | Enemy-defined bonus added when defending against magic attacks |
| Enemy Melee Attack Value | Combined enemy melee hit value after base stats and enemy combat data are applied |
| Enemy Melee Defence Value | Combined enemy melee defence value after base stats and enemy combat data are applied |
| Enemy Ranged Attack Value | Combined enemy ranged hit value after base stats and enemy combat data are applied |
| Enemy Ranged Defence Value | Combined enemy ranged defence value after base stats and enemy combat data are applied |
| Enemy Magic Attack Value | Combined enemy magic hit value after base stats and enemy combat data are applied |
| Enemy Magic Defence Value | Combined enemy magic defence value after base stats and enemy combat data are applied |
| Enemy Max Hit | Maximum damage result on a successful enemy hit, as defined by enemy combat data |
| Current Health | The actor's current health immediately before the event resolves |
| Damage Dealt | The integer damage applied by a successful hit |
| Post-Hit Health | The actor's health after incoming damage resolves |
| Max Health | The actor's maximum health |
| Missing Health | The amount of health the actor is currently missing |


### Global Constants

| Constant | Value |
| -------- | ----- |
| Combat Target Limit | 1 |
| Minimum Health Floor | 0 |

### Attack Tick Cycles

Every attack has its own tick cycle.

That tick cycle is assigned by the appropriate style spec or attack source data.

Combat core owns the shared rule for how attack tick cycles are tracked and counted down after an attack completes.

### Attack Tick Cycle Rules

| Rule | Description |
| ---- | ----------- |
| Tick Cycle Ownership | Melee, ranged, magic, or enemy attack data define the tick cycle value used by that attack |
| Shared Cooldown Tracking | Combat core tracks a single Remaining Attack Cooldown integer for each actor independently |
| Countdown Start | When an attack completes, that actor's Remaining Attack Cooldown is immediately set to the full tick cycle of that attack on that same tick |
| Attack Completion Timing | For combat-core timing, an attack is treated as complete at the instant it is launched/executed, not at a later damage-application or projectile-impact moment |
| Tick-Aligned Countdown | Remaining Attack Cooldown decreases by 1 on each subsequent game tick |
| Intra-Tick Independence | Attack cooldown is tick-aligned, not real-time-aligned, so the next tick reduces the cooldown by 1 no matter when within the prior tick the attack completed |
| Attack Lockout | An actor cannot begin another attack while Remaining Attack Cooldown is greater than 0 |
| Attack Ready State | An actor may begin another attack on any tick where Remaining Attack Cooldown equals 0 |
| Immediate Resolution at 0 | If an actor is otherwise able to attack, the attack resolves immediately on the same tick that Remaining Attack Cooldown equals 0 |
| Tick-Start State Rule | Attack eligibility is evaluated from the actor's state at tick start. An actor that moves into range on a tick cannot also attack on that same tick unless another rule explicitly overrides this |
| Attack-Then-Move Order | If an actor is in range, unobscured, and has Remaining Attack Cooldown equal to 0 at the start of the tick, the actor's attack resolves before any movement on that same tick |
| Attack-Tick Immobility | If an actor attacks on a tick, that actor does not move on that same tick |
| Movement-First Cancellation | If movement occurs before a ready attack would resolve on that tick, that attack is cancelled for that tick |
| Shared Actor Rule | This same countdown rule applies to both the player and enemies |
| Independent Cooldowns | Each actor's Remaining Attack Cooldown is tracked independently from every other actor's cooldown |
| Same-Tick Readiness | Different actors may both have Remaining Attack Cooldown equal to 0 on the same tick |
| Style Switching | Changing weapon, style, or attack source does not modify an already-active Remaining Attack Cooldown |
| Next Attack Lock-In | When the actor next completes another attack, the new attack's tick cycle becomes the new Remaining Attack Cooldown |

### Same-Tick Multi-Actor Rule

If multiple actors independently satisfy their attack conditions on the same tick, they may all attack on that same tick.

Ready attacks on the same tick resolve simultaneously as a batch rather than in deterministic actor order.

A same-tick ready attack is not cancelled just because that actor or its target also dies on that same tick from another ready attack in the same batch.

Within a given actor's own tick processing, ready attacks always resolve before movement on that tick, and an actor that attacks on that tick does not move on that same tick.

### Attack Tick Cycle Example

| Step | Remaining Attack Cooldown |
| ---- | ------------------------- |
| 4-tick attack completes | 4 |
| Next tick | 3 |
| Next tick | 2 |
| Next tick | 1 |
| Next tick | 0 |
| At 0 on that same tick | Actor may attack again |

### Attack Tick Cycle Variables

| Variable | Meaning |
| -------- | ------- |
| Attack Tick Cycle | The attack-specific cooldown length assigned by style data or enemy attack data |
| Remaining Attack Cooldown | The number of ticks remaining before the actor may attack again |
| Can Attack | True when Remaining Attack Cooldown equals 0; false when Remaining Attack Cooldown is greater than 0 |

### Runtime Need

Combat core should track at minimum each actor's own Remaining Attack Cooldown.

The player has a Remaining Attack Cooldown, and each enemy has its own separate Remaining Attack Cooldown.

These cooldowns are tracked independently.

Can Attack may be stored directly or derived from whether that actor's Remaining Attack Cooldown equals 0.

### Target Lock and Combat Engagement

Combat uses a locked-target model.

Once an actor selects a target, that target remains the actor's combat target until combat is broken by invalidation or range/chase rules.

While a target is locked, the actor keeps trying to engage that target rather than requiring fresh attack input for each hit.

### Target Lock and Combat Engagement Rules

| Rule | Description |
| ---- | ----------- |
| Locked Target Model | Combat uses a single locked combat target per actor |
| Auto-Repeat | If an actor has a locked valid target, attacks repeat automatically whenever Remaining Attack Cooldown equals 0 |
| Shared Pursuit Rule | While a target is locked, the actor continues trying to engage that target even while Remaining Attack Cooldown is greater than 0 |
| Move Into Range | If the locked target is not currently within the attack's valid range, the actor moves toward the target |
| First Valid Tile Stop | The actor stops at the first reachable tile that is within valid attack range and unobscured for that attack rather than continuing to the target's tile |
| Stop When In Range | The actor stops moving once it is within valid attack range and the target is not obscured for that attack |
| Face Target in Combat | When two actors are engaged and in attack position, they face each other while trading attacks unless movement or retargeting changes that state |
| Reposition for Line of Attack | If the target is within range but obscured, the actor attempts to reposition to a tile that provides a valid unobscured attack if such a path exists |
| Failed Reposition Path | If no valid reposition path exists, the actor continues trying to move directly toward the target and may remain blocked by world geometry |
| Attack When Ready | If the locked target is valid, within range, unobscured, and Remaining Attack Cooldown equals 0 at the start of the tick, the actor always attacks automatically on that same tick before movement is processed |
| Cooldown Does Not Break Lock | Attack cooldown does not clear or pause target lock; the actor keeps tracking the target while cooldown counts down |
| Range Is Attack-Specific | Valid attack range comes from the active attack, weapon, style, or enemy attack data |
| Shared Square Range Rule | All combat styles use tile-based square range measurement rather than circular radius measurement |
| Melee Diagonal Validity | Diagonal adjacency counts as valid melee range |
| Square Range Shape | A range value of N allows targeting any tile within an N-tile square reach measured straight or diagonal from the attacker |
| Range-4 Example | A range value of 4 produces a 9x9 attackable square centered on the attacker, subject to obstruction and target validity rules |
| First Pathfound Valid Tile | For ranged and magic pursuit, the actor stops at the first valid attack tile found by pathing rather than searching for a nearest-by-distance ideal tile |
| Shared Range Logic | Melee, ranged, and magic all use the same core rule of moving until within valid range, then attacking when ready, and all styles use the same shared square range rule while still keeping their own range values |
| Re-Pursue on Range Break | If a locked target later moves out of valid attack range, the actor resumes pursuit until back within valid range and unobscured |
| Next-Tick Pursuit Start | If an actor needs to follow because the target moved out of range, that follow movement begins on the next tick rather than on the same tick the range break occurs |
| Obstruction Rule | An attack cannot be executed if world geometry blocks the line from the center of the attacker's tile to the center of the target's tile for that attack |
| Tile-Center Line Check | Obstruction is checked from tile center to tile center rather than by edge contact or circular radius methods |
| Height Blocking Basis | Whether geometry blocks that tile-center line is determined by obstruction/height rules from world data |
| Partial Barrier Exception | Short or partial barriers such as fences may allow attacks if their world obstruction/height data does not block that attack |
| Player Pursuit Basis | For the player, staying on target uses the normal interaction/pathfinding model until the target can no longer be validly pursued |
| Planted Basic Combat | In basic combat, once two actors reach their attack positions they generally stay on those tiles and trade attacks until movement, range break, obstruction, death, or retargeting changes that state |
| Hard No-Path Break | If a locked target has no valid path because world geometry makes pursuit impossible, target lock breaks immediately |
| Temporary Occupancy Block | If pursuit is only temporarily blocked by another actor or temporary occupancy, target lock is kept and pathing retries continue |
| Pursuit Without Immediate Reachability | A locked target may still be pursued even if the actor cannot immediately attack it, including cases where the target can currently reach the actor before the actor can reach the target |
| Enemy Pursuit Basis | Enemies continue chasing their locked target until the target moves outside that enemy's chase range |
| Enemy Aggro Ownership Boundary | Combat core defines how an enemy behaves once it has a locked target, but enemy aggro acquisition rules belong in enemy-specific combat data or a separate enemy spec |
| Chase Break | If an enemy's locked target moves outside that enemy's chase range, the enemy instantly forgets combat with that target and stops pursuing |
| Break on Invalid Target | Combat breaks if the locked target becomes invalid, such as by dying, disappearing, or otherwise no longer being a valid target |
| Enemy Reset After Break | After chase break, the enemy returns to its home area/reset state over time rather than remaining in active pursuit |
| Reset Interrupt by New Hit | If an enemy is hit while returning to its home/reset area, it immediately snaps back into combat using the normal universal hit-aggro response |
| Instant Retarget | If the actor selects a different valid target, the old locked target is replaced immediately by the new locked target |
| Same-Target Reclick | Selecting the already-locked target again is a no-op |
| Manual Movement Break | If the player manually clicks the ground or otherwise gives manual movement input, the player's locked combat target is cleared immediately |
| Manual Re-Acquisition Requirement | After manual movement breaks target lock, the player must click the target again to re-acquire it; lock does not resume automatically |
| Cooldown Persistence on Break | Breaking or replacing target lock does not reset, shorten, or otherwise modify an already-active Remaining Attack Cooldown |
| Auto-Retaliate System Boundary | Auto-retaliate is a separate combat behavior layered on top of target lock rather than part of the base manual targeting flow |
| Auto-Retaliate Trigger | If auto-retaliate is enabled and the player is attacked while not already locked onto a target with a valid path, the player immediately locks onto the attacker and enters combat with that attacker |
| Auto-Retaliate While Engaged | If the player already has a locked target with a valid path, auto-retaliate does not replace that target |
| Auto-Retaliate on Failed Pursuit | If the player has a locked target but no valid path to that target, that lock breaks immediately and auto-retaliate may then replace it with an attacker that can be validly pursued |
| Auto-Retaliate Target Priority | If multiple valid attackers are eligible for auto-retaliate, select by priority in this order: first attacker, then closest attacker, then weakest-to-strongest tie-break ordering |
| Universal Hit-Aggro Response | If an idle enemy is hit, it becomes aggressive on that same tick, immediately locks onto the attacker as its combat target, and its Remaining Attack Cooldown becomes 1 |
| Universal Chase Start | If that newly aggressive enemy is not yet in range, it immediately begins pathing toward its aggressor on that same tick under its normal pursuit rules |
| Enemy Facing on Aggro | When an enemy begins pathing toward its aggressor, it naturally faces that pursuit direction through its movement/pathing behavior |
| Universal Enemy Applicability | This immediate hit-response behavior applies to all enemies by default unless a later enemy-specific passive/flee/exception rule overrides it |
| Immediate Death Interrupt | If an actor dies, its movement, attacks, pursuit, retaliation, and active combat participation stop immediately on that same tick |
| Immediate Target Invalidation on Death | A dead target becomes invalid immediately on the same tick it dies |
| Immediate Lock Break on Death | If an actor's locked target dies, that target lock breaks immediately on that same tick |
| Dead Actors Cannot Act | Dead actors cannot attack, move, pursue, retaliate, or remain valid combat targets |
| Attack Fizzle on Same-Tick Death | If an actor would attack on a tick but its target became invalid before the same-tick ready-attack batch is formed, the attack fizzles and no attack cooldown is spent |

### Target Lock Variables

| Variable | Meaning |
| -------- | ------- |
| Locked Combat Target | The current target the actor is trying to engage |
| Has Locked Target | Whether the actor currently has a locked combat target |
| Attack Range | The valid range for the current attack, measured using the shared tile-based square range rule |
| Melee Adjacency | Any adjacent tile, including diagonal adjacency, when using melee under the same shared square range rule |
| First Valid Attack Tile | The first reachable tile from which the current attack can be executed against the locked target, as found by pathing under the current range and obstruction rules |
| Target Obscured | Whether world geometry currently blocks the tile-center line of attack against the locked target |
| Valid Path to Target | Whether the actor currently has a valid path for pursuing the locked target under the current movement/pathing rules |
| Hard No-Path | A path failure caused by world geometry or other non-temporary map blockage that makes pursuit impossible |
| Temporary Path Blockage | A path failure caused by temporary occupancy or similar temporary blockage that should be retried rather than immediately breaking lock |
| Enemy Chase Range | The maximum distance an enemy will continue pursuing its locked target |
| Enemy Home Area / Reset State | The area/state the enemy returns to after combat is forgotten |
| Is Dead | Whether the actor is dead and therefore no longer a valid combat participant |
| Manual Movement Input | A player-issued non-target movement command that immediately clears target lock |
| Auto-Retaliate Enabled | Whether the player is currently allowed to auto-lock onto attackers when struck |
| Auto-Retaliate Candidate Set | The set of valid attackers eligible to be chosen by auto-retaliate |
| First Attacker | The earliest attacker among the current valid auto-retaliate candidates |
| Closest Attacker | The nearest attacker among the current valid auto-retaliate candidates |
| Weakest-to-Strongest Order | Final tie-break ordering that prefers weaker valid attackers before stronger ones |

### Shared Combat Loop Pseudocode

```text
if player gives manual movement input:
    clear locked target immediately

if actor selects the already-locked target:
    do nothing
else if actor selects a different valid target:
    replace locked target immediately

if auto-retaliate is enabled and player is attacked:
    if player does not already have a locked target with a valid path:
        choose auto-retaliate target by priority:
            1. first attacker
            2. closest attacker
            3. weakest to strongest
        lock onto chosen attacker immediately

if actor.isDead:
    do nothing
else if actor.hasLockedTarget == false:
    do nothing
else:
    if target is invalid or target.isDead:
        break combat immediately
    else if hard no-path to target exists:
        break combat immediately
    else if target is temporarily blocked by occupancy:
        keep target lock
        retry pathing
    else if actor is enemy and target is outside Enemy Chase Range:
        forget combat immediately
        begin returning to home area / reset state
    else:
        if target is within Attack Range and target is not obscured and Remaining Attack Cooldown == 0:
            face target
            if target became invalid before the same-tick ready-attack batch is formed:
                attack fizzles
                spend no cooldown
            else:
                add attack to same-tick ready-attack batch
                Remaining Attack Cooldown = usedAttack.tickCycle
                do not move on this tick
        else if target is within Attack Range and target is obscured:
            if valid reposition path exists:
                reposition to get a valid line of attack
            else:
                move directly toward target and get blocked if necessary
        else if target is not within Attack Range:
            move toward the first valid reachable attack tile allowed by the current attack's square range value
        else:
            face target
            keep target locked and stay engaged
```

### Walkthrough Scenarios

#### 1. Player melee opens on a non-aggro enemy

- Player clicks enemy and locks target.
- Player moves to the first valid melee tile.
- If player is in range, unobscured, and Remaining Attack Cooldown = 0 at tick start, the player attacks immediately.
- That attack is treated as complete at launch, so the player's cooldown is immediately set from the used melee attack's tick cycle.
- If the enemy was idle and is hit, it becomes aggressive on that same tick.
- On that same tick, the enemy immediately locks onto the player as its combat target, begins pursuing if needed, and its Remaining Attack Cooldown becomes 1.
- On the next tick, if the enemy is in range, unobscured, and otherwise valid to attack, it attacks immediately.

#### Tick-by-Tick Example: Player melee opens on a non-aggro enemy

Assume the player and enemy begin already adjacent, unobscured, and both have Remaining Attack Cooldown = 0.

| Tick | Event |
| ---- | ----- |
| Tick T start | Player is ready to attack, enemy is idle and not yet aggressive |
| Tick T | Player attacks immediately at tick start |
| Tick T | Player Remaining Attack Cooldown is immediately set to the used attack's tick cycle |
| Tick T | Enemy becomes aggressive on that same tick, locks onto the player, and Enemy Remaining Attack Cooldown becomes 1 |
| Tick T+1 start | Enemy Remaining Attack Cooldown reaches 0 |
| Tick T+1 | If still alive, in range, and unobscured, enemy attacks immediately at tick start and does not move on that tick |
| Tick T+1 | Enemy Remaining Attack Cooldown is immediately set to the used enemy attack's tick cycle |
| Later ticks | Player and enemy continue counting down their own independent cooldowns and attack whenever their own cooldown reaches 0 at tick start |

#### 2. Player ranged attacks while enemy chases into melee

- Player locks onto enemy with a ranged attack.
- Player moves to the first valid reachable ranged attack tile, then stops there.
- At tick start, if player cooldown = 0 and line of attack is clear, the player attacks immediately.
- Because the enemy was hit, it becomes aggressive on that same tick, immediately locks onto the player, its Remaining Attack Cooldown becomes 1, and it begins pathing toward the player immediately using its own chase range and pursuit rules.
- While the enemy closes distance, the player keeps attacking whenever the player's cooldown returns to 0 and the enemy remains in range and unobscured.
- If either actor steps out of valid range, pursuit resumes on the next tick rather than on the same tick as the range break.
- Once the enemy reaches its own valid melee tile, it may attack on any tick where its own cooldown = 0.

#### 3. Player swaps attack source during cooldown

- Player attacks with a 4-tick attack.
- On that same tick, player Remaining Attack Cooldown becomes 4.
- If the player swaps to a 3-tick attack before cooldown reaches 0, the active cooldown remains 4 -> 3 -> 2 -> 1 -> 0.
- The swap does not shorten or rewrite the active cooldown.
- When the player next attacks after reaching 0, the newly used attack sets the next cooldown.

#### 4. Locked target loses valid path and auto-retaliate takes over

- Player has a locked target.
- During pursuit, the path to that target becomes invalid because of hard no-path world geometry.
- Target lock breaks immediately.
- If the path failure is only temporary occupancy blockage, target lock is kept and pathing retries instead of breaking.
- If that break was caused by manual player movement, the player must click the target again to re-acquire it.
- If auto-retaliate is enabled and the player is attacked by a valid pursuable attacker, the player may immediately lock onto that attacker instead according to auto-retaliate priority rules.

#### 5. Target is in range but obscured

- Actor has a locked target.
- Target is within square range but the tile-center line of attack is blocked.
- Actor attempts to reposition to a valid unobscured attack tile if a valid path exists.
- If no valid reposition path exists, actor continues trying to move directly and may remain blocked.
- Attack does not execute until target is both in range and unobscured at tick start with cooldown = 0.
- If the target became invalid before the same-tick ready-attack batch was formed, the attack fizzles and no cooldown is spent.
- If both actors are ready and valid for the same-tick batch, both attacks still resolve even if one or both die from that same batch.

#### 6. Enemy chase breaks and reset begins

- Enemy has a locked target.
- Target moves outside the enemy's chase range.
- Enemy immediately forgets combat with that target.
- Enemy stops pursuing and begins returning toward its home/reset area over time.
- If the enemy is hit again during that return, it immediately snaps back into combat using the normal hit-aggro response.
- This does not change the player's cooldown or any other actor's independent cooldown state.

