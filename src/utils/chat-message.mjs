export function normalizeChatMessage(value) {
  if (typeof value !== "string") return null;

  const content = value.trim();
  return content && content.length <= 2000 ? content : null;
}
