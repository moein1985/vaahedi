import { describe, it, expect } from 'vitest';
import {
  loginWithEmailSchema,
  registerSchema,
} from './auth.schema.js';
import { z } from 'zod';

describe('Auth Schemas', () => {
  describe('loginWithEmailSchema', () => {
    it('should parse valid input', () => {
      const data = { email: 'test@example.com', password: 'Pass1234' };
      expect(() => loginWithEmailSchema.parse(data)).not.toThrow();
    });

    it('should allow optional captchaToken', () => {
      const data = { email: 'test@example.com', password: 'Pass1234', captchaToken: 'abc' };
      expect(() => loginWithEmailSchema.parse(data)).not.toThrow();
    });

    it('should reject invalid email format', () => {
      const bad = { email: 'invalid', password: 'Pass1234' };
      expect(() => loginWithEmailSchema.parse(bad)).toThrow(z.ZodError);
    });

    it('should reject empty password', () => {
      const bad = { email: 'test@example.com', password: '' };
      expect(() => loginWithEmailSchema.parse(bad)).toThrow();
    });

    it('should reject null/undefined values', () => {
      // invalid types (null/undefined) should throw
      expect(() => loginWithEmailSchema.parse({ email: null, password: undefined } as any)).toThrow();
    });
  });

  describe('registerSchema', () => {
    it('should parse individual registration valid', () => {
      const data = {
        membershipType: 'INDIVIDUAL',
        firstName: 'Foo',
        lastName: 'Bar',
        nationalCode: '0123456789',
        mobile: '09123456789',
        email: 'foo@example.com',
        password: 'Pass1234',
        confirmPassword: 'Pass1234',
        role: 'TRADER',
        agreedToTerms: true,
        captchaToken: 'cap',
      };
      expect(() => registerSchema.parse(data)).not.toThrow();
    });

    it('should reject if passwords do not match', () => {
      const data = {
        membershipType: 'INDIVIDUAL',
        firstName: 'Foo',
        lastName: 'Bar',
        nationalCode: '0123456789',
        mobile: '09123456789',
        email: 'foo@example.com',
        password: 'Pass1234',
        confirmPassword: 'Wrong',
        role: 'TRADER',
        agreedToTerms: true,
        captchaToken: 'cap',
      };
      expect(() => registerSchema.parse(data)).toThrow(/رمز/);
    });

    it('should reject missing agreedToTerms', () => {
      const { agreedToTerms, ...rest } = {
        membershipType: 'INDIVIDUAL',
        firstName: 'Foo',
        lastName: 'Bar',
        nationalCode: '0123456789',
        mobile: '09123456789',
        email: 'foo@example.com',
        password: 'Pass1234',
        confirmPassword: 'Pass1234',
        role: 'TRADER',
        agreedToTerms: true,
        captchaToken: 'cap',
      };
      // missing agreedToTerms should trigger error
      expect(() => registerSchema.parse(rest as any)).toThrow();
    });

    it('should reject invalid email in registration', () => {
      const data = {
        membershipType: 'INDIVIDUAL',
        firstName: 'Foo',
        lastName: 'Bar',
        nationalCode: '0123456789',
        mobile: '09123456789',
        email: 'not-an-email',
        password: 'Pass1234',
        confirmPassword: 'Pass1234',
        role: 'TRADER',
        agreedToTerms: true,
        captchaToken: 'cap',
      };
      expect(() => registerSchema.parse(data)).toThrow();
    });

    it('should handle legal registration variant', () => {
      const data = {
        membershipType: 'LEGAL',
        companyName: 'My Co',
        nationalId: '12345678901',
        registrationNumber: 'REG123',
        ceoFirstName: 'Jane',
        ceoLastName: 'Doe',
        ceoNationalCode: '0123456789',
        mobile: '09123456789',
        email: 'legal@example.com',
        password: 'Pass1234',
        confirmPassword: 'Pass1234',
        role: 'TRADER',
        agreedToTerms: true,
        captchaToken: 'cap',
      };
      expect(() => registerSchema.parse(data)).not.toThrow();
    });
  });
});
