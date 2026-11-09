import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config";
import { errorHandler } from "./middleware/error";
import authRoutes from "./routes/auth";
import personRoutes from "./routes/person";
import positionRoutes from "./routes/position";
import facilityRoutes from "./routes/facility";
import countryRoutes from "./routes/country";
import jobRoutes from "./routes/job";
import salaryRoutes from "./routes/salary";
import trainingRoutes from "./routes/training";
import userRoutes from "./routes/user";
import reportRoutes from "./routes/report";
import referenceRoutes from "./routes/reference";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "ihris-backend", timestamp: new Date().toISOString() });
  });

  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/persons", personRoutes);
  app.use("/api/positions", positionRoutes);
  app.use("/api/facilities", facilityRoutes);
  app.use("/api/countries", countryRoutes);
  app.use("/api/jobs", jobRoutes);
  app.use("/api/salaries", salaryRoutes);
  app.use("/api/training", trainingRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/reference", referenceRoutes);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
