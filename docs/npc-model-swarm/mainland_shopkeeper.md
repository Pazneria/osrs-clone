# Shopkeeper (`mainland_shopkeeper`)

Owned model: Shopkeeper (`mainland_shopkeeper`)

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly NPC gallery model. This brief does not authorize runtime code edits.

## Current Read

- Existing preset: `buildMainlandShopkeeperPreset()` in `src/js/content/npc-appearance-catalog.js` uses `buildGuideVariantPreset()`, labels the NPC `Shopkeeper`, sets archetype `general_store_shopkeeper`, and themes the guide base with dark green coat `#3b4d31`, cream shirt `#e1d1a5`, muted gold trim `#c8a64c`, and dark brown trousers `#3c382c`.
- Current bespoke fragments are a good first pass but too small: `shop_apron_front`, `shop_apron_pocket`, and a left-arm `price_ledger`. At gallery size he can collapse into "green guide with apron patch."
- Current placement: `content/world/regions/main_overworld.json` wires `appearanceId: "mainland_shopkeeper"` to `merchant:general_store`, spawn `npc:general_store_shopkeeper`, merchant ID `general_store`, action `Trade`, dialogue ID `shopkeeper`, and tags `merchant`, `shop`, `starter`, `home:shopkeeper_house`.
- World context: the area also has a `general_store` structure and `general_store_front_shop_sign`; the NPC should look like the human face of the starter general store even when the gallery removes the counter and sign.
- Gameplay read: broad utility merchant for miscellaneous goods, not a specialty craft supplier, banker, road trader, or quest master. The model should say "sell junk, buy basics, check prices here."
- Main risk: he overlaps `mainland_market_trader` if pushed too mobile or opportunistic, and overlaps `mainland_banker` if ledger/coins become too formal. He needs a counter-bound apron-and-stock silhouette.

## Service And Gameplay Role

- The Shopkeeper is the starter general-store clerk: approachable, practical, slightly busy, and used to players dumping odd inventory into the shop.
- Service fantasy: buy/sell everyday staples, accept miscellaneous tradeable goods, and keep cheap utility stock near the counter.
- Player read: "This is where I sell leftovers and buy the basic tool I forgot." The model should be instantly readable to new players.
- Tone: warm civic worker, not heroic merchant prince. He is reliable and ordinary, with a little shop pride.
- Identity boundary: no balance-scale focus, road pack, market-stall swagger, bank badge, crafting specialty props, or finished weapon/tool showcase. Broad stock is the point.

## Source Inspiration

- OSRS [General store](https://oldschool.runescape.wiki/w/General_store): core reference. General stores appear across Gielinor, accept miscellaneous goods, and stock cheap staples such as pots, jugs, shears, buckets, bowls, tinderboxes, chisels, and hammers. Use these as tiny readable stock cues.
- OSRS [Shop](https://oldschool.runescape.wiki/w/Shop): reinforces the trade action and "currency for items or services" interaction. The NPC should read as a shop access point, not just a townsman.
- OSRS [Shop keeper (Varrock)](https://oldschool.runescape.wiki/w/Shop_keeper_%28Varrock%29): classic general-store human shopkeeper precedent. Borrow the plain, direct service role rather than trying to copy exact old NPC clothing.
- OSRS [Shop assistant (Lumbridge)](https://oldschool.runescape.wiki/w/Shop_assistant_%28Lumbridge%29): general-store helper precedent. Useful for keeping the model approachable and low-level instead of wealthy.
- World History Encyclopedia [Trade in Medieval Europe](https://www.worldhistory.org/article/1301/trade-in-medieval-europe/): medieval markets and shops clustered ordinary sellers, local staples, and small retailers. Use for grounded counter-service energy, not grand bazaar excess.
- Larsdatter [Merchants' Stalls and Shops in the Late Middle Ages and Renaissance](https://www.larsdatter.com/merchantstalls.htm): compact visual index of counters, stalls, shelves, and merchant-facing shop scenes. Good for fold-down counter and wares-on-display cues.
- Wikimedia Commons [Merchants using scales to weigh and bargain](https://commons.wikimedia.org/wiki/File%3AMerchants_using_scales_to_weigh_and_bargain%2C_from_the_manuscript_De_Universo_or_%22De_rerum_naturis%22%2C_Monte_Cassino_MS_Casin_132.jpg): historic scale-and-bargain image. Use only a very small weight/coin cue; scale props are stronger for `mainland_market_trader`.
- Kenney [Mini Characters](https://kenney.nl/assets/mini-characters): low-poly readability reference for compact humanoid proportions, big hands/heads, and simple animated service characters.
- OpenGameArt [Low Poly RPG Pack](https://opengameart.org/content/low-poly-rpg-pack): CC0 low-poly medieval/fantasy prop vocabulary. Use as a simplification check for chunky mugs, bowls, crates, tools, and gold/utility items.
- Sketchfab [Stylized Low Poly Merchant Character](https://sketchfab.com/3d-models/stylized-low-poly-merchant-character-743640251a2e4349b9526787e8a82bee): generic merchant layering reference: tunic, sturdy belt, pouches, boots, readable friendly-worker personality. Do not copy mesh, texture, or exact outfit.

## Silhouette Goals

- First read at thumbnail size: apron-front general-store clerk with price ledger, coin pouch, and two or three basic stock samples.
- Keep the current guide-family height and friendly proportions. Improve identity through apron mass, belt clutter, and hand/counter props rather than body scale.
- Make the apron the primary front shape: wider, lower, and more work-worn than the current small rectangle. Add a pocket or two that read at a distance.
- Use one strong commercial diagonal, but keep it small: a pencil tucked across the ledger, a strap to a side pouch, or a cloth tie across the apron. Avoid the large travel strap reserved for `mainland_market_trader`.
- Add one "general store stock" cluster close to the body: a small bucket/pot/chisel/hammer sample at the hip or lower arm. It should read as miscellaneous basics, not one specialty.
- Add a coin or price cue subordinate to stock: coin pouch, small till token, price tag, or ledger clasp. Avoid turning him into a banker or money changer.
- Head read should be plain and local: short hair or soft cap, tidy moustache optional. No noble hat, wizard hood, guard helmet, or oversized market-turban silhouette.
- Avoid a full counter, floor crate, stall awning, back-pack tower, balance scale as main prop, weapon, or long staff. Those either crop poorly or move the NPC into another service lane.

## Color And Material Notes

- Preserve the current dark green/cream/gold/brown base; it already feels like a mainland shop uniform with enough warmth for the starter town.
- Apron should be warm, scuffed leather or heavy cloth: `#7a5632`, `#8a6740`, `#5b3b24`, and darker pocket seams. It should contrast against the cream shirt and green coat.
- Cream shirt and muted gold trim should stay visible around the apron so he does not become an all-brown worker.
- Goods palette should be deliberately mixed but restrained: pale clay pot, dull steel chisel/hammer head, warm wood handle, tin-gray bucket rim, and one small brass coin/till accent.
- Leather carries the job: belt, pouch, apron tie, ledger binding, pocket flap, and maybe a small key loop.
- Parchment/ledger should be warm tan, not bank-office cream. A darker cover edge and two blocky "price line" strips are enough.
- Keep metal dull and practical. Hammer/chisel steel can be blue-gray; coins and buckle can be muted brass. No polished treasure gold.
- Surfaces should be flat and faceted. No readable text, realistic cloth weave, tiny item labels, PBR shine, or detailed stock icons.

## Prop And Pose Ideas

- Priority prop: `shopkeeper_apron_front_large`, a slightly oversized apron panel with lower pocket volume and visible ties.
- Priority prop: `shopkeeper_price_ledger_board`, replacing or enlarging the current `price_ledger` so it reads as a held price book rather than a sleeve patch.
- Priority prop: `shopkeeper_coin_pouch`, a round-ish hip pouch with flap and tiny brass clasp; it should be smaller than the trader's purse.
- Priority prop: `shopkeeper_utility_stock_cluster`, 2-3 blocky samples such as a clay pot, bucket rim, hammer/chisel, tinderbox, or shears handle.
- Good OSRS stock cues: pot, jug, bucket, bowl, shears, tinderbox, chisel, hammer. Pick only two or three to avoid toy-shelf noise.
- Optional prop: `shopkeeper_counter_key`, a tiny brass key loop on the belt. Useful if coin pouch reads too much like `mainland_market_trader`.
- Optional face detail: `shopkeeper_soft_cap`, `shopkeeper_moustache`, or heavier brows. Use one, not all, so the apron and stock remain the identity.
- Pose target: feet planted, torso square to the customer, ledger arm slightly forward, other hand near apron pocket or presenting a small stock item.
- Idle animation target for later: glance down at ledger, tap apron pocket, adjust coin pouch, return to neutral.
- Trade animation target for later: lift ledger or stock sample forward a few degrees. No broad sales-barker wave.

## Gallery Scale And Framing Notes

- Keep standard humanoid height, floor contact, and guide-family proportions. He should be approachable and starter-town scale.
- Best gallery angle: front three-quarter with apron, ledger thickness, hip pouch, and stock cluster all visible.
- Required thumbnail read order: apron, ledger, stock sample, coin pouch, green coat/cream shirt, face/cap.
- Stock samples must be chunky and close to the torso or belt. Realistic thin shears, chisel points, or price tags will disappear.
- Do not rely on the general store sign, counter, or building shell. The isolated gallery model must still read as the general-store NPC.
- Compare beside `mainland_market_trader`, `mainland_banker`, `mainland_fletching_supplier`, and `mainland_road_guide`. The Shopkeeper should be more counter-bound than the trader, less official than the banker, broader than the fletching supplier, and more commercial than the guide.
- If the model reads as "merchant" but not "general store," add basic-stock shapes. If it reads as "tool seller," reduce hammer/chisel and add pot/bucket/jug variety.

## Concrete Integration Guidance

- Preserve identifiers and wiring: `mainland_shopkeeper`, label `Shopkeeper`, archetype `general_store_shopkeeper`, service ID `merchant:general_store`, spawn ID `npc:general_store_shopkeeper`, merchant ID `general_store`, dialogue ID `shopkeeper`, and the NPC gallery preview actor entry.
- Later runtime work should stay in `src/js/content/npc-appearance-catalog.js` inside `buildMainlandShopkeeperPreset()` unless the central NPC model/gallery rework introduces a dedicated authored model layer first.
- Lowest-risk pass: keep `buildGuideVariantPreset()`, preserve the current palette, enlarge the apron and ledger, then add 6-10 explicit shopkeeper fragments for stock, pouch, ties, and pocket depth.
- Better bespoke pass: still use guide proportions, but reshape the torso read around a heavy apron, one hand ledger, one hip coin/stock cluster, and a small cap or face detail.
- Suggested fragments: `shopkeeper_apron_front_large`, `shopkeeper_apron_tie_left`, `shopkeeper_apron_tie_right`, `shopkeeper_apron_pocket_deep`, `shopkeeper_price_ledger_board`, `shopkeeper_ledger_pages`, `shopkeeper_ledger_clasp`, `shopkeeper_coin_pouch`, `shopkeeper_pouch_flap`, `shopkeeper_utility_pot`, `shopkeeper_bucket_rim`, `shopkeeper_hammer_head`, `shopkeeper_hammer_handle`, `shopkeeper_tinderbox`, `shopkeeper_counter_key`, `shopkeeper_soft_cap`.
- Keep fragment count disciplined. Apron, ledger, pouch, and mixed basic stock are the model; everything else is support.
- Extra fragments appended through the current clone path need explicit `rgbColor` values because `clonePresetWithTheme()` only recolors fragments copied from the base.
- Avoid detached counter or floor-crate fragments in the NPC preset. World props already own the shop sign/counter context, and wide props can clip in booths or gallery framing.
- Do not edit shop economy, stock tables, dialogue, world placement, building workbench data, generated assets, item icons, or runtime mirrors during the central visual integration pass.
- Suggested later QA for runtime work: run `node .\tools\tests\npc-model-gallery-runtime-guard.js`, then inspect `/qa npcgallery` with `mainland_shopkeeper` beside `mainland_market_trader`, `mainland_banker`, and `mainland_fletching_supplier`.
- Success condition: a fresh viewer should say "starter general-store shopkeeper" before reading the label.
