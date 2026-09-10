/**
 * 导出分享卡片：离屏 <canvas> 画 1080×1350 PNG。
 * 固定浅色主题（写死 tokens.css 的浅色 hex，不读当前深色模式变量）；
 * 主色墨蓝 #17557F，禁止 emoji、禁止紫粉渐变（AC-12 / P0）。
 */

export interface ShareCardOptions {
  softwareName: string;
  bandLabel: string;
  bandZone: string;
  total: number;
  normalized: number;
  factors: { label: string; mean: number }[];
  note?: string | null;
}

const W = 1080;
const H = 1350;

const INK = '#17557F'; // 主色 墨蓝
const DARK = '#1A2230'; // 墨色
const PAGE = '#FFFFFF'; // 页面
const SUB = '#5B6675'; // 次墨
const BORDER = '#E2E8F0'; // 边框

const FONT = '"Inter", "PingFang SC", "Microsoft YaHei", sans-serif';

export function exportShareCard(opts: ShareCardOptions): void {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 背景
  ctx.fillStyle = PAGE;
  ctx.fillRect(0, 0, W, H);

  // 顶部色条
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, 12);

  const M = 80;
  let y = 130;
  ctx.textAlign = 'left';

  // 标题
  ctx.fillStyle = SUB;
  ctx.font = `500 30px ${FONT}`;
  ctx.fillText('状态承载量自测', M, y);

  // 软件名
  y += 78;
  ctx.fillStyle = DARK;
  ctx.font = `600 54px ${FONT}`;
  ctx.fillText(truncate(ctx, opts.softwareName || '未命名软件', W - M * 2, 18), M, y);

  // 分隔线
  y += 88;
  ctx.fillStyle = BORDER;
  ctx.fillRect(M, y, W - M * 2, 2);

  // 档位标签
  y += 78;
  ctx.fillStyle = SUB;
  ctx.font = `500 30px ${FONT}`;
  ctx.fillText('状态承载量档位', M, y);

  y += 78;
  ctx.fillStyle = INK;
  ctx.font = `600 92px ${FONT}`;
  ctx.fillText(`${opts.bandLabel} · ${opts.bandZone}`, M, y);

  // 总分
  y += 120;
  ctx.fillStyle = SUB;
  ctx.font = `500 30px ${FONT}`;
  ctx.fillText('总分', M, y);
  ctx.fillStyle = DARK;
  ctx.font = `700 84px ${FONT}`;
  ctx.fillText(`${opts.total}`, M, y + 96);
  ctx.fillStyle = SUB;
  ctx.font = `500 32px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText(`满分 45 · 归一化 ${opts.normalized}%`, W - M, y + 96);
  ctx.textAlign = 'left';

  // 三因子
  y += 190;
  const gap = 40;
  const colW = (W - M * 2 - gap * 2) / 3;
  opts.factors.forEach((f, i) => {
    const x = M + i * (colW + gap);
    ctx.fillStyle = PAGE;
    ctx.fillRect(x, y, colW, 170);
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, colW, 170);
    ctx.fillStyle = SUB;
    ctx.font = `500 26px ${FONT}`;
    ctx.fillText(truncate(ctx, f.label, colW - 48, 9), x + 24, y + 52);
    ctx.fillStyle = INK;
    ctx.font = `600 58px ${FONT}`;
    ctx.fillText(f.mean.toFixed(1), x + 24, y + 132);
  });

  // 诚实说明
  if (opts.note) {
    y += 260;
    ctx.fillStyle = SUB;
    ctx.font = `400 26px ${FONT}`;
    wrapText(ctx, opts.note, M, y, W - M * 2, 40);
  }

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `状态承载量自测_${opts.softwareName || '结果'}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxChars: number): string {
  const safe = text.length > maxChars ? `${text.slice(0, maxChars)}…` : text;
  if (ctx.measureText(safe).width <= maxWidth) return safe;
  let out = safe;
  while (out.length > 1 && ctx.measureText(out).width > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out.slice(0, -1)}…`;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): void {
  const chars = Array.from(text);
  let line = '';
  let cy = y;
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = ch;
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
}
