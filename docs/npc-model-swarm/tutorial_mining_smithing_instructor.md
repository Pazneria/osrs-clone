# Tutorial Mining and Smithing Instructor (`tutorial_mining_smithing_instructor`)

Owned model: `tutorial_mining_smithing_instructor`

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly Tutorial Island NPC gallery model. This brief is for central integration planning only; it does not authorize runtime code edits.

## Current Read

- Live placement: `content/world/regions/tutorial_island.json` spawns `npc:tutorial_mining_smithing_instructor` at `x: 338, y: 292`, facing east, with `appearanceId: "tutorial_mining_smithing_instructor"`, dialogue `tutorial_mining_smithing_instructor`, action `Talk-to`, and tags `tutorial`, `mining`, and `smithing`.
- Local station context is strong: nearby tutorial furnace at `x: 347, y: 301`, tutorial anvil at `x: 348, y: 307`, copper/tin rocks north and east, plus `tutorial_quarry_tool_rack`, `tutorial_quarry_ore_pile`, `tutorial_quarry_coal_bin`, and `tutorial_quarry_barrel`.
- Live preset: `buildTutorialMiningSmithingInstructorPreset()` in `src/js/content/npc-appearance-catalog.js` clones `buildTutorialFiremakingInstructorPreset()`, removes tinderbox/log/ember details, rethemes shirt/apron/trousers, and adds ore dust, copper/tin smears, belt hammer, and belt tongs.
- Current palette: leather apron `#5f432b`, apron shadow `#33261c`, shirt `#5f6f6b`, shirt dark `#3f4d4b`, soot `#1f1f1c`, ore dust `#8a8173`, copper `#b56f4e`, tin `#b8c4c9`, trim `#b88b42`, metal `#9ca4a8`, dark metal `#5d6264`, tool handle `#775033`.
- Current read is "aproned workshop worker" faster than "the person who teaches mining, smelting, and forging." The belt tools are correct but too low and narrow to carry the thumbnail.
- Main risk: he remains a Firemaking Instructor variant with metal stains. The final model needs one unmistakable mining cue, one unmistakable smithing cue, and one tutorial-teacher cue before the nameplate.

## Tutorial And Gameplay Role

- This NPC owns the metal loop tutorial: take starter tools, mine copper and tin, smelt bronze bars at the furnace, forge at the anvil, assemble a bronze sword, and make bronze arrowheads for the Ranged Instructor.
- In this repo, dialogue grants or replaces `bronze_pickaxe`, `hammer`, and `wooden_handle_strapped` during step 4. The model should visually justify all three: pickaxe knowledge, hammer/anvil competence, and "you are making real parts now" instruction.
- He is a beginner station teacher, not a mainland smith, dwarf ore merchant, quarry foreman, or late-game forge master. The tone should be patient, practical, and slightly soot-stained, with clear props rather than prestige.
- He should make the nearby furnace and anvil feel like a guided lesson area. The player should see him and infer "talk to this person before using those stations."
- The final read should bridge mining and smithing evenly. Too much pickaxe makes him a miner; too much hammer/tongs makes him a blacksmith; the tutorial identity comes from the balanced kit and explanatory pose.

## Source Inspiration

- OSRS Tutorial Island: the Mining Instructor, Dezzick, teaches the Mining and Smithing basics, gives a bronze pickaxe, and sends the player through copper/tin mining, smelting, and bronze forging. Source: https://oldschool.runescape.wiki/w/Tutorial_Island
- OSRS Tutorial Island mine: the underground mine clusters copper and tin rocks, a furnace, an anvil, and the Mining Instructor in one teaching space. This is the strongest layout reference for the clone's compact quarry/forge yard. Source: https://oldschool.runescape.wiki/w/Tutorial_Island_mine
- OSRS Mining Instructor reference: Dezzick is a human Tutorial Island tutor, examined as an expert on mining-related skills and associated with making bronze items. Use the role and human tutor silhouette, not a direct costume copy. Source: https://oldschoolrunescape.fandom.com/wiki/Mining_Instructor
- OSRS Pickaxe: pickaxes are the defining mining tool and can be carried in inventory or wielded. For this NPC, a bronze/iron starter pick silhouette should be readable but not posed like a combat weapon. Source: https://oldschool.runescape.wiki/w/Pickaxe
- OSRS Smithing: smithing is bars-to-items production at an anvil using a hammer. The model should show hammer/anvil literacy through a hammer, hot bar, tongs, or anvil badge. Source: https://oldschool.runescape.wiki/w/Smithing
- OSRS Anvil: anvils are the essential smithing station icon. Borrow the horn/block silhouette for a badge, apron mark, or tiny sample plate instead of carrying a full anvil. Source: https://oldschool.runescape.wiki/w/Anvil
- OSRS Furnace: furnaces smelt ore into metal bars, including bronze from copper and tin. Use a controlled ember/heat accent only as a supporting station cue. Source: https://oldschool.runescape.wiki/w/Furnace
- OSRS Hammer: the hammer is the basic smithing tool used on anvils. A chunky low-poly hammer should be more visible than the current belt sliver. Source: https://oldschool.runescape.wiki/w/Hammer
- NPS Blacksmith Tools and Blacksmith Shop Interior: real smithy vocabulary is anvil, bellows, cross-peen hammers, tongs, chisels, forge, coal, and quench setup. Compress this into 2-3 large cues; do not add full scenery to the character. Sources: https://www.nps.gov/articles/blacksmith-tools.htm and https://www.nps.gov/places/blacksmith-shop-interior.htm
- Britannica Blacksmith: the core blacksmith tool chain is forge/furnace, anvil, tongs, hammers, chisels, and worked iron. This supports a practical metalworker read without fantasy ornament. Source: https://www.britannica.com/topic/blacksmith
- Low-poly validation: Kenney Mini Characters demonstrate compact readable humanoids with animation-friendly proportions; Sketchfab Low Poly Dwarf Miner validates pickaxe/miner readability at very low triangle counts; CGTrader Blacksmith Low Poly validates that apron, hammer, and anvil cues can read in roughly 1k polygons. Sources: https://kenney.nl/assets/mini-characters, https://sketchfab.com/3d-models/low-poly-dwarf-miner-rigged-53c1474925d541bfaa36423f33b9f763, https://www.cgtrader.com/3d-models/character/man/blacksmith-low-poly
- Low-poly prop reference: Quaternius Fantasy Props MegaKit is useful only as a proof of simple medieval tool silhouettes and low-texture prop economy. Do not import or copy external geometry. Source: https://opengameart.org/content/fantasy-props-megakit

## Silhouette Goals

- First read at thumbnail size: human tutorial metalwork instructor with leather apron, raised or side-held pickaxe, visible hammer/tongs, copper/tin/bronze sample, and friendly teacher stance.
- Keep standard Tutorial Island instructor height. Do not make him a dwarf; Borin and Thrain own dwarf mining/smithing territory.
- The largest torso shape should remain the leather apron, but it needs a stronger front identity: anvil badge, bronze bar sample, or color-blocked tool roll across the apron.
- Add one clear pickaxe diagonal. Best option: a short bronze pickaxe held low in the near hand like a pointer, or strapped tight over one shoulder/hip. Keep the head inside the gallery bounds.
- Add one clear smithing silhouette. Best option: a square hammer head at the belt or in the off hand, plus a tong pair holding a small orange bronze bar.
- Add one teacher cue: open palm, pointing pick handle, small lesson tally tag, or apron badge with an anvil/horn profile. He is explaining, not actively mining or hammering.
- Preserve the human face and warm eye contact. A full helmet, huge beard, or heavy mask would push him into smith, guard, or dwarf categories.
- Avoid full furnace/anvil scenery attached to the model, overlarge backpack loads, glowing fantasy forge aura, late-tier rune/adamant colors, combat pickaxe swing, or foreman clipboard language.

## Color And Material Notes

- Preserve the current earthy forge palette, but increase value separation: dark apron over green-gray shirt, dark gloves, dusty trousers, copper/tin samples, and dull metal tools.
- Suggested anchors: apron `#5f432b`, apron shadow `#33261c`, shirt `#5f6f6b`, shirt dark `#3f4d4b`, soot `#1f1f1c`, ore dust `#8a8173`, copper chip `#b56f4e`, tin chip `#b8c4c9`, bronze bar `#b88b42`, iron tool `#9ca4a8`, dark tool edge `#5d6264`, handle `#775033`.
- Use bronze as the tutorial success color. A small bronze bar, arrowhead bundle, or sword-blade blank should be brighter than the shirt but smaller than the apron.
- Copper and tin should appear as paired teaching samples: one warm orange-brown block, one pale cool gray block. Keep them simple and side by side so the recipe reads.
- Tool metal should be matte and blocky. Bright highlights belong only on pick tip, hammer face, tongs jaw, or anvil badge edge.
- Forge heat can be a tiny orange plane on a held bar or tongs tip. Do not flood the model with ember colors or he will drift back toward Firemaking.
- Keep soot and ore dust as broad smudges on apron, cuffs, boots, and cheek. Avoid speckled texture noise; it will shimmer or vanish in the gallery.

## Prop And Pose Ideas

- Priority mining prop: `mining_smithing_bronze_pickaxe_handle`, `mining_smithing_bronze_pickaxe_head`, and `mining_smithing_pickaxe_tip`. Place it as a low diagonal pointer or tight shoulder/hip strap.
- Priority smithing prop: upgrade the existing belt hammer into `mining_smithing_hammer_handle` and `mining_smithing_hammer_head`, large enough to read at 96-148 px.
- Priority furnace/anvil lesson prop: `mining_smithing_tongs_left`, `mining_smithing_tongs_right`, and `mining_smithing_hot_bronze_bar` in the near hand or apron front.
- Priority tutorial cue: `mining_smithing_anvil_badge` or `mining_smithing_lesson_tag`, a simple anvil-horn icon or bronze station tag on the apron chest.
- Useful material samples: `mining_smithing_copper_chip`, `mining_smithing_tin_chip`, `mining_smithing_bronze_bar_sample`, and maybe `mining_smithing_arrowhead_bundle`.
- Pose target: feet planted at the quarry gate, shoulders open, one hand using the pickaxe or hammer like a pointer, the other holding tongs/bar or gesturing toward the furnace/anvil.
- Idle idea for later: glance from player to held sample, small pick/hammer pointer lift, settle back into neutral. No active mining swing or repeated anvil strike in the gallery pose.
- Talk idea for later: present copper and tin samples, then tilt toward the bronze bar. This can sell the recipe without changing tutorial logic.

## Gallery Scale And Framing Notes

- The gallery thumbnail is currently built around compact NPC cards; sibling docs call out a `THUMB_SIZE = 148` read, so the model must survive at 96-148 px.
- Required read order: apron and face, pickaxe diagonal, hammer/tongs, copper/tin/bronze samples, soot/dust, boots.
- Best angle: front three-quarter with apron front, pickaxe head, hammer head, tongs/bar, and face all visible. Avoid back-only tool straps.
- Keep the pickaxe inside the standard humanoid silhouette envelope. A long diagonal extending far beyond the shoulders will shrink the whole thumbnail.
- Keep hand props oversized and simplified. Real-scale arrowheads, tongs jaws, or ore chips will disappear; use chunky blocks and high-contrast placement.
- Compare beside `tutorial_firemaking_instructor`, `tutorial_crafting_instructor`, `mainland_borin_ironvein`, `mainland_quarry_foreman`, and `mainland_thrain_deepforge`. He should be the friendly starter human metal-loop teacher, not the fire worker, clay artisan, dwarf ore buyer, site boss, or advanced forge master.
- In the Tutorial Island instructor lineup, he should form the clearest transition from survival basics to equipment creation: practical apron, mining tool, smithing tool, and bronze lesson objects.

## Concrete Implementation Guidance For Central Integration

- Later implementation target: `src/js/content/npc-appearance-catalog.js`, specifically `buildTutorialMiningSmithingInstructorPreset()`, unless the central NPC gallery/model rework introduces a dedicated authored model layer first.
- Preserve stable identifiers: `tutorial_mining_smithing_instructor`, label `Mining and Smithing Instructor`, archetype `aproned_mine_foreman` unless renamed centrally, world `appearanceId`, service ID `merchant:tutorial_mining_smithing_instructor`, spawn ID `npc:tutorial_mining_smithing_instructor`, and dialogue ID `tutorial_mining_smithing_instructor`.
- Lowest-risk pass: keep the current Firemaking-derived worker body, remove any remaining fire-only cues, and add 10-14 front-readable `mining_smithing_*` fragments that are larger than the existing belt details.
- Better bespoke pass: split a shared Tutorial Island worker/apron base from firemaking/mining/crafting-specific props. Let Firemaking own tinderbox/log/ember, Mining/Smithing own pickaxe/hammer/tongs/bronze, and Crafting own clay/tool-roll/ring-imprint.
- Suggested fragments: `mining_smithing_apron_front`, `mining_smithing_anvil_badge`, `mining_smithing_bronze_pickaxe_handle`, `mining_smithing_bronze_pickaxe_head`, `mining_smithing_pickaxe_tip`, `mining_smithing_hammer_handle`, `mining_smithing_hammer_head`, `mining_smithing_tongs_left`, `mining_smithing_tongs_right`, `mining_smithing_hot_bronze_bar`, `mining_smithing_copper_chip`, `mining_smithing_tin_chip`, `mining_smithing_arrowhead_bundle`, `mining_smithing_boot_dust`, and `mining_smithing_soot_cheek`.
- If keeping the current cloned-fragment mapping, verify role filters still remove only fire-only roles and do not accidentally recolor new `mining_smithing_*` fragments through broad role names. Explicit colors are safest for copper, tin, bronze, hot metal, and tool edges.
- Keep pickaxe proportions aligned with the repo's approved right-hand pickaxe family language: chunky head, wood handle, grip low, business end high, but do not wire or edit player equipment assets as part of this NPC pass.
- Do not edit tutorial progression, merchant stock, dialogue, world placement, mining/smithing specs, item catalogs, generated pixel/OBJ assets, player equipment, combat systems, or unrelated NPC presets as part of this model integration.
- Likely failure modes to guard against: Firemaking recolor, generic apron vendor, dwarf smith bleed, quarry foreman clipboard bleed, invisible belt tools, overlong pickaxe thumbnail shrink, furnace-glow mage read, or late-game rune/adamant color leakage.
- Suggested later checks after runtime/model integration: `node .\tools\tests\npc-model-gallery-runtime-guard.js`, `npm.cmd run test:player-npc-humanoid:guard`, then manual `/qa npcgallery` comparison focused on Tutorial Island instructor differentiation and mining/smithing read. This markdown-only brief itself requires no runtime test.
- Acceptance target: in the NPC gallery, a viewer should identify "starter mining and smithing teacher" before reading the label.
