# Painter (`mainland_painter`)

Owned model: Painter (`mainland_painter`)

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly NPC gallery model. This brief does not authorize runtime code edits.

## Current Read

- Existing preset: `buildMainlandPainterPreset()` in `src/js/content/npc-appearance-catalog.js` clones `buildTutorialCraftingInstructorPreset()`, relabels it `Painter`, sets archetype `market_crossing_painter`, rethemes the craft base to gray apron, purple shirt, dark trousers, worn leather, muted metal, and warm clay/paint tones, then adds only three painter fragments: `paint_brush_handle`, `paint_brush_tip`, and `paint_swatch_blue`.
- Inherited visual base: because the preset starts from the Tutorial Crafting Instructor, the Painter likely still carries starter-crafting mass and cues such as apron/tool/clay language. That is useful for "artisan," but dangerous if the final read collapses into `mainland_crafting_teacher` plus a tiny brush.
- World placement: `content/world/regions/main_overworld.json` places service `merchant:market_crossing_painter`, spawn `npc:market_crossing_painter`, name `Painter`, `appearanceId: "mainland_painter"`, dialogue `shopkeeper`, and tags `merchant`, `art`, `market`, `settlement`, and `home:market_crossing_gallery`.
- Settlement read: Market Crossing frames this NPC as the home artisan for `painted_gallery`, a compact painted-plaster art shop with an artist workdesk, dye crate, street notice, shop sign, awning, display painting, and wall-art motifs for a portrait study, painted town map, and river crossing mural.
- Main risk: the current model has the right topic but too little volume. At gallery size it can read as "purple crafting instructor with an orange-ended stick" unless the palette/canvas/dye-vial shapes become the first silhouette read.

## Profession And Gameplay Role

- This NPC is the civic color artisan for Market Crossing: part painter, part dye-mixer, part shopfront decorator, part notice-board maker. They make the town feel lived-in and visually distinct rather than teaching a core OSRS skill.
- Gameplay role should feel like a light merchant/flavor NPC until a dedicated art economy exists. The current wiring uses generic shopkeeper dialogue, so the model should carry the role through visuals: commissions, dyes, posters, framed paintings, and practical workshop supplies.
- The Painter sits beside market and crafting identities but should not become a Crafting Teacher, Gemhand jeweler, generic trader, mage, bard, or noble portraitist. The read is local working artisan, not court artist.
- Personality target: busy, observant, slightly paint-smeared, proud of small public works. They are the person who paints signs, maps, door trim, chapel notices, and the odd heroic portrait after enough coins change hands.
- The model should also justify nearby world decor: dye crate, display painting, civic notice board, painted plaster trim, and wall murals. The player should understand why this building is colorful before reading any label.

## Source Inspiration

- OSRS [Dye](https://oldschool.runescape.wiki/w/Dye): standard dyes cover red, orange, yellow, green, blue, purple, and pink/black variants, with primary colors made from redberries, onions, and woad leaves and secondary colors mixed from primaries. Use this as the Painter's color-kit logic.
- OSRS [Aggie](https://oldschool.runescape.wiki/w/Aggie): Aggie is a Draynor dye supplier who turns ingredients into dyes. Borrow the small-bottle, ingredient-to-color service fantasy without copying witch costume language.
- OSRS [Red dye](https://oldschool.runescape.wiki/w/Red_dye): red dye is a little bottle made through Aggie or Ali the dyer and combines with yellow/blue to make orange/purple. This supports a belt row of oversized dye vials as recognizable OSRS-adjacent props.
- OSRS [Painting (scenery)](https://oldschool.runescape.wiki/w/Painting_%28scenery%29): paintings exist widely as aesthetic scenery, with subjects like landscape, mountains, watermill, king, river, tree, and mysterious figure. Use framed panel/canvas cues rather than making the Painter a combat or skilling instructor.
- OSRS [Lumbridge painting](https://oldschool.runescape.wiki/w/Lumbridge_%28painting%29): a POH landscape painting can be bought from Sir Renitee and takes creative liberties with the actual place; the artist name Oxtable nods to John Constable. This supports a small landscape panel or rolled town-view commission.
- OSRS [Brown apron](https://oldschool.runescape.wiki/w/Brown_apron): a mostly clean apron is an old, readable artisan garment tied to the Crafting Guild. Keep the apron, but dirty it with paint marks so it leaves the Crafting Teacher lane.
- Fitzwilliam Museum [The Illuminators' Palette](https://colour-illuminated.fitzmuseum.cam.ac.uk/explore/illuminators-palette): medieval/Renaissance color work valued texture, luminosity, saturation, layered pigments, and materials from glass, ceramic, and textile trades. Translate that into blocky pigment daubs and a few high-value color accents.
- Getty [Pacino di Bonaguida's Workshop](https://www.getty.edu/projects/researching-florentine-workshop-practice/pacino-di-bonaguidas-workshop/): Pacino worked as both panel painter and manuscript illuminator in a workshop context. Use the workshop-craft read: panels, parchment, brushes, pigments, and collaboration, not solitary modern fine-artist glamour.
- The Met [Scribe's Palette and Brushes](https://www.metmuseum.org/art/collection/search/544302): a compact wooden palette and reed brushes are strong historical tool silhouettes. The bundle of brush/palette/thread/papyrus reinforces "portable mark-making kit" over freestanding studio furniture.
- Low-poly readability references: Kenney [Mini Characters](https://kenney.nl/assets/mini-characters) for compact animated humans with CC0, thumbnail-safe proportions; Quaternius/OpenGameArt [Low Poly RPG Pack](https://opengameart.org/content/low-poly-rpg-pack) for simple medieval-fantasy props; Sketchfab [Low Poly Paint Brush](https://sketchfab.com/3d-models/low-poly-paint-brush-54f105b0be154bbbae49d1d3aae2c6e1) and Get3DModels [Artist's Easel](https://www.get3dmodels.com/furniture/artists-easel/) only as prop-shape references for chunky brush/easel/canvas logic, not mesh or texture sources.

## Silhouette Goals

- First read at thumbnail size: working painter with palette and brush. The palette must beat the inherited crafting apron; the brush must beat any chisel/tool-roll read.
- Build the core silhouette as a front-loaded triangle: head/soft cap at top, broad paint-marked apron in the middle, palette board on the off-hand side, brush arm crossing diagonally.
- Use one strong diagonal from right hand to palette/canvas: raised brush, angled handle, orange/red bristle block, and a small dab hovering near the palette or panel.
- Give the left or near-side hand a chunky oval/rectangular palette board with 4-6 paint blobs. A true thin palette will disappear; make it a visible shield-like craft tool, not a weapon.
- Add one rectangular painting panel or rolled canvas strapped close to the back/hip. Keep it smaller than a shield and flatter than a sign so it says "art panel," not guard gear or merchant placard.
- A soft cloth cap, headband, or tied rag can help, but avoid a modern beret silhouette unless the art direction deliberately wants a joke. Medieval/local craftsperson reads better as a simple cap plus smudged apron.
- Dye vials should hang as chunky colored cylinders/cuboids at belt height. Use red/yellow/blue as the primary row, with one mixed green/orange/purple accent if there is room.
- Avoid tall easel legs, full floor crates, huge backpack frames, fancy noble robes, magic glows, feather quills as the main tool, bard lute shapes, or oversized framed portraits that shrink the humanoid in the gallery.

## Color And Materials

- Preserve the existing anchors where useful: apron `#5f5043`, shirt `#6d4c87`, leather `#4f3527`, trousers `#333038`, boots `#2a2018`, muted metal `#bcae93`, and warm paint/clay `#c28a66`.
- Shift the apron from clean gray craft cloth to paint-stained workwear. Add 3-5 blocky daubs in primary colors and one dull off-white smear; keep each smear large enough to be intentional, not texture noise.
- Shirt should stay muted plum/violet as the Painter's personal color, but break it with red/yellow/blue/green paint props so the whole model does not become a one-note purple worker.
- Palette board: warm wood or raw parchment tan, with daubs in OSRS-dye colors: redberry red, onion yellow, woad blue, mixed green, orange, and a restrained purple. Do not use neon art-store colors.
- Brush: dark wood handle, dull metal ferrule if needed, and bristles tipped with a visible warm orange/red or blue. The bristle block can be oversized and flat-shaded.
- Canvas/panel: parchment off-white or faded linen with a simple two-color landscape mark: blue stripe, green/brown ground, maybe one red sun dot. Avoid detailed painted scenes inside the tiny model.
- Dye vials: glass should be implied by simple dark rims and saturated contents, not transparency. Transparent materials may read muddy in the low-poly gallery.
- Materials should remain faceted and geometric. Use object color blocks and a few planar smears instead of procedural splatter, text labels, or thin painted strokes.

## Prop And Pose Ideas

- Priority prop: `paint_palette_board`, attached to `leftLowerArm` or torso-near hand, with `paint_blob_red`, `paint_blob_yellow`, `paint_blob_blue`, `paint_blob_green`, and optional `paint_blob_purple`.
- Priority hand read: keep `paint_brush_handle`, but enlarge and separate it from inherited craft tools. Add `paint_brush_ferrule` and `paint_brush_bristles` or retune the current `paint_brush_tip` to read as bristles, not a torch flame.
- Secondary prop: `paint_canvas_panel` or `paint_commission_board`, a small rectangular panel strapped to the torso/side/back with `paint_panel_frame` and two broad landscape bands.
- Dye kit: `paint_dye_vial_red`, `paint_dye_vial_yellow`, `paint_dye_vial_blue`, plus `paint_vial_rack` or belt loops. Three primary vials are cleaner than six tiny bottles.
- Workwear details: `paint_apron_front`, `paint_apron_splatter_red`, `paint_apron_splatter_blue`, `paint_rag_tucked`, `paint_sleeve_roll_left`, `paint_sleeve_roll_right`, and one `paint_shop_badge` or small sign-shaped pin.
- Pose target: relaxed three-quarter stance, left forearm holding palette forward, right forearm lifted or angled inward as if about to dab paint. Head should angle toward the work, not stare like a guard.
- Idle animation target for later: wrist dip to palette, tiny brush lift, nod toward panel, return to neutral. Talk/trade animation can tilt the palette outward as if showing available colors.
- Do not put the defining props on the floor. A dye crate and easel belong in the world/gallery environment; the NPC thumbnail needs wearable, hand-held, body-attached identity.

## Gallery Scale And Framing

- Keep standard humanoid height and floor contact. The Painter should not be taller than other market civilians; identity comes from color and hand props.
- Best gallery angle: front three-quarter with palette face, brush tip, apron smears, and at least one dye vial row visible. Pure front may flatten the brush; pure side hides the palette blobs.
- Make the palette roughly hand-to-chest scale, not real scale. It can be 0.22-0.30 body-width equivalent as long as it does not cover the face or torso read.
- Brush and vials should be 2-3x plausible size. The gallery needs icons: chunky bristles, visible red/yellow/blue bottles, big paint blobs.
- Keep any panel/canvas inside shoulder width plus a small margin. If a back panel widens the bounding box too much, the camera will shrink the whole NPC and all paint details will vanish.
- Required thumbnail read order: palette board, raised brush, paint-stained apron, red/yellow/blue dye vials, small panel/canvas, purple artisan shirt.
- Compare beside `mainland_crafting_teacher`, `mainland_market_trader`, `mainland_elira_gemhand`, and `mainland_shopkeeper`. Painter should be the most colorful civilian, the only palette-and-brush silhouette, and less commercial than the trader.

## Concrete Integration Guidance

- Later implementation target: `src/js/content/npc-appearance-catalog.js`, inside `buildMainlandPainterPreset()`, unless the central NPC gallery/model rework introduces a dedicated authored model layer first.
- Preserve identifiers and wiring: `mainland_painter`, label `Painter`, archetype `market_crossing_painter`, world `appearanceId`, service ID `merchant:market_crossing_painter`, spawn ID `npc:market_crossing_painter`, dialogue ID `shopkeeper`, and NPC gallery preview actor entry.
- Lowest-risk pass: keep the current Tutorial Crafting Instructor clone for humanoid scale, but visually demote inherited crafting props and add 8-14 `paint_*` fragments that make palette/brush/dye/canvas the dominant read.
- Better bespoke pass: move to a lighter market artisan body if a central model-authoring layer appears. Keep apron proportions, but remove inherited chisel/clay/tool-roll cues at the source so the Painter is not a Crafting Teacher variant.
- Suggested fragments: `paint_apron_front`, `paint_apron_splatter_red`, `paint_apron_splatter_blue`, `paint_palette_board`, `paint_palette_thumb_hole`, `paint_blob_red`, `paint_blob_yellow`, `paint_blob_blue`, `paint_blob_green`, `paint_brush_handle`, `paint_brush_ferrule`, `paint_brush_bristles`, `paint_dye_vial_red`, `paint_dye_vial_yellow`, `paint_dye_vial_blue`, `paint_vial_rack`, `paint_canvas_panel`, `paint_panel_frame`, `paint_rag_tucked`, `paint_soft_cap`.
- If fragment budget gets tight, choose palette board, brush, three dye vials, apron smears, and one small panel before cap, rack, rag, or extra color blobs.
- If `clonePresetWithTheme()` remains in use, verify theme keys do not accidentally keep clay/chisel colors prominent. Add explicit colors to every new `paint_*` fragment rather than relying on broad inherited role recoloring.
- Keep props attached to torso/lower-arm bones with conservative offsets. Avoid freestanding easels or crates in the NPC model unless the gallery layer later supports stable ground props without shrinking the actor.
- Do not edit combat, economy, dialogue, world placement, building workbench content, generated assets, item icons, or unrelated NPC presets as part of the model pass.
- Likely failure modes to guard against: Crafting Teacher duplicate, generic purple worker, mage with wand, bard/performer, merchant sign-holder, shield-bearing guard, invisible palette blobs, overwide canvas shrinking the preview, or noisy paint marks that read like dirt.
- Suggested checks for later runtime work: `node .\tools\tests\npc-model-gallery-runtime-guard.js`, followed by manual `/qa npcgallery` inspection with Painter beside Crafting Teacher, Crossing Trader, Elira Gemhand, and Shopkeeper. This brief itself requires no runtime test.
