// src/components/Admin/DashboardStats.jsx
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Progress, Space, Typography, Spin, Alert } from 'antd';
import { 
  TeamOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  GiftOutlined,
  TrophyOutlined,
  RiseOutlined
} from '@ant-design/icons';
import { getDashboardStats } from '../../services/shirtApi';

const { Title, Text } = Typography;

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
          <button onClick={loadStats}>ลองอีกครั้ง</button>
        }
      />
    );
  }

  if (!stats) {
    return null;
  }

  // Calculate percentages
  const confirmedPercent = stats.totalMembers > 0 
    ? Math.round((stats.confirmedMembers / stats.totalMembers) * 100) 
    : 0;
  
  const receivedPercent = stats.totalMembers > 0 
    ? Math.round((stats.receivedMembers / stats.totalMembers) * 100) 
    : 0;

  const pendingPercent = 100 - confirmedPercent;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Overview Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="สมาชิกทั้งหมด"
              value={stats.totalMembers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="ยืนยันขนาดแล้ว"
              value={stats.confirmedMembers}
              prefix={<CheckCircleOutlined />}
              suffix={`/ ${stats.totalMembers}`}
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
          <Card>
            <Statistic
              title="รับเสื้อแล้ว"
              value={stats.receivedMembers}
              prefix={<GiftOutlined />}
              suffix={`/ ${stats.totalMembers}`}
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
          <Card>
            <Statistic
              title="ยังไม่ยืนยัน"
              value={stats.pendingMembers}
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
            title={
              <Space>
                <TrophyOutlined />
                <span>ขนาดที่ได้รับความนิยม</span>
              </Space>
            }
          >
            {stats.popularSizes && stats.popularSizes.length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                {stats.popularSizes.slice(0, 5).map((item, index) => (
                  <div key={item.size} style={{ width: '100%' }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text strong>
                        {index === 0 && '🥇 '}
                        {index === 1 && '🥈 '}
                        {index === 2 && '🥉 '}
                        ขนาด {item.size}
                      </Text>
                      <Text>{item.count} คน</Text>
                    </Space>
                    <Progress 
                      percent={Math.round((item.count / stats.confirmedMembers) * 100)} 
                      size="small"
                      showInfo={false}
                      strokeColor={index === 0 ? '#faad14' : '#1890ff'}
                    />
                  </div>
                ))}
              </Space>
            ) : (
              <Text type="secondary">ยังไม่มีข้อมูล</Text>
            )}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card 
            title={
              <Space>
                <RiseOutlined />
                <span>สถิติการจ่ายเสื้อ</span>
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>รับด้วยตนเอง:</Text>
                  <Text strong style={{ color: '#52c41a' }}>
                    {stats.selfReceived || 0} คน
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
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>รับแทน:</Text>
                  <Text strong style={{ color: '#fa8c16' }}>
                    {stats.proxyReceived || 0} คน
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
                padding: '12px', 
                backgroundColor: '#f0f5ff', 
                borderRadius: 4,
                marginTop: 8
              }}>
                <Space direction="vertical" size={0}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    อัตราการจ่าย
                  </Text>
                  <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                    {receivedPercent}%
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    จากทั้งหมด {stats.totalMembers} คน
                  </Text>
                </Space>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Survey Method Stats */}
      {stats.surveyMethods && (
        <Card title="สถิติช่องทางการสำรวจ">
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="สำรวจออนไลน์"
                value={stats.surveyMethods.online || 0}
                suffix="คน"
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="บันทึกด้วยตนเอง (Manual)"
                value={stats.surveyMethods.manual || 0}
                suffix="คน"
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Last Updated */}
      <div style={{ textAlign: 'right' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          📊 อัพเดตล่าสุด: {new Date().toLocaleString('th-TH')}
        </Text>
      </div>
    </Space>
  );
};

export default DashboardStats;