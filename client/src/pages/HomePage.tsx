import { useNavigate } from 'react-router-dom';
import { useSession } from '../store/session';
import { SOFTWARE_PRESETS } from '../config/software';
import { STEPS } from '../config/flow.steps';
import { Button } from '../components/Button';
import { ChipGroup } from '../components/ChipGroup';
import { Callout } from '../components/Callout';
import { PageLayout } from '../components/PageLayout';

export function HomePage() {
  const { state, config, setSoftwareInput, setConsent } = useSession();
  const navigate = useNavigate();

  const consentMode = config?.consent_mode ?? 'implied';
  const canStart = state.softwareInput.trim().length > 0 && state.consent;

  const start = () => {
    if (canStart) navigate('/q/1');
  };

  return (
    <PageLayout step={STEPS[0]}>
      <section className="flex flex-col gap-lg">
        <header className="flex flex-col gap-xs">
          <p className="font-announce text-sm tracking-small text-accent">状态承载量自测</p>
          <h1 className="text-2xl font-announce text-ink">先选一个你天天在用的软件</h1>
          <p className="text-md text-ink-secondary">
            接下来用 9 道题，估算你与这个软件之间积累下来的「状态承载量」——它被生成式 AI 整包替代的风险有多高。
          </p>
        </header>

        <div className="flex flex-col gap-sm">
          <p id="software-preset-label" className="font-emphasis text-sm text-ink">
            常用软件（点一下就行）
          </p>
          <ChipGroup
            name="software-preset"
            value={state.softwareInput}
            choices={SOFTWARE_PRESETS.map((p) => ({ value: p.name, label: p.name }))}
            onChange={(v) => setSoftwareInput(v)}
            labelledBy="software-preset-label"
          />
        </div>

        <div className="flex flex-col gap-xs">
          <label htmlFor="software-input" className="font-emphasis text-sm text-ink">
            或者输入其他软件
          </label>
          <input
            id="software-input"
            type="text"
            value={state.softwareInput}
            onChange={(e) => setSoftwareInput(e.target.value)}
            placeholder="例如：剪映、Obsidian、你团队的内部系统"
            className="h-11 rounded-md border border-line bg-surface px-md text-md text-ink outline-none transition-colors duration-fast ease-standard focus-visible:border-accent"
          />
        </div>

        <label className="flex items-start gap-sm rounded-md border border-line bg-surface p-md">
          <input
            type="checkbox"
            checked={state.consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 accent-accent"
          />
          <span className="text-sm leading-sm text-ink-secondary">
            我已知悉本自测不替代专业判断。提交即代表同意本研究在匿名前提下采集以上作答
            {consentMode === 'explicit' ? '（含背景信息）' : ''}；
            我可随时退出，数据不与我的身份关联。
          </span>
        </label>

        <div className="flex flex-col gap-sm">
          <Button variant="primary" full disabled={!canStart} onClick={start}>
            开始自测
          </Button>
          <Callout tone="neutral" icon="info">
            约 3 分钟。先答 9 道题看档位，再花约 40 秒补充背景信息，结果立即本地生成。
          </Callout>
        </div>
      </section>
    </PageLayout>
  );
}
