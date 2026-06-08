import { EmailItem } from '../types/mail';

export const CONTACTS = [
  { name: 'Atelier Sentinel Security Hub',   email: 'sentinel@citadel.atelier' },
  { name: 'Royal Crown Jewelers Co.',         email: 'contact@royaljewelers.com' },
  { name: 'Atelier Finance Comptroller',      email: 'audits@ledger.atelier' },
  { name: 'Adobe Design Fonts Team',          email: 'updates@fonts-adobe.com' },
  { name: 'Switzerland Design Guild',         email: 'swiss-guild@designers.ch' },
  { name: 'Atelier Administrative Terminal', email: 'alexander@atelier.internal' },
];

export function getDefaultEmails(lang: 'zh' | 'en'): EmailItem[] {
  const zh = lang === 'zh';
  return [
    {
      id: 'm1', senderName: 'Atelier Sentinel Security Hub', senderAddress: 'sentinel@citadel.atelier',
      subject: zh ? '【安全警报】主控安全组 TLS 1.3 密码套件升级确认' : '【Citadel Sec】TLS 1.3 Cipher Suite Upgrade Completed',
      snippet: zh ? '我们在15:04对本地多端隔离哈希金库主密钥链环进行了自动熵增加固。' : 'We have successfully hardened the master entropy database credentials.',
      body: zh
        ? '尊敬的管理员：\n\n安全主网络已自动轮换 PGP/SSL 密钥并升级到 TLS 1.3。所有本地静态账目、日程表和密码本已进行二次哈希保护。不需要进一步行动。\n\n安全等级：军工级。\n\n—— Atelier 联合防卫中心'
        : 'Dear Atelier Custodian,\n\nThe system completed a rotating cryptographic pass to update Master PGP and SSL certificates. No manual action is required.\n\nDefense Status: Citadel Certified.\n\nAtelier Network Guard',
      date: '2026-05-26', time: '06:45', starred: true, important: true, read: false,
      folder: 'inbox', category: 'primary',
      threadMessages: [{ id: 'm1_msg1', senderName: 'Atelier Sentinel Security Hub', senderAddress: 'sentinel@citadel.atelier', body: zh ? '主控安全组 TLS 1.3 密码套件升级确认' : 'TLS 1.3 Cipher Suite Upgrade Completed', date: '2026-05-26', time: '06:45', isMe: false }],
    },
    {
      id: 'm2', senderName: 'Royal Crown Jewelers Co.', senderAddress: 'contact@royaljewelers.com',
      subject: zh ? '设计反馈：第二期部族贵金属加冕王冠纹章雕刻标识满意度确认' : 'Design Feedback: Phase 2 Mid-century Crown Crest Emblem',
      snippet: zh ? '亚历山大：对你们工作室这次提交的纯正矢量重构图形极为惊艳。' : 'Alexander, we are profoundly amazed by the geometry precision.',
      body: zh
        ? 'Alexander Sterling 阁下：\n\n在550g/㎡德国原浆棉纸压印测试中，标识边缘锐度均超出预期。微字距排版极其高雅。我们已向贵公司账目汇入款项。\n\n总裁及首席策略官 亲笔'
        : 'Alexander Sterling,\n\nOur publishing press completed testing the 1.5x stroke weight emblem on 550g German cotton paper. The rendering is absolute perfection.\n\nOur fiscal entity has disbursed the design commissioning balance.\n\nRoyal Crown executive committee',
      date: '2026-05-25', time: '11:20', starred: false, important: true, read: true,
      folder: 'inbox', category: 'social',
      threadMessages: [{ id: 'm2_msg1', senderName: 'Royal Crown Jewelers Co.', senderAddress: 'contact@royaljewelers.com', body: zh ? '设计反馈：第二期加冕王冠纹章雕刻标识满意度确认' : 'Design Feedback: Phase 2 Crown Crest Emblem', date: '2026-05-25', time: '11:20', isMe: false }],
    },
    {
      id: 'm3', senderName: 'Atelier Finance Comptroller', senderAddress: 'audits@ledger.atelier',
      subject: zh ? '财务快报：季度授权版税收入划拨入账通知书' : 'Fiscal Statement: Q1 Royalty Revenue Reconciliation',
      snippet: zh ? '来自瑞士设计联盟的4500.00美元授权版税已被记入复式账簿' : 'Licensing royalties (SVG assets) have cleared processing checkpoints.',
      body: zh
        ? '设计工坊的合伙人：\n\n本季度外部版税（4,500.00 USD）已安全结算并登账。此项目在账簿分类属于"royalty"。建议检查本季度开支规划。\n\n资深审计官员'
        : 'Dear Partners,\n\nExternal licensing royalties (4,500.00 USD) have cleared international banking in full.\n\nThis is categorized as a "royalty" asset.\n\nAtelier Finance Custodian',
      date: '2026-05-24', time: '09:00', starred: true, important: false, read: true,
      folder: 'inbox', category: 'promotions',
      threadMessages: [{ id: 'm3_msg1', senderName: 'Atelier Finance Comptroller', senderAddress: 'audits@ledger.atelier', body: zh ? '季度授权版税收入划拨入账通知书' : 'Q1 Royalty Revenue Reconciliation', date: '2026-05-24', time: '09:00', isMe: false }],
    },
    {
      id: 'm4', senderName: 'Switzerland Design Guild', senderAddress: 'swiss-guild@designers.ch',
      subject: zh ? '【行业动态】瑞士创意工坊巡礼：微徽章矢量化趋势探讨' : '【Industry】Swiss Atelier Tour: Vectorization Trends in Micro-Badges',
      snippet: zh ? '极简主义风潮下，矢量徽章正在重新定义高端商品的实体外包装。' : 'Under minimalism, vector badge geometry is redefining luxury goods containers.',
      body: zh
        ? '各位创意工坊同仁：\n\n近期苏黎世设计展会证实，高密字间距配合粗实线的圆形和六边形框线备受美学界赞誉。欢迎大家将设计成品分享至行会评测库。'
        : 'Dear Guild Members,\n\nRecent conventions in Zurich highlight how tight tracking typography with solid geometric outlines are claiming dominant luxury presence.',
      date: '2026-05-22', time: '14:15', starred: false, important: false, read: true,
      folder: 'inbox', category: 'social',
      threadMessages: [{ id: 'm4_msg1', senderName: 'Switzerland Design Guild', senderAddress: 'swiss-guild@designers.ch', body: zh ? '微徽章矢量化趋势探讨' : 'Vectorization Trends in Micro-Badges', date: '2026-05-22', time: '14:15', isMe: false }],
    },
    {
      id: 'm5', senderName: 'Adobe Design Fonts Team', senderAddress: 'updates@fonts-adobe.com',
      subject: zh ? '【字体授权】Atelier Suite 独家专业排版字体包更新通知' : 'Exclusive Studio Typefaces Package Update Notification',
      snippet: zh ? '新版本已集成 Cinzel Decorative 以及 Outfit 黑体优化包。' : 'Adobe Type Services deployed optimizations for Outfit Sans and Cinzel Display.',
      body: zh
        ? '尊敬的亚历山大：\n\nAdobe Fonts 已对您的系统订阅账户授权更新。我们针对高分辨率电子纸渲染完成了专门的子像素抗锯齿微调。感谢您采用正版授权。'
        : 'Dear Alexander,\n\nAdobe Type library completed an exclusive service patch for your certified studio environment. Anti-aliasing configurations have been tailored for high-DPI rendering.',
      date: '2026-05-18', time: '10:02', starred: false, important: false, read: true,
      folder: 'inbox', category: 'updates',
      threadMessages: [{ id: 'm5_msg1', senderName: 'Adobe Design Fonts Team', senderAddress: 'updates@fonts-adobe.com', body: zh ? '独家专业排版字体包更新通知' : 'Exclusive Studio Typefaces Package Update', date: '2026-05-18', time: '10:02', isMe: false }],
    },
  ];
}
