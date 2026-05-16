# Tutorial Bank Tutor (`tutorial_bank_tutor`)

Owned model: Tutorial Bank Tutor (`tutorial_bank_tutor`)

Scope: visual research and model direction for a bespoke OSRS-inspired low-poly NPC gallery model. This brief does not authorize runtime code edits.

## Current Read

- Existing preset: `buildTutorialBankTutorPreset()` in `src/js/content/npc-appearance-catalog.js` clones `buildTutorialGuidePreset()`, relabels it `Bank Tutor`, sets archetype `ledger_bank_tutor`, rethemes the guide coat to bank navy/cream/brass, and adds `ledger_book`, `ledger_pages`, and `bank_badge`.
- Current world placement: `content/world/regions/tutorial_island.json` places `appearanceId: "tutorial_bank_tutor"` beside the Tutorial Island banking lesson as `serviceId: "merchant:tutorial_bank_tutor"`, `spawnId: "npc:tutorial_bank_tutor"`, `action: "Talk-to"`, and `dialogueId: "tutorial_bank_tutor"`.
- Current tutorial text: the tutor teaches "shared storage" through a practical proof: deposit a coin from inventory into one booth, then withdraw it from the bank grid at the other booth.
- Current spec expectation: `docs/TUTORIAL_ISLAND_SPEC.md` says the Bank Tutor should stand by the booths and read through ledger, badge, and banker cues.
- Gallery entry already exists in `window.NpcAppearanceCatalog.previewActors` as `{ actorId: 'tutorial_bank_tutor', label: 'Bank Tutor' }`.
- Main risk: the model reads as "Tutorial Guide in a bank-colored coat." The bespoke version needs to be a first-banking instructor: clearer than a generic guide, warmer and more didactic than the mainland Banker, and readable without relying on the booth prop.

## Tutorial And Gameplay Role

- This NPC is not a normal bank service clerk. He is the final utility teacher before the player leaves the island, bridging inventory management, bank-grid storage, and the idea that multiple booths connect to one shared account.
- The player should read him as "the person who explains the booth" before reading him as "the person who guards valuables." The role is instruction first, banking institution second.
- The tutorial action is tiny but fundamental: one coin moves from inventory to bank and back again. The model should celebrate clarity, not wealth.
- Personality target: patient civic instructor. He should feel like someone who has repeated the same bank lesson hundreds of times and still points to the right square with calm precision.
- Because `mainland_banker` owns the full-service teller role, this model should keep stronger tutorial cues: open ledger, visible lesson slip, slightly more welcoming pose, and a "try this booth first" gesture.
- Avoid making him a merchant, noble, money changer boss, accountant villain, or rich banker caricature. His job is to make storage feel safe and understandable.

## Source Inspiration

- OSRS [Banker tutor](https://oldschool.runescape.wiki/w/Banker_tutor): Barb is the explicit bank tutor reference, with `Talk-to`, `Bank`, and `Collect` options, and an examine line about teaching banking. Use this for the hybrid read of tutor plus banker, especially the idea that a teacher can still be a functional bank NPC.
- OSRS [Banker](https://oldschool.runescape.wiki/w/Banker): bankers safely store coins and items, often stand behind booths/desks, and vary by region while preserving the same service identity. Use this for institutional bank language, but soften it for a tutorial NPC.
- OSRS [Bank](https://oldschool.runescape.wiki/w/Bank): banks are deposit/store/withdraw facilities, with interface concepts like bank space, search, deposit inventory, quantity toggles, and a bank tutorial button. Use this for small UI-shaped props: grid card, question-mark help tab, deposit/withdraw arrows, and orderly slots.
- OSRS [Bank booth](https://oldschool.runescape.wiki/w/Bank_booth): the booth is the counter where the teller serves the player. Use this for posture: counter-facing, slightly forward, one hand ready to indicate the booth.
- OSRS [Tutorial Island](https://oldschool.runescape.wiki/w/Tutorial_Island): the bank building introduces the Bank of Gielinor, bank booths, account storage, and the broader tutorial habit of learning by doing. Use this for the late-route, first-time-player tone.
- OSRS [Account Guide](https://oldschool.runescape.wiki/w/Account_Guide): this bank-area guide teaches account options and safety. Borrow the "professional helper in the bank room" flavor only; do not duplicate his account-management identity.
- BnF [Le changeur](https://essentiels.bnf.fr/fr/image/7dbca7e9-0d18-4737-a15c-b76b8161594d-changeur): medieval money changer with balance, purse, and handling tools. Borrow the small balance/purse/accountability vocabulary, not the full money-trader silhouette.
- British Library [The Burden of Writing: Scribes in Medieval Manuscripts](https://britishlibrary.typepad.co.uk/digitisedmanuscripts/2014/06/the-burden-of-writing-scribes-in-medieval-manuscripts.html): scribes with quills, ink pots, page knives, folios, and desks are strong clerk references. Use for ledger handling, quill shape, and page-mark accents.
- Morgan Library [Medieval Money, Merchants, and Morality](https://www.themorgan.org/exhibitions/medieval-money): account books, creditor registers, purses, coins, and strongboxes are useful medieval finance cues. Keep them tiny and instructional, not luxurious.
- Kenney [Mini Characters](https://kenney.nl/assets/mini-characters): CC0 low-poly characters prove that oversized heads/hands and one or two bold props beat small surface details. Use this as a readability constraint for the gallery.
- Quaternius [Ultimate Animated Character Pack](https://quaternius.com/packs/ultimatedanimatedcharacter.html) and [Universal Base Characters](https://quaternius.com/packs/universalbasecharacters.html): CC0 low-poly humanoid references for animation-friendly proportions, blocky accessories, and clean faceted material splits.

## Silhouette Goals

- First read at thumbnail size: navy bank tutor, open ledger or bank-grid board, brass badge, and one pointing/teaching hand.
- Keep the tutorial silhouette distinct from `mainland_banker`: lighter, more open, less teller-authoritative, and more "watch this step" than "next customer."
- Keep the body upright but friendly. A slight forward lean and one forearm extended toward an imaginary booth is better than a square clerk stance.
- Make the open ledger the main asymmetry. It should sit forward enough to read from front three-quarter and should include a visible pale page block.
- Add one explicit tutorial prop: a small rectangular bank-grid slate, a parchment slip with two arrow marks, or a question-mark help tab. This is what separates him from a normal banker with a ledger.
- Badge should remain the front bank cue, but it should be smaller than the lesson prop. The lesson matters more than authority.
- Avoid a giant money bag, top hat, monocle, noble cape, vault key as big as a weapon, treasure chest, abacus wall, or modern suit/tie.
- Keep all props close to the humanoid frame. The tutor stands near booths and in the gallery; wide held boards or detached counter fragments will clip or steal the environment's job.

## Color And Materials

- Preserve the bank-tutor family palette: deep navy coat, cream shirt, muted brass trim, dark brown belt, charcoal trousers, dark boots, parchment pages, and dull red-brown ledger cover.
- Suggested anchors: coat `#1d3550`, coat shadow `#14263a`, shirt `#e4dac0`, trim/badge `#c8a64c`, ledger cover `#5c2f26`, parchment `#e8d9ac`, ink `#22282a`, belt `#4d321f`, trousers `#2f343a`, boots `#1d1814`, lesson accent blue `#6f9ac6`, wax/check accent `#9b3a32`.
- Materials should be flat-shaded and faceted. Use stepped geometry and clear color blocks rather than texture noise or readable writing.
- Parchment and UI-slate details need strong value contrast against the navy coat. Two or three dark line strips can imply text; never rely on actual tiny letters.
- Brass should be instructional-bank brass, not treasure gold. The badge can be the brightest metal; any key, coin, clasp, or page corner should be dimmer.
- A tiny blue or pale-teal mark is allowed on the lesson slate to echo interface guidance, but keep the palette mostly medieval bank-office rather than modern UI.
- Skin, hair, and facial hair should stay neutral and tutorial-friendly. A tidy short beard, small moustache, or simple clerk cap is acceptable; rugged worker hair or rich banker grooming is not.

## Prop And Pose Ideas

- Upgrade `ledger_book` into an open lesson ledger: left page as "inventory," right page as "bank," with two chunky line groups and one arrow/check mark implied by geometry.
- Add `bank_tutor_lesson_slate`, a small held or torso-tucked rectangle showing a simplified bank grid: 3x2 pale slots, one coin dot, and one arrow strip. This can be larger than realistic because it is the core lesson prop.
- Add `bank_tutor_deposit_slip` tucked into the ledger or belt: a pale parchment tab with one red wax/check accent, readable as "completed step."
- Keep `bank_badge`, but flatten it into a clean shield or round clasp on the upper chest so it reads at gallery scale without competing with the ledger.
- Optional right-hand prop: one oversized bronze coin token pinched between fingers or floating just above the lesson slate. One coin is enough; piles of coins make him a banker/merchant.
- Optional hip detail: tiny key loop or booth token, but only if it stays subordinate to ledger/slate/badge. The mainland Banker can own the stronger key-ring read.
- Optional head detail: modest clerk cap or quill tucked behind the ear. Choose one. A quill gives scribe/tutor flavor if it silhouettes cleanly against the head.
- Pose target: left forearm cradles the open ledger, right hand points toward the imaginary booth or the lesson slate, shoulders open, head tilted toward the player.
- Idle animation target for later: small page tilt, right-hand point softens, then returns to neutral. No coin counting, no impatient tapping, no shopkeeper sales flourish.

## Gallery Scale And Framing

- Keep standard tutorial humanoid scale. He should line up with `tutorial_guide`, `tutorial_crafting_instructor`, and `mainland_banker`; identity must come from props and posture.
- Best gallery angle: front three-quarter from the ledger side, rotated enough to show page thickness while keeping badge, face, and pointing hand visible.
- Required thumbnail read order: navy coat, open ledger/lesson slate, pointing hand, brass badge, parchment slips, optional quill/cap.
- Compare directly beside `tutorial_guide`, `tutorial_crafting_instructor`, `tutorial_runecrafting_instructor`, and `mainland_banker`. The Bank Tutor should be the clearest "interface lesson" NPC in that lineup.
- Do not include a booth, desk, chest, or bank sign as part of the NPC model. World props already own the booth context; the gallery model must still stand alone.
- Keep the readable front face clean. Back-only pouches, rear key rings, and tiny side props will not communicate the tutorial role.
- Props should be slightly oversized and separated by color. Realistic quills, coins, and paper slips will disappear at the NPC gallery scale.

## Concrete Integration Guidance

- Later implementation target: `src/js/content/npc-appearance-catalog.js`, inside `buildTutorialBankTutorPreset()`, unless the central NPC gallery/model rework introduces a dedicated authored model layer first.
- Preserve authored identifiers and wiring: `tutorial_bank_tutor`, label `Bank Tutor`, archetype `ledger_bank_tutor`, `appearanceId`, `spawnId: "npc:tutorial_bank_tutor"`, `dialogueId: "tutorial_bank_tutor"`, gallery actor entry, and tutorial-stage guidance.
- Lowest-risk pass: keep the current `buildTutorialGuidePreset()` inheritance and bank theme, then replace the three generic add-ons with a richer set of tutor-specific fragments.
- Suggested fragments: `bank_tutor_open_ledger_cover`, `bank_tutor_left_page`, `bank_tutor_right_page`, `bank_tutor_page_lines`, `bank_tutor_deposit_arrow`, `bank_tutor_lesson_slate`, `bank_tutor_grid_slot_a`, `bank_tutor_grid_slot_b`, `bank_tutor_coin_dot`, `bank_tutor_badge_face`, `bank_tutor_deposit_slip`, `bank_tutor_quill`, `bank_tutor_cap`.
- Favor box fragments attached to `torso`, `leftLowerArm`, `rightLowerArm`, and optionally `head`. Avoid detached booth/counter/chest/desk fragments in the NPC preset.
- If `clonePresetWithTheme()` remains the path, remember that appended extra fragments are not recolored by role substring replacement unless their roles match theme keys. Set explicit `rgbColor` values for all new `bank_tutor_*` fragments.
- Make the lesson slate/ledger readable from the same camera assumptions as the NPC gallery and dialogue portrait. Test front three-quarter and portrait framing before adding side-only details.
- Keep any pose adjustments local to the existing humanoid rig defaults. Do not introduce a custom animation dependency just to support the pointing hand.
- Do not edit bank economy, bank UI behavior, tutorial progression, dialogue strings, booth landmarks, world placement, generated assets, or main-overworld banker service logic during visual integration.
- Likely failure modes to guard against: generic blue Tutorial Guide, duplicate `mainland_banker`, rich money-handler, modern helpdesk employee, merchant with ledger, unreadable paper specks, lesson prop hidden behind the arm, or a model that only reads as banking when placed beside a booth.
- Suggested checks for later runtime work: `node .\tools\tests\npc-model-gallery-runtime-guard.js`, then manual `/qa npcgallery` inspection focused on `tutorial_bank_tutor`. This brief itself requires no runtime test.
