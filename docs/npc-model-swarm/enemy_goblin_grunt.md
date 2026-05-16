# enemy_goblin_grunt - Goblin Grunt Model Brief

Owned model: `enemy_goblin_grunt`  
Brief scope: NPC gallery/model direction only. Do not treat this file as runtime wiring.

## Current Read

- The live repo already has `enemy_goblin_grunt` as a catalog-backed humanoid preset, not a placeholder. It uses `buildEnemyGoblinGruntPreset()` in `src/js/content/npc-appearance-catalog.js`, with green skin, long ears, dark brow slabs, brown clothing, rope belt, and a crude club.
- Combat role is "basic early aggressive melee enemy": 1x1, aggressive, short chase, low stats, with `goblin_basic` idle/walk/attack/hit clips and loot that introduces the goblin club plus bronze tool/weapon drops.
- Current visual risk: it can still read as a recolored guide humanoid wearing goblin details. The next model pass should make the body language do more work: squat, hunched, restless, and obviously hostile before the player reads the club.

## Source Inspiration

- OSRS goblins are common, low-level starter monsters, especially around Lumbridge, with the canonical examine flavor of "An ugly green creature." Source: https://oldschool.runescape.wiki/w/Goblin
- Goblin mail supports the small, rough, humanoid-armour read: brown armour made for goblins, too small for humans, with multiple dyed variants in the classic quest language. Source: https://oldschool.runescape.wiki/w/Goblin_mail
- Low-poly handling should favor surface economy, consistent resolution, and strong silhouette over fidelity. Source: https://media.gdcvault.com/gdc2017/Presentations/Redd_Low_poly_style.pdf
- Broad low-poly fantasy goblin silhouette reference only, not a mesh or texture source to copy: compact body, oversized head/ears, and simple readable forms. Source: https://sketchfab.com/3d-models/low-poly-goblin-ac865f8b482f4dd584494e21a988d118

## Silhouette Goals

- Make the goblin shorter than player-height humanoids, roughly 85-92% of the guide/guard height, with the missing height coming from bent knees, hunched shoulders, and a low head carriage rather than a uniformly scaled body.
- Front read should be a squat triangle: wide ears and shoulders, narrow hips, bowed legs, oversized head, and low club. From thumbnail distance, the first three reads should be green head, long ears, club.
- Ears should be the signature break from the humanoid template: longer, flatter, and slightly drooped or swept back, with enough sideways span to be visible in a 3/4 gallery view. Keep them chunky boxes, not thin needles.
- Face should be mean but simple: dark brow blocks, forward mouth/jaw slab, tiny dark eyes buried under the brow. Avoid detailed teeth unless they stay legible as two or three blocky chips.
- Club silhouette should sit on a low diagonal across the body or hang ready at one side. It needs a blunt head large enough to read at 148 px gallery thumbnail size.

## Color And Material Notes

- Keep the current skin family as the anchor: mid olive `#6fa74d`, dark moss `#395628`, with optional shadow/highlight steps around `#527a3a` and `#8abc63` for ears, brow, hands, and cheek planes.
- Clothing should stay in rough brown goblin-mail territory: current `#6b4429`, `#7a4c2d`, `#9a7348`, `#5f533b`, and `#352a1f` are good. Push material through large face-color blocks, not texture noise.
- Rope belt `#c29a58` is a useful warm read; keep it broad enough to separate torso from legs.
- Club should feel like scavenged timber: handle `#6b4729`, head `#4a3424`, with one lighter worn edge if needed. Avoid bronze or polished metal cues so the goblin does not visually compete with the bronze-drop ladder.
- Palette contrast target: green skin should separate clearly from brown tunic at a glance; boots and club can be dark, but do not let the whole lower half merge into one brown mass.

## Geometry Ideas

- Best future direction is a goblin-specific humanoid variant, still box-fragment friendly, rather than only adding accessories to the guide preset.
- Proportion changes: larger head, shorter neck, shorter upper legs, wider feet, slightly forward torso, and thicker forearms/hands. Keep the rig compatible with `player_humanoid_v1` unless animation work deliberately changes that contract.
- Add or refine fragment roles:
  - `goblin_left_long_ear` and `goblin_right_long_ear`: longer, wider, swept back/down with tiny asymmetry.
  - `goblin_brow_left` and `goblin_brow_right`: dark slabs protruding forward enough to shadow the eyes.
  - `goblin_jaw` or `goblin_mouth_slab`: low front block in dark brown/green to avoid a flat guide face.
  - `goblin_rope_belt`: broad, slightly forward belt band.
  - `goblin_club_handle` and `goblin_club_head`: off-center chunky club, not a clean mace.
- If only fragment-level changes are affordable, fake the hunch by moving/rotating head and shoulder fragments forward, enlarging ears and brow, and lowering the club. If base-pose editing is available, solve it there instead.

## Animation Ideas

- Preserve the existing `goblin_basic` clip set unless the animation pass is explicitly in scope.
- Idle: current breathing/yaw behavior is good. Push it into a suspicious crouch: torso pitched forward, head counter-tilted up, small side-to-side breathing, club hand loose but ready.
- Walk: keep the short 560 ms loop, but make it feel like a quick shuffle. Slightly wider leg swing, small root bob, head forward, club lagging half a beat behind the torso.
- Attack: current windup/slash/contact structure is right. Make the club attack a compact overhand or side chop with a visible windup around 120 ms, contact around 420 ms, then an ugly overcommitted recover.
- Hit: keep the fast recoil. Exaggerate head snap and shoulder collapse, but keep feet planted so the small enemy does not look weightless.

## Gallery Scale And Framing

- The gallery thumbnail must read at `THUMB_SIZE = 148`. Validate the model in the NPC gallery, not only in a close editor view.
- Frame with ears and club fully visible; no ear tips clipped at neutral. Leave a small top margin because idle/head bob can raise the ear span.
- In lineup, it should be visibly shorter than `enemy_guard`, broader and more humanoid than `enemy_rat`/`enemy_chicken`, and less massive than `enemy_heavy_brute`.
- Prefer a 3/4 front pose where the brow ridge, both ears, and club head all remain visible. A pure side view loses the face; a pure front view can flatten the club.

## Concrete Integration Guidance

- Keep IDs stable: `enemy_goblin_grunt`, `modelPresetId: "enemy_goblin_grunt"`, and `animationSetId: "goblin_basic"` unless a deliberate animation migration owns that change.
- Future code work should happen in `src/js/content/npc-appearance-catalog.js` for the preset, with any clip edits in `src/game/animation/clips/npc/goblin/*.json`. Do not edit generated assets as authored truth.
- If another goblin variant is likely soon, extract a small goblinoid base helper first. If this remains the only goblin, a local preset builder is acceptable, but keep the fragment role names clean enough to migrate later.
- Suggested first implementation pass:
  1. Add goblin-specific proportion overrides or a compact base pose.
  2. Enlarge and angle ears; deepen brow and mouth/jaw.
  3. Shorten legs visually and widen feet.
  4. Reposition the club to be readable in gallery thumbnail view.
  5. Tune palette contrast after the silhouette works.
- Suggested checks for a later runtime/model pass: `node .\tools\tests\npc-model-gallery-runtime-guard.js` and `node .\tools\tests\combat-enemy-content-guard.js`, plus manual gallery inspection at thumbnail scale.
