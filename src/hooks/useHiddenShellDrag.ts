import { useCallback, useEffect, useRef } from 'react';

type HiddenShellDrag = {
  pointerId: number;
  screenX: number;
  screenY: number;
  windowX: number;
  windowY: number;
  captureElement?: Element;
};

type PendingShellDrag = {
  pointerId: number;
  startScreenX: number;
  startScreenY: number;
  latestScreenX: number;
  latestScreenY: number;
  captureElement?: Element;
  starting: boolean;
};

type ShellWindowApi = {
  getPosition?: () => Promise<[number, number]>;
  setPosition?: (x: number, y: number) => void;
};

type HiddenShellDragOptions = {
  documentSelector?: string;
  ignoreSelector?: string;
};

const getShellWindowApi = (): ShellWindowApi | undefined =>
  (window as any).electronAPI?.window;

const DRAG_START_THRESHOLD = 8;

const capturePointer = (element: Element | undefined, pointerId: number) => {
  try {
    element?.setPointerCapture(pointerId);
  } catch {
    // Capture is best-effort; document-level move listeners still handle the drag.
  }
};

const releasePointer = (element: Element | undefined, pointerId: number) => {
  try {
    if (element?.hasPointerCapture(pointerId)) {
      element.releasePointerCapture(pointerId);
    }
  } catch {
    // The pointer may already be released by the browser.
  }
};

export function useHiddenShellDrag(enabled: boolean, options: HiddenShellDragOptions = {}) {
  const dragRef = useRef<HiddenShellDrag | null>(null);
  const pendingRef = useRef<PendingShellDrag | null>(null);
  const { documentSelector, ignoreSelector } = options;

  const clearDrag = useCallback(() => {
    const drag = dragRef.current;
    if (drag) {
      releasePointer(drag.captureElement, drag.pointerId);
    }
    const pending = pendingRef.current;
    if (pending) {
      releasePointer(pending.captureElement, pending.pointerId);
    }
    dragRef.current = null;
    pendingRef.current = null;
  }, []);

  const startDrag = useCallback(async (
    pointerId: number,
  ) => {
    if (!enabled) return;
    const pending = pendingRef.current;
    if (!pending || pending.pointerId !== pointerId || pending.starting) return;
    const api = getShellWindowApi();
    if (!api?.getPosition || !api?.setPosition) return;
    pending.starting = true;
    capturePointer(pending.captureElement, pointerId);
    const [windowX, windowY] = await api.getPosition();
    if (pendingRef.current !== pending) return;
    dragRef.current = {
      pointerId,
      screenX: pending.startScreenX,
      screenY: pending.startScreenY,
      windowX,
      windowY,
      captureElement: pending.captureElement,
    };
    api.setPosition(
      Math.round(windowX + pending.latestScreenX - pending.startScreenX),
      Math.round(windowY + pending.latestScreenY - pending.startScreenY),
    );
  }, [enabled]);

  const moveDrag = useCallback((pointerId: number, screenX: number, screenY: number) => {
    const drag = dragRef.current;
    if (drag?.pointerId === pointerId) {
      const api = getShellWindowApi();
      if (!api?.setPosition) return;
      api.setPosition(
        Math.round(drag.windowX + screenX - drag.screenX),
        Math.round(drag.windowY + screenY - drag.screenY),
      );
      return;
    }

    const pending = pendingRef.current;
    if (!pending || pending.pointerId !== pointerId) return;
    pending.latestScreenX = screenX;
    pending.latestScreenY = screenY;
    if (Math.hypot(screenX - pending.startScreenX, screenY - pending.startScreenY) < DRAG_START_THRESHOLD) return;
    void startDrag(pointerId);
  }, [startDrag]);

  const stopDragByPointer = useCallback((pointerId: number) => {
    if (pendingRef.current?.pointerId === pointerId) {
      releasePointer(pendingRef.current.captureElement, pointerId);
      pendingRef.current = null;
    }
    if (dragRef.current?.pointerId === pointerId) {
      releasePointer(dragRef.current.captureElement, pointerId);
      dragRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) clearDrag();
  }, [clearDrag, enabled]);

  useEffect(() => {
    if (!enabled || !documentSelector) return;

    const isDraggableShellTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      if (ignoreSelector && target.closest(ignoreSelector)) return false;
      return Boolean(target.closest(documentSelector));
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !isDraggableShellTarget(event.target)) return;
      if (event.detail > 1) return;
      pendingRef.current = {
        pointerId: event.pointerId,
        startScreenX: event.screenX,
        startScreenY: event.screenY,
        latestScreenX: event.screenX,
        latestScreenY: event.screenY,
        captureElement: event.target as Element,
        starting: false,
      };
    };
    const handlePointerMove = (event: PointerEvent) => {
      moveDrag(event.pointerId, event.screenX, event.screenY);
    };
    const handlePointerUp = (event: PointerEvent) => {
      stopDragByPointer(event.pointerId);
    };
    const handleBlur = () => clearDrag();
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') clearDrag();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('pointerup', handlePointerUp, true);
    document.addEventListener('pointercancel', handlePointerUp, true);
    document.addEventListener('lostpointercapture', handlePointerUp, true);
    window.addEventListener('pointermove', handlePointerMove, true);
    window.addEventListener('pointerup', handlePointerUp, true);
    window.addEventListener('pointercancel', handlePointerUp, true);
    window.addEventListener('blur', handleBlur, true);
    document.addEventListener('visibilitychange', handleVisibility, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('pointerup', handlePointerUp, true);
      document.removeEventListener('pointercancel', handlePointerUp, true);
      document.removeEventListener('lostpointercapture', handlePointerUp, true);
      window.removeEventListener('pointermove', handlePointerMove, true);
      window.removeEventListener('pointerup', handlePointerUp, true);
      window.removeEventListener('pointercancel', handlePointerUp, true);
      window.removeEventListener('blur', handleBlur, true);
      document.removeEventListener('visibilitychange', handleVisibility, true);
      clearDrag();
    };
  }, [clearDrag, documentSelector, enabled, ignoreSelector, moveDrag, stopDragByPointer]);

  return {
    cancelDrag: clearDrag,
  };
}
