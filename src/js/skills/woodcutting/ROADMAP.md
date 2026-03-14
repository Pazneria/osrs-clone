# Woodcutting Roadmap

## Canonical Runtime Source

All mechanic/value tables in this roadmap are synchronized against `src/js/skills/specs.js` (version `2026.03.m6`).
Where a skill defers market values to item data, value rows mirror `src/js/content/item-catalog.js`.

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

| Tree        | Required Level | XP per Success | Tree Difficulty | Depletion Chance | Respawn Ticks |
| ----------- | -------------- | -------------- | --------------- | ---------------- | ------------- |
| Normal Tree | 1              | 25             | 18              | 0.20             | 18            |
| Oak Tree    | 10             | 38             | 28              | 0.22             | 24            |
| Willow Tree | 20             | 68             | 38              | 0.24             | 32            |
| Maple Tree  | 30             | 100            | 50              | 0.27             | 44            |
| Yew Tree    | 40             | 150            | 64              | 0.30             | 60            |

### Attempt Timing Examples

**Attempt Interval Ticks = max(Minimum Attempt Ticks, Base Attempt Ticks - Speed Bonus Ticks)**

| Axe         | Calculation   | Attempt Interval Ticks |
| ----------- | ------------- | ---------------------- |
| Bronze Axe  | max(1, 4 - 0) | 4                      |
| Iron Axe    | max(1, 4 - 1) | 3                      |
| Steel Axe   | max(1, 4 - 2) | 2                      |
| Mithril Axe | max(1, 4 - 3) | 1                      |
| Adamant Axe | max(1, 4 - 4) | 1                      |
| Rune Axe    | max(1, 4 - 5) | 1                      |

### Standardized Success Chance Comparison

**Using Woodcutting Level = 40 and Axe Used = Rune Axe for every tree**

| Tree        | Success Score | Calculation    | Success Chance |
| ----------- | ------------- | -------------- | -------------- |
| Normal Tree | 68            | 68 / (68 + 18) | 79.07%         |
| Oak Tree    | 68            | 68 / (68 + 28) | 70.83%         |
| Willow Tree | 68            | 68 / (68 + 38) | 64.15%         |
| Maple Tree  | 68            | 68 / (68 + 50) | 57.63%         |
| Yew Tree    | 68            | 68 / (68 + 64) | 51.52%         |

### Standardized Active Woodcutting Output Comparison

**Using Woodcutting Level = 40 and Axe Used = Rune Axe for every tree**

These active output values measure woodcutting performance while the player is actively chopping an available tree and do not include depletion downtime or respawn delay.

| Tree        | Expected Logs per Tick | Expected XP per Tick | Expected Gold per Tick |
| ----------- | ---------------------- | -------------------- | ---------------------- |
| Normal Tree | 0.7907                 | 19.7675              | 1.5814                 |
| Oak Tree    | 0.7083                 | 26.9154              | 4.2498                 |
| Willow Tree | 0.6415                 | 43.6220              | 8.9810                 |
| Maple Tree  | 0.5763                 | 57.6300              | 18.4416                |
| Yew Tree    | 0.5152                 | 77.2800              | 37.0944                |

## Inventory Capacity Rules

| Rule | Description |
| ---- | ----------- |
| Start requires capacity | Woodcutting can begin only if at least one inventory slot can accept the target log output. |
| Full inventory start block | If inventory is already full for the target output, woodcutting does not begin. |
| Immediate full stop | If a successful chop fills the last free slot, woodcutting stops immediately after that success tick. |
| No overfill attempts | Woodcutting does not continue into an extra attempt tick once no further output can fit. |
## Depletion Model

### Core Depletion Rules

| Rule | Description |
| ---- | ----------- |
| Per-success depletion roll | After each successful chop, roll that tree's Depletion Chance immediately. If the roll succeeds, the tree depletes and enters respawn. |
| Persistent availability until depletion | Trees remain available until a depletion roll succeeds; there is no guaranteed minimum or maximum-success band in the canonical runtime model. |

### Tree Session Variables

| Variable        | Meaning |
| --------------- | ------- |
| Successful Logs | Number of successful logs produced from the current tree session |
| Depletion Chance | Chance that the tree depletes immediately after a successful chop |

### Depletion Equations

| Equation | Formula | Purpose |
| -------- | ------- | ------- |
| Log Increment | On success: Successful Logs = Successful Logs + 1 | Tracks successful logs from the active tree session |
| Random Depletion Check | After each success: roll against Depletion Chance | Decides whether the tree transitions to a depleted state |
| Depletion Trigger | Tree depletes when the random depletion check succeeds | Controls transition to respawn state |

### Depletion Stats

| Tree        | Depletion Chance | Behavior Summary |
| ----------- | ---------------- | ---------------- |
| Normal Tree | 0.20             | 20% roll after each successful chop |
| Oak Tree    | 0.22             | 22% roll after each successful chop |
| Willow Tree | 0.24             | 24% roll after each successful chop |
| Maple Tree  | 0.27             | 27% roll after each successful chop |
| Yew Tree    | 0.30             | 30% roll after each successful chop |

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
| Session Creation | When the player first attempts to chop an available tree and has at least one free inventory slot for the output logs, create a tree session with Successful Logs = 0                                |
| Session Update   | Update Last Interaction Tick on each chopping attempt while output capacity remains available                                                                                      |
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






