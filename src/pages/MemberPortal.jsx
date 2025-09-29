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
  Alert,
} from "antd";
import {
  LogoutOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import "../styles/MemberPortal.css";

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

  // เริ่มต้นด้วยข้อมูล default แล้วค่อย sync กับ user context
  const [memberData, setMemberData] = useState({
    memberCode: "",
    name: "",
    fullName: "",
    displayName: "",
    phone: "",
    idCard: "",
    role: "member",
    sizeCode: null,
    surveyDate: null,
    surveyMethod: null,
    updatedDate: null,
    remarks: null,
    status: "ยังไม่ยืนยันขนาด",
    selectedSize: null,
  });

  // ✅ ใช้ useMemo เพื่อสร้าง SIZE_OPTIONS จากค่าคงที่เพียงครั้งเดียว/เมื่อ shirtSizes เปลี่ยน
  const SIZE_OPTIONS = useMemo(() => toSizeOptions(shirtSizes?.sizes), []);

  // --- sync กับ user context เมื่อ component mount หรือ user เปลี่ยน ---
  useEffect(() => {
    console.log("User from context:", user);

    if (user) {
      // กำหนดสถานะจาก SIZE_CODE
      let currentStatus = "ยังไม่ยืนยันขนาด";
      if (user.sizeCode || user.SIZE_CODE) {
        currentStatus = "ยืนยันขนาดแล้ว";
      }

      const updatedMemberData = {
        memberCode: user.memberCode || user.MEMB_CODE || "",
        name: user.name || user.DISPLAYNAME || "",
        fullName: user.fullName || user.FULLNAME || "",
        displayName: user.displayName || user.DISPLAYNAME || "",
        phone: user.phone || user.MEMB_MOBILE || "",
        idCard: user.idCard || user.MEMB_SOCID || "",
        role: user.role || user.USER_ROLE || "member",
        sizeCode: user.sizeCode || user.SIZE_CODE || null,
        surveyDate: user.surveyDate || user.SURVEY_DATE || null,
        surveyMethod: user.surveyMethod || user.SURVEY_METHOD || null,
        updatedDate: user.updatedDate || user.UPDATED_DATE || null,
        remarks: user.remarks || user.REMARKS || null,
        status: currentStatus,
        selectedSize: user.sizeCode || user.SIZE_CODE || null,
      };

      console.log("Updated member data:", updatedMemberData);

      setMemberData(updatedMemberData);

      // Set selectedSize ถ้ามีข้อมูลจาก user
      if (updatedMemberData.selectedSize) {
        setSelectedSize(updatedMemberData.selectedSize);
      }
    }
  }, [user]);

  // --- Debug log สำหรับตรวจสอบข้อมูล ---
  useEffect(() => {
    console.log("Current memberData:", memberData);
    console.log("Current selectedSize:", selectedSize);
  }, [memberData, selectedSize]);

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
          navigate("/login");
        } catch (error) {
          console.error("Logout error:", error);
          // Fallback redirect
          window.location.href = "/login";
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

      // อัพเดต memberData และ user context
      const updatedData = {
        ...memberData,
        selectedSize,
        sizeCode: selectedSize,
        status: "ยืนยันขนาดแล้ว",
        surveyDate: new Date().toISOString(),
        surveyMethod: "ONLINE",
        updatedDate: new Date().toISOString(),
      };

      setMemberData(updatedData);

      Modal.success({
        title: "ยืนยันขนาดสำเร็จ",
        content: `คุณได้เลือกขนาด ${selectedSize} เรียบร้อยแล้ว `,
        okText: "ตกลง",
        onOk: () => navigate("/login"),
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
            src={
              memberData.memberCode
                ? `https://apps2.coop.ku.ac.th/asset/member_photo/${memberData.memberCode}.png`
                : null
            }
            style={{
              background: "linear-gradient(135deg, #32D74B, #30B84E)",
              border: "4px solid rgba(255, 255, 255, 0.9)",
              minWidth: 108,
              minHeight: 108,
              boxShadow: "0 12px 36px rgba(50, 215, 75, 0.4)",
            }}
            alt="member avatar"
          />
          <div
            className="member-info-responsive"
            style={{ minWidth: 0, flex: 1 }}
          >
            <span className="member-name">
              <Title
                level={3}
                style={{
                  margin: "0 0 4px 0",
                  color: "#1d1d1f",
                  fontSize: 24,
                  fontWeight: 700,
                  wordBreak: "break-word",
                  display: "inline",
                }}
              >
                {memberData.displayName || memberData.name || "ไม่ระบุชื่อ"}
              </Title>
            </span>
            <span className="member-code" style={{ marginLeft: 12 }}>
              <Text
                style={{
                  color: "#48484a",
                  fontSize: 16,
                  fontWeight: 500,
                  wordBreak: "break-word",
                  display: "inline-block",
                  marginBottom: 8,
                }}
              >
                รหัสสมาชิก: {memberData.memberCode || "ไม่ระบุ"}
              </Text>
            </span>
            {memberData.sizeCode && (
              <Text
                style={{
                  color: "#007AFF",
                  fontSize: 14,
                  fontWeight: 600,
                  display: "block",
                }}
              >
                ขนาดที่เลือก: {memberData.sizeCode}
              </Text>
            )}
          </div>
        </div>

        {/* Status - Enhanced */}
        <div
          style={{
            textAlign: "center",
            paddingBottom: 20,
            borderTop: "1px solid rgba(0, 122, 255, 0.1)",
            marginTop: 16,
            paddingTop: 20,
          }}
        >
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
        {/* แจ้งเตือนตัดรอบ */}
        <Alert
          type="warning"
          showIcon={false}
          style={{
            marginTop: "16px",
            marginBottom: "16px",
            borderRadius: "12px",
            border: "1px solid #FFD700",
            background: "linear-gradient(135deg, #FFF8DC 0%, #FFFACD 100%)",
            boxShadow: "0 2px 8px rgba(255, 215, 0, 0.2)",
          }}
          message={
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <div    style={{
                    // backgroundColor: "rgba(255, 136, 0, 0.1)",
                    // padding: "12px",
                    // borderRadius: "8px",
                    // border: "1px solid rgba(255, 136, 0, 0.3)",
                    textAlign: "center",
                  }}>
                  <Text strong style={{ fontSize: "14px", display: "block" }}>
                    📅 จองได้ตั้งแต่วันนี้ - 15 ตุลาคม 2568
                  </Text>
                  <Text style={{ color: "#666", fontSize: "12px" }}>
                    จะได้รับเสื้อประมาณต้นเดือน ธันวาคม 2568
                  </Text>
                </div>
              </Col>
              <Col xs={24} lg={12}>
                <div
                  style={{
                    backgroundColor: "rgba(255, 136, 0, 0.1)",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 136, 0, 0.3)",
                    textAlign: "center",
                  }}
                >
                  <Text
                    strong
                    style={{
                      color: "#d46b08",
                      fontSize: "14px",
                      display: "block",
                    }}
                  >
                    🏢 หากไม่มั่นใจขนาดเสื้อ
                  </Text>
                  <Text style={{ color: "#d46b08", fontSize: "12px" }}>
                    ทดสอบขนาดเสื้อตัวอย่างได้ที่สำนักงาน สอ.มก
                  </Text>
                </div>
              </Col>
            </Row>
          }
        />
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
        <div style={{ textAlign: "center" }}>
          <Title level={4} style={{ color: "#1d1d1f", marginBottom: 8 }}>
            เลือกขนาดเสื้อแจ็คเก็ต
          </Title>

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
                    รอบอก: {selectedSizeInfo.chestInch} นิ้ว | ความยาว:{" "}
                    {selectedSizeInfo.lengthInch} นิ้ว
                  </Text>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Size Selection */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "16px",
            padding: "16px",
            marginBottom: "24px",
            backdropFilter: "blur(10px)",
          }}
        >
          <Row gutter={[12, 12]}>
            {SIZE_OPTIONS.map((option) => (
              <Col xs={12} sm={8} md={6} key={option.size}>
                <div
                  onClick={() => handleSizeSelect(option.size)}
                  style={{
                    width: "100%",
                    height: "80px",
                    borderRadius: "12px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    background:
                      selectedSize === option.size
                        ? "linear-gradient(135deg, #007AFF, #5856D6)"
                        : "#ffffff",
                    border:
                      selectedSize === option.size
                        ? "2px solid #007AFF"
                        : "2px solid #f0f0f0",
                    boxShadow:
                      selectedSize === option.size
                        ? "0 8px 16px rgba(0, 122, 255, 0.3)"
                        : "0 2px 8px rgba(0, 0, 0, 0.1)",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedSize !== option.size) {
                      e.currentTarget.style.borderColor = "#1890ff";
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(24, 144, 255, 0.2)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedSize !== option.size) {
                      e.currentTarget.style.borderColor = "#f0f0f0";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow =
                        "0 2px 8px rgba(0, 0, 0, 0.1)";
                    }
                  }}
                >
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: selectedSize === option.size ? "white" : "#1d1d1f",
                      marginBottom: "4px",
                      lineHeight: "1",
                    }}
                  >
                    {option.size}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color:
                        selectedSize === option.size
                          ? "rgba(255,255,255,0.9)"
                          : "#8e8e93",
                      lineHeight: "1.2",
                    }}
                  >
                    อก {option.chestInch}" | ยาว {option.lengthInch}"
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
        {/* <div
          style={{ width: "100%", maxWidth: 700, margin: "0 auto 16px auto" }}
        >
          <Alert
            message="หากไม่มั่นใจขนาดเสื้อหรือไม่มีขนาดที่เหมาะสม"
            description="ทดสอบขนาดเสื้อตัวอย่างได้ที่สำนักงาน สอ.มก"
            type="danger"
            // showIcon={true}
            style={{
              marginTop: "16px",
              marginBottom: "0px",
              borderRadius: "12px",
         
              textAlign: "center",
              fontWeight: 500,
            }}
          />
        </div> */}

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
        {/* <div
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
          <Text style={{ color: "#000", fontSize: 14 }}>
            สามารถเปลี่ยนแปลงขนาดได้ตลอดจนกว่าจะถึงวันสิ้นสุดการจอง
            หรือเปลี่ยนขนาดตอนมารับเสื้อที่หน้างาน
          </Text>
        </div> */}

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
          <Text
            style={{
              color: "#000",
              fontSize: 13,
              // backgroundColor: "#ffffff85",
            }}
          >
            <strong>คำแนะนำ:</strong> ควรเพิ่มขนาดจากที่วัดรอบอกได้ขึ้นอีกประมาณ
            2 นิ้ว เนื่องจากเสื้อแจ็คเก็ตมักสวมทับกับเสื้ออื่น (เช่น วัดได้ 40"
            ให้เลือกขนาดเสื้อ 42" (Size S) แทน)
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
              {/* หลังจากยืนยันแล้ว คุณยังสามารถเปลี่ยนขนาดได้ในภายหลัง */}
              สามารถเปลี่ยนแปลงขนาดได้ถึง 15 ตุลาคม 2568
            </Text>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MemberPortal;
