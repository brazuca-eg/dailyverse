// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL ?? "https://dailyverse-phi.vercel.app",
  integrations: [react()],
  vite: { build: { assetsInlineLimit: 0 } },
});
