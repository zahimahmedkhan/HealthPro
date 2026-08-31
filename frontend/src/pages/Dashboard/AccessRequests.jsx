import React, { useEffect, useState } from "react";
import { Button, Card, Empty, List, message, Tag } from "antd";
import { UserOutlined, CheckCircleOutlined, CloseCircleOutlined, StopOutlined } from "@ant-design/icons";
import api from "../../utils/axiosSetup";

const AccessRequests = () => {
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchGrants = async () => {
    try {
      setLoading(true);
      const res = await api.get("/access/my-grants");
      setGrants(res.data?.grants || []);
    } catch (error) {
      console.error("Failed to load access grants", error);
      message.error("Unable to load access requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrants();
  }, []);

  const handleRespond = async (grantId, decision) => {
    try {
      const res = await api.patch("/access/respond", { grantId, decision });
      message.success(res.data?.message || "Request updated");
      fetchGrants();
    } catch (error) {
      message.error(error.response?.data?.message || "Unable to update access request");
    }
  };

  const handleRevoke = async (grantId) => {
    try {
      const res = await api.patch(`/access/revoke/${grantId}`);
      message.success(res.data?.message || "Access revoked");
      fetchGrants();
    } catch (error) {
      message.error(error.response?.data?.message || "Unable to revoke access");
    }
  };

  const pendingRequests = grants.filter((grant) => grant.status === "pending");
  const approvedDoctors = grants.filter((grant) => grant.status === "approved");

  return (
    <div className="space-y-6 p-2 md:p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Access Requests</h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Approve or revoke access to your health records.</p>
      </div>

      <Card className="rounded-xl" title="Pending Requests" bodyStyle={{ padding: 12 }}>
        {loading ? (
          <div className="py-10 text-center">Loading...</div>
        ) : pendingRequests.length === 0 ? (
          <Empty description="No pending access requests" />
        ) : (
          <List
            dataSource={pendingRequests}
            renderItem={(grant) => (
              <List.Item
                actions={[
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => handleRespond(grant._id, "approve")}>Approve</Button>,
                  <Button danger icon={<CloseCircleOutlined />} onClick={() => handleRespond(grant._id, "deny")}>Deny</Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={<UserOutlined style={{ color: "var(--primary)" }} />}
                  title={grant.doctor?.userName || "Doctor"}
                  description={grant.doctor?.email || "Unknown doctor"}
                />
                <Tag color="gold">Pending</Tag>
              </List.Item>
            )}
          />
        )}
      </Card>

      <Card className="rounded-xl" title="Approved Doctors" bodyStyle={{ padding: 12 }}>
        {approvedDoctors.length === 0 ? (
          <Empty description="No active access grants" />
        ) : (
          <List
            dataSource={approvedDoctors}
            renderItem={(grant) => (
              <List.Item
                actions={[
                  <Button danger icon={<StopOutlined />} onClick={() => handleRevoke(grant._id)}>Revoke</Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={<UserOutlined style={{ color: "var(--success)" }} />}
                  title={grant.doctor?.userName || "Doctor"}
                  description={grant.doctor?.email || "Unknown doctor"}
                />
                <Tag color="green">Approved</Tag>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default AccessRequests;
