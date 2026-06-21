import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = new Error();
    customError.originalError = error;

    if (error.response) {
      if (error.response.status === 401) {
        window.dispatchEvent(new CustomEvent("auth-error"));
      }
      customError.message =
        error.response.data.detail || error.response.data.message || "Une erreur inattendue s'est produite.";
      customError.status = error.response.status;
    } else if (error.request) {
      customError.message = "Erreur réseau. Vérifiez votre connexion.";
      customError.status = 503;
    } else {
      customError.message = error.message;
      customError.status = 500;
    }

    customError.response = error.response;
    return Promise.reject(customError);
  }
);

export default apiClient;
