import { useCallback, useState } from 'react';

/** 右下角短暂提示。从 ChatModule.tsx 拆出（单文件 ≤ 300 行铁律）。 */
export function useToast(durationMs = 3500) {
  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), durationMs);
  }, [durationMs]);
  return { toast, showToast };
}
