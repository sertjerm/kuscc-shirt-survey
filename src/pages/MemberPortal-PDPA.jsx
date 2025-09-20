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
  Slider,
} from "antd";

import {
  UserOutlined,
  LogoutOutlined,
  ShopOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CalculatorOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";

import shirtSize from "../assets/images/shirt-size.jpg";
const demoImg = "https://apps2.coop.ku.ac.th/asset/images/png/bluejacket5.png";

const { Title, Paragraph, Text } = Typography;

const MemberPortal = () => {
  const [selectedSize, setSelectedSize] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [height, setHeight] = useState(140);
  const [weight, setWeight] = useState(40);
  const [hasUserInput, setHasUserInput] = useState(false);
  const [recommendedSize, setRecommendedSize] = useState(null);
  const [showPDPAModal, setShowPDPAModal] = useState(false);
  const [pdpaAccepted, setPDPAAccepted] = useState(false);

  const [memberData, setMemberData] = useState({
    memberCode: "123456",
    name: "ทดสอบ ระบบเสื้อ",
    round: "รอบที่ 1/2024",
    status: "ยังไม่ยืนยันขนาด",
    selectedSize: null,
  });

  const sizeOptions = [
    { size: "XS", chest: "32", length: "24", heightRange: [150, 165], weightRange: [40, 55] },
    { size: "S", chest: "34", length: "26", heightRange: [160, 170], weightRange: [50, 65] },
    { size: "M", chest: "36", length: "28", heightRange: [165, 175], weightRange: [60, 75] },
    { size: "L", chest: "38", length: "30", heightRange: [170, 180], weightRange: [70, 85] },
    { size: "XL", chest: "40", length: "32", heightRange: [175, 185], weightRange: [80, 95] },
    { size: "2XL", chest: "42", length: "34", heightRange: [180, 190], weightRange: [90, 110] },
    { size: "3XL", chest: "44", length: "36", heightRange: [180, 195], weightRange: [105, 125] },
    { size: "4XL", chest: "46", length: "38", heightRange: [185, 200], weightRange: [120, 140] },
    { size: "5XL", chest: "48", length: "40", heightRange: [185, 200], weightRange: [135, 160] },
    { size: "6XL", chest: "50", length: "42", heightRange: [185, 200], weightRange: [155, 180] },
  ];

  useEffect(() => {
    loadSavedData();
  }, []);

  useEffect(() => {
    if (memberData.selectedSize) {
      setSelectedSize(memberData.selectedSize);
    }
  }, [memberData.selectedSize]);

  useEffect(() => {
    if (hasUserInput) {
      const recommended = calculateRecommendedSize(height, weight);
      setRecommendedSize(recommended);
      
      if (!selectedSize || selectedSize === recommendedSize) {
        setSelectedSize(recommended);
      }
    } else {
      setRecommendedSize(null);
      setSelectedSize(null);
    }
  }, [height, weight, hasUserInput]);

  const loadSavedData = () => {
    try {
      const savedData = JSON.parse(localStorage.getItem(`memberData_${memberData.memberCode}`) || '{}');
      const savedPDPA = localStorage.getItem(`pdpa_${memberData.memberCode}`) === 'true';
      
      if (savedPDPA && savedData.height && savedData.weight) {
        setHeight(savedData.height);
        setWeight(savedData.weight);
        setHasUserInput(true);
        setPDPAAccepted(true);
        
        if (savedData.selectedSize) {
          setSelectedSize(savedData.selectedSize);
        }
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  const saveUserData = () => {
    if (pdpaAccepted) {
      try {
        const dataToSave = {
          height,
          weight,
          selectedSize,
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(`memberData_${memberData.memberCode}`, JSON.stringify(dataToSave));
        localStorage.setItem(`pdpa_${memberData.memberCode}`, 'true');
      } catch (error) {
        console.error('Error saving data:', error);
      }
    }
  };

  const handlePDPAAccept = () => {
    setPDPAAccepted(true);
    setShowPDPAModal(false);
    saveUserData();
  };

  const handlePDPADecline = () => {
    setShowPDPAModal(false);
  };

  const calculateRecommendedSize = (height, weight) => {
    const BMI = weight / ((height / 100) ** 2);
    
    let bestSize = "M";
    let bestScore = -1;
    
    for (let option of sizeOptions) {
      const [minHeight, maxHeight] = option.heightRange;
      const [minWeight, maxWeight] = option.weightRange;
      
      let score = 0;
      
      if (height >= minHeight && height <= maxHeight) {
        const heightCenter = (minHeight + maxHeight) / 2;
        const heightRange = maxHeight - minHeight;
        const heightDistance = Math.abs(height - heightCenter) / heightRange;
        score += 50 * (1 - heightDistance);
      } else {
        const heightCenter = (minHeight + maxHeight) / 2;
        const distance = Math.abs(height - heightCenter);
        score += Math.max(0, 25 - distance * 2);
      }
      
      if (weight >= minWeight && weight <= maxWeight) {
        const weightCenter = (minWeight + maxWeight) / 2;
        const weightRange = maxWeight - minWeight;
        const weightDistance = Math.abs(weight - weightCenter) / weightRange;
        score += 50 * (1 - weightDistance);
      } else {
        const weightCenter = (minWeight + maxWeight) / 2;
        const distance = Math.abs(weight - weightCenter);
        score += Math.max(0, 25 - distance * 0.5);
      }
      
      if (height >= minHeight && height <= maxHeight && 
          weight >= minWeight && weight <= maxWeight) {
        score += 30;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestSize = option.size;
      }
    }
    
    if (bestScore < 20) {
      if (BMI < 18.5) return "XS";
      else if (BMI < 21) return "S";
      else if (BMI < 24) return "M";
      else if (BMI < 27) return "L";
      else if (BMI < 30) return "XL";
      else if (BMI < 33) return "2XL";
      else if (BMI < 36) return "3XL";
      else if (BMI < 39) return "4XL";
      else if (BMI < 42) return "5XL";
      else return "6XL";
    }
    
    return bestSize;
  };

  const handleHeightChange = (value) => {
    setHeight(value);
    setHasUserInput(true);
  };

  const handleWeightChange = (value) => {
    setWeight(value);
    setHasUserInput(true);
  };

  const handleSelectRecommended = () => {
    setSelectedSize(recommendedSize);
  };

  const handleLogout = () => {
    Modal.confirm({
      title: "ออกจากระบบ",
      content: "คุณต้องการออกจากระบบหรือไม่?",
      okText: "ออกจากระบบ",
      cancelText: "ยกเลิก",
      okType: "danger",
      onOk: () => {
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
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setMemberData((prev) => ({
        ...prev,
        selectedSize: selectedSize,
        status: "ยืนยันขนาดแล้ว",
      }));

      if (!pdpaAccepted && hasUserInput) {
        setShowPDPAModal(true);
      } else {
        saveUserData();
      }

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
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Title level={2} style={{ color: "#1d1d1f", marginBottom: "8px" }}>
            เลือกขนาดเสื้อแจ็คเก็ต
          </Title>

          <Paragraph
            style={{ color: "#48484a", marginBottom: "24px", fontSize: "16px" }}
          >
            กรุณาเลือกขนาดเสื้อที่เหมาะสมกับคุณ
          </Paragraph>

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

        <div
          style={{
            background: "rgba(50, 215, 75, 0.08)",
            border: "1px solid rgba(50, 215, 75, 0.2)",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "24px",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <CalculatorOutlined
              style={{
                color: "#32D74B",
                fontSize: "24px",
                marginRight: "8px",
              }}
            />
            <Title level={4} style={{ display: "inline", color: "#32D74B", margin: 0 }}>
              คำนวณขนาดแนะนำ
            </Title>
          </div>

          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: "16px" }}>
                <Text strong style={{ color: "#1d1d1f", marginBottom: "8px", display: "block" }}>
                  ส่วนสูง: {hasUserInput ? `${height} ซม.` : "กรุณาเลือก"}
                </Text>
                <Slider
                  min={140}
                  max={200}
                  value={height}
                  onChange={handleHeightChange}
                  marks={{
                    140: "140",
                    160: "160",
                    180: "180",
                    200: "200",
                  }}
                  style={{
                    marginBottom: "4px",
                  }}
                  trackStyle={{ background: "linear-gradient(135deg, #32D74B, #30B84E)" }}
                  handleStyle={{
                    borderColor: "#32D74B",
                    backgroundColor: "#32D74B",
                    boxShadow: "0 2px 8px rgba(50, 215, 75, 0.3)",
                  }}
                />
              </div>
            </Col>
            
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: "16px" }}>
                <Text strong style={{ color: "#1d1d1f", marginBottom: "8px", display: "block" }}>
                  น้ำหนัก: {hasUserInput ? `${weight} กก.` : "กรุณาเลือก"}
                </Text>
                <Slider
                  min={40}
                  max={180}
                  value={weight}
                  onChange={handleWeightChange}
                  marks={{
                    40: "40",
                    80: "80",
                    120: "120",
                    180: "180",
                  }}
                  style={{
                    marginBottom: "4px",
                  }}
                  trackStyle={{ background: "linear-gradient(135deg, #32D74B, #30B84E)" }}
                  handleStyle={{
                    borderColor: "#32D74B",
                    backgroundColor: "#32D74B",
                    boxShadow: "0 2px 8px rgba(50, 215, 75, 0.3)",
                  }}
                />
              </div>
            </Col>
          </Row>

          {recommendedSize && hasUserInput && (
            <div
              style={{
                textAlign: "center",
                marginTop: "16px",
                padding: "12px",
                background: "rgba(255, 255, 255, 0.8)",
                borderRadius: "12px",
                border: "1px solid rgba(50, 215, 75, 0.3)",
              }}
            >
              <Text style={{ color: "#32D74B", fontSize: "16px" }}>
                <strong>ขนาดที่แนะนำ: {recommendedSize}</strong>
              </Text>
              <br />
              {sizeOptions.find(opt => opt.size === recommendedSize) && (
                <Text style={{ color: "#48484a", fontSize: "14px" }}>
                  รอบอก: {sizeOptions.find(opt => opt.size === recommendedSize).chest}" | 
                  ความยาว: {sizeOptions.find(opt => opt.size === recommendedSize).length}"
                </Text>
              )}
              <br />
              <Button
                type="link"
                icon={<UserSwitchOutlined />}
                onClick={handleSelectRecommended}
                style={{
                  color: "#32D74B",
                  fontWeight: "500",
                  marginTop: "8px",
                  padding: "0",
                  height: "auto",
                  display: selectedSize === recommendedSize ? "none" : "inline-block",
                }}
              >
                เลือกขนาดนี้
              </Button>
            </div>
          )}

          {!hasUserInput && (
            <div
              style={{
                textAlign: "center",
                marginTop: "16px",
                padding: "16px",
                background: "rgba(0, 122, 255, 0.05)",
                borderRadius: "12px",
                border: "1px solid rgba(0, 122, 255, 0.1)",
              }}
            >
              <Text style={{ color: "#007AFF", fontSize: "15px" }}>
                <InfoCircleOutlined style={{ marginRight: "8px" }} />
                กรุณาปรับส่วนสูงและน้ำหนักเพื่อรับคำแนะนำขนาดเสื้อ
              </Text>
            </div>
          )}
        </div>

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
              {recommendedSize && selectedSize === recommendedSize && (
                <div style={{ marginTop: "4px" }}>
                  <Tag color="#32D74B" style={{ fontSize: "12px" }}>
                    ✓ ขนาดแนะนำ
                  </Tag>
                </div>
              )}
            </div>
          </div>
        )}

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
                        : recommendedSize === option.size && selectedSize !== option.size
                        ? "2px solid #FF9500"
                        : "2px solid #f0f0f0",
                    boxShadow:
                      selectedSize === option.size
                        ? "0 8px 16px rgba(0, 122, 255, 0.3)"
                        : recommendedSize === option.size && selectedSize !== option.size
                        ? "0 4px 12px rgba(255, 149, 0, 0.2)"
                        : "0 2px 8px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.3s ease",
                    position: "relative",
                  }}
                >
                  {recommendedSize === option.size && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                        background: selectedSize === option.size ? "#32D74B" : "#FF9500",
                        color: "white",
                        borderRadius: "50%",
                        width: "24px",
                        height: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "bold",
                        boxShadow: selectedSize === option.size 
                          ? "0 2px 8px rgba(50, 215, 75, 0.3)"
                          : "0 2px 8px rgba(255, 149, 0, 0.3)",
                      }}
                    >
                      ★
                    </div>
                  )}
                  <Text
                    strong
                    style={{
                      fontSize: "16px",
                      color: selectedSize === option.size ? "white" : "#1d1d1f",
                      marginBottom: "4px",
                      ...(selectedSize === option.size && {
                        color: "white",
                        WebkitTextFillColor: "white",
                        textShadow: "none",
                      }),
                    }}
                  >
                    {option.size}
                  </Text>
                  <Text
                    style={{
                      fontSize: "12px",
                      color: selectedSize === option.size
                        ? "rgba(255,255,255,0.9)"
                        : "#8e8e93",
                      ...(selectedSize === option.size && {
                        color: "rgba(255,255,255,0.9)",
                        WebkitTextFillColor: "rgba(255,255,255,0.9)",
                        textShadow: "none",
                      }),
                    }}
                  >
                    {option.chest}" × {option.length}"
                  </Text>
                </Button>
              </Col>
            ))}
          </Row>
        </div>

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

          {selectedSize !== recommendedSize && (
            <div style={{
              marginTop: "16px",
              padding: "12px",
              background: "rgba(255, 149, 0, 0.08)",
              border: "1px solid rgba(255, 149, 0, 0.2)",
              borderRadius: "8px",
            }}>
              <div style={{ marginBottom: "8px" }}>
                <Text style={{ color: "#FF9500", fontSize: "14px" }}>
                  ⚠️ <strong>ขนาดไม่ตรงกับที่แนะนำ</strong>
                </Text>
              </div>
              <Text style={{ color: "#FF9500", fontSize: "13px" }}>
                ระบบแนะนำขนาด <strong>{recommendedSize}</strong> จากข้อมูลส่วนสูง {height} ซม. และน้ำหนัก {weight} กก.
              </Text>
            </div>
          )}

          {selectedSize === recommendedSize && (
            <div style={{
              marginTop: "16px",
              padding: "12px",
              background: "rgba(50, 215, 75, 0.08)",
              border: "1px solid rgba(50, 215, 75, 0.2)",
              borderRadius: "8px",
            }}>
              <Text style={{ color: "#32D74B", fontSize: "14px" }}>
                ✅ <strong>ขนาดตรงกับที่แนะนำ</strong>
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

      <Modal
        title={
          <div style={{ textAlign: "center" }}>
            <InfoCircleOutlined
              style={{ color: "#007AFF", fontSize: "24px", marginRight: "8px" }}
            />
            การเก็บรักษาข้อมูลส่วนบุคคล
          </div>
        }
        open={showPDPAModal}
        onOk={handlePDPAAccept}
        onCancel={handlePDPADecline}
        okText="ยอมรับ"
        cancelText="ไม่ยอมรับ"
        centered
        closable={false}
        maskClosable={false}
        okButtonProps={{
          style: {
            background: "linear-gradient(135deg, #007AFF, #5856D6)",
            border: "none",
            borderRadius: "8px",
          },
        }}
      >
        <div style={{ padding: "20px 0" }}>
          <div style={{ marginBottom: "20px" }}>
            <Text style={{ fontSize: "16px", lineHeight: "1.6" }}>
              เพื่อความสะดวกในการใช้งานครั้งต่อไป เราต้องการบันทึกข้อมูลดังต่อไปนี้:
            </Text>
          </div>

          <div style={{ 
            background: "rgba(0, 122, 255, 0.05)", 
            borderRadius: "8px", 
            padding: "16px", 
            marginBottom: "20px" 
          }}>
            <ul style={{ margin: 0, paddingLeft: "20px" }}>
              <li>ข้อมูลส่วนสูง ({height} ซม.)</li>
              <li>ข้อมูลน้ำหนัก ({weight} กก.)</li>
              <li>ขนาดเสื้อที่เลือก ({selectedSize})</li>
            </ul>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <Text style={{ fontSize: "14px", color: "#666", lineHeight: "1.5" }}>
              <strong>วัตถุประสงค์:</strong> เพื่อให้คุณไม่ต้องกรอกข้อมูลซ้ำในครั้งต่อไป
            </Text>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <Text style={{ fontSize: "14px", color: "#666", lineHeight: "1.5" }}>
              <strong>การเก็บรักษา:</strong> ข้อมูลจะถูกเก็บไว้ในเครื่องของคุณเท่านั้น
            </Text>
          </div>

          <div style={{
            background: "rgba(255, 149, 0, 0.08)",
            border: "1px solid rgba(255, 149, 0, 0.2)",
            borderRadius: "8px",
            padding: "12px",
          }}>
            <Text style={{ fontSize: "13px", color: "#FF9500" }}>
              หากไม่ยอมรับ คุณยังสามารถใช้งานได้ปกติ แต่จะต้องกรอกข้อมูลใหม่ทุกครั้ง
            </Text>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MemberPortal;