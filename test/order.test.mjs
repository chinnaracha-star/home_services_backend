import test from "node:test";
import assert from "node:assert/strict";
import { checkoutService } from "../src/services/order.service.mjs";

const validCheckoutPayload = {
    userId: 1,
    serviceId: 2,
    totalAmount: 1000,
    discount: 50,
    serviceDate: "2026-08-31",
    serviceTime: "14:00:00",
    address: "อาคารเดอะ ธารา เลขที่ 58/28 หมู่ 2 ถนนแจ้งวัฒนะ",
    province: "นนทบุรี",
    district: "ปากเกร็ด",
    subdistrict: "บางตลาด",
    information: "",
    promotionCode: "HOME2012",
    paymentMethod: "card",
    paymentStatus: "succeeded",
    items: [{
        optionId: 3,
        quantity: 1,
        unitPrice: 1000,
    }],
};

test("totalAmount or discount <= 0", async () => {
    const requestBody = {
        ...validCheckoutPayload,
        totalAmount: 0,
    };

    // checkoutService is async, so it returns a rejected Promise — not a thrown sync error.
    // assert.rejects waits for that Promise and gives you the error object
    // (statusCode lives on the error, not on a return value).
    await assert.rejects(
        () => checkoutService(requestBody),
        (error) => {
            assert.equal(error.message, "totalAmount and discount are invalid");
            assert.equal(error.statusCode, 400);
            assert.equal(error.code, "INVALID_CHECKOUT_DATA");
            assert.equal(error.stage, "validation");
            return true;
        },
    );
});

// ใช้วิธีเดียวกับอันที่ 2
test("items is not an array or items.length===0", () => {});

// ใช้วิธีเดียวกับอันที่ 2
test("item.optionId <= 0", () => {});

// ใช้วิธีเดียวกับอันที่ 2
test("item.quantity <= 0", () => {});

// ใช้วิธีเดียวกับอันที่ 2
test("item.unitPrice <= 0", () => {});

test("promotion_id is not available in promotions table", () => {
    const requestBody = {
        ...validCheckoutPayload,
        promotionCode: "???",
    };
});

test("promotion's used quota is over quota", () => {
    const requestBody = {
        ...validCheckoutPayload,
        promotionCode: "ONEPRO002",
    };
});
