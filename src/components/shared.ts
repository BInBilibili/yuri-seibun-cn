export function genreBadgeColor(genre: string): string {
  switch (genre) {
    case "漫画": return "#e91e8c";
    case "小説": return "#8b5cf6";
    case "アニメ": return "#f97316";
    case "Web漫画": return "#06b6d4";
    default: return "#9ca3af";
  }
}

export function fmt(text: string, params: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? ""));
}
