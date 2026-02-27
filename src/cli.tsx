#!/usr/bin/env node

import React from "react";
import { render } from "ink";
import chalk from "chalk";

import { runPrompt } from "./prompts.js";
import { App } from "./components/App.js";
import type { CommandType } from "./types.js";

async function main() {
  try {
    const { command, cleanOption, scaffoldData } = await runPrompt();

    // Clear screen before starting the Ink app
    process.stdout.write("\n".repeat(50));
    console.clear();

    const { unmount } = render(
      <App
        command={command as CommandType}
        cleanOption={cleanOption}
        scaffoldData={scaffoldData}
      />
    );

    // Ensure graceful exit on Ctrl+C
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
      console.log(chalk.yellow("\n❌ Cancelled by user"));
      process.exit(0);
    }
    console.error(chalk.red("\n❌ Error:"), error);
    process.exit(1);
  }
}

main();
