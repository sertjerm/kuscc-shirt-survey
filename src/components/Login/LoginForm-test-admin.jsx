// src/components/Login/LoginForm.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Form, Input, Button, Typography, Alert } from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  IdcardOutlined,
  LoginOutlined,
} from "@ant-design/icons";
import Swal from "sweetalert2";

import { useAppContext } from "../../App";
import { loginMember } from "../../services/shirtApi";

const { Title, Paragraph } = Typography;

const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAppContext();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // กำหนดค่า default สำหรับทดสอบ
  const initialValues = {
    memberCode: "012938",
     phone: "9999999999",
     idCard: "999",
  };

  const handleLogin = async (values) => {
    setLoading(true);

    try {
      console.log("🔐 เรียกใช้ API เข้าสู่ระบบ...");
      const memberData = await loginMember({
        memberCode: values.memberCode ,//|| "012938",
        phone: "0812681022",//values.phone || 
        idCard:  "952",//values.idCard ||
      });

      console.log("✅ ได้รับข้อมูลสมาชิก:", memberData);

      if (memberData) {
        // กำหนด role (default: member)
        let userRole = "member";
        let userType = "member";

        // ตรวจสอบว่าเป็น admin หรือไม่
        if (
          memberData.memberCode === "012938" ||
          memberData.memberCode === "999999" ||
          memberData.userRole === "admin"
        ) {
          userRole = "admin";
          userType = "admin";
        }

        console.log("👤 userRole:", userRole, "userType:", userType);

        // สร้าง user object ให้สอดคล้องกับโค้ดเดิม
        const userData = {
          memberCode: memberData.memberCode,
          name: memberData.name,
          fullName: memberData.fullName,
          displayName: memberData.displayName,
          phone: memberData.phone,
          idCard: memberData.socialId,
          role: userRole,
          sizeCode: memberData.sizeCode, // ใช้ sizeCode แทน selectedSize
          surveyDate: memberData.surveyDate,
          surveyMethod: memberData.surveyMethod,
          updatedDate: memberData.updatedDate,
          remarks: memberData.remarks,
          
          // ฟิลด์ใหม่สำหรับการรับเสื้อ
          hasReceived: memberData.hasReceived || false,
          receiveStatus: memberData.receiveStatus,
          receiveDate: memberData.receiveDate,
          receiverType: memberData.receiverType,
          receiverName: memberData.receiverName,
          processedBy: memberData.processedBy,
          
          // เพิ่มข้อมูลที่ MemberPortal ต้องการ (backward compatibility)
          MEMB_CODE: memberData.memberCode,
          DISPLAYNAME: memberData.displayName || memberData.name,
          FULLNAME: memberData.fullName,
          MEMB_MOBILE: memberData.phone,
          MEMB_SOCID: memberData.socialId,
          SIZE_CODE: memberData.sizeCode,
          SURVEY_DATE: memberData.surveyDate,
          SURVEY_METHOD: memberData.surveyMethod,
          REMARKS: memberData.remarks,
          USER_ROLE: userRole,
          
          // ฟิลด์ใหม่ในรูปแบบ uppercase (สำหรับ compatibility)
          PROCESSED_BY: memberData.processedBy,
          RECEIVER_NAME: memberData.receiverName,
          RECEIVER_TYPE: memberData.receiverType,
          RECEIVE_DATE: memberData.receiveDate,
          RECEIVE_STATUS: memberData.receiveStatus,
          UPDATED_DATE: memberData.updatedDate,
        };

        console.log("💾 Final userData:", userData);

        // บันทึกข้อมูลใน context
        login(userData, userType);

        // แสดง success message
        await Swal.fire({
          icon: "success",
          title: "เข้าสู่ระบบสำเร็จ",
          text: `ยินดีต้อนรับ ${memberData.displayName || memberData.name}`,
          timer: 2000,
          showConfirmButton: false,
        });

        // 🔥 FLOW เดิม: Navigate ตาม role
        if (userType === "admin") {
          navigate("/admin");
        } else {
          navigate("/member"); // ไปหน้า Survey (เดิม)
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
        confirmButtonText: "ลองใหม่",
        confirmButtonColor: "#007AFF",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card
        style={{
          width: "100%",
          maxWidth: "400px",
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
              color: "#007AFF",
              fontWeight: "700",
            }}
          >
            ยืนยันตัวตน
          </Title>
          <Paragraph style={{ color: "#48484a", margin: 0, fontSize: "15px" }}>
            จองขนาดเสื้อแจ็กเก็ต สอ.มก.
          </Paragraph>
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
    </div>
  );
};

export default LoginForm;