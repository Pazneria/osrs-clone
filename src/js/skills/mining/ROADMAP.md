# Mining Roadmap

## Canonical Runtime Source

All mechanic/value tables in this roadmap are synchronized against `src/js/skills/specs.js` (version `2026.03.m6`).
Where a skill defers market values to item data, value rows mirror `src/js/content/item-catalog.js`.

## Purpose

Mining is the gathering skill for extracting ores, clay, and uncut gems from rock nodes.

The player mines raw materials that feed into other systems, especially smithing, crafting, and runecrafting.

## Core Progression

This table defines the current normal 1-40 mining rock progression only.

Off-band mining items can still exist in the item economy, merchant ecosystem, quest content, or later-world content without appearing in this main-band rock table.

| Rock          | Required Level |
| ------------- | -------------- |
| Clay Rock     | 1              |
| Copper Rock   | 1              |
| Tin Rock      | 1              |
| Rune Essence Rock | 1          |
| Iron Rock     | 10             |
| Coal Rock     | 20             |
| Silver Rock   | 30             |
| Sapphire Rock | 30             |
| Gold Rock     | 40             |
| Emerald Rock  | 40             |

## Tools

| Pickaxe         | Required Level | Tool Power | Speed Bonus Ticks | Buy Value | Sell Value |
| --------------- | -------------- | ---------- | ----------------- | --------- | ---------- |
| Bronze Pickaxe  | 1              | 4          | 0                 | 40        | 10         |
| Iron Pickaxe    | 1              | 6          | 1                 | 120       | 35         |
| Steel Pickaxe   | 10             | 10         | 2                 | 350       | 110        |
| Mithril Pickaxe | 20             | 15         | 3                 | 900       | 300        |
| Adamant Pickaxe | 30             | 21         | 4                 | 2200      | 750        |
| Rune Pickaxe    | 40             | 28         | 5                 | null      | 2500       |

## Mechanics

### Core Equations

| Equation                | Formula                                                                                     | Purpose                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Success Score           | Success Score = Mining Level + Tool Power                                                   | Combines player level and pickaxe strength into one mining power value |
| Success Chance          | Success Chance = Success Score / (Success Score + Rock Difficulty)                          | Determines the probability that a mining attempt succeeds              |
| Attempt Interval        | Attempt Interval Ticks = max(Minimum Attempt Ticks, Base Attempt Ticks - Speed Bonus Ticks) | Determines how many ticks pass between mining attempts                 |
| Expected Yield per Tick | Expected Yield per Tick = Success Chance / Attempt Interval Ticks                           | Estimates average mining output rate                                   |
| Expected XP per Tick    | Expected XP per Tick = Expected Yield per Tick x XP per Success                             | Estimates average experience gain rate                                 |
| Expected Gold per Tick  | Expected Gold per Tick = Expected Yield per Tick x Item Sell Value                          | Estimates average gold gain rate from selling mined items              |

### Equation Variables

| Variable                | Meaning                                                                 |
| ----------------------- | ----------------------------------------------------------------------- |
| Mining Level            | The player's current mining level                                       |
| Tool Power              | The pickaxe's strength contribution to success rate                     |
| Rock Difficulty         | The resistance value of the target rock                                 |
| Base Attempt Ticks      | The default number of ticks between mining attempts before tool bonuses |
| Speed Bonus Ticks       | The number of ticks removed from the attempt interval by the pickaxe    |
| Minimum Attempt Ticks   | The minimum allowed number of ticks between attempts                    |
| XP per Success          | The experience granted for one successful mining action                 |
| Item Sell Value         | The sell value of the item produced by the rock                         |
| Attempt Interval Ticks  | Ticks between mining attempts                                           |
| Success Score           | Combined level and tool strength                                        |
| Success Chance          | Probability of success on each attempt                                  |
| Expected Yield per Tick | Average mining output rate                                              |
| Expected XP per Tick    | Average experience gain rate                                            |
| Expected Gold per Tick  | Average gold gain rate                                                  |

### Global Constants

| Constant              | Value |
| --------------------- | ----- |
| Tick Duration Seconds | 0.6   |
| Base Attempt Ticks    | 6     |
| Minimum Attempt Ticks | 1     |

### Rock Stats

| Rock          | Required Level | XP per Success | Rock Difficulty | Minimum Rocks | Maximum Rocks | Depletion Chance | Respawn Ticks |
| ------------- | -------------- | -------------- | --------------- | ------------- | ------------- | ---------------- | ------------- |
| Clay Rock     | 1              | 8              | 6               | 1             | 1             | 1.00             | 5             |
| Copper Rock   | 1              | 10             | 8               | 1             | 1             | 1.00             | 6             |
| Tin Rock      | 1              | 10             | 8               | 1             | 1             | 1.00             | 6             |
| Rune Essence Rock | 1          | 2              | 6               | null          | null          | 0.00             | 0             |
| Iron Rock     | 10             | 18             | 16              | 1             | 3             | 0.50             | 9             |
| Coal Rock     | 20             | 28             | 26              | 2             | 5             | 0.35             | 12            |
| Silver Rock   | 30             | 40             | 36              | 2             | 5             | 0.30             | 15            |
| Sapphire Rock | 30             | 52             | 42              | 2             | 4             | 0.35             | 36            |
| Gold Rock     | 40             | 60             | 50              | 2             | 5             | 0.25             | 21            |
| Emerald Rock  | 40             | 72             | 56              | 2             | 4             | 0.30             | 48            |

### Attempt Timing Examples

**Attempt Interval Ticks = max(Minimum Attempt Ticks, Base Attempt Ticks - Speed Bonus Ticks)**

| Pickaxe         | Calculation   | Attempt Interval Ticks |
| --------------- | ------------- | ---------------------- |
| Bronze Pickaxe  | max(1, 6 - 0) | 6                      |
| Iron Pickaxe    | max(1, 6 - 1) | 5                      |
| Steel Pickaxe   | max(1, 6 - 2) | 4                      |
| Mithril Pickaxe | max(1, 6 - 3) | 3                      |
| Adamant Pickaxe | max(1, 6 - 4) | 2                      |
| Rune Pickaxe    | max(1, 6 - 5) | 1                      |

### Standardized Success Chance Comparison

**Using Mining Level = 40 and Pickaxe Used = Rune Pickaxe for every rock**

| Rock          | Success Score | Calculation    | Success Chance |
| ------------- | ------------- | -------------- | -------------- |
| Clay Rock     | 68            | 68 / (68 + 6)  | 91.89%         |
| Copper Rock   | 68            | 68 / (68 + 8)  | 89.47%         |
| Tin Rock      | 68            | 68 / (68 + 8)  | 89.47%         |
| Rune Essence Rock | 68        | 68 / (68 + 6)  | 91.89%         |
| Iron Rock     | 68            | 68 / (68 + 16) | 80.95%         |
| Coal Rock     | 68            | 68 / (68 + 26) | 72.34%         |
| Silver Rock   | 68            | 68 / (68 + 36) | 65.38%         |
| Sapphire Rock | 68            | 68 / (68 + 42) | 61.82%         |
| Gold Rock     | 68            | 68 / (68 + 50) | 57.63%         |
| Emerald Rock  | 68            | 68 / (68 + 56) | 54.84%         |

### Standardized Active Mining Output Comparison

**Using Mining Level = 40 and Pickaxe Used = Rune Pickaxe for every rock**

These active output values measure mining performance while the player is actively mining an available rock and do not include depletion downtime or respawn delay.

| Rock          | Expected Yield per Tick | Expected XP per Tick | Expected Gold per Tick |
| ------------- | ----------------------- | -------------------- | ---------------------- |
| Clay Rock     | 0.9189                  | 7.3512               | 0.9189                 |
| Copper Rock   | 0.8947                  | 8.9470               | 2.6841                 |
| Tin Rock      | 0.8947                  | 8.9470               | 2.6841                 |
| Rune Essence Rock | 0.9189              | 1.8378               | 3.6756                 |
| Iron Rock     | 0.8095                  | 14.5710              | 5.6665                 |
| Coal Rock     | 0.7234                  | 20.2552              | 8.6808                 |
| Silver Rock   | 0.6538                  | 26.1520              | 11.7684                |
| Sapphire Rock | 0.6182                  | 32.1464              | 27.8190                |
| Gold Rock     | 0.5763                  | 34.5780              | 16.1364                |
| Emerald Rock  | 0.5484                  | 39.4848              | 46.6140                |


## Inventory Capacity Rules

| Rule | Description |
| ---- | ----------- |
| Start requires capacity | Mining can begin only if at least one inventory slot can accept the target output item. |
| Full inventory start block | If inventory is already full for the target output, mining does not begin. |
| Immediate full stop | If a successful mine fills the last free slot, mining stops immediately after that success tick. |
| No overfill attempts | Mining does not continue into an extra attempt tick once no further output can fit. |

## Depletion Model

### Core Depletion Rules

| Rock Type      | Depletion Behavior                                                             |
| -------------- | ------------------------------------------------------------------------------ |
| Fixed rocks    | Always deplete after the successful rocks guaranteed by the rock are exhausted |
| Variable rocks | Deplete after reaching the minimum rocks and then passing a depletion roll     |
| Persistent rocks | Never deplete and remain continuously available |

### Rock Session Variables

| Variable          | Meaning                                                                     |
| ----------------- | --------------------------------------------------------------------------- |
| Successful Yields | Number of successful yields produced from the current rock session          |
| Minimum Yields    | Guaranteed successful yields before depletion is allowed                    |
| Maximum Yields    | Hard cap on successful yields from the current rock session                 |
| Depletion Chance  | Chance that the rock depletes after a success once the minimum has been met |

### Depletion Equations

| Equation               | Formula                                                                                                    | Purpose                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Yield Increment        | On success: Successful Yields = Successful Yields + 1                                                      | Tracks how many yields have been mined from the current session |
| Forced Depletion Check | If Successful Yields >= Maximum Yields, the rock depletes immediately                                      | Enforces the hard cap on each rock session                     |
| Random Depletion Check | If Successful Yields >= Minimum Yields, roll against Depletion Chance after each successful mining attempt | Allows variable rock lifetimes after the guaranteed minimum    |
| Depletion Trigger      | Rock depletes if the forced depletion check passes or the random depletion check succeeds                  | Determines when a rock becomes unavailable                     |
| Persistent Rock Rule   | If the rock is persistent, skip depletion checks entirely                                          | Defines how non-depleting rocks behave |

### Depletion Stats

| Rock          | Minimum Yields | Maximum Yields | Depletion Chance | Behavior Summary                                               |
| ------------- | -------------- | -------------- | ---------------- | -------------------------------------------------------------- |
| Clay Rock     | 1              | 1              | 1.00             | Always depletes after one success                              |
| Copper Rock   | 1              | 1              | 1.00             | Always depletes after one success                              |
| Tin Rock      | 1              | 1              | 1.00             | Always depletes after one success                              |
| Rune Essence Rock | null       | null           | 0.00             | Never depletes                                              |
| Iron Rock     | 1              | 3              | 0.50             | Guaranteed one yield, then variable depletion, capped at three |
| Coal Rock     | 2              | 5              | 0.35             | Guaranteed two yields, then variable depletion, capped at five |
| Silver Rock   | 2              | 5              | 0.30             | Guaranteed two yields, then variable depletion, capped at five |
| Sapphire Rock | 2              | 4              | 0.35             | Guaranteed two yields, then variable depletion, capped at four |
| Gold Rock     | 2              | 5              | 0.25             | Guaranteed two yields, then variable depletion, capped at five |
| Emerald Rock  | 2              | 4              | 0.30             | Guaranteed two yields, then variable depletion, capped at four |

## Rock Runtime State

### Rock State Model

| State     | Meaning                             |
| --------- | ----------------------------------- |
| Available | The rock can currently be mined     |
| Depleted  | The rock is temporarily unavailable |

### Rock Session Data

| Field                 | Meaning                                                             |
| --------------------- | ------------------------------------------------------------------- |
| Rock Node ID          | The specific world rock being interacted with                       |
| Item Type             | What this rock produces                                             |
| Successful Yields     | Number of yields mined from the current session                     |
| Last Interaction Tick | The tick of the last mining attempt against this rock               |
| Rock State            | Whether the rock is available or depleted                           |
| Respawn At Tick       | The game tick when the rock becomes available again after depletion |

### Session Rules

| Rule             | Description                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Session Creation | When the player first attempts to mine an available rock, create a rock session with Successful Yields = 0                                |
| Session Update   | Update Last Interaction Tick on each mining attempt                                                                                        |
| Session Expiry   | If Current Tick - Last Interaction Tick >= 50 and the rock is not depleted, remove the rock session and discard partial depletion progress |
| Rock Depletion   | When the rock depletes, remove the rock session, set Rock State to Depleted, and set Respawn At Tick = Current Tick + Respawn Ticks       |
| Rock Respawn     | When Current Tick >= Respawn At Tick, set Rock State to Available                                                                          |
| Persistent Rocks | Rune essence rocks never enter the depleted state and do not use respawn timing |

## Economy Role

Mining creates value by supplying mined items such as ores, clay, uncut gems, and rune essence.

| Output          | Use                  |
| --------------- | -------------------- |
| Clay            | Crafting             |
| Copper and Tin  | Smithing             |
| Iron and Coal   | Smithing             |
| Silver and Gold | Crafting             |
| Uncut Gems      | Crafting             |
| Rune Essence    | Runecrafting         |
| All mined items | Direct sale for gold |

### Item Values

This table includes both current main-band mining outputs and valid off-band mining items that already exist in the broader item economy.

| Item       | Category | Buy Value | Sell Value |
| ---------- | -------- | --------- | ---------- |
| Clay       | Resource | 4         | 1          |
| Copper Ore | Resource | 8         | 3          |
| Tin Ore    | Resource | 8         | 3          |
| Iron Ore   | Resource | 18        | 7          |
| Coal       | Resource | 30        | 12         |
| Silver Ore | Resource | 45        | 18         |
| Uncut Sapphire | Gem      | 50        | 16         |
| Gold Ore       | Resource | 70        | 28         |
| Uncut Emerald  | Gem      | 90        | 30         |
| Rune Essence   | Resource | 12        | 4          |
| Uncut Ruby     | Gem      | 20        | 6          |
| Uncut Diamond  | Gem      | 150       | 50         |

### Pickaxe Values

| Pickaxe         | Buy Value | Sell Value |
| --------------- | --------- | ---------- |
| Bronze Pickaxe  | 40        | 10         |
| Iron Pickaxe    | 120       | 35         |
| Steel Pickaxe   | 350       | 110        |
| Mithril Pickaxe | 900       | 300        |
| Adamant Pickaxe | 2200      | 750        |
| Rune Pickaxe    | null      | 2500       |

## Merchant / NPC Structure

### Borin Ironvein (Dwarf)

Borin teaches the basics of mining and smithing. He helps new players understand ores, pickaxes, and early metal progression.

**Location:** Near the furnace in the courtyard of the main castle.

**Associated Quests:** None.

| Item           | Buys | Sells |
| -------------- | ---- | ----- |
| Bronze Pickaxe | 10   | 40    |
| Iron Pickaxe   | 35   | 120   |
| Steel Pickaxe  | 110  | 350   |
| Copper Ore     | 3    | 8     |
| Tin Ore        | 3    | 8     |
| Iron Ore       | 7    | 18    |
| Coal           | 12   | 30    |
| Mithril Ore    | 60   | 120   |

### Thrain Deepforge (Dwarf)

Thrain is an experienced master-smith who deals in advanced metals and high-end equipment. Players come to him when they are ready for expensive progression. In the mining spec, his role is to carry the later off-band ore stock for adamant and rune without making those ores part of the current normal 1-40 rock progression.

**Location:** Deep in a separate smithing district or forge workshop away from the main castle.

**Associated Quests:** Locked behind Thrain's Quest before he will sell rune-related materials.

| Item            | Buys | Sells |
| --------------- | ---- | ----- |
| Mithril Pickaxe | 300  | 900   |
| Adamant Pickaxe | 750  | 2200  |
| Adamant Ore     | 150  | 300   |
| Rune Ore        | 600  | 1200  |

### Elira Gemhand (Jeweler)

Elira is the town jeweler and the mining-side specialty NPC for jewelry raw materials. In the mining loop, she handles precious ores, uncut gems, and access to the gem mine. She starts the Gem Mine Quest and also begins the Mould Making Quest as a cross-spec handoff, while mould creation and mould unlock progression remain owned by crafting.

**Location:** In the town jewelry workshop.

**Associated Quests:** Gem Mine Quest; Mould Making Quest.

| Item       | Buys | Sells |
| ---------- | ---- | ----- |
| Silver Ore      | 18   | 45    |
| Gold Ore        | 28   | 70    |
| Uncut Sapphire  | 16   | 50    |
| Uncut Emerald   | 30   | 90    |
| Uncut Ruby      | 6    | 20    |
| Uncut Diamond   | 50   | 150   |

### General Store

The general store buys everything at half price.

## Training Location Structure

| Location Type                     | Role                              |
| --------------------------------- | --------------------------------- |
| Starter mine near the main castle | Entry-level clay, copper, and tin |
| Early outdoor iron mine           | First major progression zone      |
| Deeper coal mine                  | Mid-game ore training area        |
| Silver and gold extraction area   | Crafting-adjacent ore zone        |
| Quest-locked gem mine             | Uncut gem gathering area          |
| Rune essence mine                 | Persistent rune essence gathering |

## Dependencies

| Dependency        | Purpose                            |
| ----------------- | ---------------------------------- |
| Smithing          | Ore sink and pickaxe progression   |
| Crafting          | Clay, silver, gold, and gem sink   |
| Runecrafting      | Primary sink for rune essence      |
| Shops and economy | Selling and tool acquisition       |
| Quest progression | Area and content gating            |

## Possible Rules

| Rule                                                           | Value |
| -------------------------------------------------------------- | ----- |
| Bronze and iron pickaxes usable at level 1                     | True  |
| Rune pickaxe sold in shops                                     | False |
| Gem mine access locked behind the Gem Mine Quest                | True  |
| Mithril, adamant, and rune ore outside normal 1-40 mining band | True  |
| Ruby and diamond outside normal 1-40 mining band               | True  |
| Off-band mining items can still exist in item lists and merchant tables | True  |
| General stores buy everything for half price                   | True  |
| Specialty merchants focus on mining-related goods              | True  |
| Rune essence rocks are persistent and never deplete            | True  |
| Elira starts the Gem Mine Quest                                | True  |
| Elira begins the Mould Making Quest, but crafting owns mould progression | True  |

## Item List

This item list includes both current main-band mining outputs and valid off-band mining items that are part of the broader mining economy but not currently represented in the normal 1-40 rock progression tables.


| Item            | Category | Required Level | Buy Value | Sell Value | Notes                               |
| --------------- | -------- | -------------- | --------- | ---------- | ----------------------------------- |
| Bronze Pickaxe  | Pickaxe  | 1              | 40        | 10         | Entry-level mining pickaxe          |
| Iron Pickaxe    | Pickaxe  | 1              | 120       | 35         | Early upgrade pickaxe               |
| Steel Pickaxe   | Pickaxe  | 10             | 350       | 110        | Mid-tier pickaxe                    |
| Mithril Pickaxe | Pickaxe  | 20             | 900       | 300        | Strong upgrade pickaxe              |
| Adamant Pickaxe | Pickaxe  | 30             | 2200      | 750        | High-tier pickaxe                   |
| Rune Pickaxe    | Pickaxe  | 40             | null      | 2500       | Not sold in shops                   |
| Clay            | Resource | 1              | 4         | 1          | Crafting material                   |
| Copper Ore      | Resource | 1              | 8         | 3          | Bronze smithing material            |
| Tin Ore         | Resource | 1              | 8         | 3          | Bronze smithing material            |
| Iron Ore        | Resource | 10             | 18        | 7          | Iron smithing material              |
| Coal            | Resource | 20             | 30        | 12         | Fuel and steel progression material |
| Silver Ore      | Resource | 30             | 45        | 18         | Jewelry material                    |
| Uncut Sapphire  | Gem      | 30             | 50        | 16         | Early uncut gem progression         |
| Gold Ore        | Resource | 40             | 70        | 28         | Jewelry material                    |
| Uncut Emerald   | Gem      | 40             | 90        | 30         | Mid-tier uncut gem progression      |
| Rune Essence    | Resource | 1              | 12        | 4          | Used for runecrafting and mined from persistent rocks |
| Uncut Ruby      | Gem      | null           | 20        | 6          | Higher-tier uncut gem outside normal band |
| Uncut Diamond   | Gem      | null           | 150       | 50         | Higher-tier uncut gem outside normal band |
| Mithril Ore     | Resource | null           | 120       | 60         | Outside normal 1-40 mining band     |
| Adamant Ore     | Resource | null           | 300       | 150        | Outside normal 1-40 mining band     |
| Rune Ore        | Resource | null           | 1200      | 600        | Outside normal 1-40 mining band     |





