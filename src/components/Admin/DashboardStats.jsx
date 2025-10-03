// src/components/Admin/DashboardStats.jsx
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Progress, Space, Typography, Spin, Alert, Button } from 'antd';
import { 
  TeamOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  GiftOutlined,
  TrophyOutlined,
  RiseOutlined,
  ReloadOutlined,
  UserOutlined
} from '@ant-design/icons';
import { getDashboardStats } from '../../services/shirtApi';

const { Title, Text } = Typography;

// ฟังก์ชันสำหรับ format ตัวเลขให้มี comma
const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('th-TH');
};

const DashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getDashboardStats();
      console.log('📊 Dashboard Stats from API:', data);
      setStats(data);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setError(err.message || 'ไม่สามารถโหลดข้อมูลสถิติได้');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">กำลังโหลดข้อมูล...</Text>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert
        message="เกิดข้อผิดพลาด"
        description={error}
        type="error"
        showIcon
        action={
          <Button 
            size="small" 
            icon={<ReloadOutlined />}
            onClick={loadStats}
          >
            ลองอีกครั้ง
          </Button>
        }
      />
    );
  }

  if (!stats) {
    return null;
  }

  // คำนวณเปอร์เซ็นต์
  const confirmedPercent = stats.totalMembers > 0 
    ? Math.round((stats.confirmedMembers / stats.totalMembers) * 100) 
    : 0;
  
  const receivedPercent = stats.totalMembers > 0 
    ? Math.round((stats.receivedMembers / stats.totalMembers) * 100) 
    : 0;

  const pendingPercent = 100 - confirmedPercent;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Overview Stats - แสดงแบบ x/total */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={{ height: '100%' }}>
            <Statistic
              title="สมาชิกทั้งหมด"
              value={formatNumber(stats.totalMembers)}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              จำนวนสมาชิกที่มีสิทธิ์รับเสื้อ
            </Text>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={{ height: '100%' }}>
            <Statistic
              title="ยืนยันขนาดแล้ว"
              value={formatNumber(stats.confirmedMembers)}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress 
              percent={confirmedPercent} 
              strokeColor="#52c41a"
              size="small"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={{ height: '100%' }}>
            <Statistic
              title="รับเสื้อแล้ว"
              value={formatNumber(stats.receivedMembers)}
              prefix={<GiftOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
            <Progress 
              percent={receivedPercent} 
              strokeColor="#faad14"
              size="small"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={{ height: '100%' }}>
            <Statistic
              title="ยังไม่ยืนยัน"
              value={formatNumber(stats.pendingMembers)}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
            <Progress 
              percent={pendingPercent} 
              strokeColor="#ff4d4f"
              size="small"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Detailed Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card 
            style={{ height: '100%' }}
            title={
              <Space>
                <TrophyOutlined />
                <span>ขนาดที่ได้รับความนิยม</span>
              </Space>
            }
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                Top 5 ขนาด
              </Text>
            }
          >
            {stats.popularSizes && stats.popularSizes.length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {stats.popularSizes.slice(0, 5).map((item, index) => {
                  const percentage = stats.confirmedMembers > 0 
                    ? Math.round((item.count / stats.confirmedMembers) * 100)
                    : 0;
                  
                  return (
                    <div key={item.size} style={{ width: '100%' }}>
                      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text strong>
                          {index === 0 && '🥇 '}
                          {index === 1 && '🥈 '}
                          {index === 2 && '🥉 '}
                          {index > 2 && `${index + 1}. `}
                          ขนาด {item.size}
                        </Text>
                        <Space>
                          <Text strong style={{ fontSize: '16px' }}>
                            {formatNumber(item.count)} คน
                          </Text>
                          <Text type="secondary">({percentage}%)</Text>
                        </Space>
                      </Space>
                      <Progress 
                        percent={percentage} 
                        size="small"
                        showInfo={false}
                        strokeColor={
                          index === 0 ? '#faad14' : 
                          index === 1 ? '#52c41a' : 
                          index === 2 ? '#13c2c2' : 
                          '#1890ff'
                        }
                      />
                    </div>
                  );
                })}
              </Space>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Text type="secondary">ยังไม่มีข้อมูลการยืนยันขนาด</Text>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card 
            style={{ height: '100%' }}
            title={
              <Space>
                <RiseOutlined />
                <span>สถิติการจ่ายเสื้อ</span>
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Space>
                    <UserOutlined />
                    <Text>รับด้วยตนเอง</Text>
                  </Space>
                  <Text strong style={{ color: '#52c41a', fontSize: '18px' }}>
                    {formatNumber(stats.selfReceived)} คน
                  </Text>
                </Space>
                <Progress 
                  percent={stats.receivedMembers > 0 
                    ? Math.round((stats.selfReceived / stats.receivedMembers) * 100)
                    : 0
                  }
                  strokeColor="#52c41a"
                  size="small"
                />
              </div>

              <div>
                <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Space>
                    <TeamOutlined />
                    <Text>รับแทน</Text>
                  </Space>
                  <Text strong style={{ color: '#fa8c16', fontSize: '18px' }}>
                    {formatNumber(stats.proxyReceived)} คน
                  </Text>
                </Space>
                <Progress 
                  percent={stats.receivedMembers > 0 
                    ? Math.round((stats.proxyReceived / stats.receivedMembers) * 100)
                    : 0
                  }
                  strokeColor="#fa8c16"
                  size="small"
                />
              </div>

              <div style={{ 
                padding: '16px', 
                backgroundColor: '#f0f5ff', 
                borderRadius: 8,
                marginTop: 8,
                border: '1px solid #d6e4ff'
              }}>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    อัตราการจ่ายเสื้อ
                  </Text>
                  <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                    {receivedPercent}%
                  </Title>
                  <Text style={{ fontSize: 14 }}>
                    <strong>{formatNumber(stats.receivedMembers)}</strong> / {formatNumber(stats.totalMembers)} คน
                  </Text>
                  <Progress 
                    percent={receivedPercent} 
                    strokeColor="#1890ff"
                    size="small"
                    showInfo={false}
                  />
                </Space>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Survey Method Stats */}
      {stats.surveyMethods && (
        <Card 
          title="สถิติช่องทางการสำรวจ"
          extra={
            <Button 
              size="small" 
              icon={<ReloadOutlined />}
              onClick={loadStats}
            >
              รีเฟรช
            </Button>
          }
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Card bordered={false} style={{ backgroundColor: '#f0f5ff' }}>
                <Statistic
                  title="สำรวจออนไลน์ (สมาชิกกรอกเอง)"
                  value={`${formatNumber(stats.surveyMethods.online || 0)} คน`}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
                <Progress 
                  percent={stats.confirmedMembers > 0 
                    ? Math.round((stats.surveyMethods.online / stats.confirmedMembers) * 100)
                    : 0
                  }
                  strokeColor="#1890ff"
                  size="small"
                  style={{ marginTop: 8 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card bordered={false} style={{ backgroundColor: '#f6ffed' }}>
                <Statistic
                  title="บันทึกด้วยตนเอง (เจ้าหน้าที่)"
                  value={`${formatNumber(stats.surveyMethods.manual || 0)} คน`}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
                <Progress 
                  percent={stats.confirmedMembers > 0 
                    ? Math.round((stats.surveyMethods.manual / stats.confirmedMembers) * 100)
                    : 0
                  }
                  strokeColor="#52c41a"
                  size="small"
                  style={{ marginTop: 8 }}
                />
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      {/* Summary Section - แสดงแบบ x/total */}
      <Card style={{ backgroundColor: '#fafafa' }}>
        <Row gutter={16}>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">เปอร์เซ็นต์การยืนยัน</Text>
              <Title level={3} style={{ margin: '8px 0', color: '#52c41a' }}>
                {confirmedPercent}%
              </Title>
              <Text strong style={{ fontSize: 14 }}>
                {formatNumber(stats.confirmedMembers)} / {formatNumber(stats.totalMembers)}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>คน</Text>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">เปอร์เซ็นต์การรับเสื้อ</Text>
              <Title level={3} style={{ margin: '8px 0', color: '#faad14' }}>
                {receivedPercent}%
              </Title>
              <Text strong style={{ fontSize: 14 }}>
                {formatNumber(stats.receivedMembers)} / {formatNumber(stats.totalMembers)}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>คน</Text>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">คงเหลือที่ต้องจ่าย</Text>
              <Title level={3} style={{ margin: '8px 0', color: '#ff4d4f' }}>
                {formatNumber(stats.totalMembers - stats.receivedMembers)}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                คน
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Last Updated */}
      <div style={{ textAlign: 'right' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          📊 อัพเดตล่าสุด: {new Date().toLocaleString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </div>
    </Space>
  );
};

export default DashboardStats;