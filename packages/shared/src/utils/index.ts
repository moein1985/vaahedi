import { z } from 'zod';

// ─── Pagination ───────────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export type PaginatedResult<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export function createPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

// ─── API Response ─────────────────────────────────────────────────────────────

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── User Code Generation ──────────────────────────────────────────────────────
// فرمول: [2 رقم حوزه فعالیت] + [2 رقم حوزه کالایی] + [N رقم شمارشی]

export const USER_CODE_SEPARATOR = '';

export function buildUserCodePrefix(activityCode: string, commodityCode: string): string {
  return `${activityCode.padStart(2, '0')}${commodityCode.padStart(2, '0')}`;
}

// ─── Validators ───────────────────────────────────────────────────────────────

export function isValidHSCode(code: string): boolean {
  return /^\d{6,10}$/.test(code);
}

export function isValidNationalCode(code: string): boolean {
  if (!/^\d{10}$/.test(code)) return false;

  const digits = code.split('').map(Number);
  const checkDigit = digits[9]!;
  const sum = digits.slice(0, 9).reduce((acc, d, i) => acc + d * (10 - i), 0);
  const remainder = sum % 11;

  return (remainder < 2 && checkDigit === remainder) ||
    (remainder >= 2 && checkDigit === 11 - remainder);
}
