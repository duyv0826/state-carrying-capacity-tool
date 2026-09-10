import { useNavigate, Navigate } from 'react-router-dom';
import { useSession } from '../store/session';
import { findStep } from '../config/flow.steps';
import { FACTORS, FACTOR_KEYS } from '../config/questions';
import {
  BAND_META,
  DEFAULT_CALIBRATION,
  resolveBand,
  scoreAnswers,
  type Calibration,
} from '../lib/scoring';
import { Button } from '../components/Button';
import { Callout } from '../components/Callout';
import { PageLayout } from '../components/PageLayout';

export function PreviewPage() {
  const { state, config } = useSession();
  const navigate = useNavigate();

  const previewStep = findStep((s) => s.kind === 'preview');
  if (!previewStep) return <Navigate to="/" replace />;

  const result = scoreAnswers(state.answers);
  const calibration: Calibration = config
    ? {
        method: config.calibration.method,
        n: config.calibration.n,
        p33: config.calibration.p33,
        p67: config.calibration.p67,
        computedAt: config.calibration.computed_at,
      }
    : DEFAULT_CALIBRATION;
  const band = resolveBand(result.total, calibration);
  const meta = BAND_META[band];

  if (result.answeredCount === 0) {
    return (
      <PageLayout step={previewStep} enableAbandon>
        <Callout tone="warn" icon="alert" title="还没有作答">
          先完成 9 道题，才能看到档位预览。
          <div className="mt-sm">
            <Button variant="primary" onClick={() => navigate('/q/1')}>
              开始自测
            </Button>
          </div>
        </Callout>
      </PageLayout>
    );
  }

  return (
    <PageLayout step={previewStep} enableAbandon>
      <section className="flex flex-col gap-lg">
        <header className="flex flex-col gap-xs">
          <p className="font-announce text-sm tracking-small text-accent">结果预览</p>
          <h1 className="text-2xl font-announce text-ink">先看个大概</h1>
          <p className="text-md text-ink-secondary">
            这是基于 9 道题的初步档位。补充背景信息后，结果页会给你三因子的完整拆解。
          </p>
        </header>

        <div className="rounded-md border border-line bg-surface p-lg">
          <p className="font-emphasis text-sm text-ink-secondary">状态承载量档位</p>
          <p className="mt-2 text-2xl font-announce text-accent">
            {meta.label} · {meta.zone}
          </p>
          <p className="mt-2 font-mono text-md tabular text-ink-secondary">
            总分 {result.total} / 45 · 归一化 {result.normalized}%
          </p>
        </div>

        <div className="flex flex-col gap-sm">
          <p className="font-emphasis text-sm text-ink-secondary">三因子雏形（均值 1–5）</p>
          <div className="grid grid-cols-3 gap-xs">
            {FACTOR_KEYS.map((k) => (
              <div key={k} className="rounded-md border border-line bg-surface p-md">
                <p className="text-sm text-ink-secondary">{FACTORS[k].short}</p>
                <p className="mt-1 font-mono text-lg tabular text-ink">
                  {result.factors[k].mean.toFixed(1)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Button variant="primary" full onClick={() => navigate('/s/S1')}>
          继续（约 40 秒）
        </Button>
      </section>
    </PageLayout>
  );
}
