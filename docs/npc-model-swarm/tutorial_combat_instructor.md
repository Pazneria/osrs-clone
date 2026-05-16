# Tutorial Combat Instructor (`tutorial_combat_instructor`)

Owned model: Combat Instructor (`tutorial_combat_instructor`)

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly NPC gallery model. This brief does not authorize runtime code edits.

## Current Read

- Existing preset: `buildTutorialCombatInstructorPreset()` in `src/js/content/npc-appearance-catalog.js` is already a direct custom catalog preset, not a generic guide recolor.
- Current identity: label `Combat Instructor`, archetype `yard_arms_trainer`, full steel/mail armor, red cape with gold clasps, shaved scalp, heavy pauldrons, battle belt, lowered sword in the right-hand weapon node, and a left forearm shield.
- Current palette is strong and useful: skin `#c58c68`, steel `#9aa5a2`, steel light `#c4ccca`, steel dark `#596360`, mail `#687370`, leather `#5b3b27`, bronze `#a9793d`, red cape `#8a2f2a`, dark cape `#4f1f1c`, cape trim `#b89545`, blade `#c4ccca`.
- World placement: `content/world/regions/tutorial_island.json` places `merchant:tutorial_combat_instructor` / `npc:tutorial_combat_instructor` at the tutorial combat lane, with `appearanceId: "tutorial_combat_instructor"`, `dialogueId: "tutorial_combat_instructor"`, `action: "Talk-to"`, and tags `tutorial` and `combat`.
- Local scene context includes a nearby `weapon_rack` and `training_dummy`, but the tutorial spec says those props should not distract from the real melee target: chickens.
- Gameplay text in this repo asks the player to equip the real `bronze_sword` they made, fight a chicken up close, watch the combat tab, and use cooked shrimp if needed.
- Important reuse risk: `buildEnemyGuardPreset()` currently clones `buildTutorialCombatInstructorPreset()`. Any instructor-specific fragments added to the base can leak into `enemy_guard` unless integration splits a shared armored base from instructor-only details.
- Main visual risk: the current model reads as "competent armored fighter" immediately, but not yet as "tutorial arms trainer at the chicken pen." It needs stronger lesson props and warm instructor cues without becoming the blue civic `enemy_guard`, the `tutorial_ranged_instructor`, or a boss knight.

## Tutorial And Gameplay Role

- This NPC is the first melee authority after the player makes a real weapon. The model should say "use what you made" before the dialogue does.
- He teaches equipment, attack styles, close-range targeting, food safety, and the idea that combat is deliberate practice rather than random clicking.
- The tone should be firm, slightly impatient, and reassuringly dangerous. He is allowed to look overqualified because Tutorial Island needs a veteran who can make combat feel safe.
- He should frame the chicken pen as a controlled training lane. The model can point, brace, and supervise; it should not look like he is about to join the fight.
- Keep him melee-first. Vannaka teaches ranged in OSRS, but this repo has a separate `tutorial_ranged_instructor`, so bows, quivers, and archery targets should stay out of this silhouette.
- The model should feel like an instructor who owns the weapon rack, the dummy, and the pen gate, not like a guard defending a town threshold.

## Source Inspiration

- OSRS Vannaka / Combat Instructor: a highly accomplished fighter tied to Tutorial Island and Edgeville Dungeon, remembered for the exaggerated steel two-handed sword plus dragon square shield read. Borrow the impossible veteran confidence, broad shield mass, and oversized weapon authority, not the exact outfit or dragon motif. Source: https://oldschool.runescape.wiki/w/Vannaka
- OSRS Tutorial Island combat section: the Combat Instructor teaches melee and ranged basics, worn equipment, combat interface, attack styles, and the first safe monster fight. Use this as role authority, while adapting the target from OSRS rats to this repo's chickens. Source: https://oldschool.runescape.wiki/w/Tutorial_Island
- OSRS Vannaka dialogue: combat stats, melee basics, enemy level color, and risk framing make him a terse combat explainer rather than a friendly shopkeeper. Use that directness for pose and expression. Source: https://oldschool.runescape.wiki/w/Transcript:Vannaka
- OSRS Melee combat tutor / Harlan: the Lumbridge tutor gives a training sword and shield and is explicitly swordplay-oriented. This supports a visible trainer kit: practice sword, shield, and equipment-instruction posture. Sources: https://oldschool.runescape.wiki/w/Transcript:Melee_combat_tutor and https://oldschoolrunescape.fandom.com/wiki/Melee_combat_tutor
- OSRS Melee: Attack, Strength, and Defence are the core melee identity. The model can hint at all three through sword accuracy, heavy shield/armor, and grounded stance. Source: https://oldschool.runescape.wiki/w/Melee
- OSRS Training dummy: the wider OSRS visual language treats dummies as safe combat practice objects. The instructor can share the yard with a dummy, but should remain the human lesson authority. Source: https://oldschool.runescape.wiki/w/Training_dummy
- Royal Armouries MSS I.33: early fencing-manual imagery centers on sword-and-buckler instruction between master and student. Borrow the "teacher demonstrating a guard" idea and compact shield/sword relationship, not historical costume fidelity. Source: https://royalarmouries.org/objects-and-stories/up-close-online-exhibition/medieval-german-fencing-manual
- Low-poly medieval training room reference: weapon racks, shields, swords, and bows read clearly when arranged as large simple silhouettes. Use the rack-and-yard vocabulary as environment inspiration only. Source: https://sketchfab.com/3d-models/low-poly-isometric-medieval-training-room-5e316c7b35874a20b0136a7916cbd345
- Quaternius LowPoly Animated Knight: a CC0 low-poly armored humanoid with weapon parenting guidance reinforces the value of chunky limbs, readable armor plates, and rig-compatible hand props. Source: https://opengameart.org/content/lowpoly-animated-knight
- Medieval low-poly training dummy references support post, straw, and target language around the scene. Keep this on nearby props or tiny belt/rack cues; do not let the instructor turn into the dummy owner model. Source: https://www.cgtrader.com/3d-models/military/other/medieval-training-dummy-wood

## Silhouette Goals

- First read at thumbnail size: armored melee instructor with red cape/sash, lowered sword, square shield, and an unmistakable "lesson yard" cue.
- Preserve the strong current armored body, but make the teaching role beat the battle role. The weapon should point or demonstrate; it should not look mid-swing.
- Keep the exposed face and shaved scalp visible. A full helmet would make him a guard, knight, or enemy; the instructor needs readable expression and eye contact.
- Use the red cape as the instructor/faction read, but keep it controlled behind the torso. A huge cape can turn him into a hero boss and widen gallery bounds.
- The shield should be broad and simple, preferably squarer than the guard shield, with warm bronze trim or a dull red training mark. Avoid blue civic coloring because `enemy_guard` owns that.
- The sword should feel like a master weapon or blunted demonstration blade: long enough to be iconic, low enough not to shrink the thumbnail, and angled like a pointer toward the practice lane.
- Add one strong tutorial-specific prop: a belt-hung wooden practice sword, a tiny lesson tally tag, a red training sash, or a chunky "first swing" badge on the belt/clasp.
- Add one chicken-pen or yard cue only if it stays tiny and tasteful: a small gate key, whistle, or lesson token. Do not add feathers, trophies, bones, blood, or monster parts.
- Avoid bow/quiver, blue tabard, full face helmet, huge two-handed overhead pose, ornate dragon shield art, skull trophies, glowing runes, or decorative boss armor.

## Color And Material Notes

- Keep dominant armor muted and old-school: dull steel, mail gray-green, worn leather, bronze trim, and simple flat planes.
- Preserve the warm red/gold instructor identity from the current cape and clasps. This is the easiest way to separate him from the blue `enemy_guard`.
- Suggested accent split: steel and mail for competence, red cape/sash for Tutorial Island authority, bronze for clasps/buckle/shield rim, dark leather for belt and straps, pale blade edge for the sword.
- Add tutorial-specific warmth through small objects, not by repainting the whole armor. A red sash, brass whistle, or bronze lesson badge is enough.
- If adding a practice sword, make it wooden or dulled bronze/brown so it does not compete with the real metal blade.
- If adding a training-shield motif, keep it blocky: a red stripe, bronze boss, or simple square plate. No tiny heraldry; it will shimmer or vanish.
- Keep material breaks geometric. Use armor plate slabs, straps, clasps, rims, and raised bands rather than texture noise.
- Do not brighten the steel into polished heroic silver. The instructor should feel worn, used, and reliable.

## Prop And Pose Ideas

- Priority pose: feet planted, torso squared, shield tucked left, sword lowered diagonally as if indicating the chicken pen or demonstrating where a first swing begins.
- Strongest single addition: `combat_instructor_training_sash`, a red or red-gold diagonal/waist sash that reads as "instructor" and survives gallery scale.
- Best lesson prop: `combat_instructor_practice_sword`, a short wooden or bronze training blade strapped at the belt or held low as a pointer. It should be separate from the main metal sword.
- Best authority prop: `combat_instructor_gate_key` or `combat_instructor_whistle`, tiny but high-contrast at the belt, implying he controls the training lane.
- Shield upgrades: `combat_instructor_square_shield_face`, `combat_instructor_bronze_shield_rim`, `combat_instructor_shield_boss`, and maybe one red training stripe.
- Armor upgrades: `combat_instructor_open_brow_band`, `combat_instructor_neck_mail`, `combat_instructor_bronze_cape_clasp_large`, and `combat_instructor_belt_lesson_badge`.
- Sword upgrades: `combat_instructor_blunted_sword_tip`, `combat_instructor_sword_fuller`, and `combat_instructor_sword_grip_wrap`. Keep the tip below head height.
- Idle animation target for later: tiny nod, sword point settles, shield hand tightens, glance toward pen, return to neutral.
- Talk animation target for later: lift the sword a few degrees as a pointer, tap shield once, then open the stance back toward the player.
- Hit/alert animation target for later, if ever used: short disciplined recoil. He should never flail like a novice or lunge like an enemy brute.

## Gallery Scale And Framing Notes

- The gallery thumbnail is `THUMB_SIZE = 148`; the required read order at that size should be face, red instructor cape/sash, sword, shield, armor, belt lesson prop.
- Keep standard humanoid scale. The instructor's authority should come from posture and gear, not oversized height.
- Best angle: front three-quarter or front orthographic with shield face, sword diagonal, cape edge, and face all visible.
- Keep the shield tight to the left forearm. If it spreads too far, the gallery fit will shrink the whole model and the face will lose authority.
- Keep the sword low and inside the silhouette envelope. A raised or long two-handed sword above the head will dominate bounds and turn the model into a combat enemy preview.
- Make all trainer-specific props larger than real scale. A whistle, key, badge, or practice sword must be chunky enough to read at 96-148 px.
- Compare beside `enemy_guard`, `tutorial_ranged_instructor`, `enemy_training_dummy`, and `tutorial_mining_smithing_instructor`. The Combat Instructor should be the red-caped melee teacher, not the blue guard, bow teacher, dummy, or smith.
- In the Tutorial Island lineup, the model should be the clearest armored instructor, while still feeling safe because the sword is lowered and the face is exposed.

## Concrete Implementation Guidance For Central Integration

- Later implementation target: `src/js/content/npc-appearance-catalog.js`, inside `buildTutorialCombatInstructorPreset()`, unless the central NPC gallery/model rework introduces a dedicated authored model layer first.
- Preserve identifiers and wiring: `tutorial_combat_instructor`, label `Combat Instructor`, archetype `yard_arms_trainer`, world `appearanceId`, service ID `merchant:tutorial_combat_instructor`, spawn ID `npc:tutorial_combat_instructor`, dialogue ID `tutorial_combat_instructor`, and NPC gallery preview actor entry.
- Account for `enemy_guard` inheritance before editing the base. Preferred central approach: extract a shared armored humanoid base, then let `buildTutorialCombatInstructorPreset()` add red trainer/cape/sash/lesson props while `buildEnemyGuardPreset()` adds blue civic guard props. Do not let the guard inherit chicken-pen or tutorial-specific details.
- Lowest-risk first pass: keep the existing Combat Instructor preset structure, retain the sword/shield rig, keep exposed face and red cape, and add 8-14 front-readable instructor fragments.
- Suggested fragments: `combat_instructor_training_sash`, `combat_instructor_bronze_cape_clasp_large`, `combat_instructor_belt_lesson_badge`, `combat_instructor_gate_key`, `combat_instructor_practice_sword`, `combat_instructor_square_shield_face`, `combat_instructor_bronze_shield_rim`, `combat_instructor_shield_boss`, `combat_instructor_red_shield_stripe`, `combat_instructor_blunted_sword_tip`, `combat_instructor_sword_grip_wrap`, `combat_instructor_open_brow_band`.
- The current right-hand sword fragments are attached through the existing weapon/`axe` node convention. Preserve that attachment path unless a central model rework renames or abstracts weapon nodes across all NPC presets.
- If a central authored model layer appears, keep this as a humanoid catalog model with simple primitive armor and props. Do not import a high-detail knight mesh or texture-heavy marketplace asset.
- Do not edit tutorial progression, combat math, item catalogs, merchant stock, dialogue, world placement, training dummy props, generated assets, or player equipment assets as part of this model integration.
- Likely failure modes to guard against: generic blue guard clone, over-armored boss knight, full-helmet faceless soldier, ranged instructor bleed, invisible lesson prop, giant cape shrink, weapon raised out of frame, or chicken-themed comedy that undercuts the veteran read.
- Suggested later checks after runtime/model integration: `node .\tools\tests\npc-model-gallery-runtime-guard.js`, then manual `/qa npcgallery` comparison against the Tutorial Island instructor row and `enemy_guard`. This brief itself requires no runtime test.
