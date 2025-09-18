import React from 'react';
import { Layout, Card, Typography, Button, Space, Row, Col } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined, ShopOutlined } from '@ant-design/icons';
import Swal from 'sweetalert2';

import { useAppContext } from '../App';

const { Header, Content } = Layout;
const { Title } = Typography;

const AdminPortal = () => {
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
    <Layout style={{ minHeight: '100vh' }}>
      {/* Header */}
      <Header 
        style={{ 
          background: 'linear-gradient(135deg, #2E7D32, #4CAF50)',
          padding: '0 24px'
        }}
      >
        <Row justify="space-between" align="middle" style={{ height: '100%' }}>
          <Col>
            <Space size="middle">
              <div 
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <SettingOutlined style={{ fontSize: '20px', color: 'white' }} />
              </div>
              <div>
                <Title level={3} style={{ color: 'white', margin: 0 }}>
                  ระบบจัดการแจกเสื้อ
                </Title>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                  เจ้าหน้าที่: {user?.name || 'Admin'}
                </div>
              </div>
            </Space>
          </Col>
          <Col>
            <Button 
              type="text" 
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{ 
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)'
              }}
            >
              ออกจากระบบ
            </Button>
          </Col>
        </Row>
      </Header>

      {/* Content */}
      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Card 
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              textAlign: 'center',
              padding: '40px 0'
            }}
          >
            <ShopOutlined style={{ fontSize: '64px', color: '#2E7D32', marginBottom: '24px' }} />
            <Title level={2} style={{ color: '#2E7D32', marginBottom: '16px' }}>
              ระบบจัดการเจ้าหน้าที่
            </Title>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>
              กำลังพัฒนาฟีเจอร์สำหรับเจ้าหน้าที่
            </div>
            <div style={{ fontSize: '14px', color: '#999' }}>
              • ค้นหาสมาชิก<br />
              • บันทึกการจ่ายเสื้อ<br />
              • จัดการสต็อก<br />
              • รายงานสถิติ
            </div>
          </Card>
        </div>
      </Content>
    </Layout>
  );
};

export default AdminPortal;
