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
        { code: 'AGRI.FARMER', nameFa: 'کشاورز / تولیدکننده', nameEn: 'Farmer / Producer', sortOrder: 1 },
        { code: 'AGRI.LIVESTOCK', nameFa: 'دامدار / پرورش‌دهنده', nameEn: 'Livestock Farmer', sortOrder: 2 },
        { code: 'AGRI.TRADER', nameFa: 'بازرگان کشاورزی', nameEn: 'Agricultural Trader', sortOrder: 3 },
        { code: 'AGRI.PROCESSOR', nameFa: 'فرآوری‌کننده', nameEn: 'Agri Processor', sortOrder: 4 },
        { code: 'AGRI.SERVICE', nameFa: 'خدمات‌دهنده کشاورزی', nameEn: 'Agri Service Provider', sortOrder: 5 },
        { code: 'AGRI.ORG', nameFa: 'نهاد و تشکل', nameEn: 'Organization / Union', sortOrder: 6 },
        // ── سطح دوم: زیرمجموعه کشاورز ──────────────────────────────────────────
        { code: 'AGRI.FARMER.GRAIN', nameFa: 'کشاورز غلات (گندم، جو، ذرت)', nameEn: 'Grain Farmer', sortOrder: 1, parentCode: 'AGRI.FARMER' },
        { code: 'AGRI.FARMER.FRUIT', nameFa: 'باغدار (درختی)', nameEn: 'Fruit Grower', sortOrder: 2, parentCode: 'AGRI.FARMER' },
        { code: 'AGRI.FARMER.VEGETABLE', nameFa: 'کشاورز سبزیجات و صیفی', nameEn: 'Vegetable Farmer', sortOrder: 3, parentCode: 'AGRI.FARMER' },
        { code: 'AGRI.FARMER.INDUSTRIAL', nameFa: 'کشاورز محصولات صنعتی', nameEn: 'Industrial Crops Farmer', sortOrder: 4, parentCode: 'AGRI.FARMER' },
        { code: 'AGRI.FARMER.GREENHOUSE', nameFa: 'گلخانه‌دار', nameEn: 'Greenhouse Grower', sortOrder: 5, parentCode: 'AGRI.FARMER' },
        { code: 'AGRI.FARMER.SAFFRON', nameFa: 'زعفران‌کار', nameEn: 'Saffron Grower', sortOrder: 6, parentCode: 'AGRI.FARMER' },
        // ── سطح دوم: زیرمجموعه دامدار ──────────────────────────────────────────
        { code: 'AGRI.LIVESTOCK.CATTLE', nameFa: 'دامدار (گاو و گوسفند)', nameEn: 'Cattle Farmer', sortOrder: 1, parentCode: 'AGRI.LIVESTOCK' },
        { code: 'AGRI.LIVESTOCK.POULTRY', nameFa: 'مرغدار', nameEn: 'Poultry Farmer', sortOrder: 2, parentCode: 'AGRI.LIVESTOCK' },
        { code: 'AGRI.LIVESTOCK.AQUA', nameFa: 'پرورش‌دهنده آبزیان', nameEn: 'Aquaculture Farmer', sortOrder: 3, parentCode: 'AGRI.LIVESTOCK' },
        { code: 'AGRI.LIVESTOCK.BEE', nameFa: 'زنبوردار', nameEn: 'Beekeeper', sortOrder: 4, parentCode: 'AGRI.LIVESTOCK' },
        // ── سطح دوم: زیرمجموعه بازرگان ─────────────────────────────────────────
        { code: 'AGRI.TRADER.EXPORTER', nameFa: 'صادرکننده محصولات کشاورزی', nameEn: 'Agri Exporter', sortOrder: 1, parentCode: 'AGRI.TRADER' },
        { code: 'AGRI.TRADER.IMPORTER', nameFa: 'واردکننده نهاده‌های کشاورزی', nameEn: 'Agri Importer', sortOrder: 2, parentCode: 'AGRI.TRADER' },
        { code: 'AGRI.TRADER.DOMESTIC', nameFa: 'تاجر داخلی / عمده‌فروش', nameEn: 'Domestic Trader', sortOrder: 3, parentCode: 'AGRI.TRADER' },
        // ── سطح دوم: زیرمجموعه فرآوری ──────────────────────────────────────────
        { code: 'AGRI.PROCESSOR.FOOD', nameFa: 'صنایع غذایی', nameEn: 'Food Industry', sortOrder: 1, parentCode: 'AGRI.PROCESSOR' },
        { code: 'AGRI.PROCESSOR.PACKING', nameFa: 'بسته‌بندی کشاورزی', nameEn: 'Agri Packaging', sortOrder: 2, parentCode: 'AGRI.PROCESSOR' },
        { code: 'AGRI.PROCESSOR.COLD', nameFa: 'سردخانه / انبار کشاورزی', nameEn: 'Cold Storage', sortOrder: 3, parentCode: 'AGRI.PROCESSOR' },
        // ── سطح دوم: زیرمجموعه خدمات ──────────────────────────────────────────
        { code: 'AGRI.SERVICE.MACHINERY', nameFa: 'تأمین ماشین‌آلات کشاورزی', nameEn: 'Machinery Supplier', sortOrder: 1, parentCode: 'AGRI.SERVICE' },
        { code: 'AGRI.SERVICE.INPUT', nameFa: 'تأمین نهاده (بذر، کود، سم)', nameEn: 'Input Supplier', sortOrder: 2, parentCode: 'AGRI.SERVICE' },
        { code: 'AGRI.SERVICE.CONSULTING', nameFa: 'مشاور کشاورزی', nameEn: 'Agri Consultant', sortOrder: 3, parentCode: 'AGRI.SERVICE' },
        { code: 'AGRI.SERVICE.LOGISTICS', nameFa: 'حمل و نقل و لجستیک', nameEn: 'Agri Logistics', sortOrder: 4, parentCode: 'AGRI.SERVICE' },
        // ── سطح دوم: زیرمجموعه نهاد ────────────────────────────────────────────
        { code: 'AGRI.ORG.COOPERATIVE', nameFa: 'تعاونی کشاورزی', nameEn: 'Agri Cooperative', sortOrder: 1, parentCode: 'AGRI.ORG' },
        { code: 'AGRI.ORG.GUILD', nameFa: 'اتحادیه صنفی کشاورزی', nameEn: 'Agri Guild Union', sortOrder: 2, parentCode: 'AGRI.ORG' },
        { code: 'AGRI.ORG.RESEARCH', nameFa: 'مرکز تحقیقات کشاورزی', nameEn: 'Research Institute', sortOrder: 3, parentCode: 'AGRI.ORG' },
    ];
    // ابتدا والدین را upsert می‌کنیم (بدون parentId)
    for (const cat of occupationTree.filter(c => !('parentCode' in c) || !c.parentCode)) {
        await prisma.occupationCategory.upsert({
            where: { code: cat.code },
            update: { nameFa: cat.nameFa, nameEn: cat.nameEn, sortOrder: cat.sortOrder },
            create: { code: cat.code, nameFa: cat.nameFa, nameEn: cat.nameEn, sortOrder: cat.sortOrder },
        });
    }
    // سپس فرزندان را upsert می‌کنیم
    for (const cat of occupationTree.filter(c => 'parentCode' in c && c.parentCode)) {
        const parent = await prisma.occupationCategory.findUnique({ where: { code: cat.parentCode } });
        if (parent) {
            await prisma.occupationCategory.upsert({
                where: { code: cat.code },
                update: { nameFa: cat.nameFa, nameEn: cat.nameEn, sortOrder: cat.sortOrder, parentId: parent.id },
                create: { code: cat.code, nameFa: cat.nameFa, nameEn: cat.nameEn, sortOrder: cat.sortOrder, parentId: parent.id },
            });
        }
    }
    console.log(`✅ Occupation categories seeded: ${occupationTree.length} categories`);
    // ─── Demo Farmer User ─────────────────────────────────────────────────────
    console.log('👨‍🌾 Seeding demo farmer user...');
    const farmerPassword = await bcrypt.hash('Farmer@1234', 12);
    const grainCat = await prisma.occupationCategory.findUnique({ where: { code: 'AGRI.FARMER.GRAIN' } });
    const farmerUser = await prisma.user.upsert({
        where: { userCode: '01000001' },
        update: {},
        create: {
            userCode: '01000001',
            membershipType: 'INDIVIDUAL',
            role: 'FARMER',
            status: 'ACTIVE',
            mobile: '09121234501',
            email: 'farmer@demo.agri',
            passwordHash: farmerPassword,
            agreedToTerms: true,
            agreedToTermsAt: new Date(),
            profile: {
                create: {
                    companyName: 'مزرعه نمونه گندم شرق',
                    province: 'خراسان رضوی',
                    city: 'مشهد',
                    addressLine: 'شهرستان چناران، روستای آب‌پریشان',
                    postalCode: '9361111111',
                    activityType: 'تولید و صادرات غلات',
                    commodityGroup: 'AGRICULTURAL',
                    experienceYears: 15,
                    description: 'تولیدکننده گندم و جو با بیش از ۱۵ سال سابقه. دارای زمین کشاورزی ۲۰۰ هکتاری با آبیاری قطره‌ای.',
                    occupationCategoryId: grainCat?.id,
                    farmingAreaHectares: 200,
                    irrigationType: 'آبی',
                    mainCrops: ['گندم', 'جو', 'ذرت'],
                    tradeDirection: 'صادراتی',
                    verificationStatus: 'APPROVED',
                    verifiedAt: new Date(),
                },
            },
        },
    });
    console.log(`✅ Demo farmer ready: ${farmerUser.userCode}`);
    // ─── Harvest Calendar Entries ─────────────────────────────────────────────
    console.log('🗓️  Seeding harvest calendar...');
    const harvestEntries = [
        { cropNameFa: 'گندم', cropNameEn: 'Wheat', harvestStartMonth: 3, harvestEndMonth: 5, province: 'خراسان رضوی', variety: 'پیشتاز', description: 'گندم پاییزه با بازده بالا در مناطق شمال شرق ایران' },
        { cropNameFa: 'جو', cropNameEn: 'Barley', harvestStartMonth: 3, harvestEndMonth: 4, province: 'کرمانشاه', variety: 'ماهور', description: 'جو دیم مناسب برای صادرات به عراق و افغانستان' },
        { cropNameFa: 'برنج', cropNameEn: 'Rice', harvestStartMonth: 6, harvestEndMonth: 8, province: 'مازندران', variety: 'طارم هاشمی', description: 'برنج اشرافی شمال با طعم و کیفیت بی‌نظیر' },
        { cropNameFa: 'سیب', cropNameEn: 'Apple', harvestStartMonth: 7, harvestEndMonth: 9, province: 'آذربایجان غربی', variety: 'گلدن دلیشز', description: 'سیب صادراتی دشت ارومیه با پوشش بیمه‌ای' },
        { cropNameFa: 'زعفران', cropNameEn: 'Saffron', harvestStartMonth: 8, harvestEndMonth: 9, province: 'خراسان رضوی', variety: 'سرگل', description: 'زعفران سرگل قاینات و گناباد با استاندارد صادراتی' },
        { cropNameFa: 'خرما', cropNameEn: 'Date', harvestStartMonth: 6, harvestEndMonth: 9, province: 'خوزستان', variety: 'مضافتی / زاهدی', description: 'خرما صادراتی جنوب ایران مناسب بازار کشورهای عربی' },
        { cropNameFa: 'پیاز', cropNameEn: 'Onion', harvestStartMonth: 4, harvestEndMonth: 7, province: 'اصفهان', description: 'پیاز بویین میاندشت با صادرات سالانه به بیش از ۱۰ کشور' },
        { cropNameFa: 'گوجه‌فرنگی', cropNameEn: 'Tomato', harvestStartMonth: 3, harvestEndMonth: 9, province: null, description: 'گوجه‌فرنگی گلخانه‌ای سراسر کشور، قابل تأمین در تمام فصول' },
    ];
    for (const entry of harvestEntries) {
        await prisma.harvestCalendar.upsert({
            where: { id: `seed-harvest-${entry.cropNameEn.toLowerCase().replace(/\s/g, '-')}` },
            update: { ...entry, isActive: true },
            create: { id: `seed-harvest-${entry.cropNameEn.toLowerCase().replace(/\s/g, '-')}`, ...entry, isActive: true },
        });
    }
    console.log(`✅ Harvest calendar: ${harvestEntries.length} entries`);
    // ─── Market Insights ──────────────────────────────────────────────────────
    console.log('📊 Seeding market insights...');
    const marketInsights = [
        {
            id: 'seed-insight-wheat-price',
            title: 'قیمت گندم در بازار جهانی — تحلیل فصل بهار ۱۴۰۵',
            commodityFa: 'گندم',
            commodityEn: 'Wheat',
            insightType: 'price',
            content: 'بر اساس داده‌های بازار جهانی، قیمت گندم در ماه‌های اخیر روند صعودی داشته است. بازارهای عراق و افغانستان تقاضای بالایی برای گندم ایرانی دارند. صادرکنندگان باید توجه داشته باشند که استانداردهای بهداشتی و قرنطینه‌ای مقصد را رعایت کنند.\n\nاین اطلاعات صرفاً جنبه اطلاع‌رسانی دارد.',
            dataDate: new Date('2026-04-15'),
            tags: ['گندم', 'صادرات', 'عراق', 'قیمت جهانی'],
            isPublished: true,
            publishedAt: new Date('2026-04-16'),
            authorId: adminUser.id,
        },
        {
            id: 'seed-insight-saffron-demand',
            title: 'تقاضای جهانی زعفران ایرانی در سال ۲۰۲۶',
            commodityFa: 'زعفران',
            commodityEn: 'Saffron',
            insightType: 'demand',
            content: 'بازار اروپا و آسیای شرقی تقاضای رو به رشدی برای زعفران باکیفیت ایرانی دارند. صادرکنندگان با گواهی ISO 3632 و GlobalG.A.P. برتری رقابتی خواهند داشت. بازار امارات همچنان بزرگترین مسیر ترانزیت برای صادرات زعفران ایران است.\n\nاین تحلیل فقط جنبه اطلاع‌رسانی دارد.',
            dataDate: new Date('2026-03-20'),
            tags: ['زعفران', 'اروپا', 'صادرات', 'ISO'],
            isPublished: true,
            publishedAt: new Date('2026-03-21'),
            authorId: adminUser.id,
        },
        {
            id: 'seed-insight-fruit-export',
            title: 'صادرات میوه به کشورهای هدف — فصل تابستان ۱۴۰۵',
            commodityFa: 'میوه‌جات',
            commodityEn: 'Fruits',
            insightType: 'trend',
            content: 'سیب، انگور و هلو در صدر محصولات صادراتی فصل تابستان قرار دارند. اثرات تغییرات اقلیمی بر عملکرد محصول در برخی استان‌ها باید در محاسبه قیمت پیش‌فروش لحاظ شود. پیشنهاد می‌شود صادرکنندگان تعهدات تحویل را با احتیاط بالاتر تنظیم کنند.\n\nاین اطلاعات صرفاً جنبه اطلاع‌رسانی دارد.',
            dataDate: new Date('2026-05-01'),
            tags: ['سیب', 'انگور', 'صادرات', 'تابستان'],
            isPublished: true,
            publishedAt: new Date('2026-05-02'),
            authorId: adminUser.id,
        },
        {
            id: 'seed-insight-pesticide-regulation',
            title: 'مقررات جدید کاهش آفت‌کش در صادرات به اتحادیه اروپا',
            commodityFa: 'محصولات کشاورزی صادراتی',
            commodityEn: 'Export Agricultural Products',
            insightType: 'regulation',
            content: 'اتحادیه اروپا از ابتدای سال ۲۰۲۶ حداکثر سطح باقیمانده آفت‌کش (MRL) را برای محصولات وارداتی کاهش داده است. صادرکنندگان ایرانی باید گواهی آزمایشگاه معتبر بین‌المللی را برای ورود کالا به بازار اروپا ارائه دهند.\n\nاین اطلاعات جنبه اطلاع‌رسانی دارد و معادل مشاوره حقوقی نیست.',
            dataDate: new Date('2026-02-10'),
            tags: ['اروپا', 'مقررات', 'آفت‌کش', 'استاندارد'],
            isPublished: true,
            publishedAt: new Date('2026-02-11'),
            authorId: adminUser.id,
        },
    ];
    for (const insight of marketInsights) {
        await prisma.marketInsight.upsert({
            where: { id: insight.id },
            update: insight,
            create: insight,
        });
    }
    console.log(`✅ Market insights: ${marketInsights.length} entries`);
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
