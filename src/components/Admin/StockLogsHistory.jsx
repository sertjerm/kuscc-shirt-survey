// ===================================================================
// File: src/components/Admin/StockLogsHistory.jsx
// Description: แสดงประวัติการเติม/เบิกสต็อก (Fixed Version)
// ===================================================================

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Table,
  Select,
  Space,
  Typography,
  Tag,
  Button,
  Alert,
  Spin,
  Input,
  Grid,
} from "antd";
import {
  ReloadOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { getStockLogs } from "../../services/shirtApi";
import dayjs from "dayjs";
import "dayjs/locale/th";

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const ALL_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
  "6XL",
];

const StockLogsHistory = () => {
  const screens = useBreakpoint();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allLogs, setAllLogs] = useState([]);

  // Client-side filters
  const [filters, setFilters] = useState({
    sizeCode: "",
    actionType: "",
    search: "",
  });

  // ✅ โหลดข้อมูลครั้งเดียวตอน mount
  useEffect(() => {
    loadLogs();
  }, []); // ✅ empty dependency - โหลดครั้งเดียว

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("🔄 Loading stock logs...");
      const logs = await getStockLogs(); // ✅ ไม่ส่ง parameters
      console.log("✅ Loaded logs:", logs);
      setAllLogs(logs || []);
    } catch (err) {
      console.error("❌ Error loading logs:", err);
      setError(err.message || "ไม่สามารถโหลดประวัติได้");
      setAllLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Client-side filtering
  const filteredLogs = useMemo(() => {
    let result = [...allLogs];

    // Filter by size
    if (filters.sizeCode) {
      result = result.filter((log) => log.sizeCode === filters.sizeCode);
    }

    // Filter by action type
    if (filters.actionType) {
      result = result.filter((log) => log.actionType === filters.actionType);
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (log) =>
          (log.remarks && log.remarks.toLowerCase().includes(searchLower)) ||
          (log.processedBy &&
            log.processedBy.toLowerCase().includes(searchLower))
      );
    }

    return result;
  }, [allLogs, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value || "" }));
  };

  const clearFilters = () => {
    setFilters({ sizeCode: "", actionType: "", search: "" });
  };

  const columns = [
    {
      title: "วันที่/เวลา",
      dataIndex: "createdDate",
      key: "createdDate",
      width: screens.md ? 180 : 120,
      sorter: (a, b) => new Date(a.createdDate) - new Date(b.createdDate),
      defaultSortOrder: "descend",
      render: (date) => {
        if (!date) return "-";
        return (
          <Text style={{ fontSize: screens.md ? 14 : 12 }}>
            {dayjs(date).locale("th").format("DD/MM/YYYY HH:mm")}
          </Text>
        );
      },
    },
    {
      title: "ประเภท",
      dataIndex: "actionType",
      key: "actionType",
      align: "center",
      width: screens.md ? 120 : 90,
      render: (type) => {
        const isAdd = type === "ADD_STOCK";
        return (
          <Tag
            icon={isAdd ? <PlusCircleOutlined /> : <MinusCircleOutlined />}
            color={isAdd ? "success" : "error"}
          >
            {isAdd ? "เติม" : "เบิก"}
          </Tag>
        );
      },
    },
    {
      title: "ขนาด",
      dataIndex: "sizeCode",
      key: "sizeCode",
      align: "center",
      width: 80,
      sorter: (a, b) => {
        const sizeOrder = [
          "XS",
          "S",
          "M",
          "L",
          "XL",
          "2XL",
          "3XL",
          "4XL",
          "5XL",
          "6XL",
        ];
        return sizeOrder.indexOf(a.sizeCode) - sizeOrder.indexOf(b.sizeCode);
      },
      render: (size) => (
        <Text strong style={{ color: "#222" }}>
          {size}
        </Text>
      ),
    },
    {
      title: "จำนวน",
      key: "quantity",
      align: "right",
      width: 100,
      sorter: (a, b) => {
        const qtyA = a.producedDelta || a.distributedDelta;
        const qtyB = b.producedDelta || b.distributedDelta;
        return qtyA - qtyB;
      },
      render: (_, record) => {
        const qty = record.producedDelta || record.distributedDelta;
        const isAdd = record.actionType === "ADD_STOCK";
        return (
          <Text
            strong
            style={{
              color: isAdd ? "#52c41a" : "#ff4d4f",
              fontSize: screens.md ? 16 : 14,
            }}
          >
            {isAdd ? "+" : "-"}
            {qty}
          </Text>
        );
      },
    },
    {
      title: "ก่อน",
      dataIndex: "quantityBefore",
      key: "quantityBefore",
      align: "right",
      width: 80,
      responsive: ["md"],
      sorter: (a, b) => a.quantityBefore - b.quantityBefore,
      render: (val) => <Text>{val.toLocaleString()}</Text>,
    },
    {
      title: "หลัง",
      dataIndex: "quantityAfter",
      key: "quantityAfter",
      align: "right",
      width: 80,
      responsive: ["md"],
      sorter: (a, b) => a.quantityAfter - b.quantityAfter,
      render: (val) => <Text strong>{val.toLocaleString()}</Text>,
    },
    {
      title: "ผู้ทำรายการ",
      dataIndex: "processedBy",
      key: "processedBy",
      width: 120,
      responsive: ["lg"],
      render: (text) => <Text>{text || "-"}</Text>,
    },
    {
      title: "หมายเหตุ",
      dataIndex: "remarks",
      key: "remarks",
      ellipsis: true,
      responsive: ["lg"],
      render: (text) => <Text type="secondary">{text || "-"}</Text>,
    },
  ];

  if (error) {
    return (
      <Alert
        message="เกิดข้อผิดพลาด"
        description={error}
        type="error"
        showIcon
        action={
          <Button onClick={loadLogs} loading={loading}>
            ลองอีกครั้ง
          </Button>
        }
      />
    );
  }

  const hasActiveFilters =
    filters.sizeCode || filters.actionType || filters.search;

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card
        title={
          <Title level={4} style={{ margin: 0 }}>
            📋 ประวัติการเติม/เบิกสต็อก
          </Title>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={loadLogs}
            loading={loading}
          >
            {screens.md && "รีเฟรช"}
          </Button>
        }
      >
        {/* Filters */}
        <Space
          wrap
          style={{ marginBottom: 16, width: "100%" }}
          size={screens.xs ? "small" : "middle"}
        >
          <Input
            placeholder="ค้นหา (หมายเหตุ, ผู้ทำรายการ)"
            prefix={<SearchOutlined />}
            style={{ width: screens.xs ? 180 : 250 }}
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            allowClear
          />

          <Select
            placeholder="ขนาดทั้งหมด"
            style={{ width: screens.xs ? 100 : 150 }}
            value={filters.sizeCode || undefined}
            onChange={(val) => handleFilterChange("sizeCode", val)}
            allowClear
          >
            {ALL_SIZES.map((size) => (
              <Option key={size} value={size}>
                {size}
              </Option>
            ))}
          </Select>

          <Select
            placeholder="ประเภททั้งหมด"
            style={{ width: screens.xs ? 100 : 150 }}
            value={filters.actionType || undefined}
            onChange={(val) => handleFilterChange("actionType", val)}
            allowClear
          >
            <Option value="ADD_STOCK">เติมสต็อก</Option>
            <Option value="REMOVE_STOCK">เบิกสต็อก</Option>
          </Select>

          {hasActiveFilters && (
            <Button
              onClick={clearFilters}
              size={screens.xs ? "small" : "middle"}
            >
              ล้างตัวกรอง
            </Button>
          )}
        </Space>

        {/* Summary */}
        {!loading && allLogs.length > 0 && (
          <Alert
            message={
              hasActiveFilters
                ? `แสดง ${filteredLogs.length} รายการจากทั้งหมด ${allLogs.length} รายการ`
                : `ทั้งหมด ${allLogs.length} รายการ`
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">กำลังโหลดประวัติ...</Text>
            </div>
          </div>
        ) : allLogs.length === 0 ? (
          <Alert
            message="ไม่พบข้อมูล"
            description="ยังไม่มีประวัติการทำรายการในระบบ"
            type="info"
            showIcon
          />
        ) : (
          <Table
            dataSource={filteredLogs}
            columns={columns}
            rowKey="logId"
            pagination={{
              defaultPageSize: 20,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} จาก ${total} รายการ`,
              pageSizeOptions: ["10", "20", "50", "100"],
            }}
            bordered
            size={screens.xs ? "small" : "middle"}
            scroll={{ x: "max-content" }}
          />
        )}
      </Card>
    </Space>
  );
};

export default StockLogsHistory;
