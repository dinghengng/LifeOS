'use client';

import { Languages } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

export default function LanguageToggle() {
  const { locale, toggleLocale } = useTranslation();
  const isChinese = locale === 'zh';

  return (
    <button
      onClick={toggleLocale}
      title={isChinese ? 'Switch to English' : 'Switch to 中文'}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        borderRadius: '999px',
        border: '1px solid #e2e8f0',
        backgroundColor: isChinese ? '#1D9E75' : 'rgba(255,255,255,0.9)',
        color: isChinese ? '#ffffff' : '#334155',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.2s ease',
      }}
    >
      <Languages size={15} />
      {isChinese ? 'EN' : '中文'}
    </button>
  );
}