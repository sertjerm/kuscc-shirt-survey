// src/components/Admin/MembersList.jsx
import { useState, useEffect, useCallback } from "react";
import { getShirtMemberListPaged } from "../../services/shirtApi";
import PickupModal from "./PickupModal";
import "../../styles/MembersList.css";

// Constants
const SHIRT_SIZES = [
  { code: "XS" }, { code: "S" }, { code: "M" }, { code: "L" },
  { code: "XL" }, { code: "2XL" }, { code: "3XL" }, { code: "4XL" },
  { code: "5XL" }, { code: "6XL" }
];

const MEMBER_STATUS = {
  NOT_CONFIRMED: "NOT_CONFIRMED",
  CONFIRMED: "CONFIRMED",
  RECEIVED: "RECEIVED",
};

const MembersList = ({ onPickupClick }) => {
  // States
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(20);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");

  // Search input state (สำหรับ debounce)
  const [searchInput, setSearchInput] = useState("");

  // Modal state
  const [selectedMember, setSelectedMember] = useState(null);
  const [showPickupModal, setShowPickupModal] = useState(false);

  // ฟังก์ชันโหลดข้อมูล
  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("📋 Loading members with filters:", {
        page: currentPage,
        pageSize,
        search: searchTerm,
        status: statusFilter,
        size_code: sizeFilter,
      });

      const result = await getShirtMemberListPaged({
        page: currentPage,
        pageSize,
        search: searchTerm,
        status: statusFilter,
        size_code: sizeFilter,
      });

      console.log("✅ Members loaded:", result);

      setMembers(result.data || []);
      setTotalPages(result.totalPages || 1);
      setTotalCount(result.totalCount || 0);
    } catch (err) {
      console.error("❌ Load members error:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, statusFilter, sizeFilter]);

  // Load ข้อมูลเมื่อ dependencies เปลี่ยน
  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Debounce สำหรับ search (รอ 500ms หลังพิมพ์เสร็จ)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Handler: Clear search
  const handleClearSearch = () => {
    setSearchInput("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Handler: เปลี่ยนหน้า
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Handler: เปลี่ยน filter
  const handleFilterChange = (filterType, value) => {
    setCurrentPage(1);

    switch (filterType) {
      case "status":
        setStatusFilter(value);
        break;
      case "size":
        setSizeFilter(value);
        break;
      default:
        break;
    }
  };

  // Handler: เปิด Modal บันทึกการรับเสื้อ
  const handleOpenPickupModal = (member) => {
    console.log("📦 Opening pickup modal for:", member);
    setSelectedMember(member);
    setShowPickupModal(true);
    
    // ถ้ามี callback จาก parent (AdminDashboard)
    if (onPickupClick) {
      onPickupClick(member);
    }
  };

  // Handler: ปิด Modal
  const handleClosePickupModal = () => {
    setShowPickupModal(false);
    setSelectedMember(null);
  };

  // Handler: หลังบันทึกการรับเสื้อสำเร็จ
  const handlePickupSuccess = () => {
    handleClosePickupModal();
    loadMembers(); // Reload data
  };

  // Helper: กำหนด status ของสมาชิก
  const getMemberStatus = (member) => {
    // ตรวจสอบจากฟิลด์ใหม่
    if (member.hasReceived || member.receiveStatus === "RECEIVED" || member.RECEIVE_STATUS === "RECEIVED" || member.RECEIVE_DATE) {
      return MEMBER_STATUS.RECEIVED;
    }
    if (member.sizeCode || member.SIZE_CODE) {
      return MEMBER_STATUS.CONFIRMED;
    }
    return MEMBER_STATUS.NOT_CONFIRMED;
  };

  // Helper: Format วันที่เป็น dd/mm/yyyy HH:mm (บรรทัดเดียว)
  const formatDateTime = (dateString) => {
    try {
      if (!dateString) return '-';
      
      let date;
      // Check if it's WCF format /Date(...)/
      if (dateString.includes('/Date(')) {
        const timestamp = parseInt(dateString.match(/\d+/)[0]);
        date = new Date(timestamp);
      } else {
        date = new Date(dateString);
      }
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      return '-';
    }
  };

  // Helper: สถานะสมาชิก (แบบ Tag)
  const getStatusTag = (member) => {
    const status = getMemberStatus(member);

    const statusConfig = {
      [MEMBER_STATUS.NOT_CONFIRMED]: {
        className: "status-tag status-tag-pending",
        text: "ยังไม่ยืนยัน",
      },
      [MEMBER_STATUS.CONFIRMED]: {
        className: "status-tag status-tag-confirmed",
        text: "ยืนยันแล้ว",
      },
      [MEMBER_STATUS.RECEIVED]: {
        className: "status-tag status-tag-received",
        text: "รับแล้ว",
      },
    };

    const config = statusConfig[status];
    return <span className={config.className}>{config.text}</span>;
  };

  // Helper: แสดงปุ่มตามสถานะ
  const getActionButton = (member) => {
    const status = getMemberStatus(member);
    
    // ถ้ารับเสื้อแล้ว ไม่แสดงปุ่ม
    if (status === MEMBER_STATUS.RECEIVED) {
      return <span className="text-muted">-</span>;
    }

    // แสดงปุ่มบันทึกการรับเสื้อ
    return (
      <button
        className="btn-pickup"
        onClick={() => handleOpenPickupModal(member)}
      >
        บันทึกการรับ
      </button>
    );
  };

  return (
    <div className="members-list-container">
      <h2>ค้นหาและรับเสื้อ - รายชื่อสมาชิกทั้งหมด</h2>

      {/* Search & Filters */}
      <div className="filters-section">
        <div className="filter-row">
          <div className="search-box">
            <input
              type="text"
              placeholder="ค้นหาด้วยรหัสสมาชิก หรือ ชื่อ-นามสกุล"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="search-input"
            />
            {searchInput && (
              <button
                className="clear-search-btn"
                onClick={handleClearSearch}
                title="ล้างการค้นหา"
              >
                ✕
              </button>
            )}
          </div>

          <div className="filter-group">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="filter-select"
            >
              <option value="">สถานะทั้งหมด</option>
              <option value="PENDING">ยังไม่ยืนยัน</option>
              <option value="CONFIRMED">ยืนยันแล้ว</option>
              <option value="RECEIVED">รับแล้ว</option>
            </select>

            {/* Size Filter */}
            <select
              value={sizeFilter}
              onChange={(e) => handleFilterChange("size", e.target.value)}
              className="filter-select"
            >
              <option value="">ขนาดทั้งหมด</option>
              {SHIRT_SIZES.map((size) => (
                <option key={size.code} value={size.code}>
                  {size.code}
                </option>
              ))}
            </select>

            <button
              className="btn-refresh"
              onClick={loadMembers}
              disabled={loading}
            >
              🔄 รีเฟรช
            </button>
          </div>
        </div>

        <div className="results-info">
          แสดง {members.length} จาก {totalCount.toLocaleString()} รายการ
        </div>
      </div>

      {/* Error Display */}
      {error && <div className="error-message">❌ {error}</div>}

      {/* Members Table */}
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="no-data">ไม่พบข้อมูลสมาชิก</div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="members-table">
              <thead>
                <tr>
                  <th>รหัสสมาชิก</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th>ขนาดที่เลือก</th>
                  <th>วันที่จอง/รับ</th>
                  <th>สถานะ</th>
                  <th>หมายเหตุ</th>
                  <th>การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  // Support both camelCase and UPPERCASE
                  const memberCode = member.memberCode || member.MEMB_CODE;
                  const fullName = member.fullName || member.FULLNAME;
                  const sizeCode = member.sizeCode || member.SIZE_CODE;
                  const receiveDate = member.receiveDate || member.RECEIVE_DATE;
                  const surveyDate = member.surveyDate || member.SURVEY_DATE;
                  const remarks = member.remarks || member.REMARKS;

                  return (
                    <tr key={memberCode}>
                      <td data-label="รหัสสมาชิก">
                        <strong>{memberCode}</strong>
                      </td>
                      <td data-label="ชื่อ-นามสกุล">{fullName}</td>
                      <td data-label="ขนาดที่เลือก">
                        {sizeCode ? (
                          <span className="size-display">{sizeCode}</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td data-label="วันที่จอง/รับ">
                        <span className="date-value">
                          {receiveDate 
                            ? formatDateTime(receiveDate)
                            : surveyDate 
                              ? formatDateTime(surveyDate)
                              : '-'
                          }
                        </span>
                      </td>
                      <td data-label="สถานะ">{getStatusTag(member)}</td>
                      <td data-label="หมายเหตุ">
                        {remarks ? (
                          <span className="remarks-text" title={remarks}>
                            {remarks}
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td data-label="การดำเนินการ">{getActionButton(member)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="btn-page"
            >
              ⏮️ หน้าแรก
            </button>

            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn-page"
            >
              ◀️ ก่อนหน้า
            </button>

            <span className="page-info">
              หน้า {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn-page"
            >
              ถัดไป ▶️
            </button>

            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="btn-page"
            >
              หน้าสุดท้าย ⏭️
            </button>
          </div>
        </>
      )}

      {/* Pickup Modal */}
      {showPickupModal && selectedMember && (
        <PickupModal
          visible={showPickupModal}
          onCancel={handleClosePickupModal}
          onSuccess={handlePickupSuccess}
          selectedMember={selectedMember}
        />
      )}
    </div>
  );
};

export default MembersList;