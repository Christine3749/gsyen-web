/**
 * PNG → ICO 转换脚本
 * 用法: node scripts/make-ico.mjs
 * 依赖: sharp（devDependencies 已有）
 */
import sharp from 'sharp';
import { execSync } from 'child_process';
import { writeFileSync, readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src  = join(root, 'public', 'icon.png');
const out  = join(root, 'public', 'icon.ico');
const tmp  = join(root, 'public', 'icon-256.png');

// 1. 用 sharp 把原图调整为 256×256
await sharp(src).resize(256, 256).png().toFile(tmp);
console.log('✓ resized to 256×256');

// 2. 用 png-to-ico 转成 ico（包含 16/32/48/64/128/256 多尺寸）
const { default: pngToIco } = await import('png-to-ico');
const icoBuffer = await pngToIco([tmp]);
writeFileSync(out, icoBuffer);
console.log(`✓ saved ${out}`);

// 3. 删临时文件
import { unlinkSync } from 'fs';
try { unlinkSync(tmp); } catch {}
console.log('done. public/icon.ico ready.');
