# Rune Tutor (`mainland_rune_tutor`)

Owned model: Rune Tutor (`mainland_rune_tutor`)

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly NPC gallery model. This brief does not authorize runtime code edits.

## Current Read

- Existing preset: `buildMainlandRuneTutorPreset()` in `src/js/content/npc-appearance-catalog.js` is a `buildRuneVariantPreset()` clone of the Tutorial Runecrafting Instructor, labeled `Rune Tutor` with archetype `mainland_rune_tutor`.
- Current visual base: tutorial runecrafter hood, shoulder mantle, front tabard, ember glyph, essence pouch, rune tablet, and stylus, recolored into blue-teal cloth with warm orange trim and one extra pale-blue `rune_tutor_air_glyph`.
- Current placement: `content/world/regions/main_overworld.json` wires `appearanceId: "mainland_rune_tutor"` to merchant `rune_tutor` at the Rune Tutor Hut, a frontier timber hut around `x: 216, y: 176`; the NPC spawn sits near `x: 218, y: 181` with `merchant`, `runecrafting`, `starter`, and hut-home tags.
- Gameplay read: this is the early mainland runecrafting mentor and strict starter merchant, teaching rune essence, altar routes, and elemental rune progression while buying and selling only `rune_essence`, `ember_rune`, `water_rune`, `earth_rune`, and `air_rune`.
- Main risk: the current preset is almost indistinguishable from the Tutorial Runecrafting Instructor. The final model needs a clean mainland "first elemental runes" identity without becoming the older, busier `mainland_combination_sage` or a combat wizard.

## Profession And Gameplay Role

- The Rune Tutor is the player's approachable mainland bridge from "I found a weird stone" to "I understand essence, talismans, altars, and basic elemental outputs."
- They should read as a practical field teacher and small rune-shop keeper, not a grand academy archmage. The hut setting wants modest cloth, worn leather, chalk, route notes, and handled stones.
- Their merchant table should drive the prop language: one pouch or tray for raw essence, four elemental rune samples, and a teaching talisman. Avoid the pouch-progression cluster because that belongs to the Combination Sage.
- Their dialogue is careful and explanatory, so the pose should be patient and demonstrative: one hand presenting an unimbued essence stone, the other pointing to a glyph, talisman, or route tablet.
- Personality target: calm, precise, slightly mysterious, but still safe for a starter area. They know real magic, yet their job is teaching fundamentals rather than casting at enemies.

## Source Inspiration

- OSRS [Runecraft](https://oldschool.runescape.wiki/w/Runecraft): the skill centers on crafting runes for Magic by bringing essence to runic altars, often using talismans to locate or enter them. Use this as the core read: essence plus altar-route instruction.
- OSRS [Rune essence](https://oldschool.runescape.wiki/w/Rune_essence): rune essence is the raw, unimbued material for low-level runes and does not stack like finished runes. Make the essence sample a chunky grey-white stone in the hand or pouch, not just a flat icon.
- OSRS [Rune Mysteries](https://oldschool.runescape.wiki/w/Rune_Mysteries): the novice quest ties early runecrafting to Sedridor, Aubury, research notes, an air talisman, and rune essence mine access. Borrow the research-courier/scribe feeling through a folded note, tablet, or air-talisman teaching prop.
- OSRS [Rune essence mine](https://oldschool.runescape.wiki/w/Rune_essence_mine): the mine is accessed by wizard teleport, and its lore frames essence as a magic-absorbing stone that can be cut into shapes. This supports cut-stone essence samples, route-map mystique, and modest wizard credentials.
- OSRS [Talisman](https://oldschool.runescape.wiki/w/Talisman): talismans are keys to mysterious ruins and matching runic altars, and can be bound to tiaras. Use a visible air talisman pendant, clasp, or teaching medallion as the clearest non-robe runecrafting sign.
- OSRS [Magic combat tutor](https://oldschool.runescape.wiki/w/Magic_combat_tutor): Mikasi is a helpful tutor associated with both Magic and Runecraft and provides beginner rune support. Borrow the approachable tutor stance, but avoid combat spell pose, battle staff drama, or overt Magic Instructor duplication.
- OSRS [Raiments of the Eye](https://oldschool.runescape.wiki/w/Raiments_of_the_Eye): runecrafting robes provide a useful hood-and-robe profession cue. Use the broad idea of specialist runecrafter cloth, not the minigame outfit silhouette or reward-set colors.
- Getty [The History of Wizard Robes](https://www.getty.edu/news/wizard-medieval-robes/): medieval scholar and clergy robes evolved into standard wizard visual language. Push the Rune Tutor toward scholar-scribe authority: hood, layered robe, book/tablet, and restrained status trim.
- Kenney [Mini Characters](https://kenney.nl/assets/mini-characters): compact CC0 low-poly characters with animation-friendly proportions. Use as a scale/readability sanity check for oversized hands, head, and props.
- Synty [POLYGON Fantasy Characters Pack](https://syntystore.com/products/polygon-fantasy-characters-pack) and Quaternius [RPG Character Pack](https://quaternius.com/packs/rpgcharacters.html): useful broad low-poly fantasy references for simple mage/scribe prop vocabulary such as staffs, spellbooks, robes, and blocky readable silhouettes. Do not copy meshes or outfits.

## Silhouette Goals

- First read at thumbnail size: hooded blue-teal runecrafting teacher with a single strong elemental/talisman symbol, essence pouch, held essence stone, and short pointer stylus.
- Keep the body A-shaped and calm: hood over face, shoulder mantle as the top mass, tabard as the center stripe, and a compact belt/pouch band as the practical worker read.
- Differentiate from `tutorial_runecrafting_instructor`: make this a mainland teacher-shopkeeper with a larger talisman, route note, and starter-rune samples instead of just the inherited tutorial tablet and stylus.
- Differentiate from `mainland_combination_sage`: stay cleaner, younger or more approachable, single-discipline, and starter-element focused. No paired split-runes, no multi-pouch progression, no balance-ring chemistry.
- Differentiate from `tutorial_magic_instructor`: no raised combat casting hand, no dramatic wand/staff, no spell attack VFX. The silhouette should say "explains the altar" before "casts spells."
- Give the chest one bold shape that survives distance: either a pale air glyph on the tabard, a small round air talisman pendant, or a four-chip elemental lesson strip. Do not use all three at equal strength.
- Head read should be friendly and readable under the hood: visible nose/mouth plane, maybe short grey brows or a small beard block. Avoid a tall wizard hat or face-hidden cultist hood.

## Color And Materials

- Preserve the current direction as the base: cool blue-teal robe and tabard, warm orange trim/rune marks, dark leather belt/boots, and cream undershirt.
- Suggested palette anchors: hood shadow `#132b3d`, robe `#23455f`, tabard `#2f5f75`, shirt `#ddd0b5`, trim `#d27742`, ember mark `#f0a04b`, air mark `#86c5df`, essence stone `#aaa6a0`, leather `#5a3a27`, parchment `#d7c49a`, dull brass `#b99544`.
- Material hierarchy: matte cloth first, worn leather second, pale stone third, tiny dull brass/copper trim last. Runes can be brighter, but should remain flat-color blocks rather than glowing particles.
- Element accents should be disciplined. Use ember orange and air blue as the main pair; add water or earth only as tiny lesson chips if the model needs to echo the full merchant stock.
- Rune essence should look unimbued: cool grey-white, faceted, quiet. Finished runes can be small colored tablets or square chips with one glyph face.
- Keep purple/violet off the dominant silhouette so the Rune Tutor does not drift toward the Combination Sage. Keep saturated cyan minimal so the model does not become sci-fi.

## Prop And Pose Ideas

- Primary prop: `rune_tutor_essence_sample`, a chunky faceted stone held forward in the right or left hand, scaled large enough to read in the gallery.
- Primary profession cue: `rune_tutor_air_talisman`, worn as a chest pendant or pinned at the tabard top, with a pale-blue face and dull brass rim.
- Teaching prop: `rune_tutor_route_tablet` or `rune_tutor_route_scroll`, a small slate/parchment map with four blocky route marks for ember, water, earth, and air. Keep it close to the torso.
- Tool prop: turn the inherited stylus into a short chalk pointer or runic scribing rod. It should be a teacher's pointer, not a combat staff.
- Pouch prop: keep one `rune_tutor_essence_pouch` on the hip with a visible lid/tie and one pale stone peeking out. Do not add the small/medium/large pouch ladder.
- Optional starter-shop cue: a narrow `rune_tutor_element_strip` across the belt or tablet edge with four tiny square rune samples in ember orange, water blue, earth green, and air cyan.
- Pose target: upright, shoulders relaxed, one forearm extended with the essence stone, pointer hand angled toward the pendant/tablet. The pose should look like a lesson paused mid-sentence.
- Idle animation target for later: slight stone presentation lift, tiny pointer tap, hood nod, pouch bob. Keep it subtle enough for a starter merchant.

## Gallery Scale And Framing

- Keep standard humanoid height and floor contact. Identity should come from hood, tabard, talisman, essence sample, and teaching props, not from scaling the body taller.
- Best gallery angle: front three-quarter with the tabard glyph, talisman/pendant, held essence stone, hip pouch, and route tablet visible at once.
- Required thumbnail read order: blue hood, teal tabard, pale air/talisman mark, grey essence stone, orange trim, leather pouch.
- Props must stay close to the torso and hands. A long staff, wide floating glyph, or oversized scroll will either clip the gallery frame or turn the tutor into a generic mage.
- Make all glyphs blocky and oversized relative to real scale. Hairline runes, tiny parchment text, or thin tiara wires will disappear at NPC gallery size.
- Compare beside `tutorial_runecrafting_instructor`, `tutorial_magic_instructor`, and `mainland_combination_sage`. The Rune Tutor should be the cleanest starter runecrafting read in that lineup.

## Concrete Integration Guidance

- Later implementation target: `src/js/content/npc-appearance-catalog.js`, inside `buildMainlandRuneTutorPreset()`, unless the central NPC gallery/model rework introduces a dedicated authored model layer first.
- Preserve authored identifiers: `mainland_rune_tutor`, label `Rune Tutor`, archetype `mainland_rune_tutor`, world `appearanceId`, merchant ID `rune_tutor`, dialogue ID `rune_tutor`, and NPC gallery preview actor entry.
- Keep using the `buildRuneVariantPreset()` family for a first bespoke pass. The inherited runecrafter hood, mantle, tabard, essence pouch, tablet, and stylus are the right rig baseline; the problem is weak mainland-specific identity.
- Lowest-risk pass: retain the blue-teal theme, enlarge the current air-glyph read, add 6-9 `rune_tutor_*` fragments, and recompose inherited props around "essence plus talisman plus route teaching."
- Suggested fragments: `rune_tutor_air_talisman`, `rune_tutor_essence_sample`, `rune_tutor_route_tablet`, `rune_tutor_route_scroll`, `rune_tutor_chalk_pointer`, `rune_tutor_element_strip`, `rune_tutor_pouch_lid`, `rune_tutor_essence_peek`, `rune_tutor_tabard_air_mark`, and `rune_tutor_hood_clasp`.
- Keep additions front-loaded and inspectable. If fragment budget gets tight, choose talisman, essence sample, route tablet, pouch detail, and one bold tabard glyph before elemental micro-chips.
- If `clonePresetWithTheme()` remains in use, verify that theme keys actually hit the inherited role substrings. Add explicit colors for new `rune_tutor_*` fragments instead of relying on broad role replacement.
- Do not edit merchant tables, skill recipes, quest state, dialogue text, world placement, item catalog, generated assets, runecrafting runtime, combat, or player appearance as part of this model integration.
- Likely failure modes to guard against: tutorial clone, generic blue wizard, combat mage, over-purple sage duplicate, unreadable glyph clutter, invisible essence sample, hidden pouch, or four-element rainbow noise.
- Suggested checks for later runtime work: `node .\tools\tests\npc-model-gallery-runtime-guard.js`, followed by manual `/qa npcgallery` inspection. This brief itself requires no runtime test.
