// src/components/Admin/DashboardStats.jsx - RESPONSIVE MODAL
import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Progress,
  Space,
  Typography,
  Spin,
  Alert,
  Button,
  Modal,
  Table,
  Tooltip,
} from "antd";
import {
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  GiftOutlined,
  TrophyOutlined,
  RiseOutlined,
  ReloadOutlined,
  UserOutlined,
  ExpandOutlined,
  InfoCircleOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { getDashboardStats, getMembers } from "../../services/shirtApi";

const { Title, Text } = Typography;

const formatNumber = (num) => {
  if (num === null || num === undefined) return "0";
  return Number(num).toLocaleString("th-TH");
};

const DashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllSizesModal, setShowAllSizesModal] = useState(false);
  const [roundStats, setRoundStats] = useState({
    confirmed: { r1: 0, r2: 0 },
    received: { r1: 0, r2: 0 },
    pending: { r1: 0, r2: 0 },
  });
  const [sizeBreakdown, setSizeBreakdown] = useState({});

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Load main stats (Fast)
      const data = await getDashboardStats();
      console.log("📊 Dashboard Stats from API:", data);
      setStats(data);
      setLoading(false); // ✅ Show main content immediately

      // 2. Load Details in Background
      loadDetailedStats(data);
    } catch (err) {
      console.error("Error loading dashboard stats:", err);
      setError(err.message || "ไม่สามารถโหลดข้อมูลสถิติได้");
      setLoading(false);
    }
  };

  const loadDetailedStats = async (mainStats) => {
    try {
      // 2. Load Round Breakdown
      const [
        r1Received, r1Confirmed, r1Pending,
        r2Received, r2Confirmed, r2Pending
      ] = await Promise.all([
        getMembers({ round: "1", status: "RECEIVED", pageSize: 1 }),
        getMembers({ round: "1", status: "CONFIRMED", pageSize: 1 }),
        getMembers({ round: "1", status: "NOT_CONFIRMED", pageSize: 1 }),
        getMembers({ round: "2", status: "RECEIVED", pageSize: 1 }),
        getMembers({ round: "2", status: "CONFIRMED", pageSize: 1 }),
        getMembers({ round: "2", status: "NOT_CONFIRMED", pageSize: 1 }),
      ]);

      setRoundStats({
        confirmed: {
          r1: (r1Received.totalCount || 0) + (r1Confirmed.totalCount || 0),
          r2: (r2Received.totalCount || 0) + (r2Confirmed.totalCount || 0),
        },
        received: {
          r1: r1Received.totalCount || 0,
          r2: r2Received.totalCount || 0,
        },
        pending: {
          r1: r1Pending.totalCount || 0,
          r2: r2Pending.totalCount || 0,
        },
      });

      // 3. Load Breakdown for Top 5 Sizes
      if (mainStats.popularSizes && mainStats.popularSizes.length > 0) {
        const topSizes = mainStats.popularSizes.slice(0, 5);
        const breakdown = {};

        await Promise.all(
          topSizes.map(async (item) => {
            const [r1Res, r2Res] = await Promise.all([
              getMembers({ size_code: item.size, round: "1", pageSize: 1 }),
              getMembers({ size_code: item.size, round: "2", pageSize: 1 }),
            ]);
            breakdown[item.size] = {
              r1: r1Res.totalCount || 0,
              r2: r2Res.totalCount || 0,
            };
          })
        );
        setSizeBreakdown(breakdown);
      }
    } catch (err) {
      console.error("Error loading detailed stats:", err);
      // Non-critical error, don't block UI
    }
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">กำลังโหลดข้อมูล...</Text>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert
        message="เกิดข้อผิดพลาด"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" icon={<ReloadOutlined />} onClick={loadStats}>
            ลองอีกครั้ng
          </Button>
        }
      />
    );
  }

  if (!stats) {
    return null;
  }

  const confirmedPercent =
    stats.totalMembers > 0
      ? Math.round((stats.confirmedMembers / stats.totalMembers) * 100)
      : 0;

  const receivedPercent =
    stats.totalMembers > 0
      ? Math.round((stats.receivedMembers / stats.totalMembers) * 100)
      : 0;

  const pendingPercent = 100 - confirmedPercent;

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* Overview Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable size="small" style={{ height: "100%" }}>
            <Statistic
              title="สมาชิกทั้งหมด"
              value={formatNumber(stats.totalMembers)}
              prefix={<TeamOutlined />}
              valueStyle={{ color: "#000000" }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              จำนวนสมาชิกที่มีสิทธิ์รับเสื้อ
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card hoverable size="small" style={{ height: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Statistic
                title="ยืนยันขนาดแล้ว"
                value={formatNumber(stats.confirmedMembers)}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
              <Tooltip title="รวมทั้งที่รับเสื้อแล้วและยังไม่ได้รับ">
                <InfoCircleOutlined style={{ color: "#bfbfbf" }} />
              </Tooltip>
            </div>
            
            {/* Stacked Progress Bar */}
            <div style={{ 
              width: "100%", 
              height: "8px", 
              backgroundColor: "#f5f5f5", 
              borderRadius: "100px",
              overflow: "hidden",
              display: "flex",
              marginTop: 8,
              marginBottom: 8
            }}>
              {/* Round 1 */}
              <Tooltip title={`รอบ 1: ${formatNumber(roundStats.confirmed.r1)} คน`}>
                <div style={{
                  width: `${(roundStats.confirmed.r1 / stats.totalMembers) * 100}%`,
                  minWidth: roundStats.confirmed.r1 > 0 ? "4px" : "0",
                  height: "100%",
                  backgroundColor: "#1890ff",
                  transition: "width 0.3s ease"
                }} />
              </Tooltip>
              
              {/* Round 2 */}
              <Tooltip title={`รอบ 2: ${formatNumber(roundStats.confirmed.r2)} คน`}>
                <div style={{
                  width: `${(roundStats.confirmed.r2 / stats.totalMembers) * 100}%`,
                  minWidth: roundStats.confirmed.r2 > 0 ? "4px" : "0",
                  height: "100%",
                  backgroundColor: "#fa8c16",
                  transition: "width 0.3s ease"
                }} />
              </Tooltip>
            </div>

            {/* Compact Round Breakdown */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between",
              backgroundColor: "#f5f5f5",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "12px"
            }}>
              <Space size="small">
                <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#1890ff" }} />
                <Text type="secondary">รอบ 1:</Text>
                <Text strong>{formatNumber(roundStats.confirmed.r1)}</Text>
              </Space>
              <Space size="small">
                <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#fa8c16" }} />
                <Text type="secondary">รอบ 2:</Text>
                <Text strong>{formatNumber(roundStats.confirmed.r2)}</Text>
              </Space>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card hoverable size="small" style={{ height: "100%" }}>
            <Statistic
              title="รับเสื้อแล้ว"
              value={formatNumber(stats.receivedMembers)}
              prefix={<GiftOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
            {/* Stacked Progress Bar */}
            <div style={{ 
              width: "100%", 
              height: "8px", 
              backgroundColor: "#f5f5f5", 
              borderRadius: "100px",
              overflow: "hidden",
              display: "flex",
              marginTop: 8,
              marginBottom: 8
            }}>
              {/* Round 1 */}
              <Tooltip title={`รอบ 1: ${formatNumber(roundStats.received.r1)} คน`}>
                <div style={{
                  width: `${(roundStats.received.r1 / stats.totalMembers) * 100}%`,
                  minWidth: roundStats.received.r1 > 0 ? "4px" : "0",
                  height: "100%",
                  backgroundColor: "#52c41a",
                  transition: "width 0.3s ease"
                }} />
              </Tooltip>
              
              {/* Round 2 */}
              <Tooltip title={`รอบ 2: ${formatNumber(roundStats.received.r2)} คน`}>
                <div style={{
                  width: `${(roundStats.received.r2 / stats.totalMembers) * 100}%`,
                  minWidth: roundStats.received.r2 > 0 ? "4px" : "0",
                  height: "100%",
                  backgroundColor: "#fa8c16",
                  transition: "width 0.3s ease"
                }} />
              </Tooltip>
            </div>

            {/* Compact Round Breakdown */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between",
              backgroundColor: "#f5f5f5",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "12px"
            }}>
              <Space size="small">
                <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#52c41a" }} />
                <Text type="secondary">รอบ 1:</Text>
                <Text strong>{formatNumber(roundStats.received.r1)}</Text>
              </Space>
              <Space size="small">
                <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#fa8c16" }} />
                <Text type="secondary">รอบ 2:</Text>
                <Text strong>{formatNumber(roundStats.received.r2)}</Text>
              </Space>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card hoverable size="small" style={{ height: "100%" }}>
            <Statistic
              title="ยังไม่ยืนยัน"
              value={formatNumber(stats.pendingMembers)}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
            <Progress
              percent={pendingPercent}
              strokeColor="#fa8c16"
              size="small"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Detailed Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            style={{ height: "100%" }}
            title={
              <Space>
                <TrophyOutlined />
                <span>ขนาดที่ได้รับความนิยม</span>
              </Space>
            }
            extra={
              <Space>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Top 5 ขนาด
                </Text>
                <Button
                  type="link"
                  size="small"
                  icon={<ExpandOutlined />}
                  onClick={() => setShowAllSizesModal(true)}
                >
                  ดูทั้งหมด
                </Button>
              </Space>
            }
          >
            {stats.popularSizes && stats.popularSizes.length > 0 ? (
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size="middle"
              >
                {stats.popularSizes.slice(0, 5).map((item, index) => {
                  const percentage =
                    stats.confirmedMembers > 0
                      ? Math.round((item.count / stats.confirmedMembers) * 100)
                      : 0;

                  const breakdown = sizeBreakdown[item.size] || { r1: 0, r2: 0 };
                  const totalForSize = breakdown.r1 + breakdown.r2; // Should match item.count roughly
                  // Calculate percentages relative to the max possible width (100%)
                  // But here we want the bar to represent the % of TOTAL members, like before?
                  // The previous code used `percentage` which was `count / confirmedMembers`.
                  // So the bar width is `percentage`.
                  // Inside that bar, we split by r1/r2 ratio.
                  
                  const r1Ratio = totalForSize > 0 ? breakdown.r1 / totalForSize : 0;
                  const r2Ratio = totalForSize > 0 ? breakdown.r2 / totalForSize : 0;

                  return (
                    <div key={item.size} style={{ width: "100%" }}>
                      <Space
                        style={{
                          width: "100%",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <Text strong>
                          {index === 0 && "🥇 "}
                          {index === 1 && "🥈 "}
                          {index === 2 && "🥉 "}
                          {index > 2 && `${index + 1}. `}
                          ขนาด {item.size}
                        </Text>
                        <Space>
                          <Text strong style={{ fontSize: "16px" }}>
                            {formatNumber(item.count)} คน
                          </Text>
                          <Text type="secondary">({percentage}%)</Text>
                        </Space>
                      </Space>
                      
                      {/* Stacked Bar */}
                      <div style={{ 
                        width: "100%", 
                        height: "8px", 
                        backgroundColor: "#f5f5f5", 
                        borderRadius: "100px",
                        overflow: "hidden",
                        display: "flex"
                      }}>
                        {/* Round 1 Segment */}
                        <div style={{
                          width: `${percentage * r1Ratio}%`,
                          minWidth: breakdown.r1 > 0 ? "4px" : "0",
                          height: "100%",
                          backgroundColor: index === 0 ? "#faad14" : index === 1 ? "#52c41a" : index === 2 ? "#13c2c2" : "#1890ff",
                          transition: "width 0.3s ease"
                        }} />
                        
                        {/* Round 2 Segment - Different Color (Orange/Reddish to distinguish) */}
                        <div style={{
                          width: `${percentage * r2Ratio}%`,
                          minWidth: breakdown.r2 > 0 ? "4px" : "0",
                          height: "100%",
                          backgroundColor: "#fa8c16", // Orange for Round 2
                          transition: "width 0.3s ease"
                        }} />
                      </div>
                      
                      {/* Breakdown Text */}
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "2px" }}>
                         <Text type="secondary" style={{ fontSize: "10px" }}>
                           R1: {formatNumber(breakdown.r1)}
                         </Text>
                         <Text type="secondary" style={{ fontSize: "10px" }}>
                           R2: {formatNumber(breakdown.r2)}
                         </Text>
                      </div>
                    </div>
                  );
                })}
              </Space>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <Text type="secondary">ยังไม่มีข้อมูลการยืนยันขนาด</Text>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            style={{ height: "100%" }}
            title={
              <Space>
                <RiseOutlined />
                <span>สถิติการจ่ายเสื้อ</span>
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: "100%" }} size="large">
              <div>
                <Space
                  style={{
                    width: "100%",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Space>
                    <UserOutlined />
                    <Text>รับด้วยตนเอง</Text>
                  </Space>
                  <Text strong style={{ color: "#52c41a", fontSize: "18px" }}>
                    {formatNumber(stats.selfReceived)} คน
                  </Text>
                </Space>
                <Progress
                  percent={
                    stats.receivedMembers > 0
                      ? Math.round(
                          (stats.selfReceived / stats.receivedMembers) * 100
                        )
                      : 0
                  }
                  strokeColor="#52c41a"
                  size="small"
                />
              </div>

              <div>
                <Space
                  style={{
                    width: "100%",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Space>
                    <TeamOutlined />
                    <Text>รับแทน</Text>
                  </Space>
                  <Text strong style={{ color: "#fa8c16", fontSize: "18px" }}>
                    {formatNumber(stats.proxyReceived)} คน
                  </Text>
                </Space>
                <Progress
                  percent={
                    stats.receivedMembers > 0
                      ? Math.round(
                          (stats.proxyReceived / stats.receivedMembers) * 100
                        )
                      : 0
                  }
                  strokeColor="#fa8c16"
                  size="small"
                />
              </div>

              {/* ✅ New: Receive by Department */}
              <div>
                <Space
                  style={{
                    width: "100%",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Space>
                    <BankOutlined />
                    <Text>รับโดยหน่วยงาน</Text>
                  </Space>
                  <Text strong style={{ color: "#1890ff", fontSize: "18px" }}>
                    {formatNumber(stats.receivedMembers - stats.selfReceived - stats.proxyReceived)} คน
                  </Text>
                </Space>
                <Progress
                  percent={
                    stats.receivedMembers > 0
                      ? Math.round(
                          ((stats.receivedMembers - stats.selfReceived - stats.proxyReceived) /
                            stats.receivedMembers) *
                            100
                        )
                      : 0
                  }
                  strokeColor="#1890ff"
                  size="small"
                />
              </div>

              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#f0f5ff",
                  borderRadius: 8,
                  marginTop: 8,
                  border: "1px solid #d6e4ff",
                }}
              >
                <Space direction="vertical" size={4} style={{ width: "100%" }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    อัตราการจ่ายเสื้อ
                  </Text>
                  <Title level={2} style={{ margin: 0, color: "#1890ff" }}>
                    {receivedPercent}%
                  </Title>
                  <Text style={{ fontSize: 14 }}>
                    <strong>{formatNumber(stats.receivedMembers)}</strong> /{" "}
                    {formatNumber(stats.totalMembers)} คน
                  </Text>
                  <Progress
                    percent={receivedPercent}
                    strokeColor="#1890ff"
                    size="small"
                    showInfo={false}
                  />
                </Space>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Survey Method Stats */}
      {stats.surveyMethods && (
        <Card
          title="สถิติช่องทางการสำรวจ"
          extra={
            <Button size="small" icon={<ReloadOutlined />} onClick={loadStats}>
              รีเฟรช
            </Button>
          }
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Card bordered={false} style={{ backgroundColor: "#f0f5ff" }}>
                <Statistic
                  title="สำรวจออนไลน์ (สมาชิกกรอกเอง)"
                  value={`${formatNumber(stats.surveyMethods.online || 0)} คน`}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: "#1890ff" }}
                />
                <Progress
                  percent={
                    stats.confirmedMembers > 0
                      ? Math.round(
                          (stats.surveyMethods.online /
                            stats.confirmedMembers) *
                            100
                        )
                      : 0
                  }
                  strokeColor="#1890ff"
                  size="small"
                  style={{ marginTop: 8 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card bordered={false} style={{ backgroundColor: "#f6ffed" }}>
                <Statistic
                  title="บันทึกด้วยตนเอง (เจ้าหน้าที่)"
                  value={`${formatNumber(stats.surveyMethods.manual || 0)} คน`}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: "#52c41a" }}
                />
                <Progress
                  percent={
                    stats.confirmedMembers > 0
                      ? Math.round(
                          (stats.surveyMethods.manual /
                            stats.confirmedMembers) *
                            100
                        )
                      : 0
                  }
                  strokeColor="#52c41a"
                  size="small"
                  style={{ marginTop: 8 }}
                />
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      {/* Summary Section */}
      <Card style={{ backgroundColor: "#fafafa" }}>
        <Row gutter={16}>
          <Col span={8}>
            <div style={{ textAlign: "center" }}>
              <Text type="secondary">เปอร์เซ็นต์การยืนยัน</Text>
              <Title level={3} style={{ margin: "8px 0", color: "#52c41a" }}>
                {confirmedPercent}%
              </Title>
              <Text strong style={{ fontSize: 14 }}>
                {formatNumber(stats.confirmedMembers)} /{" "}
                {formatNumber(stats.totalMembers)}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                คน
              </Text>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: "center" }}>
              <Text type="secondary">เปอร์เซ็นต์การรับเสื้อ</Text>
              <Title level={3} style={{ margin: "8px 0", color: "#faad14" }}>
                {receivedPercent}%
              </Title>
              <Text strong style={{ fontSize: 14 }}>
                {formatNumber(stats.receivedMembers)} /{" "}
                {formatNumber(stats.totalMembers)}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                คน
              </Text>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: "center" }}>
              <Text type="secondary">คงเหลือที่ต้องจ่าย</Text>
              <Title level={3} style={{ margin: "8px 0", color: "#1890ff" }}>
                {formatNumber(stats.totalMembers - stats.receivedMembers)}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                คน
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Last Updated */}
      <div style={{ textAlign: "right" }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          📊 อัพเดตล่าสุด:{" "}
          {new Date().toLocaleString("th-TH", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </div>

      {/* ✅ Modal แสดงขนาดทั้งหมด - ปรับ responsive */}
      <Modal
        title={
          <Space>
            <TrophyOutlined style={{ color: "#faad14" }} />
            <span>สถิติขนาดเสื้อทั้งหมด</span>
          </Space>
        }
        open={showAllSizesModal}
        onCancel={() => setShowAllSizesModal(false)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setShowAllSizesModal(false)}
          >
            ปิด
          </Button>,
        ]}
        width="90%"
        style={{ maxWidth: 800 }}
      >
        {stats && stats.popularSizes && stats.popularSizes.length > 0 ? (
          <Table
            dataSource={stats.popularSizes.map((item, index) => ({
              key: item.size,
              rank: index + 1,
              size: item.size,
              count: item.count,
              percentage:
                stats.confirmedMembers > 0
                  ? Math.round((item.count / stats.confirmedMembers) * 100)
                  : 0,
            }))}
            columns={[
              {
                title: "อันดับ",
                dataIndex: "rank",
                key: "rank",
                width: 80,
                align: "center",
                render: (rank) => {
                  if (rank === 1)
                    return (
                      <Text strong style={{ fontSize: 20 }}>
                        🥇
                      </Text>
                    );
                  if (rank === 2)
                    return (
                      <Text strong style={{ fontSize: 20 }}>
                        🥈
                      </Text>
                    );
                  if (rank === 3)
                    return (
                      <Text strong style={{ fontSize: 20 }}>
                        🥉
                      </Text>
                    );
                  return <Text strong>{rank}</Text>;
                },
              },
              {
                title: "ขนาด",
                dataIndex: "size",
                key: "size",
                width: 100,
                align: "center",
                render: (size) => (
                  <Text strong style={{ fontSize: 18 }}>
                    {size}
                  </Text>
                ),
              },
              {
                title: "จำนวน",
                dataIndex: "count",
                key: "count",
                align: "right",
                render: (count) => (
                  <Text strong style={{ fontSize: 16 }}>
                    {formatNumber(count)} คน
                  </Text>
                ),
              },
              {
                title: "เปอร์เซ็นต์",
                dataIndex: "percentage",
                key: "percentage",
                render: (percentage) => (
                  <div style={{ minWidth: 120 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <Text type="secondary" style={{ minWidth: 45 }}>
                        {percentage}%
                      </Text>
                    </div>
                    <Progress
                      percent={percentage}
                      size="small"
                      strokeColor={
                        percentage >= 20
                          ? "#faad14"
                          : percentage >= 15
                          ? "#52c41a"
                          : percentage >= 10
                          ? "#13c2c2"
                          : "#1890ff"
                      }
                      showInfo={false}
                    />
                  </div>
                ),
              },
            ]}
            pagination={false}
            size="middle"
            scroll={{ y: 400, x: "max-content" }}
            summary={(pageData) => {
              const total = pageData.reduce(
                (sum, record) => sum + record.count,
                0
              );
              return (
                <Table.Summary fixed>
                  <Table.Summary.Row style={{ backgroundColor: "#fafafa" }}>
                    <Table.Summary.Cell index={0} colSpan={2} align="center">
                      <Text strong style={{ fontSize: 16 }}>รวมทั้งหมด</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text strong style={{ fontSize: 16, color: "#1890ff" }}>
                        {formatNumber(total)} คน
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <Text strong>100%</Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              );
            }}
          />
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Text type="secondary">ยังไม่มีข้อมูลการยืนยันขนาด</Text>
          </div>
        )}
      </Modal>
    </Space>
  );
};

export default DashboardStats;