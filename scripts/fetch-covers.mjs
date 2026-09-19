// 把全部作品封面下载到 dist/covers/,实现自托管
// 直连失败时自动走 wsrv.nl 图片代理(楽天 CDN 在部分网络不可达)
// 已存在的文件跳过,可重复运行
import fs from "node:fs";
import path from "node:path";

const works = JSON.parse(fs.readFileSync("src/data/works.json", "utf8"));
const outDir = path.join("dist", "covers");
fs.mkdirSync(outDir, { recursive: true });

const targets = works.filter((w) => w.cover_url);
let done = 0, direct = 0, proxied = 0, failed = 0;

async function fetchBuf(url, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return Buffer.from(await res.arrayBuffer());
  } finally {
    clearTimeout(t);
  }
}

async function dl(w) {
  const file = path.join(outDir, w.id.slice(0, 8) + ".jpg");
  if (fs.existsSync(file) && fs.statSync(file).size > 100) {
    done++;
    return;
  }
  // 直连 → wsrv.nl 代理(压缩到 600px JPEG)
  const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(w.cover_url)}&w=600&output=jpg&q=82`;
  for (const [label, url] of [["direct", w.cover_url], ["proxy", proxyUrl]]) {
    try {
      const buf = await fetchBuf(url);
      if (buf.length < 1000) throw new Error("too small: " + buf.length);
      fs.writeFileSync(file, buf);
      done++;
      if (label === "direct") direct++; else proxied++;
      return;
    } catch (e) {
      if (label === "proxy") {
        failed++;
        console.error("FAIL", w.id.slice(0, 8), "-", e.message);
      }
    }
  }
}

const queue = [...targets];
const t0 = Date.now();
await Promise.all(
  Array.from({ length: 12 }, async () => {
    while (queue.length) {
      const w = queue.shift();
      await dl(w);
    }
  })
);
console.log(
  `covers: ok=${done} (direct=${direct} proxied=${proxied}) failed=${failed} total=${targets.length} in ${((Date.now() - t0) / 1000).toFixed(0)}s`
);
if (done < targets.length * 0.5) {
  console.error("Over half of covers failed to download.");
  process.exit(1);
}
