const API_URL = import.meta.env.VITE_API_URL || "/api/v1";

export class ApiError extends Error {
  constructor(message, status, fields, code) {
    super(message);
    this.status = status;
    this.fields = fields || {};
    this.code = code;
  }
}

let onUnauthorized = null;

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

async function request(path, { method = "GET", body, token, query } = {}) {
  const qs = query ? new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== "")).toString() : "";
  const response = await fetch(`${API_URL}${path}${qs ? `?${qs}` : ""}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const mustRelogin = response.status === 401 || data?.code === "PASSWORD_CHANGE_REQUIRED";
    if (mustRelogin && token && onUnauthorized) onUnauthorized();
    throw new ApiError(data?.error || "Niečo sa pokazilo. Skús to znova.", response.status, data?.fields, data?.code);
  }
  return data;
}

async function upload(path, { token, formData }) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(data?.error || "Nahrávanie zlyhalo. Skús to znova.", response.status, data?.fields);
  }
  return data;
}

async function fetchBlob(path, token) {
  const response = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new ApiError("Nepodarilo sa načítať súbor.", response.status);
  return response.blob();
}

export const api = {
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),
  me: (token) => request("/auth/me", { token }),
  forgotPassword: (email) => request("/auth/forgot-password", { method: "POST", body: { email } }),
  resetPasswordWithLink: (resetToken, newPassword) => request("/auth/reset-password", { method: "POST", body: { token: resetToken, newPassword } }),
  changePassword: (token, currentPassword, newPassword) =>
    request("/auth/change-password", { method: "POST", token, body: { currentPassword, newPassword } }),

  listUsers: (token, query) => request("/users", { token, query }),
  listAudit: (token, query) => request("/audit", { token, query }),
  getWebStats: (token, days) => request("/stats/web", { token, query: { days } }),
  createUser: (token, data) => request("/users", { method: "POST", token, body: data }),
  updateUser: (token, id, data) => request(`/users/${id}`, { method: "PATCH", token, body: data }),
  resetPassword: (token, id) => request(`/users/${id}/reset-password`, { method: "POST", token }),

  listCustomers: (token, query) => request("/customers", { token, query }),
  listCities: (token) => request("/customers/cities", { token }),
  getCustomer: (token, id) => request(`/customers/${id}`, { token }),
  createCustomer: (token, data) => request("/customers", { method: "POST", token, body: data }),
  updateCustomer: (token, id, data) => request(`/customers/${id}`, { method: "PATCH", token, body: data }),
  deleteCustomer: (token, id) => request(`/customers/${id}`, { method: "DELETE", token }),
  exportCustomer: (token, id) => fetchBlob(`/customers/${id}/export`, token),
  getPortalAccount: (token, customerId) => request(`/customers/${customerId}/portal`, { token }),
  createPortalAccount: (token, customerId) => request(`/customers/${customerId}/portal`, { method: "POST", token }),
  resetPortalPassword: (token, customerId) => request(`/customers/${customerId}/portal/reset-password`, { method: "POST", token }),
  setPortalActive: (token, customerId, isActive) => request(`/customers/${customerId}/portal`, { method: "PATCH", token, body: { isActive } }),
  portalOverview: (token) => request("/portal/overview", { token }),
  portalRequests: (token, query) => request("/portal/requests", { token, query }),
  portalCreateRequest: (token, data) => request("/portal/requests", { method: "POST", token, body: data }),
  portalHistory: (token, query) => request("/portal/history", { token, query }),
  portalPreferences: (token, data) => request("/portal/preferences", { method: "PATCH", token, body: data }),
  portalExport: (token) => fetchBlob("/portal/export", token),
  anonymizeCustomer: (token, id) => request(`/customers/${id}/anonymize`, { method: "POST", token }),

  createGarden: (token, customerId, data) =>
    request(`/customers/${customerId}/gardens`, { method: "POST", token, body: data }),
  getGarden: (token, id) => request(`/gardens/${id}`, { token }),
  listDevices: (token, gardenId) => request(`/gardens/${gardenId}/devices`, { token }),
  createDevice: (token, gardenId, data) => request(`/gardens/${gardenId}/devices`, { method: "POST", token, body: data }),
  regenerateDeviceToken: (token, id) => request(`/devices/${id}/token`, { method: "POST", token }),
  deleteDevice: (token, id) => request(`/devices/${id}`, { method: "DELETE", token }),
  updateGarden: (token, id, data) => request(`/gardens/${id}`, { method: "PATCH", token, body: data }),
  deleteGarden: (token, id) => request(`/gardens/${id}`, { method: "DELETE", token }),

  createZone: (token, gardenId, data) => request(`/gardens/${gardenId}/zones`, { method: "POST", token, body: data }),
  updateZone: (token, gardenId, zoneId, data) =>
    request(`/gardens/${gardenId}/zones/${zoneId}`, { method: "PATCH", token, body: data }),
  deleteZone: (token, gardenId, zoneId) => request(`/gardens/${gardenId}/zones/${zoneId}`, { method: "DELETE", token }),

  getHistory: (token, gardenId) => request(`/gardens/${gardenId}/history`, { token }),
  addWorkLog: (token, gardenId, data) => request(`/gardens/${gardenId}/work-logs`, { method: "POST", token, body: data }),

  uploadGardenPhotos: (token, gardenId, files, caption) => {
    const formData = new FormData();
    for (const file of files) formData.append("photos", file);
    if (caption) formData.append("caption", caption);
    return upload(`/gardens/${gardenId}/photos`, { token, formData });
  },
  getPhotoBlob: (token, photoId) => fetchBlob(`/photos/${photoId}/file`, token),
  deletePhoto: (token, photoId) => request(`/photos/${photoId}`, { method: "DELETE", token }),

  listRequests: (token, query) => request("/requests", { token, query }),
  getRequestStats: (token) => request("/requests/stats", { token }),
  listAssignees: (token) => request("/requests/assignees", { token }),
  getRequest: (token, id) => request(`/requests/${id}`, { token }),
  createRequest: (token, data) => request("/requests", { method: "POST", token, body: data }),
  updateRequest: (token, id, data) => request(`/requests/${id}`, { method: "PATCH", token, body: data }),
  changeRequestStatus: (token, id, data) => request(`/requests/${id}/status`, { method: "POST", token, body: data }),

  getScheduleSettings: (token) => request("/schedule/settings", { token }),
  updateScheduleSettings: (token, data) => request("/schedule/settings", { method: "PUT", token, body: data }),
  getCapacity: (token, from, to) => request("/schedule/capacity", { token, query: { from, to } }),
  setDayCapacity: (token, date, data) => request(`/schedule/capacity/${date}`, { method: "PUT", token, body: data }),
  resetDayCapacity: (token, date) => request(`/schedule/capacity/${date}`, { method: "DELETE", token }),
  getPlanner: (token, type) => request("/schedule/planner", { token, query: { type } }),
  planDay: (token, data) => request("/schedule/plan-day", { method: "POST", token, body: data }),

  listAppointments: (token, from, to, technicianId) =>
    request("/appointments", { token, query: { from, to, technicianId } }),
  createAppointment: (token, data) => request("/appointments", { method: "POST", token, body: data }),
  updateAppointment: (token, id, data) => request(`/appointments/${id}`, { method: "PATCH", token, body: data }),
  cancelAppointment: (token, id, data) => request(`/appointments/${id}/cancel`, { method: "POST", token, body: data }),

  listMaterials: (token, query) => request("/materials", { token, query }),
  createMaterial: (token, data) => request("/materials", { method: "POST", token, body: data }),
  updateMaterial: (token, id, data) => request(`/materials/${id}`, { method: "PATCH", token, body: data }),
  receiveMaterial: (token, id, data) => request(`/materials/${id}/receive`, { method: "POST", token, body: data }),
  listTemplates: (token) => request("/materials/templates", { token }),
  saveTemplate: (token, data) => request("/materials/templates", { method: "POST", token, body: data }),
  deleteTemplate: (token, id) => request(`/materials/templates/${id}`, { method: "DELETE", token }),

  getVisit: (token, appointmentId) => request(`/visits/${appointmentId}`, { token }),
  completeVisit: (token, appointmentId, data) =>
    request(`/visits/${appointmentId}/complete`, { method: "POST", token, body: data }),

  getReminderSettings: (token) => request("/reminders/settings", { token }),
  updateReminderSettings: (token, data) => request("/reminders/settings", { method: "PUT", token, body: data }),
  getSeasonalCampaigns: (token) => request("/reminders/seasonal", { token }),
  getSeasonalRecipients: (token, type) => request("/reminders/seasonal/recipients", { token, query: { type } }),
  runSeasonalCampaign: (token, type) => request("/reminders/seasonal/run", { method: "POST", token, body: { type } }),
  runTomorrowReminders: (token) => request("/reminders/tomorrow/run", { method: "POST", token }),
};
