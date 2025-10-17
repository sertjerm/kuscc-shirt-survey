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

