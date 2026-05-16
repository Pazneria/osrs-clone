# Borin Ironvein (`mainland_borin_ironvein`)

Owned model: Borin Ironvein (`mainland_borin_ironvein`)

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly NPC gallery model. This brief does not authorize runtime code edits.

## Current Read

- Existing preset: `buildMainlandBorinIronveinPreset()` in `src/js/content/npc-appearance-catalog.js` uses `buildSmithVariantPreset()`, which clones the Tutorial Mining and Smithing Instructor.
- Current visual base: apron, muted shirt, trousers, boots, ore dust/smears, belt hammer, belt tongs, plus Borin's single `ironvein_ore_sample` on the torso.
- Current palette: apron `#5b4634`, shirt `#6d3e2c`, metal `#b4aaa0`, ore `#8b6b52`, inherited leather/tool/soot language from the tutorial smith.
- Current placement: `content/world/regions/main_overworld.json` places `borin_ironvein` at the south quarry settlement/cottage cluster with `appearanceId: "mainland_borin_ironvein"`, merchant tags for mining and smithing, and dialogue `borin_ironvein`.
- Current role text: Borin introduces ore, tools, patience, copper/tin basics, and iron's harsher lesson. He is a starter-to-mid ore buyer and forge helper, not the advanced Thrain lane.
- Main risk: he can read as a rethemed tutorial instructor or generic apron worker. The final model needs an unmistakable "short, sturdy dwarf ore buyer/blacksmith" read at gallery distance.

## Profession And Gameplay Role

- Borin is the approachable dwarf who makes the mining/smithing loop feel grounded: mine ore, understand materials, bring it to a forge, trade the surplus, repeat.
- Merchant identity matters as much as smith identity. He should look like he weighs and appraises ore, not just hammers bars.
- Keep him early-band and practical. Copper, tin, iron, coal, mithril, hammer, tongs, and pickaxe vocabulary are enough; avoid rune-master grandeur reserved for Thrain.
- Personality read: compact, stubborn, competent, slightly soot-stained, welcoming to beginners but visibly hard to fool about ore quality.
- Spatial read: south quarry forge-worker. He belongs near rocks, furnace, anvil, sacks, and rough cottages, not a polished city smithy.

## Source Inspiration

- OSRS [Ordan](https://oldschool.runescape.wiki/w/Ordan): dwarf ore seller at the Blast Furnace. Use the "ore merchant embedded in a forge economy" idea, plus rock-dust practicality, without copying Keldagrim-specific costume.
- OSRS [Nurmof](https://oldschool.runescape.wiki/w/Nurmof): dwarf pickaxe-shop owner in the Dwarven Mines. Useful for dwarf mining-merchant language and tool-shop confidence.
- OSRS [Pickaxe](https://oldschool.runescape.wiki/w/Pickaxe): mining tool vocabulary; a small pickaxe silhouette or pick-head badge can connect Borin to ore gathering even if his live shop focus is hammer/ore.
- OSRS [Thurgo](https://oldschool.runescape.wiki/w/Thurgo): master dwarven smith reference. Borrow dwarven craft authority and broad beard/worker read, but keep Borin humbler and lower-tier.
- OSRS [Horvik](https://oldschool.runescape.wiki/w/Horvik): armoursmith/shopkeeper in a smithy. Useful for the customer-facing smith merchant stance: apron, trade counter, practical tools, stocked metal goods.
- OSRS [Smithing](https://oldschool.runescape.wiki/w/Smithing): reinforces the material chain from ore to bars to forged outputs. The model should visibly bridge mining input and smithing output.
- National Park Service [Blacksmith Shop Interior](https://www.nps.gov/places/blacksmith-shop-interior.htm): hammer, anvil, forge, coal, tongs, and bellows are the durable forge-worker cues to reduce into blocky props.
- National Park Service [Blacksmith Tools](https://www.nps.gov/articles/blacksmith-tools.htm): anvil, bellows, cross-peen hammers, chisels, tongs, cutters, rasps, and files support a believable tool belt without ornamental clutter.
- Sketchfab [Low Poly Blacksmith (Rigged)](https://sketchfab.com/3d-models/low-poly-blacksmith-rigged-aa7bcc0cbbbd477c9f3af689f37a728f): low-poly profession readability validation: chunky apron, hammer, simple animation-ready forms. Use as style proof only.
- CGTrader [Blacksmith Low Poly](https://www.cgtrader.com/3d-models/character/man/blacksmith-low-poly): medieval blacksmith plus anvil/hammer package at about 1k polygons. Use as validation that prop silhouettes can stay simple and readable; do not import or copy assets.

## Silhouette Goals

- First read at thumbnail size: short broad dwarf, big beard, heavy apron, ore pouch/sample, hammer/tongs, mining/forge tool cue.
- Make the dwarf read through proportions and mass: wider torso, lower belt line, thick boots, chunky hands, broad nose/brow, and beard volume. Do not rely on height alone.
- Differentiate from `tutorial_mining_smithing_instructor`: Borin should be shorter, beardier, more merchant-like, and more ore-focused; the tutorial instructor can stay a generic apron mentor.
- Differentiate from `mainland_thrain_deepforge`: Borin is warm early-progression trade craft; Thrain should remain the sterner advanced smith with cleaner prestige metal.
- Differentiate from `mainland_quarry_foreman`: the Foreman owns clipboard/site authority; Borin owns forge tools, ore appraisal, and dwarf craft identity.
- Use one clear diagonal: a short pickaxe haft across the back/hip, angled tongs on the belt, or a hammer handle at the apron. One diagonal is enough to break the torso block.
- Beard should be one of the largest identity shapes: blocky wedge or forked two-lobe beard, warm grey/brown, visible from front three-quarter.
- Avoid tall helmets, horned fantasy dwarf tropes, glowing runes, battle armor, large weapons, or boss-scale shoulder pads.

## Color And Material Notes

- Keep Borin in warm forge earth tones: dark leather apron, rust-brown shirt, charcoal trousers, blackened boots, soot marks, muted metal tools.
- Add ore-specific spots with restraint: copper `#b8734b`, tin `#b8c4c9`, iron `#6f6960`, coal `#2e2b28`, mithril `#6f8f8d` as tiny samples or pouch contents.
- Suggested palette anchors: apron `#5b4634`, apron shadow `#33261c`, shirt `#6d3e2c`, leather belt `#4c3322`, beard `#9a7a58`, soot `#1f1f1c`, tool iron `#8f918b`, warm brass scale weight `#b88b42`.
- Use material blocks, not texture noise: apron slab, beard slab, ore cubes, tool head, leather pouch, brass buckle.
- The brightest value should be a tool edge, tin/iron ore glint, or small brass scale detail, not the whole outfit.
- Keep copper/tin/iron visually distinct but tiny. Borin should not become a walking ore display case.
- Avoid saturated orange forge glow unless the later pose includes an anvil/forge vignette; in the standard NPC gallery, glow would overpromise a station prop.

## Prop And Pose Ideas

- Highest-value prop: a hip ore pouch or small merchant tray with 3-4 blocky ore samples. This sells "ore buyer" better than another generic hammer.
- Upgrade the current `ironvein_ore_sample` into a clearer cluster: one larger iron lump plus small copper/tin chips, offset on the apron or held low in one hand.
- Keep inherited belt hammer and tongs, but make them dwarf-scale chunky: slightly oversized heads, shorter handles, readable dark-metal jaws.
- Optional pickaxe cue: a short pick head or compact haft strapped behind the right hip. It should read as trade/mining identity, not a combat weapon.
- Optional merchant cue: small brass scale weight, tally tag, or coin pouch on the apron. One of these is enough.
- Pose target: feet planted wide, torso slightly forward, one hand presenting or inspecting ore, the other near the hammer/tongs. Friendly but immovable.
- Face target: heavy brow, broad nose, simple moustache-beard mass, maybe one soot patch on cheek or brow. Tiny braid details are lower priority than the beard silhouette.
- Do not add an anvil as a carried prop unless the gallery supports pedestal props; it will fight the humanoid bounds and can make him look like scenery.

## Gallery Scale And Framing Notes

- Keep standard humanoid floor contact and gallery bounds. Make him feel dwarf-like through width, belt position, beard, and boots before shrinking the whole preset.
- If a later runtime pass safely supports scale override, test roughly `[0.96, 0.90, 1.03]` or similar: slightly shorter, wider/deeper. Stop if the gallery camera makes him look like a child.
- Best gallery angle: front three-quarter with beard, apron, ore pouch, and one tool silhouette visible.
- Read order at 96-148 px should be: beard/brow, apron, ore sample/pouch, hammer or tongs, boots.
- Keep side props tight. A pickaxe or tongs that extends too far will shrink the whole thumbnail and lose the dwarf read.
- Compare beside `tutorial_mining_smithing_instructor`, `mainland_thrain_deepforge`, `mainland_quarry_foreman`, and `mainland_elira_gemhand`. Borin should be the stout ore-appraiser, not the tutorial clone, advanced master, site boss, or gem specialist.

## Concrete Implementation Guidance For Central Integration

- Later implementation target: `src/js/content/npc-appearance-catalog.js`, inside `buildMainlandBorinIronveinPreset()`, unless the gallery rework introduces a central authored model layer first.
- Preserve content contracts: preset ID `mainland_borin_ironvein`, label `Borin Ironvein`, archetype `ore_buyer_blacksmith`, world `appearanceId`, merchant ID `borin_ironvein`, dialogue ID `borin_ironvein`, and NPC gallery actor entry.
- Keep `buildSmithVariantPreset()` as the first-pass base. It already supplies apron, hammer, tongs, soot/ore dust, and correct animation scale; Borin only needs stronger dwarf/merchant additions.
- Prefer additive fragments with the existing prefix style: `ironvein_beard_core`, `ironvein_beard_left_wedge`, `ironvein_beard_right_wedge`, `ironvein_heavy_brow`, `ironvein_ore_pouch`, `ironvein_copper_chip`, `ironvein_tin_chip`, `ironvein_iron_lump`, `ironvein_scale_weight`, `ironvein_pick_head_badge`.
- Keep additions around 8-14 fragments. Prioritize beard, ore pouch/sample, and one trade/tool cue before decorative buckles.
- If using `clonePresetWithTheme()`, verify theme keys actually hit inherited role names; fragment-specific colors are safer for ore chips, beard, and merchant details.
- Do not edit shop economy, world placement, dialogue, quest gates, mining/smithing specs, generated assets, or combat systems during visual integration.
- Acceptance target: in the NPC gallery, a viewer should identify "dwarf ore buyer/blacksmith" before reading the nameplate.
- Suggested later checks after runtime integration: `node .\tools\tests\npc-model-gallery-runtime-guard.js`, then manual `/qa npcgallery` comparison against the tutorial smith, Thrain, Quarry Foreman, and Elira.
