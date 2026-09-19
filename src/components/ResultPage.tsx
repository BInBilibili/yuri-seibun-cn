import { useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import Card from "./Card";
import CoverImg from "./CoverImg";
import { genreZh, meta, tagZh, titleZh, workById, works } from "../data/core";
import { analyze } from "../lib/analyze";
import { genreBadgeColor } from "./shared";
import type { Work } from "../data/types";

interface Props {
  ids: string[];
  name: string;
  onBack: () => void;
}

const nfc = (s: string) => s.normalize("NFC");

export default function ResultPage({ ids, name, onBack }: Props) {
  const result = useMemo(() => analyze(ids, name), [ids, name]);
  const cardRef = useRef<HTMLDivElement>(null);
  const simpleRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [wished, setWished] = useState<Set<string>>(new Set());

  const shareUrl = window.location.href;
  const xText = `我分析了我的百合成分🔬\n\n#我的百合成分\n${shareUrl}`;

  const recs = useMemo(() => {
    const selected = new Set(result.ids);
    const feats = result.featureTags.map(nfc);
    const scored: { w: Work; overlap: number }[] = [];
    for (const w of works) {
      if (selected.has(w.id)) continue;
      const tags = (w.tags ?? []).map(nfc);
      const overlap = feats.filter((f) => tags.includes(f)).length;
      if (overlap > 0) scored.push({ w, overlap });
    }
    scored.sort((a, b) => b.overlap - a.overlap);
    // 同分内按 id 稳定排序,取前8
    return scored
      .sort((a, b) => b.overlap - a.overlap || a.w.id.localeCompare(b.w.id))
      .slice(0, 8);
  }, [result]);

  const t1 = result.featureTags[0] ? tagZh(result.featureTags[0]) : "";
  const t2 = result.featureTags[1] ? tagZh(result.featureTags[1]) : "";

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveCard = async (ref: React.RefObject<HTMLDivElement>, filename: string) => {
    if (!ref.current) return;
    setSaving(true);
    try {
      const canvas = await html2canvas(ref.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true
      });
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = filename;
      a.click();
    } catch (e) {
      alert("生成图片失败,部分封面图跨域受限。可尝试截图保存。");
    } finally {
      setSaving(false);
    }
  };

  const simpleList = result.ids
    .map((id) => workById.get(id))
    .filter(Boolean)
    .map((w) => titleZh(w!.title));
  const simpleText = `构成我的${simpleList.length}部百合作品\n${simpleList
    .map((t, i) => `${i + 1}. ${t}`)
    .join("\n")}\n#构成我的${simpleList.length}部百合作品\n${shareUrl}`;

  const typeName = meta.typeNames[result.typeKey];

  return (
    <main>
      <Card result={result} ref={cardRef} />

      <div className="share-panel">
        <h3>分享这份诊断书</h3>
        <p className="share-note">分享出去的链接会直接打开这张卡片。</p>
        <div className="share-btns">
          <a
            className="btn btn-x"
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(xText)}`}
            target="_blank"
            rel="noreferrer"
          >分享到X</a>
          <button className="btn btn-copy" onClick={doCopy}>
            {copied ? "已复制" : "复制链接"}
          </button>
          <button
            className="btn btn-save"
            disabled={saving}
            onClick={() => saveCard(cardRef, "百合成分卡片.png")}
          >
            {saving ? "生成图片中..." : "保存卡片图片"}
          </button>
        </div>
      </div>

      <details className="simple-card-wrap">
        <summary>也可以用「只写 #构成我的{simpleList.length}部百合作品」的简洁卡片分享</summary>
        <div className="simple-card" ref={simpleRef}>
          <h4>构成我的{simpleList.length}部百合作品</h4>
          <ol>
            {simpleList.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
          <p className="hint">只用所选作品的译名制作,不使用封面图。</p>
        </div>
        <div className="share-btns" style={{ marginTop: 10 }}>
          <a
            className="btn btn-x"
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(simpleText)}`}
            target="_blank"
            rel="noreferrer"
          >分享这张卡片</a>
          <a
            className="btn btn-line"
            href={`https://line.me/R/msg/text/?${encodeURIComponent(simpleText)}`}
            target="_blank"
            rel="noreferrer"
          >用LINE分享</a>
          <button
            className="btn btn-save"
            disabled={saving}
            onClick={() => saveCard(simpleRef, "构成我的百合作品.png")}
          >保存卡片图片</button>
        </div>
        <p className="share-note" style={{ marginTop: 8 }}>
          保存图片:也可以在预览图上右键(电脑)或长按(手机)选择「图片另存为」。
        </p>
      </details>

      {recs.length > 0 && (
        <section className="recommends">
          <h2>适合这个成分的你</h2>
          {t1 && (
            <p className="rec-desc">
              已按特征成分「{t1}」{t2 ? `「${t2}」` : ""}相近,从你尚未选择的作品中挑出 {recs.length} 部。
            </p>
          )}
          <a
            className="rec-link"
            href={`https://www.yurimiru.com/works?tags=${encodeURIComponent(
              result.featureTags.slice(0, 2).join(",")
            )}`}
            target="_blank"
            rel="noreferrer"
          >按条件继续找作品 →</a>
          <div className="rec-grid">
            {recs.map(({ w, overlap }) => {
              const on = wished.has(w.id);
              const feats = result.featureTags.map(nfc).filter((f) => (w.tags ?? []).map(nfc).includes(f));
              return (
                <div className="rec-card" key={w.id}>
                  <div className="rec-cover">
                    <CoverImg work={w} className="rec-img" alt={titleZh(w.title)} />
                    {w.romantic_yuri_status === "yes" && (
                      <span className="rec-heart" title="确认为恋爱百合的作品">💗</span>
                    )}
                  </div>
                  <div className="rec-body">
                    <div className="rec-title">
                      <span
                        className="genre-badge"
                        style={{ background: genreBadgeColor(w.genre) }}
                      >{genreZh(w.genre)}</span>{" "}
                      {titleZh(w.title)}
                      <span className="ja">{w.title}</span>
                    </div>
                    <div className="rec-author">
                      {w.status === "完結"
                        ? `全${w.volumes ?? 1}卷`
                        : `已出${w.volumes ?? 1}卷`}
                      {w.author ? ` · ${w.author}` : ""}
                    </div>
                    {feats.length > 0 && (
                      <div className="rec-overlap">
                        「{tagZh(feats[0])}」{feats[1] ? `「${tagZh(feats[1])}」` : ""}也重合
                      </div>
                    )}
                    <button
                      className={`rec-wish${on ? " on" : ""}`}
                      onClick={() =>
                        setWished((prev) => {
                          const next = new Set(prev);
                          if (next.has(w.id)) next.delete(w.id);
                          else next.add(w.id);
                          return next;
                        })
                      }
                    >
                      {on ? "♥ 感兴趣" : "♡ 感兴趣"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="bottom-cta">
        <button className="btn" onClick={onBack}>你也来分析成分吧</button>
      </div>
      <div className="back-row">
        <button onClick={onBack}>← 返回重新选择</button>
      </div>

      {/* 诊断结果说明(供无障碍与调试) */}
      <span hidden>{typeName?.name}</span>
    </main>
  );
}
