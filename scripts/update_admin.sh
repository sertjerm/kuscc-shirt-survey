#!/bin/bash
# update_kuscc_admin.sh - อัปเดตระบบ Admin Dashboard

set -e

echo "=========================================="
echo "KUSCC Admin Dashboard Update Script"
echo "=========================================="
echo ""

# Configuration
GITHUB_REPO="https://github.com/sertjerm/kuscc-shirt-survey.git"
BRANCH="main"
PROJECT_DIR="./kuscc-project"

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

# Step 1: Clone or Pull from GitHub
echo "Step 1: Fetching latest code..."
echo ""

if [ -d "$PROJECT_DIR" ]; then
    print_warning "Project directory exists. Pulling latest changes..."
    cd "$PROJECT_DIR"
    git fetch origin
    git pull origin "$BRANCH" || {
        print_error "Failed to pull latest changes"
        print_info "Continuing with existing code..."
    }
    cd ..
else
    print_info "Cloning repository from: $GITHUB_REPO"
    git clone "$GITHUB_REPO" "$PROJECT_DIR" || {
        print_error "Failed to clone repository"
        exit 1
    }
    print_success "Repository cloned successfully"
fi

cd "$PROJECT_DIR"

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    print_warning "Currently on branch: $CURRENT_BRANCH"
    print_info "Switching to branch: $BRANCH"
    git checkout "$BRANCH" 2>/dev/null || git checkout -b "$BRANCH"
fi

echo ""
print_success "Code fetched successfully"
echo ""

# Step 2: Backup existing files
echo "Step 2: Creating backup..."
echo ""

BACKUP_DIR="backups/backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup only if src directory exists
if [ -d "src" ]; then
    cp -r src "$BACKUP_DIR/" 2>/dev/null || true
    print_success "Backup created at: $BACKUP_DIR"
else
    print_warning "No src directory found, skipping backup"
fi

echo ""

# Step 3: Analyze current structure
echo "Step 3: Analyzing project structure..."
echo ""

print_info "Checking existing components..."
[ -f "src/components/Admin/MembersList.jsx" ] && echo "  Found: MembersList.jsx"
[ -f "src/components/Admin/SearchAndPickup.jsx" ] && echo "  Found: SearchAndPickup.jsx (will be merged)"
[ -f "src/components/Admin/PickupModal.jsx" ] && echo "  Found: PickupModal.jsx"
[ -f "src/components/Admin/InventoryManagement.jsx" ] && echo "  Found: InventoryManagement.jsx"
[ -f "src/components/Admin/DashboardStats.jsx" ] && echo "  Found: DashboardStats.jsx"
[ -f "src/services/shirtApi.js" ] && echo "  Found: shirtApi.js"

echo ""

# Step 4: Create necessary directories
echo "Step 4: Creating directories..."
echo ""

mkdir -p src/components/Admin
mkdir -p src/services
mkdir -p src/styles
mkdir -p src/pages

print_success "Directories ready"
echo ""

# Step 5: Update shirtApi.js
echo "Step 5: Updating shirtApi.js..."
echo ""

cat > src/services/shirtApi.js << 'APIEOF'
// src/services/shirtApi.js - Updated version
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

// Helper: Parse WCF Date format: /Date(1758602879000+0700)/
const parseWcfDate = (dateString) => {
  if (!dateString) return null;
  const match = String(dateString).match(/\/Date\((\d+)\+/);
  return match ? new Date(Number(match[1])) : null;
};

// Helper: Format member data from API response
const formatMemberData = (apiData) => {
  if (!apiData) return null;
  
  return {
    // Basic Info
    memberCode: apiData.MEMB_CODE,
    fullName: apiData.FULLNAME,
    displayName: apiData.DISPLAYNAME,
    phone: apiData.MEMB_MOBILE,
    socialId: apiData.MEMB_SOCID,
    
    // Survey Info
    sizeCode: apiData.SIZE_CODE,
    surveyDate: parseWcfDate(apiData.SURVEY_DATE),
    surveyMethod: apiData.SURVEY_METHOD,
    
    // Receive Info
    processedBy: apiData.PROCESSED_BY,
    receiverName: apiData.RECEIVER_NAME,
    receiverType: apiData.RECEIVER_TYPE,
    receiveDate: parseWcfDate(apiData.RECEIVE_DATE),
    receiveStatus: apiData.RECEIVE_STATUS,
    
    // Additional
    remarks: apiData.REMARKS,
    updatedDate: parseWcfDate(apiData.UPDATED_DATE),
    userRole: apiData.USER_ROLE,
    
    // Computed fields
    hasReceived: apiData.RECEIVE_STATUS === "RECEIVED",
  };
};

// API: Login member
export const loginMember = async ({ memberCode, phone, idCard }) => {
  const payload = {
    mbcode: memberCode,
    socid: idCard,
    mobile: phone,
  };
  
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

// API: Save member size selection
export const saveMemberSize = async ({
  memberCode,
  sizeCode,
  remarks = "",
  surveyMethod = "ONLINE",
}) => {
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

// API: Search member by member code
export const SearchMember = async (mbcode) => {
  try {
    const res = await api.get(`/SearchShirtMember?mbcode=${encodeURIComponent(mbcode)}`);
    
    if (res.data?.responseCode !== 200) {
      throw new Error(res.data?.responseMessage || "ไม่พบข้อมูลสมาชิก");
    }
    
    return formatMemberData(res.data.data);
  } catch (error) {
    console.error('Search Member Error:', error);
    throw error;
  }
};

// API: Get members with pagination + server-side filtering
export const getShirtMemberListPaged = async ({
  page = 1,
  pageSize = 20,
  search = '',
  status = '',
  size_code = ''
}) => {
  try {
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
  } catch (error) {
    console.error('Get Members Paged Error:', error);
    throw error;
  }
};

// API: Submit pickup
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

// API: Get inventory summary
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

// API: Adjust inventory
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

// API: Get dashboard stats
export const getDashboardStats = async () => {
  try {
    const response = await getShirtMemberListPaged({
      page: 1,
      pageSize: 10000,
      search: '',
      status: '',
      size_code: ''
    });
    
    const allMembers = response.data || [];
    const totalMembers = allMembers.length;
    const confirmedMembers = allMembers.filter(m => m.sizeCode).length;
    const receivedMembers = allMembers.filter(m => m.hasReceived).length;
    const pendingMembers = totalMembers - confirmedMembers;
    
    const selfReceived = allMembers.filter(m => m.hasReceived && m.receiverType === 'SELF').length;
    const proxyReceived = allMembers.filter(m => m.hasReceived && m.receiverType === 'OTHER').length;
    
    const sizeCount = {};
    allMembers.forEach(m => {
      if (m.sizeCode) {
        sizeCount[m.sizeCode] = (sizeCount[m.sizeCode] || 0) + 1;
      }
    });
    
    const popularSizes = Object.entries(sizeCount)
      .map(([size, count]) => ({ size, count }))
      .sort((a, b) => b.count - a.count);
    
    const onlineCount = allMembers.filter(m => m.surveyMethod === 'ONLINE').length;
    const manualCount = allMembers.filter(m => m.surveyMethod === 'MANUAL').length;
    
    return {
      totalMembers,
      confirmedMembers,
      receivedMembers,
      pendingMembers,
      selfReceived,
      proxyReceived,
      popularSizes,
      surveyMethods: {
        online: onlineCount,
        manual: manualCount
      }
    };
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    throw error;
  }
};

export { formatMemberData, parseWcfDate };
APIEOF

print_success "shirtApi.js updated with correct API integration"
echo ""

# Step 6: Update CSS
echo "Step 6: Creating/Updating MembersList.css..."
echo ""

cat > src/styles/MembersList.css << 'CSSEOF'
/* src/styles/MembersList.css */

.members-list-container {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.members-list-container h2 {
  margin-bottom: 24px;
  color: #262626;
  font-size: 20px;
  font-weight: 600;
}

.filters-section {
  background: #fafafa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
  border: 1px solid #f0f0f0;
}

.filter-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
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
  transition: all 0.3s;
}

.search-input:focus {
  border-color: #1890ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
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
  font-size: 16px;
  padding: 4px;
  line-height: 1;
}

.clear-search-btn:hover {
  color: #ff4d4f;
}

.filter-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-select {
  padding: 10px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-select:hover {
  border-color: #40a9ff;
}

.filter-select:focus {
  border-color: #1890ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.btn-refresh {
  padding: 10px 20px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-refresh:hover {
  background: #40a9ff;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.results-info {
  margin-top: 12px;
  color: #666;
  font-size: 14px;
}

.error-message {
  padding: 16px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  color: #cf1322;
  margin-bottom: 16px;
}

.table-responsive {
  overflow-x: auto;
  margin-bottom: 24px;
}

.members-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  font-size: 14px;
}

.members-table th,
.members-table td {
  padding: 16px 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.members-table th {
  background: #fafafa;
  font-weight: 600;
  color: #262626;
  position: sticky;
  top: 0;
  z-index: 1;
}

.members-table tbody tr:hover {
  background: #fafafa;
}

.size-display {
  display: inline-block;
  padding: 4px 12px;
  background: #e6f7ff;
  color: #1890ff;
  border-radius: 4px;
  font-weight: 500;
  font-size: 13px;
}

.status-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-tag-pending {
  background: #fff1b8;
  color: #d46b08;
  border: 1px solid #ffe58f;
}

.status-tag-confirmed {
  background: #b7eb8f;
  color: #389e0d;
  border: 1px solid #95de64;
}

.status-tag-received {
  background: #91d5ff;
  color: #0958d9;
  border: 1px solid #69c0ff;
}

.btn-pickup {
  padding: 8px 16px;
  background: #52c41a;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-pickup:hover {
  background: #73d13d;
  box-shadow: 0 2px 4px rgba(82, 196, 26, 0.3);
}

.text-muted {
  color: #8c8c8c;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.btn-page {
  padding: 8px 16px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-page:hover:not(:disabled) {
  border-color: #1890ff;
  color: #1890ff;
}

.btn-page:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #f5f5f5;
}

.page-info {
  padding: 8px 16px;
  color: #262626;
  font-weight: 500;
}

.loading-spinner {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 20px;
  border: 4px solid #f0f0f0;
  border-top: 4px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-data {
  text-align: center;
  padding: 60px 20px;
  color: #8c8c8c;
  font-size: 16px;
}

/* Responsive */
@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
  }
  
  .search-box {
    width: 100%;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .filter-select {
    flex: 1;
  }
  
  .members-table {
    font-size: 12px;
  }
  
  .members-table th,
  .members-table td {
    padding: 12px 8px;
  }
}
CSSEOF

print_success "MembersList.css created"
echo ""

# Step 7: Summary
echo "=========================================="
echo "Update completed successfully!"
echo "=========================================="
echo ""
echo "Modified files:"
echo "  ├── src/services/shirtApi.js (API functions updated)"
echo "  ├── src/styles/MembersList.css (new styles added)"
echo "  └── Backup: $BACKUP_DIR"
echo ""
echo "Changes made:"
echo "  1. Fixed API endpoints to match backend"
echo "  2. Added server-side filtering support"
echo "  3. Improved error handling"
echo "  4. Added comprehensive CSS styling"
echo "  5. Enhanced date formatting"
echo ""
echo "Next steps:"
echo "  1. cd $PROJECT_DIR"
echo "  2. npm install"
echo "  3. npm start"
echo "  4. Test the updated features"
echo ""
print_info "Remember to commit your changes:"
echo "  git add ."
echo "  git commit -m 'Updated admin dashboard components'"
echo "  git push origin $BRANCH"
echo ""

cd - > /dev/null

print_success "Script finished!"