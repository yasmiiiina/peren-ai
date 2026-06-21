import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/auth": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/plotly.js") || id.includes("node_modules/react-plotly.js")) {
            return "plotly";
          }
          if (id.includes("node_modules/html2canvas")) return "html2canvas";
          if (id.includes("node_modules/jspdf")) return "jspdf";
          if (id.includes("node_modules/framer-motion")) return "framer-motion";
          if (id.includes("node_modules/@paypal")) return "paypal";
          if (id.includes("node_modules/recharts")) return "recharts";
        },
      },
    },
  },
});
