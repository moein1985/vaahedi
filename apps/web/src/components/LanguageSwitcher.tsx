import React from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLanguage = (i18n.resolvedLanguage ?? i18n.language ?? 'fa').split('-')[0];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const languageOptions = [
    { code: 'fa', label: 'فارسی' },
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'العربية' },
  ] as const;

  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
      {languageOptions.map((option) => (
        <button
          key={option.code}
          onClick={() => changeLanguage(option.code)}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            currentLanguage === option.code
              ? 'bg-slate-900 text-white'
              : 'text-slate-700 hover:bg-slate-200'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};