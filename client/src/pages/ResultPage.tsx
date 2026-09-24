import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useSession } from '../store/session';
import { STEPS, TOTAL_STEPS } from '../config/flow.steps';
import { ANSWER_KEYS, FACTOR_KEYS, FACTORS, type FactorKey } from '../config/questions';
import {
  BAND_META,
  DEFAULT_CALIBRATION,
  resolveBand,
  scoreAnswers,
  bandBasisNote,
  type Calibration,
} from '../lib/scoring';
import { Button } from '../components/Button';
import { Callout } from '../components/Callout';
import { PageLayout } from '../components/PageLayout';
import { exportShareCard } from '../lib/shareCard';
import { useCapacityHistory } from '../lib/useCapacityHistory';
import { Download, RotateCcw } from 'lucide-react';

const FACTOR_NOTE: Record<FactorKey, string> = {
  A: '你沉淀在这个软件里的东西，搬走的代价有多高。',
  B: '你交给它的任务越固定、越难客观验收，越容易被自动化。',
  C: '同事、客户或交付格式把你锁在这里的程度。',
};

export function ResultPage() {
  const navigate = useNavigate();
  const { state, config, startNewAssessment } = useSession();
  const { saveResult, history, clear } = useCapacityHistory();
  const savedKeyRef = useRef<string>('');

  const resultStep = STEPS[TOTAL_STEPS - 1];
  const answered = ANSWER_KEYS.some((k) => typeof state.answers[k] === 'number');

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

  const collectionEnabled = config?.collection_enabled ?? false;
  const honestyNote =
    collectionEnabled
      ? '本次作答已匿名入库，用于后续校准档位切点。'
      : bandBasisNote(calibration) ?? '本结果为本地计算，未上传服务器。';

  if (!answered) {
    return (
      <PageLayout step={resultStep}>
        <Callout tone="warn" icon="alert" title="还没有作答记录">
          这个链接没有对应的作答数据。回到开头，重新测一个软件吧。
          <div className="mt-sm">
            <Button variant="primary" onClick={() => navigate('/')}>
              重新测试
            </Button>
          </div>
        </Callout>
      </PageLayout>
    );
  }

  const softwareName = state.software?.raw ?? (state.softwareInput || '未命名软件');

  // 本地留存：同一份作答只存一次（按 sessionId + sequenceIndex 去重）
  useEffect(() => {
    if (!answered || !result.complete) return;
    const key = `${state.sessionId}#${state.sequenceIndex}`;
    if (savedKeyRef.current === key) return;
    savedKeyRef.current = key;
    saveResult({
      totalScore: result.total,
      normalized: result.normalized,
      band,
      factorMeans: {
        A: result.factors.A.mean,
        B: result.factors.B.mean,
        C: result.factors.C.mean,
      },
      software: softwareName,
    });
  }, [answered, result.complete, state.sessionId, state.sequenceIndex, band, result, saveResult, softwareName]);

  const handleExport = () => {
    exportShareCard({
      softwareName,
      bandLabel: meta.label,
      bandZone: meta.zone,
      total: result.total,
      normalized: result.normalized,
      factors: FACTOR_KEYS.map((k) => ({ label: FACTORS[k].full, mean: result.factors[k].mean })),
      note: honestyNote,
    });
  };

  const handleRetest = () => {
    startNewAssessment();
    navigate('/');
  };

  return (
    <PageLayout step={resultStep}>
      <section className="flex flex-col gap-lg">
        <header className="flex flex-col gap-xs">
          <p className="font-announce text-sm tracking-small text-accent">你的结果</p>
          <h1 className="text-2xl font-announce text-ink">{softwareName}</h1>
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
          <p className="font-emphasis text-sm text-ink-secondary">三因子完整拆解（均值 1–5）</p>
          <div className="flex flex-col gap-xs">
            {FACTOR_KEYS.map((k) => (
              <div key={k} className="rounded-md border border-line bg-surface p-md">
                <div className="flex items-baseline justify-between gap-sm">
                  <p className="font-emphasis text-ink">{FACTORS[k].full}</p>
                  <p className="font-mono text-lg tabular text-accent">
                    {result.factors[k].mean.toFixed(1)}
                  </p>
                </div>
                <p className="mt-1 text-sm text-ink-tertiary">{FACTOR_NOTE[k]}</p>
              </div>
            ))}
          </div>
        </div>

        <Callout tone="neutral" icon="info">
          {honestyNote}
        </Callout>

        {history.length > 0 && (
          <div className="flex flex-col gap-xs rounded-md border border-line bg-surface p-md">
            <p className="font-emphasis text-sm text-ink-secondary">
              本机历史（仅存于此设备，未上传服务器）
            </p>
            <p className="font-mono text-md tabular text-ink-secondary">
              已留存 {history.length} 次 · 最近一次：
              {BAND_META[history[history.length - 1].band].label} ·{' '}
              {history[history.length - 1].totalScore}/45
            </p>
            <button
              type="button"
              className="text-sm text-ink-tertiary underline"
              onClick={clear}
            >
              清空本机记录
            </button>
          </div>
        )}

        <div className="flex flex-col gap-sm sm:flex-row">
          <Button
            variant="primary"
            full
            icon={<Download size={16} aria-hidden />}
            onClick={handleExport}
          >
            导出卡片
          </Button>
          <Button
            variant="ghost"
            full
            icon={<RotateCcw size={16} aria-hidden />}
            onClick={handleRetest}
          >
            再测一个软件
          </Button>
        </div>
      </section>
    </PageLayout>
  );
}
