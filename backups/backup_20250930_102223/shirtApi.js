// src/services/shirtApi.js
import axios from "axios";

// ---- CONSTANTS ----
const REAL_API_BASE_URL = "https://apps4.coop.ku.ac.th/KusccToolService2Dev/service1.svc";

// ---- AXIOS INSTANCE ----
export const api = axios.create({
  baseURL: REAL_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
  },
  timeout: 15000,
  maxBodyLength: Infinity,
});

// ---- HELPER FUNCTIONS ----
// Parse WCF Date format: /Date(1758602879000+0700)/
const parseWcfDate = (dateString) => {
  if (!dateString) return null;
  const match = String(dateString).match(/\/Date\((\d+)\+/);
  return match ? new Date(Number(match[1])) : null;
};

// Format member data from API response
const formatMemberData = (apiData) => {
  if (!apiData) return null;
  
  return {
    // Basic Info
    memberCode: apiData.MEMB_CODE,
    fullName: apiData.FULLNAME,
    displayName: apiData.DISPLAYNAME,
    phone: apiData.MEMB_MOBILE,
    socialId: apiData.MEMB_SOCID,
    
    // Survey Info
    sizeCode: apiData.SIZE_CODE,
    surveyDate: parseWcfDate(apiData.SURVEY_DATE),
    surveyMethod: apiData.SURVEY_METHOD,
    
    // Receive Info (ฟิลด์ใหม่)
    processedBy: apiData.PROCESSED_BY,
    receiverName: apiData.RECEIVER_NAME,
    receiverType: apiData.RECEIVER_TYPE, // "SELF" or "OTHER"
    receiveDate: parseWcfDate(apiData.RECEIVE_DATE),
    receiveStatus: apiData.RECEIVE_STATUS, // "RECEIVED", "PENDING", etc.
    
    // Additional
    remarks: apiData.REMARKS,
    updatedDate: parseWcfDate(apiData.UPDATED_DATE),
    userRole: apiData.USER_ROLE,
    
    // Computed fields
    status: apiData.RECEIVE_STATUS === "RECEIVED" 
      ? "รับเสื้อแล้ว" 
      : apiData.SIZE_CODE 
        ? "ยืนยันขนาดแล้ว" 
        : "ยังไม่ยืนยันขนาด",
    hasReceived: apiData.RECEIVE_STATUS === "RECEIVED",
  };
};

// ---- API FUNCTIONS ----

/**
 * Login member
 * @param {object} credentials - { memberCode, phone, idCard }
 * @returns {object} Formatted member data
 */
export const loginMember = async ({ memberCode, phone, idCard }) => {
  const payload = {
    mbcode: memberCode,
    socid: idCard,
    mobile: phone,
  };
  
  console.log("🔐 Login API - Request:", payload);
  
  const res = await api.post("/ShirtSurveyLogin", payload);
  
  console.log("🔐 Login API - Response:", res.data);
  
  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "ไม่พบข้อมูลสมาชิก");
  }
  
  const memberData = formatMemberData(res.data.data);
  
  return {
    ...memberData,
    // Add round info for backward compatibility
    round: memberData.socialId 
      ? memberData.socialId.split("-").pop() 
      : idCard,
    name: memberData.displayName || memberData.fullName || memberData.memberCode,
  };
};

/**
 * Save member size selection
 * @param {object} data - { memberCode, sizeCode, remarks, surveyMethod }
 * @returns {object} API response
 */
export const saveMemberSize = async ({
  memberCode,
  sizeCode,
  remarks = "",
  surveyMethod = "ONLINE",
}) => {
  const payload = {
    MEMB_CODE: (memberCode ?? "").toString().padStart(6, "0"),
    SIZE_CODE: sizeCode,
    SURVEY_METHOD: surveyMethod,
    REMARKS: remarks,
  };
  
  console.log("💾 Save Size API - Request:", payload);
  
  const res = await api.post("/AddShirtSurvey", payload);
  
  console.log("💾 Save Size API - Response:", res.data);
  
  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "บันทึกขนาดไม่สำเร็จ");
  }
  
  return res.data;
};

/**
 * Search member by member code
 * ถ้า error ให้ return mock data
 * @param {string} mbcode - Member code (6 digits)
 * @returns {object} Formatted member data
 */
export const SearchMember = async (mbcode) => {
  try {
    const res = await api.get(
      `/SearchShirtMember?mbcode=${encodeURIComponent(mbcode)}`
    );
    
    if (res.data?.responseCode !== 200) {
      throw new Error(res.data?.responseMessage || "ไม่พบข้อมูลสมาชิก");
    }
    
    return formatMemberData(res.data.data);
  } catch (error) {
    console.error('❌ Search Member API - Error:', error);
    console.warn('⚠️ Using Mock Member Data');
    
    // Return mock member data
    return formatMemberData({
      MEMB_CODE: mbcode,
      FULLNAME: `นาย Mock Member ${mbcode}`,
      DISPLAYNAME: `Mock ${mbcode}`,
      MEMB_MOBILE: "0812345678",
      MEMB_SOCID: "XXX-XXXXX-XXX-" + mbcode.slice(-2),
      SIZE_CODE: "L",
      SURVEY_DATE: "/Date(" + Date.now() + "+0700)/",
      SURVEY_METHOD: "ONLINE",
      PROCESSED_BY: null,
      RECEIVER_NAME: null,
      RECEIVER_TYPE: null,
      RECEIVE_DATE: null,
      RECEIVE_STATUS: null,
      REMARKS: null,
      UPDATED_DATE: "/Date(" + Date.now() + "+0700)/",
      USER_ROLE: "member"
    });
  }
};

/**
 * Get member list (legacy - without pagination)
 * ถ้า error ให้ return mock data
 * @param {string} sizeCode - Size filter or "ALL"
 * @returns {array} Array of formatted member data
 */
export async function getShirtMemberList(sizeCode) {
  try {
    const res = await api.get(
      `/GetShirtMemberList?size_code=${encodeURIComponent(sizeCode)}`
    );
    
    if (res.data?.responseCode !== 200) {
      throw new Error(res.data?.responseMessage || "เกิดข้อผิดพลาด");
    }
    
    const data = res.data.data || [];
    return Array.isArray(data) ? data.map(formatMemberData) : [];
  } catch (error) {
    console.error('❌ Get Member List API - Error:', error);
    console.warn('⚠️ Using Mock Member List');
    
    // Return mock data
    const mockMembers = [
      {
        MEMB_CODE: "012938",
        FULLNAME: "นายสมัย เสริฐเจิม",
        DISPLAYNAME: "คุณสมัย",
        MEMB_MOBILE: "0812681022",
        MEMB_SOCID: "XXX-XXXXX-XXX-52",
        SIZE_CODE: "XL",
        SURVEY_DATE: "/Date(" + (Date.now() - 86400000) + "+0700)/",
        SURVEY_METHOD: "ONLINE",
        PROCESSED_BY: "012938",
        RECEIVER_NAME: null,
        RECEIVER_TYPE: "SELF",
        RECEIVE_DATE: "/Date(" + Date.now() + "+0700)/",
        RECEIVE_STATUS: "RECEIVED",
        REMARKS: null,
        UPDATED_DATE: "/Date(" + Date.now() + "+0700)/",
        USER_ROLE: "admin"
      },
      {
        MEMB_CODE: "123456",
        FULLNAME: "นางสาวสมหญิง ดีมาก",
        DISPLAYNAME: "คุณสมหญิง",
        MEMB_MOBILE: "0898765432",
        MEMB_SOCID: "XXX-XXXXX-XXX-45",
        SIZE_CODE: "L",
        SURVEY_DATE: "/Date(" + (Date.now() - 172800000) + "+0700)/",
        SURVEY_METHOD: "ONLINE",
        PROCESSED_BY: null,
        RECEIVER_NAME: null,
        RECEIVER_TYPE: null,
        RECEIVE_DATE: null,
        RECEIVE_STATUS: null,
        REMARKS: null,
        UPDATED_DATE: "/Date(" + (Date.now() - 172800000) + "+0700)/",
        USER_ROLE: "member"
      }
    ];
    
    return mockMembers.map(formatMemberData);
  }
}

/**
 * Get member list with pagination
 * @param {object} params - { page, pageSize, search, status, size_code }
 * @returns {object} { data, totalCount, currentPage, pageSize, totalPages }
 */
export const getShirtMemberListPaged = async ({
  page = 1,
  pageSize = 20,
  search = '',
  status = '',
  size_code = ''
}) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString()
    });
    
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (size_code) params.append('size_code', size_code);
    
    console.log("📋 Get Members Paged API - Request params:", Object.fromEntries(params));
    
    const res = await api.get(`/GetShirtMemberListPaged?${params.toString()}`);
    
    console.log("📋 Get Members Paged API - Response:", res.data);
    
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
      responseCode: res.data.responseCode,
      responseMessage: res.data.responseMessage
    };
  } catch (error) {
    console.error('❌ Get Members Paged API - Error:', error);
    throw error;
  }
};

/**
 * Submit pickup/distribution record
 * ถ้า API ยังไม่พร้อม จะ mock success response
 * @param {object} pickupData - Pickup information
 * @returns {object} API response
 */
export const submitPickup = async (pickupData) => {
  const payload = {
    MEMB_CODE: pickupData.memberCode,
    SIZE_CODE: pickupData.sizeCode,
    PROCESSED_BY: pickupData.processedBy, // รหัสเจ้าหน้าที่ที่จ่าย
    RECEIVER_TYPE: pickupData.receiverType, // "SELF" หรือ "OTHER"
    RECEIVER_NAME: pickupData.receiverName || null, // ชื่อผู้รับแทน (ถ้ามี)
    SIGNATURE_DATA: pickupData.signatureData, // Base64 ของลายเซ็น
    REMARKS: pickupData.remarks || "",
  };
  
  console.log("📦 Submit Pickup API - Request:", payload);
  
  try {
    const res = await api.post('/SubmitPickup', payload);
    
    console.log("📦 Submit Pickup API - Response:", res.data);
    
    if (res.data?.responseCode !== 200) {
      throw new Error(res.data?.responseMessage || 'บันทึกการรับเสื้อไม่สำเร็จ');
    }
    
    return res.data;
  } catch (error) {
    console.error('❌ Submit Pickup API - Error:', error);
    console.warn('⚠️ Using Mock Submit Pickup Response');
    
    // Return mock success response
    return {
      responseCode: 200,
      responseMessage: 'บันทึกการรับเสื้อสำเร็จ (Mock)',
      data: {
        ...payload,
        RECEIVE_DATE: new Date().toISOString(),
        RECEIVE_STATUS: 'RECEIVED',
        UPDATED_DATE: new Date().toISOString()
      }
    };
  }
};

/**
 * Get dashboard statistics
 * คำนวณสถิติเองจากข้อมูล GetShirtMemberListPaged
 * ถ้า error ให้ใช้ mock data
 * @returns {object} Dashboard stats
 */
export const getDashboardStats = async () => {
  try {
    console.log("📊 Calculating Dashboard Stats...");
    
    // ดึงข้อมูลสมาชิกทั้งหมด (page size ใหญ่เพื่อให้ได้ข้อมูลครบ)
    const response = await getShirtMemberListPaged({
      page: 1,
      pageSize: 10000, // ดึงข้อมูลทั้งหมด
      search: '',
      status: '',
      size_code: ''
    });
    
    const allMembers = response.data || [];
    
    // คำนวณสถิติ
    const totalMembers = allMembers.length;
    const confirmedMembers = allMembers.filter(m => m.sizeCode).length;
    const receivedMembers = allMembers.filter(m => m.hasReceived).length;
    const pendingMembers = totalMembers - confirmedMembers;
    
    // นับตามประเภทผู้รับ
    const selfReceived = allMembers.filter(m => 
      m.hasReceived && m.receiverType === 'SELF'
    ).length;
    const proxyReceived = allMembers.filter(m => 
      m.hasReceived && m.receiverType === 'OTHER'
    ).length;
    
    // นับขนาดที่ได้รับความนิยม
    const sizeCount = {};
    allMembers.forEach(m => {
      if (m.sizeCode) {
        sizeCount[m.sizeCode] = (sizeCount[m.sizeCode] || 0) + 1;
      }
    });
    
    const popularSizes = Object.entries(sizeCount)
      .map(([size, count]) => ({ size, count }))
      .sort((a, b) => b.count - a.count);
    
    // นับตามช่องทางการสำรวจ
    const onlineCount = allMembers.filter(m => 
      m.surveyMethod === 'ONLINE'
    ).length;
    const manualCount = allMembers.filter(m => 
      m.surveyMethod === 'MANUAL'
    ).length;
    
    const stats = {
      totalMembers,
      confirmedMembers,
      receivedMembers,
      pendingMembers,
      selfReceived,
      proxyReceived,
      popularSizes,
      surveyMethods: {
        online: onlineCount,
        manual: manualCount
      }
    };
    
    console.log("✅ Dashboard Stats:", stats);
    
    return stats;
  } catch (error) {
    console.error('❌ Calculate Dashboard Stats - Error:', error);
    console.warn('⚠️ Using Mock Dashboard Stats');
    
    // Return mock data
    return {
      totalMembers: 1250,
      confirmedMembers: 980,
      receivedMembers: 450,
      pendingMembers: 270,
      selfReceived: 380,
      proxyReceived: 70,
      popularSizes: [
        { size: 'L', count: 320 },
        { size: 'XL', count: 280 },
        { size: 'M', count: 210 },
        { size: '2XL', count: 95 },
        { size: 'S', count: 75 }
      ],
      surveyMethods: {
        online: 850,
        manual: 130
      }
    };
  }
};

/**
 * Get inventory summary by size from API
 * @returns {array} Inventory summary
 */
export const getInventorySummary = async () => {
  try {
    console.log("📦 Loading Inventory from GetStocks API...");
    
    const res = await api.get('/GetStocks');
    
    console.log("📦 GetStocks API Response:", res.data);
    
    if (res.data?.responseCode !== 200) {
      throw new Error(res.data?.responseMessage || 'ไม่สามารถโหลดข้อมูลสต็อกได้');
    }
    
    const stockData = res.data.data || [];
    
    // Format ข้อมูลให้ตรงกับที่ component ต้องการ
    const inventorySummary = stockData.map(stock => ({
      sizeCode: stock.SIZE_CODE,
      produced: stock.PRODUCED_QTY || 0,
      reserved: (stock.PRODUCED_QTY || 0) - (stock.REMAINING_QTY || 0), // คำนวณจากที่ผลิต - คงเหลือ
      received: stock.DISTRIBUTED_QTY || 0,
      remaining: stock.REMAINING_QTY || 0,
      lowStockThreshold: stock.LOW_STOCK_THRESHOLD || 50,
      stockId: stock.STOCK_ID,
      updatedBy: stock.UPDATED_BY,
      updatedDate: parseWcfDate(stock.UPDATED_DATE),
      remarks: stock.REMARKS
    }));
    
    // Sort ตามลำดับขนาด
    const sizeOrder = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL"];
    inventorySummary.sort((a, b) => {
      return sizeOrder.indexOf(a.sizeCode) - sizeOrder.indexOf(b.sizeCode);
    });
    
    console.log("✅ Inventory Summary (from API):", inventorySummary);
    
    return inventorySummary;
  } catch (error) {
    console.error('❌ GetStocks API - Error:', error);
    console.warn('⚠️ Using Mock Inventory Summary');
    
    // Return mock data
    return [
      { sizeCode: 'XS', produced: 300, reserved: 0, received: 0, remaining: 300, lowStockThreshold: 30 },
      { sizeCode: 'S', produced: 500, reserved: 0, received: 0, remaining: 500, lowStockThreshold: 50 },
      { sizeCode: 'M', produced: 800, reserved: 0, received: 0, remaining: 800, lowStockThreshold: 80 },
      { sizeCode: 'L', produced: 1000, reserved: 0, received: 0, remaining: 1000, lowStockThreshold: 100 },
      { sizeCode: 'XL', produced: 800, reserved: 0, received: 0, remaining: 800, lowStockThreshold: 80 },
      { sizeCode: '2XL', produced: 600, reserved: 0, received: 0, remaining: 600, lowStockThreshold: 60 },
      { sizeCode: '3XL', produced: 400, reserved: 0, received: 0, remaining: 400, lowStockThreshold: 40 },
      { sizeCode: '4XL', produced: 300, reserved: 0, received: 0, remaining: 300, lowStockThreshold: 30 },
      { sizeCode: '5XL', produced: 200, reserved: 0, received: 0, remaining: 200, lowStockThreshold: 20 },
      { sizeCode: '6XL', produced: 100, reserved: 0, received: 0, remaining: 100, lowStockThreshold: 10 }
    ];
  }
};

/**
 * Add or adjust inventory stock
 * ถ้า API ยังไม่พร้อม จะ mock success response
 * @param {object} adjustmentData - { sizeCode, quantity, type, remarks }
 * @returns {object} API response
 */
export const adjustInventory = async (adjustmentData) => {
  const payload = {
    SIZE_CODE: adjustmentData.sizeCode,
    QUANTITY: adjustmentData.quantity,
    ADJUSTMENT_TYPE: adjustmentData.type, // "ADD" or "REMOVE"
    REMARKS: adjustmentData.remarks || "",
    PROCESSED_BY: adjustmentData.processedBy,
  };
  
  console.log("📊 Adjust Inventory API - Request:", payload);
  
  try {
    const res = await api.post('/AdjustInventory', payload);
    
    console.log("📊 Adjust Inventory API - Response:", res.data);
    
    if (res.data?.responseCode !== 200) {
      throw new Error(res.data?.responseMessage || 'ไม่สามารถปรับสต็อกได้');
    }
    
    return res.data;
  } catch (error) {
    console.error('❌ Adjust Inventory API - Error:', error);
    console.warn('⚠️ Using Mock Adjust Inventory Response');
    
    // Return mock success response
    return {
      responseCode: 200,
      responseMessage: `${payload.ADJUSTMENT_TYPE === 'ADD' ? 'เติม' : 'เบิก'}สต็อกสำเร็จ (Mock)`,
      data: {
        ...payload,
        ADJUSTMENT_DATE: new Date().toISOString(),
        UPDATED_DATE: new Date().toISOString()
      }
    };
  }
};

// Export formatted data helper for external use
export { formatMemberData, parseWcfDate };