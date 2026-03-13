# AGENTS Instructions (Project)

## Inventory Icon Requests

Treat requests like "make", "design", "create", "update", or "redo" an inventory icon as implement-now tasks, not planning or brainstorming, unless the user explicitly asks for brainstorming first.

Default behavior for a normal icon request:

1. Choose the target `assetId`.
2. Author or update `assets/pixel-src/<asset_id>.json` directly, or use `tools/pixel-editor/`.
3. Build generated assets with `npm.cmd run tool:pixel:build -- --asset <asset_id>` or `npm.cmd run tool:pixel:build:all`.
4. If the target item mapping is unambiguous, keep runtime item defs on `icon: { kind: 'pixel', assetId: '<asset_id>' }`, then run `npm.cmd run tool:items:sync`.
5. Run `npm.cmd run tool:items:validate` when item wiring changed, and whenever the asset request touches runtime item definitions.

Asset selection rules:

- Reuse an existing `assetId` when the request is clearly revising an existing icon.
- Otherwise, create a new dedicated `assetId` per explicitly requested item by default.
- Preserve existing shared assets unless the user clearly asks for bespoke art or the shared asset is obviously a placeholder or poor fit.
- Ask only when splitting a shared asset has non-obvious gameplay or content consequences, or when the target item/asset mapping is genuinely ambiguous.

Execution rules:

- Make reasonable visual assumptions and proceed without asking for approval when the request is clear enough to draft.
- If the user says `draft only`, create or update the pixel source and build outputs, but do not change runtime item wiring.
- If the user asks multiple items to share one icon, keep a shared `assetId` and report that decision clearly.
- Report back with the created or updated `assetId` values, generated outputs, and any important assumptions or follow-up risks.

## Asset Sources of Truth

- Runtime item definitions: `src/js/content/item-catalog.js`
- Canonical pixel source assets: `assets/pixel-src/*`
- Generated runtime mirror: `content/items/runtime-item-catalog.json`
- Draft item metadata files: `content/items/*.json` (non-underscore files, excluding the runtime mirror)
- Icon assets: `assets/pixel/*`
- 3D models: `assets/models/*`
- Pipeline docs: `docs/ASSET_PIPELINE.md`

## Notes

- Prefer updating existing item JSON drafts rather than creating duplicate IDs.
- Keep IDs lowercase snake_case.
- Treat generated OBJ meshes as silhouette-driven prototypes; refine final held/ground models in DCC tools if needed.
- Keep this asset-request behavior defined in this project `AGENTS.md`; do not rely on a global/home-level instruction file for this workflow.

