// src/utils/constants.js

export const SHIRT_SIZES = [
  { code: 'XS', chest: 36, length: 26, description: 'รอบอก 36" ยาว 26"' },
  { code: 'S', chest: 38, length: 27, description: 'รอบอก 38" ยาว 27"' },
  { code: 'M', chest: 40, length: 28, description: 'รอบอก 40" ยาว 28"' },
  { code: 'L', chest: 42, length: 29, description: 'รอบอก 42" ยาว 29"' },
  { code: 'XL', chest: 44, length: 30, description: 'รอบอก 44" ยาว 30"' },
  { code: '2XL', chest: 46, length: 31, description: 'รอบอก 46" ยาว 31"' },
  { code: '3XL', chest: 48, length: 32, description: 'รอบอก 48" ยาว 32"' },
  { code: '4XL', chest: 50, length: 33, description: 'รอบอก 50" ยาว 33"' },
  { code: '5XL', chest: 52, length: 34, description: 'รอบอก 52" ยาว 34"' },
  { code: '6XL', chest: 54, length: 35, description: 'รอบอก 54" ยาว 35"' }
];

export const MEMBER_STATUS = {
  NOT_CONFIRMED: 'not_confirmed',
  CONFIRMED: 'confirmed',
  RECEIVED: 'received'
};

export const STATUS_COLORS = {
  not_confirmed: '#faad14',
  confirmed: '#1890ff',
  received: '#52c41a'
};

export const STATUS_TEXT = {
  not_confirmed: 'ยังไม่ยืนยันขนาด',
  confirmed: 'ยืนยันขนาดแล้ว',
  received: 'รับเสื้อไปแล้ว'
};

export const API_ENDPOINTS = {
  BASE_URL: 'https://apps4.coop.ku.ac.th/KusccShirtService/Service1.svc',
  SEARCH_MEMBER: '/SearchMember',
  UPDATE_SIZE: '/UpdateMemberSize',
  RECORD_DISTRIBUTION: '/RecordDistribution'
};

export const MESSAGES = {
  LOGIN_SUCCESS: 'เข้าสู่ระบบสำเร็จ',
  LOGIN_FAILED: 'ไม่สามารถเข้าสู่ระบบได้',
  MEMBER_NOT_FOUND: 'ไม่พบข้อมูลสมาชิก',
  SIZE_UPDATED: 'บันทึกขนาดเสื้อเรียบร้อย',
  NETWORK_ERROR: 'เกิดข้อผิดพลาดในการเชื่อมต่อ'
};

export const LOW_STOCK_THRESHOLD = 50;
