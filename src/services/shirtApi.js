// services/shirtApi.js
import axios from "axios";

const REAL_API_BASE_URL =
  "https://apps4.coop.ku.ac.th/KusccToolService/service1.svc";

// ใช้ instance เดียวตลอด เพื่อแชร์ cookie/session
export const api = axios.create({
  baseURL: REAL_API_BASE_URL,
  withCredentials: true, // สำคัญ: ให้เบราว์เซอร์ส่ง/รับ cookie
  headers: {
    "Content-Type": "application/json; charset=utf-8",
  },
  timeout: 15000,
  maxBodyLength: Infinity,
});

// ---- Login (ให้ server เซ็ต ASP.NET_SessionId กลับมา) ----
export const loginMember = async ({ memberCode, phone, idCard }) => {
  const payload = {
    mbcode: memberCode, // ถ้า endpoint login เดิมใช้ lowercase ก็ส่งตามนั้น
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
