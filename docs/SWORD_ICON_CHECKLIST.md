# Sword Icon Checklist

This repo renders runtime item icons at `32x32`, but the design pass below is adapted from larger-canvas `64x64` sword tutorials so we keep the same shape logic before compressing the sprite.

## Design order

1. Lock the silhouette first.
2. Separate blade, cross-guard, grip, and pommel so each part reads at a glance.
3. Shade the blade as two planes, not one flat wedge.
4. Shade the grip like a cylinder.
5. Add selective outlines only where they improve readability.

## 64x64 to 32x32 translation

- Spend extra pixels on blade bevel, guard shape, and pommel read before adding texture.
- Keep the blade longer than the grip, even after downscaling.
- Let the guard protrude on both sides enough to break the spear silhouette.
- Keep highlights short and directional so the metal still reads cleanly when compressed.

## Repo palette roles

- `a/b/c`: grip shadow, midtone, highlight
- `d/e/f`: blade shadow, midtone, highlight
- `g/h`: guard and pommel accents

## Repo workflow

1. Draft the base silhouette in `assets/pixel-spec/`.
2. Review with `npm.cmd run tool:pixel:spec -- --spec <file> --write-review`.
3. Write the accepted source with `--write-source`.
4. Propagate the silhouette to sibling tiers with `npm.cmd run tool:pixel:adopt-shape`.
5. Rebuild with `npm.cmd run tool:pixel:build:all`.

## Current sword target

- Diagonal one-handed sword
- Narrow blade with a readable point
- Brass-toned guard and pommel accents
- Shared silhouette across bronze, iron, steel, mithril, adamant, and rune tiers
