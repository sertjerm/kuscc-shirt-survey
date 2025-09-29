// src/components/Admin/DashboardStats.jsx
import React from 'react';
import { Row, Col, Card, Statistic, Progress, Table, Tag } from 'antd';
import { 
  TrophyOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  TeamOutlined,
  ShoppingOutlined 
} from '@ant-design/icons';

const StatCard = ({ icon, title, value, subtitle, color, progress }) => (
  <Card bordered={false} hoverable style={{ height: '100%' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
      <div 
        style={{ 
          backgroundColor: color, 
          borderRadius: '12px',
          padding: '16px',
          fontSize: '24px',
          color: '#fff',
          flexShrink: 0
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <Statistic 
          title={title} 
          value={value}
          valueStyle={{ fontSize: '32px', fontWeight: '600' }}
        />
        {subtitle && (
          <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>
            {subtitle}
          </div>
        )}
        {progress !== undefined && (
          <Progress 
            percent={progress} 
            size="small" 
            strokeColor={color}
            style={{ marginTop: '8px' }}
            showInfo={false}
          />
        )}
      </div>
    </div>
  </Card>
);

const DashboardStats = ({ stats }) => {
  // คำนวณเปอร์เซ็นต์
  const confirmedPercent = stats.total > 0 
    ? Math.round((stats.confirmed / stats.total) * 100) 
    : 0;
  
  const receivedPercent = stats.confirmed > 0 
    ? Math.round((stats.received / stats.confirmed) * 100) 
    : 0;

  // ข้อมูลสำหรับตารางสต็อก
  const stockColumns = [
    {
      title: 'ขนาด',
      dataIndex: 'size',
      key: 'size',
      align: 'center',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'ผลิต',
      dataIndex: 'produced',
      key: 'produced',
      align: 'center',
    },
    {
      title: 'จอง',
      dataIndex: 'reserved',
      key: 'reserved',
      align: 'center',
      render: (value) => value > 0 ? value : '-'
    },
    {
      title: 'รับแล้ว',
      dataIndex: 'received',
      key: 'received',
      align: 'center',
      render: (value) => value > 0 ? value : '-'
    },
    {
      title: 'คงเหลือ',
      dataIndex: 'remaining',
      key: 'remaining',
      align: 'center',
      render: (value, record) => {
        const isLow = value <= 50;
        return (
          <Tag color={isLow ? 'red' : 'green'}>
            <strong>{value}</strong>
          </Tag>
        );
      }
    }
  ];

  return (
    <>
      {/* สถิติหลัก */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<TrophyOutlined />}
            title="จ่ายแล้ววันนี้"
            value={stats.distributedToday || 0}
            subtitle={`รวมทั้งหมด ${stats.received || 0} คน`}
            color="#52c41a"
          />
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<CheckCircleOutlined />}
            title="ยืนยันแล้ว"
            value={stats.confirmed || 0}
            subtitle={`${confirmedPercent}% ของสมาชิกทั้งหมด`}
            color="#1890ff"
            progress={confirmedPercent}
          />
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<ClockCircleOutlined />}
            title="รอยืนยัน"
            value={stats.pending || 0}
            subtitle={`${100 - confirmedPercent}% ยังไม่ยืนยัน`}
            color="#fa8c16"
          />
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<TeamOutlined />}
            title="สมาชิกทั้งหมด"
            value={stats.total || 0}
            subtitle="ที่มีสิทธิ์รับเสื้อ"
            color="#722ed1"
          />
        </Col>
      </Row>

      {/* ตารางสต็อกเสื้อ */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingOutlined />
                <span>สรุปข้อมูลสต็อกเสื้อ</span>
              </div>
            }
            bordered={false}
          >
            <Table
              columns={stockColumns}
              dataSource={stats.inventory || []}
              pagination={false}
              size="middle"
              rowKey="size"
              style={{ marginTop: 16 }}
            />
            
            <div style={{ 
              marginTop: 16, 
              padding: '12px 16px', 
              background: '#fff7e6',
              borderRadius: '6px',
              border: '1px solid #ffe58f',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>⚠️</span>
              <span style={{ color: '#ad6800', fontSize: '14px' }}>
                <strong>คำเตือน:</strong> ขนาดที่มีสต็อกคงเหลือ ≤ 50 ตัว จะแสดงเป็นสีแดง
              </span>
            </div>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default DashboardStats;