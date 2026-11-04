import { createApp } from "./app";
import { config } from "./config";
import { prisma } from "./lib/prisma";

async function bootstrap() {
  try {
    const app = createApp();

    app.listen(config.port, () => {
      console.log(`🚀 iHRIS Backend running on http://localhost:${config.port}`);
      console.log(`📊 Environment: ${config.nodeEnv}`);
      console.log(`🔗 Health: http://localhost:${config.port}/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

bootstrap();
