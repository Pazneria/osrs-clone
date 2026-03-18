# Melee Spec

## Purpose

Melee is the close-range combat style for fighting with equipped melee weapons at adjacent range.

Melee plugs into the shared combat engine defined by combat core and owns melee weapon families, melee attack profiles, melee-specific equipment progression, and melee-side runtime selection rules. Combat core remains the owner of shared combat timing, target lock, pursuit, cooldown tracking, hit resolution structure, damage application, eating interaction, and immediate death interruption.

## Scope Boundaries

| System | Ownership |
| ------ | --------- |
| Combat Core | Shared combat timing, target validation, pursuit, cooldown tracking, hit resolution structure, damage application, eating interaction, and immediate on-death interruption |
| Melee | Melee weapons, melee attack profiles, melee range usage, melee-side progression, and melee-specific runtime rules that do not override combat core |
| Smithing | Metal blade and metal armor item identity; melee-relevant finished armor stats |
| Fletching | Base wooden handle item identity |
| Crafting | Strapped handle identity and final sword assembly |
| Enemy Spec | Enemy aggro acquisition, chase range, enemy melee attack profile assignment, and enemy home/reset behavior |

## Relationship to Combat Core

Melee does not redefine combat core.

Melee uses the shared combat model already established elsewhere:

- Combat is tick-based and single-target under the base model.
- A locked target remains engaged until broken by the shared invalidation, path, chase, or manual-break rules.
- If an actor has a valid locked target and Remaining Attack Cooldown reaches 0, the actor attacks automatically on that same tick before movement.
- If an actor attacks on a tick, that actor does not move on that tick.
- Diagonal adjacency counts as valid melee range.
- If multiple actors are ready on the same tick, they may all attack on that same tick.
- If a target dies earlier in the same tick, the queued melee attack fizzles and no cooldown is spent.

## Core Melee Model

Under the current 1–40 band, melee is the default close-range combat style and is centered on swords as the primary dedicated player melee weapon family.

Melee attacks require adjacent range, including diagonal adjacency. Valid melee range is therefore range 1 under the shared square-range system.

Player melee accuracy and player melee max hit use the canonical melee formulas.

Melee is the authoritative owner of the player melee max-hit formula, and combat core should reference melee for that formula rather than redefining a separate melee version.

- **Player Melee Attack Value** = Attack + Melee Accuracy Bonus
- **Player Melee Max Hit** = ceil(((Strength * 1.6) + Melee Strength Bonus) / 10)
- **Player Melee Defence Value** = Defence + Melee Defence Bonus

Hit resolution uses the shared opposed random roll model rather than a melee-only accuracy formula.

## Current Player Melee Weapon Family

The current primary dedicated player melee weapon family is swords.

However, melee is not limited to purpose-built weapons. Any equippable held item should have melee stats, even if combat is not its primary intended role.

That includes, at minimum:

- swords
- axes
- pickaxes
- harpoons
- fishing rods

This keeps melee behavior implementation-clean:

- if an item is equippable, it can be used as the player’s current melee attack source unless a later spec explicitly says otherwise
- every equippable held item must therefore define melee-relevant combat data
- non-combat tools may have weak melee stats, but they should not be statless in combat

The existing cross-skill equipment pipeline already defines the sword progression:

- smithing creates sword blades
- fletching creates base handles
- crafting creates strapped handles and performs final sword assembly

### Sword Progression

| Weapon | Required Combat Tier | Upstream Components |
| ------ | -------------------- | ------------------- |
| Bronze Sword | Bronze | Bronze Sword Blade + Wooden Handle w/ Strap |
| Iron Sword | Iron | Iron Sword Blade + Wooden Handle w/ Strap |
| Steel Sword | Steel | Steel Sword Blade + Oak Handle w/ Strap |
| Mithril Sword | Mithril | Mithril Sword Blade + Willow Handle w/ Strap |
| Adamant Sword | Adamant | Adamant Sword Blade + Maple Handle w/ Strap |
| Rune Sword | Rune | Rune Sword Blade + Yew Handle w/ Strap |

## Equippable Item Combat Rule

Anything equippable should have melee stats.

For implementation purposes, every equippable held item should expose at least:

- Melee Accuracy Bonus
- Melee Strength Bonus
- Attack Tick Cycle
- Attack Range
- Weapon Family or Tool Family tag

If an equippable item is intended to be poor in combat, that should be represented by weak values rather than by missing combat data.

## Current Player Melee Equipment Stats

These are the current canonical first-pass melee stats for all currently melee-capable equippable held items.

Swords remain the dedicated combat line by using the faster 4-tick cycle. Other current equippable tools are melee-usable but currently attack on 5-tick cycles.

### Unified Held-Item Melee Stat Table

| Item | Family | Required Attack Level | Attack Range | Attack Tick Cycle | Melee Accuracy Bonus | Melee Strength Bonus | Damage Type | Projectile | Ammo Use | Assumed Strength Level | Calculated Max Hit | Notes |
| ---- | ------ | --------------------- | ------------ | ----------------- | -------------------- | -------------------- | ----------- | ---------- | -------- | ---------------------- | ------------------ | ----- |
| Bronze Sword | Sword | 1 | 1 | 4 | 4 | 4 | Melee | None | None | 1 | 1 | Dedicated combat weapon |
| Iron Sword | Sword | 1 | 1 | 4 | 6 | 6 | Melee | None | None | 1 | 1 | Dedicated combat weapon |
| Steel Sword | Sword | 10 | 1 | 4 | 10 | 10 | Melee | None | None | 10 | 3 | Dedicated combat weapon |
| Mithril Sword | Sword | 20 | 1 | 4 | 15 | 15 | Melee | None | None | 20 | 5 | Dedicated combat weapon |
| Adamant Sword | Sword | 30 | 1 | 4 | 21 | 21 | Melee | None | None | 30 | 7 | Dedicated combat weapon |
| Rune Sword | Sword | 40 | 1 | 4 | 28 | 28 | Melee | None | None | 40 | 10 | Dedicated combat weapon |
| Bronze Axe | Axe | 1 | 1 | 5 | 4 | 2 | Melee | None | None | 1 | 1 | Tool; melee-usable while equipped |
| Iron Axe | Axe | 1 | 1 | 5 | 6 | 3 | Melee | None | None | 1 | 1 | Tool; melee-usable while equipped |
| Steel Axe | Axe | 10 | 1 | 5 | 10 | 5 | Melee | None | None | 10 | 3 | Tool; melee-usable while equipped |
| Mithril Axe | Axe | 20 | 1 | 5 | 15 | 7 | Melee | None | None | 20 | 4 | Tool; melee-usable while equipped |
| Adamant Axe | Axe | 30 | 1 | 5 | 21 | 10 | Melee | None | None | 30 | 6 | Tool; melee-usable while equipped |
| Rune Axe | Axe | 40 | 1 | 5 | 28 | 14 | Melee | None | None | 40 | 8 | Tool; melee-usable while equipped |
| Bronze Pickaxe | Pickaxe | 1 | 1 | 5 | 4 | 2 | Melee | None | None | 1 | 1 | Tool; melee-usable while equipped |
| Iron Pickaxe | Pickaxe | 1 | 1 | 5 | 6 | 3 | Melee | None | None | 1 | 1 | Tool; melee-usable while equipped |
| Steel Pickaxe | Pickaxe | 10 | 1 | 5 | 10 | 5 | Melee | None | None | 10 | 3 | Tool; melee-usable while equipped |
| Mithril Pickaxe | Pickaxe | 20 | 1 | 5 | 15 | 7 | Melee | None | None | 20 | 4 | Tool; melee-usable while equipped |
| Adamant Pickaxe | Pickaxe | 30 | 1 | 5 | 21 | 10 | Melee | None | None | 30 | 6 | Tool; melee-usable while equipped |
| Rune Pickaxe | Pickaxe | 40 | 1 | 5 | 28 | 14 | Melee | None | None | 40 | 8 | Tool; melee-usable while equipped |
| Fishing Rod | Fishing Rod | 10 | 1 | 5 | 8 | 4 | Melee | None | None | 10 | 2 | Tool; melee-usable while equipped |
| Harpoon | Harpoon | 30 | 1 | 5 | 18 | 9 | Melee | None | None | 30 | 6 | Tool; melee-usable while equipped |
| Rune Harpoon | Harpoon | 40 | 1 | 5 | 24 | 12 | Melee | None | None | 40 | 8 | Tool; melee-usable while equipped |

### Max-Hit Formula Used For Table

**Player Melee Max Hit** = ceil(((Strength * 1.6) + Melee Strength Bonus) / 10)

The Assumed Strength Level column is only a tuning benchmark for readability. It assumes the player’s Strength level matches the item’s current progression band.

### First-Pass Tool-Stat Rule

For bronze through rune axes and pickaxes, melee accuracy currently matches the existing metal-tier progression already used by swords, but non-dedicated held tools use reduced melee strength values.

For v1, the Unified Held-Item Melee Stat Table is authoritative. Historical or prior values are not part of the runtime contract.

That keeps metal-tier recognition and accuracy growth clean across held-item families while swords remain the clearly better combat choice through both faster attack speed and stronger damage output.

Fishing tools do not have an existing inherited metal-tier combat-stat table elsewhere, so their current melee values are first-pass explicit placeholders.

- Fishing Rod: 8 accuracy, 4 strength, 5 ticks
- Harpoon: 18 accuracy, 9 strength, 5 ticks
- Rune Harpoon: 24 accuracy, 12 strength, 5 ticks

These can be retuned later without changing the broader melee framework.

## Current Player Melee Armor Support

Melee currently also benefits from metal armor progression already defined elsewhere.

Under the current base model, metal armor contributes melee defence bonus through equipped armor stats. Melee does not own armor creation, but melee should recognize the existing armor band as the main physical-defence progression for close combat.

### Current Armor Band

| Armor Piece | Bronze | Iron | Steel | Mithril | Adamant | Rune |
| ----------- | ------ | ---- | ----- | ------- | ------- | ---- |
| Boots | +1 | +2 | +3 | +5 | +7 | +10 |
| Helmet | +3 | +5 | +8 | +12 | +17 | +24 |
| Shield | +4 | +6 | +10 | +15 | +21 | +28 |
| Platelegs | +5 | +8 | +12 | +18 | +25 | +34 |
| Platebody | +7 | +10 | +15 | +22 | +30 | +40 |

These values are treated as the current generic defence baseline for all incoming combat styles unless a later armor or combat spec expands them into style-split bonuses.

For v1, these armour values are copied equally into Melee Defence Bonus, Ranged Defence Bonus, and Magic Defence Bonus.

## Player Melee Attack Profiles

Melee owns combat profile data for equippable melee-capable held items.

Attack speed is attached to the equipped item, not to melee as a global style rule.

That means each equippable held item should define its own combat profile, including its own attack tick cycle.

For the first pass, swords remain the primary intended combat weapon family, but tools should still have valid melee profiles.

### Equipped-Item Combat Profile Rule

Every equippable held item that can be used in melee should expose at minimum:

- Attack Style Family
- Weapon Family or Tool Family
- Attack Range
- Attack Tick Cycle
- Melee Accuracy Bonus
- Melee Strength Bonus
- Damage Type
- Projectile flag
- Ammo Use flag
- optional animation or VFX hook data

Unless a later spec explicitly overrides them, current melee-capable held items use these shared defaults:

- Attack Style Family: Melee
- Damage Type: Melee
- Attack Range: 1
- Diagonal adjacency counts as valid range
- Projectile: None
- Ammo Use: None

### Baseline Sword Combat Identity

Swords are the current default dedicated combat weapon family.

Their baseline identity is:

- melee range 1
- diagonal adjacency counts
- no projectile
- no ammo use
- planted trading once in position
- all swords use a 4-tick attack cycle for the current first pass

### Tool-as-Melee Rule

Axes, pickaxes, harpoons, and fishing rods are valid melee equipment when equipped.

They should each provide their own melee stat line and item combat profile data, even if their combat performance is intentionally weaker or less efficient than swords at the same progression band.

The default first-pass assumptions are:

- they use melee range 1
- diagonal adjacency counts
- they do not use projectiles or ammo when making melee attacks
- they follow the same shared cooldown and target-lock rules as other melee items
- axes, pickaxes, harpoons, and fishing rods currently use 5-tick attack cycles

This gives melee a clean default identity:

- adjacent only
- planted trading once in position
- swords currently attack every 4 ticks
- other current equippable tools attack every 5 ticks
- no ammo and no projectile timing layer for standard melee use

## Melee Runtime Rules

These rules are melee-specific overlays on top of the shared combat engine.

### Player Melee Engagement Rules

- If the player has a melee weapon equipped and locks a valid target, the player follows the shared pursuit rules until reaching the first valid adjacent melee tile.
- If the player is already in valid melee range and Remaining Attack Cooldown is 0, the melee hit resolves immediately on that same tick before movement.
- If the player attacks on that tick, the player does not move on that tick.
- If the target steps out of melee range, player pursuit resumes on the next tick under the shared combat rules.
- If the player manually clicks the ground or otherwise gives manual movement input, melee target lock breaks immediately.
- Melee does not add any wind-up, swing delay, or post-hit linger beyond the equipped item’s own attack tick cycle.

### Enemy Melee Engagement Rules

Enemy melee attacks follow the same universal combat timing model.

Enemy-specific aggro acquisition, chase range, and reset behavior belong in enemy data, but once an enemy has locked a melee target:

- it chases until in valid melee range
- it stops at the first valid adjacent melee tile
- once an enemy reaches a valid adjacent tile, the earliest melee attack is the next tick that starts in range with Remaining Attack Cooldown = 0
- it attacks automatically whenever its cooldown reaches 0 on a tick that starts in range
- if it attacks on that tick, it does not move on that tick
- if the target leaves range, it resumes pursuit on the next tick

This preserves the intentionally simple dumb-enemy behavior already established for the project.

## Enemy Melee Data Model

Melee should expect enemy melee attackers to provide attack-profile data in a simple format.

These are in addition to shared enemy combat fields such as Hitpoints, Attack, Strength, and Defence.

### Minimum Additional Enemy Melee Attack-Profile Fields

| Field | Meaning |
| ----- | ------- |
| Attack Style Family | Must be Melee for melee attackers |
| Attack Tick Cycle | Enemy melee cooldown length |
| Attack Range | Normally 1 |
| Enemy Max Hit | Maximum successful hit damage |
| Enemy Melee Accuracy Bonus | Enemy-side accuracy modifier |
| Enemy Melee Defence Bonus | Enemy-side defence modifier |
| Attack Animation Key | Animation or timing hook for the client |

For the current project phase, enemy melee should usually default to range 1 unless a later monster explicitly breaks that rule.

## Attack Styles and XP Ownership

Combat core handles combat resolution, but melee should define both the combat effects and XP routing of melee attack styles.

### Attack-Style Combat Rule

Melee attack styles affect both performance and XP gain.

Current first-pass melee attack styles are:

| Attack Style | Combat Effect | XP Trained |
| ------------ | ------------- | ---------- |
| Attack | +10% melee accuracy | Attack + Hitpoints |
| Strength | +10% melee max hit | Strength + Hitpoints |
| Defence | +10% melee defence | Defence + Hitpoints |

All melee attack styles train Hitpoints.

### Attack Style Selection Rule

Attack styles are universal across all melee-capable held items, including non-dedicated tools.

For the current first pass:

- all melee-capable held items use the same Attack / Strength / Defence style set
- the player has one currently selected melee attack style
- that selected melee style persists until changed
- the selected melee style applies to whatever melee-capable held item is currently equipped
- enemies do not use player attack styles
- enemy melee performance comes only from enemy melee profile data

This keeps style handling simple and implementation-light.

The formulas in Core Melee Model define base melee values. When a style is selected, the style-adjusted values below become the final values consumed by combat core.

### Style Modifier Rules

Attack style applies a 10% bonus to the player's final melee attack value.

- derive the base melee attack value first
- apply the style multiplier second
- round down last
- **Attack Style Melee Attack Value** = floor((Attack + Melee Accuracy Bonus) * 1.10)

Strength style applies a 10% bonus to the player's final melee max hit.

- derive the base melee max hit first
- apply the style multiplier second
- round up last
- **Strength Style Melee Max Hit** = ceil((ceil(((Strength * 1.6) + Melee Strength Bonus) / 10)) * 1.10)

Defence style applies a 10% bonus to the player's final melee defence value.

- derive the base melee defence value first
- apply the style multiplier second
- round down last
- **Defence Style Melee Defence Value** = floor((Defence + Melee Defence Bonus) * 1.10)

Styles only modify their own intended combat output:

- Attack style does not raise max hit or defence
- Strength style does not raise accuracy or defence
- Defence style does not raise accuracy or max hit

This keeps style choice simple and meaningful:

- Attack style is better for hitting reliably
- Strength style is better for pushing damage upward
- Defence style is better for reducing incoming melee hit success

If the UI later surfaces named styles such as accurate, aggressive, or defensive, those named styles should map onto this same combat-and-XP structure rather than inventing a separate system.

## Equipment Requirements

Melee should make equipment requirements explicit at use time.

### Sword Equip Rules

| Weapon | Required Attack Level |
| ------ | --------------------- |
| Bronze Sword | 1 |
| Iron Sword | 1 |
| Steel Sword | 10 |
| Mithril Sword | 20 |
| Adamant Sword | 30 |
| Rune Sword | 40 |

If you want, these can later split into:

- crafting requirement to create the item
- attack requirement to equip and use the item

For now, keeping the combat-use requirement mapped to tier is clean and predictable.

### Equippable Tool Combat Rule

Equippable non-sword tools should also be melee-usable while equipped.

That means melee should expect combat-capable equipped versions of at least:

- axes
- pickaxes
- harpoons
- fishing rods

Their skilling ownership remains with their parent skill specs, but melee owns the rule that equipped held items must expose combat stats usable by the shared melee system.

### First-Pass Required Attack Levels For Current Equippable Tools

To keep combat-use gating clean and predictable, current equippable tools use the same common-sense Attack-level banding as the matching combat tiers unless a later spec overrides them.

| Item | Required Attack Level |
| ---- | --------------------- |
| Bronze Axe | 1 |
| Iron Axe | 1 |
| Steel Axe | 10 |
| Mithril Axe | 20 |
| Adamant Axe | 30 |
| Rune Axe | 40 |
| Bronze Pickaxe | 1 |
| Iron Pickaxe | 1 |
| Steel Pickaxe | 10 |
| Mithril Pickaxe | 20 |
| Adamant Pickaxe | 30 |
| Rune Pickaxe | 40 |
| Fishing Rod | 10 |
| Harpoon | 30 |
| Rune Harpoon | 40 |

### First-Pass Required Defense Levels For Current Armor

Current metal armor should use tier-based Defense requirements at equip time, and jewelry should not inherit those armor gates.

| Armor Tier | Required Defense Level |
| ---------- | ---------------------- |
| Bronze | 1 |
| Iron | 1 |
| Steel | 10 |
| Mithril | 20 |
| Adamant | 30 |
| Rune | 40 |

## Merchant / Economy Relationship

Melee does not own item creation or most shop logic, but it should recognize the current melee economy shape.

### Current Economic Shape

- finished swords are assembled in crafting
- early and mid melee gear can exist through player production and sold-back stock
- rune-tier melee gear is player-made rather than standard shop stock
- general stores buy everything at half price

Melee should not redefine item values here unless it becomes the canonical equipment-combat-stat owner later.

## UI / Interaction Expectations

### Baseline Player Flow

1. Equip a melee-capable held item.
2. Click an enemy.
3. Path to the first valid adjacent melee tile.
4. Attack immediately if in range and off cooldown.
5. Remain planted and continue trading hits automatically while target lock holds.
6. Resume pursuit automatically if the target moves away.
7. Break target lock immediately on manual movement input.

This should feel simple, planted, and readable.

## Non-Goals for This Spec

This melee spec does not yet define:

- special attacks
- alternate dedicated melee weapon families beyond swords
- additional or more complex attack-style variants beyond the current Attack / Strength / Defence set
- prayer, buffs, debuffs, or status effects
- multi-target melee attacks
- knockback, stun, or forced movement
- PvP-specific exceptions
- weapon reach differences beyond standard melee range 1

Those can be layered later without disturbing the core melee foundation.

## Initial Decisions

| Topic | Decision |
| ----- | -------- |
| Primary intended player melee weapon family | Swords |
| Equippable held tools can be used in melee | Yes |
| Anything equippable should have melee stats | Yes |
| All current melee-capable held items default to melee damage, no projectile, and no ammo | Yes |
| Base melee range | 1 |
| Diagonal melee range valid | Yes |
| Attack speed is attached to equipped items | Yes |
| All current swords use 4 ticks | Yes |
| All current non-sword equippable tools use 5 ticks | Yes |
| Melee uses shared cooldown engine | Yes |
| Melee uses shared opposed hit rolls | Yes |
| Melee owns pursuit/path rules | No |
| Melee owns target lock rules | No |
| Melee owns death interruption | No |
| Melee adds extra swing delay beyond cooldown | No |
| Enemy melee default range | 1 |
| Attack styles are universal across all melee-capable held items | Yes |
| Player melee style selection persists until changed | Yes |
| Enemies do not use player attack styles | Yes |
| First-pass style complexity | Low |

## Recommended Next Additions

The next useful pass after this one is probably:

1. UI and input presentation for melee attack-style selection
2. enemy melee profile templates
3. retuning pass for fishing-tool melee stats if needed
4. whether later armor or combat specs should split generic defence into style-specific bonuses
5. whether later specs should add dedicated non-sword melee weapon families beyond the current held-item set

## Clean Implementation Goal

Melee should be implementation-light.

The combat engine should already know how to:

- keep a locked target
- move into valid range
- stop on the first valid attack tile
- attack when cooldown reaches 0
- prevent movement on attack ticks
- fizzle attacks if the target dies earlier that tick

So melee mostly needs to provide:

- weapon family definitions
- combat stat values for melee weapons
- melee attack-profile data
- equip requirements
- melee attack-style combat and XP routing

That keeps melee from fighting the combat core spec and gives you a clean base to expand later.
