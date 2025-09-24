import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Card, Form, Input, Button, Typography, Space, Switch, Alert } from 'antd';
import { UserOutlined, PhoneOutlined, IdcardOutlined, LoginOutlined, SettingOutlined } from '@ant-design/icons';
import Swal from "sweetalert2";

import { useAppContext } from "../../App";
import { loginMember } from "../../services/shirtApi";

const { Title, Paragraph } = Typography;

const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAppContext();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Set default values for the form
  React.useEffect(() => {
    if (isAdminMode) {
      form.setFieldsValue({
        memberCode: "999999",
        phone: "0000000000",
        idCard: "999",
      });
    } else {
      form.setFieldsValue({
        memberCode: "",
        phone: "",
        idCard: "",
      });
    }
  }, [form, isAdminMode]);

  const handleLogin = async (values) => {
    setLoading(true);

    try {
      // โหมด Admin - ยังใช้การตรวจสอบแบบเดิม
      if (isAdminMode) {
        if (
          values.memberCode === "999999" &&
          values.phone === "0000000000" &&
          values.idCard === "999"
        ) {
          login(
            { memberCode: "999999", name: "ผู้ดูแลระบบ", role: "admin" },
            "admin"
          );
          await Swal.fire({
            icon: "success",
            title: "เข้าสู่ระบบสำเร็จ",
            text: "ยินดีต้อนรับเจ้าหน้าที่",
            timer: 1500,
            showConfirmButton: false,
          });
          navigate("/admin");
          return;
        } else {
          throw new Error("ข้อมูลเจ้าหน้าที่ไม่ถูกต้อง");
        }
      }

      // โหมดสมาชิก - ใช้ API จริง
      console.log("เรียกใช้ API เข้าสู่ระบบ...");
      const memberData = await loginMember({
        memberCode: values.memberCode,
        phone: values.phone,
        idCard: values.idCard,
      });

      console.log("ได้รับข้อมูลสมาชิก:", memberData);

      if (memberData) {
        login(memberData, "member");

        await Swal.fire({
          icon: "success",
          title: "เข้าสู่ระบบสำเร็จ",
          text: `ยินดีต้อนรับ ${memberData.displayName || memberData.name}`,
          timer: 2000,
          showConfirmButton: false,
        });

        navigate("/member");
      } else {
        throw new Error("ไม่พบข้อมูลสมาชิกหรือข้อมูลไม่ถูกต้อง");
      }
    } catch (error) {
      console.error("Login Error:", error);

      await Swal.fire({
        icon: "error",
        title: "ไม่สามารถเข้าสู่ระบบได้",
        text: error.message,
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
          width: '100%',
          maxWidth: '400px',
          borderRadius: '24px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title 
            level={2} 
            style={{ 
              margin: '0 0 8px 0', 
              color: '#007AFF', 
              fontWeight: '700'
            }}
          >
            ยืนยันตัวตน
          </Title>
          <Paragraph style={{ color: '#48484a', margin: 0, fontSize: '15px' }}>
            ระบบสำรวจขนาดเสื้อแจ็กเก็ต สอ.มก.
          </Paragraph>
        </div>

        {/* Admin Mode Toggle */}
        {/* <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Space>
            <SettingOutlined style={{ color: '#8e8e93' }} />
            <span style={{ color: '#48484a', fontSize: '14px' }}>
              โหมดเจ้าหน้าที่
            </span>
            <Switch
              checked={isAdminMode}
              onChange={setIsAdminMode}
              size="small"
            />
          </Space>
        </div> */}

        {isAdminMode && (
          <Alert
            message="โหมดเจ้าหน้าที่"
            description="กรุณาใช้รหัสเจ้าหน้าที่เพื่อเข้าสู่ระบบ"
            type="info"
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}

        {/* Form */}
        <Form form={form} layout="vertical" onFinish={handleLogin} size="large">
          <Form.Item
            name="memberCode"
            label="เลขสมาชิก"
            rules={[
              { required: true, message: 'กรุณากรอกเลขสมาชิก' },
              { len: 6, message: 'เลขสมาชิกต้องมี 6 หลัก' },
              { pattern: /^\d+$/, message: 'เลขสมาชิกต้องเป็นตัวเลขเท่านั้น' },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#007AFF' }} />}
              placeholder="กรอกเลขสมาชิก 6 หลัก"
              maxLength={6}
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label="เบอร์โทรศัพท์"
            rules={[
              { required: true, message: 'กรุณากรอกเบอร์โทรศัพท์' },
              { len: 10, message: 'เบอร์โทรศัพท์ต้องมี 10 หลัก' },
              {
                pattern: /^\d+$/,
                message: 'เบอร์โทรศัพท์ต้องเป็นตัวเลขเท่านั้น',
              },
            ]}
          >
            <Input
              prefix={<PhoneOutlined style={{ color: '#007AFF' }} />}
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
                message: 'กรุณากรอกเลขบัตรประชาชน 3 ตัวสุดท้าย',
              },
              { len: 3, message: 'ต้องกรอก 3 ตัวสุดท้าย' },
              { pattern: /^\d+$/, message: 'ต้องเป็นตัวเลขเท่านั้น' },
            ]}
          >
            <Input
              prefix={<IdcardOutlined style={{ color: '#007AFF' }} />}
              placeholder="กรอก 3 ตัวสุดท้าย"
              maxLength={3}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: '32px' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              icon={<LoginOutlined />}
              style={{
                height: '52px',
                fontSize: '16px',
                fontWeight: '600',
                borderRadius: '14px',
              }}
            >
              {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
            </Button>
          </Form.Item>
        </Form>

        {/* <Alert
          message="ทดสอบ: 999999/0000000000/999 (แอดมิน)"
          type="info"
          style={{
            marginTop: 16,
            fontSize: 12,
            background: 'rgba(0, 122, 255, 0.08)',
            border: '1px solid rgba(0, 122, 255, 0.2)',
            borderRadius: '12px',
          }}
          showIcon
        /> */}
      </Card>
    </div>
  );
};

export default LoginForm;
