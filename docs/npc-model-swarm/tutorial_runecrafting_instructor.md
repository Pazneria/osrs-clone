# Tutorial Runecrafting Instructor (`tutorial_runecrafting_instructor`)

Owned model: `tutorial_runecrafting_instructor`

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly Tutorial Island NPC gallery model. This brief is for central integration planning only; it does not authorize runtime code edits.

## Current Read

- Live placement: `content/world/regions/tutorial_island.json` spawns `npc:tutorial_runecrafting_instructor` at `x: 246, y: 340`, with `appearanceId: "tutorial_runecrafting_instructor"`, dialogue `tutorial_runecrafting_instructor`, tags `tutorial` and `runecrafting`, and no roaming.
- Station context: the instructor stands near the Tutorial Island `Ember Altar` at `x: 236, y: 342` and the `Rune Essence Crate` at `x: 241, y: 343`. The world already supplies altar and essence cues, so the NPC should carry teaching-scale props, not a whole shrine.
- Live preset: `buildTutorialRunecraftingInstructorPreset()` in `src/js/content/npc-appearance-catalog.js` clones `buildTutorialGuidePreset()`, labels it `Runecrafting Instructor`, sets archetype `ember_altar_scribe`, recolors it into blue/teal cloth with ember trim, and adds hood, shoulder mantle, tabard, ember glyph, essence pouch, rune tablet, and stylus fragments.
- Guarded current cues: `tools/tests/player-npc-humanoid-runtime-guard.js` asserts the broad dark hood, wrapping hood sides/back, shoulder mantle, front tabard, ember glyph, essence pouch, tablet, and stylus/stylus tip. Future integration should respect that vocabulary unless the whole model layer is deliberately redesigned.
- Current palette: coat `#27475f`, shirt `#e0d6bd`, trim `#c46d3d`, belt `#563422`, trouser `#313f4a`, boot `#211b17`, hood/mantle `#183447`, hood back `#102838`, tabard `#315a6d`, ember glyph `#f0a04b`, pouch `#6a5847`, pouch mark `#e36f3a`, tablet `#7e848c`, stylus `#c46d3d`.
- Main risk: the preset already has the right ingredients, but the guide clone base can still read as "dark-blue Tutorial Guide with accessories." The final model needs a stronger altar-scribe silhouette that immediately explains essence-to-rune crafting after the magic lesson.

## Tutorial And Gameplay Role

- This NPC teaches the missing production step behind magic: runes are crafted fuel, not only combat ammunition, shop stock, or random loot.
- In the clone's route, the player has just learned staff/rune casting, then reaches the inner skill yard. This instructor should feel like the calm follow-up: "now make more of the thing you just spent."
- The tutorial spec is explicit: the Runecrafting Instructor must keep a unique silhouette, stay close enough to the Ember Altar that the altar reads as their station, and carry hood, altar-scribe tabard, essence pouch, tablet, and stylus cues.
- The mood should be patient, ceremonial, and practical. They are a starter teacher beside a training altar, not an archmage, shrine boss, occult cultist, or high-level abyss runner.
- The gameplay action is small and concrete: take rune essence, use/craft at the altar, receive ember runes. Props should show blank essence, a marked tablet, a talisman/altar key idea, and one ember rune result.
- The player-facing fantasy is "I can understand the rune loop." Oversized teaching tokens beat lore-heavy ornament.

## Source Inspiration

- OSRS [Tutorial Island](https://oldschool.runescape.wiki/w/Tutorial_Island): the Magic Instructor teaches spellcasting, gives starter runes, and sends players onward. This clone's Runecrafting Instructor should feel like the missing next lesson after that OSRS magic beat, not a replacement for Terrova.
- OSRS [Runecraft](https://oldschool.runescape.wiki/w/Runecraft): Runecraft converts essence into runes at altars and uses talismans/tiaras to access runic places. Use this as the core prop logic: essence, talisman, altar, rune output.
- OSRS [Magic combat tutor transcript](https://oldschool.runescape.wiki/w/Transcript:Magic_combat_tutor): the closest OSRS teacher text for beginner runecrafting explains air/mind talismans, locating ruins, bringing rune essence, and imbuing essence at an altar. Use the explanatory-teacher posture, not the mainland tutor costume wholesale.
- OSRS [Rune essence](https://oldschool.runescape.wiki/w/Rune_essence): the item is an unstackable raw material for low-level runes. Model it as chunky pale-grey/blue stones in a pouch or palm, larger than true inventory scale.
- OSRS [Air talisman](https://oldschool.runescape.wiki/w/Air_talisman): talismans are access keys to matching altars and can be consumed in related tiara/combination-rune processes. Borrow the "mysterious key-token" read as a pendant, belt charm, or tablet inset.
- OSRS [Runic altar](https://oldschool.runescape.wiki/w/Runic_altar) and [Air Altar](https://oldschool.runescape.wiki/w/Air_Altar): altars are shrine-like crafting stations reached through mysterious ruins. The NPC should echo altar geometry through a square/diamond glyph tablet, not carry a mini altar on their back.
- OSRS [Runecraft cape](https://oldschool.runescape.wiki/w/Runecraft_cape): the cape/hood language supports a hooded runecrafter identity and talisman/tiara mastery, but this tutorial NPC should stay starter-scale and avoid a 99-skill prestige cape.
- Getty [The History of Wizard Robes](https://www.getty.edu/news/wizard-medieval-robes/): medieval robe language connects magic to scholars and clergy. Use layered robe/mantle shapes for "educated scribe" authority rather than combat wizard drama.
- Britannica [Stylus](https://www.britannica.com/technology/stylus-writing-implement) and [Wax tablet](https://www.britannica.com/topic/wax-tablet): stylus-plus-tablet is a clean scribe teaching prop. It also justifies the current stylus/tablet fragments without relying on tiny readable text.
- Wikimedia Commons [Medieval writing desk with scribe writing](https://commons.wikimedia.org/wiki/File:Medieval_writing_desk_with_scribe_writing.svg): useful broad silhouette reference for a bent-forward scribe, tablet/desk posture, and tool-in-hand identity. Do not copy it; borrow only the readable "working scholar" pose.
- Kenney [Mini Characters](https://kenney.nl/assets/mini-characters) and Sketchfab [Low Poly Wizard](https://sketchfab.com/3d-models/low-poly-wizard-5a21c8a929e44019b10736b2af96ef4d): low-poly readability checks for compact bodies, oversized heads/hands, and one strong staff/prop silhouette. Use as scale validation only, not mesh source.

## Silhouette Goals

- First read at thumbnail size: hooded altar-scribe, dark shoulder mantle, front ember tabard, visible essence pouch, hand tablet, slender stylus, and one clear talisman/rune token.
- Make the hood the head silhouette: low, wrapped, scholarly, and face-visible. Avoid a tall wizard hat, deep faceless cowl, helmet, or skillcape hood that implies mastery rather than tutorial teaching.
- Make the torso read as a vertical altar-scribe tabard rather than a guide coat. The front tabard should be wider and calmer than a sash, with one large ember glyph or altar mark.
- Keep shoulders modestly broad through the mantle. The mantle should separate this NPC from `tutorial_magic_instructor` robe softness and from the plain `tutorial_guide` coat.
- Put the learning props on the front/near side. A hand tablet, side essence pouch, and chest glyph should all be visible from front three-quarter without rotating the model.
- Add one rune/talisman geometry cue: a diamond, teardrop, or notched disk at the belt, tablet corner, or pendant. This is the "key to the altar" read.
- Do not make the silhouette combat-capable. No staff-as-weapon, no battle casting hand, no shield, no blade, no floating VFX ring, no abyssal spikes.
- Differentiate from `tutorial_magic_instructor`: Magic should own staff/spellbook/air-mind spellcasting; Runecrafting should own hooded scribe, essence, talisman, tablet, stylus, and altar-glyph craft.
- Differentiate from `mainland_rune_tutor` and `mainland_combination_sage`: this instructor is simpler, younger in curriculum, and ember-focused. No multi-element lab clutter or merchant stock identity.

## Color And Material Notes

- Preserve the live dark teal/blue runecrafter identity. It already separates the NPC from the purple Magic Instructor, brown Crafting Instructor, and neutral Tutorial Guide.
- Suggested anchors: hood shadow `#102838`, hood/mantle `#183447`, coat `#27475f`, tabard `#315a6d`, linen shirt `#e0d6bd`, ember glyph `#f0a04b`, ember shadow `#e36f3a`, leather pouch `#6a5847`, dark belt `#563422`, tablet stone `#7e848c`, tablet bevel `#a0a8ad`, essence pale `#cdd7dd`, talisman core `#b9d5df`, stylus copper `#c46d3d`, boots `#211b17`.
- Use ember orange sparingly. One chest glyph, one tablet mark, and the stylus tip are enough; too much glow makes the NPC a fire mage instead of a runecrafter.
- Essence should look pale, inert, and raw: matte blue-grey or off-white stones, faceted like chipped cubes or flattened pebbles. Avoid gem sparkle.
- Tablet material should be muted stone or wax-slate, not a modern book. A dark bevel plus one bright incised glyph will read better than micro-runes.
- Talisman/tiara cues can be dull brass, pale cyan, or muted ember depending on placement. Keep them small but graphically simple.
- Cloth should stay flat shaded with large color islands. No procedural weave, no high-frequency rune text, no realistic leather grain.

## Prop And Pose Ideas

- Priority props: `runecrafting_instructor_hood_top`, `runecrafting_instructor_hood_side_left/right`, `runecrafting_instructor_shoulder_mantle`, `runecrafting_instructor_front_tabard`, `runecrafting_instructor_ember_glyph`, `runecrafting_instructor_essence_pouch`, `runecrafting_instructor_rune_tablet`, and `runecrafting_instructor_stylus`.
- Add or strengthen an essence read: 3-4 oversized pale stones visible at the pouch lip or held in the off hand. Suggested fragments: `runecrafting_instructor_essence_stone_a/b/c`.
- Add a talisman read: small notched disk or diamond pendant on the tabard/belt, or embedded on the tablet corner. Suggested fragments: `runecrafting_instructor_ember_talisman` and `runecrafting_instructor_talisman_inner_mark`.
- Upgrade the tablet into a teaching object: one rectangular slate/wax tablet angled toward the player, with a large incised ember glyph and maybe one blank essence notch. It should explain process, not scripture.
- Keep the stylus slender but not microscopic. The current `axe` holder is acceptable as the right-hand tool path; make the stylus long enough to survive gallery scale and give it a warm ember tip.
- Optional hand action: one lower arm presents the tablet, the other holds the stylus just above it, as if demonstrating the mark before the player uses the altar.
- Optional pouch detail: side pouch flap with pale essence stones peeking out, not a huge adventurer backpack. A small rune mark on the flap is enough.
- Optional altar echo: a tiny stepped diamond or square glyph at the tabard hem, matching the Ember Altar's shrine idea without adding scenery.
- Idle idea for later: tablet tilt, stylus tap, small nod toward altar, then hand returns to neutral. No spell-casting loop or floating particles.

## Gallery Scale And Framing Notes

- Keep standard Tutorial Island humanoid height and floor contact. Identity should come from hood/mantle/tabard/props, not scale changes.
- Best gallery angle: front three-quarter from the tablet/stylus side, with the chest glyph, face, essence pouch, tablet face, and stylus tip all visible.
- Required thumbnail read order: hooded scribe, front ember tabard, tablet, stylus, essence stones/pouch, talisman token.
- Keep props close to the rig. A wide tablet or long stylus that expands the bounding box will shrink the whole NPC in the gallery and make the face/props harder to read.
- Compare beside `tutorial_guide`, `tutorial_magic_instructor`, `tutorial_crafting_instructor`, `mainland_rune_tutor`, and `mainland_combination_sage`. This model should be the clearest "starter rune-making teacher" in that lineup.
- The model should still work without nearby world props. In the gallery, the player will not see the Ember Altar or essence crate; the NPC must carry a small enough version of the lesson in hand.
- Avoid using tiny written runes as the only signal. At `148px` thumbnail scale, big glyph blocks and light essence stones will do the heavy lifting.

## Concrete Integration Guidance

- Future implementation target: `src/js/content/npc-appearance-catalog.js`, specifically `buildTutorialRunecraftingInstructorPreset()`, unless the central NPC gallery/model rework introduces a dedicated authored model layer first.
- Preserve stable identifiers: `tutorial_runecrafting_instructor`, label `Runecrafting Instructor`, archetype `ember_altar_scribe`, world `appearanceId`, spawn `npc:tutorial_runecrafting_instructor`, service `merchant:tutorial_runecrafting_instructor`, dialogue `tutorial_runecrafting_instructor`, tutorial runecrafting tags, and gallery preview actor entry.
- Lowest-risk pass: keep `buildTutorialGuidePreset()` inheritance and the current dark teal theme, then make the existing extra fragments more front-loaded and add only the missing essence/talisman clarity.
- Suggested fragment set: `runecrafting_instructor_hood_top`, `runecrafting_instructor_hood_back`, `runecrafting_instructor_hood_side_left`, `runecrafting_instructor_hood_side_right`, `runecrafting_instructor_shoulder_mantle`, `runecrafting_instructor_front_tabard`, `runecrafting_instructor_ember_glyph`, `runecrafting_instructor_essence_pouch`, `runecrafting_instructor_essence_stone_a`, `runecrafting_instructor_essence_stone_b`, `runecrafting_instructor_rune_tablet`, `runecrafting_instructor_tablet_glyph`, `runecrafting_instructor_ember_talisman`, `runecrafting_instructor_stylus`, and `runecrafting_instructor_stylus_tip`.
- Preferred attachment points: `head` for hood pieces, `torso` for mantle/tabard/pouch/talisman, `rightLowerArm` or `leftLowerArm` for tablet presentation, and existing `axe`/held-tool slot for stylus if the humanoid rig still expects right-hand tool fragments there.
- If keeping old role names for guard continuity, keep the asserted fragments or update guards in the later runtime pass deliberately. Do not accidentally remove `runecrafter_hood_top`, `runecrafter_front_tabard`, `essence_pouch`, `rune_tablet`, or `runecrafter_stylus` without replacing the tests and visual cue.
- If using `clonePresetWithTheme()`, explicitly color every new `runecrafting_instructor_*` fragment. Broad theme keys will not recolor newly named props unless the role matching is intentional.
- Keep additions to roughly 8-14 meaningful fragments. Prioritize hood wrap, front tabard, essence stones, tablet face, talisman token, and stylus over decorative trim.
- Do not edit tutorial progression, dialogue, merchant stock, world placement, runecrafting specs, item icons, generated OBJ/PNG assets, player appearance, or runtime animation code as part of this model brief.
- Likely failure modes to guard against: blue Tutorial Guide clone, purple Magic Instructor duplicate, high-level Runecraft cape master, generic wizard, cultist, shrine priest, unreadable dark-on-dark props, essence that reads as gems, talisman too tiny to register, or a tablet that looks like a combat shield.
- Suggested checks for later model work: `node .\tools\tests\npc-model-gallery-runtime-guard.js`, `npm.cmd run test:player-npc-humanoid:guard`, and manual `/qa npcgallery` inspection focused on thumbnail read and sibling-instructor differentiation. This markdown-only brief itself requires no runtime test.
