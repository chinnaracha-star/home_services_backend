import { getService, listServices } from "../services/service.service.mjs";

export async function getServices(req, res, next) {
  try {
    const services = await listServices(req.query);
    res.status(200).json({ data: services, message: "Success" });
  } catch (error) {
    next(error);
  }
}

export async function getServiceById(req, res, next) {
  try {
    const service = await getService(req.params.serviceId);
    res.status(200).json({ data: service, message: "Success" });
  } catch (error) {
    next(error);
  }
}
