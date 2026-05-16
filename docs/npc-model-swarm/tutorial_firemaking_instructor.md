# Tutorial Firemaking Instructor (`tutorial_firemaking_instructor`)

Owned model: Tutorial Firemaking Instructor (`tutorial_firemaking_instructor`)

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly NPC gallery model. This brief does not authorize runtime code edits.

## Current Read

- Existing preset: `buildTutorialFiremakingInstructorPreset()` in `src/js/content/npc-appearance-catalog.js` is already a bespoke `Firemaking Instructor` with archetype `sooty_fire_worker`.
- Current visual base: warm rust shirt, dark apron, soot cheek marks, ash splatters, ember patch, gloves, trousers, boots, moustache/beard, a belt tinderbox case, and a small bound log bundle.
- Current placement: `content/world/regions/tutorial_island.json` places `appearanceId: "tutorial_firemaking_instructor"` at the fire clearing as `serviceId: "merchant:tutorial_firemaking_instructor"`, `spawnId: "npc:tutorial_firemaking_instructor"`, `action: "Talk-to"`, and `dialogueId: "tutorial_firemaking_instructor"`, tagged `tutorial`, `firemaking`, and `cooking`.
- Current tutorial text: the instructor replaces lost `tinderbox` and `logs`, tells the player to use tinderbox with logs near the clearing, then use raw shrimp on the fire. Cooked or burnt shrimp completes the survival loop.
- Current spec expectation: `docs/TUTORIAL_ISLAND_SPEC.md` says the Survival Crescent should group woodcutting, fishing, firemaking, and cooking, and calls for the Firemaking Instructor to read through tinderbox, fire, and cooking props.
- Gallery entry already exists in `window.NpcAppearanceCatalog.previewActors` as `{ actorId: 'tutorial_firemaking_instructor', label: 'Firemaking Instructor' }`.
- Integration wrinkle: `buildTutorialMiningSmithingInstructorPreset()` currently starts from this preset, filters out tinderbox/log/ember pieces, then rethemes it. Future firemaking-only fragments need clear role names or a cleaner base split so they do not leak into the mining/smithing instructor.
- Main risk: the model already reads as a sooty apron worker, but not yet as a patient first-fire teacher. The bespoke pass should make the ignition lesson and cooking follow-through visible without turning him into a pyromancer, blacksmith, chef, or generic camp laborer.

## Tutorial And Gameplay Role

- This NPC closes the first survival loop: cut logs, catch food, spend logs to make a temporary fire, then process the food. He teaches resource conversion, not just "make orange thing."
- The moment he owns is small and foundational: a tinderbox plus ordinary logs becomes a fire tile, and that fire becomes a cooking station. The model should show tool, fuel, and food in one compact read.
- He should feel like the field-safety instructor for the clearing: practical, calm, slightly singed, and used to correcting the same first mistake without making the player feel foolish.
- He is more hands-on than the Tutorial Guide, more survival-focused than the Master Chef idea, less advanced than Ignatius Vulcan, and less trade-like than a general store merchant who happens to stock tinderboxes.
- Personality target: warm, smoky, useful. He has the look of someone who can light a damp log, but his job here is to explain exactly where to stand and what to click.
- Keep the cooking cue subordinate but present. The lesson is not full cuisine; it is "now your fire has a purpose." One shrimp skewer, charred food token, or small cooking fork is enough.
- Avoid making him a heroic fire mage, circus flame performer, forge boss, ragged hermit, wild survivalist, or modern scout leader. Tutorial Island needs friendly clarity over drama.

## Source Inspiration

- OSRS [Tutorial Island](https://oldschool.runescape.wiki/w/Tutorial_Island): Brynna the Survival Expert teaches Fishing, Woodcutting, Firemaking, and Cooking, gives a bronze axe and tinderbox, and walks the player from logs to fire to cooked shrimps. Use this as the core role structure for a first-fire survival instructor.
- OSRS [Tinderbox](https://oldschool.runescape.wiki/w/Tinderbox): the tinderbox is the iconic low-level firemaking tool, used with logs to light fires and also associated with candles and lanterns. Use the compact box silhouette as the primary prop, not a torch or match.
- OSRS [Logs](https://oldschool.runescape.wiki/w/Logs): normal logs are the level-1 Firemaking fuel and grant the first basic fire. Use a plain log sample or short bundle rather than high-tier maple/yew color drama.
- OSRS [Firemaking](https://oldschool.runescape.wiki/w/Firemaking): the skill fantasy is transforming logs into temporary fires with tool, level, and location constraints. Use this for stance and "clear tile" teaching cues.
- OSRS [Woodsman tutor](https://oldschool.runescape.wiki/w/Woodsman_tutor): Wilfred can teach basic and advanced Woodcutting/Firemaking and give a bronze axe and tinderbox. Use him as the closest OSRS tutor precedent for practical firemaking instruction, but do not copy the lumberjack silhouette.
- OSRS [Ignatius Vulcan](https://oldschool.runescape.wiki/w/Ignatius_Vulcan): the master firemaker sells the Firemaking cape and wanders while making fires. Borrow only a tiny "master of flame" confidence cue; this tutorial NPC should be grounded and safer.
- Science Museum [Ways of Catching a Spark](https://www.sciencemuseum.org.uk/objects-and-stories/ways-catching-spark-history-fire-making-methods): historical fire-making revolves around tinder, flint, steel, and small spark-catching kits. Use this for an open tinderbox, flint/striker, char cloth, and dry-kindling vocabulary.
- Old and Interesting [Tinderboxes](https://www.oldandinteresting.com/tinderbox.aspx): useful historical reference for divided boxes holding steel, flint, matches, and tinder. Translate compartments into two or three chunky colored blocks; avoid tiny literal contents.
- Larsdatter [Roasting Spits](https://www.larsdatter.com/spits.htm): medieval and Renaissance cooking-over-fire references show spits, hearth work, and active fire management. Use the working-cook posture and small skewer/cooking fork language, not a full kitchen rig.
- Wikimedia Commons [A Peasant Family Cooking over a Campfire](https://commons.wikimedia.org/wiki/File:Bartolomeo_Pinelli,_A_Peasant_Family_Cooking_over_a_Campfire,_NGA_143874.jpg): outdoor campfire cooking gives the right practical, low-status, field-use tone. Borrow crouched attention and utility, not the exact costumes.
- Quaternius [Survival Pack](https://quaternius.com/packs/survival.html): CC0 low-poly survival props show how logs, bonfires, backpacks, matchboxes, torches, and pots read when simplified. Use as a readability discipline for blocky props.
- Kenney [Mini Characters](https://kenney.nl/assets/mini-characters): CC0 low-poly characters demonstrate oversized head/hands and clear accessory silhouettes. Use this as a gallery-scale constraint: one or two big props beat many small details.
- Quaternius [Universal Base Characters](https://quaternius.com/packs/universalbasecharacters.html): CC0 low-poly humanoids are a good reminder to keep proportions animation-friendly and material splits clean.

## Silhouette Goals

- First read at thumbnail size: sooty apron instructor, visible tinderbox, small log/kindling bundle, ember mark, and one teaching hand indicating where fire should be made.
- Preserve the current apron-worker read, but make it more instructional. The existing soot and apron say "works near flame"; the upgrade needs to say "shows you how to start one."
- Make the tinderbox the hero prop. It should be larger and more front-readable than the current belt case: either open in one palm, held forward at the chest, or clipped high on the belt with a lid/striker visible.
- Add a second fuel cue that is not just a brown lump. A short log cross-section, split kindling triangle, or tied starter bundle should clearly connect to `logs`.
- Add one cooking follow-through cue: tiny shrimp skewer, charred shrimp token, small cooking fork, or smoked pan hook. Keep it small enough that he does not become the cooking instructor.
- Use asymmetry to separate him from `tutorial_mining_smithing_instructor`: one arm presenting the tinderbox and the other pointing to the ground or holding a striker. Avoid a square blacksmith/apron stance.
- Keep flame geometry minimal and attached. A tiny ember chip, warm glow block, or red-orange badge works; a full carried campfire, particle flame, torch, or brazier will steal the world object's job.
- Avoid fire cape, hood, staff, lantern-only read, giant torch, blacksmith hammer, forge tongs, chef hat, cooking pot as primary prop, wild beard silhouette, or fantasy flame aura.
- The silhouette should stay compact. Wide skewers, detached campfire bases, smoke plumes, and tall signboards will shrink the model in the gallery and cause clipping in dialogue portrait framing.

## Color And Materials

- Preserve the current family palette: rust shirt, charcoal apron, dark brown belt, soot black, ash gray, ember orange, dull brass trim, brown logs, muted tinderbox metal, dark boots, and work gloves.
- Suggested palette anchors: shirt `#a84b26`, shirt shadow `#6f2f1d`, apron `#4a3a2b`, apron shadow `#2f2822`, soot `#1d1d1b`, ash `#8a8477`, ember `#d9792f`, ember light `#f2a13a`, belt `#563621`, glove `#3c2c20`, tinderbox `#7a6f5a`, tinderbox dark `#3d3830`, log `#7b4c29`, log dark `#4c3020`, cut wood `#b7814c`, shrimp raw `#d48a72`, shrimp burnt `#2a2520`.
- Keep the palette low-fantasy and smoky, but do not let the model collapse into all brown/orange. The ash marks, tinderbox metal, and cut-wood face need enough value separation to read.
- Fire/ember color should be the brightest accent and used sparingly. One or two orange chips are more OSRS-like than glowing gradients.
- The tinderbox should be muted pewter/green-gray, not bright silver or modern red matchbox. Its lid line must be clear from the gallery angle.
- Logs should show a cut face or bark band rather than noisy bark texture. Two cylinders/boxes with a binding strip can read better than several thin sticks.
- Soot should be graphic and chunky: cheek smudge, sleeve band, apron smear. Avoid speckled dirt that will shimmer or vanish at small scale.
- Materials should remain flat-shaded and faceted. No particle smoke, transparent flame planes, procedural bark, PBR metal, cloth weave, or tiny printed labels.

## Prop And Pose Ideas

- Upgrade the current `belt_tinderbox_case` into `firemaking_tutor_open_tinderbox`: a chunky box with dark lid, pale tinder strip, and one warm ember/spark square inside.
- Add `firemaking_tutor_flint` and `firemaking_tutor_striker`: two small high-contrast blocks near the hands or clipped to the tinderbox. They make the tool read as a fire-starting kit rather than a generic pouch.
- Replace or supplement the current belt logs with `firemaking_tutor_kindling_bundle`: two short logs plus one split wedge, tied with brass/tan binding and angled forward.
- Add `firemaking_tutor_cut_log_face`: a pale end cap on one log so the fuel reads from the front instead of as dark belt clutter.
- Add `firemaking_tutor_ground_point` as a pose concept, not necessarily a prop: right hand angled down toward the tile where the player should light the fire.
- Add `firemaking_tutor_cooking_skewer` or `firemaking_tutor_shrimp_token`: a tiny coral or charred shrimp on a short stick, tucked at the belt or held low. It should explain why the fire matters without competing with the tinderbox.
- Add `firemaking_tutor_ember_badge` or refine the existing `ember_patch`: one controlled warm mark on the apron, maybe shaped like a small flame diamond. Keep it emblematic, not magical.
- Optional head detail: slightly singed hair edge, ash eyebrow, or simple cloth headband. Choose one only if the face still reads friendly.
- Pose target: left forearm cradles or presents the open tinderbox at chest height, right hand holds striker/flint or points to the fire tile, torso slightly leaned toward the player, head tilted down as if checking their first attempt.
- Idle target for later: open box tilt, striker hand taps once, tiny nod, then point toward the ground. Avoid continuous flame waving, frantic alarm gestures, or chef-like stirring.

## Gallery Scale And Framing

- Keep standard tutorial humanoid scale and floor contact. He should line up with `tutorial_woodcutting_instructor`, `tutorial_fishing_instructor`, `tutorial_mining_smithing_instructor`, and the Tutorial Guide.
- Best gallery angle: front three-quarter from the tinderbox side, with face, apron, open box, log bundle, ember mark, and pointing/striker hand visible.
- Required thumbnail read order: soot/apron worker, open tinderbox, log/kindling bundle, ember accent, ground-pointing teacher pose, tiny cooking cue.
- Compare directly beside `tutorial_mining_smithing_instructor`; because that preset inherits from Firemaking today, the final models must not share the same apron-worker silhouette plus swapped props.
- Compare beside `tutorial_woodcutting_instructor` and `tutorial_fishing_instructor`; this NPC should clearly complete their material chain rather than look like a separate blacksmith or cook station.
- Do not include a freestanding campfire, fire pit, range, chopping stump, cooking table, signboard, or large smoke plume as part of the NPC model. World props and temporary fire tiles own that context.
- Put important detail on the front and near hip. Back-only skewers, rear pouches, and tiny side boxes will leave the model reading as a plain soot worker in the gallery card.
- Keep all prop spans close to the body. A long skewer or diagonal torch will either clip or force the camera to zoom out, weakening face and tinderbox readability.

## Concrete Integration Guidance

- Later implementation target: `src/js/content/npc-appearance-catalog.js`, inside `buildTutorialFiremakingInstructorPreset()`, unless the central NPC gallery/model rework introduces a dedicated authored model layer first.
- Preserve authored identifiers and wiring: `tutorial_firemaking_instructor`, label `Firemaking Instructor`, archetype `sooty_fire_worker`, `appearanceId`, `spawnId: "npc:tutorial_firemaking_instructor"`, `dialogueId: "tutorial_firemaking_instructor"`, tutorial stage behavior, and gallery preview actor entry.
- Lowest-risk pass: keep the current humanoid construction, apron palette, soot face, ash splatter, and compact belt-prop approach, then enlarge and clarify the tinderbox/fuel/cooking teaching props.
- Better central pass: split the shared apron-worker base from firemaking-specific props before adding new details, because `buildTutorialMiningSmithingInstructorPreset()` currently derives from this preset and filters only `tinderbox`, `log_bundle`, and `ember_patch` roles.
- If the current inheritance remains, name all new firemaking-only fragments with explicit roles such as `firemaking_tutor_*`, and update any future mining/smithing filter during runtime integration so those fragments do not survive the clone.
- Suggested fragments: `firemaking_tutor_open_tinderbox`, `firemaking_tutor_tinder_strip`, `firemaking_tutor_tinderbox_lid`, `firemaking_tutor_flint`, `firemaking_tutor_striker`, `firemaking_tutor_kindling_bundle`, `firemaking_tutor_cut_log_face`, `firemaking_tutor_log_binding`, `firemaking_tutor_ember_badge`, `firemaking_tutor_cooking_skewer`, `firemaking_tutor_shrimp_token`, `firemaking_tutor_ash_smear`.
- Favor fragments attached to `torso`, `leftLowerArm`, `rightLowerArm`, and optionally `head`. Avoid detached fire/camp/cooking objects in the NPC preset.
- Keep explicit `rgbColor` values for all new firemaking fragments. Do not rely on broad recolor rules unless the central system has a tested theme map for these exact role names.
- Keep pose changes local to the existing humanoid rig defaults. A subtle arm-presenting pose is enough; do not introduce custom animation dependencies for the brief's first implementation pass.
- Make the tinderbox readable in both NPC gallery and dialogue portrait framing. If it is too low on the belt, it will disappear behind the dialogue crop; chest or forearm presentation is safer.
- Do not edit firemaking mechanics, item catalogs, tutorial progression, dialogue strings, world placement, generated model assets, pixel sources, or mining/smithing visuals as part of the later firemaking visual pass unless that future task explicitly owns those files.
- Likely failure modes to guard against: generic sooty worker, blacksmith duplicate, chef duplicate, woodcutting clone with a tinderbox, pyromancer, torch bearer, fire-cape master, unreadable brown belt clutter, overlarge campfire prop, or new firemaking fragments leaking into the mining/smithing instructor.
- Suggested checks for later runtime work: `node .\tools\tests\npc-model-gallery-runtime-guard.js`, then manual `/qa npcgallery` inspection focused on `tutorial_firemaking_instructor` and `tutorial_mining_smithing_instructor`. This brief itself requires no runtime test.
