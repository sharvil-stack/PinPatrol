import api from "./api";

export const listReports = async () => {
  const response = await api.get("/api/reports");
  return response.data;
};

export const getReport = async (id) => {
  const response = await api.get(`/api/reports/${id}`);
  return response.data;
};

export const createReport = async ({ lat, lng, category, severity, description }) => {
  const response = await api.post("/api/reports", {
    lat,
    lng,
    category,
    severity,
    description,
  });
  return response.data;
};

export const verifyReport = async (id, verificationStatus) => {
  const response = await api.patch(`/api/reports/${id}/verify`, {
    verificationStatus,
  });
  return response.data;
};

export const updateStatus = async (id, status) => {
  const response = await api.patch(`/api/reports/${id}/status`, { status });
  return response.data;
};

// Matches ReportController's real GET /api/reports/{id}/summary, which returns
// { reportId, summary } - not a full ReportResponse.
export const getCaseSummary = async (id) => {
  const response = await api.get(`/api/reports/${id}/summary`);
  return response.data;
};

// Matches ReportController's POST /api/reports/{id}/related.
export const getRelatedReports = async (id) => {
  const response = await api.post(`/api/reports/${id}/related`);
  return response.data;
};

// Matches ReportController's GET /api/reports/nearby.
export const getNearbyReports = async (lat, lng, radiusKm = 1) => {
  const response = await api.get("/api/reports/nearby", {
    params: { lat, lng, radiusKm },
  });
  return response.data;
};