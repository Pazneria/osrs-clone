const path = require("path");
const { loadTsModule } = require("./ts-module-loader");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const clipUtils = loadTsModule(path.join(root, "src", "game", "animation", "clip-utils.ts"));
  const registry = loadTsModule(path.join(root, "src", "game", "animation", "registry.ts"));
  const schemaModule = loadTsModule(path.join(root, "src", "game", "animation", "schema.ts"));
  const controllerModule = loadTsModule(path.join(root, "src", "game", "animation", "controller.ts"));

  const schema = schemaModule.PLAYER_HUMANOID_V1_RIG;
  const descriptors = registry.listAnimationClipDescriptors();
  assert(descriptors.length >= 5, "expected animation clip descriptors");
  for (let i = 0; i < descriptors.length; i += 1) {
    const clip = registry.getAnimationClip(descriptors[i].clipId);
    const errors = clipUtils.validateAnimationClip(clip, schema);
    assert(errors.length === 0, `clip ${descriptors[i].clipId} should validate`);
  }

  const bindPose = clipUtils.buildBindFallbackPose(schema);
  bindPose.rightArm = {
    position: { x: 1, y: 2, z: 3 },
    rotationDeg: { x: 10, y: 20, z: 30 },
    scale: { x: 1, y: 1, z: 1 }
  };
  bindPose.leftLeg = {
    position: { x: 0, y: 0, z: 0 },
    rotationDeg: { x: -12, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  };

  const fallbackClip = {
    clipId: "test/fallback",
    rigId: "player_humanoid_v1",
    durationMs: 100,
    loopMode: "once",
    maskId: "fullBody",
    poses: {
      a: {},
      b: {
        rightArm: {
          rotationDeg: { z: 50 }
        }
      }
    },
    keys: [
      { poseId: "a", atMs: 0, ease: "linear" },
      { poseId: "b", atMs: 100, ease: "linear" }
    ],
    markers: []
  };
  const sampledFallback = clipUtils.sampleAnimationClip(fallbackClip, schema, bindPose, 50);
  assert(sampledFallback.rightArm.rotationDeg.x === 10, "bind-pose fallback should preserve missing x rotation");
  assert(sampledFallback.rightArm.rotationDeg.y === 20, "bind-pose fallback should preserve missing y rotation");
  assert(Math.abs(sampledFallback.rightArm.rotationDeg.z - 40) < 0.001, "interpolated z rotation should blend from bind pose");

  const easedClip = {
    clipId: "test/easing",
    rigId: "player_humanoid_v1",
    durationMs: 100,
    loopMode: "once",
    maskId: "fullBody",
    poses: {
      start: {},
      end: {
        rightArm: {
          rotationDeg: { z: 100 }
        }
      }
    },
    keys: [
      { poseId: "start", atMs: 0, ease: "easeIn" },
      { poseId: "end", atMs: 100, ease: "linear" }
    ],
    markers: []
  };
  const easeInSample = clipUtils.sampleAnimationClip(easedClip, schema, bindPose, 50);
  assert(Math.abs(easeInSample.rightArm.rotationDeg.z - 47.5) < 0.001, "easeIn should bias the midpoint toward the starting pose");
  easedClip.keys[0].ease = "easeOut";
  const easeOutSample = clipUtils.sampleAnimationClip(easedClip, schema, bindPose, 50);
  assert(Math.abs(easeOutSample.rightArm.rotationDeg.z - 82.5) < 0.001, "easeOut should bias the midpoint toward the ending pose");

  const basePose = clipUtils.buildBindFallbackPose(schema);
  basePose.leftLeg.rotationDeg.x = 24;
  basePose.rightArm.rotationDeg.z = 5;
  const overlayPose = clipUtils.buildBindFallbackPose(schema);
  overlayPose.rightArm.rotationDeg.z = 70;
  overlayPose.leftLeg.rotationDeg.x = -99;
  const layered = clipUtils.layerResolvedPose(basePose, overlayPose, schema, "upperBody");
  assert(layered.rightArm.rotationDeg.z === 70, "upper-body mask should override arm rotation");
  assert(layered.leftLeg.rotationDeg.x === 24, "upper-body mask should keep leg pose from base");

  const renamed = clipUtils.renamePoseInClip(registry.getAnimationClip("player/combat_slash"), "stage1", "windup");
  assert(!!renamed.poses.windup, "rename should move pose entry");
  assert(renamed.keys.some((key) => key.poseId === "windup"), "rename should update keys");

  const controller = controllerModule.createAnimationControllerState("player_humanoid_v1", bindPose);
  controllerModule.beginAnimationFrame(controller);
  controllerModule.setBaseAnimationClip(controller, "player/walk", 0);
  controllerModule.requestActionAnimationClip(controller, "player/hit_recoil", 0, "hit:1", 1);
  controllerModule.requestActionAnimationClip(controller, "player/combat_slash", 0, "attack:1", 2);
  const controllerPose = controllerModule.sampleAnimationControllerPose(controller, 50);
  const controllerDebug = controllerModule.getAnimationControllerDebugSnapshot(controller, 50);
  assert(controller.actionClipId === "player/combat_slash", "higher-priority attack action should win same-frame precedence");
  assert(controllerPose.leftLeg.rotationDeg.x !== 0, "base locomotion pose should survive under upper-body action layering");
  assert(controllerDebug.requestedActions.length === 2, "debug snapshot should retain both same-frame action requests");
  assert(controllerDebug.winningRequest && controllerDebug.winningRequest.clipId === "player/combat_slash", "debug snapshot should expose the winning action request");
  assert(controllerDebug.lastCommittedAction && controllerDebug.lastCommittedAction.clipId === "player/combat_slash", "debug snapshot should expose the committed action");

  const resetClip = clipUtils.resetPoseNodeToBindPose(registry.getAnimationClip("player/combat_slash"), "stage1", "rightArm", bindPose);
  assert(!resetClip.poses.stage1.rightArm, "reset-to-bind should remove node override");

  console.log("Animation domain tests passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
