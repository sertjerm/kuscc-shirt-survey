// src/components/Login/LoginForm.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Form, Input, Button, Typography, Modal, Tag } from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  IdcardOutlined,
  LoginOutlined,
  TeamOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import Swal from "sweetalert2";


import { useAppContext } from "../../App";
import { loginMember } from "../../services/shirtApi";
import SnowEffect from "../Effects/SnowEffect";

const { Title, Paragraph } = Typography;

const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAppContext();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // อ่านค่า VITE_BASE_PATH (สำหรับ debug) — แสดงด้านล่างนอก Card
  const basePath = import.meta.env.VITE_BASE_PATH ?? "/";

  // 🆕 เพิ่มวันที่ build
  const buildDate = __BUILD_DATE_LOCAL__ || "Unknown";

  // ตัดสินป้ายและสี (ตรวจสอบ dev ก่อน)
  const bp = String(basePath || "");
  const isShirtDev = bp.includes("ShirtSurveyDev");
  const isJacket = !isShirtDev && bp.includes("JacketSurvey");
  const isShirt = !isShirtDev && bp.includes("ShirtSurvey");
  const tagLabel = isShirtDev
    ? "ShirtSurveyDev"
    : isJacket
    ? "JacketSurvey"
    : isShirt
    ? "ShirtSurvey"
    : basePath;
  const tagColor = isShirtDev
    ? "red"
    : isJacket
    ? "green"
    : isShirt
    ? "orange"
    : undefined;

  const initialValues = {
    memberCode: "",
    phone: "",
    idCard: "",
  };

  const handleLogin = async (values) => {
    setLoading(true);

    try {
      console.log("🔐 เรียกใช้ API เข้าสู่ระบบ...");
      const memberData = await loginMember({
        memberCode: values.memberCode || "",
        phone: values.phone || "",
        idCard: values.idCard || "",
      });

      console.log("✅ ได้รับข้อมูลสมาชิก:", memberData);

      if (memberData) {
        // 🔥 แก้ไข: ตรวจสอบ userRole (camelCase) จาก API response
        const isAdmin = memberData.userRole === "admin";

        // 🆕 ตรวจสอบว่าเป็นกลุ่มเกษียณหรือไม่ (MEMB_DBTYP = "1" หรือ "2")
        const isRetirementMember =
          memberData.MEMB_DBTYP === "1" || memberData.MEMB_DBTYP === "2";

        console.log("👤 userRole from API:", memberData.USER_ROLE);
        console.log("🔐 Is Admin:", isAdmin);
        console.log("👴 MEMB_DBTYP:", memberData.MEMB_DBTYP);
        console.log("🎯 Is Retirement Member:", isRetirementMember);

        // สร้าง user object
        const userData = {
          memberCode: memberData.memberCode,
          name: memberData.displayName || memberData.name,
          fullName: memberData.fullName,
          displayName: memberData.displayName || memberData.name,
          phone: memberData.phone,
          idCard: memberData.socialId,
          role: memberData.userRole, // ใช้ userRole (camelCase)
          sizeCode: memberData.sizeCode,
          surveyDate: memberData.surveyDate,
          surveyMethod: memberData.surveyMethod,
          updatedDate: memberData.updatedDate,
          remarks: memberData.remarks,
          round: memberData.round,

          // 🆕 เพิ่มข้อมูลประเภทสมาชิก
          membDbtyp: memberData.memb_dbtyp || memberData.MEMB_DBTYP,
          isRetirementMember: isRetirementMember,

          // ฟิลด์ใหม่สำหรับการรับเสื้อ
          hasReceived:
            memberData.hasReceived || memberData.receiveStatus === "RECEIVED",
          receiveStatus: memberData.receiveStatus,
          receiveDate: memberData.receiveDate,
          receiverType: memberData.receiverType,
          receiverName: memberData.receiverName,
          processedBy: memberData.processedBy,

          // เพิ่มข้อมูลในรูปแบบ UPPERCASE และ camelCase (backward compatibility)
          MEMB_CODE: memberData.memberCode,
          DISPLAYNAME: memberData.displayName || memberData.name,
          FULLNAME: memberData.fullName,
          MEMB_MOBILE: memberData.phone,
          MEMB_SOCID: memberData.socialId,
          MEMB_DBTYP: memberData.memb_dbtyp || memberData.MEMB_DBTYP,
          SIZE_CODE: memberData.sizeCode,
          SURVEY_DATE: memberData.surveyDate,
          SURVEY_METHOD: memberData.surveyMethod,
          REMARKS: memberData.remarks,
          USER_ROLE: memberData.userRole, // map จาก userRole
          PROCESSED_BY: memberData.processedBy,
          RECEIVER_NAME: memberData.receiverName,
          RECEIVER_TYPE: memberData.receiverType,
          RECEIVE_DATE: memberData.receiveDate,
          RECEIVE_STATUS: memberData.receiveStatus,
          UPDATED_DATE: memberData.updatedDate,
          ADDR:memberData.ADDR,
          allowRound2: memberData.ALLOW_ROUND2,
        };

        console.log("💾 Final userData:", userData);

        // แสดง success message
        await Swal.fire({
          icon: "success",
          title: "เข้าสู่ระบบสำเร็จ",
          text: `ยินดีต้อนรับ ${memberData.displayName || memberData.name}`,
          timer: 1500,
          showConfirmButton: false,
        });

        // 🔥 เงื่อนไขใหม่: ตรวจสอบตามลำดับความสำคัญ
        if (isAdmin) {
          // 1. ถ้าเป็น Admin ให้แสดง Modal เลือก
          console.log("🎯 Admin detected - showing role selection modal");

          Modal.confirm({
            title: null,
            icon: null,
            width: 440,
            centered: true,
            closable: false,
            maskClosable: false,
            content: null,
            okText: (
              <span>
                <SettingOutlined style={{ marginRight: "8px" }} />
                สำหรับเจ้าหน้าที่
              </span>
            ),
            cancelText: (
              <span>
                <TeamOutlined style={{ marginRight: "8px" }} />
                สำหรับสมาชิก
              </span>
            ),
            okButtonProps: {
              size: "large",
              style: {
                height: "48px",
                borderRadius: "12px",
                fontWeight: "600",
              },
            },
            cancelButtonProps: {
              size: "large",
              style: {
                height: "48px",
                borderRadius: "12px",
                fontWeight: "600",
              },
            },
            onOk: () => {
              // เลือกไปหน้า Admin
              console.log("✅ User selected: Admin page");
              login(userData, "admin");
              navigate("/admin");
            },
            onCancel: () => {
              // เลือกไปหน้า Member (ตรวจสอบกลุ่มเกษียณอีกครั้ง)
              console.log("✅ User selected: Member page");
              login(userData, "member");

              if (isRetirementMember) {
                if (userData.sizeCode) {
                  console.log(
                    "👴 Retirement member has size - Navigating to Delivery"
                  );
                  navigate("/retirement-delivery");
                } else {
                  console.log(
                    "👴 Retirement member has NO size - Navigating to Size Selection"
                  );
                  navigate("/member");
                }
              } else {
                console.log("👤 Navigating to Regular Member Survey");
                navigate("/member");
              }
            },
          });
        } else if (isRetirementMember) {
          // 2. ถ้าเป็นกลุ่มเกษียณ (memb_dbtyp = "1" หรือ "2") และไม่ใช่ admin
          console.log("👴 Non-admin retirement member detected");
          login(userData, "member");

          if (userData.sizeCode) {
            console.log("✅ Has size -> /retirement-delivery");
            navigate("/retirement-delivery");
          } else {
            console.log("❌ No size -> /member");
            navigate("/member");
          }
        } else {
          // 3. Member ปกติ - เข้าหน้า Survey เลย
          console.log("👤 Regular member - navigate to /member");
          login(userData, "member");
          navigate("/member");
        }
      } else {
        throw new Error("ไม่พบข้อมูลสมาชิกหรือข้อมูลไม่ถูกต้อง");
      }
    } catch (error) {
      console.error("❌ Login Error:", error);

      await Swal.fire({
        icon: "error",
        title: "ไม่สามารถเข้าสู่ระบบได้",
        text: error.message || "กรุณาตรวจสอบข้อมูลอีกครั้ง",
       // confirmButtonText: "ลองใหม่",
        confirmButtonText: "ปิดหน้าต่าง",
        confirmButtonColor: "#007AFF",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ position: "relative" }}>
      <SnowEffect />
      
      {/* Wrapper for Card and Santa to ensure Santa is positioned relative to Card */}
      <div style={{ position: "relative", width: "100%", maxWidth: "400px", margin: "0 auto" }}>


        <Card
          style={{
            width: "100%",
            borderRadius: "24px",
            boxShadow:
              "0 25px 50px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1) inset",
            background: "rgba(255, 255, 255, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <Title
            level={2}
            style={{
              margin: "0 0 8px 0",
              color: "#c0392b", // Christmas Red
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            🎄 ยืนยันตัวตน 🎄
          </Title>
          <Paragraph style={{ color: "#48484a", margin: 0, fontSize: "15px" }}>
            จองขนาดเสื้อแจ็กเก็ต สอ.มก.{" "}
            <span style={{ color: "orange", fontWeight: "bold" }}>(รอบที่ 2)</span>
          </Paragraph>
          <div style={{ marginTop: 12 }}>
            <Tag color="#27ae60" style={{ fontSize: 14, padding: "4px 10px", borderRadius: "100px", border: "none" }}>
              🎁 สำหรับสมาชิกที่ยังไม่จอง 🎁
            </Tag>
          </div>
        </div>

        {/* Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
          size="large"
          initialValues={initialValues}
        >
          <Form.Item
            name="memberCode"
            label="เลขสมาชิก"
            rules={[
              { required: true, message: "กรุณากรอกเลขสมาชิก" },
              { pattern: /^\d+$/, message: "เลขสมาชิกต้องเป็นตัวเลขเท่านั้น" },
              { max: 6, message: "เลขสมาชิกไม่เกิน 6 ตัว" },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: "#007AFF" }} />}
              placeholder="กรอกเลขสมาชิก (ไม่เกิน 6 ตัว)"
              maxLength={6}
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label="เบอร์โทรศัพท์"
            rules={[
              { required: true, message: "กรุณากรอกเบอร์โทรศัพท์" },
              { len: 10, message: "เบอร์โทรศัพท์ต้องมี 10 หลัก" },
              {
                pattern: /^\d+$/,
                message: "เบอร์โทรศัพท์ต้องเป็นตัวเลขเท่านั้น",
              },
            ]}
          >
            <Input
              prefix={<PhoneOutlined style={{ color: "#007AFF" }} />}
              placeholder="กรอกเบอร์โทรศัพท์ 10 หลัก"
              maxLength={10}
            />
          </Form.Item>

          <Form.Item
            name="idCard"
            label="เลขบัตรประชาชน 3 ตัวสุดท้าย"
            rules={[
              {
                required: true,
                message: "กรุณากรอกเลขบัตรประชาชน 3 ตัวสุดท้าย",
              },
              { len: 3, message: "ต้องกรอก 3 ตัวสุดท้าย" },
              { pattern: /^\d+$/, message: "ต้องเป็นตัวเลขเท่านั้น" },
            ]}
          >
            <Input
              prefix={<IdcardOutlined style={{ color: "#007AFF" }} />}
              placeholder="กรอก 3 ตัวสุดท้าย"
              maxLength={3}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: "32px" }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              icon={<LoginOutlined />}
              style={{
                height: "52px",
                fontSize: "16px",
                fontWeight: "600",
                borderRadius: "14px",
              }}
            >
              {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* แสดงค่า VITE_BASE_PATH และวันที่ build ด้านล่าง Card */}
      <div style={{ textAlign: "center", marginTop: 12 }}>
        {tagColor ? (
          <Tag color={tagColor} style={{ fontSize: 12 }}>
            {tagLabel}
          </Tag>
        ) : (
          <Tag
            style={{
              color: "#888",
              fontSize: 12,
              background: "transparent",
              border: "none",
            }}
          >
            {tagLabel}
          </Tag>
        )}

        {/* 🆕 แสดงวันที่ build */}
        <div style={{ marginTop: 4 }}>
          <Tag
            style={{
              fontSize: 10,
              color: "#ffffffff",
              background: "transparent",
              border: "1px solid #e8e8e8",
              borderRadius: "4px",
            }}
          >
            Build: {buildDate}
          </Tag>
        </div>
      </div>
      </div>
    </div>
  );
};

export default LoginForm;
