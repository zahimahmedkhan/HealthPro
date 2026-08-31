import React, { useEffect, useState, useCallback } from "react";
import { List, Card, Button, Spin, Empty, message, Row, Col } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import api from "../../utils/axiosSetup";

const AdminVerifications = () => {
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);
  const [items, setItems] = useState([]);

  const fetchPending = useCallback(async (signal) => {
    try {
      setLoading(true);
      // Backend endpoint for pending verifications
      const res = await api.get("/admin/pending-verifications", { signal });
      if (res?.data?.verifications) {
        setItems(res.data.verifications);
      } else if (Array.isArray(res?.data)) {
        setItems(res.data);
      } else {
        setItems([]);
      }
    } catch (err) {
      if (err?.name !== "CanceledError") {
        console.error(err);
        message.error(err.response?.data?.message || "Failed to load pending verifications");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchPending(controller.signal);
    return () => controller.abort();
  }, [fetchPending]);

  const handleApprove = async (id) => {
    try {
      setApproving(id);
      const res = await api.patch(`/admin/approve-verification/${id}`);
      if (res?.data?.status === 200 || res?.status === 200) {
        message.success(res.data?.message || "Verified successfully");
        setItems((prev) => prev.filter((i) => i._id !== id && i.id !== id));
      } else {
        message.error(res.data?.message || "Failed to approve");
      }
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || "Approval failed");
    } finally {
      setApproving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-3 py-4 sm:p-6" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "var(--text)" }}>Pending Verifications</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Approve doctor and lab verification requests</p>
        </div>

        {items.length === 0 ? (
          <Empty description="No pending verifications" />
        ) : (
          <List
            dataSource={items}
            grid={{ gutter: 16, xs: 1, sm: 1, md: 2 }}
            renderItem={(item) => (
              <List.Item>
                <Card className="p-4" style={{ borderColor: "var(--border)", borderRadius: 12 }}>
                  <Row justify="space-between" align="middle">
                    <Col flex="1" style={{ minWidth: 0 }}>
                      <h3 className="text-lg font-semibold truncate" style={{ color: "var(--text)" }}>{item.name || item.userName || item.email || "Unknown"}</h3>
                      <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{item.email || item.contact || ""}</p>
                      <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
                        Requested: {item.requestType || item.type || "verification"}
                      </p>
                      {item.note && <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>{item.note}</p>}
                    </Col>

                    <Col flex="none">
                      <div className="flex flex-col items-end gap-3">
                        <Button
                          type="primary"
                          loading={approving === (item._id || item.id)}
                          onClick={() => handleApprove(item._id || item.id)}
                        >
                          Approve
                        </Button>
                        <Button type="default" danger onClick={() => message.info("Reject not implemented")}>Reject</Button>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
};

export default AdminVerifications;
