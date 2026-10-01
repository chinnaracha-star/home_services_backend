const GENERIC_SERVICE_TERMS = [
  /^(?:ขอ|ช่วย|แสดง|ดู|หา|มี)?\s*(?:รายการ\s*)?บริการ(?:ทั้งหมด|อะไรบ้าง)?$/u,
  /^มีอะไร(?:ให้)?บริการ(?:บ้าง|อะไรบ้าง)?$/u,
  /^(?:ขอ|ช่วย|แสดง|ดู|หา)?\s*รายการ$/u,
  /^(?:ทั้งหมด|ทุกบริการ)$/u,
  /^(?:what|which|all|available)?\s*services?$/i,
  /^(?:show|list|find|available)\s+(?:all\s+)?services?$/i,
  /^(?:what|which)\s+services?\s+(?:do you offer|are available|do you have)\??$/i,
  /^service\s+list$/i,
];

const BROAD_SERVICE_LIST_REQUESTS = [
  /^(?:ขอ|ช่วย|แสดง|ดู|หา)?\s*(?:รายการ(?:บริการ)?|บริการทั้งหมด|บริการอะไรบ้าง|มีบริการอะไรบ้าง|มีอะไร(?:ให้)?บริการ(?:บ้าง|อะไรบ้าง)?)(?:หน่อย|ให้หน่อย)?[!?.,\s]*$/u,
  /^(?:what|which)\s+services?\s+(?:do you offer|are available|do you have)\??$/i,
  /^(?:list|show me|show)\s+(?:all\s+)?services?\s*[!?.,]*$/i,
];

function isGenericServiceTerm(term) {
  const normalized = term.trim().replace(/\s+/gu, " ");
  return GENERIC_SERVICE_TERMS.some((pattern) => pattern.test(normalized));
}

export function isBroadServiceListRequest(message) {
  if (typeof message !== "string") return false;
  const normalized = message.trim().replace(/\s+/gu, " ");
  return BROAD_SERVICE_LIST_REQUESTS.some((pattern) => pattern.test(normalized));
}

export function normalizeChatbotSearchTerms(searchTerms) {
  if (!Array.isArray(searchTerms)) return [];

  return [...new Set(
    searchTerms
      .map((term) => (typeof term === "string" ? term.trim() : ""))
      .filter(Boolean)
      .filter((term) => !isGenericServiceTerm(term)),
  )].slice(0, 5);
}
