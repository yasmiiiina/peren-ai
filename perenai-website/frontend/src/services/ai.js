import client from "./client";

export const aiApi = {
  status: async () => {
    const { data } = await client.get("/ai/status");
    return data;
  },
  analyzeScan: async (vitals) => {
    const { data } = await client.post("/ai/analyze-scan", vitals);
    return data;
  },
  analyzeBiomarkers: async (biomarkers) => {
    const { data } = await client.post("/ai/analyze-biomarkers", { biomarkers });
    return data;
  },
  getBiomarkers: async () => {
    const { data } = await client.get("/ai/biomarkers");
    return data;
  },
};
