import React, { useEffect, useState, useCallback } from "react";
import {
  Form,
  Input,
  Select,
  Switch,
  Button,
  Card,
  message,
  Spin,
  Space,
  Typography,
  Divider,
  Tag,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  ShareAltOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { QRCodeSVG } from "qrcode.react";
import api from "../../utils/axiosSetup";

const { TextArea } = Input;
const { Text, Title } = Typography;

const BLOOD_GROUP_OPTIONS = [
  { label: "A+", value: "A+" },
  { label: "A-", value: "A-" },
  { label: "B+", value: "B+" },
  { label: "B-", value: "B-" },
  { label: "AB+", value: "AB+" },
  { label: "AB-", value: "AB-" },
  { label: "O+", value: "O+" },
  { label: "O-", value: "O-" },
  { label: "Unknown", value: "Unknown" },
];

export default function EmergencyProfile() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [userId, setUserId] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchProfile = useCallback(async (signal) => {
    try {
      setFetching(true);
      const res = await api.get("/emergency/me", { signal });
      if (res.data?.profile) {
        const p = res.data.profile;
        form.setFieldsValue({
          bloodGroup: p.bloodGroup || "Unknown",
          allergies: p.allergies || [],
          chronicConditions: p.chronicConditions || [],
          currentMedications: p.currentMedications || [],
          emergencyContacts: p.emergencyContacts || [],
          organDonor: p.organDonor || false,
          additionalNotes: p.additionalNotes || "",
        });
      }
    } catch (error) {
      if (error?.name === "CanceledError") return;
      console.error("Failed to fetch emergency profile:", error);
      message.error(error.response?.data?.message || "Failed to load emergency profile");
    } finally {
      setFetching(false);
    }
  }, [form]);

  useEffect(() => {
    const controller = new AbortController();
    fetchProfile(controller.signal);
    return () => controller.abort();
  }, [fetchProfile]);

  useEffect(() => {
    // Get userId from user profile for share link
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/user-profile");
        if (res.data?.user?._id) {
          setUserId(res.data.user._id);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };
    fetchUser();
  }, []);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const res = await api.put("/emergency", values);
      if (res.data?.status === 200) {
        message.success(res.data?.message || "Emergency profile saved successfully");
      } else {
        message.error(res.data?.message || "Failed to save emergency profile");
      }
    } catch (error) {
      console.error("Save emergency profile error:", error);
      message.error(error.response?.data?.message || "Failed to save emergency profile");
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = userId ? `${window.location.origin}/emergency/${userId}` : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      message.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      message.error("Failed to copy link");
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-3 py-4 sm:p-6" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "var(--text)" }}>
            Emergency Profile
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Maintain critical emergency info that can be shared via a public link.
          </p>
        </div>

        {/* Emergency Profile Form */}
        <Card className="rounded-xl mb-6" bodyStyle={{ padding: 24 }}>
          <Form form={form} layout="vertical" onFinish={onFinish}>
            {/* Blood Group */}
            <Form.Item
              name="bloodGroup"
              label={<span className="font-semibold" style={{ color: "var(--text)" }}>Blood Group</span>}
            >
              <Select
                placeholder="Select blood group"
                options={BLOOD_GROUP_OPTIONS}
                size="large"
              />
            </Form.Item>

            {/* Allergies */}
            <Form.Item
              label={<span className="font-semibold" style={{ color: "var(--text)" }}>Allergies</span>}
            >
              <Form.List name="allergies">
                {(fields, { add, remove }) => (
                  <div className="space-y-3">
                    {fields.map((field) => (
                      <div key={field.key} className="flex items-center gap-2">
                        <Form.Item {...field} noStyle rules={[{ required: true, message: "Enter an allergy" }]}>
                          <Input placeholder="e.g., Penicillin" style={{ flex: 1 }} />
                        </Form.Item>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                        />
                      </div>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Add Allergy
                    </Button>
                  </div>
                )}
              </Form.List>
            </Form.Item>

            {/* Chronic Conditions */}
            <Form.Item
              label={<span className="font-semibold" style={{ color: "var(--text)" }}>Chronic Conditions</span>}
            >
              <Form.List name="chronicConditions">
                {(fields, { add, remove }) => (
                  <div className="space-y-3">
                    {fields.map((field) => (
                      <div key={field.key} className="flex items-center gap-2">
                        <Form.Item {...field} noStyle rules={[{ required: true, message: "Enter a condition" }]}>
                          <Input placeholder="e.g., Diabetes Type 2" style={{ flex: 1 }} />
                        </Form.Item>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                        />
                      </div>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Add Condition
                    </Button>
                  </div>
                )}
              </Form.List>
            </Form.Item>

            {/* Current Medications */}
            <Form.Item
              label={<span className="font-semibold" style={{ color: "var(--text)" }}>Current Medications</span>}
            >
              <Form.List name="currentMedications">
                {(fields, { add, remove }) => (
                  <div className="space-y-3">
                    {fields.map((field) => (
                      <div key={field.key} className="flex items-center gap-2">
                        <Form.Item {...field} noStyle rules={[{ required: true, message: "Enter a medication" }]}>
                          <Input placeholder="e.g., Metformin 500mg" style={{ flex: 1 }} />
                        </Form.Item>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                        />
                      </div>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Add Medication
                    </Button>
                  </div>
                )}
              </Form.List>
            </Form.Item>

            {/* Emergency Contacts */}
            <Form.Item
              label={<span className="font-semibold" style={{ color: "var(--text)" }}>Emergency Contacts (max 3)</span>}
            >
              <Form.List
                name="emergencyContacts"
                rules={[
                  {
                    validator: async (_, contacts) => {
                      if (contacts && contacts.length > 3) {
                        return Promise.reject(new Error("Maximum 3 emergency contacts allowed"));
                      }
                    },
                  },
                ]}
              >
                {(fields, { add, remove }, { errors }) => (
                  <div className="space-y-4">
                    {fields.map((field) => (
                      <Card
                        key={field.key}
                        size="small"
                        className="rounded-lg"
                        style={{ borderColor: "var(--border)" }}
                        extra={
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => remove(field.name)}
                          />
                        }
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Form.Item
                            {...field}
                            name={[field.name, "name"]}
                            rules={[{ required: true, message: "Name required" }]}
                          >
                            <Input placeholder="Contact name" />
                          </Form.Item>
                          <Form.Item
                            {...field}
                            name={[field.name, "relation"]}
                            rules={[{ required: true, message: "Relation required" }]}
                          >
                            <Input placeholder="Relation (e.g., Spouse)" />
                          </Form.Item>
                          <Form.Item
                            {...field}
                            name={[field.name, "phone"]}
                            rules={[{ required: true, message: "Phone required" }]}
                          >
                            <Input placeholder="Phone number" />
                          </Form.Item>
                        </div>
                      </Card>
                    ))}
                    {fields.length < 3 && (
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        Add Emergency Contact
                      </Button>
                    )}
                    <Form.ErrorList errors={errors} />
                  </div>
                )}
              </Form.List>
            </Form.Item>

            {/* Organ Donor */}
            <Form.Item
              name="organDonor"
              label={<span className="font-semibold" style={{ color: "var(--text)" }}>Organ Donor</span>}
              valuePropName="checked"
            >
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>

            {/* Additional Notes */}
            <Form.Item
              name="additionalNotes"
              label={<span className="font-semibold" style={{ color: "var(--text)" }}>Additional Notes</span>}
              rules={[{ max: 500, message: "Maximum 500 characters" }]}
            >
              <TextArea
                rows={4}
                placeholder="Any other critical information for emergency responders..."
                showCount
                maxLength={500}
              />
            </Form.Item>

            {/* Save Button */}
            <div className="flex justify-end pt-4" style={{ borderTop: "1px solid var(--border)" }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                className="rounded-lg font-semibold"
              >
                {loading ? "Saving..." : "Save Emergency Profile"}
              </Button>
            </div>
          </Form>
        </Card>

        {/* Share Section */}
        {userId && (
          <Card className="rounded-xl" bodyStyle={{ padding: 24 }}>
            <div className="flex items-center gap-2 mb-4">
              <ShareAltOutlined style={{ color: "var(--primary)", fontSize: 20 }} />
              <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
                Share Emergency Profile
              </h3>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
              Share this link with emergency responders. It works without login.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* QR Code */}
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg border" style={{ borderColor: "var(--border)" }}>
                <QRCodeSVG value={shareUrl} size={160} />
                <Text className="text-xs" style={{ color: "var(--muted)" }}>Scan to open</Text>
              </div>

              {/* Link + Copy */}
              <div className="flex-1 w-full">
                <div className="flex items-center gap-2 mb-3">
                  <Tag color="blue" icon={<SafetyCertificateOutlined />}>
                    Public Link
                  </Tag>
                </div>
                <div
                  className="flex items-center gap-2 p-3 rounded-lg border mb-3"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
                >
                  <Text
                    className="flex-1 text-sm break-all"
                    style={{ color: "var(--text)", fontFamily: "monospace" }}
                  >
                    {shareUrl}
                  </Text>
                </div>
                <Button
                  type="primary"
                  icon={<CopyOutlined />}
                  onClick={handleCopyLink}
                  className="rounded-lg"
                >
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
