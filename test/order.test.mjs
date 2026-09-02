import { describe, expect, it, vi } from "vitest";
import { checkoutService } from "../src/services/order.service.mjs";
import { info } from "node:console";
import { runTransaction } from "../src/configs/db.mjs";

vi.mock("../src/repositories/order.repository.mjs", () => ({
  checkout: vi.fn(),
  postOrderRepository: vi.fn(),
  postOrderItemRepository: vi.fn(),
}));

vi.mock("../src/configs/db.mjs", () => ({
  runTransaction: vi.fn(),
  pool: { query: vi.fn() },
}));

describe("checkoutService", () => {
  // this one is already correct
  it("totalAmount less than or equal to zero", async () => {
    const checkoutData = {
      userId: 1,
      serviceId: 2,
      totalAmount: 0, // totalAmount is zero
      discount: 50,
      serviceDate: "2026-09-10",
      serviceTime: "10:00:00",
      address: "อาคารเดอะ ธารา เลขที่ 58/28 หมู่ 2 ถนนแจ้งวัฒนะ",
      province: "นนทบุรี",
      district: "ปากเกร็ด",
      subdistrict: "บางตลาด",
      latitude:13.901594444863845,
      longitude: 100.53133999511452,
      information: "",
      promotionCode: "HOME2012",
      paymentMethod: "card",
      paymentStatus: "succeeded",
      items: [{ optionId: 3, quantity: 1, unitPrice: 1000 }],
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

  it("items is not an array or items.length===0", async () => {
    const checkoutData = {
      userId: 1,
      serviceId: 2,
      totalAmount: 1000, 
      discount: 50,
      serviceDate: "2026-09-10",
      serviceTime: "10:00:00",
      address: "อาคารเดอะ ธารา เลขที่ 58/28 หมู่ 2 ถนนแจ้งวัฒนะ",
      province: "นนทบุรี",
      district: "ปากเกร็ด",
      subdistrict: "บางตลาด",
      latitude:13.901594444863845,
      longitude: 100.53133999511452,
      information: "",
      promotionCode: "HOME2012",
      paymentMethod: "card",
      paymentStatus: "succeeded",
      items: [], // items array is empty
    };

    await expect(checkoutService(checkoutData)).rejects.toMatchObject({
      name: "CheckoutError",
      stage: "order_items",
      message:
        "At least one order item is required",
      statusCode: 400,
      code: "INVALID_ORDER_ITEMS",
    });
  });

  it("item.optionId <= 0", async () => {
    const checkoutData = {
      userId: 1,
      serviceId: 2,
      totalAmount: 1000,
      discount: 50,
      serviceDate: "2026-09-10",
      serviceTime: "10:00:00",
      address: "อาคารเดอะ ธารา เลขที่ 58/28 หมู่ 2 ถนนแจ้งวัฒนะ",
      province: "นนทบุรี",
      district: "ปากเกร็ด",
      subdistrict: "บางตลาด",
      latitude:13.901594444863845,
      longitude: 100.53133999511452,
      information: "",
      promotionCode: "HOME2012",
      paymentMethod: "card",
      paymentStatus: "succeeded",
      items: [{ optionId: 0, quantity: 1, unitPrice: 1000 }], // optionId is invalid
    };

    await expect(checkoutService(checkoutData)).rejects.toMatchObject({
      name: "CheckoutError",
      stage: "validation",
      message:
        "items.optionId must be a positive whole number",
      statusCode: 400,
      code: "INVALID_CHECKOUT_DATA",
    });
  });


  it("item.quantity <= 0", async () => {
    const checkoutData = {
      userId: 1,
      serviceId: 2,
      totalAmount: 1000,
      discount: 50,
      serviceDate: "2026-09-10",
      serviceTime: "10:00:00",
      address: "อาคารเดอะ ธารา เลขที่ 58/28 หมู่ 2 ถนนแจ้งวัฒนะ",
      province: "นนทบุรี",
      district: "ปากเกร็ด",
      subdistrict: "บางตลาด",
      latitude:13.901594444863845,
      longitude: 100.53133999511452,
      information: "",
      promotionCode: "HOME2012",
      paymentMethod: "card",
      paymentStatus: "succeeded",
      items: [{ optionId: 3, quantity: 0, unitPrice: 1000 }], // quantity is invalid
    };

    await expect(checkoutService(checkoutData)).rejects.toMatchObject({
      name: "CheckoutError",
      stage: "validation",
      message:
        "items.quantity must be a positive whole number",
      statusCode: 400,
      code: "INVALID_CHECKOUT_DATA",
    });
  });

  it("item.unitPrice < 0", async () => {
    const checkoutData = {
      userId: 1,
      serviceId: 2,
      totalAmount: 1000,
      discount: 50,
      serviceDate: "2026-09-10",
      serviceTime: "10:00:00",
      address: "อาคารเดอะ ธารา เลขที่ 58/28 หมู่ 2 ถนนแจ้งวัฒนะ",
      province: "นนทบุรี",
      district: "ปากเกร็ด",
      subdistrict: "บางตลาด",
      latitude:13.901594444863845,
      longitude: 100.53133999511452,
      information: "",
      promotionCode: "HOME2012",
      paymentMethod: "card",
      paymentStatus: "succeeded",
      items: [{ optionId: 3, quantity: 1, unitPrice: -100 }], // unitPrice is invalid
    };

    await expect(checkoutService(checkoutData)).rejects.toMatchObject({
      name: "CheckoutError",
      stage: "order_items",
      message:
        "Each item must have a valid unitPrice",
      statusCode: 400,
      code: "INVALID_ORDER_ITEMS",
    });
  });



  // at repository level: exercise the real `checkout` implementation, mocking
  // only the database transaction, not the repository module itself.
  // unit test: do not call real checkout function
  it("promotion_id is not available in promotions table", async () => {
    const mockClient = {
      // simulate no matching row for the promotion lookup query
      query: vi.fn().mockResolvedValue({ rows: [] }),
    };
    runTransaction.mockImplementation((callback) => callback(mockClient));

    const { checkout } = await vi.importActual(
      "../src/repositories/order.repository.mjs",
    );

    const checkoutData = {
      userId: 1,
      serviceId: 2,
      totalAmount: 1000,
      discount: 50,
      serviceDate: "2026-09-10",
      serviceTime: "10:00:00",
      address: "อาคารเดอะ ธารา เลขที่ 58/28 หมู่ 2 ถนนแจ้งวัฒนะ",
      province: "นนทบุรี",
      district: "ปากเกร็ด",
      subdistrict: "บางตลาด",
      latitude:13.901594444863845,
      longitude: 100.53133999511452,
      information: "",
      promotionCode: "???",
      paymentMethod: "card",
      paymentStatus: "succeeded",
      items: [{ optionId: 3, quantity: 1, unitPrice: 1000 }],
    };

    await expect(checkout(checkoutData)).rejects.toMatchObject({
      stage: "promotion",
      message: "Promotion code was not found or is inactive",
      statusCode: 400,
      code: "INVALID_PROMOTION",
    });

    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining("FROM promotions"),
      ["???"],
    );
  });


  // integration test : call real checkout function
  it("promotion's used quota is over quota", async () => {
    const mockClient = {
      // simulate a promotion row whose used quota already reached its limit
      query: vi
        .fn()
        .mockResolvedValue({ rows: [{ promotion_id: 5, quota: 10, quota_used: 10 }] }),
    };
    runTransaction.mockImplementation((callback) => callback(mockClient));

    const { checkout } = await vi.importActual(
      "../src/repositories/order.repository.mjs",
    );

    const checkoutData = {
      userId: 1,
      serviceId: 2,
      totalAmount: 1000,
      discount: 50,
      serviceDate: "2026-09-10",
      serviceTime: "10:00:00",
      address: "อาคารเดอะ ธารา เลขที่ 58/28 หมู่ 2 ถนนแจ้งวัฒนะ",
      province: "นนทบุรี",
      district: "ปากเกร็ด",
      subdistrict: "บางตลาด",
      latitude:13.901594444863845,
      longitude: 100.53133999511452,
      information: "",
      promotionCode: "ONEPRO002", // this promotion used quota is full
      paymentMethod: "card",
      paymentStatus: "succeeded",
      items: [{ optionId: 3, quantity: 1, unitPrice: 1000 }],
    };

    await expect(checkout(checkoutData)).rejects.toMatchObject({
      stage: "promotion",
      message: "Promotion code quota has been reached",
      statusCode: 409,
      code: "PROMOTION_QUOTA_EXCEEDED",
    });

    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining("FROM promotions"),
      ["ONEPRO002"],
    );
  });




  it("paymentMethod is not text or blank", async () => {
    const checkoutData = {
      userId: 1,
      serviceId: 2,
      totalAmount: 1000,
      discount: 50,
      serviceDate: "2026-09-10",
      serviceTime: "10:00:00",
      address: "อาคารเดอะ ธารา เลขที่ 58/28 หมู่ 2 ถนนแจ้งวัฒนะ",
      province: "นนทบุรี",
      district: "ปากเกร็ด",
      subdistrict: "บางตลาด",
      latitude:13.901594444863845,
      longitude: 100.53133999511452,
      information: "",
      promotionCode: "HOME2012",
      paymentMethod: "", // payment method is blank
      paymentStatus: "succeeded",
      items: [{ optionId: 3, quantity: 1, unitPrice: 1000 }],
    };

    await expect(checkoutService(checkoutData)).rejects.toMatchObject({
      name: "CheckoutError",
      stage: "validation",
      message:
        "paymentMethod is required",
      statusCode: 400,
      code: "INVALID_CHECKOUT_DATA",
    });
  });


  it("paymentStatus is not text or blank", async () => {
    const checkoutData = {
      userId: 1,
      serviceId: 2,
      totalAmount: 1000,
      discount: 50,
      serviceDate: "2026-09-10",
      serviceTime: "10:00:00",
      address: "อาคารเดอะ ธารา เลขที่ 58/28 หมู่ 2 ถนนแจ้งวัฒนะ",
      province: "นนทบุรี",
      district: "ปากเกร็ด",
      subdistrict: "บางตลาด",
      latitude:13.901594444863845,
      longitude: 100.53133999511452,
      information: "",
      promotionCode: "HOME2012",
      paymentMethod: "card",
      paymentStatus: "", // payment status is blank
      items: [{ optionId: 3, quantity: 1, unitPrice: 1000 }],
    };

    await expect(checkoutService(checkoutData)).rejects.toMatchObject({
      name: "CheckoutError",
      stage: "validation",
      message:
        "paymentStatus is required",
      statusCode: 400,
      code: "INVALID_CHECKOUT_DATA",
    });
  });

  it("serviceDate is not text or blank", async () => {
    const checkoutData = {
      userId: 1,
      serviceId: 2,
      totalAmount: 1000,
      discount: 50,
      serviceDate: "", // serviceDate status is blank
      serviceTime: "10:00:00",
      address: "อาคารเดอะ ธารา เลขที่ 58/28 หมู่ 2 ถนนแจ้งวัฒนะ",
      province: "นนทบุรี",
      district: "ปากเกร็ด",
      subdistrict: "บางตลาด",
      latitude:13.901594444863845,
      longitude: 100.53133999511452,
      information: "",
      promotionCode: "HOME2012",
      paymentMethod: "card",
      paymentStatus: "succeeded",
      items: [{ optionId: 3, quantity: 1, unitPrice: 1000 }],
    };

    await expect(checkoutService(checkoutData)).rejects.toMatchObject({
      name: "CheckoutError",
      stage: "validation",
      message:
        "serviceDate is required",
      statusCode: 400,
      code: "INVALID_CHECKOUT_DATA",
    });
  });

  it("serviceTime is not text or blank", async () => {
    const checkoutData = {
      userId: 1,
      serviceId: 2,
      totalAmount: 1000,
      discount: 50,
      serviceDate: "2026-09-10",
      serviceTime: "", // serviceTime status is blank
      address: "อาคารเดอะ ธารา เลขที่ 58/28 หมู่ 2 ถนนแจ้งวัฒนะ",
      province: "นนทบุรี",
      district: "ปากเกร็ด",
      subdistrict: "บางตลาด",
      latitude:13.901594444863845,
      longitude: 100.53133999511452,
      information: "",
      promotionCode: "HOME2012",
      paymentMethod: "card",
      paymentStatus: "succeeded",
      items: [{ optionId: 3, quantity: 1, unitPrice: 1000 }],
    };

    await expect(checkoutService(checkoutData)).rejects.toMatchObject({
      name: "CheckoutError",
      stage: "validation",
      message:
        "serviceTime is required",
      statusCode: 400,
      code: "INVALID_CHECKOUT_DATA",
    });
  });


  it("address is not text or blank", async () => {
    const checkoutData = {
      userId: 1,
      serviceId: 2,
      totalAmount: 1000,
      discount: 50,
      serviceDate: "2026-09-10",
      serviceTime: "10:00:00",
      address: "", // address status is blank
      province: "นนทบุรี",
      district: "ปากเกร็ด",
      subdistrict: "บางตลาด",
      latitude:13.901594444863845,
      longitude: 100.53133999511452,
      information: "",
      promotionCode: "HOME2012",
      paymentMethod: "card",
      paymentStatus: "succeeded",
      items: [{ optionId: 3, quantity: 1, unitPrice: 1000 }],
    };

    await expect(checkoutService(checkoutData)).rejects.toMatchObject({
      name: "CheckoutError",
      stage: "validation",
      message:
        "address is required",
      statusCode: 400,
      code: "INVALID_CHECKOUT_DATA",
    });
  });

  // 
  it("province is not text or blank", async () => {
    const checkoutData = {
      userId: 1,
      serviceId: 2,
      totalAmount: 1000,
      discount: 50,
      serviceDate: "2026-09-10",
      serviceTime: "10:00:00",
      address: "อาคารเดอะ ธารา เลขที่ 58/28 หมู่ 2 ถนนแจ้งวัฒนะ",
      province: "", // province status is blank
      district: "ปากเกร็ด",
      subdistrict: "บางตลาด",
      latitude:13.901594444863845,
      longitude: 100.53133999511452,
      information: "",
      promotionCode: "HOME2012",
      paymentMethod: "card",
      paymentStatus: "succeeded",
      items: [{ optionId: 3, quantity: 1, unitPrice: 1000 }],
    };

    await expect(checkoutService(checkoutData)).rejects.toMatchObject({
      name: "CheckoutError",
      stage: "validation",
      message:
        "province is required",
      statusCode: 400,
      code: "INVALID_CHECKOUT_DATA",
    });
  });


  it("district is not text or blank", async () => {
    const checkoutData = {
      userId: 1,
      serviceId: 2,
      totalAmount: 1000,
      discount: 50,
      serviceDate: "2026-09-10",
      serviceTime: "10:00:00",
      address: "อาคารเดอะ ธารา เลขที่ 58/28 หมู่ 2 ถนนแจ้งวัฒนะ",
      province: "นนทบุรี",
      district: "", // district status is blank
      subdistrict: "บางตลาด",
      latitude:13.901594444863845,
      longitude: 100.53133999511452,
      information: "",
      promotionCode: "HOME2012",
      paymentMethod: "card",
      paymentStatus: "succeeded",
      items: [{ optionId: 3, quantity: 1, unitPrice: 1000 }],
    };

    await expect(checkoutService(checkoutData)).rejects.toMatchObject({
      name: "CheckoutError",
      stage: "validation",
      message:
        "district is required",
      statusCode: 400,
      code: "INVALID_CHECKOUT_DATA",
    });
  });

  it("subdistrict is not text or blank", async () => {
    const checkoutData = {
      userId: 1,
      serviceId: 2,
      totalAmount: 1000,
      discount: 50,
      serviceDate: "2026-09-10",
      serviceTime: "10:00:00",
      address: "อาคารเดอะ ธารา เลขที่ 58/28 หมู่ 2 ถนนแจ้งวัฒนะ",
      province: "นนทบุรี",
      district: "ปากเกร็ด",
      subdistrict: "", // subdistrict status is blank
      latitude:13.901594444863845,
      longitude: 100.53133999511452,
      information: "",
      promotionCode: "HOME2012",
      paymentMethod: "card",
      paymentStatus: "succeeded",
      items: [{ optionId: 3, quantity: 1, unitPrice: 1000 }],
    };

    await expect(checkoutService(checkoutData)).rejects.toMatchObject({
      name: "CheckoutError",
      stage: "validation",
      message:
        "subdistrict is required",
      statusCode: 400,
      code: "INVALID_CHECKOUT_DATA",
    });
  });

  it("latitude is not in the range -90 to 90", async () => {
  const checkoutData = {
      userId: 1,
      serviceId: 2,
      totalAmount: 1000,
      discount: 50,
      serviceDate: "2026-09-10",
      serviceTime: "10:00:00",
      address: "อาคารเดอะ ธารา เลขที่ 58/28 หมู่ 2 ถนนแจ้งวัฒนะ",
      province: "นนทบุรี",
      district: "ปากเกร็ด",
      subdistrict: "บางตลาด",
      latitude:100, // latitude is out of range -90 to 90
      longitude: 100.53133999511452,
      information: "",
      promotionCode: "HOME2012",
      paymentMethod: "card",
      paymentStatus: "succeeded",
      items: [{ optionId: 3, quantity: 1, unitPrice: 1000 }],
    };

    await expect(checkoutService(checkoutData)).rejects.toMatchObject({
      name: "CheckoutError",
      stage: "validation",
      message:
        "latitude is required and must be a valid coordinate",
      statusCode: 400,
      code: "INVALID_CHECKOUT_DATA",
    });
  });


  it("longitude is not in the range -180 to 180", async () => {
    const checkoutData = {
      userId: 1,
      serviceId: 2,
      totalAmount: 1000,
      discount: 50,
      serviceDate: "2026-09-10",
      serviceTime: "10:00:00",
      address: "อาคารเดอะ ธารา เลขที่ 58/28 หมู่ 2 ถนนแจ้งวัฒนะ",
      province: "นนทบุรี",
      district: "ปากเกร็ด",
      subdistrict: "บางตลาด",
      latitude: 13.901594444863845,
      longitude: 200, // longitude is out of range -90 to 90
      information: "",
      promotionCode: "HOME2012",
      paymentMethod: "card",
      paymentStatus: "succeeded",
      items: [{ optionId: 3, quantity: 1, unitPrice: 1000 }],
    };

    await expect(checkoutService(checkoutData)).rejects.toMatchObject({
      name: "CheckoutError",
      stage: "validation",
      message:
        "longitude is required and must be a valid coordinate",
      statusCode: 400,
      code: "INVALID_CHECKOUT_DATA",
    });
  });

});











