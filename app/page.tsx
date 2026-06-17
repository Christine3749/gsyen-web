/**
 * app/page.tsx — SSR 入口（Server Component）
 *
 * 核心流程：
 *   1. 服务端读 gsyen_rt cookie
 *   2. 向 gsyen-api 换取用户信息（网络请求在服务器上发生，不阻塞浏览器）
 *   3. 将 initialUser 注入 ClientRoot
 *   4. 浏览器收到 HTML 时用户已在页面里 → 零 flash
 *
 * 对比 SPA：SPA 需要先渲染空壳，JS 加载后再发网络请求，最快也要 200-500ms 才显示用户信息。
 */
import { getServerUser } from '../src/auth/getServerUser';
import ClientRoot from '../src/components/ClientRoot';

// 不缓存此页面，每次请求都要最新 session 状态
export const dynamic = 'force-dynamic';

export default async function Page() {
  const user = await getServerUser();
  return <ClientRoot initialUser={user} />;
}
