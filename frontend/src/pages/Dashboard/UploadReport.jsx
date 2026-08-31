import React, { useCallback, useEffect, useState } from "react";
import { Form, Input, Select, Button, message, Modal, Progress, Steps, Row, Col, Tag, Alert, Divider } from "antd";
import { CloudUploadOutlined, FileOutlined, CheckCircleOutlined, LoadingOutlined, RobotOutlined } from "@ant-design/icons";
import PrimaryButton from "../../components/PrimaryButton";
import DOMPurify from "dompurify";
import PDFUploader from "../../components/PDFUploader";
import { extractPDFText } from "../../utils/pdfUtils";
import api from "../../utils/axiosSetup";
import cleanAiSummary from "../../utils/cleanAiSummary";

const { TextArea } = Input;
const { Option } = Select;

const UploadReportForm = () => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [extractionProgress, setExtractionProgress] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [reportName, setReportName] = useState("");
  const [reportType, setReportType] = useState("");

  const cleanupBodyModalStyles = useCallback(() => {
    if (typeof document === "undefined") return;
    document.body.classList.remove("ant-scrolling-effect");
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("width");
  }, []);

  useEffect(() => {
    return () => {
      cleanupBodyModalStyles();
    };
  }, [cleanupBodyModalStyles]);

  useEffect(() => {
    if (!modalVisible) {
      cleanupBodyModalStyles();
    }
  }, [modalVisible, cleanupBodyModalStyles]);

  const reportTypes = [
    { value: "blood-test", label: "Blood Test", icon: "🩸", color: "red" },
    { value: "x-ray", label: "X-Ray", icon: "🔍", color: "orange" },
    { value: "ultrasound", label: "Ultrasound", icon: "📡", color: "cyan" },
    { value: "prescription", label: "Prescription", icon: "💊", color: "green" },
    { value: "other", label: "Other", icon: "📄", color: "purple" },
  ];

  const getTypeInfo = (value) => {
    return reportTypes.find((t) => t.value === value);
  };

  const onFinish = async (values) => {
    if (fileList.length === 0) {
      message.error("Please upload a PDF file.");
      return;
    }

    if (!values.reportName || !values.reportType) {
      message.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      setCurrentStep(1);

      // Extract PDF text
      let pdfText = "";
      try {
        const progressCallback = (progress) => {
          setExtractionProgress(progress);
        };
        pdfText = await extractPDFText(fileList[0], progressCallback);
        setExtractionProgress("");
      } catch (extractErr) {
        console.error("PDF extraction error:", extractErr);
        setExtractionProgress("");
        message.error("Failed to extract text from PDF: " + extractErr.message);
        setCurrentStep(0);
        return;
      }

      if (!pdfText || pdfText.trim().length === 0) {
        message.error("Failed to extract text from PDF. The PDF might be encrypted or corrupted.");
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

      const res = await api.post("/ai/analyze", payload);

      if (res.data?.status === 200) {
        setCurrentStep(3);
        message.success("✓ Report submitted and analyzed successfully!");
        setAiSummary(res.data.summery);
        setModalVisible(true);
        setFileList([]);
        form.resetFields();
        setReportName("");
        setReportType("");
        setCurrentStep(0);
      } else {
        message.error(res.data?.message || "Submission failed.");
        setCurrentStep(0);
      }
    } catch (err) {
      console.error("Full error object:", err);
      if (err.response?.data?.message) {
        message.error(err.response.data.message);
      } else if (err.response?.status === 401) {
        message.error("Unauthorized. Please login again.");
      } else if (err.response?.status === 500) {
        message.error("Server error. Please try again later.");
      } else {
        message.error(err.message || "Submission failed. Try again.");
      }
      setCurrentStep(0);
    } finally {
      setLoading(false);
    }
  };

  const colorMap = { red: "var(--danger)", orange: "var(--warning)", cyan: "var(--primary)", green: "var(--success)", purple: "var(--primary)" };

  return (
    <div className="min-h-screen py-6 sm:py-8 px-3 sm:px-4" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2" style={{ color: "#0F4C81" }}>
            Upload Medical Report
          </h1>
          <p className="text-base sm:text-lg" style={{ color: "#1F2933" }}>
            Upload your medical documents and get instant AI-powered analysis
          </p>
        </div>

        {/* Process Steps */}
        {loading && (
          <div className="card p-4 mb-6">
            <Steps
              current={currentStep}
              items={[
                { title: "Extract", description: "Extracting text from PDF", icon: currentStep > 0 ? <CheckCircleOutlined /> : <LoadingOutlined /> },
                { title: "Process", description: "Processing with AI", icon: currentStep > 1 ? <CheckCircleOutlined /> : currentStep === 1 ? <LoadingOutlined /> : undefined },
                { title: "Analyze", description: "Generating insights", icon: currentStep > 2 ? <CheckCircleOutlined /> : currentStep === 2 ? <LoadingOutlined /> : undefined },
              ]}
              status={loading ? "process" : "finish"}
            />
            {extractionProgress && currentStep === 1 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm" style={{ color: "var(--muted)", marginBottom: 8 }}>{extractionProgress}</p>
              </div>
            )}
          </div>
        )}

        {/* Main Form */}
        <div className="card overflow-hidden p-7">
          {/* Header Section */}
          <div className="p-6 mb-6 flex items-center gap-4">
            <CloudUploadOutlined style={{ fontSize: 28, color: "var(--primary)" }} />
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Add New Report</h2>
              <p style={{ color: "var(--muted)" }}>Fill in the details and upload your medical document</p>
            </div>
          </div>

          <Form form={form} layout="vertical" onFinish={onFinish} disabled={loading}>
            {/* Report Name & Type Row */}
            <Row gutter={[16, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <span className="text-base font-semibold flex items-center gap-2">
                      <FileOutlined />
                      Report Name
                    </span>
                  }
                  name="reportName"
                  rules={[
                    { required: true, message: "Please enter report name" },
                    { min: 3, message: "Report name must be at least 3 characters" },
                  ]}
                >
                  <Input placeholder="e.g., Monthly Blood Test" size="large" className="rounded-lg" value={reportName} onChange={(e) => setReportName(e.target.value)} />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <span className="text-base font-semibold flex items-center gap-2">
                      <Tag>TYPE</Tag>
                      Report Type
                    </span>
                  }
                  name="reportType"
                  rules={[{ required: true, message: "Please select report type" }]}
                >
                  <Select placeholder="Select report type" size="large" className="rounded-lg" value={reportType} onChange={setReportType} optionLabelProp="label">
                    {reportTypes.map((type) => (
                      <Option key={type.value} value={type.value} label={
                        <div className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </div>
                      }>
                        <div className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </div>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* Type Preview */}
            {reportType && (
              <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: "transparent", borderLeft: `4px solid ${colorMap[getTypeInfo(reportType)?.color] || 'var(--primary)'}` }}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getTypeInfo(reportType)?.icon}</span>
                  <div>
                    <p className="font-semibold" style={{ color: "var(--text)" }}>{getTypeInfo(reportType)?.label} Report Selected</p>
                    <p className="text-sm" style={{ color: "var(--muted)" }}>Your report will be analyzed as a {getTypeInfo(reportType)?.label.toLowerCase()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <Form.Item label={<span className="text-base font-semibold">Additional Notes (Optional)</span>} name="notes">
              <TextArea rows={3} placeholder="Add any notes about this report (allergies, medications, symptoms, etc.)" maxLength={500} showCount className="rounded-lg" />
            </Form.Item>

            <Divider />

            {/* File Upload */}
            <Form.Item label={<span className="text-base font-semibold flex items-center gap-2"><CloudUploadOutlined /> Upload PDF Document</span>}>
              <PDFUploader fileList={fileList} setFileList={setFileList} />
            </Form.Item>

            {fileList.length > 0 && (
              <Alert message={`✓ ${fileList[0].name} ready to upload (${(fileList[0].size / 1024 / 1024).toFixed(2)} MB)`} type="success" showIcon className="mb-6 rounded-lg" />
            )}

            {/* Submit Button */}
            <div className="flex gap-3">
              <PrimaryButton htmlType="submit" isLoading={loading} text={loading ? "Processing..." : "Analyze with AI"} disabled={fileList.length === 0} />
              <Button className="h-12 text-base font-semibold rounded-lg" onClick={() => { form.resetFields(); setFileList([]); setReportName(""); setReportType(""); }} disabled={loading}>Clear</Button>
            </div>
          </Form>
        </div>

        {/* Info Cards */}
        <Row gutter={[16, 16]} className="mt-8">
          <Col xs={24} sm={12}>
            <div className="card p-4">
              <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: "var(--text)" }}>
                <CheckCircleOutlined style={{ color: "var(--success)" }} />
                Supported Formats
              </h3>
              <p className="text-sm" style={{ color: "var(--muted)" }}>PDF documents (up to 10MB)</p>
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div className="card p-4">
              <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: "var(--text)" }}>
                <RobotOutlined style={{ color: "var(--primary)" }} />
                AI Analysis
              </h3>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Get instant insights, findings & recommendations</p>
            </div>
          </Col>
        </Row>
      </div>

      {/* AI Summary Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <RobotOutlined className="text-blue-600" />
            <span>AI Analysis Results</span>
          </div>
        }
        open={modalVisible}
        destroyOnHidden
        onCancel={() => {
          setModalVisible(false);
          cleanupBodyModalStyles();
        }}
        width={typeof window !== "undefined" && window.innerWidth < 768 ? "95vw" : 800}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => {
              setModalVisible(false);
              cleanupBodyModalStyles();
            }}
            size="large"
            className="rounded-lg"
          >
            Close
          </Button>,
        ]}
        styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
        className="rounded-xl"
        afterOpenChange={(open) => {
          if (!open) cleanupBodyModalStyles();
        }}
      >
        <div className="prose prose-sm max-w-none">
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(cleanAiSummary(aiSummary || "")) }} />
        </div>
      </Modal>
    </div>
  );
};

export default UploadReportForm;
