import {
  findAllAdminServices,
  findAdminServiceById,
  createAdminService,
  updateAdminService,
  softDeleteAdminService,
  reorderAdminServices,
} from "../repositories/admin-service.repository.mjs";

export const getAdminServices = async (req, res, next) => {
  try {
    const { search, categoryId, includeInactive } = req.query;
    const services = await findAllAdminServices({
      search,
      categoryId,
      includeInactive: includeInactive === "true",
    });
    return res.status(200).json({ success: true, data: services });
  } catch (error) {
    next(error);
  }
};

export const getAdminServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = await findAdminServiceById(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบบริการที่ต้องการ",
      });
    }

    return res.status(200).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

export const handleCreateAdminService = async (req, res, next) => {
  try {
    const {
      name,
      categoryId,
      category_id,
      category,
      imageUrl,
      image_url,
      serviceOptions,
      service_options,
      isFeatured,
      is_featured,
      displayOrder,
      display_order,
    } = req.body;

    const newService = await createAdminService({
      name: name?.trim(),
      categoryId: categoryId || category_id,
      categoryName: category,
      imageUrl: imageUrl || image_url || null,
      serviceOptions: serviceOptions || service_options || [],
      isFeatured: isFeatured !== undefined ? isFeatured : is_featured !== undefined ? is_featured : false,
      displayOrder: displayOrder !== undefined ? Number(displayOrder) : display_order !== undefined ? Number(display_order) : 0,
    });

    return res.status(201).json({
      success: true,
      message: "สร้างบริการสำเร็จ",
      data: newService,
    });
  } catch (error) {
    next(error);
  }
};

export const handleUpdateAdminService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      categoryId,
      category_id,
      category,
      imageUrl,
      image_url,
      serviceOptions,
      service_options,
      isFeatured,
      is_featured,
      displayOrder,
      display_order,
    } = req.body;

    const updatedService = await updateAdminService(id, {
      name: name !== undefined ? name.trim() : undefined,
      categoryId: categoryId || category_id,
      categoryName: category,
      imageUrl: imageUrl !== undefined ? imageUrl : image_url,
      serviceOptions: serviceOptions || service_options,
      isFeatured: isFeatured !== undefined ? isFeatured : is_featured,
      displayOrder: displayOrder !== undefined ? Number(displayOrder) : display_order !== undefined ? Number(display_order) : undefined,
    });

    if (!updatedService) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบบริการที่ต้องการแก้ไข",
      });
    }

    return res.status(200).json({
      success: true,
      message: "แก้ไขบริการสำเร็จ",
      data: updatedService,
    });
  } catch (error) {
    next(error);
  }
};

export const handleDeleteAdminService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const success = await softDeleteAdminService(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบบริการที่ต้องการลบ",
      });
    }

    return res.status(200).json({
      success: true,
      message: "ลบบริการสำเร็จ",
    });
  } catch (error) {
    next(error);
  }
};

export const handleReorderAdminServices = async (req, res, next) => {
  try {
    const { items } = req.body;
    await reorderAdminServices(items);

    return res.status(200).json({
      success: true,
      message: "เรียงลำดับบริการสำเร็จ",
    });
  } catch (error) {
    next(error);
  }
};
