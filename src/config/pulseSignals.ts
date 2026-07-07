export type PulseLang = 'zh' | 'en';
export type PulseTone = 'primary' | 'warn';

export interface PulseSignal {
  id: string;
  label: string;
  value: string;
  unit: string;
  detail: string;
  action: string;
  summary: string;
  tone?: PulseTone;
}

interface PulseSignalSource {
  id: string;
  label: { zh: string; en: string };
  value: string;
  unit: { zh: string; en: string };
  detail: { zh: string; en: string };
  action: { zh: string; en: string };
  summary: { zh: string; en: string };
  tone?: PulseTone;
}

const SIGNALS: PulseSignalSource[] = [
  {
    id: 'GYENBOX',
    label: { zh: 'GYENBOX', en: 'GYENBOX' },
    value: '3',
    unit: { zh: '文件', en: 'FILES' },
    detail: { zh: '桌面端未提交 Rust 修改', en: 'desktop pending Rust changes' },
    action: { zh: '进入项目', en: 'Open' },
    summary: { zh: '3 文件未提交', en: '3 files pending' },
    tone: 'primary',
  },
  {
    id: 'DGWM',
    label: { zh: 'DGWM', en: 'DGWM' },
    value: '3',
    unit: { zh: '候选', en: 'CANDIDATES' },
    detail: { zh: 'canonical 候选待裁决', en: 'canonical candidates to decide' },
    action: { zh: '转任务', en: 'Task' },
    summary: { zh: '3 个 canonical 候选', en: '3 canonical candidates' },
    tone: 'warn',
  },
  {
    id: 'PRISM',
    label: { zh: 'PRISM', en: 'PRISM' },
    value: 'V2',
    unit: { zh: '冻结', en: 'FROZEN' },
    detail: { zh: 'Prism-Edge 等待 DGWM adapter', en: 'Prism-Edge waits for DGWM adapter' },
    action: { zh: '进入项目', en: 'Open' },
    summary: { zh: 'V2 冻结', en: 'V2 frozen' },
    tone: 'warn',
  },
  {
    id: 'ZHIJIAN',
    label: { zh: '小纸笺', en: 'ZHIJIAN' },
    value: '94',
    unit: { zh: '改动', en: 'CHANGES' },
    detail: { zh: '设计系统今日改动，建议冻结版本', en: 'design system changes, freeze version' },
    action: { zh: '归档', en: 'Archive' },
    summary: { zh: '94 改动', en: '94 changes' },
  },
  {
    id: 'TEMPORA',
    label: { zh: 'TEMPORA', en: 'TEMPORA' },
    value: '7D',
    unit: { zh: '停滞', en: 'IDLE' },
    detail: { zh: 'Tempora Find 7 天无动作，保持 frozen', en: 'Tempora Find idle, keep frozen' },
    action: { zh: '忽略', en: 'Ignore' },
    summary: { zh: '7D 停滞', en: '7D idle' },
  },
  {
    id: 'FOCUS',
    label: { zh: '今日推进', en: 'FOCUS' },
    value: '2',
    unit: { zh: '项目', en: 'PROJECTS' },
    detail: { zh: 'GyenBox + Prism-Edge', en: 'GyenBox + Prism-Edge' },
    action: { zh: '置顶', en: 'Pin' },
    summary: { zh: '2 项目', en: '2 projects' },
  },
];

const toSignal = (lang: PulseLang, source: PulseSignalSource): PulseSignal => ({
  id: source.id,
  label: source.label[lang],
  value: source.value,
  unit: source.unit[lang],
  detail: source.detail[lang],
  action: source.action[lang],
  summary: source.summary[lang],
  tone: source.tone,
});

export const PULSE_SIGNALS_ZH = SIGNALS.map(source => toSignal('zh', source));
export const PULSE_SIGNALS_EN = SIGNALS.map(source => toSignal('en', source));
export const PULSE_FOCUS_LABEL = 'GyenBox + Prism-Edge';

export function getPulseSignals(lang: PulseLang): PulseSignal[] {
  return lang === 'zh' ? PULSE_SIGNALS_ZH : PULSE_SIGNALS_EN;
}

export function getPulseSignal(lang: PulseLang, id: string): PulseSignal {
  return getPulseSignals(lang).find(signal => signal.id === id) ?? getPulseSignals(lang)[0];
}

export function getStandbyPulseSignals(lang: PulseLang): PulseSignal[] {
  const ids = new Set(['GYENBOX', 'PRISM', 'TEMPORA']);
  return getPulseSignals(lang).filter(signal => ids.has(signal.id));
}
