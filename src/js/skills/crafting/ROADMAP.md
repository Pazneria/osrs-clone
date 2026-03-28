# Crafting Roadmap

## Canonical Runtime Source

All mechanic/value tables in this roadmap are synchronized against `src/js/skills/specs.js` (version `2026.03.m6`).
Where a skill defers market values to item data, value rows mirror `src/js/content/item-catalog.js`.

## Purpose

Crafting is the processing and assembly skill for turning gathered and processed materials into finished utility items, jewelry, and assembled equipment.

The player uses crafting to convert clay, gems, handles, jewelry bases, staffs, and other components into finished items that feed into combat, magic, and multi-skill equipment progression.

## Core Progression

| Required Level | Crafting Unlocks                                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1              | Wooden Handle w/ Strap Assembly; Bronze Sword / Axe / Pickaxe Assembly; Iron Sword / Axe / Pickaxe Assembly; Clay |
| 10             | Oak Handle w/ Strap Assembly; Steel Sword / Axe / Pickaxe Assembly; Silver Jewelry Gem Attachment; Ruby Gem Cutting; Fire Staff Attachment |
| 20             | Willow Handle w/ Strap Assembly; Mithril Sword / Axe / Pickaxe Assembly; Sapphire Gem Cutting; Water Staff Attachment |
| 30             | Maple Handle w/ Strap Assembly; Adamant Sword / Axe / Pickaxe Assembly; Emerald Gem Cutting; Earth Staff Attachment |
| 40             | Yew Handle w/ Strap Assembly; Rune Sword / Axe / Pickaxe Assembly; Gold Jewelry Gem Attachment; Diamond Gem Cutting; Air Staff Attachment |

Silver jewelry is the lower-tier finished jewelry band. Gold jewelry is the higher-tier finished jewelry band.

Smithing supplies unfinished silver and gold jewelry bases, but crafting owns the canonical gem-attachment progression and resulting finished jewelry progression.

## Tools

| Tool | Required Level | Buy Value | Sell Value |
| ---- | -------------- | --------- | ---------- |
| Chisel | 1 | 4 | 1 |
| Needle | 1 | 4 | 1 |
| Thread | 1 | 2 | 1 |
| Ring Mould | Quest unlock | null | null |
| Amulet Mould | Quest unlock | null | null |
| Tiara Mould | Quest unlock | null | null |

## Mechanics

### Core Rules

| Rule                      | Description                                                                                                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Valid Action Requirements | A crafting action can begin only if the player meets the level requirement and has the required materials. If a recipe requires a station, the player must also be at the correct station. |
| Fixed Action Time | Strapped handle assembly and metal-part attachment happen immediately on the same tick the valid item-on-item action is used. Soft clay creation also happens immediately per use, one item at a time. Other crafting actions take 3 ticks unless a recipe explicitly says otherwise. |
| Guaranteed Success | Crafting actions do not have random failure chances under the base model. If the action is valid, it succeeds immediately for same-tick equipment assembly actions. |
| Input Consumption         | When a crafting action completes, the listed inputs are consumed.                                                                                                                          |
| Output Creation           | When a crafting action completes, the listed output is created.                                                                                                                            |
| XP Award | The player gains the XP listed for each completed recipe. Strapped handle assembly and final metal-part attachment each grant their own XP, with most XP weighted toward the final assembly step. |
| Queued Repetition | Multi-quantity queueing applies only where a crafting interface or repeated action flow exists. Same-tick item-on-item equipment assembly actions resolve immediately per use. Soft clay creation resolves one item at a time per use. |

### Global Constants

| Constant                    | Value |
| --------------------------- | ----- |
| Fixed Crafting Action Ticks | 3 |

### Derived Values

| Value           | Formula                                                   | Purpose                                |
| --------------- | --------------------------------------------------------- | -------------------------------------- |
| Output per Tick | Output per Tick = 1 / 3 | Estimates average crafting output rate for standard non-instant crafting actions |
| XP per Tick     | XP per Tick = XP per Action / 3 | Estimates average experience gain rate for standard non-instant crafting actions |
| Sell Value per Tick | Sell Value per Tick = Sell Value / Action Ticks | Estimates direct-sale value throughput for crafting outputs with a defined merchant sell row |

## Core Recipe Structure

### Material Families

| Family             | Main Inputs                                 | Main Outputs                                   |
| ------------------ | ------------------------------------------- | ---------------------------------------------- |
| Clay               | Clay                                        | Pots, bowls, utility vessels, other clay goods |
| Jewelry            | Jewelry bases, uncut gems, cut gems, mould outputs | Rings, amulets, tiaras, gemmed jewelry         |
| Staff Assembly     | Fletched staffs, cut gems | Fire, water, earth, air staffs |
| Equipment Assembly | Metal parts, shared wooden handle family, leather straps | Swords, axes, pickaxes                         |
| Soft Goods / Misc. | TBD                                         | TBD                                            |

### Confirmed Cross-Skill Assembly Role

These recipes are already implied by the other specs and should be treated as core crafting territory unless changed later.

| Finished Item    | Inputs                                              | Upstream Skills                 |
| ---------------- | --------------------------------------------------- | ------------------------------- |
| Sword            | Metal sword blade + strapped handle                 | Smithing + Fletching + Crafting |
| Axe              | Metal axe head + strapped handle                    | Smithing + Fletching + Crafting |
| Pickaxe          | Metal pickaxe head + strapped handle                | Smithing + Fletching + Crafting |
| Jewelry Moulds   | Borrowed example jewelry items + soft clay + fired mould processing | Quest / Crafting                |
| Finished Jewelry | Smithing-made jewelry base + optional cut gem components | Smithing + Mining + Crafting |
| Base Jewelry Creation | Metal bar + matching mould at a furnace | Smithing + Crafting tool unlocks |
| Elemental Staff | Matching-tier fletched staff + matching cut gem | Fletching + Mining + Crafting |

### Leather Progression

| Leather Type   | Required Level | Primary Role                                        |
| -------------- | -------------- | --------------------------------------------------- |
| Normal Leather | 1              | Early strapped handles and early equipment assembly |
| Wolf Leather   | 20             | Mid-tier strapped handles and equipment assembly    |
| Bear Leather   | 40             | High-tier strapped handles and equipment assembly   |

### Equipment Assembly Tier Mapping

This table reflects the tier mapping already established elsewhere.

| Metal Tier | Required Metal Part | Required Base Handle | Required Leather | Strapped Handle Output |
| ---------- | ------------------- | -------------------- | ---------------- | ---------------------- |
| Bronze     | Bronze component    | Wooden Handle        | Normal Leather   | Wooden Handle w/ Strap |
| Iron       | Iron component      | Wooden Handle        | Normal Leather   | Wooden Handle w/ Strap |
| Steel      | Steel component     | Oak Handle           | Normal Leather   | Oak Handle w/ Strap    |
| Mithril    | Mithril component   | Willow Handle        | Wolf Leather     | Willow Handle w/ Strap |
| Adamant    | Adamant component   | Maple Handle         | Wolf Leather     | Maple Handle w/ Strap  |
| Rune       | Rune component      | Yew Handle           | Bear Leather     | Yew Handle w/ Strap    |

Shared handles can be used with any matching sword blade, axe head, or pickaxe head for that tier.

Strapped handles can also be used with lower-tier matching metal parts across all three categories: swords, axes, and pickaxes. If the player tries to use a strapped handle on a lower-tier metal part, the game shows an "are you sure?" confirmation before completing the assembly.

Confirming the action produces the normal lower-tier finished item. The item is not renamed, gains no stat bonus, and cannot be disassembled.

Current implementation uses an immediate yes/no confirmation that explicitly warns about the no-bonus and no-disassembly tradeoff before consuming the higher-tier handle.

### Initial Strapped Handle Recipes

| Output                 | Required Level | Inputs                         | Tool / Station Requirement | XP per Action | Notes                                       |
| ---------------------- | -------------- | ------------------------------ | -------------------------- | ------------- | ------------------------------------------- |
| Wooden Handle w/ Strap | 1 | Wooden Handle + Normal Leather | None; item-on-item anywhere | 2 | Immediate same-tick craft; grants its own XP; used for bronze and iron equipment assembly |
| Oak Handle w/ Strap | 10 | Oak Handle + Normal Leather | None; item-on-item anywhere | 4 | Immediate same-tick craft; grants its own XP; used for steel equipment assembly |
| Willow Handle w/ Strap | 20 | Willow Handle + Wolf Leather | None; item-on-item anywhere | 8 | Immediate same-tick craft; grants its own XP; used for mithril equipment assembly |
| Maple Handle w/ Strap | 30 | Maple Handle + Wolf Leather | None; item-on-item anywhere | 12 | Immediate same-tick craft; grants its own XP; used for adamant equipment assembly |
| Yew Handle w/ Strap | 40 | Yew Handle + Bear Leather | None; item-on-item anywhere | 18 | Immediate same-tick craft; grants its own XP; used for rune equipment assembly |

### Initial Equipment Assembly Recipes

| Output          | Required Level | Inputs                                        | Tool / Station Requirement | XP per Action | Notes                 |
| --------------- | -------------- | --------------------------------------------- | -------------------------- | ------------- | --------------------- |
| Bronze Sword | 1 | Bronze Sword Blade + Wooden Handle w/ Strap | None; item-on-item anywhere | 4 | Immediate same-tick craft; grants its own XP; completed held weapon |
| Iron Sword | 1 | Iron Sword Blade + Wooden Handle w/ Strap | None; item-on-item anywhere | 5 | Immediate same-tick craft; grants its own XP; completed held weapon |
| Steel Sword | 10 | Steel Sword Blade + Oak Handle w/ Strap | None; item-on-item anywhere | 8 | Immediate same-tick craft; grants its own XP; completed held weapon |
| Mithril Sword | 20 | Mithril Sword Blade + Willow Handle w/ Strap | None; item-on-item anywhere | 14 | Immediate same-tick craft; grants its own XP; completed held weapon |
| Adamant Sword | 30 | Adamant Sword Blade + Maple Handle w/ Strap | None; item-on-item anywhere | 22 | Immediate same-tick craft; grants its own XP; completed held weapon |
| Rune Sword | 40 | Rune Sword Blade + Yew Handle w/ Strap | None; item-on-item anywhere | 32 | Immediate same-tick craft; grants its own XP; completed held weapon |
| Bronze Axe | 1 | Bronze Axe Head + Wooden Handle w/ Strap | None; item-on-item anywhere | 4 | Immediate same-tick craft; grants its own XP; completed held tool |
| Iron Axe | 1 | Iron Axe Head + Wooden Handle w/ Strap | None; item-on-item anywhere | 5 | Immediate same-tick craft; grants its own XP; completed held tool |
| Steel Axe | 10 | Steel Axe Head + Oak Handle w/ Strap | None; item-on-item anywhere | 8 | Immediate same-tick craft; grants its own XP; completed held tool |
| Mithril Axe | 20 | Mithril Axe Head + Willow Handle w/ Strap | None; item-on-item anywhere | 14 | Immediate same-tick craft; grants its own XP; completed held tool |
| Adamant Axe | 30 | Adamant Axe Head + Maple Handle w/ Strap | None; item-on-item anywhere | 22 | Immediate same-tick craft; grants its own XP; completed held tool |
| Rune Axe | 40 | Rune Axe Head + Yew Handle w/ Strap | None; item-on-item anywhere | 32 | Immediate same-tick craft; grants its own XP; completed held tool |
| Bronze Pickaxe | 1 | Bronze Pickaxe Head + Wooden Handle w/ Strap | None; item-on-item anywhere | 4 | Immediate same-tick craft; grants its own XP; completed held tool |
| Iron Pickaxe | 1 | Iron Pickaxe Head + Wooden Handle w/ Strap | None; item-on-item anywhere | 5 | Immediate same-tick craft; grants its own XP; completed held tool |
| Steel Pickaxe | 10 | Steel Pickaxe Head + Oak Handle w/ Strap | None; item-on-item anywhere | 8 | Immediate same-tick craft; grants its own XP; completed held tool |
| Mithril Pickaxe | 20 | Mithril Pickaxe Head + Willow Handle w/ Strap | None; item-on-item anywhere | 14 | Immediate same-tick craft; grants its own XP; completed held tool |
| Adamant Pickaxe | 30 | Adamant Pickaxe Head + Maple Handle w/ Strap | None; item-on-item anywhere | 22 | Immediate same-tick craft; grants its own XP; completed held tool |
| Rune Pickaxe | 40 | Rune Pickaxe Head + Yew Handle w/ Strap | None; item-on-item anywhere | 32 | Immediate same-tick craft; grants its own XP; completed held tool |

### Gem Progression

Gems are mined in uncut form, then processed through crafting into cut gems before being used in jewelry.

Gem ordering follows the elemental color mapping used in runecrafting, in this order:
- Fire = Ruby
- Water = Sapphire
- Earth = Emerald
- Air = Diamond

| Gem Order | Gem Type | Elemental Color Mapping | Mining Form | Crafting Output |
| --------- | -------- | ----------------------- | ----------- | --------------- |
| 1 | Ruby | Fire | Uncut Ruby | Cut Ruby |
| 2 | Sapphire | Water | Uncut Sapphire | Cut Sapphire |
| 3 | Emerald | Earth | Uncut Emerald | Cut Emerald |
| 4 | Diamond | Air | Uncut Diamond | Cut Diamond |

### Gem Cutting Recipes

| Output | Required Level | Inputs | Tool / Station Requirement | XP per Action | Notes |
| ------ | -------------- | ------ | -------------------------- | ------------- | ----- |
| Cut Ruby | 10 | Uncut Ruby | Chisel required; not consumed | 4 | Follows fire gem progression |
| Cut Sapphire | 20 | Uncut Sapphire | Chisel required; not consumed | 8 | Follows water gem progression |
| Cut Emerald | 30 | Uncut Emerald | Chisel required; not consumed | 14 | Follows earth gem progression |
| Cut Diamond | 40 | Uncut Diamond | Chisel required; not consumed | 22 | Follows air gem progression |

### Jewelry Quest Lock

Jewelry production is quest-locked through the jewelry mould questline.

The player must find three NPCs willing to let them borrow one example piece each:
- Ring
- Amulet
- Tiara

The player then:
1. Makes soft clay by using clay on water.
2. Uses soft clay on the borrowed jewelry piece to create an imprinted clay mould.
3. Fires the imprinted clay mould to create the finished jewelry mould.

Current implementation uses Elira's borrowed ring/amulet/tiara examples, immediate clay-on-water conversion, immediate inventory imprinting, and active-fire firing for the mould-finishing step.

Once the relevant mould is unlocked, that jewelry family can be produced normally.

### Initial Jewelry Structure

Crafting is the canonical owner of finished jewelry progression.

Smithing creates the unfinished silver and gold jewelry bases using bars and the matching moulds, but crafting defines how those base families progress into finished jewelry through gem attachment.

Silver jewelry is the lower-tier finished jewelry base family and gold jewelry is the higher-tier finished jewelry base family.

| Output Family  | Base Inputs | Notes |
| -------------- | ----------- | ----- |
| Silver Jewelry | Smithing-made silver jewelry base + matching mould unlock | Lower-tier finished jewelry family. Mould ownership remains quest-unlock based in crafting. Silver jewelry is restricted to ruby and sapphire gem attachment. |
| Gold Jewelry   | Smithing-made gold jewelry base + matching mould unlock   | Higher-tier finished jewelry family. Mould ownership remains quest-unlock based in crafting. Gold jewelry can use ruby, sapphire, emerald, and diamond. |
| Gemmed Jewelry | Jewelry base + cut gem | Gem attachment is a separate crafting step after base jewelry creation. Crafting owns the finished jewelry progression band and resulting gemmed jewelry outcomes. Silver jewelry is restricted to ruby and sapphire; gold jewelry can use ruby, sapphire, emerald, and diamond. |

### Gem Attachment Recipes

| Output | Required Level | Inputs | Tool / Station Requirement | XP per Action | Notes |
| ------ | -------------- | ------ | -------------------------- | ------------- | ----- |
| Ruby Silver Ring | 10 | Silver Ring + Cut Ruby | None; immediate if only one valid output | 4 | Unique gemmed jewelry item |
| Ruby Silver Amulet | 10 | Silver Amulet + Cut Ruby | None; immediate if only one valid output | 4 | Unique gemmed jewelry item |
| Ruby Silver Tiara | 10 | Silver Tiara + Cut Ruby | None; immediate if only one valid output | 4 | Unique gemmed jewelry item |
| Sapphire Silver Ring | 20 | Silver Ring + Cut Sapphire | None; immediate if only one valid output | 8 | Unique gemmed jewelry item |
| Sapphire Silver Amulet | 20 | Silver Amulet + Cut Sapphire | None; immediate if only one valid output | 8 | Unique gemmed jewelry item |
| Sapphire Silver Tiara | 20 | Silver Tiara + Cut Sapphire | None; immediate if only one valid output | 8 | Unique gemmed jewelry item |
| Ruby Gold Ring | 40 | Gold Ring + Cut Ruby | None; immediate if only one valid output | 4 | Unique gemmed jewelry item |
| Ruby Gold Amulet | 40 | Gold Amulet + Cut Ruby | None; immediate if only one valid output | 4 | Unique gemmed jewelry item |
| Ruby Gold Tiara | 40 | Gold Tiara + Cut Ruby | None; immediate if only one valid output | 4 | Unique gemmed jewelry item |
| Sapphire Gold Ring | 40 | Gold Ring + Cut Sapphire | None; immediate if only one valid output | 8 | Unique gemmed jewelry item |
| Sapphire Gold Amulet | 40 | Gold Amulet + Cut Sapphire | None; immediate if only one valid output | 8 | Unique gemmed jewelry item |
| Sapphire Gold Tiara | 40 | Gold Tiara + Cut Sapphire | None; immediate if only one valid output | 8 | Unique gemmed jewelry item |
| Emerald Gold Ring | 40 | Gold Ring + Cut Emerald | None; immediate if only one valid output | 14 | Unique gemmed jewelry item |
| Emerald Gold Amulet | 40 | Gold Amulet + Cut Emerald | None; immediate if only one valid output | 14 | Unique gemmed jewelry item |
| Emerald Gold Tiara | 40 | Gold Tiara + Cut Emerald | None; immediate if only one valid output | 14 | Unique gemmed jewelry item |
| Diamond Gold Ring | 40 | Gold Ring + Cut Diamond | None; immediate if only one valid output | 22 | Unique gemmed jewelry item |
| Diamond Gold Amulet | 40 | Gold Amulet + Cut Diamond | None; immediate if only one valid output | 22 | Unique gemmed jewelry item |
| Diamond Gold Tiara | 40 | Gold Tiara + Cut Diamond | None; immediate if only one valid output | 22 | Unique gemmed jewelry item |

The three mould families map directly to the three jewelry categories:
- Ring Mould -> Rings
- Amulet Mould -> Amulets
- Tiara Mould -> Tiaras

All three jewelry categories can also have gems attached using the same mechanics.

### Initial Staff Structure

Plain staffs are made through fletching by turning 1 log into 1 staff of that log type.

Normal logs make a plain wood staff that cannot have a gem attached.

Crafting then attaches the matching cut gem to the matching staff tier to create an elemental staff.

Elemental mapping follows the same gem-color ordering used elsewhere:
- Fire Staff = Oak Staff + Cut Ruby
- Water Staff = Willow Staff + Cut Sapphire
- Earth Staff = Maple Staff + Cut Emerald
- Air Staff = Yew Staff + Cut Diamond

| Output | Required Level | Inputs | Tool / Station Requirement | XP per Action | Notes |
| ------ | -------------- | ------ | -------------------------- | ------------- | ----- |
| Fire Staff | 10 | Plain Staff (Oak) + Cut Ruby | None; immediate if only one valid output | 4 | Unique elemental staff item |
| Water Staff | 20 | Plain Staff (Willow) + Cut Sapphire | None; immediate if only one valid output | 8 | Unique elemental staff item |
| Earth Staff | 30 | Plain Staff (Maple) + Cut Emerald | None; immediate if only one valid output | 14 | Unique elemental staff item |
| Air Staff | 40 | Plain Staff (Yew) + Cut Diamond | None; immediate if only one valid output | 22 | Unique elemental staff item |

### Initial Clay Structure

| Output Family | Base Inputs | Notes                                                                 |
| ------------- | ----------- | --------------------------------------------------------------------- |
| Clay Goods    | Clay        | Early crafting foundation and supports soft clay / jewelry moulding |
| Soft Clay     | Clay + Water | Created by using clay on a water source, one item at a time; used to imprint borrowed jewelry items during the jewelry mould questline |

## Station Structure

### Core Station Rules

| Station Type         | Purpose                                                           |
| -------------------- | ----------------------------------------------------------------- |
| Inventory / Anywhere | Used for item-on-item assembly if no station is required          |
| Crafting Station     | Used for recipes that need a dedicated bench, wheel, or worktable |
| Furnace / Kiln       | Used for recipes that require heating or firing                   |

### Runtime Rules

| Rule                     | Description                                                                                                                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Station Requirement      | Some crafting recipes may be done anywhere, while others require a dedicated station. Strapped handle assembly, metal-part attachment, gem attachment, and staff attachment are inventory actions and do not require a station. |
| Default Left Click | For same-tick item-on-item equipment assembly, using one valid item on the other performs the craft immediately with no menu. For inventory crafting interfaces, default left click queues exactly 1 action. |
| Right Click Quantity | Quantity selection applies only to crafting interfaces that use menus. Same-tick equipment assembly has no make menu. Gem attachment opens an interface only when multiple valid outputs exist. |
| One Input Set per Action | Each completed crafting action consumes exactly the listed recipe inputs.                                                                                                                    |
| One Output per Action    | Each completed crafting action produces exactly the listed recipe output. Same-tick item-on-item equipment assembly uses normal inventory replacement behavior: one input is replaced by the output and the other input is removed. |
| Repeated Action Queue    | Quantity-based crafting repeats one standard crafting action every 3 ticks until the queue completes or requirements fail. Same-tick equipment assembly actions do not enter a timed queue. |
| No Failure States | If the player meets the level and has the materials, the action succeeds. Invalid equipment assembly combinations fail with a simple "these don't match" style message. Valid lower-tier metal-part combinations using a higher-tier strapped handle prompt an "are you sure?" confirmation before completing, then produce the normal lower-tier finished item with no stat bonus. |

## Economy Role

Crafting creates value by converting raw and intermediate materials into more specialized finished goods and by completing multi-skill assembly chains.

| Output Type              | Use                                                     |
| ------------------------ | ------------------------------------------------------- |
| Clay Goods               | Utility, quest items, or downstream crafting support    |
| Jewelry                  | Magic support, value storage, wearable progression      |
| Jewelry Mould Questline | Unlocks ring, amulet, and tiara mould access |
| Gem Cutting              | Converts mined uncut gems into cut gems for jewelry use; requires a chisel that is not consumed |
| Gemmed Jewelry           | Higher-value magic or wearable progression              |
| Elemental Staffs         | Magic equipment progression; authoritative plain staff and elemental staff values are defined in crafting |
| Finished Weapons / Tools | Combat, woodcutting, and mining progression             |
| Moulds                   | Unlocks jewelry production in crafting             |

### Cross-Skill Inputs Already Established

| Input                                          | Source Skill                    |
| ---------------------------------------------- | ------------------------------- |
| Clay                                           | Mining                          |
| Silver Ore / Gold Ore / Uncut Gems             | Mining                          |
| Cut Gems                                       | Crafting                        |
| Silver Bars / Gold Bars                         | Smithing                        |
| Silver / Gold Jewelry Bases                     | Smithing                        |
| Base Handles | Fletching |
| Plain Staffs | Fletching |
| Metal Sword Blades / Axe Heads / Pickaxe Heads | Smithing                        |
| Rune Essence                                   | Mining / Runecrafting ecosystem |

For jewelry specifically, precious ores and uncut gems enter crafting as external upstream inputs from mining, while unfinished silver and gold jewelry bases enter from smithing. Crafting then owns mould unlocks, gem cutting, gem attachment, and the canonical finished jewelry progression.

### Item Values

Plain staff value progression is defined here in crafting as part of the magic equipment progression.

Crafting is the canonical source of truth for plain staff and elemental staff item values.

| Item | Category | Buy Value | Sell Value |
| ---- | -------- | --------- | ---------- |
| Uncut Ruby | Gem / Material | 20 | 6 |
| Cut Ruby | Gem / Material | 40 | 12 |
| Uncut Sapphire | Gem / Material | 50 | 16 |
| Cut Sapphire | Gem / Material | 100 | 32 |
| Uncut Emerald | Gem / Material | 90 | 30 |
| Cut Emerald | Gem / Material | 180 | 60 |
| Uncut Diamond | Gem / Material | 150 | 50 |
| Cut Diamond | Gem / Material | 300 | 100 |
| Plain Staff (Wood) | Weapon / Magic | 20 | 6 |
| Plain Staff (Oak) | Weapon / Magic | 40 | 12 |
| Plain Staff (Willow) | Weapon / Magic | 80 | 20 |
| Plain Staff (Maple) | Weapon / Magic | 140 | 32 |
| Plain Staff (Yew) | Weapon / Magic | 250 | 50 |
| Fire Staff | Weapon / Magic | 80 | 24 |
| Water Staff | Weapon / Magic | 180 | 52 |
| Earth Staff | Weapon / Magic | 320 | 92 |
| Air Staff | Weapon / Magic | 550 | 150 |
| Wooden Handle | Component | null | 6 |
| Oak Handle | Component | null | 12 |
| Willow Handle | Component | null | 20 |
| Maple Handle | Component | null | 32 |
| Yew Handle | Component | null | 50 |
| Normal Leather | Material | 8 | 2 |
| Wolf Leather | Material | 24 | 8 |
| Bear Leather | Material | 60 | 20 |
| Wooden Handle w/ Strap | Component | 30 | 10 |
| Oak Handle w/ Strap | Component | 50 | 16 |
| Willow Handle w/ Strap | Component | 100 | 32 |
| Maple Handle w/ Strap | Component | 150 | 44 |
| Yew Handle w/ Strap | Component | 280 | 76 |
| Bronze Sword | Weapon | 40 | 10 |
| Iron Sword | Weapon | 120 | 35 |
| Steel Sword | Weapon | 350 | 110 |
| Mithril Sword | Weapon | 900 | 300 |
| Adamant Sword | Weapon | 2200 | 750 |
| Rune Sword | Weapon | null | 2500 |
| Bronze Axe | Tool | 40 | 10 |
| Iron Axe | Tool | 120 | 35 |
| Steel Axe | Tool | 350 | 110 |
| Mithril Axe | Tool | 900 | 300 |
| Adamant Axe | Tool | 2200 | 750 |
| Rune Axe | Tool | null | 2500 |
| Bronze Pickaxe | Tool | 40 | 10 |
| Iron Pickaxe | Tool | 120 | 35 |
| Steel Pickaxe | Tool | 350 | 110 |
| Mithril Pickaxe | Tool | 900 | 300 |
| Adamant Pickaxe | Tool | 2200 | 750 |
| Rune Pickaxe | Tool | null | 2500 |

### Tool Values

| Tool | Buy Value | Sell Value |
| ---- | --------- | ---------- |
| Chisel | 4 | 1 |
| Needle | 4 | 1 |
| Thread | 2 | 1 |
| Ring Mould | null | null |
| Amulet Mould | null | null |
| Tiara Mould | null | null |

## Balance Benchmarks

Immediate crafting outputs use `Action Ticks = 1`, so their XP-per-tick and sell-value-per-tick match their per-action numbers. Timed gem, staff, and jewelry recipes use the standard 3-tick crafting cadence.

### Strapped Handle Throughput by Tier

| Output | Required Level | Action Ticks | XP per Action | Sell Value | XP per Tick | Sell Value per Tick |
| ------ | -------------- | ------------ | ------------- | ---------- | ----------- | ------------------- |
| Wooden Handle w/ Strap | 1 | 1 | 2 | 10 | 2 | 10 |
| Oak Handle w/ Strap | 10 | 1 | 4 | 16 | 4 | 16 |
| Willow Handle w/ Strap | 20 | 1 | 8 | 32 | 8 | 32 |
| Maple Handle w/ Strap | 30 | 1 | 12 | 44 | 12 | 44 |
| Yew Handle w/ Strap | 40 | 1 | 18 | 76 | 18 | 76 |

### Gem Cutting Throughput by Tier

| Output | Required Level | Action Ticks | XP per Action | Sell Value | XP per Tick | Sell Value per Tick |
| ------ | -------------- | ------------ | ------------- | ---------- | ----------- | ------------------- |
| Cut Ruby | 10 | 3 | 4 | 12 | 1.3333 | 4 |
| Cut Sapphire | 20 | 3 | 8 | 32 | 2.6667 | 10.6667 |
| Cut Emerald | 30 | 3 | 14 | 60 | 4.6667 | 20 |
| Cut Diamond | 40 | 3 | 22 | 100 | 7.3333 | 33.3333 |

### Elemental Staff Throughput by Tier

| Output | Required Level | Action Ticks | XP per Action | Sell Value | XP per Tick | Sell Value per Tick |
| ------ | -------------- | ------------ | ------------- | ---------- | ----------- | ------------------- |
| Fire Staff | 10 | 3 | 4 | 24 | 1.3333 | 8 |
| Water Staff | 20 | 3 | 8 | 52 | 2.6667 | 17.3333 |
| Earth Staff | 30 | 3 | 14 | 92 | 4.6667 | 30.6667 |
| Air Staff | 40 | 3 | 22 | 150 | 7.3333 | 50 |

### Gemmed Jewelry Attachment Throughput by Family

All three jewelry shapes share the same attachment benchmarks within a metal/gem family because ring, amulet, and tiara bases intentionally use mirrored sell values inside each metal band.

| Output Family | Required Level | Action Ticks | XP per Action | Sell Value | XP per Tick | Sell Value per Tick |
| ------------- | -------------- | ------------ | ------------- | ---------- | ----------- | ------------------- |
| Ruby Silver Jewelry (Ring/Amulet/Tiara) | 10 | 3 | 4 | 32 | 1.3333 | 10.6667 |
| Sapphire Silver Jewelry (Ring/Amulet/Tiara) | 20 | 3 | 8 | 52 | 2.6667 | 17.3333 |
| Ruby Gold Jewelry (Ring/Amulet/Tiara) | 40 | 3 | 4 | 44 | 1.3333 | 14.6667 |
| Sapphire Gold Jewelry (Ring/Amulet/Tiara) | 40 | 3 | 8 | 64 | 2.6667 | 21.3333 |
| Emerald Gold Jewelry (Ring/Amulet/Tiara) | 40 | 3 | 14 | 92 | 4.6667 | 30.6667 |
| Diamond Gold Jewelry (Ring/Amulet/Tiara) | 40 | 3 | 22 | 132 | 7.3333 | 44 |

### Balance Notes

- Strapped handles are the fast immediate component lane; every tier improves both XP and direct-sale throughput without needing a station.
- Gem cutting, elemental staffs, and gemmed jewelry now share the same gem-tier XP ladder (`ruby=4`, `sapphire=8`, `emerald=14`, `diamond=22`) so the 10/20/30/40 unlock band stays readable across the full jewelry-and-magic branch.
- Elemental staff sell values equal plain-staff sell value plus the matching cut-gem sell value.
- Gemmed jewelry sell values equal matching jewelry-base sell value plus the attached cut-gem sell value.

## Merchant / NPC Structure

### Crafting Teacher

The crafting teacher introduces the basics of crafting. This NPC helps new players understand clay goods, jewelry basics, and early assembly concepts.

**Location:** In or near the town crafting area.

**Associated Quests:** Likely early crafting introduction.

| Item | Buys | Sells |
| ---- | ---- | ----- |
| Chisel | 1 | 4 |
| Needle | 1 | 4 |
| Thread | 1 | 2 |

### Elira Gemhand (Jeweler)

Elira Gemhand is the town jeweler and the core jewelry-progression quest NPC.

She is the main bridge between upstream precious raw materials and crafting's finished jewelry pipeline. In implementation terms, Elira is the NPC who introduces the player to how mined precious ores and uncut gems eventually become jewelry bases, cut gems, mould unlocks, and finished gemmed jewelry across the crafting flow.

Her role is intentionally bounded:
- Mining remains the source of silver ore, gold ore, and uncut gems.
- Smithing remains the source of unfinished silver and gold jewelry bases.
- Crafting owns mould creation and mould unlock progression.
- Crafting owns gem cutting, gem attachment, and the canonical finished jewelry progression.

Elira anchors the player's transition into that pipeline without changing system ownership of the upstream materials.

**Location:** In the town jewelry workshop.

**Associated Quests:** Starts the Gem Mine Quest; starts the Mould Making Quest.

| Role Area | Elira's Function |
| --------- | ---------------- |
| Town jeweler | Primary jewelry-themed town NPC and player-facing guide to jewelry progression |
| Gem Mine Quest | Starting NPC for access to the gem-focused precious-material progression |
| Mould Making Quest | Starting NPC for the crafting-side mould creation and unlock progression |
| Jewelry pipeline bridge | Explains how external precious raw inputs flow into smithing-made bases and then into crafting-owned finished jewelry progression |
| Finished jewelry progression | Points the player toward gem cutting, gem attachment, and the silver-to-gold jewelry progression owned by crafting |

### Tanner Rusk (Hunter / Leather Merchant)

Tanner Rusk is the main leather supplier for early equipment assembly progression.

**Location:** In or near the town crafting area.

**Associated Quests:** None required for baseline leather access.

| Item | Buys | Sells |
| ---- | ---- | ----- |
| Normal Leather | 2 | 8 |
| Wolf Leather | 8 | 24 |
| Bear Leather | 20 | 60 |
| Wooden Handle w/ Strap | 10 | sold-back only |
| Oak Handle w/ Strap | 16 | sold-back only |
| Willow Handle w/ Strap | 32 | sold-back only |
| Maple Handle w/ Strap | 44 | sold-back only |
| Yew Handle w/ Strap | 76 | sold-back only |
| Wooden Handle | 6 | sold-back only |
| Oak Handle | 12 | sold-back only |
| Willow Handle | 20 | sold-back only |
| Maple Handle | 32 | sold-back only |
| Yew Handle | 50 | sold-back only |
| Bronze Sword | 10 | sold-back only |
| Iron Sword | 35 | sold-back only |
| Steel Sword | 110 | sold-back only |
| Mithril Sword | 300 | sold-back only |
| Adamant Sword | 750 | sold-back only |
| Rune Sword | 2500 | sold-back only |
| Bronze Axe | 10 | sold-back only |
| Iron Axe | 35 | sold-back only |
| Steel Axe | 110 | sold-back only |
| Mithril Axe | 300 | sold-back only |
| Adamant Axe | 750 | sold-back only |
| Rune Axe | 2500 | sold-back only |
| Bronze Pickaxe | 10 | sold-back only |
| Iron Pickaxe | 35 | sold-back only |
| Steel Pickaxe | 110 | sold-back only |
| Mithril Pickaxe | 300 | sold-back only |
| Adamant Pickaxe | 750 | sold-back only |
| Rune Pickaxe | 2500 | sold-back only |

### General Store

The general store buys everything at half price.

## Training Location Structure

| Location Type                 | Role                                       |
| ----------------------------- | ------------------------------------------ |
| Town crafting workshop        | Early crafting hub                         |
| Jewelry workshop              | Silver / gold / gem progression            |
| Bank-adjacent processing area | Efficient material conversion and assembly |
| Specialized crafting district | Higher-tier progression and quests         |

## Dependencies

| Dependency        | Purpose                                            |
| ----------------- | -------------------------------------------------- |
| Mining            | Clay, gems, and precious ore source                |
| Smithing          | Silver / gold bars and metal item parts             |
| Fletching         | Base handles and plain staffs for crafting assembly |
| Combat            | Finished weapons and armor-adjacent progression    |
| Magic             | Jewelry and rune-adjacent sinks                    |
| Shops and economy | Buying tools and selling outputs                   |
| Quest progression | Mould unlocks, gem access, specialized progression |

## Possible Rules

| Rule                                                                           | Value |
| ------------------------------------------------------------------------------ | ----- |
| Finished swords, axes, and pickaxes are assembled in crafting                  | True  |
| Jewelry moulds are created through crafting rather than bought from shops      | True  |
| Elira is the town jeweler                                                      | True  |
| Elira is the core jewelry-progression quest NPC                                | True  |
| Elira starts the Gem Mine Quest                                                | True  |
| Elira starts the Mould Making Quest                                            | True  |
| Elira is the core mould-making quest NPC                                       | True  |
| Jewelry production is quest-locked behind mould creation                       | True  |
| Gem attachment is separate from base jewelry creation | True |
| Gem attachment is immediate when only one valid output exists | True |
| Gem attachment opens an interface when multiple valid outputs exist | True |
| Rings, amulets, and tiaras all support gem attachment with the same mechanics | True |
| Silver jewelry is restricted to ruby and sapphire gem attachments | True |
| Gold jewelry can use ruby, sapphire, emerald, and diamond gem attachments | True |
| Gem cutting requires a chisel that is not consumed | True |
| Gemmed jewelry value equals base jewelry value plus gem value | True |
| Elemental staff value equals plain staff value plus matching cut gem value | True |
| No merchant stocks plain staffs or elemental staffs by default | True |
| Gem attachment creates a unique gemmed item | True |
| Gem attachment grants crafting XP | True |
| Elemental staffs are created by attaching the matching cut gem to a matching-tier fletched staff | True |
| Plain wood staffs cannot have gems attached | True |
| Moulds cannot be sold | True |
| Moulds cannot be dropped | True |
| Soft clay is made by using clay on water                                       | True  |
| Soft clay creation happens one item at a time                                  | True  |
| Borrowed jewelry items are imprinted into soft clay, then fired into moulds    | True  |
| Jewelry bases are created in smithing, not crafting                            | True  |
| Crafting is the canonical owner of finished jewelry progression                | True  |
| Silver jewelry is the lower-tier finished jewelry family                       | True  |
| Gold jewelry is the higher-tier finished jewelry family                        | True  |
| Smithing supplies unfinished jewelry bases while crafting defines finished jewelry progression | True |
| Crafting actions are deterministic under the base model                        | True  |
| Some crafting actions may require a dedicated station | True |
| Strapped handle assembly is done anywhere from the inventory | True |
| Metal-part attachment to a strapped handle is done anywhere from the inventory | True |
| Equipment assembly item-on-item actions have no make menu | True |
| Invalid equipment assembly combinations give a simple "these don't match" style message | True |
| Higher-tier strapped handles can be used on matching lower-tier metal parts | True |
| Using a higher-tier strapped handle on a lower-tier metal part prompts confirmation | True |
| Over-tier confirmation is a yes/no prompt | True |
| Over-tier assembly produces the normal lower-tier finished item | True |
| Over-tier assembly gives no stat bonus | True |
| Over-tier assembled items cannot be disassembled | True |
| Equipment assembly uses normal item-on-item inventory replacement behavior | True |
| The general store buys everything for half price                               | True  |

## Decisions / Remaining Questions

| Topic                                                             | Current Best Guess                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Binding material for held-item assembly                           | Resolved as leather-based strapped handles                                |
| Whether clay is fired at kiln/furnace or generic crafting station | Implemented as active-fire firing for the current mould-making quest slice |
| Exact jewelry progression and gem sockets | Crafting owns the canonical finished jewelry progression: silver jewelry is the lower-tier family and can use the first two gems only; gold jewelry is the higher-tier family and can use all four gems |
| Jewelry base creation method | Jewelry bases are created in smithing using a bar and the matching mould, then passed into crafting as unfinished jewelry bases for finished jewelry progression |
| Gem attachment step | Cut gems are attached in a separate step after the base jewelry piece is made. All three jewelry categories-rings, amulets, and tiaras-use the same gem attachment rules. |
| Gem attachment interaction | If there is only one valid output, gem attachment is immediate. If there are multiple valid outputs, it opens an interface to select quantity. |
| Jewelry mould quest details | Elira starts the mould-making path, after which the player borrows ring, amulet, and tiara examples; imprints them into soft clay; then fires the moulds |
| Gem acquisition and processing | Uncut gems are external upstream inputs from mining. They are brought into crafting and cut there before jewelry use |
| Gem cutting tool requirement | Gem cutting requires a chisel, but the chisel is not consumed |
| Soft clay interaction | Soft clay is made by using clay on water, one item at a time |
| Gemmed jewelry value rule | Gemmed jewelry uses base jewelry value plus gem value |
| Elemental staff value rule | Elemental staff value equals plain staff value plus matching cut gem value |
| Staff value ownership | Crafting is the canonical source of truth for plain staff and elemental staff item values |
| Staff merchant stock rule | No merchant stocks plain staffs or elemental staffs by default |
| Gem attachment outputs | Attaching a gem to jewelry creates a unique gemmed item for that shape, metal, and gem combination |
| Gem attachment XP | Attaching a gem to jewelry grants crafting XP based on the gem tier used |
| Staff assembly inputs | Plain staffs come from fletching; crafting attaches the matching cut gem to the matching staff tier |
| Staff elemental mapping | Fire staff uses ruby on oak staff, water staff uses sapphire on willow staff, earth staff uses emerald on maple staff, air staff uses diamond on yew staff |
| Wood staff limitation | Plain wood staffs cannot have gems attached |
| Leather progression in the 1-40 band | Normal leather at 1 and 10, wolf leather at 20 and 30, bear leather at 40 |
| Handle family use | Shared handle families are used across swords, axes, and pickaxes within the same tier |
| Lower-tier compatibility | A strapped handle can also be used with matching lower-tier metal parts across swords, axes, and pickaxes, but doing so prompts an "are you sure?" confirmation |
| Over-tier confirmation UI | The confirmation is a yes/no prompt |
| Over-tier assembly result | Confirming over-tier assembly produces the normal lower-tier finished item with no rename, no stat bonus, and no disassembly |
| XP distribution for equipment assembly | Both steps grant XP, with most XP on final assembly |
| Leather merchant buyback | Tanner buys back leathers and strapped handles |
| Base handle merchant buyback | Tanner buys back base handles but does not sell them |
| Finished gear merchant stock behavior | Tanner can resell finished swords, axes, and pickaxes only if the player previously sold them to him |
| Tanner stock source for sold-back gear | Sold-back finished gear is player-driven stock, not permanent default merchant stock |
| Tanner stock source for sold-back handles | Sold-back base handles and strapped handles are player-driven stock, not permanent default merchant stock |
| Whether tiaras interact with runecrafting later                   | Very likely                                                               |
| Exact tool list for crafting | Chisel, needle, thread, ring mould, amulet mould, tiara mould |
| Mould item handling | Moulds are permanent quest tools: they cannot be sold or dropped, but can be stored in the bank |

## Item List

| Item                   | Category       | Required Level     | Buy Value | Sell Value | Notes                                                    |
| ---------------------- | -------------- | ------------------ | --------- | ---------- | -------------------------------------------------------- |
| Normal Leather         | Material       | 1                  | 8         | 2          | Purchased from leather / hunting merchant                |
| Wolf Leather           | Material       | 20                 | 24        | 8          | Purchased from leather / hunting merchant                |
| Bear Leather           | Material       | 40                 | 60        | 20         | Purchased from leather / hunting merchant                |
| Wooden Handle w/ Strap | Component | 1 | 30 | 10 | Crafted from wooden handle + normal leather |
| Oak Handle w/ Strap | Component | 10 | 50 | 16 | Crafted from oak handle + normal leather |
| Willow Handle w/ Strap | Component | 20 | 100 | 32 | Crafted from willow handle + wolf leather |
| Maple Handle w/ Strap | Component | 30 | 150 | 44 | Crafted from maple handle + wolf leather |
| Yew Handle w/ Strap | Component | 40 | 280 | 76 | Crafted from yew handle + bear leather |
| Wooden Handle | Component | 1 | null | 6 | Base handle made through fletching; Tanner buys but does not stock by default |
| Oak Handle | Component | 10 | null | 12 | Base handle made through fletching; Tanner buys but does not stock by default |
| Willow Handle | Component | 20 | null | 20 | Base handle made through fletching; Tanner buys but does not stock by default |
| Maple Handle | Component | 30 | null | 32 | Base handle made through fletching; Tanner buys but does not stock by default |
| Yew Handle | Component | 40 | null | 50 | Base handle made through fletching; Tanner buys but does not stock by default |
| Bronze Sword           | Weapon         | 1                  | 40        | 10         | Crafted from blade + strapped handle                     |
| Iron Sword             | Weapon         | 1                  | 120       | 35         | Crafted from blade + strapped handle                     |
| Steel Sword            | Weapon         | 10                 | 350       | 110        | Crafted from blade + strapped handle                     |
| Mithril Sword          | Weapon         | 20                 | 900       | 300        | Crafted from blade + strapped handle                     |
| Adamant Sword          | Weapon         | 30                 | 2200      | 750        | Crafted from blade + strapped handle                     |
| Rune Sword             | Weapon         | 40                 | null      | 2500       | Crafted from blade + strapped handle                     |
| Bronze Axe             | Tool           | 1                  | 40        | 10         | Final assembled axe                                      |
| Iron Axe               | Tool           | 1                  | 120       | 35         | Final assembled axe                                      |
| Steel Axe              | Tool           | 10                 | 350       | 110        | Final assembled axe                                      |
| Mithril Axe            | Tool           | 20                 | 900       | 300        | Final assembled axe                                      |
| Adamant Axe            | Tool           | 30                 | 2200      | 750        | Final assembled axe                                      |
| Rune Axe               | Tool           | 40                 | null      | 2500       | Final assembled axe                                      |
| Bronze Pickaxe         | Tool           | 1                  | 40        | 10         | Final assembled pickaxe                                  |
| Iron Pickaxe           | Tool           | 1                  | 120       | 35         | Final assembled pickaxe                                  |
| Steel Pickaxe          | Tool           | 10                 | 350       | 110        | Final assembled pickaxe                                  |
| Mithril Pickaxe        | Tool           | 20                 | 900       | 300        | Final assembled pickaxe                                  |
| Adamant Pickaxe        | Tool           | 30                 | 2200      | 750        | Final assembled pickaxe                                  |
| Rune Pickaxe           | Tool           | 40                 | null      | 2500       | Final assembled pickaxe                                  |
| Silver Ring            | Jewelry Base   | 10                | 40        | 12         | Created in smithing; used in crafting for gem attachment |
| Silver Tiara           | Jewelry Base   | 10                | 40        | 12         | Created in smithing; used in crafting for gem attachment |
| Silver Amulet          | Jewelry Base   | 10                | 40        | 12         | Created in smithing; used in crafting for gem attachment |
| Gold Ring              | Jewelry Base   | 40                | 100       | 32         | Created in smithing; used in crafting for gem attachment |
| Gold Tiara             | Jewelry Base   | 40                | 100       | 32         | Created in smithing; used in crafting for gem attachment |
| Gold Amulet            | Jewelry Base   | 40                | 100       | 32         | Created in smithing; used in crafting for gem attachment |
| Ruby Silver Ring       | Gemmed Jewelry | 10                | 80        | 24         | Unique gemmed item; value = silver ring + cut ruby |
| Ruby Silver Tiara      | Gemmed Jewelry | 10                | 80        | 24         | Unique gemmed item; value = silver tiara + cut ruby |
| Ruby Silver Amulet     | Gemmed Jewelry | 10                | 80        | 24         | Unique gemmed item; value = silver amulet + cut ruby |
| Sapphire Silver Ring   | Gemmed Jewelry | 20                | 140       | 44         | Unique gemmed item; value = silver ring + cut sapphire |
| Sapphire Silver Tiara  | Gemmed Jewelry | 20                | 140       | 44         | Unique gemmed item; value = silver tiara + cut sapphire |
| Sapphire Silver Amulet | Gemmed Jewelry | 20                | 140       | 44         | Unique gemmed item; value = silver amulet + cut sapphire |
| Ruby Gold Ring         | Gemmed Jewelry | 40                | 140       | 44         | Unique gemmed item; value = gold ring + cut ruby |
| Ruby Gold Tiara        | Gemmed Jewelry | 40                | 140       | 44         | Unique gemmed item; value = gold tiara + cut ruby |
| Ruby Gold Amulet       | Gemmed Jewelry | 40                | 140       | 44         | Unique gemmed item; value = gold amulet + cut ruby |
| Sapphire Gold Ring     | Gemmed Jewelry | 40                | 200       | 64         | Unique gemmed item; value = gold ring + cut sapphire |
| Sapphire Gold Tiara    | Gemmed Jewelry | 40                | 200       | 64         | Unique gemmed item; value = gold tiara + cut sapphire |
| Sapphire Gold Amulet   | Gemmed Jewelry | 40                | 200       | 64         | Unique gemmed item; value = gold amulet + cut sapphire |
| Emerald Gold Ring      | Gemmed Jewelry | 40                | 280       | 92         | Unique gemmed item; value = gold ring + cut emerald |
| Emerald Gold Tiara     | Gemmed Jewelry | 40                | 280       | 92         | Unique gemmed item; value = gold tiara + cut emerald |
| Emerald Gold Amulet    | Gemmed Jewelry | 40                | 280       | 92         | Unique gemmed item; value = gold amulet + cut emerald |
| Diamond Gold Ring      | Gemmed Jewelry | 40                | 400       | 132        | Unique gemmed item; value = gold ring + cut diamond |
| Diamond Gold Tiara     | Gemmed Jewelry | 40                | 400       | 132        | Unique gemmed item; value = gold tiara + cut diamond |
| Diamond Gold Amulet    | Gemmed Jewelry | 40                | 400       | 132        | Unique gemmed item; value = gold amulet + cut diamond |
| Soft Clay              | Material       | 1                  | null      | 1          | Made by using clay on a water source, one item at a time; used for jewelry mould creation |
| Chisel                 | Tool           | 1                  | 4         | 1          | Required for cutting uncut gems into cut gems; not consumed |
| Needle                 | Tool           | 1                  | 4         | 1          | Available to buy; reserved for future soft-goods / leather crafting |
| Thread                 | Tool / Supply  | 1                  | 2         | 1          | Available to buy; reserved for future soft-goods / leather crafting |
| Uncut Ruby             | Gem / Material  | 10                 | 20        | 6          | Mined in uncut form; cut with a chisel |
| Cut Ruby               | Gem / Material  | 10                 | 40        | 12         | Produced from uncut ruby through gem cutting |
| Uncut Sapphire         | Gem / Material  | 20                 | 50        | 16         | Mined in uncut form; cut with a chisel |
| Cut Sapphire           | Gem / Material  | 20                 | 100       | 32         | Produced from uncut sapphire through gem cutting |
| Uncut Emerald          | Gem / Material  | 30                 | 90        | 30         | Mined in uncut form; cut with a chisel |
| Cut Emerald            | Gem / Material  | 30                 | 180       | 60         | Produced from uncut emerald through gem cutting |
| Uncut Diamond          | Gem / Material  | 40                 | 150       | 50         | Mined in uncut form; cut with a chisel |
| Cut Diamond            | Gem / Material  | 40                 | 300       | 100        | Produced from uncut diamond through gem cutting |
| Plain Staff (Wood)      | Weapon / Magic  | 1                  | 20        | 6          | Fletched from 1 log into 1 staff; cannot have a gem attached |
| Plain Staff (Oak)       | Weapon / Magic  | 10                 | 40        | 12         | Fletched from 1 oak log into 1 staff |
| Plain Staff (Willow)    | Weapon / Magic  | 20                 | 80        | 20         | Fletched from 1 willow log into 1 staff |
| Plain Staff (Maple)     | Weapon / Magic  | 30                 | 140       | 32         | Fletched from 1 maple log into 1 staff |
| Plain Staff (Yew)       | Weapon / Magic  | 40                 | 250       | 50         | Fletched from 1 yew log into 1 staff |
| Fire Staff              | Weapon / Magic  | 10                 | 80        | 24         | Crafted by attaching cut ruby to an oak staff |
| Water Staff             | Weapon / Magic  | 20                 | 180       | 52         | Crafted by attaching cut sapphire to a willow staff |
| Earth Staff             | Weapon / Magic  | 30                 | 320       | 92         | Crafted by attaching cut emerald to a maple staff |
| Air Staff               | Weapon / Magic  | 40                 | 550       | 150        | Crafted by attaching cut diamond to a yew staff |
| Ring Mould             | Tool / Utility | Quest unlock       | null      | null       | Created by imprinting a borrowed ring into soft clay, then firing it; cannot be sold or dropped |
| Amulet Mould          | Tool / Utility | Quest unlock       | null      | null       | Created by imprinting a borrowed amulet into soft clay, then firing it; cannot be sold or dropped |
| Tiara Mould            | Tool / Utility | Quest unlock       | null      | null       | Created by imprinting a borrowed tiara into soft clay, then firing it; cannot be sold or dropped |





