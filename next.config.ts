import type { NextConfig } from "next";

// GitHub Pages serves this as a project page at
// https://<user>.github.io/Debt-Managing-APP/, so every asset and route
// needs that repo name as a base path. Set GITHUB_PAGES=true only in the
// Pages deploy workflow — local `npm run dev`/`npm run build` stay at "/".
const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGithubPages ? "/Debt-Managing-APP" : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
