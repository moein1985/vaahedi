export const emailTemplates = {
  documentApproved: (userName: string) => ({
    subject: 'مدارک شما تایید شد — سامانه یکپارچه ذینفعان حوزه کشاورزی',
    html: `
      <div dir="rtl" style="font-family: Tahoma; padding: 20px;">
        <h2>مدارک شما با موفقیت تأیید شد</h2>
        <p>کاربر گرامی ${userName}،</p>
        <p>مدارک شما توسط کارشناسان بررسی و تایید شد. اکنون می توانید از امکانات سامانه استفاده کنید.</p>
        <a href="${process.env['FRONTEND_URL'] || 'https://vaahedi.com'}/dashboard" style="background:#2563eb;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;">ورود به داشبورد</a>
      </div>
    `,
  }),

  documentRejected: (userName: string, reason: string) => ({
    subject: 'مدارک شما نیازمند اصلاح است — سامانه یکپارچه ذینفعان حوزه کشاورزی',
    html: `
      <div dir="rtl" style="font-family: Tahoma; padding: 20px;">
        <h2>مدارک شما نیاز به اصلاح دارد</h2>
        <p>کاربر گرامی ${userName}،</p>
        <p>متأسفانه مدارک شما تأیید نشد. دلیل: <strong>${reason}</strong></p>
        <p>لطفاً مدارک را اصلاح و مجدداً بارگذاری کنید.</p>
        <a href="${process.env['FRONTEND_URL'] || 'https://vaahedi.com'}/profile" style="background:#dc2626;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;">ویرایش پروفایل</a>
      </div>
    `,
  }),

  tradeMatched: (userName: string) => ({
    subject: 'درخواست یا فرصت شما تطبیق یافت',
    html: `
      <div dir="rtl" style="font-family: Tahoma; padding: 20px;">
        <h2>تطبیق موفق!</h2>
        <p>کاربر گرامی ${userName}،</p>
        <p>درخواست ثبت شده شما با طرف مقابل تطبیق یافت. برای ادامه پیگیری وارد پنل شوید.</p>
        <a href="${process.env['FRONTEND_URL'] || 'https://vaahedi.com'}/trade" style="background:#16a34a;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;">مشاهده فرصت</a>
      </div>
    `,
  }),

  welcome: (userName: string) => ({
    subject: 'خوش آمدید به سامانه یکپارچه ذینفعان حوزه کشاورزی',
    html: `
      <div dir="rtl" style="font-family: Tahoma; padding: 20px;">
        <h2>خوش آمدید!</h2>
        <p>کاربر گرامی ${userName}،</p>
        <p>ثبت نام شما با موفقیت انجام شد. لطفا پروفایل تخصصی خود را تکمیل کنید تا از همه امکانات سامانه استفاده کنید.</p>
        <a href="${process.env['FRONTEND_URL'] || 'https://vaahedi.com'}/profile" style="background:#2563eb;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;">تکمیل پروفایل تخصصی</a>
      </div>
    `,
  }),
};