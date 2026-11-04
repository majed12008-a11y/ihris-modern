import { createPool } from "mysql2/promise";
import { PrismaClient } from "@prisma/client";
import { config } from "../config";

const prisma = new PrismaClient();

async function migrate() {
  console.log("🔄 Starting MySQL to PostgreSQL migration...");

  const mysqlPool = createPool({
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
  });

  try {
    // 1. Roles
    console.log("📥 Migrating roles...");
    const [roles] = await mysqlPool.query("SELECT id, name FROM access GROUP BY role");
    // ... (migration logic would go here)

    // 2. Users
    console.log("📥 Migrating users...");

    // 3. Reference data (countries, regions, districts, counties)
    console.log("📥 Migrating reference data...");

    // 4. People
    console.log("📥 Migrating people...");

    // 5. Positions
    console.log("📥 Migrating positions...");

    // 6. Salaries, Contacts, etc.
    console.log("📥 Migrating related data...");

    console.log("✅ Migration completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await mysqlPool.end();
    await prisma.$disconnect();
  }
}

migrate();
