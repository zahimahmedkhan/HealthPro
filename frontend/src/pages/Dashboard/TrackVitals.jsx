import React, { useState, useEffect, useCallback } from "react";
import { Button, Input, message, Table, Empty, Popconfirm, Statistic, Row, Col } from "antd";
import { HeartOutlined, FireOutlined, DownOutlined, DashboardOutlined, DeleteOutlined, CheckCircleOutlined, WarningOutlined, CloseCircleOutlined } from "@ant-design/icons";
import PrimaryButton from "../../components/PrimaryButton";
import api from "../../utils/axiosSetup";

// Pre-define color classes for Tailwind to include them in the build
const colorClasses = {
  green: { text: "text-green-600", border: "border-green-300", borderFocus: "border-green-500", colorVar: "var(--success)" },
  orange: { text: "text-orange-600", border: "border-orange-300", borderFocus: "border-orange-500", colorVar: "var(--warning)" },
  red: { text: "text-red-600", border: "border-red-300", borderFocus: "border-red-500", colorVar: "var(--danger)" },
};

const getVitalStatus = (vital, value) => {
  const num = parseFloat(value);
  if (!num) return null;

  const ranges = {
    heartRate: { normal: [60, 100], warning: [50, 120], critical: [0, 150] },
    temperature: { normal: [36.5, 37.5], warning: [36, 38.5], critical: [-100, 100] },
    oxygenSaturation: { normal: [95, 100], warning: [90, 94], critical: [0, 100] },
  };

  const range = ranges[vital];
  if (!range) return null;

  if (num >= range.normal[0] && num <= range.normal[1]) return { status: "normal", color: "green", icon: CheckCircleOutlined };
  if (num >= range.warning[0] && num <= range.warning[1]) return { status: "warning", color: "orange", icon: WarningOutlined };
  return { status: "critical", color: "red", icon: CloseCircleOutlined };
};

const VitalInputField = ({ label, icon: Icon, placeholder, value, onChange, error, hint, unit, fieldKey }) => {
  const status = fieldKey ? getVitalStatus(fieldKey, value) : null;
  const StatusIcon = status?.icon;
  const borderClass = status ? colorClasses[status.color]?.border : "";
  const borderFocusClass = status ? colorClasses[status.color]?.borderFocus : "";

  return (
    <div className="relative">
      <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
        <Icon className="text-lg" style={{ color: status?.color || "#6B7280" }} />
        {label}
        {unit && <span className="text-xs text-gray-500">({unit})</span>}
      </label>
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`rounded-lg h-12 text-base font-medium ${
            error
              ? "border-red-500 focus:border-red-500"
              : status
              ? `${borderClass} focus:${borderFocusClass}`
              : ""
          }`}
          status={error ? "error" : ""}
        />
        {value && StatusIcon && (
          <div className="absolute right-3 top-3">
            <StatusIcon style={{ color: status.color, fontSize: "20px" }} />
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1 font-medium">⚠️ {error}</p>}
      {hint && !error && <p className="text-gray-500 text-xs mt-1">{hint}</p>}
    </div>
  );
};

const TrackVitals = () => {
  const [bloodPressure, setBloodPressure] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [temperature, setTemperature] = useState("");
  const [oxygenSaturation, setOxygenSaturation] = useState("");
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errors, setErrors] = useState({});

  const clearFieldError = (field) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateInputs = () => {
    const newErrors = {};

    if (!bloodPressure.trim()) newErrors.bloodPressure = "Required";
    if (!heartRate.trim()) newErrors.heartRate = "Required";
    if (!temperature.trim()) newErrors.temperature = "Required";
    if (!oxygenSaturation.trim()) newErrors.oxygenSaturation = "Required";

    const hrNum = parseFloat(heartRate);
    if (hrNum && (hrNum < 30 || hrNum > 200)) newErrors.heartRate = "Invalid range (30-200)";

    const tempNum = parseFloat(temperature);
    if (tempNum && (tempNum < 35 || tempNum > 42)) newErrors.temperature = "Invalid range (35-42°C)";

    const o2Num = parseFloat(oxygenSaturation);
    if (o2Num && (o2Num < 50 || o2Num > 100)) newErrors.oxygenSaturation = "Invalid range (50-100%)";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fetch all vitals
  const fetchVitals = useCallback(async (signal) => {
    try {
      setRefreshing(true);
      const res = await api.get("/vitals", { signal });
      if (res.data?.vitals) {
        setVitals(res.data.vitals);
      }
    } catch (error) {
      if (error.name !== 'CanceledError') {
        console.error(error);
        message.error("Failed to fetch vitals");
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchVitals(controller.signal);
    return () => controller.abort();
  }, [fetchVitals]);

  const handleSave = async () => {
    if (!validateInputs()) {
      message.error("Please check all fields");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/vitals", {
        bloodPressure,
        heartRate,
        temperature,
        oxygenSaturation,
      });

      if (res.data?.status === 201) {
        message.success("Vital saved successfully ✓");
        setBloodPressure("");
        setHeartRate("");
        setTemperature("");
        setOxygenSaturation("");
        setErrors({});
        fetchVitals();
      } else {
        message.error(res.data?.message || "Failed to save vital");
      }
    } catch (error) {
      console.error(error);
      message.error("Error saving vital");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/vitals/${id}`);

      if (res.data?.status === 200) {
        message.success("Vital deleted successfully");
        fetchVitals();
      } else {
        message.error(res.data?.message || "Failed to delete vital");
      }
    } catch (error) {
      console.error(error);
      message.error("Error deleting vital");
    }
  };

  // Calculate stats safely with array length checks
  const latestVital = vitals.length > 0 ? vitals[vitals.length - 1] : null;
  const avgHeartRate = vitals.length > 0 
    ? Math.round(vitals.reduce((sum, v) => sum + parseFloat(v.heartRate || 0), 0) / vitals.length)
    : 0;
  const lastRecordedDate = latestVital 
    ? new Date(latestVital.createdAt).toLocaleDateString() 
    : "N/A";

  const columns = [
    {
      title: "Date & Time",
      dataIndex: "createdAt",
      key: "createdAt",
      width: "20%",
      render: (date) => {
        const d = new Date(date);
        return <span className="font-medium">{d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>;
      },
    },
    {
      title: "Blood Pressure",
      dataIndex: "bloodPressure",
      key: "bloodPressure",
      width: "15%",
      render: (text) => <span className="font-semibold text-blue-600">{text} mmHg</span>,
    },
    {
      title: "Heart Rate",
      dataIndex: "heartRate",
      key: "heartRate",
      width: "15%",
      render: (text) => {
        const status = getVitalStatus("heartRate", text);
        const IconComponent = status?.icon;
        const textClass = status ? colorClasses[status.color]?.text : "";
        return (
          <div className="flex items-center gap-2">
            {IconComponent && <IconComponent style={{ color: status.color }} />}
            <span className={`font-semibold ${textClass}`}>{text} bpm</span>
          </div>
        );
      },
    },
    {
      title: "Temperature",
      dataIndex: "temperature",
      key: "temperature",
      width: "15%",
      render: (text) => {
        const status = getVitalStatus("temperature", text);
        const IconComponent = status?.icon;
        const textClass = status ? colorClasses[status.color]?.text : "";
        return (
          <div className="flex items-center gap-2">
            {IconComponent && <IconComponent style={{ color: status.color }} />}
            <span className={`font-semibold ${textClass}`}>{text}°C</span>
          </div>
        );
      },
    },
    {
      title: "O₂ Saturation",
      dataIndex: "oxygenSaturation",
      key: "oxygenSaturation",
      width: "15%",
      render: (text) => {
        const status = getVitalStatus("oxygenSaturation", text);
        const IconComponent = status?.icon;
        const textClass = status ? colorClasses[status.color]?.text : "";
        return (
          <div className="flex items-center gap-2">
            {IconComponent && <IconComponent style={{ color: status.color }} />}
            <span className={`font-semibold ${textClass}`}>{text}%</span>
          </div>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      width: "10%",
      render: (_, record) => (
        <Popconfirm
          title="Delete Vital"
          description="Are you sure you want to delete this record?"
          onConfirm={() => handleDelete(record._id)}
          okText="Yes"
          cancelText="No"
          okButtonProps={{ danger: true }}
        >
          <Button danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="min-h-screen py-6 sm:py-8 px-3 sm:px-4" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2" style={{ color: "var(--text)" }}>
            Track Vitals
          </h1>
          <p className="text-base sm:text-lg" style={{ color: "var(--muted)" }}>Monitor your daily health measurements and track trends</p>
        </div>

        {/* Stats Row */}
        {vitals.length > 0 && (
          <Row gutter={[24, 24]} className="mb-8">
            <Col xs={24} sm={8}>
              <div className="card p-4">
                <Statistic
                  title="Total Recordings"
                  value={vitals.length}
                  prefix={<DashboardOutlined style={{ color: "var(--primary)" }} />}
                  valueStyle={{ color: "var(--primary)", fontSize: "28px", fontWeight: "bold" }}
                />
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div className="card p-4">
                <Statistic
                  title="Average Heart Rate"
                  value={avgHeartRate}
                  suffix="bpm"
                  prefix={<HeartOutlined style={{ color: "var(--danger)" }} />}
                  valueStyle={{ color: "var(--danger)", fontSize: "28px", fontWeight: "bold" }}
                />
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div className="card p-4">
                <Statistic
                  title="Last Recorded"
                  value={lastRecordedDate}
                  prefix={<CheckCircleOutlined style={{ color: "var(--success)" }} />}
                  valueStyle={{ color: "var(--success)", fontSize: "20px", fontWeight: "bold" }}
                />
              </div>
            </Col>
          </Row>
        )}

        {/* Input Form */}
        <div className="card p-6 mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
              <DashboardOutlined style={{ color: "var(--primary)" }} />
              Add New Vital Signs
            </h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Record your health measurements now</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <VitalInputField
              label="Blood Pressure"
              icon={HeartOutlined}
              placeholder="e.g., 120/80"
              value={bloodPressure}
              onChange={(e) => {
                setBloodPressure(e.target.value);
                clearFieldError("bloodPressure");
              }}
              error={errors.bloodPressure}
              unit="mmHg"
              hint="Systolic/Diastolic"
            />

            <VitalInputField
              label="Heart Rate"
              icon={FireOutlined}
              placeholder="e.g., 72"
              value={heartRate}
              fieldKey="heartRate"
              onChange={(e) => {
                setHeartRate(e.target.value);
                clearFieldError("heartRate");
              }}
              error={errors.heartRate}
              unit="bpm"
              hint="Normal: 60-100 bpm"
            />

            <VitalInputField
              label="Temperature"
              icon={FireOutlined}
              placeholder="e.g., 37"
              value={temperature}
              fieldKey="temperature"
              onChange={(e) => {
                setTemperature(e.target.value);
                clearFieldError("temperature");
              }}
              error={errors.temperature}
              unit="°C"
              hint="Normal: 36.5-37.5°C"
            />

            <VitalInputField
              label="Oxygen Saturation"
              icon={DownOutlined}
              placeholder="e.g., 98"
              value={oxygenSaturation}
              fieldKey="oxygenSaturation"
              onChange={(e) => {
                setOxygenSaturation(e.target.value);
                clearFieldError("oxygenSaturation");
              }}
              error={errors.oxygenSaturation}
              unit="%"
              hint="Normal: 95-100%"
            />
          </div>

          <PrimaryButton htmlType="button" isLoading={loading} text={loading ? "Saving..." : "Save Vitals"} onClick={handleSave} />
        </div>

        {/* Vitals History */}
        <div className="card p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <DownOutlined style={{ color: "var(--primary)" }} />
              Vital Records History
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{vitals.length} measurements recorded</p>
          </div>

          {vitals.length === 0 ? (
            <Empty 
              description={
                <div className="text-center py-8">
                  <DashboardOutlined style={{ fontSize: "48px", color: "#CBD5E1", marginBottom: "16px" }} />
                  <p className="text-gray-600 text-lg">No vitals recorded yet</p>
                  <p className="text-gray-500 text-sm">Start by adding your first vital signs above</p>
                </div>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table
                columns={columns}
                dataSource={vitals.map((v, i) => ({ ...v, key: v._id || i }))}
                loading={refreshing}
                pagination={{ 
                  pageSize: 8,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} records`,
                  style: { marginTop: "16px" }
                }}
                rowClassName={(record, index) => index % 2 === 0 ? "bg-white" : "bg-slate-50"}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackVitals;