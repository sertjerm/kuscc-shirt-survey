import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  console.log("VITE_BASE_PATH:", env.VITE_BASE_PATH, "MODE:", mode);
  return {
    base: env.VITE_BASE_PATH || "/",
    plugins: [react()],
    server: {
      port: 3000,
      host: true,
    },
    build: {
      outDir: "dist",
      sourcemap: false,
    },
    preview: {
      port: 5000,
      host: true,
    },
  };
});
