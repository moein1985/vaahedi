export interface SmsProvider {
  sendOtp(mobile: string, otp: string, purpose: 'LOGIN' | 'REGISTER' | 'RESET_PASSWORD'): Promise<void>;
  sendTemplate(mobile: string, template: string, params: Record<string, string>): Promise<void>;
}

export class KavehNegarSmsProvider implements SmsProvider {
  constructor(
    private apiKey: string,
    private sender: string = '2000500666', // شماره ارسال کننده پیش‌فرض
  ) {}

  async sendOtp(mobile: string, otp: string, purpose: 'LOGIN' | 'REGISTER' | 'RESET_PASSWORD'): Promise<void> {
    const purposeText = {
      LOGIN: 'ورود به سیستم',
      REGISTER: 'ثبت‌نام',
      RESET_PASSWORD: 'بازیابی رمز عبور',
    };

    const message = `کد تأیید ${purposeText[purpose]} وهدی: ${otp}\n\nاین کد تا ۲ دقیقه معتبر است.`;

    await this.sendSms(mobile, message);
  }

  async sendTemplate(mobile: string, template: string, params: Record<string, string>): Promise<void> {
    // برای template های آماده در پنل کاوه‌نگار
    const response = await fetch('https://api.kavenegar.com/v1/' + this.apiKey + '/verify/lookup.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        receptor: mobile,
        template: template,
        ...params,
      }),
    });

    if (!response.ok) {
      throw new Error(`KavehNegar API error: ${response.statusText}`);
    }

    const result = await response.json() as { return: { status: number; message: string } };
    if (result.return.status !== 200) {
      throw new Error(`KavehNegar error: ${result.return.message}`);
    }
  }

  private async sendSms(mobile: string, message: string): Promise<void> {
    const response = await fetch('https://api.kavenegar.com/v1/' + this.apiKey + '/sms/send.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        receptor: mobile,
        message: message,
        sender: this.sender,
      }),
    });

    if (!response.ok) {
      throw new Error(`KavehNegar API error: ${response.statusText}`);
    }

    const result = await response.json() as { return: { status: number; message: string } };
    if (result.return.status !== 200) {
      throw new Error(`KavehNegar error: ${result.return.message}`);
    }
  }
}

export class MockSmsProvider implements SmsProvider {
  async sendOtp(mobile: string, otp: string, purpose: 'LOGIN' | 'REGISTER' | 'RESET_PASSWORD'): Promise<void> {
    console.log(`[MOCK SMS] OTP for ${mobile}: ${otp} (purpose: ${purpose})`);
  }

  async sendTemplate(mobile: string, template: string, params: Record<string, string>): Promise<void> {
    console.log(`[MOCK SMS] Template "${template}" to ${mobile} with params:`, params);
  }
}