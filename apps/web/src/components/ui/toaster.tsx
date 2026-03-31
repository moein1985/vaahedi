import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      dir="rtl"
      toastOptions={{
        className: 'font-[Vazirmatn]',
        style: { fontFamily: 'Vazirmatn, system-ui, sans-serif' },
      }}
      richColors
      closeButton
    />
  );
}
