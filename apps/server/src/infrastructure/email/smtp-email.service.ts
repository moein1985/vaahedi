import { createTransport, Transporter } from 'nodemailer';
import type { IEmailService, EmailPayload } from '../../application/ports/index.js';

export class SmtpEmailService implements IEmailService {
  private transporter: Transporter;

  constructor(smtpConfig: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
    from: string;
  }) {
    this.transporter = createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: smtpConfig.auth,
    });
  }

  async sendEmail(payload: EmailPayload): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env['SMTP_FROM'] || 'noreply@vaahedi.com',
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });
    } catch (error) {
      console.error('[SmtpEmailService] Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendOtp(mobile: string, otp: string): Promise<void> {
    // برای OTP از SMS استفاده می‌کنیم، نه ایمیل
    throw new Error('OTP should be sent via SMS, not email');
  }
}