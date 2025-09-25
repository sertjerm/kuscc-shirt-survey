/*
 * Path: src/pages/AdminDashboard.jsx
 * Description: Final version with all content rendering functions restored.
 */
import React, { useState, useEffect } from "react";
import { useAppContext } from "../App";
import {
  Layout,
  Menu,
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Avatar,
  Space,
  Button,
  Drawer,
  Grid,
  Input,
  Table,
  Tag,
  message,
  Spin,
  Alert,
} from "antd";
import {
  DashboardOutlined,
  SearchOutlined,
  TeamOutlined,
  BarChartOutlined,
  SettingOutlined,
  MenuOutlined,
  UserOutlined,
  BellOutlined,
  LineChartOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import "../styles/AdminDashboard.css";
import { SearchMember, getShirtMemberList } from "../services/shirtApi";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const { Search } = Input;

const AdminDashboard = () => {
  const { user, logout } = useAppContext();
  const screens = useBreakpoint();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const [activeMenuKey, setActiveMenuKey] = useState("dashboard");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);
  const [memberList, setMemberList] = useState([]);

  useEffect(() => {
    setCollapsed(!screens.lg);
  }, [screens.lg]);

  // Fetch member list for dashboard/inventory
  useEffect(() => {
    setLoadingDashboard(true);
    setDashboardError(null);
    getShirtMemberList("ALL")
      .then((data) => {
        setMemberList(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setDashboardError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      })
      .finally(() => setLoadingDashboard(false));
  }, []);

  const handleSearch = async (memberCode) => {
    if (!memberCode) {
      message.warning("กรุณากรอกรหัสสมาชิก");
      return;
    }
    setLoadingSearch(true);
    setSearchResults([]);
    try {
      const data = await SearchMember(memberCode);
      setSearchResults([
        {
          key: data.MEMB_CODE,
          memberCode: data.MEMB_CODE,
          name: data.FULLNAME || data.DISPLAYNAME,
          selectedSize: data.SIZE_CODE,
          status: data.SIZE_CODE ? "ยืนยันขนาดแล้ว" : "ยังไม่ยืนยันขนาด",
          phone: data.MEMB_MOBILE,
          remarks: data.REMARKS,
        },
      ]);
    } catch (err) {
      message.error(err.message || "ไม่พบข้อมูลสมาชิก");
    } finally {
      setLoadingSearch(false);
    }
  };

  const menuItems = [
    { key: "dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
    { key: "search", icon: <SearchOutlined />, label: "ค้นหาสมาชิก" },
    { key: "inventory", icon: <BarChartOutlined />, label: "สต็อกสินค้า" },
    { key: "settings", icon: <SettingOutlined />, label: "ตั้งค่า" },
  ];

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

  const siderContent = (
    <>
      <div className="logo-container">
        <Title level={4} className="logo-text">
          {collapsed ? "A" : "Admin Dashboard"}
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

  // Mock inventory data for now
  const mockInventory = [
    {
      key: "XS",
      size: "XS",
      produced: 50,
      reserved: 35,
      distributed: 20,
      remaining: 30,
    },
    {
      key: "S",
      size: "S",
      produced: 100,
      reserved: 85,
      distributed: 60,
      remaining: 40,
    },
    {
      key: "M",
      size: "M",
      produced: 150,
      reserved: 120,
      distributed: 95,
      remaining: 55,
    },
    {
      key: "L",
      size: "L",
      produced: 120,
      reserved: 100,
      distributed: 75,
      remaining: 45,
    },
    {
      key: "XL",
      size: "XL",
      produced: 80,
      reserved: 65,
      distributed: 45,
      remaining: 35,
    },
    {
      key: "2XL",
      size: "2XL",
      produced: 60,
      reserved: 45,
      distributed: 30,
      remaining: 30,
    },
    {
      key: "3XL",
      size: "3XL",
      produced: 40,
      reserved: 30,
      distributed: 18,
      remaining: 22,
    },
    {
      key: "4XL",
      size: "4XL",
      produced: 30,
      reserved: 20,
      distributed: 12,
      remaining: 18,
    },
    {
      key: "5XL",
      size: "5XL",
      produced: 20,
      reserved: 15,
      distributed: 8,
      remaining: 12,
    },
    {
      key: "6XL",
      size: "6XL",
      produced: 15,
      reserved: 10,
      distributed: 5,
      remaining: 10,
    },
  ];

  const inventoryColumns = [
    {
      title: "ขนาด",
      dataIndex: "size",
      key: "size",
      render: (size) => <Tag color="blue">{size}</Tag>,
    },
    { title: "ผลิต", dataIndex: "produced", key: "produced", align: "right" },
    { title: "จอง", dataIndex: "reserved", key: "reserved", align: "right" },
    {
      title: "จ่ายแล้ว",
      dataIndex: "distributed",
      key: "distributed",
      align: "right",
    },
    {
      title: "คงเหลือ",
      dataIndex: "remaining",
      key: "remaining",
      align: "right",
      render: (text) => (
        <Text strong type={text < 50 ? "danger" : "success"}>
          {text}
        </Text>
      ),
    },
  ];

  const searchColumns = [
    { title: "รหัสสมาชิก", dataIndex: "memberCode", key: "memberCode" },
    { title: "ชื่อ", dataIndex: "name", key: "name" },
    {
      title: "ขนาดที่เลือก",
      dataIndex: "selectedSize",
      key: "selectedSize",
      render: (size) =>
        size ? (
          <Tag color="green">{size}</Tag>
        ) : (
          <Text type="secondary">N/A</Text>
        ),
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const color = status === "รับเสื้อแล้ว" ? "success" : "warning";
        const icon =
          status === "รับเสื้อแล้ว" ? (
            <CheckCircleOutlined />
          ) : (
            <ClockCircleOutlined />
          );
        return (
          <Tag icon={icon} color={color}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: "ดำเนินการ",
      key: "action",
      render: () => (
        <Button type="primary" size="small">
          จัดการ
        </Button>
      ),
    },
  ];

  const renderContent = () => {
    if (loadingDashboard) {
      return (
        <Spin
          tip="กำลังโหลดข้อมูล..."
          style={{ width: "100%", margin: "40px 0" }}
        />
      );
    }
    if (dashboardError) {
      return (
        <Alert
          type="error"
          message={dashboardError}
          showIcon
          style={{ margin: "40px 0" }}
        />
      );
    }
    // Calculate stats from memberList
    const distributedToday = memberList.filter(
      (m) => m.SURVEY_DATE && isTodayWcf(m.SURVEY_DATE)
    ).length;
    const pendingConfirmations = memberList.filter((m) => !m.SIZE_CODE).length;
    const lowStockItems = 0; // Placeholder, needs inventory API
    const totalMembers = memberList.length;

    function isTodayWcf(wcfDate) {
      // wcfDate: /Date(1758602879000+0700)/
      const m = String(wcfDate).match(/\d+/);
      if (!m) return false;
      const d = new Date(Number(m[0]));
      const now = new Date();
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }

    switch (activeMenuKey) {
      case "search":
        return (
          <Card title="ค้นหาสมาชิก" bordered={false}>
            <Search
              placeholder="กรอกรหัสสมาชิก หรือชื่อ..."
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
      case "inventory":
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
      case "settings":
        return (
          <Card title="ตั้งค่าระบบ" bordered={false} style={{ minHeight: 400 }}>
            <div className="placeholder-content">
              <SettingOutlined style={{ fontSize: 48, color: "#ccc" }} />
              <Text type="secondary">ส่วนการตั้งค่า (อยู่ระหว่างพัฒนา)</Text>
            </div>
          </Card>
        );
      case "dashboard":
      default:
        return (
          <>
            <Title level={3}>ภาพรวมวันนี้</Title>
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12} lg={6}>
                <StatCard
                  icon={<TrophyOutlined />}
                  title="จ่ายแล้ววันนี้"
                  value={distributedToday}
                  color="#d8f3dc"
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <StatCard
                  icon={<ClockCircleOutlined />}
                  title="รอยืนยัน"
                  value={pendingConfirmations}
                  color="#e2eafc"
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <StatCard
                  icon={<ExclamationCircleOutlined />}
                  title="สต็อกใกล้หมด"
                  value={lowStockItems}
                  color="#fde2e4"
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <StatCard
                  icon={<TeamOutlined />}
                  title="สมาชิกทั้งหมด"
                  value={totalMembers}
                  color="#cdeefc"
                />
              </Col>
            </Row>
            <Row gutter={[24, 24]} style={{ marginTop: "24px" }}>
              <Col xs={24} lg={16}>
                <Card
                  title="สถิติการแจกเสื้อ"
                  bordered={false}
                  style={{ height: "400px" }}
                >
                  <div className="placeholder-content">
                    <LineChartOutlined
                      style={{ fontSize: 48, color: "#ccc" }}
                    />
                    <Text type="secondary">
                      กราฟแสดงการแจกเสื้อ (อยู่ระหว่างพัฒนา)
                    </Text>
                  </div>
                </Card>
              </Col>
              <Col xs={24} lg={8}>
                <Card
                  title="ภาพรวมสต็อก"
                  bordered={false}
                  style={{ height: "400px" }}
                >
                  <div className="placeholder-content">
                    <BarChartOutlined style={{ fontSize: 48, color: "#ccc" }} />
                    <Text type="secondary">กราฟสต็อก (อยู่ระหว่างพัฒนา)</Text>
                  </div>
                </Card>
              </Col>
            </Row>
          </>
        );
    }
  };

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
              <Title
                level={4}
                style={{ margin: 0, flexGrow: 1, color: "#1d1d1f" }}
              >
                {menuItems.find((item) => item.key === activeMenuKey)?.label}
              </Title>
              <Space size="middle">
                <BellOutlined
                  style={{
                    fontSize: "20px",
                    cursor: "pointer",
                    color: "#48484a",
                  }}
                />
                <Avatar icon={<UserOutlined />} />
                <Text style={{ color: "#1d1d1f" }}>
                  {user?.name || "Admin"}
                </Text>
                <Button
                  type="text"
                  icon={<LogoutOutlined />}
                  onClick={logout}
                  danger
                  aria-label="Logout"
                />
              </Space>
            </div>
          </Header>
          <Content className="dashboard-content">{renderContent()}</Content>
        </Layout>
      </Layout>
    </div>
  );
};

export default AdminDashboard;
