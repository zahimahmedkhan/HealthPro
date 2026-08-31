import React, { useState, useEffect, useCallback } from "react";
import { Avatar, Button, Form, Input, DatePicker, message, Spin } from "antd";
import {
  UserOutlined,
  SaveOutlined,
  CalendarOutlined,
  PhoneOutlined,
  MailOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import api from "../../utils/axiosSetup";
import PrimaryButton from "../../components/PrimaryButton";

export default function Profile() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [userData, setUserData] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const navigate = useNavigate();

  const watchedPhone = Form.useWatch("phone", form);
  const watchedDob = Form.useWatch("dob", form);

  const fetchUserProfile = useCallback(async (signal) => {
    const token = localStorage.getItem("accessToken");
    
    if (!token) {
      message.error("Authentication token missing. Please login again.");
      navigate("/login");
      return;
    }
    
    try {
      setFetching(true);
      const res = await api.get("/auth/user-profile", { signal });

      if (res.data?.user) {
        setUserData(res.data.user);
        setAvatarPreview(res.data.user.avatar);
        form.setFieldsValue({
          fullName: res.data.user.userName,
          email: res.data.user.email,
          phone: res.data.user.phone || "",
          dob: res.data.user.dob ? dayjs(res.data.user.dob) : null,
        });
      }
    } catch (error) {
      if (error.name === 'CanceledError') return;
      
      console.error("Profile fetch error:", error);
      if (error.response?.status === 401) {
        message.error("Session expired. Please login again.");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        navigate("/login");
      } else {
        message.error(error.response?.data?.message || "Failed to fetch profile");
      }
    } finally {
      setFetching(false);
    }
  }, [form, navigate]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      message.error("Please login first");
      navigate("/login");
      return;
    }
    
    const controller = new AbortController();
    fetchUserProfile(controller.signal);
    return () => controller.abort();
  }, [fetchUserProfile, navigate]);

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        message.error("Please upload an image file");
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        message.error("File size must be less than 5MB");
        return;
      }
      
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);

      const payload = {
        userName: values.fullName,
        phone: values.phone || "",
        dob: values.dob ? values.dob.toISOString() : "",
      };

      let res;

      if (avatarFile) {
        const formData = new FormData();
        formData.append("userName", payload.userName);
        formData.append("phone", payload.phone);
        formData.append("dob", payload.dob);
        formData.append("avatar", avatarFile);

        // Do not set Content-Type manually — axios must include the multipart boundary
        res = await api.put("/auth/update-profile", formData);
      } else {
        res = await api.put("/auth/update-profile", payload);
      }

      if (res.data?.status === 200) {
        message.success(res.data?.message || "Profile updated successfully");
        setAvatarFile(null);

        if (res.data?.user) {
          setUserData(res.data.user);
          setAvatarPreview(res.data.user.avatar);
          form.setFieldsValue({
            fullName: res.data.user.userName,
            email: res.data.user.email,
            phone: res.data.user.phone || "",
            dob: res.data.user.dob ? dayjs(res.data.user.dob) : null,
          });
        }

        await fetchUserProfile();
      } else {
        message.error(res.data?.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      message.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  const displayPhone = watchedPhone || userData?.phone || "";
  const displayDob = watchedDob || (userData?.dob ? dayjs(userData.dob) : null);
  const formattedDob = displayDob ? dayjs(displayDob).format("MMMM D, YYYY") : null;

  return (
    <div className="min-h-screen px-3 py-4 sm:p-6" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="card overflow-hidden">
          {/* Header Section */}
          <div className="p-5 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3" style={{ color: "var(--text)" }}>Personal Information</h2>
            <p className="text-base sm:text-lg" style={{ color: "var(--muted)" }}>Manage your account details and preferences</p>
          </div>

          <div className="p-4 sm:p-8">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 mb-8 sm:mb-12 p-4 sm:p-6 rounded-lg border" style={{ borderColor: "var(--border)", backgroundColor: "transparent" }}>
            <div className="relative">
              <Avatar size={100} src={avatarPreview} icon={!avatarPreview && <UserOutlined />} className="text-white" style={{ backgroundColor: "var(--primary)" }} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>
                {userData?.userName || "Your Profile"}
              </h3>
              <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>{userData?.email}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span
                  className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border"
                  style={{ borderColor: "var(--border)", color: displayPhone ? "var(--text)" : "var(--muted)", backgroundColor: "var(--bg)" }}
                >
                  <PhoneOutlined style={{ color: "var(--primary)" }} />
                  {displayPhone || "Phone not added"}
                </span>
                <span
                  className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border"
                  style={{ borderColor: "var(--border)", color: formattedDob ? "var(--text)" : "var(--muted)", backgroundColor: "var(--bg)" }}
                >
                  <CalendarOutlined style={{ color: "var(--primary)" }} />
                  {formattedDob || "Date of birth not added"}
                </span>
              </div>
              <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>Update your avatar and profile image</p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <label className="font-semibold py-3 px-6 rounded-lg cursor-pointer text-center" style={{ backgroundColor: "var(--primary)", color: "white" }}>
                  Change Avatar
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
                <button type="button" onClick={() => { setAvatarFile(null); setAvatarPreview(userData?.avatar || null); }} className="border-2 font-semibold py-3 px-6 rounded-lg" style={{ borderColor: "var(--primary)", color: "var(--primary)", backgroundColor: "white" }}>Remove</button>
              </div>
            </div>
          </div>

          {/* Saved details overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
              <p className="text-xs uppercase tracking-wide font-semibold mb-2" style={{ color: "var(--muted)" }}>Phone Number</p>
              <p className="text-base font-semibold flex items-center gap-2" style={{ color: displayPhone ? "var(--text)" : "var(--muted)" }}>
                <PhoneOutlined style={{ color: "var(--primary)" }} />
                {displayPhone || "Not provided yet"}
              </p>
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
              <p className="text-xs uppercase tracking-wide font-semibold mb-2" style={{ color: "var(--muted)" }}>Date of Birth</p>
              <p className="text-base font-semibold flex items-center gap-2" style={{ color: formattedDob ? "var(--text)" : "var(--muted)" }}>
                <CalendarOutlined style={{ color: "var(--primary)" }} />
                {formattedDob || "Not provided yet"}
              </p>
            </div>
          </div>

          {/* Form Section */}
          <Form form={form} layout="vertical" onFinish={onFinish} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Form.Item name="fullName" label={<span className="font-semibold text-lg" style={{ color: "var(--text)" }}>Full Name</span>} rules={[{ required: true, message: "Please enter your full name" }]}>
                <Input placeholder="Enter your full name" size="large" className="h-14 rounded-lg" style={{ borderColor: "var(--border)", color: "var(--text)" }} prefix={<UserOutlined style={{ color: "var(--primary)" }} />} />
              </Form.Item>

              <Form.Item name="email" label={<span className="font-semibold text-lg" style={{ color: "var(--text)" }}>Email Address</span>} rules={[{ type: "email", required: true, message: "Please enter a valid email" }]}>
                <Input placeholder="your.email@example.com" size="large" disabled className="h-14 rounded-lg" style={{ borderColor: "var(--border)", color: "var(--text)", backgroundColor: "var(--bg)" }} prefix={<MailOutlined style={{ color: "var(--primary)" }} />} />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Form.Item name="phone" label={<span className="font-semibold text-lg" style={{ color: "var(--text)" }}>Phone Number</span>}>
                <Input placeholder="+1 (555) 123-4567" size="large" className="h-14 rounded-lg" style={{ borderColor: "var(--border)", color: "var(--text)" }} prefix={<PhoneOutlined style={{ color: "var(--primary)" }} />} />
              </Form.Item>

              <Form.Item name="dob" label={<span className="font-semibold text-lg" style={{ color: "var(--text)" }}>Date of Birth</span>}>
                <DatePicker
                  className="w-full h-14 rounded-lg"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                  size="large"
                  format="MMMM D, YYYY"
                  placeholder="Select your date of birth"
                  suffixIcon={<CalendarOutlined style={{ color: "var(--primary)" }} />}
                />
              </Form.Item>
            </div>

            {/* Save Button */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end pt-6 gap-3 sm:gap-4" style={{ borderTopColor: "var(--border)", borderTopWidth: "1px" }}>
              <Button size="large" style={{ color: "var(--primary)", borderColor: "var(--primary)" }} className="font-semibold rounded-lg w-full sm:w-auto">Cancel</Button>
              <PrimaryButton htmlType="submit" isLoading={loading} text={loading ? "Saving..." : "Save Changes"} />
            </div>
          </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
