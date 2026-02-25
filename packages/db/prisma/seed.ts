import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Super Admin ──────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@1234', 12);

  const adminUser = await prisma.user.upsert({
    where: { mobile: '09000000000' },
    update: {},
    create: {
      userCode: '0000001',
      membershipType: 'INDIVIDUAL',
      role: 'TRADER',
      status: 'ACTIVE',
      nationalCode: '0000000000',
      mobile: '09000000000',
      email: 'admin@vaahedi.ir',
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

  console.log(`✅ Admin user created: ${adminUser.mobile}`);

  // ─── Sample Users for Chat ────────────────────────────────────────────────
  const user1Password = await bcrypt.hash('User1@1234', 12);
  const user2Password = await bcrypt.hash('User2@1234', 12);

  const user1 = await prisma.user.upsert({
    where: { mobile: '09111111111' },
    update: {},
    create: {
      userCode: '0000002',
      membershipType: 'INDIVIDUAL',
      role: 'TRADER',
      status: 'ACTIVE',
      nationalCode: '1111111111',
      mobile: '09111111111',
      email: 'user1@example.com',
      passwordHash: user1Password,
      agreedToTerms: true,
      agreedToTermsAt: new Date(),
      profile: {
        create: {
          firstName: 'علی',
          lastName: 'محمدی',
          companyName: 'شرکت نمونه',
        },
      },
    },
  });

  const user2 = await prisma.user.upsert({
    where: { mobile: '09222222222' },
    update: {},
    create: {
      userCode: '0000003',
      membershipType: 'INDIVIDUAL',
      role: 'TRADER',
      status: 'ACTIVE',
      nationalCode: '2222222222',
      mobile: '09222222222',
      email: 'user2@example.com',
      passwordHash: user2Password,
      agreedToTerms: true,
      agreedToTermsAt: new Date(),
      profile: {
        create: {
          firstName: 'فاطمه',
          lastName: 'احمدی',
          companyName: 'شرکت نمونه ۲',
        },
      },
    },
  });

  console.log('✅ Sample users created for chat testing');

  // ─── Sample Conversation ──────────────────────────────────────────────────
  const conversation = await prisma.conversation.upsert({
    where: { id: 'conv-01' },
    update: {},
    create: {
      id: 'conv-01',
      participants: {
        create: [
          { userId: user1.id },
          { userId: user2.id },
        ],
      },
      messages: {
        create: [
          {
            id: 'msg-01',
            content: 'سلام! چطور هستید؟',
            senderId: user1.id,
          },
          {
            id: 'msg-02',
            content: 'سلام علی! ممنون، خوبم. شما چطورید؟',
            senderId: user2.id,
          },
          {
            id: 'msg-03',
            content: 'خوبم ممنون. می‌خواستم در مورد محصول جدیدی که گذاشتید بپرسم.',
            senderId: user1.id,
          },
        ],
      },
    },
  });

  console.log('✅ Sample conversation created');

  // ─── Sample HS Codes (نمونه) ──────────────────────────────────────────────
  // ⚠️ در فاز بعد با داده واقعی import می‌شود
  await prisma.hsCode.upsert({
    where: { code: '720810' },
    update: {},
    create: {
      code: '720810',
      descriptionFa: 'ورق آهن یا فولاد غیرآلیاژی، تخت نورد شده',
      descriptionEn: 'Flat-rolled products of iron or non-alloy steel',
      level: 6,
    },
  });

  console.log('✅ Sample HS codes created');

  // ─── Sample Survey ────────────────────────────────────────────────────────
  await prisma.survey.upsert({
    where: { id: 'survey-01' },
    update: {},
    create: {
      id: 'survey-01',
      title: 'نظرسنجی رضایت از خدمات',
      description: 'لطفاً نظر خود را درباره خدمات مرکز تجارت با ما در میان بگذارید',
      questions: [
        {
          id: 'q1',
          type: 'rating',
          text: 'رضایت کلی شما از خدمات چقدر است؟',
          required: true,
        },
        {
          id: 'q2',
          type: 'single_choice',
          text: 'از کدام بخش خدمات بیشتر استفاده کرده‌اید؟',
          options: ['خرید/فروش', 'مشاوره گمرکی', 'مشاوره ارزی', 'بخشنامه‌ها', 'چت آنلاین'],
          required: true,
        },
        {
          id: 'q3',
          type: 'text',
          text: 'پیشنهاد یا انتقاد خود را بیان کنید',
          required: false,
        },
      ],
      isActive: true,
    },
  });

  console.log('✅ Sample survey created');

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
