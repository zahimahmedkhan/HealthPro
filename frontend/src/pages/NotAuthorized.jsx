import React from "react";
import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

const NotAuthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--bg)" }}>
      <Result
        status="403"
        title="Not Authorized"
        subTitle="You do not have permission to access this page."
        extra={
          <Button type="primary" size="large" onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </Button>
        }
      />
    </div>
  );
};

export default NotAuthorized;