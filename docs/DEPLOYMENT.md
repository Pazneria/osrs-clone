# Deployment Notes

This project should publish to GitHub Pages through GitHub Actions.

## Required GitHub setting

In the repo's GitHub Pages settings, the source must stay set to:

- `GitHub Actions`

Do not switch it back to `Deploy from a branch`.

Why:

- the live site is a built Vite app, not a raw source-folder site
- `dist/` is the deploy artifact
- runtime inventory icons and some item/world presentation paths still read generated files from `./assets/pixel/...` and `./assets/models/...`
- those generated runtime assets are copied into `dist/` during the build step

## Deploy workflow

The canonical workflow is:

- `.github/workflows/deploy-pages.yml`

That workflow:

1. checks out `main`
2. installs dependencies with `npm ci`
3. runs `npm run build`
4. uploads `dist/` as the Pages artifact

## Build contract

`npm run build` must do two things:

1. run `vite build`
2. copy runtime asset directories into `dist/`

Today that copy step is handled by:

- `tools/build/copy-runtime-assets.js`

The runtime asset directories that must be present in production are:

- `assets/pixel`
- `assets/models`

If those folders do not land in `dist/`, GitHub Pages can load the app shell but inventory icons and related item visuals will break online even if local Vite dev still looks correct.

## Quick checks when the site looks wrong

1. Confirm the latest commit is on `origin/main`.
2. Confirm the latest `Deploy Pages` workflow run succeeded.
3. Confirm GitHub Pages is still set to `GitHub Actions`.
4. Run `npm.cmd run build` locally and verify:
   - `dist/index.html` exists
   - `dist/assets/pixel/` contains PNG icons
   - `dist/assets/models/` contains OBJ files
5. If the code looks right but your session feels stale, load the site with `?fresh=1` to clear saved progress before startup.

## Save-data note

Saved progress can make the session feel stale, but it cannot replace the deployed code bundle.

Useful reset paths:

- append `?fresh=1` to the site URL
- or run `window.startFreshSession()` in the browser console on a current build
