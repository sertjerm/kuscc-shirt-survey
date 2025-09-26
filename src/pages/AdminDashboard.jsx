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
  Modal,
  Select,
  InputNumber,
  Radio,
  Divider,
  List,
  Descriptions,
  Form,
  Tooltip,
  Dropdown,
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
  LogoutOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  TrophyOutlined,
  PlusOutlined,
  MinusOutlined,
  EditOutlined,
  HistoryOutlined,
  WarningOutlined,
  FilterOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import "../styles/AdminDashboard.css";
import { SearchMember, getShirtMemberList } from "../services/shirtApi";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const { Search } = Input;
const { Option } = Select;

// Constants from draft
const ALL_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL"];
const SIZE_DIMENSIONS = {
  "XS": { chest: "40", length: "24" },
  "S": { chest: "42", length: "25" },
  "M": { chest: "44", length: "26" },
  "L": { chest: "46", length: "27" },
  "XL": { chest: "48", length: "28" },
  "2XL": { chest: "50", length: "29" },
  "3XL": { chest: "52", length: "30" },
  "4XL": { chest: "54", length: "31" },
  "5XL": { chest: "56", length: "32" },
  "6XL": { chest: "58", length: "33" },
};

const AdminDashboard = () => {
  const { user, logout } = useAppContext();
  const screens = useBreakpoint();

  // UI State
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const [activeMenuKey, setActiveMenuKey] = useState("dashboard");
  
  // Search State
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  
  // Dashboard State
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);
  const [memberList, setMemberList] = useState([]);
  
  // Pickup Management State
  const [selectedMember, setSelectedMember] = useState(null);
  const [pickupModalVisible, setPickupModalVisible] = useState(false);
  const [pickupForm] = Form.useForm();
  const [sizeChangeModalVisible, setSizeChangeModalVisible] = useState(false);
  const [newSelectedSize, setNewSelectedSize] = useState("");
  
  // Stock Management State
  const [stockData, setStockData] = useState({});
  const [stockTransactions, setStockTransactions] = useState([]);
  const [pickupHistory, setPickupHistory] = useState([]);
  const [loadingStock, setLoadingStock] = useState(false);
  
  // Members list state
  const [allMembers, setAllMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberFilters, setMemberFilters] = useState({
    status: 'all',
    size: 'all',
    search: ''
  });
  const [membersTableLoading, setMembersTableLoading] = useState(false);

  useEffect(() => {
    setCollapsed(!screens.lg);
  }, [screens.lg]);

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
    loadStockData();
    loadPickupHistory();
  }, []);

  // Load members when switching to members tab
  useEffect(() => {
    if (activeMenuKey === 'members' && allMembers.length === 0) {
      loadAllMembers();
    }
  }, [activeMenuKey]);

  const loadDashboardData = async () => {
    setLoadingDashboard(true);
    setDashboardError(null);
    try {
      const data = await getShirtMemberList("ALL");
      setMemberList(Array.isArray(data) ? data : []);
    } catch (err) {
      setDashboardError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoadingDashboard(false);
    }
  };

  const loadAllMembers = async () => {
    setLoadingMembers(true);
    try {
      // Using getShirtMemberList without parameter to get all members
      const data = await getShirtMemberList("");
      const members = Array.isArray(data) ? data.map(member => ({
        key: member.MEMB_CODE,
        memberCode: member.MEMB_CODE,
        name: member.FULLNAME || member.DISPLAYNAME,
        phone: member.MEMB_MOBILE,
        selectedSize: member.SIZE_CODE,
        status: member.SIZE_CODE ? "ยืนยันขนาดแล้ว" : "ยังไม่ยืนยันขนาด",
        remarks: member.REMARKS,
        pickedUp: false, // This would come from pickup records
        surveyDate: member.SURVEY_DATE,
      })) : [];
      
      setAllMembers(members);
      setFilteredMembers(members);
    } catch (err) {
      message.error("ไม่สามารถโหลดข้อมูลสมาชิกได้");
      console.error("Load members error:", err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleMemberFilter = (type, value) => {
    const newFilters = { ...memberFilters, [type]: value };
    setMemberFilters(newFilters);
    
    let filtered = [...allMembers];
    
    // Filter by search
    if (newFilters.search) {
      filtered = filtered.filter(member => 
        member.memberCode.includes(newFilters.search) ||
        member.name.toLowerCase().includes(newFilters.search.toLowerCase())
      );
    }
    
    // Filter by status
    if (newFilters.status !== 'all') {
      if (newFilters.status === 'confirmed') {
        filtered = filtered.filter(member => member.selectedSize);
      } else if (newFilters.status === 'pending') {
        filtered = filtered.filter(member => !member.selectedSize);
      } else if (newFilters.status === 'picked_up') {
        filtered = filtered.filter(member => member.pickedUp);
      }
    }
    
    // Filter by size
    if (newFilters.size !== 'all') {
      filtered = filtered.filter(member => member.selectedSize === newFilters.size);
    }
    
    setFilteredMembers(filtered);
  };

  const loadStockData = async () => {
    // Mock stock data - replace with real API calls
    const mockStock = {};
    ALL_SIZES.forEach(size => {
      mockStock[size] = {
        produced: Math.floor(Math.random() * 200) + 50,
        reserved: Math.floor(Math.random() * 30),
        pickedUp: Math.floor(Math.random() * 50),
      };
    });
    setStockData(mockStock);
    
    // Mock stock transactions
    setStockTransactions([
      { id: 1, size: "M", quantity: 10, type: "add", timestamp: new Date() },
      { id: 2, size: "L", quantity: 5, type: "withdraw", timestamp: new Date() },
    ]);
  };

  const loadPickupHistory = async () => {
    // Mock pickup history
    setPickupHistory([
      { id: 1, memberCode: "123456", size: "M", timestamp: new Date(), pickupType: "self" },
      { id: 2, memberCode: "234567", size: "L", timestamp: new Date(), pickupType: "proxy", proxyName: "สมชาย ใจดี" },
    ]);
  };

  const handleSearch = async (memberCode) => {
    if (!memberCode) {
      message.warning("กรุณากรอกรหัสสมาชิก");
      return;
    }
    
    setLoadingSearch(true);
    setSearchResults([]);
    
    try {
      const data = await SearchMember(memberCode);
      const result = {
        key: data.MEMB_CODE,
        memberCode: data.MEMB_CODE,
        name: data.FULLNAME || data.DISPLAYNAME,
        selectedSize: data.SIZE_CODE,
        status: data.SIZE_CODE ? "ยืนยันขนาดแล้ว" : "ยังไม่ยืนยันขนาด",
        phone: data.MEMB_MOBILE,
        remarks: data.REMARKS,
        pickedUp: false, // This would come from pickup records
      };
      setSearchResults([result]);
    } catch (err) {
      message.error(err.message || "ไม่พบข้อมูลสมาชิก");
    } finally {
      setLoadingSearch(false);
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

  const handleSizeChange = (size) => {
    setNewSelectedSize(size);
    pickupForm.setFieldValue("selectedSize", size);
    setSizeChangeModalVisible(false);
    message.success(`เปลี่ยนขนาดเป็น ${size} แล้ว`);
  };

  const handlePickupSubmit = async (values) => {
    try {
      // Mock pickup submission - replace with real API
      console.log("Pickup submitted:", values);
      message.success("บันทึกการรับเสื้อสำเร็จ");
      setPickupModalVisible(false);
      pickupForm.resetFields();
      setSelectedMember(null);
      
      // Refresh data
      loadPickupHistory();
      loadStockData();
      
      // Refresh search results if any
      if (searchResults.length > 0) {
        handleSearch(values.memberCode);
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  const handleStockUpdate = async (size, quantity, type) => {
    if (!quantity || quantity <= 0) {
      message.error("กรุณากรอกจำนวนที่ถูกต้อง");
      return;
    }

    try {
      // Mock stock update - replace with real API
      console.log(`Stock ${type}:`, { size, quantity });
      message.success(`${type === 'add' ? 'เติม' : 'เบิก'}สต็อกสำเร็จ`);
      
      // Update local state
      setStockData(prev => ({
        ...prev,
        [size]: {
          ...prev[size],
          produced: prev[size].produced + (type === 'add' ? quantity : -quantity)
        }
      }));
      
      // Add transaction record
      const newTransaction = {
        id: Date.now(),
        size,
        quantity,
        type,
        timestamp: new Date()
      };
      setStockTransactions(prev => [newTransaction, ...prev]);
      
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการอัปเดตสต็อก");
    }
  };

  // Calculate dashboard statistics
  const dashboardStats = React.useMemo(() => {
    const total = memberList.length;
    const confirmed = memberList.filter(m => m.SIZE_CODE).length;
    const pickedUp = pickupHistory.length;
    const pending = total - confirmed;
    
    return {
      total,
      confirmed,
      pickedUp,
      pending,
      distributedToday: pickupHistory.filter(p => {
        const today = new Date();
        const pickupDate = new Date(p.timestamp);
        return pickupDate.toDateString() === today.toDateString();
      }).length
    };
  }, [memberList, pickupHistory]);

  // Menu items
  const menuItems = [
    { key: "dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
    { key: "search", icon: <SearchOutlined />, label: "ค้นหาและรับเสื้อ" },
    { key: "members", icon: <TeamOutlined />, label: "รายชื่อสมาชิก" },
    { key: "inventory", icon: <BarChartOutlined />, label: "จัดการสต็อก" },
    { key: "history", icon: <HistoryOutlined />, label: "ประวัติการจ่าย" },
    { key: "settings", icon: <SettingOutlined />, label: "ตั้งค่า" },
  ];

  // Table columns
  const searchColumns = [
    {
      title: "รหัสสมาชิก",
      dataIndex: "memberCode",
      key: "memberCode",
      width: 120,
    },
    {
      title: "ชื่อ-นามสกุล",
      dataIndex: "name",
      key: "name",
      width: 200,
    },
    {
      title: "ขนาดที่เลือก",
      dataIndex: "selectedSize",
      key: "selectedSize",
      width: 100,
      render: (size) => size ? <Tag color="blue">{size}</Tag> : <Tag color="orange">ยังไม่เลือก</Tag>,
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status, record) => {
        if (record.pickedUp) {
          return <Tag color="green" icon={<CheckCircleOutlined />}>รับแล้ว</Tag>;
        } else if (record.selectedSize) {
          return <Tag color="blue" icon={<ClockCircleOutlined />}>ยืนยันแล้ว</Tag>;
        } else {
          return <Tag color="orange" icon={<ExclamationCircleOutlined />}>ยังไม่ยืนยัน</Tag>;
        }
      },
    },
    {
      title: "การดำเนินการ",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handlePickupClick(record)}
          disabled={record.pickedUp}
        >
          {record.pickedUp ? "รับแล้ว" : "บันทึกการรับ"}
        </Button>
      ),
    },
  ];

  const membersColumns = [
    {
      title: "รหัสสมาชิก",
      dataIndex: "memberCode",
      key: "memberCode",
      width: 120,
      sorter: (a, b) => a.memberCode.localeCompare(b.memberCode),
    },
    {
      title: "ชื่อ-นามสกุล",
      dataIndex: "name",
      key: "name",
      width: 200,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "เบอร์โทร",
      dataIndex: "phone",
      key: "phone",
      width: 120,
    },
    {
      title: "ขนาดที่เลือก",
      dataIndex: "selectedSize",
      key: "selectedSize",
      width: 100,
      render: (size) => size ? <Tag color="blue">{size}</Tag> : <Tag color="orange">ยังไม่เลือก</Tag>,
      filters: ALL_SIZES.map(size => ({ text: size, value: size })),
      onFilter: (value, record) => record.selectedSize === value,
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status, record) => {
        if (record.pickedUp) {
          return <Tag color="green" icon={<CheckCircleOutlined />}>รับแล้ว</Tag>;
        } else if (record.selectedSize) {
          return <Tag color="blue" icon={<ClockCircleOutlined />}>ยืนยันแล้ว</Tag>;
        } else {
          return <Tag color="orange" icon={<ExclamationCircleOutlined />}>ยังไม่ยืนยัน</Tag>;
        }
      },
      filters: [
        { text: 'ยืนยันแล้ว', value: 'confirmed' },
        { text: 'ยังไม่ยืนยัน', value: 'pending' },
        { text: 'รับแล้ว', value: 'picked_up' },
      ],
      onFilter: (value, record) => {
        if (value === 'confirmed') return record.selectedSize && !record.pickedUp;
        if (value === 'pending') return !record.selectedSize;
        if (value === 'picked_up') return record.pickedUp;
        return true;
      },
    },
    {
      title: "หมายเหตุ",
      dataIndex: "remarks",
      key: "remarks",
      width: 150,
      ellipsis: true,
    },
    {
      title: "การดำเนินการ",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handlePickupClick(record)}
          disabled={record.pickedUp}
        >
          {record.pickedUp ? "รับแล้ว" : "บันทึกการรับ"}
        </Button>
      ),
    },
  ];

  const inventoryColumns = [
    { title: "ขนาด", dataIndex: "size", key: "size", width: 80 },
    { title: "ผลิต", dataIndex: "produced", key: "produced", width: 80 },
    { title: "จอง", dataIndex: "reserved", key: "reserved", width: 80 },
    { title: "รับแล้ว", dataIndex: "pickedUp", key: "pickedUp", width: 80 },
    {
      title: "คงเหลือ",
      key: "remaining",
      width: 100,
      render: (_, record) => {
        const remaining = record.produced - record.reserved - record.pickedUp;
        return (
          <span style={{ color: remaining <= 50 ? "#ff4d4f" : "#52c41a", fontWeight: "bold" }}>
            {remaining}
            {remaining <= 50 && <WarningOutlined style={{ marginLeft: 8 }} />}
          </span>
        );
      },
    },
  ];

  // Stock management form
  const StockManagementForm = () => {
    const [size, setSize] = useState("M");
    const [quantity, setQuantity] = useState(1);

    return (
      <Card title="จัดการสต็อก" size="small">
        <Space direction="vertical" style={{ width: "100%" }}>
          <Row gutter={16} align="middle">
            <Col span={8}>
              <Text>ขนาด:</Text>
              <Select value={size} onChange={setSize} style={{ width: "100%" }}>
                {ALL_SIZES.map(s => (
                  <Option key={s} value={s}>{s}</Option>
                ))}
              </Select>
            </Col>
            <Col span={8}>
              <Text>จำนวน:</Text>
              <InputNumber
                value={quantity}
                onChange={setQuantity}
                min={1}
                style={{ width: "100%" }}
              />
            </Col>
            <Col span={8}>
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleStockUpdate(size, quantity, "add")}
                >
                  เติม
                </Button>
                <Button
                  danger
                  icon={<MinusOutlined />}
                  onClick={() => handleStockUpdate(size, quantity, "withdraw")}
                >
                  เบิก
                </Button>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>
    );
  };

  // StatCard component
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

  // Render content based on active menu
  const renderContent = () => {
    switch (activeMenuKey) {
      case "search":
        return (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Card title="ค้นหาและจ่ายเสื้อ" bordered={false}>
              <Search
                placeholder="กรอกรหัสสมาชิก 6 หลัก"
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
          </Space>
        );

      case "members":
        return (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Card title="รายชื่อสมาชิกทั้งหมด" bordered={false}>
              <Space direction="vertical" style={{ width: "100%", marginBottom: 16 }}>
                <Row gutter={16} align="middle">
                  <Col flex="auto">
                    <Input
                      placeholder="ค้นหาด้วยรหัสสมาชิก หรือ ชื่อ-นามสกุล"
                      prefix={<SearchOutlined />}
                      value={memberFilters.search}
                      onChange={(e) => handleMemberFilter('search', e.target.value)}
                      allowClear
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col>
                    <Select
                      placeholder="สถานะ"
                      style={{ width: 140 }}
                      value={memberFilters.status}
                      onChange={(value) => handleMemberFilter('status', value)}
                    >
                      <Option value="all">ทั้งหมด</Option>
                      <Option value="confirmed">ยืนยันแล้ว</Option>
                      <Option value="pending">ยังไม่ยืนยัน</Option>
                      <Option value="picked_up">รับแล้ว</Option>
                    </Select>
                  </Col>
                  <Col>
                    <Select
                      placeholder="ขนาด"
                      style={{ width: 100 }}
                      value={memberFilters.size}
                      onChange={(value) => handleMemberFilter('size', value)}
                      allowClear
                    >
                      <Option value="all">ทั้งหมด</Option>
                      {ALL_SIZES.map(size => (
                        <Option key={size} value={size}>{size}</Option>
                      ))}
                    </Select>
                  </Col>
                  <Col>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => {
                        loadAllMembers();
                        setMemberFilters({ status: 'all', size: 'all', search: '' });
                      }}
                      loading={loadingMembers}
                    >
                      รีเฟรช
                    </Button>
                  </Col>
                </Row>
                
                <Space>
                  <Text type="secondary">
                    แสดง {filteredMembers.length} จาก {allMembers.length} รายการ
                  </Text>
                </Space>
              </Space>
              
              <Table
                dataSource={filteredMembers}
                columns={membersColumns}
                loading={loadingMembers || membersTableLoading}
                pagination={{
                  total: filteredMembers.length,
                  pageSize: 20,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ`,
                  pageSizeOptions: ['10', '20', '50', '100'],
                }}
                scroll={{ x: true }}
                size="small"
              />
            </Card>
          </Space>
        );

      case "inventory":
        const inventoryData = ALL_SIZES.map(size => ({
          key: size,
          size,
          produced: stockData[size]?.produced || 0,
          reserved: stockData[size]?.reserved || 0,
          pickedUp: stockData[size]?.pickedUp || 0,
        }));

        return (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Row gutter={16}>
              <Col span={16}>
                <Card title="ภาพรวมสต็อกสินค้า" bordered={false}>
                  <Table
                    dataSource={inventoryData}
                    columns={inventoryColumns}
                    pagination={false}
                    scroll={{ x: true }}
                    summary={(data) => {
                      const totalProduced = data.reduce((sum, item) => sum + item.produced, 0);
                      const totalReserved = data.reduce((sum, item) => sum + item.reserved, 0);
                      const totalPickedUp = data.reduce((sum, item) => sum + item.pickedUp, 0);
                      const totalRemaining = totalProduced - totalReserved - totalPickedUp;

                      return (
                        <Table.Summary.Row style={{ backgroundColor: "#f5f5f5" }}>
                          <Table.Summary.Cell index={0}><strong>รวม</strong></Table.Summary.Cell>
                          <Table.Summary.Cell index={1}><strong>{totalProduced}</strong></Table.Summary.Cell>
                          <Table.Summary.Cell index={2}><strong>{totalReserved}</strong></Table.Summary.Cell>
                          <Table.Summary.Cell index={3}><strong>{totalPickedUp}</strong></Table.Summary.Cell>
                          <Table.Summary.Cell index={4}>
                            <strong style={{ color: totalRemaining <= 200 ? "#ff4d4f" : "#52c41a" }}>
                              {totalRemaining}
                            </strong>
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                      );
                    }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <StockManagementForm />
                <Card title="ประวัติการเติม-เบิก" size="small" style={{ marginTop: 16 }}>
                  <List
                    size="small"
                    dataSource={stockTransactions.slice(0, 10)}
                    renderItem={(item) => (
                      <List.Item>
                        <Text>{new Date(item.timestamp).toLocaleString("th-TH")}</Text>
                        <Tag color={item.type === "add" ? "green" : "orange"}>
                          {item.type === "add" ? "เติม" : "เบิก"} {item.size} ({item.quantity} ตัว)
                        </Tag>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          </Space>
        );

      case "history":
        return (
          <Card title="ประวัติการรับเสื้อ" bordered={false}>
            <Table
              dataSource={pickupHistory}
              columns={[
                { title: "วันที่", dataIndex: "timestamp", key: "timestamp", render: (date) => new Date(date).toLocaleString("th-TH") },
                { title: "รหัสสมาชิก", dataIndex: "memberCode", key: "memberCode" },
                { title: "ขนาด", dataIndex: "size", key: "size", render: (size) => <Tag color="blue">{size}</Tag> },
                { 
                  title: "ผู้รับ", 
                  key: "pickup", 
                  render: (_, record) => record.pickupType === "proxy" 
                    ? <Text>รับแทน: {record.proxyName}</Text> 
                    : <Text>รับด้วยตนเอง</Text>
                },
              ]}
              pagination={{ pageSize: 20 }}
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
            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
              <Col xs={24} sm={12} lg={6}>
                <StatCard
                  icon={<TrophyOutlined />}
                  title="จ่ายแล้ววันนี้"
                  value={dashboardStats.distributedToday}
                  color="#d8f3dc"
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <StatCard
                  icon={<CheckCircleOutlined />}
                  title="ยืนยันแล้ว"
                  value={dashboardStats.confirmed}
                  color="#cfe2ff"
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <StatCard
                  icon={<ClockCircleOutlined />}
                  title="รอยืนยัน"
                  value={dashboardStats.pending}
                  color="#fff3cd"
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <StatCard
                  icon={<TeamOutlined />}
                  title="สมาชิกทั้งหมด"
                  value={dashboardStats.total}
                  color="#f8d7da"
                />
              </Col>
            </Row>

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
              <Row gutter={16}>
                <Col span={12}>
                  <Card title="การรับเสื้อล่าสุด" size="small">
                    <List
                      size="small"
                      dataSource={pickupHistory.slice(0, 5)}
                      renderItem={(item) => (
                        <List.Item>
                          <Text>{item.memberCode}</Text>
                          <Tag color="blue">{item.size}</Tag>
                          <Text type="secondary">{new Date(item.timestamp).toLocaleString("th-TH")}</Text>
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="สต็อกใกล้หมด" size="small">
                    <List
                      size="small"
                      dataSource={ALL_SIZES.filter(size => {
                        const remaining = (stockData[size]?.produced || 0) - 
                                        (stockData[size]?.reserved || 0) - 
                                        (stockData[size]?.pickedUp || 0);
                        return remaining <= 50;
                      }).slice(0, 5)}
                      renderItem={(size) => {
                        const remaining = (stockData[size]?.produced || 0) - 
                                        (stockData[size]?.reserved || 0) - 
                                        (stockData[size]?.pickedUp || 0);
                        return (
                          <List.Item>
                            <Tag color="red">{size}</Tag>
                            <Text>เหลือ {remaining} ตัว</Text>
                            <WarningOutlined style={{ color: "#ff4d4f" }} />
                          </List.Item>
                        );
                      }}
                    />
                  </Card>
                </Col>
              </Row>
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

      {/* Pickup Modal */}
      <Modal
        title="บันทึกการรับเสื้อ"
        open={pickupModalVisible}
        onCancel={() => {
          setPickupModalVisible(false);
          pickupForm.resetFields();
          setSelectedMember(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={pickupForm}
          layout="vertical"
          onFinish={handlePickupSubmit}
        >
          <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
            <Descriptions.Item label="รหัสสมาชิก">
              {selectedMember?.memberCode}
            </Descriptions.Item>
            <Descriptions.Item label="ชื่อ-นามสกุล">
              {selectedMember?.name}
            </Descriptions.Item>
          </Descriptions>

          <Form.Item
            name="selectedSize"
            label={
              <Space>
                ขนาดที่เลือก
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => setSizeChangeModalVisible(true)}
                >
                  เปลี่ยนขนาด
                </Button>
              </Space>
            }
          >
            <Tag color="blue" style={{ fontSize: 16, padding: "4px 12px" }}>
              {pickupForm.getFieldValue("selectedSize") || selectedMember?.selectedSize || "ยังไม่เลือก"}
            </Tag>
          </Form.Item>

          <Form.Item name="pickupType" label="ผู้รับเสื้อ" initialValue="self">
            <Radio.Group>
              <Radio value="self">รับด้วยตนเอง</Radio>
              <Radio value="proxy">รับแทน</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.pickupType !== currentValues.pickupType
            }
          >
            {({ getFieldValue }) =>
              getFieldValue('pickupType') === 'proxy' ? (
                <>
                  <Form.Item
                    name="proxyMemberCode"
                    label="รหัสสมาชิกผู้รับแทน"
                    rules={[{ required: true, message: 'กรุณากรอกรหัสสมาชิก' }]}
                  >
                    <Input placeholder="กรอกรหัสสมาชิก 6 หลัก" maxLength={6} />
                  </Form.Item>
                  <Form.Item
                    name="proxyName"
                    label="ชื่อ-สกุล ผู้รับแทน"
                    rules={[{ required: true, message: 'กรุณากรอกชื่อผู้รับแทน' }]}
                  >
                    <Input placeholder="กรอกชื่อ หรือค้นหาจากรหัสสมาชิก" />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>

          <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setPickupModalVisible(false)}>
                ยกเลิก
              </Button>
              <Button type="primary" htmlType="submit">
                บันทึกการรับเสื้อ
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Size Change Modal */}
      <Modal
        title="เลือกขนาดเสื้อใหม่"
        open={sizeChangeModalVisible}
        onCancel={() => setSizeChangeModalVisible(false)}
        footer={null}
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            📏 <a href="https://apps2.coop.ku.ac.th/asset/images/png/sizewidth.png" target="_blank" rel="noopener noreferrer">
              วิธีวัดขนาดเสื้อ
            </a>
          </Text>
        </div>
        
        <Row gutter={[16, 16]}>
          {ALL_SIZES.map(size => {
            const dimensions = SIZE_DIMENSIONS[size];
            return (
              <Col xs={12} sm={8} md={6} lg={4} key={size}>
                <Card
                  hoverable
                  size="small"
                  onClick={() => handleSizeChange(size)}
                  style={{
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: newSelectedSize === size ? '2px solid #1890ff' : '1px solid #d9d9d9'
                  }}
                >
                  <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: 8 }}>
                    {size}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    อก {dimensions.chest}"<br />
                    ยาว {dimensions.length}"
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
        
        <div style={{ marginTop: 16, padding: 16, backgroundColor: '#fffbe6', borderRadius: 6 }}>
          <Text style={{ fontSize: '14px', color: '#856404' }}>
            <strong>คำแนะนำ:</strong> ควรเพิ่มขนาดจากที่วัดรอบอกได้ขึ้นอีกประมาณ 2" เนื่องจากเสื้อแจ็คเก็ตมักสวมทับกับเสื้ออื่น
            เช่น วัดได้ 40" ให้เลือกขนาดเสื้อ 42" แทน
          </Text>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDashboard;