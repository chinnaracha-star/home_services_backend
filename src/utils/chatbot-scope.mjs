const HOME_SERVICE_TERMS = [
  /บริการ|ช่าง|ซ่อม|ติดตั้ง|ล้าง|ทำความสะอาด|แอร์|เครื่องซักผ้า|เครื่องใช้ไฟฟ้า|จอง|ราคา|ค่าบริการ|โปรโมชั่น|ชำระ|ออเดอร์|คำสั่งซื้อ/u,
  /home\s*service|service|technician|repair|install|clean|air\s*con|washing machine|booking|price|promotion|payment|order/i,
];

const CLEARLY_UNRELATED_TERMS = [
  /เขียนโปรแกรม|เขียนโค้ด|เขียน\s*(?:React|component)|การบ้าน|หุ้น|แต่งเพลง|ประธานาธิบดี|ดูดวง|ฟุตบอล/iu,
  /write (?:code|a program|a component)|React component|homework|stock market|compose a song|president|horoscope|football/i,
];

const GREETING_PATTERN = /^(?:สวัสดี|หวัดดี)(?:\s*(?:ครับ|ค่ะ|คะ|จ้า|จ๊ะ|นะครับ|นะคะ))?(?:\s*(?:บอท|bot))?[\s!?.,]*$|^(?:hello|hi|hey)(?:\s+(?:there|bot|assistant))?[\s!?.,]*$/iu;
const THANKS_PATTERN = /^(?:ขอบคุณ|ขอบใจ)(?:\s*(?:มาก|ครับ|ค่ะ|คะ|นะครับ|นะคะ))*[\s!?.,]*$|^(?:thanks|thank you)(?:\s+(?:very much|so much|again))?[\s!?.,]*$/iu;

export function detectChatLanguage(message) {
  return /[\u0E00-\u0E7F]/u.test(message) ? "th" : "en";
}

export function isGreeting(message) {
  return GREETING_PATTERN.test(message.trim());
}

export function isThanks(message) {
  return THANKS_PATTERN.test(message.trim());
}

export function isClearlyOutOfScope(message) {
  if (HOME_SERVICE_TERMS.some((pattern) => pattern.test(message))) return false;
  return CLEARLY_UNRELATED_TERMS.some((pattern) => pattern.test(message));
}

export function isBookingActionRequest(message) {
  return [
    /(?:ช่วย|กรุณา).*(?:จอง|สั่ง|ยกเลิก|เลื่อน|เปลี่ยนวัน).*(?:ให้|แทน)|(?:จอง|สั่ง|ยกเลิก|เลื่อน|เปลี่ยนวัน).*(?:ให้หน่อย|แทน)/u,
    /(?:book|order|cancel|reschedule|change).*(?:for me|on my behalf)/i,
  ].some((pattern) => pattern.test(message));
}
