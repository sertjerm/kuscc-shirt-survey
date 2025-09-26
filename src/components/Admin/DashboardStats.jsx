import React from 'react';
import { Row, Col, Card, Statistic, Space } from 'antd';
import { TrophyOutlined, CheckCircleOutlined, ClockCircleOutlined, TeamOutlined } from '@ant-design/icons';

const StatCard = ({ icon, title, value, color }) => (
  <Card bordered={false} className="stat-card">
    <Space align="center" size="large">
      <div className="stat-card-icon" style={{ backgroundColor: color }}>
        {icon}
      </div>
      <div>
        <Statistic title={title} value={value} />
      </div>
    </Space>
  </Card>
);

const DashboardStats = ({ stats }) => {
  return (
    <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
      <Col xs={24} sm={12} lg={6}>
        <StatCard
          icon={<TrophyOutlined />}
          title="จ่ายแล้ววันนี้"
          value={stats.distributedToday}
          color="#d8f3dc"
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <StatCard
          icon={<CheckCircleOutlined />}
          title="ยืนยันแล้ว"
          value={stats.confirmed}
          color="#cfe2ff"
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <StatCard
          icon={<ClockCircleOutlined />}
          title="รอยืนยัน"
          value={stats.pending}
          color="#fff3cd"
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <StatCard
          icon={<TeamOutlined />}
          title="สมาชิกทั้งหมด"
          value={stats.total}
          color="#f8d7da"
        />
      </Col>
    </Row>
  );
};

export default DashboardStats;
