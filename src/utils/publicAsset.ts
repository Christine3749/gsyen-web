export function publicAsset(assetPath: string) {
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = assetPath.replace(/^\/+/, '');

  return `${normalizedBase}${normalizedPath}`;
}
