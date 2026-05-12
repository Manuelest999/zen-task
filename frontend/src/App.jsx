import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SyncProvider } from './context/SyncContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Routines from './pages/Routines';
import Goals from './pages/Goals';

import Layout from './components/Layout';

const PrivateRoute = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) return <div>Cargando...</div>;
  return token ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SyncProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              <Route path="/tasks" element={
                <PrivateRoute>
                  <Tasks />
                </PrivateRoute>
              } />
              <Route path="/routines" element={
                <PrivateRoute>
                  <Routines />
                </PrivateRoute>
              } />
              <Route path="/goals" element={
                <PrivateRoute>
                  <Goals />
                </PrivateRoute>
              } />
            </Routes>
          </Router>
        </SyncProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
