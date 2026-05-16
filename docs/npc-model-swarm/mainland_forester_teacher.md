# Forester Teacher (`mainland_forester_teacher`)

Owned model: Forester Teacher (`mainland_forester_teacher`)

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly NPC gallery model. This brief does not authorize runtime code edits.

## Current Read

- Existing preset: `buildMainlandForesterTeacherPreset()` in `src/js/content/npc-appearance-catalog.js` calls `buildWorkerVariantPreset()`, which clones the Tutorial Woodcutting Instructor, relabels it as `Forester Teacher`, and sets archetype `starter_grove_forester`.
- Current visual base: red-brown plaid shirt, moss vest, gloves, trousers, boots, blocky older woodsman head, beard, and the inherited belt axe from the Tutorial Woodcutting Instructor.
- Current bespoke detail: only one bright green `forester_leaf_pin` on the torso, so the model currently reads as "slightly greener Woodcutting Instructor" rather than a mainland starter-grove teacher.
- Current placement: `content/world/regions/main_overworld.json` places `appearanceId: "mainland_forester_teacher"` on the `forester_teacher` merchant at `home:starter_grove`, tagged `merchant`, `woodcutting`, and `starter`.
- Gameplay read: this is the reachable starter Woodcutting mentor. The merchant buys and sells `bronze_axe`, `iron_axe`, `steel_axe`, `logs`, and `oak_logs`; dialogue teaches clean cuts, axes, trees, timing, and early grain progression.
- Main risk: the final model must separate from both `tutorial_woodcutting_instructor` and `mainland_advanced_woodsman`. It should feel like a patient first teacher in the starter grove, not an advanced timber buyer, combat woodsman, druid, or generic lumberjack.

## Profession And Gameplay Role

- This NPC is the first mainland woodcutting authority: approachable, practical, and low-pressure. He teaches how to stand, swing, read normal and oak trunks, and choose the right starter axe.
- The merchant table should drive the visual hierarchy. Bronze, iron, and steel axes plus normal/oak logs are the relevant props; willow/maple/yew sampling belongs more to `mainland_advanced_woodsman`.
- The teacher fantasy is "woodland instructor with a safe lesson kit": field satchel, leaf badge, training axe, log cross-section, small marking board, and maybe a sapling stake.
- His dialogue line, "A clean cut starts before the swing," suggests a demonstrator more than a merchant. Make hands and props show instruction, not just stockholding.
- Personality target: calm, observant, encouraging, slightly old-school. He should look like he has corrected hundreds of sloppy first swings without becoming stern or elite.
- World target: starter grove edge, near early trees and general player traffic. Keep him welcoming from a distance, with readable green and tan cues against woodland scenery.

## Source Inspiration

- OSRS [Woodcutting](https://oldschool.runescape.wiki/w/Woodcutting): gathering skill built around trees, logs, level bands, and better axes. Use this for the early progression ladder and normal-to-oak teaching read.
- OSRS [Axes](https://oldschool.runescape.wiki/w/Axes): axes are both a Woodcutting tool and rough weapon category. This model should make the axe read as a supervised trade tool, not a battle prop.
- OSRS [Woodsman tutor](https://oldschool.runescape.wiki/w/Woodsman_tutor): Wilfred is a Lumbridge Woodcutting master who can give new players basic supplies, and the page notes his recoloured lumberjack-top visual. Use as the strongest OSRS tutor precedent.
- OSRS [Lumberjack outfit](https://oldschool.runescape.wiki/w/Lumberjack_outfit): canonical woodcutting clothing vocabulary: hat/top/legs/boots, workwear proportions, and bonus-skill identity. Borrow the outfit language without copying exact pieces.
- OSRS [Forestry overview](https://oldschool.runescape.wiki/w/Update%3AForestry%3A_The_Way_of_the_Forester_-_Overview): Forestry frames Woodcutting as more social, kit-based, and field-event driven. Use the kit, group-learning, campfire, and practical-gear tone lightly.
- OSRS [Forestry basket](https://oldschool.runescape.wiki/w/Forestry_basket): combines Forestry kit, log basket, and sturdy harness. Useful as silhouette logic for a compact satchel or side carrier, but the starter teacher should not carry the full advanced backpack.
- Forest School Association [principles](https://forestschoolassociation.org/full-principles-and-criteria-for-good-practice/): woodland learning is recurring, observation-led, risk-aware, and guided by qualified practitioners. Translate that into a field notebook, safe tool handling, and calm mentor posture.
- Surrey Wildlife Trust [Outdoor Learning Training](https://www.surreywildlifetrust.org/what-we-do/schools-educators/outdoor-learning-training): outdoor learning uses curriculum-linked lessons, risk-benefit assessment, and care for the site. Use this for teacher props: lesson board, site-care satchel, and measured rather than heroic stance.
- Kenney [Mini Characters](https://kenney.nl/assets/mini-characters): compact CC0 low-poly 3D characters with animation support. Use as validation that large readable heads, hands, and props work better than tiny realism at gallery size.
- OpenGameArt [Low Poly RPG Pack](https://opengameart.org/content/low-poly-rpg-pack): CC0 low-poly medieval/RPG prop pack. Use as a discipline reference for simple chunky tools and low-detail readable props, not as a mesh source.
- Sketchfab [Low Poly Lumberjack](https://sketchfab.com/3d-models/low-poly-lumberjack-a93a29105fc44bf594f8100b7726bcec): rigged low-poly lumberjack reference with strong beard, axe, boot, and workwear readability. Useful for profession silhouette validation; do not copy mesh, texture, or outfit.

## Silhouette Goals

- First read at thumbnail size: friendly starter-grove forester teacher with moss vest, leaf badge, visible training axe, and a log/lesson prop.
- Keep the body standard humanoid size. Identity should come from clear front/side props, not from making him taller, wider, or boss-like.
- Add one teaching prop that breaks the inherited worker rectangle: a small vertical sapling stake, a diagonal lesson board, or a log cross-section held forward.
- The axe should remain basic and close to the body: belt-hung, hand-rested, or tucked at the hip. Avoid a raised chopping pose, long battleaxe, or two-handed felling-axe read.
- Use starter-log vocabulary. One normal log and one oak-colored end cap can show early progression; larger willow/maple/yew sampler bundles belong to the Advanced Woodsman.
- Make the leaf pin larger or more deliberate than the current tiny badge, but keep it as a teacher emblem, not glowing druid jewelry.
- Differentiate from `tutorial_woodcutting_instructor`: add teacher-specific field props and a lighter, more instructional posture instead of only recoloring the same old woodsman.
- Differentiate from `mainland_advanced_woodsman`: lighter pack, simpler axe metals, fewer high-tier log cues, less appraiser/merchant severity, no heavy timber-buyer kit.
- Avoid tall fantasy hoods, antlers, bark armor, magic vines, quivers, shields, and broad shoulder armor. Those pull the NPC toward druid, ranger, or combat roles.

## Color And Materials

- Preserve the starter woodland palette: red-brown shirt, moss vest, tan plaid, warm leather, charcoal trousers, dark boots, dull axe metal, and one green leaf accent.
- Suggested palette anchors: shirt `#79422d`, plaid dark `#4d241d`, plaid tan `#b9915e`, vest `#405d36`, vest shadow `#2f452a`, leather `#5a3925`, glove `#64472d`, trouser `#494239`, boot `#2b2118`, dull steel `#9aa1a5`, bronze starter accent `#a77a3d`, leaf `#7fb069`.
- Keep the leaf badge slightly desaturated compared with the current `#8fcf74` if it competes with the face. It should be the profession mark, not the whole character.
- Normal log props should be warm tan-brown with a darker bark band. Oak should be a slightly richer amber-brown. Two readable tones beat bark texture noise.
- Axe materials should support the merchant stock: bronze/iron/steel can appear as tiny tagged samples or dull metal edge notes, but do not turn the model into an equipment display rack.
- Materials should be flat, faceted, and block-built. No cloth texture, bark noise, PBR metal, glowing greens, or high-frequency plaid that flickers in the gallery.
- If the inherited `plaidTan` theme key remains in use, verify it actually affects role names. Current fragment roles are snake-case `plaid_*`; broad `plaid` or explicit fragment colors are safer.

## Prop And Pose Ideas

- Priority prop: `forester_teacher_lesson_log`, a short log cross-section held or strapped at front-left with a readable pale cut face and bark rim.
- Priority prop: `forester_teacher_field_board`, a small flat board/slate with two or three chunky tally cuts or leaf marks. It makes the NPC a teacher rather than another cutter.
- Keep or refine the inherited belt axe as `forester_teacher_training_axe`: short handle, dull metal head, optionally a bronze starter edge or colored safety wrap.
- Add a compact `forester_teacher_field_satchel` on the near hip: leather flap, small green tag, maybe one rolled note. This nods to Forestry kit logic without becoming an advanced basket.
- Optional front detail: `forester_teacher_leaf_pin` enlarged into a simple leaf/block badge on the vest, plus `forester_teacher_oak_leaf` or `forester_teacher_leaf_sample` tucked into the board.
- Optional ground-safe cue: a slim `forester_teacher_sapling_stake` or measuring stick near one side, no taller than shoulder height, angled slightly so it does not shrink the gallery fit.
- Pose target: relaxed upright stance, head angled toward the player or lesson prop, one forearm slightly forward presenting the log/board, the other near the axe handle.
- Idle target for later: small board tilt, thumb tap on the log face, nod, then settle. Trade/talk target can tap the axe or point to the log rings.
- Do not add full log baskets, yew bundles, big packs, dramatic overhead swing poses, or visible high-tier rune/adamant axe glamour.

## Gallery Scale And Framing

- Keep normal NPC floor contact, head height, and bounds. The gallery should not scale him down because of a tall staff, wide axe, or hidden back basket.
- Best gallery angle: front three-quarter with face, vest, leaf pin, axe head, lesson board/log face, and side satchel all visible.
- Put important details on the front or near hip. Back-only Forestry kit props will vanish in the gallery and leave him reading as the Tutorial Woodcutting Instructor again.
- The lesson board and log cross-section should be oversized enough to read at small card size. Realistic hand-scale props will disappear.
- Required thumbnail read order: green vest, friendly bearded teacher face, leaf pin, starter axe, log/lesson board, leather satchel.
- Compare beside `tutorial_woodcutting_instructor`, `mainland_advanced_woodsman`, `mainland_fletching_supplier`, and `mainland_fishing_teacher`. Forester Teacher should be the clearest starter skilling mentor in the woodcutting lane.

## Concrete Integration Guidance

- Later implementation target: `src/js/content/npc-appearance-catalog.js`, inside `buildMainlandForesterTeacherPreset()`, unless the central NPC gallery/model rework introduces a dedicated authored model layer first.
- Preserve authored identifiers: `mainland_forester_teacher`, label `Forester Teacher`, archetype `starter_grove_forester`, world `appearanceId`, merchant ID `forester_teacher`, dialogue ID `forester_teacher`, and NPC gallery preview actor entry.
- Lowest-risk pass: keep the existing worker/woodcutting rig, preserve the inherited belt axe, fix/verify theme key coverage, and add 7-10 `forester_teacher_*` fragments that are front-readable.
- Better bespoke pass: still use the same humanoid construction scale, but lighten the old-woodsman clone with clearer teacher props, a less advanced pack, and a more open presenting pose.
- Suggested fragments: `forester_teacher_leaf_pin`, `forester_teacher_lesson_log`, `forester_teacher_log_cut_face`, `forester_teacher_oak_end_cap`, `forester_teacher_field_board`, `forester_teacher_board_marks`, `forester_teacher_training_axe_wrap`, `forester_teacher_field_satchel`, `forester_teacher_satchel_leaf_tag`, `forester_teacher_sapling_stake`.
- Keep additions inspectable and sparse. If the fragment budget gets tight, choose leaf pin, lesson log, field board, training axe, and satchel before extra leaves or tool tags.
- Do not edit combat, quest logic, merchant economy, dialogue text, world placement, generated assets, item icon sources, or skill specs as part of this visual integration.
- Likely failure modes to guard against: tutorial clone, advanced woodsman duplicate, generic lumberjack, fantasy druid, ranger/archer, combat axe fighter, unreadable brown-on-brown props, invisible teaching details, and overlarge back kit that shrinks the gallery model.
- Suggested checks for later runtime work: `node .\tools\tests\npc-model-gallery-runtime-guard.js`, followed by manual `/qa npcgallery` inspection. This brief itself requires no runtime test.
