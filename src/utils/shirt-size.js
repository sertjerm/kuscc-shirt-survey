// ========================================
// FILE 1: src/utils/shirt-sizes.js
// ✅ SINGLE SOURCE OF TRUTH
// ========================================

export const SHIRT_SIZES_CONFIG = {
  sizes: [
    {
      code: "XS",
      name: "Extra Small",
      chest: { cm: 101.6, inch: 40 },
      length: { cm: 61.0, inch: 24 },
      recommendation: {
        height: { min: 150, max: 160 },
        weight: { min: 40, max: 50 },
        bmi: { min: 16.0, max: 20.0 },
      },
      sortOrder: 1,
      active: true,
    },
    {
      code: "S",
      name: "Small",
      chest: { cm: 106.7, inch: 42 },
      length: { cm: 63.5, inch: 25 },
      recommendation: {
        height: { min: 155, max: 165 },
        weight: { min: 45, max: 55 },
        bmi: { min: 18.0, max: 22.0 },
      },
      sortOrder: 2,
      active: true,
    },
    {
      code: "M",
      name: "Medium",
      chest: { cm: 111.8, inch: 44 },
      length: { cm: 66.0, inch: 26 },
      recommendation: {
        height: { min: 160, max: 170 },
        weight: { min: 50, max: 65 },
        bmi: { min: 19.0, max: 24.0 },
      },
      sortOrder: 3,
      active: true,
    },
    {
      code: "L",
      name: "Large",
      chest: { cm: 116.8, inch: 46 },
      length: { cm: 68.6, inch: 27 },
      recommendation: {
        height: { min: 165, max: 175 },
        weight: { min: 60, max: 75 },
        bmi: { min: 21.0, max: 26.0 },
      },
      sortOrder: 4,
      active: true,
    },
    {
      code: "XL",
      name: "Extra Large",
      chest: { cm: 121.9, inch: 48 },
      length: { cm: 71.1, inch: 28 },
      recommendation: {
        height: { min: 170, max: 180 },
        weight: { min: 70, max: 85 },
        bmi: { min: 23.0, max: 28.0 },
      },
      sortOrder: 5,
      active: true,
    },
    {
      code: "2XL",
      name: "2X Large",
      chest: { cm: 127.0, inch: 50 },
      length: { cm: 73.7, inch: 29 },
      recommendation: {
        height: { min: 175, max: 185 },
        weight: { min: 80, max: 95 },
        bmi: { min: 25.0, max: 30.0 },
      },
      sortOrder: 6,
      active: true,
    },
    {
      code: "3XL",
      name: "3X Large",
      chest: { cm: 132.1, inch: 52 },
      length: { cm: 76.2, inch: 30 },
      recommendation: {
        height: { min: 175, max: 190 },
        weight: { min: 90, max: 105 },
        bmi: { min: 27.0, max: 32.0 },
      },
      sortOrder: 7,
      active: true,
    },
    {
      code: "4XL",
      name: "4X Large",
      chest: { cm: 137.2, inch: 54 },
      length: { cm: 78.7, inch: 31 },
      recommendation: {
        height: { min: 175, max: 195 },
        weight: { min: 100, max: 115 },
        bmi: { min: 29.0, max: 34.0 },
      },
      sortOrder: 8,
      active: true,
    },
    {
      code: "5XL",
      name: "5X Large",
      chest: { cm: 142.2, inch: 56 },
      length: { cm: 81.3, inch: 32 },
      recommendation: {
        height: { min: 175, max: 200 },
        weight: { min: 110, max: 125 },
        bmi: { min: 31.0, max: 36.0 },
      },
      sortOrder: 9,
      active: true,
    },
    {
      code: "6XL",
      name: "6X Large",
      chest: { cm: 147.3, inch: 58 },
      length: { cm: 83.8, inch: 33 },
      recommendation: {
        height: { min: 175, max: 205 },
        weight: { min: 120, max: 135 },
        bmi: { min: 33.0, max: 38.0 },
      },
      sortOrder: 10,
      active: true,
    },
  ],
};

// ========================================
// HELPER FUNCTIONS
// ========================================

export const getAllSizeCodes = () => {
  return SHIRT_SIZES_CONFIG.sizes
    .filter(s => s.active)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(s => s.code);
};

export const getSizeByCode = (code) => {
  return SHIRT_SIZES_CONFIG.sizes.find(s => s.code === code) || null;
};

export const getSizeInfoMap = () => {
  const map = {};
  SHIRT_SIZES_CONFIG.sizes
    .filter(s => s.active)
    .forEach(s => {
      map[s.code] = {
        chest: `${s.chest.inch}"`,
        length: `${s.length.inch}"`,
      };
    });
  return map;
};

export const getShirtSizesArray = () => {
  return SHIRT_SIZES_CONFIG.sizes
    .filter(s => s.active)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(s => ({
      code: s.code,
      value: s.code,
      label: s.code,
      chest: s.chest.inch,
      length: s.length.inch,
      chestDisplay: `${s.chest.inch}"`,
      lengthDisplay: `${s.length.inch}"`,
      description: `รอบอก ${s.chest.inch}" ยาว ${s.length.inch}"`,
      order: s.sortOrder,
    }));
};

export const recommendSize = (height, weight) => {
  if (!height || !weight) return null;
  
  const bmi = weight / Math.pow(height / 100, 2);
  
  for (const size of SHIRT_SIZES_CONFIG.sizes) {
    if (!size.active) continue;
    
    const { recommendation } = size;
    const heightMatch = height >= recommendation.height.min && height <= recommendation.height.max;
    const weightMatch = weight >= recommendation.weight.min && weight <= recommendation.weight.max;
    const bmiMatch = bmi >= recommendation.bmi.min && bmi <= recommendation.bmi.max;
    
    if (heightMatch && weightMatch && bmiMatch) {
      return size.code;
    }
  }
  
  const fallback = SHIRT_SIZES_CONFIG.sizes
    .filter(s => s.active)
    .find(s => bmi >= s.recommendation.bmi.min && bmi <= s.recommendation.bmi.max);
  
  return fallback ? fallback.code : "M";
};

export const formatSizeDisplay = (code) => {
  const size = getSizeByCode(code);
  if (!size) return code;
  return `${code} (รอบอก ${size.chest.inch}" ยาว ${size.length.inch}")`;
};

// Backward Compatibility Exports
export const shirtSizes = SHIRT_SIZES_CONFIG;
export const ALL_SIZES = getAllSizeCodes();
export const SIZE_INFO = getSizeInfoMap();
export const SHIRT_SIZES = getShirtSizesArray();

export default SHIRT_SIZES_CONFIG;
