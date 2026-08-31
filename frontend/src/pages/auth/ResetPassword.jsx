import React, { useState, useEffect } from "react";
import { Form, message, Input, Steps } from "antd";
import { LockOutlined, SafetyOutlined, LoadingOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

const ResetPassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [otpVerified, setOtpVerified] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const email = searchParams.get("email");

  useEffect(() => {
    if (!email) {
      message.error("Email not provided. Please start from forgot password.");
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  const verifyOtp = async (otp) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/verify-otp/${encodeURIComponent(email)}`,
        { otp }
      );

      if (response.data?.status === 200) {
        setOtpVerified(true);
        setCurrentStep(1);
        message.success("OTP verified successfully!");
      } else {
        message.error(response.data?.message || "Invalid OTP");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      message.error(error.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    if (!otpVerified) {
      // First step: verify OTP
      await verifyOtp(values.otp);
      return;
    }

    // Second step: reset password
    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/new-password/${encodeURIComponent(email)}`,
        { newPassword: values.newPassword }
      );

      if (response.data?.status === 200) {
        message.success("Password reset successfully!");
        form.resetFields();
        setTimeout(() => navigate("/login"), 2000);
      } else {
        message.error(response.data?.message || "Failed to reset password");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      message.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
<>
  <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
    {/* Header Section */}
    <div className="text-center mb-8">
      <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
        {otpVerified ? <LockOutlined className="text-white text-2xl" /> : <SafetyOutlined className="text-white text-2xl" />}
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        {otpVerified ? "Reset Password" : "Verify OTP"}
      </h1>
      <p className="text-gray-500 text-lg">
        {otpVerified 
          ? "Create a new secure password for your account" 
          : `Enter the OTP sent to ${email}`}
      </p>
    </div>

    {/* Progress Steps */}
    <Steps
      current={currentStep}
      size="small"
      className="mb-6"
      items={[
        { title: "Verify OTP", icon: currentStep > 0 ? <CheckCircleOutlined /> : undefined },
        { title: "New Password", icon: currentStep > 1 ? <CheckCircleOutlined /> : undefined },
      ]}
    />

    <Form layout="vertical" form={form} onFinish={onFinish} className="space-y-6">
      {!otpVerified ? (
        /* OTP Verification Step */
        <Form.Item
          label="Enter OTP"
          name="otp"
          rules={[
            { required: true, message: "Please enter the OTP!" },
            { len: 6, message: "OTP must be 6 digits" }
          ]}
          className="font-semibold"
        >
          <Input 
            prefix={<SafetyOutlined className="text-gray-400" />}
            placeholder="Enter 6-digit OTP"
            className="h-12 rounded-lg border-gray-300 hover:border-green-400 focus:border-green-500 transition-colors text-center text-2xl tracking-widest"
            size="large"
            maxLength={6}
          />
        </Form.Item>
      ) : (
        <>
          {/* New Password Field */}
          <Form.Item
            label="New Password"
            name="newPassword"
            rules={[
              { required: true, message: "Please enter your new password!" },
              { min: 8, message: "Password must be at least 8 characters" }
            ]}
            className="font-semibold"
          >
            <Input.Password 
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Enter your new password"
              className="h-12 rounded-lg border-gray-300 hover:border-green-400 focus:border-green-500 transition-colors"
              size="large"
            />
          </Form.Item>

          {/* Confirm Password Field */}
          <Form.Item
            label="Confirm New Password"
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Please confirm your password!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match!"));
                },
              }),
            ]}
            className="font-semibold"
          >
            <Input.Password 
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Confirm your new password"
              className="h-12 rounded-lg border-gray-300 hover:border-green-400 focus:border-green-500 transition-colors"
              size="large"
            />
          </Form.Item>

          {/* Password Requirements */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-700 mb-2">Password Requirements:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                At least 8 characters long
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                Include uppercase and lowercase letters
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                Include at least one number
              </li>
            </ul>
          </div>
        </>
      )}

      {/* Submit Button */}
      <Form.Item className="mb-0">
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl border-0 text-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <LoadingOutlined spin />
              {otpVerified ? "Resetting..." : "Verifying..."}
            </>
          ) : (
            <>
              {otpVerified ? <LockOutlined /> : <SafetyOutlined />}
              {otpVerified ? "Reset Password" : "Verify OTP"}
            </>
          )}
        </button>
      </Form.Item>
    </Form>

    {/* Back to Sign In */}
    <div className="text-center mt-6 pt-6 border-t border-gray-200">
      <p className="text-gray-600">
        Remember your password?{" "}
        <Link
          to="/login"
          className="text-green-600 hover:text-green-700 font-semibold underline hover:no-underline transition-all"
        >
          Back to Sign In
        </Link>
      </p>
    </div>
  </div>
</>
  );
};

export default ResetPassword;
