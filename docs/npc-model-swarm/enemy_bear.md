# enemy_bear Model Brief

Owned model: Bear (`enemy_bear`)

Scope: concise model direction for the NPC gallery and later combat renderer tuning. This brief does not authorize runtime code edits.

## Current Read

- Content role: a sturdy natural melee threat with slow, heavy hits. The authored enemy is aggressive, 1 tile, HP 20, max hit 5, 6-tick melee, and belongs in early-to-mid wilderness-edge or forest-danger pacing.
- Current visual basis: `src/js/combat-enemy-render-runtime.js` already owns a dedicated `createBearRenderer` and `updateBearRenderer` path for `appearance.kind: "bear"`.
- Existing parts are promising: faceted body, shoulder hump, rump, belly, brow, muzzle, nose, round ears, tail nub, four quadruped leg rigs, and three visible claws per paw.
- Main read problem to solve later: from gallery distance, it can become a brown quadruped blob unless the shoulder hump, low rump, blunt muzzle, brow shelf, and oversized paws are exaggerated.

## Inspiration

- OSRS bear family: [OSRS Wiki Bear](https://oldschool.runescape.wiki/w/Bear) lists black, grizzly, angry, cub, corrupted, crystalline, and boss bear variants. For this enemy, stay in the ordinary ground-monster lane rather than boss ornamentation.
- Old-content read: [OSRS Wiki Black bear](https://oldschool.runescape.wiki/w/Black_bear) and [OSRS Wiki Grizzly bear](https://oldschool.runescape.wiki/w/Grizzly_bear) both preserve the idea of a plain OSRS-era bear with 2006 graphical-update lineage. That argues for simple shapes, clear color blocks, and no modern fur simulation.
- Placement flavor: [OSRS Wiki Grizzly bear](https://oldschool.runescape.wiki/w/Grizzly_bear) includes Ardougne, Varrock sewer access, Isafdar, and Ferox/Wilderness placements, supporting an earthy "danger at the edge of settled space" palette.
- Real silhouette cue: [NPS bear identification](https://www.nps.gov/articles/bear-identification.htm) emphasizes the brown/grizzly shoulder hump, lower rump, dished face profile, short round ears, and long front claws. These are the highest-value shape cues for this model.
- Low-poly validation: [OpenGameArt Low Poly Bear](https://opengameart.org/content/low-poly-bear) and [Get3DModels Low Poly Bear](https://www.get3dmodels.com/animals/low-poly-bear/) both show that a faceted brown body plus lighter snout can sell "bear" without texture complexity. Use as proportion/style validation only; do not copy.
- Fantasy animation reference: [CGTrader Fantasy Bear](https://www.cgtrader.com/3d-models/animals/other/fantasy-bear) is useful only as a checklist of expected RPG creature beats: idle, walk/run, hit, attack, roar, death. Our implementation should remain lower poly and more OSRS-like.

## Silhouette Goals

- First read at thumbnail size: heavy shoulders, low head, long body, lower rump, huge paws.
- Side profile should slope from high shoulder mass down to rump. The back line should not be flat like a wolf or rounded like a boar.
- Front three-quarter view should show a dark brow shelf over tiny eyes, a blocky tan muzzle, and a small black nose.
- Ears should be short, round, and partly swallowed by the head mass. Avoid tall ears, which read as dog, wolf, or fox.
- Front paws should feel slightly wider and more threatening than rear paws. Claws should be readable as pale triangular strokes, not needle detail.
- Tail should remain a tiny dark nub. Any larger tail will fight the bear read.
- Keep the creature grounded and heavy. The legs should look powerful but short enough that the torso feels close to the ground.

## Color And Materials

- Use flat Lambert materials with faceted primitive geometry. No fur textures, no gradients, no glossy PBR pass.
- Base fur: deep OSRS brown, close to current `0x5b3d25`.
- Shadow fur: near black-brown for hump, paws, lower legs, brow, tail nub, and underside accents, close to `0x342418`.
- Warm fur highlight: muted chestnut for top planes, optional `#6d4a2f` or `#7a5636` if later lighting needs separation.
- Muzzle: dusty tan brown, close to current `0x8a6a4a`; keep it large enough to break up the face.
- Belly: dull mid brown, close to current `0x735034`; use sparingly so it reads as volume, not a costume patch.
- Paws: very dark brown, close to current `0x2a1c14`.
- Claws: aged bone, close to current `0xe3d5bd`; keep small, visible, and low saturation.
- Eyes and nose: near black, but separate them from each other with placement rather than shine.

## Geometry Ideas

- Preserve the current procedural approach: dodecahedrons, boxes, cones, spheres, and the shared quadruped leg rig are correct for this project.
- Body stack should be three obvious masses: long central body, raised shoulder hump forward, compact rump behind. If only one change lands later, make this shape clearer.
- Add visual planes rather than detail: one dark back ridge, a darker brow bar, and a lighter muzzle block do more work than many fur tufts.
- Head should sit forward and slightly low from the shoulder mass. The neck should feel thick, not like a thin connector.
- Consider a slight width bias in the shoulders compared with the hips. The bear should feel like it can shove the player, not sprint past them.
- Keep paw boxes broad and flat, with claws parented to paws so the attack and walk cycles carry them naturally.
- Do not add armor, scars, jewelry, spikes, or magical markings. This is a natural bear, not a boss variant.

## Animation Ideas

- Idle: slow breathing through torso scale, tiny head sway, almost lazy tail flick. The idle should look dangerous because of mass, not constant motion.
- Walk: slow diagonal quadruped gait with minimal lift and a visible shoulder roll. Keep feet heavy and close to the ground.
- Attack: compress shoulders down, thrust head/muzzle forward, then snap the front body back. A subtle front paw rake can layer on top, but the main hit should feel like a mauling shove.
- Hit reaction: torso compresses, head pulls back, ears tilt back, body rebounds. Avoid a bouncy cartoon recoil.
- Death, if added later: front legs fold first, shoulder mass drops, head lands last. Do not roll onto the back.

## Gallery Scale And Framing

- Gallery should frame the bear as a 1x1 tile enemy that feels wider and deeper than a wolf, not taller than a guard.
- Current hitbox is roughly broad and low: about `1.18w x 1.16h x 1.38d`. Later tuning should keep that footprint family unless combat selection changes.
- Best gallery angle: front three-quarter, with the muzzle and brow visible and the shoulder hump breaking the back line.
- Camera target should sit around chest/shoulder height, not the belly, so the head and hump dominate the upper third.
- Keep all four paws visible enough to prove quadruped stance. At least one front claw cluster should catch light.
- Thumbnail test: at small size, it should still read as "bear" from shoulder hump, tan muzzle, dark paws, and pale claws.

## Concrete Integration Guidance

- Later implementation target, when runtime edits are allowed: `src/js/combat-enemy-render-runtime.js`.
- Preserve public/runtime hooks expected by guards: `createBearRenderer`, `updateBearRenderer`, `kind: 'bear'`, `torsoGroup.name = 'bear-torso'`, `headGroup.name = 'bear-head'`, `tailGroup.name = 'bear-tail'`, and the four claw arrays.
- Preserve content selection: `src/game/combat/content.ts` should continue using `appearance: { kind: "bear" }` for `enemy_bear`.
- Prioritize proportion retuning over adding parts: shoulder hump position/scale, rump height, head forward offset, paw width, and muzzle size.
- Keep the material keys stable unless there is a good renderer-cache reason to rename them.
- Use no imported mesh and no external texture dependency for this enemy. The model should remain cheap, deterministic, and gallery-friendly.
- Distinguish from neighbors: wolf is lean and fast, boar is low with snout/tusks, bear is blocky shoulder mass with blunt muzzle and crushing paws.
- Likely failure modes to guard against: dog-like tall ears, sausage body, cute teddy face, over-dark unreadable blob, oversized boss proportions, or spindly legs.

