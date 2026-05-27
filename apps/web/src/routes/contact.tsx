import { createFileRoute, Link } from '@tanstack/react-router';
import { type FormEvent, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ClipboardList, Mail, MapPin, Phone, SendHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher.js';
import { Button } from '../components/ui/button.js';
import { Input } from '../components/ui/input.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.js';
import { trpc } from '../trpc.js';

export const Route = createFileRoute('/contact')({
  component: ContactPage,
});

type Language = 'fa' | 'en' | 'ar';
type MessageTone = 'success' | 'error';
type ChannelIconKey = 'phone' | 'mail' | 'location';

type SurveyQuestion = {
  id?: string;
  type?: string;
  text?: string;
  required?: boolean;
  options?: string[];
};

type SurveyItem = {
  id: string;
  title: string;
  description?: string | null;
  questions?: SurveyQuestion[];
};

type ContactCopy = {
  nav: {
    home: string;
    about: string;
    contact: string;
    login: string;
  };
  heroKicker: string;
  heroTitle: string;
  heroDesc: string;
  channels: Array<{
    title: string;
    value: string;
    note: string;
    icon: ChannelIconKey;
  }>;
  form: {
    title: string;
    subtitle: string;
    fields: {
      name: string;
      email: string;
      phone: string;
      subject: string;
      message: string;
    };
    placeholders: {
      phone: string;
      message: string;
    };
    submitIdle: string;
    submitPending: string;
  };
  survey: {
    title: string;
    subtitle: string;
    success: string;
    button: string;
    ratingPlaceholder: string;
    textPlaceholder: string;
    empty: string;
  };
  supportBox: {
    title: string;
    items: string[];
  };
  footerTitle: string;
  footerDesc: string;
};

const channelIcons: Record<ChannelIconKey, LucideIcon> = {
  phone: Phone,
  mail: Mail,
  location: MapPin,
};

function ContactPage() {
  const { i18n } = useTranslation();
  const normalizedLanguage = (i18n.resolvedLanguage ?? i18n.language ?? 'fa').split('-')[0];
  const language = (normalizedLanguage === 'en' || normalizedLanguage === 'ar' ? normalizedLanguage : 'fa') as Language;
  const isRtl = language !== 'en';

  const copyByLanguage: Record<Language, ContactCopy> = {
    fa: {
      nav: {
        home: 'خانه',
        about: 'درباره',
        contact: 'ارتباط',
        login: 'ورود',
      },
      heroKicker: 'CONTACT & SUPPORT CHANNELS',
      heroTitle: 'در ارتباط بمانیم',
      heroDesc:
        'برای ثبت درخواست همکاری، دریافت راهنمایی در تکمیل پروفایل یا پیگیری پیام های قبلی، از کانال های رسمی سامانه استفاده کنید.',
      channels: [
        {
          title: 'تلفن پشتیبانی',
          value: '+98 21 0000 0000',
          note: 'روزهای کاری 8 تا 16',
          icon: 'phone',
        },
        {
          title: 'ایمیل رسمی',
          value: 'support@agri-stakeholders.ir',
          note: 'پاسخگویی در کمتر از 24 ساعت',
          icon: 'mail',
        },
        {
          title: 'دفتر هماهنگی',
          value: 'تهران، ایران',
          note: 'جلسه حضوری با هماهنگی قبلی',
          icon: 'location',
        },
      ],
      form: {
        title: 'فرم رسمی ارتباط',
        subtitle: 'پیام، پیشنهاد یا نیاز همکاری خود را ثبت کنید تا تیم مربوطه پیگیری کند.',
        fields: {
          name: 'نام',
          email: 'ایمیل',
          phone: 'تلفن همراه',
          subject: 'موضوع',
          message: 'پیام',
        },
        placeholders: {
          phone: '09xxxxxxxxx',
          message: 'شرح کامل درخواست خود را بنویسید...',
        },
        submitIdle: 'ارسال پیام',
        submitPending: 'در حال ارسال...',
      },
      survey: {
        title: 'نظرسنجی های فعال',
        subtitle: 'نظر شما برای بهبود جریان های سامانه بسیار ارزشمند است.',
        success: 'پاسخ شما ثبت شد. ممنون از مشارکت شما.',
        button: 'ثبت پاسخ نظرسنجی',
        ratingPlaceholder: 'انتخاب امتیاز',
        textPlaceholder: 'پاسخ خود را بنویسید...',
        empty: 'در حال حاضر نظرسنجی فعالی در دسترس نیست.',
      },
      supportBox: {
        title: 'راهنمای پاسخگویی',
        items: [
          'پیام های مرتبط با عملیات روزانه در اولویت پاسخ قرار می گیرند.',
          'برای پیگیری سریع تر، موضوع و شرح مسئله را دقیق وارد کنید.',
          'درخواست های سازمانی از طریق ایمیل رسمی بررسی می شوند.',
        ],
      },
      footerTitle: 'سامانه یکپارچه ذینفعان حوزه کشاورزی',
      footerDesc: 'ارتباط ساختاریافته برای پیگیری درخواست ها، پشتیبانی و بهبود مستمر خدمات',
    },
    en: {
      nav: {
        home: 'Home',
        about: 'About',
        contact: 'Contact',
        login: 'Login',
      },
      heroKicker: 'CONTACT & SUPPORT CHANNELS',
      heroTitle: 'Let us stay connected',
      heroDesc:
        'Use official channels to submit collaboration requests, ask profile setup questions, or follow up on previous conversations.',
      channels: [
        {
          title: 'Support Phone',
          value: '+98 21 0000 0000',
          note: 'Business days, 8:00-16:00',
          icon: 'phone',
        },
        {
          title: 'Official Email',
          value: 'support@agri-stakeholders.ir',
          note: 'Response within 24 hours',
          icon: 'mail',
        },
        {
          title: 'Coordination Office',
          value: 'Tehran, Iran',
          note: 'In-person meeting by appointment',
          icon: 'location',
        },
      ],
      form: {
        title: 'Official Contact Form',
        subtitle: 'Submit your request, suggestion, or partnership need and our team will follow up.',
        fields: {
          name: 'Name',
          email: 'Email',
          phone: 'Phone',
          subject: 'Subject',
          message: 'Message',
        },
        placeholders: {
          phone: '+98...',
          message: 'Please describe your request in detail...',
        },
        submitIdle: 'Send Message',
        submitPending: 'Sending...',
      },
      survey: {
        title: 'Active Surveys',
        subtitle: 'Your feedback helps us improve platform workflows.',
        success: 'Your response has been submitted. Thank you.',
        button: 'Submit Survey Response',
        ratingPlaceholder: 'Select rating',
        textPlaceholder: 'Write your answer...',
        empty: 'There are no active surveys at the moment.',
      },
      supportBox: {
        title: 'Response Guidelines',
        items: [
          'Operational requests are prioritized for faster handling.',
          'Provide a clear subject and details for quicker follow-up.',
          'Organizational requests are reviewed through official email.',
        ],
      },
      footerTitle: 'Integrated Agriculture Stakeholders Platform',
      footerDesc: 'Structured communication for support, request follow-up, and service quality improvement',
    },
    ar: {
      nav: {
        home: 'الرئيسية',
        about: 'من نحن',
        contact: 'تواصل',
        login: 'دخول',
      },
      heroKicker: 'CONTACT & SUPPORT CHANNELS',
      heroTitle: 'لنبق على تواصل',
      heroDesc:
        'استخدم القنوات الرسمية لتسجيل طلبات التعاون أو الاستفسارات المتعلقة بالملف المهني أو متابعة الرسائل السابقة.',
      channels: [
        {
          title: 'هاتف الدعم',
          value: '+98 21 0000 0000',
          note: 'أيام العمل من 8 إلى 16',
          icon: 'phone',
        },
        {
          title: 'البريد الرسمي',
          value: 'support@agri-stakeholders.ir',
          note: 'الرد خلال 24 ساعة',
          icon: 'mail',
        },
        {
          title: 'مكتب التنسيق',
          value: 'طهران، إيران',
          note: 'زيارة حضورية بموعد مسبق',
          icon: 'location',
        },
      ],
      form: {
        title: 'نموذج التواصل الرسمي',
        subtitle: 'أرسل طلبك أو اقتراحك أو احتياجك للشراكة وسيقوم الفريق المختص بالمتابعة.',
        fields: {
          name: 'الاسم',
          email: 'البريد الإلكتروني',
          phone: 'الهاتف',
          subject: 'الموضوع',
          message: 'الرسالة',
        },
        placeholders: {
          phone: '+98...',
          message: 'يرجى كتابة تفاصيل طلبك...',
        },
        submitIdle: 'إرسال الرسالة',
        submitPending: 'جار الإرسال...',
      },
      survey: {
        title: 'الاستبيانات النشطة',
        subtitle: 'ملاحظاتكم تساعدنا على تحسين مسارات المنصة.',
        success: 'تم تسجيل إجابتكم. شكرا لمساهمتكم.',
        button: 'إرسال إجابة الاستبيان',
        ratingPlaceholder: 'اختر التقييم',
        textPlaceholder: 'اكتب إجابتك...',
        empty: 'لا توجد استبيانات نشطة حاليا.',
      },
      supportBox: {
        title: 'إرشادات الاستجابة',
        items: [
          'تُعالج الطلبات التشغيلية ذات الأولوية بشكل أسرع.',
          'اكتب موضوعا واضحا ووصفا دقيقا لتسريع المتابعة.',
          'تُراجع الطلبات المؤسسية عبر البريد الرسمي.',
        ],
      },
      footerTitle: 'منصة أصحاب المصلحة في القطاع الزراعي',
      footerDesc: 'تواصل منظم لمتابعة الطلبات، الدعم، وتحسين جودة الخدمات',
    },
  };

  const copy = copyByLanguage[language];

  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [msg, setMsg] = useState<{ text: string; tone: MessageTone } | null>(null);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, Record<string, unknown>>>({});
  const [surveyMsg, setSurveyMsg] = useState<Record<string, { text: string; tone: MessageTone }>>({});

  const { data: surveys } = trpc.services.activeSurveys.useQuery();
  const surveyList = (Array.isArray(surveys) ? surveys : []) as SurveyItem[];

  const submit = trpc.services.submitContactMessage.useMutation({
    onSuccess: (data) => {
      setMsg({ text: data.message, tone: 'success' });
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    },
    onError: (err) => setMsg({ text: err.message, tone: 'error' }),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit.mutate({
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      subject: form.subject,
      message: form.message,
    });
  };

  const submitSurvey = trpc.services.submitSurveyResponse.useMutation({
    onSuccess: (_, variables) => {
      setSurveyMsg((prev) => ({
        ...prev,
        [variables.surveyId]: { text: copy.survey.success, tone: 'success' },
      }));
      setSurveyAnswers((prev) => ({ ...prev, [variables.surveyId]: {} }));
    },
    onError: (error, variables) => {
      setSurveyMsg((prev) => ({
        ...prev,
        [variables.surveyId]: { text: error.message, tone: 'error' },
      }));
    },
  });

  const setAnswer = (surveyId: string, questionId: string, value: unknown) => {
    setSurveyAnswers((prev) => ({
      ...prev,
      [surveyId]: {
        ...(prev[surveyId] ?? {}),
        [questionId]: value,
      },
    }));
  };

  const onSubmitSurvey = (surveyId: string) => {
    submitSurvey.mutate({
      surveyId,
      respondentEmail: form.email || undefined,
      answers: (surveyAnswers[surveyId] ?? {}) as Record<string, unknown>,
    });
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-[linear-gradient(180deg,var(--field-mist)_0%,#ffffff_40%)] text-foreground">
      <header className="sticky top-0 z-50 border-b border-[hsl(90_14%_88%_/_0.65)] bg-[hsl(0_0%_100%_/_0.9)] backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(150deg,var(--agri-primary),var(--agri-leaf))] text-sm font-black text-white shadow-[0_10px_24px_hsl(148_62%_24%_/_0.35)]">
              ز
            </div>
            <span className="text-sm font-black text-foreground sm:text-base">{copy.footerTitle}</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-[var(--soil-neutral)] md:flex">
            <Link to="/" className="transition-colors hover:text-[var(--agri-primary)]">{copy.nav.home}</Link>
            <Link to="/about" className="transition-colors hover:text-[var(--agri-primary)]">{copy.nav.about}</Link>
            <Link to="/contact" className="text-[var(--agri-primary)]">{copy.nav.contact}</Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link to="/auth/login">{copy.nav.login}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-8 px-4 pb-16 pt-10 sm:space-y-10 sm:pt-14">
        <section className="rounded-3xl border border-[hsl(148_34%_78%_/_0.44)] bg-[linear-gradient(135deg,hsl(153_41%_12%),hsl(148_62%_24%))] px-6 py-8 text-white shadow-[0_20px_45px_hsl(153_41%_12%_/_0.25)] sm:px-9 sm:py-10">
          <p className="text-xs font-semibold tracking-[0.24em] text-[hsl(90_22%_88%_/_0.9)]">{copy.heroKicker}</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">{copy.heroTitle}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[hsl(90_22%_94%_/_0.9)] sm:text-base">{copy.heroDesc}</p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {copy.channels.map((channel) => {
              const Icon = channelIcons[channel.icon];
              return (
                <div key={channel.title} className="rounded-2xl border border-white/18 bg-white/10 px-4 py-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(40_62%_57%_/_0.24)] text-[hsl(44_94%_84%)]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="text-sm font-bold">{channel.title}</p>
                  </div>
                  <p className="mt-3 text-sm font-semibold">{channel.value}</p>
                  <p className="mt-1 text-xs text-[hsl(90_22%_92%_/_0.82)]">{channel.note}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-12">
          <Card className="border-[hsl(148_28%_82%_/_0.58)] bg-white/94 lg:col-span-8">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl font-black">{copy.form.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{copy.form.subtitle}</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--soil-neutral)]">
                      {copy.form.fields.name} <span className="text-[var(--error-red)]">*</span>
                    </label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--soil-neutral)]">
                      {copy.form.fields.email} <span className="text-[var(--error-red)]">*</span>
                    </label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} dir="ltr" required />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--soil-neutral)]">{copy.form.fields.phone}</label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      dir="ltr"
                      placeholder={copy.form.placeholders.phone}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--soil-neutral)]">
                      {copy.form.fields.subject} <span className="text-[var(--error-red)]">*</span>
                    </label>
                    <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--soil-neutral)]">
                    {copy.form.fields.message} <span className="text-[var(--error-red)]">*</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={6}
                    required
                    className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder={copy.form.placeholders.message}
                  />
                </div>

                {msg && (
                  <p className={`text-sm ${msg.tone === 'success' ? 'text-[var(--agri-leaf)]' : 'text-[var(--error-red)]'}`}>
                    {msg.text}
                  </p>
                )}

                <Button type="submit" disabled={submit.isPending} className="w-full gap-2">
                  <SendHorizontal className="h-4 w-4" />
                  {submit.isPending ? copy.form.submitPending : copy.form.submitIdle}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-[hsl(148_28%_82%_/_0.58)] bg-[linear-gradient(165deg,hsl(148_62%_24%_/_0.08),hsl(90_31%_97%))] lg:col-span-4">
            <CardHeader>
              <CardTitle className="text-lg font-black">{copy.supportBox.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {copy.supportBox.items.map((item) => (
                <div key={item} className="rounded-xl border border-[hsl(148_26%_84%)] bg-[hsl(90_33%_97%)] px-3 py-2.5 text-sm text-[var(--soil-neutral)]">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[var(--agri-primary)]" />
            <h2 className="text-2xl font-black text-foreground">{copy.survey.title}</h2>
          </div>
          <p className="text-sm text-muted-foreground">{copy.survey.subtitle}</p>

          {surveyList.length === 0 && (
            <Card className="border-[hsl(148_28%_82%_/_0.58)] bg-white/94">
              <CardContent className="p-6 text-sm text-muted-foreground">{copy.survey.empty}</CardContent>
            </Card>
          )}

          {surveyList.map((survey) => {
            const questions = Array.isArray(survey.questions) ? survey.questions : [];
            const surveyFeedback = surveyMsg[survey.id];

            return (
              <Card key={survey.id} className="border-[hsl(148_28%_82%_/_0.58)] bg-white/94">
                <CardHeader>
                  <CardTitle className="text-lg font-black">{survey.title}</CardTitle>
                  {survey.description && <p className="text-sm text-muted-foreground">{survey.description}</p>}
                </CardHeader>
                <CardContent className="space-y-4">
                  {questions.map((q, idx) => {
                    const qId = String(q.id ?? `q_${idx + 1}`);
                    const answer = surveyAnswers[survey.id]?.[qId] ?? '';
                    const qType = q.type === 'rating' || q.type === 'single_choice' ? q.type : 'text';
                    const qText = q.text ?? `Question ${idx + 1}`;

                    return (
                      <div key={qId} className="space-y-2">
                        <label className="block text-sm font-medium text-[var(--soil-neutral)]">
                          {qText}
                          {q.required ? <span className="text-[var(--error-red)]"> *</span> : null}
                        </label>

                        {qType === 'rating' ? (
                          <select
                            title={qText}
                            value={String(answer)}
                            onChange={(e) => setAnswer(survey.id, qId, e.target.value)}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <option value="">{copy.survey.ratingPlaceholder}</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                          </select>
                        ) : qType === 'single_choice' && Array.isArray(q.options) ? (
                          <div className="space-y-2">
                            {q.options.map((opt) => (
                              <label key={opt} className="flex items-center gap-2 text-sm text-[var(--soil-neutral)]">
                                <input
                                  type="radio"
                                  name={`${survey.id}-${qId}`}
                                  checked={answer === opt}
                                  onChange={() => setAnswer(survey.id, qId, opt)}
                                  className="h-4 w-4 accent-[var(--agri-primary)]"
                                />
                                {opt}
                              </label>
                            ))}
                          </div>
                        ) : (
                          <textarea
                            value={String(answer)}
                            onChange={(e) => setAnswer(survey.id, qId, e.target.value)}
                            rows={3}
                            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder={copy.survey.textPlaceholder}
                          />
                        )}
                      </div>
                    );
                  })}

                  {surveyFeedback && (
                    <p
                      className={`text-sm ${surveyFeedback.tone === 'success' ? 'text-[var(--agri-leaf)]' : 'text-[var(--error-red)]'}`}
                    >
                      {surveyFeedback.text}
                    </p>
                  )}

                  <Button type="button" onClick={() => onSubmitSurvey(survey.id)} disabled={submitSurvey.isPending}>
                    {copy.survey.button}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </main>

      <footer className="border-t border-[hsl(90_14%_88%_/_0.72)] bg-[hsl(90_26%_96%_/_0.72)] py-7">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 px-4 text-center">
          <p className="text-sm font-black text-foreground">{copy.footerTitle}</p>
          <p className="text-xs text-muted-foreground">{copy.footerDesc}</p>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
