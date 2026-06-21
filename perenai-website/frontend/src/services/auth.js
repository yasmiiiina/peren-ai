import client from "./client";

export const authApi = {
  register: async (payload) => {
    const { data } = await client.post("/auth/register", payload);
    return data;
  },
  login: async (payload) => {
    const { data } = await client.post("/auth/login", payload);
    return data;
  },
  logout: async () => {
    const { data } = await client.post("/auth/logout");
    return data;
  },
  me: async () => {
    const { data } = await client.get("/users/me");
    return data;
  },
  updateMe: async (payload) => {
    const { data } = await client.put("/users/me", payload);
    return data;
  },
};
