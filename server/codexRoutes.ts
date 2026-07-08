import { getCodexBridgeHealth, startCodexDeviceLogin } from './codexBridge';
import { warmCodexAppServer } from './codexAppServer';

export function registerCodexRoutes(app: any) {
  app.get('/api/codex/health', async (_req: any, res: any) => {
    const result = await getCodexBridgeHealth();
    if (result.available) warmCodexAppServer();
    return res.json(result);
  });

  app.post('/api/codex/login/start', async (_req: any, res: any) => {
    const result = await startCodexDeviceLogin();
    if (!result.started) {
      return res.status(503).json(result);
    }
    warmCodexAppServer();
    return res.json(result);
  });
}
