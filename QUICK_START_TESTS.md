# QUICK START: Raptor Mini Test Generation

**هدف:** سریع‌ترین راه برای نوشتن تست‌های 70-80% coverage

---

## 🚀 گام به گام

### گام 1: شروع - Priority 1 فایل‌ها
```bash
# اولویت اول: auth router (50% coverage)
# فایل: apps/server/src/interface/trpc/routers/auth.router.test.ts

# شامل باید:
- loginWithEmail: 4 test cases
- register: 4 test cases  
- logout: 2 test cases
- refreshToken: 2 test cases

# Expected: 150-200 lines of test code
```

### گام 2: Validation Schemas (15% coverage)
```bash
# فایل: packages/shared/src/schemas/auth.schema.test.ts

# شامل باید:
- loginWithEmailSchema: 8 validators × 2-3 tests each
- registerSchema: 8 validators × 2-3 tests each

# Expected: 100-150 lines
```

### گام 3: Utilities & Hooks (10% coverage)
```bash
# فایل 1: apps/web/src/lib/utils.test.ts
# فایل 2: apps/web/src/hooks/useDebounce.test.ts

# Expected: 80-120 lines total
```

### گام 4: E2E Critical Path (5% coverage)
```bash
# فایل: e2e/auth-register-login.spec.ts
# شامل:
- Register → Login → Dashboard

# Expected: 60-80 lines
```

---

## 📝 Quick Template

```typescript
// Minimal test file template
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Module Name', () => {
  beforeEach(async () => {
    // Setup
  });
  
  afterEach(async () => {
    // Cleanup
  });
  
  describe('Function/Method Name', () => {
    it('should do X', async () => {
      // Arrange
      const input = { /* ... */ };
      
      // Act
      const result = await functionUnderTest(input);
      
      // Assert
      expect(result).toBeDefined();
    });
    
    it('should fail on invalid input', async () => {
      // Arrange
      const badInput = { /* ... */ };
      
      // Act & Assert
      await expect(functionUnderTest(badInput)).rejects.toThrow();
    });
  });
});
```

---

## ✅ Coverage Checklist

| فایل | Test Cases | Lines | Status |
|------|-----------|-------|--------|
| auth.router.ts | 12 | 200 | |
| auth.schema.ts | 16 | 150 | |
| useDebounce.ts | 4 | 80 | |
| utils.ts | 6 | 60 | |
| E2E auth flow | 3 | 80 | |
| **TOTAL** | **41** | **570** | **→ 75%** |

---

## 🎯 کلیدی نکات

1. **Arrange-Act-Assert:** هر test اینطرزی
   - Arrange: داده‌ها آماده کن
   - Act: تابع رو صدا کن
   - Assert: نتیجه check کن

2. **Negative Cases:** برای هر success test، یک failure test بنویس
3. **Edge Cases:** null، empty string، boundary values
4. **Async:** تمام async operations با await یا .rejects به handle کن

---

## 🔗 Resources Needed

- Vitest docs: https://vitest.dev
- Testing Library: https://testing-library.com/docs/react-testing-library
- Playwright: https://playwright.dev

---

**Total Effort:** 20-30 hours  
**Output:** ~570 lines of tests covering 75% of critical code
