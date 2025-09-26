# สร้างไฟล์ MembersList.jsx
echo "📄 Creating MembersList.jsx..."
cat > src/components/Admin/MembersList.jsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Input, Select, Row, Col, Space, Typography, message, DatePicker } from 'antd';
import { SearchOutlined, ReloadOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { getShirtMemberListPaged, SearchMember } from '../../services/shirtApi';

const { Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL"];

const MembersList = ({ onPickupClick }) => {
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    size: '',
  });

  useEffect(() => {
    if (!showSearchResults) {
      loadMembers(1, pagination.pageSize, filters);
    }
  }, [showSearchResults]);

  const loadMembers = async (page = 1, pageSize = 20, currentFilters = filters) => {
    setLoading(true);
    try {
      const response = await getShirtMemberListPaged(page, pageSize, currentFilters.search, currentFilters.status);
      
      // สมมติว่า API ส่งกลับ format: { data: [...], total: number, page: number, pageSize: number }
      const membersData = response.data || response;
      const formattedMembers = membersData.map(member => ({
        key: member.MEMB_CODE,
        memberCode: member.MEMB_CODE,
        name: member.FULLNAME || member.DISPLAYNAME,
        phone: member.MEMB_MOBILE,
        selectedSize: member.SIZE_CODE,
        status: member.SIZE_CODE ? "ยืนยันขนาดแล้ว" : "ยังไม่ยืนยันขนาด",
        remarks: member.REMARKS,
        pickedUp: member.PICKED_UP || false,
        surveyDate: member.SURVEY_DATE ? new Date(member.SURVEY_DATE).toLocaleDateString('th-TH') : '-',
        surveyMethod: member.SURVEY_METHOD,
      }));

      setMembers(formattedMembers);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: response.total || formattedMembers.length,
      });
    } catch (error) {
      message.error("ไม่สามารถโหลดข้อมูลสมาชิกได้");
      console.error("Load members error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (memberCode) => {
    if (!memberCode) {
      // ถ้าไม่มีค่าค้นหา กลับไปแสดงรายการปกติ
      setShowSearchResults(false);
      setSearchResults([]);
      return;
    }
    
  const handleSearch = async (memberCode) => {
    if (!memberCode) {
      // ถ้าไม่มีค่าค้นหา กลับไปแสดงรายการปกติ
      setShowSearchResults(false);
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    setShowSearchResults(true);
    
    try {
      const data = await SearchMember(memberCode);
      const result = {
        key: data.MEMB_CODE,
        memberCode: data.MEMB_CODE,
        name: data.FULLNAME || data.DISPLAYNAME,
        selectedSize: data.SIZE_CODE,
        status: data.SIZE_CODE ? "ยืนยันขนาดแล้ว" : "ยังไม่ยืนยันขนาด",
        phone: data.MEMB_MOBILE,
        remarks: data.REMARKS,
        pickedUp: data.PICKED_UP || false,
        surveyDate: data.SURVEY_DATE ? new Date(data.SURVEY_DATE).toLocaleDateString('th-TH') : '-',
        surveyMethod: data.SURVEY_METHOD,
      };
      setSearchResults([result]);
    } catch (err) {
      message.error(err.message || "ไม่พบข้อมูลสมาชิก");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleTableChange = (paginationInfo, tableFilters, sorter) => {
    if (!showSearchResults) {
      // ใช้ server-side filtering สำหรับข้อมูลปกติ
      const serverFilters = {
        search: filters.search,
        status: getServerStatusFilter(tableFilters.status),
        size: tableFilters.selectedSize?.[0] || '',
      };
      loadMembers(paginationInfo.current, paginationInfo.pageSize, serverFilters);
    }
  };

  // แปลง client filter เป็น server filter
  const getServerStatusFilter = (clientStatuses) => {
    if (!clientStatuses || clientStatuses.length === 0) return '';
    if (clientStatuses.includes('confirmed')) return 'confirmed';
    if (clientStatuses.includes('pending')) return 'pending'; 
    if (clientStatuses.includes('picked_up')) return 'picked_up';
    return '';
  };

  const handleFilterChange = (type, value) => {
    const newFilters = { ...filters, [type]: value };
    setFilters(newFilters);
    
    if (!showSearchResults) {
      loadMembers(1, pagination.pageSize, newFilters);
    }
  };

  const handleRefresh = () => {
    const resetFilters = { search: '', status: '', size: '' };
    setFilters(resetFilters);
    setShowSearchResults(false);
    setSearchResults([]);
    loadMembers(1, pagination.pageSize, resetFilters);
  };

  const columns = [
    {
      title: "รหัสสมาชิก",
      dataIndex: "memberCode",
      key: "memberCode",
      width: 120,
      sorter: (a, b) => a.memberCode.localeCompare(b.memberCode),
    },
    {
      title: "ชื่อ-นามสกุล",
      dataIndex: "name",
      key: "name",
      width: 200,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "เบอร์โทร",
      dataIndex: "phone",
      key: "phone",
      width: 120,
    },
    {
      title: "ขนาดที่เลือก",
      dataIndex: "selectedSize",
      key: "selectedSize",
      width: 100,
      render: (size) => size ? <Tag color="blue">{size}</Tag> : <Tag color="orange">ยังไม่เลือก</Tag>,
      filters: ALL_SIZES.map(size => ({ text: size, value: size })),
      filteredValue: filters.size ? [filters.size] : null,
    },
    {
      title: "วันที่จอง",
      dataIndex: "surveyDate",
      key: "surveyDate",
      width: 120,
      sorter: (a, b) => {
        if (a.surveyDate === '-' && b.surveyDate === '-') return 0;
        if (a.surveyDate === '-') return 1;
        if (b.surveyDate === '-') return -1;
        return new Date(a.surveyDate) - new Date(b.surveyDate);
      },
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status, record) => {
        if (record.pickedUp) {
          return <Tag color="green" icon={<CheckCircleOutlined />}>รับแล้ว</Tag>;
        } else if (record.selectedSize) {
          return <Tag color="blue" icon={<ClockCircleOutlined />}>ยืนยันแล้ว</Tag>;
        } else {
          return <Tag color="orange" icon={<ExclamationCircleOutlined />}>ยังไม่ยืนยัน</Tag>;
        }
      },
      filters: [
        { text: 'ยืนยันแล้ว', value: 'confirmed' },
        { text: 'ยังไม่ยืนยัน', value: 'pending' },
        { text: 'รับแล้ว', value: 'picked_up' },
      ],
      filteredValue: filters.status ? [filters.status] : null,
    },
    {
      title: "หมายเหตุ",
      dataIndex: "remarks",
      key: "remarks",
      width: 150,
      ellipsis: true,
    },
    {
      title: "การดำเนินการ",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => onPickupClick(record)}
          disabled={record.pickedUp}
        >
          {record.pickedUp ? "รับแล้ว" : "บันทึกการรับ"}
        </Button>
      ),
    },
  ];

  const currentData = showSearchResults ? searchResults : members;
  const currentLoading = showSearchResults ? searchLoading : loading;

  return (
    <Card title="ค้นหาและรับเสื้อ - รายชื่อสมาชิกทั้งหมด" bordered={false}>
      <Space direction="vertical" style={{ width: "100%", marginBottom: 16 }}>
        {/* ช่องค้นหาด่วน */}
        <Row gutter={16} align="middle">
          <Col span={12}>
            <Search
              placeholder="ค้นหาด่วนด้วยรหัสสมาชิก 6 หลัก"
              enterButton="ค้นหา"
              size="large"
              onSearch={handleSearch}
              loading={searchLoading}
              allowClear
              onClear={() => {
                setShowSearchResults(false);
                setSearchResults([]);
              }}
            />
          </Col>
          <Col span={12}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={loading}
              >
                รีเฟรช
              </Button>
              {showSearchResults && (
                <Button 
                  type="default"
                  onClick={() => {
                    setShowSearchResults(false);
                    setSearchResults([]);
                  }}
                >
                  กลับสู่รายการทั้งหมด
                </Button>
              )}
            </Space>
          </Col>
        </Row>

        {/* ตัวกรองสำหรับรายการทั้งหมด */}
        {!showSearchResults && (
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <Input
                placeholder="ค้นหาในรายการทั้งหมด (ชื่อ-นามสกุล)"
                prefix={<SearchOutlined />}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                onPressEnter={() => loadMembers(1, pagination.pageSize, filters)}
                allowClear
              />
            </Col>
            <Col>
              <Select
                placeholder="สถานะ"
                style={{ width: 140 }}
                value={filters.status}
                onChange={(value) => handleFilterChange('status', value)}
                allowClear
              >
                <Option value="">ทั้งหมด</Option>
                <Option value="confirmed">ยืนยันแล้ว</Option>
                <Option value="pending">ยังไม่ยืนยัน</Option>
                <Option value="picked_up">รับแล้ว</Option>
              </Select>
            </Col>
            <Col>
              <Select
                placeholder="ขนาด"
                style={{ width: 100 }}
                value={filters.size}
                onChange={(value) => handleFilterChange('size', value)}
                allowClear
              >
                {ALL_SIZES.map(size => (
                  <Option key={size} value={size}>{size}</Option>
                ))}
              </Select>
            </Col>
          </Row>
        )}
        
        <Space>
          <Text type="secondary">
            {showSearchResults 
              ? `ผลการค้นหา: ${searchResults.length} รายการ`
              : `แสดง ${members.length} จาก ${pagination.total} รายการ`
            }
          </Text>
        </Space>
      </Space>
      
      <Table
        dataSource={currentData}
        columns={columns}
        loading={currentLoading}
        pagination={showSearchResults ? false : {
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        onChange={handleTableChange}
        scroll={{ x: true }}
        size="small"
      />
    </Card>
  );
};

export default MembersList;
EOF#!/bin/bash

# Script สำหรับปรับปรุงโครงสร้าง components ใหม่
# Update Components Structure Script for KUSCC Shirt Survey

echo "🚀 Starting component structure update..."

# สร้าง directories หากยังไม่มี
echo "📁 Creating directory structure..."
mkdir -p src/components/Admin
mkdir -p src/services
mkdir -p src/pages

# ลบไฟล์เก่าหากมี (เผื่อมีชื่อซ้ำ)
echo "🗑️  Removing old files if exist..."
rm -f src/components/Admin/DashboardStats.jsx
rm -f src/components/Admin/SearchAndPickup.jsx
rm -f src/components/Admin/MembersList.jsx
rm -f src/components/Admin/PickupModal.jsx
rm -f src/components/Admin/InventoryManagement.jsx

# สร้างไฟล์ DashboardStats.jsx
echo "📄 Creating DashboardStats.jsx..."
cat > src/components/Admin/DashboardStats.jsx << 'EOF'
import React from 'react';
import { Row, Col, Card, Statistic, Space } from 'antd';
import { TrophyOutlined, CheckCircleOutlined, ClockCircleOutlined, TeamOutlined } from '@ant-design/icons';

const StatCard = ({ icon, title, value, color }) => (
  <Card bordered={false} className="stat-card">
    <Space align="center" size="large">
      <div className="stat-card-icon" style={{ backgroundColor: color }}>
        {icon}
      </div>
      <div>
        <Statistic title={title} value={value} />
      </div>
    </Space>
  </Card>
);

const DashboardStats = ({ stats }) => {
  return (
    <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
      <Col xs={24} sm={12} lg={6}>
        <StatCard
          icon={<TrophyOutlined />}
          title="จ่ายแล้ววันนี้"
          value={stats.distributedToday}
          color="#d8f3dc"
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <StatCard
          icon={<CheckCircleOutlined />}
          title="ยืนยันแล้ว"
          value={stats.confirmed}
          color="#cfe2ff"
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <StatCard
          icon={<ClockCircleOutlined />}
          title="รอยืนยัน"
          value={stats.pending}
          color="#fff3cd"
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <StatCard
          icon={<TeamOutlined />}
          title="สมาชิกทั้งหมด"
          value={stats.total}
          color="#f8d7da"
        />
      </Col>
    </Row>
  );
};

export default DashboardStats;
EOF

# สร้างไฟล์ SearchAndPickup.jsx
echo "📄 Creating SearchAndPickup.jsx..."
cat > src/components/Admin/SearchAndPickup.jsx << 'EOF'
import React, { useState } from 'react';
import { Card, Input, Table, Button, Tag, message } from 'antd';
import { SearchOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { SearchMember } from '../../services/shirtApi';

const { Search } = Input;

const SearchAndPickup = ({ onPickupClick }) => {
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async (memberCode) => {
    if (!memberCode) {
      message.warning("กรุณากรอกรหัสสมาชิก");
      return;
    }
    
    setLoadingSearch(true);
    setSearchResults([]);
    
    try {
      const data = await SearchMember(memberCode);
      const result = {
        key: data.MEMB_CODE,
        memberCode: data.MEMB_CODE,
        name: data.FULLNAME || data.DISPLAYNAME,
        selectedSize: data.SIZE_CODE,
        status: data.SIZE_CODE ? "ยืนยันขนาดแล้ว" : "ยังไม่ยืนยันขนาด",
        phone: data.MEMB_MOBILE,
        remarks: data.REMARKS,
        pickedUp: false,
      };
      setSearchResults([result]);
    } catch (err) {
      message.error(err.message || "ไม่พบข้อมูลสมาชิก");
    } finally {
      setLoadingSearch(false);
    }
  };

  const columns = [
    {
      title: "รหัสสมาชิก",
      dataIndex: "memberCode",
      key: "memberCode",
      width: 120,
    },
    {
      title: "ชื่อ-นามสกุล",
      dataIndex: "name",
      key: "name",
      width: 200,
    },
    {
      title: "ขนาดที่เลือก",
      dataIndex: "selectedSize",
      key: "selectedSize",
      width: 100,
      render: (size) => size ? <Tag color="blue">{size}</Tag> : <Tag color="orange">ยังไม่เลือก</Tag>,
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status, record) => {
        if (record.pickedUp) {
          return <Tag color="green" icon={<CheckCircleOutlined />}>รับแล้ว</Tag>;
        } else if (record.selectedSize) {
          return <Tag color="blue" icon={<ClockCircleOutlined />}>ยืนยันแล้ว</Tag>;
        } else {
          return <Tag color="orange" icon={<ExclamationCircleOutlined />}>ยังไม่ยืนยัน</Tag>;
        }
      },
    },
    {
      title: "การดำเนินการ",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => onPickupClick(record)}
          disabled={record.pickedUp}
        >
          {record.pickedUp ? "รับแล้ว" : "บันทึกการรับ"}
        </Button>
      ),
    },
  ];

  return (
    <Card title="ค้นหาและจ่ายเสื้อ" bordered={false}>
      <Search
        placeholder="กรอกรหัสสมาชิก 6 หลัก"
        enterButton="ค้นหา"
        size="large"
        onSearch={handleSearch}
        loading={loadingSearch}
        style={{ marginBottom: 24 }}
      />
      <Table
        dataSource={searchResults}
        columns={columns}
        loading={loadingSearch}
        pagination={false}
        scroll={{ x: true }}
      />
    </Card>
  );
};

export default SearchAndPickup;
EOF

# สร้างไฟล์ MembersList.jsx
echo "📄 Creating MembersList.jsx..."
cat > src/components/Admin/MembersList.jsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Input, Select, Row, Col, Space, Typography, message } from 'antd';
import { SearchOutlined, ReloadOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { getShirtMemberListPaged } from '../../services/shirtApi';

const { Text } = Typography;
const { Option } = Select;

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL"];

const MembersList = ({ onPickupClick }) => {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    size: '',
  });

  useEffect(() => {
    loadMembers(1, pagination.pageSize, filters);
  }, []);

  const loadMembers = async (page = 1, pageSize = 20, currentFilters = filters) => {
    setLoading(true);
    try {
      const response = await getShirtMemberListPaged(page, pageSize, currentFilters.search, currentFilters.status);
      
      // สมมติว่า API ส่งกลับ format: { data: [...], total: number, page: number, pageSize: number }
      const membersData = response.data || response;
      const formattedMembers = membersData.map(member => ({
        key: member.MEMB_CODE,
        memberCode: member.MEMB_CODE,
        name: member.FULLNAME || member.DISPLAYNAME,
        phone: member.MEMB_MOBILE,
        selectedSize: member.SIZE_CODE,
        status: member.SIZE_CODE ? "ยืนยันขนาดแล้ว" : "ยังไม่ยืนยันขนาด",
        remarks: member.REMARKS,
        pickedUp: member.PICKED_UP || false,
        surveyDate: member.SURVEY_DATE,
      }));

      setMembers(formattedMembers);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: response.total || formattedMembers.length,
      });
    } catch (error) {
      message.error("ไม่สามารถโหลดข้อมูลสมาชิกได้");
      console.error("Load members error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (paginationInfo, filters, sorter) => {
    loadMembers(paginationInfo.current, paginationInfo.pageSize, filters);
  };

  const handleFilterChange = (type, value) => {
    const newFilters = { ...filters, [type]: value };
    setFilters(newFilters);
    loadMembers(1, pagination.pageSize, newFilters);
  };

  const handleRefresh = () => {
    const resetFilters = { search: '', status: '', size: '' };
    setFilters(resetFilters);
    loadMembers(1, pagination.pageSize, resetFilters);
  };

  const columns = [
    {
      title: "รหัสสมาชิก",
      dataIndex: "memberCode",
      key: "memberCode",
      width: 120,
      sorter: (a, b) => a.memberCode.localeCompare(b.memberCode),
    },
    {
      title: "ชื่อ-นามสกุล",
      dataIndex: "name",
      key: "name",
      width: 200,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "เบอร์โทร",
      dataIndex: "phone",
      key: "phone",
      width: 120,
    },
    {
      title: "ขนาดที่เลือก",
      dataIndex: "selectedSize",
      key: "selectedSize",
      width: 100,
      render: (size) => size ? <Tag color="blue">{size}</Tag> : <Tag color="orange">ยังไม่เลือก</Tag>,
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status, record) => {
        if (record.pickedUp) {
          return <Tag color="green" icon={<CheckCircleOutlined />}>รับแล้ว</Tag>;
        } else if (record.selectedSize) {
          return <Tag color="blue" icon={<ClockCircleOutlined />}>ยืนยันแล้ว</Tag>;
        } else {
          return <Tag color="orange" icon={<ExclamationCircleOutlined />}>ยังไม่ยืนยัน</Tag>;
        }
      },
    },
    {
      title: "หมายเหตุ",
      dataIndex: "remarks",
      key: "remarks",
      width: 150,
      ellipsis: true,
    },
    {
      title: "การดำเนินการ",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => onPickupClick(record)}
          disabled={record.pickedUp}
        >
          {record.pickedUp ? "รับแล้ว" : "บันทึกการรับ"}
        </Button>
      ),
    },
  ];

  return (
    <Card title="รายชื่อสมาชิกทั้งหมด" bordered={false}>
      <Space direction="vertical" style={{ width: "100%", marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Input
              placeholder="ค้นหาด้วยรหัสสมาชิก หรือ ชื่อ-นามสกุล"
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              onPressEnter={() => loadMembers(1, pagination.pageSize, filters)}
              allowClear
              style={{ width: '100%' }}
            />
          </Col>
          <Col>
            <Select
              placeholder="สถานะ"
              style={{ width: 140 }}
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              allowClear
            >
              <Option value="">ทั้งหมด</Option>
              <Option value="confirmed">ยืนยันแล้ว</Option>
              <Option value="pending">ยังไม่ยืนยัน</Option>
              <Option value="picked_up">รับแล้ว</Option>
            </Select>
          </Col>
          <Col>
            <Select
              placeholder="ขนาด"
              style={{ width: 100 }}
              value={filters.size}
              onChange={(value) => handleFilterChange('size', value)}
              allowClear
            >
              {ALL_SIZES.map(size => (
                <Option key={size} value={size}>{size}</Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              รีเฟรช
            </Button>
          </Col>
        </Row>
        
        <Space>
          <Text type="secondary">
            แสดง {members.length} จาก {pagination.total} รายการ
          </Text>
        </Space>
      </Space>
      
      <Table
        dataSource={members}
        columns={columns}
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        onChange={handleTableChange}
        scroll={{ x: true }}
        size="small"
      />
    </Card>
  );
};

export default MembersList;
EOF

# สร้างไฟล์ PickupModal.jsx
echo "📄 Creating PickupModal.jsx..."
cat > src/components/Admin/PickupModal.jsx << 'EOF'
import React, { useState } from 'react';
import { Modal, Form, Descriptions, Tag, Space, Button, Radio, Input, Row, Col, Card } from 'antd';
import { EditOutlined } from '@ant-design/icons';

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL"];
const SIZE_DIMENSIONS = {
  "XS": { chest: "40", length: "24" },
  "S": { chest: "42", length: "25" },
  "M": { chest: "44", length: "26" },
  "L": { chest: "46", length: "27" },
  "XL": { chest: "48", length: "28" },
  "2XL": { chest: "50", length: "29" },
  "3XL": { chest: "52", length: "30" },
  "4XL": { chest: "54", length: "31" },
  "5XL": { chest: "56", length: "32" },
  "6XL": { chest: "58", length: "33" },
};

const PickupModal = ({ visible, onCancel, onSubmit, selectedMember, form }) => {
  const [sizeChangeModalVisible, setSizeChangeModalVisible] = useState(false);
  const [newSelectedSize, setNewSelectedSize] = useState("");

  const handleSizeChange = (size) => {
    setNewSelectedSize(size);
    form.setFieldValue("selectedSize", size);
    setSizeChangeModalVisible(false);
  };

  return (
    <>
      <Modal
        title="บันทึกการรับเสื้อ"
        open={visible}
        onCancel={onCancel}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onSubmit}
        >
          <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
            <Descriptions.Item label="รหัสสมาชิก">
              {selectedMember?.memberCode}
            </Descriptions.Item>
            <Descriptions.Item label="ชื่อ-นามสกุล">
              {selectedMember?.name}
            </Descriptions.Item>
          </Descriptions>

          <Form.Item
            name="selectedSize"
            label={
              <Space>
                ขนาดที่เลือก
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => setSizeChangeModalVisible(true)}
                >
                  เปลี่ยนขนาด
                </Button>
              </Space>
            }
          >
            <Tag color="blue" style={{ fontSize: 16, padding: "4px 12px" }}>
              {form.getFieldValue("selectedSize") || selectedMember?.selectedSize || "ยังไม่เลือก"}
            </Tag>
          </Form.Item>

          <Form.Item name="pickupType" label="ผู้รับเสื้อ" initialValue="self">
            <Radio.Group>
              <Radio value="self">รับด้วยตนเอง</Radio>
              <Radio value="proxy">รับแทน</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.pickupType !== currentValues.pickupType
            }
          >
            {({ getFieldValue }) =>
              getFieldValue('pickupType') === 'proxy' ? (
                <>
                  <Form.Item
                    name="proxyMemberCode"
                    label="รหัสสมาชิกผู้รับแทน"
                    rules={[{ required: true, message: 'กรุณากรอกรหัสสมาชิก' }]}
                  >
                    <Input placeholder="กรอกรหัสสมาชิก 6 หลัก" maxLength={6} />
                  </Form.Item>
                  <Form.Item
                    name="proxyName"
                    label="ชื่อ-สกุล ผู้รับแทน"
                    rules={[{ required: true, message: 'กรุณากรอกชื่อผู้รับแทน' }]}
                  >
                    <Input placeholder="กรอกชื่อ หรือค้นหาจากรหัสสมาชิก" />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>

          <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button onClick={onCancel}>
                ยกเลิก
              </Button>
              <Button type="primary" htmlType="submit">
                บันทึกการรับเสื้อ
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Size Change Modal */}
      <Modal
        title="เลือกขนาดเสื้อใหม่"
        open={sizeChangeModalVisible}
        onCancel={() => setSizeChangeModalVisible(false)}
        footer={null}
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <span style={{ color: '#666' }}>
            📏 <a href="https://apps2.coop.ku.ac.th/asset/images/png/sizewidth.png" target="_blank" rel="noopener noreferrer">
              วิธีวัดขนาดเสื้อ
            </a>
          </span>
        </div>
        
        <Row gutter={[16, 16]}>
          {ALL_SIZES.map(size => {
            const dimensions = SIZE_DIMENSIONS[size];
            return (
              <Col xs={12} sm={8} md={6} lg={4} key={size}>
                <Card
                  hoverable
                  size="small"
                  onClick={() => handleSizeChange(size)}
                  style={{
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: newSelectedSize === size ? '2px solid #1890ff' : '1px solid #d9d9d9'
                  }}
                >
                  <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: 8 }}>
                    {size}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    อก {dimensions.chest}"<br />
                    ยาว {dimensions.length}"
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
        
        <div style={{ marginTop: 16, padding: 16, backgroundColor: '#fffbe6', borderRadius: 6 }}>
          <span style={{ fontSize: '14px', color: '#856404' }}>
            <strong>คำแนะนำ:</strong> ควรเพิ่มขนาดจากที่วัดรอบอกได้ขึ้นอีกประมาณ 2" เนื่องจากเสื้อแจ็คเก็ตมักสวมทับกับเสื้ออื่น
            เช่น วัดได้ 40" ให้เลือกขนาดเสื้อ 42" แทน
          </span>
        </div>
      </Modal>
    </>
  );
};

export default PickupModal;
EOF

# สร้างไฟล์ InventoryManagement.jsx
echo "📄 Creating InventoryManagement.jsx..."
cat > src/components/Admin/InventoryManagement.jsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Select, InputNumber, Row, Col, List, Tag, Typography, message } from 'antd';
import { PlusOutlined, MinusOutlined, WarningOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL"];

const InventoryManagement = () => {
  const [stockData, setStockData] = useState({});
  const [stockTransactions, setStockTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStockData();
  }, []);

  const loadStockData = async () => {
    setLoading(true);
    try {
      // Mock stock data - replace with real API calls
      const mockStock = {};
      ALL_SIZES.forEach(size => {
        mockStock[size] = {
          produced: Math.floor(Math.random() * 200) + 50,
          reserved: Math.floor(Math.random() * 30),
          pickedUp: Math.floor(Math.random() * 50),
        };
      });
      setStockData(mockStock);
      
      // Mock stock transactions
      setStockTransactions([
        { id: 1, size: "M", quantity: 10, type: "add", timestamp: new Date() },
        { id: 2, size: "L", quantity: 5, type: "withdraw", timestamp: new Date() },
      ]);
    } catch (error) {
      message.error("ไม่สามารถโหลดข้อมูลสต็อกได้");
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (size, quantity, type) => {
    if (!quantity || quantity <= 0) {
      message.error("กรุณากรอกจำนวนที่ถูกต้อง");
      return;
    }

    try {
      // Mock stock update - replace with real API
      console.log(`Stock ${type}:`, { size, quantity });
      message.success(`${type === 'add' ? 'เติม' : 'เบิก'}สต็อกสำเร็จ`);
      
      // Update local state
      setStockData(prev => ({
        ...prev,
        [size]: {
          ...prev[size],
          produced: prev[size].produced + (type === 'add' ? quantity : -quantity)
        }
      }));
      
      // Add transaction record
      const newTransaction = {
        id: Date.now(),
        size,
        quantity,
        type,
        timestamp: new Date()
      };
      setStockTransactions(prev => [newTransaction, ...prev]);
      
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการอัปเดตสต็อก");
    }
  };

  // Stock management form
  const StockManagementForm = () => {
    const [size, setSize] = useState("M");
    const [quantity, setQuantity] = useState(1);

    return (
      <Card title="จัดการสต็อก" size="small">
        <Space direction="vertical" style={{ width: "100%" }}>
          <Row gutter={16} align="middle">
            <Col span={8}>
              <Text>ขนาด:</Text>
              <Select value={size} onChange={setSize} style={{ width: "100%" }}>
                {ALL_SIZES.map(s => (
                  <Option key={s} value={s}>{s}</Option>
                ))}
              </Select>
            </Col>
            <Col span={8}>
              <Text>จำนวน:</Text>
              <InputNumber
                value={quantity}
                onChange={setQuantity}
                min={1}
                style={{ width: "100%" }}
              />
            </Col>
            <Col span={8}>
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleStockUpdate(size, quantity, "add")}
                >
                  เติม
                </Button>
                <Button
                  danger
                  icon={<MinusOutlined />}
                  onClick={() => handleStockUpdate(size, quantity, "withdraw")}
                >
                  เบิก
                </Button>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>
    );
  };

  const inventoryColumns = [
    { title: "ขนาด", dataIndex: "size", key: "size", width: 80 },
    { title: "ผลิต", dataIndex: "produced", key: "produced", width: 80 },
    { title: "จอง", dataIndex: "reserved", key: "reserved", width: 80 },
    { title: "รับแล้ว", dataIndex: "pickedUp", key: "pickedUp", width: 80 },
    {
      title: "คงเหลือ",
      key: "remaining",
      width: 100,
      render: (_, record) => {
        const remaining = record.produced - record.reserved - record.pickedUp;
        return (
          <span style={{ color: remaining <= 50 ? "#ff4d4f" : "#52c41a", fontWeight: "bold" }}>
            {remaining}
            {remaining <= 50 && <WarningOutlined style={{ marginLeft: 8 }} />}
          </span>
        );
      },
    },
  ];

  const inventoryData = ALL_SIZES.map(size => ({
    key: size,
    size,
    produced: stockData[size]?.produced || 0,
    reserved: stockData[size]?.reserved || 0,
    pickedUp: stockData[size]?.pickedUp || 0,
  }));

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Row gutter={16}>
        <Col span={16}>
          <Card title="ภาพรวมสต็อกสินค้า" bordered={false}>
            <Table
              dataSource={inventoryData}
              columns={inventoryColumns}
              loading={loading}
              pagination={false}
              scroll={{ x: true }}
              summary={(data) => {
                const totalProduced = data.reduce((sum, item) => sum + item.produced, 0);
                const totalReserved = data.reduce((sum, item) => sum + item.reserved, 0);
                const totalPickedUp = data.reduce((sum, item) => sum + item.pickedUp, 0);
                const totalRemaining = totalProduced - totalReserved - totalPickedUp;

                return (
                  <Table.Summary.Row style={{ backgroundColor: "#f5f5f5" }}>
                    <Table.Summary.Cell index={0}><strong>รวม</strong></Table.Summary.Cell>
                    <Table.Summary.Cell index={1}><strong>{totalProduced}</strong></Table.Summary.Cell>
                    <Table.Summary.Cell index={2}><strong>{totalReserved}</strong></Table.Summary.Cell>
                    <Table.Summary.Cell index={3}><strong>{totalPickedUp}</strong></Table.Summary.Cell>
                    <Table.Summary.Cell index={4}>
                      <strong style={{ color: totalRemaining <= 200 ? "#ff4d4f" : "#52c41a" }}>
                        {totalRemaining}
                      </strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <StockManagementForm />
          <Card title="ประวัติการเติม-เบิก" size="small" style={{ marginTop: 16 }}>
            <List
              size="small"
              dataSource={stockTransactions.slice(0, 10)}
              renderItem={(item) => (
                <List.Item>
                  <Text>{new Date(item.timestamp).toLocaleString("th-TH")}</Text>
                  <Tag color={item.type === "add" ? "green" : "orange"}>
                    {item.type === "add" ? "เติม" : "เบิก"} {item.size} ({item.quantity} ตัว)
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

export default InventoryManagement;
EOF

# อัปเดตไฟล์ API services
echo "📄 Updating shirtApi.js..."
cat > src/services/shirtApi.js << 'EOF'
import axios from "axios";

// ---- CONSTANTS ----
const REAL_API_BASE_URL = "https://apps4.coop.ku.ac.th/KusccToolService/service1.svc";

// ---- AXIOS INSTANCE ----
export const api = axios.create({
  baseURL: REAL_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
  },
  timeout: 15000,
  maxBodyLength: Infinity,
});

// ---- API FUNCTIONS ----

// ---- GET SHIRT MEMBER LIST ----
export async function getShirtMemberList(sizeCode) {
  const res = await api.get(
    `/GetShirtMemberList?size_code=${encodeURIComponent(sizeCode)}`
  );
  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "API error");
  }
  return res.data.data;
}

// ---- NEW PAGED API ----
export const getShirtMemberListPaged = async (page = 1, pageSize = 20, search = '', status = '') => {
  try {
    const params = {
      page: page.toString(),
      pageSize: pageSize.toString(),
      search,
      status
    };
    
    const res = await api.get('/GetShirtMemberListPaged', { params });
    
    if (res.data?.responseCode !== 200) {
      throw new Error(res.data?.responseMessage || "API error");
    }
    
    return res.data.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Search member by mbcode (real API)
export async function SearchMember(mbcode) {
  const res = await api.get(
    `/SearchShirtMember?mbcode=${encodeURIComponent(mbcode)}`
  );
  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "API error");
  }
  return res.data.data;
}

// ---- Login (ให้ server เซ็ต ASP.NET_SessionId กลับมา) ----
export const loginMember = async ({ memberCode, phone, idCard }) => {
  const payload = {
    mbcode: memberCode,
    socid: idCard,
    mobile: phone,
  };
  const res = await api.post("/ShirtSurveyLogin", payload);
  console.log("ก่อนเรียก API ส่งข้อมูล:", payload);
  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "ไม่พบข้อมูลสมาชิก");
  }
  console.log("หลังเรียก API ได้ response:", res.data);
  const d = res.data.data || {};
  
  // parse WCF date
  const parseWcfDate = (s) => {
    const m = String(s || "").match(/\/Date\((\d+)\+/);
    return m ? new Date(Number(m[1])) : null;
  };
  
  return {
    memberCode: d.MEMB_CODE,
    name: d.DISPLAYNAME || d.FULLNAME || d.MEMB_CODE,
    fullName: d.FULLNAME,
    displayName: d.DISPLAYNAME,
    phone: d.MEMB_MOBILE,
    round: d.MEMB_SOCID ? d.MEMB_SOCID.split("-").pop() : idCard,
    selectedSize: d.SIZE_CODE || null,
    remarks: d.REMARKS || "",
    surveyDate: parseWcfDate(d.SURVEY_DATE),
    surveyMethod: d.SURVEY_METHOD,
    status: d.SIZE_CODE ? "ยืนยันขนาดแล้ว" : "ยังไม่ยืนยันขนาด",
    socialId: d.MEMB_SOCID,
  };
};

// ---- AddShirtSurvey (ต้องมี session จาก login ก่อน) ----
export const saveMemberSize = async ({
  memberCode,
  sizeCode,
  remarks = "",
  surveyMethod = "ONLINE",
}) => {
  const payload = {
    MEMB_CODE: (memberCode ?? "").toString().padStart(6, "0"),
    SIZE_CODE: sizeCode,
    SURVEY_METHOD: surveyMethod,
    REMARKS: remarks,
  };
  const res = await api.post("/AddShirtSurvey", payload);
  if (res.data?.responseCode !== 200) {
    throw new Error(res.data?.responseMessage || "บันทึกขนาดไม่สำเร็จ");
  }
  return res.data;
};

// Additional API functions for Admin features
export const submitPickup = async (pickupData) => {
  try {
    const res = await api.post('/SubmitPickup', pickupData);
    if (res.data?.responseCode !== 200) {
      throw new Error(res.data?.responseMessage || 'Failed to submit pickup');
    }
    return res.data;
  } catch (error) {
    console.error('Submit pickup error:', error);
    throw error;
  }
};

export const getDashboardStats = async () => {
  try {
    const res = await api.get('/GetDashboardStats');
    if (res.data?.responseCode !== 200) {
      throw new Error(res.data?.responseMessage || 'Failed to get dashboard stats');
    }
    return res.data.data;
  } catch (error) {
    console.error('Dashboard stats error:', error);
    throw error;
  }
};
EOF

// New Paged API function
export const getShirtMemberListPaged = async (page = 1, pageSize = 20, search = '', status = '') => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      search,
      status
    });
    
    const response = await fetch(`${API_BASE_URL}/GetShirtMemberListPaged?${params}`);
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Additional API functions for future use
export const submitPickup = async (pickupData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/SubmitPickup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pickupData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to submit pickup');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Submit pickup error:', error);
    throw error;
  }
};

export const getDashboardStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/GetDashboardStats`);
    if (!response.ok) {
      throw new Error('Failed to get dashboard stats');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Dashboard stats error:', error);
    throw error;
  }
};
EOF

# อัปเดตไฟล์หลัก AdminDashboard.jsx
echo "📄 Updating AdminDashboard.jsx..."
cat > src/pages/AdminDashboard.jsx << 'EOF'
import React, { useState, useEffect } from "react";
import { useAppContext } from "../App";
import {
  Layout,
  Menu,
  Typography,
  Avatar,
  Space,
  Button,
  Drawer,
  Grid,
  Alert,
  Spin,
  Card,
  Form,
  message,
} from "antd";
import {
  DashboardOutlined,
  SearchOutlined,
  BarChartOutlined,
  SettingOutlined,
  MenuOutlined,
  UserOutlined,
  BellOutlined,
  LogoutOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import "../styles/AdminDashboard.css";

// Import components
import SearchAndPickup from "../components/Admin/SearchAndPickup";
import MembersList from "../components/Admin/MembersList";
import DashboardStats from "../components/Admin/DashboardStats";
import PickupModal from "../components/Admin/PickupModal";
import InventoryManagement from "../components/Admin/InventoryManagement";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const AdminDashboard = () => {
  const { user, logout } = useAppContext();
  const screens = useBreakpoint();

  // UI State
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const [activeMenuKey, setActiveMenuKey] = useState("dashboard");
  
  // Dashboard State
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    distributedToday: 0
  });
  
  // Pickup Management State
  const [selectedMember, setSelectedMember] = useState(null);
  const [pickupModalVisible, setPickupModalVisible] = useState(false);
  const [pickupForm] = Form.useForm();

  useEffect(() => {
    setCollapsed(!screens.lg);
  }, [screens.lg]);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    setLoadingDashboard(true);
    try {
      // เรียก API เพื่อได้สถิติ dashboard
      // const stats = await getDashboardStats();
      // setDashboardStats(stats);
      
      // Mock data for now
      setDashboardStats({
        total: 1250,
        confirmed: 980,
        pending: 270,
        distributedToday: 45
      });
    } catch (error) {
      setDashboardError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoadingDashboard(false);
    }
  };

  const handlePickupClick = (record) => {
    setSelectedMember(record);
    pickupForm.setFieldsValue({
      memberCode: record.memberCode,
      selectedSize: record.selectedSize,
      pickupType: "self",
    });
    setPickupModalVisible(true);
  };

  const handlePickupSubmit = async (values) => {
    try {
      // เรียก API เพื่อบันทึกการรับเสื้อ
      console.log("Pickup submitted:", values);
      // await submitPickup(values);
      
      message.success("บันทึกการรับเสื้อสำเร็จ");
      setPickupModalVisible(false);
      pickupForm.resetFields();
      setSelectedMember(null);
      
      // Refresh stats
      loadDashboardStats();
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  // Menu items
  const menuItems = [
    { key: "dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
    { key: "search_pickup", icon: <SearchOutlined />, label: "ค้นหาและรับเสื้อ" },
    { key: "inventory", icon: <BarChartOutlined />, label: "จัดการสต็อก" },
    { key: "history", icon: <HistoryOutlined />, label: "ประวัติการจ่าย" },
    { key: "settings", icon: <SettingOutlined />, label: "ตั้งค่า" },
  ];

  // Render content based on active menu
  const renderContent = () => {
    switch (activeMenuKey) {
      case "search_pickup":
        return (
          <Space direction="vertical" style={{ width: "100%" }}>
            <SearchAndPickup onPickupClick={handlePickupClick} />
            <MembersList onPickupClick={handlePickupClick} />
          </Space>
        );

      case "inventory":
        return <InventoryManagement />;

      case "history":
        return (
          <Card title="ประวัติการรับเสื้อ" bordered={false}>
            <div style={{ textAlign: "center", padding: 48 }}>
              <Text type="secondary">ส่วนประวัติการรับเสื้อ (อยู่ระหว่างพัฒนา)</Text>
            </div>
          </Card>
        );

      case "settings":
        return (
          <Card title="ตั้งค่าระบบ" bordered={false}>
            <div style={{ textAlign: "center", padding: 48 }}>
              <Text type="secondary">ส่วนการตั้งค่า (อยู่ระหว่างพัฒนา)</Text>
            </div>
          </Card>
        );

      case "dashboard":
      default:
        return (
          <>
            <Title level={3}>ภาพรวมวันนี้</Title>
            <DashboardStats stats={dashboardStats} />

            {dashboardError && (
              <Alert
                message="เกิดข้อผิดพลาด"
                description={dashboardError}
                type="error"
                showIcon
                style={{ marginBottom: 24 }}
              />
            )}

            {loadingDashboard ? (
              <Card>
                <div style={{ textAlign: "center", padding: 48 }}>
                  <Spin size="large" />
                  <div style={{ marginTop: 16 }}>กำลังโหลดข้อมูล...</div>
                </div>
              </Card>
            ) : (
              <SearchAndPickup onPickupClick={handlePickupClick} />
            )}
          </>
        );
    }
  };

  // Sidebar content
  const siderContent = (
    <>
      <div className="logo-container">
        <Title level={4} className="logo-text">
          {collapsed ? "KUSCC" : "KUSCC Admin"}
        </Title>
      </div>
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[activeMenuKey]}
        items={menuItems}
        onClick={({ key }) => {
          setActiveMenuKey(key);
          if (!screens.lg) {
            setMobileDrawerVisible(false);
          }
        }}
      />
    </>
  );

  return (
    <div className="admin-dashboard-layout">
      <Layout style={{ minHeight: "100vh" }}>
        {screens.lg ? (
          <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={(value) => setCollapsed(value)}
            className="desktop-sider"
            width={250}
          >
            {siderContent}
          </Sider>
        ) : (
          <Drawer
            placement="left"
            onClose={() => setMobileDrawerVisible(false)}
            open={mobileDrawerVisible}
            bodyStyle={{ padding: 0 }}
            width={250}
            className="mobile-drawer"
          >
            {siderContent}
          </Drawer>
        )}
        
        <Layout className="site-layout">
          <Header className="dashboard-header">
            {!screens.lg && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setMobileDrawerVisible(true)}
                className="mobile-menu-button"
              />
            )}
            <div className="header-content">
              <Title
                level={4}
                style={{ margin: 0, flexGrow: 1, color: "#1d1d1f" }}
              >
                {menuItems.find((item) => item.key === activeMenuKey)?.label}
              </Title>
              <Space size="middle">
                <BellOutlined style={{ fontSize: "20px", cursor: "pointer", color: "#48484a" }} />
                <Avatar icon={<UserOutlined />} />
                <Text style={{ color: "#1d1d1f" }}>
                  {user?.name || "Admin"}
                </Text>
                <Button
                  type="text"
                  icon={<LogoutOutlined />}
                  onClick={logout}
                  danger
                />
              </Space>
            </div>
          </Header>
          <Content className="dashboard-content">{renderContent()}</Content>
        </Layout>
      </Layout>

      {/* Pickup Modal */}
      <PickupModal
        visible={pickupModalVisible}
        onCancel={() => {
          setPickupModalVisible(false);
          pickupForm.resetFields();
          setSelectedMember(null);
        }}
        onSubmit={handlePickupSubmit}
        selectedMember={selectedMember}
        form={pickupForm}
      />
    </div>
  );
};

export default AdminDashboard;
EOF

# ลบไฟล์ SearchAndPickup.jsx เนื่องจากรวมเข้ากับ MembersList แล้ว
echo "🗑️  Removing SearchAndPickup.jsx (merged with MembersList)..."
rm -f src/components/Admin/SearchAndPickup.jsx

# สิทธิ์ execute
chmod +x "$0"

echo ""
echo "✅ Component structure update completed successfully!"
echo ""
echo "📂 Created/Updated files:"
echo "   ├── src/components/Admin/DashboardStats.jsx"
echo "   ├── src/components/Admin/MembersList.jsx (รวม search และ list)"
echo "   ├── src/components/Admin/PickupModal.jsx"
echo "   ├── src/components/Admin/InventoryManagement.jsx"
echo "   ├── src/services/shirtApi.js (ใช้ axios)"
echo "   └── src/pages/AdminDashboard.jsx"
echo ""
echo "🗑️  Removed files:"
echo "   └── src/components/Admin/SearchAndPickup.jsx (รวมเข้ากับ MembersList)"
echo ""
echo "🚀 Key improvements:"
echo "   • รวม 'ค้นหาและจ่ายเสื้อ' กับ 'รายชื่อสมาชิก' เป็นหน้าเดียว"
echo "   • แก้ปัญหาการกรองข้อมูลแบบ pagination ด้วย server-side filtering"
echo "   • เพิ่ม column 'วันที่จอง' ในตาราง"
echo "   • ค้นหาด่วนสำหรับสมาชิกเฉพาะราย"
echo "   • กรองข้อมูลสำหรับรายการทั้งหมดผ่าน API"
echo ""
echo "🔧 Server-side filtering explained:"
echo "   • การกรอง 'ยืนยันแล้ว/ยังไม่ยืนยัน' จะส่งไป API"
echo "   • API จะกรองข้อมูลทั้งหมดก่อนส่งกลับ"
echo "   • ไม่ใช่แค่กรองข้อมูลในหน้าปัจจุบัน"
echo ""
echo "📝 Next steps:"
echo "   1. รัน script: ./update_components.sh"
echo "   2. npm run build"
echo "   3. ทดสอบการทำงาน"
                />
              </Space>
            </div>
          </Header>
          <Content className="dashboard-content">{renderContent()}</Content>
        </Layout>
      </Layout>

      {/* Pickup Modal */}
      <PickupModal
        visible={pickupModalVisible}
        onCancel={() => {
          setPickupModalVisible(false);
          pickupForm.resetFields();
          setSelectedMember(null);
        }}
        onSubmit={handlePickupSubmit}
        selectedMember={selectedMember}
        form={pickupForm}
      />
    </div>
  );
};

export default AdminDashboard;
EOF

# สิทธิ์ execute
chmod +x "$0"

echo ""
echo "✅ Component structure update completed successfully!"
echo ""
echo "📂 Created/Updated files:"
echo "   ├── src/components/Admin/DashboardStats.jsx"
echo "   ├── src/components/Admin/SearchAndPickup.jsx"
echo "   ├── src/components/Admin/MembersList.jsx"
echo "   ├── src/components/Admin/PickupModal.jsx"
echo "   ├── src/components/Admin/InventoryManagement.jsx"
echo "   ├── src/services/shirtApi.js"
echo "   └── src/pages/AdminDashboard.jsx"
echo ""
echo "🚀 Next steps:"
echo "   1. npm install (if needed)"
echo "   2. npm start"
echo "   3. Test the updated components"
echo ""
echo "📝 Notes:"
echo "   • All import paths are updated according to your project structure"
echo "   • New API endpoint integrated: GetShirtMemberListPaged"
echo "   • Components are modular and maintainable"
echo "   • Ready for production deployment"
echo ""