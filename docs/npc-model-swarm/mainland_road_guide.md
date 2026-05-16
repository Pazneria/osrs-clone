# Road Guide (`mainland_road_guide`)

Owned model: Road Guide (`mainland_road_guide`)

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly NPC gallery model. This brief does not authorize runtime code edits.

## Current Read

- Existing preset: `buildMainlandRoadGuidePreset()` in `src/js/content/npc-appearance-catalog.js` calls `buildGuideVariantPreset()`, cloning `buildTutorialGuidePreset()`, relabeling it as `Road Guide`, setting archetype `starter_route_guide`, and adding two route props.
- Current palette: green-gray coat `#385048`, warm linen shirt `#dfd0aa`, road-gold trim `#d19a45`, inherited dark trousers/belt/boots. This already reads helpful and civic, but needs more road dust and travel kit.
- Current bespoke fragments are `guide_map_roll` on the torso and `guide_marker_staff` on the right lower arm. They are correct concepts, but too thin/small to carry the gallery thumbnail alone.
- Inherited visual base: tidy Tutorial Guide face, formal coat front, pale shirt panel, belt buckle, clean boots, and simple bare hair cap. The risk is "recolored Tutorial Guide with a stick" unless the silhouette owns route signage, map handling, and travel gear.
- Placement read: `content/world/regions/main_overworld.json` uses this appearance twice. `merchant:starter_caravan_guide` is a `Travel` NPC at the Road Guide Hut, while `merchant:north_woodwatch_guide` is a `Talk-to` travel-flavor NPC at North Woodwatch.
- Worldbuilding read: the starter placement sits beside an intact frontier timber hut; the northern placement belongs to a sparse woodcutting watch post where roads, yew trees, and frontier travel start to feel occupied.
- Identity boundary: this model must cover both "starter route guide" and "Woodwatch Guide", so avoid a one-off caravan uniform or a north-only forester costume.

## Guide And Gameplay Role

- World role: a practical route handler who makes mainland travel feel authored, safe enough, and grounded in roads rather than instant UI teleporting.
- Service role: the starter guide is the visible travel link between settlement nodes; the northern guide reinforces the idea that roads have keepers, warnings, and local knowledge.
- Player read: "I know the roads, I can point you the right way, and I have walked this route recently."
- Tone: helpful, weathered, alert, and slightly official. He should feel trusted by caravans and new players, not like a noble, shopkeeper, guard, wizard, or scavenger.
- Gameplay clarity: the model should imply travel/service before dialogue text appears. Staff, map, sign tabs, satchel, and route badge matter more than facial detail.
- Contrast target: more mobile and outdoors than `tutorial_guide`; more civic and route-specific than `mainland_forester_teacher`; less commercial than `mainland_market_trader`; less fortified than `enemy_guard`; less outpost-coded than `mainland_outpost_guide`.

## Source Inspiration

- OSRS [Gielinor Guide](https://oldschool.runescape.wiki/w/Gielinor_Guide): canonical "first guide" precedent. Borrow the approachable tutorial authority and clean human guide read, not a direct outfit copy.
- OSRS [Transportation](https://oldschool.runescape.wiki/w/Transportation): establishes travel as a network of useful route nodes. The Road Guide should look like a human transport node, not just a decorative townsperson.
- OSRS [World map](https://oldschool.runescape.wiki/w/Game_map): the fullscreen map has parchment/scroll behavior, map keys, search, and "you are here" affordances. Use this for rolled map, route mark, and location-pin prop language.
- Official OSRS [World Map](https://oldschool.runescape.com/world-map): broad color and icon inspiration for simplified roads, towns, rivers, and landmark symbols on the guide's map prop.
- OSRS [Sign post](https://oldschool.runescape.wiki/w/Sign_post) and [Signpost (Digsite)](https://oldschool.runescape.wiki/w/Signpost_%28Digsite%29): in-world signposts are simple readable route objects. Borrow thick wooden boards, arrow orientation, and "readable at a glance" construction.
- OSRS [Treasure Trails map clues](https://oldschool.runescape.wiki/w/Treasure_trail_map): rough local maps use landmarks such as roads, rivers, bridges, buildings, and X marks. Good cue for a tiny route map with oversized symbols instead of text.
- Canterbury Cathedral [Medieval Pilgrimage](https://learning.canterbury-cathedral.org/pilgrimage/medieval-pilgrimage/): simple travel clothing, wooden staff, broad-brimmed hat, and badge language are useful for medieval wayfarer credibility.
- Trinity College Dublin [Armagh Satchel](https://www.tcd.ie/library/exhibitions/directors-choice/armagh-satchel/): thick cowhide book/satchel construction and brass closure inspire a compact, hard-wearing map case.
- Medievalists.net [How Messages were sent in the Middle Ages](https://www.medievalists.net/2023/06/messages-middle-ages/): travel, sealed documents, passable roads, and trusted messengers support a courier-guide read with wax seal, route token, and weathered kit.
- Medievalists.net [Messengers in Later Medieval England](https://www.medievalists.net/2017/11/messengers-later-medieval-england/): messengership as a recognized communication role supports the Road Guide as an official-ish information carrier rather than a random wanderer.
- Kenney [Mini Characters](https://kenney.nl/assets/mini-characters): compact low-poly character readability reference. Validate oversized head/hand proportions, sturdy accessories, and thumbnail-safe silhouettes.
- KayKit [Characters: Adventurers](https://kaylousberg.com/game-assets/characters-adventurers): useful low-poly production reference for rigged, optimized characters with simple accessories and atlas-like color discipline.
- Behance [Low Poly Fantasy Medieval Doctor](https://www.behance.net/gallery/29532807/Low-Poly-Fantasy-Medieval-Doctor?locale=en_US): good reference for a rural medieval NPC built from strong silhouettes, slight exaggeration, simple surfaces, and hand-painted color blocking.
- The Portable City [Low Poly Medieval NPCs](https://www.portablecity.net/character-design-low-poly-medieval-npcs/): visual reminder that flat-shaded medieval NPCs can read through shape clusters and costume role before fine detail.

## Silhouette Goals

- First read at thumbnail size: green-gray road guide with a diagonal satchel strap, rolled/folded map, planted guide staff, and one chunky signpost/route-marker cue.
- Upgrade the current staff from "thin marker stick" to `road_guide_route_staff`: a sturdy wooden staff about shoulder height, with one or two thick arrow tabs or a capped marker block near the top.
- Keep the staff visibly non-combat. No spear tip, blade, glowing gem, or guard posture. It should feel like a walking staff and route pointer.
- Add a travel hat or cap. A low broad-brim hat, folded road cap, or cloth hood with a small badge will separate him from the bare-headed Tutorial Guide without making him a pilgrim copy.
- Use one strong diagonal across the torso: leather map-case strap from shoulder to hip. This breaks the formal guide rectangle and says "mobile route worker."
- Make the map prop front-readable. The current torso roll can become a larger rolled map tube, folded parchment board, or half-open local map with two oversized road lines and a big X/arrow.
- Add hip-side volume: a compact hard satchel/map case, wax-sealed route pouch, or survey token. Keep it below the belt so the pale shirt panel stays visible behind the strap.
- Give boots and lower legs a road-worn read: slightly chunkier cuffs, darker boot soles, or dust bands. This tells the player he walks routes instead of standing behind a counter.
- Avoid full environmental props: no freestanding signpost, no cart, no horse tack, no huge backpack tower, no campsite, no road milestone taller than the NPC.

## Color And Material Notes

- Preserve the current base: coat `#385048`, shirt `#dfd0aa`, trim `#d19a45`. These already distinguish him from brown traders and darker guards.
- Add road-wear warmth through leather and dust rather than changing the coat family. Suggested anchors: dark leather `#4f321f`, satchel leather `#7a5632`, worn edge `#9a6b3b`, road dust `#9f8361`, boot sole `#1f1712`.
- Parchment should be large, warm, and matte: map base `#d7c28e`, map shadow `#a98d58`, ink/route marks `#5b4932`, safe-route accent `#b9852f`.
- Staff and sign tabs should use weathered wood: main shaft `#7a5632`, darker grain/block faces `#553820`, carved tab edge `#9c7344`.
- Metal should be restrained dull brass, not treasure gold: buckle, route badge, wax-seal ring, staff cap, or map-case clasp around `#b89545` / `#c49a3a`.
- Add one small route signal color only if needed: muted red wax `#8f3f31` or blue-green map pin `#4d6f6a`. Keep it tiny so the model stays OSRS-like and practical.
- No text labels on the sign tabs or map. Use blocky arrows, dots, bends, and X marks. Tiny writing will shimmer or vanish in the gallery.
- Keep surfaces flat and faceted. No realistic cloth weave, no glossy leather, no procedural dirt noise, no thin alpha straps.

## Prop And Pose Ideas

- Priority prop: `road_guide_route_staff`, attached to the right lower arm, with `road_guide_staff_cap`, `road_guide_sign_tab_upper`, and `road_guide_sign_tab_lower` as chunky boxes.
- Map upgrade: replace or augment `guide_map_roll` with `road_guide_map_roll_large`, `road_guide_map_wrap`, and `road_guide_route_marks`. If a folded map reads better, use `road_guide_folded_map_board` on the left lower arm.
- Travel kit: `road_guide_satchel_strap_upper`, `road_guide_satchel_strap_lower`, `road_guide_map_case`, and `road_guide_case_clasp`.
- Official-ish marker: `road_guide_route_badge` on chest or hat, shaped like a small brass waypoint disk or road token. This can distinguish him from a random pilgrim.
- Hat/cap cluster: `road_guide_low_brim_hat`, `road_guide_hat_band`, and optional `road_guide_hat_badge`. Keep the brim thick and low-poly; avoid a wizard cone or noble feather.
- Courier detail: `road_guide_wax_seal`, `road_guide_message_tube`, or `road_guide_route_tags` on the satchel. Use one, not all three, unless the central model pass needs extra identity.
- Pose target: boots planted but asymmetrical, torso upright, head slightly turned down-road, right hand resting on the staff, left hand presenting or holding the map outward.
- Idle animation target for later: staff tap, quick glance at map, tiny point down-road, return to neutral. No frantic waving; he is practiced and patient.
- Interaction animation target for later: raise map a little, rotate staff tab toward the destination, nod.

## Gallery Scale And Framing Notes

- Keep standard humanoid height and floor contact. The staff may extend near head height, but should not force the camera to zoom out.
- Best gallery angle: front three-quarter with staff/sign tabs on one side, map/satchel on the other, diagonal strap across the pale shirt panel, and boots visible.
- Thumbnail read order: hat/cap, pale shirt and green-gray coat, diagonal strap, map, staff sign-tabs, satchel, dusty boots.
- Oversize route props by 1.5-2x compared with realism. The map, sign tabs, wax seal, badge, and satchel clasp should read as icons.
- Keep sign tabs thick enough to survive downscale. Hairline arrows, small text, or narrow planks will disappear and leave only a stick.
- Do not let the staff hide the face or shirt panel from the gallery camera. Place it slightly outboard and angled forward.
- Compare beside `tutorial_guide`, `mainland_outpost_guide`, `mainland_market_trader`, `mainland_forester_teacher`, and `enemy_guard`. Road Guide should read as route service, not tutorial clerk, outpost officer, trader, woodsman, or soldier.
- Because the same model serves two placements, avoid a location-specific color badge such as "starter town only" or "north woods only." Use universal road/travel language.

## Concrete Implementation Guidance

- Preserve identifiers: `mainland_road_guide`, label `Road Guide`, archetype `starter_route_guide`, preview actor entry, and both world placements that reference `appearanceId: "mainland_road_guide"`.
- Preserve service wiring: `merchant:starter_caravan_guide` / `npc:starter_caravan_guide` with `dialogueId: "road_guide"` and `Travel`, plus `merchant:north_woodwatch_guide` / `npc:north_woodwatch_guide` with `dialogueId: "outpost_guide"` and north travel tags.
- Later runtime integration should stay in `src/js/content/npc-appearance-catalog.js` inside `buildMainlandRoadGuidePreset()` unless the central NPC gallery rework introduces a dedicated authored model layer first.
- Lowest-risk pass: keep `buildGuideVariantPreset()`, preserve the current palette, and expand the `extraFragments` list from two cues to roughly 10-14 route-specific fragments.
- Better bespoke pass: still use the Tutorial Guide proportions, but add a low travel hat, diagonal satchel strap, larger map prop, map case, chunky route staff, and small route badge.
- Suggested fragments: `road_guide_low_brim_hat`, `road_guide_hat_band`, `road_guide_hat_badge`, `road_guide_satchel_strap_upper`, `road_guide_satchel_strap_lower`, `road_guide_map_case`, `road_guide_case_clasp`, `road_guide_map_roll_large`, `road_guide_map_wrap`, `road_guide_route_marks`, `road_guide_route_staff`, `road_guide_staff_cap`, `road_guide_sign_tab_upper`, `road_guide_sign_tab_lower`, `road_guide_route_badge`, `road_guide_boot_dust_left`, `road_guide_boot_dust_right`.
- If fragment budget gets tight, prioritize strap, large map, staff tabs, and hat. Those four cues are the model.
- If the staff/sign combo becomes too visually noisy, collapse it into a plain walking staff plus a brass route badge. A clean guide read is better than a miniature signpost that muddies the silhouette.
- If the central integration moves to authored meshes/GLB later, keep the same visual contract: flat materials, blocky hands/props, floor contact at current humanoid scale, no environment props baked into the character, and the staff within gallery frame.
- Do not edit world placement, travel destination data, dialogue catalogs, merchant stock, building workbench files, generated assets, item icons, or held-item runtime logic as part of this model integration.
- Likely failure modes to guard against: Tutorial Guide duplicate, magic staff read, spear/guard read, merchant satchel overload, unreadable thin sign tabs, map too small, palette collapsing into one green-brown mass, or over-specific starter/north styling.
- Suggested later checks for runtime work: `node .\tools\tests\npc-model-gallery-runtime-guard.js`, then manual `/qa npcgallery` inspection beside the comparison NPCs above. This brief itself requires no runtime test.
- Success condition: at small gallery size, a fresh viewer should say "road guide who handles travel routes" before reading the label.
