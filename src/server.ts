import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";

const server = app.listen(env.PORT, () => {
  logger.info(`${env.APP_NAME} berjalan di http://localhost:${env.PORT}`);
  logger.info(`API Docs: http://localhost:${env.PORT}/api/docs`);
  logger.info(`Health  : http://localhost:${env.PORT}/api/v1/health`);
});

async function shutdown(signal: string) {
  logger.info(`Menerima ${signal}, shutdown...`);
  server.close(async () => {
    await prisma.$disconnect();
    logger.info("Server tertutup. Bye 👋");
    process.exit(0);
  });

  // Hard exit kalau gak shutdown gracefully dalam 10 detik
  setTimeout(() => {
    logger.error("Force shutdown setelah timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception");
  process.exit(1);
});
