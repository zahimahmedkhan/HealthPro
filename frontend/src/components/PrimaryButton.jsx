import React from "react";
import { Button } from "antd";

const PrimaryButton = ({ isLoading, text, htmlType = "button", onClick, disabled }) => {
  return (
    <Button
      htmlType={htmlType}
      block
      loading={isLoading}
      type="primary"
      onClick={onClick}
      disabled={disabled}
      className="w-full h-12 rounded-xl text-lg font-semibold"
      style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)" }}
    >
      {text}
    </Button>
  );
};

export default PrimaryButton;
