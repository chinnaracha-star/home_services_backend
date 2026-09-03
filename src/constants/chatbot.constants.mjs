export const CHAT_MAX_MESSAGE_LENGTH = 1000;
export const CHAT_HISTORY_LIMIT = 10;
export const CHAT_HISTORY_DISPLAY_LIMIT = 100;
export const CHAT_RETENTION_DAYS = 90;

export const OUT_OF_SCOPE_MESSAGES = {
  th: "ขออภัยครับ ผมช่วยตอบได้เฉพาะเรื่องบริการและการใช้งาน HomeService เท่านั้น",
  en: "Sorry, I can only help with HomeService services and how to use HomeService.",
};

export const SERVICE_NOT_FOUND_MESSAGES = {
  th: "ขณะนี้ไม่พบข้อมูลบริการดังกล่าวในระบบ HomeService",
  en: "That service is not currently listed in HomeService.",
};

export const BOOKING_ACTION_MESSAGES = {
  th: "ขออภัยครับ ผมยังไม่สามารถจองบริการหรือสร้างคำสั่งซื้อแทนคุณได้ แต่ผมช่วยแนะนำบริการ ราคา และขั้นตอนการจองให้ได้ครับ",
  en: "Sorry, I cannot book a service or create an order for you. I can help you choose a service, check listed prices, and explain the booking steps.",
};

export const SMALL_TALK_MESSAGES = {
  th: {
    greeting: "สวัสดีครับ ยินดีให้บริการ HomeService มีอะไรให้ช่วยไหมครับ",
    thanks: "ยินดีครับ หากต้องการสอบถามบริการหรือราคา บอกผมได้เลยครับ",
    greetingThanks: "สวัสดีครับ ขอบคุณที่ติดต่อ HomeService มีอะไรให้ช่วยไหมครับ",
  },
  en: {
    greeting: "Hello! Welcome to HomeService. How can I help you?",
    thanks: "You're welcome! Ask me about HomeService services or prices anytime.",
    greetingThanks: "Hello! Thank you for contacting HomeService. How can I help you?",
  },
};
