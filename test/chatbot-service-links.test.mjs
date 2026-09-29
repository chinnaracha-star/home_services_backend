import test from "node:test";
import assert from "node:assert/strict";
import { parseServiceAnswer } from "../src/services/chatbot.service.mjs";

test("service links use only known IDs explicitly named in the answer", () => {
  const context = [
    { id: "12", name: "ล้างแอร์" },
    { id: "13", name: "ซ่อมแอร์" },
  ];
  const answer = parseServiceAnswer(JSON.stringify({
    message: "แนะนำล้างแอร์ โดยช่างจะตรวจสอบอาการก่อน",
    serviceIds: ["12", "13", "999", "12"],
  }), context);

  assert.deepEqual(answer.serviceLinks, [{
    id: "12",
    name: "ล้างแอร์",
    href: "/service-details/12",
    available: true,
  }]);
});

test("generic answers do not attach service links", () => {
  const answer = parseServiceAnswer(JSON.stringify({
    message: "เลือกหมวดหมู่บริการที่ต้องการได้ในแอป",
    serviceIds: [],
  }), [{ id: "12", name: "ล้างแอร์" }]);
  assert.deepEqual(answer.serviceLinks, []);
});

test("all explicitly recommended catalog services receive links", () => {
  const answer = parseServiceAnswer(JSON.stringify({
    message: "แนะนำล้างแอร์และซ่อมแอร์",
    serviceIds: ["12", "13"],
  }), [
    { id: "12", name: "ล้างแอร์" },
    { id: "13", name: "ซ่อมแอร์" },
  ]);
  assert.deepEqual(answer.serviceLinks.map((link) => link.href), [
    "/service-details/12",
    "/service-details/13",
  ]);
});
