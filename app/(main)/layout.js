import React from "react";

const MainLayout = ({ children }) => {
  return (
    <div className="container mx-auto px-4 md:px-8 mt-24 mb-20">
      {children}
    </div>
  );
};

export default MainLayout;