/**
 * 第 0 步：选软件。预置项 + 别名表 + 归一化（UIUX §4.1.4）。
 * category 取值必须与 openapi SubmissionRequest.software_category enum 一致。
 */

export type SoftwareCategory =
  | 'design'
  | 'video'
  | '3d'
  | 'doc'
  | 'code'
  | 'sheet'
  | 'note'
  | 'audio'
  | 'other';

export interface SoftwarePreset {
  name: string;
  category: SoftwareCategory;
}

/** 12 个预置 chip（UIUX §4.1.4 [3] 原文顺序）。 */
export const SOFTWARE_PRESETS: readonly SoftwarePreset[] = [
  { name: 'Photoshop', category: 'design' },
  { name: 'Excel', category: 'sheet' },
  { name: 'PowerPoint', category: 'doc' },
  { name: 'Word', category: 'doc' },
  { name: 'Figma', category: 'design' },
  { name: 'Premiere', category: 'video' },
  { name: 'Blender', category: '3d' },
  { name: 'Obsidian', category: 'note' },
  { name: 'Notion', category: 'note' },
  { name: '格式工厂', category: 'other' },
  { name: '剪映', category: 'video' },
  { name: 'AutoCAD', category: 'design' },
];

/** 别名表：输入归一化后先查这里，再回退到预置名前缀匹配。 */
const ALIASES: Record<string, SoftwarePreset> = {
  ps: { name: 'Photoshop', category: 'design' },
  photoshop: { name: 'Photoshop', category: 'design' },
  pr: { name: 'Premiere', category: 'video' },
  premiere: { name: 'Premiere', category: 'video' },
  ppt: { name: 'PowerPoint', category: 'doc' },
  powerpoint: { name: 'PowerPoint', category: 'doc' },
  word: { name: 'Word', category: 'doc' },
  excel: { name: 'Excel', category: 'sheet' },
  figma: { name: 'Figma', category: 'design' },
  blender: { name: 'Blender', category: '3d' },
  obsidian: { name: 'Obsidian', category: 'note' },
  notion: { name: 'Notion', category: 'note' },
  formatfactory: { name: '格式工厂', category: 'other' },
  格式工厂: { name: '格式工厂', category: 'other' },
  剪映: { name: '剪映', category: 'video' },
  capcut: { name: '剪映', category: 'video' },
  autocad: { name: 'AutoCAD', category: 'design' },
  cad: { name: 'AutoCAD', category: 'design' },
};

/** 归一化：trim、小写、去空格。归一化结果只用于匹配，不用于展示。 */
export function normalizeSoftwareName(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '');
}

export interface ResolvedSoftware {
  /** 用户原始输入，原样提交（software_name） */
  raw: string;
  /** 归一化后的键（software_name_norm 由服务端重算，前端仅用于匹配） */
  key: string;
  category: SoftwareCategory;
  isCustomInput: boolean;
}

export function resolveSoftware(raw: string): ResolvedSoftware {
  const key = normalizeSoftwareName(raw);
  const alias = ALIASES[key];
  if (alias) {
    return { raw, key: alias.name, category: alias.category, isCustomInput: false };
  }
  const preset = SOFTWARE_PRESETS.find((p) => normalizeSoftwareName(p.name) === key);
  if (preset) {
    return { raw, key: preset.name, category: preset.category, isCustomInput: false };
  }
  return { raw, key, category: 'other', isCustomInput: true };
}

/** 模糊匹配候选（预置名 + 别名），最多 max 条。 */
export function matchSoftware(query: string, max = 6): string[] {
  const q = normalizeSoftwareName(query);
  if (!q) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (name: string) => {
    if (!seen.has(name) && out.length < max) {
      seen.add(name);
      out.push(name);
    }
  };
  for (const name of Object.keys(ALIASES)) {
    if (name.includes(q)) push(ALIASES[name].name);
  }
  for (const preset of SOFTWARE_PRESETS) {
    if (normalizeSoftwareName(preset.name).includes(q)) push(preset.name);
  }
  return out;
}
