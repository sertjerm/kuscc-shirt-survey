#!/bin/bash
# update_kuscc_admin.sh - อัปเดตระบบ Admin Dashboard ในโปรเจกต์ปัจจุบัน

set -e

echo "=========================================="
echo "KUSCC Admin Dashboard Update Script"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# ตรวจสอบว่าอยู่ใน React project หรือไม่
if [ ! -f "package.json" ]; then
    print_error "ไม่พบไฟล์ package.json"
    print_info "กรุณารัน script นี้ในโฟลเดอร์หลักของโปรเจกต์"
    exit 1
fi

if [ ! -d "src" ]; then
    print_error "ไม่พบโฟลเดอร์ src"
    exit 1
fi

print_success "ตรวจพบโปรเจกต์ React"
echo ""

# Step 1: สร้าง backup
echo "Step 1: สร้าง backup..."
echo ""

BACKUP_DIR="backups/backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup เฉพาะไฟล์ที่จะแก้ไข
[ -f "src/services/shirtApi.js" ] && cp "src/services/shirtApi.js" "$BACKUP_DIR/"
[ -f "src/components/Admin/MembersList.jsx" ] && cp "src/components/Admin/MembersList.jsx" "$BACKUP_DIR/"
[ -f "src/components/Admin/SearchAndPickup.jsx" ] && cp "src/components/Admin/SearchAndPickup.jsx" "$BACKUP_DIR/"
[ -f "src/styles/MembersList.css" ] && cp "src/styles/MembersList.css" "$BACKUP_DIR/"

print_success "Backup สร้างเรียบร้อยที่: $BACKUP_DIR"
echo ""

# Step 2: วิเคราะห์โครงสร้างปัจจุบัน
echo "Step 2: วิเคราะห์โครงสร้างโปรเจกต์..."
echo ""

print_info "ตรวจสอบไฟล์ที่มีอยู่:"
[ -f "src/services/shirtApi.js" ] && echo "  ✓ shirtApi.js"
[ -f "src/components/Admin/MembersList.jsx" ] && echo "  ✓ MembersList.jsx"
[ -f "src/components/Admin/SearchAndPickup.jsx" ] && echo "  ✓ SearchAndPickup.jsx (จะรวมเข้า MembersList)"
[ -f "src/components/Admin/PickupModal.jsx" ] && echo "  ✓ PickupModal.jsx"
[ -f "src/components/Admin/InventoryManagement.jsx" ] && echo "  ✓ InventoryManagement.jsx"
[ -f "src/components/Admin/DashboardStats.jsx" ] && echo "  ✓ DashboardStats.jsx"
[ -f "src/pages/AdminDashboard.jsx" ] && echo "  ✓ AdminDashboard.jsx"

echo ""

# Step 3: สร้างโฟลเดอร์ที่จำเป็น
echo "Step 3: เตรียมโฟลเดอร์..."
echo ""

mkdir -p src/components/Admin
mkdir -p src/services
mkdir -p src/styles
mkdir -p src/pages

print_success "โฟลเดอร์พร้อมแล้ว"
echo ""

# Step 4: อัปเดต shirtApi.js
echo "Step 4: อัปเดต src/services/shirtApi.js..."
echo ""

cat > src/services/shirtApi.js << 'APIEOF'
// src/services/shirtApi.js
import axios from "axios";

const REAL_API_BASE_URL = "https://apps4.coop.ku.ac.th/KusccToolService2Dev/service1.svc";

export const api = axios.create({
  baseURL: REAL_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
  },
  timeout: 15000,
  maxBodyLength: Infinity,
});

// Parse WCF Date: /Date(1758602879000+0700)/
const parseWcfDate = (dateString) => {
  if (!dateString) return null;
  const match = String(dateString).match(/\/Date\((\d+)\+/);
  return match ? new Date(Number(match[1])) : null;
};

// Format member data from API
const formatMemberData = (apiData) => {
  if (!apiData) return null;
  
  return {
    memberCode: apiData.MEMB_CODE,
    fullName: apiData.FULLNAME,
    displayName: apiData.DISPLAYNAME,
    phone: apiData.MEMB_MOBILE,
    socialId: apiData.MEMB_SOCID,
    sizeCode: apiData.SIZE_CODE,
    surveyDate: parseWcfDate(apiData.SURVEY_DATE),
    surveyMethod: apiData.SURVEY_METHOD,
    processedBy: apiData.PROCESSED_BY,
    receiverName: apiData.RECEIVER_NAME,
    receiverType: apiData.RECEIVER_TYPE,
    receiveDate: parseWcfDate(apiData.RECEIVE_DATE),
    receiveStatus: apiData.RECEIVE_STATUS,
    remarks: apiData.REMARKS,
    updatedDate: parseWcfDate(apiData.UPDATED_DATE),
    userRole: apiData.USER_ROLE,
    hasReceived: apiData.RECEIVE_STATUS === "RECEIVED",
  };
};

export const loginMember = async ({ memberCode, phone, idCard }) => {
  const payload = { mbcode: memberCode, socid: idCard, mobile: phone };
  const res = await api.post("/ShirtSurveyLogin", payload);
  
  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "ไม่พบข้อมูลสมาชิก");
  }
  
  const memberData = formatMemberData(res.data.data);
  return {
    ...memberData,
    round: memberData.socialId ? memberData.socialId.split("-").pop() : idCard,
    name: memberData.displayName || memberData.fullName || memberData.memberCode,
  };
};

export const saveMemberSize = async ({ memberCode, sizeCode, remarks = "", surveyMethod = "ONLINE" }) => {
  const payload = {
    MEMB_CODE: (memberCode ?? "").toString().padStart(6, "0"),
    SIZE_CODE: sizeCode,
    SURVEY_METHOD: surveyMethod,
    REMARKS: remarks,
  };
  
  const res = await api.post("/AddShirtSurvey", payload);
  
  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "บันทึกขนาดไม่สำเร็จ");
  }
  
  return res.data;
};

export const SearchMember = async (mbcode) => {
  const res = await api.get(`/SearchShirtMember?mbcode=${encodeURIComponent(mbcode)}`);
  
  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "ไม่พบข้อมูลสมาชิก");
  }
  
  return formatMemberData(res.data.data);
};

export const getShirtMemberListPaged = async ({
  page = 1,
  pageSize = 20,
  search = '',
  status = '',
  size_code = ''
}) => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString()
  });
  
  if (search) params.append('search', search);
  if (status) params.append('status', status);
  if (size_code) params.append('size_code', size_code);
  
  const res = await api.get(`/GetShirtMemberListPaged?${params.toString()}`);
  
  if (res.data?.responseCode !== 200 && res.data?.responseCode !== 404) {
    throw new Error(res.data?.responseMessage || "เกิดข้อผิดพลาด");
  }
  
  const data = res.data.data || [];
  const formattedData = Array.isArray(data) ? data.map(formatMemberData) : [];
  
  return {
    data: formattedData,
    totalCount: res.data.totalCount || 0,
    currentPage: res.data.currentPage || page,
    pageSize: res.data.pageSize || pageSize,
    totalPages: res.data.totalPages || 1,
  };
};

export const submitPickup = async (pickupData) => {
  const payload = {
    MEMB_CODE: pickupData.memberCode,
    SIZE_CODE: pickupData.sizeCode,
    PROCESSED_BY: pickupData.processedBy,
    RECEIVER_TYPE: pickupData.receiverType,
    RECEIVER_NAME: pickupData.receiverName || null,
    SIGNATURE_DATA: pickupData.signatureData,
    REMARKS: pickupData.remarks || "",
  };
  
  const res = await api.post('/SubmitPickup', payload);
  
  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || 'บันทึกการรับเสื้อไม่สำเร็จ');
  }
  
  return res.data;
};

export const getInventorySummary = async () => {
  const res = await api.get('/GetStocks');
  
  if (res.data?.responseCode !== 200) {
    throw new Error('ไม่สามารถโหลดข้อมูลสต็อกได้');
  }
  
  const stockData = res.data.data || [];
  const inventorySummary = stockData.map(stock => ({
    sizeCode: stock.SIZE_CODE,
    produced: stock.PRODUCED_QTY || 0,
    reserved: (stock.PRODUCED_QTY || 0) - (stock.REMAINING_QTY || 0),
    received: stock.DISTRIBUTED_QTY || 0,
    remaining: stock.REMAINING_QTY || 0,
    lowStockThreshold: stock.LOW_STOCK_THRESHOLD || 50,
    stockId: stock.STOCK_ID,
    updatedBy: stock.UPDATED_BY,
    updatedDate: parseWcfDate(stock.UPDATED_DATE),
    remarks: stock.REMARKS
  }));
  
  const sizeOrder = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL"];
  inventorySummary.sort((a, b) => sizeOrder.indexOf(a.sizeCode) - sizeOrder.indexOf(b.sizeCode));
  
  return inventorySummary;
};

export const adjustInventory = async (adjustmentData) => {
  const payload = {
    SIZE_CODE: adjustmentData.sizeCode,
    QUANTITY: adjustmentData.quantity,
    ADJUSTMENT_TYPE: adjustmentData.type,
    REMARKS: adjustmentData.remarks || "",
    PROCESSED_BY: adjustmentData.processedBy,
  };
  
  const res = await api.post('/AdjustInventory', payload);
  
  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || 'ไม่สามารถปรับสต็อกได้');
  }
  
  return res.data;
};

export const getDashboardStats = async () => {
  const response = await getShirtMemberListPaged({
    page: 1,
    pageSize: 10000,
  });
  
  const allMembers = response.data || [];
  const totalMembers = allMembers.length;
  const confirmedMembers = allMembers.filter(m => m.sizeCode).length;
  const receivedMembers = allMembers.filter(m => m.hasReceived).length;
  
  const sizeCount = {};
  allMembers.forEach(m => {
    if (m.sizeCode) {
      sizeCount[m.sizeCode] = (sizeCount[m.sizeCode] || 0) + 1;
    }
  });
  
  const popularSizes = Object.entries(sizeCount)
    .map(([size, count]) => ({ size, count }))
    .sort((a, b) => b.count - a.count);
  
  return {
    totalMembers,
    confirmedMembers,
    receivedMembers,
    pendingMembers: totalMembers - confirmedMembers,
    selfReceived: allMembers.filter(m => m.hasReceived && m.receiverType === 'SELF').length,
    proxyReceived: allMembers.filter(m => m.hasReceived && m.receiverType === 'OTHER').length,
    popularSizes,
    surveyMethods: {
      online: allMembers.filter(m => m.surveyMethod === 'ONLINE').length,
      manual: allMembers.filter(m => m.surveyMethod === 'MANUAL').length
    }
  };
};

export { formatMemberData, parseWcfDate };
APIEOF

print_success "shirtApi.js อัปเดตเรียบร้อย"
echo ""

# Step 5: สร้าง CSS
echo "Step 5: สร้าง/อัปเดต src/styles/MembersList.css..."
echo ""

cat > src/styles/MembersList.css << 'CSSEOF'
.members-list-container {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
}

.filters-section {
  background: #fafafa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.filter-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 300px;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
}

.clear-search-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
}

.filter-group {
  display: flex;
  gap: 12px;
}

.filter-select {
  padding: 10px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
}

.btn-refresh {
  padding: 10px 20px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.members-table {
  width: 100%;
  border-collapse: collapse;
}

.members-table th,
.members-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.members-table th {
  background: #fafafa;
  font-weight: 600;
}

.status-tag {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-tag-pending { background: #fff1b8; color: #d46b08; }
.status-tag-confirmed { background: #b7eb8f; color: #389e0d; }
.status-tag-received { background: #91d5ff; color: #0958d9; }

.btn-pickup {
  padding: 8px 16px;
  background: #52c41a;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
}

.btn-page {
  padding: 8px 16px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
}

.btn-page:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
CSSEOF

print_success "MembersList.css สร้างเรียบร้อย"
echo ""

# Step 6: สรุป
echo "=========================================="
echo "อัปเดตเสร็จสิ้น"
echo "=========================================="
echo ""
echo "ไฟล์ที่ถูกแก้ไข:"
echo "  ✓ src/services/shirtApi.js"
echo "  ✓ src/styles/MembersList.css"
echo ""
echo "Backup ที่: $BACKUP_DIR"
echo ""
echo "ขั้นตอนถัดไป:"
echo "  1. npm install (ถ้ายังไม่ได้ติดตั้ง)"
echo "  2. npm start"
echo "  3. ทดสอบระบบ"
echo ""
echo "Commit การเปลี่ยนแปลง:"
echo "  git add ."
echo "  git commit -m 'Updated admin API and styling'"
echo "  git push"
echo ""

print_success "เสร็จสิ้น"