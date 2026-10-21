import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages: /drinkr/ — later, on drinkr.mindster.at: VITE_BASE_PATH=/
const base = (process.env.VITE_BASE_PATH || "/drinkr/").replace(/\/?$/, "/");

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png", "favicon.svg"],
      manifest: {
        id: base,
        name: "drinkR – Promille-Verlauf",
        short_name: "drinkR",
        description: "Interaktives Modell zur Schätzung des Blutalkoholverlaufs.",
        lang: "de-AT",
        start_url: base,
        scope: base,
        display: "standalone",
        theme_color: "#fafafa",
        background_color: "#f4f4f4",
        icons: [
          { src: `${base}icons/icon-192.png`, sizes: "192x192", type: "image/png" },
          { src: `${base}icons/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any maskable" }
        ]
      },
      workbox: {
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
        globPatterns: ["**/*.{js,css,html,svg,png,webmanifest}"]
      }
    })
  ]
});
