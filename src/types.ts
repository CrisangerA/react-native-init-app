export type CommandType =
  | "scaffold"
  | "clean"
  | "pod-install"
  | "run-android"
  | "version"
  | "help";

export interface CleanOption {
  label: string;
  script: string;
  cleanMessage: string;
  destructive?: boolean;
}

export interface ScaffoldData {
  projectName: string;
  bundleId: string;
  directory: string;
  packageManager: string;
  installDeps: boolean;
  podInstall: boolean;
}

export interface PromptResult {
  command: string;
  cleanOption?: string;
  scaffoldData?: ScaffoldData;
}

export type ProgressCallback = (
  step: number,
  total: number,
  message: string,
  log?: string
) => void;
