import React, { useState, useEffect } from "react";
import { Form, message, Input, Button, Divider, Alert } from "antd";
import { MailOutlined, LockOutlined, LoginOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import axios from "axios";
import PrimaryButton from "../../components/PrimaryButton";
import { signInSuccess } from "../../redux/user/userSlice";

const SignIn = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const onFinish = async (values) => {
    try {
      setIsLoading(true);
      setErrors({});

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        values,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = response.data;

      if (data?.status === 200 && data?.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem("refreshToken", data.refreshToken);
        }

        const userPayload = data.user || {
          userName: values.email,
          email: values.email,
          role: "patient",
        };

        localStorage.setItem("user", JSON.stringify(userPayload));
        dispatch(signInSuccess(userPayload));

        message.success("✓ Login successful! Redirecting...", 2);
        setTimeout(() => navigate("/dashboard"), 500);
      } else {
        message.error(data?.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error.response?.data);
      const errorMsg = error.response?.data?.message || "Login failed";
      message.error(errorMsg);
      setErrors({ general: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--primary)" }}>Welcome Back</h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Sign in to your health account</p>
      </div>

      {errors.general && (
        <Alert message={errors.general} type="error" showIcon className="mb-4 rounded-lg" />
      )}

      <Form layout="vertical" form={form} onFinish={onFinish} className="space-y-4">
        <Form.Item label={<span className="font-semibold" style={{ color: "var(--text)" }}>Email Address</span>} name="email" rules={[{ required: true, message: "Please enter your email" }, { type: "email", message: "Enter a valid email address" }]}>
          <Input type="email" prefix={<MailOutlined style={{ color: "var(--primary)" }} />} placeholder="you@example.com" size="large" className="rounded-lg" style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }} />
        </Form.Item>

        <Form.Item label={<span className="font-semibold" style={{ color: "var(--text)" }}>Password</span>} name="password" rules={[{ required: true, message: "Please enter your password" }, { min: 6, message: "Password must be at least 6 characters" }]}>
          <Input.Password prefix={<LockOutlined style={{ color: "var(--primary)" }} />} placeholder="••••••••" size="large" className="rounded-lg" style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }} iconRender={(visible) => (<span style={{ color: visible ? "var(--primary)" : "var(--text)", cursor: "pointer" }}>{visible ? "👁️" : "👁️‍🗨️"}</span>)} />
        </Form.Item>

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium transition-colors" style={{ color: "var(--primary)" }}>Forgot Password?</Link>
        </div>

        <Form.Item>
          <PrimaryButton htmlType="submit" isLoading={isLoading} text={isLoading ? "Signing In..." : "Sign In"} />
        </Form.Item>
      </Form>

      <Divider className="my-6" style={{ borderColor: "var(--border)" }}>
        <span style={{ color: "var(--muted)" }} className="text-sm">New to HealthPro?</span>
      </Divider>

      <Link to="/signup">
        <Button size="large" className="w-full h-12 text-base font-bold rounded-lg transition-all" style={{ color: "var(--primary)", borderColor: "var(--primary)" }}>Create an Account</Button>
      </Link>
    </>
  );
};

export default SignIn;
