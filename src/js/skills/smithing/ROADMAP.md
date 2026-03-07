# Smithing Roadmap

## Vision
Smithing converts mined resources into equipment and jewelry bases, acting as the primary gear-production bridge from Mining.

## Now
- Core smithing loop is not fully implemented in this project yet.
- This roadmap defines the target tiering and economics.

## Next
- Implement bar creation loop and level gates.
- Implement smithing output set (gear/tools/arrowheads/jewelry bases).
- Implement smithing economy and merchant integration.

## Later
- Quest-gated rune progression and specialized forge path.
- Advanced recipe balancing and profit sink tuning.

## Progression Bands
- Level 1: Bronze / Iron
- Level 10: Steel
- Level 20: Mithril
- Level 30: Adamant / Moulds
- Level 40: Rune / Moulds

## Tooling
- Hammer required at all tiers.
- Jewelry moulds required for tiara/ring/amulet outputs.

## Canon IDs

### Items
- ITEM_BAR_BRONZE: `bronze_bar`
- ITEM_BAR_IRON: `iron_bar`
- ITEM_BAR_STEEL: `steel_bar`
- ITEM_BAR_MITHRIL: `mithril_bar`
- ITEM_BAR_ADAMANT: `adamant_bar`
- ITEM_BAR_RUNE: `rune_bar`
- ITEM_HAMMER: `hammer`
- ITEM_MOULD_TIARA: `tiara_mould`
- ITEM_MOULD_RING: `ring_mould`
- ITEM_MOULD_AMULET: `amulet_mould`

### Outputs
- ITEM_HELMET: `helmet`
- ITEM_PLATEBODY: `platebody`
- ITEM_PLATELEGS: `platelegs`
- ITEM_BOOTS: `boots`
- ITEM_SHIELD: `shield`
- ITEM_SWORD: `sword`
- ITEM_AXE: `axe`
- ITEM_PICKAXE: `pickaxe`
- ITEM_ARROWHEADS: `arrowheads`
- ITEM_TIARA: `tiara`
- ITEM_AMULET: `amulet`
- ITEM_RING: `ring`

### NPCs
- NPC_BORIN_IRONVEIN: `borin_ironvein`
- NPC_THRAIN_DEEPFORGE: `thrain_deepforge`
- NPC_ELIRA_GEMHAND: `elira_gemhand`

### Locations
- LOC_FORGE_CASTLE: `forge_castle`
- LOC_ANVIL_BORIN: `anvil_borin`
- LOC_FORGE_ADVANCED: `forge_advanced`
- LOC_FORGE_RUNE: `forge_rune`
- LOC_WORKBENCH_JEWELRY: `workbench_jewelry`

## Economy Snapshot
| Item | Category | Buy | Sell |
| --- | --- | ---: | ---: |
| Bronze Bar | Bar | - | 8 |
| Iron Bar | Bar | - | 16 |
| Steel Bar | Bar | - | 32 |
| Mithril Bar | Bar | - | 64 |
| Adamant Bar | Bar | - | 128 |
| Rune Bar | Bar | - | 256 |
| Hammer | Equipment | 8 | 2 |
| Tiara Mould | Equipment | 120 | 40 |
| Ring Mould | Equipment | 120 | 40 |
| Amulet Mould | Equipment | 120 | 40 |

## Rules
- Bars are never sold by shops.
- Shops may buy bars but players must create bars themselves.
- Bar values follow fixed 2x progression by tier.
- Rune progression is quest-gated via advanced smithing path.
- General store buys all at half-price fallback.
