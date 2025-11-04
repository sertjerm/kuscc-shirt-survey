// ===================================================================
// File: src/utils/constants.js
// Description: Constants สำหรับ Shirt Survey Application
// ===================================================================

// API Base URL
//export const REAL_API_BASE_URL = "https://apps4.coop.ku.ac.th/KusccToolService/service1.svc";
export const REAL_API_BASE_URL =
  "https://apps4.coop.ku.ac.th/KusccToolService2Dev/service1.svc"; // Dev

// ===================================================================
// สถานะสมาชิก (Member Status)
// ===================================================================
export const MEMBER_STATUS = {
  NOT_CONFIRMED: "NOT_CONFIRMED",
  CONFIRMED: "CONFIRMED",
  RECEIVED: "RECEIVED",
};

export const STATUS_LABELS = {
  NOT_CONFIRMED: "ยังไม่ยืนยัน",
  CONFIRMED: "ยืนยันแล้ว",
  RECEIVED: "รับแล้ว",
};

export const STATUS_COLORS = {
  NOT_CONFIRMED: "#faad14", // สีเหลือง
  CONFIRMED: "#1890ff", // สีน้ำเงิน
  RECEIVED: "#52c41a", // สีเขียว
};

// ===================================================================
// ประเภทผู้รับเสื้อ (Receiver Type)
// ===================================================================
export const RECEIVER_TYPE = {
  SELF: "SELF", // รับด้วยตนเอง
  PROXY: "PROXY", // รับแทน
};

export const RECEIVER_TYPE_LABELS = {
  SELF: "รับด้วยตนเอง",
  PROXY: "รับแทน",
};

// ===================================================================
// วิธีการสำรวจ (Survey Method)
// ===================================================================
export const SURVEY_METHOD = {
  ONLINE: "ONLINE", // ออนไลน์ผ่านระบบ
  OFFLINE: "OFFLINE", // ออฟไลน์ (กรอกโดยเจ้าหน้าที่)
  IMPORT: "IMPORT", // นำเข้าจากไฟล์
};

export const SURVEY_METHOD_LABELS = {
  ONLINE: "ออนไลน์",
  OFFLINE: "ออฟไลน์",
  IMPORT: "นำเข้าข้อมูล",
};

// ===================================================================
// ประเภทการปรับสต็อก (Stock Action Type)
// ===================================================================
export const STOCK_ACTION = {
  PRODUCE: "PRODUCE", // ผลิตเพิ่ม
  DISTRIBUTE: "DISTRIBUTE", // จ่ายออก
  ADJUST: "ADJUST", // ปรับปรุง
  RETURN: "RETURN", // คืน
};

export const STOCK_ACTION_LABELS = {
  PRODUCE: "ผลิตเพิ่ม",
  DISTRIBUTE: "จ่ายออก",
  ADJUST: "ปรับปรุง",
  RETURN: "คืนสต็อก",
};

// ===================================================================
// เกณฑ์แจ้งเตือนสต็อกต่ำ
// ===================================================================
export const LOW_STOCK_THRESHOLD = 50; // แจ้งเตือนเมื่อเหลือน้อยกว่าหรือเท่ากับ 50 ตัว

// ===================================================================
// การแบ่งหน้า (Pagination)
// ===================================================================
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = ["10", "20", "50", "100"];

// ===================================================================
// User Roles
// ===================================================================
export const USER_ROLE = {
  MEMBER: "MEMBER",
  STAFF: "STAFF",
  ADMIN: "ADMIN",
};

export const USER_ROLE_LABELS = {
  MEMBER: "สมาชิก",
  STAFF: "เจ้าหน้าที่",
  ADMIN: "ผู้ดูแลระบบ",
};

// ===================================================================
// ⚠️ DEPRECATED: ขนาดเสื้อ
// ⚠️ แทนที่ด้วยการเรียก getShirtSizes() จาก shirtApi.js
// ⚠️ เก็บไว้เพื่อ backward compatibility เท่านั้น
// ===================================================================

/*
  ⛔ DEPRECATED - อย่าใช้ SHIRT_SIZES, SIZE_ORDER, SIZE_ORDER_MAP อีกต่อไป
  
  ✅ ใช้แทน:
  - getShirtSizes() -> ดึงข้อมูลขนาดเสื้อจาก API
  - getSizeOrder() -> ดึง array ของ SIZE_CODE เรียงตาม SORT_ORDER
  - getSizeOrderMap() -> ดึง map ของ SIZE_CODE -> SORT_ORDER
  - getSizeInfo(sizeCode) -> ค้นหาข้อมูลขนาดเสื้อ
  
  📖 ตัวอย่าง:
  
  // แบบเดิม (DEPRECATED)
  import { SHIRT_SIZES, SIZE_ORDER } from '../utils/constants';
  
  // แบบใหม่ (แนะนำ)
  import { getShirtSizes, getSizeOrder } from '../services/shirtApi';
  
  const MyComponent = () => {
    const [sizes, setSizes] = useState([]);
    
    useEffect(() => {
      const loadSizes = async () => {
        const sizesData = await getShirtSizes();
        setSizes(sizesData);
      };
      loadSizes();
    }, []);
    
    return (
      <div>
        {sizes.map(size => (
          <div key={size.SIZE_CODE}>
            {size.SIZE_CODE} - {size.SIZE_NAME}
            (รอบอก {size.CHEST_INCH}" ยาว {size.LENGTH_INCH}")
          </div>
        ))}
      </div>
    );
  };
*/

// ===================================================================
// Validation Rules
// ===================================================================
export const VALIDATION = {
  MEMBER_CODE: {
    LENGTH: 6,
    PATTERN: /^\d{6}$/,
    MESSAGE: "เลขสมาชิกต้องเป็นตัวเลข 6 หลัก",
  },
  PHONE: {
    LENGTH: 10,
    PATTERN: /^0\d{9}$/,
    MESSAGE: "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก เริ่มต้นด้วย 0",
  },
  ID_CARD_LAST_3: {
    LENGTH: 3,
    PATTERN: /^\d{3}$/,
    MESSAGE: "เลขบัตรประชาชน 3 หลักสุดท้ายต้องเป็นตัวเลข",
  },
};

// ===================================================================
// Date/Time Formats
// ===================================================================
export const DATE_FORMAT = "DD/MM/YYYY";
export const DATETIME_FORMAT = "DD/MM/YYYY HH:mm:ss";
export const TIME_FORMAT = "HH:mm:ss";

// ===================================================================
// API Response Codes
// ===================================================================
export const API_RESPONSE_CODE = {
  SUCCESS: 200,
  NOT_FOUND: 404,
  ERROR: 500,
};

// ===================================================================
// Error Messages
// ===================================================================
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง",
  MEMBER_NOT_FOUND: "ไม่พบข้อมูลสมาชิก กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง",
  SAVE_SIZE_FAILED: "ไม่สามารถบันทึกขนาดเสื้อได้ กรุณาลองใหม่อีกครั้ง",
  SUBMIT_PICKUP_FAILED: "ไม่สามารถบันทึกการรับเสื้อได้ กรุณาลองใหม่อีกครั้ง",
  LOAD_INVENTORY_FAILED: "ไม่สามารถโหลดข้อมูลสต็อกได้ กรุณาลองใหม่อีกครั้ง",
  UPDATE_STOCK_FAILED: "ไม่สามารถปรับสต็อกได้ กรุณาลองใหม่อีกครั้ง",
  UNAUTHORIZED: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
};

// ===================================================================
// Success Messages
// ===================================================================
export const SUCCESS_MESSAGES = {
  SAVE_SIZE_SUCCESS: "บันทึกขนาดเสื้อเรียบร้อยแล้ว",
  SUBMIT_PICKUP_SUCCESS: "บันทึกการรับเสื้อเรียบร้อยแล้ว",
  ADD_STOCK_SUCCESS: "เติมสต็อกเรียบร้อยแล้ว",
  REMOVE_STOCK_SUCCESS: "เบิกสต็อกเรียบร้อยแล้ว",
  CLEAR_DATA_SUCCESS: "ล้างข้อมูลเรียบร้อยแล้ว",
};

// ===================================================================
// Local Storage Keys
// ===================================================================
export const STORAGE_KEYS = {
  USER: "shirt_survey_user",
  AUTH_TOKEN: "shirt_survey_token",
  LAST_LOGIN: "shirt_survey_last_login",
};

// ===================================================================
// Routes
// ===================================================================
export const ROUTES = {
  LOGIN: "/",
  SURVEY: "/survey",
  ADMIN: "/admin",
  MEMBER_PORTAL: "/member",
};

// ===================================================================
// Helper Functions
// ===================================================================

/**
 * ฟังก์ชันตรวจสอบว่าสต็อกต่ำหรือไม่
 * @param {number} remaining - จำนวนที่เหลือ
 * @returns {boolean}
 */
export const isLowStock = (remaining) => {
  return remaining <= LOW_STOCK_THRESHOLD;
};

/**
 * ฟังก์ชันแปลง status เป็นสี
 * @param {string} status - สถานะ
 * @returns {string} - รหัสสี
 */
export const getStatusColor = (status) => {
  return STATUS_COLORS[status] || "#d9d9d9";
};

/**
 * ฟังก์ชันแปลง status เป็นข้อความ
 * @param {string} status - สถานะ
 * @returns {string} - ข้อความแสดงสถานะ
 */
export const getStatusLabel = (status) => {
  return STATUS_LABELS[status] || status;
};

/**
 * ฟังก์ชัน Pad เลขสมาชิกเป็น 6 หลัก
 * @param {string|number} memberCode - เลขสมาชิก
 * @returns {string}
 */
export const padMemberCode = (memberCode) => {
  return String(memberCode || "").padStart(6, "0");
};

/**
 * ฟังก์ชันตรวจสอบรูปแบบเลขสมาชิก
 * @param {string} memberCode - เลขสมาชิก
 * @returns {boolean}
 */
export const isValidMemberCode = (memberCode) => {
  return VALIDATION.MEMBER_CODE.PATTERN.test(memberCode);
};

/**
 * ฟังก์ชันตรวจสอบรูปแบบเบอร์โทรศัพท์
 * @param {string} phone - เบอร์โทรศัพท์
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
  return VALIDATION.PHONE.PATTERN.test(phone);
};

/**
 * ฟังก์ชันตรวจสอบรูปแบบเลขบัตรประชาชน 3 หลักสุดท้าย
 * @param {string} idCard - เลขบัตรประชาชน 3 หลักสุดท้าย
 * @returns {boolean}
 */
export const isValidIdCardLast3 = (idCard) => {
  return VALIDATION.ID_CARD_LAST_3.PATTERN.test(idCard);
};

// ===================================================================
// Default Shirt Sizes
// ใช้เป็น Fallback เมื่อ API ไม่ทำงาน
// ===================================================================

export const DEFAULT_SHIRT_SIZES = [
  {
    SIZE_CODE: "MINI",
    SIZE_NAME: "มินิไซส์",
    SIZE_NAME_EN: "Mini Size",
    CHEST_INCH: 38,
    LENGTH_INCH: 23,
    REMARKS: "ขนาดเล็กพิเศษ สำหรับผู้มีรูปร่างเล็กมาก",
    SORT_ORDER: 0,
  },
  {
    SIZE_CODE: "XS",
    SIZE_NAME: "เอ็กซ์ตร้า สมอลล์",
    SIZE_NAME_EN: "Extra Small",
    CHEST_INCH: 40,
    LENGTH_INCH: 24,
    REMARKS: null,
    SORT_ORDER: 1,
  },
  {
    SIZE_CODE: "S",
    SIZE_NAME: "สมอลล์",
    SIZE_NAME_EN: "Small",
    CHEST_INCH: 42,
    LENGTH_INCH: 25,
    REMARKS: null,
    SORT_ORDER: 2,
  },
  {
    SIZE_CODE: "M",
    SIZE_NAME: "มีเดียม",
    SIZE_NAME_EN: "Medium",
    CHEST_INCH: 44,
    LENGTH_INCH: 26,
    REMARKS: null,
    SORT_ORDER: 3,
  },
  {
    SIZE_CODE: "L",
    SIZE_NAME: "ลาร์จ",
    SIZE_NAME_EN: "Large",
    CHEST_INCH: 46,
    LENGTH_INCH: 27,
    REMARKS: null,
    SORT_ORDER: 4,
  },
  {
    SIZE_CODE: "XL",
    SIZE_NAME: "เอ็กซ์ตร้า ลาร์จ",
    SIZE_NAME_EN: "Extra Large",
    CHEST_INCH: 48,
    LENGTH_INCH: 28,
    REMARKS: null,
    SORT_ORDER: 5,
  },
  {
    SIZE_CODE: "2XL",
    SIZE_NAME: "ทู เอ็กซ์ ลาร์จ",
    SIZE_NAME_EN: "2X Large",
    CHEST_INCH: 50,
    LENGTH_INCH: 29,
    REMARKS: null,
    SORT_ORDER: 6,
  },
  {
    SIZE_CODE: "3XL",
    SIZE_NAME: "ทรี เอ็กซ์ ลาร์จ",
    SIZE_NAME_EN: "3X Large",
    CHEST_INCH: 52,
    LENGTH_INCH: 30,
    REMARKS: null,
    SORT_ORDER: 7,
  },
  {
    SIZE_CODE: "4XL",
    SIZE_NAME: "โฟร์ เอ็กซ์ ลาร์จ",
    SIZE_NAME_EN: "4X Large",
    CHEST_INCH: 54,
    LENGTH_INCH: 31,
    REMARKS: null,
    SORT_ORDER: 8,
  },
  {
    SIZE_CODE: "5XL",
    SIZE_NAME: "ไฟว์ เอ็กซ์ ลาร์จ",
    SIZE_NAME_EN: "5X Large",
    CHEST_INCH: 56,
    LENGTH_INCH: 32,
    REMARKS: null,
    SORT_ORDER: 9,
  },
  {
    SIZE_CODE: "6XL",
    SIZE_NAME: "ซิกซ์ เอ็กซ์ ลาร์จ",
    SIZE_NAME_EN: "6X Large",
    CHEST_INCH: 58,
    LENGTH_INCH: 33,
    REMARKS: null,
    SORT_ORDER: 10,
  },
  {
    SIZE_CODE: "PLUS",
    SIZE_NAME: "พลัสไซส์",
    SIZE_NAME_EN: "Plus Size",
    CHEST_INCH: 60,
    LENGTH_INCH: 34,
    REMARKS: "ขนาดใหญ่พิเศษ สำหรับผู้ที่ต้องการขนาดใหญ่มากเป็นพิเศษ",
    SORT_ORDER: 11,
  },
];

// ===================================================================
// Delivery Options
// ===================================================================

export const DELIVERY_OPTIONS = {
  COOP: "coop",
  SYSTEM: "system",
  CUSTOM: "custom",
};

export const DELIVERY_OPTION_LABELS = {
  [DELIVERY_OPTIONS.COOP]: "รับที่สหกรณ์",
  [DELIVERY_OPTIONS.SYSTEM]: "จัดส่งตามที่อยู่ในระบบ",
  [DELIVERY_OPTIONS.CUSTOM]: "จัดส่งตามที่อยู่ใหม่",
};

// ===================================================================
// Survey Method
// ===================================================================

export const SURVEY_METHODS = {
  ONLINE: "ONLINE",
  MANUAL: "MANUAL",
  IMPORT: "IMPORT",
};

// ===================================================================
// Receiver Type
// ===================================================================

export const RECEIVER_TYPES = {
  SELF: "SELF",
  PROXY: "PROXY",
};

// ===================================================================
// Status
// ===================================================================

export const RECEIVE_STATUS = {
  PENDING: "PENDING",
  RECEIVED: "RECEIVED",
};

// ===================================================================
// UI Constants (เพิ่มเติม)
// ===================================================================

export const COLORS = {
  PRIMARY: "#1E88E5",
  SUCCESS: "#4CAF50",
  WARNING: "#FF9800",
  ERROR: "#F44336",
  INFO: "#2196F3",
};

// ===================================================================
// Helper Functions (เพิ่มเติม)
// ===================================================================

/**
 * ดึงชื่อขนาดเสื้อจาก SIZE_CODE
 * @param {string} sizeCode - รหัสขนาดเสื้อ
 * @returns {string} ชื่อขนาดเสื้อ
 */
export const getSizeName = (sizeCode) => {
  const size = DEFAULT_SHIRT_SIZES.find((s) => s.SIZE_CODE === sizeCode);
  return size ? size.SIZE_NAME : sizeCode;
};

/**
 * ดึงข้อมูลขนาดเสื้อทั้งหมดจาก SIZE_CODE
 * @param {string} sizeCode - รหัสขนาดเสื้อ
 * @returns {Object|null} ข้อมูลขนาดเสื้อ
 */
export const getSizeInfo = (sizeCode) => {
  return DEFAULT_SHIRT_SIZES.find((s) => s.SIZE_CODE === sizeCode) || null;
};
