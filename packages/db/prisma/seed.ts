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

  // ─── Occupation Categories (Agriculture Stakeholder Taxonomy) ─────────────
  console.log('🌾 Seeding occupation categories...');

  const occupationTree = [
    // ── سطح اول: دسته‌های اصلی ──────────────────────────────────────────────
    { code: 'AGRI.FARMER',      nameFa: 'کشاورز / تولیدکننده', nameEn: 'Farmer / Producer',    sortOrder: 1 },
    { code: 'AGRI.LIVESTOCK',   nameFa: 'دامدار / پرورش‌دهنده', nameEn: 'Livestock Farmer',       sortOrder: 2 },
    { code: 'AGRI.TRADER',      nameFa: 'بازرگان کشاورزی',     nameEn: 'Agricultural Trader',    sortOrder: 3 },
    { code: 'AGRI.PROCESSOR',   nameFa: 'فرآوری‌کننده',         nameEn: 'Agri Processor',         sortOrder: 4 },
    { code: 'AGRI.SERVICE',     nameFa: 'خدمات‌دهنده کشاورزی', nameEn: 'Agri Service Provider',  sortOrder: 5 },
    { code: 'AGRI.ORG',         nameFa: 'نهاد و تشکل',          nameEn: 'Organization / Union',   sortOrder: 6 },
    // ── سطح دوم: زیرمجموعه کشاورز ──────────────────────────────────────────
    { code: 'AGRI.FARMER.GRAIN',      nameFa: 'کشاورز غلات (گندم، جو، ذرت)', nameEn: 'Grain Farmer',           sortOrder: 1, parentCode: 'AGRI.FARMER' },
    { code: 'AGRI.FARMER.FRUIT',      nameFa: 'باغدار (درختی)',               nameEn: 'Fruit Grower',           sortOrder: 2, parentCode: 'AGRI.FARMER' },
    { code: 'AGRI.FARMER.VEGETABLE',  nameFa: 'کشاورز سبزیجات و صیفی',       nameEn: 'Vegetable Farmer',       sortOrder: 3, parentCode: 'AGRI.FARMER' },
    { code: 'AGRI.FARMER.INDUSTRIAL', nameFa: 'کشاورز محصولات صنعتی',        nameEn: 'Industrial Crops Farmer',sortOrder: 4, parentCode: 'AGRI.FARMER' },
    { code: 'AGRI.FARMER.GREENHOUSE', nameFa: 'گلخانه‌دار',                   nameEn: 'Greenhouse Grower',      sortOrder: 5, parentCode: 'AGRI.FARMER' },
    { code: 'AGRI.FARMER.SAFFRON',    nameFa: 'زعفران‌کار',                   nameEn: 'Saffron Grower',         sortOrder: 6, parentCode: 'AGRI.FARMER' },
    // ── سطح دوم: زیرمجموعه دامدار ──────────────────────────────────────────
    { code: 'AGRI.LIVESTOCK.CATTLE',   nameFa: 'دامدار (گاو و گوسفند)', nameEn: 'Cattle Farmer',    sortOrder: 1, parentCode: 'AGRI.LIVESTOCK' },
    { code: 'AGRI.LIVESTOCK.POULTRY',  nameFa: 'مرغدار',                 nameEn: 'Poultry Farmer',   sortOrder: 2, parentCode: 'AGRI.LIVESTOCK' },
    { code: 'AGRI.LIVESTOCK.AQUA',     nameFa: 'پرورش‌دهنده آبزیان',   nameEn: 'Aquaculture Farmer',sortOrder: 3, parentCode: 'AGRI.LIVESTOCK' },
    { code: 'AGRI.LIVESTOCK.BEE',      nameFa: 'زنبوردار',               nameEn: 'Beekeeper',        sortOrder: 4, parentCode: 'AGRI.LIVESTOCK' },
    // ── سطح دوم: زیرمجموعه بازرگان ─────────────────────────────────────────
    { code: 'AGRI.TRADER.EXPORTER', nameFa: 'صادرکننده محصولات کشاورزی', nameEn: 'Agri Exporter', sortOrder: 1, parentCode: 'AGRI.TRADER' },
    { code: 'AGRI.TRADER.IMPORTER', nameFa: 'واردکننده نهاده‌های کشاورزی', nameEn: 'Agri Importer', sortOrder: 2, parentCode: 'AGRI.TRADER' },
    { code: 'AGRI.TRADER.DOMESTIC', nameFa: 'تاجر داخلی / عمده‌فروش',    nameEn: 'Domestic Trader', sortOrder: 3, parentCode: 'AGRI.TRADER' },
    // ── سطح دوم: زیرمجموعه فرآوری ──────────────────────────────────────────
    { code: 'AGRI.PROCESSOR.FOOD',    nameFa: 'صنایع غذایی',           nameEn: 'Food Industry',     sortOrder: 1, parentCode: 'AGRI.PROCESSOR' },
    { code: 'AGRI.PROCESSOR.PACKING', nameFa: 'بسته‌بندی کشاورزی',     nameEn: 'Agri Packaging',    sortOrder: 2, parentCode: 'AGRI.PROCESSOR' },
    { code: 'AGRI.PROCESSOR.COLD',    nameFa: 'سردخانه / انبار کشاورزی',nameEn: 'Cold Storage',     sortOrder: 3, parentCode: 'AGRI.PROCESSOR' },
    // ── سطح دوم: زیرمجموعه خدمات ──────────────────────────────────────────
    { code: 'AGRI.SERVICE.MACHINERY',  nameFa: 'تأمین ماشین‌آلات کشاورزی', nameEn: 'Machinery Supplier',  sortOrder: 1, parentCode: 'AGRI.SERVICE' },
    { code: 'AGRI.SERVICE.INPUT',      nameFa: 'تأمین نهاده (بذر، کود، سم)', nameEn: 'Input Supplier',     sortOrder: 2, parentCode: 'AGRI.SERVICE' },
    { code: 'AGRI.SERVICE.CONSULTING', nameFa: 'مشاور کشاورزی',              nameEn: 'Agri Consultant',    sortOrder: 3, parentCode: 'AGRI.SERVICE' },
    { code: 'AGRI.SERVICE.LOGISTICS',  nameFa: 'حمل و نقل و لجستیک',         nameEn: 'Agri Logistics',     sortOrder: 4, parentCode: 'AGRI.SERVICE' },
    // ── سطح دوم: زیرمجموعه نهاد ────────────────────────────────────────────
    { code: 'AGRI.ORG.COOPERATIVE',   nameFa: 'تعاونی کشاورزی',     nameEn: 'Agri Cooperative',     sortOrder: 1, parentCode: 'AGRI.ORG' },
    { code: 'AGRI.ORG.GUILD',         nameFa: 'اتحادیه صنفی کشاورزی', nameEn: 'Agri Guild Union',   sortOrder: 2, parentCode: 'AGRI.ORG' },
    { code: 'AGRI.ORG.RESEARCH',      nameFa: 'مرکز تحقیقات کشاورزی', nameEn: 'Research Institute', sortOrder: 3, parentCode: 'AGRI.ORG' },
  ] as const;

  // ابتدا والدین را upsert می‌کنیم (بدون parentId)
  for (const cat of occupationTree.filter(c => !('parentCode' in c) || !c.parentCode)) {
    await prisma.occupationCategory.upsert({
      where: { code: cat.code },
      update: { nameFa: cat.nameFa, nameEn: cat.nameEn, sortOrder: cat.sortOrder },
      create: { code: cat.code, nameFa: cat.nameFa, nameEn: cat.nameEn as string | undefined, sortOrder: cat.sortOrder },
    });
  }

  // سپس فرزندان را upsert می‌کنیم
  for (const cat of occupationTree.filter(c => 'parentCode' in c && c.parentCode)) {
    const parent = await prisma.occupationCategory.findUnique({ where: { code: (cat as any).parentCode } });
    if (parent) {
      await prisma.occupationCategory.upsert({
        where: { code: cat.code },
        update: { nameFa: cat.nameFa, nameEn: cat.nameEn, sortOrder: cat.sortOrder, parentId: parent.id },
        create: { code: cat.code, nameFa: cat.nameFa, nameEn: cat.nameEn as string | undefined, sortOrder: cat.sortOrder, parentId: parent.id },
      });
    }
  }
  console.log(`✅ Occupation categories seeded: ${occupationTree.length} categories`);

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
