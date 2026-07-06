export type ShellPlatform = 'mac' | 'windows' | 'web';

export function getShellPlatform(): {
  isElectron: boolean;
  isMac: boolean;
  isWeb: boolean;
  isWindows: boolean;
  platform: ShellPlatform;
  rawPlatform?: string;
} {
  const api = (window as any).electronAPI;
  const rawPlatform = api?.platform as string | undefined;
  const platform: ShellPlatform = rawPlatform === 'darwin'
    ? 'mac'
    : rawPlatform === 'win32'
      ? 'windows'
      : 'web';

  return {
    isElectron: !!api?.isElectron,
    isMac: platform === 'mac',
    isWeb: platform === 'web',
    isWindows: platform === 'windows',
    platform,
    rawPlatform,
  };
}

export function useShellPlatform() {
  return getShellPlatform();
}
