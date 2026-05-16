# Tutorial Woodcutting Instructor (`tutorial_woodcutting_instructor`)

Owned model: Tutorial Woodcutting Instructor (`tutorial_woodcutting_instructor`)

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly NPC gallery model. This brief does not authorize runtime code edits.

## Current Read

- Existing preset: `buildTutorialWoodcuttingInstructorPreset()` in `src/js/content/npc-appearance-catalog.js` returns label `Woodcutting Instructor`, archetype `old_woodsman`, standard humanoid scale, and a fully bespoke fragment set.
- Current visual base: older bearded woodsman, red-brown plaid shirt, moss vest, dark trousers, work boots, gloves, belt, brass buckle, and a small diagonal belt axe. The character already reads "woodworker" before it reads "teacher."
- Current placement: `content/world/regions/tutorial_island.json` places `appearanceId: "tutorial_woodcutting_instructor"` at the tutorial grove as `serviceId: "merchant:tutorial_woodcutting_instructor"`, `spawnId: "npc:tutorial_woodcutting_instructor"`, `action: "Talk-to"`, and `dialogueId: "tutorial_woodcutting_instructor"`.
- Current tutorial behavior: `core-tutorial-runtime.js` ensures the player has a `bronze_axe` at step 1, explains keeping the axe in inventory, cutting a normal tree, receiving logs, seeing temporary stumps, and then redirects the player to the Fishing Instructor by the pond.
- Current spec expectation: `docs/TUTORIAL_ISLAND_SPEC.md` says the Survival Crescent should group woodcutting, fishing, firemaking, and cooking, and specifically calls for the Woodcutting Instructor to read through axe and wood props.
- Gallery entry already exists in `window.NpcAppearanceCatalog.previewActors` as `{ actorId: 'tutorial_woodcutting_instructor', label: 'Woodcutting Instructor' }`.
- Reuse pressure: `mainland_advanced_woodsman` currently clones this preset and upgrades it with northern-merchant identity. The tutorial model must remain simpler, friendlier, and first-lesson focused so the advanced model can stay heavier and more experienced.
- Main risk: the current model is a good old woodsman base, but the tutorial beat is still under-specified. At thumbnail size it needs to say "this person teaches your first normal-tree chop" through a clearer bronze/starter axe, a single normal-log cue, and a teacher gesture.

## Tutorial And Gameplay Role

- This is the first non-guide skill instructor in the route: he turns the player's first tool into the first gathered resource. The model should make that tiny systems lesson feel concrete.
- His lesson is not advanced forestry, lumber commerce, or efficient XP routing. It is: carry axe, click normal tree, get logs, understand stump/regrowth, bring proof back.
- He sits between the Tutorial Guide and Fishing Instructor. Visually he should feel more outdoors and hands-on than the guide, but less kitted-out than any mainland forester, merchant, or woodcutting master.
- The logs he teaches are a bridge to later stations. A visible normal log or cut face should hint that wood becomes firemaking fuel soon, without stealing the Firemaking Instructor's tinderbox/fire identity.
- Personality target: patient, grounded, slightly weathered, and safety-minded. He has repeated this first lesson many times and still keeps the axe edge away from the new player's face.
- He should feel local to a beginner grove: normal trees, ordinary logs, bronze/iron tool language, patched workwear, and one simple badge. Avoid skillcape prestige, high-tier logs, Forestry event gear, or full merchant stock.

## Source Inspiration

- OSRS [Woodsman tutor](https://oldschool.runescape.wiki/w/Woodsman_tutor): Wilfred is a Lumbridge Woodcutting master who explains basic and advanced Woodcutting/Firemaking and can replace a bronze axe and tinderbox. Use him as the closest male tutor precedent, including the old-woodsman and recolored-lumberjack-top read, but do not copy his outfit exactly.
- OSRS [Tutorial Island](https://oldschool.runescape.wiki/w/Tutorial_Island): Brynna originally teaches the survival chain: small-net fishing, then bronze axe/tinderbox, tree chopping, logs, fire, and cooked shrimp. Our repo splits that chain into separate instructors, so this NPC owns only the woodcutting slice.
- OSRS [Woodcutting](https://oldschool.runescape.wiki/w/Woodcutting): the skill is about chopping trees for logs used by Firemaking, Fletching, and Construction; success depends on tree, level, and axe. Use this for the resource-loop read, not for cluttering the tutorial NPC with every later system.
- OSRS [Axe](https://oldschool.runescape.wiki/w/Axe): axes are both Woodcutting tools and melee weapons, with higher-tier axes improving log chances. For this tutor, push "safe working tool" over "combat axe": short handle, simple head, blunt utilitarian silhouette.
- OSRS [Tree](https://oldschool.runescape.wiki/w/Tree) and [Logs](https://oldschool.runescape.wiki/w/Logs): normal trees and level-1 logs are the beginner material; logs also become level-1 Firemaking fuel with a tinderbox. A single cut-face log is a stronger tutorial cue than a high-tier bundle.
- OSRS [Lumberjack outfit](https://oldschool.runescape.wiki/w/Lumberjack_outfit): canonical Woodcutting clothing vocabulary: practical top, legwear, boots, and work-set identity. Borrow the workwear logic, not a literal outfit copy.
- Medieval [Tacuinum sanitatis woodcutters](https://manuscriptminiatures.com/5708/20743): public-domain manuscript reference tagged with woodcutters, axe, mallet, meal, and bread. Useful for simple outdoor labor posture, hand tools, and non-heroic work clothing.
- [Tools of the Medieval Woodworker](https://medievalwoodworking.org/vld_tools.htm): broad axe over shoulder, smaller axe at belt, folding rule, tool pouch, T-shaped carpenter axe continuity. Use this for believable medieval tool placement and a clear belt/shoulder prop hierarchy.
- Kenney [Mini Characters](https://kenney.nl/assets/mini-characters): CC0 compact low-poly characters with animation support. Use as scale discipline: oversized hands, head, and one or two clean props beat tiny costume detail.
- Quaternius [Survival Pack](https://quaternius.com/packs/survival.html): CC0 low-poly survival props including readable outdoor utility gear. Use as a reminder to make logs and tools chunky, matte, and inspectable.
- Quaternius [Universal Base Characters](https://quaternius.com/packs/universalbasecharacters.html): CC0 humanoid base characters with animation-friendly topology. Use for rig/proportion discipline only; the repo's existing humanoid rig should remain the runtime base.
- Sketchfab [Low Poly Lumberjack](https://sketchfab.com/3d-models/low-poly-lumberjack-a93a29105fc44bf594f8100b7726bcec): 1.5k-triangle rigged lumberjack reference. Use as low-poly profession readability validation, not as a mesh, texture, or outfit source.

## Silhouette Goals

- First read at thumbnail size: approachable old woodsman teacher, red plaid/moss vest, obvious starter axe, one normal-log cue, and a small tree/leaf badge.
- Strengthen the inherited diagonal axe read. The current belt axe is useful, but a later pass should either enlarge it into a front-readable teaching axe or add a held/presented bronze axe so the tool survives gallery scale.
- Add one wood cue that is unmistakably a beginner log: short cylinder/block bundle, pale cut face, dark bark band, and maybe one flat growth-ring stripe. Keep it one or two logs, not a merchant load.
- Distinguish him from `mainland_advanced_woodsman`: no log sampler of willow/maple/yew, no forestry pack, no advanced metal accents, no merchant ledger. This tutor is starter-grove clarity.
- Distinguish him from `tutorial_firemaking_instructor`: woodcutting owns axe, tree, stump, and fresh log; firemaking owns tinderbox, soot, ember, and cooked-food follow-through.
- Keep body mass broad but friendly. Squared shoulders and boots are fine; heavy armor, huge beard mass, battleaxe posture, or aggressive forward lean will pull him toward combat/brute reads.
- A tiny normal-tree badge, leaf tab, stump chip, or sapling marker should be front-facing. Back-only tree references will disappear in the gallery.
- Avoid cape, hooded druid silhouette, horns, shield, bow, quiver, full backpack, giant two-handed felling axe, sawmill gear, high-tier axe colors, or stacked log basket.

## Color And Materials

- Preserve the existing family palette: red-brown shirt, dark plaid, tan plaid stripe, moss vest, brown leather belt/gloves, charcoal trousers, dark boots, grey-brown hair and beard.
- Suggested palette anchors: shirt `#7e2622`, plaid dark `#4f1816`, plaid tan `#b68b5e`, vest `#3e5034`, vest dark `#2c3c28`, belt `#583822`, glove `#6b4b2d`, trouser `#4b4338`, boot `#2d2218`, hair `#6b6253`, beard `#5b5346`.
- Axe should read as starter-safe: handle `#724a2b`, dull bronze/iron head `#8f8f86` or `#9aa1a5`, edge `#c6ccd0`, with optional bronze starter accent `#b18a38`. Do not use rune cyan, adamant green, or bright fantasy metal.
- Normal log cue: bark `#5a3824`, bark shadow `#3b2518`, cut face `#b9824d`, cut-face light `#d2a36c`, ring line `#7a5132`. Keep the end cap brighter than the bark so it reads from the front.
- Small tree/leaf cue: muted leaf `#6f8f45`, darker leaf `#435f2f`, maybe sap `#c68b38`. Use one green accent; the vest already carries a lot of moss color.
- Materials should be flat-shaded low-poly cloth, leather, matte wood, dull metal, and skin blocks. No realistic bark texture, cloth weave, transparent leaf planes, shiny PBR metal, particle wood chips, or glowing guidance effects.
- Let value separation do the work. Brown-on-brown props need a pale cut face, light axe edge, or tan binding to avoid disappearing against the belt and trousers.

## Prop And Pose Ideas

- Priority prop: `woodcutting_tutor_starter_axe`, either converted from the current belt axe or held lower-front in one hand. The axe head should face the camera enough to read, with handle length kept inside the shoulder/hip envelope.
- Priority wood cue: `woodcutting_tutor_first_log`, one short log at the hip or in the off hand with a front-facing cut cap. It should say "you will receive this," not "I sell firewood."
- Optional tree cue: `woodcutting_tutor_tree_badge` or `woodcutting_tutor_leaf_pin` on the vest, slightly larger than a normal decoration and shaped as a simple blocky leaf/tree crown.
- Optional stump cue: a tiny `woodcutting_tutor_stump_chip` clipped to the belt or boot-side lower body. Keep it attached to the NPC; do not add a freestanding stump that belongs to the world.
- Optional safety cue: leather forearm bracer or glove strap on the hand nearest the axe. This says teacher and worker without adding text or signage.
- Pose target: one forearm presents or rests near the axe, the other gestures toward the grove/log. Head and torso can lean subtly toward the player, not toward the tree like he is mid-swing.
- Idle target for later: touch axe handle, nod toward a nearby tree, glance at the log, return to neutral. Avoid chopping animations inside the gallery pose; world/player animation owns active chopping.
- Talk/check target for later: small approving nod, hand opens toward the log proof, then points down-path toward the pond.
- Do not add tinderbox, fire, cooked shrimp, fishing net, shop crate, full log basket, price tags, signboard, skillcape hood, huge two-handed axe, or animated wood chips.

## Gallery Scale And Framing

- Keep standard tutorial humanoid height, floor contact, and rig proportions. Identity should come from the axe/log/teacher pose, not from scaling him larger than adjacent instructors.
- Best gallery angle: front three-quarter from the axe/log side, with face, beard, plaid chest, vest badge, axe head, and log cut face all visible.
- Required thumbnail read order: old woodsman face/beard, red plaid and moss vest, starter axe, pale log end cap, small tree/leaf badge.
- Keep all props close to the body. A wide axe shaft or side log that expands the bounds will force the camera to zoom out and weaken the face.
- Compare directly beside `tutorial_fishing_instructor`, `tutorial_firemaking_instructor`, `tutorial_mining_smithing_instructor`, and `mainland_advanced_woodsman`. The Woodcutting Instructor should be the simplest outdoor starter mentor, not the most equipped worker in the lineup.
- Avoid pure front view if the axe overlaps the torso into a grey stripe. Avoid pure side view if the badge, beard, and log cut face vanish.
- Dialogue portrait crop should still catch the axe or log if possible. If both props live only at the belt line, the portrait may reduce him to plaid old man.

## Concrete Implementation Guidance

- Later implementation target: `src/js/content/npc-appearance-catalog.js`, inside `buildTutorialWoodcuttingInstructorPreset()`, unless the central NPC gallery/model rework introduces a dedicated authored model layer first.
- Preserve identifiers and wiring: `tutorial_woodcutting_instructor`, label `Woodcutting Instructor`, archetype `old_woodsman`, `appearanceId`, `serviceId: "merchant:tutorial_woodcutting_instructor"`, `spawnId: "npc:tutorial_woodcutting_instructor"`, `dialogueId: "tutorial_woodcutting_instructor"`, tutorial step behavior, and NPC gallery preview actor entry.
- Preserve placement assumptions: tutorial grove, stationary talk target, first resource lesson before pond/fishing, bronze-axe check, normal-tree/log proof, and redirect to Fishing Instructor.
- Lowest-risk pass: keep the current humanoid construction, plaid shirt, moss vest, beard, gloves, trousers, boots, belt, and broad old-woodsman read. Add or replace 6-10 tutorial-specific front fragments that clarify axe plus normal log.
- Suggested fragments: `woodcutting_tutor_axe_handle`, `woodcutting_tutor_axe_head`, `woodcutting_tutor_axe_edge`, `woodcutting_tutor_first_log_bark`, `woodcutting_tutor_first_log_cut_face`, `woodcutting_tutor_log_ring`, `woodcutting_tutor_tree_badge`, `woodcutting_tutor_leaf_pin`, `woodcutting_tutor_safety_bracer`, `woodcutting_tutor_stump_chip`.
- If the current `belt_axe_*` fragments remain, either enlarge and re-angle them for readability or keep them small and add a separate held teaching axe. Do not leave two equally prominent axes that make him look overarmed.
- Attach important additions to `torso`, `leftLowerArm`, or `rightLowerArm` where gallery and dialogue crops can see them. Use lower-leg/boot attachments only for optional stump-chip detail.
- Use explicit `rgbColor` values for new fragments. Broad retheme keys like `plaidTan` will not reliably hit snake_case role names unless the integration pass intentionally maps them.
- Keep the model beginner-tier. No willow/maple/yew sample colors, no Forestry kit/log basket, no Woodcutting cape, and no rune/adamant metal accents unless a later central brief explicitly revises tutorial progression.
- Do not edit woodcutting mechanics, tutorial progression, item grants, world placement, dialogue strings, merchant tables, generated assets, pixel sources, or `mainland_advanced_woodsman` as part of this model brief.
- Likely failure modes to guard against: generic lumberjack, Wilfred copy, advanced woodsman duplicate, combat axeman, firemaking duplicate with logs, invisible belt axe, brown-on-brown log clutter, modern flannel joke read, or prop sprawl that shrinks the NPC in gallery.
- Suggested checks for later runtime work: `node .\tools\tests\npc-model-gallery-runtime-guard.js`, then manual `/qa npcgallery` inspection focused on `tutorial_woodcutting_instructor` beside the other Survival Crescent instructors and `mainland_advanced_woodsman`. This brief itself requires no runtime test.
