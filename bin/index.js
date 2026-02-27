#!/usr/bin/env node

import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

require(join(__dirname, "../node_modules/tsx/dist/cli.mjs"), [
  join(__dirname, "../src/cli.tsx"),
]);
