import apiClient from './client';

export const scanService = {
  saveScan: (scanData) => apiClient.post('/scans/save', scanData),
  getHistory: () => apiClient.get('/scans/history'),
};

export const paymentService = {
  initializePayment: (data) => apiClient.post("/payments/initialize", data),
  createCheckoutSession: (data) => apiClient.post("/payments/checkout", data),
  mockWebhook: (data) => apiClient.post("/payments/webhook", data),
  verifyPayPalSubscription: (data) => apiClient.post("/payments/paypal/verify", data),
};
