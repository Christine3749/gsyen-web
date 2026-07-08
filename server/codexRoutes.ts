import { startCodexDeviceLogin } from './codexBridge';

export function registerCodexRoutes(app: any) {
  app.post('/api/codex/login/start', async (_req: any, res: any) => {
    const result = await startCodexDeviceLogin();
    if (!result.started) {
      return res.status(503).json(result);
    }
    return res.json(result);
  });
}
