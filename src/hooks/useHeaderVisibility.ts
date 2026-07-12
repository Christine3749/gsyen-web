import { useCallback, useEffect, useState } from 'react';
import {
  HIDDEN_SHELL_DRAWER_SELECTOR,
  isShellControlTarget,
} from './headerShellContract';

const HEADER_SHELL_TARGET = '#app-header.gsyen-app-header';

const getHeaderShellZoneHeight = (header: HTMLElement) => {
  const value = getComputedStyle(header).getPropertyValue('--gsyen-header-shell-zone-height');
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 44;
};

const isHiddenDrawerBlank = (target: EventTarget | null) =>
  target instanceof Element
  && !isShellControlTarget(target)
  && target.matches(HIDDEN_SHELL_DRAWER_SELECTOR);

const isVisibleHeaderShellBlank = (target: EventTarget | null, event: MouseEvent) => {
  if (!(target instanceof Element) || isShellControlTarget(target)) return false;
  if (target.matches(HIDDEN_SHELL_DRAWER_SELECTOR)) return true;
  const header = target.closest(HEADER_SHELL_TARGET) as HTMLElement | null;
  if (!header) return false;
  const rect = header.getBoundingClientRect();
  return event.clientY >= rect.bottom - getHeaderShellZoneHeight(header);
};

/** Header visibility is deliberately independent from Electron window dragging. */
export function useHeaderVisibility() {
  const [headerHidden, setHeaderHidden] = useState(false);

  useEffect(() => {
    const handleDoubleClick = (event: MouseEvent) => {
      if (headerHidden) {
        if (isHiddenDrawerBlank(event.target)) setHeaderHidden(false);
        return;
      }
      if (isVisibleHeaderShellBlank(event.target, event)) setHeaderHidden(true);
    };
    document.addEventListener('dblclick', handleDoubleClick);
    return () => document.removeEventListener('dblclick', handleDoubleClick);
  }, [headerHidden]);

  useEffect(() => {
    document.documentElement.dataset.headerHidden = headerHidden ? 'true' : 'false';
    return () => { delete document.documentElement.dataset.headerHidden; };
  }, [headerHidden]);

  const recallHeader = useCallback(() => setHeaderHidden(false), []);
  return { headerHidden, recallHeader };
}
