import React, { useState, useCallback, useEffect, useRef } from "react";
import { Button, Alert, Result } from "antd";
import { SafetyCertificateOutlined } from "@ant-design/icons";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import PrimaryButton from "../../components/PrimaryButton";

const RESEND_COOLDOWN = 60; // seconds

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

const EmailVerification = () => {
  const { email } = useParams();
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("input"); // "input" | "success" | "error"
  const [errorMessage, setErrorMessage] = useState("");

  // Resend state
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState(null); // { type: 'success'|'error', text: '' }
  const timerRef = useRef(null);

  const decodedEmail = email ? decodeURIComponent(email) : null;
  const maskedEmail = maskEmail(decodedEmail);

  // Countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;

    timerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [resendCooldown]);

  const handleVerify = useCallback(
    async (otpValue) => {
      if (!decodedEmail) {
        setStatus("error");
        setErrorMessage("No email address provided. Please sign up again.");
        return;
      }

      if (!otpValue || otpValue.length !== 6) {
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/verify-email/${decodedEmail}`,
          { otp: otpValue }
        );

        if (data.success || data.status === 200) {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMessage(
            data.message || "That code is incorrect or has expired."
          );
        }
      } catch (error) {
        console.error("Verification error:", error);
        const msg =
          error.response?.data?.message ||
          "That code is incorrect or has expired.";
        setStatus("error");
        setErrorMessage(msg);
      } finally {
        setLoading(false);
      }
    },
    [decodedEmail]
  );

  const handleResend = useCallback(async () => {
    if (!decodedEmail || resendCooldown > 0) return;

    try {
      setResendLoading(true);
      setResendMessage(null);

      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/resend-otp/${decodedEmail}`
      );

      setResendMessage({
        type: "success",
        text: data.message || "New code sent",
      });
      setResendCooldown(RESEND_COOLDOWN);
      setOtp("");
      setStatus("input");
      setErrorMessage("");
    } catch (error) {
      console.error("Resend error:", error);
      const msg =
        error.response?.data?.message || "Failed to resend code.";
      setResendMessage({ type: "error", text: msg });

      // If rate-limited, sync the cooldown with the backend's wait time
      if (error.response?.status === 429) {
        setResendCooldown(RESEND_COOLDOWN);
      }
    } finally {
      setResendLoading(false);
    }
  }, [decodedEmail, resendCooldown]);

  // Auto-submit when 6 digits are entered
  useEffect(() => {
    if (otp.length === 6 && status === "input") {
      handleVerify(otp);
    }
  }, [otp, status, handleVerify]);

  // Redirect to login after success
  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => navigate("/login"), 2500);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  // Clear resend message after 5 seconds
  useEffect(() => {
    if (resendMessage) {
      const timer = setTimeout(() => setResendMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [resendMessage]);

  // --- Success state ---
  if (status === "success") {
    return (
      <Result
        status="success"
        title="Email verified!"
        subTitle={
          <span style={{ color: "var(--muted)" }}>
            Your account is ready. Redirecting to sign in…
          </span>
        }
        extra={
          <Link to="/login">
            <Button
              type="primary"
              className="h-10 rounded-lg font-semibold"
              style={{
                backgroundColor: "var(--primary)",
                borderColor: "var(--primary)",
              }}
            >
              Sign In Now
            </Button>
          </Link>
        }
        style={{ padding: "24px 0" }}
      />
    );
  }

  // --- Input / Error state ---
  return (
    <>
      {/* Icon */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <SafetyCertificateOutlined
          style={{ fontSize: 28, color: "var(--primary)" }}
        />
      </div>

      {/* Heading */}
      <h2
        className="text-2xl font-bold text-center mb-2"
        style={{ color: "var(--text)" }}
      >
        Enter verification code
      </h2>

      {maskedEmail ? (
        <p
          className="text-center text-sm mb-2"
          style={{ color: "var(--muted)" }}
        >
          Enter the 6-digit code sent to{" "}
          <span className="font-semibold" style={{ color: "var(--text)" }}>
            {maskedEmail}
          </span>
        </p>
      ) : (
        <p
          className="text-center text-sm mb-2"
          style={{ color: "var(--muted)" }}
        >
          Enter the 6-digit code sent to your email.
        </p>
      )}

      {/* Error alert */}
      {status === "error" && errorMessage && (
        <Alert
          message={errorMessage}
          type="error"
          showIcon
          closable
          onClose={() => {
            setStatus("input");
            setErrorMessage("");
            setOtp("");
          }}
          className="mb-6 rounded-lg"
        />
      )}

      {/* OTP Input */}
      <div className="flex justify-center my-8">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "").slice(0, 6);
            setOtp(val);
            if (status === "error") {
              setStatus("input");
              setErrorMessage("");
            }
          }}
          disabled={loading}
          autoFocus
          placeholder="000000"
          className="w-full text-center text-2xl font-mono tracking-[0.5em] py-3 px-4 rounded-lg border outline-none transition-colors"
          style={{
            backgroundColor: "var(--bg)",
            borderColor: status === "error" ? "var(--danger, #ef4444)" : "var(--border)",
            color: "var(--text)",
            caretColor: "var(--primary)",
          }}
        />
      </div>

      {/* Submit */}
      <PrimaryButton
        htmlType="button"
        isLoading={loading}
        text={loading ? "Verifying…" : "Verify Code"}
        disabled={otp.length !== 6 || loading}
        onClick={() => handleVerify(otp)}
      />

      {/* Resend message feedback */}
      {resendMessage && (
        <div className="mt-4">
          <Alert
            message={resendMessage.text}
            type={resendMessage.type}
            showIcon
            closable
            onClose={() => setResendMessage(null)}
            className="rounded-lg"
          />
        </div>
      )}

      {/* Resend code link */}
      <div className="text-center mt-5">
        {resendCooldown > 0 ? (
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            Resend code in {resendCooldown}s
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading}
            className="text-xs font-medium transition-colors disabled:opacity-50"
            style={{ color: "var(--primary)", background: "none", border: "none", cursor: "pointer" }}
          >
            {resendLoading ? "Sending…" : "Resend code"}
          </button>
        )}
      </div>

      {/* Footer links */}
      <div className="text-center mt-4 space-y-2">
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          Didn't receive a code? Check your spam folder or{" "}
          <Link
            to="/signup"
            className="font-medium"
            style={{ color: "var(--primary)" }}
          >
            try signing up again
          </Link>
        </p>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          Already verified?{" "}
          <Link
            to="/login"
            className="font-medium"
            style={{ color: "var(--primary)" }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </>
  );
};

export default EmailVerification;
