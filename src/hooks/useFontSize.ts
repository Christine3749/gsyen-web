import { useState, useEffect } from 'react';

export type FontSize = 'ji' | 'compact' | 'normal' | 'large';
const KEY = 'gsyen_font_size';

function getDefaultSize(): FontSize {
  const saved = localStorage.getItem(KEY) as FontSize | null;
  if (saved) return saved;
  // 首次访问：大屏（≥2048px 宽）或小屏（≤800px 高，如13寸768p）均默认紧凑
  // 大屏：compact 提升信息密度；小屏：compact 放大有效内容高度（768/0.85=904px）
  if (window.screen.width >= 2048 || window.screen.height <= 800) return 'compact';
  return 'normal';
}

export function useFontSize() {
  const [size, setSize] = useState<FontSize>(getDefaultSize);

  useEffect(() => {
    const el = document.documentElement;
    if (size === 'normal') {
      el.removeAttribute('data-font');
    } else {
      el.setAttribute('data-font', size);
    }
    localStorage.setItem(KEY, size);
  }, [size]);

  return { size, setSize };
}
