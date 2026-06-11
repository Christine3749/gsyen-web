import { useState, useEffect } from 'react';

export function useModelHealth(intervalMs = 30_000): boolean {
  const [alive, setAlive] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch('/api/health');
        const d = await r.json();
        setAlive(d.ollamaAlive === true);
      } catch {
        setAlive(false);
      }
    };
    check();
    const t = setInterval(check, intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);

  return alive;
}
