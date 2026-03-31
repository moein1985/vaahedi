import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '../components/ui/button.js';
import { Input } from '../components/ui/input.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.js';
import { trpc } from '../trpc.js';

export const Route = createFileRoute('/contact')({
  component: ContactPage,
});

function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [msg, setMsg] = useState('');
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, Record<string, unknown>>>({});
  const [surveyMsg, setSurveyMsg] = useState<Record<string, string>>({});

  const { data: surveys } = trpc.services.activeSurveys.useQuery();

  const submit = trpc.services.submitContactMessage.useMutation({
    onSuccess: (data) => {
      setMsg(data.message);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    },
    onError: (err) => setMsg(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
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
      setSurveyMsg((prev) => ({ ...prev, [variables.surveyId]: 'پاسخ شما ثبت شد. ممنون از مشارکت شما' }));
      setSurveyAnswers((prev) => ({ ...prev, [variables.surveyId]: {} }));
    },
    onError: (error, variables) => {
      setSurveyMsg((prev) => ({ ...prev, [variables.surveyId]: error.message }));
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
      answers: (surveyAnswers[surveyId] ?? {}) as Record<string, any>,
    });
  };

  return (
    <div dir="rtl" className="min-h-screen bg-muted/50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[var(--brand)] text-white flex items-center justify-center font-black text-sm">ت</div>
            <span className="font-black text-foreground">تجارت هوشمند</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild><Link to="/about">درباره ما</Link></Button>
            <Button variant="ghost" asChild><Link to="/auth/login">ورود</Link></Button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">ارتباط با ما</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">پیام، پیشنهاد یا انتقاد خود را برای ما ارسال کنید</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نام <span className="text-red-500">*</span></label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ایمیل <span className="text-red-500">*</span></label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} dir="ltr" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تلفن همراه</label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" placeholder="09xxxxxxxxx" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">موضوع <span className="text-red-500">*</span></label>
                  <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">پیام <span className="text-red-500">*</span></label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={5}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="پیام خود را بنویسید..."
                />
              </div>
              {msg && <p className="text-sm text-green-600">{msg}</p>}
              <Button type="submit" disabled={submit.isPending} className="w-full">
                {submit.isPending ? 'در حال ارسال...' : 'ارسال پیام'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {surveys && surveys.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-bold text-foreground">نظرسنجی</h2>
            {surveys.map((survey: any) => {
              const questions = Array.isArray(survey.questions) ? survey.questions : [];
              return (
                <Card key={survey.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{survey.title}</CardTitle>
                    {survey.description && (
                      <p className="text-sm text-muted-foreground">{survey.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {questions.map((q: any, idx: number) => {
                      const qId = String(q.id ?? `q_${idx + 1}`);
                      const answer = surveyAnswers[survey.id]?.[qId] ?? '';
                      const qType = q.type ?? 'text';
                      const qText = q.text ?? `سوال ${idx + 1}`;

                      return (
                        <div key={qId} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {qText}
                            {q.required ? <span className="text-red-500"> *</span> : null}
                          </label>

                          {qType === 'rating' ? (
                            <select
                              value={String(answer)}
                              onChange={(e) => setAnswer(survey.id, qId, e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                            >
                              <option value="">انتخاب امتیاز</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5</option>
                            </select>
                          ) : qType === 'single_choice' && Array.isArray(q.options) ? (
                            <div className="space-y-2">
                              {q.options.map((opt: string) => (
                                <label key={opt} className="flex items-center gap-2 text-sm">
                                  <input
                                    type="radio"
                                    name={`${survey.id}-${qId}`}
                                    checked={answer === opt}
                                    onChange={() => setAnswer(survey.id, qId, opt)}
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
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-none"
                              placeholder="پاسخ خود را بنویسید..."
                            />
                          )}
                        </div>
                      );
                    })}

                    {surveyMsg[survey.id] && (
                      <p className="text-sm text-green-600">{surveyMsg[survey.id]}</p>
                    )}

                    <Button
                      type="button"
                      onClick={() => onSubmitSurvey(survey.id)}
                      disabled={submitSurvey.isPending}
                    >
                      ثبت پاسخ نظرسنجی
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}