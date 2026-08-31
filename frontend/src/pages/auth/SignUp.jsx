import React, { useState, useEffect } from "react";
import { Form, Input, Button, Divider, Alert, Upload, Avatar as AvatarComponent, Select } from "antd";
import { UserOutlined, MailOutlined, LockOutlined, CameraOutlined, LockFilled } from "@ant-design/icons";
import { showError, showSuccess } from "../../utils/toast";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import PrimaryButton from "../../components/PrimaryButton";

const apiUrl = import.meta.env.VITE_API_URL;
const { Option } = Select;

const SignUp = () => {
  const [form] = Form.useForm();
  const [isLoading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [selectedRole, setSelectedRole] = useState("patient");
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const beforeAvatarUpload = (file) => {
    if (!file.type.startsWith("image/")) {
      showError("Please upload an image file");
      return Upload.LIST_IGNORE;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError("File size must be less than 5MB");
      return Upload.LIST_IGNORE;
    }

    setAvatarFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);

    return false;
  };

  const validatePassword = (pwd) => {
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    return hasUpper && hasLower && hasNumber && pwd.length >= 8;
  };

  const onFinish = async (value) => {
    try {
      if (!validatePassword(value.password)) {
        setErrors({ password: "Password must be at least 8 characters with uppercase, lowercase, and number" });
        return;
      }

      if (value.password !== value.confirmPassword) {
        setErrors({ confirmPassword: "Passwords don't match" });
        return;
      }

      if ((value.role === "doctor" || value.role === "lab") && !value.specialization && value.role === "doctor") {
        setErrors({ specialization: "Specialization is required for doctor registration" });
        return;
      }

      if ((value.role === "doctor" || value.role === "lab") && !value.licenseNumber && value.role === "doctor") {
        setErrors({ licenseNumber: "License number is required for doctor registration" });
        return;
      }

      if (value.role === "lab" && !value.labName) {
        setErrors({ labName: "Lab name is required for lab registration" });
        return;
      }

      if (value.role === "lab" && !value.labLicenseNumber) {
        setErrors({ labLicenseNumber: "Lab license number is required for lab registration" });
        return;
      }

      setLoading(true);
      setErrors({});

      const payload = {
        userName: value.name,
        email: value.email,
        password: value.password,
        role: value.role || "patient",
        specialization: value.specialization || undefined,
        licenseNumber: value.licenseNumber || undefined,
        labName: value.labName || undefined,
        labLicenseNumber: value.labLicenseNumber || undefined,
      };

      const requestConfig = {
        withCredentials: true,
      };

      let requestBody = payload;

      if (avatarFile) {
        const formData = new FormData();
        formData.append("userName", value.name);
        formData.append("email", value.email);
        formData.append("password", value.password);
        formData.append("role", value.role || "patient");
        if (value.specialization) formData.append("specialization", value.specialization);
        if (value.licenseNumber) formData.append("licenseNumber", value.licenseNumber);
        if (value.labName) formData.append("labName", value.labName);
        if (value.labLicenseNumber) formData.append("labLicenseNumber", value.labLicenseNumber);
        formData.append("avatar", avatarFile);
        requestBody = formData;
        requestConfig.headers = {
          "Content-Type": "multipart/form-data",
        };
      }

      const res = await axios.post(
        `${apiUrl}/auth/register`,
        requestBody,
        requestConfig
      );

      if (res.data?.status === 201) {
        form.resetFields();
        setSelectedRole("patient");
        setAvatarFile(null);
        setAvatarPreview(null);
        const successMessage = (res.data.message || "✓ Registration successful!") + (value.role === "doctor" || value.role === "lab" ? " Your account is pending verification." : "");
        showSuccess(successMessage);
        setTimeout(() => {
          navigate("/auth/email-verification", { state: { email: value.email } });
        }, 2000);
      } else {
        showError(res.data?.message || "Registration failed");
      }
    } catch (error) {
      console.error("Signup error:", error);
      const errorMsg = error.response?.data?.message || "Registration failed";
      showError(errorMsg);
      setErrors({ general: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--primary)" }}>Create Account</h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Join HealthPro and start managing your health</p>
      </div>

      {errors.general && (
        <Alert message={errors.general} type="error" showIcon className="mb-4 rounded-lg" />
      )}

      <Form layout="vertical" form={form} onFinish={onFinish} autoComplete="off" className="space-y-4" initialValues={{ role: "patient" }}>
        <div className="flex flex-col items-center mb-4">
          <div className="relative">
            <AvatarComponent size={80} src={avatarPreview} icon={<UserOutlined />} style={{ backgroundColor: "var(--primary)" }} />
            <Upload maxCount={1} accept="image/*" beforeUpload={beforeAvatarUpload} showUploadList={false}>
              <div className="absolute bottom-0 right-0 rounded-full p-2 cursor-pointer hover:opacity-80 transition-opacity" style={{ backgroundColor: "var(--success)" }}>
                <CameraOutlined className="text-white text-lg" />
              </div>
            </Upload>
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>Upload your photo (optional)</p>
        </div>

        <Form.Item label={<span className="font-semibold" style={{ color: "var(--text)" }}>I am registering as</span>} name="role" rules={[{ required: true, message: "Please select a role" }]}>
          <Select size="large" value={selectedRole} onChange={(value) => { setSelectedRole(value); form.setFieldValue("role", value); }}>
            <Option value="patient">Patient</Option>
            <Option value="doctor">Doctor</Option>
            <Option value="lab">Lab</Option>
          </Select>
        </Form.Item>

        <Form.Item label={<span className="font-semibold" style={{ color: "var(--text)" }}>Full Name</span>} name="name" rules={[{ required: true, message: "Please enter your full name" }, { min: 2, message: "Name must be at least 2 characters" }]}>
          <Input prefix={<UserOutlined style={{ color: "var(--primary)" }} />} placeholder="John Doe" size="large" className="rounded-lg" style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }} />
        </Form.Item>

        <Form.Item label={<span className="font-semibold" style={{ color: "var(--text)" }}>Email Address</span>} name="email" rules={[{ required: true, message: "Please enter your email" }, { type: "email", message: "Enter a valid email address" }]}>
          <Input type="email" prefix={<MailOutlined style={{ color: "var(--primary)" }} />} placeholder="you@example.com" size="large" className="rounded-lg" style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }} />
        </Form.Item>

        <Form.Item label={<span className="font-semibold" style={{ color: "var(--text)" }}>Password</span>} name="password" rules={[{ required: true, message: "Please enter your password" }, { validator: (_, value) => { if (!value) return Promise.resolve(); if (validatePassword(value)) return Promise.resolve(); return Promise.reject(new Error("8+ chars, 1 uppercase, 1 lowercase, 1 number")); }, }]}>
          <Input.Password prefix={<LockOutlined style={{ color: "var(--primary)" }} />} placeholder="••••••••" size="large" className="rounded-lg" style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }} iconRender={(visible) => (<span style={{ color: visible ? "var(--primary)" : "var(--text)", cursor: "pointer" }}>{visible ? "👁️" : "👁️‍🗨️"}</span>)} />
        </Form.Item>

        <Form.Item label={<span className="font-semibold" style={{ color: "var(--text)" }}>Confirm Password</span>} name="confirmPassword" rules={[{ required: true, message: "Please confirm your password" }, ({ getFieldValue }) => ({ validator(_, value) { if (!value || getFieldValue("password") === value) { return Promise.resolve(); } return Promise.reject(new Error("Passwords don't match")); }, }), ]}>
          <Input.Password prefix={<LockFilled style={{ color: "var(--primary)" }} />} placeholder="••••••••" size="large" className="rounded-lg" style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }} iconRender={(visible) => (<span style={{ color: visible ? "var(--primary)" : "var(--text)", cursor: "pointer" }}>{visible ? "👁️" : "👁️‍🗨️"}</span>)} />
        </Form.Item>

        {selectedRole === "doctor" && (
          <>
            <Form.Item label={<span className="font-semibold" style={{ color: "var(--text)" }}>Specialization</span>} name="specialization" rules={[{ required: true, message: "Please enter your specialization" }]}>
              <Input placeholder="Cardiology" size="large" className="rounded-lg" style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }} />
            </Form.Item>

            <Form.Item label={<span className="font-semibold" style={{ color: "var(--text)" }}>License Number</span>} name="licenseNumber" rules={[{ required: true, message: "Please enter your license number" }]}>
              <Input placeholder="MD-123456" size="large" className="rounded-lg" style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }} />
            </Form.Item>
          </>
        )}

        {selectedRole === "lab" && (
          <>
            <Form.Item label={<span className="font-semibold" style={{ color: "var(--text)" }}>Lab Name</span>} name="labName" rules={[{ required: true, message: "Please enter your lab name" }]}>
              <Input placeholder="City Health Lab" size="large" className="rounded-lg" style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }} />
            </Form.Item>

            <Form.Item label={<span className="font-semibold" style={{ color: "var(--text)" }}>Lab License Number</span>} name="labLicenseNumber" rules={[{ required: true, message: "Please enter your lab license number" }]}>
              <Input placeholder="LAB-12345" size="large" className="rounded-lg" style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }} />
            </Form.Item>
          </>
        )}

        <Form.Item name="terms" valuePropName="checked" rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error("Please accept terms and conditions")) }, ]}>
          <label className="flex items-center gap-2 cursor-pointer">
            <Input type="checkbox" className="w-4 h-4 rounded cursor-pointer" style={{ width: "16px", height: "16px" }} />
            <span className="text-sm" style={{ color: "var(--text)" }}>
              I agree to the{" "}
              <a href="#" style={{ color: "var(--primary)" }} onClick={(e) => e.stopPropagation()}>
                Terms & Conditions
              </a>
            </span>
          </label>
        </Form.Item>

        <Form.Item>
          <PrimaryButton htmlType="submit" isLoading={isLoading} text={isLoading ? "Creating Account..." : "Create Account"} />
        </Form.Item>
      </Form>

      <Divider className="my-6" style={{ borderColor: "var(--border)" }}>
        <span className="text-sm" style={{ color: "var(--muted)" }}>Already have an account?</span>
      </Divider>

      <Link to="/login">
        <Button size="large" className="w-full h-12 text-base font-bold rounded-lg transition-all" style={{ color: "var(--primary)", borderColor: "var(--primary)" }}>
          Sign In
        </Button>
      </Link>
    </>
  );
};

export default SignUp;
