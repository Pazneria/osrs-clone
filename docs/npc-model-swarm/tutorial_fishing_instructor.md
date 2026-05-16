# Tutorial Fishing Instructor (`tutorial_fishing_instructor`)

Owned model: Fishing Instructor (`tutorial_fishing_instructor`)

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly NPC gallery model. This brief does not authorize runtime code edits.

## Current Read

- Existing preset: `buildTutorialFishingInstructorPreset()` in `src/js/content/npc-appearance-catalog.js` is already a dedicated preset, not just a recolored guide. It returns label `Fishing Instructor`, archetype `weathered_angler`, standard humanoid scale, and a full custom fragment set.
- Current visual base: broad brim hat, grey hair and beard, tan shirt, green vest, teal wader bib and straps, tall dark boots, gloves, belt, line spool, red/cork float, and a small landing net on the torso front.
- Current placement: `content/world/regions/tutorial_island.json` places `appearanceId: "tutorial_fishing_instructor"` at `merchant:tutorial_fishing_instructor`, `spawnId: "npc:tutorial_fishing_instructor"`, x `274`, y `240`, z `0`, stationary, facing north toward the pond.
- Current tutorial behavior: `core-tutorial-runtime.js` gives the player `small_net` at tutorial step 2, tells them to fish from the pond edge until raw shrimp appears, then sends them toward the fire clearing.
- Current spec expectation: `docs/TUTORIAL_ISLAND_SPEC.md` says the Fishing Instructor should stand on a clear pond edge and needs net/fishing props as a distinct silhouette.
- Current collision risk: `mainland_fishing_teacher` and `mainland_fishing_supplier` both derive from this fisher base. The tutorial version must stay simpler, earlier, and more "first lesson" than either mainland progression NPC.
- Main visual risk: the existing model reads as a competent angler, but the tutorial purpose can still be stronger. The bespoke pass should make "small-net shrimp lesson at the pond" visible before generic fishing-profession clutter.

## Tutorial And Gameplay Role

- This NPC is the second Survival Field instructor after woodcutting and before firemaking/cooking. He teaches the first food-gathering loop, not the full Fishing skill.
- The core lesson is small and tactile: stand at water, use a small net, catch raw shrimp, bring it back, then process it at the fire clearing.
- Keep him as a pond-edge teacher, not a shopkeeper, trawler captain, harpoon veteran, or mainland skill mentor. He should look ready to demonstrate one beginner action.
- Personality target: patient, slightly weathered, encouraging, and practical. He should feel like someone watching the player's first catch closely enough to say "try again" without making the station feel high stakes.
- The prop hierarchy should follow the tutorial step: small net first, raw shrimp second, pond-edge cue third. Rod, bait, and harpoon references can exist as small future-skill hints only if they do not steal the read.
- Compared with `mainland_fishing_teacher`, this model should be more basic and hands-on. No fish sampler, rune-harpoon badge, or advanced progression board.
- Compared with `mainland_fishing_supplier`, this model should carry almost no stock mass. No tackle crate, bait tins, price tags, or bundled inventory goods.

## Source Inspiration

- OSRS Tutorial Island uses the Survival Expert to introduce Fishing, Woodcutting, Firemaking, and Cooking; the fishing beat gives a small fishing net, uses a nearby pond, catches raw shrimps, and then cooks the catch. Source: https://oldschool.runescape.wiki/w/Tutorial_Island
- OSRS Fishing establishes the broader skill loop: selected fishing spots, raw fish that become food through Cooking, and early tool progression from net to rod/bait and later harpoon. Source: https://oldschool.runescape.wiki/w/Fishing
- OSRS Fishing spots show a specific Tutorial Island spot for small net plus raw shrimps, common `Net/Bait` spots, and the moving spot behavior. This supports a clear pond-marker or "watch the water" posture. Source: https://oldschool.runescape.wiki/w/Fishing_spots
- OSRS Small fishing net is the exact beginner-tool vocabulary: a non-stackable net used for small fish and available from the Fishing tutor/Lumbridge swamp context. Make it chunky, iconic, and low-poly. Source: https://oldschool.runescape.wiki/w/Small_fishing_net
- OSRS Fishing tutor dialogue is useful tonal inspiration for a plainspoken fisher who replaces a lost net and explains small-net basics, moving spots, rods, bait, lobster pots, and harpoons. Do not copy dialogue; borrow the tool-ladder clarity. Source: https://oldschool.runescape.wiki/w/Transcript:Fishing_tutor
- OSRS Fishing rod requires bait and catches early bait fish such as sardine/herring. Use only as a tiny "later you will learn this" cue, such as a short rod section tucked on the back. Source: https://oldschool.runescape.wiki/w/Fishing_rod
- OSRS Fishing bait is stackable and consumed with rod fishing. For this tutorial model, bait should be absent or one sealed pouch at most; the player is being taught net fishing, not bait management. Source: https://oldschool.runescape.wiki/w/Fishing_bait
- OSRS Harpoon starts much later for tuna/swordfish and big-fish progression. Avoid a visible harpoon on this NPC unless the gallery needs an extremely small far-future accent. Source: https://oldschool.runescape.wiki/w/Harpoon
- OSRS Angler's outfit gives canonical fishing-clothing language: hat, top, waders, and boots. Use it as vocabulary for workwear, not as an outfit copy. Source: https://oldschool.runescape.wiki/w/Angler%27s_outfit
- Medieval angling precedent: `A Treatyse of Fysshynge wyth an Angle` frames rods, lines, hooks, bait, patience, and angling as learned discipline. Use this for "teacher of method" mood rather than literal bookish props. Source: https://www.gutenberg.org/ebooks/57943
- Medieval fishing practice surveys separate rods, nets, traps, hooks, and harpoons, and distinguish capture gear from puncture gear. This supports making the beginner capture-net identity dominant. Source: https://www.medievalists.net/2020/11/medieval-fishing/
- Medieval manuscript imagery such as Tacuinum Sanitatis fishing scenes supports simple shore/stream workwear, bent posture, hand nets, and low-tech water labor. Source: https://commons.wikimedia.org/wiki/File:Tacuinum_Sanitatis-fishing_lamprey.jpg
- Low-poly scale discipline: Kenney Mini Characters prove compact, animation-friendly bodies can read through oversized head/hands and one or two clear props. Source: https://kenney.nl/assets/mini-characters
- Low-poly rig discipline: Quaternius Ultimate Animated Character Pack validates simple character proportions, clean material splits, and animation-friendly accessory scale. Source: https://quaternius.com/packs/ultimatedanimatedcharacter.html
- Low-poly fisherman/apprentice reference: Sketchfab Village Character - Fisherman is useful for medieval fisher readability and carried-gear silhouette, but do not copy mesh, texture, outfit layout, or basket design. Source: https://sketchfab.com/3d-models/village-character-fisherman-c79ae4f48c5643c9a1688e93a350fd69

## Silhouette Goals

- First read at thumbnail size: brimmed pond instructor with waders and an obvious small fishing net.
- The net should be the strongest prop. Make the rim larger, flatter, and more front-facing than the current small torso net, with two or three thick mesh bars.
- Add a raw-shrimp cue, not a pile of fish. One oversized curled pink shrimp token on a lesson board, hip string, or held demonstration tile is enough.
- Preserve the hat, beard, vest, and waders because they already separate the instructor from the starting guide and firemaking/cooking station.
- Make the pose more instructional: one arm presents or points at the net, the head angles toward the pond/hand, and the stance remains grounded on the bank.
- Keep rod language secondary. A short reed rod segment or line loop can sit behind the shoulder or at the belt, but a full-length pole will dominate the camera and imply a later skill tier.
- Avoid harpoon silhouettes, lobster pots, trawler gear, fish crates, bait tins, merchant tags, pirate/captain cues, or anything that makes him read as supplier, sailor, or combat fisher.
- Push "first catch" over "expert angler": clean empty net, single shrimp token, simple pond lesson, no impressive haul.

## Color And Materials

- Preserve the current core family: skin `#c18b69`, hair `#5f5a51`, beard `#565046`, shirt `#a98356`, vest `#466b59`, wader `#3a5753`, hat `#7b6a43`, belt `#5a3a25`, boot `#2c231b`.
- Keep the waders as the largest lower-body mass and the vest as the upper-body profession block. The palette should stay damp green-brown, not navy sailor or market vendor.
- Net frame: worn wood/reed around `#76583a`; mesh cord `#cbbf97`; optional darker knots/sinkers `#5a4933`. Mesh must be thick geometry, not fine texture lines.
- Tutorial shrimp accent: warm pink/coral around `#c9897f` with a darker crease `#9c5f58`. Keep it matte and icon-like.
- Water/pond cue, if used: one tiny blue-green rectangle or droplet around `#4f7b7a`, kept subordinate to the net and not glowing.
- Float/line cue can stay: cork `#b4773f`, float red `#9b2e2a`, line `#ded2a6`. Do not let the float become the main read; that belongs more to rod fishing.
- Materials should be flat shaded: cloth, rubbery waders, worn wood, dull cord, cork, and simple skin/hair blocks. No glossy wet shader, no transparent fishing line, no realistic fish scale texture.
- Add contrast through small warm accents: shrimp pink, cork orange, pale net cord, and one red float. Do not solve readability by making the whole NPC brighter.

## Prop And Pose Ideas

- Priority prop: `tutorial_fishing_small_net_demo`, a front/side oval or rounded-rectangle net attached near the left lower arm, with a sturdy rim and exaggerated cross mesh.
- Tutorial proof prop: `tutorial_fishing_shrimp_token`, one curled shrimp icon either inside the net, on a small lesson tab, or dangling from the belt.
- Optional station cue: `tutorial_fishing_pond_marker`, a small blue-green tile/tear shape on the lesson tab that reads as "water edge" without becoming UI.
- Existing props to keep or refine: `line_spool_core`, `line_spool_wrap`, `float_red`, `float_cork`, and landing-net family fragments, but resize/rename future additions so the starter net owns the silhouette.
- Optional rod hint: `tutorial_fishing_short_rod_section` or `tutorial_fishing_reed_rod_stub`, short and strapped behind the shoulder. It should be visible only after the net reads.
- Optional hand cue: `tutorial_fishing_pointing_hand` or local lower-arm pose adjustment toward the pond/net. Keep this compatible with the existing humanoid arm rig.
- Pose target: relaxed upright stance, feet planted near water, one forearm forward with the net, the other close to line/spool or gesturing toward the pond.
- Idle animation target for later: tiny net lift, nod toward water, float/spool bob, return to neutral.
- Talk/check animation target for later: present the net, glance at shrimp token, then gesture toward the fire-clearing direction after the player has raw shrimp.

## Gallery Scale And Framing

- Keep standard tutorial humanoid height, floor contact, and rig proportions. Identity should come from prop clarity, not scale changes.
- Best gallery angle: front three-quarter from the net side, showing hat brim, beard, vest front, wader bib, net face, and shrimp accent.
- Thumbnail read order: hat/waders, small net, shrimp token, vest, spool/float, optional rod stub.
- Oversize all true-to-life tiny details by 2-3x: net mesh bars, shrimp, float, knot, line spool, and any hook/line hints.
- Do not hide the net or shrimp on the back. Back-only props collapse the model into "generic fisher with hat."
- Keep the net inside a shoulder-width-plus margin so the gallery camera does not shrink the whole model to frame a wide prop.
- Compare beside `tutorial_woodcutting_instructor`, `tutorial_firemaking_instructor`, `mainland_fishing_teacher`, and `mainland_fishing_supplier`. The Fishing Instructor should be the simplest and clearest first-action skilling mentor.
- Avoid pure side pose; it hides the vest/bib and turns the net into a thin line. Avoid pure front pose if the net and hand overlap into one unreadable block.

## Concrete Integration Guidance

- Later implementation target: `src/js/content/npc-appearance-catalog.js`, inside `buildTutorialFishingInstructorPreset()`, unless the central NPC gallery/model rework introduces a dedicated authored model layer first.
- Preserve identifiers and wiring: `tutorial_fishing_instructor`, label `Fishing Instructor`, archetype `weathered_angler`, `appearanceId`, `serviceId: "merchant:tutorial_fishing_instructor"`, `spawnId: "npc:tutorial_fishing_instructor"`, `dialogueId: "tutorial_fishing_instructor"`, and NPC gallery preview actor entry.
- Preserve placement assumptions: stationary pond-edge instructor, facing north toward the pond, tutorial step 2 net/shrimp guidance.
- Lowest-risk pass: keep the current humanoid dimensions, hat/beard/wader/vest base, and arm rig defaults; add or replace 6-10 tutorial-specific front fragments that emphasize net plus shrimp.
- Better bespoke pass: keep the fisher rig but tune the inherited generic angler clutter down. Make the landing net larger and more demonstrative, reduce merchant-like stock details, and add one unmistakable raw-shrimp lesson cue.
- Suggested fragments: `tutorial_fishing_small_net_handle`, `tutorial_fishing_small_net_rim`, `tutorial_fishing_net_mesh_horizontal`, `tutorial_fishing_net_mesh_vertical`, `tutorial_fishing_shrimp_token`, `tutorial_fishing_shrimp_shadow`, `tutorial_fishing_pond_marker`, `tutorial_fishing_short_rod_section`, `tutorial_fishing_beginner_lesson_tab`, `tutorial_fishing_line_loop`.
- If fragment budget gets tight, prioritize net rim, two mesh bars, shrimp token, and arm pose. Rod, bait, pond marker, and extra float detail are optional.
- If keeping existing `landing_net_*` roles, make sure the new tutorial-specific read is not swallowed by the older torso props. Explicit `tutorial_fishing_*` names will make future review easier.
- Do not edit tutorial progression, fishing runtime, item grants, merchant definitions, world placement, generated assets, item icons, or mainland fisher variants as part of this model brief.
- Likely failure modes to guard against: clone of mainland teacher, clone of supplier, generic angler, invisible net mesh, shrimp lost against shirt colors, rod dominating the silhouette, harpoon/combat read, fishing-shop read, or prop sprawl that shrinks the NPC in gallery.
- Suggested checks for later runtime work: `node .\tools\tests\npc-model-gallery-runtime-guard.js`, then manual `/qa npcgallery` inspection focused on `tutorial_fishing_instructor` beside the mainland fishing teacher and supplier. This brief itself requires no runtime test.
