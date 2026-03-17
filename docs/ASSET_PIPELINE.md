# OSRS Asset Workflow (Pixel Source + Generated Runtime Assets)

This is the default item-icon pipeline for this project.

## Canonical pipeline

The canonical asset-authoring path for this repo is:

- `assets/pixel-spec/<asset>.json` for Codex-first workbench drafts
- `assets/pixel-src/<asset>.json` for canonical editable sources
- `tools/pixel-editor/` for direct in-repo editing
- `npm.cmd run tool:pixel:spec -- --spec ...` for drafting/review/promote
- `npm.cmd run tool:pixel:build -- --asset <asset>` for generated PNG/OBJ outputs

If a request is to create or revise art for this repo, use the pipeline above by default.

## Removed legacy pipeline

The older image-conversion and migration helpers have been removed. This repo now has one supported asset-authoring workflow: the pixel-spec/pixel-source/editor/build path described in this document.

## Canonical source of truth

Each icon asset is authored as a text-backed pixel source file:

- `assets/pixel-src/<asset_id>.json`

That source file is canonical. Runtime PNGs and simple OBJ models are generated artifacts.

## What this pipeline produces

For each icon asset (example: `regular_logs`) we generate:

- Pixel source: `assets/pixel-src/regular_logs.json`
- Runtime icon: `assets/pixel/regular_logs.png`
- Held model: `assets/models/regular_logs.obj`
- Ground model: `assets/models/regular_logs-ground.obj`

Runtime items then reference the asset through:

```js
icon: { kind: 'pixel', assetId: 'regular_logs' }
```

`assetId` can differ from `itemId`, so multiple items may intentionally share one icon asset.

Production note:

- `npm.cmd run build` must copy `assets/pixel/` and `assets/models/` into `dist/` after the Vite bundle step.
- GitHub Pages should publish through GitHub Actions so that built `dist/` artifact is what reaches the website.
- If the website shows broken file/placeholders instead of real inventory icons, check deploy/build first before blaming the icon source files.

## Recommended workflow

1. Start the local server:

```bat
npm.cmd run dev
```

2. Open the in-repo editor:

- `http://localhost:5500/tools/pixel-editor/`

3. Create or update `assets/pixel-src/<asset_id>.json`.

Optional AI-first authoring path:

- Author a geometric draft spec in `assets/pixel-spec/<name>.json`
- Dry-run it with an ASCII preview:

```bat
npm.cmd run tool:pixel:spec -- --spec assets/pixel-spec/my_icon_workbench.json --ascii --ascii-silhouette --write-review
```

If you want the resolved construction points too:

```bat
npm.cmd run tool:pixel:spec -- --spec assets/pixel-spec/my_icon_workbench.json --anchors
```

- If the draft looks right, write the canonical pixel source:

```bat
npm.cmd run tool:pixel:spec -- --spec assets/pixel-spec/my_icon_workbench.json --write-source
```

The spec tool is meant for Codex-first iteration. It can assemble icons from lines, arcs, polygons, fills, and copied source regions, then emit the normal `32x32` pixel source JSON the rest of the pipeline already understands.
It also supports named anchors plus derived points such as offsets, midpoints, lerps, and perpendicular vector steps, which makes structure-first drafting much easier for tool and weapon silhouettes.

If you approve one silhouette and want to propagate it across a tier family while preserving each target asset's colors, use:

```bat
npm.cmd run tool:pixel:adopt-shape -- --from bronze_pickaxe --to iron_pickaxe --to steel_pickaxe --to mithril_pickaxe --to adamant_pickaxe --to rune_pickaxe
```

That copies the accepted `pixels` shape onto the targets, keeps each target asset ID, preserves any existing palette colors for matching symbols, and only imports missing symbols from the source when needed.
4. Build generated assets:

```bat
npm.cmd run tool:pixel:build -- --asset logs
```

Or rebuild everything:

```bat
npm.cmd run tool:pixel:build:all
```

5. Sync and validate runtime data:

```bat
npm.cmd run tool:items:sync
npm.cmd run tool:icons:report
npm.cmd run tool:items:validate
```

6. Keep the current review batch visible in-game:

- Update `src/js/content/icon-review-catalog.js` with the runtime item IDs you just touched.
- The game auto-adds that active review batch to inventory on the next app reload, so you can inspect the icons without a per-item QA preset.

## Right-Hand Held Item Family Workflow

For held right-hand equippables such as pickaxes, axes, swords, and similar tools/weapons, the inventory icon should usually become the source silhouette for all three presentations:

- inventory icon
- equipped hand model
- dropped ground model

The generated `assets/models/*.obj` files are still useful build artifacts, but the current live held-item runtime path is driven by the player appearance system:

- `src/js/content/player-appearance-catalog.js`
- `src/js/player-model.js`

Recommended family workflow:

1. Approve the icon silhouette first in `assets/pixel-src/<family_lead>.json`.
2. Propagate that silhouette to sibling tiers with `npm.cmd run tool:pixel:adopt-shape`.
3. Keep tier distinction mostly in palette differences unless a tier really needs unique geometry.
4. Keep metal tier colors consistent across families. The shared bronze/iron/steel/mithril/adamant/rune held-item palette in `src/js/content/player-appearance-catalog.js` should stay the runtime source of truth, and matching inventory icon palettes in `assets/pixel-src/*.json` should mirror it.
5. Default right-hand tool/weapon inventory silhouettes to the same diagonal used by the approved pickaxe and sword families: grip low-left, business end high-right. Avoid the opposite `-45deg` diagonal unless the request explicitly calls for it.
6. Mirror the approved silhouette into `src/js/content/player-appearance-catalog.js` as a shared family recipe using `pixelExtrude` fragments.
7. Start the family from the shared standard right-hand hold preset in `src/js/content/player-appearance-catalog.js`, then override only what truly needs to differ. This keeps new right-hand weapons/tools aligned with the proven pickaxe pose by default.
8. Put shared pose/origin/depth values in one family config object so all tiers inherit the same hand placement. When the silhouette changes meaningfully, move the `origin` to the real grip point on that family's handle rather than copying the pickaxe grip point unchanged.
9. If a head/blade should hang below the handle in-world while the handle direction itself should still match the pickaxe-style hold, prefer a local roll around the handle axis in the held-model config rather than a new hand rotation.
10. Reserve `flipY` for cases where you intentionally want to invert the icon's vertical mapping into the held mesh.
11. If a family needs tiered metal shading instead of a single flat color, define shared dark/mid/light metal roles for each material tier and map the icon's metal symbols onto those roles.
12. For pointed right-hand weapons like swords, use a runtime depth resolver so the main blade can stay at full thickness while the last two point layers taper `3 -> 2 -> 1` voxels without redrawing the icon.
13. If the inventory icon is already approved and the user only wants the live in-world item to feel larger, chunkier, or more tapered, prefer changing `pixelSize`, `depth`, `depthBySymbol`, or the depth resolver in the held-model config before redrawing the icon.
14. If the live held/dropped mesh should be chunky but still keep sharp blade/tip reads, add a secondary metal symbol with the same color and give it a thinner `depthBySymbol` override instead of making the whole item uniformly thick.
15. When strong colors matter, keep literal hex color fidelity on the held fragments. Saturated blues/greens can look washed out if they rely only on packed Jagex-HSL conversion.
16. Reuse the same family mesh builder for dropped world items in `src/js/world.js` instead of leaving those items on a generic fallback mesh.
17. Rebuild the pixel assets, reload the game, equip the family items, and also drop them on the ground to verify all three presentations still match.

Current runtime notes:

- `pixelExtrude` is the family-friendly shape for turning icon pixels into held meshes.
- `window.createEquipmentVisualMeshes(...)` is the reusable runtime hook for building held-family meshes outside the player rig, including ground-item visuals.
- If a family exists in the runtime mirror but editable defs are missing in `src/js/content/item-catalog.js`, add the missing item defs there rather than patching the generated mirror.
- If icon imagery changes, bump the cache tag in `src/js/core.js` so the refreshed PNGs appear reliably after reload.

## Ask Codex for an asset

Natural-language prompts are enough. In this repo, Codex should treat a normal asset request as a direct execution request.

Examples:

- `make an inventory icon for bronze dagger`
- `redo willow logs so the bark is cooler and the bundle is thinner`
- `make icons for bronze dagger, iron dagger, and steel dagger`

By default, Codex should automatically:

1. Choose or create the right `assetId`
2. Author or update `assets/pixel-src/<asset_id>.json`
3. Build the generated PNG/OBJ outputs
4. Wire the item to that asset when the mapping is obvious
5. Update `content/icon-status.json` so future fresh instances know whether the touched items are done or still todo
6. Update `src/js/content/icon-review-catalog.js` so the current review batch auto-appears in inventory after reload
7. Summarize what changed and note any assumptions

Codex should only ask a clarifying question when the request is genuinely ambiguous, especially if:

- it is unclear which item or existing asset should be edited
- changing a shared asset could affect multiple items in a non-obvious way
- runtime wiring is risky or the intended target item is unclear

You can override the default behavior explicitly:

- `draft only, don't wire it yet`
- `make these share one asset`
- `don't iterate, just do a fast first pass`
- `match the tinderbox style`
- `revise the existing pickaxe asset instead of creating a new one`

## Tracking Which Icons Are Finished

Fresh Codex instances should not guess which icons are "done" from palette noise, asset names, or git history.
This repo tracks that explicitly in:

- `content/icon-status.json`

Each runtime item gets an entry with:

- `status`: `done` or `todo`
- `assetId`: the current runtime icon asset
- `treatment`: `bespoke` or `shared`
- `notes`: optional short context for reviewers

`npm.cmd run tool:items:sync` keeps `assetId` and `treatment` aligned with `src/js/content/item-catalog.js` while preserving the recorded `status` values.

To see what still needs bespoke icon work:

```bat
npm.cmd run tool:icons:report
```

Use `--all` or `--limit` for larger batches:

```bat
npm.cmd run tool:icons:report -- --all
npm.cmd run tool:icons:report -- --limit 20
```

Codex should consult `content/icon-status.json` before picking a new icon batch. That means you do not need to tell a fresh instance which items are already done; it should read the manifest and target `status: todo` items by default.

## Source schema

Each `assets/pixel-src/*.json` file uses a fixed `32x32` canvas:

- `id`: lowercase snake_case asset id
- `width`: `32`
- `height`: `32`
- `palette`: single-character symbol map, with `"."` reserved for transparent
- `pixels`: 32 rows of 32 symbols each
- `model`: `depth`, `scale`, `groundVariant`

Optional `assets/pixel-spec/*.json` files are not runtime assets. They are authoring recipes that compile down to the canonical `assets/pixel-src/*.json` format.
They may include top-level `anchors` so geometry can be expressed relative to concepts like `eye`, `butt`, `left_tip`, or other named construction points instead of raw coordinates everywhere.

Current model behavior:

- `groundVariant` must be `"copy"`
- Model generation extrudes every non-transparent pixel into a simple voxel silhouette

## Importing older art

The old import/migration helpers were retired along with the legacy pipeline. If older art needs to be brought in now, recreate or trace it through the canonical in-repo tools instead of reviving the removed conversion scripts.

## Quality expectations

- Icons are authored on a `32x32` canvas but must stay readable at inventory-slot size.
- Generated OBJ meshes are prototype silhouettes, not final hero assets.
- For right-hand equippable families, do not assume generated OBJ files alone are enough to update the live held model. Check the appearance/ground runtime path too.
- Keep asset IDs and item IDs stable because gameplay systems depend on those identifiers.

## Future sessions behavior

New assistant instances do not remember chat history.
They can still follow this pipeline because it is codified in:

- `docs/ASSET_PIPELINE.md`
- `content/icon-status.json`
- `assets/pixel-src/*`
- `tools/pixel-editor/*`
- `tools/pixel/*`
- `package.json` scripts

## Chat preview note

When sharing a local preview image in Codex chat, prefer copying it to a short no-space absolute path first if the workspace path contains spaces. The canonical asset should stay in its real project location; the no-space copy is only for chat rendering reliability.

## Catalog Source Of Truth

- Canonical runtime item definitions: `src/js/content/item-catalog.js`
- Canonical editable icon assets: `assets/pixel-src/*`
- Canonical item-level icon completion state: `content/icon-status.json`
- Generated runtime mirror: `content/items/runtime-item-catalog.json`

Keep the runtime mirror in sync with:

```bat
npm.cmd run tool:items:sync
```

