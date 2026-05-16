# Quarry Foreman (`mainland_quarry_foreman`)

Owned model: Quarry Foreman (`mainland_quarry_foreman`)

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly NPC gallery model. This brief does not authorize runtime code edits.

## Current Read

- Existing preset: `buildMainlandQuarryForemanPreset()` in `src/js/content/npc-appearance-catalog.js` uses `buildSmithVariantPreset()`, so he currently clones the Tutorial Mining/Smithing Instructor family.
- Current palette: apron `#685741`, shirt `#6d4d31`, metal `#aaa69d`, ore `#8e806d`. It is correctly dusty and quarry-adjacent, but still reads like a rethemed smith.
- Current bespoke fragments are only `foreman_slate_badge` on the torso and `foreman_clipboard` on the left lower arm. The idea is right, but both signals are too small to own the gallery silhouette.
- Current placement: `content/world/regions/main_overworld.json` places `merchant:south_quarry_foreman` / `npc:south_quarry_foreman` at the South Quarry storehouse with `appearanceId: "mainland_quarry_foreman"`, mining/south/settlement tags, and `home:south_quarry_storehouse`.
- Current workbench intent: `south_quarry_hamlet` is a mining support hamlet where the storehouse is the ore storage and foreman work area. The foreman should feel like the person controlling carts, sorting, and safe work pace.
- Main risk: he becomes "generic dusty smith with clipboard." The final model needs a clear site-boss read at thumbnail size: quarry authority, route intro, ore-sorting logistics, and mining tool literacy.

## Profession And Gameplay Role

- He is the South Quarry work boss: not the best miner, not the master smith, not a dwarf ore merchant, but the person who tells everyone where stone, ore, carts, and players should go.
- Gameplay role: mining route intro and ore-sorting flavor for the quarry hamlet. He should look useful before the player reads the nameplate.
- Merchant/service read should be practical and local: stock ledger, work orders, assigned crates, tool checks, and maybe basic quarry supplies.
- Personality read: tired but decisive, direct, safety-minded, and impossible to bluff about whether a cart is overloaded.
- He belongs outside the storehouse among quarry carts, notice boards, coal bins, ore piles, and slate-roof/timber-braced structures.
- Identity boundary: Borin owns dwarf ore appraisal and forge warmth; Thrain owns advanced smith prestige; Elira owns gem precision; this Foreman owns site control, loading, and mining work order authority.

## Source Inspiration

- OSRS [Foreman](https://oldschool.runescape.wiki/w/Foreman): the Ship Yard foreman is literally examined as "The boss." Borrow the terse overseer identity and question/permission gate feel, but avoid shipyard or nautical cues.
- OSRS [Bandit Camp Quarry](https://oldschool.runescape.wiki/w/Bandit_Camp_Quarry): useful quarry vocabulary: granite, sandstone, clay, coal, remote worksite, heavy stone output, heat/dust pressure, and travel friction. Borrow quarry labor language, not desert costume.
- OSRS [Pickaxe](https://oldschool.runescape.wiki/w/Pickaxe): pickaxes are mining tools that can be held or wielded, with clear metal-tier silhouettes. Give the Foreman a worn practical pick or pick-head cue, not a heroic weapon.
- OSRS [Mining Guild](https://oldschool.runescape.wiki/w/Mining_Guild): expert-miner institution with guarded access, ore/pickaxe commerce, banking, and progression authority. Use the "site rules and qualified miner" flavor, not a 99 cape or guildmaster grandeur.
- OSRS [Mines](https://oldschool.runescape.wiki/w/Mines): reinforces that mines/quarries are place identities as much as rock nodes. The model should carry enough site language to read even away from the South Quarry map.
- World History Encyclopedia [Medieval Stone Masons' Tools](https://www.worldhistory.org/image/17912/medieval-stone-masons-tools/): hammer, chisel, square, measuring, and shaping-tool vocabulary. Compress these into blocky belt props and a measuring rod.
- Britannica [Quarrying](https://www.britannica.com/technology/mining/Quarrying): quarrying organizes stone into benches, blocks, wedges, and splitting lines. Use wedge marks, block samples, and sledge/chisel logic as believable detail.
- Valley of Stone [The Mason](https://www.valleyofstone.org.uk/journey/menandmachines/mason): traditional stonework cues include hammers, chisels, wedge holes, and team work between masons and rock-getters. Useful for making the Foreman supervise both rough extraction and sorting.
- Wikimedia Commons [Quarrymen](https://commons.wikimedia.org/wiki/Category:Quarrymen): broad visual reminder that quarry workers are dust-covered laborers with simple clothes, hand tools, and stone masses. Use as atmosphere only.
- Kenney [Mini Characters](https://kenney.nl/assets/mini-characters): compact 3D character readability, CC0 mini proportions, animation-friendly bodies, oversized hands/heads, and simple prop language.
- Sketchfab [Low Poly Construction Workers Rigged Pack](https://sketchfab.com/3d-models/low-poly-construction-workers-rigged-pack-2a3a3ee10f4f4a0b9b5afb79ba74b86f): validation for low-poly work-team silhouettes, strong uniforms, and pose-based job reads. Translate the foreman stance, not modern hard hats or neon PPE.
- Sketchfab [Low Poly Dwarf Miner (Rigged)](https://sketchfab.com/3d-models/low-poly-dwarf-miner-rigged-53c1474925d541bfaa36423f33b9f763) and [Miner Lowpoly - Mike](https://sketchfab.com/3d-models/miner-lowpoly-mike-0594b5046455498bb3ed84198d967823): useful for pickaxe/miner readability at very low triangle counts. Do not copy geometry, and do not make the Foreman a dwarf.
- Free3D [Low Poly Ores and Pickaxes](https://free3d.com/3d-model/low-poly-ores-and-pickaxes-33030.html): prop-scale reference for simplified pickaxe heads, ore chunks, and rock clusters. Use only as a shape checklist.

## Silhouette Goals

- First read at thumbnail size: human quarry site boss with slate board, dusty work vest/apron, one mining tool cue, and a controlled stance.
- Keep him human and middle-height. Do not shrink him toward Borin/Thrain dwarf territory or bulk him into a combat brute.
- The strongest identity shape should be a large board or slate clipboard held forward/left, paired with a diagonal pickaxe, measuring rod, or baton on the opposite side.
- Upgrade the badge into a bigger quarry office mark: slate badge, work-order tag, or pinned tally plate. It should read as authority, not jewelry.
- Add a work cap, kerchief, or low brim hat instead of a modern hard hat. The head should say medieval work supervisor, not construction-site cosplay.
- Make the torso more organized than the other quarry workers: belt, pouches, chalk, tally tags, and tool loops. The foreman is dusty, but his gear is arranged.
- Use one strong diagonal only: pick haft over shoulder/back, measuring rod across the hip, or rolled work order tucked under the arm. More than one will clutter the gallery read.
- Avoid tall helmets, safety vests, glowing ore, noble trim, battle weapons, giant backpack loads, full minecart props, or a desk/stall that would turn him into scenery.

## Color And Material Notes

- Preserve the current dusty brown/stone family, but sharpen material separation: slate gray board, warm leather belt, muted tan shirt, dark boots, dull iron tools, pale chalk mark.
- Suggested palette anchors: apron `#685741`, apron shadow `#3f3325`, shirt `#6d4d31`, dust cloth `#b9a37a`, slate board `#5f625f`, slate highlight `#8e8c88`, dark leather `#4f321f`, tool iron `#aaa69d`, chalk `#d8d0b9`, coal dust `#2b2a26`.
- Use quarry accent colors sparingly: sandstone tan, granite gray, iron brown, coal black, and one small copper/tin ore chip if a sorting sample is needed.
- The clipboard/slate should be one of the highest-contrast objects. It must survive downscale as a real board, not a sleeve patch.
- Keep dust as broad flat color blocks on apron hems, boots, cuffs, and lower face. Do not add noise or speckle textures.
- Metal should be matte and worn. Bright steel edges belong on pick tips, wedges, or chisel heads only.
- Do not let the whole model collapse into brown-on-brown. The slate board, chalk, and dull iron are the readable value breaks.

## Prop And Pose Ideas

- Priority prop: `foreman_slate_work_board`, a larger left-arm board with a dark backing and one or two chunky chalk tally bars. No tiny writing.
- Priority authority cue: `foreman_measuring_rod` or `foreman_pointing_baton`, a short wooden rod used to point toward carts/rocks. This reads as supervisor without needing a modern clipboard pose.
- Mining cue: a worn pickaxe head or compact pick strapped behind the right hip. Keep it smaller than a player's active pickaxe so he reads as manager, not current miner.
- Quarry logistics cue: `foreman_load_tag` or `foreman_ore_token_ring`, a few blocky tags at the belt for cart loads, ore batches, or storehouse tallies.
- Stonework cue: one wedge/chisel pair on the belt, or a tiny row of wedge blocks tucked into a pouch. This ties him to actual stone splitting without crowding the silhouette.
- Optional dust/safety cue: kerchief around neck or lower face, pushed down while talking. It feels medieval worksite-appropriate and avoids a modern respirator.
- Pose target: feet planted, torso squared, board held low-forward, other hand pointing or palm-down as if stopping an unsafe cart.
- Idle animation target for later: check board, tap chalk/rod, glance toward quarry, then return to authoritative neutral. No wild waving; he is controlled and practiced.

## Gallery Scale And Framing Notes

- Keep standard humanoid gallery bounds and floor contact. Authority should come from posture and props, not oversized scale.
- Best angle: front three-quarter with board, badge, belt tags, and one side-mounted pick/rod visible.
- Required thumbnail read order: cap/face, large slate board, dusty apron/vest, diagonal pick or measuring rod, belt tags/chisel, heavy boots.
- Keep side props tight to the body. A full pickaxe or long rod sticking far out will shrink the thumbnail and weaken the human read.
- The board should sit below the face and above the knees. If it climbs too high, it hides expression; if it drops too low, it becomes a random brown slab.
- Compare beside `mainland_borin_ironvein`, `mainland_thrain_deepforge`, `mainland_elira_gemhand`, `tutorial_mining_smithing_instructor`, and `mainland_road_guide`. The Foreman should be the only one that reads as "quarry site supervisor."
- In a four-NPC quarry lineup, the silhouette split should be: Borin short ore appraiser, Thrain advanced forge master, Elira precise jeweler, Foreman human logistics boss.

## Concrete Implementation Guidance For Central Integration

- Later implementation target: `src/js/content/npc-appearance-catalog.js`, inside `buildMainlandQuarryForemanPreset()`, unless the NPC gallery rework introduces a central authored model layer first.
- Preserve identifiers and wiring: `mainland_quarry_foreman`, label `Quarry Foreman`, archetype `south_quarry_foreman`, world `appearanceId`, service ID `merchant:south_quarry_foreman`, spawn ID `npc:south_quarry_foreman`, and NPC gallery actor entry.
- Lowest-risk first pass: keep `buildSmithVariantPreset()` for shared mining/smithing rig scale, but replace the two tiny custom fragments with 10-14 larger foreman-specific fragments.
- Better bespoke pass: if a central authored NPC model layer appears, give him a quarry-worker body instead of a smith clone: lighter apron/vest, larger office board, tighter belt tools, and less inherited forge mass.
- Suggested fragments: `foreman_work_cap`, `foreman_dust_kerchief`, `foreman_slate_work_board`, `foreman_board_clip`, `foreman_chalk_tally_a`, `foreman_chalk_tally_b`, `foreman_slate_badge_large`, `foreman_measuring_rod`, `foreman_pick_haft`, `foreman_pick_head`, `foreman_load_tag_ring`, `foreman_wedge_pouch`, `foreman_chisel_head`, `foreman_boot_dust`.
- If using `clonePresetWithTheme()`, verify theme keys hit inherited fragment role names. Use explicit fragment colors for slate, chalk, pick metal, and belt tags because those are the identity reads.
- Keep the current `foreman_clipboard` idea, but scale and reposition it until it is a primary silhouette object. If it remains tiny, replace it with the larger slate board.
- Do not edit shop economy, dialogue, world placement, mining specs, item catalogs, generated assets, combat systems, or building workbench data during the visual integration pass.
- Suggested later checks after runtime integration: `node .\tools\tests\npc-model-gallery-runtime-guard.js`, then manual `/qa npcgallery` comparison against Borin, Thrain, Elira, the tutorial smith, and the road guide.
- Acceptance target: in the NPC gallery, a viewer should identify "quarry foreman / worksite boss" before reading the nameplate.
