import { useCallback, useEffect, useState } from 'react';
import { useHiddenShellDrag } from './useHiddenShellDrag';

export const HIDDEN_SHELL_DRAWER_SELECTOR =
  '.gsyen-command-deck, .gsyen-module-toolbar:not(.gsyen-command-deck), .gsyen-brand-subnav';

const HEADER_SHELL_TARGET = '#app-header.gsyen-app-header';
const HEADER_SHELL_ZONE = '.gsyen-shell-double-click-zone';
const SHELL_NO_INTERACTION_TARGETS =
  'button, a, input, select, textarea, [role="button"], [data-shell-no-toggle="true"], .gsyen-brand-lockup, .gsyen-header-actions, .gsyen-account-tray, .gsyen-window-controls, .gsyen-command-tools, .gsyen-command-core, .gsyen-command-model, .gsyen-command-pulse, .gsyen-pulse-dock-slot, .gsyen-pulse-panel, .gsyen-system-bus, .gsyen-model-strip, .gsyen-model-dock, .gsyen-model-selector, .gsyen-system-panel';

const getHeaderShellZoneHeight = (header: HTMLElement) => {
  const value = getComputedStyle(header).getPropertyValue('--gsyen-header-shell-zone-height');
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 44;
};

const isNoShellTarget = (target: Element) => Boolean(target.closest(SHELL_NO_INTERACTION_TARGETS));

const isHiddenDrawerBlank = (target: EventTarget | null) =>
  target instanceof Element
  && !isNoShellTarget(target)
  && target.matches(HIDDEN_SHELL_DRAWER_SELECTOR);

const isVisibleHeaderShellBlank = (target: EventTarget | null, event: MouseEvent) => {
  if (!(target instanceof Element) || isNoShellTarget(target)) return false;
  const header = target.closest(HEADER_SHELL_TARGET) as HTMLElement | null;
  if (!header) return false;
  if (target.matches(HEADER_SHELL_ZONE)) return true;
  if (target !== header) return false;
  const rect = header.getBoundingClientRect();
  return event.clientY >= rect.bottom - getHeaderShellZoneHeight(header);
};

/** Owns the hidden-shell contract: only dblclick changes header visibility. */
export function useHeaderShellInteraction(isElectron: boolean) {
  const [headerHidden, setHeaderHidden] = useState(false);
  const { cancelDrag } = useHiddenShellDrag(isElectron && headerHidden, {
    documentSelector: HIDDEN_SHELL_DRAWER_SELECTOR,
    ignoreSelector: SHELL_NO_INTERACTION_TARGETS,
  });

  useEffect(() => {
    const handleDoubleClick = (event: MouseEvent) => {
      if (headerHidden) {
        if (!isHiddenDrawerBlank(event.target)) return;
        cancelDrag();
        setHeaderHidden(false);
        return;
      }
      if (!isVisibleHeaderShellBlank(event.target, event)) return;
      cancelDrag();
      setHeaderHidden(true);
    };
    document.addEventListener('dblclick', handleDoubleClick);
    return () => document.removeEventListener('dblclick', handleDoubleClick);
  }, [cancelDrag, headerHidden]);

  useEffect(() => {
    document.documentElement.dataset.headerHidden = headerHidden ? 'true' : 'false';
    return () => { delete document.documentElement.dataset.headerHidden; };
  }, [headerHidden]);

  const recallHeader = useCallback(() => {
    cancelDrag();
    setHeaderHidden(false);
  }, [cancelDrag]);

  return { headerHidden, recallHeader };
}
