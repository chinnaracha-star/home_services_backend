import express from "express";
import { protect } from "../middlewares/protect.middleware.mjs";
import { requireAdmin } from "../middlewares/role.middleware.mjs";
import {
	getDashboardTotalSales,
	getDashboardTotalOrders,
	getDashboardTopSalesByService,
	getDashboardTotalSalesByDay,
	getDashboardSalesByServiceSubcategory,
	getDashboardDateRange,
} from "../controllers/admin-dashboard.controller.mjs";

export const adminDashboardRouter = express.Router();

adminDashboardRouter.use(protect, requireAdmin);

adminDashboardRouter.get("/total-sales", getDashboardTotalSales);
adminDashboardRouter.get("/total-orders", getDashboardTotalOrders);
adminDashboardRouter.get("/top-sales-by-service", getDashboardTopSalesByService);
adminDashboardRouter.get("/sales-by-day", getDashboardTotalSalesByDay);
adminDashboardRouter.get("/sales-by-service-subcategory", getDashboardSalesByServiceSubcategory);
adminDashboardRouter.get("/date-range", getDashboardDateRange);

export default adminDashboardRouter;
