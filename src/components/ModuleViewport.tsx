import type { ReactNode } from 'react';

interface ModuleViewportProps {
  children: ReactNode;
}

/**
 * Shared flex boundary for every workspace module.
 * The viewport owns sizing; each module only owns its content and toolbar.
 */
export function ModuleViewport({ children }: ModuleViewportProps) {
  return <div className="gsyen-module-viewport">{children}</div>;
}
