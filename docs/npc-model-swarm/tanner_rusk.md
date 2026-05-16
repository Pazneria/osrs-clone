# Tanner Rusk (`tanner_rusk`)

Owned model: Tanner Rusk (`tanner_rusk`)

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly NPC gallery model. This brief does not authorize runtime code edits.

## Current Read

- Current live path: `tanner_rusk` is not yet a central catalog preset in `src/js/content/npc-appearance-catalog.js`. `src/js/player-npc-humanoid-runtime.js` keeps `tanner_rusk` as an allowed NPC preset ID, then falls back to `applyTannerRigBasePose()` and `createTannerHumanoidFragments()`.
- Existing fallback fragments read as a simple apron worker: tan skin, brown hair and small beard, moss-green shirt `#6f8b5e`, darker shirt panel `#4d6341`, ochre apron `#9d6b3c`, apron shadow `#6f4726`, brown gloves `#7b5632`, grey-brown trousers, and dark boots.
- The fallback has no tannery-specific props. At gallery size it says "green-shirt apron NPC" more than "leather supplier, hide processor, and frontier tannery owner."
- World read: `content/world/regions/main_overworld.json` defines a weathered timber workshop labeled `Rusk Tannery`, and the service entry uses `merchantId`, `dialogueId`, and `appearanceId` all set to `tanner_rusk`, tagged `merchant`, `crafting`, `leather`, `market`, and `settlement`.
- Dialogue read: "Hides in, useful leather out" and "Dry them first, then soften them, then cut once" should drive the model. He is practical, sensory, and process-minded, not a generic shop clerk.
- Quest read: `Hides of the Frontier` frames him as a new tannery operator needing rough frontier materials before the yard "starts breathing." This supports a slightly rugged edge, but not a hunter or combat role.

## Service And Gameplay Role

- Tanner Rusk is the leather merchant for early-to-mid crafting equipment assembly. He sells `normal_leather`, `wolf_leather`, and `bear_leather`.
- He buys back leathers, base handles, strapped handles, and finished sword/axe/pickaxe outputs, but strapped handles and finished gear are sold-back stock rather than permanent default goods.
- His visual priority is therefore material conversion and material confidence: he handles hides, grades leather, and understands how leather becomes straps for tool and weapon handles.
- He should sit between `mainland_crafting_teacher` and the fletching/smithing economy. The teacher owns starter tools and instruction; Rusk owns supply, hide preparation, and strap quality.
- Player read: "This is where leather comes from, and this person knows whether a hide will hold a grip." He should feel useful, a little blunt, and physically used to wet, heavy work.

## Source Inspiration

- OSRS [Tanner](https://oldschool.runescape.wiki/w/Tanner): tanners convert hides into leather for a fee, including cowhide into leather or hard leather and dragonhides into dragon leather. Borrow the service clarity: hide in, processed leather out.
- OSRS [Ellis](https://oldschool.runescape.wiki/w/Ellis): the iconic Al Kharid tanner is a human male merchant with Talk-to and Trade options, located near practical craft infrastructure. Use him as service precedent, not as costume copy.
- OSRS [Leather](https://oldschool.runescape.wiki/w/Leather): soft leather comes from tanning cowhide and is used with needle and thread for early leather armour. This supports visible soft leather sheets, thread, and cutting/stitching cues.
- OSRS [Hard leather](https://oldschool.runescape.wiki/w/Hard_leather): hard leather is made by taking cowhides to a tanner, then used with needle and thread for hardleather bodies. This supports a thicker, darker sheet or stiff panel as a secondary prop.
- OSRS [Thread](https://oldschool.runescape.wiki/w/Thread) and [Needle](https://oldschool.runescape.wiki/w/Needle): leather crafting relies on visible thread and a needle; make them chunky and secondary so Rusk does not become the Crafting Teacher.
- OSRS [Crafting Guild](https://oldschool.runescape.wiki/w/Crafting_Guild): the guild places cows, cowhides, a tanner, spinning wheels, moulds, pottery, and aprons in one crafting ecosystem. Borrow the brown-apron workshop language and the cowhide-to-tanner adjacency.
- National Park Service, [Tanning in the Seventeenth Century](https://www.nps.gov/jame/learn/historyculture/tanning-in-the-seventeenth-century.htm): useful for vats, soaked hides, scraping, lime, and oak/beech/willow bark as readable tannery vocabulary.
- Britannica, [Leather](https://www.britannica.com/topic/leather): supports the broader process chain: curing, soaking, dehairing, tanning liquors, vegetable tanning, drying, dyeing, and finishing. Distill this into a few visual props, not a full process diorama.
- Museu de la Pell d'Igualada, [Espais](https://museupelligualada.cat/en/espais/): the old tannery split between ground-floor wet work and upper-floor drying/stretching is a strong model for bucket/vat and stretched-hide cues.
- Identity Leathercraft, [Awls](https://identityleathercraft.com/collections/awls): awls are essential leatherworking hand tools for marking, piercing, stitching holes, and aligning stitch work. Use a blocky awl or scraper as Rusk's hand tool.
- Low-poly discipline references: Kenney [Mini Characters](https://kenney.nl/assets/mini-characters) for compact readable humanoid proportions, Quaternius/OpenGameArt [LowPoly RPG](https://opengameart.org/content/lowpoly-rpg) for simple faceted RPG prop vocabulary, and Sketchfab [The Noble Craftsman](https://sketchfab.com/3d-models/the-noble-craftsman-0e8ff87ffaa24731b2474badebca870d) only as a craftsperson silhouette checklist: apron, belt tools, strong hands, simple massing.

## Silhouette Goals

- First read at thumbnail size: tannery owner with leather apron, rolled hide, hanging strap samples, and a chunky hand tool.
- Keep the apron as the largest front mass, but make it darker, heavier, and more stained than the Crafting Teacher's cleaner brown apron.
- Add one unmistakable hide shape: a rolled leather cylinder at hip, a folded sheet across one forearm, or a small stretched-hide panel behind one shoulder. Do not use gore or raw red-hide language.
- Add one strong vertical or shallow diagonal: a scraper/awl in hand, a strap rack down the side, or a hide roll strapped from shoulder to hip. This breaks the current plain torso block.
- Give him thick forearms, gloves, and water-darkened boots. The work is wet and physical; the silhouette should be grounded at hands and feet.
- Beard and hair can stay modest, but should read more weathered than charming merchant. A square beard or moustache block helps make him older and more practiced.
- Keep tannery props close to the body. A full vat, table, drying frame, or hide rack will shrink the gallery model and become scenery.
- Avoid hunter cosplay, ranger leather armor, combat trophies as primary read, butcher gore, alchemist bottles, smith hammer language, or gem/jewelry cues.

## Color And Material Notes

- Preserve a moss work-shirt base from the fallback so he stays identifiable, but push the dominant mass toward leather and bark browns.
- Suggested leather tier accents: normal leather tan `#9d6b3c`, wolf leather grey-brown `#6b5a48`, bear leather dark umber `#3e2a1f`. Use these as stacked sample strips or hide patches.
- Apron front should be darkened ochre/brown with a lower shadow panel and side ties: worn, waxed, wet at the hem, and not pristine.
- Gloves should be darker than the apron and slightly oversized. They can share the current `#7b5632` family but need stronger contrast against the hide props.
- Tanning materials: bark pouch or bark chips in `#5b3b24`, dull lime/salt residue in off-white `#d8d2bb`, water bucket/rim in muted grey-blue `#59666a`, and scraper metal in dull steel `#b8aa8e`.
- Thread should be off-white and thick enough to see, but it is a secondary cue. Do not make needle/thread the main story because that overlaps the Crafting Teacher.
- Use flat shaded facets and color blocking. No skin pores, fur texture, gore, shiny PBR leather, or tiny stitch decals that collapse at gallery scale.
- Palette should feel earthy but not monochrome: green shirt, tan apron, dark gloves, grey-brown wolf strip, dark bear strip, pale thread/residue, and small steel tool highlights.

## Prop And Pose Ideas

- Priority prop: `rusk_hide_roll`, a short cylinder or folded sheet tucked against the left hip or carried on one forearm.
- Priority hand tool: `rusk_scraper` or `rusk_awl`, oversized enough to read as a leatherworking implement rather than a dagger. Use a wooden handle plus short dull metal blade/point.
- Strong secondary cue: `rusk_strap_samples`, three hanging leather strips on the apron or belt using normal/wolf/bear tones. This directly ties him to strapped handles.
- Optional process cues: `rusk_bark_pouch`, `rusk_lime_stain`, `rusk_thread_spool`, `rusk_hide_tag`, `rusk_bucket_rim`, and `rusk_rolled_pattern`.
- Optional quest nod: one tiny boar-tusk or wolf-fang tally charm on the belt, kept small and desaturated. It should say "frontier supplier contact," not "monster hunter."
- Pose target: boots planted wide, shoulders relaxed but forward, one forearm supporting a hide roll or folded leather sheet, the other hand holding the scraper/awl at rest.
- Head/face target: slight squint, practical beard block, gaze toward the player or down at the hide. He appraises material quality before he appraises the customer.
- Idle animation target for later: lift hide a few degrees, turn wrist with scraper, glance at strap samples, settle back to neutral. Trade/talk can tap the hide roll or present a leather strip.

## Gallery Scale And Framing Notes

- Keep standard humanoid height and floor contact. Rusk should feel heavier through stance, apron, gloves, boots, and props rather than a scale change.
- Best gallery angle: front three-quarter with apron front, hide roll, strap samples, scraper, gloves, and one side pouch all visible.
- Required thumbnail read order: dark leather apron, hide roll/folded sheet, hanging strap samples, gloves, scraper/awl, moss shirt, small bark/thread details.
- Hide props must be chunky and simple. Thin dangling straps need thickness and spacing; one merged dark fringe will read as a skirt.
- If adding a stretched-hide panel, keep it inside shoulder-to-boot bounds and offset behind one side, not above the head. A tall rack would shrink him in the 148 px gallery card.
- Compare beside `mainland_crafting_teacher`, `mainland_market_trader`, `mainland_advanced_fletcher`, `mainland_borin_ironvein`, and `enemy_wolf`/`enemy_bear` leather-source models. Rusk should be the civilian leather processor, not the teacher, trader, bowyer, smith, or animal hunter.
- In dialogue portrait framing, keep the hide roll and scraper high enough to read from torso up. Belt-only props may vanish in portrait crops.

## Concrete Implementation Guidance For Central Integration

- Preserve content contracts: `tanner_rusk` preset ID, label `Tanner Rusk`, world `appearanceId`, `merchant:tanner_rusk`, `npc:tanner_rusk`, merchant ID `tanner_rusk`, dialogue ID `tanner_rusk`, quest giver identity, and NPC gallery actor entry.
- Preferred central pass: create a catalog-owned `tanner_rusk` preset in `src/js/content/npc-appearance-catalog.js` so `resolveCatalogNpcHumanoidPresetId()` can use central authored fragments instead of the old fallback. Keep the fallback only as compatibility while the central rework lands.
- Lowest-risk visual pass: start from the current Tanner fallback proportions, preserve the moss shirt and apron worker read, then add 10-16 `rusk_*` fragments for hide roll, strap samples, scraper/awl, bark pouch, apron stains, gloves, and boots.
- Better bespoke pass: use a worker/crafting body from the central catalog layer with custom tannery fragments, avoiding inheritance from the Crafting Teacher so the two do not share the same starter-tool silhouette.
- Suggested fragments: `rusk_apron_front`, `rusk_apron_shadow_panel`, `rusk_apron_side_tie_left`, `rusk_apron_side_tie_right`, `rusk_hide_roll`, `rusk_folded_hide_edge`, `rusk_strap_sample_normal`, `rusk_strap_sample_wolf`, `rusk_strap_sample_bear`, `rusk_scraper_handle`, `rusk_scraper_blade`, `rusk_bark_pouch`, `rusk_thread_spool`, `rusk_lime_stain`, `rusk_left_work_glove`, `rusk_right_work_glove`, `rusk_boot_wet_hem`, `rusk_frontier_tally_charm`.
- Fragment priorities if budget is tight: apron mass, hide roll, strap samples, scraper, gloves, boots. Bark, thread, stains, and quest charm are optional polish.
- Keep props attached to torso/lower arms. Do not add floor vats, tannery scenery, shop counters, or generated assets during this integration.
- Do not edit shop economy, crafting recipes, quest state, dialogue, world placement, combat drops, item icons, generated OBJ/PNG assets, or runtime tests as part of this model integration.
- Likely failure modes to guard against: generic green apron NPC, Crafting Teacher duplicate, hunter/ranger armor read, butcher/gore read, invisible thin straps, oversized scenery prop, or a brown-on-brown model with no thumbnail contrast.
- Suggested checks for later runtime work: `node .\tools\tests\npc-model-gallery-runtime-guard.js`, `node .\tools\tests\player-npc-humanoid-runtime-guard.js`, then manual `/qa npcgallery` inspection with Rusk beside the Crafting Teacher, Market Trader, Borin, and animal leather-source enemies.
- Success condition: a fresh viewer should say "tanner/leather merchant" before reading the label, and should understand that his leather supports strapped handles and early equipment assembly.
