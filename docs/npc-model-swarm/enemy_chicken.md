# Chicken (`enemy_chicken`)

## Current Read

Chicken is the harmless utility wildlife target: passive, 1x1, `3` HP, `0` defence, max hit `1`, `0` aggro radius, `4` roaming radius, and early drops for raw chicken plus feathers. In practice it is a Tutorial Island proof target for melee, ranged, and magic, so it must read as low-threat from far away and still feel alive when several are wandering around the pen.

Runtime already marks Chicken as a bespoke combat enemy (`appearance.kind: "chicken"`) and the gallery tracks it as a bespoke model. The current renderer builds a compact white bird from simple boxes/spheres: pale body and chest, tan wings/tail, orange beak/legs, red comb/wattles, dark eyes, claw toes, and animation hooks for idle pecking, head bob, wing flaps, tail flicks, attack pulses, and hit recoil.

## Inspiration

- OSRS Chicken page: level-1, 1x1, non-aggressive livestock, weak starter target, common raw chicken and feather source. Source: https://oldschool.runescape.wiki/w/Chicken
- Sketchfab low-poly chicken reference: useful proof that a readable chicken can stay under a small asset budget with big comb, beak, tail, and body masses. Source: https://sketchfab.com/3d-models/low-poly-chicken-29e61a713bd3413c8fc74c8453a1ada1
- LB3D stylized chicken note: motion and idle variety sell personality more than realism for a tiny low-poly bird. Source: https://lb3d.co/3d/unity-3d/low-poly-chicken/
- Low-poly style reference: prioritize surface economy, consistent resolution, and strong silhouette over anatomical fidelity. Source: https://media.gdcvault.com/gdc2017/Presentations/Redd_Low_poly_style.pdf

## Silhouette Goals

- First read: small white teardrop body with a proud red comb and orange beak, unmistakably chicken before any texture/detail is visible.
- Side read: forward head/beak, round chest, blocky rump, three-feather tail fan angled up and back, two thin yellow legs under the body.
- Top/down gameplay read: pale oval body plus red/orange head marker so it does not disappear against grass, dirt, fences, or pale Tutorial Island sand.
- Threat read: comic and fragile, not predatory. Keep feet skinny, body low, head curious, wings tucked; avoid sharp monster posture or oversized claws.
- Swarm read: when several chickens overlap in the pen, the comb and tail fan should create readable red/tan accents rather than one white blob.

## Color And Material Notes

- Keep flat-shaded Lambert materials, no texture dependency for v1. Current palette is already good: body `0xf4ecd8`, chest `0xfff7df`, wing `0xdfcfad`, tail `0xc8aa68`, beak `0xe5a534`, leg `0xd0a03a`, foot `0xb88524`, comb `0xb23b38`, eye `0x201712`, claw `0x4c3119`.
- Push contrast by letting the chest stay warm ivory while wing/tail are straw-tan. The bird should remain readable under the gallery key/fill lights and in outdoor daylight.
- Comb and wattles are identity accents. Keep them saturated barn red, but small enough that the model stays "starter wildlife", not a boss variant.
- Eyes should remain tiny dark beads on the front/side corners of the head. Do not enlarge into cartoon mascot eyes; the OSRS feel is simple and slightly deadpan.

## Geometry And Animation Ideas

- Body: prefer faceted dodecahedron or bevel-like box proportions over smooth spheres if the next pass wants stronger old-school character. Keep total visual height around current Chicken scale and well below humanoid NPCs.
- Head: keep a blocky head with a cheek/underjaw volume so the beak has a clear anchor. The beak should project farther than the current cube head silhouette when viewed in thumbnail.
- Tail: make the three-feather fan more decisive: center feather tallest, side feathers splayed outward and up. This gives a readable rear silhouette during roaming.
- Wings: keep folded slab wings low on the sides. Let the tips flare briefly during walk/attack/hit pulses instead of being permanently spread.
- Legs: keep two-segment stick legs with exaggerated three-toe feet. The feet should be slightly oversized for ground contact/readability, but claws should stay tiny.
- Idle: cycle between tiny body bob, head tilt, and a short peck. The peck should be asymmetric and intermittent enough that a pen of chickens feels busy without looking synchronized.
- Walk: fast, snappy two-leg gait with head counter-bob and subtle tail flick. Feet should lift visibly in gallery thumbnails; avoid sliding.
- Attack: tiny forward jab/peck plus wing flutter. It should communicate contact timing while still looking absurdly harmless.
- Hit: brief squash/back recoil, comb/wattle dip, one tail flick. Do not ragdoll or overdramatize; the creature dies quickly and should stay readable in combat clutter.

## Gallery Scale And Framing

- The gallery thumbnail is small (`148px`) and uses a shared orthographic fit. Chicken must occupy enough of the card to read beside taller humanoids, so keep the visible bounding box compact and avoid invisible/stray geometry that expands the fit.
- Preserve a health-bar offset near the current `0.88` world units unless the visible head/comb height changes substantially.
- Front three-quarter framing should show beak, comb, both legs, one wing slab, and tail fan. If the normalized thumbnail makes the bird look too tiny, adjust visible proportions before changing gallery camera rules.
- The silhouette must survive against transparent thumbnail background, grass, packed dirt, and tutorial pen fencing. Test from front, side, and three-quarter angles because the current gallery normalizes rotation to face forward.

## Implementation Guidance

- Keep future work in `src/js/combat-enemy-render-runtime.js` under `createChickenRenderer`, `createChickenLegRig`, `applyChickenLegPose`, and `updateChickenRenderer`; do not convert Chicken to a humanoid preset.
- Reuse material cache keys under the `chicken:*` namespace so multiple chickens share materials cleanly.
- Use primitive geometry only: `BoxGeometry`, low-segment `SphereGeometry` or `DodecahedronGeometry`, `ConeGeometry`, and short `CylinderGeometry` are enough. Target the feel of a 2007-era low-poly creature, not a realistic farm animal.
- Keep `appearance.kind: "chicken"` and `facingYaw: Math.PI` in combat content. The renderer should remain selected by `appearance.kind`, while stats/drops/behavior stay owned by combat content.
- Make any scale polish in visible mesh proportions first. Hitbox can remain gameplay-sized, but hidden hitbox geometry should never drive the gallery fit or thumbnail crop.
- If adding polish, prioritize: stronger beak projection, clearer three-feather tail fan, more faceted body mass, less synchronized idle pecking, and a readable two-step walk.
