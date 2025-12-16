// ===================================================================
// File: src/services/shirtApi.js
// Description: Service layer สำหรับเชื่อมต่อ API เสื้อ + Mapping Data
// ===================================================================

import axios from "axios";
import { REAL_API_BASE_URL, DEFAULT_SHIRT_SIZES, ROUND_2_START_DATE } from "../utils/constants";

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
// ✨ Shirt Sizes API
// ===================================================================

let cachedSizes = null; // Cache เพื่อไม่ต้องเรียก API ซ้ำ

/**
 * ดึงข้อมูลขนาดเสื้อทั้งหมดจาก API
 * @returns {Promise<Array>} รายการขนาดเสื้อ
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

    // ใช้ข้อมูลจาก API โดยตรง
    cachedSizes = res.data.data || [];

    // เรียงตาม SORT_ORDER
    cachedSizes.sort((a, b) => a.SORT_ORDER - b.SORT_ORDER);

    console.log("✅ Loaded shirt sizes from API:", cachedSizes.length, "sizes");
    return cachedSizes;
  } catch (error) {
    console.error("❌ Error fetching shirt sizes:", error);
    console.log("⚠️ Using default sizes as fallback");

    // ✅ ใช้ค่า default จาก constants
    cachedSizes = DEFAULT_SHIRT_SIZES;
    return cachedSizes;
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

// ===================================================================
// Format Functions
// ===================================================================

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
    receiveChannel: apiData.RECEIVE_CHANNEL, // เพิ่มการแมป RECEIVE_CHANNEL
    receiveDate: parseWcfDate(apiData.RECEIVE_DATE),
    receiveStatus: apiData.RECEIVE_STATUS,
    remarks: apiData.REMARKS,
    updatedDate: parseWcfDate(apiData.UPDATED_DATE),
    userRole: apiData.USER_ROLE,
    hasReceived: apiData.RECEIVE_STATUS === "RECEIVED",
    MEMB_DBTYP: apiData.MEMB_DBTYP,
    DEPT_CODE: apiData.DEPT_CODE,
    DEPT_NAME: apiData.DEPT_NAME,
    SECT_CODE: apiData.SECT_CODE,
    SECT_NAME: apiData.SECT_NAME,
    ADDR: apiData.ADDR,
    // เพิ่มฟิลด์ดิบสำหรับ fallback
    RECEIVE_CHANNEL: apiData.RECEIVE_CHANNEL,
    ALLOW_ROUND2: apiData.ALLOW_ROUND2,
    // Calculate round based on ALLOW_ROUND2 flag
    round: apiData.ALLOW_ROUND2 === "Y" ? "2" : "1",
  };
};

// ===================================================================
// Member APIs
// ===================================================================

export const loginMember = async ({ memberCode, phone, idCard }) => {
  const payload = { mbcode: memberCode, socid: idCard, mobile: phone };
  console.log("Login payload:", payload);

  let res;
  try {
    res = await api.post("/ShirtSurveyLogin", payload);
  } catch (error) {
    console.error("Login API Error:", error);
    if (error.response?.data?.responseMessage) {
      throw new Error(error.response.data.responseMessage);
    }
    throw new Error("ไม่สามารถเชื่อมต่อระบบได้");
  }

  console.log("Login response:", res.data);

  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "ไม่พบข้อมูลสมาชิก");
  }

  const memberData = formatMemberData(res.data.data);

  return {
    ...memberData,
    round: memberData.socialId ? memberData.socialId.split("-").pop() : idCard,
    name:
      memberData.displayName || memberData.fullName || memberData.memberCode,
  };
};

export const saveMemberSize = async ({
  memberCode,
  sizeCode,
  surveyMethod = "ONLINE",
  remarks = "",
}) => {
  const paddedMemberCode = (memberCode ?? "").toString().padStart(6, "0");

  const payload = {
    MEMB_CODE: paddedMemberCode,
    SIZE_CODE: sizeCode,
    SURVEY_METHOD: surveyMethod,
    REMARKS: remarks,
  };

  console.log("Save size payload:", payload);

  const res = await api.post("/AddShirtSurvey", payload);
  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "บันทึกขนาดเสื้อไม่สำเร็จ");
  }

  console.log("Save size response:", res.data);
  return res.data;
};

export const getMemberByCode = async (memberCode) => {
  const paddedCode = (memberCode ?? "").toString().padStart(6, "0");
  const res = await api.get(`/GetShirtMemberByCode/${paddedCode}`);

  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "ไม่พบข้อมูลสมาชิก");
  }

  return formatMemberData(res.data.data);
};

export const getMembers = async ({
  page = 1,
  pageSize = 20,
  search = "",
  status = "",
  size_code = "",
  sort_field = "",
  sort_order = "asc",
  round = "", // Add round param
} = {}) => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    search: search || "",
    status: status || "",
    size_code: size_code || "",
    sort_field: sort_field || "",
    sort_order: sort_order || "asc",
    round: round || "", // Forward round param
  });

  const res = await api.get(`/GetShirtMemberListPaged?${params.toString()}`);
  if (res.data?.responseCode !== 200 && res.data?.responseCode !== 404) {
    throw new Error(res.data?.responseMessage || "เกิดข้อผิดพลาด");
  }

  const data = res.data.data || [];
  const formattedData = Array.isArray(data) ? data.map(formatMemberData) : [];

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
  receiverMemberCode = null, // Add receiverMemberCode
  receiverName = null,
  remarks = "",
}) => {
  const paddedMemberCode = (memberCode ?? "").toString().padStart(6, "0");
  const paddedProcessedBy = (processedBy ?? "").toString().padStart(6, "0");

  // Format remark for Proxy
  let finalRemarks = remarks;
  if ((receiverType === "PROXY" || receiverType === "OTHER") && receiverName) {
     const proxyCode = receiverMemberCode ? `${receiverMemberCode}:` : "";
     const proxyInfo = `${proxyCode}${receiverName} (รับแทน)`;
     finalRemarks = remarks ? `${remarks} ${proxyInfo}` : proxyInfo;
  }

  const payload = {
    MEMB_CODE: paddedMemberCode,
    SIZE_CODE: sizeCode,
    SURVEY_METHOD: "MANUAL",
    RECEIVE_STATUS: "RECEIVED",
    RECEIVER_TYPE: receiverType,
    PROCESSED_BY: paddedProcessedBy,
    REMARKS: finalRemarks, // Use updated remarks
  };

  if ((receiverType === "PROXY" || receiverType === "OTHER") && receiverName) {
    payload.RECEIVER_NAME = receiverName;
  }

  console.log("Submit pickup payload (via AddShirtSurvey):", payload);

  const res = await api.post("/AddShirtSurvey", payload);
  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "บันทึกการรับเสื้อไม่สำเร็จ");
  }

  console.log("Submit pickup response:", res.data);
  return res.data;
};

export const submitPickupByDept = async ({
  deptCode,
  sectCode = null,
  processedBy,
  remarks = "",
  roundFilter = "ALL", // Default to ALL if not provided
}) => {
  const paddedProcessedBy = (processedBy ?? "").toString().padStart(6, "0");

  const payload = {
    DEPT_CODE: deptCode,
    PROCESSED_BY: paddedProcessedBy,
    REMARKS: remarks,
    ROUND_FILTER: roundFilter, // "1", "2", or "ALL"
  };

  if (sectCode) {
    payload.SECT_CODE = sectCode;
  }

  console.log("Submit pickup by dept payload:", payload);

  const res = await api.post("/SubmitShirtPickupByDept", payload);
  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "บันทึกการรับเสื้อไม่สำเร็จ");
  }

  console.log("Submit pickup by dept response:", res.data);
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
        remaining: (Number(item.PRODUCED_QTY) || 0) - (Number(item.RESERVED_QTY) || 0),
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
  const res = await api.get("/GetStockLogs");

  if (res.data?.responseCode !== 200 && res.data?.responseCode !== 404) {
    throw new Error(res.data?.responseMessage || "ไม่สามารถโหลดประวัติได้");
  }

  const data = res.data.data || [];
  return Array.isArray(data) ? data.map(formatStockLogData) : [];
};

// ===================================================================
// Dashboard APIs
// ===================================================================

export const getDashboardStats = async () => {
  const res = await api.get("/GetDashboardStats");

  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "ไม่สามารถโหลดสถิติได้");
  }

  return res.data.data;
};

export const getDepartmentReport = async () => {
  const res = await api.get("/GetShirtResultDeptSect");

  if (res.data?.responseCode !== 200) {
    throw new Error(
      res.data?.responseMessage || "ไม่สามารถโหลดรายงานหน่วยงานได้"
    );
  }

  return res.data.data || [];
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

  const res = await api.post("/ClearShirtSurvey", payload);

  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "ไม่สามารถล้างข้อมูลได้");
  }

  return res.data;
};

// ===================================================================
// Delivery Preference APIs
// ===================================================================

/**
 * บันทึกความประสงค์การจัดส่งเสื้อ
 */
export const saveDeliveryPreference = async ({
  memberCode,
  deliveryOption,
  deliveryAddress = null,
  deliveryPhone = null,
}) => {
  const paddedMemberCode = (memberCode ?? "").toString().padStart(6, "0");

  const payload = {
    MEMB_CODE: paddedMemberCode,
    DELIVERY_OPTION: deliveryOption.toLowerCase(),
    DELIVERY_ADDRESS: deliveryAddress,
    DELIVERY_PHONE: deliveryPhone,
  };

  console.log("📦 Save delivery preference payload:", payload);

  const res = await api.post("/AddShirtDelivery", payload);

  if (res.data?.responseCode !== 200) {
    throw new Error(
      res.data?.responseMessage || "ไม่สามารถบันทึกความประสงค์ได้"
    );
  }

  console.log("✅ Delivery preference saved:", res.data);
  return res.data;
};

/**
 * ดึงข้อมูลความประสงค์การจัดส่งของสมาชิก
 */
export const getDeliveryPreference = async (memberCode) => {
  const paddedMemberCode = (memberCode ?? "").toString().padStart(6, "0");

  console.log("🔍 Fetching delivery preference for:", paddedMemberCode);

  try {
    const res = await api.get(`/GetShirtDelivery/${paddedMemberCode}`);

    if (res.data?.responseCode === 404) {
      console.log("ℹ️ No delivery preference found");
      return null;
    }

    if (res.data?.responseCode !== 200) {
      throw new Error(
        res.data?.responseMessage || "ไม่สามารถโหลดข้อมูลความประสงค์ได้"
      );
    }

    console.log("✅ Delivery preference loaded:", res.data.data);
    return res.data.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

/**
 * Format ข้อมูล delivery preference สำหรับแสดงผล
 */
export const formatDeliveryData = (data) => {
  if (!data) return null;

  return {
    memberCode: data.MEMB_CODE,
    deliveryOption: data.DELIVERY_OPTION,
    deliveryAddress: data.DELIVERY_ADDRESS,
    deliveryPhone: data.DELIVERY_PHONE,
    createdDate: parseWcfDate(data.CREATED_DATE),
    updatedDate: parseWcfDate(data.UPDATED_DATE),
  };
};

// ===================================================================
// Delivery Report APIs
// ===================================================================

/**
 * ดึงรายการข้อมูลการเลือกวิธีการรับเสื้อทั้งหมด (แบบแบ่งหน้า)
 * สำหรับหน้ารายงานรายละเอียดการจัดส่ง (Admin)
 */
export const getDeliveryReportList = async ({
  page = 1,
  pageSize = 20,
  search = "",
  delivery_option = "",
  sort_field = "createddate",
  sort_order = "desc",
} = {}) => {
  try {
    console.log("📋 Fetching delivery report list with params:", {
      page,
      pageSize,
      search,
      delivery_option,
      sort_field,
      sort_order,
    });

    // ✅ ส่ง params แบบ destructure เพื่อให้แน่ใจว่าทุก key ถูกส่งไป
    const res = await api.get("/GetDeliveryReportListPaged", {
      params: {
        page,
        pageSize,
        search,
        delivery_option, // ✅ ต้องมี key นี้!
        sort_field,
        sort_order,
      },
    });

    console.log("🔍 API Response:", res.data);

    if (res.data?.responseCode !== 200) {
      throw new Error(
        res.data?.responseMessage || "ไม่สามารถโหลดรายงานการจัดส่งได้"
      );
    }

    const data = res.data?.data || [];
    console.log("✅ Delivery report loaded:", data.length, "records");

    return {
      data: data,
      totalCount: res.data?.totalCount || 0,
      currentPage: res.data?.currentPage || page,
      pageSize: res.data?.pageSize || pageSize,
      totalPages: res.data?.totalPages || 1,
    };
  } catch (error) {
    console.error("❌ Error fetching delivery report:", error);
    return {
      data: [],
      totalCount: 0,
      currentPage: page,
      pageSize: pageSize,
      totalPages: 0,
    };
  }
};

/**
 * ดึงสถิติการเลือกวิธีการรับเสื้อ
 */
export const getDeliveryStats = async () => {
  try {
    console.log("📊 Fetching delivery statistics...");

    const res = await api.get("/GetDeliveryStats");

    if (res.data?.responseCode !== 200) {
      throw new Error(
        res.data?.responseMessage || "ไม่สามารถโหลดสถิติการจัดส่งได้"
      );
    }

    console.log("✅ Delivery stats loaded:", res.data.data);
    return res.data.data;
  } catch (error) {
    console.error("❌ Error fetching delivery stats:", error);
    throw error;
  }
};

// ===================================================================
// Backward Compatibility Functions
// ===================================================================

/**
 * @deprecated ใช้ getMembers() แทน
 * เก็บไว้เพื่อ backward compatibility - อย่าลบ!
 */
export const getShirtMemberListPaged = async (params = {}) => {
  console.warn(
    "⚠️ getShirtMemberListPaged is deprecated. Use getMembers() instead."
  );
  return await getMembers(params);
};
