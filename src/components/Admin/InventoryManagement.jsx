// ===================================================================
// File: src/components/Admin/InventoryManagement.jsx
// Description: UI จัดการสต็อกเสื้อ (Admin)
// ปรับปรุง: UX ที่ดีขึ้น - เลือก Action ก่อน แล้วค่อยกรอกข้อมูล
// ===================================================================

import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  InputNumber,
  Select,
  Input,
  Space,
  Typography,
  message,
  Tag,
  Alert,
  Spin,
  Row,
  Col,
  Grid,
  Descriptions,
} from "antd";
import {
  PlusOutlined,
  MinusOutlined,
  ReloadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { getInventorySummary, adjustInventory } from "../../services/shirtApi";
import { useAppContext } from "../../App";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ALL_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
  "6XL",
];

const InventoryManagement = () => {
  const { user } = useAppContext();
  const [form] = Form.useForm();
  const screens = Grid.useBreakpoint();

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState("ADD");
  const [submitting, setSubmitting] = useState(false);
  const isMobile = !screens?.md;

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInventorySummary();
      console.log("📥 Inventory Data:", data);
      setInventory(data || []);
    } catch (err) {
      console.error("Error loading inventory:", err);
      setError(err.message || "ไม่สามารถโหลดข้อมูลสต็อกได้");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type) => {
    setAdjustmentType(type);
    setModalVisible(true);
    form.resetFields();
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    form.resetFields();
  };

  const handleSubmitAdjustment = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const adjustmentData = {
        sizeCode: values.sizeCode,
        quantity: values.quantity,
        type: adjustmentType,
        remarks: values.remarks || "",
        processedBy: user.memberCode,
      };
      await adjustInventory(adjustmentData);
      message.success(
        adjustmentType === "ADD"
          ? `เติมสต็อกขนาด ${values.sizeCode} จำนวน ${values.quantity} ตัว สำเร็จ`
          : `เบิกสต็อกขนาด ${values.sizeCode} จำนวน ${values.quantity} ตัว สำเร็จ`
      );
      handleCloseModal();
      loadInventory();
    } catch (error) {
      if (error.errorFields) return;
      message.error(error.message || "เกิดข้อผิดพลาดในการปรับสต็อก");
    } finally {
      setSubmitting(false);
    }
  };

  const totals = inventory.reduce(
    (acc, item) => ({
      produced: acc.produced + (item.produced || 0),
      reserved: acc.reserved + (item.reserved || 0),
      received: acc.received + (item.received || 0),
      distributed: acc.distributed + (item.distributed || 0),
      remaining: acc.remaining + (item.remaining || 0),
    }),
    { produced: 0, reserved: 0, received: 0, distributed: 0, remaining: 0 }
  );

  const lowStockCount = inventory.filter((item) => item.isLowStock).length;

  const columns = [
    {
      title: "ขนาด",
      dataIndex: "sizeCode",
      key: "sizeCode",
      align: "center",
      render: (size) => (
        <Tag color="blue" style={{ fontSize: 14, fontWeight: "bold" }}>
          {size}
        </Tag>
      ),
    },
    {
      title: "ผลิต",
      dataIndex: "produced",
      key: "produced",
      align: "right",
      responsive: ["md"],
      render: (value) => (
        <Text strong style={{ color: "#1890ff" }}>
          {Number(value).toLocaleString()}
        </Text>
      ),
    },
    {
      title: "จอง",
      dataIndex: "reserved",
      key: "reserved",
      align: "right",
      responsive: ["md"],
      render: (value) => (
        <Text style={{ color: "#52c41a" }}>
          {Number(value).toLocaleString()}
        </Text>
      ),
    },
    {
      title: "รับแล้ว",
      dataIndex: "received",
      key: "received",
      align: "right",
      render: (value) => (
        <Text style={{ color: "#faad14" }}>
          {Number(value).toLocaleString()}
        </Text>
      ),
    },
    {
      title: "เบิก",
      dataIndex: "distributed",
      key: "distributed",
      align: "right",
      responsive: ["md"],
      render: (value) => (
        <Text style={{ color: "#ff4d4f" }}>
          {Number(value).toLocaleString()}
        </Text>
      ),
    },
    {
      title: "คงเหลือ",
      dataIndex: "remaining",
      key: "remaining",
      align: "right",
      render: (value, record) => {
        const isLowStock = record.isLowStock;
        return (
          <Space>
            {isLowStock && <WarningOutlined style={{ color: "#ff4d4f" }} />}
            <Text
              strong
              style={{
                color: isLowStock ? "#ff4d4f" : value === 0 ? "#999" : "#000",
                fontSize: 16,
              }}
            >
              {Number(value).toLocaleString()}
            </Text>
          </Space>
        );
      },
    },
    {
      title: "สถานะ",
      key: "status",
      align: "center",
      render: (_, record) => {
        if (record.remaining === 0) {
          return <Tag color="default">หมดสต็อก</Tag>;
        }
        if (record.isLowStock) {
          return (
            <Tag color="error" icon={<WarningOutlined />}>
              ใกล้หมด
            </Tag>
          );
        }
        return (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            ปกติ
          </Tag>
        );
      },
    },
  ];

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">กำลังโหลดข้อมูลสต็อก...</Text>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert
        message="เกิดข้อผิดพลาด"
        description={error}
        type="error"
        showIcon
        action={<Button onClick={loadInventory}>ลองอีกครั้ง</Button>}
      />
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {lowStockCount > 0 && (
        <Alert
          message="⚠️ แจ้งเตือนสต็อกใกล้หมด"
          description={`พบสต็อกเสื้อใกล้หมด ${lowStockCount} ขนาด`}
          type="warning"
          showIcon
        />
      )}

      <Card
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>
              สรุปสต็อกเสื้อแจ็คเก็ต
            </Title>
          </Space>
        }
        extra={
          <Space wrap>
            <Button
              type="primary"
              size="large"
              onClick={() => handleOpenModal("ADD")}
              style={{
                backgroundColor: "#1890ff",
                borderColor: "#1890ff",
                borderRadius: 8,
                fontWeight: 600,
              }}
            >
              จัดการสต็อก
            </Button>
            <Button
              size="large"
              icon={<ReloadOutlined />}
              onClick={loadInventory}
              style={{
                borderRadius: 8,
              }}
            >
              รีเฟรช
            </Button>
          </Space>
        }
      >
        {isMobile ? (
          <Row gutter={[12, 12]}>
            {inventory.map((item) => (
              <Col xs={24} sm={12} key={item.sizeCode}>
                <Card
                  size="small"
                  style={{
                    borderRadius: 12,
                    boxShadow: "0 6px 18px rgba(15,15,15,0.06)",
                  }}
                  bodyStyle={{ padding: 12 }}
                >
                  <Descriptions
                    size="small"
                    column={1}
                    bordered
                    labelStyle={{ width: 110, fontWeight: 700 }}
                    contentStyle={{ paddingLeft: 8 }}
                  >
                    <Descriptions.Item label="ขนาด">
                      <Tag color="blue" style={{ fontWeight: 700 }}>
                        {item.sizeCode}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="ผลิต">
                      {Number(item.produced).toLocaleString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="จอง">
                      {Number(item.reserved).toLocaleString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="รับแล้ว">
                      {Number(item.received).toLocaleString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="เบิก">
                      {Number(item.distributed).toLocaleString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="คงเหลือ">
                      <span style={{ fontWeight: 800 }}>
                        {Number(item.remaining).toLocaleString()}
                      </span>
                    </Descriptions.Item>
                    <Descriptions.Item label="สถานะ">
                      <Tag
                        color={
                          item.remaining === 0
                            ? "default"
                            : item.isLowStock
                            ? "error"
                            : "success"
                        }
                      >
                        {item.remaining === 0
                          ? "หมดสต็อก"
                          : item.isLowStock
                          ? "ใกล้หมด"
                          : "ปกติ"}
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Table
            dataSource={inventory}
            columns={columns}
            rowKey="sizeCode"
            pagination={false}
            bordered
            scroll={{ x: "max-content" }}
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <b>รวม</b>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  {totals.produced.toLocaleString()}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  {totals.reserved.toLocaleString()}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  {totals.received.toLocaleString()}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  {totals.distributed.toLocaleString()}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  {totals.remaining.toLocaleString()}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6}></Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        )}
      </Card>

      {/* Modal จัดการสต็อก */}
      <Modal
        open={modalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width={560}
        closeIcon={
          <CloseOutlined style={{ fontSize: 20, color: "#999" }} />
        }
        style={{ top: 60 }}
        styles={{
          header: { textAlign: "center", borderBottom: "none", paddingBottom: 0 },
          body: { paddingTop: 16 }
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
            จัดการสต็อก
          </Title>
        </div>

        {/* Form */}
        <Form form={form} layout="vertical">
          <Form.Item
            name="sizeCode"
            label={
              <Text strong style={{ fontSize: 15 }}>
                <span style={{ color: "#ff4d4f", marginRight: 4 }}></span>
                เลือกขนาด
              </Text>
            }
            rules={[{ required: true, message: "กรุณาเลือกขนาดเสื้อ" }]}
          >
            <Select
              placeholder="เลือกขนาด"
              size="large"
              style={{ fontSize: 16 }}
              suffixIcon={
                <span style={{ fontSize: 20, color: "#999" }}>▼</span>
              }
            >
              {ALL_SIZES.map((size) => (
                <Option key={size} value={size}>
                  {size}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label={
              <Text strong style={{ fontSize: 15 }}>
                <span style={{ color: "#ff4d4f", marginRight: 4 }}></span>
                จำนวน
              </Text>
            }
            rules={[
              { required: true, message: "กรุณาระบุจำนวน" },
              { type: "number", min: 1, message: "จำนวนต้องมากกว่า 0" },
            ]}
          >
            <InputNumber
              min={1}
              placeholder="กรอกจำนวน"
              size="large"
              style={{ width: "100%", fontSize: 16 }}
            />
          </Form.Item>

          <Form.Item
            label={
              <Text strong style={{ fontSize: 15 }}>
                ผู้ทำรายการ
              </Text>
            }
          >
            <Input
              value={user?.memberCode || "ADMIN"}
              disabled
              size="large"
              style={{
                fontSize: 16,
                backgroundColor: "#f5f5f5",
                color: "#666",
              }}
            />
          </Form.Item>

          <Form.Item
            name="remarks"
            label={
              <Text strong style={{ fontSize: 15 }}>
                หมายเหตุ (ถ้ามี)
              </Text>
            }
          >
            <TextArea
              rows={3}
              placeholder="เช่น เบิกให้แทน, ของชำรุด"
              style={{ fontSize: 14 }}
              maxLength={200}
              showCount
            />
          </Form.Item>

          {/* Buttons - ปรับสีให้เข้ากับ theme */}
          <Row gutter={16} style={{ marginTop: 32 }}>
            <Col span={12}>
              <Button
                block
                size="large"
                loading={submitting && adjustmentType === "ADD"}
                onClick={() => {
                  setAdjustmentType("ADD");
                  handleSubmitAdjustment();
                }}
                icon={<PlusOutlined />}
                style={{
                  height: 52,
                  fontSize: 16,
                  fontWeight: 600,
                  borderRadius: 8,
                  backgroundColor: "#52c41a",
                  borderColor: "#52c41a",
                  color: "white",
                }}
              >
                เติมสต็อก
              </Button>
            </Col>
            <Col span={12}>
              <Button
                block
                size="large"
                loading={submitting && adjustmentType === "REMOVE"}
                onClick={() => {
                  setAdjustmentType("REMOVE");
                  handleSubmitAdjustment();
                }}
                icon={<MinusOutlined />}
                style={{
                  height: 52,
                  fontSize: 16,
                  fontWeight: 600,
                  borderRadius: 8,
                  backgroundColor: "#faad14",
                  borderColor: "#faad14",
                  color: "white",
                }}
              >
                เบิกสต็อก
              </Button>
            </Col>
          </Row>
        </Form>

        {/* ท้ายรายการ - เติมสต็อกล่าสุด */}
        {/* <div
          style={{
            marginTop: 24,
            padding: "12px 16px",
            backgroundColor: "#e6f7ff",
            borderRadius: 8,
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          <Text style={{ color: "#1890ff", fontWeight: 600 }}>
            ทำรายการเติมสต็อกล่าเร็ว
          </Text>
        </div> */}
      </Modal>
    </Space>
  );
};

export default InventoryManagement;