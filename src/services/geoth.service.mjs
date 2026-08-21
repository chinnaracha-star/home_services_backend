import axios from "axios";

const GEOTH_BASE_URL =
  process.env.GEOTH_BASE_URL ||
  "https://geoth.thiti.dev/api";


const geothApi = axios.create({
  baseURL: GEOTH_BASE_URL,

  timeout: 10000,

  headers: {
    Accept: "application/json"
  }
});


// Get all provinces
 
export async function getProvinces() {

  const response = await geothApi.get(
    "/provinces/all"
  );

  return response.data;
}


// Get all districts

export async function getDistricts() {

  const response = await geothApi.get(
    "/districts/all"
  );

  return response.data;
}


// Get all subdistricts

export async function getSubdistricts() {

  const response = await geothApi.get(
    "/subdistricts/all"
  );

  return response.data;
}


// Get districts belonging to a province

export async function getDistrictsByProvince(provinceId) {

  const response = await geothApi.get(
    `/provinces-with-districts/${provinceId}`
  );

  return response.data;
}


// Get subdistricts belonging to a district

export async function getSubdistrictsByDistrict(districtId) {

  const response = await geothApi.get(
    `/districts-with-subdistricts/${districtId}`
  );

  return response.data;
}