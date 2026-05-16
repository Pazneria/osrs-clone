# enemy_training_dummy - Training Dummy Model Brief

Owned model: `enemy_training_dummy`  
Brief scope: NPC gallery/model direction only. Do not treat this file as runtime wiring.

## Current Read

- Live combat content already treats `enemy_training_dummy` as a rooted, passive tutorial enemy: `250` HP, `0` defence, `enemyMaxHit: 0`, no drops, no roaming, no aggro, and `modelPresetId: "enemy_training_dummy"`.
- Rendering currently routes through the humanoid enemy preset path, not a bespoke prop renderer. `buildEnemyTrainingDummyPreset()` is a `buildGuideVariantPreset()` recolor called `yard_training_dummy`, with a tan/red target on the torso, straw wrap, and diagonal wooden crossbar arm fragments.
- There is also a decorative `training_dummy` prop in Tutorial Island structure rendering. It has a stronger post-and-straw-object read than the enemy preset, including central post, crossbeam, blocky straw body/head, red paint, and a stable prop hitbox. Treat it as internal visual inspiration, not the enemy implementation owner.
- Current visual risk: the enemy still inherits too much humanoid guide language. It reads as a wooden person wearing a target instead of a beat-up combat-yard object that happens to occupy an enemy slot.

## Gameplay And Tutorial Role

- This is the safe first contact for combat systems: a player should understand "I can attack this, it will teach feedback, and it will not meaningfully threaten me" before reading any UI.
- It should feel more like an opt-in training apparatus than wildlife or a hostile NPC. The silhouette can be enemy-selectable, but the mood should be neutral, stationary, and faintly comic.
- Because dummy attacks always provide feedback while dealing zero damage, animation should sell response and timing more than intent: it absorbs hits, wobbles, faces the player, and maybe "answers" with a harmless creak.
- Loot-read should be none. Do not add coin pouches, weapon drops, trophies, or monster gore cues.

## Source Inspiration

- OSRS Combat dummy: player-owned-house training furniture, built in the combat room, attacked after attaching the sandbag, always gives max-hit testing feedback, and grants no combat experience. Source: https://oldschool.runescape.wiki/w/Combat_dummy
- OSRS Combat dummy built image: useful proportion reference for a tall hanging sandbag/target on a simple construction frame; use as mood/proportion reference only, not as a copied mesh. Source: https://oldschool.runescape.wiki/w/File:Combat_dummy_built.png
- OSRS Undead combat dummy: confirms the dummy family can support upgrades while remaining a built training object, but this starter enemy should stay plain, non-undead, and non-ornate. Source: https://oldschool.runescape.wiki/w/Undead_combat_dummy
- Archery target history: medieval practice targets included earthen butts, while portable coiled-straw circle targets are later but visually useful for straw rings and bullseye language. Source: https://archeryhistorian.com/archery-targets/
- Contemporary straw target construction: compressed-straw targets are thick, heavy, round or strip-built objects; good reference for layered straw thickness instead of a flat paper disk. Source: https://www.archerywebshop.com/targets-1/range-targets/straw-targets.html
- Low-poly style guidance: prioritize surface economy, consistent resolution, and silhouette over fidelity. Source: https://media.gdcvault.com/gdc2017/Presentations/Redd_Low_poly_style.pdf
- Low-poly straw/target prop examples for broad visual grammar only: compact target forms can work with a few hundred to low-thousand triangles if rings, post, and straw mass are decisive. Sources: https://sketchfab.com/3d-models/medieval-archery-target-92434c64cb3d40568c85d9e71289810c and https://sketchfab.com/3d-models/boneco-palha-straw-dummy-da9216fec64e4dedb822bf43743593e5

## Silhouette Goals

- First read at thumbnail scale: vertical post, stuffed straw torso/head, red/tan target face, and crossbar arms. If the player cannot identify the target disk before seeing the nameplate, the model failed.
- Break the humanoid template. The body should be a strapped training object with object-like construction: central spine/post, wrapped straw bundle, lashed crossbar, squat base/footing, and only the faintest dummy "head."
- Keep it about human height but not human posture: 90-100% of a guide/guard height, narrower at the legs/base, wider through the shoulder crossbar, with a top-heavy straw target mass.
- The crossbar should make a clear T or lazy-X shape from front three-quarter view. Avoid full arms, hands, sleeves, ears, hair, or boots unless they are obviously wooden/straw substitutes.
- Target rings should sit high on the chest/front face, thick enough to survive the `148px` gallery thumbnail. Prefer broad concentric chunks over thin painted lines.
- Add asymmetry through damage, not anatomy: one chipped target edge, a sagging wrap band, slightly crooked head block, and uneven straw tufts.

## Color And Material Notes

- Anchor palette: dry straw `#c6a05d`, pale worn target cloth/straw `#efe0aa`, red paint `#b85b35`, dark wood `#7a4f2a`, boot/base-dark wood `#4d321d`, and deep groove/shadow `#4a2f1d`.
- Push material separation harder than the current preset: straw should be warm yellow-tan, structural wood should be darker and less saturated, target paint should be dull red-orange, and lashings should be rope brown.
- Use flat Lambert-style material blocks, not noisy texture detail. Straw can be communicated with offset bands, small blocky tufts, and alternating tan planes.
- Red paint should feel worn and old-school, not clean bullseye signage. A few missing chunks or broken ring segments are better than a perfect modern target graphic.
- Keep all values readable against grass, dirt, fences, and pale Tutorial Island sand. The dummy should never merge into brown terrain as one vertical stick.

## Geometry And Pose Ideas

- Best next pass: replace the guide-variant humanoid illusion with a dummy-specific preset while keeping the same catalog ID and humanoid enemy routing if that is the least disruptive integration path.
- Suggested fragments:
  - `dummy_center_post`: dark vertical cylinder or box spine from base through head.
  - `dummy_base_foot`: low X-foot or plank base so rooted movement is visually justified.
  - `dummy_straw_torso_bundle`: chunky rectangular/rounded straw bale, wider than current wrap and slightly bulging forward.
  - `dummy_straw_head_bundle`: small squared bundle on top, tied to the post, not a face.
  - `dummy_crossbar_left/right`: one continuous dark wooden beam or two matched slabs, lashed through the torso.
  - `dummy_target_outer/ring/core`: three thick stepped disks or square-ish low-poly plates on the front.
  - `dummy_rope_lashing_*`: two or three dark rope bands around torso/head/crossbar.
  - `dummy_straw_tuft_*`: tiny rectangular splinters at shoulders, bottom hem, and hit side.
- If disks are awkward in the preset helper, fake them with stacked thin boxes in octagonal/cross shapes. The read matters more than true circles.
- Pose should lean one or two degrees off vertical with the target face angled slightly toward the gallery camera. It should feel hammered into the ground, not standing under its own power.
- Avoid detailed facial features. A tiny dark slit can imply a worn seam, but eyes and mouth make it too character-like.

## Animation Ideas

- Keep movement suppressed. There should be no walk personality; rooted behavior is the whole joke and tutorial clarity.
- Idle: tiny rope-and-straw sway, crossbar creak, target face settling back to center. Low amplitude, slow, and visibly anchored at the base.
- Facing: when it turns toward the player, rotate as a rigid post/preset rather than twisting hips and shoulders like a person.
- Attack/feedback: because it deals zero damage, make the "attack" a harmless spring-back wobble or short forward clonk. Contact timing can be readable without implying real menace.
- Hit: strongest animation priority. Snap target/back-post away from impact, overshoot once, then settle. Let straw tufts and crossbar lag by a frame if the rig supports fragment offsets.
- Death/despawn: if ever animated, slump or rotate down slightly like a training prop knocked loose. No creature collapse.

## Gallery Scale And Framing

- The gallery thumbnail is `THUMB_SIZE = 148`; validate the target rings, crossbar, and base at that size.
- Frame in front three-quarter view with the target disk fully visible and the crossbar not clipped. A pure side view turns the target into a thin plank; a pure front view hides depth and base construction.
- Bounding volume should be honest: no invisible hitbox or far-flung straw splinter should shrink the visual fit. Keep decorative tufts inside the main silhouette envelope.
- In lineup, it should sit between `enemy_chicken`/`enemy_rat` and real humanoids in threat, not in height. It can be tall, but its object posture and base must make it feel harmless.
- Health bar/nameplate offset should remain compatible with a roughly humanoid height unless the new head/target rises above the current guide preset.

## Concrete Integration Guidance

- Keep stable IDs: `enemy_training_dummy`, display name `Training Dummy`, and `appearance.modelPresetId: "enemy_training_dummy"`.
- First implementation owner is `src/js/content/npc-appearance-catalog.js`, specifically `buildEnemyTrainingDummyPreset()`. Prefer a local dummy-specific builder or heavily overridden guide variant before changing combat runtime.
- Do not edit generated assets as source. This model is catalog/primitive-driven today, while the decorative Tutorial Island prop lives in `src/js/world/structure-render-runtime.js`.
- If staying on the humanoid preset path, hide humanoid tells through fragment overrides: remove/neutralize ears, hair, boots, hands, and facial reads; replace them with post, straw, lashings, target rings, and base pieces.
- If central integration later adds a bespoke non-humanoid enemy renderer, keep behavior/content unchanged and make the renderer selected by either `modelPresetId: "enemy_training_dummy"` or a deliberate `appearance.kind` migration covered by tests.
- Suggested first implementation pass:
  1. Convert the visual from guide recolor to post/straw/target construction while preserving the preset ID.
  2. Strengthen target rings and central post in gallery view.
  3. Add rooted base and rope lashings.
  4. Remove humanoid face/ear/hand/boot cues.
  5. Tune idle/hit wobble only after the static silhouette reads correctly.
- Suggested checks for a later runtime/model pass: `node .\tools\tests\npc-model-gallery-runtime-guard.js`, `node .\tools\tests\combat-enemy-content-guard.js`, and `npm.cmd run test:combat:training-dummy`, followed by manual `/qa npcgallery` thumbnail inspection.
