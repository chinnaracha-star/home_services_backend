import { HttpError } from "../utils/http-error.mjs";
import {
  insertReview,
  findReviewByOrderCode,
  findReviewByOrderId,
  findReviews,
  getReviewStatsByServiceId,
  deleteReviewByOrderCode,
  updateReviewByOrderCode,
} from "../repositories/review.repository.mjs";


export async function createReview(req, res, next) {
  try {
    const {
      orderCode,
      orderId,
      rating,
      comment,
      serviceId,
      serviceName,
      technicianId,
      technicianName,
      userName: bodyUserName,
    } = req.body || {};

    if (!orderCode && !orderId) {
      throw new HttpError(400, "กรุณาระบุรหัสคำสั่งซ่อม (orderCode หรือ orderId)", "MISSING_ORDER_IDENTIFIER");
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5 || !Number.isInteger(numericRating)) {
      throw new HttpError(400, "คะแนนต้องเป็นจำนวนเต็มระหว่าง 1 ถึง 5", "INVALID_RATING");
    }

    // Check if already reviewed
    const existingReview = orderCode
      ? await findReviewByOrderCode(orderCode)
      : await findReviewByOrderId(orderId);

    if (existingReview) {
      throw new HttpError(409, "คำสั่งซ่อมนี้ได้รับการรีวิวไปแล้ว", "REVIEW_ALREADY_EXISTS");
    }

    const userId = req.user?.id || req.user?.userId || null;
    const userEmail = req.user?.email || null;
    const userName = req.user?.fullName || req.user?.displayName || bodyUserName || null;

    const newReview = await insertReview({
      orderCode: orderCode || orderId,
      orderId: orderId || null,
      userId,
      userEmail,
      userName,
      serviceId: serviceId || null,
      serviceName: serviceName || null,
      technicianId: technicianId || null,
      technicianName: technicianName || null,
      rating: numericRating,
      comment: typeof comment === "string" ? comment.trim() : "",
    });

    res.status(201).json({
      success: true,
      message: "บันทึกรีวิวสำเร็จ ขอบคุณสำหรับความคิดเห็นของคุณ",
      data: newReview,
    });
  } catch (error) {
    next(error);
  }
}

export async function getReviews(req, res, next) {
  try {
    const { serviceId, technicianId, userId, limit = 50, offset = 0 } = req.query;

    const reviews = await findReviews({
      serviceId: serviceId ? String(serviceId) : null,
      technicianId: technicianId ? String(technicianId) : null,
      userId: userId ? String(userId) : null,
      limit: Math.min(Number(limit) || 50, 100),
      offset: Number(offset) || 0,
    });

    res.status(200).json({
      success: true,
      data: reviews,
      count: reviews.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function getReviewByOrder(req, res, next) {
  try {
    const { orderCode } = req.params;
    if (!orderCode) {
      throw new HttpError(400, "กรุณาระบุรหัสคำสั่งซ่อม", "MISSING_ORDER_CODE");
    }

    const review = await findReviewByOrderCode(orderCode);

    res.status(200).json({
      success: true,
      data: review,
      isReviewed: Boolean(review),
    });
  } catch (error) {
    next(error);
  }
}

export async function getServiceStats(req, res, next) {
  try {
    const { serviceId } = req.params;
    if (!serviceId) {
      throw new HttpError(400, "กรุณาระบุรหัสบริการ", "MISSING_SERVICE_ID");
    }

    const stats = await getReviewStatsByServiceId(serviceId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteReview(req, res, next) {
  try {
    const { orderCode } = req.params;
    if (!orderCode) {
      throw new HttpError(400, "กรุณาระบุรหัสคำสั่งซ่อม", "MISSING_ORDER_CODE");
    }

    const deletedReview = await deleteReviewByOrderCode(orderCode);
    if (!deletedReview) {
      throw new HttpError(404, "ไม่พบข้อมูลรีวิวสำหรับคำสั่งซ่อมนี้", "REVIEW_NOT_FOUND");
    }

    res.status(200).json({
      success: true,
      message: "ยกเลิกรีวิวเรียบร้อยแล้ว",
      data: deletedReview,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateReview(req, res, next) {
  try {
    const { orderCode } = req.params;
    const { rating, comment } = req.body || {};

    if (!orderCode) {
      throw new HttpError(400, "กรุณาระบุรหัสคำสั่งซ่อม", "MISSING_ORDER_CODE");
    }

    let numericRating = undefined;
    if (rating !== undefined) {
      numericRating = Number(rating);
      if (isNaN(numericRating) || numericRating < 1 || numericRating > 5 || !Number.isInteger(numericRating)) {
        throw new HttpError(400, "คะแนนต้องเป็นจำนวนเต็มระหว่าง 1 ถึง 5", "INVALID_RATING");
      }
    }

    const updatedReview = await updateReviewByOrderCode(orderCode, {
      rating: numericRating,
      comment,
    });

    if (!updatedReview) {
      throw new HttpError(404, "ไม่พบข้อมูลรีวิวสำหรับคำสั่งซ่อมนี้", "REVIEW_NOT_FOUND");
    }

    res.status(200).json({
      success: true,
      message: "แก้ไขรีวิวเรียบร้อยแล้ว",
      data: updatedReview,
    });
  } catch (error) {
    next(error);
  }
}

