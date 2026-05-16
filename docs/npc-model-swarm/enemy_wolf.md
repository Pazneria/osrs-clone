# enemy_wolf - Wolf Model Brief

Owned model: `enemy_wolf`

Runtime role: early aggressive natural predator. The wolf should read as the first enemy that actively pressures a fresh player through speed, pursuit, and bite threat, while staying plain enough to belong beside OSRS-style low-level wildlife rather than boss creatures.

## Current Read

- Current runtime already has a bespoke wolf renderer in `src/js/combat-enemy-render-runtime.js`, selected by `appearance.kind === 'wolf'`.
- The model is procedural and cheap: faceted body, belly, chest, haunch, dark back line, box head, box muzzle, neck block, two tall ears, pale eyes, straight tail with tip, and four quadruped leg rigs.
- Current palette is good starter-wolf ground: fur `#6c645e`, dark fur `#4d4844`, belly `#93867d`, muzzle `#5a544f`, legs `#4c4743`, paws `#241f1c`, eyes `#ece7d5`.
- Current motion already says "fast quadruped": 132 ms gait phase, spine wave, head swing, tail swing, attack lunge, hit rebound, and light paw lift.
- Weakness to solve later: at gallery thumbnail size it can collapse into a generic gray dog or long gray block. The wolf needs stronger predator reads: long low head, narrow chest, dark saddle, bigger paws, straight bushy tail, and a small but unmistakable fang cue.

## Gameplay Role

- Authored content: 1x1 melee enemy, HP 10, attack 8, strength 7, defense 4, max hit 3, 4-tick attack cycle, aggressive, aggro radius 5, chase range 7.
- Practical fantasy: resource-outskirts pressure. It should look fast enough to make gathering near richer outskirts feel unsafe without looking like a high-level wilderness monster.
- Loot identity: `raw_wolf_meat` and `wolf_fang`. The model should visually justify both through a lean game animal body and visible bite hardware.
- Relative read: leaner, longer, and faster than boar; much lighter than bear; more feral than chicken/rat; less equipped and intelligent than humanoid enemies.

## Source Inspiration

- OSRS standard wolf: plain gray canine monster, multiple low and mid combat levels, 2x2 source-game size, "Not man's best friend" flavor, and 2007-era graphical update history. Use the old-school simplicity, not the exact proportions or size. Source: https://oldschool.runescape.wiki/w/Wolf
- OSRS white wolf: mountain predator variant with aggressive read and pale coat direction. Useful for belly/throat contrast, not for making this clone wolf snowy. Source: https://oldschool.runescape.wiki/w/White_wolf
- OSRS dire wolf: stronger wolf lane with big-teeth fairy-tale flavor. Use only as an upper bound for bite attitude; avoid 2x2 boss mass. Source: https://oldschool.runescape.wiki/w/Direwolf
- Real wolf anatomy: NPS notes longer legs, bigger feet, narrower chest than large dogs, and non-curled tail; it also calls out varied coats with darker back/forehead and paler lower body. These are the highest-value dog-vs-wolf cues. Source: https://www.nps.gov/noca/learn/nature/wolf-description-and-biology.htm
- Real predator proportions: Britannica emphasizes powerful jaws, large canine teeth, long body plus bushy tail, and gray/brown/black/white coat variation with lighter underparts. Source: https://www.britannica.com/animal/gray-wolf
- Low-poly construction: GDC low-poly style reference is useful for silhouette-first thinking and clean faceted reads. Source: https://media.gdcvault.com/gdc2017/Presentations/Redd_Low_poly_style.pdf
- Low-poly creature workflow: BlenderNation's low-poly creature note supports using animal reference, simplified mid-poly forms, simple rigging, and an expressive pose before polishing. Source: https://www.blendernation.com/2015/04/15/low-poly-creatures/
- Low-poly canine benchmark only: Sketchfab low-poly wolf examples are useful for checking how little geometry can still sell ears, muzzle, paws, and tail. Do not copy geometry, textures, or pose. Source: https://sketchfab.com/3d-models/low-poly-wolf-d8c1d7dc47cb40128826157775031dcc

## Silhouette Goals

- First read: lean predator, not pet dog. Long torso, narrow waist, slightly higher shoulder/chest mass, tucked belly, long legs, large paws, forward wedge head.
- Side view should draw one sharp line from ears to neck to dark back saddle to straight tail. Avoid a flat sausage body or a curled friendly tail.
- Front three-quarter view should show a narrow chest, visible paired forelegs, triangular ears, blunt long muzzle, pale eyes, and at least one fang shape.
- Tail should be straight or slightly lowered behind the body with a dark tip and enough thickness to read as bushy. Never curl it upward like a dog.
- Ears should be triangular and alert but not giant. Too tall reads fox; too round reads bear; too floppy reads dog.
- Muzzle should be longer and more forceful than the boar snout but cleaner and narrower. Add a dark nose cap and one or two aged-bone fangs if geometry budget allows.
- Paws should be oversized enough to separate wolf from dog at thumbnail scale, with dark pads/claws implied by small black-brown blocks or cones.

## Color And Material Notes

- Keep matte Lambert materials and faceted primitives. No fur cards, no noisy texture, no glossy wet nose pass unless the whole enemy family gets that treatment.
- Recommended palette direction:
  - main fur: `#67635e` to `#716a63`
  - dark saddle/back/ear/tail tip: `#3f3b38` to `#4d4844`
  - throat/belly/inner leg planes: `#8c8279` to `#a0968c`
  - muzzle: `#58514c`
  - nose/paws/claws shadow: `#211d1a`
  - fang/claw accent: `#d8ccb5`, muted and tiny
  - eyes: consider `#e5d79b` or keep current ivory, but make them very small so it does not read undead
- Value contrast matters more than hue. The dark saddle, pale underbody, and dark paws should survive small thumbnails.
- Avoid saturated blue-gray, pure black, or snow-white. This is a common field/forest predator, not a spirit wolf or mountain-only variant.

## Geometry And Pose Ideas

- Preserve the procedural primitive language. Build from boxes, low-segment spheres/cylinders, cones, and the existing quadruped leg rig.
- Body: keep the long core, but make the read more canine by narrowing width slightly, lifting shoulder/chest a touch, and pulling the belly line upward behind the rib cage.
- Chest and haunch: chest should feel forward and ready to spring; haunch should be compact and darker, not bear-heavy.
- Back saddle: current `backLine` is a good anchor. Later, make it wider/longer as a dark faceted ridge or saddle plane so the top silhouette is intentional.
- Head stack: skull wedge, brow plane, long muzzle block, dark nose cap, tiny fang cones. The brow should cast attitude without becoming a snarl mask.
- Legs: lengthen the visual read through slim upper/lower cylinders and slightly larger paws. Keep feet close under the narrow chest so the track reads wolf-like.
- Tail: replace the needle read with a low-poly tapered tail made from 2 to 3 segments, thicker at root and dark at tip.
- Default pose: alert prowl. Head slightly forward and low, shoulders leading, tail held straight back/down, ears pricked, legs staggered enough to imply motion.

## Animation Ideas

- Idle: subtle shoulder breathing, small nose dip, ear twitch, tail counter-sway. The idle should look like scenting and listening, not panting like a friendly dog.
- Walk/run: quick diagonal trot with visible shoulder roll. Head should stabilize forward while legs move fast, selling efficient pursuit.
- Attack: short predatory snap. Drive head and chest forward, drop muzzle slightly, flash fangs, then recoil fast. Avoid a full-body leap that implies a larger creature.
- Hit reaction: ears pin back, tail drops, head jerks away, torso compresses, then the wolf regains its stance quickly.
- Death if added later: front legs buckle, head drops first, tail slackens. Keep it short and OSRS-paced.

## Gallery Scale And Framing

- Frame as a 1x1 enemy that feels horizontally long but not huge. It should fill more width than rat/chicken, similar width to boar, and far less mass than bear.
- Best gallery angle: front-left three-quarter, slightly above shoulder height, showing muzzle length, one pale eye, both ears, the dark back saddle, and tail line.
- Keep all four legs readable, or at minimum both front legs plus one rear leg. A wolf without legs becomes a gray plank at card size.
- Do not over-zoom to the face. The identity comes from the full predator silhouette: head, shoulders, tucked belly, legs, tail.
- Thumbnail acceptance: before reading the label, it should be "wolf" first, then "fast early threat," not dog, fox, coyote, boar, or bear.

## Concrete Integration Guidance

- Future implementation target, when runtime edits are allowed: `src/js/combat-enemy-render-runtime.js`, specifically `createWolfRenderer` and `updateWolfRenderer`.
- Preserve content contract: `enemy_wolf` should continue to use `appearance: { kind: "wolf", facingYaw: Math.PI }`; renderer should continue returning `kind: 'wolf'`.
- Preserve gameplay footprint: do not change the 1x1 selection behavior or make visuals exceed the current hitbox family unless combat targeting is intentionally revisited.
- Keep existing material keys stable where possible. If adding parts, prefer explicit keys such as `wolf:saddle`, `wolf:nose`, `wolf:fang`, and `wolf:claw`.
- Priority order for a later art pass: stronger head/muzzle/nose shape, thicker straight tail with dark tip, darker saddle, larger paws, tiny fangs/claws, then leg proportion tweaks.
- Use no imported mesh and no external texture dependency. External sources are proportion and style references only.
- Validate in the NPC model gallery at thumbnail size and in the combat field at normal camera distance. Acceptance criterion: the wolf reads as a bespoke fast predator before the name badge helps.

## Do Not Do

- Do not copy OSRS cache geometry, Sketchfab geometry, textures, or exact poses.
- Do not make it cute, collared, fluffy, dog-like, fox-like, or snow-white.
- Do not make it a dire wolf, hellhound, werewolf, or boss creature.
- Do not add armor, scars, glowing eyes, spikes, or magical markings.
- Do not edit runtime implementation as part of this brief pass.
