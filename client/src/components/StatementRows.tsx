import type { KeyboardEvent } from 'react';

export interface StatementChoice {
  value: string;
  label: string;
  marker: string;
}

interface StatementRowsProps {
  name: string;
  value: string | undefined;
  choices: readonly StatementChoice[];
  onChange: (value: string) => void;
  labelledBy: string;
}

/**
 * S1 专用：纵向三行陈述 + 序号 A/B/C（UIUX §4.4.2 / AC-05）。
 * 绝不可渲染成 5 格等距量表 —— S1 是分类题不是程度题，
 * 一旦像 Likert，被试会按「从少到多」的程度轴作答，直接污染这个调节变量。
 * 键盘映射用 A/B/C 而不是 1/2/3，同样是为了切断「数字 = 程度」的联想。
 */
export function StatementRows({
  name,
  value,
  choices,
  onChange,
  labelledBy,
}: StatementRowsProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const hit = choices.find((c) => c.marker.toLowerCase() === event.key.toLowerCase());
    if (hit) {
      event.preventDefault();
      onChange(hit.value);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      onKeyDown={onKeyDown}
      className="flex flex-col gap-hair overflow-hidden rounded-md border border-line bg-page"
    >
      {choices.map((choice) => {
        const selected = value === choice.value;
        return (
          <label
            key={choice.value}
            className={[
              'relative grid min-h-16 cursor-pointer items-center gap-sm px-md py-sm transition-colors duration-fast ease-standard',
              selected ? 'bg-accent-subtle text-accent' : 'bg-surface text-ink hover:bg-sunken',
            ].join(' ')}
            style={{ gridTemplateColumns: '24px 1fr' }}
          >
            <input
              type="radio"
              name={name}
              value={choice.value}
              checked={selected}
              onChange={() => onChange(choice.value)}
              className="peer sr-only-input"
            />
            <span
              aria-hidden
              className="segment-focus pointer-events-none absolute inset-0 opacity-0 peer-focus-visible:opacity-100"
            />
            <span
              className={[
                'flex h-6 w-6 items-center justify-center rounded-pill border font-mono text-xs',
                selected
                  ? 'border-accent bg-accent text-ink-onAccent'
                  : 'border-line-strong text-ink-tertiary',
              ].join(' ')}
            >
              {choice.marker}
            </span>
            <span
              className={[
                'overflow-wrap-break-word text-base',
                selected ? 'font-announce text-accent' : 'text-ink',
              ].join(' ')}
            >
              {choice.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}
