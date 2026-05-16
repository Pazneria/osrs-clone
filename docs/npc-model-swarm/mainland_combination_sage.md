# Combination Sage (`mainland_combination_sage`)

Owned model: Combination Sage (`mainland_combination_sage`)

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly NPC gallery model. This brief does not authorize runtime code edits.

## Current Read

- Existing preset: `buildMainlandCombinationSagePreset()` in `src/js/content/npc-appearance-catalog.js` is a `buildRuneVariantPreset()` clone of the Tutorial Runecrafting Instructor, labeled `Combination Sage` with archetype `combination_rune_sage`.
- Current visual base: tutorial runecrafter hood, mantle, tabard, essence pouch, tablet, and stylus, recolored to purple robe, violet tabard, gold trim, orange rune mark, plus small water and earth glyph boxes on the torso.
- Current placement: `content/world/regions/main_overworld.json` wires `appearanceId: "mainland_combination_sage"` to merchant `combination_sage` at the Combination Sage Hut, a secluded frontier timber hut west of the Rune Tutor Hut.
- Gameplay read: this is the late 1-40 runecrafting merchant, natural combination-rune unlock quest NPC, strict buyer/seller for essence, combination runes, and essence pouches, with pouch sales unlocked at levels 10, 20, and 30.
- Main risk: the current sage reads as "purple Runecrafting Instructor with two glyphs." The final model needs an older, more experimental, balance-obsessed mainland specialist who is distinct from `mainland_rune_tutor` and `tutorial_runecrafting_instructor`.

## Profession And Gameplay Role

- The sage is not a starter teacher. They are the person players find when elemental runecrafting becomes chemistry: steam, smoke, lava, mud, mist, and dust.
- Their dialogue is about balance and mixtures, so the model should look precise, calm, and slightly dangerous in a scholarly way: someone who has seen failed bindings scorch a table.
- Their merchant stock matters visually. Essence pouches should be a first-read prop, not background garnish, because this NPC sells the pouch progression that makes longer runecrafting routes feel viable.
- They should feel adjacent to magic without becoming a combat wizard. A staff, tablet, or suspended rune ring is appropriate; a battle pose, glowing spell attack, skulls, or huge arcane shoulder armor is not.
- They live in a timber hut in the starter mainland, so keep the fantasy grounded: handmade robes, practical satchels, tarnished brass, chalk marks, wax seals, and small rune samples instead of academy grandeur.

## Source Inspiration

- OSRS [Runecraft](https://oldschool.runescape.wiki/w/Runecraft): Runecraft lets players craft runes for Magic spells and includes essence pouches that hold essence for larger altar runs. Use this for the essence, pouch, and altar-worker identity.
- OSRS [Combination rune](https://oldschool.runescape.wiki/w/Combination_rune): combination runes are made from two rune types and count as both component elements. Use this as the core visual rule: paired elements, fused symbols, and balanced halves.
- OSRS [Runes](https://oldschool.runescape.wiki/w/Runes): runes are small magical stones with elemental symbols, used in combinations for Magic. Use this for simple stone-token props and clear glyph color coding.
- OSRS [Magic combat tutor](https://oldschool.runescape.wiki/w/Magic_combat_tutor): Mikasi is tied to both Magic and Runecraft and manages rune-pouch behavior. Borrow the helpful tutor connection, but age it into a specialist merchant rather than another beginner NPC.
- OSRS [Tutorial Island](https://oldschool.runescape.wiki/w/Tutorial_Island): the Magic Instructor gives air and mind runes and teaches spellcasting basics. The sage should consciously read as post-tutorial: same rune economy, deeper systems.
- OSRS [Raiments of the Eye](https://oldschool.runescape.wiki/w/Raiments_of_the_Eye): runecrafting robes with recolorable red, green, and blue variants. Borrow the robe-and-hood profession cue, but avoid copying the outfit silhouette or making the sage a Guardians of the Rift stand-in.
- Getty [The History of Wizard Robes](https://www.getty.edu/news/wizard-medieval-robes/): medieval scholars and clergy help explain why robes read as learned magic. Use this to push "scholar-sage" through layered cloth, a hood, and a book/tablet silhouette.
- Kenney [Mini Characters](https://kenney.nl/assets/mini-characters): compact low-poly animated characters, CC0, with strong block readability. Use only as scale/readability validation for oversized hands, head, and props.
- Synty [POLYGON Fantasy Characters Pack](https://www.syntystores.shop/product/polygon-fantasy-characters-pack): low-poly fantasy pack listing wizards, sorcerers, staffs, spellbooks, vials, and crystal balls. Use as a broad prop vocabulary reference, not as mesh or outfit source.

## Silhouette Goals

- First read at thumbnail size: hooded elder sage, layered asymmetric robe, big pouch cluster, and two or more visible rune elements being compared or fused.
- Differentiate from `mainland_rune_tutor`: the Rune Tutor should teach elemental basics; the Combination Sage should look like a mixer, appraiser, and pouch vendor. Rune Tutor can stay cleaner and single-glyph; sage should be busier but controlled.
- Differentiate from `tutorial_runecrafting_instructor`: keep the hood/altar-scribe family, but replace the tutorial tablet-stylus read with a heavier merchant satchel, a binding staff or balance rod, and paired element samples.
- Give the torso an asymmetric "split discipline" shape: one shoulder mantle edge lower, one sash crossing diagonally, or two offset front panels that imply separate elements being drawn together.
- Use one strong circular or triangular read around the chest or staff head: a small rune ring, paired discs, or triangular talisman cluster. This should signal combination craft before color detail is visible.
- Head read should be wise and weathered: deep hood, pale beard or grey brows, visible nose/mouth block, maybe a small brass circlet or hood clasp. Avoid tall cone wizard hat; that would make the NPC too generic.

## Color And Materials

- Preserve the existing sage direction as the base: muted purple-indigo robe, violet tabard, warm gold trim, dark leather belt/boots, cream undershirt.
- Add controlled elemental accents instead of a rainbow robe. Recommended accent set: water blue `#6faed8`, earth green `#8fb86f`, ember orange `#e58a44`, air pale cyan `#b8d8df`.
- The outfit should be mostly matte cloth and worn leather. Brass/gold trim should be low-saturation and small; runes can be brighter but should be flat-color blocks, not emissive bloom.
- Use stone/ceramic for rune samples: grey essence cores with colored glyph faces. Combination runes should show two colors on one object where possible, such as split discs or stacked square plates.
- Suggested palette anchors: robe `#342b55`, mantle shadow `#241f3d`, tabard `#573f74`, shirt `#ddd0b5`, trim `#d6a85f`, pouch leather `#5a3b29`, essence stone `#a7a1a0`, dark boot `#211b17`.
- Do not let purple dominate every fragment. The sage needs a readable neutral leather-and-stone prop mass to stop them from becoming a one-note violet silhouette.

## Prop And Pose Ideas

- Add three essence pouches at the belt or hip, scaled small/medium/large. Use clear size differences and tiny colored ties so the level 10/20/30 pouch progression is visible in the gallery.
- Replace or augment the inherited stylus with a short binding staff or balance rod: dark wooden shaft, brass end caps, and two tiny rune stones mounted at opposing ends.
- Add a front `combination_sage_binding_ring`: a flat torus-like arrangement built from box fragments or four square tablets around the chest, with water/earth/ember/air chips spaced around it.
- Add one held rune sample in the off hand: a split blue/orange steam rune, green/orange lava rune, or blue/green mud rune. Pick one, not all six, for readability.
- Optional shoulder or back prop: a rolled star chart or folded altar-route parchment tucked into the satchel. This sells "secluded expert" without adding another weapon.
- Pose target: upright and calm, one lower arm presenting a rune sample, the staff/rod angled slightly across the body. Hands should look careful, not dramatic.
- Avoid combat spell VFX, floating particle clusters, giant spellbooks, skulls, crescent moons, crystal balls larger than the head, or full rainbow elemental halos.

## Gallery Scale And Framing

- Keep standard humanoid floor contact and head height. Make the sage feel senior through hood volume, posture, and props, not by scaling the whole body larger.
- Best gallery angle: front three-quarter with pouch cluster, chest binding ring, face, and one held split-rune sample visible.
- Thumbnail test: if reduced to a small preview, the model should still read as "runecrafting mixture sage" from purple hood, pouch cluster, paired rune colors, and balance staff.
- Compare beside `mainland_rune_tutor`, `tutorial_runecrafting_instructor`, and `tutorial_magic_instructor`. The sage should be the most specialist and merchant-like of the set, while staying less combative than the Magic Instructor.
- Keep side props close to the torso. Wide staff heads or large floating ring silhouettes may clip the standard gallery frame and make the NPC harder to inspect.

## Concrete Integration Guidance

- Later implementation target: `src/js/content/npc-appearance-catalog.js`, inside `buildMainlandCombinationSagePreset()`, unless the gallery rework creates a central model-authoring layer first.
- Preserve authored identifiers: `mainland_combination_sage`, label `Combination Sage`, archetype `combination_rune_sage`, `appearanceId` wiring, merchant ID `combination_sage`, dialogue ID `combination_sage`, and preview actor entry.
- Keep using the `buildRuneVariantPreset()` family unless central integration intentionally replaces all humanoid model authoring. The shared runecrafter rig already gives the right hood, mantle, pouch, tablet, and stylus baseline.
- First-pass fragment additions should be specific and inspectable: `combination_sage_small_pouch`, `combination_sage_medium_pouch`, `combination_sage_large_pouch`, `combination_sage_binding_ring`, `combination_sage_water_chip`, `combination_sage_earth_chip`, `combination_sage_ember_chip`, `combination_sage_air_chip`, `combination_sage_split_rune`, `combination_sage_balance_rod`.
- Retain the current water and earth glyph idea, but recompose it so the paired-element read is not just two flat torso squares. Put element chips into a ring, staff head, or held rune sample.
- Keep additions to roughly 8-12 fragments. Prioritize pouch scale, paired rune sample, and asymmetric robe read over micro-glyph clutter.
- If retheming via `clonePresetWithTheme()`, verify role substring matches before relying on theme keys. Extra fragments with explicit colors are safer for the new split-rune and pouch details.
- Do not edit combat, quest, shop economy, world placement, dialogue, item catalog, generated assets, or runecrafting runtime during visual integration.
- Likely failure modes to guard against: purple tutorial duplicate, generic wizard, combat mage, too many element colors, unreadable tiny glyphs, pouch props hidden from gallery angle, rune tutor visual overlap, or "rainbow alchemist" instead of OSRS-grounded runecrafting sage.
