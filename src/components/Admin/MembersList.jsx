// src/components/Admin/MembersList.jsx - FIXED VERSION
// ✅ ใช้ API แทน hardcode + แก้ layout ให้เหมือน apps4

import { useState, useEffect, useCallback } from "react";
import { message, Button, Pagination, Modal, Checkbox, Tooltip } from "antd";
import {
  ReloadOutlined,
  ClearOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import {
  getShirtMemberListPaged,
  clearMemberData,
  saveMemberSize,
  getShirtSizes,
} from "../../services/shirtApi";
import { useAppContext } from "../../App";
import { formatDateTime } from "../../utils/js_functions";
import { MEMBER_STATUS, STATUS_LABELS } from "../../utils/constants";
import PickupModal from "./PickupModal";
import "../../styles/MembersList.css";

const MembersList = ({ onDataChange }) => {
  const { user } = useAppContext();

  // Data States
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clearingMember, setClearingMember] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sizes, setSizes] = useState([]);

  // Sorting
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  // Modal
  const [selectedMember, setSelectedMember] = useState(null);
  const [showPickupModal, setShowPickupModal] = useState(false);

  // ✅ โหลด sizes จาก API
  useEffect(() => {
    loadSizes();
  }, []);

  const loadSizes = async () => {
    try {
      const sizesData = await getShirtSizes();
      setSizes(sizesData);
    } catch (error) {
      console.error("Error loading sizes:", error);
    }
  };

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

      console.log("🔍 API Response:", result);
      console.log("🔍 Members data:", result.data);
      if (result.data && result.data.length > 0) {
        console.log("🔍 First member:", result.data[0]);
        console.log(
          "🔍 RECEIVE_CHANNEL in first member:",
          result.data[0].RECEIVE_CHANNEL
        );
      }

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
  }, [
    currentPage,
    pageSize,
    searchTerm,
    statusFilter,
    sizeFilter,
    sortField,
    sortOrder,
  ]);

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
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageSizeChange = (current, newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleFilterChange = (filterType, value) => {
    setCurrentPage(1);
    if (filterType === "status") setStatusFilter(value);
    if (filterType === "size") setSizeFilter(value);
  };

  // Sort Handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
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
    if (onDataChange) {
      onDataChange();
    }
  };

  // Get member status
  const getMemberStatus = (member) => {
    if (member.hasReceived || member.receiveStatus === "RECEIVED") {
      return MEMBER_STATUS.RECEIVED;
    }
    if (member.sizeCode || member.SIZE_CODE) {
      return MEMBER_STATUS.CONFIRMED;
    }
    return MEMBER_STATUS.NOT_CONFIRMED;
  };

  const getStatusDisplay = (member) => {
    const status = getMemberStatus(member);
    const statusClass =
      status === MEMBER_STATUS.RECEIVED
        ? "status-badge received"
        : status === MEMBER_STATUS.CONFIRMED
        ? "status-badge confirmed"
        : "status-badge not-confirmed";

    return <span className={statusClass}>{STATUS_LABELS[status]}</span>;
  };

  // แสดงช่องทางการรับเป็นข้อความสี
  const getReceiveChannelTag = (receiveChannel) => {
    console.log(
      "🔍 getReceiveChannelTag called with:",
      receiveChannel,
      "type:",
      typeof receiveChannel
    );

    if (!receiveChannel) {
      console.log("🔍 receiveChannel is falsy, returning -");
      return <span className="text-muted">-</span>;
    }

    // กำหนดสีข้อความตามช่องทางการรับ
    const getTextColor = (channel) => {
      switch (channel) {
        case "รับเอง":
          return "#1890ff"; // น้ำเงิน
        case "จัดส่ง":
          return "#52c41a"; // เขียว
        case "ส่งไปรษณีย์":
          return "#fa8c16"; // ส้ม
        default:
          return "#666"; // เทา
      }
    };

    return (
      <span
        style={{
          color: getTextColor(receiveChannel),
          fontWeight: "500",
          fontSize: "13px",
        }}
      >
        {receiveChannel}
      </span>
    );
  };

  // Clear Member Data Handler
  const handleClearMemberData = (member) => {
    const memberCode = member.memberCode || member.MEMB_CODE;
    const fullName = member.fullName || member.FULLNAME;
    const sizeCode = member.sizeCode || member.SIZE_CODE;
    const status = getMemberStatus(member);

    let modalInstance;

    const ClearModalContent = () => {
      const [localClearSize, setLocalClearSize] = useState(false);
      const [localClearReceiveStatus, setLocalClearReceiveStatus] =
        useState(false);
      const [localClearRemarks, setLocalClearRemarks] = useState(false);

      return (
        <div>
          <div
            style={{
              marginBottom: "24px",
              padding: "16px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "8px",
              color: "white",
            }}
          >
            <h3
              style={{ margin: "0 0 12px 0", color: "white", fontSize: "16px" }}
            >
              ข้อมูลสมาชิก
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                fontSize: "14px",
              }}
            >
              <div>
                <strong>รหัสสมาชิก:</strong> {memberCode}
              </div>
              <div>
                <strong>สถานะ:</strong> {STATUS_LABELS[status]}
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <strong>ชื่อ-นามสกุล:</strong> {fullName}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "16px",
                padding: "12px",
                backgroundColor: "#fff2e8",
                borderLeft: "4px solid #ff9800",
                borderRadius: "4px",
              }}
            >
              <ExclamationCircleOutlined
                style={{
                  color: "#ff9800",
                  fontSize: "20px",
                  marginRight: "8px",
                }}
              />
              <span style={{ fontWeight: "bold", color: "#d46b08" }}>
                เลือกข้อมูลที่ต้องการล้าง:
              </span>
            </div>

            <div style={{ paddingLeft: "8px" }}>
              {sizeCode && (
                <div
                  style={{
                    marginBottom: "12px",
                    padding: "12px",
                    border: "1px solid #d9d9d9",
                    borderRadius: "4px",
                    backgroundColor: localClearSize ? "#fff7e6" : "#fafafa",
                  }}
                >
                  <Checkbox
                    checked={localClearSize}
                    onChange={(e) => setLocalClearSize(e.target.checked)}
                  >
                    <strong>ล้างขนาดเสื้อ</strong> (ปัจจุบัน:{" "}
                    <strong>{sizeCode}</strong>)
                  </Checkbox>
                </div>
              )}

              {status === MEMBER_STATUS.RECEIVED && (
                <div
                  style={{
                    marginBottom: "12px",
                    padding: "12px",
                    border: "1px solid #d9d9d9",
                    borderRadius: "4px",
                    backgroundColor: localClearReceiveStatus
                      ? "#fff7e6"
                      : "#fafafa",
                  }}
                >
                  <Checkbox
                    checked={localClearReceiveStatus}
                    onChange={(e) =>
                      setLocalClearReceiveStatus(e.target.checked)
                    }
                  >
                    <strong>ล้างสถานะการรับเสื้อ</strong>
                  </Checkbox>
                </div>
              )}

              <div
                style={{
                  marginBottom: "12px",
                  padding: "12px",
                  border: "1px solid #d9d9d9",
                  borderRadius: "4px",
                  backgroundColor: localClearRemarks ? "#fff7e6" : "#fafafa",
                }}
              >
                <Checkbox
                  checked={localClearRemarks}
                  onChange={(e) => setLocalClearRemarks(e.target.checked)}
                >
                  <strong>ล้างหมายเหตุ</strong>
                </Checkbox>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "12px",
              backgroundColor: "#e6f7ff",
              borderLeft: "4px solid #1890ff",
              borderRadius: "4px",
              marginBottom: "16px",
            }}
          >
            <strong>💡 คำแนะนำ:</strong> เลือกข้อมูลที่ต้องการล้างด้านบน
            จากนั้นกดปุ่ม "ยืนยันการล้างข้อมูล"
          </div>

          <div
            style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}
          >
            <Button onClick={() => modalInstance.destroy()}>ยกเลิก</Button>
            <Button
              type="primary"
              danger
              onClick={async () => {
                if (
                  !localClearSize &&
                  !localClearReceiveStatus &&
                  !localClearRemarks
                ) {
                  message.warning("กรุณาเลือกข้อมูลที่ต้องการล้าง");
                  return;
                }

                await handleConfirmClear({
                  clearSize: localClearSize,
                  clearReceiveStatus: localClearReceiveStatus,
                  clearRemarks: localClearRemarks,
                });
              }}
            >
              ยืนยันการล้างข้อมูล
            </Button>
          </div>
        </div>
      );
    };

    const handleConfirmClear = async (options) => {
      const { clearSize, clearReceiveStatus, clearRemarks } = options;

      setClearingMember(memberCode);

      try {
        let remarksMessage = "ล้างข้อมูล: ";
        if (clearSize) remarksMessage += "ขนาด ";
        if (clearReceiveStatus) remarksMessage += "สถานะการรับ ";
        if (clearRemarks) remarksMessage += "หมายเหตุ ";

        await clearMemberData({
          memberCode,
          clearSize,
          clearReceiveStatus,
          clearRemarks,
          clearedBy: user?.memberCode || "admin",
        });

        if (!clearSize && sizeCode) {
          await saveMemberSize({
            memberCode,
            sizeCode: sizeCode,
            remarks: remarksMessage,
            surveyMethod: "MANUAL",
            processedBy: user?.memberCode || "admin",
          });
        }

        message.success(`ล้างข้อมูลสมาชิก ${memberCode} สำเร็จ`);
        loadMembers();

        if (onDataChange) {
          onDataChange();
        }

        modalInstance.destroy();
      } catch (err) {
        console.error("Clear member data error:", err);
        message.error(err.message || "ไม่สามารถล้างข้อมูลได้");
      } finally {
        setClearingMember(null);
      }
    };

    modalInstance = Modal.confirm({
      title: "ล้างข้อมูลสมาชิก",
      icon: <ClearOutlined style={{ color: "#ff4d4f" }} />,
      content: <ClearModalContent />,
      footer: null,
      width: 600,
      maskClosable: true,
    });
  };

  // Render
  return (
    <div className="members-list-container">
      {/* Header */}
      <div className="list-header">
        <div className="header-content">
          <h2 className="header-title">
            ค้นหาและจ่ายเสื้อ - รายชื่อสมาชิกทั้งหมด
          </h2>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-row">
            {/* Search box */}
            <div className="filter-row-left">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="ค้นหาด้วยรหัสสมาชิก หรือ ชื่อ..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="search-input"
                />
                {searchInput && (
                  <button
                    onClick={handleClearSearch}
                    className="clear-search-btn"
                    title="ล้างการค้นหา"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Dropdowns + Refresh */}
            <div className="filter-row-right">
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="filter-select"
              >
                <option value="">สถานะทั้งหมด</option>
                <option value="NOT_CONFIRMED">ยังไม่ยืนยันขนาด</option>
                <option value="CONFIRMED">ยืนยันขนาดแล้ว</option>
                <option value="RECEIVED">รับเสื้อแล้ว</option>
              </select>

              <select
                value={sizeFilter}
                onChange={(e) => handleFilterChange("size", e.target.value)}
                className="filter-select"
              >
                <option value="">ขนาดทั้งหมด</option>
                {sizes.map((size) => (
                  <option key={size.SIZE_CODE} value={size.SIZE_CODE}>
                    {size.SIZE_CODE}
                  </option>
                ))}
              </select>

              <Button
                icon={<ReloadOutlined />}
                onClick={() => loadMembers()}
                loading={loading}
                className="reload-btn"
              >
                รีเฟรช
              </Button>
            </div>
          </div>

          {/* Stats below filters */}
          <div className="header-stats">
            <span className="stat-item">
              แสดง 10 จาก {totalCount.toLocaleString()} รายการ
            </span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <ExclamationCircleOutlined /> {error}
        </div>
      )}

      {/* Table Section */}
      <div className="table-container">
        {loading && members.length === 0 ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>กำลังโหลดข้อมูล...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="empty-state">
            <p>ไม่พบข้อมูลสมาชิก</p>
          </div>
        ) : (
          <table className="members-table">
            <thead>
              <tr>
                <th
                  onClick={() => handleSort("memberCode")}
                  className="sortable"
                >
                  รหัสสมาชิก {getSortIcon("memberCode")}
                </th>
                <th onClick={() => handleSort("fullName")} className="sortable">
                  ชื่อ-นามสกุล {getSortIcon("fullName")}
                </th>
                <th style={{ textAlign: "center" }}>ขนาดที่เลือก</th>
                <th
                  onClick={() => handleSort("updatedDate")}
                  className="sortable"
                >
                  วันที่อัปเดตล่าสุด {getSortIcon("updatedDate")}
                </th>
                <th>สถานะ</th>
                <th style={{ textAlign: "center" }}>ช่องทางการรับ</th>
                <th>หมายเหตุ</th>
                <th style={{ textAlign: "center" }}>การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const memberCode = member.memberCode || member.MEMB_CODE;
                const fullName = member.fullName || member.FULLNAME;
                const sizeCode = member.sizeCode || member.SIZE_CODE;
                const updatedDate = member.updatedDate || member.UPDATED_DATE;
                const remarks = member.remarks || member.REMARKS;
                const processedBy = member.processedBy || member.PROCESSED_BY;
                const receiveChannel =
                  member.RECEIVE_CHANNEL || member.receiveChannel;

                // เพิ่มการดีบัก
                if (memberCode === "012938") {
                  console.log("🔍 Debug member 012938:", {
                    member: member,
                    RECEIVE_CHANNEL: member.RECEIVE_CHANNEL,
                    receiveChannel: member.receiveChannel,
                    finalReceiveChannel: receiveChannel,
                  });
                }

                return (
                  <tr key={memberCode}>
                    <td data-label="รหัสสมาชิก">
                      <strong>{memberCode}</strong>
                    </td>
                    <td data-label="ชื่อ-นามสกุล">{fullName}</td>
                    <td
                      data-label="ขนาดที่เลือก"
                      style={{ textAlign: "center" }}
                    >
                      {sizeCode ? (
                        <strong style={{ color: "#000", fontSize: "16px" }}>
                          {sizeCode}
                        </strong>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td data-label="วันที่อัปเดตล่าสุด">
                      <span className="date-value">
                        {updatedDate ? formatDateTime(updatedDate) : "-"}
                      </span>
                    </td>
                    <td data-label="สถานะ">{getStatusDisplay(member)}</td>
                    <td
                      data-label="ช่องทางการรับ"
                      style={{ textAlign: "center" }}
                    >
                      {getReceiveChannelTag(receiveChannel)}
                    </td>
                    <td data-label="หมายเหตุ">
                      {remarks ? (
                        <Tooltip title={remarks} placement="topLeft">
                          <span className="remarks-preview">{remarks}</span>
                        </Tooltip>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td data-label="การดำเนินการ">
                      <div className="action-buttons">
                        <Tooltip
                          title={
                            member.hasReceived ? "ดูรายละเอียด" : "บันทึกการรับ"
                          }
                        >
                          <Button
                            size="small"
                            type="primary"
                            onClick={() => handleOpenPickupModal(member)}
                            disabled={clearingMember === memberCode}
                            icon={<EditOutlined />}
                            aria-label={
                              member.hasReceived
                                ? "ดูรายละเอียด"
                                : "บันทึกการรับ"
                            }
                          />
                        </Tooltip>

                        <Tooltip title="ล้างข้อมูล">
                          <Button
                            size="small"
                            danger
                            onClick={() => handleClearMemberData(member)}
                            disabled={clearingMember === memberCode}
                            loading={clearingMember === memberCode}
                            icon={<ClearOutlined />}
                            aria-label="ล้างข้อมูล"
                          />
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="pagination-container">
        <Pagination
          current={currentPage}
          total={totalCount}
          pageSize={pageSize}
          onChange={handlePageChange}
          onShowSizeChange={handlePageSizeChange}
          showSizeChanger
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} จาก ${total} รายการ`
          }
          pageSizeOptions={["10", "20", "50", "100"]}
        />
      </div>

      {/* Pickup Modal */}
      {showPickupModal && selectedMember && (
        <PickupModal
          visible={showPickupModal}
          onCancel={handleClosePickupModal}
          selectedMember={selectedMember}
          onSuccess={handlePickupSuccess}
        />
      )}
    </div>
  );
};

export default MembersList;
