// src/components/Admin/MembersList.jsx - FINAL FIXED VERSION
import { useState, useEffect, useCallback } from "react";
import {
  message,
  Button,
  Pagination,
  Modal,
  Checkbox,
  Input,
  Popover,
} from "antd";
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
} from "../../services/shirtApi";
import { useAppContext } from "../../App";
import { formatDateTime } from "../../utils/js_functions";
import {
  SHIRT_SIZES,
  MEMBER_STATUS,
  STATUS_LABELS,
} from "../../utils/constants";
import PickupModal from "./PickupModal";
import "../../styles/MembersList.css";

const MembersList = ({ onDataChange }) => {
  const { user } = useAppContext();

  useEffect(() => {
    console.log("MembersList - Current admin user:", user);
  }, [user]);

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

  // Sorting
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

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

  // Clear Member Data Handler - FIXED VERSION
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
      const [localRemarks, setLocalRemarks] = useState("");

      const handleSizeChange = (checked) => {
        setLocalClearSize(checked);
        if (checked) {
          setLocalClearReceiveStatus(true);
        }
      };

      const handleReceiveStatusChange = (checked) => {
        if (!checked && localClearSize) {
          message.warning("ต้องล้างสถานะการรับเสื้อด้วย เมื่อล้างขนาดเสื้อ");
          return;
        }
        setLocalClearReceiveStatus(checked);
      };

      const handleConfirm = async () => {
        if (!localClearSize && !localClearReceiveStatus) {
          message.warning("กรุณาเลือกข้อมูลที่ต้องการล้างอย่างน้อย 1 รายการ");
          return;
        }

        try {
          setClearingMember(memberCode);

          console.log("Clear options:", {
            clearSize: localClearSize,
            clearReceiveStatus: localClearReceiveStatus,
          });

          await clearMemberData({
            memberCode: memberCode,
            clearSize: localClearSize,
            clearReceiveStatus: localClearReceiveStatus,
            clearRemarks: true,
            clearedBy: user?.memberCode || "admin",
          });

          const clearedItems = [];
          if (localClearSize) clearedItems.push("ขนาดเสื้อ");
          if (localClearReceiveStatus) clearedItems.push("สถานะการรับเสื้อ");

          const clearedBy = user?.memberCode || user?.name || "admin";
          const timestamp = new Date().toLocaleString("th-TH", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

          let remarksMessage = `[ล้างข้อมูล: ${clearedItems.join(
            ", "
          )}] โดย ${clearedBy} เมื่อ ${timestamp}`;

          if (localRemarks.trim()) {
            remarksMessage += ` | เหตุผล: ${localRemarks.trim()}`;
          }

          await saveMemberSize({
            memberCode: memberCode,
            sizeCode: localClearSize ? "" : sizeCode, // ✅ คงค่าเดิมถ้าไม่ได้เลือก clearSize
            remarks: remarksMessage,
            surveyMethod: "MANUAL",
            processedBy: user?.memberCode || "admin",
          });

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
                    backgroundColor: localClearSize ? "#fff1f0" : "white",
                    transition: "all 0.3s",
                  }}
                >
                  <Checkbox
                    checked={localClearSize}
                    onChange={(e) => handleSizeChange(e.target.checked)}
                    style={{ fontSize: "15px" }}
                  >
                    <strong>ล้างขนาดเสื้อที่เลือก:</strong>{" "}
                    <span
                      style={{
                        color: "#1890ff",
                        fontSize: "16px",
                        fontWeight: "bold",
                        marginLeft: "8px",
                      }}
                    >
                      {sizeCode}
                    </span>
                  </Checkbox>
                  {localClearSize && (
                    <div
                      style={{
                        marginTop: "8px",
                        marginLeft: "24px",
                        fontSize: "12px",
                        color: "#ff4d4f",
                      }}
                    >
                      ⚠️ จะล้างสถานะการรับเสื้อด้วยอัตโนมัติ
                    </div>
                  )}
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
                      ? "#fff1f0"
                      : "white",
                    transition: "all 0.3s",
                  }}
                >
                  <Checkbox
                    checked={localClearReceiveStatus}
                    onChange={(e) =>
                      handleReceiveStatusChange(e.target.checked)
                    }
                    disabled={localClearSize}
                    style={{ fontSize: "15px" }}
                  >
                    <strong>ล้างสถานะการรับเสื้อ:</strong>{" "}
                    <span
                      style={{
                        color: "#52c41a",
                        fontSize: "16px",
                        fontWeight: "bold",
                        marginLeft: "8px",
                      }}
                    >
                      {STATUS_LABELS[MEMBER_STATUS.RECEIVED]}
                    </span>
                  </Checkbox>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontWeight: "bold",
                marginBottom: "8px",
                fontSize: "14px",
              }}
            >
              หมายเหตุเพิ่มเติม (ระบุเหตุผลในการล้างข้อมูล):
            </label>
            <Input.TextArea
              placeholder="เช่น: ข้อมูลผิดพลาด, สมาชิกขอเปลี่ยนแปลง, ทดสอบระบบ..."
              rows={3}
              maxLength={200}
              showCount
              value={localRemarks}
              onChange={(e) => setLocalRemarks(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              backgroundColor: "#f5f5f5",
              borderRadius: "4px",
              fontSize: "12px",
              color: "#666",
            }}
          >
            <strong>ผู้ดำเนินการ:</strong>{" "}
            {user?.memberCode || user?.name || "admin"} |{" "}
            {new Date().toLocaleString("th-TH", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>

          <div style={{ marginTop: "16px", textAlign: "right" }}>
            <Button
              onClick={() => modalInstance.destroy()}
              style={{ marginRight: "8px" }}
            >
              ยกเลิก
            </Button>
            <Button
              type="primary"
              danger
              onClick={handleConfirm}
              loading={clearingMember === memberCode}
            >
              ยืนยันล้างข้อมูล
            </Button>
          </div>
        </div>
      );
    };

    modalInstance = Modal.info({
      title: (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "20px" }}>⚠️</span>
          <span>เลือกข้อมูลที่ต้องการล้าง</span>
        </div>
      ),
      icon: null,
      width: 600,
      content: <ClearModalContent />,
      footer: null,
      maskClosable: true,
    });
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

  const getStatusDisplay = (member) => {
    const status = getMemberStatus(member);
    const config = {
      [MEMBER_STATUS.NOT_CONFIRMED]: {
        color: "#faad14",
        text: STATUS_LABELS[MEMBER_STATUS.NOT_CONFIRMED],
      },
      [MEMBER_STATUS.CONFIRMED]: {
        color: "#1890ff",
        text: STATUS_LABELS[MEMBER_STATUS.CONFIRMED],
      },
      [MEMBER_STATUS.RECEIVED]: {
        color: "#52c41a",
        text: STATUS_LABELS[MEMBER_STATUS.RECEIVED],
      },
    };
    const c = config[status];
    return (
      <strong style={{ color: c.color, fontSize: "14px" }}>{c.text}</strong>
    );
  };

  const getActionButtons = (member) => {
    const memberCode = member.memberCode || member.MEMB_CODE;
    const status = getMemberStatus(member);
    const isClearing = clearingMember === memberCode;

    return (
      <div
        style={{ display: "flex", gap: "8px", justifyContent: "flex-start" }}
      >
        {status !== MEMBER_STATUS.RECEIVED ? (
          <button
            className="btn-edit"
            onClick={() => handleOpenPickupModal(member)}
            disabled={isClearing}
            title="บันทึกการรับเสื้อ"
          >
            <EditOutlined />
          </button>
        ) : (
          <span className="text-muted">-</span>
        )}

        {(status === MEMBER_STATUS.CONFIRMED ||
          status === MEMBER_STATUS.RECEIVED) && (
          <button
            className="btn-clear"
            onClick={() => handleClearMemberData(member)}
            disabled={isClearing}
            title="ล้างข้อมูล"
          >
            {isClearing ? <span>⏳</span> : <ClearOutlined />}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="members-list-container">
      <h2>ค้นหาและรับเสื้อ - รายชื่อสมาชิกทั้งหมด</h2>

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

            <Button
              onClick={loadMembers}
              loading={loading}
              icon={<ReloadOutlined />}
            >
              รีเฟรช
            </Button>
          </div>
        </div>

        <div className="results-info">
          แสดง {members.length} จาก {totalCount.toLocaleString()} รายการ
          {sortField && (
            <span className="sort-info">
              {" • เรียงตาม: "}
              {sortField === "memberCode"
                ? "รหัสสมาชิก"
                : sortField === "fullName"
                ? "ชื่อ-นามสกุล"
                : sortField === "sizeCode"
                ? "ขนาดเสื้อ"
                : sortField === "updatedDate"
                ? "วันที่อัปเดต"
                : sortField === "status"
                ? "สถานะ"
                : sortField}{" "}
              ({sortOrder === "asc" ? "น้อย→มาก" : "มาก→น้อย"})
            </span>
          )}
        </div>
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}

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
                    style={{ whiteSpace: "nowrap" }}
                  >
                    รหัสสมาชิก {getSortIcon("memberCode")}
                  </th>
                  <th
                    onClick={() => handleSort("fullName")}
                    className="sortable-header"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    ชื่อ-นามสกุล {getSortIcon("fullName")}
                  </th>
                  <th
                    onClick={() => handleSort("sizeCode")}
                    className="sortable-header"
                    style={{ whiteSpace: "nowrap", textAlign: "center" }}
                  >
                    ขนาดที่เลือก {getSortIcon("sizeCode")}
                  </th>
                  <th
                    onClick={() => handleSort("updatedDate")}
                    className="sortable-header"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    วันที่อัปเดตล่าสุด {getSortIcon("updatedDate")}
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    className="sortable-header"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    สถานะ {getSortIcon("status")}
                  </th>
                  <th
                    onClick={() => handleSort("processedBy")}
                    className="sortable-header"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    ผู้ดำเนินการ {getSortIcon("processedBy")}
                  </th>
                  <th style={{ whiteSpace: "nowrap" }}>หมายเหตุ</th>
                  <th style={{ whiteSpace: "nowrap" }}>การดำเนินการ</th>
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
                      <td data-label="ผู้ดำเนินการ">
                        {processedBy ? (
                          <span>{processedBy}</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td data-label="หมายเหตุ">
                        {remarks ? (
                          <Popover
                            content={
                              <div
                                style={{
                                  maxWidth: "400px",
                                  maxHeight: "300px",
                                  overflow: "auto",
                                  padding: "8px",
                                }}
                              >
                                {remarks}
                              </div>
                            }
                            trigger={["hover", "click"]}
                            placement="topLeft"
                            overlayStyle={{ maxWidth: "450px" }}
                          >
                            <span
                              style={{
                                cursor: "pointer",
                                textDecoration: "underline dotted",
                              }}
                            >
                              {remarks.length > 30
                                ? `${remarks.substring(0, 30)}...`
                                : remarks}
                            </span>
                          </Popover>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td data-label="การดำเนินการ">
                        {getActionButtons(member)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <Pagination
              current={currentPage}
              total={totalCount}
              pageSize={pageSize}
              onChange={handlePageChange}
              onShowSizeChange={handlePageSizeChange}
              showSizeChanger={true}
              pageSizeOptions={["10", "20", "50", "100"]}
            />
          </div>
        </>
      )}

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
