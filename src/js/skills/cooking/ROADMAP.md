# Cooking Roadmap

## Purpose

Cooking is the processing skill for turning raw food into usable food.

Under the base model, cooking primarily converts raw fish from fishing into cooked fish for healing, selling, and progression.

## Core Progression

| Food | Required Level |
| ---- | -------------- |
| Shrimp | 1 |
| Trout | 10 |
| Salmon | 20 |
| Tuna | 30 |
| Swordfish | 40 |

## Cooking Sources

| Source | Required Level | Notes |
| ------ | -------------- | ----- |
| Fire | 1 | Any currently lit fire is a valid cooking source |

## Mechanics

### Core Equations

| Equation | Formula | Purpose |
| -------- | ------- | ------- |
| Cooking Success Score | Cooking Success Score = Player Cooking Level | Represents the player's effective cooking power for the success check |
| Cooking Success Chance | Cooking Success Chance = Cooking Success Score / (Cooking Success Score + Burn Difficulty) | Determines the chance that a cooking action succeeds |
| Burn Chance | Burn Chance = 1 - Cooking Success Chance | Determines the chance that a cooking action produces burnt food |
| Expected Successes per Action | Expected Successes per Action = Cooking Success Chance | Estimates average cooked-food output rate while actively cooking |
| Expected XP per Action | Expected XP per Action = Cooking Success Chance x XP per Success | Estimates average experience gain rate |
| Expected Gold per Action | Expected Gold per Action = (Cooking Success Chance x Cooked Sell Value) + (Burn Chance x Burnt Sell Value) - Raw Sell Value | Estimates average value change from cooking one raw item |

### Equation Variables

| Variable | Meaning |
| -------- | ------- |
| Player Cooking Level | The player's current cooking level |
| Cooking Success Score | The player's effective success power for the check |
| Burn Difficulty | The difficulty value for the selected raw food |
| Cooking Success Chance | The probability that a cooking action produces cooked food |
| Burn Chance | The probability that a cooking action produces burnt food |
| XP per Success | The experience granted when the cooking action succeeds |
| Cooked Sell Value | The sell value of the cooked food |
| Burnt Sell Value | The sell value of the burnt food, which is always 0 under the base model |
| Raw Sell Value | The sell value of the raw food consumed by the action |
| Expected Successes per Action | Average cooked-food output per action |
| Expected XP per Action | Average experience gain per action |
| Expected Gold per Action | Average value change from cooking one raw item |

### Global Constants

| Constant | Value |
| -------- | ----- |
| Cooking Attempt Interval Ticks | 1 |

### Core Rules

| Rule | Description |
| ---- | ----------- |
| Inputs | Cooking one item requires exactly 1 raw food item. The player selects Use on that raw fish in inventory and then clicks a valid fire. If the player's cooking level is below that fish's required level, the action cannot begin |
| Source Requirement | A cooking action requires access to any currently lit fire |
| Source Ownership | Any player may use any valid fire |
| Success Result | On success, consume 1 raw food, create 1 standard cooked food result, and grant the listed XP |
| Burn Result | On failure, consume 1 raw food, create 1 burnt food, play the normal cooking animation, and grant no XP |
| Attempt Timing | Cooking attempts resolve once per tick while the action continues. If the player starts cooking partway through a tick, the first attempt resolves on the next tick |
| Batch Cooking | Cooking continuously processes all inventory items of the selected raw fish type |
| Batch Resolution | Cooking processes one raw fish at a time. Each fish resolves once as either cooked or burnt, then cooking proceeds to the next fish of that same type until none remain or the action is interrupted |
| Action Stop Conditions | Cooking stops immediately if the player runs out of raw food, loses adjacency to the fire, is no longer facing the fire, moves, uses another item on something, or gives any other action input |
| Item Identity | Raw, cooked, and burnt versions are distinct non-stackable items with distinct item identities |
| Eating Result | Eating a cooked fish consumes it immediately, heals immediately, and applies that fish's Eat Delay Ticks value |

### Cooking Stats

| Food | Required Level | Burn Difficulty | XP per Success | Raw Item | Cooked Item | Burnt Item | Healing | Eat Delay Ticks | Raw Sell Value | Cooked Sell Value | Burnt Sell Value |
| ---- | -------------- | --------------- | -------------- | -------- | ----------- | ---------- | ------- | --------------- | -------------- | ----------------- | ---------------- |
| Shrimp | 1 | 10 | 10 | Raw Shrimp | Shrimp | Burnt Shrimp | 3 | 4 | 3 | 6 | 0 |
| Trout | 10 | 22 | 20 | Raw Trout | Trout | Burnt Trout | 5 | 4 | 8 | 16 | 0 |
| Salmon | 20 | 36 | 32 | Raw Salmon | Salmon | Burnt Salmon | 7 | 4 | 16 | 28 | 0 |
| Tuna | 30 | 52 | 46 | Raw Tuna | Tuna | Burnt Tuna | 9 | 4 | 28 | 44 | 0 |
| Swordfish | 40 | 70 | 65 | Raw Swordfish | Swordfish | Burnt Swordfish | 12 | 4 | 48 | 72 | 0 |

### Standardized Success Chance Comparison

**Using level 40 cooking**

| Food | Cooking Success Score | Calculation | Cooking Success Chance |
| ---- | --------------------- | ----------- | ---------------------- |
| Shrimp | 40 | 40 / (40 + 10) | 80.0000% |
| Trout | 40 | 40 / (40 + 22) | 64.5161% |
| Salmon | 40 | 40 / (40 + 36) | 52.6316% |
| Tuna | 40 | 40 / (40 + 52) | 43.4783% |
| Swordfish | 40 | 40 / (40 + 70) | 36.3636% |

## Runtime State

### Eating Runtime Data

| Field | Meaning |
| ----- | ------- |
| Eating Cooldown End Tick | The earliest tick when the player may eat again after the current eat delay expires |

### Cooking Session Data

| Field | Meaning |
| ----- | ------- |
| Cooking Source ID | The fire currently being used |
| Source Type | Fire |
| Food Type | The raw food currently selected for cooking |
| Remaining Quantity | How many items of the selected raw fish type remain in the current cooking session |
| Created At Tick | The tick when the cooking action began |
| Last Attempt Tick | The tick when the most recent cooking attempt resolved |
| Cooking State | Whether the player is actively cooking or the action has ended |

### Runtime Rules

| Rule | Description |
| ---- | ----------- |
| Eat Action | Eating a cooked fish consumes it immediately, heals immediately, and sets the player's eating cooldown based on that fish's Eat Delay Ticks value. Eating grants no XP |
| Eat Cooldown | While an eating cooldown is active, the player cannot eat any food until the cooldown expires |
| Action Start | Starting a cooking action creates a cooking session tied to the selected fire and food type. The player selects Use on a raw fish in inventory and then clicks a fire. The player may begin from any adjacent side of the fire, but must be adjacent to the fire, stationary, and facing it when the action begins. All inventory items of that raw fish type are queued automatically |
| Tick Resolution | While the action remains active, one cooking attempt resolves each tick. If the action begins partway through a tick, the first attempt resolves on the next tick. The same cooking animation plays on every attempt, whether the result is success or burn |
| Source Validation | Before each attempt resolves, confirm the fire is still valid and usable and that the player is still adjacent to it and facing it |
| Fire Expiry Interaction | If the targeted fire expires before the next attempt resolves, the cooking action ends immediately and cleanly with no partial resolution on that tick |
| Inventory Validation | If the player no longer has any of the selected raw food type, the cooking action ends immediately |
| Success Output | A successful attempt removes 1 raw food and adds 1 cooked food directly into the same inventory slot flow. Inventory overflow does not occur because the raw item being consumed creates the available space |
| Burn Output | A failed attempt removes 1 raw food and adds 1 burnt food directly into inventory. Inventory overflow does not occur because the raw item being consumed creates the available space |
| Batch Completion | When Remaining Quantity reaches 0, the cooking session ends |
| Interruption | Any movement, facing change away from the fire, using another item on something, or any other action input immediately ends the cooking session. If the player uses a different raw fish on the same fire while already cooking, the current cooking session is replaced immediately with no extra delay |

## Eating Mechanics

Cooked fish are usable food items and use the standard Eat interaction.

Eating is immediate both in and out of combat and uses a per-food eat delay value measured in ticks. Eating one food item prevents eating any other food again until that delay expires.

Eating does not interact with movement or pathfinding. The player can eat while moving and can continue moving while eating with no slowdown or movement penalty.

Eating can occur on the same tick as movement input.

Eating cannot occur on the same tick as attacking or casting.

Cooked fish are tradable and sellable like normal items.

Burnt fish are not edible.

## Economy Role

Cooking adds value by converting raw fish into more useful and more valuable cooked food, with burn risk acting as the main sink.

| Input / Output | Use |
| -------------- | --- |
| Raw Fish | Primary cooking input gathered from fishing |
| Cooked Fish | Main successful output for healing, selling, and progression |
| Burnt Fish | Failed output with no value and no use under the base model |
| Fires | Temporary world cooking source created by firemaking |

## Merchant / NPC Structure

Cooking does not require cooking-specific merchants under the base model, but it interacts directly with fish-buying and fish-selling merchants from the fishing economy.

Under the base model, there are no ranges yet. All cooking is performed on fires.

Raw fish, cooked fish, and burnt fish are distinct item states with distinct item identities and normal shop behavior.

Raw fish merchant stock and unlock behavior are defined by fishing. Cooking does not define or override raw fish merchant-unlock rules.

Cooked fish can be sold to the obvious fish-buying merchants using their cooked sell values.

Burnt fish can be sold to shops, but their sell value is always 0.

The general store buys everything at half price, rounded down.

## Training Location Structure

| Location Type | Purpose |
| ------------- | ------- |
| Starter campfire | Entry-level shrimp cooking near early fishing |
| Riverbank fire line | Mid-band trout and salmon cooking near rod fishing spots |
| Dockside fire line | Tuna cooking near harpoon progression |
| Deep-water dock fire line | Swordfish cooking near late early-game fishing progression |

## Dependencies

- Fishing
- Firemaking
- Shops / economy

## Possible Rules

- Cooking is available at level 1.
- Cooking uses raw food as input and creates either cooked food or burnt food.
- Cooking can be performed on any currently lit fire.
- Under the base model, fires are the only cooking source.
- Cooking success improves as cooking level rises because higher skill increases cooking success chance.
- Higher-tier food progression depends entirely on access to higher-tier raw food from gathering, shops, or other content.
- Raw food, cooked food, and burnt food are all non-stackable and have distinct item identities.
- Eating a cooked fish consumes it immediately and heals immediately, both in and out of combat.
- Eating does not interact with movement or pathfinding; the player can eat while moving and continue moving while eating with no slowdown or movement penalty.
- Eating can occur on the same tick as movement input.
- Eating cannot occur on the same tick as attacking or casting.
- Cooked fish use the standard Eat interaction.
- Eating food grants no cooking XP.
- Each cooked fish has an Eat Delay Ticks value that prevents eating any food again until that many ticks have passed.
- Raw fish are not edible.
- Burnt fish are not edible.
- Burnt food is not consumable under the base model.
- Burnt food is still a normal item and can be sold to shops, but its sell value is always 0.
- The player starts cooking by selecting Use on a raw fish in inventory and then clicking a fire.
- Cooking cannot begin if the selected raw fish requires a higher cooking level than the player currently has.
- Cooking is initiated strictly through Use raw fish -> fire; fires do not provide direct cooking options from their own click menu.
- Cooking continuously processes all inventory items of the selected raw fish type, including continuing through burns until that fish type is exhausted or the action is interrupted.
- Cooking processes one item per tick while the action continues. If the player starts cooking partway through a tick, the first attempt resolves on the next tick.
- The player may begin cooking from any adjacent side of the fire.
- The player must be adjacent to the fire, stationary, and facing it while cooking.
- The normal cooking animation plays on every attempt, whether the result is success or burn.
- Cooking ends immediately if the player gives movement, uses another item on something, or gives any other action input.
- While cooking one fish type, the player may interrupt it at any time by using a different raw fish on the same fire to begin cooking that new fish type immediately, with no extra delay.
- All cooked fish currently use the same 4-tick eat delay.
- Cooking ends immediately and cleanly if the targeted fire expires before the next cooking attempt resolves.
- Any lit fire can be used as a cooking source, regardless of who created it.
- All raw fish can be cooked on all fires.
- Cooking is primarily a value-adding processing skill rather than a direct gathering skill.
- Raw fish merchant stock and unlock behavior are defined by fishing; cooking does not define or override raw fish merchant-unlock rules.
- Cooked fish can be sold to the obvious fish-buying merchants using their cooked sell values.
- Cooked fish are tradable and sellable like normal items.
- The general store buys all cooking-related items at half price, rounded down.

## Items

| Item | Type | Buy Value | Sell Value | Healing | Eat Delay Ticks | Notes |
| ---- | ---- | --------- | ---------- | ------- | ---------------- | ----- |
| Raw Shrimp | Resource | 9 | 3 | null | null | Distinct raw-fish item used as shrimp cooking input; raw-fish merchant rules are defined by fishing |
| Shrimp | Food | 18 | 6 | 3 | 4 | Cooked shrimp |
| Burnt Shrimp | Burnt Food | 0 | 0 | null | null | Failed shrimp cooking output; inert junk item, not consumable |
| Raw Trout | Resource | 24 | 8 | null | null | Distinct raw-fish item used as trout cooking input; raw-fish merchant rules are defined by fishing |
| Trout | Food | 48 | 16 | 5 | 4 | Cooked trout |
| Burnt Trout | Burnt Food | 0 | 0 | null | null | Failed trout cooking output; inert junk item, not consumable |
| Raw Salmon | Resource | 48 | 16 | null | null | Distinct raw-fish item used as salmon cooking input; raw-fish merchant rules are defined by fishing |
| Salmon | Food | 84 | 28 | 7 | 4 | Cooked salmon |
| Burnt Salmon | Burnt Food | 0 | 0 | null | null | Failed salmon cooking output; inert junk item, not consumable |
| Raw Tuna | Resource | 84 | 28 | null | null | Distinct raw-fish item used as tuna cooking input; raw-fish merchant rules are defined by fishing |
| Tuna | Food | 132 | 44 | 9 | 4 | Cooked tuna |
| Burnt Tuna | Burnt Food | 0 | 0 | null | null | Failed tuna cooking output; inert junk item, not consumable |
| Raw Swordfish | Resource | 144 | 48 | null | null | Distinct raw-fish item used as swordfish cooking input; raw-fish merchant rules are defined by fishing |
| Swordfish | Food | 216 | 72 | 12 | 4 | Cooked swordfish |
| Burnt Swordfish | Burnt Food | 0 | 0 | null | null | Failed swordfish cooking output; inert junk item, not consumable |



