import React, { useEffect, useState } from "react";
import { Button, Card, Empty, Input, List, message, Row, Col, Tag, Spin } from "antd";
import { SearchOutlined, UserOutlined, HeartOutlined, FileTextOutlined } from "@ant-design/icons";
import DOMPurify from "dompurify";
import api from "../../utils/axiosSetup";
import cleanAiSummary from "../../utils/cleanAiSummary";

const DoctorPatients = () => {
  const [approvedPatients, setApprovedPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingRecords, setFetchingRecords] = useState(false);

  const fetchApprovedPatients = async () => {
    try {
      const res = await api.get("/access/my-patients");
      const patients = res.data?.patients || [];
      setApprovedPatients(patients);

      if (patients.length > 0 && !selectedPatient) {
        setSelectedPatient(patients[0]);
        fetchPatientRecords(patients[0].patientId);
      }
    } catch (error) {
      console.error("Failed to fetch approved patients", error);
      message.error("Unable to load approved patients");
    }
  };

  const fetchPatientRecords = async (patientId) => {
    if (!patientId) return;

    try {
      setFetchingRecords(true);
      const [vitalsRes, insightsRes] = await Promise.all([
        api.get(`/vitals/patient/${patientId}`),
        api.get(`/ai/insights/patient/${patientId}`),
      ]);

      setVitals(vitalsRes.data?.vitals || []);
      setInsights(insightsRes.data?.insights || []);
    } catch (error) {
      console.error("Failed to fetch patient records", error);
      message.error("Unable to load patient records");
      setVitals([]);
      setInsights([]);
    } finally {
      setFetchingRecords(false);
    }
  };

  useEffect(() => {
    fetchApprovedPatients();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get("/access/search-patient", {
        params: { query: searchQuery },
      });
      setSearchResults(res.data?.patients || []);
    } catch (error) {
      console.error("Search failed", error);
      message.error("Unable to search patients");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async (patientId) => {
    try {
      const res = await api.post("/access/request", { patientId });
      const successMessage = res.data?.message || "Access requested successfully";
      message.success(successMessage);
      setSearchQuery("");
      setSearchResults([]);
      fetchApprovedPatients();
    } catch (error) {
      message.error(error.response?.data?.message || "Unable to request access");
    }
  };

  return (
    <div className="space-y-6 p-2 md:p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold" style={{ color: "var(--text)" }}>My Patients</h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>View approved records and request access to patient data.</p>
      </div>

      <Card className="rounded-xl" bodyStyle={{ padding: 20 }}>
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <Input
            prefix={<SearchOutlined style={{ color: "var(--primary)" }} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient email or username"
            onPressEnter={handleSearch}
            style={{ maxWidth: 420 }}
          />
          <Button type="primary" onClick={handleSearch} loading={loading}>Search</Button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold mb-3" style={{ color: "var(--text)" }}>Patient matches</h4>
            <List
              dataSource={searchResults}
              renderItem={(patient) => (
                <List.Item
                  actions={[
                    <Button type="primary" size="small" onClick={() => handleRequestAccess(patient._id)}>
                      Request Access
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<UserOutlined style={{ fontSize: 20, color: "var(--primary)" }} />}
                    title={patient.userName || "Unnamed patient"}
                    description={patient.email}
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Approved Patients" className="rounded-xl" bodyStyle={{ padding: 12 }}>
            {approvedPatients.length === 0 ? (
              <Empty description="No approved patients yet" />
            ) : (
              <List
                dataSource={approvedPatients}
                renderItem={(patient) => (
                  <List.Item
                    onClick={() => {
                      setSelectedPatient(patient);
                      fetchPatientRecords(patient.patientId);
                    }}
                    style={{ cursor: "pointer", background: selectedPatient?.patientId === patient.patientId ? "rgba(59,130,246,0.05)" : "transparent" }}
                  >
                    <List.Item.Meta
                      avatar={<UserOutlined style={{ color: "var(--primary)" }} />}
                      title={patient.userName || "Patient"}
                      description={patient.email}
                    />
                    <Tag color="green">Approved</Tag>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card className="rounded-xl" bodyStyle={{ padding: 20 }}>
            {!selectedPatient ? (
              <Empty description="Select a patient to view records" />
            ) : fetchingRecords ? (
              <div className="py-10 flex justify-center"><Spin /></div>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>{selectedPatient.userName}</h3>
                <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>{selectedPatient.email}</p>

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <HeartOutlined style={{ color: "var(--primary)" }} />
                      <h4 className="font-semibold" style={{ color: "var(--text)" }}>Vitals</h4>
                    </div>
                    {vitals.length > 0 ? (
                      <List
                        dataSource={vitals}
                        renderItem={(vital) => (
                          <List.Item>
                            <div className="w-full">
                              <div className="flex justify-between mb-2">
                                <span className="text-xs" style={{ color: "var(--muted)" }}>{new Date(vital.createdAt).toLocaleString()}</span>
                              </div>
                              <Row gutter={[8, 8]}>
                                <Col span={12}><Tag color="blue">BP: {vital.bloodPressure}</Tag></Col>
                                <Col span={12}><Tag color="orange">HR: {vital.heartRate} bpm</Tag></Col>
                                <Col span={12}><Tag color="gold">Temp: {vital.temperature}°C</Tag></Col>
                                <Col span={12}><Tag color="green">O₂: {vital.oxygenSaturation}%</Tag></Col>
                              </Row>
                            </div>
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Empty description="No vitals available" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileTextOutlined style={{ color: "var(--primary)" }} />
                      <h4 className="font-semibold" style={{ color: "var(--text)" }}>Reports & Insights</h4>
                    </div>
                    {insights.length > 0 ? (
                      <List
                        dataSource={insights}
                        renderItem={(insight) => (
                          <List.Item>
                            <div className="w-full">
                              <div className="mb-2">
                                <strong>{insight.reportName}</strong>
                                <div className="text-xs" style={{ color: "var(--muted)" }}>{insight.reportType}</div>
                              </div>
                              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(cleanAiSummary(insight.aiSummary)) }} />
                            </div>
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Empty description="No reports available" />
                    )}
                  </div>
                </div>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DoctorPatients;
