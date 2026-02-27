import { build } from "bun";
import fs from "fs";
import path from "path";

console.log("🚀 Building CLI with Bun...");

const result = await Bun.build({
  entrypoints: ["./src/cli.tsx"],
  outdir: "./bin",
  target: "node",
  minify: true,
  naming: "index.js",
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});

if (!result.success) {
  console.error("❌ Build failed");
  for (const message of result.logs) {
    console.error(message);
  }
  process.exit(1);
}

// Ensure the output file exists
const outfile = path.join(process.cwd(), "bin/index.js");

if (fs.existsSync(outfile)) {
  const content = fs.readFileSync(outfile, "utf-8");
  // Prepend shebang if not present
  if (!content.startsWith("#!/usr/bin/env node")) {
    fs.writeFileSync(outfile, "#!/usr/bin/env node\n" + content);
  }
  // Make it executable
  fs.chmodSync(outfile, "755");
}

console.log("✅ Build complete! Binary generated at bin/index.js");
