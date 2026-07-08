import { getCodexBridgeHealth, startCodexDeviceLogin } from './codexBridge';

export function registerCodexRoutes(app: any) {
  app.get('/api/codex/health', async (_req: any, res: any) => {
    const result = await getCodexBridgeHealth();
    return res.json(result);
  });

  app.post('/api/codex/login/start', async (_req: any, res: any) => {
    const result = await startCodexDeviceLogin();
    if (!result.started) {
      return res.status(503).json(result);
    }
    return res.json(result);
  });
}
