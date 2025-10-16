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
import { getDepartmentReport } from "../../services/shirtApi";
import * as XLSX from "xlsx";

const ShirtDeptReport = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedDepts, setExpandedDepts] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [rawData, setRawData] = useState([]);
  const [error, setError] = useState(null);

  const sizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL"];

  const formatNumber = (num) => {
    if (!num || num === 0) return "-";
    return Number(num).toLocaleString("th-TH");
  };

  // ✅ ฟังก์ชันเปิด PDF ในหน้าต่างใหม่
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
      console.log("📊 Loading department report...");
      const data = await getDepartmentReport();

      if (data && Array.isArray(data) && data.length > 0) {
        setRawData(data);
        console.log("📊 Department report loaded:", data.length, "records");

        const isSampleData =
          data.length <= 15 &&
          data.some(
            (item) =>
              item.DEPT_NAME === "สำนักงานมหาวิทยาลัย" &&
              item.SECT_NAME === "ภาควิชากีฬาวิทยา"
          );

        if (isSampleData) {
          message.warning(
            `แสดงข้อมูลตัวอย่าง (${data.length} รายการ) - API ยังไม่พร้อมใช้งาน`
          );
        } else {
          message.success(`โหลดข้อมูลรายงานสำเร็จ: ${data.length} รายการ`);
        }
      } else {
        setRawData([]);
        message.info("ไม่พบข้อมูลรายงาน");
      }
    } catch (err) {
      console.error("❌ Load report error:", err);
      setError(err.message || "ไม่สามารถโหลดข้อมูลรายงานได้");
      setRawData([]);

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

      if (!groupedData || groupedData.length === 0) {
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
        }}
      >
        <Spin size="large" />
        <div style={{ marginTop: 16, color: "#666" }}>
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
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "24px",
            marginBottom: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
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
                  fontSize: "24px",
                  fontWeight: "bold",
                  margin: 0,
                  color: "#1f2937",
                }}
              >
                สรุปจำนวนตามหน่วยงาน
              </h1>
              <p style={{ color: "#6b7280", margin: "4px 0 0 0" }}>
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
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  backgroundColor: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
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
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  backgroundColor: rawData.length === 0 ? "#d1d5db" : "#52c41a",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
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

          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "250px" }}>
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
                  paddingTop: "8px",
                  paddingBottom: "8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>
        </div>

        {filteredData.length > 0 ? (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      backgroundColor: "#1f4e79",
                      color: "white",
                    }}
                  >
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "14px",
                        fontWeight: "600",
                        minWidth: "250px",
                      }}
                    >
                      หน่วยงาน/ภาควิชา
                    </th>
                    {sizes.map((size) => (
                      <th
                        key={size}
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontSize: "14px",
                          fontWeight: "600",
                          minWidth: "60px",
                        }}
                      >
                        {size}
                      </th>
                    ))}
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "center",
                        fontSize: "14px",
                        fontWeight: "600",
                        minWidth: "80px",
                      }}
                    >
                      รวม
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "center",
                        fontSize: "14px",
                        fontWeight: "600",
                        minWidth: "100px",
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
                          backgroundColor: "#f3f4f6",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        <td
                          style={{ padding: "12px 16px", cursor: "pointer" }}
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
                                style={{ fontWeight: "600", color: "#1f2937" }}
                              >
                                {dept.name}
                              </div>
                              <div
                                style={{ fontSize: "12px", color: "#6b7280" }}
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
                              padding: "12px",
                              textAlign: "center",
                              fontWeight: "500",
                              color: "#374151",
                            }}
                          >
                            {formatNumber(dept.totalBySize[size])}
                          </td>
                        ))}
                        <td
                          style={{ padding: "12px 16px", textAlign: "center" }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 12px",
                              backgroundColor: "#1890ff",
                              color: "white",
                              borderRadius: "9999px",
                              fontWeight: "bold",
                              fontSize: "14px",
                            }}
                          >
                            {formatNumber(dept.grandTotal)}
                          </span>
                        </td>
                        <td
                          style={{ padding: "12px 16px", textAlign: "center" }}
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
                              borderBottom: "1px solid #f3f4f6",
                            }}
                          >
                            <td
                              style={{
                                padding: "12px 16px",
                                paddingLeft: "48px",
                              }}
                            >
                              <div
                                style={{ fontSize: "14px", color: "#374151" }}
                              >
                                {section.name}
                              </div>
                              <div
                                style={{ fontSize: "12px", color: "#9ca3af" }}
                              >
                                รหัส: {dept.code}
                                {section.code}
                              </div>
                            </td>
                            {sizes.map((size) => (
                              <td
                                key={size}
                                style={{
                                  padding: "12px",
                                  textAlign: "center",
                                  fontSize: "14px",
                                  color: "#6b7280",
                                }}
                              >
                                {formatNumber(section.sizes[size])}
                              </td>
                            ))}
                            <td
                              style={{
                                padding: "12px 16px",
                                textAlign: "center",
                              }}
                            >
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "2px 8px",
                                  backgroundColor: "#e5e7eb",
                                  color: "#374151",
                                  borderRadius: "4px",
                                  fontSize: "14px",
                                  fontWeight: "500",
                                }}
                              >
                                {formatNumber(section.total)}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
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
                      backgroundColor: "#1f4e79",
                      color: "white",
                      fontWeight: "bold",
                    }}
                  >
                    <td style={{ padding: "16px", fontSize: "16px" }}>
                      รวมทั้งหมด
                    </td>
                    {sizes.map((size) => (
                      <td
                        key={size}
                        style={{
                          padding: "16px",
                          textAlign: "center",
                          fontSize: "14px",
                        }}
                      >
                        {formatNumber(grandTotalBySize[size])}
                      </td>
                    ))}
                    <td
                      style={{
                        padding: "16px",
                        textAlign: "center",
                        fontSize: "18px",
                      }}
                    >
                      {formatNumber(grandTotal)}
                    </td>
                    <td style={{ padding: "16px" }}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "48px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                fontSize: "18px",
                color: "#6b7280",
                marginBottom: "8px",
              }}
            >
              ไม่พบผลการค้นหา
            </div>
            <div style={{ color: "#9ca3af" }}>
              ลองเปลี่ยนคำค้นหาหรือลบตัวกรองออก
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: "24px",
            textAlign: "center",
            color: "#6b7280",
            fontSize: "14px",
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
