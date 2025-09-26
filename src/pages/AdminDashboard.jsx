// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { useAppContext } from "../App";
import {
  Layout,
  Menu,
  Typography,
  Avatar,
  Space,
  Button,
  Drawer,
  Grid,
  Alert,
  Spin,
  Card,
  Form,
  message,
} from "antd";
import {
  DashboardOutlined,
  SearchOutlined,
  BarChartOutlined,
  SettingOutlined,
  MenuOutlined,
  UserOutlined,
  BellOutlined,
  LogoutOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import "../styles/AdminDashboard.css";

// Import components
import MembersList from "../components/Admin/MembersList";
import DashboardStats from "../components/Admin/DashboardStats";
import PickupModal from "../components/Admin/PickupModal";
import InventoryManagement from "../components/Admin/InventoryManagement";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const AdminDashboard = () => {
  const { user, logout } = useAppContext();
  const screens = useBreakpoint();

  // UI State
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const [activeMenuKey, setActiveMenuKey] = useState("dashboard");
  
  // Dashboard State
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    distributedToday: 0
  });
  
  // Pickup Management State
  const [selectedMember, setSelectedMember] = useState(null);
  const [pickupModalVisible, setPickupModalVisible] = useState(false);
  const [pickupForm] = Form.useForm();

  useEffect(() => {
    setCollapsed(!screens.lg);
  }, [screens.lg]);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    setLoadingDashboard(true);
    try {
      // เรียก API เพื่อได้สถิติ dashboard
      // const stats = await getDashboardStats();
      // setDashboardStats(stats);
      
      // Mock data for now
      setDashboardStats({
        total: 1250,
        confirmed: 980,
        pending: 270,
        distributedToday: 45
      });
    } catch (error) {
      setDashboardError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoadingDashboard(false);
    }
  };

  const handlePickupClick = (record) => {
    setSelectedMember(record);
    pickupForm.setFieldsValue({
      memberCode: record.memberCode,
      selectedSize: record.selectedSize,
      pickupType: "self",
    });
    setPickupModalVisible(true);
  };

  const handlePickupSubmit = async (values) => {
    try {
      // เรียก API เพื่อบันทึกการรับเสื้อ
      console.log("Pickup submitted:", values);
      // await submitPickup(values);
      
      message.success("บันทึกการรับเสื้อสำเร็จ");
      setPickupModalVisible(false);
      pickupForm.resetFields();
      setSelectedMember(null);
      
      // Refresh stats
      loadDashboardStats();
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  // Menu items - แก้ key ให้ตรงกัน
  const menuItems = [
    { key: "dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
    { key: "members", icon: <SearchOutlined />, label: "ค้นหาและรับเสื้อ" },
    { key: "inventory", icon: <BarChartOutlined />, label: "จัดการสต็อก" },
    { key: "history", icon: <HistoryOutlined />, label: "ประวัติการจ่าย" },
    { key: "settings", icon: <SettingOutlined />, label: "ตั้งค่า" },
  ];

  // Render content based on active menu
  const renderContent = () => {
    switch (activeMenuKey) {
      case "members":
        return <MembersList onPickupClick={handlePickupClick} />;

      case "inventory":
        return <InventoryManagement />;

      case "history":
        return (
          <Card title="ประวัติการรับเสื้อ" bordered={false}>
            <div style={{ textAlign: "center", padding: 48 }}>
              <Text type="secondary">ส่วนประวัติการรับเสื้อ (อยู่ระหว่างพัฒนา)</Text>
            </div>
          </Card>
        );

      case "settings":
        return (
          <Card title="ตั้งค่าระบบ" bordered={false}>
            <div style={{ textAlign: "center", padding: 48 }}>
              <Text type="secondary">ส่วนการตั้งค่า (อยู่ระหว่างพัฒนา)</Text>
            </div>
          </Card>
        );

      case "dashboard":
      default:
        return (
          <>
            <Title level={3}>ภาพรวมวันนี้</Title>
            <DashboardStats stats={dashboardStats} />

            {dashboardError && (
              <Alert
                message="เกิดข้อผิดพลาด"
                description={dashboardError}
                type="error"
                showIcon
                style={{ marginBottom: 24 }}
              />
            )}

            {loadingDashboard ? (
              <Card>
                <div style={{ textAlign: "center", padding: 48 }}>
                  <Spin size="large" />
                  <div style={{ marginTop: 16 }}>กำลังโหลดข้อมูล...</div>
                </div>
              </Card>
            ) : (
              <MembersList onPickupClick={handlePickupClick} />
            )}
          </>
        );
    }
  };

  // Sidebar content
  const siderContent = (
    <>
      <div className="logo-container">
        <Title level={4} className="logo-text">
          {collapsed ? "KUSCC" : "KUSCC Admin"}
        </Title>
      </div>
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[activeMenuKey]}
        items={menuItems}
        onClick={({ key }) => {
          setActiveMenuKey(key);
          if (!screens.lg) {
            setMobileDrawerVisible(false);
          }
        }}
      />
    </>
  );

  return (
    <div className="admin-dashboard-layout">
      <Layout style={{ minHeight: "100vh" }}>
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
                <BellOutlined style={{ fontSize: "20px", cursor: "pointer", color: "#48484a" }} />
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

      {/* Pickup Modal */}
      <PickupModal
        visible={pickupModalVisible}
        onCancel={() => {
          setPickupModalVisible(false);
          pickupForm.resetFields();
          setSelectedMember(null);
        }}
        onSubmit={handlePickupSubmit}
        selectedMember={selectedMember}
        form={pickupForm}
      />
    </div>
  );
};

export default AdminDashboard;