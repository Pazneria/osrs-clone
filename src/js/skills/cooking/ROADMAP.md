# Cooking Roadmap

## Canonical Runtime Source

All mechanic/value tables in this roadmap are synchronized against `src/js/skills/specs.js` (version `2026.03.m6`).
Where a skill defers market values to item data, value rows mirror `src/js/content/item-catalog.js`.

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
| Level Delta | Level Delta = Player Cooking Level - Required Level | Measures how far above the recipe unlock the player currently is |
| Clamped Level Delta | Clamped Level Delta = clamp(Level Delta, 0, 30) | Caps the shared burn curve to the intended unlock-to-+30 window |
| Burn Chance | Burn Chance = clamp(0, 0.33 - (0.038 x Clamped Level Delta) + (0.0018 x Clamped Level Delta^2) - (0.00003 x Clamped Level Delta^3), 0.33) | Determines the chance that a cooking action produces burnt food |
| Cooking Success Chance | Cooking Success Chance = 1 - Burn Chance | Determines the chance that a cooking action succeeds |
| Expected Successes per Action | Expected Successes per Action = Cooking Success Chance | Estimates average cooked-food output rate while actively cooking |
| Expected XP per Action | Expected XP per Action = Cooking Success Chance x XP per Success | Estimates average experience gain rate |
| Expected Gold Delta per Action | Expected Gold Delta per Action = (Cooking Success Chance x Cooked Sell Value) + (Burn Chance x Burnt Sell Value) - Raw Sell Value | Estimates average sell-value change from cooking one raw item |

### Equation Variables

| Variable | Meaning |
| -------- | ------- |
| Player Cooking Level | The player's current cooking level |
| Required Level | The unlock level of the selected raw food |
| Level Delta | The player's current cooking level minus the recipe's required level |
| Clamped Level Delta | Level Delta clamped into the inclusive `0..30` range |
| Cooking Success Chance | The probability that a cooking action produces cooked food |
| Burn Chance | The probability that a cooking action produces burnt food |
| XP per Success | The experience granted when the cooking action succeeds |
| Cooked Sell Value | The sell value of the cooked food |
| Burnt Sell Value | The sell value of the burnt food under the current item-value table |
| Raw Sell Value | The sell value of the raw food consumed by the action |
| Expected Successes per Action | Average cooked-food output per action |
| Expected XP per Action | Average experience gain per action |
| Expected Gold Delta per Action | Average sell-value change from cooking one raw item |

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

| Food | Required Level | XP per Success | Raw Item | Cooked Item | Burnt Item | Healing | Eat Delay Ticks | Raw Sell Value | Cooked Sell Value | Burnt Sell Value |
| ---- | -------------- | -------------- | -------- | ----------- | ---------- | ------- | --------------- | -------------- | ----------------- | ---------------- |
| Shrimp | 1 | 30 | Raw Shrimp | Cooked Shrimp | Burnt Shrimp | 3 | 4 | 1 | 3 | 1 |
| Trout | 10 | 70 | Raw Trout | Cooked Trout | Burnt Trout | 5 | 4 | 7 | 9 | 1 |
| Salmon | 20 | 90 | Raw Salmon | Cooked Salmon | Burnt Salmon | 7 | 4 | 9 | 12 | 1 |
| Tuna | 30 | 120 | Raw Tuna | Cooked Tuna | Burnt Tuna | 9 | 4 | 11 | 16 | 1 |
| Swordfish | 40 | 140 | Raw Swordfish | Cooked Swordfish | Burnt Swordfish | 12 | 4 | 16 | 22 | 1 |

### Shared Burn Curve Summary

| Relative Level Band | Clamped Level Delta | Burn Chance | Cooking Success Chance |
| ------------------- | ------------------- | ----------- | ---------------------- |
| Unlock | 0 | 33% | 67% |
| Unlock +10 | 10 | 10% | 90% |
| Unlock +20 | 20 | 5% | 95% |
| Unlock +30 | 30 | 0% | 100% |

### Tier-Entry Cooking Output Comparison

These per-action values lock the current 1-40 cooking progression at each recipe's unlock level. They use actual merchant sell values, so negative rows represent a deliberate value sink at the moment a band first unlocks.

| Food | Cooking Level | Cooking Success Chance | Expected Successes per Action | Expected XP per Action | Expected Gold Delta per Action |
| ---- | ------------- | ---------------------- | ----------------------------- | ---------------------- | ------------------------------ |
| Shrimp | 1 | 67% | 0.6700 | 20.1000 | 1.3400 |
| Trout | 10 | 67% | 0.6700 | 46.9000 | -0.6400 |
| Salmon | 20 | 67% | 0.6700 | 60.3000 | -0.6300 |
| Tuna | 30 | 67% | 0.6700 | 80.4000 | 0.0500 |
| Swordfish | 40 | 67% | 0.6700 | 93.8000 | -0.9300 |

### Level-40 Cooking Output Comparison

These level-40 values show how the full 1-40 food set compares once the current cap is reached.

| Food | Cooking Level | Cooking Success Chance | Expected Successes per Action | Expected XP per Action | Expected Gold Delta per Action |
| ---- | ------------- | ---------------------- | ----------------------------- | ---------------------- | ------------------------------ |
| Shrimp | 40 | 100% | 1.0000 | 30.0000 | 2.0000 |
| Trout | 40 | 100% | 1.0000 | 70.0000 | 2.0000 |
| Salmon | 40 | 95% | 0.9500 | 85.5000 | 2.4500 |
| Tuna | 40 | 90% | 0.9000 | 108.0000 | 3.5000 |
| Swordfish | 40 | 67% | 0.6700 | 93.8000 | -0.9300 |

### Cooking Value Break-Even Levels

The break-even level is the first Cooking level where the expected sell-value delta for that food becomes non-negative.

| Food | Break-Even Cooking Level |
| ---- | ------------------------ |
| Shrimp | 1 |
| Trout | 13 |
| Salmon | 22 |
| Tuna | 30 |
| Swordfish | 42 |

### Balance Notes

- Shrimp is the safe starter conversion: it is profitable immediately at unlock and stays positive throughout the current cap.
- Trout and salmon are early/mid-band XP-forward unlocks that start slightly value-negative, then cross into non-negative value at Cooking 13 and 22 respectively.
- Tuna is the strongest 1-40 cooking route on both XP-per-action and gold-delta-per-action at Cooking 40, and it is already slightly value-positive when it first unlocks.
- Swordfish is the level-40 inventory-quality unlock, but its sell-value delta stays negative inside the current 1-40 cap and does not break even until Cooking 42.

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
| Interruption | Any movement, facing change away from the fire, using another item on something, or any other action input immediately ends the cooking session. If the player uses a different raw fish on the same fire while already cooking, the current cooking session is replaced immediately and keeps the active attempt cadence so the swap does not introduce a dead tick |

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

Burnt fish can be sold to shops at their configured low sell values from the canonical item table.

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
- All cookable foods share the same unlock-relative burn curve: 33% at unlock, 10% at +10 levels, 5% at +20 levels, and 0% at +30 levels.
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
- Burnt food is still a normal item and can be sold to shops at its configured low sell value.
- The player starts cooking by selecting Use on a raw fish in inventory and then clicking a fire.
- Cooking cannot begin if the selected raw fish requires a higher cooking level than the player currently has.
- Cooking is initiated strictly through Use raw fish -> fire; fires do not provide direct cooking options from their own click menu.
- Cooking continuously processes all inventory items of the selected raw fish type, including continuing through burns until that fish type is exhausted or the action is interrupted.
- Cooking processes one item per tick while the action continues. If the player starts cooking partway through a tick, the first attempt resolves on the next tick.
- The player may begin cooking from any adjacent side of the fire.
- The player must be adjacent to the fire, stationary, and facing it while cooking.
- The normal cooking animation plays on every attempt, whether the result is success or burn.
- Cooking ends immediately if the player gives movement, uses another item on something, or gives any other action input.
- While cooking one fish type, the player may interrupt it at any time by using a different raw fish on the same fire to begin cooking that new fish type immediately, keeping the live tick cadence instead of resetting the timer.
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
| Raw Shrimp | Resource | 3 | 1 | null | null | Distinct raw-fish item used as shrimp cooking input; raw-fish merchant rules are defined by fishing |
| Cooked Shrimp | Food | 8 | 3 | 3 | 4 | Cooked shrimp |
| Burnt Shrimp | Burnt Food | 1 | 1 | null | null | Failed shrimp cooking output; inert junk item, not consumable |
| Raw Trout | Resource | 18 | 7 | null | null | Distinct raw-fish item used as trout cooking input; raw-fish merchant rules are defined by fishing |
| Cooked Trout | Food | 24 | 9 | 5 | 4 | Cooked trout |
| Burnt Trout | Burnt Food | 1 | 1 | null | null | Failed trout cooking output; inert junk item, not consumable |
| Raw Salmon | Resource | 24 | 9 | null | null | Distinct raw-fish item used as salmon cooking input; raw-fish merchant rules are defined by fishing |
| Cooked Salmon | Food | 32 | 12 | 7 | 4 | Cooked salmon |
| Burnt Salmon | Burnt Food | 1 | 1 | null | null | Failed salmon cooking output; inert junk item, not consumable |
| Raw Tuna | Resource | 28 | 11 | null | null | Distinct raw-fish item used as tuna cooking input; raw-fish merchant rules are defined by fishing |
| Cooked Tuna | Food | 40 | 16 | 9 | 4 | Cooked tuna |
| Burnt Tuna | Burnt Food | 1 | 1 | null | null | Failed tuna cooking output; inert junk item, not consumable |
| Raw Swordfish | Resource | 40 | 16 | null | null | Distinct raw-fish item used as swordfish cooking input; raw-fish merchant rules are defined by fishing |
| Cooked Swordfish | Food | 56 | 22 | 12 | 4 | Cooked swordfish |
| Burnt Swordfish | Burnt Food | 1 | 1 | null | null | Failed swordfish cooking output; inert junk item, not consumable |






