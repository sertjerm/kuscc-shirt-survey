import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Typography,
  Space,
  Avatar,
  Tag,
  Divider,
  Row,
  Col,
  Badge,
  Modal,
} from "antd";

import {
  UserOutlined,
  LogoutOutlined,
  ShopOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

import demoImg from "../assets/images/demo.png";
import shirtSize from "../assets/images/shirt-size.jpg";

const { Title, Paragraph, Text } = Typography;

const MemberPortal = () => {
  const [selectedSize, setSelectedSize] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Simulated user data - replace with real API call
  const [memberData, setMemberData] = useState({
    memberCode: "123456",
    name: "ทดสอบ ระบบเสื้อ",
    round: "รอบที่ 1/2024",
    status: "ยังไม่ยืนยันขนาด", // 'ยังไม่ยืนยันขนาด', 'ยืนยันขนาดแล้ว', 'รับเสื้อแล้ว'
    selectedSize: null,
  });

  useEffect(() => {
    // Load saved size if exists
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
        // Handle logout logic
        console.log("Logging out...");
      },
    });
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
  };

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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update member data
      setMemberData((prev) => ({
        ...prev,
        selectedSize: selectedSize,
        status: "ยืนยันขนาดแล้ว",
      }));

      Modal.success({
        title: "ยืนยันขนาดสำเร็จ",
        content: `คุณได้เลือกขนาด ${selectedSize} เรียบร้อยแล้ว`,
      });
    } catch (error) {
      Modal.error({
        title: "เกิดข้อผิดพลาด",
        content: "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openSizeGuide = () => {
    // สร้าง modal แสดงวิธีวัดขนาดเสื้อ
    Modal.info({
      title: "วิธีวัดขนาดเสื้อ",
      width: 600,
      content: (
        <div style={{ padding: "20px 0" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <img 
              src={shirtSize}
              alt="วิธีวัดขนาดเสื้อ"
              style={{ 
                width: "100%", 
                maxWidth: "400px", 
                borderRadius: "8px",
                border: "1px solid #dee2e6"
              }}
            />
          </div>
          
          <div style={{ marginBottom: "16px" }}>
            <Text strong style={{ color: "#007AFF" }}>1. วัดรอบอก (Chest):</Text>
            <br />
            <Text>วัดรอบส่วนที่กว้างที่สุดของอก โดยให้เทปวัดผ่านใต้รักแร้</Text>
          </div>
          
          <div style={{ marginBottom: "16px" }}>
            <Text strong style={{ color: "#007AFF" }}>2. วัดความยาวเสื้อ (Length):</Text>
            <br />
            <Text>วัดจากจุดสูงสุดของไหล่ลงมาถึงปลายเสื้อ</Text>
          </div>
          
          <div style={{ 
            background: "rgba(255, 149, 0, 0.08)", 
            border: "1px solid rgba(255, 149, 0, 0.2)",
            borderRadius: "8px", 
            padding: "12px", 
            marginTop: "16px" 
          }}>
            <Text style={{ color: "#FF9500", fontSize: "14px" }}>
              <InfoCircleOutlined style={{ marginRight: "8px" }} />
              <strong>คำแนะนำ:</strong> ให้วัดเสื้อตัวที่พอดีกับตัวคุณเป็นตัวอย่าง หรือวัดรอบตัวโดยตรง
            </Text>
          </div>
        </div>
      ),
      okText: "เข้าใจแล้ว",
      okButtonProps: {
        style: {
          background: "linear-gradient(135deg, #007AFF, #5856D6)",
          border: "none",
          borderRadius: "8px"
        }
      }
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

  const sizeOptions = [
    { size: "XS", chest: "32", length: "24" },
    { size: "S", chest: "34", length: "26" },
    { size: "M", chest: "36", length: "28" },
    { size: "L", chest: "38", length: "30" },
    { size: "XL", chest: "40", length: "32" },
    { size: "2XL", chest: "42", length: "34" },
    { size: "3XL", chest: "44", length: "36" },
    { size: "4XL", chest: "46", length: "38" },
    { size: "5XL", chest: "48", length: "40" },
    { size: "6XL", chest: "50", length: "42" },
  ];

  const selectedSizeInfo = sizeOptions.find(
    (option) => option.size === selectedSize
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #007AFF 0%, #5856D6 25%, #5AC8FA 50%, #32D74B 75%, #007AFF 100%)",
        backgroundSize: "400% 400%",
        padding: "16px",
      }}
    >
      {/* Header Card */}
      <Card
        style={{
          maxWidth: 700,
          margin: "0 auto 16px",
          borderRadius: "20px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Space size="middle">
            <Avatar
              size={48}
              icon={<UserOutlined />}
              style={{
                background: "linear-gradient(135deg, #32D74B, #30B84E)",
                border: "2px solid rgba(255, 255, 255, 0.3)",
              }}
            />
            <div>
              <Title level={4} style={{ margin: 0, color: "#1d1d1f" }}>
                {memberData.name}
              </Title>
              <Text style={{ color: "#48484a" }}>
                รหัสสมาชิก: {memberData.memberCode} | {memberData.round}
              </Text>
            </div>
          </Space>

          <Button
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{
              color: "#48484a",
              border: "none",
              background: "rgba(0, 0, 0, 0.05)",
              borderRadius: "12px",
            }}
          >
            ออกจากระบบ
          </Button>
        </div>

        {/* Status */}
        <div style={{ marginTop: "16px", textAlign: "center" }}>
          <Tag
            color={getStatusColor(memberData.status)}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: "14px",
              border: "none",
            }}
          >
            สถานะ: {memberData.status}
          </Tag>
        </div>
      </Card>

      {/* Main Content Card */}
      <Card
        style={{
          maxWidth: 700,
          margin: "0 auto",
          borderRadius: "24px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.1)",
        }}
        bodyStyle={{
          padding: "24px",
        }}
        className="main-content-card"
      >
        {/* Title Section */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          {/* <div
            style={{
              width: "80px",
              height: "80px",
              background: "linear-gradient(135deg, #32D74B, #30B84E)",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              boxShadow: "0 12px 24px rgba(50, 215, 75, 0.3)",
            }}
          >
            <ShopOutlined style={{ fontSize: "40px", color: "white" }} />
          </div> */}

          <Title level={2} style={{ color: "#1d1d1f", marginBottom: "8px" }}>
            เลือกขนาดเสื้อแจ็คเก็ต
          </Title>

          <Paragraph
            style={{ color: "#48484a", marginBottom: "24px", fontSize: "16px" }}
          >
            กรุณาเลือกขนาดเสื้อที่เหมาะสมกับคุณ
          </Paragraph>

          {/* Size Guide Button */}
          <Button
            type="primary"
            ghost
            icon={<InfoCircleOutlined />}
            onClick={openSizeGuide}
            style={{
              borderRadius: "12px",
              height: "44px",
              marginBottom: "16px",
              borderColor: "#007AFF",
              color: "#007AFF",
              fontWeight: "500"
            }}
          >
            วิธีวัดขนาดเสื้อ
          </Button>
        </div>

        {/* Shirt Demo Image */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "24px",
            padding: "0px",
            background: "linear-gradient(135deg, #f8f9fa, #e9ecef)",
            borderRadius: "16px",
            border: "2px solid rgba(0, 122, 255, 0.1)",
            overflow: "hidden"
          }}
        >
          <div style={{ position: "relative", display: "block", padding: "16px" }}>
            <img
              src={demoImg}
              alt="ตัวอย่างเสื้อแจ็คเก็ต"
              style={{
                width: "100%",
                height: "auto",
                marginBottom: "16px",
                borderRadius: "12px",
                boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
                border: "4px solid white"
              }}
            />
            <div style={{
              position: "absolute",
              top: "24px",
              right: "24px",
              background: "linear-gradient(135deg, #32D74B, #30B84E)",
              color: "white",
              padding: "6px 12px",
              borderRadius: "16px",
              fontSize: "13px",
              fontWeight: "700",
              boxShadow: "0 4px 12px rgba(50, 215, 75, 0.3)"
            }}>
              NEW
            </div>
          </div>
          <div style={{ padding: "0 16px 16px 16px" }}>
            <Text strong style={{ color: "#1d1d1f", fontSize: "18px" }}>
              เสื้อแจ็คเก็ตสหกรณ์
            </Text>
            <br />
            <Text style={{ color: "#6c757d", fontSize: "15px" }}>
              คุณภาพพรีเมียม • ใส่สบาย • ทนทาน
            </Text>
          </div>
        </div>

        {/* Selected Size Display */}
        {selectedSize && (
          <div
            style={{
              textAlign: "center",
              marginBottom: "24px",
              padding: "16px",
              background:
                "linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(0, 122, 255, 0.05))",
              borderRadius: "12px",
              border: "1px solid rgba(0, 122, 255, 0.2)",
            }}
          >
            <CheckCircleOutlined
              style={{
                color: "#007AFF",
                fontSize: "24px",
                marginBottom: "8px",
              }}
            />
            <div>
              <Text strong style={{ fontSize: "18px", color: "#007AFF" }}>
                ขนาดที่เลือก: {selectedSize}
              </Text>
              {selectedSizeInfo && (
                <div style={{ marginTop: "8px" }}>
                  <Text style={{ color: "#48484a" }}>
                    รอบอก: {selectedSizeInfo.chest}" | ความยาว:{" "}
                    {selectedSizeInfo.length}"
                  </Text>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Size Selection */}
        <div style={{ marginBottom: "32px" }}>
          <Title
            level={4}
            style={{
              textAlign: "center",
              marginBottom: "24px",
              color: "#1d1d1f",
            }}
          >
            เลือกขนาดเสื้อ
          </Title>

          <Row gutter={[12, 12]}>
            {sizeOptions.map((option) => (
              <Col xs={12} sm={8} md={6} key={option.size}>
                <Button
                  size="large"
                  onClick={() => handleSizeSelect(option.size)}
                  style={{
                    width: "100%",
                    height: "80px",
                    borderRadius: "12px",
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
                      fontSize: "16px",
                      color: selectedSize === option.size ? "white" : "#1d1d1f",
                      marginBottom: "4px",
                    }}
                  >
                    {option.size}
                  </Text>
                  <Text
                    style={{
                      fontSize: "12px",
                      color:
                        selectedSize === option.size
                          ? "rgba(255,255,255,1)"
                          : "#8e8e93",
                    }}
                  >
                    {option.chest}" × {option.length}"
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
              height: "50px",
              borderRadius: "25px",
              paddingInline: "40px",
              fontSize: "16px",
              fontWeight: "600",
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

        {/* Info Note */}
        <div
          style={{
            background: "rgba(255, 149, 0, 0.08)",
            border: "1px solid rgba(255, 149, 0, 0.2)",
            borderRadius: "12px",
            padding: "16px",
            marginTop: "24px",
            textAlign: "center",
          }}
        >
          <InfoCircleOutlined
            style={{ color: "#FF9500", marginRight: "8px" }}
          />
          <Text style={{ color: "#FF9500", fontSize: "14px" }}>
            คุณสามารถเปลี่ยนแปลงขนาดได้ตลอดเวลา หรือเปลี่ยนขนาดตอนมารับเสื้อที่หน้างาน
          </Text>
        </div>

        {/* Additional Info */}
        <div
          style={{
            background: "rgba(0, 122, 255, 0.05)",
            border: "1px solid rgba(0, 122, 255, 0.1)",
            borderRadius: "12px",
            padding: "16px",
            marginTop: "16px",
            textAlign: "center",
          }}
        >
          <Text style={{ color: "#007AFF", fontSize: "13px" }}>
            <strong>เคล็ดลับ:</strong> หากไม่แน่ใจในขนาด แนะนำให้เลือกขนาดที่ใหญ่กว่าเล็กน้อย เพื่อความสบายในการสวมใส่
          </Text>
        </div>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        title={
          <div style={{ textAlign: "center" }}>
            <ExclamationCircleOutlined
              style={{ color: "#FF9500", fontSize: "24px", marginRight: "8px" }}
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
            borderRadius: "8px",
          },
        }}
      >
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Text style={{ fontSize: "16px" }}>
            คุณต้องการยืนยันการเลือกขนาด{" "}
            <Text strong style={{ color: "#007AFF" }}>
              {selectedSize}
            </Text>{" "}
            หรือไม่?
          </Text>
          {selectedSizeInfo && (
            <div style={{ marginTop: "12px" }}>
              <Text style={{ color: "#48484a" }}>
                รอบอก: {selectedSizeInfo.chest} นิ้ว | ความยาว:{" "}
                {selectedSizeInfo.length} นิ้ว
              </Text>
            </div>
          )}
          <div style={{ marginTop: "16px" }}>
            <Text style={{ color: "#8e8e93", fontSize: "14px" }}>
              หลังจากยืนยันแล้ว คุณยังสามารถเปลี่ยนขนาดได้ในภายหลัง
            </Text>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MemberPortal;