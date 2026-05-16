# Tutorial Magic Instructor (`tutorial_magic_instructor`)

Owned model: Tutorial Magic Instructor (`tutorial_magic_instructor`)

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly NPC gallery model. This brief does not authorize runtime code edits.

## Current Read

- Existing preset: `buildTutorialMagicInstructorPreset()` in `src/js/content/npc-appearance-catalog.js` clones `buildTutorialGuidePreset()`, labels it `Magic Instructor`, sets archetype `rune_lesson_mage`, rethemes the guide into purple cloth, and adds a soft hood back, diagonal rune sash, sash rune mark, and a short staff with cap/core fragments.
- Current palette base: coat `#3c2d63`, shirt `#d7d2e8`, trim `#9bc2d8`, belt `#2c223d`, trouser `#2f2948`, boot `#21192c`, hood `#2b2149`, sash `#7f74bd`, rune mark `#d8c56f`, staff wood `#6b4729`, staff brass `#b99544`, staff core `#e07a3f`.
- Current world placement: `content/world/regions/tutorial_island.json` wires `appearanceId: "tutorial_magic_instructor"` at `x: 292, y: 336` with `serviceId: "merchant:tutorial_magic_instructor"`, `spawnId: "npc:tutorial_magic_instructor"`, `action: "Talk-to"`, `dialogueId: "tutorial_magic_instructor"`, and tags `tutorial` plus `magic`.
- Current scene context: the nearby `tutorial_magic_lesson_board` stands at `x: 294, y: 338`, so the NPC already has environmental support for a late tutorial spell lesson. The model should not carry a full board or chicken pen.
- Current dialogue read: `src/js/content/npc-dialogue-catalog.js` frames magic as focus, staff, and runes; the practical advice is to equip the staff, keep runes in inventory, and attack from range.
- Current item/model context: generated `assets/models/air_staff.obj`, `air_rune.obj`, elemental staff/rune models, and plain staff models exist as broad silhouette references, but they are generated artifacts and should not be edited for this brief.
- Gallery entry already exists in `window.NpcAppearanceCatalog.previewActors` as `{ actorId: 'tutorial_magic_instructor', label: 'Magic Instructor' }`.
- Main risk: the current preset reads as "purple Tutorial Guide holding a staff." The bespoke version needs to be a first-spell teacher, visibly separate from `tutorial_runecrafting_instructor`, `mainland_rune_tutor`, and `mainland_combination_sage`.

## Tutorial And Gameplay Role

- This is the final practical instructor in the Tutorial Island route: the NPC who turns abstract interface learning into "select spell, spend runes, attack from range, then leave for the mainland."
- In OSRS source language, Terrova teaches Magic, the spellbook interface, spell filtering, casting, Wind Strike, and the handoff into Lumbridge travel. In this repo, the same role is compressed into staff, rune, and range instruction.
- The model should read as a patient classroom mage before it reads as a combat wizard. He is supervising a safe first cast, not dueling, selling rare spellcraft, or performing academy theater.
- The player-facing fantasy is "I can understand this spell system." That means the clearest props are lesson staff, rune tokens, spellbook/slate, and one simple air-spell mark.
- Keep the mood approachable and lightly authoritative: a warm instructor who has explained rune costs hundreds of times, with one hand or staff point aimed at the next click target.
- He should bridge to mainland magic tutors without replacing them. `Magic combat tutor` references can inform the free-rune tutor read, but this model should stay Tutorial Island-specific through the lesson board, spellbook, and first-cast posture.
- Avoid archmage, battle sorcerer, necromancer, robed cultist, celestial astrologer, spell-shop merchant, or high-level staff user reads. This is a starter teacher with safe magic props.

## Source Inspiration

- OSRS [Magic Instructor](https://oldschool.runescape.wiki/w/Magic_Instructor): Terrova is the last Tutorial Island instructor, teaches spellcasting, provides five air and five mind runes, and supervises practice against chickens. Use this for final-instructor posture, modest authority, and beginner-rune props.
- OSRS [Tutorial Island](https://oldschool.runescape.wiki/w/Tutorial_Island): the Magic building teaches the Magic skill, spellbook interface, spell filters, casting spells, Wind Strike, and the Lumbridge Home Teleport exit. Use this for the "last step before the mainland" staging.
- OSRS [Magic combat tutor](https://oldschool.runescape.wiki/w/Magic_combat_tutor): Mikasi is a mainland tutor for Magic and Runecraft who can provide air and mind runes. Borrow the helpful tutor/free-rune identity, but keep Terrova more tutorial-board and first-cast focused.
- OSRS [Wind Strike](https://oldschool.runescape.wiki/w/Wind_Strike): the first standard spell is an air missile with a tiny rune cost. Use a single pale air spiral, small diagonal gust, or highlighted spell tile rather than broad combat VFX.
- OSRS [Runes](https://oldschool.runescape.wiki/w/Types_of_runes): air and mind runes are the key starter spell resources. Represent them as chunky colored lesson tokens, not fine glyph writing.
- OSRS [Staff of air](https://oldschool.runescape.wiki/w/Staff_of_air): a basic air elemental staff provides air runes and autocast support. Use this for a simple wooden staff with a pale-blue air cue, but keep it shorter and more didactic than a heroic weapon.
- Getty [The History of Wizard Robes](https://www.getty.edu/news/wizard-medieval-robes/): medieval scholar and clergy robes are a root of wizard visual language. Push the instructor toward scholar-teacher robes, rank trim, and readable cloth layers instead of "mysterious dark mage."
- British Library [Merlin: International Man of Mystery](https://britishlibrary.typepad.co.uk/digitisedmanuscripts/2013/02/merlin-international-man-of-mystery.html): medieval magician imagery leans on pointy hats, headgear, beards, and courtly consultation. Borrow a modest soft hood or small cap silhouette, not a giant cone hat.
- OpenGameArt [LowPoly RPG Characters](https://opengameart.org/content/lowpoly-rpg-characters) and Quaternius [Ultimate RPG Pack](https://quaternius.com/packs/ultimaterpg.html): CC0 low-poly fantasy references for readable heads, hands, staffs, and compact props. Use as scale/readability sanity checks, not as mesh source.
- Synty [POLYGON Fantasy Characters Pack](https://syntystore.com/products/polygon-fantasy-characters-pack): broad low-poly fantasy vocabulary includes wizard, sorcerer, staffs, spellbooks, wand, and crystal ball props. Use only as a reminder that one or two bold props beat a cluttered wizard kit.

## Silhouette Goals

- First read at thumbnail size: purple magic teacher, soft hood/cap, diagonal rune sash, short staff, small spellbook or lesson slate, and two visible starter rune tokens.
- Keep the silhouette upright and instructor-like. A slight forward lean, one explaining palm, and staff angled like a pointer communicate teaching better than a raised battle-cast pose.
- Make the staff a classroom instrument: wood shaft, brass cap, pale air ring or gem, and a small warm mind-rune token near the head. It should be readable, but not taller or more powerful than the NPC.
- Add one front-facing spell lesson prop. Best options are a small open spellbook, a square spellbook-grid slate, or a parchment card with one highlighted Wind Strike tile. This is the main upgrade from generic wizard to tutorial instructor.
- Differentiate from `tutorial_runecrafting_instructor`: no altar tablet, essence pouch emphasis, route map, hooded scribe posture, or elemental workshop clutter. This model teaches spell use, not rune creation.
- Differentiate from `mainland_rune_tutor` and `mainland_combination_sage`: fewer pouches, cleaner robe, no talisman pendant as the main read, no multi-element chemistry. Air/mind and spellbook should dominate.
- Differentiate from `tutorial_ranged_instructor`: both teach distance attacks, but the Magic Instructor should point through staff/spellbook/runes rather than weapon ammunition or quiver language.
- Let the face stay visible under the hood. A small beard, moustache, or brow block is fine; a face-hidden cowl makes him too ominous for a starter NPC.
- Avoid wide floating glyph rings, giant crystal balls, long wizard sleeves that obscure the hands, battle aura, skulls, moon/stars robe spam, oversized chicken/cage props, or a full lesson board strapped to the body.

## Color And Materials

- Preserve the existing purple tutorial-mage family as the base: deep violet coat, pale lavender shirt, cool blue trim, dark belt/trousers/boots, and a slightly darker hood.
- Suggested expanded anchors: hood shadow `#21183a`, robe `#3c2d63`, robe shadow `#2b2149`, sash `#7f74bd`, trim/air stitch `#9bc2d8`, shirt/page `#d7d2e8`, parchment `#e0d2a8`, mind rune `#d8c56f`, air rune `#b8e3ef`, staff wood `#6b4729`, staff brass `#b99544`, belt `#2c223d`, boots `#21192c`.
- Materials should be flat-shaded and faceted. Use blocky planes, layered cloth strips, and big color islands. Do not depend on tiny text, ornamental symbols, or texture noise.
- Air magic should be pale blue-white and light, with one or two small accent blocks. Mind-rune warmth should be yellow-ochre or muted orange, not treasure gold.
- The spellbook/slate needs strong value separation from the robe. Pale pages against purple are more important than complex page markings.
- Keep brass restrained. A staff cap, sash clasp, or rune-token rim can carry the metal read; avoid ornate gold wizard jewelry.
- Let the purple cloth own most of the body, then use air blue, mind ochre, parchment, and wood as distinct teaching cues. If every prop glows, nothing teaches.

## Prop And Pose Ideas

- Upgrade the staff from generic `staff_shaft`/`staff_cap`/`staff_rune_core` into `magic_instructor_lesson_staff`: slightly short, angled across the body, with a pale air ring or gem and one warm mind-rune chip mounted near the cap.
- Add `magic_instructor_spellbook` or `magic_instructor_spell_slate` in the off hand: two pale page slabs or a dark slate with a 3x2 spell-grid pattern and one highlighted Wind Strike square.
- Add two oversized rune tokens at the belt or in a small palm cluster: `magic_instructor_air_rune_token` in pale cyan and `magic_instructor_mind_rune_token` in muted ochre. Keep them flat, chunky, and larger than real inventory scale.
- Add a tiny `magic_instructor_wind_mark`: three stepped pale-blue cubes or a short diagonal gust near the staff head or explaining hand. Static fragment only; no particle cloud needed.
- Keep the existing `rune_sash` idea, but make it read as a teacher's rank sash or spell-path marker rather than a runecrafting tabard. One large rune mark is enough.
- Optional head detail: a soft hood top, small folded cap, or short hood side panels. Choose a compact silhouette. A giant pointed wizard hat will overpower the Tutorial Island teacher read.
- Optional belt detail: small rune pouch or chalk packet with two visible chips. Do not add the multi-pouch progression that belongs to runecrafting NPCs.
- Pose target: left forearm cradles book/slate, right hand or staff points toward the imagined lesson board/chicken pen, shoulders open to the player, head tipped slightly down as if checking the player's spellbook.
- Idle animation target for later: tiny staff point, page/slate tilt, one calm nod, then back to neutral. No dramatic casting loop, no combat flourish, no hovering spell storm.

## Gallery Scale And Framing

- Keep standard tutorial humanoid height and floor contact. The model should line up with `tutorial_guide`, `tutorial_ranged_instructor`, `tutorial_runecrafting_instructor`, and `tutorial_bank_tutor`.
- Best gallery angle: front three-quarter from the staff/book side, rotated enough to show staff head, spellbook/slate face, sash mark, hood, and both rune tokens.
- Required thumbnail read order: purple robe, pale spellbook/slate, staff with air cue, diagonal sash/rune mark, air/mind tokens, friendly hooded face.
- Keep the staff within the standard card frame. A staff that clips the thumb or towers above the head will read as a player weapon preview instead of an NPC teacher model.
- Do not include a chicken, cage, target, full lesson board, teleport portal, or mainland scenery as part of the NPC model. World props and gameplay already carry that context.
- Compare beside `tutorial_runecrafting_instructor`, `mainland_rune_tutor`, `mainland_combination_sage`, and `tutorial_ranged_instructor`. The Magic Instructor should be the clearest "spellcasting lesson" in that lineup.
- Oversize the instructional details deliberately. A 3x2 spell grid, one highlighted tile, and two rune chips will survive gallery scale better than authentic tiny runic text.

## Concrete Integration Guidance

- Later implementation target: `src/js/content/npc-appearance-catalog.js`, inside `buildTutorialMagicInstructorPreset()`, unless the central NPC gallery/model rework introduces a dedicated authored model layer first.
- Preserve authored identifiers and wiring: `tutorial_magic_instructor`, label `Magic Instructor`, archetype `rune_lesson_mage`, `appearanceId`, `spawnId: "npc:tutorial_magic_instructor"`, `dialogueId: "tutorial_magic_instructor"`, tutorial magic tags, and gallery preview actor entry.
- Lowest-risk pass: keep the current `buildTutorialGuidePreset()` inheritance and purple theme, then replace or supplement the six generic extra fragments with a tighter set of instructor-specific props.
- Suggested fragments: `magic_instructor_hood_top`, `magic_instructor_hood_side_left`, `magic_instructor_hood_side_right`, `magic_instructor_sash_rune`, `magic_instructor_lesson_staff_shaft`, `magic_instructor_staff_air_ring`, `magic_instructor_staff_mind_core`, `magic_instructor_spellbook_cover`, `magic_instructor_spellbook_left_page`, `magic_instructor_spellbook_right_page`, `magic_instructor_spell_grid`, `magic_instructor_wind_strike_mark`, `magic_instructor_air_rune_token`, `magic_instructor_mind_rune_token`, `magic_instructor_rune_pouch`.
- Preferred attachment points: `head` for hood/cap, `torso` for sash and pouch, `leftLowerArm` for book/slate, `rightLowerArm` for explaining palm accents, and the existing `axe`/held-tool slot for staff fragments.
- If fragment count needs restraint, prioritize staff head, book/slate, air rune, mind rune, hood shape, and one sash mark. Those six cues will outperform extra robe trim.
- If `clonePresetWithTheme()` remains the path, remember that appended extras are safest with explicit `rgbColor` values. Do not rely on broad theme key replacement for new `magic_instructor_*` roles.
- Keep all props close to the humanoid rig and readable from the NPC gallery camera. Avoid detached board/cage/chicken fragments, wide spell circles, or props that require a custom camera to understand.
- Do not edit tutorial progression, dialogue text, world placement, merchant tables, item catalog, runecrafting specs, player appearance, generated OBJ/PNG assets, or combat runtime as part of this model integration.
- Likely failure modes to guard against: purple guide clone, generic wizard, combat mage, runecrafting duplicate, over-large staff, hidden spellbook, unreadable rune specks, all-purple silhouette, or a model that only reads as magic when standing beside the lesson board.
- Suggested checks for later runtime work: `node .\tools\tests\npc-model-gallery-runtime-guard.js`, followed by manual `/qa npcgallery` inspection focused on `tutorial_magic_instructor`. This brief itself requires no runtime test.
