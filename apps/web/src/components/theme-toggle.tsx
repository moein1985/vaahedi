import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') setDark(true);
  }, []);

  return (
    <button
      onClick={() => setDark(!dark)}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-muted-foreground hover:bg-muted hover:text-foreground ${collapsed ? 'justify-center px-2 w-10 h-10' : 'w-full'}`}
      aria-label={dark ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'}
      title={collapsed ? (dark ? 'حالت روشن' : 'حالت تاریک') : undefined}
    >
      {dark ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
      {!collapsed && <span>{dark ? 'حالت روشن' : 'حالت تاریک'}</span>}
    </button>
  );
}
