export interface Work {
  id: string;
  title: string;
  author?: string;
  genre: string;
  tags?: string[];
  romantic_yuri_status?: string;
  cover_url?: string;
  volumes?: number;
  status?: string;
}

export interface MetaData {
  genres: Record<string, string>;
  elements: { key: string; label: string }[];
  elementTags: Record<string, string[]>;
  tagZh: Record<string, string>;
  typeNames: Record<string, { name: string; comment: string }>;
  footnotes: Record<string, string>;
  ui: Record<string, string>;
}

export interface SeibunResult {
  ids: string[];
  name: string;
  /** 各成分百分比,顺序与 elements 一致 */
  scores: Record<string, number>;
  /** 诊断类型 key = `${主导}-${次位}` */
  typeKey: string;
  /** 主导成分 key(决定脚注) */
  dominant: string;
  romanticRate: number;
  featureTags: string[];
  checkNo: string;
  issueDate: string;
  isFallback: boolean;
}
