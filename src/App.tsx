import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { Dashboard } from "./pages/Dashboard";
import { Editor } from "./pages/Editor";
import { Login } from "./pages/Login";
import { Settings } from "./pages/Settings";

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard view="recent" />} />
            <Route path="recent" element={<Dashboard view="recent" />} />
            <Route path="favorites" element={<Dashboard view="favorites" />} />
            <Route path="trash" element={<Dashboard view="trash" />} />
            <Route path="all" element={<Dashboard view="all" />} />
            <Route path="folder/:folderId" element={<Dashboard view="folder" />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route
            path="/editor/:fileId"
            element={
              <PrivateRoute>
                <Editor />
              </PrivateRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
