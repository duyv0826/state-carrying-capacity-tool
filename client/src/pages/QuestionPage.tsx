import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useSession } from '../store/session';
import { nextStepOf, prevStepOf, stepByQuestionIndex } from '../config/flow.steps';
import { questionLabel } from '../lib/progress';
import { QUESTIONS } from '../config/questions';
import { LikertScale } from '../components/LikertScale';
import { Button } from '../components/Button';
import { PageLayout } from '../components/PageLayout';
import { ArrowLeft } from 'lucide-react';

export function QuestionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, setAnswer } = useSession();

  const idx = Number(id);
  if (!Number.isInteger(idx) || idx < 1 || idx > QUESTIONS.length) {
    return <Navigate to="/" replace />;
  }

  const step = stepByQuestionIndex(idx);
  if (!step) return <Navigate to="/" replace />;

  const question = QUESTIONS[idx - 1];
  const answer = step.answerKey ? state.answers[step.answerKey] : undefined;

  const handleSelect = (value: number) => {
    if (!step.answerKey) return;
    setAnswer(step.answerKey, value);
    const next = nextStepOf(step);
    if (next) navigate(next.route);
  };

  const prev = prevStepOf(step);
  const prevRoute = prev ? prev.route : '/';
  const prevLabel = prev ? '返回上一题' : '返回选软件';

  return (
    <PageLayout step={step} enableAbandon>
      <section className="flex flex-col gap-lg">
        <p className="font-announce text-sm tracking-small text-accent">{questionLabel(step)}</p>
        <h1 id="q-stem" className="text-lg font-announce leading-lg text-ink">
          {question.stem}
        </h1>
        <p className="text-md text-ink-secondary">{question.hint}</p>

        <LikertScale
          name={step.id}
          value={answer}
          onChange={handleSelect}
          labelledBy="q-stem"
        />

        <div className="flex justify-start">
          <Button
            variant="ghost"
            icon={<ArrowLeft size={16} aria-hidden />}
            iconPosition="left"
            onClick={() => navigate(prevRoute)}
          >
            {prevLabel}
          </Button>
        </div>
      </section>
    </PageLayout>
  );
}
