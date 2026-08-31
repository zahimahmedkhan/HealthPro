import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Row, Col, Button, Spin, Tag } from "antd";
import {
  FileTextOutlined, HeartOutlined, RobotOutlined, UploadOutlined,
  CalendarOutlined, MedicineBoxOutlined, ClockCircleOutlined,
  RightOutlined, PlusOutlined, EyeOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import api from "../../utils/axiosSetup";
import cleanAiSummary from "../../utils/cleanAiSummary";

/* ─── button/link interaction styles ─── */

const DashStyles = () => (
  <style>{`
    .db-btn-primary {
      background-color: var(--primary);
      border-color: var(--primary);
      color: #fff;
      font-weight: 600;
      border-radius: 10px;
      transition: background-color 180ms ease, box-shadow 180ms ease, transform 100ms ease;
    }
    .db-btn-primary:hover {
      filter: brightness(0.88);
      box-shadow: 0 2px 8px rgba(37,99,235,0.18);
      color: #fff;
    }
    .db-btn-primary:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }
    .db-btn-primary:active {
      transform: scale(0.97);
    }
    .db-btn-secondary {
      background-color: transparent;
      border-color: var(--border);
      color: var(--primary);
      font-weight: 500;
      border-radius: 10px;
      transition: background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
    }
    .db-btn-secondary:hover {
      background-color: rgba(37,99,235,0.04);
      border-color: var(--primary);
      color: var(--primary);
    }
    .db-btn-secondary:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }
    .db-link {
      transition: opacity 150ms ease, gap 150ms ease;
    }
    .db-link:hover {
      opacity: 0.7;
    }
    .db-link:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
      border-radius: 4px;
    }
    .db-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      font-size: 13px;
      font-weight: 500;
      border-radius: 10px;
      border: 1px solid var(--border);
      color: var(--text);
      background: transparent;
      text-decoration: none;
      white-space: nowrap;
      transition: background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease, transform 150ms ease;
    }
    .db-chip:hover {
      background-color: rgba(37,99,235,0.04);
      border-color: rgba(37,99,235,0.2);
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
      transform: translateY(-1px);
    }
    .db-chip:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }
    .db-chip:active {
      transform: scale(0.97);
    }
    .db-chip-primary {
      background-color: rgba(37,99,235,0.06);
      border-color: rgba(37,99,235,0.18);
      color: var(--primary);
      font-weight: 600;
    }
    .db-chip-primary:hover {
      background-color: rgba(37,99,235,0.1);
      border-color: rgba(37,99,235,0.3);
    }
  `}</style>
);

/* ─── helpers ─── */

const stripHtml = (html) => {
  if (!html) return "";
  // Remove <style> blocks first (they leak CSS as visible text)
  let cleaned = html.replace(/<style[\s\S]*?<\/style>/gi, "");
  // Remove <script> blocks
  cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, "");
  const tmp = typeof document !== "undefined" ? document.createElement("div") : null;
  if (tmp) { tmp.innerHTML = cleaned; return (tmp.textContent || tmp.innerText || "").trim(); }
  return cleaned.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};

const truncate = (str, len = 120) => !str || str.length <= len ? (str || "") : str.slice(0, len).trimEnd() + "\u2026";
const getGreeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };
const formatDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const formatTime = (d) => new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const groupTimesByPeriod = (times) => {
  const m = [], a = [], e = [];
  for (const t of times) { const [h] = t.split(":").map(Number); if (h < 12) m.push(t); else if (h < 17) a.push(t); else e.push(t); }
  return { morning: m, afternoon: a, evening: e };
};
const formatTimeLabel = (t) => { const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; };

/* ─── icon chip component ─── */

const IconChip = ({ icon: Icon, color, bg, size = 32 }) => (
  <div className="flex items-center justify-center rounded-xl" style={{ width: size, height: size, backgroundColor: bg, flexShrink: 0 }}>
    <Icon style={{ color, fontSize: size * 0.5 }} />
  </div>
);

/* ─── vitals card (anchor) ─── */

const VitalCard = ({ label, value, unit, color }) => (
  <div className="p-3 rounded-lg border" style={{ borderColor: "var(--border)" }}>
    <p className="text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>{label}</p>
    <p className="text-xl font-bold" style={{ color }}>{value}{unit ? ` ${unit}` : ""}</p>
  </div>
);

/* ─── chart ─── */

const VitalsChart = ({ vitals }) => {
  const [metric, setMetric] = useState("heartRate");
  const metrics = useMemo(() => {
    const list = [
      { key: "heartRate", label: "Heart Rate", color: "var(--primary)" },
      { key: "bloodPressure", label: "Blood Pressure", color: "#e11d48" },
      { key: "temperature", label: "Temperature", color: "#d97706" },
      { key: "oxygenSaturation", label: "SpO\u2082", color: "#059669" },
    ];
    return list.filter((m) => {
      if (m.key === "bloodPressure") return vitals.some((v) => v.bloodPressure && v.bloodPressure.includes("/"));
      return vitals.some((v) => { const n = parseFloat(v[m.key]); return !isNaN(n) && n > 0; });
    });
  }, [vitals]);
  useEffect(() => { if (metrics.length > 0 && !metrics.find((m) => m.key === metric)) setMetric(metrics[0].key); }, [metrics, metric]);
  const active = metrics.find((m) => m.key === metric) || metrics[0];
  if (!active) return null;
  const points = useMemo(() => {
    return [...vitals].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map((v) => {
      let val;
      if (active.key === "bloodPressure") { const parts = String(v.bloodPressure).split("/"); val = parseFloat(parts[0]); }
      else val = parseFloat(v[active.key]);
      return isNaN(val) ? null : { val, date: v.createdAt };
    }).filter(Boolean);
  }, [vitals, active]);
  if (points.length < 2) return null;
  const W = 560, H = 180, PAD = { top: 20, right: 16, bottom: 32, left: 44 };
  const cW = W - PAD.left - PAD.right, cH = H - PAD.top - PAD.bottom;
  const vals = points.map((p) => p.val);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (min === max) { min -= 1; max += 1; }
  const range = max - min;
  const xScale = (i) => PAD.left + (i / (points.length - 1)) * cW;
  const yScale = (v) => PAD.top + cH - ((v - min) / range) * cH;
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${xScale(i).toFixed(1)},${yScale(p.val).toFixed(1)}`).join(" ");
  const yTicks = Array.from({ length: 6 }, (_, i) => min + (range * i) / 5);
  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {metrics.map((m) => (
          <button key={m.key} onClick={() => setMetric(m.key)} className="text-xs font-medium px-3 py-1 rounded-full transition-colors"
            style={{ color: metric === m.key ? "white" : "var(--text)", backgroundColor: metric === m.key ? "var(--primary)" : "var(--bg)", border: `1px solid ${metric === m.key ? "var(--primary)" : "var(--border)"}`, cursor: "pointer" }}>{m.label}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 180 }}>
        {yTicks.map((t, i) => (<g key={i}><line x1={PAD.left} y1={yScale(t)} x2={W - PAD.right} y2={yScale(t)} stroke="var(--border)" strokeWidth={0.5} /><text x={PAD.left - 8} y={yScale(t) + 4} textAnchor="end" fontSize={10} fill="var(--muted)">{Math.round(t)}</text></g>))}
        {points.length <= 8 ? points.map((p, i) => (<text key={i} x={xScale(i)} y={H - 6} textAnchor="middle" fontSize={9} fill="var(--muted)">{new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</text>))
          : [0, Math.floor(points.length / 2), points.length - 1].map((i) => (<text key={i} x={xScale(i)} y={H - 6} textAnchor="middle" fontSize={9} fill="var(--muted)">{new Date(points[i].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</text>))}
        <path d={pathD} fill="none" stroke={active.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (<circle key={i} cx={xScale(i)} cy={yScale(p.val)} r={3} fill={active.color} />))}
      </svg>
      {active.key === "bloodPressure" && <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>Showing systolic (top number) values</p>}
    </div>
  );
};

/* ─── main dashboard ─── */

const Dashboard = () => {
  const [vitals, setVitals] = useState([]);
  const [insights, setInsights] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [medications, setMedications] = useState([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState({ vitals: true, insights: true, appointments: true, medications: true, profile: true });
  const sl = (k, v) => setLoading((p) => ({ ...p, [k]: v }));

  const fetchProfile = useCallback(async (s) => {
    try { const r = await api.get("/auth/user-profile", { signal: s }); if (r?.data?.user?.userName) setUserName(r.data.user.userName); }
    catch (e) { if (e?.name !== "CanceledError") console.error("Profile:", e); } finally { sl("profile", false); }
  }, []);
  const fetchVitals = useCallback(async (s) => {
    try { const r = await api.get("/vitals", { signal: s }); setVitals((r.data?.vitals || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))); }
    catch (e) { if (e?.name !== "CanceledError") console.error("Vitals:", e); } finally { sl("vitals", false); }
  }, []);
  const fetchInsights = useCallback(async (s) => {
    try { const r = await api.get("/ai/insights", { signal: s }); setInsights((r.data?.insights || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))); }
    catch (e) { if (e?.name !== "CanceledError") console.error("Insights:", e); } finally { sl("insights", false); }
  }, []);
  const fetchAppts = useCallback(async (s) => {
    try { const r = await api.get("/appointments/my", { signal: s }); setAppointments(r.data?.appointments || []); }
    catch (e) { if (e?.name !== "CanceledError") console.error("Appts:", e); } finally { sl("appointments", false); }
  }, []);
  const fetchMeds = useCallback(async (s) => {
    try { const r = await api.get("/medications", { signal: s }); setMedications(r.data?.reminders || []); }
    catch (e) { if (e?.name !== "CanceledError") console.error("Meds:", e); } finally { sl("medications", false); }
  }, []);

  useEffect(() => {
    const c = new AbortController();
    fetchProfile(c.signal); fetchVitals(c.signal); fetchInsights(c.signal); fetchAppts(c.signal); fetchMeds(c.signal);
    return () => c.abort();
  }, [fetchProfile, fetchVitals, fetchInsights, fetchAppts, fetchMeds]);

  const latestVital = vitals[0] || null;
  const allLoading = Object.values(loading).some(Boolean);
  const latestInsight = insights[0] || null;
  const insightPreview = latestInsight ? truncate(stripHtml(cleanAiSummary(latestInsight.aiSummary)), 120) : "";

  const upcomingAppt = useMemo(() => {
    const now = new Date();
    return appointments.filter((a) => a.status === "confirmed" && new Date(a.dateTime) > now).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))[0] || null;
  }, [appointments]);

  const todayMeds = useMemo(() => {
    const now = new Date(), ts = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return medications.filter((m) => { if (!m.active) return false; const s = new Date(m.startDate); return s <= now && (!m.endDate || new Date(m.endDate) >= ts) && m.times?.length > 0; });
  }, [medications]);

  if (allLoading) return <div className="flex items-center justify-center" style={{ minHeight: 400 }}><Spin size="large" /></div>;

  return (
    <>
    <DashStyles />
    <div className="space-y-5 sm:space-y-6">
      {/* Greeting */}
      <div className="mb-1">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--text)" }}>{getGreeting()} <span className="italic font-semibold"> {userName ? `, ${userName}` : ""}</span></h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Here's your health overview for today.</p>
      </div>

      {/* ── Section 2: Vitals (anchor) + AI Insights ── */}
      <Row gutter={[16, 16]}>
        {/* Vitals Snapshot — ANCHOR CARD */}
        <Col xs={24} lg={12}>
          <div className="card p-6 h-full" style={{ borderColor: "rgba(37,99,235,0.15)", backgroundColor: "rgba(37,99,235,0.02)" }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <IconChip icon={HeartOutlined} color="#2563eb" bg="rgba(37,99,235,0.08)" size={36} />
                <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>Vitals Snapshot</h3>
              </div>
              <Link to="/vitals" className="text-small font-medium flex items-center gap-1.5 db-link" style={{ color: "var(--primary)" }}>View trends <RightOutlined style={{ fontSize: 10 }} /></Link>
            </div>
            {latestVital ? (
              <div className="grid grid-cols-2 gap-3">
                <VitalCard label="Heart Rate" value={latestVital.heartRate} unit="bpm" color="var(--primary)" />
                <VitalCard label="Blood Pressure" value={latestVital.bloodPressure} unit="mmHg" color="#e11d48" />
                <VitalCard label="Temperature" value={latestVital.temperature} unit={"\u00b0C"} color="#d97706" />
                <VitalCard label="SpO\u2082" value={latestVital.oxygenSaturation} unit="%" color="#059669" />
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "rgba(37,99,235,0.08)" }}>
                  <HeartOutlined style={{ fontSize: 24, color: "#2563eb" }} />
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Start tracking your vitals</p>
                <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Record your first vital reading to begin<br />monitoring your health trends.</p>
                <Link to="/vitals"><Button type="primary" size="medium" icon={<PlusOutlined />} className="db-btn-primary">Track your first vital</Button></Link>
              </div>
            )}
          </div>
        </Col>

        {/* AI Insights */}
        <Col xs={24} lg={12}>
          <div className="card p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <IconChip icon={RobotOutlined} color="#6366f1" bg="rgba(99,102,241,0.08)" size={36} />
                <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>AI Insights</h3>
              </div>
              <Link to="/reports" className="text-sm font-medium flex items-center gap-1.5 db-link" style={{ color: "var(--primary)" }}>Review insights <RightOutlined style={{ fontSize: 10}} /></Link>
            </div>
            {latestInsight ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Tag style={{ backgroundColor: "rgba(99,102,241,0.08)", color: "#6366f1", border: 0 }} className="text-xs">{latestInsight.reportType}</Tag>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>{formatDate(latestInsight.createdAt)}</span>
                </div>
                <p className="text-sm font-semibold mb-2" style={{ color: "var(--text)" }}>{latestInsight.reportName}</p>
                <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--muted)" }}>{insightPreview}</p>
                {insights.length > 1 && <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>+{insights.length - 1} additional insight{insights.length > 2 ? "s" : ""}</p>}
                <p className="text-xs italic" style={{ color: "var(--muted)" }}>For information only — discuss concerns with a healthcare professional.</p>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "rgba(99,102,241,0.08)" }}>
                  <RobotOutlined style={{ fontSize: 24, color: "#6366f1" }} />
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--text)" }}>No insights yet</p>
                <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Upload a medical report to receive<br />AI-powered health insights.</p>
                <Link to="/upload-reports"><Button type="primary" size="small" icon={<UploadOutlined />} className="db-btn-primary">Upload a report</Button></Link>
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* ── Section 3: Vitals Trend ── */}
      {vitals.length >= 2 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <IconChip icon={ClockCircleOutlined} color="#2563eb" bg="rgba(37,99,235,0.08)" />
              <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>Vitals Trend</h3>
            </div>
            <Link to="/vitals" className="text-xs font-medium flex items-center gap-1 db-link" style={{ color: "var(--primary)" }}>View all <RightOutlined style={{ fontSize: 10 }} /></Link>
          </div>
          <VitalsChart vitals={vitals} />
        </div>
      )}

      {/* ── Section 4: Recent Report + Upcoming Appointment ── */}
      <Row gutter={[16, 16]}>
        {/* Recent Report */}
        <Col xs={24} lg={12}>
          <div className="card p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <IconChip icon={FileTextOutlined} color="#2563eb" bg="rgba(37,99,235,0.08)" />
                <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>Recent Report</h3>
              </div>
              <Link to="/reports" className="text-small font-medium flex items-center gap-1.5 db-link" style={{ color: "var(--primary)" }}>View all <RightOutlined style={{ fontSize: 10 }} /></Link>
            </div>
            {latestInsight ? (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(37,99,235,0.08)" }}><FileTextOutlined style={{ color: "#2563eb", fontSize: 16 }} /></div>
                  <div className="min-w-0 flex-1"><p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{latestInsight.reportName}</p><p className="text-xs" style={{ color: "var(--muted)" }}>Uploaded {formatDate(latestInsight.createdAt)}</p></div>
                </div>
                <div className="flex items-center gap-2 mb-4"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#059669" }} /><span className="text-xs font-medium" style={{ color: "#059669" }}>Analysis available</span></div>
                <div className="flex gap-2">
                  <Link to="/reports" className="flex-1"><Button block size="medium" icon={<EyeOutlined />} className="db-btn-secondary">View Report</Button></Link>
                  <Link to="/reports" className="flex-1"><Button block size="medium" type="primary" className="db-btn-primary">View Analysis</Button></Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "rgba(37,99,235,0.08)" }}>
                  <FileTextOutlined style={{ fontSize: 24, color: "#2563eb" }} />
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--text)" }}>No reports uploaded yet</p>
                <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Upload your first report to organize<br />and analyze your medical information.</p>
                <Link to="/upload-reports"><Button type="primary" size="small" icon={<UploadOutlined />} className="db-btn-primary">Upload Report</Button></Link>
              </div>
            )}
          </div>
        </Col>

        {/* Upcoming Appointment */}
        <Col xs={24} lg={12}>
          <div className="card p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <IconChip icon={CalendarOutlined} color="#d97706" bg="rgba(217,119,6,0.08)" />
                <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>Upcoming Appointment</h3>
              </div>
              <Link to="/dashboard/appointments" className="text-small font-medium flex items-center gap-1.5 db-link" style={{ color: "var(--primary)" }}>View all <RightOutlined style={{ fontSize: 10 }} /></Link>
            </div>
            {upcomingAppt ? (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(217,119,6,0.08)" }}><CalendarOutlined style={{ color: "#d97706", fontSize: 16 }} /></div>
                  <div className="min-w-0 flex-1"><p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>Dr. {upcomingAppt.doctorId?.userName || "Unknown"}</p><p className="text-xs" style={{ color: "var(--muted)" }}>{formatDate(upcomingAppt.dateTime)}</p></div>
                </div>
                <div className="flex items-center gap-3 mb-3"><span className="text-lg font-bold" style={{ color: "var(--text)" }}>{formatTime(upcomingAppt.dateTime)}</span><Tag color="green" className="text-xs">Confirmed</Tag></div>
                {upcomingAppt.reason && <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>{upcomingAppt.reason}</p>}
                <Link to="/dashboard/appointments"><Button size="small" type="primary" className="db-btn-primary">View appointment</Button></Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "rgba(217,119,6,0.08)" }}>
                  <CalendarOutlined style={{ fontSize: 24, color: "#d97706" }} />
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--text)" }}>No upcoming appointments</p>
                <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Schedule your next appointment when you're ready.</p>
                <Link to="/dashboard/appointments"><Button type="primary" size="medium" icon={<CalendarOutlined />} className="db-btn-primary">Book Appointment</Button></Link>
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* ── Section 5: Medications ── */}
      {todayMeds.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <IconChip icon={MedicineBoxOutlined} color="#059669" bg="rgba(5,150,105,0.08)" />
              <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>Today's Medications</h3>
            </div>
            <Link to="/dashboard/medications" className="text-xs font-medium flex items-center gap-1 db-link" style={{ color: "var(--primary)" }}>View medications <RightOutlined style={{ fontSize: 10 }} /></Link>
          </div>
          <div className="space-y-3">
            {todayMeds.map((med) => {
              const gp = groupTimesByPeriod(med.times || []);
              const periods = [
                { key: "morning", label: "Morning", times: gp.morning },
                { key: "afternoon", label: "Afternoon", times: gp.afternoon },
                { key: "evening", label: "Evening", times: gp.evening },
              ].filter((p) => p.times.length > 0);
              return (
                <div key={med._id} className="p-3 rounded-lg border" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div><span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{med.medicineName}</span>{med.dosage && <span className="text-xs ml-2" style={{ color: "var(--muted)" }}>— {med.dosage}</span>}</div>
                    {med.frequency && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(5,150,105,0.06)", color: "#059669" }}>{med.frequency}</span>}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {periods.map((p) => (
                      <div key={p.key} className="flex items-center gap-1.5">
                        <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>{p.label}:</span>
                        {p.times.map((t) => <span key={t} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>{formatTimeLabel(t)}</span>)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Quick Actions — compact chip strip ── */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1 pb-2">
        <span className="text-xs font-medium mr-0.5" style={{ color: "var(--muted)" }}>Quick Actions:</span>
        <Link to="/upload-reports" className="db-chip db-chip-primary"><PlusOutlined style={{ fontSize: 12 }} /> Upload Report</Link>
        <Link to="/vitals" className="db-chip"><HeartOutlined style={{ fontSize: 12 }} /> Track Vitals</Link>
        <Link to="/reports" className="db-chip"><FileTextOutlined style={{ fontSize: 12 }} /> View Reports</Link>
        <Link to="/dashboard/appointments" className="db-chip"><CalendarOutlined style={{ fontSize: 12 }} /> Book Appointment</Link>
      </div>
    </div>
    </>
  );
};

export default Dashboard;
