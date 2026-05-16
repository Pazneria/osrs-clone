# Building Workbench

This directory is a Codex-first draft layer for mainland buildings and settlements.

- `archetypes/` defines reusable building types.
- `materials/` defines concrete material profiles and preview palettes.
- `conditions/` defines intact, weathered, burnt, broken, and abandoned structure states.
- `road-profiles/` defines road draft profiles that promote as tile/route metadata.
- `themes/` defines reusable material and decor languages.
- `buildings/` defines draft building plans that compile to canonical stamp rows.
- `settlements/` defines draft placement intent for towns, hamlets, outposts, roads, and NPC homes.

Run `npm.cmd run tool:world:buildings` to validate the workbench. Run `npm.cmd run tool:world:buildings:preview` to write review artifacts to `tmp/world-building-workbench`, including `index.html`, `workbench-data.json`, `PROMOTION_PLAN.md`, and a generated Three.js module for local browser review. Run `npm.cmd run tool:world:buildings:promote -- --settlement <settlementId>` to write a dry-run promotion package with copy-ready stamp JSON plus manifest, region structure, road path, staircase landmark, decor prop, roof landmark, wall-art intent, and NPC home-tag candidates.

Promotion is deliberate: workbench specs do not become live world content until a later pass copies reviewed stamp JSON into `content/world/stamps`, registers the stamp in `content/world/manifest.json`, and adds placements or landmarks to `content/world/regions/*.json`. The promote command is dry-run only and must not mutate canonical world files.

Current seed coverage includes timber frontier houses, banks, quarry work buildings, stone market shop-houses, painted plaster artisan shops, a weathered manor, a castle gatehouse, burnt/broken-ready structures, a quarry hamlet, a mixed market crossing, a damaged old roadhold, and a northern woodwatch outpost.
