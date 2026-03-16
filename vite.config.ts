import { defineConfig, loadEnv } from "vite";
import { createAnimationStudioDevMiddleware } from "./src/game/animation/dev-bridge";

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
      target: "es2020"
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
