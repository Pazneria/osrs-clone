# enemy_boar - Boar Model Brief

Owned model: `enemy_boar`

Runtime role: early aggressive melee animal. It should read as more threatening than rats/chickens, less elite than wolves, and useful as a visible leather/meat/tusk source in the outer starter fields.

## Current Read

- Current runtime creates a dedicated bespoke boar renderer, not a placeholder. It is built from simple Three.js primitives: rectangular torso, shoulder hump, rump, belly sphere, spine strip, box head, protruding box snout, tiny cone tusks, tilted ears, small dark eyes, thin tail, and four quadruped leg rigs.
- Existing palette is grounded and readable: body `#7b5b3c`, darker back `#65492f`, warm belly/snout `#a57c56`/`#8b6748`, tusks `#f2e6cb`, legs `#5a4330`, hooves `#2f241d`, eyes `#1a140f`.
- Existing animation already sells life: idle bob, shoulder scale pulse, head swing, tail swing, hit recoil, attack lunge, and a compact quadruped gait.
- Weakness: from thumbnail distance the model can collapse into a small brown block with a nose. Tusks, bristle ridge, shoulder mass, and cloven hooves need stronger first-read separation.

## Inspiration Notes

- OSRS reference: OSRS Wiki NPC IDs lists `Boar#Level 5` as `11066` and `Boar#Level 7` as `11067`, so the target should feel like a low-level field creature rather than a boss-scale beast. Source: https://oldschool.runescape.wiki/w/NPC_IDs
- OSRS cache/model inspection path: Hinamizawa's OSRS NPC lookup exposes cache-backed 2D and 3D NPC references, useful for checking the level 5/7 boar proportions without importing or copying the source asset. Source: https://hinamizawa.ai/osrs/npc-lookup/
- OSRS item/world flavor: `Raw boar meat` and `Boar tusk` are the practical reads this creature needs to support in the clone. Source: https://oldschool.runescape.wiki/w/Raw_boar_meat
- Real anatomy: wild boar are bristly, dark brown/blackish, sharp-tusked, swift, and up to about 90 cm at the shoulder. Source: https://www.britannica.com/animal/boar-mammal
- Real silhouette: large head, bulky muscular body, heavy shoulders, tusks, shoulder hair ridge, coarse bristles, and rooting behavior driven by a strong snout/neck. Source: https://devon.wildwoodtrust.org/plan-your-visit/animals/wild-boar/
- Low-poly practice: favor surface economy, silhouette, consistent resolution, and approximation over anatomical over-modeling. Source: https://media.gdcvault.com/gdc2017/Presentations/Redd_Low_poly_style.pdf
- Low-poly boar benchmark only, not an asset source: a downloadable Sketchfab example lands around 2.3k triangles/1.3k vertices and shows how a low-poly boar can still depend on shoulder slope, snout projection, ears, tusks, and bristle color blocking. Source: https://sketchfab.com/3d-models/low-poly-wild-boar-c629c82f34754fd09230b2c9563296ac

## Silhouette Goals

- Side view must say "boar" before color helps: high front shoulder mass, lower rear rump, short legs, long wedge snout, small upright ears, and forward/upward tusks.
- Top view should be a tapered wedge, not a sausage: broad shoulders, narrower hips, long head projecting beyond the front legs.
- Add a dark dorsal bristle ridge that runs from brow/neck over the shoulder hump toward mid-back. Make it chunky enough to catch light in the gallery thumbnail.
- Tusks need to be larger than realistic scale. Two ivory hooks should be visible from 3/4 front and side, but should not make the animal read as a warthog boss.
- Hooves should be dark, stubby, and visibly separated from the legs. A two-prong suggestion per hoof is enough: split bevel, twin dark blocks, or a shallow central notch.
- Ears should be small triangular flags tilted outward/back. They are secondary, but they help break up the head block.
- Keep the body compact. This is a 1x1 starter enemy, so avoid bear-like height or wolf-like length.

## Color And Material Notes

- Keep the base in earthy browns so it belongs in fields, forest edges, and mud lanes. Avoid saturated red/orange fur.
- Push value contrast harder than hue contrast:
  - dark ridge/shoulders: near `#4f3524` to `#65492f`
  - body mid: near `#76563a` to `#85603f`
  - snout/belly warm plane: near `#9a704d` to `#a57c56`
  - legs: near `#4b3527`
  - hooves/eyes: near `#201812`
  - tusks: near `#ead9b7`, with darker root caps if geometry allows
- Use flat Lambert materials or face-color blocks, not glossy skin. The boar should feel bristly and matte.
- Do not over-texture. Bristles can be color-blocked as ridge wedges and a few dark shoulder planes.
- If adding face bevels, give the snout a slightly lighter top plane and darker underside so the rooting nose reads at thumbnail scale.

## Geometry Ideas

- Body: keep the current box/primitive language, but exaggerate proportions. Suggested final bounding read: length about 1.15, shoulder height about 0.75 to 0.85, rump height about 0.55 to 0.65.
- Torso: use a long low body core plus a raised shoulder wedge/hump. The hump should sit forward of center, not centered on the back.
- Head: make a wedge stack: skull block, brow wedge, long snout block, broad dark nose cap. The snout should project clearly past the tusks.
- Bristle ridge: 5 to 7 low triangular prisms or a segmented dark sawtooth strip along the top line. Taller at shoulder, shorter toward rump.
- Tusks: use curved impression through two or three cone segments per side if possible. If keeping single cones, scale radius/length up and rotate outward/upward for a hooked profile.
- Legs: keep four rigged legs, but thicken the front upper legs slightly to support the shoulder-heavy silhouette. Back legs can stay slimmer.
- Hooves: add small dark foot blocks with a shallow split or twin-block shape. They should not be paw-like.
- Tail: keep short and thin. A little curved flick is fine, but do not let the tail become a piglet curl that competes with the tusks.

## Animation Ideas

- Idle: subtle heavy breathing through shoulder hump and belly, plus tiny snout dips as if scenting/rooting.
- Walk: front-heavy trot. Shoulders bob more than rump; head stays low and forward.
- Attack: short shove, not a leap. Drive snout and tusks forward, drop head, compress front legs, then rebound.
- Hit reaction: flinch backward with head jerk and ear flick. Avoid large comic squash; this enemy is grounded but not silly.
- Death/fall if later added: collapse front-first, tusks angled sideways and body settling low. Keep it quick so combat pacing stays OSRS-like.
- Gallery idle loop: prefer low, readable motion over high stride. The brief view should show head, tusks, bristles, and stance without waiting for a combat lunge.

## Gallery Scale And Framing

- The gallery card thumbnail is small, so the boar needs a 3/4 front-left capture angle that shows snout length, tusk curve, shoulder hump, and at least two legs.
- Frame lower than humanoids. Leave a little ground margin under hooves, but fill the card horizontally so the model does not look like a tiny prop.
- Do not over-zoom to the head. The body slope is the identity.
- Rotate/facing should preserve the existing combat `facingYaw: Math.PI` expectation unless the gallery capture path intentionally normalizes combat enemies.
- Check side profile and 3/4 thumbnail separately. A boar that reads only from side will fail in gallery use.

## Integration Guidance

- Runtime code currently selects the bespoke renderer via `appearance.kind === 'boar'`. Any future implementation should keep that contract stable for `enemy_boar`.
- Preserve the 1x1 hitbox and early-combat scale. Visual improvements should fit inside roughly the current hitbox footprint instead of making gameplay range feel misleading.
- Build on the current `createBoarRenderer` and `updateBoarRenderer` structure: named parts for torso, hump, head, tusks, ears, tail, and four leg rigs are already useful for animation.
- Prefer adding a few high-value primitive pieces over importing a dense mesh. Priority order: bristle ridge, stronger tusks, snout/nose cap, hoof split, shoulder/rump slope.
- Keep material keys specific to boar parts so future palette swaps or gallery diagnostics can identify body/back/belly/snout/tusk/hoof separately.
- If triangle budget matters, spend it on silhouette edges and tusk/bristle clarity, not rounded body fidelity. Boxy planes are acceptable and stylistically consistent.
- Validate in the NPC model gallery at thumbnail size, then in combat field scale. Acceptance criterion: the model reads as "boar" before the name badge is read, and as "starter boar" rather than wolf, bear, pig, or warthog.

## Do Not Do

- Do not make it cute, pink, domestic, or round-bodied.
- Do not make it enormous, armored, scarred, or boss-coded.
- Do not copy external model geometry or textures. Use references only for proportion and silhouette thinking.
- Do not edit runtime implementation as part of this brief pass.
