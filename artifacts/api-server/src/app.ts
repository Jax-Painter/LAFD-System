import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve the admin frontend static files in production.
// The admin is built to artifacts/admin/dist/public relative to the repo root.
// At runtime the compiled server lives at artifacts/api-server/dist/, so we
// resolve the admin build dir relative to that location.
if (process.env["NODE_ENV"] === "production") {
  const adminDistPath = path.resolve(__dirname, "../../admin/dist/public");
  app.use(express.static(adminDistPath));
  // SPA fallback – serve index.html for any non-API route
  app.get("*", (_req, res) => {
    res.sendFile(path.join(adminDistPath, "index.html"));
  });
}

export default app;
