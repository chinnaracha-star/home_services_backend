import { Router } from "express";

import {
  getProvinces,
  getDistricts,
  getSubdistricts,
  getDistrictsByProvince,
  getSubdistrictsByDistrict
} from "../controllers/address.controller.mjs";


const addressRouter = Router();

// Note: Router is mounted at /api in app.mjs

// GET /api/provinces - Get all provinces
addressRouter.get("/provinces", getProvinces);

// GET /api/districts - Get all districts
addressRouter.get("/districts", getDistricts);

// GET /api/subdistricts - Get all subdistricts
addressRouter.get("/subdistricts", getSubdistricts);

// GET /api/provinces/:provinceId/districts - Get districts by province
addressRouter.get("/provinces/:provinceId/districts", getDistrictsByProvince);

// GET /api/districts/:districtId/subdistricts - Get subdistricts by district
addressRouter.get("/districts/:districtId/subdistricts", getSubdistrictsByDistrict);

export default addressRouter;