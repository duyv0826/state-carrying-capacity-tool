import { Moon, Sun } from 'lucide-react';
import { useSession } from '../store/session';

/** 三页共用 Header（UIUX §4.0）：高 56px，sticky，唯一允许的毛玻璃用例。 */
export function AppHeader() {
  const { theme, toggleTheme } = useSession();
  const next = theme === 'dark' ? '浅色模式' : '深色模式';

  return (
    <header className="app-header sticky top-0 z-10 border-b border-line-subtle">
      <div className="mx-auto flex h-full max-w-question items-center justify-between px-lg">
        <div className="flex min-w-0 items-center gap-sm">
          <span className="truncate text-sm font-emphasis tracking-small text-ink">
            状态承载量自测
          </span>
          <span className="hidden h-4 w-px bg-line sm:block" aria-hidden />
          <span className="hidden truncate text-xs text-ink-tertiary sm:block">
            澳门科技大学 · 互动媒体艺术
          </span>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`切换到${next}`}
          title={`切换到${next}`}
          className="flex h-11 w-11 items-center justify-center rounded-sm text-ink-secondary transition-colors duration-fast ease-standard hover:bg-sunken hover:text-ink"
        >
          {theme === 'dark' ? <Sun size={20} aria-hidden /> : <Moon size={20} aria-hidden />}
        </button>
      </div>
    </header>
  );
}
