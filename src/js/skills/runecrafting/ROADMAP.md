# Runecrafting Roadmap

## Canonical Runtime Source

All mechanic/value tables in this roadmap are synchronized against `src/js/skills/specs.js` (version `2026.03.m6`).
Where a skill defers market values to item data, value rows mirror `src/js/content/item-catalog.js`.

## Purpose

Runecrafting is the conversion skill for turning rune essence into usable runes at elemental altars.

The player gathers or acquires rune essence, travels to the appropriate altar, and crafts runes that feed into magic.

## Core Progression

| Rune              | Required Level |
| ----------------- | -------------- |
| Ember Rune        | 1              |
| Water Rune        | 10             |
| Earth Rune        | 20             |
| Air Rune          | 30             |
| Combination Runes | 40             |

## Altar Interaction

Runecrafting uses direct altar interaction.

Altars exist directly on the world map. If the player can reach the altar and meets the level or quest requirements, they can click it to craft immediately.

No special altar-access system is used.

## Mechanics

### Core Equations

| Equation                  | Formula                                                                                     | Purpose                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Runes Crafted per Essence | Runes Crafted per Essence = 1 + floor((Player Level - Scaling Start Level) / 10), minimum 1 | Determines rune output scaling based on levels above the rune's scaling start level |
| Action Interval           | Action Interval Ticks = 1                                                                   | Determines how many ticks the altar crafting action takes                   |
| Essence Consumed          | Essence Consumed = Essence Used for Output                                                  | Determines how much essence is converted in one altar action                |
| Secondary Runes in Inventory | Secondary Runes in Inventory = count of the required secondary rune currently held | Determines how many valid secondary runes are available for combination crafting |
| Secondary Runes Consumed  | Secondary Runes Consumed = Total Runes Crafted                                                     | Determines how many carried runes are consumed for combination crafting     |
| Total Runes Crafted       | Total Runes Crafted = Essence Used for Output x Runes Crafted per Essence                      | Determines total rune output from the action                                |
| Essence Used for Output   | Essence Used for Output = Essence Consumed for normal runes, or floor(Secondary Runes in Inventory / Runes Crafted per Essence) for combination runes | Determines how much essence actually produces rune output |
| Total XP Gained           | Total XP Gained = Essence Used for Output x XP per Essence                                   | Determines experience gained from one altar action                          |
| Total Gold Created        | Total Gold Created = Total Runes Crafted x Rune Sell Value                                  | Estimates value created by one altar action                                 |
| Output Sell Value per Action | Output Sell Value per Action = Total Runes Crafted x Rune Sell Value                     | Estimates gross sell value produced by one altar action                      |
| Input Sell Value per Action | Input Sell Value per Action = (Essence Used for Output x Essence Sell Value) + Secondary Runes Consumed Sell Value | Estimates the material value consumed by one altar action |
| Net Sell Value per Action | Net Sell Value per Action = Output Sell Value per Action - Input Sell Value per Action       | Estimates net value created by one altar action                              |
| Travel-Adjusted Ticks     | Travel-Adjusted Ticks = Base Craft Ticks + Route Travel Ticks                               | Adds route overhead to the 1-tick altar action for pacing benchmarks         |
| Travel-Adjusted XP per Tick | Travel-Adjusted XP per Tick = Total XP Gained / Travel-Adjusted Ticks                     | Estimates XP pacing once altar-route overhead is included                    |
| Travel-Adjusted Net Sell Value per Tick | Travel-Adjusted Net Sell Value per Tick = Net Sell Value per Action / Travel-Adjusted Ticks | Estimates net value pacing once altar-route overhead is included |

### Equation Variables

| Variable                  | Meaning                                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Essence in Inventory      | Amount of rune essence currently held by the player                                                        |
| Max Essence per Action    | The most essence that can be converted in one crafting action from inventory                             |
| Runes Crafted per Essence | Number of runes produced by each essence based on the player's level relative to the rune's scaling start level |
| Player Level              | The player's current Runecrafting level                                                                    |
| Rune Required Level       | The minimum Runecrafting level required for that rune                                                      |
| Scaling Start Level      | The level where output scaling begins for that rune; usually the required level, except Ember Runes start scaling from level 0 for cleaner 10/20/30 breakpoints |
| XP per Essence            | Experience granted for converting one essence                                                              |
| Rune Sell Value           | Sell value of the rune being created                                                                       |
| Essence Consumed          | Essence actually removed during the action                                                                 |
| Secondary Runes in Inventory | Number of the required secondary rune currently held for the chosen combination craft |
| Essence Used for Output   | Amount of essence that actually produces rune output during the action |
| Secondary Runes Consumed  | Number of carried elemental runes removed during combination crafting, equal to total rune output          |
| Total Runes Crafted       | Total runes produced from the action                                                                       |
| Total XP Gained           | Total experience granted from the action                                                                   |
| Total Gold Created        | Estimated value of the crafted runes                                                                       |

### Output Scaling Rules

Runecrafting gains +1 rune per essence every 10 levels from the rune's scaling start level.

Ember Runes (the currently implemented starter rune tier) increment at levels 10, 20, 30, and so on.

This applies to both normal and combination runes.

For combination runes, secondary runes consumed are equal to the total number of combination runes created.

If the player does not have enough secondary runes to use all available essence, combination crafting uses as much essence as possible based on the secondary runes currently held, and any unused essence remains in inventory.

Examples:

- Ember Runes require level 1, but scale from level 0, so they produce 1 rune per essence from levels 1-9, 2 per essence from levels 10-19, 3 per essence from levels 20-29, and so on.
- Water Runes require level 10 and scale from level 10, so they produce 1 rune per essence from levels 10-19, 2 per essence from levels 20-29, 3 per essence from levels 30-39, and so on.
- Smoke Runes require level 40 and scale from level 40, so they produce 1 rune per essence from levels 40-49 and consume 1 secondary rune per essence used, 2 per essence from levels 50-59 and consume 2 secondary runes per essence used, 3 per essence from levels 60-69 and consume 3 secondary runes per essence used, and so on.


### Implemented Starter Rune Note

The current runtime implementation uses Ember Rune as the starter altar output tier.

Ember uses scaling start level 0 specifically so level-10 breakpoints land cleanly:
- Levels 1-9: 1 rune per essence
- Levels 10-19: 2 runes per essence
- Levels 20-29: 3 runes per essence
- and so on every +10 levels.

### Implemented Combination Coverage Note

The current runtime implementation includes all six bidirectional combination rune pairs (12 route entries) at level 40 with the combination unlock flag.

Combination crafting consumes secondary runes equal to total output and supports partial-essence resolution when secondary runes are limited.

### Pouch Mechanics

Pouches increase the amount of rune essence the player can carry per trip.

A pouch is filled by using rune essence on it.

Using essence on a pouch puts in as much essence as possible until the pouch is full or the player runs out of rune essence in inventory.

A pouch is emptied by clicking it while it contains essence.

Emptying a pouch moves as much essence as possible from the pouch into the player's inventory.

Pouch essence is not used directly for crafting. The player must first empty the pouch into inventory, then craft using the essence in inventory.

### Global Constants

| Constant               | Value |
| ---------------------- | ----- |
| Tick Duration Seconds  | 0.6   |
| Base Craft Ticks       | 1     |
| Max Inventory Essence  | 28    |

### Rune Stats

| Rune       | Required Level | XP per Essence | Rune Sell Value | Crafting Location                  | Notes |
| ---------- | -------------- | -------------- | --------------- | ---------------------------------- | ----- |
| Ember Rune | 1              | 8              | 4               | Ember altar on world map           | Entry-level crafted rune |
| Water Rune | 10             | 10             | 8               | Water altar on world map           | Early upgrade crafted rune |
| Earth Rune | 20             | 14             | 16              | Earth altar on world map           | Mid-tier crafted rune |
| Air Rune   | 30             | 20             | 32              | Air altar on world map             | Highest base elemental rune |


### Combination Rune Rules

Combination runes unlock at level 40 and also require completion of a combination-runecrafting quest.

A combination rune is created by using the normal altar-crafting process while also carrying a matching secondary rune in inventory.

The altar element plus the carried secondary elemental rune determine the resulting combination rune. The resulting combination rune replaces the normal elemental output from that craft.

Example: at level 40, crafting at the ember altar while carrying 27 air runes and 27 rune essence produces 27 smoke runes and consumes 27 air runes. At level 50, the same craft produces 54 smoke runes and consumes 54 air runes. If the player instead had 27 rune essence and only 40 air runes at level 50, the action would use 20 essence, consume 40 air runes, produce 40 smoke runes, and leave 7 essence in inventory.

| Rule                          | Description                                                                                                |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Combination unlock level      | Combination runes require level 40 Runecrafting                                                            |
| Combination quest requirement | Combination runes also require completion of the combination-runecrafting unlock quest                     |
| Element pair rule             | The altar element plus the carried secondary elemental rune determine the resulting combination rune       |
| Bidirectional rule            | Either valid altar direction can produce the same combination rune                                         |
| Secondary rune rule           | The player must carry the required secondary rune in inventory                                             |
| Secondary rune consumption    | Secondary rune consumption is equal to total rune output actually created                                  |
| Secondary rune rollover       | Combination crafting only uses whole essence. Any leftover secondary runes that cannot support another full essence remain in inventory |
| Output scaling                | Combination rune output scales with levels above the combination rune's required level                     |
| Output replacement            | Combination rune output replaces the normal elemental output for that craft                                |
| Altar requirement             | The player must be at a valid altar on the world map |
| Quest gate                    | Combination crafting cannot begin until the player has completed the combination-runecrafting unlock quest |

### Combination Rune Table

This table lists the unique combination rune outputs available under the current 1-40 altar set.

Each combination rune can be crafted from either valid elemental direction.

| Combination Rune | Element Pair  | Level Requirement | Other Requirement          | Valid Crafting Routes                                         |
| ---------------- | ------------- | ----------------- | -------------------------- | ------------------------------------------------------------- |
| Steam Rune       | Ember + Water | 40                | Combination quest complete | Ember altar with water runes, or water altar with ember runes |
| Smoke Rune       | Ember + Air   | 40                | Combination quest complete | Ember altar with air runes, or air altar with ember runes     |
| Lava Rune        | Ember + Earth | 40                | Combination quest complete | Ember altar with earth runes, or earth altar with ember runes |
| Mud Rune         | Water + Earth | 40                | Combination quest complete | Water altar with earth runes, or earth altar with water runes |
| Mist Rune        | Water + Air   | 40                | Combination quest complete | Water altar with air runes, or air altar with water runes     |
| Dust Rune        | Earth + Air   | 40                | Combination quest complete | Earth altar with air runes, or air altar with earth runes     |

### Combination Rune Stats

| Combination Rune | Required Level | XP per Essence | Rune Sell Value | Crafting Location                  | Notes |
| ---------------- | -------------- | -------------- | --------------- | ---------------------------------- | ----- |
| Steam Rune       | 40             | 24             | 64              | Ember or Water altar on world map  | Combination rune crafted from a valid Ember + Water route |
| Smoke Rune       | 40             | 24             | 64              | Ember or Air altar on world map    | Combination rune crafted from a valid Ember + Air route |
| Lava Rune        | 40             | 24             | 64              | Ember or Earth altar on world map  | Combination rune crafted from a valid Ember + Earth route |
| Mud Rune         | 40             | 24             | 64              | Water or Earth altar on world map  | Combination rune crafted from a valid Water + Earth route |
| Mist Rune        | 40             | 24             | 64              | Water or Air altar on world map    | Combination rune crafted from a valid Water + Air route |
| Dust Rune        | 40             | 24             | 64              | Earth or Air altar on world map    | Combination rune crafted from a valid Earth + Air route |

### Craft Resolution

| Step | Rule |
| ---- | ---- |
| 1    | Check that the target altar is valid for the chosen rune type |
| 2    | Check that the player meets the rune's level requirement |
| 3    | Check that the player has rune essence in inventory |
| 4    | For combination runes, check that the player has completed the combination-runecrafting unlock quest |
| 5    | Calculate runes crafted per essence based on the player's level and the rune's scaling start level |
| 6    | For combination runes, calculate the maximum possible output based on secondary runes in inventory |
| 7    | For combination runes, calculate how much essence can actually be used for output |
| 8    | Wait Base Craft Ticks |
| 9    | Consume essence equal to Essence Used for Output, up to Max Essence per Action |
| 10   | Add the matching runes to inventory based on total rune output |
| 11   | For combination runes, also consume matching secondary runes equal to total rune output |
| 12   | Award XP based on Essence Used for Output |
| 13   | End the crafting action |

### Runtime Feedback and Interruption Notes

- Combination routes now validate that the carried secondary runes can support at least one rune essence at the player's current output multiplier before the altar action starts.
- If matching secondary runes are removed before the craft tick resolves, the action stops with the same explicit secondary-rune requirement message instead of silently ending.
- Partial combination crafting remains valid when the carried secondary rune count can support at least one essence; unused essence stays in inventory as described in the combination-rune rules.
- Altar hover and context-menu labels now show the selected output route plus lock, essence, or secondary-rune hints before the player commits to the action.
- Queued altar crafts now stop with explicit feedback if the selected altar target changes before the craft tick resolves.

## Economy Role

Runecrafting creates value by converting rune essence into usable runes.

| Output    | Use                  |
| --------- | -------------------- |
| All runes | Magic                |
| All runes | Direct sale for gold |

### Item Values

| Item         | Category | Buy Value | Sell Value |
| ------------ | -------- | --------- | ---------- |
| Rune Essence | Resource | 12        | 4          |
| Ember Rune   | Rune     | 10        | 4          |
| Water Rune   | Rune     | 20        | 8          |
| Earth Rune   | Rune     | 40        | 16         |
| Air Rune     | Rune     | 80        | 32         |
| Steam Rune   | Rune     | 160       | 64         |
| Smoke Rune   | Rune     | 160       | 64         |
| Lava Rune    | Rune     | 160       | 64         |
| Mud Rune     | Rune     | 160       | 64         |
| Mist Rune    | Rune     | 160       | 64         |
| Dust Rune    | Rune     | 160       | 64         |
| Small Pouch  | Utility  | 500       | 200        |
| Medium Pouch | Utility  | 2000      | 800        |
| Large Pouch  | Utility  | 8000      | 3200       |

## Balance Benchmarks

Runecrafting balance uses one full inventory of rune essence per altar action and adds route-overhead benchmarks from `SkillSpecs.runecrafting.balance` to avoid judging a 1-tick altar action in isolation.

Pouch fill and empty micro-actions are excluded from these tables because pouches extend carried essence before the altar action; the live altar craft still consumes only essence currently in inventory.

### Balance Assumptions

| Assumption | Value |
| ---------- | ----- |
| Inventory Essence per Action | 28 |
| Base Craft Ticks | 1 |
| Ember Route Travel Ticks | 24 |
| Water Route Travel Ticks | 30 |
| Earth Route Travel Ticks | 36 |
| Air Route Travel Ticks | 42 |

### Tier-Entry Elemental Benchmarks

| Rune | Level | Route Travel Ticks | Runes per Essence | Runes per Action | XP per Action | Output Sell/Action | Input Sell/Action | Net Sell/Action | Travel XP/Tick | Travel Net Sell/Tick |
| ---- | ----- | ------------------ | ----------------- | ---------------- | ------------- | ------------------ | ----------------- | --------------- | -------------- | -------------------- |
| Ember Rune | 1 | 24 | 1 | 28 | 224 | 112 | 112 | 0 | 8.9600 | 0.0000 |
| Water Rune | 10 | 30 | 1 | 28 | 280 | 224 | 112 | 112 | 9.0323 | 3.6129 |
| Earth Rune | 20 | 36 | 1 | 28 | 392 | 448 | 112 | 336 | 10.5946 | 9.0811 |
| Air Rune | 30 | 42 | 1 | 28 | 560 | 896 | 112 | 784 | 13.0233 | 18.2326 |

### Level-40 Elemental Scaling Benchmarks

| Rune | Level | Route Travel Ticks | Runes per Essence | Runes per Action | XP per Action | Output Sell/Action | Input Sell/Action | Net Sell/Action | Travel XP/Tick | Travel Net Sell/Tick |
| ---- | ----- | ------------------ | ----------------- | ---------------- | ------------- | ------------------ | ----------------- | --------------- | -------------- | -------------------- |
| Ember Rune | 40 | 24 | 5 | 140 | 224 | 560 | 112 | 448 | 8.9600 | 17.9200 |
| Water Rune | 40 | 30 | 4 | 112 | 280 | 896 | 112 | 784 | 9.0323 | 25.2903 |
| Earth Rune | 40 | 36 | 3 | 84 | 392 | 1344 | 112 | 1232 | 10.5946 | 33.2973 |
| Air Rune | 40 | 42 | 2 | 56 | 560 | 1792 | 112 | 1680 | 13.0233 | 39.0698 |

### Preferred Combination Benchmarks

| Combination Rune | Preferred Route | Secondary Rune | Route Travel Ticks | Runes per Action | XP per Action | Output Sell/Action | Input Sell/Action | Net Sell/Action | Travel XP/Tick | Travel Net Sell/Tick |
| ---------------- | --------------- | -------------- | ------------------ | ---------------- | ------------- | ------------------ | ----------------- | --------------- | -------------- | -------------------- |
| Steam Rune | Ember Altar | Water Rune | 24 | 28 | 672 | 1792 | 336 | 1456 | 26.8800 | 58.2400 |
| Smoke Rune | Air Altar | Ember Rune | 42 | 28 | 672 | 1792 | 224 | 1568 | 15.6279 | 36.4651 |
| Lava Rune | Ember Altar | Earth Rune | 24 | 28 | 672 | 1792 | 560 | 1232 | 26.8800 | 49.2800 |
| Mud Rune | Water Altar | Earth Rune | 30 | 28 | 672 | 1792 | 560 | 1232 | 21.6774 | 39.7419 |
| Mist Rune | Air Altar | Water Rune | 42 | 28 | 672 | 1792 | 336 | 1456 | 15.6279 | 33.8605 |
| Dust Rune | Air Altar | Earth Rune | 42 | 28 | 672 | 1792 | 560 | 1232 | 15.6279 | 28.6512 |

## Merchant / NPC Structure

### Rune Tutor

The rune tutor introduces the basics of runecrafting. This NPC helps new players understand rune essence, world-map altar interaction, and early rune progression.

**Location:** Near the main town or close to the first ember altar approach.

**Associated Quests:** Introductory runecrafting task.

| Item         | Buys | Sells |
| ------------ | ---- | ----- |
| Rune Essence | 4    | 12    |
| Ember Rune   | 4    | 10    |
| Water Rune   | 8    | 20    |
| Earth Rune   | 16   | 40    |
| Air Rune     | 32   | 80    |

The rune tutor shop is strict to the listed essence and elemental rune rows at runtime; unrelated goods are not bought through this merchant.

### Combination Sage

The combination sage represents the late end of the 1-40 runecrafting band, introduces combination rune crafting, and sells runecrafting pouches as progression unlocks.

**Location:** In a more secluded magical area.

**Associated Quests:** This NPC is the natural place for the level-40 combination-runecrafting unlock quest and combination-rune tutorial step.

**Pouch Unlocks:**
- Small Pouch unlocks for purchase at level 10 and carries 6 essence
- Medium Pouch unlocks for purchase at level 20 and carries 13 essence
- Large Pouch unlocks for purchase at level 30 and carries 26 essence

| Item         | Buys | Sells |
| ------------ | ---- | ----- |
| Rune Essence | 4    | 12    |
| Steam Rune   | 64   | 160   |
| Smoke Rune   | 64   | 160   |
| Lava Rune    | 64   | 160   |
| Mud Rune     | 64   | 160   |
| Mist Rune    | 64   | 160   |
| Dust Rune    | 64   | 160   |
| Small Pouch  | 200  | 500   |
| Medium Pouch | 800  | 2000  |
| Large Pouch  | 3200 | 8000  |

The combination sage shop is strict to the listed essence, combination rune, and pouch rows at runtime, with pouch sales unlocking exactly at the documented level thresholds.

### General Store

The general store buys everything at half price.

### Pouch Stats

| Pouch        | Required Level | Capacity | Buy Value | Sell Value | Notes |
| ------------ | -------------- | -------- | --------- | ---------- | ----- |
| Small Pouch  | 10             | 6        | 500       | 200        | Purchased from the Combination Sage |
| Medium Pouch | 20             | 13       | 2000      | 800        | Purchased from the Combination Sage |
| Large Pouch  | 30             | 26       | 8000      | 3200       | Purchased from the Combination Sage |

## Training Location Structure

| Location Type                                   | Role                             |
| ----------------------------------------------- | -------------------------------- |
| Ember altar approach near early game area        | Entry-level rune training        |
| Water altar route with mild travel time         | Early upgrade rune training      |
| Earth altar route in a broader region           | Mid-tier elemental rune training |
| Air altar route in a broader or elevated region | Highest base elemental training  |

## Dependencies

| Dependency        | Purpose                                     |
| ----------------- | ------------------------------------------- |
| Magic             | Primary rune sink                           |
| Mining            | Primary rune essence source                 |
| Shops and economy | Selling runes and buying essence            |
| Quest progression | Combination-runecrafting unlock progression |

## Cross-Skill Integration Contract

Runecrafting owns rune production, but its input and output loops are cross-skill contracts:

- Mining is the canonical source of rune essence.
- Magic is the canonical future sink for all crafted rune outputs.

### Mining Essence Supply

| Source Skill | Node ID | Output Item | Required Level | Supply Rule |
| ------------ | ------- | ----------- | -------------- | ----------- |
| Mining | rune_essence | Rune Essence | 1 | Persistent |

Rune essence must continue to come from the mining `rune_essence` node, and that node must remain persistent so runecrafting does not inherit ore-style depletion downtime.

### Magic Rune Demand

| Sink Skill | Demand Status | Rune Family | Rune Items |
| ---------- | ------------- | ----------- | ---------- |
| Magic | future_sink_contract | Elemental runes | Ember Rune, Water Rune, Earth Rune, Air Rune |
| Magic | future_sink_contract | Combination runes | Steam Rune, Smoke Rune, Lava Rune, Mud Rune, Mist Rune, Dust Rune |

All runes in the demand contract must stay stackable, craftable through runecrafting recipes, and present in the runecrafting economy table. The `future_sink_contract` status means the Magic skill is not live yet, but future spell costs should consume these item IDs rather than defining a parallel rune set.

## Possible Rules

| Rule                                                            | Value |
| --------------------------------------------------------------- | ----- |
| Runecrafting uses rune essence as its base input                | True  |
| Altars exist directly on the world map                          | True  |
| Altars do not require talismans or tiaras                       | True  |
| Altars do not deplete                                           | True  |
| Runecrafting has no tool-power progression                | True  |
| Rune output scales by levels above requirement                  | True  |
| One altar action can convert a full inventory of essence        | True  |
| One altar action resolves in 1 tick                             | True  |
| Combination runes require a dedicated unlock quest              | True  |
| Crafted runes are sold by specialty merchants                   | True  |
| Pouches are sold by the Combination Sage                        | True  |
| Pouches unlock for purchase at levels 10, 20, and 30            | True  |
| General stores buy everything for half price                    | True  |
| Specialty merchants focus on runecrafting-related goods         | True  |

## Item List

| Item         | Category | Required Level | Buy Value | Sell Value | Notes                                                  |
| ------------ | -------- | -------------- | --------- | ---------- | ------------------------------------------------------ |
| Rune Essence | Resource | 1              | 12        | 4          | Base material for runecrafting                         |
| Ember Rune   | Rune     | 1              | 10        | 4          | Entry-level crafted rune                               |
| Water Rune   | Rune     | 10             | 20        | 8          | Early upgrade crafted rune                             |
| Earth Rune   | Rune     | 20             | 40        | 16         | Mid-tier crafted rune                                  |
| Air Rune     | Rune     | 30             | 80        | 32         | Highest base elemental rune                            |
| Steam Rune   | Rune     | 40             | 160       | 64         | Combination rune crafted from a valid Ember + Water route |
| Smoke Rune   | Rune     | 40             | 160       | 64         | Combination rune crafted from a valid Ember + Air route |
| Lava Rune    | Rune     | 40             | 160       | 64         | Combination rune crafted from a valid Ember + Earth route |
| Mud Rune     | Rune     | 40             | 160       | 64         | Combination rune crafted from a valid Water + Earth route |
| Mist Rune    | Rune     | 40             | 160       | 64         | Combination rune crafted from a valid Water + Air route |
| Dust Rune    | Rune     | 40             | 160       | 64         | Combination rune crafted from a valid Earth + Air route |
| Small Pouch  | Utility  | 10             | 500       | 200        | Carries 6 essence |
| Medium Pouch | Utility  | 20             | 2000      | 800        | Carries 13 essence |
| Large Pouch  | Utility  | 30             | 8000      | 3200       | Carries 26 essence |









