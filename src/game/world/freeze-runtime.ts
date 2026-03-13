import type {
  LegacyWorldRuntimeDraft,
  SkillWorldRuntimeArtifacts
} from "../contracts/world";

import { materializeMiningRuntime } from "./mining-runtime";
import { createRuntimePublishResult } from "./runtime-publish";
import { materializeRunecraftingRuntime } from "./runecrafting-runtime";
import { materializeWoodcuttingRuntime } from "./woodcutting-runtime";

export function materializeSkillWorldRuntime(draft: LegacyWorldRuntimeDraft): SkillWorldRuntimeArtifacts {
  const miningRuntime = materializeMiningRuntime(draft);
  const runecraftingRuntime = materializeRunecraftingRuntime(draft, miningRuntime.runeEssenceRocks);
  const woodcuttingRuntime = materializeWoodcuttingRuntime(
    draft,
    miningRuntime.runeEssenceRocks,
    runecraftingRuntime.altarRenderPlacements,
    [...draft.staticMerchantRenderPlacements, ...runecraftingRuntime.merchantNpcRenderPlacements]
  );
  const publishResult = createRuntimePublishResult(
    draft,
    miningRuntime.miningRoutes,
    runecraftingRuntime.runecraftingRoutes,
    woodcuttingRuntime.woodcuttingRoutes,
    runecraftingRuntime.runtimeMerchantServices,
    runecraftingRuntime.merchantNpcDescriptors
  );

  return {
    miningRoutes: miningRuntime.miningRoutes.map((route) => ({
      ...route,
      tags: Array.isArray(route.tags) ? route.tags.slice() : []
    })),
    miningRockPlacements: miningRuntime.miningRockPlacements.map((placement) => ({ ...placement })),
    runecraftingRoutes: runecraftingRuntime.runecraftingRoutes.map((route) => ({
      ...route,
      tags: Array.isArray(route.tags) ? route.tags.slice() : []
    })),
    altarRenderPlacements: runecraftingRuntime.altarRenderPlacements.map((altar) => ({
      ...altar,
      tags: Array.isArray(altar.tags) ? altar.tags.slice() : []
    })),
    altarByRouteId: { ...runecraftingRuntime.altarByRouteId },
    runtimeMerchantServices: runecraftingRuntime.runtimeMerchantServices.map((service) => ({
      ...service,
      tags: Array.isArray(service.tags) ? service.tags.slice() : []
    })),
    merchantNpcDescriptors: publishResult.merchantNpcDescriptors.map((npc) => ({
      ...npc,
      tags: Array.isArray(npc.tags) ? npc.tags.slice() : []
    })),
    merchantNpcRenderPlacements: runecraftingRuntime.merchantNpcRenderPlacements.map((npc) => ({
      ...npc,
      tags: Array.isArray(npc.tags) ? npc.tags.slice() : []
    })),
    woodcuttingRoutes: woodcuttingRuntime.woodcuttingRoutes.map((route) => ({
      ...route,
      tags: Array.isArray(route.tags) ? route.tags.slice() : []
    })),
    woodcuttingTreePlacements: woodcuttingRuntime.woodcuttingTreePlacements.map((placement) => ({ ...placement })),
    showcasePlacements: woodcuttingRuntime.showcasePlacements.map((tree) => ({ ...tree })),
    runeEssenceRocks: miningRuntime.runeEssenceRocks.map((rock) => ({ ...rock })),
    publishedWorldState: {
      routeGroups: publishResult.publishedWorldState.routeGroups,
      runtimeServices: publishResult.publishedWorldState.runtimeServices,
      runtimeNpcs: publishResult.publishedWorldState.runtimeNpcs,
      altarByRouteId: publishResult.publishedWorldState.altarByRouteId
    }
  };
}
