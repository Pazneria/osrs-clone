# Tutorial Crafting Instructor (`tutorial_crafting_instructor`)

Owned model: `tutorial_crafting_instructor`

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly Tutorial Island NPC gallery model. This brief is for central integration planning only; it does not authorize runtime code edits.

## Current Read

- Live placement: `content/world/regions/tutorial_island.json` spawns `npc:tutorial_crafting_instructor` at `x: 218, y: 336`, with `appearanceId: "tutorial_crafting_instructor"`, dialogue `tutorial_crafting_instructor`, tags `tutorial` and `crafting`, and no roaming.
- Live preset: `buildTutorialCraftingInstructorPreset()` in `src/js/content/npc-appearance-catalog.js` clones `buildTutorialMiningSmithingInstructorPreset()`, rethemes it into earthy craft browns, and adds only three bespoke craft fragments: `crafting_tool_roll`, `small_chisel`, and `soft_clay_lump`.
- Current palette: apron `#6f5845`, shirt `#8b4d3a`, leather `#5d3a24`, trousers `#3d3a35`, boots `#2a2018`, muted metal `#b8a98b`, and clay `#a78668`/`#b28a6d`.
- Tutorial spec wants "clay/tool-roll/artisan cues"; current dialogue gives clay and a borrowed ring, asks the player to soften clay at the pond, then use soft clay on the borrowed ring near the bench.
- Main risk: the inherited Mining/Smithing base gives the correct apron-worker mass, but the model can read as a recolored smith unless the clay, ring-imprint lesson, tool roll, and bench-teacher posture become louder than the inherited workshop body.

## Tutorial And Gameplay Role

- This NPC teaches the first crafting idea in the clone: prepare a plain material, stand at the work area, and use one inventory item on another to produce a shaped result.
- The role is narrower than the mainland `mainland_crafting_teacher`: this is not a market shop mentor for needle/thread/chisel supply. It is the tutorial clay-and-mould instructor who must make "soft clay plus borrowed ring" readable immediately.
- Personality target: calm practical demonstrator. He should feel like someone stationed at a training bench with a tidy kit, not a guild master, jeweler, tanner, or smith.
- The model should reward the player for walking up before reading dialogue: "that person teaches crafting because he has a brown apron, clay in hand, a tool roll, and a tiny ring/mould sample."
- Tutorial Island pacing matters. Keep visual language simple, friendly, and low-clutter so the player does not assume a complex crafting shop opens here.

## Source Inspiration

- OSRS Tutorial Island establishes the broader tutorial-instructor formula: simple staged lessons, short route goals, and skill stations with clear NPC guidance. Source: https://oldschool.runescape.wiki/w/Tutorial_Island
- OSRS Crafting tutor dialogue is the best official adjacent teacher reference: low-level crafting starts with leather, needle, and thread, while broader crafting includes pottery, glass blowing, jewellery, moulds, chisels, and furnaces. Source: https://oldschool.runescape.wiki/w/Transcript:Crafting_tutor
- OSRS Crafting defines the skill around jewellery, pottery, armour, and other made goods; borrow breadth only as small background details because this tutorial station is clay-first. Source: https://oldschool.runescape.wiki/w/Crafting
- OSRS Crafting Guild gives the strongest profession silhouette: brown/golden apron access, potter's wheels, pottery oven, spinning wheels, tanner, mould spawns, chisel/hammer tables, and clay/silver/gold context. Source: https://oldschool.runescape.wiki/w/Crafting_Guild
- OSRS Brown apron is the cleanest single costume cue for Crafting Guild identity. Source: https://oldschool.runescape.wiki/w/Brown_apron
- OSRS Chisel is a small crafting tool for cutting and shaping hard non-metals, mainly gems and limestone. Use it as a blunt starter-tool prop, not as a weapon. Source: https://oldschool.runescape.wiki/w/Chisel
- OSRS Thread notes needle/thread leatherwork and finite spool use. This can inspire one tiny belt spool, but should stay secondary to clay for this tutorial NPC. Source: https://oldschool.runescape.wiki/w/Thread
- OSRS Ring mould supports the ring-imprint teaching beat without making the model a jeweler; a small mould disk or ring sample is enough. Source: https://oldschool.runescape.wiki/w/Ring_mould
- Historic craft references support chunky hand-tool silhouettes: medieval tool boards favor obvious handles and simple iron shapes, while needle/awl history and leatherwork practice make awl, needle case, waxed thread, and tool-roll details believable. Sources: https://www.worldhistory.org/image/17911/medieval-carpenters-tools/, https://www.needlemakers.org.uk/industrial-heritage/history-of-needlemaking, https://sites.udel.edu/materialmatters/2019/06/19/shoemaking-the-dexterous-craft/, https://www.libertyleathergoods.com/recommended-tools/awls/
- Low-poly reference direction: Kenney Mini Characters prove very compact human reads can carry identity through large props and block colors; LOWPO Villager NPC and Sketchfab medieval villager/craftsman references are useful for apron/tool-belt/riggable villager proportions only, not geometry copying. Sources: https://kenney.nl/assets/mini-characters, https://standout7.itch.io/villagernpc, https://sketchfab.com/3d-models/medieval-villager-low-poly-stylized-rigged-d371652c9d3047cd82b712bc7c38025c, https://sketchfab.com/3d-models/the-noble-craftsman-0e8ff87ffaa24731b2474badebca870d
- Lightweight prop benchmark: Quaternius/OpenGameArt Low Poly RPG Pack is useful for simple faceted RPG tools, gems, and gold props that read from far away. Source: https://opengameart.org/content/low-poly-rpg-pack

## Silhouette Goals

- First read at thumbnail size: brown-apron clay instructor, not smith, tanner, or jeweler.
- Make the apron a large uninterrupted front panel from chest to knees, with side ties and one darker lower hem. The apron should beat the shirt in both size and contrast.
- Keep the current tool roll, but enlarge and move it toward the visible front hip or apron midline. Add 3 to 4 blocky slots so it reads as a teaching kit, not a pouch.
- Put the clay lesson in the hands: one hand presents a soft-clay slab/lump, while the other points with a short chisel, awl, or ring sample.
- Add a small circular/ring shape on the clay slab or on a belt sample board. This is the unique tutorial cue: borrowed ring presses a useful shape into softened clay.
- Avoid a dominant hammer, pick, furnace tongs, metal ingot, gem tray, jewelry sparkle, or heavy leather-hide display. Those steal from Mining/Smithing, Elira Gemhand, Tanner Rusk, and the mainland Crafting Teacher.
- Use one readable diagonal: chisel across the tool roll, needle case across the apron pocket, or a sample board held at an angle. Do not scatter tiny tools everywhere.
- Head/face should stay approachable: no hood, no guildmaster cape, no severe master-crafter prestige. A short beard or tied hair is fine if it does not become the identity.

## Color And Material Notes

- Preserve the earthy tutorial-artisan palette, but increase value separation: darker apron over rust shirt, pale clay in hand, dull metal tool points, off-white thread accent.
- Suggested anchors: apron `#6f5845`, apron shadow `#4f3d31`, shirt `#8b4d3a`, leather roll `#5d3a24`, trousers `#3d3a35`, boots `#2a2018`, dull chisel metal `#b8a98b`, wet clay `#b28a6d`, clay shadow `#8b674f`, linen/thread `#d8c7a4`, tiny brass pin `#c8a85a`.
- Clay should be matte and warm, with one darker underside plane. Avoid glossy fired-pottery colors; this station teaches preparation before firing.
- Tool metal should be worn brass or muted steel on very small surfaces only. Broad shiny metal turns the model back toward smithing.
- The ring/mould cue can be dull brass, pale clay indentation, or a dark incised line. Do not use bright gemstone colors unless they are a single pinprick accent.
- Material style should remain flat shaded and primitive-friendly. Use shaped fragments and strong color blocks instead of texture noise, high-frequency stitches, or real-scale thread lines.

## Prop And Pose Ideas

- Priority props: `crafting_instructor_apron_front`, `crafting_instructor_tool_roll`, `crafting_instructor_soft_clay_slab`, and `crafting_instructor_ring_imprint`.
- Secondary props: `crafting_instructor_small_chisel`, `crafting_instructor_awl`, `crafting_instructor_needle_case`, `crafting_instructor_thread_spool`, `crafting_instructor_apron_tie_left/right`, and `crafting_instructor_bench_sample_pin`.
- Pose target: upright, slightly leaned toward the presented clay, shoulders open to the player, one lower arm forward with the slab, the other hand angled down as if explaining where the ring presses.
- The hand prop should be oversized and blocky. Real chisel/needle scale will vanish in the gallery; make tools 2-3x plausible size with clean silhouettes.
- Idle idea for later: tiny wrist tilt showing the clay, a small nod, then a quick tap of chisel to tool roll. Keep it teacherly, not salesy.
- Talk/trade idea for later: present the clay slab and ring imprint rather than opening a shopkeeper gesture. This NPC's service is instruction, not inventory supply.

## Gallery Scale And Framing Notes

- Keep standard humanoid height and Tutorial Island instructor scale. Identity should come from apron, clay, and props, not height.
- Best gallery angle: front three-quarter with the apron front, hand clay, chisel/tool roll, and ring-imprint face visible at once.
- Required thumbnail read order: apron, clay slab/lump, tool roll, ring/imprint circle, chisel/awl, tiny thread/needle detail.
- Keep all meaningful props on the front or near-side hip. Back pouches and far-side tools will disappear in the NPC gallery.
- The gallery should not zoom out for a long prop. Keep chisel/awl, tool roll, and sample board inside the normal humanoid silhouette envelope.
- Compare beside `tutorial_mining_smithing_instructor`, `tutorial_runecrafting_instructor`, `mainland_crafting_teacher`, `mainland_elira_gemhand`, and `tanner_rusk`. The Tutorial Crafting Instructor should be the simplest clay-and-tool teacher in that lineup.

## Concrete Integration Guidance

- Future implementation target: `src/js/content/npc-appearance-catalog.js`, specifically `buildTutorialCraftingInstructorPreset()`.
- Preserve stable identifiers: `tutorial_crafting_instructor`, label `Crafting Instructor`, archetype `clay_bench_artisan`, world `appearanceId`, spawn `npc:tutorial_crafting_instructor`, service `merchant:tutorial_crafting_instructor`, and dialogue `tutorial_crafting_instructor`.
- Lowest-risk pass: keep the current Mining/Smithing-derived base, but add 8-12 front-loaded craft fragments and reduce inherited smith/miner cues through colors and prop dominance.
- Better bespoke pass: move to a lighter guide/worker base with a large craft apron and tutorial-specific clay/ring props, while retaining humanoid scale and the catalog-backed preset path.
- Suggested fragment names: `crafting_instructor_apron_front`, `crafting_instructor_apron_shadow`, `crafting_instructor_apron_tie_left`, `crafting_instructor_apron_tie_right`, `crafting_instructor_tool_roll`, `crafting_instructor_tool_slot_*`, `crafting_instructor_small_chisel`, `crafting_instructor_soft_clay_slab`, `crafting_instructor_ring_imprint`, `crafting_instructor_thread_spool`, `crafting_instructor_needle_case`, `crafting_instructor_awl`, and `crafting_instructor_brass_pin`.
- If retaining `clonePresetWithTheme()`, verify that the theme keys hit inherited roles and explicitly color every new `crafting_instructor_*` fragment. Do not rely on broad role replacement for new props.
- Keep central integration catalog-driven; do not add generated OBJ/PNG assets, item icon sources, dialogue changes, merchant stock, tutorial step logic, world placement, or runtime animation code as part of this model brief.
- Likely failure modes to guard against: smith recolor, generic brown vendor, duplicate mainland Crafting Teacher, jeweler sparkle, invisible chisel/needle, clay that reads like ore, and prop clutter that hides the tutorial action.
- Suggested checks for later model work: `node .\tools\tests\npc-model-gallery-runtime-guard.js`, `npm.cmd run test:player-npc-humanoid:guard`, and manual `/qa npcgallery` inspection focused on thumbnail read and sibling-instructor differentiation. This markdown-only brief itself requires no runtime test.
