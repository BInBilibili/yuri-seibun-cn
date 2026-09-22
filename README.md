# 百合成分测试(中文汉化版)

ゆりみる(yurimiru.com)「百合成分チェッカー」的**非官方中文汉化复刻版**。
选出 10~20 部喜欢的百合作品,分析出你的「百合成分」,生成药检单风格的成分表卡片。

## 与原站的差异

- **选择数量:10~20 部**(原站为 5 部),不足 10 部不能分析,满 20 部封顶。
- 全部界面与 941 个去重作品名均已汉化,作品名以**国内常见译名**为主、日文原名小字标注;无通行译名的作品按含义意译。
- 搜索同时匹配中文译名 / 日文原名 / 作者名。
- 封面图**自托管**:1012 张封面已下载进仓库 `public/covers/`(楽天 CDN 在部分网络不可达),本地加载失败时自动回退原始 URL / 占位图。
- 不包含原站的登录、收藏、心愿单与联盟广告;推荐区、X/LINE 分享、卡片图片保存(html2canvas)均已实现。

## 算法(与原站一致)

- 每部作品按标签映射到 5 个成分(糖度/尊贵度/严肃度/日常度/刺激度,37 个标签位),命中 +50;恋爱百合作品糖度额外 +50。
- 各作品向量取平均,再加由 ids 决定性的 ±4 扰动;全零向量时给出 ids 决定的伪随机兜底分布。
- 诊断类型 = (主导成分, 次位成分) 有序对,共 20 种;另按主导成分给出 5 种药典风格脚注。
- 「百合成分检查 第 N 号」为 ids 的确定性哈希,同一组合结果恒定。

## 开发

```bash
npm install
npm run dev        # 本地开发(http://localhost:5173/yuri-seibun-cn/)
npm run check      # TypeScript 类型检查
npm run build      # 构建到 dist/
node scripts/fetch-covers.mjs   # 可选:本地也下载封面(需能访问楽天/AniList)
```

## 数据

- `src/data/works.json`:1133 部作品快照(标题/作者/类型/标签/恋爱百合标记/封面/卷数),取自原站公开的 Supabase REST 接口。
- `src/data/translations.json`:941 个去重作品名的中文译名对照表。
- `src/data/staples.json`:24 部定番作品(与原站页面顺序一致)。
- `src/data/meta.json`:标签译名、成分定义、20 种诊断类型、脚注与全部 UI 文案。
- 数据为部署日快照,不随原站自动更新。

## 部署

推送到 `main` 后由 GitHub Actions 自动构建并发布到 GitHub Pages:

1. 仓库 **Settings → Pages → Source** 选 **GitHub Actions**。
2. 推送 `main`(或在 Actions 页手动 `Run workflow`)。
3. 站点地址 `https://<用户名>.github.io/yuri-seibun-cn/`,与 `vite.config.ts` 的 `base: "/yuri-seibun-cn/"` 对应;换成别的仓库名需同步改 `base`。

工作流见 `.github/workflows/deploy.yml`(check → build → upload-pages-artifact → deploy-pages)。

本地预览:

```bash
npm run build && npm run preview
```

封面已随仓库提供(`public/covers/`),`vite build` 会自动复制进 `dist/covers/`,无需在构建期联网。
如需增量更新封面(已存在的文件跳过):

```bash
node scripts/fetch-covers.mjs
```

## 版权说明

- 原站设计与玩法灵感来源于 [ゆりみる 百合成分チェッカー](https://www.yurimiru.com/seibun),本项目为独立实现,仅供学习交流。
- 封面图来自楽天ブックス / AniList,作品名与封面版权归各权利方所有。
