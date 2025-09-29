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
import { getShirtMemberListPaged, getDashboardStats } from "../services/shirtApi";

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
    received: 0,
    distributedToday: 0,
    inventory: []
  });
  
  // Pickup Management State
  const [selectedMember, setSelectedMember] = useState(null);
  const [pickupModalVisible, setPickupModalVisible] = useState(false);
  const [pickupForm] = Form.useForm();

  useEffect(() => {
    setCollapsed(!screens.lg);
  }, [screens.lg]);

  useEffect(() => {
    if (activeMenuKey === "dashboard") {
      loadDashboardStats();
    }
  }, [activeMenuKey]);

  // ฟังก์ชันคำนวณสถิติจาก API data
  const calculateStats = (data) => {
    const total = data.length;
    const confirmed = data.filter(m => m.SIZE_CODE).length;
    const pending = total - confirmed;
    const received = data.filter(m => m.RECEIVED_DATE).length;
    
    // นับจำนวนแต่ละไซซ์
    const sizeCount = {};
    const sizeReceived = {};
    
    data.forEach(member => {
      if (member.SIZE_CODE) {
        sizeCount[member.SIZE_CODE] = (sizeCount[member.SIZE_CODE] || 0) + 1;
        if (member.RECEIVED_DATE) {
          sizeReceived[member.SIZE_CODE] = (sizeReceived[member.SIZE_CODE] || 0) + 1;
        }
      }
    });

    // สร้างข้อมูลสต็อก - ใช้ข้อมูลจริงจาก API ร่วมกับ mock data
    const sizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL'];
    const mockProduced = {
      'XS': 50, 'S': 100, 'M': 150, 'L': 200, 'XL': 150,
      '2XL': 100, '3XL': 80, '4XL': 50, '5XL': 30, '6XL': 20
    };
    
    const inventory = sizes.map(size => {
      const reserved = sizeCount[size] || 0;
      const receivedCount = sizeReceived[size] || 0;
      const produced = mockProduced[size];
      
      return {
        size,
        produced,
        reserved,
        received: receivedCount,
        remaining: Math.max(0, produced - reserved)
      };
    });

    // คำนวณจ่ายแล้ววันนี้
    const today = new Date().toDateString();
    const distributedToday = data.filter(m => {
      if (!m.RECEIVED_DATE) return false;
      try {
        const receivedDate = new Date(parseInt(m.RECEIVED_DATE.match(/\d+/)[0]));
        return receivedDate.toDateString() === today;
      } catch {
        return false;
      }
    }).length;

    return {
      total,
      confirmed,
      pending,
      received,
      distributedToday,
      inventory
    };
  };

  const loadDashboardStats = async () => {
    setLoadingDashboard(true);
    setDashboardError(null);
    
    try {
      // เรียก API เพื่อได้ข้อมูลทั้งหมด
      const result = await getShirtMemberListPaged({
        page: 1,
        pageSize: 9999, // ดึงทั้งหมดเพื่อคำนวณสถิติ
        search: '',
        status: '',
        size_code: ''
      });

      const stats = calculateStats(result.data || []);
      setDashboardStats(stats);
      
    } catch (error) {
      console.error('Dashboard stats error:', error);
      
      // ถ้า error ให้ใช้ mock data แทน
      const mockInventory = [
        { size: 'XS', produced: 50, reserved: 0, received: 0, remaining: 50 },
        { size: 'S', produced: 100, reserved: 1, received: 0, remaining: 99 },
        { size: 'M', produced: 150, reserved: 0, received: 0, remaining: 150 },
        { size: 'L', produced: 200, reserved: 0, received: 0, remaining: 200 },
        { size: 'XL', produced: 150, reserved: 0, received: 0, remaining: 150 },
        { size: '2XL', produced: 100, reserved: 0, received: 0, remaining: 100 },
        { size: '3XL', produced: 80, reserved: 0, received: 0, remaining: 80 },
        { size: '4XL', produced: 50, reserved: 0, received: 0, remaining: 50 },
        { size: '5XL', produced: 30, reserved: 0, received: 0, remaining: 30 },
        { size: '6XL', produced: 20, reserved: 0, received: 0, remaining: 20 },
      ];
      
      setDashboardStats({
        total: 1250,
        confirmed: 980,
        pending: 270,
        received: 45,
        distributedToday: 12,
        inventory: mockInventory
      });
    } finally {
      setLoadingDashboard(false);
    }
  };

  const handlePickupClick = (record) => {
    setSelectedMember(record);
    pickupForm.setFieldsValue({
      memberCode: record.MEMB_CODE,
      selectedSize: record.SIZE_CODE,
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

  // Menu items
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
            <Title level={3} style={{ marginBottom: 24 }}>ภาพรวมวันนี้</Title>

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

            {loadingDashboard ? (
              <Card>
                <div style={{ textAlign: "center", padding: 48 }}>
                  <Spin size="large" />
                  <div style={{ marginTop: 16 }}>กำลังโหลดข้อมูล...</div>
                </div>
              </Card>
            ) : (
              <DashboardStats stats={dashboardStats} />
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