import { Router } from "express";

import {
  getProvinces,
  getDistricts,
  getSubdistricts,
  getDistrictsByProvince,
  getSubdistrictsByDistrict
} from "../controllers/address.controller.mjs";


const addressRouter = Router();


// GET all provinces
// GET /api/provinces

addressRouter.get(
  "/provinces",
  getProvinces
);


// GET all districts
// GET /api/districts

addressRouter.get(
  "/districts",
  getDistricts
);


// GET all subdistricts
// GET /api/subdistricts

addressRouter.get(
  "/subdistricts",
  getSubdistricts
);


// GET districts by province
// GET /api/provinces/:provinceId/districts

addressRouter.get(
  "/provinces/:provinceId/districts",
  getDistrictsByProvince
);


// GET subdistricts by district
// GET /api/districts/:districtId/subdistricts

addressRouter.get(
  "/districts/:districtId/subdistricts",
  getSubdistrictsByDistrict
);


export default addressRouter;