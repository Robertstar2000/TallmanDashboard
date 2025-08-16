import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDashboardData } from './hooks/useDashboardData';
import Dashboard from './components/Dashboard';
import Admin from './components/Admin';
import Header from './components/Header';
import Footer from './components/Footer';
import { GlobalProvider } from './contexts/GlobalContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/auth/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import UserManagementPage from './components/UserManagementPage';
import SqlQueryTool from './components/SqlQueryTool';

const MainLayout = () => {
    const dashboardData = useDashboardData();

    // Note: Removed auto-start on mount so Admin Run button controls refresh

    return (
        <div className="flex flex-col min-h-screen bg-background font-sans">
            <Header
                isRunning={dashboardData.isRunning}
                statusMessage={dashboardData.statusMessage}
                p21Status={dashboardData.p21Status}
                porStatus={dashboardData.porStatus}
            />
            <main className="p-4 sm:p-6 lg:p-8 flex-grow">
                <Routes>
                    <Route path="/" element={<Dashboard dataPoints={dashboardData.dataPoints} />} />
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <Admin {...dashboardData} />
                            </ProtectedRoute>
                        }
                    />
                     <Route
                        path="/user-management"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <UserManagementPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/sql-query"
                        element={
                             <ProtectedRoute requiredRole="admin">
                                <SqlQueryTool
                                    updateDataPoint={dashboardData.updateDataPoint}
                                    dataPoints={dashboardData.dataPoints}
                                />
                            </ProtectedRoute>
                        }
                    />
                     <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
            <Footer />
        </div>
    );
};


function App() {
    return (
        <GlobalProvider>
            <HashRouter>
                <AuthProvider>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route
                            path="/*"
                            element={
                                <ProtectedRoute>
                                    <MainLayout />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </AuthProvider>
            </HashRouter>
        </GlobalProvider>
    );
}

export default App;