import React, { useState, useEffect, useCallback } from "react";
import { Box, Text, Spacer } from "ink";
import chalk from "chalk";

import { ProgressBar } from "./ProgressBar.js";
import { StepList } from "./StepList.js";
import { runCommand } from "../commands.js";
import {
  VERSION,
  RN_VERSION,
  SCAFFOLD_STEPS,
} from "../constants.js";
import type { CommandType, ScaffoldData } from "../types.js";
import { downloadTemplate, cleanupTempDir } from "../downloader.js";
import { scaffoldProject } from "../scaffold.js";

interface AppProps {
  command: CommandType;
  cleanOption?: string;
  scaffoldData?: ScaffoldData;
}

export const App: React.FC<AppProps> = ({
  command,
  cleanOption,
  scaffoldData,
}) => {
  const [output, setOutput] = useState<string>("");
  const [status, setStatus] = useState<"running" | "success" | "error">(
    "running"
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(1);
  const [stepMessage, setStepMessage] = useState("");
  const [showSteps, setShowSteps] = useState(false);

  const handleStepChange = useCallback(
    (step: number, total: number, message: string, log?: string) => {
      setCurrentStep(step);
      setTotalSteps(total);
      if (message) setStepMessage(message);
      if (log) {
        setOutput((prev) => {
          const newOutput = prev + log;
          const lines = newOutput.split("\n");
          // Limit to last 10 lines to keep UI stable
          return lines.slice(-10).join("\n");
        });
      }
    },
    []
  );

  useEffect(() => {
    if (command === "scaffold" && scaffoldData) {
      setShowSteps(true);
      const executeScaffold = async () => {
        try {
          // Clear output for new command
          setOutput("");
          
          const downloadResult = await downloadTemplate({
            projectName: scaffoldData.projectName,
            onProgress: (msg) => handleStepChange(0, 7, msg),
          });

          if (!downloadResult.success) {
            setOutput(`❌ Failed to download template: ${downloadResult.error}`);
            setStatus("error");
            return;
          }

          const result = await scaffoldProject({
            ...scaffoldData,
            templatePath: downloadResult.templatePath,
            onProgress: handleStepChange,
          });

          await cleanupTempDir(downloadResult.tempDir);

          if (!result.success && result.error) {
            setOutput(`❌ Error during scaffold: ${result.error}`);
          } else {
            setOutput(result.output);
          }
          setStatus(result.success ? "success" : "error");
        } catch (err) {
          setOutput(err instanceof Error ? err.message : String(err));
          setStatus("error");
        }
      };
      executeScaffold();
    } else if (command === "version") {
      setOutput(`
⚡ Create React Native Init App
Version: ${VERSION}
React Native Template: ${RN_VERSION}

Usage:
  npm init react-native-init-app
  bun init react-native-init-app
  npx create-react-native-init-app
  bunx create-react-native-init-app
  rnia

Run 'create-react-native-init-app --help' for more information.
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
  npm init react-native-init-app
  npx create-react-native-init-app
  bunx create-react-native-init-app
  rnia

Examples:
  npm init react-native-init-app
  bunx create-react-native-init-app --help
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
    command === "scaffold" ? SCAFFOLD_STEPS : ["Processing..."];

  return (
    <Box
      flexDirection="column"
      padding={1}
      borderStyle="classic"
      borderColor="cyan"
    >
      <Box>
        <Text bold color="cyan">
          ⚡ Create React Native Init App
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
        <Box
          marginTop={1}
          padding={1}
          borderStyle="double"
          borderColor="gray"
          minHeight={18}
        >
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
