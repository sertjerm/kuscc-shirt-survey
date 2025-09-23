/*
 * Path: src/App.jsx
 * Description: Main App Component with Blue iPadOS Theme Configuration
 */

import React, { useState, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// ...existing code...
import { ConfigProvider } from "antd";
import thTH from "antd/locale/th_TH";

import LoginForm from "./components/Login/LoginForm";
import MemberPortal from "./pages/MemberPortal";
import AdminPortal from "./pages/AdminPortal";
import "./styles/shirt.css";

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};

const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = (userData, type) => {
    setUser(userData);
    setUserType(type);
    setIsAuthenticated(true);
    localStorage.setItem("kuscc_user", JSON.stringify(userData));
    localStorage.setItem("kuscc_user_type", type);
  };

  const logout = () => {
    setUser(null);
    setUserType(null);
    setIsAuthenticated(false);
    localStorage.removeItem("kuscc_user");
    localStorage.removeItem("kuscc_user_type");
  };

  React.useEffect(() => {
    const savedUser = localStorage.getItem("kuscc_user");
    const savedUserType = localStorage.getItem("kuscc_user_type");
    if (savedUser && savedUserType) {
      setUser(JSON.parse(savedUser));
      setUserType(savedUserType);
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <AppContext.Provider
      value={{ user, userType, isAuthenticated, login, logout }}
    >
      {children}
    </AppContext.Provider>
  );
};

const ProtectedRoute = ({ children, requiredType = null }) => {
  const { isAuthenticated, userType } = useAppContext();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredType && userType !== requiredType) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <ConfigProvider
      locale={thTH}
      theme={{
        token: {
          // Primary colors - iOS Blue
          colorPrimary: "#007AFF",
          colorPrimaryHover: "#0051D5",
          colorPrimaryActive: "#003B9F",

          // Background colors
          colorBgContainer: "rgba(255, 255, 255, 0.85)",
          colorBgElevated: "rgba(255, 255, 255, 0.9)",
          colorBgLayout: "#f2f2f7",

          // Border colors
          colorBorder: "rgba(0, 122, 255, 0.2)",
          colorBorderSecondary: "rgba(0, 122, 255, 0.1)",

          // Text colors
          colorText: "#1d1d1f",
          colorTextSecondary: "#48484a",
          colorTextTertiary: "#8e8e93",

          // Font
          fontFamily:
            '"SF Pro Display", "Sarabun", "Noto Sans Thai", -apple-system, BlinkMacSystemFont, sans-serif',
          fontSize: 16,

          // Border radius
          borderRadius: 12,
          borderRadiusLG: 16,
          borderRadiusXS: 8,

          // Spacing
          controlHeight: 48,
          controlHeightLG: 52,
          controlHeightSM: 40,

          // Box shadow
          boxShadow: "0 8px 24px rgba(0, 122, 255, 0.15)",
          boxShadowSecondary: "0 4px 12px rgba(0, 122, 255, 0.1)",

          // Motion
          motionDurationSlow: "0.3s",
          motionEaseInOut: "cubic-bezier(0.4, 0.0, 0.2, 1)",
        },
        components: {
          Button: {
            borderRadius: 14,
            controlHeight: 52,
            fontWeight: 600,
            primaryShadow: "0 8px 24px rgba(0, 122, 255, 0.3)",
          },
          Input: {
            borderRadius: 12,
            controlHeight: 48,
            paddingInline: 16,
            colorBgContainer: "rgba(255, 255, 255, 0.7)",
            activeBorderColor: "#007AFF",
            hoverBorderColor: "#007AFF",
            activeShadow: "0 0 0 3px rgba(0, 122, 255, 0.15)",
          },
          Card: {
            borderRadius: 20,
            paddingLG: 32,
            colorBgContainer: "rgba(255, 255, 255, 0.85)",
            boxShadow:
              "0 25px 50px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1) inset",
          },
          Form: {
            labelFontSize: 15,
            labelFontWeight: 600,
            labelColor: "#1d1d1f",
            verticalLabelPadding: "0 0 8px",
          },
          Alert: {
            borderRadius: 12,
            colorInfoBg: "rgba(255, 255, 255, 0.7)",
            colorInfoBorder: "rgba(0, 122, 255, 0.3)",
            colorIcon: "#007AFF",
          },
          Switch: {
            colorPrimary: "#007AFF",
            colorPrimaryHover: "#0051D5",
          },
          Typography: {
            colorText: "#1d1d1f",
            colorTextSecondary: "#48484a",
            fontWeightStrong: 700,
          },
          Divider: {
            colorSplit: "rgba(0, 122, 255, 0.1)",
          },
          Select: {
            borderRadius: 12,
            controlHeight: 48,
            colorBgContainer: "rgba(255, 255, 255, 0.7)",
            activeBorderColor: "#007AFF",
            hoverBorderColor: "#007AFF",
          },
          DatePicker: {
            borderRadius: 12,
            controlHeight: 48,
            colorBgContainer: "rgba(255, 255, 255, 0.7)",
            activeBorderColor: "#007AFF",
            hoverBorderColor: "#007AFF",
          },
          Table: {
            borderRadius: 16,
            colorBgContainer: "rgba(255, 255, 255, 0.85)",
            headerBg: "rgba(0, 122, 255, 0.08)",
            headerColor: "#1d1d1f",
            colorBorderSecondary: "rgba(0, 122, 255, 0.1)",
          },
          Tabs: {
            cardBg: "rgba(255, 255, 255, 0.85)",
            inkBarColor: "#007AFF",
            itemActiveColor: "#007AFF",
            itemHoverColor: "#0051D5",
            itemSelectedColor: "#007AFF",
          },
          Modal: {
            borderRadius: 20,
            colorBgElevated: "rgba(255, 255, 255, 0.95)",
            boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)",
          },
          Drawer: {
            colorBgElevated: "rgba(255, 255, 255, 0.95)",
            boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)",
          },
          Badge: {
            colorError: "#FF3B30", // iOS Red
            colorSuccess: "#32D74B", // iOS Green
            colorWarning: "#FF9500", // iOS Orange
            colorInfo: "#007AFF", // iOS Blue
          },
          Tag: {
            borderRadiusSM: 8,
            colorFillSecondary: "rgba(0, 122, 255, 0.1)",
            colorTextSecondary: "#007AFF",
          },
        },
        algorithm: [], // Keep default algorithm, we'll handle dark mode via CSS
      }}
    >
      <AppProvider>
        <BrowserRouter basename={import.meta.env.VITE_BASE_PATH}>
          <div className="app-container">
            <Routes>
              <Route path="/login" element={<LoginForm />} />
              <Route
                path="/member"
                element={
                  <ProtectedRoute requiredType="member">
                    <MemberPortal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredType="admin">
                    <AdminPortal />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AppProvider>
    </ConfigProvider>
  );
}

export default App;
