// src/components/Admin/InventoryManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Button, Modal, Form, InputNumber, Select, 
  Input, Space, Typography, message, Tag, Alert, Spin 
} from 'antd';
import { 
  PlusOutlined, MinusOutlined, ReloadOutlined, 
  WarningOutlined, CheckCircleOutlined 
} from '@ant-design/icons';
import { getInventorySummary, adjustInventory } from '../../services/shirtApi';
import { useAppContext } from '../../App';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL"];

const InventoryManagement = () => {
  const { user } = useAppContext();
  const [form] = Form.useForm();
  
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState('ADD');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getInventorySummary();
      setInventory(data || []);
    } catch (err) {
      console.error('Error loading inventory:', err);
      setError(err.message || 'ไม่สามารถโหลดข้อมูลสต็อกได้');
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
        type: adjustmentType, // 'ADD' or 'REMOVE'
        remarks: values.remarks || '',
        processedBy: user.memberCode,
      };

      console.log('📊 Adjust Inventory:', adjustmentData);

      await adjustInventory(adjustmentData);

      message.success(
        adjustmentType === 'ADD' 
          ? `เติมสต็อกขนาด ${values.sizeCode} จำนวน ${values.quantity} ตัว สำเร็จ`
          : `เบิกสต็อกขนาด ${values.sizeCode} จำนวน ${values.quantity} ตัว สำเร็จ`
      );

      handleCloseModal();
      loadInventory(); // Reload inventory data
    } catch (error) {
      console.error('Submit adjustment error:', error);
      if (error.errorFields) {
        // Form validation error
        return;
      }
      message.error(error.message || 'เกิดข้อผิดพลาดในการปรับสต็อก');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate totals
  const totals = inventory.reduce((acc, item) => ({
    produced: acc.produced + (item.produced || 0),
    reserved: acc.reserved + (item.reserved || 0),
    received: acc.received + (item.received || 0),
    remaining: acc.remaining + (item.remaining || 0),
  }), { produced: 0, reserved: 0, received: 0, remaining: 0 });

  // Check low stock count (ใช้ lowStockThreshold จาก API แทน hardcode)
  const lowStockCount = inventory.filter(item => 
    item.remaining > 0 && item.remaining <= (item.lowStockThreshold || 50)
  ).length;

  const columns = [
    {
      title: 'ขนาด',
      dataIndex: 'sizeCode',
      key: 'sizeCode',
      width: 100,
      align: 'center',
      render: (size) => (
        <Tag color="blue" style={{ fontSize: 14, fontWeight: 'bold' }}>
          {size}
        </Tag>
      ),
    },
    {
      title: 'ผลิต',
      dataIndex: 'produced',
      key: 'produced',
      width: 100,
      align: 'right',
      render: (value) => (
        <Text strong style={{ color: '#1890ff' }}>
          {value?.toLocaleString() || 0}
        </Text>
      ),
    },
    {
      title: 'จอง',
      dataIndex: 'reserved',
      key: 'reserved',
      width: 100,
      align: 'right',
      render: (value) => (
        <Text style={{ color: '#52c41a' }}>
          {value?.toLocaleString() || 0}
        </Text>
      ),
    },
    {
      title: 'รับแล้ว',
      dataIndex: 'received',
      key: 'received',
      width: 100,
      align: 'right',
      render: (value) => (
        <Text style={{ color: '#faad14' }}>
          {value?.toLocaleString() || 0}
        </Text>
      ),
    },
    {
      title: 'คงเหลือ',
      dataIndex: 'remaining',
      key: 'remaining',
      width: 100,
      align: 'right',
      render: (value, record) => {
        const threshold = record.lowStockThreshold || 50;
        const isLowStock = value > 0 && value <= threshold;
        return (
          <Space>
            {isLowStock && <WarningOutlined style={{ color: '#ff4d4f' }} />}
            <Text 
              strong 
              style={{ 
                color: isLowStock ? '#ff4d4f' : value === 0 ? '#999' : '#000',
                fontSize: 16
              }}
            >
              {value?.toLocaleString() || 0}
            </Text>
          </Space>
        );
      },
    },
    {
      title: 'สถานะ',
      key: 'status',
      width: 120,
      align: 'center',
      render: (_, record) => {
        const threshold = record.lowStockThreshold || 50;
        if (record.remaining === 0) {
          return <Tag color="default">หมดสต็อก</Tag>;
        }
        if (record.remaining <= threshold) {
          return <Tag color="error" icon={<WarningOutlined />}>ใกล้หมด</Tag>;
        }
        return <Tag color="success" icon={<CheckCircleOutlined />}>ปกติ</Tag>;
      },
    },
  ];

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
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
        action={
          <Button onClick={loadInventory}>ลองอีกครั้ง</Button>
        }
      />
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <Alert
          message="⚠️ แจ้งเตือนสต็อกใกล้หมด"
          description={`พบสต็อกเสื้อใกล้หมด ${lowStockCount} ขนาด (เหลือน้อยกว่าหรือเท่ากับ threshold ของแต่ละขนาด)`}
          type="warning"
          showIcon
        />
      )}

      {/* Main Inventory Card */}
      <Card
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>
              สรุปสต็อกเสื้อแจ็คเก็ต
            </Title>
          </Space>
        }
        extra={
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal('ADD')}
            >
              เติมสต็อก
            </Button>
            <Button 
              icon={<MinusOutlined />}
              onClick={() => handleOpenModal('REMOVE')}
            >
              เบิกสต็อก
            </Button>
            <Button 
              icon={<ReloadOutlined />}
              onClick={loadInventory}
            >
              รีเฟรช
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={inventory}
          columns={columns}
          rowKey="sizeCode"
          pagination={false}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ backgroundColor: '#fafafa' }}>
                <Table.Summary.Cell index={0} align="center">
                  <Text strong>รวม</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
                    {totals.produced.toLocaleString()}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <Text strong style={{ color: '#52c41a', fontSize: 16 }}>
                    {totals.reserved.toLocaleString()}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <Text strong style={{ color: '#faad14', fontSize: 16 }}>
                    {totals.received.toLocaleString()}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  <Text strong style={{ fontSize: 16 }}>
                    {totals.remaining.toLocaleString()}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} />
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />

        {/* Legend */}
        <div style={{ marginTop: 16, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
          <Space direction="vertical" size="small">
            <Text strong>คำอธิบาย:</Text>
            <Space split="|">
              <Text>📦 <Text strong style={{ color: '#1890ff' }}>ผลิต:</Text> จำนวนที่ผลิต/สั่งซื้อ</Text>
              <Text>📝 <Text strong style={{ color: '#52c41a' }}>จอง:</Text> จำนวนที่สมาชิกยืนยันขนาด</Text>
              <Text>✅ <Text strong style={{ color: '#faad14' }}>รับแล้ว:</Text> จำนวนที่จ่ายไปแล้ว</Text>
              <Text>📊 <Text strong>คงเหลือ:</Text> จำนวนคงเหลือในคลัง</Text>
            </Space>
            <Alert
              message={
                <Text style={{ fontSize: 12 }}>
                  ⚠️ สต็อกที่เหลือ <Text strong>≤ threshold</Text> ของแต่ละขนาดจะถูกไฮไลท์เป็น<Text strong style={{ color: '#ff4d4f' }}> สีแดง</Text>
                </Text>
              }
              type="info"
              showIcon
            />
          </Space>
        </div>
      </Card>

      {/* Adjustment Modal */}
      <Modal
        title={
          <Space>
            {adjustmentType === 'ADD' ? <PlusOutlined /> : <MinusOutlined />}
            <span>{adjustmentType === 'ADD' ? 'เติมสต็อก' : 'เบิกสต็อก'}</span>
          </Space>
        }
        open={modalVisible}
        onCancel={handleCloseModal}
        onOk={handleSubmitAdjustment}
        confirmLoading={submitting}
        okText="บันทึก"
        cancelText="ยกเลิก"
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 24 }}
        >
          <Form.Item
            label="ขนาดเสื้อ"
            name="sizeCode"
            rules={[{ required: true, message: 'กรุณาเลือกขนาดเสื้อ' }]}
          >
            <Select size="large" placeholder="เลือกขนาดเสื้อ">
              {ALL_SIZES.map(size => (
                <Option key={size} value={size}>
                  <Tag color="blue">{size}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="จำนวน (ตัว)"
            name="quantity"
            rules={[
              { required: true, message: 'กรุณากรอกจำนวน' },
              { type: 'number', min: 1, message: 'จำนวนต้องมากกว่า 0' }
            ]}
          >
            <InputNumber
              size="large"
              style={{ width: '100%' }}
              placeholder="กรอกจำนวน"
              min={1}
              max={10000}
            />
          </Form.Item>

          <Form.Item
            label="หมายเหตุ"
            name="remarks"
          >
            <TextArea
              rows={3}
              placeholder="ระบุรายละเอียดเพิ่มเติม เช่น เลขที่ใบสั่งซื้อ, ผู้จัดส่ง"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Alert
            message={
              <Space direction="vertical" size={0}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  📝 ประเภท: {adjustmentType === 'ADD' ? 'เติมสต็อก (+)' : 'เบิกสต็อก (-)'}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  👤 ผู้บันทึก: {user.displayName || user.name} ({user.memberCode})
                </Text>
              </Space>
            }
            type="info"
          />
        </Form>
      </Modal>
    </Space>
  );
};

export default InventoryManagement;