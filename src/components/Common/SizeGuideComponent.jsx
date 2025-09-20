import React, { useState, useEffect } from 'react';

const SizeGuideComponent = () => {
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(65);
  const [recommendedSize, setRecommendedSize] = useState('');
  const [unit, setUnit] = useState('CM');

  // ตารางขนาดเสื้อ
  const sizeChart = [
    { size: 'XS', heightRange: [150, 158], weightRange: [40, 50], chest: '44-48', length: '58-62' },
    { size: 'S', heightRange: [155, 162], weightRange: [45, 55], chest: '48-52', length: '60-64' },
    { size: 'M', heightRange: [158, 168], weightRange: [50, 65], chest: '52-56', length: '62-66' },
    { size: 'L', heightRange: [162, 172], weightRange: [60, 75], chest: '56-60', length: '64-68' },
    { size: 'XL', heightRange: [165, 175], weightRange: [70, 85], chest: '60-64', length: '66-70' },
    { size: '2XL', heightRange: [168, 178], weightRange: [80, 95], chest: '64-68', length: '68-72' },
    { size: '3XL', heightRange: [170, 180], weightRange: [90, 105], chest: '68-72', length: '70-74' },
    { size: '4XL', heightRange: [172, 182], weightRange: [100, 115], chest: '72-76', length: '72-76' },
    { size: '5XL', heightRange: [174, 184], weightRange: [110, 125], chest: '76-80', length: '74-78' },
    { size: '6XL', heightRange: [176, 186], weightRange: [120, 135], chest: '80-84', length: '76-80' }
  ];

  // คำนวณขนาดแนะนำ
  useEffect(() => {
    const matchingSizes = sizeChart.filter(size => {
      const heightMatch = height >= size.heightRange[0] && height <= size.heightRange[1];
      const weightMatch = weight >= size.weightRange[0] && weight <= size.weightRange[1];
      return heightMatch && weightMatch;
    });

    if (matchingSizes.length > 0) {
      setRecommendedSize(matchingSizes[0].size);
    } else {
      // หาขนาดที่ใกล้เคียงที่สุด
      const closestSize = sizeChart.reduce((closest, current) => {
        const currentScore = Math.abs((height - (current.heightRange[0] + current.heightRange[1]) / 2)) +
                           Math.abs((weight - (current.weightRange[0] + current.weightRange[1]) / 2));
        const closestScore = Math.abs((height - (closest.heightRange[0] + closest.heightRange[1]) / 2)) +
                           Math.abs((weight - (closest.weightRange[0] + closest.weightRange[1]) / 2));
        return currentScore < closestScore ? current : closest;
      });
      setRecommendedSize(closestSize.size + ' (ใกล้เคียง)');
    }
  }, [height, weight]);

  const convertHeight = (cm) => {
    if (unit === 'INCH') {
      return Math.round(cm / 2.54 * 10) / 10;
    }
    return cm;
  };

  const convertWeight = (kg) => {
    if (unit === 'LB') {
      return Math.round(kg * 2.205 * 10) / 10;
    }
    return kg;
  };

  const handleHeightChange = (value) => {
    if (unit === 'INCH') {
      setHeight(Math.round(value * 2.54));
    } else {
      setHeight(value);
    }
  };

  const handleWeightChange = (value) => {
    if (unit === 'LB') {
      setWeight(Math.round(value / 2.205));
    } else {
      setWeight(value);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">คู่มือเลือกขนาดเสื้อ</h2>
        <p className="text-sm text-gray-600">ระบุความสูงและน้ำหนักเพื่อแนะนำขนาดที่เหมาะสม</p>
      </div>

      {/* Unit Toggle */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button
            onClick={() => setUnit('CM')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              unit === 'CM' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            CM/KG
          </button>
          <button
            onClick={() => setUnit('INCH')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              unit === 'INCH' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            INCH/LB
          </button>
        </div>
      </div>

      {/* Height Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ความสูง: {convertHeight(height)} {unit === 'CM' ? 'ซม.' : 'นิ้ว'}
        </label>
        <div className="relative">
          <input
            type="range"
            min={unit === 'CM' ? 140 : 55}
            max={unit === 'CM' ? 200 : 79}
            step={unit === 'CM' ? 1 : 0.1}
            value={convertHeight(height)}
            onChange={(e) => handleHeightChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{unit === 'CM' ? '140' : '4\'7"'}</span>
            <span>{unit === 'CM' ? '200' : '6\'6"'}</span>
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <button
            onClick={() => handleHeightChange(convertHeight(height) - (unit === 'CM' ? 1 : 0.1))}
            className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-200 transition-colors"
          >
            -
          </button>
          <button
            onClick={() => handleHeightChange(convertHeight(height) + (unit === 'CM' ? 1 : 0.1))}
            className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-200 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Weight Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          น้ำหนัก: {convertWeight(weight)} {unit === 'CM' ? 'กก.' : 'ปอนด์'}
        </label>
        <div className="relative">
          <input
            type="range"
            min={unit === 'CM' ? 35 : 77}
            max={unit === 'CM' ? 150 : 330}
            step={unit === 'CM' ? 1 : 1}
            value={convertWeight(weight)}
            onChange={(e) => handleWeightChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{unit === 'CM' ? '35' : '77'}</span>
            <span>{unit === 'CM' ? '150' : '330'}</span>
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <button
            onClick={() => handleWeightChange(convertWeight(weight) - 1)}
            className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 hover:bg-green-200 transition-colors"
          >
            -
          </button>
          <button
            onClick={() => handleWeightChange(convertWeight(weight) + 1)}
            className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 hover:bg-green-200 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Recommended Size */}
      <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-lg p-4 text-center mb-6">
        <h3 className="text-white text-sm font-medium mb-1">ขนาดที่แนะนำ</h3>
        <div className="text-white text-2xl font-bold">{recommendedSize}</div>
      </div>

      {/* Size Chart Table */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">ตารางขนาดอ้างอิง</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-left">ขนาด</th>
                <th className="p-2 text-left">ความสูง (ซม.)</th>
                <th className="p-2 text-left">น้ำหนัก (กก.)</th>
                <th className="p-2 text-left">รอบอก (นิ้ว)</th>
              </tr>
            </thead>
            <tbody>
              {sizeChart.map((size) => (
                <tr 
                  key={size.size} 
                  className={`border-b ${recommendedSize.includes(size.size) ? 'bg-yellow-100' : ''}`}
                >
                  <td className="p-2 font-medium">{size.size}</td>
                  <td className="p-2">{size.heightRange[0]}-{size.heightRange[1]}</td>
                  <td className="p-2">{size.weightRange[0]}-{size.weightRange[1]}</td>
                  <td className="p-2">{size.chest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
};

export default SizeGuideComponent;