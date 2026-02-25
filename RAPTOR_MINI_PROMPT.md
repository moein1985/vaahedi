# 🤖 RAPTOR MINI: AUTOMATED TEST GENERATION PROMPT

**Status:** Ready to Paste into Raptor Mini  
**Mode:** Autonomous Code Generation  
**Goal:** Generate comprehensive test suite with 70-80% coverage

---

## YOUR TASK

You are an expert test engineer tasked with writing comprehensive tests for a TypeScript/JavaScript full-stack application (Vaahedi: B2B marketplace platform).

**Requirements:**
1. Achieve 70-80% code coverage across critical modules
2. Write ~570 lines of test code across multiple files
3. Follow existing test patterns in the codebase
4. Use Vitest for unit/integration tests and Playwright for E2E
5. Ensure all async operations are properly handled
6. Include positive, negative, and edge case test scenarios

---

## PROJECT CONTEXT

### Architecture
```
Frontend: React 19 + Vite + TanStack Router
Backend: Node.js + Fastify + tRPC
Database: PostgreSQL 17 + Prisma
Testing: Vitest + Playwright
```

### Critical Modules to Test (Priority Order)

**P0 - MUST TEST (50% coverage base)**
1. `apps/server/src/interface/trpc/routers/auth.router.ts`
   - loginWithEmail(), register(), logout(), refreshToken()
   - Write 12+ test cases total

2. `packages/shared/src/schemas/auth.schema.ts`
   - Zod validation for all auth inputs
   - Write 16+ test cases (each validator + edge cases)

3. `apps/server/src/domain/repositories/UserRepository.ts`
   - CRUD operations for users
   - Write 10+ test cases

**P1 - SHOULD TEST (20% additional coverage)**
4. `apps/web/src/lib/utils.ts` (cn function for Tailwind merging)
   - Write 6 test cases

5. `apps/web/src/hooks/useDebounce.ts`
   - Write 4 test cases

6. `apps/web/src/components/ui/button.tsx`
   - Write 6 test cases

**P2 - E2E TESTS (5% coverage)**
7. End-to-end authentication flow
   - Write 3 Playwright test cases

---

## DETAILED TEST REQUIREMENTS

### 1. Auth Router Tests
**File:** `apps/server/src/interface/trpc/routers/auth.router.test.ts`

Test Cases to Write:
```
loginWithEmail()
  ✓ Should successfully login with valid email and password
  ✓ Should reject non-existent email
  ✓ Should reject incorrect password
  ✓ Should return user object with accessToken

register()
  ✓ Should create new user with valid inputs
  ✓ Should reject duplicate email
  ✓ Should reject invalid email format
  ✓ Should hash password (not return plaintext)

logout()
  ✓ Should invalidate user session
  ✓ Should work for authenticated users only

refreshToken()
  ✓ Should return new accessToken with valid refresh token
  ✓ Should reject expired refresh token
```

**Setup Technology:**
- Use `createTestTRPCCaller()` helper to invoke procedures
- Clear database before each test with `beforeEach()`
- Create test data with factory functions
- Mock external services if needed (email, captcha)

### 2. Auth Schema Tests
**File:** `packages/shared/src/schemas/auth.schema.test.ts`

Validators to Test:
```
loginWithEmailSchema
  ✓ Valid email + password + optional captchaToken
  ✓ Invalid email format
  ✓ Password too short (<6 chars)
  ✓ Password too long (>128 chars)
  ✓ Empty email
  ✓ Special characters in password
  ✓ Unicode characters in password
  ✓ Null/undefined values

registerSchema (similar coverage)
```

**Pattern:** For each validator, test:
- Valid input → parses without error
- Invalid input → throws ZodError with appropriate message

### 3. UserRepository Tests
**File:** `apps/server/src/domain/repositories/UserRepository.test.ts`

Methods to Test:
```
findByEmail(email)
  ✓ Returns user when found
  ✓ Returns null when not found
  ✓ Case-insensitive matching

create(userData)
  ✓ Creates user with all required fields
  ✓ Rejects on duplicate email

update(id, data)
  ✓ Updates user fields
  ✓ Preserves other fields

delete(id)
  ✓ Removes user from database
  ✓ Returns deleted user object
```

### 4. Utility Functions Tests
**File:** `apps/web/src/lib/utils.test.ts`

Function: `cn()` (Tailwind class merger)
```
cn()
  ✓ Merges multiple class strings
  ✓ Removes conflicting Tailwind classes
  ✓ Handles conditional classes (truthy/falsy)
  ✓ Handles array of classes
  ✓ Handles null/undefined values
  ✓ Preserves important non-conflicting classes
```

### 5. Custom Hooks Tests
**File:** `apps/web/src/hooks/useDebounce.test.ts`

Hook: `useDebounce(value, delay)`
```
useDebounce()
  ✓ Returns initial value immediately
  ✓ Delays value updates by specified delay
  ✓ Cancels previous debounce on new value
  ✓ Handles rapid successive updates
```

### 6. UI Component Tests
**File:** `apps/web/src/components/ui/button.test.tsx`

Component: Button
```
<Button/>
  ✓ Renders with default styling
  ✓ Applies variant props (primary, outline, ghost)
  ✓ Applies size props (sm, md, lg)
  ✓ Shows loading state with spinner
  ✓ Disables when loading=true
  ✓ Calls onClick handler
```

### 7. E2E Tests
**File:** `e2e/auth-complete-flow.spec.ts`

Flows to Test:
```
Register → Login → Dashboard
  ✓ User can register with valid data
  ✓ Registered user can login
  ✓ Successfully redirected to dashboard
  ✓ Shows error on invalid registration
  ✓ Shows error on wrong credentials
```

---

## IMPLEMENTATION GUIDELINES

### Test Structure
```typescript
describe('Module/Feature', () => {
  // Setup
  beforeEach(async () => {
    // Initialize test state
    // Create test data
  });

  afterEach(async () => {
    // Cleanup
    // Clear database records
    // Reset mocks
  });

  describe('Specific Function', () => {
    it('should [expected behavior] when [condition]', async () => {
      // Arrange: Setup test data
      const input = { /* ... */ };

      // Act: Execute function
      const result = await functionToTest(input);

      // Assert: Verify result
      expect(result).toEqual(expectedValue);
    });

    it('should throw error when [invalid condition]', async () => {
      // Arrange
      const badInput = { /* invalid */ };

      // Act & Assert
      await expect(functionToTest(badInput)).rejects.toThrow();
    });
  });
});
```

### Testing Patterns Required

1. **Arrange-Act-Assert (AAA):** All tests follow this pattern
2. **Descriptive Names:** Test names explain what's being tested
3. **No Test Interdependence:** Each test runs independently
4. **Cleanup:** Database state cleaned before/after each test
5. **Mocking:** External dependencies mocked where appropriate
6. **Async Handling:** All async operations awaited or chained properly

### Coverage Metrics

Run tests with coverage:
```bash
npm run test -- --coverage
```

Expected Output:
```
=============================== Coverage summary ===============================
Statements   : 75.0% ( 1200/1600 )
Branches     : 72.0% ( 580/800 )
Functions    : 76.0% ( 450/590 )
Lines        : 74.0% ( 1100/1485 )
================================================================================
```

Target: **70-80% overall**

---

## FILES TO CREATE/MODIFY

**Create New Test Files:**
1. `apps/server/src/interface/trpc/routers/auth.router.test.ts` (200+ lines)
2. `packages/shared/src/schemas/auth.schema.test.ts` (150+ lines)
3. `apps/server/src/domain/repositories/UserRepository.test.ts` (120+ lines)
4. `apps/web/src/lib/utils.test.ts` (60+ lines)
5. `apps/web/src/hooks/useDebounce.test.ts` (80+ lines)
6. `apps/web/src/components/ui/button.test.tsx` (80+ lines)
7. `e2e/auth-complete-flow.spec.ts` (80+ lines)

**Total:** ~770 lines of test code

---

## CRITICAL SUCCESS FACTORS

✅ **Do This:**
- Write 3+ test cases per function (success, invalid input, edge case)
- Test both positive and negative paths
- Mock database calls in unit tests
- Use factories for test data
- Clean database state between tests
- Handle async/await correctly
- Include error message assertions

❌ **Don't Do This:**
- Hard-code test data (use factories)
- Create test interdependencies
- Forget to cleanup database state
- Skip error case testing
- Use generic assertions (verify specific properties)
- Leave commented-out code

---

## EXECUTION CHECKLIST

- [ ] Create auth.router.test.ts with 12+ test cases
- [ ] Create auth.schema.test.ts with 16+ test cases
- [ ] Create UserRepository.test.ts with 10+ test cases
- [ ] Create utils.test.ts with 6+ test cases
- [ ] Create useDebounce.test.ts with 4+ test cases
- [ ] Create button.test.tsx with 6+ test cases
- [ ] Create E2E auth flow test with 3+ test cases
- [ ] Run full test suite: `npm run test -- --coverage`
- [ ] Verify coverage is 70-80%
- [ ] All tests pass (0 failures)
- [ ] Commit with message: "test: add comprehensive test suite with 75% coverage"

---

## HELPFUL COMMANDS

```bash
# Run all tests
npm run test

# Run with coverage report
npm run test -- --coverage

# Run specific file
npm run test -- auth.router.test.ts

# Watch mode
npm run test -- --watch

# UI dashboard
npm run test -- --ui

# E2E tests
npx playwright test

# E2E with UI
npx playwright test --ui
```

---

## NOTES FOR RAPTOR MINI

- You have complete autonomy to create these test files
- Generate realistic, production-quality tests
- Follow the exact structure and patterns shown above
- Ensure each test is independent and isolated
- Test both happy and unhappy paths
- Include edge cases (null, empty, boundary values)
- All async operations must use async/await
- Database cleanup must happen in beforeEach/afterEach
- Final coverage target: 70-80%

**Expected Output:** 
- 7 new test files
- ~770 lines of test code
- 41+ implemented test cases
- 75% code coverage achieved

---

**Status:** ✅ Ready for Raptor Mini  
**Complexity:** Medium-High  
**Estimated Time:** 30-40 hours  
**Go Time:** 🚀
