import { useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useSession } from '../store/session';
import { isLastStep, nextStepOf, stepByStrataId } from '../config/flow.steps';
import { STRATA_QUESTIONS } from '../config/strata';
import { ANSWER_KEYS, LIKERT_MIN, SCHEMA_VERSION, type AnswerMap } from '../config/questions';
import { detectDeviceType, detectUaFamily, postSubmission } from '../lib/api';
import type { SubmissionRequest } from '../types/api';
import { StatementRows, type StatementChoice } from '../components/StatementRows';
import { ChipGroup } from '../components/ChipGroup';
import { Button } from '../components/Button';
import { PageLayout } from '../components/PageLayout';

export function StrataPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, config, setStratum } = useSession();
  const [submitting, setSubmitting] = useState(false);

  const step = stepByStrataId(id ?? '');
  if (!step || !step.strataKeys) return <Navigate to="/" replace />;

  const keys = step.strataKeys;
  const required = keys.filter((k) => !STRATA_QUESTIONS[k].optional);
  const canAdvance = required.every((k) => Boolean(state.strata[k]));
  const last = isLastStep(step);
  const nextRoute = nextStepOf(step)?.route;

  const goNext = async () => {
    if (!canAdvance || submitting) return;

    if (!last) {
      if (nextRoute) navigate(nextRoute);
      return;
    }

    // AC-09 传输最小化：采集关闭时根本不发 POST，本地算分已在 ResultPage 完成。
    if (config?.collection_enabled === false) {
      navigate(`/result/${state.sessionId}`);
      return;
    }

    setSubmitting(true);
    const s1 = state.strata.S1;
    const s2 = state.strata.S2;
    const s3 = state.strata.S3;
    if (!s1 || !s2 || !s3) {
      setSubmitting(false);
      return; // 理论上按钮已禁用，双重保险
    }

    const answers = ANSWER_KEYS.reduce<AnswerMap>((acc, k) => {
      acc[k] = typeof state.answers[k] === 'number' ? state.answers[k] : LIKERT_MIN;
      return acc;
    }, {} as AnswerMap);

    const body: SubmissionRequest = {
      session_id: state.sessionId,
      schema_version: SCHEMA_VERSION,
      software_name: state.software?.raw ?? state.softwareInput,
      software_category: state.software?.category ?? 'other',
      is_custom_input: state.software?.isCustomInput ?? true,
      answers,
      strata: { S1: s1, S2: s2, S3: s3, S4: state.strata.S4 },
      region_bucket: null,
      duration_ms: Date.now() - state.startedAt,
      sequence_index: state.sequenceIndex,
      device_type: detectDeviceType(),
      ua_family: detectUaFamily(),
      source: null,
      client_submitted_at: null,
      consent_version: config?.consent_version ?? 'implied',
      consent_mode: config?.consent_mode ?? 'implied',
      feedback_text: null,
      followup_token: null,
      hp: '',
    };

    try {
      await postSubmission(body);
    } catch {
      // 提交失败不影响结果展示：结果页完全本地计算（AC-09）
    } finally {
      setSubmitting(false);
      navigate(`/result/${state.sessionId}`);
    }
  };

  return (
    <PageLayout step={step} enableAbandon>
      <section className="flex flex-col gap-lg">
        <header className="flex flex-col gap-xs">
          <p className="font-announce text-sm tracking-small text-accent">背景信息</p>
          <h1 className="text-2xl font-announce text-ink">
            {last ? '最后一步：背景信息' : '补充一点背景'}
          </h1>
          <p className="text-md text-ink-secondary">
            这些只用于校准档位切点，不影响你的分数。带「选填」的可以跳过。
          </p>
        </header>

        {keys.map((key) => {
          const q = STRATA_QUESTIONS[key];
          const value = state.strata[key];
          return (
            <div key={key} className="flex flex-col gap-sm">
              <div className="flex flex-col gap-2xs">
                <h2 id={`${key}-label`} className="text-lg font-announce text-ink">
                  {q.stem}
                  {q.optional ? <span className="ml-2 text-sm text-ink-tertiary">（选填）</span> : null}
                </h2>
                <p className="text-sm text-ink-tertiary">{q.reason}</p>
                <p className="text-sm text-ink-secondary">{q.hint}</p>
              </div>
              {q.shape === 'statement' ? (
                <StatementRows
                  name={key}
                  value={value}
                  choices={q.choices as readonly StatementChoice[]}
                  onChange={(v) => setStratum(key, v)}
                  labelledBy={`${key}-label`}
                />
              ) : (
                <ChipGroup
                  name={key}
                  value={value}
                  choices={q.choices}
                  onChange={(v) => setStratum(key, v)}
                  labelledBy={`${key}-label`}
                  small={q.optional}
                />
              )}
            </div>
          );
        })}

        <Button
          variant="primary"
          full
          loading={submitting}
          disabled={!canAdvance}
          onClick={goNext}
        >
          {step.nextLabel}
        </Button>
      </section>
    </PageLayout>
  );
}
