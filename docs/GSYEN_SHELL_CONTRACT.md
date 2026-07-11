# GSYEN Shell Contract

This file locks the shell rules that must not drift between releases.

## Platform Boundaries

- 27-inch Web and 27-inch Electron share the same right-account visual language.
- 13/14-inch Electron may use tighter measurements only to avoid overlap with Windows controls.
- 13/14-inch Web may compress labels, but must not inherit Electron-only window-control layout.
- A small-screen fix must be scoped by platform and viewport. It must not target `#app-header.gsyen-app-header` globally unless the change is intended for every shell.

## Account Tray

- Account/auth tray widths are fixed shell measurements, not flexible content.
- `中文 / 登录 / 注册` must not use `flex: 1` to consume remaining space.
- Large Web and large Electron auth tray width: `206px`.
- Auth segments:
  - language: `54px`
  - login: `72px`
  - register: `80px`
- Logged-in account tray may be wider, but it must remain fixed and right-aligned.

## Height

- Module toolbar and command deck default height: `42px`.
- Do not raise the shell to `52px` as a global default.
- Inner controls should stay around `28-30px`.
- If a module needs a taller local tool surface, that belongs inside the module body, not the shared shell rail.

## Surfaces

- Do not add cross-module background harmonizers that repaint Mail, Calendar, Prism, and the main workspace from one CSS layer.
- Module backgrounds belong to each module or to stable tokens, not late global override files.
- Shell chrome surfaces use `#F4F2EE`: AppHeader, root shell, module toolbar,
  brand subnav, and command deck background. Content areas keep `#F9F8F6`.
- Avoid gradients and `color-mix()` surface overrides in late index layers unless Ethan explicitly approves the full shell change.

## Double Click

- Header hide/show is a shell primitive.
- The double-click target before the header is hidden is the visible header-shell drawer:
  the blank band at the bottom of `#app-header`, plus the immediate shell toolbar band below it.
- The default visible header-shell band height is `44px`, stored as `--gsyen-header-shell-zone-height`.
- `.gsyen-shell-double-click-zone` is the semantic marker for that band. It is not a 1px/8px waistline.
- Hidden state uses `.gsyen-shell-reveal-hotzone`, a separate `8-12px` top-edge recall strip.
- Do not confuse these two states: visible header-shell band hides the header; hidden top-edge hotzone recalls it.
- `#app-header` as a whole must not be a double-click target. Only its bottom blank shell band may toggle hide/show.
- Buttons, module navigation, account tray, Windows controls, inputs, and `.gsyen-command-deck` must not trigger header hide/show.
- Empty space in `.gsyen-module-toolbar:not(.gsyen-command-deck)` and `.gsyen-brand-subnav` is part of the header-shell drawer and may toggle the header.
- Shell chrome must use `user-select: none` and must not show a text caret.

## Release Discipline

- Before release, inspect the diff for shell files.
- If a change targets one platform or viewport, the selector must prove that boundary.
- Do not solve one screenshot by adding a broad global CSS layer.
