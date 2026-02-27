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

    return this.cleanSingle(selectedClean.script);
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
      await execa("npm", ["run", steps[i].script]);
    }

    onStepChange?.(steps.length, steps.length, "All cleaned!");
    return { success: true, output: "✅ All caches cleaned successfully!" };
  }

  private async cleanSingle(script: string): Promise<CommandResult> {
    await execa("npm", ["run", script], { stdio: "inherit", cleanup: true });
    return { success: true, output: "✅ Command completed successfully!" };
  }
}

class PodInstallHandler implements CommandHandler {
  async execute(): Promise<CommandResult> {
    const result = await execa("npm", ["run", "pod-install"], {
      stdio: "inherit",
      cleanup: true,
    });
    return {
      success: true,
      output: result.stdout || "✅ Command completed successfully!",
    };
  }
}

class RunAndroidHandler implements CommandHandler {
  async execute(): Promise<CommandResult> {
    const result = await execa("npm", ["run", "android"], {
      stdio: "inherit",
      cleanup: true,
    });
    return {
      success: true,
      output: result.stdout || "✅ Command completed successfully!",
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
