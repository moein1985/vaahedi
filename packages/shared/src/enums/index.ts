// ─── User & Membership ───────────────────────────────────────────────────────

export const UserRole = {
  TRADER: 'TRADER',                           // تاجر (صادرکننده/واردکننده)
  PRODUCER: 'PRODUCER',                       // تولیدکننده
  KNOWLEDGE_BASED: 'KNOWLEDGE_BASED',         // دانش‌بنیان
  WHOLESALER: 'WHOLESALER',                   // عمده‌فروش
  BROKER: 'BROKER',                           // کارگزار
  INTERMEDIARY: 'INTERMEDIARY',               // شرکت واسط
  GUILD: 'GUILD',                             // صنفی
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const MembershipType = {
  INDIVIDUAL: 'INDIVIDUAL', // حقیقی
  LEGAL: 'LEGAL',           // حقوقی
} as const;
export type MembershipType = (typeof MembershipType)[keyof typeof MembershipType];

export const UserStatus = {
  PENDING: 'PENDING',       // در انتظار تأیید مدارک
  ACTIVE: 'ACTIVE',         // فعال
  SUSPENDED: 'SUSPENDED',   // معلق
  REJECTED: 'REJECTED',     // رد شده
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

// ─── Documents ───────────────────────────────────────────────────────────────

export const DocumentType = {
  ESTABLISHMENT_NOTICE: 'ESTABLISHMENT_NOTICE',           // آگهی تأسیس
  BOARD_CHANGES: 'BOARD_CHANGES',                         // تغییرات هیئت مدیره
  OPERATION_LICENSE: 'OPERATION_LICENSE',                 // پروانه بهره‌برداری
  PRODUCTION_LICENSE: 'PRODUCTION_LICENSE',               // مجوز تأسیس تولید
  GUILD_LICENSE: 'GUILD_LICENSE',                         // مجوز صنفی معتبر
  KNOWLEDGE_BASED_LICENSE: 'KNOWLEDGE_BASED_LICENSE',     // مجوز دانش‌بنیان
  OTHER_LICENSES: 'OTHER_LICENSES',                       // سایر مجوزهای مرتبط
  ISO_CERTIFICATE: 'ISO_CERTIFICATE',                     // گواهی ایزو / استاندارد
  BUSINESS_CARD: 'BUSINESS_CARD',                         // کارت بازرگانی
} as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export const VerificationStatus = {
  PENDING: 'PENDING',             // در انتظار بررسی
  APPROVED: 'APPROVED',           // تأیید شده
  REJECTED: 'REJECTED',           // رد شده
  NEEDS_REVISION: 'NEEDS_REVISION', // نیاز به اصلاح
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

// ─── Products ────────────────────────────────────────────────────────────────

export const ProductOrigin = {
  DOMESTIC_FACTORY: 'DOMESTIC_FACTORY', // تولید کارخانه داخلی
  KNOWLEDGE_BASED: 'KNOWLEDGE_BASED',   // دانش‌بنیان
  IMPORTED: 'IMPORTED',                 // وارداتی
} as const;
export type ProductOrigin = (typeof ProductOrigin)[keyof typeof ProductOrigin];

export const DeliveryTerms = {
  EXW: 'EXW', // Ex Works
  FCA: 'FCA', // Free Carrier
  FOB: 'FOB', // Free On Board
} as const;
export type DeliveryTerms = (typeof DeliveryTerms)[keyof typeof DeliveryTerms];

export const PaymentMethod = {
  LC: 'LC',     // Letter of Credit
  SBLC: 'SBLC', // Standby Letter of Credit
  TT: 'TT',     // Telegraphic Transfer
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const CommodityGroup = {
  INDUSTRIAL: 'INDUSTRIAL',         // صنعتی
  CHEMICAL: 'CHEMICAL',             // شیمیایی
  TELECOM: 'TELECOM',               // مخابراتی
  METAL: 'METAL',                   // فلزی
  FOOD: 'FOOD',                     // غذایی
  TEXTILE: 'TEXTILE',               // نساجی
  AGRICULTURAL: 'AGRICULTURAL',     // کشاورزی
  CONSTRUCTION: 'CONSTRUCTION',     // ساختمانی
  PETROCHEMICAL: 'PETROCHEMICAL',   // پتروشیمی
  OTHER: 'OTHER',                   // سایر
} as const;
export type CommodityGroup = (typeof CommodityGroup)[keyof typeof CommodityGroup];

// ─── Trade ───────────────────────────────────────────────────────────────────

export const TradeType = {
  BUY: 'BUY',   // خرید
  SELL: 'SELL', // فروش
} as const;
export type TradeType = (typeof TradeType)[keyof typeof TradeType];

export const TradeRequestStatus = {
  PENDING: 'PENDING',                   // در انتظار
  MATCHED: 'MATCHED',                   // تطبیق یافته
  IN_NEGOTIATION: 'IN_NEGOTIATION',     // در حال مذاکره
  UNDER_REVIEW: 'UNDER_REVIEW',         // در بررسی انجمن
  COMPLETED: 'COMPLETED',               // تکمیل شده
  CANCELLED: 'CANCELLED',               // لغو شده
} as const;
export type TradeRequestStatus = (typeof TradeRequestStatus)[keyof typeof TradeRequestStatus];

// ─── Admin ───────────────────────────────────────────────────────────────────

export const AdminRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',     // ادمین کل
  MEDIA_SUPERVISOR: 'MEDIA_SUPERVISOR', // ناظر رسانه‌ای
  EXPERT: 'EXPERT',               // کارشناس (تأیید مدارک)
  ANALYST: 'ANALYST',             // تحلیلگر بازرگانی
} as const;
export type AdminRole = (typeof AdminRole)[keyof typeof AdminRole];

// ─── Chat ────────────────────────────────────────────────────────────────────

export const ChatMessageRole = {
  USER: 'USER',
  ASSISTANT: 'ASSISTANT',
  SYSTEM: 'SYSTEM',
} as const;
export type ChatMessageRole = (typeof ChatMessageRole)[keyof typeof ChatMessageRole];

export const SupportTicketStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;
export type SupportTicketStatus = (typeof SupportTicketStatus)[keyof typeof SupportTicketStatus];

// ─── Advertising ─────────────────────────────────────────────────────────────

export const AdStatus = {
  PENDING: 'PENDING',     // در انتظار تأیید
  ACTIVE: 'ACTIVE',       // فعال
  PAUSED: 'PAUSED',       // متوقف
  REJECTED: 'REJECTED',   // رد شده
  EXPIRED: 'EXPIRED',     // منقضی شده
} as const;
export type AdStatus = (typeof AdStatus)[keyof typeof AdStatus];

// ─── Analysis ────────────────────────────────────────────────────────────────

export const AnalysisRequestStatus = {
  SUBMITTED: 'SUBMITTED',       // ثبت شده
  IN_REVIEW: 'IN_REVIEW',       // در حال بررسی
  IN_PROGRESS: 'IN_PROGRESS',   // در حال انجام
  COMPLETED: 'COMPLETED',       // تکمیل شده
  CANCELLED: 'CANCELLED',       // لغو شده
} as const;
export type AnalysisRequestStatus =
  (typeof AnalysisRequestStatus)[keyof typeof AnalysisRequestStatus];
