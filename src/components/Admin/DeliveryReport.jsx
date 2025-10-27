// ===================================================================
// File: src/components/Admin/RetirementDeliveryReport.jsx
// Description: รายละเอียดการจัดส่งเสื้อสำหรับสมาชิกเกษียณอายุ
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
  App, // ✅ เพิ่ม App import
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
import { getDeliveryReportList } from "../../services/shirtApi";
import * as XLSX from "xlsx";
import { formatDateTime } from "../../utils/js_functions"; // ✅ เพิ่ม import นี้

const { Option } = Select;

const DeliveryReport = () => {
  const { message } = App.useApp(); // ✅ ใช้ App.useApp() แทน message จาก antd

  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    coop: 0,
    system: 0,
    custom: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getDeliveryReportList();
      setDataSource(data);
      calculateStats(data);
      message.success(`โหลดข้อมูลสำเร็จ (${data.length} รายการ)`); // ✅ ใช้ message จาก useApp
    } catch (error) {
      console.error("Error loading delivery report:", error);
      message.error("ไม่สามารถโหลดข้อมูลได้"); // ✅ ใช้ message จาก useApp
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const stats = {
      total: data.length,
      coop: data.filter((item) => item.DELIVERY_OPTION === "coop").length,
      system: data.filter((item) => item.DELIVERY_OPTION === "system").length,
      custom: data.filter((item) => item.DELIVERY_OPTION === "custom").length,
    };
    setStats(stats);
  };

  const filteredData = useMemo(() => {
    let filtered = [...dataSource];
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.MEMB_CODE?.toLowerCase().includes(searchLower) ||
          item.FULLNAME?.toLowerCase().includes(searchLower) ||
          item.DELIVERY_ADDRESS?.toLowerCase().includes(searchLower) ||
          item.DELIVERY_PHONE?.toLowerCase().includes(searchLower)
      );
    }
    if (deliveryFilter) {
      filtered = filtered.filter(
        (item) => item.DELIVERY_OPTION === deliveryFilter
      );
    }
    return filtered;
  }, [dataSource, searchText, deliveryFilter]);

  const handleClearFilters = () => {
    setSearchText("");
    setDeliveryFilter("");
  };

  const handleExportExcel = () => {
    try {
      const exportData = filteredData.map((item) => ({
        เลขสมาชิก: item.MEMB_CODE,
        ชื่อ: item.FULLNAME,
        ความประสงค์: getDeliveryLabel(item.DELIVERY_OPTION),
        ที่อยู่จัดส่ง: item.DELIVERY_ADDRESS || "-",
        เบอร์โทร: item.DELIVERY_PHONE || "-",
        วันที่บันทึก: item.CREATED_DATE
          ? formatDateTime(item.CREATED_DATE)
          : "-",
        แก้ไขล่าสุด: item.UPDATED_DATE
          ? formatDateTime(item.UPDATED_DATE)
          : "-",
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "รายละเอียดการจัดส่ง");

      ws["!cols"] = [
        { wch: 12 },
        { wch: 30 },
        { wch: 25 },
        { wch: 50 },
        { wch: 12 },
        { wch: 20 },
        { wch: 20 },
      ];

      XLSX.writeFile(wb, `รายละเอียดการจัดส่ง_${Date.now()}.xlsx`);
      message.success("ดาวน์โหลด Excel สำเร็จ");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      message.error("ไม่สามารถดาวน์โหลด Excel ได้");
    }
  };

  const getDeliveryLabel = (option) => {
    switch (option) {
      case "coop":
        return "รับที่สหกรณ์";
      case "system":
        return "จัดส่งตามที่อยู่ในระบบ";
      case "custom":
        return "จัดส่งตามที่อยู่ใหม่";
      default:
        return "-";
    }
  };

  const getDeliveryTag = (option) => {
    switch (option) {
      case "coop":
        return <Tag color="blue">รับที่สหกรณ์</Tag>;
      case "system":
        return <Tag color="green">ที่อยู่ในระบบ</Tag>;
      case "custom":
        return <Tag color="orange">ที่อยู่ใหม่</Tag>;
      default:
        return <Tag>-</Tag>;
    }
  };

  const columns = [
    {
      title: "เลขสมาชิก",
      dataIndex: "MEMB_CODE",
      key: "membCode",
      width: 120,
      fixed: "left",
      sorter: (a, b) => a.MEMB_CODE.localeCompare(b.MEMB_CODE),
      responsive: ["xs", "sm", "md", "lg", "xl"],
    },
    {
      title: "ชื่อ-นามสกุล",
      dataIndex: "FULLNAME",
      key: "fullname",
      width: 250,
      ellipsis: true,
      responsive: ["sm", "md", "lg", "xl"],
    },
    {
      title: "ความประสงค์",
      dataIndex: "DELIVERY_OPTION",
      key: "deliveryOption",
      width: 180,
      render: (option) => getDeliveryTag(option),
      filters: [
        { text: "รับที่สหกรณ์", value: "coop" },
        { text: "ที่อยู่ในระบบ", value: "system" },
        { text: "ที่อยู่ใหม่", value: "custom" },
      ],
      onFilter: (value, record) => record.DELIVERY_OPTION === value,
      responsive: ["xs", "sm", "md", "lg", "xl"],
    },
    {
      title: "ที่อยู่จัดส่ง",
      dataIndex: "DELIVERY_ADDRESS",
      key: "deliveryAddress",
      width: 300,
      ellipsis: { showTitle: false },
      render: (address) =>
        address ? (
          <Tooltip placement="topLeft" title={address}>
            <span>
              <EnvironmentOutlined /> {address}
            </span>
          </Tooltip>
        ) : (
          <span style={{ color: "#999" }}>-</span>
        ),
      responsive: ["md", "lg", "xl"],
    },
    {
      title: "เบอร์โทร",
      dataIndex: "DELIVERY_PHONE",
      key: "deliveryPhone",
      width: 130,
      render: (phone) =>
        phone ? (
          <span>
            <PhoneOutlined /> {phone}
          </span>
        ) : (
          <span style={{ color: "#999" }}>-</span>
        ),
      responsive: ["lg", "xl"],
    },
    {
      title: "วันที่",
      key: "datetime",
      width: 180,
      render: (_, record) => {
        const date = record.UPDATED_DATE || record.CREATED_DATE;
        return date ? formatDateTime(date) : "-";
      },
      sorter: (a, b) => {
        const dateA = a.UPDATED_DATE || a.CREATED_DATE;
        const dateB = b.UPDATED_DATE || b.CREATED_DATE;
        return new Date(dateA) - new Date(dateB);
      },
      responsive: ["sm", "md", "lg", "xl"],
    },
  ];

  return (
    <div style={{ padding: "24px", backgroundColor: "#fff" }}>
      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
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
        <Space wrap>
          <Button
            type="default"
            icon={<ReloadOutlined />}
            onClick={loadData}
            loading={loading}
          >
            รีเฟรช
          </Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExportExcel}
            disabled={filteredData.length === 0}
          >
            ดาวน์โหลด Excel
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="ทั้งหมด"
              value={stats.total}
              valueStyle={{ color: "#1890ff" }}
              prefix={<HomeOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="รับที่สหกรณ์"
              value={stats.coop}
              valueStyle={{ color: "#1890ff" }}
              suffix={`/ ${stats.total}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="ที่อยู่ในระบบ"
              value={stats.system}
              valueStyle={{ color: "#52c41a" }}
              suffix={`/ ${stats.total}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="ที่อยู่ใหม่"
              value={stats.custom}
              valueStyle={{ color: "#fa8c16" }}
              suffix={`/ ${stats.total}`}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "center",
            }}
          >
            <Input
              placeholder="ค้นหาด้วยเลขสมาชิก, ชื่อ, ที่อยู่, เบอร์โทร..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ minWidth: 250, flex: "1 1 auto" }}
              allowClear
            />
            <Select
              placeholder="ความประสงค์"
              value={deliveryFilter}
              onChange={setDeliveryFilter}
              style={{ minWidth: 150 }}
              allowClear
            >
              <Option value="">ทั้งหมด</Option>
              <Option value="coop">รับที่สหกรณ์</Option>
              <Option value="system">ที่อยู่ในระบบ</Option>
              <Option value="custom">ที่อยู่ใหม่</Option>
            </Select>
            <Button
              icon={<ClearOutlined />}
              onClick={handleClearFilters}
              disabled={!searchText && !deliveryFilter}
            >
              ล้างตัวกรอง
            </Button>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ color: "#666" }}>
              แสดง {filteredData.length} จาก {dataSource.length} รายการ
            </span>
          </div>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey="MEMB_CODE"
          scroll={{ x: 800 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `ทั้งหมด ${total} รายการ`,
            pageSizeOptions: ["10", "20", "50", "100"],
            responsive: true,
          }}
          locale={{
            emptyText: (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <p style={{ fontSize: "16px", color: "#999" }}>ไม่พบข้อมูล</p>
                <p style={{ fontSize: "14px", color: "#ccc" }}>
                  ลองปรับเปลี่ยนคำค้นหาหรือตัวกรอง
                </p>
              </div>
            ),
          }}
        />
      </Card>
    </div>
  );
};

export default DeliveryReport;
