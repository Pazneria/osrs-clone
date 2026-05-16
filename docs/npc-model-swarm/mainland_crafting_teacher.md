# Crafting Teacher (`mainland_crafting_teacher`)

Owned model: Crafting Teacher (`mainland_crafting_teacher`)

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly NPC gallery model. This brief does not authorize runtime code edits.

## Current Read

- Existing preset: `buildMainlandCraftingTeacherPreset()` in `src/js/content/npc-appearance-catalog.js` clones `buildTutorialCraftingInstructorPreset()`, relabels it as `Crafting Teacher`, sets archetype `market_crafting_teacher`, rethemes the tutorial artisan browns, and adds one small gold `crafting_teacher_pin`.
- Inherited visual base: the Tutorial Crafting Instructor is itself a rethemed Mining/Smithing Instructor with a brown apron, warm shirt, dark trousers, boots, leather, muted metal, a torso `crafting_tool_roll`, a `small_chisel`, and a `soft_clay_lump` in the right lower arm.
- Current placement: `content/world/regions/main_overworld.json` places `appearanceId: "mainland_crafting_teacher"` at the market-side crafting teacher cottage, tagged `merchant`, `crafting`, `art`, and `market`.
- Gameplay role: the merchant buys and sells only `chisel`, `needle`, and `thread`, while dialogue teaches simple material handling: leather, gems, glass, thread, practice, and clean shapes.
- Main risk: the preset already reads like a craft-adjacent tutorial worker, but not yet like a mainland market craft teacher. It needs a stronger apron/tool/lesson-board silhouette without drifting into Elira Gemhand's jeweler identity, Tanner Rusk's leather yard identity, or a generic smith.

## Profession And Gameplay Role

- This NPC is the approachable starter-crafting mentor for the mainland market cluster: practical, patient, and shop-useful rather than prestigious.
- The model should say "first tools and clean technique": chisel, needle, thread, clay, leather patch, and maybe one ring mould sample. Avoid making jewellery or gems the dominant read because `mainland_elira_gemhand` owns the precious-material progression.
- The teacher's lesson is material literacy. The model can imply clay, leather, gems, glass, and thread, but the merchant stock says the first-view prop language should be chisel/needle/thread.
- The teacher belongs near an artisan cottage, not a guildhall throne room. Use a tidy market-workshop presentation: apron front, tool roll, sample board, compact pouches, and a small craft pin.
- Personality target: warm exacting teacher. The pose should feel like a calm demonstration of how to start correctly, not like guarding a doorway or selling luxury goods.

## Source Inspiration

- OSRS Crafting tutor dialogue covers the right teaching spread: leather work with needle/thread, spinning, pottery, glass blowing, jewellery, chisel use, moulds, and furnace work. Use this as the breadth of the teacher's knowledge, not as a costume to copy. Source: https://oldschool.runescape.wiki/w/Transcript:Crafting_tutor
- OSRS Crafting defines the skill as making jewellery, pottery, armour, glass items, and other goods; it also ties gem cutting to chisels and jewellery to moulds/furnaces. Source: https://oldschool.runescape.wiki/w/Crafting
- OSRS Crafting Guild is the strongest apron/workshop reference: entry requires a brown or golden apron, and the guild includes a potter's wheel, pottery oven, spinning wheel, tanner, mine, mould spawns, and shears. Source: https://oldschool.runescape.wiki/w/Crafting_Guild
- OSRS Brown apron is a simple, equipable Crafting Guild access item. Borrow the big brown front panel as the primary profession silhouette. Source: https://oldschool.runescape.wiki/w/Brown_apron
- OSRS Chisel is a small crafting tool for cutting and shaping hard non-metals, mainly gems and limestone. Represent it as a short chunky metal wedge, not a hair-thin spike. Source: https://oldschool.runescape.wiki/w/Chisel
- OSRS Thread is used with a needle to make leather and hide armour, and each spool has limited uses. Use a visible off-white spool or loop of thread as a starter-supply cue. Source: https://oldschool.runescape.wiki/w/Thread
- OSRS Ring mould lets players make rings from gold bars and gems at a furnace. Use a tiny belt-hung mould or lesson-board sample if a circular prop is needed, but keep it secondary to tools. Source: https://oldschool.runescape.wiki/w/Ring_mould
- OSRS Master Crafter/Crafting Guild precedent supports "accomplished workshop" language and the idea that craft authority can be expressed through a small badge/cape reference, but this NPC should stay a teacher, not a 99-cape master. Source: https://oldschool.runescape.wiki/w/Transcript:Master_Crafter
- Leatherworking tool references support an awl, harness needle, thread, edge tool, and simple tool roll as believable artisan details. Sources: https://www.abbeyengland.com/workshop-materials/tools/abbey-tools, https://identityleathercraft.com/collections/awls
- Low-poly discipline references: Kenney Mini Characters prove compact readable humans with animation-friendly proportions; Quaternius/OpenGameArt Low Poly RPG Pack is useful for simple faceted RPG props including staffs, gems, gold, and tools; Sketchfab blacksmith/craftsperson references are useful only for apron/tool-belt silhouette, not mesh or texture copying. Sources: https://kenney.nl/assets/mini-characters, https://opengameart.org/content/low-poly-rpg-pack, https://sketchfab.com/3d-models/blacksmith-lowpoly-d9643c498a8046519c1b158f3eb2f92f

## Silhouette Goals

- First read at thumbnail size: brown apron teacher with starter crafting tools. The apron must beat all other reads.
- Build a clean front triangle/rectangle from shoulders to knees: broad apron panel, tied side straps, and one bright but tiny gold craft pin near the chest.
- Add one strong diagonal through the torso or hip: chisel tucked across the tool roll, needle case angled from belt to apron pocket, or sample board held at a shallow angle.
- Make thread visible as a chunky spool or loop, not a real-scale strand. A pale coil at belt height will read better than a thin line near the hand.
- Keep the clay cue simple: a soft-clay lump, small unfired pot, or flat practice tablet in one hand. It should be warm tan and rounded enough to distinguish from ore.
- Keep jewellery/gem cues tertiary. One ring mould disk, one dull silver ring sample, or one small blue gem chip is enough. Anything larger turns the model into Elira.
- Hands should teach. One hand presents material or a practice board; the other points with a chisel, needle case, or short awl.
- Avoid tall hats, dramatic cape, heavy apron armor, smith hammer/anvil language, excessive gem sparkle, or a full leatherworking yard kit.

## Color And Materials

- Preserve the current earthy palette: apron `#695545`, shirt `#8a4d39`, leather `#5a3925`, trousers `#3c3933`, boots `#2b2118`, muted metal `#c2b28d`, clay `#b08a68`, and pin gold `#d0b05a`.
- Apron should be the largest flat material mass: warm brown leather or heavy cloth, lightly darker than the shirt so the torso layers separate.
- Shirt should stay terracotta/rust rather than purple, green, or blue. That separates the teacher from fletching, woodcutting, runecrafting, and jewelcraft specialists.
- Tool metal should be dull off-silver or worn brass. Small chisels, awl tips, buckles, and mould rims can use metal; no broad steel surfaces.
- Thread should be off-white linen, thick enough to survive gallery scale. Avoid pure white unless the rest of the torso is too dark.
- Clay should be matte tan/orange-brown with one darker underside plane. No glossy ceramic finish; this teacher demonstrates basics before firing.
- Accent gems, if used, should be one restrained sapphire-blue or ruby-red dot. Do not add a gem necklace, gem tray, or jewel crown.
- Materials should be flat-shaded and faceted. Use geometry breaks, color blocks, and simple bevel-like planes instead of texture noise.

## Prop And Pose Ideas

- Priority prop: `crafting_teacher_tool_roll`, a horizontal or slightly diagonal leather roll across apron/hip with three large readable slots.
- Primary tool set: `crafting_teacher_chisel`, `crafting_teacher_needle_case`, and `crafting_teacher_thread_spool`. These match the live merchant stock and should be visible from front three-quarter.
- Secondary teaching prop: `crafting_teacher_practice_tablet`, a small clay slab or sample board held in one hand with a shallow incised line or dot row.
- Optional OSRS nods: `crafting_teacher_ring_mould_disk`, `crafting_teacher_soft_clay_lump`, `crafting_teacher_apron_tie`, `crafting_teacher_pocket_patch`, and `crafting_teacher_gold_pin`.
- Pose target: relaxed upright stance, shoulders open, head angled toward the material in hand, one forearm slightly forward as if demonstrating the first step.
- Idle animation target for later: tiny wrist turn to show the clay/tablet, small nod, thread spool bob, then return to neutral.
- Trade/talk animation target for later: tap the tool roll or extend the chisel/needle case as the "starter tools" offer.

## Gallery Scale And Framing

- Keep standard humanoid height. Identity should come from the apron and props, not scaling the whole body.
- Best gallery angle: front three-quarter, with apron front, pin, tool roll, hand material, and one side pouch visible.
- Avoid placing all tools on the back or far hip. Back props vanish in the NPC gallery and can make the model read as a generic brown worker.
- The chisel, needle, and thread are tiny real-world objects, so stylize them oversized: 2-3x plausible scale, blocky, and separated by color.
- Keep the thread coil as a compact circular/oval chunk at belt or hand height. Hairline thread will disappear and may shimmer in motion.
- Required thumbnail read order: brown apron, tool roll, pale thread spool, metal chisel/needle, soft clay/practice board, gold craft pin.
- Compare beside `tutorial_crafting_instructor`, `mainland_elira_gemhand`, `tanner_rusk`, and `mainland_market_trader`. The Crafting Teacher should be the clearest starter-tool mentor in that lineup.

## Concrete Integration Guidance

- Later implementation target: `src/js/content/npc-appearance-catalog.js`, inside `buildMainlandCraftingTeacherPreset()`, unless the central NPC gallery/model rework introduces a dedicated authored model layer first.
- Preserve authored identifiers: `mainland_crafting_teacher`, label `Crafting Teacher`, archetype `market_crafting_teacher`, world `appearanceId`, merchant ID `crafting_teacher`, dialogue ID `crafting_teacher`, and NPC gallery preview actor entry.
- Lowest-risk pass: keep the current Tutorial Crafting Instructor clone, retain the brown artisan theme, enlarge the apron read, and add 8-12 teacher-specific fragments with `crafting_teacher_*` role names.
- Better bespoke pass: shift away from the Mining/Smithing Instructor inheritance toward a lighter worker/guide body with custom craft props. This removes inherited smith/miner mass while preserving the same humanoid scale and animation expectations.
- Suggested fragments: `crafting_teacher_apron_front`, `crafting_teacher_apron_tie_left`, `crafting_teacher_apron_tie_right`, `crafting_teacher_tool_roll`, `crafting_teacher_chisel`, `crafting_teacher_needle_case`, `crafting_teacher_thread_spool`, `crafting_teacher_soft_clay_lump`, `crafting_teacher_practice_tablet`, `crafting_teacher_ring_mould_disk`, `crafting_teacher_pocket_patch`, `crafting_teacher_gold_pin`.
- Keep additions front-loaded and inspectable. If the fragment budget gets tight, choose apron/tool roll/thread/chisel/soft clay before jewellery details.
- If `clonePresetWithTheme()` remains in use, verify theme keys actually hit the inherited role substrings. Add explicit fragment colors for any new `crafting_teacher_*` parts instead of relying on broad role replacement.
- Do not edit combat, skill recipes, merchant tables, quest state, dialogue, world placement, generated assets, or item icon sources as part of this model integration.
- Likely failure modes to guard against: generic brown vendor, jeweler duplicate, tanner duplicate, smith duplicate, tutorial clone, invisible needle/thread, too much gem sparkle, or prop clutter that shrinks the humanoid in the gallery.
- Suggested checks for later runtime work: `node .\tools\tests\npc-model-gallery-runtime-guard.js`, followed by manual `/qa npcgallery` inspection. This brief itself requires no runtime test.
