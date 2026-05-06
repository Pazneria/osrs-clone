# Tutorial Island Visual Regression

The visual harness captures fixed Tutorial Island QA scenes through a browser and writes PNGs plus a JSON report under `tmp/visual-regression/tutorial-island`.

## Commands

```powershell
npm.cmd run test:visual:tutorial-island
npm.cmd run test:visual:tutorial-island:update
```

Use `--start-server` if `http://127.0.0.1:5502/` is not already running:

```powershell
node tools/visual/tutorial-island-visual-harness.js --start-server
```

## Baselines

Default mode is conservative: it captures screenshots, checks that they are not blank/weak, and compares only when a matching baseline PNG already exists.

After a human-approved visual pass, run:

```powershell
npm.cmd run test:visual:tutorial-island:update
```

That writes baseline PNGs under `tools/visual/baselines/tutorial-island`. Once those images are intentionally committed, CI-style strictness can use:

```powershell
node tools/visual/tutorial-island-visual-harness.js --require-baseline
```

## Covered Scenes

- `arrival-default`: normal arrival gameplay view.
- `firemaking-coast-low`: low camera view near the Firemaking Instructor/coastline.
- `tutorial-overhead`: full-island QA aerial view for large clipping regressions.
- `mining-smithing-yard`: furnace, anvil, ore rocks, props, and mining tutor.
- `inventory-hud`: inventory composition with the playfield behind it.

World-focused scenes hide dynamic HUD chrome before capture so FPS text, chat history, and minimap state do not dominate diffs. The `inventory-hud` scene keeps the interface visible on purpose.

## Notes

The repo does not currently depend on Playwright. The harness resolves Playwright locally first, then through the bundled Codex desktop runtime. Set `VISUAL_HARNESS_NODE_MODULES` if you want to point it at a different dependency root.
