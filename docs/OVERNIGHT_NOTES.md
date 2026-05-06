# Overnight Notes

## Tutorial Island Visual Regression Harness

- Added a reusable screenshot harness for fixed Tutorial Island QA scenes.
- The worktree was already dirty, so I left changes uncommitted.
- No human decision blocked implementation.
- Browser captures ran through external Playwright and produced healthy screenshots for all configured scenes.

## Verification

- `npm.cmd run test:visual:tutorial-island` passed.
- `npm.cmd run test:visual:harness:guard` passed.
- `node tools/tests/input-qa-camera-runtime-guard.js` passed.
- `npm.cmd run test:render-input:guard` passed.
- `npm.cmd run tool:world:validate` passed.
- `npm.cmd run typecheck` passed.
- `npm.cmd run build` passed with the existing large-chunk warning.
- `npm.cmd run check` passed.
- `npm.cmd run test` passed after updating a stale combat rollout guard expectation for the current guard preview actor helper.

## Human Decision Queue

- Baselines are not committed by default. After a human-approved visual pass, decide whether `tools/visual/baselines/tutorial-island/*.png` should become tracked regression fixtures.
- The harness can run strict with `--require-baseline` once those baselines are approved.

## Browser Limitation

- The in-app browser screenshot path has intermittently timed out in this thread. The harness uses external Playwright as the reliable fallback and keeps the in-app browser only for manual acceptance passes.
