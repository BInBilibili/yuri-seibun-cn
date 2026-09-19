import { useState } from "react";
import type { Work } from "../data/types";

/**
 * 封面三级回退:本地自托管(部署时下载) → 原始远端 URL → 占位
 * 本地文件名 = 作品 UUID 前 8 位 + .jpg(fetch-covers.mjs 产出)
 */
export default function CoverImg({
  work,
  className,
  alt
}: {
  work: Work;
  className?: string;
  alt?: string;
}) {
  const [stage, setStage] = useState(0); // 0=本地 1=远端 2=占位
  const base = import.meta.env.BASE_URL;
  const local = `${base}covers/${work.id.slice(0, 8)}.jpg`;
  const remote = work.cover_url;

  if (stage === 2 || (stage >= 1 && !remote)) {
    return <div className={className ? `${className}-fallback` : ""}>封面暂缺</div>;
  }
  return (
    <img
      className={className}
      src={stage === 0 ? local : remote}
      alt={alt ?? ""}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setStage((s) => s + 1)}
    />
  );
}
