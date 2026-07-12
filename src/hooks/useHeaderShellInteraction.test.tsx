// @vitest-environment jsdom
import { act, type CSSProperties } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useHeaderShellInteraction } from './useHeaderShellInteraction';

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function ShellHarness() {
  const { headerHidden, recallHeader } = useHeaderShellInteraction(true);
  return (
    <>
      <header id="app-header" className="gsyen-app-header" style={{ '--gsyen-header-shell-zone-height': '44px' } as CSSProperties}>
        <button id="header-control">control</button>
      </header>
      <div id="drawer" className="gsyen-module-toolbar" style={{ height: '42px', minHeight: '42px' }} />
      <div id="pulse" className="gsyen-command-pulse" />
      {headerHidden && <div id="recall-hotzone" onDoubleClick={recallHeader} />}
    </>
  );
}

function renderShell() {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  act(() => root?.render(<ShellHarness />));
  const header = document.querySelector<HTMLElement>('#app-header')!;
  Object.defineProperty(header, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({ bottom: 100 }),
  });
  return header;
}

function doubleClick(target: EventTarget, clientY = 90) {
  act(() => target.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, clientY })));
}

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  host?.remove();
  host = null;
  document.body.replaceChildren();
  delete (document.documentElement as HTMLElement).dataset.headerHidden;
  delete (window as any).electronAPI;
});

describe('useHeaderShellInteraction', () => {
  it('hides only when the visible header bottom shell band is double-clicked', () => {
    const header = renderShell();
    const drawer = document.querySelector<HTMLElement>('#drawer')!;

    doubleClick(drawer);
    expect(document.documentElement.dataset.headerHidden).toBe('false');

    doubleClick(header, 20);
    expect(document.documentElement.dataset.headerHidden).toBe('false');

    doubleClick(header);
    expect(document.documentElement.dataset.headerHidden).toBe('true');
  });

  it('keeps a hidden drawer single click inert without changing its height', () => {
    const header = renderShell();
    doubleClick(header);
    const drawer = document.querySelector<HTMLElement>('#drawer')!;
    const before = { height: drawer.style.height, minHeight: drawer.style.minHeight };

    act(() => drawer.dispatchEvent(new MouseEvent('click', { bubbles: true })));

    expect(document.documentElement.dataset.headerHidden).toBe('true');
    expect({ height: drawer.style.height, minHeight: drawer.style.minHeight }).toEqual(before);
  });

  it('recalls only from hidden drawer and top hotzone double-clicks', () => {
    const header = renderShell();
    doubleClick(header);
    const drawer = document.querySelector<HTMLElement>('#drawer')!;
    const hotzone = document.querySelector<HTMLElement>('#recall-hotzone')!;

    act(() => hotzone.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(document.documentElement.dataset.headerHidden).toBe('true');

    doubleClick(drawer);
    expect(document.documentElement.dataset.headerHidden).toBe('false');

    doubleClick(header);
    doubleClick(document.querySelector<HTMLElement>('#recall-hotzone')!);
    expect(document.documentElement.dataset.headerHidden).toBe('false');
  });

  it('keeps header controls and pulse controls out of shell interaction', () => {
    const header = renderShell();
    const control = document.querySelector<HTMLElement>('#header-control')!;
    const pulse = document.querySelector<HTMLElement>('#pulse')!;

    doubleClick(control);
    doubleClick(pulse);

    expect(document.documentElement.dataset.headerHidden).toBe('false');
  });
});
