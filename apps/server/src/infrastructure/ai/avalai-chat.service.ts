import OpenAI from 'openai';
import type { IAIChatService, ChatMessage } from '../../application/ports/index.js';

// ─── System Prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `شما یک دستیار هوشمند تخصصی برای سامانه یکپارچه ذینفعان حوزه کشاورزی هستید.

وظایف اصلی شما:
- پاسخ به سوالات مرتبط با پروفایل ذینفعان، محصولات، خدمات و درخواست های همکاری
- راهنمایی برای بهبود کیفیت ثبت اطلاعات، دسته بندی و تکمیل مدارک
- ارائه پیشنهادهای کاربردی بر اساس حوزه فعالیت، وضعیت پروفایل و خدمات فعال
- کمک در درک بهتر بخش های تقویم برداشت و تحلیل بازار نمایشی

محدودیت ها:
- فقط به موضوعات مرتبط با حوزه کشاورزی، عملیات سامانه و تعاملات حرفه ای پاسخ دهید
- از ارائه تصمیم قطعی حقوقی، مالی یا درمانی خودداری کنید
- برای تصمیمات مهم، کاربر را به بررسی کارشناسی و منابع رسمی ارجاع دهید

پاسخ ها باید:
- به فارسی روان و حرفه ای باشد
- دقیق، کوتاه و اقدام پذیر باشد
- در صورت کمبود اطلاعات، سوال شفاف تکمیلی بپرسید`;

// ─── Avalai Chat Service ───────────────────────────────────────────────────────

export class AvalaiChatService implements IAIChatService {
  private client: OpenAI | null = null;
  private model: string;

  constructor(config: {
    apiKey: string;
    baseUrl: string;
    model: string;
  }) {
    if (config.apiKey) {
      this.client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseUrl,
      });
    }
    this.model = config.model;
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async *sendMessage(params: {
    conversationId: string;
    messages: ChatMessage[];
    userContext?: {
      role?: string;
      commodityGroup?: string;
      activityType?: string;
      companyName?: string;
      profileCompletionPercent?: number;
      activeProductsCount?: number;
      activeTradesCount?: number;
      unreadNotificationsCount?: number;
      offeredServices?: string[];
      platformServices?: string[];
    };
  }): AsyncGenerator<string, void, unknown> {
    if (!this.client) {
      throw new Error('AI chat service is not configured');
    }

    // اضافه کردن System Prompt با context کاربر
    let systemContent = SYSTEM_PROMPT;
    if (params.userContext) {
      const ctx = params.userContext;
      const offeredServices = (ctx.offeredServices ?? []).filter(Boolean).join('، ');
      const platformServices = (ctx.platformServices ?? []).filter(Boolean).join('، ');

      systemContent += `\n\n--- کانتکست ارکستریت شده کاربر ---`;
      systemContent += `\nنقش کاربر: ${ctx.role ?? 'نامشخص'}`;
      systemContent += `\nنام شرکت/واحد: ${ctx.companyName ?? 'نامشخص'}`;
      systemContent += `\nحوزه فعالیت: ${ctx.activityType ?? 'نامشخص'}`;
      systemContent += `\nگروه کالایی: ${ctx.commodityGroup ?? 'نامشخص'}`;
      systemContent += `\nتکمیل پروفایل: ${ctx.profileCompletionPercent ?? 0}%`;
      systemContent += `\nتعداد کالاهای کاربر: ${ctx.activeProductsCount ?? 0}`;
      systemContent += `\nتعداد درخواست های فعال: ${ctx.activeTradesCount ?? 0}`;
      systemContent += `\nتعداد اعلان خوانده نشده: ${ctx.unreadNotificationsCount ?? 0}`;
      systemContent += `\nخدمات/کدهای فعال کاربر: ${offeredServices || 'موردی ثبت نشده'}`;
      systemContent += `\nخدمات قابل ارائه پلتفرم: ${platformServices || 'نامشخص'}`;
      systemContent += `\nراهنما: پاسخ را متناسب با حوزه فعالیت و خدمات فعال کاربر شخصی سازی کن.`;
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemContent },
      ...params.messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages,
      stream: true,
      max_tokens: 2000,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }
}
