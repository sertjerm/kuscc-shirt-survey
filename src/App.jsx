/*
 * Path: src/App.jsx
 * Description: Simplified routing structure without PageWrapper.
 */
import React, { useState, createContext, useContext } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import thTH from "antd/locale/th_TH";

import LoginForm from "./components/Login/LoginForm";
import MemberPortal from "./pages/MemberPortal";
import AdminDashboard from "./pages/AdminDashboard";

// AppContext and AppProvider remain the same
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
          colorPrimary: "#007AFF",
          fontFamily:
            '"SF Pro Display", "Sarabun", "Noto Sans Thai", -apple-system, BlinkMacSystemFont, sans-serif',
          fontSize: 16,
          borderRadius: 12,
        },
      }}
    >
      <AppProvider>
        <HashRouter>
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
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </HashRouter>
      </AppProvider>
    </ConfigProvider>
  );
}

export default App;