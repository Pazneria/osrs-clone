# Outpost Guide (`mainland_outpost_guide`)

Owned model: Outpost Guide (`mainland_outpost_guide`)

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly NPC gallery model. This brief does not authorize runtime code edits.

## Current Read

- Existing preset: `buildMainlandOutpostGuidePreset()` in `src/js/content/npc-appearance-catalog.js` is a `buildGuideVariantPreset()` clone of the Tutorial Guide, labeled `Outpost Guide`, with archetype `east_outpost_route_guide`.
- Current palette: blue-grey coat `#3f4d5d`, warm shirt `#d8c7a5`, muted brass trim `#b9a15a`, dark blue-grey trousers `#303942`, plus inherited guide hair, face, belt, cuffs, boots, and formal guide posture.
- Current bespoke fragments are only `outpost_badge` on the torso and `travel_satchel` on the lower side. Both are correct ideas, but too small and too generic to beat the inherited Tutorial Guide silhouette at gallery size.
- Placement read: `content/world/regions/main_overworld.json` wires `merchant:east_outpost_caravan_guide` / `npc:east_outpost_caravan_guide` to `appearanceId: "mainland_outpost_guide"` at `(260, 257, 0)`, action `Travel`, `dialogueId: "outpost_guide"`, and home tag `home:outpost_guide_house`.
- Gameplay read: this NPC is the east outpost travel handoff back toward Starter Town, not a merchant, banker, tutorial instructor, or combat guard. His dialogue says the outpost keeps the road honest and supplies moving.
- Neighbor contrast: `mainland_road_guide` already owns map roll plus slim marker staff; `enemy_guard` owns armor, shield, and threat; `mainland_market_trader` owns coin/ledger trade gear. The Outpost Guide should sit between guide and watchman: route authority without combat dominance.

## Guide And Gameplay Role

- World role: stationed road warden for the east outpost, attached to a guide house and caravan/travel service rather than a shop counter.
- Service role: safe-route confirmation, travel dispatch, outpost status, and practical warnings about the northern road.
- Player read: "This person knows whether the road is open, where the caravan stops, and which landmark gets you home."
- Emotional tone: competent, dry, watchful, reassuring. He should feel like the outpost's civilized face at the edge of rougher territory.
- Identity boundary: avoid knight, soldier, town crier, merchant, pilgrim, ranger, or wizard. He can borrow one cue from each world, but the final read must be "official route guide at an outpost."

## Source Inspiration

- OSRS [Gielinor Guide](https://oldschool.runescape.wiki/w/Gielinor_Guide): first-player helper precedent. Borrow the readable steward silhouette and approachable guide energy, but do not keep the plain tutorial-host identity.
- OSRS [Guard](https://oldschool.runescape.wiki/w/Guard): common guards are grounded civic order NPCs with regional visual variation. Borrow "keeps order around here" authority through badge, stance, and official color, not sword/shield combat mass.
- OSRS [Outpost](https://oldschool.runescape.wiki/w/Outpost): outposts are watchtower/road-edge places tied to history, route access, danger nearby, and transport options. Use old road infrastructure, watch-post badge, and practical travel gear rather than derelict-museum detail.
- OSRS [Jorral](https://oldschool.runescape.wiki/w/Jorral): a sensible man stationed at an outpost surrounded by hazards. Useful for the lonely competent caretaker tone, not for historian costume.
- OSRS [Charter ship](https://oldschool.runescape.wiki/w/Charter_ship): travel networks use visible operators, fees, destinations, and map presentation. Borrow the "network dispatcher" read: route token, destination board, or travel docket.
- OSRS [Gnome glider](https://oldschool.runescape.wiki/w/Gnome_glider): another travel network where pilots and named routes matter. Borrow a compact route-marker language rather than flying-specific props.
- Medieval [town waits/watchmen](https://www.britannica.com/topic/wait) and [sentinel origins of town waits](https://www.medievalists.net/2011/08/the-origin-of-the-town-waits-and-the-myth-of-the-watchman-turned-musician/): civic watchmen/sentinels support horn, lantern, staff, and posted alertness as road-warden cues.
- Medieval pilgrim/traveler kit from [Canterbury Cathedral learning](https://learning.canterbury-cathedral.org/pilgrimage/medieval-pilgrimage/) and [Camino pilgrim clothing notes](https://caminotravelcenter.com/blog/do-you-want-to-know-about-medieval-pilgrimsclothing/): broad hat, cloak, staff, satchel, badges, sturdy shoes, and water vessel are strong travel-read shapes. Use secular, OSRS-road versions only.
- Low-poly readability references: Kenney [Mini Characters](https://kenney.nl/assets/mini-characters) and Quaternius [Ultimate Animated Character Pack](https://quaternius.com/packs/ultimatedanimatedcharacter.html). Validate oversized heads/hands, chunky props, simple color blocks, and animation-friendly accessories; do not copy meshes.

## Silhouette Goals

- First read at thumbnail size: blue-grey outpost route warden with official badge, diagonal satchel strap, chunky travel satchel/map case, and one unmistakable route-control prop.
- Strongest differentiator from `mainland_road_guide`: this model should feel more official and stationed. Road Guide is dusty directions; Outpost Guide is checkpoint authority.
- Add one vertical or near-vertical prop, but keep it distinct from the Road Guide's slim marker staff. Best options: a shorter `outpost_warden_staff` with blocky square route pennant, a lantern staff, or a baton-like road marker held close to the body.
- Add a diagonal strap from shoulder to opposite hip. The current side satchel needs a visible strap or it reads as a floating pouch.
- Make the badge bigger and shaped: small shield, octagonal route token, or brass sun/waymark plate. It must read from front view, not only three-quarter.
- Add a low hood, road cap, or short mantle/capelet. This creates outpost-weather protection without turning him into a pilgrim or ranger.
- Keep shoulders less armored than `enemy_guard`. No shield, sword, spearhead, chainmail, helmet, or heavy pauldrons.
- Weight the silhouette at chest, belt, and one hand. He is equipped for roads, not for battle or market trade.

## Color And Material Notes

- Preserve the current slate-blue civic base; it already separates him from green/brown workers and the warmer market trader.
- Break the blue-grey mass with warm travel materials: dark leather strap, tan parchment/map case, dusty boots, and muted brass badge.
- Suggested palette anchors: coat `#3f4d5d`, coat shadow `#2e3845`, shirt `#d8c7a5`, trim/badge `#b9a15a`, badge highlight `#c3a554`, leather `#5b3b25`, satchel `#6b4a2f`, parchment `#d6c08b`, route pennant `#8a4438`, lantern glow `#d6b65a`, boot dust `#8c7759`.
- Use brass as authority, not wealth: badge face, buckle, staff cap, lantern rim, or route-token edge. Keep it dull and faceted.
- Parchment should be chunky off-white/tan with a darker binding strip. No tiny route text; two or three broad line blocks are enough if a map face is added.
- Add one small warm accent, such as oxblood red route pennant or scarf tab, so the model does not become a monochrome blue-grey column.
- Materials should stay flat-colored boxes. No cloth texture, no PBR metal, no readable text, no tiny lantern bars that disappear in the gallery.

## Prop And Pose Ideas

- Priority upgrade: convert `travel_satchel` into `outpost_satchel_body`, `outpost_satchel_flap`, and `outpost_satchel_strap`. The strap is the silhouette; the pouch is the proof.
- Upgrade `outpost_badge` into `outpost_badge_shield`, `outpost_badge_rim`, and optional `outpost_route_token`. Place high on the chest where the shirt panel gives contrast.
- Add one route-control prop:
  - `outpost_warden_staff`, `outpost_staff_cap`, `outpost_route_pennant`, and `outpost_staff_wrap`; or
  - `outpost_shutter_lantern`, `outpost_lantern_handle`, and `outpost_lantern_glow`; or
  - `outpost_route_board` / `outpost_travel_docket` held on the left lower arm.
- If using a staff, keep it close and shorter than full heroic height. It should say "posted guide" rather than "wizard" or "spear guard."
- Optional civic/travel cues: `outpost_small_horn`, `outpost_waystone_charm`, `outpost_boot_dust`, `outpost_map_case`, `outpost_cloaklet`, `outpost_hood_cap`.
- Pose target: boots planted, torso upright, head slightly scanning down-road, staff/lantern hand relaxed, satchel/map hand near the belt. Calm readiness beats big gesturing.
- Idle animation target for later: glance down road, tap staff once, check satchel/map case, return to neutral. No combat flourish, no merchant haggling.

## Gallery Scale And Framing Notes

- Keep standard guide height, floor contact, and humanoid bounds. Identity should come from props and posture, not scale.
- Best gallery angle: front three-quarter with chest badge, diagonal strap, satchel, and route prop visible at once.
- Required thumbnail read order: cap/hood or face, brass badge, diagonal strap, route staff/lantern/board, satchel/map case, dusty boots.
- Staff or lantern must not extend far above the head or wide past the shoulder; the gallery bounds-fit will shrink the whole model.
- Make all route props thick enough for `THUMB_SIZE = 148` style previews. A realistic thin pole or lantern handle will vanish.
- Compare beside `mainland_road_guide`, `enemy_guard`, `mainland_banker`, `mainland_market_trader`, and `tutorial_guide`. The Outpost Guide should be more official than Road Guide, less armed than Guard, less formal than Banker, less commercial than Market Trader, and less welcoming-newbie than Tutorial Guide.
- Do not rely on the guide house, road, caravan, or outpost building to sell the identity. The isolated gallery model must carry the route-warden read alone.

## Concrete Implementation Guidance For Central Integration

- Preserve identifiers and contracts: `mainland_outpost_guide`, label `Outpost Guide`, archetype `east_outpost_route_guide`, preview actor entry, `appearanceId` wiring, service ID `merchant:east_outpost_caravan_guide`, spawn ID `npc:east_outpost_caravan_guide`, `dialogueId: "outpost_guide"`, action `Travel`, and existing travel spawn behavior.
- Later runtime integration should stay in `src/js/content/npc-appearance-catalog.js` inside `buildMainlandOutpostGuidePreset()` unless the NPC gallery rework introduces a central authored model layer first.
- Lowest-risk pass: keep the `buildGuideVariantPreset()` base and current palette, but replace the two tiny extras with 9-14 outpost-specific fragments for strap, badge, satchel, cap/mantle, and one route-control prop.
- Better bespoke pass: still use guide-family proportions and animation, but make the upper body read as a road warden through mantle/cap, official badge, and route prop. Avoid changing world placement, dialogue, travel logic, merchant type, or QA travel commands.
- Suggested fragment names: `outpost_hood_cap`, `outpost_cloaklet`, `outpost_badge_shield`, `outpost_badge_rim`, `outpost_satchel_strap`, `outpost_satchel_body`, `outpost_satchel_flap`, `outpost_map_case`, `outpost_warden_staff`, `outpost_staff_cap`, `outpost_route_pennant`, `outpost_shutter_lantern`, `outpost_lantern_glow`, `outpost_small_horn`, `outpost_boot_dust`.
- If the route staff feels too close to `guide_marker_staff`, choose lantern plus travel docket instead. The model needs one clear route-control prop, not necessarily a second guide staff.
- Appended fragments should use explicit `rgbColor` values; do not assume `clonePresetWithTheme()` will recolor new mainland-only roles.
- Keep additions close to the body. The east outpost guide stands near buildings/roads, and wide props are more likely to clip or shrink the gallery thumbnail.
- Do not import meshes, textures, generated OBJ assets, or external model geometry. Use the existing box-fragment humanoid preset language unless central integration deliberately changes the whole NPC model authoring path.
- Suggested later QA after runtime integration: run `node .\tools\tests\npc-model-gallery-runtime-guard.js`, then manually inspect `/qa npcgallery` with `mainland_outpost_guide` beside `mainland_road_guide`, `enemy_guard`, `mainland_banker`, `mainland_market_trader`, and `tutorial_guide`.
- Success condition: at small gallery size, a fresh viewer should read "official outpost travel guide / road warden" before reading the label.
