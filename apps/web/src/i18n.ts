import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  fa: {
    translation: {
      // Common
      'app.name': 'وهدی',
      'app.description': 'سامانه ذینفعان حوزه کشاورزی — صادرات و واردات محصولات کشاورزی',
      'loading': 'در حال بارگذاری...',
      'error': 'خطا',
      'success': 'موفقیت',
      'cancel': 'لغو',
      'confirm': 'تأیید',
      'save': 'ذخیره',
      'edit': 'ویرایش',
      'delete': 'حذف',
      'search': 'جستجو',
      'filter': 'فیلتر',
      'sort': 'مرتب‌سازی',
      'next': 'بعدی',
      'previous': 'قبلی',
      'page': 'صفحه',
      'of': 'از',

      // Auth
      'auth.login': 'ورود به حساب',
      'auth.register': 'ثبت‌نام',
      'auth.logout': 'خروج',
      'auth.userCode': 'کد کاربری',
      'auth.password': 'رمز عبور',
      'auth.mobile': 'شماره همراه',
      'auth.otp': 'کد تأیید',
      'auth.sendOtp': 'ارسال کد',
      'auth.loginWithPassword': 'ورود با رمز عبور',
      'auth.loginWithOtp': 'ورود با کد پیامکی',
      'auth.forgotPassword': 'فراموشی رمز عبور',
      'auth.noAccount': 'حساب ندارید؟',

      // Navigation
      'nav.dashboard': 'داشبورد',
      'nav.products': 'محصولات',
      'nav.trade': 'خرید و فروش',
      'nav.support': 'پشتیبانی',
      'nav.chat': 'گفتگو',
      'nav.notifications': 'اعلان‌ها',
      'nav.profile': 'پروفایل',
      'nav.services': 'خدمات',
      'nav.admin': 'مدیریت',
      'nav.harvestCalendar': 'تقویم برداشت',
      'nav.marketInsights': 'بینش بازار',

      // Dashboard
      'dashboard.welcome': 'خوش آمدید',
      'dashboard.stats': 'آمار کلی',
      'dashboard.recentActivity': 'فعالیت‌های اخیر',

      // Products
      'products.title': 'محصولات',
      'products.add': 'افزودن محصول',
      'products.edit': 'ویرایش محصول',
      'products.delete': 'حذف محصول',
      'products.name': 'نام محصول',
      'products.description': 'توضیحات',
      'products.price': 'قیمت',
      'products.category': 'دسته‌بندی',

      // Trade
      'trade.title': 'درخواست‌های تجاری',
      'trade.buy': 'خرید',
      'trade.sell': 'فروش',
      'trade.newRequest': 'درخواست جدید',

      // Notifications
      'notifications.title': 'اعلان‌ها',
      'notifications.markAsRead': 'علامت به عنوان خوانده شده',
      'notifications.markAllAsRead': 'علامت‌گذاری همه به عنوان خوانده شده',
      'notifications.empty': 'اعلانی وجود ندارد',

      // Admin
      'admin.title': 'پنل مدیریت',
      'admin.users': 'مدیریت کاربران',
      'admin.products': 'تایید محصولات',
      'admin.documents': 'تایید مدارک',

      // Status
      'status.active': 'فعال',
      'status.pending': 'در انتظار',
      'status.suspended': 'تعلیق',
      'status.rejected': 'رد شده',
      'status.approved': 'تایید شده',

      // Messages
      'message.confirmDelete': 'آیا از حذف این مورد اطمینان دارید؟',
      'message.operationSuccess': 'عملیات با موفقیت انجام شد',
      'message.operationFailed': 'عملیات با خطا مواجه شد',

      // Roles
      'role.TRADER': 'تاجر',
      'role.PRODUCER': 'تولیدکننده',
      'role.KNOWLEDGE_BASED': 'دانش‌بنیان',
      'role.WHOLESALER': 'عمده‌فروش',
      'role.BROKER': 'کارگزار',
      'role.INTERMEDIARY': 'شرکت واسط',
      'role.GUILD': 'صنفی',
      'role.FARMER': 'کشاورز (تولیدکننده)',
      'role.INVESTOR': 'سرمایه‌گذار',

      // Document Types
      'doc.ESTABLISHMENT_NOTICE': 'آگهی تأسیس شرکت',
      'doc.BOARD_CHANGES': 'تغییرات هیئت مدیره',
      'doc.OPERATION_LICENSE': 'پروانه بهره‌برداری',
      'doc.PRODUCTION_LICENSE': 'مجوز تأسیس تولید صنعتی',
      'doc.GUILD_LICENSE': 'مجوز صنفی معتبر',
      'doc.KNOWLEDGE_BASED_LICENSE': 'مجوز دانش‌بنیان',
      'doc.OTHER_LICENSES': 'سایر مجوزهای مرتبط',
      'doc.ISO_CERTIFICATE': 'گواهی ایزو / استاندارد',
      'doc.BUSINESS_CARD': 'کارت بازرگانی',
      'doc.ID_DOCUMENT': 'تصویر مدرک هویتی (کارت ملی/پاسپورت)',
      'doc.AGRICULTURAL_LICENSE': 'مجوز کشاورزی (جهاد کشاورزی)',
      'doc.FARMING_CERTIFICATE': 'گواهینامه کشاورز',
      'doc.WATER_RIGHTS_DOCUMENT': 'سند حق آب و زمین',
      'doc.EXPORT_CERTIFICATE': 'گواهی صادراتی (بهداشت / قرنطینه)',

      // Consultation Categories
      'consultation.COMMERCIAL': 'بازرگانی',
      'consultation.TECHNICAL': 'فنی',
      'consultation.LEGAL': 'حقوقی',
      'consultation.FINANCIAL': 'مالی',

      // News
      'news.title': 'اخبار بازرگانی',
      'news.latest': 'آخرین اخبار',
      'news.readMore': 'ادامه مطلب',
      'newsletter.subscribe': 'عضویت در خبرنامه',
      'newsletter.email': 'آدرس ایمیل',
      'newsletter.subscribed': 'عضویت شما ثبت شد',

      // Membership Type
      'membership.INDIVIDUAL': 'حقیقی',
      'membership.LEGAL': 'حقوقی',
      'membership.GUILD_MEMBER': 'صنفی',
    },
  },
  en: {
    translation: {
      // Common
      'app.name': 'Agriculture Stakeholders Platform',
      'app.description': 'Agriculture Stakeholders Network — Import & Export of Agricultural Products',
      'loading': 'Loading...',
      'error': 'Error',
      'success': 'Success',
      'cancel': 'Cancel',
      'confirm': 'Confirm',
      'save': 'Save',
      'edit': 'Edit',
      'delete': 'Delete',
      'search': 'Search',
      'filter': 'Filter',
      'sort': 'Sort',
      'next': 'Next',
      'previous': 'Previous',
      'page': 'Page',
      'of': 'of',

      // Auth
      'auth.login': 'Login',
      'auth.register': 'Register',
      'auth.logout': 'Logout',
      'auth.userCode': 'User Code',
      'auth.password': 'Password',
      'auth.mobile': 'Mobile Number',
      'auth.otp': 'OTP Code',
      'auth.sendOtp': 'Send Code',
      'auth.loginWithPassword': 'Login with Password',
      'auth.loginWithOtp': 'Login with SMS',
      'auth.forgotPassword': 'Forgot Password',
      'auth.noAccount': 'Don\'t have an account?',

      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.products': 'Products',
      'nav.trade': 'Trade',
      'nav.support': 'Support',
      'nav.chat': 'Chat',
      'nav.notifications': 'Notifications',
      'nav.profile': 'Profile',
      'nav.services': 'Services',
      'nav.admin': 'Admin',

      // Dashboard
      'dashboard.welcome': 'Welcome',
      'dashboard.stats': 'Statistics',
      'dashboard.recentActivity': 'Recent Activity',

      // Products
      'products.title': 'Products',
      'products.add': 'Add Product',
      'products.edit': 'Edit Product',
      'products.delete': 'Delete Product',
      'products.name': 'Product Name',
      'products.description': 'Description',
      'products.price': 'Price',
      'products.category': 'Category',

      // Trade
      'trade.title': 'Trade Requests',
      'trade.buy': 'Buy',
      'trade.sell': 'Sell',
      'trade.newRequest': 'New Request',

      // Notifications
      'notifications.title': 'Notifications',
      'notifications.markAsRead': 'Mark as Read',
      'notifications.markAllAsRead': 'Mark All as Read',
      'notifications.empty': 'No notifications',

      // Admin
      'admin.title': 'Admin Panel',
      'admin.users': 'User Management',
      'admin.products': 'Product Approval',
      'admin.documents': 'Document Approval',

      // Status
      'status.active': 'Active',
      'status.pending': 'Pending',
      'status.suspended': 'Suspended',
      'status.rejected': 'Rejected',
      'status.approved': 'Approved',

      // Messages
      'message.confirmDelete': 'Are you sure you want to delete this item?',
      'message.operationSuccess': 'Operation completed successfully',
      'message.operationFailed': 'Operation failed',

      // Roles
      'role.TRADER': 'Trader',
      'role.PRODUCER': 'Producer',
      'role.KNOWLEDGE_BASED': 'Knowledge-Based',
      'role.WHOLESALER': 'Wholesaler',
      'role.BROKER': 'Broker',
      'role.INTERMEDIARY': 'Intermediary',
      'role.GUILD': 'Guild',
      'role.FARMER': 'Farmer (Producer)',
      'role.INVESTOR': 'Investor',

      // Document Types
      'doc.ESTABLISHMENT_NOTICE': 'Establishment Notice',
      'doc.BOARD_CHANGES': 'Board Changes',
      'doc.OPERATION_LICENSE': 'Operation License',
      'doc.PRODUCTION_LICENSE': 'Production License',
      'doc.GUILD_LICENSE': 'Guild License',
      'doc.KNOWLEDGE_BASED_LICENSE': 'Knowledge-Based License',
      'doc.OTHER_LICENSES': 'Other Licenses',
      'doc.ISO_CERTIFICATE': 'ISO Certificate',
      'doc.BUSINESS_CARD': 'Business Card',
      'doc.ID_DOCUMENT': 'Identity/Passport Document',
      'doc.AGRICULTURAL_LICENSE': 'Agricultural License (Jihad-e-Agriculture)',
      'doc.FARMING_CERTIFICATE': 'Farming Certificate',
      'doc.WATER_RIGHTS_DOCUMENT': 'Water Rights & Land Document',
      'doc.EXPORT_CERTIFICATE': 'Export Certificate (Health / Quarantine)',

      // Consultation Categories
      'consultation.COMMERCIAL': 'Commercial',
      'consultation.TECHNICAL': 'Technical',
      'consultation.LEGAL': 'Legal',
      'consultation.FINANCIAL': 'Financial',

      // News
      'news.title': 'Trade News',
      'news.latest': 'Latest News',
      'news.readMore': 'Read More',
      'newsletter.subscribe': 'Subscribe to Newsletter',
      'newsletter.email': 'Email Address',
      'newsletter.subscribed': 'Subscription confirmed',

      // Membership Type
      'membership.INDIVIDUAL': 'Individual',
      'membership.LEGAL': 'Legal Entity',
      'membership.GUILD_MEMBER': 'Guild Member',
    },
  },
  ar: {
    translation: {
      // Common
      'app.name': 'واحدي',
      'app.description': 'منصة التجارة الذكية المركزية',
      'loading': 'جار التحميل...',
      'error': 'خطأ',
      'success': 'نجاح',
      'cancel': 'إلغاء',
      'confirm': 'تأكيد',
      'save': 'حفظ',
      'edit': 'تعديل',
      'delete': 'حذف',
      'search': 'بحث',
      'filter': 'تصفية',
      'sort': 'ترتيب',
      'next': 'التالي',
      'previous': 'السابق',
      'page': 'صفحة',
      'of': 'من',

      // Auth
      'auth.login': 'تسجيل الدخول',
      'auth.register': 'إنشاء حساب',
      'auth.logout': 'تسجيل الخروج',
      'auth.userCode': 'رمز المستخدم',
      'auth.password': 'كلمة المرور',
      'auth.mobile': 'رقم الجوال',
      'auth.otp': 'رمز التحقق',
      'auth.sendOtp': 'إرسال الرمز',
      'auth.loginWithPassword': 'الدخول بكلمة المرور',
      'auth.loginWithOtp': 'الدخول عبر الرسائل',
      'auth.forgotPassword': 'نسيت كلمة المرور؟',
      'auth.noAccount': 'لا تملك حسابًا؟',

      // Navigation
      'nav.dashboard': 'لوحة التحكم',
      'nav.products': 'المنتجات',
      'nav.trade': 'التجارة',
      'nav.support': 'الدعم',
      'nav.chat': 'الدردشة',
      'nav.notifications': 'الإشعارات',
      'nav.profile': 'الملف الشخصي',
      'nav.services': 'الخدمات',
      'nav.admin': 'الإدارة',

      // Dashboard
      'dashboard.welcome': 'مرحبًا',
      'dashboard.stats': 'الإحصائيات',
      'dashboard.recentActivity': 'النشاط الأخير',

      // Products
      'products.title': 'المنتجات',
      'products.add': 'إضافة منتج',
      'products.edit': 'تعديل المنتج',
      'products.delete': 'حذف المنتج',
      'products.name': 'اسم المنتج',
      'products.description': 'الوصف',
      'products.price': 'السعر',
      'products.category': 'الفئة',

      // Trade
      'trade.title': 'طلبات التجارة',
      'trade.buy': 'شراء',
      'trade.sell': 'بيع',
      'trade.newRequest': 'طلب جديد',

      // Notifications
      'notifications.title': 'الإشعارات',
      'notifications.markAsRead': 'تعيين كمقروء',
      'notifications.markAllAsRead': 'تعيين الكل كمقروء',
      'notifications.empty': 'لا توجد إشعارات',

      // Admin
      'admin.title': 'لوحة الإدارة',
      'admin.users': 'إدارة المستخدمين',
      'admin.products': 'اعتماد المنتجات',
      'admin.documents': 'اعتماد المستندات',

      // Status
      'status.active': 'نشط',
      'status.pending': 'قيد الانتظار',
      'status.suspended': 'موقوف',
      'status.rejected': 'مرفوض',
      'status.approved': 'مقبول',

      // Messages
      'message.confirmDelete': 'هل أنت متأكد من حذف هذا العنصر؟',
      'message.operationSuccess': 'تمت العملية بنجاح',
      'message.operationFailed': 'فشلت العملية',

      // Roles
      'role.TRADER': 'تاجر',
      'role.PRODUCER': 'منتج',
      'role.KNOWLEDGE_BASED': 'شركة معرفية',
      'role.WHOLESALER': 'تاجر جملة',
      'role.BROKER': 'وسيط',
      'role.INTERMEDIARY': 'شركة وسيطة',
      'role.GUILD': 'نقابة',
      'role.FARMER': 'مزارع (منتج)',
      'role.INVESTOR': 'مستثمر',

      // Document Types
      'doc.ESTABLISHMENT_NOTICE': 'إشعار التأسيس',
      'doc.BOARD_CHANGES': 'تغييرات مجلس الإدارة',
      'doc.OPERATION_LICENSE': 'رخصة التشغيل',
      'doc.PRODUCTION_LICENSE': 'رخصة الإنتاج',
      'doc.GUILD_LICENSE': 'رخصة النقابة',
      'doc.KNOWLEDGE_BASED_LICENSE': 'رخصة الشركة المعرفية',
      'doc.OTHER_LICENSES': 'تراخيص أخرى',
      'doc.ISO_CERTIFICATE': 'شهادة ISO',
      'doc.BUSINESS_CARD': 'بطاقة الأعمال',
      'doc.ID_DOCUMENT': 'وثيقة الهوية/جواز السفر',
      'doc.AGRICULTURAL_LICENSE': 'رخصة الزراعة (جهاد الزراعة)',
      'doc.FARMING_CERTIFICATE': 'شهادة المزارع',
      'doc.WATER_RIGHTS_DOCUMENT': 'وثيقة حقوق المياه والأرض',
      'doc.EXPORT_CERTIFICATE': 'شهادة التصدير (الصحة / الحجر الصحي)',

      // Consultation Categories
      'consultation.COMMERCIAL': 'تجاري',
      'consultation.TECHNICAL': 'تقني',
      'consultation.LEGAL': 'قانوني',
      'consultation.FINANCIAL': 'مالي',

      // News
      'news.title': 'أخبار التجارة',
      'news.latest': 'آخر الأخبار',
      'news.readMore': 'اقرأ المزيد',
      'newsletter.subscribe': 'الاشتراك في النشرة البريدية',
      'newsletter.email': 'البريد الإلكتروني',
      'newsletter.subscribed': 'تم تأكيد الاشتراك',

      // Membership Type
      'membership.INDIVIDUAL': 'فرد',
      'membership.LEGAL': 'كيان قانوني',
      'membership.GUILD_MEMBER': 'عضو نقابي',
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fa',
    supportedLngs: ['fa', 'en', 'ar'],
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;