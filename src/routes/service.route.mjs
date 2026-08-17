import { Router } from "express";
import {
  getServiceById,
  getServices,
} from "../controllers/service.controller.mjs";

const serviceRouter = Router();
serviceRouter.get("/", getServices);
serviceRouter.get("/:serviceId", getServiceById);

export { serviceRouter };
