import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';

type HiddenShellDrag = {
  pointerId: number;
  screenX: number;
  screenY: number;
  windowX: number;
  windowY: number;
  captureElement?: Element;
  started: boolean;
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

const DRAG_START_THRESHOLD = 4;

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
  const pendingPointerRef = useRef<number | null>(null);
  const pendingCaptureRef = useRef<Element | undefined>(undefined);
  const { documentSelector, ignoreSelector } = options;

  const clearDrag = useCallback(() => {
    const drag = dragRef.current;
    if (drag) {
      releasePointer(drag.captureElement, drag.pointerId);
    }
    if (pendingPointerRef.current !== null) {
      releasePointer(pendingCaptureRef.current, pendingPointerRef.current);
    }
    dragRef.current = null;
    pendingPointerRef.current = null;
    pendingCaptureRef.current = undefined;
  }, []);

  const beginDrag = useCallback(async (
    pointerId: number,
    screenX: number,
    screenY: number,
    captureElement?: Element,
  ) => {
    if (!enabled) return;
    const api = getShellWindowApi();
    if (!api?.getPosition || !api?.setPosition) return;
    pendingPointerRef.current = pointerId;
    pendingCaptureRef.current = captureElement;
    capturePointer(captureElement, pointerId);
    const [windowX, windowY] = await api.getPosition();
    if (pendingPointerRef.current !== pointerId) return;
    dragRef.current = {
      pointerId,
      screenX,
      screenY,
      windowX,
      windowY,
      captureElement,
      started: false,
    };
  }, [enabled]);

  const moveDrag = useCallback((pointerId: number, screenX: number, screenY: number) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== pointerId) return;
    const api = getShellWindowApi();
    if (!api?.setPosition) return;

    const dx = screenX - drag.screenX;
    const dy = screenY - drag.screenY;
    if (!drag.started) {
      if (Math.hypot(dx, dy) < DRAG_START_THRESHOLD) return;
      drag.started = true;
    }

    api.setPosition(
      Math.round(drag.windowX + dx),
      Math.round(drag.windowY + dy),
    );
  }, []);

  const stopDragByPointer = useCallback((pointerId: number) => {
    if (pendingPointerRef.current === pointerId) {
      releasePointer(pendingCaptureRef.current, pointerId);
      pendingPointerRef.current = null;
      pendingCaptureRef.current = undefined;
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
      event.preventDefault();
      void beginDrag(event.pointerId, event.screenX, event.screenY, event.target as Element);
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
  }, [beginDrag, clearDrag, documentSelector, enabled, ignoreSelector, moveDrag, stopDragByPointer]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !enabled) return;
    if (event.detail > 1) return;
    event.preventDefault();
    void beginDrag(event.pointerId, event.screenX, event.screenY, event.currentTarget);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    moveDrag(event.pointerId, event.screenX, event.screenY);
  };

  const stopDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    stopDragByPointer(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: stopDrag,
    onPointerCancel: stopDrag,
    cancelDrag: clearDrag,
  };
}
