import React from "react";

const Card = ({ title, value, children }) => {
  return (
    <div className="card p-6">
      {title && <h3 className="text-sm font-medium mb-2" style={{ color: "var(--muted)", textTransform: "uppercase" }}>{title}</h3>}
      {value && <p className="text-2xl font-semibold" style={{ color: "var(--text)" }}>{value}</p>}
      {children}
    </div>
  );
};

export default Card;