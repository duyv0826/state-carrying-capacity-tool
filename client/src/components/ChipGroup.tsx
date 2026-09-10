import { Check } from 'lucide-react';

export interface ChipChoice {
  value: string;
  label: string;
}

interface ChipGroupProps {
  name: string;
  value: string | undefined;
  choices: readonly ChipChoice[];
  onChange: (value: string) => void;
  labelledBy: string;
  /** 选做题的 chip 比必答题矮 4px（UIUX §4.4.4） */
  small?: boolean;
}

/**
 * 分档事实题（S2 / S3 / S4）与选软件共用：横向 wrap 的 chip 单选组。
 * chip 暗示「从离散标签里挑一个」，与「在刻度轴上定位」的 Likert 隐喻刻意不同（§4.4.3）。
 */
export function ChipGroup({
  name,
  value,
  choices,
  onChange,
  labelledBy,
  small = false,
}: ChipGroupProps) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className="flex flex-wrap items-center gap-xs"
    >
      {choices.map((choice) => {
        const selected = value === choice.value;
        return (
          <label
            key={choice.value}
            className={[
              'inline-flex cursor-pointer items-center gap-2xs rounded-pill border transition-colors duration-fast ease-standard',
              small ? 'h-8 px-sm text-sm' : 'h-9 px-lg text-base sm:text-sm',
              selected
                ? 'border-accent bg-accent-subtle text-accent font-emphasis'
                : 'border-line bg-surface text-ink-secondary hover:bg-sunken',
            ].join(' ')}
          >
            <input
              type="radio"
              name={name}
              value={choice.value}
              checked={selected}
              onChange={() => onChange(choice.value)}
              className="peer sr-only-input"
            />
            <span className="relative">
              {choice.label}
              <span
                aria-hidden
                className="segment-focus pointer-events-none absolute -inset-1 rounded-pill opacity-0 peer-focus-visible:opacity-100"
              />
            </span>
            {selected ? <Check size={16} aria-hidden /> : null}
          </label>
        );
      })}
    </div>
  );
}
