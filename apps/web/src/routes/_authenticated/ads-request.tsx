import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { trpc } from '../../trpc.js';
import { Button } from '../../components/ui/button.js';
import { Input } from '../../components/ui/input.js';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.js';

export const Route = createFileRoute('/_authenticated/ads-request')({
  component: AdsRequestPage,
});

const AD_TYPE_LABELS: Record<string, string> = {
  BANNER: 'بنر',
  SIDEBAR: 'سایدبار',
  POPUP: 'پاپ‌آپ',
  PRODUCT_HIGHLIGHT: 'برجسته‌سازی محصول',
};

function AdsRequestPage() {
  const [form, setForm] = useState({ title: '', description: '', adType: 'BANNER', targetUrl: '' });
  const [msg, setMsg] = useState('');

  const submit = trpc.services.submitAdRequest.useMutation({
    onSuccess: (data) => {
      setMsg(data.message);
      setForm({ title: '', description: '', adType: 'BANNER', targetUrl: '' });
    },
    onError: (err) => setMsg(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit.mutate({
      title: form.title,
      description: form.description || undefined,
      adType: form.adType as 'BANNER' | 'SIDEBAR' | 'POPUP' | 'PRODUCT_HIGHLIGHT',
      targetUrl: form.targetUrl || undefined,
    });
  };

  return (
    <div className="p-6 max-w-2xl" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">درخواست تبلیغات</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            درخواست خدمات تبلیغاتی درون سایت برای معرفی محصولات و خدمات شما
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                عنوان تبلیغ <span className="text-red-500">*</span>
              </label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="مثال: معرفی محصول جدید فولاد"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نوع تبلیغ</label>
              <select
                value={form.adType}
                onChange={(e) => setForm({ ...form, adType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(AD_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">لینک مقصد</label>
              <Input
                value={form.targetUrl}
                onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
                dir="ltr"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="توضیحات تکمیلی درباره تبلیغ مورد نظر..."
              />
            </div>

            {msg && <p className="text-sm text-green-600">{msg}</p>}

            <Button type="submit" disabled={submit.isPending} className="w-full">
              {submit.isPending ? 'در حال ارسال...' : 'ثبت درخواست تبلیغ'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}