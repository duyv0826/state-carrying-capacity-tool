import type { KeyboardEvent } from 'react';
import { LIKERT_LABELS, LIKERT_MAX, LIKERT_MIN } from '../config/questions';

interface LikertScaleProps {
  /** 题号 key，用作 radio group 的 name */
  name: string;
  value: number | undefined;
  onChange: (value: number) => void;
  labelledBy: string;
  /** 「第 3 / 9 题」之外的作答提示由调用方给，这里只管量表本体 */
  disabled?: boolean;
}

const POINTS = Array.from({ length: LIKERT_MAX - LIKERT_MIN + 1 }, (_, i) => LIKERT_MIN + i);

/**
 * 5 点 Likert = 全标注分段按钮组（UIUX §4.1.3）。
 * 方向恒定：不符合在左、符合在右，反向题也绝不翻转呈现顺序（呈现翻转会直接污染作答）。
 * 桌面横向 5 格等宽；<640px 转纵向 5 行，行高 48px。
 */
export function LikertScale({ name, value, onChange, labelledBy, disabled }: LikertScaleProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const index = POINTS.indexOf(Number(event.key));
    // 数字键 1-5 直选且不跳页（防误触导致数据污染）
    if (index >= 0 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      onChange(POINTS[index]);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      onKeyDown={onKeyDown}
      className="flex flex-col gap-hair overflow-hidden rounded-md border border-line bg-page sm:flex-row"
    >
      {POINTS.map((point) => {
        const selected = value === point;
        const label = LIKERT_LABELS[point - LIKERT_MIN];
        return (
          <label
            key={point}
            className={[
              'relative flex h-12 cursor-pointer items-center gap-sm px-md transition-colors duration-fast ease-standard',
              'sm:h-14 sm:min-w-[88px] sm:flex-1 sm:flex-col sm:justify-center sm:gap-2xs sm:px-xs',
              selected
                ? 'bg-accent-subtle text-accent sm:bg-accent sm:text-ink-onAccent'
                : 'bg-surface text-ink-secondary sm:hover:bg-sunken',
              disabled ? 'cursor-not-allowed' : '',
            ].join(' ')}
          >
            <input
              type="radio"
              name={name}
              value={point}
              checked={selected}
              disabled={disabled}
              onChange={() => onChange(point)}
              className="peer sr-only-input"
            />
            <span
              aria-hidden
              className="segment-focus pointer-events-none absolute inset-0 opacity-0 peer-focus-visible:opacity-100"
            />
            <span
              className={[
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-pill border font-mono text-xs tabular',
                'sm:h-auto sm:w-auto sm:border-0 sm:bg-transparent sm:rounded-none',
                selected
                  ? 'border-accent bg-accent text-ink-onAccent sm:bg-transparent sm:text-inherit'
                  : 'border-line-strong text-ink-tertiary sm:text-inherit',
              ].join(' ')}
            >
              {point}
            </span>
            <span
              className={
                selected
                  ? 'text-base font-emphasis sm:text-sm sm:font-emphasis'
                  : 'text-base sm:text-sm sm:font-emphasis'
              }
            >
              {label}
            </span>
          </label>
        );
      })}
    </div>
  );
}
