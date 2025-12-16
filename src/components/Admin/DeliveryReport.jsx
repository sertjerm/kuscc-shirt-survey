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
  Skeleton,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  ClearOutlined,
  UsergroupAddOutlined,
  ShopOutlined,
  CarOutlined,
  HomeOutlined,
  CloudServerOutlined,
} from "@ant-design/icons";
import { getDeliveryReportList } from "../../services/shirtApi";
import * as XLSX from "xlsx";
import { formatDateTime } from "../../utils/js_functions";

const { Option } = Select;

const DeliveryReport = () => {
  const { message } = App.useApp();

  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
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

  const [stats, setStats] = useState({
    total: 0,
    coop: { total: 0, r1: 0, r2: 0 },
    delivery: {
      total: 0,
      newAddress: { total: 0, r1: 0, r2: 0 },
      systemAddress: { total: 0, r1: 0, r2: 0 },
    },
  });

  // ✅ Load Summary Stats (Fetch ALL pages)
  const loadSummaryStats = async () => {
    setSummaryLoading(true);
    try {
      const BATCH_SIZE = 200; // Server seems to cap at 200
      
      // 1. Fetch first page to get total count
      const firstPageDesc = await getDeliveryReportList({
        page: 1,
        pageSize: BATCH_SIZE,
        search: "",
        delivery_option: "",
      });

      let allData = firstPageDesc.data || [];
      const totalCount = firstPageDesc.totalCount || 0;

      // 2. Determine if more pages needed
      if (totalCount > allData.length) {
        const totalPages = Math.ceil(totalCount / BATCH_SIZE);
        const promises = [];

        for (let i = 2; i <= totalPages; i++) {
          promises.push(
            getDeliveryReportList({
              page: i,
              pageSize: BATCH_SIZE,
              search: "",
              delivery_option: "",
            }).then(res => res.data || [])
          );
        }

        const remainingData = await Promise.all(promises);
        remainingData.forEach(chunk => {
          allData = allData.concat(chunk);
        });
      }

      console.log(`📊 Stats Final: Processed ${allData.length} records`);

      const newStats = {
        total: allData.length,
        coop: { total: 0, r1: 0, r2: 0 },
        delivery: {
          total: 0,
          newAddress: { total: 0, r1: 0, r2: 0 },
          systemAddress: { total: 0, r1: 0, r2: 0 },
        },
      };

      allData.forEach((item) => {
        // ✅ Fix: Use ALLOW_ROUND2 to determine round
        // Y = Round 2, N = Round 1
        const isRound1 = (item.ALLOW_ROUND2 || "").trim() === "N";
        const option = (item.DELIVERY_OPTION || "").toLowerCase().trim();
        
        // Count by Delivery Option
        if (option === "coop") {
          newStats.coop.total++;
          if (isRound1) newStats.coop.r1++;
          else newStats.coop.r2++;
        } else if (option === "custom") {
          newStats.delivery.total++;
          newStats.delivery.newAddress.total++;
          if (isRound1) newStats.delivery.newAddress.r1++;
          else newStats.delivery.newAddress.r2++;
        } else if (option === "system") {
          newStats.delivery.total++;
          newStats.delivery.systemAddress.total++;
          if (isRound1) newStats.delivery.systemAddress.r1++;
          else newStats.delivery.systemAddress.r2++;
        }
      });

      setStats(newStats);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    loadSummaryStats();
  }, []);

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
            onClick={() => {
              loadData();
              loadSummaryStats();
            }}
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

      {/* ✅ Summary Cards (Centered, 30% Width) */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* Card 1: Total */}
        <Card bordered={false} bodyStyle={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: summaryLoading ? 'center' : 'flex-start' }} style={{ width: '30%', minWidth: '300px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          {summaryLoading ? (
            <Skeleton active paragraph={{ rows: 2 }} />
          ) : (
            <>
              <div style={{ 
                  width: 48, height: 48, borderRadius: '50%', background: '#e6f7ff', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px',
                  border: '1px solid #91d5ff'
              }}>
                <UsergroupAddOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f1f1f', lineHeight: 1 }}>
                  {stats.total.toLocaleString()}
              </div>
              <div style={{ fontSize: '14px', color: '#8c8c8c', marginTop: '4px' }}>สมาชิกทั้งหมด</div>
              <div style={{ fontSize: '12px', color: '#bfbfbf', marginTop: '8px' }}>
                  บันทึกข้อมูลแล้ว
              </div>
            </>
          )}
        </Card>

        {/* Card 2: Pickup at Coop */}
        <Card bordered={false} bodyStyle={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: summaryLoading ? 'center' : 'flex-start' }} style={{ width: '30%', minWidth: '300px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          {summaryLoading ? (
             <Skeleton active paragraph={{ rows: 2 }} />
          ) : (
             <>
                <div style={{ 
                    width: 48, height: 48, borderRadius: '50%', background: '#f6ffed', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px',
                    border: '1px solid #b7eb8f'
                 }}>
                    <ShopOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                 </div>
                 <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f1f1f', lineHeight: 1 }}>
                       {stats.coop.total.toLocaleString()}
                 </div>
                 <div style={{ fontSize: '14px', color: '#8c8c8c', marginTop: '4px' }}>รับที่สหกรณ์</div>
                 
                 <div style={{ width: '100%', marginTop: 'auto', paddingTop: '12px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
                    <Tag color="geekblue" style={{ margin: 0, borderRadius: '12px', padding: '0 10px' }}>รอบแรก: {stats.coop.r1.toLocaleString()}</Tag>
                    <Tag color="purple" style={{ margin: 0, borderRadius: '12px', padding: '0 10px' }}>รอบ 2: {stats.coop.r2.toLocaleString()}</Tag>
                 </div>
             </>
          )}
        </Card>

        {/* Card 3: Delivery */}
        <Card bordered={false} bodyStyle={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: summaryLoading ? 'center' : 'flex-start' }} style={{ width: '30%', minWidth: '300px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
           {summaryLoading ? (
              <Skeleton active paragraph={{ rows: 3 }} />
           ) : (
              <>
                 <div style={{ 
                    width: 48, height: 48, borderRadius: '50%', background: '#fff7e6', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px',
                    border: '1px solid #ffd591'
                 }}>
                    <CarOutlined style={{ fontSize: '24px', color: '#fa8c16' }} />
                 </div>
                 <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f1f1f', lineHeight: 1 }}>
                       {(stats.delivery.newAddress.total + stats.delivery.systemAddress.total).toLocaleString()}
                 </div>
                 <div style={{ fontSize: '14px', color: '#8c8c8c', marginTop: '4px' }}>จัดส่งพัสดุ</div>

                 <div style={{ width: '100%', marginTop: 'auto', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* New Address Row (Single Line) */}
                    <div style={{ background: '#fafafa', padding: '6px 10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <HomeOutlined style={{ color: '#fa8c16' }} />
                          <span style={{ fontSize: '12px', color: '#595959' }}>ที่อยู่ใหม่</span>
                       </div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ fontSize: '14px', marginRight: '4px' }}>{stats.delivery.newAddress.total.toLocaleString()}</strong>
                          <Tag color="geekblue" style={{ margin: 0, padding: '0 6px', fontSize: '10px', lineHeight: '18px' }}>
                             รอบแรก: {stats.delivery.newAddress.r1.toLocaleString()}
                          </Tag>
                          <Tag color="purple" style={{ margin: 0, padding: '0 6px', fontSize: '10px', lineHeight: '18px' }}>
                             รอบ 2: {stats.delivery.newAddress.r2.toLocaleString()}
                          </Tag>
                       </div>
                    </div>

                    {/* System Address Row (Single Line) */}
                    <div style={{ background: '#fafafa', padding: '6px 10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CloudServerOutlined style={{ color: '#13c2c2' }} />
                          <span style={{ fontSize: '12px', color: '#595959' }}>ในระบบ</span>
                       </div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ fontSize: '14px', marginRight: '4px' }}>{stats.delivery.systemAddress.total.toLocaleString()}</strong>
                          <Tag color="geekblue" style={{ margin: 0, padding: '0 6px', fontSize: '10px', lineHeight: '18px' }}>
                             รอบแรก: {stats.delivery.systemAddress.r1.toLocaleString()}
                          </Tag>
                          <Tag color="purple" style={{ margin: 0, padding: '0 6px', fontSize: '10px', lineHeight: '18px' }}>
                             รอบ 2: {stats.delivery.systemAddress.r2.toLocaleString()}
                          </Tag>
                       </div>
                    </div>
                 </div>
              </>
           )}
        </Card>

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
