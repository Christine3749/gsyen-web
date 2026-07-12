// @vitest-environment jsdom
import { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useHiddenShellDrag } from './useHiddenShellDrag';

const DRAWER_SELECTOR = '.gsyen-module-toolbar';
const NO_SHELL_SELECTOR = 'button, input, [data-shell-no-toggle="true"]';

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function DragHarness() {
  useHiddenShellDrag(true, { documentSelector: DRAWER_SELECTOR, ignoreSelector: NO_SHELL_SELECTOR });
  useEffect(() => () => undefined, []);
  return null;
}

function renderHarness() {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  act(() => root?.render(<DragHarness />));
}

function emitPointer(target: EventTarget, type: string, pointerId: number, screenX: number, screenY: number) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    button: { value: 0 }, pointerId: { value: pointerId }, screenX: { value: screenX }, screenY: { value: screenY },
  });
  target.dispatchEvent(event);
}

function flush() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

function installWindowApi(getPosition = vi.fn().mockResolvedValue([100, 200])) {
  const setPosition = vi.fn();
  Object.defineProperty(window, 'electronAPI', {
    configurable: true,
    value: { window: { getPosition, setPosition } },
  });
  return { getPosition, setPosition };
}

function makeDrawer() {
  const drawer = document.createElement('div');
  drawer.className = 'gsyen-module-toolbar';
  document.body.append(drawer);
  const setPointerCapture = vi.fn();
  Object.defineProperties(drawer, {
    setPointerCapture: { configurable: true, value: setPointerCapture },
    hasPointerCapture: { configurable: true, value: () => true },
    releasePointerCapture: { configurable: true, value: vi.fn() },
  });
  return { drawer, setPointerCapture };
}

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  host?.remove();
  host = null;
  document.body.replaceChildren();
  delete (window as any).electronAPI;
});

describe('useHiddenShellDrag', () => {
  it('single click records no native window operation', () => {
    const { getPosition, setPosition } = installWindowApi();
    const { drawer, setPointerCapture } = makeDrawer();
    renderHarness();

    emitPointer(drawer, 'pointerdown', 1, 20, 20);
    emitPointer(drawer, 'pointerup', 1, 20, 20);

    expect(getPosition).not.toHaveBeenCalled();
    expect(setPosition).not.toHaveBeenCalled();
    expect(setPointerCapture).not.toHaveBeenCalled();
  });

  it('does not start at or below the 8px threshold', async () => {
    const { getPosition, setPosition } = installWindowApi();
    const { drawer } = makeDrawer();
    renderHarness();

    emitPointer(drawer, 'pointerdown', 1, 20, 20);
    emitPointer(window, 'pointermove', 1, 28, 20);
    await flush();

    expect(getPosition).not.toHaveBeenCalled();
    expect(setPosition).not.toHaveBeenCalled();
  });

  it('moves only after the pointer exceeds the threshold', async () => {
    const { getPosition, setPosition } = installWindowApi();
    const { drawer, setPointerCapture } = makeDrawer();
    renderHarness();

    emitPointer(drawer, 'pointerdown', 1, 20, 20);
    emitPointer(window, 'pointermove', 1, 29, 20);
    await flush();

    expect(getPosition).toHaveBeenCalledOnce();
    expect(setPointerCapture).toHaveBeenCalledWith(1);
    expect(setPosition).toHaveBeenCalledWith(109, 200);
  });

  it.each(['pointerup', 'pointercancel'] as const)('cancels a pending native move on %s', async (endEvent) => {
    let resolvePosition: ((position: [number, number]) => void) | undefined;
    const getPosition = vi.fn(() => new Promise<[number, number]>(resolve => { resolvePosition = resolve; }));
    const { setPosition } = installWindowApi(getPosition);
    const { drawer } = makeDrawer();
    renderHarness();

    emitPointer(drawer, 'pointerdown', 1, 20, 20);
    emitPointer(window, 'pointermove', 1, 29, 20);
    emitPointer(drawer, endEvent, 1, 29, 20);
    resolvePosition?.([100, 200]);
    await flush();

    expect(setPosition).not.toHaveBeenCalled();
  });

  it('clears pending work on blur and visibility changes', async () => {
    for (const end of ['blur', 'visibilitychange']) {
      let resolvePosition: ((position: [number, number]) => void) | undefined;
      const getPosition = vi.fn(() => new Promise<[number, number]>(resolve => { resolvePosition = resolve; }));
      const { setPosition } = installWindowApi(getPosition);
      const { drawer } = makeDrawer();
      renderHarness();

      emitPointer(drawer, 'pointerdown', 1, 20, 20);
      emitPointer(window, 'pointermove', 1, 29, 20);
      (end === 'blur' ? window : document).dispatchEvent(new Event(end));
      resolvePosition?.([100, 200]);
      await flush();

      expect(setPosition).not.toHaveBeenCalled();
      act(() => root?.unmount());
      root = null;
      document.body.replaceChildren();
    }
  });

  it('never treats controls as draggable shell', () => {
    const { getPosition, setPosition } = installWindowApi();
    const { drawer } = makeDrawer();
    const button = document.createElement('button');
    drawer.append(button);
    renderHarness();

    emitPointer(button, 'pointerdown', 1, 20, 20);
    emitPointer(window, 'pointermove', 1, 40, 20);

    expect(getPosition).not.toHaveBeenCalled();
    expect(setPosition).not.toHaveBeenCalled();
  });

  it('never treats the recall hotzone as draggable shell', () => {
    const { getPosition, setPosition } = installWindowApi();
    const hotzone = document.createElement('div');
    hotzone.className = 'gsyen-shell-reveal-hotzone';
    document.body.append(hotzone);
    renderHarness();

    emitPointer(hotzone, 'pointerdown', 1, 20, 20);
    emitPointer(window, 'pointermove', 1, 40, 20);

    expect(getPosition).not.toHaveBeenCalled();
    expect(setPosition).not.toHaveBeenCalled();
  });
});
