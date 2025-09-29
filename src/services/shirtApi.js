import axios from "axios";

// ---- CONSTANTS ----
const REAL_API_BASE_URL = "https://apps4.coop.ku.ac.th/KusccToolService/service1.svc";

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

// ---- API FUNCTIONS ----

// ---- GET SHIRT MEMBER LIST (เก่า - เก็บไว้ backward compatible) ----
export async function getShirtMemberList(sizeCode) {
  const res = await api.get(
    `/GetShirtMemberList?size_code=${encodeURIComponent(sizeCode)}`
  );
  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "API error");
  }
  return res.data.data;
}

// ---- NEW PAGED API ----
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
    
    // เพิ่ม parameter เฉพาะที่มีค่า
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (size_code) params.append('size_code', size_code);
    
    const res = await api.get(`/GetShirtMemberListPaged?${params.toString()}`);
    
    if (res.data?.responseCode !== 200 && res.data?.responseCode !== 404) {
      throw new Error(res.data?.responseMessage || "API error");
    }
    
    // Return ทั้ง response เพื่อให้ได้ pagination info
    return {
      data: res.data.data || [],
      totalCount: res.data.totalCount || 0,
      currentPage: res.data.currentPage || page,
      pageSize: res.data.pageSize || pageSize,
      totalPages: res.data.totalPages || 1,
      responseCode: res.data.responseCode,
      responseMessage: res.data.responseMessage
    };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Search member by mbcode (real API)
export async function SearchMember(mbcode) {
  const res = await api.get(
    `/SearchShirtMember?mbcode=${encodeURIComponent(mbcode)}`
  );
  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "API error");
  }
  return res.data.data;
}

// ---- Login (ให้ server เซ็ต ASP.NET_SessionId กลับมา) ----
export const loginMember = async ({ memberCode, phone, idCard }) => {
  const payload = {
    mbcode: memberCode,
    socid: idCard,
    mobile: phone,
  };
  const res = await api.post("/ShirtSurveyLogin", payload);
  console.log("ก่อนเรียก API ส่งข้อมูล:", payload);
  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "ไม่พบข้อมูลสมาชิก");
  }
  console.log("หลังเรียก API ได้ response:", res.data);
  const d = res.data.data || {};
  
  // parse WCF date
  const parseWcfDate = (s) => {
    const m = String(s || "").match(/\/Date\((\d+)\+/);
    return m ? new Date(Number(m[1])) : null;
  };
  
  return {
    memberCode: d.MEMB_CODE,
    name: d.DISPLAYNAME || d.FULLNAME || d.MEMB_CODE,
    fullName: d.FULLNAME,
    displayName: d.DISPLAYNAME,
    phone: d.MEMB_MOBILE,
    round: d.MEMB_SOCID ? d.MEMB_SOCID.split("-").pop() : idCard,
    selectedSize: d.SIZE_CODE || null,
    remarks: d.REMARKS || "",
    surveyDate: parseWcfDate(d.SURVEY_DATE),
    surveyMethod: d.SURVEY_METHOD,
    status: d.SIZE_CODE ? "ยืนยันขนาดแล้ว" : "ยังไม่ยืนยันขนาด",
    socialId: d.MEMB_SOCID,
  };
};

// ---- AddShirtSurvey (ต้องมี session จาก login ก่อน) ----
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
  const res = await api.post("/AddShirtSurvey", payload);
  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "บันทึกขนาดไม่สำเร็จ");
  }
  return res.data;
};

// Additional API functions for Admin features
export const submitPickup = async (pickupData) => {
  try {
    const res = await api.post('/SubmitPickup', pickupData);
    if (res.data?.responseCode !== 200) {
      throw new Error(res.data?.responseMessage || 'Failed to submit pickup');
    }
    return res.data;
  } catch (error) {
    console.error('Submit pickup error:', error);
    throw error;
  }
};

export const getDashboardStats = async () => {
  try {
    const res = await api.get('/GetDashboardStats');
    if (res.data?.responseCode !== 200) {
      throw new Error(res.data?.responseMessage || 'Failed to get dashboard stats');
    }
    return res.data.data;
  } catch (error) {
    console.error('Dashboard stats error:', error);
    throw error;
  }
};