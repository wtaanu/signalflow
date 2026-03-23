import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import { logger } from "../lib/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = Router();

router.get("/extension/download", (_req, res) => {
  // The zip lives at the workspace root: /workspace/signalflow-extension.zip
  // When bundled, __dirname = artifacts/api-server/dist
  // So 3 levels up reaches workspace root.
  const zipPath = path.resolve(__dirname, "../../..", "signalflow-extension.zip");

  if (!existsSync(zipPath)) {
    logger.warn({ zipPath }, "Extension zip not found");
    res.status(404).json({ error: "Extension package not found" });
    return;
  }

  logger.info({ zipPath }, "Serving extension zip download");
  res.download(zipPath, "signalflow-extension.zip", (err) => {
    if (err && !res.headersSent) {
      logger.error({ err: err?.message }, "Extension download failed");
      res.status(500).json({ error: "Download failed" });
    }
  });
});

export default router;
