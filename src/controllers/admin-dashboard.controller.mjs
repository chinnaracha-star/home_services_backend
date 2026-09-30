import {
  getTotalSales,
  getTotalOrders,
  getTopSalesByService,
  getTotalSalesByDay,
  getSalesByServiceSubcategory,
  getServicesDateRange,
} from "../repositories/admin-dashboard.repository.mjs";

export const getDashboardTotalSales = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate และ endDate จำเป็นต้องระบุ",
      });
    }

    const totalSales = await getTotalSales({ startDate, endDate });
    return res.status(200).json({ success: true, data: { totalSales } });
  } catch (error) {
    next(error);
  }
};

export const getDashboardTotalOrders = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate และ endDate จำเป็นต้องระบุ",
      });
    }

    const totalOrders = await getTotalOrders({ startDate, endDate });
    return res.status(200).json({ success: true, data: { totalOrders } });
  } catch (error) {
    next(error);
  }
};

export const getDashboardTopSalesByService = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate และ endDate จำเป็นต้องระบุ",
      });
    }

    const services = await getTopSalesByService({ startDate, endDate });
    return res.status(200).json({ success: true, data: services });
  } catch (error) {
    next(error);
  }
};

export const getDashboardTotalSalesByDay = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate และ endDate จำเป็นต้องระบุ",
      });
    }

    const salesByDay = await getTotalSalesByDay({ startDate, endDate });
    return res.status(200).json({ success: true, data: salesByDay });
  } catch (error) {
    next(error);
  }
};

export const getDashboardSalesByServiceSubcategory = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate และ endDate จำเป็นต้องระบุ",
      });
    }

    const rows = await getSalesByServiceSubcategory({ startDate, endDate });
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

export const getDashboardDateRange = async (req, res, next) => {
  try {
    const { minDate, maxDate } = await getServicesDateRange();
    return res.status(200).json({ success: true, data: { minDate, maxDate } });
  } catch (error) {
    next(error);
  }
};

