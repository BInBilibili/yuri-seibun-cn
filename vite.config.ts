import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/yuri-seibun-cn/",
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1500
  }
});
