import axios from "axios";
import { API_ENDPOINTS, MESSAGES } from "../utils/constants";

// URL ของ API จริง
const REAL_API_BASE_URL = 'https://apps4.coop.ku.ac.th/KusccToolService/service1.svc';

// เข้าสู่ระบบ - เรียกใช้ API จริง
export const loginMember = async ({ memberCode, phone, idCard }) => {
  try {
    const res = await axios.post(
      `${REAL_API_BASE_URL}/ShirtSurveyLogin`,
      {
        mbcode: memberCode,
        socid: idCard,
        mobile: phone,
      },
      {
        headers: { 
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 seconds timeout
      }
    );

    if (res.data && res.data.responseCode === 200) {
      const d = res.data.data;
      
      // จัดการข้อมูลวันที่ (ถ้ามี)
      let surveyDate = null;
      if (d.SURVEY_DATE) {
        const dateMatch = d.SURVEY_DATE.match(/\/Date\((\d+)\+/);
        if (dateMatch) {
          surveyDate = new Date(parseInt(dateMatch[1]));
        }
      }

      // กำหนดสถานะตามข้อมูลที่ได้รับ
      let status = "ยังไม่ยืนยันขนาด";
      if (d.SIZE_CODE) {
        status = "ยืนยันขนาดแล้ว";
      }

      return {
        memberCode: d.MEMB_CODE,
        name: d.DISPLAYNAME || d.FULLNAME || d.MEMB_CODE,
        fullName: d.FULLNAME,
        displayName: d.DISPLAYNAME,
        phone: d.MEMB_MOBILE,
        round: d.MEMB_SOCID ? d.MEMB_SOCID.split("-").pop() : idCard,
        selectedSize: d.SIZE_CODE || null,
        remarks: d.REMARKS || '',
        surveyDate: surveyDate,
        surveyMethod: d.SURVEY_METHOD,
        status: status,
        socialId: d.MEMB_SOCID
      };
    } else {
      throw new Error(res.data?.responseMessage || MESSAGES.MEMBER_NOT_FOUND);
    }
  } catch (error) {
    console.error('Login API Error:', error);
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง');
    }
    
    if (error.response) {
      const statusCode = error.response.status;
      if (statusCode === 404) {
        throw new Error('ไม่พบข้อมูลสมาชิก');
      } else if (statusCode === 500) {
        throw new Error('เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง');
      } else {
        throw new Error(error.response.data?.responseMessage || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
      }
    } else if (error.request) {
      throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
    } else {
      throw new Error(error.message || MESSAGES.MEMBER_NOT_FOUND);
    }
  }
};

// บันทึกขนาดเสื้อ - เรียกใช้ API จริง (ใช้สำหรับ MemberPortal)
export const saveMemberSize = async ({
  memberCode,
  sizeCode,
  remarks = "",
  surveyMethod = "MANUAL",
}) => {
  try {
    // สร้าง URL endpoint ที่ถูกต้อง
    const saveUrl = `${REAL_API_BASE_URL}/AddShirtSurvey`;
    
    const res = await axios.post(
      saveUrl,
      {
        MEMB_CODE: memberCode,
        SIZE_CODE: sizeCode,
        SURVEY_METHOD: surveyMethod,
        REMARKS: remarks,
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 15000
      }
    );

    if (res.data && res.data.responseCode === 200) {
      return res.data.data;
    } else {
      throw new Error(res.data?.responseMessage || "บันทึกขนาดไม่สำเร็จ");
    }
  } catch (error) {
    console.error('Save Size API Error:', error);
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง');
    }
    
    throw new Error(error.response?.data?.responseMessage || error.message || "บันทึกขนาดไม่สำเร็จ");
  }
};

// Backward compatibility functions
export const searchMember = async ({ memberCode, phone, idCard }) => {
  return await loginMember({ memberCode, phone, idCard });
};

export const updateMemberSize = async (memberCode, size) => {
  return await saveMemberSize({
    memberCode,
    sizeCode: size,
    remarks: "Updated via web portal",
    surveyMethod: "MANUAL"
  });
};

// ค้นหาสมาชิกด้วยรหัสเท่านั้น (สำหรับ Admin) - ต้องใช้ API อื่น
export const searchMemberByCode = async (memberCode) => {
  try {
    // ยังไม่มี API สำหรับค้นหาด้วยรหัสเท่านั้น
    // ต้องใช้ loginMember แต่ต้องมีข้อมูลครบ
    throw new Error('ต้องใช้ข้อมูลเบอร์โทรศัพท์และบัตรประชาชนในการค้นหา กรุณาใช้ฟังก์ชัน searchMember แทน');
  } catch (error) {
    throw error;
  }
};

// Mock data สำหรับสถิติการแจก (ยังไม่มี API จริง)
export const getDistributionSummary = async () => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    totalMembers: 1250,
    confirmedSizes: 980,
    distributedShirts: 650,
    remainingStock: 2150,
    bySize: { S: 150, M: 300, L: 450, XL: 280, "2XL": 180 },
  };
};