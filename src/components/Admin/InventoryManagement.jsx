// ===================================================================
// File: src/components/Admin/InventoryManagement.jsx
// Description: จัดการสต็อกเสื้อแจ็คเก็ต - แสดงสรุปและปรับสต็อก
// Updated: ตัด column "สถานะ" ออก + เพิ่ม Highlight แถว 2 แบบ
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
  Popover,
} from "antd";
import {
  PlusOutlined,
  MinusOutlined,
  ReloadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { getInventorySummary, adjustInventory } from "../../services/shirtApi";
import { useAppContext } from "../../App";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// ขนาดเสื้อทั้งหมดที่มีในระบบ
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

  // State สำหรับจัดการข้อมูล
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isMobile = !screens?.md;

  // โหลดข้อมูลสต็อกตอน component mount
  useEffect(() => {
    loadInventory();
  }, []);

  // ฟังก์ชันโหลดข้อมูลสต็อกจาก API
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

  // เปิด Modal สำหรับเติม/เบิกสต็อก
  const handleOpenModal = () => {
    setModalVisible(true);
    form.resetFields();
  };

  // ปิด Modal
  const handleCloseModal = () => {
    setModalVisible(false);
    form.resetFields();
  };

  // ฟังก์ชันบันทึกการเติม/เบิกสต็อก
  const handleSubmitAdjustment = async (actionType) => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const adjustmentData = {
        sizeCode: values.sizeCode,
        quantity: values.quantity,
        type: actionType,
        remarks: values.remarks || "",
        processedBy: user.memberCode,
      };

      await adjustInventory(adjustmentData);

      message.success(
        actionType === "ADD"
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

  // คำนวณยอดรวมทั้งหมด
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

  // นับจำนวนขนาดที่สต็อกต่ำ (≤ 50)
  const lowStockCount = inventory.filter((item) => item.isLowStock).length;

  // นับจำนวนขนาดที่สมาชิกจองเกินสต็อก
  const overReservedCount = inventory.filter(
    (item) => item.reserved > item.produced
  ).length;

  // ===================================================================
  // ✅ COLUMNS สำหรับตาราง (Desktop View) - ตัด "สถานะ" ออกแล้ว
  // ===================================================================
  const columns = [
    {
      title: "ขนาด",
      dataIndex: "sizeCode",
      key: "sizeCode",
      align: "center",
      render: (size) => (
        <Text strong style={{ fontSize: 14, color: "#000" }}>
          {size}
        </Text>
      ),
    },
    {
      title: "สต็อกเสื้อ (I)",
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
      title: "สมาชิกจอง",
      dataIndex: "reserved",
      key: "reserved",
      align: "right",
      responsive: ["md"],
      render: (value, record) => {
        const isOverReserved = value > record.produced;
        const shortage = value - record.produced;

        // ✅ ถ้าจองเกิน แสดง Popover พร้อม icon เตือน (สีส้ม/warning)
        if (isOverReserved) {
          const popoverContent = (
            <div style={{ maxWidth: 280 }}>
              <Text strong style={{ color: "#faad14", fontSize: 15 }}>
                ⚠️ สมาชิกจองเกินสต็อก!
              </Text>
              <div style={{ marginTop: 8, fontSize: 14 }}>
                <Text>สต็อกเสื้อ: {record.produced.toLocaleString()} ตัว</Text>
                <br />
                <Text>สมาชิกจอง: {value.toLocaleString()} คน</Text>
                <br />
                <Text strong style={{ color: "#faad14" }}>
                  ขาด: {shortage.toLocaleString()} ตัว
                </Text>
              </div>
              <div
                style={{
                  marginTop: 12,
                  padding: "8px 12px",
                  backgroundColor: "#fff7e6",
                  borderRadius: 6,
                  borderLeft: "3px solid #faad14",
                }}
              >
                <Text type="secondary" style={{ fontSize: 13 }}>
                  💡 <strong>คำแนะนำ:</strong> ควรเติมสต็อกเพิ่ม หรือติดต่อสมาชิกเพื่อเปลี่ยนขนาด
                </Text>
              </div>
            </div>
          );

          return (
            <Popover
              content={popoverContent}
              title={null}
              trigger="hover"
              placement="top"
            >
              <Space>
                <ExclamationCircleOutlined
                  style={{
                    color: "#faad14",
                    fontSize: 18,
                    animation: "pulse 1.5s infinite",
                  }}
                />
                <Text strong style={{ color: "#faad14" }}>
                  {Number(value).toLocaleString()}
                </Text>
              </Space>
            </Popover>
          );
        }

        // ถ้าไม่เกิน แสดงปกติ (สีเขียว)
        return (
          <Text style={{ color: "#52c41a" }}>
            {Number(value).toLocaleString()}
          </Text>
        );
      },
    },
    {
      title: "สมาชิกรับแล้ว",
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
      title: "เบิกภายใน (2)",
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
      title: "สต็อกคงเหลือ",
      dataIndex: "remaining",
      key: "remaining",
      align: "right",
      render: (value, record) => {
        const isLowStock = record.isLowStock;
        return (
          <Space>
            {/* ✅ แสดง icon เตือนถ้าสต็อกต่ำ */}
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
    // ❌ ตัด column "สถานะ" ออกแล้ว
  ];

  // แสดง Loading
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

  // แสดง Error
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
      {/* ===================================================================
          ✅ Alert Box: เตือนสมาชิกจองเกิน (สีส้ม/warning)
          =================================================================== */}
      {overReservedCount > 0 && (
        <Alert
          message="⚠️ พบสมาชิกจองเกินสต็อก"
          description={`มี ${overReservedCount} ขนาดที่สมาชิกจองเกินจำนวนสต็อกที่มี กรุณาตรวจสอบและเติมสต็อกเพิ่ม`}
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* ===================================================================
          ✅ Alert Box: เตือนสต็อกต่ำ (สีแดง/error)
          =================================================================== */}
      {lowStockCount > 0 && (
        <Alert
          message="🚨 แจ้งเตือนสต็อกต่ำกว่าเกณฑ์!"
          description={`พบสต็อกเสื้อต่ำกว่าเกณฑ์ ${lowStockCount} ขนาด ต้องเติมสต็อกด่วน!`}
          type="error"
          showIcon
          icon={<WarningOutlined />}
        />
      )}

      {/* ===================================================================
          CARD หลัก: ตารางสรุปสต็อก
          =================================================================== */}
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
              onClick={() => handleOpenModal()}
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
        {/* ===================================================================
            ✅ MOBILE VIEW: แสดงเป็นการ์ด พร้อม border สีตามสถานะ
            =================================================================== */}
        {isMobile ? (
          <Row gutter={[12, 12]}>
            {inventory.map((item) => {
              const isOverReserved = item.reserved > item.produced;
              const shortage = item.reserved - item.produced;

              return (
                <Col xs={24} sm={12} key={item.sizeCode}>
                  <Card
                    size="small"
                    style={{
                      borderRadius: 12,
                      boxShadow: "0 6px 18px rgba(15,15,15,0.06)",
                      // ✅ Priority: หมด > ต่ำ > จองเกิน
                      borderLeft:
                        item.remaining === 0
                          ? "4px solid #ff4d4f" // แดง = หมด
                          : item.isLowStock
                          ? "4px solid #faad14" // ส้ม = ต่ำ
                          : isOverReserved
                          ? "4px solid #faad14" // ส้ม = จองเกิน
                          : undefined,
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
                      <Descriptions.Item label="สต็อกเสื้อ">
                        {Number(item.produced).toLocaleString()}
                      </Descriptions.Item>
                      <Descriptions.Item label="สมาชิกจอง">
                        {isOverReserved ? (
                          <Space>
                            <ExclamationCircleOutlined
                              style={{ color: "#faad14" }}
                            />
                            <Text strong style={{ color: "#faad14" }}>
                              {Number(item.reserved).toLocaleString()}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              (ขาด {shortage})
                            </Text>
                          </Space>
                        ) : (
                          Number(item.reserved).toLocaleString()
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="สมาชิกรับแล้ว">
                        {Number(item.received).toLocaleString()}
                      </Descriptions.Item>
                      <Descriptions.Item label="เบิกภายใน">
                        {Number(item.distributed).toLocaleString()}
                      </Descriptions.Item>
                      <Descriptions.Item label="สต็อกคงเหลือ">
                        <span
                          style={{
                            fontWeight: 800,
                            color: item.isLowStock ? "#ff4d4f" : "#000",
                          }}
                        >
                          {Number(item.remaining).toLocaleString()}
                        </span>
                      </Descriptions.Item>
                      {/* ❌ ตัด "สถานะ" ออกจาก Mobile View แล้ว */}
                    </Descriptions>
                  </Card>
                </Col>
              );
            })}
          </Row>
        ) : (
          /* ===================================================================
             ✅ DESKTOP VIEW: แสดงเป็นตาราง พร้อม Highlight แถว 2 แบบ
             =================================================================== */
          <Table
            dataSource={inventory}
            columns={columns}
            rowKey="sizeCode"
            pagination={false}
            bordered
            scroll={{ x: "max-content" }}
            // ✅ Highlight แถวตามสถานะ:
            // 1. หมด (remaining === 0) = สีแดงอ่อน
            // 2. ต่ำ (isLowStock) = สีส้มอ่อน
            rowClassName={(record) => {
              if (record.remaining === 0) return "out-of-stock-row";
              if (record.isLowStock) return "low-stock-row";
              return "";
            }}
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
                {/* ❌ ตัด index={6} ออกแล้ว (เดิมเป็น column สถานะ) */}
              </Table.Summary.Row>
            )}
          />
        )}
      </Card>

      {/* ===================================================================
          MODAL: เติม/เบิกสต็อก
          =================================================================== */}
      <Modal
        open={modalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width={560}
        closeIcon={<CloseOutlined style={{ fontSize: 20, color: "#999" }} />}
        style={{ top: 60 }}
        styles={{
          header: {
            textAlign: "center",
            borderBottom: "none",
            paddingBottom: 0,
          },
          body: { paddingTop: 16 },
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

          {/* Buttons */}
          <Row gutter={16} style={{ marginTop: 32 }}>
            <Col span={12}>
              <Button
                block
                size="large"
                loading={submitting}
                onClick={() => handleSubmitAdjustment("ADD")}
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
                loading={submitting}
                onClick={() => handleSubmitAdjustment("REMOVE")}
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
      </Modal>

      {/* ===================================================================
          ✅ CSS: Highlight แถว 2 แบบ + Animation
          =================================================================== */}
      <style jsx>{`
        /* Animation สำหรับ icon เตือน */
        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }

        /* ✅ สต็อกต่ำ (isLowStock) = สีส้มอ่อน (warning) */
        .low-stock-row {
          background-color: #fff7e6 !important;
        }

        .low-stock-row:hover {
          background-color: #ffe7ba !important;
        }

        /* ✅ สต็อกหมด (remaining === 0) = สีแดงอ่อน (error) */
        .out-of-stock-row {
          background-color: #fff2f0 !important;
        }

        .out-of-stock-row:hover {
          background-color: #ffe7e6 !important;
        }
      `}</style>
    </Space>
  );
};

export default InventoryManagement;