// src/utils/constants.js

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
    description: 'รอบอก 36" ยาว 26"'
  },
  { 
    code: 'S',
    value: 'S',
    label: 'S',
    chest: 38,
    length: 27,
    chestDisplay: '38"',
    lengthDisplay: '27"',
    description: 'รอบอก 38" ยาว 27"'
  },
  { 
    code: 'M',
    value: 'M',
    label: 'M',
    chest: 40,
    length: 28,
    chestDisplay: '40"',
    lengthDisplay: '28"',
    description: 'รอบอก 40" ยาว 28"'
  },
  { 
    code: 'L',
    value: 'L',
    label: 'L',
    chest: 42,
    length: 29,
    chestDisplay: '42"',
    lengthDisplay: '29"',
    description: 'รอบอก 42" ยาว 29"'
  },
  { 
    code: 'XL',
    value: 'XL',
    label: 'XL',
    chest: 44,
    length: 30,
    chestDisplay: '44"',
    lengthDisplay: '30"',
    description: 'รอบอก 44" ยาว 30"'
  },
  { 
    code: '2XL',
    value: '2XL',
    label: '2XL',
    chest: 46,
    length: 31,
    chestDisplay: '46"',
    lengthDisplay: '31"',
    description: 'รอบอก 46" ยาว 31"'
  },
  { 
    code: '3XL',
    value: '3XL',
    label: '3XL',
    chest: 48,
    length: 32,
    chestDisplay: '48"',
    lengthDisplay: '32"',
    description: 'รอบอก 48" ยาว 32"'
  },
  { 
    code: '4XL',
    value: '4XL',
    label: '4XL',
    chest: 50,
    length: 33,
    chestDisplay: '50"',
    lengthDisplay: '33"',
    description: 'รอบอก 50" ยาว 33"'
  },
  { 
    code: '5XL',
    value: '5XL',
    label: '5XL',
    chest: 52,
    length: 34,
    chestDisplay: '52"',
    lengthDisplay: '34"',
    description: 'รอบอก 52" ยาว 34"'
  },
  { 
    code: '6XL',
    value: '6XL',
    label: '6XL',
    chest: 54,
    length: 35,
    chestDisplay: '54"',
    lengthDisplay: '35"',
    description: 'รอบอก 54" ยาว 35"'
  }
];

// สถานะสมาชิก
export const MEMBER_STATUS = {
  NOT_CONFIRMED: 'not_confirmed',
  CONFIRMED: 'confirmed',
  RECEIVED: 'received'
};

// สีของ status badge
export const STATUS_COLORS = {
  not_confirmed: '#faad14',
  confirmed: '#1890ff',
  received: '#52c41a'
};

// ข้อความแสดง status
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

// เกณฑ์สต็อกต่ำ
export const LOW_STOCK_THRESHOLD = 50;

// Helper Functions (เพิ่มเติม)
export const getSizeByCode = (code) => {
  return SHIRT_SIZES.find(size => size.code === code);
};

export const getSizeDescription = (code) => {
  const size = getSizeByCode(code);
  return size ? size.description : '-';
};