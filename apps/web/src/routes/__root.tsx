import { createRootRouteWithContext, Outlet, Link } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import type { QueryClient } from '@tanstack/react-query';

interface RouterContext {
  queryClient: QueryClient;
}

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <div className="text-center px-4">
        <p className="text-7xl font-black text-blue-600 mb-4">۴۰۴</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">صفحه پیدا نشد</h1>
        <p className="text-gray-500 mb-8">متأسفانه صفحه‌ای که دنبالش هستید وجود ندارد یا جابجا شده.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/dashboard" className="btn-primary">
            رفتن به داشبورد
          </Link>
          <Link to="/" className="btn-secondary">
            صفحه اصلی
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  notFoundComponent: NotFoundPage,
  component: () => (
    <>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  ),
});
