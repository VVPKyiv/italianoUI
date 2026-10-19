import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": loadEnv(mode, ".", "ITALIANO_").ITALIANO_API_PROXY ?? "http://localhost:8000",
    },
  },
}));
