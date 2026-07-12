export const HIDDEN_SHELL_DRAWER_SELECTOR =
  '.gsyen-command-deck, .gsyen-module-toolbar:not(.gsyen-command-deck), .gsyen-brand-subnav';

export const SHELL_NO_INTERACTION_TARGETS =
  'button, a, input, select, textarea, [role="button"], [data-shell-no-toggle="true"], .gsyen-brand-lockup, .gsyen-header-actions, .gsyen-account-tray, .gsyen-window-controls, .gsyen-command-tools, .gsyen-command-core, .gsyen-command-model, .gsyen-command-pulse, .gsyen-pulse-dock-slot, .gsyen-pulse-panel, .gsyen-system-bus, .gsyen-model-strip, .gsyen-model-dock, .gsyen-model-selector, .gsyen-system-panel';

export const isShellControlTarget = (target: Element) =>
  Boolean(target.closest(SHELL_NO_INTERACTION_TARGETS));
