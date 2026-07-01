const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const panelPath = path.join(root, 'src', 'components', 'CanvasCardPanel.tsx');
const cardPath = path.join(root, 'src', 'components', 'CanvasCardSolid.tsx');

const panel = fs.readFileSync(panelPath, 'utf8');
const card = fs.readFileSync(cardPath, 'utf8');

const checks = [
  ['panel', "const FONT = '\"HarmonyOS Sans SC\",\"HarmonyOS Sans\",\"Inter\",\"PingFang SC\",\"Microsoft YaHei UI\",system-ui,sans-serif';"],
  ['panel', "const LATIN = '\"Inter\",\"HarmonyOS Sans\",system-ui,sans-serif';"],
  ['panel', "const BLUE = '#5F74C4';"],
  ['panel', "const PANEL_BG = 'rgba(248, 249, 252, 0.96)';"],
  ['panel', "const INK = 'rgba(24, 27, 35, 0.82)';"],
  ['panel', "const MUTED = 'rgba(24, 27, 35, 0.38)';"],
  ['panel', "const DIVIDER = 'rgba(24, 27, 35, 0.075)';"],
  ['panel', "const HOVER = 'rgba(255, 255, 255, 0.76)';"],
  ['panel', 'const PANEL_WIDTH = 344;'],
  ['panel', 'const PANEL_GAP = 14;'],
  ['panel', 'const PANEL_EDGE = 12;'],
  ['panel', 'const PANEL_TOP_OFFSET = -4;'],
  ['panel', 'const PANEL_RADIUS = 6;'],
  ['panel', "const PANEL_PADDING = '10px 0';"],
  ['panel', "const PANEL_BORDER = '1px solid rgba(112,121,138,0.18)';"],
  ['panel', "const PANEL_SHADOW = '0 5px 16px rgba(38,36,52,0.08), 0 1px 2px rgba(38,36,52,0.045), inset 0 1px 0 rgba(255,255,255,0.86)';"],
  ['panel', "margin: '9px 26px'"],
  ['panel', "width: 'calc(100% - 36px)'"],
  ['panel', "margin: '0 18px'"],
  ['panel', 'height: 45'],
  ['panel', "gridTemplateColumns: '26px 1fr auto'"],
  ['panel', 'columnGap: 10'],
  ['panel', "padding: '0 12px'"],
  ['panel', 'fontSize: 15.5'],
  ['panel', 'fontWeight: 520'],
  ['panel', 'fontSize: 15'],
  ['panel', "gap: 10, padding: '0 20px 0 56px'"],
  ['panel', 'width: 27'],
  ['panel', 'height: 27'],
  ['panel', 'borderRadius: 8'],
  ['panel', "border: active ? `3px solid ${BLUE}` : '1px solid rgba(24,27,35,0.10)'"],
  ['panel', "boxShadow: active ? '0 0 0 2px rgba(255,255,255,0.72), 0 2px 8px rgba(38,36,52,0.16)' : '0 1px 4px rgba(38,36,52,0.12)'"],
  ['panel', 'minWidth: compact ? 44 : 58'],
  ['panel', 'height: compact ? 26 : 30'],
  ['panel', 'fontSize: compact ? 12 : 13'],
  ['panel', "gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: '6px 20px 4px 56px'"],
  ['panel', 'fontSize: 11'],
  ['panel', "flexWrap: 'wrap', gap: 8, padding: '5px 20px 4px 56px'"],
  ['panel', 'fontSize: 14'],
  ['panel', "backdropFilter: 'none'"],
  ['panel', "scrollbarWidth: 'thin'"],
  ['panel', "scrollbarColor: 'rgba(28,32,42,.11) transparent'"],

  ['card', 'const SIZE_W: Record<CardSize, number> = { S: 220, M: 300, L: 380 };'],
  ['card', 'const SIZE_H: Record<CardSize, number> = { S: 170, M: 230, L: 320 };'],
  ['card', 'const TITLE_SIZE: Record<CardSize, number> = { S: 15.5, M: 18, L: 22 };'],
  ['card', 'const BODY_SIZE: Record<CardSize, number> = { S: 11.5, M: 13, L: 14.5 };'],
  ['card', 'function splitDashedLeadHeading(text: string)'],
  ['card', "border: 'rgba(135, 146, 166, 0.36)'"],
  ['card', "bg: 'rgba(237, 240, 246, 0.96)'"],
  ['card', "ink: '#20232B'"],
  ['card', "muted: 'rgba(62, 70, 86, 0.48)'"],
  ['card', "const UI_FONT = '\"HarmonyOS Sans SC\",\"HarmonyOS Sans\",\"Inter\",\"PingFang SC\",\"Microsoft YaHei UI\",system-ui,sans-serif';"],
  ['card', "const LATIN_FONT = '\"Inter\",\"HarmonyOS Sans\",system-ui,sans-serif';"],
  ['card', "const cornerR = d.cardCorner === 'none' ? 4 : 6;"],
  ['card', 'const padX = isLoose ? 17 : 14;'],
  ['card', 'const padY = isLoose ? 15 : 12;'],
  ['card', 'const actionColor = panelOpen ? tone.ink : tone.muted;'],
  ['card', "const actionRing = panelOpen ? `0 0 0 2px ${tone.border}` : '0 4px 9px rgba(53,39,78,0.055)';"],
  ['card', 'const cardBg = isDashed ? SCRINTAL_DEFAULT.bg : tone.bg;'],
  ['card', 'const headerBg = isDashed ? tone.bg : undefined;'],
  ['card', 'const dashedSplit = isDashed && !editingBody ? splitDashedLeadHeading(text)'],
  ['card', 'margin: headerBg ? `-${padY}px -${padX}px 0` : undefined'],
  ['card', 'background: headerBg ? (isFrosted ? headerBg.replace'],
  ['card', '{dashedSplit.leadHeading && ('],
  ['card', 'marginTop: dashedSplit.leadHeading ? 0 : 13'],
  ['card', "borderBottom: headerBg ? `1px solid ${tone.border}` : undefined"],
  ['card', 'boxShadow: actionRing'],
  ['card', 'color: actionColor'],
  ['card', "? '0 5px 12px rgba(53,39,78,0.085), 0 1px 2px rgba(53,39,78,0.05)'"],
  ['card', "? '0 5px 12px rgba(53,39,78,0.08), 0 1px 2px rgba(53,39,78,0.05)'"],
  ['card', ": '0 3px 8px rgba(53,39,78,0.06), 0 1px 2px rgba(53,39,78,0.035)'"],
];

const failures = [];
for (const [target, needle] of checks) {
  const haystack = target === 'panel' ? panel : card;
  if (!haystack.includes(needle)) failures.push(`${target}: ${needle}`);
}

if (failures.length) {
  console.error('\nGSYEN 90 design lock failed. These locked tokens changed:\n');
  for (const item of failures) console.error(`- ${item}`);
  console.error('\nDo not change locked design tokens unless Ethan explicitly unlocks this baseline.\n');
  process.exit(1);
}

console.log('GSYEN 90 design lock OK');
