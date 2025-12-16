// src/pages/AdminDashboard.jsx - UPDATED WITH STOCK LOGS
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Modal,
  message,
  Dropdown,
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
  ReloadOutlined,
  MoreOutlined,
  FileTextOutlined,
  EnvironmentOutlined, // ✅ เพิ่ม import นี้
} from "@ant-design/icons";
import "../styles/AdminDashboard.css";

// Import components
import MembersList from "../components/Admin/MembersList";
import DashboardStats from "../components/Admin/DashboardStats";
import InventoryManagement from "../components/Admin/InventoryManagement";
import StockLogsHistory from "../components/Admin/StockLogsHistory";
import ShirtDeptReport from "../components/Admin/ShirtDeptReport"; // ✅ เพิ่ม
import DeliveryReport from "../components/Admin/DeliveryReport"; // ✅ เพิ่ม import
import { getDashboardStats } from "../services/shirtApi";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const AdminDashboard = () => {
  const { user, logout } = useAppContext();
  const navigate = useNavigate();
  const screens = useBreakpoint();

  // UI State
  const [collapsed, setCollapsed] = useState(true);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const [activeMenuKey, setActiveMenuKey] = useState("dashboard");

  // Dashboard State
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);

  // ✅ Lifted State for Report (Caching)
  const [shirtReportData, setShirtReportData] = useState([]);
  const [shirtReportSizes, setShirtReportSizes] = useState([]);

  useEffect(() => {
    setCollapsed(true);
  }, []);

  useEffect(() => {
    if (activeMenuKey === "dashboard") {
      loadDashboardStats(false); // Default: Don't force refresh if cached
    }
  }, [activeMenuKey]);

  useEffect(() => {
    if (user && user.role !== "admin" && user.USER_ROLE !== "admin") {
      message.error("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
      navigate("/member");
    }
  }, [user, navigate]);

  const loadDashboardStats = async (forceRefresh = false) => {
    // ✅ Cache Check
    if (!forceRefresh && dashboardStats) {
      return;
    }

    setLoadingDashboard(true);
    setDashboardError(null);
    try {
      const stats = await getDashboardStats();
      setDashboardStats(stats);
    } catch (err) {
      console.error("Dashboard stats error:", err);
      setDashboardError(err.message || "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoadingDashboard(false);
    }
  };

  const handleLogout = () => {
    Modal.confirm({
      title: "ออกจากระบบ",
      content: "คุณต้องการออกจากระบบหรือไม่?",
      okText: "ออกจากระบบ",
      cancelText: "ยกเลิก",
      onOk: () => {
        logout();
        navigate("/");
      },
    });
  };

  // ✅ เพิ่มไอคอนและข้อความที่ชัดเจนขึ้น
  const menuItems = [
    { key: "dashboard", icon: <DashboardOutlined />, label: "ภาพรวม" },
    { key: "members", icon: <SearchOutlined />, label: "ค้นหาและจ่ายเสื้อ" },
    { key: "inventory", icon: <BarChartOutlined />, label: "จัดการสต็อก" },
    {
      key: "history",
      icon: <HistoryOutlined />,
      label: "ประวัติการจัดการสต๊อก",
    },
    { key: "reports", icon: <FileTextOutlined />, label: "รายงานแยกหน่วยงาน" },
    {
      key: "delivery",
      icon: <EnvironmentOutlined />,
      label: "ช่องทางจัดส่งกลุ่มเกษียณ",
    }, // ✅ เพิ่มเมนูใหม่
    { key: "settings", icon: <SettingOutlined />, label: "ตั้งค่า" },
  ];

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: user?.displayName || user?.name || "Admin",
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "ออกจากระบบ",
      danger: true,
      onClick: handleLogout,
    },
  ];

  // ✅ เพิ่ม case "delivery"
  const renderContent = () => {
    switch (activeMenuKey) {
      case "members":
        // ✅ Pass callback to refresh dashboard when data changes
        return <MembersList onDataChange={() => loadDashboardStats(true)} />;

      case "inventory":
        return <InventoryManagement />;

      case "reports":
        return (
          <ShirtDeptReport
            // ✅ Pass lifted state for caching
            cachedData={shirtReportData}
            setCachedData={setShirtReportData}
            cachedSizes={shirtReportSizes}
            setCachedSizes={setShirtReportSizes}
          />
        );

      case "delivery":
        return <DeliveryReport />; // ✅ เพิ่มการแสดง component ใหม่

      case "history":
        return <StockLogsHistory />;

      case "settings":
        return (
          <div>
            <Title level={3} style={{ marginBottom: 24 }}>
              ตั้งค่าระบบ
            </Title>
            <Alert
              message="ฟีเจอร์นี้อยู่ระหว่างการพัฒนา"
              description="ส่วนการตั้งค่าจะพร้อมใช้งานในเร็วๆ นี้"
              type="info"
              showIcon
            />
          </div>
        );

      case "dashboard":
      default:
        return (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <Title level={3} style={{ margin: 0 }}>
                ภาพรวมระบบจองเสื้อแจ็คเก็ต
              </Title>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => loadDashboardStats(true)}
                loading={loadingDashboard}
              >
                รีเฟรช
              </Button>
            </div>

            {dashboardError && (
              <Alert
                message="เกิดข้อผิดพลาด"
                description={dashboardError}
                type="error"
                showIcon
                closable
                style={{ marginBottom: 24 }}
                onClose={() => setDashboardError(null)}
              />
            )}

            <DashboardStats stats={dashboardStats} loading={loadingDashboard} />
          </div>
        );
    }
  };

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
          if (!screens.lg) setMobileDrawerVisible(false);
        }}
      />
    </>
  );

  return (
    <div className="admin-dashboard-layout">
      <Layout style={{ minHeight: "100vh" }}>
        {/* Desktop Sidebar */}
        {screens.lg ? (
          <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            className="desktop-sider"
            width={250}
          >
            {siderContent}
          </Sider>
        ) : (
          /* Mobile Drawer */
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

        {/* Main Layout */}
        <Layout className="site-layout">
          {/* Header */}
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
              <Title level={4} className="header-title">
                {menuItems.find((item) => item.key === activeMenuKey)?.label}
              </Title>

              <Space size="middle" className="header-actions">
                {screens.md && <BellOutlined className="header-icon" />}

                {screens.md ? (
                  <>
                    <Avatar
                      icon={<UserOutlined />}
                      style={{ backgroundColor: "#1890ff" }}
                    />
                    {screens.lg && (
                      <Text className="header-username">
                        {user?.displayName || user?.name || "Admin"}
                      </Text>
                    )}
                    <Button
                      type="text"
                      icon={<LogoutOutlined />}
                      onClick={handleLogout}
                      danger
                      className="logout-button"
                    >
                      {screens.lg && "ออกจากระบบ"}
                    </Button>
                  </>
                ) : (
                  <Dropdown menu={{ items: userMenuItems }} trigger={["click"]}>
                    <Button
                      type="text"
                      icon={<MoreOutlined />}
                      className="user-menu-button"
                    />
                  </Dropdown>
                )}
              </Space>
            </div>
          </Header>

          {/* Main Content */}
          <Content className="dashboard-content">{renderContent()}</Content>
        </Layout>
      </Layout>
    </div>
  );
};

export default AdminDashboard;
