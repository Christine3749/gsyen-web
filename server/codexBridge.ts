import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

interface CodexMessage {
  role: string;
  content: string;
}

interface CodexBridgeInput {
  messages: CodexMessage[];
  systemPrompt: string;
  domain?: string | null;
  chatGptModel?: string | null;
  timeoutMs?: number;
}

interface CodexCommandResult {
  code: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

interface CodexDeviceLogin {
  started: boolean;
  url?: string;
  code?: string;
  expiresInMinutes?: number;
  error?: string;
}

let activeLogin: ReturnType<typeof spawn> | null = null;

function codexCliCandidates(): string[] {
  const localAppData = process.env.LOCALAPPDATA;
  return [
    process.env.CODEX_CLI_PATH ?? '',
    configCodexCliPath(),
    localAppData ? path.join(localAppData, 'OpenAI', 'Codex', 'bin', 'codex.exe') : '',
  ].filter(Boolean);
}

function configCodexCliPath(): string {
  const home = process.env.USERPROFILE || process.env.HOME;
  if (!home) return '';
  const configPath = path.join(home, '.codex', 'config.toml');
  if (!existsSync(configPath)) return '';
  const text = readFileSync(configPath, 'utf8');
  const match = text.match(/CODEX_CLI_PATH\s*=\s*['"]([^'"]+)['"]/);
  return match?.[1] ?? '';
}

export function resolveCodexCliPath(): string | null {
  return codexCliCandidates().find(candidate => existsSync(candidate)) ?? null;
}

async function runCodexCommand(
  codexPath: string,
  args: string[],
  input = '',
  timeoutMs = 10_000,
): Promise<CodexCommandResult> {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const child = spawn(codexPath, args, {
      env: { ...process.env, NO_COLOR: '1' },
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);

    child.stdout.on('data', chunk => {
      stdout = `${stdout}${String(chunk)}`.slice(-4000);
    });
    child.stderr.on('data', chunk => {
      stderr = `${stderr}${String(chunk)}`.slice(-4000);
    });
    child.on('close', code => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr, timedOut });
    });

    if (input) child.stdin.write(input);
    child.stdin.end();
  });
}

export async function getCodexBridgeHealth(): Promise<{
  available: boolean;
  error?: string;
  authMode?: string;
}> {
  const codexPath = resolveCodexCliPath();
  if (!codexPath) return { available: false, error: 'CODEX CLI MISSING' };

  const status = await runCodexCommand(codexPath, [
    'login',
    'status',
    '-c', 'service_tier="flex"',
  ]);
  if (status.timedOut) return { available: false, error: 'CODEX LOGIN TIMEOUT' };
  if (status.code !== 0) return { available: false, error: 'CODEX LOGIN REQUIRED' };
  const statusText = `${status.stdout}\n${status.stderr}`;
  if (!/Logged in using ChatGPT/i.test(statusText)) {
    return { available: false, error: 'CHATGPT LOGIN REQUIRED' };
  }
  return { available: true, authMode: 'chatgpt' };
}

function stripAnsi(text: string): string {
  return text.replace(/\x1B\[[0-9;]*m/g, '');
}

function parseDeviceLogin(text: string): { url?: string; code?: string } {
  const clean = stripAnsi(text);
  const url = clean.match(/https:\/\/auth\.openai\.com\/codex\/device/)?.[0];
  const code = clean.match(/\b[A-Z0-9]{4}-[A-Z0-9]{5}\b/)?.[0];
  return { url, code };
}

export async function startCodexDeviceLogin(): Promise<CodexDeviceLogin> {
  const codexPath = resolveCodexCliPath();
  if (!codexPath) return { started: false, error: 'CODEX CLI MISSING' };

  activeLogin?.kill();
  const child = spawn(codexPath, [
    'login',
    '--device-auth',
    '-c', 'service_tier="flex"',
  ], {
    env: { ...process.env, NO_COLOR: '1' },
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  activeLogin = child;

  return new Promise((resolve) => {
    let done = false;
    let output = '';

    const finish = (result: CodexDeviceLogin) => {
      if (done) return;
      done = true;
      resolve(result);
    };

    const parse = () => {
      const { url, code } = parseDeviceLogin(output);
      if (url && code) {
        finish({ started: true, url, code, expiresInMinutes: 15 });
      }
    };

    child.stdout.on('data', chunk => {
      output = `${output}${String(chunk)}`.slice(-8000);
      parse();
    });
    child.stderr.on('data', chunk => {
      output = `${output}${String(chunk)}`.slice(-8000);
      parse();
    });
    child.on('close', code => {
      if (activeLogin === child) activeLogin = null;
      if (!done) finish({ started: false, error: `CODEX LOGIN EXIT ${code}` });
    });

    setTimeout(() => finish({ started: false, error: 'CODEX LOGIN CODE TIMEOUT' }), 10_000);
    setTimeout(() => {
      if (activeLogin === child) {
        child.kill();
        activeLogin = null;
      }
    }, 16 * 60_000);
  });
}

function roleLabel(role: string): string {
  if (role === 'model' || role === 'assistant') return 'ASSISTANT';
  if (role === 'system') return 'SYSTEM';
  return 'USER';
}

function buildPrompt({ messages, systemPrompt, domain, chatGptModel }: CodexBridgeInput): string {
  const transcript = messages
    .slice(-12)
    .map(m => `${roleLabel(m.role)}: ${m.content}`)
    .join('\n\n');

  return `你是 GSYEN 里的 CHATGPT 本地桥接模型。

请遵守：
- 只回答当前对话，不读取文件，不运行命令，不修改系统。
- 不要提到 Codex CLI、桥接、订阅、工具链，直接像缈缈一样回答用户。
- 这一路由暂时只做纯对话，不输出 JSON，不创建日程、邮件或账务动作。
- 中文默认简洁、稳、带一点审美判断；用户要求英文时再用英文。

GSYEN 基础系统规则：
${systemPrompt}

当前模块：${domain || 'MUSE'}
ChatGPT 模型：${chatGptModel || 'gpt-5-5'}

最近对话：
${transcript}

最终回复正文：`;
}

export async function runCodexBridge(input: CodexBridgeInput): Promise<string> {
  const codexPath = resolveCodexCliPath();
  if (!codexPath) throw new Error('CODEX CLI MISSING');
  const health = await getCodexBridgeHealth();
  if (!health.available) throw new Error(health.error || 'CODEX LOGIN REQUIRED');

  const workDir = await mkdtemp(path.join(tmpdir(), 'gsyen-codex-'));
  const outputFile = path.join(workDir, 'last-message.txt');
  const prompt = buildPrompt(input);
  const timeoutMs = input.timeoutMs ?? 120_000;

  try {
    const args = [
      'exec',
      '-c', 'service_tier="flex"',
      '--sandbox', 'read-only',
      '--ephemeral',
      '--skip-git-repo-check',
      '--cd', workDir,
      '--color', 'never',
      '-o', outputFile,
      '-',
    ];

    const { code, stderr, timedOut } = await runCodexCommand(codexPath, args, prompt, timeoutMs);

    if (timedOut) throw new Error('CODEX BRIDGE TIMEOUT');
    if (code !== 0) throw new Error(stderr.trim() || `CODEX EXIT ${code}`);

    const text = (await readFile(outputFile, 'utf8')).trim();
    return text || '我在，但这次没有生成有效回复。';
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
