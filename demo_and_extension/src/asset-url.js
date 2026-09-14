export function assetImageUrl(image) {
  const raw = typeof image?.path === "string" ? image.path.trim() : "";
  if (!raw) return null;
  if (/^(?:https?:|data:|blob:)/i.test(raw)) return raw;
  return `/${raw.replace(/^[/\\]+/, "")}`;
}
