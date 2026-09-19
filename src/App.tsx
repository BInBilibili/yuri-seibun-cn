import { useCallback, useEffect, useState } from "react";
import SelectPage from "./components/SelectPage";
import ResultPage from "./components/ResultPage";
import { workById } from "./data/core";

function parseQuery(): { ids: string[]; name: string } | null {
  const q = new URLSearchParams(window.location.search);
  const raw = q.get("ids");
  if (!raw) return null;
  const ids = raw.split(",").map((s) => s.trim()).filter((s) => workById.has(s));
  if (!ids.length) return null;
  return { ids, name: q.get("name") ?? "" };
}

export default function App() {
  const [route, setRoute] = useState(parseQuery);

  useEffect(() => {
    const onPop = () => setRoute(parseQuery());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const goResult = useCallback((ids: string[], name: string) => {
    const q = new URLSearchParams();
    q.set("ids", ids.join(","));
    if (name) q.set("name", name);
    window.history.pushState(null, "", `${window.location.pathname}?${q}`);
    setRoute({ ids, name });
    window.scrollTo(0, 0);
  }, []);

  const goSelect = useCallback(() => {
    window.history.pushState(null, "", window.location.pathname);
    setRoute(null);
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="page">
      <header className="site-head">
        <div className="logo">百</div>
        <span className="site-name">百合成分测试</span>
        <span className="tag-badge">#我的百合成分</span>
      </header>
      {route ? <ResultPage ids={route.ids} name={route.name} onBack={goSelect} /> : <SelectPage onAnalyze={goResult} />}
      <footer className="site-footer">
        非官方汉化复刻版 · 作品数据与灵感来源于
        ゆりみる(yurimiru.com) 百合成分チェッカー,作品名已替换为国内常见译名。
        封面图来自楽天ブックス / AniList,版权归各权利方所有。
      </footer>
    </div>
  );
}
