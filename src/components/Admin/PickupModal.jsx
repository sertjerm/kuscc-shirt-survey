// src/components/Admin/PickupModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  Modal, Form, Select, Input, Button, Space, Typography, 
  Card, Tag, Alert, message, Row, Col 
} from 'antd';
import { 
  UserOutlined, EditOutlined, CheckCircleOutlined,
  SaveOutlined 
} from '@ant-design/icons';
import SignatureCanvas from 'react-signature-canvas';
import { submitPickup } from '../../services/shirtApi';
import { useAppContext } from '../../App';

const { Option } = Select;
const { TextArea } = Input;
const { Text, Title } = Typography;

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL"];

const PickupModal = ({ visible, onCancel, selectedMember, onSuccess }) => {
  const [form] = Form.useForm();
  const { user } = useAppContext();
  const signatureRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [receiverType, setReceiverType] = useState('SELF');
  const [selectedSize, setSelectedSize] = useState(null);
  const [hasSignature, setHasSignature] = useState(false);

  // Reset form when modal opens/closes or member changes
  useEffect(() => {
    if (visible && selectedMember) {
      form.setFieldsValue({
        sizeCode: selectedMember.sizeCode || '',
        receiverType: 'SELF',
        receiverName: '',
        remarks: '',
      });
      setSelectedSize(selectedMember.sizeCode);
      setReceiverType('SELF');
      setHasSignature(false);
      
      // Clear signature
      if (signatureRef.current) {
        signatureRef.current.clear();
      }
    }
  }, [visible, selectedMember, form]);

  // Handle signature drawing
  const handleSignatureEnd = () => {
    setHasSignature(!signatureRef.current.isEmpty());
  };

  // Clear signature
  const handleClearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setHasSignature(false);
    }
  };

  // Handle form submit
  const handleSubmit = async () => {
    try {
      // Validate form
      const values = await form.validateFields();
      
      // Validate signature
      if (!hasSignature) {
        message.warning('กรุณาเซ็นชื่อก่อนบันทึก');
        return;
      }

      // Validate size
      if (!values.sizeCode) {
        message.warning('กรุณาเลือกขนาดเสื้อ');
        return;
      }

      setLoading(true);

      // Get signature data
      const signatureData = signatureRef.current
        .getTrimmedCanvas()
        .toDataURL('image/png');

      // Prepare pickup data
      const pickupData = {
        memberCode: selectedMember.memberCode,
        sizeCode: values.sizeCode,
        processedBy: user.memberCode, // เจ้าหน้าที่ที่บันทึก
        receiverType: values.receiverType,
        receiverName: values.receiverType === 'OTHER' ? values.receiverName : null,
        signatureData,
        remarks: values.remarks || '',
      };

      console.log('📦 Submit Pickup Data:', pickupData);

      // Submit to API
      await submitPickup(pickupData);

      message.success('บันทึกการรับเสื้อเรียบร้อยแล้ว');
      
      // Reset and close
      form.resetFields();
      handleClearSignature();
      
      if (onSuccess) {
        onSuccess();
      }
      
      onCancel();
    } catch (error) {
      console.error('Submit pickup error:', error);
      message.error(error.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedMember) return null;

  return (
    <Modal
      title={
        <Space>
          <UserOutlined />
          <span>บันทึกการรับเสื้อ</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={700}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          ยกเลิก
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSubmit}
          loading={loading}
        >
          บันทึก
        </Button>,
      ]}
    >
      {/* Member Info Card */}
      <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f5f5f5' }}>
        <Row gutter={16}>
          <Col span={12}>
            <Text type="secondary">รหัสสมาชิก:</Text>
            <div><Text strong>{selectedMember.memberCode}</Text></div>
          </Col>
          <Col span={12}>
            <Text type="secondary">ชื่อ-สกุล:</Text>
            <div><Text strong>{selectedMember.fullName}</Text></div>
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 8 }}>
          <Col span={12}>
            <Text type="secondary">เบอร์โทร:</Text>
            <div><Text>{selectedMember.phone}</Text></div>
          </Col>
          <Col span={12}>
            <Text type="secondary">ขนาดที่จอง:</Text>
            <div>
              {selectedMember.sizeCode ? (
                <Tag color="blue">{selectedMember.sizeCode}</Tag>
              ) : (
                <Tag color="default">ยังไม่ได้เลือก</Tag>
              )}
            </div>
          </Col>
        </Row>
      </Card>

      {/* Alert if member hasn't confirmed size */}
      {!selectedMember.sizeCode && (
        <Alert
          message="สมาชิกยังไม่ได้ยืนยันขนาด"
          description="กรุณาเลือกขนาดเสื้อที่เหมาะสมให้กับสมาชิก"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          sizeCode: selectedMember.sizeCode || '',
          receiverType: 'SELF',
          receiverName: '',
          remarks: '',
        }}
      >
        {/* Size Selection */}
        <Form.Item
          label={
            <Space>
              <span>ขนาดเสื้อที่จ่าย</span>
              {selectedSize && selectedSize !== selectedMember.sizeCode && (
                <Tag color="orange">เปลี่ยนจาก {selectedMember.sizeCode}</Tag>
              )}
            </Space>
          }
          name="sizeCode"
          rules={[{ required: true, message: 'กรุณาเลือกขนาดเสื้อ' }]}
        >
          <Select
            size="large"
            placeholder="เลือกขนาดเสื้อ"
            onChange={setSelectedSize}
          >
            {ALL_SIZES.map(size => (
              <Option key={size} value={size}>
                <Tag color={size === selectedMember.sizeCode ? 'blue' : 'default'}>
                  {size}
                </Tag>
                {size === selectedMember.sizeCode && ' (ขนาดที่จอง)'}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Receiver Type */}
        <Form.Item
          label="ผู้รับเสื้อ"
          name="receiverType"
          rules={[{ required: true, message: 'กรุณาระบุผู้รับเสื้อ' }]}
        >
          <Select
            size="large"
            onChange={setReceiverType}
          >
            <Option value="SELF">
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <span>รับด้วยตนเอง</span>
              </Space>
            </Option>
            <Option value="OTHER">
              <Space>
                <UserOutlined style={{ color: '#fa8c16' }} />
                <span>รับแทน</span>
              </Space>
            </Option>
          </Select>
        </Form.Item>

        {/* Receiver Name (if OTHER) */}
        {receiverType === 'OTHER' && (
          <Form.Item
            label="ชื่อผู้รับแทน"
            name="receiverName"
            rules={[
              { required: true, message: 'กรุณากรอกชื่อผู้รับแทน' },
              { min: 2, message: 'กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร' }
            ]}
          >
            <Input
              size="large"
              placeholder="กรอกชื่อ-สกุล ผู้รับแทน"
              prefix={<UserOutlined />}
            />
          </Form.Item>
        )}

        {/* Signature */}
        <Form.Item
          label={
            <Space>
              <span>ลายเซ็นผู้รับ</span>
              {hasSignature && (
                <Tag color="success" icon={<CheckCircleOutlined />}>
                  เซ็นแล้ว
                </Tag>
              )}
            </Space>
          }
          required
        >
          <Card size="small">
            <div style={{ 
              border: '2px dashed #d9d9d9', 
              borderRadius: 4,
              backgroundColor: '#fafafa',
              marginBottom: 8
            }}>
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  width: 620,
                  height: 200,
                  className: 'signature-canvas',
                  style: { width: '100%', height: '200px' }
                }}
                onEnd={handleSignatureEnd}
                backgroundColor="#ffffff"
              />
            </div>
            <Space>
              <Button 
                size="small" 
                onClick={handleClearSignature}
                icon={<EditOutlined />}
              >
                ล้างลายเซ็น
              </Button>
              <Text type="secondary" style={{ fontSize: 12 }}>
                💡 เซ็นชื่อในกรอบด้วยนิ้วมือ หรือ เมาส์
              </Text>
            </Space>
          </Card>
        </Form.Item>

        {/* Remarks */}
        <Form.Item
          label="หมายเหตุ (ถ้ามี)"
          name="remarks"
        >
          <TextArea
            rows={3}
            placeholder="ระบุข้อมูลเพิ่มเติม เช่น สภาพเสื้อ, ข้อสังเกต"
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>

      {/* Footer Info */}
      <Alert
        message={
          <Space direction="vertical" size={0}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              📝 บันทึกโดย: {user.displayName || user.name} ({user.memberCode})
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ⏰ เวลา: {new Date().toLocaleString('th-TH')}
            </Text>
          </Space>
        }
        type="info"
        style={{ marginTop: 16 }}
      />
    </Modal>
  );
};

export default PickupModal;