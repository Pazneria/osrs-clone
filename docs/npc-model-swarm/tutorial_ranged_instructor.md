# Tutorial Ranged Instructor (`tutorial_ranged_instructor`)

Owned model: Ranged Instructor (`tutorial_ranged_instructor`)

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly Tutorial Island NPC gallery model. This brief is for central integration planning only; it does not authorize runtime code edits.

## Current Read

- Live preset: `buildTutorialRangedInstructorPreset()` in `src/js/content/npc-appearance-catalog.js` clones `buildTutorialCombatInstructorPreset()`, relabels it as `Ranged Instructor`, sets archetype `archery_range_trainer`, rethemes steel/mail/cape/sword/shield roles into green, brown, and wood tones, then adds quiver and shortbow fragments.
- Current silhouette already has a strong ranged read: back quiver case, two arrow shafts, and a shortbow attached through the existing right-hand weapon node named `axe`.
- Current palette direction is useful but inherited: green armor/cloth `#40513f`/`#4b5f3c`/`#4f643f`, leather `#5c3b24`, bronze `#8e6b33`, bow/blade wood `#7a4c2a`, cape `#2f5a3d`, and shield brown `#5b3b27`.
- Live placement: `content/world/regions/tutorial_island.json` places `merchant:tutorial_ranged_instructor` / `npc:tutorial_ranged_instructor` at `x: 340, y: 320`, with `appearanceId: "tutorial_ranged_instructor"`, dialogue `tutorial_ranged_instructor`, action `Talk-to`, and tags `tutorial`, `combat`, and `ranged`.
- Tutorial spec calls for this NPC immediately after melee, near a visible archery target or safe line, teaching a real `normal_shortbow` plus real `bronze_arrows` made from the earlier smithing arrowhead chain.
- Runtime dialogue grants `normal_shortbow_u`, `bow_string`, `wooden_headless_arrows`, and food, then asks the player to finish the bow and arrows, keep ammo in inventory, stand a few tiles away, and shoot a chicken.
- Important reuse risk: `buildMainlandAdvancedFletcherPreset()` currently clones this Ranged Instructor. Any tutorial-only target, safety-line, or beginner-lesson detail added to the base can leak into the Advanced Fletcher unless central integration splits instructor details from shared bow-user details.
- Main visual risk: the model reads "green combat instructor with bow" before it reads "calm archery teacher at the Tutorial Island range." It needs stronger distance-teaching, starter-gear, and target-line cues without becoming the craft-focused Advanced Fletcher.

## Tutorial And Gameplay Role

- This NPC turns the previous melee lesson into a spacing lesson. The model should say "stand back and aim" before the dialogue does.
- He teaches three linked concepts: finish real ranged gear, understand that arrows can stay in inventory, and use distance as protection.
- He should feel safer and more instructional than a combat enemy archer: upright, watchful, patient, and slightly stern, with a bow used as a pointer or demonstration tool rather than a drawn weapon.
- The repo's lesson is more craft-linked than OSRS Tutorial Island: the player strings a bow and tips headless arrows with forged bronze arrowheads. The model should show beginner components, not just a fully armed ranger.
- Keep him combat-adjacent but not melee-heavy. Any inherited shield, sword, or knightly plate read should lose to bow, arrows, bracer, range marker, and target cue.
- He should differ from `mainland_advanced_fletcher`: this is a starter range instructor who supervises safe shots, not a master bowyer evaluating yew work or merchant stock.

## Source Inspiration

- OSRS Tutorial Island: Vannaka teaches the ranged stage after melee, gives a shortbow and bronze arrows, and the tutorial's only ranged weapon is a shortbow with bronze arrows. Borrow the shortbow-plus-bronze-ammo starter identity and single safe target lesson, not the exact one-NPC melee/ranged structure. Source: https://oldschool.runescape.wiki/w/Tutorial_Island
- OSRS Vannaka: he is the canonical Tutorial Island combat authority who teaches both Melee and Ranged in OSRS. For this separate Ranged Instructor, borrow veteran confidence and terse lesson energy, but avoid Vannaka's oversized sword/shield silhouette. Source: https://oldschool.runescape.wiki/w/Vannaka
- OSRS Ranged: Ranged is a distance combat class built around bows, crossbows, thrown weapons, and ammunition. Use that as the top-level role read: distance, ammunition, and accuracy. Source: https://oldschool.runescape.wiki/w/Ranged
- OSRS Ranged combat tutor transcript: the tutor points new players toward bow, arrows, wood, feathers, arrow heads, and bow string. This supports visible beginner components and an instructional, not heroic, ranged posture. Source: https://oldschool.runescape.wiki/w/Transcript%3ARanged_combat_tutor
- OSRS Bow: shortbow/longbow vocabulary should remain simple and readable, with a curved wooden limb and visible string. The Tutorial Island model should favor shortbow scale over a tall prestige longbow. Source: https://oldschool.runescape.wiki/w/Bow
- OSRS Fletching: fletching connects logs, bow strings, arrow shafts, feathers, and arrowheads into ranged gear. Use this only as beginner assembly context; do not make the instructor a full fletching supplier. Source: https://oldschool.runescape.wiki/w/Fletching
- Royal Armouries longbow reference: medieval longbows were simple self bows, often yew, with hemp/flax strings, and arrows were issued in sheaves. Borrow plain wood, natural string, and disciplined practice cues, not full war-archer scale. Source: https://royalarmouries.org/objects-and-stories/stories/the-hundred-years-war-1337-1453
- Bow International on medieval arrow transport: medieval arrow carriage often used belt/hip tubes, arrow bags, or carried bundles rather than the fantasy default of a back quiver. The current back quiver is acceptable for instant game readability, but a visible hip arrow bundle or belt pouch would be more teacherly and less ranger-hero. Source: https://www.bow-international.com/features/history-of-archery-how-medieval-arrows-were-transported/
- Bow International on arrows: medieval arrows used visible shafts, fletchings, nocks, and varied heads; fletchings and thread bindings are the readable parts at small scale. Borrow oversized pale fletchings and bronze tips as simple blocks. Source: https://www.bow-international.com/features/arrows-in-the-middle-ages/
- Low-poly bow/quiver references: simple low-poly medieval bow, quiver, and arrow assets show that props read best as thick curves, blocky fletchings, and clean attachment points. Sources: https://sketchfab.com/3d-models/medieval-bows-and-crossbows-b77ff32131fc49998795ed226c40cc63 and https://sketchfab.com/3d-models/quiver-with-belt-medieval-fantasy-challenge-33f979682e5543a5bb7947883a573040
- Compact game-art references: Kenney Mini Characters and Quaternius Low Poly RPG Pack support the repo-friendly approach of identity through large props, flat color roles, and rig-compatible primitive forms. Sources: https://kenney.nl/assets/mini-characters and https://opengameart.org/content/low-poly-rpg-pack

## Silhouette Goals

- First read at thumbnail size: green/brown archery instructor with shortbow, quiver/arrows, arm bracer, and a target-line cue.
- Keep the bow as the dominant prop, but make it a demonstration bow: held low or vertical at the side, not fully drawn at the player's face.
- Use a visible off-white string and chunky upper/lower limbs. Hairline strings and realistic arrow shafts will vanish in the NPC gallery.
- Add one front-readable teaching cue: a small round target token, a striped range-marker stake, a lesson badge shaped like a bullseye, or a belt tag with bronze arrowheads.
- Add one beginner-assembly cue: loose bow string loop, tiny unstrung-bow tag, bronze arrowhead packet, or headless-arrow bundle. This is the repo-specific difference from OSRS.
- Keep face and hands visible. A hood or full helmet would push the model toward a generic ranger, enemy archer, or elite scout.
- Reduce inherited melee mass. Broad shield shapes, sword-like diagonals, heavy pauldrons, or plate-chest glare should be minimized or visually converted into archery bracer/leather vest language.
- Distinguish from `mainland_advanced_fletcher`: the Ranged Instructor can keep the back quiver and safety target cue; the Advanced Fletcher should own taller yew-stave, apron, and craft-evaluation cues.
- Avoid crossbow, throwing knives, ornate Robin Hood costume, military longbowman helmet, giant fantasy bow, glowing ammo, skull trophies, or animal-hide monster armor.

## Color And Material Notes

- Keep the green/brown trainer palette, but shift material read from recolored armor to practical cloth, leather, and wood.
- Suggested anchors: deep green tunic/vest `#40513f`, moss cloth `#4b5f3c`, dark leather `#5c3b24`, bow wood `#7a4c2a`, lighter bow edge `#8a5a2c`, bronze arrowheads `#8e6b33`, pale string/fletchings `#efe6c9`, target red `#8a2f2a`, target linen `#d9d2bd`, boot dark `#2a2018`.
- Bow wood should be warm and matte. Use two or three block colors to separate grip, limbs, and nocks; avoid texture noise.
- Fletchings should be pale and oversized. Three separate tiny feathers are less useful than a simple triangular or block fan that survives 148 px.
- Bracer and belt should be dark leather with one bronze buckle or arrowhead packet. Do not cover the whole torso in leather plates.
- If a target cue is added, use restrained red and cream on a very small prop. It should read as "range lesson," not as a carnival sign.
- Keep material breaks geometric: bracer slab, belt pouch, quiver rim, bow nock blocks, string strip, target disk, arrowhead packet.

## Prop And Pose Ideas

- Priority pose: feet planted behind an implied safe line, torso open to player, bow held low in the right hand as a pointer, left hand near the string or arrow bundle as if explaining loading.
- Strongest single addition: `ranged_instructor_target_badge` or `ranged_instructor_range_marker`, a small red/cream target cue on the belt or beside the boot.
- Best repo-specific prop: `ranged_instructor_arrowhead_packet`, a small bronze packet or sample board on the belt to echo the forged arrowhead chain.
- Best beginner-gear prop: `ranged_instructor_string_loop`, an off-white loop hanging from the belt or hand, paired with the finished shortbow.
- Quiver upgrade: keep the existing back quiver for instant read, but add `ranged_instructor_quiver_rim`, `ranged_instructor_arrow_fletch_fan`, and maybe `ranged_instructor_hip_arrow_bundle` if bounds allow.
- Bow upgrade: `ranged_instructor_shortbow_grip_wrap`, `ranged_instructor_upper_nock`, `ranged_instructor_lower_nock`, `ranged_instructor_visible_string`, and a slightly thicker lower limb so the curve does not flatten.
- Body upgrades: `ranged_instructor_leather_chest_guard`, `ranged_instructor_bow_arm_bracer`, `ranged_instructor_green_tunic_panel`, `ranged_instructor_bronze_belt_buckle`, and `ranged_instructor_open_collar`.
- Idle animation target for later: tiny bow tilt, glance toward range marker, fingers check string, return to neutral.
- Talk animation target for later: lift the bow a few degrees as a pointer, tap the target badge or arrowhead packet, then open the hand toward the practice lane.

## Gallery Scale And Framing Notes

- The gallery thumbnail is small; required read order should be bow curve, pale string, green instructor body, quiver/fletchings, bracer, target or arrowhead lesson cue.
- Keep standard humanoid scale. Authority should come from clean archery props and stance, not extra height.
- Best angle: front three-quarter with the bow on the near side, quiver/fletchings breaking the far shoulder silhouette, bracer visible, and target cue on front belt or boot side.
- Keep the bow inside the normal humanoid bounds. A tall vertical longbow or wide drawn pose will shrink the whole card and hide the face.
- Back quiver must still break the silhouette from the side. If it sits fully behind the torso, it will disappear; if it spreads too far, it will make the model read as an adventurer rather than an instructor.
- Target cue must be chunky and close to the body. A freestanding archery target should remain world scenery, not part of the NPC model, unless the central gallery supports small ground props.
- Compare beside `tutorial_combat_instructor`, `mainland_advanced_fletcher`, `mainland_fletching_supplier`, `tutorial_magic_instructor`, and `enemy_training_dummy`. This model should be the green starter ranged teacher, not the melee veteran, bowyer merchant, component vendor, magic caster, or target prop.

## Concrete Implementation Guidance For Central Integration

- Future implementation target: `src/js/content/npc-appearance-catalog.js`, specifically `buildTutorialRangedInstructorPreset()`, unless the central NPC gallery/model rework introduces a dedicated authored model layer first.
- Preserve stable identifiers: `tutorial_ranged_instructor`, label `Ranged Instructor`, archetype `archery_range_trainer`, world `appearanceId`, spawn `npc:tutorial_ranged_instructor`, service `merchant:tutorial_ranged_instructor`, dialogue `tutorial_ranged_instructor`, and NPC gallery preview actor entry.
- Account for clone inheritance before editing. Preferred central approach: extract a shared bow-user base or helper fragments, then let `buildTutorialRangedInstructorPreset()` add target/safety/beginner-gear props while `buildMainlandAdvancedFletcherPreset()` adds bowyer/apron/yew-evaluation props.
- Lowest-risk first pass: keep the current Combat Instructor clone, retain bow/quiver attachments, reduce melee reads through colors and added front props, and add 10-16 `ranged_instructor_*` fragments.
- Suggested fragments: `ranged_instructor_leather_chest_guard`, `ranged_instructor_bow_arm_bracer`, `ranged_instructor_green_tunic_panel`, `ranged_instructor_shortbow_grip_wrap`, `ranged_instructor_upper_nock`, `ranged_instructor_lower_nock`, `ranged_instructor_visible_string`, `ranged_instructor_quiver_rim`, `ranged_instructor_arrow_fletch_fan`, `ranged_instructor_hip_arrow_bundle`, `ranged_instructor_string_loop`, `ranged_instructor_arrowhead_packet`, `ranged_instructor_target_badge`, `ranged_instructor_range_marker`, and `ranged_instructor_bronze_belt_buckle`.
- The current bow is attached to the existing weapon/`axe` node convention inherited from humanoid equipment. Preserve that attachment path unless a central model pass renames weapon nodes across all NPC presets.
- Do not add generated OBJ/PNG assets, item icon sources, merchant stock, dialogue, tutorial progression, combat math, world placement, or archery target world props as part of this model brief.
- Likely failure modes to guard against: green melee-instructor clone, generic ranger hero, craft-merchant fletcher, invisible bow string, quiver hidden behind torso, bow raised out of frame, target cue too decorative, and beginner gear props leaking into `mainland_advanced_fletcher`.
- Suggested checks for later runtime/model integration: `node .\tools\tests\npc-model-gallery-runtime-guard.js`, `npm.cmd run test:player-npc-humanoid:guard`, and manual `/qa npcgallery` comparison against the Tutorial Island instructor row plus `mainland_advanced_fletcher`. This markdown-only brief itself requires no runtime test.
