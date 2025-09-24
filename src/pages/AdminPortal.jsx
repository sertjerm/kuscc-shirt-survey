// src/pages/AdminPortal.jsx
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
  ShirtSize,
} from "@ant-design/icons";

// Import shirt sizes data
import { shirtSizes } from "../utils/shirt-size";

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { Search } = Input;

const AdminPortal = () => {
  const { user, logout } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [activeTab, setActiveTab] = useState("search");
  const [form] = Form.useForm();

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
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success(`จ่ายเสื้อขนาด ${values.selectedSize} ให้ ${selectedMember.name} เรียบร้อยแล้ว`);
      setShowDistributionModal(false);
      setSelectedMember(null);
      form.resetFields();
      
      // อัปเดตสถานะในผลการค้นหา
      setSearchResults(prev => 
        prev.map(member => 
          member.memberCode === selectedMember.memberCode 
            ? { ...member, status: "รับเสื้อแล้ว", selectedSize: values.selectedSize }
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
            backgroundColor: remaining <= 50 ? "rgba(255, 59, 48, 0.1)" : "rgba(50, 215, 75, 0.1)",
            padding: "4px 8px",
            borderRadius: "6px"
          }}
        >
          {remaining}
        </Text>
      ),
    },
  ];

  const sizeOptions = shirtSizes?.sizes
    ?.filter(size => size.active)
    ?.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
    ?.map(size => ({
      value: size.code,
      label: `${size.code} (${size.chest?.inch || 'N/A'}" × ${size.length?.inch || 'N/A'}")`,
    })) || [];

  return (
    <div className="admin-portal-container">
      {/* Header */}
      <Card
        style={{
          maxWidth: 1200,
          margin: "0 auto 16px",
          borderRadius: "20px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
          position: "relative",
        }}
      >
        <Button
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          type="text"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            color: "#48484a",
            background: "rgba(0,0,0,0.04)",
            borderRadius: "50%",
            width: 40,
            height: 40,
            minWidth: 40,
            minHeight: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
            fontSize: 20,
          }}
          aria-label="logout"
        />

        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            paddingRight: 48,
          }}
        >
          <Avatar
            size={48}
            icon={<UserOutlined />}
            style={{
              background: "linear-gradient(135deg, #FF9500, #FF7A00)",
              border: "2px solid rgba(255, 255, 255, 0.3)",
              minWidth: 48,
              minHeight: 48,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <Title
              level={4}
              style={{
                margin: 0,
                color: "#1d1d1f",
                fontSize: 18,
                wordBreak: "break-word",
              }}
            >
              {user?.name || "ผู้ดูแลระบบ"}
            </Title>
            <Text
              style={{
                color: "#48484a",
                fontSize: 14,
                wordBreak: "break-word",
              }}
            >
              ระบบจัดการแจกเสื้อ | เจ้าหน้าที่
            </Text>
          </div>
        </div>

        <div style={{ marginTop: 12, textAlign: "center" }}>
          <Tag
            color="#FF9500"
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: "14px",
              border: "none",
              display: "inline-block",
              minWidth: 120,
              marginTop: 4,
            }}
          >
            สถานะ: ออนไลน์
          </Tag>
        </div>
      </Card>

      {/* Main Content */}
      <Card
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          borderRadius: "24px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.1)",
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} centered>
          <TabPane 
            tab={
              <span>
                <SearchOutlined />
                ค้นหาสมาชิก
              </span>
            } 
            key="search"
          >
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <Title level={3} style={{ color: "#1d1d1f", marginBottom: 8 }}>
                  ค้นหาสมาชิก
                </Title>
                <Paragraph style={{ color: "#48484a", fontSize: 16 }}>
                  กรอกเลขสมาชิก 6 หลักเพื่อค้นหา
                </Paragraph>
              </div>

              <Search
                placeholder="กรอกเลขสมาชิก 6 หลัก"
                enterButton={<SearchOutlined />}
                size="large"
                loading={loading}
                onSearch={handleSearch}
                maxLength={6}
                style={{ marginBottom: 24 }}
              />

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div>
                  <Title level={4} style={{ marginBottom: 16 }}>
                    ผลการค้นหา
                  </Title>
                  {searchResults.map((member) => (
                    <Card
                      key={member.memberCode}
                      style={{
                        marginBottom: 16,
                        borderRadius: 16,
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
                            <Text type="secondary">
                              หน่วยงาน: {member.unit}
                            </Text>
                            {member.selectedSize && (
                              <Text>
                                ขนาดที่เลือก: <Tag color="#007AFF">{member.selectedSize}</Tag>
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
                </div>
              )}
            </div>
          </TabPane>

          <TabPane 
            tab={
              <span>
                <BarChartOutlined />
                สต็อกคงเหลือ
              </span>
            } 
            key="inventory"
          >
            <div>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <Title level={3} style={{ color: "#1d1d1f", marginBottom: 8 }}>
                  สรุปสต็อกเสื้อ
                </Title>
                <Paragraph style={{ color: "#48484a", fontSize: 16 }}>
                  ข้อมูลสต็อกและการจ่ายเสื้อ
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
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card style={{ textAlign: "center", borderRadius: 12 }}>
                    <Statistic 
                      title="จองแล้ว" 
                      value={totalStats.reserved} 
                      valueStyle={{ color: "#FF9500" }}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card style={{ textAlign: "center", borderRadius: 12 }}>
                    <Statistic 
                      title="จ่ายแล้ว" 
                      value={totalStats.distributed} 
                      valueStyle={{ color: "#32D74B" }}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card style={{ textAlign: "center", borderRadius: 12 }}>
                    <Statistic 
                      title="คงเหลือ" 
                      value={totalStats.remaining} 
                      valueStyle={{ color: totalStats.remaining <= 200 ? "#FF3B30" : "#32D74B" }}
                    />
                  </Card>
                </Col>
              </Row>

              {/* Low Stock Alert */}
              {mockInventory.some(item => item.remaining <= 50) && (
                <Alert
                  message="แจ้งเตือนสต็อกใกล่หมด"
                  description="พบสต็อกเสื้อบางขนาดเหลือน้อย กรุณาตรวจสอบและเติมสต็อก"
                  type="warning"
                  showIcon
                  style={{ marginBottom: 24, borderRadius: 12 }}
                  action={
                    <Button size="small" type="primary" ghost>
                      ดูรายละเอียด
                    </Button>
                  }
                />
              )}

              {/* Inventory Table */}
              <Card 
                title="รายละเอียดสต็อกแต่ละขนาด" 
                style={{ borderRadius: 16 }}
                extra={
                  <Button 
                    type="primary" 
                    ghost 
                    icon={<EditOutlined />}
                    size="small"
                  >
                    จัดการสต็อก
                  </Button>
                }
              >
                <Table
                  dataSource={mockInventory}
                  columns={inventoryColumns}
                  rowKey="size"
                  pagination={false}
                  size="small"
                  style={{ borderRadius: 12 }}
                />
              </Card>

              {/* Additional Info */}
              <div style={{ marginTop: 24 }}>
                <Alert
                  message="หมายเหตุ"
                  description="สต็อกที่แสดงเป็นสีแดงคือขนาดที่เหลือ ≤ 50 ตัว ควรเติมสต็อกเพิ่มเติม"
                  type="info"
                  showIcon
                  style={{ borderRadius: 12 }}
                />
              </div>
            </div>
          </TabPane>
        </Tabs>
      </Card>

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
                    src={`https://apps2.coop.ku.ac.th/asset/member_photo/${selectedMember.memberCode}.png`}
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
                    รหัสสมาชิก: {selectedMember.memberCode} | {selectedMember.round}
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
                    rules={[{ required: true, message: "กรุณากรอกชื่อผู้รับแทน" }]}
                  >
                    <Input
                      placeholder="กรอกชื่อผู้รับแทน"
                      size="large"
                    />
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
  );
};

export default AdminPortal;