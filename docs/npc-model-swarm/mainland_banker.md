# Banker (`mainland_banker`)

Owned model: Banker (`mainland_banker`)

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly NPC gallery model. This brief does not authorize runtime code edits.

## Current Read

- Existing preset: `buildMainlandBankerPreset()` in `src/js/content/npc-appearance-catalog.js` clones `buildTutorialBankTutorPreset()`, relabels it `Banker`, sets archetype `mainland_bank_clerk`, rethemes the guide-family coat, and adds one small `banker_till_key`.
- Inherited visual base: Tutorial Guide body language, dark blue bank coat, cream shirt, brass trim, dark trousers/boots, left-arm ledger book/pages, torso `bank_badge`, and a tiny brass till key.
- Current placements: one shared `appearanceId: "mainland_banker"` covers 10 bank services: `east_outpost`, `willow_bend`, `maple_ridge`, `yew_frontier`, `south_field`, `west_range`, `southeast_camp`, `air_altar`, `south_quarry`, and `market_crossing`.
- Current world context: most placements are distributed frontier booths; `market_crossing` uses the reusable `frontier_bank` building shell with bank desk, deposit crate, front bank sign, and deposit-rules placard.
- Gameplay read: not a shopkeeper, quest giver, or tutorial instructor. This is the human face of bank access: safe storage, fast deposits/withdrawals, and a reliable service stop between resource, combat, altar, quarry, and market routes.
- Main risk: the model currently reads as "Bank Tutor recolor plus key." The bespoke version needs a stronger teller/clerk silhouette that still works across every bank placement without becoming town-specific.

## Service And Gameplay Role

- The Banker is a civic service NPC. He should feel standardized, calm, and trusted: more official than a merchant, less noble than an administrator, less instructional than the Tutorial Bank Tutor.
- The player uses him for the `Bank` action and the `banker` dialogue: "Your valuables are safer in the bank than in your pockets." The model should visually promise safekeeping, not personal wealth.
- Because he appears beside skilling, combat, runecrafting, quarry, and market stops, avoid props that imply one trade route. The identity must be bank-first: ledger, badge, key ring, receipt slips, coin/token tray, and booth-facing posture.
- He should look like someone stationed behind a counter even when the gallery isolates him from the bank booth. Think "frontier Bank of Gielinor clerk": practical uniform, visible accounting tools, tidy hands, low drama.
- Repetition is part of the fantasy. Ten placements can share one model if the model reads as a reusable bank uniform rather than one named character.

## Source Inspiration

- OSRS [Banker](https://oldschool.runescape.wiki/w/Banker): bankers safely store coins and items, can handle coins/platinum-token conversion, and vary by region/species while keeping the same service identity. Use this for the "institutional uniform, local face" read.
- OSRS [Bank](https://oldschool.runescape.wiki/w/Bank): banks are deposit, storage, and withdrawal facilities, often standalone buildings or service points. Use this for the model's civic reliability and storage-network tone.
- OSRS [Bank booth](https://oldschool.runescape.wiki/w/Bank_booth): booths are the common bank access object, usually with bankers behind them; the examine line frames the booth as where the teller serves the player. Use this for counter-facing posture and teller props.
- OSRS [Tutorial Island](https://oldschool.runescape.wiki/w/Tutorial_Island): early banking is introduced as a lesson-space. Use this only as contrast: the mainland Banker should be service-ready, not didactic.
- BnF [Le changeur](https://essentiels.bnf.fr/fr/image/7dbca7e9-0d18-4737-a15c-b76b8161594d-changeur): medieval money changer with balance, belt purse, and obligation to return deposits. Borrow the balance/purse/accountability vocabulary, scaled down to OSRS simplicity.
- British Library [The Burden of Writing: Scribes in Medieval Manuscripts](https://www.bl.uk/stories/blogs/posts/the-burden-of-writing-scribes-in-medieval-manuscripts): scribal scenes show quills, knives, ink pots, folios, red/black inks, and working desks. Use for clerk detail, especially ledger handling and quill/ink silhouettes.
- Morgan Library [Medieval Money, Merchants, and Morality](https://www.themorgan.org/exhibitions/medieval-money): late-medieval money culture includes account books, creditor registers, purses, coins, and moral tension around wealth. Use for restrained accounting props rather than opulent treasure.
- Kenney [Mini Characters](https://kenney.nl/assets/mini-characters): compact CC0 low-poly animated people with readable proportions. Use as validation that large head/hands plus one or two bold props read better than many tiny decorations.
- Quaternius [Ultimate Animated Character Pack](https://quaternius.com/packs/ultimatedanimatedcharacter.html) and [Ultimate RPG Pack](https://quaternius.com/packs/ultimaterpg.html): CC0 low-poly character packs with simple textured silhouettes. Use as low-poly economy reference: blocky uniform masses, clear accessory shapes, minimal surface noise.

## Silhouette Goals

- First read at thumbnail size: dark-blue civic clerk, brass bank badge, ledger/receipt object, and visible key ring. If the badge and ledger vanish, he collapses back into a generic guide.
- Keep the body upright and squared to the customer, with a small forward service lean. He should look attentive behind a booth, not heroic, wandering, or combat-ready.
- Distinguish from `tutorial_bank_tutor`: the tutor can keep the lesson-book energy; the mainland Banker needs cleaner uniform authority, heavier counter-service props, and less "welcome to the bank" teaching gesture.
- Distinguish from `mainland_shopkeeper`: no apron, stock pouch, price ledger, or trade-goods clutter. The Banker deals in storage and records, not selling inventory.
- Make the torso read like a uniform: high collar or flat lapel blocks, brass trim/badge, compact belt, and darker trousers. The silhouette should be tidy and vertical.
- Add one controlled asymmetry: a left-arm ledger or receipt bundle balanced by a right-hip key ring or coin tray. This gives the model identity without breaking the standard humanoid frame.
- Avoid a top hat, monocle, noble cape, giant money bag, visible treasure chest, combat weapon, wizard staff, or modern suit/tie. Those all pull away from OSRS civic service.

## Color And Materials

- Preserve the bank family palette: deep navy coat, cream shirt, muted brass trim, dark leather belt, charcoal trousers, dark boots.
- Suggested anchors: coat `#20384f`, coat shadow `#17283a`, shirt `#e4dac0`, parchment `#d8c594`, trim/badge/keys `#c9b35c`, coin highlight `#d8c56b`, leather `#46301f`, trouser `#2f343a`, boot `#1d1814`, ink `#1f2426`, wax seal `#8c2f2f`.
- Brass should be dull institutional metal, not treasure gold. Use small bright faces on the badge/key/coins, with darker side faces so the props stay faceted.
- Ledger pages should be warm parchment with two or three dark line strips, not readable text. Red wax or a single red rubric line can add bank-office specificity without visual noise.
- Keep the coat flatter and cleaner than worker clothing. No plaid, bark, ore dust, fish stains, heavy mud, or combat scuffs.
- Skin/hair should stay neutral and reusable. If facial hair is added, make it a tidy clerk moustache or short block beard, not a rugged forester beard.
- Do not let every prop become yellow. Brass badge, key, coin tray, and trim need hierarchy: badge brightest, keys medium, trim muted, coins tiny.

## Prop And Pose Ideas

- Upgrade the inherited ledger into a teller's account book: slightly larger cover, parchment page block, dark strap, and 2-3 horizontal line marks. Keep it on the left lower arm where the existing rig already supports it.
- Add a receipt slip or deposit tag stack tucked into the ledger or belt. This is a better bank cue than a giant money bag and stays readable from the front.
- Keep `banker_till_key`, but make it a small key ring at the right hip: 2-3 rectangular key teeth on a brass loop. The current single key is too easy to miss.
- Add a flat brass bank badge or clasp on the upper chest. It should be the primary front read, not a decorative medallion.
- Optional hand prop: small coin/token tray or counting tile in the right hand/lower arm. Keep it palm-sized; the Banker should not look like he is paying the player personally.
- Optional head detail: low clerk cap, neat side hair, or quill tucked behind one ear. Use only one. A quill is excellent if it silhouettes cleanly against the coat.
- Optional belt detail: red wax seal tag or small ink-pot block. Use sparingly; these can become unreadable specks in the gallery.
- Pose target: feet planted, shoulders square, ledger arm slightly forward, key/receipt hand close to the belt or counter line. No wide waving, pointing, or carrying stance.

## Gallery Scale And Framing

- Keep standard humanoid scale and floor contact. He should not be taller, wider, or more imposing than guides and traders; his authority comes from uniform clarity.
- Best gallery angle: front three-quarter, rotated enough to show the ledger thickness and right-hip key ring while keeping badge and face visible.
- Thumbnail test: at small size, the model should still read as "bank clerk" from navy coat, brass badge, ledger rectangle, and key loop.
- Compare beside `tutorial_bank_tutor`, `mainland_shopkeeper`, `mainland_market_trader`, and `mainland_outpost_guide`. The Banker should be the neatest and most institutional of the everyday town-service NPCs.
- Because the booth is environment, not part of the NPC, do not rely on a counter prop in the gallery. The model must carry enough bank identity alone.
- Avoid side/back-only props. Ten placements and the gallery will use varied camera angles, but the first read should come from front-facing features.

## Concrete Integration Guidance

- Later implementation target: `src/js/content/npc-appearance-catalog.js`, inside `buildMainlandBankerPreset()`, unless the gallery rework creates a central model-authoring layer first.
- Preserve authored identifiers and wiring: `mainland_banker`, label `Banker`, archetype `mainland_bank_clerk`, `appearanceId` usage, `dialogueId: "banker"`, `action: "Bank"`, and all existing `bank:*` service IDs.
- Keep the guide/bank-tutor rig family unless central integration replaces all humanoid authoring. The current base already fits service NPC scale, animation, and gallery preview expectations.
- If continuing the clone path, retain the themed `buildTutorialBankTutorPreset()` base but add 6-9 explicit fragments: `banker_ledger_strap`, `banker_receipt_slips`, `banker_key_ring`, `banker_key_tooth_a`, `banker_key_tooth_b`, `banker_badge_face`, `banker_badge_shadow`, `banker_coin_tray`, `banker_wax_seal`, `banker_quill`.
- Appended extra fragments do not get recolored by `clonePresetWithTheme()`, so set explicit `rgbColor` values on each new mainland-only fragment.
- Favor box fragments attached to `torso`, `leftLowerArm`, `rightLowerArm`, and optionally `head`. Avoid creating a detached booth, desk, chest, vault, or world prop in the NPC preset.
- Keep additions shallow in depth and close to the body. The Banker will often stand near counters, booths, crates, and walls; wide props are likely to clip.
- If adding a coin tray, make it optional and subordinate to the ledger/badge/key read. A visible pile of coins can make him feel like a merchant or loot container.
- Consider a tiny pose adjustment only if the rig supports it cleanly: left forearm slightly forward/down for the ledger, right hand near belt/key. Do not introduce a custom animation dependency for this model.
- Do not edit economy, bank UI, dialogue behavior, world placement, building workbench data, generated assets, or combat/shop systems during visual integration.
- Likely failure modes to guard against: tutorial duplicate, generic blue guide, modern bank teller, rich noble, shopkeeper with ledger, coin-hoarder caricature, unreadable brass specks, or a model that only reads as a banker when placed behind a booth.
