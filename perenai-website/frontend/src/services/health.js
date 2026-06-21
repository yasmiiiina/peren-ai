import client from "./client";

export const healthApi = {
  latest: async () => {
    const { data } = await client.get("/health");
    return data;
  },
  history: async (limit = 60) => {
    const { data } = await client.get(`/health/history?limit=${limit}`);
    return data;
  },
  summary: async () => {
    const { data } = await client.get("/dashboard/summary");
    return data;
  },
};
