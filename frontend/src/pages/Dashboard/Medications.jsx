import React, { useEffect, useState, useCallback } from "react";
import {
  Form,
  Input,
  Select,
  TimePicker,
  DatePicker,
  Button,
  Card,
  List,
  Switch,
  Tag,
  message,
  Empty,
  Spin,
  Modal,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  MedicineBoxOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../utils/axiosSetup";

const { TextArea } = Input;

const FREQUENCY_OPTIONS = [
  { label: "Once daily", value: "once daily" },
  { label: "Twice daily", value: "twice daily" },
  { label: "Three times daily", value: "three times daily" },
  { label: "Four times daily", value: "four times daily" },
  { label: "As needed", value: "as needed" },
  { label: "Weekly", value: "weekly" },
  { label: "Other", value: "other" },
];

export default function Medications() {
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchReminders = useCallback(async () => {
    try {
      setFetching(true);
      const res = await api.get("/medications");
      setReminders(res.data?.reminders || []);
    } catch (error) {
      console.error("Failed to fetch reminders:", error);
      message.error("Failed to load medication reminders");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  // Add new reminder
  const handleAddReminder = async (values) => {
    try {
      setSubmitting(true);

      // Format times to HH:mm strings
      const times = (values.times || []).map((t) =>
        t ? t.format("HH:mm") : null
      ).filter(Boolean);

      const payload = {
        medicineName: values.medicineName,
        dosage: values.dosage || "",
        frequency: values.frequency || "",
        times: times,
        startDate: values.startDate ? values.startDate.toISOString() : new Date().toISOString(),
        endDate: values.endDate ? values.endDate.toISOString() : null,
        active: values.active !== false,
      };

      const res = await api.post("/medications", payload);
      if (res.data?.status === 201) {
        message.success(res.data?.message || "Reminder created successfully");
        form.resetFields();
        fetchReminders();
      } else {
        message.error(res.data?.message || "Failed to create reminder");
      }
    } catch (error) {
      console.error("Add reminder error:", error);
      message.error(error.response?.data?.message || "Failed to create reminder");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle active status
  const handleToggleActive = async (reminder, checked) => {
    try {
      const res = await api.patch(`/medications/${reminder._id}`, { active: checked });
      if (res.data?.status === 200) {
        message.success(checked ? "Reminder activated" : "Reminder deactivated");
        fetchReminders();
      } else {
        message.error(res.data?.message || "Failed to update reminder");
      }
    } catch (error) {
      console.error("Toggle active error:", error);
      message.error(error.response?.data?.message || "Failed to update reminder");
    }
  };

  // Open edit modal
  const openEditModal = (reminder) => {
    setEditingReminder(reminder);
    editForm.setFieldsValue({
      medicineName: reminder.medicineName,
      dosage: reminder.dosage,
      frequency: reminder.frequency,
      times: reminder.times?.map((t) => dayjs(t, "HH:mm")) || [],
      startDate: reminder.startDate ? dayjs(reminder.startDate) : null,
      endDate: reminder.endDate ? dayjs(reminder.endDate) : null,
    });
    setEditModalVisible(true);
  };

  // Update reminder
  const handleUpdateReminder = async (values) => {
    if (!editingReminder) return;

    try {
      setEditSubmitting(true);

      const times = (values.times || []).map((t) =>
        t ? t.format("HH:mm") : null
      ).filter(Boolean);

      const payload = {
        medicineName: values.medicineName,
        dosage: values.dosage || "",
        frequency: values.frequency || "",
        times: times,
        startDate: values.startDate ? values.startDate.toISOString() : undefined,
        endDate: values.endDate ? values.endDate.toISOString() : null,
      };

      const res = await api.patch(`/medications/${editingReminder._id}`, payload);
      if (res.data?.status === 200) {
        message.success(res.data?.message || "Reminder updated successfully");
        setEditModalVisible(false);
        setEditingReminder(null);
        editForm.resetFields();
        fetchReminders();
      } else {
        message.error(res.data?.message || "Failed to update reminder");
      }
    } catch (error) {
      console.error("Update reminder error:", error);
      message.error(error.response?.data?.message || "Failed to update reminder");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Delete reminder
  const handleDeleteReminder = (reminderId) => {
    Modal.confirm({
      title: "Delete Reminder",
      content: "Are you sure you want to delete this medication reminder?",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        try {
          const res = await api.delete(`/medications/${reminderId}`);
          if (res.data?.status === 200) {
            message.success(res.data?.message || "Reminder deleted successfully");
            fetchReminders();
          } else {
            message.error(res.data?.message || "Failed to delete reminder");
          }
        } catch (error) {
          console.error("Delete reminder error:", error);
          message.error(error.response?.data?.message || "Failed to delete reminder");
        }
      },
    });
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
            Medication Reminders
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Track your medications and receive email reminders.
          </p>
        </div>

        {/* Add Reminder Form */}
        <Card className="rounded-xl mb-6" title="Add Medication Reminder" bodyStyle={{ padding: 24 }}>
          <Form form={form} layout="vertical" onFinish={handleAddReminder}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="medicineName"
                label={<span className="font-semibold" style={{ color: "var(--text)" }}>Medicine Name</span>}
                rules={[{ required: true, message: "Please enter medicine name" }]}
              >
                <Input
                  placeholder="e.g., Metformin"
                  size="large"
                  prefix={<MedicineBoxOutlined style={{ color: "var(--primary)" }} />}
                />
              </Form.Item>

              <Form.Item
                name="dosage"
                label={<span className="font-semibold" style={{ color: "var(--text)" }}>Dosage</span>}
              >
                <Input placeholder="e.g., 500mg" size="large" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="frequency"
                label={<span className="font-semibold" style={{ color: "var(--text)" }}>Frequency</span>}
              >
                <Select
                  placeholder="Select frequency"
                  size="large"
                  options={FREQUENCY_OPTIONS}
                />
              </Form.Item>

              <Form.Item
                name="startDate"
                label={<span className="font-semibold" style={{ color: "var(--text)" }}>Start Date</span>}
                initialValue={dayjs()}
                rules={[{ required: true, message: "Please select start date" }]}
              >
                <DatePicker className="w-full" size="large" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="endDate"
                label={<span className="font-semibold" style={{ color: "var(--text)" }}>End Date (optional)</span>}
              >
                <DatePicker className="w-full" size="large" />
              </Form.Item>

              <Form.Item
                name="active"
                label={<span className="font-semibold" style={{ color: "var(--text)" }}>Active</span>}
                valuePropName="checked"
                initialValue={true}
              >
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </div>

            {/* Reminder Times */}
            <Form.Item
              label={<span className="font-semibold" style={{ color: "var(--text)" }}>Reminder Times</span>}
            >
              <Form.List name="times">
                {(fields, { add, remove }) => (
                  <div className="space-y-3">
                    {fields.map((field) => (
                      <div key={field.key} className="flex items-center gap-2">
                        <Form.Item {...field} noStyle>
                          <TimePicker
                            format="HH:mm"
                            placeholder="Select time"
                            size="large"
                          />
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
                      Add Reminder Time
                    </Button>
                  </div>
                )}
              </Form.List>
            </Form.Item>

            <div className="flex justify-end">
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                size="large"
                icon={<PlusOutlined />}
                className="rounded-lg font-semibold"
              >
                {submitting ? "Adding..." : "Add Reminder"}
              </Button>
            </div>
          </Form>
        </Card>

        {/* Reminders List */}
        <Card className="rounded-xl" title="My Medication Reminders" bodyStyle={{ padding: 12 }}>
          {reminders.length === 0 ? (
            <Empty description="No medication reminders yet" />
          ) : (
            <List
              dataSource={reminders}
              renderItem={(reminder) => (
                <List.Item
                  actions={[
                    <Switch
                      key="toggle"
                      checked={reminder.active}
                      checkedChildren="On"
                      unCheckedChildren="Off"
                      onChange={(checked) => handleToggleActive(reminder, checked)}
                    />,
                    <Button
                      key="edit"
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => openEditModal(reminder)}
                    />,
                    <Button
                      key="delete"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteReminder(reminder._id)}
                    />,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <MedicineBoxOutlined
                        style={{ fontSize: 24, color: reminder.active ? "var(--primary)" : "var(--muted)" }}
                      />
                    }
                    title={
                      <div className="flex items-center gap-2">
                        <span style={{ color: reminder.active ? "var(--text)" : "var(--muted)" }}>
                          {reminder.medicineName}
                        </span>
                        {reminder.dosage && (
                          <Tag color="blue">{reminder.dosage}</Tag>
                        )}
                        {reminder.frequency && (
                          <Tag color="purple">{reminder.frequency}</Tag>
                        )}
                      </div>
                    }
                    description={
                      <div>
                        {reminder.times && reminder.times.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {reminder.times.map((time, idx) => (
                              <Tag key={idx} color="green">
                                {time}
                              </Tag>
                            ))}
                          </div>
                        )}
                        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                          Started: {dayjs(reminder.startDate).format("MMM D, YYYY")}
                          {reminder.endDate && ` • Ends: ${dayjs(reminder.endDate).format("MMM D, YYYY")}`}
                        </p>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>

        {/* Edit Modal */}
        <Modal
          title="Edit Medication Reminder"
          open={editModalVisible}
          onCancel={() => {
            setEditModalVisible(false);
            setEditingReminder(null);
            editForm.resetFields();
          }}
          footer={null}
          width={600}
        >
          <Form form={editForm} layout="vertical" onFinish={handleUpdateReminder}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="medicineName"
                label={<span className="font-semibold" style={{ color: "var(--text)" }}>Medicine Name</span>}
                rules={[{ required: true, message: "Please enter medicine name" }]}
              >
                <Input placeholder="e.g., Metformin" />
              </Form.Item>

              <Form.Item
                name="dosage"
                label={<span className="font-semibold" style={{ color: "var(--text)" }}>Dosage</span>}
              >
                <Input placeholder="e.g., 500mg" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="frequency"
                label={<span className="font-semibold" style={{ color: "var(--text)" }}>Frequency</span>}
              >
                <Select placeholder="Select frequency" options={FREQUENCY_OPTIONS} />
              </Form.Item>

              <Form.Item
                name="startDate"
                label={<span className="font-semibold" style={{ color: "var(--text)" }}>Start Date</span>}
              >
                <DatePicker className="w-full" />
              </Form.Item>
            </div>

            <Form.Item
              name="endDate"
              label={<span className="font-semibold" style={{ color: "var(--text)" }}>End Date (optional)</span>}
            >
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item
              label={<span className="font-semibold" style={{ color: "var(--text)" }}>Reminder Times</span>}
            >
              <Form.List name="times">
                {(fields, { add, remove }) => (
                  <div className="space-y-3">
                    {fields.map((field) => (
                      <div key={field.key} className="flex items-center gap-2">
                        <Form.Item {...field} noStyle>
                          <TimePicker format="HH:mm" placeholder="Select time" />
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
                      Add Reminder Time
                    </Button>
                  </div>
                )}
              </Form.List>
            </Form.Item>

            <div className="flex justify-end gap-2">
              <Button onClick={() => { setEditModalVisible(false); setEditingReminder(null); editForm.resetFields(); }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={editSubmitting}>
                {editSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </div>
  );
}
