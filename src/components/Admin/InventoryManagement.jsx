import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Select, InputNumber, Row, Col, List, Tag, Typography, message } from 'antd';
import { PlusOutlined, MinusOutlined, WarningOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL"];

const InventoryManagement = () => {
  const [stockData, setStockData] = useState({});
  const [stockTransactions, setStockTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStockData();
  }, []);

  const loadStockData = async () => {
    setLoading(true);
    try {
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
    } catch (error) {
      message.error("ไม่สามารถโหลดข้อมูลสต็อกได้");
    } finally {
      setLoading(false);
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
              loading={loading}
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
};

export default InventoryManagement;
