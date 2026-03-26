import api from './api';
export { emailService } from './emailService';

export const authService = {
    login: async (username, password) => {
        const response = await api.post('/auth/login/', { username, password });
        const { access, refresh, user } = response.data;

        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        localStorage.setItem('user', JSON.stringify(user));

        return user;
    },

    register: async (userData) => {
        const response = await api.post('/auth/register/', userData);
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
    },

    getCurrentUser: () => {
        try {
            const userStr = localStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('Failed to parse user from localStorage:', error);
            localStorage.removeItem('user');
            return null;
        }
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('access_token');
    },

    getProfile: async () => {
        const response = await api.get('/auth/profile/');
        return response.data;
    },

    updateProfile: async (data) => {
        const response = await api.patch('/auth/profile/', data);
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
    },
};

export const academyService = {
    // Sports
    getSports: async () => {
        const response = await api.get('/academy/sports/');
        return response.data.results || response.data;
    },

    createSport: async (data) => {
        const response = await api.post('/academy/sports/', data);
        return response.data;
    },

    // Batches
    getBatches: async (params) => {
        const response = await api.get('/academy/batches/', { params });
        return response.data.results || response.data;
    },

    createBatch: async (data) => {
        const response = await api.post('/academy/batches/', data);
        return response.data;
    },

    updateBatch: async (id, data) => {
        const response = await api.patch(`/academy/batches/${id}/`, data);
        return response.data;
    },

    getBatchAthletes: async (batchId) => {
        const response = await api.get(`/academy/batches/${batchId}/athletes/`);
        return response.data;
    },

    addAthletesToBatch: async (batchId, athleteIds) => {
        const response = await api.post(`/academy/batches/${batchId}/add_athletes/`, { athlete_ids: athleteIds });
        return response.data;
    },

    // Athletes
    getAthletes: async (params) => {
        const response = await api.get('/academy/athletes/', { params });
        return response.data.results || response.data;
    },

    createAthlete: async (data) => {
        const response = await api.post('/academy/athletes/', data);
        return response.data;
    },

    updateAthlete: async (id, data) => {
        const response = await api.patch(`/academy/athletes/${id}/`, data);
        return response.data;
    },

    // Coaches
    getCoaches: async () => {
        const response = await api.get('/academy/coaches/');
        return response.data.results || response.data;
    },

    createCoach: async (data) => {
        const response = await api.post('/academy/coaches/', data);
        return response.data;
    },

    updateCoach: async (id, data) => {
        const response = await api.patch(`/academy/coaches/${id}/`, data);
        return response.data;
    },

    // Schedules
    getSchedules: async (params) => {
        const response = await api.get('/academy/schedules/', { params });
        return response.data.results || response.data;
    },

    createSchedule: async (data) => {
        const response = await api.post('/academy/schedules/', data);
        return response.data;
    },

    updateSchedule: async (id, data) => {
        const response = await api.patch(`/academy/schedules/${id}/`, data);
        return response.data;
    },

    // Attendance
    getAttendance: async (params) => {
        const response = await api.get('/academy/attendance/', { params });
        return response.data.results || response.data;
    },

    markAttendance: async (data) => {
        const response = await api.post('/academy/attendance/', data);
        return response.data;
    },

    bulkMarkAttendance: async (data) => {
        const response = await api.post('/academy/attendance/bulk_mark/', data);
        return response.data;
    },

    getAttendanceStats: async (athleteId) => {
        const response = await api.get('/academy/attendance/stats/', {
            params: { athlete_id: athleteId },
        });
        return response.data;
    },

    getAttendanceBatchReport: async (batchId) => {
        const response = await api.get('/academy/attendance/batch_report/', {
            params: { batch_id: batchId },
        });
        return response.data;
    },

    getAttendanceSummary: async (batchId = null) => {
        const params = batchId ? { batch_id: batchId } : {};
        const response = await api.get('/academy/attendance/summary/', { params });
        return response.data;
    },

    exportAttendanceCSV: async (batchId = null) => {
        const params = batchId ? { batch_id: batchId } : {};
        const response = await api.get('/academy/attendance/export_attendance_csv/', {
            params,
            responseType: 'blob'
        });
        return response.data;
    },

    // Notifications
    getNotifications: async () => {
        const response = await api.get('/academy/notifications/');
        return response.data.results || response.data;
    },

    markAllNotificationsAsRead: async () => {
        const response = await api.post('/academy/notifications/mark_all_as_read/');
        return response.data;
    },

    markNotificationAsRead: async (id) => {
        const response = await api.post(`/academy/notifications/${id}/mark_as_read/`);
        return response.data;
    },

    // Athlete Profile (Self)
    getMyAthleteProfile: async () => {
        const response = await api.get('/academy/athletes/me/');
        return response.data;
    },

    updateMyAthleteProfile: async (data) => {
        const response = await api.patch('/academy/athletes/me/', data);
        return response.data;
    },

    // Coach Profile (Self)
    getMyCoachProfile: async () => {
        const response = await api.get('/academy/coaches/me/');
        return response.data;
    },

    updateMyCoachProfile: async (data) => {
        const response = await api.patch('/academy/coaches/me/', data);
        return response.data;
    },

    // Fees
    getFees: async () => {
        const response = await api.get('/academy/fees/');
        return response.data.results || response.data;
    },

    assignFeesToBatch: async (data) => {
        const response = await api.post('/academy/fees/assign_to_batch/', data);
        return response.data;
    },

    // Fee Structures
    getFeeStructures: async () => {
        const response = await api.get('/academy/fee-structures/');
        return response.data.results || response.data;
    },

    createFeeStructure: async (data) => {
        const response = await api.post('/academy/fee-structures/', data);
        return response.data;
    },

    updateFeeStructure: async (id, data) => {
        const response = await api.patch(`/academy/fee-structures/${id}/`, data);
        return response.data;
    },

    deleteFeeStructure: async (id) => {
        const response = await api.delete(`/academy/fee-structures/${id}/`);
        return response.data;
    },

    // Announcements
    getAnnouncements: async (params) => {
        const response = await api.get('/academy/announcements/', { params });
        return response.data.results || response.data;
    },

    getCoachesList: async () => {
        const response = await api.get('/academy/announcements/coaches_list/');
        return response.data;
    },

    createAnnouncement: async (data) => {
        const response = await api.post('/academy/announcements/', data);
        return response.data;
    },

    deleteAnnouncement: async (id) => {
        const response = await api.delete(`/academy/announcements/${id}/`);
        return response.data;
    },

    // Athlete Feedback
    getAthleteFeedback: async (athleteId) => {
        const response = await api.get('/academy/athlete-feedback/', {
            params: athleteId ? { athlete: athleteId } : {},
        });
        return response.data.results || response.data;
    },

    createAthleteFeedback: async (data) => {
        const response = await api.post('/academy/athlete-feedback/', data);
        return response.data;
    },
};

export const performanceService = {
    // Metrics
    getMetrics: async (sportId) => {
        const response = await api.get('/performance/metrics/', {
            params: sportId ? { sport: sportId } : {},
        });
        return response.data.results || response.data;
    },

    createMetric: async (data) => {
        const response = await api.post('/performance/metrics/', data);
        return response.data;
    },

    // Test Sessions
    getSessions: async () => {
        const response = await api.get('/performance/sessions/');
        return response.data.results || response.data;
    },

    createSession: async (data) => {
        const response = await api.post('/performance/sessions/', data);
        return response.data;
    },

    // Test Results
    getResults: async (params) => {
        const response = await api.get('/performance/results/', { params });
        return response.data.results || response.data;
    },

    createResult: async (data) => {
        const response = await api.post('/performance/results/', data);
        return response.data;
    },

    bulkCreateResults: async (data) => {
        const response = await api.post('/performance/results/bulk_create/', data);
        return response.data;
    },

    getTrends: async (athleteId, metricId) => {
        const response = await api.get('/performance/results/trends/', {
            params: { athlete_id: athleteId, metric_id: metricId },
        });
        return response.data;
    },

    getSummary: async (athleteId, batchId) => {
        const response = await api.get('/performance/results/summary/', {
            params: { athlete_id: athleteId, batch_id: batchId },
        });
        return response.data;
    },

    // Analytics
    getPerformanceIndex: async (athleteId, sportId) => {
        const params = { athlete_id: athleteId };
        if (sportId) params.sport_id = sportId;
        const response = await api.get('/performance/results/performance_index/', { params });
        return response.data;
    },

    getBatchRanking: async (batchId) => {
        const response = await api.get('/performance/results/batch_ranking/', {
            params: { batch_id: batchId },
        });
        return response.data;
    },

    getBatchComparison: async (batchId, athleteId) => {
        const response = await api.get('/performance/results/batch_comparison/', {
            params: { batch_id: batchId, athlete_id: athleteId },
        });
        return response.data;
    },

    getRadarData: async (athleteId, sportId) => {
        const params = { athlete_id: athleteId };
        if (sportId) params.sport_id = sportId;
        const response = await api.get('/performance/results/radar/', { params });
        return response.data;
    },

    getIndexHistory: async (athleteId, sportId) => {
        const params = { athlete_id: athleteId };
        if (sportId) params.sport_id = sportId;
        const response = await api.get('/performance/results/index_history/', { params });
        return response.data;
    },

    calculatePerformance: async (data) => {
        const response = await api.post('/performance/results/calculate/', data);
        return response.data;
    },

    updateMetric: async (id, data) => {
        const response = await api.patch(`/performance/metrics/${id}/`, data);
        return response.data;
    },

    deleteMetric: async (id) => {
        const response = await api.delete(`/performance/metrics/${id}/`);
        return response.data;
    },
};

export const paymentService = {
    createOrder: async (feeId) => {
        const response = await api.post('/payments/create-order/', { fee_id: feeId });
        return response.data;
    },

    verifyPayment: async (paymentData) => {
        const response = await api.post('/payments/verify-payment/', paymentData);
        return response.data;
    },

    getPaymentHistory: async (params) => {
        const response = await api.get('/payments/history/', { params });
        return response.data.results || response.data;
    },

    getPaymentStats: async () => {
        const response = await api.get('/payments/history/stats/');
        return response.data;
    },

    checkStatus: async (orderId) => {
        const response = await api.get(`/payments/check-status/${orderId}/`);
        return response.data;
    },

    exportPaymentHistory: async (type = 'transactions') => {
        const response = await api.get(`/payments/history/export_csv/?type=${type}`, { responseType: 'blob' });
        return response.data;
    },

    getAdminFeeAnalysis: async (athleteId) => {
        const response = await api.get(`/payments/admin/fee-analysis/${athleteId}/`);
        return response.data;
    },

    downloadAdminReceipt: async (paymentId) => {
        const response = await api.get(`/payments/admin/fee-receipt/${paymentId}/`, { responseType: 'blob' });
        return response.data;
    },
};

export const reportService = {
    getAttendanceReport: async (params) => {
        const response = await api.get('/reports/attendance/', { params });
        return response.data;
    },

    getPerformanceReport: async (athleteId) => {
        const response = await api.get('/reports/performance/', {
            params: { athlete_id: athleteId }
        });
        return response.data;
    },

    getReceipt: async (paymentId) => {
        const response = await api.get(`/reports/receipt/${paymentId}/`);
        return response.data;
    },

    exportMyAttendance: async () => {
        const response = await api.get('/reports/export/attendance/', {
            responseType: 'blob'
        });
        return response.data;
    },

    exportMyPerformance: async () => {
        const response = await api.get('/reports/export/performance/', {
            responseType: 'blob'
        });
        return response.data;
    },

    getFeedback: async () => {
        const response = await api.get('/academy/athlete-feedback/');
        return response.data;
    },
};

