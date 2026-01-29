import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
      "drizzle-orm": path.resolve(__dirname, "../node_modules/drizzle-orm"),
      "drizzle-zod": path.resolve(__dirname, "../node_modules/drizzle-zod"),
      "zod": path.resolve(__dirname, "../node_modules/zod"),
    },
  },
  server: {
    fs: {
      allow: [".."],
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../dist/public"),
    emptyOutDir: true,
    commonjsOptions: {
      include: [/shared/, /node_modules/],
    },
  },
});