import React, { useState, useEffect } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UploadOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  FileTextOutlined,
  HeartOutlined,
  CaretDownOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  UserSwitchOutlined,
  AlertOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
  HistoryOutlined,
  AuditOutlined,
} from "@ant-design/icons";
import { Layout, Menu, Button, Avatar, Dropdown, Drawer, Typography } from "antd";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import api from "../utils/axiosSetup";
import { generateAvatar } from "../utils/helper";

const { Header, Sider, Content } = Layout;

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileVisible, setMobileVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsMobile(w < 1024);
      setIsCompact(w < 480);
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setUserProfile(null);
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        const res = await api.get("/auth/user-profile", { signal: controller.signal });
        if (res?.data?.user) {
          setUserProfile(res.data.user);
        }
      } catch (err) {
        if (err?.name === "CanceledError") return;
        setUserProfile(null);
      }
    })();

    return () => controller.abort();
  }, []);

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "My Profile",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
    },
  ];

  // Build menu items and include admin-only entries when userProfile indicates admin
  const menuItems = [
    { key: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
    { key: "/profile", icon: <UserOutlined />, label: "Profile" },
  ];

  // Helper to extract the user's role string
  const getUserRole = () => {
    try {
      if (!userProfile) return null;
      const role = userProfile.role || userProfile.roles || userProfile?.roleName || null;
      if (!role) return null;
      if (Array.isArray(role)) return role.map((r) => String(r).toLowerCase());
      return [String(role).toLowerCase()];
    } catch (err) {
      return null;
    }
  };

  const roles = getUserRole();
  const isAdmin = roles?.includes("admin") ?? false;
  const isDoctor = roles?.includes("doctor") ?? false;
  const isPatient = roles?.includes("patient") ?? false;
  const isLab = roles?.includes("lab") ?? false;

  if (isAdmin) {
    menuItems.splice(2, 0, { key: "/dashboard/admin-verifications", icon: <FileTextOutlined />, label: "Verifications" });
    menuItems.splice(3, 0, { key: "/dashboard/admin-audit-logs", icon: <AuditOutlined />, label: "Audit Logs" });
  }

  if (isDoctor) {
    menuItems.splice(2, 0, { key: "/dashboard/doctor-patients", icon: <TeamOutlined />, label: "My Patients" });
    menuItems.splice(3, 0, { key: "/dashboard/appointments", icon: <CalendarOutlined />, label: "Appointments" });
  }

  if (isPatient) {
    menuItems.splice(1, 0, { key: "/reports", icon: <FileTextOutlined />, label: "My Reports" });
    menuItems.splice(2, 0, { key: "/upload-reports", icon: <UploadOutlined />, label: "Upload Report" });
    menuItems.splice(3, 0, { key: "/vitals", icon: <HeartOutlined />, label: "Track Vitals" });
    menuItems.splice(4, 0, { key: "/dashboard/access-requests", icon: <UserSwitchOutlined />, label: "Access Requests" });
    menuItems.splice(5, 0, { key: "/dashboard/emergency-profile", icon: <AlertOutlined />, label: "Emergency Profile" });
    menuItems.splice(6, 0, { key: "/dashboard/appointments", icon: <CalendarOutlined />, label: "Appointments" });
    menuItems.splice(7, 0, { key: "/dashboard/medications", icon: <MedicineBoxOutlined />, label: "Medications" });
    menuItems.splice(8, 0, { key: "/dashboard/access-history", icon: <HistoryOutlined />, label: "Access History" });
  }

  if (isLab) {
    menuItems.splice(2, 0, { key: "/dashboard/lab-upload", icon: <UploadOutlined />, label: "Upload for Patients" });
  }

  const handleToggle = () => {
    if (isMobile) setMobileVisible(true);
    else setCollapsed(!collapsed);
  };

  const handleMenuClick = ({ key }) => {
    navigate(key);
    if (isMobile) setMobileVisible(false);
  };

  const handleUserMenuClick = ({ key }) => {
    if (key === "profile") {
      navigate("/profile");
    } else if (key === "logout") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setUserProfile(null);
      navigate("/login");
    }
  };

  const displayName = userProfile?.userName?.trim() || userProfile?.email?.trim() || "Account";

  const avatarLetter = generateAvatar(displayName);
  const avatarUrl = userProfile?.avatar?.trim();

  const headerPadding = isMobile ? "0 12px" : "0 24px";
  const headerHeight = isMobile ? 64 : 70;
  const contentHeight = isMobile ? `calc(100vh - ${headerHeight}px)` : `calc(100vh - ${headerHeight}px - 48px)`;

  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      {/* Sidebar (Desktop) */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        collapsedWidth={80}
        width={230}
        trigger={null}
        theme="light"
        className="hidden lg:block"
        style={{
          backgroundColor: "var(--card)",
          borderRight: "1px solid var(--border)",
          height: "100vh",
          overflowY: "auto",
        }}
      >
        <div className="flex items-center justify-center h-16 mx-4 my-4 font-semibold uppercase mt-12  " style={{ color: "var(--text)" }}>
          {!collapsed ? (
            <div className="flex flex-col items-center gap-2">
            <img src="/health-icon.svg" alt="HealthPro" className="h-8 w-auto max-w-[120px] object-contain" />
            <h2 className="text-lg">HealthPro</h2>
            </div>
          ) : (
            <img src="/health-icon.svg" alt="HealthPro" className="h-6 w-auto max-w-[120px] object-contain" />
          )}
        </div>

        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ paddingLeft: 8, paddingRight: 8, backgroundColor: "transparent", border: 0 }}
        />
      </Sider>

      {/* Mobile Drawer */}
      <Drawer placement="left" closable={false} onClose={() => setMobileVisible(false)} open={mobileVisible} width={230}>
        <div className="flex items-center justify-center h-16 mx-4 my-4 font-semibold uppercase">HealthPro</div>
        <Menu theme="light" mode="inline" selectedKeys={[location.pathname]} items={menuItems} onClick={handleMenuClick} />
      </Drawer>

      {/* Main Layout */}
      <Layout style={{ height: "100vh", overflow: "hidden" }}>
        <Header
          style={{
            padding: headerPadding,
            background: "var(--card)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: headerHeight,
            boxShadow: "0 1px 6px rgba(2,6,23,0.06)",
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={handleToggle} style={{ fontSize: "18px", color: "var(--text)" }} />
            {!isMobile && <h3 style={{ marginLeft: 6, marginBottom: 0, color: "var(--text)", fontSize: "18px", fontWeight: 600 }}>Health Dashboard</h3>}
          </div>

          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight" arrow>
            <div className="flex items-center gap-3 cursor-pointer" title={displayName} style={{ maxWidth: isCompact ? 120 : isMobile ? 170 : 220 }}>
              <Avatar src={avatarUrl || undefined} size={isMobile ? 32 : 34} style={{ backgroundColor: "var(--primary)", flexShrink: 0 }} icon={!avatarUrl && !avatarLetter ? <UserOutlined /> : undefined}>
                {!avatarUrl && avatarLetter ? avatarLetter : null}
              </Avatar>

              {!isCompact && <Typography.Text style={{ color: "var(--text)", fontWeight: 600, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</Typography.Text>}

              <CaretDownOutlined style={{ color: "var(--muted)", fontSize: 12, flexShrink: 0 }} />
            </div>
          </Dropdown>
        </Header>

        <Content style={{ margin: isMobile ? 0 : "24px 16px", padding: isMobile ? 0 : 24, height: contentHeight, background: "var(--bg)", borderRadius: isMobile ? 0 : 8, overflowX: "hidden", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          {/* 👇 React Router will inject page content here */}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
