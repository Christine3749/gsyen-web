import { useRef, type PointerEvent } from 'react';

type HiddenShellDrag = {
  pointerId: number;
  screenX: number;
  screenY: number;
  windowX: number;
  windowY: number;
};

type ShellWindowApi = {
  getPosition?: () => Promise<[number, number]>;
  setPosition?: (x: number, y: number) => void;
};

const getShellWindowApi = (): ShellWindowApi | undefined =>
  (window as any).electronAPI?.window;

export function useHiddenShellDrag(enabled: boolean) {
  const dragRef = useRef<HiddenShellDrag | null>(null);
  const pendingPointerRef = useRef<number | null>(null);

  const onPointerDown = async (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !enabled) return;
    const api = getShellWindowApi();
    if (!api?.getPosition || !api?.setPosition) return;
    event.preventDefault();
    pendingPointerRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    const [windowX, windowY] = await api.getPosition();
    if (pendingPointerRef.current !== event.pointerId) return;
    dragRef.current = {
      pointerId: event.pointerId,
      screenX: event.screenX,
      screenY: event.screenY,
      windowX,
      windowY,
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const api = getShellWindowApi();
    if (!api?.setPosition) return;
    api.setPosition(
      Math.round(drag.windowX + event.screenX - drag.screenX),
      Math.round(drag.windowY + event.screenY - drag.screenY),
    );
  };

  const stopDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (pendingPointerRef.current === event.pointerId) {
      pendingPointerRef.current = null;
    }
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
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
