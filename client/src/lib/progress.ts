/**
 * 进度与播报的唯一算法来源。组件只读这里的结果，不自己算段数、不自己拼播报文案。
 */

import {
  BACKGROUND_TOTAL,
  STEPS,
  TOTAL_STEPS,
  backgroundOrdinal,
  stepIndexOf,
  type StepDef,
} from '../config/flow.steps';
import { STRATA_QUESTIONS } from '../config/strata';
import { QUESTIONS, type AnswerKey, type PartialAnswerMap } from '../config/questions';
import type { Strata } from '../config/strata';

export interface GateInput {
  softwareInput: string;
  consent: boolean;
  answers: PartialAnswerMap;
  strata: Strata;
}

export type SegmentState = 'done' | 'current' | 'todo';

export function segmentState(step: StepDef, currentIndex: number): SegmentState {
  const i = stepIndexOf(step);
  if (i < currentIndex) return 'done';
  if (i === currentIndex) return 'current';
  return 'todo';
}

/** 背景题屏的必答判定：S4 选填，未答不阻塞（UIUX §4.4.6）。 */
export function isStepAnswered(step: StepDef, input: GateInput): boolean {
  switch (step.kind) {
    case 'select': {
      const softwareOk = input.softwareInput.trim().length > 0;
      const strataOk = (step.strataKeys ?? []).every(
        (key) => !STRATA_QUESTIONS[key].optional && Boolean(input.strata[key]),
      );
      return softwareOk && input.consent && strataOk;
    }
    case 'likert': {
      const key = step.answerKey as AnswerKey | undefined;
      return key ? typeof input.answers[key] === 'number' : false;
    }
    case 'preview':
      return true;
    case 'strata':
      return (step.strataKeys ?? []).every(
        (key) => STRATA_QUESTIONS[key].optional || Boolean(input.strata[key]),
      );
  }
}

/** 深度链接进入时，重定向到第一个未答的步（UIUX §4.3.5）。 */
export function firstUnansweredStep(input: GateInput): StepDef | undefined {
  return STEPS.find((step) => !isStepAnswered(step, input));
}

/**
 * 「步」与「题」两个数字并存，不得混用（UIUX §4.1.2b）：
 * 步 = 一屏一步，分母 14；题 = 只指 9 道计分题，分母 9；背景题分母 3。
 */
export function ariaValueText(step: StepDef): string {
  const stepNo = stepIndexOf(step) + 1;
  const tail = `第 ${stepNo} 步，共 ${TOTAL_STEPS} 步`;
  if (step.group === 'background') {
    return `背景信息第 ${backgroundOrdinal(step)} 步，共 ${BACKGROUND_TOTAL} 步；全流程${tail}`;
  }
  if (step.kind === 'preview') return `${tail}，结果预览`;
  return tail;
}

/** 题号播报（量表题屏用）——分母恒为题单长度，与步数无关。 */
export function questionLabel(step: StepDef): string {
  if (step.kind !== 'likert' || !step.questionIndex) return '';
  return `第 ${step.questionIndex} / ${QUESTIONS.length} 题`;
}
