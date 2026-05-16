# Tutorial Guide (`tutorial_guide`)

Owned model: Tutorial Guide (`tutorial_guide`)

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly NPC gallery model. This brief does not authorize runtime code edits.

## Current Read

- Existing preset: `buildTutorialGuidePreset()` in `src/js/content/npc-appearance-catalog.js` is the root guide-family humanoid rather than a clone of another role.
- Current archetype: `formal_island_steward`. That is directionally right: he is not a skill specialist, merchant, guard, or wizard. He is the first host of the island.
- Current construction: standard box-fragment humanoid with tidy head, hair cap, ears, simple eyes/mouth, formal coat body, pale shirt panel, collar trim, shoulder caps, belt, buckle, trousers, and boots.
- Current palette: deep teal coat `#143f46`, darker coat fronts `#0f3038`, warm shirt `#d8c99e`, brass trim `#b89545`, brown belt `#5a3923`, charcoal trousers `#3d4143`, dark boots `#2d2118`, boot legs `#4b3a2a`.
- Current gallery risk: he reads as "generic polite clerk" until the label appears. The silhouette has no signature tutorial prop, welcome gesture, steward badge, key, book, map, route marker, or island-specific onboarding cue.
- Identity risk across the catalog: many service NPCs inherit from this guide base. The bespoke pass should make `tutorial_guide` feel like the origin of the family, not the least-detailed version of it.
- Placement read: this model has 2 authored placements using the same `appearanceId: "tutorial_guide"`. Arrival uses `merchant:tutorial_guide` / `npc:tutorial_guide` at `(141, 177, 0)` through tutorial step 10. Exit uses `merchant:tutorial_exit_guide` / `npc:tutorial_exit_guide` at `(250, 334, 0)` from tutorial step 11 onward.
- Runtime contract read: both placements share the same name, appearance, and `dialogueId: "tutorial_guide"`, stand still with `roamingRadiusOverride: 0`, and represent one continuous host identity rather than two different NPCs.

## Tutorial And Gameplay Role

- World role: the island's neutral host, first face, and final handoff. He welcomes the player at the cabin, teaches the global interaction model, then reappears in the center yard to send the player onward.
- Gameplay role: movement, left-click interaction, right-click options, Examine, Use, inventory targeting, route confidence, and final exit permission.
- Player read: "This person is safe, official, and patient. Talk to him when you do not know what to click next."
- Emotional tone: warm, crisp, slightly ceremonial, and quietly competent. He should feel like a steward of the tutorial route, not a scholar, noble, bank clerk, road guide, guard, or town crier.
- Two-placement implication: the model must work inside the cramped arrival cabin and in the open center-yard exit. Avoid wide environmental props or location-specific staging that only works in one placement.
- Contrast target: more welcoming and tutorial-coded than `mainland_road_guide`; less travel-worn than `mainland_outpost_guide`; less skill-specific than every instructor; less institutional than `tutorial_bank_tutor`; less combat-ready than `enemy_guard`.

## Source Inspiration

- OSRS [Gielinor Guide](https://oldschool.runescape.wiki/w/Gielinor_Guide): canonical first-NPC precedent. Borrow the immediate "first guide in a house on Tutorial Island" identity, clean human read, and short informative chat role without copying the exact outfit one-for-one.
- OSRS [Gielinor Guide image](https://oldschool.runescape.wiki/w/File:Gielinor_Guide.png): useful visual anchor for a tall, readable, formal guide. The bespoke model should keep the upright host posture and strong coat read while simplifying into chunkier low-poly blocks.
- OSRS [Tutorial Island](https://oldschool.runescape.wiki/w/Tutorial_Island): establishes the island as every new player's starting place, with guided hints and a required path before leaving. Translate that into an NPC who visually owns orientation, thresholds, and "next step" clarity.
- OSRS [Learning the Ropes](https://oldschool.runescape.wiki/w/Learning_the_Ropes): reinforces that the tutorial teaches basics and rewards basic gear before mainland access. Use modest starter props, not veteran adventurer gear.
- OSRS [Adventure Paths](https://oldschool.runescape.wiki/w/Adventure_Paths) and [New players guide](https://oldschool.runescape.wiki/w/New_players_guide): the Gielinor Guide choice can affect new-player guidance after Tutorial Island. A small path token or guide badge can hint that his role extends beyond a single room.
- OSRS [Quest Guide](https://oldschool.runescape.wiki/w/Quest_Guide): another Tutorial Island-only explainer NPC. Keep Tutorial Guide visually broader and warmer than Quest Guide; do not make him a book-only lecturer.
- Britannica [steward](https://www.britannica.com/topic/steward-royal-official): steward as household official supports the "formal island host" read. Borrow administrative trust, not wealth or royal excess.
- World History Encyclopedia [medieval castle household staff](https://www.worldhistory.org/article/1234/the-household-staff-in-an-english-medieval-castle/): household officers, chamberlains, clothing badges, and controlled access support badge, key, ledger, and usher cues.
- British Museum [chamberlain's key](https://www.britishmuseum.org/collection/object/H_1888-1201-32): key plus white staff as office symbols are strong visual shorthand. For OSRS Clone, use a modest brass key ring or steward baton, not ornate royal regalia.
- Kenney [Mini Characters](https://kenney.nl/assets/mini-characters): compact low-poly readability reference for oversized heads/hands, simple animation-ready proportions, and clear silhouettes.
- KayKit [Character Pack: Adventurers](https://kaylousberg.itch.io/kaykit-adventurers): useful reference for low-poly optimized characters, simple accessories, and atlas-like color discipline.
- Quaternius [Ultimate Animated Character Pack](https://quaternius.com/packs/ultimatedanimatedcharacter.html): good production reference for many role-distinct animated characters that stay simple, flat, and readable without dense detail.

## Silhouette Goals

- First read at thumbnail size: teal formal island guide with pale shirt panel, brass steward badge, short welcome baton or pointer, small key ring, and a chunky beginner scroll/map.
- Preserve standard guide-family height and friendly upright posture. He should be the baseline service humanoid that other guide variants depart from.
- Add one strong chest identifier: `tutorial_steward_badge`, `tutorial_waypoint_badge`, or `tutorial_island_badge` on the pale shirt/coat front. Make it large enough to read from front view.
- Add a short non-combat pointer/baton rather than a tall staff. A tall staff would fight `mainland_road_guide` and `tutorial_magic_instructor`; a waist-to-shoulder guide baton reads like "follow me" and stays cabin-safe.
- Add a compact guide scroll or folded parchment held in the left hand or tucked at the belt. It should read as tutorial notes or island route, not quest journal ownership.
- Add a small brass key ring at belt height. It supports the cabin-door/threshold role and steward inspiration, but must not become a banker key or jailer key.
- Consider a soft cap or slightly more deliberate hair/hat shape. The current hair cap is plain; a low steward cap with brass pin could separate him from later clones without looking noble.
- Keep shoulders relaxed and open. No hunched scholar neck, no guard-square armor mass, no merchant satchel overload, no wizard hood, no weapon silhouette.
- Optional asymmetry: one forearm angled slightly outward as if presenting the route, with the other hand relaxed near baton/key. The model should imply "I am about to guide you" even when idle.

## Color And Material Notes

- Preserve the current teal coat family as the Tutorial Guide signature. Do not push him into road-guide green, outpost blue-grey, bank navy, magic purple, or combat red.
- Keep shirt and face warm so the model feels welcoming inside the arrival cabin. The pale shirt panel should remain a high-contrast centerline for the badge.
- Suggested retained anchors: coat `#143f46`, coat shadow `#0f3038`, shirt `#d8c99e`, trim/badge `#b89545`, belt `#5a3923`, trousers `#3d4143`, boots `#2d2118`.
- Add two practical steward materials only: dull brass for badge/key/baton cap, and parchment for scroll/map. Suggested brass `#c49a3a` / `#a98235`; parchment `#d7c28e` with shadow `#a98d58`.
- If adding a cap, keep it in coat-dark teal with a brass pin. Avoid red beret, wizard hat, crown, feather, halo, or anything that reads as a different OSRS role.
- Parchment marks should be broad blocks: one arrow, one door/house icon, one path line. No text labels, tiny runes, or readable UI-like writing.
- Key ring should be chunky and low count: two or three oversized key blocks max. Thin circular rings or teeth will vanish at gallery size.
- Materials should remain flat and faceted. No cloth weave, glossy metal, procedural dirt, alpha straps, or imported textures.

## Prop And Pose Ideas

- Priority props: `tutorial_steward_badge`, `tutorial_guide_scroll`, `tutorial_path_mark`, `tutorial_baton`, and `tutorial_key_ring`.
- Badge cluster: chest-mounted brass disk, shield, or simple waypoint diamond. It should be official but humble.
- Scroll cluster: left lower arm or belt prop with `tutorial_scroll_roll`, `tutorial_scroll_edge`, and `tutorial_scroll_path_mark`. It can echo Tutorial Island route guidance without becoming a world map.
- Baton cluster: right lower arm prop with `tutorial_baton_grip`, `tutorial_baton_shaft`, and `tutorial_baton_cap`. Keep it short, blunt, and ceremonial.
- Key cluster: belt-side `tutorial_key_ring`, `tutorial_key_large`, and `tutorial_key_small`. Place low enough not to confuse with badge, high enough to frame in gallery.
- Optional cap cluster: `tutorial_steward_cap`, `tutorial_cap_band`, and `tutorial_cap_pin`. Only add if the head remains plain beside other guide-family NPCs.
- Pose target: feet planted, torso upright, head slightly turned toward the player, left hand offering/presenting the scroll, right hand holding a short pointer at rest.
- Idle animation target for later: tiny welcoming nod, baton tilt toward the next door/path, glance at scroll, return to neutral.
- Interaction animation target for later: raise scroll slightly, point with baton, then open palm. No theatrical waving or combat flourishes.

## Gallery Scale And Framing Notes

- Keep standard humanoid bounds and floor contact. Do not add a tall staff, signpost, lectern, booth, chair, or environmental base that would shrink him in the gallery.
- Best gallery angle: front three-quarter with badge centered, scroll visible on one side, short baton/key ring on the other, and the pale shirt panel unobscured.
- Thumbnail read order: friendly face/cap, teal coat, pale shirt panel, brass badge, scroll/path mark, baton, key ring, boots.
- Oversize the badge, scroll, baton cap, and key blocks by roughly 1.5x versus realism. The Tutorial Guide must read at `THUMB_SIZE` scale, not only in close inspection.
- The scroll and baton should stay close to the body so both placements fit: cabin interior at arrival, center-yard exit at the end.
- Compare beside `mainland_road_guide`, `mainland_outpost_guide`, `tutorial_bank_tutor`, `tutorial_magic_instructor`, `tutorial_runecrafting_instructor`, and `enemy_guard`. Tutorial Guide should remain the baseline host, not drift into travel, outpost, bank, magic, rune, or combat territory.
- Because the same model has 2 placements, avoid arrival-only props like a giant cabin key, exit-only props like a travel ticket, or a freestanding arrow sign. Use universal onboarding symbols.

## Concrete Implementation Guidance For Central Integration

- Preserve identifiers and contracts: preset id `tutorial_guide`, label `Tutorial Guide`, archetype `formal_island_steward`, preview actor entry, `appearanceId: "tutorial_guide"`, and `dialogueId: "tutorial_guide"`.
- Preserve both placements: arrival `merchant:tutorial_guide` / `npc:tutorial_guide` at `(141, 177, 0)` visible through step 10, and exit `merchant:tutorial_exit_guide` / `npc:tutorial_exit_guide` at `(250, 334, 0)` visible from step 11.
- Do not split the visual identity by placement. If central integration wants placement-specific facing or animation later, keep one shared model and vary only runtime state.
- Later runtime integration should stay in `src/js/content/npc-appearance-catalog.js` inside `buildTutorialGuidePreset()` unless the central NPC model pass introduces a dedicated authored-model layer for every NPC.
- Lowest-risk pass: keep the current body, proportions, and palette, then add 6-10 guide-specific fragments for badge, scroll, baton, key ring, and optional cap.
- Better bespoke pass: still use the current guide-family rig and box language, but make him the polished root guide with a steward badge, welcome baton, guide scroll, and key ring. Other guide variants can then remain departures from this stronger base.
- Suggested fragments: `tutorial_steward_cap`, `tutorial_cap_band`, `tutorial_cap_pin`, `tutorial_steward_badge`, `tutorial_badge_rim`, `tutorial_guide_scroll`, `tutorial_scroll_edge`, `tutorial_scroll_path_mark`, `tutorial_baton_grip`, `tutorial_baton_shaft`, `tutorial_baton_cap`, `tutorial_key_ring`, `tutorial_key_large`, `tutorial_key_small`.
- If fragment budget gets tight, prioritize badge, scroll, and baton. Those three cues carry "tutorial host" best; key ring and cap are secondary.
- If the baton begins to read as weapon, shorten it, thicken the cap, and angle it downward. If the scroll reads as quest guide, make the chest badge and open-hand pose do more of the tutorial work.
- Appended fragments should use explicit `rgbColor` values and stay within existing humanoid bounds. Do not import external meshes, textures, or generated assets for this pass.
- Do not edit world placement, tutorial visibility steps, travel destinations, dialogue text, merchant/action wiring, skill instructor presets, item icons, generated assets, or runtime movement logic as part of this model integration.
- Suggested later QA after runtime integration: run `node .\tools\tests\npc-model-gallery-runtime-guard.js`, then inspect `/qa npcgallery` beside the comparison NPCs above and manually check both Tutorial Guide placements.
- Success condition: at small gallery size, a fresh viewer should read "first tutorial host who explains the island and opens the path forward" before reading the label.
