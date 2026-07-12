import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';

type HiddenShellDrag = {
  pointerId: number;
  screenX: number;
  screenY: number;
  windowX: number;
  windowY: number;
  captureElement?: Element;
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
  const { documentSelector, ignoreSelector } = options;

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
    };
  }, [enabled]);

  const moveDrag = useCallback((pointerId: number, screenX: number, screenY: number) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== pointerId) return;
    const api = getShellWindowApi();
    if (!api?.setPosition) return;
    api.setPosition(
      Math.round(drag.windowX + screenX - drag.screenX),
      Math.round(drag.windowY + screenY - drag.screenY),
    );
  }, []);

  const stopDragByPointer = useCallback((pointerId: number) => {
    if (pendingPointerRef.current === pointerId) {
      pendingPointerRef.current = null;
    }
    if (dragRef.current?.pointerId === pointerId) {
      releasePointer(dragRef.current.captureElement, pointerId);
      dragRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled || !documentSelector) return;

    const isDraggableShellTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      if (ignoreSelector && target.closest(ignoreSelector)) return false;
      return Boolean(target.closest(documentSelector));
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !isDraggableShellTarget(event.target)) return;
      event.preventDefault();
      void beginDrag(event.pointerId, event.screenX, event.screenY, event.target as Element);
    };
    const handlePointerMove = (event: PointerEvent) => {
      moveDrag(event.pointerId, event.screenX, event.screenY);
    };
    const handlePointerUp = (event: PointerEvent) => {
      stopDragByPointer(event.pointerId);
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('pointermove', handlePointerMove, true);
    window.addEventListener('pointerup', handlePointerUp, true);
    window.addEventListener('pointercancel', handlePointerUp, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('pointermove', handlePointerMove, true);
      window.removeEventListener('pointerup', handlePointerUp, true);
      window.removeEventListener('pointercancel', handlePointerUp, true);
    };
  }, [beginDrag, documentSelector, enabled, ignoreSelector, moveDrag, stopDragByPointer]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !enabled) return;
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
  };
}
