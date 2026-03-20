# Smithing Roadmap

## Canonical Runtime Source

All mechanic/value tables in this roadmap are synchronized against `src/js/skills/specs.js` (version `2026.03.m6`).
Where a skill defers market values to item data, value rows mirror `src/js/content/item-catalog.js`.

## Purpose

Smithing is the processing skill for turning mined ores into bars and turning bars into metal equipment.

The player uses smithing to refine mining outputs into bars, combat gear, metal item parts, and jewelry bases.

## Core Progression

| Smithing Output Tier | Required Level |
| -------------------- | -------------- |
| Bronze               | 1              |
| Iron                 | 1              |
| Steel                | 10             |
| Mithril              | 20             |
| Silver               | 30             |
| Adamant              | 30             |
| Gold                 | 40             |
| Rune                 | 40             |

## Tools

| Tool         | Required Level | Buy Value | Sell Value |
| ------------ | -------------- | --------- | ---------- |
| Hammer       | 1              | 8         | 2          |
| Tiara Mould  | Quest unlock via crafting | null      | null       |
| Ring Mould   | Quest unlock via crafting | null      | null       |
| Amulet Mould | Quest unlock via crafting | null      | null       |

## Mechanics

### Core Rules

| Rule | Description |
| ---- | ----------- |
| Valid Action Requirements | A smithing action can begin only if the player is at the correct station, meets the level requirement, has the required tool or mould, and has the required materials. |
| Fixed Action Time | Each smithing action takes 3 ticks to complete. |
| Guaranteed Success | Smithing actions do not have random failure chances. If the action is valid, it succeeds. |
| Input Consumption | When a smithing action completes, the listed inputs are consumed. |
| Output Creation | When a smithing action completes, the listed output is created. |
| XP Award | When a smithing action completes, the player gains the XP listed for that recipe. |
| Queued Repetition | If the player queued multiple actions, smithing repeats one action every 3 ticks until the queue ends or the requirements stop being met. |

### Global Constants

| Constant                    | Value |
| --------------------------- | ----- |
| Fixed Smithing Action Ticks | 3     |

### Derived Values

| Value           | Formula                         | Purpose                                 |
| --------------- | ------------------------------- | --------------------------------------- |
| Output per Tick | Output per Tick = 1 / 3         | Estimates average smithing output rate  |
| XP per Tick     | XP per Tick = XP per Action / 3 | Estimates average experience gain rate  |

### Smelting Recipes

| Bar         | Required Level | Inputs                   | Output | XP per Action |
| ----------- | -------------- | ------------------------ | ------ | ------------- |
| Bronze Bar  | 1              | 1 Copper Ore + 1 Tin Ore | 1 Bar  | 6             |
| Iron Bar    | 1              | 1 Iron Ore               | 1 Bar  | 8             |
| Steel Bar   | 10             | 1 Iron Ore + 2 Coal      | 1 Bar  | 12            |
| Mithril Bar | 20             | 1 Mithril Ore + 4 Coal   | 1 Bar  | 18            |
| Silver Bar  | 30             | 1 Silver Ore             | 1 Bar  | 14            |
| Adamant Bar | 30             | 1 Adamant Ore + 6 Coal   | 1 Bar  | 24            |
| Gold Bar    | 40             | 1 Gold Ore               | 1 Bar  | 22            |
| Rune Bar    | 40             | 1 Rune Ore + 8 Coal      | 1 Bar  | 32            |

### Standard Forging Recipes

| Item           | Bars Required |
| -------------- | ------------- |
| Sword Blade    | 2             |
| Axe Head       | 2             |
| Pickaxe Head   | 2             |
| Boots          | 2             |
| Helmet         | 5             |
| Shield         | 6             |
| Platelegs      | 7             |
| Platebody      | 9             |
| Arrowheads x15 | 1             |

### Forging XP by Tier and Item

| Item           | Bronze | Iron | Steel | Mithril | Adamant | Rune |
| -------------- | ------ | ---- | ----- | ------- | ------- | ---- |
| Sword Blade    | 8      | 10   | 14    | 20      | 28      | 40   |
| Axe Head       | 8      | 10   | 14    | 20      | 28      | 40   |
| Pickaxe Head   | 8      | 10   | 14    | 20      | 28      | 40   |
| Boots          | 8      | 10   | 14    | 20      | 28      | 40   |
| Helmet         | 20     | 25   | 35    | 50      | 70      | 100  |
| Shield         | 24     | 30   | 42    | 60      | 84      | 120  |
| Platelegs      | 28     | 35   | 49    | 70      | 98      | 140  |
| Platebody      | 36     | 45   | 63    | 90      | 126     | 180  |
| Arrowheads x15 | 4      | 5    | 7     | 10      | 14      | 20   |

### Forging Rules

- Each forgeable metal item has bronze, iron, steel, mithril, adamant, and rune variants unless otherwise noted.
- The required level for a forged item is determined by its metal tier.
- Smithing does not directly create finished held weapons or tools.
- Smithing creates the metal blade or head, fletching creates the base handle, and crafting upgrades that base handle into the strapped handle and performs final assembly.
- Smithing produces the metal parts for those held items rather than completing them directly.

### Jewelry Base Recipes

Silver jewelry bases are the early jewelry-metal band and gold jewelry bases are the higher jewelry-metal band. Smithing forms only the unfinished base pieces from bars and moulds, while crafting owns mould acquisition and unlock progression and performs the later gem-attachment step that defines finished jewelry progression. This keeps smithing aligned with crafting's jewelry progression: silver bases feed the earlier ruby/sapphire band, while gold bases feed the higher ruby/sapphire/emerald/diamond band.

| Output        | Required Level | Inputs       | Tool Requirement | XP per Action |
| ------------- | -------------- | ------------ | ---------------- | ------------- |
| Silver Ring   | 10             | 1 Silver Bar | Ring Mould; permanent crafting-unlock tool | 14            |
| Silver Tiara  | 10             | 1 Silver Bar | Tiara Mould; permanent crafting-unlock tool | 14            |
| Silver Amulet | 10             | 1 Silver Bar | Amulet Mould; permanent crafting-unlock tool | 14            |
| Gold Ring     | 40             | 1 Gold Bar   | Ring Mould; permanent crafting-unlock tool | 22            |
| Gold Tiara    | 40             | 1 Gold Bar   | Tiara Mould; permanent crafting-unlock tool | 22            |
| Gold Amulet   | 40             | 1 Gold Bar   | Amulet Mould; permanent crafting-unlock tool | 22            |

## Station Structure

### Core Station Rules

| Station Type | Purpose |
| ------------ | ------- |
| Furnace      | Converts ores into bars and forms jewelry bases from bars and moulds |
| Anvil        | Converts metal bars into armor, ammunition components, and metal item parts |

### Station Requirements

| Action Type          | Required Station |
| -------------------- | ---------------- |
| Smelting Bars        | Furnace          |
| Forging Equipment    | Anvil            |
| Making Jewelry Bases | Furnace          |

### Station Runtime Rules

| Rule                    | Description                                                                 |
| ----------------------- | --------------------------------------------------------------------------- |
| Station Use             | Smithing actions require the player to stand at the correct station         |
| Default Left Click      | Default left click on a valid smithing option queues exactly 1 action       |
| Right Click Quantity    | Right click on a valid smithing option allows the player to choose 1, 5, X, or ALL |
| One Input Set per Action | Each completed smithing action consumes exactly the listed recipe inputs    |
| One Output per Action   | Each completed smithing action produces exactly one finished output stack entry |
| Repeated Action Queue   | Quantity-based smithing repeats one action every 3 ticks until the queue completes or requirements fail |
| No Failure States       | If the player meets the level and has the materials, the action succeeds    |

## Economy Role

Smithing creates value by converting mined resources into higher-value finished goods and by supplying one part of multi-skill equipment assembly chains.

| Output Type           | Use                                  |
| --------------------- | ------------------------------------ |
| Bars                  | Intermediate processing              |
| Metal Armor           | Combat progression                   |
| Ammunition Components | Fletching support                    |
| Weapon and Tool Parts | Multi-skill equipment assembly       |
| Jewelry Bases         | Upstream unfinished jewelry support for downstream crafting progression |

### Equipment Assembly Role

Held weapons and tools are assembled across multiple skills rather than created fully within smithing alone.

| Finished Item Component | Producing Skill |
| ----------------------- | --------------- |
| Metal blade or head     | Smithing        |
| Base handle             | Fletching       |
| Strapped handle and final assembly | Crafting |

A completed held item requires all of its component parts and the appropriate skill levels to create them. For example, a rune pickaxe requires rune smithing for the rune pickaxe head, fletching for the yew base handle, and crafting to convert that base handle into a Yew Handle w/ Strap and attach the rune head for final assembly.

### Bar Values

| Bar         | Category     | Buy Value | Sell Value |
| ----------- | ------------ | --------- | ---------- |
| Bronze Bar  | Intermediate | null      | 8          |
| Iron Bar    | Intermediate | null      | 16         |
| Steel Bar   | Intermediate | null      | 32         |
| Mithril Bar | Intermediate | null      | 64         |
| Silver Bar  | Intermediate | null      | 45         |
| Adamant Bar | Intermediate | null      | 128        |
| Gold Bar    | Intermediate | null      | 70         |
| Rune Bar    | Intermediate | null      | 256        |

### Tool and Mould Values

| Item         | Buy Value | Sell Value |
| ------------ | --------- | ---------- |
| Hammer       | 8         | 2          |
| Tiara Mould  | null      | null       |
| Ring Mould   | null      | null       |
| Amulet Mould | null      | null       |

## Merchant / NPC Structure

### Borin Ironvein (Dwarf)

Borin introduces the basics of mining and smithing. This NPC helps new players understand ores, furnaces, bars, and the full early-to-mid equipment progression.

**Location:** Near the furnace and anvil in the main settlement smithing area.

**Associated Quests:** None.

| Item       | Buys | Sells |
| ---------- | ---- | ----- |
| Hammer     | 2    | 8     |
| Copper Ore | 3    | 8     |
| Tin Ore    | 3    | 8     |
| Iron Ore   | 7    | 18    |
| Coal       | 12   | 30    |
| Mithril Ore | 60   | 120   |

### Thrain Deepforge (Dwarf)

Thrain is an advanced smithing merchant who deals in the highest-tier metals and late-game forging progression.

**Location:** In the advanced forge district.

**Associated Quests:** Locked behind Thrain's quest before rune material access is granted.

Current implementation shares the mining-side `Proof of the Deepforge` unlock: Thrain opens his advanced ore stock after the player turns in 6 coal, 2 gold ore, and 1 uncut emerald.

| Item        | Buys | Sells |
| ----------- | ---- | ----- |
| Adamant Ore | 150  | 300   |
| Rune Ore    | 600  | 1200  |

### Elira Gemhand (Jeweler)

Elira is the town jeweler and the main jewelry-side bridge into smithing's precious-metal work. She introduces players to silver and gold jewelry base formation in smithing, starts the Gem Mine Quest, and begins the Mould Making Quest. Her role here is to connect the player to the upstream jewelry pipeline—precious-metal bars, mould access, and unfinished jewelry bases—without making smithing the owner of finished jewelry progression.

**Location:** In the town jewelry workshop.

**Associated Quests:** Gem Mine Quest; Mould Making Quest.

| Item       | Buys | Sells |
| ---------- | ---- | ----- |
| Silver Ore | 18   | 45    |
| Gold Ore   | 28   | 70    |

### General Store

The general store buys everything at half price.

## Training Location Structure

| Location Type       | Purpose                                  |
| ------------------- | ---------------------------------------- |
| Starter Furnace     | Early bronze and iron smelting           |
| Starter Anvil       | Early equipment and tool forging         |
| Advanced Forge Area | Higher-tier forging and rune progression |
| Jewelry Workshop    | Furnace access for silver and gold jewelry base creation |

## Dependencies

- Mining
- Combat
- Woodcutting
- Fletching
- Crafting
- Shops / economy
- Quest progression

## Possible Rules

- Bronze and iron smithing are available at level 1.
- All smithing actions are deterministic and do not have random failure chances.
- Bars are never sold by shops and must be created by the player.
- Shops may buy bars but never sell them.
- Metal bar sell values follow the same tier progression used elsewhere in the economy.
- Smithing converts mined resources into higher-value finished items but not every recipe must be profitable.
- Rune material access is quest-gated through Thrain's quest.
- Rune tools and rune combat gear are player-made rather than shop-bought.
- The general store buys all smithing-related items at half price, rounded down.
- Specialty merchants buy and sell only goods relevant to their role.
- Jewelry moulds are acquired through crafting-side quest progression rather than purchased from shops.
- Jewelry moulds are permanent progression tools used by smithing for unfinished jewelry base formation and do not grant smithing its own mould-unlock track.
- Jewelry moulds cannot be sold.
- Smithing forms unfinished silver and gold jewelry bases only; finished jewelry progression is downstream and not defined here.
- The gem mine is unlocked through the Gem Mine Quest associated with Elira.
- The Mould Making Quest begins with Elira and requires the player to borrow example jewelry items from three different NPCs in order to create moulds through crafting.
- Elira guides the player into the jewelry pipeline through gem-mine access, mould-making access, and precious-metal jewelry-base smithing, but she does not make smithing a co-owner of finished jewelry progression.

## Equipment Tables by Tier

These tables describe the smithing output, the completed assembled item where relevant, and the main stats associated with each finished equipment piece.

#### Bronze Equipment

| Item | Smithing Output | Completed Item | Required Smithing Level | Bars Required | Other Skill Requirements | Key Stats |
| ---- | --------------- | -------------- | ----------------------- | ------------- | ------------------------ | --------- |
| Sword | Bronze Sword Blade | Bronze Sword | 1 | 2 | Final assembly in crafting using a Wooden Handle w/ Strap | Attack +4; Strength +4 |
| Axe | Bronze Axe Head | Bronze Axe | 1 | 2 | Final assembly in crafting using a Wooden Handle w/ Strap | Attack +4; Woodcutting Tool Power 4; Speed Bonus Ticks 0 |
| Pickaxe | Bronze Pickaxe Head | Bronze Pickaxe | 1 | 2 | Final assembly in crafting using a Wooden Handle w/ Strap | Attack +4; Mining Tool Power 4; Speed Bonus Ticks 0 |
| Boots | Bronze Boots | Bronze Boots | 1 | 2 | None | Defence +1 |
| Helmet | Bronze Helmet | Bronze Helmet | 1 | 5 | None | Defence +3 |
| Shield | Bronze Shield | Bronze Shield | 1 | 6 | None | Defence +4 |
| Platelegs | Bronze Platelegs | Bronze Platelegs | 1 | 7 | None | Defence +5 |
| Platebody | Bronze Platebody | Bronze Platebody | 1 | 9 | None | Defence +7 |
| Arrowheads x15 | Bronze Arrowheads | Bronze Arrows x15 | 1 | 1 | Arrow shafts and feathers from fletching | Ammunition component |

#### Iron Equipment

| Item | Smithing Output | Completed Item | Required Smithing Level | Bars Required | Other Skill Requirements | Key Stats |
| ---- | --------------- | -------------- | ----------------------- | ------------- | ------------------------ | --------- |
| Sword | Iron Sword Blade | Iron Sword | 1 | 2 | Final assembly in crafting using a Wooden Handle w/ Strap | Attack +6; Strength +6 |
| Axe | Iron Axe Head | Iron Axe | 1 | 2 | Final assembly in crafting using a Wooden Handle w/ Strap | Attack +6; Woodcutting Tool Power 6; Speed Bonus Ticks 1 |
| Pickaxe | Iron Pickaxe Head | Iron Pickaxe | 1 | 2 | Final assembly in crafting using a Wooden Handle w/ Strap | Attack +6; Mining Tool Power 6; Speed Bonus Ticks 1 |
| Boots | Iron Boots | Iron Boots | 1 | 2 | None | Defence +2 |
| Helmet | Iron Helmet | Iron Helmet | 1 | 5 | None | Defence +5 |
| Shield | Iron Shield | Iron Shield | 1 | 6 | None | Defence +6 |
| Platelegs | Iron Platelegs | Iron Platelegs | 1 | 7 | None | Defence +8 |
| Platebody | Iron Platebody | Iron Platebody | 1 | 9 | None | Defence +10 |
| Arrowheads x15 | Iron Arrowheads | Iron Arrows x15 | 1 | 1 | Arrow shafts and feathers from fletching | Ammunition component |

#### Steel Equipment

| Item | Smithing Output | Completed Item | Required Smithing Level | Bars Required | Other Skill Requirements | Key Stats |
| ---- | --------------- | -------------- | ----------------------- | ------------- | ------------------------ | --------- |
| Sword | Steel Sword Blade | Steel Sword | 10 | 2 | Final assembly in crafting using an Oak Handle w/ Strap | Attack +10; Strength +10 |
| Axe | Steel Axe Head | Steel Axe | 10 | 2 | Final assembly in crafting using an Oak Handle w/ Strap | Attack +10; Woodcutting Tool Power 10; Speed Bonus Ticks 2 |
| Pickaxe | Steel Pickaxe Head | Steel Pickaxe | 10 | 2 | Final assembly in crafting using an Oak Handle w/ Strap | Attack +10; Mining Tool Power 10; Speed Bonus Ticks 2 |
| Boots | Steel Boots | Steel Boots | 10 | 2 | None | Defence +3 |
| Helmet | Steel Helmet | Steel Helmet | 10 | 5 | None | Defence +8 |
| Shield | Steel Shield | Steel Shield | 10 | 6 | None | Defence +10 |
| Platelegs | Steel Platelegs | Steel Platelegs | 10 | 7 | None | Defence +12 |
| Platebody | Steel Platebody | Steel Platebody | 10 | 9 | None | Defence +15 |
| Arrowheads x15 | Steel Arrowheads | Steel Arrows x15 | 10 | 1 | Arrow shafts and feathers from fletching | Ammunition component |

#### Mithril Equipment

| Item | Smithing Output | Completed Item | Required Smithing Level | Bars Required | Other Skill Requirements | Key Stats |
| ---- | --------------- | -------------- | ----------------------- | ------------- | ------------------------ | --------- |
| Sword | Mithril Sword Blade | Mithril Sword | 20 | 2 | Final assembly in crafting using a Willow Handle w/ Strap | Attack +15; Strength +15 |
| Axe | Mithril Axe Head | Mithril Axe | 20 | 2 | Final assembly in crafting using a Willow Handle w/ Strap | Attack +15; Woodcutting Tool Power 15; Speed Bonus Ticks 3 |
| Pickaxe | Mithril Pickaxe Head | Mithril Pickaxe | 20 | 2 | Final assembly in crafting using a Willow Handle w/ Strap | Attack +15; Mining Tool Power 15; Speed Bonus Ticks 3 |
| Boots | Mithril Boots | Mithril Boots | 20 | 2 | None | Defence +5 |
| Helmet | Mithril Helmet | Mithril Helmet | 20 | 5 | None | Defence +12 |
| Shield | Mithril Shield | Mithril Shield | 20 | 6 | None | Defence +15 |
| Platelegs | Mithril Platelegs | Mithril Platelegs | 20 | 7 | None | Defence +18 |
| Platebody | Mithril Platebody | Mithril Platebody | 20 | 9 | None | Defence +22 |
| Arrowheads x15 | Mithril Arrowheads | Mithril Arrows x15 | 20 | 1 | Arrow shafts and feathers from fletching | Ammunition component |

#### Adamant Equipment

| Item | Smithing Output | Completed Item | Required Smithing Level | Bars Required | Other Skill Requirements | Key Stats |
| ---- | --------------- | -------------- | ----------------------- | ------------- | ------------------------ | --------- |
| Sword | Adamant Sword Blade | Adamant Sword | 30 | 2 | Final assembly in crafting using a Maple Handle w/ Strap | Attack +21; Strength +21 |
| Axe | Adamant Axe Head | Adamant Axe | 30 | 2 | Final assembly in crafting using a Maple Handle w/ Strap | Attack +21; Woodcutting Tool Power 21; Speed Bonus Ticks 4 |
| Pickaxe | Adamant Pickaxe Head | Adamant Pickaxe | 30 | 2 | Final assembly in crafting using a Maple Handle w/ Strap | Attack +21; Mining Tool Power 21; Speed Bonus Ticks 4 |
| Boots | Adamant Boots | Adamant Boots | 30 | 2 | None | Defence +7 |
| Helmet | Adamant Helmet | Adamant Helmet | 30 | 5 | None | Defence +17 |
| Shield | Adamant Shield | Adamant Shield | 30 | 6 | None | Defence +21 |
| Platelegs | Adamant Platelegs | Adamant Platelegs | 30 | 7 | None | Defence +25 |
| Platebody | Adamant Platebody | Adamant Platebody | 30 | 9 | None | Defence +30 |
| Arrowheads x15 | Adamant Arrowheads | Adamant Arrows x15 | 30 | 1 | Arrow shafts and feathers from fletching | Ammunition component |

#### Rune Equipment

| Item | Smithing Output | Completed Item | Required Smithing Level | Bars Required | Other Skill Requirements | Key Stats |
| ---- | --------------- | -------------- | ----------------------- | ------------- | ------------------------ | --------- |
| Sword | Rune Sword Blade | Rune Sword | 40 | 2 | Final assembly in crafting using a Yew Handle w/ Strap | Attack +28; Strength +28 |
| Axe | Rune Axe Head | Rune Axe | 40 | 2 | Final assembly in crafting using a Yew Handle w/ Strap | Attack +28; Woodcutting Tool Power 28; Speed Bonus Ticks 5 |
| Pickaxe | Rune Pickaxe Head | Rune Pickaxe | 40 | 2 | Final assembly in crafting using a Yew Handle w/ Strap | Attack +28; Mining Tool Power 28; Speed Bonus Ticks 5 |
| Boots | Rune Boots | Rune Boots | 40 | 2 | None | Defence +10 |
| Helmet | Rune Helmet | Rune Helmet | 40 | 5 | None | Defence +24 |
| Shield | Rune Shield | Rune Shield | 40 | 6 | None | Defence +28 |
| Platelegs | Rune Platelegs | Rune Platelegs | 40 | 7 | None | Defence +34 |
| Platebody | Rune Platebody | Rune Platebody | 40 | 9 | None | Defence +40 |
| Arrowheads x15 | Rune Arrowheads | Rune Arrows x15 | 40 | 1 | Arrow shafts and feathers from fletching | Ammunition component |

## Metal Component Item Definitions

These item definitions are the canonical smithing-side source of truth for smithing-made held-item components and ammunition components. These are real downstream items used by other skills and should not be inferred only from recipe prose.

| Item | Category | Required Smithing Level | Buy Value | Sell Value | Notes |
| ---- | -------- | ----------------------- | --------- | ---------- | ----- |
| Bronze Sword Blade | Metal Component | 1 | null | null | Smithing-made sword component used in crafting to assemble a Bronze Sword with a Wooden Handle w/ Strap |
| Iron Sword Blade | Metal Component | 1 | null | null | Smithing-made sword component used in crafting to assemble an Iron Sword with a Wooden Handle w/ Strap |
| Steel Sword Blade | Metal Component | 10 | null | null | Smithing-made sword component used in crafting to assemble a Steel Sword with an Oak Handle w/ Strap |
| Mithril Sword Blade | Metal Component | 20 | null | null | Smithing-made sword component used in crafting to assemble a Mithril Sword with a Willow Handle w/ Strap |
| Adamant Sword Blade | Metal Component | 30 | null | null | Smithing-made sword component used in crafting to assemble an Adamant Sword with a Maple Handle w/ Strap |
| Rune Sword Blade | Metal Component | 40 | null | null | Smithing-made sword component used in crafting to assemble a Rune Sword with a Yew Handle w/ Strap |
| Bronze Axe Head | Metal Component | 1 | null | null | Smithing-made axe component used in crafting to assemble a Bronze Axe with a Wooden Handle w/ Strap |
| Iron Axe Head | Metal Component | 1 | null | null | Smithing-made axe component used in crafting to assemble an Iron Axe with a Wooden Handle w/ Strap |
| Steel Axe Head | Metal Component | 10 | null | null | Smithing-made axe component used in crafting to assemble a Steel Axe with an Oak Handle w/ Strap |
| Mithril Axe Head | Metal Component | 20 | null | null | Smithing-made axe component used in crafting to assemble a Mithril Axe with a Willow Handle w/ Strap |
| Adamant Axe Head | Metal Component | 30 | null | null | Smithing-made axe component used in crafting to assemble an Adamant Axe with a Maple Handle w/ Strap |
| Rune Axe Head | Metal Component | 40 | null | null | Smithing-made axe component used in crafting to assemble a Rune Axe with a Yew Handle w/ Strap |
| Bronze Pickaxe Head | Metal Component | 1 | null | null | Smithing-made pickaxe component used in crafting to assemble a Bronze Pickaxe with a Wooden Handle w/ Strap |
| Iron Pickaxe Head | Metal Component | 1 | null | null | Smithing-made pickaxe component used in crafting to assemble an Iron Pickaxe with a Wooden Handle w/ Strap |
| Steel Pickaxe Head | Metal Component | 10 | null | null | Smithing-made pickaxe component used in crafting to assemble a Steel Pickaxe with an Oak Handle w/ Strap |
| Mithril Pickaxe Head | Metal Component | 20 | null | null | Smithing-made pickaxe component used in crafting to assemble a Mithril Pickaxe with a Willow Handle w/ Strap |
| Adamant Pickaxe Head | Metal Component | 30 | null | null | Smithing-made pickaxe component used in crafting to assemble an Adamant Pickaxe with a Maple Handle w/ Strap |
| Rune Pickaxe Head | Metal Component | 40 | null | null | Smithing-made pickaxe component used in crafting to assemble a Rune Pickaxe with a Yew Handle w/ Strap |
| Bronze Arrowheads | Ammunition Component | 1 | null | null | Smithing-made arrowhead bundle used in fletching with Wooden Headless Arrows x15 to create Bronze Arrows x15 |
| Iron Arrowheads | Ammunition Component | 1 | null | null | Smithing-made arrowhead bundle used in fletching with Wooden Headless Arrows x15 to create Iron Arrows x15 |
| Steel Arrowheads | Ammunition Component | 10 | null | null | Smithing-made arrowhead bundle used in fletching with Oak Headless Arrows x15 to create Steel Arrows x15 |
| Mithril Arrowheads | Ammunition Component | 20 | null | null | Smithing-made arrowhead bundle used in fletching with Willow Headless Arrows x15 to create Mithril Arrows x15 |
| Adamant Arrowheads | Ammunition Component | 30 | null | null | Smithing-made arrowhead bundle used in fletching with Maple Headless Arrows x15 to create Adamant Arrows x15 |
| Rune Arrowheads | Ammunition Component | 40 | null | null | Smithing-made arrowhead bundle used in fletching with Yew Headless Arrows x15 to create Rune Arrows x15 |

## Item List

### Bars

- Bronze Bar
- Iron Bar
- Steel Bar
- Mithril Bar
- Silver Bar
- Adamant Bar
- Gold Bar
- Rune Bar

### Tools and Moulds

- Hammer
- Tiara Mould
- Ring Mould
- Amulet Mould

### Metal Equipment

- Bronze Boots
- Bronze Helmet
- Bronze Shield
- Bronze Platelegs
- Bronze Platebody
- Bronze Arrowheads
- Iron Boots
- Iron Helmet
- Iron Shield
- Iron Platelegs
- Iron Platebody
- Iron Arrowheads
- Steel Boots
- Steel Helmet
- Steel Shield
- Steel Platelegs
- Steel Platebody
- Steel Arrowheads
- Mithril Boots
- Mithril Helmet
- Mithril Shield
- Mithril Platelegs
- Mithril Platebody
- Mithril Arrowheads
- Adamant Boots
- Adamant Helmet
- Adamant Shield
- Adamant Platelegs
- Adamant Platebody
- Adamant Arrowheads
- Rune Boots
- Rune Helmet
- Rune Shield
- Rune Platelegs
- Rune Platebody
- Rune Arrowheads

### Metal Components

- Bronze Sword Blade
- Bronze Axe Head
- Bronze Pickaxe Head
- Iron Sword Blade
- Iron Axe Head
- Iron Pickaxe Head
- Steel Sword Blade
- Steel Axe Head
- Steel Pickaxe Head
- Mithril Sword Blade
- Mithril Axe Head
- Mithril Pickaxe Head
- Adamant Sword Blade
- Adamant Axe Head
- Adamant Pickaxe Head
- Rune Sword Blade
- Rune Axe Head
- Rune Pickaxe Head

### Jewelry Bases

- Silver Ring
- Silver Tiara
- Silver Amulet
- Gold Ring
- Gold Tiara
- Gold Amulet



