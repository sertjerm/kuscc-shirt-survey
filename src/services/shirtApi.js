import axios from 'axios';
import { API_ENDPOINTS, MESSAGES } from '../utils/constants';

const api = axios.create({
  baseURL: API_ENDPOINTS.BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

export const searchMember = async ({ memberCode, phone, idCard }) => {
  try {
    // Mock data สำหรับทดสอบ
    if (memberCode === '123456' && phone === '0812345678' && idCard === '123') {
      return {
        memberCode: '123456',
        name: 'ทดสอบ ระบบเสื้อ',
        phone: '0812345678',
        idCard: '123',
        selectedSize: null,
        status: 'not_confirmed',
        department: 'หน่วยทดสอบ',
        round: '1/2568'
      };
    }
    
    throw new Error(MESSAGES.MEMBER_NOT_FOUND);
  } catch (error) {
    console.error('searchMember error:', error);
    throw new Error(error.message || MESSAGES.MEMBER_NOT_FOUND);
  }
};

export const updateMemberSize = async (memberCode, size) => {
  try {
    // Mock
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Updated member ${memberCode} size to ${size}`);
    return { success: true };
  } catch (error) {
    throw new Error('ไม่สามารถบันทึกขนาดได้');
  }
};

export const searchMemberByCode = async (memberCode) => {
  try {
    if (memberCode === '123456') {
      return {
        memberCode: '123456',
        name: 'ทดสอบ ระบบเสื้อ',
        phone: '0812345678',
        selectedSize: 'L',
        status: 'confirmed',
        department: 'หน่วยทดสอบ'
      };
    }
    throw new Error(MESSAGES.MEMBER_NOT_FOUND);
  } catch (error) {
    throw error;
  }
};

export const getDistributionSummary = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    totalMembers: 1250,
    confirmedSizes: 980,
    distributedShirts: 650,
    remainingStock: 2150,
    bySize: { 'S': 150, 'M': 300, 'L': 450, 'XL': 280, '2XL': 180 }
  };
};

export default api;
