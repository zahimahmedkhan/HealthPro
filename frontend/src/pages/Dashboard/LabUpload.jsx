import React, { useEffect, useState, useCallback } from "react";
import {
  Button,
  Card,
  Empty,
  Input,
  List,
  message,
  Row,
  Col,
  Tag,
  Spin,
  Form,
  Select,
  Modal,
  Steps,
  Alert,
  Divider,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  CloudUploadOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  RobotOutlined,
  FileOutlined,
} from "@ant-design/icons";
import DOMPurify from "dompurify";
import api from "../../utils/axiosSetup";
import cleanAiSummary from "../../utils/cleanAiSummary";
import PDFUploader from "../../components/PDFUploader";
import { extractPDFText } from "../../utils/pdfUtils";

const { TextArea } = Input;
const { Option } = Select;

const reportTypes = [
  { value: "blood-test", label: "Blood Test", icon: "🩸" },
  { value: "x-ray", label: "X-Ray", icon: "🔍" },
  { value: "ultrasound", label: "Ultrasound", icon: "📡" },
  { value: "prescription", label: "Prescription", icon: "💊" },
  { value: "other", label: "Other", icon: "📄" },
];

const LabUpload = () => {
  const [approvedPatients, setApprovedPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Upload form state
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [extractionProgress, setExtractionProgress] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const cleanupBodyModalStyles = useCallback(() => {
    if (typeof document === "undefined") return;
    document.body.classList.remove("ant-scrolling-effect");
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("width");
  }, []);

  useEffect(() => {
    return () => cleanupBodyModalStyles();
  }, [cleanupBodyModalStyles]);

  useEffect(() => {
    if (!modalVisible) cleanupBodyModalStyles();
  }, [modalVisible, cleanupBodyModalStyles]);

  const fetchApprovedPatients = async () => {
    try {
      const res = await api.get("/access/my-patients");
      setApprovedPatients(res.data?.patients || []);
    } catch (error) {
      console.error("Failed to fetch approved patients", error);
      message.error("Unable to load approved patients");
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
      message.success(res.data?.message || "Access requested successfully");
      setSearchQuery("");
      setSearchResults([]);
      fetchApprovedPatients();
    } catch (error) {
      message.error(error.response?.data?.message || "Unable to request access");
    }
  };

  const handleUpload = async (values) => {
    if (fileList.length === 0) {
      message.error("Please upload a PDF file.");
      return;
    }
    if (!selectedPatient) {
      message.error("Please select a patient first.");
      return;
    }

    try {
      setUploading(true);
      setCurrentStep(1);

      // Extract PDF text
      let pdfText = "";
      try {
        pdfText = await extractPDFText(fileList[0], (progress) => {
          setExtractionProgress(progress);
        });
        setExtractionProgress("");
      } catch (extractErr) {
        console.error("PDF extraction error:", extractErr);
        setExtractionProgress("");
        message.error("Failed to extract text from PDF: " + extractErr.message);
        setCurrentStep(0);
        return;
      }

      if (!pdfText || pdfText.trim().length === 0) {
        message.error("Failed to extract text from PDF.");
        setCurrentStep(0);
        return;
      }

      setCurrentStep(2);

      const payload = {
        reportName: values.reportName,
        reportType: values.reportType,
        notes: values.notes || "",
        pdfText,
      };

      const res = await api.post(
        `/lab/upload/${selectedPatient.patientId}`,
        payload
      );

      if (res.data?.status === 200) {
        setCurrentStep(3);
        message.success("✓ Report uploaded and analyzed successfully!");
        setAiSummary(res.data.summery);
        setModalVisible(true);
        setFileList([]);
        form.resetFields();
        setCurrentStep(0);
      } else {
        message.error(res.data?.message || "Upload failed.");
        setCurrentStep(0);
      }
    } catch (err) {
      console.error("Upload error:", err);
      if (err.response?.data?.message) {
        message.error(err.response.data.message);
      } else {
        message.error(err.message || "Upload failed. Try again.");
      }
      setCurrentStep(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 p-2 md:p-4">
      <div className="mb-4">
        <h2
          className="text-2xl font-bold"
          style={{ color: "var(--text)" }}
        >
          Upload for Patients
        </h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Search for patients, request access, and upload lab reports on their
          behalf.
        </p>
      </div>

      {/* Search Card */}
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
          <Button type="primary" onClick={handleSearch} loading={loading}>
            Search
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4">
            <h4
              className="font-semibold mb-3"
              style={{ color: "var(--text)" }}
            >
              Patient matches
            </h4>
            <List
              dataSource={searchResults}
              renderItem={(patient) => (
                <List.Item
                  actions={[
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => handleRequestAccess(patient._id)}
                    >
                      Request Access
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <UserOutlined
                        style={{ fontSize: 20, color: "var(--primary)" }}
                      />
                    }
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
        {/* Approved Patients Sidebar */}
        <Col xs={24} lg={8}>
          <Card
            title="Approved Patients"
            className="rounded-xl"
            bodyStyle={{ padding: 12 }}
          >
            {approvedPatients.length === 0 ? (
              <Empty description="No approved patients yet" />
            ) : (
              <List
                dataSource={approvedPatients}
                renderItem={(patient) => (
                  <List.Item
                    onClick={() => setSelectedPatient(patient)}
                    style={{
                      cursor: "pointer",
                      background:
                        selectedPatient?.patientId === patient.patientId
                          ? "rgba(59,130,246,0.05)"
                          : "transparent",
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <UserOutlined style={{ color: "var(--primary)" }} />
                      }
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

        {/* Upload Form */}
        <Col xs={24} lg={16}>
          <Card className="rounded-xl" bodyStyle={{ padding: 20 }}>
            {!selectedPatient ? (
              <Empty description="Select a patient to upload a report" />
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <CloudUploadOutlined
                    style={{ fontSize: 24, color: "var(--primary)" }}
                  />
                  <div>
                    <h3
                      className="text-lg font-bold"
                      style={{ color: "var(--text)" }}
                    >
                      Upload Report for {selectedPatient.userName}
                    </h3>
                    <p className="text-sm" style={{ color: "var(--muted)" }}>
                      {selectedPatient.email}
                    </p>
                  </div>
                </div>

                {/* Processing Steps */}
                {uploading && (
                  <div className="mb-6">
                    <Steps
                      current={currentStep}
                      items={[
                        {
                          title: "Extract",
                          description: "Extracting text",
                          icon:
                            currentStep > 0 ? (
                              <CheckCircleOutlined />
                            ) : (
                              <LoadingOutlined />
                            ),
                        },
                        {
                          title: "Process",
                          description: "AI analysis",
                          icon:
                            currentStep > 1 ? (
                              <CheckCircleOutlined />
                            ) : currentStep === 1 ? (
                              <LoadingOutlined />
                            ) : undefined,
                        },
                        {
                          title: "Complete",
                          description: "Saving results",
                          icon:
                            currentStep > 2 ? (
                              <CheckCircleOutlined />
                            ) : currentStep === 2 ? (
                              <LoadingOutlined />
                            ) : undefined,
                        },
                      ]}
                      status={uploading ? "process" : "finish"}
                    />
                    {extractionProgress && currentStep === 1 && (
                      <p
                        className="text-sm mt-3"
                        style={{ color: "var(--muted)" }}
                      >
                        {extractionProgress}
                      </p>
                    )}
                  </div>
                )}

                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleUpload}
                  disabled={uploading}
                >
                  <Row gutter={[16, 0]}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={
                          <span className="font-semibold flex items-center gap-2">
                            <FileOutlined /> Report Name
                          </span>
                        }
                        name="reportName"
                        rules={[
                          { required: true, message: "Enter report name" },
                          {
                            min: 3,
                            message: "At least 3 characters",
                          },
                        ]}
                      >
                        <Input placeholder="e.g., Complete Blood Count" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={
                          <span className="font-semibold">Report Type</span>
                        }
                        name="reportType"
                        rules={[
                          { required: true, message: "Select report type" },
                        ]}
                      >
                        <Select placeholder="Select type">
                          {reportTypes.map((type) => (
                            <Option key={type.value} value={type.value}>
                              <span className="flex items-center gap-2">
                                <span>{type.icon}</span>
                                <span>{type.label}</span>
                              </span>
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    label={<span className="font-semibold">Notes (Optional)</span>}
                    name="notes"
                  >
                    <TextArea
                      rows={3}
                      placeholder="Additional notes about this report"
                      maxLength={500}
                      showCount
                    />
                  </Form.Item>

                  <Divider />

                  <Form.Item
                    label={
                      <span className="font-semibold flex items-center gap-2">
                        <CloudUploadOutlined /> Upload PDF
                      </span>
                    }
                  >
                    <PDFUploader fileList={fileList} setFileList={setFileList} />
                  </Form.Item>

                  {fileList.length > 0 && (
                    <Alert
                      message={`✓ ${fileList[0].name} ready (${(
                        fileList[0].size /
                        1024 /
                        1024
                      ).toFixed(2)} MB)`}
                      type="success"
                      showIcon
                      className="mb-4"
                    />
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={uploading}
                      disabled={fileList.length === 0}
                      icon={<CloudUploadOutlined />}
                      className="mt-3"
                    >
                      {uploading ? "Processing..." : "Upload & Analyze"}
                    </Button>
                    <Button
                      onClick={() => {
                        form.resetFields();
                        setFileList([]);
                      }}
                      disabled={uploading}
                      className="mt-3"
                    >
                      Clear
                    </Button>
                  </div>
                </Form>
              </>
            )}
          </Card>
        </Col>
      </Row>

      {/* AI Summary Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <RobotOutlined style={{ color: "var(--primary)" }} />
            <span>AI Analysis Results</span>
          </div>
        }
        open={modalVisible}
        destroyOnHidden
        onCancel={() => {
          setModalVisible(false);
          cleanupBodyModalStyles();
        }}
        width={
          typeof window !== "undefined" && window.innerWidth < 768
            ? "95vw"
            : 800
        }
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => {
              setModalVisible(false);
              cleanupBodyModalStyles();
            }}
          >
            Close
          </Button>,
        ]}
        styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
        afterOpenChange={(open) => {
          if (!open) cleanupBodyModalStyles();
        }}
      >
        <div className="prose prose-sm max-w-none">
          <div
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(cleanAiSummary(aiSummary || "")),
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default LabUpload;
