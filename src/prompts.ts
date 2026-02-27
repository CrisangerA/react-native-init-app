import chalk from "chalk";
import enquirer from "enquirer";
import path from "path";

import type { PromptResult } from "./types.js";
import { CLEAN_OPTIONS } from "./constants.js";
import {
  validateProjectName,
  validateBundleId,
  validateDirectory,
} from "./validators.js";

function printHeader(): void {
  console.log(chalk.cyan("\n⚡ Create React Native Init App\n"));
  console.log(
    chalk.dim("Create React Native projects with Clean Architecture\n")
  );
}

async function confirmAction(message: string): Promise<boolean> {
  const { confirmed } = await enquirer.prompt<{ confirmed: boolean }>({
    type: "confirm",
    name: "confirmed",
    message,
    initial: false,
  });
  return confirmed;
}

async function promptScaffoldData(): Promise<PromptResult> {
  // 1. Get project name first to use it as a base for other defaults
  const { projectName } = await enquirer.prompt<{ projectName: string }>({
    type: "input",
    name: "projectName",
    message: "What is the name of your project?",
    initial: "MyApp",
    validate: validateProjectName,
  });

  // 2. Use Form for remaining text inputs with dynamic defaults
  const { formData } = await enquirer.prompt<{
    formData: {
      bundleId: string;
      directory: string;
    };
  }>({
    type: "form",
    name: "formData",
    message: "Please provide the project configuration:",
    choices: [
      {
        name: "bundleId",
        message: "Bundle Identifier",
        initial: `com.company.${projectName.toLowerCase()}`,
        validate: validateBundleId,
      },
      {
        name: "directory",
        message: "Target Directory",
        initial: path.resolve(process.cwd(), projectName),
        validate: validateDirectory,
      },
    ],
  });

  const { bundleId, directory } = formData;

  const { packageManager } = await enquirer.prompt<{
    packageManager: string;
  }>({
    type: "select",
    name: "packageManager",
    message: "Which package manager do you want to use?",
    choices: [
      { name: "npm", message: "npm" },
      { name: "yarn", message: "Yarn" },
      { name: "pnpm", message: "pnpm" },
      { name: "bun", message: "Bun" },
    ],
    initial: 3,
  });

  const { options } = await enquirer.prompt<{ options: string[] }>({
    type: "multiselect",
    name: "options",
    message: "Select additional setup steps:",
    hint: "(Press <space> to select, <return> to submit, or just <enter> to skip all)",
    choices: [
      { name: "installDeps", message: "Install dependencies" },
      { name: "podInstall", message: "Run pod install (iOS)" },
    ],
  });

  return {
    command: "scaffold",
    scaffoldData: {
      projectName,
      bundleId,
      directory,
      packageManager,
      installDeps: options.includes("installDeps"),
      podInstall: options.includes("podInstall"),
    },
  };
}

async function promptCleanOption(): Promise<PromptResult> {
  const { cleanOption } = await enquirer.prompt<{ cleanOption: string }>({
    type: "select",
    name: "cleanOption",
    message: "🧹  What do you want to clean?",
    choices: CLEAN_OPTIONS.map((opt) => ({
      name: opt.label,
      message: opt.label + (opt.destructive ? " ⚠️" : ""),
    })),
  });

  const selectedOption = CLEAN_OPTIONS.find((opt) => opt.label === cleanOption);

  if (selectedOption?.destructive) {
    const confirmed = await confirmAction(
      `⚠️  This will delete ${
        cleanOption === "All" ? "all caches" : cleanOption
      }. Are you sure?`
    );
    if (!confirmed) {
      return runPrompt();
    }
  }

  return { command: "clean", cleanOption };
}

export async function runPrompt(): Promise<PromptResult> {
  printHeader();

  const { command } = await enquirer.prompt<{ command: string }>({
    type: "select",
    name: "command",
    message: "Select a command:",
    choices: [
      {
        name: "scaffold",
        message: "🚀 Create New Project",
        hint: "Create new project from template",
      },
      {
        name: "clean",
        message: "🧹  Clean",
        hint: "Clean caches and build folders",
      },
      {
        name: "pod-install",
        message: "📦  Pod Install",
        hint: "Install CocoaPods dependencies",
      },
      {
        name: "run-android",
        message: "🤖  Run Android",
        hint: "Run app on Android device/emulator",
      },
      {
        name: "version",
        message: "ℹ️  Version",
        hint: "Show CLI version and info",
      },
      {
        name: "help",
        message: "❓  Help",
        hint: "Show available commands",
      },
    ],
  });

  if (command === "scaffold") {
    return promptScaffoldData();
  }

  if (command === "clean") {
    return promptCleanOption();
  }

  return { command };
}
