// ===================================================================
// File: src/services/shirtApi.js
// Description: Service layer สำหรับเชื่อมต่อ API เสื้อ + Mapping Data
// ===================================================================

import axios from "axios";
import { REAL_API_BASE_URL } from "../utils/constants";

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

// ===================================================================
// ✨ NEW: ดึงข้อมูลขนาดเสื้อจาก API
// ===================================================================

let cachedSizes = null; // Cache เพื่อไม่ต้องเรียก API ซ้ำ

/**
 * ดึงข้อมูลขนาดเสื้อทั้งหมดจาก API
 * @returns {Promise<Array>} รายการขนาดเสื้อ (ใช้ CASE จาก API ตรงๆ)
 */
export const getShirtSizes = async () => {
  // ถ้ามี cache แล้วให้ return เลย
  if (cachedSizes) {
    return cachedSizes;
  }

  try {
    console.log("🔍 Fetching shirt sizes from API...");
    const res = await api.get("/GetShirtSizes");

    if (res.data?.responseCode !== 200) {
      throw new Error(
        res.data?.responseMessage || "ไม่สามารถโหลดข้อมูลขนาดเสื้อได้"
      );
    }

    // ✅ ใช้ข้อมูลจาก API โดยตรง ไม่แปลง case
    cachedSizes = res.data.data || [];

    // เรียงตาม SORT_ORDER
    cachedSizes.sort((a, b) => a.SORT_ORDER - b.SORT_ORDER);

    console.log("✅ Loaded shirt sizes:", cachedSizes);
    return cachedSizes;
  } catch (error) {
    console.error("❌ Error fetching shirt sizes:", error);
    // ถ้าเกิด error ให้ fallback ไปใช้ค่า default
    return getDefaultSizes();
  }
};

/**
 * ดึง SIZE_ORDER array สำหรับการเรียงลำดับ
 * @returns {Promise<Array<string>>} รายการ SIZE_CODE เรียงตามลำดับ
 */
export const getSizeOrder = async () => {
  const sizes = await getShirtSizes();
  return sizes.map((s) => s.SIZE_CODE);
};

/**
 * ดึง SIZE_ORDER_MAP สำหรับการเข้าถึงลำดับเร็วขึ้น
 * @returns {Promise<Object>} Map ของ SIZE_CODE -> SORT_ORDER
 */
export const getSizeOrderMap = async () => {
  const sizes = await getShirtSizes();
  return sizes.reduce((acc, size) => {
    acc[size.SIZE_CODE] = size.SORT_ORDER;
    return acc;
  }, {});
};

/**
 * ค้นหาข้อมูลขนาดเสื้อจาก SIZE_CODE
 * @param {string} sizeCode - รหัสขนาดเสื้อ
 * @returns {Promise<Object|null>} ข้อมูลขนาดเสื้อ
 */
export const getSizeInfo = async (sizeCode) => {
  const sizes = await getShirtSizes();
  return sizes.find((s) => s.SIZE_CODE === sizeCode) || null;
};

/**
 * Fallback sizes ถ้า API ไม่ทำงาน (ใช้โครงสร้างเดียวกับ API)
 */
const getDefaultSizes = () => {
  return [
    {
      CHEST_INCH: 38,
      LENGTH_INCH: 23,
      REMARKS: "ขนาดเล็กพิเศษ สำหรับผู้มีรูปร่างเล็กมาก",
      SIZE_CODE: "MINI",
      SIZE_NAME: "มินิไซส์",
      SIZE_NAME_EN: "Mini Size",
      SORT_ORDER: 0,
    },
    {
      CHEST_INCH: 40,
      LENGTH_INCH: 24,
      REMARKS: null,
      SIZE_CODE: "XS",
      SIZE_NAME: "เอ็กซ์ตร้า สมอลล์",
      SIZE_NAME_EN: "Extra Small",
      SORT_ORDER: 1,
    },
    {
      CHEST_INCH: 42,
      LENGTH_INCH: 25,
      REMARKS: null,
      SIZE_CODE: "S",
      SIZE_NAME: "สมอลล์",
      SIZE_NAME_EN: "Small",
      SORT_ORDER: 2,
    },
    {
      CHEST_INCH: 44,
      LENGTH_INCH: 26,
      REMARKS: null,
      SIZE_CODE: "M",
      SIZE_NAME: "มีเดียม",
      SIZE_NAME_EN: "Medium",
      SORT_ORDER: 3,
    },
    {
      CHEST_INCH: 46,
      LENGTH_INCH: 27,
      REMARKS: null,
      SIZE_CODE: "L",
      SIZE_NAME: "ลาร์จ",
      SIZE_NAME_EN: "Large",
      SORT_ORDER: 4,
    },
    {
      CHEST_INCH: 48,
      LENGTH_INCH: 28,
      REMARKS: null,
      SIZE_CODE: "XL",
      SIZE_NAME: "เอ็กซ์ตร้า ลาร์จ",
      SIZE_NAME_EN: "Extra Large",
      SORT_ORDER: 5,
    },
    {
      CHEST_INCH: 50,
      LENGTH_INCH: 29,
      REMARKS: null,
      SIZE_CODE: "2XL",
      SIZE_NAME: "ทู เอ็กซ์ ลาร์จ",
      SIZE_NAME_EN: "2X Large",
      SORT_ORDER: 6,
    },
    {
      CHEST_INCH: 52,
      LENGTH_INCH: 30,
      REMARKS: null,
      SIZE_CODE: "3XL",
      SIZE_NAME: "ทรี เอ็กซ์ ลาร์จ",
      SIZE_NAME_EN: "3X Large",
      SORT_ORDER: 7,
    },
    {
      CHEST_INCH: 54,
      LENGTH_INCH: 31,
      REMARKS: null,
      SIZE_CODE: "4XL",
      SIZE_NAME: "โฟร์ เอ็กซ์ ลาร์จ",
      SIZE_NAME_EN: "4X Large",
      SORT_ORDER: 8,
    },
    {
      CHEST_INCH: 56,
      LENGTH_INCH: 32,
      REMARKS: null,
      SIZE_CODE: "5XL",
      SIZE_NAME: "ไฟว์ เอ็กซ์ ลาร์จ",
      SIZE_NAME_EN: "5X Large",
      SORT_ORDER: 9,
    },
    {
      CHEST_INCH: 58,
      LENGTH_INCH: 33,
      REMARKS: null,
      SIZE_CODE: "6XL",
      SIZE_NAME: "ซิกซ์ เอ็กซ์ ลาร์จ",
      SIZE_NAME_EN: "6X Large",
      SORT_ORDER: 10,
    },
    {
      CHEST_INCH: 60,
      LENGTH_INCH: 34,
      REMARKS: "ขนาดใหญ่พิเศษ สำหรับผู้ที่ต้องการขนาดใหญ่มากเป็นพิเศษ",
      SIZE_CODE: "PLUS",
      SIZE_NAME: "พลัสไซส์",
      SIZE_NAME_EN: "Plus Size",
      SORT_ORDER: 11,
    },
  ];
};

// ===================================================================
// Format Functions
// ===================================================================

// Format member data from API
const formatMemberData = (apiData) => {
  if (!apiData) return null;

  console.log("🔧 Raw API Data:", apiData);
  console.log("🔧 ADDR from API:", apiData.ADDR);

  const formatted = {
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

    // ✅ เพิ่มฟิลด์ที่ขาดหายไป
    MEMB_DBTYP: apiData.MEMB_DBTYP,
    DEPT_CODE: apiData.DEPT_CODE,
    DEPT_NAME: apiData.DEPT_NAME,
    SECT_CODE: apiData.SECT_CODE,
    SECT_NAME: apiData.SECT_NAME,
    ADDR: apiData.ADDR, // ✅ ตรวจสอบให้แน่ใจว่า map ถูกต้อง
  };

  console.log("✅ Formatted Data:", formatted);
  return formatted;
};

// ===================================================================
// Member APIs
// ===================================================================

export const loginMember = async ({ memberCode, phone, idCard }) => {
  const payload = { mbcode: memberCode, socid: idCard, mobile: phone };
  console.log("Login payload:", payload);

  const res = await api.post("/ShirtSurveyLogin", payload);
  console.log("Login response:", res.data);

  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "ไม่พบข้อมูลสมาชิก");
  }

  const memberData = formatMemberData(res.data.data);
  console.log("📍 After formatMemberData:", memberData); // ✅ เพิ่ม debug

  const loginResult = {
    ...memberData,
    round: memberData.socialId ? memberData.socialId.split("-").pop() : idCard,
    name:
      memberData.displayName || memberData.fullName || memberData.memberCode,
  };

  console.log("📍 Final loginResult:", loginResult); // ✅ เพิ่ม debug
  return loginResult;
};

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
    RECEIVER_TYPE: receiverType,
    PROCESSED_BY: paddedProcessedBy,
    REMARKS: remarks,
  };

  if (receiverType === "PROXY" && receiverName) {
    payload.RECEIVER_NAME = receiverName;
  }

  console.log("Submit pickup payload:", payload);

  const res = await api.post("/SubmitShirtPickup", payload);
  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "บันทึกการรับเสื้อไม่สำเร็จ");
  }

  console.log("Submit pickup response:", res.data);
  return res.data;
};

// ===================================================================
// Inventory APIs
// ===================================================================

const formatInventoryData = (apiData) => {
  return Array.isArray(apiData)
    ? apiData.map((item) => ({
        sizeCode: item.SIZE_CODE,
        produced: Number(item.PRODUCED_QTY) || 0,
        reserved: Number(item.RESERVED_QTY) || 0,
        received: Number(item.RECEIVED_QTY) || 0,
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

export const getInventorySummary = async () => {
  const res = await api.get("/GetStockSummary");
  if (res.data?.responseCode !== 200) {
    throw new Error("ไม่สามารถโหลดข้อมูลสต็อกได้");
  }

  const stockData = res.data.data || [];
  const inventorySummary = formatInventoryData(stockData);
  console.log("Raw inventory data:", stockData);
  console.log("Formatted inventory data:", inventorySummary);

  // เรียงตาม SIZE_ORDER จาก API
  const sizeOrder = await getSizeOrder();
  inventorySummary.sort(
    (a, b) => sizeOrder.indexOf(a.sizeCode) - sizeOrder.indexOf(b.sizeCode)
  );

  return inventorySummary;
};

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

// ===================================================================
// Stock Log APIs
// ===================================================================

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

export const getStockLogs = async () => {
  console.log("🔍 Fetching all stock logs...");

  const res = await api.get("/GetStockLogs");

  if (res.data?.responseCode !== 200 && res.data?.responseCode !== 404) {
    throw new Error(res.data?.responseMessage || "ไม่สามารถโหลดประวัติได้");
  }

  const data = res.data.data || [];
  const formattedData = Array.isArray(data) ? data.map(formatStockLogData) : [];

  console.log("Stock logs loaded:", formattedData.length, "records");
  return formattedData;
};

// ===================================================================
// Dashboard APIs
// ===================================================================

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
// Department Report API
// ===================================================================

/**
 * ดึงรายงานแยกตามหน่วยงาน
 * @returns {Promise<Array>} รายงานแยกตามหน่วยงาน
 */
export const getDepartmentReport = async () => {
  try {
    console.log("📊 Fetching department report from API...");

    // ✅ แก้ไข endpoint ให้ถูกต้อง
    const res = await api.get("/GetShirtResultDeptSect");

    if (res.data?.responseCode !== 200) {
      throw new Error(
        res.data?.responseMessage || "ไม่สามารถโหลดรายงานหน่วยงานได้"
      );
    }

    const reportData = res.data.data || [];

    console.log("📊 Department report received:", reportData);
    return reportData;
  } catch (error) {
    console.error("❌ Error fetching department report:", error);
    throw error;
  }
};

// ===================================================================
// Clear Member Data API
// ===================================================================

export const clearMemberData = async ({
  memberCode,
  clearSize = true,
  clearReceiveStatus = true,
  clearRemarks = true,
  clearedBy,
}) => {
  const paddedMemberCode = (memberCode ?? "").toString().padStart(6, "0");
  const paddedClearedBy = (clearedBy ?? "").toString().padStart(6, "0");

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
