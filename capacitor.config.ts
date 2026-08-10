import type { CapacitorConfig } from "@capacitor/cli";

// The native apps bundle the static export as local assets and run fully
// offline (matching the web app's local-only architecture) rather than
// loading a remote URL, so there's no `server.url` here.
const config: CapacitorConfig = {
  appId: "com.kalekidana.zerodebt",
  appName: "Zero",
  webDir: "out",
  ios: {
    contentInset: "always",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
