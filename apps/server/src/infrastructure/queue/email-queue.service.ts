import { Queue } from 'bullmq';
import { connection } from './queue-config.js';
import type { EmailJobData } from './email-worker.js';

export class EmailQueueService {
  private queue: Queue<EmailJobData>;

  constructor() {
    this.queue = new Queue<EmailJobData>('emails', { connection });
  }

  async sendEmail(data: EmailJobData): Promise<void> {
    await this.queue.add('send-email', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    });
  }

  async sendTemplate(template: keyof typeof import('./email-templates.js').emailTemplates, userEmail: string, ...args: any[]): Promise<void> {
    const templates = await import('./email-templates.js');
    const emailData = (templates.emailTemplates[template] as (...a: unknown[]) => { subject: string; html: string })(...args);

    await this.sendEmail({
      to: userEmail,
      subject: emailData.subject,
      html: emailData.html,
    });
  }
}