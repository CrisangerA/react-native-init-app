import fetch from "node-fetch";
import fs from "fs-extra";
import path from "path";
import os from "os";
import tar from "tar";

const TEMPLATE_REPO = "CrisangerA/react-native-template";
const TEMPLATE_BRANCH = "main";

export interface DownloadOptions {
  projectName: string;
  branch?: string;
  onProgress?: (message: string) => void;
}

export interface DownloadResult {
  success: boolean;
  tempDir: string;
  templatePath: string;
  error?: string;
}

export async function downloadTemplate(
  options: DownloadOptions
): Promise<DownloadResult> {
  const { projectName, branch = TEMPLATE_BRANCH, onProgress } = options;

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "rnia-"));
  const tarballPath = path.join(tempDir, "template.tar.gz");
  const extractPath = path.join(tempDir, "template");

  try {
    onProgress?.("📥 Downloading template from GitHub...");

    const tarballUrl = `https://github.com/${TEMPLATE_REPO}/archive/refs/heads/${branch}.tar.gz`;

    const response = await fetch(tarballUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to download template: ${response.status} ${response.statusText}`
      );
    }

    const fileStream = fs.createWriteStream(tarballPath);

    // @ts-ignore - node-fetch body is readable stream
    for await (const chunk of response.body) {
      fileStream.write(chunk);
    }

    fileStream.end();

    onProgress?.("📦 Extracting template...");

    await fs.ensureDir(extractPath);

    await tar.extract({
      file: tarballPath,
      cwd: extractPath,
      strip: 1,
    });

    const templatePath = path.join(extractPath);

    // Verify template exists
    const requiredFiles = ["src", "package.json", "tsconfig.json"];
    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(templatePath, file))) {
        throw new Error(`Template missing required file: ${file}`);
      }
    }

    onProgress?.("✅ Template downloaded successfully");

    return {
      success: true,
      tempDir,
      templatePath,
    };
  } catch (error) {
    // Cleanup on error
    fs.removeSync(tempDir);

    return {
      success: false,
      tempDir: "",
      templatePath: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function cleanupTempDir(tempDir: string): Promise<void> {
  try {
    await fs.remove(tempDir);
  } catch (error) {
    console.warn("Failed to cleanup temp directory:", error);
  }
}
