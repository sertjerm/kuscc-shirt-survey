// src/pages/MemberPortal.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useAppContext } from "../App";
import {
  Card,
  Button,
  Typography,
  Avatar,
  Tag,
  Modal,
  Slider,
  Row,
  Col,
} from "antd";

import {
  LogoutOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CalculatorOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";

// วิธีวัดขนาด (ภาพ)
import shirtSize from "../assets/images/shirt-size.jpg";
const demoImg = "https://apps2.coop.ku.ac.th/asset/images/png/bluejacket6.png";

// ✅ ใช้ค่าคงที่จาก src/utils/shirt-size.js
import { shirtSizes } from "../utils/shirt-size";

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
      heightRange: [
        s.recommendation?.height?.min ?? 0,
        s.recommendation?.height?.max ?? 999,
      ],
      weightRange: [
        s.recommendation?.weight?.min ?? 0,
        s.recommendation?.weight?.max ?? 999,
      ],
      bmiRange: [
        s.recommendation?.bmi?.min ?? 0,
        s.recommendation?.bmi?.max ?? 999,
      ],
    }));

/** คะแนนความเหมาะสม (เชิงเส้นง่าย ๆ) */
function scoreByRange(value, [min, max], maxScore, fallbackPenaltyPerUnit = 1) {
  if (value >= min && value <= max) {
    const center = (min + max) / 2;
    const span = Math.max(max - min, 1);
    const dist = Math.abs(value - center) / span; // 0..1
    return maxScore * (1 - dist);
  }
  // นอกช่วง: ตัดคะแนนตามระยะห่าง
  const center = (min + max) / 2;
  const dist = Math.abs(value - center);
  return Math.max(0, maxScore / 2 - dist * fallbackPenaltyPerUnit);
}

const MemberPortal = () => {
  // --- State หลัก ---
  const [selectedSize, setSelectedSize] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [height, setHeight] = useState(140); // ค่าเริ่มต้น min
  const [weight, setWeight] = useState(40); // ค่าเริ่มต้น min
  const [hasUserInput, setHasUserInput] = useState(false);
  const [recommendedSize, setRecommendedSize] = useState(null);

  // --- Context user ---
  const { user } = useAppContext();
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
        // TODO: logout logic
        console.log("Logging out...");
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
      // TODO: call API บันทึกขนาดจริง
      await new Promise((resolve) => setTimeout(resolve, 600));
      setMemberData((prev) => ({
        ...prev,
        selectedSize,
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
                border: "1px solid #dee2e6",
              }}
            />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <Text strong style={{ color: "#007AFF" }}>
              1. วัดรอบอก (Chest):
            </Text>
            <br />
            <Text>วัดรอบส่วนที่กว้างที่สุดของอก โดยให้เทปวัดผ่านใต้รักแร้</Text>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <Text strong style={{ color: "#007AFF" }}>
              2. วัดความยาวเสื้อ (Length):
            </Text>
            <br />
            <Text>วัดจากจุดสูงสุดของไหล่ลงมาถึงปลายเสื้อ</Text>
          </div>
          <div
            style={{
              background: "rgba(255, 149, 0, 0.08)",
              border: "1px solid rgba(255, 149, 0, 0.2)",
              borderRadius: "8px",
              padding: "12px",
              marginTop: "16px",
            }}
          >
            <Text style={{ color: "#FF9500", fontSize: "14px" }}>
              <InfoCircleOutlined style={{ marginRight: "8px" }} />
              <strong>คำแนะนำ:</strong>{" "}
              ให้วัดเสื้อตัวที่พอดีกับตัวคุณเป็นตัวอย่าง หรือวัดรอบตัวโดยตรง
            </Text>
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

  // --- คำนวณแนะนำขนาดจาก SIZE_OPTIONS (height/weight/BMI + โบนัสเมื่ออยู่ในช่วง) ---
  /**
   * คำนวณแนะนำขนาดเสื้อ (ใหม่):
   * - ใช้ height, weight, measuredChestInch, SIZE_OPTIONS
   * - ให้คะแนนแต่ละไซส์: คะแนนอก (measuredChestInch), คะแนน H/W/BMI, โบนัส
   * - คืนค่า size ที่ได้คะแนนรวมสูงสุด
   */
  const calculateRecommendedSize = (h, w, measuredChestInch, SIZE_OPTIONS) => {
    if (!SIZE_OPTIONS.length) return "M";
    const bmi = w / (h / 100) ** 2;

    let best = SIZE_OPTIONS[0]?.size ?? "M";
    let bestScore = -1;

    for (const opt of SIZE_OPTIONS) {
      // คะแนนอก: 50 คะแนนเต็ม (อกที่วัดได้ควรอยู่ในช่วง +/-2 นิ้วจากไซส์นี้)
      let chestScore = 0;
      if (measuredChestInch && opt.chestInch) {
        const chest = parseFloat(opt.chestInch);
        const diff = Math.abs(measuredChestInch - chest);
        if (diff <= 2) chestScore = 50 - diff * 10; // 0-2 นิ้ว: 50→30 คะแนน
        else if (diff <= 4)
          chestScore = 30 - (diff - 2) * 10; // 2-4 นิ้ว: 30→10 คะแนน
        else chestScore = 0;
      }

      // คะแนน H/W/BMI: 40 คะแนนเต็ม (เหมือนสูตรเดิม)
      const s1 = scoreByRange(h, opt.heightRange, 15, 2); // สูงสุด 15
      const s2 = scoreByRange(w, opt.weightRange, 15, 0.7); // สูงสุด 15
      const s3 = scoreByRange(bmi, opt.bmiRange, 10, 1); // สูงสุด 10
      let hwbmiScore = s1 + s2 + s3; // 0-40

      // โบนัส: 10 คะแนน ถ้าอกที่วัดได้อยู่ในช่วง +/-1 นิ้วของไซส์นี้
      let bonus = 0;
      if (measuredChestInch && opt.chestInch) {
        const chest = parseFloat(opt.chestInch);
        if (Math.abs(measuredChestInch - chest) <= 1) bonus = 10;
      }

      let score = chestScore + hwbmiScore + bonus; // คะแนนรวมสูงสุด 100

      if (score > bestScore) {
        bestScore = score;
        best = opt.size;
      }
    }

    // กันกรณี extreme: ใช้ BMI ช่วย (เหมือนเดิม)
    if (bestScore < 25) {
      if (bmi < 18.5) return "XS";
      if (bmi < 21) return "S";
      if (bmi < 24) return "M";
      if (bmi < 27) return "L";
      if (bmi < 30) return "XL";
      if (bmi < 33) return "2XL";
      if (bmi < 36) return "3XL";
      if (bmi < 39) return "4XL";
      if (bmi < 42) return "5XL";
      return "6XL";
    }

    return best;
  };

  // --- ทำงานเมื่อมีการปรับส่วนสูง/น้ำหนักด้วยมือ ---
  useEffect(() => {
    if (!hasUserInput) {
      setRecommendedSize(null);
      // ไม่ auto select ถ้ายังไม่ได้ขยับ slider
      return;
    }
    // measuredChestInch: สมมุติให้รับค่าจาก memberData.measuredChestInch (หรือ 0 ถ้าไม่มี)
    const measuredChestInch = memberData.measuredChestInch
      ? parseFloat(memberData.measuredChestInch)
      : 0;
    const rec = calculateRecommendedSize(
      height,
      weight,
      measuredChestInch,
      SIZE_OPTIONS
    );
    setRecommendedSize(rec);
    // auto select เมื่อยังไม่เคยเลือก หรือเลือกตรงกับ rec อยู่แล้ว
    setSelectedSize((prev) => (!prev || prev === rec ? rec : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    height,
    weight,
    hasUserInput,
    memberData.measuredChestInch,
    SIZE_OPTIONS,
  ]);

  const handleHeightChange = (v) => {
    setHeight(v);
    setHasUserInput(true);
  };

  const handleWeightChange = (v) => {
    setWeight(v);
    setHasUserInput(true);
  };

  const handleSelectRecommended = () => {
    if (recommendedSize) setSelectedSize(recommendedSize);
  };

  const selectedSizeInfo = SIZE_OPTIONS.find((o) => o.size === selectedSize);

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
      {/* Header */}
      <Card
        style={{
          maxWidth: 700,
          margin: "0 auto 16px",
          borderRadius: "20px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
          position: "relative",
        }}
      >
        <Button
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          type="text"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            color: "#48484a",
            background: "rgba(0,0,0,0.04)",
            borderRadius: "50%",
            width: 40,
            height: 40,
            minWidth: 40,
            minHeight: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
            fontSize: 20,
          }}
          aria-label="logout"
        />
        <div
          className="member-header-responsive"
          style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            paddingRight: 48,
          }}
        >
          <Avatar
            size={48}
            src={`https://apps2.coop.ku.ac.th/asset/member_photo/${memberData.memberCode}.png`}
            style={{
              background: "linear-gradient(135deg, #32D74B, #30B84E)",
              border: "2px solid rgba(255, 255, 255, 0.3)",
              minWidth: 48,
              minHeight: 48,
            }}
            alt="member avatar"
          />
          <div style={{ minWidth: 0 }}>
            <Title
              level={4}
              style={{
                margin: 0,
                color: "#1d1d1f",
                fontSize: 18,
                wordBreak: "break-word",
              }}
            >
              {memberData.name}
            </Title>
            <Text
              style={{
                color: "#48484a",
                fontSize: 14,
                wordBreak: "break-word",
              }}
            >
              รหัสสมาชิก: {memberData.memberCode} | {memberData.round}
            </Text>
          </div>
        </div>

        {/* Status */}
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <Tag
            color={getStatusColor(memberData.status)}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: "14px",
              border: "none",
              display: "inline-block",
              minWidth: 120,
              marginTop: 4,
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
        <div style={{ textAlign: "center", marginBottom: 32 }}>
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
          <div style={{ padding: "0 16px 16px 16px" }}>
            <Text strong style={{ color: "#1d1d1f", fontSize: 18 }}>
              เสื้อแจ็คเก็ตสหกรณ์
            </Text>
            <br />
            <Text style={{ color: "#6c757d", fontSize: 15 }}>
              คุณภาพพรีเมียม • ใส่สบาย • ทนทาน
            </Text>
          </div>
        </div>

        {/* Size Calculator */}
        <div
          style={{
            background: "rgba(50, 215, 75, 0.08)",
            border: "1px solid rgba(50, 215, 75, 0.2)",
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <CalculatorOutlined
              style={{ color: "#32D74B", fontSize: 24, marginRight: 8 }}
            />
            <Title
              level={4}
              style={{ display: "inline", color: "#32D74B", margin: 0 }}
            >
              คำนวณขนาดแนะนำ
            </Title>
          </div>

          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: 16 }}>
                <Text
                  strong
                  style={{
                    color: "#1d1d1f",
                    marginBottom: 8,
                    display: "block",
                  }}
                >
                  ส่วนสูง: {hasUserInput ? `${height} ซม.` : "กรุณาเลือก"}
                </Text>
                <Slider
                  min={140}
                  max={200}
                  value={height}
                  onChange={handleHeightChange}
                  marks={{ 140: "140", 160: "160", 180: "180", 200: "200" }}
                  style={{ marginBottom: 4 }}
                  trackStyle={{
                    background: "linear-gradient(135deg, #32D74B, #30B84E)",
                  }}
                  handleStyle={{
                    borderColor: "#32D74B",
                    backgroundColor: "#32D74B",
                    boxShadow: "0 2px 8px rgba(50, 215, 75, 0.3)",
                  }}
                />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: 16 }}>
                <Text
                  strong
                  style={{
                    color: "#1d1d1f",
                    marginBottom: 8,
                    display: "block",
                  }}
                >
                  น้ำหนัก: {hasUserInput ? `${weight} กก.` : "กรุณาเลือก"}
                </Text>
                <Slider
                  min={40}
                  max={180}
                  value={weight}
                  onChange={handleWeightChange}
                  marks={{ 40: "40", 80: "80", 120: "120", 180: "180" }}
                  style={{ marginBottom: 4 }}
                  trackStyle={{
                    background: "linear-gradient(135deg, #32D74B, #30B84E)",
                  }}
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
                marginTop: 16,
                padding: 12,
                background: "rgba(255, 255, 255, 0.8)",
                borderRadius: 12,
                border: "1px solid rgba(50, 215, 75, 0.3)",
              }}
            >
              <Text style={{ color: "#32D74B", fontSize: 16 }}>
                <strong>ขนาดที่แนะนำ: {recommendedSize}</strong>
              </Text>
              <br />
              {SIZE_OPTIONS.find((opt) => opt.size === recommendedSize) && (
                <Text style={{ color: "#48484a", fontSize: 14 }}>
                  รอบอก:{" "}
                  {
                    SIZE_OPTIONS.find((opt) => opt.size === recommendedSize)
                      ?.chestInch
                  }
                  " | ความยาว:{" "}
                  {
                    SIZE_OPTIONS.find((opt) => opt.size === recommendedSize)
                      ?.lengthInch
                  }
                  "
                </Text>
              )}
              <br />
              <Button
                type="link"
                icon={<UserSwitchOutlined />}
                onClick={handleSelectRecommended}
                style={{
                  color: "#32D74B",
                  fontWeight: 500,
                  marginTop: 8,
                  padding: 0,
                  height: "auto",
                  display:
                    selectedSize === recommendedSize ? "none" : "inline-block",
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
                marginTop: 16,
                padding: 16,
                background: "rgba(0, 122, 255, 0.05)",
                borderRadius: 12,
                border: "1px solid rgba(0, 122, 255, 0.1)",
              }}
            >
              <Text style={{ color: "#007AFF", fontSize: 15 }}>
                <InfoCircleOutlined style={{ marginRight: 8 }} />
                กรุณาปรับส่วนสูงและน้ำหนักเพื่อรับคำแนะนำขนาดเสื้อ
              </Text>
            </div>
          )}
        </div>

        {/* Selected Size */}
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
            <CheckCircleOutlined
              style={{ color: "#007AFF", fontSize: 24, marginBottom: 8 }}
            />
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
              {recommendedSize && selectedSize === recommendedSize && (
                <div style={{ marginTop: 4 }}>
                  <Tag color="#32D74B" style={{ fontSize: 12 }}>
                    ✓ ขนาดแนะนำ
                  </Tag>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Size Selection */}
        <div style={{ marginBottom: 32 }}>
          <Title
            level={4}
            style={{ textAlign: "center", marginBottom: 24, color: "#1d1d1f" }}
          >
            เลือกขนาดเสื้อ
          </Title>
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
                        : recommendedSize === option.size &&
                          selectedSize !== option.size
                        ? "2px solid #FF9500"
                        : "2px solid #f0f0f0",
                    boxShadow:
                      selectedSize === option.size
                        ? "0 8px 16px rgba(0, 122, 255, 0.3)"
                        : recommendedSize === option.size &&
                          selectedSize !== option.size
                        ? "0 4px 12px rgba(255, 149, 0, 0.2)"
                        : "0 2px 8px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.3s ease",
                    position: "relative",
                  }}
                >
                  {/* Mark แนะนำ */}
                  {recommendedSize === option.size && (
                    <div
                      style={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        background:
                          selectedSize === option.size ? "#32D74B" : "#FF9500",
                        color: "white",
                        borderRadius: "50%",
                        width: 24,
                        height: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: "bold",
                        boxShadow:
                          selectedSize === option.size
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

        {/* Info Note */}
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

        {/* Additional Info */}
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
            <strong>เคล็ดลับ:</strong> หากไม่แน่ใจในขนาด
            แนะนำให้เลือกขนาดที่ใหญ่กว่าเล็กน้อย เพื่อความสบายในการสวมใส่
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

          {selectedSize &&
            recommendedSize &&
            selectedSize !== recommendedSize && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  background: "rgba(255, 149, 0, 0.08)",
                  border: "1px solid rgba(255, 149, 0, 0.2)",
                  borderRadius: 8,
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <Text style={{ color: "#FF9500", fontSize: 14 }}>
                    ⚠️ <strong>ขนาดไม่ตรงกับที่แนะนำ</strong>
                  </Text>
                </div>
                <Text style={{ color: "#FF9500", fontSize: 13 }}>
                  ระบบแนะนำขนาด <strong>{recommendedSize}</strong>{" "}
                  จากข้อมูลส่วนสูง {height} ซม. และน้ำหนัก {weight} กก.
                </Text>
              </div>
            )}

          {selectedSize && selectedSize === recommendedSize && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                background: "rgba(50, 215, 75, 0.08)",
                border: "1px solid rgba(50, 215, 75, 0.2)",
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#32D74B", fontSize: 14 }}>
                ✅ <strong>ขนาดตรงกับที่แนะนำ</strong>
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
