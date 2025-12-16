import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { REAL_API_BASE_URL } from "./src/utils/constants";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  console.log("VITE_BASE_PATH:", env.VITE_BASE_PATH, "MODE:", mode);
  return {
    base: env.VITE_BASE_PATH || "/",
    plugins: [react()],
    define: {
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
      __BUILD_DATE_LOCAL__: JSON.stringify(
        new Date().toLocaleString("th-TH", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      ),
    },
    server: {
      port: 3000,
      host: true,
      proxy: {
        // สมมุติ frontend เรียก /api จะถูก proxy ไปที่ WCF
        "/api": {
          target: REAL_API_BASE_URL,
          changeOrigin: true,
          secure: false,
          // ถ้าต้องการส่ง cookie
          // configure: (proxy, options) => {
          //   proxy.on('proxyReq', (proxyReq, req, res) => {
          //     proxyReq.setHeader('Origin', 'https://apps4.coop.ku.ac.th');
          //   });
          // }
        },
      },
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
