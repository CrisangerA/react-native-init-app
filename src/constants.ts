import type { CleanOption } from "./types.js";

export const VERSION = "1.0.1";
export const RN_VERSION = "0.84.0";

export const PM_COMMANDS = {
  npm: { install: "npm install", run: (script: string) => `npm run ${script}` },
  yarn: { install: "yarn install", run: (script: string) => `yarn ${script}` },
  pnpm: { install: "pnpm install", run: (script: string) => `pnpm ${script}` },
  bun: { install: "bun install", run: (script: string) => `bun run ${script}` },
};

export const PROGRESS_BAR_WIDTH = 20;

export const CLEAN_OPTIONS: CleanOption[] = [
  {
    label: "Android",
    script: "clean-android",
    cleanMessage: "Android build folder cleaned",
  },
  {
    label: "iOS",
    script: "clean-ios",
    cleanMessage: "iOS build folder cleaned",
  },
  {
    label: "Node Modules",
    script: "clean-node",
    cleanMessage: "Node modules removed",
    destructive: true,
  },
  {
    label: "Watchman",
    script: "clean-watch",
    cleanMessage: "Watchman cache cleared",
  },
  {
    label: "All",
    script: "scaffold",
    cleanMessage: "All caches cleaned",
    destructive: true,
  },
];

export const SCAFFOLD_STEPS = [
  "Initializing React Native project...",
  "Cleaning up default files...",
  "Copying template files...",
  "Merging package.json...",
  "Configuring git...",
  "Installing dependencies...",
  "Running pod install...",
];
