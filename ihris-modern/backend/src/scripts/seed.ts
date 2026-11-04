import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

async function main() {
  console.log("🌱 Starting database seed...");

  // Create default roles
  const roles = [
    { name: "admin", displayName: "نظامي / مسؤول نظام", description: "الوصول الكامل لجميع أجزاء النظام" },
    { name: "hr_manager", displayName: "مدير الموارد البشرية", description: "إدارة الموظفين والوظائف والتقارير" },
    { name: "hr_staff", displayName: "موظف موارد بشرية", description: "عرض وتعديل بيانات الموظفين الأساسية" },
    { name: "training_manager", displayName: "مدير التدريب", description: "إدارة الدورات التدريبية والمتسجلين" },
    { name: "exec_manager", displayName: "مدير تنفيذي", description: "عرض التقارير والمخططات" },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
  console.log("✅ Roles created");

  // Create default admin user
  const adminRole = await prisma.role.findUnique({ where: { name: "admin" } });
  const hashedPassword = await hashPassword("admin123");

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashedPassword,
      firstname: "System",
      lastname: "Administrator",
      email: "admin@ihris.local",
      creatorId: 1,
      access: {
        create: { roleId: adminRole?.id || 1 },
      },
    },
  });
  console.log(`✅ Admin user created: ${admin.username}`);

  // Create reference data
  const countries = ["الجمهورية اليمنية", "مصر", "السعودية", "الإمارات", "الأردن"];
  for (const name of countries) {
    await prisma.country.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("✅ Countries created");

  const regions = ["region_A", "region_B", "region_C"];
  for (const name of regions) {
    await prisma.region.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("✅ Regions created");

  console.log("🎉 Seed completed successfully");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
