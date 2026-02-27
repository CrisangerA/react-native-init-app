import fs from "node:fs";

const PROJECT_NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9]*$/;
const BUNDLE_ID_REGEX = /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/;

export function validateProjectName(value: string): string | true {
  if (!value) return "Project name is required";
  if (/\s/.test(value)) return "Project name cannot contain spaces";
  if (!PROJECT_NAME_REGEX.test(value)) {
    return "Project name must start with a letter and contain only letters and numbers";
  }
  return true;
}

export function validateBundleId(value: string): string | true {
  if (!value) return "Bundle ID is required";
  if (!BUNDLE_ID_REGEX.test(value)) {
    return "Invalid bundle ID format (e.g., com.company.myapp)";
  }
  return true;
}

export function validateDirectory(value: string): string | true {
  if (!value) return "Directory is required";
  if (fs.existsSync(value) && fs.readdirSync(value).length > 0) {
    return "Directory already exists and is not empty";
  }
  return true;
}
