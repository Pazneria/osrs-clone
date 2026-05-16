# enemy_guard Model Brief

Owned model: Guard (`enemy_guard`)

Scope: brief only. Do not edit runtime code in this pass.

## Current Read

- Live preset: `buildEnemyGuardPreset()` clones `buildTutorialCombatInstructorPreset()`, relabels it as `Guard`, sets archetype `east_outpost_guard`, rethemes the armor, and adds one small blue torso crest.
- The model already reads as a competent armored humanoid: full steel/chain body, broad pauldrons, cape, sword in the right hand, shield on the left forearm, greaves, sabatons, and a squared combat stance.
- Current guard palette is cooler and more civic than the Combat Instructor: steel `#6f7f8a`, mail `#57636b`, leather `#4a3324`, bronze `#c09a4a`, blade `#c3c8c9`, cape `#28476b`, shield `#2f5279`, crest `#315f93`.
- Combat role is a sturdier zone-control melee enemy: aggressive, stationary, and best used as pairs or fixed posts. The visual should say "restricted threshold" before the player reads the nameplate.
- Main weakness: because it inherits the Combat Instructor almost wholesale, it risks reading as a blue recolor of the trainer. The brief goal is to keep the strong existing rig while adding unmistakable town/outpost-guard identity.

## Inspiration

- OSRS guards are common human city security rather than heroic knights; use that grounded civic read instead of over-fantasy armor. Source: https://oldschool.runescape.wiki/w/Guard
- Varrock uses guards around city entrances, which supports a gatekeeper/posture-first design. Source: https://oldschool.runescape.wiki/w/Varrock
- The OSRS guard family gained distinct town guard models for Varrock, Falador, Ardougne, and Edgeville in 2022, so local faction color and regional variation are canon-friendly. Source: https://oldschool.runescape.wiki/w/Guard#Changes
- Low-poly medieval guard references support big primitive reads: helmet block, shoulder caps, shield slab, belt/tunic break, and weapon silhouette. Source: https://sketchfab.com/3d-models/medieval-fantasy-guard-9ed238b1bffb440f8435f2995ad5b436
- Use modern low-poly soldier references for proportion discipline only, not mesh detail: compact torso, chunky hands/boots, and broad color panels. Source: https://sketchfab.com/3d-models/lowpoly-medieval-soldier-6d95c47edb5743ed96b6cecd014e0293
- Shield references favor flat color, simple editable forms, and clear rim/boss separation. Source: https://blendswap.com/blend/26316

## Silhouette Goals

- First read should be "gate sentinel": upright spine, square shoulders, shield mass offset on the left, weapon low or ready on the right, boots planted.
- Add a simple open steel/bronze med helm language: shallow cap, brow band, short nasal bar, and tiny cheek plates. Keep the face visible so it remains OSRS-like and not a faceless knight.
- Make the shield a civic signpost. A blue heater or rectangular shield face with bronze rim and boss should be visible front-on without hiding the chest crest.
- The torso needs one bigger faction cue than the current tiny crest: a short blue tabard strip, vertical breastplate stripe, or enlarged crest plate centered or slightly offset.
- Keep cape as a back/side bonus, not the primary read. The gallery front camera should recognize the guard from helmet, shield, and chest mark.
- Keep the weapon practical. Current sword is safest for existing animation. A spear would be iconic for a posted guard, but only swap if a later runtime pass supports longer thrust framing and thumbnail bounds.

## Color And Materials

- Stay flat-shaded and box-built. No imported meshes, no texture dependency, no noisy chainmail patterning.
- Dominant read: dull steel and dark mail. Accent read: navy shield/cape/crest. Trim read: muted bronze. This keeps the guard civic and official without becoming a blue monochrome model.
- Use material breaks through geometry, not just color swaps: raised breastplate ridge, rim strips, shield boss, brow/nasal bar, belt buckle, and tasset edges.
- Avoid bright heroic silver across the whole body. Reserve `#c3c8c9` or similar light steel for blade edges, helmet glints, knee guards, and breastplate ridge.
- Fragment names should keep useful material words where possible (`steel`, `mail`, `leather`, `bronze`, `shield`, `crest`) so future theme mapping remains legible.

## Geometry And Animation Ideas

- Low-risk runtime path: keep the inherited humanoid construction, pose, arm rig defaults, sword, and shield mount; add guard-specific extra fragments in `buildEnemyGuardPreset()`.
- Highest-value extra fragments: `guard_steel_med_helm`, `guard_steel_brow_band`, `guard_steel_nasal_bar`, `guard_left_cheek_plate`, `guard_right_cheek_plate`, `guard_blue_tabard`, `guard_bronze_tabard_pin`, `guard_blue_shield_face`, `guard_bronze_shield_rim`, `guard_bronze_shield_boss`.
- Keep additions to roughly 8-16 boxes. Anything smaller than about `0.035` units should earn its keep in the thumbnail.
- Idle: shield stays steady, sword hand breathes subtly, head scans a few degrees. Guard should feel on duty, not relaxed.
- Walk: heavier than a civilian, with small shield lag and modest torso bob. Do not make it charge like a brute.
- Attack: brace shield, short sword thrust or compact slash, recover to posted stance. The combat spec attack cycle is steady pressure, not a wild lunge.
- Hit: shield/shoulder absorbs the recoil first, then helmet/head snaps back slightly.

## Gallery Scale And Framing

- Gallery thumbnails normalize by model bounds, using a fit based on height, width, and depth. A very wide shield or long diagonal weapon will shrink the whole guard.
- Keep left shield extension close to the current pauldron width plus a small extra margin; prioritize front readability over lateral spread.
- The camera is front orthographic, so shield face, helmet nasal, and chest/tabard marks must read from straight on.
- Preserve full-body contact with the floor and avoid raising the weapon above the helmet unless a later gallery framing pass is intentional.
- At 96-128 px, the required read order should be: helmet, shield, blue civic mark, sword, heavy boots.

## Implementation Guidance For Later Integration

- Preserve preset ID `enemy_guard`, label `Guard`, and archetype `east_outpost_guard`.
- First implementation should be additive inside `buildEnemyGuardPreset()` via extra fragments. Avoid extracting or rewriting the shared Combat Instructor rig unless multiple armored NPCs need the same guard base.
- Do not replace the current sword with a spear until `npc/guard/attack` and gallery framing are checked against the longer weapon.
- If adding a stronger shield face, check that it does not cover the torso crest in the front thumbnail. Angle or offset it instead of scaling the whole model down.
- If later runtime code changes, verify with the NPC gallery guard and a visual gallery pass focused on `enemy_guard`; this brief itself requires no runtime test.
- Acceptance target: the model should no longer look like a recolored tutorial trainer, yet still reuse the same dependable humanoid rig and animation set.
