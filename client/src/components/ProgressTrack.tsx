import { useNavigate } from 'react-router-dom';
import {
  BACKGROUND_STEPS,
  CORE_STEPS,
  TOTAL_STEPS,
  stepIndexOf,
  type StepDef,
} from '../config/flow.steps';
import { ariaValueText, segmentState } from '../lib/progress';

/**
 * 14 段分两组（核心 11 + 背景 3），组间 gap 8px 是唯一的分组信号（UIUX §4.1.2）。
 * 背景组未答段用 --color-border-subtle，比核心组的 --color-border-strong 更淡 ——
 * 这是「结果前置」生效的必要条件，不是装饰（AC-04）。
 */
export function ProgressTrack({ current }: { current: StepDef }) {
  const navigate = useNavigate();
  const currentIndex = stepIndexOf(current);

  const renderGroup = (group: readonly StepDef[]) => (
    <div
      className="flex items-center gap-hair"
      style={{ flexGrow: group.length, flexBasis: 0, minWidth: 0 }}
    >
      {group.map((step) => {
        const state = segmentState(step, currentIndex);
        const done = state === 'done';
        const isCurrent = state === 'current';
        const isBackground = step.group === 'background';

        const fill = isCurrent
          ? 'bg-accent opacity-30'
          : done
            ? isBackground
              ? 'bg-accent opacity-50'
              : 'bg-accent'
            : isBackground
              ? 'bg-line-subtle'
              : 'bg-line-strong';

        // 当前段抬到 4px 用负 margin 抵消，避免撑高布局；已答段扩热区到 32px。
        const shape = isCurrent ? 'h-1 -my-px' : `h-hair${done ? ' py-md -my-md' : ''}`;

        return (
          <button
            key={step.id}
            type="button"
            disabled={!done}
            title={done ? `返回第 ${stepIndexOf(step) + 1} 步` : undefined}
            aria-label={done ? `返回第 ${stepIndexOf(step) + 1} 步` : undefined}
            onClick={() => done && navigate(step.route)}
            className={`min-w-0 flex-1 rounded-pill transition-colors duration-fast ease-standard ${fill} ${shape} ${
              done ? 'cursor-pointer' : 'cursor-default'
            }`}
          />
        );
      })}
    </div>
  );

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={TOTAL_STEPS}
      aria-valuenow={currentIndex + 1}
      aria-valuetext={ariaValueText(current)}
      className="flex w-full items-center"
      style={{ gap: 'var(--space-xs)' }}
    >
      {renderGroup(CORE_STEPS)}
      {BACKGROUND_STEPS.length > 0 ? renderGroup(BACKGROUND_STEPS) : null}
    </div>
  );
}
