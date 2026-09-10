/**
 * CSV 导出（ARCHITECTURE §3.9）：
 * - 强制 UTF-8 BOM，避免 Excel 打开中文乱码（坑 W10）
 * - CRLF 换行，Excel 友好
 * - 布尔量输出为 0/1，null 输出为空单元格，数组输出为 | 分隔
 */

export type CsvValue = string | number | boolean | null | undefined;

const BOM = '\uFEFF';

function escapeCell(value: CsvValue): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? '1' : '0';
  const text = typeof value === 'number' ? String(value) : value;
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(columns: readonly string[], rows: readonly Record<string, CsvValue>[]): string {
  const lines: string[] = [columns.map(escapeCell).join(',')];
  for (const row of rows) {
    const cells = columns.map((column) => escapeCell(row[column]));
    lines.push(cells.join(','));
  }
  return `${BOM}${lines.join('\r\n')}\r\n`;
}
