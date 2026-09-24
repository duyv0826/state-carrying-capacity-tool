/**
 * useCapacityHistory.ts
 * 状态承载量自测工具 —— 纯前端本地历史 Hook（免服务器、IRB 安全）
 * 位置：client/src/lib/useCapacityHistory.ts
 *
 * 作用：让用户在【自己的浏览器】留存历次自测结果，关页/刷新仍在；
 *       可回看历史、画趋势、导出备份。
 * 与 server 端采集完全解耦：本 hook 不联网、不采集任何 PII，
 *       仅存于用户本地 localStorage —— 即使 COLLECTION_ENABLED=false 也能用。
 *
 * 字段类型对齐 client/src/lib/scoring.ts：
 *   Band = 'high_risk' | 'watch' | 'safe'（见 BAND_META）
 *   factor means 范围 1.0–5.0
 */

import { useCallback, useEffect, useState } from 'react';

const STORE_KEY = 'scc.local_history.v1';

/** 单条记录，与 ResultPage 的计分输出一一对应 */
export interface SCCRecord {
  timestamp: number;
  totalScore: number;                                  // 9–45
  normalized: number;                                  // 0–100，仅展示
  band: 'high_risk' | 'watch' | 'safe';                // 风险档位
  factorMeans: { A: number; B: number; C: number };    // 三因子均值 1.0–5.0
  software?: string;                                   // 被测软件名（用户自选，非 PII）
  note?: string;
}

function readAll(): SCCRecord[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as SCCRecord[]) : [];
  } catch {
    return [];
  }
}

export function useCapacityHistory() {
  const [history, setHistory] = useState<SCCRecord[]>([]);

  useEffect(() => {
    setHistory(readAll());
  }, []);

  /** 保存一次结果，返回带时间戳的完整记录 */
  const saveResult = useCallback((rec: Omit<SCCRecord, 'timestamp'>) => {
    const item: SCCRecord = { timestamp: Date.now(), ...rec };
    const next = [...readAll(), item];
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('[SCC] 本地保存失败（隐私模式/容量满）：', e);
    }
    setHistory(next);
    return item;
  }, []);

  const getLatest = useCallback(() => {
    const all = readAll();
    return all.length ? all[all.length - 1] : null;
  }, []);

  /** 清空本机全部历史（谨慎调用） */
  const clear = useCallback(() => {
    localStorage.removeItem(STORE_KEY);
    setHistory([]);
  }, []);

  /** 导出 JSON，供用户备份 */
  const exportJSON = useCallback(() => JSON.stringify(readAll(), null, 2), []);

  return { history, saveResult, getLatest, clear, exportJSON };
}
