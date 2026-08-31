import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "var(--bg)" }}>
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-6">
          <img src="/health-icon.svg" alt="HealthPro" className="mx-auto w-14 h-14" />
          <h1 className="text-2xl font-semibold mt-3" style={{ color: "var(--text)" }}>
            HealthPro
          </h1>
          <p className="text-sm mt-1 text-muted" style={{ color: "var(--muted)" }}>Your Personal Health Companion</p>
        </div>

        {/* Main Card */}
        <div className="card overflow-hidden">
          <div className="p-8">
            <Outlet />
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: "var(--muted)" }}>
          Secure • Private
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;