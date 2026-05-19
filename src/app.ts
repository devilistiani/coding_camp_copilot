import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { swaggerSpec } from "./docs/swagger.js";
import router from "./routes.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: env.isDev ? false : undefined,
  }),
);

app.use(
  cors({
    origin:
      env.CORS_ORIGINS_LIST.length === 1 && env.CORS_ORIGINS_LIST[0] === "*"
        ? true
        : env.CORS_ORIGINS_LIST,
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(pinoHttp({ logger }));

app.get("/api/docs.json", (_req, res) => res.json(swaggerSpec));
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Coding Camp Copilot — API Docs",
    swaggerOptions: {
      persistAuthorization: true,
    },
  }),
);

app.use("/api/v1", router);

app.get("/", (_req, res) => {
  res.json({
    name: env.APP_NAME,
    version: "0.1.0",
    docs: "/api/docs",
    health: "/api/v1/health",
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
