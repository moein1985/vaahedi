import type { IUserRepository } from '../../domain/repositories/user.repository.interface.js';
import type { UserEntity, CreateUserDto } from '../../domain/entities/user.entity.js';
import type { PrismaClient } from '@repo/db';

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.db.user.findUnique({ where: { id } });
    return user ? this.toEntity(user) : null;
  }

  async findByMobile(mobile: string): Promise<UserEntity | null> {
    const user = await this.db.user.findUnique({ where: { mobile } });
    return user ? this.toEntity(user) : null;
  }

  async findByUserCode(userCode: string): Promise<UserEntity | null> {
    const user = await this.db.user.findUnique({ where: { userCode } });
    return user ? this.toEntity(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.db.user.findUnique({ where: { email } });
    return user ? this.toEntity(user) : null;
  }

  async findByNationalCode(nationalCode: string): Promise<UserEntity | null> {
    const user = await this.db.user.findFirst({ where: { nationalCode } });
    return user ? this.toEntity(user) : null;
  }

  async create(data: CreateUserDto & { userCode: string }): Promise<UserEntity> {
    const user = await this.db.user.create({
      data: {
        userCode: data.userCode,
        membershipType: data.membershipType,
        role: data.role,
        mobile: data.mobile,
        email: data.email,
        nationalCode: data.nationalCode,
        nationalId: data.nationalId,
        passwordHash: data.passwordHash,
        agreedToTerms: data.agreedToTerms,
        agreedToTermsAt: data.agreedToTerms ? new Date() : null,
      },
    });
    return this.toEntity(user);
  }

  async updateStatus(id: string, status: UserEntity['status']): Promise<void> {
    await this.db.user.update({ where: { id }, data: { status } });
  }

  async countByPrefix(prefix: string): Promise<number> {
    return this.db.user.count({
      where: { userCode: { startsWith: prefix } },
    });
  }

  private toEntity(raw: {
    id: string;
    userCode: string;
    membershipType: string;
    role: string;
    status: string;
    nationalCode: string | null;
    nationalId: string | null;
    mobile: string;
    email: string | null;
    agreedToTerms: boolean;
    agreedToTermsAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserEntity {
    return raw as unknown as UserEntity;
  }
}
