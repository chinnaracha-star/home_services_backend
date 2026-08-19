import {
  findServiceById,
  findServiceOptions,
  findServices,
} from "../repositories/service.repository.mjs";
import {
  parseServiceId,
  parseServiceListQuery,
} from "../validators/service.validator.mjs";
import { HttpError } from "../utils/http-error.mjs";

export function listServices(query) {
  return findServices(parseServiceListQuery(query));
}

export async function getService(serviceId) {
  const id = parseServiceId(serviceId);
  if (!id) {
    throw new HttpError(404, "SERVICE_NOT_FOUND", "ไม่พบบริการ");
  }

  const service = await findServiceById(id);
  if (!service) {
    throw new HttpError(404, "SERVICE_NOT_FOUND", "ไม่พบบริการ");
  }

  return {
    ...service,
    serviceOptions: await findServiceOptions(id),
  };
}
