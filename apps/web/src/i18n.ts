import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  fa: {
    translation: {
      // Common
      'app.name': 'وهدی',
      'app.description': 'مرکز تجارت متمرکز هوشمند ایرانیان',
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
    },
  },
  en: {
    translation: {
      // Common
      'app.name': 'Vaahedi',
      'app.description': 'Iranian Smart Centralized Trade Center',
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
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fa',
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