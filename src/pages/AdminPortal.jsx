import React, { useState, useEffect } from "react";
import { useAppContext } from "../App";
import {
  Card,
  Button,
  Typography,
  Avatar,
  Tag,
  Modal,
  Row,
  Col,
  Input,
  Table,
  Tabs,
  Space,
  Statistic,
  Alert,
  Form,
  Select,
  message,
  Divider,
  Progress,
  Badge,
  List,
  Layout,
  Menu,
  Drawer,
  Tooltip,
  Grid,
} from "antd";
import {
  LogoutOutlined,
  SearchOutlined,
  UserOutlined,
  ShoppingOutlined,
  BarChartOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  UsergroupAddOutlined,
  FileTextOutlined,
  SettingOutlined,
  BellOutlined,
  MenuOutlined,
  TrophyOutlined,
  CalendarOutlined,
  LineChartOutlined,
  PlusOutlined,
  DownloadOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { shirtSizes } from "../utils/shirt-size";

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { Search } = Input;
const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.log("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "50px", textAlign: "center" }}>
          <h2>เกิดข้อผิดพลาด</h2>
          <p>กรุณารีเฟรชหน้าเว็บ</p>
          <Button onClick={() => window.location.reload()}>รีเฟรช</Button>
        </div>
      );
    }

    return this.props.children;
  }
}

const AdminPortal = () => {
  const { user, logout } = useAppContext();
  const screens = useBreakpoint();
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!screens.lg) {
      setCollapsed(true);
      setMobileDrawerVisible(false);
    } else {
      setCollapsed(false);
    }
  }, [screens]);

  // Mock data - ในการใช้งานจริงจะดึงจาก API
  const [mockInventory] = useState([
    { size: "XS", produced: 50, reserved: 35, distributed: 20, remaining: 30 },
    { size: "S", produced: 100, reserved: 85, distributed: 60, remaining: 40 },
    { size: "M", produced: 150, reserved: 120, distributed: 95, remaining: 55 },
    { size: "L", produced: 120, reserved: 100, distributed: 75, remaining: 45 },
    { size: "XL", produced: 80, reserved: 65, distributed: 45, remaining: 35 },
    { size: "2XL", produced: 60, reserved: 45, distributed: 30, remaining: 30 },
    { size: "3XL", produced: 40, reserved: 30, distributed: 18, remaining: 22 },
    { size: "4XL", produced: 30, reserved: 20, distributed: 12, remaining: 18 },
    { size: "5XL", produced: 20, reserved: 15, distributed: 8, remaining: 12 },
    { size: "6XL", produced: 15, reserved: 10, distributed: 5, remaining: 10 },
  ]);

  const [todayStats] = useState({
    totalDistributed: 42,
    pendingConfirmations: 18,
    lowStockItems: 3,
    totalMembers: 1247,
  });

  const [recentActivities] = useState([
    {
      id: 1,
      member: "สมชาย ใจดี",
      action: "รับเสื้อขนาด M",
      time: "2 นาทีที่แล้ว",
      type: "success",
    },
    {
      id: 2,
      member: "สมหญิง รักษ์ดี",
      action: "ยืนยันขนาดเสื้อ L",
      time: "5 นาทีที่แล้ว",
      type: "info",
    },
    {
      id: 3,
      member: "Admin",
      action: "เติมสต็อกขนาด XL",
      time: "10 นาทีที่แล้ว",
      type: "warning",
    },
    {
      id: 4,
      member: "สมศักดิ์ มีสุข",
      action: "รับเสื้อขนาด 2XL",
      time: "15 นาทีที่แล้ว",
      type: "success",
    },
  ]);

  const handleLogout = () => {
    Modal.confirm({
      title: "ออกจากระบบ",
      content: "คุณต้องการออกจากระบบหรือไม่?",
      okText: "ออกจากระบบ",
      cancelText: "ยกเลิก",
      okType: "danger",
      onOk: () => {
        logout();
        message.success("ออกจากระบบเรียบร้อยแล้ว");
      },
    });
  };

  const handleSearch = async (memberCode) => {
    if (!memberCode || memberCode.length !== 6) {
      message.warning("กรุณากรอกเลขสมาชิก 6 หลัก");
      return;
    }

    setLoading(true);
    try {
      // Mock search result - ในการใช้งานจริงจะเรียก API
      const mockMember = {
        memberCode: memberCode,
        name: `สมาชิก ${memberCode}`,
        round: "รอบที่ 15",
        status: memberCode === "123456" ? "ยืนยันขนาดแล้ว" : "ยังไม่ยืนยันขนาด",
        selectedSize: memberCode === "123456" ? "M" : null,
        phone: "0812345678",
        unit: "คณะวิศวกรรมศาสตร์",
      };

      setSearchResults([mockMember]);
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการค้นหา");
    } finally {
      setLoading(false);
    }
  };

  const handleMemberSelect = (member) => {
    setSelectedMember(member);
    setShowDistributionModal(true);
    form.setFieldsValue({
      memberCode: member.memberCode,
      name: member.name,
      selectedSize: member.selectedSize || undefined,
      recipientType: "self",
      recipientName: "",
    });
  };

  const handleDistribute = async (values) => {
    setLoading(true);
    try {
      // Mock distribution - ในการใช้งานจริงจะเรียก API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      message.success(
        `จ่ายเสื้อขนาด ${values.selectedSize} ให้ ${selectedMember.name} เรียบร้อยแล้ว`
      );
      setShowDistributionModal(false);
      setSelectedMember(null);
      form.resetFields();

      // อัปเดตสถานะในผลการค้นหา
      setSearchResults((prev) =>
        prev.map((member) =>
          member.memberCode === selectedMember.memberCode
            ? {
                ...member,
                status: "รับเสื้อแล้ว",
                selectedSize: values.selectedSize,
              }
            : member
        )
      );
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการจ่ายเสื้อ");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ยังไม่ยืนยันขนาด":
        return "#FF9500";
      case "ยืนยันขนาดแล้ว":
        return "#007AFF";
      case "รับเสื้อแล้ว":
        return "#32D74B";
      default:
        return "#8E8E93";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "ยังไม่ยืนยันขนาด":
        return <ClockCircleOutlined />;
      case "ยืนยันขนาดแล้ว":
        return <CheckCircleOutlined />;
      case "รับเสื้อแล้ว":
        return <CheckCircleOutlined />;
      default:
        return <ExclamationCircleOutlined />;
    }
  };

  // คำนวณสถิติรวม
  const totalStats = mockInventory.reduce(
    (acc, item) => ({
      produced: acc.produced + item.produced,
      reserved: acc.reserved + item.reserved,
      distributed: acc.distributed + item.distributed,
      remaining: acc.remaining + item.remaining,
    }),
    { produced: 0, reserved: 0, distributed: 0, remaining: 0 }
  );

  // คอลัมน์ตารางสต็อก
  const inventoryColumns = [
    {
      title: "ขนาด",
      dataIndex: "size",
      key: "size",
      align: "center",
      render: (size) => (
        <Tag color="#007AFF" style={{ fontSize: "14px", fontWeight: "600" }}>
          {size}
        </Tag>
      ),
    },
    {
      title: "ผลิต",
      dataIndex: "produced",
      key: "produced",
      align: "center",
    },
    {
      title: "จอง",
      dataIndex: "reserved",
      key: "reserved",
      align: "center",
    },
    {
      title: "จ่ายแล้ว",
      dataIndex: "distributed",
      key: "distributed",
      align: "center",
    },
    {
      title: "คงเหลือ",
      dataIndex: "remaining",
      key: "remaining",
      align: "center",
      render: (remaining) => (
        <Text
          strong
          style={{
            color: remaining <= 50 ? "#FF3B30" : "#32D74B",
            backgroundColor:
              remaining <= 50
                ? "rgba(255, 59, 48, 0.1)"
                : "rgba(50, 215, 75, 0.1)",
            padding: "4px 8px",
            borderRadius: "6px",
          }}
        >
          {remaining}
        </Text>
      ),
    },
  ];

  const sizeOptions =
    shirtSizes?.sizes
      ?.filter((size) => size.active)
      ?.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
      ?.map((size) => ({
        value: size.code,
        label: `${size.code} (${size.chest?.inch || "N/A"}" × ${
          size.length?.inch || "N/A"
        }")`,
      })) || [];

  const menuItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: "แดชบอร์ด",
    },
    {
      key: "search",
      icon: <SearchOutlined />,
      label: "ค้นหาสมาชิก",
    },
    {
      key: "inventory",
      icon: <BarChartOutlined />,
      label: "สต็อกคงเหลือ",
    },
    {
      key: "reports",
      icon: <FileTextOutlined />,
      label: "รายงาน",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "การตั้งค่า",
    },
  ];

  const handleMenuClick = (e) => {
    setActiveTab(e.key);
    if (window.innerWidth < 768) {
      setMobileDrawerVisible(false);
    }
  };

  const renderDashboard = () => (
    <div style={{ padding: "24px" }}>
      {/* Welcome Section */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: 16,
              color: "white",
            }}
          >
            <Row align="middle">
              <Col flex="auto">
                <Title level={2} style={{ color: "white", margin: 0 }}>
                  สวัสดี, {user?.name || "ผู้ดูแลระบบ"} 👋
                </Title>
                <Paragraph
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: 16,
                    margin: 0,
                  }}
                >
                  ยินดีต้อนรับสู่ระบบจัดการแจกเสื้อ วันนี้คุณจ่ายเสื้อได้{" "}
                  {todayStats.totalDistributed} ตัวแล้ว
                </Paragraph>
              </Col>
              <Col>
                <Badge count={todayStats.pendingConfirmations} offset={[-8, 8]}>
                  <Avatar
                    size={64}
                    icon={<UserOutlined />}
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      border: "2px solid rgba(255,255,255,0.3)",
                    }}
                  />
                </Badge>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12, textAlign: "center" }}>
            <div style={{ color: "#32D74B", fontSize: 24, marginBottom: 8 }}>
              <TrophyOutlined />
            </div>
            <Statistic
              title="จ่ายแล้ววันนี้"
              value={todayStats.totalDistributed}
              valueStyle={{ color: "#32D74B", fontSize: 24 }}
              suffix="ตัว"
            />
            <Progress
              percent={Math.round((todayStats.totalDistributed / 100) * 100)}
              strokeColor="#32D74B"
              showInfo={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12, textAlign: "center" }}>
            <div style={{ color: "#FF9500", fontSize: 24, marginBottom: 8 }}>
              <ClockCircleOutlined />
            </div>
            <Statistic
              title="รอยืนยัน"
              value={todayStats.pendingConfirmations}
              valueStyle={{ color: "#FF9500", fontSize: 24 }}
              suffix="คน"
            />
            <Progress
              percent={Math.round((todayStats.pendingConfirmations / 50) * 100)}
              strokeColor="#FF9500"
              showInfo={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12, textAlign: "center" }}>
            <div style={{ color: "#FF3B30", fontSize: 24, marginBottom: 8 }}>
              <ExclamationCircleOutlined />
            </div>
            <Statistic
              title="สต็อกใกล่หมด"
              value={todayStats.lowStockItems}
              valueStyle={{ color: "#FF3B30", fontSize: 24 }}
              suffix="รายการ"
            />
            <Progress
              percent={Math.round((todayStats.lowStockItems / 10) * 100)}
              strokeColor="#FF3B30"
              showInfo={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12, textAlign: "center" }}>
            <div style={{ color: "#007AFF", fontSize: 24, marginBottom: 8 }}>
              <UsergroupAddOutlined />
            </div>
            <Statistic
              title="สมาชิกทั้งหมด"
              value={todayStats.totalMembers}
              valueStyle={{ color: "#007AFF", fontSize: 24 }}
              suffix="คน"
            />
            <Progress
              percent={85}
              strokeColor="#007AFF"
              showInfo={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* Charts and Recent Activities */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <LineChartOutlined style={{ color: "#007AFF" }} />
                การจ่ายเสื้อรายสัปดาห์
              </div>
            }
            extra={
              <Button size="small" icon={<DownloadOutlined />}>
                ส่งออก
              </Button>
            }
            style={{ borderRadius: 16, height: 400 }}
          >
            <div
              style={{
                height: 300,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(45deg, #f0f8ff, #e6f3ff)",
                borderRadius: 12,
                color: "#666",
                flexDirection: "column",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <div style={{ textAlign: "center" }}>
                <div>กราฟแสดงการจ่ายเสื้อรายสัปดาห์</div>
                <small>(อยู่ระหว่างพัฒนา)</small>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CalendarOutlined style={{ color: "#32D74B" }} />
                กิจกรรมล่าสุด
              </div>
            }
            style={{ borderRadius: 16, height: 400 }}
          >
            <List
              dataSource={recentActivities}
              renderItem={(item) => (
                <List.Item style={{ padding: "8px 0", border: "none" }}>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        size="small"
                        style={{
                          background:
                            item.type === "success"
                              ? "#32D74B"
                              : item.type === "warning"
                              ? "#FF9500"
                              : "#007AFF",
                        }}
                      >
                        {item.type === "success"
                          ? "✓"
                          : item.type === "warning"
                          ? "!"
                          : "i"}
                      </Avatar>
                    }
                    title={
                      <Text style={{ fontSize: 13, fontWeight: 500 }}>
                        {item.member}
                      </Text>
                    }
                    description={
                      <div>
                        <Text style={{ fontSize: 12, color: "#666" }}>
                          {item.action}
                        </Text>
                        <br />
                        <Text style={{ fontSize: 11, color: "#999" }}>
                          {item.time}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderSearch = () => (
    <div style={{ padding: "24px" }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card style={{ borderRadius: 16 }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <Title level={3} style={{ color: "#1d1d1f", marginBottom: 8 }}>
                ค้นหาสมาชิก
              </Title>
              <Paragraph style={{ color: "#48484a", fontSize: 16 }}>
                กรอกเลขสมาชิก 6 หลักเพื่อค้นหาและจ่ายเสื้อ
              </Paragraph>
            </div>

            <Row justify="center">
              <Col xs={24} sm={16} md={12}>
                <Search
                  placeholder="กรอกเลขสมาชิก 6 หลัก"
                  enterButton={
                    <Button type="primary" icon={<SearchOutlined />}>
                      ค้นหา
                    </Button>
                  }
                  size="large"
                  loading={loading}
                  onSearch={handleSearch}
                  maxLength={6}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Col span={24}>
            <Card
              title="ผลการค้นหา"
              style={{ borderRadius: 16 }}
              extra={<Badge count={searchResults.length} />}
            >
              {searchResults.map((member) => (
                <Card
                  key={member.memberCode}
                  style={{
                    marginBottom: 16,
                    borderRadius: 12,
                    border: "1px solid rgba(0, 122, 255, 0.2)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                  hoverable
                  onClick={() => handleMemberSelect(member)}
                >
                  <Row align="middle" justify="space-between">
                    <Col span={16}>
                      <Space direction="vertical" size="small">
                        <Text strong style={{ fontSize: 16 }}>
                          {member.name}
                        </Text>
                        <Text type="secondary">
                          รหัสสมาชิก: {member.memberCode} | {member.round}
                        </Text>
                        <Text type="secondary">หน่วยงาน: {member.unit}</Text>
                        {member.selectedSize && (
                          <Text>
                            ขนาดที่เลือก:{" "}
                            <Tag color="#007AFF">{member.selectedSize}</Tag>
                          </Text>
                        )}
                      </Space>
                    </Col>
                    <Col span={8} style={{ textAlign: "right" }}>
                      <Tag
                        icon={getStatusIcon(member.status)}
                        color={getStatusColor(member.status)}
                        style={{ marginBottom: 8 }}
                      >
                        {member.status}
                      </Tag>
                      <br />
                      <Button
                        type="primary"
                        icon={<ShoppingOutlined />}
                        size="small"
                      >
                        จ่ายเสื้อ
                      </Button>
                    </Col>
                  </Row>
                </Card>
              ))}
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );

  const renderInventory = () => (
    <div style={{ padding: "24px" }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card style={{ borderRadius: 16 }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <Title level={3} style={{ color: "#1d1d1f", marginBottom: 8 }}>
                สรุปสต็อกเสื้อ
              </Title>
              <Paragraph style={{ color: "#48484a", fontSize: 16 }}>
                ข้อมูลสต็อกและการจ่ายเสื้อแบบเรียลไทม์
              </Paragraph>
            </div>

            {/* Summary Statistics */}
            <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
              <Col xs={12} sm={6}>
                <Card style={{ textAlign: "center", borderRadius: 12 }}>
                  <Statistic
                    title="ผลิตทั้งหมด"
                    value={totalStats.produced}
                    valueStyle={{ color: "#007AFF" }}
                    prefix={<TrophyOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card style={{ textAlign: "center", borderRadius: 12 }}>
                  <Statistic
                    title="จองแล้ว"
                    value={totalStats.reserved}
                    valueStyle={{ color: "#FF9500" }}
                    prefix={<ClockCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card style={{ textAlign: "center", borderRadius: 12 }}>
                  <Statistic
                    title="จ่ายแล้ว"
                    value={totalStats.distributed}
                    valueStyle={{ color: "#32D74B" }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card style={{ textAlign: "center", borderRadius: 12 }}>
                  <Statistic
                    title="คงเหลือ"
                    value={totalStats.remaining}
                    valueStyle={{
                      color:
                        totalStats.remaining <= 200 ? "#FF3B30" : "#32D74B",
                    }}
                    prefix={<ExclamationCircleOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            {/* Low Stock Alert */}
            {mockInventory.some((item) => item.remaining <= 50) && (
              <Alert
                message="แจ้งเตือนสต็อกใกล่หมด"
                description="พบสต็อกเสื้อบางขนาดเหลือน้อย กรุณาตรวจสอบและเติมสต็อก"
                type="warning"
                showIcon
                style={{ marginBottom: 24, borderRadius: 12 }}
                action={
                  <Space>
                    <Button
                      size="small"
                      type="primary"
                      ghost
                      icon={<PlusOutlined />}
                    >
                      เติมสต็อก
                    </Button>
                    <Button size="small" icon={<DownloadOutlined />}>
                      ส่งออกรายงาน
                    </Button>
                  </Space>
                }
              />
            )}

            {/* Inventory Table */}
            <Card
              title="รายละเอียดสต็อกแต่ละขนาด"
              style={{ borderRadius: 16 }}
              extra={
                <Space>
                  <Button
                    type="primary"
                    ghost
                    icon={<FilterOutlined />}
                    size="small"
                  >
                    กรองข้อมูล
                  </Button>
                  <Button type="primary" icon={<EditOutlined />} size="small">
                    จัดการสต็อก
                  </Button>
                </Space>
              }
            >
              <Table
                dataSource={mockInventory}
                columns={inventoryColumns}
                rowKey="size"
                pagination={false}
                size="middle"
                style={{ borderRadius: 12 }}
                scroll={{ x: 600 }}
              />
            </Card>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderReports = () => (
    <div style={{ padding: "24px" }}>
      <Card style={{ borderRadius: 16, textAlign: "center", minHeight: 400 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: 300,
            color: "#666",
          }}
        >
          <FileTextOutlined
            style={{ fontSize: 64, color: "#007AFF", marginBottom: 16 }}
          />
          <Title level={3} style={{ color: "#1d1d1f" }}>
            รายงานและสถิติ
          </Title>
          <Paragraph style={{ fontSize: 16, marginBottom: 24 }}>
            ฟีเจอร์รายงานกำลังพัฒนา
          </Paragraph>
          <div style={{ fontSize: 14, color: "#999", lineHeight: 1.6 }}>
            • รายงานการจ่ายเสื้อรายวัน/รายเดือน
            <br />
            • สถิติการใช้งานระบบ
            <br />
            • ส่งออกข้อมูลเป็น Excel/PDF
            <br />• กราฟแสดงแนวโน้ม
          </div>
        </div>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div style={{ padding: "24px" }}>
      <Card style={{ borderRadius: 16, textAlign: "center", minHeight: 400 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: 300,
            color: "#666",
          }}
        >
          <SettingOutlined
            style={{ fontSize: 64, color: "#007AFF", marginBottom: 16 }}
          />
          <Title level={3} style={{ color: "#1d1d1f" }}>
            การตั้งค่าระบบ
          </Title>
          <Paragraph style={{ fontSize: 16, marginBottom: 24 }}>
            ฟีเจอร์การตั้งค่ากำลังพัฒนา
          </Paragraph>
          <div style={{ fontSize: 14, color: "#999", lineHeight: 1.6 }}>
            • จัดการข้อมูลสมาชิก
            <br />
            • ตั้งค่าขนาดเสื้อ
            <br />
            • กำหนดสิทธิ์การใช้งาน
            <br />• ตั้งค่าการแจ้งเตือน
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <ErrorBoundary>
      <div className="admin-portal-container">
        <Layout style={{ minHeight: "100vh", background: "transparent" }}>
          {/* Desktop Sidebar */}
          <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            breakpoint="lg"
            collapsedWidth={80}
            width={260}
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              borderRight: "1px solid rgba(0, 122, 255, 0.1)",
              boxShadow: "4px 0 24px rgba(0, 0, 0, 0.06)",
              position: "fixed",
              height: "100vh",
              left: 0,
              zIndex: 100,
            }}
            className="desktop-sidebar"
          >
            {/* Logo Section */}
            <div
              style={{
                padding: collapsed ? "20px 8px" : "20px 24px",
                textAlign: collapsed ? "center" : "left",
                borderBottom: "1px solid rgba(0, 122, 255, 0.1)",
              }}
            >
              {!collapsed ? (
                <div>
                  <Title
                    level={4}
                    style={{ color: "#1d1d1f", margin: 0, fontSize: 18 }}
                  >
                    ระบบจัดการเสื้อ
                  </Title>
                  <Text style={{ color: "#48484a", fontSize: 12 }}>
                    Admin Dashboard
                  </Text>
                </div>
              ) : (
                <Avatar
                  size={40}
                  style={{
                    background: "linear-gradient(135deg, #007AFF, #0051D5)",
                    fontSize: 18,
                    fontWeight: 600,
                  }}
                >
                  A
                </Avatar>
              )}
            </div>

            {/* Menu */}
            <Menu
              mode="inline"
              selectedKeys={[activeTab]}
              style={{
                background: "transparent",
                border: "none",
                paddingTop: 16,
              }}
              onClick={handleMenuClick}
              items={menuItems}
            />

            {/* User Info */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                width: "100%",
                padding: collapsed ? "16px 8px" : "16px 24px",
                borderTop: "1px solid rgba(0, 122, 255, 0.1)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar
                  size={collapsed ? 32 : 40}
                  icon={<UserOutlined />}
                  style={{
                    background: "linear-gradient(135deg, #FF9500, #FF7A00)",
                  }}
                />
                {!collapsed && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontWeight: 600, fontSize: 14 }}>
                      {user?.name || "ผู้ดูแลระบบ"}
                    </Text>
                    <br />
                    <Text style={{ color: "#48484a", fontSize: 12 }}>
                      เจ้าหน้าที่
                    </Text>
                  </div>
                )}
              </div>
              {!collapsed && (
                <Button
                  type="text"
                  icon={<LogoutOutlined />}
                  onClick={handleLogout}
                  style={{
                    width: "100%",
                    marginTop: 12,
                    color: "#FF3B30",
                    borderRadius: 8,
                  }}
                >
                  ออกจากระบบ
                </Button>
              )}
            </div>
          </Sider>

          {/* Mobile Header */}
          <Header
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(0, 122, 255, 0.1)",
              padding: "0 16px",
              display: "none",
              position: "fixed",
              width: "100%",
              zIndex: 99,
            }}
            className="mobile-header"
          >
            <Row align="middle" justify="space-between">
              <Col>
                <Space>
                  <Button
                    type="text"
                    icon={<MenuOutlined />}
                    onClick={() => setMobileDrawerVisible(true)}
                    style={{ fontSize: 18 }}
                  />
                  <Title level={4} style={{ margin: 0, color: "#1d1d1f" }}>
                    ระบบจัดการเสื้อ
                  </Title>
                </Space>
              </Col>
              <Col>
                <Space>
                  <Badge count={3}>
                    <Button
                      type="text"
                      icon={<BellOutlined />}
                      style={{ fontSize: 18 }}
                    />
                  </Badge>
                  <Avatar
                    size={32}
                    icon={<UserOutlined />}
                    style={{
                      background: "linear-gradient(135deg, #FF9500, #FF7A00)",
                    }}
                  />
                </Space>
              </Col>
            </Row>
          </Header>

          {/* Mobile Drawer */}
          <Drawer
            title={
              <div>
                <Title level={4} style={{ color: "#1d1d1f", margin: 0 }}>
                  ระบบจัดการเสื้อ
                </Title>
                <Text style={{ color: "#48484a", fontSize: 12 }}>
                  Admin Dashboard
                </Text>
              </div>
            }
            placement="left"
            onClose={() => setMobileDrawerVisible(false)}
            open={mobileDrawerVisible}
            bodyStyle={{ padding: 0 }}
            width={280}
          >
            <Menu
              mode="inline"
              selectedKeys={[activeTab]}
              style={{ background: "transparent", border: "none" }}
              onClick={handleMenuClick}
              items={menuItems}
            />

            <div
              style={{ position: "absolute", bottom: 16, left: 16, right: 16 }}
            >
              <Card size="small" style={{ borderRadius: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar
                    size={40}
                    icon={<UserOutlined />}
                    style={{
                      background: "linear-gradient(135deg, #FF9500, #FF7A00)",
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <Text style={{ fontWeight: 600, fontSize: 14 }}>
                      {user?.name || "ผู้ดูแลระบบ"}
                    </Text>
                    <br />
                    <Text style={{ color: "#48484a", fontSize: 12 }}>
                      เจ้าหน้าที่
                    </Text>
                  </div>
                </div>
                <Button
                  type="text"
                  icon={<LogoutOutlined />}
                  onClick={handleLogout}
                  style={{
                    width: "100%",
                    marginTop: 12,
                    color: "#FF3B30",
                  }}
                >
                  ออกจากระบบ
                </Button>
              </Card>
            </div>
          </Drawer>

          {/* Main Content */}
          <Layout
            className={`content-layout ${collapsed ? "sidebar-collapsed" : ""}`}
            style={{ background: "transparent" }}
          >
            <Content style={{ minHeight: "100vh", background: "transparent" }}>
              {/* Toggle Button -> Only show on desktop */}
              {screens?.lg && (
                <Button
                  type="text"
                  icon={<MenuOutlined />}
                  onClick={() => setCollapsed(!collapsed)}
                  className={`desktop-toggle ${
                    collapsed ? "sidebar-collapsed" : ""
                  }`}
                />
              )}
              {/* Content Area (No changes here) */}
              <div style={{ paddingTop: screens?.lg ? 70 : 80 }}>
                {activeTab === "dashboard" && renderDashboard()}
                {activeTab === "search" && renderSearch()}
                {activeTab === "inventory" && renderInventory()}
                {activeTab === "reports" && renderReports()}
                {activeTab === "settings" && renderSettings()}
              </div>
            </Content>
          </Layout>
        </Layout>

        {/* Distribution Modal */}
        <Modal
          title={
            <div style={{ textAlign: "center" }}>
              <ShoppingOutlined
                style={{ color: "#32D74B", fontSize: 24, marginRight: 8 }}
              />
              จ่ายเสื้อให้สมาชิก
            </div>
          }
          open={showDistributionModal}
          onCancel={() => {
            setShowDistributionModal(false);
            setSelectedMember(null);
            form.resetFields();
          }}
          footer={null}
          width={600}
          centered
        >
          {selectedMember && (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleDistribute}
              style={{ marginTop: 20 }}
            >
              <div
                style={{
                  background: "rgba(0, 122, 255, 0.05)",
                  border: "1px solid rgba(0, 122, 255, 0.1)",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 24,
                }}
              >
                <Row align="middle">
                  <Col span={4}>
                    <Avatar
                      size={48}
                      icon={<UserOutlined />}
                      style={{
                        background: "linear-gradient(135deg, #32D74B, #30B84E)",
                      }}
                    />
                  </Col>
                  <Col span={20}>
                    <Title level={4} style={{ margin: 0, color: "#1d1d1f" }}>
                      {selectedMember.name}
                    </Title>
                    <Text type="secondary">
                      รหัสสมาชิก: {selectedMember.memberCode} |{" "}
                      {selectedMember.round}
                    </Text>
                    <br />
                    <Tag
                      icon={getStatusIcon(selectedMember.status)}
                      color={getStatusColor(selectedMember.status)}
                      style={{ marginTop: 4 }}
                    >
                      {selectedMember.status}
                    </Tag>
                  </Col>
                </Row>
              </div>

              <Form.Item
                name="selectedSize"
                label="ขนาดเสื้อ"
                rules={[{ required: true, message: "กรุณาเลือกขนาดเสื้อ" }]}
              >
                <Select
                  placeholder="เลือกขนาดเสื้อ"
                  size="large"
                  style={{ borderRadius: 12 }}
                >
                  {sizeOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="recipientType"
                label="ผู้รับ"
                rules={[{ required: true, message: "กรุณาเลือกประเภทผู้รับ" }]}
              >
                <Select
                  placeholder="เลือกประเภทผู้รับ"
                  size="large"
                  onChange={(value) => {
                    if (value === "self") {
                      form.setFieldValue("recipientName", "");
                    }
                  }}
                >
                  <Option value="self">รับด้วยตนเอง</Option>
                  <Option value="proxy">รับแทน</Option>
                </Select>
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) =>
                  prevValues.recipientType !== currentValues.recipientType
                }
              >
                {({ getFieldValue }) =>
                  getFieldValue("recipientType") === "proxy" ? (
                    <Form.Item
                      name="recipientName"
                      label="ชื่อผู้รับแทน"
                      rules={[
                        { required: true, message: "กรุณากรอกชื่อผู้รับแทน" },
                      ]}
                    >
                      <Input placeholder="กรอกชื่อผู้รับแทน" size="large" />
                    </Form.Item>
                  ) : null
                }
              </Form.Item>

              <Divider />

              <div style={{ textAlign: "center" }}>
                <Space size="middle">
                  <Button
                    onClick={() => {
                      setShowDistributionModal(false);
                      setSelectedMember(null);
                      form.resetFields();
                    }}
                    size="large"
                    style={{ borderRadius: 12, minWidth: 100 }}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    size="large"
                    style={{
                      borderRadius: 12,
                      minWidth: 100,
                      background: "linear-gradient(135deg, #32D74B, #30B84E)",
                      border: "none",
                    }}
                  >
                    ยืนยันการจ่าย
                  </Button>
                </Space>
              </div>
            </Form>
          )}
        </Modal>
      </div>
    </ErrorBoundary>
  );
};

export default AdminPortal;
