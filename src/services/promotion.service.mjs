import { getPromotionRepository, updatePromotionQuotaRepository } from "../repositories/promotion.repository.mjs";

export async function getPromotionService(promotionCode) {
    
    const result = await getPromotionRepository(promotionCode);
    
    if(!result) {
        throw new Error("Promotion code not found");   
    }

    if(result.quota - result.quota_used === 0) {
        throw new Error("Promotion code quota exceeded");
    }

    return result;
}

export async function updatePromotionQuotaService(id, newQuota) {

    const result = await updatePromotionQuotaRepository(id, newQuota);

    if(!result) {
        throw new Error("Promotion code not found");   
    }

    return result;
}