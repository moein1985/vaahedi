
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.upsert({
    where: { mobile: '09123456789' },
    update: {},
    create: {
      id: 'user-1',
      userCode: '123456',
      membershipType: 'INDIVIDUAL',
      role: 'TRADER',
      status: 'ACTIVE',
      nationalCode: '1234567890',
      mobile: '09123456789',
      email: 'test@example.com',
      passwordHash: 'dummy',
      agreedToTerms: true,
      agreedToTermsAt: new Date(),
    }
  });
  const product = await prisma.product.upsert({
    where: { id: 'prod-1' },
    update: {},
    create: {
      id: 'prod-1',
      userId: user.id,
      nameFa: 'ورق آهن نورد شده',
      nameEn: 'Rolled Steel Sheet',
      hsCode: '720810',
      commodityGroup: 'METAL',
      origin: 'DOMESTIC_FACTORY',
      technicalSpecs: 'ضخامت 2mm، عرض 1m، طول 2m',
      description: 'ورق آهن با کیفیت بالا برای مصارف صنعتی',
      deliveryTerms: 'EXW',
      deliveryLocation: 'تهران',
      minOrderQuantity: '1000 kg',
      preparationTimeDays: 7,
      paymentMethod: 'TT',
      isApproved: true,
      approvedAt: new Date(),
    }
  });
  console.log('User and product created');
}
main().finally(() => prisma.\());

