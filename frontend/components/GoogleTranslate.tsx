'use client';

import { useEffect, useState } from 'react';
import { Languages } from 'lucide-react';

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: {
      translate: {
        TranslateElement: new (config: object, elementId: string) => void;
      };
    };
  }
}

export default function GoogleTranslate() {
  const [isChinese, setIsChinese] = useState(false);

  useEffect(() => {
    if (document.getElementById('google-translate-script')) return;

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: 'zh-CN',
          autoDisplay: false,
        },
        'google-translate-element'
      );
    };

    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src =
      '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const toggleLanguage = () => {
    const select = document.querySelector<HTMLSelectElement>(
      '#google-translate-element select'
    );
    if (!select) return;

    if (isChinese) {
      // Switch back to English by selecting the blank/default option
      select.value = '';
      select.dispatchEvent(new Event('change'));
      setIsChinese(false);
    } else {
      // Switch to Simplified Chinese
      select.value = 'zh-CN';
      select.dispatchEvent(new Event('change'));
      setIsChinese(true);
    }
  };

  return (
    <>
      {/* Hidden Google Translate widget — needed for the select element to exist in DOM */}
      <div id="google-translate-element" style={{ display: 'none' }} />

      {/* Styled toggle button — fixed bottom-right so it's always accessible */}
      <button
        onClick={toggleLanguage}
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
    </>
  );
}