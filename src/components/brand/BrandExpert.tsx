import React from 'react';
import { motion } from 'motion/react';
import { HelpCircle, Copy, FileText } from 'lucide-react';
import { LogoConfig, ColorPalette } from '../../types';
import { translations } from '../../translations';

interface Props {
  lang: 'zh' | 'en';
  config: LogoConfig;
  activePalette: ColorPalette;
  svgMarkup: string;
  isCopied: boolean;
  onCopy: () => void;
}

/** Brand Lab · 创意助手标签：AI 提示词自动生成 + SVG 源码浏览 */
export default function BrandExpert({ lang, config, activePalette, svgMarkup, isCopied, onCopy }: Props) {
  const t = translations[lang];

  const copyPrompt = () => {
    const str = `Minimalist vector logo for a professional brand named '${config.brandName}', featuring a clean ${config.iconName} icon. Color scheme uses exquisite contrast with ${activePalette.name} (primary color: ${activePalette.primaryHex}, background: ${activePalette.bgHex}). Highly stylized, modern geometric composition, beautiful whitespace, pristine, flat logo, clean graphic design, 4k.`;
    navigator.clipboard.writeText(str);
    alert(t.promptCopied);
  };

  return (
    <motion.div
      key="expert-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex-1 space-y-6"
      id="expert-prompt-assistant"
    >
      <div className="p-6 bg-white border border-[#1A1A1A]/10 rounded-none space-y-4">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-[#1A1A1A]" />
          <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-[#1A1A1A]">{t.creativeGenerativeGuidance}</h3>
        </div>
        <p className="text-xs text-[#1A1A1A]/70 leading-relaxed max-w-3xl">{t.assistantDesc}</p>
      </div>

      <div className="bg-white border border-[#1A1A1A]/10 rounded-none p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono text-[#1A1A1A]/50 uppercase tracking-widest">{t.autoFormattedPrompt}</span>
          <button
            onClick={copyPrompt}
            className="text-[9px] font-mono font-bold tracking-widest uppercase text-[#1A1A1A] hover:underline flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" /> {t.copyPrompt}
          </button>
        </div>
        <div className="p-5 bg-[#F4F2EE] border border-[#1A1A1A]/10 rounded-none">
          <p className="text-xs text-[#1A1A1A]/80 leading-relaxed font-mono">
            "Minimalist vector logo for a professional brand named <span className="text-[#1A1A1A] font-bold">'{config.brandName}'</span>, featuring a clean <span className="text-[#1A1A1A] font-bold">{config.iconName}</span> icon. Color scheme uses exquisite contrast with <span className="text-[#1A1A1A] font-bold">{activePalette.name}</span> (primary color: <span className="text-[#1A1A1A]">{activePalette.primaryHex}</span>, secondary: <span className="text-[#1A1A1A]">{activePalette.secondaryHex}</span>, backdrop: <span className="text-[#1A1A1A]">{activePalette.bgHex}</span>). Highly stylized, modern geometric composition, beautiful whitespace, pristine, flat logo, clean graphic design, high resolution."
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#1A1A1A]/10 rounded-none p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-mono tracking-widest text-[#1A1A1A] uppercase font-bold flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" /> {t.inlineSourceCode}
          </h4>
          <span className="text-[9px] text-[#1A1A1A]/40 font-mono uppercase tracking-wider">{t.xmlDesc}</span>
        </div>
        <div className="bg-[#F4F2EE] border border-[#1A1A1A]/10 rounded-none p-4 overflow-x-auto max-h-56 font-mono text-[11px] text-[#1A1A1A]/80 leading-relaxed">
          <pre className="text-[10px] text-[#1A1A1A]/80 font-mono whitespace-pre">{svgMarkup}</pre>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCopy}
            className="bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-[10px] uppercase font-mono tracking-widest text-white font-bold px-4 py-2.5 rounded-none flex items-center gap-2 transition-all"
          >
            <Copy className="w-4 h-4" />
            {isCopied ? t.codeCopied : t.copyToClipboard}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
