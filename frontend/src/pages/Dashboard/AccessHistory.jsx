import React, { useEffect, useState, useCallback } from "react";
import { Card, Timeline, Tag, Spin, Empty, Pagination, Typography } from "antd";
import {
  EyeOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../utils/axiosSetup";

const { Text } = Typography;

const ACTION_CONFIG = {
  VIEW_PATIENT_VITALS: {
    color: "blue",
    icon: <EyeOutlined />,
    label: "viewed your vitals",
  },
  VIEW_PATIENT_INSIGHTS: {
    color: "purple",
    icon: <EyeOutlined />,
    label: "viewed your AI insights",
  },
  VIEW_EMERGENCY_PROFILE_PUBLIC: {
    color: "orange",
    icon: <GlobalOutlined />,
    label: "viewed your emergency profile",
  },
  ACCESS_REQUEST_SENT: {
    color: "gold",
    icon: <SafetyCertificateOutlined />,
    label: "requested access to your records",
  },
  ACCESS_REQUEST_APPROVED: {
    color: "green",
    icon: <CheckCircleOutlined />,
    label: "was granted access to your records",
  },
  ACCESS_REQUEST_DENIED: {
    color: "red",
    icon: <CloseCircleOutlined />,
    label: "was denied access to your records",
  },
  ACCESS_REVOKED: {
    color: "red",
    icon: <StopOutlined />,
    label: "had access revoked",
  },
};

export default function AccessHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
  });

  const fetchHistory = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get("/audit/my-history", {
        params: { page },
      });
      setLogs(res.data?.logs || []);
      setPagination(res.data?.pagination || { page: 1, total: 0, totalPages: 0 });
    } catch (error) {
      console.error("Failed to fetch access history:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const handlePageChange = (page) => {
    fetchHistory(page);
  };

  const formatLogEntry = (log) => {
    const config = ACTION_CONFIG[log.action] || {
      color: "default",
      icon: <UserOutlined />,
      label: log.action,
    };

    const actorName = log.actorId?.userName || "Anonymous";
    const actorRole = log.actorRole || "unknown";
    const timestamp = dayjs(log.createdAt).format("MMM D, YYYY [at] h:mm A");

    return {
      color: config.color,
      dot: config.icon,
      children: (
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Text strong style={{ color: "var(--text)" }}>
              {actorName}
            </Text>
            {actorRole !== "anonymous" && (
              <Tag color={actorRole === "doctor" ? "blue" : "default"}>
                {actorRole}
              </Tag>
            )}
            <Text style={{ color: "var(--muted)" }}>{config.label}</Text>
          </div>
          <Text className="text-xs" style={{ color: "var(--muted)" }}>
            {timestamp}
          </Text>
          {log.metadata && (
            <div className="mt-1">
              <Tag color="gray">{JSON.stringify(log.metadata)}</Tag>
            </div>
          )}
        </div>
      ),
    };
  };

  return (
    <div className="min-h-screen px-3 py-4 sm:p-6" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "var(--text)" }}>
            Access History
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            See who has accessed your health records and when.
          </p>
        </div>

        <Card className="rounded-xl" bodyStyle={{ padding: 24 }}>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Spin size="large" />
            </div>
          ) : logs.length === 0 ? (
            <Empty description="No access history found" />
          ) : (
            <>
              <Timeline
                items={logs.map(formatLogEntry)}
              />

              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination
                    current={pagination.page}
                    total={pagination.total}
                    pageSize={50}
                    onChange={handlePageChange}
                    showSizeChanger={false}
                    showTotal={(total) => `Total ${total} entries`}
                  />
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
