export const emailTemplates = {
  documentApproved: (userName: string) => ({
    subject: 'مدارک شما تأیید شد — پلتفرم تجارت هوشمند',
    html: `
      <div dir="rtl" style="font-family: Tahoma; padding: 20px;">
        <h2>مدارک شما با موفقیت تأیید شد</h2>
        <p>کاربر گرامی ${userName}،</p>
        <p>مدارک شما توسط کارشناسان ما بررسی و تأیید شد. اکنون می‌توانید از تمام امکانات پلتفرم استفاده کنید.</p>
        <a href="${process.env['FRONTEND_URL'] || 'https://vaahedi.com'}/dashboard" style="background:#2563eb;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;">ورود به داشبورد</a>
      </div>
    `,
  }),

  documentRejected: (userName: string, reason: string) => ({
    subject: 'مدارک شما رد شد — پلتفرم تجارت هوشمند',
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
    subject: 'درخواست تجاری شما تطبیق یافت!',
    html: `
      <div dir="rtl" style="font-family: Tahoma; padding: 20px;">
        <h2>تطبیق موفق!</h2>
        <p>کاربر گرامی ${userName}،</p>
        <p>درخواست تجاری شما با طرف مقابل تطبیق یافت. برای ادامه مذاکره وارد پنل شوید.</p>
        <a href="${process.env['FRONTEND_URL'] || 'https://vaahedi.com'}/trade" style="background:#16a34a;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;">مشاهده درخواست</a>
      </div>
    `,
  }),

  welcome: (userName: string) => ({
    subject: 'خوش آمدید به پلتفرم تجارت هوشمند',
    html: `
      <div dir="rtl" style="font-family: Tahoma; padding: 20px;">
        <h2>خوش آمدید!</h2>
        <p>کاربر گرامی ${userName}،</p>
        <p>ثبت‌نام شما با موفقیت انجام شد. لطفاً پروفایل خود را تکمیل کنید تا از تمام امکانات استفاده کنید.</p>
        <a href="${process.env['FRONTEND_URL'] || 'https://vaahedi.com'}/profile" style="background:#2563eb;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;">تکمیل پروفایل</a>
      </div>
    `,
  }),
};