// src/components/Admin/PickupModal.jsx - จองได้ แต่รับไม่ได้ถ้าหมด stock
import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  Button,
  Radio,
  Row,
  Col,
  Card,
  message,
  Spin,
  Alert,
  Tag,
} from "antd";
import { CloseOutlined, WarningOutlined } from "@ant-design/icons";
import {
  submitPickup,
  saveMemberSize,
  getInventorySummary,
} from "../../services/shirtApi";
import { ENABLE_PICKUP } from "../../utils/constants";
import { useAppContext } from "../../App";
import "../../styles/PickupModal.css";
import StockStatus from "../Common/StockStatus";

const ALL_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
  "6XL",
];

const SIZE_INFO = {
  XS: { chest: '40"', length: '24"' },
  S: { chest: '42"', length: '25"' },
  M: { chest: '44"', length: '26"' },
  L: { chest: '46"', length: '27"' },
  XL: { chest: '48"', length: '28"' },
  "2XL": { chest: '50"', length: '29"' },
  "3XL": { chest: '52"', length: '30"' },
  "4XL": { chest: '54"', length: '31"' },
  "5XL": { chest: '56"', length: '32"' },
  "6XL": { chest: '58"', length: '33"' },
};

const PickupModal = ({ visible, onCancel, selectedMember, onSuccess }) => {
  const { user } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [loadingStock, setLoadingStock] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [originalSize, setOriginalSize] = useState(null); // Track original size
  const [receiverType, setReceiverType] = useState("SELF");
  const [receiverMemberCode, setReceiverMemberCode] = useState("");
  const [receiverFullName, setReceiverFullName] = useState("");
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [memberData, setMemberData] = useState(null);
  const [stockData, setStockData] = useState({});
  const saveButtonRef = useRef(null); // Ref for Save button

  useEffect(() => {
    if (visible && selectedMember) {
      console.log("Modal opened with member:", selectedMember);
      console.log("Current admin user:", user);

      setMemberData({
        memberCode: selectedMember.memberCode || selectedMember.MEMB_CODE,
        fullName: selectedMember.fullName || selectedMember.FULLNAME || "",
        sizeCode: selectedMember.sizeCode || selectedMember.SIZE_CODE || null,
        round: selectedMember.round || selectedMember.ROUND || "1", // Add round
        rawData: selectedMember,
      });

      setSelectedSize(
        selectedMember.sizeCode || selectedMember.SIZE_CODE || null
      );
      setOriginalSize(
        selectedMember.sizeCode || selectedMember.SIZE_CODE || null
      );
      console.log("Original Size set to:", selectedMember.sizeCode || selectedMember.SIZE_CODE || null);
      setReceiverType("SELF");
      setReceiverMemberCode("");
      setReceiverFullName("");

      loadStockData();
    } else if (!visible) {
      setMemberData(null);
      setSelectedSize(null);
      setOriginalSize(null);
      setReceiverType("SELF");
      setReceiverMemberCode("");
      setReceiverFullName("");
      setLoading(false);
      setStockData({});
    }
  }, [visible, selectedMember, user]);

  // ✅ Auto-focus Save button when Size Guide closes and we have a valid change
  useEffect(() => {
    if (!showSizeGuide && visible) {
      if (
        selectedSize &&
        originalSize &&
        selectedSize !== originalSize &&
        canReserveSize(selectedSize) &&
        !loading
      ) {
        // Timeout needed to override Ant Design's default focus restoration
        setTimeout(() => {
          saveButtonRef.current?.focus();
        }, 300);
      }
    }
  }, [showSizeGuide, visible, selectedSize, originalSize, loading]);

  const loadStockData = async () => {
    setLoadingStock(true);
    try {
      const inventory = await getInventorySummary();
      console.log("📊 Raw inventory data:", inventory);

      const stockMap = {};
      inventory.forEach((item) => {
        stockMap[item.sizeCode] = {
          remaining: item.remaining || 0,
          produced: item.produced || 0,
          reserved: item.reserved || 0,
          distributed: item.distributed || 0,
        };
      });
      setStockData(stockMap);
      console.log("📦 Stock data loaded:", stockMap);

      // ✅ Debug แต่ละ size ด้วยสูตรใหม่
      Object.entries(stockMap).forEach(([size, data]) => {
        const canReserve = data.remaining - data.reserved > 0;
        console.log(
          `Size ${size}: remaining=${data.remaining}, reserved=${data.reserved}, can reserve=${canReserve}`
        );
      });
    } catch (error) {
      console.error("Error loading stock:", error);
      message.error("ไม่สามารถโหลดข้อมูลสต็อกได้");
    } finally {
      setLoadingStock(false);
    }
  };

  // ✅ ตรวจสอบว่า size มี stock สำหรับการรับเสื้อหรือไม่ (ผลิต - จ่ายไปแล้ว > 0)
  const canReceiveSize = (size) => {
    if (!stockData[size]) return false;
    const { produced = 0, distributed = 0 } = stockData[size];
    return produced - distributed > 0;
  };

  // ✅ ตรวจสอบว่าสามารถจองได้หรือไม่ (สต๊อกคงเหลือ > 0)
  // remaining จาก API คือ (produced - reserved) แล้ว ไม่ต้องลบ reserved ซ้ำ
  const canReserveSize = (size) => {
    if (!stockData[size]) return false;
    const { remaining = 0 } = stockData[size];
    console.log(
      `🔍 Size ${size}: remaining=${remaining}`
    );
    return remaining > 0;
  };

  const getAdminCode = () => {
    console.log("Getting admin code from user:", user);

    if (!user) {
      console.warn("⚠️ No user found, using default ADMIN");
      message.warning("ไม่พบข้อมูลผู้ใช้ กรุณา Login ใหม่");
      return "ADMIN";
    }

    const adminCode = user.memberCode || user.MEMB_CODE || user.mbcode;

    if (!adminCode) {
      console.warn("⚠️ No memberCode found in user object:", user);
      message.warning("ไม่พบรหัสสมาชิกของผู้ดำเนินการ");
      return "ADMIN";
    }

    const paddedCode = String(adminCode).padStart(6, "0");
    console.log("✅ Using admin code:", paddedCode);

    return paddedCode;
  };

  // ✅ บันทึกขนาด - ตรวจสอบเงื่อนไขการจองใหม่
  const handleSaveSizeOnly = async () => {
    if (!memberData || !memberData.memberCode) {
      message.error("ไม่พบข้อมูลสมาชิก");
      return;
    }

    if (!selectedSize) {
      message.warning("กรุณาเลือกขนาดเสื้อ");
      return;
    }

    // ✅ ตรวจสอบเงื่อนไขการจองใหม่
    if (!canReserveSize(selectedSize)) {
      message.error(
        `ขนาด ${selectedSize} ไม่สามารถจองได้ เนื่องจากยอดจองเต็มแล้ว`
      );
      return;
    }

    // ✅ แจ้งเตือนถ้า stock หมด แต่ยังจองได้
    if (!canReceiveSize(selectedSize)) {
      message.warning(`ขนาด ${selectedSize} หมดสต็อก แต่จะบันทึกการจองไว้ให้`);
    }

    setLoading(true);
    try {
      const adminCode = getAdminCode();

      console.log("=== Saving size only ===");
      console.log("Member Code:", memberData.memberCode);
      console.log("Size Code:", selectedSize);
      console.log("Admin Code (PROCESSED_BY):", adminCode);

      await saveMemberSize({
        memberCode: memberData.memberCode,
        sizeCode: selectedSize,
        remarks: `แก้ไขโดย ${adminCode}`,
        surveyMethod: "MANUAL",
        processedBy: adminCode,
      });

      message.success("บันทึกขนาดสำเร็จ");

      onCancel();

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 300);
    } catch (error) {
      console.error("❌ Save size error:", error);
      message.error(error.message || "บันทึกขนาดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  // ✅ บันทึกการรับเสื้อ - ต้องมี stock เท่านั้น
  const handleSubmitPickup = async () => {
    if (!memberData || !memberData.memberCode) {
      message.error("ไม่พบข้อมูลสมาชิก");
      return;
    }

    // ✅ ตรวจสอบ Feature Flag ก่อน
    if (!ENABLE_PICKUP) {
      message.warning("ระบบปิดการรับเสื้อชั่วคราว");
      return;
    }

    if (!selectedSize) {
      message.warning("กรุณาเลือกขนาดเสื้อ");
      return;
    }

    // ✅ ห้ามรับถ้า stock หมด
    if (!canReceiveSize(selectedSize)) {
      message.error(`ขนาด ${selectedSize} หมดสต็อก ไม่สามารถบันทึกการรับได้`);
      return;
    }

    if (receiverType === "OTHER") {
      if (!receiverMemberCode || receiverMemberCode.length !== 6) {
        message.warning("กรุณากรอกเลขสมาชิกผู้รับแทน 6 หลัก");
        return;
      }
      if (!receiverFullName || receiverFullName.trim() === "") {
        message.warning("กรุณากรอกชื่อ-สกุล ผู้รับแทน");
        return;
      }
    }

    setLoading(true);
    try {
      const adminCode = getAdminCode();

      console.log("=== Submitting pickup ===");
      console.log("Member Code:", memberData.memberCode);
      console.log("Size Code:", selectedSize);
      console.log("Admin Code (PROCESSED_BY):", adminCode);
      console.log("Receiver Type:", receiverType);
      console.log("Receiver Member Code:", receiverMemberCode);
      console.log("Receiver Full Name:", receiverFullName);

      await submitPickup({
        memberCode: memberData.memberCode,
        sizeCode: selectedSize,
        processedBy: adminCode,
        receiverType: receiverType,
        receiverMemberCode:
          receiverType === "OTHER" ? receiverMemberCode : null,
        receiverName: receiverType === "OTHER" ? receiverFullName : null,
        remarks: `ดำเนินการโดย ${adminCode}`,
      });

      message.success("บันทึกการรับเสื้อสำเร็จ");

      onCancel();

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 300);
    } catch (error) {
      console.error("❌ Pickup submit error:", error);
      message.error(error.message || "บันทึกการรับเสื้อไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  if (!memberData) {
    return null;
  }

  return (
    <>
      <Modal
        open={visible}
        onCancel={onCancel}
        footer={null}
        width={500}
        closeIcon={<CloseOutlined />}
        className="pickup-modal-minimal"
        destroyOnClose={true}
        maskClosable={false}
        getContainer={false}
      >
        <div className="pickup-modal-content">
          <h2 className="modal-title">บันทึกข้อมูลการรับเสื้อ</h2>

          <div className="member-info-grid">
            <div className="info-item">
              <span className="info-label">รหัสสมาชิก</span>
              <span className="info-value">{memberData.memberCode}</span>
            </div>
            <div className="info-item">
              <span className="info-label">ชื่อ-นามสกุล</span>
              <span className="info-value">{memberData.fullName || "-"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">รอบที่</span>
              <span className="info-value">
                <Tag color={memberData.round === "2" ? "#f50" : "#108ee9"}>
                  {memberData.round === "2" ? "รอบที่ 2" : "รอบที่ 1"}
                </Tag>
              </span>
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <span className="section-label">ขนาดที่เลือก</span>
              <Button
                type="link"
                size="small"
                onClick={() => setShowSizeGuide(true)}
                loading={loadingStock}
              >
                เปลี่ยนขนาด
              </Button>
            </div>

            {loadingStock ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <Spin tip="กำลังโหลดข้อมูลสต็อก..." />
              </div>
            ) : selectedSize ? (
              <div className="selected-size-display">
                <span
                  style={{
                    color: !canReceiveSize(selectedSize) ? "#ff4d4f" : "#000",
                    fontWeight: "bold",
                  }}
                >
                  {selectedSize}
                </span>
                {/* ✅ แสดงสถานะการจองและรับ */}
                {stockData[selectedSize] && (
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    {!canReserveSize(selectedSize) && (
                      <div style={{ color: "#ff4d4f", fontWeight: "bold" }}>
                        ❌ จองไม่ได้ (ยอดจองเต็ม)
                      </div>
                    )}
                    {canReserveSize(selectedSize) &&
                      !canReceiveSize(selectedSize) && (
                        <div style={{ color: "#ff7a00", fontWeight: "bold" }}>
                          ⚠️ จองได้ แต่รับไม่ได้ (หมดสต็อก)
                        </div>
                      )}
                  </div>
                )}
              </div>
            ) : (
              <div className="no-size-warning">ยังไม่ได้เลือกขนาด</div>
            )}
          </div>

          <div className="section">
            <span className="section-label">ผู้รับเสื้อ</span>
            <Radio.Group
              value={receiverType}
              onChange={(e) => {
                setReceiverType(e.target.value);
                if (e.target.value === "SELF") {
                  setReceiverMemberCode("");
                  setReceiverFullName("");
                }
              }}
              className="receiver-radio-group"
            >
              <Radio
                value="SELF"
                disabled={
                  !ENABLE_PICKUP || !selectedSize || !canReceiveSize(selectedSize)
                }
              >
                รับด้วยตนเอง
              </Radio>
              <Radio
                value="OTHER"
                disabled={
                  !ENABLE_PICKUP || !selectedSize || !canReceiveSize(selectedSize)
                }
              >
                รับแทน
              </Radio>
            </Radio.Group>

            {receiverType === "OTHER" && (
              <div className="receiver-other-fields">
                <div className="input-group">
                  <label>เลขสมาชิกผู้รับแทน (6 หลัก)</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="กรอกเลขสมาชิก 6 หลัก"
                    value={receiverMemberCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setReceiverMemberCode(value);
                    }}
                    className="receiver-input"
                  />
                </div>
                <div className="input-group">
                  <label>ชื่อ-สกุล ผู้รับแทน</label>
                  <input
                    type="text"
                    placeholder="กรอกชื่อ หรือค้นหาจากเลขสมาชิก"
                    value={receiverFullName}
                    onChange={(e) => setReceiverFullName(e.target.value)}
                    className="receiver-input"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <Button onClick={onCancel} size="large" disabled={loading}>
              ยกเลิก
            </Button>

            {/* ✅ บันทึกขนาด - ตรวจสอบการจองได้ */}
            <Button
              ref={saveButtonRef}
              type="primary"
              size="large"
              onClick={handleSaveSizeOnly}
              loading={loading}
              disabled={
                !selectedSize ||
                !canReserveSize(selectedSize) ||
                loading ||
                selectedSize === originalSize
              }
            >
              บันทึกขนาด
            </Button>

            {/* ✅ บันทึกการรับเสื้อ - ทำได้ต่อเมื่อมี stock */}
            <Button
              type="primary"
              size="large"
              onClick={handleSubmitPickup}
              loading={loading}
              disabled={
                !ENABLE_PICKUP ||
                !selectedSize ||
                !canReceiveSize(selectedSize) ||
                loading ||
                selectedSize !== originalSize // Disable pickup if size changed (must save first)
              }
            >
              บันทึกการรับเสื้อ
            </Button>
          </div>
        </div>
      </Modal>

      {/* Size Guide Modal */}
      <Modal
        open={showSizeGuide}
        onCancel={() => setShowSizeGuide(false)}
        footer={null}
        width={900}
        closeIcon={<CloseOutlined />}
        className="size-guide-modal"
        destroyOnClose={true}
        getContainer={false}
      >
        <div className="size-guide-content">
          <h2 className="modal-title">เลือกขนาดเสื้อใหม่</h2>

          <div style={{ marginBottom: 16, fontSize: 14, color: "#666" }}>
            <a
              href="https://apps2.coop.ku.ac.th/asset/images/png/sizewidth.png"
              target="_blank"
              rel="noopener noreferrer"
            >
              วิธีวัดขนาดเสื้อ
            </a>
          </div>

          {loadingStock ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <Spin size="large" tip="กำลังโหลดข้อมูลสต็อก..." />
            </div>
          ) : (
            <>
              <div className="size-grid">
                {ALL_SIZES.map((size) => {
                  const hasStock = canReceiveSize(size);
                  const canReserve = canReserveSize(size);
                  const stock = stockData[size];

                  return (
                    <Card
                      key={size}
                      hoverable={canReserve}
                      className={`size-card ${
                        selectedSize === size ? "selected" : ""
                      } ${!canReserve ? "disabled" : ""}`}
                      onClick={() => {
                        if (!canReserve) {
                          message.error(
                            `ขนาด ${size} ไม่สามารถจองได้ เนื่องจากยอดจองเต็มแล้ว`
                          );
                          return;
                        }
                        setSelectedSize(size);
                        setShowSizeGuide(false);
                        if (!hasStock) {
                          message.warning(
                            `ขนาด ${size} หมดสต็อก - จองได้ แต่รับไม่ได้`
                          );
                        }
                      }}
                      style={{
                        opacity: canReserve ? 1 : 0.5,
                        cursor: canReserve ? "pointer" : "not-allowed",
                      }}
                    >
                      <div className="size-label" style={{ fontSize: 28 }}>
                        {size}
                        {/* ✅ แสดงสถานะต่างๆ */}
                        {!canReserve && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "#ff4d4f",
                              marginTop: 6,
                              fontWeight: "bold",
                            }}
                          >
                            จองไม่ได้
                          </div>
                        )}
                        {canReserve && !hasStock && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "#ff7a00",
                              marginTop: 6,
                              fontWeight: "bold",
                            }}
                          >
                            หมดสต็อก
                          </div>
                        )}
                      </div>
                      <div className="size-measurements">
                        <div style={{ fontSize: 12 }}>
                          อก {SIZE_INFO[size].chest} | ยาว{" "}
                          {SIZE_INFO[size].length}
                        </div>
                        {/* ✅ แสดงข้อมูลสต็อกและจอง */}
                        {stock && (
                          <div style={{ marginTop: 4 }}>
                            <StockStatus
                              remaining={stock.remaining}
                              isSelected={selectedSize === size}
                              isDisabled={!canReserve}
                            />
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>

              <div className="size-guide-note">
                <strong>คำแนะนำ:</strong>{" "}
                ควรเพิ่มขนาดจากที่วัดรอบอกได้ขึ้นอีกประมาณ 2"
                เนื่องจากเสื้อแจ็คเก็ตต้องมีพื้นที่เก็บอุ่น เช่น วัดได้ 40"
                ให้เลือกขนาดเสื้อ 42" แทน
                <div style={{ marginTop: 8, color: "#ff4d4f" }}>
                  <strong>หมายเหตุ:</strong>
                  <br />• ขนาดที่หมดสต็อกสามารถเลือกจองได้
                  แต่ไม่สามารถบันทึกการรับได้จนกว่าจะมีการเติมสต็อก
                  <br />• ขนาดที่ยอดจองเต็มแล้วจะไม่สามารถจองเพิ่มได้
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
};

export default PickupModal;
