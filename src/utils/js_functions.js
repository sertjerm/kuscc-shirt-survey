/**
 * @fileoverview Helper functions สำหรับใช้ทั่วไปในโปรเจค
 */

/**
 * แปลงวันที่จากรูปแบบต่างๆ (รวมถึงรูปแบบ WCF) เป็นรูปแบบ dd/mm/yyyy HH:mm
 *
 * @param {string|number|Date} dateInput - วันที่ที่ต้องการแปลง (รองรับหลายรูปแบบ)
 * @param {object} options - ตัวเลือกเพิ่มเติม
 * @param {boolean} options.includeTime - เพิ่มเวลา (true) หรือแสดงแค่วันที่ (false)
 * @param {string} options.fallback - ข้อความที่แสดงเมื่อแปลงไม่สำเร็จ
 * @returns {string} - วันที่ในรูปแบบ dd/mm/yyyy หรือ dd/mm/yyyy HH:mm
 */
export const formatDateTime = (dateInput, options = {}) => {
  const { includeTime = true, fallback = "-" } = options;

  try {
    if (!dateInput) return fallback;

    let date;

    // รองรับรูปแบบ WCF format /Date(timestamp+timezone)/
    if (typeof dateInput === "string" && dateInput.includes("/Date(")) {
      const matches = dateInput.match(/\/Date\((\d+)(?:[+-]\d{4})?\)\//);
      if (matches && matches[1]) {
        const timestamp = parseInt(matches[1], 10);
        date = new Date(timestamp);
      } else {
        console.warn("Invalid WCF date format:", dateInput);
        return fallback;
      }
    }
    // ถ้าเป็นตัวเลข (timestamp)
    else if (typeof dateInput === "number") {
      date = new Date(dateInput);
    }
    // ถ้าเป็น Date object
    else if (dateInput instanceof Date) {
      date = dateInput;
    }
    // รูปแบบอื่นๆ ใช้ constructor ปกติ
    else {
      date = new Date(dateInput);
    }

    // ตรวจสอบว่าวันที่ถูกต้องหรือไม่
    if (isNaN(date.getTime())) {
      console.warn("Invalid date:", dateInput);
      return fallback;
    }

    // แปลงเป็น dd/mm/yyyy
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    // ถ้าต้องการรวมเวลาด้วย
    if (includeTime) {
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    }

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date:", error, dateInput);
    return fallback;
  }
};

/**
 * แปลงเบอร์โทรศัพท์ให้อยู่ในรูปแบบที่อ่านง่าย: 0xx-xxx-xxxx
 *
 * @param {string} phone - เบอร์โทรศัพท์ 10 หลัก
 * @returns {string} - เบอร์โทรศัพท์ในรูปแบบ 0xx-xxx-xxxx
 */
export const formatPhone = (phone) => {
  if (!phone) return "-";

  // ลบอักขระที่ไม่ใช่ตัวเลขออก
  const digits = phone.replace(/\D/g, "");

  // ถ้าความยาวไม่ถึง 10 หลัก ให้ return เบอร์เดิม
  if (digits.length !== 10) return phone;

  // แปลงเป็นรูปแบบ 0xx-xxx-xxxx
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
};

/**
 * ตัดข้อความให้สั้นลงและเพิ่ม ellipsis (...) ถ้าข้อความยาวเกินกว่าที่กำหนด
 *
 * @param {string} text - ข้อความที่ต้องการตัด
 * @param {number} maxLength - ความยาวสูงสุดที่ต้องการ (ไม่รวม ...)
 * @returns {string} - ข้อความที่ถูกตัดหรือข้อความเดิมถ้าไม่เกินความยาวที่กำหนด
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength) + "...";
};

/**
 * แปลงตัวเลขเป็นสตริงที่มีเครื่องหมายคั่นหลักพัน
 *
 * @param {number} number - ตัวเลขที่ต้องการแปลง
 * @param {number} decimals - จำนวนตำแหน่งทศนิยม (default: 0)
 * @returns {string} - ตัวเลขในรูปแบบสตริงที่มีเครื่องหมายคั่นหลักพัน
 */
export const formatNumber = (number, decimals = 0) => {
  if (number === null || number === undefined) return "-";

  return Number(number).toLocaleString("th-TH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * แปลงข้อมูล snake_case เป็น camelCase
 *
 * @param {string} str - สตริงในรูปแบบ snake_case
 * @returns {string} - สตริงในรูปแบบ camelCase
 */
export const snakeToCamel = (str) => {
  if (!str) return str;
  return str
    .toLowerCase()
    .replace(/([-_][a-z])/g, (group) =>
      group.toUpperCase().replace("-", "").replace("_", "")
    );
};

/**
 * สร้าง URL จาก path และ query parameters
 *
 * @param {string} path - Base path
 * @param {Object} params - Query parameters
 * @returns {string} - URL ที่สร้างขึ้น
 */
export const buildUrl = (path, params = {}) => {
  const url = new URL(path, window.location.origin);

  Object.keys(params).forEach((key) => {
    if (
      params[key] !== undefined &&
      params[key] !== null &&
      params[key] !== ""
    ) {
      url.searchParams.append(key, params[key]);
    }
  });

  return url.toString();
};

/**
 * ตรวจสอบว่าเป็นอุปกรณ์มือถือหรือไม่
 *
 * @returns {boolean} - true ถ้าเป็นอุปกรณ์มือถือ
 */
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * สร้าง ID แบบสุ่ม
 *
 * @param {number} length - ความยาวของ ID (default: 8)
 * @returns {string} - ID แบบสุ่ม
 */
export const generateRandomId = (length = 8) => {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
};
