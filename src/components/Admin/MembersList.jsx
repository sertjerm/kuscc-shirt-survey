// src/components/Admin/MembersList.jsx
import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import { getShirtMemberListPaged } from "../../services/shirtApi";
import { useAppContext } from "../../App";
import { formatDateTime } from "../../utils/js_functions"; // Added import for formatDateTime
import PickupModal from "./PickupModal";
import "../../styles/MembersList.css";

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

const MembersList = ({ onDataChange }) => {
  const { user } = useAppContext();
  
  // Data States
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Modal (จัดการเองทั้งหมด)
  const [selectedMember, setSelectedMember] = useState(null);
  const [showPickupModal, setShowPickupModal] = useState(false);

  // Load Members
  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getShirtMemberListPaged({
        page: currentPage,
        pageSize,
        search: searchTerm,
        status: statusFilter,
        size_code: sizeFilter,
      });

      setMembers(result.data || []);
      setTotalPages(result.totalPages || 1);
      setTotalCount(result.totalCount || 0);
    } catch (err) {
      console.error("Load members error:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, sizeFilter]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Handlers
  const handleClearSearch = () => {
    setSearchInput("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleFilterChange = (filterType, value) => {
    setCurrentPage(1);
    if (filterType === "status") setStatusFilter(value);
    if (filterType === "size") setSizeFilter(value);
  };

  const handleOpenPickupModal = (member) => {
    setSelectedMember(member);
    setShowPickupModal(true);
  };

  const handleClosePickupModal = () => {
    setShowPickupModal(false);
    setSelectedMember(null);
  };

  const handlePickupSuccess = () => {
    message.success("บันทึกการรับเสื้อสำเร็จ");
    handleClosePickupModal();
    loadMembers();
    
    // Notify parent ถ้ามี callback
    if (onDataChange) {
      onDataChange();
    }
  };

  // Helpers
  const getMemberStatus = (m) => {
    if (m.hasReceived || m.receiveStatus === "RECEIVED" || m.RECEIVE_STATUS === "RECEIVED") 
      return MEMBER_STATUS.RECEIVED;
    if (m.sizeCode || m.SIZE_CODE) 
      return MEMBER_STATUS.CONFIRMED;
    return MEMBER_STATUS.NOT_CONFIRMED;
  };

  // Local formatDateTime function has been removed - using imported function instead

  const getStatusTag = (member) => {
    const status = getMemberStatus(member);
    const config = {
      [MEMBER_STATUS.NOT_CONFIRMED]: { className: "status-tag status-tag-pending", text: "ยังไม่ยืนยัน" },
      [MEMBER_STATUS.CONFIRMED]: { className: "status-tag status-tag-confirmed", text: "ยืนยันแล้ว" },
      [MEMBER_STATUS.RECEIVED]: { className: "status-tag status-tag-received", text: "รับแล้ว" },
    };
    const c = config[status];
    return <span className={c.className}>{c.text}</span>;
  };

  const getActionButton = (member) => {
    const status = getMemberStatus(member);
    if (status === MEMBER_STATUS.RECEIVED) {
      return <span className="text-muted">-</span>;
    }
    return (
      <button className="btn-pickup" onClick={() => handleOpenPickupModal(member)}>
        บันทึกการรับ
      </button>
    );
  };

  return (
    <div className="members-list-container">
      <h2>ค้นหาและรับเสื้อ - รายชื่อสมาชิกทั้งหมด</h2>

      {/* Filters */}
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
              <button className="clear-search-btn" onClick={handleClearSearch}>✕</button>
            )}
          </div>

          <div className="filter-group">
            <select value={statusFilter} onChange={(e) => handleFilterChange("status", e.target.value)} className="filter-select">
              <option value="">สถานะทั้งหมด</option>
              <option value="PENDING">ยังไม่ยืนยัน</option>
              <option value="CONFIRMED">ยืนยันแล้ว</option>
              <option value="RECEIVED">รับแล้ว</option>
            </select>

            <select value={sizeFilter} onChange={(e) => handleFilterChange("size", e.target.value)} className="filter-select">
              <option value="">ขนาดทั้งหมด</option>
              {SHIRT_SIZES.map((size) => (
                <option key={size.code} value={size.code}>{size.code}</option>
              ))}
            </select>

            <button className="btn-refresh" onClick={loadMembers} disabled={loading}>
              🔄 รีเฟรช
            </button>
          </div>
        </div>

        <div className="results-info">
          แสดง {members.length} จาก {totalCount.toLocaleString()} รายการ
        </div>
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}

      {/* Table */}
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
                  const memberCode = member.memberCode || member.MEMB_CODE;
                  const fullName = member.fullName || member.FULLNAME;
                  const sizeCode = member.sizeCode || member.SIZE_CODE;
                  const receiveDate = member.receiveDate || member.RECEIVE_DATE;
                  const surveyDate = member.surveyDate || member.SURVEY_DATE;
                  const remarks = member.remarks || member.REMARKS;

                  return (
                    <tr key={memberCode}>
                      <td data-label="รหัสสมาชิก"><strong>{memberCode}</strong></td>
                      <td data-label="ชื่อ-นามสกุล">{fullName}</td>
                      <td data-label="ขนาดที่เลือก">
                        {sizeCode ? <span className="size-display">{sizeCode}</span> : <span className="text-muted">-</span>}
                      </td>
                      <td data-label="วันที่จอง/รับ">
                        <span className="date-value">
                          {receiveDate ? formatDateTime(receiveDate) : surveyDate ? formatDateTime(surveyDate) : '-'}
                        </span>
                      </td>
                      <td data-label="สถานะ">{getStatusTag(member)}</td>
                      <td data-label="หมายเหตุ">
                        {remarks ? <span className="remarks-text" title={remarks}>{remarks}</span> : <span className="text-muted">-</span>}
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
            <button onClick={() => handlePageChange(1)} disabled={currentPage === 1} className="btn-page">
              ⏮️ หน้าแรก
            </button>
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="btn-page">
              ◀️ ก่อนหน้า
            </button>
            <span className="page-info">หน้า {currentPage} / {totalPages}</span>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="btn-page">
              ถัดไป ▶️
            </button>
            <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} className="btn-page">
              หน้าสุดท้าย ⏭️
            </button>
          </div>
        </>
      )}

      {/* Modal */}
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