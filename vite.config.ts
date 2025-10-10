import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === "production";

  return {
    server: {
      host: "::",
      port: 8080,
      https: {
        key: fs.readFileSync(path.resolve(__dirname, "server/certs/key.pem")),
        cert: fs.readFileSync(path.resolve(__dirname, "server/certs/cert.pem")),
      },
      proxy: {
        "/api": {
          target: "https://localhost:3011", // backend HTTPS
          changeOrigin: true,
          secure: false, // allow self-signed certs
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
