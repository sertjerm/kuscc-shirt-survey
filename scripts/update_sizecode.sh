#!/bin/bash

# ===================================================================
# Script: อัปเดตไฟล์ที่มีอยู่ให้ใช้ GetShirtSizes API
# Description: แทนที่ hardcode ขนาดเสื้อด้วยการเรียก API
# ===================================================================

echo "🔧 เริ่มอัปเดตไฟล์ให้ใช้ GetShirtSizes API..."
echo ""

# สี่สำหรับแสดงผล
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ตรวจสอบว่าอยู่ใน project directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ ไม่พบไฟล์ package.json${NC}"
    echo "กรุณารัน script นี้ในโฟลเดอร์หลักของโปรเจกต์"
    exit 1
fi

# สร้าง backup
BACKUP_DIR="backups/api_migration_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}📦 สร้าง backup...${NC}"
[ -f "src/services/shirtApi.js" ] && cp "src/services/shirtApi.js" "$BACKUP_DIR/"
[ -f "src/components/Admin/MembersList.jsx" ] && cp "src/components/Admin/MembersList.jsx" "$BACKUP_DIR/"
[ -f "src/components/Admin/PickupModal.jsx" ] && cp "src/components/Admin/PickupModal.jsx" "$BACKUP_DIR/"
[ -f "src/components/Admin/InventoryManagement.jsx" ] && cp "src/components/Admin/InventoryManagement.jsx" "$BACKUP_DIR/"
[ -f "src/pages/MemberPortal.jsx" ] && cp "src/pages/MemberPortal.jsx" "$BACKUP_DIR/"
[ -f "src/utils/constants.js" ] && cp "src/utils/constants.js" "$BACKUP_DIR/"

echo -e "${GREEN}✅ Backup สร้างที่: $BACKUP_DIR${NC}"
echo ""

# ===================================================================
# 1. อัปเดต shirtApi.js - เพิ่มฟังก์ชันใหม่
# ===================================================================
echo -e "${YELLOW}📝 กำลังอัปเดต shirtApi.js...${NC}"

# เพิ่มฟังก์ชัน getShirtSizes และอื่นๆ ในไฟล์ shirtApi.js
# ใช้ sed เพื่อแทรกโค้ดใหม่หลัง import statements

if [ -f "src/services/shirtApi.js" ]; then
    # หาบรรทัดที่มี "Parse WCF Date" หรือ "export const api"
    # แล้วแทรกโค้ดใหม่หลังจากนั้น
    
    cat >> src/services/shirtApi.js.new << 'EOF'

// ===================================================================
// ✨ NEW: ดึงข้อมูลขนาดเสื้อจาก API
// ===================================================================

let cachedSizes = null;

export const getShirtSizes = async () => {
  if (cachedSizes) {
    return cachedSizes;
  }

  try {
    console.log("🔍 Fetching shirt sizes from API...");
    const res = await api.get("/GetShirtSizes");

    if (res.data?.responseCode !== 200) {
      throw new Error(res.data?.responseMessage || "ไม่สามารถโหลดข้อมูลขนาดเสื้อได้");
    }

    cachedSizes = res.data.data || [];
    cachedSizes.sort((a, b) => a.SORT_ORDER - b.SORT_ORDER);

    console.log("✅ Loaded shirt sizes:", cachedSizes);
    return cachedSizes;
  } catch (error) {
    console.error("❌ Error fetching shirt sizes:", error);
    return getDefaultSizes();
  }
};

export const getSizeOrder = async () => {
  const sizes = await getShirtSizes();
  return sizes.map(s => s.SIZE_CODE);
};

export const getSizeOrderMap = async () => {
  const sizes = await getShirtSizes();
  return sizes.reduce((acc, size) => {
    acc[size.SIZE_CODE] = size.SORT_ORDER;
    return acc;
  }, {});
};

export const getSizeInfo = async (sizeCode) => {
  const sizes = await getShirtSizes();
  return sizes.find(s => s.SIZE_CODE === sizeCode) || null;
};

const getDefaultSizes = () => {
  return [
    { CHEST_INCH: 38, LENGTH_INCH: 23, REMARKS: "ขนาดเล็กพิเศษ สำหรับผู้มีรูปร่างเล็กมาก", SIZE_CODE: "MINI", SIZE_NAME: "มินิไซส์", SIZE_NAME_EN: "Mini Size", SORT_ORDER: 0 },
    { CHEST_INCH: 40, LENGTH_INCH: 24, REMARKS: null, SIZE_CODE: "XS", SIZE_NAME: "เอ็กซ์ตร้า สมอลล์", SIZE_NAME_EN: "Extra Small", SORT_ORDER: 1 },
    { CHEST_INCH: 42, LENGTH_INCH: 25, REMARKS: null, SIZE_CODE: "S", SIZE_NAME: "สมอลล์", SIZE_NAME_EN: "Small", SORT_ORDER: 2 },
    { CHEST_INCH: 44, LENGTH_INCH: 26, REMARKS: null, SIZE_CODE: "M", SIZE_NAME: "มีเดียม", SIZE_NAME_EN: "Medium", SORT_ORDER: 3 },
    { CHEST_INCH: 46, LENGTH_INCH: 27, REMARKS: null, SIZE_CODE: "L", SIZE_NAME: "ลาร์จ", SIZE_NAME_EN: "Large", SORT_ORDER: 4 },
    { CHEST_INCH: 48, LENGTH_INCH: 28, REMARKS: null, SIZE_CODE: "XL", SIZE_NAME: "เอ็กซ์ตร้า ลาร์จ", SIZE_NAME_EN: "Extra Large", SORT_ORDER: 5 },
    { CHEST_INCH: 50, LENGTH_INCH: 29, REMARKS: null, SIZE_CODE: "2XL", SIZE_NAME: "ทู เอ็กซ์ ลาร์จ", SIZE_NAME_EN: "2X Large", SORT_ORDER: 6 },
    { CHEST_INCH: 52, LENGTH_INCH: 30, REMARKS: null, SIZE_CODE: "3XL", SIZE_NAME: "ทรี เอ็กซ์ ลาร์จ", SIZE_NAME_EN: "3X Large", SORT_ORDER: 7 },
    { CHEST_INCH: 54, LENGTH_INCH: 31, REMARKS: null, SIZE_CODE: "4XL", SIZE_NAME: "โฟร์ เอ็กซ์ ลาร์จ", SIZE_NAME_EN: "4X Large", SORT_ORDER: 8 },
    { CHEST_INCH: 56, LENGTH_INCH: 32, REMARKS: null, SIZE_CODE: "5XL", SIZE_NAME: "ไฟว์ เอ็กซ์ ลาร์จ", SIZE_NAME_EN: "5X Large", SORT_ORDER: 9 },
    { CHEST_INCH: 58, LENGTH_INCH: 33, REMARKS: null, SIZE_CODE: "6XL", SIZE_NAME: "ซิกซ์ เอ็กซ์ ลาร์จ", SIZE_NAME_EN: "6X Large", SORT_ORDER: 10 },
    { CHEST_INCH: 60, LENGTH_INCH: 34, REMARKS: "ขนาดใหญ่พิเศษ สำหรับผู้ที่ต้องการขนาดใหญ่มากเป็นพิเศษ", SIZE_CODE: "PLUS", SIZE_NAME: "พลัสไซส์", SIZE_NAME_EN: "Plus Size", SORT_ORDER: 11 },
  ];
};

EOF

    echo -e "${GREEN}✅ เพิ่มฟังก์ชัน getShirtSizes ใน shirtApi.js แล้ว${NC}"
    echo -e "${YELLOW}⚠️  กรุณาเปิดไฟล์ src/services/shirtApi.js.new และคัดลอกโค้ดที่ต้องการไปใส่ในไฟล์จริง${NC}"
else
    echo -e "${RED}❌ ไม่พบไฟล์ src/services/shirtApi.js${NC}"
fi

echo ""

# ===================================================================
# 2. สร้างตัวอย่างการแก้ไขสำหรับแต่ละไฟล์
# ===================================================================

cat > MIGRATION_GUIDE.md << 'EOF'
# 📋 คำแนะนำการแก้ไขไฟล์

## ไฟล์ที่ต้องแก้ไข

### 1. src/components/Admin/MembersList.jsx

**แทนที่:**
```javascript
const SHIRT_SIZES = [
  { code: "XS" },
  { code: "S" },
  // ...
];
```

**ด้วย:**
```javascript
import { getShirtSizes } from '../../services/shirtApi';

const MembersList = ({ onDataChange }) => {
  const [sizes, setSizes] = useState([]);
  
  useEffect(() => {
    loadSizes();
  }, []);
  
  const loadSizes = async () => {
    const sizesData = await getShirtSizes();
    setSizes(sizesData);
  };
  
  // ใช้ sizes.map(size => size.SIZE_CODE) แทน SHIRT_SIZES
};
```

---

### 2. src/components/Admin/PickupModal.jsx

**แทนที่:**
```javascript
const ALL_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL"];

const SIZE_INFO = {
  XS: { chest: '40"', length: '24"' },
  // ...
};
```

**ด้วย:**
```javascript
import { getShirtSizes } from '../../services/shirtApi';

const PickupModal = ({ visible, onCancel, selectedMember, onSuccess }) => {
  const [sizes, setSizes] = useState([]);
  
  useEffect(() => {
    if (visible) {
      loadSizes();
    }
  }, [visible]);
  
  const loadSizes = async () => {
    const sizesData = await getShirtSizes();
    setSizes(sizesData);
  };
  
  // แสดงข้อมูล
  {sizes.map(size => (
    <div key={size.SIZE_CODE}>
      {size.SIZE_CODE} - {size.SIZE_NAME}
      <br />
      รอบอก {size.CHEST_INCH}" ยาว {size.LENGTH_INCH}"
    </div>
  ))}
};
```

---

### 3. src/components/Admin/InventoryManagement.jsx

**แก้ไขการเรียงลำดับ:**

**แทนที่:**
```javascript
import { SIZE_ORDER } from '../../utils/constants';

inventory.sort((a, b) => 
  SIZE_ORDER.indexOf(a.sizeCode) - SIZE_ORDER.indexOf(b.sizeCode)
);
```

**ด้วย:**
```javascript
import { getSizeOrder } from '../../services/shirtApi';

const sortInventory = async () => {
  const sizeOrder = await getSizeOrder();
  const sorted = inventory.sort((a, b) => 
    sizeOrder.indexOf(a.sizeCode) - sizeOrder.indexOf(b.sizeCode)
  );
  setInventory(sorted);
};
```

---

### 4. src/pages/MemberPortal.jsx

**แทนที่ ส่วนที่ hardcode sizes:**

```javascript
const sizeOptions = [
  { size: "XS", chest: "36", length: "26" },
  // ...
];
```

**ด้วย:**
```javascript
import { getShirtSizes } from '../services/shirtApi';

const MemberPortal = () => {
  const [sizes, setSizes] = useState([]);
  
  useEffect(() => {
    loadSizes();
  }, []);
  
  const loadSizes = async () => {
    const sizesData = await getShirtSizes();
    setSizes(sizesData);
  };
  
  // แสดงขนาด
  {sizes.map(size => (
    <button key={size.SIZE_CODE}>
      {size.SIZE_CODE}
      <br />
      {size.CHEST_INCH}" × {size.LENGTH_INCH}"
    </button>
  ))}
};
```

---

## ⚠️ สิ่งสำคัญที่ต้องจำ

1. **ใช้ CASE จาก API โดยตรง**
   - `SIZE_CODE` (ไม่ใช่ `code`)
   - `CHEST_INCH` (ไม่ใช่ `chest`)
   - `LENGTH_INCH` (ไม่ใช่ `length`)
   - `SIZE_NAME` (ไม่ใช่ `name`)

2. **เพิ่ม useState และ useEffect**
   ```javascript
   const [sizes, setSizes] = useState([]);
   
   useEffect(() => {
     loadSizes();
   }, []);
   ```

3. **สร้าง async function**
   ```javascript
   const loadSizes = async () => {
     const sizesData = await getShirtSizes();
     setSizes(sizesData);
   };
   ```

4. **แก้ไขการแสดงผล**
   ```javascript
   // เดิม
   {SHIRT_SIZES.map(size => size.code)}
   
   // ใหม่
   {sizes.map(size => size.SIZE_CODE)}
   ```

---

## 🧪 การทดสอบ

หลังจากแก้ไขแล้ว ให้ทดสอบ:

1. ✅ หน้าเลือกขนาดเสื้อ (สมาชิก)
2. ✅ หน้า Admin - Members List
3. ✅ หน้า Admin - Pickup Modal
4. ✅ หน้า Admin - Inventory Management
5. ✅ ตรวจสอบการเรียงลำดับ
6. ✅ ตรวจสอบ Console ไม่มี error

---

## 📞 ติดปัญหา?

ถ้าพบปัญหา:
1. ตรวจสอบ Console (F12)
2. ดู Network tab ว่า API `/GetShirtSizes` ถูกเรียกหรือไม่
3. ตรวจสอบว่าใช้ `await` ครบทุกที่
4. ใช้ Backup ที่สร้างไว้ใน `$BACKUP_DIR`

EOF

echo -e "${GREEN}✅ สร้างไฟล์ MIGRATION_GUIDE.md แล้ว${NC}"
echo ""

echo -e "${GREEN}🎉 สำเร็จ!${NC}"
echo ""
echo -e "${YELLOW}📋 ขั้นตอนถัดไป:${NC}"
echo "1. อ่านไฟล์ MIGRATION_GUIDE.md"
echo "2. แก้ไขไฟล์ตามคำแนะนำ"
echo "3. ทดสอบระบบ"
echo "4. ถ้ามีปัญหา ใช้ backup จาก: $BACKUP_DIR"
echo ""