import { defineConfig, loadEnv } from "vite";
import { createAnimationStudioDevMiddleware } from "./src/game/animation/dev-bridge";

function getManualChunkName(id: string): string | undefined {
  const normalizedId = id.replace(/\\/g, "/");
  if (normalizedId.includes("/node_modules/three/")) return "vendor-three";

  const rawLegacyChunkName = getRawLegacyScriptChunkName(normalizedId);
  if (rawLegacyChunkName) return rawLegacyChunkName;

  const legacyDomainMarker = "/src/game/platform/legacy-scripts/";
  const legacyDomainIndex = normalizedId.indexOf(legacyDomainMarker);
  if (legacyDomainIndex === -1) return undefined;

  const legacyDomainFile = normalizedId.slice(legacyDomainIndex + legacyDomainMarker.length);
  const legacyDomainName = legacyDomainFile.replace(/\.ts$/, "");
  return legacyDomainName ? `legacy-${legacyDomainName}` : undefined;
}

function getRawLegacyScriptChunkName(normalizedId: string): string | undefined {
  if (!normalizedId.includes("?raw")) return undefined;

  const legacyScriptMarker = "/src/js/";
  const legacyScriptIndex = normalizedId.indexOf(legacyScriptMarker);
  if (legacyScriptIndex === -1) return undefined;

  const legacyScriptPath = normalizedId
    .slice(legacyScriptIndex + legacyScriptMarker.length)
    .replace(/\?.*$/, "");

  if (legacyScriptPath === "world.js") return "legacy-world-shell";
  if (legacyScriptPath.startsWith("world/")) return "legacy-world-runtime";
  if (legacyScriptPath.startsWith("skills/specs/")) return "legacy-skills-specs";

  const skillRuntimeMatch = /^skills\/([^/]+)\//.exec(legacyScriptPath);
  if (skillRuntimeMatch) return `legacy-skill-${skillRuntimeMatch[1]}`;
  if (legacyScriptPath.startsWith("skills/")) return "legacy-skills-core";

  return undefined;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const devPort = Number(env.PORT || 5502);

  return {
    base: "./",
    server: {
      port: Number.isFinite(devPort) ? devPort : 5502,
      strictPort: false,
      open: true
    },
    preview: {
      port: 5501,
      strictPort: true
    },
    build: {
      target: "es2020",
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks: getManualChunkName
        }
      }
    },
    plugins: [
      {
        name: "animation-studio-dev-bridge",
        configureServer(server) {
          server.middlewares.use(createAnimationStudioDevMiddleware("."));
        }
      }
    ]
  };
});
