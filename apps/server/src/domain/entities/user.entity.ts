// ─── Domain Entities ──────────────────────────────────────────────────────────
// این فایل‌ها pure TypeScript هستند — بدون وابستگی به Prisma یا هیچ framework

export type UserId = string & { readonly _brand: 'UserId' };
export type UserCode = string & { readonly _brand: 'UserCode' };

import type { MembershipType, UserRole, UserStatus } from '@repo/shared';

export interface UserEntity {
  id: UserId;
  userCode: UserCode;
  membershipType: MembershipType;
  role: UserRole;
  status: UserStatus;
  nationalCode: string | null;
  nationalId: string | null;
  mobile: string;
  email: string | null;
  agreedToTerms: boolean;
  agreedToTermsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  membershipType: MembershipType;
  role: UserRole;
  nationalCode?: string;
  nationalId?: string;
  mobile: string;
  email?: string;
  passwordHash: string;
  agreedToTerms: boolean;
}
