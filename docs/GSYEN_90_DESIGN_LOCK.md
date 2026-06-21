# GSYEN 90 Design Lock

This file records the locked 90-point visual baseline for the standard card and card panel.
Do not change these values unless Ethan explicitly unlocks the design.

## Design Rules

- Advanced feeling means restrained, grounded, clear, low saturation, disciplined.
- Do not make the panel or card rounder.
- Do not increase floating height.
- Do not add glass blur.
- Do not add glowing candy-like blocks.
- Do not add a blue selected outer ring to the standard card.
- Do not change the canvas background.
- Do not change font size, font weight, spacing, radius, shadow, or order without naming the exact token first.

## Standard Card Lock

File: `src/components/CanvasCardSolid.tsx`

```txt
SIZE_W: S=220, M=300, L=380
SIZE_H: S=170, M=230, L=320
TITLE_SIZE: S=15.5, M=18, L=22
BODY_SIZE: S=11.5, M=13, L=14.5
UI_FONT: "HarmonyOS Sans SC","HarmonyOS Sans","Inter","PingFang SC","Microsoft YaHei UI",system-ui,sans-serif
LATIN_FONT: "Inter","HarmonyOS Sans",system-ui,sans-serif

default bg: rgba(237, 240, 246, 0.96)
default border: rgba(135, 146, 166, 0.36)
default ink: #20232B
default muted: rgba(62, 70, 86, 0.48)

cornerR: none=4, normal=6
padX: loose=17, normal=14
padY: loose=15, normal=12

dash color mode:
isDashed card background = SCRINTAL_DEFAULT.bg
isDashed header flow background = tone.bg
isDashed header is real document flow, never fixed height
isDashed first body heading (# ...) belongs to the colored header section
isDashed remaining body belongs to the default card body section
isDashed header borderBottom = 1px solid tone.border
Solid mode still uses tone.bg for the whole card.

card options dot color:
actionColor = panelOpen ? tone.ink : tone.muted
actionRing = panelOpen ? 0 0 0 2px tone.border : 0 4px 9px rgba(53,39,78,0.055)
Do not use a fixed blue color for the standard card `...` dots.

selected shadow:
0 5px 12px rgba(53,39,78,0.085), 0 1px 2px rgba(53,39,78,0.05)

hover/float shadow:
0 5px 12px rgba(53,39,78,0.08), 0 1px 2px rgba(53,39,78,0.05)

normal shadow:
0 3px 8px rgba(53,39,78,0.06), 0 1px 2px rgba(53,39,78,0.035)
```

## Panel Lock

File: `src/components/CanvasCardPanel.tsx`

```txt
FONT: "HarmonyOS Sans SC","HarmonyOS Sans","Inter","PingFang SC","Microsoft YaHei UI",system-ui,sans-serif
LATIN: "Inter","HarmonyOS Sans",system-ui,sans-serif
BLUE: #5F74C4
PANEL_BG: rgba(248, 249, 252, 0.96)
INK: rgba(24, 27, 35, 0.82)
MUTED: rgba(24, 27, 35, 0.38)
DIVIDER: rgba(24, 27, 35, 0.075)
HOVER: rgba(255, 255, 255, 0.76)

PANEL_WIDTH: 344
PANEL_GAP: 14
PANEL_EDGE: 12
PANEL_TOP_OFFSET: -4
PANEL_RADIUS: 6
PANEL_PADDING: 10px 0
PANEL_BORDER: 1px solid rgba(112,121,138,0.18)
PANEL_SHADOW: 0 5px 16px rgba(38,36,52,0.08), 0 1px 2px rgba(38,36,52,0.045), inset 0 1px 0 rgba(255,255,255,0.86)
backdropFilter: none
scrollbar width: 4px
scrollbar thumb: rgba(28,32,42,.11)
```

## Panel Interior Lock

```txt
Divider: height=1, margin=9px 26px

MenuRow:
width: calc(100% - 36px)
margin: 0 18px
height: 45
gridTemplateColumns: 26px 1fr auto
columnGap: 10
padding: 0 12px
borderRadius: 12
label fontSize: 15.5
label fontWeight: 520
shortcut fontSize: 15

Swatches:
row height: 42
gap: 10
padding: 0 20px 0 56px
swatch size: 27x27
swatch radius: 8
active border: 3px solid BLUE
active outer ring: 0 0 0 2px rgba(255,255,255,0.72)

Segment:
padding: 3
compact minWidth: 44
normal minWidth: 58
compact height: 26
normal height: 30
compact radius: 7
normal radius: 9
compact fontSize: 12
normal fontSize: 13

TypePicker:
grid: repeat(4, 1fr)
gap: 8
padding: 6px 20px 4px 56px
pill height: 38
pill radius: 10
fontSize: 11

StatusPicker:
gap: 8
padding: 5px 20px 4px 56px
button height: 30
button padding: 0 12px
button radius: 10
fontSize: 14

Right-side current value fontSize: 15
BETA fontSize: 12.5
```

## Locked Panel Order

```txt
Fit to content
Fold
Draw connection
Swatches
Mindmap
Divider
Content type
TypePicker
Status
StatusPicker
Size
Divider
Elevation
Material
Corners
Density
Display state
Divider
Copy
Remove
Add to sidebar
Open in popup
Open in new tab
Divider
Export as Markdown
Export as PDF
Divider
Show info
Version history
Divider
Copy link
Manage tags
Move to
Divider
Delete from card library
```
