import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useSession } from '../store/session';
import { STEPS, TOTAL_STEPS } from '../config/flow.steps';
import { ANSWER_KEYS, FACTOR_KEYS, FACTORS, type FactorKey } from '../config/questions';
import {
  BAND_META,
  DEFAULT_CALIBRATION,
  resolveBand,
  scoreAnswers,
  normalizeTotal,
  bandBasisNote,
  type Calibration,
} from '../lib/scoring';
import { Button } from '../components/Button';
import { Callout } from '../components/Callout';
import { PageLayout } from '../components/PageLayout';
import { exportShareCard } from '../lib/shareCard';
import { useCapacityHistory } from '../lib/useCapacityHistory';
import { fetchSubmission } from '../lib/api';
import type { SubmissionLookup } from '../types/api';
import { Download, RotateCcw, Link2, Check } from 'lucide-react';

const FACTOR_NOTE: Record<FactorKey, string> = {
  A: '你沉淀在这个软件里的东西，搬走的代价有多高。',
  B: '你交给它的任务越固定、越难客观验收，越容易被自动化。',
  C: '同事、客户或交付格式把你锁在这里的程度。',
};

interface ResultView {
  softwareName: string;
  band: 'high_risk' | 'watch' | 'safe';
  normalized: number;
  total: number;
  factorMeans: { A: number; B: number; C: number };
  source: 'live' | 'server';
}

export function ResultPage() {
  const navigate = useNavigate();
  const { token } = useParams();
  const { state, config, startNewAssessment, setLastRecordId } = useSession();
  const { saveResult, history, clear } = useCapacityHistory();
  const savedKeyRef = useRef<string>('');
  const [copied, setCopied] = useState(false);

  const collectionEnabled = config?.collection_enabled ?? false;
  const liveResult = scoreAnswers(state.answers);
  const answered = ANSWER_KEYS.some((k) => typeof state.answers[k] === 'number');
  const hasLive = answered && liveResult.complete;

  const calibration: Calibration = config
    ? {
        method: config.calibration.method,
        n: config.calibration.n,
        p33: config.calibration.p33,
        p67: config.calibration.p67,
        computedAt: config.calibration.computed_at,
      }
    : DEFAULT_CALIBRATION;

  const band = resolveBand(liveResult.total, calibration);

  const honestyNote = collectionEnabled
    ? '本次作答已匿名入库，用于后续校准档位切点。'
    : bandBasisNote(calibration) ?? '本结果为本地计算，未上传服务器。';

  // 服务端找回态
  const [lookup, setLookup] = useState<SubmissionLookup | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    if (hasLive || !token) return;
    if (!collectionEnabled) {
      return;
    }
    let cancelled = false;
    setLookupLoading(true);
    fetchSubmission(token)
      .then((data) => {
        if (cancelled) return;
        if (data) {
          setLookup(data);
          setLastRecordId(data.record_id);
        }
      })
      .catch(() => {
        /* 取回失败：交由下方空态处理 */
      })
      .finally(() => {
        if (!cancelled) setLookupLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hasLive, token, collectionEnabled, setLastRecordId]);

  // 构建展示视图：本地作答优先，其次服务端找回
  let view: ResultView | null = null;
  if (hasLive) {
    view = {
      softwareName: state.software?.raw ?? (state.softwareInput || '未命名软件'),
      band,
      normalized: liveResult.normalized,
      total: liveResult.total,
      factorMeans: {
        A: liveResult.factors.A.mean,
        B: liveResult.factors.B.mean,
        C: liveResult.factors.C.mean,
      },
      source: 'live',
    };
  } else if (lookup) {
    view = {
      softwareName: lookup.software_name,
      band: lookup.band,
      normalized: normalizeTotal(lookup.total_score),
      total: lookup.total_score,
      factorMeans: {
        A: Math.round((lookup.factor_a_score / 3) * 10) / 10,
        B: Math.round((lookup.factor_b_score / 3) * 10) / 10,
        C: Math.round((lookup.factor_c_score / 3) * 10) / 10,
      },
      source: 'server',
    };
  }

  // 本地留存：仅本地作答时写入 localStorage（服务端找回不重复存）
  useEffect(() => {
    if (!hasLive || !liveResult.complete) return;
    const key = `${state.sessionId}#${state.sequenceIndex}`;
    if (savedKeyRef.current === key) return;
    savedKeyRef.current = key;
    saveResult({
      totalScore: liveResult.total,
      normalized: liveResult.normalized,
      band,
      factorMeans: {
        A: liveResult.factors.A.mean,
        B: liveResult.factors.B.mean,
        C: liveResult.factors.C.mean,
      },
      software: view?.softwareName,
    });
  }, [hasLive, liveResult.complete, state.sessionId, state.sequenceIndex, band, liveResult, saveResult, view?.softwareName]);

  const handleExport = () => {
    if (!view) return;
    exportShareCard({
      softwareName: view.softwareName,
      bandLabel: BAND_META[view.band].label,
      bandZone: BAND_META[view.band].zone,
      total: view.total,
      normalized: view.normalized,
      factors: FACTOR_KEYS.map((k) => ({ label: FACTORS[k].full, mean: view.factorMeans[k] })),
      note: honestyNote,
    });
  };

  const handleRetest = () => {
    startNewAssessment();
    navigate('/');
  };

  const handleCopyLink = async () => {
    if (!state.lastRecordId) return;
    const url = `${window.location.origin}/result/${state.lastRecordId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 剪贴板不可用时忽略，用户可手动复制地址栏链接 */
    }
  };

  const resultStep = STEPS[TOTAL_STEPS - 1];

  // 空态：无本地作答、也无可取回结果
  if (!view) {
    if (lookupLoading) {
      return (
        <PageLayout step={resultStep}>
          <Callout tone="neutral" icon="info" title="正在找回结果…">
            正在从服务器取回你的结果，请稍候。
          </Callout>
        </PageLayout>
      );
    }
    const fromLink = Boolean(token);
    return (
      <PageLayout step={resultStep}>
        <Callout tone="warn" icon="alert" title={fromLink ? '这个链接没有对应的作答数据' : '还没有作答记录'}>
          {fromLink
            ? '链接可能已失效，或采集功能未开启。回到开头，重新测一个软件吧。'
            : '回到开头，选择一个软件开始自测吧。'}
          <div className="mt-sm">
            <Button variant="primary" onClick={() => navigate('/')}>
              重新测试
            </Button>
          </div>
        </Callout>
      </PageLayout>
    );
  }

  return (
    <PageLayout step={resultStep}>
      <section className="flex flex-col gap-lg">
        <header className="flex flex-col gap-xs">
          <p className="font-announce text-sm tracking-small text-accent">
            {view.source === 'server' ? '你找回的结果' : '你的结果'}
          </p>
          <h1 className="text-2xl font-announce text-ink">{view.softwareName}</h1>
        </header>

        <div className="rounded-md border border-line bg-surface p-lg">
          <p className="font-emphasis text-sm text-ink-secondary">状态承载量档位</p>
          <p className="mt-2 text-2xl font-announce text-accent">
            {BAND_META[view.band].label} · {BAND_META[view.band].zone}
          </p>
          <p className="mt-2 font-mono text-md tabular text-ink-secondary">
            总分 {view.total} / 45 · 归一化 {view.normalized}%
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
                    {view.factorMeans[k].toFixed(1)}
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

        {collectionEnabled && state.lastRecordId && (
          <div className="flex flex-col gap-xs rounded-md border border-line bg-surface p-md">
            <p className="font-emphasis text-sm text-ink-secondary">结果找回链接</p>
            <p className="text-sm text-ink-tertiary">
              复制下面的链接，下次打开即可取回这份结果（无需账号，仅作为本设备外的备份）。
            </p>
            <Button
              variant="ghost"
              full
              icon={copied ? <Check size={16} aria-hidden /> : <Link2 size={16} aria-hidden />}
              onClick={handleCopyLink}
            >
              {copied ? '已复制链接' : '复制找回链接'}
            </Button>
          </div>
        )}

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
