import promotionRepository from "../repositories/promotion.repository.mjs";

const getPromotions = async (req, res) => {
  try {
    const { search } = req.query;
    const promotions = await promotionRepository.findAll({ search });
    return res.status(200).json({ success: true, data: promotions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getPromotionById = async (req, res) => {
  try {
    const { id } = req.params;
    const promotion = await promotionRepository.findById(id);

    if (!promotion || promotion.status === "inactive") {
      return res
        .status(404)
        .json({ success: false, message: "Promotion not found" });
    }

    return res.status(200).json({ success: true, data: promotion });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createPromotion = async (req, res) => {
  try {
    const { promotion_code, type, discount, quota, expire } = req.body;

    const existingPromotion = await promotionRepository.findByCode(
      promotion_code.trim(),
    );
    if (existingPromotion) {
      return res.status(409).json({
        success: false,
        code: "PROMOTION_CODE_EXISTS",
        message: "Promotion code already exists",
        data: { promotion_id: existingPromotion.promotion_id },
      });
    }

    const newPromotion = await promotionRepository.create({
      promotion_code,
      type,
      discount: parseFloat(discount),
      quota: parseInt(quota, 10),
      expire,
    });

    return res.status(201).json({
      success: true,
      message: "Promotion created successfully",
      data: newPromotion,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const { promotion_code, type, discount, quota, expire } = req.body;

    const existingPromotion = await promotionRepository.findById(id);
    if (!existingPromotion || existingPromotion.status === "inactive") {
      return res
        .status(404)
        .json({ success: false, message: "Promotion not found" });
    }

    if (promotion_code) {
      const existingByCode = await promotionRepository.findByCode(
        promotion_code.trim(),
      );
      if (
        existingByCode &&
        String(existingByCode.promotion_id) !== String(id)
      ) {
        return res.status(409).json({
          success: false,
          code: "PROMOTION_CODE_EXISTS",
          message: "Promotion code already exists",
          data: { promotion_id: existingByCode.promotion_id },
        });
      }
    }

    const updatedPromotion = await promotionRepository.update(id, {
      promotion_code,
      type,
      discount: discount !== undefined ? parseFloat(discount) : undefined,
      quota: quota !== undefined ? parseInt(quota, 10) : undefined,
      expire,
    });

    return res.status(200).json({
      success: true,
      message: "Promotion updated successfully",
      data: updatedPromotion,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;

    const existingPromotion = await promotionRepository.findById(id);
    if (!existingPromotion || existingPromotion.status === "inactive") {
      return res
        .status(404)
        .json({ success: false, message: "Promotion not found" });
    }

    await promotionRepository.delete(id);

    return res.status(200).json({
      success: true,
      message: "Promotion deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export {
  getPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
};
