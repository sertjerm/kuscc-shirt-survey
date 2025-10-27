import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Radio,
  Input,
  Button,
  Typography,
  Space,
  message,
  Spin,
} from "antd";
import {
  HomeOutlined,
  EnvironmentOutlined,
  EditOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useAppContext } from "../App";
import {
  saveDeliveryPreference,
  getDeliveryPreference,
  formatDeliveryData,
} from "../services/shirtApi";
import Swal from "sweetalert2";

const { Title, Text } = Typography;
const { TextArea } = Input;

const RetirementDelivery = () => {
  const [form] = Form.useForm();
  const [selectedOption, setSelectedOption] = useState("coop");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // ข้อมูลที่อยู่ในระบบ (ดึงจาก user context)
  const { user } = useAppContext();

  // 🔍 Debug log
  console.log("👤 User data from context:", user);
  console.log("🏠 ADDR field:", user?.ADDR);

  const systemAddress = user?.ADDR || "ไม่พบที่อยู่ในระบบ";

  // ⚡ โหลดข้อมูลความประสงค์เดิม (ถ้ามี)
  useEffect(() => {
    const loadExistingPreference = async () => {
      if (!user?.memberCode) {
        setInitialLoading(false);
        return;
      }

      try {
        console.log("🔄 Loading existing delivery preference...");
        const rawData = await getDeliveryPreference(user.memberCode);

        if (rawData) {
          const preference = formatDeliveryData(rawData);
          console.log("📋 Found existing preference:", preference);

          // ตั้งค่าในฟอร์ม
          setSelectedOption(preference.deliveryOption);
          form.setFieldsValue({
            deliveryOption: preference.deliveryOption,
            customAddress: preference.deliveryAddress,
            customPhone: preference.deliveryPhone,
          });

          message.success("โหลดข้อมูลความประสงค์เดิมแล้ว");
        } else {
          console.log("ℹ️ No existing preference found");
        }
      } catch (error) {
        console.error("❌ Error loading preference:", error);
        message.warning("ไม่สามารถโหลดข้อมูลความประสงค์เดิมได้");
      } finally {
        setInitialLoading(false);
      }
    };

    loadExistingPreference();
  }, [user?.memberCode, form]);

  const handleSubmit = async (values) => {
    if (!user?.memberCode) {
      message.error("ไม่พบข้อมูลสมาชิก กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    try {
      // 🎯 เตรียมข้อมูลสำหรับแสดง
      let addressToShow = "";
      let deliveryMethod = "";
      let addressToSave = null;
      let phoneToSave = null;

      if (values.deliveryOption === "coop") {
        deliveryMethod = "รับที่สหกรณ์";
        addressToShow = "สหกรณ์ออมทรัพย์มหาวิทยาลัยเกษตรศาสตร์ จำกัด";
        // ไม่ต้องบันทึกที่อยู่สำหรับตัวเลือกนี้
      } else if (values.deliveryOption === "system") {
        deliveryMethod = "จัดส่งตามที่อยู่ในระบบ";
        addressToShow = systemAddress;
        addressToSave = systemAddress;
        phoneToSave = user.phone;
      } else if (values.deliveryOption === "custom") {
        deliveryMethod = "จัดส่งตามที่อยู่ใหม่";
        addressToShow = `${values.customAddress}\nเบอร์โทร: ${values.customPhone}`;
        addressToSave = values.customAddress;
        phoneToSave = values.customPhone;
      }

      // 🚀 แสดง SweetAlert Confirmation
      const confirmResult = await Swal.fire({
        title: "ยืนยันการเลือกช่องทางการจัดส่ง",
        html: `
          <div style="text-align: left; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>วิธีการจัดส่ง:</strong></p>
            <p style="color: #1E88E5; font-weight: 500; margin-bottom: 15px;">${deliveryMethod}</p>
            
            <p style="margin: 10px 0;"><strong>ที่อยู่จัดส่ง:</strong></p>
            <div style="
              background: #f8f9fa; 
              padding: 12px; 
              border-radius: 8px; 
              border-left: 4px solid #1E88E5;
              white-space: pre-line;
              font-size: 14px;
              line-height: 1.5;
            ">${addressToShow}</div>
          </div>
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#1E88E5",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "✅ ยืนยัน",
        cancelButtonText: "❌ ยกเลิก",
        customClass: {
          popup: "swal-wide",
        },
        reverseButtons: true,
      });

      // ถ้าผู้ใช้ยกเลิก
      if (!confirmResult.isConfirmed) {
        return;
      }

      // ถ้าผู้ใช้ยืนยัน ให้บันทึกข้อมูลจริง
      setLoading(true);

      console.log("📦 Saving delivery preference...");

      // ✅ เรียก API บันทึกข้อมูลจริง
      const saveData = {
        memberCode: user.memberCode,
        deliveryOption: values.deliveryOption,
        deliveryAddress: addressToSave,
        deliveryPhone: phoneToSave,
      };

      console.log("💾 Save payload:", saveData);

      const saveResult = await saveDeliveryPreference(saveData);
      console.log("✅ Save result:", saveResult);

      // แสดงผลสำเร็จ
      await Swal.fire({
        title: "บันทึกเรียบร้อย!",
        text: "ตัวเลือกการจัดส่งของคุณได้รับการบันทึกแล้ว",
        icon: "success",
        confirmButtonColor: "#1E88E5",
        confirmButtonText: "เข้าใจแล้ว",
      });

      // TODO: Navigate หรือ callback
      // navigate('/member');
    } catch (error) {
      console.error("❌ Error saving delivery option:", error);

      await Swal.fire({
        title: "เกิดข้อผิดพลาด!",
        text: error.message || "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
        icon: "error",
        confirmButtonColor: "#dc3545",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setLoading(false);
    }
  };

  const deliveryOptions = [
    {
      value: "coop",
      icon: <HomeOutlined style={{ fontSize: 28 }} />,
      label: "รับที่สหกรณ์",
      description: "รับสินค้าด้วยตนเองที่สหกรณ์",
    },
    {
      value: "system",
      icon: <EnvironmentOutlined style={{ fontSize: 28 }} />,
      label: "จัดส่งตามที่อยู่ในระบบ",
      description: "ใช้ที่อยู่ที่ลงทะเบียนไว้",
      address: systemAddress,
    },
    {
      value: "custom",
      icon: <EditOutlined style={{ fontSize: 28 }} />,
      label: "ระบุที่อยู่ใหม่",
      description: "กรอกที่อยู่จัดส่งด้วยตนเอง",
    },
  ];

  // แสดง Loading Screen ขณะโหลดข้อมูลเดิม
  if (initialLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(180deg, #4A9FE8 0%, #5AB9EA 100%)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Card
          style={{
            padding: "40px",
            borderRadius: "24px",
            background: "rgba(255, 255, 255, 0.95)",
            textAlign: "center",
          }}
        >
          <Spin
            indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />}
            size="large"
          />
          <div style={{ marginTop: "16px", fontSize: "16px", color: "#666" }}>
            กำลังโหลดข้อมูล...
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #4A9FE8 0%, #5AB9EA 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: "600px",
          borderRadius: "24px",
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.1)",
        }}
        bodyStyle={{ padding: "40px" }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <Title
            level={2}
            style={{
              margin: "0 0 8px 0",
              color: "#1E88E5",
              fontWeight: "600",
            }}
          >
            เลือกช่องทางการจัดส่ง
          </Title>
          <Text style={{ color: "#666", fontSize: "15px" }}>
            กรุณาเลือกวิธีการรับสินค้าที่สะดวกที่สุดสำหรับคุณ
          </Text>
        </div>

        {/* Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ deliveryOption: "coop" }}
        >
          <Form.Item name="deliveryOption">
            <Radio.Group
              style={{ width: "100%" }}
              onChange={(e) => setSelectedOption(e.target.value)}
            >
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                {deliveryOptions.map((option) => (
                  <Card
                    key={option.value}
                    hoverable
                    style={{
                      borderRadius: "16px",
                      background: "rgba(255, 255, 255, 0.9)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                      border:
                        selectedOption === option.value
                          ? "2px solid #1E88E5"
                          : "1px solid rgba(255, 255, 255, 0.3)",
                      boxShadow:
                        selectedOption === option.value
                          ? "0 12px 32px rgba(30, 136, 229, 0.15)"
                          : "0 8px 24px rgba(0, 0, 0, 0.08)",
                      transition: "all 0.3s ease",
                    }}
                    bodyStyle={{ padding: "20px" }}
                  >
                    <Radio value={option.value} style={{ width: "100%" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "15px",
                        }}
                      >
                        <div
                          style={{
                            color:
                              selectedOption === option.value
                                ? "#1E88E5"
                                : "#757575",
                            filter:
                              selectedOption === option.value
                                ? "grayscale(0)"
                                : "grayscale(0.3)",
                          }}
                        >
                          {option.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontWeight:
                                selectedOption === option.value ? "500" : "400",
                              color:
                                selectedOption === option.value
                                  ? "#1E88E5"
                                  : "#333",
                              fontSize: "16px",
                            }}
                          >
                            {option.label}
                          </div>
                          <div
                            style={{
                              fontSize: "14px",
                              color: "#757575",
                              marginTop: "4px",
                            }}
                          >
                            {option.description}
                          </div>
                        </div>
                      </div>

                      {/* แสดงที่อยู่ในระบบทันที */}
                      {option.value === "system" && (
                        <div
                          style={{
                            marginTop: "12px",
                            padding: "12px 16px",
                            background: "rgba(227, 242, 253, 0.7)",
                            backdropFilter: "blur(10px)",
                            WebkitBackdropFilter: "blur(10px)",
                            borderRadius: "12px",
                            borderLeft: "4px solid #1E88E5",
                            fontSize: "14px",
                            color: "#424242",
                            lineHeight: "1.6",
                            whiteSpace: "pre-line",
                          }}
                        >
                          <strong style={{ color: "#1565C0" }}>
                            ที่อยู่จัดส่ง:
                          </strong>
                          <br />
                          {option.address}
                        </div>
                      )}
                    </Radio>
                  </Card>
                ))}
              </Space>
            </Radio.Group>
          </Form.Item>

          {/* แสดงช่องกรอกที่อยู่ใหม่ */}
          {selectedOption === "custom" && (
            <>
              <Form.Item
                name="customAddress"
                label="ที่อยู่จัดส่ง"
                rules={[
                  {
                    required: true,
                    message: "กรุณากรอกที่อยู่สำหรับจัดส่ง",
                  },
                  {
                    min: 20,
                    message:
                      "กรุณากรอกที่อยู่ให้ครบถ้วน (อย่างน้อย 20 ตัวอักษร)",
                  },
                ]}
                style={{ marginTop: "16px" }}
              >
                <TextArea
                  placeholder={`กรุณากรอกที่อยู่สำหรับจัดส่ง\n\nตัวอย่าง:\n99/99 ถนนพระราม 4 แขวงสีลม เขตบางรัก\nกรุงเทพมหานคร 10500`}
                  rows={5}
                  style={{
                    borderRadius: "12px",
                    border: "2px solid rgba(30, 136, 229, 0.2)",
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    fontSize: "15px",
                    transition: "all 0.3s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#1E88E5";
                    e.target.style.boxShadow =
                      "0 4px 12px rgba(30, 136, 229, 0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(30, 136, 229, 0.2)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </Form.Item>

              <Form.Item
                name="customPhone"
                label="เบอร์โทรติดต่อ"
                rules={[
                  {
                    required: true,
                    message: "กรุณากรอกเบอร์โทรติดต่อ",
                  },
                  {
                    pattern: /^0[0-9]{9}$/,
                    message: "กรุณากรอกเบอร์โทรให้ถูกต้อง (เช่น 0812345678)",
                  },
                ]}
              >
                <Input
                  placeholder="เช่น 0812345678"
                  maxLength={10}
                  style={{
                    borderRadius: "12px",
                    border: "2px solid rgba(30, 136, 229, 0.2)",
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    fontSize: "15px",
                    height: "44px",
                    transition: "all 0.3s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#1E88E5";
                    e.target.style.boxShadow =
                      "0 4px 12px rgba(30, 136, 229, 0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(30, 136, 229, 0.2)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </Form.Item>
            </>
          )}

          {/* Submit Button */}
          <Form.Item style={{ marginTop: "30px", marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              icon={<CheckCircleOutlined />}
              style={{
                height: "52px",
                fontSize: "17px",
                fontWeight: "600",
                borderRadius: "12px",
                background: "#1E88E5",
                boxShadow: "0 4px 12px rgba(30, 136, 229, 0.3)",
              }}
            >
              {loading ? "กำลังบันทึก..." : "ยืนยันตัวเลือก"}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default RetirementDelivery;
