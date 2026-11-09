import path from "path";
import dotenv from "dotenv";

/**
 * Sprint 5.5: فصل البيئات.
 * test → .env.test، production → .env.production، غير ذلك → .env.local
 * المتغيرات المضبوطة في الصدفة تبقى لها الأولوية (dotenv لا يستبدلها).
 */
const envFile =
  process.env.NODE_ENV === "test"
    ? ".env.test"
    : process.env.NODE_ENV === "production"
      ? ".env.production"
      : ".env.local";

dotenv.config({ path: path.resolve(process.cwd(), envFile) });
// توافق احتياطي مع أي تثبيت قديم يعتمد على .env
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "ihris-change-me-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  mysql: {
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: parseInt(process.env.MYSQL_PORT || "3201", 10),
    user: process.env.MYSQL_USER || "ihris_manage",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "ihris_manage",
  },
} as const;

export function validateConfig(): void {
  const required = ["DATABASE_URL", "JWT_SECRET"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
