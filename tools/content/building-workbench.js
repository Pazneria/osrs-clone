const fs = require("fs");
const path = require("path");

const { readJsonFile: readJson, writeJsonFile } = require("../lib/json-file-utils");

const ROOT = path.resolve(__dirname, "..", "..");
const WORKBENCH_RELATIVE_DIR = path.join("content", "world", "building-workbench");
const DEFAULT_OUT_DIR = path.join(ROOT, "tmp", "world-building-workbench");
const ID_PATTERN = /^[a-z][a-z0-9_]*$/;
const SERVICE_ID_PATTERN = /^[a-z][a-z0-9_]*:[a-z][a-z0-9_]*$/;
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const ALLOWED_STAMP_CHARS = new Set(" CWFLTsSUDP EBNKQ$VfgG".split(""));
const WALKABLE_STAMP_CHARS = new Set(["F", "L", "T", "s", "S", "U", "D", "P", "E"]);
const BLOCKING_STAMP_CHARS = new Set(["W", "C", "B", "N", "K", "Q", "$", "V", "f", "g"]);
const ALLOWED_DECOR_KINDS = new Set([
  "desk",
  "crate",
  "tool_rack",
  "notice_board",
  "chopping_block",
  "woodpile",
  "ore_pile",
  "coal_bin",
  "barrel",
  "weapon_rack",
  "training_dummy",
  "archery_target",
  "bank_sign",
  "shop_sign",
  "market_awning",
  "wall_painting",
  "castle_banner",
  "rubble_pile",
  "quarry_cart",
  "thatch_bundle"
]);
const CARDINAL_FACINGS = new Set(["north", "east", "south", "west"]);
const WALL_ART_SURFACES = new Set(["north", "east", "south", "west"]);

function listJsonFiles(absDir) {
  if (!fs.existsSync(absDir)) return [];
  return fs.readdirSync(absDir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => path.join(absDir, name));
}

function loadCollection(root, folderName) {
  const dir = path.join(root, WORKBENCH_RELATIVE_DIR, folderName);
  return listJsonFiles(dir).map((absPath) => ({
    absPath,
    fileName: path.basename(absPath),
    spec: readJson(absPath)
  }));
}

function loadWorkbench(root = ROOT) {
  return {
    root,
    rootDir: path.join(root, WORKBENCH_RELATIVE_DIR),
    archetypes: loadCollection(root, "archetypes"),
    materials: loadCollection(root, "materials"),
    conditions: loadCollection(root, "conditions"),
    roadProfiles: loadCollection(root, "road-profiles"),
    themes: loadCollection(root, "themes"),
    buildings: loadCollection(root, "buildings"),
    settlements: loadCollection(root, "settlements")
  };
}

function pushError(errors, condition, message) {
  if (!condition) errors.push(message);
}

function validateId(errors, value, label, pattern = ID_PATTERN) {
  pushError(errors, typeof value === "string" && pattern.test(value), `${label} must be lowercase snake_case`);
}

function indexById(entries, idField, label, errors) {
  const result = new Map();
  entries.forEach((entry) => {
    const spec = entry.spec || {};
    const id = spec[idField];
    validateId(errors, id, `${label} ${entry.fileName} ${idField}`);
    if (!id) return;
    pushError(errors, !result.has(id), `Duplicate ${label} id ${id}`);
    result.set(id, entry);
    const expectedFile = `${id}.json`;
    pushError(errors, entry.fileName === expectedFile, `${label} ${id} should live in ${expectedFile}`);
  });
  return result;
}

function getCanonicalStampIds(root) {
  const stampsDir = path.join(root, "content", "world", "stamps");
  return new Set(listJsonFiles(stampsDir).map((absPath) => path.basename(absPath, ".json")));
}

function getCanonicalStamps(root) {
  const stampsDir = path.join(root, "content", "world", "stamps");
  const stamps = new Map();
  listJsonFiles(stampsDir).forEach((absPath) => {
    const stamp = readJson(absPath);
    if (stamp && typeof stamp.stampId === "string") stamps.set(stamp.stampId, stamp);
  });
  return stamps;
}

function toRepoRelative(root, absPath) {
  return path.relative(root, absPath).replace(/\\/g, "/");
}

function getManifestWorldIds(root) {
  const manifestPath = path.join(root, "content", "world", "manifest.json");
  const manifest = readJson(manifestPath);
  return new Set((Array.isArray(manifest.worlds) ? manifest.worlds : []).map((entry) => entry.worldId));
}

function getManifestWorld(root, worldId) {
  const manifestPath = path.join(root, "content", "world", "manifest.json");
  const manifest = readJson(manifestPath);
  const world = (Array.isArray(manifest.worlds) ? manifest.worlds : []).find((entry) => entry.worldId === worldId);
  if (!world) throw new Error(`Unknown canonical world ${worldId}`);
  if (typeof world.regionFile !== "string" || !world.regionFile.endsWith(".json")) {
    throw new Error(`Canonical world ${worldId} is missing a regionFile`);
  }
  const regionPath = path.join(root, "content", "world", "regions", world.regionFile);
  if (!fs.existsSync(regionPath)) throw new Error(`Missing canonical region file ${toRepoRelative(root, regionPath)}`);
  return {
    manifest,
    manifestPath,
    region: readJson(regionPath),
    regionPath,
    world
  };
}

function getRows(building) {
  return building && building.plan && Array.isArray(building.plan.rows) ? building.plan.rows : [];
}

function getDimensions(building) {
  const rows = getRows(building);
  const width = rows.length ? rows[0].length : 0;
  return { width, height: rows.length };
}

function validateStringArray(errors, value, label, minLength = 1) {
  pushError(errors, Array.isArray(value), `${label} must be an array`);
  if (!Array.isArray(value)) return;
  pushError(errors, value.length >= minLength, `${label} must include at least ${minLength} value(s)`);
  value.forEach((entry, index) => {
    pushError(errors, typeof entry === "string" && entry.trim().length > 0, `${label}[${index}] must be a nonempty string`);
  });
}

function validateHexColor(errors, value, label) {
  pushError(errors, typeof value === "string" && HEX_COLOR_PATTERN.test(value), `${label} must be a #rrggbb color`);
}

function validateArchetype(entry, errors) {
  const archetype = entry.spec || {};
  pushError(errors, archetype.schemaVersion === 1, `Archetype ${entry.fileName} must use schemaVersion 1`);
  pushError(errors, typeof archetype.label === "string" && archetype.label.trim().length > 0, `Archetype ${archetype.archetypeId || entry.fileName} needs a label`);
  validateStringArray(errors, archetype.categories, `Archetype ${archetype.archetypeId || entry.fileName} categories`);
  validateStringArray(errors, archetype.footprintTags, `Archetype ${archetype.archetypeId || entry.fileName} footprintTags`);
  validateStringArray(errors, archetype.typicalRoles, `Archetype ${archetype.archetypeId || entry.fileName} typicalRoles`);
  validateStringArray(errors, archetype.promotionHints, `Archetype ${archetype.archetypeId || entry.fileName} promotionHints`);
}

function validateMaterial(entry, themeById, errors) {
  const material = entry.spec || {};
  pushError(errors, material.schemaVersion === 1, `Material ${entry.fileName} must use schemaVersion 1`);
  pushError(errors, typeof material.label === "string" && material.label.trim().length > 0, `Material ${material.materialProfileId || entry.fileName} needs a label`);
  validateId(errors, material.themeId, `Material ${material.materialProfileId || entry.fileName} themeId`);
  pushError(errors, themeById.has(material.themeId), `Material ${material.materialProfileId || entry.fileName} references unknown theme ${material.themeId}`);
  pushError(errors, typeof material.family === "string" && material.family.trim().length > 0, `Material ${material.materialProfileId || entry.fileName} needs family`);
  const palette = material.previewPalette || {};
  ["ground", "floor", "wall", "corner", "roof", "roofDark", "accent"].forEach((key) => {
    validateHexColor(errors, palette[key], `Material ${material.materialProfileId || entry.fileName} previewPalette.${key}`);
  });
  validateStringArray(errors, material.tags, `Material ${material.materialProfileId || entry.fileName} tags`);
  validateStringArray(errors, material.promotionNotes, `Material ${material.materialProfileId || entry.fileName} promotionNotes`);
}

function validateCondition(entry, errors) {
  const condition = entry.spec || {};
  pushError(errors, condition.schemaVersion === 1, `Condition ${entry.fileName} must use schemaVersion 1`);
  pushError(errors, typeof condition.label === "string" && condition.label.trim().length > 0, `Condition ${condition.conditionId || entry.fileName} needs a label`);
  pushError(errors, Number.isFinite(condition.damageLevel) && condition.damageLevel >= 0 && condition.damageLevel <= 1, `Condition ${condition.conditionId || entry.fileName} damageLevel must be 0..1`);
  pushError(errors, Number.isFinite(condition.wallHeightScale) && condition.wallHeightScale > 0 && condition.wallHeightScale <= 1.25, `Condition ${condition.conditionId || entry.fileName} wallHeightScale must be > 0 and <= 1.25`);
  pushError(errors, Number.isFinite(condition.roofIntegrity) && condition.roofIntegrity >= 0 && condition.roofIntegrity <= 1, `Condition ${condition.conditionId || entry.fileName} roofIntegrity must be 0..1`);
  validateHexColor(errors, condition.tint, `Condition ${condition.conditionId || entry.fileName} tint`);
  validateStringArray(errors, condition.tags, `Condition ${condition.conditionId || entry.fileName} tags`);
  validateStringArray(errors, condition.promotionNotes, `Condition ${condition.conditionId || entry.fileName} promotionNotes`);
}

function validateRoadProfile(entry, errors) {
  const profile = entry.spec || {};
  pushError(errors, profile.schemaVersion === 1, `Road profile ${entry.fileName} must use schemaVersion 1`);
  pushError(errors, typeof profile.label === "string" && profile.label.trim().length > 0, `Road profile ${profile.roadProfileId || entry.fileName} needs a label`);
  pushError(errors, profile.tileId === "DIRT", `Road profile ${profile.roadProfileId || entry.fileName} should use DIRT tileId until road tile promotion broadens`);
  pushError(errors, Number.isFinite(profile.defaultPathWidth) && profile.defaultPathWidth > 0, `Road profile ${profile.roadProfileId || entry.fileName} needs positive defaultPathWidth`);
  validateHexColor(errors, profile.previewColor, `Road profile ${profile.roadProfileId || entry.fileName} previewColor`);
  validateStringArray(errors, profile.tags, `Road profile ${profile.roadProfileId || entry.fileName} tags`);
  validateStringArray(errors, profile.promotionNotes, `Road profile ${profile.roadProfileId || entry.fileName} promotionNotes`);
}

function validateTheme(entry, errors) {
  const theme = entry.spec || {};
  pushError(errors, theme.schemaVersion === 1, `Theme ${entry.fileName} must use schemaVersion 1`);
  pushError(errors, typeof theme.label === "string" && theme.label.trim().length > 0, `Theme ${theme.themeId || entry.fileName} needs a label`);
  pushError(errors, Array.isArray(theme.settlementUse) && theme.settlementUse.length > 0, `Theme ${theme.themeId || entry.fileName} needs settlementUse entries`);
  const palette = theme.materialPalette;
  pushError(errors, palette && typeof palette === "object" && !Array.isArray(palette), `Theme ${theme.themeId || entry.fileName} needs materialPalette`);
  ["wall", "floor", "roof"].forEach((key) => {
    pushError(errors, palette && typeof palette[key] === "string" && palette[key].trim().length > 0, `Theme ${theme.themeId || entry.fileName} needs materialPalette.${key}`);
  });
  (Array.isArray(theme.decorKinds) ? theme.decorKinds : []).forEach((kind) => {
    pushError(errors, ALLOWED_DECOR_KINDS.has(kind), `Theme ${theme.themeId || entry.fileName} uses unsupported decor kind ${kind}`);
  });
}

function validateRows(building, errors) {
  const rows = getRows(building);
  pushError(errors, rows.length > 0, `Building ${building.buildingId} needs plan.rows`);
  const width = rows.length ? rows[0].length : 0;
  let walkableCount = 0;
  rows.forEach((row, y) => {
    pushError(errors, typeof row === "string" && row.length > 0, `Building ${building.buildingId} row ${y} must be a nonempty string`);
    pushError(errors, row.length === width, `Building ${building.buildingId} row ${y} must match width ${width}`);
    for (let x = 0; x < row.length; x += 1) {
      const char = row[x];
      pushError(errors, ALLOWED_STAMP_CHARS.has(char), `Building ${building.buildingId} has unsupported stamp char ${char} at ${x},${y}`);
      if (WALKABLE_STAMP_CHARS.has(char)) walkableCount += 1;
    }
  });
  pushError(errors, walkableCount > 0, `Building ${building.buildingId} needs at least one walkable stamp tile`);
}

function validatePointInRows(errors, building, point, label) {
  const { width, height } = getDimensions(building);
  pushError(errors, Number.isInteger(point.x) && point.x >= 0 && point.x < width, `${label} x is outside ${building.buildingId}`);
  pushError(errors, Number.isInteger(point.y) && point.y >= 0 && point.y < height, `${label} y is outside ${building.buildingId}`);
}

function rowsEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function validateBuilding(entry, themeById, archetypeById, materialById, conditionById, canonicalStamps, errors) {
  const building = entry.spec || {};
  pushError(errors, building.schemaVersion === 1, `Building ${entry.fileName} must use schemaVersion 1`);
  validateId(errors, building.buildingId, `Building ${entry.fileName} buildingId`);
  pushError(errors, typeof building.label === "string" && building.label.trim().length > 0, `Building ${building.buildingId || entry.fileName} needs a label`);
  pushError(errors, typeof building.category === "string" && building.category.trim().length > 0, `Building ${building.buildingId || entry.fileName} needs a category`);
  validateId(errors, building.archetypeId, `Building ${building.buildingId || entry.fileName} archetypeId`);
  pushError(errors, archetypeById.has(building.archetypeId), `Building ${building.buildingId || entry.fileName} references unknown archetype ${building.archetypeId}`);
  validateId(errors, building.themeId, `Building ${building.buildingId || entry.fileName} themeId`);
  pushError(errors, themeById.has(building.themeId), `Building ${building.buildingId || entry.fileName} references unknown theme ${building.themeId}`);
  validateId(errors, building.materialProfileId, `Building ${building.buildingId || entry.fileName} materialProfileId`);
  const materialEntry = materialById.get(building.materialProfileId);
  pushError(errors, !!materialEntry, `Building ${building.buildingId || entry.fileName} references unknown material profile ${building.materialProfileId}`);
  if (materialEntry) {
    pushError(errors, materialEntry.spec.themeId === building.themeId, `Building ${building.buildingId || entry.fileName} material profile theme must match themeId ${building.themeId}`);
  }
  validateId(errors, building.conditionId, `Building ${building.buildingId || entry.fileName} conditionId`);
  pushError(errors, conditionById.has(building.conditionId), `Building ${building.buildingId || entry.fileName} references unknown condition ${building.conditionId}`);
  pushError(errors, Array.isArray(building.variantTags) && building.variantTags.length > 0, `Building ${building.buildingId || entry.fileName} needs variantTags`);
  validateRows(building, errors);

  const entrances = Array.isArray(building.entrances) ? building.entrances : [];
  pushError(errors, entrances.length > 0, `Building ${building.buildingId || entry.fileName} needs at least one entrance`);
  const entranceIds = new Set();
  entrances.forEach((entrance) => {
    validateId(errors, entrance && entrance.id, `Building ${building.buildingId} entrance id`);
    pushError(errors, !entranceIds.has(entrance.id), `Building ${building.buildingId} duplicate entrance ${entrance.id}`);
    entranceIds.add(entrance.id);
    validatePointInRows(errors, building, entrance, `Building ${building.buildingId} entrance ${entrance.id}`);
    pushError(errors, CARDINAL_FACINGS.has(String(entrance.facing || "")), `Building ${building.buildingId} entrance ${entrance.id} needs cardinal facing`);
    const rows = getRows(building);
    if (rows[entrance.y] && Number.isInteger(entrance.x)) {
      const char = rows[entrance.y][entrance.x];
      pushError(errors, !BLOCKING_STAMP_CHARS.has(char), `Building ${building.buildingId} entrance ${entrance.id} is on blocking char ${char}`);
    }
    if (entrance.approach) validatePointInRows(errors, building, entrance.approach, `Building ${building.buildingId} entrance ${entrance.id} approach`);
  });

  if (building.roof) {
    pushError(errors, building.roof.ridgeAxis === "x" || building.roof.ridgeAxis === "y", `Building ${building.buildingId} roof.ridgeAxis must be x or y`);
    pushError(errors, Number.isFinite(building.roof.height) && building.roof.height > 0, `Building ${building.buildingId} roof.height must be positive`);
    if (building.roof.hideWhenPlayerInside !== undefined) {
      pushError(errors, typeof building.roof.hideWhenPlayerInside === "boolean", `Building ${building.buildingId} roof.hideWhenPlayerInside must be boolean`);
    }
  }

  const decorIds = new Set();
  (Array.isArray(building.decor) ? building.decor : []).forEach((decor) => {
    validateId(errors, decor && decor.id, `Building ${building.buildingId} decor id`);
    pushError(errors, !decorIds.has(decor.id), `Building ${building.buildingId} duplicate decor ${decor.id}`);
    decorIds.add(decor.id);
    pushError(errors, ALLOWED_DECOR_KINDS.has(decor.kind), `Building ${building.buildingId} decor ${decor.id} has unsupported kind ${decor.kind}`);
    validatePointInRows(errors, building, decor, `Building ${building.buildingId} decor ${decor.id}`);
    if (decor.facingYaw !== undefined) pushError(errors, Number.isFinite(decor.facingYaw), `Building ${building.buildingId} decor ${decor.id} facingYaw must be finite`);
    if (decor.blocksMovement !== undefined) pushError(errors, typeof decor.blocksMovement === "boolean", `Building ${building.buildingId} decor ${decor.id} blocksMovement must be boolean`);
  });

  const artIds = new Set();
  (Array.isArray(building.wallArt) ? building.wallArt : []).forEach((art) => {
    validateId(errors, art && art.id, `Building ${building.buildingId} wallArt id`);
    pushError(errors, !artIds.has(art.id), `Building ${building.buildingId} duplicate wallArt ${art.id}`);
    artIds.add(art.id);
    pushError(errors, WALL_ART_SURFACES.has(String(art.surface || "")), `Building ${building.buildingId} wallArt ${art.id} needs cardinal surface`);
    validatePointInRows(errors, building, art, `Building ${building.buildingId} wallArt ${art.id}`);
    pushError(errors, typeof art.motif === "string" && art.motif.trim().length > 0, `Building ${building.buildingId} wallArt ${art.id} needs motif`);
  });

  const promotion = building.promotion || {};
  validateId(errors, promotion.stampId, `Building ${building.buildingId || entry.fileName} promotion.stampId`);
  pushError(errors, typeof promotion.stampId === "string" && promotion.stampId.startsWith("bw_"), `Building ${building.buildingId || entry.fileName} promotion.stampId should start with bw_`);
  pushError(errors, typeof promotion.structureLabel === "string" && promotion.structureLabel.trim().length > 0, `Building ${building.buildingId || entry.fileName} promotion needs structureLabel`);
  const canonicalStamp = canonicalStamps.get(promotion.stampId);
  if (canonicalStamp) {
    pushError(errors, canonicalStamp.label === promotion.structureLabel, `Building ${building.buildingId || entry.fileName} promoted stamp ${promotion.stampId} label differs from draft`);
    pushError(errors, rowsEqual(canonicalStamp.rows, getRows(building)), `Building ${building.buildingId || entry.fileName} promoted stamp ${promotion.stampId} rows differ from draft`);
  }
}

function rectanglesOverlap(a, b) {
  return a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y;
}

function validateSettlement(entry, themeById, buildingById, roadProfileById, worldIds, errors) {
  const settlement = entry.spec || {};
  pushError(errors, settlement.schemaVersion === 1, `Settlement ${entry.fileName} must use schemaVersion 1`);
  validateId(errors, settlement.settlementId, `Settlement ${entry.fileName} settlementId`);
  pushError(errors, typeof settlement.label === "string" && settlement.label.trim().length > 0, `Settlement ${settlement.settlementId || entry.fileName} needs a label`);
  pushError(errors, worldIds.has(settlement.worldId), `Settlement ${settlement.settlementId || entry.fileName} references unknown world ${settlement.worldId}`);
  pushError(errors, settlement.status === "draft", `Settlement ${settlement.settlementId || entry.fileName} must stay status draft until promoted`);
  pushError(errors, settlement.placementMode === "preview_only", `Settlement ${settlement.settlementId || entry.fileName} must stay placementMode preview_only`);
  const themeMix = Array.isArray(settlement.themeMix) ? settlement.themeMix : [];
  pushError(errors, themeMix.length > 0, `Settlement ${settlement.settlementId || entry.fileName} needs themeMix`);
  if (settlement.kind !== "outpost") pushError(errors, themeMix.length >= 2, `Settlement ${settlement.settlementId || entry.fileName} should mix at least two themes`);
  themeMix.forEach((themeId) => {
    pushError(errors, themeById.has(themeId), `Settlement ${settlement.settlementId || entry.fileName} references unknown theme ${themeId}`);
  });
  const bounds = settlement.anchorBounds || {};
  ["xMin", "yMin", "xMax", "yMax"].forEach((key) => {
    pushError(errors, Number.isFinite(bounds[key]), `Settlement ${settlement.settlementId || entry.fileName} anchorBounds.${key} must be finite`);
  });
  if (Number.isFinite(bounds.xMin) && Number.isFinite(bounds.xMax)) pushError(errors, bounds.xMin < bounds.xMax, `Settlement ${settlement.settlementId || entry.fileName} anchorBounds x range is invalid`);
  if (Number.isFinite(bounds.yMin) && Number.isFinite(bounds.yMax)) pushError(errors, bounds.yMin < bounds.yMax, `Settlement ${settlement.settlementId || entry.fileName} anchorBounds y range is invalid`);

  const placementIds = new Set();
  const placementRects = [];
  const placements = Array.isArray(settlement.placements) ? settlement.placements : [];
  pushError(errors, placements.length > 0, `Settlement ${settlement.settlementId || entry.fileName} needs placements`);
  placements.forEach((placement) => {
    validateId(errors, placement && placement.structureId, `Settlement ${settlement.settlementId} placement structureId`);
    pushError(errors, !placementIds.has(placement.structureId), `Settlement ${settlement.settlementId} duplicate placement ${placement.structureId}`);
    placementIds.add(placement.structureId);
    validateId(errors, placement && placement.buildingId, `Settlement ${settlement.settlementId} placement buildingId`);
    const buildingEntry = buildingById.get(placement.buildingId);
    pushError(errors, !!buildingEntry, `Settlement ${settlement.settlementId} references unknown building ${placement.buildingId}`);
    pushError(errors, Number.isInteger(placement.x), `Settlement ${settlement.settlementId} placement ${placement.structureId} x must be integer`);
    pushError(errors, Number.isInteger(placement.y), `Settlement ${settlement.settlementId} placement ${placement.structureId} y must be integer`);
    pushError(errors, Number.isInteger(placement.z), `Settlement ${settlement.settlementId} placement ${placement.structureId} z must be integer`);
    pushError(errors, typeof placement.role === "string" && placement.role.trim().length > 0, `Settlement ${settlement.settlementId} placement ${placement.structureId} needs role`);
    if (buildingEntry && Number.isFinite(bounds.xMin)) {
      const dims = getDimensions(buildingEntry.spec);
      const rect = { id: placement.structureId, x: placement.x, y: placement.y, width: dims.width, height: dims.height };
      pushError(errors, rect.x >= bounds.xMin && rect.y >= bounds.yMin && rect.x + rect.width <= bounds.xMax && rect.y + rect.height <= bounds.yMax, `Settlement ${settlement.settlementId} placement ${placement.structureId} is outside anchorBounds`);
      placementRects.forEach((other) => {
        pushError(errors, !rectanglesOverlap(rect, other), `Settlement ${settlement.settlementId} placements ${placement.structureId} and ${other.id} overlap`);
      });
      placementRects.push(rect);
    }
  });

  const roadIds = new Set();
  (Array.isArray(settlement.roads) ? settlement.roads : []).forEach((road) => {
    validateId(errors, road && road.pathId, `Settlement ${settlement.settlementId} road pathId`);
    pushError(errors, !roadIds.has(road.pathId), `Settlement ${settlement.settlementId} duplicate road ${road.pathId}`);
    roadIds.add(road.pathId);
    validateId(errors, road && road.roadProfileId, `Settlement ${settlement.settlementId} road ${road.pathId} roadProfileId`);
    const roadProfile = roadProfileById.get(road.roadProfileId);
    pushError(errors, !!roadProfile, `Settlement ${settlement.settlementId} road ${road.pathId} references unknown road profile ${road.roadProfileId}`);
    const points = Array.isArray(road.points) ? road.points : [];
    pushError(errors, points.length >= 2, `Settlement ${settlement.settlementId} road ${road.pathId} needs at least two points`);
    points.forEach((point, index) => {
      pushError(errors, Number.isFinite(point.x) && Number.isFinite(point.y), `Settlement ${settlement.settlementId} road ${road.pathId} point ${index} must be finite`);
    });
    pushError(errors, Number.isFinite(road.pathWidth) && road.pathWidth > 0, `Settlement ${settlement.settlementId} road ${road.pathId} needs positive pathWidth`);
    pushError(errors, road.tileId === "DIRT", `Settlement ${settlement.settlementId} road ${road.pathId} should use DIRT tileId`);
    if (roadProfile) {
      pushError(errors, road.tileId === roadProfile.spec.tileId, `Settlement ${settlement.settlementId} road ${road.pathId} tileId must match road profile ${road.roadProfileId}`);
    }
    const tags = Array.isArray(road.tags) ? road.tags : [];
    pushError(errors, tags.includes("settlement-draft"), `Settlement ${settlement.settlementId} road ${road.pathId} needs settlement-draft tag`);
    if (tags.includes("road")) pushError(errors, tags.includes("spawn-protected"), `Settlement ${settlement.settlementId} road ${road.pathId} road tag must be spawn-protected`);
  });

  (Array.isArray(settlement.npcPlan) ? settlement.npcPlan : []).forEach((npc) => {
    validateId(errors, npc && npc.serviceId, `Settlement ${settlement.settlementId} npcPlan serviceId`, SERVICE_ID_PATTERN);
    pushError(errors, placementIds.has(npc.home), `Settlement ${settlement.settlementId} npcPlan ${npc.serviceId} home must target a placement`);
    pushError(errors, typeof npc.role === "string" && npc.role.trim().length > 0, `Settlement ${settlement.settlementId} npcPlan ${npc.serviceId} needs role`);
  });
}

function validateWorkbench(workbench) {
  const errors = [];
  const warnings = [];
  const archetypeById = indexById(workbench.archetypes, "archetypeId", "archetype", errors);
  const materialById = indexById(workbench.materials, "materialProfileId", "material", errors);
  const conditionById = indexById(workbench.conditions, "conditionId", "condition", errors);
  const roadProfileById = indexById(workbench.roadProfiles, "roadProfileId", "road profile", errors);
  const themeById = indexById(workbench.themes, "themeId", "theme", errors);
  const buildingById = indexById(workbench.buildings, "buildingId", "building", errors);
  const settlementById = indexById(workbench.settlements, "settlementId", "settlement", errors);
  const canonicalStamps = getCanonicalStamps(workbench.root);
  const worldIds = getManifestWorldIds(workbench.root);

  workbench.archetypes.forEach((entry) => validateArchetype(entry, errors));
  workbench.materials.forEach((entry) => validateMaterial(entry, themeById, errors));
  workbench.conditions.forEach((entry) => validateCondition(entry, errors));
  workbench.roadProfiles.forEach((entry) => validateRoadProfile(entry, errors));
  workbench.themes.forEach((entry) => validateTheme(entry, errors));
  workbench.buildings.forEach((entry) => validateBuilding(entry, themeById, archetypeById, materialById, conditionById, canonicalStamps, errors));
  workbench.settlements.forEach((entry) => validateSettlement(entry, themeById, buildingById, roadProfileById, worldIds, errors));

  pushError(errors, workbench.archetypes.length >= 5, "Building workbench should seed at least five archetypes");
  pushError(errors, workbench.materials.length >= 5, "Building workbench should seed at least five material profiles");
  pushError(errors, workbench.conditions.length >= 5, "Building workbench should seed at least five condition states");
  pushError(errors, workbench.roadProfiles.length >= 2, "Building workbench should seed at least two road profiles");
  pushError(errors, workbench.themes.length >= 3, "Building workbench should seed at least three themes");
  pushError(errors, workbench.buildings.length >= 8, "Building workbench should seed at least eight buildings");
  pushError(errors, workbench.settlements.length >= 3, "Building workbench should seed at least three settlement drafts");

  if (errors.length > 0) {
    const error = new Error(`Building workbench validation failed:\n- ${errors.join("\n- ")}`);
    error.errors = errors;
    throw error;
  }

  return {
    archetypeCount: archetypeById.size,
    materialCount: materialById.size,
    conditionCount: conditionById.size,
    roadProfileCount: roadProfileById.size,
    themeCount: themeById.size,
    buildingCount: buildingById.size,
    settlementCount: settlementById.size,
    archetypes: Array.from(archetypeById.keys()).sort(),
    materials: Array.from(materialById.keys()).sort(),
    conditions: Array.from(conditionById.keys()).sort(),
    roadProfiles: Array.from(roadProfileById.keys()).sort(),
    themes: Array.from(themeById.keys()).sort(),
    buildings: Array.from(buildingById.keys()).sort(),
    settlements: Array.from(settlementById.keys()).sort(),
    warnings
  };
}

function createStampDraft(building) {
  return {
    stampId: building.promotion.stampId,
    label: building.promotion.structureLabel,
    rows: getRows(building).slice()
  };
}

function ensureDir(absDir) {
  fs.mkdirSync(absDir, { recursive: true });
}

function writeText(absPath, value) {
  ensureDir(path.dirname(absPath));
  fs.writeFileSync(absPath, value, "utf8");
}

function formatRows(rows) {
  return rows.map((row) => `    ${row}`).join("\n");
}

function escapeHtml(value) {
  return String(value === undefined || value === null ? "" : value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[char]);
}

function formatList(items) {
  return (Array.isArray(items) ? items : [])
    .filter((item) => typeof item === "string" && item.trim().length > 0)
    .map((item) => escapeHtml(item))
    .join(", ");
}

function formatReadableId(value) {
  return String(value || "")
    .replace(/^[a-z]+:/, "")
    .replace(/_/g, " ")
    .replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

function getThemeVisual(themeId) {
  const visuals = {
    frontier_timber: {
      ground: "#d9e2c5",
      floor: "#a66f34",
      wallTop: "#6f4a2c",
      wallLeft: "#533821",
      wallRight: "#7b5632",
      cornerTop: "#7c6347",
      roofA: "#9b7a3a",
      roofB: "#76572a",
      accent: "#d8aa54"
    },
    quarry_iron: {
      ground: "#d7decf",
      floor: "#8a714f",
      wallTop: "#8f8d82",
      wallLeft: "#5f605b",
      wallRight: "#74756f",
      cornerTop: "#6d6a61",
      roofA: "#4f5660",
      roofB: "#353b43",
      accent: "#d2a24b"
    },
    stone_market: {
      ground: "#dfe2cf",
      floor: "#b9b5a8",
      wallTop: "#d0c8b8",
      wallLeft: "#928a7f",
      wallRight: "#ada494",
      cornerTop: "#b4ad9f",
      roofA: "#566575",
      roofB: "#394653",
      accent: "#b78d40"
    }
  };
  return visuals[themeId] || visuals.frontier_timber;
}

function getMaterialVisual(building, materialById) {
  const material = materialById && materialById.get(building.materialProfileId);
  const fallback = getThemeVisual(building.themeId);
  if (!material || !material.previewPalette) return fallback;
  const palette = material.previewPalette;
  return {
    ground: palette.ground || fallback.ground,
    floor: palette.floor || fallback.floor,
    wallTop: palette.wall || fallback.wallTop,
    wallLeft: palette.wall || fallback.wallLeft,
    wallRight: palette.wall || fallback.wallRight,
    cornerTop: palette.corner || fallback.cornerTop,
    roofA: palette.roof || fallback.roofA,
    roofB: palette.roofDark || fallback.roofB,
    accent: palette.accent || fallback.accent
  };
}

function getConditionSpec(building, conditionById) {
  return conditionById && conditionById.get(building.conditionId) ? conditionById.get(building.conditionId) : {
    conditionId: "intact",
    label: "Intact",
    wallHeightScale: 1,
    roofIntegrity: 1,
    damageLevel: 0
  };
}

function isSolidStampChar(char) {
  return char === "W" || char === "C" || BLOCKING_STAMP_CHARS.has(char);
}

function isRoofAnchorChar(char) {
  return char === "W" || char === "C";
}

function getTileFill(char, visual) {
  if (char === "F" || char === "P" || char === "E") return visual.floor === "#a66f34" ? "#b9b5a8" : visual.floor;
  if (char === "L" || char === "T") return visual.floor;
  if (char === "s" || char === "S" || char === "U" || char === "D") return "#d0b65f";
  if (char === "V" || char === "$" || char === "B") return "#537586";
  if (char === "f" || char === "g" || char === "G") return "#6d542f";
  return visual.ground;
}

function isoPoint(x, y, context, raise = 0) {
  return {
    x: context.originX + ((x - y) * context.tileW * 0.5),
    y: context.originY + ((x + y) * context.tileH * 0.5) - raise
  };
}

function pointList(points) {
  return points.map((point) => `${Number(point.x.toFixed(2))},${Number(point.y.toFixed(2))}`).join(" ");
}

function diamondPoints(x, y, context, raise = 0) {
  return [
    isoPoint(x, y, context, raise),
    isoPoint(x + 1, y, context, raise),
    isoPoint(x + 1, y + 1, context, raise),
    isoPoint(x, y + 1, context, raise)
  ];
}

function createIsoFloorTile(x, y, char, context, visual) {
  const points = diamondPoints(x, y, context, 0);
  return `<polygon class="isoFloor" points="${pointList(points)}" fill="${getTileFill(char, visual)}" />`;
}

function createIsoBlock(x, y, char, context, visual) {
  const height = char === "C" ? context.wallHeight + 8 : char === "V" || char === "$" || char === "B" ? context.wallHeight * 0.48 : context.wallHeight;
  const bottom = diamondPoints(x, y, context, 0);
  const top = diamondPoints(x, y, context, height);
  const topFill = char === "C" ? visual.cornerTop : char === "V" || char === "$" || char === "B" ? "#5f8799" : visual.wallTop;
  return [
    `<polygon class="isoWallFace" points="${pointList([top[3], top[2], bottom[2], bottom[3]])}" fill="${visual.wallLeft}" />`,
    `<polygon class="isoWallFace" points="${pointList([top[1], top[2], bottom[2], bottom[1]])}" fill="${visual.wallRight}" />`,
    `<polygon class="isoWallTop" points="${pointList(top)}" fill="${topFill}" />`
  ].join("");
}

function getRoofBounds(rows) {
  let xMin = Infinity;
  let yMin = Infinity;
  let xMax = -Infinity;
  let yMax = -Infinity;
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      if (!isRoofAnchorChar(row[x])) continue;
      xMin = Math.min(xMin, x);
      yMin = Math.min(yMin, y);
      xMax = Math.max(xMax, x);
      yMax = Math.max(yMax, y);
    }
  });
  if (!Number.isFinite(xMin)) return null;
  return { xMin, yMin, xMax: xMax + 1, yMax: yMax + 1 };
}

function createIsoRoof(building, context, visual, condition) {
  const rows = getRows(building);
  const bounds = getRoofBounds(rows);
  if (!bounds || !building.roof) return "";
  const roofIntegrity = condition && Number.isFinite(condition.roofIntegrity) ? condition.roofIntegrity : 1;
  if (roofIntegrity <= 0.2) return "";
  const raise = context.wallHeight + 10;
  const ridgeRaise = raise + 18;
  const corners = [
    isoPoint(bounds.xMin, bounds.yMin, context, raise),
    isoPoint(bounds.xMax, bounds.yMin, context, raise),
    isoPoint(bounds.xMax, bounds.yMax, context, raise),
    isoPoint(bounds.xMin, bounds.yMax, context, raise)
  ];
  let ridgeA;
  let ridgeB;
  if (building.roof.ridgeAxis === "y") {
    const midX = (bounds.xMin + bounds.xMax) / 2;
    ridgeA = isoPoint(midX, bounds.yMin, context, ridgeRaise);
    ridgeB = isoPoint(midX, bounds.yMax, context, ridgeRaise);
    const faces = [
      `<polygon class="roofFace" points="${pointList([corners[0], ridgeA, ridgeB, corners[3]])}" fill="${visual.roofA}" />`
    ];
    if (roofIntegrity >= 0.45) faces.push(`<polygon class="roofFace" points="${pointList([ridgeA, corners[1], corners[2], ridgeB])}" fill="${visual.roofB}" />`);
    faces.push(`<polyline class="roofRidge" points="${pointList([ridgeA, ridgeB])}" />`);
    return faces.join("");
  }
  const midY = (bounds.yMin + bounds.yMax) / 2;
  ridgeA = isoPoint(bounds.xMin, midY, context, ridgeRaise);
  ridgeB = isoPoint(bounds.xMax, midY, context, ridgeRaise);
  const faces = [
    `<polygon class="roofFace" points="${pointList([corners[0], corners[1], ridgeB, ridgeA])}" fill="${visual.roofA}" />`
  ];
  if (roofIntegrity >= 0.45) faces.push(`<polygon class="roofFace" points="${pointList([ridgeA, ridgeB, corners[2], corners[3]])}" fill="${visual.roofB}" />`);
  faces.push(`<polyline class="roofRidge" points="${pointList([ridgeA, ridgeB])}" />`);
  return faces.join("");
}

function createMarkerSvg(point, context, className, label) {
  const center = isoPoint(point.x + 0.5, point.y + 0.5, context, 4);
  return `<circle class="${className}" cx="${Number(center.x.toFixed(2))}" cy="${Number(center.y.toFixed(2))}" r="4.2"><title>${escapeHtml(label)}</title></circle>`;
}

function createIsoBuildingSvg(building, theme, materialById, conditionById) {
  const rows = getRows(building);
  const dims = getDimensions(building);
  const visual = getMaterialVisual(building, materialById) || getThemeVisual(theme && theme.themeId ? theme.themeId : building.themeId);
  const condition = getConditionSpec(building, conditionById);
  const context = {
    tileW: 30,
    tileH: 16,
    wallHeight: 23 * (Number.isFinite(condition.wallHeightScale) ? condition.wallHeightScale : 1),
    originX: ((dims.height + 1) * 15) + 26,
    originY: 34
  };
  const viewWidth = ((dims.width + dims.height) * 15) + 70;
  const viewHeight = ((dims.width + dims.height) * 8) + 92;
  const floorTiles = [];
  const blockTiles = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      const char = row[x];
      if (char === " ") continue;
      floorTiles.push(createIsoFloorTile(x, y, char, context, visual));
      if (isSolidStampChar(char)) blockTiles.push({ x, y, char });
    }
  });
  blockTiles.sort((a, b) => (a.x + a.y) - (b.x + b.y));
  const blocks = blockTiles.map((tile) => createIsoBlock(tile.x, tile.y, tile.char, context, visual)).join("");
  const entrances = (Array.isArray(building.entrances) ? building.entrances : [])
    .map((entry) => createMarkerSvg(entry, context, "doorMarker", `entrance: ${entry.id}`))
    .join("");
  const decor = (Array.isArray(building.decor) ? building.decor : [])
    .map((entry) => createMarkerSvg(entry, context, "decorMarker", `${entry.kind}: ${entry.id}`))
    .join("");
  const art = (Array.isArray(building.wallArt) ? building.wallArt : [])
    .map((entry) => createMarkerSvg(entry, context, "artMarker", `${entry.motif}: ${entry.id}`))
    .join("");
  return [
    `<svg class="isoBuilding" viewBox="0 0 ${Math.ceil(viewWidth)} ${Math.ceil(viewHeight)}" role="img" aria-label="${escapeHtml(building.label)} isometric draft">`,
    `<ellipse class="modelShadow" cx="${Math.round(viewWidth / 2)}" cy="${Math.round(viewHeight - 24)}" rx="${Math.max(52, viewWidth * 0.34)}" ry="18" />`,
    floorTiles.join(""),
    blocks,
    createIsoRoof(building, context, visual, condition),
    entrances,
    decor,
    art,
    `</svg>`
  ].join("");
}

function getGlyphClass(char) {
  if (char === " ") return "tileEmpty";
  if (char === "C") return "tileCorner";
  if (char === "W") return "tileWall";
  if (char === "F") return "tileStone";
  if (char === "L" || char === "T") return "tileWood";
  if (char === "V" || char === "$" || char === "B") return "tileService";
  if (char === "s" || char === "S" || char === "U" || char === "D") return "tileStep";
  if (char === "f" || char === "g" || char === "G") return "tileFence";
  return "tileOther";
}

function createStampGridHtml(rows) {
  const width = rows.length ? rows[0].length : 0;
  const cells = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      const char = row[x];
      const label = char === " " ? "empty" : char;
      cells.push(`<span class="tile ${getGlyphClass(char)}" title="${escapeHtml(label)} at ${x},${y}">${escapeHtml(char === " " ? "" : char)}</span>`);
    }
  });
  return `<div class="stampGrid" style="--cols:${width}">${cells.join("")}</div>`;
}

function createThemeCardsHtml(workbench) {
  return workbench.themes.map((entry) => {
    const theme = entry.spec;
    const palette = theme.materialPalette || {};
    return [
      `<article class="themeCard">`,
      `<div class="cardEyebrow">${escapeHtml(theme.themeId)}</div>`,
      `<h3>${escapeHtml(theme.label)}</h3>`,
      `<p>${escapeHtml(palette.wall)}</p>`,
      `<p>${escapeHtml(palette.accent)}</p>`,
      `<div class="chips">${(Array.isArray(theme.decorKinds) ? theme.decorKinds : []).map((kind) => `<span>${escapeHtml(kind)}</span>`).join("")}</div>`,
      `</article>`
    ].join("");
  }).join("");
}

function createGrammarCardsHtml(workbench) {
  const sections = [
    {
      title: "Archetypes",
      count: workbench.archetypes.length,
      items: workbench.archetypes.map((entry) => `${entry.spec.label}: ${formatList(entry.spec.categories)}`)
    },
    {
      title: "Materials",
      count: workbench.materials.length,
      items: workbench.materials.map((entry) => `${entry.spec.label}: ${entry.spec.roofMaterial}`)
    },
    {
      title: "Conditions",
      count: workbench.conditions.length,
      items: workbench.conditions.map((entry) => `${entry.spec.label}: damage ${entry.spec.damageLevel}`)
    },
    {
      title: "Road Profiles",
      count: workbench.roadProfiles.length,
      items: workbench.roadProfiles.map((entry) => `${entry.spec.label}: width ${entry.spec.defaultPathWidth}`)
    }
  ];
  return sections.map((section) => [
    `<article class="grammarCard">`,
    `<div class="cardEyebrow">${escapeHtml(section.count)} specs</div>`,
    `<h3>${escapeHtml(section.title)}</h3>`,
    `<ul>${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`,
    `</article>`
  ].join("")).join("");
}

function createBuildingCardsHtml(workbench) {
  const themeById = new Map(workbench.themes.map((entry) => [entry.spec.themeId, entry.spec]));
  const archetypeById = new Map(workbench.archetypes.map((entry) => [entry.spec.archetypeId, entry.spec]));
  const materialById = new Map(workbench.materials.map((entry) => [entry.spec.materialProfileId, entry.spec]));
  const conditionById = new Map(workbench.conditions.map((entry) => [entry.spec.conditionId, entry.spec]));
  return workbench.buildings.map((entry) => {
    const building = entry.spec;
    const theme = themeById.get(building.themeId);
    const archetype = archetypeById.get(building.archetypeId);
    const material = materialById.get(building.materialProfileId);
    const condition = conditionById.get(building.conditionId);
    const stamp = createStampDraft(building);
    const dims = getDimensions(building);
    const decorKinds = (Array.isArray(building.decor) ? building.decor : []).map((decor) => decor.kind);
    const wallArt = (Array.isArray(building.wallArt) ? building.wallArt : []).map((art) => art.motif);
    return [
      `<article class="buildingCard">`,
      `<div class="buildingHeader">`,
      `<div><div class="cardEyebrow">${escapeHtml(building.category)}</div><h2>${escapeHtml(building.label)}</h2><p>${escapeHtml(theme ? theme.label : building.themeId)} / ${dims.width}x${dims.height}</p></div>`,
      `<code>${escapeHtml(stamp.stampId)}</code>`,
      `</div>`,
      createIsoBuildingSvg(building, theme, materialById, conditionById),
      `<div class="chips grammarChips"><span>${escapeHtml(archetype ? archetype.label : building.archetypeId)}</span><span>${escapeHtml(material ? material.label : building.materialProfileId)}</span><span>${escapeHtml(condition ? condition.label : building.conditionId)}</span></div>`,
      `<div class="detailRows">`,
      `<p><strong>Decor</strong><span>${formatList(decorKinds)}</span></p>`,
      `<p><strong>Wall art</strong><span>${formatList(wallArt)}</span></p>`,
      `<p><strong>Roof</strong><span>${escapeHtml(building.roof ? `${building.roof.ridgeAxis}-ridge, height ${building.roof.height}` : "none")}</span></p>`,
      `</div>`,
      `<details class="glyphDetails"><summary>Stamp glyphs</summary>${createStampGridHtml(stamp.rows)}</details>`,
      `</article>`
    ].join("");
  }).join("");
}

function toPercent(value, min, span) {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(span) || span <= 0) return "0";
  return Number((((value - min) / span) * 100).toFixed(3));
}

function createSettlementPreviewHtml(settlement, buildingById, roadProfileById) {
  const bounds = settlement.anchorBounds || {};
  const xSpan = bounds.xMax - bounds.xMin;
  const ySpan = bounds.yMax - bounds.yMin;
  const roadPolylines = (Array.isArray(settlement.roads) ? settlement.roads : []).map((road) => {
    const profile = roadProfileById.get(road.roadProfileId);
    const points = (Array.isArray(road.points) ? road.points : [])
      .map((point) => `${point.x},${point.y}`)
      .join(" ");
    const stroke = profile && profile.previewColor ? ` style="stroke:${escapeHtml(profile.previewColor)};stroke-width:${Number((Number(road.pathWidth || profile.defaultPathWidth || 2) * 1.85).toFixed(2))}"` : "";
    return `<polyline points="${escapeHtml(points)}"${stroke} />`;
  }).join("");
  const placementBlocks = (Array.isArray(settlement.placements) ? settlement.placements : []).map((placement) => {
    const buildingEntry = buildingById.get(placement.buildingId);
    const dims = buildingEntry ? getDimensions(buildingEntry.spec) : { width: 1, height: 1 };
    const themeClass = buildingEntry && buildingEntry.spec && buildingEntry.spec.themeId ? `theme-${buildingEntry.spec.themeId}` : "theme-frontier_timber";
    const left = toPercent(placement.x, bounds.xMin, xSpan);
    const top = toPercent(placement.y, bounds.yMin, ySpan);
    const width = toPercent(placement.x + dims.width, bounds.xMin, xSpan) - left;
    const height = toPercent(placement.y + dims.height, bounds.yMin, ySpan) - top;
    return [
      `<div class="placementModel ${themeClass}" style="left:${left}%;top:${top}%;width:${Math.max(8, width)}%;height:${Math.max(8, height)}%" title="${escapeHtml(`${placement.structureId}: ${placement.role}`)}">`,
      `<span class="roofShape"></span>`,
      `<strong>${escapeHtml(formatReadableId(placement.structureId))}</strong>`,
      `<em>${escapeHtml(formatReadableId(placement.buildingId))}</em>`,
      `</div>`
    ].join("");
  }).join("");
  const placementRows = (Array.isArray(settlement.placements) ? settlement.placements : []).map((placement) => (
    `<tr><td>${escapeHtml(placement.structureId)}</td><td>${escapeHtml(placement.buildingId)}</td><td>${placement.x}, ${placement.y}, ${placement.z}</td><td>${escapeHtml(placement.role)}</td></tr>`
  )).join("");
  const npcRows = (Array.isArray(settlement.npcPlan) ? settlement.npcPlan : []).map((npc) => (
    `<li><code>${escapeHtml(npc.serviceId)}</code><span>home:${escapeHtml(npc.home)} / ${escapeHtml(npc.role)}</span></li>`
  )).join("");
  const checklist = (Array.isArray(settlement.promotionChecklist) ? settlement.promotionChecklist : []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  return [
    `<section class="settlementPanel">`,
    `<div class="sectionHeader"><div><div class="cardEyebrow">${escapeHtml(settlement.worldId)} / ${escapeHtml(settlement.status)}</div><h2>${escapeHtml(settlement.label)}</h2></div><span class="modePill">${escapeHtml(settlement.placementMode)}</span></div>`,
    `<div class="intentGrid">`,
    `<div><strong>Role</strong><p>${escapeHtml(settlement.intent && settlement.intent.role)}</p></div>`,
    `<div><strong>Different from Starter Town</strong><p>${escapeHtml(settlement.intent && settlement.intent.differenceFromStarterTown)}</p></div>`,
    `</div>`,
    `<div class="settlementMap">`,
    `<svg viewBox="${bounds.xMin} ${bounds.yMin} ${xSpan} ${ySpan}" preserveAspectRatio="none" aria-hidden="true"><rect x="${bounds.xMin}" y="${bounds.yMin}" width="${xSpan}" height="${ySpan}" />${roadPolylines}</svg>`,
    `${placementBlocks}`,
    `</div>`,
    `<table><thead><tr><th>Structure</th><th>Building</th><th>Anchor</th><th>Role</th></tr></thead><tbody>${placementRows}</tbody></table>`,
    `<div class="lowerGrid"><div><h3>NPC Plan</h3><ul>${npcRows}</ul></div><div><h3>Promotion Checklist</h3><ul>${checklist}</ul></div></div>`,
    `</section>`
  ].join("");
}

function createPreviewHtml(workbench, validation) {
  const buildingById = new Map(workbench.buildings.map((entry) => [entry.spec.buildingId, entry]));
  const roadProfileById = new Map(workbench.roadProfiles.map((entry) => [entry.spec.roadProfileId, entry.spec]));
  const settlementPanels = workbench.settlements.map((entry) => createSettlementPreviewHtml(entry.spec, buildingById, roadProfileById)).join("");
  const settlementOptions = workbench.settlements.map((entry) => (
    `<option value="${escapeHtml(entry.spec.settlementId)}">${escapeHtml(entry.spec.label)}</option>`
  )).join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>OSRS Clone Building Workbench</title>
<style>
:root {
  color: #20251f;
  background: #f3eee2;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
}
* { box-sizing: border-box; }
body { margin: 0; }
.shell { max-width: 1220px; margin: 0 auto; padding: 30px 24px 48px; }
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(280px, .9fr);
  gap: 22px;
  align-items: end;
  border-bottom: 2px solid #344337;
  padding-bottom: 22px;
}
.cardEyebrow {
  color: #805419;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}
h1, h2, h3 { color: #223020; letter-spacing: 0; margin: 0; }
h1 { font-size: 40px; line-height: 1.02; margin-top: 6px; }
h2 { font-size: 20px; }
h3 { font-size: 16px; }
p { line-height: 1.45; margin: 8px 0 0; }
.hero p { color: #3f493c; font-size: 17px; max-width: 720px; }
.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
  gap: 10px;
}
.metric {
  background: #fffaf0;
  border: 1px solid #c9b894;
  border-radius: 8px;
  padding: 12px;
}
.metric strong { display: block; font-size: 26px; color: #2f5c46; }
.metric span { display: block; color: #5d624f; font-size: 13px; }
.themes, .buildings, .grammarGrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 22px;
}
.grammarGrid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.themeCard, .buildingCard, .grammarCard, .settlementPanel {
  background: #fffaf0;
  border: 1px solid #c9b894;
  border-radius: 8px;
  box-shadow: 0 2px 0 rgba(38, 31, 20, .07);
}
.themeCard, .grammarCard { padding: 16px; }
.themeCard p, .grammarCard li { color: #4f594b; font-size: 13px; }
.grammarCard ul { padding-left: 18px; }
.grammarChips {
  margin: -2px 0 12px;
}
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.chips span, .modePill {
  background: #eaf0e7;
  border: 1px solid #b7c3ad;
  border-radius: 5px;
  color: #334f38;
  font-size: 12px;
  padding: 5px 7px;
}
.buildingCard { padding: 16px; }
.buildingCard {
  background:
    linear-gradient(180deg, rgba(255, 250, 240, .94), rgba(241, 230, 207, .96)),
    #fffaf0;
}
.buildingHeader {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}
.buildingHeader p { color: #676c58; font-size: 13px; }
code {
  background: #253528;
  border-radius: 5px;
  color: #f6e5b8;
  font-family: Consolas, Menlo, monospace;
  font-size: 12px;
  padding: 5px 7px;
  white-space: nowrap;
}
.stampGrid {
  --cell: minmax(18px, 1fr);
  display: grid;
  grid-template-columns: repeat(var(--cols), var(--cell));
  gap: 3px;
  margin: 16px 0 14px;
  background: #263024;
  border: 1px solid #151914;
  border-radius: 6px;
  padding: 10px;
}
.tile {
  aspect-ratio: 1;
  align-items: center;
  border-radius: 3px;
  display: flex;
  font-family: Consolas, Menlo, monospace;
  font-size: 12px;
  font-weight: 800;
  justify-content: center;
  min-width: 0;
}
.tileEmpty { background: transparent; color: transparent; }
.tileCorner { background: #74614a; color: #f8ead1; }
.tileWall { background: #4d3729; color: #f8ead1; }
.tileStone { background: #b8b3a4; color: #2e312d; }
.tileWood { background: #9b6d34; color: #fff3cf; }
.tileService { background: #4d6a79; color: #eef9ff; }
.tileStep { background: #d4bf76; color: #2e312d; }
.tileFence { background: #755932; color: #fff3cf; }
.tileOther { background: #6c6f8a; color: #ffffff; }
.isoBuilding {
  background: radial-gradient(circle at 50% 76%, rgba(78, 95, 57, .28), transparent 54%), linear-gradient(180deg, #d8dfc4, #c7d2b2);
  border: 1px solid #a9b999;
  border-radius: 8px;
  display: block;
  margin: 16px 0 14px;
  min-height: 230px;
  width: 100%;
}
.modelShadow { fill: rgba(41, 42, 32, .2); }
.isoFloor { stroke: rgba(45, 39, 28, .22); stroke-width: .8; }
.isoWallFace { stroke: rgba(32, 28, 22, .22); stroke-width: .7; }
.isoWallTop { stroke: rgba(32, 28, 22, .3); stroke-width: .8; }
.roofFace { stroke: rgba(27, 31, 31, .34); stroke-width: 1; }
.roofRidge { fill: none; stroke: rgba(255, 235, 172, .75); stroke-linecap: round; stroke-width: 2; }
.doorMarker { fill: #f4d45e; stroke: #3b2c15; stroke-width: 1.3; }
.decorMarker { fill: #67b29c; stroke: #183d34; stroke-width: 1.2; }
.artMarker { fill: #cf6262; stroke: #541e1e; stroke-width: 1.2; }
.glyphDetails {
  border-top: 1px solid #d9caaa;
  margin-top: 12px;
  padding-top: 10px;
}
.glyphDetails summary {
  color: #5a421f;
  cursor: pointer;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}
.glyphDetails .stampGrid {
  margin-bottom: 0;
}
.detailRows { display: grid; gap: 8px; }
.detailRows p { display: grid; gap: 3px; margin: 0; }
.detailRows strong { color: #5a421f; font-size: 12px; text-transform: uppercase; }
.detailRows span { color: #343c34; font-size: 13px; }
.settlementPanel { margin-top: 24px; padding: 18px; }
.sectionHeader {
  align-items: start;
  display: flex;
  justify-content: space-between;
  gap: 14px;
}
.intentGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 14px;
}
.intentGrid div {
  background: #efe4ce;
  border: 1px solid #d4bf91;
  border-radius: 6px;
  padding: 12px;
}
.intentGrid strong { color: #49381d; }
.intentGrid p { color: #4d5548; font-size: 14px; }
.settlementMap {
  background:
    radial-gradient(circle at 24% 18%, rgba(255,255,255,.18), transparent 18%),
    radial-gradient(circle at 72% 76%, rgba(71, 95, 54, .18), transparent 20%),
    linear-gradient(135deg, rgba(72, 98, 58, .08) 25%, transparent 25%) 0 0 / 28px 28px,
    #dfe7d2;
  border: 1px solid #aab99d;
  border-radius: 8px;
  height: 340px;
  margin-top: 16px;
  overflow: hidden;
  position: relative;
}
.settlementMap svg { inset: 0; position: absolute; width: 100%; height: 100%; }
.settlementMap rect { fill: #dfe7d2; stroke: #8ca381; stroke-width: .6; }
.settlementMap polyline {
  fill: none;
  stroke: #9a7a42;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 5.2;
}
.placementModel {
  --wall: #65452a;
  --roof-a: #9b7a3a;
  --roof-b: #75562c;
  --label: #fff3cf;
  align-items: center;
  background: linear-gradient(180deg, var(--wall), #2f3528);
  border: 2px solid rgba(255, 235, 172, .82);
  border-radius: 6px;
  box-shadow: 0 10px 18px rgba(35, 35, 24, .22);
  color: var(--label);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 44px;
  overflow: hidden;
  padding: 20px 7px 7px;
  position: absolute;
}
.placementModel.theme-frontier_timber { --wall: #684526; --roof-a: #a77f3c; --roof-b: #76572a; }
.placementModel.theme-quarry_iron { --wall: #5c5d58; --roof-a: #535c66; --roof-b: #343b43; }
.placementModel.theme-stone_market { --wall: #9a9283; --roof-a: #596879; --roof-b: #384754; }
.placementModel.theme-painted_plaster { --wall: #d9c99f; --roof-a: #b65a3b; --roof-b: #7c352d; --label: #241d15; }
.roofShape {
  background: linear-gradient(135deg, var(--roof-a) 0 50%, var(--roof-b) 50% 100%);
  border-bottom: 2px solid rgba(35, 28, 19, .35);
  height: 20px;
  left: -3px;
  position: absolute;
  right: -3px;
  top: -2px;
  transform: skewX(-12deg);
}
.placementModel strong {
  font-size: 11px;
  line-height: 1.12;
  max-width: 100%;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  text-shadow: 0 1px 0 rgba(0,0,0,.35);
  white-space: nowrap;
}
.placementModel em {
  color: #dfead7;
  font-size: 10px;
  font-style: normal;
  margin-top: 3px;
  max-width: 100%;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}
table { border-collapse: collapse; font-size: 13px; margin-top: 16px; width: 100%; }
th, td { border-bottom: 1px solid #d9caaa; padding: 8px; text-align: left; vertical-align: top; }
th { background: #f3ead7; color: #5c421e; }
.lowerGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 18px;
}
ul { margin: 8px 0 0; padding-left: 20px; }
li { margin: 7px 0; }
li span { color: #4f594b; display: block; margin-top: 2px; }
.footerNote {
  background: #edf4e8;
  border-left: 5px solid #496b3f;
  border-radius: 5px;
  color: #33432f;
  margin-top: 22px;
  padding: 13px 15px;
}
.threeWorkbench {
  background: #141913;
  border-radius: 8px;
  box-shadow: 0 12px 30px rgba(25, 31, 22, .22);
  height: min(68vh, 620px);
  margin: 24px calc(50% - 50vw) 0;
  min-height: 460px;
  overflow: hidden;
  position: relative;
}
.threeWorkbench canvas {
  display: block;
  height: 100%;
  outline: none;
  width: 100%;
}
.threeWorkbench[data-three-status="error"] {
  outline: 3px solid #d16a4f;
}
.threeOverlay {
  align-items: flex-start;
  display: flex;
  gap: 10px;
  justify-content: space-between;
  left: 16px;
  pointer-events: none;
  position: absolute;
  right: 16px;
  top: 14px;
}
.threePanel {
  background: rgba(18, 24, 17, .78);
  border: 1px solid rgba(232, 214, 166, .25);
  border-radius: 8px;
  color: #f6edcf;
  max-width: 360px;
  padding: 10px 12px;
}
.threePanel strong {
  display: block;
  font-size: 13px;
}
.threePanel span {
  color: #d4dec9;
  display: block;
  font-size: 12px;
  line-height: 1.35;
  margin-top: 3px;
}
.threePanel small {
  color: #f4d45e;
  display: block;
  font-size: 11px;
  font-weight: 700;
  margin-top: 7px;
}
.threeToolbar {
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: auto;
}
.threeBadge {
  background: rgba(244, 212, 94, .92);
  border-radius: 7px;
  color: #2b2616;
  font-size: 12px;
  font-weight: 800;
  padding: 8px 10px;
}
.threeControls {
  background: rgba(18, 24, 17, .78);
  border: 1px solid rgba(232, 214, 166, .25);
  border-radius: 8px;
  color: #f6edcf;
  min-width: 238px;
  padding: 10px;
}
.threeControls label {
  color: #d4dec9;
  display: block;
  font-size: 11px;
  font-weight: 700;
}
.threeControls select {
  background: #efe3c6;
  border: 1px solid #bf9e64;
  border-radius: 6px;
  color: #172316;
  font: inherit;
  margin-top: 4px;
  min-height: 32px;
  padding: 4px 8px;
  width: 100%;
}
.threeToggles {
  display: grid;
  gap: 6px 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 10px;
}
.threeToggles label {
  align-items: center;
  display: flex;
  gap: 6px;
}
.threeActions {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 10px;
}
.threeActions button {
  background: #f4d45e;
  border: 0;
  border-radius: 7px;
  color: #2b2616;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 800;
  min-height: 32px;
}
.threeActions button:hover { background: #ffe377; }
@media (max-width: 900px) {
  .hero, .themes, .buildings, .grammarGrid, .intentGrid, .lowerGrid { grid-template-columns: 1fr; }
  .metrics { grid-template-columns: repeat(auto-fit, minmax(132px, 1fr)); }
  .settlementMap { height: 300px; }
  .threeWorkbench { margin-left: -24px; margin-right: -24px; min-height: 420px; }
  .threeOverlay { align-items: stretch; flex-direction: column; }
  .threeToolbar { align-items: flex-start; }
  .threeControls { min-width: min(100%, 360px); }
}
@media (max-width: 620px) {
  .shell { padding: 22px 14px 36px; }
  h1 { font-size: 32px; }
  .metrics { grid-template-columns: 1fr; }
  .threeWorkbench { margin-left: -14px; margin-right: -14px; }
}
</style>
</head>
<body>
<main class="shell">
  <section class="hero">
    <div>
      <div class="cardEyebrow">OSRS Clone / Codex-first world authoring</div>
      <h1>Building Workbench</h1>
      <p>Reusable mainland building themes, stamps, decor hooks, wall-art intent, and settlement drafts generated from specs before anything is promoted into canonical world content.</p>
    </div>
    <div class="metrics">
      <div class="metric"><strong>${validation.archetypeCount}</strong><span>archetypes</span></div>
      <div class="metric"><strong>${validation.materialCount}</strong><span>materials</span></div>
      <div class="metric"><strong>${validation.conditionCount}</strong><span>conditions</span></div>
      <div class="metric"><strong>${validation.roadProfileCount}</strong><span>roads</span></div>
      <div class="metric"><strong>${validation.themeCount}</strong><span>themes</span></div>
      <div class="metric"><strong>${validation.buildingCount}</strong><span>buildings</span></div>
      <div class="metric"><strong>${validation.settlementCount}</strong><span>settlements</span></div>
    </div>
  </section>
  <section class="threeWorkbench" aria-label="3D settlement preview" data-three-status="loading">
    <canvas id="workbench-three-canvas"></canvas>
    <div class="threeOverlay">
      <div class="threePanel"><strong id="three-selection-title">South Quarry Hamlet</strong><span id="three-selection-detail">Preview-only settlement draft</span><small id="three-render-status">Loading 3D scene</small></div>
      <div class="threeToolbar">
        <div class="threeBadge">Three.js</div>
        <div class="threeControls">
          <label for="settlement-select">Settlement</label>
          <select id="settlement-select">${settlementOptions}</select>
          <div class="threeToggles">
            <label><input id="toggle-roofs" type="checkbox" checked> Roofs</label>
            <label><input id="toggle-roads" type="checkbox" checked> Roads</label>
            <label><input id="toggle-markers" type="checkbox" checked> Markers</label>
            <label><input id="toggle-grid" type="checkbox" checked> Grid</label>
          </div>
          <div class="threeActions">
            <button id="frame-settlement" type="button">Frame</button>
            <button id="top-view" type="button">Plan</button>
          </div>
        </div>
      </div>
    </div>
  </section>
  ${settlementPanels}
  <section class="grammarGrid">${createGrammarCardsHtml(workbench)}</section>
  <section class="buildings">${createBuildingCardsHtml(workbench)}</section>
  <section class="themes">${createThemeCardsHtml(workbench)}</section>
  <div class="footerNote">Preview only. Canonical stamps, manifest entries, region placements, roads, NPC home tags, and landmarks still require deliberate promotion plus the world validator.</div>
</main>
<script type="module" src="./workbench-preview.mjs"></script>
</body>
</html>
`;
}

function createPreviewPayload(workbench, validation) {
  return {
    generatedBy: "tools/content/building-workbench.js",
    validation,
    archetypes: workbench.archetypes.map((entry) => entry.spec),
    materialProfiles: workbench.materials.map((entry) => entry.spec),
    conditions: workbench.conditions.map((entry) => entry.spec),
    roadProfiles: workbench.roadProfiles.map((entry) => entry.spec),
    themes: workbench.themes.map((entry) => entry.spec),
    buildings: workbench.buildings.map((entry) => ({
      ...entry.spec,
      dimensions: getDimensions(entry.spec),
      stampDraft: createStampDraft(entry.spec)
    })),
    settlements: workbench.settlements.map((entry) => entry.spec)
  };
}

function uniqueStrings(values) {
  const seen = new Set();
  const result = [];
  (Array.isArray(values) ? values : []).forEach((value) => {
    if (typeof value !== "string" || value.trim().length === 0 || seen.has(value)) return;
    seen.add(value);
    result.push(value);
  });
  return result;
}

function createSpecIndex(entries, idField) {
  return new Map(entries.map((entry) => [entry.spec[idField], entry.spec]));
}

function collectExistingIds(rows, idField) {
  return new Set((Array.isArray(rows) ? rows : [])
    .map((entry) => entry && entry[idField])
    .filter((value) => typeof value === "string" && value.length > 0));
}

function collectCanonicalHomeTargets(world) {
  const targets = new Set();
  (Array.isArray(world && world.structures) ? world.structures : []).forEach((entry) => {
    if (entry && entry.structureId) targets.add(entry.structureId);
  });
  (Array.isArray(world && world.areas) ? world.areas : []).forEach((entry) => {
    if (entry && entry.areaId) targets.add(entry.areaId);
  });
  Object.keys(world && world.skillRoutes ? world.skillRoutes : {}).forEach((groupKey) => {
    const routes = world.skillRoutes[groupKey];
    (Array.isArray(routes) ? routes : []).forEach((entry) => {
      if (entry && entry.routeId) targets.add(entry.routeId);
    });
  });
  const landmarks = world && world.landmarks ? world.landmarks : {};
  ["staircases", "doors", "fences", "roofs", "caveOpenings"].forEach((groupKey) => {
    (Array.isArray(landmarks[groupKey]) ? landmarks[groupKey] : []).forEach((entry) => {
      if (entry && entry.landmarkId) targets.add(entry.landmarkId);
    });
  });
  (Array.isArray(landmarks.decorProps) ? landmarks.decorProps : []).forEach((entry) => {
    if (entry && entry.propId) targets.add(entry.propId);
  });
  return targets;
}

function createWorkbenchIndexes(workbench) {
  return {
    archetypeById: createSpecIndex(workbench.archetypes, "archetypeId"),
    materialById: createSpecIndex(workbench.materials, "materialProfileId"),
    conditionById: createSpecIndex(workbench.conditions, "conditionId"),
    roadProfileById: createSpecIndex(workbench.roadProfiles, "roadProfileId"),
    themeById: createSpecIndex(workbench.themes, "themeId"),
    buildingById: createSpecIndex(workbench.buildings, "buildingId"),
    settlementById: createSpecIndex(workbench.settlements, "settlementId")
  };
}

function createCanonicalRoadPath(road, roadProfile) {
  const tags = uniqueStrings([
    ...(Array.isArray(road.tags) ? road.tags.filter((tag) => tag !== "settlement-draft") : []),
    ...(roadProfile && Array.isArray(roadProfile.tags) ? roadProfile.tags : [])
  ]);
  ["main-overworld", "road", "spawn-protected"].forEach((tag) => {
    if (!tags.includes(tag)) tags.push(tag);
  });
  const canonicalPath = {
    pathId: road.pathId,
    points: (Array.isArray(road.points) ? road.points : []).map((point) => ({ x: point.x, y: point.y })),
    pathWidth: Number.isFinite(road.pathWidth) ? road.pathWidth : roadProfile.defaultPathWidth,
    height: Number.isFinite(road.height) ? road.height : -0.065,
    edgeSoftness: Number.isFinite(road.edgeSoftness) ? road.edgeSoftness : 0.65,
    tileId: roadProfile.tileId,
    tags
  };
  if (Number.isInteger(road.z)) canonicalPath.z = road.z;
  return canonicalPath;
}

function createStructureCandidate(placement, building) {
  return {
    structureId: placement.structureId,
    canonicalStructure: {
      structureId: placement.structureId,
      stampId: building.promotion.stampId,
      label: building.promotion.structureLabel,
      themeId: building.themeId,
      materialProfileId: building.materialProfileId,
      conditionId: building.conditionId,
      x: placement.x,
      y: placement.y,
      z: placement.z
    },
    source: {
      buildingId: building.buildingId,
      archetypeId: building.archetypeId,
      themeId: building.themeId,
      materialProfileId: building.materialProfileId,
      conditionId: building.conditionId,
      role: placement.role
    }
  };
}

function createDecorPropCandidates(placement, building) {
  return (Array.isArray(building.decor) ? building.decor : []).map((decor) => {
    const canonicalProp = {
      propId: `${placement.structureId}_${decor.id}`,
      kind: decor.kind,
      x: placement.x + decor.x,
      y: placement.y + decor.y,
      z: placement.z,
      tags: uniqueStrings([
        ...(Array.isArray(decor.tags) ? decor.tags : []),
        `structure:${placement.structureId}`,
        `building:${building.buildingId}`
      ])
    };
    if (Number.isFinite(decor.facingYaw)) canonicalProp.facingYaw = decor.facingYaw;
    if (decor.blocksMovement !== undefined) canonicalProp.blocksMovement = decor.blocksMovement;
    return {
      propId: canonicalProp.propId,
      canonicalProp,
      source: {
        structureId: placement.structureId,
        buildingId: building.buildingId,
        decorId: decor.id
      }
    };
  });
}

function createRoofLandmarkCandidate(placement, building, condition) {
  if (!building.roof) return null;
  const dims = getDimensions(building);
  const canonicalRoof = {
    landmarkId: `${placement.structureId}_roof`,
    x: placement.x,
    y: placement.y,
    z: placement.z,
    width: dims.width,
    depth: dims.height,
    height: building.roof.height,
    ridgeAxis: building.roof.ridgeAxis,
    themeId: building.themeId,
    materialProfileId: building.materialProfileId,
    conditionId: building.conditionId,
    hideWhenPlayerInside: building.roof.hideWhenPlayerInside === true,
    hideBounds: {
      xMin: placement.x,
      yMin: placement.y,
      xMax: placement.x + dims.width - 1,
      yMax: placement.y + dims.height - 1,
      z: placement.z
    }
  };
  if (condition && Number.isFinite(condition.roofIntegrity)) {
    canonicalRoof.roofIntegrity = condition.roofIntegrity;
  }
  return {
    landmarkId: `${placement.structureId}_roof`,
    canonicalRoof,
    source: {
      structureId: placement.structureId,
      buildingId: building.buildingId,
      materialProfileId: building.materialProfileId,
      conditionId: building.conditionId
    }
  };
}

function createStaircaseLandmarkCandidates(placement, building) {
  const entrances = Array.isArray(building.entrances) ? building.entrances : [];
  return entrances.map((entrance) => {
    const tile = entrance.approach || entrance;
    const landmarkId = entrances.length === 1
      ? `${placement.structureId}_stairs`
      : `${placement.structureId}_${entrance.id}_stairs`;
    return {
      landmarkId,
      canonicalStaircase: {
        landmarkId,
        tiles: [
          {
            x: placement.x + tile.x,
            y: placement.y + tile.y,
            z: placement.z,
            tileId: "STAIRS_RAMP",
            height: 0.25
          }
        ]
      },
      source: {
        structureId: placement.structureId,
        buildingId: building.buildingId,
        entranceId: entrance.id
      }
    };
  });
}

function createWallArtIntents(placement, building) {
  return (Array.isArray(building.wallArt) ? building.wallArt : []).map((art) => ({
    artId: `${placement.structureId}_${art.id}`,
    structureId: placement.structureId,
    buildingId: building.buildingId,
    surface: art.surface,
    x: placement.x + art.x,
    y: placement.y + art.y,
    z: placement.z,
    motif: art.motif,
    status: "intent_only_until_wall_art_runtime_exists"
  }));
}

function createSettlementPromotionDraft(workbench, settlementId) {
  const validation = validateWorkbench(workbench);
  const indexes = createWorkbenchIndexes(workbench);
  const settlement = indexes.settlementById.get(settlementId);
  if (!settlement) throw new Error(`Unknown settlement draft ${settlementId}`);

  const canonical = getManifestWorld(workbench.root, settlement.worldId);
  const manifestStampIds = new Set(Array.isArray(canonical.world.stampIds) ? canonical.world.stampIds : []);
  const canonicalStampIds = getCanonicalStampIds(workbench.root);
  const canonicalStamps = getCanonicalStamps(workbench.root);
  const existingStructureIds = collectExistingIds(canonical.region.structures, "structureId");
  const existingPathIds = collectExistingIds(canonical.region.terrainPatches && canonical.region.terrainPatches.paths, "pathId");
  const existingServiceIds = collectExistingIds(canonical.region.services, "serviceId");
  const landmarks = canonical.region.landmarks || {};
  const existingStaircaseIds = collectExistingIds(landmarks.staircases, "landmarkId");
  const existingDecorPropIds = collectExistingIds(landmarks.decorProps, "propId");
  const existingRoofIds = collectExistingIds(landmarks.roofs, "landmarkId");
  const existingHomeTargets = collectCanonicalHomeTargets(canonical.region);
  const warnings = [
    "Dry run only; no canonical manifest, region, or stamp files were written.",
    "Road drafts are translated into canonical DIRT path metadata, not Three.js cylinders.",
    "Wall art remains intent-only until a canonical wall-art/runtime promotion format exists."
  ];
  const conflicts = [];
  const touchedBuildingIds = new Set();
  const stampAdds = [];
  const regionStructuresToAdd = [];
  const terrainPathsToAdd = [];
  const decorPropsToAdd = [];
  const staircaseLandmarksToAdd = [];
  const roofLandmarksToAdd = [];
  const wallArtIntents = [];

  (Array.isArray(settlement.placements) ? settlement.placements : []).forEach((placement) => {
    const building = indexes.buildingById.get(placement.buildingId);
    if (!building) return;
    if (!touchedBuildingIds.has(building.buildingId)) {
      touchedBuildingIds.add(building.buildingId);
      const stamp = createStampDraft(building);
      const targetPath = path.join(workbench.root, "content", "world", "stamps", `${stamp.stampId}.json`);
      const alreadyExists = canonicalStampIds.has(stamp.stampId);
      const existingStamp = canonicalStamps.get(stamp.stampId);
      const matchesCanonical = !!existingStamp
        && existingStamp.label === stamp.label
        && rowsEqual(existingStamp.rows, stamp.rows);
      if (alreadyExists && !matchesCanonical) conflicts.push(`Stamp ${stamp.stampId} already exists in content/world/stamps with different content`);
      stampAdds.push({
        stampId: stamp.stampId,
        targetPath: toRepoRelative(workbench.root, targetPath),
        alreadyExists,
        matchesCanonical,
        canonicalStamp: stamp,
        source: {
          buildingId: building.buildingId,
          archetypeId: building.archetypeId,
          themeId: building.themeId,
          materialProfileId: building.materialProfileId,
          conditionId: building.conditionId
        }
      });
    }

    const structureCandidate = createStructureCandidate(placement, building);
    structureCandidate.alreadyExists = existingStructureIds.has(structureCandidate.structureId);
    if (structureCandidate.alreadyExists) conflicts.push(`Structure ${structureCandidate.structureId} already exists in ${canonical.world.regionFile}`);
    regionStructuresToAdd.push(structureCandidate);

    createDecorPropCandidates(placement, building).forEach((candidate) => {
      candidate.alreadyExists = existingDecorPropIds.has(candidate.propId);
      if (candidate.alreadyExists) conflicts.push(`Decor prop ${candidate.propId} already exists in ${canonical.world.regionFile}`);
      decorPropsToAdd.push(candidate);
    });

    const roofCandidate = createRoofLandmarkCandidate(placement, building, indexes.conditionById.get(building.conditionId));
    if (roofCandidate) {
      roofCandidate.alreadyExists = existingRoofIds.has(roofCandidate.landmarkId);
      if (roofCandidate.alreadyExists) conflicts.push(`Roof landmark ${roofCandidate.landmarkId} already exists in ${canonical.world.regionFile}`);
      roofLandmarksToAdd.push(roofCandidate);
    }

    createStaircaseLandmarkCandidates(placement, building).forEach((candidate) => {
      candidate.alreadyExists = existingStaircaseIds.has(candidate.landmarkId);
      if (candidate.alreadyExists) conflicts.push(`Staircase landmark ${candidate.landmarkId} already exists in ${canonical.world.regionFile}`);
      staircaseLandmarksToAdd.push(candidate);
    });

    wallArtIntents.push(...createWallArtIntents(placement, building));
  });

  (Array.isArray(settlement.roads) ? settlement.roads : []).forEach((road) => {
    const roadProfile = indexes.roadProfileById.get(road.roadProfileId);
    const canonicalPath = createCanonicalRoadPath(road, roadProfile);
    const alreadyExists = existingPathIds.has(canonicalPath.pathId);
    if (alreadyExists) conflicts.push(`Road path ${canonicalPath.pathId} already exists in ${canonical.world.regionFile}`);
    terrainPathsToAdd.push({
      pathId: canonicalPath.pathId,
      targetPath: `${toRepoRelative(workbench.root, canonical.regionPath)}#terrainPatches.paths`,
      alreadyExists,
      canonicalPath,
      source: {
        roadProfileId: road.roadProfileId,
        profileLabel: roadProfile ? roadProfile.label : road.roadProfileId,
        previewColor: roadProfile ? roadProfile.previewColor : undefined,
        draftTags: Array.isArray(road.tags) ? road.tags.slice() : []
      }
    });
  });

  const proposedHomeTargets = new Set(existingHomeTargets);
  regionStructuresToAdd.forEach((candidate) => proposedHomeTargets.add(candidate.structureId));
  decorPropsToAdd.forEach((candidate) => proposedHomeTargets.add(candidate.propId));
  roofLandmarksToAdd.forEach((candidate) => proposedHomeTargets.add(candidate.landmarkId));
  staircaseLandmarksToAdd.forEach((candidate) => proposedHomeTargets.add(candidate.landmarkId));
  const npcServiceHomeTags = (Array.isArray(settlement.npcPlan) ? settlement.npcPlan : []).map((npc) => {
    let homeTargetStatus = "missing";
    if (existingHomeTargets.has(npc.home)) homeTargetStatus = "existing";
    else if (proposedHomeTargets.has(npc.home)) homeTargetStatus = "available_after_structure_add";
    if (homeTargetStatus === "missing") conflicts.push(`NPC plan ${npc.serviceId} references missing home target ${npc.home}`);
    if (existingServiceIds.has(npc.serviceId)) conflicts.push(`NPC service ${npc.serviceId} already exists in ${canonical.world.regionFile}`);
    return {
      serviceId: npc.serviceId,
      role: npc.role,
      home: npc.home,
      homeTag: `home:${npc.home}`,
      homeTargetStatus,
      serviceAlreadyExists: existingServiceIds.has(npc.serviceId)
    };
  });

  const manifestStampIdsToAdd = stampAdds
    .map((entry) => entry.stampId)
    .filter((stampId) => !manifestStampIds.has(stampId));
  const draft = {
    schemaVersion: 1,
    mode: "dry_run",
    generatedBy: "tools/content/building-workbench.js",
    settlementId: settlement.settlementId,
    settlementLabel: settlement.label,
    worldId: settlement.worldId,
    kind: settlement.kind,
    targetFiles: {
      manifest: toRepoRelative(workbench.root, canonical.manifestPath),
      region: toRepoRelative(workbench.root, canonical.regionPath),
      stampDirectory: "content/world/stamps"
    },
    validation,
    settlementIntent: settlement.intent || {},
    stampAdds,
    manifestStampIdsToAdd,
    regionStructuresToAdd,
    terrainPathsToAdd,
    decorPropsToAdd,
    staircaseLandmarksToAdd,
    roofLandmarksToAdd,
    wallArtIntents,
    npcServiceHomeTags,
    promotionOrder: [
      "Review generated stamps and the Three.js preview.",
      "Copy approved canonicalStamp objects into content/world/stamps.",
      "Register approved stamp ids in content/world/manifest.json for the target world.",
      "Append approved structures, terrain paths, staircase landmarks, decor props, roof landmarks, and NPC service home tags to the target region.",
      "Run the workbench guard and canonical world validator before treating the placement as live."
    ],
    validationCommands: [
      "npm.cmd run tool:world:buildings",
      `npm.cmd run tool:world:buildings:promote -- --settlement ${settlement.settlementId}`,
      "npm.cmd run test:world:building-workbench",
      "npm.cmd run tool:world:validate"
    ],
    warnings,
    conflicts,
    canonicalFilesModified: false
  };
  draft.targetFiles.stamps = stampAdds.map((entry) => entry.targetPath);
  return draft;
}

function createPromotionDryRunMarkdown(draft) {
  const lines = [];
  lines.push(`# ${draft.settlementLabel} Promotion Dry Run`);
  lines.push("");
  lines.push("Generated review plan only. This did not write canonical world files.");
  lines.push("");
  lines.push(`- mode: ${draft.mode}`);
  lines.push(`- settlementId: ${draft.settlementId}`);
  lines.push(`- worldId: ${draft.worldId}`);
  lines.push(`- manifest: ${draft.targetFiles.manifest}`);
  lines.push(`- region: ${draft.targetFiles.region}`);
  lines.push("");
  lines.push("## Stamp Adds");
  draft.stampAdds.forEach((entry) => {
    const rows = entry.canonicalStamp.rows || [];
    lines.push(`- ${entry.stampId} -> ${entry.targetPath}${entry.alreadyExists ? " (already exists)" : ""}`);
    lines.push("```");
    lines.push(formatRows(rows));
    lines.push("```");
  });
  lines.push("");
  lines.push("## Manifest Stamp IDs");
  draft.manifestStampIdsToAdd.forEach((stampId) => {
    lines.push(`- ${stampId}`);
  });
  lines.push("");
  lines.push("## Region Structures");
  draft.regionStructuresToAdd.forEach((entry) => {
    const structure = entry.canonicalStructure;
    lines.push(`- ${structure.structureId}: ${structure.stampId} at ${structure.x},${structure.y},${structure.z} (${entry.source.archetypeId}/${entry.source.materialProfileId}/${entry.source.conditionId})`);
  });
  lines.push("");
  lines.push("## Road Paths");
  draft.terrainPathsToAdd.forEach((entry) => {
    const road = entry.canonicalPath;
    lines.push(`- ${road.pathId}: ${entry.source.roadProfileId}, ${road.tileId}, width ${road.pathWidth}, tags ${road.tags.join(", ")}`);
  });
  lines.push("");
  lines.push("## NPC Home Tags");
  draft.npcServiceHomeTags.forEach((entry) => {
    lines.push(`- ${entry.serviceId}: ${entry.homeTag} (${entry.homeTargetStatus})`);
  });
  lines.push("");
  lines.push("## Decor Props");
  draft.decorPropsToAdd.forEach((entry) => {
    const prop = entry.canonicalProp;
    lines.push(`- ${prop.propId}: ${prop.kind} at ${prop.x},${prop.y},${prop.z}`);
  });
  lines.push("");
  lines.push("## Staircase Landmarks");
  draft.staircaseLandmarksToAdd.forEach((entry) => {
    const tile = entry.canonicalStaircase.tiles[0];
    lines.push(`- ${entry.landmarkId}: ${tile.tileId} at ${tile.x},${tile.y},${tile.z}`);
  });
  lines.push("");
  lines.push("## Roof Landmarks");
  draft.roofLandmarksToAdd.forEach((entry) => {
    const roof = entry.canonicalRoof;
    lines.push(`- ${roof.landmarkId}: ${roof.width}x${roof.depth}, height ${roof.height}, ridge ${roof.ridgeAxis}`);
  });
  lines.push("");
  lines.push("## Wall Art Intents");
  draft.wallArtIntents.forEach((entry) => {
    lines.push(`- ${entry.artId}: ${entry.motif} on ${entry.surface} wall`);
  });
  lines.push("");
  lines.push("## Checks");
  draft.validationCommands.forEach((command) => {
    lines.push(`- ${command}`);
  });
  lines.push("");
  if (draft.conflicts.length > 0) {
    lines.push("## Conflicts");
    draft.conflicts.forEach((entry) => lines.push(`- ${entry}`));
    lines.push("");
  }
  lines.push("## Warnings");
  draft.warnings.forEach((entry) => lines.push(`- ${entry}`));
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function writePromotionDryRun(workbench, settlementId, outDir) {
  const draft = createSettlementPromotionDraft(workbench, settlementId);
  const targetDir = outDir || path.join(workbench.root, "tmp", "world-building-workbench", "promotions", settlementId);
  ensureDir(targetDir);
  writeJsonFile(path.join(targetDir, "promotion-dry-run.json"), draft, { ensureDir: true });
  writeText(path.join(targetDir, "PROMOTION_DRY_RUN.md"), createPromotionDryRunMarkdown(draft));
  draft.stampAdds.forEach((entry) => {
    writeJsonFile(path.join(targetDir, "stamps", `${entry.stampId}.json`), entry.canonicalStamp, { ensureDir: true });
    writeText(path.join(targetDir, "stamps", `${entry.stampId}.txt`), `${formatRows(entry.canonicalStamp.rows)}\n`);
  });
  return {
    outDir: targetDir,
    draft
  };
}

function copyThreeVendor(root, outDir) {
  const buildDir = path.join(root, "node_modules", "three", "build");
  const requiredFiles = ["three.module.js", "three.core.js"];
  requiredFiles.forEach((fileName) => {
    const sourcePath = path.join(buildDir, fileName);
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Missing Three.js build file at ${sourcePath}`);
    }
    const targetPath = path.join(outDir, "vendor", fileName);
    ensureDir(path.dirname(targetPath));
    fs.copyFileSync(sourcePath, targetPath);
  });
  return requiredFiles.map((fileName) => path.join(outDir, "vendor", fileName));
}

function createThreePreviewScript() {
  return `import * as THREE from './vendor/three.module.js';

const canvas = document.getElementById('workbench-three-canvas');
const sectionEl = canvas.closest('.threeWorkbench');
const titleEl = document.getElementById('three-selection-title');
const detailEl = document.getElementById('three-selection-detail');
const statusEl = document.getElementById('three-render-status');
const settlementSelect = document.getElementById('settlement-select');
const toggleRoofs = document.getElementById('toggle-roofs');
const toggleRoads = document.getElementById('toggle-roads');
const toggleMarkers = document.getElementById('toggle-markers');
const toggleGrid = document.getElementById('toggle-grid');
const frameButton = document.getElementById('frame-settlement');
const topButton = document.getElementById('top-view');

function setStatus(status, text) {
  sectionEl.dataset.threeStatus = status;
  statusEl.textContent = text;
  document.body.dataset.workbenchThree = status;
}

setStatus('loading', 'Loading 3D scene');

const response = await fetch('./workbench-data.json');
const data = await response.json();

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x161f16);
scene.fog = new THREE.Fog(0x161f16, 44, 110);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 220);
const cameraTarget = new THREE.Vector3(0, 0, 0);
const cameraState = { yaw: 0.76, pitch: 0.74, distance: 58 };

const rootGroup = new THREE.Group();
scene.add(rootGroup);

const hemi = new THREE.HemisphereLight(0xf5ebcf, 0x34462d, 1.8);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffefc7, 2.8);
sun.position.set(34, 42, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -48;
sun.shadow.camera.right = 48;
sun.shadow.camera.top = 48;
sun.shadow.camera.bottom = -48;
scene.add(sun);

const fill = new THREE.DirectionalLight(0x8db1ff, 0.7);
fill.position.set(-20, 18, -24);
scene.add(fill);

const themeVisuals = {
  frontier_timber: {
    ground: 0xd9e2c5,
    floor: 0xa66f34,
    wall: 0x684526,
    corner: 0x7c6347,
    roof: 0xa77f3c,
    roofDark: 0x76572a,
    accent: 0xd8aa54
  },
  quarry_iron: {
    ground: 0xd7decf,
    floor: 0x8a714f,
    wall: 0x5c5d58,
    corner: 0x6d6a61,
    roof: 0x535c66,
    roofDark: 0x343b43,
    accent: 0xd2a24b
  },
  stone_market: {
    ground: 0xdfe2cf,
    floor: 0xb9b5a8,
    wall: 0x9a9283,
    corner: 0xb4ad9f,
    roof: 0x596879,
    roofDark: 0x384754,
    accent: 0xb78d40
  },
  painted_plaster: {
    ground: 0xdfe4cf,
    floor: 0xb98b55,
    wall: 0xd9c99f,
    corner: 0x806849,
    roof: 0xb65a3b,
    roofDark: 0x7c352d,
    accent: 0x3d7e9a
  }
};

const materials = new Map();
function mat(key, color, options) {
  if (materials.has(key)) return materials.get(key);
  const material = new THREE.MeshStandardMaterial(Object.assign({
    color,
    roughness: 0.82,
    metalness: 0.04
  }, options || {}));
  materials.set(key, material);
  return material;
}

const floorGeometry = new THREE.BoxGeometry(1, 0.08, 1);
const wallGeometry = new THREE.BoxGeometry(0.96, 1.16, 0.96);
const cornerGeometry = new THREE.BoxGeometry(1.02, 1.32, 1.02);
const counterGeometry = new THREE.BoxGeometry(0.88, 0.42, 0.88);
const markerGeometry = new THREE.SphereGeometry(0.16, 12, 8);
const postGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.65, 8);

const materialById = new Map((Array.isArray(data.materialProfiles) ? data.materialProfiles : []).map((profile) => [profile.materialProfileId, profile]));
const conditionById = new Map((Array.isArray(data.conditions) ? data.conditions : []).map((condition) => [condition.conditionId, condition]));
const roadProfileById = new Map((Array.isArray(data.roadProfiles) ? data.roadProfiles : []).map((profile) => [profile.roadProfileId, profile]));

function parseColor(value, fallback) {
  if (typeof value !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(value)) return fallback;
  return Number.parseInt(value.slice(1), 16);
}

function getVisual(building) {
  const fallback = themeVisuals[building.themeId] || themeVisuals.frontier_timber;
  const profile = materialById.get(building.materialProfileId);
  const palette = profile && profile.previewPalette ? profile.previewPalette : {};
  return {
    id: building.materialProfileId || building.themeId,
    ground: parseColor(palette.ground, fallback.ground),
    floor: parseColor(palette.floor, fallback.floor),
    wall: parseColor(palette.wall, fallback.wall),
    corner: parseColor(palette.corner, fallback.corner),
    roof: parseColor(palette.roof, fallback.roof),
    roofDark: parseColor(palette.roofDark, fallback.roofDark),
    accent: parseColor(palette.accent, fallback.accent)
  };
}

function getCondition(building) {
  return conditionById.get(building.conditionId) || {
    conditionId: 'intact',
    label: 'Intact',
    damageLevel: 0,
    wallHeightScale: 1,
    roofIntegrity: 1
  };
}

function isWall(char) {
  return char === 'W' || char === 'C';
}

function isWalkable(char) {
  return char === 'F' || char === 'L' || char === 'T' || char === 'P' || char === 'E' || char === 's' || char === 'S' || char === 'U' || char === 'D';
}

function isService(char) {
  return char === 'V' || char === '$' || char === 'B' || char === 'N' || char === 'K' || char === 'Q';
}

function makeBox(geometry, material, position, castShadow) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.castShadow = castShadow !== false;
  mesh.receiveShadow = true;
  return mesh;
}

function getRows(building) {
  return building && building.plan && Array.isArray(building.plan.rows) ? building.plan.rows : [];
}

function getDimensions(building) {
  const rows = getRows(building);
  return { width: rows.length ? rows[0].length : 0, height: rows.length };
}

function getRoofBounds(rows) {
  let xMin = Infinity;
  let yMin = Infinity;
  let xMax = -Infinity;
  let yMax = -Infinity;
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      if (!isWall(row[x])) continue;
      xMin = Math.min(xMin, x);
      yMin = Math.min(yMin, y);
      xMax = Math.max(xMax, x + 1);
      yMax = Math.max(yMax, y + 1);
    }
  });
  if (!Number.isFinite(xMin)) return null;
  return { xMin, yMin, xMax, yMax };
}

function makePlaneMesh(points, material) {
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    points[0].x, points[0].y, points[0].z,
    points[1].x, points[1].y, points[1].z,
    points[2].x, points[2].y, points[2].z,
    points[0].x, points[0].y, points[0].z,
    points[2].x, points[2].y, points[2].z,
    points[3].x, points[3].y, points[3].z
  ]);
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createRoof(building, visual, dims, condition) {
  const bounds = getRoofBounds(getRows(building));
  const group = new THREE.Group();
  if (!bounds || !building.roof) return group;
  const roofIntegrity = Number.isFinite(condition.roofIntegrity) ? condition.roofIntegrity : 1;
  if (roofIntegrity <= 0.18) return group;
  const overhang = 0.34;
  const xMin = bounds.xMin - (dims.width / 2) - overhang;
  const xMax = bounds.xMax - (dims.width / 2) + overhang;
  const zMin = bounds.yMin - (dims.height / 2) - overhang;
  const zMax = bounds.yMax - (dims.height / 2) + overhang;
  const wallScale = Number.isFinite(condition.wallHeightScale) ? condition.wallHeightScale : 1;
  const eave = 1.18 * wallScale;
  const ridge = eave + Math.max(0.58, Number(building.roof.height || 1) * 0.52);
  const roofMat = mat('roof-' + visual.id + '-' + condition.conditionId, visual.roof, { roughness: 0.9, side: THREE.DoubleSide });
  const roofDarkMat = mat('roof-dark-' + visual.id + '-' + condition.conditionId, visual.roofDark, { roughness: 0.94, side: THREE.DoubleSide });
  if (building.roof.ridgeAxis === 'y') {
    const midX = (xMin + xMax) / 2;
    group.add(makePlaneMesh([
      new THREE.Vector3(xMin, eave, zMin),
      new THREE.Vector3(midX, ridge, zMin),
      new THREE.Vector3(midX, ridge, zMax),
      new THREE.Vector3(xMin, eave, zMax)
    ], roofMat));
    if (roofIntegrity >= 0.45) {
      group.add(makePlaneMesh([
        new THREE.Vector3(midX, ridge, zMin),
        new THREE.Vector3(xMax, eave, zMin),
        new THREE.Vector3(xMax, eave, zMax),
        new THREE.Vector3(midX, ridge, zMax)
      ], roofDarkMat));
    }
  } else {
    const midZ = (zMin + zMax) / 2;
    group.add(makePlaneMesh([
      new THREE.Vector3(xMin, eave, zMin),
      new THREE.Vector3(xMax, eave, zMin),
      new THREE.Vector3(xMax, ridge, midZ),
      new THREE.Vector3(xMin, ridge, midZ)
    ], roofMat));
    if (roofIntegrity >= 0.45) {
      group.add(makePlaneMesh([
        new THREE.Vector3(xMin, ridge, midZ),
        new THREE.Vector3(xMax, ridge, midZ),
        new THREE.Vector3(xMax, eave, zMax),
        new THREE.Vector3(xMin, eave, zMax)
      ], roofDarkMat));
    }
  }
  group.traverse((child) => {
    child.userData.layer = 'roofs';
  });
  return group;
}

function addMarker(group, x, y, dims, material, height) {
  const mesh = new THREE.Mesh(markerGeometry, material);
  mesh.position.set(x - dims.width / 2 + 0.5, height || 1.42, y - dims.height / 2 + 0.5);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.layer = 'markers';
  group.add(mesh);
}

function createBuildingGroup(building) {
  const group = new THREE.Group();
  const visual = getVisual(building);
  const condition = getCondition(building);
  const rows = getRows(building);
  const dims = getDimensions(building);
  const wallScale = Number.isFinite(condition.wallHeightScale) ? condition.wallHeightScale : 1;
  const damageLevel = Number.isFinite(condition.damageLevel) ? condition.damageLevel : 0;
  const floorMat = mat('floor-' + visual.id, visual.floor);
  const wallMat = mat('wall-' + visual.id, visual.wall);
  const cornerMat = mat('corner-' + visual.id, visual.corner);
  const serviceMat = mat('service', 0x4f7e90, { metalness: 0.08 });
  const doorMat = mat('door-marker', 0xf2ce55, { emissive: 0x3b2f08, emissiveIntensity: 0.1 });
  const decorMat = mat('decor-marker', 0x66b39d, { emissive: 0x0f352b, emissiveIntensity: 0.08 });
  const artMat = mat('art-marker', 0xcf6262, { emissive: 0x3b1010, emissiveIntensity: 0.08 });
  const debrisMat = mat('debris-' + visual.id + '-' + condition.conditionId, visual.corner, { roughness: 1 });
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      const char = row[x];
      if (char === ' ') continue;
      const local = new THREE.Vector3(x - dims.width / 2 + 0.5, 0.02, y - dims.height / 2 + 0.5);
      group.add(makeBox(floorGeometry, floorMat, local, false));
      if (char === 'W') {
        const wall = makeBox(wallGeometry, wallMat, new THREE.Vector3(local.x, 0.62 * wallScale, local.z));
        wall.scale.y = wallScale;
        group.add(wall);
      } else if (char === 'C') {
        const corner = makeBox(cornerGeometry, cornerMat, new THREE.Vector3(local.x, 0.7 * wallScale, local.z));
        corner.scale.y = wallScale;
        group.add(corner);
      } else if (isService(char)) {
        group.add(makeBox(counterGeometry, serviceMat, new THREE.Vector3(local.x, 0.26, local.z)));
      } else if (!isWalkable(char)) {
        group.add(makeBox(counterGeometry, wallMat, new THREE.Vector3(local.x, 0.22, local.z)));
      }
    }
  });
  if (damageLevel > 0.35) {
    const debrisCount = Math.min(7, Math.max(2, Math.round(damageLevel * 7)));
    for (let i = 0; i < debrisCount; i += 1) {
      const mesh = new THREE.Mesh(i % 2 === 0 ? new THREE.DodecahedronGeometry(0.22, 0) : postGeometry, debrisMat);
      mesh.position.set(
        ((i * 3) % Math.max(1, dims.width)) - dims.width / 2 + 0.5,
        i % 2 === 0 ? 0.18 : 0.28,
        ((i * 5) % Math.max(1, dims.height)) - dims.height / 2 + 0.5
      );
      mesh.rotation.y = i * 0.73;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.layer = 'markers';
      group.add(mesh);
    }
  }
  group.add(createRoof(building, visual, dims, condition));
  (Array.isArray(building.entrances) ? building.entrances : []).forEach((entry) => addMarker(group, entry.x, entry.y, dims, doorMat, 1.35));
  (Array.isArray(building.decor) ? building.decor : []).forEach((entry) => addMarker(group, entry.x, entry.y, dims, decorMat, 1.18));
  (Array.isArray(building.wallArt) ? building.wallArt : []).forEach((entry) => addMarker(group, entry.x, entry.y, dims, artMat, 1.56));
  group.userData = { kind: 'building-template', building };
  return group;
}

function normalizeWorldPoint(point, settlement) {
  const bounds = settlement.anchorBounds;
  const centerX = (bounds.xMin + bounds.xMax) / 2;
  const centerY = (bounds.yMin + bounds.yMax) / 2;
  return new THREE.Vector3((point.x - centerX) * 0.64, 0, (point.y - centerY) * 0.64);
}

function addTerrain(settlement) {
  const bounds = settlement.anchorBounds;
  const width = Math.max(18, (bounds.xMax - bounds.xMin) * 0.74);
  const depth = Math.max(18, (bounds.yMax - bounds.yMin) * 0.74);
  const plane = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.18, depth),
    mat('terrain', 0x637b4e, { roughness: 0.95 })
  );
  plane.position.y = -0.1;
  plane.receiveShadow = true;
  rootGroup.add(plane);
  const grid = new THREE.GridHelper(Math.max(width, depth), 18, 0x99ad85, 0x7e9670);
  grid.position.y = 0.004;
  grid.userData.layer = 'grid';
  rootGroup.add(grid);
}

function addRoads(settlement) {
  (Array.isArray(settlement.roads) ? settlement.roads : []).forEach((road) => {
    const profile = roadProfileById.get(road.roadProfileId) || {};
    const roadMat = mat('road-' + (road.roadProfileId || 'default'), parseColor(profile.previewColor, 0x9a7a42), { roughness: 1 });
    const points = (Array.isArray(road.points) ? road.points : []).map((point) => normalizeWorldPoint(point, settlement).setY(0.08));
    if (points.length < 2) return;
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.2);
    const geometry = new THREE.TubeGeometry(curve, 42, Math.max(0.28, Number(road.pathWidth || profile.defaultPathWidth || 2.5) * 0.16), 8, false);
    const mesh = new THREE.Mesh(geometry, roadMat);
    mesh.receiveShadow = true;
    mesh.userData.layer = 'roads';
    rootGroup.add(mesh);
  });
}

function addDecorScatter(settlement) {
  const oreMat = mat('scatter-ore', 0x4c4a43, { roughness: 0.94 });
  const woodMat = mat('scatter-wood', 0x7b5632, { roughness: 0.86 });
  const positions = [
    { x: settlement.anchorBounds.xMin + 21, y: settlement.anchorBounds.yMin + 35, mat: oreMat },
    { x: settlement.anchorBounds.xMin + 27, y: settlement.anchorBounds.yMin + 32, mat: oreMat },
    { x: settlement.anchorBounds.xMin + 14, y: settlement.anchorBounds.yMin + 48, mat: woodMat },
    { x: settlement.anchorBounds.xMax - 13, y: settlement.anchorBounds.yMin + 48, mat: woodMat }
  ];
  positions.forEach((entry, index) => {
    const mesh = new THREE.Mesh(index < 2 ? new THREE.DodecahedronGeometry(0.54, 0) : postGeometry, entry.mat);
    const pos = normalizeWorldPoint(entry, settlement);
    mesh.position.set(pos.x, index < 2 ? 0.32 : 0.34, pos.z);
    mesh.rotation.y = index * 0.7;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    rootGroup.add(mesh);
  });
}

const buildingById = new Map(data.buildings.map((building) => [building.buildingId, building]));
let settlement = null;
let selectable = [];

function clearRootGroup() {
  while (rootGroup.children.length) {
    rootGroup.remove(rootGroup.children[0]);
  }
}

function renderSettlement(nextSettlement) {
  if (!nextSettlement) {
    setStatus('error', 'No settlement draft found');
    return;
  }
  settlement = nextSettlement;
  selectable = [];
  clearRootGroup();
  addTerrain(settlement);
  addRoads(settlement);
  addDecorScatter(settlement);
  (Array.isArray(settlement.placements) ? settlement.placements : []).forEach((placement) => {
    const building = buildingById.get(placement.buildingId);
    if (!building) return;
    const dims = getDimensions(building);
    const group = createBuildingGroup(building);
    const center = normalizeWorldPoint({ x: placement.x + dims.width / 2, y: placement.y + dims.height / 2 }, settlement);
    group.position.set(center.x, 0, center.z);
    group.userData = { kind: 'placement', placement, building };
    group.traverse((child) => {
      if (child && child.isMesh) child.userData = Object.assign({}, child.userData, group.userData);
    });
    rootGroup.add(group);
    selectable.push(group);
  });
  setSelection(null);
  applyLayerVisibility();
  fitScene(false);
  setStatus('ready', selectable.length + ' buildings / ' + (Array.isArray(settlement.roads) ? settlement.roads.length : 0) + ' road / ' + (Array.isArray(settlement.npcPlan) ? settlement.npcPlan.length : 0) + ' NPC hooks');
  window.__buildingWorkbenchPreview = {
    ready: true,
    settlementId: settlement.settlementId,
    selectableCount: selectable.length,
    sceneChildren: rootGroup.children.length
  };
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let selectedObject = null;
let dragState = null;

function setSelection(userData) {
  if (!userData || !userData.placement) {
    titleEl.textContent = settlement.label;
    detailEl.textContent = 'Preview-only settlement draft';
    return;
  }
  titleEl.textContent = userData.placement.structureId.replace(/_/g, ' ');
  detailEl.textContent = userData.building.label + ' / ' + userData.placement.role;
}

function applyLayerVisibility() {
  const visibleByLayer = {
    roofs: toggleRoofs.checked,
    roads: toggleRoads.checked,
    markers: toggleMarkers.checked,
    grid: toggleGrid.checked
  };
  rootGroup.traverse((child) => {
    const layer = child.userData && child.userData.layer;
    if (layer && Object.prototype.hasOwnProperty.call(visibleByLayer, layer)) {
      child.visible = visibleByLayer[layer];
    }
  });
}

function updateCamera() {
  cameraState.pitch = Math.max(0.32, Math.min(1.42, cameraState.pitch));
  cameraState.distance = Math.max(22, Math.min(118, cameraState.distance));
  const radius = Math.cos(cameraState.pitch) * cameraState.distance;
  camera.position.set(
    Math.sin(cameraState.yaw) * radius,
    Math.sin(cameraState.pitch) * cameraState.distance,
    Math.cos(cameraState.yaw) * radius
  );
  camera.lookAt(cameraTarget);
}

function fitScene(planView) {
  const box = new THREE.Box3().setFromObject(rootGroup);
  if (box.isEmpty()) {
    updateCamera();
    return;
  }
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  cameraTarget.set(center.x, Math.max(0, center.y * 0.35), center.z);
  cameraState.yaw = planView ? 0.78 : 0.76;
  cameraState.pitch = planView ? 1.34 : 0.74;
  cameraState.distance = Math.max(34, Math.max(size.x, size.z) * (planView ? 1.1 : 1.32));
  updateCamera();
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function getPointer(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
    y: -(((event.clientY - rect.top) / rect.height) * 2 - 1)
  };
}

canvas.addEventListener('pointerdown', (event) => {
  canvas.setPointerCapture(event.pointerId);
  dragState = { x: event.clientX, y: event.clientY, moved: false };
});

canvas.addEventListener('pointermove', (event) => {
  if (!dragState) return;
  const dx = event.clientX - dragState.x;
  const dy = event.clientY - dragState.y;
  if (Math.abs(dx) + Math.abs(dy) > 2) dragState.moved = true;
  cameraState.yaw -= dx * 0.008;
  cameraState.pitch += dy * 0.006;
  dragState.x = event.clientX;
  dragState.y = event.clientY;
  updateCamera();
});

canvas.addEventListener('pointerup', (event) => {
  const wasDrag = dragState && dragState.moved;
  dragState = null;
  if (wasDrag) return;
  const nextPointer = getPointer(event);
  pointer.set(nextPointer.x, nextPointer.y);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(rootGroup.children, true);
  const hit = hits.find((entry) => entry.object && entry.object.userData && entry.object.userData.placement);
  selectedObject = hit ? hit.object : null;
  setSelection(selectedObject ? selectedObject.userData : null);
});

canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  cameraState.distance += event.deltaY * 0.035;
  updateCamera();
}, { passive: false });

[toggleRoofs, toggleRoads, toggleMarkers, toggleGrid].forEach((input) => {
  input.addEventListener('change', applyLayerVisibility);
});

frameButton.addEventListener('click', () => fitScene(false));
topButton.addEventListener('click', () => fitScene(true));
settlementSelect.addEventListener('change', () => {
  const nextSettlement = data.settlements.find((entry) => entry.settlementId === settlementSelect.value);
  renderSettlement(nextSettlement || data.settlements[0]);
});

window.addEventListener('resize', resize);
resize();
renderSettlement(data.settlements[0]);

function frame() {
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
frame();
`;
}

function createIndexMarkdown(workbench, validation) {
  const lines = [];
  lines.push("# Building Workbench Preview");
  lines.push("");
  lines.push("Generated review artifacts for Codex-first mainland building drafts.");
  lines.push("");
  lines.push(`Archetypes: ${validation.archetypeCount}`);
  lines.push(`Material profiles: ${validation.materialCount}`);
  lines.push(`Condition states: ${validation.conditionCount}`);
  lines.push(`Road profiles: ${validation.roadProfileCount}`);
  lines.push(`Themes: ${validation.themeCount}`);
  lines.push(`Buildings: ${validation.buildingCount}`);
  lines.push(`Settlement drafts: ${validation.settlementCount}`);
  lines.push("");
  lines.push("## Draft Stamps");
  workbench.buildings.forEach((entry) => {
    const building = entry.spec;
    const stamp = createStampDraft(building);
    const dims = getDimensions(building);
    lines.push("");
    lines.push(`### ${building.label}`);
    lines.push("");
    lines.push(`- buildingId: ${building.buildingId}`);
    lines.push(`- archetypeId: ${building.archetypeId}`);
    lines.push(`- themeId: ${building.themeId}`);
    lines.push(`- materialProfileId: ${building.materialProfileId}`);
    lines.push(`- conditionId: ${building.conditionId}`);
    lines.push(`- promotion stampId: ${stamp.stampId}`);
    lines.push(`- footprint: ${dims.width}x${dims.height}`);
    lines.push("");
    lines.push("```");
    lines.push(formatRows(stamp.rows));
    lines.push("```");
  });
  lines.push("");
  lines.push("## Promotion Reminder");
  lines.push("");
  lines.push("These files are previews only. Promote reviewed reusable stamps into content/world/stamps and then run the canonical world validator.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function createPromotionPlanMarkdown(workbench, validation) {
  const themeById = new Map(workbench.themes.map((entry) => [entry.spec.themeId, entry.spec]));
  const buildingById = new Map(workbench.buildings.map((entry) => [entry.spec.buildingId, entry.spec]));
  const archetypeById = new Map(workbench.archetypes.map((entry) => [entry.spec.archetypeId, entry.spec]));
  const materialById = new Map(workbench.materials.map((entry) => [entry.spec.materialProfileId, entry.spec]));
  const conditionById = new Map(workbench.conditions.map((entry) => [entry.spec.conditionId, entry.spec]));
  const lines = [];
  lines.push("# Building Workbench Promotion Plan");
  lines.push("");
  lines.push("Generated from draft specs. This is not canonical world content.");
  lines.push("");
  lines.push("## Preview Inventory");
  lines.push("");
  lines.push(`- archetypes: ${validation.archetypeCount}`);
  lines.push(`- material profiles: ${validation.materialCount}`);
  lines.push(`- condition states: ${validation.conditionCount}`);
  lines.push(`- road profiles: ${validation.roadProfileCount}`);
  lines.push(`- themes: ${validation.themeCount}`);
  lines.push(`- reusable buildings: ${validation.buildingCount}`);
  lines.push(`- settlement drafts: ${validation.settlementCount}`);
  lines.push("");
  lines.push("## Reusable Draft Stamps");
  workbench.buildings.forEach((entry) => {
    const building = entry.spec;
    const stamp = createStampDraft(building);
    const dims = getDimensions(building);
    const theme = themeById.get(building.themeId);
    const archetype = archetypeById.get(building.archetypeId);
    const material = materialById.get(building.materialProfileId);
    const condition = conditionById.get(building.conditionId);
    lines.push(`- ${stamp.stampId}: ${building.label} (${theme ? theme.label : building.themeId}, ${dims.width}x${dims.height})`);
    lines.push(`  - grammar: ${archetype ? archetype.label : building.archetypeId} / ${material ? material.label : building.materialProfileId} / ${condition ? condition.label : building.conditionId}`);
    lines.push(`  - tags: ${(Array.isArray(building.variantTags) ? building.variantTags : []).join(", ")}`);
    lines.push(`  - wall art: ${(Array.isArray(building.wallArt) ? building.wallArt : []).map((art) => art.motif).join("; ")}`);
  });
  lines.push("");
  lines.push("## Settlement Drafts");
  workbench.settlements.forEach((entry) => {
    const settlement = entry.spec;
    lines.push(`- ${settlement.settlementId}: ${settlement.label} (${settlement.worldId}, ${settlement.kind})`);
    lines.push(`  - themes: ${(Array.isArray(settlement.themeMix) ? settlement.themeMix : []).join(", ")}`);
    lines.push(`  - placements: ${(Array.isArray(settlement.placements) ? settlement.placements : []).map((placement) => {
      const building = buildingById.get(placement.buildingId);
      return `${placement.structureId}->${building ? building.promotion.stampId : placement.buildingId}`;
    }).join(", ")}`);
    lines.push(`  - roads: ${(Array.isArray(settlement.roads) ? settlement.roads : []).map((road) => `${road.pathId}:${road.roadProfileId}`).join(", ")}`);
    lines.push(`  - npc homes: ${(Array.isArray(settlement.npcPlan) ? settlement.npcPlan : []).map((npc) => `${npc.serviceId}@${npc.home}`).join(", ")}`);
  });
  lines.push("");
  lines.push("## Promotion Order");
  lines.push("");
  lines.push("1. Review `index.html` and the compiled stamp JSON for reusable silhouettes.");
  lines.push("2. Run `npm.cmd run tool:world:buildings:promote -- --settlement <settlementId>` for a copy-ready dry-run.");
  lines.push("3. Copy only approved compiled stamp JSON into `content/world/stamps`.");
  lines.push("4. Register approved stamps in `content/world/manifest.json`.");
  lines.push("5. Add reviewed placements, roads, service homes, and landmarks to the target region JSON.");
  lines.push("6. Run `npm.cmd run tool:world:validate` before treating any mainland placement as real.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function createSettlementMarkdown(settlement, buildingById) {
  const lines = [];
  lines.push(`# ${settlement.label}`);
  lines.push("");
  lines.push(`settlementId: ${settlement.settlementId}`);
  lines.push(`worldId: ${settlement.worldId}`);
  lines.push(`status: ${settlement.status}`);
  lines.push("");
  lines.push("## Intent");
  lines.push("");
  lines.push(settlement.intent && settlement.intent.role ? settlement.intent.role : "No role authored.");
  if (settlement.intent && settlement.intent.differenceFromStarterTown) {
    lines.push("");
    lines.push(settlement.intent.differenceFromStarterTown);
  }
  lines.push("");
  lines.push("## Placements");
  (Array.isArray(settlement.placements) ? settlement.placements : []).forEach((placement) => {
    const building = buildingById.get(placement.buildingId).spec;
    const dims = getDimensions(building);
    lines.push(`- ${placement.structureId}: ${placement.buildingId} at ${placement.x},${placement.y},${placement.z} (${dims.width}x${dims.height}) - ${placement.role}`);
  });
  lines.push("");
  lines.push("## Roads");
  (Array.isArray(settlement.roads) ? settlement.roads : []).forEach((road) => {
    lines.push(`- ${road.pathId}: ${road.roadProfileId}, ${road.tileId}, width ${road.pathWidth}`);
  });
  lines.push("");
  lines.push("## NPC Plan");
  (Array.isArray(settlement.npcPlan) ? settlement.npcPlan : []).forEach((npc) => {
    lines.push(`- ${npc.serviceId} -> home:${npc.home} - ${npc.role}`);
  });
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function writePreview(workbench, outDir = DEFAULT_OUT_DIR) {
  const validation = validateWorkbench(workbench);
  const buildingById = new Map(workbench.buildings.map((entry) => [entry.spec.buildingId, entry]));
  ensureDir(outDir);
  writeText(path.join(outDir, "README.md"), createIndexMarkdown(workbench, validation));
  writeText(path.join(outDir, "PROMOTION_PLAN.md"), createPromotionPlanMarkdown(workbench, validation));
  writeText(path.join(outDir, "index.html"), createPreviewHtml(workbench, validation));
  writeJsonFile(path.join(outDir, "workbench-data.json"), createPreviewPayload(workbench, validation), { ensureDir: true });
  writeText(path.join(outDir, "workbench-preview.mjs"), createThreePreviewScript());
  copyThreeVendor(workbench.root, outDir);
  workbench.buildings.forEach((entry) => {
    const stamp = createStampDraft(entry.spec);
    writeJsonFile(path.join(outDir, "compiled-stamps", `${stamp.stampId}.json`), stamp, { ensureDir: true });
    writeText(path.join(outDir, "compiled-stamps", `${stamp.stampId}.txt`), `${formatRows(stamp.rows)}\n`);
  });
  workbench.settlements.forEach((entry) => {
    writeText(path.join(outDir, "settlements", `${entry.spec.settlementId}.md`), createSettlementMarkdown(entry.spec, buildingById));
  });
  return {
    outDir,
    validation
  };
}

function parseArgs(argv) {
  const args = argv.slice();
  let command = "validate";
  if (args[0] && !args[0].startsWith("--")) command = args.shift();
  const options = {};
  const requireValue = (arg, index) => {
    const value = args[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`${arg} requires a value`);
    return value;
  };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--root") {
      options.root = path.resolve(requireValue(arg, i));
      i += 1;
    } else if (arg === "--out") {
      options.outDir = path.resolve(requireValue(arg, i));
      i += 1;
    } else if (arg === "--settlement") {
      options.settlementId = requireValue(arg, i);
      i += 1;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else {
      throw new Error(`Unknown argument ${arg}`);
    }
  }
  return { command, options };
}

function runCli(argv) {
  const { command, options } = parseArgs(argv);
  const root = options.root || ROOT;
  const workbench = loadWorkbench(root);
  if (command === "validate") {
    const validation = validateWorkbench(workbench);
    console.log(`Validated building workbench: ${validation.archetypeCount} archetypes, ${validation.materialCount} materials, ${validation.conditionCount} conditions, ${validation.roadProfileCount} road profiles, ${validation.themeCount} themes, ${validation.buildingCount} buildings, ${validation.settlementCount} settlement drafts.`);
    return;
  }
  if (command === "preview") {
    const result = writePreview(workbench, options.outDir || path.join(root, "tmp", "world-building-workbench"));
    console.log(`Wrote building workbench preview to ${path.relative(root, result.outDir)}.`);
    return;
  }
  if (command === "promote") {
    if (!options.settlementId) throw new Error("promote requires --settlement <settlementId>");
    const result = writePromotionDryRun(workbench, options.settlementId, options.outDir || path.join(root, "tmp", "world-building-workbench", "promotions", options.settlementId));
    console.log(`Wrote building workbench promotion dry-run for ${result.draft.settlementId} to ${path.relative(root, result.outDir)}.`);
    return;
  }
  throw new Error(`Unknown command ${command}. Expected validate, preview, or promote.`);
}

if (require.main === module) {
  try {
    runCli(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  createStampDraft,
  loadWorkbench,
  validateWorkbench,
  writePreview,
  writePromotionDryRun
};
