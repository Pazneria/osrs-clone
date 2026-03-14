const assert = require("assert");
const path = require("path");

const { loadTsModule } = require("./ts-module-loader");

const root = path.resolve(__dirname, "..", "..");
const authoring = loadTsModule(path.join(root, "src", "game", "world", "authoring.ts"));
const manifest = require(path.join(root, "content", "world", "manifest.json"));
const starterTown = require(path.join(root, "content", "world", "regions", "starter_town.json"));

const WORLD_COORD_SCALE = 648 / 486;

function scaleAxis(value) {
  return Math.round(value * WORLD_COORD_SCALE);
}

function scaleRadius(value) {
  return Math.max(0.05, Number((value * WORLD_COORD_SCALE).toFixed(3)));
}

{
  const starterManifestEntry = manifest.worlds.find((entry) => entry.worldId === "starter_town");
  assert.ok(starterManifestEntry, "starter_town should exist in the raw manifest");

  const scaledDefaultSpawn = authoring.getDefaultSpawn("starter_town");
  assert.deepStrictEqual(
    scaledDefaultSpawn,
    {
      x: scaleAxis(starterManifestEntry.defaultSpawn.x),
      y: scaleAxis(starterManifestEntry.defaultSpawn.y),
      z: starterManifestEntry.defaultSpawn.z
    },
    "typed authoring default spawn should scale manifest coordinates for the expanded world"
  );

  const scaledManifestEntry = authoring.getWorldManifestEntry("starter_town");
  assert.deepStrictEqual(
    scaledManifestEntry.defaultSpawn,
    scaledDefaultSpawn,
    "manifest entry lookup and default spawn lookup should stay in sync"
  );
}

{
  const starterDefinition = authoring.getWorldDefinition("starter_town");
  const rawCastle = starterTown.structures.find((entry) => entry.structureId === "castle_ground");
  const rawPond = starterTown.terrainPatches.castleFrontPond;
  const rawRuneTutor = starterTown.services.find((entry) => entry.serviceId === "merchant:rune_tutor");

  assert.ok(rawCastle, "raw starter_town data should include castle_ground");
  assert.ok(rawPond, "raw starter_town data should include castle_front_pond");
  assert.ok(rawRuneTutor, "raw starter_town data should include rune tutor service");

  const scaledCastle = starterDefinition.structures.find((entry) => entry.structureId === "castle_ground");
  const scaledPond = starterDefinition.terrainPatches.castleFrontPond;
  const scaledRuneTutor = starterDefinition.services.find((entry) => entry.serviceId === "merchant:rune_tutor");

  assert.deepStrictEqual(
    { x: scaledCastle.x, y: scaledCastle.y },
    { x: scaleAxis(rawCastle.x), y: scaleAxis(rawCastle.y) },
    "world definition structures should scale authored x/y coordinates"
  );
  assert.deepStrictEqual(
    { cx: scaledPond.cx, cy: scaledPond.cy, rx: scaledPond.rx, ry: scaledPond.ry },
    {
      cx: scaleAxis(rawPond.cx),
      cy: scaleAxis(rawPond.cy),
      rx: scaleRadius(rawPond.rx),
      ry: scaleRadius(rawPond.ry)
    },
    "world definition lakes should scale center axes and radii"
  );
  assert.deepStrictEqual(
    { x: scaledRuneTutor.x, y: scaledRuneTutor.y },
    { x: scaleAxis(rawRuneTutor.x), y: scaleAxis(rawRuneTutor.y) },
    "world definition services should scale authored placement coordinates"
  );
}

console.log("World authoring domain tests passed.");
