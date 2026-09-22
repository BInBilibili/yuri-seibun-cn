import worksJson from "./works.json";
import staplesJson from "./staples.json";
import translationsJson from "./translations.json";
import metaJson from "./meta.json";
import type { Work, MetaData } from "./types";

export const works = worksJson as unknown as Work[];
export const staples = staplesJson as unknown as Work[];
export const translations = translationsJson as Record<string, string>;
export const meta = metaJson as unknown as MetaData;

const nfc = (s: string) => s.normalize("NFC");

// 数据统一 NFC 规范化(源数据存在组合字符)
for (const w of works) w.title = nfc(w.title);
for (const t of Object.keys(translations)) {
  const v = translations[t];
  delete translations[t];
  translations[nfc(t)] = v;
}

export const workById = new Map<string, Work>(works.map((w) => [w.id, w]));

export const ELEMENT_KEYS = meta.elements.map((e) => e.key);
export const ELEMENT_LABEL: Record<string, string> = Object.fromEntries(
  meta.elements.map((e) => [e.key, e.label])
);

export function titleZh(ja: string): string {
  return translations[nfc(ja)] ?? ja;
}

export function genreZh(genre: string): string {
  return meta.genres[genre] ?? genre;
}

export function tagZh(tag: string): string {
  return meta.tagZh[nfc(tag)] ?? tag;
}

// 搜索索引:中文译名 / 日文原名 / 作者
interface SearchEntry {
  id: string;
  hay: string;
}
const searchIndex: SearchEntry[] = works.map((w) => ({
  id: w.id,
  hay: nfc(`${titleZh(w.title)} ${w.title} ${w.author ?? ""}`).toLowerCase(),
}));

export function searchWorks(query: string, limit = 12): Work[] {
  const q = nfc(query).trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  const hits: Work[] = [];
  for (const e of searchIndex) {
    if (terms.every((t) => e.hay.includes(t))) {
      const w = workById.get(e.id);
      if (w) hits.push(w);
      if (hits.length >= limit) break;
    }
  }
  return hits;
}

/** 「浏览全部作品」用:按关键词(可为空)+ 体裁过滤,返回全部命中(不截断) */
export function filterWorks(query: string, genre: string | null): Work[] {
  const q = nfc(query).trim().toLowerCase();
  const terms = q ? q.split(/\s+/).filter(Boolean) : [];
  const hits: Work[] = [];
  for (const e of searchIndex) {
    if (terms.length && !terms.every((t) => e.hay.includes(t))) continue;
    const w = workById.get(e.id);
    if (w && (!genre || w.genre === genre)) hits.push(w);
  }
  return hits;
}

export const genreCounts: Record<string, number> = (() => {
  const counts: Record<string, number> = {};
  for (const w of works) counts[w.genre] = (counts[w.genre] ?? 0) + 1;
  return counts;
})();

export const GENRE_FILTERS: { key: string | null; label: string }[] = [
  { key: null, label: "全部" },
  { key: "漫画", label: "漫画" },
  { key: "Web漫画", label: "网漫" },
  { key: "小説", label: "小说" },
  { key: "アニメ", label: "动画" },
  { key: "ゲーム", label: "游戏" }
];
