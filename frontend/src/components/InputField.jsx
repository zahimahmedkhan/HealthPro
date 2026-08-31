import React from "react";
import { Form, Input } from "antd";

const InputField = ({ label, name, rules, type = "text", placeholder, prefix }) => {
  return (
    <Form.Item label={label} name={name} rules={rules}>
      <Input
        type={type}
        placeholder={placeholder}
        prefix={prefix}
        className="rounded-lg"
        style={{ borderColor: "var(--border)", height: 44 }}
      />
    </Form.Item>
  );
};

export default InputField;