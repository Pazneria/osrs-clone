# Firemaking Roadmap

## Canonical Runtime Source

All mechanic/value tables in this roadmap are synchronized against `src/js/skills/specs.js` (version `2026.03.m6`).
Where a skill defers market values to item data, value rows mirror `src/js/content/item-catalog.js`.

## Purpose

Firemaking is the utility and support skill for converting logs into temporary fires.

The player uses firemaking to consume logs, gain experience, create temporary ground fires, and support early cooking without requiring a fixed range.

## Core Progression

| Log Type | Required Level |
| -------- | -------------- |
| Logs     | 1              |
| Oak Logs | 10             |
| Willow Logs | 20          |
| Maple Logs | 30           |
| Yew Logs | 40             |

## Tools

| Tool      | Required Level | Buy Value | Sell Value |
| --------- | -------------- | --------- | ---------- |
| Tinderbox | 1              | 8         | 2          |

## Mechanics

### Core Rules

| Rule | Description |
| ---- | ----------- |
| Valid Action Requirements | A firemaking action can begin only if the player meets the level requirement, has a tinderbox, has the correct logs, and is standing on a tile that does not already contain a lit fire. |
| Attempt-Based Action Time | Firemaking uses ignition attempts instead of a fixed action time. Each attempt occurs once per tick, and the action stays active until ignition succeeds or the player cancels/invalidates the action. |
| Success Logic | Each ignition attempt has a success chance based on the player's firemaking level and the log's ignition difficulty. The action succeeds when one attempt passes the success check. If an attempt fails, no fire is created, no log is consumed, no XP is awarded, and the action continues into the next tick attempt unless cancelled or invalidated. |
| Failure Feedback | The first failed ignition attempt for the current target tile emits a brief failure line, then silent retries continue until success or interruption. |
| Input Consumption | When a firemaking action succeeds, exactly 1 log is consumed. |
| Fire Creation | When a firemaking action succeeds, 1 temporary fire is created on the target tile. |
| XP Award | When a firemaking action succeeds, the player gains the XP listed for that log type. |
| Tile Occupancy | A lit fire blocks additional firemaking on the same tile until it expires. |
| Cooking Support | A lit fire counts as a valid cooking source for any cooking recipes that allow fire-based cooking. |
| Repeated Firemaking Flow | After successfully lighting a fire, the player finishes a short success clip, then automatically steps in a globally fixed eastward direction as part of the same firemaking flow. If that direction is blocked, the player instead steps west. If neither step is available, the chain stops without consuming another log. The player can light the next log only after moving onto a tile that does not already contain a lit fire. |
| Interruption | Firemaking stops immediately if the player moves away from the current stand tile, gives other movement or action input, loses required supplies, or cannot continue the repeated east/west stepping flow. |

### Global Constants

| Constant                     | Value |
| ---------------------------- | ----- |
| Ignition Attempt Interval Ticks | 1 |

### Success Chance Logic

| Value | Formula | Purpose |
| ----- | ------- | ------- |
| Ignition Success Score | Ignition Success Score = Player Firemaking Level | Represents the player's effective ignition power for the success check |
| Ignition Success Chance | Ignition Success Chance = Ignition Success Score / (Ignition Success Score + Ignition Difficulty) | Determines the chance that any given ignition attempt lights the fire |
| Expected Attempts | Expected Attempts = 1 / Ignition Success Chance | Estimates average ignition attempts required to light a fire |



### Firemaking Stats

| Log Type | Required Level | Ignition Difficulty | XP per Action | Fire Lifetime Ticks |
| -------- | -------------- | ------------------- | ------------- | ------------------- |
| Logs     | 1              | 15                  | 40            | 90                  |
| Oak Logs | 10             | 25                  | 60            | 90                  |
| Willow Logs | 20          | 35                  | 90            | 90                  |
| Maple Logs | 30           | 50                  | 135           | 90                  |
| Yew Logs | 40             | 65                  | 200           | 90                  |

### Standardized Success Chance Comparison

**Using level 40 firemaking**

| Log Type | Ignition Success Score | Calculation    | Ignition Success Chance |
| -------- | ---------------------- | -------------- | ----------------------- |
| Logs     | 40                     | 40 / (40 + 15) | 72.7273%                |
| Oak Logs | 40                     | 40 / (40 + 25) | 61.5385%                |
| Willow Logs | 40                  | 40 / (40 + 35) | 53.3333%                |
| Maple Logs | 40                   | 40 / (40 + 50) | 44.4444%                |
| Yew Logs | 40                     | 40 / (40 + 65) | 38.0952%                |

## Fire Runtime State

### Fire State Model

| State   | Meaning                                   |
| ------- | ----------------------------------------- |
| Lit     | The fire exists and can be used for cooking |
| Expired | The fire has burned out and leaves ashes on the tile |
| Ashes   | The fire is gone, ashes remain on the tile, and the tile is free for future firemaking and movement |

### Fire Session Data

| Field            | Meaning                                                       |
| ---------------- | ------------------------------------------------------------- |
| Fire ID          | The specific fire instance created by the ignition action         |
| Tile Coordinate  | The tile occupied by the fire                                 |
| Log Type         | What type of log created the fire                             |
| Created At Tick  | The game tick when the fire was created                       |
| Expire At Tick   | The game tick when the fire is removed                        |
| Fire State       | Whether the fire is currently lit, expired, or reduced to ashes |
| Ashes Expire At Tick | The game tick when ashes are removed from the world |

### Runtime Rules

| Rule            | Description |
| --------------- | ----------- |
| Fire Creation   | When an ignition action succeeds, create a fire with Expire At Tick = Current Tick + Fire Lifetime Ticks |
| Fire Persistence | A lit fire remains active until Current Tick >= Expire At Tick |
| Fire Expiry     | When the fire expires, remove the lit fire state and instantly create ashes on the tile on the same tick |
| Ashes Creation | When a fire expires, create exactly 1 lootable ashes item on the same tile |
| Ashes Pickup | Picking up ashes is universal, has no level requirement, and is instant |
| Ashes Persistence | Ashes remain on the tile after the fire expires, stack with other ashes on the same tile, and do not block movement, cooking, standing, or future firemaking on that tile |
| Ashes Despawn | Ashes despawn when Current Tick >= Ashes Expire At Tick |
| Ashes Lifetime | Ashes use Ashes Expire At Tick = Current Tick + 100 |
| One Fire per Tile | A tile cannot contain more than one lit fire at a time |
| Fire Movement / Standing | Lit fires do not block movement or standing. Players can move onto and stand on lit fire tiles normally. |
| Fire Hazard | Lit fires do not deal damage and are not treated as hazards. |
| Cooking Check   | Cooking actions that allow a fire may target any currently lit fire, regardless of who created it |
| Fire Follow-up Movement | During repeated firemaking, the player waits out the short success clip, then automatically attempts to step in a globally fixed eastward direction after each successful fire. If normal pathfinding fails for that direction because the tile is not walkable, the player steps west instead. If both follow-up steps fail, the chain stops cleanly without consuming another log. The player can light the next log only after moving onto a tile that does not already contain a lit fire. |

## Economy Role

Firemaking creates value indirectly by consuming logs to unlock utility rather than by producing high-value sellable outputs.

| Input / Output | Use |
| -------------- | --- |
| Logs           | Consumed for firemaking training |
| Lit Fires      | Temporary cooking source usable by any player |
| Ashes          | Stackable, lootable remnant left behind after a fire expires with no additional use for now |
| Tinderbox      | Core tool for all firemaking actions |

### Input Values

| Item      | Category | Buy Value | Sell Value |
| --------- | -------- | --------- | ---------- |
| Logs      | Resource | 6         | 2          |
| Oak Logs  | Resource | 16        | 6          |
| Willow Logs | Resource | 36      | 14         |
| Maple Logs | Resource | 80       | 32         |
| Yew Logs  | Resource | 180       | 72         |
| Ashes     | Resource | 4         | 1          |
| Tinderbox | Tool     | 8         | 2          |

## Cross-Skill Balance Benchmarks

These tables lock how firemaking pressure sits against same-log woodcutting supply and cooking-source demand.

- Firemaking benchmark level uses the level shown in each table row.
- Cooking support assumes the current `1`-tick cooking action cadence.
- Same-log woodcutting coverage uses the current maxed 1-40 woodcutting benchmark (`level = 40`, `toolPower = 28`, `speedBonusTicks = 5`).

### Tier-Entry Firemaking Benchmarks

| Log Type | Level | Success Chance | Expected Ticks per Lit Fire | XP per Tick | Log Sell Sink per Tick | Cooking Actions per Fire |
| -------- | ----- | -------------- | --------------------------- | ----------- | ---------------------- | ------------------------ |
| Logs | 1 | 6.3% | 16.0000 | 2.5000 | 0.1250 | 90.0000 |
| Oak Logs | 10 | 28.6% | 3.5000 | 17.1429 | 1.7143 | 90.0000 |
| Willow Logs | 20 | 36.4% | 2.7500 | 32.7273 | 5.0909 | 90.0000 |
| Maple Logs | 30 | 37.5% | 2.6667 | 50.6250 | 12.0000 | 90.0000 |
| Yew Logs | 40 | 38.1% | 2.6250 | 76.1905 | 27.4286 | 90.0000 |

### Level-40 Firemaking Benchmarks

| Log Type | Level | Success Chance | Expected Ticks per Lit Fire | XP per Tick | Log Sell Sink per Tick | Cooking Actions per Fire |
| -------- | ----- | -------------- | --------------------------- | ----------- | ---------------------- | ------------------------ |
| Logs | 40 | 72.7% | 1.3750 | 29.0909 | 1.4545 | 90.0000 |
| Oak Logs | 40 | 61.5% | 1.6250 | 36.9231 | 3.6923 | 90.0000 |
| Willow Logs | 40 | 53.3% | 1.8750 | 48.0000 | 7.4667 | 90.0000 |
| Maple Logs | 40 | 44.4% | 2.2500 | 60.0000 | 14.2222 | 90.0000 |
| Yew Logs | 40 | 38.1% | 2.6250 | 76.1905 | 27.4286 | 90.0000 |

### Maxed Same-Log Woodcutting Coverage

| Log Type | Level-40 Firemaking Logs Burned per Tick | Maxed Same-Log Woodcutting Sustained Logs per Tick | Coverage Ratio |
| -------- | ---------------------------------------- | -------------------------------------------------- | -------------- |
| Logs | 0.7273 | 0.0677 | 0.0931 |
| Oak Logs | 0.6154 | 0.0632 | 0.1028 |
| Willow Logs | 0.5333 | 0.0627 | 0.1175 |
| Maple Logs | 0.4444 | 0.0670 | 0.1506 |
| Yew Logs | 0.3810 | 0.1259 | 0.3306 |

### Balance Notes

- Firemaking remains a deliberate log sink: uninterrupted same-log chain-lighting consumes logs faster than one maxed same-log woodcutting lane replenishes them across the current 1-40 band.
- Each successful fire still supports `90` cooking actions at the current 1-tick cooking cadence, so cooking demand stays much lighter than dedicated firemaking-training demand on the log supply.

## Merchant / NPC Structure

No firemaking-specific NPCs or quests are required under the base model.

The general store buys everything at half price.

Ashes are not normally stocked by shops, but if a player sells ashes to a shop, they can be bought back through the normal shop interface.

## Training Location Structure

| Location Type | Role |
| ------------- | ---- |
| Starter grove fire lane | Entry-level `logs` practice beside the first woodcutting band and general-store loop |
| Oak path fire lane | Level-10 oak-fire progression near the oak band |
| Willow bend fire lane | Level-20 willow-fire progression beside the willow route |
| Maple ridge fire lane | Level-30 maple-fire progression near the higher-tier ridge loop |
| Yew frontier fire lane | Level-40 yew-fire progression at the late-band frontier |

Current world pass anchors these authored fire lanes in `main_overworld`, and QA exposes them through `/qa firespots` plus `/qa gotofire <starter|oak|willow|maple|yew>`.

## Dependencies

- Woodcutting
- Cooking
- Shops / economy

## Possible Rules

- Firemaking is available at level 1 with a tinderbox.
- Firemaking uses ignition attempts rather than a fixed action time.
- If an ignition attempt fails, no fire is created, no log is consumed, no XP is awarded, and the next attempt occurs on the next tick while the action remains active.
- The first failed ignition attempt for a given target tile emits a brief feedback line, then the skill retries silently until success or interruption.
- Firemaking always consumes exactly one log per successful action.
- Fires are temporary world objects rather than inventory items.
- When a fire expires, it leaves exactly 1 lootable ashes item on the tile.
- Ashes are stackable in inventory and on the ground.
- Picking up ashes has no level requirement and is instant.
- Ashes despawn after 100 ticks.
- Any lit fire can be used as a cooking source, regardless of who created it.
- Firemaking is primarily a utility and resource-sink skill rather than a direct gold-making skill.
- The general store buys all firemaking-related items at half price, rounded down.
- Firemaking success improves as firemaking level rises because higher skill increases ignition success chance.
- Firemaking progression spans all canonical log tiers: `logs`, `oak_logs`, `willow_logs`, `maple_logs`, and `yew_logs`.
- Fires can be made on any tile that does not already contain a lit fire.
- Lit fires do not block movement or standing.
- Lit fires do not deal damage and are not treated as hazards.
- Ashes are not normally stocked by shops, but sold ashes can still be bought back from the shop that bought them.
- Ashes have no additional use for now.
- Firemaking animation plays only on successful fire creation.
- Repeated firemaking movement happens automatically after the short success clip as part of the same firemaking flow.
- Repeated firemaking stops immediately if the player gives other movement or action input, moves away from the stand tile, loses supplies, or cannot make the next east/west follow-up step.

## Items

| Item      | Type     | Required Level | Buy Value | Sell Value | Notes |
| --------- | -------- | -------------- | --------- | ---------- | ----- |
| Tinderbox | Tool     | 1              | 8         | 2          | Required for all firemaking actions |
| Logs      | Resource | 1              | 6         | 2          | Entry-tier firemaking fuel |
| Oak Logs  | Resource | 10             | 16        | 6          | Level 10 firemaking fuel |
| Willow Logs | Resource | 20           | 36        | 14         | Level 20 firemaking fuel |
| Maple Logs | Resource | 30            | 80        | 32         | Level 30 firemaking fuel |
| Yew Logs  | Resource | 40             | 180       | 72         | Level 40 firemaking fuel |
| Ashes     | Resource | 1              | 4         | 1          | Stackable; created when fires expire |
