import React, { useMemo, useState } from "react";
import moment from "moment";
import { Button, Card, Col, DatePicker, Input, Row, Select, Table } from "antd";
import { DownloadOutlined, EyeOutlined, ReloadOutlined } from "@ant-design/icons";
import { DATE_FORMAT, PERMIT_STATUSES, PERMIT_TYPES } from "constants/DashboardConstant";
import { useRole } from "context/RoleContext";
import { formatDate, formatNumber } from "utils/dateUtils";
import StatusTag from "./StatusTag";

const { RangePicker } = DatePicker;

const CSV_COLUMNS = [
  ["Ack No", "ackno"],
  ["Permit No", "permitno"],
  ["Application Date", "appldate"],
  ["Type", "permittype"],
  ["Party", "party"],
  ["Location", "locname"],
  ["Taluka", "taluka"],
  ["Ore Source", "oresource"],
  ["Quantity (MT)", "propqnty"],
  ["Mineral Details", "mineraldetail"],
  ["Valid Upto", "validupto"],
  ["Status", "status"],
];

/** Same behaviour as the portal's CSV button: blanks become "N/A". */
function downloadCsv(rows, asOnDate) {
  const cell = (value) => {
    const text = value === null || value === undefined || value === "" ? "N/A" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [
    CSV_COLUMNS.map(([title]) => title).join(","),
    ...rows.map((row) =>
      CSV_COLUMNS.map(([, key]) => cell(key === "appldate" || key === "validupto" ? (row[key] ? formatDate(row[key]) : "") : row[key])).join(",")
    ),
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `Permit_Applications_${asOnDate.format("DDMMMYYYY")}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

const PermitTable = ({ permits, loading, asOnDate, status, onStatusChange, selectedKey, onOpen }) => {
  const { isParty } = useRole();
  const [search, setSearch] = useState("");
  const [type, setType] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return permits.filter((permit) => {
      if (status && permit.status !== status) return false;
      if (type && permit.permittype !== type) return false;
      if (dateRange) {
        const appl = moment(permit.appldate);
        if (appl.isBefore(dateRange[0], "day") || appl.isAfter(dateRange[1], "day")) return false;
      }
      if (query) {
        const haystack = `${permit.ackno} ${permit.permitno} ${permit.party} ${permit.locname} ${permit.taluka}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [permits, status, type, dateRange, search]);

  const reset = () => {
    setSearch("");
    setType(null);
    setDateRange(null);
    onStatusChange(null);
  };

  const columns = [
    {
      title: "Ack No",
      dataIndex: "ackno",
      sorter: (a, b) => a.ackno.localeCompare(b.ackno),
      render: (value, record) => (
        <Button type="link" className="link-cell" onClick={() => onOpen(record)}>
          {value}
        </Button>
      ),
    },
    { title: "Permit No", dataIndex: "permitno", render: (value) => value || "N/A" },
    {
      title: "Application Date",
      dataIndex: "appldate",
      defaultSortOrder: "descend",
      sorter: (a, b) => a.appldate.localeCompare(b.appldate),
      render: formatDate,
    },
    { title: "Type", dataIndex: "permittype" },
    ...(isParty ? [] : [{ title: "Party", dataIndex: "party" }]),
    {
      title: "Location",
      dataIndex: "locname",
      render: (value, record) => (
        <>
          <div>{value}</div>
          <div className="cell-subtext">{record.taluka}</div>
        </>
      ),
    },
    { title: "Ore Source", dataIndex: "oresource" },
    {
      title: "Quantity (MT)",
      dataIndex: "propqnty",
      align: "right",
      sorter: (a, b) => a.propqnty - b.propqnty,
      render: formatNumber,
    },
    { title: "Mineral Details", dataIndex: "mineraldetail" },
    { title: "Valid Upto", dataIndex: "validupto", render: formatDate },
    { title: "Status", dataIndex: "status", render: (value) => <StatusTag status={value} /> },
    {
      title: "Action",
      key: "action",
      fixed: "right",
      width: 90,
      render: (_, record) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => onOpen(record)} aria-label={`View ${record.ackno}`}>
          View
        </Button>
      ),
    },
  ];

  return (
    <Card
      className="dashboard-card table-card"
      title="Permit Applications"
      extra={
        <Button icon={<DownloadOutlined />} onClick={() => downloadCsv(rows, asOnDate)} disabled={rows.length === 0}>
          Export CSV
        </Button>
      }
    >
      <Row gutter={[12, 12]} className="table-toolbar">
        <Col xs={24} md={12} xl={8}>
          <Input.Search
            allowClear
            placeholder="Search Ack No, Permit No, party or location"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search permit applications"
          />
        </Col>
        <Col xs={12} md={6} xl={4}>
          <Select allowClear placeholder="All Types" value={type} onChange={(value) => setType(value ?? null)} style={{ width: "100%" }} aria-label="Permit type">
            {PERMIT_TYPES.map((item) => (
              <Select.Option key={item} value={item}>
                {item}
              </Select.Option>
            ))}
          </Select>
        </Col>
        <Col xs={12} md={6} xl={4}>
          <Select
            allowClear
            placeholder="All Statuses"
            value={status}
            onChange={(value) => onStatusChange(value ?? null)}
            style={{ width: "100%" }}
            aria-label="Status"
          >
            {PERMIT_STATUSES.map((item) => (
              <Select.Option key={item} value={item}>
                {item}
              </Select.Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} md={18} xl={6}>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            format={DATE_FORMAT}
            placeholder={["Applied from", "Applied to"]}
            disabledDate={(day) => day && day.isAfter(asOnDate, "day")}
            style={{ width: "100%" }}
          />
        </Col>
        <Col xs={24} md={6} xl={2}>
          <Button icon={<ReloadOutlined />} onClick={reset} block>
            Reset
          </Button>
        </Col>
      </Row>

      <Table
        rowKey="key"
        size="middle"
        loading={loading}
        columns={columns}
        dataSource={rows}
        scroll={{ x: "max-content" }}
        rowClassName={(record) => (record.key === selectedKey ? "row-selected" : "")}
        onRow={(record) => ({
          onClick: (event) => {
            // The Ack No link and View button handle their own clicks.
            if (!event.target.closest("button")) onOpen(record);
          },
        })}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
          showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} applications`,
        }}
      />
    </Card>
  );
};

export default PermitTable;
