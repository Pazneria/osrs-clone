# Crossing Trader (`mainland_market_trader`)

Owned model: Crossing Trader (`mainland_market_trader`)

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly NPC gallery model. This brief does not authorize runtime code edits.

## Current Read

- Existing preset: `buildMainlandMarketTraderPreset()` in `src/js/content/npc-appearance-catalog.js` is a `buildGuideVariantPreset()` clone labeled `Crossing Trader`, with archetype `market_crossing_trader`.
- Current palette: brown merchant coat `#5a4632`, warm linen shirt `#e2d0a2`, muted gold trim `#c09a4a`, and dark trousers `#3a332a`. This is already the right family: practical, warm, and road-worn.
- Current bespoke fragments are only `trader_coin_purse` on the torso and `trade_manifest` on the left lower arm. They are good signals, but too small to separate him from a generic guide at gallery size.
- Placement read: `content/world/regions/main_overworld.json` puts `merchant:market_crossing_trader` at Market Crossing, home-tagged to `market_crossing_townhouse`, with `dialogueId: "shopkeeper"` and market/east/settlement tags.
- Workbench read: `content/world/building-workbench/settlements/market_crossing.json` describes the settlement as a compact road-crossing town where trade, art, and travel services cluster around a road; this trader's planned role is "general mainland trade and road rumors."
- Neighbor contrast: `mainland_shopkeeper` owns the starter general-store/apron/ledger read, `mainland_road_guide` owns route guidance, `mainland_banker` owns trust/formality, and `mainland_painter` owns artisan color. The Crossing Trader should land between road broker and marketplace dealer, not overwrite any of those silhouettes.

## Service And Gameplay Role

- World role: the market-town trader at the eastern road crossing, operating from a street-facing townhouse rather than a starter-town general store.
- Service role: general mainland trade, practical supplies, and road rumors. He should look like the person who knows what caravans brought in, what goods are scarce, and which route is worth risking.
- Player read: approachable and useful, but shrewd. The model should imply "I can sell you basics, buy your odd bundle, and tell you which road is paying today."
- Gameplay tone: a step up from the starter shopkeeper, but not a guild master. He belongs to a small civic market with a bank and gallery nearby, not a grand exchange hall.
- Identity boundary: do not make him a crafting teacher, banker, painter, guard, or full wandering adventurer. He is a civilian service NPC with merchant authority.

## Source Inspiration

- OSRS [General store](https://oldschool.runescape.wiki/w/General_store): general stores are the core buy/sell-anything utility fantasy and stock ordinary staples like pots, jugs, buckets, shears, tinderboxes, chisels, and hammers. Borrow the "miscellaneous useful stock" read, not the exact storekeeper costume.
- OSRS [Shop keeper (Varrock)](https://oldschool.runescape.wiki/w/Shop_keeper_%28Varrock%29): classic low-level general-store NPC precedent. Use him as the baseline for simple human shop access, coins, and broad utility.
- OSRS [Trader Stan](https://oldschool.runescape.wiki/w/Trader_Stan): a route-linked trader tied to charter travel, wearing a noticeable warm outfit and selling both common goods and odd port supplies. Good precedent for the Crossing Trader as road broker and logistics merchant.
- OSRS [Rasolo](https://oldschool.runescape.wiki/w/Rasolo): a travelling merchant who buys broadly like a general store, but at harsh prices. Use him for the wandering-stock, hard-bargain angle: coin purse, pack goods, and self-contained trader kit.
- OSRS [Ali Morrisane](https://oldschool.runescape.wiki/w/Ali_Morrisane): a bazaar merchant with a stall, a strong business personality, and post-quest supplier expansion. Use the market-stall charisma and opportunism only; avoid desert-specific costume cues unless Market Crossing later gets a hot-region variant.
- Medieval [Late Medieval Market Scene](https://www.worldhistory.org/image/9760/late-medieval-market-scene/): public-domain 15th-century market imagery supports small tables, bundled goods, counter exchange, and crowded but readable market silhouettes.
- Medievalists.net on [Tacuinum Sanitatis](https://www.medievalists.net/2023/12/medieval-tacuinum-sanitatis/): its daily-life miniatures include merchants, townspeople, and a raisin seller with customer-facing posture. Useful for vendor-customer staging and compact wares.
- Wikimedia Commons [Merchants using scales to weigh and bargain](https://commons.wikimedia.org/wiki/File%3AMerchants_using_scales_to_weigh_and_bargain%2C_from_the_manuscript_De_Universo_or_%22De_rerum_naturis%22%2C_Monte_Cassino_MS_Casin_132.jpg): strong historic cue for a balance scale or weight box as the trader's signature prop.
- Kenney [Mini Characters](https://kenney.nl/assets/mini-characters): small 3D character readability reference. Oversized heads, clear hands, compact props, and CC0 low-detail forms are the right validation lens for gallery thumbnails.
- Sketchfab [Stylized Low Poly Merchant Character](https://sketchfab.com/3d-models/stylized-low-poly-merchant-character-743640251a2e4349b9526787e8a82bee): use only as a generic low-poly merchant checklist: layered tunic, sturdy belt, utility pouches, boots, friendly worker stance. Do not copy geometry.
- Sketchfab [Medieval Market (low poly)](https://sketchfab.com/3d-models/medieval-market-low-poly-a06ad22defbf4b2b8a18193a9189ca56) and [Medieval Market Stall](https://sketchfab.com/3d-models/medieval-market-stall-d0517d1340ac411e966620e4b95d455c): useful for low-poly market prop vocabulary - crates, barrels, awnings, separated simple shapes - but the NPC model should carry only a tiny portable sample of that world.

## Silhouette Goals

- First read at thumbnail size: market-road trader with a warm coat, diagonal satchel strap, visible coin purse, open manifest, and one unmistakable weighing/trade prop.
- Add one strong diagonal across the body. A leather shoulder strap from one shoulder to the opposite hip is the cleanest way to break the guide-clone rectangle and say "mobile trader."
- Make the `trade_manifest` larger and more frontal than the current fragment. It should read as a parchment board or folded ledger, not a tiny beige rectangle.
- Upgrade `trader_coin_purse` into a real hip silhouette: round-ish low-poly pouch, dark flap, brass clasp, maybe a second small weight pouch. It must be visible in front three-quarter.
- Use a compact balance-scale cue: either a short brass scale held in the right hand, a hanging belt scale, or a weight-box charm on the chest. Keep pans blocky and thick; hairline chains will disappear.
- Give him a modest merchant cap or soft coif. A small cap plus tidy moustache/brow would separate him from the bare Tutorial Guide head without making him noble.
- Avoid a full stall, cart, backpack tower, weapon, giant staff, or long hanging scale. Those will shrink the character or push him into guide/adventurer territory.
- The silhouette should be denser at belt and hands, not shoulders. He is prosperous through tools and pouches, not armor.

## Color And Material Notes

- Preserve the current brown/linen/gold base; it already harmonizes with Market Crossing stone/timber and reads civilian.
- Add one richer trader accent inspired by Trader Stan: muted mustard or ochre on cap, sash, or collar trim. Keep it smaller than the coat mass so he does not become a bright uniform NPC.
- Leather should carry the profession: dark belt, shoulder strap, pouch flap, ledger binding, boot cuffs, and small tool loops.
- Metals should be dull brass, not bright gold: scale arm, coin glints, buckle, clasp, and weight blocks. Use tiny highlights only where the thumbnail needs contrast.
- Parchment should be warm off-white/tan and large enough to survive gallery downscale. Add a darker binding edge or clasp rather than text marks.
- Stock samples can add restrained color variety: a red cloth roll, green herb bundle, blue-gray tin, or pale rope coil. Limit to two or three small goods so the model stays OSRS-like and not toy-box noisy.
- Keep surfaces flat and faceted. No PBR shine, no fabric texture, no tiny writing on parchment, no coin decals that only read at full size.
- Suggested palette anchors: coat `#5a4632`, coat shadow `#3e2f23`, linen `#e2d0a2`, brass `#c09a4a`, dark leather `#4b2f1c`, pouch leather `#8b5d2d`, parchment `#dbc58e`, muted mustard `#b9852f`, stock red `#8f4633`, stock green `#4f6b42`.

## Prop And Pose Ideas

- Priority prop: `trader_balance_scale`, a small low-poly brass arm with two thick pan blocks. Best placement is right lower arm or front belt so it faces camera.
- Keep and enlarge `trade_manifest`: a parchment ledger in the left lower arm, angled slightly outward. Add `trader_manifest_binding` or `trader_manifest_clasp` so it reads as an object, not a sleeve patch.
- Upgrade the coin identity: `trader_coin_purse`, `trader_purse_flap`, `trader_coin_clasp`, and maybe `trader_weight_pouch` on the opposite hip.
- Add a shoulder strap: `trader_satchel_strap_upper`, `trader_satchel_strap_lower`, and `trader_side_satchel`. This gives the silhouette a trader/traveler read even before the hand props resolve.
- Optional stock samples: `trader_rope_coil`, `trader_cloth_roll`, `trader_tin`, `trader_pot_sample`, or `trader_small_crate`. Attach them to satchel/torso zones, not the floor, unless the central gallery model layer later supports stable ground props.
- Optional civic marker: a tiny `crossing_trade_badge` or `market_token_pin`, using muted brass, to tie him to Market Crossing rather than a random road merchant.
- Pose target: boots planted, torso upright, head slightly tipped toward the player, left hand holding manifest, right hand offering the scale or open-palm trade gesture.
- Idle animation target for later: tap ledger, check purse, lift scale a few degrees, then return to neutral. No sales barker flailing; he is confident, busy, and practiced.

## Gallery Scale And Framing Notes

- Keep standard humanoid height and floor contact. Build identity through belt/hand props, not scale changes.
- Best gallery angle: front three-quarter with the manifest on one side, coin purse and scale on the other, and the diagonal strap crossing the shirt panel.
- Required thumbnail read order: cap/face, diagonal strap, parchment manifest, coin purse, brass scale, warm coat trim, tiny goods sample.
- Parchment and scale pans must be chunky. If either becomes a thin line, the gallery will read him as "brown guide with a purse."
- Do not let a shoulder satchel or sample crate hide the shirt panel entirely. The pale shirt is useful contrast behind the strap and manifest.
- Compare beside `mainland_shopkeeper`, `mainland_road_guide`, `mainland_painter`, and `mainland_banker`. Crossing Trader should be more mobile than the shopkeeper, more commercial than the guide, less colorful than the painter, and less formal than the banker.
- Avoid a market stall in the model thumbnail. The world already gives him a townhouse merchant desk; the gallery model needs a portable trader kit.

## Concrete Implementation Guidance

- Preserve identifiers: `mainland_market_trader`, label `Crossing Trader`, archetype `market_crossing_trader`, preview actor entry, service ID `merchant:market_crossing_trader`, spawn ID `npc:market_crossing_trader`, and world placement/home tags.
- Later runtime integration should stay in `src/js/content/npc-appearance-catalog.js` inside `buildMainlandMarketTraderPreset()` unless the NPC gallery rework introduces a new central authored model layer first.
- Lowest-risk pass: keep the `buildGuideVariantPreset()` base, preserve the current palette, and replace the two small custom fragments with 10-14 trader-specific fragments that increase silhouette read without changing rig behavior.
- Better bespoke pass: still use the guide humanoid proportions, but add a merchant cap, satchel strap, enlarged manifest, visible coin/weight pouches, and balance scale so he stops reading as a recolored Tutorial Guide.
- Suggested fragment names: `trader_soft_cap`, `trader_brow_moustache`, `trader_satchel_strap_upper`, `trader_satchel_strap_lower`, `trader_side_satchel`, `trader_coin_purse`, `trader_purse_flap`, `trader_manifest_board`, `trader_manifest_binding`, `trader_balance_arm`, `trader_scale_left_pan`, `trader_scale_right_pan`, `trader_weight_pouch`, `trader_rope_coil`, `trader_cloth_roll`, `crossing_trade_badge`.
- Keep fragment count disciplined. Prioritize strap, manifest, purse, and scale before optional goods; those four cues are the model.
- If the scale is too fiddly in runtime geometry, downgrade it to a blocky belt weight-box plus coin purse. A readable weight-box beats an unreadable realistic scale.
- Do not edit shop economy, dialogue, world placement, merchant stock, building workbench files, or generated assets during the central visual integration pass.
- Suggested later QA: run `node .\tools\tests\npc-model-gallery-runtime-guard.js`, then inspect `/qa npcgallery` with `mainland_market_trader` framed beside `mainland_shopkeeper`, `mainland_road_guide`, `mainland_painter`, and `mainland_banker`.
- Success condition: at small gallery size, a fresh viewer should say "market trader at a road crossing" before reading the label.
