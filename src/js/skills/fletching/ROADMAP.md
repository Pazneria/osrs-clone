# Fletching Roadmap

## Canonical Runtime Source

All mechanic/value tables in this roadmap are synchronized against `src/js/skills/specs.js` (version `2026.03.m6`).
Where a skill defers market values to item data, value rows mirror `src/js/content/item-catalog.js`.

## Purpose

Fletching is the processing skill for turning logs into wooden equipment parts, wooden handles for tools and weapons, plain staffs, ranged ammunition parts, and unstrung bows.

The player uses fletching to convert woodcutting outputs into downstream items that support smithing, ranged progression, and direct sale value.

## Core Progression

| Fletching Tier | Required Level | Primary Log Type |
| -------------- | -------------- | ---------------- |
| Normal         | 1              | Normal Logs      |
| Oak            | 10             | Oak Logs         |
| Willow         | 20             | Willow Logs      |
| Maple          | 30             | Maple Logs       |
| Yew            | 40             | Yew Logs         |

## Tools and Supplies

| Tool       | Required Level | Buy Value | Sell Value |
| ---------- | -------------- | --------- | ---------- |
| Knife      | 1              | 8         | 2          |
| Feathers x15 | 1            | 8         | 2          |
| Bow String | 1              | 12        | 3          |

## Mechanics

### Core Rules

| Rule | Description |
| ---- | ----------- |
| Valid Action Requirements | A fletching action can begin only if the player meets the level requirement, has the required tool, and has the required materials. |
| Fixed Action Time | Each fletching action takes 3 ticks to complete. |
| Guaranteed Success | Fletching actions do not have random failure chances. If the action is valid, it succeeds. |
| Input Consumption | When a fletching action completes, the listed inputs are consumed. |
| Output Creation | When a fletching action completes, the listed output is created. |
| XP Award | When a fletching action completes, the player gains the XP listed for that recipe. |
| Queued Repetition | If the player queued multiple actions, fletching repeats one action every 3 ticks until the queue ends or the requirements stop being met. |

### Global Constants

| Constant                      | Value |
| ----------------------------- | ----- |
| Fixed Fletching Action Ticks  | 3     |

### Derived Values

| Value           | Formula                         | Purpose                                  |
| --------------- | ------------------------------- | ---------------------------------------- |
| Output per Tick | Output per Tick = 1 / 3         | Estimates average fletching output rate  |
| XP per Tick     | XP per Tick = XP per Action / 3 | Estimates average experience gain rate   |

## Core Recipe Structure

### Log Tier Mapping

This table defines which log type is used for each progression band across fletching recipes.

| Tier     | Log Type    |
| -------- | ----------- |
| Bronze   | Normal Logs |
| Iron     | Normal Logs |
| Steel    | Oak Logs    |
| Mithril  | Willow Logs |
| Adamant  | Maple Logs  |
| Rune     | Yew Logs    |

### Wooden Component Recipes

These recipes support multi-skill item assembly and are the required source of wooden handles for tools and weapons.

| Output | Required Level | Inputs | Tool Requirement | XP per Action | Notes |
| ------ | -------------- | ------ | ---------------- | ------------- | ----- |
| Wooden Handle | 1 | 1 Normal Log | Knife | 6 | Used in crafting for normal-log tool and weapon assembly |
| Oak Handle | 10 | 1 Oak Log | Knife | 9 | Used in crafting for oak-tier tool and weapon assembly |
| Willow Handle | 20 | 1 Willow Log | Knife | 16 | Used in crafting for willow-tier tool and weapon assembly |
| Maple Handle | 30 | 1 Maple Log | Knife | 24 | Used in crafting for maple-tier tool and weapon assembly |
| Yew Handle | 40 | 1 Yew Log | Knife | 36 | Used in crafting for yew-tier tool and weapon assembly |

### Staff Recipes

These recipes establish the plain staff progression used for later magic-equipment creation.

| Output | Required Level | Inputs | Tool Requirement | XP per Action | Notes |
| ------ | -------------- | ------ | ---------------- | ------------- | ----- |
| Plain Staff (Wood) | 2 | 1 Normal Log | Knife | 6 | Plain-only staff; cannot have a gem attached |
| Plain Staff (Oak) | 11 | 1 Oak Log | Knife | 9 | Used later for fire staff creation |
| Plain Staff (Willow) | 21 | 1 Willow Log | Knife | 16 | Used later for water staff creation |
| Plain Staff (Maple) | 31 | 1 Maple Log | Knife | 24 | Used later for earth staff creation |
| Plain Staff (Yew) | 41 | 1 Yew Log | Knife | 36 | Used later for air staff creation |

### Ammunition Part Recipes

Arrow-making uses a two-step process: first the player combines wood-tier arrow shafts with feathers to create matching wood-tier headless arrows, then the player combines those headless arrows with matching-tier metal arrowheads to create finished arrows.

| Output | Required Level | Inputs | Tool Requirement | XP per Action | Notes |
| ------ | -------------- | ------ | ---------------- | ------------- | ----- |
| Wooden Shafts x15 | 2 | 1 Normal Log | Knife | 4 | Shaft component for bronze and iron arrows |
| Oak Shafts x15 | 11 | 1 Oak Log | Knife | 6 | Shaft component for steel arrows |
| Willow Shafts x15 | 21 | 1 Willow Log | Knife | 11 | Shaft component for mithril arrows |
| Maple Shafts x15 | 31 | 1 Maple Log | Knife | 16 | Shaft component for adamant arrows |
| Yew Shafts x15 | 41 | 1 Yew Log | Knife | 24 | Shaft component for rune arrows |
| Wooden Headless Arrows x15 | 3 | 1 Wooden Shafts x15 + 1 Feathers x15 | None | 4 | Intermediate step for bronze and iron arrows |
| Oak Headless Arrows x15 | 12 | 1 Oak Shafts x15 + 1 Feathers x15 | None | 6 | Intermediate step for steel arrows |
| Willow Headless Arrows x15 | 22 | 1 Willow Shafts x15 + 1 Feathers x15 | None | 11 | Intermediate step for mithril arrows |
| Maple Headless Arrows x15 | 32 | 1 Maple Shafts x15 + 1 Feathers x15 | None | 16 | Intermediate step for adamant arrows |
| Yew Headless Arrows x15 | 42 | 1 Yew Shafts x15 + 1 Feathers x15 | None | 24 | Intermediate step for rune arrows |
| Bronze Arrows x15 | 1 | 1 Bronze Arrowheads + 1 Wooden Headless Arrows x15 | None | 2 | Finished ammunition |
| Iron Arrows x15 | 5 | 1 Iron Arrowheads + 1 Wooden Headless Arrows x15 | None | 3 | Finished ammunition |
| Steel Arrows x15 | 12 | 1 Steel Arrowheads + 1 Oak Headless Arrows x15 | None | 5 | Finished ammunition |
| Mithril Arrows x15 | 23 | 1 Mithril Arrowheads + 1 Willow Headless Arrows x15 | None | 10 | Finished ammunition |
| Adamant Arrows x15 | 34 | 1 Adamant Arrowheads + 1 Maple Headless Arrows x15 | None | 15 | Finished ammunition |
| Rune Arrows x15 | 45 | 1 Rune Arrowheads + 1 Yew Headless Arrows x15 | None | 23 | Finished ammunition |

### Bow Recipes

Bows use a two-step process: first the player cuts an unstrung bow from a log with a knife, then the player combines the unstrung bow with a bow string to create the finished bow.

| Output | Required Level | Inputs | Tool Requirement | XP per Action | Notes |
| ------ | -------------- | ------ | ---------------- | ------------- | ----- |
| Normal Shortbow (u) | 5 | 1 Normal Log | Knife | 5 | Entry-level unstrung shortbow |
| Normal Longbow (u) | 3 | 1 Normal Log | Knife | 5 | Entry-level unstrung longbow |
| Oak Shortbow (u) | 14 | 1 Oak Log | Knife | 10 | Early upgrade unstrung shortbow |
| Willow Shortbow (u) | 24 | 1 Willow Log | Knife | 18 | Mid-band unstrung shortbow |
| Maple Shortbow (u) | 34 | 1 Maple Log | Knife | 26 | Higher-tier unstrung shortbow |
| Yew Shortbow (u) | 44 | 1 Yew Log | Knife | 39 | Top-band unstrung shortbow |
| Oak Longbow (u) | 12 | 1 Oak Log | Knife | 8 | Early upgrade unstrung longbow |
| Willow Longbow (u) | 22 | 1 Willow Log | Knife | 14 | Mid-band unstrung longbow |
| Maple Longbow (u) | 32 | 1 Maple Log | Knife | 20 | Higher-tier unstrung longbow |
| Yew Longbow (u) | 42 | 1 Yew Log | Knife | 30 | Top-band unstrung longbow |
| Normal Shortbow | 5 | 1 Normal Shortbow (u) + 1 Bow String | None | 4 | Entry-level bow |
| Normal Longbow | 3 | 1 Normal Longbow (u) + 1 Bow String | None | 3 | Entry-level longbow |
| Oak Shortbow | 14 | 1 Oak Shortbow (u) + 1 Bow String | None | 6 | Early upgrade bow |
| Willow Shortbow | 24 | 1 Willow Shortbow (u) + 1 Bow String | None | 11 | Mid-band bow |
| Maple Shortbow | 34 | 1 Maple Shortbow (u) + 1 Bow String | None | 16 | Higher-tier bow |
| Yew Shortbow | 44 | 1 Yew Shortbow (u) + 1 Bow String | None | 24 | Top-band bow |
| Oak Longbow | 12 | 1 Oak Longbow (u) + 1 Bow String | None | 5 | Slower, stronger bow option |
| Willow Longbow | 22 | 1 Willow Longbow (u) + 1 Bow String | None | 8 | Mid-band longbow |
| Maple Longbow | 32 | 1 Maple Longbow (u) + 1 Bow String | None | 12 | Higher-tier longbow |
| Yew Longbow | 42 | 1 Yew Longbow (u) + 1 Bow String | None | 18 | Top-band longbow |

### Recipe Rules

- Fletching does not create metal item parts.
- Fletching creates wooden handles, but finished swords, axes, and pickaxes are assembled in crafting.
- Wooden handles are a core fletching output and are required to complete swords, axes, and pickaxes in crafting.
- The knife is an inventory item, is not equipped, and is used directly on logs to begin log-cutting recipes.
- Using a knife on a valid log opens a product selection menu for that log type before quantity is chosen.
- Where four options are present for a log type, the selection menu is arranged as a 2x2 grid, with top-left handle, bottom-left shafts, top-right longbow (u), and bottom-right shortbow (u).
- If one of those options is not yet unlocked, its slot remains visible as a grayed-out, non-interactable option rather than disappearing.
- Product options in that menu appear lit if the player meets the level requirement and has the required materials, and appear unlit if they do not.
- Hovering or clicking an unlit option can give feedback explaining the missing requirement, such as: Requires level 15 Fletching.
- Quantity selection always refers to number of recipe actions. For example, selecting 5 on arrow shafts consumes 5 logs and creates 75 shafts.
- Stringing bows and finishing arrows also support quantity selection.
- Stringing bows uses direct item-on-item interaction: use an unstrung bow on a bow string, then choose quantity.
- Making headless arrows uses direct item-on-item interaction: use shafts on feathers, then choose quantity.
- Finishing arrows uses direct item-on-item interaction: use headless arrows on matching-tier arrowheads, then choose quantity.
- These direct item-on-item interactions do not open a product selection menu.
- If the player tries to combine headless arrows with non-matching arrowheads, the action does not begin and the game gives feedback such as: These don't match.
- Arrow-related quantity actions resolve in increments of 15, since each action produces or consumes a stack of 15 arrow parts or arrows where applicable.
- Matching-wood handles are required for the corresponding swords, axes, and pickaxes.
- Plain staffs are fletched directly from logs at one staff per log.
- Plain Staff (Wood) is plain-only and cannot have a gem attached.
- Plain Staff (Oak), Plain Staff (Willow), Plain Staff (Maple), and Plain Staff (Yew) feed into later elemental staff creation through crafting.
- Fire Staff uses Plain Staff (Oak) with a ruby.
- Water Staff uses Plain Staff (Willow) with a sapphire.
- Earth Staff uses Plain Staff (Maple) with an emerald.
- Air Staff uses Plain Staff (Yew) with a diamond.
- Arrow shafts and headless arrows have wood tiers that match the log used to make them.
- Bronze and iron arrows use wooden headless arrows.
- Steel arrows use oak headless arrows.
- Mithril arrows use willow headless arrows.
- Adamant arrows use maple headless arrows.
- Rune arrows use yew headless arrows.
- Finished arrows require smithing for arrowheads and fletching for shaft, feather, and final arrow assembly.
- Bow strings are treated as a simple purchased supply for now and can later be reassigned to crafting if desired.
- Each bow can use arrows up to its own tier and cannot use higher-tier arrows.

## Station Structure

### Core Station Rules

| Station Type | Purpose |
| ------------ | ------- |
| Inventory / Anywhere | Fletching actions are performed directly from the player's inventory and do not require a world station |

### Runtime Rules

| Rule | Description |
| ---- | ----------- |
| No Station Requirement | Fletching can be performed anywhere as long as the player has the needed items and tools. |
| Knife Use Flow | The knife is kept in the inventory, is not equipped, and is used by clicking the knife and then clicking a valid log. |
| Product Selection Menu | Using a knife on a valid log opens a menu showing all valid fletching products for that exact log type. Where four options are present, the menu is arranged as a 2x2 grid rather than a 1x4 list, with top-left handle, bottom-left shafts, top-right longbow (u), and bottom-right shortbow (u). If one of those options is not yet unlocked, its slot still remains in place as a grayed-out, non-interactable option rather than the menu collapsing or reshuffling. Options appear lit if the player currently meets the level requirement and has the required materials for that recipe, and unlit if they do not. Hovering or clicking an unlit option can show the missing requirement. |
| Quantity Selection | After choosing a valid product, the player chooses 1, 5, X, or ALL. Quantity always means number of recipe actions, not number of final individual items. For stack-output recipes such as shafts, headless arrows, and finished arrows, quantities resolve in multiples of 15 where applicable. Bow stringing also supports quantity selection through direct item-on-item use. |
| Default Left Click | Default left click on a valid fletching option queues exactly 1 action. |
| Right Click Quantity | Right click on a valid fletching option allows the player to choose 1, 5, X, or ALL. |
| One Input Set per Action | Each completed fletching action consumes exactly the listed recipe inputs. |
| One Output per Action | Each completed fletching action produces exactly the listed recipe output. For stack-output recipes such as arrow shafts x15 or arrows x15, one action creates the full listed stack. |
| Repeated Action Queue | Quantity-based fletching repeats one action every 3 ticks until the queue completes or requirements fail. |
| No Failure States | If the player meets the level and has the materials, the action succeeds. |

## Economy Role

Fletching creates value by converting logs into more specialized items and by supplying one part of several multi-skill equipment chains.

| Output Type | Use |
| ----------- | --- |
| Wooden Handles | Required for sword, axe, and pickaxe assembly |
| Plain Staffs | Base progression for later elemental staff creation |
| Wood-Tier Shafts | Ammunition assembly |
| Wood-Tier Headless Arrows | Intermediate step for arrow production |
| Finished Arrows | Ranged ammunition |
| Unstrung Bows | Intermediate step for bow production |
| Bows | Direct equipment progression; each bow can use arrows up to its own tier |

### Item Values

| Item | Category | Buy Value | Sell Value |
| ---- | -------- | --------- | ---------- |
| Knife | Tool | 8 | 2 |
| Feathers x15 | Supply | 8 | 2 |
| Bow String | Supply | 12 | 3 |
| Wooden Handle | Component | null | 6 |
| Oak Handle | Component | null | 12 |
| Willow Handle | Component | null | 20 |
| Maple Handle | Component | null | 32 |
| Yew Handle | Component | null | 50 |
| Wooden Shafts x15 | Component | null | 4 |
| Oak Shafts x15 | Component | null | 6 |
| Willow Shafts x15 | Component | null | 10 |
| Maple Shafts x15 | Component | null | 16 |
| Yew Shafts x15 | Component | null | 24 |
| Wooden Headless Arrows x15 | Component | null | 6 |
| Oak Headless Arrows x15 | Component | null | 10 |
| Willow Headless Arrows x15 | Component | null | 16 |
| Maple Headless Arrows x15 | Component | null | 24 |
| Yew Headless Arrows x15 | Component | null | 36 |
| Bronze Arrows x15 | Ammunition | null | 8 |
| Iron Arrows x15 | Ammunition | null | 12 |
| Steel Arrows x15 | Ammunition | null | 20 |
| Mithril Arrows x15 | Ammunition | null | 32 |
| Adamant Arrows x15 | Ammunition | null | 50 |
| Rune Arrows x15 | Ammunition | null | 80 |
| Normal Shortbow (u) | Unstrung Bow | null | 7 |
| Normal Longbow (u) | Unstrung Bow | null | 6 |
| Oak Shortbow (u) | Unstrung Bow | null | 15 |
| Willow Shortbow (u) | Unstrung Bow | null | 28 |
| Maple Shortbow (u) | Unstrung Bow | null | 46 |
| Yew Shortbow (u) | Unstrung Bow | null | 72 |
| Oak Longbow (u) | Unstrung Bow | null | 14 |
| Willow Longbow (u) | Unstrung Bow | null | 26 |
| Maple Longbow (u) | Unstrung Bow | null | 44 |
| Yew Longbow (u) | Unstrung Bow | null | 70 |
| Normal Shortbow | Bow | null | 12 |
| Normal Longbow | Bow | null | 10 |
| Oak Shortbow | Bow | null | 22 |
| Willow Shortbow | Bow | null | 40 |
| Maple Shortbow | Bow | null | 68 |
| Yew Shortbow | Bow | null | 110 |
| Oak Longbow | Bow | null | 20 |
| Willow Longbow | Bow | null | 36 |
| Maple Longbow | Bow | null | 62 |
| Yew Longbow | Bow | null | 100 |

## Merchant / NPC Structure

### Fletching Supplier

This merchant introduces the basics of fletching and connects woodcutting outputs to ranged and equipment assembly progression.

**Location:** In a crafting or ranged-adjacent part of town.

**Associated Quests:** None by default.

| Item | Buys | Sells |
| ---- | ---- | ----- |
| Knife | 2 | 8 |
| Feathers x15 | 2 | 8 |
| Bow String | 3 | 12 |

### Advanced Fletcher

This merchant buys fletching outputs across all tiers, including shafts, headless arrows, handles, plain staffs, and both unstrung and finished bows.

**Location:** Deeper in the world or in a more specialized ranged district.

**Associated Quests:** Can be tied to later progression if needed.

| Item | Buys | Sells |
| ---- | ---- | ----- |
| Bronze Arrows x15 | 8 | null |
| Iron Arrows x15 | 12 | null |
| Steel Arrows x15 | 20 | null |
| Mithril Arrows x15 | 32 | null |
| Adamant Arrows x15 | 50 | null |
| Rune Arrows x15 | 80 | null |
| Wooden Handle | 6 | null |
| Oak Handle | 12 | null |
| Willow Handle | 20 | null |
| Maple Handle | 32 | null |
| Yew Handle | 50 | null |
| Plain Staff (Wood) | See crafting | null |
| Plain Staff (Oak) | See crafting | null |
| Plain Staff (Willow) | See crafting | null |
| Plain Staff (Maple) | See crafting | null |
| Plain Staff (Yew) | See crafting | null |
| Wooden Shafts x15 | 4 | null |
| Oak Shafts x15 | 6 | null |
| Willow Shafts x15 | 10 | null |
| Maple Shafts x15 | 16 | null |
| Yew Shafts x15 | 24 | null |
| Wooden Headless Arrows x15 | 6 | null |
| Oak Headless Arrows x15 | 10 | null |
| Willow Headless Arrows x15 | 16 | null |
| Maple Headless Arrows x15 | 24 | null |
| Yew Headless Arrows x15 | 36 | null |
| Normal Shortbow (u) | 7 | null |
| Normal Longbow (u) | 6 | null |
| Oak Shortbow (u) | 15 | null |
| Oak Longbow (u) | 14 | null |
| Willow Shortbow (u) | 28 | null |
| Willow Longbow (u) | 26 | null |
| Maple Shortbow (u) | 46 | null |
| Maple Longbow (u) | 44 | null |
| Yew Shortbow (u) | 72 | null |
| Yew Longbow (u) | 70 | null |
| Normal Shortbow | 12 | null |
| Normal Longbow | 10 | null |
| Oak Shortbow | 22 | null |
| Oak Longbow | 20 | null |
| Willow Shortbow | 40 | null |
| Willow Longbow | 36 | null |
| Maple Shortbow | 68 | null |
| Maple Longbow | 62 | null |
| Yew Shortbow | 110 | null |
| Yew Longbow | 100 | null |

### General Store

The general store buys everything at half price.

## Training Location Structure

| Location Type | Purpose |
| ------------- | ------- |
| Anywhere with inventory space | Core fletching training |
| Bank-adjacent town area | Fast processing of logs into handles, staffs, shafts, and bows |
| Ranged-adjacent shop area | Easy resupply for feathers and bow strings |

## Dependencies

- Woodcutting
- Smithing
- Crafting
- Combat / Ranged
- Shops / economy
- Quest progression

## Possible Rules

- Wooden handle-making is available at level 1.
- Fletching actions are deterministic and do not have random failure chances.
- Fletching does not require a station.
- Yew-tier wooden components and bows are player-made rather than shop-bought.
- The general store buys all fletching-related items at half price, rounded down.
- Specialty merchants buy and sell only goods relevant to their role.
- Fletching suppliers sell tools and supplies rather than raw logs.
- Plain staffs are core fletching outputs for later magic-equipment crafting progression.
- Crafting is the canonical owner of plain staff buy and sell values.
- Fletcher-type merchants can buy shafts, headless arrows, unstrung bows, and finished bows across all tiers.
- Bow strings are shop supplies for now and can later be reassigned to crafting if that system needs more internal production.
- Feathers are purchased supplies for now.
- Finished swords, axes, and pickaxes are assembled in crafting from smithing-made metal parts and fletching-made handles.

## Item List

| Item | Category | Required Level | Buy Value | Sell Value | Notes |
| ---- | -------- | -------------- | --------- | ---------- | ----- |
| Knife | Tool | 1 | 8 | 2 | Required for most cutting actions |
| Feathers x15 | Supply | 1 | 8 | 2 | Used to finish arrows |
| Bow String | Supply | 1 | 12 | 3 | Used for bows |
| Wooden Handle | Component | 1 | null | 6 | Uses 1 normal log; used in crafting assembly |
| Oak Handle | Component | 10 | null | 12 | Uses 1 oak log; used in crafting assembly |
| Willow Handle | Component | 20 | null | 20 | Uses 1 willow log; used in crafting assembly |
| Maple Handle | Component | 30 | null | 32 | Uses 1 maple log; used in crafting assembly |
| Yew Handle | Component | 40 | null | 50 | Uses 1 yew log; used in crafting assembly |
| Plain Staff (Wood) | Magic Equipment | 2 | See crafting | See crafting | Made from 1 normal log; plain-only staff |
| Plain Staff (Oak) | Magic Equipment | 11 | See crafting | See crafting | Made from 1 oak log; later used for fire staff creation |
| Plain Staff (Willow) | Magic Equipment | 21 | See crafting | See crafting | Made from 1 willow log; later used for water staff creation |
| Plain Staff (Maple) | Magic Equipment | 31 | See crafting | See crafting | Made from 1 maple log; later used for earth staff creation |
| Plain Staff (Yew) | Magic Equipment | 41 | See crafting | See crafting | Made from 1 yew log; later used for air staff creation |
| Wooden Shafts x15 | Component | 2 | null | 4 | Made from 1 normal log; used for bronze and iron arrows |
| Oak Shafts x15 | Component | 11 | null | 6 | Made from 1 oak log; used for steel arrows |
| Willow Shafts x15 | Component | 21 | null | 10 | Made from 1 willow log; used for mithril arrows |
| Maple Shafts x15 | Component | 31 | null | 16 | Made from 1 maple log; used for adamant arrows |
| Yew Shafts x15 | Component | 41 | null | 24 | Made from 1 yew log; used for rune arrows |
| Wooden Headless Arrows x15 | Component | 3 | null | 6 | Made from wooden shafts and feathers |
| Oak Headless Arrows x15 | Component | 12 | null | 10 | Made from oak shafts and feathers |
| Willow Headless Arrows x15 | Component | 22 | null | 16 | Made from willow shafts and feathers |
| Maple Headless Arrows x15 | Component | 32 | null | 24 | Made from maple shafts and feathers |
| Yew Headless Arrows x15 | Component | 42 | null | 36 | Made from yew shafts and feathers |
| Bronze Arrows x15 | Ammunition | 1 | null | 8 | Made from bronze arrowheads and wooden headless arrows |
| Iron Arrows x15 | Ammunition | 5 | null | 12 | Made from iron arrowheads and wooden headless arrows |
| Steel Arrows x15 | Ammunition | 12 | null | 20 | Made from steel arrowheads and oak headless arrows |
| Mithril Arrows x15 | Ammunition | 23 | null | 32 | Made from mithril arrowheads and willow headless arrows |
| Adamant Arrows x15 | Ammunition | 34 | null | 50 | Made from adamant arrowheads and maple headless arrows |
| Rune Arrows x15 | Ammunition | 45 | null | 80 | Made from rune arrowheads and yew headless arrows |
| Normal Shortbow (u) | Unstrung Bow | 5 | null | 7 | Cut from 1 normal log |
| Normal Longbow (u) | Unstrung Bow | 3 | null | 6 | Cut from 1 normal log |
| Oak Shortbow (u) | Unstrung Bow | 14 | null | 15 | Cut from 1 oak log |
| Willow Shortbow (u) | Unstrung Bow | 24 | null | 28 | Cut from 1 willow log |
| Maple Shortbow (u) | Unstrung Bow | 34 | null | 46 | Cut from 1 maple log |
| Yew Shortbow (u) | Unstrung Bow | 44 | null | 72 | Cut from 1 yew log |
| Oak Longbow (u) | Unstrung Bow | 12 | null | 14 | Cut from 1 oak log |
| Willow Longbow (u) | Unstrung Bow | 22 | null | 26 | Cut from 1 willow log |
| Maple Longbow (u) | Unstrung Bow | 32 | null | 44 | Cut from 1 maple log |
| Yew Longbow (u) | Unstrung Bow | 42 | null | 70 | Cut from 1 yew log |
| Normal Shortbow | Bow | 5 | null | 12 | Strung from normal shortbow (u); can use bronze and iron arrows |
| Normal Longbow | Bow | 3 | null | 10 | Strung from normal longbow (u); can use bronze and iron arrows |
| Oak Shortbow | Bow | 14 | null | 22 | Strung from oak shortbow (u); can use bronze, iron, and steel arrows |
| Willow Shortbow | Bow | 24 | null | 40 | Strung from willow shortbow (u); can use bronze through mithril arrows |
| Maple Shortbow | Bow | 34 | null | 68 | Strung from maple shortbow (u); can use bronze through adamant arrows |
| Yew Shortbow | Bow | 44 | null | 110 | Strung from yew shortbow (u); can use any arrows |
| Oak Longbow | Bow | 12 | null | 20 | Strung from oak longbow (u); can use bronze, iron, and steel arrows |
| Willow Longbow | Bow | 22 | null | 36 | Strung from willow longbow (u); can use bronze through mithril arrows |
| Maple Longbow | Bow | 32 | null | 62 | Strung from maple longbow (u); can use bronze through adamant arrows |
| Yew Longbow | Bow | 42 | null | 100 | Strung from yew longbow (u); can use any arrows |





