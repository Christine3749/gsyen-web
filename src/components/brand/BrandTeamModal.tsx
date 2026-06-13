import { useState } from 'react';
import { TrendingUp, Heart, Zap, Globe } from 'lucide-react';

type TeamType = '成约' | '伙伴' | '行动' | '聚集';

const TYPES: { key: TeamType; icon: React.ElementType; desc: string; color: string; bg: string }[] = [
  { key: '成约', icon: TrendingUp, desc: '成交推进，客户跟进', color: '#1A73E8', bg: '#E8F0FE' },
  { key: '伙伴', icon: Heart,      desc: '长期合作，战略协同', color: '#137333', bg: '#E6F4EA' },
  { key: '行动', icon: Zap,        desc: '短期任务，作战小队', color: '#B05E00', bg: '#FEF7E0' },
  { key: '聚集', icon: Globe,      desc: '兴趣社群，同频连接', color: '#9334E6', bg: '#F3E8FD' },
];

interface Props {
  busy:      boolean;
  error:     string | null;
  onClose:   () => void;
  onConfirm: (name: string, type: TeamType) => void;
}

export default function BrandTeamModal({ busy, error, onClose, onConfirm }: Props) {
  const [name, setName] = useState('');
  const [type, setType] = useState<TeamType>('成约');

  const submit = () => { if (name.trim()) onConfirm(name.trim(), type); };

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
      onClick={onClose}>
      <div className="bg-white rounded-2xl border border-[#DADCE0] p-6 w-96 shadow-xl"
        onClick={e => e.stopPropagation()}>

        <p className="text-[14px] font-sans font-semibold text-[#202124] mb-5">创建团队</p>

        {/* 场景选择 */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {TYPES.map(t => {
            const Icon = t.icon;
            const active = type === t.key;
            return (
              <button key={t.key} onClick={() => setType(t.key)}
                className="flex items-start gap-3 p-3 rounded-xl border transition-all text-left"
                style={{ borderColor: active ? t.color : '#DADCE0', borderWidth: active ? 2 : 1 }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: t.bg }}>
                  <Icon className="w-4 h-4" style={{ color: t.color }} strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-sans font-semibold leading-none mb-1"
                    style={{ color: active ? t.color : '#202124' }}>{t.key}</p>
                  <p className="text-[10px] font-sans text-[#9AA0A6] leading-snug">{t.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* 团队名称 */}
        <input
          autoFocus value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="团队名称…"
          className="w-full border border-[#DADCE0] rounded-lg px-3 py-2 text-[13px] font-sans text-[#202124] placeholder:text-[#9AA0A6] outline-none focus:border-[#1A73E8] transition-colors mb-3"
        />

        {error && <p className="text-[12px] font-sans text-[#D93025] mb-3">{error}</p>}

        <div className="flex justify-end gap-2">
          <button onClick={onClose}
            className="px-4 py-2 rounded-full text-[12px] font-sans text-[#5F6368] hover:bg-[#F1F3F4] transition-all">
            取消
          </button>
          <button onClick={submit} disabled={busy || !name.trim()}
            className="px-4 py-2 rounded-full text-[12px] font-sans font-medium bg-[#1A73E8] text-white hover:bg-[#1557B0] disabled:opacity-40 transition-all">
            {busy ? '…' : '创建'}
          </button>
        </div>
      </div>
    </div>
  );
}
