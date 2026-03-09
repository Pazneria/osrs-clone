# Fishing Roadmap

## Purpose

Fishing is the gathering skill for catching fish from water.

The player catches raw fish items that feed into other systems, especially cooking.

## Core Progression

| Fish      | Required Level |
| --------- | -------------- |
| Raw Shrimp | 1              |
| Raw Trout | 10             |
| Raw Salmon | 20             |
| Raw Tuna | 30             |
| Raw Swordfish | 40             |

## Tools

| Tool         | Required Level | Buy Value | Sell Value | Extra Requirement |
| ------------ | -------------- | --------- | ---------- | ----------------- |
| Small Net    | 1              | 40        | 10         | None              |
| Fishing Rod  | 10             | 120       | 35         | Bait              |
| Harpoon      | 30             | 350       | 110        | None              |
| Rune Harpoon | 40             | null      | 2500       | None              |

## Mechanics

### Core Equations

| Equation                | Formula                                                                                                                                                         | Purpose                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Water-Type Catch Chance | Water-Type Catch Chance = min(Max Water-Type Catch Chance, Base Water-Type Catch Chance + Water-Type Level Scaling x (Fishing Level - Water-Type Unlock Level)) | Determines the probability that the player catches something from the current water type on a tick |
| Fish Catch Chance       | Fish Catch Chance = Water-Type Catch Chance x Fish Weight Share                                                                                                 | Determines the effective probability of catching a specific fish from a mixed water type           |
| Fish Weight Share       | Fish Weight Share = Fish Weight / Total Eligible Fish Weight                                                                                                    | Determines how likely a successful catch is to become a specific fish                              |
| Expected Fish per Tick  | Expected Fish per Tick = Water-Type Catch Chance                                                                                                                | Estimates average fishing output rate while actively fishing                                       |
| Expected XP per Tick    | Expected XP per Tick = Sum(Fish Catch Chance x XP per Catch)                                                                                                      | Estimates average experience gain rate for the current water type                                  |
| Expected Gold per Tick  | Expected Gold per Tick = Sum(Fish Catch Chance x Fish Sell Value)                                                                                                 | Estimates average gold gain rate for the current water type                                        |

### Equation Variables

| Variable                     | Meaning                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------- |
| Fishing Level                | The player's current fishing level                                            |
| Water-Type Unlock Level      | The level when this fishing method in this water type first becomes available |
| Base Water-Type Catch Chance | The catch chance when the water type first becomes available                  |
| Water-Type Level Scaling     | The amount the water-type catch chance increases per level above unlock       |
| Max Water-Type Catch Chance  | The upper cap on the water type's overall catch chance                        |
| Water-Type Catch Chance      | The probability of catching something from the current water type on a tick   |
| Fish Weight                  | The relative weight of a fish in the current eligible fish table              |
| Total Eligible Fish Weight   | The sum of all weights for fish the player can currently catch                |
| Fish Weight Share            | The share of successful catches assigned to one fish                          |
| Fish Catch Chance            | The effective probability of catching a specific fish on a tick               |
| XP per Catch                 | The experience granted for catching one fish                                  |
| Fish Sell Value              | The sell value of one fish                                                    |
| Expected Fish per Tick       | Average fishing output rate while actively fishing                            |
| Expected XP per Tick         | Average experience gain rate                                                  |
| Expected Gold per Tick       | Average gold gain rate                                                        |

### Global Constants

| Constant                     | Value |
| ---------------------------- | ----- |
| Tick Duration Seconds        | 0.6   |
| Base Water-Type Catch Chance | 15%   |
| Water-Type Level Scaling     | 0.5%  |

### Fish Stats

| Fish      | Required Level | XP per Catch | Tool Needed  | Extra Requirement | Water Requirement | Sell Value |
| --------- | -------------- | ------------ | ------------ | ----------------- | ----------------- | ---------- |
| Raw Shrimp | 1 | 10 | Small Net | None | Standard Water | 3 |
| Raw Trout | 10 | 20 | Fishing Rod | Bait | Standard Water | 8 |
| Raw Salmon | 20 | 32 | Fishing Rod | Bait | Standard Water | 16 |
| Raw Tuna | 30 | 46 | Harpoon | None | Standard Water | 28 |
| Raw Swordfish | 40 | 65 | Harpoon or Rune Harpoon | None | Deep Water | 48 |

### Water-Type Stats

| Water Type           | Unlock Level | Tool Needed  | Extra Requirement | Base Water-Type Catch Chance | Water-Type Level Scaling | Max Water-Type Catch Chance |
| -------------------- | ------------ | ------------ | ----------------- | ---------------------------- | ------------------------ | --------------------------- |
| Net Fishing          | 1            | Small Net    | None              | 15%                          | 0.5%                     | 55%                         |
| Rod Fishing          | 10           | Fishing Rod  | Bait              | 15%                          | 0.5%                     | 55%                         |
| Harpoon Fishing      | 30           | Harpoon      | None              | 15%                          | 0.5%                     | 55%                         |
| Deep Harpoon Fishing | 40           | Harpoon or Rune Harpoon | None              | 15%                          | 0.5%                     | 55%                         |

### Water-Type Catch Chance Examples

**Water-Type Catch Chance = min(Max Water-Type Catch Chance, Base Water-Type Catch Chance + Water-Type Level Scaling x (Fishing Level - Water-Type Unlock Level))**

| Water Type      | Fishing Level | Calculation                      | Water-Type Catch Chance |
| --------------- | ------------- | -------------------------------- | ----------------------- |
| Net Fishing     | 1             | min(55%, 15% + 0.5% x (1 - 1))   | 15%                     |
| Net Fishing     | 10            | min(55%, 15% + 0.5% x (10 - 1))  | 19.5%                   |
| Rod Fishing     | 10            | min(55%, 15% + 0.5% x (10 - 10)) | 15%                     |
| Rod Fishing     | 20            | min(55%, 15% + 0.5% x (20 - 10)) | 20%                     |
| Deep Harpoon Fishing | 40            | min(55%, 15% + 0.5% x (40 - 40)) | 15%                     |

### Rod Bait Note

Raw Trout and salmon are caught with rod fishing.

Rod fishing requires bait to start fishing and continue fishing.

One bait is consumed only when a trout or salmon catch succeeds.

### Deep-Water Harpoon Note

Raw Swordfish requires deep water and Fishing Level 40.

In deep water, a normal harpoon uses the mixed deep-water table and can catch both tuna and swordfish.

In deep water, a rune harpoon uses the swordfish-only table and catches only swordfish.

### Water-Type Fish Tables

Successful catches are assigned to fish using weighted tables. The player rolls once to determine whether a catch happens. If it succeeds, the fish is chosen from the eligible weighted table for the current fishing method and water type.

| Fishing Method       | Fishing Level Range | Water Requirement | Eligible Fish Weights |
| -------------------- | ------------------- | ----------------- | --------------------- |
| Net Fishing          | 1+                  | Standard Water    | Raw Shrimp 100            |
| Rod Fishing          | 10-19               | Standard Water    | Raw Trout 100             |
| Rod Fishing          | 20-29               | Standard Water    | Raw Trout 75, Raw Salmon 25   |
| Rod Fishing          | 30+                 | Standard Water    | Raw Trout 60, Raw Salmon 40   |
| Harpoon Fishing      | 30-39               | Standard Water    | Raw Tuna 100              |
| Harpoon Fishing      | 40+                 | Standard Water    | Raw Tuna 100              |
| Deep Harpoon Fishing | 40+                 | Deep Water        | Raw Tuna 70, Raw Swordfish 30 when using Harpoon |
| Deep Harpoon Fishing | 40+                 | Deep Water        | Raw Swordfish 100 when using Rune Harpoon |

### Mixed Water-Type Example

**Rod Fishing at Fishing Level 20**

- Water-Type Catch Chance = 20%
- Eligible Fish Weights = Raw Trout 75, Raw Salmon 25
- Raw Trout Fish Catch Chance = 20% x 75% = 15%
- Raw Salmon Fish Catch Chance = 20% x 25% = 5%

### Standardized Active Fishing Output Comparison

These active output values measure fishing performance while the player is actively fishing valid water and do not include walking time, inventory management, or banking time.

| Fishing Method       | Fishing Level | Water Requirement | Water-Type Catch Chance | Expected Fish per Tick |
| -------------------- | ------------- | ----------------- | ----------------------- | ---------------------- |
| Net Fishing          | 1             | Standard Water    | 15%                     | 0.1500                 |
| Rod Fishing          | 10            | Standard Water    | 15%                     | 0.1500                 |
| Rod Fishing          | 20            | Standard Water    | 20%                     | 0.2000                 |
| Harpoon Fishing      | 30            | Standard Water    | 15%                     | 0.1500                 |
| Deep Harpoon Fishing | 40            | Deep Water        | 15%                     | 0.1500                 |

## Continuous Fishing Model

### Bait and Rod Rules

| Rule                        | Description                                                                      |
| --------------------------- | -------------------------------------------------------------------------------- |
| Rod requires bait           | The fishing rod requires bait to begin and continue fishing                      |
| Bait consumed on catch      | One bait is consumed only when a rod-fishing catch succeeds                      |
| No bait, no fishing         | If the player has no bait, rod fishing cannot start and active rod fishing stops |
| Net and harpoon ignore bait | Net fishing and harpoon fishing do not require or consume bait                   |

### Core Fishing Rules

| Rule                    | Description                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| Start fishing           | When the player clicks valid water with the correct tool and has at least one free inventory slot, fishing begins                       |
| Water requirement       | Most fishing can occur in standard water, but deep-water fishing unlocks at level 40 and is required for swordfish |
| Deep-water tool split   | In deep water, a normal harpoon catches a tuna and swordfish mix, while a rune harpoon catches only swordfish |
| Rod bait requirement    | Rod fishing requires bait, while net and harpoon fishing do not                                |
| Continue fishing        | The player rolls once per tick to determine whether the current water yields a catch           |
| Water-based success     | Fishing success is based on the current fishing method and water type, not tool power or speed |
| Mixed fish resolution   | If a catch succeeds in a mixed table, the fish is chosen from the eligible weighted table      |
| Stop on full inventory  | Fishing stops immediately when the player's inventory becomes full, including the tick where the last free slot is consumed by a catch                             |
| Stop on cancel          | Fishing stops immediately if the player clicks away, moves, or cancels                         |
| Stop on invalid state   | Fishing stops if the player no longer has the required tool, bait, or valid target water             |
| Water remains available | Water does not deplete from repeated catches under this model                                  |

### Fishing Action Variables

| Variable                | Meaning                                                                           |
| ----------------------- | --------------------------------------------------------------------------------- |
| Water Tile ID           | The specific water tile or shoreline target being interacted with                 |
| Fishing Method          | The active fishing method, such as net, rod, or harpoon                           |
| Water Type              | The type of water being fished, such as standard water or deep water              |
| Tool Equipped           | The fishing tool currently being used                                             |
| Water-Type Catch Chance | The current overall chance that the method and water type yield a catch on a tick |
| Eligible Fish Table     | The weighted table of fish currently available from the method and water type     |
| Inventory Space Left    | Number of free inventory slots remaining                                          |
| Action Active           | Whether the player is currently fishing                                           |
| Last Attempt Tick       | The tick of the last fishing roll                                                 |


### Fishing Attempt Resolution

| Step | Rule                                                                                                               |
| ---- | ------------------------------------------------------------------------------------------------------------------ |
| 1    | Check that the fishing action is active and the target water is still valid                                        |
| 2    | Check that the player still has the required tool, any extra requirement such as bait, and the required water type |
| 3    | Check that the player has at least one free inventory slot before rolling this tick                                                         |
| 4    | Calculate the current Water-Type Catch Chance using the fishing method and water-type formula                      |
| 5    | Roll once to determine whether the current water yields a catch on this tick                                       |
| 6    | If the catch succeeds, choose the fish from the eligible weighted fish table                                       |
| 7    | Add one fish to inventory and award XP for that fish                                                               |
| 8    | If bait is required and a fish was caught, consume one bait                                                        |
| 9    | If inventory has no free slot after catch resolution or action is cancelled, end the fishing action immediately                                                |

## Fishing Runtime State

### Fishing State Model

| State   | Meaning                                           |
| ------- | ------------------------------------------------- |
| Idle    | The player is not currently fishing               |
| Fishing | The player is actively attempting to catch fish   |
| Stopped | The fishing action has ended and awaits new input |

### Fishing Action Data

| Field                   | Meaning                                                                           |
| ----------------------- | --------------------------------------------------------------------------------- |
| Player ID               | The specific player performing the fishing action                                 |
| Water Tile ID           | The specific water tile or shoreline target being interacted with                 |
| Fishing Method          | The active fishing method being used                                              |
| Water Type              | The type of water currently being fished                                          |
| Tool Type               | The tool currently being used                                                     |
| Extra Requirement       | Any required bait or consumable                                                   |
| Water-Type Catch Chance | The current overall chance that the method and water type yield a catch on a tick |
| Eligible Fish Table     | The weighted table of fish currently available from the method and water type     |
| Last Attempt Tick       | The tick of the last fishing roll                                                 |
| Fishing State           | Whether the player is idle, fishing, or stopped                                   |

### Runtime Rules

| Rule             | Description                                                                                                                             |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Action Creation  | When the player clicks valid water and has at least one free inventory slot, create a fishing action with Fishing State = Fishing                                                |
| Action Update    | On each tick, update Last Attempt Tick and recalculate the current water-type catch chance and eligible fish table based on water type and tool |
| Deep-Water Split | In deep water at level 40+, the eligible fish table depends on whether the player is using a Harpoon or Rune Harpoon |
| Action Success   | On a successful catch, choose one eligible fish, add it to inventory, and award XP                                                      |
| Bait Consumption | If bait is required, consume one bait only when a fish is successfully caught                                                           |
| Action Cancel    | If the player moves, clicks elsewhere, loses the needed tool, lacks bait, or no longer targets valid water, set Fishing State = Stopped |
| Inventory Stop   | If the inventory has no free slot at action start or becomes full during fishing, set Fishing State = Stopped immediately                                                                              |
| Action Removal   | When Fishing State = Stopped, remove the fishing action                                                                                 |

## Economy Role

Fishing creates value by supplying raw fish.

| Output | Use                  |
| ------ | -------------------- |
| Raw Fish | Cooking |
| Raw Fish | Sale to merchants for gold |

### Item Values

| Item      | Category | Buy Value | Sell Value |
| --------- | -------- | --------- | ---------- |
| Raw Shrimp | Resource | 9 | 3 |
| Raw Trout | Resource | 24 | 8 |
| Raw Salmon | Resource | 48 | 16 |
| Raw Tuna | Resource | 84 | 28 |
| Raw Swordfish | Resource | 144 | 48 |
| Bait      | Supply   | 2         | 1          |

### Tool Values

| Tool         | Buy Value | Sell Value |
| ------------ | --------- | ---------- |
| Small Net    | 40        | 10         |
| Fishing Rod  | 120       | 35         |
| Harpoon      | 350       | 110        |
| Rune Harpoon | null      | 2500       |

## Merchant / NPC Structure

### Fishing Teacher

The fishing teacher introduces the basics of fishing. This NPC helps new players understand tools, bait, water requirements, and early fish progression.

**Location:** Near the starter shoreline or dock.

**Associated Quests:** Introductory fishing task. The fishing teacher can provide starter bait early and awards the rune harpoon after the player completes the teacher's fish-delivery quest. If the player later sells or loses the rune harpoon, the fishing teacher will sell a replacement rune harpoon for its normal buy value.

| Item        | Buys | Sells |
| ----------- | ---- | ----- |
| Small Net   | 10   | 40    |
| Fishing Rod | 35   | 120   |
| Bait        | 1    | 2     |
| Rune Harpoon | 2500 | 2500 if replacement is needed |

### Dock Supplier

The dock supplier supports harpoon progression and the higher-tier raw-fish trade.

**Location:** At a larger dock, harbor, or coastal town area.

**Associated Quests:** None.

| Item      | Buys | Sells |
| --------- | ---- | ----- |
| Harpoon   | 110  | 350   |
| Raw Tuna | 28   | See Fish Sales Note |
| Raw Swordfish | 48   | See Fish Sales Note |

### Fishmonger / Cook

This merchant connects fishing to cooking by buying raw fish and selling downstream supplies.

Any raw fish this merchant unlocks through the fishing sell-threshold rule becomes normal merchant stock here at that raw fish's listed buy value.

**Location:** In a market, tavern, or cooking-adjacent part of town.

**Associated Quests:** None by default.

| Item      | Buys | Sells |
| --------- | ---- | ----- |
| Raw Tuna | 28   | See Fish Sales Note |
| Raw Swordfish | 48   | See Fish Sales Note |

### General Store

The general store buys everything at half price.

### Rune Harpoon Recovery Note

Rune Harpoon is not normal shop stock.

The first rune harpoon is obtained from the fishing teacher quest reward.

If the player sells or loses that rune harpoon, the fishing teacher becomes the dedicated replacement source and will sell one replacement rune harpoon for its normal buy value.

### Fish Sales Note

Raw fish are not sold by default through fishing merchants under the base model.

A fishing merchant begins selling a specific raw fish as normal merchant stock only after the player has sold 50 of that exact raw fish type to that exact merchant.

Once unlocked, that raw fish is treated as a normal stockable merchant item for that merchant and can be bought from that merchant at the raw fish's listed buy value.

This is not limited to temporary sold-back inventory. The unlock adds that raw fish to that merchant's normal fish stock for future sale.

This unlock is tracked separately for each raw fish type and each merchant.

Fishing is the canonical owner of raw-fish merchant stock unlock and resale behavior. Cooking may reference raw fish as inputs, but it does not define or override raw-fish merchant stock rules.

## Training Location Structure

| Water / Area Type                  | Role                         |
| ---------------------------------- | ---------------------------- |
| Starter shoreline or pond          | Entry-level shrimp training  |
| River or standard shoreline        | Raw Trout and salmon progression |
| Harbor, dock, or standard coast    | Raw Tuna training                |
| Deep-water coastline or dark water | Raw Tuna and swordfish progression |
| Mixed fishing town                 | Banking and selling support  |

## Dependencies

| Dependency        | Purpose                       |
| ----------------- | ----------------------------- |
| Cooking           | Fish sink                     |
| Shops and economy | Selling fish and buying tools |
| Quest progression | Area and content gating       |

## Possible Rules

| Rule                                                           | Value |
| -------------------------------------------------------------- | ----- |
| Fishing cannot start without at least one free inventory slot  | True  |
| Fishing continues until inventory is full or cancelled         | True  |
| Fishing rolls once per tick while active                       | True  |
| Fishing method catch chance starts at 15% when unlocked        | True  |
| Fishing method catch chance increases with levels above unlock | True  |
| Water does not deplete under the base model                    | True  |
| Mixed fishing tables use weighted fish selection after success | True  |
| Bait is consumed only when rod fishing succeeds                | True  |
| Rune harpoon sold in shops                                     | False |
| Rune harpoon awarded by fishing teacher quest                  | True  |
| Rune harpoon replacement sold only by fishing teacher after the first one is earned, sold, or lost | True  |
| General stores buy everything for half price                   | True  |
| Specialty merchants focus on fishing-related goods             | True  |
| Fish are not sold by default by fishing merchants              | True  |
| Merchant fish sales unlock after 50 of that fish are sold to that merchant | True  |
| Unlocked fish become normal merchant stock at listed buy value rather than temporary sold-back inventory | True  |
| Merchant fish-stock unlocks are tracked separately per raw fish type and per merchant | True  |
| Fishing is the canonical owner of raw-fish merchant stock unlock and resale behavior | True  |

## Item List

| Item         | Category | Required Level | Buy Value | Sell Value | Notes                                               |
| ------------ | -------- | -------------- | --------- | ---------- | --------------------------------------------------- |
| Small Net    | Tool     | 1              | 40        | 10         | Entry-level fishing tool                            |
| Fishing Rod  | Tool     | 10             | 120       | 35         | Used for trout and salmon                           |
| Harpoon      | Tool     | 30             | 350       | 110        | Used for tuna fishing and mixed deep-water fishing  |
| Rune Harpoon | Tool     | 40             | null      | 2500       | First obtained from the fishing teacher quest; not sold by shops by default; if sold or lost, replacement copies are sold only by the fishing teacher for normal buy value; used for swordfish-only deep-water fishing |
| Bait         | Supply   | null           | 2         | 1          | Required for rod fishing                            |
| Raw Shrimp | Resource | 1 | 9 | 3 | Entry-level fish                                    |
| Raw Trout | Resource | 10 | 24 | 8 | Early rod-caught fish                               |
| Raw Salmon | Resource | 20 | 48 | 16 | Mid-tier rod-caught fish                            |
| Raw Tuna | Resource | 30 | 84 | 28 | Higher-value harpoon catch                          |
| Raw Swordfish | Resource | 40 | 144 | 48 | High-value late-band catch                          |





