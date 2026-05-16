import type { AnimationChannelId, AnimationRigSchema } from "../contracts/animation";

function createNode(
  id: string,
  label: string,
  mirrorId: string | null,
  channels: AnimationChannelId[]
) {
  return { id, label, mirrorId, channels };
}

const POSITION_ROTATION_SCALE: AnimationChannelId[] = ["position", "rotationDeg", "scale"];

export const PLAYER_HUMANOID_V1_RIG: AnimationRigSchema = {
  rigId: "player_humanoid_v1",
  label: "Player Humanoid v1",
  nodeOrder: [
    "root",
    "head",
    "torso",
    "leftArm",
    "rightArm",
    "leftLowerArm",
    "rightLowerArm",
    "leftLeg",
    "rightLeg",
    "leftLowerLeg",
    "rightLowerLeg",
    "weapon",
    "leftWeapon",
    "rightWeapon"
  ],
  nodes: {
    root: createNode("root", "Root", null, POSITION_ROTATION_SCALE),
    head: createNode("head", "Head", null, POSITION_ROTATION_SCALE),
    torso: createNode("torso", "Torso", null, POSITION_ROTATION_SCALE),
    leftArm: createNode("leftArm", "Left Arm", "rightArm", POSITION_ROTATION_SCALE),
    rightArm: createNode("rightArm", "Right Arm", "leftArm", POSITION_ROTATION_SCALE),
    leftLowerArm: createNode("leftLowerArm", "Left Forearm", "rightLowerArm", POSITION_ROTATION_SCALE),
    rightLowerArm: createNode("rightLowerArm", "Right Forearm", "leftLowerArm", POSITION_ROTATION_SCALE),
    leftLeg: createNode("leftLeg", "Left Leg", "rightLeg", POSITION_ROTATION_SCALE),
    rightLeg: createNode("rightLeg", "Right Leg", "leftLeg", POSITION_ROTATION_SCALE),
    leftLowerLeg: createNode("leftLowerLeg", "Left Shin", "rightLowerLeg", POSITION_ROTATION_SCALE),
    rightLowerLeg: createNode("rightLowerLeg", "Right Shin", "leftLowerLeg", POSITION_ROTATION_SCALE),
    weapon: createNode("weapon", "Weapon (Legacy)", null, POSITION_ROTATION_SCALE),
    leftWeapon: createNode("leftWeapon", "Left Hand Item", "rightWeapon", POSITION_ROTATION_SCALE),
    rightWeapon: createNode("rightWeapon", "Right Hand Item", "leftWeapon", POSITION_ROTATION_SCALE)
  },
  masks: {
    fullBody: [
      "root",
      "head",
      "torso",
      "leftArm",
      "rightArm",
      "leftLowerArm",
      "rightLowerArm",
      "leftLeg",
      "rightLeg",
      "leftLowerLeg",
      "rightLowerLeg",
      "weapon",
      "leftWeapon",
      "rightWeapon"
    ],
    upperBody: [
      "head",
      "torso",
      "leftArm",
      "rightArm",
      "leftLowerArm",
      "rightLowerArm",
      "weapon",
      "leftWeapon",
      "rightWeapon"
    ]
  }
};

const RIG_SCHEMAS = [PLAYER_HUMANOID_V1_RIG];

export function listAnimationRigSchemas(): AnimationRigSchema[] {
  return RIG_SCHEMAS.slice();
}

export function getAnimationRigSchema(rigId: string): AnimationRigSchema | null {
  const match = RIG_SCHEMAS.find((schema) => schema.rigId === rigId);
  return match || null;
}
