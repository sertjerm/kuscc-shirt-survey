import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Input, Select, Row, Col, Space, Typography, message } from 'antd';
import { SearchOutlined, ReloadOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { getShirtMemberListPaged } from '../../services/shirtApi';

const { Text } = Typography;
const { Option } = Select;
const { Search } = Input;

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

  const formatThaiDate = (dateString) => {
    try {
      if (dateString && dateString.includes('/Date(')) {
        const match = dateString.match(/\/Date\((\d+)\+/);
        if (match) {
          const timestamp = parseInt(match[1]);
          return new Date(timestamp).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        }
      }
      if (dateString && dateString !== '-') {
        return new Date(dateString).toLocaleDateString('th-TH', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      }
      return '-';
    } catch (error) {
      return '-';
    }
  };

  const loadMembers = async (page = 1, pageSize = 20, currentFilters = filters) => {
    setLoading(true);
    try {
      const response = await getShirtMemberListPaged(
        page, 
        pageSize, 
        currentFilters.search || '', 
        currentFilters.status || ''
      );
      
      const membersData = response.data || response;
      const formattedMembers = Array.isArray(membersData) ? membersData.map(member => ({
        key: member.MEMB_CODE,
        memberCode: member.MEMB_CODE,
        name: member.FULLNAME || member.DISPLAYNAME,
        selectedSize: member.SIZE_CODE,
        status: member.SIZE_CODE ? "ยืนยันขนาดแล้ว" : "ยังไม่ยืนยันขนาด",
        remarks: member.REMARKS,
        pickedUp: member.PICKED_UP || false,
        surveyDate: member.SURVEY_DATE ? formatThaiDate(member.SURVEY_DATE) : '-',
        surveyMethod: member.SURVEY_METHOD,
      })) : [];

      let filteredMembers = formattedMembers;
      if (currentFilters.size) {
        filteredMembers = formattedMembers.filter(member => 
          member.selectedSize === currentFilters.size
        );
      }

      setMembers(filteredMembers);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: response.total || filteredMembers.length,
      });
    } catch (error) {
      message.error("ไม่สามารถโหลดข้อมูลสมาชิกได้");
      console.error("Load members error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (paginationInfo, tableFilters, sorter) => {
    const newFilters = {
      ...filters,
      status: getServerStatusFilter(tableFilters.status),
      size: tableFilters.selectedSize && tableFilters.selectedSize[0] ? tableFilters.selectedSize[0] : '',
    };
    
    setFilters(newFilters);
    loadMembers(paginationInfo.current, paginationInfo.pageSize, newFilters);
  };

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
      width: 220,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "ขนาดที่เลือก",
      dataIndex: "selectedSize",
      key: "selectedSize",
      width: 120,
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
        return new Date(a.surveyDate.split('/').reverse().join('-')) - new Date(b.surveyDate.split('/').reverse().join('-'));
      },
      render: (date) => date === '-' ? <Text type="secondary">-</Text> : <Text>{date}</Text>,
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      width: 140,
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
      render: (text) => text || <Text type="secondary">-</Text>,
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
    <Card title="ค้นหาและรับเสื้อ - รายชื่อสมาชิกทั้งหมด" bordered={false}>
      <Space direction="vertical" style={{ width: "100%", marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Search
              placeholder="ค้นหาด้วยรหัสสมาชิก หรือ ชื่อ-นามสกุล"
              enterButton="ค้นหา"
              size="large"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              onSearch={(value) => handleFilterChange('search', value)}
              allowClear
              onClear={() => handleFilterChange('search', '')}
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