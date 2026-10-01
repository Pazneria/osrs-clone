# Touch gameplay and validation

This change adds touch input to the existing game mechanics. The save key and
schema, authored content, skill rates, damage, prices and cooldowns stay intact.

## Controls for the wiki

| Control | Behavior |
| --- | --- |
| Tap the ground or a world target | Walk or perform that target's usual primary action. Combat uses the existing targeting and tick rules. |
| Hold a world target or an item for half a second | Open the existing action choices. Lift, then tap the desired choice. Holding does not also perform the primary action. |
| Drag the world with one finger | Rotate the camera. Dragging does not walk or use a target. |
| Pinch the world | Zoom the camera. |
| Bag | Open the character drawer with Inventory, Equipment, Combat, Skills and Quests tabs. Scroll the drawer to reach everything. Close returns to the world. |
| Tap an inventory item | Perform its current primary action. Hold for Use, Equip, Eat, Drop or other applicable choices. For item combinations, choose Use and then tap the second item or world target. |
| Tap equipped gear | Use the existing unequip action. |
| Chat | Open messages. Type a message and tap Send, or use the keyboard's Enter key. |
| Minimap | Tap to walk; pinch to change its zoom. The map button opens the world map. |
| World map | Drag to pan, pinch to zoom, close with X. Desktop wheel/drag/Escape still work. |
| Stop | Cancel the current walk, target, queued interaction, selected Use item or repeated skill session. HP, progress and cooldowns are preserved. |
| Home | Save completed character progress, then return to the fixed Arcade address. If saving fails, remain in the game and show a retry message. |

Character creation supports touch appearance buttons and swatches, a draggable
preview, a scrollable form and Start Adventure. Exit to Arcade is also available
there and in the runtime recovery view. WebGL failure offers Reload and Exit.
It does not erase stored progress.

Bag and Chat open one at a time. Bank/shop and inventory fit together in portrait
and landscape. Menus stay open until a choice, Cancel or outside tap. Rotation,
pointer cancellation and a hidden/background tab cancel pending gestures;
backgrounding also stops active player actions and saves completed progress.
Desktop mouse and keyboard bindings remain available.
Touch controls also appear when touch is a secondary pointer on a hybrid device,
or after an observed touch if the browser under-reports capability. Subsequent
mouse/keyboard use keeps Stop and Home available. Keyboard chat shortcuts open
the Chat drawer before focusing its input.
Inventory/bank HTML drag reordering retains its existing desktop implementation;
touch item actions and bank transfer choices are available through tap/hold.

## Audit and test scope

The initial local browser audit exercised actual creation and tutorial gameplay.
It found mouse-only world/camera input, small inventory controls, overlapping
mobile HUD panels and no practical touch access to alternate item actions.
Touch handling now lives in typed input modules, exposed through the existing
render/input bridge; legacy integration calls the existing action runtimes.

`npm run test:input:touch` covers tap/hold/drag/pinch exclusivity, pointer cancel,
lost capture, blur, resize, backgrounding, mouse passthrough and Stop preservation
of combat cooldowns and progression.

`npm run test:input:hybrid` covers secondary coarse capability, observed touch,
mouse/pen discrimination, capability updates, resize and keyboard Chat requests.
`npm run test:mobile:hybrid` simulates a fine primary pointer with and without a
reported secondary coarse pointer, then uses Chromium touch, mouse and keyboard
events. It also checks a fine-only desktop. Set `HYBRID_QA_URL` for the deployed
site and `HYBRID_QA_LIVE_HOME=1` to verify the real Arcade return. This is simulated
hybrid browser testing, not validation on physical touchscreen hardware.

`npm run test:mobile:playtest` is an optional Playwright flow. It uses an already
running local server (default `http://127.0.0.1:5503/`), disposable browser profiles
and closes its browser in `finally`. It writes screenshots and results to
`tmp/mobile-qa/`. Playwright is optional and no dependency is added: supply
`PLAYWRIGHT_NODE_MODULES` if it is installed elsewhere. Other overrides are
`MOBILE_BROWSER_EXECUTABLE`, `MOBILE_QA_URL`, `MOBILE_QA_OUTPUT` and an optional
`MOBILE_TAILWIND_SCRIPT` cache of the existing CDN script. The test never clears
the user's browser saves. Set `MOBILE_QA_LIVE_HOME=1` for deployed-site validation
to visit the real Arcade page instead of intercepting that test navigation.

The browser flow uses Chromium touch emulation at 390x844, 390x667 and 844x390,
plus a 1280x800 mouse/keyboard context. It covers creation/name validation,
tutorial dialogue and first lesson, movement/camera gestures, inventory menus,
equipment, combat style/target/Stop, skills panel, chat/map, eating cooldowns,
item-on-item firemaking/Stop, bank/shop quantity prompts and Cancel, background
cancellation, reload persistence, failed-save Home, saved Home return and
simulated WebGL failure. Later combat/skill/bank/shop fixtures use existing QA
hooks in disposable profiles; this is not an end-to-end tutorial completion.

Typecheck, production build and relevant input/UI, inventory, combat and progress
guards should accompany the browser run. The bank-session guard's former inline
`--check` assertion failed at the unchanged base revision, f4703d7. The package
had already moved syntax checks into package-suite.js, and its manifest already
included the bank runtime. The guard now checks the targeted guard script, the
check-suite command and the bank runtime's membership in that suite. Its existing
bank-state, source-normalization and hook-publication assertions remain intact.
Browser bank quantity/cancel tests exercise the actual runtime behavior too.

The broad spec-contracts test uses byte-exact LF mutation fixtures. A CRLF Windows
checkout fails its runecrafting-strict-buys setup, including at the untouched base.
The full suite passes in an isolated LF checkout, matching committed source and
the Linux deployment environment; neither skill content nor those tests changed.

No physical phone/tablet, Safari, Android browser, real soft keyboard, OS gesture
interruption or live CDN outage was tested. Emulated orientation and background
events cannot establish those results. Desktop inventory reordering was not
changed. Deployment validation must identify the exact Pages commit separately.

## Narrow security review

The owned change handles pointer coordinates, local character names, chat/amount
input and existing browser-local progress. Name sanitization and progression
validation continue through existing runtimes. The browser test submits markup
in the name field and verifies sanitization and short-name rejection. New HUD
status text uses textContent; gesture code introduces no HTML or script parsing.
Item menus use the existing catalog/actions and persistence validation.

Home/Exit have a fixed HTTPS Arcade URL; no URL/hash return destination, iframe,
postMessage handler, credential handling or data transmission was introduced.
There are no new packages or external resources. The existing Tailwind CDN script
remains an external runtime dependency; a local cache is used only for repeatable
tests. Screenshots contain fictional QA identities, with no private saves or
secrets. Failed-save and WebGL tests verify that existing stored progress remains
unchanged. This is a focused code review and functional validation, not a security
certification or a whole-repository audit.
