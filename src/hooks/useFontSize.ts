import { useState, useEffect } from 'react';

export type FontSize = 'normal' | 'compact';
const KEY = 'gsyen_font_size';

export function useFontSize() {
  const [size, setSize] = useState<FontSize>(
    () => (localStorage.getItem(KEY) as FontSize | null) ?? 'normal'
  );

  useEffect(() => {
    if (size === 'compact') {
      document.documentElement.setAttribute('data-font', 'compact');
    } else {
      document.documentElement.removeAttribute('data-font');
    }
    localStorage.setItem(KEY, size);
  }, [size]);

  return { size, setSize };
}
