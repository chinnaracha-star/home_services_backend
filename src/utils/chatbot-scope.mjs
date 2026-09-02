const HOME_SERVICE_TERMS = [
  /บริการ|ช่าง|ซ่อม|ติดตั้ง|ล้าง|ทำความสะอาด|แอร์|เครื่องซักผ้า|เครื่องใช้ไฟฟ้า|จอง|ราคา|ค่าบริการ|โปรโมชั่น|ชำระ|ออเดอร์|คำสั่งซื้อ/u,
  /home\s*service|service|technician|repair|install|clean|air\s*con|washing machine|booking|price|promotion|payment|order/i,
];

const CLEARLY_UNRELATED_TERMS = [
  /เขียนโปรแกรม|เขียนโค้ด|การบ้าน|หุ้น|แต่งเพลง|ประธานาธิบดี|ดูดวง|ฟุตบอล/u,
  /write (?:code|a program)|homework|stock market|compose a song|president|horoscope|football/i,
];

export function detectChatLanguage(message) {
  return /[\u0E00-\u0E7F]/u.test(message) ? "th" : "en";
}

export function isClearlyOutOfScope(message) {
  if (HOME_SERVICE_TERMS.some((pattern) => pattern.test(message))) return false;
  return CLEARLY_UNRELATED_TERMS.some((pattern) => pattern.test(message));
}
