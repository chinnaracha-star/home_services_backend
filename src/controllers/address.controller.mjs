//import { Request, Response } from "express";

import {
  getProvinces as fetchProvinces,
  getDistricts as fetchDistricts,
  getSubdistricts as fetchSubdistricts,
  getDistrictsByProvince as fetchDistrictsByProvince,
  getSubdistrictsByDistrict as fetchSubdistrictsByDistrict
} from "../services/geoth.service.mjs";


// GET /api/provinces
 
export async function getProvinces(req,res) {

  try {

    const data = await fetchProvinces();

    res.json({
      success: true,
      data
    });

  } catch (error) {

    console.error(
      "Failed to get provinces:",
      error
    );

    res.status(502).json({
      success: false,
      message: "Failed to get provinces from GeoTH"
    });
  }
}


// GET /api/districts

export async function getDistricts(req,res) {

  try {

    const data = await fetchDistricts();

    res.json({
      success: true,
      data
    });

  } catch (error) {

    console.error(
      "Failed to get districts:",
      error
    );

    res.status(502).json({
      success: false,
      message: "Failed to get districts from GeoTH"
    });
  }
}


// GET /api/subdistricts

export async function getSubdistricts(req,res) {

  try {

    const data = await fetchSubdistricts();

    res.json({
      success: true,
      data
    });

  } catch (error) {

    console.error(
      "Failed to get subdistricts:",
      error
    );

    res.status(502).json({
      success: false,
      message: "Failed to get subdistricts from GeoTH"
    });
  }
}


// GET /api/provinces/:provinceId/districts

export async function getDistrictsByProvince(req,res) {

  try {

    const {
      provinceId
    } = req.params;


    if (!provinceId) {

      return res.status(400).json({
        success: false,
        message: "provinceId is required"
      });

    }


    const data =
      await fetchDistrictsByProvince(
        provinceId
      );


    res.json({
      success: true,
      data
    });

  } catch (error) {

    console.error(
      "Failed to get districts:",
      error
    );

    res.status(502).json({
      success: false,
      message:
        "Failed to get districts from GeoTH"
    });
  }
}


// GET /api/districts/:districtId/subdistricts

export async function getSubdistrictsByDistrict(req,res) {

  try {

    const {
      districtId
    } = req.params;


    if (!districtId) {

      return res.status(400).json({
        success: false,
        message: "districtId is required"
      });

    }


    const data =
      await fetchSubdistrictsByDistrict(
        districtId
      );


    res.json({
      success: true,
      data
    });

  } catch (error) {

    console.error(
      "Failed to get subdistricts:",
      error
    );

    res.status(502).json({
      success: false,
      message:
        "Failed to get subdistricts from GeoTH"
    });
  }
}