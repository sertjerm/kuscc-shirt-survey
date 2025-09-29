// src/components/Admin/PickupModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Radio, Input, Space, Button, Row, Col, Card } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { SHIRT_SIZES } from '../../utils/constants';

const PickupModal = ({ visible, onCancel, onSubmit, selectedMember, form }) => {
  const [sizeChangeModalVisible, setSizeChangeModalVisible] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");

  // Initialize form values when modal opens
  useEffect(() => {
    if (visible && selectedMember) {
      form.setFieldsValue({
        selectedSize: selectedMember.SIZE_CODE || "",
        pickupType: "self",
        proxyMemberCode: "",
        proxyName: ""
      });
      setSelectedSize(selectedMember.SIZE_CODE || "");
    }
  }, [visible, selectedMember, form]);

  const handleSizeChange = (size) => {
    setSelectedSize(size);
    form.setFieldValue("selectedSize", size);
    setSizeChangeModalVisible(false);
  };

  const handleFormSubmit = (values) => {
    // ส่งข้อมูลกลับไปพร้อม memberCode
    onSubmit({
      ...values,
      memberCode: selectedMember?.MEMB_CODE
    });
  };

  return (
    <>
      {/* Main Pickup Modal */}
      <Modal
        title="บันทึกการรับเสื้อ"
        open={visible}
        onCancel={onCancel}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
        >
          {/* Member Info Section */}
          <div style={{
            background: '#f0f5ff',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            border: '1px solid #d6e4ff'
          }}>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ color: '#666', fontSize: '13px' }}>รหัสสมาชิก</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                  {selectedMember?.MEMB_CODE || '-'}
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ color: '#666', fontSize: '13px' }}>ชื่อ-นามสกุล</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                  {selectedMember?.FULLNAME || '-'}
                </div>
              </Col>
            </Row>
          </div>

          {/* Size Selection */}
          <Form.Item
            name="selectedSize"
            label={
              <Space>
                <span>ขนาดที่เลือก</span>
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => setSizeChangeModalVisible(true)}
                  style={{ padding: '0 4px' }}
                >
                  เปลี่ยนขนาด
                </Button>
              </Space>
            }
            rules={[{ required: true, message: 'กรุณาเลือกขนาดเสื้อ' }]}
          >
            <div style={{
              padding: '8px 16px',
              background: '#e6f7ff',
              border: '1px solid #91d5ff',
              borderRadius: '6px',
              display: 'inline-block',
              fontSize: '16px',
              fontWeight: '600',
              color: '#1890ff'
            }}>
              {selectedSize || 'ยังไม่เลือก'}
            </div>
          </Form.Item>

          {/* Pickup Type */}
          <Form.Item 
            name="pickupType" 
            label="ผู้รับเสื้อ"
            rules={[{ required: true, message: 'กรุณาเลือกผู้รับเสื้อ' }]}
          >
            <Radio.Group>
              <Radio value="self">รับด้วยตนเอง</Radio>
              <Radio value="proxy">รับแทน</Radio>
            </Radio.Group>
          </Form.Item>

          {/* Proxy Information (conditional) */}
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
                    rules={[
                      { required: true, message: 'กรุณากรอกรหัสสมาชิก' },
                      { len: 6, message: 'รหัสสมาชิกต้องเป็น 6 หลัก' }
                    ]}
                  >
                    <Input 
                      placeholder="กรอกรหัสสมาชิก 6 หลัก" 
                      maxLength={6}
                    />
                  </Form.Item>
                  <Form.Item
                    name="proxyName"
                    label="ชื่อ-สกุล ผู้รับแทน"
                    rules={[{ required: true, message: 'กรุณากรอกชื่อผู้รับแทน' }]}
                  >
                    <Input placeholder="กรอกชื่อ-นามสกุล ผู้รับแทน" />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>

          {/* Form Actions */}
          <Form.Item style={{ marginTop: 24, marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={onCancel}>
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
        width={900}
        destroyOnClose
      >
        <div style={{ 
          marginBottom: 20, 
          padding: '12px 16px',
          background: '#f0f5ff',
          borderRadius: '6px',
          border: '1px solid #adc6ff'
        }}>
          <span style={{ color: '#1d39c4', fontSize: '14px' }}>
            📏 <a 
              href="https://apps2.coop.ku.ac.th/asset/images/png/sizewidth.png" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#1890ff', textDecoration: 'underline' }}
            >
              วิธีวัดขนาดเสื้อ (คลิกเพื่อดู)
            </a>
          </span>
        </div>
        
        <Row gutter={[12, 12]}>
          {SHIRT_SIZES.map(size => (
            <Col xs={12} sm={8} md={6} lg={4} key={size.code}>
              <Card
                hoverable
                size="small"
                onClick={() => handleSizeChange(size.code)}
                style={{
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: selectedSize === size.code 
                    ? '2px solid #1890ff' 
                    : '1px solid #d9d9d9',
                  background: selectedSize === size.code 
                    ? '#e6f7ff' 
                    : 'white',
                  transition: 'all 0.3s'
                }}
                bodyStyle={{ padding: '12px 8px' }}
              >
                <div style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  marginBottom: 8,
                  color: selectedSize === size.code ? '#1890ff' : '#333'
                }}>
                  {size.code}
                </div>
                <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.5' }}>
                  อก {size.chest}"<br />
                  ยาว {size.length}"
                </div>
              </Card>
            </Col>
          ))}
        </Row>
        
        <div style={{ 
          marginTop: 20, 
          padding: 16, 
          background: '#fffbe6', 
          borderRadius: 6,
          border: '1px solid #ffe58f'
        }}>
          <div style={{ fontSize: '14px', color: '#ad6800', lineHeight: '1.6' }}>
            <strong>💡 คำแนะนำ:</strong> ควรเพิ่มขนาดจากที่วัดรอบอกได้ขึ้นอีกประมาณ 2" 
            เนื่องจากเสื้อแจ็คเก็ตมักสวมทับกับเสื้ออื่น
            <br />
            <span style={{ fontSize: '13px' }}>
              ตัวอย่าง: วัดได้ 40" → เลือกขนาดเสื้อ 42" (S)
            </span>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PickupModal;