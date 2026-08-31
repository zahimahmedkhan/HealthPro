import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button, Tag, message, Empty, Input, Row, Col, Modal, Divider, Spin, Popconfirm, Space } from "antd";
import {
  FileTextOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  CalendarOutlined,
  TagOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import DOMPurify from "dompurify";
import api from "../../utils/axiosSetup";
import PrimaryButton from "../../components/PrimaryButton";
import cleanAiSummary from "../../utils/cleanAiSummary";

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [previewReport, setPreviewReport] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  const cleanupBodyModalStyles = useCallback(() => {
    if (typeof document === "undefined") return;
    document.body.classList.remove("ant-scrolling-effect");
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("width");
  }, []);

  const fetchReports = useCallback(async (signal) => {
    try {
      setLoading(true);
      const res = await api.get("/ai/insights", { signal });

      if (res.data?.insights) {
        setReports(res.data.insights);
      }
    } catch (error) {
      if (error.name !== 'CanceledError') {
        console.error(error);
        message.error("Failed to fetch reports");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchReports(controller.signal);
    return () => {
      controller.abort();
      cleanupBodyModalStyles();
    };
  }, [fetchReports, cleanupBodyModalStyles]);

  useEffect(() => {
    if (!previewVisible) {
      cleanupBodyModalStyles();
    }
  }, [previewVisible, cleanupBodyModalStyles]);

  // Use useMemo for filtering instead of useEffect + state
  const filteredReports = useMemo(() => {
    let filtered = reports;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (report) =>
          report.reportName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.reportType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter((report) => report.reportType === filterType);
    }

    return filtered;
  }, [reports, searchTerm, filterType]);

  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/ai/insights/${id}`);

      if (res.data?.status === 200) {
        message.success("Report deleted successfully ✓");
        fetchReports();
      } else {
        message.error(res.data?.message || "Failed to delete report");
      }
    } catch (error) {
      console.error(error);
      message.error("Error deleting report");
    }
  };

  const handleView = (report) => {
    setPreviewReport(report);
    setPreviewVisible(true);
  };

  const getTypeColor = (type) => {
    const colors = {
      "blood-test": "blue",
      "x-ray": "orange",
      "ultrasound": "cyan",
      "prescription": "green",
      "other": "purple",
    };
    return colors[type] || "default";
  };

  const getTypeIcon = (type) => {
    const icons = {
      "blood-test": "🩸",
      "x-ray": "🔍",
      "ultrasound": "📡",
      "prescription": "💊",
      "other": "📄",
    };
    return icons[type] || "📋";
  };

  const reportTypes = ["all", ...new Set(reports.map((r) => r.reportType))];

  return (
    <div className="min-h-screen py-6 sm:py-8 px-3 sm:px-4" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2" style={{ color: "#0F4C81" }}>
            My Reports
          </h1>
          <p className="text-base sm:text-lg" style={{ color: "#1F2933" }}>
            Manage and review all your medical reports and AI-generated insights
          </p>
        </div>

        {/* Stats */}
        {reports.length > 0 && (
          <Row gutter={[16, 16]} className="mb-8">
            <Col xs={24} sm={8}>
              <div className="card p-4 text-center">
                <div className="text-3xl font-bold" style={{ color: "var(--primary)" }}>{reports.length}</div>
                <div style={{ color: "var(--muted)" }} className="text-sm">Total Reports</div>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div className="card p-4 text-center">
                <div className="text-3xl font-bold" style={{ color: "var(--success)" }}>{new Set(reports.map((r) => r.reportType)).size}</div>
                <div style={{ color: "var(--muted)" }} className="text-sm">Report Types</div>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div className="card p-4 text-center">
                <div className="text-3xl font-bold" style={{ color: "var(--muted)" }}>
                  {reports.length > 0 
                    ? new Date(reports[reports.length - 1]?.createdAt).toLocaleDateString()
                    : "N/A"}
                </div>
                <div style={{ color: "var(--muted)" }} className="text-sm">Latest Upload</div>
              </div>
            </Col>
          </Row>
        )}

        {/* Search and Filter */}
        <div className="card p-4 mb-12">
          <div className="flex flex-col gap-4">
            <Input placeholder="Search reports by name or type..." prefix={<SearchOutlined />} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} size="large" className="rounded-lg" allowClear />

            <div className="flex flex-wrap gap-2">
              <span className="font-semibold" style={{ color: "var(--muted)" }}>Filter:</span>
              {reportTypes.map((type) => (
                <Tag
                  key={type}
                  color={filterType === type ? undefined : "default"}
                  style={filterType === type ? { backgroundColor: "var(--primary)", color: "white", userSelect: "none" } : { userSelect: "none" }}
                  className="cursor-pointer px-3 py-1 rounded-full transition-all"
                  onClick={() => setFilterType(type)}
                >
                  {type === "all" ? "All Reports" : type.replace("-", " ").toUpperCase()}
                </Tag>
              ))}
            </div>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="mt-16">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spin size="large" />
            </div>
          ) : filteredReports.length === 0 ? (
            <Empty
            description={
              <div className="text-center py-16">
                <FileTextOutlined style={{ fontSize: "64px", color: "#CBD5E1", marginBottom: "16px" }} />
                <p className="text-gray-600 text-lg">
                  {searchTerm || filterType !== "all" ? "No reports match your search" : "No reports uploaded yet"}
                </p>
                <p style={{ color: "#1F2933" }} className="text-sm">
                  {!searchTerm && filterType === "all" && "Upload medical documents to get started"}
                </p>
              </div>
            }
          />
        ) : (
          <Row gutter={[24, 24]}>
            {filteredReports.map((report) => (
              <Col key={report._id} xs={24} sm={24} md={12} lg={8}>
                <div className="card h-full overflow-hidden">
                  {/* Card Header */}
                  <div className="p-4 border-b" style={{ background: 'transparent', borderColor: 'var(--border)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-3xl">{getTypeIcon(report.reportType)}</div>
                      <Tag color={getTypeColor(report.reportType)} className="text-xs font-semibold">
                        {report.reportType.toUpperCase()}
                      </Tag>
                    </div>
                    <h3 className="text-lg font-bold line-clamp-2" style={{ color: "var(--text)" }}>{report.reportName}</h3>
                  </div>

                  {/* Card Body */}
                  <div className="p-4">
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
                        <CalendarOutlined style={{ color: 'var(--border)' }} />
                        {new Date(report.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      {report.uploadedBy && (
                        <div className="flex items-center gap-2 text-sm">
                          <Tag color="blue" className="text-xs">Uploaded by {report.uploadedBy?.userName || 'Lab'}</Tag>
                        </div>
                      )}
                      {report.notes && (
                        <div className="flex items-start gap-2 text-sm" style={{ color: 'var(--muted)' }}>
                          <TagOutlined style={{ color: 'var(--border)', marginTop: 6 }} />
                          <span className="line-clamp-2">{report.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* AI Summary Preview */}
                    <div className="rounded-lg p-3 mb-4 max-h-24 overflow-hidden" style={{ background: 'rgba(2,6,23,0.02)' }}>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                        {cleanAiSummary(report.aiSummary)?.replace(/<[^>]*>/g, "") || "No summary available"}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-4 border-t flex gap-2" style={{ borderColor: 'var(--border)', background: 'transparent' }}>
                    <Button type="primary" icon={<EyeOutlined />} onClick={() => handleView(report)} className="flex-1 rounded-lg" style={{ backgroundColor: 'var(--primary)', borderColor: 'var(--primary)' }}>View</Button>
                    <Popconfirm title="Delete Report" description="Are you sure you want to delete this report?" onConfirm={() => handleDelete(report._id)} okText="Yes" cancelText="No" okButtonProps={{ danger: true }}>
                      <Button danger icon={<DeleteOutlined />} className="rounded-lg" />
                    </Popconfirm>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        title={
          previewReport && (
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getTypeIcon(previewReport.reportType)}</span>
              <span>{previewReport.reportName}</span>
            </div>
          )
        }
        open={previewVisible}
        destroyOnHidden
        onCancel={() => {
          setPreviewVisible(false);
          cleanupBodyModalStyles();
        }}
        width={typeof window !== "undefined" && window.innerWidth < 768 ? "95vw" : 800}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => {
              setPreviewVisible(false);
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
        {previewReport && (
          <div>
            <div className="mb-6 pb-4 border-b">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Type:</span>
                  <Tag color={getTypeColor(previewReport.reportType)} className="ml-2">
                    {previewReport.reportType}
                  </Tag>
                </div>
                <div>
                  <span className="text-gray-600">Date:</span>
                  <span className="ml-2 font-semibold">
                    {new Date(previewReport.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {previewReport.notes && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Notes:</span>
                    <p className="ml-0 mt-1 text-gray-700">{previewReport.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="prose prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(cleanAiSummary(previewReport.aiSummary || "")) }} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Reports;
