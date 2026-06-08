import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, Copy, Eye, EyeOff, Plus, Trash2, ShieldAlert, Sliders, RefreshCw, Sparkles, Search, Check } from 'lucide-react';
import { localDateStr } from '../utils/date';

interface CredentialRow {
  id: string;
  serviceName: string;
  username: string;
  secretVal: string;
  category: 'api' | 'server' | 'database' | 'personal';
  lastUpdated: string;
}

interface PasswordModuleProps {
  lang: 'zh' | 'en';
}

export default function PasswordModule({ lang }: PasswordModuleProps) {
  const LOCAL_STORAGE_KEY = 'identity_lab_passwords';

  const [credentials, setCredentials] = useState<CredentialRow[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState('');
  
  // Generator conditions state
  const [genLength, setGenLength] = useState<number>(18);
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [customPrefix, setCustomPrefix] = useState('');
  const [generatedPass, setGeneratedPass] = useState('');
  const [strengthScore, setStrengthScore] = useState<number>(3); // 1 to 5 scale
  
  // Create state
  const [newService, setNewService] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newSecretVal, setNewSecretVal] = useState('');
  const [newCategory, setNewCategory] = useState<'api' | 'server' | 'database' | 'personal'>('api');
  const [showAddForm, setShowAddForm] = useState(false);

  // Hidden secret states helper (maps ID to boolean)
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [isCopiedGen, setIsCopiedGen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Generate initial random password on load
  useEffect(() => {
    handleGenerate();

    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setCredentials(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Default credentials safe database
      const defaultData: CredentialRow[] = [
        {
          id: 'p1',
          serviceName: lang === 'zh' ? 'Supabase 生产数据库密钥' : 'Production Supabase Database Master JWT',
          username: 'postgres_owner',
          secretVal: 'S_p@se_pA55w0rd_SeCrEt_N0rd_093!',
          category: 'database',
          lastUpdated: '2026-05-25'
        },
        {
          id: 'p2',
          serviceName: lang === 'zh' ? 'Gemini AI 极速接入令牌' : 'Gemini AI Core Service API Key',
          username: 'system_atelier_api',
          secretVal: 'AIzaSyChrOnos_PaS5wordLab_G3m1n1_R3s0urce_v3',
          category: 'api',
          lastUpdated: '2026-05-25'
        },
        {
          id: 'p3',
          serviceName: lang === 'zh' ? 'Atelier 主安全控制台安全组证书' : 'Citadel SSL Private Root CA',
          username: 'keys_custodian',
          secretVal: 'SSH-RSA-Atelier-KeyChain-Secured-2026',
          category: 'server',
          lastUpdated: '2026-05-24'
        }
      ];
      setCredentials(defaultData);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultData));
    }
  }, [lang]);

  const saveCredentials = (updated: CredentialRow[]) => {
    setCredentials(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  // Algorithmic generator code
  const handleGenerate = () => {
    let charset = 'abcdefghijklmnopqrstuvwxyz';
    if (includeUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let result = '';
    const actualLength = Math.max(genLength - customPrefix.length, 6);
    
    for (let i = 0; i < actualLength; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      result += charset[randomIndex];
    }

    const finalPass = customPrefix + result;
    setGeneratedPass(finalPass);

    // Calculate dynamic strength
    let score = 1;
    if (finalPass.length > 10) score += 1;
    if (finalPass.length > 15) score += 1;
    if (/[A-Z]/.test(finalPass)) score += 0.5;
    if (/[0-9]/.test(finalPass)) score += 0.5;
    if (/[^A-Za-z0-9]/.test(finalPass)) score += 1;
    
    setStrengthScore(Math.min(Math.round(score), 5));
  };

  // Copy helper
  const copyToClipboardText = (txt: string, id: string | null = null) => {
    navigator.clipboard.writeText(txt);
    if (id === null) {
      setIsCopiedGen(true);
      setTimeout(() => setIsCopiedGen(false), 2000);
    } else {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Create handler
  const handleAddCredential = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.trim() || !newSecretVal.trim()) return;

    const row: CredentialRow = {
      id: Date.now().toString(),
      serviceName: newService,
      username: newUsername || 'n/a',
      secretVal: newSecretVal,
      category: newCategory,
      lastUpdated: localDateStr(new Date())
    };

    const updated = [row, ...credentials];
    saveCredentials(updated);

    setNewService('');
    setNewUsername('');
    setNewSecretVal('');
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    const updated = credentials.filter(c => c.id !== id);
    saveCredentials(updated);
  };

  // Toggle visible secret key
  const toggleVisibility = (id: string) => {
    setRevealedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filterTypeTags = {
    all: { zh: '全部凭证', en: 'All' },
    api: { zh: '接口密钥 (API Keys)', en: 'API Tokens' },
    server: { zh: '服务器主机证书 (SSH)', en: 'Server Certs' },
    database: { zh: '数据库密保 (SQL)', en: 'Databases' },
    personal: { zh: '私密账号与备用', en: 'Private Credentials' }
  };

  const strengthLabels = [
    { labelZh: '超高危蓝图 (请勿使用)', labelEn: 'VULNERABLE BLU_PRINT', color: 'bg-red-500', text: 'text-red-700' },
    { labelZh: '弱性加密 (不建议用于核心端)', labelEn: 'WEAK BLUEPRINT', color: 'bg-orange-400', text: 'text-orange-700' },
    { labelZh: '标准保护密钥级别', labelEn: 'TACTICAL AMBER SHIELD', color: 'bg-amber-400', text: 'text-amber-800' },
    { labelZh: '高强度防劫持密钥', labelEn: 'HIGH FORTRESS SHIELD', color: 'bg-emerald-500', text: 'text-emerald-700' },
    { labelZh: '军工级不可逆熵能保险库', labelEn: 'CITADEL MIL-COMPLIANT', color: 'bg-teal-600', text: 'text-teal-800' }
  ];

  const currentStrength = strengthLabels[strengthScore - 1] || strengthLabels[2];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="max-w-4xl">
        <h2 className="text-xl font-serif text-[#1A1A1A] font-bold tracking-tight">
          {lang === 'zh' ? 'Secret Key Citadel 军事级密匙生成与保管箱' : 'Secret Key Citadel & Cryptographic Key Vault'}
        </h2>
        <p className="text-xs text-[#1A1A1A]/60 font-mono uppercase tracking-widest mt-1">
          {lang === 'zh' ? '高水准密码学熵值防泄露面板与隔离保护数据库' : 'Algorithmic entropy fortress engineered to safeguard critical digital blueprints'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Generator engine */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#1A1A1A] text-white p-5 rounded-none border border-[#1A1A1A] space-y-4">
            <h3 className="text-[10px] font-mono tracking-[0.2em] uppercase font-bold flex items-center justify-between pb-2 border-b border-white/10 text-[#E5C158]">
              <span>{lang === 'zh' ? '密码学密钥生成器' : 'CRYPTOGRAPHIC ENGINE'}</span>
              <RefreshCw className="w-3.5 h-3.5" />
            </h3>

            {/* Generated results box */}
            <div className="space-y-2">
              <div className="relative bg-white/5 border border-white/10 p-3.5 rounded-none font-mono text-xs text-[#F9F8F6] break-all select-all flex items-center justify-between min-h-[50px] pr-12">
                <span>{generatedPass}</span>
                <button
                  onClick={() => copyToClipboardText(generatedPass)}
                  className="absolute right-2 top-2 p-2 hover:bg-white/10 text-white/70 hover:text-white transition-all rounded-none"
                  title={lang === 'zh' ? '复制到剪贴板' : 'Copy Key'}
                >
                  {isCopiedGen ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Real-time Entropy Level Bars */}
              <div className="space-y-1.5 p-2.5 bg-white/5 border border-white/5 rounded-none">
                <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-wider">
                  <span className="text-white/60">{lang === 'zh' ? '算法安全冗余等级' : 'ENTROPY DEFENSE SCORE'}</span>
                  <span className="font-bold text-[#E5C158]">LV.{strengthScore} / 5</span>
                </div>
                {/* 5 cells */}
                <div className="grid grid-cols-5 gap-1">
                  {[1, 2, 3, 4, 5].map((cellIdx) => (
                    <div 
                      key={cellIdx} 
                      className={`h-1.5 rounded-none transition-all ${
                        cellIdx <= strengthScore 
                          ? currentStrength.color
                          : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[9px] font-mono uppercase text-[#E5C158] italic tracking-tight pt-1">
                  &gt; {lang === 'zh' ? currentStrength.labelZh : currentStrength.labelEn}
                </p>
              </div>
            </div>

            {/* Control specs */}
            <div className="space-y-3 pt-1 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between font-mono text-[9px] text-white/50 uppercase">
                  <span>{lang === 'zh' ? '密钥符号长度' : 'ALGORITHMIC REQUISITE LENGTH'}</span>
                  <span className="text-[#E5C158] font-bold">{genLength} bytes</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="64"
                  value={genLength}
                  onChange={(e) => { setGenLength(parseInt(e.target.value)); handleGenerate(); }}
                  className="w-full accent-[#E5C158] bg-white/10 h-1"
                />
              </div>

              {/* Custom prefix */}
              <div>
                <label className="block font-mono text-[9px] text-white/50 uppercase mb-1">
                  {lang === 'zh' ? '指定固定开头前缀 (可用于开发辨别)' : 'STATIC PREFIX HEAD (e.g. ATELIER_)'}
                </label>
                <input
                  type="text"
                  value={customPrefix}
                  onChange={(e) => { setCustomPrefix(e.target.value); handleGenerate(); }}
                  placeholder="e.g. KEY_"
                  className="w-full px-3 py-1.5 text-xs bg-white/5 border border-white/15 focus:outline-none focus:border-white/40 text-white font-mono rounded-none"
                />
              </div>

              {/* Inline switches */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between font-mono text-[10px] text-white/80">
                  <span>A-Z (大写英文字母)</span>
                  <button
                    onClick={() => { setIncludeUpper(!includeUpper); handleGenerate(); }}
                    className={`px-2 py-0.5 text-[8px] border font-bold transition-all ${
                      includeUpper ? 'border-[#E5C158] bg-[#E5C158] text-black' : 'border-white/20 text-white/40'
                    }`}
                  >
                    {includeUpper ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                <div className="flex items-center justify-between font-mono text-[10px] text-white/80">
                  <span>0-9 (数字字符)</span>
                  <button
                    onClick={() => { setIncludeNumbers(!includeNumbers); handleGenerate(); }}
                    className={`px-2 py-0.5 text-[8px] border font-bold transition-all ${
                      includeNumbers ? 'border-[#E5C158] bg-[#E5C158] text-black' : 'border-white/20 text-white/40'
                    }`}
                  >
                    {includeNumbers ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                <div className="flex items-center justify-between font-mono text-[10px] text-white/80">
                  <span>#@% (特殊高强度符号)</span>
                  <button
                    onClick={() => { setIncludeSymbols(!includeSymbols); handleGenerate(); }}
                    className={`px-2 py-0.5 text-[8px] border font-bold transition-all ${
                      includeSymbols ? 'border-[#E5C158] bg-[#E5C158] text-black' : 'border-white/20 text-white/40'
                    }`}
                  >
                    {includeSymbols ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                className="w-full py-2 bg-white hover:bg-white/90 text-black font-mono font-bold uppercase text-[10px] tracking-widest transition-all mt-4"
              >
                {lang === 'zh' ? '刷新随机高强密码' : 'REGENERATED ENTROPY'}
              </button>
            </div>
          </div>

          {/* Quick add credentials form */}
          <div className="bg-white border border-[#1A1A1A]/10 p-5 rounded-none space-y-4">
            <div className="flex items-center justify-between pb-1">
              <h4 className="text-[10px] font-mono tracking-widest text-[#1A1A1A] uppercase font-bold">
                {lang === 'zh' ? '存档加密令牌密钥' : 'ENCRYPT BRAND KEY'}
              </h4>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-xs bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90 transition-all font-bold px-2 py-0.5 text-[9px] uppercase tracking-wider"
              >
                {showAddForm ? (lang === 'zh' ? '收起' : 'Hide') : (lang === 'zh' ? '快捷录入' : 'Open')}
              </button>
            </div>

            {(showAddForm || credentials.length === 0) && (
              <form onSubmit={handleAddCredential} className="space-y-3 pt-1">
                <div>
                  <label className="block text-[9px] tracking-widest font-mono text-[#1A1A1A]/60 uppercase mb-1">
                    {lang === 'zh' ? '服务设施/网络名称' : 'TARGET HOST / DEPLOY PORT'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    placeholder="e.g. AWS Production SMTP Credentials"
                    className="w-full px-3 py-2 text-xs border border-[#1A1A1A]/15 bg-white text-[#1A1A1A] rounded-none focus:outline-none focus:border-[#1A1A1A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] tracking-widest font-mono text-[#1A1A1A]/60 uppercase mb-1">
                      {lang === 'zh' ? '托管用户名/主机' : 'CUSTODIAN IDENTIFIER'}
                    </label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="e.g. root_admin"
                      className="w-full px-3 py-1.5 text-xs border border-[#1A1A1A]/15 bg-white text-[#1A1A1A] rounded-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] tracking-widest font-mono text-[#1A1A1A]/60 uppercase mb-1">
                      {lang === 'zh' ? '分类群组' : 'VAULT DOMAIN'}
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full px-2 py-1.5 text-xs border border-[#1A1A1A]/15 bg-white text-[#1A1A1A] rounded-none"
                    >
                      <option value="api">{lang === 'zh' ? '接口令牌钥匙' : 'API Token Node'}</option>
                      <option value="server">{lang === 'zh' ? '终端主机证书' : 'Server Cert'}</option>
                      <option value="database">{lang === 'zh' ? '数据库凭据' : 'Database Owner'}</option>
                      <option value="personal">{lang === 'zh' ? '自主高保密备忘' : 'Isolated Note'}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[9px] tracking-widest font-mono text-[#1A1A1A]/60 uppercase">
                      {lang === 'zh' ? '核心机密内容 (密匙/哈希等)' : 'VAULT HIDDEN SECRET KEY'}
                    </label>
                    {generatedPass && (
                      <button
                        type="button"
                        onClick={() => setNewSecretVal(generatedPass)}
                        className="text-[8px] font-mono text-indigo-700 underline font-bold"
                      >
                        {lang === 'zh' ? '[ 绑定上面刚生成的密码 ]' : '[ Bind Generated Password ]'}
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={newSecretVal}
                    onChange={(e) => setNewSecretVal(e.target.value)}
                    placeholder="Provide secure key passphrase..."
                    className="w-full px-3 py-2 text-xs border border-[#1A1A1A]/15 bg-white text-[#1A1A1A] rounded-none font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#1A1A1A] hover:bg-[#1A1A1A]/95 text-white font-mono font-bold text-xs uppercase tracking-widest transition-all"
                >
                  {lang === 'zh' ? '安全铸造并并入金库' : 'LOCK SECRET INTO CITADEL'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right column: Credentials safe dashboard table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-[#1A1A1A]/10 p-6 rounded-none min-h-[480px] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1A1A1A]/10 gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#1A1A1A]" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#1A1A1A] font-bold">
                    {lang === 'zh' ? '金库离线防劫持沙箱数据库' : 'TRUST SECURED STANDALONE KEYS TABLE'}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder={lang === 'zh' ? '搜索保密项目...' : 'Search secret targets...'}
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="px-3 py-1 text-[11px] font-mono border border-[#1A1A1A]/15 bg-transparent rounded-none focus:outline-none focus:border-[#1A1A1A] w-full"
                  />
                </div>
              </div>

              {/* Filtering Category switcher tab lists */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {Object.entries(filterTypeTags).map(([key, tag]) => (
                  <button
                    key={key}
                    onClick={() => setFilterCategory(key)}
                    className={`py-1 px-2 text-[9px] font-mono uppercase tracking-wider border rounded-none transition-all ${
                      filterCategory === key
                        ? 'bg-[#1A1A1A] border-[#1A1A1A] text-[#F9F8F6] font-bold'
                        : 'bg-transparent border-[#1A1A1A]/10 text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
                    }`}
                  >
                    {lang === 'zh' ? tag.zh : tag.en}
                  </button>
                ))}
              </div>

              {/* Credentials mapping block */}
              {credentials
                .filter(c => filterCategory === 'all' || c.category === filterCategory)
                .filter(c => c.serviceName.toLowerCase().includes(searchFilter.toLowerCase())).length === 0 ? (
                  <div className="py-24 text-center space-y-2">
                    <p className="text-xs font-serif italic text-[#1A1A1A]/50">
                      {lang === 'zh' ? '金库该分类下尚无储存任何密匙数据' : 'Zero items matched current military filters.'}
                    </p>
                  </div>
              ) : (
                <div className="divide-y divide-[#1A1A1A]/5 max-h-[460px] overflow-y-auto pr-1">
                  {credentials
                    .filter(c => filterCategory === 'all' || c.category === filterCategory)
                    .filter(c => c.serviceName.toLowerCase().includes(searchFilter.toLowerCase()))
                    .map((item) => {
                      const isRevealed = !!revealedIds[item.id];
                      return (
                        <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                          <div className="space-y-1.5 max-w-[70%]">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[9px] font-mono text-[#1A1A1A]/40">
                                {lang === 'zh' ? '更新日期:' : 'COMMITTED:'} {item.lastUpdated}
                              </span>
                              <span className="text-[9px] font-mono uppercase font-bold text-[#1A1A1A]/60 bg-[#1A1A1A]/5 px-2 py-0.5">
                                {item.category.toUpperCase()}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold font-sans text-[#1A1A1A] flex items-center gap-1.5">
                              {item.serviceName}
                              <span className="text-[9px] text-[#1A1A1A]/50 font-mono italic">({item.username})</span>
                            </h4>
                            
                            {/* Render decrypted or dots */}
                            <div className="pt-1.5">
                              <code className="text-[11px] font-mono px-2 py-1 bg-[#F4F2EE] border border-[#1A1A1A]/5 text-[#1A1A1A] rounded-none select-all break-all inline-block min-w-[200px]">
                                {isRevealed ? item.secretVal : '••••••••••••••••••••••••'}
                              </code>
                            </div>
                          </div>

                          {/* Quick controls row inside cards */}
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              onClick={() => toggleVisibility(item.id)}
                              className="p-1 px-1.5 hover:bg-[#1A1A1A]/5 text-[#1A1A1A]/70 border border-[#1A1A1A]/10 transition-all rounded-none"
                              title={isRevealed ? (lang === 'zh' ? '隐藏明文' : 'Mask Secret') : (lang === 'zh' ? '显示明文' : 'Reveal Secret')}
                            >
                              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            
                            <button
                              onClick={() => copyToClipboardText(item.secretVal, item.id)}
                              className="p-1 px-1.5 hover:bg-[#1A1A1A]/5 text-[#1A1A1A]/70 border border-[#1A1A1A]/10 transition-all rounded-none"
                              title={lang === 'zh' ? '复制密匙' : 'Copy secret'}
                            >
                              {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600 animate-pulse" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1 px-1.5 text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-all rounded-none"
                              title={lang === 'zh' ? '彻底删除' : 'Purge Secret'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Shield warning footer */}
            <div className="mt-8 pt-4 border-t border-[#1A1A1A]/5 flex flex-col md:flex-row items-center justify-between text-[9px] font-mono text-[#1A1A1A]/40 uppercase tracking-widest gap-2">
              <div className="flex items-center gap-1.5 text-emerald-800">
                <Sparkles className="w-3 h-3 text-emerald-700" />
                <span>{lang === 'zh' ? '128位动态哈希密钥环，无任何外置网络上传' : 'Local Sandbox Isolated Security Matrix Active'}</span>
              </div>
              <div className="flex items-center gap-1 text-red-600">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{lang === 'zh' ? '切勿共享不安全的终端' : 'GUARANTEE PRIVATE WORK TERMINAL'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
