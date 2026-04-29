const path = require("path");
const THREE = require("three");
const { loadTsModule } = require("../lib/ts-module-loader");

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
  assert(descriptors.length >= 18, "expected animation clip descriptors");
  assert(!!registry.getAnimationClip("player/mining1"), "expected mining1 clip to be registered");
  assert(!!registry.getAnimationClip("player/fishing_net1"), "expected fishing_net1 clip to be registered");
  assert(!!registry.getAnimationClip("player/fishing_rod_hold1"), "expected fishing_rod_hold1 clip to be registered");
  assert(!!registry.getAnimationClip("player/fishing_rod_cast1"), "expected fishing_rod_cast1 clip to be registered");
  assert(!!registry.getAnimationClip("player/fishing_harpoon_hold1"), "expected fishing_harpoon_hold1 clip to be registered");
  assert(!!registry.getAnimationClip("player/fishing_harpoon_strike1"), "expected fishing_harpoon_strike1 clip to be registered");
  assert(!!registry.getAnimationClip("player/woodcutting1"), "expected woodcutting1 clip to be registered");
  assert(!!registry.getAnimationClip("player/cooking1"), "expected cooking1 clip to be registered");
  assert(!!registry.getAnimationClip("player/crafting1"), "expected crafting1 clip to be registered");
  assert(!!registry.getAnimationClip("player/runecrafting1"), "expected runecrafting1 clip to be registered");
  assert(!!registry.getAnimationClip("player/firemaking1"), "expected firemaking1 clip to be registered");
  assert(!!registry.getAnimationClip("player/fletching1"), "expected fletching1 clip to be registered");
  assert(!!registry.getAnimationClip("player/smithing_smelting1"), "expected smithing_smelting1 clip to be registered");
  assert(!!registry.getAnimationClip("player/smithing_forging1"), "expected smithing_forging1 clip to be registered");
  assert(schema.nodes.leftWeapon, "expected player rig schema to expose a left-hand item node");
  assert(schema.nodes.rightWeapon, "expected player rig schema to expose a right-hand item node");
  assert(registry.getAnimationClip("player/fishing_net1").heldItemId === "small_net", "expected fishing_net1 to default its held item");
  assert(registry.getAnimationClip("player/fishing_rod_hold1").heldItemId === "fishing_rod", "expected fishing_rod_hold1 to default its held item");
  assert(registry.getAnimationClip("player/fishing_rod_cast1").heldItemId === "fishing_rod", "expected fishing_rod_cast1 to default its held item");
  assert(registry.getAnimationClip("player/fishing_harpoon_hold1").heldItemId === "harpoon", "expected fishing_harpoon_hold1 to default its held item");
  assert(registry.getAnimationClip("player/fishing_harpoon_strike1").heldItemId === "harpoon", "expected fishing_harpoon_strike1 to default its held item");
  assert(!registry.getAnimationClip("player/woodcutting1").heldItemId, "expected woodcutting1 to rely on runtime-held-item selection");
  assert(!registry.getAnimationClip("player/crafting1").heldItemId, "expected crafting1 to stay empty-handed until recipe-specific props are authored");
  assert(!registry.getAnimationClip("player/runecrafting1").heldItemId, "expected runecrafting1 to stay empty-handed until altar-specific props are authored");
  assert(!registry.getAnimationClip("player/fletching1").heldItemId, "expected fletching1 to stay prop-neutral until runtime logic adds held items");
  assert(!registry.getAnimationClip("player/smithing_smelting1").heldItemId, "expected smithing_smelting1 to rely on runtime-held-item selection");
  assert(!registry.getAnimationClip("player/smithing_forging1").heldItemId, "expected smithing_forging1 to rely on runtime-held-item selection");
  assert(registry.getAnimationClip("player/firemaking1").heldItemSlot === "leftHand", "expected firemaking1 to default its held item slot to the left hand");
  assert(
    !!registry.getAnimationClipDescriptorBySourcePath("src/game/animation/clips/player/mining1.json"),
    "expected to resolve descriptors by source path"
  );
  assert(
    !!registry.getAnimationClipDescriptorBySourcePath("src/game/animation/clips/player/fishing_net1.json"),
    "expected to resolve fishing_net1 descriptors by source path"
  );
  assert(
    !!registry.getAnimationClipDescriptorBySourcePath("src/game/animation/clips/player/fishing_rod_hold1.json"),
    "expected to resolve fishing_rod_hold1 descriptors by source path"
  );
  assert(
    !!registry.getAnimationClipDescriptorBySourcePath("src/game/animation/clips/player/fishing_rod_cast1.json"),
    "expected to resolve fishing_rod_cast1 descriptors by source path"
  );
  assert(
    !!registry.getAnimationClipDescriptorBySourcePath("src/game/animation/clips/player/fishing_harpoon_hold1.json"),
    "expected to resolve fishing_harpoon_hold1 descriptors by source path"
  );
  assert(
    !!registry.getAnimationClipDescriptorBySourcePath("src/game/animation/clips/player/fishing_harpoon_strike1.json"),
    "expected to resolve fishing_harpoon_strike1 descriptors by source path"
  );
  assert(
    !!registry.getAnimationClipDescriptorBySourcePath("src/game/animation/clips/player/woodcutting1.json"),
    "expected to resolve woodcutting1 descriptors by source path"
  );
  assert(
    !!registry.getAnimationClipDescriptorBySourcePath("src/game/animation/clips/player/cooking1.json"),
    "expected to resolve cooking1 descriptors by source path"
  );
  assert(
    !!registry.getAnimationClipDescriptorBySourcePath("src/game/animation/clips/player/crafting1.json"),
    "expected to resolve crafting1 descriptors by source path"
  );
  assert(
    !!registry.getAnimationClipDescriptorBySourcePath("src/game/animation/clips/player/runecrafting1.json"),
    "expected to resolve runecrafting1 descriptors by source path"
  );
  assert(
    !!registry.getAnimationClipDescriptorBySourcePath("src/game/animation/clips/player/firemaking1.json"),
    "expected to resolve firemaking1 descriptors by source path"
  );
  assert(
    !!registry.getAnimationClipDescriptorBySourcePath("src/game/animation/clips/player/fletching1.json"),
    "expected to resolve fletching1 descriptors by source path"
  );
  assert(
    !!registry.getAnimationClipDescriptorBySourcePath("src/game/animation/clips/player/smithing_smelting1.json"),
    "expected to resolve smithing_smelting1 descriptors by source path"
  );
  assert(
    !!registry.getAnimationClipDescriptorBySourcePath("src/game/animation/clips/player/smithing_forging1.json"),
    "expected to resolve smithing_forging1 descriptors by source path"
  );
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

  const heldItemController = controllerModule.createAnimationControllerState("player_humanoid_v1", bindPose);
  controllerModule.beginAnimationFrame(heldItemController);
  controllerModule.setBaseAnimationClip(heldItemController, "player/mining1", 0, "bronze_pickaxe", "rightHand");
  assert(heldItemController.baseHeldItemId === "bronze_pickaxe", "base clips should accept held-item overrides");
  assert(heldItemController.baseHeldItemSlot === "rightHand", "base clips should accept held-item slot overrides");
  controllerModule.setBaseAnimationClip(heldItemController, "player/mining1", 250, "rune_pickaxe", "rightHand");
  assert(heldItemController.baseHeldItemId === "rune_pickaxe", "base held-item overrides should update without changing clips");
  assert(heldItemController.baseHeldItemSlot === "rightHand", "base held-item slot overrides should update without changing clips");
  assert(heldItemController.baseStartedAtMs === 0, "changing only the held item should not restart the base clip");
  controllerModule.requestActionAnimationClip(heldItemController, "player/fishing_harpoon_strike1", 100, "harpoon:1", 2, "rune_harpoon", "rightHand");
  controllerModule.sampleAnimationControllerPose(heldItemController, 120);
  assert(
    controllerModule.resolveAnimationControllerHeldItemId(heldItemController, 120) === "rune_harpoon",
    "active action clips should override the base held item"
  );
  assert(
    controllerModule.resolveAnimationControllerHeldItemSlot(heldItemController, 120) === "rightHand",
    "active action clips should override the base held-item slot"
  );
  const heldItemDebug = controllerModule.getAnimationControllerDebugSnapshot(heldItemController, 120);
  assert(heldItemDebug.baseHeldItemId === "rune_pickaxe", "debug snapshot should expose the base held item");
  assert(heldItemDebug.baseHeldItemSlot === "rightHand", "debug snapshot should expose the base held-item slot");
  assert(heldItemDebug.actionHeldItemId === "rune_harpoon", "debug snapshot should expose the action held item");
  assert(heldItemDebug.actionHeldItemSlot === "rightHand", "debug snapshot should expose the action held-item slot");
  assert(heldItemDebug.resolvedHeldItemId === "rune_harpoon", "debug snapshot should expose the resolved held item");
  assert(heldItemDebug.resolvedHeldItemSlot === "rightHand", "debug snapshot should expose the resolved held-item slot");
  assert(
    controllerModule.resolveAnimationControllerHeldItemId(heldItemController, 700) === "rune_pickaxe",
    "held-item resolution should fall back to the base clip after the action expires"
  );
  assert(
    controllerModule.resolveAnimationControllerHeldItemSlot(heldItemController, 700) === "rightHand",
    "held-item slot resolution should fall back to the base clip after the action expires"
  );

  const heldItemSlotController = controllerModule.createAnimationControllerState("player_humanoid_v1", bindPose);
  controllerModule.beginAnimationFrame(heldItemSlotController);
  controllerModule.setBaseAnimationClip(heldItemSlotController, "player/firemaking1", 0, "tinderbox", "leftHand");
  assert(heldItemSlotController.baseHeldItemSlot === "leftHand", "firemaking should be able to target the left-hand prop slot");
  controllerModule.requestActionAnimationClip(heldItemSlotController, "player/fishing_harpoon_strike1", 100, "harpoon:left-test", 2, "rune_harpoon", "rightHand");
  controllerModule.sampleAnimationControllerPose(heldItemSlotController, 120);
  assert(
    controllerModule.resolveAnimationControllerHeldItemSlot(heldItemSlotController, 120) === "rightHand",
    "action clips should temporarily replace a left-hand base slot"
  );
  assert(
    controllerModule.resolveAnimationControllerHeldItemSlot(heldItemSlotController, 700) === "leftHand",
    "slot resolution should restore the left-hand base slot after the action expires"
  );

  const dualHeldItemController = controllerModule.createAnimationControllerState("player_humanoid_v1", bindPose);
  controllerModule.beginAnimationFrame(dualHeldItemController);
  controllerModule.setBaseAnimationClip(
    dualHeldItemController,
    "player/firemaking1",
    0,
    undefined,
    "leftHand",
    { leftHand: "tinderbox", rightHand: "logs" }
  );
  const resolvedDualHeldItems = controllerModule.resolveAnimationControllerHeldItems(dualHeldItemController, 0);
  assert(resolvedDualHeldItems.leftHand === "tinderbox", "controller should preserve left-hand held-item maps");
  assert(resolvedDualHeldItems.rightHand === "logs", "controller should preserve right-hand held-item maps");
  assert(
    controllerModule.resolveAnimationControllerHeldItemSlot(dualHeldItemController, 0) === "leftHand",
    "legacy weapon routing should still honor the preferred hand when both props are active"
  );
  assert(
    controllerModule.resolveAnimationControllerHeldItemId(dualHeldItemController, 0) === "tinderbox",
    "legacy held-item resolution should read from the preferred hand when both props are active"
  );

  const aliasRigRoot = new THREE.Group();
  const aliasLeftWeapon = new THREE.Group();
  aliasLeftWeapon.name = "pm-leftTool";
  const aliasRightWeapon = new THREE.Group();
  aliasRightWeapon.name = "pm-axe";
  aliasRigRoot.add(aliasLeftWeapon);
  aliasRigRoot.add(aliasRightWeapon);
  aliasRigRoot.userData.rig = {
    leftTool: aliasLeftWeapon,
    rightTool: aliasRightWeapon,
    axe: aliasRightWeapon
  };
  aliasRigRoot.userData.animationHeldItemSlot = "leftHand";
  const aliasPose = clipUtils.buildBindFallbackPose(schema);
  aliasPose.weapon = {
    position: { x: 2, y: 0, z: 0 },
    rotationDeg: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  };
  controllerModule.applyResolvedPoseToRig(aliasRigRoot, "player_humanoid_v1", aliasPose, { bindPose });
  assert(aliasLeftWeapon.position.x === 2, "legacy weapon transforms should still move the active left-hand prop anchor");
  assert(aliasRightWeapon.position.x === 0, "left-hand alias fixes should not disturb the inactive right-hand prop anchor");

  const resetClip = clipUtils.resetPoseNodeToBindPose(registry.getAnimationClip("player/combat_slash"), "stage1", "rightArm", bindPose);
  assert(!resetClip.poses.stage1.rightArm, "reset-to-bind should remove node override");

  const createdClip = {
    clipId: "player/test_blank",
    rigId: "player_humanoid_v1",
    durationMs: 1000,
    loopMode: "loop",
    maskId: "fullBody",
    poses: {
      neutral: {}
    },
    keys: [
      { poseId: "neutral", atMs: 0, ease: "hold" }
    ],
    markers: []
  };
  registry.registerAnimationClip({
    clipId: createdClip.clipId,
    rigId: createdClip.rigId,
    sourcePath: "src/game/animation/clips/player/test_blank.json"
  }, createdClip);
  assert(!!registry.getAnimationClip(createdClip.clipId), "registerAnimationClip should store new clips");
  assert(
    !!registry.getAnimationClipDescriptorBySourcePath("src/game/animation/clips/player/test_blank.json"),
    "registerAnimationClip should retain source-path lookup"
  );
  const conflictingClip = {
    clipId: "player/test_blank_replacement",
    rigId: "player_humanoid_v1",
    durationMs: 1000,
    loopMode: "loop",
    maskId: "fullBody",
    poses: {
      neutral: {
        rightArm: {
          rotationDeg: { z: 15 }
        }
      }
    },
    keys: [
      { poseId: "neutral", atMs: 0, ease: "hold" }
    ],
    markers: []
  };
  registry.registerAnimationClip({
    clipId: conflictingClip.clipId,
    rigId: conflictingClip.rigId,
    sourcePath: "src/game/animation/clips/player/test_blank.json"
  }, conflictingClip);
  assert(
    !registry.getAnimationClip(createdClip.clipId),
    "registerAnimationClip should evict prior clips that reuse the same source path"
  );
  const storedConflictDescriptor = registry.getAnimationClipDescriptorBySourcePath("src/game/animation/clips/player/test_blank.json");
  assert(
    storedConflictDescriptor && storedConflictDescriptor.clipId === conflictingClip.clipId,
    "source-path lookup should resolve to the latest registered clip"
  );

  console.log("Animation domain tests passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
