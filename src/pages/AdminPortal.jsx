import React, { useState, useEffect, useRef } from "react";

// Mock useAppContext หากไม่มี
const useAppContext = () => ({
  user: { name: "Admin User" },
  logout: () => {
    console.log("Logging out...");
    // Implement logout logic here
  },
});

const AdminPortal = () => {
  const { user, logout } = useAppContext();
  const [allMembers, setAllMembers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [inventoryData, setInventoryData] = useState({});
  const [selectedMember, setSelectedMember] = useState(null);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [receiverType, setReceiverType] = useState("self");
  const [receiverName, setReceiverName] = useState("");
  const [alertMessage, setAlertMessage] = useState({
    text: "",
    type: "",
    visible: false,
  });
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // ขนาดเสื้อที่มี
  const shirtSizes = [
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

  // โหลดข้อมูลเมื่อเริ่มต้น
  useEffect(() => {
    loadMemberData();
    setupSignaturePad();
  }, []);

  const showAlert = (text, type = "info") => {
    setAlertMessage({ text, type, visible: true });
    setTimeout(() => {
      setAlertMessage((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  const loadMemberData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://apps4.coop.ku.ac.th/KusccToolService/Service1.svc/GetShirtMemberList?size_code=ALL"
      );
      const result = await response.json();

      if (result.responseCode === 200) {
        setAllMembers(result.data);
        updateInventoryData(result.data);
      } else {
        showAlert("ไม่สามารถโหลดข้อมูลได้: " + result.responseMessage, "error");
        loadSampleData();
      }
    } catch (error) {
      console.error("Error loading data:", error);
      showAlert("เกิดข้อผิดพลาดในการโหลดข้อมูล", "error");
      loadSampleData();
    }
    setLoading(false);
  };

  const loadSampleData = () => {
    const sampleData = [
      {
        DISPLAYNAME: "คุณเกียรติณรงค์",
        FULLNAME: "นายเกียรติณรงค์ ถนอมทรัพย์",
        MEMB_CODE: "009999",
        SIZE_CODE: "L",
        SURVEY_METHOD: "MANUAL",
        RECEIVED: 0,
      },
      {
        DISPLAYNAME: "คุณพัชรี",
        FULLNAME: "นางพัชรี เสริฐเจิม",
        MEMB_CODE: "010099",
        SIZE_CODE: "XS",
        SURVEY_METHOD: "ONLINE",
        RECEIVED: 0,
      },
      {
        DISPLAYNAME: "คุณสมัย",
        FULLNAME: "นายสมัย เสริฐเจิม",
        MEMB_CODE: "012938",
        SIZE_CODE: "XL",
        SURVEY_METHOD: "ONLINE",
        RECEIVED: 0,
      },
    ];
    setAllMembers(sampleData);
    updateInventoryData(sampleData);
  };

  const updateInventoryData = (members) => {
    const inventory = {};

    shirtSizes.forEach((size) => {
      const sizeMembers = members.filter((member) => member.SIZE_CODE === size);
      const received = sizeMembers.filter(
        (member) => member.RECEIVED > 0
      ).length;

      inventory[size] = {
        produced: 500, // จำนวนที่ผลิต (ตัวอย่าง)
        reserved: sizeMembers.length,
        distributed: received,
        remaining: 500 - sizeMembers.length,
      };
    });

    setInventoryData(inventory);
  };

  const searchMember = () => {
    if (searchValue.length !== 6) {
      showAlert("กรุณากรอกเลขสมาชิก 6 หลัก", "error");
      return;
    }

    const results = allMembers.filter((member) =>
      member.MEMB_CODE.includes(searchValue)
    );

    if (results.length === 0) {
      showAlert("ไม่พบข้อมูลสมาชิก", "warning");
      setSearchResults([]);
    } else {
      setSearchResults(results);
    }
  };

  const getStatusInfo = (member) => {
    if (member.RECEIVED > 0) {
      return {
        status: "received",
        text: "รับเสื้อแล้ว",
        color: "#52c41a",
      };
    } else if (member.SIZE_CODE) {
      return {
        status: "confirmed",
        text: "ยืนยันขนาดแล้ว",
        color: "#1890ff",
      };
    } else {
      return {
        status: "pending",
        text: "ยังไม่ยืนยันขนาด",
        color: "#faad14",
      };
    }
  };

  const handleSelectMember = (member) => {
    setSelectedMember(member);
    setSelectedSize(member.SIZE_CODE || "");
    setReceiverType("self");
    setReceiverName("");
    setReceiptModalVisible(true);
  };

  const setupSignaturePad = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // ปรับขนาด canvas
    canvas.width = canvas.offsetWidth;
    canvas.height = 200;

    const startDrawing = (e) => {
      setIsDrawing(true);
      draw(e);
    };

    const draw = (e) => {
      if (!isDrawing) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
      const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#333";

      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const stopDrawing = () => {
      if (isDrawing) {
        ctx.beginPath();
        setIsDrawing(false);
      }
    };

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseout", stopDrawing);

    // Touch events
    canvas.addEventListener("touchstart", startDrawing);
    canvas.addEventListener("touchmove", draw);
    canvas.addEventListener("touchend", stopDrawing);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const isSignatureEmpty = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return !imageData.data.some((channel) => channel !== 0);
  };

  const confirmReceipt = async () => {
    try {
      if (!selectedSize) {
        showAlert("กรุณาเลือกขนาดเสื้อ", "error");
        return;
      }

      if (isSignatureEmpty()) {
        showAlert("กรุณาเซ็นชื่อเพื่อยืนยันการรับเสื้อ", "error");
        return;
      }

      if (receiverType === "proxy" && !receiverName.trim()) {
        showAlert("กรุณากรอกชื่อผู้รับแทน", "error");
        return;
      }

      const receiptData = {
        memberCode: selectedMember.MEMB_CODE,
        size: selectedSize,
        receiverType: receiverType,
        receiverName:
          receiverType === "proxy" ? receiverName : selectedMember.DISPLAYNAME,
        signature: canvasRef.current.toDataURL(),
        timestamp: new Date().toISOString(),
      };

      // อัปเดตข้อมูลสมาชิก
      const updatedMembers = allMembers.map((member) => {
        if (member.MEMB_CODE === selectedMember.MEMB_CODE) {
          return {
            ...member,
            SIZE_CODE: selectedSize,
            RECEIVED: (member.RECEIVED || 0) + 1,
            RECEIPT_DATA: receiptData,
          };
        }
        return member;
      });

      setAllMembers(updatedMembers);
      updateInventoryData(updatedMembers);

      // อัปเดตผลการค้นหา
      if (searchResults.length > 0) {
        const updatedResults = searchResults.map((member) => {
          if (member.MEMB_CODE === selectedMember.MEMB_CODE) {
            return updatedMembers.find((m) => m.MEMB_CODE === member.MEMB_CODE);
          }
          return member;
        });
        setSearchResults(updatedResults);
      }

      showAlert("บันทึกการรับเสื้อเรียบร้อยแล้ว", "success");
      setReceiptModalVisible(false);

      // ถามว่าต้องการพิมพ์ใบเสร็จหรือไม่
      if (window.confirm("ต้องการพิมพ์ใบเสร็จการรับเสื้อหรือไม่?")) {
        printReceipt(receiptData);
      }
    } catch (error) {
      console.error("Error confirming receipt:", error);
      showAlert("เกิดข้อผิดพลาดในการบันทึก", "error");
    }
  };

  const printReceipt = (receiptData) => {
    const printWindow = window.open("", "_blank");
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ใบเสร็จการรับเสื้อ</title>
        <style>
          body { font-family: 'Sarabun', sans-serif; padding: 20px; }
          .receipt { max-width: 400px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .content { padding: 20px 0; }
          .signature { margin-top: 30px; }
          .signature img { max-width: 200px; border: 1px solid #ccc; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h2>ใบเสร็จการรับเสื้อแจ็คเก็ต</h2>
            <p>สหกรณ์ออมทรัพย์มหาวิทยาลัยเกษตรศาสตร์</p>
          </div>
          <div class="content">
            <p><strong>รหัสสมาชิก:</strong> ${selectedMember.MEMB_CODE}</p>
            <p><strong>ชื่อสมาชิก:</strong> ${selectedMember.DISPLAYNAME}</p>
            <p><strong>ขนาดเสื้อ:</strong> ${selectedSize}</p>
            <p><strong>ผู้รับ:</strong> ${receiptData.receiverName}</p>
            <p><strong>วันที่รับ:</strong> ${new Date().toLocaleDateString(
              "th-TH"
            )}</p>
            <p><strong>เวลา:</strong> ${new Date().toLocaleTimeString(
              "th-TH"
            )}</p>
          </div>
          <div class="signature">
            <p><strong>ลายเซ็นผู้รับ:</strong></p>
            <img src="${receiptData.signature}" alt="ลายเซ็น">
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      summary: inventoryData,
      memberData: allMembers.map((member) => ({
        code: member.MEMB_CODE,
        name: member.DISPLAYNAME,
        size: member.SIZE_CODE,
        status: getStatusInfo(member).text,
        received: member.RECEIVED || 0,
      })),
    };

    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadLink = document.createElement("a");
    downloadLink.setAttribute("href", dataStr);
    downloadLink.setAttribute(
      "download",
      `shirt_report_${new Date().toISOString().split("T")[0]}.json`
    );
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    showAlert("ส่งออกรายงานเรียบร้อยแล้ว", "success");
  };

  const handleLogout = async () => {
    if (window.confirm("คุณต้องการออกจากระบบหรือไม่?")) {
      logout();
    }
  };

  const styles = {
    layout: {
      minHeight: "100vh",
      backgroundColor: "#f0f2f5",
    },
    header: {
      background: "linear-gradient(135deg, #2E7D32, #4CAF50)",
      padding: "0 24px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      height: "64px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    },
    headerLeft: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
    },
    logo: {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      background: "rgba(255,255,255,0.2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "20px",
      color: "white",
    },
    headerTitle: {
      color: "white",
      margin: 0,
      fontSize: "24px",
      fontWeight: "300",
    },
    headerSubtitle: {
      color: "rgba(255,255,255,0.8)",
      fontSize: "14px",
      margin: 0,
    },
    headerButtons: {
      display: "flex",
      gap: "8px",
    },
    button: {
      padding: "8px 16px",
      border: "1px solid rgba(255,255,255,0.3)",
      background: "transparent",
      color: "white",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    content: {
      padding: "24px",
      maxWidth: "1400px",
      margin: "0 auto",
      width: "100%",
    },
    card: {
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      padding: "24px",
      marginBottom: "24px",
    },
    cardTitle: {
      fontSize: "20px",
      fontWeight: "600",
      marginBottom: "16px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    searchBox: {
      display: "flex",
      gap: "12px",
      alignItems: "center",
      marginBottom: "16px",
    },
    input: {
      flex: 1,
      padding: "12px",
      border: "1px solid #d9d9d9",
      borderRadius: "6px",
      fontSize: "14px",
    },
    primaryButton: {
      padding: "12px 24px",
      backgroundColor: "#1890ff",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: "16px",
    },
    th: {
      backgroundColor: "#fafafa",
      padding: "12px",
      textAlign: "left",
      borderBottom: "1px solid #f0f0f0",
      fontWeight: "600",
    },
    td: {
      padding: "12px",
      borderBottom: "1px solid #f0f0f0",
    },
    statusBadge: {
      padding: "4px 12px",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "500",
    },
    inventoryGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "16px",
      marginBottom: "24px",
    },
    inventoryCard: {
      backgroundColor: "white",
      borderRadius: "8px",
      padding: "20px",
      textAlign: "center",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      border: "1px solid #f0f0f0",
    },
    sizeTitle: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#1890ff",
      marginBottom: "16px",
    },
    sizeStats: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "8px",
      fontSize: "14px",
    },
    statItem: {
      padding: "8px",
      borderRadius: "4px",
      textAlign: "center",
    },
    modal: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: "white",
      borderRadius: "8px",
      padding: "24px",
      width: "90%",
      maxWidth: "600px",
      maxHeight: "80vh",
      overflowY: "auto",
    },
    modalHeader: {
      fontSize: "20px",
      fontWeight: "600",
      marginBottom: "20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    closeButton: {
      background: "none",
      border: "none",
      fontSize: "24px",
      cursor: "pointer",
      color: "#999",
    },
    formGroup: {
      marginBottom: "20px",
    },
    label: {
      display: "block",
      marginBottom: "8px",
      fontWeight: "600",
      color: "#333",
    },
    sizeSelector: {
      display: "grid",
      gridTemplateColumns: "repeat(5, 1fr)",
      gap: "8px",
      marginTop: "8px",
    },
    sizeButton: {
      padding: "12px",
      border: "1px solid #d9d9d9",
      backgroundColor: "white",
      borderRadius: "6px",
      cursor: "pointer",
      textAlign: "center",
      fontWeight: "600",
    },
    sizeButtonSelected: {
      borderColor: "#1890ff",
      backgroundColor: "#1890ff",
      color: "white",
    },
    select: {
      width: "100%",
      padding: "12px",
      border: "1px solid #d9d9d9",
      borderRadius: "6px",
      fontSize: "14px",
    },
    canvas: {
      border: "1px solid #d9d9d9",
      borderRadius: "6px",
      width: "100%",
      height: "200px",
      cursor: "crosshair",
    },
    modalButtons: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "8px",
      marginTop: "20px",
    },
    secondaryButton: {
      padding: "8px 16px",
      backgroundColor: "#f5f5f5",
      color: "#333",
      border: "1px solid #d9d9d9",
      borderRadius: "6px",
      cursor: "pointer",
    },
    alert: {
      padding: "12px 16px",
      borderRadius: "6px",
      marginBottom: "16px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    alertSuccess: {
      backgroundColor: "#f6ffed",
      border: "1px solid #b7eb8f",
      color: "#52c41a",
    },
    alertError: {
      backgroundColor: "#fff2f0",
      border: "1px solid #ffccc7",
      color: "#ff4d4f",
    },
    alertWarning: {
      backgroundColor: "#fffbe6",
      border: "1px solid #ffe58f",
      color: "#faad14",
    },
    alertInfo: {
      backgroundColor: "#e6f7ff",
      border: "1px solid #91d5ff",
      color: "#1890ff",
    },
    spinner: {
      border: "4px solid #f3f3f3",
      borderTop: "4px solid #1890ff",
      borderRadius: "50%",
      width: "40px",
      height: "40px",
      animation: "spin 1s linear infinite",
      margin: "20px auto",
    },
    loadingContainer: {
      textAlign: "center",
      padding: "40px",
    },
  };

  return (
    <div style={styles.layout}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>🏢</div>
          <div>
            <h1 style={styles.headerTitle}>สำรวจไซต์เสื้อแจคเก็ต สอ.มก.</h1>
            <p style={styles.headerSubtitle}>
              เจ้าหน้าที่: {user?.name || "Admin"}
            </p>
          </div>
        </div>
        <div style={styles.headerButtons}>
          <button style={styles.button} onClick={loadMemberData}>
            🔄 รีเฟรช
          </button>
          <button style={styles.button} onClick={exportReport}>
            📊 ส่งออกรายงาน
          </button>
          <button style={styles.button} onClick={handleLogout}>
            🚪 ออกจากระบบ
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={styles.content}>
        {/* Alert */}
        {alertMessage.visible && (
          <div
            style={{
              ...styles.alert,
              ...(alertMessage.type === "success"
                ? styles.alertSuccess
                : alertMessage.type === "error"
                ? styles.alertError
                : alertMessage.type === "warning"
                ? styles.alertWarning
                : styles.alertInfo),
            }}
          >
            {alertMessage.text}
          </div>
        )}

        {loading && (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p>กำลังโหลดข้อมูล...</p>
          </div>
        )}

        {/* ส่วนค้นหาสมาชิก */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🔍 ค้นหาสมาชิก</h2>
          <div style={styles.searchBox}>
            <input
              type="text"
              style={styles.input}
              placeholder="กรอกเลขสมาชิก 6 หลัก..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && searchMember()}
              maxLength={6}
            />
            <button style={styles.primaryButton} onClick={searchMember}>
              ค้นหา
            </button>
          </div>

          {searchResults.length > 0 && (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>รหัสสมาชิก</th>
                  <th style={styles.th}>ชื่อสมาชิก</th>
                  <th style={styles.th}>ขนาดเสื้อ</th>
                  <th style={styles.th}>สถานะ</th>
                  <th style={styles.th}>รับแล้ว</th>
                  <th style={styles.th}>การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((member) => {
                  const statusInfo = getStatusInfo(member);
                  return (
                    <tr key={member.MEMB_CODE}>
                      <td style={styles.td}>{member.MEMB_CODE}</td>
                      <td style={styles.td}>{member.DISPLAYNAME}</td>
                      <td style={styles.td}>{member.SIZE_CODE || "-"}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor: statusInfo.color + "20",
                            color: statusInfo.color,
                            border: `1px solid ${statusInfo.color}`,
                          }}
                        >
                          {statusInfo.text}
                        </span>
                      </td>
                      <td style={styles.td}>{member.RECEIVED || 0}</td>
                      <td style={styles.td}>
                        <button
                          style={styles.primaryButton}
                          onClick={() => handleSelectMember(member)}
                        >
                          บันทึกการรับ
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ส่วนสรุปสต็อก */}
        <div style={styles.inventoryGrid}>
          {Object.entries(inventoryData).map(([size, data]) => {
            const isLowStock = data.remaining <= 50;
            return (
              <div
                key={size}
                style={{
                  ...styles.inventoryCard,
                  borderColor: isLowStock ? "#ff4d4f" : "#f0f0f0",
                  backgroundColor: isLowStock ? "#fff2f0" : "white",
                }}
              >
                <div
                  style={{
                    ...styles.sizeTitle,
                    color: isLowStock ? "#ff4d4f" : "#1890ff",
                  }}
                >
                  {size}
                </div>
                <div style={styles.sizeStats}>
                  <div
                    style={{
                      ...styles.statItem,
                      backgroundColor: "#e6f7ff",
                      color: "#1890ff",
                    }}
                  >
                    <strong>{data.reserved}</strong>
                    <br />
                    จอง
                  </div>
                  <div
                    style={{
                      ...styles.statItem,
                      backgroundColor: isLowStock ? "#fff2f0" : "#f6ffed",
                      color: isLowStock ? "#ff4d4f" : "#52c41a",
                    }}
                  >
                    <strong>{data.remaining}</strong>
                    <br />
                    คงเหลือ
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ตารางสรุปสต็อก */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>📊 สรุปสต็อกทั้งหมด</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ขนาด</th>
                <th style={styles.th}>ผลิต</th>
                <th style={styles.th}>จอง</th>
                <th style={styles.th}>รับแล้ว</th>
                <th style={styles.th}>คงเหลือ</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(inventoryData).map(([size, data]) => {
                const isLowStock = data.remaining <= 50;
                return (
                  <tr key={size}>
                    <td style={styles.td}>
                      <strong>{size}</strong>
                    </td>
                    <td style={styles.td}>{data.produced}</td>
                    <td style={styles.td}>{data.reserved}</td>
                    <td style={styles.td}>{data.distributed}</td>
                    <td
                      style={{
                        ...styles.td,
                        color: isLowStock ? "#ff4d4f" : "#333",
                        fontWeight: isLowStock ? "bold" : "normal",
                      }}
                    >
                      {data.remaining}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal สำหรับบันทึกการรับเสื้อ */}
      {receiptModalVisible && (
        <div
          style={styles.modal}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setReceiptModalVisible(false);
            }
          }}
        >
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <span>บันทึกการรับเสื้อ</span>
              <button
                style={styles.closeButton}
                onClick={() => setReceiptModalVisible(false)}
              >
                ×
              </button>
            </div>

            {selectedMember && (
              <>
                <div
                  style={{
                    ...styles.alert,
                    ...styles.alertInfo,
                  }}
                >
                  <div>
                    <strong>สมาชิก:</strong> {selectedMember.DISPLAYNAME} (
                    {selectedMember.MEMB_CODE})<br />
                    <strong>ขนาดที่เลือกไว้:</strong>{" "}
                    {selectedMember.SIZE_CODE || "ยังไม่ได้เลือก"}
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>เลือกขนาดเสื้อ:</label>
                  <div style={styles.sizeSelector}>
                    {shirtSizes.map((size) => (
                      <button
                        key={size}
                        style={{
                          ...styles.sizeButton,
                          ...(selectedSize === size
                            ? styles.sizeButtonSelected
                            : {}),
                        }}
                        onClick={() => setSelectedSize(size)}
                        type="button"
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>ผู้รับเสื้อ:</label>
                  <select
                    style={styles.select}
                    value={receiverType}
                    onChange={(e) => {
                      setReceiverType(e.target.value);
                      if (e.target.value === "self") {
                        setReceiverName("");
                      }
                    }}
                  >
                    <option value="self">รับด้วยตนเอง</option>
                    <option value="proxy">ผู้อื่นรับแทน</option>
                  </select>
                </div>

                {receiverType === "proxy" && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>ชื่อผู้รับแทน:</label>
                    <input
                      type="text"
                      style={styles.input}
                      placeholder="กรอกชื่อผู้รับแทน"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                    />
                  </div>
                )}

                <div style={styles.formGroup}>
                  <label style={styles.label}>ลายเซ็นผู้รับ:</label>
                  <canvas ref={canvasRef} style={styles.canvas} />
                  <div style={{ marginTop: "8px" }}>
                    <button
                      type="button"
                      style={styles.secondaryButton}
                      onClick={clearSignature}
                    >
                      ล้างลายเซ็น
                    </button>
                  </div>
                </div>

                <div style={styles.modalButtons}>
                  <button
                    style={styles.secondaryButton}
                    onClick={() => setReceiptModalVisible(false)}
                  >
                    ยกเลิก
                  </button>
                  <button style={styles.primaryButton} onClick={confirmReceipt}>
                    ยืนยันการรับเสื้อ
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;
