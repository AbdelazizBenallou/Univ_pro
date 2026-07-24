import { execFile } from "node:child_process";
import fs from "node:fs";
import logger from "../config/logger.js";

const CLAMSCAN_BIN = "/usr/bin/clamscan";
const TIMEOUT = 60_000;

export interface ScanResult {
  clean: boolean;
  threat?: string;
}

export async function scanFile(filePath: string): Promise<ScanResult> {
  if (!fs.existsSync(filePath)) {
    return { clean: true };
  }

  try {
    const stdout = await new Promise<string>((resolve, reject) => {
      execFile(
        CLAMSCAN_BIN,
        ["--no-summary", filePath],
        { timeout: TIMEOUT, maxBuffer: 2 * 1024 * 1024 },
        (err, stdout, stderr) => {
          if (err && !stdout.includes("FOUND")) {
            reject(new Error(stderr || err.message));
            return;
          }
          resolve(stdout as string);
        },
      );
    });

    if (stdout.includes("FOUND")) {
      const match = stdout.match(/(.+):\s*(.+)\s+FOUND/);
      const threat = match ? `${match[2]}` : "Unknown threat";
      logger.warn({ filePath, threat }, "Malware detected by ClamAV");
      return { clean: false, threat };
    }

    return { clean: true };
  } catch (err) {
    logger.warn({ err, filePath }, "ClamAV scan failed, allowing file through");
    return { clean: true };
  }
}
