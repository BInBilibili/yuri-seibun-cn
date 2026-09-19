import { forwardRef } from "react";
import { ELEMENT_KEYS, ELEMENT_LABEL, meta, tagZh, titleZh, workById } from "../data/core";
import type { SeibunResult } from "../data/types";
import CoverImg from "./CoverImg";

const Card = forwardRef<HTMLDivElement, { result: SeibunResult }>(function Card(
  { result },
  ref
) {
  const typeName = meta.typeNames[result.typeKey] ?? {
    name: "未知成分型",
    comment: "无法解析的神秘配方。"
  };
  const nickname = result.name || "我";
  const footnote = meta.footnotes[result.dominant] ?? "";

  return (
    <div className="card-outer">
      <div className="card-inner" ref={ref}>
        <div className="card-brand">百合成分测试</div>
        <div className="card-meta">
          <span>百合成分检查 第{result.checkNo}号</span>
          <span>发行日 {result.issueDate}</span>
        </div>
        <h1 className="card-title">{nickname}的百合成分表示</h1>

        <div className="diag-label">诊 断 结 果</div>
        <div className="diag-type">
          <span className="hl">{typeName.name}</span>
        </div>
        <p className="diag-comment">「{typeName.comment}」</p>

        {ELEMENT_KEYS.map((k, i) => (
          <div className="score-row" key={k}>
            <div className="labels">
              <span>{ELEMENT_LABEL[k]}</span>
              <span className="num">{result.scores[k]}%</span>
            </div>
            <div className="score-track">
              <div
                className="score-fill"
                style={{
                  width: `${result.scores[k]}%`,
                  animationDelay: `${0.05 + i * 0.1}s`
                }}
              />
            </div>
          </div>
        ))}

        <div className="rate-row">
          <span>恋爱百合含有率</span>
          <span className="num">{result.romanticRate}%</span>
        </div>
        <div className="feature-row">
          <span>特征成分</span>
          <div className="feature-tags">
            {result.featureTags.length ? (
              result.featureTags.map((t) => (
                <span className="feature-tag" key={t}>{tagZh(t)}</span>
              ))
            ) : (
              <span style={{ color: "var(--muted)", fontSize: 12.5 }}>未检出</span>
            )}
          </div>
        </div>

        <div className="materials-label">原材料名(选了{result.ids.length}部作品)</div>
        <div className="materials">
          {result.ids.map((id) => {
            const w = workById.get(id);
            if (!w) return null;
            return (
              <div className="material" key={id}>
                <CoverImg work={w} className="cover" alt={titleZh(w.title)} />
                <div className="m-title">{titleZh(w.title)}</div>
              </div>
            );
          })}
        </div>

        <div className="footnote">{footnote}</div>
        <div className="stamp">
          <span className="s1">百合成分</span>
          <span className="s2">成 分 检 查</span>
          <span className="s3">验讫</span>
        </div>
      </div>
    </div>
  );
});

export default Card;
