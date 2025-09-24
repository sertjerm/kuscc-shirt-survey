// src/pages/MemberPortal.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../App";
import {
  Card,
  Button,
  Typography,
  Avatar,
  Tag,
  Modal,
  Row,
  Col,
} from "antd";
import {
  LogoutOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

// วิธีวัดขนาด (ภาพ)
const shirtSize = "https://apps2.coop.ku.ac.th/asset/images/png/sizewidth.png";
const demoImg = "https://apps2.coop.ku.ac.th/asset/images/png/bluejacket6.png";

// ✅ ใช้ค่าคงที่จาก src/utils/shirt-size.js
import { shirtSizes } from "../utils/shirt-size";
import { saveMemberSize } from "../services/shirtApi";

const { Title, Paragraph, Text } = Typography;

/** ------------------------------------------------------- 
 * Helper: แปลงโครงสร้างจาก shirtSizes.sizes → SIZE_OPTIONS
 *  - ใช้เฉพาะ active = true
 *  - sort ตาม sortOrder หากมี
 *  - แปลง inch จาก '40"' → '40' เพื่อใช้แสดงผลเหมือนโค้ดเดิม
 * ------------------------------------------------------*/
const toSizeOptions = (sizes) =>
  (sizes || [])
    .filter((s) => s?.active)
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
    .map((s) => ({
      size: s.code,
      name: s.name,
      chestInch:
        typeof s.chest?.inch === "string"
          ? s.chest.inch.replace('"', "")
          : `${s.chest?.inch ?? ""}`,
      lengthInch:
        typeof s.length?.inch === "string"
          ? s.length.inch.replace('"', "")
          : `${s.length?.inch ?? ""}`,
      chestCm: s.chest?.cm,
      lengthCm: s.length?.cm,
    }));

const MemberPortal = () => {
  // --- State หลัก ---
  const [selectedSize, setSelectedSize] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // --- Navigation & Context ---
  const navigate = useNavigate();
  const { user, logout } = useAppContext();
  
  const [memberData, setMemberData] = useState(
    user || {
      memberCode: "",
      name: "",
      round: "",
      status: "ยังไม่ยืนยันขนาด",
      selectedSize: null,
      displayName: "",
      fullName: "",
      remarks: "",
    }
  );

  // ✅ ใช้ useMemo เพื่อสร้าง SIZE_OPTIONS จากค่าคงที่เพียงครั้งเดียว/เมื่อ shirtSizes เปลี่ยน
  const SIZE_OPTIONS = useMemo(() => toSizeOptions(shirtSizes?.sizes), []);

  // --- sync กับ user context ---
  useEffect(() => {
    if (user) {
      setMemberData(user);
      if (user.selectedSize) setSelectedSize(user.selectedSize);
    }
  }, [user]);

  useEffect(() => {
    if (memberData.selectedSize) {
      setSelectedSize(memberData.selectedSize);
    }
  }, [memberData.selectedSize]);

  const handleLogout = () => {
    Modal.confirm({
      title: "ออกจากระบบ",
      content: "คุณต้องการออกจากระบบหรือไม่?",
      okText: "ออกจากระบบ",
      cancelText: "ยกเลิก",
      okType: "danger",
      onOk: () => {
        try {
          // ใช้ logout function จาก context
          logout();
          // Redirect ไปหน้า login
          navigate('/login');
        } catch (error) {
          console.error('Logout error:', error);
          // Fallback redirect
          window.location.href = '/login';
        }
      },
    });
  };

  const handleSizeSelect = (size) => setSelectedSize(size);

  const handleSizeConfirm = () => {
    if (!selectedSize) {
      Modal.warning({
        title: "กรุณาเลือกขนาด",
        content: "กรุณาเลือกขนาดเสื้อก่อนยืนยัน",
      });
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmSizeSelection = async () => {
    setIsLoading(true);
    setShowConfirmModal(false);
    
    try {
      const res = await saveMemberSize({
        memberCode: memberData.memberCode,
        sizeCode: selectedSize,
        remarks: memberData.remarks || "",
        surveyMethod: "ONLINE",
      });

      if (res.responseCode !== 200) {
        throw new Error(res.responseMessage || "บันทึกขนาดไม่สำเร็จ");
      }

      setMemberData((prev) => ({
        ...prev,
        selectedSize,
        status: "ยืนยันขนาดแล้ว",
      }));

      Modal.success({
        title: "ยืนยันขนาดสำเร็จ",
        content: `คุณได้เลือกขนาด ${selectedSize} เรียบร้อยแล้ว`,
      });
    } catch (err) {
      console.error("save size failed:", err?.response?.data || err);
      Modal.error({
        title: "เกิดข้อผิดพลาด",
        content: err.message || "ไม่สามารถบันทึกข้อมูลได้",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openSizeGuide = () => {
    Modal.info({
      title: "วิธีวัดขนาดเสื้อ",
      width: 600,
      content: (
        <div style={{ padding: "20px 0" }}>
          <div style={{ textAlign: "center", marginBottom: "10px" }}>
            <img
              src={shirtSize}
              alt="วิธีวัดขนาดเสื้อ"
              style={{
                width: "100%",
                maxWidth: "400px",
                borderRadius: "8px",
                border: "1px solid #dee2e6",
              }}
            />
          </div>
        </div>
      ),
      okText: "เข้าใจแล้ว",
      okButtonProps: {
        style: {
          background: "linear-gradient(135deg, #007AFF, #5856D6)",
          border: "none",
          borderRadius: "8px",
        },
      },
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ยังไม่ยืนยันขนาด":
        return "#FF9500";
      case "ยืนยันขนาดแล้ว":
        return "#007AFF";
      case "รับเสื้อแล้ว":
        return "#32D74B";
      default:
        return "#8E8E93";
    }
  };

  const selectedSizeInfo = SIZE_OPTIONS.find((o) => o.size === selectedSize);

  return (
    <div className="member-portal-container">
      {/* Header - Enhanced User Info */}
      <Card
        style={{
          maxWidth: 700,
          width: "100%",
          margin: "0 auto 20px",
          borderRadius: "24px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)",
          position: "relative",
          padding: "8px 0",
        }}
      >
        <Button
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          type="text"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            color: "#48484a",
            background: "rgba(0,0,0,0.04)",
            borderRadius: "50%",
            width: 44,
            height: 44,
            minWidth: 44,
            minHeight: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            fontSize: 18,
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 59, 48, 0.1)";
            e.currentTarget.style.color = "#FF3B30";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.04)";
            e.currentTarget.style.color = "#48484a";
          }}
          aria-label="logout"
        />

        <div
          className="member-header-responsive"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 20,
            padding: "24px 60px 16px 60px",
            textAlign: "center",
          }}
        >
          <Avatar
            size={108}
            src={`https://apps2.coop.ku.ac.th/asset/member_photo/${memberData.memberCode}.png`}
            style={{
              background: "linear-gradient(135deg, #32D74B, #30B84E)",
              border: "4px solid rgba(255, 255, 255, 0.9)",
              minWidth: 108,
              minHeight: 108,
              boxShadow: "0 12px 36px rgba(50, 215, 75, 0.4)",
            }}
            alt="member avatar"
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <Title
              level={3}
              style={{
                margin: "0 0 4px 0",
                color: "#1d1d1f",
                fontSize: 24,
                fontWeight: 700,
                wordBreak: "break-word",
              }}
            >
              {memberData.fullName}
            </Title>
            <Text
              style={{
                color: "#48484a",
                fontSize: 16,
                fontWeight: 500,
                wordBreak: "break-word",
                display: "block",
                marginBottom: 8,
              }}
            >
              รหัสสมาชิก: {memberData.memberCode}
            </Text>
          </div>
        </div>

        {/* Status - Enhanced */}
        <div style={{ 
          textAlign: "center", 
          paddingBottom: 20,
          borderTop: "1px solid rgba(0, 122, 255, 0.1)",
          marginTop: 16,
          paddingTop: 20,
        }}>
          <Tag
            color={getStatusColor(memberData.status)}
            style={{
              padding: "12px 24px",
              borderRadius: "25px",
              fontSize: "16px",
              fontWeight: 600,
              border: "none",
              display: "inline-block",
              minWidth: 160,
              boxShadow: `0 4px 12px ${getStatusColor(memberData.status)}33`,
              textTransform: "none",
            }}
          >
            สถานะ: {memberData.status}
          </Tag>
        </div>
      </Card>

      {/* Main */}
      <Card
        style={{
          maxWidth: 700,
          width: "100%",
          margin: "0 auto",
          borderRadius: "24px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.1)",
        }}
        bodyStyle={{ padding: 24 }}
        className="main-content-card"
      >
        <div style={{ textAlign: "center"}}>
          <Title level={2} style={{ color: "#1d1d1f", marginBottom: 8 }}>
            เลือกขนาดเสื้อแจ็คเก็ต
          </Title>
          <Paragraph
            style={{ color: "#48484a", marginBottom: 24, fontSize: 16 }}
          >
            กรุณาเลือกขนาดเสื้อที่เหมาะสมกับคุณ
          </Paragraph>
          <Button
            type="primary"
            ghost
            icon={<InfoCircleOutlined />}
            onClick={openSizeGuide}
            style={{
              borderRadius: 12,
              height: 44,
              marginBottom: 16,
              borderColor: "#007AFF",
              color: "#007AFF",
              fontWeight: 500,
            }}
          >
            วิธีวัดขนาดเสื้อ
          </Button>
        </div>

        {/* Demo Image */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 24,
            padding: 0,
            background: "linear-gradient(135deg, #f8f9fa, #e9ecef)",
            borderRadius: 16,
            border: "2px solid rgba(0, 122, 255, 0.1)",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "relative", display: "block", padding: 16 }}>
            <img
              src={demoImg}
              alt="ตัวอย่างเสื้อแจ็คเก็ต"
              style={{
                width: "100%",
                height: "auto",
                marginBottom: 16,
                borderRadius: 12,
                boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
                border: "4px solid white",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 24,
                right: 24,
                background: "linear-gradient(135deg, #32D74B, #30B84E)",
                color: "white",
                padding: "6px 12px",
                borderRadius: 16,
                fontSize: 13,
                fontWeight: 700,
                boxShadow: "0 4px 12px rgba(50, 215, 75, 0.3)",
              }}
            >
              NEW
            </div>
          </div>
        </div>

        {/* Selected Size Display */}
        {selectedSize && (
          <div
            style={{
              textAlign: "center",
              marginBottom: 24,
              padding: 16,
              background:
                "linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(0, 122, 255, 0.05))",
              borderRadius: 12,
              border: "1px solid rgba(0, 122, 255, 0.2)",
            }}
          >
            <div>
              <Text strong style={{ fontSize: 18, color: "#007AFF" }}>
                ขนาดที่เลือก: {selectedSize}
              </Text>
              {selectedSizeInfo && (
                <div style={{ marginTop: 8 }}>
                  <Text style={{ color: "#48484a" }}>
                    รอบอก: {selectedSizeInfo.chestInch}" | ความยาว:{" "}
                    {selectedSizeInfo.lengthInch}"
                  </Text>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Size Selection */}
        <div style={{ marginBottom: 32 }}>
          <Row gutter={[12, 12]}>
            {SIZE_OPTIONS.map((option) => (
              <Col xs={12} sm={8} md={6} key={option.size}>
                <Button
                  size="large"
                  onClick={() => handleSizeSelect(option.size)}
                  style={{
                    width: "100%",
                    height: 80,
                    borderRadius: 12,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      selectedSize === option.size
                        ? "linear-gradient(135deg, #007AFF, #5856D6)"
                        : "white",
                    color: selectedSize === option.size ? "white" : "#1d1d1f",
                    border:
                      selectedSize === option.size
                        ? "2px solid #007AFF"
                        : "2px solid #f0f0f0",
                    boxShadow:
                      selectedSize === option.size
                        ? "0 8px 16px rgba(0, 122, 255, 0.3)"
                        : "0 2px 8px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.3s ease",
                  }}
                >
                  <Text
                    strong
                    style={{
                      fontSize: 16,
                      color: selectedSize === option.size ? "white" : "#1d1d1f",
                      marginBottom: 4,
                      ...(selectedSize === option.size && {
                        WebkitTextFillColor: "white",
                        textShadow: "none",
                      }),
                    }}
                  >
                    {option.size}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color:
                        selectedSize === option.size
                          ? "rgba(255,255,255,0.9)"
                          : "#8e8e93",
                      ...(selectedSize === option.size && {
                        WebkitTextFillColor: "rgba(255,255,255,0.9)",
                        textShadow: "none",
                      }),
                    }}
                  >
                    {option.chestInch}" × {option.lengthInch}"
                  </Text>
                </Button>
              </Col>
            ))}
          </Row>
        </div>

        {/* Confirm Button */}
        <div style={{ textAlign: "center" }}>
          <Button
            type="primary"
            size="large"
            loading={isLoading}
            onClick={handleSizeConfirm}
            disabled={!selectedSize}
            style={{
              height: 50,
              borderRadius: 25,
              paddingInline: 40,
              fontSize: 16,
              fontWeight: 600,
              background: selectedSize
                ? "linear-gradient(135deg, #32D74B, #30B84E)"
                : undefined,
              border: "none",
              boxShadow: selectedSize
                ? "0 8px 16px rgba(50, 215, 75, 0.3)"
                : undefined,
            }}
          >
            {memberData.status === "ยืนยันขนาดแล้ว"
              ? "อัปเดตขนาด"
              : "ยืนยันขนาด"}
          </Button>
        </div>

        {/* Info Notes */}
        <div
          style={{
            background: "rgba(255, 149, 0, 0.08)",
            border: "1px solid rgba(255, 149, 0, 0.2)",
            borderRadius: 12,
            padding: 16,
            marginTop: 24,
            textAlign: "center",
          }}
        >
          <InfoCircleOutlined style={{ color: "#FF9500", marginRight: 8 }} />
          <Text style={{ color: "#FF9500", fontSize: 14 }}>
            คุณสามารถเปลี่ยนแปลงขนาดได้ตลอดเวลา
            หรือเปลี่ยนขนาดตอนมารับเสื้อที่หน้างาน
          </Text>
        </div>

        <div
          style={{
            background: "rgba(0, 122, 255, 0.05)",
            border: "1px solid rgba(0, 122, 255, 0.1)",
            borderRadius: 12,
            padding: 16,
            marginTop: 16,
            textAlign: "center",
          }}
        >
          <Text style={{ color: "#007AFF", fontSize: 13 }}>
            <strong>คำแนะนำ:</strong> ควรเพิ่มขนาดจากที่วัดรอบอกได้ขึ้นอีกประมาณ 2 นิ้ว เนื่องจากเสื้อแจ็คเก็ตมักสวมทับกับเสื้ออื่น (เช่น วัดได้ 40" ให้เลือกขนาดเสื้อ 42" (Size S) แทน)
          </Text>
        </div>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        title={
          <div style={{ textAlign: "center" }}>
            <ExclamationCircleOutlined
              style={{ color: "#FF9500", fontSize: 24, marginRight: 8 }}
            />
            ยืนยันการเลือกขนาด
          </div>
        }
        open={showConfirmModal}
        onOk={confirmSizeSelection}
        onCancel={() => setShowConfirmModal(false)}
        okText="ยืนยัน"
        cancelText="ยกเลิก"
        centered
        okButtonProps={{
          style: {
            background: "linear-gradient(135deg, #32D74B, #30B84E)",
            border: "none",
            borderRadius: 8,
          },
        }}
      >
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Text style={{ fontSize: 16 }}>
            คุณต้องการยืนยันการเลือกขนาด{" "}
            <Text strong style={{ color: "#007AFF" }}>
              {selectedSize}
            </Text>{" "}
            หรือไม่?
          </Text>
          {selectedSizeInfo && (
            <div style={{ marginTop: 12 }}>
              <Text style={{ color: "#48484a" }}>
                รอบอก: {selectedSizeInfo.chestInch} นิ้ว | ความยาว:{" "}
                {selectedSizeInfo.lengthInch} นิ้ว
              </Text>
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            <Text style={{ color: "#8e8e93", fontSize: 14 }}>
              หลังจากยืนยันแล้ว คุณยังสามารถเปลี่ยนขนาดได้ในภายหลัง
            </Text>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MemberPortal;