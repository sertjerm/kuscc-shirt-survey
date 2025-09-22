// src/utils/shirt-size.js
export const shirtSizes = {
  sizes: [
    {
      code: "XS",
      name: "Extra Small",
      chest: { cm: 101.6, inch: '40"' },
      length: { cm: 61.0, inch: '24"' },
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
      chest: { cm: 106.7, inch: '42"' },
      length: { cm: 63.5, inch: '25"' },
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
      chest: { cm: 111.8, inch: '44"' },
      length: { cm: 66.0, inch: '26"' },
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
      chest: { cm: 116.8, inch: '46"' },
      length: { cm: 68.6, inch: '27"' },
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
      chest: { cm: 121.9, inch: '48"' },
      length: { cm: 71.1, inch: '28"' },
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
      chest: { cm: 127.0, inch: '50"' },
      length: { cm: 73.7, inch: '29"' },
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
      chest: { cm: 132.1, inch: '52"' },
      length: { cm: 76.2, inch: '30"' },
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
      chest: { cm: 137.2, inch: '54"' },
      length: { cm: 78.7, inch: '31"' },
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
      chest: { cm: 142.2, inch: '56"' },
      length: { cm: 81.3, inch: '32"' },
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
      chest: { cm: 147.3, inch: '58"' },
      length: { cm: 83.8, inch: '33"' },
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

// Export for use in other files (if using Node.js/CommonJS)
// module.exports = shirtSizes;

// Or for ES6 modules:
// export default shirtSizes;
