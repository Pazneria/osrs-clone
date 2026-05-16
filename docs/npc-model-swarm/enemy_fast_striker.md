# Fast Striker (`enemy_fast_striker`)

## Current Read

- Existing preset: humanoid `buildGuideVariantPreset` named `Fast Striker` / `camp_fast_striker`, using a dark coat, muted tan shirt, brass trim, dark trousers and boots, a red diagonal sash, one main-hand dagger, and one off-hand blade.
- Combat identity: 1x1 aggressive melee camp threat with 12 HP, high attack for its tier, low defence, 4-tick melee pressure, 5-tile aggro, 7-tile chase, and loot biased toward iron melee tools. It should look dangerous because it is quick and relentless, not because it is armored.
- Current gallery risk: the model can read as a recolored guide with knives unless the body language becomes narrower, more forward, and more asymmetrical than the guard or heavy brute.

## Source Inspiration

- OSRS [Bandit](https://oldschool.runescape.wiki/w/Bandit): aggressive 1x1 outlaw, stab style, 4-tick attack speed, camp context. Borrow the "camp raider who starts trouble" read, not the exact outfit.
- OSRS [Rogue](https://oldschool.runescape.wiki/w/Rogue): human thief enemy with stab pressure and dagger-adjacent drops. Useful for short-blade vocabulary and opportunistic, under-armored gear.
- OSRS [Highwayman](https://oldschool.runescape.wiki/w/Highwayman): low-level aggressive robber with black cape/mask cues. Use this only as a hint for mask, scarf, or cloak language; avoid copying the highwayman silhouette wholesale.
- OSRS [Iron dagger](https://oldschool.runescape.wiki/w/Iron_dagger) and [Iron sword](https://oldschool.runescape.wiki/w/Iron_sword): keep the weapon read in the early iron tier, with simple stab/slash silhouettes and no ornate fantasy blade.
- OpenGameArt [Low Poly RPG Pack](https://opengameart.org/content/low-poly-rpg-pack) and [Low poly medieval weapons](https://opengameart.org/node/66801): useful reference for very simple CC0 low-poly medieval dagger/sword construction, especially readable wedge blades and restrained palette use.

## Silhouette Goals

- Slimmest human combat enemy in the current enemy set: visibly lighter than `enemy_guard`, much less square than `enemy_heavy_brute`, and more adult/human than `enemy_goblin_grunt`.
- First read at gallery distance should be: diagonal red sash, two short blades, hunched forward shoulders, no shield, no helmet, no heavy armor.
- Give the pose a slash from high-right to low-left: torso slightly compressed forward, one weapon low and ready, the other lifted off the side of the body.
- Push asymmetry. One shoulder should feel higher, one blade should project farther forward, and the sash tail should break the torso rectangle.
- Keep the silhouette narrow at the legs with quick, planted boots. Avoid a wide heroic stance; this is a striker circling the camp edge.

## Color And Materials

- Preserve the current dark raider palette as the base: charcoal coat `#3f3a31`, muted shirt `#6b5334`, brass trim `#b38b4a`, dark green-black trousers `#2e332f`, deep boots `#211a15`, and brown-black hair `#292018`.
- The red sash `#8b2f2b` should be the only saturated identity color. It is the model's camp-threat marker and should remain visible from the gallery camera.
- Add material separation with small, chunky blocks: matte cloth for coat/trousers, dark leather for belt/gloves/wrist wraps, dull iron for blades, and one or two brass/ochre trim pixels at buckle or scabbard points.
- Blade colors should stay early-iron, not heroic silver: main blade around `#b9bec0`, shaded edge around `#7f878a`, and grip/wrap around `#4a3020`.
- Optional mask/scarf should be near-black cloth, not pure black. Keep it low on the face or around the neck so the head still reads clearly against dark hair.

## Geometry And Animation Ideas

- Add 6-9 focused fragments, not a full rebuild: sash tail, belt knife/scabbard, wrist wraps, narrow mask or brow shadow, boot cuffs, and sharper blade tips.
- Main-hand blade can remain on the current weapon/`axe` attachment path, but it should be angled like a thrusting knife or short sword, not a hatchet.
- Off-hand blade should stay tied to `leftLowerArm` so the gallery and later attack animation can sell a quick second strike.
- Consider a small back scabbard or hip scabbard only if it improves silhouette; do not add a backpack or loot bundle that makes the enemy look like a scavenger NPC.
- Idle animation target: light foot shuffle, shoulders forward, wrists twitching, head tracking the player.
- Attack animation target: two-beat lunge, first a short jab from the main hand, then a fast off-hand slash. The motion should cover less distance than a guard swing but return faster.
- Hit reaction: quick recoil and re-center, not a heavy stagger. Death can be a small spin or forward collapse to preserve the speed identity.

## Gallery Scale And Framing

- Keep floor contact and head height aligned with other humanoids, but reduce perceived width through pose and fragment placement rather than shrinking the whole model too much.
- Target gallery read: same vertical class as guide/guard, 10-15% narrower visual mass than guard, and clearly smaller/heavier contrast when placed beside heavy brute.
- Frame at a slight three-quarter angle so both blades and the red sash are visible. Pure front view risks hiding the off-hand blade against the torso.
- Ensure the red sash remains visible at thumbnail size. If the sash is lost, increase its front offset or add a short trailing tail instead of saturating the whole outfit.
- Do not let weapon extents clip the gallery bounding box. The blades should break the body silhouette, but stay inside the standard humanoid preview frame.

## Concrete Implementation Guidance

- Later runtime integration should stay in `src/js/content/npc-appearance-catalog.js` within `buildEnemyFastStrikerPreset()` unless the gallery rework introduces a dedicated model authoring layer first.
- Keep the existing `buildGuideVariantPreset()` base for now; treat the improvement as a tuned variant, not a new rig family.
- Use `striker_*` role names for new fragments so future gallery tests and visual diffs can identify the model-specific pieces.
- Good first-pass fragments:
  - `striker_sash_tail`: red cloth block behind or below the current sash.
  - `striker_mask_wrap`: dark cloth strip across lower face or neck.
  - `striker_left_wrist_wrap` / `striker_right_wrist_wrap`: leather wrap blocks near hands.
  - `striker_main_blade_tip`: smaller iron wedge at the end of the existing main blade.
  - `striker_offhand_grip`: leather grip block paired with the current off-hand blade.
  - `striker_hip_scabbard`: short dark leather diagonal at belt, only if the torso still reads too plain.
- Avoid changing combat stats, spawn behavior, loot, or gallery runtime plumbing during model integration. This brief is visual direction only.
- After later integration, compare in the NPC gallery against `enemy_guard`, `enemy_heavy_brute`, and `enemy_goblin_grunt`; the Fast Striker should win on motion-read and asymmetry, not on bulk.
