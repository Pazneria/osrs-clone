# enemy_rat Model Brief

Owned model: `enemy_rat`

Scope: research and implementation direction for a bespoke OSRS-inspired low-poly rat enemy. This brief is for central integration planning only; it does not authorize runtime code edits.

## Current Read

- Gameplay content already treats Rat as a true passive starter pest: 1x1 melee, HP 4, attack/strength/defence 1, max hit 1, attack cycle 5 ticks, aggro radius 0, chase range 4, roaming radius 3, respawn 20 ticks, and a simple `rat_tail`/nothing drop table.
- Current runtime is already bespoke, selected by `appearance.kind: "rat"` and `facingYaw: Math.PI`, not a humanoid preset or placeholder.
- The live renderer builds a compact low-poly quadruped from primitives: dodecahedron body/chest/haunch/belly, dark back stripe, snout cone, nose, cheeks, ears, bead eyes, whisker bars, segmented tail, four quadruped leg rigs, and a hidden hitbox around `0.86 x 0.58 x 1.08`.
- Current palette is useful but slightly quiet: gray-brown fur, darker haunch/back, beige belly/snout, muted pink ears/tail/paws, dark nose/eyes, pale whiskers.
- Current animation hooks are good for the role: idle bob/sniff, spine wave, tail swing, walking gait, attack jab, and hit recoil. Future polish should sharpen the read, not replace the system.
- Gallery already classifies `enemy_rat` as a rebuilt bespoke enemy. Its health-bar offset is low (`0.66`), so the model must stay squat and readable without expanding invisible bounds.

## Gameplay Role

- Rat is the "I can click a thing and learn combat" enemy, weaker in attitude than boar/wolf/bear and less comic-domestic than chicken.
- It should feel like a pest the player chooses to swat, not a creature that hunts the player. Passive stance, nervous motion, low body, quick sniffing, and a tiny bite all support that.
- It needs to work in starter fields now, while also feeling plausible in OSRS-style sewers, dungeon edges, swamp paths, storage rooms, and town clutter later.
- Combat clarity beats realism: the player should see facing, contact timing, hit reaction, and death/loot identity at small scale.

## Source Inspiration

- OSRS Rat: level-1, 1x1, non-aggressive, tiny weak monster, associated with cities, sewers, dungeons, fast respawn, and "weakest monster" training flavor. Source: https://oldschool.runescape.wiki/w/Rat
- OSRS Giant rat: level 3/6/26 variants, 2x2 footprint, "Overgrown vermin.", common in swamps and sewers, weak low-level training monster, and Tutorial Island combat target. Use this for vermin attitude and sewer familiarity, but keep `enemy_rat` smaller and less aggressive. Source: https://oldschool.runescape.wiki/w/Giant_rat
- Real Norway/brown rat cues: gray-to-brown dense fur, lighter underside, bald nose/tail/ears, body-plus-tail length emphasis, and a tail slightly shorter than the body. Source: https://nationalzoo.si.edu/animals/norway-rat
- Low-poly rat benchmark: a 292-triangle OpenGameArt rat shows the model can stay very cheap if the side silhouette, tail, snout, and ears carry the identity. Source: https://opengameart.org/content/low-poly-rat
- Medieval adventure vermin reference: OpenGameArt Rat Pack explicitly frames three cartoon low-poly rats for medieval-like adventure games; useful for chunkier readable proportions and group readability, not for copying geometry. Source: https://opengameart.org/content/rat-pack
- Low-poly density benchmark: the Sketchfab low-poly rat lists 758 triangles and 409 vertices, a reasonable upper reference for a small enemy that still has snout, ear, tail, and leg separation. Source: https://sketchfab.com/3d-models/low-poly-rat-dd63402df69742e39e989801f282e58a
- Low-poly style rule: favor surface economy, resolution consistency, silhouette consciousness, and approximation over anatomical duplication. Source: https://media.gdcvault.com/gdc2017/Presentations/Redd_Low_poly_style.pdf

## Silhouette Goals

- First read: long low gray-brown body, pointed snout, bead eyes, round ears, thin bare tail. The silhouette should say "rat" before whiskers or color are noticed.
- Side view: wedge snout forward, shoulders lower than haunches, belly close to ground, rear haunch lump, tail trailing low then curling slightly upward.
- Top/down view: narrow tapered body with a visible head point and offset tail curve, so it does not collapse into a small oval beside grass, dirt, walls, or loot.
- Threat read: pest, not predator. Keep claws tiny, legs short, and posture skittish; avoid wolf-like tall legs, boar-like shoulder bulk, or bear-like paw mass.
- OSRS read: simple faceted masses with a slightly odd old-school charm. A little exaggeration is welcome: bigger ears, clearer nose, longer tail, and longer whiskers than realism demands.
- Swarm read: several rats in a cluster should produce alternating tail arcs and snout directions, not one muddy brown blob.

## Color And Material Notes

- Keep flat `MeshLambertMaterial`/flat-shaded primitive language. No fur cards, normal maps, texture dependency, or glossy wet sewer skin for v1.
- Preserve the current family palette direction:
  - fur: gray taupe around `#6f665d`
  - dark back/haunch: charcoal brown-gray around `#4f4942`
  - belly/snout: dirty beige around `#bca893`
  - ears/tail/paws: muted raw pink-brown around `#8e6f68` to `#b08a80`
  - eyes/nose: near black
  - whiskers: pale bone, used sparingly
- Push value contrast a little harder than hue contrast. The belly plane and tail should read under outdoor daylight, while dark back/haunch planes should read in sewer or dungeon lighting.
- Avoid saturated pink, cute pet-rat white, or pure black sewer-rat cliche. This is ordinary grimy OSRS vermin, not a mascot or boss variant.
- If future field placement makes the rat vanish on dirt, lighten the belly and tail rather than making the whole body bright.

## Geometry And Pose Ideas

- Keep the existing `createRatRenderer` primitive approach and quadruped leg rig. The target is polish through stronger proportions and named parts, not imported mesh complexity.
- Body: long faceted capsule made from 3 masses: narrow chest, larger mid-body, darker haunch. Keep the belly low enough that the rat feels close to the tile.
- Head: slightly larger wedge/snout read. The snout should project clearly past the cheeks; nose should be a tiny dark faceted cap at the tip.
- Ears: two small round/diamond cones tilted outward and back. They should be visible from front three-quarter without becoming mouse-like oversized circles.
- Whiskers: use 2 to 4 thin bars total, not a dense whisker fan. They are thumbnail accents and should not dominate the face.
- Tail: make it the identity stroke. Three low-segment cylinders/cones are enough, but the curve should be long, thin, pale, and readable from side and top.
- Feet: tiny paws with front/back separation. Keep them slightly pink-brown so the gait is readable, but do not add visible claws unless the model later needs contact clarity.
- Default pose: head low and forward, nose slightly down, haunches tucked, tail trailing. No upright meerkat pose, no aggressive arched back as the default.

## Animation Ideas

- Idle: nervous sniff cycle, small head darts, tiny body breathing, and asymmetrical ear/tail twitch. Avoid synchronized large bobbing across a spawn cluster.
- Walk: quick skitter with short step length, low body, head counter-bob, and tail lagging behind the body turn. Feet should not slide in gallery thumbnails.
- Attack: a tiny forward bite/jab from the snout, with body stretch and tail counter-swing. It should be readable but slightly pathetic.
- Hit: quick recoil backward/down, ears dip, tail snaps tighter, then settle. Keep the reaction short because this is a low-HP enemy.
- Death later, if added: collapse low onto one side or flatten forward, tail still visible. Do not make a large ragdoll or dramatic flip.

## Gallery Scale And Framing

- Rat must fill enough of the `148px` gallery thumbnail to read beside chicken and boar, without becoming visually larger than its starter-pest role.
- Best thumbnail angle is front three-quarter from slightly above: show snout, both ears, one eye, side belly, four-leg stance, and the tail curve behind.
- Keep visible bounds honest. Do not let a long invisible hitbox or overextended tail force the gallery camera to zoom out until the body becomes a speck.
- Maintain the low health-bar family, near the current `0.66` offset unless the head/ear height changes materially.
- Acceptance test for framing: at thumbnail size, the viewer should identify "rat" from body/snout/tail before reading the label; at combat scale, it should still look like a passive nuisance rather than terrain clutter.

## Concrete Integration Guidance

- Future runtime target: `src/js/combat-enemy-render-runtime.js`, specifically `createRatRenderer` and `updateRatRenderer`.
- Preserve the public contract: `appearance.kind === "rat"` selects the renderer; `kind: "rat"` is returned by the renderer; `torsoGroup.name = "rat-torso"`, `headGroup.name = "rat-head"`, and `tailGroup.name = "rat-tail"` remain stable unless all dependent guards are updated intentionally.
- Keep gameplay data in `src/game/combat/content.ts` unchanged unless a separate combat-balancing task asks for it. Model polish should not change HP, aggro, drops, hitbox semantics, or spawn behavior.
- Keep material cache keys under the `rat:*` namespace and reuse the existing part roles: fur, dark fur, belly, ear, nose, eye, whisker, tail, paw.
- Spend geometry budget on silhouette: snout projection, haunch/body contrast, tail curve, ear placement, and paw spacing. Do not spend it on smooth fur, many whiskers, teeth, or tiny claws.
- If a central model pass adds gallery-specific diagnostics, include side/profile screenshots for Rat. It can pass front view while failing as an oval from side.
- Distinguish from neighboring bespoke enemies: chicken is pale and upright/cute, boar is chunky and tusked, wolf is lean and threatening, bear is heavy and broad. Rat is narrow, low, twitchy, and tail-led.
- Do not copy external model geometry or textures. Use the cited sources only for silhouette, palette, scale, and motion direction.
