# Fishing Supplier (`mainland_fishing_supplier`)

Owned model: Fishing Supplier (`mainland_fishing_supplier`)

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly NPC gallery model. This brief does not authorize runtime code edits.

## Current Read

- Existing preset: `buildMainlandFishingSupplierPreset()` in `src/js/content/npc-appearance-catalog.js` uses `buildFisherVariantPreset()`, cloning the Tutorial Fishing Instructor, relabeling it `Fishing Supplier`, setting archetype `net_and_bait_supplier`, retheming shirt/vest/waders, and adding `bait_tin` plus `folded_net`.
- Inherited visual base: weathered angler hat, beard, waders, vest pockets, belt, gloves, boots, line spool, cork float, and a landing net. It already reads "fishing person," but the shopkeeper read is still thin.
- Current placement: `content/world/regions/main_overworld.json` wires `appearanceId: "mainland_fishing_supplier"` to merchant `fishing_supplier` at the `fishing_supplier_shack`, near the starter fishing route's pier/deep-water edge.
- Gameplay role: sells `small_net`, `fishing_rod`, `harpoon`, and `bait`; buys fishing tools, raw fish, cooked fish, and burnt fish; unlocks raw-fish stock after enough player sales. The supplier is the practical stock keeper, not the quest teacher.
- Main risk: the model can become a duplicate of `mainland_fishing_teacher` or `tutorial_fishing_instructor` because it inherits the same wader-and-hat body. The final model needs more dockside tackle-merchant identity: crates, bait packs, gear bundles, and fish trade tags.

## Service And Gameplay Role

- This NPC is the starter-to-mid fishing shop anchor: reliable, a little blunt, and organized enough to remember supplies when the teacher does not.
- The dialogue voice is practical commerce: bait that works, essentials kept ready, no grand lesson. The model should look like someone who prices stock and keeps tackle dry, not someone demonstrating technique.
- The supplier supports progression from net and rod fishing into harpoon fishing. A visible harpoon or compact harpoon rack matters more here than on the Fishing Teacher.
- Raw-fish resale unlocks mean the NPC also has fishmonger responsibilities. Add fish-market hints, but keep tools and bait first so the silhouette does not turn into a cook or seafood stall.
- Location is a mainland shack by the pier/deep-water edge. The read should be damp dock, bundled rope, tin bait, salt-worn wood, and sturdy waterproof layers.

## Source Inspiration

- OSRS Fishing defines the core equipment language: players match water spots to small nets, rods with bait, and harpoons; basic gear is bought in fishing shops. Use this for the tool hierarchy. Source: https://oldschool.runescape.wiki/w/Fishing
- OSRS Fishing spots summarize common spot modes such as `Net/Bait`, `Cage/Harpoon`, and `Net/Harpoon`. Use those paired method names to decide which props deserve thumbnail priority. Source: https://oldschool.runescape.wiki/w/Fishing_spots
- OSRS Gerrant's Fishy Business is the Port Sarim fishing shop precedent: a compact shop selling nets, rods, harpoons, bait, feathers, and raw fish. Borrow the dense tackle-shop stock idea, not the exact NPC. Source: https://oldschool.runescape.wiki/w/Gerrant%27s_Fishy_Business
- OSRS Harry's Fishing Shop is close to Catherby fishing spots and buys unwanted fish while selling basic equipment. This supports a hybrid tackle-supplier/fish-buyer read near water. Source: https://oldschool.runescape.wiki/w/Harry%27s_Fishing_Shop.
- OSRS Small fishing net is beginner equipment for small fish and a shop-bought object. Represent it as a chunky folded net with a rigid rim or tied bundle, not thin webbing. Source: https://oldschool.runescape.wiki/w/Small_fishing_net
- OSRS Fishing bait is stackable, rod-linked, and consumed on successful catches. A bait tin, bait pack, or little corked jar is the cleanest visual cue; keep any worm/maggot read implied and non-gross. Source: https://oldschool.runescape.wiki/w/Fishing_bait
- OSRS Harpoon is the tuna/swordfish progression tool. Use a short, blunt dock harpoon or strapped pole cue; avoid making it read like a combat spear. Source: https://oldschool.runescape.wiki/w/Harpoon
- OSRS Big fishing net supports the wider net/harpoon family and catches larger sea goods. Use only if the silhouette needs a bigger back/side net; do not let it obscure the supplier's face or torso. Source: https://oldschool.runescape.wiki/w/Big_fishing_net
- Medieval fish market manuscript imagery gives vendor/customer, counter, basket, and fish-display language in a compact public-domain frame. Use horizontal stock presentation and bundled goods as inspiration. Source: https://picryl.com/media/fish-market-ff-50-51-58c532
- `Fishmonger's Stall` by Adriaen van Utrecht is too lavish for OSRS scale, but useful for fishmonger abundance: baskets, barrels, buckets, table edges, and a vendor negotiating over visible stock. Source: https://www.mskgent.be/en/collection/s-10
- Archaeological notes on medieval Thames fishing net technology support practical net sinkers, line, shoreline/boat nets, and portable wicker fish baskets as believable river-worker details. Source: https://archaeologydataservice.ac.uk/archiveDS/archiveDownload?t=arch-457-1%2Fdissemination%2Fpdf%2Fvol16%2FLonArch_16-03%2FLonArch_16-03_05_Granger.pdf
- Kenney Mini Characters validate compact, animation-friendly low-poly humans with readable oversized heads, hands, and props. Use as scale discipline only. Source: https://kenney.nl/assets/mini-characters
- Sketchfab Fisherman Low Poly is a 344-triangle fisherman reference. Use it only to validate how little geometry can still read as "fisherman" when the hat, body blocks, and tool silhouette are clear. Source: https://sketchfab.com/3d-models/fisherman-low-poly-912dbae7421b458fa723d72296991b8a
- Sketchfab Village Character - Fisherman provides a medieval low-poly fisherman/apprentice with a large carrying basket concept. Borrow the "gear carrier" silhouette principle, not mesh, texture, or outfit specifics. Source: https://sketchfab.com/3d-models/village-character-fisherman-c79ae4f48c5643c9a1688e93a350fd69
- OpenGameArt Low Poly RPG Pack is useful for faceted medieval prop restraint: simple crates, sacks, tools, and readable flat-color forms. Source: https://opengameart.org/content/low-poly-rpg-pack

## Silhouette Goals

- First read at thumbnail size: dockside tackle supplier with folded net, bait container, and one harpoon/rod cue. The hat and waders are supporting context, not the whole identity.
- Differentiate from `mainland_fishing_teacher`: teacher should read as patient riverbank mentor; supplier should read as stock keeper with gear bundles and trade goods.
- Differentiate from `tutorial_fishing_instructor`: keep the angler family, but reduce "lesson demonstrator" energy by adding merchant mass around belt, hip, and one side of the torso.
- Build one strong side silhouette: a vertical short harpoon or rod bundle on the back/left side, or a rectangular tackle crate strapped to the hip. This should break the inherited rounded angler shape.
- Keep the folded net large and blocky enough to survive the gallery. Use rim, mesh crosspieces, and sinker dots as chunky geometry, not fine thread.
- Put bait/front-stock cues on the torso front: bait tin, bait pack stack, cork floats, or hanging price tag. Back-only props will vanish in the gallery.
- Avoid a huge fish display that turns him into a cook/fishmonger first. One tuna/swordfish trade tag or small fish crate is enough.
- Avoid spear-warrior posture, oversized lobster pot comedy, pirate captain cues, trawler sailor drama, or a full market stall attached to the character.

## Color And Materials

- Preserve the current damp-earth fisher family: shirt `#7b6846`, vest `#48654d`, waders `#3f514d`, dark boot leather, muted belt, cork, and dull net cord.
- Push the supplier identity with stock-object contrast: galvanized bait tin `#7d8a8a`, pale bait paper `#d5c8a0`, rope/net cord `#c9bb91`, cork float `#b4773f`, float red `#9b2e2a`, wet wood crate `#5a3c25`, and harpoon metal `#9aa0a0`.
- Keep materials flat and low-poly: matte cloth, rubbery/dark waders, dry rope, dull tin, worn wood, and tiny metal only on the harpoon point, tin rim, buckles, and net sinkers.
- Add one fish-trade accent if needed: tuna blue-grey `#4f6f7a` or swordfish slate `#596875`, kept as a tag/sample shape rather than a full shiny fish.
- The model should not become all teal/green. Use tan rope, cork orange, grey tin, wood brown, and one red float so the supplier reads as organized stock instead of a monochrome angler.
- Bait should be visually contained: tin, pouch, jar, or pack. Loose bait dots near the hand will read like dirt or disease at gallery size.

## Prop And Pose Ideas

- Priority prop: `fishing_supplier_tackle_crate`, a compact side crate or hip box with a lid, rope tie, and tiny fish/tool mark. It instantly says "merchant stock."
- Keep and upgrade the existing `bait_tin`: add a lid lip, pale bait-pack label, or small side clasp so it is not just a grey block.
- Keep and upgrade the existing `folded_net`: add a darker rim, two thick mesh bars, and three small sinker beads along one edge.
- Add a short harpoon cue: strapped diagonally behind one shoulder, leaned vertically at the side, or tucked into the crate. It should be shorter than a combat spear and visibly utilitarian.
- Add optional stock details: `cork_float_pair`, `rod_bundle`, `line_spool_stack`, `bait_pack_stack`, `fish_price_tag`, `net_sinker_beads`, and `dock_rope_loop`.
- Pose target: one forearm forward with the folded net or bait tin, the other relaxed near the crate/harpoon as if ready to hand over supplies.
- Idle animation target for later: tiny bait tin lift, net bundle bounce, head glance toward the pier, then back to neutral.
- Trade/talk animation target for later: tap the crate or present the bait tin; do not swing the harpoon.

## Gallery Scale And Framing

- Keep standard humanoid height and floor contact. Identity should come from props and front-stock layering, not global scale.
- Best gallery angle: front three-quarter, with bait tin/front tag visible, folded net on the near side, and harpoon/rod bundle breaking the far-side outline.
- The folded net must not extend so far sideways that the gallery camera shrinks the character. Keep it inside roughly shoulder width plus one small prop margin.
- Thin line, mesh, and fishing-rod elements need boxy exaggeration. Use short rectangular segments and visible color contrast instead of hairline geometry.
- Compare beside `mainland_fishing_teacher`, `tutorial_fishing_instructor`, and `mainland_shopkeeper`. The Fishing Supplier should be the most obviously stocked and trade-oriented fisher.
- Required thumbnail read order: bait tin or tackle crate, folded net, harpoon/rod cue, waders/vest, cork float or line spool, small fish-trade tag.

## Concrete Integration Guidance

- Later implementation target: `src/js/content/npc-appearance-catalog.js`, inside `buildMainlandFishingSupplierPreset()`, unless the central NPC gallery/model rework introduces a dedicated authored model layer first.
- Preserve authored identifiers: `mainland_fishing_supplier`, label `Fishing Supplier`, archetype `net_and_bait_supplier`, world `appearanceId`, service ID `merchant:fishing_supplier`, spawn ID `npc:fishing_supplier`, merchant ID `fishing_supplier`, dialogue ID `fishing_supplier`, and NPC gallery preview actor entry.
- Lowest-risk pass: keep the current `buildFisherVariantPreset()` inheritance, retain waders/hat/vest, enlarge supplier-specific front props, and add 8-12 `fishing_supplier_*` fragments.
- Better bespoke pass: move from direct Tutorial Fishing Instructor clone to a lighter dock merchant body with shorter waders, a sturdier vest, side crate, and purpose-built stock props. Keep the fisher rig scale and animation assumptions.
- Suggested fragments: `fishing_supplier_tackle_crate`, `fishing_supplier_crate_lid`, `fishing_supplier_bait_tin_lid`, `fishing_supplier_bait_pack_label`, `fishing_supplier_folded_net_rim`, `fishing_supplier_net_mesh_cross`, `fishing_supplier_net_sinker_beads`, `fishing_supplier_short_harpoon_handle`, `fishing_supplier_short_harpoon_tip`, `fishing_supplier_cork_float_pair`, `fishing_supplier_rod_bundle`, `fishing_supplier_fish_price_tag`, `fishing_supplier_dock_rope_loop`.
- Keep the existing `bait_tin` and `folded_net` names only if they remain visually clear; otherwise replace with more specific `fishing_supplier_*` roles so later review can identify owned fragments.
- If using `clonePresetWithTheme()`, verify theme keys hit the inherited fragment role substrings. Add explicit colors for new supplier fragments instead of relying on broad role replacement.
- Do not edit merchant stock, fishing economy, raw-fish unlock rules, quest rewards, dialogue, world placement, generated assets, item icons, or combat/tool stats as part of this model pass.
- Likely failure modes to guard against: fishing teacher duplicate, generic shopkeeper, combat spearman, pirate sailor, seafood cook, unreadable net mesh, bait tin hidden by arm pose, brown-on-brown crate clutter, or prop sprawl that shrinks the model in the gallery.
- Suggested checks for later runtime work: `node .\tools\tests\npc-model-gallery-runtime-guard.js`, followed by manual `/qa npcgallery` inspection. This brief itself requires no runtime test.
