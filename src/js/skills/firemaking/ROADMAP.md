# Firemaking Roadmap

## Purpose

Firemaking is the utility and support skill for converting logs into temporary fires.

The player uses firemaking to consume logs, gain experience, create temporary ground fires, and support early cooking without requiring a fixed range.

## Core Progression

| Log Type    | Required Level |
| ----------- | -------------- |
| Normal Logs | 1              |
| Oak Logs    | 10             |
| Willow Logs | 20             |
| Maple Logs  | 30             |
| Yew Logs    | 40             |

## Tools

| Tool      | Required Level | Buy Value | Sell Value |
| --------- | -------------- | --------- | ---------- |
| Tinderbox | 1              | 8         | 2          |

## Mechanics

### Core Rules

| Rule | Description |
| ---- | ----------- |
| Valid Action Requirements | A firemaking action can begin only if the player meets the level requirement, has a tinderbox, has the correct logs, and is standing on a tile that does not already contain a lit fire. |
| Attempt-Based Action Time | Firemaking uses ignition attempts instead of a fixed action time. Each attempt occurs once per tick, and the action ends immediately on success or failure. |
| Success Logic | Each ignition attempt has a success chance based on the player's firemaking level and the log's ignition difficulty. The action succeeds when one attempt passes the success check. If an attempt fails, the action ends with no fire created, no log consumed, and no XP awarded. |
| Input Consumption | When a firemaking action succeeds, exactly 1 log is consumed. |
| Fire Creation | When a firemaking action succeeds, 1 temporary fire is created on the target tile. |
| XP Award | When a firemaking action succeeds, the player gains the XP listed for that log type. |
| Tile Occupancy | A lit fire blocks additional firemaking on the same tile until it expires. |
| Cooking Support | A lit fire counts as a valid cooking source for any cooking recipes that allow fire-based cooking. |
| Repeated Firemaking | After successfully lighting a fire, the player automatically steps in a globally fixed eastward direction as part of the same firemaking flow. If that direction is blocked, the player instead steps west. The player can light the next log only after moving onto a tile that does not already contain a lit fire. |

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

| Log Type    | Required Level | Ignition Difficulty | XP per Action | Fire Lifetime Ticks |
| ----------- | -------------- | --------------- | ------------- | ------------------- |
| Normal Logs | 1              | 12              | 8             | 15                  |
| Oak Logs    | 10             | 24              | 16            | 18                  |
| Willow Logs | 20             | 38              | 28            | 21                  |
| Maple Logs  | 30             | 54              | 45            | 24                  |
| Yew Logs    | 40             | 72              | 70            | 27                  |

### Standardized Success Chance Comparison

**Using level 40 firemaking**

| Log Type    | Ignition Success Score | Calculation    | Ignition Success Chance |
| ----------- | ------------------ | -------------- | ------------------- |
| Normal Logs | 40                 | 40 / (40 + 12) | 76.9231%            |
| Oak Logs    | 40                 | 40 / (40 + 24) | 62.5000%            |
| Willow Logs | 40                 | 40 / (40 + 38) | 51.2821%            |
| Maple Logs  | 40                 | 40 / (40 + 54) | 42.5532%            |
| Yew Logs    | 40                 | 40 / (40 + 72) | 35.7143%            |



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
| Fire Chain Movement | During repeated firemaking, the player automatically attempts to step in a globally fixed eastward direction after each successful fire. If normal pathfinding fails for that direction because the tile is not walkable, the player steps west instead. The player can light the next log only after moving onto a tile that does not already contain a lit fire. |

## Economy Role

Firemaking creates value indirectly by consuming logs to unlock utility rather than by producing high-value sellable outputs.

| Input / Output | Use |
| -------------- | --- |
| Logs           | Consumed for firemaking training |
| Lit Fires      | Temporary cooking source usable by any player |
| Ashes          | Stackable, lootable remnant left behind after a fire expires with no additional use for now |
| Tinderbox      | Core tool for all firemaking actions |

### Input Values

| Item        | Category | Buy Value | Sell Value |
| ----------- | -------- | --------- | ---------- |
| Normal Logs | Resource | 6         | 2          |
| Oak Logs    | Resource | 16        | 6          |
| Willow Logs | Resource | 36        | 14         |
| Maple Logs  | Resource | 80        | 32         |
| Yew Logs    | Resource | 180       | 72         |
| Ashes       | Resource | 4         | 1          |
| Tinderbox   | Tool     | 8         | 2          |

## Merchant / NPC Structure

No firemaking-specific NPCs or quests are required under the base model.

The general store buys everything at half price.

Ashes are not normally stocked by shops, but if a player sells ashes to a shop, they can be bought back through the normal shop interface.

## Training Location Structure

| Location Type                     | Purpose                                |
| --------------------------------- | -------------------------------------- |
| Starter camp area                 | Entry-level normal log firemaking      |
| Forest edge clearing              | Early oak training space               |
| Riverbank or village-side clearing | Mid-band willow training               |
| Woodland campsite                 | Higher-tier maple training             |
| Restricted forest camp            | Valuable yew training and utility area |

## Dependencies

- Woodcutting
- Cooking
- Shops / economy

## Possible Rules

- Firemaking is available at level 1 with a tinderbox.
- Firemaking uses ignition attempts rather than a fixed action time.
- If an ignition attempt fails, the action ends with no fire created, no log consumed, and no XP awarded.
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
- Higher-tier firemaking progression depends entirely on access to higher-tier logs from woodcutting or merchants.
- Fires can be made on any tile that does not already contain a lit fire.
- Lit fires do not block movement or standing.
- Lit fires do not deal damage and are not treated as hazards.
- Ashes are not normally stocked by shops, but sold ashes can still be bought back from the shop that bought them.
- Ashes have no additional use for now.
- Firemaking animation plays only on successful fire creation.
- Repeated firemaking movement happens automatically as part of the same firemaking flow.
- Repeated firemaking stops immediately if the player gives other movement or action input.

## Items

| Item        | Type     | Required Level | Buy Value | Sell Value | Notes |
| ----------- | -------- | -------------- | --------- | ---------- | ----- |
| Tinderbox   | Tool     | 1              | 8         | 2          | Required for all firemaking actions |
| Normal Logs | Resource | 1              | 6         | 2          | Used to create normal fires |
| Oak Logs    | Resource | 10             | 16        | 6          | Used to create oak fires |
| Willow Logs | Resource | 20             | 36        | 14         | Used to create willow fires |
| Maple Logs  | Resource | 30             | 80        | 32         | Used to create maple fires |
| Yew Logs    | Resource | 40             | 180       | 72         | Used to create yew fires |
| Ashes       | Resource | 1              | 4         | 1          | Stackable; created when fires expire |



