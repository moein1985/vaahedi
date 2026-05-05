import OpenAI from 'openai';
import type { IAIChatService, ChatMessage } from '../../application/ports/index.js';

// ─── System Prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `شما یک دستیار هوشمند تخصصی برای مرکز تجارت متمرکز هوشمند ایرانیان هستید.

وظایف اصلی شما:
- پاسخ به سؤالات درباره واردات و صادرات کالا
- راهنمایی در مورد کدهای تعرفه گمرکی (HS Code)
- توضیح مقررات ارزی و رفع تعهدات ارزی
- کمک در امور گمرکی و لجستیک
- اطلاعات درباره Incoterms (EXW، FOB، FCA و...)
- راهنمایی اعتبارات اسنادی (LC، SBLC، TT)

محدودیت‌ها:
- فقط به سؤالات مرتبط با تجارت، بازرگانی و فعالیت‌های اقتصادی پاسخ دهید
- از ارائه مشاوره حقوقی یا مالی مستقیم خودداری کنید
- همیشه توصیه کنید برای تصمیمات مهم با کارشناسان مشورت شود

پاسخ‌ها باید:
- به فارسی و روان باشد
- دقیق و مختصر
- در صورت نیاز به اطلاعات بیشتر، سؤال بپرسید`;

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
      systemContent += `\nتعداد RFQ فعال: ${ctx.activeTradesCount ?? 0}`;
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
