# دستورالعمل نوشتن تست‌های جامع برای پروژه وهدی

**هدف:** نوشتن تست‌های جامع با پوشش کد 70-80 درصدی  
**ابزارها:** Vitest (برای unit/integration) + Playwright (برای E2E)  
**مهلت:** فاز 1 (Priority High)

---

## 1. معماری پروژه

```
Vaahedi/
├── apps/
│   ├── web/                          # Frontend (React 19 + Vite)
│   │   ├── src/
│   │   │   ├── routes/               # TanStack Router pages
│   │   │   ├── components/           # UI components
│   │   │   ├── hooks/                # Custom hooks
│   │   │   ├── lib/utils.ts          # Utility functions
│   │   │   ├── store/auth.store.ts   # Zustand store
│   │   │   └── trpc.ts               # tRPC client config
│   │   └── vitest.config.ts
│   │
│   └── server/                       # Backend (Node.js + Fastify)
│       ├── src/
│       │   ├── main.ts               # Server entry
│       │   ├── worker.ts             # BullMQ worker
│       │   ├── application/          # Use cases
│       │   ├── domain/               # Business logic
│       │   ├── infrastructure/       # Repos, services
│       │   └── interface/trpc/       # tRPC routers
│       └── vitest.config.ts
│
└── packages/
    ├── shared/
    │   ├── src/
    │   │   ├── schemas/              # Zod schemas (auth, product, etc.)
    │   │   ├── enums/                # TypeScript enums
    │   │   └── utils/                # Shared utilities
    │   └── vitest.config.ts
    │
    └── db/
        ├── prisma/
        │   ├── schema.prisma         # Database schema
        │   └── seed.ts               # Database seeders
        └── src/test-utils.ts         # Prisma test utilities
```

---

## 2. فایل‌های پویوت (مهم برای تست)

### 2.1 Backend - tRPC Routers (HIGH PRIORITY)
```
apps/server/src/interface/trpc/
├── routers/
│   ├── auth.router.ts       ← LOGIN, REGISTER, LOGOUT (Critical)
│   ├── product.router.ts    ← CRUD operations
│   ├── trade.router.ts      ← Trade requests
│   └── profile.router.ts    ← User profile
```

**پوشش مورد نیاز:** 80%
- ✅ `loginWithEmail` procedure
- ✅ `register` procedure
- ✅ `logout` procedure
- ✅ `refreshToken` procedure
- ✅ `getProfile` procedure

### 2.2 Backend - Domain Logic (HIGH PRIORITY)
```
apps/server/src/domain/
├── entities/
│   ├── User.ts
│   └── Product.ts
└── repositories/
    ├── UserRepository.ts        ← User CRUD logic
    ├── ProductRepository.ts     ← Product CRUD logic
```

**پوشش مورد نیاز:** 75%

### 2.3 Shared - Validation Schemas (MEDIUM PRIORITY)
```
packages/shared/src/schemas/
├── auth.schema.ts           ← Zod validation rules
├── product.schema.ts
└── trade.schema.ts
```

**پوشش مورد نیاز:** 70%

### 2.4 Frontend - Components & Hooks (MEDIUM PRIORITY)
```
apps/web/src/
├── components/ui/           ← Basic UI components
│   ├── button.tsx
│   ├── card.tsx
│   └── input.tsx
├── hooks/useDebounce.ts      ← Custom hooks
└── lib/utils.ts              ← Utility functions (cn, etc.)
```

**پوشش مورد نیاز:** 70%

---

## 3. استراتژی تست‌نویسی

### Phase 1: Unit Tests (40% of coverage)

#### 3.1 Validation Schemas
```typescript
// File: packages/shared/src/schemas/auth.schema.test.ts
describe('Auth Schemas', () => {
  describe('loginWithEmailSchema', () => {
    it('should validate valid email and password', () => {
      const data = { email: 'test@example.com', password: '123456', captchaToken: 'token' };
      expect(() => loginWithEmailSchema.parse(data)).not.toThrow();
    });
    
    it('should reject invalid email', () => {
      const data = { email: 'invalid', password: '123456', captchaToken: 'token' };
      expect(() => loginWithEmailSchema.parse(data)).toThrow();
    });
    
    it('should reject short password', () => {
      const data = { email: 'test@example.com', password: '123', captchaToken: 'token' };
      expect(() => loginWithEmailSchema.parse(data)).toThrow();
    });
    
    it('should allow optional captchaToken', () => {
      const data = { email: 'test@example.com', password: '123456' };
      expect(() => loginWithEmailSchema.parse(data)).not.toThrow();
    });
  });
});
```

#### 3.2 Utility Functions
```typescript
// File: apps/web/src/lib/utils.test.ts
describe('cn() utility', () => {
  it('should merge Tailwind classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4');
    expect(result).toContain('px-4');
    expect(result).not.toContain('px-2');
  });
  
  it('should handle conditional classes', () => {
    const result = cn('base', false && 'conditional', true && 'active');
    expect(result).toContain('base');
    expect(result).toContain('active');
    expect(result).not.toContain('conditional');
  });
});
```

#### 3.3 Custom Hooks
```typescript
// File: apps/web/src/hooks/useDebounce.test.ts
describe('useDebounce hook', () => {
  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(() => useDebounce('initial', 300));
    expect(result.current).toBe('initial');
    
    // Simulate value change
    rerender('updated');
    expect(result.current).toBe('initial'); // Still debounced
    
    // Wait for debounce
    await waitFor(() => {
      expect(result.current).toBe('updated');
    }, { timeout: 500 });
  });
});
```

---

### Phase 2: Integration Tests (35% of coverage)

#### 3.4 tRPC Procedures (Most Important)
```typescript
// File: apps/server/src/interface/trpc/routers/auth.router.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestTRPCCaller } from '../../../test/test-context.js';

describe('Auth Router', () => {
  let caller: ReturnType<typeof createTestTRPCCaller>;
  
  beforeAll(async () => {
    // Setup test database
    caller = createTestTRPCCaller();
  });
  
  afterAll(async () => {
    // Cleanup
  });
  
  describe('loginWithEmail', () => {
    it('should login with valid credentials', async () => {
      const result = await caller.auth.loginWithEmail({
        email: 'test@example.com',
        password: 'TestPass123!',
        captchaToken: 'test-token',
      });
      
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@example.com');
    });
    
    it('should reject invalid email', async () => {
      await expect(
        caller.auth.loginWithEmail({
          email: 'nonexistent@example.com',
          password: 'TestPass123!',
          captchaToken: 'test-token',
        })
      ).rejects.toThrow();
    });
    
    it('should reject wrong password', async () => {
      // First create a user
      await caller.auth.register({
        userCode: 'testuser',
        email: 'test2@example.com',
        password: 'CorrectPass123!',
        captchaToken: 'test-token',
      });
      
      // Try with wrong password
      await expect(
        caller.auth.loginWithEmail({
          email: 'test2@example.com',
          password: 'WrongPass123!',
          captchaToken: 'test-token',
        })
      ).rejects.toThrow();
    });
  });
  
  describe('register', () => {
    it('should create new user', async () => {
      const result = await caller.auth.register({
        userCode: 'newuser',
        email: 'newuser@example.com',
        password: 'NewPass123!',
        captchaToken: 'test-token',
      });
      
      expect(result.user.userCode).toBe('newuser');
      expect(result.user.email).toBe('newuser@example.com');
      expect(result.user.status).toBe('PENDING');
    });
    
    it('should reject duplicate email', async () => {
      await caller.auth.register({
        userCode: 'user1',
        email: 'duplicate@example.com',
        password: 'Pass123!',
        captchaToken: 'test-token',
      });
      
      await expect(
        caller.auth.register({
          userCode: 'user2',
          email: 'duplicate@example.com',
          password: 'Pass123!',
          captchaToken: 'test-token',
        })
      ).rejects.toThrow();
    });
  });
  
  describe('logout', () => {
    it('should logout authenticated user', async () => {
      // Login first
      const loginResult = await caller.auth.loginWithEmail({
        email: 'test@example.com',
        password: 'TestPass123!',
        captchaToken: 'test-token',
      });
      
      // Create caller with auth context
      const authenticatedCaller = createTestTRPCCaller(loginResult.accessToken);
      
      // Logout
      await expect(
        authenticatedCaller.auth.logout()
      ).resolves.not.toThrow();
    });
  });
});
```

#### 3.5 Domain Logic
```typescript
// File: apps/server/src/domain/repositories/UserRepository.test.ts
describe('UserRepository', () => {
  let repo: UserRepository;
  
  beforeAll(() => {
    repo = new UserRepository(prisma);
  });
  
  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const result = await repo.findByEmail('test@example.com');
      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
    });
    
    it('should return null for non-existent email', async () => {
      const result = await repo.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });
  
  describe('create', () => {
    it('should create new user', async () => {
      const user = await repo.create({
        userCode: 'newcode',
        email: 'new@example.com',
        passwordHash: 'hashed_password',
      });
      
      expect(user.id).toBeDefined();
      expect(user.email).toBe('new@example.com');
    });
  });
});
```

---

### Phase 3: E2E Tests (25% of coverage)

#### 3.6 Critical User Flows
```typescript
// File: e2e/auth-complete-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Complete Flow', () => {
  test('should register, login, and access dashboard', async ({ page }) => {
    // Step 1: Navigate to register page
    await page.goto('http://localhost:5173/auth/register');
    
    // Step 2: Fill registration form
    await page.fill('input[name="userCode"]', 'testuser123');
    await page.fill('input[name="email"]', 'testuser123@example.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.fill('input[name="confirmPassword"]', 'TestPass123!');
    
    // Step 3: Submit
    await page.click('button:has-text("ثبت‌نام")');
    
    // Step 4: Verify registration success
    await expect(page).toHaveURL(/\/auth\/login|\/dashboard/);
    
    // Step 5: Login
    if (page.url().includes('login')) {
      await page.fill('input[name="email"]', 'testuser123@example.com');
      await page.fill('input[name="password"]', 'TestPass123!');
      await page.click('button:has-text("ورود")');
    }
    
    // Step 6: Verify dashboard access
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('h1')).toContainText('داشبورد');
  });
  
  test('should handle login with email tab', async ({ page }) => {
    await page.goto('http://localhost:5173/auth/login');
    
    // Click email tab
    await page.click('[data-tab="email"]');
    
    // Fill form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    
    // Submit
    await page.click('button:has-text("ورود")');
    
    // Verify
    await expect(page).toHaveURL(/\/dashboard/);
  });
  
  test('should show validation errors', async ({ page }) => {
    await page.goto('http://localhost:5173/auth/login');
    
    // Try with invalid email
    await page.fill('input[name="email"]', 'invalid');
    await page.fill('input[name="password"]', 'pass');
    await page.click('button:has-text("ورود")');
    
    // Check error message
    await expect(page.locator('.text-destructive')).toBeVisible();
  });
});
```

---

## 4. فایل‌ها و توابع برای تست

### Priority 1 (MUST TEST - 50% coverage base)
```
apps/server/src/interface/trpc/routers/
├── auth.router.ts
│   ├── loginWithEmail()
│   ├── register()
│   ├── logout()
│   └── refreshToken()
├── profile.router.ts
│   └── getProfile()
└── product.router.ts
    ├── list()
    └── getById()

packages/shared/src/schemas/
├── auth.schema.ts (all validators)
└── product.schema.ts (all validators)

apps/web/src/
├── lib/utils.ts (cn function)
└── store/auth.store.ts (Zustand slices)
```

### Priority 2 (SHOULD TEST - 20% additional coverage)
```
apps/server/src/domain/
├── repositories/*Repository.ts
└── entities/*.ts (validate methods)

apps/web/src/hooks/
├── useDebounce.ts
└── any custom hooks

apps/web/src/components/ui/
├── button.tsx
├── card.tsx
└── input.tsx
```

### Priority 3 (NICE TO TEST - 10% additional coverage)
```
apps/server/src/infrastructure/
├── cache/
└── queue/

E2E flows (marketplace, trading)
```

---

## 5. Setup و Dependencies

### 5.1 Required Packages (Already in project)
```json
{
  "devDependencies": {
    "vitest": "^1.x",
    "@vitest/ui": "^1.x",
    "@testing-library/react": "^14.x",
    "@testing-library/user-event": "^14.x",
    "playwright": "^1.x",
    "@playwright/test": "^1.x"
  }
}
```

### 5.2 Test Utilities File
```typescript
// File: apps/server/src/test/test-context.ts
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../main.ts';

export function createTestTRPCCaller(accessToken?: string) {
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: 'http://localhost:4000/trpc',
        headers: accessToken
          ? { authorization: `Bearer ${accessToken}` }
          : {},
        fetch: async (url, options) => {
          const res = await fetch(url as string, {
            ...options,
            credentials: 'include',
          });
          return res;
        },
      }),
    ],
  });
}
```

---

## 6. Coverage Targets

| Module | Target | Priority |
|--------|--------|----------|
| auth.router.ts | 85% | P0 |
| profile.router.ts | 80% | P0 |
| product.router.ts | 75% | P0 |
| auth schemas | 90% | P0 |
| UserRepository | 80% | P1 |
| Custom hooks | 75% | P1 |
| UI Components | 70% | P1 |
| **TOTAL** | **70-80%** | **✓** |

---

## 7. Running Tests

```bash
# Run all tests with coverage
npm run test -- --coverage

# Run specific suite
npm run test -- auth.router.test.ts

# Watch mode
npm run test -- --watch

# UI dashboard
npm run test -- --ui

# E2E tests
npx playwright test

# E2E watch mode
npx playwright test --ui
```

---

## 8. مراحل اجرا برای Raptor Mini

1. **ابتدا:** ساختار پروژه را فهمید (معماری در بخش 1)
2. **سپس:** فایل‌های Priority 1 را تست‌نویسی کنید (auth, schemas)
3. **بعد:** integration tests برای repositories نوشتید
4. **سپس:** E2E tests برای critical flows نوشتید
5. **آخر:** coverage report گرفتید و 70-80% را تحقق بخشید

---

## 9. Coverage خروجی مورد انتظار

```
=============================== Coverage summary ===============================
Statements   : 76.2% ( 1200/1575 )
Branches     : 72.5% ( 580/800 )
Functions    : 78.1% ( 450/576 )
Lines        : 75.8% ( 1100/1450 )
================================================================================
```

---

## نکات مهم

⚠️ **Do's:**
- ✅ هر procedure را حداقل 3 test cases کنید (success, validation error, logic error)
- ✅ Database state را پاک کنید (`beforeEach` و `afterEach`)
- ✅ Mocking استفاده کنید برای external services
- ✅ Descriptive test names نوشتید (فارسی یا انگلیسی)

❌ **Don'ts:**
- ❌ Hard-coded values استفاده نکنید (factory functions استفاده کنید)
- ❌ Tests به یکدیگر dependent نباشند
- ❌ Database state بین tests تغییر نکند
- ❌ Async operations بدون await نباشند

---

## نمونه: یک Test Suite کامل

```typescript
// File: apps/server/src/interface/trpc/routers/auth.router.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { createTestTRPCCaller } from '../../../test/test-context.js';
import { prisma } from '@vaahedi/db';

describe('Auth Router', () => {
  let caller: ReturnType<typeof createTestTRPCCaller>;
  
  beforeAll(async () => {
    // Initialize test database
    caller = createTestTRPCCaller();
    // Run migrations if needed
  });
  
  afterAll(async () => {
    // Cleanup
  });
  
  beforeEach(async () => {
    // Clear auth-related tables
    await prisma.user.deleteMany({});
  });
  
  afterEach(async () => {
    // Ensure cleanup after each test
    await prisma.user.deleteMany({});
  });
  
  // Test cases here...
});
```

---

**Status:** ✅ Ready for Raptor Mini  
**Estimated Effort:** 40-60 hours (full coverage 70-80%)  
**Output:** Comprehensive test suite + CI/CD integration
