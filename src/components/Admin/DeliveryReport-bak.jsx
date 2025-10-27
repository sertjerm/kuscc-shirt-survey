// ===================================================================
// File: src/components/Admin/DeliveryReport.jsx
// Description: รายละเอียดการจัดส่งเสื้อสำหรับสมาชิก
// ===================================================================

import React, { useState, useEffect, useMemo } from "react";
import {
  Input,
  Select,
  Button,
  Table,
  Tag,
  Space,
  Tooltip,
  Card,
  Row,
  Col,
  Statistic,
  App, // ✅ ต้องมี
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  PhoneOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import { getDeliveryReportList } from "../../services/shirtApi"; // ✅ ต้องมี
import * as XLSX from "xlsx"; // ✅ ต้องมี

const { Option } = Select;

const DeliveryReport = () => {
  const { message } = App.useApp(); // ✅ ต้องอยู่ใน App wrapper

  // State
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);

  // ✅ เช็คว่า states ทั้งหมดถูกประกาศหรือไม่

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getDeliveryReportList();
      setDataSource(data || []); // ✅ fallback to empty array
      message.success(`โหลดข้อมูลสำเร็จ (${(data || []).length} รายการ)`);
    } catch (error) {
      console.error("Error loading delivery report:", error);
      message.error("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
  };

  const filteredData = useMemo(() => {
    return deliveryData.filter((item) => {
      const matchesSearchText = item.memberName
        .toLowerCase()
        .includes(searchText.toLowerCase());
      const matchesStatusFilter =
        statusFilter === "" || item.status === statusFilter;
      return matchesSearchText && matchesStatusFilter;
    });
  }, [deliveryData, searchText, statusFilter]);

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(deliveryData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DeliveryReport");
    XLSX.writeFile(wb, "delivery_report.xlsx");
  };

  const formatDateTime = (dateTimeString) => {
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };
    return new Date(dateTimeString).toLocaleString("th-TH", options);
  };

  return (
    <div style={{ padding: "24px", backgroundColor: "#fff" }}>
      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
            รายละเอียดการจัดส่ง
          </h2>
          <p style={{ margin: "4px 0 0", color: "#666", fontSize: "14px" }}>
            ข้อมูลความประสงค์การรับเสื้อของสมาชิก
          </p>
        </div>
        <div>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExportExcel}
          >
            ส่งออกเป็น Excel
          </Button>
        </div>
      </div>
      <Row gutter={24}>
        <Col span={8}>
          <Input
            placeholder="ค้นหาชื่อสมาชิก"
            prefix={<SearchOutlined />}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </Col>
        <Col span={8}>
          <Select
            placeholder="เลือกสถานะ"
            onChange={handleStatusFilterChange}
            allowClear
            style={{ width: "100%" }}
          >
            <Option value="delivered">จัดส่งแล้ว</Option>
            <Option value="pending">รอดำเนินการ</Option>
            <Option value="canceled">ยกเลิก</Option>
          </Select
            onClick={fetchDeliveryReport}
            loading={loading}
          >
            รีเฟรช
          </Button>
        </Col>
      </Row>
      <Table
        dataSource={filteredData}
        loading={loading}
        rowKey="id"
        style={{ marginTop: "16px" }}
      >
        <Column title="ลำดับ" dataIndex="key" />
        <Column title="ชื่อสมาชิก" dataIndex="memberName" />
        <Column title="สถานะ" dataIndex="status" />
        <Column title="วันที่จัดส่ง" dataIndex="deliveryDate" />
        <Column title="หมายเลขติดตาม" dataIndex="trackingNumber" />
        <Column
          title="รายละเอียดเพิ่มเติม"
          dataIndex="id"
          render={(text, record) => (
            <Space size="middle">
              <Tooltip title="ดูรายละเอียด">
                <Button type="link" onClick={() => handleViewDetails(record)}>
                  ดูรายละเอียด
                </Button>
              </Tooltip>
            </Space>
          )}
        />
      </Table>
    </div>
  );
};

export default DeliveryReport;
