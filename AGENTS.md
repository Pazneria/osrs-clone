# AGENTS Instructions (Project)

## Default Workflow Requirement

When adding or updating item content, use the local tooling before hand-writing assets:

1. `npm.cmd run tool:item:create -- -Id <id> -Name "<Name>" -Image <path>`
2. `npm.cmd run tool:items:validate`

## Asset Sources of Truth

- Item definitions: `content/items/*.json`
- Icon assets: `assets/pixel/*`
- 3D models: `assets/models/*`
- Pipeline docs: `docs/ASSET_PIPELINE.md`

## Notes

- Prefer updating existing item JSON rather than creating duplicate IDs.
- Keep IDs lowercase snake_case.
- Treat auto-generated OBJ meshes as prototypes; refine final assets in DCC tools.

