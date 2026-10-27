import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config.js";
import { apiRouter } from "./routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { requestContext, vercelClientIp } from "./lib/requestContext.js";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.set("trust proxy", Number(process.env.TRUST_PROXY || 1));
  app.use(vercelClientIp);
  app.use(cors({ origin: [config.clientOrigin, ...config.websiteOrigins] }));
  app.use(express.json({ limit: "1mb" }));
  app.use(requestLogger);
  app.use(requestContext);

  app.use("/api/v1", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
