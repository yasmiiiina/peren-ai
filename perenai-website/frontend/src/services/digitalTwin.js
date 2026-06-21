import client from "./client";

export const digitalTwinApi = {
  process: async () => {
    const { data } = await client.post("/digital-twin/process");
    return data;
  },
  getLatest: async () => {
    const { data } = await client.get("/digital-twin/latest");
    return data;
  },
};
