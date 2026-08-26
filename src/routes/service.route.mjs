import { Router } from "express";
import {
  getServiceById,
  getServiceOptionController,
  getServices,
} from "../controllers/service.controller.mjs";

const serviceRouter = Router();
serviceRouter.get("/", getServices);
serviceRouter.get("/:serviceId", getServiceById);

// for service options
serviceRouter.get("/options/:serviceId", getServiceOptionController)

export { serviceRouter };
