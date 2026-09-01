import { describe, expect, it, vi } from "vitest";
import { checkoutService } from "../src/services/order.service.mjs";

vi.mock("../src/repositories/order.repository.mjs", () => ({
  checkout: vi.fn(),
  postOrderRepository: vi.fn(),
  postOrderItemRepository: vi.fn(),
}));

describe("checkoutService", () => {
  it("rejects an invalid totalAmount", async () => {
    const checkoutData = {
      userId: 1,
      serviceId: 1,
      totalAmount: 0,
      discount: 0,
      paymentMethod: "promptpay",
      paymentStatus: "pending",
      serviceDate: "2026-09-10",
      serviceTime: "10:00",
      address: "123 Main Street",
      province: "Bangkok",
      district: "Pathum Wan",
      subdistrict: "Lumphini",
      items: [{ optionId: 1, quantity: 1, unitPrice: 500 }],
    };

    await expect(checkoutService(checkoutData)).rejects.toMatchObject({
      name: "CheckoutError",
      stage: "validation",
      message:
        "totalAmount must be a positive finite number and discount must be a non-negative finite number",
      statusCode: 400,
      code: "INVALID_CHECKOUT_DATA",
    });
  });
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
