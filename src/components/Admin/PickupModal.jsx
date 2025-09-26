import React, { useState } from 'react';
import { Modal, Form, Descriptions, Tag, Space, Button, Radio, Input, Row, Col, Card } from 'antd';
import { EditOutlined } from '@ant-design/icons';

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

const PickupModal = ({ visible, onCancel, onSubmit, selectedMember, form }) => {
  const [sizeChangeModalVisible, setSizeChangeModalVisible] = useState(false);
  const [newSelectedSize, setNewSelectedSize] = useState("");

  const handleSizeChange = (size) => {
    setNewSelectedSize(size);
    form.setFieldValue("selectedSize", size);
    setSizeChangeModalVisible(false);
  };

  return (
    <>
      <Modal
        title="บันทึกการรับเสื้อ"
        open={visible}
        onCancel={onCancel}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onSubmit}
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
              {form.getFieldValue("selectedSize") || selectedMember?.selectedSize || "ยังไม่เลือก"}
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
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <span style={{ color: '#666' }}>
            📏 <a href="https://apps2.coop.ku.ac.th/asset/images/png/sizewidth.png" target="_blank" rel="noopener noreferrer">
              วิธีวัดขนาดเสื้อ
            </a>
          </span>
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
          <span style={{ fontSize: '14px', color: '#856404' }}>
            <strong>คำแนะนำ:</strong> ควรเพิ่มขนาดจากที่วัดรอบอกได้ขึ้นอีกประมาณ 2" เนื่องจากเสื้อแจ็คเก็ตมักสวมทับกับเสื้ออื่น
            เช่น วัดได้ 40" ให้เลือกขนาดเสื้อ 42" แทน
          </span>
        </div>
      </Modal>
    </>
  );
};

export default PickupModal;
