# Woodcutting Roadmap

## Purpose

Woodcutting is the gathering skill for harvesting logs from tree nodes.

The player cuts raw materials that feed into other systems, especially firemaking and fletching.

## Core Progression

| Tree        | Required Level |
| ----------- | -------------- |
| Normal Tree | 1              |
| Oak Tree    | 10             |
| Willow Tree | 20             |
| Maple Tree  | 30             |
| Yew Tree    | 40             |

## Tools

| Axe         | Required Level | Tool Power | Speed Bonus Ticks | Buy Value | Sell Value |
| ----------- | -------------- | ---------- | ----------------- | --------- | ---------- |
| Bronze Axe  | 1              | 4          | 0                 | 40        | 10         |
| Iron Axe    | 1              | 6          | 1                 | 120       | 35         |
| Steel Axe   | 10             | 10         | 2                 | 350       | 110        |
| Mithril Axe | 20             | 15         | 3                 | 900       | 300        |
| Adamant Axe | 30             | 21         | 4                 | 2200      | 750        |
| Rune Axe    | 40             | 28         | 5                 | null      | 2500       |

## Mechanics

### Core Equations

| Equation               | Formula                                                                                      | Purpose                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Success Score          | Success Score = Woodcutting Level + Tool Power                                               | Combines player level and axe strength into one woodcutting power value    |
| Success Chance         | Success Chance = Success Score / (Success Score + Tree Difficulty)                           | Determines the probability that a chopping attempt succeeds                |
| Attempt Interval       | Attempt Interval Ticks = max(Minimum Attempt Ticks, Base Attempt Ticks - Speed Bonus Ticks) | Determines how many ticks pass between chopping attempts                  |
| Expected Logs per Tick| Expected Logs per Tick = Success Chance / Attempt Interval Ticks                            | Estimates average woodcutting output rate                                  |
| Expected XP per Tick   | Expected XP per Tick = Expected Logs per Tick x XP per Success                              | Estimates average experience gain rate                                     |
| Expected Gold per Tick | Expected Gold per Tick = Expected Logs per Tick x Item Sell Value                           | Estimates average gold gain rate from selling chopped logs                 |

### Equation Variables

| Variable               | Meaning                                                                      |
| ---------------------- | ---------------------------------------------------------------------------- |
| Woodcutting Level      | The player's current woodcutting level                                       |
| Tool Power             | The axe's strength contribution to success rate                              |
| Tree Difficulty        | The resistance value of the target tree                                      |
| Base Attempt Ticks     | The default number of ticks between chopping attempts before tool bonuses    |
| Speed Bonus Ticks      | The number of ticks removed from the attempt interval by the axe             |
| Minimum Attempt Ticks  | The minimum allowed number of ticks between attempts                         |
| XP per Success         | The experience granted for one successful chopping action                    |
| Item Sell Value        | The sell value of the logs produced by the tree                              |
| Attempt Interval Ticks | Ticks between chop attempts                                                  |
| Success Score          | Combined level and tool strength                                             |
| Success Chance         | Probability of success on each attempt                                       |
| Expected Logs per Tick| Average woodcutting output rate                                              |
| Expected XP per Tick   | Average experience gain rate                                                 |
| Expected Gold per Tick | Average gold gain rate                                                       |

### Global Constants

| Constant              | Value |
| --------------------- | ----- |
| Tick Duration Seconds | 0.6   |
| Base Attempt Ticks    | 6     |
| Minimum Attempt Ticks | 1     |

### Tree Stats

| Tree        | Required Level | XP per Success | Tree Difficulty | Minimum Logs | Maximum Logs | Depletion Chance | Respawn Ticks |
| ----------- | -------------- | -------------- | --------------- | ------------- | ------------- | ---------------- | ------------- |
| Normal Tree | 1              | 10             | 8               | 1            | 1            | 1.00             | 13            |
| Oak Tree    | 10             | 18             | 16              | 3            | 9            | 0.35             | 20            |
| Willow Tree | 20             | 28             | 26              | 4             | 11            | 0.30             | 27            |
| Maple Tree  | 30             | 42             | 38              | 5             | 13            | 0.25             | 37            |
| Yew Tree    | 40             | 65             | 54              | 6             | 18            | 0.20             | 50            |

### Attempt Timing Examples

**Attempt Interval Ticks = max(Minimum Attempt Ticks, Base Attempt Ticks - Speed Bonus Ticks)**

| Axe         | Calculation   | Attempt Interval Ticks |
| ----------- | ------------- | ---------------------- |
| Bronze Axe  | max(1, 6 - 0) | 6                      |
| Iron Axe    | max(1, 6 - 1) | 5                      |
| Steel Axe   | max(1, 6 - 2) | 4                      |
| Mithril Axe | max(1, 6 - 3) | 3                      |
| Adamant Axe | max(1, 6 - 4) | 2                      |
| Rune Axe    | max(1, 6 - 5) | 1                      |

### Standardized Success Chance Comparison

**Using Woodcutting Level = 40 and Axe Used = Rune Axe for every tree**

| Tree        | Success Score | Calculation    | Success Chance |
| ----------- | ------------- | -------------- | -------------- |
| Normal Tree | 68            | 68 / (68 + 8)  | 89.47%         |
| Oak Tree    | 68            | 68 / (68 + 16) | 80.95%         |
| Willow Tree | 68            | 68 / (68 + 26) | 72.34%         |
| Maple Tree  | 68            | 68 / (68 + 38) | 64.15%         |
| Yew Tree    | 68            | 68 / (68 + 54) | 55.74%         |

### Standardized Active Woodcutting Output Comparison

**Using Woodcutting Level = 40 and Axe Used = Rune Axe for every tree**

These active output values measure woodcutting performance while the player is actively chopping an available tree and do not include depletion downtime or respawn delay.

| Tree        | Expected Logs per Tick | Expected XP per Tick | Expected Gold per Tick |
| ----------- | ----------------------- | -------------------- | ---------------------- |
| Normal Tree | 0.8947                  | 8.9470               | 1.7894                 |
| Oak Tree    | 0.8095                  | 14.5710              | 4.8570                 |
| Willow Tree | 0.7234                  | 20.2552              | 10.1276                |
| Maple Tree  | 0.6415                  | 26.9430              | 20.5280                |
| Yew Tree    | 0.5574                  | 36.2310              | 40.1328                |

## Depletion Model

### Core Depletion Rules

| Tree Type       | Depletion Behavior                                                             |
| --------------- | ------------------------------------------------------------------------------ |
| Fixed trees     | Always deplete after the successful logs guaranteed by the tree are exhausted |
| Variable trees  | Deplete after reaching the minimum logs and then passing a depletion roll     |

### Tree Session Variables

| Variable          | Meaning                                                                     |
| ----------------- | --------------------------------------------------------------------------- |
| Successful Logs | Number of successful logs produced from the current tree session          |
| Minimum Logs    | Guaranteed successful logs before depletion is allowed                    |
| Maximum Logs    | Hard cap on successful logs from the current tree session                 |
| Depletion Chance  | Chance that the tree depletes after a success once the minimum has been met |

### Depletion Equations

| Equation               | Formula                                                                                                    | Purpose                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Log Increment        | On success: Successful Logs = Successful Logs + 1                                                      | Tracks how many logs have been chopped from the current tree session |
| Forced Depletion Check | If Successful Logs >= Maximum Logs, the tree depletes immediately                                      | Enforces the hard cap on each tree session                        |
| Random Depletion Check | If Successful Logs >= Minimum Logs, roll against Depletion Chance after each successful chopping attempt | Allows variable tree lifetimes after the guaranteed minimum       |
| Depletion Trigger      | Tree depletes if the forced depletion check passes or the random depletion check succeeds                  | Determines when a tree becomes unavailable                        |

### Depletion Stats

| Tree        | Minimum Logs | Maximum Logs | Depletion Chance | Behavior Summary                                                |
| ----------- | -------------- | -------------- | ---------------- | --------------------------------------------------------------- |
| Normal Tree | 1              | 1              | 1.00             | Always depletes after one log                               |
| Oak Tree    | 3              | 9              | 0.35             | Guaranteed three logs, then variable depletion, capped at nine |
| Willow Tree | 4              | 11             | 0.30             | Guaranteed four logs, then variable depletion, capped at eleven |
| Maple Tree  | 5              | 13             | 0.25             | Guaranteed five logs, then variable depletion, capped at thirteen |
| Yew Tree    | 6              | 18             | 0.20             | Guaranteed six logs, then variable depletion, capped at eighteen |

## Tree Runtime State

### Tree State Model

| State     | Meaning                            |
| --------- | ---------------------------------- |
| Available | The tree can currently be chopped  |
| Depleted  | The tree is temporarily unavailable |

### Tree Session Data

| Field                 | Meaning                                                             |
| --------------------- | ------------------------------------------------------------------- |
| Tree Node ID          | The specific world tree being interacted with                       |
| Item Type             | What logs this tree produces                                             |
| Successful Logs     | Number of logs chopped from the current tree session                   |
| Last Interaction Tick | The tick of the last chopping attempt against this tree             |
| Tree State            | Whether the tree is available or depleted                           |
| Respawn At Tick       | The game tick when the tree becomes available again after depletion |

### Session Rules

| Rule             | Description                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Session Creation | When the player first attempts to chop an available tree, create a tree session with Successful Logs = 0                                |
| Session Update   | Update Last Interaction Tick on each chopping attempt                                                                                      |
| Session Expiry   | If Current Tick - Last Interaction Tick >= 50 and the tree is not depleted, remove the tree session and discard partial depletion progress |
| Tree Depletion   | When the tree depletes, remove the tree session, set Tree State to Depleted, and set Respawn At Tick = Current Tick + Respawn Ticks       |
| Tree Respawn     | When Current Tick >= Respawn At Tick, set Tree State to Available                                                                          |

## Economy Role

Woodcutting creates value by supplying logs.

| Output | Use                  |
| ------ | -------------------- |
| Logs   | Firemaking           |
| Logs   | Fletching            |
| Logs   | Direct sale for gold |

### Item Values

| Item        | Category | Buy Value | Sell Value |
| ----------- | -------- | --------- | ---------- |
| Normal Logs | Resource | 6         | 2          |
| Oak Logs    | Resource | 16        | 6          |
| Willow Logs | Resource | 36        | 14         |
| Maple Logs  | Resource | 80        | 32         |
| Yew Logs    | Resource | 180       | 72         |

### Axe Values

| Axe         | Buy Value | Sell Value |
| ----------- | --------- | ---------- |
| Bronze Axe  | 40        | 10         |
| Iron Axe    | 120       | 35         |
| Steel Axe   | 350       | 110        |
| Mithril Axe | 900       | 300        |
| Adamant Axe | 2200      | 750        |
| Rune Axe    | null      | 2500       |

## Merchant / NPC Structure

### Forester Teacher

The forester teacher introduces the basics of woodcutting. This NPC helps new players understand trees, axes, and early log progression.

**Location:** Near the starter area or close to the town edge.

**Associated Quests:** None.

| Item       | Buys | Sells |
| ---------- | ---- | ----- |
| Bronze Axe | 10   | 40    |
| Iron Axe   | 35   | 120   |
| Steel Axe  | 110  | 350   |
| Normal Logs| 2    | 6     |
| Oak Logs   | 6    | 16    |

### Advanced Woodsman

The advanced woodsman handles better axes and higher-tier log trading. Players come here when they are ready for stronger tools and more valuable woodcutting progression.

**Location:** Deeper in the world, closer to stronger tree zones.

**Associated Quests:** Can be tied to area access or later progression if needed.

| Item         | Buys | Sells |
| ------------ | ---- | ----- |
| Mithril Axe  | 300  | 900   |
| Adamant Axe  | 750  | 2200  |
| Willow Logs  | 14   | 36    |
| Maple Logs   | 32   | 80    |
| Yew Logs     | 72   | 180   |

### Fletching Supplier

This merchant connects woodcutting to fletching by buying logs and selling downstream supplies.

**Location:** In a crafting or ranged-adjacent part of town.

**Associated Quests:** None by default.

| Item        | Buys | Sells |
| ----------- | ---- | ----- |
| Normal Logs | 2    | 6     |
| Oak Logs    | 6    | 16    |
| Willow Logs | 14   | 36    |
| Maple Logs  | 32   | 80    |
| Yew Logs    | 72   | 180   |

### General Store

The general store buys everything at half price.

## Training Location Structure

| Location Type                                 | Role                      |
| --------------------------------------------- | ------------------------- |
| Starter trees close to town                   | Entry-level training      |
| Oak area in an early forest                   | Early upgrade zone        |
| Willows near water or a village edge          | Mid-game training area    |
| Maples in a more established woodland zone    | Higher-tier balanced area |
| Yews in a more dangerous or restricted forest | Valuable late-band area   |

## Dependencies

| Dependency        | Purpose                        |
| ----------------- | ------------------------------ |
| Firemaking        | Log sink                       |
| Fletching         | Log sink                       |
| Mining            | Ore source for axe progression |
| Smithing          | Axe progression                |
| Shops and economy | Selling and tool acquisition   |
| Quest progression | Area and content gating        |

## Possible Rules

| Rule                                                         | Value |
| ------------------------------------------------------------ | ----- |
| Bronze and iron axes usable at level 1                       | True  |
| Rune axe sold in shops                                       | False |
| Higher-tier trees may be area-locked or quest-locked         | True  |
| General stores buy everything for half price                 | True  |
| Specialty merchants focus on woodcutting-related items       | True  |

## Item List

| Item         | Category | Required Level | Buy Value | Sell Value | Notes                       |
| ------------ | -------- | -------------- | --------- | ---------- | --------------------------- |
| Bronze Axe   | Axe      | 1              | 40        | 10         | Entry-level woodcutting axe |
| Iron Axe     | Axe      | 1              | 120       | 35         | Early upgrade axe           |
| Steel Axe    | Axe      | 10             | 350       | 110        | Mid-tier axe                |
| Mithril Axe  | Axe      | 20             | 900       | 300        | Strong upgrade axe          |
| Adamant Axe  | Axe      | 30             | 2200      | 750        | High-tier axe               |
| Rune Axe     | Axe      | 40             | null      | 2500       | Not sold in shops           |
| Normal Logs  | Resource | 1              | 6         | 2          | Entry-level logs            |
| Oak Logs     | Resource | 10             | 16        | 6          | Early upgrade logs          |
| Willow Logs  | Resource | 20             | 36        | 14         | Mid-tier logs               |
| Maple Logs   | Resource | 30             | 80        | 32         | Higher-tier balanced logs   |
| Yew Logs     | Resource | 40             | 180       | 72         | High-value late-band logs   |



