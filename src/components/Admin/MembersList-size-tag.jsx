// src/components/Admin/MembersList.jsx - WITH SORTABLE COLUMNS
import { useState, useEffect, useCallback } from "react";
import { message, Tag } from "antd";
import { getShirtMemberListPaged } from "../../services/shirtApi";
import { useAppContext } from "../../App";
import { formatDateTime } from "../../utils/js_functions";
import PickupModal from "./PickupModal";
import "../../styles/MembersList.css";

const SHIRT_SIZES = [
  { code: "XS" },
  { code: "S" },
  { code: "M" },
  { code: "L" },
  { code: "XL" },
  { code: "2XL" },
  { code: "3XL" },
  { code: "4XL" },
  { code: "5XL" },
  { code: "6XL" },
];

const MEMBER_STATUS = {
  NOT_CONFIRMED: "NOT_CONFIRMED",
  CONFIRMED: "CONFIRMED",
  RECEIVED: "RECEIVED",
};

const MembersList = ({ onDataChange }) => {
  const { user } = useAppContext();

  useEffect(() => {
    console.log("MembersList - Current admin user:", user);
  }, [user]);

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

  // Sorting
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' or 'desc'

  // Modal
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
        sort_field: sortField,
        sort_order: sortOrder,
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
  }, [currentPage, searchTerm, statusFilter, sizeFilter, sortField, sortOrder]);

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

  // Sort Handler
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle order if clicking same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <span className="sort-icon">⇅</span>;
    }
    return sortOrder === "asc" ? (
      <span className="sort-icon active">↑</span>
    ) : (
      <span className="sort-icon active">↓</span>
    );
  };

  const handleOpenPickupModal = (member) => {
    console.log("Opening pickup modal for member:", member);
    setSelectedMember(member);
    setShowPickupModal(true);
  };

  const handleClosePickupModal = () => {
    console.log("Closing pickup modal");
    setShowPickupModal(false);
    setSelectedMember(null);
  };

  const handlePickupSuccess = () => {
    message.success("บันทึกการรับเสื้อสำเร็จ");
    handleClosePickupModal();
    loadMembers();
    if (onDataChange) {
      onDataChange();
    }
  };

  // Helpers
  const getMemberStatus = (m) => {
    if (
      m.hasReceived ||
      m.receiveStatus === "RECEIVED" ||
      m.RECEIVE_STATUS === "RECEIVED"
    )
      return MEMBER_STATUS.RECEIVED;
    if (m.sizeCode || m.SIZE_CODE) return MEMBER_STATUS.CONFIRMED;
    return MEMBER_STATUS.NOT_CONFIRMED;
  };

  const getSizeTag = (sizeCode) => {
    if (!sizeCode) return <span className="text-muted">-</span>;

    const colorMap = {
      XS: "purple",
      S: "green",
      M: "blue",
      L: "cyan",
      XL: "orange",
      "2XL": "magenta",
      "3XL": "geekblue",
      "4XL": "volcano",
      "5XL": "gold",
      "6XL": "red",
    };

    return <Tag color={colorMap[sizeCode] || "default"}>{sizeCode}</Tag>;
  };

  const getStatusTag = (member) => {
    const status = getMemberStatus(member);
    const config = {
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
    const c = config[status];
    return <span className={c.className}>{c.text}</span>;
  };

  const getActionButton = (member) => {
    const status = getMemberStatus(member);
    if (status === MEMBER_STATUS.RECEIVED) {
      return <span className="text-muted">-</span>;
    }
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
              <button className="clear-search-btn" onClick={handleClearSearch}>
                ✕
              </button>
            )}
          </div>

          <div className="filter-group">
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
          {sortField && (
            <span className="sort-info">
              {" "}
              • เรียงตาม:{" "}
              {sortField === "memberCode"
                ? "รหัสสมาชิก"
                : sortField === "fullName"
                ? "ชื่อ-นามสกุล"
                : sortField === "sizeCode"
                ? "ขนาดเสื้อ"
                : sortField === "receiveDate"
                ? "วันที่รับ"
                : sortField === "surveyDate"
                ? "วันที่จอง"
                : sortField === "status"
                ? "สถานะ"
                : sortField}{" "}
              ({sortOrder === "asc" ? "น้อย→มาก" : "มาก→น้อย"})
            </span>
          )}
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
                  <th
                    onClick={() => handleSort("memberCode")}
                    className="sortable-header"
                  >
                    รหัสสมาชิก {getSortIcon("memberCode")}
                  </th>
                  <th
                    onClick={() => handleSort("fullName")}
                    className="sortable-header"
                  >
                    ชื่อ-นามสกุล {getSortIcon("fullName")}
                  </th>
                  <th
                    onClick={() => handleSort("sizeCode")}
                    className="sortable-header"
                  >
                    ขนาดที่เลือก {getSortIcon("sizeCode")}
                  </th>
                  <th
                    onClick={() => handleSort("receiveDate")}
                    className="sortable-header"
                  >
                    วันที่จอง/รับ {getSortIcon("receiveDate")}
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    className="sortable-header"
                  >
                    สถานะ {getSortIcon("status")}
                  </th>
                  <th
                    onClick={() => handleSort("processedBy")}
                    className="sortable-header"
                  >
                    ผู้ดำเนินการ {getSortIcon("processedBy")}
                  </th>
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
                  const processedBy = member.processedBy || member.PROCESSED_BY;

                  return (
                    <tr key={memberCode}>
                      <td data-label="รหัสสมาชิก">
                        <strong>{memberCode}</strong>
                      </td>
                      <td data-label="ชื่อ-นามสกุล">{fullName}</td>
                      <td data-label="ขนาดที่เลือก">{getSizeTag(sizeCode)}</td>
                      <td data-label="วันที่จอง/รับ">
                        <span className="date-value">
                          {receiveDate
                            ? formatDateTime(receiveDate)
                            : surveyDate
                            ? formatDateTime(surveyDate)
                            : "-"}
                        </span>
                      </td>
                      <td data-label="สถานะ">{getStatusTag(member)}</td>
                      <td data-label="ผู้ดำเนินการ">
                        {processedBy ? (
                          <span className="processed-by-value">
                            {processedBy}
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td data-label="หมายเหตุ">
                        {remarks ? (
                          <span className="remarks-text" title={remarks}>
                            {remarks}
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td data-label="การดำเนินการ">
                        {getActionButton(member)}
                      </td>
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

      {/* Modal */}
      {showPickupModal && selectedMember && (
        <PickupModal
          visible={showPickupModal}
          onCancel={handleClosePickupModal}
          onSuccess={handlePickupSuccess}
          selectedMember={selectedMember}
        />
      )}

      <style jsx>{`
        .sortable-header {
          cursor: pointer;
          user-select: none;
          transition: background-color 0.2s;
        }

        .sortable-header:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }

        .sort-icon {
          display: inline-block;
          margin-left: 4px;
          opacity: 0.4;
          font-size: 14px;
        }

        .sort-icon.active {
          opacity: 1;
          color: #1890ff;
          font-weight: bold;
        }

        .sort-info {
          color: #1890ff;
          font-size: 13px;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default MembersList;