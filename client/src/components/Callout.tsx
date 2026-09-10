import { AlertCircle, Info, ShieldCheck, X } from 'lucide-react';
import type { ReactNode } from 'react';

export type CalloutTone = 'neutral' | 'info' | 'warn' | 'error';

const TONE: Record<CalloutTone, { box: string; icon: string }> = {
  neutral: { box: 'bg-sunken border-line', icon: 'text-accent' },
  info: { box: 'bg-watch-subtle border-watch-border', icon: 'text-watch' },
  warn: { box: 'bg-watch-subtle border-watch-border', icon: 'text-watch' },
  error: { box: 'bg-high-subtle border-high-border', icon: 'text-high' },
};

interface CalloutProps {
  tone?: CalloutTone;
  icon?: 'info' | 'shield' | 'alert';
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

/** 内联提示块。刻意不用弹窗——UIUX §4.1.6 / §4.3.4 都点名「非弹窗」。 */
export function Callout({
  tone = 'neutral',
  icon = 'info',
  title,
  children,
  action,
  onDismiss,
  className = '',
}: CalloutProps) {
  const { box, icon: iconColor } = TONE[tone];
  const Glyph = icon === 'alert' ? AlertCircle : icon === 'shield' ? ShieldCheck : Info;
  return (
    <div className={`flex items-start gap-sm rounded-md border p-md ${box} ${className}`}>
      <Glyph size={16} className={`mt-2xs shrink-0 ${iconColor}`} aria-hidden />
      <div className="min-w-0 flex-1 text-sm leading-sm">
        {title ? <p className="font-announce text-ink">{title}</p> : null}
        <div className={title ? 'text-ink-secondary' : 'text-ink-secondary'}>{children}</div>
        {action ? <div className="mt-sm">{action}</div> : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="关闭提示"
          className="-m-2xs rounded-xs p-2xs text-ink-tertiary transition-colors duration-fast hover:text-ink"
        >
          <X size={16} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
