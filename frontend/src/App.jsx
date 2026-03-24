import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VerifyEmail } from './pages/VerifyEmail';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { PerformancePage } from './pages/PerformancePage';
import { SportsPage } from './pages/SportsPage';
import { BatchesPage } from './pages/BatchesPage';
import { AthletesPage } from './pages/AthletesPage';
import { CoachesPage } from './pages/CoachesPage';
import { SchedulesPage } from './pages/SchedulesPage';
import { AttendancePage } from './pages/AttendancePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { FeesPage } from './pages/FeesPage';
import { AdminFeesPage } from './pages/AdminFeesPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { MyPerformancePage } from './pages/MyPerformancePage';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/sports"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'COACH', 'ATHLETE']}>
                                <SportsPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/batches"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'COACH']}>
                                <BatchesPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/my-batches"
                        element={
                            <ProtectedRoute allowedRoles={['COACH']}>
                                <BatchesPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/athletes"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'COACH']}>
                                <AthletesPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/coaches"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'COACH']}>
                                <CoachesPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/schedules"
                        element={
                            <ProtectedRoute>
                                <SchedulesPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/attendance"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'COACH']}>
                                <AttendancePage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/my-attendance"
                        element={
                            <ProtectedRoute allowedRoles={['ATHLETE']}>
                                <AttendancePage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/performance"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'COACH']}>
                                <PerformancePage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/notifications"
                        element={
                            <ProtectedRoute>
                                <NotificationsPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/fees"
                        element={
                            <ProtectedRoute allowedRoles={['ATHLETE']}>
                                <FeesPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin/fees"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <AdminFeesPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/announcements"
                        element={
                            <ProtectedRoute>
                                <AnnouncementsPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <ProfilePage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/my-performance"
                        element={
                            <ProtectedRoute allowedRoles={['ATHLETE']}>
                                <MyPerformancePage />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="/" element={<Navigate to="/dashboard" replace />} />

                    <Route
                        path="/unauthorized"
                        element={
                            <div className="min-h-screen flex items-center justify-center">
                                <div className="text-center">
                                    <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
                                    <p className="text-gray-600">You don't have permission to access this page.</p>
                                </div>
                            </div>
                        }
                    />

                    <Route
                        path="*"
                        element={
                            <div className="min-h-screen flex items-center justify-center">
                                <div className="text-center">
                                    <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                                    <p className="text-gray-600">Page not found.</p>
                                </div>
                            </div>
                        }
                    />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
