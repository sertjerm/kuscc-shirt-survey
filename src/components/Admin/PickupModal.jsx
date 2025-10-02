// src/components/Admin/PickupModal.jsx - UPDATED VERSION
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
  const [memberData, setMemberData] = useState(null);

  useEffect(() => {
    if (visible && selectedMember) {
      console.log("Modal opened with member:", selectedMember);
      console.log("Current admin user:", user);

      setMemberData({
        memberCode: selectedMember.memberCode || selectedMember.MEMB_CODE,
        fullName: selectedMember.fullName || selectedMember.FULLNAME || "",
        sizeCode: selectedMember.sizeCode || selectedMember.SIZE_CODE || null,
        rawData: selectedMember,
      });

      setSelectedSize(
        selectedMember.sizeCode || selectedMember.SIZE_CODE || null
      );
      setReceiverType("SELF");
    } else if (!visible) {
      // Reset state เมื่อปิด modal
      setMemberData(null);
      setSelectedSize(null);
      setReceiverType("SELF");
      setLoading(false);
    }
  }, [visible, selectedMember, user]);

  // ฟังก์ชันสำหรับดึง memberCode ของ admin ที่ login อยู่
  const getAdminCode = () => {
    console.log("Getting admin code from user:", user);

    if (!user) {
      console.warn("⚠️ No user found, using default ADMIN");
      message.warning("ไม่พบข้อมูลผู้ใช้ กรุณา Login ใหม่");
      return "ADMIN";
    }

    // ลองหาจาก field ต่างๆ
    const adminCode = user.memberCode || user.MEMB_CODE || user.mbcode;

    if (!adminCode) {
      console.warn("⚠️ No memberCode found in user object:", user);
      message.warning("ไม่พบรหัสสมาชิกของผู้ดำเนินการ");
      return "ADMIN";
    }

    // Format เป็น 6 หลัก
    const paddedCode = String(adminCode).padStart(6, "0");
    console.log("✅ Using admin code:", paddedCode);

    return paddedCode;
  };

  const handleSaveSizeOnly = async () => {
    if (!memberData || !memberData.memberCode) {
      message.error("ไม่พบข้อมูลสมาชิก");
      return;
    }

    if (!selectedSize) {
      message.warning("กรุณาเลือกขนาดเสื้อ");
      return;
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
        processedBy: adminCode, // ✅ ส่ง memberCode ของ admin
      });

      message.success("บันทึกขนาดสำเร็จ");

      // ปิด modal
      onCancel();

      // รอให้ modal ปิดสนิทก่อน refresh ข้อมูล
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

  const handleSubmitPickup = async () => {
    if (!memberData || !memberData.memberCode) {
      message.error("ไม่พบข้อมูลสมาชิก");
      return;
    }

    if (!selectedSize) {
      message.warning("กรุณาเลือกขนาดเสื้อ");
      return;
    }

    setLoading(true);
    try {
      const adminCode = getAdminCode();

      console.log("=== Submitting pickup ===");
      console.log("Member Code:", memberData.memberCode);
      console.log("Size Code:", selectedSize);
      console.log("Admin Code (PROCESSED_BY):", adminCode);
      console.log("Receiver Type:", receiverType);

      await submitPickup({
        memberCode: memberData.memberCode,
        sizeCode: selectedSize,
        processedBy: adminCode, // ✅ ส่ง memberCode ของ admin
        receiverType: receiverType,
        receiverName: receiverType === "OTHER" ? "รับแทน" : null,
        remarks: `ดำเนินการโดย ${adminCode}`,
      });

      message.success("บันทึกการรับเสื้อสำเร็จ");

      // ปิด modal
      onCancel();

      // รอให้ modal ปิดสนิทก่อน refresh ข้อมูล
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
          <h2 className="modal-title">บันทึกการรับเสื้อ</h2>

          <div className="member-info-grid">
            <div className="info-item">
              <span className="info-label">รหัสสมาชิก</span>
              <span className="info-value">{memberData.memberCode}</span>
            </div>
            <div className="info-item">
              <span className="info-label">ชื่อ-นามสกุล</span>
              <span className="info-value">{memberData.fullName || "-"}</span>
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <span className="section-label">ขนาดที่เลือก</span>
              <Button
                type="link"
                size="small"
                onClick={() => setShowSizeGuide(true)}
              >
                เปลี่ยนขนาด
              </Button>
            </div>

            {selectedSize ? (
              <div className="selected-size-display">{selectedSize}</div>
            ) : (
              <div className="no-size-warning">ยังไม่ได้เลือกขนาด</div>
            )}
          </div>

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

          <div className="modal-footer">
            <Button onClick={onCancel} size="large" disabled={loading}>
              ยกเลิก
            </Button>

            <Button
              size="large"
              onClick={handleSaveSizeOnly}
              loading={loading}
              disabled={!selectedSize || loading}
            >
              บันทึกขนาด
            </Button>

            <Button
              type="primary"
              size="large"
              onClick={handleSubmitPickup}
              loading={loading}
              disabled={!selectedSize || loading}
            >
              บันทึกการรับเสื้อ(debug)
            </Button>
          </div>
        </div>
      </Modal>

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

          {/* เดิมใช้ <Row><Col>... เปลี่ยนเป็น grid ให้ 2 แถว 5 คอลัมน์ */}
          <div className="size-grid">
            {ALL_SIZES.map((size) => (
              <Card
                key={size}
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
            ))}
          </div>

          <div className="size-guide-note">
            <strong>คำแนะนำ:</strong> ควรเพิ่มขนาดจากที่วัดรอบอกได้ขึ้นอีกประมาณ
            2" เนื่องจากเสื้อแจ็คเก็ตต้องมีพื้นที่เก็บอุ่น เช่น วัดได้ 40"
            ให้เลือกขนาดเสื้อ 42" แทน
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PickupModal;
