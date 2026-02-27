import fs from "node:fs/promises";
import path from "node:path";
import { execa } from "execa";
import { PM_COMMANDS } from "./constants.js";

const FILES_TO_COPY = [
  ".opencode",
  "src",
  "AGENTS.md",
  "opencode.json",
  "tsconfig.json",
  "babel.config.js",
  ".prettierrc.js",
  ".eslintrc.js",
  ".watchmanconfig",
  ".gitignore",
  "Gemfile",
  "jest.config.js",
  "metro.config.js",
  "index.js",
  "App.tsx",
  "__tests__",
  "vendor",
  ".bundle",
];

const FILES_TO_DELETE = ["App.tsx", "src", "__tests__"];

export interface ScaffoldOptions {
  projectName: string;
  bundleId: string;
  directory: string;
  packageManager: string;
  installDeps: boolean;
  podInstall: boolean;
  templatePath: string;
  onProgress?: (step: number, total: number, message: string, log?: string) => void;
}

async function pathExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath: string) {
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content);
}

async function writeJson(filePath: string, data: any) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function scaffoldProject(
  options: ScaffoldOptions
): Promise<{ success: boolean; output: string; error?: string }> {
  const {
    projectName,
    bundleId,
    directory,
    packageManager,
    installDeps,
    podInstall,
    templatePath,
    onProgress,
  } = options;

  const projectDir = path.resolve(directory);
  const totalSteps =
    5 +
    (installDeps ? 1 : 0) +
    (podInstall && process.platform === "darwin" ? 1 : 0);
  let step = 0;

  const runStreamed = async (
    cmd: string,
    args: string[],
    currentStep: number,
    message: string,
    cwd?: string
  ) => {
    const childProcess = execa(cmd, args, { cwd: cwd || process.cwd(), cleanup: true });

    childProcess.stdout?.on("data", (data) => {
      onProgress?.(currentStep, totalSteps, message, data.toString());
    });
    childProcess.stderr?.on("data", (data) => {
      onProgress?.(currentStep, totalSteps, message, data.toString());
    });

    return childProcess;
  };

  try {
    const initMessage = "Initializing React Native project...";
    onProgress?.(step, totalSteps, initMessage);

    await runStreamed(
      "npx",
      [
        "@react-native-community/cli",
        "init",
        projectName,
        "--directory",
        projectDir,
        "--package-name",
        bundleId,
        "--skip-install",
      ],
      step++,
      initMessage
      // No cwd here, run in current dir
    );

    onProgress?.(step++, totalSteps, "Cleaning up default files...");

    for (const file of FILES_TO_DELETE) {
      const filePath = path.join(projectDir, file);
      if (await pathExists(filePath)) {
        await fs.rm(filePath, { recursive: true, force: true });
      }
    }

    onProgress?.(step++, totalSteps, "Copying template files...");

    for (const file of FILES_TO_COPY) {
      const srcPath = path.join(templatePath, file);
      const destPath = path.join(projectDir, file);
      if (await pathExists(srcPath)) {
        await fs.cp(srcPath, destPath, { recursive: true });
      }
    }

    onProgress?.(step++, totalSteps, "Merging package.json...");

    const templatePackageJson = await readJson(
      path.join(templatePath, "package.json")
    );
    const newPackageJsonPath = path.join(projectDir, "package.json");
    const newPackageJson = await readJson(newPackageJsonPath);

    const mergedPackageJson = {
      ...newPackageJson,
      name: projectName.toLowerCase().replace(/-/g, "_"),
      version: templatePackageJson.version,
      dependencies: templatePackageJson.dependencies,
      devDependencies: templatePackageJson.devDependencies,
      scripts: templatePackageJson.scripts,
    };

    await writeJson(newPackageJsonPath, mergedPackageJson);

    const appJsonPath = path.join(projectDir, "app.json");
    const appJson = await readJson(appJsonPath);
    appJson.name = projectName;
    appJson.displayName = projectName;
    await writeJson(appJsonPath, appJson);

    onProgress?.(step, totalSteps, "Configuring git...");

    try {
      await execa("git", ["init"], { cwd: projectDir });
      await execa("git", ["add", "."], { cwd: projectDir });
      await execa(
        "git",
        ["commit", "-m", "chore: apply OpenCode Clean Architecture template"],
        { cwd: projectDir }
      );
    } catch {
      // Git skipped if not available
    }
    step++;

    if (installDeps) {
      const pm = PM_COMMANDS[packageManager as keyof typeof PM_COMMANDS];
      const installMessage = `Installing dependencies (${packageManager})...`;
      onProgress?.(step, totalSteps, installMessage);

      const [cmd, ...args] = pm.install.split(" ");
      await runStreamed(cmd, args, step++, installMessage, projectDir);

      if (podInstall && process.platform === "darwin") {
        const podMessage = "Running pod install...";
        onProgress?.(step, totalSteps, podMessage);
        await runStreamed("npm", ["run", "pod-install"], step++, podMessage, projectDir);
      }
    }

    const output = `
✅ Setup complete!

📂 Project location: ${projectDir}
📦 Project name: ${projectName}
📦 Package manager: ${packageManager}

Next steps:
  cd ${projectDir}
  ${PM_COMMANDS[packageManager as keyof typeof PM_COMMANDS].run(
    "start"
  )}   # Start Metro bundler
  ${PM_COMMANDS[packageManager as keyof typeof PM_COMMANDS].run(
    "ios"
  )} # Run on iOS
  ${PM_COMMANDS[packageManager as keyof typeof PM_COMMANDS].run(
    "android"
  )} # Run on Android
`;

    return { success: true, output };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, output: "", error: errorMessage };
  }
}
