// src/components/Admin/PickupModal.jsx
import React, { useState, useEffect } from "react";
import { Modal, Button, Radio, Row, Col, Card, message } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { submitPickup, saveMemberSize } from "../../services/shirtApi";
import { useAppContext } from "../../App";
import "../../styles/PickupModal.css";

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
  const [selectedSize, setSelectedSize] = useState(null);
  const [receiverType, setReceiverType] = useState("SELF");
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [actionType, setActionType] = useState("pickup");

  useEffect(() => {
    if (visible && selectedMember) {
      setSelectedSize(selectedMember.sizeCode || selectedMember.SIZE_CODE);
      setReceiverType("SELF");
      setActionType("pickup");
    }
  }, [visible, selectedMember]);

  // ดึง memberCode จาก user object
  const getAdminCode = () => {
    if (!user) {
      console.warn("⚠️ User object is undefined");
      return "ADMIN";
    }
    return user.memberCode || user.MEMB_CODE || user.mbcode || "ADMIN";
  };

  // บันทึกเฉพาะขนาด (ยังไม่รับเสื้อ)
  const handleSaveSizeOnly = async () => {
    if (!selectedSize) {
      message.warning("กรุณาเลือกขนาดเสื้อ");
      return;
    }

    setLoading(true);
    try {
      const adminCode = getAdminCode();
      const memberCode = selectedMember.memberCode || selectedMember.MEMB_CODE;

      console.log("💾 Saving size only:", {
        memberCode,
        sizeCode: selectedSize,
        adminCode,
      });

      await saveMemberSize({
        memberCode: memberCode,
        sizeCode: selectedSize,
        remarks: `แก้ไขโดย ${adminCode}`,
        surveyMethod: "MANUAL",
      });

      message.success("บันทึกขนาดเสื้อสำเร็จ");

      if (onSuccess) {
        onSuccess();
      }
      onCancel();
    } catch (error) {
      console.error("❌ Save size error:", error);
      message.error(error.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setLoading(false);
    }
  };

  // บันทึกการรับเสื้อ
  const handleSubmitPickup = async () => {
    if (!selectedSize) {
      message.warning("กรุณาเลือกขนาดเสื้อ");
      return;
    }

    setLoading(true);
    try {
      const adminCode = getAdminCode();
      const memberCode = selectedMember.memberCode || selectedMember.MEMB_CODE;

      console.log("📦 Submitting pickup:", {
        memberCode,
        sizeCode: selectedSize,
        processedBy: adminCode,
        receiverType,
      });

      await submitPickup({
        memberCode: memberCode,
        sizeCode: selectedSize,
        processedBy: adminCode,
        receiverType: receiverType,
        receiverName: receiverType === "OTHER" ? "รับแทน" : null,
        remarks: "",
      });

      message.success("บันทึกการรับเสื้อสำเร็จ");

      if (onSuccess) {
        onSuccess();
      }
      onCancel();
    } catch (error) {
      console.error("❌ Pickup submit error:", error);
      message.error(error.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedMember) return null;

  const memberCode = selectedMember.memberCode || selectedMember.MEMB_CODE;
  const fullName = selectedMember.fullName || selectedMember.FULLNAME;

  return (
    <>
      <Modal
        open={visible}
        onCancel={onCancel}
        footer={null}
        width={500}
        closeIcon={<CloseOutlined />}
        className="pickup-modal-minimal"
      >
        <div className="pickup-modal-content">
          <h2 className="modal-title">บันทึกการรับเสื้อ</h2>

          {/* ข้อมูลสมาชิก */}
          <div className="member-info-grid">
            <div className="info-item">
              <span className="info-label">รหัสสมาชิก</span>
              <span className="info-value">{memberCode}</span>
            </div>
            <div className="info-item">
              <span className="info-label">ชื่อ-นามสกุล</span>
              <span className="info-value">{fullName}</span>
            </div>
          </div>

          {/* เลือกขนาด */}
          <div className="section">
            <div className="section-header">
              <span className="section-label">ขนาดที่เลือก</span>
              <Button
                type="link"
                size="small"
                onClick={() => setShowSizeGuide(true)}
              >
                📏 เปลี่ยนขนาด
              </Button>
            </div>

            {selectedSize ? (
              <div className="selected-size-display">{selectedSize}</div>
            ) : (
              <div className="no-size-warning">ยังไม่ได้เลือกขนาด</div>
            )}
          </div>

          {/* เลือกผู้รับ */}
          <div className="section">
            <span className="section-label">ผู้รับเสื้อ</span>
            <Radio.Group
              value={receiverType}
              onChange={(e) => setReceiverType(e.target.value)}
              className="receiver-radio-group"
            >
              <Radio value="SELF">รับด้วยตนเอง</Radio>
              <Radio value="OTHER">รับแทน</Radio>
            </Radio.Group>
          </div>

          {/* ปุ่มด้านล่าง */}
          <div className="modal-footer">
            <Button onClick={onCancel} size="large">
              ยกเลิก
            </Button>

            <Button
              size="large"
              onClick={() => {
                setActionType("size-only");
                handleSaveSizeOnly();
              }}
              loading={loading && actionType === "size-only"}
            >
              บันทึกขนาดอย่างเดียว
            </Button>

            <Button
              type="primary"
              size="large"
              onClick={() => {
                setActionType("pickup");
                handleSubmitPickup();
              }}
              loading={loading && actionType === "pickup"}
            >
              บันทึกการรับเสื้อ
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal แสดงไซด์ชาร์ต */}
      <Modal
        open={showSizeGuide}
        onCancel={() => setShowSizeGuide(false)}
        footer={null}
        width={900}
        closeIcon={<CloseOutlined />}
        className="size-guide-modal"
      >
        <div className="size-guide-content">
          <h2 className="modal-title">เลือกขนาดเสื้อใหม่</h2>

          <div style={{ marginBottom: 16, fontSize: 14, color: "#666" }}>
            📏{" "}
            <a
              href="https://apps2.coop.ku.ac.th/asset/images/png/sizewidth.png"
              target="_blank"
              rel="noopener noreferrer"
            >
              วิธีวัดขนาดเสื้อ
            </a>
          </div>

          <Row gutter={[16, 16]}>
            {ALL_SIZES.map((size) => (
              <Col xs={12} sm={8} md={6} key={size}>
                <Card
                  hoverable
                  className={`size-card ${
                    selectedSize === size ? "selected" : ""
                  }`}
                  onClick={() => {
                    setSelectedSize(size);
                    setShowSizeGuide(false);
                  }}
                >
                  <div className="size-label">{size}</div>
                  <div className="size-measurements">
                    <div>อก {SIZE_INFO[size].chest}</div>
                    <div>ยาว {SIZE_INFO[size].length}</div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          <div className="size-guide-note">
            <strong>คำแนะนำ:</strong> ควรเพิ่มขนาดจากที่วัดรอบอกได้ขั้นอีกประมาณ
            2" เนื่องจากเสื้อแจ็คเก็ตต้องมีพื้นที่เก็บอุ่น เช่น วัดได้ 40"
            ให้เลือกขนาดเสื้อ 42" แทน
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PickupModal;
