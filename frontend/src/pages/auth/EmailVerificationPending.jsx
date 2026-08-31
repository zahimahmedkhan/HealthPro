import React from "react";
import { Button } from "antd";
import { MailOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";

const maskEmail = (email) => {
  if (!email) return null;
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const masked =
    local.length <= 2
      ? local[0] + "***"
      : local[0] + "***" + local.slice(-1);
  return `${masked}@${domain}`;
};

export default function EmailVerificationPending() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || null;
  const maskedEmail = maskEmail(email);

  const handleContinue = () => {
    if (email) {
      navigate(`/verify-email/${encodeURIComponent(email)}`);
    }
  };

  return (
    <>
      {/* Icon */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <MailOutlined style={{ fontSize: 28, color: "var(--primary)" }} />
      </div>

      {/* Heading */}
      <h2
        className="text-2xl font-bold text-center mb-2"
        style={{ color: "var(--text)" }}
      >
        Check your email
      </h2>

      {maskedEmail ? (
        <p
          className="text-center text-sm mb-8"
          style={{ color: "var(--muted)" }}
        >
          We sent a verification code to{" "}
          <span className="font-semibold" style={{ color: "var(--text)" }}>
            {maskedEmail}
          </span>
        </p>
      ) : (
        <p
          className="text-center text-sm mb-8"
          style={{ color: "var(--muted)" }}
        >
          We sent a verification code to your email address.
        </p>
      )}

      {/* Primary CTA */}
      <Button
        type="primary"
        size="large"
        block
        onClick={handleContinue}
        disabled={!email}
        icon={<ArrowRightOutlined />}
        className="h-12 text-base font-semibold rounded-lg"
        style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)" }}
      >
        Enter verification code
      </Button>

      {/* Secondary: back to signup */}
      <div className="text-center mt-6">
        <Link
          to="/signup"
          className="text-sm transition-colors"
          style={{ color: "var(--muted)" }}
        >
          Wrong email? Go back to sign up
        </Link>
      </div>

      {/* Quiet sign-in link for already-verified users */}
      <p
        className="text-center text-xs mt-6"
        style={{ color: "var(--muted)" }}
      >
        Already verified?{" "}
        <Link
          to="/login"
          className="font-medium transition-colors"
          style={{ color: "var(--primary)" }}
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
