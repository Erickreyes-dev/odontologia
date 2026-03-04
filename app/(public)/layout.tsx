import React from "react";

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <main className="min-h-screen bg-gray-900 text-white">{children}</main>;
};

export default PublicLayout;
