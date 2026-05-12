const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeVec() {
  return {
    values: [],
    set(x, y, z) {
      this.values = [x, y, z];
    }
  };
}

function makeNode() {
  return {
    position: makeVec(),
    visible: true
  };
}

function makeRig() {
  const nodes = {
    torso: makeNode(),
    head: makeNode(),
    leftArm: makeNode(),
    rightArm: makeNode(),
    leftLowerArm: makeNode(),
    rightLowerArm: makeNode(),
    leftLeg: makeNode(),
    rightLeg: makeNode(),
    leftLowerLeg: makeNode(),
    rightLowerLeg: makeNode(),
    axe: makeNode(),
    leftTool: makeNode()
  };
  return {
    nodes,
    position: makeVec(),
    scale: makeVec(),
    userData: {},
    clone() {
      return makeRig();
    }
  };
}

function getCatalogNodeWorldY(poseNodes, nodeName) {
  const node = poseNodes[nodeName];
  const y = Array.isArray(node) && Number.isFinite(node[1]) ? node[1] : 0;
  if (nodeName === "head" || nodeName === "leftArm" || nodeName === "rightArm") {
    return getCatalogNodeWorldY(poseNodes, "torso") + y;
  }
  if (nodeName === "leftLowerArm") return getCatalogNodeWorldY(poseNodes, "leftArm") + y;
  if (nodeName === "rightLowerArm") return getCatalogNodeWorldY(poseNodes, "rightArm") + y;
  if (nodeName === "leftLowerLeg") return getCatalogNodeWorldY(poseNodes, "leftLeg") + y;
  if (nodeName === "rightLowerLeg") return getCatalogNodeWorldY(poseNodes, "rightLeg") + y;
  return y;
}

function catalogFragmentExtentY(preset, target, role) {
  const fragment = preset.fragments.find((entry) => entry && entry.target === target && entry.role === role);
  assert(fragment, `Tutorial Guide preset should define ${target}:${role}`);
  const poseNodes = preset.pose && preset.pose.nodes ? preset.pose.nodes : {};
  const nodeY = getCatalogNodeWorldY(poseNodes, fragment.target);
  const offsetY = Array.isArray(fragment.offset) && Number.isFinite(fragment.offset[1]) ? fragment.offset[1] : 0;
  const height = Array.isArray(fragment.size) && Number.isFinite(fragment.size[1]) ? fragment.size[1] : 0;
  const centerY = nodeY + offsetY;
  return {
    bottom: centerY - (height / 2),
    top: centerY + (height / 2)
  };
}

function catalogFragment(preset, target, role) {
  const fragment = preset.fragments.find((entry) => entry && entry.target === target && entry.role === role);
  assert(fragment, `Tutorial Guide preset should define ${target}:${role}`);
  return fragment;
}

function assertVerticalContact(upper, lower, label) {
  const gap = upper.bottom - lower.top;
  assert(gap <= 0.006, `${label} should overlap or touch, gap=${gap.toFixed(4)}`);
}

function assertShouldersMeetTorsoTop(preset, label) {
  const torso = catalogFragmentExtentY(preset, "torso", "torso_core");
  ["left", "right"].forEach((side) => {
    const shoulderCap = catalogFragmentExtentY(preset, "torso", `${side}_shoulder_cap`);
    const upperArm = catalogFragmentExtentY(preset, `${side}Arm`, "upper_arm");
    assert(
      shoulderCap.top >= torso.top - 0.015,
      `${label} ${side} shoulder cap should reach the top of the torso, capTop=${shoulderCap.top.toFixed(4)} torsoTop=${torso.top.toFixed(4)}`
    );
    assert(
      upperArm.top >= torso.top - 0.012 && upperArm.top <= torso.top + 0.04,
      `${label} ${side} upper arm should start at the torso top, armTop=${upperArm.top.toFixed(4)} torsoTop=${torso.top.toFixed(4)}`
    );
  });
}

function assertTutorialGuideHumanoidAssembly(preset) {
  assert(preset && preset.construction, "Tutorial Guide preset should expose construction measurements");
  assert(preset.construction.minContactOverlap >= 0.02, "Tutorial Guide joints should be built with explicit contact overlap");
  assert(Array.isArray(preset.fragments) && preset.fragments.length > 0, "Tutorial Guide preset should contain fragments");

  const torso = catalogFragmentExtentY(preset, "torso", "torso_core");
  const neck = catalogFragmentExtentY(preset, "torso", "neck");
  const head = catalogFragmentExtentY(preset, "head", "head_core");
  const hairCap = catalogFragmentExtentY(preset, "head", "hair_cap");
  const hairFront = catalogFragment(preset, "head", "hair_front");

  assertVerticalContact(head, neck, "neck/head");
  assert(hairCap.top > head.top + 0.015, "Tutorial Guide hair cap should sit above the skull instead of sharing the head top plane");
  assert(hairCap.bottom < head.top - 0.015, "Tutorial Guide hair cap should overlap the skull enough to avoid a visible gap");
  assert(hairFront.offset[2] > 0.2, "Tutorial Guide front hair should sit in front of the face instead of clipping inside the head");
  assert(!preset.fragments.some((fragment) => String(fragment.role || "").startsWith("satchel_")), "Tutorial Guide preset should not include satchel fragments");
  assertShouldersMeetTorsoTop(preset, "Tutorial Guide");

  ["left", "right"].forEach((side) => {
    const upperArm = catalogFragmentExtentY(preset, `${side}Arm`, "upper_arm");
    const lowerArm = catalogFragmentExtentY(preset, `${side}LowerArm`, "lower_arm");
    const hand = catalogFragmentExtentY(preset, `${side}LowerArm`, "hand");
    const upperLeg = catalogFragmentExtentY(preset, `${side}Leg`, "upper_leg");
    const lowerLeg = catalogFragmentExtentY(preset, `${side}LowerLeg`, "lower_leg");
    const boot = catalogFragmentExtentY(preset, `${side}LowerLeg`, "boot");

    assertVerticalContact(upperArm, lowerArm, `${side} elbow`);
    assertVerticalContact(lowerArm, hand, `${side} wrist`);
    assertVerticalContact(torso, upperLeg, `${side} hip`);
    assertVerticalContact(upperLeg, lowerLeg, `${side} knee`);
    assertVerticalContact(lowerLeg, boot, `${side} ankle`);
    assert(Math.abs(boot.bottom) <= 0.001, `${side} boot should land on the rig floor, bottom=${boot.bottom.toFixed(4)}`);
  });
}

function assertTutorialWoodcuttingInstructorHumanoidAssembly(preset) {
  assert(preset && preset.construction, "Woodcutting Instructor preset should expose construction measurements");
  assert(preset.archetype === "old_woodsman", "Woodcutting Instructor preset should declare the old woodsman archetype");
  assert(preset.construction.minContactOverlap >= 0.02, "Woodcutting Instructor joints should be built with explicit contact overlap");
  assert(Array.isArray(preset.fragments) && preset.fragments.length > 0, "Woodcutting Instructor preset should contain fragments");

  const torso = catalogFragmentExtentY(preset, "torso", "torso_core");
  const neck = catalogFragmentExtentY(preset, "torso", "neck");
  const head = catalogFragmentExtentY(preset, "head", "head_core");
  const hairCap = catalogFragmentExtentY(preset, "head", "hair_cap");
  const hairFront = catalogFragment(preset, "head", "hair_front");
  const beard = catalogFragment(preset, "head", "beard");
  const shirt = catalogFragment(preset, "torso", "torso_core");
  const plaidStripe = catalogFragment(preset, "torso", "plaid_vertical_tan");
  const beltAxeHandle = catalogFragment(preset, "torso", "belt_axe_handle");
  const beltAxeHead = catalogFragment(preset, "torso", "belt_axe_head");
  const wristCuff = catalogFragment(preset, "leftLowerArm", "cuff");
  const gloveHand = catalogFragment(preset, "leftLowerArm", "hand");

  assertVerticalContact(head, neck, "woodcutting instructor neck/head");
  assert(hairCap.top > head.top + 0.015, "Woodcutting Instructor hair cap should sit above the skull instead of sharing the head top plane");
  assert(hairCap.bottom < head.top - 0.015, "Woodcutting Instructor hair cap should overlap the skull enough to avoid a visible gap");
  assert(hairFront.offset[2] > 0.2, "Woodcutting Instructor front hair should sit in front of the face instead of clipping inside the head");
  assert(beard.offset[2] > 0.2, "Woodcutting Instructor beard should sit outside the front of the head");
  assert(shirt.rgbColor === "#7e2622", "Woodcutting Instructor should use a red plaid shirt base");
  assert(plaidStripe.rgbColor === "#b68b5e", "Woodcutting Instructor should include visible plaid contrast stripes");
  assert(beltAxeHandle.target === "torso" && beltAxeHead.target === "torso", "Woodcutting Instructor belt axe should attach to the torso instead of a hand");
  assert(!preset.fragments.some((fragment) => String(fragment.role || "").startsWith("belt_axe_") && fragment.target !== "torso"), "Woodcutting Instructor belt axe fragments should stay off hand and arm bones");
  assert(wristCuff.size[1] <= 0.04 && gloveHand.size[0] <= 0.13 && gloveHand.offset[2] === 0, "Woodcutting Instructor wrist and hand fragments should stay compact to avoid forearm clipping");
  assertShouldersMeetTorsoTop(preset, "Woodcutting Instructor");

  ["left", "right"].forEach((side) => {
    const upperArm = catalogFragmentExtentY(preset, `${side}Arm`, "upper_arm");
    const lowerArm = catalogFragmentExtentY(preset, `${side}LowerArm`, "lower_arm");
    const hand = catalogFragmentExtentY(preset, `${side}LowerArm`, "hand");
    const upperLeg = catalogFragmentExtentY(preset, `${side}Leg`, "upper_leg");
    const lowerLeg = catalogFragmentExtentY(preset, `${side}LowerLeg`, "lower_leg");
    const boot = catalogFragmentExtentY(preset, `${side}LowerLeg`, "boot");

    assertVerticalContact(upperArm, lowerArm, `${side} woodcutting elbow`);
    assertVerticalContact(lowerArm, hand, `${side} woodcutting wrist`);
    assert(hand.top - lowerArm.bottom <= 0.006, `${side} woodcutting wrist should only lightly meet the forearm, penetration=${(hand.top - lowerArm.bottom).toFixed(4)}`);
    assertVerticalContact(torso, upperLeg, `${side} woodcutting hip`);
    assertVerticalContact(upperLeg, lowerLeg, `${side} woodcutting knee`);
    assertVerticalContact(lowerLeg, boot, `${side} woodcutting ankle`);
    assert(Math.abs(boot.bottom) <= 0.001, `${side} woodcutting boot should land on the rig floor, bottom=${boot.bottom.toFixed(4)}`);
  });
}

function assertTutorialFishingInstructorHumanoidAssembly(preset) {
  assert(preset && preset.construction, "Fishing Instructor preset should expose construction measurements");
  assert(preset.archetype === "weathered_angler", "Fishing Instructor preset should declare the weathered angler archetype");
  assert(preset.construction.minContactOverlap >= 0.02, "Fishing Instructor joints should be built with explicit contact overlap");
  assert(Array.isArray(preset.fragments) && preset.fragments.length > 0, "Fishing Instructor preset should contain fragments");

  const torso = catalogFragmentExtentY(preset, "torso", "torso_core");
  const neck = catalogFragmentExtentY(preset, "torso", "neck");
  const head = catalogFragmentExtentY(preset, "head", "head_core");
  const hairCap = catalogFragmentExtentY(preset, "head", "hair_cap");
  const hairFront = catalogFragment(preset, "head", "hair_front");
  const hatBrim = catalogFragment(preset, "head", "hat_brim");
  const hatCrown = catalogFragment(preset, "head", "hat_crown");
  const beard = catalogFragment(preset, "head", "beard");
  const vestLeft = catalogFragment(preset, "torso", "vest_left_front");
  const vestLeftPocket = catalogFragment(preset, "torso", "vest_left_pocket");
  const vestRightPocket = catalogFragment(preset, "torso", "vest_right_pocket");
  const waderBib = catalogFragment(preset, "torso", "wader_bib");
  const waderBackPanel = catalogFragment(preset, "torso", "wader_back_panel");
  const leftWaderFrontStrap = catalogFragment(preset, "torso", "left_wader_front_strap");
  const rightWaderFrontStrap = catalogFragment(preset, "torso", "right_wader_front_strap");
  const leftWaderBackStrap = catalogFragment(preset, "torso", "left_wader_back_strap");
  const rightWaderBackStrap = catalogFragment(preset, "torso", "right_wader_back_strap");
  const leftWaderShoulderBridge = catalogFragment(preset, "torso", "left_wader_shoulder_bridge");
  const rightWaderShoulderBridge = catalogFragment(preset, "torso", "right_wader_shoulder_bridge");
  const leftWaderFrontStrapY = catalogFragmentExtentY(preset, "torso", "left_wader_front_strap");
  const rightWaderFrontStrapY = catalogFragmentExtentY(preset, "torso", "right_wader_front_strap");
  const shirtPanel = catalogFragment(preset, "torso", "shirt_panel");
  const lineSpool = catalogFragment(preset, "torso", "line_spool_core");
  const fishingFloat = catalogFragment(preset, "torso", "float_red");
  const landingNetHandle = catalogFragment(preset, "torso", "landing_net_handle");
  const landingNetFrame = catalogFragment(preset, "torso", "landing_net_frame");

  assertVerticalContact(head, neck, "fishing instructor neck/head");
  assert(hairCap.top > head.top + 0.015, "Fishing Instructor hair cap should sit above the skull instead of sharing the head top plane");
  assert(hairCap.bottom < head.top - 0.015, "Fishing Instructor hair cap should overlap the skull enough to avoid a visible gap");
  assert(hairFront.offset[2] > 0.2, "Fishing Instructor front hair should sit in front of the face instead of clipping inside the head");
  assert(hatBrim.target === "head" && hatCrown.target === "head", "Fishing Instructor should use head-attached brim hat fragments");
  assert(hatBrim.size[0] >= 0.6 && hatBrim.size[2] >= 0.55, "Fishing Instructor brim hat should be chunky enough to read from the game camera");
  assert(beard.offset[2] > 0.2, "Fishing Instructor beard should sit outside the front of the head");
  assert(!preset.fragments.some((fragment) => String(fragment.role || "").startsWith("collar_")), "Fishing Instructor should not include bow-tie-like collar fragments");
  assert(vestLeft.rgbColor === "#466b59", "Fishing Instructor should use a muted utility vest instead of a formal coat");
  assert(shirtPanel.rgbColor === "#7a5d3d", "Fishing Instructor should keep a simple work-shirt panel");
  assert(waderBib.rgbColor === "#3a5753", "Fishing Instructor should include a visible wader bib");
  assert(waderBackPanel.rgbColor === waderBib.rgbColor && waderBackPanel.offset[2] < -0.2, "Fishing Instructor waders should include a matching back panel");
  assert(leftWaderFrontStrap.rgbColor === "#2c403f" && rightWaderFrontStrap.rgbColor === "#2c403f", "Fishing Instructor waders should have readable front straps");
  assert(leftWaderBackStrap.offset[2] < -0.2 && rightWaderBackStrap.offset[2] < -0.2, "Fishing Instructor wader straps should continue onto the back");
  assert(leftWaderShoulderBridge.size[2] >= 0.50 && rightWaderShoulderBridge.size[2] >= 0.50, "Fishing Instructor wader straps should bridge over the shoulders from front to back");
  assert(leftWaderFrontStrapY.top >= torso.top - 0.025 && rightWaderFrontStrapY.top >= torso.top - 0.025, "Fishing Instructor front straps should reach the top of the torso");
  assert(vestLeftPocket.size[0] >= 0.14 && vestRightPocket.size[0] >= 0.14, "Fishing Instructor should have readable front vest pockets");
  assert(lineSpool.target === "torso" && fishingFloat.target === "torso" && landingNetHandle.target === "torso" && landingNetFrame.target === "torso", "Fishing Instructor fishing details should attach to the torso instead of hands");
  assert(!preset.fragments.some((fragment) => {
    const role = String(fragment.role || "");
    return (role.startsWith("line_spool") || role.startsWith("float_") || role.startsWith("landing_net")) && fragment.target !== "torso";
  }), "Fishing Instructor fishing detail fragments should stay off hand and arm bones");
  assertShouldersMeetTorsoTop(preset, "Fishing Instructor");

  ["left", "right"].forEach((side) => {
    const upperArm = catalogFragmentExtentY(preset, `${side}Arm`, "upper_arm");
    const lowerArm = catalogFragmentExtentY(preset, `${side}LowerArm`, "lower_arm");
    const hand = catalogFragmentExtentY(preset, `${side}LowerArm`, "hand");
    const upperLeg = catalogFragmentExtentY(preset, `${side}Leg`, "upper_leg");
    const lowerLeg = catalogFragmentExtentY(preset, `${side}LowerLeg`, "lower_leg");
    const boot = catalogFragmentExtentY(preset, `${side}LowerLeg`, "boot");

    assertVerticalContact(upperArm, lowerArm, `${side} fishing elbow`);
    assertVerticalContact(lowerArm, hand, `${side} fishing wrist`);
    assertVerticalContact(torso, upperLeg, `${side} fishing hip`);
    assertVerticalContact(upperLeg, lowerLeg, `${side} fishing knee`);
    assertVerticalContact(lowerLeg, boot, `${side} fishing ankle`);
    assert(Math.abs(boot.bottom) <= 0.001, `${side} fishing boot should land on the rig floor, bottom=${boot.bottom.toFixed(4)}`);
  });
}

function assertTutorialFiremakingInstructorHumanoidAssembly(preset) {
  assert(preset && preset.construction, "Firemaking Instructor preset should expose construction measurements");
  assert(preset.archetype === "sooty_fire_worker", "Firemaking Instructor preset should declare the sooty fire worker archetype");
  assert(preset.construction.minContactOverlap >= 0.02, "Firemaking Instructor joints should be built with explicit contact overlap");
  assert(Array.isArray(preset.fragments) && preset.fragments.length > 0, "Firemaking Instructor preset should contain fragments");

  const torso = catalogFragmentExtentY(preset, "torso", "torso_core");
  const neck = catalogFragmentExtentY(preset, "torso", "neck");
  const head = catalogFragmentExtentY(preset, "head", "head_core");
  const hairCap = catalogFragmentExtentY(preset, "head", "hair_cap");
  const hairFront = catalogFragment(preset, "head", "hair_front");
  const beard = catalogFragment(preset, "head", "short_beard");
  const shirt = catalogFragment(preset, "torso", "torso_core");
  const apron = catalogFragment(preset, "torso", "apron_front");
  const apronBack = catalogFragment(preset, "torso", "apron_back");
  const leftBackStrap = catalogFragment(preset, "torso", "left_apron_back_strap");
  const rightBackStrap = catalogFragment(preset, "torso", "right_apron_back_strap");
  const leftShoulderBridge = catalogFragment(preset, "torso", "left_apron_shoulder_bridge");
  const rightShoulderBridge = catalogFragment(preset, "torso", "right_apron_shoulder_bridge");
  const leftSootCheek = catalogFragment(preset, "head", "left_soot_cheek");
  const rightSootCheek = catalogFragment(preset, "head", "right_soot_cheek");
  const ashSplatter = catalogFragment(preset, "torso", "ash_splatter_high");
  const emberPatch = catalogFragment(preset, "torso", "ember_patch");
  const tinderboxCase = catalogFragment(preset, "torso", "belt_tinderbox_case");
  const tinderboxLid = catalogFragment(preset, "torso", "belt_tinderbox_lid");
  const beltLogOne = catalogFragment(preset, "torso", "belt_log_bundle_one");
  const beltLogTwo = catalogFragment(preset, "torso", "belt_log_bundle_two");
  const beltLogBinding = catalogFragment(preset, "torso", "belt_log_binding");
  const wristCuff = catalogFragment(preset, "leftLowerArm", "cuff");
  const gloveHand = catalogFragment(preset, "leftLowerArm", "hand");

  assertVerticalContact(head, neck, "firemaking instructor neck/head");
  assert(hairCap.top > head.top + 0.015, "Firemaking Instructor hair cap should sit above the skull instead of sharing the head top plane");
  assert(hairCap.bottom < head.top - 0.015, "Firemaking Instructor hair cap should overlap the skull enough to avoid a visible gap");
  assert(hairFront.offset[2] > 0.2, "Firemaking Instructor front hair should sit in front of the face instead of clipping inside the head");
  assert(beard.offset[2] > 0.2, "Firemaking Instructor beard should sit outside the front of the head");
  assert(shirt.rgbColor === "#a84b26", "Firemaking Instructor should use warm firemaking workwear");
  assert(apron.rgbColor === "#4a3a2b", "Firemaking Instructor should include a dark protective apron");
  assert(apronBack.rgbColor === apron.rgbColor && apronBack.offset[2] < -0.2, "Firemaking Instructor overalls should include a matching back panel");
  assert(leftBackStrap.offset[2] < -0.2 && rightBackStrap.offset[2] < -0.2, "Firemaking Instructor overall straps should continue onto the back");
  assert(leftShoulderBridge.size[2] >= 0.50 && rightShoulderBridge.size[2] >= 0.50, "Firemaking Instructor straps should bridge over the shoulders from front to back");
  assert(leftSootCheek.rgbColor === "#1d1d1b" && rightSootCheek.rgbColor === "#1d1d1b", "Firemaking Instructor should have readable soot marks");
  assert(ashSplatter.rgbColor === "#8a8477", "Firemaking Instructor should include ash details");
  assert(emberPatch.rgbColor === "#d9792f", "Firemaking Instructor should include a small warm ember accent");
  assert(tinderboxCase.target === "torso" && tinderboxLid.target === "torso", "Firemaking Instructor tinderbox should attach to the torso instead of hands");
  assert(beltLogOne.target === "torso" && beltLogTwo.target === "torso" && beltLogBinding.target === "torso", "Firemaking Instructor log bundle should attach to the torso instead of hands");
  assert(Math.abs(tinderboxCase.offset[0]) <= 0.2 && Math.abs(beltLogTwo.offset[0]) <= 0.23, "Firemaking Instructor belt details should stay close to the apron instead of sticking out to the sides");
  assert(wristCuff.size[1] <= 0.04 && gloveHand.size[0] <= 0.13 && gloveHand.offset[2] === 0, "Firemaking Instructor wrist and hand fragments should stay compact to avoid forearm clipping");
  assert(!preset.fragments.some((fragment) => {
    const role = String(fragment.role || "");
    return (role.startsWith("belt_tinderbox") || role.startsWith("belt_log_")) && fragment.target !== "torso";
  }), "Firemaking Instructor firemaking detail fragments should stay off hand and arm bones");
  assertShouldersMeetTorsoTop(preset, "Firemaking Instructor");

  ["left", "right"].forEach((side) => {
    const upperArm = catalogFragmentExtentY(preset, `${side}Arm`, "upper_arm");
    const lowerArm = catalogFragmentExtentY(preset, `${side}LowerArm`, "lower_arm");
    const hand = catalogFragmentExtentY(preset, `${side}LowerArm`, "hand");
    const upperLeg = catalogFragmentExtentY(preset, `${side}Leg`, "upper_leg");
    const lowerLeg = catalogFragmentExtentY(preset, `${side}LowerLeg`, "lower_leg");
    const boot = catalogFragmentExtentY(preset, `${side}LowerLeg`, "boot");

    assertVerticalContact(upperArm, lowerArm, `${side} firemaking elbow`);
    assertVerticalContact(lowerArm, hand, `${side} firemaking wrist`);
    assertVerticalContact(torso, upperLeg, `${side} firemaking hip`);
    assertVerticalContact(upperLeg, lowerLeg, `${side} firemaking knee`);
    assertVerticalContact(lowerLeg, boot, `${side} firemaking ankle`);
    assert(Math.abs(boot.bottom) <= 0.001, `${side} firemaking boot should land on the rig floor, bottom=${boot.bottom.toFixed(4)}`);
  });
}

function assertTutorialMiningSmithingInstructorHumanoidAssembly(preset) {
  assert(preset && preset.construction, "Mining and Smithing Instructor preset should expose construction measurements");
  assert(preset.archetype === "aproned_mine_foreman", "Mining and Smithing Instructor preset should declare the aproned mine foreman archetype");
  assert(preset.construction.minContactOverlap >= 0.02, "Mining and Smithing Instructor joints should be built with explicit contact overlap");
  assert(Array.isArray(preset.fragments) && preset.fragments.length > 0, "Mining and Smithing Instructor preset should contain fragments");

  const torso = catalogFragmentExtentY(preset, "torso", "torso_core");
  const neck = catalogFragmentExtentY(preset, "torso", "neck");
  const head = catalogFragmentExtentY(preset, "head", "head_core");
  const hairCap = catalogFragmentExtentY(preset, "head", "hair_cap");
  const hairFront = catalogFragment(preset, "head", "hair_front");
  const beard = catalogFragment(preset, "head", "short_beard");
  const shirt = catalogFragment(preset, "torso", "torso_core");
  const apron = catalogFragment(preset, "torso", "apron_front");
  const apronBack = catalogFragment(preset, "torso", "apron_back");
  const leftBackStrap = catalogFragment(preset, "torso", "left_apron_back_strap");
  const rightBackStrap = catalogFragment(preset, "torso", "right_apron_back_strap");
  const leftShoulderBridge = catalogFragment(preset, "torso", "left_apron_shoulder_bridge");
  const rightShoulderBridge = catalogFragment(preset, "torso", "right_apron_shoulder_bridge");
  const oreDust = catalogFragment(preset, "torso", "ore_dust_chest");
  const copperSmear = catalogFragment(preset, "torso", "copper_ore_smear");
  const tinSmear = catalogFragment(preset, "torso", "tin_ore_smear");
  const hammerHandle = catalogFragment(preset, "torso", "belt_hammer_handle");
  const hammerHead = catalogFragment(preset, "torso", "belt_hammer_head");
  const tongsLeft = catalogFragment(preset, "torso", "belt_tongs_left");
  const tongsRight = catalogFragment(preset, "torso", "belt_tongs_right");
  const wristCuff = catalogFragment(preset, "leftLowerArm", "cuff");
  const gloveHand = catalogFragment(preset, "leftLowerArm", "hand");

  assertVerticalContact(head, neck, "mining and smithing instructor neck/head");
  assert(hairCap.top > head.top + 0.015, "Mining and Smithing Instructor hair cap should sit above the skull instead of sharing the head top plane");
  assert(hairCap.bottom < head.top - 0.015, "Mining and Smithing Instructor hair cap should overlap the skull enough to avoid a visible gap");
  assert(hairFront.offset[2] > 0.2, "Mining and Smithing Instructor front hair should sit in front of the face instead of clipping inside the head");
  assert(beard.offset[2] > 0.2, "Mining and Smithing Instructor beard should sit outside the front of the head");
  assert(shirt.rgbColor === "#5f6f6b", "Mining and Smithing Instructor should use dusty practical workwear");
  assert(apron.rgbColor === "#5f432b", "Mining and Smithing Instructor should include a leather apron");
  assert(apronBack.rgbColor === apron.rgbColor && apronBack.offset[2] < -0.2, "Mining and Smithing Instructor apron should include a matching back panel");
  assert(leftBackStrap.offset[2] < -0.2 && rightBackStrap.offset[2] < -0.2, "Mining and Smithing Instructor straps should continue onto the back");
  assert(leftShoulderBridge.size[2] >= 0.50 && rightShoulderBridge.size[2] >= 0.50, "Mining and Smithing Instructor straps should bridge over the shoulders from front to back");
  assert(oreDust.rgbColor === "#8a8173" && copperSmear.rgbColor === "#b56f4e" && tinSmear.rgbColor === "#b8c4c9", "Mining and Smithing Instructor should include readable ore dust and copper/tin details");
  assert(hammerHandle.target === "torso" && hammerHead.target === "torso", "Mining and Smithing Instructor hammer should attach to the belt instead of hands");
  assert(tongsLeft.target === "torso" && tongsRight.target === "torso", "Mining and Smithing Instructor tongs should attach to the belt instead of hands");
  assert(wristCuff.size[1] <= 0.04 && gloveHand.size[0] <= 0.13 && gloveHand.offset[2] === 0, "Mining and Smithing Instructor wrist and hand fragments should stay compact to avoid forearm clipping");
  assert(!preset.fragments.some((fragment) => {
    const role = String(fragment.role || "");
    return (role.startsWith("belt_hammer") || role.startsWith("belt_tongs")) && fragment.target !== "torso";
  }), "Mining and Smithing Instructor mining/smithing detail fragments should stay off hand and arm bones");
  assert(!preset.fragments.some((fragment) => String(fragment.role || "").includes("tinderbox") || String(fragment.role || "").includes("log_bundle")), "Mining and Smithing Instructor should not inherit firemaking belt props");
  assertShouldersMeetTorsoTop(preset, "Mining and Smithing Instructor");

  ["left", "right"].forEach((side) => {
    const upperArm = catalogFragmentExtentY(preset, `${side}Arm`, "upper_arm");
    const lowerArm = catalogFragmentExtentY(preset, `${side}LowerArm`, "lower_arm");
    const hand = catalogFragmentExtentY(preset, `${side}LowerArm`, "hand");
    const upperLeg = catalogFragmentExtentY(preset, `${side}Leg`, "upper_leg");
    const lowerLeg = catalogFragmentExtentY(preset, `${side}LowerLeg`, "lower_leg");
    const boot = catalogFragmentExtentY(preset, `${side}LowerLeg`, "boot");

    assertVerticalContact(upperArm, lowerArm, `${side} mining and smithing elbow`);
    assertVerticalContact(lowerArm, hand, `${side} mining and smithing wrist`);
    assertVerticalContact(torso, upperLeg, `${side} mining and smithing hip`);
    assertVerticalContact(upperLeg, lowerLeg, `${side} mining and smithing knee`);
    assertVerticalContact(lowerLeg, boot, `${side} mining and smithing ankle`);
    assert(Math.abs(boot.bottom) <= 0.001, `${side} mining and smithing boot should land on the rig floor, bottom=${boot.bottom.toFixed(4)}`);
  });
}

function assertTutorialCombatInstructorHumanoidAssembly(preset) {
  assert(preset && preset.construction, "Combat Instructor preset should expose construction measurements");
  assert(preset.archetype === "yard_arms_trainer", "Combat Instructor preset should declare the yard arms trainer archetype");
  assert(preset.construction.minContactOverlap >= 0.02, "Combat Instructor joints should be built with explicit contact overlap");
  assert(Array.isArray(preset.fragments) && preset.fragments.length > 0, "Combat Instructor preset should contain fragments");

  const torso = catalogFragmentExtentY(preset, "torso", "torso_core");
  const neck = catalogFragmentExtentY(preset, "torso", "neck");
  const head = catalogFragmentExtentY(preset, "head", "head_core");
  const headCore = catalogFragment(preset, "head", "head_core");
  const shavedScalp = catalogFragment(preset, "head", "shaved_scalp");
  const leftEar = catalogFragment(preset, "head", "left_ear");
  const rightEar = catalogFragment(preset, "head", "right_ear");
  const leftEye = catalogFragment(preset, "head", "left_eye");
  const rightEye = catalogFragment(preset, "head", "right_eye");
  const leftBrow = catalogFragment(preset, "head", "left_brow");
  const rightBrow = catalogFragment(preset, "head", "right_brow");
  const noseBridge = catalogFragment(preset, "head", "nose_bridge");
  const mouth = catalogFragment(preset, "head", "mouth");
  const chinShadow = catalogFragment(preset, "head", "chin_shadow");
  const leftCheekShadow = catalogFragment(preset, "head", "left_cheek_shadow");
  const rightCheekShadow = catalogFragment(preset, "head", "right_cheek_shadow");
  const breastplate = catalogFragment(preset, "torso", "breastplate_front");
  const breastplateBack = catalogFragment(preset, "torso", "breastplate_back");
  const breastplateRidge = catalogFragment(preset, "torso", "breastplate_center_ridge");
  const gorget = catalogFragment(preset, "torso", "gorget");
  const capeBackPanel = catalogFragment(preset, "torso", "cape_back_panel");
  const capeLeftFold = catalogFragment(preset, "torso", "cape_left_fold");
  const capeRightFold = catalogFragment(preset, "torso", "cape_right_fold");
  const capeBottomShadow = catalogFragment(preset, "torso", "cape_bottom_shadow");
  const leftCapeClasp = catalogFragment(preset, "torso", "left_cape_clasp");
  const rightCapeClasp = catalogFragment(preset, "torso", "right_cape_clasp");
  const leftPauldron = catalogFragment(preset, "torso", "left_pauldron");
  const rightPauldron = catalogFragment(preset, "torso", "right_pauldron");
  const belt = catalogFragment(preset, "torso", "battle_belt");
  const buckle = catalogFragment(preset, "torso", "belt_buckle");
  const mailSkirt = catalogFragment(preset, "torso", "front_mail_skirt");
  const leftTasset = catalogFragment(preset, "torso", "left_waist_tasset");
  const rightTasset = catalogFragment(preset, "torso", "right_waist_tasset");
  const leftRerebrace = catalogFragment(preset, "leftArm", "left_rerebrace");
  const rightRerebrace = catalogFragment(preset, "rightArm", "right_rerebrace");
  const leftVambrace = catalogFragment(preset, "leftLowerArm", "left_vambrace");
  const rightVambrace = catalogFragment(preset, "rightLowerArm", "right_vambrace");
  const leftGauntlet = catalogFragment(preset, "leftLowerArm", "left_gauntlet_plate");
  const rightGauntlet = catalogFragment(preset, "rightLowerArm", "right_gauntlet_plate");
  const rightHand = catalogFragment(preset, "rightLowerArm", "hand");
  const heldSwordGrip = catalogFragment(preset, "axe", "right_hand_sword_grip");
  const heldSwordBlade = catalogFragment(preset, "axe", "right_hand_sword_blade");
  const heldSwordGuard = catalogFragment(preset, "axe", "right_hand_sword_guard");
  const heldSwordFuller = catalogFragment(preset, "axe", "right_hand_sword_fuller");
  const heldSwordPommel = catalogFragment(preset, "axe", "right_hand_sword_pommel");
  const shieldBackstrap = catalogFragment(preset, "leftLowerArm", "left_arm_shield_backstrap");
  const shieldFace = catalogFragment(preset, "leftLowerArm", "left_arm_shield_face");
  const shieldPlate = catalogFragment(preset, "leftLowerArm", "left_arm_shield_plate");
  const shieldBoss = catalogFragment(preset, "leftLowerArm", "left_arm_shield_boss");
  const wristCuff = catalogFragment(preset, "leftLowerArm", "cuff");
  const gloveHand = catalogFragment(preset, "leftLowerArm", "hand");

  assertVerticalContact(head, neck, "combat instructor neck/head");
  assert(headCore.rgbColor === "#c58c68", "Combat Instructor no-helmet variant should expose a skin-toned head");
  assert(shavedScalp.rgbColor === "#6e4d38" && shavedScalp.offset[1] > 0.18, "Combat Instructor no-helmet variant should include a close-cropped scalp");
  assert(leftEar.offset[0] > 0.25 && rightEar.offset[0] < -0.25, "Combat Instructor exposed head should include ears on both sides");
  assert(leftEye.rgbColor === "#121614" && rightEye.rgbColor === "#121614" && leftEye.offset[2] > 0.2 && rightEye.offset[2] > 0.2, "Combat Instructor exposed head should keep readable forward eyes");
  assert(leftBrow.rgbColor === "#2c211b" && rightBrow.rgbColor === "#2c211b", "Combat Instructor exposed head should keep stern dark brows");
  assert(noseBridge.offset[2] > 0.22 && mouth.offset[2] > 0.21, "Combat Instructor exposed face should have readable nose and mouth features");
  assert(chinShadow.rgbColor === "#9b654d" && leftCheekShadow.rgbColor === "#9b654d" && rightCheekShadow.rgbColor === "#9b654d", "Combat Instructor exposed head should include face shadow details");
  assert(breastplate.rgbColor === "#9aa5a2" && breastplate.size[0] >= 0.66 && breastplate.offset[2] > 0.23, "Combat Instructor should have an obvious steel breastplate front");
  assert(breastplateBack.target === "torso" && breastplateBack.offset[2] < -0.23, "Combat Instructor should have a back plate instead of only front armor");
  assert(breastplateRidge.rgbColor === "#c4ccca" && breastplateRidge.offset[2] > breastplate.offset[2], "Combat Instructor breastplate should have a raised center ridge");
  assert(gorget.target === "torso" && gorget.offset[1] > 0.28, "Combat Instructor armor should include a neck-protecting gorget");
  assert(capeBackPanel.target === "torso" && capeBackPanel.rgbColor === "#8a2f2a" && capeBackPanel.offset[2] < breastplateBack.offset[2] - 0.08, "Combat Instructor should wear a red cape behind the back armor");
  assert(capeLeftFold.offset[0] > 0.25 && capeRightFold.offset[0] < -0.25 && capeLeftFold.rgbColor === "#4f1f1c" && capeRightFold.rgbColor === "#4f1f1c", "Combat Instructor cape should have darker side folds");
  assert(capeBottomShadow.offset[1] < -0.5, "Combat Instructor cape should hang below the torso armor");
  assert(leftCapeClasp.rgbColor === "#b89545" && rightCapeClasp.rgbColor === "#b89545" && leftCapeClasp.offset[2] > breastplate.offset[2], "Combat Instructor cape should attach with visible front shoulder clasps");
  assert(leftPauldron.target === "torso" && rightPauldron.target === "torso", "Combat Instructor metal pauldrons should attach to the torso");
  assert(leftPauldron.size[0] >= 0.32 && rightPauldron.size[0] >= 0.32, "Combat Instructor pauldrons should be large enough to read as armor from the game camera");
  assert(belt.rgbColor === "#5b3b27" && buckle.rgbColor === "#a9793d", "Combat Instructor should keep a simple leather belt with a bronze buckle");
  assert(mailSkirt.target === "torso" && mailSkirt.offset[1] < -0.30, "Combat Instructor should include mail under the breastplate waist");
  assert(leftTasset.target === "torso" && rightTasset.target === "torso", "Combat Instructor should include waist tassets over the hips");
  assert(leftRerebrace.target === "leftArm" && rightRerebrace.target === "rightArm", "Combat Instructor upper arms should be armored with rerebraces");
  assert(leftVambrace.target === "leftLowerArm" && rightVambrace.target === "rightLowerArm", "Combat Instructor lower arms should be armored with vambraces");
  assert(leftGauntlet.target === "leftLowerArm" && rightGauntlet.target === "rightLowerArm", "Combat Instructor hands should read as armored gauntlets");
  assert(heldSwordGrip.target === "axe" && Math.abs(heldSwordGrip.offset[0]) <= 0.02 && heldSwordGrip.offset[1] > -0.08 && heldSwordGrip.offset[1] < 0, "Combat Instructor sword grip should be authored on the right-hand tool holder at the fist");
  assert(Array.isArray(heldSwordGrip.rotation) && heldSwordGrip.rotation[2] < 0 && Math.abs(heldSwordGrip.rotation[2]) < 0.3, "Combat Instructor sword grip should use a lowered harpoon-like side hold, not the old sideways pose");
  assert(heldSwordGuard.target === "axe" && heldSwordGuard.size[0] >= 0.20 && heldSwordGuard.offset[1] < heldSwordGrip.offset[1], "Combat Instructor held sword should have a readable guard just below the fist");
  assert(heldSwordBlade.target === "axe" && heldSwordBlade.size[1] >= 0.45 && heldSwordBlade.offset[1] < heldSwordGuard.offset[1] - 0.18, "Combat Instructor sword blade should drop from the right hand like the harpoon hold");
  assert(Math.abs(heldSwordBlade.offset[0] - heldSwordGrip.offset[0]) <= 0.08, "Combat Instructor sword blade should stay close to the hand instead of jutting sideways");
  assert(heldSwordFuller.offset[2] > heldSwordBlade.offset[2], "Combat Instructor sword should keep the fuller slightly forward of the blade");
  assert(heldSwordPommel.offset[1] > heldSwordGrip.offset[1] + 0.08, "Combat Instructor sword should include a pommel above the grip");
  assert(!preset.fragments.some((fragment) => String(fragment.role || "").startsWith("right_hand_sword") && fragment.target !== "axe"), "Combat Instructor sword fragments should live on the right-hand tool holder");
  assert(shieldBackstrap.target === "leftLowerArm" && shieldBackstrap.offset[0] > 0.10 && shieldBackstrap.offset[2] <= 0.08, "Combat Instructor shield strap should sit on the outside/back of the left forearm");
  assert(shieldFace.target === "leftLowerArm" && shieldFace.size[0] >= 0.32 && shieldFace.size[0] <= 0.38 && shieldFace.offset[0] > 0.20 && shieldFace.offset[2] <= 0.08, "Combat Instructor should carry a normal-sized shield on the outside of the left arm");
  assert(Array.isArray(shieldFace.rotation) && Math.abs(shieldFace.rotation[1] - 1.5708) < 0.001, "Combat Instructor shield face should be rotated perpendicular to the body");
  assert(shieldPlate.target === "leftLowerArm" && shieldPlate.offset[0] > shieldFace.offset[0], "Combat Instructor shield plate should sit farther outside than the shield face");
  assert(shieldBoss.target === "leftLowerArm" && shieldBoss.offset[0] > shieldPlate.offset[0], "Combat Instructor shield boss should be the outermost shield detail");
  assert(wristCuff.size[1] <= 0.05 && gloveHand.size[0] <= 0.16 && gloveHand.offset[2] <= 0.02, "Combat Instructor wrist and hand armor should stay compact to avoid forearm clipping");
  assert(leftVambrace.size[0] > gloveHand.size[0] && leftVambrace.size[2] > gloveHand.size[2], "Combat Instructor vambraces should cover the lower-arm silhouette around the gauntlet");
  assert(!preset.fragments.some((fragment) => {
    const role = String(fragment.role || "");
    return role.includes("tunic")
      || role.includes("shirt")
      || role.includes("plaid")
      || role.includes("vest")
      || role.includes("hair")
      || role.includes("helmet")
      || role.includes("stubble")
      || role.includes("moustache")
      || role.includes("beard")
      || role.includes("platebody")
      || role.includes("chainmail_hem")
      || role.includes("metal_bracer")
      || role.includes("belt_sword")
      || role.includes("back_quiver")
      || role.includes("back_arrow")
      || role.includes("back_bow");
  }), "Combat Instructor should be a dedicated armored preset without inherited clothing or back-ranged clutter");
  assert(!preset.fragments.some((fragment) => {
    const role = String(fragment.role || "");
    return role.includes("tinderbox") || role.includes("log_bundle") || role.includes("apron_");
  }), "Combat Instructor should not inherit firemaking apron or belt props");
  assertShouldersMeetTorsoTop(preset, "Combat Instructor");

  ["left", "right"].forEach((side) => {
    const upperArm = catalogFragmentExtentY(preset, `${side}Arm`, "upper_arm");
    const lowerArm = catalogFragmentExtentY(preset, `${side}LowerArm`, "lower_arm");
    const hand = catalogFragmentExtentY(preset, `${side}LowerArm`, "hand");
    const upperLeg = catalogFragmentExtentY(preset, `${side}Leg`, "upper_leg");
    const lowerLeg = catalogFragmentExtentY(preset, `${side}LowerLeg`, "lower_leg");
    const boot = catalogFragmentExtentY(preset, `${side}LowerLeg`, "boot");
    const bootFragment = catalogFragment(preset, `${side}LowerLeg`, "boot");
    const cuisse = catalogFragment(preset, `${side}Leg`, `${side}_cuisse`);
    const kneeGuard = catalogFragment(preset, `${side}LowerLeg`, `${side}_knee_guard`);
    const greave = catalogFragment(preset, `${side}LowerLeg`, `${side}_greave`);
    const sabaton = catalogFragment(preset, `${side}LowerLeg`, `${side}_sabaton_toe`);

    assertVerticalContact(upperArm, lowerArm, `${side} combat instructor elbow`);
    assertVerticalContact(lowerArm, hand, `${side} combat instructor wrist`);
    assertVerticalContact(torso, upperLeg, `${side} combat instructor hip`);
    assertVerticalContact(upperLeg, lowerLeg, `${side} combat instructor knee`);
    assertVerticalContact(lowerLeg, boot, `${side} combat instructor ankle`);
    assert(Math.abs(boot.bottom) <= 0.001, `${side} combat instructor boot should land on the rig floor, bottom=${boot.bottom.toFixed(4)}`);
    assert(cuisse.target === `${side}Leg` && cuisse.size[1] >= 0.30, `${side} combat instructor upper leg should have a readable cuisse`);
    assert(kneeGuard.target === `${side}LowerLeg` && kneeGuard.offset[1] > -0.02, `${side} combat instructor knee should have a raised knee guard`);
    assert(greave.target === `${side}LowerLeg` && greave.size[1] >= 0.24, `${side} combat instructor lower leg should have a greave`);
    assert(sabaton.target === `${side}LowerLeg` && sabaton.offset[2] > bootFragment.offset[2], `${side} combat instructor boot should have a forward sabaton toe`);
  });
}

function assertTutorialRunecraftingInstructorHumanoidAssembly(preset) {
  assert(preset && preset.label === "Runecrafting Instructor", "Runecrafting Instructor preset should keep its role label");
  assert(preset.archetype === "ember_altar_scribe", "Runecrafting Instructor should use the altar-scribe archetype");
  const hoodTop = catalogFragment(preset, "head", "runecrafter_hood_top");
  const hoodLeft = catalogFragment(preset, "head", "runecrafter_hood_left");
  const hoodRight = catalogFragment(preset, "head", "runecrafter_hood_right");
  const hoodBack = catalogFragment(preset, "head", "runecrafter_hood_back");
  const mantle = catalogFragment(preset, "torso", "runecrafter_shoulder_mantle");
  const tabard = catalogFragment(preset, "torso", "runecrafter_front_tabard");
  const tabardGlyph = catalogFragment(preset, "torso", "tabard_ember_glyph");
  const essencePouch = catalogFragment(preset, "torso", "essence_pouch");
  const runeTablet = catalogFragment(preset, "rightLowerArm", "rune_tablet");
  const tabletGlyph = catalogFragment(preset, "rightLowerArm", "tablet_ember_glyph");
  const stylus = catalogFragment(preset, "axe", "runecrafter_stylus");
  const stylusTip = catalogFragment(preset, "axe", "stylus_ember_tip");

  assert(hoodTop.size[0] > 0.5 && hoodTop.rgbColor === "#183447", "Runecrafting Instructor should have a broad dark hood top");
  assert(hoodLeft.offset[0] > 0.2 && hoodRight.offset[0] < -0.2 && hoodBack.offset[2] < -0.2, "Runecrafting Instructor hood should wrap the head instead of reading like guide hair");
  assert(mantle.size[0] > 0.7 && mantle.rgbColor === "#183447", "Runecrafting Instructor should have a distinct shoulder mantle");
  assert(tabard.offset[2] > 0.2 && tabard.rgbColor === "#315a6d", "Runecrafting Instructor should have a front rune tabard");
  assert(tabardGlyph.rgbColor === "#f0a04b" && tabardGlyph.offset[2] > tabard.offset[2], "Runecrafting Instructor tabard should carry a visible ember glyph");
  assert(essencePouch.rgbColor === "#6a5847" && essencePouch.offset[0] > 0.2, "Runecrafting Instructor should carry an essence pouch");
  assert(runeTablet.target === "rightLowerArm" && tabletGlyph.offset[2] > runeTablet.offset[2], "Runecrafting Instructor should hold a readable rune tablet");
  assert(stylus.target === "axe" && stylus.size[1] > 0.45, "Runecrafting Instructor should carry a stylus on the right-hand tool holder");
  assert(stylusTip.rgbColor === "#f0a04b" && stylusTip.offset[1] > stylus.offset[1], "Runecrafting Instructor stylus should have an ember tip");
}

function assertNpcCatalogPreviewActors(catalog) {
  assert(catalog && catalog.presets && typeof catalog.presets === "object", "NPC appearance catalog should expose presets");
  assert(Array.isArray(catalog.previewActors), "NPC appearance catalog should expose preview actors");

  const presetIds = Object.keys(catalog.presets);
  const seen = new Set();
  catalog.previewActors.forEach((entry) => {
    assert(entry && typeof entry === "object", "NPC preview actor entries should be objects");
    const actorId = typeof entry.actorId === "string" ? entry.actorId.trim() : "";
    const label = typeof entry.label === "string" ? entry.label.trim() : "";
    assert(actorId, "NPC preview actor entries should include actorId");
    assert(label, `NPC preview actor ${actorId || "<missing>"} should include a label`);
    assert(catalog.presets[actorId], `NPC preview actor ${actorId} should reference a catalog preset`);
    assert(!seen.has(actorId), `NPC preview actor ${actorId} should be listed once`);
    seen.add(actorId);
  });

  presetIds.forEach((presetId) => {
    assert(seen.has(presetId), `NPC catalog preset ${presetId} should be available in preview actors`);
  });
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "player-npc-humanoid-runtime.js");
  const catalogPath = path.join(root, "src", "js", "content", "npc-appearance-catalog.js");
  const runtimeSource = fs.readFileSync(runtimePath, "utf8");
  const catalogSource = fs.readFileSync(catalogPath, "utf8");
  const tutorialIsland = JSON.parse(fs.readFileSync(path.join(root, "content", "world", "regions", "tutorial_island.json"), "utf8"));
  const playerModelSource = fs.readFileSync(path.join(root, "src", "js", "player-model.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");

  const visualRuntimeIndex = manifestSource.indexOf('id: "player-model-visual-runtime"');
  const npcCatalogIndex = manifestSource.indexOf('id: "npc-appearance-catalog"');
  const npcRuntimeIndex = manifestSource.indexOf('id: "player-npc-humanoid-runtime"');
  const playerModelIndex = manifestSource.indexOf('id: "player-model"');

  assert(manifestSource.includes("../../js/content/npc-appearance-catalog.js?raw"), "legacy manifest should import the NPC appearance catalog raw script");
  assert(manifestSource.includes("../../js/player-npc-humanoid-runtime.js?raw"), "legacy manifest should import the player NPC humanoid runtime raw script");
  assert(visualRuntimeIndex !== -1 && npcCatalogIndex !== -1 && npcRuntimeIndex !== -1 && playerModelIndex !== -1, "legacy manifest should include NPC appearance catalog and humanoid runtime");
  assert(npcCatalogIndex < npcRuntimeIndex, "legacy manifest should load NPC appearance catalog before NPC humanoid runtime");
  assert(visualRuntimeIndex < npcRuntimeIndex && npcRuntimeIndex < playerModelIndex, "legacy manifest should load NPC humanoid runtime before player-model.js");

  assert(catalogSource.includes("window.NpcAppearanceCatalog"), "NPC appearance catalog should expose a window catalog");
  assert(catalogSource.includes("tutorial_guide"), "NPC appearance catalog should define the Tutorial Guide preset");
  assert(catalogSource.includes("tutorial_woodcutting_instructor"), "NPC appearance catalog should define the Woodcutting Instructor preset");
  assert(catalogSource.includes("tutorial_fishing_instructor"), "NPC appearance catalog should define the Fishing Instructor preset");
  assert(catalogSource.includes("tutorial_firemaking_instructor"), "NPC appearance catalog should define the Firemaking Instructor preset");
  assert(catalogSource.includes("tutorial_mining_smithing_instructor"), "NPC appearance catalog should define the Mining and Smithing Instructor preset");
  assert(catalogSource.includes("tutorial_combat_instructor"), "NPC appearance catalog should define the Combat Instructor preset");
  assert(catalogSource.includes("tutorial_ranged_instructor"), "NPC appearance catalog should define the Ranged Instructor preset");
  assert(catalogSource.includes("tutorial_magic_instructor"), "NPC appearance catalog should define the Magic Instructor preset");
  assert(catalogSource.includes("tutorial_runecrafting_instructor"), "NPC appearance catalog should define the Runecrafting Instructor preset");
  assert(catalogSource.includes("tutorial_crafting_instructor"), "NPC appearance catalog should define the Crafting Instructor preset");
  assert(catalogSource.includes("tutorial_bank_tutor"), "NPC appearance catalog should define the Bank Tutor preset");
  assert(runtimeSource.includes("window.PlayerNpcHumanoidRuntime"), "NPC humanoid runtime should expose a window runtime");
  assert(runtimeSource.includes("function resolveCatalogNpcHumanoidPresetId"), "NPC humanoid runtime should resolve catalog presets");
  assert(runtimeSource.includes("function createGuardHumanoidFragments"), "NPC humanoid runtime should own guard preset fragments");
  assert(runtimeSource.includes("function createTannerHumanoidFragments"), "NPC humanoid runtime should own tanner preset fragments");
  assert(runtimeSource.includes("function applyGuardRigBasePose"), "NPC humanoid runtime should own guard base pose");
  assert(runtimeSource.includes("function createNpcHumanoidRigFromPreset"), "NPC humanoid runtime should own NPC rig creation");
  assert(runtimeSource.includes("function publishNpcHumanoidHooks(options = {})"), "NPC humanoid runtime should own NPC humanoid hook publication");
  assert(runtimeSource.includes("appendPreviewActor(actors, seen, 'guard', 'Guard')"), "NPC humanoid runtime should own animation studio NPC preview actors");
  assert(runtimeSource.includes("normalizedPresetId === 'tanner'"), "NPC humanoid runtime should preserve the tanner alias");

  assert(playerModelSource.includes("function getPlayerNpcHumanoidRuntime()"), "player-model.js should resolve the NPC humanoid runtime");
  assert(playerModelSource.includes("PlayerNpcHumanoidRuntime missing"), "player-model.js should fail fast when NPC humanoid runtime is missing");
  assert(playerModelSource.includes("createNpcHumanoidRigFromPreset(buildPlayerNpcHumanoidRuntimeOptions()"), "player-model.js should delegate NPC rig creation");
  assert(playerModelSource.includes("createAnimationStudioPreviewRig(buildPlayerNpcHumanoidRuntimeOptions()"), "player-model.js should delegate animation studio NPC preview routing");
  assert(playerModelSource.includes("playerNpcHumanoidRuntimeForPublication.publishNpcHumanoidHooks({"), "player-model.js should publish NPC humanoid hooks through the NPC humanoid runtime");
  assert(!playerModelSource.includes("window.createNpcHumanoidRigFromPreset = createNpcHumanoidRigFromPreset"), "player-model.js should not directly publish createNpcHumanoidRigFromPreset");
  assert(!playerModelSource.includes("window.listAnimationStudioPreviewActors = listAnimationStudioPreviewActors"), "player-model.js should not directly publish listAnimationStudioPreviewActors");
  assert(!playerModelSource.includes("window.createAnimationStudioPreviewRig = createAnimationStudioPreviewRig"), "player-model.js should not directly publish createAnimationStudioPreviewRig");
  assert(!playerModelSource.includes("function createGuardHumanoidFragments"), "player-model.js should not own guard preset fragments");
  assert(!playerModelSource.includes("function createTannerHumanoidFragments"), "player-model.js should not own tanner preset fragments");
  assert(!playerModelSource.includes("function applyGuardRigBasePose"), "player-model.js should not own NPC base poses");
  assert(!playerModelSource.includes("const NPC_HUMANOID_RIG_CACHE"), "player-model.js should not own NPC rig template cache");

  const sandbox = { window: {}, Map, Math, Number, Object, String, Array, Set };
  vm.createContext(sandbox);
  vm.runInContext(catalogSource, sandbox, { filename: catalogPath });
  vm.runInContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.PlayerNpcHumanoidRuntime;
  assert(runtime, "NPC humanoid runtime should execute in isolation");
  assert(sandbox.window.NpcAppearanceCatalog, "NPC appearance catalog should execute in isolation");
  assertNpcCatalogPreviewActors(sandbox.window.NpcAppearanceCatalog);
  const tutorialAppearanceIds = Array.from(new Set((tutorialIsland.services || [])
    .filter((service) => service && typeof service.spawnId === "string" && service.spawnId.startsWith("npc:tutorial"))
    .map((service) => {
      assert(typeof service.appearanceId === "string" && service.appearanceId, `${service.spawnId} should declare a Tutorial Island appearance id`);
      return service.appearanceId;
    }))).sort();
  const previewActorIds = new Set(runtime.listAnimationStudioPreviewActors().map((entry) => entry.actorId));
  assert(tutorialAppearanceIds.length >= 11, "Tutorial Island should have custom appearance coverage for every tutor role");
  tutorialAppearanceIds.forEach((appearanceId) => {
    const preset = sandbox.window.NpcAppearanceCatalog.presets[appearanceId];
    assert(preset, `Tutorial Island appearance '${appearanceId}' should resolve to a catalog preset`);
    assert(Array.isArray(preset.fragments) && preset.fragments.length > 0, `Tutorial Island appearance '${appearanceId}' should define custom fragments`);
    assert(previewActorIds.has(appearanceId), `Tutorial Island appearance '${appearanceId}' should be available in animation preview actors`);
    assert(runtime.normalizeNpcHumanoidPresetId(appearanceId) === appearanceId, `runtime should normalize Tutorial Island appearance '${appearanceId}' to itself`);
    assert(runtime.createCatalogHumanoidFragments({ packJagexHsl: () => 64 }, preset).length > 0, `runtime should build fragments for Tutorial Island appearance '${appearanceId}'`);
  });
  assertTutorialGuideHumanoidAssembly(sandbox.window.NpcAppearanceCatalog.presets.tutorial_guide);
  assertTutorialWoodcuttingInstructorHumanoidAssembly(sandbox.window.NpcAppearanceCatalog.presets.tutorial_woodcutting_instructor);
  assertTutorialFishingInstructorHumanoidAssembly(sandbox.window.NpcAppearanceCatalog.presets.tutorial_fishing_instructor);
  assertTutorialFiremakingInstructorHumanoidAssembly(sandbox.window.NpcAppearanceCatalog.presets.tutorial_firemaking_instructor);
  assertTutorialMiningSmithingInstructorHumanoidAssembly(sandbox.window.NpcAppearanceCatalog.presets.tutorial_mining_smithing_instructor);
  assertTutorialCombatInstructorHumanoidAssembly(sandbox.window.NpcAppearanceCatalog.presets.tutorial_combat_instructor);
  assertTutorialRunecraftingInstructorHumanoidAssembly(sandbox.window.NpcAppearanceCatalog.presets.tutorial_runecrafting_instructor);
  assert(runtime.normalizeNpcHumanoidPresetId("tanner") === "tanner_rusk", "runtime should preserve tanner alias normalization");
  assert(runtime.normalizeNpcHumanoidPresetId("tutorial_guide") === "tutorial_guide", "runtime should resolve catalog-backed Tutorial Guide preset");
  assert(runtime.normalizeNpcHumanoidPresetId("tutorial_woodcutting_instructor") === "tutorial_woodcutting_instructor", "runtime should resolve catalog-backed Woodcutting Instructor preset");
  assert(runtime.normalizeNpcHumanoidPresetId("tutorial_fishing_instructor") === "tutorial_fishing_instructor", "runtime should resolve catalog-backed Fishing Instructor preset");
  assert(runtime.normalizeNpcHumanoidPresetId("tutorial_firemaking_instructor") === "tutorial_firemaking_instructor", "runtime should resolve catalog-backed Firemaking Instructor preset");
  assert(runtime.normalizeNpcHumanoidPresetId("tutorial_mining_smithing_instructor") === "tutorial_mining_smithing_instructor", "runtime should resolve catalog-backed Mining and Smithing Instructor preset");
  assert(runtime.normalizeNpcHumanoidPresetId("tutorial_combat_instructor") === "tutorial_combat_instructor", "runtime should resolve catalog-backed Combat Instructor preset");
  assert(runtime.normalizeNpcHumanoidPresetId("tutorial_runecrafting_instructor") === "tutorial_runecrafting_instructor", "runtime should resolve catalog-backed Runecrafting Instructor preset");
  assert(runtime.createGuardHumanoidFragments({ packJagexHsl: () => 64 }).length > 0, "runtime should build guard fragments");
  assert(runtime.createCatalogHumanoidFragments({ packJagexHsl: () => 64 }, sandbox.window.NpcAppearanceCatalog.presets.tutorial_guide).length > 0, "runtime should build catalog fragments");
  assert(runtime.createCatalogHumanoidFragments({ packJagexHsl: () => 64 }, sandbox.window.NpcAppearanceCatalog.presets.tutorial_woodcutting_instructor).length > 0, "runtime should build Woodcutting Instructor catalog fragments");
  assert(runtime.createCatalogHumanoidFragments({ packJagexHsl: () => 64 }, sandbox.window.NpcAppearanceCatalog.presets.tutorial_fishing_instructor).length > 0, "runtime should build Fishing Instructor catalog fragments");
  assert(runtime.createCatalogHumanoidFragments({ packJagexHsl: () => 64 }, sandbox.window.NpcAppearanceCatalog.presets.tutorial_firemaking_instructor).length > 0, "runtime should build Firemaking Instructor catalog fragments");
  assert(runtime.createCatalogHumanoidFragments({ packJagexHsl: () => 64 }, sandbox.window.NpcAppearanceCatalog.presets.tutorial_mining_smithing_instructor).length > 0, "runtime should build Mining and Smithing Instructor catalog fragments");
  assert(runtime.createCatalogHumanoidFragments({ packJagexHsl: () => 64 }, sandbox.window.NpcAppearanceCatalog.presets.tutorial_combat_instructor).length > 0, "runtime should build Combat Instructor catalog fragments");
  assert(runtime.createCatalogHumanoidFragments({ packJagexHsl: () => 64 }, sandbox.window.NpcAppearanceCatalog.presets.tutorial_runecrafting_instructor).length > 0, "runtime should build Runecrafting Instructor catalog fragments");
  assert(runtime.listAnimationStudioPreviewActors().some((entry) => entry.actorId === "guard"), "runtime should list guard preview actor");
  assert(runtime.listAnimationStudioPreviewActors().some((entry) => entry.actorId === "tutorial_guide"), "runtime should list Tutorial Guide preview actor");
  assert(runtime.listAnimationStudioPreviewActors().some((entry) => entry.actorId === "tutorial_woodcutting_instructor"), "runtime should list Woodcutting Instructor preview actor");
  assert(runtime.listAnimationStudioPreviewActors().some((entry) => entry.actorId === "tutorial_fishing_instructor"), "runtime should list Fishing Instructor preview actor");
  assert(runtime.listAnimationStudioPreviewActors().some((entry) => entry.actorId === "tutorial_firemaking_instructor"), "runtime should list Firemaking Instructor preview actor");
  assert(runtime.listAnimationStudioPreviewActors().some((entry) => entry.actorId === "tutorial_mining_smithing_instructor"), "runtime should list Mining and Smithing Instructor preview actor");
  assert(runtime.listAnimationStudioPreviewActors().some((entry) => entry.actorId === "tutorial_combat_instructor"), "runtime should list Combat Instructor preview actor");
  assert(runtime.listAnimationStudioPreviewActors().some((entry) => entry.actorId === "tutorial_runecrafting_instructor"), "runtime should list Runecrafting Instructor preview actor");

  const publishedWindow = {};
  const createNpcHumanoidRigFromPreset = () => ({ npc: true });
  const listAnimationStudioPreviewActors = () => [];
  const createAnimationStudioPreviewRig = () => ({ preview: true });
  runtime.publishNpcHumanoidHooks({
    windowRef: publishedWindow,
    createNpcHumanoidRigFromPreset,
    listAnimationStudioPreviewActors,
    createAnimationStudioPreviewRig
  });
  assert(publishedWindow.createNpcHumanoidRigFromPreset === createNpcHumanoidRigFromPreset, "NPC hook publication should expose NPC rig creation");
  assert(publishedWindow.listAnimationStudioPreviewActors === listAnimationStudioPreviewActors, "NPC hook publication should expose preview actor listing");
  assert(publishedWindow.createAnimationStudioPreviewRig === createAnimationStudioPreviewRig, "NPC hook publication should expose preview rig creation");

  const added = [];
  const options = {
    packJagexHsl: () => 64,
    createRigBones: () => makeRig(),
    rigNodeMap: (rig) => rig.nodes,
    addFragmentsToRig: (_rig, fragments) => added.push(fragments.length),
    bindRigUserData: (rig) => {
      rig.userData.bound = true;
      return rig;
    },
    createPlayerRigForAnimationStudio: () => ({ playerPreview: true })
  };
  const template = runtime.buildNpcHumanoidRigTemplate(options, "guard");
  assert(template && template.userData.npcPresetId === "guard", "runtime should build guard NPC templates");
  assert(template.nodes.axe.visible === false && template.nodes.leftTool.visible === false, "runtime should hide base tool anchors on NPC templates");
  assert(added.length === 1 && added[0] > 0, "runtime should attach NPC fragments through the player-model callback");
  const guideTemplate = runtime.buildNpcHumanoidRigTemplate(options, "tutorial_guide");
  assert(guideTemplate && guideTemplate.userData.npcPresetId === "tutorial_guide", "runtime should build catalog-backed Tutorial Guide templates");
  assert(added.length === 2 && added[1] > 0, "runtime should attach catalog NPC fragments through the player-model callback");
  const woodcuttingTemplate = runtime.buildNpcHumanoidRigTemplate(options, "tutorial_woodcutting_instructor");
  assert(woodcuttingTemplate && woodcuttingTemplate.userData.npcPresetId === "tutorial_woodcutting_instructor", "runtime should build catalog-backed Woodcutting Instructor templates");
  assert(added.length === 3 && added[2] > 0, "runtime should attach Woodcutting Instructor catalog fragments through the player-model callback");
  const fishingTemplate = runtime.buildNpcHumanoidRigTemplate(options, "tutorial_fishing_instructor");
  assert(fishingTemplate && fishingTemplate.userData.npcPresetId === "tutorial_fishing_instructor", "runtime should build catalog-backed Fishing Instructor templates");
  assert(added.length === 4 && added[3] > 0, "runtime should attach Fishing Instructor catalog fragments through the player-model callback");
  const firemakingTemplate = runtime.buildNpcHumanoidRigTemplate(options, "tutorial_firemaking_instructor");
  assert(firemakingTemplate && firemakingTemplate.userData.npcPresetId === "tutorial_firemaking_instructor", "runtime should build catalog-backed Firemaking Instructor templates");
  assert(added.length === 5 && added[4] > 0, "runtime should attach Firemaking Instructor catalog fragments through the player-model callback");
  const miningSmithingTemplate = runtime.buildNpcHumanoidRigTemplate(options, "tutorial_mining_smithing_instructor");
  assert(miningSmithingTemplate && miningSmithingTemplate.userData.npcPresetId === "tutorial_mining_smithing_instructor", "runtime should build catalog-backed Mining and Smithing Instructor templates");
  assert(added.length === 6 && added[5] > 0, "runtime should attach Mining and Smithing Instructor catalog fragments through the player-model callback");
  const combatInstructorTemplate = runtime.buildNpcHumanoidRigTemplate(options, "tutorial_combat_instructor");
  assert(combatInstructorTemplate && combatInstructorTemplate.userData.npcPresetId === "tutorial_combat_instructor", "runtime should build catalog-backed Combat Instructor templates");
  assert(added.length === 7 && added[6] > 0, "runtime should attach Combat Instructor catalog fragments through the player-model callback");
  const templateCountBeforeTutorialAudit = added.length;
  tutorialAppearanceIds.forEach((appearanceId) => {
    const tutorialTemplate = runtime.buildNpcHumanoidRigTemplate(options, appearanceId);
    assert(tutorialTemplate && tutorialTemplate.userData.npcPresetId === appearanceId, `runtime should build catalog-backed Tutorial Island template '${appearanceId}'`);
  });
  assert(added.length === templateCountBeforeTutorialAudit + tutorialAppearanceIds.length, "runtime should attach fragments for every Tutorial Island NPC appearance");
  const rig = runtime.createNpcHumanoidRigFromPreset(options, "tanner");
  assert(rig && rig.userData.bound === true && rig.userData.npcPresetId === "tanner_rusk", "runtime should create bound NPC rig clones");
  const playerPreview = runtime.createAnimationStudioPreviewRig(options, "player");
  assert(playerPreview && playerPreview.playerPreview === true, "runtime should fall back to the player preview rig");

  console.log("Player NPC humanoid runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
