// ===================================================================
// File: src/components/Admin/RetirementDeliveryReport.jsx
// Description: รายละเอียดการจัดส่งเสื้อสำหรับสมาชิกเกษียณอายุ
// ===================================================================

import React, { useState, useEffect, useCallback } from "react";
import {
  Input,
  Select,
  Button,
  Table,
  Tag,
  Space,
  Tooltip,
  Card,
  App,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import { getDeliveryReportList } from "../../services/shirtApi";
import * as XLSX from "xlsx";
import { formatDateTime } from "../../utils/js_functions";

const { Option } = Select;

const DeliveryReport = () => {
  const { message } = App.useApp();

  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);

  // ✅ แยก searchInput และ searchTerm เหมือน MemberList
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState("");

  // Sorting
  const [sortField, setSortField] = useState("createddate");
  const [sortOrder, setSortOrder] = useState("desc");

  // Pagination
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // ✅ Debounce search input (เหมือน MemberList)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setPagination((prev) => ({ ...prev, current: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ✅ ใช้ useCallback เพื่อ auto-reload เมื่อ dependencies เปลี่ยน
  const loadData = useCallback(async () => {
    setLoading(true);

    console.log("🔍 Loading data with params:", {
      page: pagination.current,
      pageSize: pagination.pageSize,
      search: searchTerm,
      delivery_option: deliveryFilter,
      sort_field: sortField,
      sort_order: sortOrder,
    });

    try {
      const result = await getDeliveryReportList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        search: searchTerm,
        delivery_option: deliveryFilter,
        sort_field: sortField,
        sort_order: sortOrder,
      });

      console.log("📊 API Response:", result);

      setDataSource(result.data || []);
      setPagination((prev) => ({
        ...prev,
        total: result.totalCount,
      }));

      if (result.totalCount > 0) {
        message.success(`โหลดข้อมูลสำเร็จ (${result.totalCount} รายการ)`);
      }
    } catch (error) {
      console.error("❌ Error loading delivery report:", error);
      message.error("ไม่สามารถโหลดข้อมูลได้");
      setDataSource([]);
    } finally {
      setLoading(false);
    }
  }, [
    pagination.current,
    pagination.pageSize,
    searchTerm,
    deliveryFilter,
    sortField,
    sortOrder,
  ]);

  // ✅ Auto-reload เมื่อ dependencies เปลี่ยน
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ✅ Clear search
  const handleClearSearch = () => {
    setSearchInput("");
    setSearchTerm("");
  };

  // ✅ Clear all filters
  const handleClearFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setDeliveryFilter("");
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleExportExcel = () => {
    try {
      const exportData = dataSource.map((item) => ({
        เลขสมาชิก: item.MEMB_CODE || "-",
        ชื่อ: item.FULLNAME || "-",
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
      XLSX.utils.book_append_sheet(wb, ws, "ช่องทางจัดส่งกลุ่มเกษียณ");

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
      case "no-action":
        return "ยังไม่ได้เลือก";
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
      case "no-action":
        return <Tag color="default">ยังไม่ได้เลือก</Tag>;
      default:
        return <Tag>-</Tag>;
    }
  };

  const columns = [
    {
      title: "เลขสมาชิก",
      dataIndex: "MEMB_CODE",
      key: "MEMB_CODE",
      width: 120,
      fixed: "left",
      sorter: true,
      responsive: ["xs", "sm", "md", "lg", "xl"],
    },
    {
      title: "ชื่อ-นามสกุล",
      dataIndex: "FULLNAME",
      key: "FULLNAME",
      width: 250,
      ellipsis: true,
      sorter: true,
      responsive: ["sm", "md", "lg", "xl"],
    },
    {
      title: "ความประสงค์",
      dataIndex: "DELIVERY_OPTION",
      key: "DELIVERY_OPTION",
      width: 180,
      render: (option) => getDeliveryTag(option),
      responsive: ["xs", "sm", "md", "lg", "xl"],
    },
    {
      title: "ที่อยู่จัดส่ง",
      dataIndex: "DELIVERY_ADDRESS",
      key: "DELIVERY_ADDRESS",
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
      key: "DELIVERY_PHONE",
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
      key: "date",
      width: 180,
      sorter: true,
      // ✅ เพิ่ม defaultSortOrder เพื่อแสดง indicator
      defaultSortOrder: "descend",
      // ✅ เพิ่ม sortOrder เพื่อควบคุมจาก state
      sortOrder:
        sortField === "createddate"
          ? sortOrder === "desc"
            ? "descend"
            : "ascend"
          : null,
      render: (_, record) => {
        const date = record.UPDATED_DATE || record.CREATED_DATE;
        return date ? formatDateTime(date) : "-";
      },
      responsive: ["sm", "md", "lg", "xl"],
    },
  ];

  // ✅ แก้ไข handleTableChange เพื่อ map sortOrder กลับ
  const handleTableChange = (newPagination, filters, sorter) => {
    console.log("📊 Table change:", { newPagination, sorter });

    // Update sorting
    if (sorter && sorter.field) {
      const fieldMap = {
        MEMB_CODE: "membcode",
        FULLNAME: "fullname",
        date: "createddate",
      };

      setSortField(fieldMap[sorter.field] || "createddate");
      setSortOrder(sorter.order === "ascend" ? "asc" : "desc");
    } else if (!sorter.order) {
      // ✅ ถ้า clear sort ให้กลับไปใช้ default
      setSortField("createddate");
      setSortOrder("desc");
    }

    // Update pagination
    setPagination((prev) => ({
      ...prev,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    }));
  };

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
        <h2 style={{ margin: 0 }}>รายละเอียดการจัดส่งเสื้อ - กลุ่มเกษียณ</h2>
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
            disabled={dataSource.length === 0}
          >
            ดาวน์โหลด Excel
          </Button>
        </Space>
      </div>

      <Card style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          {/* ✅ Search input with clear button */}
          <div
            style={{
              position: "relative",
              flex: "1 1 300px",
              minWidth: 250,
              maxWidth: 400,
            }}
          >
            <Input
              placeholder="ค้นหาด้วยเลขสมาชิก, ชื่อ, ที่อยู่, เบอร์โทร..."
              prefix={<SearchOutlined />}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              allowClear
              onClear={handleClearSearch}
            />
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            {/* ✅ Delivery filter dropdown */}
            <Select
              placeholder="ทั้งหมด"
              value={deliveryFilter || undefined}
              onChange={(value) => {
                console.log("🔍 Delivery filter changed to:", value);
                setDeliveryFilter(value || "");
                setPagination((prev) => ({ ...prev, current: 1 }));
              }}
              style={{ minWidth: 180 }}
              allowClear
            >
              <Option value="no-action">ยังไม่ได้เลือก</Option>
              <Option value="coop">รับที่สหกรณ์</Option>
              <Option value="system">ที่อยู่ในระบบ</Option>
              <Option value="custom">ที่อยู่ใหม่</Option>
            </Select>

            {/* ✅ Date range picker (ถ้าต้องการ) */}
            {/* 
            <DatePicker.RangePicker 
              placeholder={['วันที่เริ่มต้น', 'วันที่สิ้นสุด']}
              style={{ minWidth: 250 }}
            />
            */}

            {/* ✅ Clear filters button */}
            <Tooltip title="ล้างตัวกรอง">
              <Button
                icon={<ClearOutlined />}
                onClick={handleClearFilters}
                disabled={!searchInput && !deliveryFilter}
              >
                ล้างตัวกรอง
              </Button>
            </Tooltip>

            {/* ✅ Stats display */}
            <div style={{ whiteSpace: "nowrap", marginLeft: "8px" }}>
              <span style={{ color: "#666" }}>
                แสดง {dataSource.length} จาก {pagination.total} รายการ
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          rowKey={(record) => record.MEMB_CODE || Math.random()}
          scroll={{ x: 800 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `ทั้งหมด ${total} รายการ`,
            pageSizeOptions: ["10", "20", "50", "100"],
            responsive: true,
          }}
          onChange={handleTableChange}
          locale={{
            emptyText: (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <p style={{ fontSize: "16px", color: "#999" }}>ไม่พบข้อมูล</p>
                <p style={{ fontSize: "14px", color: "#ccc" }}>
                  ลองเปลี่ยนเงื่อนไขการค้นหา
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
