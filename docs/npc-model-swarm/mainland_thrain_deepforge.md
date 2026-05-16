# Thrain Deepforge (`mainland_thrain_deepforge`)

Owned model: Thrain Deepforge (`mainland_thrain_deepforge`)

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly NPC gallery model. This brief does not authorize runtime code edits.

## Current Read

- Existing preset: `buildMainlandThrainDeepforgePreset()` in `src/js/content/npc-appearance-catalog.js` uses `buildSmithVariantPreset()`, so Thrain currently clones the Tutorial Mining and Smithing Instructor family.
- Current palette: apron `#4f3e32`, shirt `#70342a`, metal `#c0b6a8`, ore `#9d7b55`. The colors already lean darker and more prestigious than Borin, but the body still reads as a rethemed starter smith.
- Current bespoke fragment is only `deepforge_hammer_badge` on the torso. It is thematically correct, but too small to carry "advanced dwarf forge master" in the gallery.
- Current placement and wiring: `content/world/regions/main_overworld.json` places `merchant:thrain_deepforge` / `npc:thrain_deepforge` at Deepforge House with `appearanceId: "mainland_thrain_deepforge"`, tags for smithing/mining/settlement, and dialogue `thrain_deepforge`.
- Current role text: Thrain is a dwarf advanced smithing merchant for highest-tier metals and late-game forging progression. His `Proof of the Deepforge` quest opens advanced ore stock after the player turns in 6 coal, 2 gold ore, and 1 uncut emerald.
- Current shop lane: he buys and sells `adamant_ore` and `rune_ore`. His visual read should point at adamant/rune craft authority before the nameplate does.
- Main risk: he becomes "Borin with a darker shirt" or "tutorial smith with one badge." The final model needs obvious dwarf-master mass, late-metal prestige, and a stern gatekeeper stance at thumbnail size.

## Profession And Gameplay Role

- Thrain is the serious late-band forge master: not a beginner helper, not a quarry supervisor, not a gem jeweler, but the smith who decides whether the player has earned access to advanced ore.
- Gameplay role: advanced smithing merchant and quest gate for rune-material access. He should look like someone who handles expensive metals, rejects weak proof, and knows exactly what a bar should become before he strikes it.
- Personality read: compact, severe, controlled, proud, and difficult to impress. His warmth should be forge heat, not friendliness.
- Spatial read: Deepforge House / advanced forge district. He belongs beside heavy anvils, coal bins, ingot racks, quenched metal, and a hotter, cleaner workbench than the south quarry yard.
- Identity boundary: Borin owns early ore appraisal and approachable dwarf trade; Quarry Foreman owns site control and work boards; Elira owns gem precision; Thrain owns master smith prestige, late-tier ore, rune-blue metal authority, and the "prove yourself" gate.

## Source Inspiration

- OSRS [Smithing](https://oldschool.runescape.wiki/w/Smithing): core loop is bars, hammer, anvil, and shaped metal output. Thrain should make that loop feel high-skill and deliberate, not tutorial-basic.
- OSRS [Anvil](https://oldschool.runescape.wiki/w/Anvil): anvils are the readable smithing station icon. Use anvil-horn and block geometry as small visual language on a badge, belt plate, or carried token rather than a full scenery prop.
- OSRS [Furnace](https://oldschool.runescape.wiki/w/Furnace) and [Blast Furnace](https://oldschool.runescape.wiki/w/Blast_Furnace): furnace/forge heat, coal, bulk smelting, and Keldagrim dwarf industry support the "deep forge" mood. Borrow the industrial heat read, not a minigame operator costume.
- OSRS [Doric](https://oldschool.runescape.wiki/w/Doric): dwarf smith with a hut, anvil, whetstone, and hammer identity. Useful baseline for "dwarf smith," but Thrain must feel far more advanced and less local-handyman.
- OSRS [Thurgo](https://oldschool.runescape.wiki/w/Thurgo) and [Imcando dwarf](https://oldschool.runescape.wiki/w/Imcando_dwarf): master dwarf Smithing lineage, secret technique, and legendary craft authority. Use this as the prestige ceiling without copying Thurgo's exact character.
- OSRS [Runite](https://oldschool.runescape.wiki/w/Runite): rune/runite is stronger than adamantite and cyan in color. Reserve a tiny cyan accent for Thrain's late-tier identity so it reads as controlled expertise, not wizard glow.
- Britannica [Blacksmith](https://www.britannica.com/topic/blacksmith): canonical smith equipment is forge/furnace, anvil, tongs, hammers, chisels, and other shaping tools. Compress that toolkit into 2-3 large low-poly cues.
- World History Encyclopedia [Medieval Trades](https://www.worldhistory.org/Medieval_Trades/): medieval blacksmiths were essential toolmakers and repairers with expensive equipment and high craft value. Thrain should feel like a master of scarce, valuable labor.
- NPS [Blacksmith Shop Interior](https://www.nps.gov/places/blacksmith-shop-interior.htm) and [Blacksmith Tools](https://www.nps.gov/articles/blacksmith-tools.htm): hammer/anvil/forge/bellows/coal/tongs are the durable real-world forge cues. Use broad forms, not clutter.
- Sketchfab [Low Poly Blacksmith (Rigged)](https://sketchfab.com/3d-models/low-poly-blacksmith-rigged-aa7bcc0cbbbd477c9f3af689f37a728f): proof that apron, hammer, and simple animation-ready proportions can read at very low triangle counts. Do not import or copy geometry.
- CGTrader [Blacksmith Low Poly](https://www.cgtrader.com/3d-models/character/man/blacksmith-low-poly): useful validation that a blacksmith plus anvil/hammer package can stay around simple game-asset scale. Use as a prop-read checklist only.
- Sketchfab [Dwarf Blacksmith](https://sketchfab.com/3d-models/dwarf-blacksmith-e48bfff956ef483cb987890dc856c8b5): high-detail fantasy reference for beard, boots, belt, leather, hammer, braids, and shoulder mass. Downshift aggressively into OSRS-style box fragments.

## Silhouette Goals

- First read at thumbnail size: short broad dwarf, massive angular beard, heavy brow, dark forge apron, oversized master hammer or tongs, and one late-metal accent.
- Make the dwarf read through mass distribution: wide torso, low belt, thick boots, short strong arms, compact neck, large hands, and beard volume. Avoid merely scaling the entire humanoid down.
- Beard is the primary identity shape: broad wedge beard with two or three block lobes, optional small braid blocks, and a moustache shelf under a heavy nose. It should be readable from front three-quarter.
- Hammer should be the second identity shape. Prefer a heavy square-headed forge hammer held low or strapped diagonally at the hip over a tiny chest badge.
- Apron should feel premium and burned-in: a heavy black-brown leather slab with a reinforced chest plate or metal-studded lower hem.
- Add one prestige metal shape: rune-blue ingot, adamant-green bar, or cool cyan edge in a belt sample. Keep it small and hard-edged.
- Differentiate from Borin by making Thrain darker, cleaner, sterner, and more late-tier. Borin can carry ore pouch/trade warmth; Thrain carries mastery and permission.
- Differentiate from the Tutorial Mining/Smithing Instructor by reducing generic teacher friendliness and adding dwarf proportions, advanced tools, and late-metal proof objects.
- Avoid horned helmets, full battle armor, giant fantasy pauldrons, glowing rune robes, weapon-shop clutter, or a combat-boss hammer pose.

## Color And Material Notes

- Base palette should stay dark forge leather plus deep heated cloth: apron `#4f3e32`, apron shadow `#2b211b`, shirt `#70342a`, charred hem `#1d1916`, boot `#241b16`.
- Beard palette should be ash-gray or iron-gray rather than Borin's warmer trade colors: beard `#8f887c`, beard shadow `#55504a`, brow `#3b3029`.
- Metal palette should feel higher-grade than Borin: dull master steel `#c0b6a8`, edge highlight `#ded4c3`, soot-dark metal `#595853`, adamant accent `#5f8a66`, rune accent `#4fb3c5`.
- Use the quest materials as tiny supporting notes, not a jewelry display: coal black on apron/tool head, one gold ore chip, one emerald proof stone only if it stays secondary to smithing.
- Forge heat can appear as a narrow ember-orange line on hammer head, apron seam, or gauntlet edge. Do not make him a glowing fire mage.
- Materials should be big flat blocks: leather slab, beard slab, metal head, glove block, ingot cube, belt strap. Avoid speckled soot textures that vanish at gallery size.
- Highest contrast should sit on the face/beard and hammer head. The rune accent should be the coolest color note, not the dominant read.

## Prop And Pose Ideas

- Priority prop: `deepforge_master_hammer`, a short-handled square forge hammer with a heavy rectangular head. Put it in the right hand, across the belt, or low at the side.
- Priority dwarf cue: `deepforge_beard_core` plus side wedges/forks. This is more important than extra tool clutter.
- Priority prestige cue: `deepforge_rune_ingot` or `deepforge_adamant_bar`, held low in tongs or mounted on the apron as a proof sample.
- Keep inherited tongs if they remain readable; otherwise replace with a clearer `deepforge_tongs_jaw` pair near the left hand holding a hot bar.
- Upgrade the existing hammer badge into a larger forged emblem: anvil-horn silhouette, crossed hammer stamp, or rectangular master plate on the apron chest.
- Quest proof cue: optional belt token cluster of coal/gold/emerald, but only three tiny blocks. It should say "he evaluates proof" without turning him into Elira.
- Pose target: feet planted wide, torso slightly forward, chin down, one hand on hammer, the other holding tongs or an ingot. He is judging the player's material, not waving hello.
- Idle animation target for later: inspect ingot, give one slow hammer lift/tap, settle back into stern neutral. No combat swing, no frantic smithing loop.

## Gallery Scale And Framing Notes

- Keep standard gallery floor contact. Make him dwarf-like through width, low belt, boots, and beard before changing global scale.
- If a later runtime pass supports safe scale overrides, test roughly `[0.98, 0.88, 1.06]`: a little shorter, wider, and deeper. Stop if he reads as a child or if props force the camera to zoom out.
- Best angle: front three-quarter with beard, apron plate, hammer head, and one rune/adamant accent visible.
- Required read order at 96-148 px: beard/brow, dark apron, hammer/tongs, late-metal accent, boots.
- Keep all side props tight. A giant hammer or anvil extending outside the body will shrink the thumbnail and weaken the dwarf read.
- Compare beside `mainland_borin_ironvein`, `mainland_quarry_foreman`, `mainland_elira_gemhand`, and `tutorial_mining_smithing_instructor`. Thrain should be the stern advanced forge master in that lineup.
- In the smithing quartet, the silhouette split should be: Borin short ore buyer, Thrain compact master smith, Foreman human logistics boss, Elira precise jeweler.

## Concrete Implementation Guidance For Central Integration

- Later implementation target: `src/js/content/npc-appearance-catalog.js`, inside `buildMainlandThrainDeepforgePreset()`, unless the NPC gallery rework introduces a central authored model layer first.
- Preserve identifiers and wiring: preset ID `mainland_thrain_deepforge`, label `Thrain Deepforge`, archetype `deepforge_smith`, world `appearanceId`, merchant ID `thrain_deepforge`, dialogue ID `thrain_deepforge`, quest `thrain_deepforge_proof_of_the_deepforge`, and NPC gallery actor entry.
- Lowest-risk first pass: keep `buildSmithVariantPreset()` for shared smith rig scale, then add 10-16 Thrain-specific fragments that change silhouette before decoration.
- Better bespoke pass: if a central authored NPC model layer appears, give him a dwarf master-smith body first: broad torso, low belt, big boots, large beard, reinforced apron, and compact hammer pose.
- Suggested fragments: `deepforge_heavy_brow`, `deepforge_beard_core`, `deepforge_beard_left_fork`, `deepforge_beard_right_fork`, `deepforge_moustache_bar`, `deepforge_apron_plate`, `deepforge_apron_burnt_hem`, `deepforge_master_hammer_handle`, `deepforge_master_hammer_head`, `deepforge_tongs_jaw_left`, `deepforge_tongs_jaw_right`, `deepforge_rune_ingot`, `deepforge_adamant_bar`, `deepforge_coal_mark`, `deepforge_gold_chip`, `deepforge_emerald_proof`.
- If using `clonePresetWithTheme()`, verify inherited role keys still hit the intended fragments. Use explicit fragment colors for beard, hammer head, rune/adamant accents, and proof stones.
- The current `deepforge_hammer_badge` can stay only if it becomes a secondary emblem. It should not remain the only bespoke signal.
- Do not edit shop economy, quest gates, world placement, dialogue, mining/smithing specs, item catalogs, generated assets, combat systems, or unrelated NPC presets during visual integration.
- Suggested later checks after runtime integration: `node .\tools\tests\npc-model-gallery-runtime-guard.js`, then manual `/qa npcgallery` comparison against Borin, Quarry Foreman, Elira, and the tutorial smith.
- Acceptance target: in the NPC gallery, a viewer should identify "advanced dwarf forge master / late-metal smith" before reading the nameplate.
