import client from "./client";

export const onboardingApi = {
  get: async () => {
    const { data } = await client.get("/onboarding");
    return data;
  },
  save: async (payload) => {
    const { data } = await client.post("/onboarding", payload);
    return data;
  },
};
