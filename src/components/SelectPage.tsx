import { useEffect, useMemo, useRef, useState } from "react";
import { genreZh, searchWorks, staples, titleZh } from "../data/core";
import type { Work } from "../data/types";
import CoverImg from "./CoverImg";
import { genreBadgeColor } from "./shared";

const MIN = 10;
const MAX = 20;

interface Props {
  onAnalyze: (ids: string[], name: string) => void;
}

export default function SelectPage({ onAnalyze }: Props) {
  const [selected, setSelected] = useState<Work[]>([]);
  const [nickname, setNickname] = useState("");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [searching, setSearching] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (query === debounced) return;
    setSearching(true);
    timer.current = window.setTimeout(() => {
      setDebounced(query);
      setSearching(false);
    }, 300);
    return () => window.clearTimeout(timer.current);
  }, [query, debounced]);

  const results = useMemo(() => searchWorks(debounced, 12), [debounced]);
  const selectedIds = new Set(selected.map((w) => w.id));
  const n = selected.length;
  const maxed = n >= MAX;
  const canAnalyze = n >= MIN && n <= MAX;

  const toggle = (w: Work) => {
    setSelected((prev) => {
      if (prev.some((p) => p.id === w.id)) return prev.filter((p) => p.id !== w.id);
      if (prev.length >= MAX) return prev;
      return [...prev, w];
    });
  };

  const submit = () => {
    if (!canAnalyze) return;
    onAnalyze(selected.map((w) => w.id), nickname.trim().slice(0, 10));
  };

  return (
    <main>
      <section className="hero">
        <h1>百合成分测试</h1>
        <p>选出 10~20 部喜欢的百合作品,分析出你的「百合成分」,生成成分表卡片。</p>
        <p>无需登录·免费。做好的卡片可以带话题 <strong>#我的百合成分</strong> 分享到X。</p>
      </section>

      <section className="picked-panel">
        <div className="picked-head">
          <span className="count">已选作品 {n}<span style={{ fontSize: 14, color: "var(--muted)" }}>(10~20)</span></span>
          <span className="hint">选满 10 部即可分析,最多 20 部</span>
          {n > 0 && (
            <button className="clear" onClick={() => setSelected([])}>全部清空</button>
          )}
        </div>
        {n === 0 ? (
          <div className="picked-empty">请从下方搜索或「定番作品」中,选出 10~20 部喜欢的百合作品</div>
        ) : (
          <div className="picked-list">
            {selected.map((w) => (
              <span className="picked-chip" key={w.id}>
                {titleZh(w.title)}
                <button
                  className="x"
                  aria-label={`移除《${titleZh(w.title)}》`}
                  onClick={() => toggle(w)}
                >×</button>
              </span>
            ))}
          </div>
        )}
        <div className="submit-row">
          <input
            className="nick-input"
            value={nickname}
            maxLength={10}
            placeholder="昵称(可选),留空则显示「我」"
            onChange={(e) => setNickname(e.target.value)}
          />
          <button className="analyze-btn" disabled={!canAnalyze} onClick={submit}>
            进行成分分析
          </button>
          {!canAnalyze && n < MIN && (
            <span className="need-hint">还需选择 {MIN - n} 部作品才能分析</span>
          )}
          {maxed && <span className="need-hint warn">最多只能选 20 部,已达上限</span>}
        </div>
      </section>

      <h2 className="section-title">寻找作品</h2>
      <div className="search-box">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="按中文译名·日文原名·作者名搜索...(共1133部可选)"
        />
      </div>
      {debounced && (
        <div className="search-status">
          {searching ? "搜索中..." : results.length ? null : "没有找到相关作品"}
        </div>
      )}
      <div className="search-results">
        {results.map((w) => {
          const picked = selectedIds.has(w.id);
          return (
            <div className="search-row" key={w.id}>
              <CoverThumb work={w} />
              <div className="meta">
                <div className="t-zh">{titleZh(w.title)}</div>
                <div className="t-ja">{w.title}</div>
                <div className="t-author">
                  <span
                    className="genre-badge"
                    style={{ background: genreBadgeColor(w.genre) }}
                  >{genreZh(w.genre)}</span>{" "}
                  {w.author}
                </div>
              </div>
              <button
                className={`pick-btn${picked ? " picked" : ""}`}
                disabled={picked || maxed}
                onClick={() => toggle(w)}
              >
                {picked ? "已选择" : "＋ 选择"}
              </button>
            </div>
          );
        })}
      </div>

      <h2 className="section-title">从定番作品中选择</h2>
      <div className="staples">
        {staples.map((w) => {
          const picked = selectedIds.has(w.id);
          const label = titleZh(w.title);
          return (
            <button
              key={w.id}
              className="staple-chip"
              disabled={picked || maxed}
              title={`${label}(${w.title})`}
              onClick={() => toggle(w)}
            >
              {label.length > 18 ? label.slice(0, 18) + "…" : label}
            </button>
          );
        })}
      </div>

      <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 18 }}>
        想不出 10 部?也可以去原站试试只需回答心情的{" "}
        <a href="https://www.yurimiru.com/shindan" target="_blank" rel="noreferrer">百合类型诊断</a>
      </p>
    </main>
  );
}

export function CoverThumb({ work }: { work: Work }) {
  return <CoverImg work={work} className="thumb" alt="" />;
}
