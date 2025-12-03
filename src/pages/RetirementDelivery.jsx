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

  const handleSubmit = async () => {
    if (!user?.memberCode) {
      message.error("ไม่พบข้อมูลสมาชิก กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    try {
      // ✅ Validate ก่อน
      await form.validateFields();
      const values = form.getFieldsValue();

      // 🔍 Debug log
      console.log("📋 Form values before processing:", values);
      console.log("📋 Selected option:", selectedOption);

      let addressToShow = "";
      let deliveryMethod = "";
      let addressToSave = null;
      let phoneToSave = null;

      // ⚠️ ใช้ selectedOption แทน values.deliveryOption เพราะมันอัพเดตทันที
      if (selectedOption === "coop") {
        deliveryMethod = "รับที่สหกรณ์";
        addressToShow = "สหกรณ์ออมทรัพย์มหาวิทยาลัยเกษตรศาสตร์ จำกัด";
      } else if (selectedOption === "system") {
        deliveryMethod = "จัดส่งตามที่อยู่ในระบบ";
        addressToShow = systemAddress || "ไม่พบที่อยู่ในระบบ";
        addressToSave = systemAddress;
        phoneToSave = user.phone;
      } else if (selectedOption === "custom") {
        deliveryMethod = "จัดส่งตามที่อยู่ใหม่";

        // ✅ เพิ่ม fallback ป้องกัน undefined
        const customAddr = values.customAddress || "(ไม่ระบุ)";
        const customPhone = values.customPhone || "(ไม่ระบุ)";

        addressToShow = `${customAddr}\nเบอร์โทร: ${customPhone}`;
        addressToSave = values.customAddress;
        phoneToSave = values.customPhone;

        console.log("📍 Custom address:", customAddr);
        console.log("📞 Custom phone:", customPhone);
      }

      // � Debug ก่อนแสดง dialog
      console.log("📦 Delivery method:", deliveryMethod);
      console.log("📍 Address to show:", addressToShow);

      const confirmResult = await Swal.fire({
        title: "ยืนยันการเลือกช่องทางการรับเสื้อแจ็คเก็ต",
        html: `
          <div style="text-align: left; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>วิธีการจัดส่ง:</strong></p>
            <p style="color: #1E88E5; font-weight: 500; margin-bottom: 15px;">
              ${deliveryMethod || "(ไม่ระบุ)"}
            </p>
            
            <p style="margin: 10px 0;"><strong>ที่อยู่จัดส่ง:</strong></p>
            <div style="
              background: #f8f9fa; 
              padding: 12px; 
              border-radius: 8px; 
              border-left: 4px solid #1E88E5;
              white-space: pre-line;
              font-size: 14px;
              line-height: 1.5;
            ">${addressToShow || "(ไม่ระบุ)"}</div>
          </div>
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#1E88E5",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "✅ ยืนยัน",
        cancelButtonText: "❌ ยกเลิก",
        reverseButtons: true,
      });

      if (!confirmResult.isConfirmed) {
        return;
      }

      setLoading(true);

      const saveData = {
        memberCode: user.memberCode,
        deliveryOption: selectedOption, // ใช้ selectedOption แทน values.deliveryOption
        deliveryAddress: addressToSave,
        deliveryPhone: phoneToSave,
      };

      console.log("💾 Save payload:", saveData);

      const saveResult = await saveDeliveryPreference(saveData);
      console.log("✅ Save result:", saveResult);

      await Swal.fire({
        title: "บันทึกเรียบร้อย!",
        text: "ตัวเลือกการจัดส่งของคุณได้รับการบันทึกแล้ว",
        icon: "success",
        confirmButtonColor: "#1E88E5",
        confirmButtonText: "เข้าใจแล้ว",
      });
    } catch (error) {
      console.error("❌ Error:", error);

      // Handle validation error
      if (error.errorFields) {
        const firstError = error.errorFields[0];
        console.log("🔴 Validation error:", firstError);
        message.error(firstError.errors[0] || "กรุณากรอกข้อมูลให้ครบถ้วน");
        return;
      }

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
      // icon: <HomeOutlined style={{ fontSize: 28 }} />,
      label: "รับที่สำนักงานสหกรณ์บางเขน",
      description: "รับสินค้าด้วยตนเองหรือมอบผู้รับแทน",
    },
    {
      value: "system",
      // icon: <EnvironmentOutlined style={{ fontSize: 28 }} />,
      label: "จัดส่งพัสดุ",
      description: "โปรดระบุที่อยู่",
      address: systemAddress,
    },
    {
      value: "custom",
      // icon: <EditOutlined style={{ fontSize: 28 }} />,
      label: "ระบุที่อยู่ใหม่ (โปรดระบุให้ชัดเจน)",
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
      className="retirement-delivery-page"
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
            level={3}
            style={{
              margin: "0 0 8px 0",
              color: "#1ABC9C",
              fontWeight: "600",
            }}
          >
            โปรดเลือกช่องทางการรับเสื้อแจ็คเก็ต
          </Title>
          <Text style={{ color: "#666", fontSize: "15px" }}>
            เฉพาะผู้เกษียณ/ผู้ที่คงสภาพสมาชิก
          </Text>
        </div>

        {/* Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ deliveryOption: "coop" }}
        >
          {/* แก้ไขส่วน Radio Group */}
          <Form.Item name="deliveryOption">
            <Card
              style={{
                borderRadius: "16px",
                background: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
              }}
              bodyStyle={{ padding: "24px" }}
            >
              <Radio.Group
                style={{ width: "100%" }}
                value={selectedOption} // เพิ่ม value prop
                onChange={(e) => {
                  const value = e.target.value;
                  console.log("🔄 Radio changed to:", value); // เพิ่ม log
                  setSelectedOption(value);
                  form.setFieldsValue({ deliveryOption: value });
                }}
              >
                <Space direction="vertical" size={0} style={{ width: "100%" }}>
                  {deliveryOptions.map((option, index) => (
                    <div key={option.value}>
                      <div
                        style={{
                          padding: "20px 16px",
                          borderRadius: "12px",
                          background:
                            selectedOption === option.value
                              ? "rgba(26, 188, 156, 0.05)"
                              : "transparent",
                          border:
                            selectedOption === option.value
                              ? "2px solid #1ABC9C"
                              : "2px solid transparent",
                          transition: "all 0.3s ease",
                          cursor: "pointer",
                        }}
                        // ลบ onClick ออกเพื่อไม่ให้ทับซ้อนกับ Radio
                      >
                        <Radio
                          value={option.value}
                          style={{
                            width: "100%",
                            display: "flex", // เปลี่ยนเป็น flex
                            alignItems: "flex-start",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "12px",
                              marginLeft: "8px",
                              width: "100%", // เพิ่ม width 100%
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  fontWeight:
                                    selectedOption === option.value
                                      ? "600"
                                      : "500",
                                  color:
                                    selectedOption === option.value
                                      ? "#1ABC9C"
                                      : "#333",
                                  fontSize: "16px",
                                  marginBottom: "4px",
                                  lineHeight: "1.4",
                                }}
                              >
                                {option.label}
                              </div>
                              <div
                                style={{
                                  fontSize: "14px",
                                  color: "#757575",
                                  lineHeight: "1.4",
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
                                marginLeft: "32px",
                                padding: "12px 16px",
                                background: "rgba(224, 242, 241, 0.7)",
                                backdropFilter: "blur(10px)",
                                WebkitBackdropFilter: "blur(10px)",
                                borderRadius: "8px",
                                borderLeft: "3px solid #1ABC9C",
                                fontSize: "14px",
                                color: "#424242",
                                lineHeight: "1.5",
                                width: "calc(100% - 32px)", // ปรับ width
                              }}
                            >
                              <strong style={{ color: "#1ABC9C" }}>
                                ที่อยู่ในระบบ:
                              </strong>
                              <br />
                              <span style={{ whiteSpace: "pre-line" }}>
                                {option.address}
                              </span>
                            </div>
                          )}
                        </Radio>
                      </div>

                      {/* เส้นคั่นระหว่าง options */}
                      {index < deliveryOptions.length - 1 && (
                        <div
                          style={{
                            height: "1px",
                            background:
                              "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.1) 50%, transparent 100%)",
                            margin: "16px 0",
                          }}
                        />
                      )}
                    </div>
                  ))}
                </Space>
              </Radio.Group>

              {/* ส่วนแสดงช่องกรอกที่อยู่ใหม่ */}
              {selectedOption === "custom" && (
                <div
                  style={{
                    marginTop: "20px",
                    paddingTop: "20px",
                    borderTop: "1px solid rgba(0,0,0,0.1)",
                  }}
                >
                  <Form.Item
                    name="customAddress"
                    label={
                      <span style={{ fontWeight: "600", color: "#333" }}>
                        ที่อยู่จัดส่ง
                      </span>
                    }
                    rules={[
                      {
                        required: selectedOption === "custom", // validate เฉพาะตอนเลือก custom
                        message: "กรุณากรอกที่อยู่สำหรับจัดส่ง",
                      },
                      {
                        min: 20,
                        message:
                          "กรุณากรอกที่อยู่ให้ครบถ้วน (อย่างน้อย 20 ตัวอักษร)",
                      },
                    ]}
                    style={{ marginBottom: "16px" }}
                  >
                    <TextArea
                      placeholder={`กรุณากรอกที่อยู่สำหรับจัดส่ง\n\nตัวอย่าง:\n99/99 ถนนพระราม 4 แขวงสีลม เขตบางรัก\nกรุงเทพมหานคร 10500`}
                      rows={5}
                      style={{
                        borderRadius: "8px",
                        border: "2px solid rgba(30, 136, 229, 0.2) !important",
                        background: "rgba(255, 255, 255, 0.8)",
                        fontSize: "14px",
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="customPhone"
                    label={
                      <span style={{ fontWeight: "600", color: "#333" }}>
                        เบอร์โทรติดต่อ
                      </span>
                    }
                    rules={[
                      {
                        required: selectedOption === "custom", // validate เฉพาะตอนเลือก custom
                        message: "กรุณากรอกเบอร์โทรติดต่อ",
                      },
                      {
                        pattern: /^0[0-9]{9}$/,
                        message:
                          "กรุณากรอกเบอร์โทรให้ถูกต้อง (เช่น 0812345678)",
                      },
                    ]}
                    style={{ marginBottom: 0 }}
                  >
                    <Input
                      placeholder="เช่น 0812345678"
                      maxLength={10}
                      style={{
                        borderRadius: "8px",
                        border: "2px solid rgba(30, 136, 229, 0.8) !important",
                        background: "rgba(255, 255, 255, 0.8)",
                        fontSize: "14px",
                        height: "40px",
                      }}
                    />
                  </Form.Item>
                </div>
              )}
            </Card>
          </Form.Item>

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
              {loading ? "กำลังบันทึก..." : "ยืนยัน"}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default RetirementDelivery;
