# Road Scavenger (`mainland_road_scavenger`)

Owned model: Road Scavenger (`mainland_road_scavenger`)

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly NPC gallery model. This brief does not authorize runtime code edits.

## Current Read

- Existing preset: `buildMainlandRoadScavengerPreset()` in `src/js/content/npc-appearance-catalog.js` is a `buildGuideVariantPreset()` clone labeled `Road Scavenger`, with archetype `old_road_scavenger`.
- Current palette: charcoal-brown coat `#41382e`, dusty linen shirt `#b9a67c`, dull ochre trim `#8f7542`, dark trousers `#322d28`, and near-black boots `#211a15`.
- Current bespoke fragments are only `scavenger_patch` and `scavenger_satchel`. They are directionally right, but too clean and too small to beat the inherited guide silhouette at gallery size.
- Current placement: `content/world/regions/main_overworld.json` wires `merchant:old_road_scavenger` / `npc:old_road_scavenger` to `appearanceId: "mainland_road_scavenger"` at the northeastern Old Roadhold, action `Talk-to`, `dialogueId: "outpost_guide"`, and home tag `home:old_road_gatehouse`.
- Settlement read: `content/world/building-workbench/settlements/old_roadhold.json` frames the area as a damaged fortified road stop with old gatehouse, burnt cottage, weathered manor shell, ash track, and an NPC role of "ruin flavor, warnings, and salvage rumors."
- Main risk: the live model currently reads as "dirty guide with a side pouch." The final model needs to read as a wary civilian salvage-picker attached to a ruined road stop before the player sees the label.

## Service And Gameplay Role

- World role: noncombat ruin local who knows what was burned, what is worth prying loose, and which road habits keep travelers alive.
- Service role: warnings, salvage rumors, flavor barter, and Old Roadhold memory. He is service-adjacent because he talks and may trade, but his silhouette should not promise a normal shop counter.
- Player read: "This person survives by sorting the road's leftovers and knows why the gatehouse is still avoided."
- Emotional tone: cagey, hungry, practical, a little opportunistic, but not actively hostile.
- Identity boundary: not an official guide, not a guard, not a heroic rogue, not a desert bandit, not a diseased beggar caricature, and not a full merchant. He should feel like a poor roadside survivor with useful eyes.

## Source Inspiration

- OSRS [Rogue](https://oldschool.runescape.wiki/w/Rogue): human Wilderness rogue, pickpocketable and not automatically hostile. Borrow the shady fringe-civilian energy and small stolen-goods vocabulary, not the castle criminal identity.
- OSRS [Beggar](https://oldschool.runescape.wiki/w/Beggar): a hungry quest NPC who asks for bread outside a shop. Borrow the hunger, patched-cloth humility, and player-facing plea read, not the disguise/lore twist.
- OSRS [Tramp](https://oldschool.runescape.wiki/w/Tramp): classic poor urban civilian precedent. Use only for rough street silhouette and ragged human scale.
- OSRS [Highwayman](https://oldschool.runescape.wiki/w/Highwayman) and [Highwayman mask](https://oldschool.runescape.wiki/w/Highwayman_mask): roadside threat language, black cape/hood/mask adjacency, and the "holds up passers by" fantasy. Borrow the dangerous-road silhouette lightly; do not turn this NPC into an attacker.
- OSRS [Bandit](https://oldschool.runescape.wiki/w/Bandit): wilderness outlaw precedent with rough low-level human combat vocabulary. Borrow dull outlaw colors and improvised kit, but keep the Road Scavenger civilian and talkable.
- Wikimedia Commons [Murillo, The Young Beggar](https://commons.wikimedia.org/wiki/File%3AA_beggar_boy_picking_a_flea_from_the_seam_of_his_shirt._Colo_Wellcome_V0019954.jpg): useful for torn shirt, bare-worn posture, patched cloth, and poverty read. Convert the detail into a few chunky low-poly panels.
- Nationalmuseum [St Martin and the Beggar](https://collection.nationalmuseum.se/en/collection/item/19062/): useful for cloak-as-survival visual language and strong diagonal rag shapes. Borrow the torn cloak/blanket silhouette, not religious staging.
- Co-Curate/Wikimedia [14th-century lepers outside city](https://co-curate.ncl.ac.uk/resources/view/109488/): use the medieval road-margin prop vocabulary of staff, handbag, and audible/visible warning object only. Avoid disease coding.
- Kenney [Mini Characters](https://kenney.nl/assets/mini-characters): validates compact, readable low-poly people with oversized heads/hands, simple props, and animation-friendly proportions.
- Quaternius [Ultimate Animated Character Pack](https://quaternius.com/packs/ultimatedanimatedcharacter.html) and [Ultimate RPG Pack](https://quaternius.com/packs/ultimaterpg.html): use for low-poly discipline, not asset import: large color blocks, simple RPG silhouettes, and clear prop silhouettes in FBX/OBJ/Blend style packs.

## Silhouette Goals

- First read at thumbnail size: hunched roadside scavenger with ragged hood or cloaklet, diagonal satchel strap, bulging salvage satchel, visible patchwork, and one crooked stick/hook.
- Break the guide-clone rectangle. Use forward shoulders, a slightly low head carriage, uneven hem blocks, and asymmetrical props rather than simply recoloring the Tutorial Guide body.
- Make the satchel a signature shape: rounded boxy body at one hip, visible flap, bulging side, and thick strap crossing the chest. The current floating pouch needs a real harness.
- Add a ragged cloaklet or torn shoulder blanket. It should create a broken upper outline and a poor road-survivor read without becoming a clean highwayman cape.
- Add one hand prop close to the body: a crooked salvage hook, walking stick, pry stick, or snapped spear-shaft with no sharp military head. It should say "picks through ruins," not "stabs players."
- Add one scavenged-bundle cue: rope coil, bent nail/iron strip, broken wheel spoke, patched bottle, or tied scrap board. Keep it attached to satchel/belt/back so it does not expand the gallery bounds.
- Face and head should feel wary: low hood/cowl, dark brow shadow, rough beard/stubble block, or sunken cheek planes. Do not over-detail teeth, wounds, or dirt flecks.
- Avoid a full black mask, clean rogue outfit, sword, shield, armor, giant backpack, floor pile, cart, or stall. The model's job is one human silhouette, not a prop scene.

## Color And Material Notes

- Preserve the current ash-brown base; it is already right for Old Roadhold. Add clearer material separation so the model does not collapse into one dark brown mass.
- Suggested palette anchors: coat `#41382e`, coat shadow `#2c261f`, dusty linen `#b9a67c`, old patch `#7f5a3a`, leather `#5a3e29`, dark leather `#3a271b`, ash grey `#6a6258`, boot dust `#8c7b62`, rust iron `#8f4936`, dull brass `#8f7542`, faded black cloth `#24211e`.
- Use two or three patch colors: one warm brown, one ash grey, one faded ochre. Patches need to be larger than realistic patches so they survive the 148px gallery thumbnail.
- Rust and scrap metal should be dull and small. A rust accent on a hook or belt scrap is enough; too much metal makes him read as an armed bandit or blacksmith.
- Cloth should look repaired through big planes: mismatched sleeve cuff, knee patch, torn cloak corner, frayed hem strip. Do not rely on tiny texture marks.
- Satchel leather should contrast against the coat. If the satchel stays dark brown on dark coat, add a flap edge, clasp, or tan stitch block.
- Keep skin warm but tired. Slightly shadow the eyes/cheeks if the preset supports it, but avoid undead, plague, or monster cues.

## Prop And Pose Ideas

- Priority upgrade: replace the two existing custom fragments with a satchel-and-rag kit that can carry the whole read from the front three-quarter gallery view.
- Build `scavenger_satchel_body`, `scavenger_satchel_flap`, `scavenger_satchel_bulge`, `scavenger_satchel_strap_upper`, and `scavenger_satchel_strap_lower` before adding optional clutter.
- Convert `scavenger_patch` into several readable patch panels: `scavenger_chest_patch`, `scavenger_knee_patch`, `scavenger_sleeve_patch`, and `scavenger_cloak_patch`.
- Add `scavenger_ragged_hood`, `scavenger_cloaklet_left`, `scavenger_cloaklet_right`, and `scavenger_frayed_hem` to break the inherited clean guide outline.
- Add one tool set: `scavenger_hook_handle`, `scavenger_hook_tip`, and `scavenger_hand_wrap`; or a simpler `scavenger_pry_stick` with a wrapped grip. Keep it hand-held and angled inward.
- Optional salvage details: `scavenger_rope_coil`, `scavenger_bent_nail`, `scavenger_scrap_board`, `scavenger_bottle`, `scavenger_rattle_charm`, `scavenger_boot_dust`, `scavenger_belt_pouch`, `scavenger_tin_cup`.
- Pose target: shoulders rounded, torso subtly forward, head tilted toward the road, one hand gripping the hook/stick, other hand near the satchel as if guarding finds.
- Idle animation target for later: glance over shoulder, prod the ground once, tug the satchel strap, then settle back into a guarded hunch. No combat flourish and no cheerful shopkeeper wave.

## Gallery Scale And Framing Notes

- Keep standard humanoid floor contact and roughly guide-height bounds, but make perceived height lower through hunch and ragged silhouette. Do not uniformly scale him tiny.
- Best gallery angle: front three-quarter with hood/face, chest strap, satchel body, patchwork, and hook/stick visible at the same time.
- Required thumbnail read order: ragged hood/cloak, diagonal strap, satchel, crooked stick/hook, patchwork, dusty boots.
- Stick or hook must stay inside the standard humanoid preview frame. If it rises far above the head or extends too wide, the gallery fit will shrink the whole character.
- Patches and scrap must be oversized. A realistic tiny nail, stitch, or cup will disappear and only add noise.
- Compare beside `mainland_outpost_guide`, `mainland_road_guide`, `mainland_market_trader`, `mainland_banker`, and `enemy_guard`. Road Scavenger should be rougher than both guide models, less commercial than the trader, less trusted than the banker, and much less armed than the guard.
- Do not rely on Old Roadhold scenery, ash tracks, burnt cottages, or gatehouse context. The isolated gallery card must still read as "road scavenger from a ruined stop."

## Concrete Implementation Guidance For Central Integration

- Preserve identifiers and contracts: `mainland_road_scavenger`, label `Road Scavenger`, archetype `old_road_scavenger`, preview actor entry, `appearanceId` wiring, service ID `merchant:old_road_scavenger`, spawn ID `npc:old_road_scavenger`, action `Talk-to`, `dialogueId: "outpost_guide"`, and home tag `home:old_road_gatehouse`.
- Later runtime integration should stay in `src/js/content/npc-appearance-catalog.js` inside `buildMainlandRoadScavengerPreset()` unless the NPC gallery rework introduces a central authored model layer first.
- Lowest-risk pass: keep the `buildGuideVariantPreset()` base and current palette, but replace the two tiny custom fragments with 12-18 scavenger-specific fragments for hood/cloak, strap, satchel, patchwork, hand tool, and one salvage bundle.
- Better bespoke pass: still use guide-family humanoid proportions and animation compatibility, but add a local hunch through fragment placement/rotation, lower head/shoulder read, and asymmetrical prop weight.
- Suggested fragment names: `scavenger_ragged_hood`, `scavenger_brow_shadow`, `scavenger_cloaklet_left`, `scavenger_cloaklet_right`, `scavenger_frayed_hem`, `scavenger_satchel_strap_upper`, `scavenger_satchel_strap_lower`, `scavenger_satchel_body`, `scavenger_satchel_flap`, `scavenger_chest_patch`, `scavenger_sleeve_patch`, `scavenger_knee_patch`, `scavenger_hook_handle`, `scavenger_hook_tip`, `scavenger_rope_coil`, `scavenger_scrap_board`, `scavenger_boot_dust`.
- Appended fragments should use explicit `rgbColor` values. Do not assume theme cloning will recolor new mainland-only roles correctly.
- Keep prop mass close to the torso and hands. This NPC needs a broken silhouette, not a wide junk pile that makes the gallery normalize him down.
- Do not import meshes, textures, generated OBJ assets, external model geometry, item icons, merchant stock, dialogue, world placement, road data, settlement workbench data, or combat behavior during the visual model pass.
- Suggested later QA after runtime integration: run `node .\tools\tests\npc-model-gallery-runtime-guard.js`, then inspect `/qa npcgallery` with the Road Scavenger beside guide, trader, banker, and guard models.
- Success condition: at small gallery size, a fresh viewer should read "wary ruin scavenger who knows the old road" before reading the label.
