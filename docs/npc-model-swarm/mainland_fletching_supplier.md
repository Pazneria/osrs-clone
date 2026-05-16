# Fletching Supplier (`mainland_fletching_supplier`)

Owned model: Fletching Supplier (`mainland_fletching_supplier`)

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly NPC gallery model. This brief does not authorize runtime code edits.

## Current Read

- Existing preset: `buildMainlandFletchingSupplierPreset()` in `src/js/content/npc-appearance-catalog.js` uses `buildWorkerVariantPreset()`, labels the NPC `Fletching Supplier`, sets archetype `feather_and_string_vendor`, and themes the worker with brown shirt `#6f4931`, muted green vest `#4b5a38`, and tan plaid `#8f6d45`.
- Current bespoke fragments are exactly right in topic but too quiet: `fletching_feather_bundle` on the torso and `fletching_string_spool` at the opposite hip. At gallery size this risks reading as "green/brown worker with two small badges."
- Placement read: `content/world/regions/main_overworld.json` places `appearanceId: "mainland_fletching_supplier"` at `north_woodwatch_fletchers_workshop`, tagged `merchant`, `fletching`, `north`, `woodcutting`, `settlement`, and `shop`.
- Gameplay read: this is the starter fletching component vendor, not the master buyer. The live merchant table buys and sells only `knife`, `feathers_bundle`, and `bow_string`.
- Dialogue read: "Strings, feathers, knives. If it keeps wood moving, I can probably hand it over." The model should feel brisk, practical, stocked, and tutorial-adjacent without becoming a ranged combat instructor.
- Neighbor contrast: `mainland_advanced_fletcher` owns yew grading, finished bows, and expert bowyer prestige. This supplier owns raw starter components, bundles, simple tools, and the approachable shop counter read.

## Service And Gameplay Role

- World role: component seller stationed at the Woodwatch fletchers workshop, serving the early loop between woodcutting, bow-making, and basic ranged supplies.
- Merchant role: sells and buys the three starter essentials: knife, feathers, and bow string. The silhouette must make those three items obvious before the label is read.
- Player read: "I can start fletching here." The model should be less prestigious than the Advanced Fletcher but more specialized than a general shopkeeper.
- Gameplay tone: a friendly supply clerk or bench-side craft vendor, not a combat trainer. He supports production by keeping consumables and tools in reach.
- Identity boundary: avoid big finished bows, skillcape glamour, a heroic archer stance, or a full quiver-dominant silhouette. Finished bow mastery belongs next door; this NPC is about inputs.

## Source Inspiration

- OSRS [Fletching](https://oldschool.runescape.wiki/w/Fletching): use the starter material grammar of knife-on-logs, bow strings from flax, feathers, arrow shafts, and headless arrows. The supplier should visually sell the process, not just the outcome.
- OSRS [Hickton](https://oldschool.runescape.wiki/w/Hickton): Hickton is the master fletcher and archery shop owner in Catherby. Borrow the shopkeeping/fletching precedent, but keep this NPC humbler and component-focused.
- OSRS [Hickton's Archery Emporium](https://oldschool.runescape.wiki/w/Hickton%27s_Archery_Emporium.): useful shop precedent for archery goods and arrowtip stock. The supplier can nod to stocked bins and arrow parts without copying Hickton's master-shop role.
- OSRS [Bow string](https://oldschool.runescape.wiki/w/Bow_string): bow strings are created from flax on spinning wheels and attach to unstrung bows. Use a pale spool, loop, or hanging string hank as a primary prop.
- OSRS [Feather](https://oldschool.runescape.wiki/w/Feather): feathers are shared by Fishing and Fletching and are used for arrows, darts, and bolts. Use off-white feather bundles, not colorful fantasy plumes.
- OSRS [Arrow shaft](https://oldschool.runescape.wiki/w/Arrow_shaft) and [Headless arrow](https://oldschool.runescape.wiki/w/Headless_arrow): starter arrows move from shafts plus feathers to headless arrows, then arrowtips. This supports a small shaft bundle and a few fletched-but-headless samples.
- OSRS [Knife](https://oldschool.runescape.wiki/w/Knife): the knife is the first fletching tool for arrow shafts and unstrung bows. Represent it as a chunky belt knife or bench knife, visible but not weaponlike.
- Heritage Crafts [Bowyery](https://heritagecrafts.org.uk/craft/bowyery/): real bowyery cues include yew, drawknife/rasp shaping, tillering, and horn nocks. Use these sparingly as workshop background flavor; the supplier should carry simple stock more than expert tillering equipment.
- Bow International on [medieval arrow transport](https://www.bow-international.com/features/history-of-archery-how-medieval-arrows-were-transported/): hip/belt arrow storage and bundled arrows are better craft-vendor cues than a fantasy back quiver.
- Britannica [Bowstring](https://www.britannica.com/technology/bowstring): medieval longbow strings often used linen or hemp. Use natural linen/off-white material notes for the spool and loops.
- Low-poly readability references: Kenney [Mini Characters](https://kenney.nl/assets/mini-characters) for compact animated humanoid proportions, OpenGameArt [Low Poly RPG Pack](https://opengameart.org/content/low-poly-rpg-pack) for chunky faceted prop simplification, and Sketchfab [Stylized Low Poly Merchant Character](https://sketchfab.com/3d-models/stylized-low-poly-merchant-character-743640251a2e4349b9526787e8a82bee) for generic merchant layering. Use them as readability checklists, not geometry sources.

## Silhouette Goals

- First read at thumbnail size: starter fletching-supply vendor with feather bundle, string spool, belt knife, and small shaft bundle.
- Keep the current worker body, but make the supply kit larger and more spatial: one shoulder/torso bundle, one hip spool, one belt knife, and one hand-held or side-pocket arrow-shaft sample.
- Build one strong diagonal across the torso with either a feather strap, cord loop, or tied supply band. This breaks the worker rectangle and gives a "mobile stock clerk" read.
- Make the feather bundle taller and more fan-shaped than the current small rectangular patch. Three to five blocky feather blades, all off-white/tan with darker stems, will read better than one flat slab.
- Make the bow-string spool a real object: round-ish square cylinder, pale string wrap, dark wooden core, and one dangling loop. It should be visible from front three-quarter.
- Add a short fletching knife at belt height, angled downward, with a dull steel blade and brown grip. It must read as a craft knife, not a dagger or weapon.
- Add a compact arrow-shaft bundle or headless-arrow sample near one hand or hip. Use simple tan rods with tiny pale fletch caps, not a full combat quiver.
- Avoid a full longbow silhouette, heroic archer posture, back quiver tower, cape, helmet, or large bowyer stave. Those all push into `mainland_advanced_fletcher` or `tutorial_ranged_instructor`.

## Color And Material Notes

- Preserve the existing fletching palette: brown shirt `#6f4931`, muted green vest `#4b5a38`, tan plaid `#8f6d45`, warm leather, pale feathers, and linen string.
- Shirt and vest should stay earthy and civilian. The green vest can cue fletching/woodland trade, while the brown shirt keeps him grounded as a worker.
- Feathers should be matte off-white, cream, and gray-beige, with slightly darker quills. Keep them bright enough to survive against the torso but not pure white.
- Bow string should be natural linen/hemp: `#d5c28e`, `#e2d4aa`, or similar. Add one darker shadow band around the spool so it does not become a flat yellow disk.
- Wood and shafts should be pale tan to mid brown, distinct from leather: use `#b88a52` or `#a8743f` for shafts and darker `#6b4428` for spool core.
- Leather should carry the vendor kit: dark belt, pouch flap, supply strap, knife sheath, and maybe a small apron patch.
- Metal should be minimal dull steel for the knife blade and tiny buckles only. No armor plates, no polished arrowhead focus, no broad metal read.
- Optional accent: one restrained brass counter token, pin, or buckle. Keep gold tiny; this NPC is useful and stocked, not prestigious.

## Prop And Pose Ideas

- Priority prop: `fletching_supplier_feather_fan`, a front/side torso bundle of 3-5 chunky feathers tied with a brown band.
- Priority prop: `fletching_supplier_string_spool`, a hip spool with a visible pale wrap and a short hanging loop or tail.
- Priority prop: `fletching_supplier_belt_knife`, a short craft knife in a sheath, placed on the front belt or side hip where it does not read as combat gear.
- Secondary prop: `fletching_supplier_shaft_bundle`, 4-6 short tan rods tied together, preferably angled at the opposite hip from the spool.
- Secondary prop: `fletching_supplier_headless_arrow_sample`, one oversized sample with pale fletching at the back and no metal arrowhead, useful if rods alone look like sticks.
- Optional stock cues: `fletching_supplier_string_hank`, `fletching_supplier_flax_twist`, `fletching_supplier_supply_pouch`, `fletching_supplier_counter_tag`, and `fletching_supplier_feather_tie`.
- Pose target: relaxed shop-worker stance, boots planted, torso open, one hand near the spool/cord as if offering string, the other close to the knife or shaft bundle.
- Idle animation target for later: feather bundle bob, thumb checks the string loop, tiny belt-knife tap, then return to neutral.
- Trade/talk animation target for later: present the spool or feather bundle forward slightly. Do not mime drawing a bow.

## Gallery Scale And Framing Notes

- Keep standard humanoid height and normal worker scale. Identity should come from readable front-loaded props, not a taller body or oversized bow.
- Best gallery angle: front three-quarter with feathers on one torso side, spool at the opposite hip, knife at the belt, and shaft bundle peeking from the side.
- Required thumbnail read order: pale feather fan, round string spool, belt knife, green vest, shaft/headless-arrow bundle, leather supply strap.
- The spool and feathers must be chunkier than real scale. Thin string lines, individual feather barbs, and tiny arrow shafts will vanish at card size.
- Keep props close to the body. A ground crate or floor basket may be appropriate in the world, but it will either crop badly or shrink the gallery model.
- Compare beside `mainland_advanced_fletcher`, `tutorial_ranged_instructor`, `mainland_market_trader`, and `mainland_shopkeeper`. The supplier should be the only one that says "starter fletching components" immediately.
- Avoid too many parallel tan rods on the back; from the gallery camera they can turn into visual noise or look like a quiver. One small front/side bundle is enough.

## Concrete Integration Guidance

- Preserve identifiers: `mainland_fletching_supplier`, label `Fletching Supplier`, archetype `feather_and_string_vendor`, service ID `merchant:fletching_supplier`, spawn ID `npc:fletching_supplier`, merchant ID `fletching_supplier`, dialogue ID `fletching_supplier`, and the NPC gallery preview actor entry.
- Later runtime integration should stay in `src/js/content/npc-appearance-catalog.js` inside `buildMainlandFletchingSupplierPreset()` unless the central NPC gallery/model rework introduces a dedicated authored model layer first.
- Lowest-risk pass: keep `buildWorkerVariantPreset()`, retain the current shirt/vest/plaid theme, and replace the two tiny custom fragments with 8-12 supplier-specific fragments that enlarge the same idea.
- Better bespoke pass: still use worker proportions, but add a supply strap, clearer vest/apron layering, chunky spool, belt knife, feather fan, and side shaft bundle. This keeps him civilian while making the service role unmistakable.
- Suggested fragments: `fletching_supplier_feather_fan_left`, `fletching_supplier_feather_fan_mid`, `fletching_supplier_feather_fan_right`, `fletching_supplier_feather_tie`, `fletching_supplier_string_spool_core`, `fletching_supplier_string_wrap`, `fletching_supplier_string_loop`, `fletching_supplier_belt_knife_blade`, `fletching_supplier_belt_knife_grip`, `fletching_supplier_knife_sheath`, `fletching_supplier_shaft_bundle`, `fletching_supplier_headless_arrow_sample`, `fletching_supplier_supply_strap`, `fletching_supplier_stock_pouch`.
- Keep fragment count disciplined. Feathers, spool, knife, and shaft bundle are the core; optional pouches and tags come after those reads are solid.
- If the knife looks too combative, shorten the blade, thicken the handle, and put it partly inside a sheath. If the shaft bundle looks like a weapon quiver, move it lower and make it tied-stock rather than wearable ammo.
- Do not edit merchant stock, fletching recipes, dialogue, world placement, item icons, generated models, or generated runtime mirrors during the central visual integration pass.
- Suggested later QA for runtime work: `node .\tools\tests\npc-model-gallery-runtime-guard.js`, then manual `/qa npcgallery` inspection against `mainland_advanced_fletcher`, `tutorial_ranged_instructor`, `mainland_market_trader`, and `mainland_shopkeeper`.
- Success condition: a fresh viewer should say "the feathers/string/knife supplier for fletching" before reading the label.
