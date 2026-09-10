import { useEffect, type ReactNode } from 'react';
import { useSession } from '../store/session';
import { stepIndexOf } from '../config/flow.steps';
import { SCHEMA_VERSION } from '../config/questions';
import { postAbandon } from '../lib/api';
import { AppHeader } from './AppHeader';
import { ProgressTrack } from './ProgressTrack';
import type { StepDef } from '../config/flow.steps';

/** 三页共用布局：顶部 AppHeader + 主体 max-w-question + 底部 ProgressTrack。
 *  进入作答流程（已离开首页、尚未提交）时 best-effort 上报 abandon（AC-13）。 */
export function PageLayout({
  step,
  enableAbandon = false,
  children,
}: {
  step: StepDef;
  enableAbandon?: boolean;
  children: ReactNode;
}) {
  const { state, config } = useSession();

  useEffect(() => {
    if (!enableAbandon) return;
    const fire = () => {
      // collection 关闭时一个字节都不发（同 AC-09 口径）
      if (config?.collection_enabled === false) return;
      postAbandon({
        session_id: state.sessionId,
        schema_version: SCHEMA_VERSION,
        software_name: state.software?.raw ?? (state.softwareInput || null),
        last_question_index: stepIndexOf(step),
        duration_ms: Date.now() - state.startedAt,
        hp: '',
      });
    };
    const onPageHide = () => fire();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') fire();
    };
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enableAbandon, step, state.sessionId, state.software, state.softwareInput, state.startedAt, config]);

  return (
    <div className="flex min-h-screen flex-col bg-page text-ink">
      <AppHeader />
      <main className="mx-auto w-full max-w-question flex-1 px-lg py-xl">
        <div className="step-enter">{children}</div>
      </main>
      <footer className="sticky bottom-0 z-10 border-t border-line-subtle bg-page px-lg py-md">
        <div className="mx-auto max-w-question">
          <ProgressTrack current={step} />
        </div>
      </footer>
    </div>
  );
}
