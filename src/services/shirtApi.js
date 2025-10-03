// src/services/shirtApi.js
import axios from "axios";
import { REAL_API_BASE_URL, SIZE_ORDER } from "../utils/constants";

export const api = axios.create({
  baseURL: REAL_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
  },
  timeout: 15000,
  maxBodyLength: Infinity,
});

// Parse WCF Date: /Date(1758602879000+0700)/
const parseWcfDate = (dateString) => {
  if (!dateString) return null;
  const match = String(dateString).match(/\/Date\((\d+)\+/);
  return match ? new Date(Number(match[1])) : null;
};

// Format member data from API
const formatMemberData = (apiData) => {
  if (!apiData) return null;

  return {
    memberCode: apiData.MEMB_CODE,
    fullName: apiData.FULLNAME,
    displayName: apiData.DISPLAYNAME,
    phone: apiData.MEMB_MOBILE,
    socialId: apiData.MEMB_SOCID,
    sizeCode: apiData.SIZE_CODE,
    surveyDate: parseWcfDate(apiData.SURVEY_DATE),
    surveyMethod: apiData.SURVEY_METHOD,
    processedBy: apiData.PROCESSED_BY,
    receiverName: apiData.RECEIVER_NAME,
    receiverType: apiData.RECEIVER_TYPE,
    receiveDate: parseWcfDate(apiData.RECEIVE_DATE),
    receiveStatus: apiData.RECEIVE_STATUS,
    remarks: apiData.REMARKS,
    updatedDate: parseWcfDate(apiData.UPDATED_DATE),
    userRole: apiData.USER_ROLE,
    hasReceived: apiData.RECEIVE_STATUS === "RECEIVED",
  };
};

export const loginMember = async ({ memberCode, phone, idCard }) => {
  const payload = { mbcode: memberCode, socid: idCard, mobile: phone };

  console.log("Login payload:", payload);

  const res = await api.post("/ShirtSurveyLogin", payload);

  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "ไม่พบข้อมูลสมาชิก");
  }

  const memberData = formatMemberData(res.data.data);

  const loginResult = {
    ...memberData,
    round: memberData.socialId ? memberData.socialId.split("-").pop() : idCard,
    name:
      memberData.displayName || memberData.fullName || memberData.memberCode,
  };

  console.log("Login successful, member data:", loginResult);

  return loginResult;
};

// ฟังก์ชัน saveMemberSize สำหรับการจองขนาดเสื้อ
export const saveMemberSize = async ({
  memberCode,
  sizeCode,
  remarks = "",
  surveyMethod = "ONLINE",
  processedBy = null,
}) => {
  const paddedMemberCode = (memberCode ?? "").toString().padStart(6, "0");

  const payload = {
    MEMB_CODE: paddedMemberCode,
    SIZE_CODE: sizeCode,
    SURVEY_METHOD: surveyMethod,
    REMARKS: remarks,
  };

  // เพิ่ม PROCESSED_BY ถ้ามีค่า (กรณี admin แก้ไขให้)
  if (processedBy) {
    const paddedProcessedBy = processedBy.toString().padStart(6, "0");
    payload.PROCESSED_BY = paddedProcessedBy;
  }

  console.log("Saving size payload:", payload);

  const res = await api.post("/AddShirtSurvey", payload);

  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "บันทึกขนาดไม่สำเร็จ");
  }

  console.log("Save size response:", res.data);

  return res.data;
};

export const SearchMember = async (mbcode) => {
  const res = await api.get(
    `/SearchShirtMember?mbcode=${encodeURIComponent(mbcode)}`
  );

  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "ไม่พบข้อมูลสมาชิก");
  }

  return formatMemberData(res.data.data);
};

export const getShirtMemberListPaged = async ({
  page = 1,
  pageSize = 20,
  search = "",
  status = "",
  size_code = "",
  sort_field = "",
  sort_order = "asc",
}) => {
  // สร้าง URL ตามลำดับที่ Backend UriTemplate ต้องการ
  // UriTemplate: page → pageSize → search → status → size_code → sort_field → sort_order
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    search: search || "",
    status: status || "",
    size_code: size_code || "",
    sort_field: sort_field || "",
    sort_order: sort_order || "asc",
  });

  console.log("API Request params:", {
    page,
    pageSize,
    search,
    status,
    size_code,
    sort_field,
    sort_order,
  });

  const res = await api.get(`/GetShirtMemberListPaged?${params.toString()}`);

  if (res.data?.responseCode !== 200 && res.data?.responseCode !== 404) {
    throw new Error(res.data?.responseMessage || "เกิดข้อผิดพลาด");
  }

  const data = res.data.data || [];
  const formattedData = Array.isArray(data) ? data.map(formatMemberData) : [];

  console.log("API Response:", {
    totalCount: res.data.totalCount,
    dataLength: formattedData.length,
  });

  return {
    data: formattedData,
    totalCount: res.data.totalCount || 0,
    currentPage: res.data.currentPage || page,
    pageSize: res.data.pageSize || pageSize,
    totalPages: res.data.totalPages || 1,
  };
};

// ฟังก์ชัน submitPickup สำหรับบันทึกการรับเสื้อ
export const submitPickup = async ({
  memberCode,
  sizeCode,
  processedBy,
  receiverType = "SELF",
  receiverName = null,
  remarks = "",
}) => {
  const paddedMemberCode = (memberCode ?? "").toString().padStart(6, "0");
  const paddedProcessedBy = (processedBy ?? "").toString().padStart(6, "0");

  const payload = {
    MEMB_CODE: paddedMemberCode,
    SIZE_CODE: sizeCode,
    SURVEY_METHOD: "MANUAL",
    RECEIVE_STATUS: "RECEIVED",
    RECEIVER_TYPE: receiverType,
    PROCESSED_BY: paddedProcessedBy,
    RECEIVER_NAME: receiverName,
    REMARKS: remarks || "",
  };

  console.log("Submit pickup payload:", payload);

  const res = await api.post("/AddShirtSurvey", payload);

  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "บันทึกการรับเสื้อไม่สำเร็จ");
  }

  console.log("Submit pickup response:", res.data);

  return res.data;
};

export const getInventorySummary = async () => {
  const res = await api.get("/GetStocks");

  if (res.data?.responseCode !== 200) {
    throw new Error("ไม่สามารถโหลดข้อมูลสต็อกได้");
  }

  const stockData = res.data.data || [];
  const inventorySummary = stockData.map((stock) => ({
    sizeCode: stock.SIZE_CODE,
    produced: stock.PRODUCED_QTY || 0,
    reserved: (stock.PRODUCED_QTY || 0) - (stock.REMAINING_QTY || 0),
    received: stock.DISTRIBUTED_QTY || 0,
    remaining: stock.REMAINING_QTY || 0,
    lowStockThreshold: stock.LOW_STOCK_THRESHOLD || 50,
    stockId: stock.STOCK_ID,
    updatedBy: stock.UPDATED_BY,
    updatedDate: parseWcfDate(stock.UPDATED_DATE),
    remarks: stock.REMARKS,
  }));

  const sizeOrder = SIZE_ORDER;
  inventorySummary.sort(
    (a, b) => sizeOrder.indexOf(a.sizeCode) - sizeOrder.indexOf(b.sizeCode)
  );

  return inventorySummary;
};

export const adjustInventory = async (adjustmentData) => {
  const payload = {
    SIZE_CODE: adjustmentData.sizeCode,
    QUANTITY: adjustmentData.quantity,
    ADJUSTMENT_TYPE: adjustmentData.type,
    REMARKS: adjustmentData.remarks || "",
    PROCESSED_BY: adjustmentData.processedBy,
  };

  const res = await api.post("/AdjustInventory", payload);

  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "ไม่สามารถปรับสต็อกได้");
  }

  return res.data;
};

// ✅ อัพเดตฟังก์ชันนี้ให้เรียก API จริง
export const getDashboardStats = async () => {
  try {
    console.log("📊 Fetching dashboard stats from API...");

    const res = await api.get("/GetDashboardStats");

    if (res.data?.responseCode !== 200) {
      throw new Error(res.data?.responseMessage || "ไม่สามารถโหลดสถิติได้");
    }

    const stats = res.data.data;

    console.log("📊 Dashboard Stats received:", stats);

    return stats;
  } catch (error) {
    console.error("❌ Error fetching dashboard stats:", error);
    throw error;
  }
};

// ✅ NEW: ฟังก์ชันสำหรับล้างข้อมูลสมาชิก (ตาม API spec ที่ถูกต้อง)
export const clearMemberData = async ({
  memberCode,
  clearSize = true,
  clearReceiveStatus = true,
  clearRemarks = true,
  clearedBy
}) => {
  const paddedMemberCode = (memberCode ?? "").toString().padStart(6, "0");
  const paddedClearedBy = (clearedBy ?? "").toString().padStart(6, "0");

  // ⚠️ ตาม API spec: ไม่มีฟิลด์ REMARKS ใน payload
  // API จะเคลียร์ข้อมูลตาม boolean flags เท่านั้น
  const payload = {
    MEMB_CODE: paddedMemberCode,
    ClearSize: clearSize,
    ClearReceiveStatus: clearReceiveStatus,
    ClearRemarks: clearRemarks,
    CLEARED_BY: paddedClearedBy,
  };

  console.log("Clear member data payload:", payload);

  const res = await api.post("/ClearShirtSurvey", payload);

  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "ไม่สามารถล้างข้อมูลได้");
  }

  console.log("Clear member data response:", res.data);

  return res.data;
};

export { formatMemberData, parseWcfDate };