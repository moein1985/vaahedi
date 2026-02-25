import type { ISMSService } from '../../application/ports/index.js';

// ذخیره موقت OTP در حافظه (برای تست)
const otpStore = new Map<string, { code: string; expiresAt: Date }>();

export class MockSMSService implements ISMSService {
  async sendOTP(mobile: string): Promise<{ ok: boolean; expiresAt: Date }> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // ۵ دقیقه
    otpStore.set(mobile, { code, expiresAt });
    // در محیط dev کد را لاگ کن
    console.log(`[MockSMS] OTP for ${mobile}: ${code}`);
    return { ok: true, expiresAt };
  }

  async verifyOTP(mobile: string, code: string): Promise<boolean> {
    const entry = otpStore.get(mobile);
    if (!entry) return false;
    if (new Date() > entry.expiresAt) {
      otpStore.delete(mobile);
      return false;
    }
    if (entry.code !== code) return false;
    otpStore.delete(mobile);
    return true;
  }
}