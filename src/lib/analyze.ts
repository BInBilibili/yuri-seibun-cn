import { ELEMENT_KEYS, meta, workById } from "../data/core";
import type { SeibunResult, Work } from "../data/types";
import { fnv1a, mulberry32 } from "./rng";

const nfc = (s: string) => s.normalize("NFC");

/**
 * 复刻原站 /seibun/r 的分析逻辑:
 * 1. 每部作品:命中某成分的标签列表中任一 tag → 该成分 +50;
 *    romantic_yuri_status === "yes" → 糖度再 +50(封顶 100)。
 * 2. 各作品向量取平均,clamp 0-100。
 * 3. 每成分加 ids 决定性的 ±4 扰动。
 * 4. 全零向量兜底:ids 决定的伪随机分布(各成分约 15-35,总和约 100)。
 * 5. 诊断类型 = (主导成分, 次位成分) 有序对,并列按 糖度>尊贵度>严肃度>日常度>刺激度。
 */
export function analyze(ids: string[], name: string): SeibunResult {
  const uniq = Array.from(new Set(ids));
  const picked: Work[] = uniq
    .map((id) => workById.get(id))
    .filter((w): w is Work => Boolean(w));
  const n = picked.length || 1;

  const elementTags = meta.elementTags;
  const sum: Record<string, number> = {};
  for (const k of ELEMENT_KEYS) sum[k] = 0;

  for (const w of picked) {
    const tags = new Set((w.tags ?? []).map(nfc));
    const vec: Record<string, number> = {};
    for (const k of ELEMENT_KEYS) {
      const list = (elementTags[k] ?? []).map(nfc);
      vec[k] = list.some((t) => tags.has(t)) ? 50 : 0;
    }
    if (w.romantic_yuri_status === "yes") {
      vec.sugar = Math.min(100, (vec.sugar ?? 0) + 50);
    }
    for (const k of ELEMENT_KEYS) sum[k] += vec[k] ?? 0;
  }

  const scores: Record<string, number> = {};
  for (const k of ELEMENT_KEYS) scores[k] = Math.max(0, Math.min(100, Math.round(sum[k] / n)));

  const idsKey = uniq.join(",");
  const seed = fnv1a(idsKey);
  const rng = mulberry32(seed);

  let isFallback = false;
  const total = ELEMENT_KEYS.reduce((a, k) => a + scores[k], 0);
  if (total === 0) {
    isFallback = true;
    const raw = ELEMENT_KEYS.map(() => 15 + rng() * 20); // 15~35
    const s = raw.reduce((a, b) => a + b, 0);
    const target = 100 + rng() * 8;
    ELEMENT_KEYS.forEach((k, i) => {
      scores[k] = Math.round((raw[i] / s) * target);
    });
  } else {
    for (const k of ELEMENT_KEYS) {
      const delta = Math.round((rng() * 2 - 1) * 40) / 10; // -4 ~ +4,一位小数
      scores[k] = Math.max(0, Math.min(100, Math.round(scores[k] + delta)));
    }
  }

  // 主导/次位成分(并列取靠前)
  const order = [...ELEMENT_KEYS].sort((a, b) => scores[b] - scores[a] || ELEMENT_KEYS.indexOf(a) - ELEMENT_KEYS.indexOf(b));
  const dominant = order[0];
  const second = order[1];
  const typeKey = `${dominant}-${second}`;

  const romanticCount = picked.filter((w) => w.romantic_yuri_status === "yes").length;
  const romanticRate = picked.length ? Math.round((romanticCount / picked.length) * 100) : 0;

  // 特征成分:tags 按出现频次降序(同频按首次出现顺序),取前3
  const freq = new Map<string, number>();
  const firstSeen = new Map<string, number>();
  let idx = 0;
  for (const w of picked) {
    for (const t of w.tags ?? []) {
      const tag = nfc(t);
      freq.set(tag, (freq.get(tag) ?? 0) + 1);
      if (!firstSeen.has(tag)) firstSeen.set(tag, idx++);
    }
  }
  const featureTags = [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || (firstSeen.get(a[0]) ?? 0) - (firstSeen.get(b[0]) ?? 0))
    .slice(0, 3)
    .map(([t]) => t);

  const checkNo = String(fnv1a(idsKey) % 100000).padStart(5, "0");
  const now = new Date();
  const issueDate = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;

  return {
    ids: uniq,
    name,
    scores,
    typeKey,
    dominant,
    romanticRate,
    featureTags,
    checkNo,
    issueDate,
    isFallback
  };
}
