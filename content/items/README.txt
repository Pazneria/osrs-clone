Item catalog workflow:

- Canonical runtime item definitions live in `src/js/content/item-catalog.js`.
- Generated runtime mirror lives in `content/items/runtime-item-catalog.json`.
- Sync the mirror after runtime item-def changes with `npm.cmd run tool:items:sync`.
- Validate authored item files + runtime mirror parity with `npm.cmd run tool:items:validate`.

Authored item JSON files in this folder (for example `content/items/<item_id>.json`) are asset-pipeline metadata drafts and examples, not the canonical runtime catalog.

Rules for authored item JSON files:
- `item_id` must be lowercase letters, numbers, and underscores.
- Keep asset paths relative to project root.
