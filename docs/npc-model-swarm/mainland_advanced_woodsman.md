# Advanced Woodsman (`mainland_advanced_woodsman`)

Owned model: Advanced Woodsman (`mainland_advanced_woodsman`)

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly NPC gallery model. This brief does not authorize runtime code edits.

## Current Read

- Existing preset: `buildMainlandAdvancedWoodsmanPreset()` in `src/js/content/npc-appearance-catalog.js` is a `buildWorkerVariantPreset()` clone of the Tutorial Woodcutting Instructor, labeled `Advanced Woodsman` with archetype `north_lodge_woodsman`.
- Current visual base: red-brown shirt, moss vest, tan plaid intent, pale hair, gloves, trousers, boots, a belt axe inherited from the worker base, and one small green `woodsman_tree_badge`.
- Current placement: `content/world/regions/main_overworld.json` wires `appearanceId: "mainland_advanced_woodsman"` to the `advanced_woodsman` merchant at `north_woodwatch_lodge`, near the north woodcutting/fletching settlement.
- Gameplay read: he gates the deeper woodcutting ledger through `Proof of the Grain`, asking for willow, maple, and yew logs before opening higher-tier axe and log trading.
- Main risk: he currently reads as a recolored old woodsman/forester teacher. The final model needs a stronger "advanced merchant and timber examiner" identity: experienced, better equipped, and visually tied to late-band logs without becoming a combat boss.

## Profession And Gameplay Role

- He is the mid-progression woodcutting buyer: practical, slightly stern, and trusted with better axes, not a starter-town tutorial helper.
- His dialogue frames him as someone who reads timber grain rather than just hacking trees. The model should look like he can inspect a cut face, appraise log quality, and decide whether the player deserves full stock.
- The quest sampler matters visually. Willow, maple, and yew should inspire the prop language: a small three-log bundle, sample tags, or colored end-grain blocks is more specific than generic firewood.
- He belongs to North Woodwatch, so lean frontier-lodge and working-craft: warm cloth, moss leather, worn boots, pale old hair, useful gear, no noble trim.

## Source Inspiration

- OSRS [Woodcutting](https://oldschool.runescape.wiki/w/Woodcutting): gathering skill, logs feeding other systems, stronger axes improving woodcutting pace. Use this for the axe-and-log progression read.
- OSRS [Axe](https://oldschool.runescape.wiki/w/Axes): axes are both Woodcutting tools and rough melee weapons. The prop should be visibly practical, not ornamental.
- OSRS [Lumberjack outfit](https://oldschool.runescape.wiki/w/Lumberjack_outfit): canonical woodcutting clothing reference; borrow the work-set idea, plaid/boots/hat vocabulary, and practical silhouette without copying piece-for-piece.
- OSRS [Forestry kit](https://oldschool.runescape.wiki/w/Forestry_Kit): wearable kit that stores forestry gear. This supports a compact cape-slot pack or back pouch as an instantly readable profession cue.
- OSRS [Log basket](https://oldschool.runescape.wiki/w/Log_basket): log-storage item and strong silhouette prop. Borrow the idea of a carried basket or strapped log carrier, scaled down for gallery readability.
- OSRS [Forestry: The Way of the Forester - Part One](https://oldschool.runescape.wiki/w/Update:Forestry:_The_Way_of_the_Forester_-_Part_One): official Forestry launch framing uses plaid shirts, group woodcutting, the Friendly Forester, and gear stored in a kit. Use as tone reference: social woodsman, not solitary hunter.
- Medieval [Tacuinum sanitatis woodcutters](https://manuscriptminiatures.com/5708/20743): early-1400s woodcutters tagged with axes, mallet, meal, and public-domain source imagery. Useful for simple medieval labor clothing and tool-forward staging.
- [Tools of the Medieval Woodworker](https://medievalwoodworking.org/vld_tools.htm): broad axe over shoulder, smaller axe at belt, tool pouch, and T-shaped carpenter axe continuity. Use this for believable tool silhouettes.
- Kenney [Mini Characters](https://kenney.nl/assets/mini-characters): compact low-poly 3D character set with animation support and CC0 license. Use only as validation that oversized, readable heads/hands/props work at small scale.
- Sketchfab [Low Poly Lumberjack](https://sketchfab.com/3d-models/low-poly-lumberjack-a93a29105fc44bf594f8100b7726bcec): 1.5k-triangle rigged/animated lumberjack reference. Use as low-poly profession readability validation; do not copy mesh, texture, or exact outfit.

## Silhouette Goals

- First read at thumbnail size: pale-haired veteran woodsman, broad vest, visible axe, visible log/forestry carrier, green tree badge.
- Differentiate from `mainland_forester_teacher`: the Forester Teacher should feel like a starter mentor; Advanced Woodsman should feel heavier, older, better equipped, and more merchant-like.
- Differentiate from `tutorial_woodcutting_instructor`: keep the shared woodsman language, but add a profession pack/log basket and cleaner "appraiser" front detail so he is not just an old plaid instructor.
- Keep shoulders broad and grounded, but not armored. A slight forward lean says "worker"; a square heroic stance says "guard" and should be avoided.
- Use one strong diagonal: axe haft across back/shoulder or belt-to-hip log strap. This breaks the rectangular humanoid torso and makes the profession readable in the gallery.
- Head read should be older and experienced: pale hair, blocky brows, moustache/beard, maybe a brim cap or short hood, but avoid a tall fantasy hat.

## Color And Materials

- Preserve the earthy worker family: red-brown shirt, dark moss vest, brown leather belt/gloves, charcoal-brown trousers, dark boots.
- Push the advanced identity with small higher-tier metal accents: muted mithril blue-grey or adamant green-blue on the axe head, buckle, or sample tags. Keep it dull and worn, not glowing.
- Use flat materials and faceted blocks. No cloth texture, no realistic bark texture, no PBR metal pass.
- Suggested palette anchors: shirt `#7a3724`, vest `#365438`, plaid tan `#c49a61`, pale hair `#d0c1a5`, badge leaf `#7fb069`, dark leather `#563822`, axe metal `#8f969b`, advanced edge accent `#6f8f86`.
- Log props should have three readable end tones: willow muted green-tan, maple warm amber, yew dark honey-brown. Make end-grain blocks visible from front three-quarter.
- Avoid over-saturating the whole outfit. One green badge plus one cool metal accent is enough.

## Prop And Pose Ideas

- Add a compact forestry kit/back pouch on the rear torso or hip: dark leather block, flap, small green leaf tag. This is the clearest Forestry reference without making the model busy.
- Add a small log sampler bundle: three short logs tied at the left hip or across the lower back, with visible circular/box end caps in willow/maple/yew colors.
- Upgrade the inherited belt axe into a more "trusted merchant" axe: longer handle, cleaner metal head, and a small cool-colored cutting edge. It should read as a good tool, not a battleaxe.
- Optional hand prop: a flat sample board or tally tag in one lower arm if the gallery pose supports it. This makes him a timber appraiser rather than just another cutter.
- Pose target: one arm relaxed near the axe or log samples, the other slightly forward as if judging the player's bundle. Keep it subtle; large gestures will collide with standard humanoid framing.
- Do not add a bow, quiver, shield, helmet, horns, cloak drama, or heavy shoulder armor. Those fight the woodcutting merchant role.

## Gallery Scale And Framing

- Keep standard humanoid floor contact and head height. He can feel slightly broader than other noncombat workers through vest, pack, and props, not by scaling the whole body up.
- Best gallery angle: front three-quarter with the tree badge, beard, axe head, and log sampler end caps all visible.
- Camera should catch the front torso and one side prop. A pure front view will hide a back basket; a pure side view will lose the badge and face.
- Thumbnail test: if reduced to a small preview, the model should still read as "woodsman merchant" from pale hair, green vest/badge, diagonal axe, and log bundle.
- Compare beside `mainland_forester_teacher`, `tutorial_woodcutting_instructor`, and `mainland_advanced_fletcher`. The Advanced Woodsman should share the northern craft settlement language with the fletcher, but own the axe/log identity.

## Concrete Integration Guidance

- Later implementation target: `src/js/content/npc-appearance-catalog.js`, inside `buildMainlandAdvancedWoodsmanPreset()`, unless the gallery rework creates a central model-authoring layer first.
- Preserve authored identifiers: `mainland_advanced_woodsman`, label `Advanced Woodsman`, archetype `north_lodge_woodsman`, `appearanceId` wiring, merchant ID, dialogue ID, and preview actor entry.
- Keep using the worker/woodcutting rig family unless central integration intentionally replaces all humanoid model authoring. The current shared rig is already the right scale and animation base.
- First-pass fragment additions should be specific and inspectable: `advanced_woodsman_forestry_pack`, `advanced_woodsman_log_bundle`, `advanced_woodsman_willow_log_end`, `advanced_woodsman_maple_log_end`, `advanced_woodsman_yew_log_end`, `advanced_woodsman_axe_edge`, `advanced_woodsman_tally_tag`.
- If retheming via `clonePresetWithTheme()`, use keys that match existing role substrings. The current `plaidTan` theme key will not hit snake_case roles like `plaid_vertical_tan`; use `plaid` or explicit fragment colors when intentional.
- Keep additions to roughly 6-10 fragments. Prioritize silhouette and identity props over decorative micro-detail.
- Do not edit combat, quest, shop economy, world placement, dialogue, or generated assets during visual integration.
- Likely failure modes to guard against: generic lumberjack, tutorial duplicate, too-modern flannel, oversized backpack, fantasy druid, combat barbarian, unreadable brown-on-brown prop pile, or bright neon Forestry green.
