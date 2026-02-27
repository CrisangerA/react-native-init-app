import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import os from "node:os";
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

  const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), "rnia-"));
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

    if (!response.body) {
      throw new Error("Response body is empty");
    }

    const fileStream = fs.createWriteStream(tarballPath);
    // @ts-ignore - response.body is a ReadableStream in Node 22
    const reader = response.body.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fileStream.write(value);
    }

    fileStream.end();

    onProgress?.("📦 Extracting template...");

    await fsPromises.mkdir(extractPath, { recursive: true });

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
    try {
      await fsPromises.rm(tempDir, { recursive: true, force: true });
    } catch {}

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
    await fsPromises.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    console.warn("Failed to cleanup temp directory:", error);
  }
}
