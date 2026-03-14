# Codex Export

The standalone codex lives outside this repo, but it should not invent gameplay facts on its own.

This project now provides a versioned codex export bundle built from the canonical runtime/content sources:

- item data from `src/js/content/item-catalog.js`
- skill data from `content/skills/*.json`
- world data from `content/world/manifest.json` and `content/world/regions/*.json`

## Run

From the project root:

```bat
npm.cmd run tool:codex:export
```

By default that writes a bundle to `dist/codex-export/`:

- `manifest.json`
- `items.json`
- `skills.json`
- `worlds.json`

Use a custom output directory when another repo needs to consume the export directly:

```bat
node .\tools\content\export-codex.js --out-dir "..\osrs-clone-codex\content\generated\codex-export"
```

## Bundle Contract

`manifest.json` includes:

- `schemaVersion`
- `generatedAt`
- `sourceCommit`
- `basePath`
- route templates for `items`, `skills`, and `world`
- per-entity indexes

Stable routes in v1:

- `/osrs-clone-codex/items/:itemId`
- `/osrs-clone-codex/skills/:skillId`
- `/osrs-clone-codex/world/:worldId`

The export intentionally uses stable IDs for routing. The codex can own slugs, presentation, and redirects later without changing the game/content IDs.

## Validation

`tools/tests/codex-export-guard.js` verifies that the export:

- rejects duplicate IDs
- rejects slug collisions
- rejects unresolved cross-links
- rejects invalid world travel references

That guard runs as part of the main `npm test` flow.
