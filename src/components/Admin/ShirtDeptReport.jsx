import React, { useState, useMemo, useEffect } from "react";
import {
  SearchOutlined,
  DownOutlined,
  RightOutlined,
  DownloadOutlined,
  ReloadOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import { message, Spin, Alert } from "antd";
import { getDepartmentReport, getShirtSizes } from "../../services/shirtApi";
import * as XLSX from "xlsx";

const ShirtDeptReport = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedDepts, setExpandedDepts] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [rawData, setRawData] = useState([]);
  const [error, setError] = useState(null);
  const [sizes, setSizes] = useState([]);

  const formatNumber = (num) => {
    if (!num || num === 0) return "-";
    return Number(num).toLocaleString("th-TH");
  };

  const handleExportPDF = (deptCode, sectCode = null) => {
    const baseUrl = "https://apps4.coop.ku.ac.th/php/jacket/report_details.php";
    let url = `${baseUrl}?dept_code=${deptCode}`;

    if (sectCode) {
      url += `&sect_code=${sectCode}`;
    }

    window.open(url, "_blank", "noopener,noreferrer");

    const label = sectCode
      ? `ภาควิชา ${deptCode}${sectCode}`
      : `หน่วยงาน ${deptCode}`;
    message.success(`กำลังเปิด PDF สำหรับ${label}`);
  };

  const loadReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("📊 Loading department report and shirt sizes...");

      // ✅ โหลดทั้งข้อมูลรายงานและขนาดเสื้อพร้อมกัน
      const [reportData, sizeData] = await Promise.all([
        getDepartmentReport(),
        getShirtSizes(),
      ]);

      if (reportData && Array.isArray(reportData) && reportData.length > 0) {
        setRawData(reportData);

        // ✅ ดึงเฉพาะ SIZE_CODE ที่มีในข้อมูลจริง
        const sizesInData = [
          ...new Set(reportData.map((item) => item.SIZE_CODE)),
        ];

        // ✅ สร้าง map สำหรับเรียงลำดับตาม SORT_ORDER
        const sizeOrderMap = {};
        sizeData.forEach((s) => {
          sizeOrderMap[s.SIZE_CODE] = s.SORT_ORDER;
        });

        // ✅ เรียงลำดับตาม SORT_ORDER
        sizesInData.sort((a, b) => {
          const orderA = sizeOrderMap[a] ?? 999;
          const orderB = sizeOrderMap[b] ?? 999;
          return orderA - orderB;
        });

        setSizes(sizesInData);

        console.log(
          "📊 Department report loaded:",
          reportData.length,
          "records"
        );
        console.log("📏 Sizes found in data:", sizesInData);

        const isSampleData =
          reportData.length <= 15 &&
          reportData.some(
            (item) =>
              item.DEPT_NAME === "สำนักงานมหาวิทยาลัย" &&
              item.SECT_NAME === "ภาควิชากีฬาวิทยา"
          );

        if (isSampleData) {
          message.warning(
            `แสดงข้อมูลตัวอย่าง (${reportData.length} รายการ) - API ยังไม่พร้อมใช้งาน`
          );
        } else {
          message.success(
            `โหลดข้อมูลรายงานสำเร็จ: ${reportData.length} รายการ`
          );
        }
      } else {
        setRawData([]);
        setSizes([]);
        message.info("ไม่พบข้อมูลรายงาน");
      }
    } catch (err) {
      console.error("❌ Load report error:", err);
      setError(err.message || "ไม่สามารถโหลดข้อมูลรายงานได้");
      setRawData([]);
      setSizes([]);

      if (err.message.includes("404") || err.message.includes("ไม่พบ")) {
        message.error("API endpoint ยังไม่พร้อมใช้งาน");
      } else if (
        err.message.includes("network") ||
        err.message.includes("timeout")
      ) {
        message.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
      } else {
        message.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      console.log("📊 Exporting department report to Excel...");

      if (!groupedData || groupedData.length === 0 || sizes.length === 0) {
        message.warning("ไม่มีข้อมูลสำหรับ export");
        return;
      }

      const excelData = [];

      const headerRow = ["หน่วยงาน/ภาควิชา", "รหัส", ...sizes, "รวม"];
      excelData.push(headerRow);

      groupedData.forEach((dept) => {
        const deptRow = [
          dept.name,
          dept.code,
          ...sizes.map((size) => dept.totalBySize[size] || 0),
          dept.grandTotal,
        ];
        excelData.push(deptRow);

        if (dept.sections && dept.sections.length > 0) {
          dept.sections.forEach((section) => {
            const sectionRow = [
              `  ${section.name}`,
              `${dept.code}${section.code}`,
              ...sizes.map((size) => section.sizes[size] || 0),
              section.total,
            ];
            excelData.push(sectionRow);
          });
        }
      });

      const grandTotalRow = [
        "รวมทั้งหมด",
        "",
        ...sizes.map((size) => grandTotalBySize[size] || 0),
        grandTotal,
      ];
      excelData.push(grandTotalRow);

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(excelData);

      const columnWidths = [
        { wch: 40 },
        { wch: 10 },
        ...sizes.map(() => ({ wch: 8 })),
        { wch: 10 },
      ];
      worksheet["!cols"] = columnWidths;

      const headerStyle = {
        font: { bold: true },
        fill: { fgColor: { rgb: "4472C4" } },
        alignment: { horizontal: "center" },
      };

      for (let col = 0; col < headerRow.length; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!worksheet[cellAddress]) worksheet[cellAddress] = {};
        worksheet[cellAddress].s = headerStyle;
      }

      const totalRowIndex = excelData.length - 1;
      const totalStyle = {
        font: { bold: true },
        fill: { fgColor: { rgb: "E7E6E6" } },
      };

      for (let col = 0; col < headerRow.length; col++) {
        const cellAddress = XLSX.utils.encode_cell({
          r: totalRowIndex,
          c: col,
        });
        if (!worksheet[cellAddress]) worksheet[cellAddress] = {};
        worksheet[cellAddress].s = totalStyle;
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, "รายงานแยกหน่วยงาน");

      const fileName = `รายงานแยกหน่วยงาน_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      XLSX.writeFile(workbook, fileName);

      message.success("ดาวน์โหลดรายงานสำเร็จ");
    } catch (err) {
      console.error("❌ Export error:", err);
      message.error("ไม่สามารถ export รายงานได้");
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  const groupedData = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    const deptMap = new Map();

    rawData.forEach((item) => {
      if (!item.DEPT_CODE || !item.SECT_CODE || !item.SIZE_CODE) {
        console.warn("⚠️ Invalid data item:", item);
        return;
      }

      if (!deptMap.has(item.DEPT_CODE)) {
        deptMap.set(item.DEPT_CODE, {
          code: item.DEPT_CODE,
          name: item.DEPT_NAME || `หน่วยงาน ${item.DEPT_CODE}`,
          sections: new Map(),
          totalBySize: {},
        });
      }

      const dept = deptMap.get(item.DEPT_CODE);

      if (!dept.sections.has(item.SECT_CODE)) {
        dept.sections.set(item.SECT_CODE, {
          code: item.SECT_CODE,
          name: item.SECT_NAME || `ภาควิชา ${item.SECT_CODE}`,
          sizes: {},
          total: 0,
        });
      }

      const section = dept.sections.get(item.SECT_CODE);
      const count = Number(item.CNT) || 0;

      section.sizes[item.SIZE_CODE] =
        (section.sizes[item.SIZE_CODE] || 0) + count;
      section.total += count;

      dept.totalBySize[item.SIZE_CODE] =
        (dept.totalBySize[item.SIZE_CODE] || 0) + count;
    });

    return Array.from(deptMap.values()).map((dept) => ({
      ...dept,
      sections: Array.from(dept.sections.values()),
      grandTotal: dept.sections
        ? Array.from(dept.sections.values()).reduce(
            (sum, s) => sum + s.total,
            0
          )
        : 0,
    }));
  }, [rawData]);

  const filteredData = useMemo(() => {
    if (!groupedData || groupedData.length === 0) return [];

    return groupedData.filter(
      (dept) =>
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.sections.some((sect) =>
          sect.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );
  }, [groupedData, searchTerm]);

  const toggleDept = (deptCode) => {
    const newExpanded = new Set(expandedDepts);
    if (newExpanded.has(deptCode)) {
      newExpanded.delete(deptCode);
    } else {
      newExpanded.add(deptCode);
    }
    setExpandedDepts(newExpanded);
  };

  const grandTotalBySize = useMemo(() => {
    const totals = {};
    groupedData.forEach((dept) => {
      Object.entries(dept.totalBySize).forEach(([size, count]) => {
        totals[size] = (totals[size] || 0) + count;
      });
    });
    return totals;
  }, [groupedData]);

  const grandTotal = Object.values(grandTotalBySize).reduce(
    (sum, val) => sum + val,
    0
  );

  if (loading) {
    return (
      <div
        style={{
          minHeight: "50vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          padding: "60px 20px",
        }}
      >
        <div
          style={{
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #1890ff",
            borderRadius: "50%",
            width: "48px",
            height: "48px",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
        <div style={{ marginTop: 16, color: "#666", fontSize: "14px" }}>
          กำลังโหลดข้อมูลรายงาน...
        </div>
      </div>
    );
  }

  if (error && rawData.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="ไม่สามารถโหลดข้อมูลรายงานได้"
          description={error}
          type="error"
          showIcon
          action={
            <button
              onClick={loadReportData}
              style={{
                padding: "8px 16px",
                backgroundColor: "#1890ff",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              ลองใหม่
            </button>
          }
        />
      </div>
    );
  }

  if (!loading && rawData.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="ไม่มีข้อมูลรายงาน"
          description="ยังไม่มีข้อมูลการสำรวจขนาดเสื้อในระบบ หรือข้อมูลยังไม่ได้รับการประมวลผล"
          type="info"
          showIcon
          action={
            <button
              onClick={loadReportData}
              style={{
                padding: "8px 16px",
                backgroundColor: "#1890ff",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              รีเฟรช
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#fff",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: "100%", margin: "0 auto" }}>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "24px",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
            border: "1px solid #e8e8e8",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  margin: "0 0 12px 0",
                  color: "#1d1d1f",
                }}
              >
                สรุปจำนวนตามหน่วยงาน
              </h1>
              <p style={{ color: "#666", margin: "0", fontSize: "13px" }}>
                แยกตามหน่วยงานและภาควิชา/ฝ่ายงาน ({formatNumber(rawData.length)}{" "}
                รายการ)
                {rawData.length > 0 &&
                  rawData.some(
                    (item) =>
                      item.DEPT_NAME === "สำนักงานมหาวิทยาลัย" &&
                      item.SECT_NAME === "ภาควิชากีฬาวิทยา"
                  ) && (
                    <span
                      style={{
                        marginLeft: "8px",
                        fontSize: "12px",
                        backgroundColor: "#fff7e6",
                        color: "#d46b08",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        border: "1px solid #ffd591",
                      }}
                    >
                      ข้อมูลตัวอย่าง
                    </span>
                  )}
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                onClick={loadReportData}
                disabled={loading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  height: "38px",
                  padding: "0 16px",
                  backgroundColor: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                <ReloadOutlined spin={loading} />
                รีเฟรช
              </button>
              <button
                onClick={handleExportExcel}
                disabled={exportLoading || rawData.length === 0}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  height: "38px",
                  padding: "0 16px",
                  backgroundColor: rawData.length === 0 ? "#d1d5db" : "#52c41a",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor:
                    exportLoading || rawData.length === 0
                      ? "not-allowed"
                      : "pointer",
                  opacity: exportLoading || rawData.length === 0 ? 0.5 : 1,
                }}
              >
                <DownloadOutlined />
                {exportLoading ? "กำลัง Export..." : "Excel"}
              </button>
            </div>
          </div>

          <div style={{ marginTop: "12px" }}>
            <div style={{ position: "relative", maxWidth: "100%" }}>
              <SearchOutlined
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9ca3af",
                }}
              />
              <input
                type="text"
                placeholder="ค้นหาหน่วยงานหรือภาควิชา..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  paddingLeft: "40px",
                  paddingRight: "16px",
                  paddingTop: "9px",
                  paddingBottom: "9px",
                  border: "1px solid #d9d9d9",
                  borderRadius: "6px",
                  fontSize: "14px",
                  height: "38px",
                  transition: "all 0.3s",
                  color: "#333",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#1890ff";
                  e.target.style.boxShadow =
                    "0 0 0 2px rgba(24, 144, 255, 0.2)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#d9d9d9";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          </div>
        </div>

        {filteredData.length > 0 ? (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "6px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
              border: "1px solid #e8e8e8",
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  background: "#fff",
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: "#fafafa",
                      color: "#1d1d1f",
                    }}
                  >
                    <th
                      style={{
                        padding: "16px 12px",
                        textAlign: "left",
                        fontSize: "14px",
                        fontWeight: "600",
                        minWidth: "250px",
                        borderBottom: "2px solid #e8e8e8",
                      }}
                    >
                      หน่วยงาน/ภาควิชา
                    </th>
                    {sizes.map((size) => (
                      <th
                        key={size}
                        style={{
                          padding: "16px 12px",
                          textAlign: "center",
                          fontSize: "14px",
                          fontWeight: "600",
                          minWidth: "60px",
                          borderBottom: "2px solid #e8e8e8",
                        }}
                      >
                        {size}
                      </th>
                    ))}
                    <th
                      style={{
                        padding: "16px 12px",
                        textAlign: "center",
                        fontSize: "14px",
                        fontWeight: "600",
                        minWidth: "80px",
                        borderBottom: "2px solid #e8e8e8",
                      }}
                    >
                      รวม
                    </th>
                    <th
                      style={{
                        padding: "16px 12px",
                        textAlign: "center",
                        fontSize: "14px",
                        fontWeight: "600",
                        minWidth: "100px",
                        borderBottom: "2px solid #e8e8e8",
                      }}
                    >
                      การดำเนินการ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((dept) => (
                    <React.Fragment key={dept.code}>
                      <tr
                        style={{
                          backgroundColor: "#fafafa",
                          borderBottom: "1px solid #f0f0f0",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f5f5f5";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#fafafa";
                        }}
                      >
                        <td
                          style={{ padding: "14px 12px", cursor: "pointer" }}
                          onClick={() => toggleDept(dept.code)}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            {expandedDepts.has(dept.code) ? (
                              <DownOutlined style={{ fontSize: "16px" }} />
                            ) : (
                              <RightOutlined style={{ fontSize: "16px" }} />
                            )}
                            <div>
                              <div
                                style={{
                                  fontWeight: "600",
                                  color: "#333",
                                  fontSize: "14px",
                                }}
                              >
                                {dept.name}
                              </div>
                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "#666",
                                  marginTop: "2px",
                                }}
                              >
                                รหัส: {dept.code}
                              </div>
                            </div>
                          </div>
                        </td>
                        {sizes.map((size) => (
                          <td
                            key={size}
                            style={{
                              padding: "14px 12px",
                              textAlign: "center",
                              fontWeight: "500",
                              color: "#333",
                              fontSize: "14px",
                            }}
                          >
                            {formatNumber(dept.totalBySize[size])}
                          </td>
                        ))}
                        <td
                          style={{ padding: "14px 12px", textAlign: "center" }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 12px",
                              backgroundColor: "#1890ff",
                              color: "white",
                              borderRadius: "12px",
                              fontWeight: "bold",
                              fontSize: "14px",
                            }}
                          >
                            {formatNumber(dept.grandTotal)}
                          </span>
                        </td>
                        <td
                          style={{ padding: "14px 12px", textAlign: "center" }}
                        >
                          <button
                            onClick={() => handleExportPDF(dept.code)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "6px 12px",
                              backgroundColor: "#f8f9fa",
                              color: "#495057",
                              border: "1px solid #dee2e6",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontWeight: "400",
                              transition: "all 0.15s ease-in-out",
                            }}
                            title={`Export PDF สำหรับ ${dept.name}`}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = "#e9ecef";
                              e.target.style.borderColor = "#adb5bd";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = "#f8f9fa";
                              e.target.style.borderColor = "#dee2e6";
                            }}
                          >
                            <FilePdfOutlined />
                            PDF
                          </button>
                        </td>
                      </tr>

                      {expandedDepts.has(dept.code) &&
                        dept.sections.map((section) => (
                          <tr
                            key={section.code}
                            style={{
                              backgroundColor: "white",
                              borderBottom: "1px solid #f0f0f0",
                              transition: "background-color 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#f5f5f5";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "white";
                            }}
                          >
                            <td
                              style={{
                                padding: "14px 12px",
                                paddingLeft: "48px",
                              }}
                            >
                              <div style={{ fontSize: "14px", color: "#333" }}>
                                {section.name}
                              </div>
                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "#666",
                                  marginTop: "2px",
                                }}
                              >
                                รหัส: {dept.code}
                                {section.code}
                              </div>
                            </td>
                            {sizes.map((size) => (
                              <td
                                key={size}
                                style={{
                                  padding: "14px 12px",
                                  textAlign: "center",
                                  fontSize: "14px",
                                  color: "#666",
                                }}
                              >
                                {formatNumber(section.sizes[size])}
                              </td>
                            ))}
                            <td
                              style={{
                                padding: "14px 12px",
                                textAlign: "center",
                              }}
                            >
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "4px 12px",
                                  backgroundColor: "#e6f7ff",
                                  color: "#0958d9",
                                  border: "1px solid #91d5ff",
                                  borderRadius: "12px",
                                  fontSize: "13px",
                                  fontWeight: "500",
                                }}
                              >
                                {formatNumber(section.total)}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "14px 12px",
                                textAlign: "center",
                              }}
                            >
                              <button
                                onClick={() =>
                                  handleExportPDF(dept.code, section.code)
                                }
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "6px 12px",
                                  backgroundColor: "#f8f9fa",
                                  color: "#495057",
                                  border: "1px solid #dee2e6",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "13px",
                                  fontWeight: "400",
                                  transition: "all 0.15s ease-in-out",
                                }}
                                title={`Export PDF สำหรับ ${section.name}`}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = "#e9ecef";
                                  e.target.style.borderColor = "#adb5bd";
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = "#f8f9fa";
                                  e.target.style.borderColor = "#dee2e6";
                                }}
                              >
                                <FilePdfOutlined />
                                PDF
                              </button>
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  ))}

                  <tr
                    style={{
                      backgroundColor: "#fafafa",
                      color: "#1d1d1f",
                      fontWeight: "bold",
                      borderTop: "2px solid #e8e8e8",
                    }}
                  >
                    <td
                      style={{
                        padding: "16px 12px",
                        fontSize: "16px",
                        fontWeight: "600",
                      }}
                    >
                      รวมทั้งหมด
                    </td>
                    {sizes.map((size) => (
                      <td
                        key={size}
                        style={{
                          padding: "16px 12px",
                          textAlign: "center",
                          fontSize: "14px",
                          fontWeight: "600",
                        }}
                      >
                        {formatNumber(grandTotalBySize[size])}
                      </td>
                    ))}
                    <td
                      style={{
                        padding: "16px 12px",
                        textAlign: "center",
                        fontSize: "16px",
                        fontWeight: "bold",
                      }}
                    >
                      {formatNumber(grandTotal)}
                    </td>
                    <td style={{ padding: "16px 12px" }}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "6px",
              padding: "60px 20px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
              border: "1px solid #e8e8e8",
            }}
          >
            <div
              style={{
                fontSize: "16px",
                color: "#999",
                marginBottom: "8px",
              }}
            >
              ไม่พบผลการค้นหา
            </div>
            <div style={{ color: "#999", fontSize: "14px" }}>
              ลองเปลี่ยนคำค้นหาหรือลบตัวกรองออก
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: "24px",
            textAlign: "center",
            color: "#666",
            fontSize: "14px",
            padding: "16px 0",
          }}
        >
          <p style={{ margin: 0 }}>
            สหกรณ์ออมทรัพย์มหาวิทยาลัยเกษตรศาสตร์ จำกัด
          </p>
          <p style={{ margin: "4px 0 0 0" }}>ระบบสำรวจและจ่ายเสื้อแจ็คเก็ต</p>
        </div>
      </div>
    </div>
  );
};

export default ShirtDeptReport;
