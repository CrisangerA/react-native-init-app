import { execa } from "execa";

import type { CommandType, ProgressCallback } from "./types.js";
import { CLEAN_OPTIONS } from "./constants.js";

interface CommandResult {
  success: boolean;
  output: string;
}

interface CommandHandler {
  execute(
    cleanOption?: string,
    onStepChange?: ProgressCallback
  ): Promise<CommandResult>;
}

class CleanCommandHandler implements CommandHandler {
  async execute(
    cleanOption?: string,
    onStepChange?: ProgressCallback
  ): Promise<CommandResult> {
    const selectedClean = CLEAN_OPTIONS.find(
      (opt) => opt.label === cleanOption
    );

    if (!selectedClean) {
      return { success: false, output: "❌ Error: Invalid clean option" };
    }

    if (cleanOption === "All") {
      return this.cleanAll(onStepChange);
    }

    return this.cleanSingle(selectedClean.script, onStepChange);
  }

  private async cleanAll(
    onStepChange?: ProgressCallback
  ): Promise<CommandResult> {
    const steps = [
      { script: "clean-android", message: "Cleaning Android..." },
      { script: "clean-ios", message: "Cleaning iOS..." },
      { script: "clean-node", message: "Cleaning Node Modules..." },
      { script: "clean-watch", message: "Cleaning Watchman..." },
    ];

    for (let i = 0; i < steps.length; i++) {
      onStepChange?.(i, steps.length, steps[i].message);
      await this.runStreamed("npm", ["run", steps[i].script], onStepChange, i, steps.length);
    }

    onStepChange?.(steps.length, steps.length, "All cleaned!");
    return { success: true, output: "✅ All caches cleaned successfully!" };
  }

  private async cleanSingle(script: string, onStepChange?: ProgressCallback): Promise<CommandResult> {
    await this.runStreamed("npm", ["run", script], onStepChange, 0, 1);
    return { success: true, output: "✅ Command completed successfully!" };
  }

  private async runStreamed(
    cmd: string,
    args: string[],
    onStepChange?: ProgressCallback,
    step: number = 0,
    total: number = 1
  ): Promise<void> {
    const childProcess = execa(cmd, args, { cleanup: true });
    
    childProcess.stdout?.on("data", (data) => {
      onStepChange?.(step, total, "", data.toString());
    });
    childProcess.stderr?.on("data", (data) => {
      onStepChange?.(step, total, "", data.toString());
    });

    await childProcess;
  }
}

class PodInstallHandler implements CommandHandler {
  async execute(
    _?: string,
    onStepChange?: ProgressCallback
  ): Promise<CommandResult> {
    const childProcess = execa("npm", ["run", "pod-install"], { cleanup: true });

    childProcess.stdout?.on("data", (data) => {
      onStepChange?.(0, 1, "Running pod install...", data.toString());
    });
    childProcess.stderr?.on("data", (data) => {
      onStepChange?.(0, 1, "Running pod install...", data.toString());
    });

    await childProcess;
    return {
      success: true,
      output: "✅ Command completed successfully!",
    };
  }
}

class RunAndroidHandler implements CommandHandler {
  async execute(
    _?: string,
    onStepChange?: ProgressCallback
  ): Promise<CommandResult> {
    const childProcess = execa("npm", ["run", "android"], { cleanup: true });

    childProcess.stdout?.on("data", (data) => {
      onStepChange?.(0, 1, "Running on Android...", data.toString());
    });
    childProcess.stderr?.on("data", (data) => {
      onStepChange?.(0, 1, "Running on Android...", data.toString());
    });

    await childProcess;
    return {
      success: true,
      output: "✅ Command completed successfully!",
    };
  }
}

const commandHandlers: Partial<Record<CommandType, CommandHandler>> = {
  clean: new CleanCommandHandler(),
  "pod-install": new PodInstallHandler(),
  "run-android": new RunAndroidHandler(),
};

export async function runCommand(
  commandType: CommandType,
  cleanOption?: string,
  onStepChange?: ProgressCallback
): Promise<CommandResult> {
  const handler = commandHandlers[commandType];

  if (!handler) {
    return { success: false, output: `❌ Error: Unknown command "${commandType}"` };
  }

  try {
    return await handler.execute(cleanOption, onStepChange);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, output: `❌ Error: ${errorMessage}` };
  }
}
