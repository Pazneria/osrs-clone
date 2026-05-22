# World Canon

This is the map-first lore bible for the game currently still called OSRS Clone in repo paths. The player-facing setting name for the first mainland pass is **The Hearthmere Marches**. The final product title can change later without renaming canonical world IDs such as `main_overworld` or `tutorial_island`.

## Why Lore Exists

Lore is not decoration. Lore earns its keep when it explains map layout, NPC placement, skill loops, quest starts, and why a player should care about walking from one place to another.

For this project, every piece of canon should answer at least one practical question:

- What does this place produce or protect?
- Who needs the player here?
- What changed here before the player arrived?
- What route, gate, resource site, or service does this history justify?
- What repeatable game loop can live here after the first quest is done?

## Source Of Truth

Author player-facing world canon in canonical content first:

- World and area lore: `content/world/regions/*.json`
- Export path to codex/wiki: `npm.cmd run tool:codex:export`
- Human design notes: this file and `docs/MAINLAND_WORLDBUILDING.md`

The codex/wiki should consume exported canon. It can own presentation, page layout, slugs, and redirects, but it should not invent facts that conflict with the game content.

## Coordinate System

World and area coordinates in canonical JSON use the authored raw 486x486 tile space unless a field says otherwise. The live runtime scales those placements into the expanded 1296x1296 mainland, so use the raw numbers for authoring and the runtime-scaled numbers only for visual debugging.

For map orientation, lower `tileY` is north, higher `tileY` is south, lower `tileX` is west, and higher `tileX` is east.

## Setting Premise

The Hearthmere Marches are a road-bound frontier province. Castle law, quarry wealth, forest craft, market trade, and dryland routes all depend on one another, but the old trust between them cracked after the Roadhold Fire.

The player enters at a useful moment: the roads are open enough to travel, damaged enough to need help, and politically messy enough that small favors can become real leverage.

Core tone:

- Grounded frontier fantasy.
- Local mysteries with practical stakes.
- Towns that exist because people work there.
- History visible through roads, signs, ruins, banks, workshops, fences, and resource sites.
- Quests that start small and reveal who benefits from the current map.

## Canon Pillars

**Road Memory**

Roads are the oldest institutions in the Marches. Gates, bridges, toll stones, and abandoned camps should carry the memory of past promises.

Map rule: put history at thresholds. A ruin should usually sit beside a route that once mattered.

Quest shape: recover old witness marks, restore road markers, reopen or challenge toll rights, learn why help failed to reach Old Roadhold.

**Work Makes Place**

Each settlement exists because of a labor loop: stone, timber, fish, craft, banking, trade, or training.

Map rule: put resource sites near the settlements that depend on them. Shops and homes should be near the work they explain.

Quest shape: delivery problems, missing materials, bad weights, broken tools, apprentice tasks, production disputes.

**Small Law**

The Marches are governed less by grand kingdoms than by local oaths, toll rights, guild favors, and people who know which road is safe.

Map rule: use notice boards, house tags, small guard posts, toll signs, and ledgers as story objects.

Quest shape: decide whether to enforce a rule, forgive it, expose who profits from it, or carry proof between towns.

## Whole-Map Macro Layer

The mainland should use the whole authored canvas. The current towns are nested inside larger regions so later work can add roads, villages, caves, farms, ruins, and loops without inventing new geography every time.

| Macro Region | Anchor | Bounds | Map Role | Core Environment |
| --- | --- | --- | --- | --- |
| Crownwood Reach | 85, 45 | W0 E165 N0 S150 | Northwest forest, yew, air altar, Woodwatch expansion | Dense timber, old paths, shrine clearings |
| Altar Heights | 205, 75 | W165 E300 N0 S150 | North-center altar road and upland progression | Standing stones, willow bends, water cuts |
| Eastwatch Ridges | 405, 150 | W300 E486 N0 S270 | Northeast ridge country around Old Roadhold, rune essence, iron, maple | Rock ridges, old estates, mine tracks |
| Hearthmere Vale | 205, 255 | W110 E300 N145 S340 | Central starter lowland and civic heart | Grassland, ponds, fences, beginner resources |
| Westmere Fens | 70, 360 | W0 E150 N150 S486 | West and southwest wetland, precious mine, alternate travel | Marsh pools, reeds, mud paths, low bridges |
| South Orefold | 275, 420 | W150 E365 N330 S486 | Southern quarry belt around South Quarry and gem mining | Stone shelves, tailings, cart roads |
| Sunspur Drylands | 430, 395 | W365 E486 N270 S486 | Southeast trade, coal, market, checkpoint, desert edge | Sand bands, scrub, dry washes, coal scars |

## Current Built Locations

| Area | Anchor | Bounds | Role | Canon Read | Game Loops |
| --- | --- | --- | --- | --- | --- |
| Hearthmere Castle Ward | 205, 210 | W160 E245 N175 S250 | Starter civic hub | Castle ward, pond, tutors, first services, road ledger culture | Starter errands, first gathering, first road choices |
| North Woodwatch | 94, 62 | W50 E135 N15 S100 | Forest craft village | Timber rights, bowcraft, cutters, older tree lines | Woodcutting, fletching, forest errands |
| South Quarry | 324, 393 | W288 E365 N370 S430 | Hard-material hamlet | Stone, ore, furnace work, foremen, cart roads | Mining, smithing, ore banking, worksite quests |
| Market Crossing | 432, 392 | W405 E480 N360 S425 | Trade service town | Bank, gallery, trader houses, new money after the fire | Crafting, trade errands, social choices |
| Old Roadhold | 434, 132 | W385 E480 N105 S175 | Burnt road failure | Gatehouse, ash track, manor shell, disputed blame | Mystery quests, road danger, ruins |
| Sunspur Gate | 414, 348 | W390 E440 N325 S380 | Dryland threshold | Toll checkpoint between green road and sand route | Travel tutorial, toll choices, biome transition |
| Saltwind Scrub | 468, 402 | W445 E485 N385 S430 | Dry trade outpost | Sparse trade, ore carts, barrels, wind-worn roads | Future dryland mining, route contracts, desert prep |
| Wayfarer's Skerry Arrival Yard | 140, 174 | W124 E188 N154 S204 | Tutorial arrival | Cabin, guide, first path, starter supplies | Onboarding and first tutorial gate |
| Wayfarer's Skerry Practice Yards | 286, 300 | W190 E370 N188 S352 | Tutorial loop | Controlled lesson yards for mainland systems | Skill literacy and safe practice |

## Starter Questlines

These are not final quest specs. They are canon-safe questline seeds that explain why the map exists.

**The Roadhold Witness**

Start: Hearthmere Castle Ward.

Inciting problem: a missing ledger page names who was responsible for sending aid during the Roadhold Fire.

Map use: castle ward -> Market Crossing records -> Old Roadhold gatehouse -> burnt cottage -> manor shell.

Loop after quest: Old Roadhold becomes a repeatable clue, scavenging, or road-safety hub.

**Weights And Witness Marks**

Start: South Quarry.

Inciting problem: ore shipments reach Market Crossing light, but every signed weight is technically valid.

Map use: quarry storehouse, ore cart road, market bank, gallery notice board.

Loop after quest: mining deliveries, smithing orders, bank deposit contracts.

**The Woodwatch Turn**

Start: North Woodwatch.

Inciting problem: marked trees are being felled out of order, threatening fletching supply and angering the castle.

Map use: fletchers workshop, older forest edge, Hearthmere Castle Ward, starter road.

Loop after quest: woodcutting contracts, fletching commissions, protected grove unlocks.

**Sunspur Toll**

Start: Sunspur Gate.

Inciting problem: a checkpoint rule might be lawful, expired, or forged. Nobody agrees because everyone benefits from a different answer.

Map use: Sunspur notice board, Saltwind outpost, Market Crossing trader, castle ledger.

Loop after quest: toll discounts, route escort tasks, dryland resource access.

## Character Backstory Pattern

Backstories should be short enough to affect dialogue and placement.

Use this shape:

- Public role: what the player can tell immediately.
- Private pressure: what problem keeps this person stuck.
- Place tie: why they are physically located there.
- Skill or quest tie: what loop they unlock or complicate.
- Change path: what can be different after the player helps.

Examples to develop next:

- Borin Ironvein: practical quarry smith tied to shipment weights and worker trust.
- Thrain Deepforge: old craft authority who remembers pre-fire road obligations.
- Elira Gemhand: material appraiser whose gem work can expose forged marks.
- Tanner Rusk: market-side craft worker with reasons to know who moves hides, dyes, and quiet money.
- Road Guide and Outpost Guide: living map signs whose backstories can explain safe routes and old road failures.
- Old Road Scavenger: the first person who knows the Roadhold Fire story is incomplete.

## Map Authoring Rules

- Do not add a town until it has a work loop, a travel reason, and a tension.
- Do not add a ruin unless it explains a past route, failed duty, lost resource, or future quest.
- Give each settlement a readable silhouette: castle ward, forest worksite, quarry hamlet, market service town, damaged roadhold, dry checkpoint.
- Place repeated resources in believable economic clusters, not evenly across the map.
- Let roads foreshadow tone: wide and maintained near civic power, cart-worn near labor, narrow and watched near thresholds, broken near old failures.

## Naming Notes

Keep repo IDs stable for tooling:

- `main_overworld`
- `tutorial_island`
- `starter_town`

Use player-facing names in lore and codex:

- The Hearthmere Marches
- Hearthmere Castle Ward
- Wayfarer's Skerry

Future product names should feel broader than one region. Good candidates should be short, original, and able to hold many regions beyond Hearthmere.
