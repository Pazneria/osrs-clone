# AGENTS Instructions (Project)

## Preferred Skills

If the custom OSRS Clone skill pack is installed, prefer these skills for this repo:

- `$osrs-clone` for general repo routing when the right seam is not obvious yet.
- `$osrs-clone-platform-bridges` for Vite bootstrap, `src/game/platform/*`, `window.*Runtime` surfaces, and typed-to-legacy integration work.
- `$osrs-clone-content-contracts` for canonical sources, sync or validate flows, world authoring, and codex export.
- `$osrs-clone-pixel-appearance` for inventory icons, pixel assets, appearance catalog work, and held or dropped visual alignment.
- `$osrs-clone-test-routing` for review, QA, and choosing the smallest relevant checks before widening to broader coverage.

If a skill conflicts with this file, follow `AGENTS.md`.

## Inventory Icon Requests

Treat requests like "make", "design", "create", "update", or "redo" an inventory icon as implement-now tasks, not planning or brainstorming, unless the user explicitly asks for brainstorming first.

Default behavior for a normal icon request:

1. Consult `content/icon-status.json` first. Treat `status: done` as complete, treat `status: todo` as still eligible work, and prefer `npm.cmd run tool:icons:report` when choosing a new batch.
2. Choose the target `assetId`.
3. Author or update `assets/pixel-src/<asset_id>.json` directly, or use `tools/pixel-editor/`.
   For complex silhouettes or family items, prefer a draft/workbench spec under `assets/pixel-spec/` first, get the shape approved, then apply the accepted silhouette to runtime assets.
4. Build generated assets with `npm.cmd run tool:pixel:build -- --asset <asset_id>` or `npm.cmd run tool:pixel:build:all`.
5. If the target item mapping is unambiguous, keep runtime item defs on `icon: { kind: 'pixel', assetId: '<asset_id>' }`, then run `npm.cmd run tool:items:sync`.
6. Update `content/icon-status.json` for the touched items: mark accepted/reviewed bespoke icons as `done`, leave unfinished or placeholder items as `todo`, then run `npm.cmd run tool:items:sync` again if runtime wiring changed during the request.
7. Run `npm.cmd run tool:items:validate` when item wiring changed, and whenever the asset request touches runtime item definitions or icon status.
8. Update `src/js/content/icon-review-catalog.js` with the current runtime item IDs being reviewed so the active icon batch auto-appears in inventory on the next app reload.
9. If the item is a right-hand held equippable family (pickaxe, axe, sword, harpoon, etc.), keep the inventory icon as the source silhouette for held and dropped visuals too:
   - Update the family pixel source first in `assets/pixel-src/*`.
   - For tiered families, propagate the accepted shape across siblings before tuning colors.
   - Default the inventory silhouette to the same diagonal used by the pickaxe/sword families: grip low-left, business end high-right. Do not use the opposite `-45deg` diagonal unless the user explicitly asks for it.
   - Keep metal tier colors consistent across families. Treat the shared tier palette in `src/js/content/player-appearance-catalog.js` as the source of truth for bronze/iron/steel/mithril/adamant/rune held-item metals, and keep the inventory icon palettes aligned to it.
   - Mirror the approved silhouette into `src/js/content/player-appearance-catalog.js` as a shared `pixelExtrude` family recipe with per-tier palettes.
   - Start new right-hand weapon/tool families from the shared standard hold preset in `src/js/content/player-appearance-catalog.js` instead of inventing a fresh hand rotation/offset. Only deviate when the user explicitly wants a different in-hand pose.
   - When a family shape differs materially from the pickaxe silhouette, set the held-model `origin` to the actual grip point on that family's handle instead of copying the pickaxe grip origin blindly.
   - If a head/blade needs to hang below the handle in-world while keeping the same handle direction as the pickaxe-style hold, prefer a runtime local roll around the handle axis in the held-model preset instead of redrawing the family or inventing a new hand rotation.
   - If a family needs tiered metal shading instead of a single flat metal color, define the per-tier dark/mid/light metal palette in `src/js/content/player-appearance-catalog.js` and map the icon's metal symbols onto those shared roles.
   - For pointed right-hand weapons like swords, prefer a runtime blade depth resolver: keep the main blade at full thickness, then taper the last two point layers from `3 -> 2 -> 1` voxels without changing the inventory icon.
   - If the inventory icon is approved and the user only wants the real equipped/dropped item to feel larger, chunkier, or more tapered, make that change in the held-model runtime config first instead of redrawing the icon.
   - When a held weapon/tool should feel chunky but keep a crisp edge, use a thicker default runtime depth with a thinner secondary metal symbol for blade/tip voxels instead of making the whole model uniformly thick.
   - Reuse the same family mesh path for dropped world items instead of leaving them on a generic fallback.

## Canonical vs Legacy Asset Tools

Treat the in-repo pixel workflow as the only canonical authoring pipeline:

- Canonical authoring/editor tools:
  - `assets/pixel-spec/*` for Codex-first workbench drafts
  - `assets/pixel-src/*` for canonical editable pixel sources
  - `tools/pixel-editor/` for direct in-repo editing
  - `npm.cmd run tool:pixel:spec -- --spec ...` for draft/render/promote
  - `npm.cmd run tool:pixel:build -- --asset <asset_id>` for generated PNG/OBJ outputs
- The older image-conversion/migration pipeline has been removed from this repo. Do not suggest or recreate it unless the user explicitly asks to restore a specific archived tool.
- Do not treat external/older conversion flows as the "real" pipeline when the request is to create or revise art for this repo. The real pipeline is the repo-owned pixel-spec/pixel-source/editor flow above.

## Chat Preview Images

When sharing local preview images in Codex chat:

- Do not embed image paths from workspace folders with spaces when a no-space preview path is easy to create.
- Prefer copying the preview image to a short no-space absolute path such as `C:\Users\jmore\.codex\projects\preview-<asset>.png` before embedding it in chat.
- This is only for chat rendering reliability. Do not move the canonical runtime asset out of its real project location.

Asset selection rules:

- Reuse an existing `assetId` when the request is clearly revising an existing icon.
- Otherwise, create a new dedicated `assetId` per explicitly requested item by default.
- Preserve existing shared assets unless the user clearly asks for bespoke art or the shared asset is obviously a placeholder or poor fit.
- Ask only when splitting a shared asset has non-obvious gameplay or content consequences, or when the target item/asset mapping is genuinely ambiguous.
- For tiered item families, lock the silhouette first and preserve palette differences second. Once one family member is approved, prefer copying the accepted `pixels` shape across siblings rather than re-drawing each variant separately.
- For right-hand held families, prefer one shared silhouette plus per-tier palette differences in both the icon source and the appearance catalog. Do not hand-tune each tier's held pose separately unless the user explicitly asks for bespoke exceptions.

Execution rules:

- Make reasonable visual assumptions and proceed without asking for approval when the request is clear enough to draft.
- Keep live runtime assets untouched during back-and-forth shape exploration when a workbench draft will do; only promote the approved draft into `assets/pixel-src/*` once the silhouette is accepted.
- If the user says `draft only`, create or update the pixel source and build outputs, but do not change runtime item wiring.
- If the user asks multiple items to share one icon, keep a shared `assetId` and report that decision clearly.
- Never infer `done` from file age, palette size, or naming patterns alone. Use `content/icon-status.json` as the explicit completion record for fresh instances.
- Report back with the created or updated `assetId` values, generated outputs, and any important assumptions or follow-up risks.
- For icon-review usability, keep `src/js/content/icon-review-catalog.js` scoped to the latest batch you touched instead of letting it grow into a permanent backlog list.
- When saturated held-item colors look washed out in-world, preserve exact icon colors on appearance fragments with literal hex-driven color data instead of relying only on packed Jagex-HSL conversion.

## Asset Sources of Truth

- Runtime item definitions: `src/js/content/item-catalog.js`
- Canonical pixel source assets: `assets/pixel-src/*`
- Item-level icon completion manifest: `content/icon-status.json`
- Generated runtime mirror: `content/items/runtime-item-catalog.json`
- Draft item metadata files: `content/items/*.json` (non-underscore files, excluding the runtime mirror)
- Icon assets: `assets/pixel/*`
- 3D models: `assets/models/*`
- Pipeline docs: `docs/ASSET_PIPELINE.md`

## Architecture Guardrails

- Before implementing a new feature, content batch, or tool, do a quick compounding-risk check against the current project risks instead of blindly extending the nearest file or pattern.
- Flag the work for the user before proceeding if the planned change would materially deepen one of these problems:
  - introducing a new source of truth where an existing canonical file or generator already exists
  - extending a large monolithic file with a new unrelated responsibility when a nearby module, helper, or data file would keep the change contained
  - adding more one-off handcrafted NPC/building/content data when a small authoring system, prefab path, palette/parts override, or stamp workflow would obviously pay off first
  - mixing legacy and newer runtime patterns in the same feature when the newer pattern is already available
  - editing generated artifacts as if they are the primary authored source
- Keep the warning practical, not alarmist: explain the specific compounding risk in plain language, say whether it is safe to defer, and recommend the smallest reasonable next step.
- Do not block normal vertical-slice progress over minor cleanup debt. Only pause and flag when the requested approach would noticeably increase future maintenance cost or slow later content creation.
- Assume the user may not know which changes have architecture consequences yet. When a task has that kind of hidden cost, surface it proactively instead of waiting for the user to ask.

## Notes

- Prefer updating existing item JSON drafts rather than creating duplicate IDs.
- Keep IDs lowercase snake_case.
- Treat generated OBJ meshes as silhouette-driven prototypes; refine final held/ground models in DCC tools if needed.
- `npm.cmd run tool:items:sync` keeps `content/icon-status.json` asset mappings and shared-vs-bespoke treatment in sync, but preserves the explicit `done`/`todo` status values already recorded there.
- Keep this asset-request behavior defined in this project `AGENTS.md`; do not rely on a global/home-level instruction file for this workflow.
- In tiered weapon/tool icon sets, the current palette convention is usually `a/b/c` for the handle, `d/e/f` for the main head material, and `g/h` for wraps or binding details when present. That makes recoloring tiers much easier without changing shape.
- Right-hand held-item runtime visuals currently live in `src/js/content/player-appearance-catalog.js` and `src/js/player-model.js`, not in the generated OBJ artifacts alone. Generated OBJ files are still useful outputs, but held and dropped runtime visuals may need explicit family wiring.
- Dropped world-item visuals for held-item families should reuse the same mesh recipe path when possible so inventory, equipped, and ground presentations stay in sync.

