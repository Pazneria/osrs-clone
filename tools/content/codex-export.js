const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const { loadRuntimeItemCatalog } = require("./runtime-item-catalog");
const { loadWorldContent, loadWorldManifest } = require("./world-content");
const { loadTsModule } = require("../lib/ts-module-loader");
const {
  DEFAULT_CODEX_BASE_PATH,
  buildCodexEntityPath,
  getCodexRouteTemplates
} = require("../common/codex-link-contract");

const CODEX_EXPORT_SCHEMA_VERSION = 1;
const CODEX_EXPORT_FILENAMES = Object.freeze({
  enemies: "enemies.json",
  manifest: "manifest.json",
  items: "items.json",
  skills: "skills.json",
  worlds: "worlds.json"
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function readJson(absPath) {
  return JSON.parse(fs.readFileSync(absPath, "utf8"));
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function humanizeId(value) {
  return String(value || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function uniqueSorted(values) {
  return Array.from(new Set((Array.isArray(values) ? values : []).filter(Boolean))).sort();
}

function getSourceCommit(root) {
  try {
    return execSync("git rev-parse HEAD", {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch (error) {
    return "unknown";
  }
}

function createEntityIndex(rows, keyField) {
  return rows.map((row) => ({
    id: row[keyField],
    title: row.title,
    slug: row.slug,
    path: row.path
  }));
}

function collectEnemyDropItemRefs(enemy, location = "root", refs = []) {
  const dropTable = enemy && Array.isArray(enemy.dropTable) ? enemy.dropTable : [];
  for (let i = 0; i < dropTable.length; i++) {
    const entry = dropTable[i];
    if (!entry || typeof entry !== "object") continue;
    if (entry.kind !== "item") continue;
    const itemId = String(entry.itemId || "").trim();
    if (itemId) refs.push({ itemId, location: `${location}.dropTable[${i}].itemId` });
  }
  return refs;
}

function collectItemRefs(value, location = "root", refs = []) {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      collectItemRefs(value[i], `${location}[${i}]`, refs);
    }
    return refs;
  }

  if (!value || typeof value !== "object") return refs;

  const keys = Object.keys(value);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const child = value[key];
    const normalizedKey = key.toLowerCase();

    if (typeof child === "string" && normalizedKey.endsWith("itemid")) {
      const itemId = child.trim();
      if (itemId) refs.push({ itemId, location: `${location}.${key}` });
      continue;
    }

    if (Array.isArray(child)) {
      if (
        normalizedKey.endsWith("itemids")
        || normalizedKey === "toolids"
        || normalizedKey === "buys"
        || normalizedKey === "sells"
      ) {
        for (let j = 0; j < child.length; j++) {
          const itemId = typeof child[j] === "string" ? child[j].trim() : "";
          if (itemId) refs.push({ itemId, location: `${location}.${key}[${j}]` });
        }
      }
      collectItemRefs(child, `${location}.${key}`, refs);
      continue;
    }

    collectItemRefs(child, `${location}.${key}`, refs);
  }

  return refs;
}

function countWorldRoutes(skillRoutes) {
  const groups = skillRoutes && typeof skillRoutes === "object" ? skillRoutes : {};
  return Object.keys(groups).reduce((total, groupId) => {
    const rows = Array.isArray(groups[groupId]) ? groups[groupId] : [];
    return total + rows.length;
  }, 0);
}

function buildItemEntries(root) {
  const runtimeCatalog = loadRuntimeItemCatalog(root);
  const itemDefs = runtimeCatalog && runtimeCatalog.itemDefs ? runtimeCatalog.itemDefs : {};
  const itemIds = Object.keys(itemDefs).sort();
  const items = itemIds.map((itemId) => {
    const data = cloneJson(itemDefs[itemId]);
    const title = String(data.name || humanizeId(itemId));
    return {
      entityType: "item",
      itemId,
      title,
      slug: slugify(title),
      path: buildCodexEntityPath("item", itemId, { basePath: DEFAULT_CODEX_BASE_PATH }),
      data,
      relatedSkillIds: [],
      relatedEnemyIds: [],
      relatedWorldIds: []
    };
  });

  return {
    items,
    itemIdSet: new Set(itemIds)
  };
}

function buildSkillEntries(root, itemIdSet) {
  const skillsDir = path.join(root, "content", "skills");
  const filenames = fs.readdirSync(skillsDir).filter((filename) => filename.endsWith(".json")).sort();
  const skills = [];
  const merchantToSkillId = new Map();

  for (let i = 0; i < filenames.length; i++) {
    const filename = filenames[i];
    const absPath = path.join(skillsDir, filename);
    const data = readJson(absPath);
    const skillId = String(data.skillId || "").trim();

    assert(skillId, `${filename}: missing skillId`);
    assert(!skills.some((entry) => entry.skillId === skillId), `Duplicate skillId ${skillId}`);

    const title = humanizeId(skillId);
    const itemRefs = collectItemRefs(data, `skill:${skillId}`);
    const relatedItemIds = uniqueSorted(itemRefs.map((entry) => entry.itemId));
    for (let j = 0; j < relatedItemIds.length; j++) {
      const itemId = relatedItemIds[j];
      assert(itemIdSet.has(itemId), `${skillId}: unknown item reference ${itemId}`);
    }

    const merchantTable = data.economy && data.economy.merchantTable && typeof data.economy.merchantTable === "object"
      ? data.economy.merchantTable
      : {};
    const merchantIds = Object.keys(merchantTable).sort();
    for (let j = 0; j < merchantIds.length; j++) {
      const merchantId = String(merchantIds[j] || "").trim().toLowerCase();
      if (!merchantId) continue;
      assert(!merchantToSkillId.has(merchantId), `Merchant ${merchantId} belongs to multiple skills`);
      merchantToSkillId.set(merchantId, skillId);
    }

    skills.push({
      entityType: "skill",
      skillId,
      title,
      slug: slugify(title),
      path: buildCodexEntityPath("skill", skillId, { basePath: DEFAULT_CODEX_BASE_PATH }),
      data,
      relatedItemIds,
      relatedWorldIds: [],
      merchantIds
    });
  }

  return {
    skills,
    skillIdSet: new Set(skills.map((entry) => entry.skillId)),
    merchantToSkillId
  };
}

function buildWorldEntries(root, skillIdSet) {
  const manifest = loadWorldManifest(root);
  const worlds = [];

  const manifestWorlds = manifest && Array.isArray(manifest.worlds) ? manifest.worlds : [];
  for (let i = 0; i < manifestWorlds.length; i++) {
    const manifestEntry = manifestWorlds[i];
    const worldId = String(manifestEntry && manifestEntry.worldId ? manifestEntry.worldId : "").trim();
    assert(worldId, `world manifest entry ${i} missing worldId`);

    // Export reads the authored world payload directly; bundle validation checks the cross-entity links.
    const { world } = loadWorldContent(root, worldId);

    const relatedSkillIds = Object.keys(world.skillRoutes || {})
      .filter((groupId) => Array.isArray(world.skillRoutes[groupId]) && world.skillRoutes[groupId].length > 0)
      .sort();

    for (let j = 0; j < relatedSkillIds.length; j++) {
      const skillId = relatedSkillIds[j];
      assert(skillIdSet.has(skillId), `${worldId}: route group ${skillId} has no matching skill codex page`);
    }

    const services = Array.isArray(world.services) ? cloneJson(world.services) : [];
    const travelLinks = services
      .filter((service) => service && service.travelToWorldId)
      .map((service) => ({
        serviceId: service.serviceId,
        targetWorldId: service.travelToWorldId,
        path: buildCodexEntityPath("world", service.travelToWorldId, { basePath: DEFAULT_CODEX_BASE_PATH })
      }));

    worlds.push({
      entityType: "world",
      worldId,
      title: String(manifestEntry.label || humanizeId(worldId)),
      slug: slugify(String(manifestEntry.label || humanizeId(worldId))),
      path: buildCodexEntityPath("world", worldId, { basePath: DEFAULT_CODEX_BASE_PATH }),
      defaultSpawn: cloneJson(manifestEntry.defaultSpawn || null),
      manifestVersion: String(manifest.version || ""),
      regionFile: String(manifestEntry.regionFile || ""),
      stampIds: Array.isArray(manifestEntry.stampIds) ? manifestEntry.stampIds.slice() : [],
      serviceCount: services.length,
      structureCount: Array.isArray(world.structures) ? world.structures.length : 0,
      routeCount: countWorldRoutes(world.skillRoutes),
      relatedSkillIds,
      relatedEnemyIds: [],
      travelLinks,
      data: cloneJson(world)
    });
  }

  return {
    manifest,
    worlds,
    worldIdSet: new Set(worlds.map((entry) => entry.worldId))
  };
}

function buildEnemyEntries(root) {
  const combatContent = loadTsModule(path.join(root, "src", "game", "combat", "content.ts"));
  const enemyTypes = combatContent && typeof combatContent.listEnemyTypes === "function"
    ? combatContent.listEnemyTypes()
    : [];

  const enemies = enemyTypes.map((enemy) => {
    const data = cloneJson(enemy);
    const enemyId = String(data.enemyId || "").trim();
    const title = String(data.displayName || humanizeId(enemyId));
    return {
      entityType: "enemy",
      enemyId,
      title,
      slug: slugify(title),
      path: buildCodexEntityPath("enemy", enemyId, { basePath: DEFAULT_CODEX_BASE_PATH }),
      data,
      relatedItemIds: [],
      relatedWorldIds: []
    };
  });

  return {
    enemies,
    enemyIdSet: new Set(enemies.map((entry) => entry.enemyId)),
    enemyById: new Map(enemies.map((entry) => [entry.enemyId, entry]))
  };
}

function validateEntityCollection(rows, idField, entityLabel, entityType) {
  const ids = new Set();
  const slugs = new Set();
  const paths = new Set();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const id = String(row[idField] || "").trim();
    assert(id, `${entityLabel} at index ${i} is missing ${idField}`);
    assert(!ids.has(id), `Duplicate ${entityLabel} id ${id}`);
    ids.add(id);

    const slug = String(row.slug || "").trim();
    assert(slug, `${entityLabel} ${id} is missing slug`);
    assert(!slugs.has(slug), `Duplicate ${entityLabel} slug ${slug}`);
    slugs.add(slug);

    const expectedPath = buildCodexEntityPath(entityType, id, { basePath: DEFAULT_CODEX_BASE_PATH });
    assert(row.path === expectedPath, `${entityLabel} ${id} path mismatch`);
    assert(!paths.has(row.path), `Duplicate ${entityLabel} path ${row.path}`);
    paths.add(row.path);
  }
}

function validateCodexExportBundle(bundle) {
  assert(bundle && typeof bundle === "object", "codex export bundle is required");
  const manifest = bundle.manifest;
  assert(manifest && typeof manifest === "object", "codex export manifest is required");
  assert(manifest.schemaVersion === CODEX_EXPORT_SCHEMA_VERSION, "codex export schema version mismatch");
  assert(typeof manifest.generatedAt === "string" && manifest.generatedAt, "codex export manifest missing generatedAt");
  assert(typeof manifest.sourceCommit === "string" && manifest.sourceCommit, "codex export manifest missing sourceCommit");
  assert(manifest.basePath === DEFAULT_CODEX_BASE_PATH, "codex export manifest basePath mismatch");

  const items = Array.isArray(bundle.items) ? bundle.items : [];
  const skills = Array.isArray(bundle.skills) ? bundle.skills : [];
  const worlds = Array.isArray(bundle.worlds) ? bundle.worlds : [];
  const enemies = Array.isArray(bundle.enemies) ? bundle.enemies : [];

  validateEntityCollection(items, "itemId", "item", "item");
  validateEntityCollection(skills, "skillId", "skill", "skill");
  validateEntityCollection(worlds, "worldId", "world", "world");
  validateEntityCollection(enemies, "enemyId", "enemy", "enemy");

  const itemIds = new Set(items.map((entry) => entry.itemId));
  const skillIds = new Set(skills.map((entry) => entry.skillId));
  const worldIds = new Set(worlds.map((entry) => entry.worldId));
  const enemyIds = new Set(enemies.map((entry) => entry.enemyId));

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const relatedSkillIds = Array.isArray(item.relatedSkillIds) ? item.relatedSkillIds : [];
    for (let j = 0; j < relatedSkillIds.length; j++) {
      assert(skillIds.has(relatedSkillIds[j]), `item ${item.itemId} links to unknown skill ${relatedSkillIds[j]}`);
    }
    const relatedEnemyIds = Array.isArray(item.relatedEnemyIds) ? item.relatedEnemyIds : [];
    for (let j = 0; j < relatedEnemyIds.length; j++) {
      assert(enemyIds.has(relatedEnemyIds[j]), `item ${item.itemId} links to unknown enemy ${relatedEnemyIds[j]}`);
    }
    const relatedWorldIds = Array.isArray(item.relatedWorldIds) ? item.relatedWorldIds : [];
    for (let j = 0; j < relatedWorldIds.length; j++) {
      assert(worldIds.has(relatedWorldIds[j]), `item ${item.itemId} links to unknown world ${relatedWorldIds[j]}`);
    }
  }

  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];
    const relatedItemIds = Array.isArray(skill.relatedItemIds) ? skill.relatedItemIds : [];
    for (let j = 0; j < relatedItemIds.length; j++) {
      assert(itemIds.has(relatedItemIds[j]), `skill ${skill.skillId} links to unknown item ${relatedItemIds[j]}`);
    }
    const relatedWorldIds = Array.isArray(skill.relatedWorldIds) ? skill.relatedWorldIds : [];
    for (let j = 0; j < relatedWorldIds.length; j++) {
      assert(worldIds.has(relatedWorldIds[j]), `skill ${skill.skillId} links to unknown world ${relatedWorldIds[j]}`);
    }
  }

  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    const relatedItemIds = Array.isArray(enemy.relatedItemIds) ? enemy.relatedItemIds : [];
    for (let j = 0; j < relatedItemIds.length; j++) {
      assert(itemIds.has(relatedItemIds[j]), `enemy ${enemy.enemyId} links to unknown item ${relatedItemIds[j]}`);
    }
    const relatedWorldIds = Array.isArray(enemy.relatedWorldIds) ? enemy.relatedWorldIds : [];
    for (let j = 0; j < relatedWorldIds.length; j++) {
      assert(worldIds.has(relatedWorldIds[j]), `enemy ${enemy.enemyId} links to unknown world ${relatedWorldIds[j]}`);
    }
  }

  for (let i = 0; i < worlds.length; i++) {
    const world = worlds[i];
    const relatedSkillIds = Array.isArray(world.relatedSkillIds) ? world.relatedSkillIds : [];
    for (let j = 0; j < relatedSkillIds.length; j++) {
      assert(skillIds.has(relatedSkillIds[j]), `world ${world.worldId} links to unknown skill ${relatedSkillIds[j]}`);
    }

    const relatedEnemyIds = Array.isArray(world.relatedEnemyIds) ? world.relatedEnemyIds : [];
    for (let j = 0; j < relatedEnemyIds.length; j++) {
      assert(enemyIds.has(relatedEnemyIds[j]), `world ${world.worldId} links to unknown enemy ${relatedEnemyIds[j]}`);
    }

    const travelLinks = Array.isArray(world.travelLinks) ? world.travelLinks : [];
    for (let j = 0; j < travelLinks.length; j++) {
      const targetWorldId = String(travelLinks[j] && travelLinks[j].targetWorldId ? travelLinks[j].targetWorldId : "").trim();
      assert(worldIds.has(targetWorldId), `world ${world.worldId} has unresolved travel target ${targetWorldId}`);
    }

    const services = world.data && Array.isArray(world.data.services) ? world.data.services : [];
    for (let j = 0; j < services.length; j++) {
      const service = services[j];
      if (!service || !service.travelToWorldId) continue;
      const targetWorldId = String(service.travelToWorldId || "").trim();
      assert(worldIds.has(targetWorldId), `world ${world.worldId} service ${service.serviceId} references unknown world ${targetWorldId}`);
    }
  }

  assert(manifest.routes && typeof manifest.routes === "object", "codex export manifest missing routes");
  const expectedRoutes = getCodexRouteTemplates(DEFAULT_CODEX_BASE_PATH);
  assert(JSON.stringify(manifest.routes) === JSON.stringify(expectedRoutes), "codex export route templates mismatch");
  assert(JSON.stringify(manifest.files || {}) === JSON.stringify(CODEX_EXPORT_FILENAMES), "codex export file list mismatch");

  assert(manifest.counts && manifest.counts.items === items.length, "codex export item count mismatch");
  assert(manifest.counts && manifest.counts.skills === skills.length, "codex export skill count mismatch");
  assert(manifest.counts && manifest.counts.worlds === worlds.length, "codex export world count mismatch");
  assert(manifest.counts && manifest.counts.enemies === enemies.length, "codex export enemy count mismatch");

  const manifestIndexes = manifest.indexes || {};
  assert(JSON.stringify(manifestIndexes.items || []) === JSON.stringify(createEntityIndex(items, "itemId")), "codex export item index mismatch");
  assert(JSON.stringify(manifestIndexes.skills || []) === JSON.stringify(createEntityIndex(skills, "skillId")), "codex export skill index mismatch");
  assert(JSON.stringify(manifestIndexes.worlds || []) === JSON.stringify(createEntityIndex(worlds, "worldId")), "codex export world index mismatch");
  assert(JSON.stringify(manifestIndexes.enemies || []) === JSON.stringify(createEntityIndex(enemies, "enemyId")), "codex export enemy index mismatch");

  return bundle;
}

function buildCodexExportBundle(root, options = {}) {
  const { items, itemIdSet } = buildItemEntries(root);
  const { skills, skillIdSet } = buildSkillEntries(root, itemIdSet);
  const { worlds } = buildWorldEntries(root, skillIdSet);
  const { enemies, enemyIdSet, enemyById } = buildEnemyEntries(root);

  const skillToWorldIds = new Map(skills.map((skill) => [skill.skillId, []]));
  for (let i = 0; i < worlds.length; i++) {
    const world = worlds[i];
    for (let j = 0; j < world.relatedSkillIds.length; j++) {
      skillToWorldIds.get(world.relatedSkillIds[j]).push(world.worldId);
    }
  }

  const itemToSkillIds = new Map(items.map((item) => [item.itemId, []]));
  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];
    for (let j = 0; j < skill.relatedItemIds.length; j++) {
      itemToSkillIds.get(skill.relatedItemIds[j]).push(skill.skillId);
    }
  }

  const itemToEnemyIds = new Map(items.map((item) => [item.itemId, []]));
  const enemyToItemIds = new Map(enemies.map((enemy) => [enemy.enemyId, []]));
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    const enemyRefs = collectEnemyDropItemRefs(enemy.data, `enemy:${enemy.enemyId}`);
    const relatedItemIds = uniqueSorted(enemyRefs.map((entry) => entry.itemId));
    for (let j = 0; j < relatedItemIds.length; j++) {
      const itemId = relatedItemIds[j];
      assert(itemIdSet.has(itemId), `${enemy.enemyId}: unknown drop item ${itemId}`);
      enemyToItemIds.get(enemy.enemyId).push(itemId);
      itemToEnemyIds.get(itemId).push(enemy.enemyId);
    }
  }

  const worldToEnemyIds = new Map(worlds.map((world) => [world.worldId, []]));
  const enemyToWorldIds = new Map(enemies.map((enemy) => [enemy.enemyId, []]));
  for (let i = 0; i < worlds.length; i++) {
    const world = worlds[i];
    const combatSpawns = world.data && Array.isArray(world.data.combatSpawns) ? world.data.combatSpawns : [];
    const worldEnemyIds = new Set();
    for (let j = 0; j < combatSpawns.length; j++) {
      const spawn = combatSpawns[j];
      const enemyId = String(spawn && spawn.enemyId ? spawn.enemyId : "").trim();
      if (!enemyId) continue;
      assert(enemyIdSet.has(enemyId), `${world.worldId}: combat spawn ${spawn.spawnNodeId || j} references unknown enemy ${enemyId}`);
      worldEnemyIds.add(enemyId);
    }
    worldToEnemyIds.set(world.worldId, Array.from(worldEnemyIds).sort());
    for (const enemyId of worldEnemyIds) {
      enemyToWorldIds.get(enemyId).push(world.worldId);
    }
  }

  const skillById = new Map(skills.map((skill) => [skill.skillId, skill]));
  for (let i = 0; i < skills.length; i++) {
    skills[i].relatedWorldIds = uniqueSorted(skillToWorldIds.get(skills[i].skillId));
  }

  for (let i = 0; i < enemies.length; i++) {
    enemies[i].relatedItemIds = uniqueSorted(enemyToItemIds.get(enemies[i].enemyId));
    enemies[i].relatedWorldIds = uniqueSorted(enemyToWorldIds.get(enemies[i].enemyId));
  }

  for (let i = 0; i < worlds.length; i++) {
    worlds[i].relatedEnemyIds = uniqueSorted(worldToEnemyIds.get(worlds[i].worldId));
  }

  for (let i = 0; i < items.length; i++) {
    const relatedSkillIds = uniqueSorted(itemToSkillIds.get(items[i].itemId));
    items[i].relatedSkillIds = relatedSkillIds;
    items[i].relatedEnemyIds = uniqueSorted(itemToEnemyIds.get(items[i].itemId));
    items[i].relatedWorldIds = uniqueSorted(
      relatedSkillIds.flatMap((skillId) => {
        const skill = skillById.get(skillId);
        return skill ? skill.relatedWorldIds : [];
      }).concat(
        items[i].relatedEnemyIds.flatMap((enemyId) => {
          const enemy = enemyById.get(enemyId);
          return enemy ? enemy.relatedWorldIds : [];
        })
      )
    );
  }

  const manifest = {
    schemaVersion: CODEX_EXPORT_SCHEMA_VERSION,
    generatedAt: String(options.generatedAt || new Date().toISOString()),
    sourceCommit: String(options.sourceCommit || getSourceCommit(root)),
    basePath: DEFAULT_CODEX_BASE_PATH,
    routes: getCodexRouteTemplates(DEFAULT_CODEX_BASE_PATH),
    files: { ...CODEX_EXPORT_FILENAMES },
    counts: {
      items: items.length,
      skills: skills.length,
      worlds: worlds.length,
      enemies: enemies.length
    },
    indexes: {
      items: createEntityIndex(items, "itemId"),
      skills: createEntityIndex(skills, "skillId"),
      worlds: createEntityIndex(worlds, "worldId"),
      enemies: createEntityIndex(enemies, "enemyId")
    }
  };

  return validateCodexExportBundle({
    manifest,
    items,
    skills,
    worlds,
    enemies
  });
}

function writeCodexExportBundle(bundle, outDir) {
  const resolvedOutDir = path.resolve(outDir);
  fs.mkdirSync(resolvedOutDir, { recursive: true });
  fs.writeFileSync(path.join(resolvedOutDir, CODEX_EXPORT_FILENAMES.manifest), `${JSON.stringify(bundle.manifest, null, 2)}\n`);
  fs.writeFileSync(path.join(resolvedOutDir, CODEX_EXPORT_FILENAMES.items), `${JSON.stringify(bundle.items, null, 2)}\n`);
  fs.writeFileSync(path.join(resolvedOutDir, CODEX_EXPORT_FILENAMES.skills), `${JSON.stringify(bundle.skills, null, 2)}\n`);
  fs.writeFileSync(path.join(resolvedOutDir, CODEX_EXPORT_FILENAMES.worlds), `${JSON.stringify(bundle.worlds, null, 2)}\n`);
  fs.writeFileSync(path.join(resolvedOutDir, CODEX_EXPORT_FILENAMES.enemies), `${JSON.stringify(bundle.enemies, null, 2)}\n`);
  return resolvedOutDir;
}

function exportCodexBundle(root, outDir, options = {}) {
  const bundle = buildCodexExportBundle(root, options);
  if (outDir) writeCodexExportBundle(bundle, outDir);
  return bundle;
}

module.exports = {
  CODEX_EXPORT_SCHEMA_VERSION,
  CODEX_EXPORT_FILENAMES,
  buildCodexExportBundle,
  validateCodexExportBundle,
  writeCodexExportBundle,
  exportCodexBundle
};
