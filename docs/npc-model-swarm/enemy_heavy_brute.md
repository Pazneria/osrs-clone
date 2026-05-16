# enemy_heavy_brute Model Brief

Owned model: Heavy Brute (`enemy_heavy_brute`)

Scope: NPC gallery/model direction only. Do not edit runtime code, combat stats, loot, spawn placement, or generated assets from this brief.

## Current Read

- Live preset: `buildEnemyHeavyBrutePreset()` in `src/js/content/npc-appearance-catalog.js`.
- Current construction path calls `buildSmithVariantPreset('Heavy Brute', 'camp_heavy_brute', ...)`, then adds two shoulder pads and a right-hand maul on the existing `axe` attachment.
- Current palette is grounded and useful: apron `#3e342d`, shirt `#653628`, leather `#3d2a20`, trouser `#302d28`, boot `#241c16`, metal `#8e8a82`, ore `#6d5140`, shoulder pads `#5b4a3e`, maul handle `#5a3924`, maul head `#77736b`.
- The model already reads as a rough laborer with a blunt weapon. That is the right lane, but it risks reading as "angry smith" rather than a distinct camp bruiser unless the silhouette gets broader, lower, and meaner.
- The maul is the strongest existing identity cue. It needs to feel like the reason the enemy has a 6-tick punish window and max hit 5.

## Gameplay Role

- Role: slow, durable, high-damage melee camp threat.
- Combat shape: 1x1 aggressive humanoid, 22 HP, 10 Attack, 12 Strength, 12 Defence, +4 melee accuracy, +6 melee defence, max hit 5, 6-tick melee cycle, 4-tile aggro, 6-tile chase, tiny roaming radius.
- Encounter read: the Heavy Brute should be the camp anchor. The Fast Striker pressures, the Bear occupies space, and the Brute makes standing still feel expensive.
- Visual promise: fewer swings than a guard or striker, but each swing should look like it could flatten an under-geared player.
- It should look materially poorer and rougher than `enemy_guard`, heavier and more adult-human than `enemy_goblin_grunt`, and less agile than `enemy_fast_striker`.

## Source Inspiration

- OSRS [Hill Giant](https://oldschool.runescape.wiki/w/Hill_Giant): borrow the primitive large-humanoid read: simple body planes, heavy hands, thick feet, and a blunt "do not trade hits" silhouette. Do not copy the giant scale or bare green giant identity.
- OSRS [Bandit](https://oldschool.runescape.wiki/w/Bandit): useful for the aggressive camp-outlaw context. The Brute is the camp's muscle, not a civic soldier.
- OSRS [Barbarian](https://oldschool.runescape.wiki/w/Barbarian): supports a tough human fighter in simple clothes rather than polished armor. Use the grounded brawler read, not exact clothing.
- OSRS [Iron warhammer](https://oldschool.runescape.wiki/w/Iron_warhammer): early crush-weapon vocabulary that fits the iron loot ladder and the 6-tick heavy attack cadence.
- OSRS [Hill giant club](https://oldschool.runescape.wiki/w/Hill_giant_club) and [Granite maul](https://oldschool.runescape.wiki/w/Granite_maul): references for chunky two-handed blunt silhouettes. Use proportions only; avoid high-tier ornamentation or boss-item glamour.
- OpenGameArt [LowPoly Medieval Weapons](https://opengameart.org/content/lowpoly-medieval-weapons) and [Low Poly RPG Pack](https://opengameart.org/content/low-poly-rpg-pack): useful for simple wedge handles, blocky hammer heads, and low-material medieval props. Treat as shape vocabulary, not assets to import.
- GDC [Low Poly: Style](https://media.gdcvault.com/gdc2017/Presentations/Redd_Low_poly_style.pdf): good validation principle for this model: silhouette and major light planes matter more than small surface detail.

## Silhouette Goals

- First read at gallery distance: massive shoulders, dark apron block, blunt maul, thick boots, heavy brow.
- Keep it humanoid and 1x1, but make it the widest human enemy in the current combat lineup. Target 8-12% more visual width than `enemy_guard` without making the bounds so wide that the gallery thumbnail shrinks.
- Build a squat trapezoid: near-no neck, broad shoulders, barrel torso, belt/apron mass, shorter-looking legs, and heavy feet planted apart.
- No shield, cape, helmet, or clean tabard. Those belong to the guard. The Brute should read as camp muscle with scavenged leather and dull metal.
- The maul should break the body silhouette on a diagonal. Preferred read: handle runs low-left to high-right, head visible beside or just above one shoulder, never hidden inside the torso rectangle.
- Push asymmetry lightly: one shoulder pad chipped/larger, one wrist wrapped, maul head offset, belt buckle off-center. Keep the body broad, not elegant.
- Face read should be simple and mean: low brow slab, broad nose, square jaw/chin shadow. Avoid detailed scars or tiny teeth unless they remain legible at thumbnail size.

## Color And Material Notes

- Preserve the current dark forge/camp palette. It is already distinct from the guard's civic blues and steel.
- Dominant masses: charcoal apron and dark trousers. Secondary read: dull red-brown shirt. Accent read: worn leather pads and straps. Weapon read: desaturated iron/stone head with warm wood handle.
- Keep metal dull: `#77736b`, `#8e8a82`, and one darker edge step are enough. Do not add bright heroic silver except for a tiny worn corner on the maul.
- Use color blocks as materials, not texture noise. One apron front, one belt, one shoulder-pad pair, one maul head face, one handle.
- Skin should not become the main read. If adding exposed arms/neck/face detail, keep it subordinate to the apron, pads, and maul.
- Avoid saturated reds, skull motifs, spikes, glowing eyes, or boss-bandit ornamentation. The enemy is dangerous because of mass and weapon, not magic or rank.

## Geometry And Pose/Animation Ideas

- Lowest-risk future pass: keep `buildSmithVariantPreset()` and make the Brute additive, with targeted `brute_*` fragments rather than a new rig family.
- Highest-value fragments:
  - `brute_barrel_apron_front`: larger, darker apron plane that widens the torso.
  - `brute_leather_belt` and `brute_offcenter_buckle`: separates torso from legs and sells weight.
  - `brute_neck_roll` or `brute_trap_shadow`: reduces the visible neck and makes shoulders feel hunched.
  - `brute_heavy_brow` and `brute_broken_nose`: gives the face a hostile read without tiny detail.
  - `brute_left_wrist_wrap` / `brute_right_wrist_wrap`: brawler hands without armor.
  - `brute_left_hand_maul_grip`: fake a two-handed hold by putting the left hand near the handle.
  - `brute_maul_head_front_face`, `brute_maul_head_side_band`, `brute_maul_end_cap`: make the existing maul read larger and flatter from the gallery camera.
- Keep additions around 10-18 boxes. Anything smaller than `0.04` units should be questioned unless it changes the thumbnail read.
- If scale overrides are safe in the later integration pass, try a subtle brute-only scale around `[1.06, 1.02, 1.06]`; prefer width/mass over height.
- Idle target: slow breathing, head slightly low, shoulders forward, maul barely moving as a weight.
- Walk target: short heavy steps, minimal bounce, maul lagging behind the torso. It should never look like the Fast Striker's nimble chase.
- Attack target: slow overhand or diagonal maul swing with a visible windup, late contact, and heavy recovery. Contact should feel around the back half of the 6-tick cycle.
- Hit target: small recoil through shoulders and jaw, feet planted. A large hop-back would make the model feel light.
- Death target, if later authored: knees buckle, torso folds forward, maul drops first or drags down one side.

## Gallery Scale And Framing Notes

- The NPC gallery is the primary validation surface. Thumbnail read matters more than close-up detail.
- Best neutral angle: front three-quarter, with both shoulder pads visible and the maul head clear of the face.
- Read order at 96-148 px should be: maul head, shoulder mass, dark apron, heavy brow, boots.
- Keep the maul inside the standard humanoid frame. If the head rises too far above the skull or extends too wide, the whole model will shrink and lose its brute read.
- Do not solve mass by making the weapon enormous alone. Body mass must still win when the maul overlaps the torso.
- Lineup target: same general human height class as guard/striker, but visibly wider and heavier. It should not look like a giant, a boss, or an armored knight.
- Check it beside `enemy_guard`, `enemy_fast_striker`, and `enemy_bear`; the Brute should be the humanoid weight anchor, while Bear remains the natural quadruped mass anchor.

## Concrete Implementation Guidance For Central Integration

- Preserve IDs and content contracts: `enemy_heavy_brute`, label `Heavy Brute`, archetype `camp_heavy_brute`, and `modelPresetId: "enemy_heavy_brute"`.
- Later runtime work should stay centered in `src/js/content/npc-appearance-catalog.js` inside `buildEnemyHeavyBrutePreset()` unless the gallery rework introduces a new authored model layer first.
- Do not touch `src/game/combat/content.ts` for this visual pass. Combat stats, drop table, spawn behavior, assist group behavior, and respawn timing already define the gameplay role.
- Keep the existing smith-derived base unless multiple camp bruiser variants are planned. A local additive preset is cheaper and matches the current catalog style.
- Name all new fragments with a `brute_` prefix and material/role words that future visual diffs can understand: `brute_maul_*`, `brute_apron_*`, `brute_belt_*`, `brute_brow_*`, `brute_wrap_*`.
- Prefer box fragments, flat colors, and current rig attachments. Do not import meshes, textures, or generated OBJ assets for this NPC model.
- If the maul uses the existing `axe` attachment, retune handle/head fragments rather than introducing a new weapon mount in the first pass.
- If adding a fake two-handed grip, attach the visual hand/wrap to `leftLowerArm` and check it does not imply broken anatomy during idle/walk.
- Acceptance target: in the gallery, a viewer should identify "slow heavy camp bruiser with a maul" before reading the nameplate.
- Suggested later checks after runtime integration: `node .\tools\tests\npc-model-gallery-runtime-guard.js` and `node .\tools\tests\combat-enemy-content-guard.js`, plus manual NPC gallery comparison against Guard, Fast Striker, and Bear.
