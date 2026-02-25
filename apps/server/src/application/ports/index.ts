// ─── Application Ports (Interfaces to External Services) ─────────────────────

// --- Storage ---
export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
  size: number;
}

export interface IStorageService {
  uploadFile(params: {
    key: string;
    buffer: Buffer;
    mimeType: string;
    size: number;
    bucket?: string;
  }): Promise<UploadResult>;

  getPresignedUrl(key: string, expirySeconds?: number): Promise<string>;
  getPresignedUploadUrl(key: string, mimeType: string, expirySeconds?: number): Promise<string>;
  deleteFile(key: string): Promise<void>;
  fileExists(key: string): Promise<boolean>;
}

// --- SMS ---
export interface ISMSService {
  sendOTP(mobile: string): Promise<{ ok: boolean; expiresAt: Date }>;
  verifyOTP(mobile: string, code: string): Promise<boolean>;
}

// --- Email ---
export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface IEmailService {
  sendEmail(payload: EmailPayload): Promise<void>;
  sendOtp(mobile: string, otp: string): Promise<void>;
}

export interface IEmailQueueService {
  sendEmail(data: { to: string; subject: string; html: string; text?: string }): Promise<void>;
  sendTemplate(template: string, userEmail: string, ...args: any[]): Promise<void>;
}

// --- SMS / OTP ---
export interface ISmsService {
  sendOtp(mobile: string, otp: string, purpose: string): Promise<void>;
  sendTemplate(mobile: string, template: string, params: Record<string, string>): Promise<void>;
}

// --- Cache ---
export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  increment(key: string, ttlSeconds?: number): Promise<number>;
}

// --- AI Chat ---
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface IAIChatService {
  sendMessage(params: {
    conversationId: string;
    messages: ChatMessage[];
    userContext?: {
      role?: string;
      commodityGroup?: string;
    };
  }): AsyncGenerator<string, void, unknown>;

  isAvailable(): boolean;
}

// --- Notification ---
export interface INotificationService {
  notifyAdmin(params: { subject: string; message: string }): Promise<void>;
  notifyUser(params: { userId: string; title: string; body: string }): Promise<void>;
}
