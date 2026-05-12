# Tutorial Island Cleanup Spec

## Purpose

Tutorial Island should feel like a deliberately authored first adventure, not a line of debug stations. The current broad route is good: the player starts on the island edge, moves through survival basics, learns production, practices combat, then reaches banking and exits to Starter Town. The cleanup goal is to make that route read as a spiral inward toward the island center, with fences, gates, NPCs, resources, and dialogue all supporting the same lesson flow.

The player should never need prior RuneScape knowledge to understand the next click. Every lesson needs to answer four questions in-world:

- What item/tool do I need?
- What object or creature do I use it on?
- What result proves I did it?
- Where do I go next?

## North Star

A brand-new player should finish Tutorial Island knowing how the game thinks:

- The world is interacted with through left-click movement, right-click actions, and inventory item use.
- Tools let resources become inventory items.
- Inventory items can be combined with world targets or other inventory items.
- Skills chain into each other: logs become fire and bows, ore becomes metal gear, essence becomes runes, clay becomes a mould.
- Combat has melee, ranged, and magic styles, and each style has a different fuel model.
- Banks are shared storage, not one-off containers.
- Starter Town is bigger, but it uses the same interaction habits learned here.

## Canonical Item Rule

Tutorial Island should teach the real game, not a parallel tutorial inventory.

- Do not add tutorial-only item IDs for weapons, bows, arrows, runes, tools, moulds, or skilling outputs.
- Any item the tutorial gives, requires, equips, consumes, or produces must be a canonical item catalog entry that remains meaningful after leaving the island.
- Instructor grants are allowed for real tools, raw materials, and components when the lesson needs a starting point, but final proof items should be made or completed by the player.
- The target flow is player-made where that lesson is the point: mine and smith the melee gear, finish the bow, make the arrows, craft the runes, and make the crafting output.
- Any temporary grant that skips a production proof must be tracked as tutorial debt, not treated as the final design.

## Layout Intent

The island should keep the existing surface route but make the composition tighter and more legible.

The player should spiral inward:

1. **Arrival Edge:** cabin and starting Tutorial Guide on the outer northwest edge.
2. **Survival Crescent:** woodcutting, pond fishing, firemaking, and cooking wrapped around the pond.
3. **Production Bend:** quarry, furnace, and anvil on the next inward turn.
4. **Combat Arc:** melee chicken pen, then ranged and magic practice along the route toward the center.
5. **Inner Skill Yard:** runecrafting altar, crafting bench, bank booths, and the Tutorial Guide waiting in the center.
6. **Exit:** the same Tutorial Guide identity stands after the bank booths on the forward route, so the player never doubles back to leave.

The center should be used more than it is now, but it should not become a cluttered hub. It should feel like the route naturally tightens into a final yard.

## Fences, Gates, And Boundaries

Fences should frame the route and stations. They should not look like arbitrary lines drawn across open grass.

Fence rules:

- Use open rails along both sides of important path segments.
- No fence segment may cut across the dirt path, a pond, an active station apron, or the player's likely camera view of the next station.
- The survival pond should be fenced around its outer edge, not sliced through the middle.
- Leave obvious fishing gaps or platforms on the pond edge where the Fishing Instructor points the player.
- Fences around the woodcutting/fishing/firemaking cluster should visually group those lessons as one survival area.
- Fences around the quarry and combat areas should act as safety rails, not full boxes.
- The inner skill yard should have partial perimeter rails that suggest enclosure while keeping the center readable.

Gate rules:

- Gates must live in visible fence breaks and read as thresholds between lesson areas.
- Gates should not sit randomly in the middle of a path without fence context.
- Gate placement should be perpendicular to the route and aligned to the local fence rails.
- Each locked gate should be close enough to the next station that its purpose is obvious.
- The final exit gate should be after banking and before the exit Tutorial Guide or exit transition, not before the bank in a way that causes backtracking.

## Station Specs

### 1. Arrival And Movement

Current structure is basically right: cabin, Tutorial Guide, and first door.

Required cleanup:

- Keep the starting Tutorial Guide in the cabin as the movement and interaction explainer.
- Keep the arrival route short and clearly fenced.
- The cabin door should feel like the first threshold into the island route, with the west fence boundary visibly closed off.
- The starting guide should not be the final travel target. The final guide belongs after the bank booths.

Lesson outcome:

- Player learns movement, right-click actions, Examine, and inventory Use.
- Player receives a starter axe only after explicitly saying they are ready.

### 2. Woodcutting, Fishing, Firemaking, Cooking

This should be a tight survival cluster around the pond, not three stations scattered across grass.

Required cleanup:

- Move or cluster normal trees closer to the pond/fire area so woodcutting, fishing, firemaking, and cooking feel connected.
- Keep enough trees to avoid waiting on a single stump, but group them as a grove rather than a wide scatter.
- Put the Fishing Instructor on a clear pond edge.
- Wrap fences around the pond perimeter and survival field edge. Do not run fences through the lake.
- Keep the fire clearing within a short walk of both the trees and the pond.

Lesson outcome:

- Player cuts logs.
- Player catches raw shrimp.
- Player uses tinderbox plus logs to make a fire.
- Player cooks or burns shrimp on that fire.

Acceptable inference:

- The player can learn that resources may fail or temporarily deplete.

Not acceptable:

- The player should not have to infer which side of the pond is fishable.
- The player should not have to infer how item-on-item Use works.

### 3. Mining And Smithing

The quarry/forge bend should be the first production chain where raw materials become equipment.

Target lesson:

- Mine copper and tin.
- Smelt a bronze bar.
- Forge a real bronze melee weapon path, ending in `bronze_sword`.
- Forge `bronze_arrowheads` for the later ranged lesson.

The final design should make the player's melee weapon feel earned. If the current smithing chain only supports an intermediate part such as `bronze_sword_blade`, the remaining assembly into `bronze_sword` should use the existing canonical production system or receive a small canonical recipe extension. It should not become a tutorial-only sword.

Required cleanup:

- Quarry rocks should sit as a readable cluster with copper and tin both visible from the instructor.
- Furnace and anvil should sit near the quarry but not block the route.
- The instructor text should explicitly name the recipe choices the player must select.
- The next gate should open toward combat immediately after the player proves smithing.

Lesson outcome:

- Player understands mine -> smelt -> forge.
- Player understands station UIs can have recipe choices.
- Player carries a real weapon into combat.

### 4. Melee Combat

Melee should use the real `bronze_sword` the player just made or completed through the smithing/crafting chain.

Required cleanup:

- Combat Instructor stands at the entry to the chicken pen or training lane.
- Chicken pen is close enough to the instructor to read as their lesson area.
- Weapon rack/training dummy props are good, but they should not distract from the real target: chickens.
- The instructor should frame the combat lesson as "use what you made."

Lesson outcome:

- Player equips a sword.
- Player attacks a chicken in melee.
- Player notices food can be eaten from inventory if needed.

Not acceptable:

- The player should not need to know what "equip" means without inventory/equipment context.

### 5. Bow Making And Ranged

Ranged should not feel like magic gear appears from nowhere. The target version teaches a small bow-making chain before the ranged hit.

Target lesson:

- Make or finish a real `normal_shortbow` from logs and `bow_string`.
- Pair it with real `bronze_arrows` made from the smithing arrowhead chain.
- Equip the bow and attack from a few tiles away.

Required cleanup:

- Place the Ranged Instructor immediately after melee on the inward route.
- Add a visible archery target or safe line, but keep chickens as the real combat proof if that is what XP requires.
- The instructor may provide real components such as `normal_shortbow_u`, `bow_string`, and `wooden_headless_arrows`, but `bronze_arrowheads` should come from the earlier smithing lesson and the completion proof should be a player-owned finished `normal_shortbow` and `bronze_arrows`.
- No tutorial-only bow or ammo should be introduced, and the target design should not grant finished ranged gear as the lesson proof.

Lesson outcome:

- Player understands ranged uses distance.
- Player understands arrows may stay in inventory while the bow fires them.

### 6. Magic

Magic should be the contrast lesson after ranged: same idea of distance, different fuel.

Required cleanup:

- Magic Instructor should be near the ranged area but visually distinct.
- The magic lesson board is useful; keep it near the instructor, not blocking the route.
- The player should equip a staff, keep ember runes in inventory, and attack from range.

Lesson outcome:

- Player understands staff + rune = spell.
- Player sees that casting spends a rune.
- Player is pointed directly to runecrafting as the answer to "where do more runes come from?"

### 7. Runecrafting

Runecrafting belongs near the center because it explains magic's fuel after the magic lesson.

Required cleanup:

- Runecrafting Instructor must keep a unique silhouette, not reuse the Tutorial Guide look.
- Ember Altar should be visible from the instructor and connected by a short spur.
- Essence crate prop should reinforce the material source.
- Dialogue should name both possible interactions: Craft-rune on altar and Use essence on altar.

Lesson outcome:

- Player converts rune essence into ember runes.
- Player understands runes are crafted fuel, not just ammo loot.

### 8. Crafting

Crafting should show item preparation and inventory item-on-item use.

Required cleanup:

- Crafting Instructor and bench should sit on the same inner yard route after runecrafting.
- The bench should read as the place to work, but the target item remains the borrowed ring in inventory.
- If using pond water for soft clay, the route marker must make it clear the player is revisiting the pond intentionally, not lost.

Lesson outcome:

- Player uses clay on water to make soft clay.
- Player uses soft clay on borrowed ring near the bench.
- Player receives or creates an imprinted mould.

### 9. Banking

Banking should be the last utility lesson before leaving.

Required cleanup:

- Bank booths should sit before the exit guide in the route.
- Bank Tutor should stand by the booths, not on the final exit tile.
- The player deposits a coin from inventory at one booth and withdraws it from the other booth.
- The same Tutorial Guide identity from arrival should appear after the booths, in the center/inner yard on the forward route, with the arrival placement hidden before the center placement appears.

Lesson outcome:

- Player understands bank storage is shared.
- Player understands the inventory grid and bank grid are separate surfaces.
- Player does not double back to leave.

## NPC Identity Requirements

Every instructor should have a distinct silhouette and at least one readable role prop:

- Tutorial Guide: neutral host, arrival/exit continuity.
- Woodcutting Instructor: axe/wood props.
- Fishing Instructor: net/fishing props.
- Firemaking Instructor: tinderbox/fire/cooking props.
- Mining and Smithing Instructor: apron, pick/hammer/ore/metal cues.
- Combat Instructor: armor/weapon trainer silhouette.
- Ranged Instructor: bow/quiver/target cues.
- Magic Instructor: staff/rune board cues.
- Runecrafting Instructor: hood, altar-scribe tabard, essence pouch/tablet/stylus.
- Crafting Instructor: clay/tool-roll/artisan cues.
- Bank Tutor: ledger/badge/banker cues.

The exit Tutorial Guide should be the same character identity as the arrival guide. Their placement must make it feel like the guide has met the player in the center at the end of the route, not like the player is being sent backward.

## Dialogue Rules

Every instructor should keep text short, but every required click must be explicit.

Required dialogue shape:

- Greet: what this station teaches.
- Explain: item/tool, target, and proof.
- Check: what completion condition is being tested.
- Redirect: where to go next.

Terms that must be explained before relying on them:

- Use
- Equip
- Recipe choice
- Inventory
- Bank grid
- Runes as spell fuel
- Ammo/runes staying in inventory

Acceptable player inference:

- That a failed attempt can be retried.
- That right-click reveals more actions after the guide teaches it.
- That nearby props support the lesson.

Unacceptable player inference:

- Which recipe to pick at furnace/anvil.
- Which booth action counts as deposit or withdraw.
- Whether arrows/runes must be equipped or can stay in inventory.
- Whether the altar should be clicked directly or used with essence.
- Where to go after banking.

## Newcomer Assumption Audit

This audit treats the player as someone who has never played RuneScape and does not know OSRS verbs, inventory conventions, or skill chains.

### Arrival

Current text explains left-click movement, right-click action menus, Examine, Use, inventory targeting, and the island route. This is the right place for the global interaction model.

Still inferred:

- The player may not know the inventory icon or panel location if the UI has no highlight.
- The player may not understand that "Use" is a two-click state: first item, then target.

Acceptable:

- The player can learn exact panel locations by opening the HUD once, as long as the guidance marker and dialogue name the needed panel.

Needs guard:

- Do not advance or grant the axe until the player chooses the readiness option.

### Survival Cluster

Current text names the tool, target, result, and next station for woodcutting, fishing, firemaking, and cooking.

Still inferred:

- Trees can temporarily become stumps and recover.
- Fishing attempts can fail before raw shrimp appears.
- Burnt shrimp is acceptable for tutorial proof.

Acceptable:

- Failure and depletion are okay as first-game lessons because the instructors explicitly say retrying is normal.

Needs guard:

- The pond edge and fire clearing must remain visually obvious; no fence should cut through the fishable water or block the fire-clearing read.

### Mining And Smithing

Current text should teach the first multi-step production chain: mine copper and tin, smelt three bronze bars, forge a sword blade and arrowheads, then assemble the real bronze sword with a strapped handle.

Still inferred:

- The recipe UI can contain more choices than the required tutorial choices.
- The player may not know that arrowheads are being saved for a later lesson.

Acceptable:

- Seeing extra recipes is okay if the instructor and marker name Bronze Bar, Bronze Sword Blade, and Bronze Arrowheads directly.

Needs guard:

- Completion must require both `bronze_sword` and `bronze_arrowheads`; otherwise the ranged lesson loses its production chain.

### Melee, Ranged, And Magic

Current text separates the styles: melee uses the sword up close, ranged uses bow plus inventory arrows from a few tiles away, and magic uses staff plus inventory runes from range.

Still inferred:

- The equipment tab is a different surface from inventory.
- The combat system consumes arrows/runes without requiring the player to equip them as a visible weapon.
- The same chicken target can be used for multiple combat styles.

Acceptable:

- Reusing chickens is okay if each instructor explains the different fuel model and distance expectation.

Needs guard:

- Ranged should not advance until finished real bow and arrows exist and ranged XP lands.
- Magic should not advance until a staff/rune spell has granted Magic XP.

### Runecrafting

Current text names both valid interactions: choose Craft-rune on the Ember Altar or use rune essence on the altar.

Still inferred:

- The altar is a station, not an NPC.
- Runes are stackable spell fuel, not a separate spellbook unlock.

Acceptable:

- The player can infer stackability after seeing multiple ember runes in one inventory slot.

Needs guard:

- The Runecrafting Instructor must stay visually distinct from the Tutorial Guide and must sit close enough to the Ember Altar that the altar reads as their station.

### Crafting

Current text says to use clay on pond water, then stand by the bench as a work-area cue while using soft clay on the borrowed ring in inventory.

Still inferred:

- The player is intentionally revisiting the pond, not backtracking because the route failed.

Acceptable:

- A short revisit to the pond is okay if the marker points directly to the pond and then back to the bench.

Needs guard:

- Completion must not accept soft clay alone; it must require mould-shaping proof such as `imprinted_ring_mould`, `ring_mould`, or crafting XP.

### Banking And Exit

Current text explains that bank booths are shared storage, names the inventory-to-bank and bank-grid-to-inventory directions, and points forward to the center-yard Tutorial Guide.

Still inferred:

- The player may not understand that the two booths share one bank until they perform the deposit/withdraw proof.
- The final Tutorial Guide appears only after banking, using the same guide identity from arrival.

Acceptable:

- The shared-bank concept can be learned by doing the proof, as long as the second booth is visibly distinct and nearby.

Needs guard:

- Exit guidance must point forward to the center/inner-yard Tutorial Guide and never require doubling back to the starting cabin.

## Implementation Phases

### Phase 1: Layout And Boundaries

- Move the final Tutorial Guide to the forward route after the bank booths.
- Rework gates so every gate is seated in a fence break.
- Rebuild survival fences around the pond perimeter.
- Tighten tree placements around the survival pond/fire cluster.
- Extend the route into a clearer inward spiral using the center yard.

Checks:

- `npm.cmd run tool:world:validate`
- `node tools/tests/world-authoring-domain-tests.js`
- `node tools/tests/world-bootstrap-parity.js`
- Tutorial Island visual harness overhead and station scenes.

### Phase 2: Production Chain

- Update smithing/tutorial completion to require a real `bronze_sword` before melee.
- Use canonical smithing/crafting assembly for any intermediate `bronze_sword_blade` -> `bronze_sword` step, or add the smallest real recipe extension needed.
- Add a real `normal_shortbow` fletching step before ranged.
- Add a real `bronze_arrows` fletching step from `bronze_arrowheads` before ranged.
- Ensure ranged and magic remain separate lessons with distinct proof.

Checks:

- `node tools/tests/core-tutorial-runtime-guard.js`
- Skill-specific smithing/fletching/ranged/magic tests selected by affected files.

### Phase 3: Text And Markers

- Update guidance markers for any moved station.
- Make every station text follow item -> target -> proof -> next.
- Ensure static dialogue catalog entries match dynamic tutorial wording.
- Remove any wording that assumes RuneScape familiarity.

Checks:

- `node tools/tests/core-tutorial-runtime-guard.js`
- In-app browser dialogue smoke check for each instructor.

### Phase 4: Visual Polish

- Verify every NPC is visually distinct in the relevant camera scenes.
- Add or update visual scenes for survival cluster, combat/ranged, and inner yard if coverage is thin.
- Approve/update visual baselines only after a human visual pass.

Checks:

- `node tools/visual/tutorial-island-visual-harness.js --url http://127.0.0.1:5173/ --scene tutorial-overhead --scene late-skill-yard`
- In-app browser overhead and close camera checks.

## Acceptance Criteria

Tutorial Island is "clean enough" when:

- The route reads as an inward spiral from arrival to center exit.
- No gate appears unsupported by fence context.
- No fence cuts through the pond, the dirt route, or a station work area.
- The survival cluster feels compact: trees, pond, and fire are close enough to understand as one loop.
- The bank lesson ends with the exit Tutorial Guide ahead of the player, not behind them.
- Every instructor has a distinct NPC appearance.
- Every required station interaction names the item/tool, target, and proof.
- The player makes or clearly earns real weapon/bow/ammo/rune/crafting outputs used by later lessons.
- No tutorial-only item IDs are introduced for the core lesson chain.
- World validation, tutorial runtime guards, bootstrap parity, and visual harness checks pass.

## Resolved Decisions

- The melee lesson should require a real `bronze_sword`; if the chain creates `bronze_sword_blade`, the tutorial must complete it through a real assembly step rather than a tutorial-only item.
- The ranged lesson should require a finished real `normal_shortbow` and real `bronze_arrows` before the ranged proof. The arrowheads should be forged during the mining/smithing lesson; later components may be granted as real items, but finished bow/ammo grants are no longer the target flow.
- The same Tutorial Guide uses two authored placements with mutually exclusive tutorial step visibility: arrival through step 10, then center-yard exit at `(250, 334, 0)` from step 11 onward.
- The late-skill yard should use station-specific props rather than one shared generic board: ranged gets target/crate cues, magic gets the lesson board, runecrafting gets altar/essence cues, crafting gets bench/supply cues, and banking gets booth/tutor cues.
