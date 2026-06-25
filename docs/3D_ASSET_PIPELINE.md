# OSRS 3D Asset Pipeline

This is the long-term art lane for world props, equipment, armor, tools, weapons, and other assets that should exist as real 3D runtime models.

The older pixel asset pipeline can remain as a compatibility layer while the game migrates. For new production-quality equipment and world assets, the source of truth should be the 3D asset manifest plus the shipped GLB.

## Canonical Contract

- `content/assets/3d-assets.json` declares approved 3D assets, runtime paths, poses, icon outputs, and review metadata. For equipped handheld tools, `attachment.position` is the grip target on the player rig; optional `attachment.gripPoint` is the local GLB point that should land there.
- `assets/3d-src/<asset_id>/` stores editable source data for assets generated in-repo.
- `assets/3d/<asset_id>.glb` is the shipped runtime model.
- `assets/pixel/<asset_id>.png` may still be written for current inventory compatibility, but for migrated assets it is generated from the 3D lane instead of authored as pixel art.
- `src/js/content/asset-3d-catalog.js` is a generated legacy-runtime mirror of the JSON manifest.

## Build Flow

1. Author or update the source asset under `assets/3d-src/<asset_id>/`.
2. Register or update the asset in `content/assets/3d-assets.json`.
3. Run:

```bat
npm.cmd run tool:3d:build
```

4. Review:

- GLB in an asset viewer or game scene.
- Generated inventory icon in `assets/pixel/<asset_id>.png`.
- Review copy in `tmp/3d-icon-review/<asset_id>.png`.

5. Wire the item/world object to the asset by referencing `asset3d` from the authored runtime source.

## Style Rules

- Use GLB/glTF 2.0 as the browser runtime contract.
- Keep one tile as one world unit.
- Author equipment origins around gameplay sockets: grip for tools/weapons, body slot anchor for armor.
- Use low-poly, chunky silhouettes with matte materials.
- Prefer shared material families over unique per-asset colors.
- Keep pivots, scale, and orientation stable. Runtime code should not compensate for asset mistakes.
- Generate inventory icons from the 3D asset with a fixed camera and transparent background.

## First Vertical Slice

`bronze_pickaxe` proves the lane end to end:

- `assets/3d-src/bronze_pickaxe/source.json`
- `assets/3d/bronze_pickaxe.glb`
- `assets/pixel/bronze_pickaxe.png`
- equipped via `asset3d: "bronze_pickaxe"`
- dropped via the same `asset3d` entry with a ground pose
