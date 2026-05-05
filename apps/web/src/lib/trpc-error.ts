type TrpcLikeError = {
  message?: string;
  data?: {
    code?: string;
  };
};

function asTrpcLikeError(error: unknown): TrpcLikeError {
  if (typeof error === 'object' && error !== null) {
    return error as TrpcLikeError;
  }
  return {};
}

export function getFriendlyTrpcError(error: unknown, fallback = 'خطایی رخ داده است'): string {
  const parsed = asTrpcLikeError(error);
  const code = parsed.data?.code;
  const message = parsed.message?.trim();

  if (code === 'UNAUTHORIZED') {
    return 'برای ادامه باید وارد حساب شوید';
  }

  if (code === 'FORBIDDEN') {
    if (message) return message;
    return 'شما مجوز انجام این عملیات را ندارید';
  }

  if (code === 'TOO_MANY_REQUESTS') {
    return message || 'تعداد درخواست ها زیاد است، لطفا کمی بعد دوباره تلاش کنید';
  }

  return message || fallback;
}
