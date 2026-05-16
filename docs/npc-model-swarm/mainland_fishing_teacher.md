# Fishing Teacher (`mainland_fishing_teacher`)

Owned model: Fishing Teacher (`mainland_fishing_teacher`)

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly NPC gallery model. This brief does not authorize runtime code edits.

## Current Read

- Existing preset: `buildMainlandFishingTeacherPreset()` in `src/js/content/npc-appearance-catalog.js` calls `buildFisherVariantPreset()`, cloning `buildTutorialFishingInstructorPreset()`, relabeling it as `Fishing Teacher`, setting archetype `riverbank_fishing_teacher`, retheming shirt/vest/hat, and adding one small right-hand `teaching_float`.
- Inherited visual base: broad brim hat, beard, tan shirt, green vest, teal waders, boots, gloves, belt, line spool, cork/red float, and a small landing net on the torso. This already reads as a fisher, but still mostly as the tutorial instructor.
- Current placement: `content/world/regions/main_overworld.json` places `appearanceId: "mainland_fishing_teacher"` at `merchant:fishing_teacher`, tagged `merchant`, `fishing`, `starter`, and `home:fishing_teacher_shack`.
- Gameplay role: `content/skills/fishing.json` has the teacher buying starter fishing tools and selling `small_net`, `fishing_rod`, and `bait`; `rune_harpoon` appears only after `fishing_teacher_from_net_to_harpoon`.
- Quest read: `src/js/content/quest-catalog.js` frames the teacher as a progression verifier who asks for a full sampler, from raw shrimp through raw swordfish, before trusting the player with a rune harpoon.
- Main risk: the model will pass as "generic fishing NPC" but not "mainland teacher and progression gate" unless the prop language shows the tool ladder: net, rod, bait/float, fish sampler, and restrained harpoon authority.

## Profession And Gameplay Role

- This NPC is the calm starter-town fishing mentor: not just a bait seller, not a guild master, and not a trawler captain.
- The model should teach a sequence at a glance: small net first, rod and bait next, then harpoon knowledge after the player proves every fishing band.
- The live merchant stock makes starter tools the front read. The rune harpoon is important, but should feel earned and secondary: a badge, wrapped tip, or sealed rack cue, not a huge weapon pose.
- The quest sampler is the unique mainland hook. Five tiny catch tokens, a stringer, or a flat teaching board can make this teacher distinct from the `mainland_fishing_supplier`.
- Personality target: patient, weathered, slightly amused. The pose should feel like he is showing the player when to pull the line, not hawking inventory or threatening something with a spear.
- Keep him grounded at the shack/pond edge. Waders, wet boots, net frame, cork float, and a practical rod case sell the place better than naval coat, pirate hat, or market-stall crates.

## Source Inspiration

- OSRS [Fishing](https://oldschool.runescape.wiki/w/Fishing): Fishing is a gathering skill built around selected spots, tool progression, raw fish, and Cooking follow-through. Use this for the overall loop: catch, cook, improve tool, move to harder water.
- OSRS [Fishing tutor transcript](https://oldschool.runescape.wiki/w/Transcript:Fishing_tutor): the tutor teaches small-net basics, moving fishing spots, rods/bait, lobster pots, and harpoons. Borrow the "plainspoken tool ladder" tone, not the exact dialogue.
- OSRS [Lumbridge Swamp](https://oldschool.runescape.wiki/w/Lumbridge_Swamp): novice net/bait fishing spots, the Fishing tutor, and nearby small-net spawns are the strongest starter-teacher precedent.
- OSRS [Fishing spots](https://oldschool.runescape.wiki/w/Fishing_spot): fishing spots behave like moving NPC-like targets and communicate method through actions. A small water-marker card or fish-icon plaque can nod to this without becoming UI art.
- OSRS [Small fishing net](https://oldschool.runescape.wiki/w/Small_fishing_net): the beginner tool should be chunky and readable, with a frame and cross mesh rather than fine strands.
- OSRS [Fishing rod](https://oldschool.runescape.wiki/w/Fishing_rod): rods use bait and catch early fish such as sardine/herring. For the model, a short oversized rod section or rod case is more gallery-safe than a real-scale pole.
- OSRS [Harpoon](https://oldschool.runescape.wiki/w/Harpoon): harpoons first enter at tuna/swordfish progression and later larger fish. Treat this as the teacher's advanced-trust symbol, not the primary starter silhouette.
- OSRS [Angler's outfit](https://oldschool.runescape.wiki/w/Angler%27s_outfit): useful canonical fishing-clothing vocabulary: brimmed hat, practical top, and wader-like lower mass. Keep it muted and workaday, not a copied outfit set.
- Medieval fishing art: the 14th-century [Tacuina sanitatis fishing image](https://commons.wikimedia.org/wiki/File:36-pesca,Taccuino_Sanitatis,_Casanatense_4182..jpg) supports simple medieval dress, hand nets, and shore/boat labor shapes.
- Historical angling text: [A Treatyse of Fysshynge wyth an Angle](https://www.gutenberg.org/ebooks/57943) is useful for rod, line, hook, bait, patience, and angling-as-discipline cues.
- Medieval practice survey: [Sustainable and Innovative: The Medieval Art of Fishing](https://www.medievalists.net/2020/11/medieval-fishing/) separates rods, nets, traps, harpoons, shore fishing, boat fishing, and species-specific technique. Use that diversity to make the teacher a tool-method explainer.
- Low-poly discipline references: Kenney [Mini Characters](https://kenney.nl/assets/mini-characters) validates compact readable people with animation-friendly proportions; Quaternius [Low Poly RPG Pack](https://opengameart.org/content/low-poly-rpg-pack) validates simple faceted RPG props; Sketchfab [Village Character - Fisherman](https://sketchfab.com/3d-models/village-character-fisherman-c79ae4f48c5643c9a1688e93a350fd69) is useful only for basket/medieval-fisher readability. Do not copy meshes, textures, or exact outfit layouts.

## Silhouette Goals

- First read at thumbnail size: brimmed riverbank teacher with waders, visible float, visible net, and a rod/line cue.
- Make the teacher more instructional than the supplier: front-facing demonstration props beat side bags, bait tins, stock crates, or folded spare nets.
- Keep the hat and waders because they are already strong, but add a distinctive teaching layer: sampler string, water-method board, or oversized cork float held out from the body.
- Use one clean vertical or diagonal rod cue. A short rod case across the back or a rod section angled behind the shoulder is enough; a full long pole will break gallery framing.
- Net silhouette should be compact and iconic: oval or rectangular frame, two or three thick mesh bars, attached near the off-hand or hip. Avoid lace-like mesh.
- The five-fish sampler should be symbolic, not literal realistic fish. Use small colored lozenges/tokens: shrimp pink, trout blue-grey, salmon muted rose, tuna deep blue, swordfish silver-blue.
- Add one advanced-trust accent: wrapped `rune_harpoon_tip`, small teal metal badge, or sealed harpoon token at belt/back. It should be visible but not read as a combat spear.
- Avoid pirate coat, huge trawler gear, fishmonger apron, heavy weapon stance, captain hat, glowing runic weapon, or too many dangling fish that make him smell like a market vendor.

## Color And Materials

- Preserve the current fisher family: shirt `#8b6743`, vest `#406350`, hat `#7a6b45`, wader `#304d4c`, belt `#573823`, glove `#61482f`, boot `#2a211a`.
- Keep waders the largest lower-body mass and the vest the largest upper-body identity block. The palette should read damp green-brown, not blue naval uniform.
- Teaching float: use a warm red such as `#b44b3c` with cork `#b4773f` and line `#ded2a6`. These high-contrast small shapes are the strongest "lesson in hand" read.
- Net: frame `#76583a`, cord `#cbbf97`, with mesh bars oversized and limited. Do not use alpha, hairline cords, or dense texture.
- Rod: dark reed/wood `#5a3a25` with a pale line loop. If a reel exists, make it a chunky cork/bronze disk, not modern shiny metal.
- Fish sampler tokens: matte, simplified, and no glossy scales. Suggested anchors: shrimp `#c9897f`, trout `#6f8790`, salmon `#b66f67`, tuna `#2f4f65`, swordfish `#9eb0b8`.
- Rune-harpoon cue: one restrained teal/cyan metal accent, around `#4d8b92` or `#79aeb3`, paired with darker wrap `#31535a`. Keep it earned and muted.
- Use flat-shaded blocks with clear material breaks. No texture noise, no realistic wet shader, no translucent fishing line.

## Prop And Pose Ideas

- Priority prop: `fishing_teacher_bobber_demo`, a chunky red/cork float held forward in the right lower arm, larger than real scale.
- Primary teaching cluster: `fishing_teacher_small_net_frame`, `fishing_teacher_net_mesh_cross`, `fishing_teacher_line_spool`, and `fishing_teacher_rod_case`. These align with live starter tools.
- Quest-specific cluster: `fishing_teacher_sampler_string` with five tiny catch tokens, or a flat `fishing_teacher_catch_board` strapped to the belt/front hip.
- Advanced-trust cue: `fishing_teacher_rune_harpoon_tip` or `fishing_teacher_harpoon_lesson_badge`, small and partly wrapped, placed behind the shoulder or at the far hip.
- Optional bait cue: `fishing_teacher_bait_pouch`, a small cloth/leather pouch near the belt. Keep it secondary so the Fishing Supplier still owns stockpile/bait-tin language.
- Pose target: relaxed upright stance, head angled toward the float, one hand demonstrating line tension, one arm close to net or sampler. Make the pose inviting and instructional.
- Idle animation target for later: float-hand lift, tiny nod, line-spool bob, and return to neutral.
- Trade/talk animation target for later: tap the sampler board for quest progress, then point toward the starter tools.

## Gallery Scale And Framing

- Keep standard humanoid height and floor contact. Identity should come from prop placement, not scale changes.
- Best gallery angle: front three-quarter, showing hat brim, vest, wader bib, red float, net face, and at least three sampler colors.
- Do not hide the rod/net/sampler on the back. Back-only tools disappear in the NPC gallery and collapse the read back to "green worker."
- Oversize all real-world tiny items by 2-3x: float, hook, bait pouch, fish tokens, and line spool. The gallery should see icons, not accurate tackle.
- Thumbnail read order: hat, waders, red float, net, rod/line, fish sampler, rune-harpoon accent.
- Compare beside `tutorial_fishing_instructor`, `mainland_fishing_supplier`, `mainland_forester_teacher`, and `mainland_advanced_woodsman`. The Fishing Teacher should be the clearer lesson/progression NPC, while the supplier remains stock-focused.
- Avoid a pure side pose; it hides the vest/bib and makes the rod dominate. Avoid a pure front pose if it flattens the net frame.

## Concrete Integration Guidance

- Later implementation target: `src/js/content/npc-appearance-catalog.js`, inside `buildMainlandFishingTeacherPreset()`, unless the central NPC gallery/model rework introduces a dedicated authored model layer first.
- Preserve authored identifiers: `mainland_fishing_teacher`, label `Fishing Teacher`, archetype `riverbank_fishing_teacher`, world `appearanceId`, merchant ID `fishing_teacher`, dialogue ID `fishing_teacher`, quest ID `fishing_teacher_from_net_to_harpoon`, and NPC gallery preview actor entry.
- Lowest-risk pass: keep `buildFisherVariantPreset()`, retain the Tutorial Fishing Instructor dimensions, and add 8-12 `fishing_teacher_*` fragments that change the front read without destabilizing the shared rig.
- Better bespoke pass: keep the fisher rig proportions but reduce tutorial-clone dependence by replacing inherited generic fishing clutter with teacher-specific lesson props: demo float, compact net, rod case, sampler board/string, and wrapped rune-harpoon cue.
- Suggested fragments: `fishing_teacher_bobber_demo`, `fishing_teacher_line_loop`, `fishing_teacher_rod_case`, `fishing_teacher_small_net_frame`, `fishing_teacher_net_mesh_cross`, `fishing_teacher_sampler_string`, `fishing_teacher_shrimp_token`, `fishing_teacher_trout_token`, `fishing_teacher_salmon_token`, `fishing_teacher_tuna_token`, `fishing_teacher_swordfish_token`, `fishing_teacher_rune_harpoon_tip`, `fishing_teacher_bait_pouch`.
- If fragment budget gets tight, prioritize float/net/rod/sampler over bait pouch and harpoon detail. The stock already implies bait; the quest needs the sampler.
- If `clonePresetWithTheme()` remains in use, rely only on theme keys known to match inherited role substrings (`shirt`, `vest`, `wader`, `hat`, `belt`, `glove`, `boot`). Give every new `fishing_teacher_*` fragment explicit colors.
- Keep additions front-loaded and inspectable from the NPC gallery. Strong prop placement matters more than adding many tiny tackle fragments.
- Do not edit skill specs, merchant inventory, quest state, world placement, generated assets, item icons, or runtime held-item logic as part of this model integration.
- Likely failure modes to guard against: tutorial duplicate, supplier duplicate, pirate/captain read, combat harpooner, invisible line/hook, overlong rod clipping the gallery, fishmonger stink, or noisy green-brown props blending into the vest/waders.
- Suggested checks for later runtime work: `node .\tools\tests\npc-model-gallery-runtime-guard.js`, then manual `/qa npcgallery` inspection beside the supplier and tutorial instructor. This brief itself requires no runtime test.
