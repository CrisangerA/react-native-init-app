#!/usr/bin/env node

import React, { useState, useEffect, useCallback } from "react";
import { render, Box, Text, Spacer } from "ink";
import { execa } from "execa";
import chalk from "chalk";
import enquirer from "enquirer";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import {
  downloadTemplate,
  cleanupTempDir,
  type DownloadResult,
} from "./downloader.js";
import { scaffoldProject } from "./scaffold.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VERSION = "1.0.0";
const RN_VERSION = "0.84.0";

const PM_COMMANDS = {
  npm: { install: "npm install", run: (script: string) => `npm run ${script}` },
  yarn: { install: "yarn install", run: (script: string) => `yarn ${script}` },
  pnpm: { install: "pnpm install", run: (script: string) => `pnpm ${script}` },
  bun: { install: "bun install", run: (script: string) => `bun run ${script}` },
};

process.on("SIGINT", () => {
  process.exit(0);
});

type CommandType =
  | "scaffold"
  | "clean"
  | "pod-install"
  | "run-android"
  | "version"
  | "help";

interface CleanOption {
  label: string;
  script: string;
  cleanMessage: string;
  destructive?: boolean;
}

const cleanOptions: CleanOption[] = [
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

const scaffoldSteps = [
  "Initializing React Native project...",
  "Cleaning up default files...",
  "Copying template files...",
  "Merging package.json...",
  "Configuring git...",
  "Installing dependencies...",
  "Running pod install...",
];

function validateProjectName(value: string) {
  if (!value) return "Project name is required";
  if (/\s/.test(value)) return "Project name cannot contain spaces";
  if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(value)) {
    return "Project name must start with a letter and contain only letters and numbers";
  }
  return true;
}

function validateBundleId(value: string) {
  if (!value) return "Bundle ID is required";
  if (!/^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/.test(value)) {
    return "Invalid bundle ID format (e.g., com.company.myapp)";
  }
  return true;
}

function validateDirectory(value: string) {
  if (!value) return "Directory is required";
  if (fs.existsSync(value) && fs.readdirSync(value).length > 0) {
    return "Directory already exists and is not empty";
  }
  return true;
}

function printHeader() {
  console.log(chalk.cyan("\n⚡ React Native Init App\n"));
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

async function runEnquirerPrompt(): Promise<{
  command: string;
  cleanOption?: string;
  scaffoldData?: {
    projectName: string;
    bundleId: string;
    directory: string;
    packageManager: string;
    installDeps: boolean;
    podInstall: boolean;
  };
}> {
  printHeader();

  const { command } = await enquirer.prompt<{ command: string }>({
    type: "select",
    name: "command",
    message: "Select a command:",
    choices: [
      {
        name: "scaffold",
        message: "🆕  Scaffold",
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

  if (command === "version" || command === "help") {
    return { command };
  }

  if (command === "scaffold") {
    const { projectName } = await enquirer.prompt<{ projectName: string }>({
      type: "text",
      name: "projectName",
      message: "What is the name of your project?",
      initial: "MyApp",
      validate: validateProjectName,
    });

    const { bundleId } = await enquirer.prompt<{ bundleId: string }>({
      type: "text",
      name: "bundleId",
      message: "What is the bundle identifier?",
      initial: `com.company.${projectName.toLowerCase()}`,
      validate: validateBundleId,
    });

    const { directory } = await enquirer.prompt<{ directory: string }>({
      type: "text",
      name: "directory",
      message: "Where should the project be created?",
      initial: path.resolve(process.cwd(), projectName),
      validate: validateDirectory,
    });

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

    const { installDeps } = await enquirer.prompt<{ installDeps: boolean }>({
      type: "confirm",
      name: "installDeps",
      message: "Do you want to install dependencies after setup?",
      initial: true,
    });

    const { podInstall } = await enquirer.prompt<{ podInstall: boolean }>({
      type: "confirm",
      name: "podInstall",
      message: "Do you want to run pod install for iOS? (macOS only)",
      initial: true,
    });

    return {
      command,
      scaffoldData: {
        projectName,
        bundleId,
        directory,
        packageManager,
        installDeps,
        podInstall,
      },
    };
  }

  if (command === "clean") {
    const { cleanOption } = await enquirer.prompt<{ cleanOption: string }>({
      type: "select",
      name: "cleanOption",
      message: "🧹  What do you want to clean?",
      choices: cleanOptions.map((opt) => ({
        name: opt.label,
        message: opt.label + (opt.destructive ? " ⚠️" : ""),
      })),
    });

    const selectedOption = cleanOptions.find(
      (opt) => opt.label === cleanOption
    );
    if (selectedOption?.destructive) {
      const confirmed = await confirmAction(
        `⚠️  This will delete ${
          cleanOption === "All" ? "all caches" : cleanOption
        }. Are you sure?`
      );
      if (!confirmed) {
        return runEnquirerPrompt();
      }
    }

    return { command, cleanOption };
  }

  return { command };
}

async function runCommand(
  commandType: CommandType,
  cleanOption?: string,
  onStepChange?: (step: number, total: number, message: string) => void
): Promise<{ success: boolean; output: string }> {
  try {
    let cmd: string;
    let args: string[] = [];

    switch (commandType) {
      case "clean": {
        const selectedClean = cleanOptions.find(
          (opt) => opt.label === cleanOption
        );
        if (!selectedClean) {
          throw new Error("Invalid clean option");
        }
        if (cleanOption === "All") {
          onStepChange?.(0, 4, "Cleaning Android...");
          await execa("npm", ["run", "clean-android"]);
          onStepChange?.(1, 4, "Cleaning iOS...");
          await execa("npm", ["run", "clean-ios"]);
          onStepChange?.(2, 4, "Cleaning Node Modules...");
          await execa("npm", ["run", "clean-node"]);
          onStepChange?.(3, 4, "Cleaning Watchman...");
          await execa("npm", ["run", "clean-watch"]);
          onStepChange?.(4, 4, "All cleaned!");
          return {
            success: true,
            output: "✅ All caches cleaned successfully!",
          };
        }
        cmd = "npm";
        args = ["run", selectedClean.script];
        break;
      }
      case "pod-install":
        cmd = "npm";
        args = ["run", "pod-install"];
        break;
      case "run-android":
        cmd = "npm";
        args = ["run", "android"];
        break;
      default:
        throw new Error("Unknown command");
    }

    const result = await execa(cmd, args, {
      stdio: "inherit",
      cleanup: true,
    });

    return {
      success: true,
      output: result.stdout || "✅ Command completed successfully!",
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, output: `❌ Error: ${errorMessage}` };
  }
}

const ProgressBar: React.FC<{
  current: number;
  total: number;
  label: string;
}> = ({ current, total, label }) => {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * 20);
  const empty = 20 - filled;

  return (
    <Box flexDirection="column">
      <Box>
        <Text color="cyan">{label}</Text>
      </Box>
      <Box>
        <Text color="green">{">".repeat(filled)}</Text>
        <Text color="gray">{"-".repeat(empty)}</Text>
        <Text> {percentage}%</Text>
      </Box>
    </Box>
  );
};

const StepList: React.FC<{ steps: string[]; currentStep: number }> = ({
  steps,
  currentStep,
}) => {
  return (
    <Box flexDirection="column" gap={0}>
      {steps.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <Box key={index}>
            <Text color="gray">
              {isComplete ? "✓" : isCurrent ? "→" : " "} {step}
            </Text>
            {isComplete && <Text color="green"> ✓</Text>}
            {isCurrent && <Text color="yellow"> (in progress...)</Text>}
          </Box>
        );
      })}
    </Box>
  );
};

const App: React.FC<{
  command: CommandType;
  cleanOption?: string;
  scaffoldData?: {
    projectName: string;
    bundleId: string;
    directory: string;
    packageManager: string;
    installDeps: boolean;
    podInstall: boolean;
  };
}> = ({ command, cleanOption, scaffoldData }) => {
  const [output, setOutput] = useState<string>("");
  const [status, setStatus] = useState<"running" | "success" | "error">(
    "running"
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(1);
  const [stepMessage, setStepMessage] = useState("");
  const [showSteps, setShowSteps] = useState(false);
  const [downloadResult, setDownloadResult] = useState<DownloadResult | null>(
    null
  );

  const handleStepChange = useCallback(
    (step: number, total: number, message: string) => {
      setCurrentStep(step);
      setTotalSteps(total);
      setStepMessage(message);
    },
    []
  );

  useEffect(() => {
    if (command === "scaffold" && scaffoldData) {
      setShowSteps(true);

      const runScaffold = async () => {
        try {
          const downloadResult = await downloadTemplate({
            projectName: scaffoldData.projectName,
            onProgress: (msg) => handleStepChange(0, 7, msg),
          });

          if (!downloadResult.success) {
            setOutput(
              `❌ Failed to download template: ${downloadResult.error}`
            );
            setStatus("error");
            return;
          }

          setDownloadResult(downloadResult);

          const result = await scaffoldProject({
            ...scaffoldData,
            templatePath: downloadResult.templatePath,
            onProgress: handleStepChange,
          });

          await cleanupTempDir(downloadResult.tempDir);

          setOutput(result.output);
          setStatus(result.success ? "success" : "error");
        } catch (err) {
          setOutput(err instanceof Error ? err.message : String(err));
          setStatus("error");
        }
      };

      runScaffold();
    } else if (command === "version") {
      setOutput(`
⚡ React Native Init App
Version: ${VERSION}
React Native Template: ${RN_VERSION}

Usage:
  npx react-native-init-app
  bunx react-native-init-app
  rnia

Run 'react-native-init-app --help' for more information.
`);
      setStatus("success");
    } else if (command === "help") {
      setOutput(`
⚡ Available Commands:

🆕  scaffold    - Create new React Native project from template
🧹  clean       - Clean caches and build folders
   • Android    - Clean Android build folder
   • iOS        - Clean iOS build folder
   • Node Mods  - Remove node_modules
   • Watchman   - Clear Watchman cache
   • All        - Clean everything
📦  pod-install - Install CocoaPods dependencies
🤖  run-android - Run app on Android device/emulator

Usage:
  npx react-native-init-app
  bunx react-native-init-app
  rnia

Examples:
  npx react-native-init-app
  bunx react-native-init-app --help
`);
      setStatus("success");
    } else {
      runCommand(command, cleanOption, handleStepChange)
        .then((result) => {
          setOutput(result.output);
          setStatus(result.success ? "success" : "error");
        })
        .catch((err) => {
          setOutput(err.message);
          setStatus("error");
        });
    }
  }, [command, cleanOption, scaffoldData, handleStepChange]);

  const statusColor =
    status === "running"
      ? chalk.yellow
      : status === "success"
      ? chalk.green
      : chalk.red;
  const statusText =
    status === "running"
      ? "⏳ Running"
      : status === "success"
      ? "✅ Success"
      : "❌ Error";

  const commandLabels: Record<CommandType, string> = {
    scaffold: scaffoldData
      ? `Scaffold: ${scaffoldData.projectName}`
      : "Scaffold New Project",
    clean: cleanOption ? `Clean ${cleanOption}` : "Clean",
    "pod-install": "Pod Install",
    "run-android": "Run Android",
    version: "Version Info",
    help: "Help",
  };

  const dynamicSteps =
    command === "scaffold" ? scaffoldSteps : ["Processing..."];

  return (
    <Box
      flexDirection="column"
      padding={1}
      borderStyle="round"
      borderColor="cyan"
    >
      <Box>
        <Text bold color="cyan">
          ⚡ React Native Init App
        </Text>
      </Box>
      <Spacer />
      <Box>
        <Text color="gray">Command: </Text>
        <Text bold>{commandLabels[command]}</Text>
      </Box>
      <Box>
        <Text color="gray">Status: </Text>
        <Text color={statusColor(status)}>{statusText}</Text>
      </Box>
      {showSteps && status === "running" && (
        <>
          <Spacer />
          <StepList steps={dynamicSteps} currentStep={currentStep} />
          <Spacer />
          <ProgressBar
            current={currentStep}
            total={totalSteps}
            label={stepMessage}
          />
        </>
      )}
      <Spacer />
      <Box flexDirection="column">
        <Text bold color="gray">
          Output:
        </Text>
        <Box marginTop={1} padding={1} borderStyle="single" borderColor="gray">
          <Text>{output || (status === "running" ? "Processing..." : "")}</Text>
        </Box>
      </Box>
      <Spacer />
      <Text color="gray" italic>
        Press Ctrl+C to exit
      </Text>
    </Box>
  );
};

async function main() {
  try {
    const { command, cleanOption, scaffoldData } = await runEnquirerPrompt();

    process.stdout.write("\n".repeat(50));
    console.clear();

    const { unmount } = render(
      <App
        command={command as CommandType}
        cleanOption={cleanOption}
        scaffoldData={scaffoldData}
      />
    );

    process.on("SIGINT", () => {
      unmount();
      process.exit(0);
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "isCancel" in error &&
      (error as { isCancel?: boolean }).isCancel
    ) {
      chalk.yellow("\n❌ Cancelled by user");
      process.exit(0);
    }
    chalk.red("\n❌ Error:", error);
    process.exit(1);
  }
}

main();
