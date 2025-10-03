// src/utils/constants.js
export const REAL_API_BASE_URL =
  "https://apps4.coop.ku.ac.th/KusccToolService2Dev/service1.svc";
  // const REAL_API_BASE_URL =
  // "https://apps4.coop.ku.ac.th/KusccToolService/service1.svc";

// ขนาดเสื้อ (รวม format ทั้งสองแบบ)
export const SHIRT_SIZES = [
  { 
    code: 'XS',
    value: 'XS',  // สำหรับ <option value>
    label: 'XS',  // สำหรับแสดงผล
    chest: 36,    // เก็บเป็นตัวเลข
    length: 26,
    chestDisplay: '36"',  // สำหรับแสดงผล
    lengthDisplay: '26"',
    description: 'รอบอก 36" ยาว 26"',
    order: 1
  },
  { 
    code: 'S',
    value: 'S',
    label: 'S',
    chest: 38,
    length: 27,
    chestDisplay: '38"',
    lengthDisplay: '27"',
    description: 'รอบอก 38" ยาว 27"',
    order: 2
  },
  { 
    code: 'M',
    value: 'M',
    label: 'M',
    chest: 40,
    length: 28,
    chestDisplay: '40"',
    lengthDisplay: '28"',
    description: 'รอบอก 40" ยาว 28"',
    order: 3
  },
  { 
    code: 'L',
    value: 'L',
    label: 'L',
    chest: 42,
    length: 29,
    chestDisplay: '42"',
    lengthDisplay: '29"',
    description: 'รอบอก 42" ยาว 29"',
    order: 4
  },
  { 
    code: 'XL',
    value: 'XL',
    label: 'XL',
    chest: 44,
    length: 30,
    chestDisplay: '44"',
    lengthDisplay: '30"',
    description: 'รอบอก 44" ยาว 30"',
    order: 5
  },
  { 
    code: '2XL',
    value: '2XL',
    label: '2XL',
    chest: 46,
    length: 31,
    chestDisplay: '46"',
    lengthDisplay: '31"',
    description: 'รอบอก 46" ยาว 31"',
    order: 6
  },
  { 
    code: '3XL',
    value: '3XL',
    label: '3XL',
    chest: 48,
    length: 32,
    chestDisplay: '48"',
    lengthDisplay: '32"',
    description: 'รอบอก 48" ยาว 32"',
    order: 7
  },
  { 
    code: '4XL',
    value: '4XL',
    label: '4XL',
    chest: 50,
    length: 33,
    chestDisplay: '50"',
    lengthDisplay: '33"',
    description: 'รอบอก 50" ยาว 33"',
    order: 8
  },
  { 
    code: '5XL',
    value: '5XL',
    label: '5XL',
    chest: 52,
    length: 34,
    chestDisplay: '52"',
    lengthDisplay: '34"',
    description: 'รอบอก 52" ยาว 34"',
    order: 9
  },
  { 
    code: '6XL',
    value: '6XL',
    label: '6XL',
    chest: 54,
    length: 35,
    chestDisplay: '54"',
    lengthDisplay: '35"',
    description: 'รอบอก 54" ยาว 35"',
    order: 10
  }
];

// Size Order Array - สำหรับการเรียงลำดับ
export const SIZE_ORDER = SHIRT_SIZES.map(size => size.code);

// Size Order Map - สำหรับการเข้าถึงลำดับเร็วขึ้น
export const SIZE_ORDER_MAP = SHIRT_SIZES.reduce((acc, size) => {
  acc[size.code] = size.order;
  return acc;
}, {});

// สถานะสมาชิก
export const MEMBER_STATUS = {
  NOT_CONFIRMED: 'NOT_CONFIRMED',
  CONFIRMED: 'CONFIRMED',
  RECEIVED: 'RECEIVED'
};

// ข้อความแสดง status
export const STATUS_LABELS = {
  NOT_CONFIRMED: 'ยังไม่ยืนยัน',
  CONFIRMED: 'ยืนยันแล้ว',
  RECEIVED: 'รับแล้ว'
};

// สีของ status badge (เก็บไว้เผื่อใช้)
export const STATUS_COLORS = {
  NOT_CONFIRMED: '#faad14',
  CONFIRMED: '#1890ff',
  RECEIVED: '#52c41a'
};

// ข้อความแสดง status (รูปแบบเดิม - deprecated, ใช้ STATUS_LABELS แทน)
export const STATUS_TEXT = {
  not_confirmed: 'ยังไม่ยืนยันขนาด',
  confirmed: 'ยืนยันขนาดแล้ว',
  received: 'รับเสื้อไปแล้ว'
};

// API Endpoints
export const API_ENDPOINTS = {
  BASE_URL: 'https://apps4.coop.ku.ac.th/KusccToolService/Service1.svc',
  SEARCH_MEMBER: '/SearchMember',
  UPDATE_SIZE: '/UpdateMemberSize',
  RECORD_DISTRIBUTION: '/RecordDistribution'
};

// Messages
export const MESSAGES = {
  LOGIN_SUCCESS: 'เข้าสู่ระบบสำเร็จ',
  LOGIN_FAILED: 'ไม่สามารถเข้าสู่ระบบได้',
  MEMBER_NOT_FOUND: 'ไม่พบข้อมูลสมาชิก',
  SIZE_UPDATED: 'บันทึกขนาดเสื้อเรียบร้อย',
  NETWORK_ERROR: 'เกิดข้อผิดพลาดในการเชื่อมต่อ'
};

// Survey Methods
export const SURVEY_METHOD = {
  ONLINE: "ONLINE",
  MANUAL: "MANUAL",
};

// Receiver Types
export const RECEIVER_TYPE = {
  SELF: "SELF",
  PROXY: "PROXY",
};

// Adjustment Types for Inventory
export const ADJUSTMENT_TYPE = {
  ADD: "ADD",
  SUBTRACT: "SUBTRACT",
  PRODUCE: "PRODUCE",
};

// เกณฑ์สต็อกต่ำ
export const LOW_STOCK_THRESHOLD = 50;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Date Format
export const DATE_FORMAT = "DD/MM/YYYY HH:mm:ss";
export const DATE_FORMAT_SHORT = "DD/MM/YYYY";

// Validation
export const VALIDATION = {
  MEMBER_CODE_LENGTH: 6,
  PHONE_LENGTH: 10,
  ID_CARD_LAST_DIGITS: 3,
  MAX_REMARKS_LENGTH: 200,
};

// Helper Functions
export const getSizeByCode = (code) => {
  return SHIRT_SIZES.find(size => size.code === code);
};

export const getSizeDescription = (code) => {
  const size = getSizeByCode(code);
  return size ? size.description : '-';
};