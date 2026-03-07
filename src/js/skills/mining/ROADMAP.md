# Mining Roadmap

## Vision
Mining is a gathering skill that feeds Smithing, Crafting, and parts of Runecrafting through ore and gem supply.

## Now
- Core mining loop is playable.
- Early ores are active in game.
- Mining XP/level progression exists.

## Next
- Add full level-gated ore table from this roadmap.
- Add gem drops and gem-specific nodes.
- Add mining economy pricing in shops.
- Add mine-by-mine progression through world placement.

## Later
- Quest-gated gem mine access.
- Expanded node variants and regional mine identity.
- Advanced balancing passes for XP/hour and GP/hour.

## Progression Bands
- Level 1: Tin / Copper / Clay
- Level 10: Iron
- Level 20: Coal
- Level 30: Silver / Sapphire
- Level 40: Gold / Emerald

## Tool Bands
- Level 1: Bronze Pickaxe / Iron Pickaxe
- Level 10: Steel Pickaxe
- Level 20: Mithril Pickaxe
- Level 30: Adamant Pickaxe
- Level 40: Rune Pickaxe

## Canon IDs
Use these IDs in code/data so implementation is deterministic.

### Items
- ITEM_CLAY: `clay`
- ITEM_COPPER_ORE: `copper_ore`
- ITEM_TIN_ORE: `tin_ore`
- ITEM_IRON_ORE: `iron_ore`
- ITEM_COAL: `coal`
- ITEM_SILVER_ORE: `silver_ore`
- ITEM_SAPPHIRE: `sapphire`
- ITEM_GOLD_ORE: `gold_ore`
- ITEM_EMERALD: `emerald`
- ITEM_RUBY: `ruby`
- ITEM_DIAMOND: `diamond`
- ITEM_PICKAXE_BRONZE: `bronze_pickaxe`
- ITEM_PICKAXE_IRON: `iron_pickaxe`
- ITEM_PICKAXE_STEEL: `steel_pickaxe`
- ITEM_PICKAXE_MITHRIL: `mithril_pickaxe`
- ITEM_PICKAXE_ADAMANT: `adamant_pickaxe`
- ITEM_PICKAXE_RUNE: `rune_pickaxe`

### NPCs
- NPC_BORIN_IRONVEIN: `borin_ironvein`
- NPC_THRAIN_DEEPFORGE: `thrain_deepforge`
- NPC_ELIRA_GEMHAND: `elira_gemhand`

### Locations
- LOC_MINE_BEGINNER: `mine_beginner`
- LOC_MINE_IRON: `mine_iron`
- LOC_MINE_COAL: `mine_coal`
- LOC_MINE_GEM_QUEST: `mine_gem_quest`

## Economy Snapshot
| Item | Category | Buy | Sell |
| --- | --- | ---: | ---: |
| Clay | Resource | 4 | 1 |
| Copper Ore | Resource | 8 | 3 |
| Tin Ore | Resource | 8 | 3 |
| Iron Ore | Resource | 18 | 7 |
| Coal | Resource | 30 | 12 |
| Silver Ore | Resource | 45 | 18 |
| Sapphire | Gem | 120 | 45 |
| Gold Ore | Resource | 70 | 28 |
| Emerald | Gem | 220 | 85 |
| Ruby | Gem | 500 | 180 |
| Diamond | Gem | 900 | 320 |
| Bronze Pickaxe | Equipment | 40 | 10 |
| Iron Pickaxe | Equipment | 120 | 35 |
| Steel Pickaxe | Equipment | 350 | 110 |
| Mithril Pickaxe | Equipment | 900 | 300 |
| Adamant Pickaxe | Equipment | 2200 | 750 |
| Rune Pickaxe | Equipment | - | 2500 |

## Rules
- Mithril Ore, Adamant Ore, and Rune Ore are outside normal level 1-40 mine progression.
- Rune Pickaxe is never sold; it must be smithed.
- Gem mine access is quest-gated.
- General store buys everything at half price.
- Specialty merchants buy/sell curated mining goods.
