/*
 * Path: src/pages/AdminDashboard.jsx
 * Description: Final version with content rendering functions restored.
 */
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../App';
import {
  Layout, Menu, Card, Row, Col, Statistic, Typography, Avatar, Space, Button, Drawer, Grid, Input, Table, Tag, message
} from 'antd';
import {
  DashboardOutlined, SearchOutlined, TeamOutlined, BarChartOutlined, SettingOutlined, MenuOutlined,
  UserOutlined, BellOutlined, LineChartOutlined, LogoutOutlined, CheckCircleOutlined, ClockCircleOutlined,
  ExclamationCircleOutlined, TrophyOutlined
} from '@ant-design/icons';
import '../styles/AdminDashboard.css';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const { Search } = Input;

const mockInventory = [
    { key: 'XS', size: "XS", produced: 50, reserved: 35, distributed: 20, remaining: 30 },
    { key: 'S', size: "S", produced: 100, reserved: 85, distributed: 60, remaining: 40 },
    { key: 'M', size: "M", produced: 150, reserved: 120, distributed: 95, remaining: 55 },
    { key: 'L', size: "L", produced: 120, reserved: 100, distributed: 75, remaining: 45 },
    { key: 'XL', size: "XL", produced: 80, reserved: 65, distributed: 45, remaining: 35 },
];
  
const mockRelevantStats = {
    distributedToday: 42,
    pendingConfirmations: 18,
    lowStockItems: 3,
    totalMembers: 1247,
};

const AdminDashboard = () => {
    const { user, logout } = useAppContext();
    const screens = useBreakpoint();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
    const [activeMenuKey, setActiveMenuKey] = useState('dashboard');
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
  
    useEffect(() => {
      setCollapsed(!screens.lg);
    }, [screens.lg]);
  
    const handleSearch = async (memberCode) => {
        if (!memberCode || memberCode.length !== 6) {
          message.warning("กรุณากรอกเลขสมาชิก 6 หลัก");
          return;
        }
        setLoadingSearch(true);
        setTimeout(() => {
          const mockMember = {
            key: memberCode,
            memberCode,
            name: `สมาชิก ${memberCode}`,
            status: memberCode.endsWith("6") ? "รับเสื้อแล้ว" : "ยังไม่ยืนยันขนาด",
            selectedSize: memberCode.endsWith("6") ? "M" : null,
          };
          setSearchResults([mockMember]);
          setLoadingSearch(false);
        }, 1000);
    };

    const menuItems = [
        { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
        { key: 'search', icon: <SearchOutlined />, label: 'ค้นหาสมาชิก' },
        { key: 'inventory', icon: <BarChartOutlined />, label: 'สต็อกสินค้า' },
        { key: 'settings', icon: <SettingOutlined />, label: 'ตั้งค่า' },
    ];

    const StatCard = ({ icon, title, value, color }) => (
        <Card bordered={false} className="stat-card">
          <Space align="center" size="large">
            <div className="stat-card-icon" style={{ backgroundColor: color }}>{icon}</div>
            <div>
              <Statistic title={title} value={value} />
            </div>
          </Space>
        </Card>
    );

    const siderContent = (
        <>
          <div className="logo-container">
            <Title level={4} className="logo-text">
              {collapsed ? 'A' : 'Admin Dashboard'}
            </Title>
          </div>
          <Menu
            theme="light"
            mode="inline"
            selectedKeys={[activeMenuKey]}
            onClick={({ key }) => {
              setActiveMenuKey(key);
              if (!screens.lg) setMobileDrawerVisible(false);
            }}
            items={menuItems}
          />
        </>
    );
      
    const inventoryColumns = [
        { title: 'ขนาด', dataIndex: 'size', key: 'size', render: (size) => <Tag color="blue">{size}</Tag> },
        { title: 'ผลิต', dataIndex: 'produced', key: 'produced', align: 'right' },
        { title: 'จอง', dataIndex: 'reserved', key: 'reserved', align: 'right' },
        { title: 'จ่ายแล้ว', dataIndex: 'distributed', key: 'distributed', align: 'right' },
        { title: 'คงเหลือ', dataIndex: 'remaining', key: 'remaining', align: 'right', render: (text) => <Text strong type={text < 50 ? 'danger' : 'success'}>{text}</Text> },
    ];
      
    const searchColumns = [
        { title: 'รหัสสมาชิก', dataIndex: 'memberCode', key: 'memberCode' },
        { title: 'ชื่อ', dataIndex: 'name', key: 'name' },
        { title: 'ขนาดที่เลือก', dataIndex: 'selectedSize', key: 'selectedSize', render: (size) => size ? <Tag color="green">{size}</Tag> : <Text type="secondary">N/A</Text> },
        { title: 'สถานะ', dataIndex: 'status', key: 'status', render: (status) => {
            const color = status === 'รับเสื้อแล้ว' ? 'success' : 'warning';
            const icon = status === 'รับเสื้อแล้ว' ? <CheckCircleOutlined /> : <ClockCircleOutlined />;
            return <Tag icon={icon} color={color}>{status}</Tag>;
        }},
        { title: 'ดำเนินการ', key: 'action', render: () => <Button type="primary" size="small">จัดการ</Button>}
    ];

    // **** THIS SECTION WAS MISSING ****
    const renderContent = () => {
        switch (activeMenuKey) {
          case 'search':
            return (
              <Card title="ค้นหาสมาชิก" bordered={false}>
                <Search
                  placeholder="กรอกเลขสมาชิก 6 หลัก..."
                  enterButton="ค้นหา"
                  size="large"
                  onSearch={handleSearch}
                  loading={loadingSearch}
                  style={{ marginBottom: 24 }}
                />
                <Table
                  dataSource={searchResults}
                  columns={searchColumns}
                  loading={loadingSearch}
                  pagination={false}
                  scroll={{ x: true }}
                />
              </Card>
            );
          case 'inventory':
            return (
                <Card title="ภาพรวมสต็อกสินค้า" bordered={false}>
                  <Table
                    dataSource={mockInventory}
                    columns={inventoryColumns}
                    pagination={false}
                    scroll={{ x: true }}
                  />
                </Card>
            );
          case 'settings':
             return (
                <Card title="ตั้งค่าระบบ" bordered={false} style={{ minHeight: 400 }}>
                    <div className="placeholder-content">
                      <SettingOutlined style={{ fontSize: 48, color: '#ccc' }} />
                      <Text type="secondary">ส่วนการตั้งค่า (อยู่ระหว่างพัฒนา)</Text>
                    </div>
                  </Card>
             );
          case 'dashboard':
          default:
            return (
              <>
                <Title level={3}>ภาพรวมวันนี้</Title>
                <Row gutter={[24, 24]}>
                  <Col xs={24} sm={12} lg={6}>
                    <StatCard icon={<TrophyOutlined />} title="จ่ายแล้ววันนี้" value={mockRelevantStats.distributedToday} color="#d8f3dc"/>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <StatCard icon={<ClockCircleOutlined />} title="รอยืนยัน" value={mockRelevantStats.pendingConfirmations} color="#e2eafc"/>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <StatCard icon={<ExclamationCircleOutlined />} title="สต็อกใกล้หมด" value={mockRelevantStats.lowStockItems} color="#fde2e4"/>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <StatCard icon={<TeamOutlined />} title="สมาชิกทั้งหมด" value={mockRelevantStats.totalMembers} color="#cdeefc"/>
                  </Col>
                </Row>
                <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                  <Col xs={24} lg={16}>
                    <Card title="สถิติการแจกเสื้อ" bordered={false} style={{ height: '400px' }}>
                      <div className="placeholder-content">
                        <LineChartOutlined style={{ fontSize: 48, color: '#ccc' }} />
                        <Text type="secondary">กราฟแสดงการแจกเสื้อ (อยู่ระหว่างพัฒนา)</Text>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} lg={8}>
                    <Card title="ภาพรวมสต็อก" bordered={false} style={{ height: '400px' }}>
                      <div className="placeholder-content">
                        <BarChartOutlined style={{ fontSize: 48, color: '#ccc' }} />
                        <Text type="secondary">กราฟสต็อก (อยู่ระหว่างพัฒนา)</Text>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </>
            );
        }
    };
    // ************************************
  
    return (
        <div className="admin-dashboard-page">
            <Layout className="admin-dashboard-layout">
                {screens.lg ? (
                <Sider
                    collapsible
                    collapsed={collapsed}
                    onCollapse={(value) => setCollapsed(value)}
                    className="desktop-sider"
                    width={250}
                >
                    {siderContent}
                </Sider>
                ) : (
                <Drawer
                    placement="left"
                    onClose={() => setMobileDrawerVisible(false)}
                    open={mobileDrawerVisible}
                    bodyStyle={{ padding: 0 }}
                    width={250}
                    className="mobile-drawer"
                >
                    {siderContent}
                </Drawer>
                )}
                <Layout className="site-layout">
                    <Header className="dashboard-header">
                        {!screens.lg && (
                        <Button
                            type="text"
                            icon={<MenuOutlined />}
                            onClick={() => setMobileDrawerVisible(true)}
                            className="mobile-menu-button"
                        />
                        )}
                        <div className="header-content">
                            <Title level={4} style={{ margin: 0, flexGrow: 1, color: '#1d1d1f' }}>
                                {menuItems.find(item => item.key === activeMenuKey)?.label}
                            </Title>
                            <Space size="middle">
                                <BellOutlined style={{fontSize: '20px', cursor: 'pointer', color: '#48484a'}} />
                                <Avatar icon={<UserOutlined />} />
                                <Text style={{color: '#1d1d1f'}}>{user?.name || 'Admin'}</Text>
                                <Button type="text" icon={<LogoutOutlined />} onClick={logout} danger aria-label="Logout" />
                            </Space>
                        </div>
                    </Header>
                    <Content className="dashboard-content">
                        {renderContent()}
                    </Content>
                </Layout>
            </Layout>
        </div>
    );
};
  
export default AdminDashboard;