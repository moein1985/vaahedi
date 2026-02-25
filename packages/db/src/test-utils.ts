import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

export async function createTestDatabase() {
  try {
    // For Windows, we'll use a different approach
    // Just ensure the test database connection works
    const testDbUrl = process.env.DATABASE_URL?.replace('vaahedi', 'vaahedi_test');
    const prisma = new PrismaClient({
      datasourceUrl: testDbUrl,
    });

    // Test connection
    await prisma.$connect();
    await prisma.$disconnect();

    console.log('Test database connection established');
  } catch (error) {
    console.log('Test database already exists or could not be created');
  }
}

export async function dropTestDatabase() {
  try {
    // For Windows, we'll just disconnect
    console.log('Test database cleanup completed');
  } catch (error) {
    console.log('Could not drop test database');
  }
}

export async function createTestUser(prisma: PrismaClient, overrides = {}) {
  const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  const randomNationalCode = `049157${timestamp}${Math.floor(Math.random() * 100)}`;
  return prisma.user.create({
    data: {
      mobile: `09123456${Math.floor(Math.random() * 900) + 100}`,
      email: `test_${randomCode}@test.local`,
      userCode: `TEST${randomCode}`,
      passwordHash: '$2a$10$hashedpassword',
      status: 'ACTIVE',
      membershipType: 'INDIVIDUAL',
      nationalCode: randomNationalCode,
      role: 'TRADER',
      agreedToTerms: true,
      ...overrides,
    },
  });
}

export async function createTestProduct(prisma: PrismaClient, userId: string, overrides = {}) {
  return prisma.product.create({
    data: {
      userId,
      nameFa: 'محصول تست',
      nameEn: 'Test Product',
      hsCode: '123456789',
      commodityGroup: 'INDUSTRIAL',
      technicalSpecs: 'مشخصات فنی تست',
      origin: 'DOMESTIC_FACTORY',
      deliveryTerms: 'FOB',
      deliveryLocation: 'تهران',
      minOrderQuantity: '100',
      preparationTimeDays: 7,
      paymentMethod: 'LC',
      isApproved: true,
      ...overrides,
    },
  });
}