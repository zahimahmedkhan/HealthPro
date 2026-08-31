import React from "react";
import { Collapse } from "antd";
import {
  SecurityScanOutlined,
  UploadOutlined,
  FileSearchOutlined,
  HeartOutlined,
  BarChartOutlined,
  LockOutlined,
  CheckCircleOutlined,
  FacebookOutlined,
  TwitterOutlined,
  LinkedinOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";

const features = [
  { title: "Secure Authentication", description: "Protected login with robust token-based access control.", icon: <SecurityScanOutlined /> },
  { title: "AI Health Insights", description: "Receive meaningful feedback from clinical-grade AI analysis.", icon: <FileSearchOutlined /> },
  { title: "Upload Medical Reports", description: "Easily upload and organize your health documents in one place.", icon: <UploadOutlined /> },
  { title: "Track Vital Signs", description: "Monitor blood pressure, heart rate, and more from one dashboard.", icon: <HeartOutlined /> },
  { title: "Health Analytics", description: "Visual summaries and trends help you understand your progress.", icon: <BarChartOutlined /> },
  { title: "Privacy & Security", description: "Patient-first security controls keep your medical data safe.", icon: <LockOutlined /> },
];

const steps = [
  { step: "01", title: "Create Account", description: "Sign up using a secure account and verify your email." },
  { step: "02", title: "Upload Reports", description: "Send your latest medical files directly to the platform." },
  { step: "03", title: "Get AI Insights", description: "Receive fast, actionable health insights from our AI engine." },
  { step: "04", title: "Track Your Health", description: "Use continuous tracking to stay informed and proactive." },
];

const whyChoose = [
  { title: "Reliable health records", description: "Keep all medical information organized and accessible.", icon: <CheckCircleOutlined /> },
  { title: "AI-powered precision", description: "Make better health decisions with intelligent summaries.", icon: <CheckCircleOutlined /> },
  { title: "Clear, modern interface", description: "A calm dashboard designed for fast decision-making.", icon: <CheckCircleOutlined /> },
  { title: "Enterprise level privacy", description: "Data is handled according to strict privacy practices.", icon: <CheckCircleOutlined /> },
];

const faqs = [
  { question: "Is HealthPro free to try?", answer: "Yes. You can explore the platform and evaluate the features before committing." },
  { question: "How are medical documents protected?", answer: "Files are encrypted and stored with access controls that protect patient privacy." },
  { question: "Can I access the dashboard from mobile?", answer: "Yes. The platform is responsive and works on tablets and phones." },
  { question: "How does AI analysis work?", answer: "Our AI extracts key findings from uploaded reports and presents them in a simple summary." },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-white/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/health-icon.svg" alt="HealthPro" className="w-10 h-10" />
            <div>
              <p className="text-lg font-semibold">HealthPro</p>
              <p className="text-xs text-[var(--muted)]">Healthcare, simplified.</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--muted)]">
            <a href="#home" className="transition-colors hover:text-[var(--text)]">Home</a>
            <a href="#features" className="transition-colors hover:text-[var(--text)]">Features</a>
            <a href="#how-it-works" className="transition-colors hover:text-[var(--text)]">About</a>
            <a href="#faq" className="transition-colors hover:text-[var(--text)]">Contact</a>
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/login" className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text)] hover:bg-slate-50 transition">Login</Link>
            <Link to="/signup" className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white shadow-sm hover:bg-slate-900 transition">Sign Up</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <section id="home" className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] items-center">
          <div className="space-y-8">
            <div className="max-w-xl">
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--primary)]">Trusted Healthcare SaaS</p>
              <h1 className="mt-4 text-4xl sm:text-5xl font-semibold" style={{ lineHeight: 1.05 }}>
                Smarter clinical insights for your medical journey.
              </h1>
              <p className="mt-6 text-base text-[var(--muted)] max-w-xl">Securely upload reports, review AI-powered health summaries, and track vital signs with a modern, professional healthcare dashboard.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/signup" className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-6 py-3 text-base font-semibold text-white transition hover:bg-slate-900">Get Started</Link>
              <a href="#features" className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] px-6 py-3 text-base font-semibold text-[var(--text)] transition hover:bg-slate-50">Learn More</a>
            </div>
          </div>

          <div className="rounded-[32px] border border-[var(--border)] bg-white p-8 shadow-sm">
            <div className="h-full flex flex-col justify-between gap-8">
              <div className="rounded-3xl bg-[var(--bg)] p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">Health Summary</p>
                    <h2 className="mt-3 text-xl font-semibold">Monthly check-in</h2>
                  </div>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--primary)] text-white">AI</span>
                </div>
                <div className="space-y-4">
                  <div className="rounded-3xl bg-white p-4 border border-[var(--border)]">
                    <p className="text-sm text-[var(--muted)]">Blood Pressure</p>
                    <p className="mt-2 text-xl font-semibold">118/76</p>
                  </div>
                  <div className="rounded-3xl bg-white p-4 border border-[var(--border)]">
                    <p className="text-sm text-[var(--muted)]">Heart Rate</p>
                    <p className="mt-2 text-xl font-semibold">72 bpm</p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl bg-[var(--primary)] p-6 text-white">
                <p className="text-sm uppercase tracking-[0.3em]">Insight</p>
                <h3 className="mt-3 text-2xl font-semibold">Recommended nurse follow-up</h3>
                <p className="mt-3 text-sm text-slate-100">Patient history and report data indicate a strong preference for continuing preventive care.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mt-24">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--primary)]">Features</p>
            <h2 className="mt-4 text-3xl font-semibold">A modern platform built for clinical confidence.</h2>
            <p className="mt-4 text-base text-[var(--muted)]">Each feature is focused on security, clarity, and measurable health outcomes.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="card h-full border border-[var(--border)] p-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg)] text-[var(--primary)] text-xl">{feature.icon}</div>
                <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm text-[var(--muted)]">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="mt-24">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--primary)]">How It Works</p>
            <h2 className="mt-4 text-3xl font-semibold">Start in four simple steps.</h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((item) => (
              <div key={item.step} className="card border border-[var(--border)] p-6">
                <div className="text-[var(--primary)] text-2xl font-semibold">{item.step}</div>
                <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm text-[var(--muted)]">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-24 grid gap-10 lg:grid-cols-[0.9fr_0.95fr] items-start">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--primary)]">Why Choose Us</p>
            <h2 className="mt-4 text-3xl font-semibold">A trusted approach to digital health.
            </h2>
            <p className="mt-4 text-base text-[var(--muted)] max-w-xl">We deliver the tools you need to manage health information with privacy, reliability, and a clear clinical context.</p>
          </div>
          <div className="grid gap-5">
            {whyChoose.map((item) => (
              <div key={item.title} className="flex gap-4 rounded-3xl border border-[var(--border)] bg-white p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg)] text-[var(--primary)] text-xl">{item.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-24">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--primary)]">Testimonials</p>
          <h2 className="mt-4 text-3xl font-semibold">People are finding clarity in their care.</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <div className="card border border-[var(--border)] p-6">
              <p className="text-sm text-[var(--muted)]">"HealthPro made my health reports easy to understand. The summaries are clear and professional."</p>
              <p className="mt-6 font-semibold">Anna K.</p>
              <p className="text-xs text-[var(--muted)]">Patient</p>
            </div>
            <div className="card border border-[var(--border)] p-6">
              <p className="text-sm text-[var(--muted)]">"The dashboard brings everything together in a clean and calm way. Highly recommended."</p>
              <p className="mt-6 font-semibold">Mark T.</p>
              <p className="text-xs text-[var(--muted)]">Caregiver</p>
            </div>
            <div className="card border border-[var(--border)] p-6">
              <p className="text-sm text-[var(--muted)]">"I trust the secure document uploads and AI insights to keep my medical history organized."</p>
              <p className="mt-6 font-semibold">Sara L.</p>
              <p className="text-xs text-[var(--muted)]">Healthcare Professional</p>
            </div>
          </div>
        </section>

        <section id="faq" className="mt-24 grid gap-10 lg:grid-cols-[0.95fr_0.95fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--primary)]">FAQ</p>
            <h2 className="mt-4 text-3xl font-semibold">Questions answered simply.</h2>
          </div>
          <Collapse ghost bordered={false} expandIconPosition="end" className="space-y-4">
            {faqs.map((item) => (
              <Collapse.Panel key={item.question} header={<span className="text-base font-semibold">{item.question}</span>}>
                <p className="text-sm text-[var(--muted)]">{item.answer}</p>
              </Collapse.Panel>
            ))}
          </Collapse>
        </section>

        <section className="mt-24 rounded-[32px] border border-[var(--border)] bg-white p-10 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--primary)]">Ready to get started?</p>
          <h2 className="mt-4 text-3xl font-semibold">Create your account in minutes.</h2>
          <p className="mt-4 text-base text-[var(--muted)] max-w-2xl mx-auto">Secure signup, fast report uploads, and personalized AI summaries built for modern healthcare.</p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/signup" className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-8 py-4 text-base font-semibold text-white">Create Account</Link>
            <Link to="/login" className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] px-8 py-4 text-base font-semibold text-[var(--text)]">Log In</Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] bg-white py-10">
        <div className="max-w-7xl mx-auto px-6 grid gap-10 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
          <div>
            <div className="flex items-center gap-3">
              <img src="/health-icon.svg" alt="HealthPro" className="w-10 h-10" />
              <div>
                <p className="text-lg font-semibold">HealthPro</p>
                <p className="text-sm text-[var(--muted)]">Modern healthcare for every patient.</p>
              </div>
            </div>
            <p className="mt-6 text-sm text-[var(--muted)]">Build trust with a clean, secure onboarding experience for healthcare users and care teams.</p>
          </div>

          <div>
            <p className="font-semibold">Navigation</p>
            <div className="mt-5 space-y-3 text-sm text-[var(--muted)]">
              <a href="#home" className="block hover:text-[var(--text)]">Home</a>
              <a href="#features" className="block hover:text-[var(--text)]">Features</a>
              <a href="#how-it-works" className="block hover:text-[var(--text)]">About</a>
              <a href="#faq" className="block hover:text-[var(--text)]">Contact</a>
            </div>
          </div>

          <div>
            <p className="font-semibold">Contact</p>
            <p className="mt-5 text-sm text-[var(--muted)]">support@healthpro.com</p>
            <p className="mt-2 text-sm text-[var(--muted)]">+1 (555) 234-6789</p>
            <div className="mt-6 flex items-center gap-4 text-[var(--primary)] text-lg">
              <a href="#" aria-label="Facebook"><FacebookOutlined /></a>
              <a href="#" aria-label="Twitter"><TwitterOutlined /></a>
              <a href="#" aria-label="LinkedIn"><LinkedinOutlined /></a>
            </div>
          </div>
        </div>
        <div className="mt-10 text-center text-sm text-[var(--muted)]">© {new Date().getFullYear()} HealthPro. All rights reserved.</div>
      </footer>
    </div>
  );
};

export default Landing;
