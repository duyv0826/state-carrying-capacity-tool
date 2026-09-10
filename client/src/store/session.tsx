import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Strata, StrataKey } from '../config/strata';
import { resolveSoftware, type ResolvedSoftware } from '../config/software';
import type { AnswerKey, PartialAnswerMap } from '../config/questions';
import { fetchConfig, newSessionId } from '../lib/api';
import type { ConfigPayload } from '../types/api';

const STORAGE_KEY = 'scc.session.v2';
const THEME_KEY = 'scc.theme';

export type Theme = 'light' | 'dark';

export interface SessionState {
  sessionId: string;
  softwareInput: string;
  software: ResolvedSoftware | null;
  consent: boolean;
  answers: PartialAnswerMap;
  strata: Strata;
  startedAt: number;
  sequenceIndex: number;
}

function initialState(): SessionState {
  return {
    sessionId: newSessionId(),
    softwareInput: '',
    software: null,
    consent: false,
    answers: {},
    strata: {},
    startedAt: Date.now(),
    sequenceIndex: 1,
  };
}

function loadPersisted(): SessionState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SessionState>;
    if (!parsed || typeof parsed.sessionId !== 'string') return null;
    return {
      sessionId: parsed.sessionId,
      softwareInput: parsed.softwareInput ?? '',
      software: parsed.software ?? null,
      consent: Boolean(parsed.consent),
      answers: parsed.answers ?? {},
      strata: parsed.strata ?? {},
      startedAt: parsed.startedAt ?? Date.now(),
      sequenceIndex: parsed.sequenceIndex ?? 1,
    };
  } catch {
    return null;
  }
}

export interface SessionContextValue {
  state: SessionState;
  config: ConfigPayload | null;
  configFailed: boolean;
  theme: Theme;
  toggleTheme: () => void;
  setSoftwareInput: (value: string) => void;
  setConsent: (value: boolean) => void;
  setAnswer: (key: AnswerKey, value: number) => void;
  setStratum: (key: StrataKey, value: string) => void;
  startNewAssessment: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(() => loadPersisted() ?? initialState());
  const [config, setConfig] = useState<ConfigPayload | null>(null);
  const [configFailed, setConfigFailed] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === 'dark' || saved === 'light' ? saved : 'light';
  });
  useEffect(() => {
    const controller = new AbortController();
    fetchConfig(controller.signal)
      .then(setConfig)
      .catch(() => setConfigFailed(true));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* 隐私模式下 sessionStorage 不可写：放弃持久化，不影响作答 */
    }
  }, [state]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const setSoftwareInput = useCallback((value: string) => {
    setState((prev) => ({
      ...prev,
      softwareInput: value,
      software: value.trim() ? resolveSoftware(value) : null,
    }));
  }, []);

  const setConsent = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, consent: value }));
  }, []);

  const setAnswer = useCallback((key: AnswerKey, value: number) => {
    setState((prev) => ({ ...prev, answers: { ...prev.answers, [key]: value } }));
  }, []);

  const setStratum = useCallback((key: StrataKey, value: string) => {
    setState((prev) => ({ ...prev, strata: { ...prev.strata, [key]: value } }));
  }, []);

  /** 同一 session 内连测第二个软件：清空答案保留 sessionId，sequence_index +1。 */
  const startNewAssessment = useCallback(() => {
    setState((prev) => ({
      ...initialState(),
      sessionId: prev.sessionId,
      sequenceIndex: prev.sequenceIndex + 1,
    }));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      state,
      config,
      configFailed,
      theme,
      toggleTheme,
      setSoftwareInput,
      setConsent,
      setAnswer,
      setStratum,
      startNewAssessment,
    }),
    [
      state,
      config,
      configFailed,
      theme,
      toggleTheme,
      setSoftwareInput,
      setConsent,
      setAnswer,
      setStratum,
      startNewAssessment,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession 必须在 SessionProvider 内使用');
  return ctx;
}
