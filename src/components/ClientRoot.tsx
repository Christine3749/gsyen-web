'use client';

/**
 * ClientRoot — SSR 与 SPA 的桥接层。
 *
 * app/page.tsx（Server Component）将服务端读取的用户数据注入此处。
 * ClientRoot 将 initialUser 写入 useAuth 单例，让 React 首次渲染时
 * 就能拿到真实用户，而非依赖 localStorage 快照或网络请求。
 *
 * TODO（迁移阶段）：
 *   1. 将 initialUser 写入 useAuth 的 _store（替换 snapshot 机制）
 *   2. 逐步将各模块从 App.tsx 迁移到 app/[module]/page.tsx
 */

import App from '../App';
import { hydrateAuthFromServer } from '../auth/useAuth';
import type { ServerUser } from '../auth/getServerUser';

interface Props {
  initialUser: ServerUser | null;
}

export default function ClientRoot({ initialUser }: Props) {
  // 将服务端 user 写入单例，在任何 useEffect 之前执行（模块求值阶段）
  hydrateAuthFromServer(initialUser);
  return <App />;
}
