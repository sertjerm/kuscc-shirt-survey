import React from 'react';
import { Card, Typography, Button, Space, Row, Col, Tag } from 'antd';
import { UserOutlined, LogoutOutlined, ShopOutlined } from '@ant-design/icons';
import Swal from 'sweetalert2';

import { useAppContext } from '../App';

const { Title, Paragraph } = Typography;

const MemberPortal = () => {
  const { user, logout } = useAppContext();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'ออกจากระบบ?',
      text: 'คุณต้องการออกจากระบบหรือไม่?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ออกจากระบบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ff4d4f'
    });

    if (result.isConfirmed) {
      logout();
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px 0'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 16px' }}>
        {/* Header */}
        <Card 
          style={{ 
            borderRadius: '20px',
            marginBottom: '20px',
            background: 'rgba(255,255,255,0.95)'
          }}
        >
          <Row justify="space-between" align="middle">
            <Col>
              <Space size="middle">
                <div 
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2E7D32, #4CAF50)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <UserOutlined style={{ fontSize: '24px', color: 'white' }} />
                </div>
                <div>
                  <Title level={4} style={{ margin: 0, color: '#2E7D32' }}>
                    {user?.name || 'สมาชิก'}
                  </Title>
                  <div style={{ color: '#666' }}>รหัสสมาชิก: {user?.memberCode}</div>
                </div>
              </Space>
            </Col>
            <Col>
              <Button 
                type="text" 
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                style={{ color: '#666' }}
              >
                ออกจากระบบ
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Main Content */}
        <Card 
          style={{ 
            borderRadius: '20px',
            background: 'rgba(255,255,255,0.95)'
          }}
        >
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <ShopOutlined style={{ fontSize: '64px', color: '#2E7D32', marginBottom: '24px' }} />
            <Title level={2} style={{ color: '#2E7D32', marginBottom: '16px' }}>
              ระบบเลือกขนาดเสื้อ
            </Title>
            <Paragraph style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>
              กำลังพัฒนาฟีเจอร์การเลือกขนาดเสื้อ
            </Paragraph>
            
            <Tag color="gold" style={{ fontSize: '14px', padding: '8px 16px' }}>
              🚧 Coming Soon
            </Tag>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MemberPortal;
