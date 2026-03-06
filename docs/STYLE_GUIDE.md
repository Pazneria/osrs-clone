# OSRS Prototype Style Guide (v0.1)

## Where To Find This
- File: `docs/STYLE_GUIDE.md`
- In Codex app: click the file path in chat responses.
- In File Explorer: open project folder `test`, then `docs`.

## Visual Direction
- Theme: gritty low-fantasy, readable, old-school UI framing.
- Palette:
  - UI dark: `#1e2328`
  - UI gold: `#c8aa6e`
  - Brown frame: `#5d5447`
  - Panel body: `#4a4136`
- Shapes: blocky, beveled edges, subtle shadowing.
- Assets: pixel/crisp stylization over realism.

## UI Rules
- All floating windows must clamp to viewport (no off-screen menus).
- Hover/tooltip windows should flip left/up when near screen edge.
- Active/selected states must be visible (gold border + inset highlight).
- Chat/skill windows follow same border + background language.

## Gameplay Feel Rules
- Tick-driven interactions should read clearly.
- For skilling:
  - arrive tile
  - face target
  - animate
  - resolve action
- Firemaking special rule:
  - light on current tile
  - then step to fixed direction if possible
  - then face back to the lit fire.

## Asset Rules
- Keep item icon sprites 16x16 style with crisp edges.
- Prefer inline SVG or sprite sheets with clear silhouettes.
- Keep item identity obvious at small sizes:
  - Axe: broad head + wooden shaft
  - Pickaxe: horizontal metal head
  - Coins: stacked yellow discs
  - Tinderbox: small box with dark lid
  - Knife: short blade + handle

## Typography
- Primary: monospace for system/game text.
- Size hierarchy:
  - 10-11px: dense UI labels
  - 12-13px: chat/general labels
  - 14px+: section headers

## Expansion Plan
- Add dedicated sections for:
  - combat feedback
  - map/object icon language
  - NPC silhouette classes
  - animation timing table (ticks + ms)
