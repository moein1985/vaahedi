// ─── Repository Interfaces (Domain Ports) ─────────────────────────────────────
// تعریف قرارداد — هیچ وابستگی به Prisma یا DB اینجا نیست

import type { UserEntity, CreateUserDto } from '../entities/user.entity.js';

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByMobile(mobile: string): Promise<UserEntity | null>;
  findByUserCode(userCode: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByNationalCode(nationalCode: string): Promise<UserEntity | null>;
  create(data: CreateUserDto & { userCode: string }): Promise<UserEntity>;
  updateStatus(id: string, status: UserEntity['status']): Promise<void>;
  countByPrefix(prefix: string): Promise<number>;
}
