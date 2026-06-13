import { useEffect, useRef, useState } from 'react';
import BrandMemberProfile from './BrandMemberProfile';
import BrandMemberPerms from './BrandMemberPerms';
import BrandMemberPlans from './BrandMemberPlans';

type Section = 'profile' | 'security' | 'perms' | 'plans';

const NAV: { id: Section; zh: string; en: string; group: 'account' | 'member' }[] = [
  { id: 'profile',  zh: '账户信息', en: 'Account',     group: 'account' },
  { id: 'security', zh: '安全设置', en: 'Security',    group: 'account' },
  { id: 'perms',    zh: '我的权限', en: 'Permissions',  group: 'member'  },
  { id: 'plans',    zh: '会员方案', en: 'Plans',        group: 'member'  },
];
const GROUPS: { key: 'account' | 'member'; zh: string; en: string }[] = [
  { key: 'account', zh: '账户设置', en: 'Account Settings' },
  { key: 'member',  zh: '会员',     en: 'Membership'       },
];

export default function BrandMember({ lang }: { lang: 'zh' | 'en' }) {
  const [active, setActive] = useState<Section>('profile');
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollTo = (id: Section) => {
    const el = document.getElementById(`member-${id}`);
    const container = scrollRef.current;
    if (!el || !container) return;
    const top = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 32;
    container.scrollTo({ top, behavior: 'smooth' });
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const sections = NAV.map(n => document.getElementById(`member-${n.id}`)).filter(Boolean) as HTMLElement[];
    const onScroll = () => {
      const containerTop = container.getBoundingClientRect().top;
      const threshold = containerTop + 80;
      let current: Section = 'profile';
      for (const el of sections) {
        if (el.getBoundingClientRect().top <= threshold) current = el.id.replace('member-', '') as Section;
      }
      setActive(current);
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto flex gap-14 px-8 py-10">

        {/* 左侧锚点导航 — sticky */}
        <aside className="w-40 shrink-0 sticky top-0 self-start pt-1">
          {GROUPS.map(g => (
            <div key={g.key} className="mb-5">
              <p className="mb-1 text-[7.5px] font-mono font-bold tracking-[0.28em] uppercase text-[#1A1A1A]/30">
                {lang === 'zh' ? g.zh : g.en}
              </p>
              {NAV.filter(n => n.group === g.key).map(n => (
                <button key={n.id} onClick={() => scrollTo(n.id)}
                  className={`w-full text-left px-3 py-1.5 text-[10px] font-mono transition-all rounded-none ${
                    active === n.id
                      ? 'text-[#1A1A1A] font-bold bg-[#1A1A1A]/6'
                      : 'text-[#1A1A1A]/45 hover:text-[#1A1A1A]/75 hover:bg-[#1A1A1A]/4'
                  }`}>
                  {lang === 'zh' ? n.zh : n.en}
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* 右侧全部内容 — 单页滚动 */}
        <div className="flex-1 min-w-0 flex flex-col gap-14 pb-24">
          <section id="member-profile">
            <BrandMemberProfile lang={lang} />
          </section>
          <div className="border-t border-[#1A1A1A]/6" />
          <section id="member-security">
            <SecuritySection lang={lang} />
          </section>
          <div className="border-t border-[#1A1A1A]/6" />
          <section id="member-perms">
            <BrandMemberPerms lang={lang} />
          </section>
          <div className="border-t border-[#1A1A1A]/6" />
          <section id="member-plans">
            <BrandMemberPlans lang={lang} />
          </section>
        </div>

      </div>
    </div>
  );
}

function SecuritySection({ lang }: { lang: 'zh' | 'en' }) {
  const zh = lang === 'zh';
  return (
    <div>
      <div className="mb-7">
        <p className="text-[10px] font-mono font-bold tracking-[0.28em] uppercase text-[#1A1A1A]">
          {zh ? '安全设置' : 'Security'}
        </p>
        <p className="text-[9px] font-mono text-[#1A1A1A]/38 mt-1 tracking-wide">
          {zh ? '管理密码与登录安全' : 'Manage your password and login security'}
        </p>
      </div>
      <div className="bg-white border border-[#DADCE0] px-6 py-5 text-[13px] font-sans text-[#5F6368]">
        {zh ? '即将上线' : 'Coming soon'}
      </div>
    </div>
  );
}
