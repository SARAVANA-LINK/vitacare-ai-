const BASE_URL = (typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '3000')
  ? 'http://localhost:5000/api'
  : (import.meta.env.VITE_API_URL || '/api');

class ApiClient {
  getToken() {
    return localStorage.getItem('vitacare_token');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('vitacare_token', token);
    } else {
      localStorage.removeItem('vitacare_token');
    }
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      ...(options.headers || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `HTTP error ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  }

  // Auth
  register(userData) {
    return this.request('/auth/register', { method: 'POST', body: JSON.stringify(userData) });
  }

  login(credentials) {
    return this.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
  }

  adminLogin(credentials) {
    return this.request('/auth/admin-login', { method: 'POST', body: JSON.stringify(credentials) });
  }

  demoLogin() {
    return this.request('/auth/demo-login', { method: 'POST' });
  }

  getMe() {
    return this.request('/auth/me');
  }

  updateProfile(profileData) {
    return this.request('/auth/profile', { method: 'PUT', body: JSON.stringify(profileData) });
  }

  updateLanguage(language) {
    return this.request('/auth/language', { method: 'PUT', body: JSON.stringify({ language }) });
  }

  // Dashboard
  getDashboardOverview() {
    return this.request('/dashboard/overview');
  }

  // Prescriptions
  uploadPrescription(formDataOrJson) {
    if (formDataOrJson instanceof FormData) {
      return this.request('/prescriptions/upload', { method: 'POST', body: formDataOrJson });
    }
    return this.request('/prescriptions/upload', { method: 'POST', body: JSON.stringify(formDataOrJson) });
  }

  verifyPrescription(data) {
    return this.request('/prescriptions/verify', { method: 'POST', body: JSON.stringify(data) });
  }

  getPrescriptions() {
    return this.request('/prescriptions');
  }

  // Reports
  uploadReport(formDataOrJson) {
    if (formDataOrJson instanceof FormData) {
      return this.request('/reports/upload', { method: 'POST', body: formDataOrJson });
    }
    return this.request('/reports/upload', { method: 'POST', body: JSON.stringify(formDataOrJson) });
  }

  verifyReport(data) {
    return this.request('/reports/verify', { method: 'POST', body: JSON.stringify(data) });
  }

  getReports(query = {}) {
    const params = new URLSearchParams(query).toString();
    return this.request(`/reports${params ? `?${params}` : ''}`);
  }

  getReportDetails(id) {
    return this.request(`/reports/${id}`);
  }

  compareReports(id1, id2, language = null) {
    const lang = language || localStorage.getItem('vitacare_lang') || 'en';
    return this.request(`/reports/compare/diff?report1Id=${id1}&report2Id=${id2}&language=${lang}`);
  }

  deleteReport(id) {
    return this.request(`/reports/${id}`, { method: 'DELETE' });
  }

  async getReportDocumentBlob(id) {
    const token = this.getToken();
    const res = await fetch(`${BASE_URL}/reports/${id}/document`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to fetch document (${res.status})`);
    }
    const blob = await res.blob();
    return {
      blob,
      url: URL.createObjectURL(blob),
      contentType: res.headers.get('Content-Type') || ''
    };
  }

  getReportPages(id) {
    return this.request(`/reports/${id}/pages`);
  }

  // Medicines & Schedules
  getMedicines() {
    return this.request('/medicines');
  }

  createMedicine(data) {
    return this.request('/medicines', { method: 'POST', body: JSON.stringify(data) });
  }

  getTodaySchedule() {
    return this.request('/medicines/today');
  }

  getAllSchedules(query = {}) {
    const params = new URLSearchParams(query).toString();
    return this.request(`/medicines/schedules/all${params ? `?${params}` : ''}`);
  }

  submitConsumptionEvent(scheduleId, eventData) {
    return this.request(`/medicines/schedules/${scheduleId}/consumption-event`, {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
  }

  refuseMedicine(scheduleId, reason) {
    return this.request(`/medicines/schedules/${scheduleId}/refuse`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  respondToCall(scheduleId, data) {
    return this.request(`/medicines/schedules/${scheduleId}/call-respond`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  markMedicineTaken(scheduleId) {
    // Prohibited manual take endpoint - will return 403 on backend
    return this.request(`/medicines/schedules/${scheduleId}/take`, { method: 'POST' });
  }

  triggerWarningCall(scheduleId) {
    return this.request(`/medicines/schedules/${scheduleId}/warning-call`, { method: 'POST' });
  }

  getAlertHistory() {
    return this.request('/medicines/alerts/history');
  }

  getNotificationHistory() {
    return this.request('/medicines/notification-history');
  }

  reportFailedVerification(scheduleId) {
    return this.request(`/medicines/schedules/${scheduleId}/failed-verification`, { method: 'POST' });
  }

  markScheduleMissed(scheduleId) {
    return this.request(`/medicines/schedules/${scheduleId}/mark-missed`, { method: 'POST' });
  }

  skipMedicine(scheduleId, reason) {
    return this.request(`/medicines/schedules/${scheduleId}/skip`, { method: 'POST', body: JSON.stringify({ reason }) });
  }

  snoozeMedicine(scheduleId) {
    return this.request(`/medicines/schedules/${scheduleId}/remind-later`, { method: 'POST' });
  }

  getAdherence() {
    return this.request('/medicines/adherence');
  }

  testPhoneReminder(phoneNumber, medicineName) {
    return this.request('/medicines/phone-reminder/test', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, medicineName })
    });
  }

  // Health & Trends
  getVitals() {
    return this.request('/health/vitals');
  }

  getTrends(metric = '') {
    return this.request(`/health/trends${metric ? `?metric=${metric}` : ''}`);
  }

  getHistory(metricKey = '') {
    return this.request(`/health/history${metricKey ? `?metricKey=${metricKey}` : ''}`);
  }

  logManualVital(data) {
    return this.request('/health/manual-vital', { method: 'POST', body: JSON.stringify(data) });
  }

  // Timeline
  getTimeline(type = 'all') {
    return this.request(`/timeline?type=${type}`);
  }

  // CareConnect
  startCareConnect(caregiverId, medicineId, scheduleId) {
    return this.request('/careconnect/start', {
      method: 'POST',
      body: JSON.stringify({ caregiverId, medicineId, scheduleId })
    });
  }

  confirmCareConnectMedication(data) {
    return this.request('/careconnect/confirm-medication', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  endCareConnect(sessionId) {
    return this.request('/careconnect/end', {
      method: 'POST',
      body: JSON.stringify({ sessionId })
    });
  }

  getCareConnectSessions() {
    return this.request('/careconnect/sessions');
  }

  // Guardians
  getGuardians() {
    return this.request('/guardians');
  }

  addGuardian(data) {
    return this.request('/guardians', { method: 'POST', body: JSON.stringify(data) });
  }

  updateGuardian(id, data) {
    return this.request(`/guardians/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  escalateMissedMedicine(data) {
    return this.request('/guardians/escalate', { method: 'POST', body: JSON.stringify(data) });
  }

  // Emergency SOS
  getEmergencyContacts() {
    return this.request('/emergency/contacts');
  }

  triggerSos(location) {
    return this.request('/emergency/sos', { method: 'POST', body: JSON.stringify({ location }) });
  }

  // Notifications
  getNotifications() {
    return this.request('/notifications');
  }

  markNotificationRead(id) {
    return this.request(`/notifications/${id}/read`, { method: 'PUT' });
  }

  markAllNotificationsRead() {
    return this.request('/notifications/read-all', { method: 'PUT' });
  }

  // AI Copilot
  askAiCopilot(message, mode = 'simple', language = null) {
    const lang = language || localStorage.getItem('vitacare_lang') || 'en';
    return this.request('/ai/chat', { 
      method: 'POST', 
      body: JSON.stringify({ message, mode, preferred_language: lang, language: lang }) 
    });
  }

  getAiHistory() {
    return this.request('/ai/history');
  }

  clearAiHistory() {
    return this.request('/ai/history', { method: 'DELETE' });
  }

  // Demo
  loadDemoData() {
    return this.request('/demo/load-sample', { method: 'POST' });
  }

  getDemoSamples() {
    return this.request('/demo/samples');
  }

  // Admin Portal Methods (Requirements 1 & 8)
  getAdminOverview() {
    return this.request('/admin/overview');
  }

  getAdminUsers() {
    return this.request('/admin/users');
  }

  updateAdminUser(id, data) {
    return this.request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  deleteAdminUser(id) {
    return this.request(`/admin/users/${id}`, { method: 'DELETE' });
  }

  getAdminMedicines() {
    return this.request('/admin/medicines');
  }

  createAdminMedicine(data) {
    return this.request('/admin/medicines', { method: 'POST', body: JSON.stringify(data) });
  }

  updateAdminMedicine(id, data) {
    return this.request(`/admin/medicines/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  deleteAdminMedicine(id) {
    return this.request(`/admin/medicines/${id}`, { method: 'DELETE' });
  }

  getAdminSchedules(query = {}) {
    const params = new URLSearchParams(query).toString();
    return this.request(`/admin/schedules${params ? `?${params}` : ''}`);
  }

  updateAdminSchedule(id, data) {
    return this.request(`/admin/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  getAdminAlerts() {
    return this.request('/admin/alerts');
  }

  getAdminGuardians() {
    return this.request('/admin/guardians');
  }

  updateAdminGuardian(id, data) {
    return this.request(`/admin/guardians/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  getAdminReports() {
    return this.request('/admin/reports');
  }

  deleteAdminReport(id) {
    return this.request(`/admin/reports/${id}`, { method: 'DELETE' });
  }

  getAdminSettings() {
    return this.request('/admin/settings');
  }

  updateAdminSettings(data) {
    return this.request('/admin/settings', { method: 'PUT', body: JSON.stringify(data) });
  }

  // CMS Dynamic Content & Modules
  getCmsConfig() {
    return this.request('/dashboard/cms-config');
  }

  getAdminCmsModules() {
    return this.request('/admin/cms/modules');
  }

  updateAdminCmsModule(id, data) {
    return this.request(`/admin/cms/modules/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  createAdminCmsModule(data) {
    return this.request('/admin/cms/modules', { method: 'POST', body: JSON.stringify(data) });
  }

  deleteAdminCmsModule(id) {
    return this.request(`/admin/cms/modules/${id}`, { method: 'DELETE' });
  }

  getAdminCmsCards() {
    return this.request('/admin/cms/cards');
  }

  createAdminCmsCard(data) {
    return this.request('/admin/cms/cards', { method: 'POST', body: JSON.stringify(data) });
  }

  updateAdminCmsCard(id, data) {
    return this.request(`/admin/cms/cards/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  deleteAdminCmsCard(id) {
    return this.request(`/admin/cms/cards/${id}`, { method: 'DELETE' });
  }

  getAdminCmsAnnouncements() {
    return this.request('/admin/cms/announcements');
  }

  createAdminCmsAnnouncement(data) {
    return this.request('/admin/cms/announcements', { method: 'POST', body: JSON.stringify(data) });
  }

  updateAdminCmsAnnouncement(id, data) {
    return this.request(`/admin/cms/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  deleteAdminCmsAnnouncement(id) {
    return this.request(`/admin/cms/announcements/${id}`, { method: 'DELETE' });
  }

  getAdminCmsContent() {
    return this.request('/admin/cms/content');
  }

  createAdminCmsContent(data) {
    return this.request('/admin/cms/content', { method: 'POST', body: JSON.stringify(data) });
  }

  updateAdminCmsContent(id, data) {
    return this.request(`/admin/cms/content/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  deleteAdminCmsContent(id) {
    return this.request(`/admin/cms/content/${id}`, { method: 'DELETE' });
  }

  // Language Preference
  updateLanguage(language) {
    return this.request('/auth/language', { method: 'PUT', body: JSON.stringify({ language }) });
  }

  // Admin Translations
  getAdminTranslations() {
    return this.request('/admin/translations');
  }

  createAdminTranslation(data) {
    return this.request('/admin/translations', { method: 'POST', body: JSON.stringify(data) });
  }

  updateAdminTranslation(key, data) {
    return this.request(`/admin/translations/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  deleteAdminTranslation(key) {
    return this.request(`/admin/translations/${encodeURIComponent(key)}`, { method: 'DELETE' });
  }

  // Admin SMS & Guardian
  getAdminSmsTriggers() {
    return this.request('/admin/sms/triggers');
  }

  updateAdminSmsTriggers(triggers) {
    return this.request('/admin/sms/triggers', { method: 'PUT', body: JSON.stringify({ triggers }) });
  }

  getAdminSmsTemplates() {
    return this.request('/admin/sms/templates');
  }

  updateAdminSmsTemplate(id, data) {
    return this.request(`/admin/sms/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  getAdminSmsLogs(limit = 50) {
    return this.request(`/admin/sms/logs?limit=${limit}`);
  }

  sendAdminTestSms(data) {
    return this.request('/admin/sms/test', { method: 'POST', body: JSON.stringify(data) });
  }

  getAdminGuardians() {
    return this.request('/admin/guardians');
  }

  // Public Branding & Settings
  getPublicSettings() {
    return this.request('/settings/public');
  }

  // Admin Settings & Branding
  getAdminSettings() {
    return this.request('/admin/settings');
  }

  updateAdminSettings(data) {
    return this.request('/admin/settings', { method: 'PUT', body: JSON.stringify(data) });
  }

  uploadAdminLogo(formData) {
    return this.request('/admin/settings/logo', { method: 'POST', body: formData });
  }

  // Database Reset
  clearUserData() {
    return this.request('/admin/database/clear-user-data', { method: 'POST' });
  }
}

export const api = new ApiClient();
