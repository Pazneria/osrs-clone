# Advanced Fletcher (`mainland_advanced_fletcher`)

Owned model: Advanced Fletcher (`mainland_advanced_fletcher`)

Scope: research and model direction only. Do not edit runtime code in this pass.

## Current Read

- Live preset: `buildMainlandAdvancedFletcherPreset()` in `src/js/content/npc-appearance-catalog.js` clones `buildTutorialRangedInstructorPreset()`, relabels it as `Advanced Fletcher`, sets archetype `seasoned_bowyer`, rethemes the instructor greens/browns, and adds one small gold `bowyer_rune_mark` on the torso.
- Because the base is the Ranged Instructor, the model already has a bow, quiver, armored trainer mass, cape language, and inherited combat silhouette. It reads competent, but currently leans "green ranged combat instructor" more than "workshop master who buys finished bows."
- Current palette direction is useful: deep green cloth/armor, brown leather, muted bronze, yew-bow browns, and dark quiver leather. The weak point is material assignment: too much inherited steel/mail/cape bulk for a craft merchant.
- Nearby contrast target: `mainland_fletching_supplier` is a worker/vendor with feather bundle and string spool. The Advanced Fletcher should feel more selective and expert: inspecting grain, tillering bows, and judging yew proof work rather than selling starter supplies.

## Profession And Gameplay Role

- World role: advanced fletching buyer at the north-road/Woodwatch fletchers workshop, using appearance ID `mainland_advanced_fletcher`.
- Merchant role: buys the full fletching output chain, including handles, staffs, shafts, headless arrows, finished arrows, unstrung bows, and finished bows; does not sell stock.
- Quest role: gates his deeper ledger behind `Proof of the Yew`, requiring `yew_handle`, `yew_longbow`, and `yew_shortbow`. The visual should quietly say "I grade late-band yew work."
- Dialogue voice: "Straight grain, clean fletching, honest balance." Model read should be precise, calm, and craft-proud instead of dramatic or martial.

## Source Inspiration

- OSRS Fletching frames the skill as producing ranged weapons and ammunition from logs, bow strings, shafts, feathers, and arrow heads. Use that whole workflow, not only a bow-on-back cue. Source: https://oldschool.runescape.wiki/w/Fletching
- OSRS Hickton is the master fletcher in Catherby, owns Hickton's Archery Emporium, and sells the Fletching cape. Use him as "master shopkeeper" precedent, not as a costume copy. Source: https://oldschool.runescape.wiki/w/Hickton
- OSRS Yew longbow is the clean late-bow reference for this NPC: yew wood, unstrung bow, bow string, and high-value finished product. Source: https://oldschool.runescape.wiki/w/Yew_longbow
- OSRS Bow pages support a simple shortbow/longbow vocabulary: readable curved limbs, visible string, and restrained ranged-weapon silhouettes. Source: https://oldschool.runescape.wiki/w/Bow
- Heritage Crafts' bowyery notes are excellent real-world craft cues: yew timber, drawknife/rasp shaping, tillering to check the curve, and horn nocks at bow tips. Source: https://heritagecrafts.org.uk/craft/bowyery/
- Bow International's medieval arrow transport article argues for belt/hip arrow bags and bundles more than fantasy back-quiver dominance. Source: https://www.bow-international.com/features/history-of-archery-how-medieval-arrows-were-transported/
- Britannica's bowstring note supports pale natural-fiber string materials such as linen/hemp for medieval longbows. Source: https://www.britannica.com/technology/bowstring
- Low-poly discipline references: chunky medieval archer silhouettes from Sketchfab's Stylized Medieval Characters, craft-profession massing from The Noble Craftsman, and compact game-prop styling from OpenGameArt's Low Poly RPG Pack. Sources: https://sketchfab.com/3d-models/stylized-medieval-characters-cd22d82b5364445a880bd18e590ed8dd, https://sketchfab.com/3d-models/the-noble-craftsman-0e8ff87ffaa24731b2474badebca870d, https://opengameart.org/content/low-poly-rpg-pack

## Silhouette Goals

- First read should be "master bowyer grading a bow," not "archer ready to fight." A tall yew stave or unstrung longbow should define the outline more than armor, shield, or sword forms.
- Build one clear vertical or shallow-diagonal bow arc beside the body. It can run from boot height to just below head height, with visible horn/nock blocks and a thicker pale string line.
- Replace the combat-trainer rectangle with workshop layers: leather apron front, fitted green work vest, belt tools, and a small chest badge or cape-pin mark.
- Keep quiver/arrow storage practical and low. A hip arrow bag or side bundle with fletchings should separate him from the Tutorial Ranged Instructor's back-quiver identity.
- Make hands matter. One hand should be near the bow grip or tillering point; the other should hold or point with a drawknife, ledger, string loop, or measuring cord.
- The rune/gold mark should become a craft badge: slightly larger, centered on apron/vest, and paired with a feather or bow-notch shape so it reads as fletching mastery at thumbnail size.

## Color And Materials

- Base cloth: deep forest green and moss green from the current preset, but assign them to vest/sleeves/apron trim rather than plate armor.
- Wood: yew should be reddish brown with a darker belly and lighter edge, roughly in the current `#8b5a2d` family with dark `#5b3b27` accents.
- Leather: dark warm brown apron, belt, hip bag, bracer, and tool loops. Use geometry breaks instead of noisy texture.
- String and feathers: natural off-white/linen, used sparingly but brightly enough to show against green and brown.
- Metal: tiny dull steel only for drawknife blade, knife tip, buckles, and maybe arrowheads. Avoid broad steel/mail surfaces; they pull the NPC back toward Combat Instructor.
- Accent: muted gold/bronze for the badge, nock caps, buckle, and ledger clasp. This can nod to Fletching cape prestige without turning him into a skillcape mannequin.

## Prop And Pose Ideas

- Priority prop: `bowyer_yew_stave` or `bowyer_tillering_bow`, a slightly curved unstrung yew bow held upright at one side.
- Secondary prop: `bowyer_drawknife`, a short two-handed woodworking blade simplified to a steel bar plus two brown grips, preferably at belt or in the lowered hand.
- Optional craft cues: `bowyer_string_loop`, `bowyer_horn_nock_upper`, `bowyer_horn_nock_lower`, `bowyer_hip_arrow_bag`, `bowyer_arrow_fletch_bundle`, and `bowyer_quality_ledger`.
- Pose target: relaxed expert stance, shoulders level, boots planted, head subtly angled toward the bow curve. He is inspecting balance, not aiming.
- Idle animation target for later: tiny bow tilt, glance down the limb, thumb rub over string or nock, then return to neutral. Trade/talk can tap the ledger or present the bow for inspection.

## Gallery Scale And Framing

- The NPC gallery thumbnail is small and bounds-fit; a bow that extends far above the head or wide past the shoulders will shrink the whole character. Keep the stave inside standard humanoid height plus only a small top margin.
- Best angle: front three-quarter with the bow arc on one side, apron badge visible, and hip arrow bag/fletchings peeking out. Pure front view can flatten the bow into a line.
- String must not be a hairline. Use a readable narrow box or paired tiny segments so it survives at 148 px.
- Avoid dense back props. Anything behind the torso should still break the silhouette from the side, or it will be invisible in the card.
- Required thumbnail read order: tall bow/stave, leather apron, green work vest, pale string/fletchings, gold craft badge, small drawknife.

## Concrete Implementation Guidance

- Preserve preset ID `mainland_advanced_fletcher`, label `Advanced Fletcher`, archetype `seasoned_bowyer`, and the existing `mainland_advanced_fletcher: buildMainlandAdvancedFletcherPreset()` central catalog mapping.
- Later runtime integration should stay in `src/js/content/npc-appearance-catalog.js` unless the gallery rework introduces a new authored model layer first. Keep the world placement, merchant table, dialogue, and quest logic untouched.
- Lowest-risk first pass: keep the Ranged Instructor clone, retheme inherited armor toward cloth/leather, and add 10-18 bowyer-specific fragments with `bowyer_*` or `advanced_fletcher_*` role names.
- Better bespoke pass: move away from the combat instructor base toward a worker/guide humanoid body with custom bowyer props. This is the cleanest way to remove inherited shield/sword/plate reads, but only do it when the central NPC preset pass is already in scope.
- Suggested fragments: `bowyer_apron_front`, `bowyer_apron_pocket`, `bowyer_gold_fletching_badge`, `bowyer_yew_stave_upper`, `bowyer_yew_stave_lower`, `bowyer_tillering_string`, `bowyer_upper_nock`, `bowyer_lower_nock`, `bowyer_drawknife_blade`, `bowyer_drawknife_grip_left`, `bowyer_drawknife_grip_right`, `bowyer_hip_arrow_bag`, `bowyer_arrow_shafts`, `bowyer_arrow_fletchings`, `bowyer_ledger_tag`.
- If the inherited sword or shield remains visible after palette changes, hide the read by replacing it with bowyer props in the same attachment zones rather than letting a brown sword pass as a tool.
- Validate a later model pass in `/qa npcgallery` against `mainland_fletching_supplier`, `tutorial_ranged_instructor`, and `mainland_advanced_woodsman`. The Advanced Fletcher should win on craft precision and yew-bow identity, not combat readiness.
- Suggested checks for later runtime work: `node .\tools\tests\npc-model-gallery-runtime-guard.js`, followed by manual NPC gallery inspection. This brief itself requires no runtime test.
