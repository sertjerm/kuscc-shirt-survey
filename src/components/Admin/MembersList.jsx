// src/components/Admin/MembersList.jsx
import { useState, useEffect, useCallback } from "react";
import { Form } from "antd";
import { getShirtMemberListPaged } from "../../services/shirtApi";
import PickupModal from "./PickupModal";
import {
  SHIRT_SIZES,
  MEMBER_STATUS,
} from "../../utils/constants";
import "../../styles/MembersList.css";

const MembersList = () => {
  const [pickupForm] = Form.useForm();

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
    setSelectedMember(member);
    setShowPickupModal(true);
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
    if (member.RECEIVED_DATE) {
      return MEMBER_STATUS.RECEIVED;
    }
    if (member.SIZE_CODE) {
      return MEMBER_STATUS.CONFIRMED;
    }
    return MEMBER_STATUS.NOT_CONFIRMED;
  };

  // Helper: Format วันที่เป็น dd/mm/yyyy HH:mm (บรรทัดเดียว)
  const formatDateTime = (dateString) => {
    try {
      let date;
      // Check if it's WCF format /Date(...)/
      if (dateString && dateString.includes('/Date(')) {
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
    // ถ้ารับเสื้อแล้ว ไม่แสดงปุ่ม
    if (member.RECEIVED_DATE) {
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
              <option value="pending">ยังไม่ยืนยัน</option>
              <option value="confirmed">ยืนยันแล้ว</option>
              <option value="received">รับแล้ว</option>
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
      {error && <div className="error-message">{error}</div>}

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
                {members.map((member) => (
                  <tr key={member.MEMB_CODE}>
                    <td data-label="รหัสสมาชิก">
                      <strong>{member.MEMB_CODE}</strong>
                    </td>
                    <td data-label="ชื่อ-นามสกุล">{member.FULLNAME}</td>
                    <td data-label="ขนาดที่เลือก">
                      {member.SIZE_CODE ? (
                        <span className="size-display">{member.SIZE_CODE}</span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td data-label="วันที่จอง/รับ">
                      <span className="date-value">
                        {member.RECEIVED_DATE 
                          ? formatDateTime(member.RECEIVED_DATE)
                          : member.SURVEY_DATE 
                            ? formatDateTime(member.SURVEY_DATE)
                            : '-'
                        }
                      </span>
                    </td>
                    <td data-label="สถานะ">{getStatusTag(member)}</td>
                    <td data-label="หมายเหตุ">
                      {member.REMARKS ? (
                        <span className="remarks-text" title={member.REMARKS}>
                          {member.REMARKS}
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td data-label="การดำเนินการ">{getActionButton(member)}</td>
                  </tr>
                ))}
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
          onSubmit={handlePickupSuccess}
          selectedMember={selectedMember}
          form={pickupForm}
        />
      )}
    </div>
  );
};

export default MembersList;