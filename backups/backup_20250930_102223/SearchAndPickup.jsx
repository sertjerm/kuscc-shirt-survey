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
