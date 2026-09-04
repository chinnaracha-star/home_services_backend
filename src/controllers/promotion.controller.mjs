import { getPromotionService, updatePromotionQuotaService } from "../services/promotion.service.mjs";

export async function getPromotionController(req, res) {

    try {
        // Support both query string (?promotionCode=...) and request body
        const promotionCode = req.query?.promotionCode || req.body?.promotionCode;
        const result = await getPromotionService(promotionCode);


        return res.status(200).json(result);

    } catch (error) {
        if (error.message === "Promotion code not found") {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === "Promotion code quota exceeded") {
            return res.status(400).json({ message: error.message });
        }
        return res.status(500).json({
            message: "Server could not get promotion because of database connection",
        });
    }
}


export async function updatePromotionQuotaController(req, res) {

    try {
        const { id } = req.params;
        const { newQuota } = req.body;
        const result = await updatePromotionQuotaService(id, newQuota);

        return res.status(200).json({
            message: "Promotion quota updated successfully",
            data: result
        });

    } catch (error) {
        if (error.message === "Promotion code not found") {
            return res.status(404).json({ message: error.message });
        }

        return res.status(500).json({
            message: "Server could not get promotion because of database connection",
        });
    }
}
