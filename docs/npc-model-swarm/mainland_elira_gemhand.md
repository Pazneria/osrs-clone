# Elira Gemhand (`mainland_elira_gemhand`)

Owned model: Elira Gemhand (`mainland_elira_gemhand`)

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly NPC gallery model. This brief does not authorize runtime code edits.

## Current Read

- Existing preset: `buildMainlandEliraGemhandPreset()` in `src/js/content/npc-appearance-catalog.js` uses `buildSmithVariantPreset()`, which clones the Tutorial Mining/Smithing Instructor rig. It labels her `Elira Gemhand`, sets archetype `market_gem_cutter`, rethemes the smith base to muted violet/apron colors, and adds two fragments: a cyan `gem_sample` on the right lower arm and a purple `gemhand_pouch` on the torso.
- Current gameplay placement: `content/world/regions/main_overworld.json` places `appearanceId: "mainland_elira_gemhand"` on merchant `elira_gemhand` near the south quarry/service cluster, tagged for smithing, gems, mining, and settlement use.
- Current role from crafting/mining/smithing docs: Elira is the town jeweler, gem-mine access NPC, mould-making quest starter, and bridge between mined precious materials, smithing-made jewelry bases, and crafting-owned gem cutting/finished jewelry progression.
- Current visual risk: she reads as "purple smith with a blue cube" more than "precise gem cutter and jeweler." The base apron is useful, but the inherited mining/smithing mass needs jeweller-specific small tools, tray geometry, mould examples, and faceted color hierarchy.

## Profession And Gameplay Role

- Merchant role: strict jewelry pipeline buyer/seller. She sells silver ore, gold ore, and uncut ruby/sapphire/emerald/diamond; she buys precious ores, cut and uncut gems, silver/gold bases, and finished gemmed rings, amulets, and tiaras.
- Quest role: starts the gem-mine path and the `Moulds of the Trade` mould-making path. The model should show she teaches process, not just commerce: borrowed example jewelry, soft-clay imprinting, fired moulds, and cut-gem finishing.
- World role: a workshop jeweler attached to the quarry/precious-material economy, not a noble court jeweller. She should feel practical, local, and exact-handed.
- Dialogue read: patient craft pride. Her existing dialogue frames good cutting as revealing color and polishing as patience plus a steady hand; the model should look calm, focused, and meticulous.

## Source Inspiration

- OSRS [Gem trader](https://oldschool.runescape.wiki/w/Gem_trader): Al Kharid human merchant precedent with trade/talk options, cut and uncut sapphire/emerald/ruby/diamond stock, and a simple shopkeeper silhouette. Use as merchant precedent, not a costume copy.
- OSRS [Gems](https://oldschool.runescape.wiki/w/Gems): gems are valuable Crafting materials, cut into finished gems, made into jewellery, enchanted, or cut into bolt tips. Use the uncut-to-cut ladder as the prop story.
- OSRS [Crafting](https://oldschool.runescape.wiki/w/Crafting): Crafting includes gem cutting with a chisel and silver/gold jewelry production. This supports visible chisel, mould, and finished-jewelry cues over generic ore props.
- OSRS [Jewellery](https://oldschool.runescape.wiki/w/Jewellery): rings, necklaces/amulets, and bracelets/slot items are Crafting outputs, often enchanted. Use the tiny wearable shapes as tray silhouettes, not as noisy necklace strings everywhere.
- OSRS [Chisel](https://oldschool.runescape.wiki/w/Chisel): the canonical small tool for cutting and shaping hard non-metals, mainly gems and limestone. Give Elira one unmistakable chisel or fine cutter.
- OSRS [Gem shops](https://oldschool.runescape.wiki/w/Gem_shops) and [Gem stall](https://oldschool.runescape.wiki/w/Gem_stall): gem stores use a red gem map icon and stalls imply displayed precious stones from around the world. Borrow the visible tray/stall display language.
- Lapidary craft reference: [International Gem Society faceting basics](https://www.gemsociety.org/article/lapidary-fundamentals-gemstone-faceting/) and [dopping techniques](https://www.gemsociety.org/article/dopping-techniques/) support dop sticks, small held stones, cutting laps, and angle-control as real gem-cutter props. Simplify them heavily for OSRS scale.
- Low-poly discipline references: [The Noble Craftsman](https://sketchfab.com/3d-models/the-noble-craftsman-0e8ff87ffaa24731b2474badebca870d), [Blacksmith Character - 3D Voxel Low Poly Model](https://sketchfab.com/3d-models/blacksmith-character-3d-voxel-low-poly-model-150618f923d9407f96b9663b96094b9e), and [Medieval Villager - Low Poly Stylized Rigged](https://sketchfab.com/3d-models/medieval-villager-low-poly-stylized-rigged-d371652c9d3047cd82b712bc7c38025c) are useful only for chunky artisan proportions, simple hands, apron readability, and prop-first silhouettes.

## Silhouette Goals

- First read at thumbnail size: jeweler/gem cutter, not miner, smith, mage, or generic market trader.
- Keep the apron, but make the torso front a jeweller work surface: a shallow tray, pinned mould tag, or small sample board should replace the current lone pouch as the main identity read.
- Put one clear craft tool in hand: chisel/fine cutter, dop stick with gem, or small polishing cloth. It must be larger than realistic scale so it survives the gallery thumbnail.
- Use a short diagonal across the body from tray to tool hand. Elira should look like she is inspecting or presenting a cut stone, not holding a weapon.
- Build a four-gem color ladder somewhere obvious: ruby red, sapphire blue, emerald green, diamond pale cyan/white. Use no more than four stones or the read becomes confetti.
- Add one mould-family cue: ring, amulet, and tiara examples can appear as three tiny front-tray silhouettes or belt tags. This ties her to the mould quest better than a generic gemstone pouch.
- Avoid staff, wand, pickaxe, big hammer, helmet, shoulder armor, or glowing spell effects. Those steal her away from the jewelry pipeline.

## Color And Materials

- Preserve the current muted violet identity, but shift it from "purple smith metal" to "jeweller apron and dyed work blouse." Suggested cloth anchors: deep plum `#4c354f`, dusty violet `#5c4268`, smoke lavender `#7b6a82`.
- Apron: dark leather or waxed cloth, slightly warmer than the shirt. A front pocket can hold mould tags or a polishing cloth.
- Metal: two clear families. Silver should be cool matte `#c7c8c2`; gold should be warm muted `#c8a34a`. Keep both small and flat, with no shiny PBR treatment.
- Gems: use saturated but tiny accents: ruby `#b63d4a`, sapphire `#3f7fc4`, emerald `#3fa463`, diamond `#dcefff`/`#9fd5e8`. Each gem should be a faceted block cluster or rotated box, not a round bead.
- Tools: chisel blade dull steel, handle dark wood, dop stick tan wood or brass. Polishing cloth can be pale cream so it contrasts with the apron.
- Do not let the whole model become purple-blue. The four gemstone accents plus gold/silver metal should break the palette cleanly.

## Prop And Pose Ideas

- Priority prop: `gemhand_display_tray`, a shallow rectangular tray on the front/left side with four oversized gem chips in the OSRS precious-gem colors.
- Priority hand read: `gemhand_dop_stick` or `gemhand_chisel`, held low and forward. A dop stick with a single sapphire/diamond at the end is more jeweller-specific than a generic knife.
- Mould quest cue: three tiny samples named `gemhand_ring_example`, `gemhand_amulet_example`, and `gemhand_tiara_example`, either on the tray or hanging as belt tags.
- Optional detail: `gemhand_loupe_headband` or one blocky magnifier at the brow/hand. Keep it chunky; a realistic loop disappears.
- Pose target: relaxed standing inspection pose, head slightly angled down toward the held gem, one hand presenting the tray/tool. She is judging quality, not selling aggressively.
- Idle animation target for later: tiny hand raise, gem turn, cloth polish, then return to tray. Trade/talk can tilt the tray outward as if showing stock.

## Gallery Scale And Framing

- Keep standard humanoid height and floor contact. Identity should come from front props, not scale.
- Best angle: front three-quarter with tray, tool hand, apron, and face all visible. Pure front hides tool depth; pure side loses the mould/jewelry samples.
- Gems must be deliberately oversized relative to real jewelry. A 0.10-0.14 block reads better than a true pinprick stone in the NPC gallery.
- The tray should sit in the lower torso/upper hip zone so it does not occlude the face or shrink the model bounds.
- Required thumbnail read order: plum jeweller apron, bright gem tray, fine cutter/dop stick, gold/silver mould examples, calm artisan face.
- Compare beside `mainland_crafting_teacher`, `mainland_borin_ironvein`, `mainland_thrain_deepforge`, and `mainland_market_trader`. Elira should own the precise jewelry/gem read while Borin/Thrain own ore and forge mass.

## Concrete Integration Guidance

- Later implementation target: `src/js/content/npc-appearance-catalog.js`, inside `buildMainlandEliraGemhandPreset()`, unless the NPC gallery rework creates a central authored model layer first.
- Preserve identifiers and wiring: `mainland_elira_gemhand`, label `Elira Gemhand`, archetype `market_gem_cutter`, `appearanceId`, merchant ID `elira_gemhand`, dialogue ID, quest IDs, world placement, and preview actor entry.
- Lowest-risk first pass: keep `buildSmithVariantPreset()` for shared humanoid scale/animation, but override the smith read with 8-14 jeweller fragments. The mining/smithing base is acceptable only if the final silhouette reads tray/tool/gem first.
- Better bespoke pass: move her to a craft-worker body if a central NPC model-authoring layer appears. Use a lighter apron/merchant stance and remove inherited smith mass at the source.
- Suggested fragments: `gemhand_apron_front`, `gemhand_polishing_cloth`, `gemhand_display_tray`, `gemhand_tray_ruby`, `gemhand_tray_sapphire`, `gemhand_tray_emerald`, `gemhand_tray_diamond`, `gemhand_chisel_blade`, `gemhand_chisel_handle`, `gemhand_dop_stick`, `gemhand_dop_gem`, `gemhand_ring_example`, `gemhand_amulet_example`, `gemhand_tiara_example`, `gemhand_loupe_headband`, `gemhand_silver_wire`, `gemhand_gold_wire`.
- If using `clonePresetWithTheme()`, rely on explicit fragment colors for the gem and jewelry props. Broad theme keys like `metal` and `ore` will retheme inherited smith pieces but will not create the jeweller read by themselves.
- Replace or visually demote the current `gemhand_pouch`; a pouch says merchant, but a tray plus mould examples says Elira specifically.
- Keep additions inspectable and low-poly: rotated boxes, small cuboids, and faceted block clusters. Do not add high-detail chains, thin necklace strings, or many tiny beads.
- Do not edit combat, quest, merchant economy, world placement, dialogue, item catalog, generated OBJ assets, or pixel assets during the model pass.
- Suggested checks for later runtime work: `node .\tools\tests\npc-model-gallery-runtime-guard.js`, then manual `/qa npcgallery` inspection focused on Elira versus the crafting teacher and smithing NPCs. This brief itself requires no runtime test.
