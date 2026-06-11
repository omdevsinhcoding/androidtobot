import 'dotenv/config';
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initDb } from "./src/db/index.js";
import { setupBot } from "./src/bot/index.js";
import { apiRouter } from "./src/api/index.js";

async function startServer() {
  const app = express();
  // AI Studio requires port 3000, so we use it if we detect AI Studio's DISABLE_HMR flag.
  // Otherwise, default to 3021 for local and VPS usage as requested.
  const isAIStudio = process.env.DISABLE_HMR === 'true';
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : (isAIStudio ? 3000 : 3021);

  app.use(express.json());

  // Setup DB then Bot
  try {
    await initDb();
    await setupBot();
  } catch (err) {
    console.error("Failed to setup database or bot during startup:", err);
  }

  // API routes
  app.use("/api", apiRouter);

  // Detect production: either NODE_ENV is production, or we are running the compiled dist/server.cjs
  const isProd = process.env.NODE_ENV === "production" || process.argv[1]?.endsWith('server.cjs');

  // Vite middleware for development
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Safely determine current directory across both ESM and CommonJS
    let currentDir: string;
    if (typeof __dirname !== 'undefined') {
      currentDir = __dirname;
    } else {
      currentDir = process.cwd();
    }
    
    // In compiled dist/server.cjs, the script is inside dist/
    // If we're inside dist, we don't need to append 'dist'
    const distPath = currentDir.endsWith('dist') ? currentDir : path.join(currentDir, 'dist');
    
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
