import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  console.log("🌱 Seeding database...");

  const accounts: Array<{
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
  }> = [
    {
      email: "user@codingcamp.id",
      password: "copilot2026",
      fullName: "User Demo",
      role: UserRole.user,
    },
    {
      email: "admin@codingcamp.id",
      password: "admin2026",
      fullName: "Admin Demo",
      role: UserRole.admin,
    },
  ];

  for (const acc of accounts) {
    const passwordHash = await bcrypt.hash(acc.password, SALT_ROUNDS);
    const user = await prisma.user.upsert({
      where: { email: acc.email },
      update: {
        passwordHash,
        fullName: acc.fullName,
        role: acc.role,
        isActive: true,
      },
      create: {
        email: acc.email,
        passwordHash,
        fullName: acc.fullName,
        role: acc.role,
      },
    });
    console.log(`  ✓ ${acc.role.padEnd(10)} ${user.email}`);
  }

  console.log("\nSeed selesai.\n");
  console.log("Demo accounts:");
  console.log("  user@codingcamp.id  / copilot2026");
  console.log("  admin@codingcamp.id / admin2026\n");
}

main()
  .catch((err) => {
    console.error("Seed gagal:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
