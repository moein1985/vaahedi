import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Super Admin ──────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin@12321#', 12);

  const adminUser = await prisma.user.upsert({
    where: { userCode: 'admin' },
    update: {
      membershipType: 'INDIVIDUAL',
      role: 'TRADER',
      status: 'ACTIVE',
      mobile: '09000000001',
      email: 'admin@local.vaahedi',
      passwordHash: adminPassword,
      agreedToTerms: true,
      agreedToTermsAt: new Date(),
    },
    create: {
      userCode: 'admin',
      membershipType: 'INDIVIDUAL',
      role: 'TRADER',
      status: 'ACTIVE',
      mobile: '09000000001',
      email: 'admin@local.vaahedi',
      passwordHash: adminPassword,
      agreedToTerms: true,
      agreedToTermsAt: new Date(),
      adminProfile: {
        create: {
          adminRole: 'SUPER_ADMIN',
        },
      },
    },
  });

  await prisma.adminProfile.upsert({
    where: { userId: adminUser.id },
    update: { adminRole: 'SUPER_ADMIN' },
    create: { userId: adminUser.id, adminRole: 'SUPER_ADMIN' },
  });

  console.log(`✅ Super admin ready: ${adminUser.userCode}`);

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
