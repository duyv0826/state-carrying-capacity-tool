import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'ghost' | 'quiet';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: Variant;
  loading?: boolean;
  busyLabel?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  full?: boolean;
  small?: boolean;
  children: ReactNode;
}

/**
 * 禁用态刻意不改 opacity（UIUX §4.1.5）：降透明度会让对比度不达标。
 */
export function Button({
  variant = 'primary',
  loading = false,
  busyLabel,
  icon,
  iconPosition = 'right',
  full = false,
  small = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-xs rounded-sm font-emphasis ' +
    'transition-colors duration-fast ease-standard ' +
    (small ? 'h-8 px-sm text-sm' : 'h-11 px-lg text-md') +
    (full ? ' w-full' : '');

  const look =
    variant === 'primary'
      ? 'bg-accent text-ink-onAccent hover:bg-accent-hover active:bg-accent-active'
      : variant === 'ghost'
        ? 'border border-line bg-transparent text-ink-secondary hover:bg-sunken'
        : 'text-ink-secondary hover:text-ink';

  const off = 'bg-sunken text-ink-tertiary border border-line cursor-not-allowed hover:bg-sunken';

  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${base} ${disabled || loading ? off : look} ${className}`}
      {...rest}
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" aria-hidden />
          {busyLabel ?? children}
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' ? icon : null}
          {children}
          {icon && iconPosition === 'right' ? icon : null}
        </>
      )}
    </button>
  );
}
