import api from "./api";

export const getStats = async () => {
  const response = await api.get("/api/dashboard/stats");
  return response.data;
};