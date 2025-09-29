// src/pages/AdminDashboard.jsx
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
  Form,
  message,
  Modal,
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
} from "@ant-design/icons";
import "../styles/AdminDashboard.css";

// Import components
import MembersList from "../components/Admin/MembersList";
import DashboardStats from "../components/Admin/DashboardStats";
import PickupModal from "../components/Admin/PickupModal";
import InventoryManagement from "../components/Admin/InventoryManagement";
import { getDashboardStats, submitPickup } from "../services/shirtApi";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const AdminDashboard = () => {
  const { user, logout } = useAppContext();
  const navigate = useNavigate();
  const screens = useBreakpoint();

  // UI State
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const [activeMenuKey, setActiveMenuKey] = useState("dashboard");

  // Dashboard State
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);

  // Pickup Management State
  const [selectedMember, setSelectedMember] = useState(null);
  const [pickupModalVisible, setPickupModalVisible] = useState(false);
  const [pickupForm] = Form.useForm();

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    setCollapsed(!screens.lg);
  }, [screens.lg]);

  // Load dashboard stats when dashboard page is active
  useEffect(() => {
    if (activeMenuKey === "dashboard") {
      loadDashboardStats();
    }
  }, [activeMenuKey]);

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== "admin" && user.USER_ROLE !== "admin") {
      message.error("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
      navigate("/member");
    }
  }, [user, navigate]);

  // Load dashboard statistics
  const loadDashboardStats = async () => {
    setLoadingDashboard(true);
    setDashboardError(null);

    try {
      console.log("📊 Loading dashboard stats...");
      const stats = await getDashboardStats();
      setDashboardStats(stats);
      console.log("✅ Dashboard stats loaded:", stats);
    } catch (err) {
      console.error("❌ Dashboard stats error:", err);
      setDashboardError(err.message || "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Handle pickup button click from MembersList
  const handlePickupClick = (member) => {
    console.log("📦 Opening pickup modal for:", member);
    setSelectedMember(member);
    setPickupModalVisible(true);

    // Pre-fill form with member data
    pickupForm.setFieldsValue({
      sizeCode: member.sizeCode || "",
      receiverType: "SELF",
      receiverName: "",
      remarks: "",
    });
  };

  // Handle pickup submission
  const handlePickupSubmit = async (pickupData) => {
    try {
      console.log("📤 Submitting pickup:", pickupData);

      await submitPickup(pickupData);

      message.success("บันทึกการรับเสื้อสำเร็จ");

      // Close modal and reset
      setPickupModalVisible(false);
      pickupForm.resetFields();
      setSelectedMember(null);

      // Refresh stats if on dashboard
      if (activeMenuKey === "dashboard") {
        loadDashboardStats();
      }

      return true;
    } catch (error) {
      console.error("❌ Pickup submit error:", error);
      message.error(error.message || "เกิดข้อผิดพลาดในการบันทึก");
      return false;
    }
  };

  // Handle logout
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

  // Menu items
  const menuItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: "ภาพรวม",
    },
    {
      key: "members",
      icon: <SearchOutlined />,
      label: "ค้นหาและจ่ายเสื้อ",
    },
    {
      key: "inventory",
      icon: <BarChartOutlined />,
      label: "จัดการสต็อก",
    },
    {
      key: "history",
      icon: <HistoryOutlined />,
      label: "ประวัติการจ่าย",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "ตั้งค่า",
    },
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
          <div>
            <Title level={3} style={{ marginBottom: 24 }}>
              ประวัติการรับเสื้อ
            </Title>
            <Alert
              message="ฟีเจอร์นี้อยู่ระหว่างการพัฒนา"
              description="ส่วนประวัติการรับเสื้อจะพร้อมใช้งานในเร็วๆ นี้"
              type="info"
              showIcon
            />
          </div>
        );

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
                onClick={loadDashboardStats}
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

            <DashboardStats
              stats={dashboardStats}
              loading={loadingDashboard}
            />
          </div>
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
        {/* Desktop Sidebar */}
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
            {/* Mobile Menu Button */}
            {!screens.lg && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setMobileDrawerVisible(true)}
                className="mobile-menu-button"
              />
            )}

            {/* Header Content */}
            <div className="header-content">
              <Title
                level={4}
                style={{ margin: 0, flexGrow: 1, color: "#1d1d1f" }}
              >
                {menuItems.find((item) => item.key === activeMenuKey)?.label}
              </Title>

              {/* User Info & Actions */}
              <Space size="middle">
                <BellOutlined
                  style={{
                    fontSize: "20px",
                    cursor: "pointer",
                    color: "#48484a",
                  }}
                />
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#1890ff" }} />
                <Text style={{ color: "#1d1d1f" }}>
                  {user?.displayName || user?.name || "Admin"}
                </Text>
                <Button
                  type="text"
                  icon={<LogoutOutlined />}
                  onClick={handleLogout}
                  danger
                  aria-label="Logout"
                >
                  {screens.md && "ออกจากระบบ"}
                </Button>
              </Space>
            </div>
          </Header>

          {/* Main Content */}
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
        onSuccess={handlePickupSubmit}
        selectedMember={selectedMember}
      />
    </div>
  );
};

export default AdminDashboard;