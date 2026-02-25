import { Worker } from 'bullmq';
import { connection } from './queue-config.js';
import { SmtpEmailService } from '../email/smtp-email.service.js';

export type EmailJobData = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

// ایجاد instance از email service
const smtpConfig = {
  host: process.env['SMTP_HOST'] || 'smtp.gmail.com',
  port: parseInt(process.env['SMTP_PORT'] || '587'),
  secure: process.env['SMTP_SECURE'] === 'true',
  auth: {
    user: process.env['SMTP_USER'] || '',
    pass: process.env['SMTP_PASS'] || '',
  },
  from: process.env['SMTP_FROM'] || 'noreply@vaahedi.com',
};

const emailService = new SmtpEmailService(smtpConfig);

export const emailWorker = new Worker<EmailJobData>(
  'emails',
  async (job) => {
    const { to, subject, html, text } = job.data;
    console.log(`[EmailWorker] Sending email to ${to}: ${subject}`);

    await emailService.sendEmail({
      to,
      subject,
      html,
      text,
    });
  },
  { connection }
);

emailWorker.on('completed', (job) => {
  console.log(`[EmailWorker] Job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`[EmailWorker] Job ${job?.id} failed:`, err);
});