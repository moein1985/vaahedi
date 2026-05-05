/**
 * Form Labels and Messages Constants
 * Centralized to ensure consistency across all forms
 */

export const FORM_LABELS = {
  // Common
  required: 'الزامی است',
  optional: 'اختیاری',
  selectPlaceholder: 'انتخاب کنید...',

  // Profile
  profile: {
    role: 'نقش',
    companyName: 'نام شرکت',
    unitName: 'نام واحد',
    unitType: 'نوع واحد',
    guildCode: 'شناسه صنفی',
    registerNumber: 'شماره ثبت',
    taxId: 'شناسه ملی/مالیاتی',
    phone: 'تلفن تماس',
    fax: 'فکس',
    email: 'ایمیل',
    website: 'وب‌سایت',
    province: 'استان',
    city: 'شهر',
    addressLine: 'آدرس',
    address: 'آدرس کامل',
    postalCode: 'کد پستی',
    businessId: 'شناسه تجاری',
    producedGoods: 'نام کالاهای تولید شده',
    productIdNumber: 'شماره شناسایی کالای تولیدی',
    singleProduct: 'تک‌محصول',
    activityType: 'نوع فعالیت',
    commodityGroup: 'گروه کالایی',
    position: 'سمت',
    experienceYears: 'سال‌های تجربه',
    passportNumber: 'شماره پاسپورت',
    passportExpiryDate: 'تاریخ اعتبار پاسپورت',
    licenseTypes: 'نوع مجوزها',
    description: 'معرفی',
  },

  // Product
  product: {
    nameFa: 'نام فارسی محصول',
    nameEn: 'نام انگلیسی محصول',
    hsCode: 'کد HS (تعرفه گمرکی)',
    grade: 'گرید محصول',
    isicCode: 'کد ISIC',
    serviceCode: 'شناسه کالا/خدمت',
    commodityGroup: 'گروه کالایی',
    origin: 'مبدأ تولید',
    countryOfOrigin: 'کشور مبدأ',
    standardNumber: 'شماره استاندارد',
    minOrderQuantity: 'حداقل مقدار سفارش',
    preparationTimeDays: 'زمان آماده‌سازی (روز)',
    deliveryTerms: 'شرایط تحویل',
    deliveryLocation: 'محل تحویل',
    paymentMethod: 'روش پرداخت',
    packagingType: 'نوع بسته‌بندی',
    weight: 'وزن',
    weightUnit: 'واحد وزن',
    length: 'طول (cm)',
    width: 'عرض (cm)',
    height: 'ارتفاع (cm)',
    technicalSpecs: 'مشخصات فنی',
    description: 'توضیحات',
    advancePercent: 'درصد پیش‌پرداخت',
    onDeliveryPercent: 'درصد هنگام تحویل',
    productionDate: 'تاریخ تولید',
    expiryDate: 'تاریخ انقضا',
    inStock: 'موجود در انبار',
  },

  // Trade Request
  trade: {
    type: 'نوع درخواست',
    productNameFa: 'نام کالا (فارسی)',
    quantity: 'مقدار',
    quantityUnit: 'واحد مقدار',
    currency: 'ارز',
    targetPrice: 'قیمت هدف',
    deliveryLocation: 'محل تحویل',
    notes: 'یادداشت',
    serviceCode: 'کد کالا/خدمات',
    supplySourceType: 'نوع مبدا تامین',
    supplySourceName: 'نام مبدا تامین',
    subject: 'موضوع تحلیل',
    consultationCategory: 'دسته‌بندی مشاوره',
    commodityGroup: 'گروه کالایی',
    targetMarket: 'بازار هدف',
    description: 'شرح درخواست',
  },
};

export const FORM_ERRORS = {
  // Common
  required: (field: string) => `${field} ${FORM_LABELS.required}`,
  minLength: (field: string, min: number) => `${field} باید حداقل ${min} کاراکتر باشد`,
  maxLength: (field: string, max: number) => `${field} نباید بیشتر از ${max} کاراکتر باشد`,

  // Specific
  profile: {
    registerNumber: 'شماره ثبت باید صحیح باشد',
    taxId: 'شناسه مالیاتی باید صحیح باشد',
    phone: 'شماره تلفن نامعتبر است',
    email: 'آدرس ایمیل نامعتبر است',
    postalCode: 'کد پستی باید ۱۰ رقم باشد',
    website: 'آدرس وب‌سایت نامعتبر است (https:// نیاز دارد)',
  },

  product: {
    hsCode: 'کد HS باید ۸ تا ۱۰ رقم باشد',
    dateCrossField: 'تاریخ انقضا باید بعد از تاریخ تولید باشد',
    paymentPercent: 'مجموع درصدهای پرداخت باید ۱۰۰ درصد باشد',
  },

  trade: {
    serviceCode: 'کد کالا/خدمات الزامی است',
    supplySourceName: 'نام مبدا تامین الزامی است',
    quantity: 'مقدار الزامی است',
    subject: 'موضوع تحلیل الزامی است',
  },
};

export const FORM_PLACEHOLDERS = {
  profile: {
    companyName: 'نام کامل شرکت',
    unitName: 'نام واحد یا کارخانه',
    unitType: 'شرکتی / صنفی / ...',
    guildCode: 'کد صنفی',
    registerNumber: '14006523050',
    website: 'https://example.com',
    phone: '02112345678',
    fax: '02112345679',
    province: 'تهران',
    city: 'تهران',
    addressLine: 'خیابان مثال، پلاک ۱۲۳',
    postalCode: '1234567890',
    email: 'info@example.com',
    position: 'مدیرعامل',
    experienceYears: '۵',
    passportNumber: 'A12345678',
    passportExpiryDate: '2028-12-31',
    producedGoods: 'فولاد، مس، آلومینیوم',
    productIdNumber: 'PRD-10021',
    activityType: 'تولید و تامین',
    description: 'خلاصه ای از فعالیت و تخصص شرکت',
  },

  product: {
    nameFa: 'پلیمر اکریلیک',
    nameEn: 'Acrylic Polymer',
    hsCode: '3906100000',
    grade: 'A / Premium / ...',
    isicCode: '2411',
    serviceCode: 'SRV-001',
    countryOfOrigin: 'ایران / ترکیه / ...',
    standardNumber: 'ISIRI / ISO / ...',
    minOrderQuantity: '۱۰۰ کیلوگرم',
    deliveryLocation: 'بندر شهید رجایی',
    advancePercent: '۳۰',
    onDeliveryPercent: '۷۰',
  },

  trade: {
    productNameFa: 'فولاد آلیاژی',
    serviceCode: 'SRV-1209',
    quantity: '100',
    quantityUnit: 'تن',
    targetMarket: 'ترکیه، عراق، امارات',
    supplySourceName: 'نام شرکت یا کارخانه',
    subject: 'بررسی بازار فولاد ترکیه',
  },
};

export const FORM_HINTS = {
  profile: {
    registerNumber: '۱۲ رقم شماره ثبت ملی',
    taxId: '۱۰ رقم شناسه ملی یا مالیاتی',
    phone: 'مثال: 02112345678',
    fax: 'اختیاری، در صورت وجود وارد شود',
    website: 'در صورت نبود https به صورت خودکار اضافه می شود',
    producedGoods: 'نام کالاها را با کاما جدا کنید',
    passportNumber: 'فقط برای هویت‌سنجی بین‌المللی (اختیاری)',
    passportExpiryDate: 'فرمت تاریخ: YYYY-MM-DD',
    postalCode: '۱۰ رقم بدون خط تیره',
  },

  product: {
    hsCode: 'کد ۸ تا ۱۰ رقمی تعرفه گمرکی',
    isicCode: 'طبقه‌بندی بین‌المللی فعالیت اقتصادی',
    minOrderQuantity: 'عدد + واحد (مثلاً: ۱۰۰ کیلوگرم)',
    advance: 'درصد پیش‌پرداخت + درصد هنگام تحویل = ۱۰۰%',
  },

  trade: {
    quantity: 'مثال: ۱۰۰ تن',
    targetPrice: 'اختیاری',
    deliveryLocation: 'اختیاری',
  },
};
