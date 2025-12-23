import React, { useState, useMemo, useEffect } from "react";
import {
  SearchOutlined,
  DownOutlined,
  RightOutlined,
  DownloadOutlined,
  ReloadOutlined,
  FilePdfOutlined,
  CheckCircleOutlined,
  SkinOutlined,
} from "@ant-design/icons";
import { message, Spin, Alert, Tooltip, Tag } from "antd";
import Swal from "sweetalert2";
import {
  getDepartmentReport,
  getShirtSizes,
  submitPickupByDept,
  getInventorySummary,
} from "../../services/shirtApi";
import { STORAGE_KEYS } from "../../utils/constants";
import * as XLSX from "xlsx";

const ShirtDeptReport = ({
  cachedData,
  setCachedData,
  cachedSizes,
  setCachedSizes,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedDepts, setExpandedDepts] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [rawData, setRawData] = useState([]);
  const [error, setError] = useState(null);
  const [sizes, setSizes] = useState([]);

  // ✅ Use Cache on Mount
  useEffect(() => {
    if (cachedData && cachedData.length > 0 && cachedSizes && cachedSizes.length > 0) {
      console.log("⚡ Using cached report data");
      setRawData(cachedData);
      setSizes(cachedSizes);
    } else {
      loadReportData();
    }
  }, []);

  const formatNumber = (num) => {
    if (!num || num === 0) return "-";
    return Number(num).toLocaleString("th-TH");
  };

  const handleExportPDF = (deptCode, sectCode = null) => {
    const baseUrl = "https://apps4.coop.ku.ac.th/php/jacket/draft_report_details.php";
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
        // ✅ Update Cache
        if (setCachedData) setCachedData(reportData);

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
        // ✅ Update Cache
        if (setCachedSizes) setCachedSizes(sizesInData);

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



  /* ✅ Helper to check stock before bulk receive */
  const checkStockAvailability = async (deptCode, sectCode) => {
    try {
      const inventory = await getInventorySummary();
      const stockMap = {};
      inventory.forEach((item) => {
        stockMap[item.sizeCode] = (item.produced || 0) - (item.distributed || 0);
      });

      // Find required sizes from local data
      let requiredSizes = {};
      const dept = groupedData.find((d) => d.code === deptCode);
      if (!dept) return { valid: false, message: "ไม่พบข้อมูลหน่วยงาน" };

      if (sectCode) {
        const sect = dept.sections.find((s) => s.code === sectCode);
        if (!sect) return { valid: false, message: "ไม่พบข้อมูลภาควิชา" };
        requiredSizes = sect.sizes;
      } else {
        requiredSizes = dept.totalBySize;
      }

      const insufficientSizes = [];
      Object.entries(requiredSizes).forEach(([size, count]) => {
        if (count > 0) {
          const available = stockMap[size] || 0;
          if (available < count) {
            insufficientSizes.push(`${size} (ขาด ${count - available} ตัว)`);
          }
        }
      });

      if (insufficientSizes.length > 0) {
        return {
          valid: false,
          message: `สินค้าหมดสต็อกสำหรับขนาด: ${insufficientSizes.join(", ")}`,
        };
      }

      return { valid: true };
    } catch (error) {
      console.error("Stock check error:", error);
      return { valid: false, message: "ไม่สามารถตรวจสอบสต็อกได้" };
    }
  };

  const handleReceiveAll = async (deptCode, sectCode = null, name) => {
    try {
      // ✅ 1. Check Stock First
      const stockCheck = await checkStockAvailability(deptCode, sectCode);
      if (!stockCheck.valid) {
        Swal.fire({
          icon: "error",
          title: "ยอดคงเหลือไม่เพียงพอ",
          text: stockCheck.message,
          confirmButtonText: "ตกลง",
        });
        return;
      }

      const result = await Swal.fire({
        title: "ยืนยันการรับเสื้อทั้งหมด",
        html: `
          <div style="text-align: left; font-size: 14px; margin-bottom: 10px;">
            <p>คุณต้องการบันทึกว่า "<b>${name}</b>" รับเสื้อใช่หรือไม่?</p>
            <div style="margin: 15px 0;">
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">เลือกรอบการจอง:</label>
              <div style="display: flex; gap: 15px;">
                 <label style="cursor: pointer;">
                  <input type="radio" name="swal-round" value="1" checked> รอบแรก (ก่อน 1 ธ.ค. 68)
                </label>
                <label style="cursor: pointer;">
                  <input type="radio" name="swal-round" value="2"> รอบเก็บตก (1 ธ.ค. 68 เป็นต้นไป)
                </label>
                <label style="cursor: pointer;">
                  <input type="radio" name="swal-round" value="ALL"> ทั้งหมด
                </label>
              </div>
            </div>
            <div style="margin-top: 10px;">
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">หมายเหตุ:</label>
              <input id="swal-note" class="swal2-input" placeholder="ระบุชื่อผู้รับ (ถ้ามี)" style="margin: 0; width: 100%;">
            </div>
          </div>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "ใช่, บันทึกรับแล้ว",
        cancelButtonText: "ยกเลิก",
        preConfirm: () => {
          const round = document.querySelector('input[name="swal-round"]:checked').value;
          const note = document.getElementById("swal-note").value;
          return { round, note };
        },
      });

      if (!result.isConfirmed) return;

      const { round, note } = result.value;
      const cleanNote = note ? note.trim() : "";
      
      let roundText = "";
      if (round === "1") roundText = "(รอบแรก)";
      else if (round === "2") roundText = "(รอบเก็บตก)";
      else roundText = "(ทุกรอบ)";

      const remarks = cleanNote
        ? `รับเสื้อหน่วยงาน ${roundText} - ${cleanNote}`
        : `รับเสื้อหน่วยงาน ${roundText} (Admin Bulk)`;

      // Get user from storage
      const userStr = localStorage.getItem(STORAGE_KEYS.USER);
      let processedBy = "ADMIN";
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          processedBy = user.memberCode || user.username || "ADMIN";
        } catch (e) {
          console.error("Error parsing user from storage", e);
        }
      }

      console.log(`Receiving all for Dept: ${deptCode}, Sect: ${sectCode}, Round: ${round}, Note: ${cleanNote}`);
      
      const response = await submitPickupByDept({
        deptCode,
        sectCode,
        processedBy,
        remarks: remarks,
        roundFilter: round, // Send round to API
      });

      // Show success message with count
      const updatedCount = response.data || 0;
      Swal.fire({
        icon: "success",
        title: "บันทึกข้อมูลเรียบร้อย",
        text: `บันทึกการรับเสื้อสำเร็จจำนวน ${updatedCount} รายการ`,
        timer: 2000,
        showConfirmButton: false,
      });

      // message.success(`บันทึกการรับเสื้อสำหรับ ${name} เรียบร้อยแล้ว`);
      
      // Reload data to show updated counts (though counts might not change if they only track sizes, 
      // but if the report shows "received" status somewhere it would update. 
      // Current report shows total counts. 
      // If the report accounts for received status, this is good. 
      // If not, it just updates the backend status.)
      loadReportData();
    } catch (err) {
      console.error("Receive all error:", err);
      message.error(err.message || "เกิดข้อผิดพลาดในการบันทึกสถานะ");
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
          receivedTotal: 0, // Initialize received total
        });
      }

      const dept = deptMap.get(item.DEPT_CODE);

      if (!dept.sections.has(item.SECT_CODE)) {
        dept.sections.set(item.SECT_CODE, {
          code: item.SECT_CODE,
          name: item.SECT_NAME || `ภาควิชา ${item.SECT_CODE}`,
          sizes: {},
          total: 0,
          receivedTotal: 0, // Initialize received total
        });
      }

      const section = dept.sections.get(item.SECT_CODE);
      const count = Number(item.CNT) || 0;
      const receivedCount = Number(item.REV_CNT) || 0; // Get received count (REV_CNT)

      section.sizes[item.SIZE_CODE] =
        (section.sizes[item.SIZE_CODE] || 0) + count;
      section.total += count;
      section.receivedTotal += receivedCount; // Add to section total

      dept.totalBySize[item.SIZE_CODE] =
        (dept.totalBySize[item.SIZE_CODE] || 0) + count;
      // Note: dept.receivedTotal will be calculated from sections reduction to ensure accuracy
    });

    return Array.from(deptMap.values()).map((dept) => {
      const sectionsArray = Array.from(dept.sections.values());
      
      // Calculate Grand Totals from Sections
      const grandTotal = sectionsArray.reduce((sum, s) => sum + s.total, 0);
      const grandReceivedTotal = sectionsArray.reduce((sum, s) => sum + s.receivedTotal, 0);

      return {
        ...dept,
        sections: sectionsArray,
        grandTotal: grandTotal,
        grandReceivedTotal: grandReceivedTotal,
      };
    });
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
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                             
                            {/* Check Logic: If fully received -> Show Tag, else Show Button */}
                            {dept.grandTotal > 0 &&
                            dept.grandReceivedTotal >= dept.grandTotal ? (
                              <Tag
                                icon={<CheckCircleOutlined />}
                                color="success"
                                style={{
                                  fontSize: "13px",
                                  padding: "3px 8px",
                                  borderRadius: "4px",
                                  marginLeft: "8px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                รับแล้ว
                              </Tag>
                            ) : (
                              <button
                                onClick={() =>
                                  handleReceiveAll(dept.code, null, dept.name)
                                }
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "5px 12px",
                                  backgroundColor: "#e6f7ff",
                                  color: "#1890ff",
                                  border: "1px solid #91d5ff",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "13px",
                                  fontWeight: "400",
                                  marginLeft: "8px",
                                  transition: "all 0.15s ease-in-out",
                                }}
                                title={`บันทึกรับเสื้อทั้งหมดสำหรับ ${dept.name}`}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = "#bae7ff";
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = "#e6f7ff";
                                }}
                              >
                                <SkinOutlined />
                                รับเสื้อ
                              </button>
                            )}
                          </div>
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
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                <button
                                  onClick={() =>
                                    handleExportPDF(dept.code, section.code)
                                  }
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "6px",
                                    padding: "6px 12px",
                                    backgroundColor: "white",
                                    color: "#666",
                                    border: "1px solid #d9d9d9",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    transition: "all 0.2s",
                                  }}
                                  title={`Export PDF สำหรับ ${section.name}`}
                                  onMouseEnter={(e) => {
                                    e.target.style.color = "#1890ff";
                                    e.target.style.borderColor = "#1890ff";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.color = "#666";
                                    e.target.style.borderColor = "#d9d9d9";
                                  }}
                                >
                                  <FilePdfOutlined />
                                </button>

                                {/* ปุ่มรับทั้งหมดสำหรับภาควิชา */}
                                {section.total > 0 &&
                                section.receivedTotal >= section.total ? (
                                  <Tag
                                    icon={<CheckCircleOutlined />}
                                    color="success"
                                    style={{
                                      fontSize: "12px",
                                      padding: "4px 10px",
                                      margin: 0,
                                      height: "32px",
                                      lineHeight: "30px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      borderRadius: "4px",
                                    }}
                                  >
                                    รับแล้ว
                                  </Tag>
                                ) : (
                                  <button
                                    onClick={() =>
                                      handleReceiveAll(
                                        dept.code,
                                        section.code,
                                        section.name
                                      )
                                    }
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: "6px",
                                      padding: "6px 12px",
                                      backgroundColor: "#e6f7ff",
                                      color: "#1890ff",
                                      border: "1px solid #91d5ff",
                                      borderRadius: "4px",
                                      cursor: "pointer",
                                      fontSize: "12px",
                                      transition: "all 0.2s",
                                    }}
                                    title={`บันทึกรับเสื้อทั้งหมดสำหรับ ${section.name}`}
                                    onMouseEnter={(e) => {
                                      e.target.style.backgroundColor = "#bae7ff";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.backgroundColor = "#e6f7ff";
                                    }}
                                  >
                                    <SkinOutlined />
                                  </button>
                                )}
                              </div>
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
