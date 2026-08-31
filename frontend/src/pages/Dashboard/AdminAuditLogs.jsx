import React, { useEffect, useState, useCallback } from "react";
import { Card, Table, Tag, Select, DatePicker, Button, Space, Spin, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../utils/axiosSetup";

const { RangePicker } = DatePicker;
const { Text } = Typography;

const ACTION_OPTIONS = [
  { label: "All Actions", value: "" },
  { label: "LOGIN", value: "LOGIN" },
  { label: "REGISTER", value: "REGISTER" },
  { label: "ACCESS_REQUEST_SENT", value: "ACCESS_REQUEST_SENT" },
  { label: "ACCESS_REQUEST_APPROVED", value: "ACCESS_REQUEST_APPROVED" },
  { label: "ACCESS_REQUEST_DENIED", value: "ACCESS_REQUEST_DENIED" },
  { label: "ACCESS_REVOKED", value: "ACCESS_REVOKED" },
  { label: "VIEW_PATIENT_VITALS", value: "VIEW_PATIENT_VITALS" },
  { label: "VIEW_PATIENT_INSIGHTS", value: "VIEW_PATIENT_INSIGHTS" },
  { label: "VIEW_EMERGENCY_PROFILE_PUBLIC", value: "VIEW_EMERGENCY_PROFILE_PUBLIC" },
  { label: "APPOINTMENT_BOOKED", value: "APPOINTMENT_BOOKED" },
  { label: "APPOINTMENT_STATUS_UPDATED", value: "APPOINTMENT_STATUS_UPDATED" },
];

const ACTION_COLORS = {
  LOGIN: "blue",
  REGISTER: "green",
  ACCESS_REQUEST_SENT: "gold",
  ACCESS_REQUEST_APPROVED: "green",
  ACCESS_REQUEST_DENIED: "red",
  ACCESS_REVOKED: "red",
  VIEW_PATIENT_VITALS: "blue",
  VIEW_PATIENT_INSIGHTS: "purple",
  VIEW_EMERGENCY_PROFILE_PUBLIC: "orange",
  APPOINTMENT_BOOKED: "cyan",
  APPOINTMENT_STATUS_UPDATED: "geekblue",
};

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
  });

  // Filter states
  const [actionFilter, setActionFilter] = useState("");
  const [dateRange, setDateRange] = useState(null);

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true);

      const params = { page };

      if (actionFilter) {
        params.action = actionFilter;
      }

      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].toISOString();
        params.endDate = dateRange[1].toISOString();
      }

      const res = await api.get("/audit/all", { params });
      setLogs(res.data?.logs || []);
      setPagination(res.data?.pagination || { page: 1, total: 0, totalPages: 0 });
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, dateRange]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handlePageChange = (page) => {
    fetchLogs(page);
  };

  const handleResetFilters = () => {
    setActionFilter("");
    setDateRange(null);
  };

  const columns = [
    {
      title: "Timestamp",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (text) => (
        <Text style={{ color: "var(--text)" }}>
          {dayjs(text).format("MMM D, YYYY h:mm A")}
        </Text>
      ),
    },
    {
      title: "Actor",
      key: "actor",
      width: 180,
      render: (_, record) => (
        <div>
          <Text strong style={{ color: "var(--text)" }}>
            {record.actorId?.userName || "Anonymous"}
          </Text>
          <br />
          <Tag color={record.actorRole === "admin" ? "red" : record.actorRole === "doctor" ? "blue" : "default"}>
            {record.actorRole}
          </Tag>
        </div>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      width: 200,
      render: (action) => (
        <Tag color={ACTION_COLORS[action] || "default"}>
          {action}
        </Tag>
      ),
    },
    {
      title: "Target",
      key: "target",
      width: 150,
      render: (_, record) => (
        <div>
          {record.targetId ? (
            <Text className="text-xs" style={{ color: "var(--muted)", fontFamily: "monospace" }}>
              {record.targetId}
            </Text>
          ) : (
            <Text style={{ color: "var(--muted)" }}>-</Text>
          )}
          {record.targetType && (
            <br />
          )}
          {record.targetType && (
            <Tag color="gray">{record.targetType}</Tag>
          )}
        </div>
      ),
    },
    {
      title: "IP Address",
      dataIndex: "ipAddress",
      key: "ipAddress",
      width: 130,
      render: (text) => (
        <Text className="text-xs" style={{ color: "var(--muted)", fontFamily: "monospace" }}>
          {text || "-"}
        </Text>
      ),
    },
    {
      title: "Metadata",
      dataIndex: "metadata",
      key: "metadata",
      width: 120,
      render: (metadata) => (
        metadata ? (
          <Tag color="gray">{JSON.stringify(metadata)}</Tag>
        ) : (
          <Text style={{ color: "var(--muted)" }}>-</Text>
        )
      ),
    },
  ];

  return (
    <div className="min-h-screen px-3 py-4 sm:p-6" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "var(--text)" }}>
            Audit Logs
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            System-wide activity logs for security monitoring.
          </p>
        </div>

        {/* Filters */}
        <Card className="rounded-xl mb-4" bodyStyle={{ padding: 16 }}>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <Space wrap>
              <Select
                placeholder="Filter by action"
                value={actionFilter || undefined}
                onChange={(value) => setActionFilter(value || "")}
                options={ACTION_OPTIONS}
                style={{ width: 220 }}
                allowClear
              />
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates)}
                placeholder={["Start date", "End date"]}
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={handleResetFilters}
              >
                Reset
              </Button>
            </Space>
          </div>
        </Card>

        {/* Table */}
        <Card className="rounded-xl" bodyStyle={{ padding: 0 }}>
          <Table
            columns={columns}
            dataSource={logs}
            loading={loading}
            rowKey="_id"
            pagination={{
              current: pagination.page,
              total: pagination.total,
              pageSize: 50,
              onChange: handlePageChange,
              showSizeChanger: false,
              showTotal: (total) => `Total ${total} entries`,
            }}
            scroll={{ x: 960 }}
          />
        </Card>
      </div>
    </div>
  );
}
