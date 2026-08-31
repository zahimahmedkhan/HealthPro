import React from "react";
import { Upload, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";

const { Dragger } = Upload;

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

/**
 * Single PDF uploader
 * @param {Array} fileList - current file list
 * @param {Function} setFileList - setter for file list
 */
const PDFUploader = ({ fileList, setFileList }) => {
  const beforeUpload = (file) => {
    if (file.type !== "application/pdf") {
      message.error("Only PDF files are allowed.");
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_FILE_SIZE) {
      message.error("File too large (max 20MB).");
      return Upload.LIST_IGNORE;
    }

    // Only single PDF allowed
    setFileList([file]);
    return false; // prevent auto upload
  };

  const handleRemove = () => setFileList([]);

  return (
    <Dragger
      accept=".pdf"
      beforeUpload={beforeUpload}
      fileList={fileList}
      onRemove={handleRemove}
      showUploadList={{ showRemoveIcon: true }}
      // className="p-6 border-2 border-dashed rounded-md"
    >
      <p className="ant-upload-drag-icon text-blue-600">
        <InboxOutlined style={{ fontSize: 28 }} />
      </p>
      <p className="ant-upload-text">Click or drag PDF to upload</p>
      <p className="ant-upload-hint text-sm text-gray-500">
        Only a single PDF, max 20MB
      </p>
    </Dragger>
  );
};

export default PDFUploader;