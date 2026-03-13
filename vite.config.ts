import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5500,
    strictPort: true,
    open: true
  },
  preview: {
    port: 5501,
    strictPort: true
  },
  build: {
    target: "es2020"
  }
});
