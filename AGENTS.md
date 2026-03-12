# AGENTS Instructions (Project)

## Default Workflow Requirement

When adding or updating item content, use the local tooling before hand-writing assets:

1. `npm.cmd run tool:item:create -- -Id <id> -Name "<Name>" -Image <path>`
2. `npm.cmd run tool:items:sync`
3. `npm.cmd run tool:items:validate`

## Asset Sources of Truth

- Runtime item definitions: `src/js/content/item-catalog.js`
- Runtime icon sprite registry/fallbacks: `src/js/content/icon-sprite-catalog.js`
- Generated runtime mirror: `content/items/runtime-item-catalog.json`
- Draft item metadata files: `content/items/*.json` (non-underscore files, excluding the runtime mirror)
- Icon assets: `assets/pixel/*`
- 3D models: `assets/models/*`
- Pipeline docs: `docs/ASSET_PIPELINE.md`

## Notes

- Prefer updating existing item JSON drafts rather than creating duplicate IDs.
- Keep IDs lowercase snake_case.
- Treat auto-generated OBJ meshes as prototypes; refine final assets in DCC tools.

