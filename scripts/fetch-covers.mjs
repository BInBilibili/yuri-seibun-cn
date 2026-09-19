// 部署期把全部作品封面下载到 dist/covers/,实现自托管
// 本地/CI 有缓存时跳过已下载文件;失败项跳过(前端回退远端/占位)
import fs from "node:fs";
import path from "node:path";

const works = JSON.parse(fs.readFileSync("src/data/works.json", "utf8"));
const outDir = path.join("dist", "covers");
fs.mkdirSync(outDir, { recursive: true });

const targets = works.filter((w) => w.cover_url);
let done = 0, skipped = 0, failed = 0;

async function dl(w) {
  const file = path.join(outDir, w.id.slice(0, 8) + ".jpg");
  if (fs.existsSync(file) && fs.statSync(file).size > 100) {
    skipped++;
    return;
  }
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 20000);
    const res = await fetch(w.cover_url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    clearTimeout(t);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1000) throw new Error("too small: " + buf.length);
    fs.writeFileSync(file, buf);
    done++;
  } catch (e) {
    failed++;
    console.error("FAIL", w.id.slice(0, 8), w.cover_url.slice(0, 60), "-", e.message);
  }
}

const queue = [...targets];
await Promise.all(
  Array.from({ length: 12 }, async () => {
    while (queue.length) {
      const w = queue.shift();
      await dl(w);
    }
  })
);
console.log(`covers: downloaded=${done} cached=${skipped} failed=${failed} total=${targets.length}`);
if (done + skipped < targets.length * 0.5) {
  console.error("Over half of covers failed to download — aborting deploy.");
  process.exit(1);
}
