// ===================================================================
// File: src/services/shirtApi.js
// Description: Service layer สำหรับเชื่อมต่อ API เสื้อ + Mapping Data
// ===================================================================

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

// ✅ Helper: Normalize inventory items
export const formatInventoryData = (apiData = []) => {
  return Array.isArray(apiData)
    ? apiData.map((item) => ({
        sizeCode: item.SIZE_CODE,
        produced: Number(item.PRODUCED_QTY) || 0,
        reserved: Number(item.RESERVED_QTY) || 0,
        received: Number(item.RECEIVED_QTY) || 0, // ✅ บังคับเป็น Number
        distributed: Number(item.DISTRIBUTED_QTY) || 0,
        remaining: Number(item.REMAINING_QTY) || 0,
        isLowStock: String(item.IS_LOW_STOCK).toUpperCase() === "Y",
        remarks: item.REMARKS || "",
        updatedBy: item.UPDATED_BY || null,
        updatedDate: parseWcfDate(item.UPDATED_DATE) || null,
        createdDate: parseWcfDate(item.CREATED_DATE) || null,
        stockId: item.STOCK_ID || null,
      }))
    : [];
};

// ✅ API: GetStockSummary → ใช้ formatInventoryData
export const getInventorySummary = async () => {
  const res = await api.get("/GetStockSummary");
  if (res.data?.responseCode !== 200) {
    throw new Error("ไม่สามารถโหลดข้อมูลสต็อกได้");
  }

  const stockData = res.data.data || [];
  const inventorySummary = formatInventoryData(stockData);
  console.log("Raw inventory data:", stockData);
  console.log("Formatted inventory data:", inventorySummary);

  inventorySummary.sort(
    (a, b) => SIZE_ORDER.indexOf(a.sizeCode) - SIZE_ORDER.indexOf(b.sizeCode)
  );
  return inventorySummary;
};

// ฟังก์ชันเติม/เบิกสต็อก
export const addStock = async ({
  sizeCode,
  quantity,
  remarks,
  processedBy,
}) => {
  const payload = {
    size_code: sizeCode,
    produced_delta: quantity,
    remarks: remarks || "",
    updated_by: processedBy,
  };
  const res = await api.post("/UpdateStock", payload);
  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "เติมสต็อกไม่สำเร็จ");
  }
  return res.data;
};

export const removeStock = async ({
  sizeCode,
  quantity,
  remarks,
  processedBy,
}) => {
  const payload = {
    size_code: sizeCode,
    distributed_delta: quantity,
    remarks: remarks || "",
    updated_by: processedBy,
  };
  const res = await api.post("/UpdateStock", payload);
  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "เบิกสต็อกไม่สำเร็จ");
  }
  return res.data;
};

export const adjustInventory = async (adjustmentData) => {
  if (adjustmentData.type === "ADD") {
    return addStock(adjustmentData);
  } else if (adjustmentData.type === "REMOVE") {
    return removeStock(adjustmentData);
  } else {
    throw new Error("ADJUSTMENT_TYPE ต้องเป็น 'ADD' หรือ 'REMOVE' เท่านั้น");
  }
};
// ✅ NEW: ฟังก์ชันสำหรับล้างข้อมูลสมาชิก (ตาม API spec ที่ถูกต้อง)
export const clearMemberData = async ({
  memberCode,
  clearSize = true,
  clearReceiveStatus = true,
  clearRemarks = true,
  clearedBy,
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
// ✅ ฟังก์ชันสำหรับดึงข้อมูล Dashboard Stats
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

// ===================================================================
// เพิ่มใน shirtApi.js
// ===================================================================

// Format stock log data
const formatStockLogData = (apiData) => {
  if (!apiData) return null;

  return {
    logId: apiData.LOG_ID,
    sizeCode: apiData.SIZE_CODE,
    actionType: apiData.ACTION_TYPE,
    producedDelta: Number(apiData.PRODUCED_DELTA) || 0,
    distributedDelta: Number(apiData.DISTRIBUTED_DELTA) || 0,
    quantityBefore: Number(apiData.QUANTITY_BEFORE) || 0,
    quantityAfter: Number(apiData.QUANTITY_AFTER) || 0,
    remarks: apiData.REMARKS || "",
    processedBy: apiData.PROCESSED_BY || "",
    createdDate: parseWcfDate(apiData.CREATED_DATE),
  };
};

// ✅ API: Get Stock Logs (Simple, ไม่รับ parameters)
export const getStockLogs = async () => {
  console.log("🔍 Fetching all stock logs...");

  const res = await api.get("/GetStockLogs");

  if (res.data?.responseCode !== 200 && res.data?.responseCode !== 404) {
    throw new Error(res.data?.responseMessage || "ไม่สามารถโหลดประวัติได้");
  }

  const data = res.data.data || [];
  const formattedData = Array.isArray(data) ? data.map(formatStockLogData) : [];

  console.log("📋 Stock logs loaded:", formattedData.length, "records");

  return formattedData;
};

export { formatMemberData, parseWcfDate, formatStockLogData };
