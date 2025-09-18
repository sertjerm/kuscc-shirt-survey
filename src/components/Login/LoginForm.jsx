import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, Space, Switch, Alert } from 'antd';
import { UserOutlined, PhoneOutlined, IdcardOutlined, LoginOutlined, SettingOutlined } from '@ant-design/icons';
import Swal from 'sweetalert2';

import { useAppContext } from '../../App';
import { searchMember } from '../../services/shirtApi';

const { Title, Paragraph } = Typography;

const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAppContext();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  const handleLogin = async (values) => {
    setLoading(true);
    
    try {
      if (isAdminMode) {
        if (values.memberCode === '999999' && 
            values.phone === '0000000000' && 
            values.idCard === '999') {
          
          login({ memberCode: '999999', name: 'ผู้ดูแลระบบ', role: 'admin' }, 'admin');
          
          await Swal.fire({
            icon: 'success',
            title: 'เข้าสู่ระบบสำเร็จ',
            text: 'ยินดีต้อนรับเจ้าหน้าที่',
            timer: 1500,
            showConfirmButton: false
          });
          
          navigate('/admin');
          return;
        } else {
          throw new Error('ข้อมูลเจ้าหน้าที่ไม่ถูกต้อง');
        }
      }
      
      const memberData = await searchMember(values);
      
      if (memberData) {
        login(memberData, 'member');
        
        await Swal.fire({
          icon: 'success',
          title: 'เข้าสู่ระบบสำเร็จ',
          text: `ยินดีต้อนรับ ${memberData.name}`,
          timer: 1500,
          showConfirmButton: false
        });
        
        navigate('/member');
      }
      
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถเข้าสู่ระบบได้',
        text: error.message
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
          maxWidth: 400,
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          background: 'rgba(255,255,255,0.95)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} style={{ margin: '0 0 8px 0', color: '#2E7D32' }}>
            ระบบแจกเสื้อ KUSCC
          </Title>
          <Paragraph style={{ color: '#666', margin: 0 }}>
            สหกรณ์ออมทรัพย์มหาวิทยาลัยเกษตรศาสตร์
          </Paragraph>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Space>
            <SettingOutlined style={{ color: '#666' }} />
            <span style={{ color: '#666' }}>โหมดเจ้าหน้าที่</span>
            <Switch 
              checked={isAdminMode}
              onChange={setIsAdminMode}
              size="small"
            />
          </Space>
        </div>

        {isAdminMode && (
          <Alert
            message="โหมดเจ้าหน้าที่"
            description="กรุณาใช้รหัสเจ้าหน้าที่เพื่อเข้าสู่ระบบ"
            type="info"
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
          size="large"
        >
          <Form.Item
            name="memberCode"
            label="เลขสมาชิก"
            rules={[
              { required: true, message: 'กรุณากรอกเลขสมาชิก' },
              { len: 6, message: 'เลขสมาชิกต้องมี 6 หลัก' },
              { pattern: /^\d+$/, message: 'เลขสมาชิกต้องเป็นตัวเลขเท่านั้น' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
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
              { pattern: /^\d+$/, message: 'เบอร์โทรศัพท์ต้องเป็นตัวเลขเท่านั้น' }
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="กรอกเบอร์โทรศัพท์ 10 หลัก"
              maxLength={10}
            />
          </Form.Item>

          <Form.Item
            name="idCard"
            label="เลขบัตรประชาชน 3 ตัวสุดท้าย"
            rules={[
              { required: true, message: 'กรุณากรอกเลขบัตรประชาชน 3 ตัวสุดท้าย' },
              { len: 3, message: 'ต้องกรอก 3 ตัวสุดท้าย' },
              { pattern: /^\d+$/, message: 'ต้องเป็นตัวเลขเท่านั้น' }
            ]}
          >
            <Input
              prefix={<IdcardOutlined />}
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
                height: '50px',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
            </Button>
          </Form.Item>
        </Form>

        <Alert 
          message="ทดสอบ: 123456/0812345678/123 (สมาชิก), 999999/0000000000/999 (แอดมิน)" 
          type="info" 
          style={{ marginTop: 16, fontSize: 12 }}
          showIcon
        />
      </Card>
    </div>
  );
};

export default LoginForm;
