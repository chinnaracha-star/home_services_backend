import {
  findServiceById,
  findServiceOptions,
  findServices,
  getServiceOptionRepository
} from "../repositories/service.repository.mjs";
import {
  parseServiceId,
  parseServiceListQuery,
} from "../validators/service.validator.mjs";
import { parseLocale } from "../validators/locale.validator.mjs";
import { HttpError } from "../utils/http-error.mjs";

export function listServices(query) {
  return findServices(parseServiceListQuery(query));
}

export async function getService(serviceId, localeValue) {
  const id = parseServiceId(serviceId);
  if (!id) {
    throw new HttpError(404, "SERVICE_NOT_FOUND", "ไม่พบบริการ");
  }

  const locale = parseLocale(localeValue);
  const service = await findServiceById(id, locale);
  if (!service) {
    throw new HttpError(404, "SERVICE_NOT_FOUND", "ไม่พบบริการ");
  }

  return {
    ...service,
    serviceOptions: await findServiceOptions(id, locale),
  };
}

// for service option
export async function getServiceOptionService(serviceId, localeValue) {
  const id = parseServiceId(serviceId);
  if (!id) {
    throw new HttpError(404, "SERVICE_NOT_FOUND", "ไม่พบบริการ");
  }
  const locale = parseLocale(localeValue);
  const result = await getServiceOptionRepository(id, locale);
      
  if (!result) {
    throw new HttpError(404, "SERVICE_NOT_FOUND", "ไม่พบบริการ");
  }

  return result;
}
