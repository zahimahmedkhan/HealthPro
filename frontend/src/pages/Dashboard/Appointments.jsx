import React, { useEffect, useState, useCallback } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Card,
  List,
  Tag,
  message,
  Empty,
  Spin,
  Modal,
  Space,
  Typography,
} from "antd";
import {
  CalendarOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../utils/axiosSetup";

const { TextArea } = Input;
const { Text } = Typography;

const STATUS_COLORS = {
  requested: "gold",
  confirmed: "blue",
  completed: "green",
  cancelled: "red",
};

const STATUS_LABELS = {
  requested: "Requested",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function Appointments() {
  const [form] = Form.useForm();
  const [userRole, setUserRole] = useState(null);
  const [approvedDoctors, setApprovedDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [notesValue, setNotesValue] = useState("");

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const res = await api.get("/auth/user-profile");
        if (res.data?.user?.role) {
          setUserRole(res.data.user.role);
        }
      } catch (error) {
        console.error("Failed to fetch user role:", error);
      }
    };
    fetchUserRole();
  }, []);

  // Fetch approved doctors (for patient booking)
  const fetchApprovedDoctors = useCallback(async () => {
    try {
      const res = await api.get("/access/my-grants");
      const grants = res.data?.grants || [];
      // Filter for approved grants and extract doctor info
      const doctors = grants
        .filter((grant) => grant.status === "approved")
        .map((grant) => ({
          id: grant.doctor?._id || grant.doctorId,
          userName: grant.doctor?.userName || "Unknown Doctor",
          email: grant.doctor?.email || "",
        }));
      setApprovedDoctors(doctors);
    } catch (error) {
      console.error("Failed to fetch approved doctors:", error);
    }
  }, []);

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    try {
      setFetching(true);
      const res = await api.get("/appointments/my");
      setAppointments(res.data?.appointments || []);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
      message.error("Failed to load appointments");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (userRole === "patient") {
      fetchApprovedDoctors();
    }
    fetchAppointments();
  }, [userRole, fetchApprovedDoctors, fetchAppointments]);

  // Book appointment (patient)
  const handleBookAppointment = async (values) => {
    try {
      setSubmitting(true);
      const payload = {
        doctorId: values.doctorId,
        dateTime: values.dateTime.toISOString(),
        reason: values.reason || "",
      };

      const res = await api.post("/appointments", payload);
      if (res.data?.status === 201) {
        message.success(res.data?.message || "Appointment booked successfully");
        form.resetFields();
        fetchAppointments();
      } else {
        message.error(res.data?.message || "Failed to book appointment");
      }
    } catch (error) {
      console.error("Book appointment error:", error);
      message.error(error.response?.data?.message || "Failed to book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  // Update appointment status
  const handleUpdateStatus = async (appointmentId, status, notes) => {
    try {
      const payload = { status };
      if (notes !== undefined) {
        payload.notes = notes;
      }

      const res = await api.patch(`/appointments/${appointmentId}/status`, payload);
      if (res.data?.status === 200) {
        message.success(res.data?.message || "Status updated successfully");
        fetchAppointments();
      } else {
        message.error(res.data?.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Update status error:", error);
      message.error(error.response?.data?.message || "Failed to update status");
    }
  };

  // Open notes modal for doctor
  const openNotesModal = (appointment) => {
    setSelectedAppointment(appointment);
    setNotesValue(appointment.notes || "");
    setNotesModalVisible(true);
  };

  // Save notes
  const handleSaveNotes = async () => {
    if (selectedAppointment) {
      await handleUpdateStatus(selectedAppointment._id, "completed", notesValue);
      setNotesModalVisible(false);
      setSelectedAppointment(null);
      setNotesValue("");
    }
  };

  // Cancel appointment (patient or doctor)
  const handleCancel = (appointmentId) => {
    Modal.confirm({
      title: "Cancel Appointment",
      content: "Are you sure you want to cancel this appointment?",
      okText: "Yes, Cancel",
      okType: "danger",
      cancelText: "No",
      onOk: () => handleUpdateStatus(appointmentId, "cancelled"),
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
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "var(--text)" }}>
            Appointments
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {userRole === "patient"
              ? "Book appointments with your approved doctors."
              : "Manage your appointment schedule."}
          </p>
        </div>

        {/* Book Appointment Form (Patient Only) */}
        {userRole === "patient" && (
          <Card className="rounded-xl mb-6" title="Book New Appointment" bodyStyle={{ padding: 24 }}>
            <Form form={form} layout="vertical" onFinish={handleBookAppointment}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  name="doctorId"
                  label={<span className="font-semibold" style={{ color: "var(--text)" }}>Select Doctor</span>}
                  rules={[{ required: true, message: "Please select a doctor" }]}
                >
                  <Select
                    placeholder="Choose from approved doctors"
                    size="large"
                    options={approvedDoctors.map((doc) => ({
                      value: doc.id,
                      label: `${doc.userName} (${doc.email})`,
                    }))}
                    notFoundContent={
                      approvedDoctors.length === 0
                        ? "No approved doctors. Please request access first."
                        : "No doctors found"
                    }
                  />
                </Form.Item>

                <Form.Item
                  name="dateTime"
                  label={<span className="font-semibold" style={{ color: "var(--text)" }}>Date & Time</span>}
                  rules={[{ required: true, message: "Please select date and time" }]}
                >
                  <DatePicker
                    showTime
                    format="YYYY-MM-DD HH:mm"
                    className="w-full"
                    size="large"
                    disabledDate={(current) => current && current < dayjs().startOf("day")}
                    placeholder="Select date and time"
                  />
                </Form.Item>
              </div>

              <Form.Item
                name="reason"
                label={<span className="font-semibold" style={{ color: "var(--text)" }}>Reason (optional)</span>}
                rules={[{ max: 300, message: "Reason cannot exceed 300 characters" }]}
              >
                <TextArea
                  rows={3}
                  placeholder="Brief description of your visit..."
                  maxLength={300}
                  showCount
                />
              </Form.Item>

              <div className="flex justify-end">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  size="large"
                  icon={<CalendarOutlined />}
                  className="rounded-lg font-semibold"
                >
                  {submitting ? "Booking..." : "Book Appointment"}
                </Button>
              </div>
            </Form>
          </Card>
        )}

        {/* Appointments List */}
        <Card className="rounded-xl" title={userRole === "patient" ? "My Appointments" : "Patient Appointments"} bodyStyle={{ padding: 12 }}>
          {appointments.length === 0 ? (
            <Empty description="No appointments found" />
          ) : (
            <List
              dataSource={appointments}
              renderItem={(appointment) => {
                const otherParty =
                  userRole === "patient" ? appointment.doctorId : appointment.patientId;
                const otherName = otherParty?.userName || "Unknown";
                const otherEmail = otherParty?.email || "";

                return (
                  <List.Item
                    actions={
                      userRole === "doctor" && appointment.status === "requested"
                        ? [
                            <Button
                              type="primary"
                              size="small"
                              icon={<CheckCircleOutlined />}
                              onClick={() => handleUpdateStatus(appointment._id, "confirmed")}
                            >
                              Confirm
                            </Button>,
                            <Button
                              size="small"
                              icon={<ClockCircleOutlined />}
                              onClick={() => openNotesModal(appointment)}
                            >
                              Complete & Notes
                            </Button>,
                            <Button
                              danger
                              size="small"
                              icon={<CloseCircleOutlined />}
                              onClick={() => handleCancel(appointment._id)}
                            >
                              Cancel
                            </Button>,
                          ]
                        : userRole === "doctor" && appointment.status === "confirmed"
                        ? [
                            <Button
                              size="small"
                              icon={<ClockCircleOutlined />}
                              onClick={() => openNotesModal(appointment)}
                            >
                              Complete & Notes
                            </Button>,
                            <Button
                              danger
                              size="small"
                              icon={<CloseCircleOutlined />}
                              onClick={() => handleCancel(appointment._id)}
                            >
                              Cancel
                            </Button>,
                          ]
                        : userRole === "patient" &&
                          ["requested", "confirmed"].includes(appointment.status)
                        ? [
                            <Button
                              danger
                              size="small"
                              icon={<CloseCircleOutlined />}
                              onClick={() => handleCancel(appointment._id)}
                            >
                              Cancel
                            </Button>,
                          ]
                        : []
                    }
                  >
                    <List.Item.Meta
                      avatar={
                        <UserOutlined
                          style={{ fontSize: 24, color: "var(--primary)" }}
                        />
                      }
                      title={
                        <div className="flex items-center gap-2">
                          <span style={{ color: "var(--text)" }}>
                            {userRole === "patient"
                              ? `Dr. ${otherName}`
                              : otherName}
                          </span>
                          <Tag color={STATUS_COLORS[appointment.status]}>
                            {STATUS_LABELS[appointment.status]}
                          </Tag>
                        </div>
                      }
                      description={
                        <div>
                          <p style={{ color: "var(--muted)", margin: 0 }}>
                            {otherEmail}
                          </p>
                          <p style={{ color: "var(--muted)", margin: "4px 0 0 0" }}>
                            <CalendarOutlined className="mr-1" />
                            {dayjs(appointment.dateTime).format("MMM D, YYYY [at] h:mm A")}
                          </p>
                          {appointment.reason && (
                            <p style={{ color: "var(--muted)", margin: "4px 0 0 0" }}>
                              Reason: {appointment.reason}
                            </p>
                          )}
                          {appointment.notes && (
                            <p style={{ color: "var(--primary)", margin: "4px 0 0 0" }}>
                              Notes: {appointment.notes}
                            </p>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          )}
        </Card>

        {/* Notes Modal (Doctor) */}
        <Modal
          title="Appointment Notes"
          open={notesModalVisible}
          onOk={handleSaveNotes}
          onCancel={() => {
            setNotesModalVisible(false);
            setSelectedAppointment(null);
            setNotesValue("");
          }}
          okText="Save & Complete"
        >
          <TextArea
            rows={3}
            value={notesValue}
            className="mb-3"
            onChange={(e) => setNotesValue(e.target.value)}
            placeholder="Add notes about this appointment..."
            maxLength={500}
            showCount
          />
        </Modal>
      </div>
    </div>
  );
}
